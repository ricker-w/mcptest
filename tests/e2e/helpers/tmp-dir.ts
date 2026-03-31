import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Creates a temporary directory with an optional prefix.
 * Returns the directory path and a cleanup function that removes it.
 *
 * @param prefix - Directory name prefix (default: "mcptest-e2e-")
 * @returns Object containing the directory path and an async cleanup function
 *
 * @example
 * const { dir, cleanup } = await createTmpDir();
 * try {
 *   // use dir...
 * } finally {
 *   await cleanup();
 * }
 */
export async function createTmpDir(
  prefix = 'mcptest-e2e-',
): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), prefix));

  const cleanup = async (): Promise<void> => {
    await rm(dir, { recursive: true, force: true });
  };

  return { dir, cleanup };
}
