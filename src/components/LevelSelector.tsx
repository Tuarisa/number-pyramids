/**
 * LevelSelector Component
 *
 * Main menu showing difficulty level buttons.
 * Each button shows:
 * - Level name
 * - Level description
 * - Number of solved puzzles for this level
 */

import React from 'react';
import { LevelId, LEVEL_CONFIGS, LEVEL4_INFO, LEVEL5_INFO, Progress } from '../logic/types';

interface LevelSelectorProps {
  progress: Progress;
  onSelectLevel: (levelId: LevelId) => void;
}

interface LevelButtonProps {
  levelId: LevelId;
  name: string;
  description: string;
  icon: string;
  colorClasses: string;
  solvedCount: number;
  bestStreak: number;
  onClick: () => void;
}

/**
 * Level icons for visual appeal
 */
const LEVEL_ICONS: Record<LevelId, string> = {
  1: '📏',
  2: '🔺',
  3: '🏔️',
  4: '🕐',
  5: '🐱',
};

/**
 * Level colors
 */
const LEVEL_COLORS: Record<LevelId, string> = {
  1: 'from-green-400 to-green-600 hover:from-green-500 hover:to-green-700',
  2: 'from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700',
  3: 'from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700',
  4: 'from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600',
  5: 'from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
};

/**
 * Single level button component
 */
const LevelButton: React.FC<LevelButtonProps> = ({
  name,
  description,
  icon,
  colorClasses,
  solvedCount,
  bestStreak,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 sm:p-6
        rounded-2xl
        bg-gradient-to-br ${colorClasses}
        text-white
        shadow-lg hover:shadow-xl
        transform transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        flex flex-col items-start gap-2
      `}
    >
      {/* Header with icon and name */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-3xl sm:text-4xl">{icon}</span>
        <div className="flex-1 text-left">
          <h3 className="text-lg sm:text-xl font-bold">{name}</h3>
          <p className="text-sm opacity-90">{description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm opacity-90 mt-1">
        <span>Решено: {solvedCount}</span>
        {bestStreak > 0 && <span>Лучшая серия: {bestStreak}</span>}
      </div>
    </button>
  );
};

/**
 * Get level info (name, description) for any level
 */
function getLevelInfo(levelId: LevelId): { name: string; description: string } {
  if (levelId === 4) {
    return { name: LEVEL4_INFO.name, description: LEVEL4_INFO.description };
  }
  if (levelId === 5) {
    return { name: LEVEL5_INFO.name, description: LEVEL5_INFO.description };
  }
  const config = LEVEL_CONFIGS[levelId];
  return { name: config.name, description: config.description };
}

/**
 * Level selector container
 */
const LevelSelector: React.FC<LevelSelectorProps> = ({
  progress,
  onSelectLevel,
}) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-primary-800 text-center mb-6">
        Выбери уровень
      </h2>

      {([1, 2, 3, 4, 5] as LevelId[]).map((levelId) => {
        const { name, description } = getLevelInfo(levelId);
        return (
          <LevelButton
            key={levelId}
            levelId={levelId}
            name={name}
            description={description}
            icon={LEVEL_ICONS[levelId]}
            colorClasses={LEVEL_COLORS[levelId]}
            solvedCount={progress.levelStats[levelId].solved}
            bestStreak={progress.levelStats[levelId].bestStreak}
            onClick={() => onSelectLevel(levelId)}
          />
        );
      })}
    </div>
  );
};

export default LevelSelector;
