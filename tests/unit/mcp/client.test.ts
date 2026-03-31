import { beforeEach, describe, expect, it, vi } from 'vitest';
import { McpClient } from '../../../src/mcp/client.js';
import type { McpTransport } from '../../../src/mcp/transport.js';
import { McptestError } from '../../../src/types/index.js';

// TDD: Mock MCP SDK Client
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({ tools: [] }),
    listResources: vi.fn().mockResolvedValue({ resources: [] }),
    listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
    callTool: vi.fn().mockResolvedValue({ content: [] }),
    getServerVersion: vi.fn().mockReturnValue({ name: 'test', version: '1.0.0' }),
  })),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const mockTransport = {} as McpTransport;

const defaultOptions = { timeout: 5000, verbose: false };

function getMockClientInstance() {
  return (Client as ReturnType<typeof vi.fn>).mock.results[
    (Client as ReturnType<typeof vi.fn>).mock.results.length - 1
  ]?.value as ReturnType<typeof vi.fn>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('McpClient.connect()', () => {
  it('calls client.connect(transport) and client.ping() on successful connect', async () => {
    const client = new McpClient(mockTransport, defaultOptions);
    await client.connect();

    const mockInstance = getMockClientInstance();
    expect(mockInstance.connect).toHaveBeenCalledWith(mockTransport);
    expect(mockInstance.ping).toHaveBeenCalledTimes(1);
  });

  it('throws McptestError with code E-002 when ping fails 3 times', async () => {
    const pingError = new Error('ping failed');
    (Client as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockRejectedValue(pingError),
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue({ tools: [] }),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
      callTool: vi.fn().mockResolvedValue({ content: [] }),
      getServerVersion: vi.fn().mockReturnValue(undefined),
    }));

    const client = new McpClient(mockTransport, defaultOptions);

    await expect(client.connect()).rejects.toSatisfy(
      (err: unknown) => err instanceof McptestError && (err as McptestError).code === 'E-002',
    );
  });

  it('retries ping up to 3 times before throwing E-002', async () => {
    const pingFn = vi.fn().mockRejectedValue(new Error('ping failed'));
    (Client as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      ping: pingFn,
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue({ tools: [] }),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
      callTool: vi.fn().mockResolvedValue({ content: [] }),
      getServerVersion: vi.fn().mockReturnValue(undefined),
    }));

    const client = new McpClient(mockTransport, defaultOptions);

    await expect(client.connect()).rejects.toThrow(McptestError);
    expect(pingFn).toHaveBeenCalledTimes(3);
  });
});

describe('McpClient.disconnect()', () => {
  it('calls client.close()', async () => {
    const client = new McpClient(mockTransport, defaultOptions);
    await client.connect();
    await client.disconnect();

    const mockInstance = getMockClientInstance();
    expect(mockInstance.close).toHaveBeenCalledTimes(1);
  });
});

describe('McpClient.listTools()', () => {
  it('calls SDK listTools() and returns McpTool[]', async () => {
    const toolsResponse = {
      tools: [
        { name: 'echo', description: 'Echo tool', inputSchema: { type: 'object', properties: {} } },
      ],
    };
    (Client as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue(toolsResponse),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
      callTool: vi.fn().mockResolvedValue({ content: [] }),
      getServerVersion: vi.fn().mockReturnValue({ name: 'test', version: '1.0.0' }),
    }));

    const client = new McpClient(mockTransport, defaultOptions);
    await client.connect();
    const tools = await client.listTools();

    const mockInstance = getMockClientInstance();
    expect(mockInstance.listTools).toHaveBeenCalledTimes(1);
    expect(tools).toHaveLength(1);
    expect(tools[0]).toEqual({
      name: 'echo',
      description: 'Echo tool',
      inputSchema: { type: 'object', properties: {} },
    });
  });

  it('maps SDK tool response to McpTool[] with name, description, inputSchema', async () => {
    const toolsResponse = {
      tools: [
        {
          name: 'calculator',
          description: 'Perform arithmetic',
          inputSchema: { type: 'object', properties: { a: { type: 'number' } }, required: ['a'] },
        },
        {
          name: 'greet',
          // no description
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    };
    (Client as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue(toolsResponse),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
      callTool: vi.fn().mockResolvedValue({ content: [] }),
      getServerVersion: vi.fn().mockReturnValue({ name: 'test', version: '1.0.0' }),
    }));

    const client = new McpClient(mockTransport, defaultOptions);
    await client.connect();
    const tools = await client.listTools();

    expect(tools).toHaveLength(2);
    expect(tools[0]?.name).toBe('calculator');
    expect(tools[0]?.description).toBe('Perform arithmetic');
    expect(tools[1]?.name).toBe('greet');
    expect(tools[1]?.description).toBeUndefined();
  });
});

describe('McpClient.listResources()', () => {
  it('calls SDK listResources() and returns McpResource[]', async () => {
    const resourcesResponse = {
      resources: [
        {
          uri: 'file://test.txt',
          name: 'test.txt',
          description: 'Test file',
          mimeType: 'text/plain',
        },
      ],
    };
    (Client as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue({ tools: [] }),
      listResources: vi.fn().mockResolvedValue(resourcesResponse),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
      callTool: vi.fn().mockResolvedValue({ content: [] }),
      getServerVersion: vi.fn().mockReturnValue({ name: 'test', version: '1.0.0' }),
    }));

    const client = new McpClient(mockTransport, defaultOptions);
    await client.connect();
    const resources = await client.listResources();

    expect(resources).toHaveLength(1);
    expect(resources[0]).toEqual({
      uri: 'file://test.txt',
      name: 'test.txt',
      description: 'Test file',
      mimeType: 'text/plain',
    });
  });
});

describe('McpClient.listPrompts()', () => {
  it('calls SDK listPrompts() and returns McpPrompt[]', async () => {
    const promptsResponse = {
      prompts: [
        {
          name: 'summarize',
          description: 'Summarize text',
          arguments: [{ name: 'text', description: 'Input text', required: true }],
        },
      ],
    };
    (Client as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue({ tools: [] }),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue(promptsResponse),
      callTool: vi.fn().mockResolvedValue({ content: [] }),
      getServerVersion: vi.fn().mockReturnValue({ name: 'test', version: '1.0.0' }),
    }));

    const client = new McpClient(mockTransport, defaultOptions);
    await client.connect();
    const prompts = await client.listPrompts();

    expect(prompts).toHaveLength(1);
    expect(prompts[0]?.name).toBe('summarize');
  });
});

describe('McpClient.callTool()', () => {
  it('calls SDK callTool() with correct name and arguments', async () => {
    const callToolFn = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'hello' }],
    });
    (Client as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue({ tools: [] }),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
      callTool: callToolFn,
      getServerVersion: vi.fn().mockReturnValue({ name: 'test', version: '1.0.0' }),
    }));

    const client = new McpClient(mockTransport, defaultOptions);
    await client.connect();
    const result = await client.callTool('echo', { message: 'hello' });

    expect(callToolFn).toHaveBeenCalledWith({ name: 'echo', arguments: { message: 'hello' } });
    expect(result.content).toEqual([{ type: 'text', text: 'hello' }]);
  });
});

describe('McpClient.getServerInfo()', () => {
  it('returns server info after connect() with version from getServerVersion()', async () => {
    (Client as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue({ tools: [] }),
      listResources: vi.fn().mockResolvedValue({ resources: [] }),
      listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
      callTool: vi.fn().mockResolvedValue({ content: [] }),
      getServerVersion: vi.fn().mockReturnValue({ name: 'my-server', version: '2.0.0' }),
    }));

    const client = new McpClient(mockTransport, defaultOptions);
    await client.connect();
    const info = client.getServerInfo();

    expect(info).toBeDefined();
    expect(info?.name).toBe('my-server');
    expect(info?.version).toBe('2.0.0');
    expect(info?.toolCount).toBe(0);
  });

  it('returns undefined before connect() is called', () => {
    const client = new McpClient(mockTransport, defaultOptions);
    expect(client.getServerInfo()).toBeUndefined();
  });
});
