'use client';

import { useState } from 'react';
import { Gift, Loader2, Plus } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';
import { MicroQuest, TaskSplitModal } from '../task/TaskSplitModal';
import { Difficulty } from '@/types';
import { DIFFICULTY_META } from './difficultyMeta';

const MILESTONE_OPTIONS = [70, 80, 90];

/** Everything needed to create a quest: title, difficulty, optional goal mode, and the
 * automatic "이 작업, 나눠볼까요?" complexity check. Split out of QuestTab, which had grown
 * past 340 lines and mixed creation, listing, and scheduling concerns in one file. */
export function QuestComposer() {
  const addTask = useGameStore((s) => s.addTask);
  const addBatchTasks = useGameStore((s) => s.addBatchTasks);

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [goalMode, setGoalMode] = useState(false);
  const [target, setTarget] = useState(5);
  const [preReward, setPreReward] = useState('');
  const [milestonePercent, setMilestonePercent] = useState(80);
  const [checkingSplit, setCheckingSplit] = useState(false);
  const [splitSuggestion, setSplitSuggestion] = useState<{ title: string; quests: MicroQuest[] } | null>(null);

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
    // complexity check — never both at once.
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
      // Network hiccup — don't block adding the task, just skip the suggestion this time.
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
    <>
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
              목표 진행 {milestonePercent}%에 도달하면 사전 보상 알림이 뜨고, 목표를 다 채우면 완료 보상까지 받습니다.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
