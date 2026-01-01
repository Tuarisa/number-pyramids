/**
 * Progress and Reward System
 *
 * Reward logic:
 * - Puzzle solved with NO hints and NO wrong attempts → 3 stars
 * - Puzzle solved with hints OR wrong attempts → 1 star
 *
 * Achievements:
 * - Checked after each puzzle completion
 * - Newly unlocked achievements are returned for display
 */

import {
  Progress,
  LevelId,
  PuzzleResult,
  Achievement,
  ACHIEVEMENTS,
  PRAISE_MESSAGES,
} from './types';
import { progressStorage } from './storage';

/**
 * Calculate reward for solving a puzzle
 *
 * TWEAK: Modify star rewards here
 * - PERFECT_REWARD: Stars for solving without any mistakes
 * - IMPERFECT_REWARD: Stars when hints/mistakes were used
 */
const PERFECT_REWARD = 3;
const IMPERFECT_REWARD = 1;

/**
 * Calculate puzzle result after solving
 */
export function calculateResult(
  hintsUsed: number,
  wrongAttempts: number
): PuzzleResult {
  const isPerfect = hintsUsed === 0 && wrongAttempts === 0;
  const starsEarned = isPerfect ? PERFECT_REWARD : IMPERFECT_REWARD;

  // Random praise message
  const message = PRAISE_MESSAGES[
    Math.floor(Math.random() * PRAISE_MESSAGES.length)
  ];

  return {
    starsEarned,
    isPerfect,
    message,
  };
}

/**
 * Update progress after solving a puzzle
 *
 * @param levelId - The level that was completed
 * @param result - The puzzle result
 * @returns Object with updated progress and newly unlocked achievements
 */
export function updateProgress(
  levelId: LevelId,
  result: PuzzleResult
): { progress: Progress; newAchievements: Achievement[] } {
  // Load current progress
  const progress = progressStorage.load();

  // Update total stars
  progress.totalStars += result.starsEarned;

  // Update total solved count
  progress.totalPuzzlesSolved += 1;

  // Update level stats
  const levelStats = progress.levelStats[levelId];
  levelStats.solved += 1;

  // Update streak
  if (result.isPerfect) {
    levelStats.currentStreak += 1;
    if (levelStats.currentStreak > levelStats.bestStreak) {
      levelStats.bestStreak = levelStats.currentStreak;
    }
  } else {
    // Reset streak on imperfect solve
    levelStats.currentStreak = 0;
  }

  // Check for newly unlocked achievements
  const newAchievements = checkNewAchievements(progress);

  // Add new achievements to unlocked list
  for (const achievement of newAchievements) {
    if (!progress.unlockedAchievements.includes(achievement.id)) {
      progress.unlockedAchievements.push(achievement.id);
    }
  }

  // Save updated progress
  progressStorage.save(progress);

  return { progress, newAchievements };
}

/**
 * Check for newly unlocked achievements
 */
export function checkNewAchievements(progress: Progress): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (progress.unlockedAchievements.includes(achievement.id)) {
      continue;
    }

    // Check condition
    if (achievement.condition(progress)) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

/**
 * Get all achievements with unlock status
 */
export function getAllAchievements(progress: Progress): Array<Achievement & { isUnlocked: boolean }> {
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    isUnlocked: progress.unlockedAchievements.includes(achievement.id),
  }));
}

/**
 * Mark tutorial as shown
 */
export function markTutorialShown(): void {
  const progress = progressStorage.load();
  progress.tutorialShown = true;
  progressStorage.save(progress);
}

/**
 * Save last selected level
 */
export function saveLastLevel(levelId: LevelId): void {
  const progress = progressStorage.load();
  progress.lastSelectedLevel = levelId;
  progressStorage.save(progress);
}

/**
 * Reset a level's current streak (called when starting a new session or after mistake)
 */
export function resetStreak(levelId: LevelId): void {
  const progress = progressStorage.load();
  progress.levelStats[levelId].currentStreak = 0;
  progressStorage.save(progress);
}
