/**
 * SpecAgent
 * 요구사항 → 전체 스택 명세 생성
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { AgentContext, AgentResult } from '../types.js';

/**
 * SpecAgent 구현
 */
export class SpecAgent extends BaseAgent {
  constructor(config: Omit<AgentConfig, 'stage'>) {
    super({ ...config, stage: 'SPEC' });
  }

  /**
   * SpecAgent 실행
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info('요구사항 분석 및 명세 생성 시작');

    // 1. 현재 프로젝트 분석
    this.logger.info('현재 프로젝트 상태 분석 중...');
    const projectAnalysis = this.analyzeCurrentProject();

    // 2. 입력 파일 읽기 (미사용)
    this.readRequirements();
    this.readTestGuide();

    // 3. 사용자 프롬프트 생성
    const userPrompt = this.getUserPrompt(context, projectAnalysis);

    // 4. AI 호출
    const specContent = await this.callAI(userPrompt);

    // 5. 출력 파일 쓰기
    const outputs = {
      'docs/spec.md': specContent,
    };

    this.writeOutputs(outputs);

    this.logger.success('명세 생성 완료: docs/spec.md');

    return {
      success: true,
      outputs,
    };
  }

  /**
   * 시스템 프롬프트
   */
  protected getSystemPrompt(): string {
    return `당신은 **SpecAgent**입니다.

## 역할
요구사항을 분석하여 **전체 스택(UI/훅/API/유틸) 명세**를 작성하는 꼼꼼하고 체계적인 비즈니스 애널리스트입니다.

## 성격 및 작업 원칙
- 요구사항의 완전성 보장
- 테스트 가능한 형태로 명세 작성
- 엣지 케이스 사전 고려 (31일 매월, 윤년 29일)
- UI, 훅, API, 유틸 각각의 명세 작성

## 출력 형식
다음 구조로 명세를 작성하세요:

# 기능: [기능 이름]

## 1. 현재 상태 분석

### 1.1 기존 파일 현황
- **UI**: src/App.tsx
  - 현재 상태: [분석 내용]
  - 사용 중인 훅: [목록]
  - 주요 기능: [목록]

- **훅**: src/hooks/
  - useEventForm.ts: [현재 제공하는 기능]
  - useEventOperations.ts: [현재 제공하는 기능]
  - useCalendarView.ts: [현재 제공하는 기능]
  - 기타: [목록]

- **유틸**: src/utils/
  - dateUtils.ts: [현재 제공하는 함수]
  - eventUtils.ts: [현재 제공하는 함수]
  - 기타: [목록]

- **타입**: src/types.ts
  - Event 인터페이스: [현재 필드]
  - 기타 타입: [목록]

- **기존 테스트**: src/__tests__/
  - 유닛 테스트: [목록]
  - 훅 테스트: [목록]
  - 통합 테스트: [목록]

### 1.2 주석 처리된 코드 (재사용 가능)
⚠️ **중요**: 아래 코드는 이미 작성되어 있으므로, **주석 해제 + 미세 조정**으로 빠르게 구현 가능합니다!
- [주석 처리된 코드 목록]

### 1.3 현재 프로젝트의 강점
- ✅ [이미 잘 구현된 부분]
- ✅ [재사용 가능한 코드]

### 1.4 누락된 기능
- ❌ [아직 없는 기능]
- ❌ [추가 필요한 부분]

---

## 2. 요구사항 분석 및 해야할 일

### 2.1 새로운 기능 요구사항
- [기능 1]: [설명]
- [기능 2]: [설명]

### 2.2 필요한 작업 목록
- [ ] UI 수정: [구체적 작업]
- [ ] 훅 추가/수정: [구체적 작업]
- [ ] 유틸 함수 추가: [구체적 작업]
- [ ] 타입 정의 추가: [구체적 작업]
- [ ] API 엔드포인트 수정: [구체적 작업] (MSW 모킹)

### 2.3 예상 복잡도
- 난이도: [상/중/하]
- 예상 파일 수: [N개]
- 예상 테스트 케이스: [N개]
- 엣지 케이스 수: [N개]

---

## 3. 기능별 TDD 사이클 (⭐ 반드시 넘버링!)

⚠️ **중요**: 각 기능은 독립적인 TDD 사이클로 진행됩니다!
- **반드시** "### 기능 1:", "### 기능 2:" 형식으로 넘버링
- 각 기능마다: RED → GREEN → REFACTOR → COMMIT

---

## 3.1 TDD 진행 방식

### 📍 단계 1: 유틸 함수 구현 (최우선)
**왜 먼저?**: 순수 함수이므로 테스트가 가장 쉬움

**구현할 함수**:
1. [함수명]
   - 입력: [타입]
   - 출력: [타입]
   - 책임: [설명]
   - 엣지 케이스: [목록]

2. [함수명]
   - ...

**테스트 파일**: src/__tests__/unit/[파일명].spec.ts

---

### 📍 단계 2: 훅 구현
**의존성**: 단계 1 완료 후

**수정/추가할 훅**:
1. useEventForm.ts
   - 추가 상태: [목록]
   - 추가 함수: [목록]
   - 사용할 유틸: [단계 1에서 만든 함수]

2. useEventOperations.ts
   - ...

**테스트 파일**: src/__tests__/hooks/[파일명].spec.ts

---

### 📍 단계 3: UI 구현
**의존성**: 단계 1, 2 완료 후

**수정할 컴포넌트**:
- App.tsx
  - ⚠️ **주석 처리된 코드 확인**: 이미 구현되어 있다면 주석 해제 + 수정
  - 추가할 UI: [목록]
  - 사용할 MUI 컴포넌트: [목록]
  - 이벤트 핸들러: [목록]

**작업 전략**:
1. 먼저 주석 처리된 코드 확인
2. 재사용 가능하면 주석 해제 후 수정
3. 없거나 부족하면 새로 작성

**테스트 파일**: src/__tests__/[파일명].spec.tsx

---

### 📍 단계 4: 통합 테스트
**의존성**: 단계 1, 2, 3 완료 후

**통합 시나리오**:
1. [시나리오 1]: UI → 훅 → 유틸 연동
2. [시나리오 2]: ...

---

## 4. 기능별 상세 명세 (⭐ 넘버링 필수!)

---

### 기능 1: [기능명]

**📋 요구사항**: [설명]

**🎯 구현 범위**:
- 유틸: [함수명] (src/utils/XXX.ts)
- 훅: [함수명] (src/hooks/XXX.ts)
- UI: [컴포넌트] (src/App.tsx)

**🧪 테스트**:
- src/__tests__/unit/XXX.spec.ts
- src/__tests__/hooks/XXX.spec.ts

**🔍 엣지 케이스**:
- [케이스 1]
- [케이스 2]

**✅ TDD 사이클**:
1. RED: 위 테스트 작성 (실패 확인)
2. GREEN: 최소 구현 (테스트 통과)
3. REFACTOR: 코드 품질 개선
4. COMMIT: 커밋

---

### 기능 2: [기능명]

[동일한 형식으로 작성]

---

### 기능 3: [기능명]

[동일한 형식으로 작성]

---

## 5. 추가 명세 (참고용)

### 5.1 유틸 명세 (모든 함수 정리)
[기존 유틸 명세 내용]

### 4.2 훅 명세
[기존 훅 명세 내용]

### 4.3 UI 명세
[기존 UI 명세 내용]

### 4.4 API 명세 (MSW 모킹)
[기존 API 명세 내용]

---

## 5. 엣지 케이스
[기존 엣지 케이스 내용]

---

## 6. 데이터 모델
[기존 데이터 모델 내용]

---

## 7. 체크리스트

### 구현 전 확인사항
- [ ] 기존 코드와 충돌하지 않는가?
- [ ] 타입 정의가 명확한가?
- [ ] 엣지 케이스가 모두 식별되었는가?

### 구현 후 확인사항
- [ ] 모든 테스트가 통과하는가?
- [ ] Code Coverage ≥ 80%인가?
- [ ] Mutation Score ≥ 70%인가?
- [ ] Lint 오류가 없는가?

## 의사결정 기준
- IF 요구사항 모호 THEN 구체적 질문 생성
- IF 엣지 케이스 발견 THEN 명세에 추가
- IF 기존 기능과 충돌 THEN 충돌 사항 명시

## 말투
- "요구사항을 분석했습니다. X가지 기능과 Y가지 엣지 케이스를 식별했습니다."
- "명세 작성 완료. 총 Z개의 테스트 케이스가 예상됩니다."

**지금 시작합니다.**`;
  }

  /**
   * 사용자 프롬프트
   */
  protected getUserPrompt(context: AgentContext, projectAnalysis: string): string {
    const requirements = this.readRequirements();
    const testGuide = this.readTestGuide();

    return `## 프로젝트 정보
- 프로젝트: 반복 일정 기능 개발 (Calendar App)
- 언어: TypeScript
- 프레임워크: React 19, Express.js
- 테스트: Vitest ^3.2.4
- 패키지 매니저: pnpm
- 테스트 파일: *.spec.ts (*.spec.tsx for integration)

## 프로젝트 구조
- UI: src/App.tsx
- 훅: src/hooks/
- API: server.js (MSW로 모킹, 수정 금지)
- 유틸: src/utils/
- 타입: src/types.ts
- 테스트: src/__tests__/

## 품질 기준
- Code Coverage ≥ 80%
- Mutation Score ≥ 70%
- AAA 패턴 필수
- Mock 사용 금지

---

## 현재 프로젝트 분석 결과

${projectAnalysis}

⚠️ **위 분석을 참고하여 현재 상태를 정확히 파악하고, 추가/수정할 부분만 명세하세요.**

---

## 요구사항

${requirements}

---

## 테스트 가이드 (참고)

${testGuide.substring(0, 1500)}

---

**위 요구사항을 바탕으로 전체 스택 명세를 작성해주세요.**

**중요**:
1. **현재 상태 분석**: 위의 프로젝트 분석 결과를 요약
2. **주석 처리된 코드 활용**: 이미 작성된 코드가 있다면 "주석 해제 + 수정" 방식으로 명세
3. **해야할 일**: 구체적이고 실행 가능한 작업 목록
4. **순차적 단계**: 유틸 → 훅 → UI → 통합 테스트 순서로 명세
5. **의존성 명시**: 각 단계가 이전 단계를 어떻게 사용하는지
6. **엣지 케이스**: 31일 매월, 윤년 29일 필수 포함

**효율적인 구현 전략**:
- 기존 주석 코드가 있다면: "주석 해제 → 수정" (빠름)
- 기존 코드가 없다면: "새로 작성" (느림)
- 명세에 이를 명확히 구분하세요!`;
  }

  /**
   * 요구사항 읽기
   */
  private readRequirements(): string {
    try {
      return this.fileManager.read('docs/requirements.md');
    } catch {
      this.logWarning('requirements.md not found, using default');
      return '기능 요구사항이 제공되지 않았습니다.';
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
   * 현재 프로젝트 분석
   */
  private analyzeCurrentProject(): string {
    const analysis: string[] = [];

    analysis.push('### 📁 기존 파일 현황\n');

    // 1. UI 파일
    analysis.push('**UI 파일**:');
    try {
      const appContent = this.fileManager.read('src/App.tsx');
      const lineCount = appContent.split('\n').length;
      const hasEventForm = appContent.includes('useEventForm');
      const hasEventOperations = appContent.includes('useEventOperations');
      const hasCalendarView = appContent.includes('useCalendarView');

      // 주석 처리된 코드 분석
      const commentedCode = this.analyzeCommentedCode(appContent);

      analysis.push(`- src/App.tsx (${lineCount}줄)`);
      analysis.push(`  - useEventForm: ${hasEventForm ? '✅' : '❌'}`);
      analysis.push(`  - useEventOperations: ${hasEventOperations ? '✅' : '❌'}`);
      analysis.push(`  - useCalendarView: ${hasCalendarView ? '✅' : '❌'}`);

      if (commentedCode.length > 0) {
        analysis.push(`  - 🔍 주석 처리된 코드 발견:`);
        commentedCode.forEach((comment) => {
          analysis.push(`    - ${comment}`);
        });
      }
    } catch {
      analysis.push('- src/App.tsx (읽기 실패)');
    }

    // 2. 훅 파일
    analysis.push('\n**훅 파일**:');
    const hookFiles = this.fileManager.glob('*.ts', 'src/hooks');
    if (hookFiles.length > 0) {
      hookFiles.forEach((file) => {
        const fileName = file.split('/').pop();
        try {
          const content = this.fileManager.read(file);
          const lineCount = content.split('\n').length;
          const exports = this.extractExports(content);
          analysis.push(`- ${fileName} (${lineCount}줄)`);
          if (exports.length > 0) {
            analysis.push(`  - Exports: ${exports.join(', ')}`);
          }
        } catch {
          analysis.push(`- ${fileName} (읽기 실패)`);
        }
      });
    } else {
      analysis.push('- (훅 파일 없음)');
    }

    // 3. 유틸 파일
    analysis.push('\n**유틸 파일**:');
    const utilFiles = this.fileManager.glob('*.ts', 'src/utils');
    if (utilFiles.length > 0) {
      utilFiles.forEach((file) => {
        const fileName = file.split('/').pop();
        try {
          const content = this.fileManager.read(file);
          const lineCount = content.split('\n').length;
          const exports = this.extractExports(content);
          analysis.push(`- ${fileName} (${lineCount}줄)`);
          if (exports.length > 0) {
            analysis.push(`  - Functions: ${exports.join(', ')}`);
          }
        } catch {
          analysis.push(`- ${fileName} (읽기 실패)`);
        }
      });
    } else {
      analysis.push('- (유틸 파일 없음)');
    }

    // 4. 타입 파일
    analysis.push('\n**타입 정의**:');
    try {
      const typesContent = this.fileManager.read('src/types.ts');
      const interfaces = this.extractInterfaces(typesContent);
      analysis.push(`- src/types.ts`);
      if (interfaces.length > 0) {
        analysis.push(`  - 인터페이스: ${interfaces.join(', ')}`);
      }

      // RepeatType, RepeatInfo 확인
      const hasRepeatType = typesContent.includes('RepeatType');
      const hasRepeatInfo = typesContent.includes('RepeatInfo');
      analysis.push(`  - RepeatType: ${hasRepeatType ? '✅ 이미 정의됨' : '❌ 추가 필요'}`);
      analysis.push(`  - RepeatInfo: ${hasRepeatInfo ? '✅ 이미 정의됨' : '❌ 추가 필요'}`);
    } catch {
      analysis.push('- src/types.ts (읽기 실패)');
    }

    // 5. 기존 테스트 (⭐ 실제 내용 분석)
    analysis.push('\n**기존 테스트 (테스트 중인 API)**:');
    try {
      const testFiles = this.fileManager.listFiles('src/__tests__', [
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      if (testFiles.length > 0) {
        const unitTests = testFiles.filter((f) => f.includes('unit/'));
        const hookTests = testFiles.filter((f) => f.includes('hooks/'));
        const integrationTests = testFiles.filter(
          (f) => !f.includes('unit/') && !f.includes('hooks/')
        );

        analysis.push(`- 유닛 테스트: ${unitTests.length}개`);
        unitTests.slice(0, 5).forEach((f) => {
          analysis.push(`  - ${f.split('/').pop()}`);
        });

        analysis.push(`- 훅 테스트: ${hookTests.length}개`);
        hookTests.slice(0, 5).forEach((f) => {
          analysis.push(`  - ${f.split('/').pop()}`);
        });

        analysis.push(`- 통합 테스트: ${integrationTests.length}개`);

        // ⭐ 테스트 파일 내용 분석 (어떤 API를 테스트하는지)
        analysis.push('\n**기존 테스트가 검증하는 API (명세 작성 시 중복 방지)**:');
        const sampleTests = [...hookTests.slice(0, 2), ...unitTests.slice(0, 3)];

        for (const testFile of sampleTests) {
          try {
            const content = this.fileManager.read(testFile);
            const lines = content.split('\n');

            // describe, it 제목 추출하여 어떤 기능을 테스트하는지 파악
            const testDescriptions = lines
              .filter((line) => {
                const trimmed = line.trim();
                return trimmed.startsWith('describe(') || trimmed.startsWith('it(');
              })
              .slice(0, 6)
              .map((line) => `    ${line.trim()}`)
              .join('\n');

            if (testDescriptions) {
              analysis.push(`\n  ${testFile}:`);
              analysis.push(testDescriptions);
            }
          } catch {
            // 무시
          }
        }

        analysis.push(
          '\n⚠️ **명세 작성 시**: 위 테스트들과 중복되지 않도록 새로운 기능만 명세할 것!'
        );
      } else {
        analysis.push('- (기존 테스트 없음)');
      }
    } catch {
      analysis.push('- (테스트 디렉토리 접근 실패)');
    }

    // 6. 요약
    analysis.push('\n### 📊 현재 상태 요약\n');
    analysis.push(`- 훅: ${hookFiles.length}개`);
    analysis.push(`- 유틸: ${utilFiles.length}개`);
    analysis.push('- 테스트: 위 참조');

    return analysis.join('\n');
  }

  /**
   * export 문 추출
   */
  private extractExports(content: string): string[] {
    const exports: Set<string> = new Set();

    // export function 패턴
    const functionMatches = content.matchAll(/export\s+(?:const|function)\s+(\w+)/g);
    for (const match of functionMatches) {
      exports.add(match[1]);
    }

    return Array.from(exports).slice(0, 5); // 최대 5개
  }

  /**
   * interface 추출
   */
  private extractInterfaces(content: string): string[] {
    const interfaces: Set<string> = new Set();

    const interfaceMatches = content.matchAll(/(?:export\s+)?interface\s+(\w+)/g);
    for (const match of interfaceMatches) {
      interfaces.add(match[1]);
    }

    const typeMatches = content.matchAll(/(?:export\s+)?type\s+(\w+)/g);
    for (const match of typeMatches) {
      interfaces.add(match[1]);
    }

    return Array.from(interfaces);
  }

  /**
   * 주석 처리된 코드 분석 (App.tsx 전용)
   */
  private analyzeCommentedCode(appContent: string): string[] {
    const findings: string[] = [];
    const lines = appContent.split('\n');

    // 패턴 1: 반복 설정 관련 주석
    const repeatPatterns = [
      { regex: /\/\/.*(?:repeat|반복).*(?:select|설정)/i, desc: '반복 설정 Select UI' },
      { regex: /\/\/.*(?:repeat|반복).*(?:type|유형)/i, desc: '반복 유형 선택' },
      { regex: /\/\/.*(?:repeat|반복).*(?:end|종료|날짜)/i, desc: '반복 종료 날짜' },
      { regex: /\/\/.*(?:repeat|반복).*(?:icon|아이콘)/i, desc: '반복 아이콘 표시' },
      { regex: /\/\/.*(?:edit|수정).*(?:all|전체|단일)/i, desc: '반복 일정 수정 Dialog' },
      { regex: /\/\/.*(?:delete|삭제).*(?:all|전체|단일)/i, desc: '반복 일정 삭제 Dialog' },
    ];

    // 패턴 2: 주석 블록 (/* ... */) 분석
    const blockCommentRegex = /\/\*[\s\S]*?\*\//g;
    const blockComments = appContent.match(blockCommentRegex) || [];

    for (const block of blockComments) {
      if (block.toLowerCase().includes('repeat') || block.includes('반복')) {
        // 블록 내용 요약
        const firstLine = block
          .split('\n')[0]
          .replace(/\/\*|\*\//g, '')
          .trim();
        findings.push(`💡 주석 블록: ${firstLine.substring(0, 50)}...`);
      }
    }

    // 패턴 3: 주석 처리된 JSX (한 줄씩)
    let commentedJsxCount = 0;
    let inCommentBlock = false;
    let commentBlockContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 주석 블록 시작
      if (line.startsWith('/*') || line.startsWith('{/*')) {
        inCommentBlock = true;
        commentBlockContent = line;
        continue;
      }

      // 주석 블록 끝
      if (inCommentBlock) {
        commentBlockContent += ' ' + line;
        if (line.includes('*/') || line.includes('*/}')) {
          inCommentBlock = false;

          // 반복 관련 키워드 체크
          const lower = commentBlockContent.toLowerCase();
          if (lower.includes('repeat') || lower.includes('반복')) {
            const preview = commentBlockContent
              .replace(/\/\*|{\/\*|\*\/|\*\/}/g, '')
              .trim()
              .substring(0, 60);
            findings.push(`💡 주석 처리된 JSX: ${preview}...`);
          }
          commentBlockContent = '';
        }
        continue;
      }

      // 한 줄 주석 체크
      for (const pattern of repeatPatterns) {
        if (pattern.regex.test(line)) {
          findings.push(`✅ ${pattern.desc} (${i + 1}번째 줄)`);
          commentedJsxCount++;
          break;
        }
      }

      // // <Select ... 패턴 (주석 처리된 MUI 컴포넌트)
      if (line.startsWith('// <') || line.startsWith('//<')) {
        const componentMatch = line.match(/\/\/\s*<(\w+)/);
        if (componentMatch) {
          const componentName = componentMatch[1];
          if (['Select', 'TextField', 'Dialog', 'MenuItem'].includes(componentName)) {
            findings.push(`✅ 주석 처리된 <${componentName}> 컴포넌트 (${i + 1}번째 줄)`);
            commentedJsxCount++;
          }
        }
      }
    }

    if (commentedJsxCount > 5) {
      findings.push(`⚠️ 총 ${commentedJsxCount}개 이상의 주석 처리된 UI 코드 발견`);
    }

    return findings.slice(0, 10); // 최대 10개
  }
}
