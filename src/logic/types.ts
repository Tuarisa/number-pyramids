/**
 * Type definitions for Number Pyramids Trainer
 *
 * Data Structures:
 * - Pyramid: Represents the pyramid structure with circles arranged in rows
 * - Circle: Each position in the pyramid with a value and filled/empty state
 * - Token: Draggable number chip in the bank
 * - Level: Difficulty configuration
 * - Progress: User progress stored in localStorage
 */

// ============================================================================
// PYRAMID STRUCTURES
// ============================================================================

/**
 * A single circle in the pyramid
 * - value: the number (0-20)
 * - isEmpty: whether the user needs to fill this
 * - isCorrect: validation state after placement
 */
export interface Circle {
  value: number;
  isEmpty: boolean;
  isCorrect?: boolean;
  isAnimating?: 'correct' | 'wrong' | null;
}

/**
 * The pyramid structure
 * - rows: 2D array where rows[0] is the TOP (apex), rows[n-1] is the BOTTOM
 * - For Level 1 (line): single row with 3 circles
 * - For Level 2: 3 rows (1-2-3 circles top to bottom)
 * - For Level 3: 4 rows (1-2-3-4 circles top to bottom)
 */
export interface Pyramid {
  rows: Circle[][];
}

/**
 * A draggable token in the bank
 */
export interface Token {
  id: string;
  value: number;
  isUsed: boolean;
}

// ============================================================================
// LEVEL CONFIGURATION
// ============================================================================

/**
 * Difficulty level identifiers
 */
export type LevelId = 1 | 2 | 3;

/**
 * Level configuration for puzzle generation
 * TWEAK: Modify these values to adjust difficulty
 */
export interface LevelConfig {
  id: LevelId;
  name: string;
  description: string;

  // Number range constraints
  minNumber: number;      // Minimum allowed number (usually 0)
  maxNumber: number;      // Maximum allowed number (10 or 20)

  // Pyramid structure
  numRows: number;        // 1 for lines, 3 for small, 4 for large

  // Empty circles configuration
  minEmpty: number;       // Minimum empty circles
  maxEmpty: number;       // Maximum empty circles

  // Distractor tokens
  minDistractors: number; // Minimum extra wrong numbers
  maxDistractors: number; // Maximum extra wrong numbers
}

/**
 * Default level configurations
 * TWEAK: Adjust these values to change difficulty
 */
export const LEVEL_CONFIGS: Record<LevelId, LevelConfig> = {
  1: {
    id: 1,
    name: 'Уровень 1: Линии',
    description: 'Простые примеры с числами от 0 до 10',
    minNumber: 0,
    maxNumber: 10,
    numRows: 1,  // Special case: line pyramid
    minEmpty: 1,
    maxEmpty: 2,
    minDistractors: 1,
    maxDistractors: 3,
  },
  2: {
    id: 2,
    name: 'Уровень 2: Маленькие пирамиды',
    description: 'Пирамиды из 3 рядов, числа от 0 до 20',
    minNumber: 0,
    maxNumber: 20,
    numRows: 3,
    minEmpty: 2,
    maxEmpty: 3,
    minDistractors: 2,
    maxDistractors: 3,
  },
  3: {
    id: 3,
    name: 'Уровень 3: Большие пирамиды',
    description: 'Пирамиды из 4 рядов, числа от 0 до 20',
    minNumber: 0,
    maxNumber: 20,
    numRows: 4,
    minEmpty: 3,
    maxEmpty: 5,
    minDistractors: 3,
    maxDistractors: 4,
  },
};

// ============================================================================
// GAME STATE
// ============================================================================

/**
 * Current puzzle state
 */
export interface PuzzleState {
  pyramid: Pyramid;
  tokens: Token[];
  levelId: LevelId;
  hintsUsed: number;
  wrongAttempts: number;
  isSolved: boolean;
}

/**
 * Result after solving a puzzle
 */
export interface PuzzleResult {
  starsEarned: number;   // 1 or 3
  isPerfect: boolean;    // No hints, no wrong attempts
  message: string;       // Random praise in Russian
}

// ============================================================================
// PROGRESS & ACHIEVEMENTS
// ============================================================================

/**
 * Per-level statistics
 */
export interface LevelStats {
  solved: number;        // Total puzzles solved
  bestStreak: number;    // Best streak without mistakes
  currentStreak: number; // Current streak
}

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (progress: Progress) => boolean;
}

/**
 * User progress stored in localStorage
 */
export interface Progress {
  totalStars: number;
  levelStats: Record<LevelId, LevelStats>;
  unlockedAchievements: string[];
  lastSelectedLevel: LevelId;
  tutorialShown: boolean;
  totalPuzzlesSolved: number;
}

/**
 * Default initial progress
 */
export const DEFAULT_PROGRESS: Progress = {
  totalStars: 0,
  levelStats: {
    1: { solved: 0, bestStreak: 0, currentStreak: 0 },
    2: { solved: 0, bestStreak: 0, currentStreak: 0 },
    3: { solved: 0, bestStreak: 0, currentStreak: 0 },
  },
  unlockedAchievements: [],
  lastSelectedLevel: 1,
  tutorialShown: false,
  totalPuzzlesSolved: 0,
};

// ============================================================================
// ACHIEVEMENTS DEFINITIONS
// ============================================================================

/**
 * All available achievements
 * TWEAK: Add or modify achievements here
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_solve',
    title: 'Первые шаги',
    description: 'Реши свою первую задачу',
    icon: '🎯',
    condition: (p) => p.totalPuzzlesSolved >= 1,
  },
  {
    id: 'young_counter',
    title: 'Юный счётчик',
    description: 'Реши 10 задач',
    icon: '🔢',
    condition: (p) => p.totalPuzzlesSolved >= 10,
  },
  {
    id: 'pyramid_master',
    title: 'Мастер пирамид',
    description: 'Реши 30 задач',
    icon: '🏆',
    condition: (p) => p.totalPuzzlesSolved >= 30,
  },
  {
    id: 'pyramid_conqueror',
    title: 'Покоритель пирамид',
    description: 'Реши 10 задач на Уровне 3',
    icon: '⛰️',
    condition: (p) => p.levelStats[3].solved >= 10,
  },
  {
    id: 'star_collector',
    title: 'Звёздный коллекционер',
    description: 'Собери 50 звёзд',
    icon: '⭐',
    condition: (p) => p.totalStars >= 50,
  },
  {
    id: 'streak_5',
    title: 'Пятёрочка',
    description: 'Реши 5 задач подряд без ошибок',
    icon: '🔥',
    condition: (p) =>
      p.levelStats[1].bestStreak >= 5 ||
      p.levelStats[2].bestStreak >= 5 ||
      p.levelStats[3].bestStreak >= 5,
  },
  {
    id: 'streak_10',
    title: 'Десяточка',
    description: 'Реши 10 задач подряд без ошибок',
    icon: '💯',
    condition: (p) =>
      p.levelStats[1].bestStreak >= 10 ||
      p.levelStats[2].bestStreak >= 10 ||
      p.levelStats[3].bestStreak >= 10,
  },
  {
    id: 'level1_expert',
    title: 'Знаток линий',
    description: 'Реши 20 задач на Уровне 1',
    icon: '📏',
    condition: (p) => p.levelStats[1].solved >= 20,
  },
  {
    id: 'level2_expert',
    title: 'Знаток пирамидок',
    description: 'Реши 20 задач на Уровне 2',
    icon: '🔺',
    condition: (p) => p.levelStats[2].solved >= 20,
  },
];

/**
 * Random praise messages in Russian
 * TWEAK: Add more messages for variety
 */
export const PRAISE_MESSAGES: string[] = [
  'Молодец!',
  'Отлично!',
  'Так держать!',
  'Супер!',
  'Великолепно!',
  'Умница!',
  'Браво!',
  'Превосходно!',
  'Ты справился!',
  'Замечательно!',
];
