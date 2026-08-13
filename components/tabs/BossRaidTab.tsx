'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Play, Skull, Trophy } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';
import { ProgressBar } from '../ui/ProgressBar';

const DURATIONS = [5, 15, 25, 45];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export function BossRaidTab() {
  const bossStatus = useGameStore((s) => s.bossStatus);
  const bossSecondsLeft = useGameStore((s) => s.bossSecondsLeft);
  const bossTotalSeconds = useGameStore((s) => s.bossTotalSeconds);
  const startBoss = useGameStore((s) => s.startBoss);
  const tickBoss = useGameStore((s) => s.tickBoss);
  const giveUpBoss = useGameStore((s) => s.giveUpBoss);
  const resetBoss = useGameStore((s) => s.resetBoss);

  const [minutes, setMinutes] = useState(25);

  useEffect(() => {
    if (bossStatus !== 'running') return;
    const id = setInterval(() => tickBoss(), 1000);
    return () => clearInterval(id);
  }, [bossStatus, tickBoss]);

  useEffect(() => {
    function onVisibility() {
      if (document.hidden && useGameStore.getState().bossStatus === 'running') {
        giveUpBoss();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [giveUpBoss]);

  if (bossStatus === 'running') {
    const pct = 100 - (bossSecondsLeft / bossTotalSeconds) * 100;
    return (
      <div className="flex flex-col items-center gap-6 p-6 text-center">
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-6xl">
          🐲
        </motion.div>
        <div className="font-mono text-4xl font-bold text-emerald-300">{formatTime(bossSecondsLeft)}</div>
        <div className="w-full max-w-xs">
          <ProgressBar value={pct} max={100} colorClass="bg-emerald-400" />
        </div>
        <div className="text-[11px] text-rose-400">⚠ 화면을 벗어나면 즉시 패배합니다</div>
        <PixelButton variant="danger" onClick={giveUpBoss} className="flex items-center gap-2">
          <Flag className="h-4 w-4" /> 포기하기
        </PixelButton>
      </div>
    );
  }

  if (bossStatus === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <Trophy className="h-12 w-12 text-amber-400" />
        <div className="text-lg font-bold text-emerald-300">보스 처치!</div>
        <div className="text-xs text-zinc-400">골드와 희귀 전리품을 획득했습니다.</div>
        <PixelButton onClick={resetBoss}>다시 도전</PixelButton>
      </div>
    );
  }

  if (bossStatus === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <Skull className="h-12 w-12 text-rose-400" />
        <div className="text-lg font-bold text-rose-300">전투 패배...</div>
        <div className="text-xs text-zinc-400">집중을 유지하지 못해 큰 피해를 입었습니다.</div>
        <PixelButton onClick={resetBoss}>다시 도전</PixelButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 text-center">
      <div className="text-5xl">🐲</div>
      <div className="text-sm text-zinc-300">
        집중 타이머가 끝날 때까지 화면을 벗어나면 즉시 전투 패배! 완주하면 골드와 희귀 전리품을 얻습니다.
      </div>
      <div className="flex gap-2">
        {DURATIONS.map((m) => (
          <button
            key={m}
            onClick={() => setMinutes(m)}
            className={`rounded border px-3 py-1.5 text-xs font-bold ${
              minutes === m ? 'border-emerald-500 bg-emerald-900/50 text-emerald-300' : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {m}분
          </button>
        ))}
      </div>
      <PixelButton onClick={() => startBoss(minutes)} className="flex items-center gap-2">
        <Play className="h-4 w-4" /> 보스 레이드 시작
      </PixelButton>
    </div>
  );
}
