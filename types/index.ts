export type Difficulty = 'easy' | 'normal' | 'hard';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'pet' | 'weapon';
export type Tab = 'quest' | 'raid' | 'shop';
export type TimeBlock = 'unassigned' | 'morning' | 'afternoon' | 'evening';

/** Reward paired to a single task, unlocked when that task is completed. */
export interface PairedReward {
  id: string;
  title: string;
  isUnlocked: boolean;
  isClaimed: boolean;
}
export type ThemeId = 'default' | 'cyberpunk' | 'darkfantasy' | 'gameboy';

export interface Task {
  id: string;
  title: string;
  difficulty: Difficulty;
  done: boolean;
  createdAt: number;
  /** When the task was completed, used to scope "today's progress" and the completed list. */
  completedAt?: number;
  /** Total steps needed to complete this task. 1 = simple one-click quest (default). */
  target: number;
  /** Steps completed so far, 0..target. */
  progress: number;
  /** Real-world reward the user pre-committed to before starting (e.g. "아이스라떼"). */
  preReward?: string;
  /** Percent of target progress that unlocks the mid-task reward burst. */
  milestonePercent: number;
  /** Whether the milestone reward burst already fired for this task. */
  milestoneFired: boolean;
  /** Scheduler lane. Existing saves predate this field, so readers must default to 'unassigned'. */
  timeBlock?: TimeBlock;
  /** Reward paired to this specific task, unlocked on completion. */
  pairedReward?: PairedReward;
}

export interface MilestoneAlert {
  taskId: string;
  title: string;
  preReward: string;
}

/** A single reward reserved for the whole day, unlocked by overall (not per-task) daily completion %. */
export interface DailyReward {
  title: string;
  milestonePercent: number;
  /** Local 'YYYY-MM-DD' the reward was reserved for. A reward from an earlier day is expired. */
  date: string;
  /** Whether daily progress has crossed milestonePercent (locks in the trigger so it only fires once). */
  fired: boolean;
  /** Whether the player has consumed the reward (+30 HP / EXP buff) after it fired. */
  claimed: boolean;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  rarity: Rarity;
  type: ItemType;
  obtainedAt: number;
}

export type CombatEventKind = 'attack' | 'crit' | 'defeat' | 'hurt' | 'heal' | 'gacha' | 'guard';

export interface CombatEvent {
  id: string;
  kind: CombatEventKind;
  text: string;
}
