'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';

const MILESTONE_OPTIONS = [70, 80, 90];

export function PrePlannedRewardCard() {
  const dailyReward = useGameStore((s) => s.dailyReward);
  const tasks = useGameStore((s) => s.tasks);
  const setDailyReward = useGameStore((s) => s.setDailyReward);
  const clearDailyReward = useGameStore((s) => s.clearDailyReward);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);

  const [title, setTitle] = useState('');
  const [milestonePercent, setMilestonePercent] = useState(80);

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const donePercent = total ? Math.round((doneCount / total) * 100) : 0;

  function handleSet() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setDailyReward(trimmed, milestonePercent);
    setTitle('');
  }

  if (!dailyReward) {
    return (
      <div className="flex flex-col gap-2 rounded border border-dashed border-amber-700/50 bg-amber-950/10 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-300">
          <Gift className="h-3.5 w-3.5" /> 오늘의 예약 보상
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSet()}
          placeholder="오늘의 예약 보상 (예: 두툼한 쿠키와 커피, 게임 1시간)"
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
        />
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-zinc-400">마일스톤 목표</label>
          <div className="flex gap-1.5">
            {MILESTONE_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setMilestonePercent(p)}
                className={`rounded border px-2 py-0.5 text-[11px] font-bold ${
                  milestonePercent === p
                    ? 'border-amber-500 bg-amber-900/40 text-amber-300'
                    : 'border-zinc-700 text-zinc-500'
                }`}
              >
                {p}% 완료 시
              </button>
            ))}
          </div>
        </div>
        <PixelButton onClick={handleSet} className="self-start">
          예약하기
        </PixelButton>
      </div>
    );
  }

  if (dailyReward.claimed) {
    return (
      <div className="flex items-center justify-between rounded border border-emerald-700/50 bg-emerald-950/20 px-3 py-2">
        <span className="text-xs font-bold text-emerald-300">
          ✅ 오늘의 보상 획득 완료: {dailyReward.title}
        </span>
        <button
          onClick={clearDailyReward}
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          <RotateCcw className="h-3 w-3" /> 새로 예약
        </button>
      </div>
    );
  }

  if (dailyReward.fired) {
    return (
      <motion.button
        onClick={claimDailyReward}
        animate={{
          boxShadow: [
            '0 0 0px rgba(245,158,11,0.4)',
            '0 0 16px rgba(245,158,11,0.7)',
            '0 0 0px rgba(245,158,11,0.4)',
          ],
        }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="flex w-full items-center justify-center gap-2 rounded border border-amber-500 bg-amber-900/30 px-3 py-2 text-xs font-bold text-amber-300"
      >
        <Sparkles className="h-4 w-4" /> 목표 달성! {dailyReward.title} 보상 섭취하기
      </motion.button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded border border-zinc-700 bg-zinc-900/60 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300">
        <Lock className="h-3.5 w-3.5 text-amber-400" />
        {dailyReward.milestonePercent}% 달성 시 {dailyReward.title} 해금!
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-sm border border-zinc-700 bg-zinc-950">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-pink-500 transition-all duration-500"
          style={{ width: `${donePercent}%` }}
        />
      </div>
      <span className="text-[10px] text-zinc-500">
        오늘 진행률 {donePercent}% ({doneCount}/{total})
      </span>
    </div>
  );
}
