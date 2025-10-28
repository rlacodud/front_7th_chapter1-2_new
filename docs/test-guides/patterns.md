# 테스트 패턴 상세 가이드

> **이전**: [빠른 참조](../TEST_GUIDE_QUICK.md) | **메인**: [테스트 가이드](../TEST_GUIDE.md)

---

## 목차

1. [AAA 패턴 (Arrange-Act-Assert)](#aaa-패턴)
2. [Given-When-Then 패턴](#given-when-then-패턴)
3. [테스트 더블 패턴](#테스트-더블-패턴)
4. [파라미터화 테스트](#파라미터화-테스트)
5. [비동기 테스트 패턴](#비동기-테스트-패턴)

---

## AAA 패턴

### 기본 구조

AAA 패턴은 모든 테스트를 세 단계로 명확히 구분합니다:

1. **Arrange** (준비): 테스트 환경과 데이터 설정
2. **Act** (실행): 테스트 대상 동작 실행
3. **Assert** (검증): 결과 확인

### 상세 예시

#### 예시 1: 단순한 함수 테스트

```typescript
test('두 숫자를 더하면 올바른 합계를 반환한다', () => {
  // Arrange: 입력 데이터 준비
  const firstNumber = 5;
  const secondNumber = 3;
  const expectedSum = 8;

  // Act: 함수 실행
  const actualSum = add(firstNumber, secondNumber);

  // Assert: 결과 확인
  expect(actualSum).toBe(expectedSum);
});
```

#### 예시 2: 객체 메서드 테스트

```typescript
test('일정에 참석자를 추가하면 참석자 목록에 포함된다', () => {
  // Arrange: 테스트 객체 생성 및 데이터 준비
  const event = new Event({
    title: '팀 회의',
    date: '2025-10-15',
  });
  const attendee = {
    name: '김철수',
    email: 'kim@example.com',
  };

  // Act: 메서드 실행
  event.addAttendee(attendee);

  // Assert: 상태 변경 확인
  expect(event.attendees).toContain(attendee);
  expect(event.attendees).toHaveLength(1);
});
```

#### 예시 3: 예외 처리 테스트

```typescript
test('유효하지 않은 날짜로 일정 생성 시 ValidationError를 발생시킨다', () => {
  // Arrange: 잘못된 입력 데이터 준비
  const invalidEventData = {
    title: '회의',
    date: 'invalid-date-format',
  };

  // Act & Assert: 예외 발생 확인
  expect(() => {
    new Event(invalidEventData);
  }).toThrow(ValidationError);

  expect(() => {
    new Event(invalidEventData);
  }).toThrow('날짜 형식이 올바르지 않습니다');
});
```

### AAA 패턴의 장점

1. **가독성**: 테스트의 흐름이 명확함
2. **유지보수성**: 각 섹션의 역할이 분명하여 수정이 쉬움
3. **일관성**: 모든 테스트가 동일한 구조를 따름
4. **디버깅**: 실패 시 어느 단계에서 문제가 발생했는지 파악 용이

### AAA 섹션 구분 방법

```typescript
test('테스트 설명', () => {
  // Arrange
  const setupData = prepareData();

  // 빈 줄로 구분

  // Act
  const result = performAction(setupData);

  // 빈 줄로 구분

  // Assert
  expect(result).toBe(expected);
});
```

---

## Given-When-Then 패턴

### 기본 구조

BDD(Behavior-Driven Development) 스타일로, 비즈니스 언어로 테스트를 작성합니다:

1. **Given** (주어진 상황): 전제 조건
2. **When** (어떤 행동을 하면): 테스트할 동작
3. **Then** (결과): 기대하는 결과

### 상세 예시

#### 예시 1: 비즈니스 규칙 테스트

```typescript
test('윤년이 아닌 해에 2월 29일 일정을 생성하면 2월 28일로 조정된다', () => {
  // Given: 윤년(2024년) 2월 29일의 연간 반복 일정이 있고
  const leapYearEvent = new Event({
    title: '생일',
    date: '2024-02-29',
    repeat: { type: 'yearly', interval: 1 },
  });

  // When: 평년(2025년)의 발생 날짜를 요청하면
  const nonLeapYearOccurrence = leapYearEvent.getOccurrenceForYear(2025);

  // Then: 2월 28일로 조정되어야 한다
  expect(nonLeapYearOccurrence.date).toBe('2025-02-28');
  expect(nonLeapYearOccurrence.title).toBe('생일');
});
```

#### 예시 2: 복잡한 시나리오 테스트

```typescript
test('월말 반복 일정은 각 달의 마지막 날에 발생한다', () => {
  // Given: 1월 31일에 매월 반복되는 일정이 있고
  const monthEndEvent = new Event({
    title: '월말 정산',
    date: '2025-01-31',
    repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
  });

  // When: 전체 반복 일정을 생성하면
  const occurrences = monthEndEvent.getAllOccurrences();

  // Then: 각 달의 말일에 일정이 생성되어야 한다
  // 1월: 31일, 2월: 28일 (평년), 3월: 31일, 4월: 30일
  expect(occurrences).toHaveLength(4);
  expect(occurrences[0].date).toBe('2025-01-31');
  expect(occurrences[1].date).toBe('2025-02-28');
  expect(occurrences[2].date).toBe('2025-03-31');
  expect(occurrences[3].date).toBe('2025-04-30');
});
```

### AAA vs Given-When-Then

| 측면   | AAA             | Given-When-Then   |
| ------ | --------------- | ----------------- |
| 초점   | 기술적 세부사항 | 비즈니스 동작     |
| 언어   | 코드 중심       | 자연어에 가까움   |
| 사용처 | 단위 테스트     | 통합/인수 테스트  |
| 독자   | 개발자          | 개발자 + 비기술자 |

---

## 테스트 더블 패턴

### Mock (모의 객체)

실제 객체를 대체하여 호출을 기록하고 검증합니다.

```typescript
test('일정 생성 시 알림 서비스를 호출한다', () => {
  // Arrange
  const mockNotificationService = {
    send: vi.fn(),
  };
  const calendar = new Calendar(mockNotificationService);
  const event = { title: '회의', date: '2025-10-15' };

  // Act
  calendar.createEvent(event);

  // Assert
  expect(mockNotificationService.send).toHaveBeenCalledWith({
    type: 'EVENT_CREATED',
    event: event,
  });
  expect(mockNotificationService.send).toHaveBeenCalledTimes(1);
});
```

### Stub (스텁)

미리 정의된 응답을 반환합니다.

```typescript
test('공휴일에는 일정 생성이 불가능하다', () => {
  // Arrange
  const holidayServiceStub = {
    isHoliday: vi.fn().mockReturnValue(true),
  };
  const calendar = new Calendar(holidayServiceStub);

  // Act
  const result = calendar.canCreateEvent('2025-01-01');

  // Assert
  expect(result).toBe(false);
  expect(holidayServiceStub.isHoliday).toHaveBeenCalledWith('2025-01-01');
});
```

### Spy (스파이)

실제 객체의 동작을 감시합니다.

```typescript
test('일정 수정 시 이력이 기록된다', () => {
  // Arrange
  const event = new Event({ title: '회의', date: '2025-10-15' });
  const spy = vi.spyOn(event, 'addHistory');

  // Act
  event.update({ title: '중요 회의' });

  // Assert
  expect(spy).toHaveBeenCalledWith({
    action: 'UPDATE',
    field: 'title',
    oldValue: '회의',
    newValue: '중요 회의',
  });
});
```

### Fake (페이크)

실제 동작하는 간단한 구현체를 제공합니다.

```typescript
// Fake Database
class FakeDatabase {
  private data: Map<string, Event> = new Map();

  save(event: Event): void {
    this.data.set(event.id, event);
  }

  find(id: string): Event | undefined {
    return this.data.get(id);
  }

  clear(): void {
    this.data.clear();
  }
}

test('일정을 저장하고 조회할 수 있다', () => {
  // Arrange
  const fakeDb = new FakeDatabase();
  const calendar = new Calendar(fakeDb);
  const event = { id: '1', title: '회의', date: '2025-10-15' };

  // Act
  calendar.createEvent(event);
  const retrieved = calendar.getEvent('1');

  // Assert
  expect(retrieved).toEqual(event);
});
```

---

## 파라미터화 테스트

동일한 로직을 여러 입력값으로 반복 테스트할 때 사용합니다.

### 기본 패턴

```typescript
describe('getDaysInMonth', () => {
  const testCases = [
    { year: 2025, month: 1, expected: 31 },
    { year: 2025, month: 2, expected: 28 },
    { year: 2024, month: 2, expected: 29 }, // 윤년
    { year: 2025, month: 4, expected: 30 },
  ];

  testCases.forEach(({ year, month, expected }) => {
    test(`${year}년 ${month}월은 ${expected}일이다`, () => {
      expect(getDaysInMonth(year, month)).toBe(expected);
    });
  });
});
```

### 경계값 테스트

```typescript
describe('age 유효성 검증', () => {
  const validAges = [0, 1, 50, 120];
  const invalidAges = [-1, -100, 121, 200];

  validAges.forEach((age) => {
    test(`나이 ${age}는 유효하다`, () => {
      expect(isValidAge(age)).toBe(true);
    });
  });

  invalidAges.forEach((age) => {
    test(`나이 ${age}는 유효하지 않다`, () => {
      expect(isValidAge(age)).toBe(false);
    });
  });
});
```

---

## 비동기 테스트 패턴

### Promise 기반 테스트

```typescript
test('일정을 비동기로 저장한다', async () => {
  // Arrange
  const event = { title: '회의', date: '2025-10-15' };

  // Act
  const savedEvent = await calendar.saveEvent(event);

  // Assert
  expect(savedEvent.id).toBeDefined();
  expect(savedEvent.title).toBe('회의');
});
```

### 콜백 기반 테스트

```typescript
test('일정 생성 완료 시 콜백을 호출한다', (done) => {
  // Arrange
  const event = { title: '회의', date: '2025-10-15' };
  const callback = (savedEvent) => {
    // Assert
    expect(savedEvent.title).toBe('회의');
    done();
  };

  // Act
  calendar.createEvent(event, callback);
});
```

### 타이머 모킹

```typescript
test('1분 후 알림을 발송한다', () => {
  // Arrange
  vi.useFakeTimers();
  const mockSend = vi.fn();
  const notifier = new Notifier(mockSend);

  // Act
  notifier.scheduleNotification('알림 메시지', 60000);
  vi.advanceTimersByTime(60000);

  // Assert
  expect(mockSend).toHaveBeenCalledWith('알림 메시지');

  vi.useRealTimers();
});
```

### 에러 처리 테스트

```typescript
test('네트워크 오류 시 재시도한다', async () => {
  // Arrange
  const mockFetch = vi
    .fn()
    .mockRejectedValueOnce(new Error('Network error'))
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({ data: 'success' });

  // Act
  const result = await fetchWithRetry(mockFetch, 3);

  // Assert
  expect(result.data).toBe('success');
  expect(mockFetch).toHaveBeenCalledTimes(3);
});
```

---

## 패턴 선택 가이드

| 상황                 | 추천 패턴       | 이유                      |
| -------------------- | --------------- | ------------------------- |
| 단순 함수 테스트     | AAA             | 명확하고 직관적           |
| 비즈니스 규칙 테스트 | Given-When-Then | 자연어에 가까워 이해 쉬움 |
| 외부 의존성 격리     | Mock/Stub       | 빠르고 안정적             |
| 여러 케이스 검증     | 파라미터화      | 코드 중복 제거            |
| 시간 기반 로직       | Timer Mock      | 실제 시간 대기 불필요     |

---

## 다음 단계

- [예시 모음](./examples.md) - 실전 코드 예제
- [안티패턴](./antipatterns.md) - 피해야 할 패턴
- [AI Agent 가이드](./ai-agent.md) - AI 전용 지침
