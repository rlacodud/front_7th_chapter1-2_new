/**
 * 워크플로우 매니저
 * TDD 단계 관리 및 전환
 */

import { Stage, AgentName, WorkflowStatus } from '../types.js';
import { getStatusTracker } from '../utils/status-tracker.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('workflow-manager');

export interface StageTransition {
  from: Stage | null;
  to: Stage;
  condition: string;
}

export interface StageConfig {
  name: Stage;
  agents: AgentName[];
  entryCondition: string;
  exitCondition: string;
  timeoutMinutes: number;
}

/**
 * 워크플로우 매니저
 */
export class WorkflowManager {
  private statusTracker = getStatusTracker();
  private currentStage: Stage | null = null;

  /**
   * 워크플로우 단계 정의
   */
  private stages: StageConfig[] = [
    {
      name: 'SPEC',
      agents: ['spec_agent'],
      entryCondition: 'feature_request_received',
      exitCondition: 'spec_generated',
      timeoutMinutes: 30,
    },
    {
      name: 'RED',
      agents: ['test_agent'],
      entryCondition: 'spec_generated',
      exitCondition: 'tests_failing',
      timeoutMinutes: 30,
    },
    {
      name: 'GREEN',
      agents: ['code_agent'],
      entryCondition: 'tests_failing',
      exitCondition: 'all_tests_passing',
      timeoutMinutes: 60,
    },
    {
      name: 'REFACTOR',
      agents: ['refactor_agent'],
      entryCondition: 'all_tests_passing',
      exitCondition: 'quality_gates_met',
      timeoutMinutes: 30,
    },
    {
      name: 'COMMIT',
      agents: ['git_agent'],
      entryCondition: 'quality_gates_met',
      exitCondition: 'changes_committed',
      timeoutMinutes: 10,
    },
  ];

  /**
   * 워크플로우 시작
   */
  start(): void {
    logger.step('워크플로우 시작');
    this.currentStage = null;
  }

  /**
   * 다음 단계로 전환
   */
  async transition(currentStage: Stage | null): Promise<Stage | null> {
    const nextStage = this.getNextStage(currentStage);

    if (!nextStage) {
      logger.info('모든 단계 완료');
      return null;
    }

    logger.info(`단계 전환: ${currentStage || '시작'} → ${nextStage}`);
    this.currentStage = nextStage;

    // 상태 업데이트
    this.statusTracker.startPhase(nextStage);

    return nextStage;
  }

  /**
   * 다음 단계 결정
   */
  private getNextStage(currentStage: Stage | null): Stage | null {
    if (!currentStage) {
      return 'SPEC'; // 첫 단계
    }

    const currentIndex = this.stages.findIndex((s) => s.name === currentStage);

    if (currentIndex === -1 || currentIndex >= this.stages.length - 1) {
      return null; // 마지막 단계
    }

    return this.stages[currentIndex + 1].name;
  }

  /**
   * 단계 완료
   */
  completeStage(stage: Stage): void {
    logger.success(`단계 완료: ${stage}`);
    this.statusTracker.completePhase(stage);
  }

  /**
   * 단계 설정 가져오기
   */
  getStageConfig(stage: Stage): StageConfig | undefined {
    return this.stages.find((s) => s.name === stage);
  }

  /**
   * 현재 단계 가져오기
   */
  getCurrentStage(): Stage | null {
    return this.currentStage;
  }

  /**
   * 전체 단계 목록
   */
  getAllStages(): StageConfig[] {
    return this.stages;
  }

  /**
   * 진행률 계산
   */
  getProgress(): number {
    if (!this.currentStage) return 0;

    const currentIndex = this.stages.findIndex((s) => s.name === this.currentStage);

    if (currentIndex === -1) return 0;

    return Math.round(((currentIndex + 1) / this.stages.length) * 100);
  }

  /**
   * 워크플로우 상태 검증
   */
  validateTransition(from: Stage | null, to: Stage): boolean {
    // SPEC은 항상 시작 가능
    if (to === 'SPEC' && from === null) {
      return true;
    }

    // 순서대로만 진행
    const fromIndex = from ? this.stages.findIndex((s) => s.name === from) : -1;
    const toIndex = this.stages.findIndex((s) => s.name === to);

    return toIndex === fromIndex + 1;
  }

  /**
   * 워크플로우 리셋
   */
  reset(): void {
    logger.info('워크플로우 리셋');
    this.currentStage = null;
    this.statusTracker.reset();
  }
}

/**
 * 싱글톤 인스턴스
 */
let workflowManager: WorkflowManager | null = null;

/**
 * WorkflowManager 싱글톤 가져오기
 */
export function getWorkflowManager(): WorkflowManager {
  if (!workflowManager) {
    workflowManager = new WorkflowManager();
  }
  return workflowManager;
}
