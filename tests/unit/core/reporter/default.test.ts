import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DefaultReporter } from '../../../../src/core/reporter/default.js';
import type {
  McptestConfig,
  TestReport,
  TestResult,
  TestSuite,
} from '../../../../src/types/index.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

// Use RegExp constructor to avoid biome's noControlCharactersInRegex rule.
// ESC is char code 27 (0x1b). String.fromCharCode avoids the literal control char.
const ESC = String.fromCharCode(27);
const ANSI_REGEX = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}

function makeConfig(overrides: Partial<McptestConfig> = {}): McptestConfig {
  return {
    server: 'my-server',
    transport: 'stdio',
    timeout: 30000,
    reporter: 'default',
    mode: 'conservative',
    specVersion: '2025-06-18',
    bail: false,
    verbose: false,
    json: false,
    noColor: false,
    ...overrides,
  };
}

function makePassResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    testId: 'test-1',
    status: 'PASS',
    category: 'SUCCESS',
    target: 'my-tool',
    message: 'call with minimal args',
    duration: 45,
    ...overrides,
  };
}

function makeFailResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    testId: 'test-2',
    status: 'FAIL',
    category: 'SCHEMA_ERROR',
    target: 'bad-tool',
    message: "inputSchema missing 'type' field",
    duration: 10,
    error: {
      code: 'E-001',
      hint: 'Add type: object to inputSchema',
    },
    ...overrides,
  };
}

function makeWarnResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    testId: 'test-3',
    status: 'WARNING',
    category: 'SCHEMA_ERROR',
    target: 'warn-tool',
    message: 'description is recommended',
    duration: 5,
    ...overrides,
  };
}

function makeSuite(results: TestResult[]): TestSuite {
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warned = results.filter((r) => r.status === 'WARNING').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  return {
    name: 'my-server',
    results,
    total: results.length,
    passed,
    failed,
    warned,
    skipped,
    duration: results.reduce((sum, r) => sum + r.duration, 0),
    verdict: failed > 0 ? 'FAIL' : 'PASS',
  };
}

function makeReport(suites: TestSuite[]): TestReport {
  const passed = suites.reduce((sum, s) => sum + s.passed, 0);
  const failed = suites.reduce((sum, s) => sum + s.failed, 0);
  const warned = suites.reduce((sum, s) => sum + s.warned, 0);
  const skipped = suites.reduce((sum, s) => sum + s.skipped, 0);
  const total = suites.reduce((sum, s) => sum + s.total, 0);
  const duration = suites.reduce((sum, s) => sum + s.duration, 0);
  return {
    suites,
    total,
    passed,
    failed,
    warned,
    skipped,
    duration,
    exitCode: failed > 0 ? 1 : 0,
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('DefaultReporter', () => {
  let reporter: DefaultReporter;
  let output: string;
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    output = '';
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    });
    reporter = new DefaultReporter();
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  // 1. PASS result prints ✓
  it('onTestResult with status PASS outputs ✓', () => {
    reporter.onTestResult(makePassResult());
    const plain = stripAnsi(output);
    expect(plain).toContain('✓');
  });

  // 2. FAIL result prints ✗ and error message
  it('onTestResult with status FAIL outputs ✗ and message', () => {
    reporter.onTestResult(makeFailResult());
    const plain = stripAnsi(output);
    expect(plain).toContain('✗');
    expect(plain).toContain("inputSchema missing 'type' field");
  });

  // 3. WARNING result prints ⚠
  it('onTestResult with status WARNING outputs ⚠', () => {
    reporter.onTestResult(makeWarnResult());
    const plain = stripAnsi(output);
    expect(plain).toContain('⚠');
  });

  // 4. onRunEnd outputs summary with "Tests:" containing pass/fail/total counts
  it('onRunEnd outputs summary with Tests: line containing counts', () => {
    const results = [makePassResult(), makePassResult({ testId: 'test-1b' }), makeFailResult()];
    const suite = makeSuite(results);
    const report = makeReport([suite]);
    reporter.onRunEnd(report);
    const plain = stripAnsi(output);
    expect(plain).toContain('Tests:');
    expect(plain).toContain('2 passed');
    expect(plain).toContain('1 failed');
    expect(plain).toContain('3 total');
  });

  // 5. NO_COLOR: output contains no ANSI escape codes
  it('when NO_COLOR=1, output contains no ANSI escape codes', () => {
    const originalNoColor = process.env.NO_COLOR;
    process.env.NO_COLOR = '1';

    // Re-instantiate reporter after setting NO_COLOR
    // chalk reads level at import time, so we test by stripping and confirming no codes remain
    const noColorReporter = new DefaultReporter({ noColor: true });
    noColorReporter.onTestResult(makePassResult());
    noColorReporter.onTestResult(makeFailResult());

    // With noColor:true, output should not contain ANSI codes
    const testAnsiRegex = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
    expect(testAnsiRegex.test(output)).toBe(false);

    process.env.NO_COLOR = originalNoColor ?? '';
    if (!originalNoColor) {
      process.env.NO_COLOR = undefined;
    }
  });

  // 6. onStart outputs "mcptest" and mode
  it('onStart outputs "mcptest" and mode', () => {
    reporter.onStart(makeConfig({ mode: 'conservative' }));
    const plain = stripAnsi(output);
    expect(plain).toContain('mcptest');
    expect(plain).toContain('conservative');
  });

  // Additional: onTestResult PASS includes tool name and message
  it('onTestResult PASS includes target name and message', () => {
    reporter.onTestResult(makePassResult({ target: 'my-tool', message: 'call with minimal args' }));
    const plain = stripAnsi(output);
    expect(plain).toContain('my-tool');
    expect(plain).toContain('call with minimal args');
  });

  // Additional: onTestResult PASS includes duration
  it('onTestResult PASS includes duration in ms', () => {
    reporter.onTestResult(makePassResult({ duration: 99 }));
    const plain = stripAnsi(output);
    expect(plain).toContain('99ms');
  });

  // Additional: onRunEnd outputs Test Suites line
  it('onRunEnd outputs Test Suites line', () => {
    const suite = makeSuite([makePassResult()]);
    const report = makeReport([suite]);
    reporter.onRunEnd(report);
    const plain = stripAnsi(output);
    expect(plain).toContain('Test Suites:');
  });

  // Additional: onRunEnd outputs Time line
  it('onRunEnd outputs Time line with duration', () => {
    const results = [makePassResult({ duration: 312 })];
    const suite = makeSuite(results);
    const report = makeReport([suite]);
    reporter.onRunEnd(report);
    const plain = stripAnsi(output);
    expect(plain).toContain('Time:');
  });

  // Additional: onSuiteEnd does not throw
  it('onSuiteEnd completes without error', () => {
    const suite = makeSuite([makePassResult()]);
    expect(() => reporter.onSuiteEnd(suite)).not.toThrow();
  });

  // Additional: onTestStart does not throw
  it('onTestStart completes without error', () => {
    expect(() => reporter.onTestStart('my-tool', 'call with minimal args')).not.toThrow();
  });
});
