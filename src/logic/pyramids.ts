/**
 * Puzzle Generation for Number Pyramids
 *
 * Generation approach for each level:
 *
 * Level 1 (Lines):
 * - Generate 3 numbers where left + middle = right
 * - Randomly hide 1-2 of them
 * - The remaining visible numbers must allow solving
 *
 * Level 2 (3-row pyramids):
 * - Start from bottom row (3 numbers)
 * - Calculate middle row (2 numbers) by summing pairs
 * - Calculate top (1 number) by summing middle row
 * - Randomly select which circles to hide
 * - Ensure puzzle is solvable (enough info to deduce all)
 *
 * Level 3 (4-row pyramids):
 * - Same as Level 2 but with 4 rows (4-3-2-1)
 * - More hiding options for increased difficulty
 *
 * Key constraint: All numbers must stay within [minNumber, maxNumber]
 */

import {
  Pyramid,
  Circle,
  Token,
  PuzzleState,
  LevelId,
  LevelConfig,
  LEVEL_CONFIGS,
} from './types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate unique ID for tokens
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ============================================================================
// LEVEL 1: LINE PYRAMIDS
// ============================================================================

/**
 * Generate a line puzzle (3 circles: a + b = c)
 *
 * We have equation: left + middle = right
 * Need to hide 1-2 numbers while keeping puzzle solvable
 */
function generateLinePuzzle(config: LevelConfig): { pyramid: Pyramid; correctAnswers: number[] } {
  const { minNumber, maxNumber, minEmpty, maxEmpty } = config;

  // Generate valid equation: a + b = c where all are in range
  let a: number, b: number, c: number;

  do {
    // Generate a and b such that their sum is within range
    a = randomInt(minNumber, Math.floor(maxNumber / 2));
    b = randomInt(minNumber, maxNumber - a);
    c = a + b;
  } while (c > maxNumber);

  // Create circles with all values
  const values = [a, b, c];

  // Decide which to hide (1 or 2)
  const numEmpty = randomInt(minEmpty, Math.min(maxEmpty, 2));

  // Valid hiding patterns that keep puzzle solvable:
  // Hide 1: any single one (the other two determine it)
  // Hide 2: can hide a and c, or b and c, but NOT a and b (can't determine c alone)
  let hideIndices: number[];

  if (numEmpty === 1) {
    // Hide any single number
    hideIndices = [randomInt(0, 2)];
  } else {
    // Hide 2: must not hide both a and b (positions 0 and 1)
    const patterns = [
      [0, 2], // Hide a and c (knowing b)
      [1, 2], // Hide b and c (knowing a)
    ];
    hideIndices = patterns[randomInt(0, patterns.length - 1)];
  }

  // Build circles
  const circles: Circle[] = values.map((value, index) => ({
    value,
    isEmpty: hideIndices.includes(index),
  }));

  // Collect correct answers
  const correctAnswers = hideIndices.map((i) => values[i]);

  return {
    pyramid: { rows: [circles] },
    correctAnswers,
  };
}

// ============================================================================
// LEVEL 2 & 3: TRIANGLE PYRAMIDS
// ============================================================================

/**
 * Generate a triangle pyramid
 *
 * Structure (example for 3 rows):
 *   Row 0:    [top]
 *   Row 1:   [a] [b]
 *   Row 2: [c] [d] [e]
 *
 * Sum rule: each circle = sum of two below
 * top = a + b
 * a = c + d
 * b = d + e
 *
 * We generate from bottom up, then hide some circles
 */
function generateTrianglePuzzle(config: LevelConfig): { pyramid: Pyramid; correctAnswers: number[] } {
  const { minNumber, maxNumber, numRows, minEmpty, maxEmpty } = config;

  // Generate bottom row first, then calculate upward
  const rows: number[][] = [];

  // Bottom row has numRows circles
  const bottomRowSize = numRows;

  // We need to ensure all calculated values stay in range
  // Strategy: generate small-ish bottom numbers so sums don't overflow
  // The max value at top can be sum of all bottom (in worst case)
  // For safety, limit bottom numbers

  let attempts = 0;
  let validPyramid = false;

  while (!validPyramid && attempts < 100) {
    attempts++;
    rows.length = 0;

    // Calculate max value for bottom row to keep sums in range
    // Top value ≈ 2^(numRows-1) * avg(bottom) for extreme cases
    // Be conservative: limit bottom values
    const maxBottomValue = Math.floor(maxNumber / numRows);

    // Generate bottom row
    const bottomRow: number[] = [];
    for (let i = 0; i < bottomRowSize; i++) {
      bottomRow.push(randomInt(minNumber, maxBottomValue));
    }
    rows.push(bottomRow);

    // Calculate each row above by summing adjacent pairs
    validPyramid = true;
    for (let r = 1; r < numRows; r++) {
      const prevRow = rows[r - 1];
      const newRow: number[] = [];

      for (let i = 0; i < prevRow.length - 1; i++) {
        const sum = prevRow[i] + prevRow[i + 1];
        if (sum > maxNumber) {
          validPyramid = false;
          break;
        }
        newRow.push(sum);
      }

      if (!validPyramid) break;
      rows.push(newRow);
    }
  }

  // Reverse rows so row[0] is top (1 element), row[n-1] is bottom
  rows.reverse();

  // Now select which circles to hide
  // We need to ensure puzzle is solvable

  // Build list of all positions as [row, col]
  const allPositions: [number, number][] = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      allPositions.push([r, c]);
    }
  }

  // Determine number of empty circles
  const totalCircles = allPositions.length;
  const numEmpty = randomInt(
    Math.min(minEmpty, totalCircles - 1),
    Math.min(maxEmpty, totalCircles - 1)
  );

  // Select positions to hide using solvability check
  const hidePositions = selectSolvableHiddenPositions(rows, numEmpty);

  // Build pyramid circles
  const pyramidRows: Circle[][] = rows.map((row, r) =>
    row.map((value, c) => ({
      value,
      isEmpty: hidePositions.some(([hr, hc]) => hr === r && hc === c),
    }))
  );

  // Collect correct answers
  const correctAnswers = hidePositions.map(([r, c]) => rows[r][c]);

  return {
    pyramid: { rows: pyramidRows },
    correctAnswers,
  };
}

/**
 * Select positions to hide while keeping puzzle solvable
 *
 * A puzzle is solvable if you can determine all values using:
 * - Known values
 * - The sum rule (parent = left_child + right_child)
 *
 * Strategy: iteratively try to hide random positions and check solvability
 */
function selectSolvableHiddenPositions(
  rows: number[][],
  targetCount: number
): [number, number][] {
  const hidden: [number, number][] = [];

  // Build list of all positions
  const allPositions: [number, number][] = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      allPositions.push([r, c]);
    }
  }

  // Shuffle and try to hide each
  const shuffled = shuffle(allPositions);

  for (const pos of shuffled) {
    if (hidden.length >= targetCount) break;

    // Temporarily add this position to hidden
    const testHidden = [...hidden, pos];

    // Check if still solvable
    if (isPuzzleSolvable(rows, testHidden)) {
      hidden.push(pos);
    }
  }

  return hidden;
}

/**
 * Check if a puzzle is solvable given hidden positions
 *
 * Uses constraint propagation:
 * - Start with known values
 * - Repeatedly try to deduce unknown values using sum rule
 * - If all unknowns can be determined, puzzle is solvable
 */
function isPuzzleSolvable(rows: number[][], hidden: [number, number][]): boolean {
  const numRows = rows.length;

  // Create a map of known values
  const known = new Map<string, number>();
  const unknown = new Set<string>();

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const key = `${r},${c}`;
      const isHidden = hidden.some(([hr, hc]) => hr === r && hc === c);
      if (isHidden) {
        unknown.add(key);
      } else {
        known.set(key, rows[r][c]);
      }
    }
  }

  // Constraint propagation loop
  let changed = true;
  while (changed && unknown.size > 0) {
    changed = false;

    for (const key of unknown) {
      const [r, c] = key.split(',').map(Number);

      // Try to deduce using sum rule

      // Rule 1: parent = left + right
      // If we're a parent (not bottom row), we can be deduced from children
      if (r < numRows - 1) {
        const leftKey = `${r + 1},${c}`;
        const rightKey = `${r + 1},${c + 1}`;

        if (known.has(leftKey) && known.has(rightKey)) {
          // Can deduce this value
          known.set(key, known.get(leftKey)! + known.get(rightKey)!);
          unknown.delete(key);
          changed = true;
          continue;
        }
      }

      // Rule 2: child = parent - sibling
      // If we're a child (not top row), we might be deduced from parent and sibling
      if (r > 0) {
        // We could be left child of parent at (r-1, c) or right child of parent at (r-1, c-1)

        // Check if we're left child
        if (c < rows[r - 1].length) {
          const parentKey = `${r - 1},${c}`;
          const siblingKey = `${r},${c + 1}`;

          if (known.has(parentKey) && known.has(siblingKey)) {
            known.set(key, known.get(parentKey)! - known.get(siblingKey)!);
            unknown.delete(key);
            changed = true;
            continue;
          }
        }

        // Check if we're right child
        if (c > 0) {
          const parentKey = `${r - 1},${c - 1}`;
          const siblingKey = `${r},${c - 1}`;

          if (known.has(parentKey) && known.has(siblingKey)) {
            known.set(key, known.get(parentKey)! - known.get(siblingKey)!);
            unknown.delete(key);
            changed = true;
            continue;
          }
        }
      }
    }
  }

  return unknown.size === 0;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate token bank with correct answers and distractors
 */
function generateTokens(
  correctAnswers: number[],
  config: LevelConfig
): Token[] {
  const { minNumber, maxNumber, minDistractors, maxDistractors } = config;

  // Start with correct answers
  const tokenValues = [...correctAnswers];

  // Add distractors
  const numDistractors = randomInt(minDistractors, maxDistractors);
  const existingValues = new Set(tokenValues);

  for (let i = 0; i < numDistractors; i++) {
    let distractor: number;
    let attempts = 0;

    // Generate unique distractor not in correct answers
    do {
      distractor = randomInt(minNumber, maxNumber);
      attempts++;
    } while (existingValues.has(distractor) && attempts < 50);

    if (!existingValues.has(distractor)) {
      tokenValues.push(distractor);
      existingValues.add(distractor);
    }
  }

  // Shuffle and create tokens
  const shuffled = shuffle(tokenValues);

  return shuffled.map((value) => ({
    id: generateId(),
    value,
    isUsed: false,
  }));
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate a new puzzle for the given level
 */
export function generatePuzzle(levelId: LevelId): PuzzleState {
  const config = LEVEL_CONFIGS[levelId];

  let pyramid: Pyramid;
  let correctAnswers: number[];

  if (config.numRows === 1) {
    // Level 1: Line puzzle
    const result = generateLinePuzzle(config);
    pyramid = result.pyramid;
    correctAnswers = result.correctAnswers;
  } else {
    // Level 2 & 3: Triangle pyramid
    const result = generateTrianglePuzzle(config);
    pyramid = result.pyramid;
    correctAnswers = result.correctAnswers;
  }

  const tokens = generateTokens(correctAnswers, config);

  return {
    pyramid,
    tokens,
    levelId,
    hintsUsed: 0,
    wrongAttempts: 0,
    isSolved: false,
  };
}

/**
 * Get a hint for the current puzzle
 * Returns the position and value to fill, or null if no empty circles
 */
export function getHint(puzzle: PuzzleState): { row: number; col: number; value: number } | null {
  const { pyramid } = puzzle;

  // Find first empty circle
  for (let r = 0; r < pyramid.rows.length; r++) {
    for (let c = 0; c < pyramid.rows[r].length; c++) {
      if (pyramid.rows[r][c].isEmpty) {
        return {
          row: r,
          col: c,
          value: pyramid.rows[r][c].value,
        };
      }
    }
  }

  return null;
}

/**
 * Count remaining empty circles
 */
export function countEmptyCircles(pyramid: Pyramid): number {
  let count = 0;
  for (const row of pyramid.rows) {
    for (const circle of row) {
      if (circle.isEmpty) {
        count++;
      }
    }
  }
  return count;
}
