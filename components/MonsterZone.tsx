'use client';

import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { monsterForWave } from '@/lib/monsters';
import { ProgressBar } from './ui/ProgressBar';

export function MonsterZone() {
  const wave = useGameStore((s) => s.wave);
  const monsterHp = useGameStore((s) => s.monsterHp);
  const monsterMaxHp = useGameStore((s) => s.monsterMaxHp);
  const events = useGameStore((s) => s.events);
  const controls = useAnimation();
  const lastEventId = useRef<string | null>(null);
  const monster = monsterForWave(wave);

  useEffect(() => {
    const latest = events[events.length - 1];
    if (!latest || latest.id === lastEventId.current) return;
    lastEventId.current = latest.id;

    if (latest.kind === 'attack' || latest.kind === 'crit') {
      controls.start({
        x: [0, -10, 8, -6, 0],
        rotate: latest.kind === 'crit' ? [0, -8, 8, -4, 0] : 0,
        transition: { duration: 0.35 },
      });
    }
    if (latest.kind === 'defeat') {
      controls.start({ opacity: [1, 0.15, 1], scale: [1, 1.3, 1], transition: { duration: 0.5 } });
    }
  }, [events, controls]);

  return (
    <div className="relative flex flex-col items-center gap-2 py-3">
      <motion.div animate={controls} className="text-6xl drop-shadow-[0_0_12px_rgba(244,63,94,0.35)]">
        {monster.icon}
      </motion.div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-400">
        Wave {wave + 1} · {monster.name}
      </div>
      <div className="w-40">
        <ProgressBar value={monsterHp} max={monsterMaxHp} colorClass="bg-rose-500" />
      </div>
    </div>
  );
}
