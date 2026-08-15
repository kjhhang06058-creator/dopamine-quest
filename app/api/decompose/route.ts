import { NextRequest, NextResponse } from 'next/server';

export type MicroDifficulty = 'easy' | 'normal';

export interface MicroQuest {
  title: string;
  difficulty: MicroDifficulty;
  expReward: 15 | 30;
  goldReward: 10 | 25;
}

const REWARD_BY_DIFFICULTY: Record<MicroDifficulty, Pick<MicroQuest, 'expReward' | 'goldReward'>> = {
  easy: { expReward: 15, goldReward: 10 },
  normal: { expReward: 30, goldReward: 25 },
};

function quest(title: string, difficulty: MicroDifficulty): MicroQuest {
  return { title, difficulty, ...REWARD_BY_DIFFICULTY[difficulty] };
}

interface DecompositionRule {
  keywords: string[];
  build: (taskTitle: string) => MicroQuest[];
}

/** Rule-based mock decomposer — no external API key needed. Matches a keyword in the user's
 * task title and returns a hand-tuned 3-part breakdown by real content/area (not a generic
 * "step 1/2/3" procedure) — e.g. "민사소송법 공부" → 관할·당사자 / 기일·송달 / 증거·판결,
 * "방 청소" → 책상 / 바닥 / 침구·옷장. Specific-subject rules are ordered before broader
 * category rules so e.g. "형사소송법" matches its own rule rather than the generic 청소/공부 one.
 * Falls back to a generic study-activity split when no specific subject is recognized — the
 * rule table can't know every subject that exists, so unmatched titles degrade gracefully
 * instead of inventing unrelated content. */
const RULES: DecompositionRule[] = [
  // 집안일 — 특정 공간 규칙을 일반 청소/정리 규칙보다 먼저 배치
  {
    keywords: ['화장실'],
    build: () => [quest('변기 청소하기', 'normal'), quest('세면대·거울 닦기', 'easy'), quest('바닥·배수구 청소하기', 'normal')],
  },
  {
    keywords: ['냉장고'],
    build: () => [
      quest('유통기한 지난 음식 버리기', 'easy'),
      quest('선반별로 종류 나눠서 정리하기', 'normal'),
      quest('겉면 닦고 마무리하기', 'easy'),
    ],
  },
  {
    keywords: ['옷장', '옷 정리'],
    build: () => [
      quest('안 입는 옷 골라내기', 'normal'),
      quest('계절별로 옷 분류하기', 'normal'),
      quest('행거·서랍에 정리해서 넣기', 'easy'),
    ],
  },
  {
    keywords: ['설거지'],
    build: () => [
      quest('그릇 음식물 찌꺼기만 먼저 헹구기', 'easy'),
      quest('세제로 그릇 씻기', 'normal'),
      quest('건조대에 정리하고 마무리', 'easy'),
    ],
  },
  {
    keywords: ['빨래', '세탁'],
    build: () => [
      quest('빨래통 옷들 세탁기 앞으로 모으기', 'easy'),
      quest('세제 넣고 세탁기 돌리기', 'easy'),
      quest('건조 끝난 옷 개서 서랍에 넣기', 'normal'),
    ],
  },
  {
    keywords: ['청소', '정리', '치우'],
    build: () => [quest('책상 위 정리하기', 'normal'), quest('바닥 청소하기', 'normal'), quest('침구·옷장 정리하기', 'easy')],
  },

  // 법학 과목 — 실제 과목 체계상 큰 단원으로 분할
  {
    keywords: ['민사소송법'],
    build: () => [
      quest('관할·당사자 파트 훑어보기', 'normal'),
      quest('기일·송달 절차 정리하기', 'normal'),
      quest('증거·판결 파트 요약하기', 'normal'),
    ],
  },
  {
    keywords: ['형사소송법'],
    build: () => [
      quest('수사·기소 절차 정리하기', 'normal'),
      quest('공판 절차 훑어보기', 'normal'),
      quest('상소·재심 파트 요약하기', 'normal'),
    ],
  },
  {
    keywords: ['형법'],
    build: () => [
      quest('총론 - 범죄 성립요건 정리하기', 'normal'),
      quest('총론 - 위법성·책임조각사유 정리하기', 'normal'),
      quest('각론 - 주요 범죄유형 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['민법'],
    build: () => [quest('총칙 파트 정리하기', 'normal'), quest('물권 파트 정리하기', 'normal'), quest('채권 파트 정리하기', 'normal')],
  },
  {
    keywords: ['헌법'],
    build: () => [
      quest('기본권 파트 정리하기', 'normal'),
      quest('통치구조 파트 정리하기', 'normal'),
      quest('헌법소송 파트 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['행정법'],
    build: () => [
      quest('행정법총론 정리하기', 'normal'),
      quest('행정구제법(행정쟁송) 정리하기', 'normal'),
      quest('개별 행정법 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['상법'],
    build: () => [
      quest('총칙·상행위 파트 정리하기', 'normal'),
      quest('회사법 파트 정리하기', 'normal'),
      quest('어음·수표법 훑어보기', 'normal'),
    ],
  },

  // 공무원/일반 시험 과목
  {
    keywords: ['행정학'],
    build: () => [
      quest('조직론 파트 정리하기', 'normal'),
      quest('인사행정 파트 정리하기', 'normal'),
      quest('재무행정 파트 정리하기', 'normal'),
    ],
  },
  {
    keywords: ['한국사'],
    build: () => [
      quest('전근대사(선사~조선) 훑어보기', 'normal'),
      quest('근현대사 정리하기', 'normal'),
      quest('사료·연표 확인하기', 'normal'),
    ],
  },
  {
    keywords: ['경제학'],
    build: () => [
      quest('미시경제 파트 정리하기', 'normal'),
      quest('거시경제 파트 정리하기', 'normal'),
      quest('국제경제 파트 훑어보기', 'normal'),
    ],
  },

  // 대학 전공
  {
    keywords: ['회계학', '회계원리'],
    build: () => [
      quest('재무회계 파트 정리하기', 'normal'),
      quest('원가관리회계 파트 정리하기', 'normal'),
      quest('세무회계 파트 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['심리학'],
    build: () => [
      quest('이론·개념 정리하기', 'normal'),
      quest('연구방법론 훑어보기', 'normal'),
      quest('사례에 적용해보기', 'normal'),
    ],
  },
  {
    keywords: ['통계학'],
    build: () => [
      quest('확률 기초 정리하기', 'normal'),
      quest('추정과 검정 정리하기', 'normal'),
      quest('회귀분석 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['자료구조', '알고리즘'],
    build: () => [
      quest('배열·리스트 파트 정리하기', 'normal'),
      quest('트리·그래프 파트 정리하기', 'normal'),
      quest('정렬·탐색 알고리즘 훑어보기', 'normal'),
    ],
  },

  // 중고등학교 — 시험 준비/수행평가 (세부 과목 규칙을 일반 과목 규칙보다 먼저 배치)
  {
    keywords: ['중간고사', '기말고사', '시험기간', '내신'],
    build: () => [
      quest('시험 범위 확인하고 과목별로 나누기', 'easy'),
      quest('가장 자신 없는 과목부터 개념 정리하기', 'normal'),
      quest('기출·문제집으로 확인하고 오답 정리하기', 'normal'),
    ],
  },
  {
    keywords: ['수행평가'],
    build: (taskTitle) => [
      quest('평가 기준표(루브릭)와 제출 기한 확인하기', 'easy'),
      quest(`"${taskTitle}" 자료 조사하고 개요 잡기`, 'normal'),
      quest('초안 작성하고 제출 형식 맞추기', 'normal'),
    ],
  },

  // 모의고사·교재 — 고등학생 플래너에 자주 등장하는 형태
  {
    keywords: ['모의고사', '모고', '학평', '학력평가'],
    build: () => [
      quest('시간 재고 한 회차 풀기', 'normal'),
      quest('채점하고 틀린 문제 표시하기', 'easy'),
      quest('오답 해설 보고 오답노트 정리하기', 'normal'),
    ],
  },
  {
    keywords: ['수능특강', '수특', '수능완성', '수완', '기출'],
    build: (taskTitle) => [
      quest(`"${taskTitle}" 오늘 풀 범위 정하기`, 'easy'),
      quest('정해진 범위 문제 풀기', 'normal'),
      quest('틀린 문제 해설 보고 정리하기', 'normal'),
    ],
  },

  // 고등 국어 세부 과목
  {
    keywords: ['언어와 매체', '언매'],
    build: () => [
      quest('음운·단어 문법 개념 정리하기', 'normal'),
      quest('문장·담화 문법 개념 정리하기', 'normal'),
      quest('매체 지문 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['화법과 작문', '화작'],
    build: () => [
      quest('화법(발표·토론) 지문 풀기', 'normal'),
      quest('작문(글쓰기) 지문 풀기', 'normal'),
      quest('틀린 문제 근거 다시 찾아보기', 'normal'),
    ],
  },
  {
    keywords: ['독서', '비문학'],
    build: () => [
      quest('인문·사회 지문 풀기', 'normal'),
      quest('과학·기술 지문 풀기', 'normal'),
      quest('틀린 지문 문단별로 다시 읽기', 'normal'),
    ],
  },

  // 고등 수학 세부 과목
  {
    keywords: ['수학1', '수학I', '수1'],
    build: () => [
      quest('지수함수·로그함수 정리하기', 'normal'),
      quest('삼각함수 문제 풀기', 'normal'),
      quest('수열 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['수학2', '수학II', '수2'],
    build: () => [
      quest('함수의 극한·연속 정리하기', 'normal'),
      quest('미분 문제 풀기', 'normal'),
      quest('적분 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['미적분', '미적'],
    build: () => [
      quest('수열의 극한·급수 정리하기', 'normal'),
      quest('미분법 문제 풀기', 'normal'),
      quest('적분법 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['확률과 통계', '확률과통계', '확통'],
    build: () => [
      quest('경우의 수·순열조합 정리하기', 'normal'),
      quest('확률 문제 풀기', 'normal'),
      quest('통계·정규분포 정리하기', 'normal'),
    ],
  },
  {
    keywords: ['기하'],
    build: () => [
      quest('이차곡선 정리하기', 'normal'),
      quest('평면벡터 문제 풀기', 'normal'),
      quest('공간도형·공간벡터 정리하기', 'normal'),
    ],
  },

  // 고등 통합 과목
  {
    keywords: ['통합과학'],
    build: () => [
      quest('물질과 규칙성 파트 정리하기', 'normal'),
      quest('시스템과 상호작용 파트 정리하기', 'normal'),
      quest('변화와 다양성·환경 파트 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['통합사회'],
    build: () => [
      quest('행복·자연환경·생활공간 파트 정리하기', 'normal'),
      quest('인권·시장·정의 파트 정리하기', 'normal'),
      quest('문화·세계화·미래 파트 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['정치와 법', '법과 정치'],
    build: () => [
      quest('민주주의·헌법 파트 정리하기', 'normal'),
      quest('기본권·통치구조 정리하기', 'normal'),
      quest('민법·형법 기초 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['문학'],
    build: () => [
      quest('시(운문) 작품 분석하기', 'normal'),
      quest('소설(산문) 작품 분석하기', 'normal'),
      quest('작품별 주제·표현법 정리하기', 'normal'),
    ],
  },

  // 중학교 통합 과목 (포괄 키워드인 과학/사회/역사는 구체 과목 규칙을 가로채지 않도록 파일 뒤쪽에 배치)
  {
    keywords: ['도덕'],
    build: () => [
      quest('개념·사상가 정리하기', 'normal'),
      quest('생활 속 윤리 쟁점 정리하기', 'normal'),
      quest('서술형 문제 연습하기', 'normal'),
    ],
  },
  {
    keywords: ['기술가정', '기술·가정'],
    build: () => [
      quest('기술 영역 단원 정리하기', 'normal'),
      quest('가정 영역 단원 정리하기', 'normal'),
      quest('실습·수행 과제 확인하기', 'easy'),
    ],
  },
  {
    keywords: ['한문'],
    build: () => [
      quest('한자 음·훈 외우기', 'easy'),
      quest('한자어·성어 정리하기', 'normal'),
      quest('문장 해석 연습하기', 'normal'),
    ],
  },

  // 수능 과목 — 실제 수능 출제 영역 기준
  {
    keywords: ['국어', '언어영역'],
    build: () => [
      quest('화법과 작문 파트 풀기', 'normal'),
      quest('언어와 매체(문법) 정리하기', 'normal'),
      quest('문학·독서 지문 풀어보기', 'normal'),
    ],
  },
  {
    keywords: ['수학'],
    build: () => [
      quest('개념·공식 정리하기', 'normal'),
      quest('기본 유형 문제 풀기', 'normal'),
      quest('틀린 문제 오답노트 정리하기', 'normal'),
    ],
  },
  {
    keywords: ['영어'],
    build: () => [
      quest('단어·숙어 외우기', 'easy'),
      quest('문법 파트 정리하기', 'normal'),
      quest('독해 지문 풀어보기', 'normal'),
    ],
  },
  {
    keywords: ['생명과학', '생명', '생물', '생1', '생2'],
    build: () => [
      quest('세포·유전 파트 정리하기', 'normal'),
      quest('인체 항상성 파트 정리하기', 'normal'),
      quest('생태계·진화 파트 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['지구과학', '지구', '지1', '지2'],
    build: () => [
      quest('지질·판구조 파트 정리하기', 'normal'),
      quest('대기·해양 파트 정리하기', 'normal'),
      quest('천체·우주 파트 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['물리', '물1', '물2'],
    build: () => [
      quest('역학 파트 정리하기', 'normal'),
      quest('전자기 파트 정리하기', 'normal'),
      quest('파동·현대물리 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['화학', '화1', '화2'],
    build: () => [
      quest('원자·주기율 파트 정리하기', 'normal'),
      quest('화학 반응·양론 정리하기', 'normal'),
      quest('산염기·산화환원 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['사회문화', '사문'],
    build: () => [
      quest('연구방법론 정리하기', 'normal'),
      quest('문화·사회계층 파트 정리하기', 'normal'),
      quest('도표 분석 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['윤리와 사상', '윤사'],
    build: () => [
      quest('동양 윤리 사상 정리하기', 'normal'),
      quest('서양 윤리 사상 정리하기', 'normal'),
      quest('사상가별 비교해서 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['생활과 윤리', '생윤', '윤리'],
    build: () => [
      quest('윤리 사상가별 입장 정리하기', 'normal'),
      quest('현대 윤리 쟁점 정리하기', 'normal'),
      quest('제시문 분석 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['세계사', '동아시아사', '동사'],
    build: () => [
      quest('시대별 흐름 훑어보기', 'normal'),
      quest('주요 사건·인물 정리하기', 'normal'),
      quest('연표·지도 확인하기', 'normal'),
    ],
  },
  {
    keywords: ['한국지리', '세계지리', '한지', '세지', '지리'],
    build: () => [
      quest('자연지리 파트 정리하기', 'normal'),
      quest('인문지리 파트 정리하기', 'normal'),
      quest('지도·통계 자료 분석하기', 'normal'),
    ],
  },
  {
    keywords: ['정법'],
    build: () => [
      quest('민주주의·헌법 파트 정리하기', 'normal'),
      quest('기본권·통치구조 정리하기', 'normal'),
      quest('민법·형법 기초 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['경제'],
    build: () => [
      quest('수요·공급과 시장 정리하기', 'normal'),
      quest('국민경제·금융 파트 정리하기', 'normal'),
      quest('계산·도표 문제 풀기', 'normal'),
    ],
  },

  // 전문자격시험
  {
    keywords: ['공인중개사'],
    build: () => [
      quest('민법·중개실무 정리하기', 'normal'),
      quest('부동산학개론 정리하기', 'normal'),
      quest('공법·세법 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['세무사', '세법'],
    build: () => [
      quest('국세기본법 정리하기', 'normal'),
      quest('소득세·법인세 정리하기', 'normal'),
      quest('부가가치세 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['노무사', '노동법'],
    build: () => [
      quest('근로기준법 정리하기', 'normal'),
      quest('노동조합법 정리하기', 'normal'),
      quest('사회보험법 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['간호', '간호학'],
    build: () => [
      quest('성인간호학 파트 정리하기', 'normal'),
      quest('기본간호학 파트 정리하기', 'normal'),
      quest('모성·아동간호학 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['교육학'],
    build: () => [
      quest('교육심리·교육과정 정리하기', 'normal'),
      quest('교육행정·교육사회 정리하기', 'normal'),
      quest('교수학습이론 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['공인회계사', '회계사', 'CPA'],
    build: () => [
      quest('재무회계·원가회계 정리하기', 'normal'),
      quest('세법·상법 정리하기', 'normal'),
      quest('경영학·경제원론 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['감정평가사', '감평'],
    build: () => [
      quest('감정평가이론 정리하기', 'normal'),
      quest('감정평가실무 문제 풀기', 'normal'),
      quest('보상법규·민법 정리하기', 'normal'),
    ],
  },
  {
    keywords: ['변리사'],
    build: () => [
      quest('특허법·실용신안법 정리하기', 'normal'),
      quest('상표법·디자인보호법 정리하기', 'normal'),
      quest('민법개론·자연과학개론 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['관세사'],
    build: () => [
      quest('관세법 정리하기', 'normal'),
      quest('무역실무·무역영어 정리하기', 'normal'),
      quest('내국소비세법·회계학 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['법무사'],
    build: () => [
      quest('민법·헌법 정리하기', 'normal'),
      quest('민사집행법·부동산등기법 정리하기', 'normal'),
      quest('상법·공탁법 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['행정사'],
    build: () => [
      quest('행정법 정리하기', 'normal'),
      quest('행정절차론·사무관리론 정리하기', 'normal'),
      quest('민법(계약) 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['주택관리사'],
    build: () => [
      quest('공동주택시설개론 정리하기', 'normal'),
      quest('주택관리관계법규 정리하기', 'normal'),
      quest('공동주택관리실무 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['사회복지사'],
    build: () => [
      quest('사회복지실천론 정리하기', 'normal'),
      quest('사회복지정책론 정리하기', 'normal'),
      quest('사회복지법제·조사론 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['손해사정사', '손해사정'],
    build: () => [
      quest('보험업법·보험계약법 정리하기', 'normal'),
      quest('손해사정이론 정리하기', 'normal'),
      quest('약관·실무 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['보험계리사', '계리사'],
    build: () => [
      quest('보험수리학 정리하기', 'normal'),
      quest('계리리스크관리 정리하기', 'normal'),
      quest('보험경제학·회계원리 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['물류관리사'],
    build: () => [
      quest('물류관리론 정리하기', 'normal'),
      quest('화물운송론·보관하역론 정리하기', 'normal'),
      quest('국제물류론 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['유통관리사'],
    build: () => [
      quest('유통물류일반관리 정리하기', 'normal'),
      quest('상권분석·유통마케팅 정리하기', 'normal'),
      quest('유통정보 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['임용', '임용고시'],
    build: () => [
      quest('교육학 파트 정리하기', 'normal'),
      quest('전공 과목 정리하기', 'normal'),
      quest('기출·논술 답안 연습하기', 'normal'),
    ],
  },
  {
    keywords: ['한국사능력검정', '한능검'],
    build: () => [
      quest('전근대사(선사~조선) 훑어보기', 'normal'),
      quest('근현대사 정리하기', 'normal'),
      quest('기출문제 풀어보기', 'normal'),
    ],
  },
  {
    keywords: ['컴퓨터활용능력', '컴활'],
    build: () => [
      quest('컴퓨터 일반 이론 정리하기', 'normal'),
      quest('스프레드시트(엑셀) 실습하기', 'normal'),
      quest('데이터베이스 실습하기', 'normal'),
    ],
  },
  {
    keywords: ['전기기사', '전기산업기사'],
    build: () => [
      quest('전기자기학·회로이론 정리하기', 'normal'),
      quest('전력공학·전기기기 정리하기', 'normal'),
      quest('전기설비기술기준 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['산업안전기사', '산업안전'],
    build: () => [
      quest('안전관리론 정리하기', 'normal'),
      quest('기계·전기 위험방지기술 정리하기', 'normal'),
      quest('산업안전보건법령 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['건축기사', '건축산업기사'],
    build: () => [
      quest('건축계획·시공 정리하기', 'normal'),
      quest('건축구조 문제 풀기', 'normal'),
      quest('건축설비·법규 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['소방'],
    build: () => [
      quest('소방원론·소방관계법규 정리하기', 'normal'),
      quest('소방전기·기계시설 정리하기', 'normal'),
      quest('기출문제 풀어보기', 'normal'),
    ],
  },

  // 공무원 — 직렬별 전공과목이 다르므로 직렬 규칙을 급수/일반 규칙보다 먼저 배치
  {
    keywords: ['세무직'],
    build: () => [
      quest('세법개론 정리하기', 'normal'),
      quest('회계학 문제 풀기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['관세직'],
    build: () => [
      quest('관세법개론 정리하기', 'normal'),
      quest('회계원리 문제 풀기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['교정직', '교정학'],
    build: () => [
      quest('교정학개론 정리하기', 'normal'),
      quest('형사소송법개론 정리하기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['검찰직'],
    build: () => [
      quest('형법 정리하기', 'normal'),
      quest('형사소송법 정리하기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['교육행정직', '교육행정'],
    build: () => [
      quest('교육학개론 정리하기', 'normal'),
      quest('행정법총론 정리하기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['전산직'],
    build: () => [
      quest('컴퓨터일반 정리하기', 'normal'),
      quest('정보보호론 정리하기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['통계직'],
    build: () => [
      quest('통계학개론 정리하기', 'normal'),
      quest('경제학개론 문제 풀기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['사회복지직'],
    build: () => [
      quest('사회복지학개론 정리하기', 'normal'),
      quest('행정법총론 정리하기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['계리직'],
    build: () => [
      quest('우편·금융 상식 정리하기', 'normal'),
      quest('컴퓨터일반 정리하기', 'normal'),
      quest('한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['일반행정직', '일반행정'],
    build: () => [
      quest('행정법총론 정리하기', 'normal'),
      quest('행정학개론 정리하기', 'normal'),
      quest('국어·영어·한국사 기출 풀기', 'normal'),
    ],
  },
  {
    keywords: ['PSAT', '피셋', '5급 공채', '행정고시', '입법고시'],
    build: () => [
      quest('언어논리 문제 풀기', 'normal'),
      quest('자료해석 문제 풀기', 'normal'),
      quest('상황판단 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['7급'],
    build: () => [
      quest('PSAT(언어논리·자료해석·상황판단) 풀기', 'normal'),
      quest('전공 과목 정리하기', 'normal'),
      quest('한국사능력검정 대비하기', 'normal'),
    ],
  },
  {
    keywords: ['9급', '공무원'],
    build: () => [
      quest('국어 기출 풀기', 'normal'),
      quest('영어·한국사 기출 풀기', 'normal'),
      quest('전공(선택) 과목 정리하기', 'normal'),
    ],
  },

  // 공기업·공공기관 — NCS + 전공 + 채용전형
  {
    keywords: ['NCS', 'ncs', '직업기초'],
    build: () => [
      quest('의사소통·수리능력 문제 풀기', 'normal'),
      quest('문제해결·자원관리능력 문제 풀기', 'normal'),
      quest('조직이해·정보능력 문제 풀기', 'normal'),
    ],
  },
  {
    keywords: ['한전', '한국전력', '전기직'],
    build: () => [
      quest('NCS 직업기초능력 문제 풀기', 'normal'),
      quest('전공(전기이론·전력공학) 정리하기', 'normal'),
      quest('한국사·상식 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['코레일', '철도공사'],
    build: () => [
      quest('NCS 직업기초능력 문제 풀기', 'normal'),
      quest('전공 과목 정리하기', 'normal'),
      quest('기출 모의고사 시간 재고 풀기', 'normal'),
    ],
  },
  {
    keywords: ['건강보험공단', '건보', '근로복지공단', '국민연금공단'],
    build: () => [
      quest('NCS 직업기초능력 문제 풀기', 'normal'),
      quest('법률·직무상식 정리하기', 'normal'),
      quest('기출 모의고사 풀기', 'normal'),
    ],
  },
  {
    keywords: ['공기업', '공공기관'],
    build: () => [
      quest('NCS 직업기초능력 문제 풀기', 'normal'),
      quest('전공 과목 정리하기', 'normal'),
      quest('자소서·면접 준비하기', 'normal'),
    ],
  },
  {
    keywords: ['자소서', '자기소개서'],
    build: () => [
      quest('문항별로 쓸 경험 정리하기', 'normal'),
      quest('한 문항만 초안 작성하기', 'normal'),
      quest('글자 수 맞추고 다듬기', 'normal'),
    ],
  },
  {
    keywords: ['면접'],
    build: () => [
      quest('예상 질문 목록 정리하기', 'normal'),
      quest('답변 스크립트 작성하기', 'normal'),
      quest('소리 내어 말하기 연습하기', 'normal'),
    ],
  },
  {
    keywords: ['인적성', '적성검사', 'GSAT'],
    build: () => [
      quest('언어·수리 영역 문제 풀기', 'normal'),
      quest('추리·도형 영역 문제 풀기', 'normal'),
      quest('시간 재고 모의고사 풀기', 'normal'),
    ],
  },
  {
    keywords: ['경찰'],
    build: () => [
      quest('경찰학 정리하기', 'normal'),
      quest('형사법 정리하기', 'normal'),
      quest('헌법 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['정보처리기사', '정보처리'],
    build: () => [
      quest('소프트웨어 설계 파트 정리하기', 'normal'),
      quest('데이터베이스·SQL 정리하기', 'normal'),
      quest('기출문제 풀어보기', 'normal'),
    ],
  },

  // 어학
  {
    keywords: ['토익'],
    build: () => [
      quest('리스닝 파트 문제 풀기', 'normal'),
      quest('문법(RC) 파트 정리하기', 'normal'),
      quest('독해(RC) 지문 풀어보기', 'normal'),
    ],
  },
  {
    keywords: ['토플'],
    build: () => [
      quest('리스닝·스피킹 연습하기', 'normal'),
      quest('리딩 지문 풀어보기', 'normal'),
      quest('라이팅 에세이 써보기', 'normal'),
    ],
  },
  {
    keywords: ['오픽', '스피킹'],
    build: () => [
      quest('자기소개·일상 답변 연습하기', 'normal'),
      quest('돌발 주제 답변 연습하기', 'normal'),
      quest('롤플레이 유형 연습하기', 'normal'),
    ],
  },
  {
    keywords: ['HSK', '중국어'],
    build: () => [
      quest('단어·어휘 외우기', 'easy'),
      quest('듣기 문제 풀기', 'normal'),
      quest('독해·작문 연습하기', 'normal'),
    ],
  },
  {
    keywords: ['JLPT', '일본어'],
    build: () => [
      quest('문자·어휘 파트 정리하기', 'easy'),
      quest('문법 파트 정리하기', 'normal'),
      quest('독해·청해 문제 풀기', 'normal'),
    ],
  },

  // 중학교 통합 과목 — '과학'/'사회'/'역사'는 생명과학·사회문화·사회복지사·한국사 등을 가로채지
  // 않도록, 모든 구체 과목 규칙이 끝난 이 위치에 둔다.
  {
    keywords: ['과학'],
    build: () => [
      quest('물리·화학 단원 정리하기', 'normal'),
      quest('생물 단원 정리하기', 'normal'),
      quest('지구과학 단원 정리하기', 'normal'),
    ],
  },
  {
    keywords: ['사회'],
    build: () => [
      quest('지리 단원 정리하기', 'normal'),
      quest('일반사회(정치·경제) 단원 정리하기', 'normal'),
      quest('문화·윤리 단원 훑어보기', 'normal'),
    ],
  },
  {
    keywords: ['역사'],
    build: () => [
      quest('시대별 흐름 훑어보기', 'normal'),
      quest('주요 사건·인물 정리하기', 'normal'),
      quest('연표 정리하고 문제 풀기', 'normal'),
    ],
  },

  // 특정 과목이 안 잡히는 일반 학습/과제 — 절차가 아니라 학습 활동 카테고리로 분할
  {
    keywords: ['공부', '과제', '시험', '리포트', '보고서', '글쓰기', '작성', '발표'],
    build: (taskTitle) => [
      quest(`"${taskTitle}" 개념·이론 파트 정리하기`, 'normal'),
      quest('문제 풀이로 확인하기', 'normal'),
      quest('헷갈렸던 부분 다시 보기', 'normal'),
    ],
  },

  {
    keywords: ['운동', '헬스', '러닝', '조깅', '스트레칭'],
    build: () => [
      quest('운동복으로 갈아입기', 'easy'),
      quest('가벼운 스트레칭 5분', 'easy'),
      quest('본 운동 한 세트 시작하기', 'normal'),
    ],
  },
  {
    keywords: ['이메일', '메일'],
    build: () => [
      quest('받은편지함 열고 안 읽은 메일 훑어보기', 'easy'),
      quest('가장 급한 메일 1개만 답장하기', 'normal'),
      quest('나머지 메일 보관/삭제로 정리하기', 'normal'),
    ],
  },
  {
    keywords: ['준비', '이사', '프로젝트', '계획'],
    build: (taskTitle) => [
      quest(`"${taskTitle}"에 뭐가 필요한지 목록만 적어보기`, 'easy'),
      quest('목록 중 가장 급한 것 하나만 처리하기', 'normal'),
      quest('남은 항목 순서 정해서 다음 할 일 정하기', 'normal'),
    ],
  },
];

const COMPLEXITY_KEYWORDS = RULES.flatMap((r) => r.keywords);
/** Titles this long (Korean chars) tend to already bundle multiple steps even without a keyword hit. */
const COMPLEXITY_LENGTH_THRESHOLD = 7;

/** Decides whether to bother the user with a split suggestion at all — short, plainly atomic
 * titles ("우유 사기") should never trigger the popup, only genuinely bundled-looking ones. */
function isComplexTask(taskTitle: string): boolean {
  if (COMPLEXITY_KEYWORDS.some((k) => taskTitle.includes(k))) return true;
  return taskTitle.length >= COMPLEXITY_LENGTH_THRESHOLD;
}

function decompose(taskTitle: string): MicroQuest[] {
  const rule = RULES.find((r) => r.keywords.some((k) => taskTitle.includes(k)));
  if (rule) return rule.build(taskTitle);

  return [
    quest(`"${taskTitle}" 시작에 필요한 것만 책상 위에 꺼내놓기`, 'easy'),
    quest(`타이머 5분 맞추고 "${taskTitle}" 딱 5분만 해보기`, 'normal'),
    quest('5분 더 이어가거나 오늘 몫만큼 마무리 짓기', 'normal'),
  ];
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const taskTitle = (body as { taskTitle?: unknown } | null)?.taskTitle;
  if (typeof taskTitle !== 'string' || !taskTitle.trim()) {
    return NextResponse.json({ error: 'taskTitle is required' }, { status: 400 });
  }

  const trimmed = taskTitle.trim();
  return NextResponse.json({ complex: isComplexTask(trimmed), quests: decompose(trimmed) });
}
