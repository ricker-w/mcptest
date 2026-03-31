import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import type { McpClient } from '../../../../src/mcp/client.js';
import type { TestReport } from '../../../../src/types/index.js';

// ─── Module mocks (declared before imports) ──────────────────────────────────

vi.mock('../../../../src/cli/config.js', () => ({
  resolveConfig: vi.fn(),
}));

vi.mock('../../../../src/mcp/transport.js', () => ({
  createTransport: vi.fn(),
}));

vi.mock('../../../../src/mcp/client.js', () => ({
  McpClient: vi.fn(),
}));

vi.mock('../../../../src/core/runner.js', () => ({
  TestRunner: vi.fn(),
}));

vi.mock('../../../../src/core/reporter/default.js', () => ({
  DefaultReporter: vi.fn(),
}));

vi.mock('../../../../src/core/reporter/junit.js', () => ({
  JUnitReporter: vi.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { runCommand } from '../../../../src/cli/commands/run.js';
import { resolveConfig } from '../../../../src/cli/config.js';
import { DefaultReporter as MockDefaultReporter } from '../../../../src/core/reporter/default.js';
import { JUnitReporter as MockJUnitReporter } from '../../../../src/core/reporter/junit.js';
import { TestRunner as MockTestRunner } from '../../../../src/core/runner.js';
import { McpClient as MockMcpClient } from '../../../../src/mcp/client.js';
import { createTransport } from '../../../../src/mcp/transport.js';
import type { DEFAULT_CONFIG } from '../../../../src/types/index.js';

// ─── Typed mock helpers ───────────────────────────────────────────────────────

const mockedResolveConfig = resolveConfig as MockedFunction<typeof resolveConfig>;
const mockedCreateTransport = createTransport as MockedFunction<typeof createTransport>;
const MockMcpClientCtor = MockMcpClient as unknown as MockedFunction<
  new (
    ...args: unknown[]
  ) => McpClient
>;
const MockTestRunnerCtor = MockTestRunner as unknown as MockedFunction<
  new (
    ...args: unknown[]
  ) => { run: () => Promise<TestReport> }
>;
const MockDefaultReporterCtor = MockDefaultReporter as unknown as MockedFunction<new () => object>;
const MockJUnitReporterCtor = MockJUnitReporter as unknown as MockedFunction<
  new (
    path: string,
  ) => object
>;

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<typeof DEFAULT_CONFIG> = {}) {
  return {
    server: 'node server.js',
    transport: 'stdio' as const,
    timeout: 30000,
    reporter: 'default' as const,
    mode: 'conservative' as const,
    specVersion: '2025-06-18',
    bail: false,
    verbose: false,
    json: false,
    noColor: false,
    ...overrides,
  };
}

function makePassReport(): TestReport {
  return {
    suites: [],
    total: 1,
    passed: 1,
    failed: 0,
    warned: 0,
    skipped: 0,
    duration: 100,
    exitCode: 0,
  };
}

function makeFailReport(): TestReport {
  return {
    suites: [],
    total: 2,
    passed: 1,
    failed: 1,
    warned: 0,
    skipped: 0,
    duration: 200,
    exitCode: 1,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('runCommand', () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockTransport: object;
  let mockClientInstance: { run?: () => Promise<TestReport> };
  let mockRunnerInstance: { run: () => Promise<TestReport> };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock process.exit to throw so tests can detect the exit code
    mockExit = vi.spyOn(process, 'exit').mockImplementation((_code) => {
      throw new Error(`process.exit(${_code})`);
    });

    mockTransport = {};
    mockClientInstance = {};
    mockRunnerInstance = { run: vi.fn() };

    mockedCreateTransport.mockReturnValue(mockTransport as ReturnType<typeof createTransport>);
    MockMcpClientCtor.mockReturnValue(mockClientInstance as McpClient);
    MockTestRunnerCtor.mockReturnValue(mockRunnerInstance);
    MockDefaultReporterCtor.mockReturnValue({});
    MockJUnitReporterCtor.mockReturnValue({});
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it('calls process.exit(0) when all tests pass', async () => {
    // Arrange
    const config = makeConfig();
    mockedResolveConfig.mockResolvedValue(config);
    (mockRunnerInstance.run as MockedFunction<() => Promise<TestReport>>).mockResolvedValue(
      makePassReport(),
    );

    // Act & Assert
    await expect(runCommand({})).rejects.toThrow('process.exit(0)');
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('calls process.exit(1) when tests fail', async () => {
    // Arrange
    const config = makeConfig();
    mockedResolveConfig.mockResolvedValue(config);
    (mockRunnerInstance.run as MockedFunction<() => Promise<TestReport>>).mockResolvedValue(
      makeFailReport(),
    );

    // Act & Assert
    await expect(runCommand({})).rejects.toThrow('process.exit(1)');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('uses JUnitReporter when reporter option is "junit"', async () => {
    // Arrange
    const config = makeConfig({ reporter: 'junit', output: 'results.xml' });
    mockedResolveConfig.mockResolvedValue(config);
    (mockRunnerInstance.run as MockedFunction<() => Promise<TestReport>>).mockResolvedValue(
      makePassReport(),
    );

    // Act
    await expect(runCommand({ reporter: 'junit', output: 'results.xml' })).rejects.toThrow(
      'process.exit(0)',
    );

    // Assert
    expect(MockJUnitReporterCtor).toHaveBeenCalledTimes(1);
    expect(MockDefaultReporterCtor).not.toHaveBeenCalled();
  });

  it('uses DefaultReporter when reporter option is "default"', async () => {
    // Arrange
    const config = makeConfig({ reporter: 'default' });
    mockedResolveConfig.mockResolvedValue(config);
    (mockRunnerInstance.run as MockedFunction<() => Promise<TestReport>>).mockResolvedValue(
      makePassReport(),
    );

    // Act
    await expect(runCommand({ reporter: 'default' })).rejects.toThrow('process.exit(0)');

    // Assert
    expect(MockDefaultReporterCtor).toHaveBeenCalledTimes(1);
    expect(MockJUnitReporterCtor).not.toHaveBeenCalled();
  });

  it('uses DefaultReporter when reporter option is omitted', async () => {
    // Arrange
    const config = makeConfig();
    mockedResolveConfig.mockResolvedValue(config);
    (mockRunnerInstance.run as MockedFunction<() => Promise<TestReport>>).mockResolvedValue(
      makePassReport(),
    );

    // Act
    await expect(runCommand({})).rejects.toThrow('process.exit(0)');

    // Assert
    expect(MockDefaultReporterCtor).toHaveBeenCalledTimes(1);
    expect(MockJUnitReporterCtor).not.toHaveBeenCalled();
  });

  it('passes CLI options to resolveConfig', async () => {
    // Arrange
    const options = {
      server: 'node my-server.js',
      transport: 'sse' as const,
      timeout: 5000,
      mode: 'strict' as const,
      reporter: 'junit' as const,
      output: 'out.xml',
      filter: 'my-tool',
      bail: true,
      verbose: true,
    };
    const config = makeConfig({ ...options });
    mockedResolveConfig.mockResolvedValue(config);
    (mockRunnerInstance.run as MockedFunction<() => Promise<TestReport>>).mockResolvedValue(
      makePassReport(),
    );

    // Act
    await expect(runCommand(options)).rejects.toThrow('process.exit(0)');

    // Assert: resolveConfig is called with the CLI options mapped to McptestConfig shape
    expect(mockedResolveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        server: 'node my-server.js',
        transport: 'sse',
        timeout: 5000,
        mode: 'strict',
        reporter: 'junit',
        output: 'out.xml',
        filter: 'my-tool',
        bail: true,
        verbose: true,
      }),
    );
  });

  it('JUnitReporter defaults output path to "test-results.xml" when output is not set', async () => {
    // Arrange
    const config = makeConfig({ reporter: 'junit' });
    mockedResolveConfig.mockResolvedValue(config);
    (mockRunnerInstance.run as MockedFunction<() => Promise<TestReport>>).mockResolvedValue(
      makePassReport(),
    );

    // Act
    await expect(runCommand({ reporter: 'junit' })).rejects.toThrow('process.exit(0)');

    // Assert: JUnitReporter constructed with fallback path
    expect(MockJUnitReporterCtor).toHaveBeenCalledWith('test-results.xml');
  });
});
