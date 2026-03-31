import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTmpDir, runCli } from './helpers/index.js';

describe('mcptest init', () => {
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ dir: tmpDir, cleanup } = await createTmpDir());
  });
  afterEach(async () => {
    await cleanup();
  });

  it('basic テンプレートで mcptest.config.ts が生成される', async () => {
    const result = await runCli(['init', '--template', 'basic', '--directory', tmpDir]);

    expect(result.exitCode).toBe(0);
    const configPath = path.join(tmpDir, 'mcptest.config.ts');
    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('conservative');
  }, 10_000);

  it('full テンプレートで mcptest.config.ts と GitHub Actions YAML が生成される', async () => {
    const result = await runCli(['init', '--template', 'full', '--directory', tmpDir]);

    expect(result.exitCode).toBe(0);

    const configPath = path.join(tmpDir, 'mcptest.config.ts');
    expect(existsSync(configPath)).toBe(true);

    const workflowPath = path.join(tmpDir, '.github', 'workflows', 'mcptest.yml');
    expect(existsSync(workflowPath)).toBe(true);
  }, 10_000);

  it('テンプレート未指定（デフォルト）で mcptest.config.ts が生成される', async () => {
    const result = await runCli(['init', '--directory', tmpDir]);

    expect(result.exitCode).toBe(0);
    expect(existsSync(path.join(tmpDir, 'mcptest.config.ts'))).toBe(true);
  }, 10_000);

  it('既存ファイルがある場合に --force なしでエラーになる', async () => {
    // まず初期化
    await runCli(['init', '--directory', tmpDir]);

    // 再度実行（force なし）→ エラー
    const result = await runCli(['init', '--directory', tmpDir]);

    // exit code 1 またはエラーメッセージが stderr にある
    expect(result.exitCode !== 0 || result.stderr.length > 0).toBe(true);
  }, 10_000);
});
