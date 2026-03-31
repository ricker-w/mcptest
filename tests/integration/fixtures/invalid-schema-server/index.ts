import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'invalid-schema-server', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
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

const transport = new StdioServerTransport();
await server.connect(transport);
