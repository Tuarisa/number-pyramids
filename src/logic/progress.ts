/**
 * Progress and Reward System
 *
 * Reward logic:
 * - Base: 3 stars
 * - Each hint used: -1 star
 * - Each wrong attempt: -1 star
 * - Minimum: 1 star
 * - Streak bonus: +1 star for every 5 perfect solves in a row
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
 * Stars = max(1, 3 - hints - wrongAttempts) + streakBonus
 */
const BASE_STARS = 3;
const MIN_STARS = 1;
const STREAK_BONUS_INTERVAL = 5; // Bonus star every 5 perfect solves

/**
 * Calculate puzzle result after solving
 * @param currentStreak - streak BEFORE this puzzle (to calculate bonus)
 */
export function calculateResult(
  hintsUsed: number,
  wrongAttempts: number,
  currentStreak: number = 0
): PuzzleResult {
  const isPerfect = hintsUsed === 0 && wrongAttempts === 0;

  // Base stars minus penalties
  let starsEarned = Math.max(MIN_STARS, BASE_STARS - hintsUsed - wrongAttempts);

  // Streak bonus: +1 star when completing a streak of 5 perfect solves
  let streakBonus = 0;
  if (isPerfect) {
    const newStreak = currentStreak + 1;
    if (newStreak > 0 && newStreak % STREAK_BONUS_INTERVAL === 0) {
      streakBonus = 1;
      starsEarned += streakBonus;
    }
  }

  // Random praise message
  const message = PRAISE_MESSAGES[
    Math.floor(Math.random() * PRAISE_MESSAGES.length)
  ];

  return {
    starsEarned,
    isPerfect,
    message,
    streakBonus,
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
