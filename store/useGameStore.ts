'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CombatEvent,
  CombatEventKind,
  DailyReward,
  Difficulty,
  InventoryItem,
  MilestoneAlert,
  Task,
  ThemeId,
} from '@/types';
import {
  expToNextLevel,
  rollBossReward,
  rollTaskReward,
  taskFailPenalty,
  BOSS_FAIL_DAMAGE,
  STREAK_SHIELD_COST,
  FAIL_STREAK_THRESHOLD,
} from '@/lib/rewards';
import { GACHA_COST, pullGacha } from '@/lib/gacha';
import { THEMES } from '@/lib/themes';
import { CAREER_TRACKS, CareerTrack, SEGMENT_EXP, tierConfig, tierForExp } from '@/types/career';
import { daysBetween, isToday, todayStr } from '@/lib/day';

/** Gold paid for clearing one 100-point career segment, plus a small ramp so later segments pay more. */
const SEGMENT_BONUS_BASE = 18;
const SEGMENT_BONUS_STEP = 2;
/** One-off gold bonus on each promotion. */
const PROMOTION_BONUS_GOLD = 150;

export type BossStatus = 'idle' | 'running' | 'success' | 'failed';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}


interface CoreState {
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  gold: number;
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
  /** Consecutive days (local date) with at least one completed task. 0 until the first completion ever. */
  streakDays: number;
  /** Local 'YYYY-MM-DD' of the last day a task was completed, or null before the first completion. */
  lastActiveDate: string | null;
  /** Owned "부활의 물약" count — auto-consumed to protect streakDays when a day is missed entirely. */
  streakShields: number;
  /** Consecutive 실패 처리 clicks with no completion in between; reset by any completion. Drives the monster-weaken comeback debuff. */
  consecutiveFails: number;
  /** Premium theme ids the player has purchased. 'default' is always implicitly owned. */
  ownedThemes: ThemeId[];
  /** Currently applied app-chrome reskin. */
  activeTheme: ThemeId;
  /** Career flavor track driving HUD labels, action verbs, and promotion tiers. */
  currentTrack: CareerTrack;
  /** Career tier 1..5 within currentTrack. Derived from careerExp, stored so promotions fire exactly once. */
  currentTier: number;
  /** Cumulative EXP that never resets on level-up — the promotion ladder reads this, not `exp`. */
  careerExp: number;
  /** Number of 100-point career segments already paid out (the repeatable loop that replaced waves). */
  careerSegment: number;
  /** Pending promotion celebration (tier just reached). Not persisted. */
  pendingPromotion: number | null;
  /** Timestamp of the last meaningful change, used to resolve which device's save is newer during cloud sync. */
  updatedAt: number;
}

const initialState: CoreState = {
  level: 1,
  exp: 0,
  hp: 100,
  maxHp: 100,
  gold: 20,
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
  streakDays: 0,
  lastActiveDate: null,
  streakShields: 0,
  consecutiveFails: 0,
  ownedThemes: [],
  activeTheme: 'default',
  currentTrack: 'public_service',
  currentTier: 1,
  careerExp: 0,
  careerSegment: 0,
  pendingPromotion: null,
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

export interface TaskInput {
  title: string;
  difficulty: Difficulty;
  options?: AddTaskOptions;
}

interface GameActions {
  addTask: (title: string, difficulty: Difficulty, options?: AddTaskOptions) => void;
  /** Adds several tasks in a single render/state update (e.g. AI quest decomposition accept-all). */
  addBatchTasks: (tasks: TaskInput[]) => void;
  completeTask: (id: string) => void;
  /** Advances a multi-step goal task by one; fires the milestone reward burst and, on reaching target, the normal completion reward. */
  advanceTask: (id: string) => void;
  dismissMilestone: () => void;
  /** Consumes the pending pre-planned reward: heals +30 HP now and arms a one-time 1.5x EXP buff for the next task completion. */
  claimReward: () => void;
  failTask: (id: string) => void;
  deleteTask: (id: string) => void;
  /** Renames a task in place. Ignores blank titles so a mistyped entry can't be wiped to nothing. */
  editTask: (id: string, title: string) => void;
  /** Clears finished tasks so the completed list doesn't grow without bound. */
  clearCompleted: () => void;

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
  /** Buys one streak shield ("부활의 물약") for STREAK_SHIELD_COST gold. */
  buyStreakShield: () => void;
  /** Equips a theme. Buys it first (deducting gold) if not already owned; 'default' is always free. No-op if unowned and gold is insufficient. */
  selectTheme: (id: ThemeId) => void;

  /** Switches career flavor. Re-derives the tier for the new track from existing careerExp (no progress is lost). */
  setCareerTrack: (track: CareerTrack) => void;
  /** Dismisses the promotion celebration modal. */
  dismissPromotion: () => void;

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
        if (!reward || reward.fired || reward.date !== todayStr()) return;
        // Today's set = still-pending tasks + tasks finished today. Counting every task ever
        // completed used to let a week-old backlog fire the reward before any work happened today.
        const todays = s.tasks.filter((t) => !t.done || isToday(t.completedAt));
        if (todays.length === 0) return;
        const donePercent = (todays.filter((t) => t.done).length / todays.length) * 100;
        if (donePercent >= reward.milestonePercent) {
          set({
            dailyReward: { ...reward, fired: true },
            activeDailyMilestone: true,
            updatedAt: Date.now(),
          });
        }
      }

      /** Called on every successful task completion. Advances streakDays once per local day; if a full day (or more)
       * was missed, auto-consumes a streak shield to protect the streak when one is held, otherwise resets to 1
       * without further punishment (anti-guilt: a missed day should never cost more than the streak itself). */
      function touchStreak() {
        const s = get();
        const today = todayStr();
        if (s.lastActiveDate === today) return;

        if (!s.lastActiveDate) {
          set({ streakDays: 1, lastActiveDate: today, updatedAt: Date.now() });
          return;
        }

        const gap = daysBetween(s.lastActiveDate, today);
        if (gap === 1) {
          set((st) => ({ streakDays: st.streakDays + 1, lastActiveDate: today, updatedAt: Date.now() }));
        } else if (s.streakShields > 0) {
          set((st) => ({
            streakShields: st.streakShields - 1,
            streakDays: st.streakDays + 1,
            lastActiveDate: today,
            updatedAt: Date.now(),
          }));
          get().pushEvent({ kind: 'guard', text: `🛡️ 스트릭 실드 발동! 연속 ${get().streakDays}일 유지` });
        } else {
          set({ streakDays: 1, lastActiveDate: today, updatedAt: Date.now() });
          get().pushEvent({ kind: 'hurt', text: '스트릭이 끊겼어요. 오늘부터 다시 시작해봐요!' });
        }
      }

      /** Adds cumulative career EXP, pays out the repeatable segment bonus, and fires the promotion
       * modal once per tier crossed. Segments replaced the old wave-clear loop: promotions alone
       * only happen 4 times ever, which would have starved the gold economy. */
      function grantCareerExp(amount: number) {
        const s = get();
        const nextExp = s.careerExp + amount;
        const nextTier = tierForExp(s.currentTrack, nextExp);
        const promoted = nextTier > s.currentTier;

        // Saves written before careerSegment existed would otherwise back-pay every past segment
        // at once, so the baseline is floored to whatever careerExp already implies.
        const baseSegment = Math.max(s.careerSegment, Math.floor(s.careerExp / SEGMENT_EXP));
        const nextSegment = Math.floor(nextExp / SEGMENT_EXP);
        const segmentsCleared = Math.max(0, nextSegment - baseSegment);
        let bonusGold = 0;
        for (let i = 1; i <= segmentsCleared; i++) {
          bonusGold += SEGMENT_BONUS_BASE + (baseSegment + i) * SEGMENT_BONUS_STEP;
        }
        if (promoted) bonusGold += PROMOTION_BONUS_GOLD;

        set({
          careerExp: nextExp,
          currentTier: nextTier,
          careerSegment: nextSegment,
          gold: s.gold + bonusGold,
          pendingPromotion: promoted ? nextTier : s.pendingPromotion,
          updatedAt: Date.now(),
        });

        if (segmentsCleared > 0) {
          get().pushEvent({
            kind: 'defeat',
            text: `${CAREER_TRACKS[s.currentTrack].segmentVerb} +${bonusGold - (promoted ? PROMOTION_BONUS_GOLD : 0)}G`,
          });
        }
        if (promoted) {
          get().pushEvent({
            kind: 'heal',
            text: `승급! ${tierConfig(s.currentTrack, nextTier).title} (+${PROMOTION_BONUS_GOLD}G)`,
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

        set((s) => {
          const applied = applyExp(s, expGain);
          leveledUp = applied.leveledUp;

          return {
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, done: true, progress: finalProgress, completedAt: Date.now() } : t,
            ),
            exp: applied.exp,
            level: applied.level,
            maxHp: applied.maxHp,
            hp: applied.hp,
            gold: s.gold + reward.gold,
            expBuffActive: false,
            consecutiveFails: 0,
            updatedAt: Date.now(),
          };
        });

        // Floating text speaks in the active career's language ("문서 결재 완료 (+30점)" 등).
        const verb = tierConfig(get().currentTrack, get().currentTier).actionVerb;
        get().pushEvent({
          kind: reward.crit ? 'crit' : 'attack',
          text: reward.crit
            ? `${verb} 대성공! (+${reward.gold}점)`
            : `${verb} (+${reward.gold}점)`,
        });
        if (buffed) get().pushEvent({ kind: 'heal', text: `EXP 버프 적용! +${expGain} EXP` });
        if (leveledUp) get().pushEvent({ kind: 'heal', text: 'LEVEL UP!' });
        maybeFireDailyMilestone();
        touchStreak();
        grantCareerExp(expGain);
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

      addBatchTasks: (tasks) => {
        if (tasks.length === 0) return;
        const now = Date.now();
        const newTasks: Task[] = tasks.map((t) => ({
          id: uid(),
          title: t.title,
          difficulty: t.difficulty,
          done: false,
          createdAt: now,
          target: Math.max(1, Math.round(t.options?.target ?? 1)),
          progress: 0,
          preReward: t.options?.preReward,
          milestonePercent: t.options?.milestonePercent ?? DEFAULT_MILESTONE_PERCENT,
          milestoneFired: false,
        }));
        set((s) => ({ tasks: [...newTasks, ...s.tasks], updatedAt: now }));
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
          dailyReward: { title: trimmed, milestonePercent, date: todayStr(), fired: false, claimed: false },
          activeDailyMilestone: false,
          updatedAt: Date.now(),
        });
      },

      clearDailyReward: () =>
        set({ dailyReward: null, activeDailyMilestone: false, updatedAt: Date.now() }),

      dismissDailyMilestone: () => set({ activeDailyMilestone: false }),

      claimDailyReward: () => {
        const reward = get().dailyReward;
        if (!reward || !reward.fired || reward.claimed || reward.date !== todayStr()) return;
        grantRewardBonus('일일 보상');
        set((s) => ({
          dailyReward: s.dailyReward ? { ...s.dailyReward, claimed: true } : null,
        }));
      },

      failTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.done) return;
        const dmg = taskFailPenalty(task.difficulty);
        const nextFails = get().consecutiveFails + 1;
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          hp: Math.max(0, s.hp - dmg),
          consecutiveFails: nextFails,
          updatedAt: Date.now(),
        }));
        get().pushEvent({ kind: 'hurt', text: `-${dmg} HP` });

        // Anti-guilt comeback: with no monster HP left to shave, the lowered hurdle is now a
        // guaranteed 1.5x EXP buff on the next completion — same intent, and not farmable for gold.
        if (nextFails === FAIL_STREAK_THRESHOLD) {
          set({ expBuffActive: true });
          get().pushEvent({ kind: 'guard', text: '😮‍💨 잠시 쉬어가도 괜찮아요! 다음 완료 EXP 1.5배' });
        }
      },

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id), updatedAt: Date.now() })),

      editTask: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t)),
          updatedAt: Date.now(),
        }));
      },

      clearCompleted: () =>
        set((s) => ({ tasks: s.tasks.filter((t) => !t.done), updatedAt: Date.now() })),

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
          get().pushEvent({
            kind: 'defeat',
            text: `${CAREER_TRACKS[get().currentTrack].raid.success} +${reward.gold}G`,
          });
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
        get().pushEvent({
          kind: 'hurt',
          text: `${CAREER_TRACKS[get().currentTrack].raid.fail} -${BOSS_FAIL_DAMAGE} HP`,
        });
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

      buyStreakShield: () => {
        if (get().gold < STREAK_SHIELD_COST) return;
        set((s) => ({
          gold: s.gold - STREAK_SHIELD_COST,
          streakShields: s.streakShields + 1,
          updatedAt: Date.now(),
        }));
        get().pushEvent({ kind: 'guard', text: '🧪 부활의 물약 획득!' });
      },

      selectTheme: (id) => {
        if (id === 'default' || get().ownedThemes.includes(id)) {
          set({ activeTheme: id, updatedAt: Date.now() });
          return;
        }
        const def = THEMES.find((t) => t.id === id);
        if (!def || get().gold < def.cost) return;
        set((s) => ({
          gold: s.gold - def.cost,
          ownedThemes: [...s.ownedThemes, id],
          activeTheme: id,
          updatedAt: Date.now(),
        }));
        get().pushEvent({ kind: 'guard', text: `${def.icon} ${def.name} 테마 잠금 해제!` });
      },

      setCareerTrack: (track) => {
        // careerExp is shared across tracks, so switching re-derives the tier instead of resetting progress.
        set((s) => ({
          currentTrack: track,
          currentTier: tierForExp(track, s.careerExp),
          updatedAt: Date.now(),
        }));
      },

      dismissPromotion: () => set({ pendingPromotion: null }),

      resetGame: () => set({ ...initialState, events: [], updatedAt: Date.now() }),

      applyRemoteState: (remote) =>
        set({
          ...remote,
          events: [],
          activeMilestone: null,
          expBuffActive: false,
          activeDailyMilestone: false,
          pendingPromotion: null,
        }),
      };
    },
    {
      name: 'dopamine-quest-save',
      partialize: (s) => {
        const { events, activeMilestone, expBuffActive, activeDailyMilestone, pendingPromotion, ...rest } = s;
        return rest;
      },
    },
  ),
);
