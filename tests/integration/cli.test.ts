import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI_PATH = resolve(process.cwd(), 'dist/cli/index.js');
const FIXTURES_DIR = resolve(process.cwd(), 'tests/integration/fixtures');
const TSX_BIN = resolve(process.cwd(), 'node_modules/.bin/tsx');

interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runCli(
  args: string[],
  options: { cwd?: string; timeoutMs?: number } = {},
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      cwd: options.cwd ?? process.cwd(),
      timeout: options.timeoutMs ?? 30_000,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    child.on('close', (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
    child.on('error', reject);
  });
}

function fixtureServer(name: string): string {
  return `${TSX_BIN} ${join(FIXTURES_DIR, name, 'index.ts')}`;
}

describe('mcptest run', () => {
  it('valid-server に対して exit code 0 を返す', async () => {
    const result = await runCli(['run', '--server', fixtureServer('valid-server')], {
      timeoutMs: 30_000,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('passed');
  }, 30_000);

  it('invalid-schema-server に対して exit code 1 を返す', async () => {
    const result = await runCli(['run', '--server', fixtureServer('invalid-schema-server')], {
      timeoutMs: 30_000,
    });
    expect(result.exitCode).toBe(1);
  }, 30_000);

  it('--reporter junit で XML ファイルが生成される', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'mcptest-'));
    const outputPath = join(tmpDir, 'results.xml');
    try {
      const result = await runCli(
        [
          'run',
          '--server',
          fixtureServer('valid-server'),
          '--reporter',
          'junit',
          '--output',
          outputPath,
        ],
        { timeoutMs: 30_000 },
      );
      expect(result.exitCode).toBe(0);
      expect(existsSync(outputPath)).toBe(true);
      const xml = await readFile(outputPath, 'utf8');
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<testsuites');
      expect(xml).toContain('<testsuite');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }, 30_000);

  it('--filter で特定ツールのみテストする', async () => {
    const result = await runCli(
      ['run', '--server', fixtureServer('valid-server'), '--filter', 'echo'],
      { timeoutMs: 30_000 },
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('echo');
    expect(result.stdout).not.toContain('add: schema');
  }, 30_000);
});

describe('mcptest validate', () => {
  it('valid-server の tools に対して exit code 0 を返す', async () => {
    const result = await runCli(['validate', '--server', fixtureServer('valid-server')], {
      timeoutMs: 30_000,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('valid');
  }, 30_000);

  it('invalid-schema-server に対して exit code 1 とエラーメッセージを返す', async () => {
    const result = await runCli(['validate', '--server', fixtureServer('invalid-schema-server')], {
      timeoutMs: 30_000,
    });
    expect(result.exitCode).toBe(1);
  }, 30_000);
});
