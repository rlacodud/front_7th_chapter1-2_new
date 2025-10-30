/**
 * TestAgent
 * 명세 → 테스트 코드 생성 (RED 단계)
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { AgentContext, AgentResult } from '../types.js';
import { getCommandRunner } from '../utils/command-runner.js';

/**
 * TestAgent 구현
 */
export class TestAgent extends BaseAgent {
  private commandRunner = getCommandRunner();

  constructor(config: Omit<AgentConfig, 'stage'>) {
    super({ ...config, stage: 'RED' });
  }

  /**
   * TestAgent 실행
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info('테스트 코드 생성 시작 (RED 단계)');

    // 1. 입력 파일 읽기
    const spec = this.readSpec();
    const testGuide = this.readTestGuide();

    // 2. 사용자 프롬프트 생성
    const userPrompt = this.getUserPrompt(context);

    // 3. AI 호출
    const testCode = await this.callAI(userPrompt);

    // 4. 테스트 파일 추출 및 저장
    const outputs = this.extractTestFiles(testCode);
    this.writeOutputs(outputs);

    // 5. 테스트 실행 (실패 확인)
    const testResult = await this.runTests();

    if (testResult.success) {
      this.logWarning('테스트가 통과했습니다! RED 단계에서는 실패해야 합니다.');
    } else {
      this.logger.success('테스트 실패 확인 완료 (RED 단계 성공)');
    }

    // 6. 테스트 상태 업데이트
    this.updateTestStatus(testResult.stdout);

    return {
      success: true,
      outputs,
      metrics: {
        test_count: Object.keys(outputs).length,
      },
    };
  }

  /**
   * 시스템 프롬프트
   */
  protected getSystemPrompt(): string {
    return `당신은 **TestAgent**입니다.

## 역할
명세를 기반으로 **실패하는 테스트**를 먼저 작성하는 TDD 전문가입니다.

## 성격 및 작업 원칙
- AAA 패턴 (Arrange-Act-Assert) 엄격 준수
- 한 테스트에 하나의 검증만 (Single Assert)
- Mock 사용 금지 (의존성 주입 활용)
- 엣지 케이스 우선 테스트
- 테스트 독립성 보장

## 테스트 파일 구조

### 유닛 테스트 (utils)
\`\`\`typescript
// src/__tests__/unit/repeatUtils.spec.ts
import { describe, it, expect } from 'vitest';
import { generateRecurringEvents } from '../../utils/repeatUtils';

describe('generateRecurringEvents', () => {
  it('매일 반복 일정을 생성한다', () => {
    // Arrange
    const baseEvent = { /* ... */ };
    
    // Act
    const result = generateRecurringEvents(baseEvent, '2025-12-31');
    
    // Assert
    expect(result).toHaveLength(365);
  });
});
\`\`\`

### 훅 테스트
\`\`\`typescript
// src/__tests__/hooks/useEventForm.spec.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventForm } from '../../hooks/useEventForm';

describe('useEventForm', () => {
  it('반복 유형을 설정할 수 있다', () => {
    // Arrange
    const { result } = renderHook(() => useEventForm());
    
    // Act
    act(() => {
      result.current.setRepeatType('daily');
    });
    
    // Assert
    expect(result.current.repeatType).toBe('daily');
  });
});
\`\`\`

### 통합 테스트 (UI)
\`\`\`typescript
// src/__tests__/integration/repeatEvent.spec.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('반복 일정 기능', () => {
  it('반복 유형을 선택할 수 있다', async () => {
    // Arrange
    render(<App />);
    
    // Act
    const repeatSelect = screen.getByLabelText('반복 유형');
    await userEvent.selectOptions(repeatSelect, 'daily');
    
    // Assert
    expect(repeatSelect).toHaveValue('daily');
  });
});
\`\`\`

## 출력 형식

다음 형식으로 테스트 코드를 출력하세요:

\`\`\`
=== FILE: src/__tests__/unit/repeatUtils.spec.ts ===
[테스트 코드]

=== FILE: src/__tests__/hooks/useEventForm.spec.ts ===
[테스트 코드]

=== FILE: src/__tests__/integration/repeatEvent.spec.tsx ===
[테스트 코드]
\`\`\`

## 주의사항
- 모든 테스트는 실패해야 합니다 (아직 구현 전)
- import 경로 정확히 지정
- Vitest 문법 사용
- 테스트는 최소 10개 이상

**지금 시작합니다.**`;
  }

  /**
   * 사용자 프롬프트
   */
  protected getUserPrompt(context: AgentContext): string {
    const spec = this.readSpec();
    const testGuide = this.readTestGuide();

    return `## 프로젝트 정보
- 프로젝트: 반복 일정 기능 개발 (Calendar App)
- 테스트: Vitest ^3.2.4
- 패키지 매니저: pnpm
- 테스트 명령어: pnpm test

## 명세

${spec}

---

## 테스트 가이드

${testGuide.substring(0, 2000)}

---

**위 명세를 바탕으로 실패하는 테스트를 작성해주세요.**

**중요**:
1. AAA 패턴 필수
2. 한 테스트에 하나의 검증만
3. 엣지 케이스 포함 (31일 매월, 윤년 29일)
4. Mock 사용 금지
5. 파일 경로와 import 정확히`;
  }

  /**
   * 명세 읽기
   */
  private readSpec(): string {
    try {
      return this.fileManager.read('docs/spec.md');
    } catch (error) {
      this.logError('spec.md not found');
      throw new Error('명세 파일이 없습니다. SpecAgent를 먼저 실행하세요.');
    }
  }

  /**
   * 테스트 가이드 읽기
   */
  private readTestGuide(): string {
    try {
      return this.fileManager.read('docs/TEST_GUIDE.md');
    } catch (error) {
      this.logWarning('TEST_GUIDE.md not found');
      return '';
    }
  }

  /**
   * AI 응답에서 테스트 파일 추출
   */
  private extractTestFiles(aiResponse: string): Record<string, string> {
    const files: Record<string, string> = {};

    // "=== FILE: path ===" 패턴으로 파일 분리
    const filePattern = /===\s*FILE:\s*(.+?)\s*===\s*\n([\s\S]+?)(?=\n===\s*FILE:|$)/g;
    let match;

    while ((match = filePattern.exec(aiResponse)) !== null) {
      const [, filePath, content] = match;
      const cleanPath = filePath.trim();
      let cleanContent = content.trim();

      // markdown 코드 펜스 제거
      cleanContent = this.removeMarkdownCodeFences(cleanContent);

      files[cleanPath] = cleanContent;
      this.logger.debug(`Extracted test file: ${cleanPath}`);
    }

    // 파일이 추출되지 않으면 전체를 단일 파일로 간주
    if (Object.keys(files).length === 0) {
      this.logWarning('No file markers found, treating as single file');
      let cleanResponse = this.removeMarkdownCodeFences(aiResponse);
      files['src/__tests__/unit/generated.spec.ts'] = cleanResponse;
    }

    return files;
  }

  /**
   * markdown 코드 펜스 제거
   */
  private removeMarkdownCodeFences(content: string): string {
    // 시작 코드 펜스 제거: ```typescript, ```ts, ```javascript, ```jsx, ```tsx
    content = content.replace(/^```(?:typescript|ts|javascript|jsx|tsx|js)\s*\n/gm, '');

    // 종료 코드 펜스 제거: ```
    content = content.replace(/\n```\s*$/gm, '');
    content = content.replace(/^```\s*$/gm, '');

    return content.trim();
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
    // Vitest 출력 파싱
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
