import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'valid-server', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'echo',
      description: 'Echoes back the input message',
      inputSchema: {
        type: 'object',
        description: 'Echoes back the input message',
        properties: {
          message: { type: 'string', description: 'Message to echo' },
        },
        required: ['message'],
      },
    },
    {
      name: 'add',
      description: 'Adds two numbers together',
      inputSchema: {
        type: 'object',
        description: 'Adds two numbers together',
        properties: {
          a: { type: 'number', description: 'First number' },
          b: { type: 'number', description: 'Second number' },
        },
        required: ['a', 'b'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'echo') {
    const message = (args as { message: string }).message;
    return {
      content: [{ type: 'text', text: message }],
    };
  }

  if (name === 'add') {
    const { a, b } = args as { a: number; b: number };
    return {
      content: [{ type: 'text', text: String(a + b) }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
