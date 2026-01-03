/**
 * LocalStorage wrapper for safe JSON storage/retrieval
 *
 * Handles:
 * - JSON serialization/deserialization
 * - Error handling for corrupted data
 * - Type safety with generics
 */

const STORAGE_KEY = 'numberPyramidsProgress';

import { Progress, DEFAULT_PROGRESS } from './types';

/**
 * Generic storage utility
 */
export const storage = {
  /**
   * Get a value from localStorage
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to parse localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set a value in localStorage
   */
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to save to localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove a key from localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error);
    }
  },
};

/**
 * Progress-specific storage functions
 */
export const progressStorage = {
  /**
   * Load user progress from localStorage
   */
  load(): Progress {
    const saved = storage.get<Progress | null>(STORAGE_KEY, null);

    if (!saved) {
      return { ...DEFAULT_PROGRESS };
    }

    // Merge with defaults to handle schema updates
    return {
      ...DEFAULT_PROGRESS,
      ...saved,
      levelStats: {
        ...DEFAULT_PROGRESS.levelStats,
        ...saved.levelStats,
      },
      catProgress: {
        ...DEFAULT_PROGRESS.catProgress,
        ...(saved.catProgress ?? {}),
      },
    };
  },

  /**
   * Save user progress to localStorage
   */
  save(progress: Progress): boolean {
    return storage.set(STORAGE_KEY, progress);
  },

  /**
   * Reset all progress
   */
  reset(): void {
    storage.remove(STORAGE_KEY);
  },
};
