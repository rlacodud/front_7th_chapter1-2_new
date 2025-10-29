/**
 * CodeAgent
 * 테스트 → 구현 코드 작성 (GREEN 단계)
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { AgentContext, AgentResult } from '../types.js';
import { getCommandRunner } from '../utils/command-runner.js';

/**
 * CodeAgent 구현
 */
export class CodeAgent extends BaseAgent {
  private commandRunner = getCommandRunner();

  constructor(config: Omit<AgentConfig, 'stage'>) {
    super({ ...config, stage: 'GREEN' });
  }

  /**
   * CodeAgent 실행
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info('구현 코드 작성 시작 (GREEN 단계)');

    // 1. 테스트 파일 읽기
    const testFiles = this.readTestFiles();

    // 2. 테스트 실행 (현재 실패 확인)
    const failingTests = await this.runTests();

    if (failingTests.success) {
      this.logWarning('모든 테스트가 이미 통과했습니다!');
    }

    // 3. 사용자 프롬프트 생성
    const userPrompt = this.getUserPrompt(context, failingTests.stderr);

    // 4. AI 호출
    const implementationCode = await this.callAI(userPrompt);

    // 5. 구현 파일 추출 및 저장
    const outputs = this.extractImplementationFiles(implementationCode);
    this.writeOutputs(outputs);

    // 6. 테스트 재실행 (통과 확인)
    const passingTests = await this.runTests();

    if (!passingTests.success) {
      this.logError('테스트가 여전히 실패합니다. 구현을 검토하세요.');
    } else {
      this.logger.success('모든 테스트 통과 (GREEN 단계 성공)');
    }

    // 7. 테스트 상태 업데이트
    this.updateTestStatus(passingTests.stdout);

    return {
      success: passingTests.success,
      outputs,
      metrics: {
        implementation_files: Object.keys(outputs).length,
      },
    };
  }

  /**
   * 시스템 프롬프트
   */
  protected getSystemPrompt(): string {
    return `당신은 **CodeAgent**입니다.

## 역할
실패하는 테스트를 **최소한의 코드**로 통과시키는 TDD 실천가입니다.

## 성격 및 작업 원칙
- 테스트를 통과시키는 최소 구현
- 과도한 최적화 금지 (YAGNI)
- 하드코딩도 초기에는 허용
- 전체 스택 구현 (UI, 훅, API, 유틸)

## 구현 범위

### 1. UI 구현 (src/App.tsx)
- Material-UI 컴포넌트 추가
- 이벤트 핸들러 연결
- 상태 표시

**예시**:
\`\`\`tsx
<Select
  label="반복 유형"
  value={repeatType}
  onChange={(e) => setRepeatType(e.target.value)}
>
  <MenuItem value="none">반복 안 함</MenuItem>
  <MenuItem value="daily">매일</MenuItem>
  <MenuItem value="weekly">매주</MenuItem>
  <MenuItem value="monthly">매월</MenuItem>
  <MenuItem value="yearly">매년</MenuItem>
</Select>
\`\`\`

### 2. 훅 구현 (src/hooks/)
- 상태 관리 로직
- API 연동
- 부수 효과 처리

**예시**:
\`\`\`typescript
// src/hooks/useEventForm.ts
export const useEventForm = () => {
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [endDate, setEndDate] = useState<string>('');
  
  return { repeatType, setRepeatType, endDate, setEndDate };
};
\`\`\`

### 3. API 구현 (server.js)
- Express 라우트 추가/수정
- 파일 기반 DB 조작
- 에러 처리

**예시**:
\`\`\`javascript
// POST /api/events - 반복 일정 생성
app.post('/api/events', (req, res) => {
  const { repeat } = req.body;
  
  if (repeat.type !== 'none') {
    // 반복 일정 생성 로직
  }
  
  res.json({ success: true });
});
\`\`\`

### 4. 유틸 구현 (src/utils/)
- 순수 함수
- 비즈니스 로직
- 헬퍼 함수

**예시**:
\`\`\`typescript
// src/utils/repeatUtils.ts
export function generateRecurringEvents(
  baseEvent: Event,
  endDate: string
): Event[] {
  const events: Event[] = [];
  
  // 반복 로직 구현
  
  return events;
}
\`\`\`

## 출력 형식

다음 형식으로 구현 코드를 출력하세요:

\`\`\`
=== FILE: src/utils/repeatUtils.ts ===
[구현 코드]

=== FILE: src/hooks/useEventForm.ts ===
[구현 코드]

=== FILE: server.js ===
[기존 코드 + 추가 부분]

=== FILE: src/App.tsx ===
[기존 코드 + 추가 부분]
\`\`\`

## 주의사항
- 테스트를 통과시키는 최소 코드만 작성
- 기존 코드를 수정할 때는 주석으로 표시
- TypeScript 타입 정확히
- import 경로 정확히

**지금 시작합니다.**`;
  }

  /**
   * 사용자 프롬프트
   */
  protected getUserPrompt(context: AgentContext, testErrors: string): string {
    const testFiles = this.readTestFiles();
    const testFilesList = Object.keys(testFiles).join('\n');

    return `## 프로젝트 정보
- 프로젝트: 반복 일정 기능 개발 (Calendar App)
- 언어: TypeScript
- 프레임워크: React 19, Express.js
- 테스트: Vitest ^3.2.4

## 현재 실패하는 테스트

${testErrors.substring(0, 2000)}

## 작성된 테스트 파일 목록

${testFilesList}

---

**위 테스트를 통과시키는 최소한의 구현 코드를 작성해주세요.**

**구현 범위**:
1. UI (src/App.tsx) - 반복 유형 Select, 아이콘 표시, Dialog
2. 훅 (src/hooks/) - useEventForm, useEventOperations
3. API (server.js) - POST, PUT, DELETE 엔드포인트
4. 유틸 (src/utils/) - repeatUtils.ts

**중요**:
- 테스트를 통과시키는 최소 코드만
- 하드코딩도 초기에는 OK
- 엣지 케이스 처리 (31일 매월, 윤년 29일)
- 기존 코드 수정 시 주석으로 표시`;
  }

  /**
   * 테스트 파일 읽기
   */
  private readTestFiles(): Record<string, string> {
    const testFiles = this.fileManager.glob('*.spec.ts', 'src/__tests__');
    const testFilesContent: Record<string, string> = {};

    for (const file of testFiles) {
      try {
        testFilesContent[file] = this.fileManager.read(file);
      } catch (error) {
        this.logWarning(`Failed to read test file: ${file}`);
      }
    }

    return testFilesContent;
  }

  /**
   * AI 응답에서 구현 파일 추출
   */
  private extractImplementationFiles(aiResponse: string): Record<string, string> {
    const files: Record<string, string> = {};

    // "=== FILE: path ===" 패턴으로 파일 분리
    const filePattern = /===\s*FILE:\s*(.+?)\s*===\s*\n([\s\S]+?)(?=\n===\s*FILE:|$)/g;
    let match;

    while ((match = filePattern.exec(aiResponse)) !== null) {
      const [, filePath, content] = match;
      const cleanPath = filePath.trim();
      const cleanContent = content.trim();

      files[cleanPath] = cleanContent;
      this.logger.debug(`Extracted implementation file: ${cleanPath}`);
    }

    if (Object.keys(files).length === 0) {
      this.logWarning('No file markers found in AI response');
    }

    return files;
  }

  /**
   * 테스트 실행
   */
  private async runTests() {
    this.logger.step('테스트 실행 중...');

    const result = await this.commandRunner.runTests({
      silent: false,
      captureOutput: true,
    });

    return result;
  }

  /**
   * 테스트 상태 업데이트
   */
  private updateTestStatus(output: string): void {
    const totalMatch = output.match(/(\d+)\s*passed/);
    const failMatch = output.match(/(\d+)\s*failed/);

    const passing = totalMatch ? parseInt(totalMatch[1]) : 0;
    const failing = failMatch ? parseInt(failMatch[1]) : 0;

    this.statusTracker.updateTestStatus({
      total_tests: passing + failing,
      passing,
      failing,
      skipped: 0,
    });
  }
}
