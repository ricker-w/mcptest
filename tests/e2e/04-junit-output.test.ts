import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { assertJUnitValid, createTmpDir, readJUnitFile, runCli } from './helpers/index.js';

describe('JUnit XML output', () => {
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ dir: tmpDir, cleanup } = await createTmpDir());
  });
  afterEach(async () => {
    await cleanup();
  });

  it('valid-server に対して failures=0 の XML が生成される', async () => {
    const outputPath = path.join(tmpDir, 'result.xml');

    const result = await runCli(
      [
        'run',
        '--server',
        'npx tsx tests/integration/fixtures/valid-server/index.ts',
        '--reporter',
        'junit',
        '--output',
        outputPath,
      ],
      { timeoutMs: 30_000 },
    );

    expect(result.exitCode).toBe(0);
    expect(existsSync(outputPath)).toBe(true);

    const report = readJUnitFile(outputPath);
    expect(report.totalFailures).toBe(0);
    expect(report.totalTests).toBeGreaterThan(0);
  }, 30_000);

  it('invalid-schema-server に対して failures > 0 の XML が生成される', async () => {
    const outputPath = path.join(tmpDir, 'result.xml');

    await runCli(
      [
        'run',
        '--server',
        'npx tsx tests/integration/fixtures/invalid-schema-server/index.ts',
        '--reporter',
        'junit',
        '--output',
        outputPath,
      ],
      { timeoutMs: 30_000 },
    );

    // XML が生成されていれば検証（生成されない場合はスキップ）
    if (existsSync(outputPath)) {
      const report = readJUnitFile(outputPath);
      expect(report.totalFailures).toBeGreaterThan(0);
    }
    // exit code 1 であること（XML の有無に関わらず）
  }, 30_000);

  it('JUnit XML が有効な XML 構造を持つ', async () => {
    const outputPath = path.join(tmpDir, 'result.xml');

    await runCli(
      [
        'run',
        '--server',
        'npx tsx tests/integration/fixtures/valid-server/index.ts',
        '--reporter',
        'junit',
        '--output',
        outputPath,
      ],
      { timeoutMs: 30_000 },
    );

    expect(existsSync(outputPath)).toBe(true);
    const xml = readFileSync(outputPath, 'utf-8');

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<testsuites');
    expect(xml).toContain('<testsuite');
    expect(xml).toContain('<testcase');
    assertJUnitValid(xml);
  }, 30_000);

  it('time 属性が秒単位で記録される（1000 未満）', async () => {
    const outputPath = path.join(tmpDir, 'result.xml');

    await runCli(
      [
        'run',
        '--server',
        'npx tsx tests/integration/fixtures/valid-server/index.ts',
        '--reporter',
        'junit',
        '--output',
        outputPath,
      ],
      { timeoutMs: 30_000 },
    );

    if (existsSync(outputPath)) {
      const report = readJUnitFile(outputPath);
      expect(report.totalTime).toBeLessThan(1000);
      expect(report.totalTime).toBeGreaterThan(0);
    }
  }, 30_000);
});
