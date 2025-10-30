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
   * 사용자에게 선택지 제시
   */
  private async askChoice(question: string, choices: string[]): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const normalized = answer.trim().toUpperCase();
        if (choices.includes(normalized)) {
          resolve(normalized);
        } else {
          console.log(chalk.red(`\n❌ 잘못된 선택입니다. 다시 입력해주세요.\n`));
          this.askChoice(question, choices).then(resolve);
        }
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
    const approved = await this.askYesNo(chalk.bold.yellow('이 커밋을 실행하시겠습니까? (y/n): '));

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
      console.log(chalk.gray('   (수동으로 푸시하려면: git push origin main)\n'));
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
   * TDD 단계 시작 승인 요청
   */
  async requestStageStart(stage: Stage): Promise<'PROCEED' | 'SKIP' | 'ABORT'> {
    console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold(`║  🚀 ${stage} 단계 시작 승인 요청                        ║`));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝\n'));

    // 단계별 설명
    const stageInfo = this.getStageInfo(stage);

    console.log(chalk.bold.white('📋 진행 내용:\n'));
    stageInfo.description.forEach((line) => {
      console.log(chalk.white(`  • ${line}`));
    });

    console.log(chalk.bold.white('\n✅ 예상 결과:\n'));
    stageInfo.expectedResults.forEach((line) => {
      console.log(chalk.green(`  • ${line}`));
    });

    console.log(chalk.bold.white('\n⚠️  주의사항:\n'));
    stageInfo.warnings.forEach((line) => {
      console.log(chalk.yellow(`  • ${line}`));
    });

    console.log(chalk.bold.white('\n📁 수정될 가능성이 있는 파일:\n'));
    stageInfo.affectedFiles.forEach((file) => {
      console.log(chalk.gray(`  - ${file}`));
    });

    console.log(chalk.cyan('\n════════════════════════════════════════════════════════════\n'));
    console.log(chalk.bold.white('선택지:\n'));
    console.log(chalk.green('  P) Proceed  - 단계 진행'));
    console.log(chalk.yellow('  S) Skip     - 이 단계 건너뛰기'));
    console.log(chalk.red('  A) Abort    - 워크플로우 중단\n'));

    const choice = await this.askChoice(chalk.bold.cyan('선택해주세요 (P/S/A): '), ['P', 'S', 'A']);

    console.log(''); // 줄바꿈

    if (choice === 'P') {
      console.log(chalk.green(`✅ ${stage} 단계를 시작합니다...\n`));
      return 'PROCEED';
    } else if (choice === 'S') {
      console.log(chalk.yellow(`⏭️  ${stage} 단계를 건너뜁니다.\n`));
      return 'SKIP';
    } else {
      console.log(chalk.red(`❌ 워크플로우를 중단합니다.\n`));
      return 'ABORT';
    }
  }

  /**
   * 단계별 정보 반환
   */
  private getStageInfo(stage: Stage): {
    description: string[];
    expectedResults: string[];
    warnings: string[];
    affectedFiles: string[];
  } {
    const info: Record<Stage, any> = {
      SPEC: {
        description: [
          'SpecAgent가 요구사항을 분석하고 기능 명세를 작성합니다',
          'UI, 훅, 유틸 함수에 대한 상세 명세를 생성합니다',
          '엣지 케이스와 테스트 시나리오를 정의합니다',
        ],
        expectedResults: [
          'docs/spec.md 파일 생성',
          '반복 일정 기능에 대한 상세 명세',
          '테스트 시나리오 및 엣지 케이스 정의',
        ],
        warnings: ['기존 파일은 수정되지 않습니다', 'AI가 생성한 명세는 검토가 필요할 수 있습니다'],
        affectedFiles: ['docs/spec.md (새로 생성)', 'state/test-scope.json (새로 생성)'],
      },
      RED: {
        description: [
          'TestAgent가 명세를 기반으로 실패하는 테스트를 작성합니다',
          '유닛, 훅, 통합 테스트를 생성합니다',
          'AAA 패턴을 준수하며 BMAD 원칙을 따릅니다',
        ],
        expectedResults: [
          'src/__tests__/ 하위에 테스트 파일 생성',
          '모든 테스트가 실패 (RED 상태)',
          '테스트 커버리지 목표 설정',
        ],
        warnings: [
          '기존 테스트 파일이 있다면 덮어쓰지 않습니다',
          'AI가 불필요한 테스트를 생성할 수 있습니다',
        ],
        affectedFiles: [
          'src/__tests__/unit/*.spec.ts (새로 생성)',
          'src/__tests__/hooks/*.spec.ts (새로 생성)',
        ],
      },
      GREEN: {
        description: [
          'CodeAgent가 실패하는 테스트를 통과시키는 최소 코드를 작성합니다',
          'UI, 훅, 유틸 함수를 구현합니다',
          'server.js는 수정하지 않습니다 (MSW 모킹 사용)',
        ],
        expectedResults: [
          '모든 테스트 통과 (GREEN 상태)',
          'src/ 하위에 구현 파일 생성/수정',
          'Lint 검사 통과',
        ],
        warnings: [
          'App.tsx, useEventForm.ts 등 기존 파일이 수정될 수 있습니다',
          'AI가 코드 일부를 손상시킬 수 있습니다 (마크다운 펜스 등)',
          'server.js는 절대 수정되지 않습니다',
        ],
        affectedFiles: [
          'src/App.tsx (수정 가능)',
          'src/hooks/useEventForm.ts (수정 가능)',
          'src/hooks/useEventOperations.ts (수정 가능)',
          'src/utils/repeatUtils.ts (새로 생성)',
          'src/utils/dateUtils.ts (수정 가능)',
        ],
      },
      REFACTOR: {
        description: [
          'RefactorReviewAgent가 코드 품질을 검토합니다',
          '테스트 커버리지, Mutation Score 등을 측정합니다',
          '리팩토링 제안 사항을 제공합니다',
        ],
        expectedResults: [
          'docs/test-guides/execution-log.md 업데이트',
          'reports/refactor-suggestions.json 생성',
          '품질 메트릭 측정 결과',
        ],
        warnings: [
          '기존 코드는 수정되지 않습니다 (검토만)',
          '커버리지 측정에 시간이 소요될 수 있습니다',
        ],
        affectedFiles: [
          'docs/test-guides/execution-log.md (업데이트)',
          'reports/refactor-suggestions.json (새로 생성)',
          'coverage/ (새로 생성)',
        ],
      },
      COMMIT: {
        description: [
          'GitAgent가 Conventional Commits 형식의 커밋 메시지를 생성합니다',
          'RED, GREEN, REFACTOR 각 단계별 커밋 메시지를 제공합니다',
          '실제 커밋/푸시는 대화형 승인 후 실행됩니다',
        ],
        expectedResults: [
          'state/commit-messages.json 생성',
          '3개의 커밋 메시지 (test, feat, refactor)',
          '각 커밋에 대한 승인 요청',
        ],
        warnings: ['커밋은 사용자 승인 후 실행됩니다', '푸시도 별도 승인이 필요합니다'],
        affectedFiles: ['state/commit-messages.json (새로 생성)', '.git/ (커밋 시)'],
      },
    };

    return (
      info[stage] || {
        description: [`${stage} 단계 실행`],
        expectedResults: ['단계 완료'],
        warnings: ['정보 없음'],
        affectedFiles: ['(정보 없음)'],
      }
    );
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
      return this.requestPushApproval(request.data.branch, request.data.remote);
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
