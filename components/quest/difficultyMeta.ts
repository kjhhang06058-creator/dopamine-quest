import { Difficulty } from '@/types';

/** Shared difficulty chip styling — was duplicated across QuestTab and the scheduler card. */
export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '쉬움', color: 'text-emerald-400 border-emerald-700' },
  normal: { label: '보통', color: 'text-amber-400 border-amber-700' },
  hard: { label: '어려움', color: 'text-rose-400 border-rose-700' },
};
