/**
 * 명령어 실행기
 * 터미널 명령어 실행 및 결과 수집
 */

import { exec, execSync } from 'child_process';
import { Buffer } from 'node:buffer';
import { promisify } from 'util';

import { createLogger } from './logger.js';

const logger = createLogger('command-runner');
const execAsync = promisify(exec);

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface CommandOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
  silent?: boolean;
  captureOutput?: boolean;
}

/**
 * 명령어 실행기
 */
export class CommandRunner {
  private workingDir: string;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  /**
   * 명령어 실행 (비동기, 프로미스)
   */
  async run(command: string, options: CommandOptions = {}): Promise<CommandResult> {
    const cwd = options.cwd || this.workingDir;
    const timeout = options.timeout || 60000; // 60초 기본
    const silent = options.silent ?? false;

    if (!silent) {
      logger.info(`Executing: ${command}`);
      logger.debug('Options', { cwd, timeout });
    }

    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        env: { ...process.env, ...options.env },
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      const duration = Date.now() - startTime;

      if (!silent) {
        logger.success(`Command completed (${duration}ms)`);
        if (stdout && !options.captureOutput) {
          logger.debug('stdout', { output: stdout.substring(0, 200) });
        }
      }

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const execError = error as { stdout?: string; stderr?: string; code?: number };

      if (!silent) {
        logger.error(`Command failed (${duration}ms)`, errorObj);
      }

      return {
        success: false,
        stdout: execError.stdout?.trim() || '',
        stderr: execError.stderr?.trim() || errorObj.message,
        exitCode: execError.code || 1,
        duration,
      };
    }
  }

  /**
   * 명령어 동기 실행
   */
  runSync(command: string, options: CommandOptions = {}): CommandResult {
    const cwd = options.cwd || this.workingDir;
    const silent = options.silent ?? false;

    if (!silent) {
      logger.info(`Executing (sync): ${command}`);
    }

    const startTime = Date.now();

    try {
      const output = execSync(command, {
        cwd,
        encoding: 'utf-8',
        env: { ...process.env, ...options.env },
        maxBuffer: 10 * 1024 * 1024,
      });

      const duration = Date.now() - startTime;

      if (!silent) {
        logger.success(`Command completed (${duration}ms)`);
      }

      return {
        success: true,
        stdout: output.trim(),
        stderr: '',
        exitCode: 0,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const execError = error as {
        stdout?: string | Buffer;
        stderr?: string | Buffer;
        status?: number;
      };

      if (!silent) {
        logger.error(`Command failed (${duration}ms)`);
      }

      return {
        success: false,
        stdout: execError.stdout?.toString().trim() || '',
        stderr: execError.stderr?.toString().trim() || errorObj.message,
        exitCode: execError.status || 1,
        duration,
      };
    }
  }

  /**
   * 테스트 실행
   */
  async runTests(options: CommandOptions = {}): Promise<CommandResult> {
    logger.step('Running tests...');
    return this.run('pnpm test', options);
  }

  /**
   * 테스트 커버리지 실행
   */
  async runCoverage(options: CommandOptions = {}): Promise<CommandResult> {
    logger.step('Running test coverage...');
    return this.run('pnpm test:coverage', options);
  }

  /**
   * Lint 실행
   */
  async runLint(options: CommandOptions = {}): Promise<CommandResult> {
    logger.step('Running linter...');
    return this.run('pnpm lint', options);
  }

  /**
   * Git 명령어 실행
   */
  async git(args: string, options: CommandOptions = {}): Promise<CommandResult> {
    return this.run(`git ${args}`, options);
  }

  /**
   * Git 상태 확인
   */
  async gitStatus(options: CommandOptions = {}): Promise<CommandResult> {
    return this.git('status --porcelain', { ...options, silent: true });
  }

  /**
   * Git add
   */
  async gitAdd(files: string[], options: CommandOptions = {}): Promise<CommandResult> {
    if (files.length === 0) {
      logger.warn('No files to add');
      return {
        success: true,
        stdout: '',
        stderr: '',
        exitCode: 0,
        duration: 0,
      };
    }

    const filesArg = files.map((f) => `"${f}"`).join(' ');
    return this.git(`add ${filesArg}`, options);
  }

  /**
   * Git commit
   */
  async gitCommit(message: string, options: CommandOptions = {}): Promise<CommandResult> {
    return this.git(`commit -m "${message.replace(/"/g, '\\"')}"`, options);
  }

  /**
   * Git push
   */
  async gitPush(
    remote: string = 'origin',
    branch: string = 'main',
    options: CommandOptions = {}
  ): Promise<CommandResult> {
    return this.git(`push ${remote} ${branch}`, options);
  }

  /**
   * 패키지 설치
   */
  async installDependencies(options: CommandOptions = {}): Promise<CommandResult> {
    logger.step('Installing dependencies...');
    return this.run('pnpm install', options);
  }

  /**
   * 명령어 실행 가능 여부 확인
   */
  async checkCommand(command: string): Promise<boolean> {
    const result = await this.run(`which ${command}`, { silent: true });
    return result.success;
  }

  /**
   * 여러 명령어 순차 실행
   */
  async runSequence(commands: string[], options: CommandOptions = {}): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const command of commands) {
      const result = await this.run(command, options);
      results.push(result);

      // 하나라도 실패하면 중단
      if (!result.success) {
        logger.error(`Command sequence failed at: ${command}`);
        break;
      }
    }

    return results;
  }

  /**
   * 명령어 실행 결과 파싱 (JSON)
   */
  async runAndParseJson<T = unknown>(
    command: string,
    options: CommandOptions = {}
  ): Promise<T | null> {
    const result = await this.run(command, { ...options, captureOutput: true });

    if (!result.success) {
      return null;
    }

    try {
      return JSON.parse(result.stdout) as T;
    } catch (error) {
      logger.error('Failed to parse command output as JSON', error);
      return null;
    }
  }

  /**
   * 작업 디렉토리 설정
   */
  setWorkingDir(dir: string): void {
    this.workingDir = dir;
    logger.info(`Working directory changed: ${dir}`);
  }

  /**
   * 작업 디렉토리 가져오기
   */
  getWorkingDir(): string {
    return this.workingDir;
  }
}

/**
 * 싱글톤 인스턴스
 */
let commandRunner: CommandRunner | null = null;

/**
 * CommandRunner 싱글톤 가져오기
 */
export function getCommandRunner(workingDir?: string): CommandRunner {
  if (!commandRunner) {
    commandRunner = new CommandRunner(workingDir);
  }
  return commandRunner;
}

/**
 * 빠른 명령어 실행
 */
export async function runCommand(
  command: string,
  options?: CommandOptions
): Promise<CommandResult> {
  const runner = getCommandRunner();
  return runner.run(command, options);
}
