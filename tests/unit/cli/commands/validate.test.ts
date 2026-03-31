import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../../src/cli/config.js', () => ({
  resolveConfig: vi.fn(),
}));

vi.mock('../../../../src/mcp/transport.js', () => ({
  createTransport: vi.fn(),
}));

vi.mock('../../../../src/mcp/client.js', () => ({
  McpClient: vi.fn(),
}));

vi.mock('../../../../src/core/validator.js', () => ({
  validateToolSchemas: vi.fn(),
}));

import { validateCommand } from '../../../../src/cli/commands/validate.js';
import { resolveConfig } from '../../../../src/cli/config.js';
import { validateToolSchemas } from '../../../../src/core/validator.js';
import { McpClient } from '../../../../src/mcp/client.js';
import { createTransport } from '../../../../src/mcp/transport.js';
import type { McptestConfig } from '../../../../src/types/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockConfig: McptestConfig = {
  server: 'node dist/index.js',
  transport: 'stdio',
  timeout: 30000,
  reporter: 'default',
  mode: 'conservative',
  specVersion: '2025-06-18',
  bail: false,
  verbose: false,
  json: false,
  noColor: true,
};

const mockTool = {
  name: 'test-tool',
  description: 'A test tool',
  inputSchema: { type: 'object', properties: {}, description: 'No params' },
};

function makeMockClient() {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue([mockTool]),
    listResources: vi.fn().mockResolvedValue([]),
    listPrompts: vi.fn().mockResolvedValue([]),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('validateCommand', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let mockClient: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    // Make process.exit throw so the test can catch the "exit"
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
      throw new Error(`process.exit(${code})`);
    });

    mockClient = makeMockClient();

    vi.mocked(resolveConfig).mockResolvedValue(mockConfig);
    vi.mocked(createTransport).mockReturnValue({} as ReturnType<typeof createTransport>);
    vi.mocked(McpClient).mockImplementation(() => mockClient as unknown as McpClient);
    vi.mocked(validateToolSchemas).mockReturnValue({ valid: true, errors: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Test 1: valid tools → process.exit(0) ─────────────────────────────────

  it('calls process.exit(0) when tools are valid (no errors)', async () => {
    // Arrange
    vi.mocked(validateToolSchemas).mockReturnValue({ valid: true, errors: [] });

    // Act & Assert
    await expect(validateCommand('tools', {})).rejects.toThrow('process.exit(0)');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  // ─── Test 2: invalid tools → process.exit(1) ──────────────────────────────

  it('calls process.exit(1) when tools have validation errors', async () => {
    // Arrange
    vi.mocked(validateToolSchemas).mockReturnValue({
      valid: false,
      errors: [
        {
          toolName: 'bad-tool',
          field: 'inputSchema.type',
          message: 'inputSchema.type is missing.',
        },
      ],
    });

    // Act & Assert
    await expect(validateCommand('tools', {})).rejects.toThrow('process.exit(1)');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // ─── Test 3: target='tools' → client.listTools() is called ───────────────

  it('calls client.listTools() when target is "tools"', async () => {
    // Arrange: valid result so it reaches disconnect
    vi.mocked(validateToolSchemas).mockReturnValue({ valid: true, errors: [] });

    // Act
    await expect(validateCommand('tools', {})).rejects.toThrow('process.exit(0)');

    // Assert
    expect(mockClient.listTools).toHaveBeenCalledOnce();
    expect(mockClient.listResources).not.toHaveBeenCalled();
    expect(mockClient.listPrompts).not.toHaveBeenCalled();
  });

  // ─── Test 4: resolveConfig is called with the provided options ────────────

  it('calls resolveConfig with the provided CLI options', async () => {
    // Arrange
    const options = { server: 'node server.js', timeout: 5000 };
    vi.mocked(validateToolSchemas).mockReturnValue({ valid: true, errors: [] });

    // Act
    await expect(validateCommand('tools', options)).rejects.toThrow('process.exit(0)');

    // Assert
    expect(resolveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ server: 'node server.js', timeout: 5000 }),
    );
  });

  // ─── Test 5: client.connect() and client.disconnect() are called ──────────

  it('calls client.connect() and client.disconnect()', async () => {
    // Arrange
    vi.mocked(validateToolSchemas).mockReturnValue({ valid: true, errors: [] });

    // Act
    await expect(validateCommand('tools', {})).rejects.toThrow('process.exit(0)');

    // Assert
    expect(mockClient.connect).toHaveBeenCalledOnce();
    expect(mockClient.disconnect).toHaveBeenCalledOnce();
  });

  // ─── Additional: target='resources' ──────────────────────────────────────

  it('calls client.listResources() when target is "resources"', async () => {
    // Arrange: resources with valid URIs
    mockClient.listResources.mockResolvedValue([{ uri: 'file:///test', name: 'test' }]);

    // Act
    await expect(validateCommand('resources', {})).rejects.toThrow('process.exit(0)');

    // Assert
    expect(mockClient.listResources).toHaveBeenCalledOnce();
    expect(mockClient.listTools).not.toHaveBeenCalled();
  });

  // ─── Additional: target='prompts' ─────────────────────────────────────────

  it('calls client.listPrompts() when target is "prompts"', async () => {
    // Arrange: prompts with valid names
    mockClient.listPrompts.mockResolvedValue([{ name: 'my-prompt' }]);

    // Act
    await expect(validateCommand('prompts', {})).rejects.toThrow('process.exit(0)');

    // Assert
    expect(mockClient.listPrompts).toHaveBeenCalledOnce();
    expect(mockClient.listTools).not.toHaveBeenCalled();
  });

  // ─── Additional: resources missing URI → process.exit(1) ─────────────────

  it('calls process.exit(1) when a resource is missing its URI', async () => {
    // Arrange: resource with empty uri
    mockClient.listResources.mockResolvedValue([{ uri: '', name: 'bad-resource' }]);

    // Act & Assert
    await expect(validateCommand('resources', {})).rejects.toThrow('process.exit(1)');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // ─── Additional: prompts missing name → process.exit(1) ───────────────────

  it('calls process.exit(1) when a prompt is missing its name', async () => {
    // Arrange: prompt with empty name
    mockClient.listPrompts.mockResolvedValue([{ name: '' }]);

    // Act & Assert
    await expect(validateCommand('prompts', {})).rejects.toThrow('process.exit(1)');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // ─── Additional: disconnect is called even when validation fails ──────────

  it('calls client.disconnect() even when validation errors occur', async () => {
    // Arrange
    vi.mocked(validateToolSchemas).mockReturnValue({
      valid: false,
      errors: [{ toolName: 'bad', field: 'inputSchema.type', message: 'missing type' }],
    });

    // Act
    await expect(validateCommand('tools', {})).rejects.toThrow('process.exit(1)');

    // Assert: disconnect is still called (cleanup)
    expect(mockClient.disconnect).toHaveBeenCalledOnce();
  });

  // ─── Additional: default target is 'tools' ────────────────────────────────

  it('defaults to target="tools" when no target argument is provided', async () => {
    // Arrange
    vi.mocked(validateToolSchemas).mockReturnValue({ valid: true, errors: [] });

    // Act: call with no arguments
    await expect(validateCommand()).rejects.toThrow('process.exit(0)');

    // Assert: listTools was used
    expect(mockClient.listTools).toHaveBeenCalledOnce();
  });
});
