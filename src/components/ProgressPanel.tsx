/**
 * ProgressPanel Component
 *
 * Shows player's progress:
 * - Total stars collected
 * - Per-level statistics
 */

import React from 'react';
import { Progress, LevelId, LEVEL_CONFIGS, LEVEL4_INFO } from '../logic/types';

interface ProgressPanelProps {
  progress: Progress;
}

const ProgressPanel: React.FC<ProgressPanelProps> = ({ progress }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Total stars - main highlight */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 sm:p-6 shadow-lg mb-4">
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl sm:text-5xl">⭐</span>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">
              {progress.totalStars}
            </div>
            <div className="text-sm text-yellow-100">Твои звёзды</div>
          </div>
        </div>
      </div>

      {/* Total solved */}
      <div className="bg-white/80 rounded-xl p-4 shadow mb-4">
        <div className="text-center">
          <span className="text-2xl">🎯</span>
          <span className="ml-2 text-lg font-medium text-primary-800">
            Решено задач: {progress.totalPuzzlesSolved}
          </span>
        </div>
      </div>

      {/* Per-level stats */}
      <div className="bg-white/80 rounded-xl p-4 shadow">
        <h3 className="text-sm font-medium text-gray-600 mb-3">
          Статистика по уровням
        </h3>

        <div className="space-y-2">
          {([1, 2, 3, 4] as LevelId[]).map((levelId) => {
            const stats = progress.levelStats[levelId];
            const levelName = levelId === 4
              ? LEVEL4_INFO.name.split(':')[0]
              : LEVEL_CONFIGS[levelId].name.split(':')[0];

            return (
              <div
                key={levelId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  {levelName}:
                </span>
                <span className="font-medium text-primary-700">
                  {stats.solved} задач
                  {stats.bestStreak > 0 && (
                    <span className="text-orange-500 ml-2">
                      🔥 {stats.bestStreak}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressPanel;
