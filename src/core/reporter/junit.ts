import { writeFileSync } from 'node:fs';
import type { McptestConfig, TestReport, TestResult, TestSuite } from '../../types/index.js';

// ─── Reporter interface ──────────────────────────────────────────────────────

/**
 * Reporter interface for mcptest.
 * Implementations receive lifecycle events and produce output (console, file, etc.).
 */
export interface Reporter {
  onStart(config: McptestConfig): void;
  onTestStart(toolName: string, testName: string): void;
  onTestResult(result: TestResult): void;
  onSuiteEnd(suite: TestSuite): void;
  onRunEnd(report: TestReport): void;
}

// ─── XML helpers ─────────────────────────────────────────────────────────────

/**
 * Escape XML special characters to prevent malformed XML.
 *
 * Handles: & < > " '
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format duration from milliseconds to seconds with 3 decimal places.
 * Example: 312ms → "0.312"
 */
function formatTime(ms: number): string {
  return (ms / 1000).toFixed(3);
}

// ─── XML builder ─────────────────────────────────────────────────────────────

/**
 * Build a JUnit-compatible XML string from a TestReport.
 *
 * WARNING results are treated as normal testcases (no <failure> element,
 * not counted in failures attribute).
 *
 * @param report - The complete test run report
 * @returns A valid JUnit XML string
 */
export function buildJUnitXml(report: TestReport): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<testsuites name="mcptest" tests="${report.total}" failures="${report.failed}" time="${formatTime(report.duration)}">`,
  );

  for (const suite of report.suites) {
    lines.push(
      `  <testsuite name="${escapeXml(suite.name)}" tests="${suite.total}" failures="${suite.failed}" time="${formatTime(suite.duration)}">`,
    );

    for (const result of suite.results) {
      const testcaseName = escapeXml(`${result.target}: ${result.message}`);
      const timeAttr = formatTime(result.duration);

      if (result.status === 'FAIL') {
        const failureMessage = escapeXml(`${result.category}: ${result.message}`);
        const failureBody = result.error ? buildFailureBody(result) : escapeXml(result.message);

        lines.push(`    <testcase name="${testcaseName}" classname="mcptest" time="${timeAttr}">`);
        lines.push(
          `      <failure message="${failureMessage}" type="${escapeXml(result.category)}">`,
        );
        lines.push(`        ${failureBody}`);
        lines.push('      </failure>');
        lines.push('    </testcase>');
      } else {
        lines.push(`    <testcase name="${testcaseName}" classname="mcptest" time="${timeAttr}"/>`);
      }
    }

    lines.push('  </testsuite>');
  }

  lines.push('</testsuites>');

  return lines.join('\n');
}

/**
 * Build the text body of a <failure> element from TestErrorDetail.
 */
function buildFailureBody(result: TestResult): string {
  const parts: string[] = [];
  const err = result.error;

  if (!err) {
    return escapeXml(result.message);
  }

  if (err.expected !== undefined && err.actual !== undefined) {
    parts.push(escapeXml(`Expected ${result.target} to be ${err.expected}, got ${err.actual}`));
  } else if (err.expected !== undefined) {
    parts.push(escapeXml(`Expected: ${err.expected}`));
  } else if (err.actual !== undefined) {
    parts.push(escapeXml(`Actual: ${err.actual}`));
  }

  if (err.hint !== undefined) {
    parts.push(escapeXml(`Hint: ${err.hint}`));
  }

  if (err.stack !== undefined) {
    parts.push(escapeXml(err.stack));
  }

  return parts.length > 0 ? parts.join('\n        ') : escapeXml(result.message);
}

// ─── JUnitReporter class ──────────────────────────────────────────────────────

/**
 * JUnit XML reporter.
 *
 * Collects test lifecycle events and writes a JUnit-compatible XML file
 * when the test run completes.
 */
export class JUnitReporter implements Reporter {
  constructor(private readonly outputPath: string) {}

  onStart(_config: McptestConfig): void {
    // No-op: JUnit reporter accumulates results and writes on completion
  }

  onTestStart(_toolName: string, _testName: string): void {
    // No-op: individual test start is not tracked in JUnit XML
  }

  onTestResult(_result: TestResult): void {
    // No-op: results are captured via onRunEnd through the TestReport
  }

  onSuiteEnd(_suite: TestSuite): void {
    // No-op: suite data is captured via onRunEnd through the TestReport
  }

  /**
   * Build XML from the complete report and write it to the output file.
   * Why: JUnit consumers (CI tools, IDEs) expect a single file written at run end.
   */
  onRunEnd(report: TestReport): void {
    const xml = buildJUnitXml(report);
    writeFileSync(this.outputPath, xml, 'utf-8');
  }
}
