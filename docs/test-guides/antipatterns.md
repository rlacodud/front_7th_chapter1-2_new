# 테스트 안티패턴과 해결책

> **이전**: [빠른 참조](../TEST_GUIDE_QUICK.md) | **메인**: [테스트 가이드](../TEST_GUIDE.md)

---

## 목차

1. [구조적 안티패턴](#구조적-안티패턴)
2. [의존성 안티패턴](#의존성-안티패턴)
3. [단언 안티패턴](#단언-안티패턴)
4. [네이밍 안티패턴](#네이밍-안티패턴)
5. [TDD 프로세스 안티패턴](#tdd-프로세스-안티패턴)

---

## 구조적 안티패턴

### 1. 거대한 테스트 (Giant Test)

**문제**: 하나의 테스트가 너무 많은 것을 검증

```typescript
// ❌ 안티패턴
test('일정 관리 기능', () => {
  const event = createEvent();
  expect(event.title).toBe('회의');

  event.update({ title: '변경' });
  expect(event.title).toBe('변경');

  event.addAttendee('김철수');
  expect(event.attendees).toContain('김철수');

  event.delete();
  expect(event.isDeleted).toBe(true);
  // ... 20개 이상의 검증
});
```

**해결책**: 단일 책임 원칙 적용

```typescript
// ✅ 올바른 방법
test('일정을 생성하면 제목이 설정된다', () => {
  const event = createEvent({ title: '회의' });
  expect(event.title).toBe('회의');
});

test('일정 제목을 수정할 수 있다', () => {
  const event = createEvent({ title: '회의' });
  event.update({ title: '변경' });
  expect(event.title).toBe('변경');
});

test('일정에 참석자를 추가할 수 있다', () => {
  const event = createEvent();
  event.addAttendee('김철수');
  expect(event.attendees).toContain('김철수');
});
```

### 2. 테스트 간 의존성 (Test Interdependence)

**문제**: 테스트가 특정 순서로 실행되어야 함

```typescript
// ❌ 안티패턴
let sharedEvent;

test('일정 생성', () => {
  sharedEvent = createEvent();
  expect(sharedEvent).toBeDefined();
});

test('일정 수정', () => {
  // 이전 테스트에 의존
  sharedEvent.update({ title: '변경' });
  expect(sharedEvent.title).toBe('변경');
});
```

**해결책**: 각 테스트를 독립적으로 만들기

```typescript
// ✅ 올바른 방법
test('일정을 생성한다', () => {
  const event = createEvent();
  expect(event).toBeDefined();
});

test('일정을 수정한다', () => {
  const event = createEvent(); // 독립적으로 생성
  event.update({ title: '변경' });
  expect(event.title).toBe('변경');
});
```

### 3. 중복 코드 (Duplicated Setup)

**문제**: 준비(Arrange) 코드가 여러 테스트에서 반복

```typescript
// ❌ 안티패턴
test('테스트 1', () => {
  const event = {
    title: '회의',
    date: '2025-10-15',
    startTime: '10:00',
    endTime: '11:00',
    location: '회의실 A',
  };
  // 테스트 로직
});

test('테스트 2', () => {
  const event = {
    title: '회의',
    date: '2025-10-15',
    startTime: '10:00',
    endTime: '11:00',
    location: '회의실 A',
  };
  // 테스트 로직
});
```

**해결책**: 헬퍼 함수 또는 Factory 패턴 사용

```typescript
// ✅ 올바른 방법
function createTestEvent(overrides = {}) {
  return {
    title: '회의',
    date: '2025-10-15',
    startTime: '10:00',
    endTime: '11:00',
    location: '회의실 A',
    ...overrides,
  };
}

test('테스트 1', () => {
  const event = createTestEvent();
  // 테스트 로직
});

test('테스트 2', () => {
  const event = createTestEvent({ title: '다른 회의' });
  // 테스트 로직
});
```

---

## 의존성 안티패턴

### 4. 숨겨진 의존성 (Hidden Dependency)

**문제**: 전역 상태나 환경에 의존

```typescript
// ❌ 안티패턴
let globalDate = new Date();

test('오늘 일정을 가져온다', () => {
  const events = getEventsForDate(globalDate);
  expect(events).toBeDefined();
});
```

**해결책**: 의존성을 명시적으로 주입

```typescript
// ✅ 올바른 방법
test('특정 날짜의 일정을 가져온다', () => {
  const targetDate = new Date('2025-10-15');
  const events = getEventsForDate(targetDate);
  expect(events).toBeDefined();
});
```

### 5. 외부 서비스 의존 (External Service Dependency)

**문제**: 실제 API, DB, 파일 시스템 사용

```typescript
// ❌ 안티패턴
test('일정을 저장한다', async () => {
  await database.connect(); // 실제 DB 연결
  const event = await database.save({ title: '회의' });
  expect(event.id).toBeDefined();
  await database.disconnect();
});
```

**해결책**: Mock이나 Fake 사용

```typescript
// ✅ 올바른 방법
test('일정을 저장한다', async () => {
  const mockDatabase = {
    save: vi.fn().mockResolvedValue({ id: '123', title: '회의' }),
  };

  const event = await mockDatabase.save({ title: '회의' });
  expect(event.id).toBe('123');
  expect(mockDatabase.save).toHaveBeenCalledWith({ title: '회의' });
});
```

### 6. 시간 의존성 (Time Dependency)

**문제**: `new Date()`, `Date.now()` 직접 사용

```typescript
// ❌ 안티패턴
test('오늘 이후의 일정만 가져온다', () => {
  const today = new Date(); // 실행할 때마다 다른 값
  const events = getFutureEvents(today);
  // 테스트 결과가 실행 날짜에 따라 달라짐
});
```

**해결책**: 날짜를 고정하거나 주입

```typescript
// ✅ 올바른 방법
test('2025-10-15 이후의 일정만 가져온다', () => {
  const referenceDate = new Date('2025-10-15');
  const events = getFutureEvents(referenceDate);

  expect(events.every((e) => new Date(e.date) > referenceDate)).toBe(true);
});

// 또는 타이머 모킹
test('현재 시간 기준 미래 일정만 가져온다', () => {
  vi.setSystemTime(new Date('2025-10-15'));

  const events = getFutureEvents();

  expect(events.every((e) => new Date(e.date) > new Date('2025-10-15'))).toBe(true);

  vi.useRealTimers();
});
```

---

## 단언 안티패턴

### 7. 단언 없는 테스트 (Missing Assertion)

**문제**: 검증 없이 코드만 실행

```typescript
// ❌ 안티패턴
test('일정을 생성한다', () => {
  createEvent({ title: '회의' });
  // 검증이 없음!
});
```

**해결책**: 명확한 단언문 추가

```typescript
// ✅ 올바른 방법
test('일정을 생성한다', () => {
  const event = createEvent({ title: '회의' });

  expect(event).toBeDefined();
  expect(event.title).toBe('회의');
});
```

### 8. 과도한 단언 (Assertion Roulette)

**문제**: 너무 많은 단언문으로 실패 원인 파악 어려움

```typescript
// ❌ 안티패턴
test('일정 데이터 검증', () => {
  const event = createEvent();

  expect(event.title).toBe('회의');
  expect(event.date).toBe('2025-10-15');
  expect(event.startTime).toBe('10:00');
  expect(event.endTime).toBe('11:00');
  expect(event.location).toBe('회의실 A');
  expect(event.attendees).toHaveLength(0);
  expect(event.status).toBe('pending');
  expect(event.isRecurring).toBe(false);
  // ... 15개 이상
});
```

**해결책**: 객체 비교나 테스트 분리

```typescript
// ✅ 올바른 방법
test('일정이 올바른 속성으로 생성된다', () => {
  const event = createEvent();

  expect(event).toMatchObject({
    title: '회의',
    date: '2025-10-15',
    startTime: '10:00',
    endTime: '11:00',
    location: '회의실 A',
  });
});

test('새로 생성된 일정은 참석자가 없다', () => {
  const event = createEvent();
  expect(event.attendees).toHaveLength(0);
});
```

### 9. 구현 세부사항 테스트 (Testing Implementation Details)

**문제**: 내부 구현을 테스트하여 리팩토링 어려움

```typescript
// ❌ 안티패턴
test('일정 생성 시 내부 메서드를 호출한다', () => {
  const calendar = new Calendar();
  const spy = vi.spyOn(calendar, 'validateEvent');

  calendar.createEvent({ title: '회의' });

  expect(spy).toHaveBeenCalled(); // 내부 구현에 의존
});
```

**해결책**: 공개 API와 결과만 테스트

```typescript
// ✅ 올바른 방법
test('유효하지 않은 일정은 생성되지 않는다', () => {
  const calendar = new Calendar();

  expect(() => {
    calendar.createEvent({ title: '' }); // 빈 제목
  }).toThrow(ValidationError);
});
```

---

## 네이밍 안티패턴

### 10. 불명확한 테스트 이름

**문제**: 테스트 이름만으로 의도 파악 불가

```typescript
// ❌ 안티패턴
test('테스트1');
test('작동 확인');
test('날짜');
test('검증');
```

**해결책**: 완전한 문장으로 의도 표현

```typescript
// ✅ 올바른 방법
test('매월 15일 반복 일정의 다음 발생 날짜는 다음달 15일이다');
test('유효하지 않은 날짜 형식으로 일정 생성 시 ValidationError가 발생한다');
test('종료일이 설정된 반복 일정은 종료일 이후 발생하지 않는다');
```

### 11. 기술 용어 남용

**문제**: 비즈니스 의미가 아닌 기술적 세부사항 강조

```typescript
// ❌ 안티패턴
test('getNextOccurrence 메서드가 Date 객체를 반환한다');
test('eventRepository.save()가 호출된다');
```

**해결책**: 비즈니스 관점으로 표현

```typescript
// ✅ 올바른 방법
test('반복 일정의 다음 발생 날짜를 계산한다');
test('일정 생성 시 데이터베이스에 저장된다');
```

---

## TDD 프로세스 안티패턴

### 12. 테스트 나중에 작성 (Test-Last Development)

**문제**: 구현 후 테스트 작성

```
❌ 나쁜 순서:
1. 기능 구현
2. 테스트 작성
3. 테스트 실행

✅ 올바른 순서:
1. 테스트 작성 (RED)
2. 최소 구현 (GREEN)
3. 리팩토링 (REFACTOR)
```

### 13. 과도한 사전 설계 (Over-Engineering)

**문제**: GREEN 단계에서 완벽한 구조 만들려고 함

```typescript
// ❌ 안티패턴 (GREEN 단계)
class RecurrenceCalculator {
  constructor(
    private strategy: RecurrenceStrategy,
    private validator: DateValidator,
    private formatter: DateFormatter
  ) {}

  calculate(event: Event): Occurrence[] {
    // 복잡한 구조를 처음부터 만듦
  }
}
```

**해결책**: GREEN 단계에서는 최소 구현, REFACTOR 단계에서 개선

```typescript
// ✅ 올바른 방법 (GREEN 단계)
function getNextOccurrence(event: Event): Date {
  // 가장 단순한 방법으로 일단 통과
  const date = new Date(event.date);
  date.setMonth(date.getMonth() + 1);
  return date;
}

// REFACTOR 단계에서 개선
function getNextOccurrence(event: Event): Date {
  return calculateNextDate(event.date, event.repeat);
}
```

### 14. 리팩토링 생략 (Skipping Refactor)

**문제**: GREEN 단계 후 바로 다음 테스트로 이동

```
❌ 나쁜 사이클:
RED → GREEN → RED → GREEN → RED → GREEN

✅ 올바른 사이클:
RED → GREEN → REFACTOR → RED → GREEN → REFACTOR
```

### 15. 너무 큰 단계 (Big Leaps)

**문제**: 한 번에 너무 많은 기능을 구현

```typescript
// ❌ 안티패턴
test('반복 일정 전체 기능이 동작한다', () => {
  // 매일, 매주, 매월, 매년 반복
  // 건너뛰기, 예외 처리
  // 종료일 계산
  // ... 모든 것을 한 번에
});
```

**해결책**: 작은 단계로 나누기

```typescript
// ✅ 올바른 방법
test('매일 반복 일정을 생성하면 연속된 날짜에 일정이 생성된다');
test('매주 반복 일정을 생성하면 7일 간격으로 일정이 생성된다');
test('매월 반복 일정을 생성하면 매월 같은 날짜에 일정이 생성된다');
// 하나씩 차근차근
```

---

## 안티패턴 체크리스트

테스트 작성 후 다음을 확인하세요:

### 구조

- [ ] 하나의 테스트가 하나의 기능만 검증하는가?
- [ ] 테스트가 독립적으로 실행 가능한가?
- [ ] 준비 코드 중복이 헬퍼 함수로 추출되었는가?

### 의존성

- [ ] 전역 상태를 사용하지 않는가?
- [ ] 외부 서비스 (DB, API)를 Mock으로 대체했는가?
- [ ] 고정된 날짜/시간을 사용하는가?

### 단언

- [ ] 모든 테스트에 단언문이 있는가?
- [ ] 단언문이 5개 이하인가?
- [ ] 공개 API만 테스트하는가?

### 네이밍

- [ ] 테스트 이름이 완전한 문장인가?
- [ ] 비즈니스 관점으로 표현되었는가?
- [ ] 테스트 이름만 보고 의도를 파악할 수 있는가?

### TDD 프로세스

- [ ] 테스트를 먼저 작성했는가?
- [ ] GREEN 단계에서 최소 구현만 했는가?
- [ ] REFACTOR 단계를 거쳤는가?
- [ ] 작은 단계로 진행했는가?

---

## 다음 단계

- [패턴 상세](./patterns.md) - 올바른 패턴 학습
- [예시 모음](./examples.md) - 좋은 테스트 예제
- [AI Agent 가이드](./ai-agent.md) - AI가 안티패턴 회피하는 방법
