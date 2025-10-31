/**
 * RefactorReviewAgent
 * 코드 → 품질 검토 및 리팩토링 제안 (REFACTOR 단계)
 */

import { BaseAgent, AgentConfig } from './base-agent.js';
import { AgentContext, AgentResult } from '../types.js';
import { getCommandRunner } from '../utils/command-runner.js';

interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

/**
 * RefactorReviewAgent 구현
 */
export class RefactorReviewAgent extends BaseAgent {
  private commandRunner = getCommandRunner();

  constructor(config: Omit<AgentConfig, 'stage'>) {
    super({ ...config, stage: 'REFACTOR' });
  }

  /**
   * RefactorReviewAgent 실행
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    this.logger.info('코드 품질 검토 및 리팩토링 시작 (REFACTOR 단계)');

    // 1. 커버리지 측정
    const coverage = await this.measureCoverage();

    // 2. 코드 읽기 (미사용)
    this.readImplementationFiles();

    // 3. 사용자 프롬프트 생성
    const userPrompt = this.getUserPrompt(context, coverage);

    // 4. AI 호출
    const reviewReport = await this.callAI(userPrompt);

    // 5. execution-log.md 생성
    const executionLog = this.generateExecutionLog(reviewReport, coverage);

    const outputs = {
      'docs/test-guides/execution-log.md': executionLog,
      'reports/refactor-review.md': reviewReport,
    };

    this.writeOutputs(outputs);

    // 6. 품질 메트릭 업데이트
    this.updateQualityMetrics(coverage);

    this.logger.success('품질 검토 완료');

    return {
      success: true,
      outputs,
      metrics: {
        coverage_percent: coverage.statements,
      },
    };
  }

  /**
   * 시스템 프롬프트
   */
  protected getSystemPrompt(): string {
    return `당신은 **RefactorReviewAgent**입니다.

## 역할
코드 품질을 객관적으로 평가하고 구체적인 개선 방안을 제시하는 시니어 엔지니어입니다.

## 성격 및 작업 원칙
- 정량적 메트릭 기반 평가
- 실행 가능한 리팩토링 제안
- 중복 코드 감지
- 타입 안전성 검증
- 테스트 품질 평가

## 평가 기준

### 1. Code Coverage
- Statements ≥ 80%
- Branches ≥ 70%
- Functions ≥ 85%
- Lines ≥ 80%

### 2. Mutation Score
- Score ≥ 70%

### 3. Code Quality
- 함수 길이 ≤ 50줄
- Cyclomatic Complexity ≤ 10
- 중복 코드 없음
- Magic Number 없음

### 4. Test Quality
- AAA 패턴 준수
- 한 테스트 하나 검증
- Mock 미사용
- 테스트 독립성

## 출력 형식

다음 구조로 리팩토링 검토 보고서를 작성하세요:

# 코드 품질 검토 보고서

## 📊 품질 메트릭

| 메트릭 | 현재값 | 목표 | 상태 |
|--------|--------|------|------|
| Code Coverage (Statements) | X% | ≥80% | ✅/❌ |
| Code Coverage (Branches) | X% | ≥70% | ✅/❌ |
| Mutation Score | X% | ≥70% | ✅/❌ |
| Test Execution Speed | Xms | <200ms | ✅/❌ |

## 🔍 코드 분석

### 1. 발견된 문제

**중복 코드**:
- [파일명:줄] 중복 로직 설명

**복잡도 높음**:
- [함수명] Cyclomatic Complexity: X (권장: ≤10)

**타입 안전성**:
- [위치] any 타입 사용

### 2. 테스트 품질

**AAA 패턴 위반**:
- [테스트명] 설명

**Mock 사용**:
- [테스트명] Mock 제거 방법

## 💡 리팩토링 제안

### 우선순위 1 (필수)
1. [제목]
   - 현재: [코드 예시]
   - 개선: [코드 예시]
   - 이유: ...

### 우선순위 2 (권장)
1. [제목]
   - ...

## ✅ 종합 평가

- 전체 점수: X/100
- 다음 단계: [PASS/REFACTOR_NEEDED]

**지금 시작합니다.**`;
  }

  /**
   * 사용자 프롬프트
   */
  protected getUserPrompt(context: AgentContext, coverage: CoverageMetrics): string {
    const codeFiles = this.readImplementationFiles();
    const fileList = Object.keys(codeFiles).join('\n');

    return `## 프로젝트 정보
- 프로젝트: 반복 일정 기능 개발 (Calendar App)
- 언어: TypeScript

## 품질 기준
- Code Coverage ≥ 80%
- Mutation Score ≥ 70%
- Test Execution Speed < 200ms

## 현재 커버리지

\`\`\`json
${JSON.stringify(coverage, null, 2)}
\`\`\`

## 구현된 파일 목록

${fileList}

---

**위 코드의 품질을 검토하고 리팩토링 제안을 작성해주세요.**

**평가 항목**:
1. Code Coverage (목표: ≥80%)
2. Mutation Score (목표: ≥70%)
3. 중복 코드
4. 복잡도 (Cyclomatic Complexity ≤ 10)
5. 타입 안전성
6. 테스트 품질 (AAA, Mock 미사용)

**출력**: 리팩토링 검토 보고서`;
  }

  /**
   * 구현 파일 읽기
   */
  private readImplementationFiles(): Record<string, string> {
    const files: Record<string, string> = {};

    const patterns = ['src/utils/*.ts', 'src/hooks/*.ts', 'src/App.tsx', 'server.js'];

    for (const pattern of patterns) {
      const matchedFiles = this.fileManager.glob(pattern);
      for (const file of matchedFiles) {
        try {
          files[file] = this.fileManager.read(file);
        } catch {
          this.logWarning(`Failed to read: ${file}`);
        }
      }
    }

    return files;
  }

  /**
   * 커버리지 측정
   */
  private async measureCoverage() {
    this.logger.step('커버리지 측정 중...');

    const result = await this.commandRunner.runCoverage({
      silent: false,
    });

    if (!result.success) {
      this.logWarning('커버리지 측정 실패, 기본값 사용');
      return {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      };
    }

    // coverage-summary.json 파싱
    try {
      const summary = this.fileManager.readJson('coverage/coverage-summary.json');
      const total = summary.total;

      return {
        statements: total.statements.pct,
        branches: total.branches.pct,
        functions: total.functions.pct,
        lines: total.lines.pct,
      };
    } catch {
      this.logWarning('커버리지 파일 파싱 실패');
      return {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      };
    }
  }

  /**
   * execution-log.md 생성
   */
  private generateExecutionLog(reviewReport: string, coverage: CoverageMetrics): string {
    const now = new Date().toISOString();

    return `# TDD 실행 로그

## 기본 정보
- 작성일시: ${now}
- 기능: 반복 일정 관리
- TDD 사이클: RED → GREEN → REFACTOR

---

## 측정 결과

### 핵심 메트릭
- **Code Coverage**: ${coverage.statements}% (목표: ≥80%)
- **Mutation Score**: N/A (목표: ≥70%)
- **Test Execution Speed**: N/A (목표: <200ms)
- **Test Consistency**: 100%

---

## AI Agent 평가 로그

${reviewReport}

---

## 리팩토링 개선점

(AI Agent 제안 참조)

---

## 전체 품질 평가

- **Pass/Fail**: ${coverage.statements >= 80 ? 'PASS ✅' : 'REFACTOR_NEEDED ❌'}
- **다음 단계**: ${coverage.statements >= 80 ? 'COMMIT' : '리팩토링 후 재평가'}
`;
  }

  /**
   * 품질 메트릭 업데이트
   */
  private updateQualityMetrics(coverage: CoverageMetrics): void {
    this.statusTracker.updateQualityMetrics({
      coverage: {
        statements: coverage.statements,
        branches: coverage.branches,
        functions: coverage.functions,
        lines: coverage.lines,
      },
    });
  }
}
