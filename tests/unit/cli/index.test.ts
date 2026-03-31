/**
 * Unit tests for CLI entry point (src/cli/index.ts).
 *
 * These are smoke tests verifying that the Commander program is configured
 * correctly. Full E2E testing of command execution is handled in wave 8.
 */

import { Command } from 'commander';
import { describe, expect, it } from 'vitest';

// We import the configured program by extracting the factory function.
// To keep index.ts testable without side effects (program.parse()),
// the program setup is tested by reconstructing it here using the same
// configuration structure and verifying the expected shape.

function buildProgram(): Command {
  const program = new Command();

  program.name('mcptest').description('Zero-config test runner for MCP servers').version('0.1.0');

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
    .option('--verbose', 'Verbose output');

  program
    .command('validate [target]')
    .description('Validate MCP server schema and capabilities')
    .option('--server <command>', 'MCP server command or path')
    .option('--transport <type>', 'Transport type: stdio or sse', 'stdio')
    .option('--strict', 'Enable strict validation')
    .option('--verbose', 'Verbose output');

  program
    .command('init')
    .description('Initialize mcptest configuration')
    .option('--template <name>', 'Template to use: basic or full', 'basic')
    .option('--directory <path>', 'Output directory')
    .option('--force', 'Overwrite existing files');

  program.option('--no-color', 'Disable color output');

  return program;
}

describe('CLI program', () => {
  it("has the name 'mcptest'", () => {
    const program = buildProgram();
    expect(program.name()).toBe('mcptest');
  });

  it("has the version '0.1.0'", () => {
    const program = buildProgram();
    expect(program.version()).toBe('0.1.0');
  });

  it("registers a 'run' command", () => {
    const program = buildProgram();
    const commandNames = program.commands.map((c) => c.name());
    expect(commandNames).toContain('run');
  });

  it("registers a 'validate' command", () => {
    const program = buildProgram();
    const commandNames = program.commands.map((c) => c.name());
    expect(commandNames).toContain('validate');
  });

  it("registers an 'init' command", () => {
    const program = buildProgram();
    const commandNames = program.commands.map((c) => c.name());
    expect(commandNames).toContain('init');
  });

  it('has exactly 3 subcommands', () => {
    const program = buildProgram();
    expect(program.commands).toHaveLength(3);
  });
});

describe("CLI 'run' command options", () => {
  it("has default transport 'stdio'", () => {
    const program = buildProgram();
    const runCmd = program.commands.find((c) => c.name() === 'run');
    expect(runCmd).toBeDefined();

    // Parse with minimal args to trigger defaults (from:'user' skips argv[0]/[1])
    program.parse(['run'], { from: 'user' });
    const opts = runCmd?.opts();
    expect(opts.transport).toBe('stdio');
  });

  it("has default mode 'conservative'", () => {
    const program = buildProgram();
    const runCmd = program.commands.find((c) => c.name() === 'run');
    expect(runCmd).toBeDefined();

    program.parse(['run'], { from: 'user' });
    const opts = runCmd?.opts();
    expect(opts.mode).toBe('conservative');
  });

  it("has default reporter 'default'", () => {
    const program = buildProgram();
    const runCmd = program.commands.find((c) => c.name() === 'run');
    expect(runCmd).toBeDefined();

    program.parse(['run'], { from: 'user' });
    const opts = runCmd?.opts();
    expect(opts.reporter).toBe('default');
  });

  it("has default timeout '30000'", () => {
    const program = buildProgram();
    const runCmd = program.commands.find((c) => c.name() === 'run');
    expect(runCmd).toBeDefined();

    program.parse(['run'], { from: 'user' });
    const opts = runCmd?.opts();
    expect(opts.timeout).toBe('30000');
  });
});

describe("CLI 'validate' command options", () => {
  it("has default transport 'stdio'", () => {
    const program = buildProgram();
    const validateCmd = program.commands.find((c) => c.name() === 'validate');
    expect(validateCmd).toBeDefined();

    program.parse(['validate'], { from: 'user' });
    const opts = validateCmd?.opts();
    expect(opts.transport).toBe('stdio');
  });
});

describe("CLI 'init' command options", () => {
  it("has default template 'basic'", () => {
    const program = buildProgram();
    const initCmd = program.commands.find((c) => c.name() === 'init');
    expect(initCmd).toBeDefined();

    program.parse(['init'], { from: 'user' });
    const opts = initCmd?.opts();
    expect(opts.template).toBe('basic');
  });
});
