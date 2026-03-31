import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { McptestConfig } from '../types/index.js';
import { McptestError } from '../types/index.js';

/**
 * package.json の型（検出に必要なフィールドのみ）
 */
interface PackageJson {
  mcptest?: {
    serverCommand?: string;
  };
  bin?: string | Record<string, string>;
}

/**
 * MCPサーバーエントリポイントを自動検出する（5段階フォールバック）
 *
 * フォールバック順:
 * 1. CLI --server オプション（cliOption 引数）
 * 2. mcptest.config.ts の server フィールド（readMcptestConfig 経由）
 * 3. package.json の "mcptest".serverCommand フィールド
 * 4. package.json の "bin" フィールドの最初のエントリ
 * 5. src/index.ts / index.ts / dist/index.js の存在確認
 * → 全て失敗した場合: McptestError(E-001) をスロー
 */
export async function detectServer(
  cliOption?: string,
  cwd: string = process.cwd(),
): Promise<string> {
  // Fallback 1: CLI option
  if (cliOption !== undefined && cliOption !== '') {
    return cliOption;
  }

  // Fallback 2: mcptest.config.ts
  const mcptestConfig = await readMcptestConfig(cwd);
  if (mcptestConfig?.server !== undefined && mcptestConfig.server !== '') {
    return mcptestConfig.server;
  }

  // Fallback 3 & 4: package.json
  const pkgServer = await detectFromPackageJson(cwd);
  if (pkgServer !== null) {
    return pkgServer;
  }

  // Fallback 5: filesystem candidates
  const candidates = ['src/index.ts', 'index.ts', 'dist/index.js'];
  for (const candidate of candidates) {
    if (existsSync(join(cwd, candidate))) {
      return candidate;
    }
  }

  // All fallbacks exhausted
  throw new McptestError('E-001', 'Could not detect MCP server entry point.', {
    hint: 'Specify the server with --server option, or add "mcptest.serverCommand" to package.json.',
  });
}

/**
 * package.json から server コマンドを検出する
 * - "mcptest".serverCommand フィールド（Fallback 3）
 * - "bin" フィールドの最初のエントリ（Fallback 4）
 * 見つからない場合は null を返す
 */
async function detectFromPackageJson(cwd: string): Promise<string | null> {
  const pkgPath = join(cwd, 'package.json');
  let pkg: PackageJson;

  try {
    const raw = await readFile(pkgPath, 'utf-8');
    pkg = JSON.parse(raw) as PackageJson;
  } catch {
    return null;
  }

  // Fallback 3: mcptest.serverCommand
  if (pkg.mcptest?.serverCommand !== undefined && pkg.mcptest.serverCommand !== '') {
    return pkg.mcptest.serverCommand;
  }

  // Fallback 4: bin field
  if (pkg.bin !== undefined) {
    if (typeof pkg.bin === 'string') {
      return pkg.bin;
    }
    // Object: return value of first key
    const firstValue = Object.values(pkg.bin)[0];
    if (firstValue !== undefined) {
      return firstValue;
    }
  }

  return null;
}

/**
 * mcptest.config.ts を動的 import で読み込む（存在しない場合は null を返す）
 */
export async function readMcptestConfig(cwd: string): Promise<Partial<McptestConfig> | null> {
  const configPath = join(cwd, 'mcptest.config.ts');
  try {
    const mod = await import(configPath);
    // Support both default export and named export
    const config: unknown = mod.default ?? mod;
    return config as Partial<McptestConfig>;
  } catch {
    return null;
  }
}
