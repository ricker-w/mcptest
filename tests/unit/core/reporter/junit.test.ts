import { describe, expect, it } from 'vitest';
import { buildJUnitXml } from '../../../../src/core/reporter/junit.js';
import type { TestReport, TestResult, TestSuite } from '../../../../src/types/index.js';

// ─── Test fixtures ──────────────────────────────────────────────────────────

function makeResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    testId: 'test-1',
    status: 'PASS',
    category: 'SUCCESS',
    target: 'my-tool',
    message: 'response format valid',
    duration: 12,
    ...overrides,
  };
}

function makeSuite(results: TestResult[], name = 'conservative'): TestSuite {
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const warned = results.filter((r) => r.status === 'WARNING').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  const duration = results.reduce((sum, r) => sum + r.duration, 0);
  return {
    name,
    results,
    total: results.length,
    passed,
    failed,
    warned,
    skipped,
    duration,
    verdict: failed > 0 ? 'FAIL' : 'PASS',
  };
}

function makeReport(suites: TestSuite[]): TestReport {
  const total = suites.reduce((s, suite) => s + suite.total, 0);
  const failed = suites.reduce((s, suite) => s + suite.failed, 0);
  const passed = suites.reduce((s, suite) => s + suite.passed, 0);
  const warned = suites.reduce((s, suite) => s + suite.warned, 0);
  const skipped = suites.reduce((s, suite) => s + suite.skipped, 0);
  const duration = suites.reduce((s, suite) => s + suite.duration, 0);
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

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('buildJUnitXml', () => {
  it('starts with valid XML declaration', () => {
    const report = makeReport([makeSuite([makeResult()])]);
    const xml = buildJUnitXml(report);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it('generates failures="0" when all tests pass', () => {
    const results = [
      makeResult({ testId: 'test-1', status: 'PASS', duration: 12 }),
      makeResult({ testId: 'test-2', status: 'PASS', duration: 20 }),
    ];
    const report = makeReport([makeSuite(results)]);
    const xml = buildJUnitXml(report);
    expect(xml).toContain('failures="0"');
    expect(xml).not.toContain('<failure');
  });

  it('includes <failure> element for FAIL results', () => {
    const results = [
      makeResult({ testId: 'test-1', status: 'PASS', duration: 12 }),
      makeResult({
        testId: 'test-2',
        status: 'FAIL',
        category: 'SCHEMA_ERROR',
        target: 'bad-tool',
        message: "SCHEMA_ERROR: inputSchema missing 'type' field",
        duration: 23,
        error: {
          expected: "'object'",
          actual: 'undefined',
        },
      }),
    ];
    const report = makeReport([makeSuite(results)]);
    const xml = buildJUnitXml(report);
    expect(xml).toContain('failures="1"');
    expect(xml).toContain('<failure');
    expect(xml).toContain('</failure>');
  });

  it('outputs time in seconds with 3 decimal places (ms / 1000)', () => {
    const results = [makeResult({ duration: 312 })];
    const report = makeReport([makeSuite(results)]);
    const xml = buildJUnitXml(report);
    // Suite and testsuites time should be 0.312
    expect(xml).toMatch(/time="0\.312"/);
  });

  it('escapes XML special characters in tool names and messages', () => {
    const results = [
      makeResult({
        testId: 'test-esc',
        status: 'FAIL',
        category: 'SCHEMA_ERROR',
        target: 'tool<>&"\'',
        message: 'error: a < b && c > d "quoted" \'single\'',
        duration: 10,
      }),
    ];
    const report = makeReport([makeSuite(results)]);
    const xml = buildJUnitXml(report);
    expect(xml).toContain('&lt;');
    expect(xml).toContain('&gt;');
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&quot;');
    expect(xml).toContain('&apos;');
    // Original unescaped special chars should not appear literally in attribute values
    // (check that < > & are gone; ' is encoded as &apos; so the raw char only appears inside the entity)
    expect(xml).not.toMatch(/name="[^"]*[<>]/);
  });

  it('treats WARNING as normal testcase (no <failure> element, not counted in failures)', () => {
    const results = [
      makeResult({ testId: 'test-1', status: 'PASS', duration: 10 }),
      makeResult({
        testId: 'test-2',
        status: 'WARNING',
        category: 'SCHEMA_ERROR',
        target: 'warn-tool',
        message: 'minor schema issue',
        duration: 15,
      }),
    ];
    const report = makeReport([makeSuite(results)]);
    const xml = buildJUnitXml(report);
    expect(xml).toContain('failures="0"');
    expect(xml).not.toContain('<failure');
  });

  it('reflects correct test totals in testsuites and testsuite tests attribute', () => {
    const results = [
      makeResult({ testId: 'test-1', status: 'PASS', duration: 10 }),
      makeResult({ testId: 'test-2', status: 'PASS', duration: 20 }),
      makeResult({ testId: 'test-3', status: 'FAIL', category: 'PROTOCOL_ERROR', duration: 30 }),
      makeResult({ testId: 'test-4', status: 'WARNING', duration: 5 }),
      makeResult({ testId: 'test-5', status: 'PASS', duration: 8 }),
    ];
    const report = makeReport([makeSuite(results)]);
    const xml = buildJUnitXml(report);
    // testsuites and testsuite should both have tests="5"
    expect(xml).toMatch(/<testsuites[^>]*tests="5"/);
    expect(xml).toMatch(/<testsuite[^>]*tests="5"/);
  });

  it('uses suite name in testsuite name attribute', () => {
    const report = makeReport([makeSuite([makeResult()], 'my-suite')]);
    const xml = buildJUnitXml(report);
    expect(xml).toContain('name="my-suite"');
  });

  it('includes testcase name composed of target and message', () => {
    const results = [
      makeResult({
        testId: 'test-1',
        target: 'initialize',
        message: 'response format valid',
        duration: 12,
      }),
    ];
    const report = makeReport([makeSuite(results)]);
    const xml = buildJUnitXml(report);
    expect(xml).toContain('name="initialize: response format valid"');
  });
});
