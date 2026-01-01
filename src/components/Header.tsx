/**
 * Header Component
 *
 * Game screen header with:
 * - Back button
 * - Level name
 * - Task number and streak info
 */

import React from 'react';
import { LevelId, LEVEL_CONFIGS } from '../logic/types';

interface HeaderProps {
  levelId: LevelId;
  taskNumber: number;
  currentStreak: number;
  onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({
  levelId,
  taskNumber,
  currentStreak,
  onBack,
}) => {
  const config = LEVEL_CONFIGS[levelId];

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-md px-4 py-3 sticky top-0 z-40">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        {/* Back button */}
        <button
          onClick={onBack}
          className="
            w-10 h-10 rounded-full
            bg-gray-100 hover:bg-gray-200
            flex items-center justify-center
            transition-colors
            text-lg
          "
          aria-label="Назад"
        >
          ←
        </button>

        {/* Level and task info */}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-primary-800 truncate">
            {config.name}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>Задача №{taskNumber}</span>
            {currentStreak > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <span>🔥</span>
                <span>серия {currentStreak}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
