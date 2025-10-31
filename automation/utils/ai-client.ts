/**
 * AI 클라이언트
 * OpenAI 및 Anthropic API 통합
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import { AIProvider } from '../types.js';
import { createLogger } from './logger.js';

const logger = createLogger('ai-client');

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface AIClientConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  max_tokens?: number;
  timeout_seconds?: number;
}

/**
 * AI 클라이언트 (OpenAI + Anthropic 통합)
 */
export class AIClient {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    this.initClients();
  }

  /**
   * API 클라이언트 초기화
   */
  private initClients(): void {
    // OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      logger.debug('OpenAI client initialized');
    }

    // Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      logger.debug('Anthropic client initialized');
    }

    if (!this.openai && !this.anthropic) {
      logger.warn('No AI API keys found. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY');
    }
  }

  /**
   * OpenAI 호출
   */
  private async callOpenAI(config: AIClientConfig, messages: AIMessage[]): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not set');
    }

    logger.info(`Calling OpenAI: ${config.model}`);
    logger.debug('Messages', { count: messages.length });

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: config.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature ?? 0.3,
        max_tokens: config.max_tokens ?? 4000,
      });

      const duration = Date.now() - startTime;

      const result: AIResponse = {
        content: response.choices[0]?.message?.content || '',
        usage: {
          input_tokens: response.usage?.prompt_tokens || 0,
          output_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
      };

      logger.success(`OpenAI response received (${duration}ms)`);
      logger.debug('Token usage', result.usage);

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('OpenAI API call failed', errorObj);
      throw new Error(`OpenAI API 호출 실패: ${errorObj.message}`);
    }
  }

  /**
   * Anthropic 호출
   */
  private async callAnthropic(config: AIClientConfig, messages: AIMessage[]): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not set');
    }

    logger.info(`Calling Anthropic: ${config.model}`);
    logger.debug('Messages', { count: messages.length });

    const startTime = Date.now();

    try {
      // system 메시지 분리
      const systemMessage = messages.find((msg) => msg.role === 'system');
      const conversationMessages = messages.filter((msg) => msg.role !== 'system');

      const response = await this.anthropic.messages.create({
        model: config.model,
        system: systemMessage?.content,
        messages: conversationMessages.map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
        temperature: config.temperature ?? 0.3,
        max_tokens: config.max_tokens ?? 4000,
      });

      const duration = Date.now() - startTime;

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

      const result: AIResponse = {
        content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
      };

      logger.success(`Anthropic response received (${duration}ms)`);
      logger.debug('Token usage', result.usage);

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Anthropic API call failed', errorObj);
      throw new Error(`Anthropic API 호출 실패: ${errorObj.message}`);
    }
  }

  /**
   * AI 호출 (provider에 따라 자동 라우팅)
   */
  async call(config: AIClientConfig, messages: AIMessage[]): Promise<AIResponse> {
    logger.step(`AI 호출: ${config.provider} - ${config.model}`);

    if (config.provider === 'openai') {
      return this.callOpenAI(config, messages);
    } else if (config.provider === 'anthropic') {
      return this.callAnthropic(config, messages);
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * 간단한 프롬프트 호출
   */
  async prompt(config: AIClientConfig, systemPrompt: string, userPrompt: string): Promise<string> {
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.call(config, messages);
    return response.content;
  }

  /**
   * 스트리밍 지원 확인
   */
  supportsStreaming(provider: AIProvider): boolean {
    return provider === 'openai' || provider === 'anthropic';
  }

  /**
   * 사용 가능한 provider 확인
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];

    if (this.openai) providers.push('openai');
    if (this.anthropic) providers.push('anthropic');

    return providers;
  }

  /**
   * API 키 설정 확인
   */
  isConfigured(provider: AIProvider): boolean {
    if (provider === 'openai') {
      return this.openai !== null;
    } else if (provider === 'anthropic') {
      return this.anthropic !== null;
    }
    return false;
  }
}

/**
 * 싱글톤 인스턴스
 */
let aiClient: AIClient | null = null;

/**
 * AIClient 싱글톤 가져오기
 */
export function getAIClient(): AIClient {
  if (!aiClient) {
    aiClient = new AIClient();
  }
  return aiClient;
}

/**
 * 빠른 AI 호출
 */
export async function callAI(
  config: AIClientConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = getAIClient();
  return client.prompt(config, systemPrompt, userPrompt);
}
