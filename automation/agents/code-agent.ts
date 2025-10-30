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

    // 5. 구현 파일 추출
    const outputs = this.extractImplementationFiles(implementationCode);

    // 5-1. 파일 검증
    if (!this.validateGeneratedFiles(outputs)) {
      this.logError('생성된 파일에 문제가 있습니다. 재시도가 필요합니다.');
      return {
        success: false,
        outputs: {},
        metrics: {
          implementation_files: 0,
          lint_passed: false,
          validation_failed: true,
        },
      };
    }

    // 5-2. 파일 저장
    this.writeOutputs(outputs);

    // 6. Lint 검사 실행
    const lintResult = await this.runLint();
    if (!lintResult.success) {
      this.logWarning('Lint 오류 발견됨:');
      this.logger.warn(lintResult.stderr.substring(0, 500));
    } else {
      this.logger.success('Lint 검사 통과');
    }

    // 7. 테스트 재실행 (통과 확인)
    const passingTests = await this.runTests();

    if (!passingTests.success) {
      this.logError('테스트가 여전히 실패합니다. 구현을 검토하세요.');
    } else {
      this.logger.success('모든 테스트 통과 (GREEN 단계 성공)');
    }

    // 8. 테스트 상태 업데이트
    this.updateTestStatus(passingTests.stdout);

    return {
      success: passingTests.success,
      outputs,
      metrics: {
        implementation_files: Object.keys(outputs).length,
        lint_passed: lintResult.success,
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
- 전체 스택 구현 (UI, 훅, 유틸)

## 구현 범위 및 우선순위 (⭐ 매우 중요!)

⚠️ **절대 규칙**: 
1. 한 번에 최대 2개 파일만 생성/수정
2. 순서를 절대 바꾸지 마세요!
3. 각 단계의 테스트가 100% 통과해야만 다음으로!

### 📍 우선순위 1: 유틸 함수 (src/utils/) ⭐⭐⭐
**지금 당장 구현해야 할 것**:
- repeatUtils.ts (새로 생성)
- dateUtils.ts (기존 파일에 함수 추가)

**왜 먼저?**:
- 순수 함수 = 테스트가 가장 쉬움
- 훅이 이 함수들을 사용함
- 의존성의 최하단

**목표**: src/__tests__/unit/*.spec.ts 모두 통과
**완성 조건**: 유틸 테스트 100% 통과

---

### 📍 우선순위 2: 훅 구현 (src/hooks/)
**⚠️ 조건**: 우선순위 1이 완료된 경우에만!

**구현할 것**:
- useEventForm.ts (state 추가)
- useEventOperations.ts (CRUD 함수 추가)

**사용할 것**:
- 우선순위 1에서 만든 유틸 함수

**목표**: src/__tests__/hooks/*.spec.ts 모두 통과

---

### 📍 우선순위 3: UI 구현 (src/App.tsx)
**⚠️ 조건**: 우선순위 1, 2가 완료된 경우에만!

**구현할 것**:
- 반복 유형 Select 추가
- 반복 아이콘 표시
- **기존 코드는 절대 수정 금지!**

**목표**: src/__tests__/**/*.spec.tsx 통합 테스트 통과

## ⚠️ 출력 형식 (매우 중요!)

### 파일 생성 규칙:
1. **한 번에 최대 2개 파일만** 생성/수정
2. **유틸 → 훅 → UI 순서**로 구현
3. **각 파일은 완전해야 함** (중괄호 누락 금지)
4. **Import 경로 정확히** (상대 경로 주의)

다음 형식을 **정확히** 따라주세요:

=== FILE: src/utils/repeatUtils.ts ===
import { Event } from '../types';

export function generateRecurringEvents(baseEvent: Event, endDate: string): Event[] {
  const events: Event[] = [];
  // 구현...
  return events;
}
// ⚠️ 파일 끝까지 완성할 것!

=== FILE: src/hooks/useEventForm.ts ===
import { useState } from 'react';
import { RepeatType } from '../types';

export const useEventForm = () => {
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [repeatEndDate, setRepeatEndDate] = useState('');
  
  return { 
    repeatType, 
    setRepeatType,
    repeatEndDate,
    setRepeatEndDate
  };
};
// ⚠️ 모든 중괄호 닫기!

## 🚨 절대 금지 사항

1. **마크다운 코드 펜스를 절대 사용하지 마세요!**
   ❌ 잘못된 예: \`\`\`typescript 또는 \`\`\`tsx 또는 \`\`\`
   ✅ 올바른 예: === FILE: 경로 === 바로 다음 줄에 순수 코드

2. **설명 텍스트를 코드 안에 넣지 마세요!**
   ❌ "이 구현은 테스트를 통과시키기 위한..."
   ✅ 순수한 TypeScript/TSX 코드만 작성

3. **각 파일은 반드시 === FILE: 경로 === 로 시작**

## 🚨 필수 준수 사항

1. **파일 개수**: 한 번에 최대 2개 파일만
2. **Type 참조**: src/types.ts의 타입 정확히 사용
3. **Import 경로**: 
   - src/__tests__/unit/에서 src/utils/ → '../../utils/파일명'
   - src/hooks/에서 src/types.ts → '../types'
4. **중괄호 균형**: 모든 {, (, [는 반드시 닫기
5. **기존 파일 수정 시 (⭐⭐ 매우 중요!)**:
   - ✅ **기존 동작 코드 절대 수정 금지**
   - ✅ 기존 import 유지
   - ✅ 기존 state 유지
   - ✅ 기존 함수 로직 유지
   - ✅ **새로운 것만 추가** (state, 함수, import)
   - ✅ **주석 처리된 코드 확인**: 있으면 주석 해제 + 수정
   - ❌ 기존 변수명 변경 금지
   - ❌ 기존 함수 수정 금지
   - ❌ 불필요한 리팩토링 금지
6. **server.js는 절대 수정 금지** (MSW 모킹 사용)

## 💡 효율적인 작업 방법

**App.tsx 수정 시**:

❌ 나쁜 예: 주석 처리된 코드 무시하고 새로 작성
  → <Select ...> // 처음부터 작성

✅ 좋은 예: 주석 처리된 코드 활용
  → 기존 주석: // <Select value={repeatType} onChange={...}>
  → 주석 해제: <Select value={repeatType} onChange={handleRepeatChange}>
  → 빠르고 정확!

**장점**:
- ✅ 빠른 구현 (복사-붙여넣기 vs 처음부터 작성)
- ✅ 기존 스타일 유지
- ✅ 오류 가능성 감소

## 주의사항
- 테스트를 통과시키는 **완전한 로직** 구현
- TypeScript 타입 정확히
- 파일 끝까지 완전히 작성
- **새 파일 생성 필수**: 기존 파일만 수정하지 말것!
- **spec.md 계획 준수**: 계획된 모든 파일 생성
- ⭐⭐ **함수 기능 완성**: 
  - 단순 return만 하지 마세요
  - 테스트가 요구하는 실제 로직 구현
  - 엣지 케이스 처리
  - 예: generateRepeatingEvents()면 실제 반복 일정 생성 로직 작성

## ⚠️ 흔한 실수 방지
❌ **하지 말 것**:
  - 기존 파일만 수정하고 끝내기
  - 새 파일 생성 주저하기
  - spec.md 계획 무시하기
  - **기존 동작하는 코드 수정하기** ⭐⭐⭐
  - 불필요한 리팩토링 (변수명 변경, 로직 정리 등)
  - 테스트가 요구하지 않는 기능 추가

✅ **반드시 할 것**:
  - spec.md의 모든 계획 파일 생성
  - 테스트가 요구하는 모든 함수 **완전히** 구현
  - **새 기능만 추가** (기존 코드 보존)
  - 예: repeatUtils.ts가 필요하면 반드시 생성
  - 예: useEventForm에 새 state만 추가, 기존은 유지
  - ⭐ **함수 로직 완성**: 
    - 단순 return [] 금지
    - 실제 비즈니스 로직 작성
    - 테스트 케이스 모두 처리
    - 엣지 케이스 구현 (31일 매월, 윤년 등)

**순수한 코드만 출력하세요. 지금 시작합니다.**`;
  }

  /**
   * 사용자 프롬프트
   */
  protected getUserPrompt(context: AgentContext, testErrors: string): string {
    const testFiles = this.readTestFiles();
    const testFilesList = Object.keys(testFiles).join('\n');
    const typesContent = this.readTypesFile();

    // ⭐ 실패한 테스트의 실제 코드 추출
    const failedTestsCode = this.extractFailedTestsCode(testFiles, testErrors);

    // ⭐⭐ spec.md의 구현 계획 읽기
    const implementationPlan = this.extractImplementationPlan();

    // ⭐⭐⭐ 현재 진행 중인 기능 추출
    const currentFeature = this.extractCurrentFeature();

    return `## 프로젝트 정보
- 프로젝트: 반복 일정 기능 개발 (Calendar App)
- 언어: TypeScript
- 프레임워크: React 19, Express.js
- 테스트: Vitest ^3.2.4

## ⭐⭐⭐ 현재 진행 중인 기능 (이것만 구현!)

${currentFeature}

⚠️ **중요**: 위 "현재 기능"에 대한 코드만 구현하세요!
   - 다른 기능은 나중에 별도 TDD 사이클에서 진행
   - 한 번에 하나의 기능만 집중
   - 테스트가 요구하는 것만 구현

## ⭐⭐ 1단계 명세서의 구현 계획 (spec.md)

${implementationPlan}

⚠️ **위 계획에 따라 파일을 생성/수정하세요!**
   - 새 파일이 필요하면 주저하지 말고 생성
   - 기존 파일 수정이 필요하면 수정
   - 계획된 모든 함수/훅/컴포넌트 구현

## Type 정의 (src/types.ts)

${typesContent}

⚠️ 위 타입을 정확히 사용하세요!

## 현재 실패하는 테스트 코드 (⭐ 중요!)

${failedTestsCode}

⚠️ **위 테스트 코드가 사용하는 정확한 API를 구현하세요!**
   예: setRepeatInfo()를 호출하면 → setRepeatInfo() 함수 구현
       repeatInfo.type을 참조하면 → repeatInfo 객체 반환

## 테스트 에러 메시지

${testErrors.substring(0, 1500)}

## 작성된 테스트 파일 목록

${testFilesList}

---

**위 테스트를 통과시키는 최소한의 구현 코드를 작성해주세요.**

⚠️ **필수 사항**:
1. spec.md의 계획대로 새 파일 생성 (예: src/utils/repeatUtils.ts)
2. 테스트가 요구하는 모든 함수 구현
3. **기존 파일만 수정하지 말고, 필요한 파일은 모두 생성**
4. ⭐⭐ **기존 동작 코드는 절대 수정 금지** (새 기능만 추가)
5. **예시**:
   - ✅ useEventForm에 setRepeatType 추가 (기존 setTitle 유지)
   - ❌ useEventForm의 기존 saveEvent 로직 수정
   - ✅ repeatUtils.ts 새로 생성
   - ❌ useEventOperations의 기존 deleteEvent 수정

**⭐⭐⭐ 구현 우선순위 (반드시 이 순서대로!)** ⭐⭐⭐:

### 1️⃣ 최우선: 유틸 함수 (src/utils/)
- **지금 당장 구현**: repeatUtils.ts, dateUtils.ts
- **이유**: 순수 함수라서 테스트가 가장 쉬움
- **목표**: src/__tests__/unit/*.spec.ts 모두 통과
- **절대적 규칙**: 유틸 테스트가 100% 통과할 때까지 다음 단계로 넘어가지 마세요!

### 2️⃣ 다음: 훅 구현 (src/hooks/)
- **조건**: 1단계 유틸이 모두 완성된 후에만 시작
- **구현**: useEventForm.ts, useEventOperations.ts 수정
- **목표**: src/__tests__/hooks/*.spec.ts 모두 통과
- **의존성**: 1단계에서 만든 유틸 함수 활용

### 3️⃣ 마지막: 통합 및 UI (src/App.tsx)
- **조건**: 1단계, 2단계 모두 완성된 후에만 시작
- **구현**: App.tsx에 반복 유형 UI 추가
- **목표**: src/__tests__/**/*.spec.tsx 통합 테스트 통과

⚠️ **중요**: 
- 한 번에 1-2개 파일만 구현
- 각 우선순위 단계의 테스트가 통과하지 않으면 절대 다음으로 넘어가지 마세요!
- 유틸 → 훅 → UI 순서 엄수!

**중요 규칙**:
- **한 번에 최대 2개 파일만** 생성/수정
- 테스트를 통과시키는 최소 코드만
- 하드코딩도 초기에는 OK
- 엣지 케이스 처리 (31일 매월, 윤년 29일)
- **src/types.ts의 타입 정확히 사용**
- **Import 경로 정확히** (../../로 상대 경로)
- **모든 중괄호 닫기** (파일 끝까지 완성)
- **server.js는 수정하지 말 것** (MSW 모킹 사용)`;
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
   * Type 파일 읽기
   */
  private readTypesFile(): string {
    try {
      const content = this.fileManager.read('src/types.ts');
      return content.substring(0, 1000); // 처음 1000자만 (토큰 절약)
    } catch (error) {
      this.logWarning('Failed to read src/types.ts');
      return '// Type 정보를 읽을 수 없습니다.';
    }
  }

  /**
   * 현재 진행 중인 기능 추출
   */
  private extractCurrentFeature(): string {
    try {
      const specContent = this.fileManager.read('docs/spec.md');
      const lines = specContent.split('\n');

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
        return '(명세에 기능 번호가 없습니다. 전체 명세를 참고하여 구현)';
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

⚠️ 위 기능에 대한 코드만 구현합니다!
`;
    } catch (error) {
      this.logWarning('spec.md를 읽을 수 없습니다. 테스트만 기준으로 구현합니다.');
      return '(spec.md 없음 - 테스트 코드 기준으로 구현)';
    }
  }

  /**
   * 현재 기능 번호 읽기
   */
  private getCurrentFeatureNumber(): number {
    try {
      const statusContent = this.fileManager.read('state/workflow-status.json');
      const status = JSON.parse(statusContent);
      return status.feature?.current_feature_number || 1;
    } catch (error) {
      this.logWarning('workflow-status.json을 읽을 수 없습니다. 기본값 1 사용');
      return 1;
    }
  }

  /**
   * spec.md에서 구현 계획 추출 (⭐⭐ 중요!)
   * CodeAgent가 어떤 파일/함수를 만들어야 하는지 명확히 알도록
   */
  private extractImplementationPlan(): string {
    try {
      const specContent = this.fileManager.read('docs/spec.md');
      const lines = specContent.split('\n');

      const plan: string[] = [];
      plan.push('### 📋 명세서가 계획한 구현 사항\n');

      // 1. "유틸 명세" 섹션 추출
      const utilSection = this.extractSection(lines, '## 유틸 명세', '##');
      if (utilSection) {
        plan.push('**📁 src/utils/ (새로 생성할 파일)**:');
        plan.push(utilSection.substring(0, 800));
        plan.push('');
      }

      // 2. "훅 명세" 섹션 추출
      const hookSection = this.extractSection(lines, '## 훅 명세', '##');
      if (hookSection) {
        plan.push('**🪝 src/hooks/ (수정할 파일)**:');
        plan.push(hookSection.substring(0, 800));
        plan.push('');
      }

      // 3. "UI 명세" 섹션 추출
      const uiSection = this.extractSection(lines, '## UI 명세', '##');
      if (uiSection) {
        plan.push('**🎨 src/App.tsx (수정할 부분)**:');
        plan.push(uiSection.substring(0, 600));
        plan.push('');
      }

      // 4. 구체적인 파일 목록
      plan.push('**✅ 생성/수정해야 할 파일 목록**:');
      plan.push('- 🆕 src/utils/repeatUtils.ts (새로 생성)');
      plan.push('- 📝 src/hooks/useEventForm.ts (수정 - 반복 설정 추가)');
      plan.push('- 📝 src/hooks/useEventOperations.ts (수정 - 반복 일정 CRUD)');
      plan.push('- 📝 src/App.tsx (수정 - 반복 UI 추가)');
      plan.push('');
      plan.push('⚠️ **중요**: 위 파일들을 모두 출력에 포함하세요!');

      return plan.join('\n');
    } catch (error) {
      this.logWarning('spec.md를 읽을 수 없습니다. 테스트만 기준으로 구현합니다.');
      return '(spec.md 없음 - 테스트 코드 기준으로 구현)';
    }
  }

  /**
   * 텍스트에서 특정 섹션 추출
   */
  private extractSection(lines: string[], startMarker: string, endMarker: string): string | null {
    const startIndex = lines.findIndex((line) => line.trim().startsWith(startMarker));
    if (startIndex === -1) return null;

    const endIndex = lines.findIndex(
      (line, idx) =>
        idx > startIndex && line.trim().startsWith(endMarker) && !line.includes(startMarker)
    );

    const sectionLines =
      endIndex === -1 ? lines.slice(startIndex + 1) : lines.slice(startIndex + 1, endIndex);

    return sectionLines.join('\n').trim();
  }

  /**
   * 실패한 테스트의 실제 코드 추출 (⭐ 중요!)
   * AI가 정확한 API를 알 수 있도록
   */
  private extractFailedTestsCode(testFiles: Record<string, string>, testErrors: string): string {
    const failedTests: string[] = [];

    // 1. 에러 메시지에서 실패한 테스트 파일 찾기
    const failedFilePattern = /src\/__tests__\/([^\s]+\.spec\.tsx?)/g;
    const failedFiles = new Set<string>();
    let match;

    while ((match = failedFilePattern.exec(testErrors)) !== null) {
      failedFiles.add(`src/__tests__/${match[1]}`);
    }

    // 2. 실패한 테스트 파일의 코드 포함 (최대 3개)
    const filesToShow = Array.from(failedFiles).slice(0, 3);

    for (const filePath of filesToShow) {
      if (testFiles[filePath]) {
        const content = testFiles[filePath];
        const lines = content.split('\n');

        // 파일이 너무 길면 일부만 (처음 50줄 또는 실패한 it 블록)
        const relevantLines = lines.slice(0, 80).join('\n');

        failedTests.push(`
=== ${filePath} ===

${relevantLines}

${lines.length > 80 ? '... (생략됨)\n' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
      }
    }

    if (failedTests.length === 0) {
      return '(실패한 테스트 코드를 찾을 수 없습니다. 에러 메시지를 참고하세요.)';
    }

    return failedTests.join('\n');
  }

  /**
   * AI 응답에서 구현 파일 추출
   */
  private extractImplementationFiles(aiResponse: string): Record<string, string> {
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

      // server.js는 제외 (프론트엔드 TDD는 MSW 사용)
      if (cleanPath.includes('server.js')) {
        this.logWarning(`Skipping server.js (API는 MSW로 모킹됨)`);
        continue;
      }

      let cleanContent = content.trim();

      // markdown 코드 펜스 제거
      cleanContent = this.removeMarkdownCodeFences(cleanContent);

      // 설명 텍스트 제거 (한글/영문)
      cleanContent = this.removeExplanationText(cleanContent);

      // 최종 검증
      if (this.containsMarkdownFences(cleanContent)) {
        this.logWarning(`⚠️ ${cleanPath}: 여전히 마크다운 펜스가 남아있습니다.`);
      }

      files[cleanPath] = cleanContent;
      this.logger.debug(`Extracted implementation file: ${cleanPath}`);
    }

    if (Object.keys(files).length === 0) {
      this.logWarning('No file markers found in AI response');
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
      // 첫 import 또는 export가 나오면 코드 시작
      if (!foundCodeStart && (line.startsWith('import ') || line.startsWith('export '))) {
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
   * 생성된 파일 검증
   */
  private validateGeneratedFiles(files: Record<string, string>): boolean {
    const fileCount = Object.keys(files).length;

    // 1. 파일 개수 체크 (최대 3개)
    if (fileCount > 3) {
      this.logWarning(`⚠️ 너무 많은 파일 생성됨: ${fileCount}개 (권장: 2개 이하)`);
    }

    let allValid = true;

    for (const [path, content] of Object.entries(files)) {
      this.logger.debug(`Validating: ${path}`);

      // 2. 중괄호 균형 체크
      if (!this.isBalancedBraces(content)) {
        this.logError(`❌ ${path}: 중괄호가 불균형입니다! ({ } 개수 확인)`);
        allValid = false;
      }

      // 3. 소괄호 균형 체크
      if (!this.isBalancedParentheses(content)) {
        this.logError(`❌ ${path}: 소괄호가 불균형합니다! ( ) 개수 확인)`);
        allValid = false;
      }

      // 4. Export 존재 체크 (.tsx, .ts 파일만)
      if ((path.endsWith('.ts') || path.endsWith('.tsx')) && !content.includes('export ')) {
        this.logWarning(`⚠️ ${path}: export 문이 없습니다.`);
      }

      // 5. Import 경로 체크
      if (!this.validateImportPaths(path, content)) {
        this.logWarning(`⚠️ ${path}: Import 경로가 의심스럽습니다.`);
      }

      // 6. 파일 길이 체크 (너무 짧으면 불완전)
      if (content.split('\n').length < 5) {
        this.logWarning(`⚠️ ${path}: 파일이 너무 짧습니다 (불완전할 수 있음).`);
      }
    }

    return allValid;
  }

  /**
   * 중괄호 균형 체크
   */
  private isBalancedBraces(content: string): boolean {
    let count = 0;
    for (const char of content) {
      if (char === '{') count++;
      if (char === '}') count--;
      if (count < 0) return false;
    }
    return count === 0;
  }

  /**
   * 소괄호 균형 체크
   */
  private isBalancedParentheses(content: string): boolean {
    let count = 0;
    for (const char of content) {
      if (char === '(') count++;
      if (char === ')') count--;
      if (count < 0) return false;
    }
    return count === 0;
  }

  /**
   * Import 경로 검증
   */
  private validateImportPaths(filePath: string, content: string): boolean {
    // src/__tests__/unit/에서 src/utils/ 참조 시 ../../utils/ 여야 함
    if (filePath.includes('__tests__/unit/')) {
      if (content.includes("from '../utils/") || content.includes('from "../utils/')) {
        this.logWarning(`Import 경로 오류: __tests__/unit/에서는 '../../utils/' 사용`);
        return false;
      }
    }

    // src/__tests__/hooks/에서 src/hooks/ 참조 시 ../../hooks/ 여야 함
    if (filePath.includes('__tests__/hooks/')) {
      if (content.includes("from '../hooks/") || content.includes('from "../hooks/')) {
        this.logWarning(`Import 경로 오류: __tests__/hooks/에서는 '../../hooks/' 사용`);
        return false;
      }
    }

    return true;
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
   * Lint 검사 실행
   */
  private async runLint() {
    this.logger.step('Lint 검사 중...');

    const result = await this.commandRunner.run('pnpm', ['lint']);

    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
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
