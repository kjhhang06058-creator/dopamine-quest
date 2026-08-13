'use client';

import { ListChecks, Store, Swords } from 'lucide-react';
import { Tab } from '@/types';

const TABS: { id: Tab; label: string; icon: typeof ListChecks }[] = [
  { id: 'quest', label: '퀘스트', icon: ListChecks },
  { id: 'raid', label: '보스 레이드', icon: Swords },
  { id: 'shop', label: '상점', icon: Store },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="grid grid-cols-3 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex flex-col items-center gap-1 py-3 text-[11px] font-bold uppercase tracking-wide transition ${
            active === id ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </nav>
  );
}
