import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { describe, expect, it } from 'vitest';
import { buildStdioOptions, createTransport } from '../../../src/mcp/transport.js';
import { McptestError } from '../../../src/types/index.js';
import type { McptestConfig } from '../../../src/types/index.js';

const baseConfig: McptestConfig = {
  server: 'node server.js',
  transport: 'stdio',
  timeout: 30000,
  reporter: 'default',
  mode: 'conservative',
  specVersion: '2025-06-18',
  bail: false,
  verbose: false,
  json: false,
  noColor: false,
};

describe('createTransport', () => {
  it('returns StdioClientTransport when transport is stdio', () => {
    const config: McptestConfig = { ...baseConfig, transport: 'stdio' };
    const transport = createTransport(config);
    expect(transport).toBeInstanceOf(StdioClientTransport);
  });

  it('returns SSEClientTransport when transport is sse', () => {
    const config: McptestConfig = {
      ...baseConfig,
      transport: 'sse',
      url: 'http://localhost:3000',
    };
    const transport = createTransport(config);
    expect(transport).toBeInstanceOf(SSEClientTransport);
  });

  it('throws McptestError with code E-002 when transport is sse and url is not set', () => {
    const config: McptestConfig = {
      ...baseConfig,
      transport: 'sse',
      url: undefined,
    };
    expect(() => createTransport(config)).toThrow(McptestError);
    try {
      createTransport(config);
    } catch (err) {
      expect(err).toBeInstanceOf(McptestError);
      expect((err as McptestError).code).toBe('E-002');
    }
  });
});

describe('buildStdioOptions', () => {
  it('splits server string into command and args, merging serverArgs', () => {
    const config: McptestConfig = {
      ...baseConfig,
      server: 'node server.js',
      serverArgs: ['--port', '3000'],
    };
    const options = buildStdioOptions(config);
    expect(options.command).toBe('node');
    expect(options.args).toEqual(['server.js', '--port', '3000']);
  });

  it('handles server with no extra tokens and no serverArgs', () => {
    const config: McptestConfig = {
      ...baseConfig,
      server: 'myserver',
      serverArgs: undefined,
    };
    const options = buildStdioOptions(config);
    expect(options.command).toBe('myserver');
    expect(options.args).toEqual([]);
  });

  it('injects env from config.env', () => {
    const config: McptestConfig = {
      ...baseConfig,
      server: 'node server.js',
      env: { MY_VAR: 'hello', OTHER: 'world' },
    };
    const options = buildStdioOptions(config);
    expect(options.env).toEqual({ MY_VAR: 'hello', OTHER: 'world' });
  });

  it('does not include env key when config.env is undefined', () => {
    const config: McptestConfig = {
      ...baseConfig,
      server: 'node server.js',
      env: undefined,
    };
    const options = buildStdioOptions(config);
    expect(options.env).toBeUndefined();
  });
});
