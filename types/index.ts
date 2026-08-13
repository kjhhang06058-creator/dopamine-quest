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
