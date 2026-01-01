/**
 * Main Application Component
 *
 * Handles:
 * - Navigation between main screen and game screen
 * - Global state management
 * - Puzzle logic coordination
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LevelId,
  PuzzleState,
  Progress,
  PuzzleResult,
  Achievement,
  Token,
} from './logic/types';
import { generatePuzzle, getHint, countEmptyCircles } from './logic/pyramids';
import { isValueCorrect, isPyramidSolved } from './logic/validation';
import { calculateResult, updateProgress, saveLastLevel } from './logic/progress';
import { progressStorage } from './logic/storage';

// Components
import LevelSelector from './components/LevelSelector';
import ProgressPanel from './components/ProgressPanel';
import AchievementsModal from './components/AchievementsModal';
import PyramidView from './components/PyramidView';
import TokenBank from './components/TokenBank';
import Controls from './components/Controls';
import Header from './components/Header';
import ResultModal from './components/ResultModal';
import Toast, { ToastType } from './components/Toast';
import InstallPrompt from './components/InstallPrompt';

type Screen = 'main' | 'game';

interface ToastState {
  message: string;
  type: ToastType;
  key: number;
}

const App: React.FC = () => {
  // Navigation state
  const [screen, setScreen] = useState<Screen>('main');

  // Progress state
  const [progress, setProgress] = useState<Progress>(() => progressStorage.load());

  // Game state
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [taskNumber, setTaskNumber] = useState(1);

  // UI state
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Reload progress when coming back to main screen
  useEffect(() => {
    if (screen === 'main') {
      setProgress(progressStorage.load());
    }
  }, [screen]);

  // Show toast message
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, key: Date.now() });
  }, []);

  // Start a new game for selected level
  const startLevel = useCallback((levelId: LevelId) => {
    const newPuzzle = generatePuzzle(levelId);
    setPuzzle(newPuzzle);
    setTaskNumber(1);
    setSelectedTokenId(null);
    setShowResult(false);
    setResult(null);
    setScreen('game');
    saveLastLevel(levelId);
  }, []);

  // Generate a new puzzle for current level
  const generateNewPuzzle = useCallback(() => {
    if (!puzzle) return;

    const newPuzzle = generatePuzzle(puzzle.levelId);
    setPuzzle(newPuzzle);
    setTaskNumber((prev) => prev + 1);
    setSelectedTokenId(null);
    setShowResult(false);
    setResult(null);
  }, [puzzle]);

  // Handle token selection (for tap-to-place mode)
  const handleTokenSelect = useCallback((token: Token) => {
    if (token.isUsed) return;
    setSelectedTokenId((prev) => (prev === token.id ? null : token.id));
  }, []);

  // Handle circle click (for tap-to-place mode)
  const handleCircleClick = useCallback((row: number, col: number) => {
    if (!puzzle || !selectedTokenId) return;

    const token = puzzle.tokens.find((t) => t.id === selectedTokenId);
    if (!token || token.isUsed) return;

    // Try to place the selected token
    handlePlacement(row, col, token.value);
    setSelectedTokenId(null);
  }, [puzzle, selectedTokenId]);

  // Handle placement (from drag-drop or tap-to-place)
  const handlePlacement = useCallback((row: number, col: number, value: number) => {
    if (!puzzle) return;

    const circle = puzzle.pyramid.rows[row]?.[col];
    if (!circle || !circle.isEmpty) return;

    const correct = isValueCorrect(puzzle, row, col, value);

    if (correct) {
      // Correct placement
      const updatedPuzzle = { ...puzzle };

      // Update circle
      updatedPuzzle.pyramid = {
        ...puzzle.pyramid,
        rows: puzzle.pyramid.rows.map((r, ri) =>
          r.map((c, ci) =>
            ri === row && ci === col
              ? { ...c, isEmpty: false, isAnimating: 'correct' as const }
              : c
          )
        ),
      };

      // Mark token as used
      updatedPuzzle.tokens = puzzle.tokens.map((t) =>
        t.value === value && !t.isUsed ? { ...t, isUsed: true } : t
      );

      setPuzzle(updatedPuzzle);

      // Clear animation after delay
      setTimeout(() => {
        setPuzzle((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pyramid: {
              ...prev.pyramid,
              rows: prev.pyramid.rows.map((r, ri) =>
                r.map((c, ci) =>
                  ri === row && ci === col ? { ...c, isAnimating: null } : c
                )
              ),
            },
          };
        });
      }, 500);

      // Check if puzzle is solved
      const remainingEmpty = countEmptyCircles(updatedPuzzle.pyramid);
      if (remainingEmpty === 0) {
        // Puzzle solved!
        setTimeout(() => {
          handlePuzzleSolved(updatedPuzzle);
        }, 600);
      }
    } else {
      // Wrong placement - animate shake
      const updatedPuzzle = {
        ...puzzle,
        wrongAttempts: puzzle.wrongAttempts + 1,
        pyramid: {
          ...puzzle.pyramid,
          rows: puzzle.pyramid.rows.map((r, ri) =>
            r.map((c, ci) =>
              ri === row && ci === col
                ? { ...c, isAnimating: 'wrong' as const }
                : c
            )
          ),
        },
      };

      setPuzzle(updatedPuzzle);
      showToast('Попробуй ещё раз!', 'error');

      // Clear animation after delay
      setTimeout(() => {
        setPuzzle((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pyramid: {
              ...prev.pyramid,
              rows: prev.pyramid.rows.map((r, ri) =>
                r.map((c, ci) =>
                  ri === row && ci === col ? { ...c, isAnimating: null } : c
                )
              ),
            },
          };
        });
      }, 500);
    }
  }, [puzzle, showToast]);

  // Handle puzzle completion
  const handlePuzzleSolved = useCallback((solvedPuzzle: PuzzleState) => {
    const puzzleResult = calculateResult(
      solvedPuzzle.hintsUsed,
      solvedPuzzle.wrongAttempts
    );

    const { progress: updatedProgress, newAchievements: achievements } =
      updateProgress(solvedPuzzle.levelId, puzzleResult);

    setProgress(updatedProgress);
    setResult(puzzleResult);
    setNewAchievements(achievements);
    setShowResult(true);

    // Show achievement toast
    if (achievements.length > 0) {
      setTimeout(() => {
        showToast(`Достижение: ${achievements[0].title}!`, 'achievement');
      }, 1000);
    }
  }, [showToast]);

  // Handle hint button
  const handleHint = useCallback(() => {
    if (!puzzle) return;

    const hint = getHint(puzzle);
    if (!hint) return;

    // Apply the hint - fill in the circle
    const updatedPuzzle = { ...puzzle };
    updatedPuzzle.hintsUsed += 1;

    updatedPuzzle.pyramid = {
      ...puzzle.pyramid,
      rows: puzzle.pyramid.rows.map((r, ri) =>
        r.map((c, ci) =>
          ri === hint.row && ci === hint.col
            ? { ...c, isEmpty: false, isAnimating: 'correct' as const }
            : c
        )
      ),
    };

    // Mark matching token as used
    updatedPuzzle.tokens = puzzle.tokens.map((t) =>
      t.value === hint.value && !t.isUsed ? { ...t, isUsed: true } : t
    );

    setPuzzle(updatedPuzzle);
    showToast('Подсказка использована!', 'info');

    // Clear animation
    setTimeout(() => {
      setPuzzle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pyramid: {
            ...prev.pyramid,
            rows: prev.pyramid.rows.map((r, ri) =>
              r.map((c, ci) =>
                ri === hint.row && ci === hint.col
                  ? { ...c, isAnimating: null }
                  : c
              )
            ),
          },
        };
      });
    }, 500);

    // Check if puzzle is solved after hint
    const remainingEmpty = countEmptyCircles(updatedPuzzle.pyramid);
    if (remainingEmpty === 0) {
      setTimeout(() => {
        handlePuzzleSolved(updatedPuzzle);
      }, 600);
    }
  }, [puzzle, showToast, handlePuzzleSolved]);

  // Go back to main screen
  const goBack = useCallback(() => {
    setScreen('main');
    setPuzzle(null);
    setShowResult(false);
  }, []);

  // Render main screen
  const renderMainScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-game-bg to-orange-100 p-4 pb-20">
      <div className="max-w-lg mx-auto">
        {/* Title */}
        <div className="text-center py-6 sm:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-800 mb-2">
            🔺 Числовые пирамиды 🔺
          </h1>
          <p className="text-primary-600">
            Математический тренажёр
          </p>
        </div>

        {/* Progress panel */}
        <div className="mb-6">
          <ProgressPanel progress={progress} />
        </div>

        {/* Level selector */}
        <div className="mb-6">
          <LevelSelector progress={progress} onSelectLevel={startLevel} />
        </div>

        {/* Achievements button */}
        <button
          onClick={() => setShowAchievements(true)}
          className="
            w-full max-w-md mx-auto
            py-4 px-6
            rounded-xl
            bg-gradient-to-r from-purple-500 to-indigo-600
            text-white font-bold text-lg
            shadow-lg hover:shadow-xl
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            flex items-center justify-center gap-3
          "
        >
          <span className="text-2xl">🏆</span>
          <span>Достижения</span>
          <span className="bg-white/20 px-2 py-1 rounded-lg text-sm">
            {progress.unlockedAchievements.length}
          </span>
        </button>
      </div>
    </div>
  );

  // Render game screen
  const renderGameScreen = () => {
    if (!puzzle) return null;

    const currentStreak = progress.levelStats[puzzle.levelId].currentStreak;
    const canUseHint = countEmptyCircles(puzzle.pyramid) > 0;
    const selectedToken = puzzle.tokens.find((t) => t.id === selectedTokenId);

    return (
      <div className="min-h-screen bg-gradient-to-b from-game-bg to-orange-100 flex flex-col">
        {/* Header */}
        <Header
          levelId={puzzle.levelId}
          taskNumber={taskNumber}
          currentStreak={currentStreak}
          onBack={goBack}
        />

        {/* Main game area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          {/* Pyramid */}
          <div className="w-full max-w-md">
            <PyramidView
              pyramid={puzzle.pyramid}
              levelId={puzzle.levelId}
              selectedTokenValue={selectedToken?.value ?? null}
              onCircleClick={handleCircleClick}
              onDrop={handlePlacement}
            />
          </div>

          {/* Token bank */}
          <div className="w-full max-w-md">
            <TokenBank
              tokens={puzzle.tokens}
              selectedTokenId={selectedTokenId}
              onTokenSelect={handleTokenSelect}
              onTokenDragStart={handleTokenSelect}
            />
          </div>

          {/* Controls */}
          <div className="w-full max-w-md">
            <Controls
              onHint={handleHint}
              onNewPuzzle={generateNewPuzzle}
              hintsUsed={puzzle.hintsUsed}
              canUseHint={canUseHint}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {screen === 'main' ? renderMainScreen() : renderGameScreen()}

      {/* Modals */}
      {showAchievements && (
        <AchievementsModal
          progress={progress}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {showResult && result && (
        <ResultModal
          result={result}
          totalStars={progress.totalStars}
          newAchievements={newAchievements}
          onNextPuzzle={generateNewPuzzle}
          onSelectLevel={goBack}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* PWA install prompt */}
      <InstallPrompt />
    </>
  );
};

export default App;
