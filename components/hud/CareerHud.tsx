'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  Crown,
  FileCheck,
  Flame,
  Footprints,
  Gavel,
  Heart,
  LucideIcon,
  Scale,
  Shield,
  Stamp,
  Swords,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { CAREER_TRACKS, CareerTrack, tierConfig, tierProgress } from '@/types/career';

/** badgeIcon strings from the career schema resolved to real Lucide components. */
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  FileCheck,
  Stamp,
  Briefcase,
  Crown,
  Scale,
  Gavel,
  Footprints,
  Shield,
  Swords,
  Flame,
};

const TRACK_ORDER: CareerTrack[] = ['public_service', 'professional', 'fantasy'];

export function CareerHud() {
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const currentTrack = useGameStore((s) => s.currentTrack);
  const currentTier = useGameStore((s) => s.currentTier);
  const careerExp = useGameStore((s) => s.careerExp);
  const setCareerTrack = useGameStore((s) => s.setCareerTrack);

  const [open, setOpen] = useState(false);

  const track = CAREER_TRACKS[currentTrack];
  const tier = tierConfig(currentTrack, currentTier);
  const progress = tierProgress(currentTrack, careerExp);
  const BadgeIcon = ICON_MAP[tier.badgeIcon] ?? Crown;
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="flex flex-col gap-2 border-b border-[var(--theme-border)] bg-zinc-950/90 px-4 py-3 backdrop-blur">
      {/* Track switcher */}
      <div className="relative flex items-center justify-between">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-zinc-300 hover:border-zinc-500"
        >
          <span>{track.emoji}</span>
          {track.label}
          <ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Career rank badge */}
        <motion.div
          key={`${currentTrack}-${currentTier}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1.5 rounded-full border border-amber-600/70 bg-amber-950/40 px-2.5 py-1"
        >
          <BadgeIcon className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-[11px] font-bold text-amber-200">{tier.title}</span>
          <span className="text-[9px] text-amber-500/80">T{tier.tierLevel}</span>
        </motion.div>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-0 top-full z-50 mt-1 w-40 overflow-hidden rounded border border-zinc-700 bg-zinc-950 shadow-lg"
              >
                {TRACK_ORDER.map((id) => {
                  const t = CAREER_TRACKS[id];
                  const active = id === currentTrack;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setCareerTrack(id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-bold transition ${
                        active ? 'bg-emerald-950/50 text-emerald-300' : 'text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      <span>{t.emoji}</span>
                      {t.label}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Career progress meter */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px]">
          <span className="text-zinc-500">{tier.statusLabel.exp}</span>
          <span className="text-zinc-500">
            {progress.isMax ? '최고 등급 달성' : `${progress.into} / ${progress.span}`}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-sm border border-zinc-700 bg-zinc-950">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
            animate={{ width: `${progress.ratio * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Mental / HP bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1 text-zinc-500">
            <Heart className="h-3 w-3 text-rose-400" /> {tier.statusLabel.hp}
          </span>
          <span className="text-zinc-500">
            {hp} / {maxHp}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-sm border border-zinc-700 bg-zinc-950">
          <motion.div
            className="h-full bg-rose-500"
            animate={{ width: `${hpPct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
}
