#!/usr/bin/env tsx
/**
 * 워크플로우 초기화 스크립트
 *
 * 실행: pnpm agent:reset
 */

import { existsSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

import chalk from 'chalk';

import { getOrchestrator } from './core/orchestrator.js';
import { getStatusTracker } from './utils/status-tracker.js';

/**
 * 사용자 확인
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(question + ' (y/n): '), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * 디렉토리의 파일 목록 가져오기
 */
function getFilesInDir(dir: string, pattern?: RegExp): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isFile()) {
      if (!pattern || pattern.test(entry)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * 파일 삭제
 */
function deleteFile(path: string): boolean {
  try {
    if (existsSync(path)) {
      unlinkSync(path);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 리셋 실행
 */
async function reset() {
  console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                 워크플로우 초기화                          ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('다음 항목들이 초기화됩니다:\n'));
  console.log(chalk.gray('  - 워크플로우 상태 (state/workflow-status.json)'));
  console.log(chalk.gray('  - 커밋 메시지 (state/commit-messages.json)'));
  console.log(chalk.gray('  - 로그 파일 (logs/*.log)'));
  console.log(chalk.gray('  - 생성된 명세 (docs/spec.md)'));
  console.log(chalk.gray('  - 실행 로그 (docs/test-guides/execution-log.md)\n'));

  console.log(chalk.red.bold('⚠️  주의: 이 작업은 되돌릴 수 없습니다!\n'));

  // 사용자 확인
  const confirmed = await askConfirmation('정말 초기화하시겠습니까?');

  if (!confirmed) {
    console.log(chalk.yellow('\n초기화가 취소되었습니다.\n'));
    process.exit(0);
  }

  console.log(chalk.blue('\n초기화 중...\n'));

  let deletedCount = 0;

  try {
    // 1. 워크플로우 상태 리셋
    const statusTracker = getStatusTracker();
    statusTracker.reset();
    console.log(chalk.green('✅ 워크플로우 상태 리셋'));

    // 2. Orchestrator 리셋
    const orchestrator = getOrchestrator();
    orchestrator.reset();
    console.log(chalk.green('✅ Orchestrator 리셋'));

    // 3. 커밋 메시지 삭제
    if (deleteFile('state/commit-messages.json')) {
      deletedCount++;
      console.log(chalk.green('✅ 커밋 메시지 삭제'));
    }

    // 4. 로그 파일 삭제
    const logFiles = getFilesInDir('logs', /\.log$/);
    for (const logFile of logFiles) {
      if (deleteFile(logFile)) {
        deletedCount++;
      }
    }
    if (logFiles.length > 0) {
      console.log(chalk.green(`✅ 로그 파일 삭제 (${logFiles.length}개)`));
    }

    // 5. 생성된 명세 삭제 (선택)
    const deleteSpec = await askConfirmation('\n생성된 명세(docs/spec.md)도 삭제하시겠습니까?');
    if (deleteSpec && deleteFile('docs/spec.md')) {
      deletedCount++;
      console.log(chalk.green('✅ 명세 파일 삭제'));
    }

    // 6. 실행 로그 삭제 (선택)
    const deleteExecLog = await askConfirmation(
      '실행 로그(docs/test-guides/execution-log.md)도 삭제하시겠습니까?'
    );
    if (deleteExecLog && deleteFile('docs/test-guides/execution-log.md')) {
      deletedCount++;
      console.log(chalk.green('✅ 실행 로그 삭제'));
    }

    console.log(chalk.green.bold('\n✅ 초기화 완료\n'));
    console.log(chalk.white(`총 ${deletedCount}개 파일 삭제\n`));

    console.log(chalk.blue('💡 다음 단계:\n'));
    console.log(chalk.white('  - 새로운 워크플로우 시작: pnpm agent:run'));
    console.log(chalk.white('  - 상태 확인: pnpm agent:status\n'));
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.log(chalk.red.bold('\n❌ 초기화 실패\n'));
    console.log(chalk.red(errorObj.message));
    process.exit(1);
  }
}

// 실행
reset();
