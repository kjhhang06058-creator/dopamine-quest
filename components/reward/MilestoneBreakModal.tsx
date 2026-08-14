'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, Siren, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';

/** How long the "reward consumed" animation shows before the modal auto-dismisses. */
const CONSUME_ANIMATION_MS = 1400;

export function MilestoneBreakModal() {
  const activeDailyMilestone = useGameStore((s) => s.activeDailyMilestone);
  const dailyReward = useGameStore((s) => s.dailyReward);
  const dismissDailyMilestone = useGameStore((s) => s.dismissDailyMilestone);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const [consumed, setConsumed] = useState(false);

  function handleConsume() {
    claimDailyReward();
    setConsumed(true);
    setTimeout(() => {
      dismissDailyMilestone();
      setConsumed(false);
    }, CONSUME_ANIMATION_MS);
  }

  if (typeof document === 'undefined') return null;

  const show = activeDailyMilestone && dailyReward;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="w-full max-w-xs rounded border border-pink-500/60 bg-zinc-950 p-5 text-center shadow-[0_0_50px_rgba(236,72,153,0.3)]"
          >
            <AnimatePresence mode="wait">
              {consumed ? (
                <motion.div
                  key="consumed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-1 py-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.6 }}
                  >
                    <Sparkles className="h-9 w-9 text-emerald-400" />
                  </motion.div>
                  <motion.span
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -14, opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="text-sm font-bold text-emerald-400"
                  >
                    +30 HP
                  </motion.span>
                  <span className="mt-1 rounded-full border border-violet-500 bg-violet-950/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                    EXP 버프 획득
                  </span>
                </motion.div>
              ) : (
                <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                    <Siren className="mx-auto h-9 w-9 text-pink-400" />
                  </motion.div>
                  <div className="mt-3 text-sm font-bold uppercase tracking-wider text-pink-300">
                    🚨 마일스톤 {dailyReward?.milestonePercent}% 달성! 강제 휴식 타임!
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    예약해둔 보상, <span className="font-bold text-amber-300">{dailyReward?.title}</span>를 받을
                    시간이에요.
                  </p>
                  <div className="mt-4">
                    <PixelButton onClick={handleConsume} className="flex w-full items-center justify-center gap-2">
                      <Coffee className="h-4 w-4" /> 보상 섭취하기 (+30 HP 회복 & EXP 버프)
                    </PixelButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
