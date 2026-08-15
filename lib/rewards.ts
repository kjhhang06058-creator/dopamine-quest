import { Difficulty } from '@/types';

interface DifficultyRewardRange {
  exp: [number, number];
  gold: [number, number];
  damageToMonster: [number, number];
}

const DIFFICULTY_TABLE: Record<Difficulty, DifficultyRewardRange> = {
  easy: { exp: [5, 10], gold: [3, 10], damageToMonster: [8, 14] },
  normal: { exp: [10, 20], gold: [8, 25], damageToMonster: [15, 25] },
  hard: { exp: [20, 35], gold: [15, 45], damageToMonster: [25, 40] },
};

const TASK_FAIL_PENALTY: Record<Difficulty, number> = {
  easy: 8,
  normal: 14,
  hard: 22,
};

const CRIT_CHANCE = 0.12;

export const BOSS_FAIL_DAMAGE = 40;

/** Gold cost of one streak shield ("부활의 물약") in the shop. */
export const STREAK_SHIELD_COST = 40;
/** Consecutive 실패 처리 clicks (with no completion in between) that triggers the monster-weaken comeback debuff. */
export const FAIL_STREAK_THRESHOLD = 2;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface TaskRewardResult {
  exp: number;
  gold: number;
  damage: number;
  crit: boolean;
}

export function rollTaskReward(difficulty: Difficulty): TaskRewardResult {
  const table = DIFFICULTY_TABLE[difficulty];
  const crit = Math.random() < CRIT_CHANCE;
  const mult = crit ? 3 : 1;
  return {
    exp: randInt(table.exp[0], table.exp[1]),
    gold: randInt(table.gold[0], table.gold[1]) * mult,
    damage: randInt(table.damageToMonster[0], table.damageToMonster[1]) * (crit ? 2 : 1),
    crit,
  };
}

export function taskFailPenalty(difficulty: Difficulty): number {
  return TASK_FAIL_PENALTY[difficulty];
}

export function expToNextLevel(level: number): number {
  return 50 + level * 25;
}

export function rollBossReward(minutes: number) {
  const base = Math.max(1, Math.round(minutes)) * 4;
  return {
    exp: randInt(base, base * 2),
    gold: randInt(base * 2, base * 4),
  };
}
