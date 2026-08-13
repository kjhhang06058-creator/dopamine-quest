# Dopamine Quest

ADHD 사용자를 위한 RPG 스타일 게이미피케이션 할 일 관리 앱 MVP입니다.

## 핵심 기능

- **퀘스트 탭**: 난이도(쉬움/보통/어려움)를 정해 할 일을 등록하고 완료하면 몬스터를 공격합니다. 보상은 5~45골드 사이로 매번 랜덤(변동성 보상)이며, 약 12% 확률로 크리티컬이 터집니다. 실패 처리하면 HP가 감소하고 화면이 붉게 번쩍입니다.
- **보스 레이드 탭**: 뽀모도로 타이머(5/15/25/45분)를 보스전으로 표현합니다. 타이머가 끝나기 전에 탭을 벗어나거나 포기하면 즉시 큰 피해를 입고, 완주하면 대량의 골드/경험치와 에픽 이상 확정 전리품을 얻습니다.
- **상점 탭**: 골드로 가챠를 뽑아 픽셀 펫/무기 이펙트를 획득합니다(등급: 커먼 60% / 레어 25% / 에픽 12% / 레전더리 3%). 프리미엄 테마(사이버펑크, 다크 판타지, 게임보이 레트로)는 향후 유료 판매를 위한 잠금 UI로 미리 배치되어 있습니다.

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (레트로 다크 테마)
- Framer Motion (타격 애니메이션, 화면 흔들림/플래시)
- Zustand (+ persist 미들웨어로 진행 상황을 브라우저 `localStorage`에 자동 저장)
- Supabase (이메일 매직 링크 로그인 + 기기 간 클라우드 세이브 동기화, 선택 사항)
- lucide-react (아이콘)

## 로컬 실행 방법

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다. Supabase를 설정하지 않아도 앱은 정상 동작하며, 이 경우 진행 상황은 현재 브라우저의 `localStorage`에만 저장됩니다.

## 클라우드 동기화 설정 (선택 — 집 ↔ 사무실 세이브 공유)

코드는 git으로 두 기기에 동기화되지만, 게임 진행 상황(레벨/골드/인벤토리 등)은 기본적으로 기기별 브라우저에 따로 저장됩니다. 같은 캐릭터로 집과 사무실에서 이어서 플레이하려면 Supabase 프로젝트를 한 번만 만들어 연결하세요.

1. [supabase.com](https://supabase.com) 에서 무료 계정으로 새 프로젝트를 만듭니다.
2. 프로젝트의 **SQL Editor**에서 이 저장소의 [`supabase/schema.sql`](./supabase/schema.sql) 내용을 붙여넣고 실행합니다 (세이브를 저장할 `game_saves` 테이블과 보안 정책을 만듭니다).
3. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 복사합니다.
4. 프로젝트 루트에 `.env.local` 파일을 만들고 [`.env.local.example`](./.env.local.example)을 참고해 값을 채웁니다.
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. **Authentication → URL Configuration**에서 Site URL과 Redirect URLs에 `http://localhost:3000`과 실제 배포 도메인을 등록합니다 (매직 링크가 정확한 주소로 돌아오게 하기 위함).
6. `npm run dev`로 실행 후, 화면 오른쪽 위 **동기화** 버튼을 눌러 이메일을 입력하면 로그인 링크가 발송됩니다. 링크를 클릭하면 자동으로 로그인되고, 이후 진행 상황이 자동으로 클라우드에 저장/동기화됩니다.

같은 이메일로 다른 기기에서도 로그인하면, 로그인 순간 로컬 세이브와 클라우드 세이브 중 더 최근에 갱신된 쪽으로 자동 병합됩니다.

`.env.local`은 `.gitignore`에 포함되어 있어 절대 git에 커밋되지 않습니다 — 각 기기에서 직접 한 번씩 설정해야 합니다.

## 집 컴퓨터 / 사무실 노트북에서 함께 작업하기

이 프로젝트는 `seoul-local-pulse`와 완전히 분리된 별도의 GitHub 저장소입니다. 두 기기 모두에서 아래 순서로 작업하세요.

```bash
git clone https://github.com/kjhhang06058-creator/dopamine-quest.git
cd dopamine-quest
npm install
npm run dev
```

**한쪽 컴퓨터에서 작업을 마쳤다면 반드시 다음을 실행해서 GitHub에 올려두세요.**

```bash
git add -A
git commit -m "작업 내용 설명"
git push
```

**다른 컴퓨터에서 작업을 시작하기 전에는 반드시 최신 코드를 받아오세요.**

```bash
git pull
```

이 두 단계(작업 후 push, 시작 전 pull)를 지키면 두 기기 사이에 코드가 항상 동기화됩니다. 두 기기에서 동시에 같은 파일을 수정하면 `git pull` 시 충돌(conflict)이 날 수 있으니, 가능하면 한 번에 한 기기에서만 작업하는 것을 권장합니다.

### 세이브 동기화 상태

위 "클라우드 동기화 설정"을 마치기 전까지는 세이브 데이터가 기기별 브라우저에 각각 따로 저장됩니다. 설정을 마치면 같은 이메일로 로그인한 모든 기기에서 세이브가 자동으로 동기화됩니다.

## 다음 단계 (제안)

1. 파티 퀘스트(친구와 일정 공유, 상호 책임감 기능) 백엔드 설계
2. 프리미엄 테마/스킨 실제 인앱결제 연동
