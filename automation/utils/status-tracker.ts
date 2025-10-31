/**
 * 상태 추적기
 * 워크플로우 상태 읽기/쓰기
 */

import { WorkflowStatus, Stage, AgentName } from '../types.js';
import { getFileManager } from './file-manager.js';
import { createLogger } from './logger.js';

const logger = createLogger('status-tracker');

/**
 * 상태 추적기
 */
export class StatusTracker {
  private filePath: string;
  private fileManager = getFileManager();
  private status: WorkflowStatus | null = null;

  constructor(filePath: string = 'state/workflow-status.json') {
    this.filePath = filePath;
  }

  /**
   * 상태 로드
   */
  load(): WorkflowStatus {
    if (this.status) {
      return this.status;
    }

    if (!this.fileManager.exists(this.filePath)) {
      logger.warn(`Status file not found: ${this.filePath}, creating new status`);
      this.status = this.createInitialStatus();
      this.save();
      return this.status;
    }

    try {
      this.status = this.fileManager.readJson<WorkflowStatus>(this.filePath);
      logger.info('Workflow status loaded');
      return this.status;
    } catch (error) {
      logger.error('Failed to load workflow status', error);
      throw error;
    }
  }

  /**
   * 초기 상태 생성
   */
  private createInitialStatus(): WorkflowStatus {
    const now = new Date().toISOString();

    return {
      workflow_id: `wf-${Date.now()}`,
      workflow_version: '1.0.0',
      created_at: now,
      updated_at: now,

      feature: {
        id: 'FEAT-001',
        name: 'Unknown Feature',
        description: '',
        type: 'feature',
        priority: 'medium',
        requirements_path: 'docs/requirements.md',
      },

      current_phase: {
        name: null,
        status: 'pending',
        started_at: null,
        progress_percent: 0,
        substep: null,
      },

      phases: {
        SPEC: this.createPhaseStatus('SPEC', 'spec_generation', 'spec_agent'),
        RED: this.createPhaseStatus('RED', 'test_generation', 'test_agent'),
        GREEN: this.createPhaseStatus('GREEN', 'implementation', 'code_agent'),
        REFACTOR: this.createPhaseStatus('REFACTOR', 'quality_review', 'refactor_agent'),
        COMMIT: this.createPhaseStatus('COMMIT', 'version_control', 'git_agent'),
      },

      agents: {
        orchestrator: this.createAgentStatus('orchestrator-001'),
        spec_agent: this.createAgentStatus('spec-gen-001'),
        test_agent: this.createAgentStatus('test-writer-001'),
        code_agent: this.createAgentStatus('code-impl-001'),
        refactor_agent: this.createAgentStatus('refactor-rev-001'),
        git_agent: this.createAgentStatus('git-agent-001'),
      },

      test_status: {
        total_tests: 0,
        passing: 0,
        failing: 0,
        skipped: 0,
        last_run: null,
      },

      quality_metrics: {
        coverage: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0,
          last_measured: null,
        },
        mutation_score: {
          score: 0,
          last_measured: null,
        },
      },

      git: {
        repository: '',
        branch: 'main',
        base_branch: 'main',
        commit_sha: '',
        author: '',
        commits_count: 0,
        files_changed: 0,
        lines_added: 0,
        lines_deleted: 0,
      },

      errors: [],
      warnings: [],
      notifications: [],

      logs: {
        execution_log: 'logs/execution-log.md',
        agent_logs: {},
        last_updated: now,
      },

      resources: {
        token_usage: {
          total: 0,
          by_agent: {},
          budget_limit: 100000,
          budget_remaining: 100000,
        },
        execution_time: {
          total_seconds: 0,
          by_phase: {},
        },
      },

      next_actions: [],

      metadata: {
        schema_version: '1.0.0',
        timezone: 'Asia/Seoul',
      },
    };
  }

  /**
   * Phase 상태 생성
   */
  private createPhaseStatus(
    stage: Stage,
    stepName: string,
    agent: AgentName
  ): WorkflowStatus['phases']['SPEC'] {
    return {
      status: 'pending',
      started_at: null,
      completed_at: null,
      duration_seconds: null,
      steps: {
        [stepName]: {
          status: 'pending',
          agent,
          started_at: null,
          completed_at: null,
          duration_seconds: null,
          attempts: 0,
          outputs: [],
        },
      },
      exit_criteria: {},
    };
  }

  /**
   * Agent 상태 생성
   */
  private createAgentStatus(agentId: string): WorkflowStatus['agents']['orchestrator'] {
    return {
      status: 'idle',
      agent_id: agentId,
      last_activity: null,
      health: 'healthy',
    };
  }

  /**
   * 상태 저장
   */
  save(): void {
    if (!this.status) {
      logger.warn('No status to save');
      return;
    }

    this.status.updated_at = new Date().toISOString();

    try {
      this.fileManager.writeJson(this.filePath, this.status, true);
      logger.debug('Workflow status saved');
    } catch (error) {
      logger.error('Failed to save workflow status', error);
      throw error;
    }
  }

  /**
   * 현재 Phase 시작
   */
  startPhase(stage: Stage): void {
    const status = this.load();
    const now = new Date().toISOString();

    status.current_phase = {
      name: stage,
      status: 'in_progress',
      started_at: now,
      progress_percent: 0,
      substep: null,
    };

    status.phases[stage].status = 'in_progress';
    status.phases[stage].started_at = now;

    this.save();
    logger.info(`Phase started: ${stage}`);
  }

  /**
   * 현재 Phase 완료
   */
  completePhase(stage: Stage): void {
    const status = this.load();
    const now = new Date().toISOString();

    const phase = status.phases[stage];
    phase.status = 'completed';
    phase.completed_at = now;

    if (phase.started_at) {
      const start = new Date(phase.started_at).getTime();
      const end = new Date(now).getTime();
      phase.duration_seconds = Math.round((end - start) / 1000);
    }

    status.current_phase.status = 'completed';
    status.current_phase.progress_percent = 100;

    this.save();
    logger.success(`Phase completed: ${stage}`);
  }

  /**
   * Agent 상태 업데이트
   */
  updateAgent(
    agentName: AgentName,
    updates: Partial<WorkflowStatus['agents']['orchestrator']>
  ): void {
    const status = this.load();

    status.agents[agentName] = {
      ...status.agents[agentName],
      ...updates,
      last_activity: new Date().toISOString(),
    };

    this.save();
  }

  /**
   * 에러 추가
   */
  addError(agent: AgentName, message: string, stage: Stage | null = null): void {
    const status = this.load();

    status.errors.push({
      id: `err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'error',
      agent,
      stage: stage || status.current_phase.name || 'SPEC',
      message,
      context: {},
    });

    this.save();
    logger.error(`Error logged: ${message}`);
  }

  /**
   * 경고 추가
   */
  addWarning(agent: AgentName, message: string, stage: Stage | null = null): void {
    const status = this.load();

    status.warnings.push({
      id: `warn-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'warning',
      agent,
      stage: stage || status.current_phase.name || 'SPEC',
      message,
      context: {},
    });

    this.save();
    logger.warn(`Warning logged: ${message}`);
  }

  /**
   * 테스트 상태 업데이트
   */
  updateTestStatus(updates: Partial<WorkflowStatus['test_status']>): void {
    const status = this.load();

    status.test_status = {
      ...status.test_status,
      ...updates,
      last_run: new Date().toISOString(),
    };

    this.save();
  }

  /**
   * 품질 메트릭 업데이트
   */
  updateQualityMetrics(updates: Partial<WorkflowStatus['quality_metrics']>): void {
    const status = this.load();
    const now = new Date().toISOString();

    if (updates.coverage) {
      status.quality_metrics.coverage = {
        ...status.quality_metrics.coverage,
        ...updates.coverage,
        last_measured: now,
      };
    }

    if (updates.mutation_score) {
      status.quality_metrics.mutation_score = {
        ...status.quality_metrics.mutation_score,
        ...updates.mutation_score,
        last_measured: now,
      };
    }

    this.save();
  }

  /**
   * 현재 상태 가져오기
   */
  getStatus(): WorkflowStatus {
    return this.load();
  }

  /**
   * 상태 리셋
   */
  reset(): void {
    this.status = this.createInitialStatus();
    this.save();
    logger.info('Workflow status reset');
  }

  /**
   * 파일 경로 가져오기
   */
  getFilePath(): string {
    return this.filePath;
  }
}

/**
 * 싱글톤 인스턴스
 */
let statusTracker: StatusTracker | null = null;

/**
 * StatusTracker 싱글톤 가져오기
 */
export function getStatusTracker(filePath?: string): StatusTracker {
  if (!statusTracker) {
    statusTracker = new StatusTracker(filePath);
  }
  return statusTracker;
}

