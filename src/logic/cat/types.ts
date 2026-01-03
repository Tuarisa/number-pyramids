// Cat & Tree mode types
// Comments in English per guideline

export type CatTile = 'empty' | 'cat' | 'tree' | 'snow' | 'forest' | 'hat' | 'axe';

export type CatCommand = 'up' | 'down' | 'left' | 'right';

export type CatDifficulty = 'basic' | 'advanced';

export interface CatLevel {
  id: string;
  title: string;
  size: number;
  maxSteps: number;
  grid: CatTile[][];
  difficulty: CatDifficulty;
}

export interface CatPosition {
  row: number;
  col: number;
}

export interface CatInventory {
  hat: boolean;
  axe: boolean;
}

export interface CatRuntimeLevel extends CatLevel {
  start: CatPosition;
  goal: CatPosition;
}

