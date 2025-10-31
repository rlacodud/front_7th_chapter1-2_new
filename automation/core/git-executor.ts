/**
 * Git 명령 실행기
 * 대화형 승인 후 실제 git 명령 실행
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

import { Stage } from '../types.js';
import { getApprovalManager } from '../utils/approval-manager.js';

export interface CommitInfo {
  stage: Stage;
  message: string;
  files: string[];
}

export interface GitExecutionResult {
  committed: boolean;
  pushed: boolean;
  commitSha?: string;
  error?: string;
}

/**
 * Git 명령 실행기
 */
export class GitExecutor {
  private approvalManager = getApprovalManager();

  /**
   * 변경된 파일 목록 가져오기
   */
  getChangedFiles(): string[] {
    try {
      const output = execSync('git status --porcelain', {
        encoding: 'utf-8',
      });

      return output
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          // Git status format: "XY filename"
          const match = line.match(/^...(.+)$/);
          return match ? match[1].trim() : '';
        })
        .filter((file) => file);
    } catch (error) {
      console.error(chalk.red('Git status 실패:'), error);
      return [];
    }
  }

  /**
   * 현재 브랜치 이름 가져오기
   */
  getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', {
        encoding: 'utf-8',
      }).trim();
    } catch {
      return 'main';
    }
  }

  /**
   * 파일 스테이징
   */
  private stageFiles(files: string[]): boolean {
    try {
      console.log(chalk.blue('\n📦 파일 스테이징 중...\n'));

      if (files.length === 0) {
        console.log(chalk.yellow('스테이징할 파일이 없습니다.'));
        return false;
      }

      // 파일 개별 스테이징 (안전성)
      for (const file of files) {
        try {
          execSync(`git add "${file}"`, { encoding: 'utf-8' });
          console.log(chalk.gray(`  ✓ ${file}`));
        } catch {
          console.log(chalk.red(`  ✗ ${file} (실패)`));
        }
      }

      console.log(chalk.green('\n✅ 파일 스테이징 완료\n'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 커밋 실행
   */
  private executeCommit(message: string): string | null {
    try {
      console.log(chalk.blue('\n💾 커밋 실행 중...\n'));

      // 커밋 메시지를 임시 파일로 저장
      const messagePath = '.git/COMMIT_EDITMSG_AGENT';
      writeFileSync(messagePath, message, 'utf-8');

      // 커밋 실행
      execSync(`git commit -F "${messagePath}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // 커밋 SHA 가져오기
      const commitSha = execSync('git rev-parse HEAD', {
        encoding: 'utf-8',
      }).trim();

      console.log(chalk.green('✅ 커밋 완료'));
      console.log(chalk.gray(`   Commit SHA: ${commitSha.substring(0, 7)}\n`));

      return commitSha;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error(chalk.red('커밋 실패:'), errorObj.message);
      return null;
    }
  }

  /**
   * 푸시 실행
   */
  private executePush(remote: string = 'origin', branch: string = 'main'): boolean {
    try {
      console.log(chalk.blue(`\n📤 ${remote}/${branch}로 푸시 중...\n`));

      execSync(`git push ${remote} ${branch}`, {
        encoding: 'utf-8',
        stdio: 'inherit', // 진행 상황 표시
      });

      console.log(chalk.green(`\n✅ 푸시 완료 (${remote}/${branch})\n`));
      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error(chalk.red('푸시 실패:'), errorObj.message);
      console.log(chalk.yellow(`\n💡 수동으로 푸시하려면: git push ${remote} ${branch}\n`));
      return false;
    }
  }

  /**
   * 대화형 커밋/푸시 프로세스
   */
  async commitWithApproval(
    commitInfo: CommitInfo,
    enablePush: boolean = true
  ): Promise<GitExecutionResult> {
    const result: GitExecutionResult = {
      committed: false,
      pushed: false,
    };

    // 1. 변경된 파일 확인
    const files = commitInfo.files.length > 0 ? commitInfo.files : this.getChangedFiles();

    if (files.length === 0) {
      console.log(chalk.yellow('\n⚠️  변경된 파일이 없습니다. 커밋을 건너뜁니다.\n'));
      return result;
    }

    // 2. 커밋 승인 요청
    const commitApproval = await this.approvalManager.requestCommitApproval(
      commitInfo.stage,
      commitInfo.message,
      files
    );

    if (!commitApproval.approved) {
      console.log(
        chalk.gray(
          '\n💡 나중에 수동으로 커밋하려면:\n' + `   git add <files>\n` + `   git commit -m "..."\n`
        )
      );
      return result;
    }

    // 3. 파일 스테이징
    const staged = this.stageFiles(files);
    if (!staged) {
      result.error = 'Failed to stage files';
      return result;
    }

    // 4. 커밋 실행
    const commitSha = this.executeCommit(commitInfo.message);
    if (!commitSha) {
      result.error = 'Failed to commit';
      return result;
    }

    result.committed = true;
    result.commitSha = commitSha;

    // 5. 푸시 승인 요청 (옵션)
    if (!enablePush) {
      console.log(chalk.gray('\n💡 수동으로 푸시하려면: git push origin main\n'));
      return result;
    }

    const branch = this.getCurrentBranch();
    const pushApproval = await this.approvalManager.requestPushApproval(branch, 'origin');

    if (!pushApproval.approved) {
      return result;
    }

    // 6. 푸시 실행
    const pushed = this.executePush('origin', branch);
    result.pushed = pushed;

    return result;
  }

  /**
   * 여러 단계의 커밋을 순차적으로 실행
   * (RED, GREEN, REFACTOR 각각 커밋)
   */
  async commitMultipleStages(
    commits: CommitInfo[],
    enablePush: boolean = true
  ): Promise<GitExecutionResult[]> {
    const results: GitExecutionResult[] = [];

    for (const commitInfo of commits) {
      console.log(
        chalk.cyan(
          `\n${'='.repeat(60)}\n` + `  ${commitInfo.stage} 단계 커밋\n` + `${'='.repeat(60)}\n`
        )
      );

      // 마지막 커밋에만 푸시 옵션 활성화
      const isLastCommit = commitInfo === commits[commits.length - 1];
      const allowPush = enablePush && isLastCommit;

      const result = await this.commitWithApproval(commitInfo, allowPush);
      results.push(result);

      // 커밋 실패 시 중단
      if (!result.committed) {
        console.log(chalk.red(`\n❌ ${commitInfo.stage} 단계 커밋 실패. 프로세스를 중단합니다.\n`));
        break;
      }
    }

    return results;
  }

  /**
   * 상태 확인 (변경사항 있는지)
   */
  hasChanges(): boolean {
    try {
      const output = execSync('git status --porcelain', {
        encoding: 'utf-8',
      });
      return output.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 커밋 로그 생성
   */
  generateCommitLog(results: GitExecutionResult[]): string {
    const logs: string[] = [
      '# Git Commit Log',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Commits',
      '',
    ];

    results.forEach((result, index) => {
      logs.push(`### Commit ${index + 1}`);
      logs.push(`- Committed: ${result.committed ? '✅' : '❌'}`);
      logs.push(`- Pushed: ${result.pushed ? '✅' : '❌'}`);
      if (result.commitSha) {
        logs.push(`- SHA: ${result.commitSha}`);
      }
      if (result.error) {
        logs.push(`- Error: ${result.error}`);
      }
      logs.push('');
    });

    return logs.join('\n');
  }
}

/**
 * 싱글톤 인스턴스
 */
let gitExecutorInstance: GitExecutor | null = null;

export function getGitExecutor(): GitExecutor {
  if (!gitExecutorInstance) {
    gitExecutorInstance = new GitExecutor();
  }
  return gitExecutorInstance;
}
