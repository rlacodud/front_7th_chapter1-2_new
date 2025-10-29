/**
 * 대화형 승인 매니저
 * Git 커밋/푸시 등 중요한 작업에 대한 사용자 승인을 처리
 */

import readline from 'readline';
import chalk from 'chalk';
import { Stage } from '../types.js';

export interface ApprovalRequest {
  stage: Stage;
  action: 'commit' | 'push';
  data: {
    commitMessage?: string;
    files?: string[];
    branch?: string;
    remote?: string;
  };
}

export interface ApprovalResult {
  approved: boolean;
  action: 'commit' | 'push' | 'skip';
  reason?: string;
}

/**
 * 대화형 승인 매니저
 */
export class ApprovalManager {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * 사용자에게 예/아니오 질문
   */
  private async askYesNo(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const normalized = answer.trim().toLowerCase();
        resolve(normalized === 'y' || normalized === 'yes');
      });
    });
  }

  /**
   * 커밋 승인 요청
   */
  async requestCommitApproval(
    stage: Stage,
    commitMessage: string,
    files: string[]
  ): Promise<ApprovalResult> {
    console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow.bold(`⏸️  ${stage} 단계 커밋 승인 요청`));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // 커밋 메시지 표시
    console.log(chalk.cyan('📝 생성된 커밋 메시지:\n'));
    console.log(chalk.white(this.formatCommitMessage(commitMessage)));

    // 변경된 파일 표시
    console.log(chalk.cyan('\n📁 변경된 파일:\n'));
    if (files.length === 0) {
      console.log(chalk.gray('  (변경된 파일 없음)'));
    } else {
      files.slice(0, 20).forEach((file) => {
        console.log(chalk.white(`  - ${file}`));
      });
      if (files.length > 20) {
        console.log(chalk.gray(`  ... 외 ${files.length - 20}개 파일`));
      }
    }

    console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // 승인 요청
    const approved = await this.askYesNo(
      chalk.bold.yellow('이 커밋을 실행하시겠습니까? (y/n): ')
    );

    if (!approved) {
      console.log(chalk.red('\n❌ 커밋이 취소되었습니다.\n'));
      return {
        approved: false,
        action: 'skip',
        reason: 'User declined commit',
      };
    }

    console.log(chalk.green('\n✅ 커밋이 승인되었습니다.\n'));
    return {
      approved: true,
      action: 'commit',
    };
  }

  /**
   * 푸시 승인 요청
   */
  async requestPushApproval(
    branch: string = 'main',
    remote: string = 'origin'
  ): Promise<ApprovalResult> {
    console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow.bold('⏸️  원격 저장소 푸시 승인 요청'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    console.log(chalk.cyan('📤 푸시 정보:\n'));
    console.log(chalk.white(`  Remote: ${remote}`));
    console.log(chalk.white(`  Branch: ${branch}`));

    console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    const approved = await this.askYesNo(
      chalk.bold.yellow(`${remote}/${branch}로 푸시하시겠습니까? (y/n): `)
    );

    if (!approved) {
      console.log(chalk.yellow('\n⏭️  푸시를 건너뛰었습니다.'));
      console.log(
        chalk.gray('   (수동으로 푸시하려면: git push origin main)\n')
      );
      return {
        approved: false,
        action: 'skip',
        reason: 'User declined push',
      };
    }

    console.log(chalk.green('\n✅ 푸시가 승인되었습니다.\n'));
    return {
      approved: true,
      action: 'push',
    };
  }

  /**
   * COMMIT 단계 전체 승인 프로세스
   */
  async requestStageApproval(request: ApprovalRequest): Promise<ApprovalResult> {
    if (request.action === 'commit') {
      return this.requestCommitApproval(
        request.stage,
        request.data.commitMessage || '',
        request.data.files || []
      );
    } else if (request.action === 'push') {
      return this.requestPushApproval(
        request.data.branch,
        request.data.remote
      );
    }

    return {
      approved: false,
      action: 'skip',
      reason: 'Unknown action',
    };
  }

  /**
   * 커밋 메시지 포맷팅 (박스 표시)
   */
  private formatCommitMessage(message: string): string {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map((l) => l.length), 60);
    const border = '─'.repeat(maxLength + 4);

    const formatted = [
      chalk.gray(`  ┌${border}┐`),
      ...lines.map((line) => {
        const padding = ' '.repeat(maxLength - line.length);
        return chalk.gray('  │  ') + chalk.white(line) + padding + chalk.gray('  │');
      }),
      chalk.gray(`  └${border}┘`),
    ];

    return formatted.join('\n');
  }

  /**
   * 리소스 정리
   */
  close(): void {
    this.rl.close();
  }
}

/**
 * 싱글톤 인스턴스
 */
let instance: ApprovalManager | null = null;

export function getApprovalManager(): ApprovalManager {
  if (!instance) {
    instance = new ApprovalManager();
  }
  return instance;
}

export function closeApprovalManager(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

