'use client';

import { useState } from 'react';
import { Hud } from '@/components/Hud';
import { MonsterZone } from '@/components/MonsterZone';
import { BottomNav } from '@/components/BottomNav';
import { FloatingTexts } from '@/components/FloatingTexts';
import { ScreenEffects } from '@/components/ScreenEffects';
import { RewardBurstModal } from '@/components/RewardBurstModal';
import { MilestoneBreakModal } from '@/components/reward/MilestoneBreakModal';
import { QuestTab } from '@/components/tabs/QuestTab';
import { BossRaidTab } from '@/components/tabs/BossRaidTab';
import { ShopTab } from '@/components/tabs/ShopTab';
import { Tab } from '@/types';

export default function Home() {
  const [tab, setTab] = useState<Tab>('quest');

  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col bg-zinc-950 text-zinc-100">
      <ScreenEffects />
      <RewardBurstModal />
      <MilestoneBreakModal />
      <Hud />
      <div className="relative border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <FloatingTexts />
        <MonsterZone />
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'quest' && <QuestTab />}
        {tab === 'raid' && <BossRaidTab />}
        {tab === 'shop' && <ShopTab />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </main>
  );
}
