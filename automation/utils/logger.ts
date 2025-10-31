/**
 * 로거 유틸리티
 * 터미널 출력 및 파일 로깅
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  enableFile: boolean;
  logDir: string;
  enableConsole: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 로거 클래스
 */
export class Logger {
  private config: LoggerConfig;
  private logFile: string | null = null;
  private name: string;

  constructor(name: string, config?: Partial<LoggerConfig>) {
    this.name = name;
    this.config = {
      level: config?.level || 'info',
      enableFile: config?.enableFile ?? true,
      logDir: config?.logDir || 'logs',
      enableConsole: config?.enableConsole ?? true,
    };

    if (this.config.enableFile) {
      this.initLogFile();
    }
  }

  /**
   * 로그 파일 초기화
   */
  private initLogFile(): void {
    if (!existsSync(this.config.logDir)) {
      mkdirSync(this.config.logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    // name is used in initLogFile and format methods
    this.logFile = join(this.config.logDir, `${this.name}-${timestamp}.log`);
  }

  /**
   * 로그 레벨 체크
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * 로그 포맷팅
   */
  private format(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}${metaStr}`;
  }

  /**
   * 파일에 로그 쓰기
   */
  private writeToFile(formattedMessage: string): void {
    if (this.config.enableFile && this.logFile) {
      try {
        appendFileSync(this.logFile, formattedMessage + '\n', 'utf-8');
      } catch (error) {
        console.error('Failed to write log file:', error);
      }
    }
  }

  /**
   * DEBUG 로그
   */
  debug(message: string, meta?: unknown): void {
    if (!this.shouldLog('debug')) return;

    const formatted = this.format('debug', message, meta);
    this.writeToFile(formatted);

    if (this.config.enableConsole) {
      console.log(chalk.gray(`🔍 ${message}`), meta || '');
    }
  }

  /**
   * INFO 로그
   */
  info(message: string, meta?: unknown): void {
    if (!this.shouldLog('info')) return;

    const formatted = this.format('info', message, meta);
    this.writeToFile(formatted);

    if (this.config.enableConsole) {
      console.log(chalk.blue(`ℹ️  ${message}`), meta || '');
    }
  }

  /**
   * WARN 로그
   */
  warn(message: string, meta?: unknown): void {
    if (!this.shouldLog('warn')) return;

    const formatted = this.format('warn', message, meta);
    this.writeToFile(formatted);

    if (this.config.enableConsole) {
      console.log(chalk.yellow(`⚠️  ${message}`), meta || '');
    }
  }

  /**
   * ERROR 로그
   */
  error(message: string, error?: Error | unknown): void {
    if (!this.shouldLog('error')) return;

    const meta = error instanceof Error ? { message: error.message, stack: error.stack } : error;

    const formatted = this.format('error', message, meta);
    this.writeToFile(formatted);

    if (this.config.enableConsole) {
      console.error(chalk.red(`❌ ${message}`));
      if (error instanceof Error) {
        console.error(chalk.red(error.stack));
      } else if (error) {
        console.error(chalk.red(JSON.stringify(error, null, 2)));
      }
    }
  }

  /**
   * 성공 메시지 (INFO 레벨)
   */
  success(message: string, meta?: unknown): void {
    if (!this.shouldLog('info')) return;

    const formatted = this.format('info', `SUCCESS: ${message}`, meta);
    this.writeToFile(formatted);

    if (this.config.enableConsole) {
      console.log(chalk.green(`✅ ${message}`), meta || '');
    }
  }

  /**
   * 단계 시작 (INFO 레벨)
   */
  step(message: string): void {
    if (!this.shouldLog('info')) return;

    const formatted = this.format('info', `STEP: ${message}`);
    this.writeToFile(formatted);

    if (this.config.enableConsole) {
      console.log(chalk.cyan(`\n▶️  ${message}\n`));
    }
  }

  /**
   * 구분선
   */
  divider(): void {
    if (this.config.enableConsole) {
      console.log(chalk.gray('─'.repeat(60)));
    }
  }

  /**
   * 빈 줄
   */
  newline(): void {
    if (this.config.enableConsole) {
      console.log('');
    }
  }

  /**
   * 진행 상황 표시
   */
  progress(current: number, total: number, message: string): void {
    if (!this.config.enableConsole) return;

    const percentage = Math.round((current / total) * 100);
    const bar =
      '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));

    console.log(chalk.blue(`[${bar}] ${percentage}%`) + chalk.gray(` ${message}`));
  }

  /**
   * 테이블 형식 로그
   */
  table(data: Record<string, unknown>): void {
    if (!this.config.enableConsole) return;

    console.table(data);
  }

  /**
   * JSON 로그
   */
  json(data: unknown): void {
    const formatted = this.format('info', 'JSON', data);
    this.writeToFile(formatted);

    if (this.config.enableConsole) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * 로그 파일 경로 반환
   */
  getLogFile(): string | null {
    return this.logFile;
  }
}

/**
 * 전역 로거 인스턴스
 */
const loggers: Map<string, Logger> = new Map();

/**
 * 로거 팩토리
 */
export function createLogger(name: string, config?: Partial<LoggerConfig>): Logger {
  if (!loggers.has(name)) {
    loggers.set(name, new Logger(name, config));
  }
  return loggers.get(name)!;
}

/**
 * 기본 로거
 */
export const logger = createLogger('automation');
