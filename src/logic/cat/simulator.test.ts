import { describe, it, expect } from 'vitest';
import { simulateCatProgram, isLevelSolvable } from './simulator';
import { CAT_LEVELS } from './levels';
import { CatRuntimeLevel } from './types';

const simpleSnowLevel: CatRuntimeLevel = {
  id: 'test-snow',
  title: 'Snow gate',
  size: 3,
  maxSteps: 10,
  difficulty: 'basic',
  start: { row: 2, col: 0 },
  goal: { row: 0, col: 1 },
  grid: [
    ['empty', 'tree', 'empty'],
    ['snow', 'snow', 'snow'],
    ['empty', 'hat', 'empty'],
  ],
};

const simpleForestLevel: CatRuntimeLevel = {
  id: 'test-forest',
  title: 'Forest gate',
  size: 3,
  maxSteps: 10,
  difficulty: 'advanced',
  start: { row: 2, col: 0 },
  goal: { row: 0, col: 1 },
  grid: [
    ['empty', 'tree', 'empty'],
    ['forest', 'forest', 'forest'],
    ['empty', 'axe', 'empty'],
  ],
};

describe('simulateCatProgram', () => {
  it('fails when leaving the board', () => {
    const result = simulateCatProgram(simpleSnowLevel, ['left']);
    expect(result.success).toBe(false);
    expect(result.failReason).toBe('out_of_bounds');
  });

  it('blocks snow without hat', () => {
    const result = simulateCatProgram(simpleSnowLevel, ['up']);
    expect(result.success).toBe(false);
    expect(result.failReason).toBe('snow_blocked');
  });

  it('picks hat and passes snow', () => {
    const result = simulateCatProgram(simpleSnowLevel, ['right', 'up', 'up']);
    expect(result.success).toBe(true);
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.reachedGoal).toBe(true);
    expect(lastStep.inventory.hat).toBe(true);
  });

  it('blocks forest without axe', () => {
    const result = simulateCatProgram(simpleForestLevel, ['up']);
    expect(result.success).toBe(false);
    expect(result.failReason).toBe('forest_blocked');
  });

  it('picks axe and passes forest', () => {
    const result = simulateCatProgram(simpleForestLevel, ['right', 'up', 'up']);
    expect(result.success).toBe(true);
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.reachedGoal).toBe(true);
    expect(lastStep.inventory.axe).toBe(true);
  });
});

describe('isLevelSolvable', () => {
  it('validates all configured levels', () => {
    for (const level of CAT_LEVELS) {
      expect(isLevelSolvable(level)).toBe(true);
    }
  });
});

