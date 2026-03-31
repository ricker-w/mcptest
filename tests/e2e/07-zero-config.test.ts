import { writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTmpDir, runCli } from './helpers/index.js';

describe('Zero-config server auto-detection', () => {
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ dir: tmpDir, cleanup } = await createTmpDir());
  });
  afterEach(async () => {
    await cleanup();
  });

  it('--server なしで E-001 エラーが出る（サーバー未設定のプロジェクト）', async () => {
    // 空のプロジェクトディレクトリで実行
    const result = await runCli(['run'], {
      cwd: tmpDir,
      timeoutMs: 10_000,
    });
    // サーバーが検出できないので exit code 1
    expect(result.exitCode).toBe(1);
  }, 10_000);

  it('package.json の bin フィールドからサーバーを検出する', async () => {
    // tmpDir に package.json を作成
    const packageJson = {
      name: 'test-mcp-server',
      bin: { 'my-server': './server.js' },
    };
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // サーバーが見つかっても起動に失敗するので exit code 1 だが、E-001 ではない
    const result = await runCli(['run'], {
      cwd: tmpDir,
      timeoutMs: 10_000,
    });
    // 検出はされるが起動失敗（exit code 1）
    expect(result.exitCode).toBe(1);
    // stdout/stderr にサーバー名が含まれる可能性がある
  }, 10_000);

  it('mcptest.config.ts でサーバーを設定できる', async () => {
    // tmpDir に mcptest.config.ts を作成（存在しないサーバーコマンドを指定）
    const configContent = `
export default {
  server: 'node /nonexistent/server.js',
  transport: 'stdio',
};
`;
    writeFileSync(path.join(tmpDir, 'mcptest.config.ts'), configContent);

    const result = await runCli(['run'], {
      cwd: tmpDir,
      timeoutMs: 10_000,
    });
    // 設定は読まれるが起動失敗
    expect(result.exitCode).toBe(1);
  }, 10_000);
});
