/**
 * TokenBank Component
 *
 * Displays tappable number tokens below the pyramid.
 * Optimized for touch devices and children:
 * - Large touch targets
 * - Clear visual feedback
 * - Simple tap-to-select interaction
 */

import React, { useCallback } from 'react';
import { Token } from '../logic/types';

interface TokenBankProps {
  tokens: Token[];
  selectedTokenId: string | null;
  onTokenSelect: (token: Token) => void;
}

interface TokenChipProps {
  token: Token;
  isSelected: boolean;
  onSelect: (token: Token) => void;
}

/**
 * Single token chip component - large, tappable button
 */
const TokenChip: React.FC<TokenChipProps> = ({
  token,
  isSelected,
  onSelect,
}) => {
  const handleTap = useCallback(() => {
    if (!token.isUsed) {
      onSelect(token);
    }
  }, [token, onSelect]);

  // Base classes - extra large for easy tapping
  let baseClasses = `
    w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20
    rounded-2xl
    flex items-center justify-center
    text-3xl sm:text-4xl font-extrabold
    select-none
    transition-transform duration-150
    touch-manipulation
  `;

  if (token.isUsed) {
    // Used token - clearly disabled
    baseClasses += `
      bg-gray-200 text-gray-400
      border-3 border-gray-300
      opacity-40
      scale-90
    `;
  } else if (isSelected) {
    // Selected token - very obvious selection state
    baseClasses += `
      bg-gradient-to-br from-green-400 to-green-500
      text-white
      border-4 border-green-600
      shadow-xl shadow-green-300/50
      scale-110
      animate-bounce-once
    `;
  } else {
    // Available token - inviting to tap
    baseClasses += `
      bg-gradient-to-br from-yellow-300 to-amber-400
      text-amber-900
      border-3 border-amber-500
      shadow-lg
      active:scale-95
    `;
  }

  return (
    <button
      type="button"
      className={baseClasses}
      onClick={handleTap}
      disabled={token.isUsed}
      aria-label={`Число ${token.value}${isSelected ? ', выбрано' : ''}`}
      aria-pressed={isSelected}
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
}) => {
  const hasSelection = selectedTokenId !== null;
  const unusedTokens = tokens.filter(t => !t.isUsed);

  return (
    <div className="w-full">
      {/* Instructions - context-aware */}
      <div className={`
        text-center text-base sm:text-lg font-semibold mb-3 px-4
        transition-colors duration-200
        ${hasSelection ? 'text-green-600' : 'text-primary-600'}
      `}>
        {hasSelection ? (
          <span className="flex items-center justify-center gap-2">
            <span className="text-2xl">👆</span>
            Нажми на пустую ячейку
          </span>
        ) : unusedTokens.length > 0 ? (
          <span className="flex items-center justify-center gap-2">
            <span className="text-2xl">👇</span>
            Выбери число
          </span>
        ) : (
          <span>Все числа расставлены!</span>
        )}
      </div>

      {/* Token container - larger gaps for easy tapping */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-5 p-4 sm:p-5 bg-white/60 rounded-3xl backdrop-blur-sm">
        {tokens.map((token) => (
          <TokenChip
            key={token.id}
            token={token}
            isSelected={selectedTokenId === token.id}
            onSelect={onTokenSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default TokenBank;
