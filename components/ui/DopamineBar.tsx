'use client';

import { Gift } from 'lucide-react';

interface Props {
  progress: number;
  target: number;
  milestonePercent: number;
  preReward: string;
}

export function DopamineBar({ progress, target, milestonePercent, preReward }: Props) {
  const pct = Math.max(0, Math.min(100, (progress / Math.max(1, target)) * 100));
  const remaining = target - progress;

  return (
    <div className="w-full">
      <div className="relative h-3 w-full overflow-visible rounded-sm border border-zinc-700 bg-zinc-900">
        <div
          className="h-full rounded-sm bg-gradient-to-r from-amber-500 to-pink-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${milestonePercent}%` }}
          title={`${milestonePercent}% 마일스톤 보상`}
        >
          <Gift className="h-3.5 w-3.5 text-amber-300 drop-shadow" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2" title="완료 보상">
          <Gift className="h-3.5 w-3.5 text-pink-300 drop-shadow" />
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px]">
        <span className="text-zinc-500">
          진행 {progress}/{target}
        </span>
        {remaining === 1 ? (
          <span className="font-bold text-pink-300">{preReward}까지 딱 1단계 남았어요!</span>
        ) : (
          <span className="text-zinc-500">보상: {preReward}</span>
        )}
      </div>
    </div>
  );
}
