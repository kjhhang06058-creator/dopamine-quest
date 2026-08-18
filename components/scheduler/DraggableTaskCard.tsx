'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, Gift, Lock, Plus } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { Difficulty, Task } from '@/types';

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '쉬움', color: 'border-emerald-700 bg-emerald-950/40 text-emerald-400' },
  normal: { label: '보통', color: 'border-amber-700 bg-amber-950/40 text-amber-400' },
  hard: { label: '어려움', color: 'border-rose-700 bg-rose-950/40 text-rose-400' },
};

interface Props {
  task: Task;
  /** True while rendered inside DragOverlay — skips sortable wiring and shows the lifted style. */
  overlay?: boolean;
}

export function DraggableTaskCard({ task, overlay = false }: Props) {
  const completeTask = useGameStore((s) => s.completeTask);
  const setPairedReward = useGameStore((s) => s.setPairedReward);
  const claimPairedReward = useGameStore((s) => s.claimPairedReward);

  const [editingReward, setEditingReward] = useState(false);
  const [rewardText, setRewardText] = useState('');

  function commitReward() {
    setPairedReward(task.id, rewardText);
    setRewardText('');
    setEditingReward(false);
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: overlay,
  });

  const style = overlay
    ? undefined
    : { transform: CSS.Transform.toString(transform), transition };

  const lifted = overlay || isDragging;
  const reward = task.pairedReward;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded border bg-zinc-900/80 px-2.5 py-2 transition-shadow ${
        lifted
          ? 'border-fuchsia-500 shadow-[0_0_16px_rgba(217,70,239,0.65)]'
          : 'border-zinc-800 hover:border-zinc-600'
      } ${isDragging && !overlay ? 'opacity-40' : 'opacity-100'}`}
    >
      {/* Drag handle — keeps the checkbox tappable instead of starting a drag. */}
      <button
        {...(overlay ? {} : attributes)}
        {...(overlay ? {} : listeners)}
        className="shrink-0 cursor-grab touch-none text-zinc-600 active:cursor-grabbing"
        aria-label="드래그해서 시간대 옮기기"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        onClick={() => !task.done && completeTask(task.id)}
        disabled={task.done}
        aria-label={task.done ? '완료됨' : '완료 처리'}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          task.done
            ? 'border-emerald-600 bg-emerald-600 text-zinc-950'
            : 'border-zinc-600 hover:border-emerald-500'
        }`}
      >
        {task.done && <Check className="h-3 w-3" />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`truncate text-xs ${task.done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
          {task.title}
        </span>

        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
              DIFFICULTY_META[task.difficulty].color
            }`}
          >
            {DIFFICULTY_META[task.difficulty].label}
          </span>

          {reward ? (
            <button
              onClick={() => {
                if (reward.isUnlocked && !reward.isClaimed) claimPairedReward(task.id);
                else if (!reward.isUnlocked && !overlay) {
                  setRewardText(reward.title);
                  setEditingReward(true);
                }
              }}
              className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                reward.isClaimed
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-500'
                  : reward.isUnlocked
                    ? 'border-amber-500 bg-amber-950/50 text-amber-300 animate-pulse'
                    : 'border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-500'
              }`}
              title={
                reward.isClaimed
                  ? '보상 수령 완료'
                  : reward.isUnlocked
                    ? '눌러서 보상 받기 (+30 HP)'
                    : '완료하면 열려요 (눌러서 수정)'
              }
            >
              {reward.isUnlocked ? <Gift className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
              {reward.title}
              {reward.isClaimed && ' ✓'}
            </button>
          ) : (
            !overlay &&
            !task.done && (
              <button
                onClick={() => setEditingReward(true)}
                className="flex items-center gap-0.5 rounded border border-dashed border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                title="이 퀘스트에 실물 보상 걸기"
              >
                <Plus className="h-2.5 w-2.5" /> 보상
              </button>
            )
          )}

          {editingReward && !overlay && (
            <input
              autoFocus
              value={rewardText}
              onChange={(e) => setRewardText(e.target.value)}
              onBlur={commitReward}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitReward();
                if (e.key === 'Escape') setEditingReward(false);
              }}
              placeholder="예: 아이스라떼"
              className="w-28 rounded border border-amber-600 bg-zinc-950 px-1.5 py-0.5 text-[10px] text-zinc-100 outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
