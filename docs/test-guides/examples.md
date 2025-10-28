# 테스트 코드 예시 모음

> **목적**: 다양한 시나리오별 실전 테스트 코드 예제  
> **사용법**: 복사하여 프로젝트에 맞게 수정

---

## 목차

1. [반복 일정 생성 예시](#반복-일정-생성)
2. [날짜 처리 예시](#날짜-처리)
3. [유효성 검증 예시](#유효성-검증)
4. [비동기 처리 예시](#비동기-처리)
5. [에러 처리 예시](#에러-처리)

---

## 반복 일정 생성

### 매일 반복

```typescript
describe('generateRecurringEvents - 매일 반복', () => {
  test('매일 반복 일정을 생성하면 연속된 날짜에 일정이 생성된다', () => {
    // Arrange
    const baseEvent: EventForm = {
      title: '매일 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '매일 하는 회의',
      location: '회의실',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-05',
      },
      notificationTime: 10,
    };

    // Act
    const events = generateRecurringEvents(baseEvent);

    // Assert
    expect(events).toHaveLength(5);
    expect(events[0].date).toBe('2025-10-01');
    expect(events[1].date).toBe('2025-10-02');
    expect(events[2].date).toBe('2025-10-03');
    expect(events[3].date).toBe('2025-10-04');
    expect(events[4].date).toBe('2025-10-05');
  });

  test('격일 반복(interval=2)이면 2일 간격으로 생성된다', () => {
    // Arrange
    const baseEvent: EventForm = {
      title: '격일 운동',
      date: '2025-10-01',
      startTime: '07:00',
      endTime: '08:00',
      description: '',
      location: '',
      category: '개인',
      repeat: {
        type: 'daily',
        interval: 2,
        endDate: '2025-10-09',
      },
      notificationTime: 10,
    };

    // Act
    const events = generateRecurringEvents(baseEvent);

    // Assert
    expect(events).toHaveLength(5); // 10/1, 10/3, 10/5, 10/7, 10/9
    expect(events.map((e) => e.date)).toEqual([
      '2025-10-01',
      '2025-10-03',
      '2025-10-05',
      '2025-10-07',
      '2025-10-09',
    ]);
  });
});
```

### 매월 반복

```typescript
describe('generateRecurringEvents - 매월 반복', () => {
  test('매월 15일 반복 일정은 매월 15일에 생성된다', () => {
    // Arrange
    const baseEvent: EventForm = {
      title: '월례 회의',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-12-31',
      },
      notificationTime: 10,
    };

    // Act
    const events = generateRecurringEvents(baseEvent);

    // Assert
    expect(events).toHaveLength(3); // 10/15, 11/15, 12/15
    expect(events[0].date).toBe('2025-10-15');
    expect(events[1].date).toBe('2025-11-15');
    expect(events[2].date).toBe('2025-12-15');
  });

  test('31일에 매월 반복하면 31일이 있는 달에만 생성된다', () => {
    // Arrange
    const baseEvent: EventForm = {
      title: '월말 정산',
      date: '2025-10-31',
      startTime: '17:00',
      endTime: '18:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-12-31',
      },
      notificationTime: 10,
    };

    // Act
    const events = generateRecurringEvents(baseEvent);

    // Assert: 10월(31일), 11월(30일-없음), 12월(31일)
    expect(events).toHaveLength(2);
    expect(events[0].date).toBe('2025-10-31');
    expect(events[1].date).toBe('2025-12-31');
  });
});
```

---

## 날짜 처리

### 날짜 포맷팅

```typescript
describe('formatDate', () => {
  test('Date 객체를 YYYY-MM-DD 형식으로 변환한다', () => {
    // Arrange
    const testDate = new Date('2025-10-15');
    const EXPECTED_FORMAT = '2025-10-15';

    // Act
    const formattedDate = formatDate(testDate);

    // Assert
    expect(formattedDate).toBe(EXPECTED_FORMAT);
  });

  test('한 자리 월과 일에 0을 붙여 포맷팅한다', () => {
    // Arrange
    const testDate = new Date('2025-01-05');
    const EXPECTED_FORMAT = '2025-01-05';

    // Act
    const formattedDate = formatDate(testDate);

    // Assert
    expect(formattedDate).toBe(EXPECTED_FORMAT);
  });
});
```

### 날짜 범위 검증

```typescript
describe('isDateInRange', () => {
  test('범위 내의 날짜는 true를 반환한다', () => {
    // Arrange
    const targetDate = new Date('2025-10-15');
    const rangeStart = new Date('2025-10-01');
    const rangeEnd = new Date('2025-10-31');

    // Act
    const isInRange = isDateInRange(targetDate, rangeStart, rangeEnd);

    // Assert
    expect(isInRange).toBe(true);
  });

  test('범위 시작일은 true를 반환한다', () => {
    // Arrange
    const targetDate = new Date('2025-10-01');
    const rangeStart = new Date('2025-10-01');
    const rangeEnd = new Date('2025-10-31');

    // Act
    const isInRange = isDateInRange(targetDate, rangeStart, rangeEnd);

    // Assert
    expect(isInRange).toBe(true);
  });

  test('범위 이전의 날짜는 false를 반환한다', () => {
    // Arrange
    const targetDate = new Date('2025-09-30');
    const rangeStart = new Date('2025-10-01');
    const rangeEnd = new Date('2025-10-31');

    // Act
    const isInRange = isDateInRange(targetDate, rangeStart, rangeEnd);

    // Assert
    expect(isInRange).toBe(false);
  });
});
```

---

## 유효성 검증

### 시간 유효성

```typescript
describe('getTimeErrorMessage', () => {
  test('시작 시간이 종료 시간보다 늦으면 에러 메시지를 반환한다', () => {
    // Arrange
    const startTime = '14:00';
    const endTime = '13:00';

    // Act
    const result = getTimeErrorMessage(startTime, endTime);

    // Assert
    expect(result.startTimeError).toBe('시작 시간은 종료 시간보다 빨라야 합니다.');
    expect(result.endTimeError).toBe('종료 시간은 시작 시간보다 늦어야 합니다.');
  });

  test('올바른 시간 범위는 에러가 없다', () => {
    // Arrange
    const startTime = '09:00';
    const endTime = '10:00';

    // Act
    const result = getTimeErrorMessage(startTime, endTime);

    // Assert
    expect(result.startTimeError).toBeNull();
    expect(result.endTimeError).toBeNull();
  });

  test('시작 시간이나 종료 시간이 없으면 에러가 없다', () => {
    // Arrange
    const startTime = '';
    const endTime = '';

    // Act
    const result = getTimeErrorMessage(startTime, endTime);

    // Assert
    expect(result.startTimeError).toBeNull();
    expect(result.endTimeError).toBeNull();
  });
});
```

---

## 비동기 처리

### API 호출

```typescript
describe('fetchEvents', () => {
  test('일정 목록을 성공적으로 가져온다', async () => {
    // Arrange
    const mockResponse = {
      events: [
        { id: '1', title: '회의', date: '2025-10-15' },
        { id: '2', title: '점심', date: '2025-10-16' },
      ],
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const events = await fetchEvents();

    // Assert
    expect(events).toHaveLength(2);
    expect(events[0].title).toBe('회의');
    expect(fetch).toHaveBeenCalledWith('/api/events');
  });

  test('API 호출 실패 시 에러를 발생시킨다', async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    // Act & Assert
    await expect(fetchEvents()).rejects.toThrow('Failed to fetch events');
  });
});
```

### 타이머 모킹

```typescript
describe('checkUpcomingEvents', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('1초마다 다가오는 일정을 확인한다', () => {
    // Arrange
    const mockCheck = vi.fn();
    const checker = new EventChecker(mockCheck);

    // Act
    checker.start();
    vi.advanceTimersByTime(3000); // 3초 경과

    // Assert
    expect(mockCheck).toHaveBeenCalledTimes(3);
  });
});
```

---

## 에러 처리

### 유효성 검증 에러

```typescript
describe('Event 생성 유효성 검증', () => {
  test('제목 없이 일정 생성 시 ValidationError를 발생시킨다', () => {
    // Arrange
    const invalidData = {
      title: '',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
    };

    // Act & Assert
    expect(() => {
      new Event(invalidData);
    }).toThrow(ValidationError);

    expect(() => {
      new Event(invalidData);
    }).toThrow('제목은 필수 항목입니다');
  });

  test('잘못된 날짜 형식으로 일정 생성 시 InvalidDateFormatError를 발생시킨다', () => {
    // Arrange
    const invalidData = {
      title: '회의',
      date: '2025/10/15', // 잘못된 형식
      startTime: '09:00',
      endTime: '10:00',
    };

    // Act & Assert
    expect(() => {
      new Event(invalidData);
    }).toThrow(InvalidDateFormatError);
  });
});
```

### 비즈니스 규칙 위반

```typescript
describe('일정 겹침 검증', () => {
  test('겹치는 시간의 일정이 있으면 OverlapError를 발생시킨다', () => {
    // Arrange
    const existingEvent = {
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
    };
    const newEvent = {
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
    };
    const calendar = new Calendar([existingEvent]);

    // Act & Assert
    expect(() => {
      calendar.addEvent(newEvent);
    }).toThrow(OverlapError);

    expect(() => {
      calendar.addEvent(newEvent);
    }).toThrow('일정이 겹칩니다');
  });
});
```

---

## 통합 테스트

### React 컴포넌트 테스트

```typescript
describe('EventList 컴포넌트', () => {
  test('일정 목록을 렌더링한다', () => {
    // Arrange
    const events = [
      { id: '1', title: '회의', date: '2025-10-15' },
      { id: '2', title: '점심', date: '2025-10-16' },
    ];

    // Act
    render(<EventList events={events} />);

    // Assert
    expect(screen.getByText('회의')).toBeInTheDocument();
    expect(screen.getByText('점심')).toBeInTheDocument();
  });

  test('일정 클릭 시 상세 정보를 표시한다', async () => {
    // Arrange
    const events = [{ id: '1', title: '회의', date: '2025-10-15' }];
    const user = userEvent.setup();

    // Act
    render(<EventList events={events} />);
    await user.click(screen.getByText('회의'));

    // Assert
    expect(screen.getByText('2025-10-15')).toBeInTheDocument();
  });
});
```

---

## 파라미터화 테스트

### 여러 케이스 한번에

```typescript
describe('getDaysInMonth', () => {
  const testCases = [
    { year: 2025, month: 1, expected: 31, description: '1월' },
    { year: 2025, month: 2, expected: 28, description: '평년 2월' },
    { year: 2024, month: 2, expected: 29, description: '윤년 2월' },
    { year: 2025, month: 4, expected: 30, description: '4월' },
    { year: 2025, month: 12, expected: 31, description: '12월' },
  ];

  testCases.forEach(({ year, month, expected, description }) => {
    test(`${description}은 ${expected}일이다`, () => {
      expect(getDaysInMonth(year, month)).toBe(expected);
    });
  });
});
```

---

## 헬퍼 함수 예시

### 테스트 데이터 팩토리

```typescript
// 테스트 헬퍼 함수
function createTestEvent(overrides: Partial<EventForm> = {}): EventForm {
  return {
    title: '테스트 회의',
    date: '2025-10-15',
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    location: '',
    category: '업무',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 10,
    ...overrides,
  };
}

// 사용 예시
test('일정을 생성한다', () => {
  const event = createTestEvent();
  expect(event.title).toBe('테스트 회의');
});

test('반복 일정을 생성한다', () => {
  const event = createTestEvent({
    repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
  });
  expect(event.repeat.type).toBe('daily');
});
```

---

**이 예시들을 프로젝트에 맞게 수정하여 사용하세요!** 📝
