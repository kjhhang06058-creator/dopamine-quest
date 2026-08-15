'use client';

import { useState } from 'react';
import { Hud } from '@/components/Hud';
import { CareerZone } from '@/components/CareerZone';
import { BottomNav } from '@/components/BottomNav';
import { FloatingTexts } from '@/components/FloatingTexts';
import { ScreenEffects } from '@/components/ScreenEffects';
import { RewardBurstModal } from '@/components/RewardBurstModal';
import { MilestoneBreakModal } from '@/components/reward/MilestoneBreakModal';
import { CareerHud } from '@/components/hud/CareerHud';
import { PromotionModal } from '@/components/hud/PromotionModal';
import { QuestTab } from '@/components/tabs/QuestTab';
import { BossRaidTab } from '@/components/tabs/BossRaidTab';
import { ShopTab } from '@/components/tabs/ShopTab';
import { Tab } from '@/types';
import { useGameStore } from '@/store/useGameStore';

export default function Home() {
  const [tab, setTab] = useState<Tab>('quest');
  const activeTheme = useGameStore((s) => s.activeTheme);

  return (
    <main
      data-theme={activeTheme}
      className="mx-auto flex h-dvh max-w-md flex-col bg-[var(--theme-bg-to)] text-zinc-100"
    >
      <ScreenEffects />
      <RewardBurstModal />
      <MilestoneBreakModal />
      <PromotionModal />
      <Hud />
      <CareerHud />
      <div className="relative border-b border-[var(--theme-border)] bg-gradient-to-b from-[var(--theme-bg-from)] to-[var(--theme-bg-to)]">
        <FloatingTexts />
        <CareerZone />
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
