'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Flame, Plus, Trash2 } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';
import { Difficulty } from '@/types';

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '쉬움', color: 'text-emerald-400 border-emerald-700' },
  normal: { label: '보통', color: 'text-amber-400 border-amber-700' },
  hard: { label: '어려움', color: 'text-rose-400 border-rose-700' },
};

export function QuestTab() {
  const tasks = useGameStore((s) => s.tasks);
  const addTask = useGameStore((s) => s.addTask);
  const completeTask = useGameStore((s) => s.completeTask);
  const failTask = useGameStore((s) => s.failTask);
  const deleteTask = useGameStore((s) => s.deleteTask);

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed, difficulty);
    setTitle('');
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="오늘의 퀘스트를 입력하세요"
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
          <PixelButton onClick={handleAdd} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> 추가
          </PixelButton>
        </div>
        <div className="flex gap-2">
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded border px-3 py-1 text-[11px] font-bold uppercase ${DIFFICULTY_META[d].color} ${
                difficulty === d ? 'bg-zinc-800' : 'opacity-50'
              }`}
            >
              {DIFFICULTY_META[d].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {pending.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm text-zinc-100">{task.title}</span>
                <span className={`text-[10px] font-bold uppercase ${DIFFICULTY_META[task.difficulty].color}`}>
                  {DIFFICULTY_META[task.difficulty].label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => completeTask(task.id)}
                  className="rounded border border-emerald-700 bg-emerald-900/50 p-1.5 text-emerald-300 hover:bg-emerald-800"
                  title="완료 (공격!)"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => failTask(task.id)}
                  className="rounded border border-rose-800 bg-rose-950/50 p-1.5 text-rose-300 hover:bg-rose-900"
                  title="실패 처리 (HP 감소)"
                >
                  <Flame className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="rounded border border-zinc-700 bg-zinc-800/50 p-1.5 text-zinc-400 hover:bg-zinc-700"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.length === 0 && (
          <div className="rounded border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-500">
            대기 중인 퀘스트가 없습니다. 새 퀘스트를 추가해보세요!
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div className="flex flex-col gap-1 opacity-60">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">완료됨</div>
          {done.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded border border-zinc-900 bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-500 line-through"
            >
              {task.title}
              <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-zinc-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
