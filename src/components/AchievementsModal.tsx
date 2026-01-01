/**
 * AchievementsModal Component
 *
 * Modal showing all achievements:
 * - Unlocked achievements in color
 * - Locked achievements grayed out
 */

import React from 'react';
import { Achievement, Progress } from '../logic/types';
import { getAllAchievements } from '../logic/progress';

interface AchievementsModalProps {
  progress: Progress;
  onClose: () => void;
}

interface AchievementCardProps {
  achievement: Achievement & { isUnlocked: boolean };
}

/**
 * Single achievement card
 */
const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const isUnlocked = achievement.isUnlocked;

  return (
    <div
      className={`
        p-4 rounded-xl
        flex items-center gap-4
        transition-all duration-200
        ${isUnlocked
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-md'
          : 'bg-gray-100 border-2 border-gray-200 opacity-60'
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
          w-14 h-14 rounded-full
          flex items-center justify-center
          text-3xl
          ${isUnlocked
            ? 'bg-yellow-400 shadow-lg'
            : 'bg-gray-300 grayscale'
          }
        `}
      >
        {achievement.icon}
      </div>

      {/* Text content */}
      <div className="flex-1">
        <h3
          className={`
            font-bold text-lg
            ${isUnlocked ? 'text-yellow-800' : 'text-gray-500'}
          `}
        >
          {achievement.title}
        </h3>
        <p
          className={`
            text-sm
            ${isUnlocked ? 'text-yellow-700' : 'text-gray-400'}
          `}
        >
          {achievement.description}
        </p>
      </div>

      {/* Unlock indicator */}
      {isUnlocked && (
        <div className="text-2xl">✅</div>
      )}
      {!isUnlocked && (
        <div className="text-2xl">🔒</div>
      )}
    </div>
  );
};

/**
 * Achievements modal
 */
const AchievementsModal: React.FC<AchievementsModalProps> = ({
  progress,
  onClose,
}) => {
  const achievements = getAllAchievements(progress);
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Достижения</h2>
                <p className="text-sm opacity-90">
                  Открыто: {unlockedCount} / {achievements.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Achievement list */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
          {/* Show unlocked first, then locked */}
          {achievements
            .sort((a, b) => (a.isUnlocked === b.isUnlocked ? 0 : a.isUnlocked ? -1 : 1))
            .map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;
