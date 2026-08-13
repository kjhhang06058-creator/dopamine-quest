import { ItemType, Rarity } from '@/types';

export interface GachaPoolItem {
  id: string;
  name: string;
  icon: string;
  rarity: Rarity;
  type: ItemType;
}

export const GACHA_COST = 50;

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3,
};

const GACHA_POOL: GachaPoolItem[] = [
  { id: 'pet-cat', name: '픽셀 고양이', icon: '🐱', rarity: 'common', type: 'pet' },
  { id: 'pet-hamster', name: '픽셀 햄스터', icon: '🐹', rarity: 'common', type: 'pet' },
  { id: 'weapon-spark', name: '스파크 검기', icon: '✨', rarity: 'common', type: 'weapon' },
  { id: 'pet-fox', name: '픽셀 여우', icon: '🦊', rarity: 'rare', type: 'pet' },
  { id: 'pet-penguin', name: '픽셀 펭귄', icon: '🐧', rarity: 'rare', type: 'pet' },
  { id: 'weapon-flame', name: '화염 참격', icon: '🔥', rarity: 'rare', type: 'weapon' },
  { id: 'weapon-frost', name: '냉기 참격', icon: '❄️', rarity: 'rare', type: 'weapon' },
  { id: 'pet-owl', name: '야행성 부엉이', icon: '🦉', rarity: 'epic', type: 'pet' },
  { id: 'weapon-thunder', name: '뇌전 일격', icon: '⚡', rarity: 'epic', type: 'weapon' },
  { id: 'pet-dragon', name: '아기 드래곤', icon: '🐲', rarity: 'legendary', type: 'pet' },
  { id: 'weapon-void', name: '차원 붕괴', icon: '🌌', rarity: 'legendary', type: 'weapon' },
];

function rollRarity(): Rarity {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const rarity of RARITY_ORDER) {
    acc += RARITY_WEIGHTS[rarity];
    if (roll <= acc) return rarity;
  }
  return 'common';
}

export function pullGacha(guaranteedMinRarity?: Rarity): GachaPoolItem {
  let rarity = rollRarity();
  if (guaranteedMinRarity && RARITY_ORDER.indexOf(rarity) < RARITY_ORDER.indexOf(guaranteedMinRarity)) {
    rarity = guaranteedMinRarity;
  }
  const pool = GACHA_POOL.filter((item) => item.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
