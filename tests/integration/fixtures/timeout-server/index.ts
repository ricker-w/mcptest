import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'timeout-server', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'echo',
      description: 'Echoes back the input message',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message to echo' },
        },
        required: ['message'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async () => {
  // Infinite wait — used for timeout testing
  await new Promise<never>(() => {});
  return { content: [] }; // unreachable
});

const transport = new StdioServerTransport();
await server.connect(transport);
