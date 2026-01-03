import { CatRuntimeLevel, CatTile, CatDifficulty, CatPosition } from './types';
import { isLevelSolvable } from './simulator';

type CharMap = {
  [key: string]: CatTile;
};

const CHAR_MAP: CharMap = {
  '.': 'empty',
  'C': 'cat',
  'T': 'tree',
  'S': 'snow',
  'F': 'forest',
  'H': 'hat',
  'A': 'axe',
};

function parseGrid(rows: string[], expectedSize: number, id: string): { grid: CatTile[][]; start: CatPosition; goal: CatPosition } {
  if (rows.length !== expectedSize) {
    throw new Error(`Level ${id}: grid height mismatch. Expected ${expectedSize}, got ${rows.length}`);
  }

  let start: CatPosition | null = null;
  let goal: CatPosition | null = null;

  const grid = rows.map((row, rowIndex) => {
    if (row.length !== expectedSize) {
      throw new Error(`Level ${id}: row ${rowIndex} width mismatch. Expected ${expectedSize}, got ${row.length}`);
    }

    return row.split('').map((ch, colIndex) => {
      const tile = CHAR_MAP[ch];
      if (!tile) {
        throw new Error(`Level ${id}: unknown char "${ch}" at (${rowIndex}, ${colIndex})`);
      }
      if (tile === 'cat') {
        start = { row: rowIndex, col: colIndex };
        return 'empty';
      }
      if (tile === 'tree') {
        goal = { row: rowIndex, col: colIndex };
        return 'tree';
      }
      return tile;
    });
  });

  if (!start || !goal) {
    throw new Error(`Level ${id}: missing start or goal`);
  }

  return { grid, start, goal };
}

function makeLevel(params: {
  id: string;
  title: string;
  size: number;
  maxSteps: number;
  difficulty: CatDifficulty;
  rows: string[];
}): CatRuntimeLevel {
  const { grid, start, goal } = parseGrid(params.rows, params.size, params.id);
  return {
    id: params.id,
    title: params.title,
    size: params.size,
    maxSteps: params.maxSteps,
    difficulty: params.difficulty,
    grid,
    start,
    goal,
  };
}

const BASIC_LEVELS: CatRuntimeLevel[] = [
  makeLevel({
    id: 'b1',
    title: 'Дорожка к ёлочке',
    size: 5,
    maxSteps: 12,
    difficulty: 'basic',
    rows: [
      '....T',
      '.....',
      '.....',
      '.....',
      'C....',
    ],
  }),
  makeLevel({
    id: 'b2',
    title: 'Сугробы на пути',
    size: 5,
    maxSteps: 14,
    difficulty: 'basic',
    rows: [
      '....T',
      '..S..',
      '..S..',
      '..S..',
      'C....',
    ],
  }),
  makeLevel({
    id: 'b3',
    title: 'Лесная тропа',
    size: 5,
    maxSteps: 14,
    difficulty: 'basic',
    rows: [
      '..F.T',
      '..F..',
      '..F..',
      '.....',
      'C....',
    ],
  }),
  makeLevel({
    id: 'b4',
    title: 'Снег и лес',
    size: 5,
    maxSteps: 15,
    difficulty: 'basic',
    rows: [
      '...ST',
      '.SFF.',
      '.S...',
      '.S...',
      'C....',
    ],
  }),
  makeLevel({
    id: 'b5',
    title: 'К верхней поляне',
    size: 5,
    maxSteps: 15,
    difficulty: 'basic',
    rows: [
      'T....',
      '.SSF.',
      '.F...',
      '.F...',
      '...C.',
    ],
  }),
  makeLevel({
    id: 'b6',
    title: 'Через бурелом',
    size: 5,
    maxSteps: 16,
    difficulty: 'basic',
    rows: [
      '.S..T',
      '.SFF.',
      '.....',
      '.FFF.',
      'C....',
    ],
  }),
  makeLevel({
    id: 'b7',
    title: 'Зигзаг к ёлке',
    size: 5,
    maxSteps: 16,
    difficulty: 'basic',
    rows: [
      '..T..',
      '.S.S.',
      '.FFF.',
      '.S.S.',
      '..C..',
    ],
  }),
  makeLevel({
    id: 'b8',
    title: 'По краю метели',
    size: 5,
    maxSteps: 17,
    difficulty: 'basic',
    rows: [
      '...ST',
      '.F.F.',
      '..S..',
      '.F.F.',
      'C....',
    ],
  }),
];

const ADVANCED_LEVELS: CatRuntimeLevel[] = [
  makeLevel({
    id: 'a1',
    title: 'Шапка от стужи',
    size: 8,
    maxSteps: 26,
    difficulty: 'advanced',
    rows: [
      '.......T',
      '........',
      '........',
      '........',
      'SSSSSSSS',
      '...H....',
      '........',
      'C.......',
    ],
  }),
  makeLevel({
    id: 'a2',
    title: 'Тропа через лес',
    size: 8,
    maxSteps: 25,
    difficulty: 'advanced',
    rows: [
      '...T....',
      '........',
      'FFFFFFFF',
      '...A....',
      '........',
      '........',
      '........',
      'C.......',
    ],
  }),
  makeLevel({
    id: 'a3',
    title: 'Снег, топор и ёлка',
    size: 8,
    maxSteps: 28,
    difficulty: 'advanced',
    rows: [
      '......T.',
      'FFFFFFFF',
      '........',
      '...A....',
      'SSSSSSSS',
      '........',
      '...H....',
      'C.......',
    ],
  }),
  makeLevel({
    id: 'a4',
    title: 'Зимняя тропинка',
    size: 8,
    maxSteps: 24,
    difficulty: 'advanced',
    rows: [
      '..T.....',
      '.S..F...',
      '.S..F...',
      '.S..F...',
      '.S..F...',
      '.H..A...',
      '........',
      'C.......',
    ],
  }),
  makeLevel({
    id: 'a5',
    title: 'Двойной рубеж',
    size: 8,
    maxSteps: 30,
    difficulty: 'advanced',
    rows: [
      'T.......',
      'SSSSSSSS',
      '........',
      'FFFFFFFF',
      '....A...',
      '........',
      '...H....',
      'C.......',
    ],
  }),
  makeLevel({
    id: 'a6',
    title: 'Сугробы и чаща',
    size: 8,
    maxSteps: 27,
    difficulty: 'advanced',
    rows: [
      '....T...',
      '...S....',
      '....S...',
      'FFF.FFF.',
      '...A.H..',
      '.S...S..',
      '........',
      'C.......',
    ],
  }),
  makeLevel({
    id: 'a7',
    title: 'Снежное кольцо',
    size: 8,
    maxSteps: 28,
    difficulty: 'advanced',
    rows: [
      '....T...',
      '.SSSSS..',
      '.S...S..',
      '.S.H.S..',
      '.S...S..',
      '.SSSSS..',
      '...A....',
      'C.......',
    ],
  }),
  makeLevel({
    id: 'a8',
    title: 'Лесная стража',
    size: 8,
    maxSteps: 30,
    difficulty: 'advanced',
    rows: [
      '...T....',
      'FFFFFFFF',
      '.S....S.',
      '.S.A..S.',
      '.S....S.',
      '.SSSSSS.',
      '...H....',
      'C.......',
    ],
  }),
];

export const CAT_LEVELS: CatRuntimeLevel[] = [...BASIC_LEVELS, ...ADVANCED_LEVELS];

if (import.meta.env.DEV) {
  CAT_LEVELS.forEach((lvl) => {
    if (!isLevelSolvable(lvl)) {
      // eslint-disable-next-line no-console
      console.warn(`Cat level ${lvl.id} may be unsolvable`);
    }
  });
}

export function getCatLevels(difficulty?: CatDifficulty): CatRuntimeLevel[] {
  if (!difficulty) return CAT_LEVELS;
  return CAT_LEVELS.filter((lvl) => lvl.difficulty === difficulty);
}

export function findCatLevel(id: string): CatRuntimeLevel | undefined {
  return CAT_LEVELS.find((lvl) => lvl.id === id);
}

