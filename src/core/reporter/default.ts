import chalk, { Chalk } from 'chalk';
import type { McptestConfig, TestReport, TestResult, TestSuite } from '../../types/index.js';

// ─── Reporter interface ───────────────────────────────────────────────────────

export interface Reporter {
  onStart(config: McptestConfig): void;
  onTestStart(toolName: string, testName: string): void;
  onTestResult(result: TestResult): void;
  onSuiteEnd(suite: TestSuite): void;
  onRunEnd(report: TestReport): void;
}

// ─── Options ─────────────────────────────────────────────────────────────────

export interface DefaultReporterOptions {
  /** Disable color output (also honoured via NO_COLOR env var) */
  noColor?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VERSION = '0.1.0';

/**
 * Returns a chalk instance that respects the noColor flag.
 * chalk automatically respects NO_COLOR env var, but we also support
 * an explicit noColor option for programmatic use.
 */
function makeChalk(noColor: boolean): typeof chalk {
  if (noColor) {
    // Chalk constructor with level 0 disables all colour codes
    return new Chalk({ level: 0 });
  }
  return chalk;
}

function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms}ms`;
}

// ─── DefaultReporter ─────────────────────────────────────────────────────────

export class DefaultReporter implements Reporter {
  private readonly c: typeof chalk;

  constructor(options: DefaultReporterOptions = {}) {
    const noColor = options.noColor === true || process.env.NO_COLOR !== undefined;
    this.c = makeChalk(noColor);
  }

  /** Called once before any tests run. */
  onStart(config: McptestConfig): void {
    const { c } = this;
    process.stdout.write(
      `\n${c.bold('mcptest')} ${c.dim(`v${VERSION}`)}  ${c.dim(`(mode: ${config.mode})`)}\n\n`,
    );
  }

  /** Called before each individual test. Currently a no-op. */
  onTestStart(_toolName: string, _testName: string): void {
    // no-op — reserved for verbose/watch modes
  }

  /** Called with the result of each individual test. */
  onTestResult(result: TestResult): void {
    const { c } = this;
    const { status, target, message, duration } = result;

    const durationStr = duration > 0 ? ` (${formatDuration(duration)})` : '';

    if (status === 'PASS') {
      process.stdout.write(
        `  ${c.green('✓')} ${c.dim(`${target}:`)} ${message}${c.dim(durationStr)}\n`,
      );
    } else if (status === 'FAIL') {
      process.stdout.write(`  ${c.red('✗')} ${c.dim(`${target}:`)} ${c.red(message)}\n`);
      if (result.error?.hint !== undefined) {
        process.stdout.write(`    ${c.dim('hint:')} ${result.error.hint}\n`);
      }
    } else if (status === 'WARNING') {
      process.stdout.write(
        `  ${c.yellow('⚠')} ${c.dim(`${target}:`)} ${c.yellow(message)}${c.dim(durationStr)}\n`,
      );
    } else {
      // SKIP
      process.stdout.write(`  ${c.dim('-')} ${c.dim(`${target}:`)} ${c.dim(message)}\n`);
    }
  }

  /** Called after each suite completes. Currently a no-op. */
  onSuiteEnd(_suite: TestSuite): void {
    // no-op — summary is printed in onRunEnd
  }

  /** Called once after all suites complete. Prints the summary block. */
  onRunEnd(report: TestReport): void {
    const { c } = this;
    const { suites, total, passed, failed, warned, duration } = report;

    process.stdout.write('\n');

    // ── Test Suites line ──────────────────────────────────────────────────
    const suitePassed = suites.filter((s) => s.verdict === 'PASS').length;
    const suiteFailed = suites.filter((s) => s.verdict === 'FAIL').length;
    const suiteTotal = suites.length;

    const suiteSummaryParts: string[] = [];
    if (suitePassed > 0) {
      suiteSummaryParts.push(c.green(`${suitePassed} passed`));
    }
    if (suiteFailed > 0) {
      suiteSummaryParts.push(c.red(`${suiteFailed} failed`));
    }
    suiteSummaryParts.push(`${suiteTotal} total`);

    process.stdout.write(`${c.bold('Test Suites:')} ${suiteSummaryParts.join(', ')}\n`);

    // ── Tests line ────────────────────────────────────────────────────────
    const testSummaryParts: string[] = [];
    if (passed > 0) {
      testSummaryParts.push(c.green(`${passed} passed`));
    }
    if (failed > 0) {
      testSummaryParts.push(c.red(`${failed} failed`));
    }
    if (warned > 0) {
      testSummaryParts.push(c.yellow(`${warned} warning${warned > 1 ? 's' : ''}`));
    }
    testSummaryParts.push(`${total} total`);

    process.stdout.write(`${c.bold('Tests:')}       ${testSummaryParts.join(', ')}\n`);

    // ── Time line ─────────────────────────────────────────────────────────
    process.stdout.write(`${c.bold('Time:')}        ${formatDuration(duration)}\n`);

    process.stdout.write('\n');
  }
}
