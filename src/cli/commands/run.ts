import { DefaultReporter } from '../../core/reporter/default.js';
import { JUnitReporter } from '../../core/reporter/junit.js';
import { TestRunner } from '../../core/runner.js';
import { McpClient } from '../../mcp/client.js';
import { createTransport } from '../../mcp/transport.js';
import type { McptestConfig } from '../../types/index.js';
import { resolveConfig } from '../config.js';

// ─── RunCommandOptions ────────────────────────────────────────────────────────

export interface RunCommandOptions {
  server?: string;
  transport?: 'stdio' | 'sse';
  timeout?: number;
  mode?: 'conservative' | 'strict';
  reporter?: 'default' | 'junit';
  output?: string;
  filter?: string;
  bail?: boolean;
  verbose?: boolean;
}

// ─── runCommand ───────────────────────────────────────────────────────────────

/**
 * mcptest run コマンドの実行関数。
 * CLI から渡されたオプションを解決し、MCP サーバーに接続してテストを実行する。
 * 完了後に process.exit(exitCode) を呼ぶ。
 */
export async function runCommand(options: RunCommandOptions): Promise<void> {
  // Build partial config from CLI options (undefined values are omitted so
  // resolveConfig can apply lower-priority sources correctly).
  const cliPartial: Partial<McptestConfig> = {};

  if (options.server !== undefined) cliPartial.server = options.server;
  if (options.transport !== undefined) cliPartial.transport = options.transport;
  if (options.timeout !== undefined) cliPartial.timeout = options.timeout;
  if (options.mode !== undefined) cliPartial.mode = options.mode;
  if (options.reporter !== undefined) cliPartial.reporter = options.reporter;
  if (options.output !== undefined) cliPartial.output = options.output;
  if (options.filter !== undefined) cliPartial.filter = options.filter;
  if (options.bail !== undefined) cliPartial.bail = options.bail;
  if (options.verbose !== undefined) cliPartial.verbose = options.verbose;

  // 1. Resolve configuration (CLI > mcptest.config.ts > package.json > defaults)
  const config = await resolveConfig(cliPartial);

  // 2. Create transport based on resolved config
  const transport = createTransport(config);

  // 3. Create MCP client
  const client = new McpClient(transport, { timeout: config.timeout, verbose: config.verbose });

  // 4. Select reporter
  const reporter =
    config.reporter === 'junit'
      ? new JUnitReporter(config.output ?? 'test-results.xml')
      : new DefaultReporter();

  // 5. Run tests
  const runner = new TestRunner(client, config, reporter);
  const report = await runner.run();

  // 6. Exit with appropriate code
  process.exit(report.exitCode);
}
