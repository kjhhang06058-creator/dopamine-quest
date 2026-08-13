'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CombatEvent, CombatEventKind, Difficulty, InventoryItem, Task } from '@/types';
import {
  expToNextLevel,
  rollBossReward,
  rollTaskReward,
  taskFailPenalty,
  BOSS_FAIL_DAMAGE,
} from '@/lib/rewards';
import { GACHA_COST, pullGacha } from '@/lib/gacha';
import { monsterForWave } from '@/lib/monsters';

export type BossStatus = 'idle' | 'running' | 'success' | 'failed';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const initialMonster = monsterForWave(0);

interface CoreState {
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  gold: number;
  wave: number;
  monsterHp: number;
  monsterMaxHp: number;
  tasks: Task[];
  inventory: InventoryItem[];
  bossStatus: BossStatus;
  bossSecondsLeft: number;
  bossTotalSeconds: number;
  events: CombatEvent[];
}

const initialState: CoreState = {
  level: 1,
  exp: 0,
  hp: 100,
  maxHp: 100,
  gold: 20,
  wave: 0,
  monsterHp: initialMonster.baseHp,
  monsterMaxHp: initialMonster.baseHp,
  tasks: [],
  inventory: [],
  bossStatus: 'idle',
  bossSecondsLeft: 0,
  bossTotalSeconds: 0,
  events: [],
};

/** Applies exp gain and resolves any level-ups (full heal + higher max HP on level up). */
function applyExp(
  base: { exp: number; level: number; maxHp: number; hp: number },
  amount: number,
) {
  let { exp, level, maxHp, hp } = base;
  exp += amount;
  let leveledUp = false;
  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level);
    level += 1;
    maxHp += 10;
    hp = maxHp;
    leveledUp = true;
  }
  return { exp, level, maxHp, hp, leveledUp };
}

interface GameActions {
  addTask: (title: string, difficulty: Difficulty) => void;
  completeTask: (id: string) => void;
  failTask: (id: string) => void;
  deleteTask: (id: string) => void;

  startBoss: (minutes: number) => void;
  tickBoss: () => void;
  giveUpBoss: () => void;
  resetBoss: () => void;

  pullShopGacha: () => void;

  pushEvent: (e: { kind: CombatEventKind; text: string }) => void;
  clearEvent: (id: string) => void;

  resetGame: () => void;
}

export const useGameStore = create<CoreState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      pushEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: uid() }] })),
      clearEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      addTask: (title, difficulty) =>
        set((s) => ({
          tasks: [{ id: uid(), title, difficulty, done: false, createdAt: Date.now() }, ...s.tasks],
        })),

      completeTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.done) return;
        const reward = rollTaskReward(task.difficulty);

        let leveledUp = false;
        let defeated = false;

        set((s) => {
          const applied = applyExp(s, reward.exp);
          leveledUp = applied.leveledUp;

          let { gold, wave, monsterHp, monsterMaxHp } = s;
          gold += reward.gold;
          monsterHp = Math.max(0, monsterHp - reward.damage);

          if (monsterHp <= 0) {
            defeated = true;
            wave += 1;
            const next = monsterForWave(wave);
            monsterHp = next.baseHp;
            monsterMaxHp = next.baseHp;
            gold += 15 + wave * 3;
          }

          return {
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: true } : t)),
            exp: applied.exp,
            level: applied.level,
            maxHp: applied.maxHp,
            hp: applied.hp,
            gold,
            wave,
            monsterHp,
            monsterMaxHp,
          };
        });

        get().pushEvent({
          kind: reward.crit ? 'crit' : 'attack',
          text: reward.crit ? `크리티컬! +${reward.gold}G` : `+${reward.gold}G`,
        });
        if (defeated) get().pushEvent({ kind: 'defeat', text: '몬스터 처치!' });
        if (leveledUp) get().pushEvent({ kind: 'heal', text: 'LEVEL UP!' });
      },

      failTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.done) return;
        const dmg = taskFailPenalty(task.difficulty);
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          hp: Math.max(0, s.hp - dmg),
        }));
        get().pushEvent({ kind: 'hurt', text: `-${dmg} HP` });
      },

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      startBoss: (minutes) =>
        set({ bossStatus: 'running', bossSecondsLeft: minutes * 60, bossTotalSeconds: minutes * 60 }),

      tickBoss: () => {
        const s = get();
        if (s.bossStatus !== 'running') return;
        const next = s.bossSecondsLeft - 1;

        if (next <= 0) {
          const reward = rollBossReward(s.bossTotalSeconds / 60);
          const loot = pullGacha('epic');
          set((st) => {
            const applied = applyExp(st, reward.exp);
            return {
              bossStatus: 'success',
              bossSecondsLeft: 0,
              exp: applied.exp,
              level: applied.level,
              maxHp: applied.maxHp,
              hp: applied.hp,
              gold: st.gold + reward.gold,
              inventory: [
                {
                  id: uid(),
                  itemId: loot.id,
                  name: loot.name,
                  icon: loot.icon,
                  rarity: loot.rarity,
                  type: loot.type,
                  obtainedAt: Date.now(),
                },
                ...st.inventory,
              ],
            };
          });
          get().pushEvent({ kind: 'defeat', text: `보스 처치! +${reward.gold}G` });
        } else {
          set({ bossSecondsLeft: next });
        }
      },

      giveUpBoss: () => {
        if (get().bossStatus !== 'running') return;
        set((s) => ({ bossStatus: 'failed', hp: Math.max(0, s.hp - BOSS_FAIL_DAMAGE) }));
        get().pushEvent({ kind: 'hurt', text: `보스에게 당함! -${BOSS_FAIL_DAMAGE} HP` });
      },

      resetBoss: () => set({ bossStatus: 'idle', bossSecondsLeft: 0, bossTotalSeconds: 0 }),

      pullShopGacha: () => {
        if (get().gold < GACHA_COST) return;
        const item = pullGacha();
        set((s) => ({
          gold: s.gold - GACHA_COST,
          inventory: [
            {
              id: uid(),
              itemId: item.id,
              name: item.name,
              icon: item.icon,
              rarity: item.rarity,
              type: item.type,
              obtainedAt: Date.now(),
            },
            ...s.inventory,
          ],
        }));
        get().pushEvent({ kind: 'gacha', text: `${item.icon} ${item.name} 획득!` });
      },

      resetGame: () => set({ ...initialState, events: [] }),
    }),
    {
      name: 'dopamine-quest-save',
      partialize: (s) => {
        const { events, ...rest } = s;
        return rest;
      },
    },
  ),
);
