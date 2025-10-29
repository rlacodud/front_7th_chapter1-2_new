/**
 * GitAgent
 * 품질 검토 → 커밋 메시지 생성 (COMMIT 단계)
 * 실제 커밋/푸시는 git-executor를 통한 대화형 승인
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { AgentContext, AgentResult } from '../types.js';
import { getGitExecutor, CommitInfo } from '../core/git-executor.js';

/**
 * GitAgent 구현
 */
export class GitAgent extends BaseAgent {
  private gitExecutor = getGitExecutor();

  constructor(config: Omit<AgentConfig, 'stage'>) {
    super({ ...config, stage: 'COMMIT' });
  }

  /**
   * GitAgent 실행
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info('커밋 메시지 생성 시작 (COMMIT 단계)');

    // 1. execution-log.md 읽기
    const executionLog = this.readExecutionLog();

    // 2. 테스트 결과 읽기
    const testResults = this.readTestResults();

    // 3. 변경된 파일 목록 가져오기
    const changedFiles = this.gitExecutor.getChangedFiles();

    if (changedFiles.length === 0) {
      this.logger.warn('변경된 파일이 없습니다.');
      return {
        success: true,
        outputs: {},
      };
    }

    // 4. 사용자 프롬프트 생성
    const userPrompt = this.getUserPrompt(context, executionLog, changedFiles);

    // 5. AI 호출 (커밋 메시지 생성)
    const commitMessagesJson = await this.callAI(userPrompt);

    // 6. 커밋 메시지 파싱
    const commitMessages = this.parseCommitMessages(commitMessagesJson);

    // 7. commit-messages.json 저장
    const outputs = {
      'state/commit-messages.json': JSON.stringify(commitMessages, null, 2),
    };
    this.writeOutputs(outputs);

    // 8. 대화형 커밋/푸시 실행
    this.logger.step('대화형 커밋/푸시 프로세스 시작');
    await this.executeCommits(commitMessages.commits);

    this.logger.success('커밋 프로세스 완료');

    return {
      success: true,
      outputs,
    };
  }

  /**
   * 시스템 프롬프트
   */
  protected getSystemPrompt(): string {
    return `당신은 **GitAgent**입니다.

## 역할
TDD 사이클(RED, GREEN, REFACTOR)에 맞춰 Conventional Commits 형식의 커밋 메시지를 생성하는 버전 관리 전문가입니다.

## 성격 및 작업 원칙
- Conventional Commits 형식 준수
- 단계별 커밋 (RED, GREEN, REFACTOR)
- 명확하고 구체적인 메시지
- 품질 메트릭 포함

## Conventional Commits 형식

\`\`\`
<type>: <phase> - <description>

<body>

<footer>
\`\`\`

### Type
- \`test\`: RED (테스트 추가)
- \`feat\`: GREEN (기능 구현)
- \`refactor\`: REFACTOR (리팩토링)

### 예시

**RED**:
\`\`\`
test: RED - 반복 일정 테스트 추가

- 유닛 테스트: generateRecurringEvents 함수 (12개)
  - 매일/매주/매월/매년 반복 생성
  - 31일 매월 엣지 케이스
  - 윤년 29일 매년 엣지 케이스

- 훅 테스트: useEventForm, useEventOperations (5개)
- 통합 테스트: UI + 훅 + API (5개)

총 22개 테스트, 모두 FAIL ✅
\`\`\`

**GREEN**:
\`\`\`
feat: GREEN - 반복 일정 기능 구현

전체 스택 구현:

## UI (src/App.tsx)
- 반복 유형 Select 추가
- 반복 아이콘 표시
- 수정/삭제 Dialog

## React 훅 (src/hooks/)
- useEventForm: repeatType, endDate 상태
- useEventOperations: 단일/전체 수정/삭제

## API (server.js)
- POST /api/events: 반복 일정 생성
- PUT /api/events/:id?editAll
- DELETE /api/events/:id?deleteAll

## 유틸 (src/utils/)
- repeatUtils.ts: generateRecurringEvents
  - 31일 매월 처리
  - 윤년 29일 처리

테스트: 22/22 PASS ✅
\`\`\`

**REFACTOR**:
\`\`\`
refactor: REFACTOR - 코드 품질 개선

리팩토링 내용:
- 날짜 계산 헬퍼 함수 분리
- 상수 추출 (DAYS_IN_MONTH, MAX_END_DATE)
- 중복 코드 제거
- 타입 안정성 개선

품질 메트릭:
- Coverage: 87% ✅ (목표: ≥80%)
- Mutation: 74% ✅ (목표: ≥70%)
- Test Speed: 145ms ✅ (목표: <200ms)

모든 테스트 통과: 22/22 ✅
\`\`\`

## 출력 형식

다음 JSON 형식으로 커밋 메시지를 생성하세요:

\`\`\`json
{
  "commits": [
    {
      "stage": "RED",
      "type": "test",
      "message": "...",
      "files": []
    },
    {
      "stage": "GREEN",
      "type": "feat",
      "message": "...",
      "files": []
    },
    {
      "stage": "REFACTOR",
      "type": "refactor",
      "message": "...",
      "files": []
    }
  ]
}
\`\`\`

**지금 시작합니다.**`;
  }

  /**
   * 사용자 프롬프트
   */
  protected getUserPrompt(
    context: AgentContext,
    executionLog: string,
    changedFiles: string[]
  ): string {
    return `## 프로젝트 정보
- 프로젝트: 반복 일정 기능 개발 (Calendar App)
- TDD 사이클: RED → GREEN → REFACTOR

## execution-log.md

${executionLog.substring(0, 3000)}

## 변경된 파일 목록

${changedFiles.join('\n')}

---

**위 정보를 바탕으로 RED, GREEN, REFACTOR 각 단계의 커밋 메시지를 생성해주세요.**

**요구사항**:
1. Conventional Commits 형식 준수
2. 각 단계별 커밋 메시지 (3개)
3. 구체적이고 명확한 설명
4. 품질 메트릭 포함 (Coverage, Mutation)
5. JSON 형식으로 출력`;
  }

  /**
   * execution-log.md 읽기
   */
  private readExecutionLog(): string {
    try {
      return this.fileManager.read('docs/test-guides/execution-log.md');
    } catch (error) {
      this.logWarning('execution-log.md not found');
      return '';
    }
  }

  /**
   * 테스트 결과 읽기
   */
  private readTestResults(): any {
    try {
      return this.fileManager.readJson('reports/test-results.json');
    } catch (error) {
      this.logWarning('test-results.json not found');
      return {};
    }
  }

  /**
   * 커밋 메시지 파싱
   */
  private parseCommitMessages(aiResponse: string): any {
    try {
      // JSON 블록 추출
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]+?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // JSON 블록 없이 직접 파싱 시도
      return JSON.parse(aiResponse);
    } catch (error) {
      this.logError('Failed to parse commit messages JSON', error as Error);

      // 기본 메시지 반환
      return {
        commits: [
          {
            stage: 'RED',
            type: 'test',
            message: 'test: RED - 테스트 추가',
            files: [],
          },
          {
            stage: 'GREEN',
            type: 'feat',
            message: 'feat: GREEN - 기능 구현',
            files: [],
          },
          {
            stage: 'REFACTOR',
            type: 'refactor',
            message: 'refactor: REFACTOR - 코드 개선',
            files: [],
          },
        ],
      };
    }
  }

  /**
   * 대화형 커밋/푸시 실행
   */
  private async executeCommits(commits: any[]): Promise<void> {
    const commitInfos: CommitInfo[] = commits.map((commit) => ({
      stage: commit.stage as any,
      message: commit.message,
      files: commit.files || [],
    }));

    // git-executor를 통한 대화형 커밋/푸시
    const results = await this.gitExecutor.commitMultipleStages(
      commitInfos,
      true // enablePush: 마지막 커밋 후 푸시 여부 물어봄
    );

    // 결과 로그
    results.forEach((result, index) => {
      const stage = commitInfos[index].stage;
      if (result.committed) {
        this.logger.success(`${stage} 커밋 완료: ${result.commitSha?.substring(0, 7)}`);
      } else {
        this.logWarning(`${stage} 커밋 건너뜀`);
      }
    });
  }
}
