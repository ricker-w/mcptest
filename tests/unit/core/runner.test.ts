import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Reporter } from '../../../src/core/reporter/default.js';
import type { McpClient } from '../../../src/mcp/client.js';
import type { McptestConfig, TestReport } from '../../../src/types/index.js';

// ─── Shared mock objects ──────────────────────────────────────────────────────

const echoTool = {
  name: 'echo',
  description: 'Echoes back',
  inputSchema: {
    type: 'object',
    description: 'Echo input',
    properties: { message: { type: 'string', description: 'msg' } },
    required: ['message'],
  },
};

const addTool = {
  name: 'add',
  description: 'Adds numbers',
  inputSchema: {
    type: 'object',
    description: 'Add input',
    properties: {
      a: { type: 'number', description: 'first number' },
      b: { type: 'number', description: 'second number' },
    },
    required: ['a', 'b'],
  },
};

const invalidSchemaTool = {
  name: 'bad-tool',
  description: 'Has missing type',
  inputSchema: {
    // intentionally missing 'type' field
    description: 'missing type field',
    properties: { x: { type: 'string', description: 'x' } },
  },
};

function makeMockClient(overrides: Partial<typeof mockClientBase> = {}): McpClient {
  return { ...mockClientBase, ...overrides } as unknown as McpClient;
}

const mockClientBase = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  listTools: vi.fn().mockResolvedValue([echoTool]),
  callTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
  getServerInfo: vi.fn().mockReturnValue({
    name: 'test-server',
    version: '1.0.0',
    capabilities: {},
    toolCount: 0,
    resourceCount: 0,
    promptCount: 0,
    transport: 'stdio',
  }),
};

function makeMockReporter(): Reporter {
  return {
    onStart: vi.fn(),
    onTestStart: vi.fn(),
    onTestResult: vi.fn(),
    onSuiteEnd: vi.fn(),
    onRunEnd: vi.fn(),
  };
}

const defaultConfig: McptestConfig = {
  server: 'node test-server.js',
  transport: 'stdio',
  timeout: 5000,
  reporter: 'default',
  mode: 'conservative',
  specVersion: '2025-06-18',
  bail: false,
  verbose: false,
  json: false,
  noColor: true,
};

// ─── Import under test (after mocks) ─────────────────────────────────────────

const { TestRunner } = await import('../../../src/core/runner.js');

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Reset default mock implementations after clearAllMocks
  mockClientBase.connect.mockResolvedValue(undefined);
  mockClientBase.disconnect.mockResolvedValue(undefined);
  mockClientBase.listTools.mockResolvedValue([echoTool]);
  mockClientBase.callTool.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
  mockClientBase.getServerInfo.mockReturnValue({
    name: 'test-server',
    version: '1.0.0',
    capabilities: {},
    toolCount: 0,
    resourceCount: 0,
    promptCount: 0,
    transport: 'stdio',
  });
});

describe('TestRunner.run()', () => {
  it('returns exitCode 0 for valid tools with successful callTool responses', async () => {
    const client = makeMockClient();
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, defaultConfig, reporter);

    const report: TestReport = await runner.run();

    expect(report.exitCode).toBe(0);
    expect(report.failed).toBe(0);
    expect(report.passed).toBeGreaterThan(0);
  });

  it('returns failed > 0 for a tool with invalid schema (missing type)', async () => {
    const client = makeMockClient({
      listTools: vi.fn().mockResolvedValue([invalidSchemaTool]),
    });
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, defaultConfig, reporter);

    const report: TestReport = await runner.run();

    expect(report.failed).toBeGreaterThan(0);
    expect(report.exitCode).toBe(1);
  });

  it('maps SCHEMA_ERROR category to status FAIL', async () => {
    const client = makeMockClient({
      listTools: vi.fn().mockResolvedValue([invalidSchemaTool]),
    });
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, defaultConfig, reporter);

    const report: TestReport = await runner.run();

    const failResults = report.suites
      .flatMap((s) => s.results)
      .filter((r) => r.category === 'SCHEMA_ERROR');

    expect(failResults.length).toBeGreaterThan(0);
    for (const r of failResults) {
      expect(r.status).toBe('FAIL');
    }
  });

  it('maps RESPONSE_ERROR category to status WARNING when callTool throws', async () => {
    const client = makeMockClient({
      callTool: vi.fn().mockRejectedValue(new Error('server error')),
    });
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, defaultConfig, reporter);

    const report: TestReport = await runner.run();

    const warnResults = report.suites
      .flatMap((s) => s.results)
      .filter((r) => r.category === 'RESPONSE_ERROR');

    expect(warnResults.length).toBeGreaterThan(0);
    for (const r of warnResults) {
      expect(r.status).toBe('WARNING');
    }
    // RESPONSE_ERROR does not count as FAIL
    expect(report.failed).toBe(0);
    expect(report.exitCode).toBe(0);
  });

  it('stops after first FAIL when bail=true', async () => {
    // Two tools: first has invalid schema (FAIL), second is valid.
    // With bail=true, the second tool should be skipped.
    const client = makeMockClient({
      listTools: vi.fn().mockResolvedValue([invalidSchemaTool, echoTool]),
    });
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, { ...defaultConfig, bail: true }, reporter);

    const report: TestReport = await runner.run();

    const allResults = report.suites.flatMap((s) => s.results);
    const skippedResults = allResults.filter((r) => r.status === 'SKIP');

    expect(report.failed).toBeGreaterThan(0);
    expect(skippedResults.length).toBeGreaterThan(0);
  });

  it('only tests matching tools when filter is set', async () => {
    const client = makeMockClient({
      listTools: vi.fn().mockResolvedValue([echoTool, addTool]),
    });
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, { ...defaultConfig, filter: 'echo' }, reporter);

    const report: TestReport = await runner.run();

    const allResults = report.suites.flatMap((s) => s.results);
    // 'add' tool results should be SKIP, 'echo' tool should have test results
    const addResults = allResults.filter((r) => r.target === 'add');
    const echoResults = allResults.filter((r) => r.target === 'echo');

    expect(addResults.every((r) => r.status === 'SKIP')).toBe(true);
    expect(echoResults.length).toBeGreaterThan(0);
    expect(echoResults.some((r) => r.status !== 'SKIP')).toBe(true);
  });

  it('calls reporter lifecycle hooks in order', async () => {
    const callOrder: string[] = [];

    const reporter: Reporter = {
      onStart: vi.fn().mockImplementation(() => {
        callOrder.push('onStart');
      }),
      onTestStart: vi.fn(),
      onTestResult: vi.fn().mockImplementation(() => {
        callOrder.push('onTestResult');
      }),
      onSuiteEnd: vi.fn().mockImplementation(() => {
        callOrder.push('onSuiteEnd');
      }),
      onRunEnd: vi.fn().mockImplementation(() => {
        callOrder.push('onRunEnd');
      }),
    };

    const client = makeMockClient();
    const runner = new TestRunner(client, defaultConfig, reporter);
    await runner.run();

    expect(reporter.onStart).toHaveBeenCalledWith(defaultConfig);
    expect(reporter.onTestResult).toHaveBeenCalled();
    expect(reporter.onSuiteEnd).toHaveBeenCalled();
    expect(reporter.onRunEnd).toHaveBeenCalled();

    // Verify order
    expect(callOrder[0]).toBe('onStart');
    expect(callOrder[callOrder.length - 2]).toBe('onSuiteEnd');
    expect(callOrder[callOrder.length - 1]).toBe('onRunEnd');
  });

  it('treats callTool result with isError:true as RESPONSE_ERROR (WARNING)', async () => {
    const client = makeMockClient({
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'error occurred' }],
        isError: true,
      }),
    });
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, defaultConfig, reporter);

    const report: TestReport = await runner.run();

    const warnResults = report.suites
      .flatMap((s) => s.results)
      .filter((r) => r.category === 'RESPONSE_ERROR');

    expect(warnResults.length).toBeGreaterThan(0);
    for (const r of warnResults) {
      expect(r.status).toBe('WARNING');
    }
    expect(report.failed).toBe(0);
    expect(report.exitCode).toBe(0);
  });

  it('connects and disconnects the client during run', async () => {
    const client = makeMockClient();
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, defaultConfig, reporter);

    await runner.run();

    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });

  it('returns a TestReport with consistent aggregate counts', async () => {
    const client = makeMockClient({
      listTools: vi.fn().mockResolvedValue([echoTool, addTool]),
    });
    const reporter = makeMockReporter();
    const runner = new TestRunner(client, defaultConfig, reporter);

    const report: TestReport = await runner.run();

    const suite = report.suites[0];
    expect(report.total).toBe(suite.total);
    expect(report.passed).toBe(suite.passed);
    expect(report.failed).toBe(suite.failed);
    expect(report.warned).toBe(suite.warned);
    expect(report.skipped).toBe(suite.skipped);
    expect(report.duration).toBe(suite.duration);
  });
});
