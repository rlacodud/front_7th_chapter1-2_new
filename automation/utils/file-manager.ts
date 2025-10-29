/**
 * 파일 관리자
 * 파일 읽기/쓰기, glob 패턴 지원
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { createLogger } from './logger.js';

const logger = createLogger('file-manager');

/**
 * 파일 관리자
 */
export class FileManager {
  private workingDir: string;

  constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
  }

  /**
   * 절대 경로로 변환
   */
  private resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    return join(this.workingDir, path);
  }

  /**
   * 파일 읽기
   */
  read(path: string): string {
    const absolutePath = this.resolvePath(path);

    if (!existsSync(absolutePath)) {
      throw new Error(`File not found: ${path}`);
    }

    try {
      logger.debug(`Reading file: ${path}`);
      return readFileSync(absolutePath, 'utf-8');
    } catch (error: any) {
      logger.error(`Failed to read file: ${path}`, error);
      throw error;
    }
  }

  /**
   * 파일 쓰기
   */
  write(path: string, content: string): void {
    const absolutePath = this.resolvePath(path);
    const dir = dirname(absolutePath);

    // 디렉토리가 없으면 생성
    if (!existsSync(dir)) {
      logger.debug(`Creating directory: ${dir}`);
      mkdirSync(dir, { recursive: true });
    }

    try {
      logger.debug(`Writing file: ${path} (${content.length} bytes)`);
      writeFileSync(absolutePath, content, 'utf-8');
      logger.success(`File written: ${path}`);
    } catch (error: any) {
      logger.error(`Failed to write file: ${path}`, error);
      throw error;
    }
  }

  /**
   * 파일 존재 확인
   */
  exists(path: string): boolean {
    const absolutePath = this.resolvePath(path);
    return existsSync(absolutePath);
  }

  /**
   * JSON 파일 읽기
   */
  readJson<T = any>(path: string): T {
    const content = this.read(path);
    try {
      return JSON.parse(content) as T;
    } catch (error: any) {
      logger.error(`Failed to parse JSON: ${path}`, error);
      throw new Error(`Invalid JSON in ${path}: ${error.message}`);
    }
  }

  /**
   * JSON 파일 쓰기
   */
  writeJson(path: string, data: any, pretty: boolean = true): void {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    this.write(path, content);
  }

  /**
   * 디렉토리 생성
   */
  ensureDir(path: string): void {
    const absolutePath = this.resolvePath(path);

    if (!existsSync(absolutePath)) {
      logger.debug(`Creating directory: ${path}`);
      mkdirSync(absolutePath, { recursive: true });
    }
  }

  /**
   * glob 패턴으로 파일 찾기 (간단한 구현)
   */
  glob(pattern: string, baseDir: string = '.'): string[] {
    const absoluteBase = this.resolvePath(baseDir);
    const results: string[] = [];

    // **/*.spec.ts 같은 패턴 처리
    const isRecursive = pattern.includes('**');
    const extension = pattern.split('.').pop() || '';

    const walk = (dir: string): void => {
      if (!existsSync(dir)) return;

      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          if (isRecursive && !entry.startsWith('.') && entry !== 'node_modules') {
            walk(fullPath);
          }
        } else if (stat.isFile()) {
          // 패턴 매칭 (간단한 확장자 체크)
          if (pattern === '**/*' || fullPath.endsWith(`.${extension}`)) {
            const relativePath = relative(this.workingDir, fullPath);
            results.push(relativePath);
          }
        }
      }
    };

    walk(absoluteBase);
    return results;
  }

  /**
   * 디렉토리의 모든 파일 읽기
   */
  readDirectory(dirPath: string): Record<string, string> {
    const absolutePath = this.resolvePath(dirPath);
    const files: Record<string, string> = {};

    if (!existsSync(absolutePath)) {
      logger.warn(`Directory not found: ${dirPath}`);
      return files;
    }

    const entries = readdirSync(absolutePath);

    for (const entry of entries) {
      const fullPath = join(absolutePath, entry);
      const stat = statSync(fullPath);

      if (stat.isFile()) {
        const relativePath = relative(this.workingDir, fullPath);
        try {
          files[relativePath] = this.read(relativePath);
        } catch (error) {
          logger.warn(`Failed to read file: ${relativePath}`);
        }
      }
    }

    return files;
  }

  /**
   * 여러 파일 읽기
   */
  readMultiple(paths: string[]): Record<string, string> {
    const files: Record<string, string> = {};

    for (const path of paths) {
      try {
        files[path] = this.read(path);
      } catch (error) {
        logger.warn(`Failed to read file: ${path}`);
        files[path] = '';
      }
    }

    return files;
  }

  /**
   * 여러 파일 쓰기
   */
  writeMultiple(files: Record<string, string>): void {
    for (const [path, content] of Object.entries(files)) {
      this.write(path, content);
    }
  }

  /**
   * 파일 크기 가져오기
   */
  getSize(path: string): number {
    const absolutePath = this.resolvePath(path);

    if (!existsSync(absolutePath)) {
      return 0;
    }

    const stat = statSync(absolutePath);
    return stat.size;
  }

  /**
   * 파일 수정 시간 가져오기
   */
  getModifiedTime(path: string): Date | null {
    const absolutePath = this.resolvePath(path);

    if (!existsSync(absolutePath)) {
      return null;
    }

    const stat = statSync(absolutePath);
    return stat.mtime;
  }

  /**
   * 작업 디렉토리 변경
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
let fileManager: FileManager | null = null;

/**
 * FileManager 싱글톤 가져오기
 */
export function getFileManager(workingDir?: string): FileManager {
  if (!fileManager) {
    fileManager = new FileManager(workingDir);
  }
  return fileManager;
}
