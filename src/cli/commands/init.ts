import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface InitOptions {
  directory?: string;
  template?: 'basic' | 'full';
  force?: boolean;
}

// ─── Template content constants ─────────────────────────────────────────────

const BASIC_CONFIG = `import type { McptestConfig } from 'mcptest';

export default {
  server: 'node dist/index.js',
  transport: 'stdio',
  timeout: 30000,
  mode: 'conservative',
} satisfies Partial<McptestConfig>;
`;

const FULL_CONFIG = BASIC_CONFIG;

const GITHUB_ACTIONS_WORKFLOW = `name: mcptest
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx mcptest run --reporter junit --output test-results.xml
      - uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results.xml
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

async function writeTemplateFile(filePath: string, content: string, force: boolean): Promise<void> {
  if (!force && (await fileExists(filePath))) {
    throw new Error(
      `File already exists: ${filePath}. Use force=true to overwrite. Why: mcptest init will not silently overwrite your config. How to fix: pass --force to overwrite.`,
    );
  }
  await ensureDir(dirname(filePath));
  await writeFile(filePath, content, 'utf-8');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * mcptest.config.ts とテンプレートファイルを生成する。
 * @throws Error 既存ファイルがある場合（force=false 時）
 */
export async function runInit(options: InitOptions = {}): Promise<void> {
  const { directory = process.cwd(), template = 'basic', force = false } = options;

  // Ensure the target directory exists
  await ensureDir(directory);

  const configPath = join(directory, 'mcptest.config.ts');

  if (template === 'full') {
    // Write config
    await writeTemplateFile(configPath, FULL_CONFIG, force);

    // Write GitHub Actions workflow
    const workflowPath = join(directory, '.github', 'workflows', 'mcptest.yml');
    await writeTemplateFile(workflowPath, GITHUB_ACTIONS_WORKFLOW, force);
  } else {
    // basic (default)
    await writeTemplateFile(configPath, BASIC_CONFIG, force);
  }
}
