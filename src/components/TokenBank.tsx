/**
 * TokenBank Component
 *
 * Displays draggable number tokens below the pyramid.
 * Supports:
 * - Touch drag-and-drop (for mobile)
 * - Mouse drag-and-drop (for desktop)
 * - Tap to select as fallback
 */

import React, { useCallback, useRef, useState } from 'react';
import { Token } from '../logic/types';

interface TokenBankProps {
  tokens: Token[];
  selectedTokenId: string | null;
  onTokenSelect: (token: Token) => void;
  onDragStart: (token: Token) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

interface TokenChipProps {
  token: Token;
  isSelected: boolean;
  onSelect: (token: Token) => void;
  onDragStart: (token: Token, element: HTMLElement, x: number, y: number) => void;
}

/**
 * Single token chip component - supports drag and tap
 */
const TokenChip: React.FC<TokenChipProps> = ({
  token,
  isSelected,
  onSelect,
  onDragStart,
}) => {
  const elementRef = useRef<HTMLButtonElement>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (token.isUsed) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = false;
  }, [token.isUsed]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (token.isUsed || !touchStartPos.current || !elementRef.current) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Start drag if moved more than 10px
    if (distance > 10 && !isDraggingRef.current) {
      isDraggingRef.current = true;
      e.preventDefault();
      onDragStart(token, elementRef.current, touch.clientX, touch.clientY);
    }
  }, [token, onDragStart]);

  const handleTouchEnd = useCallback(() => {
    // If we didn't drag, treat as tap
    if (!isDraggingRef.current && !token.isUsed) {
      onSelect(token);
    }
    touchStartPos.current = null;
    isDraggingRef.current = false;
  }, [token, onSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (token.isUsed || !elementRef.current) return;
    e.preventDefault();
    onDragStart(token, elementRef.current, e.clientX, e.clientY);
  }, [token, onDragStart]);

  const handleClick = useCallback(() => {
    if (!token.isUsed) {
      onSelect(token);
    }
  }, [token, onSelect]);

  // Base classes - large for easy interaction
  let baseClasses = `
    w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20
    rounded-2xl
    flex items-center justify-center
    text-3xl sm:text-4xl font-extrabold
    select-none
    transition-transform duration-150
    touch-none
  `;

  if (token.isUsed) {
    baseClasses += `
      bg-gray-200 text-gray-400
      border-3 border-gray-300
      opacity-40
      scale-90
    `;
  } else if (isSelected) {
    baseClasses += `
      bg-gradient-to-br from-green-400 to-green-500
      text-white
      border-4 border-green-600
      shadow-xl shadow-green-300/50
      scale-110
    `;
  } else {
    baseClasses += `
      bg-gradient-to-br from-yellow-300 to-amber-400
      text-amber-900
      border-3 border-amber-500
      shadow-lg
      cursor-grab
      active:cursor-grabbing
    `;
  }

  return (
    <button
      ref={elementRef}
      type="button"
      className={baseClasses}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      disabled={token.isUsed}
      aria-label={`Число ${token.value}${isSelected ? ', выбрано' : ''}`}
    >
      {token.value}
    </button>
  );
};

/**
 * Token bank container
 */
const TokenBank: React.FC<TokenBankProps> = ({
  tokens,
  selectedTokenId,
  onTokenSelect,
  onDragStart,
  isDragging,
}) => {
  const [dragToken, setDragToken] = useState<Token | null>(null);

  const handleDragStart = useCallback((token: Token, _element: HTMLElement, _x: number, _y: number) => {
    setDragToken(token);
    onDragStart(token);
  }, [onDragStart]);

  const unusedTokens = tokens.filter(t => !t.isUsed);
  const hasSelection = selectedTokenId !== null;

  return (
    <div className="w-full">
      {/* Instructions - context-aware */}
      <div className={`
        text-center text-base sm:text-lg font-semibold mb-3 px-4
        transition-colors duration-200
        ${isDragging ? 'text-amber-600' : hasSelection ? 'text-green-600' : 'text-primary-600'}
      `}>
        {isDragging ? (
          <span className="flex items-center justify-center gap-2">
            <span className="text-2xl">🎯</span>
            Тащи на пустую ячейку!
          </span>
        ) : hasSelection ? (
          <span className="flex items-center justify-center gap-2">
            <span className="text-2xl">👆</span>
            Нажми на пустую ячейку
          </span>
        ) : unusedTokens.length > 0 ? (
          <span className="flex items-center justify-center gap-2">
            <span className="text-2xl">✋</span>
            Перетащи число в ячейку
          </span>
        ) : (
          <span>Все числа расставлены!</span>
        )}
      </div>

      {/* Token container */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-5 p-4 sm:p-5 bg-white/60 rounded-3xl backdrop-blur-sm">
        {tokens.map((token) => (
          <TokenChip
            key={token.id}
            token={token}
            isSelected={selectedTokenId === token.id || (dragToken?.id === token.id && isDragging)}
            onSelect={onTokenSelect}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default TokenBank;
