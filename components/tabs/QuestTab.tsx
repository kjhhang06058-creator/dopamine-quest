'use client';

import { useState } from 'react';
import { PrePlannedRewardCard } from '../reward/PrePlannedRewardCard';
import { DndTimeBlockScheduler } from '../scheduler/DndTimeBlockScheduler';
import { QuestComposer } from '../quest/QuestComposer';
import { QuestList } from '../quest/QuestList';
import { CompletedList } from '../quest/CompletedList';

const VIEWS = [
  { id: 'list', label: '목록' },
  { id: 'schedule', label: '시간대' },
] as const;

type View = (typeof VIEWS)[number]['id'];

export function QuestTab() {
  const [view, setView] = useState<View>('list');

  return (
    <div className="flex flex-col gap-4 p-4">
      <PrePlannedRewardCard />

      <QuestComposer />

      <div className="flex gap-1.5 self-start rounded border border-zinc-800 p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`rounded px-2.5 py-1 text-[11px] font-bold transition ${
              view === v.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'schedule' ? <DndTimeBlockScheduler /> : <QuestList />}

      <CompletedList />
    </div>
  );
}
