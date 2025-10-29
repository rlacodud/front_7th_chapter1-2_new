/**
 * 설정 로더
 * YAML 설정 파일을 읽고 검증
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { AgentConfig } from '../types.js';
import { createLogger } from './logger.js';

const logger = createLogger('config-loader');

/**
 * Zod 스키마로 AgentConfig 검증
 */
const AgentConfigSchema = z.object({
  version: z.string(),
  metadata: z.object({
    project: z.string(),
    description: z.string(),
    author: z.string(),
    created: z.string(),
    repository: z.string(),
  }),
  environment: z.object({
    language: z.string(),
    runtime: z.string(),
    test_framework: z.enum(['Vitest', 'Jest']),
    test_version: z.string(),
    package_manager: z.enum(['pnpm', 'npm', 'yarn']),
    working_directory: z.string(),
    test_pattern: z.string(),
    log_dir: z.string(),
    state_dir: z.string(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    files: z.object({
      execution: z.string(),
      orchestrator: z.string(),
      agents: z.string(),
    }),
  }),
  agents: z.record(z.any()), // Agent 정의는 동적이므로 any 허용
  workflow: z.object({
    phases: z.record(z.any()),
  }),
});

/**
 * 설정 파일 로더
 */
export class ConfigLoader {
  private configPath: string;
  private config: AgentConfig | null = null;

  constructor(configPath: string = 'config/agent-config.yml') {
    this.configPath = configPath;
  }

  /**
   * YAML 파일 읽기
   */
  private readYaml(path: string): any {
    try {
      const content = readFileSync(path, 'utf-8');
      return parseYaml(content);
    } catch (error: any) {
      logger.error(`Failed to read YAML file: ${path}`, error);
      throw new Error(`YAML 파일 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 설정 검증
   */
  private validate(data: any): AgentConfig {
    try {
      const result = AgentConfigSchema.parse(data);
      return result as AgentConfig;
    } catch (error: any) {
      logger.error('Configuration validation failed', error);
      throw new Error(`설정 검증 실패: ${error.message}`);
    }
  }

  /**
   * 설정 로드
   */
  load(): AgentConfig {
    if (this.config) {
      return this.config;
    }

    logger.info(`Loading configuration from: ${this.configPath}`);

    const data = this.readYaml(this.configPath);
    this.config = this.validate(data);

    logger.success('Configuration loaded successfully');
    logger.debug('Configuration', {
      version: this.config.version,
      agents: Object.keys(this.config.agents),
      phases: Object.keys(this.config.workflow.phases),
    });

    return this.config;
  }

  /**
   * 설정 리로드
   */
  reload(): AgentConfig {
    this.config = null;
    return this.load();
  }

  /**
   * 특정 Agent 설정 가져오기
   */
  getAgentConfig(agentName: string): any {
    const config = this.config || this.load();

    if (!config.agents[agentName]) {
      throw new Error(`Agent 설정을 찾을 수 없습니다: ${agentName}`);
    }

    return config.agents[agentName];
  }

  /**
   * 환경 설정 가져오기
   */
  getEnvironment(): AgentConfig['environment'] {
    const config = this.config || this.load();
    return config.environment;
  }

  /**
   * 워크플로우 설정 가져오기
   */
  getWorkflow(): AgentConfig['workflow'] {
    const config = this.config || this.load();
    return config.workflow;
  }

  /**
   * 설정 파일 경로 반환
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 현재 로드된 설정 반환
   */
  getConfig(): AgentConfig | null {
    return this.config;
  }
}

/**
 * 싱글톤 인스턴스
 */
let configLoader: ConfigLoader | null = null;

/**
 * ConfigLoader 싱글톤 가져오기
 */
export function getConfigLoader(configPath?: string): ConfigLoader {
  if (!configLoader) {
    configLoader = new ConfigLoader(configPath);
  }
  return configLoader;
}

/**
 * 설정 빠르게 로드
 */
export function loadConfig(configPath?: string): AgentConfig {
  const loader = getConfigLoader(configPath);
  return loader.load();
}
