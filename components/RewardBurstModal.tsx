'use client';

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, PartyPopper } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from './ui/PixelButton';

export function RewardBurstModal() {
  const activeMilestone = useGameStore((s) => s.activeMilestone);
  const dismissMilestone = useGameStore((s) => s.dismissMilestone);

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
            <PartyPopper className="mx-auto h-9 w-9 text-amber-400" />
            <div className="mt-3 text-sm font-bold uppercase tracking-wider text-amber-300">
              {activeMilestone.preReward} 잠금 해제!
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              &ldquo;{activeMilestone.title}&rdquo; 목표를 여기까지 해냈어요. 잠깐 쉬고 마지막 구간을
              마무리해보세요.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <PixelButton onClick={dismissMilestone} className="flex items-center justify-center gap-2">
                <Coffee className="h-4 w-4" /> 지금 휴식하기
              </PixelButton>
              <PixelButton variant="ghost" onClick={dismissMilestone}>
                마지막 구간 이어하기
              </PixelButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
