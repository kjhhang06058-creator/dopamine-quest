# Dopamine Quest — CLAUDE.md

이 파일은 Claude Code가 이 저장소를 열 때 자동으로 읽는 프로젝트 컨텍스트입니다. 다른 기기(집/사무실 랩탑)에서 Claude Code로 이 프로젝트를 열면, 이 파일 덕분에 처음부터 다시 설명할 필요 없이 지금까지의 결정과 구조를 바로 이해합니다.

**상태를 더 자세히 보려면 [`ROADMAP.md`](./ROADMAP.md)를 먼저 읽으세요** — 완료된 것/다음 후보/의도적으로 보류한 것이 표로 정리되어 있습니다. 이 파일은 "어떻게 만들어져 있는지"에 집중합니다.

## 프로젝트 한 줄 요약

ADHD 사용자를 위한 RPG 스타일 게이미피케이션 할 일 관리 앱. 퀘스트(할 일) 완료 → 몬스터 공격 + 변동성 보상, 뽀모도로 → 보스 레이드, 골드 → 가챠 상점. `seoul-local-pulse`(다른 프로젝트)와는 완전히 분리된 별도 GitHub 저장소.

- GitHub: https://github.com/kjhhang06058-creator/dopamine-quest (main 브랜치에 바로 커밋해왔음, PR 없이)
- Vercel 배포: 진행됨 (`dopamine-quest-lmdrjasxy-123-415d.vercel.app` — 사용자가 직접 확인 필요, Claude 세션 쪽에서는 네트워크 정책상 이 도메인에 접근 불가해서 검증 못함)
- Supabase 프로젝트: 생성됨, URL `https://grkslbzluzyqsotzpzfh.supabase.co`, `supabase/schema.sql` 실행 완료

## 아키텍처

```
app/                Next.js 14 App Router. layout.tsx가 SyncProvider로 전체를 감쌈. page.tsx가 3탭(퀘스트/보스레이드/상점) 셸.
components/          Hud, MonsterZone, FloatingTexts, ScreenEffects, BottomNav, SyncProvider, AccountPanel
components/tabs/      QuestTab, BossRaidTab, ShopTab
components/ui/        PixelButton, ProgressBar (재사용 프리미티브)
store/useGameStore.ts Zustand + persist(localStorage). 게임의 유일한 진실 소스(state).
lib/rewards.ts        보상 테이블, 레벨업 공식, 크리티컬 확률 — 밸런스 수치는 전부 여기
lib/gacha.ts          가챠 아이템 풀 + 등급 확률
lib/monsters.ts       몬스터 웨이브 목록 + 스케일링
supabase/schema.sql   Supabase SQL Editor에서 한 번 실행하는 DB 스키마
```

전부 클라이언트 컴포넌트(`'use client'`)다 — 서버 컴포넌트/서버 액션 없음. 상태는 전부 Zustand 하나(`useGameStore`)에 있고, 컴포넌트는 선택자로 필요한 필드만 구독한다 (`useGameStore((s) => s.hp)` 형태 — 객체 통째로 선택하면 zustand 무한 리렌더 버그 생기니 주의).

## 왜 이렇게 만들었는지 (재작업 방지용)

- **DB 구조는 `game_saves` 테이블 하나**에 게임 상태 전체를 JSONB로 통째 저장한다. `profiles`+`tasks`로 정규화하자는 외부 제안을 받았지만, 이미 동작하는 걸 갈아엎는 재작업이라 **의도적으로 거절**했다 (사용자 확인받고 결정함). 이 결정을 다시 뒤집으려는 제안이 오면 먼저 사용자에게 확인할 것.
- **로그인은 이메일 매직 링크 + Google OAuth 둘 다** 지원한다. 매직 링크를 먼저 만들고, 나중에 Google을 추가로 얹었다 (기존 구조 유지, 재작업 없이).
- Supabase 클라이언트는 `flowType: 'implicit'`로 고정했다 — PKCE 콜백용 서버 라우트를 만들지 않고 순수 클라이언트 컴포넌트 구조를 유지하기 위한 선택.
- `AccountPanel`의 로그인 모달은 `document.body`에 **포털링**되어 있다. `Hud`의 `backdrop-blur`가 CSS containing block을 만들어서 `position: fixed` 모달이 뷰포트가 아니라 Hud 박스 기준으로 눌려버리는 버그가 있었음 — 포털로 고침. 다른 곳에 `fixed` 오버레이를 추가할 때도 같은 문제가 생길 수 있으니 주의.
- `store/useGameStore.ts`의 모든 상태 변경 액션은 끝에 `updatedAt: Date.now()`를 세팅한다 (단, 뽀모도로 타이머의 초 단위 카운트다운처럼 매초 도는 것은 제외 — 클라우드에 매초 쓰기 방지). `SyncProvider`가 로그인 시 로컬/클라우드 중 `updatedAt`이 더 큰 쪽을 채택한다.

## 반복적으로 발생한 패턴 — 새 지시를 받을 때 먼저 확인할 것

외부(다른 AI 세션·Claude Pro 등)에서 받은 "전략 문서"를 사용자가 붙여넣는 일이 여러 번 있었는데, **이미 완료된 작업을 "다음 단계"로 다시 제안하는 경우가 반복**됐다 (Supabase 연동을 처음부터 다시 만들자는 제안 등). 새로운 전략 문서/프롬프트를 받으면:
1. 먼저 `ROADMAP.md`의 "현재 상태" 표와 대조한다.
2. 이미 된 것을 다시 만들자는 제안이면, 그대로 실행하지 말고 사용자에게 먼저 확인한다.
3. 문서의 "Phase 1 상태"가 실제 코드베이스보다 뒤처져 있는 경우가 많으니, 문서를 신뢰하지 말고 실제 커밋/파일을 기준으로 판단한다.

## 로컬 개발 환경

```bash
npm install
npm run dev          # http://localhost:3000
npm run build         # 타입체크 + 프로덕션 빌드
```

`.env.local`은 git에 커밋되지 않으므로(**기기마다 직접 생성 필요**) `.env.local.example`을 참고해서 값을 채운다. 실제 값은 이 대화 기록 또는 Supabase 대시보드(Project Settings → API Keys)에서 가져올 것.

## 알려진 제약

- 이 프로젝트를 만든 Claude Code 웹 세션은 샌드박스 네트워크 정책상 `supabase.co`, `vercel.app`, 대부분의 외부 도메인에 접근할 수 없었다. 그래서 Supabase 연동/Vercel 배포는 **코드/설정까지는 완료했지만 실제 브라우저 동작 검증은 사용자가 직접 해야 했다.** 로컬(랩탑)에서 여는 Claude Code는 이런 제약이 없을 가능성이 높으니, 여기서는 curl/WebFetch로 직접 검증해도 된다.
- 가챠/보상 확률, 레벨업 공식 등 밸런스 수치는 전부 `lib/rewards.ts`, `lib/gacha.ts`에 있다. 수치를 바꿔달라는 요청이 오면 이 두 파일만 건드리면 된다.
