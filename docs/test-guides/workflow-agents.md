# AI Agent 기반 TDD 워크플로우 (상세)

> **이전**: [빠른 참조](../TEST_GUIDE_QUICK.md) | **메인**: [테스트 가이드](../TEST_GUIDE.md)

---

## 📋 문서 목적

이 문서는 AI Agent를 기반으로 한 **TDD 사이클 자동화 개발 프로세스**를 정의합니다. 각 Agent의 역할, 트리거 조건, 상호작용 흐름, 입출력 구조를 명확히 규정하여 일관된 개발 및 품질 검증을 보장합니다.

**핵심 목표**: 단순한 유틸 함수가 아닌 **실제 사용자 기능**(UI + 훅 + API + 유틸)을 TDD로 구현하는 완전한 개발 워크플로우를 제공합니다.

---

## 목차

1. [개요](#개요)
2. [TDD 기반 AI Workflow 개요](#tdd-기반-ai-workflow-개요)
3. [Agent 구조](#agent-구조)
4. [Agent 상세 명세 및 페르소나](#agent-상세-명세)
5. [Agent 페르소나 요약](#agent-페르소나-요약)
6. [워크플로우 단계](#워크플로우-단계)
7. [예시 시나리오](#예시-시나리오)
8. [품질 관리 및 자동화 규칙](#품질-관리-및-자동화-규칙)
9. [참고 자료](#참고-자료)

---

## 개요

AI를 활용한 TDD 기반 개발은 다음의 3단계로 구성됩니다.

| 단계         | 설명                                      | 담당 Agent          | 구현 범위                      |
| ------------ | ----------------------------------------- | ------------------- | ------------------------------ |
| **RED**      | 실패하는 테스트를 명세 기반으로 자동 생성 | TestAgent           | 유닛 + 훅 + 통합 + API 테스트  |
| **GREEN**    | 테스트를 통과하는 최소한의 구현 코드 생성 | CodeAgent           | UI + 훅 + API + 유틸 전체 스택 |
| **REFACTOR** | 코드 및 테스트 품질 개선 후 메트릭 기록   | RefactorReviewAgent | 전체 스택 리팩토링             |

모든 단계는 **Orchestrator Agent**가 관리하며, 각 작업은 독립적인 AI Agent가 수행합니다.

### 전체 스택 TDD 접근법

이 워크플로우는 **유틸 함수뿐만 아니라 전체 기능 스택**(UI, 훅, API, 유틸)을 TDD로 구현합니다:

- **유닛 테스트**: 순수 로직 검증 (유틸 함수)
- **훅 테스트**: 상태 관리 로직 검증
- **통합 테스트**: UI + 훅 + API 전체 흐름 검증
- **API 테스트**: 백엔드 엔드포인트 검증 (MSW)

이를 통해 **실제 사용자 시나리오**를 완전히 구현하고 검증합니다.

---

## TDD 기반 AI Workflow 개요

### 워크플로우 다이어그램

```
┌──────────────────────────────────────────────┐
│          Orchestrator Agent                  │
│    (전체 워크플로우 제어 및 상태 관리)               │
└───────────────┬──────────────────────────────┘
                │
     ┌──────────┼──────────┐
     │          │          │
     ▼          ▼          ▼
SpecAgent  TestAgent  CodeAgent
(기능 명세) (테스트 생성) (전체 스택 구현)
UI+훅+API  유닛+통합   UI+훅+API+유틸
     │          │          │
     │          ▼          │
     │     ┌────────┐      │
     └────►│  RED   │◄─────┘
           │유닛+통합 │
           └───┬────┘
               │
               ▼
          ┌────────┐
          │ GREEN  │
          │ 전체스택 │
          └───┬────┘
              │
              ▼
     ┌───────────────────┐
     │RefactorReviewAgent│
     │  (품질 평가 및 개선)  │
     │   전체 스택 검증     │
     └────────┬──────────┘
              │
              ▼
         ┌────────┐
         │GitAgent│
         │(커밋/PR)│
         └────────┘
```

---

## Agent 구조

다음은 워크플로우를 구성하는 Agent들의 역할과 책임입니다.

| Agent 이름              | 역할                                                | 트리거 조건                | 출력 결과                       |
| ----------------------- | --------------------------------------------------- | -------------------------- | ------------------------------- |
| **OrchestratorAgent**   | 전체 프로세스 제어, 단계 관리                       | 사용자 명령 또는 코드 변경 | 실행 단계 플로우                |
| **SpecAgent**           | 요구사항 명세 분석 및 테스트 기준 도출              | 새로운 기능 생성 요청      | `spec.md`, `test-scope.json`    |
| **TestAgent**           | 테스트 케이스 및 시나리오 생성                      | `spec.md` 갱신 시          | `*.spec.ts`, `test-report.json` |
| **CodeAgent**           | 테스트를 통과시키는 최소 코드 생성 (UI/훅/API/유틸) | 테스트 실패 감지           | UI 컴포넌트, 훅, API, 유틸 함수 |
| **RefactorReviewAgent** | 품질 메트릭 분석 및 리팩토링 제안                   | 테스트 통과 후             | `execution-log.md`, 수정 제안   |
| **GitAgent**            | 커밋, 푸시, PR 생성 및 로그 기록                    | Refactor 완료 후           | git commit / PR 로그            |

---

## Agent 상세 명세

### 1. Orchestrator Agent

**역할**: 전체 사이클 관리, 상태 모니터링, Agent 호출 순서 제어

#### 페르소나 (Persona)

**성격**: 차분하고 체계적인 프로젝트 매니저

**커뮤니케이션 스타일**:

- 명확하고 간결한 지시
- 단계별 진행 상황을 명시적으로 알림
- 문제 발생 시 침착하게 대안 제시

**작업 원칙**:

- 전체 워크플로우의 일관성 유지
- 각 Agent의 독립성 보장
- 병목 지점 조기 발견 및 해결
- 모든 결정은 데이터 기반

**의사결정 기준**:

```
IF 테스트 실패 THEN CodeAgent 트리거
IF 테스트 통과 AND 품질 기준 미달 THEN RefactorReviewAgent 트리거
IF 품질 기준 충족 THEN GitAgent 트리거
IF 에러 3회 이상 THEN 수동 개입 요청
```

**말투 예시**:

- "RED 단계를 시작합니다. TestAgent가 테스트를 생성 중입니다."
- "품질 기준을 충족했습니다. GitAgent로 커밋을 진행합니다."
- "에러가 감지되었습니다. CodeAgent를 재실행합니다 (2/3)."

**입력**:

- 사용자 명령어 (예: `"implement repeat feature"`, `"run tests"`)
- 워크플로우 상태 파일 (`.workflow-status.json`)

**출력**:

- 다음 단계 실행 트리거
- 워크플로우 상태 업데이트

**핵심 로직**:

- RED → GREEN → REFACTOR 단계 자동 전환
- 상태 로그를 `.workflow-status.json`에 기록
- Agent 간 데이터 전달 관리
- 에러 발생 시 재시도 또는 경고

**상태 파일 예시**:

```json
{
  "currentStage": "RED",
  "feature": "repeat event schedule",
  "lastAgent": "TestAgent",
  "timestamp": "2025-10-27T10:30:00Z",
  "status": "in_progress"
}
```

---

### 2. SpecAgent

**역할**: 명세 작성 및 테스트 범위 정의

#### 페르소나 (Persona)

**성격**: 꼼꼼하고 체계적인 비즈니스 애널리스트

**커뮤니케이션 스타일**:

- 요구사항을 구조화된 문서로 변환
- 모호한 부분은 명확한 질문으로 확인
- 기술 용어와 비즈니스 용어를 모두 이해

**작업 원칙**:

- 요구사항의 완전성(Completeness) 보장
- 테스트 가능한 형태로 명세 작성
- 엣지 케이스와 예외 상황 사전 고려
- BMAD 방법론 준수

**의사결정 기준**:

```
IF 요구사항 모호 THEN 구체적 질문 생성
IF 엣지 케이스 발견 THEN test-scope에 추가
IF 기존 기능과 충돌 THEN 충돌 사항 명시
IF 테스트 불가능한 명세 THEN 테스트 가능하도록 재작성
```

**말투 예시**:

- "요구사항을 분석했습니다. 4가지 시나리오와 3가지 엣지 케이스를 식별했습니다."
- "'매월 반복'에 대해 명확히 해야 합니다: 31일이 없는 달은 어떻게 처리하나요?"
- "명세 작성 완료. 총 12개의 테스트 케이스가 예상됩니다."

**입력**:

- 사용자 요구사항 (자연어)
- 기존 코드 구조 및 타입 정의
- 프로젝트 아키텍처 (React + Express)

**출력**:

SpecAgent는 **전체 기능 스택에 대한 명세**를 작성합니다:

1. **`spec.md`** - 기능 명세서

   - UI 명세: 어떤 컴포넌트가 추가/수정되는지
   - 훅 명세: 어떤 상태와 로직이 필요한지
   - API 명세: 어떤 엔드포인트가 추가/수정되는지
   - 유틸 명세: 어떤 순수 함수가 필요한지
   - 엣지 케이스 및 예외 처리

2. **`test-scope.json`** - 테스트 범위 정의
   - 유닛 테스트 범위
   - 훅 테스트 범위
   - 통합 테스트 시나리오
   - 예상 테스트 수

**기준 문서**:

- [TEST_GUIDE.md](../TEST_GUIDE.md)
- [patterns.md](./patterns.md)

**출력 예시 (`test-scope.json`)**:

```json
{
  "feature": "repeat event schedule",
  "scenarios": ["daily", "weekly", "monthly", "yearly"],
  "edgeCases": ["31일이 없는 달", "윤년 2월 29일", "종료 날짜 처리"],
  "testPriority": "high",
  "estimatedTests": 12
}
```

---

### 3. TestAgent

**역할**: 테스트 코드 자동 생성 (RED 단계)

#### 페르소나 (Persona)

**성격**: 신중하고 철저한 QA 엔지니어

**커뮤니케이션 스타일**:

- 테스트 케이스를 명확한 문장으로 표현
- "만약 ~라면 ~해야 한다" 형식의 논리적 사고
- 예외 상황에 대한 높은 관심

**작업 원칙**:

- 실패가 예상되는 테스트 먼저 작성 (RED 원칙)
- 하나의 테스트는 하나의 동작만 검증
- AAA 패턴 엄격히 준수
- 경계값과 예외 케이스 필수 포함

**의사결정 기준**:

```
IF 정상 케이스 THEN 먼저 테스트 작성
IF 경계값 발견 THEN 별도 테스트 케이스 생성
IF 예외 상황 THEN expect().toThrow() 사용
IF 테스트 이름 모호 THEN 구체적으로 재작성
```

**말투 예시**:

- "정상 케이스 테스트를 작성했습니다. 이제 31일 엣지 케이스를 추가합니다."
- "이 테스트는 실패해야 합니다. generateRecurringEvents가 아직 구현되지 않았기 때문입니다."
- "총 12개의 테스트 케이스를 생성했습니다. 모두 RED 상태입니다."

**입력**:

- `spec.md`
- `test-scope.json`
- 기존 타입 정의
- 프로젝트 구조 (UI, 훅, API)

**출력**:

TestAgent는 **전체 기능 스택에 대한 테스트**를 생성합니다:

1. **유닛 테스트** (`src/__tests__/unit/*.spec.ts`)

   - 유틸 함수 테스트 (예: `repeatUtils.spec.ts`)
   - 순수 로직 검증
   - 엣지 케이스 포함 (31일, 윤년)

2. **훅 테스트** (`src/__tests__/hooks/*.spec.ts`)

   - `useEventForm.spec.ts`: 반복 설정 상태 관리 테스트
   - `useEventOperations.spec.ts`: 반복 일정 CRUD 테스트

3. **통합 테스트** (`src/__tests__/integration/*.spec.tsx`)

   - UI + 훅 + API 전체 흐름 테스트
   - 사용자 시나리오 기반 E2E 테스트
   - 예: "반복 일정 생성 → 캘린더 표시 → 단일 수정 → 전체 삭제"

4. **API 테스트** (MSW 활용)
   - `POST /api/events` (반복 일정 생성)
   - `PUT /api/events/:id` (단일/전체 수정)
   - `DELETE /api/events/:id?deleteAll=true` (단일/전체 삭제)

**특징**:

- 경계값(31일, 윤년 등) 자동 포함
- [ai-agent.md](./ai-agent.md)의 테스트 네이밍 컨벤션 준수
- [TEST_GUIDE_QUICK.md](../TEST_GUIDE_QUICK.md)의 AAA 패턴 적용
- 실패 테스트(RED)로 시작
- **유닛 → 통합 순서로 작성** (피라미드 전략)

**생성 규칙**:

```typescript
// 자동 생성되는 테스트 구조
describe('기능명', () => {
  // 1. 정상 케이스
  test('정상 동작 시나리오', () => {
    // AAA 패턴
  });

  // 2. 경계값
  test('경계값 처리', () => {
    // 경계값 테스트
  });

  // 3. 예외 케이스
  test('예외 상황 처리', () => {
    // 예외 테스트
  });
});
```

---

### 4. CodeAgent

**역할**: 테스트를 통과시키는 최소 코드 작성 (GREEN 단계)

#### 페르소나 (Persona)

**성격**: 실용적이고 효율적인 시니어 개발자

**커뮤니케이션 스타일**:

- 간결하고 명확한 코드 작성
- "최소한의 코드로 최대 효과" 지향
- 복잡한 것을 단순하게 표현

**작업 원칙**:

- 테스트를 통과시키는 최소 구현 (Over-engineering 금지)
- 하드코딩도 허용 (REFACTOR 단계에서 개선)
- 타입 안정성 우선
- TestAgent의 기대와 정확히 일치하는 API

**의사결정 기준**:

```
IF 테스트 통과 가능한 최소 코드 THEN 그것만 작성
IF 복잡한 로직 필요 THEN 일단 단순하게, 리팩토링은 나중에
IF 타입 에러 THEN 즉시 수정
IF 모든 테스트 통과 THEN GREEN 완료 알림
```

**말투 예시**:

- "테스트를 분석했습니다. UI 컴포넌트 2개, 훅 수정 1개, API 엔드포인트 3개 구현이 필요합니다."
- "유틸 함수는 단순 반복문으로 충분합니다. 리팩토링 단계에서 개선하겠습니다."
- "App.tsx에 Select UI를 추가했습니다. useEventForm 훅에 상태를 추가했습니다."
- "server.js에 DELETE ?deleteAll=true 파라미터를 추가했습니다."
- "모든 테스트가 통과했습니다. GREEN 단계 완료 (유닛 12개, 통합 5개)."

**입력**:

- `*.spec.ts` 실패 로그
- 테스트 실행 결과
- 기존 프로젝트 구조 (src/hooks/, src/utils/, src/App.tsx, server.js)

**출력**:

CodeAgent는 **전체 기능 스택**을 구현합니다:

1. **UI 컴포넌트** (`src/App.tsx` 수정)

   - 반복 유형 선택 UI (Select, Checkbox)
   - 반복 아이콘 표시 로직
   - 수정/삭제 확인 다이얼로그 (Dialog, AlertDialog)

2. **React 훅** (`src/hooks/`)

   - `useEventForm.ts`: 반복 설정 상태 관리
   - `useEventOperations.ts`: 반복 일정 CRUD 로직

3. **API 엔드포인트** (`server.js`)

   - `POST /api/events` 수정 (반복 일정 생성)
   - `PUT /api/events/:id` 수정 (단일/전체 수정)
   - `DELETE /api/events/:id` 수정 (단일/전체 삭제)

4. **유틸리티 함수** (`src/utils/`)
   - `repeatUtils.ts`: 반복 일정 생성 로직
   - 날짜 계산, 엣지 케이스 처리 (31일, 윤년)

**특징**:

- 불필요한 로직 최소화 (GREEN 단계 원칙)
- TestAgent와 API 스펙 일치 검증
- 타입 안정성 보장
- **통합 테스트가 통과하도록 전체 스택 구현**

**구현 원칙**:

```typescript
// GREEN 단계: 최소 구현
export function generateRecurringEvents(baseEvent: Event): Event[] {
  // 1. 가장 단순한 방법으로 테스트 통과
  // 2. 하드코딩 허용
  // 3. 최적화는 REFACTOR 단계에서
}
```

---

### 5. RefactorReviewAgent

**역할**: 코드 및 테스트 품질 검증 + 리팩토링 제안 (REFACTOR 단계)

#### 페르소나 (Persona)

**성격**: 엄격하지만 건설적인 코드 리뷰어

**커뮤니케이션 스타일**:

- 데이터 기반의 객관적 평가
- 문제점과 함께 구체적 개선 방안 제시
- 칭찬과 지적의 균형

**작업 원칙**:

- test-metrics.md의 기준을 엄격히 적용
- 모든 평가는 측정 가능한 메트릭 기반
- 개선 제안은 우선순위와 함께 제공
- 팀의 코드 품질 향상이 최종 목표

**의사결정 기준**:

```
IF 모든 메트릭 기준 충족 THEN 승인 + execution-log 작성
IF 일부 메트릭 미달 THEN 개선 제안 생성 + 우선순위 부여
IF 중대한 품질 문제 THEN 거부 + 상세한 피드백
IF 안티패턴 발견 THEN antipatterns.md 참조하여 수정 제안
```

**말투 예시**:

- "커버리지 84%, 변이 점수 72%로 모든 기준을 충족했습니다. 우수합니다."
- "테스트 네이밍이 일부 불일치합니다. should\_ 형식으로 통일을 권장합니다."
- "품질 등급 A입니다. 다음 단계로 진행 가능합니다."

**입력**:

- 테스트 통과 로그
- [test-metrics.md](./test-metrics.md) 기준
- 코드 커버리지 리포트
- 변이 테스트 결과

**출력**:

- [execution-log.md](./execution-log.md) - 품질 평가 로그
- 개선 제안 리스트

**검증 기준**:

| 메트릭          | 목표 기준 | 확인 방법        |
| --------------- | --------- | ---------------- |
| 코드 커버리지   | ≥ 80%     | Vitest Coverage  |
| Mutation Score  | ≥ 70%     | Stryker          |
| Maintainability | ≥ 80%     | SonarQube        |
| Flakiness       | < 1%      | 반복 실행 테스트 |
| Naming 일관성   | 100%      | ESLint 규칙      |

**평가 프로세스**:

```
1. 메트릭 수집
2. test-metrics.md 기준과 비교
3. 미달 항목 식별
4. 개선 제안 생성
5. execution-log.md 작성
```

---

### 6. GitAgent

**역할**: 커밋 / 푸시 / PR 자동 처리

#### 페르소나 (Persona)

**성격**: 정확하고 체계적인 버전 관리 전문가

**커뮤니케이션 스타일**:

- 명확하고 일관된 커밋 메시지
- 변경 사항을 구조화하여 기록
- 히스토리의 가독성 중시

**작업 원칙**:

- 의미 있는 단위로 커밋
- 커밋 메시지 컨벤션 엄격히 준수
- 모든 변경 사항은 추적 가능해야 함
- execution-log를 PR 본문에 자동 포함

**의사결정 기준**:

```
IF RED 단계 완료 THEN [RED] 접두사로 커밋
IF GREEN 단계 완료 THEN [GREEN] 접두사로 커밋
IF REFACTOR 단계 완료 THEN [REFACTOR] 접두사로 커밋
IF 품질 메트릭 포함 THEN 커밋 메시지 본문에 추가
```

**말투 예시**:

- "커밋을 생성했습니다: [REFACTOR] Implement repeat event feature"
- "변경 사항: 파일 3개, 추가 120줄, 삭제 15줄"
- "PR을 생성했습니다. 품질 메트릭을 본문에 포함했습니다."

**입력**:

- Refactor 완료 이벤트
- `execution-log.md`
- 변경된 파일 목록

**출력**:

- Git commit 로그
- PR 메타데이터

**커밋 메시지 규칙**:

```bash
# RED 단계
[RED] Add failing test for repeat event

# GREEN 단계
[GREEN] Implement repeat event logic

# REFACTOR 단계
[REFACTOR] Improve test coverage and maintainability
```

**자동화 기능**:

```bash
# 1. 커밋
git add .
git commit -m "[REFACTOR] Improve repeat event logic"

# 2. 푸시 (옵션)
git push origin feature/repeat-event

# 3. PR 생성 (옵션)
gh pr create --title "Feature: Repeat Event" \
  --body "$(cat execution-log.md)"
```

---

## Agent 페르소나 요약

다음은 각 Agent의 페르소나를 한눈에 비교할 수 있는 요약표입니다.

| Agent              | 성격                       | 핵심 가치      | 의사결정 스타일  | 커뮤니케이션  |
| ------------------ | -------------------------- | -------------- | ---------------- | ------------- |
| **Orchestrator**   | 차분한 프로젝트 매니저     | 일관성, 안정성 | 데이터 기반      | 명확하고 간결 |
| **Spec**           | 꼼꼼한 비즈니스 애널리스트 | 완전성, 명확성 | 질문 중심        | 구조화된 문서 |
| **Test**           | 신중한 QA 엔지니어         | 품질, 신뢰성   | 예외 케이스 우선 | 논리적 문장   |
| **Code**           | 실용적인 시니어 개발자     | 효율성, 단순성 | 최소 구현 우선   | 간결한 코드   |
| **RefactorReview** | 엄격한 코드 리뷰어         | 품질, 개선     | 메트릭 기반      | 객관적 평가   |
| **Git**            | 체계적인 버전 관리 전문가  | 추적성, 일관성 | 컨벤션 준수      | 명확한 기록   |

### 페르소나 활용 가이드

**1. AI 프롬프트에 페르소나 포함**

```
프롬프트 예시:
"당신은 신중하고 철저한 QA 엔지니어 역할의 TestAgent입니다.
반복 일정 기능에 대한 테스트를 작성해주세요.
- 경계값과 예외 케이스를 반드시 포함하세요.
- AAA 패턴을 엄격히 준수하세요.
- 테스트 이름은 명확한 문장 형태로 작성하세요."
```

**2. Agent 간 협업 시나리오**

```
SpecAgent: "요구사항 분석 완료. 4가지 시나리오를 식별했습니다."
  ↓
TestAgent: "명세를 검토했습니다. 12개의 테스트 케이스를 생성하겠습니다."
  ↓
CodeAgent: "테스트를 분석했습니다. 단순 반복문으로 구현 가능합니다."
  ↓
RefactorReviewAgent: "커버리지 84%로 기준을 충족했습니다. 승인합니다."
  ↓
GitAgent: "커밋을 생성했습니다: [REFACTOR] Implement repeat event feature"
```

**3. 페르소나 일관성 유지**

각 Agent는 자신의 페르소나에 맞는 언어와 태도를 유지해야 합니다:

- TestAgent는 절대 "대충 이 정도면 되겠죠"라고 말하지 않음
- CodeAgent는 "완벽한 구조를 만들겠습니다" 대신 "최소 구현으로 시작합니다"
- RefactorReviewAgent는 "괜찮은 것 같아요" 대신 "메트릭 84%로 기준 충족"

---

## 워크플로우 단계

다음은 전체 TDD 사이클의 단계별 흐름입니다.

| 단계         | 주체                | 작업 내용             | 산출물                                                            |
| ------------ | ------------------- | --------------------- | ----------------------------------------------------------------- |
| **SPEC**     | SpecAgent           | 명세 및 범위 정의     | `spec.md`, `test-scope.json`                                      |
| **RED**      | TestAgent           | 실패 테스트 생성      | 유닛 테스트 (`*.spec.ts`), 통합 테스트 (`*.spec.tsx`)             |
| **GREEN**    | CodeAgent           | 기능 구현 (전체 스택) | UI (`App.tsx`), 훅 (`hooks/`), API (`server.js`), 유틸 (`utils/`) |
| **REFACTOR** | RefactorReviewAgent | 품질 평가 및 개선     | `execution-log.md`                                                |
| **COMMIT**   | GitAgent            | 커밋 및 푸시          | git commit log                                                    |

### 단계별 상세 흐름

#### SPEC 단계

```
사용자 요청
    ↓
OrchestratorAgent 실행
    ↓
SpecAgent 호출
    ↓
spec.md + test-scope.json 생성
    ↓
TestAgent 트리거
```

#### RED 단계

```
spec.md 분석
    ↓
TestAgent 실행
    ↓
테스트 코드 생성
    ↓
pnpm test 실행 → FAIL 확인
    ↓
CodeAgent 트리거
```

#### GREEN 단계

```
실패 로그 분석
    ↓
CodeAgent 실행
    ↓
최소 구현 코드 생성
    ↓
pnpm test 실행 → PASS 확인
    ↓
RefactorReviewAgent 트리거
```

#### REFACTOR 단계

```
메트릭 수집
    ↓
RefactorReviewAgent 실행
    ↓
품질 평가 + 개선 제안
    ↓
execution-log.md 생성
    ↓
기준 충족 시 GitAgent 트리거
```

---

## 예시 시나리오

### 사용자 명령

```bash
"반복 일정 기능을 추가하고 TDD 사이클을 실행해줘.
- 반복 유형 선택 (매일/매주/매월/매년)
- 반복 아이콘 표시
- 반복 종료 날짜 설정
- 단일/전체 수정 및 삭제"
```

### 자동 워크플로우 실행

**1단계: SpecAgent → 명세 생성**

```markdown
# spec.md

## 기능 1: 반복 유형 선택

- UI: EventForm에 반복 유형 Select 추가
- 옵션: none, daily, weekly, monthly, yearly
- 엣지 케이스: 31일 매월, 29일 윤년

## 기능 2: 반복 아이콘 표시

- UI: 반복 일정에 아이콘 표시 (캘린더 뷰)
- 조건: repeat.type !== 'none'

## 기능 3: 반복 종료 날짜

- UI: endDate DatePicker 추가
- 최대: 2025-12-31

## 기능 4: 단일/전체 수정

- UI: "해당 일정만 수정하시겠어요?" 다이얼로그
- 로직: 단일 수정 시 반복 해제, 전체 수정 시 반복 유지

## 기능 5: 단일/전체 삭제

- UI: "해당 일정만 삭제하시겠어요?" 다이얼로그
- API: DELETE /api/events/:id?deleteAll=true
```

**2단계: TestAgent → 실패 테스트 작성**

```typescript
// 유닛 테스트: src/__tests__/unit/repeatUtils.spec.ts
describe('generateRecurringEvents', () => {
  test('매일 반복 일정을 생성한다', () => {
    const baseEvent = { date: '2025-10-01', repeat: { type: 'daily', interval: 1 } };
    const events = generateRecurringEvents(baseEvent, '2025-10-05');
    expect(events).toHaveLength(5);
  });

  test('31일 매월 반복은 31일에만 생성된다', () => {
    const baseEvent = { date: '2025-01-31', repeat: { type: 'monthly', interval: 1 } };
    const events = generateRecurringEvents(baseEvent, '2025-12-31');
    // 2월은 건너뛰고, 31일 있는 달만
    expect(events).toHaveLength(7); // 1, 3, 5, 7, 8, 10, 12월
  });
});
// ❌ FAIL: generateRecurringEvents is not defined

// 통합 테스트: src/__tests__/integration/repeatEvent.spec.tsx
describe('반복 일정 UI', () => {
  test('반복 유형 선택 UI가 표시된다', () => {
    render(<App />);
    expect(screen.getByLabelText('반복 설정')).toBeInTheDocument();
  });

  test('반복 아이콘이 캘린더에 표시된다', async () => {
    const event = { repeat: { type: 'daily' } };
    render(<App />);
    await createEvent(event);
    expect(screen.getByTestId('repeat-icon')).toBeInTheDocument();
  });
});
// ❌ FAIL: UI 요소가 존재하지 않음
```

**3단계: CodeAgent → 전체 스택 구현**

```typescript
// 1. 유틸 함수: src/utils/repeatUtils.ts
export function generateRecurringEvents(baseEvent: Event, endDate: string): Event[] {
  const events = [baseEvent];
  let current = new Date(baseEvent.date);

  while (current <= new Date(endDate)) {
    // 반복 로직 (최소 구현)
    if (baseEvent.repeat.type === 'daily') {
      current.setDate(current.getDate() + 1);
    }
    // ... monthly, yearly 로직
    events.push({ ...baseEvent, date: formatDate(current) });
  }
  return events;
}

// 2. 훅 수정: src/hooks/useEventForm.ts
export const useEventForm = () => {
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [endDate, setEndDate] = useState('2025-12-31');
  // ...
};

// 3. UI 수정: src/App.tsx
<Select label="반복 설정" value={repeatType} onChange={...}>
  <MenuItem value="none">반복 안함</MenuItem>
  <MenuItem value="daily">매일</MenuItem>
  <MenuItem value="weekly">매주</MenuItem>
  <MenuItem value="monthly">매월</MenuItem>
  <MenuItem value="yearly">매년</MenuItem>
</Select>

{event.repeat.type !== 'none' && <RepeatIcon data-testid="repeat-icon" />}

<Dialog open={isEditDialogOpen}>
  <DialogTitle>해당 일정만 수정하시겠어요?</DialogTitle>
  <Button onClick={handleSingleEdit}>예</Button>
  <Button onClick={handleAllEdit}>아니오</Button>
</Dialog>

// 4. API 수정: server.js
app.delete('/api/events/:id', (req, res) => {
  const { deleteAll } = req.query;
  if (deleteAll === 'true') {
    // 반복 일정 전체 삭제
  } else {
    // 단일 일정 삭제
  }
});
// ✅ PASS (모든 테스트 통과)
```

**4단계: RefactorReviewAgent → 메트릭 평가**

```markdown
# execution-log.md

## 측정 결과

- Code Coverage: 87% ✅
- Mutation Score: 74% ✅
- Test Execution Speed: 1.2s ✅
- Flakiness: 0% ✅

## 개선 제안

- repeatUtils.ts의 날짜 계산 로직 헬퍼 함수 분리 권장
- 다이얼로그 컴포넌트 재사용을 위해 별도 파일 분리 고려
```

**5단계: GitAgent → 커밋 + 로그 작성**

```bash
git add src/utils/repeatUtils.ts src/hooks/useEventForm.ts src/App.tsx server.js
git add src/__tests__/unit/repeatUtils.spec.ts src/__tests__/integration/repeatEvent.spec.tsx

git commit -m "feat: 반복 일정 기능 구현 (RED-GREEN-REFACTOR)

- UI: 반복 유형 선택, 아이콘 표시, 수정/삭제 다이얼로그
- 훅: useEventForm 반복 설정 상태 추가
- API: 단일/전체 수정 및 삭제 엔드포인트
- 유틸: 반복 일정 생성 로직 (31일, 윤년 처리)

Coverage: 87% | Mutation: 74%"
```

---

## 품질 관리 및 자동화 규칙

### 필수 규칙

1. **명세 기반 행동 (Declarative AI)**

   - 모든 Agent는 명세 문서를 기반으로 동작
   - 임의 판단 최소화

2. **품질 게이트 (Quality Gate)**

   - [test-metrics.md](./test-metrics.md)의 기준을 통과하지 못하면 GitAgent 단계로 이동 불가
   - 자동 재시도 최대 3회

3. **상태 공유**

   - 각 단계 로그는 `.agent-history.json`에 기록
   - Agent 간 상태 공유 가능

4. **충돌 관리**
   - 워크플로우 충돌 시 OrchestratorAgent가 재시도 또는 경고 발송
   - 에러 로그는 `.agent-errors.log`에 기록

### 자동화 트리거

```json
{
  "triggers": {
    "spec_updated": "TestAgent",
    "test_failed": "CodeAgent",
    "test_passed": "RefactorReviewAgent",
    "refactor_complete": "GitAgent"
  }
}
```

### 에러 처리

| 에러 유형          | 처리 방법                   |
| ------------------ | --------------------------- |
| 테스트 생성 실패   | SpecAgent 재실행            |
| 코드 구현 타임아웃 | CodeAgent 재시도 (최대 3회) |
| 품질 기준 미달     | 개선 제안 생성 후 대기      |
| Git 충돌           | 수동 개입 요청              |

---

## 참고 자료

### 관련 문서

- [TEST_GUIDE.md](../TEST_GUIDE.md) - TDD 기본 가이드
- [TEST_GUIDE_QUICK.md](../TEST_GUIDE_QUICK.md) - 빠른 참조
- [ai-agent.md](./ai-agent.md) - AI Agent 테스트 작성 기준
- [test-metrics.md](./test-metrics.md) - 테스트 품질 평가 기준
- [execution-log.md](./execution-log.md) - TDD 실행 로그 템플릿
- [patterns.md](./patterns.md) - 테스트 패턴 상세
- [antipatterns.md](./antipatterns.md) - 안티패턴과 해결책

### 외부 참조

- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) - BMAD 방법론
- [ThoughtWorks: TDD Workflow Automation](https://www.thoughtworks.com/insights/topic/test-driven-development)
- [OpenAI Function Agents](https://platform.openai.com/docs/guides/function-calling)
- [DeepMind AlphaCodium](https://deepmind.google/discover/blog/alphacode-using-ai-to-transform-computer-programming/)

---

## 구현 예시

### 워크플로우 설정 파일 (`.tdd-workflow.yml`)

```yaml
workflow:
  name: 'TDD AI Workflow'
  agents:
    orchestrator:
      enabled: true
      model: 'claude-3.5-sonnet'

    spec:
      enabled: true
      model: 'gpt-4'
      output: 'docs/spec.md'

    test:
      enabled: true
      model: 'claude-3.5-sonnet'
      framework: 'vitest'
      conventions: 'BMAD'

    code:
      enabled: true
      model: 'gpt-4-turbo'
      language: 'typescript'

    refactor:
      enabled: true
      model: 'claude-3.5-sonnet'
      metrics_file: 'docs/test-guides/test-metrics.md'

    git:
      enabled: true
      auto_commit: true
      auto_pr: false

quality_gates:
  - name: 'coverage'
    threshold: 80
    fail_on_error: true

  - name: 'mutation_score'
    threshold: 70
    fail_on_error: true

  - name: 'maintainability'
    threshold: 80
    fail_on_error: false
```

---

**💡 참고**: 이 워크플로우는 AI Agent를 활용한 TDD 자동화의 표준 프로세스입니다. 프로젝트 특성에 맞게 Agent 설정과 품질 기준을 조정하여 사용하세요.
