import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfigFile, resolveConfig } from '../../../src/cli/config.js';
import type { McptestConfig } from '../../../src/types/index.js';
import { DEFAULT_CONFIG } from '../../../src/types/index.js';

// Mock fs/promises for package.json reads
vi.mock('node:fs/promises');

// Mock server-detect module
vi.mock('../../../src/core/server-detect.js', () => ({
  readMcptestConfig: vi.fn(),
  detectServer: vi.fn(),
}));

import { detectServer, readMcptestConfig } from '../../../src/core/server-detect.js';

const mockReadFile = vi.mocked(readFile);
const mockReadMcptestConfig = vi.mocked(readMcptestConfig);
const mockDetectServer = vi.mocked(detectServer);

beforeEach(() => {
  vi.resetAllMocks();
  // Default: no package.json mcptest field
  mockReadFile.mockResolvedValue(JSON.stringify({ name: 'test-project' }) as unknown as Buffer);
  // Default: no config file
  mockReadMcptestConfig.mockResolvedValue(null);
  // Default: detectServer returns a dummy server path
  mockDetectServer.mockResolvedValue('dist/index.js');
});

describe('resolveConfig', () => {
  it('CLI options take priority over config file values (transport)', async () => {
    // Arrange: config file has transport='stdio', CLI has transport='sse'
    mockReadMcptestConfig.mockResolvedValue({ transport: 'stdio' });
    const cliOptions: Partial<McptestConfig> = { transport: 'sse', server: 'node server.js' };

    // Act
    const config = await resolveConfig(cliOptions, '/project');

    // Assert: CLI wins
    expect(config.transport).toBe('sse');
  });

  it('config file values take priority over package.json values', async () => {
    // Arrange: package.json has timeout=5000, config file has timeout=10000
    mockReadFile.mockResolvedValue(
      JSON.stringify({ name: 'test-project', mcptest: { timeout: 5000 } }) as unknown as Buffer,
    );
    mockReadMcptestConfig.mockResolvedValue({ timeout: 10000 });
    const cliOptions: Partial<McptestConfig> = { server: 'node server.js' };

    // Act
    const config = await resolveConfig(cliOptions, '/project');

    // Assert: config file wins over package.json
    expect(config.timeout).toBe(10000);
  });

  it('unspecified fields are filled with DEFAULT_CONFIG values', async () => {
    // Arrange: only server is specified in CLI options
    const cliOptions: Partial<McptestConfig> = { server: 'node server.js' };

    // Act
    const config = await resolveConfig(cliOptions, '/project');

    // Assert: defaults are applied for unspecified fields
    expect(config.transport).toBe(DEFAULT_CONFIG.transport);
    expect(config.timeout).toBe(DEFAULT_CONFIG.timeout);
    expect(config.reporter).toBe(DEFAULT_CONFIG.reporter);
    expect(config.mode).toBe(DEFAULT_CONFIG.mode);
    expect(config.bail).toBe(DEFAULT_CONFIG.bail);
    expect(config.verbose).toBe(DEFAULT_CONFIG.verbose);
    expect(config.json).toBe(DEFAULT_CONFIG.json);
    expect(config.noColor).toBe(DEFAULT_CONFIG.noColor);
  });

  it('uses only package.json and DEFAULT_CONFIG when config file does not exist', async () => {
    // Arrange: config file returns null (does not exist), package.json has reporter=junit
    mockReadMcptestConfig.mockResolvedValue(null);
    mockReadFile.mockResolvedValue(
      JSON.stringify({ name: 'test-project', mcptest: { reporter: 'junit' } }) as unknown as Buffer,
    );
    const cliOptions: Partial<McptestConfig> = { server: 'node server.js' };

    // Act
    const config = await resolveConfig(cliOptions, '/project');

    // Assert: package.json value is used, defaults fill the rest
    expect(config.reporter).toBe('junit');
    expect(config.timeout).toBe(DEFAULT_CONFIG.timeout);
  });

  it('calls detectServer() when server is not specified in CLI options', async () => {
    // Arrange: no server in CLI options
    const cliOptions: Partial<McptestConfig> = {};
    mockDetectServer.mockResolvedValue('auto-detected-server.js');

    // Act
    const config = await resolveConfig(cliOptions, '/project');

    // Assert: detectServer was called and result is used
    expect(mockDetectServer).toHaveBeenCalledWith(undefined, '/project');
    expect(config.server).toBe('auto-detected-server.js');
  });

  it('does NOT call detectServer() when server is specified in CLI options', async () => {
    // Arrange: server is provided via CLI
    const cliOptions: Partial<McptestConfig> = { server: 'node my-server.js' };

    // Act
    const config = await resolveConfig(cliOptions, '/project');

    // Assert: detectServer should not be called
    expect(mockDetectServer).not.toHaveBeenCalled();
    expect(config.server).toBe('node my-server.js');
  });
});

describe('loadConfigFile', () => {
  it('returns config when readMcptestConfig returns a partial config', async () => {
    // Arrange
    const partialConfig: Partial<McptestConfig> = { transport: 'sse', timeout: 5000 };
    mockReadMcptestConfig.mockResolvedValue(partialConfig);

    // Act
    const result = await loadConfigFile('/project');

    // Assert
    expect(result).toEqual(partialConfig);
    expect(mockReadMcptestConfig).toHaveBeenCalledWith('/project');
  });

  it('returns null when readMcptestConfig returns null (config file not found)', async () => {
    // Arrange
    mockReadMcptestConfig.mockResolvedValue(null);

    // Act
    const result = await loadConfigFile('/project');

    // Assert
    expect(result).toBeNull();
  });
});
