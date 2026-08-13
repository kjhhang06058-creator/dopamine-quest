'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, PartyPopper, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from './ui/PixelButton';

/** How long the "reward consumed" animation shows before the modal auto-dismisses. */
const CONSUME_ANIMATION_MS = 1400;

export function RewardBurstModal() {
  const activeMilestone = useGameStore((s) => s.activeMilestone);
  const dismissMilestone = useGameStore((s) => s.dismissMilestone);
  const claimReward = useGameStore((s) => s.claimReward);
  const [consumed, setConsumed] = useState(false);

  function handleConsume() {
    claimReward();
    setConsumed(true);
    setTimeout(() => {
      dismissMilestone();
      setConsumed(false);
    }, CONSUME_ANIMATION_MS);
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {activeMilestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="w-full max-w-xs rounded border border-amber-600/50 bg-zinc-950 p-5 text-center shadow-[0_0_40px_rgba(245,158,11,0.25)]"
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
                  <PartyPopper className="mx-auto h-9 w-9 text-amber-400" />
                  <div className="mt-3 text-sm font-bold uppercase tracking-wider text-amber-300">
                    {activeMilestone.preReward} 잠금 해제!
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    &ldquo;{activeMilestone.title}&rdquo; 목표를 여기까지 해냈어요. 보상을 섭취하면 HP를 회복하고
                    다음 퀘스트에 EXP 버프가 붙어요.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <PixelButton onClick={handleConsume} className="flex items-center justify-center gap-2">
                      <Coffee className="h-4 w-4" /> 보상 섭취 (+30 HP)
                    </PixelButton>
                    <PixelButton variant="ghost" onClick={dismissMilestone}>
                      마지막 구간 이어하기
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
