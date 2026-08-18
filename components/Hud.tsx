'use client';

import { Coins, Flame, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { expToNextLevel } from '@/lib/rewards';
import { ProgressBar } from './ui/ProgressBar';
import { AccountPanel } from './AccountPanel';

export function Hud() {
  const level = useGameStore((s) => s.level);
  const exp = useGameStore((s) => s.exp);
  const gold = useGameStore((s) => s.gold);
  const expBuffActive = useGameStore((s) => s.expBuffActive);
  const streakDays = useGameStore((s) => s.streakDays);

  const need = expToNextLevel(level);

  // HP lives in CareerHud, which labels it per track (멘탈/체력) — duplicating hearts here just
  // ate vertical space on mobile now that both HUDs stack.
  return (
    <div className="border-b border-[var(--theme-border)] bg-zinc-950/90 px-4 py-2 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded border border-emerald-700 bg-emerald-950 px-2 py-0.5 font-bold text-emerald-300">
            Lv.{level}
          </span>
          <span className="flex items-center gap-1 font-bold text-amber-300">
            <Coins className="h-3.5 w-3.5" /> {gold}
          </span>
          {streakDays > 0 && (
            <span
              className="flex items-center gap-1 font-bold text-orange-300"
              title={`${streakDays}일 연속 달성 중`}
            >
              <Flame className="h-3.5 w-3.5" /> {streakDays}
            </span>
          )}
          {expBuffActive && (
            <span className="flex items-center gap-1 rounded-full border border-violet-500 bg-violet-950/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
              <Sparkles className="h-3 w-3" /> EXP UP
            </span>
          )}
          <AccountPanel />
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar value={exp} max={need} colorClass="bg-violet-400" />
      </div>
    </div>
  );
}
