/**
 * Controls Component
 *
 * Game control buttons:
 * - Hint button
 * - New puzzle button
 */

import React from 'react';

interface ControlsProps {
  onHint: () => void;
  onNewPuzzle: () => void;
  hintsUsed: number;
  canUseHint: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onHint,
  onNewPuzzle,
  hintsUsed,
  canUseHint,
}) => {
  return (
    <div className="flex justify-center gap-4 w-full max-w-md mx-auto">
      {/* Hint button */}
      <button
        onClick={onHint}
        disabled={!canUseHint}
        className={`
          flex-1 py-3 px-4
          rounded-xl
          font-bold text-base sm:text-lg
          transition-all duration-200
          flex items-center justify-center gap-2
          ${canUseHint
            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
        aria-label="Получить подсказку"
      >
        <span className="text-xl">💡</span>
        <span>Подсказка</span>
        {hintsUsed > 0 && (
          <span className="text-sm opacity-75">({hintsUsed})</span>
        )}
      </button>

      {/* New puzzle button */}
      <button
        onClick={onNewPuzzle}
        className="
          flex-1 py-3 px-4
          rounded-xl
          bg-gradient-to-r from-blue-400 to-indigo-500
          text-white font-bold text-base sm:text-lg
          shadow-lg hover:shadow-xl
          transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98]
          flex items-center justify-center gap-2
        "
        aria-label="Новая задача"
      >
        <span className="text-xl">🔄</span>
        <span>Новая задача</span>
      </button>
    </div>
  );
};

export default Controls;
