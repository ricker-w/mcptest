import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { detectServer, readMcptestConfig } from '../core/server-detect.js';
import { DEFAULT_CONFIG } from '../types/index.js';
import type { McptestConfig } from '../types/index.js';

/**
 * mcptest.config.ts を動的 import で読み込む
 * （server-detect.ts の readMcptestConfig を内部で呼ぶ）
 */
export async function loadConfigFile(cwd: string): Promise<Partial<McptestConfig> | null> {
  return readMcptestConfig(cwd);
}

/**
 * package.json の "mcptest" フィールドを読み込む
 * ファイルが存在しない場合や "mcptest" フィールドが存在しない場合は {} を返す
 */
async function loadPackageJsonConfig(cwd: string): Promise<Partial<McptestConfig>> {
  const pkgPath = join(cwd, 'package.json');
  try {
    const raw = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw) as { mcptest?: Partial<McptestConfig> };
    return pkg.mcptest ?? {};
  } catch {
    return {};
  }
}

/**
 * 設定解決の優先順位:
 * 1. CLI オプション（最高優先）
 * 2. mcptest.config.ts（ファイルが存在する場合）
 * 3. package.json の "mcptest" フィールド
 * 4. DEFAULT_CONFIG（最低優先）
 *
 * server が未設定の場合は detectServer() を呼ぶ
 */
export async function resolveConfig(
  cliOptions: Partial<McptestConfig>,
  cwd: string = process.cwd(),
): Promise<McptestConfig> {
  const [fromConfigFile, fromPackageJson] = await Promise.all([
    loadConfigFile(cwd),
    loadPackageJsonConfig(cwd),
  ]);

  const merged: McptestConfig = {
    ...DEFAULT_CONFIG,
    ...fromPackageJson,
    ...(fromConfigFile ?? {}),
    ...cliOptions,
  };

  // server が未設定の場合は detectServer() を呼ぶ
  if (!merged.server) {
    merged.server = await detectServer(undefined, cwd);
  }

  return merged;
}
