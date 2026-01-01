/**
 * PyramidView Component
 *
 * Renders the pyramid structure (lines or triangles) and handles:
 * - Displaying circles with values
 * - Empty circles as drop targets
 * - Visual feedback animations (correct/wrong placement)
 * - Touch and click interactions
 */

import React, { useState, useCallback } from 'react';
import { Pyramid, Circle, LevelId } from '../logic/types';

interface PyramidViewProps {
  pyramid: Pyramid;
  levelId: LevelId;
  selectedTokenValue: number | null;
  onCircleClick: (row: number, col: number) => void;
  onDrop: (row: number, col: number, value: number) => void;
}

interface CircleProps {
  circle: Circle;
  row: number;
  col: number;
  isSelected: boolean;
  selectedTokenValue: number | null;
  onCircleClick: (row: number, col: number) => void;
  onDrop: (row: number, col: number, value: number) => void;
}

/**
 * Single circle component
 */
const CircleCell: React.FC<CircleProps> = ({
  circle,
  row,
  col,
  isSelected,
  selectedTokenValue,
  onCircleClick,
  onDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (circle.isEmpty) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, [circle.isEmpty]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (circle.isEmpty) {
      const value = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(value)) {
        onDrop(row, col, value);
      }
    }
  }, [circle.isEmpty, row, col, onDrop]);

  const handleClick = useCallback(() => {
    if (circle.isEmpty) {
      onCircleClick(row, col);
    }
  }, [circle.isEmpty, row, col, onCircleClick]);

  // Determine circle styling
  let baseClasses = `
    w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20
    rounded-full
    flex items-center justify-center
    text-2xl sm:text-3xl md:text-4xl font-bold
    transition-all duration-200
    select-none
  `;

  if (circle.isEmpty) {
    // Empty circle - awaiting input
    baseClasses += `
      bg-white border-4 border-dashed border-primary-400
      cursor-pointer hover:border-primary-600 hover:bg-primary-50
    `;

    if (isDragOver) {
      baseClasses += ' border-primary-600 bg-primary-100 scale-110';
    }

    if (isSelected && selectedTokenValue !== null) {
      baseClasses += ' ring-4 ring-primary-500 ring-offset-2 animate-pulse';
    }
  } else {
    // Filled circle
    baseClasses += `
      bg-white border-4 border-primary-500
      shadow-md
    `;
  }

  // Animation classes
  if (circle.isAnimating === 'correct') {
    baseClasses += ' animate-bounce-once bg-success-light border-success';
  } else if (circle.isAnimating === 'wrong') {
    baseClasses += ' animate-shake bg-red-100 border-red-500';
  }

  return (
    <div
      className={baseClasses}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role={circle.isEmpty ? 'button' : 'presentation'}
      aria-label={circle.isEmpty ? 'Пустая ячейка' : `Число ${circle.value}`}
      tabIndex={circle.isEmpty ? 0 : -1}
    >
      {!circle.isEmpty && (
        <span className="text-primary-800">{circle.value}</span>
      )}
      {circle.isEmpty && !circle.isAnimating && (
        <span className="text-primary-300 text-3xl">?</span>
      )}
    </div>
  );
};

/**
 * Main PyramidView component
 */
const PyramidView: React.FC<PyramidViewProps> = ({
  pyramid,
  selectedTokenValue,
  onCircleClick,
  onDrop,
}) => {
  const numRows = pyramid.rows.length;
  const isLine = numRows === 1;

  // For tap-to-place: track which circle is selected
  const [selectedCircle, setSelectedCircle] = useState<{ row: number; col: number } | null>(null);

  const handleCircleClick = useCallback((row: number, col: number) => {
    setSelectedCircle({ row, col });
    onCircleClick(row, col);
  }, [onCircleClick]);

  // Reset selection when pyramid changes
  React.useEffect(() => {
    setSelectedCircle(null);
  }, [pyramid]);

  if (isLine) {
    // Line pyramid (Level 1)
    const circles = pyramid.rows[0];

    return (
      <div className="flex flex-col items-center gap-4">
        {/* Equation hint */}
        <div className="text-primary-600 text-lg font-medium mb-2">
          ← + → = ?
        </div>

        {/* Line of circles with operators */}
        <div className="flex items-center gap-2 sm:gap-4">
          <CircleCell
            circle={circles[0]}
            row={0}
            col={0}
            isSelected={selectedCircle?.row === 0 && selectedCircle?.col === 0}
            selectedTokenValue={selectedTokenValue}
            onCircleClick={handleCircleClick}
            onDrop={onDrop}
          />

          <span className="text-3xl sm:text-4xl font-bold text-primary-600">+</span>

          <CircleCell
            circle={circles[1]}
            row={0}
            col={1}
            isSelected={selectedCircle?.row === 0 && selectedCircle?.col === 1}
            selectedTokenValue={selectedTokenValue}
            onCircleClick={handleCircleClick}
            onDrop={onDrop}
          />

          <span className="text-3xl sm:text-4xl font-bold text-primary-600">=</span>

          <CircleCell
            circle={circles[2]}
            row={0}
            col={2}
            isSelected={selectedCircle?.row === 0 && selectedCircle?.col === 2}
            selectedTokenValue={selectedTokenValue}
            onCircleClick={handleCircleClick}
            onDrop={onDrop}
          />
        </div>
      </div>
    );
  }

  // Triangle pyramid (Level 2 & 3)
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      {/* Sum rule hint */}
      <div className="text-primary-600 text-sm sm:text-base font-medium mb-2 text-center px-4">
        Каждое число сверху = сумма двух чисел снизу
      </div>

      {pyramid.rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3"
        >
          {row.map((circle, colIndex) => (
            <CircleCell
              key={`${rowIndex}-${colIndex}`}
              circle={circle}
              row={rowIndex}
              col={colIndex}
              isSelected={
                selectedCircle?.row === rowIndex &&
                selectedCircle?.col === colIndex
              }
              selectedTokenValue={selectedTokenValue}
              onCircleClick={handleCircleClick}
              onDrop={onDrop}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default PyramidView;
