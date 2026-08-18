'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useGameStore } from '@/store/useGameStore';
import { Task, TimeBlock } from '@/types';
import { DraggableTaskCard } from './DraggableTaskCard';

const BLOCKS: { id: TimeBlock; label: string; accent: string }[] = [
  { id: 'morning', label: '🌅 오전', accent: 'border-sky-800/60 bg-sky-950/10' },
  { id: 'afternoon', label: '☀️ 오후', accent: 'border-amber-800/60 bg-amber-950/10' },
  { id: 'evening', label: '🌙 저녁', accent: 'border-violet-800/60 bg-violet-950/10' },
];

const laneOf = (t: Task): TimeBlock => t.timeBlock ?? 'unassigned';

function DropLane({
  id,
  label,
  accent,
  tasks,
  empty,
}: {
  id: TimeBlock;
  label: string;
  accent: string;
  tasks: Task[];
  empty: string;
}) {
  // Droppable on the lane itself so empty lanes still accept a drop.
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-1.5 rounded border p-2 transition-colors ${accent} ${
        isOver ? 'border-fuchsia-500 bg-fuchsia-950/20' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-300">{label}</span>
        <span className="text-[10px] text-zinc-500">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[44px] flex-col gap-1.5">
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded border border-dashed border-zinc-800 py-3 text-[10px] text-zinc-600">
              {empty}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function DndTimeBlockScheduler() {
  const tasks = useGameStore((s) => s.tasks);
  const moveTask = useGameStore((s) => s.moveTask);
  const claimPairedReward = useGameStore((s) => s.claimPairedReward);

  // Zustand's persisted store hydrates on the client only, so rendering the lanes during SSR
  // would mismatch. Gate the whole tree until mounted.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const pending = useMemo(() => tasks.filter((t) => !t.done), [tasks]);
  const doneCount = tasks.length - pending.length;
  const unclaimed = useMemo(
    () => tasks.filter((t) => t.pairedReward?.isUnlocked && !t.pairedReward.isClaimed),
    [tasks],
  );
  const byLane = useMemo(() => {
    const map: Record<TimeBlock, Task[]> = { unassigned: [], morning: [], afternoon: [], evening: [] };
    pending.forEach((t) => map[laneOf(t)].push(t));
    return map;
  }, [pending]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const dragged = tasks.find((t) => t.id === active.id);
    if (!dragged) return;

    const overId = String(over.id);
    // `over` is either a lane container or another card — resolve both to a target lane.
    const overTask = tasks.find((t) => t.id === overId);
    const targetBlock: TimeBlock = overTask ? laneOf(overTask) : (overId as TimeBlock);
    if (!['unassigned', 'morning', 'afternoon', 'evening'].includes(targetBlock)) return;

    const lane = tasks.filter((t) => !t.done && laneOf(t) === targetBlock && t.id !== dragged.id);
    const newIndex = overTask ? lane.findIndex((t) => t.id === overTask.id) : lane.length;

    moveTask(dragged.id, targetBlock, newIndex < 0 ? lane.length : newIndex);
  }

  if (!isMounted) {
    return <div className="h-40 rounded border border-dashed border-zinc-800" aria-hidden />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col gap-3">
        {/* Completed tasks leave the lanes, so their unlocked rewards would be unreachable —
            surface them here as claim buttons. */}
        {unclaimed.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded border border-amber-700/60 bg-amber-950/20 px-2.5 py-2">
            <span className="text-[10px] font-bold text-amber-300">받을 보상 {unclaimed.length}개</span>
            <div className="flex flex-wrap gap-1.5">
              {unclaimed.map((t) => (
                <button
                  key={t.id}
                  onClick={() => claimPairedReward(t.id)}
                  className="flex items-center gap-1 rounded border border-amber-500 bg-amber-900/40 px-2 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-800/50"
                >
                  🎁 {t.pairedReward?.title} 받기
                </button>
              ))}
            </div>
          </div>
        )}

        {doneCount > 0 && (
          <div className="text-[10px] text-zinc-500">완료 {doneCount}개 — 목록 탭에서 볼 수 있어요</div>
        )}

        <DropLane
          id="unassigned"
          label="🗃️ 퀘스트 대기소"
          accent="border-zinc-800 bg-zinc-900/30"
          tasks={byLane.unassigned}
          empty="여기로 끌어다 놓으면 시간대가 해제돼요"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {BLOCKS.map((b) => (
            <DropLane
              key={b.id}
              id={b.id}
              label={b.label}
              accent={b.accent}
              tasks={byLane[b.id]}
              empty="여기로 끌어다 놓기"
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? <DraggableTaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
