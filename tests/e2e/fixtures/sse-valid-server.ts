import { createServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * SSE transport 対応の正常な MCP フィクスチャサーバー。
 * tools: echo（string→string）, add（number+number→number）
 *
 * 使用方法:
 *   const cleanup = await startSseValidServer(3100);
 *   // テスト実行
 *   await cleanup();
 */
export async function startSseValidServer(port: number): Promise<() => Promise<void>> {
  const transports: Map<string, SSEServerTransport> = new Map();

  const mcpServer = new Server(
    { name: 'sse-valid-server', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'echo',
        description: 'Echoes back the input message',
        inputSchema: {
          type: 'object',
          properties: { message: { type: 'string', description: 'Message to echo' } },
          required: ['message'],
        },
      },
      {
        name: 'add',
        description: 'Adds two numbers together',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'First number' },
            b: { type: 'number', description: 'Second number' },
          },
          required: ['a', 'b'],
        },
      },
    ],
  }));

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'echo') {
      const { message } = args as { message: string };
      return { content: [{ type: 'text', text: message }] };
    }

    if (name === 'add') {
      const { a, b } = args as { a: number; b: number };
      return { content: [{ type: 'text', text: String(a + b) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

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
