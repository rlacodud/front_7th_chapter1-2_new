#!/usr/bin/env tsx
/**
 * AI Agent TDD 워크플로우 실행 스크립트
 *
 * 실행: pnpm agent:run
 */

import 'dotenv/config';
import chalk from 'chalk';
import { getOrchestrator } from './core/orchestrator.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('main');

/**
 * 환경 변수 체크
 */
function checkEnvironment(): boolean {
  const required = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length === 0) {
    return true;
  }

  // 하나라도 있으면 OK
  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    logger.warn(`일부 API 키가 없습니다: ${missing.join(', ')}`);
    return true;
  }

  logger.error('API 키가 설정되지 않았습니다!');
  console.log(chalk.yellow('\n.env 파일에 다음 항목을 추가하세요:\n'));
  console.log(chalk.gray('OPENAI_API_KEY=sk-...'));
  console.log(chalk.gray('ANTHROPIC_API_KEY=sk-ant-...\n'));

  return false;
}

/**
 * 배너 출력
 */
function printBanner(): void {
  console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                                                            ║'));
  console.log(
    chalk.cyan('║') +
      chalk.bold.white('        🤖 AI Agent TDD Workflow System 🚀         ') +
      chalk.cyan('║')
  );
  console.log(chalk.cyan('║                                                            ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝\n'));
}

/**
 * 워크플로우 요약 출력
 */
function printWorkflowSummary(): void {
  console.log(chalk.blue('📋 워크플로우 단계:\n'));
  console.log(chalk.white('  1. SPEC      → 명세 생성 (SpecAgent)'));
  console.log(chalk.white('  2. RED       → 테스트 작성 (TestAgent)'));
  console.log(chalk.white('  3. GREEN     → 기능 구현 (CodeAgent)'));
  console.log(chalk.white('  4. REFACTOR  → 품질 검토 (RefactorReviewAgent)'));
  console.log(chalk.white('  5. COMMIT    → 버전 관리 (GitAgent)\n'));
  console.log(chalk.gray('━'.repeat(60)) + '\n');
}

/**
 * 메인 함수
 */
async function main() {
  printBanner();

  // 환경 변수 체크
  if (!checkEnvironment()) {
    process.exit(1);
  }

  printWorkflowSummary();

  try {
    // Orchestrator 가져오기
    const orchestrator = getOrchestrator();

    // 워크플로우 실행
    const result = await orchestrator.run({
      startStage: 'SPEC',
      endStage: 'COMMIT',
      skipStages: [],
      dryRun: false,
    });

    // 결과 출력
    console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║                    워크플로우 결과                         ║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝\n'));

    if (result.success) {
      console.log(chalk.green.bold('✅ 워크플로우 성공\n'));
      console.log(chalk.white(`완료된 단계: ${result.completedStages.join(' → ')}\n`));

      console.log(chalk.blue('📁 생성된 파일:\n'));
      console.log(chalk.gray('  - docs/spec.md'));
      console.log(chalk.gray('  - src/__tests__/**/*.spec.ts'));
      console.log(chalk.gray('  - src/utils/*.ts, src/hooks/*.ts, src/App.tsx, server.js'));
      console.log(chalk.gray('  - docs/test-guides/execution-log.md'));
      console.log(chalk.gray('  - state/commit-messages.json\n'));

      console.log(chalk.yellow('💡 다음 단계:\n'));
      console.log(chalk.white('  - 생성된 코드 검토'));
      console.log(chalk.white('  - 테스트 실행: pnpm test'));
      console.log(chalk.white('  - 커버리지 확인: pnpm test:coverage'));
      console.log(chalk.white('  - Git 상태 확인: git status\n'));
    } else {
      console.log(chalk.red.bold('❌ 워크플로우 실패\n'));
      console.log(chalk.white(`완료된 단계: ${result.completedStages.join(' → ')}`));
      console.log(chalk.red(`실패 단계: ${result.failedStage || 'Unknown'}`));
      console.log(chalk.red(`오류: ${result.error || 'Unknown error'}\n`));

      console.log(chalk.yellow('💡 문제 해결:\n'));
      console.log(chalk.white('  - 로그 확인: logs/'));
      console.log(chalk.white('  - 상태 확인: pnpm agent:status'));
      console.log(chalk.white('  - 재시도: pnpm agent:run\n'));

      process.exit(1);
    }
  } catch (error: any) {
    console.log(chalk.red.bold('\n❌ 오류 발생\n'));
    console.log(chalk.red(error.message));
    console.log(chalk.gray(error.stack));
    process.exit(1);
  }
}

// 실행
main();
