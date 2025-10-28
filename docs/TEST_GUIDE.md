# 🧪 TDD와 AI Agent를 위한 테스트 가이드

> **빠른 시작**: [5분 안에 시작하기](./TEST_GUIDE_QUICK.md) ⚡  
> **상세 가이드**: [패턴](./test-guides/patterns.md) | [예시](./test-guides/examples.md) | [안티패턴](./test-guides/antipatterns.md) | [AI Agent](./test-guides/ai-agent.md)

---

## 📋 문서 목적

이 문서는 **테스트 주도 개발(TDD)**과 **AI Agent**를 활용한 프로젝트에서 일관되고 검증 가능한 테스트 코드를 작성하기 위한 가이드입니다.

### 문서의 핵심 가치

- **명확성**: 사람과 AI 모두 정확히 이해할 수 있는 언어
- **실행 가능성**: 즉시 적용 가능한 구체적 기준
- **테스트 가능성**: 문서 자체가 검증 가능한 기준
- **보편적 기여**: 모든 팀원이 이해하고 기여 가능

---

## ⚡ 빠른 시작

### 5분 안에 시작하기

**당장 시작해야 한다면:**

1. **[빠른 참조 가이드](./TEST_GUIDE_QUICK.md)** 읽기 (필수)
2. [AAA 패턴 템플릿](#aaa-패턴-기본) 복사
3. [TDD 체크리스트](#tdd-체크리스트) 따라하기
4. 막히면 [문제 해결](#문제-해결) 참조

**핵심만 알려줘:**

```
원칙: 단일책임, 독립성, 명확성, 반복가능성, 빠른실행, 원인명확성
패턴: AAA (Arrange-Act-Assert)
사이클: RED → GREEN → REFACTOR
```

---

## 📚 목차

1. [TDD 기본 개념](#1-tdd-기본-개념)
2. [핵심 원칙](#2-핵심-원칙)
3. [AAA 패턴](#3-aaa-패턴)
4. [테스트 네이밍](#4-테스트-네이밍)
5. [TDD 사이클 실행](#5-tdd-사이클-실행)
6. [문제 해결](#6-문제-해결)

---

## 1. TDD 기본 개념

### TDD란?

**테스트 주도 개발(Test-Driven Development)**은 테스트를 먼저 작성하고, 테스트를 통과하는 최소한의 코드를 작성한 뒤, 코드를 개선하는 개발 방식입니다.

### Red-Green-Refactor 사이클

**🟥 RED - 실패하는 테스트 작성**

- 아직 구현되지 않은 기능에 대한 테스트 작성
- 테스트 실행 → 실패 확인
- 실패 원인: "기능이 구현되지 않음"

**🟩 GREEN - 최소 구현**

- 테스트를 통과하는 가장 단순한 코드 작성
- 하드코딩도 허용
- 모든 테스트 통과 확인

**🟦 REFACTOR - 코드 개선**

- 중복 제거
- 명확한 이름
- 구조 개선
- 테스트 통과 유지

---

## 2. 핵심 원칙

### 원칙 1: 단일 책임

하나의 테스트는 하나의 기능만 검증합니다.

```typescript
// ✅ 좋은 예
test('매일 반복 일정을 생성하면 연속된 날짜에 일정이 생성된다', () => {
  const events = generateRecurringEvents(baseEvent);
  expect(events).toHaveLength(5);
});

// ❌ 나쁜 예
test('반복 일정 기능', () => {
  const events = generate(); // 생성
  events[0].update(); // 수정
  events[0].delete(); // 삭제
});
```

### 원칙 2: 독립성

각 테스트는 다른 테스트와 무관하게 실행됩니다.

```typescript
// ✅ 좋은 예
test('일정을 수정한다', () => {
  const event = createEvent(); // 독립적으로 생성
  event.update({ title: '변경' });
  expect(event.title).toBe('변경');
});

// ❌ 나쁜 예
let sharedEvent; // 전역 상태
test('생성', () => {
  sharedEvent = create();
});
test('수정', () => {
  sharedEvent.update();
}); // 의존
```

### 원칙 3: 명확성

테스트 코드만으로 의도를 완전히 이해할 수 있어야 합니다.

```typescript
// ✅ 좋은 예
test('윤년이 아닌 해의 2월 29일 일정은 2월 28일로 조정된다', () => {
  const LEAP_YEAR_DATE = '2024-02-29';
  const NON_LEAP_YEAR = 2025;
  const event = new Event({ date: LEAP_YEAR_DATE, repeat: 'yearly' });
  const next = event.getOccurrenceForYear(NON_LEAP_YEAR);
  expect(next.date).toBe('2025-02-28');
});

// ❌ 나쁜 예
test('날짜 테스트', () => {
  const e = new Event({ date: '2024-02-29', repeat: 'yearly' });
  expect(e.getOccurrenceForYear(2025).date).toBe('2025-02-28');
});
```

### 원칙 4: 반복 가능성

언제 어디서 몇 번을 실행해도 같은 결과를 보장합니다.

```typescript
// ✅ 좋은 예
test('특정 날짜 기준 다음 주를 계산한다', () => {
  const TODAY = '2025-10-15';
  const event = new Event({ date: TODAY, repeat: 'weekly' });
  const next = event.getNextOccurrence();
  expect(next.date).toBe('2025-10-22');
});

// ❌ 나쁜 예
test('다음 주를 계산한다', () => {
  const today = new Date(); // 실행 시점마다 다름
  // ...
});
```

### 원칙 5: 빠른 실행

- 단일 테스트: 10ms 이내
- 전체 스위트: 10초 이내 (100개 기준)

### 원칙 6: 원인 명확성

실패 시 원인을 즉시 파악할 수 있어야 합니다.

```typescript
// ✅ 좋은 예
expect(result.date).toBe(
  '2025-02-28',
  `1월 31일의 다음 달은 2월 28일이어야 하지만 ${result.date}가 반환됨`
);

// ❌ 나쁜 예
expect(result.date).toBe('2025-02-28');
```

---

## 3. AAA 패턴

### 기본 구조

모든 테스트는 3단계로 구성됩니다:

```typescript
test('테스트 설명', () => {
  // Arrange (준비): 테스트 데이터 설정
  const input = '입력값';
  const expected = '기대값';

  // Act (실행): 테스트 대상 실행
  const result = functionToTest(input);

  // Assert (검증): 결과 확인
  expect(result).toBe(expected);
});
```

### 실전 예시

```typescript
test('매월 15일 반복 일정의 다음 발생 날짜는 다음달 15일이다', () => {
  // Arrange
  const originalDate = '2025-10-15';
  const repeatType = 'monthly';
  const event = new Event({ date: originalDate, repeat: repeatType });

  // Act
  const nextOccurrence = event.getNextOccurrence();

  // Assert
  const expectedDate = '2025-11-15';
  expect(nextOccurrence.date).toBe(expectedDate);
});
```

### Given-When-Then 패턴 (선택)

비즈니스 로직을 자연어로 표현할 때 사용:

```typescript
test('윤년의 2월 29일 일정을 평년으로 변환하면 2월 28일이 된다', () => {
  // Given: 윤년 2월 29일의 연간 반복 일정이 있고
  const event = new Event({ date: '2024-02-29', repeat: 'yearly' });

  // When: 평년의 발생 날짜를 계산하면
  const occurrence = event.getOccurrenceForYear(2025);

  // Then: 2월 28일로 조정되어야 한다
  expect(occurrence.date).toBe('2025-02-28');
});
```

---

## 4. 테스트 네이밍

### 권장 형식

**자연어 문장** (권장):

```typescript
test('매일 반복 일정을 생성하면 연속된 날짜에 일정이 생성된다');
test('31일에 매월 반복하면 31일이 있는 달에만 생성된다');
test('종료일이 설정된 반복 일정은 종료일 이후 발생하지 않는다');
```

**should_when 형식**:

```typescript
test('should_연속날짜생성_when_매일반복일정생성');
```

**메서드*조건*결과**:

```typescript
test('generateRecurringEvents_매일반복_연속날짜배열반환');
```

### 네이밍 원칙

1. **구체성**: 정확한 값과 조건 명시
2. **완전한 문장**: 주어-동사-결과
3. **비즈니스 관점**: 기술 용어보다 비즈니스 의미
4. **단일 동작**: "그리고(and)" 있으면 분리

```typescript
// ❌ 나쁜 예
test('날짜 계산');
test('일정 테스트');
test('작동 확인');

// ✅ 좋은 예
test('1월 31일 매월 반복 일정의 다음 발생 날짜는 2월 28일이다');
test('유효하지 않은 날짜 형식으로 일정 생성 시 ValidationError가 발생한다');
```

---

## 5. TDD 사이클 실행

### 1️⃣ RED 단계

**목표**: 실패하는 테스트 작성

```typescript
// 1. 가장 간단한 정상 케이스 선택
test('매일 반복 일정을 생성하면 연속된 날짜에 일정이 생성된다', () => {
  // Arrange
  const baseEvent = {
    date: '2025-10-01',
    repeat: { type: 'daily', interval: 1, endDate: '2025-10-05' },
  };

  // Act
  const events = generateRecurringEvents(baseEvent);

  // Assert
  expect(events).toHaveLength(5);
  expect(events[0].date).toBe('2025-10-01');
  expect(events[4].date).toBe('2025-10-05');
});

// 2. 테스트 실행
// pnpm test -- repeatUtils.spec.ts

// 3. 실패 확인
// ❌ FAIL: generateRecurringEvents is not defined
```

**체크리스트**:

- [ ] AAA 패턴 따름
- [ ] 테스트 이름 명확
- [ ] 테스트 실행 → FAIL
- [ ] 실패 원인이 "미구현"

### 2️⃣ GREEN 단계

**목표**: 최소한의 코드로 통과

```typescript
// 최소 구현 (하드코딩도 OK)
export function generateRecurringEvents(baseEvent: EventForm): EventForm[] {
  // 일단 테스트만 통과시키기
  return [
    { ...baseEvent, date: '2025-10-01' },
    { ...baseEvent, date: '2025-10-02' },
    { ...baseEvent, date: '2025-10-03' },
    { ...baseEvent, date: '2025-10-04' },
    { ...baseEvent, date: '2025-10-05' },
  ];
}

// 테스트 실행
// pnpm test -- repeatUtils.spec.ts
// ✅ PASS
```

**체크리스트**:

- [ ] 테스트 실행 → PASS
- [ ] 모든 기존 테스트 PASS
- [ ] 과도한 일반화 없음

### 3️⃣ REFACTOR 단계

**목표**: 코드 품질 개선

```typescript
// 리팩토링: 일반화 및 개선
export function generateRecurringEvents(baseEvent: EventForm): EventForm[] {
  const events: EventForm[] = [];
  let currentDate = new Date(baseEvent.date);
  const endDate = new Date(baseEvent.repeat.endDate);

  while (currentDate <= endDate) {
    events.push({
      ...baseEvent,
      date: formatDate(currentDate),
    });
    currentDate = addDays(currentDate, baseEvent.repeat.interval);
  }

  return events;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// 각 변경 후 테스트 실행
// pnpm test -- repeatUtils.spec.ts
// ✅ PASS (모든 테스트 여전히 통과)
```

**체크리스트**:

- [ ] 중복 제거
- [ ] 명확한 이름
- [ ] 매직 넘버 → 상수
- [ ] 테스트 여전히 PASS

### 4️⃣ 다음 테스트

```typescript
// 조금 더 복잡한 케이스로 이동
test('격일 반복(interval=2)이면 2일 간격으로 생성된다', () => {
  // ... 다음 RED 단계
});
```

---

## 6. 문제 해결

### 문제: 테스트가 간헐적으로 실패한다

**원인**: 현재 시간/날짜, 랜덤 값 사용

**해결책**:

```typescript
// ❌ 문제
const today = new Date();

// ✅ 해결
const TODAY = '2025-10-15';
vi.setSystemTime(new Date(TODAY));
```

### 문제: 테스트가 너무 느리다

**원인**: 파일 I/O, 네트워크, DB 접근

**해결책**:

```typescript
// ❌ 문제
await database.save(event);

// ✅ 해결
const mockDb = { save: vi.fn() };
await mockDb.save(event);
```

### 문제: 실패 원인을 모르겠다

**원인**: 불명확한 단언문, 복잡한 테스트

**해결책**:

```typescript
// ❌ 문제
expect(result).toBe(expected);

// ✅ 해결
expect(result).toBe(expected, `기대값: ${expected}, 실제값: ${result}`);
```

### 문제: 중복 코드가 너무 많다

**해결책**: 헬퍼 함수 사용

```typescript
function createTestEvent(overrides = {}) {
  return {
    title: '테스트',
    date: '2025-10-15',
    ...overrides,
  };
}

test('테스트', () => {
  const event = createTestEvent({ title: '회의' });
});
```

---

## TDD 체크리스트

### 시작 전

- [ ] 요구사항이 명확한가?
- [ ] 가장 간단한 케이스부터 시작하는가?

### RED 단계

- [ ] 테스트 이름이 명확한가?
- [ ] AAA 패턴을 따르는가?
- [ ] 테스트 실행 → FAIL?
- [ ] 실패 원인이 "미구현"인가?

### GREEN 단계

- [ ] 최소 구현만 했는가?
- [ ] 테스트 실행 → PASS?
- [ ] 모든 기존 테스트 PASS?

### REFACTOR 단계

- [ ] 중복 제거했는가?
- [ ] 이름이 명확한가?
- [ ] 테스트 여전히 PASS?

### 반복

- [ ] 다음 테스트 케이스 선택
- [ ] RED → GREEN → REFACTOR 반복

---

## 다음 단계

### 추가 학습 자료

1. **[빠른 참조 가이드](./TEST_GUIDE_QUICK.md)** - 핵심만 빠르게
2. **[패턴 상세](./test-guides/patterns.md)** - AAA, Given-When-Then, Mock 등
3. **[예시 모음](./test-guides/examples.md)** - 실전 코드 예제
4. **[안티패턴](./test-guides/antipatterns.md)** - 피해야 할 패턴
5. **[AI Agent 가이드](./test-guides/ai-agent.md)** - AI 전용 지침

---

## 핵심 기억사항

```
✅ RED → GREEN → REFACTOR 순서 엄수
✅ 테스트 먼저, 구현은 나중에
✅ 하나의 테스트는 하나의 기능만
✅ 테스트는 독립적으로 실행 가능해야 함
✅ 실패 원인이 명확해야 함
```

**TDD는 습관입니다. 매일 연습하세요!** 🚀
