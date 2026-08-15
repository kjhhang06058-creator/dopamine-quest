import { ThemeId } from '@/types';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  icon: string;
  cost: number;
}

/** Purchasable reskins for the app's chrome (background/header/monster zone/bottom nav accent).
 * 'default' isn't listed here — it's always owned and free, handled as a special case in the store. */
export const THEMES: ThemeDef[] = [
  { id: 'cyberpunk', name: '사이버펑크 네온', icon: '🌆', cost: 300 },
  { id: 'darkfantasy', name: '다크 판타지', icon: '🕯️', cost: 300 },
  { id: 'gameboy', name: '게임보이 레트로', icon: '🎮', cost: 250 },
];
