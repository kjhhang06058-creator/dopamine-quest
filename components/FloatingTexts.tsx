'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { CombatEventKind } from '@/types';

const KIND_STYLE: Record<CombatEventKind, string> = {
  attack: 'text-yellow-300',
  crit: 'text-pink-400 text-xl',
  defeat: 'text-emerald-300 text-lg',
  hurt: 'text-red-400',
  heal: 'text-sky-300 text-lg',
  gacha: 'text-violet-300',
};

export function FloatingTexts() {
  const events = useGameStore((s) => s.events);
  const clearEvent = useGameStore((s) => s.clearEvent);

  useEffect(() => {
    if (events.length === 0) return;
    const timers = events.map((e) => setTimeout(() => clearEvent(e.id), 1400));
    return () => timers.forEach(clearTimeout);
  }, [events, clearEvent]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex flex-col items-center gap-1">
      <AnimatePresence>
        {events.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 1.2 }}
            className={`font-bold drop-shadow-[0_0_6px_rgba(0,0,0,0.8)] ${KIND_STYLE[e.kind]}`}
          >
            {e.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
