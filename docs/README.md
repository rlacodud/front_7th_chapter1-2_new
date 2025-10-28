# 📚 테스트 가이드 문서 구조

## 🎯 빠른 선택 가이드

### 상황별 추천 문서

| 상황                     | 추천 문서                                                          | 예상 시간 |
| ------------------------ | ------------------------------------------------------------------ | --------- |
| 🚀 **지금 당장 시작**    | [TEST_GUIDE_QUICK.md](./TEST_GUIDE_QUICK.md)                       | 5분       |
| 📖 **체계적 학습**       | [TEST_GUIDE.md](./TEST_GUIDE.md)                                   | 20분      |
| 🤖 **AI Agent 사용**     | [test-guides/ai-agent.md](./test-guides/ai-agent.md)               | 10분      |
| 💡 **패턴 학습**         | [test-guides/patterns.md](./test-guides/patterns.md)               | 15분      |
| 📝 **예시 필요**         | [test-guides/examples.md](./test-guides/examples.md)               | 참조용    |
| ⚠️ **실수 방지**         | [test-guides/antipatterns.md](./test-guides/antipatterns.md)       | 10분      |
| 📊 **품질 측정**         | [test-guides/test-metrics.md](./test-guides/test-metrics.md)       | 15분      |
| 📋 **실행 로그**         | [test-guides/execution-log.md](./test-guides/execution-log.md)     | 템플릿    |
| ⚙️ **워크플로우 자동화** | [test-guides/workflow-agents.md](./test-guides/workflow-agents.md) | 20분      |

---

## 📁 문서 구조

```
docs/
├── README.md                    ← 지금 보고 있는 파일
├── TEST_GUIDE_QUICK.md         ← ⚡ 5분 빠른 시작 (500줄)
├── TEST_GUIDE.md               ← 📖 핵심 가이드 (축소판, 700줄)
│
└── test-guides/                ← 📂 상세 가이드 모음
    ├── patterns.md             ← 테스트 패턴 상세
    ├── examples.md             ← 실전 예시 모음
    ├── antipatterns.md         ← 안티패턴과 해결책
    ├── ai-agent.md             ← AI Agent 전용 지침
    ├── test-metrics.md         ← 테스트 품질 평가 기준
    ├── execution-log.md        ← TDD 실행 로그 템플릿
    └── workflow-agents.md      ← AI Agent 기반 TDD 워크플로우
```

---

## 📖 문서별 상세 설명

### 1. TEST_GUIDE_QUICK.md (필수 ⭐)

**대상**: 모든 사용자 (사람 + AI)  
**분량**: ~500줄  
**목적**: 5분 안에 TDD 시작

**포함 내용**:

- ⚡ 3초 요약
- 🎯 필수 원칙 6가지
- 🔄 TDD 사이클 체크리스트
- 📝 AAA 패턴 템플릿
- ⚠️ 자주 하는 실수 Top 10

**추천 사용법**:

```bash
# 1단계: 빠른 참조 가이드 읽기 (5분)
cat docs/TEST_GUIDE_QUICK.md

# 2단계: 바로 테스트 작성 시작
# 3단계: 막히면 상세 가이드 참조
```

---

### 2. TEST_GUIDE.md (핵심)

**대상**: 체계적으로 학습하려는 사용자  
**분량**: ~700줄 (원본의 1/6)  
**목적**: TDD 핵심 원칙과 실행 방법

**포함 내용**:

- TDD 기본 개념
- 핵심 원칙 6가지 (상세)
- AAA 패턴
- 테스트 네이밍
- TDD 사이클 실전
- 문제 해결

**추천 사용법**:

```bash
# 차근차근 학습할 때
# 1. TDD 개념 이해
# 2. 원칙 숙지
# 3. 패턴 학습
# 4. 실전 적용
```

---

### 3. test-guides/patterns.md (심화)

**대상**: 패턴을 깊이 이해하고 싶은 사용자  
**분량**: ~600줄  
**목적**: 다양한 테스트 패턴 마스터

**포함 내용**:

- AAA 패턴 상세
- Given-When-Then 패턴
- 테스트 더블 (Mock, Stub, Spy, Fake)
- 파라미터화 테스트
- 비동기 테스트 패턴

---

### 4. test-guides/examples.md (참조)

**대상**: 실전 코드가 필요한 사용자  
**분량**: ~400줄  
**목적**: 복사해서 바로 사용 가능한 예제

**포함 내용**:

- 반복 일정 생성 예시
- 날짜 처리 예시
- 유효성 검증 예시
- 비동기 처리 예시
- 에러 처리 예시
- 헬퍼 함수 예시

---

### 5. test-guides/antipatterns.md (중요)

**대상**: 실수를 방지하고 싶은 사용자  
**분량**: ~500줄  
**목적**: 흔한 실수와 해결책

**포함 내용**:

- 구조적 안티패턴
- 의존성 안티패턴
- 단언 안티패턴
- 네이밍 안티패턴
- TDD 프로세스 안티패턴
- 체크리스트

---

### 6. test-guides/ai-agent.md (AI 전용)

**대상**: AI Agent  
**분량**: ~600줄  
**목적**: AI가 일관된 고품질 테스트 생성

**포함 내용**:

- AI Agent 작동 원칙
- 필수 체크리스트
- 결정 트리
- 자동 감지 및 회피
- 코드 생성 템플릿
- 품질 지표

---

### 7. test-guides/test-metrics.md (측정)

**대상**: 테스트 품질을 측정하고 개선하려는 사용자  
**분량**: ~560줄  
**목적**: 객관적이고 측정 가능한 품질 기준

**포함 내용**:

- 핵심 메트릭 (커버리지, 변이 테스트, 결함 탐지율 등)
- 보조 지표
- 목표값 요약
- 측정 및 수집 방법
- 품질 개선 가이드
- CI/CD 통합 예시

---

### 8. test-guides/execution-log.md (템플릿)

**대상**: TDD REFACTOR 단계에서 품질을 기록하려는 사용자  
**분량**: ~300줄  
**목적**: 실행 결과 및 품질 평가 기록 템플릿

**포함 내용**:

- 기본 정보 (작성자, 프로젝트, TDD 단계 등)
- 측정 결과 (핵심 메트릭 + 보조 지표)
- AI Agent 평가 로그
- 리팩토링 개선 포인트
- 전체 평가 및 종합 점수
- 템플릿 사용 가이드

---

### 9. test-guides/workflow-agents.md (워크플로우)

**대상**: AI Agent 기반 TDD 자동화를 구현하려는 사용자  
**분량**: ~900줄  
**목적**: AI Agent 기반 TDD 워크플로우 자동화 가이드 (전체 스택 구현)

**포함 내용**:

- **전체 스택 TDD 접근법** (UI + 훅 + API + 유틸)
- TDD 기반 AI Workflow 개요
- Agent 구조 및 역할 (Orchestrator, Spec, Test, Code, Refactor, Git)
- Agent 상세 명세 및 입출력
  - **SpecAgent**: 전체 스택 명세 작성 (UI/훅/API/유틸)
  - **TestAgent**: 유닛 + 훅 + 통합 + API 테스트 생성
  - **CodeAgent**: 전체 스택 구현 (UI + 훅 + API + 유틸)
  - **RefactorReviewAgent**: 전체 스택 품질 검증
- **Agent 페르소나 정의** (성격, 커뮤니케이션 스타일, 작업 원칙, 의사결정 기준)
- Agent 페르소나 요약 및 활용 가이드
- 워크플로우 단계별 흐름
- **실제 기능 구현 예시** (반복 일정 기능: UI + 훅 + API + 유틸)
- 품질 관리 및 자동화 규칙
- 구현 예시 (설정 파일)

---

## 🚀 사용 시나리오

### 시나리오 1: 처음 TDD 시작하는 개발자

```
1단계: TEST_GUIDE_QUICK.md 읽기 (5분)
       → 핵심 원칙과 템플릿 파악

2단계: examples.md에서 비슷한 예시 찾기
       → 복사해서 수정

3단계: 막히면 antipatterns.md 확인
       → 흔한 실수 회피

4단계: 더 깊이 알고 싶으면 TEST_GUIDE.md
```

### 시나리오 2: AI Agent 설정

```
1단계: ai-agent.md 전체 읽기
       → AI Agent 동작 원칙 파악

2단계: TEST_GUIDE_QUICK.md 참조 설정
       → 빠른 룰 기반 판단

3단계: antipatterns.md로 회피 패턴 학습
       → 자동 감지 및 회피

4단계: examples.md를 템플릿으로 활용
       → 일관된 코드 생성
```

### 시나리오 3: 팀 온보딩

```
Day 1: TEST_GUIDE_QUICK.md 공유
       → 팀 전체가 5분 안에 시작

Day 2: TEST_GUIDE.md 세션
       → 원칙과 패턴 토론

Day 3: examples.md 기반 실습
       → 실제 프로젝트에 적용

Week 2: antipatterns.md 코드 리뷰
        → 팀 코드 품질 개선
```

### 시나리오 4: 테스트 품질 개선

```
1단계: test-metrics.md에서 현재 상태 측정
       → 커버리지, 변이 점수, 실행 속도 확인

2단계: 목표값과 비교
       → 개선이 필요한 영역 파악

3단계: 품질 개선 가이드 참조
       → 구체적인 개선 방법 적용

4단계: CI/CD 파이프라인 통합
       → 자동 측정 및 모니터링
```

### 시나리오 5: TDD REFACTOR 단계 평가

```
1단계: execution-log.md 템플릿 복사
       → 새로운 로그 파일 생성

2단계: 테스트 실행 및 메트릭 수집
       → pnpm test:coverage
       → pnpm test:mutation

3단계: 측정 결과를 로그에 기록
       → test-metrics.md 기준과 비교
       → AI Agent 평가 결과 포함

4단계: 개선 포인트 도출 및 조치
       → 우선순위 기반 리팩토링
       → 재측정 및 로그 업데이트
```

### 시나리오 6: AI Agent 기반 TDD 자동화

```
1단계: workflow-agents.md 읽기
       → 전체 워크플로우 이해
       → Agent 역할 파악

2단계: 워크플로우 설정 파일 작성
       → .tdd-workflow.yml 생성
       → Agent 모델 및 품질 기준 설정

3단계: 자동화 실행
       → "반복 일정 기능 추가"
       → RED → GREEN → REFACTOR 자동 실행

4단계: 결과 확인 및 조정
       → execution-log.md 검토
       → Agent 설정 최적화
```

---

## 📊 문서 비교

| 특징      | QUICK  | GUIDE  | ORIGINAL |
| --------- | ------ | ------ | -------- |
| 분량      | 500줄  | 700줄  | 4,182줄  |
| 읽는 시간 | 5분    | 20분   | 2시간+   |
| 대상      | 모두   | 학습자 | 참조용   |
| 예시 수   | 적음   | 중간   | 많음     |
| 깊이      | 얕음   | 중간   | 깊음     |
| AI 친화성 | ⭐⭐⭐ | ⭐⭐   | ⭐       |

---

## 💡 활용 팁

### Tip 1: AI Agent와 함께 사용하기

```
프롬프트 예시:
"docs/TEST_GUIDE_QUICK.md를 참조해서
반복 일정 생성 기능의 테스트를 작성해줘"
```

### Tip 2: 북마크 추천

자주 참조할 섹션:

- TEST_GUIDE_QUICK.md의 "자주 하는 실수 Top 10"
- patterns.md의 "AAA 패턴 기본 구조"
- examples.md의 "헬퍼 함수 예시"
- test-metrics.md의 "목표값 요약"
- execution-log.md의 "템플릿 사용 가이드"
- workflow-agents.md의 "Agent 구조" 및 "워크플로우 단계"

### Tip 3: 검색 활용

```bash
# 특정 패턴 빠르게 찾기
grep -r "AAA 패턴" docs/

# 예시 코드만 추출
grep -A 10 "// Arrange" docs/test-guides/examples.md

# 품질 기준 빠르게 확인
grep "목표 기준" docs/test-guides/test-metrics.md

# 로그 템플릿 복사
cp docs/test-guides/execution-log.md logs/execution-log-$(date +%Y%m%d).md
```

---

## 🔄 문서 업데이트 정책

### 우선순위

1. **TEST_GUIDE_QUICK.md** - 항상 최신 유지
2. **TEST_GUIDE.md** - 주요 변경 사항만 반영
3. **test-guides/\*.md** - 상세 내용 추가/수정

### 업데이트 규칙

- 새로운 패턴 발견 → examples.md에 추가
- 흔한 실수 발견 → antipatterns.md에 추가
- 원칙 변경 → QUICK, GUIDE 모두 업데이트
- 품질 기준 변경 → test-metrics.md 업데이트 후 execution-log.md 템플릿도 반영

---

## 📝 기여 가이드

### 문서 개선 제안

1. 어떤 문서에 추가할지 결정

   - 빠른 참조? → QUICK
   - 상세 설명? → GUIDE
   - 예시? → examples.md
   - 안티패턴? → antipatterns.md
   - 품질 기준? → test-metrics.md
   - 로그 템플릿? → execution-log.md
   - AI 워크플로우? → workflow-agents.md

2. 기존 형식 따르기

   - AAA 패턴 유지
   - 예시는 ✅ ❌ 표시

3. 간결하게 작성
   - QUICK: 핵심만
   - GUIDE: 적당히
   - 상세 가이드: 자세히

---

## 🎓 학습 로드맵

### 초급 (1주차)

- [ ] TEST_GUIDE_QUICK.md 읽기
- [ ] 간단한 함수 테스트 작성
- [ ] antipatterns.md의 Top 5 숙지

### 중급 (2-3주차)

- [ ] TEST_GUIDE.md 전체 학습
- [ ] patterns.md의 AAA 패턴 마스터
- [ ] examples.md 코드 실습
- [ ] test-metrics.md로 품질 측정 시작

### 고급 (1개월+)

- [ ] 모든 패턴 활용
- [ ] 팀에 TDD 전파
- [ ] execution-log.md로 체계적 품질 관리
- [ ] AI Agent와 협업 최적화
- [ ] workflow-agents.md로 TDD 자동화 구축
- [ ] 문서 개선 기여

---

## 📞 도움이 필요하면

1. **빠른 답변 필요**: TEST_GUIDE_QUICK.md 확인
2. **패턴 이해 필요**: patterns.md 참조
3. **예시 필요**: examples.md 검색
4. **실수 방지**: antipatterns.md 체크
5. **전체 이해**: TEST_GUIDE.md 정독
