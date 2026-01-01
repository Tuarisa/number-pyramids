/**
 * PyramidView Component
 *
 * Renders the pyramid structure (lines or triangles).
 * Supports:
 * - Tap to place (when token selected)
 * - Drop target detection for drag-and-drop
 * - Visual feedback for drag-over state
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { Pyramid, Circle } from '../logic/types';

// Global registry of drop targets for hit testing
export interface DropTarget {
  row: number;
  col: number;
  element: HTMLElement;
}

let dropTargets: DropTarget[] = [];

export function getDropTargetAtPosition(x: number, y: number): DropTarget | null {
  for (const target of dropTargets) {
    const rect = target.element.getBoundingClientRect();
    // Add some padding for easier dropping
    const padding = 10;
    if (
      x >= rect.left - padding &&
      x <= rect.right + padding &&
      y >= rect.top - padding &&
      y <= rect.bottom + padding
    ) {
      return target;
    }
  }
  return null;
}

interface PyramidViewProps {
  pyramid: Pyramid;
  selectedTokenValue: number | null;
  isDragging: boolean;
  onCircleClick: (row: number, col: number) => void;
  userPlacedCols?: Map<number, { value: number; tokenId: string }> | null;
}

interface CircleProps {
  circle: Circle;
  row: number;
  col: number;
  hasSelectedToken: boolean;
  isDragging: boolean;
  onCircleClick: (row: number, col: number) => void;
  isUserPlaced?: boolean;
}

/**
 * Single circle component - large and tappable
 */
const CircleCell: React.FC<CircleProps> = ({
  circle,
  row,
  col,
  hasSelectedToken,
  isDragging,
  onCircleClick,
  isUserPlaced = false,
}) => {
  const elementRef = useRef<HTMLButtonElement>(null);

  // Register as drop target if empty
  useEffect(() => {
    if (circle.isEmpty && elementRef.current) {
      const target: DropTarget = {
        row,
        col,
        element: elementRef.current,
      };
      dropTargets.push(target);

      return () => {
        dropTargets = dropTargets.filter(
          (t) => !(t.row === row && t.col === col)
        );
      };
    }
  }, [circle.isEmpty, row, col]);

  const handleTap = useCallback(() => {
    // Allow click for empty cells or user-placed cells (for undo)
    if (circle.isEmpty || isUserPlaced) {
      onCircleClick(row, col);
    }
  }, [circle.isEmpty, isUserPlaced, row, col, onCircleClick]);

  // Base classes - large for easy viewing and tapping
  let baseClasses = `
    w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
    rounded-full
    flex items-center justify-center
    text-2xl sm:text-3xl md:text-4xl font-extrabold
    transition-all duration-200
    select-none
  `;

  if (circle.isEmpty) {
    // Empty circle - awaiting input
    if (isDragging) {
      // Highlight as drop target during drag
      baseClasses += `
        bg-amber-100
        border-4 border-dashed border-amber-500
        shadow-lg shadow-amber-200
        scale-105
      `;
    } else if (hasSelectedToken) {
      // Ready to receive tap
      baseClasses += `
        bg-green-100
        border-4 border-dashed border-green-500
        shadow-lg shadow-green-200
        cursor-pointer
        active:scale-95
        animate-pulse
      `;
    } else {
      // Waiting for token selection
      baseClasses += `
        bg-white
        border-4 border-dashed border-primary-300
        shadow-inner
      `;
    }
  } else if (isUserPlaced) {
    // User-placed cell - can be undone (tap to remove)
    baseClasses += `
      bg-amber-100
      border-4 border-amber-400
      shadow-lg
      cursor-pointer
      active:scale-95
    `;
  } else {
    // Filled circle (given value)
    baseClasses += `
      bg-white
      border-4 border-primary-500
      shadow-lg
    `;
  }

  // Animation classes for feedback
  if (circle.isAnimating === 'correct') {
    baseClasses += ' animate-bounce-once bg-green-300 border-green-500 border-solid';
  } else if (circle.isAnimating === 'wrong') {
    baseClasses += ' animate-shake bg-red-200 border-red-500 border-solid';
  }

  // Determine if button should be enabled
  const isClickable = circle.isEmpty || isUserPlaced;

  return (
    <button
      ref={elementRef}
      type="button"
      className={baseClasses}
      onClick={handleTap}
      disabled={!isClickable}
      data-row={row}
      data-col={col}
      aria-label={
        circle.isEmpty
          ? 'Пустая ячейка - нажми чтобы поставить число'
          : isUserPlaced
            ? `Число ${circle.value} - нажми чтобы отменить`
            : `Число ${circle.value}`
      }
    >
      {!circle.isEmpty && (
        <span className={isUserPlaced ? 'text-amber-800' : 'text-primary-800'}>
          {circle.value}
        </span>
      )}
      {circle.isEmpty && !circle.isAnimating && (
        <span className={`text-4xl ${isDragging ? 'text-amber-500' : hasSelectedToken ? 'text-green-500' : 'text-primary-200'}`}>
          ?
        </span>
      )}
    </button>
  );
};

/**
 * Main PyramidView component
 */
const PyramidView: React.FC<PyramidViewProps> = ({
  pyramid,
  selectedTokenValue,
  isDragging,
  onCircleClick,
  userPlacedCols,
}) => {
  const numRows = pyramid.rows.length;
  const isLine = numRows === 1;
  const hasSelectedToken = selectedTokenValue !== null;

  if (isLine) {
    // Line pyramid (Level 1) - horizontal equation
    const circles = pyramid.rows[0];

    return (
      <div className="flex flex-col items-center gap-4">
        {/* Equation hint */}
        <div className="text-primary-600 text-lg sm:text-xl font-bold mb-2">
          {userPlacedCols && userPlacedCols.size > 0
            ? 'Нажми на число чтобы отменить'
            : 'Найди пропущенное число!'}
        </div>

        {/* Line of circles with operators */}
        <div className="flex items-center gap-3 sm:gap-4">
          <CircleCell
            circle={circles[0]}
            row={0}
            col={0}
            hasSelectedToken={hasSelectedToken}
            isDragging={isDragging}
            onCircleClick={onCircleClick}
            isUserPlaced={userPlacedCols?.has(0) ?? false}
          />

          <span className="text-4xl sm:text-5xl font-bold text-primary-500">+</span>

          <CircleCell
            circle={circles[1]}
            row={0}
            col={1}
            hasSelectedToken={hasSelectedToken}
            isDragging={isDragging}
            onCircleClick={onCircleClick}
            isUserPlaced={userPlacedCols?.has(1) ?? false}
          />

          <span className="text-4xl sm:text-5xl font-bold text-primary-500">=</span>

          <CircleCell
            circle={circles[2]}
            row={0}
            col={2}
            hasSelectedToken={hasSelectedToken}
            isDragging={isDragging}
            onCircleClick={onCircleClick}
            isUserPlaced={userPlacedCols?.has(2) ?? false}
          />
        </div>
      </div>
    );
  }

  // Triangle pyramid (Level 2 & 3)
  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      {/* Sum rule hint */}
      <div className="text-primary-600 text-base sm:text-lg font-bold mb-2 text-center px-4">
        Число сверху = сумма двух снизу
      </div>

      {pyramid.rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4"
        >
          {row.map((circle, colIndex) => (
            <CircleCell
              key={`${rowIndex}-${colIndex}`}
              circle={circle}
              row={rowIndex}
              col={colIndex}
              hasSelectedToken={hasSelectedToken}
              isDragging={isDragging}
              onCircleClick={onCircleClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default PyramidView;
