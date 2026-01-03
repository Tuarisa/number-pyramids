import { CatCommand, CatInventory, CatPosition, CatRuntimeLevel, CatTile } from './types';

export type CatFailReason = 'out_of_bounds' | 'snow_blocked' | 'forest_blocked' | 'incomplete';

export interface CatSimulationStep {
  index: number; // command index (0-based), -1 for initial state
  command: CatCommand | null;
  position: CatPosition;
  inventory: CatInventory;
  pickedHat?: boolean;
  pickedAxe?: boolean;
  reachedGoal: boolean;
  failReason?: CatFailReason;
}

export interface CatSimulationResult {
  steps: CatSimulationStep[];
  success: boolean;
  failReason?: CatFailReason;
  failAt?: number;
}

const DIRECTIONS: Record<CatCommand, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

function isInside(level: CatRuntimeLevel, pos: CatPosition): boolean {
  return pos.row >= 0 && pos.col >= 0 && pos.row < level.size && pos.col < level.size;
}

function resolveTile(tile: CatTile, inventory: CatInventory): { ok: boolean; failReason?: CatFailReason } {
  if (tile === 'snow' && !inventory.hat) {
    return { ok: false, failReason: 'snow_blocked' };
  }
  if (tile === 'forest' && !inventory.axe) {
    return { ok: false, failReason: 'forest_blocked' };
  }
  return { ok: true };
}

function applyTileEffects(tile: CatTile, inventory: CatInventory): { inventory: CatInventory; pickedHat: boolean; pickedAxe: boolean } {
  let pickedHat = false;
  let pickedAxe = false;
  let next = inventory;

  if (tile === 'hat' && !inventory.hat) {
    next = { ...inventory, hat: true };
    pickedHat = true;
  }
  if (tile === 'axe' && !inventory.axe) {
    next = { ...next, axe: true };
    pickedAxe = true;
  }

  return { inventory: next, pickedHat, pickedAxe };
}

export function simulateCatProgram(level: CatRuntimeLevel, commands: CatCommand[]): CatSimulationResult {
  const steps: CatSimulationStep[] = [
    {
      index: -1,
      command: null,
      position: { ...level.start },
      inventory: { hat: false, axe: false },
      reachedGoal: false,
    },
  ];

  let current: CatPosition = { ...level.start };
  let inventory: CatInventory = { hat: false, axe: false };

  for (let i = 0; i < commands.length; i += 1) {
    const command = commands[i];
    const dir = DIRECTIONS[command];
    const nextPos = { row: current.row + dir.dr, col: current.col + dir.dc };

    if (!isInside(level, nextPos)) {
      steps.push({
        index: i,
        command,
        position: nextPos,
        inventory,
        reachedGoal: false,
        failReason: 'out_of_bounds',
      });
      return { steps, success: false, failReason: 'out_of_bounds', failAt: i };
    }

    const tile = level.grid[nextPos.row][nextPos.col];
    const { ok, failReason } = resolveTile(tile, inventory);

    if (!ok) {
      steps.push({
        index: i,
        command,
        position: nextPos,
        inventory,
        reachedGoal: false,
        failReason,
      });
      return { steps, success: false, failReason, failAt: i };
    }

    const { inventory: nextInventory, pickedHat, pickedAxe } = applyTileEffects(tile, inventory);

    current = nextPos;
    inventory = nextInventory;

    const reachedGoal = tile === 'tree';

    steps.push({
      index: i,
      command,
      position: { ...current },
      inventory: { ...inventory },
      pickedHat,
      pickedAxe,
      reachedGoal,
    });

    if (reachedGoal) {
      return { steps, success: true };
    }
  }

  return { steps, success: false, failReason: 'incomplete' };
}

export function isLevelSolvable(level: CatRuntimeLevel): boolean {
  const queue: Array<{ pos: CatPosition; inventory: CatInventory }> = [
    { pos: level.start, inventory: { hat: false, axe: false } },
  ];
  const visited = new Set<string>();

  const key = (pos: CatPosition, inv: CatInventory) => `${pos.row},${pos.col},${inv.hat ? 1 : 0},${inv.axe ? 1 : 0}`;

  while (queue.length > 0) {
    const { pos, inventory } = queue.shift()!;
    const stateKey = key(pos, inventory);
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    if (pos.row === level.goal.row && pos.col === level.goal.col) {
      return true;
    }

    for (const cmd of Object.keys(DIRECTIONS) as CatCommand[]) {
      const dir = DIRECTIONS[cmd];
      const nextPos = { row: pos.row + dir.dr, col: pos.col + dir.dc };
      if (!isInside(level, nextPos)) continue;

      const tile = level.grid[nextPos.row][nextPos.col];
      const { ok } = resolveTile(tile, inventory);
      if (!ok) continue;

      const { inventory: nextInventory } = applyTileEffects(tile, inventory);
      const nextKey = key(nextPos, nextInventory);
      if (visited.has(nextKey)) continue;
      queue.push({ pos: nextPos, inventory: nextInventory });
    }
  }

  return false;
}

