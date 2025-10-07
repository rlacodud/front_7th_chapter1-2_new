# Kent Beck의 TDD 철학 및 테스트 작성 방법론

## Kent Beck의 TDD 핵심 원칙

### 1. Red-Green-Refactor 사이클
**Kent Beck이 정의한 TDD의 황금률**:
1. **Red**: 실패하는 테스트를 먼저 작성한다
2. **Green**: 테스트를 통과시키는 최소한의 코드를 작성한다
3. **Refactor**: 코드를 개선하되 테스트는 계속 통과하도록 한다

### 2. "Clean Code that Works" 철학
- **Working Software First**: 먼저 동작하게 만들고, 그 다음에 깔끔하게 만든다
- **Small Steps**: 작은 단위로 진행하여 항상 안전한 상태를 유지한다
- **Continuous Feedback**: 테스트를 통해 지속적으로 피드백을 받는다

### 3. 테스트 작성의 3가지 규칙 (Robert C. Martin 확장)
1. **실패하는 단위 테스트를 작성하기 전에는 제품 코드를 작성하지 않는다**
2. **컴파일은 실패하지 않으면서 실행이 실패하는 정도로만 단위 테스트를 작성한다**
3. **현재 실패하는 테스트를 통과할 정도로만 제품 코드를 작성한다**

## Kent Beck의 테스트 품질 기준

### FIRST 원칙 (Kent Beck & 마이크 콘)
- **Fast**: 빠르게 실행되어야 한다
- **Independent**: 독립적이어야 한다 (테스트 간 의존성 없음)
- **Repeatable**: 반복 가능해야 한다 (언제 어디서든 같은 결과)
- **Self-Validating**: 자체 검증이 가능해야 한다 (Pass/Fail 명확)
- **Timely**: 적시에 작성되어야 한다 (코드 작성 전에)

### 좋은 테스트의 특징 (Kent Beck 관점)
1. **명확한 의도 표현**: 테스트 이름과 구조로 의도가 명확히 드러나야 함
2. **하나의 개념만 테스트**: 각 테스트는 하나의 동작이나 시나리오만 검증
3. **테스트가 문서 역할**: 코드 사용법과 예상 동작을 보여주는 살아있는 문서
4. **실패 시 명확한 진단**: 무엇이 잘못되었는지 쉽게 파악할 수 있어야 함

## Kent Beck의 테스트 설계 철학

### 1. Arrange-Act-Assert (AAA) 패턴
```javascript
// Arrange: 테스트 환경 설정
const user = createUser({ name: 'John', email: 'john@example.com' });

// Act: 테스트할 동작 실행
const result = authenticateUser(user.email, 'password123');

// Assert: 결과 검증
expect(result).toBe(true);
```

### 2. 테스트 이름 작성 원칙
- **Given-When-Then 패턴**: `should_return_true_when_valid_credentials_provided`
- **동작 기반 명명**: `should_create_user_profile_on_successful_registration`
- **사용자 관점**: `should_display_error_message_for_invalid_email`

### 3. 테스트 데이터 관리
- **Test Data Builder 패턴**: 복잡한 객체 생성을 위한 빌더 사용
- **Mother Object 패턴**: 재사용 가능한 테스트 데이터 객체
- **Fresh Fixture**: 각 테스트마다 새로운 데이터 사용

## 안티패턴 및 피해야 할 것들

### Kent Beck이 경고하는 TDD 안티패턴
1. **Big Design Up Front in Tests**: 테스트에서도 과도한 사전 설계 지양
2. **Testing Implementation Details**: 구현 세부사항이 아닌 동작 테스트
3. **Fragile Tests**: 코드 변경 시 쉽게 깨지는 테스트
4. **Slow Tests**: 너무 느린 테스트는 피드백 사이클을 망친다
5. **Testing Everything**: 모든 것을 테스트하려 하지 말고 중요한 것에 집중

### React Testing Library와 Kent Beck 철학의 연관성
- **사용자 중심 테스트**: 구현보다는 사용자 경험에 집중
- **Accessibility First**: 접근성을 고려한 테스트 (getByRole, getByLabelText)
- **Integration over Unit**: 개별 유닛보다는 통합된 동작 테스트
- **No Implementation Details**: 내부 state나 props 직접 테스트 지양

## 실용적 TDD 가이드라인

### 1. 테스트 크기와 범위
- **단위 테스트**: 하나의 함수나 메서드의 특정 동작
- **통합 테스트**: 여러 컴포넌트 간의 상호작용
- **인수 테스트**: 사용자 시나리오 전체 검증

### 2. 테스트 우선순위 (Kent Beck의 ROI 관점)
1. **High Risk, High Value**: 중요하고 위험한 코드 우선 테스트
2. **Core Business Logic**: 비즈니스 핵심 로직
3. **Integration Points**: 외부 시스템과의 통합 지점
4. **Edge Cases**: 경계값 및 예외 상황

### 3. 리팩토링 안전 가이드
- **Green Bar**: 모든 테스트가 통과하는 상태에서만 리팩토링
- **Small Steps**: 작은 단위로 변경하고 즉시 테스트 실행
- **Revert Strategy**: 언제든 되돌릴 수 있는 체크포인트 유지

## Kent Beck의 TDD 성숙도 모델

### Level 1: Basic TDD
- Red-Green-Refactor 사이클 이해
- 테스트 먼저 작성하기
- 최소한의 코드로 테스트 통과시키기

### Level 2: Design-Driven TDD
- 테스트를 통한 API 설계
- 테스트가 설계 도구 역할
- 의존성 방향 제어

### Level 3: Behavior-Driven TDD
- 사용자 시나리오 기반 테스트
- 도메인 언어로 테스트 작성
- 스테이크홀더와 공유 가능한 명세

### Level 4: Advanced TDD Practices
- 테스트 더블 전략적 사용
- 테스트 코드 품질 관리
- 팀 차원의 TDD 문화 구축

## 결론: TDD의 궁극적 목표

Kent Beck에 따르면 TDD는 단순히 버그를 줄이는 것이 아니라:
- **Confidence**: 코드 변경에 대한 자신감 제공
- **Design Tool**: 더 나은 설계로 이끄는 도구
- **Documentation**: 살아있는 문서 역할
- **Regression Safety**: 회귀 결함 방지
- **Feedback Loop**: 빠른 피드백을 통한 학습 촉진

**"TDD는 불안함을 관리하는 방법이다" - Kent Beck**