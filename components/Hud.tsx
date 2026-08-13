'use client';

import { Coins, Heart, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { expToNextLevel } from '@/lib/rewards';
import { ProgressBar } from './ui/ProgressBar';
import { AccountPanel } from './AccountPanel';

const HEART_COUNT = 5;

export function Hud() {
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const level = useGameStore((s) => s.level);
  const exp = useGameStore((s) => s.exp);
  const gold = useGameStore((s) => s.gold);
  const expBuffActive = useGameStore((s) => s.expBuffActive);

  const need = expToNextLevel(level);
  const hpPerHeart = maxHp / HEART_COUNT;

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: HEART_COUNT }).map((_, i) => {
            const filled = Math.max(0, Math.min(1, (hp - i * hpPerHeart) / hpPerHeart));
            return (
              <div key={i} className="relative h-4 w-4">
                <Heart className="absolute h-4 w-4 text-zinc-700" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${filled * 100}%` }}>
                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded border border-emerald-700 bg-emerald-950 px-2 py-0.5 font-bold text-emerald-300">
            Lv.{level}
          </span>
          <span className="flex items-center gap-1 font-bold text-amber-300">
            <Coins className="h-3.5 w-3.5" /> {gold}
          </span>
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
