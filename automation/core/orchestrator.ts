/**
 * 오케스트레이터
 * 전체 AI Agent TDD 워크플로우 조정
 */

import { Stage, AgentContext, AgentConfig as TypesAgentConfig } from '../types.js';
import { AgentConfig as BaseAgentConfig } from '../agents/base-agent.js';
import { SpecAgent } from '../agents/spec-agent.js';
import { TestAgent } from '../agents/test-agent.js';
import { CodeAgent } from '../agents/code-agent.js';
import { RefactorReviewAgent } from '../agents/refactor-agent.js';
import { GitAgent } from '../agents/git-agent.js';
import { getWorkflowManager } from './workflow-manager.js';
import { getConfigLoader } from '../utils/config-loader.js';
import { getStatusTracker } from '../utils/status-tracker.js';
import { createLogger } from '../utils/logger.js';
import { closeApprovalManager, getApprovalManager } from '../utils/approval-manager.js';

const logger = createLogger('orchestrator');

export interface OrchestratorOptions {
  startStage?: Stage;
  endStage?: Stage;
  skipStages?: Stage[];
  dryRun?: boolean;
  interactive?: boolean; // 대화형 모드 활성화
}

export interface OrchestratorResult {
  success: boolean;
  completedStages: Stage[];
  failedStage?: Stage;
  error?: string;
}

/**
 * 오케스트레이터
 */
export class Orchestrator {
  private workflowManager = getWorkflowManager();
  private configLoader = getConfigLoader();
  private statusTracker = getStatusTracker();
  private approvalManager = getApprovalManager();
  private agents: Map<string, any> = new Map();

  constructor() {
    this.initializeAgents();
  }

  /**
   * Agent 초기화
   */
  private initializeAgents(): void {
    logger.info('Agent 초기화 중...');

    const config = this.configLoader.load();

    // SpecAgent
    const specConfig = config.agents.spec_agent;
    this.agents.set(
      'spec_agent',
      new SpecAgent({
        name: 'spec_agent',
        provider: specConfig.provider as 'openai' | 'anthropic',
        model: specConfig.model,
        temperature: specConfig.config.temperature,
        max_tokens: specConfig.config.max_tokens,
      })
    );

    // TestAgent
    const testConfig = config.agents.test_agent;
    this.agents.set(
      'test_agent',
      new TestAgent({
        name: 'test_agent',
        provider: testConfig.provider as 'openai' | 'anthropic',
        model: testConfig.model,
        temperature: testConfig.config.temperature,
        max_tokens: testConfig.config.max_tokens,
      })
    );

    // CodeAgent
    const codeConfig = config.agents.code_agent;
    this.agents.set(
      'code_agent',
      new CodeAgent({
        name: 'code_agent',
        provider: codeConfig.provider as 'openai' | 'anthropic',
        model: codeConfig.model,
        temperature: codeConfig.config.temperature,
        max_tokens: codeConfig.config.max_tokens,
      })
    );

    // RefactorReviewAgent
    const refactorConfig = config.agents.refactor_agent;
    this.agents.set(
      'refactor_agent',
      new RefactorReviewAgent({
        name: 'refactor_agent',
        provider: refactorConfig.provider as 'openai' | 'anthropic',
        model: refactorConfig.model,
        temperature: refactorConfig.config.temperature,
        max_tokens: refactorConfig.config.max_tokens,
      })
    );

    // GitAgent
    const gitConfig = config.agents.git_agent;
    this.agents.set(
      'git_agent',
      new GitAgent({
        name: 'git_agent',
        provider: gitConfig.provider as 'openai' | 'anthropic',
        model: gitConfig.model,
        temperature: gitConfig.config.temperature,
        max_tokens: gitConfig.config.max_tokens,
      })
    );

    logger.success(`${this.agents.size}개 Agent 초기화 완료`);
  }

  /**
   * 워크플로우 실행
   */
  async run(options: OrchestratorOptions = {}): Promise<OrchestratorResult> {
    logger.divider();
    logger.step('AI Agent TDD 워크플로우 시작');
    logger.divider();

    const {
      startStage = 'SPEC',
      endStage = 'COMMIT',
      skipStages = [],
      dryRun = false,
      interactive = true, // 기본값: 대화형 모드 활성화
    } = options;

    const completedStages: Stage[] = [];
    let currentStage: Stage | null = null;

    try {
      // 워크플로우 시작
      this.workflowManager.start();

      // 시작 단계로 이동
      currentStage = await this.workflowManager.transition(null);

      while (currentStage) {
        // 종료 조건 확인
        if (this.shouldStop(currentStage, endStage, completedStages)) {
          logger.info(`종료 조건 만족: ${currentStage}`);
          break;
        }

        // 건너뛰기 확인
        if (skipStages.includes(currentStage)) {
          logger.info(`단계 건너뛰기: ${currentStage}`);
          currentStage = await this.workflowManager.transition(currentStage);
          continue;
        }

        // 대화형 모드: 단계 시작 전 승인 요청
        if (interactive && !dryRun) {
          const approval = await this.approvalManager.requestStageStart(currentStage);

          if (approval === 'ABORT') {
            logger.warn('사용자가 워크플로우를 중단했습니다.');
            return {
              success: false,
              completedStages,
              failedStage: currentStage,
              error: '사용자가 워크플로우를 중단했습니다.',
            };
          } else if (approval === 'SKIP') {
            logger.info(`사용자가 ${currentStage} 단계를 건너뛰었습니다.`);
            currentStage = await this.workflowManager.transition(currentStage);
            continue;
          }
          // approval === 'PROCEED' 이면 계속 진행
        }

        // 단계 실행
        const success = await this.executeStage(currentStage, dryRun);

        if (!success) {
          logger.error(`단계 실패: ${currentStage}`);
          return {
            success: false,
            completedStages,
            failedStage: currentStage,
            error: `${currentStage} 단계 실행 실패`,
          };
        }

        completedStages.push(currentStage);
        this.workflowManager.completeStage(currentStage);

        // 다음 단계로 전환
        currentStage = await this.workflowManager.transition(currentStage);
      }

      logger.divider();
      logger.success('워크플로우 완료');
      logger.divider();

      return {
        success: true,
        completedStages,
      };
    } catch (error: any) {
      logger.error('워크플로우 실행 중 오류 발생', error);

      return {
        success: false,
        completedStages,
        failedStage: currentStage || undefined,
        error: error.message,
      };
    } finally {
      // 리소스 정리
      closeApprovalManager();
    }
  }

  /**
   * 단계 실행
   */
  private async executeStage(stage: Stage, dryRun: boolean): Promise<boolean> {
    logger.newline();
    logger.divider();
    logger.step(`${stage} 단계 실행 시작`);
    logger.divider();

    if (dryRun) {
      logger.info('[DRY RUN] 실제 실행하지 않음');
      return true;
    }

    const stageConfig = this.workflowManager.getStageConfig(stage);
    if (!stageConfig) {
      logger.error(`단계 설정을 찾을 수 없습니다: ${stage}`);
      return false;
    }

    // 단계별 Agent 실행
    for (const agentName of stageConfig.agents) {
      const agent = this.agents.get(agentName);

      if (!agent) {
        logger.error(`Agent를 찾을 수 없습니다: ${agentName}`);
        return false;
      }

      // Agent 컨텍스트 생성
      const context: AgentContext = {
        stage,
        config: this.configLoader.getAgentConfig(agentName),
        inputs: {},
        workflow_status: this.statusTracker.getStatus(),
      };

      // Agent 실행
      const result = await agent.run(context);

      if (!result.success) {
        logger.error(`Agent 실행 실패: ${agentName}`);
        return false;
      }
    }

    logger.success(`${stage} 단계 완료`);
    return true;
  }

  /**
   * 종료 조건 확인
   */
  private shouldStop(currentStage: Stage, endStage: Stage, completedStages: Stage[]): boolean {
    // endStage 완료 시 종료
    if (completedStages.includes(endStage)) {
      return true;
    }

    // currentStage가 endStage보다 뒤면 종료
    const stages: Stage[] = ['SPEC', 'RED', 'GREEN', 'REFACTOR', 'COMMIT'];
    const currentIndex = stages.indexOf(currentStage);
    const endIndex = stages.indexOf(endStage);

    return currentIndex > endIndex;
  }

  /**
   * 상태 조회
   */
  getStatus() {
    return {
      currentStage: this.workflowManager.getCurrentStage(),
      progress: this.workflowManager.getProgress(),
      workflow: this.statusTracker.getStatus(),
    };
  }

  /**
   * 워크플로우 리셋
   */
  reset(): void {
    logger.info('워크플로우 리셋');
    this.workflowManager.reset();
  }
}

/**
 * 싱글톤 인스턴스
 */
let orchestrator: Orchestrator | null = null;

/**
 * Orchestrator 싱글톤 가져오기
 */
export function getOrchestrator(): Orchestrator {
  if (!orchestrator) {
    orchestrator = new Orchestrator();
  }
  return orchestrator;
}
