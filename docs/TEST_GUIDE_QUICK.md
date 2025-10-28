# ⚡ TDD 빠른 참조 가이드

> **목적**: 5분 안에 TDD를 시작할 수 있는 핵심만 담은 실전 가이드  
> **대상**: AI Agent 및 빠르게 시작하려는 개발자  
> **상세 문서**: [전체 가이드](./TEST_GUIDE.md) | [패턴 상세](./test-guides/patterns.md) | [예시 모음](./test-guides/examples.md)

---

## 📌 3초 요약

```
✅ RED: 실패하는 테스트 작성
✅ GREEN: 최소한의 코드로 통과
✅ REFACTOR: 코드 개선
```

---

## 🎯 필수 원칙 6가지

### 1. 단일 책임 (Single Responsibility)

- **규칙**: 하나의 테스트는 하나의 기능만 검증
- **확인**: 테스트 이름에 "그리고(and)" 있으면 분리
- **예시**: ❌ "일정 생성하고 수정한다" → ✅ "일정을 생성한다" + "일정을 수정한다"

### 2. 독립성 (Independence)

- **규칙**: 각 테스트는 다른 테스트와 무관하게 실행
- **확인**: 테스트 순서 바꿔도 모두 통과해야 함
- **주의**: 전역 변수, 공유 상태 사용 금지

### 3. 명확성 (Clarity)

- **규칙**: 코드 읽지 않고도 무엇을 테스트하는지 알 수 있어야 함
- **확인**: 테스트 이름이 완전한 문장
- **예시**: ❌ "날짜 테스트" → ✅ "1월 31일 매월 반복 일정의 다음 발생 날짜는 2월 28일이다"

### 4. 반복 가능성 (Repeatability)

- **규칙**: 언제, 어디서, 몇 번을 실행해도 같은 결과
- **확인**: `new Date()`, `Math.random()` 사용 금지
- **대안**: 날짜는 고정값으로 주입

### 5. 빠른 실행 (Speed)

- **규칙**: 단일 테스트 10ms 이내, 전체 10초 이내
- **확인**: 파일 I/O, 네트워크 호출 제거
- **대안**: Mock, Stub 사용

### 6. 원인 명확성 (Diagnosability)

- **규칙**: 실패 시 원인을 즉시 파악 가능
- **확인**: 의미 있는 실패 메시지
- **예시**: `expect(result).toBe(expected, '1월 31일의 다음 달은 2월 28일이어야 함')`

---

## 🔄 TDD 사이클 체크리스트

### 🟥 RED - 실패하는 테스트 작성

```typescript
// 1. 가장 간단한 정상 케이스 선택
// 2. AAA 패턴으로 작성
test('매일 반복 일정을 생성하면 연속된 날짜에 일정이 생성된다', () => {
  // Arrange: 테스트 데이터 준비
  const baseEvent = {
    title: '매일 회의',
    date: '2025-10-01',
    repeat: { type: 'daily', interval: 1, endDate: '2025-10-05' },
  };

  // Act: 테스트 대상 실행
  const events = generateRecurringEvents(baseEvent);

  // Assert: 결과 검증
  expect(events).toHaveLength(5);
  expect(events[0].date).toBe('2025-10-01');
  expect(events[4].date).toBe('2025-10-05');
});
```

**체크리스트**:

- [ ] 테스트 이름이 명확한 문장인가?
- [ ] AAA 패턴을 따르는가?
- [ ] 테스트 실행 → FAIL 확인
- [ ] 실패 원인이 "미구현"인가?

### 🟩 GREEN - 최소 구현 작성

```typescript
// 테스트를 통과시키는 최소한의 코드만 작성
export function generateRecurringEvents(baseEvent: EventForm): EventForm[] {
  // 하드코딩도 OK, 일단 통과시키는 것이 목표
  if (baseEvent.repeat.type === 'daily') {
    const events = [];
    for (let i = 0; i < 5; i++) {
      events.push({ ...baseEvent, date: `2025-10-0${i + 1}` });
    }
    return events;
  }
  return [baseEvent];
}
```

**체크리스트**:

- [ ] 테스트 실행 → PASS 확인
- [ ] 모든 기존 테스트도 PASS인가?
- [ ] 과도한 일반화를 하지 않았는가?

### 🟦 REFACTOR - 코드 개선

```typescript
// 이제 일반화하고 개선
export function generateRecurringEvents(baseEvent: EventForm): EventForm[] {
  if (baseEvent.repeat.type === 'none') {
    return [baseEvent];
  }

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
```

**체크리스트**:

- [ ] 중복 코드 제거했는가?
- [ ] 변수명이 명확한가?
- [ ] 매직 넘버를 상수로 추출했는가?
- [ ] 각 변경 후 테스트 실행 → 여전히 PASS인가?

---

## 📝 AAA 패턴 템플릿

### 기본 템플릿

```typescript
test('테스트 설명 (무엇을 테스트하는가)', () => {
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
test('31일에 매월 반복하면 31일이 있는 달에만 생성된다', () => {
  // Arrange
  const baseEvent = {
    title: '월말 정산',
    date: '2025-10-31',
    repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
  };

  // Act
  const events = generateRecurringEvents(baseEvent);

  // Assert
  expect(events).toHaveLength(2); // 10월(31일), 12월(31일)
  expect(events[0].date).toBe('2025-10-31');
  expect(events[1].date).toBe('2025-12-31');
});
```

---

## 🚀 빠른 시작 가이드

### 5분 안에 첫 테스트 작성하기

**Step 1: 가장 간단한 케이스 선택**

```
❌ 복잡한 엣지 케이스부터 시작
✅ 가장 단순한 정상 동작부터 시작

예: "매일 반복" → 단순
예: "윤년 2월 29일 매년 반복" → 복잡 (나중에)
```

**Step 2: 테스트 작성 (RED)**

```bash
# 테스트 파일 생성
touch src/__tests__/unit/myFeature.spec.ts

# 테스트 작성 (위 템플릿 사용)
# 테스트 실행
pnpm test -- myFeature.spec.ts
```

**Step 3: 최소 구현 (GREEN)**

```typescript
// 가장 단순한 방법으로 통과시키기
// 하드코딩도 OK!
```

**Step 4: 리팩토링 (REFACTOR)**

```typescript
// 이제 제대로 만들기
// 각 변경 후 즉시 테스트 실행
```

**Step 5: 다음 테스트**

```typescript
// 조금 더 복잡한 케이스로 이동
// 1-4 반복
```

---

## ⚠️ 자주 하는 실수 Top 10

### 1. ❌ 여러 기능을 한 테스트에서 검증

```typescript
// 나쁜 예
test('반복 일정 기능', () => {
  const e = create();
  expect(e.title).toBe('회의'); // 생성
  e.update('변경');
  expect(e.title).toBe('변경'); // 수정
  e.delete();
  expect(e.deleted).toBe(true); // 삭제
});

// 좋은 예
test('반복 일정을 생성한다', () => {
  /* ... */
});
test('반복 일정을 수정한다', () => {
  /* ... */
});
test('반복 일정을 삭제한다', () => {
  /* ... */
});
```

### 2. ❌ 테스트 간 상태 공유

```typescript
// 나쁜 예
let sharedEvent;
test('생성', () => {
  sharedEvent = create();
});
test('수정', () => {
  sharedEvent.update();
}); // 위에 의존

// 좋은 예
test('수정', () => {
  const event = create(); // 독립적으로 생성
  event.update();
});
```

### 3. ❌ 현재 시간/날짜 사용

```typescript
// 나쁜 예
test('다음 주 계산', () => {
  const event = new Event({ date: new Date() }); // 매번 다름
});

// 좋은 예
test('다음 주 계산', () => {
  const TODAY = '2025-10-01'; // 고정
  const event = new Event({ date: TODAY });
});
```

### 4. ❌ 불명확한 테스트 이름

```typescript
// 나쁜 예
test('테스트1');
test('날짜 계산');

// 좋은 예
test('매월 15일 반복 일정의 다음 발생 날짜는 다음달 15일이다');
```

### 5. ❌ 구현 먼저 작성

```
나쁜 순서: 구현 → 테스트
좋은 순서: 테스트 → 구현
```

### 6. ❌ GREEN 단계에서 과도한 일반화

```typescript
// 나쁜 예 (GREEN 단계)
function calculate(type, interval, options) {
  // 모든 경우를 다 처리하려고 함
}

// 좋은 예 (GREEN 단계)
function calculate() {
  return '2025-02-15'; // 일단 하드코딩으로 통과
}
```

### 7. ❌ AAA 패턴 무시

```typescript
// 나쁜 예
test('테스트', () => {
  const a = 1;
  expect(a + 1).toBe(2);
  const b = 2;
  expect(b + 1).toBe(3);
});

// 좋은 예
test('테스트', () => {
  // Arrange
  const input = 1;

  // Act
  const result = add(input, 1);

  // Assert
  expect(result).toBe(2);
});
```

### 8. ❌ 너무 많은 단언문

```typescript
// 나쁜 예
test('검증', () => {
  expect(result.a).toBe(1);
  expect(result.b).toBe(2);
  expect(result.c).toBe(3);
  expect(result.d).toBe(4);
  // ... 10개 이상
});

// 좋은 예
test('객체가 올바르게 생성된다', () => {
  expect(result).toEqual({
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  });
});
```

### 9. ❌ 외부 의존성 (파일, DB, API)

```typescript
// 나쁜 예
test('파일 저장', async () => {
  await fs.writeFile('test.txt', 'data'); // 실제 파일 사용
});

// 좋은 예
test('파일 저장', () => {
  const mockFs = { writeFile: vi.fn() };
  saveToFile(mockFs, 'data');
  expect(mockFs.writeFile).toHaveBeenCalled();
});
```

### 10. ❌ REFACTOR 단계 생략

```
나쁜 습관: RED → GREEN → 다음 테스트
좋은 습관: RED → GREEN → REFACTOR → 다음 테스트
```

---

## 🔍 빠른 문제 해결

### 문제: "테스트가 간헐적으로 실패한다"

**원인**: 현재 시간, 랜덤 값, 외부 의존성  
**해결**: 모든 값을 고정하고 Mock 사용

### 문제: "테스트가 너무 느리다"

**원인**: 파일 I/O, 네트워크, DB 접근  
**해결**: 단위 테스트는 메모리 내에서만 실행

### 문제: "테스트 실패 원인을 모르겠다"

**원인**: 불명확한 단언문, 복잡한 테스트  
**해결**: 의미 있는 실패 메시지 추가, 테스트 분리

### 문제: "중복 코드가 너무 많다"

**원인**: 준비 단계(Arrange) 반복  
**해결**: 헬퍼 함수 또는 Factory 패턴 사용

```typescript
// 헬퍼 함수 예시
function createTestEvent(overrides = {}) {
  return {
    title: '테스트 회의',
    date: '2025-10-01',
    repeat: { type: 'none', interval: 1 },
    ...overrides,
  };
}

test('테스트', () => {
  const event = createTestEvent({ repeat: { type: 'daily' } });
  // ...
});
```

---

## 📚 다음 단계

더 자세한 내용이 필요하면:

1. **[전체 테스트 가이드](./TEST_GUIDE.md)** - 원칙과 패턴 상세 설명
2. **[패턴 상세](./test-guides/patterns.md)** - AAA, Given-When-Then 등 패턴 심화
3. **[예시 모음](./test-guides/examples.md)** - 다양한 시나리오별 예제 코드
4. **[안티패턴](./test-guides/antipatterns.md)** - 피해야 할 패턴과 해결책
5. **[AI Agent 가이드](./test-guides/ai-agent.md)** - AI를 위한 특별 지침

---

## 💡 핵심 기억사항

```
1. RED → GREEN → REFACTOR 순서 엄수
2. 테스트 먼저, 구현은 나중에
3. 하나의 테스트는 하나의 기능만
4. 테스트는 독립적으로 실행 가능해야 함
5. 실패 원인이 명확해야 함
```

**TDD는 습관입니다. 매일 연습하세요!** 🚀
