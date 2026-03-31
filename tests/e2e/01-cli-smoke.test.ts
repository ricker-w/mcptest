import { describe, expect, it } from 'vitest';
import { measureStartupTime, runCli } from './helpers/index.js';

describe('CLI smoke tests', () => {
  describe('mcptest --version', () => {
    it('バージョン番号 "0.1.0" を出力する', async () => {
      const result = await runCli(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('0.1.0');
    }, 10_000);

    it('500ms 以内に起動する（ローンチゲート LG-3）', async () => {
      const durationMs = await measureStartupTime();
      expect(durationMs).toBeLessThan(500);
    }, 5_000);
  });

  describe('mcptest --help', () => {
    it('コマンド一覧（run / validate / init）が出力される', async () => {
      const result = await runCli(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('run');
      expect(result.stdout).toContain('validate');
      expect(result.stdout).toContain('init');
    }, 10_000);
  });

  describe('mcptest run --help', () => {
    it('run コマンドのオプション一覧が出力される', async () => {
      const result = await runCli(['run', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('--server');
      expect(result.stdout).toContain('--transport');
      expect(result.stdout).toContain('--reporter');
      expect(result.stdout).toContain('--mode');
      expect(result.stdout).toContain('--bail');
      expect(result.stdout).toContain('--filter');
    }, 10_000);
  });

  describe('mcptest validate --help', () => {
    it('validate コマンドのオプション一覧が出力される', async () => {
      const result = await runCli(['validate', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('--server');
      expect(result.stdout).toContain('--strict');
    }, 10_000);
  });

  describe('mcptest init --help', () => {
    it('init コマンドのオプション一覧が出力される', async () => {
      const result = await runCli(['init', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('--template');
      expect(result.stdout).toContain('basic');
      expect(result.stdout).toContain('full');
    }, 10_000);
  });

  describe('未知コマンド', () => {
    it('exit code 1 でエラーメッセージを出力する', async () => {
      const result = await runCli(['unknown-command']);
      expect(result.exitCode).toBe(1);
    }, 10_000);
  });
});
