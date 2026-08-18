'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FlaskConical, Gem, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { GACHA_COST } from '@/lib/gacha';
import { STREAK_SHIELD_COST } from '@/lib/rewards';
import { THEMES } from '@/lib/themes';
import { Rarity, ThemeId } from '@/types';

const RARITY_STYLE: Record<Rarity, string> = {
  common: 'border-zinc-600 text-zinc-300',
  rare: 'border-sky-500 text-sky-300',
  epic: 'border-violet-500 text-violet-300',
  legendary: 'border-amber-400 text-amber-300',
};

const DEFAULT_THEME_CARD = { id: 'default' as ThemeId, name: '기본 테마', icon: '⬛', cost: 0 };

export function ShopTab() {
  const gold = useGameStore((s) => s.gold);
  const inventory = useGameStore((s) => s.inventory);
  const streakShields = useGameStore((s) => s.streakShields);
  const ownedThemes = useGameStore((s) => s.ownedThemes);
  const activeTheme = useGameStore((s) => s.activeTheme);
  const pullShopGacha = useGameStore((s) => s.pullShopGacha);
  const buyStreakShield = useGameStore((s) => s.buyStreakShield);
  const selectTheme = useGameStore((s) => s.selectTheme);
  const resetGame = useGameStore((s) => s.resetGame);

  const [confirmReset, setConfirmReset] = useState(false);

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

      <div className="flex flex-col items-center gap-3 rounded border border-cyan-900/50 bg-cyan-950/10 p-4">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-cyan-400">
          <FlaskConical className="h-3.5 w-3.5" /> 부활의 물약 (스트릭 실드)
        </div>
        <div className="text-4xl">🧪</div>
        <p className="text-center text-[11px] text-zinc-500">
          하루를 통째로 놓쳐도 연속 기록이 끊기지 않게 자동으로 지켜줘요. 보유: {streakShields}개
        </p>
        <PixelButton
          variant="ghost"
          onClick={buyStreakShield}
          disabled={gold < STREAK_SHIELD_COST}
          className="flex items-center gap-2"
        >
          <FlaskConical className="h-4 w-4" /> {STREAK_SHIELD_COST} 골드로 구매
        </PixelButton>
        {gold < STREAK_SHIELD_COST && <div className="text-[11px] text-zinc-500">골드가 부족합니다</div>}
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
          <Sparkles className="h-3.5 w-3.5" /> 프리미엄 테마
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[DEFAULT_THEME_CARD, ...THEMES].map((theme) => {
            const owned = theme.id === 'default' || ownedThemes.includes(theme.id);
            const active = activeTheme === theme.id;
            const affordable = gold >= theme.cost;
            return (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                disabled={!owned && !affordable}
                title={owned ? theme.name : `${theme.name} — ${theme.cost} 골드`}
                className={`relative flex flex-col items-center gap-1 rounded border p-3 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? 'border-emerald-500 bg-emerald-950/30'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'
                }`}
              >
                <span className="text-2xl">{theme.icon}</span>
                <span className="text-center text-[10px] text-zinc-400">{theme.name}</span>
                {active ? (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400">
                    <Check className="h-3 w-3" /> 적용됨
                  </span>
                ) : owned ? (
                  <span className="text-[9px] text-zinc-500">적용하기</span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-300">
                    <Lock className="h-2.5 w-2.5" /> {theme.cost}G
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-center text-[10px] text-zinc-600">
          골드로 구매하면 즉시 적용됩니다. 배경/헤더/하단 메뉴 색상이 바뀌어요.
        </div>
      </div>

      <button
        onClick={() => setConfirmReset(true)}
        className="flex items-center justify-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400"
      >
        <RotateCcw className="h-3 w-3" /> 진행 상황 초기화
      </button>

      <ConfirmDialog
        open={confirmReset}
        title="진행 상황을 초기화할까요?"
        description="레벨, 골드, 퀘스트, 보유 아이템, 커리어 진행도가 모두 사라집니다. 되돌릴 수 없어요."
        confirmLabel="초기화"
        onConfirm={() => {
          resetGame();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
