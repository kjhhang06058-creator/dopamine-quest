'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, Flame, Trash2 } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { DopamineBar } from '../ui/DopamineBar';
import { DIFFICULTY_META } from './difficultyMeta';

/** Pending quests with inline title editing and the complete/fail/delete actions. */
export function QuestList() {
  const tasks = useGameStore((s) => s.tasks);
  const completeTask = useGameStore((s) => s.completeTask);
  const advanceTask = useGameStore((s) => s.advanceTask);
  const failTask = useGameStore((s) => s.failTask);
  const deleteTask = useGameStore((s) => s.deleteTask);
  const editTask = useGameStore((s) => s.editTask);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const pending = tasks.filter((t) => !t.done);

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {pending.map((task) => {
          const taskTarget = task.target || 1;
          const isGoal = taskTarget > 1;
          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-2 rounded border border-zinc-800 bg-zinc-900/60 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  {editingId === task.id ? (
                    <input
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => {
                        editTask(task.id, editingText);
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          editTask(task.id, editingText);
                          setEditingId(null);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full rounded border border-emerald-600 bg-zinc-950 px-1.5 py-0.5 text-sm text-zinc-100 outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(task.id);
                        setEditingText(task.title);
                      }}
                      className="truncate text-left text-sm text-zinc-100 hover:text-emerald-300"
                      title="눌러서 제목 수정"
                    >
                      {task.title}
                    </button>
                  )}
                  <span className={`text-[10px] font-bold uppercase ${DIFFICULTY_META[task.difficulty].color}`}>
                    {DIFFICULTY_META[task.difficulty].label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isGoal ? (
                    <button
                      onClick={() => advanceTask(task.id)}
                      className="flex items-center gap-1 rounded border border-amber-700 bg-amber-900/40 px-2 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-800/50"
                      title="진행 +1"
                    >
                      +1 <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => completeTask(task.id)}
                      className="rounded border border-emerald-700 bg-emerald-900/50 p-1.5 text-emerald-300 hover:bg-emerald-800"
                      title="완료"
                      aria-label="완료 처리"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => failTask(task.id)}
                    className="rounded border border-rose-800 bg-rose-950/50 p-1.5 text-rose-300 hover:bg-rose-900"
                    title="실패 처리 (HP 감소)"
                    aria-label="실패 처리"
                  >
                    <Flame className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="rounded border border-zinc-700 bg-zinc-800/50 p-1.5 text-zinc-400 hover:bg-zinc-700"
                    title="삭제"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isGoal && (
                <DopamineBar
                  progress={task.progress || 0}
                  target={taskTarget}
                  milestonePercent={task.milestonePercent || 80}
                  preReward={task.preReward || '보상'}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {pending.length === 0 &&
        (tasks.length === 0 ? (
          // First run: an empty board with a career HUD on top explained nothing about what to do.
          <div className="flex flex-col gap-2 rounded border border-dashed border-zinc-700 p-4 text-center">
            <div className="text-2xl">🎯</div>
            <div className="text-xs font-bold text-zinc-300">첫 퀘스트를 추가해보세요</div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              할 일을 적고 <span className="text-emerald-400">추가</span>를 누르면 됩니다. 큰 일이면 AI가 3단계로
              나눠줄지 물어봐요.
              <br />
              완료할 때마다 점수가 쌓여 위쪽 <span className="text-amber-300">등급이 승진</span>합니다 — 상단에서
              공무원 / 전문직 / 판타지 중 원하는 테마를 고를 수 있어요.
            </p>
          </div>
        ) : (
          <div className="rounded border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-500">
            대기 중인 퀘스트를 모두 끝냈어요! 🎉
          </div>
        ))}
    </div>
  );
}
