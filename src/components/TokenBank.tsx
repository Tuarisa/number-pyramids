/**
 * TokenBank Component
 *
 * Displays draggable number tokens below the pyramid.
 * Supports:
 * - Drag and drop (mouse and touch)
 * - Tap to select (for easier phone use)
 */

import React, { useCallback, useState } from 'react';
import { Token } from '../logic/types';

interface TokenBankProps {
  tokens: Token[];
  selectedTokenId: string | null;
  onTokenSelect: (token: Token) => void;
  onTokenDragStart: (token: Token) => void;
}

interface TokenChipProps {
  token: Token;
  isSelected: boolean;
  onSelect: (token: Token) => void;
  onDragStart: (token: Token) => void;
}

/**
 * Single token chip component
 */
const TokenChip: React.FC<TokenChipProps> = ({
  token,
  isSelected,
  onSelect,
  onDragStart,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (token.isUsed) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('text/plain', token.value.toString());
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    onDragStart(token);
  }, [token, onDragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!token.isUsed) {
      onSelect(token);
    }
  }, [token, onSelect]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!token.isUsed) {
      // For touch devices, use tap-to-select
      e.preventDefault();
      onSelect(token);
    }
  }, [token, onSelect]);

  // Styling
  let baseClasses = `
    w-14 h-14 sm:w-16 sm:h-16
    rounded-xl
    flex items-center justify-center
    text-2xl sm:text-3xl font-bold
    transition-all duration-200
    select-none
    shadow-lg
  `;

  if (token.isUsed) {
    // Used token - grayed out
    baseClasses += `
      bg-gray-200 text-gray-400
      border-2 border-gray-300
      cursor-not-allowed
      opacity-50
    `;
  } else if (isSelected) {
    // Selected token
    baseClasses += `
      bg-yellow-400 text-yellow-900
      border-4 border-yellow-600
      cursor-grab
      scale-110
      ring-4 ring-yellow-300 ring-offset-2
      animate-pulse
    `;
  } else {
    // Available token
    baseClasses += `
      bg-gradient-to-br from-yellow-300 to-yellow-500
      text-yellow-900
      border-2 border-yellow-600
      cursor-grab
      hover:scale-105 hover:shadow-xl
      active:scale-95
    `;
  }

  if (isDragging) {
    baseClasses += ' opacity-50 scale-90';
  }

  return (
    <div
      className={baseClasses}
      draggable={!token.isUsed}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      role="button"
      aria-label={`Число ${token.value}`}
      aria-disabled={token.isUsed}
      tabIndex={token.isUsed ? -1 : 0}
    >
      {token.value}
    </div>
  );
};

/**
 * Token bank container
 */
const TokenBank: React.FC<TokenBankProps> = ({
  tokens,
  selectedTokenId,
  onTokenSelect,
  onTokenDragStart,
}) => {
  // Filter to only show unused tokens, or all if you want to show used as grayed
  const visibleTokens = tokens; // Show all tokens

  return (
    <div className="w-full">
      {/* Instructions */}
      <div className="text-center text-primary-600 text-sm sm:text-base mb-3">
        Перетащи числа в пустые ячейки или нажми, чтобы выбрать
      </div>

      {/* Token container */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 p-4 bg-white/50 rounded-2xl backdrop-blur-sm">
        {visibleTokens.map((token) => (
          <TokenChip
            key={token.id}
            token={token}
            isSelected={selectedTokenId === token.id}
            onSelect={onTokenSelect}
            onDragStart={onTokenDragStart}
          />
        ))}
      </div>

      {/* Help text for tap-to-place mode */}
      {selectedTokenId && (
        <div className="text-center text-primary-600 text-sm mt-2 animate-pulse">
          Теперь нажми на пустую ячейку, чтобы поставить число
        </div>
      )}
    </div>
  );
};

export default TokenBank;
