import { DefaultReporter } from '../../core/reporter/default.js';
import { validateToolSchemas } from '../../core/validator.js';
import { McpClient } from '../../mcp/client.js';
import { createTransport } from '../../mcp/transport.js';
import type { McpPrompt, McpResource, McptestConfig } from '../../types/index.js';
import { resolveConfig } from '../config.js';

// ─── Public types ─────────────────────────────────────────────────────────────

export type ValidateTarget = 'tools' | 'resources' | 'prompts';

export interface ValidateCommandOptions {
  server?: string;
  transport?: 'stdio' | 'sse';
  timeout?: number;
  strict?: boolean;
  verbose?: boolean;
  reporter?: 'default' | 'junit';
  output?: string;
}

// ─── Validation helpers ──────────────────────────────────────────────────────

interface SimpleValidationError {
  name: string;
  field: string;
  message: string;
}

function validateResources(resources: McpResource[]): SimpleValidationError[] {
  const errors: SimpleValidationError[] = [];
  for (const resource of resources) {
    if (!resource.uri || resource.uri.trim() === '') {
      errors.push({
        name: resource.name,
        field: 'uri',
        message: `Resource "${resource.name}" is missing a URI. Why: every MCP resource must have a URI. Fix: add a non-empty URI to the resource.`,
      });
    }
  }
  return errors;
}

function validatePrompts(prompts: McpPrompt[]): SimpleValidationError[] {
  const errors: SimpleValidationError[] = [];
  for (const prompt of prompts) {
    if (!prompt.name || prompt.name.trim() === '') {
      errors.push({
        name: prompt.name ?? '(unknown)',
        field: 'name',
        message:
          'A prompt is missing its name. Why: every MCP prompt must have a non-empty name. Fix: add a non-empty name to the prompt.',
      });
    }
  }
  return errors;
}

// ─── Main command ─────────────────────────────────────────────────────────────

/**
 * mcptest validate コマンドの実行関数。
 * 完了後に process.exit(exitCode) を呼ぶ。
 */
export async function validateCommand(
  target: ValidateTarget = 'tools',
  options: ValidateCommandOptions = {},
): Promise<void> {
  // Build the config partial from CLI options (strip undefined fields)
  const cliConfig: Partial<McptestConfig> = {};
  if (options.server !== undefined) cliConfig.server = options.server;
  if (options.transport !== undefined) cliConfig.transport = options.transport;
  if (options.timeout !== undefined) cliConfig.timeout = options.timeout;
  if (options.verbose !== undefined) cliConfig.verbose = options.verbose;
  if (options.reporter !== undefined) cliConfig.reporter = options.reporter;
  if (options.output !== undefined) cliConfig.output = options.output;
  if (options.strict !== undefined) cliConfig.mode = options.strict ? 'strict' : 'conservative';

  const config = await resolveConfig(cliConfig);
  const transport = createTransport(config);
  const client = new McpClient(transport, { timeout: config.timeout, verbose: config.verbose });
  const reporter = new DefaultReporter({ noColor: config.noColor });

  await client.connect();

  let hasErrors = false;

  try {
    if (target === 'tools') {
      const tools = await client.listTools();
      const result = validateToolSchemas(tools);

      if (result.valid) {
        process.stdout.write(
          `  ✓ All ${tools.length} tool schema${tools.length !== 1 ? 's' : ''} are valid.\n`,
        );
      } else {
        hasErrors = true;
        for (const error of result.errors) {
          process.stdout.write(`  ✗ [${error.toolName}] ${error.field}: ${error.message}\n`);
        }
      }
    } else if (target === 'resources') {
      const resources = await client.listResources();
      const errors = validateResources(resources);

      if (errors.length === 0) {
        process.stdout.write(
          `  ✓ All ${resources.length} resource${resources.length !== 1 ? 's' : ''} are valid.\n`,
        );
      } else {
        hasErrors = true;
        for (const error of errors) {
          process.stdout.write(`  ✗ [${error.name}] ${error.field}: ${error.message}\n`);
        }
      }
    } else {
      // target === 'prompts'
      const prompts = await client.listPrompts();
      const errors = validatePrompts(prompts);

      if (errors.length === 0) {
        process.stdout.write(
          `  ✓ All ${prompts.length} prompt${prompts.length !== 1 ? 's' : ''} are valid.\n`,
        );
      } else {
        hasErrors = true;
        for (const error of errors) {
          process.stdout.write(`  ✗ [${error.name}] ${error.field}: ${error.message}\n`);
        }
      }
    }
  } finally {
    await client.disconnect();
  }

  // Suppress unused variable warning — reporter is instantiated for future use
  void reporter;

  process.exit(hasErrors ? 1 : 0);
}
