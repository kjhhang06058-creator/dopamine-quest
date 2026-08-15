'use client';

import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { tierConfig, tierProgress } from '@/types/career';
import { ProgressBar } from './ui/ProgressBar';

/** Center stage. Replaces the old wave-based MonsterZone: progress is now the climb toward the
 * next career tier, so completing tasks builds toward a promotion instead of killing a monster. */
export function CareerZone() {
  const currentTrack = useGameStore((s) => s.currentTrack);
  const currentTier = useGameStore((s) => s.currentTier);
  const careerExp = useGameStore((s) => s.careerExp);
  const events = useGameStore((s) => s.events);

  const controls = useAnimation();
  const lastEventId = useRef<string | null>(null);

  const tier = tierConfig(currentTrack, currentTier);
  const progress = tierProgress(currentTrack, careerExp);

  useEffect(() => {
    const latest = events[events.length - 1];
    if (!latest || latest.id === lastEventId.current) return;
    lastEventId.current = latest.id;

    if (latest.kind === 'attack' || latest.kind === 'crit') {
      controls.start({
        y: [0, -8, 0],
        scale: latest.kind === 'crit' ? [1, 1.18, 1] : [1, 1.06, 1],
        transition: { duration: 0.35 },
      });
    }
    if (latest.kind === 'defeat') {
      controls.start({ opacity: [1, 0.3, 1], scale: [1, 1.25, 1], transition: { duration: 0.5 } });
    }
  }, [events, controls]);

  return (
    <div className="relative flex flex-col items-center gap-2 py-3">
      <motion.div animate={controls} className="text-6xl drop-shadow-[0_0_12px_var(--theme-accent-glow)]">
        {tier.zoneIcon}
      </motion.div>

      <div className="text-[11px] uppercase tracking-wider text-zinc-400">
        {progress.isMax ? '최고 등급' : `Tier ${tier.tierLevel}`} · {tier.zoneName}
      </div>

      <div className="w-44">
        <ProgressBar value={progress.into} max={progress.span} colorClass="bg-[var(--theme-accent)]" />
      </div>

      <div className="text-[10px] text-zinc-500">
        {progress.isMax ? (
          <>다음 성과까지 {progress.remaining} {tier.unitLabel}</>
        ) : (
          <>
            승급까지 {progress.remaining} {tier.unitLabel} 남음
          </>
        )}
      </div>
    </div>
  );
}
