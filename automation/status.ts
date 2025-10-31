#!/usr/bin/env tsx
/**
 * 워크플로우 상태 확인 스크립트
 *
 * 실행: pnpm agent:status
 */

import chalk from 'chalk';

import { getOrchestrator } from './core/orchestrator.js';
import { getStatusTracker } from './utils/status-tracker.js';

/**
 * 상태 출력
 */
function printStatus() {
  console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                   워크플로우 상태                          ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝\n'));

  try {
    const statusTracker = getStatusTracker();
    const status = statusTracker.getStatus();
    const orchestrator = getOrchestrator();
    const orchStatus = orchestrator.getStatus();

    // 현재 Phase
    console.log(chalk.blue('📍 현재 단계:\n'));

    if (status.current_phase.name) {
      const statusIcon = status.current_phase.status === 'completed' ? '✅' : '⏳';
      console.log(chalk.white(`  ${statusIcon} ${status.current_phase.name}`));
      console.log(chalk.gray(`     상태: ${status.current_phase.status}`));
      console.log(chalk.gray(`     진행: ${orchStatus.progress}%\n`));
    } else {
      console.log(chalk.gray('  워크플로우가 시작되지 않았습니다.\n'));
    }

    // Phase 상태
    console.log(chalk.blue('📊 단계별 상태:\n'));

    const stages = ['SPEC', 'RED', 'GREEN', 'REFACTOR', 'COMMIT'] as const;

    for (const stage of stages) {
      const phase = status.phases[stage];
      let icon = '';
      let color = chalk.gray;

      switch (phase.status) {
        case 'completed':
          icon = '✅';
          color = chalk.green;
          break;
        case 'in_progress':
          icon = '⏳';
          color = chalk.yellow;
          break;
        case 'failed':
          icon = '❌';
          color = chalk.red;
          break;
        default:
          icon = '⏸️';
          color = chalk.gray;
      }

      console.log(color(`  ${icon} ${stage.padEnd(10)} ${phase.status}`));

      if (phase.duration_seconds !== null) {
        console.log(color(`     ${phase.duration_seconds}초 소요`));
      }
    }

    console.log('');

    // 테스트 상태
    console.log(chalk.blue('🧪 테스트 상태:\n'));

    const tests = status.test_status;
    console.log(chalk.white(`  Total:   ${tests.total_tests}`));
    console.log(chalk.green(`  Passing: ${tests.passing}`));
    console.log(chalk.red(`  Failing: ${tests.failing}`));
    console.log(chalk.yellow(`  Skipped: ${tests.skipped}\n`));

    // 품질 메트릭
    console.log(chalk.blue('📈 품질 메트릭:\n'));

    const coverage = status.quality_metrics.coverage;
    console.log(chalk.white('  Code Coverage:'));
    console.log(chalk.gray(`    Statements: ${coverage.statements}%`));
    console.log(chalk.gray(`    Branches:   ${coverage.branches}%`));
    console.log(chalk.gray(`    Functions:  ${coverage.functions}%`));
    console.log(chalk.gray(`    Lines:      ${coverage.lines}%\n`));

    const mutation = status.quality_metrics.mutation_score;
    console.log(chalk.white(`  Mutation Score: ${mutation.score}%\n`));

    // 에러/경고
    if (status.errors.length > 0) {
      console.log(chalk.red.bold(`⚠️  에러 (${status.errors.length}개):\n`));
      status.errors.slice(0, 3).forEach((error) => {
        console.log(chalk.red(`  - [${error.agent}] ${error.message}`));
      });
      if (status.errors.length > 3) {
        console.log(chalk.gray(`  ... 외 ${status.errors.length - 3}개\n`));
      }
      console.log('');
    }

    if (status.warnings.length > 0) {
      console.log(chalk.yellow.bold(`⚠️  경고 (${status.warnings.length}개):\n`));
      status.warnings.slice(0, 3).forEach((warning) => {
        console.log(chalk.yellow(`  - [${warning.agent}] ${warning.message}`));
      });
      if (status.warnings.length > 3) {
        console.log(chalk.gray(`  ... 외 ${status.warnings.length - 3}개\n`));
      }
      console.log('');
    }

    // 파일 경로
    console.log(chalk.blue('📁 상태 파일:\n'));
    console.log(chalk.gray(`  ${statusTracker.getFilePath()}\n`));

    console.log(chalk.gray('━'.repeat(60)) + '\n');
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.log(chalk.red.bold('\n❌ 상태 조회 실패\n'));
    console.log(chalk.red(errorObj.message));

    if (errorObj.message.includes('not found')) {
      console.log(chalk.yellow('\n💡 워크플로우를 먼저 실행하세요:'));
      console.log(chalk.white('   pnpm agent:run\n'));
    }

    process.exit(1);
  }
}

// 실행
printStatus();
