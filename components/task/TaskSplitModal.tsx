'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, X } from 'lucide-react';

export type MicroDifficulty = 'easy' | 'normal';

export interface MicroQuest {
  title: string;
  difficulty: MicroDifficulty;
  expReward: 15 | 30;
  goldReward: 10 | 25;
}

const DIFFICULTY_META: Record<MicroDifficulty, { label: string; color: string }> = {
  easy: { label: '쉬움', color: 'border-emerald-700 bg-emerald-950/40 text-emerald-400' },
  normal: { label: '보통', color: 'border-amber-700 bg-amber-950/40 text-amber-400' },
};

interface Props {
  suggestion: { title: string; quests: MicroQuest[] } | null;
  onAcceptSplit: () => void;
  onKeepSingle: () => void;
}

/** Popup shown automatically right after the user submits a task the rule-based decomposer judged
 * complex — proposes splitting it into procedural micro-quests. Always offers "그냥 한 번에 추가"
 * so declining never blocks adding what they originally typed. */
export function TaskSplitModal({ suggestion, onAcceptSplit, onKeepSingle }: Props) {
  return (
    <AnimatePresence>
      {suggestion && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onKeepSingle}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-fuchsia-600 bg-zinc-950 p-4 shadow-[0_0_30px_rgba(217,70,239,0.4)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-bold text-fuchsia-300">
                <Sparkles className="h-4 w-4" /> 이 작업, 나눠볼까요?
              </div>
              <button onClick={onKeepSingle} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-xs text-zinc-400">
              &ldquo;{suggestion.title}&rdquo;은 조금 커 보여요. 이렇게 나눠서 하나씩 시작해볼 수 있어요:
            </p>

            <div className="flex flex-col gap-2">
              {suggestion.quests.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between gap-2 rounded border border-zinc-800 bg-zinc-900/70 px-3 py-2"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-100">{q.title}</span>
                    <span
                      className={`w-fit rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${DIFFICULTY_META[q.difficulty].color}`}
                    >
                      {DIFFICULTY_META[q.difficulty].label}
                    </span>
                  </div>
                  <div className="shrink-0 text-right text-[10px] font-bold">
                    <div className="text-sky-400">+{q.expReward} EXP</div>
                    <div className="text-amber-400">+{q.goldReward}G</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={onKeepSingle}
                className="flex-1 rounded border border-zinc-700 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-900"
              >
                그냥 한 번에 추가
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAcceptSplit}
                className="flex flex-1 items-center justify-center gap-1.5 rounded border-b-4 border-emerald-700 bg-emerald-500 py-2 text-xs font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-emerald-400 active:translate-y-0.5 active:border-b-2"
              >
                <Check className="h-4 w-4" /> 나눠서 추가
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
