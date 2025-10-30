# 반복 일정 기능 명세 (SpecAgent)

## 개요

- 사용자 스토리: 사용자는 일정 생성/수정 시 반복 유형을 선택하고, 캘린더에서 반복 일정을 구분해서 보고, 필요 시 반복 종료/수정/삭제를 수행할 수 있다.
- 범위: UI(`App.tsx`), 훅(`useEventForm`, `useEventOperations`), 유틸(`repeatUtils.ts`), API(`server.js`).
- 비고: 기존 코드 최대한 유지. 기존 테스트와 중복 테스트 금지.

---

## 프로젝트 구조 및 활용 포인트

```
src/
├── App.tsx                       # 메인 UI. 반복 UI 블럭이 주석으로 준비됨
├── types.ts                      # Event, EventForm, RepeatInfo, RepeatType 정의
├── hooks/
│   ├── useEventForm.ts           # 폼 상태: repeatType/interval/endDate 포함
│   ├── useEventOperations.ts     # 이벤트 CRUD(fetch/save/delete), 스낵바 알림
│   ├── useCalendarView.ts        # 뷰 전환(week/month), 날짜 이동, 공휴일 로드
│   ├── useNotifications.ts       # 알림 표시 상태 관리
│   └── useSearch.ts              # 검색 상태 및 필터 결과
├── utils/
│   ├── dateUtils.ts              # 포맷/주/월 도우미; 캘린더 렌더에 사용
│   ├── eventOverlap.ts           # 일정 겹침 계산(반복일정은 겹침 무시 규칙 주의)
│   ├── eventUtils.ts             # 검색/주/월 범위 필터링
│   ├── notificationUtils.ts      # 알림 관련 유틸
│   └── timeValidation.ts         # 시작/종료시간 유효성
├── apis/fetchHolidays.ts         # 공휴일 데이터(msw 기반)
└── __tests__/
    ├── unit/*                    # 유닛 테스트 모음
    ├── hooks/*                   # 훅 테스트 모음
    └── integration/*             # 통합 테스트(React Testing Library)
server.js                          # Express API. 단건/배치/반복 시리즈 엔드포인트 제공
```

### 기존 타입

- `RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'`
- `RepeatInfo = { type: RepeatType; interval: number; endDate?: string }`
- `EventForm`, `Event` (기존 폼/저장 모델, `Event`는 `id` 추가)

### 기존 훅 연계

- `useEventForm` 상태 필드 사용 계획
  - `isRepeating`, `repeatType`, `repeatInterval`, `repeatEndDate`를 UI와 연결
- `useEventOperations` 저장 시 페이로드
  - 현재 `saveEvent`는 단건(`/api/events`)에 저장. 반복 전개는 클라이언트 유틸에서 처리하여 `events-list` 엔드포인트 사용 가능(옵션)

### 기존 유틸 연계

- `eventOverlap.findOverlappingEvents`는 겹침을 계산하지만, 요구사항에 따라 “반복일정은 겹침 고려 안 함”.
  - 생성 시 겹침 경고 로직은 유지하되 반복 전개 리스트 저장 시에는 겹침 필터링을 적용하지 않음.
- `dateUtils`의 `formatDate`, `getWeekDates`, `getWeeksAtMonth`는 캘린더 렌더에 활용됨.

### 서버 엔드포인트(이미 구현됨)

- 단건 CRUD
  - `GET /api/events`
  - `POST /api/events` (단건 추가)
  - `PUT /api/events/:id` (단건 수정)
  - `DELETE /api/events/:id` (단건 삭제)
- 배치/반복 연계용
  - `POST /api/events-list` (여러 이벤트 일괄 추가; 반복 시리즈에 공통 `repeat.id` 부여)
  - `PUT /api/events-list` (여러 이벤트 일괄 수정)
  - `DELETE /api/events-list` (여러 이벤트 일괄 삭제; `eventIds` 배열 전달)
- 반복 시리즈 단위 수정/삭제
  - `PUT /api/recurring-events/:repeatId` (시리즈 전체 수정)
  - `DELETE /api/recurring-events/:repeatId` (시리즈 전체 삭제)

---

## 기능 1: 반복 유형 선택

- 목적: 일정 생성/수정 시 반복 유형을 선택할 수 있다.
- 옵션: `none | daily | weekly | monthly | yearly`
- UI 명세:
  - `App.tsx`
    - 체크박스: "반복 일정" (`isRepeating`) 이미 존재
    - Select: "반복 유형" (주석되어 있는 블럭 활성화)
      - 값: `daily`, `weekly`, `monthly`, `yearly`
    - TextField: "반복 간격" (기본 1)
    - DatePicker(TextField type=date): "반복 종료일" (옵션)
  - 접근성: 각 컨트롤에 라벨/aria 속성 유지
- 훅 명세:
  - `useEventForm`에 상태 이미 존재: `repeatType`, `repeatInterval`, `repeatEndDate`, `isRepeating`
  - UI Select/Inputs가 해당 setter와 연결되어야 함
- 유틸 명세:
  - 파일: `src/utils/repeatUtils.ts` (신규)
  - 함수: `generateRecurringEvents(baseEvent: EventForm, endDate?: string): EventForm[]`
    - `repeat.type`에 따라 발생 목록을 생성 (daily/weekly/monthly/yearly)
    - 월 31일 선택 시: 31일이 있는 달에만 생성 (마지막 날로 보정 금지)
    - 윤년 2월 29일 연간 반복: 윤년에만 생성 (평년 건너뜀)
    - 반복일정은 "일정 겹침" 고려하지 않음
    - 최대 종료일: 2025-12-31 (기능 3에서 상세)
- API 영향:
  - 최소안: 단건 저장 유지(`POST /api/events`)
  - 확장안: 반복 전개 결과를 `POST /api/events-list`로 일괄 저장하여 공통 `repeat.id` 관리

### 수용 기준 (Acceptance Criteria)

- AC1: "반복 일정" 체크 시 반복 옵션 영역이 표시된다.
- AC2: 반복 유형 Select에서 `daily|weekly|monthly|yearly`를 선택할 수 있다.
- AC3: 반복 간격 숫자 입력이 가능하다 (기본 1, 최소 1).
- AC4: 반복 종료일을 선택 입력할 수 있다.
- AC5: 저장 시 이벤트에 `repeat` 정보가 반영된다.

---

## 기능 2: 반복 일정 표시

- 목적: 캘린더 뷰에서 반복 일정을 구분 표시
- UI 명세:
  - 월/주 뷰 카드에 반복 일정이면 반복 아이콘 또는 표식 노출 (간단한 텍스트/아이콘 OK)
  - 참고: 현재 `App.tsx`에서 이벤트 카드 렌더 중 `event.repeat.type !== 'none'`일 때 텍스트 표기 있음
- 데이터 명세:
  - 이벤트 목록 렌더 시 `event.repeat.type !== 'none'`이면 식별자 노출

### 수용 기준

- AC1: 반복 일정에는 반복 표식이 노출된다.
- AC2: 단일 일정에는 표식이 없다.

---

## 기능 3: 반복 종료

- 목적: 반복 종료 조건 지정
- 옵션: 특정 날짜까지 (최대 2025-12-31)
- 처리:
  - `generateRecurringEvents`에서 `endDate` 또는 상한(2025-12-31) 내에서만 전개

### 수용 기준

- AC1: 종료일 이후로는 발생하지 않는다.
- AC2: 종료일이 없으면 상한(2025-12-31)까지만 전개한다.

---

## 기능 4: 반복 일정 수정

- 목적: 단일/전체 수정 흐름 제공
- UI 명세:
  - 다이얼로그: "해당 일정만 수정하시겠어요? (예/아니오)"
  - 예(단일 수정): 해당 발생을 단일 일정으로 변경 (반복 표식 제거)
  - 아니오(전체 수정): 반복 일정 유지
- API 연계(선택):
  - 전체 수정 시 `PUT /api/recurring-events/:repeatId` 사용 가능

### 수용 기준

- AC1: 예 선택 시 해당 아이템만 `repeat.type = 'none'` 처리
- AC2: 아니오 선택 시 반복 속성 유지

---

## 기능 5: 반복 일정 삭제

- 목적: 단일/전체 삭제 제공
- UI/API 명세:
  - 다이얼로그: "해당 일정만 삭제하시겠어요? (예/아니오)"
  - 예: 단일 삭제 (기존 `DELETE /api/events/:id`)
  - 아니오: 시리즈 전체 삭제 (`DELETE /api/recurring-events/:repeatId`)
  - 배치 삭제가 필요할 경우 `DELETE /api/events-list`로 `eventIds` 배열 전달 가능

### 수용 기준

- AC1: 예 선택 시 해당 일정만 삭제
- AC2: 아니오 선택 시 해당 반복의 모든 발생 삭제

---

## 테스트 범위 요약

- 유닛: `repeatUtils.generateRecurringEvents` (daily/weekly/monthly/yearly, 31일, 윤년, 종료일)
- 훅: `useEventForm` 반복 상태 업데이트/저장 반영
- 통합: App 반복 옵션 표시/선택, 반복 표식 표시, 수정/삭제 다이얼로그 흐름

## 비기능 요구사항

- 테스트: Vitest + RTL, AAA 패턴, 실패 → 통과 → 리팩토링 사이클
- 커버리지 ≥ 80%
- 타입 안전성 유지 (TypeScript)
