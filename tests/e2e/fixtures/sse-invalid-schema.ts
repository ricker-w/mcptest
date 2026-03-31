import { createServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * SSE transport 対応のスキーマ不正な MCP フィクスチャサーバー。
 * tools: broken（inputSchema に type フィールドが欠損）
 *
 * 使用方法:
 *   const cleanup = await startSseInvalidSchemaServer(3101);
 *   // テスト実行
 *   await cleanup();
 */
export async function startSseInvalidSchemaServer(port: number): Promise<() => Promise<void>> {
  const transports: Map<string, SSEServerTransport> = new Map();

  const mcpServer = new Server(
    { name: 'sse-invalid-schema-server', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'broken',
        description: 'A broken tool with invalid schema',
        inputSchema: {
          // type field intentionally missing to simulate invalid schema
          properties: {
            input: { type: 'string', description: 'Some input' },
          },
        } as Record<string, unknown>,
      },
    ],
  }));

  const httpServer = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/sse') {
      const transport = new SSEServerTransport('/message', res);
      transports.set(transport.sessionId, transport);
      await mcpServer.connect(transport);
      res.on('close', () => {
        transports.delete(transport.sessionId);
      });
      return;
    }

    if (req.method === 'POST' && req.url?.startsWith('/message')) {
      const sessionId = new URL(req.url, 'http://localhost').searchParams.get('sessionId') ?? '';
      const transport = transports.get(sessionId);
      if (transport) {
        await transport.handlePostMessage(req, res);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Session not found');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, '127.0.0.1', resolve);
    httpServer.on('error', reject);
  });

  return async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await mcpServer.close();
  };
}
