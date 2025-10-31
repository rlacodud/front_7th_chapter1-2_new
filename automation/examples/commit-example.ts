/**
 * 대화형 커밋/푸시 예시
 *
 * 실행: tsx automation/examples/commit-example.ts
 */

import { getGitExecutor, CommitInfo } from '../core/git-executor.js';
import { closeApprovalManager } from '../utils/approval-manager.js';

async function main() {
  const gitExecutor = getGitExecutor();

  // RED, GREEN, REFACTOR 각 단계의 커밋 메시지
  const commits: CommitInfo[] = [
    {
      stage: 'RED',
      message: `test: RED - 반복 일정 테스트 추가

- 유닛 테스트: generateRecurringEvents 함수 (12개)
  - 매일/매주/매월/매년 반복 생성
  - 31일 매월 엣지 케이스 (2월, 30일 달 건너뛰기)
  - 윤년 29일 매년 엣지 케이스

- 훅 테스트: useEventForm, useEventOperations (5개)
  - 반복 설정 상태 관리
  - 단일/전체 수정 및 삭제

- 통합 테스트: UI + 훅 + API 전체 플로우 (5개)
  - 반복 유형 선택, 아이콘 표시
  - 수정/삭제 다이얼로그

총 22개 테스트, 모두 FAIL ✅`,
      files: [], // 빈 배열이면 자동으로 git status에서 가져옴
    },
    {
      stage: 'GREEN',
      message: `feat: GREEN - 반복 일정 기능 구현

전체 스택 구현:

## UI (src/App.tsx)
- 반복 유형 Select 추가 (매일/매주/매월/매년)
- 반복 종료 날짜 DatePicker
- 반복 아이콘 표시 (RepeatIcon)
- "해당 일정만 수정/삭제하시겠어요?" Dialog

## React 훅 (src/hooks/)
- useEventForm: repeatType, endDate 상태 추가
- useEventOperations: 단일/전체 수정/삭제 로직

## API (server.js)
- POST /api/events: 반복 일정 생성
- PUT /api/events/:id?editAll: 단일/전체 수정
- DELETE /api/events/:id?deleteAll: 단일/전체 삭제

## 유틸 (src/utils/)
- repeatUtils.ts: generateRecurringEvents 함수
  - 31일 매월 처리 (2월, 30일 달 건너뛰기)
  - 윤년 29일 처리 (윤년 체크)
  - 반복 종료 날짜 (2025-12-31 최대)

테스트: 22/22 PASS ✅`,
      files: [],
    },
    {
      stage: 'REFACTOR',
      message: `refactor: REFACTOR - 코드 품질 개선

리팩토링 내용:

## repeatUtils.ts
- 날짜 계산 헬퍼 함수 분리
  - isLeapYear(year): 윤년 체크
  - getDaysInMonth(year, month): 월별 일수
  - findNextValidDate(): 유효한 다음 날짜 찾기

- 상수 추출
  - DAYS_IN_MONTH: 각 달의 일수
  - MAX_END_DATE: 최대 종료 날짜

- 중복 코드 제거
  - 날짜 계산 로직 통합

## 타입 안정성 개선
- 모든 함수에 명시적 반환 타입
- strict null checks 통과

품질 메트릭:
- Coverage: 87% ✅ (목표: ≥80%)
- Mutation Score: 74% ✅ (목표: ≥70%)
- Test Execution: 145ms ✅ (목표: <200ms)
- Maintainability: A ✅

모든 테스트 통과: 22/22 ✅`,
      files: [],
    },
  ];

  try {
    console.log('\n🚀 대화형 커밋/푸시 프로세스 시작\n');
    console.log('TDD 3단계 (RED, GREEN, REFACTOR)를 순차적으로 커밋합니다.\n');

    // 변경사항 확인
    if (!gitExecutor.hasChanges()) {
      console.log('⚠️  변경된 파일이 없습니다.\n');
      return;
    }

    // 여러 단계 커밋 (마지막에만 푸시 옵션)
    const results = await gitExecutor.commitMultipleStages(
      commits,
      true // enablePush: 마지막 커밋 후 푸시 여부 물어봄
    );

    // 결과 요약
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 커밋 결과 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    results.forEach((result, index) => {
      const stage = commits[index].stage;
      console.log(`${stage}:`);
      console.log(`  커밋: ${result.committed ? '✅' : '❌'}`);
      console.log(`  푸시: ${result.pushed ? '✅' : '⏭️ '}`);
      if (result.commitSha) {
        console.log(`  SHA: ${result.commitSha.substring(0, 7)}`);
      }
      console.log('');
    });

    // 로그 파일 생성 (미사용)
    gitExecutor.generateCommitLog(results);
    console.log('📝 로그가 생성되었습니다.\n');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    // 리소스 정리
    closeApprovalManager();
  }
}

main();
