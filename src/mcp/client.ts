import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type {
  McpPrompt,
  McpPromptArgument,
  McpResource,
  McpServerInfo,
  McpTool,
  McpToolCallResult,
} from '../types/index.js';
import { McptestError } from '../types/index.js';
import type { McpTransport } from './transport.js';

const PING_MAX_RETRIES = 3;
const PING_RETRY_DELAY_MS = 500;

export interface McpClientOptions {
  timeout: number;
  verbose: boolean;
}

/**
 * Thin wrapper around the MCP SDK Client.
 * All MCP SDK imports must go through src/mcp/ — never imported directly from elsewhere.
 */
export class McpClient {
  private readonly client: Client;
  private readonly transport: McpTransport;
  private readonly options: McpClientOptions;
  private serverInfo: McpServerInfo | undefined = undefined;

  constructor(transport: McpTransport, options: McpClientOptions) {
    this.transport = transport;
    this.options = options;
    this.client = new Client({ name: 'mcptest', version: '0.1.0' }, { capabilities: {} });
  }

  /**
   * Establish connection: connect transport then ping with up to 3 retries.
   */
  async connect(): Promise<void> {
    await this.client.connect(this.transport);
    await this.pingWithRetry();

    const serverVersion = this.client.getServerVersion();
    if (serverVersion !== undefined) {
      this.serverInfo = {
        name: serverVersion.name,
        version: serverVersion.version,
        capabilities: {},
        toolCount: 0,
        resourceCount: 0,
        promptCount: 0,
        transport: 'stdio',
      };
    }
  }

  /**
   * Close the connection.
   */
  async disconnect(): Promise<void> {
    await this.client.close();
  }

  /**
   * Retrieve the list of tools from the server.
   */
  async listTools(): Promise<McpTool[]> {
    const response = await this.client.listTools();
    return response.tools.map((tool) => ({
      name: tool.name,
      ...(tool.description !== undefined ? { description: tool.description } : {}),
      inputSchema: (tool.inputSchema as McpTool['inputSchema']) ?? { type: 'object' },
    }));
  }

  /**
   * Retrieve the list of resources from the server.
   */
  async listResources(): Promise<McpResource[]> {
    const response = await this.client.listResources();
    return response.resources.map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      ...(resource.description !== undefined ? { description: resource.description } : {}),
      ...(resource.mimeType !== undefined ? { mimeType: resource.mimeType } : {}),
    }));
  }

  /**
   * Retrieve the list of prompts from the server.
   */
  async listPrompts(): Promise<McpPrompt[]> {
    const response = await this.client.listPrompts();
    return response.prompts.map((prompt) => {
      const result: McpPrompt = { name: prompt.name };
      if (prompt.description !== undefined) {
        result.description = prompt.description;
      }
      if (prompt.arguments !== undefined) {
        result.arguments = prompt.arguments.map((arg) => {
          const mapped: McpPromptArgument = { name: arg.name };
          if (arg.description !== undefined) {
            mapped.description = arg.description;
          }
          if (arg.required !== undefined) {
            mapped.required = arg.required;
          }
          return mapped;
        });
      }
      return result;
    });
  }

  /**
   * Invoke a tool on the server.
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
    const response = await this.client.callTool({ name, arguments: args });
    return {
      content: (response.content as McpToolCallResult['content']) ?? [],
      ...(response.isError !== undefined ? { isError: response.isError as boolean } : {}),
    };
  }

  /**
   * Return cached server info (populated after connect()).
   */
  getServerInfo(): McpServerInfo | undefined {
    return this.serverInfo;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async pingWithRetry(): Promise<void> {
    let lastError: unknown;

    for (let attempt = 0; attempt < PING_MAX_RETRIES; attempt++) {
      try {
        await this.client.ping();
        return;
      } catch (err) {
        lastError = err;
        if (attempt < PING_MAX_RETRIES - 1) {
          await delay(PING_RETRY_DELAY_MS);
        }
      }
    }

    throw new McptestError(
      'E-002',
      'Failed to connect to MCP server: ping did not succeed after 3 attempts. ' +
        'Ensure the server is running and accessible.',
      {
        hint: 'Check that the server command is correct and the server starts without errors.',
        cause: lastError instanceof Error ? lastError : undefined,
      },
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
