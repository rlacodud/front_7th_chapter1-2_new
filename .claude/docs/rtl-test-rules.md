# React Testing Library 규칙

## 테스트 작성 원칙

### 테스트 설명 (Test Description)

- **구체적이고 명확한 설명 작성**: "should work"가 아닌 "사용자가 Submit 버튼 클릭 시 로딩 상태가 표시되어야 한다"
- **사용자 관점에서 기술**: 구현 세부사항이 아닌 사용자 행동과 결과에 집중
- **Given-When-Then 패턴 활용**: "주어진 상황에서, 특정 행동을 할 때, 예상되는 결과"

### 테스트 독립성 (Test Independence)

- **각 테스트는 완전히 독립적**: 테스트 실행 순서에 관계없이 성공해야 함
- **공유 상태 금지**: 테스트 간 변수나 모듈 상태 공유 방지
- **beforeEach에서 초기화**: 각 테스트마다 깨끗한 상태로 시작

### Setup과 Teardown 구성

- **beforeEach 활용**: 각 테스트마다 필요한 초기 설정 수행
- **afterEach 정리**: 모킹, 타이머, 네트워크 요청 등 정리
- **describe 블록 내 공통 setup**: 관련 테스트들의 공통 설정 그룹화

## 쿼리 우선순위

### 사용자 접근 가능한 쿼리 우선 사용

1. **getByRole**: 스크린 리더 등 접근성 도구가 사용하는 방식
2. **getByLabelText**: 폼 요소의 라벨 텍스트로 접근
3. **getByPlaceholderText**: placeholder 속성으로 접근
4. **getByText**: 보이는 텍스트로 접근
5. **getByDisplayValue**: 현재 표시된 값으로 접근

### 최후 수단 쿼리

- **getByTestId**: 다른 방법이 없을 때만 사용
- **data-testid 속성 최소화**: 접근성을 고려한 쿼리가 불가능할 때만 적용

## 비동기 처리

### 비동기 요소 대기

- **waitFor 사용**: 조건이 만족될 때까지 대기
- **findBy 쿼리 활용**: 비동기적으로 나타나는 요소 검색
- **timeout 설정**: 필요시 적절한 대기 시간 설정

### 타이머와 비동기 처리

- **act() 사용 최소화**: React Testing Library가 자동으로 처리하는 경우가 대부분
- **useFakeTimers 적극 활용**: 시간 의존적 로직의 예측 가능한 테스트

## 이벤트 처리

### userEvent 사용

- **userEvent.setup() 활용**: 실제 사용자 행동과 유사한 이벤트 시뮬레이션
- **fireEvent 사용 금지**: userEvent로 대체 불가능한 경우만 예외적 사용
- **키보드 네비게이션 테스트**: Tab, Enter, Space 등 키보드 접근성 검증

## 모킹 전략

### 모킹 최소화 원칙

- **외부 의존성만 모킹**: 컴포넌트 내부 로직은 실제 동작 테스트
- **MSW 활용**: API 호출은 네트워크 레벨에서 모킹
- **모듈 모킹 신중하게**: 꼭 필요한 경우만 vi.mock() 사용

### 상태 관리 테스트

- **실제 상태 관리 라이브러리 사용**: Zustand, Redux 등 실제 환경과 동일하게 테스트
- **Provider 레벨 테스트**: 전역 상태 변화에 따른 컴포넌트 반응 검증

## assertion 및 검증 방법

### 적절한 assertion 사용 (권장: 높음)

- **jest-dom matchers 활용**: `toBeDisabled()`, `toBeInTheDocument()` 등 의미 있는 assertion
- **DOM 속성 직접 접근 금지**: `element.disabled` 대신 `toBeDisabled()` 사용
- **명확한 에러 메시지**: jest-dom이 제공하는 구체적이고 이해하기 쉬운 에러 메시지 활용

```javascript
// ❌ 잘못된 assertion
expect(button.disabled).toBe(true);
// 에러: expect(received).toBe(expected) Expected: true Received: false

// ✅ 올바른 assertion
expect(button).toBeDisabled();
// 에러: Received element is not disabled: <button />
```

### 명시적 존재 검증 (권장: 낮음)

- **get\* 쿼리도 명시적 assertion 권장**: 코드 의도 명확화를 위해 `toBeInTheDocument()` 추가
- **리팩토링 후 남은 쿼리와 구분**: 실제 assertion인지 불필요한 코드인지 명확히 구분

## 모킹 전략

### 스냅샷 테스트 사용 금지

- **의미 있는 assertion 작성**: 스냅샷 대신 구체적인 동작과 상태 검증
- **변경 감지보다 기능 검증**: 렌더링 결과의 변화가 아닌 기능 동작 확인

## 에러 처리 테스트

### 에러 상황 테스트

- **에러 바운더리 테스트**: 컴포넌트 에러 발생 시 적절한 폴백 표시 검증
- **네트워크 에러 처리**: API 실패 시 사용자에게 적절한 피드백 제공 확인
- **폼 유효성 검사**: 잘못된 입력에 대한 에러 메시지 표시 검증

## 접근성 테스트

### 접근성 규칙 검증

- **axe-core 통합**: jest-axe를 통한 자동 접근성 규칙 검사
- **키보드 네비게이션**: 마우스 없이 모든 기능 접근 가능성 확인
- **스크린 리더 호환성**: aria-label, role 등 적절한 마크업 검증

## 성능 테스트

### 렌더링 성능

- **불필요한 리렌더링 방지**: React DevTools Profiler와 연계하여 최적화 검증
- **메모리 리크 방지**: 컴포넌트 언마운트 시 정리 작업 확인
