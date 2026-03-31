import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McptestError } from '../types/index.js';
import type { McptestConfig } from '../types/index.js';

export type McpTransport = StdioClientTransport | SSEClientTransport;

/**
 * 設定に基づいてトランスポートを生成するファクトリ
 */
export function createTransport(config: McptestConfig): McpTransport {
  if (config.transport === 'sse') {
    if (!config.url) {
      throw new McptestError(
        'E-002',
        'SSE transport requires a URL. Set the url option in your mcptest configuration.',
        { hint: 'Add `url: "http://localhost:PORT"` to your mcptest config.' },
      );
    }
    return new SSEClientTransport(new URL(config.url));
  }

  const options = buildStdioOptions(config);
  return new StdioClientTransport(options);
}

/**
 * stdio Transport 用のプロセス起動オプションを生成
 */
export function buildStdioOptions(config: McptestConfig): {
  command: string;
  args: string[];
  env?: Record<string, string>;
} {
  const tokens = config.server.split(' ');
  const command = tokens[0] as string;
  const baseArgs = tokens.slice(1);
  const args = [...baseArgs, ...(config.serverArgs ?? [])];

  if (config.env !== undefined) {
    return { command, args, env: config.env };
  }

  return { command, args };
}
