/**
 * AI Agent 자동화 시스템 타입 정의
 * @module automation/types
 */

// ==================== Enums & Literal Types ====================

/**
 * TDD 워크플로우 단계
 */
export type Stage = 'SPEC' | 'RED' | 'GREEN' | 'REFACTOR' | 'COMMIT';

/**
 * Agent 이름
 */
export type AgentName =
  | 'orchestrator'
  | 'spec_agent'
  | 'test_agent'
  | 'code_agent'
  | 'refactor_agent'
  | 'git_agent';

/**
 * AI 제공자
 */
export type AIProvider = 'openai' | 'anthropic';

/**
 * 작업 상태
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Agent 건강 상태
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

// ==================== Configuration Types ====================

/**
 * AI 모델 설정
 */
export interface ModelConfig {
  temperature: number;
  max_tokens: number;
  timeout_seconds?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * 입력 파일 정의
 */
export interface InputFile {
  path: string;
  required: boolean;
  format: 'markdown' | 'json' | 'typescript' | 'yaml';
  description?: string;
}

/**
 * 출력 파일 정의
 */
export interface OutputFile {
  path: string;
  format: 'markdown' | 'json' | 'typescript';
  description?: string;
  validation?: {
    schema?: string;
    required_sections?: string[];
  };
}

/**
 * Agent 설정
 */
export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  provider: AIProvider;
  model: string;
  config: ModelConfig;
  capabilities: string[];
  description: string;
  persona_reference?: string;
  inputs?: InputFile[];
  outputs?: OutputFile[];
  retry_policy?: {
    max_attempts: number;
    backoff_multiplier: number;
    initial_delay_seconds: number;
  };
}

/**
 * 워크플로우 단계 정의
 */
export interface PhaseDefinition {
  agents: AgentName[];
  entry_condition: string;
  exit_condition: string;
  timeout_minutes: number;
  steps?: Array<{
    name: string;
    agent?: AgentName;
    command?: string;
    required: boolean;
  }>;
}

/**
 * 전체 Agent 설정
 */
export interface AgentConfig {
  version: string;
  metadata: {
    project: string;
    description: string;
    repository: string;
    created: string;
  };
  environment: {
    language: string;
    runtime: string;
    test_framework: 'Vitest' | 'Jest';
    test_version: string;
    package_manager: 'pnpm' | 'npm' | 'yarn';
    working_directory: string;
    test_pattern: string;
  };
  agents: Record<AgentName, AgentDefinition>;
  workflow: {
    phases: Record<Stage, PhaseDefinition>;
    transitions: {
      auto_advance: boolean;
      manual_gates?: Stage[];
      rollback_on_failure: boolean;
    };
  };
  error_handling: {
    retry_strategy: string;
    max_retries: number;
    alert_on_failure: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    files: {
      execution: string;
      orchestrator: string;
      agents: string;
    };
  };
}

// ==================== Workflow Status Types ====================

/**
 * 기능 정보
 */
export interface FeatureInfo {
  id: string;
  name: string;
  description: string;
  type: 'feature' | 'bugfix' | 'refactor';
  priority: 'high' | 'medium' | 'low';
  requirements_path: string;
}

/**
 * 현재 단계 정보
 */
export interface CurrentPhase {
  name: Stage | null;
  status: TaskStatus;
  started_at: string | null;
  progress_percent: number;
  substep?: string;
  expected_completion?: string;
}

/**
 * 단계별 작업 정보
 */
export interface StepInfo {
  status: TaskStatus;
  agent: AgentName;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  attempts: number;
  outputs: string[];
  current_action?: string;
  error?: string;
}

/**
 * 단계 상태
 */
export interface PhaseStatus {
  status: TaskStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  steps: Record<string, StepInfo>;
  exit_criteria: Record<string, boolean>;
}

/**
 * Agent 상태
 */
export interface AgentStatus {
  status: 'idle' | 'active' | 'completed' | 'error';
  agent_id: string;
  last_activity: string | null;
  tasks_completed: number;
  tasks_pending: number;
  health: HealthStatus;
  execution_time_seconds?: number;
  token_usage?: number;
  current_task?: string;
}

/**
 * 테스트 상태
 */
export interface TestStatus {
  total_tests: number;
  passing: number;
  failing: number;
  skipped: number;
  last_run: string | null;
  test_files: string[];
}

/**
 * 커버리지 정보
 */
export interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  last_measured: string | null;
}

/**
 * 변이 테스트 정보
 */
export interface MutationMetrics {
  score: number;
  mutants_killed: number;
  mutants_survived: number;
  mutants_timeout: number;
  mutants_total: number;
  last_measured: string | null;
}

/**
 * 품질 메트릭
 */
export interface QualityMetrics {
  coverage: CoverageMetrics;
  mutation_score: MutationMetrics;
  code_quality?: {
    maintainability_rating: string | null;
    technical_debt_minutes: number;
    code_smells: number;
    duplications_percent: number;
    last_measured: string | null;
  };
  performance?: {
    test_execution_time_ms: number;
    avg_test_time_ms: number;
    slowest_test_ms: number;
    last_measured: string | null;
  };
}

/**
 * Git 정보
 */
export interface GitInfo {
  repository: string;
  branch: string;
  base_branch: string;
  commit_sha: string;
  author: string;
  commits_count: number;
  files_changed: number;
  lines_added: number;
  lines_deleted: number;
}

/**
 * 에러 정보
 */
export interface ErrorInfo {
  id: string;
  timestamp: string;
  level: 'error' | 'warning';
  agent: AgentName;
  stage: Stage;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

/**
 * 알림 정보
 */
export interface NotificationInfo {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  agent: AgentName;
}

/**
 * 리소스 사용량
 */
export interface ResourceUsage {
  token_usage: {
    total: number;
    by_agent: Record<AgentName, number>;
    budget_limit?: number;
    budget_remaining?: number;
  };
  execution_time: {
    total_seconds: number;
    by_phase: Record<Stage, number>;
  };
}

/**
 * 다음 액션
 */
export interface NextAction {
  action: string;
  agent: AgentName;
  priority: 'high' | 'medium' | 'low';
  estimated_time_seconds: number;
  depends_on?: string[];
}

/**
 * 워크플로우 상태 (전체)
 */
export interface WorkflowStatus {
  workflow_id: string;
  workflow_version: string;
  created_at: string;
  updated_at: string;

  feature: FeatureInfo;
  current_phase: CurrentPhase;

  phases: Record<Stage, PhaseStatus>;
  agents: Record<AgentName, AgentStatus>;

  test_status: TestStatus;
  quality_metrics: QualityMetrics;
  git: GitInfo;

  errors: ErrorInfo[];
  warnings: ErrorInfo[];
  notifications: NotificationInfo[];

  logs: {
    execution_log: string;
    agent_logs: Record<string, string>;
    last_updated: string;
  };

  resources: ResourceUsage;
  next_actions: NextAction[];

  metadata: {
    schema_version: string;
    timezone: string;
  };
}

// ==================== Runtime Types ====================

/**
 * Agent 실행 컨텍스트
 */
export interface AgentContext {
  agent_name: AgentName;
  stage: Stage;
  config: AgentDefinition;
  inputs: Record<string, string>; // file path -> content
  workflow_status: WorkflowStatus;
}

/**
 * Agent 실행 결과
 */
export interface AgentResult {
  success: boolean;
  outputs: Record<string, string>; // file path -> content
  metrics?: {
    execution_time_ms: number;
    token_usage: number;
    cost?: number;
  };
  error?: {
    message: string;
    stack?: string;
    retry_recommended: boolean;
  };
  logs: string[];
}

/**
 * 워크플로우 이벤트
 */
export interface WorkflowEvent {
  type: 'phase_transition' | 'agent_start' | 'agent_complete' | 'error' | 'metric_update';
  timestamp: string;
  stage: Stage;
  agent?: AgentName;
  data: Record<string, unknown>;
}

/**
 * AI API 요청
 */
export interface AIRequest {
  provider: AIProvider;
  model: string;
  system_prompt: string;
  user_prompt: string;
  config: ModelConfig;
}

/**
 * AI API 응답
 */
export interface AIResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  finish_reason: string;
}

// ==================== Utility Types ====================

/**
 * 파일 변경 정보
 */
export interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  content?: string;
}

/**
 * 명령어 실행 결과
 */
export interface CommandResult {
  command: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  execution_time_ms: number;
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
