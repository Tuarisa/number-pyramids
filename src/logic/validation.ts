/**
 * Validation logic for Number Pyramids
 *
 * Handles checking if placed values are correct according to:
 * - For line puzzles: left + middle = right
 * - For triangle pyramids: parent = left_child + right_child
 */

import { Pyramid, PuzzleState } from './types';

/**
 * Check if a value placed at a position is correct
 *
 * @param puzzle - Current puzzle state
 * @param row - Row index
 * @param col - Column index
 * @param value - Value being placed
 * @returns true if the value is correct for this position
 */
export function isValueCorrect(
  puzzle: PuzzleState,
  row: number,
  col: number,
  value: number
): boolean {
  const circle = puzzle.pyramid.rows[row]?.[col];

  if (!circle) {
    return false;
  }

  // The correct value is stored in the circle's value field
  return circle.value === value;
}

/**
 * Check if the entire pyramid is solved
 * A pyramid is solved when all empty circles have been correctly filled
 */
export function isPyramidSolved(pyramid: Pyramid): boolean {
  for (const row of pyramid.rows) {
    for (const circle of row) {
      if (circle.isEmpty) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Validate the sum rule for a specific position
 * This is used for additional validation if needed
 *
 * For line puzzles: positions 0 + 1 = position 2
 * For triangles: parent at (r,c) = children at (r+1,c) + (r+1,c+1)
 */
export function validateSumRule(
  pyramid: Pyramid,
  row: number,
  col: number
): boolean {
  const numRows = pyramid.rows.length;

  // Line puzzle (single row)
  if (numRows === 1) {
    const circles = pyramid.rows[0];
    if (circles.length !== 3) return true; // Invalid structure

    const left = circles[0].value;
    const middle = circles[1].value;
    const right = circles[2].value;

    return left + middle === right;
  }

  // Triangle pyramid
  // Check if this position's value equals sum of children
  if (row < numRows - 1) {
    const parent = pyramid.rows[row][col];
    const leftChild = pyramid.rows[row + 1]?.[col];
    const rightChild = pyramid.rows[row + 1]?.[col + 1];

    if (!leftChild || !rightChild) return true; // Invalid structure

    return parent.value === leftChild.value + rightChild.value;
  }

  // Bottom row has no children to check
  return true;
}

/**
 * Get all positions that violate the sum rule
 * Useful for debugging or showing errors
 */
export function getInvalidPositions(pyramid: Pyramid): Array<{ row: number; col: number }> {
  const invalid: Array<{ row: number; col: number }> = [];
  const numRows = pyramid.rows.length;

  if (numRows === 1) {
    // Line puzzle
    const circles = pyramid.rows[0];
    if (circles.length === 3) {
      if (circles[0].value + circles[1].value !== circles[2].value) {
        invalid.push({ row: 0, col: 2 });
      }
    }
  } else {
    // Triangle pyramid
    for (let r = 0; r < numRows - 1; r++) {
      for (let c = 0; c < pyramid.rows[r].length; c++) {
        const parent = pyramid.rows[r][c];
        const leftChild = pyramid.rows[r + 1][c];
        const rightChild = pyramid.rows[r + 1][c + 1];

        if (parent.value !== leftChild.value + rightChild.value) {
          invalid.push({ row: r, col: c });
        }
      }
    }
  }

  return invalid;
}
