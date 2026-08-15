'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, Flame, Gift, Loader2, Plus, Trash2 } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';
import { DopamineBar } from '../ui/DopamineBar';
import { PrePlannedRewardCard } from '../reward/PrePlannedRewardCard';
import { MicroQuest, TaskSplitModal } from '../task/TaskSplitModal';
import { Difficulty } from '@/types';

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '쉬움', color: 'text-emerald-400 border-emerald-700' },
  normal: { label: '보통', color: 'text-amber-400 border-amber-700' },
  hard: { label: '어려움', color: 'text-rose-400 border-rose-700' },
};

const MILESTONE_OPTIONS = [70, 80, 90];

export function QuestTab() {
  const tasks = useGameStore((s) => s.tasks);
  const addTask = useGameStore((s) => s.addTask);
  const addBatchTasks = useGameStore((s) => s.addBatchTasks);
  const completeTask = useGameStore((s) => s.completeTask);
  const advanceTask = useGameStore((s) => s.advanceTask);
  const failTask = useGameStore((s) => s.failTask);
  const deleteTask = useGameStore((s) => s.deleteTask);
  const editTask = useGameStore((s) => s.editTask);
  const clearCompleted = useGameStore((s) => s.clearCompleted);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [goalMode, setGoalMode] = useState(false);
  const [target, setTarget] = useState(5);
  const [preReward, setPreReward] = useState('');
  const [milestonePercent, setMilestonePercent] = useState(80);
  const [checkingSplit, setCheckingSplit] = useState(false);
  const [splitSuggestion, setSplitSuggestion] = useState<{ title: string; quests: MicroQuest[] } | null>(null);

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  async function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (goalMode) {
      const rewardTrimmed = preReward.trim();
      if (!rewardTrimmed) return;
      addTask(trimmed, difficulty, { target, preReward: rewardTrimmed, milestonePercent });
      setTitle('');
      setPreReward('');
      return;
    }

    // Goal mode already IS an explicit multi-step setup, so only single-shot quests get the
    // "이렇게 나눠볼까요?" complexity check — never both at once.
    setCheckingSplit(true);
    try {
      const res = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: trimmed }),
      });
      const data = res.ok ? ((await res.json()) as { complex: boolean; quests: MicroQuest[] }) : null;
      if (data?.complex) {
        setSplitSuggestion({ title: trimmed, quests: data.quests });
        return;
      }
    } catch {
      // Network hiccup — don't block adding the task, just skip the split suggestion this time.
    } finally {
      setCheckingSplit(false);
    }

    addTask(trimmed, difficulty);
    setTitle('');
  }

  function handleAcceptSplit() {
    if (!splitSuggestion) return;
    addBatchTasks(splitSuggestion.quests.map((q) => ({ title: q.title, difficulty: q.difficulty as Difficulty })));
    setSplitSuggestion(null);
    setTitle('');
  }

  function handleKeepSingle() {
    if (!splitSuggestion) return;
    addTask(splitSuggestion.title, difficulty);
    setSplitSuggestion(null);
    setTitle('');
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PrePlannedRewardCard />

      <TaskSplitModal suggestion={splitSuggestion} onAcceptSplit={handleAcceptSplit} onKeepSingle={handleKeepSingle} />

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !goalMode && !e.nativeEvent.isComposing && handleAdd()}
            placeholder="오늘의 퀘스트를 입력하세요"
            disabled={checkingSplit}
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 disabled:opacity-60"
          />
          <PixelButton onClick={handleAdd} disabled={checkingSplit} className="flex items-center gap-1">
            {checkingSplit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} 추가
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

        <button
          onClick={() => setGoalMode((v) => !v)}
          className={`flex items-center gap-1.5 self-start rounded border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
            goalMode
              ? 'border-amber-500 bg-amber-900/30 text-amber-300'
              : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Gift className="h-3.5 w-3.5" /> 목표 모드 {goalMode ? 'ON' : 'OFF'}
        </button>

        {goalMode && (
          <div className="flex flex-col gap-2 rounded border border-amber-800/40 bg-amber-950/10 p-3">
            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-[11px] text-zinc-400">목표 횟수</label>
              <input
                type="number"
                min={2}
                max={99}
                value={target}
                onChange={(e) => setTarget(Math.max(2, Math.min(99, Number(e.target.value) || 2)))}
                className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-[11px] text-zinc-400">사전 보상</label>
              <input
                value={preReward}
                onChange={(e) => setPreReward(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleAdd()}
                placeholder="예: 아이스라떼, 게임 1시간"
                className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 text-[11px] text-zinc-400">마일스톤</label>
              <div className="flex gap-1.5">
                {MILESTONE_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setMilestonePercent(p)}
                    className={`rounded border px-2 py-0.5 text-[11px] font-bold ${
                      milestonePercent === p
                        ? 'border-amber-500 bg-amber-900/40 text-amber-300'
                        : 'border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">
              목표 진행 {milestonePercent}%에 도달하면 사전 보상 알림이 뜨고, 목표를 다 채우면 완료 보상까지
              받습니다.
            </p>
          </div>
        )}
      </div>

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
                        title="완료 (공격!)"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
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
        {pending.length === 0 && (
          <div className="rounded border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-500">
            대기 중인 퀘스트가 없습니다. 새 퀘스트를 추가해보세요!
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div className="flex flex-col gap-1 opacity-60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">완료됨 ({done.length})</span>
            <button
              onClick={() => clearCompleted()}
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
