export interface MonsterTemplate {
  name: string;
  icon: string;
  baseHp: number;
}

const MONSTERS: MonsterTemplate[] = [
  { name: '슬라임', icon: '🟢', baseHp: 40 },
  { name: '박쥐', icon: '🦇', baseHp: 55 },
  { name: '고블린', icon: '👺', baseHp: 70 },
  { name: '해골 병사', icon: '💀', baseHp: 90 },
  { name: '늪지 트롤', icon: '🧌', baseHp: 120 },
  { name: '어둠의 마법사', icon: '🧙', baseHp: 150 },
  { name: '용', icon: '🐲', baseHp: 220 },
];

export function monsterForWave(wave: number): MonsterTemplate {
  const idx = Math.min(wave, MONSTERS.length - 1);
  const base = MONSTERS[idx];
  const extraWaves = Math.max(0, wave - (MONSTERS.length - 1));
  const scale = 1 + extraWaves * 0.35;
  return {
    name: extraWaves > 0 ? `${base.name} ★${extraWaves}` : base.name,
    icon: base.icon,
    baseHp: Math.round(base.baseHp * scale),
  };
}
