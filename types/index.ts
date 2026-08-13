export type Difficulty = 'easy' | 'normal' | 'hard';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'pet' | 'weapon';
export type Tab = 'quest' | 'raid' | 'shop';

export interface Task {
  id: string;
  title: string;
  difficulty: Difficulty;
  done: boolean;
  createdAt: number;
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
}

export interface MilestoneAlert {
  taskId: string;
  title: string;
  preReward: string;
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

export type CombatEventKind = 'attack' | 'crit' | 'defeat' | 'hurt' | 'heal' | 'gacha';

export interface CombatEvent {
  id: string;
  kind: CombatEventKind;
  text: string;
}
