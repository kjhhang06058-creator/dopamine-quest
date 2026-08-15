'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { CAREER_TRACKS, tierConfig } from '@/types/career';
import { PixelButton } from '../ui/PixelButton';

const CONFETTI_COLORS = ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#c084fc'];
const CONFETTI_COUNT = 28;

/** Celebration that fires when careerExp crosses a tier threshold — retro stamp + confetti burst. */
export function PromotionModal() {
  const pendingPromotion = useGameStore((s) => s.pendingPromotion);
  const currentTrack = useGameStore((s) => s.currentTrack);
  const dismissPromotion = useGameStore((s) => s.dismissPromotion);

  // Re-randomized per promotion. Keying on [] meant every promotion replayed the identical burst,
  // since this modal stays mounted for the whole session.
  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        y: (Math.random() - 0.5) * 320,
        rotate: Math.random() * 720 - 360,
        delay: Math.random() * 0.25,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [pendingPromotion],
  );

  const track = CAREER_TRACKS[currentTrack];
  const tier = pendingPromotion ? tierConfig(currentTrack, pendingPromotion) : null;

  return (
    <AnimatePresence>
      {tier && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          onClick={dismissPromotion}
        >
          {/* Confetti burst */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], x: c.x, y: c.y, scale: [0, 1, 1, 0.6], rotate: c.rotate }}
                transition={{ duration: 1.6, delay: c.delay, ease: 'easeOut' }}
                className="absolute h-2 w-2 rounded-[1px]"
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[min(90vw,340px)] rounded-lg border-2 border-amber-500 bg-zinc-950 p-6 text-center shadow-[0_0_40px_rgba(245,158,11,0.35)]"
          >
            <div className="text-[11px] uppercase tracking-[0.2em] text-amber-500/80">
              {track.emoji} {track.label}
            </div>

            {/* Retro stamp — slams down and settles slightly rotated */}
            <motion.div
              initial={{ scale: 2.6, opacity: 0, rotate: -28 }}
              animate={{ scale: 1, opacity: 1, rotate: -11 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
              className="mx-auto my-5 w-fit rounded border-4 border-rose-500 px-5 py-2"
            >
              <span className="text-xl font-black tracking-widest text-rose-400">{track.promotionStamp}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-[11px] text-zinc-500">TIER {tier.tierLevel}</div>
              <div className="mt-1 text-2xl font-black text-amber-300">{tier.title}</div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                축하해요! 지금까지 쌓은 진도가 승급으로 이어졌어요.
                <br />
                이제부터 완료 문구가 <span className="text-emerald-400">&ldquo;{tier.actionVerb}&rdquo;</span>로 바뀝니다.
              </p>
            </motion.div>

            <PixelButton onClick={dismissPromotion} className="mt-5 w-full">
              계속하기
            </PixelButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
