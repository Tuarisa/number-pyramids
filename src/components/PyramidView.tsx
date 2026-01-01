/**
 * PyramidView Component
 *
 * Renders the pyramid structure (lines or triangles).
 * Optimized for touch devices and children:
 * - Large touch targets
 * - Clear visual feedback
 * - Obvious empty/filled states
 */

import React, { useCallback } from 'react';
import { Pyramid, Circle } from '../logic/types';

interface PyramidViewProps {
  pyramid: Pyramid;
  selectedTokenValue: number | null;
  onCircleClick: (row: number, col: number) => void;
}

interface CircleProps {
  circle: Circle;
  row: number;
  col: number;
  hasSelectedToken: boolean;
  onCircleClick: (row: number, col: number) => void;
}

/**
 * Single circle component - large and tappable
 */
const CircleCell: React.FC<CircleProps> = ({
  circle,
  row,
  col,
  hasSelectedToken,
  onCircleClick,
}) => {
  const handleTap = useCallback(() => {
    if (circle.isEmpty) {
      onCircleClick(row, col);
    }
  }, [circle.isEmpty, row, col, onCircleClick]);

  // Base classes - large for easy viewing and tapping
  let baseClasses = `
    w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
    rounded-full
    flex items-center justify-center
    text-2xl sm:text-3xl md:text-4xl font-extrabold
    transition-all duration-200
    select-none
    touch-manipulation
  `;

  if (circle.isEmpty) {
    // Empty circle - awaiting input
    if (hasSelectedToken) {
      // Ready to receive - highlight strongly
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
  } else {
    // Filled circle
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

  return (
    <button
      type="button"
      className={baseClasses}
      onClick={handleTap}
      disabled={!circle.isEmpty}
      aria-label={circle.isEmpty ? 'Пустая ячейка - нажми чтобы поставить число' : `Число ${circle.value}`}
    >
      {!circle.isEmpty && (
        <span className="text-primary-800">{circle.value}</span>
      )}
      {circle.isEmpty && !circle.isAnimating && (
        <span className={`text-4xl ${hasSelectedToken ? 'text-green-500' : 'text-primary-200'}`}>
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
  onCircleClick,
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
          Найди пропущенное число!
        </div>

        {/* Line of circles with operators */}
        <div className="flex items-center gap-3 sm:gap-4">
          <CircleCell
            circle={circles[0]}
            row={0}
            col={0}
            hasSelectedToken={hasSelectedToken}
            onCircleClick={onCircleClick}
          />

          <span className="text-4xl sm:text-5xl font-bold text-primary-500">+</span>

          <CircleCell
            circle={circles[1]}
            row={0}
            col={1}
            hasSelectedToken={hasSelectedToken}
            onCircleClick={onCircleClick}
          />

          <span className="text-4xl sm:text-5xl font-bold text-primary-500">=</span>

          <CircleCell
            circle={circles[2]}
            row={0}
            col={2}
            hasSelectedToken={hasSelectedToken}
            onCircleClick={onCircleClick}
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
              onCircleClick={onCircleClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default PyramidView;
