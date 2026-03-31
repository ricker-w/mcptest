import {
  type Server as HttpServer,
  type IncomingMessage,
  type ServerResponse,
  createServer,
} from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/** A tool definition for the SSE fixture server */
export interface SseFixtureTool {
  name: string;
  description: string;
  inputSchema: object;
  handler: (args: unknown) => Promise<unknown>;
}

/** Options for starting the SSE fixture server */
export interface SseFixtureOptions {
  port: number;
  serverName?: string;
  tools?: SseFixtureTool[];
}

/** Result of starting the SSE fixture server */
export interface SseFixtureResult {
  port: number;
  cleanup: () => Promise<void>;
}

/**
 * Starts a test HTTP SSE MCP server using the MCP SDK's SSEServerTransport.
 * Provides a /sse endpoint for SSE connections and a /message endpoint for POST messages.
 *
 * @param options - Server configuration including port, name, and tool definitions
 * @returns port number and a cleanup function to call in afterEach
 */
export async function startSseFixtureServer(options: SseFixtureOptions): Promise<SseFixtureResult> {
  const { port, serverName = 'sse-fixture-server', tools = [] } = options;

  // Track active transports keyed by session ID so POST messages can be routed
  const transports = new Map<string, SSEServerTransport>();

  const mcpServer = new Server(
    { name: serverName, version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    const result = await tool.handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  });

  const httpServer: HttpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && req.url === '/sse') {
      // Establish a new SSE connection
      const transport = new SSEServerTransport('/message', res);
      transports.set(transport.sessionId, transport);

      transport.onclose = () => {
        transports.delete(transport.sessionId);
      };

      await mcpServer.connect(transport);
      await transport.start();
      return;
    }

    if (req.method === 'POST' && req.url?.startsWith('/message')) {
      // Route the POST to the correct transport via session ID
      const url = new URL(req.url, `http://localhost:${port}`);
      const sessionId = url.searchParams.get('sessionId');

      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId);
        await transport?.handlePostMessage(req, res);
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

  const cleanup = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await mcpServer.close();
  };

  return { port, cleanup };
}
