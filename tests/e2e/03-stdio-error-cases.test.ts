import { describe, expect, it } from 'vitest';
import { runCli } from './helpers/index.js';

describe('stdio transport: error scenarios', () => {
  describe('存在しないサーバーコマンド', () => {
    it('exit code 1 を返す', async () => {
      const result = await runCli(['run', '--server', 'node /nonexistent/path/server.js'], {
        timeoutMs: 15_000,
      });

      expect(result.exitCode).toBe(1);
    }, 15_000);
  });

  describe('invalid-schema-server（スキーマ不正）', () => {
    it('exit code 1 を返す', async () => {
      const result = await runCli(
        ['run', '--server', 'npx tsx tests/integration/fixtures/invalid-schema-server/index.ts'],
        { timeoutMs: 30_000 },
      );

      expect(result.exitCode).toBe(1);
    }, 30_000);
  });

  describe('--bail フラグ', () => {
    it('--bail ありで exit code 1 を返す', async () => {
      const withBail = await runCli(
        [
          'run',
          '--server',
          'npx tsx tests/integration/fixtures/invalid-schema-server/index.ts',
          '--bail',
        ],
        { timeoutMs: 30_000 },
      );

      // bail フラグが機能して exit code 1 を返す
      expect(withBail.exitCode).toBe(1);
    }, 30_000);
  });

  describe('--filter によるツール絞り込み', () => {
    it('指定したツール名のみテストされる', async () => {
      const result = await runCli(
        [
          'run',
          '--server',
          'npx tsx tests/integration/fixtures/valid-server/index.ts',
          '--filter',
          'echo',
        ],
        { timeoutMs: 30_000 },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('echo');
    }, 30_000);
  });

  describe('mcptest validate: invalid-schema-server', () => {
    it('exit code 1 を返す', async () => {
      const result = await runCli(
        [
          'validate',
          'tools',
          '--server',
          'npx tsx tests/integration/fixtures/invalid-schema-server/index.ts',
        ],
        { timeoutMs: 30_000 },
      );

      expect(result.exitCode).toBe(1);
    }, 30_000);
  });
});
