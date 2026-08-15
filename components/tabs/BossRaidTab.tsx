'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Play, Skull, Trophy } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { PixelButton } from '../ui/PixelButton';
import { ProgressBar } from '../ui/ProgressBar';
import { CAREER_TRACKS, raidTargetFor } from '@/types/career';

const PRESET_MINUTES = [5, 10, 15, 30, 60, 120];
const CUSTOM_MIN_MINUTES = 1;
const CUSTOM_MAX_MINUTES = 180;

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

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
  const currentTrack = useGameStore((s) => s.currentTrack);
  const raid = CAREER_TRACKS[currentTrack].raid;

  const [minutes, setMinutes] = useState(15);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');

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

  // Keeps the screen from auto-locking on inactivity while a raid is running, so putting the
  // phone down to read/study doesn't trip an unfair defeat. Can't stop a manual power-button
  // screen-off — no web API exposes that distinction from "switched app", by design (privacy).
  useEffect(() => {
    if (bossStatus !== 'running' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    navigator.wakeLock
      .request('screen')
      .then((s) => {
        if (cancelled) {
          s.release();
          return;
        }
        sentinel = s;
      })
      .catch(() => {
        // Refused (e.g. low battery) — raid still works, screen just may auto-lock.
      });

    return () => {
      cancelled = true;
      sentinel?.release();
    };
  }, [bossStatus]);

  function handleCustomInput(value: string) {
    setCustomInput(value);
    const parsed = Number(value);
    if (value && Number.isFinite(parsed)) {
      setMinutes(Math.max(CUSTOM_MIN_MINUTES, Math.min(CUSTOM_MAX_MINUTES, Math.round(parsed))));
    }
  }

  const canStart = !isCustom || (customInput.trim() !== '' && minutes >= CUSTOM_MIN_MINUTES);

  if (bossStatus === 'running') {
    const boss = raidTargetFor(currentTrack, bossTotalSeconds / 60);
    const pct = 100 - (bossSecondsLeft / bossTotalSeconds) * 100;
    return (
      <div className="flex flex-col items-center gap-6 p-6 text-center">
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-6xl">
          {boss.icon}
        </motion.div>
        <div className="text-sm font-bold text-zinc-300">{boss.name}</div>
        <div className="font-mono text-4xl font-bold text-emerald-300">{formatTime(bossSecondsLeft)}</div>
        <div className="w-full max-w-xs">
          <ProgressBar value={pct} max={100} colorClass="bg-emerald-400" />
        </div>
        <div className="text-[11px] text-rose-400">⚠ 화면이 꺼지거나 다른 앱으로 가면 즉시 패배합니다</div>
        <div className="text-[10px] text-zinc-500">폰을 안 보고 싶다면 화면은 켠 채로 뒤집어 두세요</div>
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
        <div className="text-lg font-bold text-emerald-300">{raid.success}</div>
        <div className="text-xs text-zinc-400">골드와 희귀 전리품을 획득했습니다.</div>
        <PixelButton onClick={resetBoss}>다시 도전</PixelButton>
      </div>
    );
  }

  if (bossStatus === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <Skull className="h-12 w-12 text-rose-400" />
        <div className="text-lg font-bold text-rose-300">{raid.fail}</div>
        <div className="text-xs text-zinc-400">{raid.failNote}</div>
        <PixelButton onClick={resetBoss}>다시 도전</PixelButton>
      </div>
    );
  }

  const previewBoss = raidTargetFor(currentTrack, minutes);

  return (
    <div className="flex flex-col items-center gap-6 p-6 text-center">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">보스 레이드 = 집중 타이머</div>

      <div className="text-5xl">{previewBoss.icon}</div>
      <div className="text-sm font-bold text-zinc-300">{previewBoss.name}</div>

      <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
        정한 시간 동안 이 화면을 벗어나지 마세요.
        <br />
        다른 앱으로 이동하거나 화면이 꺼지면 <span className="text-rose-400">즉시 실패</span>, 끝까지 버티면{' '}
        <span className="text-emerald-400">골드 + 희귀 전리품</span>을 받아요.
      </p>
      <p className="max-w-xs text-[11px] text-zinc-500">
        💡 진행 중엔 화면이 자동으로 꺼지지 않게 잡아둬요. 폰을 안 보고 싶다면 화면은 켠 채로 뒤집어 두세요.
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {PRESET_MINUTES.map((m) => (
          <button
            key={m}
            onClick={() => {
              setMinutes(m);
              setIsCustom(false);
            }}
            className={`rounded border px-3 py-1.5 text-xs font-bold ${
              !isCustom && minutes === m
                ? 'border-emerald-500 bg-emerald-900/50 text-emerald-300'
                : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {formatDuration(m)}
          </button>
        ))}
        <button
          onClick={() => setIsCustom(true)}
          className={`rounded border px-3 py-1.5 text-xs font-bold ${
            isCustom ? 'border-emerald-500 bg-emerald-900/50 text-emerald-300' : 'border-zinc-700 text-zinc-400'
          }`}
        >
          직접 설정
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={CUSTOM_MIN_MINUTES}
            max={CUSTOM_MAX_MINUTES}
            value={customInput}
            onChange={(e) => handleCustomInput(e.target.value)}
            placeholder={`${CUSTOM_MIN_MINUTES}~${CUSTOM_MAX_MINUTES}`}
            className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
          <span className="text-xs text-zinc-400">분</span>
        </div>
      )}

      <PixelButton onClick={() => startBoss(minutes)} disabled={!canStart} className="flex items-center gap-2">
        <Play className="h-4 w-4" /> 보스 레이드 시작
      </PixelButton>
    </div>
  );
}
