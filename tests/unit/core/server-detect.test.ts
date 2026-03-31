import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { detectServer, readMcptestConfig } from '../../../src/core/server-detect.js';
import { McptestError } from '../../../src/types/index.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

const mockExistsSync = vi.mocked(existsSync);
const mockReadFile = vi.mocked(readFile);

describe('detectServer', () => {
  it('returns cliOption directly when provided, without further fallbacks', async () => {
    // Arrange: no filesystem calls should be made
    mockExistsSync.mockReturnValue(false);
    mockReadFile.mockRejectedValue(new Error('should not be called'));

    // Act
    const result = await detectServer('node my-server.js', '/project');

    // Assert
    expect(result).toBe('node my-server.js');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('returns mcptest.serverCommand from package.json when present', async () => {
    // Arrange
    mockExistsSync.mockReturnValue(false);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        name: 'my-mcp-server',
        mcptest: { serverCommand: 'node dist/server.js' },
      }) as unknown as Buffer,
    );

    // Act
    const result = await detectServer(undefined, '/project');

    // Assert
    expect(result).toBe('node dist/server.js');
  });

  it('returns first bin entry from package.json when bin is an object', async () => {
    // Arrange
    mockExistsSync.mockReturnValue(false);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        name: 'my-mcp-server',
        bin: { 'my-server': './dist/server.js', other: './dist/other.js' },
      }) as unknown as Buffer,
    );

    // Act
    const result = await detectServer(undefined, '/project');

    // Assert
    expect(result).toBe('./dist/server.js');
  });

  it('returns bin value directly when bin is a string', async () => {
    // Arrange
    mockExistsSync.mockReturnValue(false);
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        name: 'my-mcp-server',
        bin: './dist/server.js',
      }) as unknown as Buffer,
    );

    // Act
    const result = await detectServer(undefined, '/project');

    // Assert
    expect(result).toBe('./dist/server.js');
  });

  it('returns src/index.ts when it exists and no package.json entries found', async () => {
    // Arrange: package.json has no mcptest or bin fields
    mockReadFile.mockResolvedValue(JSON.stringify({ name: 'my-mcp-server' }) as unknown as Buffer);
    mockExistsSync.mockImplementation((p) => String(p) === '/project/src/index.ts');

    // Act
    const result = await detectServer(undefined, '/project');

    // Assert
    expect(result).toBe('src/index.ts');
  });

  it('returns index.ts when it exists and src/index.ts does not', async () => {
    // Arrange
    mockReadFile.mockResolvedValue(JSON.stringify({ name: 'my-mcp-server' }) as unknown as Buffer);
    // Only /project/index.ts exists — NOT /project/src/index.ts
    mockExistsSync.mockImplementation((p) => {
      const path = String(p);
      return path === '/project/index.ts';
    });

    // Act
    const result = await detectServer(undefined, '/project');

    // Assert
    expect(result).toBe('index.ts');
  });

  it('returns dist/index.js when it exists and ts files do not', async () => {
    // Arrange
    mockReadFile.mockResolvedValue(JSON.stringify({ name: 'my-mcp-server' }) as unknown as Buffer);
    mockExistsSync.mockImplementation((p) => String(p) === '/project/dist/index.js');

    // Act
    const result = await detectServer(undefined, '/project');

    // Assert
    expect(result).toBe('dist/index.js');
  });

  it('throws McptestError with code E-001 when all fallbacks fail', async () => {
    // Arrange
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    mockExistsSync.mockReturnValue(false);

    // Act & Assert
    await expect(detectServer(undefined, '/project')).rejects.toThrow(McptestError);
    await expect(detectServer(undefined, '/project')).rejects.toMatchObject({
      code: 'E-001',
    });
  });
});

describe('readMcptestConfig', () => {
  it('returns null when config file does not exist', async () => {
    // Arrange: dynamic import will fail
    // The function uses try/catch around dynamic import, so a non-existent path returns null
    const result = await readMcptestConfig('/nonexistent/path/that/does/not/exist');

    // Assert
    expect(result).toBeNull();
  });
});
