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
import { isValueCorrect, isLineEquationValid } from './logic/validation';
import { calculateResult, updateProgress, saveLastLevel } from './logic/progress';
import { progressStorage } from './logic/storage';

// Components
import LevelSelector from './components/LevelSelector';
import ProgressPanel from './components/ProgressPanel';
import AchievementsModal from './components/AchievementsModal';
import PyramidView, { getDropTargetAtPosition } from './components/PyramidView';
import TokenBank from './components/TokenBank';
import Controls from './components/Controls';
import Header from './components/Header';
import ResultModal from './components/ResultModal';
import Toast, { ToastType } from './components/Toast';
import InstallPrompt from './components/InstallPrompt';
import DragOverlay from './components/DragOverlay';

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

  // Level 1 deferred validation: track placed values until all cells are filled
  // Map of col -> { value, tokenId }
  const [placedValues, setPlacedValues] = useState<Map<number, { value: number; tokenId: string }>>(new Map());
  const [toast, setToast] = useState<ToastState | null>(null);

  // Drag state
  const [draggedToken, setDraggedToken] = useState<Token | null>(null);

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
    setPlacedValues(new Map());
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
    setPlacedValues(new Map());
    setShowResult(false);
    setResult(null);
  }, [puzzle]);

  // Handle token selection (for tap-to-place mode)
  const handleTokenSelect = useCallback((token: Token) => {
    if (token.isUsed) return;
    setSelectedTokenId((prev) => (prev === token.id ? null : token.id));
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((token: Token) => {
    setDraggedToken(token);
    setSelectedTokenId(null); // Clear tap selection when starting drag
  }, []);

  // Handle drag end (cancel)
  const handleDragEnd = useCallback(() => {
    setDraggedToken(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((x: number, y: number) => {
    if (!puzzle || !draggedToken) {
      setDraggedToken(null);
      return;
    }

    // Find drop target at position
    const target = getDropTargetAtPosition(x, y);

    if (target) {
      // Simulate a circle click with the dragged token
      const circle = puzzle.pyramid.rows[target.row]?.[target.col];
      if (circle && circle.isEmpty) {
        // Temporarily set the token as selected and trigger placement
        const isLevel1 = puzzle.levelId === 1;

        if (isLevel1) {
          // Level 1: ALWAYS use equation-based validation (left + middle = right)
          handleLevel1Placement(target.col, draggedToken.value, draggedToken.id);
        } else {
          // Level 2, 3: validate per-cell
          handleImmediatePlacement(target.row, target.col, draggedToken.value);
        }
      }
    }

    setDraggedToken(null);
  }, [puzzle, draggedToken]);

  // Handle undo for Level 1 placed values
  const handleLevel1Undo = useCallback((col: number) => {
    if (!puzzle) return;

    const placed = placedValues.get(col);
    if (!placed) return;

    // Remove from placed values
    const newPlacedValues = new Map(placedValues);
    newPlacedValues.delete(col);
    setPlacedValues(newPlacedValues);

    // Make the cell empty again
    const updatedPuzzle = { ...puzzle };
    updatedPuzzle.pyramid = {
      ...puzzle.pyramid,
      rows: puzzle.pyramid.rows.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === 0 && ci === col) {
            return { ...c, value: 0, isEmpty: true };
          }
          return c;
        })
      ),
    };

    // Return the token
    updatedPuzzle.tokens = puzzle.tokens.map((t) =>
      t.id === placed.tokenId ? { ...t, isUsed: false } : t
    );

    setPuzzle(updatedPuzzle);
    showToast('Отменено', 'info');
  }, [puzzle, placedValues, showToast]);

  // Handle circle click (for tap-to-place mode or undo)
  const handleCircleClick = useCallback((row: number, col: number) => {
    if (!puzzle) return;

    const circle = puzzle.pyramid.rows[row]?.[col];
    if (!circle) return;

    const isLevel1 = puzzle.levelId === 1;

    // Check if this is a user-placed cell in Level 1 (for undo)
    if (isLevel1 && !circle.isEmpty && placedValues.has(col)) {
      handleLevel1Undo(col);
      return;
    }

    // Normal placement logic
    if (!selectedTokenId) return;

    const token = puzzle.tokens.find((t) => t.id === selectedTokenId);
    if (!token || token.isUsed) return;

    if (!circle.isEmpty) return;

    if (isLevel1) {
      // Level 1: validate equation (left + middle = right)
      handleLevel1Placement(col, token.value, token.id);
    } else {
      // Level 2, 3: validate per-cell
      handleImmediatePlacement(row, col, token.value);
    }

    setSelectedTokenId(null);
  }, [puzzle, selectedTokenId, placedValues, handleLevel1Undo]);

  // Level 1 placement with deferred validation
  const handleLevel1Placement = useCallback((col: number, value: number, tokenId: string) => {
    if (!puzzle) return;

    // Track this placement
    const newPlacedValues = new Map(placedValues);
    newPlacedValues.set(col, { value, tokenId });
    setPlacedValues(newPlacedValues);

    // Update visual: show number in circle (temporarily)
    const updatedPuzzle = { ...puzzle };
    updatedPuzzle.pyramid = {
      ...puzzle.pyramid,
      rows: puzzle.pyramid.rows.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === 0 && ci === col) {
            return { ...c, value, isEmpty: false };
          }
          return c;
        })
      ),
    };

    // Mark token as used
    updatedPuzzle.tokens = puzzle.tokens.map((t) =>
      t.id === tokenId ? { ...t, isUsed: true } : t
    );

    setPuzzle(updatedPuzzle);

    // Check if all Level 1 cells are now filled
    const remainingEmpty = updatedPuzzle.pyramid.rows[0].filter(c => c.isEmpty).length;

    if (remainingEmpty === 0) {
      // All cells filled - now validate the equation
      const valuesMap = new Map<number, number>();
      newPlacedValues.forEach((v, k) => valuesMap.set(k, v.value));

      const isValid = isLineEquationValid(updatedPuzzle.pyramid, valuesMap);

      if (isValid) {
        // Correct! Animate success
        setPuzzle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pyramid: {
              ...prev.pyramid,
              rows: prev.pyramid.rows.map(r =>
                r.map(c => ({ ...c, isAnimating: 'correct' as const }))
              ),
            },
          };
        });

        setTimeout(() => {
          setPuzzle(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              pyramid: {
                ...prev.pyramid,
                rows: prev.pyramid.rows.map(r =>
                  r.map(c => ({ ...c, isAnimating: null }))
                ),
              },
            };
          });
        }, 500);

        setTimeout(() => {
          handlePuzzleSolved(updatedPuzzle);
        }, 600);
      } else {
        // Wrong! Shake all cells and reset
        updatedPuzzle.wrongAttempts += 1;

        setPuzzle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            wrongAttempts: prev.wrongAttempts + 1,
            pyramid: {
              ...prev.pyramid,
              rows: prev.pyramid.rows.map(r =>
                r.map(c => ({ ...c, isAnimating: 'wrong' as const }))
              ),
            },
          };
        });

        showToast('Не сходится! Попробуй другие числа', 'error');

        // After shake animation, reset placed cells
        setTimeout(() => {
          setPuzzle(prev => {
            if (!prev) return prev;

            // Get original empty positions from placedValues
            const originalCircles = prev.pyramid.rows[0].map((c, idx) => {
              if (newPlacedValues.has(idx)) {
                // This was a user-placed cell, make it empty again
                return { ...c, value: 0, isEmpty: true, isAnimating: null };
              }
              return { ...c, isAnimating: null };
            });

            // Reset tokens that were used for placed values
            const resetTokens = prev.tokens.map(t => {
              for (const [, v] of newPlacedValues) {
                if (t.id === v.tokenId) {
                  return { ...t, isUsed: false };
                }
              }
              return t;
            });

            return {
              ...prev,
              pyramid: { rows: [originalCircles] },
              tokens: resetTokens,
            };
          });

          // Clear placed values
          setPlacedValues(new Map());
        }, 600);
      }
    }
  }, [puzzle, placedValues, showToast]);

  // Immediate validation (Level 2, 3 or Level 1 single empty)
  const handleImmediatePlacement = useCallback((row: number, col: number, value: number) => {
    if (!puzzle) return;

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

      // Mark only ONE token as used (first unused matching token)
      let tokenMarked = false;
      updatedPuzzle.tokens = puzzle.tokens.map((t) => {
        if (!tokenMarked && t.value === value && !t.isUsed) {
          tokenMarked = true;
          return { ...t, isUsed: true };
        }
        return t;
      });

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
    // Get current streak before this puzzle (for streak bonus calculation)
    const currentStreak = progress.levelStats[solvedPuzzle.levelId].currentStreak;

    const puzzleResult = calculateResult(
      solvedPuzzle.hintsUsed,
      solvedPuzzle.wrongAttempts,
      currentStreak
    );

    const { progress: updatedProgress, newAchievements: achievements } =
      updateProgress(solvedPuzzle.levelId, puzzleResult);

    setProgress(updatedProgress);
    setResult(puzzleResult);
    setNewAchievements(achievements);
    setShowResult(true);

    // Show streak bonus toast
    if (puzzleResult.streakBonus > 0) {
      setTimeout(() => {
        showToast('Бонус за серию: +1 звезда!', 'achievement');
      }, 500);
    }

    // Show achievement toast
    if (achievements.length > 0) {
      setTimeout(() => {
        showToast(`Достижение: ${achievements[0].title}!`, 'achievement');
      }, 1000);
    }
  }, [showToast, progress]);

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

    // Mark only ONE matching token as used
    let tokenMarked = false;
    updatedPuzzle.tokens = puzzle.tokens.map((t) => {
      if (!tokenMarked && t.value === hint.value && !t.isUsed) {
        tokenMarked = true;
        return { ...t, isUsed: true };
      }
      return t;
    });

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
      // Longer delay so user can see what number was placed
      setTimeout(() => {
        handlePuzzleSolved(updatedPuzzle);
      }, 1500);
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
    const isDragging = draggedToken !== null;

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
              selectedTokenValue={selectedToken?.value ?? draggedToken?.value ?? null}
              isDragging={isDragging}
              onCircleClick={handleCircleClick}
              userPlacedCols={puzzle.levelId === 1 ? placedValues : null}
            />
          </div>

          {/* Token bank */}
          <div className="w-full max-w-md">
            <TokenBank
              tokens={puzzle.tokens}
              selectedTokenId={selectedTokenId}
              onTokenSelect={handleTokenSelect}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isDragging={isDragging}
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

        {/* Drag overlay */}
        <DragOverlay
          value={draggedToken?.value ?? null}
          onDrop={handleDrop}
          onCancel={handleDragEnd}
        />
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
