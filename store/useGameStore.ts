'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CombatEvent, CombatEventKind, DailyReward, Difficulty, InventoryItem, MilestoneAlert, Task } from '@/types';
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
  /** Pending mid-task reward-burst popup, if a task just crossed its milestone. Not persisted. */
  activeMilestone: MilestoneAlert | null;
  /** One-time 1.5x EXP multiplier earned by consuming a milestone reward, applied to the next task completion. Not persisted. */
  expBuffActive: boolean;
  /** Reward reserved for the whole day, unlocked once overall task completion % crosses its milestone. */
  dailyReward: DailyReward | null;
  /** Pending daily-milestone break popup, shown once dailyReward.fired flips true. Not persisted. */
  activeDailyMilestone: boolean;
  /** Timestamp of the last meaningful change, used to resolve which device's save is newer during cloud sync. */
  updatedAt: number;
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
  activeMilestone: null,
  expBuffActive: false,
  dailyReward: null,
  activeDailyMilestone: false,
  updatedAt: 0,
};

const DEFAULT_MILESTONE_PERCENT = 80;

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

interface AddTaskOptions {
  target?: number;
  preReward?: string;
  milestonePercent?: number;
}

interface GameActions {
  addTask: (title: string, difficulty: Difficulty, options?: AddTaskOptions) => void;
  completeTask: (id: string) => void;
  /** Advances a multi-step goal task by one; fires the milestone reward burst and, on reaching target, the normal completion reward. */
  advanceTask: (id: string) => void;
  dismissMilestone: () => void;
  /** Consumes the pending pre-planned reward: heals +30 HP now and arms a one-time 1.5x EXP buff for the next task completion. */
  claimReward: () => void;
  failTask: (id: string) => void;
  deleteTask: (id: string) => void;

  /** Reserves a single reward for the day, unlocked once overall task completion reaches milestonePercent. */
  setDailyReward: (title: string, milestonePercent: number) => void;
  /** Cancels the current daily reward so a new one can be reserved. */
  clearDailyReward: () => void;
  dismissDailyMilestone: () => void;
  /** Consumes the fired daily reward: heals +30 HP now and arms a one-time 1.5x EXP buff for the next task completion. */
  claimDailyReward: () => void;

  startBoss: (minutes: number) => void;
  tickBoss: () => void;
  giveUpBoss: () => void;
  resetBoss: () => void;

  pullShopGacha: () => void;

  pushEvent: (e: { kind: CombatEventKind; text: string }) => void;
  clearEvent: (id: string) => void;

  resetGame: () => void;
  /** Overwrites core save fields from a cloud snapshot (used by cloud sync). Never touches `events`. */
  applyRemoteState: (remote: CoreState) => void;
}

export const useGameStore = create<CoreState & GameActions>()(
  persist(
    (set, get) => {
      /** Shared by claimReward and claimDailyReward — heals +30 HP (capped) and arms the next-completion EXP buff. */
      function grantRewardBonus(label: string) {
        set((s) => ({
          hp: Math.min(s.maxHp, s.hp + 30),
          expBuffActive: true,
          updatedAt: Date.now(),
        }));
        get().pushEvent({ kind: 'heal', text: `+30 HP 회복! (${label})` });
      }

      /** Checks overall task completion % against the reserved daily reward and fires the break popup once, the first time it's crossed. */
      function maybeFireDailyMilestone() {
        const s = get();
        const reward = s.dailyReward;
        if (!reward || reward.fired || s.tasks.length === 0) return;
        const donePercent = (s.tasks.filter((t) => t.done).length / s.tasks.length) * 100;
        if (donePercent >= reward.milestonePercent) {
          set({
            dailyReward: { ...reward, fired: true },
            activeDailyMilestone: true,
            updatedAt: Date.now(),
          });
        }
      }

      /** Shared by completeTask and advanceTask (once a goal's target is reached) — rolls the difficulty reward, damages the monster, and resolves level-ups. */
      function applyTaskCompletion(id: string, finalProgress: number) {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.done) return;
        const reward = rollTaskReward(task.difficulty);
        const buffed = get().expBuffActive;
        const expGain = buffed ? Math.round(reward.exp * 1.5) : reward.exp;

        let leveledUp = false;
        let defeated = false;

        set((s) => {
          const applied = applyExp(s, expGain);
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
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: true, progress: finalProgress } : t)),
            exp: applied.exp,
            level: applied.level,
            maxHp: applied.maxHp,
            hp: applied.hp,
            gold,
            wave,
            monsterHp,
            monsterMaxHp,
            expBuffActive: false,
            updatedAt: Date.now(),
          };
        });

        get().pushEvent({
          kind: reward.crit ? 'crit' : 'attack',
          text: reward.crit ? `크리티컬! +${reward.gold}G` : `+${reward.gold}G`,
        });
        if (buffed) get().pushEvent({ kind: 'heal', text: `EXP 버프 적용! +${expGain} EXP` });
        if (defeated) get().pushEvent({ kind: 'defeat', text: '몬스터 처치!' });
        if (leveledUp) get().pushEvent({ kind: 'heal', text: 'LEVEL UP!' });
        maybeFireDailyMilestone();
      }

      return {
      ...initialState,

      pushEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: uid() }] })),
      clearEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      addTask: (title, difficulty, options) => {
        const target = Math.max(1, Math.round(options?.target ?? 1));
        set((s) => ({
          tasks: [
            {
              id: uid(),
              title,
              difficulty,
              done: false,
              createdAt: Date.now(),
              target,
              progress: 0,
              preReward: options?.preReward,
              milestonePercent: options?.milestonePercent ?? DEFAULT_MILESTONE_PERCENT,
              milestoneFired: false,
            },
            ...s.tasks,
          ],
          updatedAt: Date.now(),
        }));
      },

      completeTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        applyTaskCompletion(id, task.target || 1);
      },

      advanceTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.done) return;
        const target = task.target || 1;
        const nextProgress = Math.min(target, (task.progress || 0) + 1);

        if (nextProgress >= target) {
          applyTaskCompletion(id, nextProgress);
          return;
        }

        const milestonePercent = task.milestonePercent || DEFAULT_MILESTONE_PERCENT;
        const crossedMilestone = !task.milestoneFired && (nextProgress / target) * 100 >= milestonePercent;

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, progress: nextProgress, milestoneFired: t.milestoneFired || crossedMilestone }
              : t,
          ),
          activeMilestone: crossedMilestone
            ? { taskId: task.id, title: task.title, preReward: task.preReward || '보상' }
            : s.activeMilestone,
          updatedAt: Date.now(),
        }));

        get().pushEvent({ kind: 'attack', text: `진행 ${nextProgress}/${target}` });
      },

      dismissMilestone: () => set({ activeMilestone: null }),

      claimReward: () => {
        if (!get().activeMilestone) return;
        grantRewardBonus('목표 보상');
      },

      setDailyReward: (title, milestonePercent) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set({
          dailyReward: { title: trimmed, milestonePercent, fired: false, claimed: false },
          activeDailyMilestone: false,
          updatedAt: Date.now(),
        });
      },

      clearDailyReward: () =>
        set({ dailyReward: null, activeDailyMilestone: false, updatedAt: Date.now() }),

      dismissDailyMilestone: () => set({ activeDailyMilestone: false }),

      claimDailyReward: () => {
        const reward = get().dailyReward;
        if (!reward || !reward.fired || reward.claimed) return;
        grantRewardBonus('일일 보상');
        set((s) => ({
          dailyReward: s.dailyReward ? { ...s.dailyReward, claimed: true } : null,
        }));
      },

      failTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.done) return;
        const dmg = taskFailPenalty(task.difficulty);
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          hp: Math.max(0, s.hp - dmg),
          updatedAt: Date.now(),
        }));
        get().pushEvent({ kind: 'hurt', text: `-${dmg} HP` });
      },

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id), updatedAt: Date.now() })),

      startBoss: (minutes) =>
        set({
          bossStatus: 'running',
          bossSecondsLeft: minutes * 60,
          bossTotalSeconds: minutes * 60,
          updatedAt: Date.now(),
        }),

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
              updatedAt: Date.now(),
            };
          });
          get().pushEvent({ kind: 'defeat', text: `보스 처치! +${reward.gold}G` });
        } else {
          set({ bossSecondsLeft: next });
        }
      },

      giveUpBoss: () => {
        if (get().bossStatus !== 'running') return;
        set((s) => ({
          bossStatus: 'failed',
          hp: Math.max(0, s.hp - BOSS_FAIL_DAMAGE),
          updatedAt: Date.now(),
        }));
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
          updatedAt: Date.now(),
        }));
        get().pushEvent({ kind: 'gacha', text: `${item.icon} ${item.name} 획득!` });
      },

      resetGame: () => set({ ...initialState, events: [], updatedAt: Date.now() }),

      applyRemoteState: (remote) =>
        set({
          ...remote,
          events: [],
          activeMilestone: null,
          expBuffActive: false,
          activeDailyMilestone: false,
        }),
      };
    },
    {
      name: 'dopamine-quest-save',
      partialize: (s) => {
        const { events, activeMilestone, expBuffActive, activeDailyMilestone, ...rest } = s;
        return rest;
      },
    },
  ),
);
