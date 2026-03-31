#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runCommand } from './commands/run.js';
import { validateCommand } from './commands/validate.js';

const program = new Command();

program.name('mcptest').description('Zero-config test runner for MCP servers').version('0.1.0');

// Global option: disable color output
program.option('--no-color', 'Disable color output');

// mcptest run コマンド
program
  .command('run')
  .description('Run tests against an MCP server')
  .option('--server <command>', 'MCP server command or path')
  .option('--transport <type>', 'Transport type: stdio or sse', 'stdio')
  .option('--timeout <ms>', 'Test timeout in milliseconds', '30000')
  .option('--mode <mode>', 'Test mode: conservative or strict', 'conservative')
  .option('--reporter <type>', 'Reporter type: default or junit', 'default')
  .option('--output <path>', 'Output file path for junit reporter')
  .option('--filter <pattern>', 'Filter tools by name pattern')
  .option('--bail', 'Stop on first failure')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    const parsed = options.timeout ? Number.parseInt(options.timeout, 10) : undefined;
    await runCommand({
      server: options.server,
      transport: options.transport,
      ...(parsed !== undefined ? { timeout: parsed } : {}),
      mode: options.mode,
      reporter: options.reporter,
      output: options.output,
      filter: options.filter,
      bail: options.bail,
      verbose: options.verbose,
    });
  });

// mcptest validate コマンド
program
  .command('validate [target]')
  .description('Validate MCP server schema and capabilities')
  .option('--server <command>', 'MCP server command or path')
  .option('--transport <type>', 'Transport type: stdio or sse', 'stdio')
  .option('--strict', 'Enable strict validation')
  .option('--verbose', 'Verbose output')
  .action(async (target, options) => {
    await validateCommand(target ?? 'tools', {
      server: options.server,
      transport: options.transport,
      strict: options.strict,
      verbose: options.verbose,
    });
  });

// mcptest init コマンド
program
  .command('init')
  .description('Initialize mcptest configuration')
  .option('--template <name>', 'Template to use: basic or full', 'basic')
  .option('--directory <path>', 'Output directory')
  .option('--force', 'Overwrite existing files')
  .action(async (options) => {
    await runInit({
      template: options.template,
      directory: options.directory,
      force: options.force,
    });
  });

program.parse();
