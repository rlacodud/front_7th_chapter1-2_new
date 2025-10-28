# AI Agent를 위한 테스트 작성 기준

> **대상**: AI Agent 전용 실행 가능한 지침  
> **목적**: 일관성 있는 고품질 테스트 코드 자동 생성

---

## 🤖 AI Agent 작동 원칙

### 입력

- 요구사항 (자연어 또는 명세)
- 기존 코드베이스
- 테스트 가이드 (본 문서)

### 출력

- RED 단계: 실패하는 테스트 코드
- GREEN 단계: 최소 구현 코드
- REFACTOR 단계: 개선된 코드

### 제약

- 사람의 승인 없이 코드 변경 불가
- 각 단계마다 사람의 검토 필요
- 안티패턴 자동 감지 및 회피

---

## 📋 필수 체크리스트 (모든 테스트에 적용)

### 1. 테스트 작성 전 (RED 준비)

```
입력 확인:
□ 요구사항이 명확한가?
□ 기대 동작이 정의되어 있는가?
□ 엣지 케이스가 식별되었는가?

컨텍스트 분석:
□ 관련 기존 테스트 파일을 확인했는가?
□ 비슷한 패턴의 테스트가 있는가?
□ 사용할 테스트 헬퍼 함수가 있는가?

명명 규칙 확인:
□ 파일명: [난이도].[대상].spec.ts (예: easy.repeatUtils.spec.ts)
□ describe 블록: 기능 단위로 그룹화
□ test 이름: 완전한 문장
```

### 2. 테스트 작성 (RED)

```typescript
// 템플릿 엄수
test('[동사][대상][조건][기대결과]', () => {
  // Arrange: 테스트 데이터 준비
  const input = /* 명확한 변수명 */;
  const expected = /* 명확한 기대값 */;

  // Act: 대상 실행
  const result = functionUnderTest(input);

  // Assert: 검증
  expect(result).toBe(expected);
});
```

**필수 확인사항**:

```
□ AAA 패턴을 따르는가?
□ 하나의 기능만 테스트하는가?
□ 테스트 이름이 명확한가?
□ 매직 넘버가 상수로 정의되었는가?
□ 고정된 날짜를 사용하는가? (Date.now() 금지)
```

### 3. 구현 작성 (GREEN)

```typescript
// 최소 구현 원칙
export function functionName(input: Type): ReturnType {
  // 테스트를 통과하는 가장 단순한 코드
  // 하드코딩도 허용
  return expectedValue;
}
```

**필수 확인사항**:

```
□ 테스트가 통과하는가?
□ 기존 테스트도 모두 통과하는가?
□ 불필요한 복잡성이 없는가?
□ 타입이 명확하게 정의되었는가?
```

### 4. 리팩토링 (REFACTOR)

```typescript
// 개선 항목
- 중복 코드 → 함수 추출
- 매직 넘버 → 상수 정의
- 긴 함수 → 작은 함수로 분리
- 불명확한 이름 → 의미 있는 이름
```

**필수 확인사항**:

```
□ 테스트가 여전히 통과하는가?
□ 코드 가독성이 개선되었는가?
□ 중복이 제거되었는가?
□ 함수가 단일 책임을 따르는가?
```

---

## 🎯 AI 결정 트리

### 테스트 파일 생성 시

```
1. 기존 파일 확인
   ├─ 있음 → 해당 파일에 추가
   └─ 없음 → 새 파일 생성
           ├─ 난이도 판단 (easy/medium/hard)
           ├─ 대상 식별 (함수명/모듈명)
           └─ 파일명: [난이도].[대상].spec.ts

2. describe 블록 구조
   ├─ 최상위: 함수/클래스 이름
   └─ 하위: 기능별 그룹
           예: describe('매일 반복')
               describe('매주 반복')
```

### 테스트 케이스 우선순위

```
1순위: 정상 케이스 (Happy Path)
   - 가장 단순한 입력
   - 명확한 기대 출력

2순위: 경계값 (Boundary)
   - 최소값, 최대값
   - 빈 값, null, undefined

3순위: 예외 케이스 (Error Cases)
   - 유효하지 않은 입력
   - 제약 조건 위반

4순위: 엣지 케이스 (Edge Cases)
   - 윤년, 월말, 특수 날짜
   - 복잡한 조합
```

### 테스트 이름 생성 규칙

```
형식 선택:
1. 자연어 문장 (권장)
   "매일 반복 일정을 생성하면 연속된 날짜에 일정이 생성된다"

2. should_when 형식
   "should_연속된날짜생성_when_매일반복일정생성"

3. 메서드_조건_결과 형식
   "generateRecurringEvents_매일반복_연속날짜배열반환"

규칙:
- 동사로 시작
- 조건 명시
- 기대 결과 명시
- "그리고(and)" 금지 (분리 필요)
```

---

## 🔍 자동 감지 및 회피

### 안티패턴 감지

AI는 다음을 자동으로 감지하고 회피해야 합니다:

```typescript
// ❌ 감지: 여러 기능 테스트
if (테스트_이름.includes('그리고') || 테스트_이름.includes('and')) {
  경고('테스트 분리 필요');
}

// ❌ 감지: 공유 상태
if (describe_블록_밖에_변수선언) {
  경고('테스트 독립성 위반');
}

// ❌ 감지: 현재 시간 사용
if (코드.includes('new Date()') && !코드.includes('new Date(고정값)')) {
  경고('반복 가능성 위반');
}

// ❌ 감지: 단언 없음
if (test_함수.length > 0 && !코드.includes('expect(')) {
  경고('단언문 누락');
}
```

### 자동 개선

```typescript
// 개선 1: 매직 넘버 → 상수
Before: expect(result).toBe(5);
After: const EXPECTED_EVENTS_COUNT = 5;
expect(result).toBe(EXPECTED_EVENTS_COUNT);

// 개선 2: 불명확한 변수명 → 명확한 이름
Before: const e = create();
After: const recurringEvent = createRecurringEvent();

// 개선 3: 인라인 값 → 명명된 상수
Before: event = { date: '2025-10-01' };
After: const TEST_DATE = '2025-10-01';
event = { date: TEST_DATE };
```

---

## 📝 코드 생성 템플릿

### 1. 단순 함수 테스트

```typescript
describe('functionName', () => {
  test('정상 케이스 설명', () => {
    // Arrange
    const INPUT_VALUE = /* 의미 있는 값 */;
    const EXPECTED_OUTPUT = /* 기대값 */;

    // Act
    const actualOutput = functionName(INPUT_VALUE);

    // Assert
    expect(actualOutput).toBe(EXPECTED_OUTPUT);
  });

  test('경계값 케이스 설명', () => {
    // ...
  });

  test('예외 케이스 설명', () => {
    // Arrange
    const INVALID_INPUT = /* 잘못된 값 */;

    // Act & Assert
    expect(() => functionName(INVALID_INPUT)).toThrow(ErrorType);
  });
});
```

### 2. 배열 반환 함수 테스트

```typescript
test('여러 항목을 반환하는 경우', () => {
  // Arrange
  const input = prepareInput();
  const EXPECTED_LENGTH = 3;
  const FIRST_ITEM = expectedFirstItem;

  // Act
  const results = functionReturningArray(input);

  // Assert
  expect(results).toHaveLength(EXPECTED_LENGTH);
  expect(results[0]).toEqual(FIRST_ITEM);
  expect(results.every((item) => isValid(item))).toBe(true);
});
```

### 3. 객체 생성 테스트

```typescript
test('객체가 올바른 속성으로 생성된다', () => {
  // Arrange
  const inputData = {
    property1: 'value1',
    property2: 'value2',
  };

  // Act
  const createdObject = createObject(inputData);

  // Assert
  expect(createdObject).toMatchObject({
    property1: 'value1',
    property2: 'value2',
    createdAt: expect.any(Date),
  });
});
```

### 4. 비동기 함수 테스트

```typescript
test('비동기 작업이 완료된다', async () => {
  // Arrange
  const input = prepareAsyncInput();
  const EXPECTED_RESULT = 'success';

  // Act
  const result = await asyncFunction(input);

  // Assert
  expect(result).toBe(EXPECTED_RESULT);
});
```

---

## 🎨 변수 명명 규칙

### 상수 (대문자 + 언더스코어)

```typescript
const MAX_EVENTS_COUNT = 100;
const DEFAULT_REPEAT_INTERVAL = 1;
const TEST_DATE = '2025-10-01';
const EXPECTED_RESULT = {
  /* ... */
};
```

### 변수 (camelCase + 의미)

```typescript
// ❌ 나쁜 예
const e = ...;
const data = ...;
const result = ...;

// ✅ 좋은 예
const recurringEvent = ...;
const eventFormData = ...;
const generatedEvents = ...;
```

### 테스트 데이터 (목적 명시)

```typescript
// ✅ 테스트 데이터임을 명시
const testEvent = createEvent();
const mockDatabase = createMockDb();
const fakeNotificationService = createFakeService();
```

---

## 🚨 에러 처리 가이드

### 예외 테스트

```typescript
test('유효하지 않은 입력 시 ValidationError를 발생시킨다', () => {
  // Arrange
  const INVALID_INPUT = '';
  const EXPECTED_ERROR_MESSAGE = '입력값이 유효하지 않습니다';

  // Act & Assert
  expect(() => {
    validateInput(INVALID_INPUT);
  }).toThrow(ValidationError);

  expect(() => {
    validateInput(INVALID_INPUT);
  }).toThrow(EXPECTED_ERROR_MESSAGE);
});
```

### 비동기 에러 테스트

```typescript
test('비동기 작업 실패 시 에러를 발생시킨다', async () => {
  // Arrange
  const INVALID_DATA = prepareInvalidData();

  // Act & Assert
  await expect(asyncFunction(INVALID_DATA)).rejects.toThrow(Error);
});
```

---

## 📊 품질 지표

AI가 생성한 테스트는 다음 기준을 만족해야 합니다:

### 필수 기준 (100% 충족)

- [ ] 모든 테스트에 AAA 패턴 적용
- [ ] 테스트 이름이 완전한 문장
- [ ] 하나의 테스트는 하나의 기능만
- [ ] 고정된 날짜/시간 사용
- [ ] 외부 의존성 제거 (Mock 사용)

### 권장 기준 (90% 이상)

- [ ] 변수명이 의미 명확
- [ ] 매직 넘버가 상수화
- [ ] 헬퍼 함수로 중복 제거
- [ ] 경계값 테스트 포함

### 코드 품질

- [ ] 단일 테스트 실행 시간 < 10ms
- [ ] 테스트 커버리지 > 80%
- [ ] 순환 복잡도 < 10

---

## 🔄 반복 개선 프로세스

### 1차 생성

```
1. 요구사항 분석
2. 테스트 케이스 도출
3. 테스트 코드 생성
4. 사람 검토 요청
```

### 피드백 반영

```
1. 검토 의견 수신
2. 문제점 식별
3. 코드 수정
4. 재검토 요청
```

### 학습

```
1. 승인된 패턴 기록
2. 거부된 패턴 회피 목록 추가
3. 다음 생성 시 반영
```

---

## 📚 참고 자료 우선순위

테스트 생성 시 다음 순서로 참조:

1. **[빠른 참조 가이드](../TEST_GUIDE_QUICK.md)** - 항상 먼저 확인
2. **기존 테스트 파일** - 프로젝트 패턴 파악
3. **[패턴 가이드](./patterns.md)** - 구체적 패턴 필요 시
4. **[안티패턴 가이드](./antipatterns.md)** - 회피해야 할 패턴
5. **[메인 가이드](../TEST_GUIDE.md)** - 상세 설명 필요 시

---

## ✅ 최종 체크

테스트 코드 제출 전 최종 확인:

```bash
# 1. 린트 검사
pnpm lint

# 2. 테스트 실행
pnpm test -- 생성한파일.spec.ts

# 3. 커버리지 확인
pnpm test:coverage

# 4. 전체 테스트 확인 (기존 테스트 깨지지 않았는지)
pnpm test
```

**모든 항목이 통과해야만 코드 제출 가능**

---

## 💡 AI Agent 성공 기준

### 성공

- ✅ 모든 테스트가 통과 (첫 시도)
- ✅ 기존 테스트가 깨지지 않음
- ✅ 코드 리뷰에서 수정 요청 없음
- ✅ 안티패턴 0개

### 실패 (개선 필요)

- ❌ 테스트 실패
- ❌ 기존 테스트 깨짐
- ❌ 2회 이상 수정 요청
- ❌ 안티패턴 감지

---

**AI Agent는 일관성 있고 예측 가능한 고품질 테스트를 생성해야 합니다.** 🤖✨
