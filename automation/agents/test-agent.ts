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

    // 1. 입력 파일 읽기 (미사용)
    this.readSpec();
    this.readTestGuide();

    // 2. 사용자 프롬프트 생성
    const userPrompt = this.getUserPrompt();

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

## ⚠️ 출력 형식 (매우 중요!)

다음 형식을 **정확히** 따라주세요:

=== FILE: src/__tests__/unit/repeatUtils.spec.ts ===
import { describe, it, expect } from 'vitest';
import { generateRecurringEvents } from '../../utils/repeatUtils';

describe('generateRecurringEvents', () => {
  it('매일 반복 일정을 생성한다', () => {
    // Arrange
    const baseEvent = { id: 1, title: '회의', date: '2025-01-01', /* ... */ };
    
    // Act
    const result = generateRecurringEvents(baseEvent, '2025-01-05');
    
    // Assert
    expect(result).toHaveLength(5);
  });
});

=== FILE: src/__tests__/hooks/useEventForm.spec.ts ===
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventForm } from '../../hooks/useEventForm';

describe('useEventForm', () => {
  it('반복 유형을 설정할 수 있다', () => {
    // Arrange
    const { result } = renderHook(() => useEventForm());
    
    // Act
    act(() => result.current.setRepeatType('daily'));
    
    // Assert
    expect(result.current.repeatType).toBe('daily');
  });
});

## 🚨 절대 금지 사항

1. **마크다운 코드 펜스를 절대 사용하지 마세요!**
   ❌ 잘못된 예: \`\`\`typescript 또는 \`\`\`tsx 또는 \`\`\`
   ✅ 올바른 예: === FILE: 경로 === 바로 다음 줄에 순수 코드

2. **설명 텍스트를 테스트 코드 안에 넣지 마세요!**
   ❌ "이 테스트는..."
   ✅ 순수한 TypeScript 테스트 코드만 작성

3. **각 파일은 반드시 === FILE: 경로 === 로 시작**

## 주의사항
- 모든 테스트는 실패해야 합니다 (아직 구현 전)
- import 경로 정확히 지정
- Vitest 문법 사용 (describe, it, expect)
- AAA 패턴 준수
- 테스트는 최소 10개 이상

**순수한 테스트 코드만 출력하세요. 지금 시작합니다.**`;
  }

  /**
   * 사용자 프롬프트
   * @param _context Agent 컨텍스트 (미사용)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getUserPrompt(_context: AgentContext): string {
    const spec = this.readSpec();
    const testGuide = this.readTestGuide();
    const existingTests = this.analyzeExistingTests();

    // ⭐ 기존 구현 코드 분석
    const existingCode = this.analyzeExistingCode();

    // ⭐⭐ 현재 진행 중인 기능 추출
    const currentFeature = this.extractCurrentFeature(spec);

    return `## 프로젝트 정보
- 프로젝트: 반복 일정 기능 개발 (Calendar App)
- 테스트: Vitest ^3.2.4
- 패키지 매니저: pnpm
- 테스트 명령어: pnpm test

## ⭐⭐ 현재 진행 중인 기능 (이것만 테스트 작성!)

${currentFeature}

⚠️ **중요**: 위 "현재 기능"에 대한 테스트만 작성하세요!
   - 다른 기능은 나중에 별도 TDD 사이클에서 진행
   - 한 번에 하나의 기능만 집중

## 기존 코드 구조 분석 (⭐ 중요!)

${existingCode}

⚠️ **위 코드 구조를 기반으로 테스트를 작성하세요!**
   - 기존 함수가 있으면 그 API 사용
   - 새 함수가 필요하면 기존 패턴 따라서 작성

## 기존 테스트 분석

${existingTests.summary}

⚠️ **중요: 위에 나열된 테스트 케이스는 이미 존재합니다. 중복 생성하지 마세요!**

${
  existingTests.missingCases.length > 0
    ? `
## 🎯 아직 검증되지 않은 케이스 (우선 작성)

${existingTests.missingCases.join('\n')}

위 케이스들을 우선적으로 테스트 작성하세요.
`
    : ''
}

## 명세

${spec}

---

## 테스트 가이드

${testGuide.substring(0, 1000)}

---

**위 명세를 바탕으로 실패하는 테스트를 작성해주세요.**

**테스트 작성 전략**:
1. **기존 코드 구조 확인**: 위의 "기존 코드 구조 분석" 참고
2. **실제 구현 가능한 API**: 기존 패턴을 따르는 API로 테스트 작성
3. **중복 방지**: 이미 검증된 케이스는 제외
4. **누락된 케이스 우선**: "아직 검증되지 않은 케이스" 먼저 작성

**중요**:
1. AAA 패턴 필수
2. 한 테스트에 하나의 검증만
3. 엣지 케이스 포함 (31일 매월, 윤년 29일)
4. Mock 사용 금지
5. **기존 코드 구조와 일관성 유지** ⭐
6. **GREEN 단계에서 구현 가능한 API로 테스트 작성** ⭐`;
  }

  /**
   * 명세 읽기
   */
  private readSpec(): string {
    try {
      return this.fileManager.read('docs/spec.md');
    } catch {
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
    } catch {
      this.logWarning('TEST_GUIDE.md not found');
      return '';
    }
  }

  /**
   * 기존 구현 코드 분석 (⭐ 중요!)
   * TestAgent가 실제 구현 가능한 API로 테스트를 작성하도록
   */
  private analyzeExistingCode(): string {
    const analysis: string[] = [];

    analysis.push('### 📁 기존 구현 코드 (테스트 작성 시 참고)\n');

    // 1. 기존 테스트 파일 분석 (⭐ 추가)
    try {
      const existingTestFiles = this.fileManager.listFiles('src/__tests__', [
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      if (existingTestFiles.length > 0) {
        analysis.push('**기존 테스트 파일 (참고용 API 사용 예시)**:\n');

        // 대표 테스트 파일 몇 개만 분석 (토큰 절약)
        const sampleTests = existingTestFiles.slice(0, 3);

        for (const testFile of sampleTests) {
          try {
            const content = this.fileManager.read(testFile);
            const lines = content.split('\n');

            // 함수 호출 패턴 추출 (result.current.XXX 또는 XXX())
            const functionCalls = lines
              .filter((line) => line.includes('result.current.') || /\w+\(/.test(line))
              .slice(0, 5)
              .map((line) => `  ${line.trim()}`)
              .join('\n');

            if (functionCalls) {
              analysis.push(`- ${testFile}:`);
              analysis.push('```typescript');
              analysis.push(functionCalls);
              analysis.push('```\n');
            }
          } catch {
            // 무시
          }
        }
      }
    } catch {
      analysis.push('**기존 테스트**: 없음\n');
    }

    // 2. useEventForm.ts 분석 (함수 시그니처 포함)
    try {
      const useEventFormContent = this.fileManager.read('src/hooks/useEventForm.ts');
      const lines = useEventFormContent.split('\n');

      // 함수 시그니처 추출
      const functionSignatures = lines
        .filter((line) => {
          const trimmed = line.trim();
          return (
            trimmed.startsWith('const handle') ||
            trimmed.startsWith('const set') ||
            trimmed.startsWith('const reset') ||
            trimmed.startsWith('const edit')
          );
        })
        .slice(0, 10)
        .map((line) => `  ${line.trim()}`)
        .join('\n');

      // return 문 찾기
      const returnIndex = lines.findIndex((line) => line.trim().startsWith('return {'));
      if (returnIndex !== -1) {
        const returnBlock = lines.slice(returnIndex, returnIndex + 30).join('\n');

        analysis.push('**useEventForm.ts - 현재 제공하는 API**:');

        if (functionSignatures) {
          analysis.push('\n함수 시그니처:');
          analysis.push('```typescript');
          analysis.push(functionSignatures);
          analysis.push('```\n');
        }

        analysis.push('Return 값:');
        analysis.push('```typescript');
        analysis.push(returnBlock);
        analysis.push('```');
        analysis.push('');
        analysis.push('⚠️ 위 함수 시그니처를 정확히 사용하여 테스트 작성!');
        analysis.push('   - 매개변수 타입과 개수 확인');
        analysis.push('   - 예: handleStartTimeChange(e: ChangeEvent<HTMLInputElement>)');
        analysis.push('');
      }
    } catch {
      analysis.push('**useEventForm.ts**: 파일을 읽을 수 없음\n');
    }

    // 3. useEventOperations.ts 분석
    try {
      const useEventOpsContent = this.fileManager.read('src/hooks/useEventOperations.ts');
      const lines = useEventOpsContent.split('\n');

      // 함수 시그니처 추출
      const functionSignatures = lines
        .filter((line) => {
          const trimmed = line.trim();
          return (
            trimmed.startsWith('const save') ||
            trimmed.startsWith('const delete') ||
            trimmed.startsWith('const edit') ||
            trimmed.startsWith('const fetch')
          );
        })
        .slice(0, 10)
        .map((line) => `  ${line.trim()}`)
        .join('\n');

      const returnIndex = lines.findIndex((line) => line.trim().startsWith('return {'));
      if (returnIndex !== -1) {
        const returnBlock = lines.slice(returnIndex, returnIndex + 20).join('\n');

        analysis.push('**useEventOperations.ts - 현재 제공하는 API**:');

        if (functionSignatures) {
          analysis.push('\n함수 시그니처:');
          analysis.push('```typescript');
          analysis.push(functionSignatures);
          analysis.push('```\n');
        }

        analysis.push('Return 값:');
        analysis.push('```typescript');
        analysis.push(returnBlock);
        analysis.push('```');
        analysis.push('');
        analysis.push('⚠️ 위 구조를 기반으로 테스트 작성!');
        analysis.push('   - 반복 일정 CRUD 추가 시: 기존 패턴 따라서 작성');
        analysis.push('');
      }
    } catch {
      analysis.push('**useEventOperations.ts**: 파일을 읽을 수 없음\n');
    }

    // 4. utils 함수들 분석 (⭐ 추가)
    try {
      const utilFiles = this.fileManager.listFiles('src/utils', ['*.ts']);

      if (utilFiles.length > 0) {
        analysis.push('**src/utils - 유틸 함수들**:\n');

        for (const utilFile of utilFiles) {
          try {
            const content = this.fileManager.read(utilFile);
            const lines = content.split('\n');

            // export function 추출
            const exportedFunctions = lines
              .filter(
                (line) =>
                  line.trim().startsWith('export function') ||
                  line.trim().startsWith('export const')
              )
              .slice(0, 5)
              .map((line) => `  ${line.trim()}`)
              .join('\n');

            if (exportedFunctions) {
              analysis.push(`- ${utilFile}:`);
              analysis.push('```typescript');
              analysis.push(exportedFunctions);
              analysis.push('```\n');
            }
          } catch {
            // 무시
          }
        }
      }
    } catch {
      analysis.push('**src/utils**: 없음\n');
    }

    // 5. types.ts 분석
    try {
      const typesContent = this.fileManager.read('src/types.ts');
      const hasRepeatType = typesContent.includes('RepeatType');
      const hasRepeatInfo = typesContent.includes('RepeatInfo');

      analysis.push('**src/types.ts - 타입 정의**:');
      analysis.push(`- RepeatType: ${hasRepeatType ? '✅ 이미 정의됨' : '❌ 정의 필요'}`);
      analysis.push(`- RepeatInfo: ${hasRepeatInfo ? '✅ 이미 정의됨' : '❌ 정의 필요'}`);

      if (hasRepeatInfo) {
        // RepeatInfo 구조 추출
        const repeatInfoMatch = typesContent.match(/export interface RepeatInfo \{[\s\S]*?\}/);
        if (repeatInfoMatch) {
          analysis.push('```typescript');
          analysis.push(repeatInfoMatch[0]);
          analysis.push('```');
        }
      }
      analysis.push('');
    } catch {
      analysis.push('**src/types.ts**: 파일을 읽을 수 없음\n');
    }

    // 6. 가이드라인
    analysis.push('### 🎯 테스트 작성 가이드라인\n');
    analysis.push('1. **기존 함수 시그니처 준수**:');
    analysis.push('   - 함수 호출 시 매개변수 타입/개수 정확히');
    analysis.push('   - 기존 테스트 파일의 API 사용 패턴 참고');
    analysis.push('');
    analysis.push('2. **기존 패턴 따르기**:');
    analysis.push('   - 기존에 `setTitle()`이 있으면 → `setRepeatType()` 형식');
    analysis.push('   - 기존에 `saveEvent()`가 있으면 → 확장하거나 새 함수');
    analysis.push('');
    analysis.push('3. **타입 일관성**:');
    analysis.push('   - src/types.ts의 타입 정의 사용');
    analysis.push('   - RepeatType, RepeatInfo 구조 준수');

    return analysis.join('\n');
  }

  /**
   * 현재 진행 중인 기능 추출
   */
  private extractCurrentFeature(spec: string): string {
    const lines = spec.split('\n');

    // "### 기능 N:" 패턴 찾기
    const featurePattern = /^### 기능 (\d+):/;
    const features: Array<{ number: number; startIndex: number; endIndex: number }> = [];

    lines.forEach((line, index) => {
      const match = line.match(featurePattern);
      if (match) {
        features.push({
          number: parseInt(match[1]),
          startIndex: index,
          endIndex: -1,
        });
      }
    });

    // 각 기능의 끝 인덱스 설정
    for (let i = 0; i < features.length; i++) {
      if (i + 1 < features.length) {
        features[i].endIndex = features[i + 1].startIndex;
      } else {
        features[i].endIndex = lines.length;
      }
    }

    if (features.length === 0) {
      return '(명세에 기능 번호가 없습니다. 전체 명세를 참고하여 테스트 작성)';
    }

    // 현재 기능 번호 읽기
    const currentFeatureNum = this.getCurrentFeatureNumber();
    const currentFeatureData = features.find((f) => f.number === currentFeatureNum);

    if (!currentFeatureData) {
      return `(기능 ${currentFeatureNum}을 찾을 수 없습니다)`;
    }

    const featureContent = lines
      .slice(currentFeatureData.startIndex, currentFeatureData.endIndex)
      .join('\n');

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${featureContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 위 기능에 대한 테스트만 작성합니다!
`;
  }

  /**
   * 현재 기능 번호 읽기
   */
  private getCurrentFeatureNumber(): number {
    try {
      const statusContent = this.fileManager.read('state/workflow-status.json');
      const status = JSON.parse(statusContent);
      return status.feature?.current_feature_number || 1;
    } catch {
      this.logWarning('workflow-status.json을 읽을 수 없습니다. 기본값 1 사용');
      return 1;
    }
  }

  /**
   * 기존 테스트 분석
   */
  private analyzeExistingTests(): {
    summary: string;
    missingCases: string[];
  } {
    const existingTestFiles = this.fileManager.glob('*.spec.ts', 'src/__tests__');

    if (existingTestFiles.length === 0) {
      return {
        summary: '### 기존 테스트 없음\n모든 테스트 케이스를 새로 작성하세요.',
        missingCases: [
          '✅ 반복 일정 생성 (매일/매주/매월/매년)',
          '✅ 31일 매월 반복 엣지 케이스',
          '✅ 윤년 2월 29일 매년 반복',
          '✅ 반복 종료 날짜 검증',
          '✅ 반복 일정 수정/삭제 (단일/전체)',
        ],
      };
    }

    const testCases: Set<string> = new Set();
    const files: string[] = [];

    // 기존 테스트 파일들의 케이스 추출
    for (const file of existingTestFiles) {
      try {
        const content = this.fileManager.read(file);
        files.push(file);

        // it('...') 패턴 추출
        const itMatches = content.matchAll(/it\(['"`](.+?)['"`]/g);
        for (const match of itMatches) {
          testCases.add(match[1]);
        }
      } catch {
        // 읽기 실패는 무시
      }
    }

    // 필수 케이스 정의
    const requiredCases = [
      '매일 반복 일정을 생성한다',
      '매주 반복 일정을 생성한다',
      '매월 반복 일정을 생성한다',
      '매년 반복 일정을 생성한다',
      '31일 매월 반복 시 31일이 없는 달은 건너뛴다',
      '윤년 29일 매년 반복 시 윤년에만 일정을 생성한다',
      '반복 종료 날짜 이후로는 일정을 생성하지 않는다',
      '반복 유형을 설정할 수 있다',
      '반복 종료 날짜를 설정할 수 있다',
      '반복 종료 날짜가 시작 날짜보다 이전이면 유효성 검사에 실패한다',
      '반복 일정을 단일 수정할 수 있다',
      '반복 일정을 전체 수정할 수 있다',
      '반복 일정을 단일 삭제할 수 있다',
      '반복 일정을 전체 삭제할 수 있다',
    ];

    const existingCasesList = Array.from(testCases);
    const missingCases = requiredCases.filter(
      (required) => !existingCasesList.some((existing) => existing.includes(required))
    );

    // Summary 생성
    let summary = '### 기존 테스트 파일\n';
    summary += files.map((f) => `- ${f}`).join('\n');
    summary += '\n\n### 이미 검증된 케이스 (' + testCases.size + '개)\n';
    summary += Array.from(testCases)
      .slice(0, 20) // 최대 20개만
      .map((tc) => `- ❌ "${tc}" (중복 금지)`)
      .join('\n');

    if (testCases.size > 20) {
      summary += `\n- ... 외 ${testCases.size - 20}개`;
    }

    return {
      summary,
      missingCases: missingCases.map((mc) => `- ✅ "${mc}"`),
    };
  }

  /**
   * AI 응답에서 테스트 파일 추출
   */
  private extractTestFiles(aiResponse: string): Record<string, string> {
    const files: Record<string, string> = {};

    // AI 응답에 마크다운 펜스가 있는지 사전 검증
    if (this.containsMarkdownFences(aiResponse)) {
      this.logWarning('⚠️ AI 응답에 마크다운 코드 펜스(```)가 포함되어 있습니다. 제거 중...');
    }

    // "=== FILE: path ===" 패턴으로 파일 분리
    const filePattern = /===\s*FILE:\s*(.+?)\s*===\s*\n([\s\S]+?)(?=\n===\s*FILE:|$)/g;
    let match;

    while ((match = filePattern.exec(aiResponse)) !== null) {
      const [, filePath, content] = match;
      const cleanPath = filePath.trim();
      let cleanContent = content.trim();

      // markdown 코드 펜스 제거
      cleanContent = this.removeMarkdownCodeFences(cleanContent);

      // 설명 텍스트 제거
      cleanContent = this.removeExplanationText(cleanContent);

      // 최종 검증
      if (this.containsMarkdownFences(cleanContent)) {
        this.logWarning(`⚠️ ${cleanPath}: 여전히 마크다운 펜스가 남아있습니다.`);
      }

      files[cleanPath] = cleanContent;
      this.logger.debug(`Extracted test file: ${cleanPath}`);
    }

    // 파일이 추출되지 않으면 전체를 단일 파일로 간주
    if (Object.keys(files).length === 0) {
      this.logWarning('No file markers found, treating as single file');
      let cleanResponse = this.removeMarkdownCodeFences(aiResponse);
      cleanResponse = this.removeExplanationText(cleanResponse);
      files['src/__tests__/unit/generated.spec.ts'] = cleanResponse;
    }

    return files;
  }

  /**
   * markdown 코드 펜스 제거 (강화)
   */
  private removeMarkdownCodeFences(content: string): string {
    // 1. 시작 코드 펜스 제거 (모든 언어)
    content = content.replace(/^```[a-zA-Z]*\s*\n/gm, '');

    // 2. 중간에 있는 코드 펜스 제거
    content = content.replace(/\n```[a-zA-Z]*\s*\n/g, '\n');

    // 3. 종료 코드 펜스 제거
    content = content.replace(/\n```\s*$/gm, '');
    content = content.replace(/^```\s*$/gm, '');

    // 4. 독립된 ``` 제거
    content = content.replace(/^```$/gm, '');

    return content.trim();
  }

  /**
   * 설명 텍스트 제거
   */
  private removeExplanationText(content: string): string {
    const lines = content.split('\n');
    const cleanedLines: string[] = [];
    let foundCodeStart = false;

    for (const line of lines) {
      // 첫 import 또는 describe가 나오면 코드 시작
      if (!foundCodeStart && (line.startsWith('import ') || line.startsWith('describe('))) {
        foundCodeStart = true;
      }

      // 코드가 시작된 후에는 모든 라인 포함
      if (foundCodeStart) {
        cleanedLines.push(line);
      } else {
        // 코드 시작 전에는 주석만 포함
        if (
          line.trim().startsWith('//') ||
          line.trim().startsWith('/*') ||
          line.trim().startsWith('*')
        ) {
          cleanedLines.push(line);
        }
      }
    }

    // 코드가 전혀 없으면 원본 반환
    if (cleanedLines.length === 0) {
      return content;
    }

    return cleanedLines.join('\n').trim();
  }

  /**
   * 마크다운 펜스 포함 여부 검증
   */
  private containsMarkdownFences(content: string): boolean {
    return /```[a-zA-Z]*/.test(content) || /```\s*$/.test(content);
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
