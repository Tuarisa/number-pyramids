/**
 * ResultModal Component
 *
 * Shows after puzzle completion:
 * - Praise message
 * - Stars earned
 * - Total stars
 * - Buttons for next puzzle or level selection
 */

import React from 'react';
import { PuzzleResult, Achievement } from '../logic/types';

interface ResultModalProps {
  result: PuzzleResult;
  totalStars: number;
  newAchievements: Achievement[];
  onNextPuzzle: () => void;
  onSelectLevel: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
  result,
  totalStars,
  newAchievements,
  onNextPuzzle,
  onSelectLevel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-pop">
        {/* Success header */}
        <div className="bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 p-6 text-center text-white">
          <div className="text-5xl mb-2">
            {result.isPerfect ? '🌟' : '👍'}
          </div>
          <h2 className="text-3xl font-bold mb-1">{result.message}</h2>
          <p className="text-green-100">
            {result.isPerfect ? 'Идеально!' : 'Хорошая работа!'}
          </p>
        </div>

        {/* Stars section */}
        <div className="p-6 text-center">
          {/* Stars earned */}
          <div className="mb-4">
            <p className="text-gray-600 mb-2">Получено звёзд:</p>
            <div className="flex justify-center gap-2">
              {Array.from({ length: result.starsEarned }, (_, index) => (
                <span
                  key={index + 1}
                  className="text-4xl text-yellow-400 scale-110 drop-shadow-lg transition-all duration-500"
                  style={{ animationDelay: `${(index + 1) * 0.2}s` }}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>

          {/* Total stars */}
          <div className="bg-yellow-50 rounded-xl p-3 mb-4">
            <p className="text-sm text-yellow-700">Всего звёзд:</p>
            <p className="text-2xl font-bold text-yellow-600">
              {totalStars} ⭐
            </p>
          </div>

          {/* New achievements */}
          {newAchievements.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-purple-700 mb-2">
                🏆 Новые достижения!
              </p>
              {newAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-center gap-2 text-purple-800"
                >
                  <span className="text-xl">{achievement.icon}</span>
                  <span className="font-bold">{achievement.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={onNextPuzzle}
              className="
                w-full py-4 px-6
                rounded-xl
                bg-gradient-to-r from-green-400 to-emerald-500
                text-white font-bold text-lg
                shadow-lg hover:shadow-xl
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                flex items-center justify-center gap-2
              "
            >
              <span>▶️</span>
              <span>Следующая задача</span>
            </button>

            <button
              onClick={onSelectLevel}
              className="
                w-full py-3 px-6
                rounded-xl
                bg-gray-100
                text-gray-700 font-medium
                transition-all duration-200
                hover:bg-gray-200
              "
            >
              Выбрать уровень
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
