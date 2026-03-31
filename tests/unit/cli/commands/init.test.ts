import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runInit } from '../../../../src/cli/commands/init.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'mcptest-init-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true });
});

describe('runInit', () => {
  it('basic template generates mcptest.config.ts', async () => {
    // Arrange & Act
    await runInit({ directory: tmpDir, template: 'basic' });

    // Assert: file exists
    await expect(access(join(tmpDir, 'mcptest.config.ts'))).resolves.toBeUndefined();
  });

  it('generated basic mcptest.config.ts contains "conservative"', async () => {
    // Arrange & Act
    await runInit({ directory: tmpDir, template: 'basic' });

    // Assert: content includes conservative
    const content = await readFile(join(tmpDir, 'mcptest.config.ts'), 'utf-8');
    expect(content).toContain('conservative');
  });

  it('full template generates mcptest.config.ts and .github/workflows/mcptest.yml', async () => {
    // Arrange & Act
    await runInit({ directory: tmpDir, template: 'full' });

    // Assert: both files exist
    await expect(access(join(tmpDir, 'mcptest.config.ts'))).resolves.toBeUndefined();
    await expect(
      access(join(tmpDir, '.github', 'workflows', 'mcptest.yml')),
    ).resolves.toBeUndefined();
  });

  it('full workflows file contains "mcptest"', async () => {
    // Arrange & Act
    await runInit({ directory: tmpDir, template: 'full' });

    // Assert: yml content includes 'mcptest'
    const content = await readFile(join(tmpDir, '.github', 'workflows', 'mcptest.yml'), 'utf-8');
    expect(content).toContain('mcptest');
  });

  it('directory option changes output destination', async () => {
    // Arrange: nested subdirectory that does not yet exist
    const subDir = join(tmpDir, 'sub', 'project');

    // Act
    await runInit({ directory: subDir, template: 'basic' });

    // Assert: file is in the specified directory
    await expect(access(join(subDir, 'mcptest.config.ts'))).resolves.toBeUndefined();
  });

  it('throws an error when file already exists and force=false', async () => {
    // Arrange: pre-create the config file
    await writeFile(join(tmpDir, 'mcptest.config.ts'), '// existing content');

    // Act & Assert
    await expect(runInit({ directory: tmpDir, template: 'basic', force: false })).rejects.toThrow();
  });

  it('overwrites existing file when force=true', async () => {
    // Arrange: pre-create the config file with known content
    await writeFile(join(tmpDir, 'mcptest.config.ts'), '// old content');

    // Act
    await runInit({ directory: tmpDir, template: 'basic', force: true });

    // Assert: content was replaced (no longer contains the old content)
    const content = await readFile(join(tmpDir, 'mcptest.config.ts'), 'utf-8');
    expect(content).not.toContain('// old content');
    expect(content).toContain('conservative');
  });

  it('default template (no template option) behaves like basic', async () => {
    // Arrange & Act: no template specified
    await runInit({ directory: tmpDir });

    // Assert: mcptest.config.ts exists and has conservative
    const content = await readFile(join(tmpDir, 'mcptest.config.ts'), 'utf-8');
    expect(content).toContain('conservative');

    // Assert: no workflows file (basic behavior)
    await expect(access(join(tmpDir, '.github', 'workflows', 'mcptest.yml'))).rejects.toThrow();
  });
});
