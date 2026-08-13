'use client';

import { motion } from 'framer-motion';
import { Gem, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';
import { GACHA_COST } from '@/lib/gacha';
import { Rarity } from '@/types';

const RARITY_STYLE: Record<Rarity, string> = {
  common: 'border-zinc-600 text-zinc-300',
  rare: 'border-sky-500 text-sky-300',
  epic: 'border-violet-500 text-violet-300',
  legendary: 'border-amber-400 text-amber-300',
};

const PREMIUM_THEMES = [
  { id: 'cyberpunk', name: '사이버펑크 네온', icon: '🌆' },
  { id: 'darkfantasy', name: '다크 판타지', icon: '🕯️' },
  { id: 'gameboy', name: '게임보이 레트로', icon: '🎮' },
];

export function ShopTab() {
  const gold = useGameStore((s) => s.gold);
  const inventory = useGameStore((s) => s.inventory);
  const pullShopGacha = useGameStore((s) => s.pullShopGacha);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col items-center gap-3 rounded border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="text-xs uppercase tracking-wider text-zinc-400">가챠 상자</div>
        <div className="text-4xl">🎁</div>
        <PixelButton onClick={pullShopGacha} disabled={gold < GACHA_COST} className="flex items-center gap-2">
          <Gem className="h-4 w-4" /> {GACHA_COST} 골드로 뽑기
        </PixelButton>
        {gold < GACHA_COST && <div className="text-[11px] text-zinc-500">골드가 부족합니다</div>}
      </div>

      <div>
        <div className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">보유 아이템 ({inventory.length})</div>
        {inventory.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-500">
            아직 획득한 아이템이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {inventory.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex flex-col items-center gap-1 rounded border bg-zinc-900/60 p-2 ${RARITY_STYLE[item.rarity]}`}
                title={item.name}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="truncate text-[9px]">{item.name}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wider text-zinc-500">
          <Sparkles className="h-3.5 w-3.5" /> 프리미엄 테마 (준비 중)
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PREMIUM_THEMES.map((theme) => (
            <div
              key={theme.id}
              className="relative flex flex-col items-center gap-1 rounded border border-zinc-800 bg-zinc-900/40 p-3 opacity-70"
            >
              <span className="text-2xl">{theme.icon}</span>
              <span className="text-center text-[10px] text-zinc-400">{theme.name}</span>
              <span className="absolute right-1 top-1 rounded bg-amber-500/90 px-1 text-[8px] font-bold text-zinc-950">
                PRO
              </span>
              <Lock className="mt-1 h-3 w-3 text-zinc-500" />
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-[10px] text-zinc-600">추후 인앱결제로 제공될 예정입니다</div>
      </div>

      <button
        onClick={() => {
          if (confirm('저장된 모든 진행 상황을 초기화할까요?')) resetGame();
        }}
        className="flex items-center justify-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400"
      >
        <RotateCcw className="h-3 w-3" /> 진행 상황 초기화
      </button>
    </div>
  );
}
