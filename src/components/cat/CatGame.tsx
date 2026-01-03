import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CatGrid from './CatGrid';
import { CatCommand, CatDifficulty, CatRuntimeLevel } from '../../logic/cat/types';
import { findCatLevel, getCatLevels } from '../../logic/cat/levels';
import { CatFailReason, CatSimulationStep, simulateCatProgram } from '../../logic/cat/simulator';
import { CatModeProgress, Progress } from '../../logic/types';

interface CatGameProps {
  progress: Progress;
  onBack: () => void;
  onSolved: (payload: { stepsUsed: number; wrongAttempts: number; level: CatRuntimeLevel }) => void;
  onCatProgressChange: (updater: (prev: CatModeProgress) => CatModeProgress) => void;
  nextSignal: number;
}

const COMMAND_ICONS: Record<CatCommand, string> = {
  up: '⬆️',
  down: '⬇️',
  left: '⬅️',
  right: '➡️',
};

const STEP_DELAY_MS = 320;

function posKey(row: number, col: number) {
  return `${row},${col}`;
}

function failReasonText(reason: CatFailReason) {
  switch (reason) {
    case 'out_of_bounds':
      return 'Котик вышел за границы поля';
    case 'snow_blocked':
      return 'Метель не пускает без шапочки';
    case 'forest_blocked':
      return 'Лес не пройти без топора';
    case 'incomplete':
    default:
      return 'Котик не дошёл до ёлочки';
  }
}

const CatGame: React.FC<CatGameProps> = ({
  progress,
  onBack,
  onSolved,
  onCatProgressChange,
  nextSignal,
}) => {
  const initialDifficulty = progress.catProgress.lastDifficulty ?? 'basic';
  const [difficulty, setDifficulty] = useState<CatDifficulty>(initialDifficulty);

  const levels = useMemo(() => getCatLevels(difficulty), [difficulty]);

  const initialLevelId = useMemo(() => {
    const saved = progress.catProgress.lastLevelId;
    return levels.find((lvl) => lvl.id === saved)?.id ?? levels[0]?.id ?? 'b1';
  }, [levels, progress.catProgress.lastLevelId]);

  const [selectedLevelId, setSelectedLevelId] = useState<string>(initialLevelId);
  const activeLevel = useMemo(
    () => findCatLevel(selectedLevelId) ?? levels[0],
    [selectedLevelId, levels]
  );

  const [commands, setCommands] = useState<CatCommand[]>([]);
  const [simSteps, setSimSteps] = useState<CatSimulationStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(activeLevel?.start ?? { row: 0, col: 0 });
  const [inventory, setInventory] = useState({ hat: false, axe: false });
  const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'playing' | 'success' | 'fail'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [plannedFailReason, setPlannedFailReason] = useState<CatFailReason | null>(null);

  useEffect(() => {
    const exists = levels.some((lvl) => lvl.id === selectedLevelId);
    if (!exists && levels[0]) {
      setSelectedLevelId(levels[0].id);
    }
  }, [levels, selectedLevelId]);

  useEffect(() => {
    const start = activeLevel?.start ?? { row: 0, col: 0 };
    setCurrentPosition(start);
    setInventory({ hat: false, axe: false });
    setCollectedItems(new Set());
    setCommands([]);
    setSimSteps([]);
    setStepIndex(0);
    setIsPlaying(false);
    setStatus('idle');
    setMessage(null);
    setPlannedFailReason(null);
    setFailCount(0);
  }, [activeLevel]);

  useEffect(() => {
    onCatProgressChange((prev) => ({
      ...prev,
      lastDifficulty: difficulty,
      lastLevelId: activeLevel?.id ?? prev.lastLevelId,
    }));
  }, [difficulty, activeLevel, onCatProgressChange]);

  useEffect(() => {
    if (!levels.length) return;
    setSelectedLevelId((prev) => {
      const idx = levels.findIndex((lvl) => lvl.id === prev);
      const next = levels[(idx + 1) % levels.length];
      return next?.id ?? prev;
    });
  }, [nextSignal, levels]);

  useEffect(() => {
    if (!isPlaying || simSteps.length === 0) return;

    const step = simSteps[stepIndex];
    if (!step) return;

    setCurrentPosition(step.position);
    setInventory(step.inventory);
    if (step.pickedHat || step.pickedAxe) {
      setCollectedItems((prev) => {
        const next = new Set(prev);
        next.add(posKey(step.position.row, step.position.col));
        return next;
      });
    }

    const isLastStep = stepIndex >= simSteps.length - 1;
    if (step.failReason || step.reachedGoal || isLastStep) {
      setIsPlaying(false);
      const finalReason = step.failReason || plannedFailReason || (step.reachedGoal ? null : 'incomplete');
      if (finalReason) {
        setStatus('fail');
        setMessage(failReasonText(finalReason));
        setFailCount((prev) => prev + 1);
      } else {
        setStatus('success');
        setMessage('Ура! Котик успел к ёлочке 🎄');
        const stepsUsed = step.index >= 0 ? step.index + 1 : commands.length;
        const attemptsBeforeSuccess = failCount;
        onCatProgressChange((prev) => {
          const prevLevel = prev.completed[activeLevel.id];
          const best = prevLevel?.bestSteps ?? null;
          const better = best === null || stepsUsed < best;
          return {
            ...prev,
            lastDifficulty: difficulty,
            lastLevelId: activeLevel.id,
            completed: {
              ...prev.completed,
              [activeLevel.id]: {
                solved: true,
                bestSteps: better ? stepsUsed : best,
              },
            },
          };
        });
        onSolved({ stepsUsed, wrongAttempts: attemptsBeforeSuccess, level: activeLevel });
        setFailCount(0);
      }
      return;
    }

    const timer = setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, simSteps.length - 1));
    }, STEP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isPlaying, simSteps, stepIndex, plannedFailReason, commands.length, activeLevel, onSolved, onCatProgressChange, failCount, difficulty]);

  const addCommand = useCallback((cmd: CatCommand) => {
    if (isPlaying) return;
    setMessage(null);
    setCommands((prev) => {
      if (prev.length >= activeLevel.maxSteps) {
        setMessage(`Лимит команд: ${activeLevel.maxSteps}`);
        return prev;
      }
      return [...prev, cmd];
    });
  }, [isPlaying, activeLevel.maxSteps]);

  const undoCommand = useCallback(() => {
    if (isPlaying) return;
    setCommands((prev) => prev.slice(0, -1));
  }, [isPlaying]);

  const clearProgram = useCallback(() => {
    if (isPlaying) return;
    setCommands([]);
  }, [isPlaying]);

  const resetState = useCallback(() => {
    setIsPlaying(false);
    setSimSteps([]);
    setStepIndex(0);
    setCurrentPosition(activeLevel.start);
    setInventory({ hat: false, axe: false });
    setCollectedItems(new Set());
    setStatus('idle');
    setMessage(null);
    setPlannedFailReason(null);
  }, [activeLevel.start]);

  const startRun = useCallback(() => {
    if (!activeLevel) return;
    if (commands.length === 0) {
      setMessage('Сначала добавь команды стрелками');
      return;
    }
    setMessage(null);
    const result = simulateCatProgram(activeLevel, commands);
    setPlannedFailReason(result.success ? null : result.failReason ?? null);
    setSimSteps(result.steps);
    setStepIndex(0);
    setIsPlaying(true);
    setStatus('playing');
    setCurrentPosition(activeLevel.start);
    setInventory({ hat: false, axe: false });
    setCollectedItems(new Set());
  }, [activeLevel, commands]);

  const activeCommandIndex = useMemo(() => {
    const step = simSteps[stepIndex];
    if (!step || step.index < 0) return null;
    return step.index;
  }, [simSteps, stepIndex]);

  const levelStats = progress.catProgress.completed[activeLevel?.id ?? ''] ?? null;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const map: Record<string, CatCommand> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      const cmd = map[event.key];
      if (!cmd) return;
      event.preventDefault();
      addCommand(cmd);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addCommand]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg to-orange-100 flex flex-col">
      <header className="bg-white/90 backdrop-blur-sm shadow-md px-4 py-3 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="
              w-10 h-10 rounded-full
              bg-gray-100 hover:bg-gray-200
              flex items-center justify-center
              transition-colors text-lg
            "
            aria-label="Назад"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-primary-800 text-lg sm:text-xl">
              🐱 Котик и ёлочка
            </h1>
            <div className="text-sm text-gray-600">
              {activeLevel?.title ?? 'Выбери уровень'}
              {levelStats?.solved && (
                <span className="ml-2 text-green-600">
                  ✓ пройден
                  {levelStats.bestSteps !== null && ` • лучший маршрут: ${levelStats.bestSteps}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-4 py-4">
        <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="space-y-4">
            <div className="bg-white/90 rounded-2xl shadow-lg p-4">
              <div className="flex gap-2 mb-4">
                {(['basic', 'advanced'] as CatDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`
                      flex-1 py-2 px-3 rounded-xl font-semibold text-sm sm:text-base
                      transition-all duration-200
                      ${difficulty === diff
                        ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700'}
                    `}
                  >
                    {diff === 'basic' ? 'Базовый' : 'Продвинутый'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {levels.map((lvl) => {
                  const stat = progress.catProgress.completed[lvl.id];
                  const isActive = lvl.id === activeLevel?.id;
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => setSelectedLevelId(lvl.id)}
                      className={`
                        rounded-xl p-3 text-left border
                        ${isActive
                          ? 'bg-primary-50 border-primary-300 shadow'
                          : 'bg-white border-gray-200'}
                        transition-all duration-200 hover:shadow-md
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{lvl.title}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Размер: {lvl.size}×{lvl.size} • ≤ {lvl.maxSteps} шагов
                      </div>
                      {stat?.solved && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ пройден{stat.bestSteps !== null ? ` • ${stat.bestSteps} шагов` : ''}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeLevel && (
              <div className="bg-white/90 rounded-2xl shadow-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm sm:text-base">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                      Поле {activeLevel.size}×{activeLevel.size}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700">
                      Программа: {commands.length}/{activeLevel.maxSteps}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 flex items-center gap-1">
                      🧢 {inventory.hat ? 'есть' : 'нет'}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      🪓 {inventory.axe ? 'есть' : 'нет'}
                    </span>
                  </div>
                </div>

                <CatGrid
                  level={activeLevel}
                  current={currentPosition}
                  collectedItems={collectedItems}
                  highlight={null}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white/90 rounded-2xl shadow-lg p-4 space-y-3">
              <h3 className="font-bold text-primary-800">Собери программу</h3>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(COMMAND_ICONS) as CatCommand[]).map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => addCommand(cmd)}
                    disabled={isPlaying}
                    className={`
                      py-3 rounded-xl font-bold text-lg text-white
                      bg-gradient-to-r from-blue-400 to-indigo-500
                      shadow-lg hover:shadow-xl transition-all duration-200
                      hover:scale-[1.02] active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {COMMAND_ICONS[cmd]}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={startRun}
                  disabled={isPlaying || commands.length === 0}
                  className={`
                    flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold
                    text-white bg-gradient-to-r from-green-400 to-emerald-500
                    shadow-lg hover:shadow-xl transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  ▶ Старт
                </button>
                <button
                  onClick={resetState}
                  className="
                    py-3 px-4 rounded-xl font-bold
                    bg-gray-100 text-gray-700
                    transition-all duration-200
                    hover:bg-gray-200
                  "
                >
                  ⏹ Сброс
                </button>
                <button
                  onClick={undoCommand}
                  disabled={commands.length === 0 || isPlaying}
                  className="
                    py-3 px-4 rounded-xl font-bold
                    bg-gradient-to-r from-amber-400 to-orange-400
                    text-white shadow-lg hover:shadow-xl transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  ↩ Шаг назад
                </button>
                <button
                  onClick={clearProgram}
                  disabled={commands.length === 0 || isPlaying}
                  className="
                    py-3 px-4 rounded-xl font-bold
                    bg-gradient-to-r from-purple-400 to-indigo-500
                    text-white shadow-lg hover:shadow-xl transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  🧹 Очистить
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 min-h-[64px]">
                {commands.length === 0 ? (
                  <span className="text-gray-500">Программа пока пустая</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {commands.map((cmd, idx) => (
                      <span
                        key={`${cmd}-${idx}`}
                        className={`
                          px-3 py-2 rounded-lg border text-lg
                          ${activeCommandIndex === idx
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-gray-200 bg-white'}
                        `}
                      >
                        {COMMAND_ICONS[cmd]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/90 rounded-2xl shadow-lg p-4 space-y-2">
              <h3 className="font-bold text-primary-800">Статус</h3>
              <div className="text-sm text-gray-700">
                {status === 'playing' && 'Выполняем программу...'}
                {status === 'idle' && 'Готов к запуску'}
                {status === 'fail' && message}
                {status === 'success' && message}
                {!message && status === 'idle' && commands.length > 0 && (
                  <span>Нажми «Старт», чтобы проверить маршрут</span>
                )}
              </div>
              <div className="text-xs text-gray-500">Ошибок: {failCount}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CatGame;

