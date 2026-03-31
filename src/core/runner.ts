import type { McpClient } from '../mcp/client.js';
import type { McpTool, McptestConfig, TestReport, TestResult, TestSuite } from '../types/index.js';
import { generateTestCases } from './generator.js';
import type { Reporter } from './reporter/default.js';
import { validateToolSchemas } from './validator.js';

// ─── TestRunner ───────────────────────────────────────────────────────────────

/**
 * Core test execution engine for mcptest conservative mode.
 *
 * Execution flow:
 *   1. reporter.onStart
 *   2. client.connect
 *   3. Verify server info (PROTOCOL_ERROR if missing)
 *   4. listTools
 *   5. Schema validation tests (SCHEMA_ERROR → FAIL)
 *   6. Callability tests (RESPONSE_ERROR → WARNING, TIMEOUT → WARNING)
 *   7. reporter.onSuiteEnd
 *   8. client.disconnect
 *   9. reporter.onRunEnd
 *  10. Return TestReport
 */
export class TestRunner {
  constructor(
    private readonly client: McpClient,
    private readonly config: McptestConfig,
    private readonly reporter: Reporter,
  ) {}

  async run(): Promise<TestReport> {
    const suiteStart = Date.now();
    this.reporter.onStart(this.config);

    await this.client.connect();

    const results: TestResult[] = [];
    let bailed = false;

    // ── Protocol check: serverInfo must be present after connect ───────────
    const serverInfo = this.client.getServerInfo();
    const protocolResult = buildProtocolResult(serverInfo);
    results.push(protocolResult);
    this.reporter.onTestResult(protocolResult);

    if (protocolResult.status === 'FAIL' && this.config.bail) {
      bailed = true;
    }

    // ── Fetch tools ────────────────────────────────────────────────────────
    const allTools: McpTool[] = bailed ? [] : await this.client.listTools();

    // ── Apply filter ───────────────────────────────────────────────────────
    const { filter } = this.config;
    const testedTools: McpTool[] = [];
    const skippedTools: McpTool[] = [];

    for (const tool of allTools) {
      if (filter !== undefined && tool.name !== filter) {
        skippedTools.push(tool);
      } else {
        testedTools.push(tool);
      }
    }

    // Emit SKIP results for filtered-out tools
    for (const tool of skippedTools) {
      const skipResult: TestResult = {
        testId: `schema/${tool.name}`,
        status: 'SKIP',
        category: 'SUCCESS',
        target: tool.name,
        message: `skipped (filter: ${filter ?? ''})`,
        duration: 0,
      };
      results.push(skipResult);
      this.reporter.onTestResult(skipResult);

      const callSkip: TestResult = {
        testId: `call/${tool.name}`,
        status: 'SKIP',
        category: 'SUCCESS',
        target: tool.name,
        message: `skipped (filter: ${filter ?? ''})`,
        duration: 0,
      };
      results.push(callSkip);
      this.reporter.onTestResult(callSkip);
    }

    // ── Schema validation tests ────────────────────────────────────────────
    for (const tool of testedTools) {
      if (bailed) {
        const skipResult = buildSkipResult(`schema/${tool.name}`, tool.name, 'bail');
        results.push(skipResult);
        this.reporter.onTestResult(skipResult);
        continue;
      }

      const schemaResult = runSchemaValidation(tool);
      results.push(schemaResult);
      this.reporter.onTestResult(schemaResult);

      if (schemaResult.status === 'FAIL' && this.config.bail) {
        bailed = true;
      }
    }

    // ── Call tests ─────────────────────────────────────────────────────────
    for (const tool of testedTools) {
      if (bailed) {
        const skipResult = buildSkipResult(`call/${tool.name}`, tool.name, 'bail');
        results.push(skipResult);
        this.reporter.onTestResult(skipResult);
        continue;
      }

      const callResult = await runCallTest(this.client, tool, this.config.timeout);
      results.push(callResult);
      this.reporter.onTestResult(callResult);

      if (callResult.status === 'FAIL' && this.config.bail) {
        bailed = true;
      }
    }

    // ── Assemble suite ─────────────────────────────────────────────────────
    const suiteDuration = Date.now() - suiteStart;
    const suite = buildSuite(results, suiteDuration);

    this.reporter.onSuiteEnd(suite);

    await this.client.disconnect();

    const report: TestReport = {
      suites: [suite],
      total: suite.total,
      passed: suite.passed,
      failed: suite.failed,
      warned: suite.warned,
      skipped: suite.skipped,
      duration: suite.duration,
      exitCode: suite.failed > 0 ? 1 : 0,
    };

    this.reporter.onRunEnd(report);

    return report;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProtocolResult(serverInfo: ReturnType<McpClient['getServerInfo']>): TestResult {
  if (serverInfo === undefined) {
    return {
      testId: 'protocol/initialize',
      status: 'FAIL',
      category: 'PROTOCOL_ERROR',
      target: 'server',
      message:
        'Server did not return serverInfo after initialize. Expected serverInfo to be present.',
      duration: 0,
      error: {
        code: 'E-002',
        expected: 'serverInfo object with name and version',
        actual: 'undefined',
        hint: 'Ensure the server returns a valid initialize response with serverInfo.',
      },
    };
  }

  return {
    testId: 'protocol/initialize',
    status: 'PASS',
    category: 'SUCCESS',
    target: 'server',
    message: `server "${serverInfo.name}" v${serverInfo.version} responded to initialize`,
    duration: 0,
  };
}

function runSchemaValidation(tool: McpTool): TestResult {
  const start = Date.now();
  const validationResult = validateToolSchemas([tool]);
  const duration = Date.now() - start;

  if (!validationResult.valid) {
    const firstError = validationResult.errors[0];
    return {
      testId: `schema/${tool.name}`,
      status: 'FAIL',
      category: 'SCHEMA_ERROR',
      target: tool.name,
      message: firstError?.message ?? 'Schema validation failed',
      duration,
      error: {
        code: 'E-004',
        expected: 'valid JSON Schema Draft 7 with type "object" and properties',
        actual: firstError?.field ?? 'unknown field',
        ...(firstError?.message !== undefined ? { hint: firstError.message } : {}),
      },
    };
  }

  return {
    testId: `schema/${tool.name}`,
    status: 'PASS',
    category: 'SUCCESS',
    target: tool.name,
    message: 'schema is valid',
    duration,
  };
}

async function runCallTest(client: McpClient, tool: McpTool, timeout: number): Promise<TestResult> {
  const start = Date.now();
  const testCases = generateTestCases(tool);
  const testCase = testCases[0];

  // testCase should always exist since generateTestCases always returns at least one entry
  if (testCase === undefined) {
    return {
      testId: `call/${tool.name}`,
      status: 'SKIP',
      category: 'SUCCESS',
      target: tool.name,
      message: 'no test cases generated',
      duration: 0,
    };
  }

  const callPromise = client.callTool(tool.name, testCase.input);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new TimeoutError()), timeout),
  );

  try {
    const result = await Promise.race([callPromise, timeoutPromise]);
    const duration = Date.now() - start;

    if (result.isError === true) {
      return {
        testId: `call/${tool.name}`,
        status: 'WARNING',
        category: 'RESPONSE_ERROR',
        target: tool.name,
        message: `tool returned isError:true for input: ${testCase.description}`,
        duration,
        error: {
          hint: 'The tool returned an error response. Check the tool implementation.',
        },
      };
    }

    return {
      testId: `call/${tool.name}`,
      status: 'PASS',
      category: 'SUCCESS',
      target: tool.name,
      message: `callable with ${testCase.description}`,
      duration,
    };
  } catch (err) {
    const duration = Date.now() - start;

    if (err instanceof TimeoutError) {
      return {
        testId: `call/${tool.name}`,
        status: 'WARNING',
        category: 'TIMEOUT',
        target: tool.name,
        message: `timed out after ${timeout}ms`,
        duration,
        error: {
          code: 'E-003',
          hint: `The tool call exceeded ${timeout}ms. Consider increasing timeout or checking server performance.`,
        },
      };
    }

    const message = err instanceof Error ? err.message : String(err);
    return {
      testId: `call/${tool.name}`,
      status: 'WARNING',
      category: 'RESPONSE_ERROR',
      target: tool.name,
      message: `tool call threw an error: ${message}`,
      duration,
      error: {
        hint: 'The tool call raised an unexpected exception. Check the tool implementation.',
        ...(err instanceof Error && err.stack !== undefined ? { stack: err.stack } : {}),
      },
    };
  }
}

function buildSkipResult(testId: string, target: string, reason: string): TestResult {
  return {
    testId,
    status: 'SKIP',
    category: 'SUCCESS',
    target,
    message: `skipped (${reason})`,
    duration: 0,
  };
}

function buildSuite(results: TestResult[], duration: number): TestSuite {
  let passed = 0;
  let failed = 0;
  let warned = 0;
  let skipped = 0;

  for (const r of results) {
    switch (r.status) {
      case 'PASS':
        passed++;
        break;
      case 'FAIL':
        failed++;
        break;
      case 'WARNING':
        warned++;
        break;
      case 'SKIP':
        skipped++;
        break;
    }
  }

  return {
    name: 'mcptest conservative suite',
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

// ─── Internal error classes ───────────────────────────────────────────────────

class TimeoutError extends Error {
  constructor() {
    super('Timeout');
    this.name = 'TimeoutError';
  }
}
