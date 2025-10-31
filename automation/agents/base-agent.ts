/**
 * Agent 베이스 클래스
 * 모든 Agent의 공통 기능 정의
 */

import { AgentName, AgentContext, AgentResult, Stage } from '../types.js';
import { getAIClient, AIClientConfig } from '../utils/ai-client.js';
import { getFileManager } from '../utils/file-manager.js';
import { createLogger, Logger } from '../utils/logger.js';
import { getStatusTracker } from '../utils/status-tracker.js';

export interface AgentConfig {
  name: AgentName;
  stage: Stage;
  provider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Agent 베이스 클래스
 */
export abstract class BaseAgent {
  protected config: AgentConfig;
  protected aiClient = getAIClient();
  protected fileManager = getFileManager();
  protected statusTracker = getStatusTracker();
  protected logger: Logger;

  constructor(config: AgentConfig) {
    this.config = config;
    this.logger = createLogger(config.name);
  }

  /**
   * Agent 실행 (추상 메서드)
   * @param context Agent 컨텍스트 (자식 클래스에서 구현 시 사용)
   */
  abstract execute(context: AgentContext): Promise<AgentResult>;

  /**
   * 시스템 프롬프트 생성 (추상 메서드)
   */
  protected abstract getSystemPrompt(): string;

  /**
   * 사용자 프롬프트 생성 (추상 메서드)
   * @param context Agent 컨텍스트 (자식 클래스에서 구현 시 사용)
   */
  protected abstract getUserPrompt(context: AgentContext): string;

  /**
   * AI 호출
   */
  protected async callAI(userPrompt: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt();

    const aiConfig: AIClientConfig = {
      provider: this.config.provider,
      model: this.config.model,
      temperature: this.config.temperature ?? 0.3,
      max_tokens: this.config.max_tokens ?? 4000,
    };

    this.logger.step(`Calling AI: ${this.config.provider} - ${this.config.model}`);

    try {
      const response = await this.aiClient.prompt(aiConfig, systemPrompt, userPrompt);

      this.logger.success('AI response received');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('AI call failed', error);
      throw new Error(`AI 호출 실패: ${errorMessage}`);
    }
  }

  /**
   * 입력 파일 읽기
   */
  protected readInputs(inputs: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, path] of Object.entries(inputs)) {
      try {
        result[key] = this.fileManager.read(path);
        this.logger.debug(`Input loaded: ${path}`);
      } catch {
        this.logger.warn(`Failed to read input: ${path}`);
        result[key] = '';
      }
    }

    return result;
  }

  /**
   * 출력 파일 쓰기
   */
  protected writeOutputs(outputs: Record<string, string>): void {
    for (const [path, content] of Object.entries(outputs)) {
      try {
        this.fileManager.write(path, content);
        this.logger.success(`Output written: ${path}`);
      } catch (error) {
        this.logger.error(`Failed to write output: ${path}`, error);
        throw error;
      }
    }
  }

  /**
   * Agent 상태 업데이트
   */
  protected updateStatus(status: 'idle' | 'active' | 'completed' | 'error'): void {
    this.statusTracker.updateAgent(this.config.name, {
      status,
      health: status === 'error' ? 'unhealthy' : 'healthy',
    });
  }

  /**
   * 에러 로깅
   */
  protected logError(message: string, error?: Error): void {
    this.logger.error(message, error);
    this.statusTracker.addError(this.config.name, message, this.config.stage);
  }

  /**
   * 경고 로깅
   */
  protected logWarning(message: string): void {
    this.logger.warn(message);
    this.statusTracker.addWarning(this.config.name, message, this.config.stage);
  }

  /**
   * Agent 실행 (with 상태 관리)
   */
  async run(context: AgentContext): Promise<AgentResult> {
    this.logger.divider();
    this.logger.step(`${this.config.name} 실행 시작`);
    this.logger.divider();

    this.updateStatus('active');

    const startTime = Date.now();

    try {
      const result = await this.execute(context);

      const duration = Date.now() - startTime;
      result.metrics = {
        ...result.metrics,
        execution_time_ms: duration,
      };

      this.updateStatus('completed');
      this.logger.success(`${this.config.name} 완료 (${duration}ms)`);

      return result;
    } catch (error) {
      this.updateStatus('error');
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logError(`${this.config.name} 실행 실패`, errorObj);

      return {
        success: false,
        outputs: {},
        error: errorObj.message,
      };
    }
  }

  /**
   * Agent 이름 가져오기
   */
  getName(): AgentName {
    return this.config.name;
  }

  /**
   * Stage 가져오기
   */
  getStage(): Stage {
    return this.config.stage;
  }

  /**
   * 설정 가져오기
   */
  getConfig(): AgentConfig {
    return this.config;
  }
}
