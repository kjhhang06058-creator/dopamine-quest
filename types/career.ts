export type CareerTrack = 'public_service' | 'professional' | 'fantasy';

export interface CareerTier {
  /** 1..5, ascending. */
  tierLevel: number;
  title: string;
  /** Cumulative career EXP needed to reach this tier. Tier 1 is always 0. */
  requiredExp: number;
  /** Lucide icon identifier, resolved through ICON_MAP in CareerHud. */
  badgeIcon: string;
  /** Shown as floating text when a task is completed at this tier. */
  actionVerb: string;
  statusLabel: { hp: string; exp: string };
  /** Center-stage visual for this tier — replaces the old wave monster. */
  zoneIcon: string;
  /** What the center stage represents at this tier (e.g. '결재 대기 서류함'). */
  zoneName: string;
  /** Unit the remaining workload is counted in (e.g. '결재', '사건', 'HP'). */
  unitLabel: string;
}

export interface CareerTrackConfig {
  id: CareerTrack;
  label: string;
  emoji: string;
  /** Retro stamp wording used by the promotion modal. */
  promotionStamp: string;
  /** Fired when a 100-point segment is cleared inside a tier (the repeatable loop). */
  segmentVerb: string;
  /** Focus-session (boss raid) wording for this track. */
  raid: { success: string; fail: string; failNote: string };
  /** Focus-session targets by duration ceiling, ascending; the last entry covers anything longer. */
  raidTargets: { maxMinutes: number; name: string; icon: string }[];
  tiers: CareerTier[];
}

export const CAREER_TRACKS: Record<CareerTrack, CareerTrackConfig> = {
  public_service: {
    id: 'public_service',
    label: '공무원',
    emoji: '🏛️',
    promotionStamp: '임용장 수여',
    segmentVerb: '업무 한 건 마무리!',
    raid: {
      success: '업무 완수!',
      fail: '업무 중단...',
      failNote: '집중이 끊겨 오늘 처리분을 놓쳤습니다.',
    },
    raidTargets: [
      { maxMinutes: 5, name: '단순 민원 처리', icon: '📮' },
      { maxMinutes: 10, name: '문서 검토', icon: '📄' },
      { maxMinutes: 15, name: '보고서 작성', icon: '📝' },
      { maxMinutes: 30, name: '결재 라인 처리', icon: '🗂️' },
      { maxMinutes: 60, name: '정책 기획', icon: '🏛️' },
      { maxMinutes: 120, name: '국정감사 대비', icon: '📊' },
      { maxMinutes: Infinity, name: '예산안 마감', icon: '🔥' },
    ],
    tiers: [
      {
        tierLevel: 1,
        title: '수험생',
        requiredExp: 0,
        badgeIcon: 'BookOpen',
        actionVerb: '학습 진도 완료',
        statusLabel: { hp: '멘탈', exp: '학습 진도' },
        zoneIcon: '📚',
        zoneName: '남은 수험 진도',
        unitLabel: '진도',
      },
      {
        tierLevel: 2,
        title: '필기 합격',
        requiredExp: 200,
        badgeIcon: 'FileCheck',
        actionVerb: '면접 준비 완료',
        statusLabel: { hp: '멘탈', exp: '합격 진도' },
        zoneIcon: '📝',
        zoneName: '면접 준비 과제',
        unitLabel: '과제',
      },
      {
        tierLevel: 3,
        title: '시보',
        requiredExp: 600,
        badgeIcon: 'Stamp',
        actionVerb: '업무 인계 완료',
        statusLabel: { hp: '체력', exp: '적응도' },
        zoneIcon: '🗂️',
        zoneName: '인계받은 업무함',
        unitLabel: '업무',
      },
      {
        tierLevel: 4,
        title: '주무관',
        requiredExp: 1200,
        badgeIcon: 'Briefcase',
        actionVerb: '문서 결재 완료',
        statusLabel: { hp: '체력', exp: '실적' },
        zoneIcon: '📋',
        zoneName: '결재 대기 서류함',
        unitLabel: '결재',
      },
      {
        tierLevel: 5,
        title: '5급 사무관',
        requiredExp: 2400,
        badgeIcon: 'Crown',
        actionVerb: '기안 승인!',
        statusLabel: { hp: '체력', exp: '정책 성과' },
        zoneIcon: '🏛️',
        zoneName: '정책 추진 과제',
        unitLabel: '과제',
      },
    ],
  },
  professional: {
    id: 'professional',
    label: '전문직',
    emoji: '⚖️',
    promotionStamp: '자격 취득',
    segmentVerb: '한 건 처리 완료!',
    raid: {
      success: '사건 처리 완료!',
      fail: '수임 실패...',
      failNote: '집중이 끊겨 처리 기한을 놓쳤습니다.',
    },
    raidTargets: [
      { maxMinutes: 5, name: '상담 메모 정리', icon: '📞' },
      { maxMinutes: 10, name: '서류 검토', icon: '📄' },
      { maxMinutes: 15, name: '의견서 작성', icon: '📝' },
      { maxMinutes: 30, name: '사건 기록 검토', icon: '📁' },
      { maxMinutes: 60, name: '변론 준비', icon: '⚖️' },
      { maxMinutes: 120, name: '대형 사건 수임', icon: '🏢' },
      { maxMinutes: Infinity, name: '최종 변론', icon: '🔥' },
    ],
    tiers: [
      {
        tierLevel: 1,
        title: '수험생',
        requiredExp: 0,
        badgeIcon: 'BookOpen',
        actionVerb: '학습 진도 완료',
        statusLabel: { hp: '멘탈', exp: '학습 진도' },
        zoneIcon: '📚',
        zoneName: '남은 수험 진도',
        unitLabel: '진도',
      },
      {
        tierLevel: 2,
        title: '1차 합격',
        requiredExp: 200,
        badgeIcon: 'FileCheck',
        actionVerb: '2차 대비 완료',
        statusLabel: { hp: '멘탈', exp: '합격 진도' },
        zoneIcon: '📝',
        zoneName: '2차 대비 과제',
        unitLabel: '과제',
      },
      {
        tierLevel: 3,
        title: '수습',
        requiredExp: 600,
        badgeIcon: 'Scale',
        actionVerb: '실무 수습 완료',
        statusLabel: { hp: '체력', exp: '숙련도' },
        zoneIcon: '📁',
        zoneName: '수습 배당 사건',
        unitLabel: '사건',
      },
      {
        tierLevel: 4,
        title: '어소시에이트',
        requiredExp: 1200,
        badgeIcon: 'Gavel',
        actionVerb: '의뢰 수임 성공',
        statusLabel: { hp: '체력', exp: '수임 실적' },
        zoneIcon: '⚖️',
        zoneName: '수임 사건 목록',
        unitLabel: '사건',
      },
      {
        tierLevel: 5,
        title: '대표 / 파트너',
        requiredExp: 2400,
        badgeIcon: 'Crown',
        actionVerb: '사건 수임 완료!',
        statusLabel: { hp: '체력', exp: '수임 실적' },
        zoneIcon: '🏢',
        zoneName: '사무소 수임 현황',
        unitLabel: '사건',
      },
    ],
  },
  fantasy: {
    id: 'fantasy',
    label: '판타지',
    emoji: '🎮',
    promotionStamp: '승급 인정',
    segmentVerb: '적을 물리쳤다!',
    raid: {
      success: '보스 처치!',
      fail: '전투 패배...',
      failNote: '집중을 유지하지 못해 큰 피해를 입었습니다.',
    },
    raidTargets: [
      { maxMinutes: 5, name: '꼬마 애벌레', icon: '🐛' },
      { maxMinutes: 10, name: '박쥐 무리', icon: '🦇' },
      { maxMinutes: 15, name: '고블린 대장', icon: '👺' },
      { maxMinutes: 30, name: '해골 기사', icon: '💀' },
      { maxMinutes: 60, name: '트롤 로드', icon: '🧌' },
      { maxMinutes: 120, name: '고대 드래곤', icon: '🐲' },
      { maxMinutes: Infinity, name: '전설의 드래곤', icon: '🐉' },
    ],
    tiers: [
      {
        tierLevel: 1,
        title: '모험가',
        requiredExp: 0,
        badgeIcon: 'Footprints',
        actionVerb: '공격 성공',
        statusLabel: { hp: 'HP', exp: 'EXP' },
        zoneIcon: '🟢',
        zoneName: '슬라임 무리',
        unitLabel: 'HP',
      },
      {
        tierLevel: 2,
        title: '견습 기사',
        requiredExp: 200,
        badgeIcon: 'Shield',
        actionVerb: '강타 명중',
        statusLabel: { hp: 'HP', exp: 'EXP' },
        zoneIcon: '👺',
        zoneName: '고블린 소굴',
        unitLabel: 'HP',
      },
      {
        tierLevel: 3,
        title: '기사',
        requiredExp: 600,
        badgeIcon: 'Swords',
        actionVerb: '크리티컬 히트!',
        statusLabel: { hp: 'HP', exp: 'EXP' },
        zoneIcon: '💀',
        zoneName: '해골 군단',
        unitLabel: 'HP',
      },
      {
        tierLevel: 4,
        title: '기사단장',
        requiredExp: 1200,
        badgeIcon: 'Flame',
        actionVerb: '필살기 작렬!',
        statusLabel: { hp: 'HP', exp: 'EXP' },
        zoneIcon: '🧌',
        zoneName: '늪지 트롤',
        unitLabel: 'HP',
      },
      {
        tierLevel: 5,
        title: '영웅',
        requiredExp: 2400,
        badgeIcon: 'Crown',
        actionVerb: '전설의 일격!!',
        statusLabel: { hp: 'HP', exp: 'EXP' },
        zoneIcon: '🐲',
        zoneName: '고대 드래곤',
        unitLabel: 'HP',
      },
    ],
  },
};

/** EXP per repeatable in-tier segment — the loop that replaced wave clears. */
export const SEGMENT_EXP = 100;

/** Focus-session target for a chosen duration, in the active track's language. */
export function raidTargetFor(track: CareerTrack, minutes: number) {
  const targets = CAREER_TRACKS[track].raidTargets;
  return targets.find((t) => minutes <= t.maxMinutes) ?? targets[targets.length - 1];
}

/** Highest tier whose requiredExp is satisfied by `careerExp` (1-based). */
export function tierForExp(track: CareerTrack, careerExp: number): number {
  const tiers = CAREER_TRACKS[track].tiers;
  let result = 1;
  for (const t of tiers) {
    if (careerExp >= t.requiredExp) result = t.tierLevel;
  }
  return result;
}

export function tierConfig(track: CareerTrack, tierLevel: number): CareerTier {
  const tiers = CAREER_TRACKS[track].tiers;
  return tiers.find((t) => t.tierLevel === tierLevel) ?? tiers[0];
}

/** Progress toward the next tier: 0..1, plus raw numbers for labeling. Maxed tier falls back to segment progress. */
export function tierProgress(track: CareerTrack, careerExp: number) {
  const tiers = CAREER_TRACKS[track].tiers;
  const current = tierForExp(track, careerExp);
  const next = tiers.find((t) => t.tierLevel === current + 1);
  const floor = tierConfig(track, current).requiredExp;

  if (!next) {
    // Max tier: keep a live loop by showing progress through the current 100-point segment.
    const into = (careerExp - floor) % SEGMENT_EXP;
    return { ratio: into / SEGMENT_EXP, into, span: SEGMENT_EXP, remaining: SEGMENT_EXP - into, isMax: true };
  }

  const span = next.requiredExp - floor;
  const into = careerExp - floor;
  return {
    ratio: span > 0 ? Math.min(1, into / span) : 1,
    into,
    span,
    remaining: Math.max(0, next.requiredExp - careerExp),
    isMax: false,
  };
}
