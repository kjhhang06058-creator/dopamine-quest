'use client';

import { Trash2 } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';

export function CompletedList() {
  const tasks = useGameStore((s) => s.tasks);
  const deleteTask = useGameStore((s) => s.deleteTask);
  const clearCompleted = useGameStore((s) => s.clearCompleted);

  const done = tasks.filter((t) => t.done);
  if (done.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 opacity-60">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">완료됨 ({done.length})</span>
        <button
          onClick={clearCompleted}
          className="text-[10px] text-zinc-500 hover:text-zinc-300"
          title="완료된 퀘스트 모두 지우기"
        >
          전체 지우기
        </button>
      </div>

      {done.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded border border-zinc-900 bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-500 line-through"
        >
          {task.title}
          <button
            onClick={() => deleteTask(task.id)}
            className="text-zinc-600 hover:text-zinc-400"
            aria-label="삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
