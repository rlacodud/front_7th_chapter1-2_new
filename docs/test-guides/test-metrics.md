# 테스트 품질 평가 기준 (상세)

> **이전**: [빠른 참조](../TEST_GUIDE_QUICK.md) | **메인**: [테스트 가이드](../TEST_GUIDE.md)

---

## 📋 문서 목적

이 문서는 테스트 품질을 객관적이고 측정 가능한 방식으로 평가하기 위한 기준을 정의합니다. 단순히 테스트의 "통과 여부"를 넘어서, 테스트 코드의 **신뢰도**, **유지보수성**, **효과성**을 정량적으로 측정하고 개선할 수 있도록 명확한 지표를 제시합니다.

이 메트릭들은 사람과 AI Agent 모두가 일관되게 적용할 수 있으며, CI/CD 파이프라인에서 자동으로 수집 및 모니터링됩니다.

---

## 목차

1. [핵심 메트릭](#핵심-메트릭)
2. [보조 지표](#보조-지표)
3. [목표값 요약](#목표값-요약)
4. [측정 및 수집 방법](#측정-및-수집-방법)
5. [품질 개선 가이드](#품질-개선-가이드)
6. [참고 자료](#참고-자료)

---

## 핵심 메트릭

### 1. 코드 커버리지 (Code Coverage)

**정의**: 테스트가 실행하는 코드의 비율을 측정하여 테스트되지 않은 코드 영역을 파악합니다.

**측정 유형**:

- **Statement Coverage**: 전체 문장 중 실행된 문장의 비율
- **Branch Coverage**: 조건문의 모든 분기가 실행된 비율
- **Function Coverage**: 호출된 함수의 비율
- **Line Coverage**: 실행된 코드 라인의 비율

**측정 도구**:

- Vitest (권장)
- Jest
- Istanbul (nyc)

**목표 기준**:

- Statement Coverage: **≥ 80%**
- Branch Coverage: **≥ 70%**
- Function Coverage: **≥ 85%**

**중요한 주의사항**:

커버리지는 **필요조건**이지 **충분조건이 아닙니다**. 높은 커버리지가 좋은 테스트를 의미하지는 않습니다. 반드시 변이 테스트(Mutation Testing)와 병행하여 테스트의 실제 품질을 검증해야 합니다.

**해석 가이드**:

- 80% 미만: 테스트 부족, 즉시 개선 필요
- 80-90%: 적절한 수준
- 90% 이상: 우수하나, 과도한 커버리지 추구는 비효율적일 수 있음

**예시**:

```bash
# Vitest 커버리지 실행
pnpm test:coverage

# 출력 예시
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   84.21 |    72.15 |   87.50 |   84.21 |
 event.ts           |   90.00 |    85.00 |   100.0 |   90.00 |
 calendar.ts        |   78.50 |    60.00 |    75.0 |   78.50 |
--------------------|---------|----------|---------|---------|
```

---

### 2. 변이 테스트 점수 (Mutation Score)

**정의**: 코드에 인위적인 버그(변이)를 주입했을 때, 테스트가 이를 탐지하는 비율을 측정합니다. 테스트가 실제로 버그를 잡아낼 수 있는 능력을 평가합니다.

**작동 원리**:

1. 원본 코드의 일부를 변경 (예: `>` → `>=`, `+` → `-`)
2. 변이된 코드로 테스트 실행
3. 테스트가 실패하면 "변이 탐지 성공"
4. 탐지된 변이 / 전체 변이 × 100 = 변이 점수

**측정 도구**:

- Stryker (JavaScript/TypeScript 권장)
- Mutant
- PIT (Java)

**목표 기준**:

- Mutation Score: **≥ 70%**

**중요성**:

높은 코드 커버리지(95%)를 달성해도 변이 점수가 낮다면(50%), 테스트가 형식적으로만 존재하고 실제 버그를 탐지하지 못한다는 의미입니다.

**예시**:

```typescript
// 원본 코드
function isPositive(n: number): boolean {
  return n > 0; // 변이: > → >=
}

// 취약한 테스트 (변이를 탐지하지 못함)
test('isPositive returns true for 1', () => {
  expect(isPositive(1)).toBe(true);
});

// 강력한 테스트 (변이를 탐지함)
test('isPositive returns true for positive numbers', () => {
  expect(isPositive(1)).toBe(true);
  expect(isPositive(0)).toBe(false); // 경계값 테스트로 변이 탐지
  expect(isPositive(-1)).toBe(false);
});
```

**실행 예시**:

```bash
# Stryker 실행
npx stryker run

# 출력 예시
Mutant killed: 72
Mutant survived: 28
Mutation score: 72.00%
```

---

### 3. 결함 탐지율 (Defect Detection Effectiveness)

**정의**: 테스트가 실제 운영 환경에서 발생 가능한 버그를 사전에 발견하는 비율을 측정합니다.

**계산 방식**:

```
결함 탐지율 = (테스트로 발견된 버그 수 / 전체 버그 수) × 100
```

**데이터 출처**:

- QA 버그 리포트
- JIRA, Linear 등 이슈 트래커
- 운영 환경 모니터링 로그
- 사용자 버그 리포트

**목표 기준**:

- **≥ 90%**

**측정 기간**:

- 스프린트 단위 (2주)
- 릴리즈 단위 (1개월)

**계산 예시**:

```
스프린트 기간 동안:
- 테스트에서 발견한 버그: 18개
- QA에서 추가 발견한 버그: 2개
- 운영 환경에서 발견된 버그: 0개
- 전체 버그: 20개

결함 탐지율 = 18 / 20 × 100 = 90%
```

**개선 방법**:

- 운영 환경에서 발견된 버그를 테스트 케이스로 추가
- 엣지 케이스 및 경계값 테스트 강화
- 사용자 시나리오 기반 테스트 추가

---

### 4. 테스트 실행 속도 (Test Execution Speed)

**정의**: 테스트 전체 또는 개별 테스트가 실행되는 데 걸리는 시간을 측정합니다. 빠른 피드백 루프는 개발 생산성에 직접적인 영향을 미칩니다.

**측정 단위**:

- 단위 테스트(Unit Test): 밀리초(ms)
- 통합 테스트(Integration Test): 초(s)
- 전체 테스트 스위트: 분(min)

**측정 도구**:

- CI/CD 파이프라인 로그
- Jest/Vitest 빌트인 타이머
- GitHub Actions 실행 시간

**목표 기준**:

- 단위 테스트: **< 200ms**
- 통합 테스트: **< 1초**
- 전체 테스트 스위트: **< 10초** (100개 테스트 기준)

**느린 테스트의 문제점**:

- 개발자가 테스트 실행을 회피하게 됨
- CI/CD 파이프라인 병목 현상
- 빠른 피드백 방해

**개선 방법**:

- 외부 의존성 제거 (Mock 대신 의존성 주입)
- 불필요한 setup/teardown 최소화
- 병렬 테스트 실행 (Vitest의 `--threads` 옵션)
- 느린 테스트는 별도 그룹으로 분리

**예시**:

```bash
# Vitest 실행 시간 측정
pnpm test

# 출력
✓ event.test.ts (12 tests) 145ms
✓ calendar.test.ts (8 tests) 89ms
✓ validator.test.ts (15 tests) 201ms  ⚠️ 느림

Test Files  3 passed (3)
     Tests  35 passed (35)
      Time  435ms
```

---

### 5. 테스트 일관성 (Consistency)

**정의**: 동일한 테스트를 여러 번 반복 실행했을 때 항상 같은 결과를 내는지를 측정합니다. 불안정한 테스트(Flaky Test)는 신뢰성을 크게 저하시킵니다.

**측정 방법**:

- 동일 테스트를 5-10회 연속 실행
- 모든 실행에서 동일한 결과(통과 또는 실패)를 내는지 확인

**계산 방식**:

```
일관성 = (일관된 결과 횟수 / 전체 실행 횟수) × 100
```

**목표 기준**:

- **100%** (모든 실행에서 동일한 결과)

**불안정한 테스트의 원인**:

- 현재 시간(`new Date()`) 사용
- 랜덤 값 사용
- 외부 API 의존
- 테스트 간 상태 공유
- 비동기 처리 미흡
- 타이밍 의존적 코드

**예시**:

```typescript
// ❌ 나쁜 예: 불안정한 테스트
test('event is today', () => {
  const event = new Event({ date: new Date() }); // 실행 시점마다 다름
  expect(event.isToday()).toBe(true);
});

// ✅ 좋은 예: 안정적인 테스트
test('event is today when date matches current date', () => {
  const TODAY = '2025-01-15';
  const event = new Event({ date: TODAY, baseDate: TODAY });
  expect(event.isToday()).toBe(true);
});
```

**측정 스크립트**:

```bash
# 테스트 10회 반복 실행
for i in {1..10}; do pnpm test; done | grep -c "PASS"
```

**개선 방법**:

- 시간 의존성 제거 (TimeProvider 패턴)
- 랜덤 값에 시드 고정
- 외부 의존성 제거 또는 의존성 주입
- 테스트 독립성 보장
- `await` 적절히 사용

---

### 6. 테스트 유지보수성 (Maintainability)

**정의**: 테스트 코드가 얼마나 이해하기 쉽고 수정하기 쉬운지를 측정합니다. 테스트는 "실행 가능한 문서"로서 명확하고 간결해야 합니다.

**측정 기준**:

- **코드 길이**: 한 테스트의 라인 수 (LOC)
- **중복율**: 반복되는 코드 비율
- **가독성**: 명확한 네이밍, 구조화
- **복잡도**: Cyclomatic Complexity
- **의존성**: 테스트 간 결합도

**측정 도구**:

- SonarQube
- ESLint
- CodeClimate
- Complexity Report

**목표 기준**:

- 유지보수성 등급: **A (≥ 80점)**
- 평균 테스트 길이: **< 20 라인**
- 중복율: **< 5%**
- 복잡도: **< 5**

**좋은 테스트의 특징**:

1. **명확한 네이밍**: 테스트 이름만으로 의도 파악 가능
2. **AAA 패턴**: Arrange-Act-Assert 구조
3. **단일 책임**: 하나의 테스트는 하나의 기능만 검증
4. **헬퍼 활용**: 공통 설정은 함수로 분리
5. **주석 최소화**: 코드 자체가 설명이 되어야 함

**예시**:

```typescript
// ❌ 유지보수성 낮음: 길고 복잡하며 의도 불명확
test('test1', () => {
  const e = new Event({ d: '2025-01-31', r: 'monthly' });
  const n = e.next();
  if (n.d === '2025-02-28') {
    expect(true).toBe(true);
  } else {
    throw new Error('failed');
  }
});

// ✅ 유지보수성 높음: 명확하고 간결하며 의도 명시
test('1월 31일 매월 반복 일정의 2월 발생 날짜는 2월 28일이다', () => {
  // Arrange
  const event = new Event({ date: '2025-01-31', repeat: 'monthly' });

  // Act
  const next = event.getNextOccurrence();

  // Assert
  expect(next.date).toBe('2025-02-28');
});
```

**측정 예시**:

```bash
# SonarQube 분석
sonar-scanner

# 출력
Maintainability Rating: A
Technical Debt: 2h
Code Smells: 3
Duplications: 2.1%
```

---

## 보조 지표

핵심 메트릭 외에 다음 보조 지표들을 모니터링하여 테스트 품질을 종합적으로 평가합니다.

| 지표                      | 정의                                          | 목표 기준 | 측정 방법                 |
| ------------------------- | --------------------------------------------- | --------- | ------------------------- |
| **Flakiness Rate**        | 랜덤하게 실패하는 테스트의 비율               | < 1%      | CI 로그 분석, 재실행 통계 |
| **Test Duplication Rate** | 중복된 테스트 케이스의 비율                   | < 5%      | 정적 분석 도구            |
| **Skipped Test Ratio**    | 비활성화되거나 건너뛴 테스트 비율             | < 3%      | `test.skip`, `xit` 카운트 |
| **CI Reliability**        | CI 환경에서 테스트가 안정적으로 실행되는 비율 | ≥ 99%     | CI 파이프라인 성공률      |
| **Test Complexity**       | 테스트 코드의 순환 복잡도 평균                | < 3       | Complexity Report         |
| **Assertion Density**     | 테스트당 평균 단언문 수                       | 1-3개     | 코드 분석                 |

---

## 목표값 요약

모든 메트릭의 목표 기준을 한눈에 확인할 수 있는 요약표입니다.

| 메트릭               | 목표 기준                      | 우선순위 | 측정 도구        |
| -------------------- | ------------------------------ | -------- | ---------------- |
| **Code Coverage**    | Statement ≥ 80%, Branch ≥ 70%  | 🔴 높음  | Vitest, Jest     |
| **Mutation Score**   | ≥ 70%                          | 🔴 높음  | Stryker          |
| **Defect Detection** | ≥ 90%                          | 🔴 높음  | QA Report, JIRA  |
| **Execution Speed**  | Unit < 200ms, Integration < 1s | 🟡 중간  | CI Pipeline      |
| **Consistency**      | 100%                           | 🔴 높음  | 반복 실행 테스트 |
| **Maintainability**  | A등급 (≥ 80점)                 | 🟡 중간  | SonarQube        |
| **Flakiness**        | < 1%                           | 🟡 중간  | CI 통계          |
| **Duplication**      | < 5%                           | 🟢 낮음  | ESLint           |
| **Skipped Tests**    | < 3%                           | 🟢 낮음  | Test Report      |
| **CI Reliability**   | ≥ 99%                          | 🔴 높음  | CI Dashboard     |

---

## 측정 및 수집 방법

### 자동 측정 설정

**1. package.json 스크립트 설정**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:mutation": "stryker run",
    "test:consistency": "bash scripts/test-consistency.sh",
    "test:metrics": "pnpm test:coverage && pnpm test:mutation"
  }
}
```

**2. CI/CD 파이프라인 통합** (GitHub Actions 예시):

```yaml
name: Test Quality Metrics

on: [push, pull_request]

jobs:
  test-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests with coverage
        run: pnpm test:coverage

      - name: Run mutation testing
        run: pnpm test:mutation

      - name: Check consistency
        run: pnpm test:consistency

      - name: Upload metrics
        run: |
          echo "Coverage: $(cat coverage/coverage-summary.json | jq '.total.statements.pct')"
          echo "Mutation Score: $(cat reports/mutation/mutation.json | jq '.mutationScore')"
```

**3. 메트릭 대시보드 구성**:

```json
{
  "timestamp": "2025-10-29T10:30:00Z",
  "metrics": {
    "coverage": {
      "statements": 84.21,
      "branches": 72.15,
      "functions": 87.5,
      "lines": 84.21
    },
    "mutationScore": 72.0,
    "defectDetection": 91.0,
    "executionSpeed": {
      "unit": 183,
      "integration": 850,
      "total": 1033
    },
    "consistency": 100.0,
    "maintainability": 87.0,
    "flakiness": 0.5,
    "duplication": 2.1,
    "skipped": 1.5,
    "ciReliability": 99.8
  }
}
```

---

## 품질 개선 가이드

### 메트릭별 개선 방법

**Coverage가 낮을 때**:

1. 커버되지 않은 코드 확인: `coverage/lcov-report/index.html`
2. 누락된 경계값 테스트 추가
3. 예외 처리 로직 테스트 추가
4. 모든 분기(if/else) 테스트

**Mutation Score가 낮을 때**:

1. 경계값 테스트 강화
2. 단언문 구체화 (예: `toBe(true)` → `toBe(expected)`)
3. 예외 케이스 추가
4. 부정 케이스 테스트 추가

**Execution Speed가 느릴 때**:

1. 외부 의존성 제거
2. 불필요한 setup 제거
3. 병렬 실행 활성화
4. 느린 테스트 프로파일링

**Consistency가 낮을 때**:

1. 시간 의존성 제거
2. 랜덤 값 제거 또는 시드 고정
3. 테스트 간 독립성 보장
4. 비동기 처리 개선

**Maintainability가 낮을 때**:

1. 긴 테스트 분리
2. 헬퍼 함수 추출
3. 명확한 네이밍
4. AAA 패턴 적용
5. 중복 코드 제거

---

## 참고 자료

### 공식 문서 및 베스트 프랙티스

- [Microsoft - Unit testing best practices](https://docs.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices)
- [Ministry of Testing - Measuring Unit Test Effectiveness](https://www.ministryoftesting.com)
- [ThoughtWorks - Test Quality Patterns](https://www.thoughtworks.com/insights/blog)

### 도구 문서

- [Vitest Documentation](https://vitest.dev/)
- [Stryker Mutator](https://stryker-mutator.io/)
- [SonarQube Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)

### 관련 문서

- [TEST_GUIDE.md](../TEST_GUIDE.md) - TDD 및 테스트 작성 가이드
- [TEST_GUIDE_QUICK.md](../TEST_GUIDE_QUICK.md) - 빠른 참조 가이드
- [patterns.md](./patterns.md) - 테스트 패턴 상세
- [antipatterns.md](./antipatterns.md) - 안티패턴과 해결책
- [ai-agent.md](./ai-agent.md) - AI Agent 테스트 작성 기준

---

**💡 참고**: 이 문서는 테스트 품질을 측정하고 개선하기 위한 구체적인 메트릭과 도구를 제공합니다. 각 테스트 단계(RED → GREEN → REFACTOR)에서 이러한 메트릭을 참조하여 품질을 지속적으로 모니터링하세요.
