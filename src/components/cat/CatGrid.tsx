import React from 'react';
import { CatPosition, CatRuntimeLevel, CatTile } from '../../logic/cat/types';

interface CatGridProps {
  level: CatRuntimeLevel;
  current: CatPosition;
  collectedItems: Set<string>;
  highlight?: CatPosition | null;
}

const TILE_ICON: Record<CatTile, string> = {
  empty: '',
  tree: '🎄',
  snow: '❄️',
  forest: '🌲',
  hat: '🧢',
  axe: '🪓',
  cat: '😺',
};

const TILE_BG: Record<CatTile, string> = {
  empty: 'bg-white',
  tree: 'bg-green-50 border-green-300',
  snow: 'bg-blue-50 border-blue-300',
  forest: 'bg-emerald-50 border-emerald-300',
  hat: 'bg-amber-50 border-amber-300',
  axe: 'bg-orange-50 border-orange-300',
  cat: 'bg-white',
};

function key(row: number, col: number) {
  return `${row},${col}`;
}

function getTile(level: CatRuntimeLevel, row: number, col: number): CatTile {
  const tile = level.grid[row]?.[col];
  return tile ?? 'empty';
}

const CatGrid: React.FC<CatGridProps> = ({ level, current, collectedItems, highlight }) => {
  return (
    <div
      className="grid gap-1 w-full"
      style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))` }}
    >
      {level.grid.map((row, r) =>
        row.map((_, c) => {
          const tile = getTile(level, r, c);
          const posKey = key(r, c);
          const isCurrent = current.row === r && current.col === c;
          const isHighlighted = !!highlight && highlight.row === r && highlight.col === c;
          const isItemPicked = collectedItems.has(posKey);

          let contentTile: CatTile = tile;
          if ((tile === 'hat' || tile === 'axe') && isItemPicked) {
            contentTile = 'empty';
          }

          const baseClasses = `
            aspect-square rounded-lg border
            flex items-center justify-center
            text-2xl sm:text-3xl font-semibold
            transition-all duration-150
            ${TILE_BG[contentTile]}
            ${isHighlighted ? 'ring-2 ring-primary-400' : ''}
          `;

          return (
            <div key={posKey} className={baseClasses}>
              {isCurrent ? '😺' : TILE_ICON[contentTile]}
            </div>
          );
        })
      )}
    </div>
  );
};

export default CatGrid;

