'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function ScreenEffects() {
  const events = useGameStore((s) => s.events);
  const lastId = useRef<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const latest = events[events.length - 1];
    if (!latest || latest.id === lastId.current) return;
    lastId.current = latest.id;

    if (latest.kind === 'hurt') {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 250);
      return () => clearTimeout(t);
    }
  }, [events]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 bg-red-600 transition-opacity duration-200 ${
        flash ? 'opacity-30' : 'opacity-0'
      }`}
    />
  );
}
