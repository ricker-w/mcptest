import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  type ErrorCode,
  type FailCategory,
  type McpTool,
  type McptestConfig,
  McptestError,
  type TestReport,
  type TestResult,
  type TestSuite,
} from '../../../src/types/index.js';

describe('DEFAULT_CONFIG', () => {
  it('has required fields with correct default values', () => {
    expect(DEFAULT_CONFIG.transport).toBe('stdio');
    expect(DEFAULT_CONFIG.timeout).toBe(30000);
    expect(DEFAULT_CONFIG.reporter).toBe('default');
    expect(DEFAULT_CONFIG.mode).toBe('conservative');
    expect(DEFAULT_CONFIG.bail).toBe(false);
    expect(DEFAULT_CONFIG.verbose).toBe(false);
  });

  it('specVersion is set to MCP spec', () => {
    expect(DEFAULT_CONFIG.specVersion).toBe('2025-06-18');
  });
});

describe('McptestError', () => {
  it('has code property', () => {
    const err = new McptestError('E-001', 'Server not found');
    expect(err.code).toBe('E-001');
  });

  it('has message property', () => {
    const err = new McptestError('E-002', 'Connection failed');
    expect(err.message).toBe('Connection failed');
  });

  it('has optional hint property', () => {
    const err = new McptestError('E-001', 'Not found', { hint: 'Run mcptest init' });
    expect(err.hint).toBe('Run mcptest init');
  });

  it('has optional cause property', () => {
    const cause = new Error('original');
    const err = new McptestError('E-003', 'Timeout', { cause });
    expect(err.cause).toBe(cause);
  });

  it('extends Error', () => {
    const err = new McptestError('E-001', 'test');
    expect(err).toBeInstanceOf(Error);
  });

  it('name is McptestError', () => {
    const err = new McptestError('E-001', 'test');
    expect(err.name).toBe('McptestError');
  });
});

describe('Type shapes (compile-time validation via type assertions)', () => {
  it('McptestConfig accepts required fields', () => {
    const config: McptestConfig = {
      server: 'node server.js',
      transport: 'stdio',
      timeout: 5000,
      reporter: 'default',
      mode: 'conservative',
      specVersion: '2025-06-18',
      bail: false,
      verbose: false,
      json: false,
      noColor: false,
    };
    expect(config.server).toBe('node server.js');
  });

  it('McpTool has required fields', () => {
    const tool: McpTool = {
      name: 'my-tool',
      description: 'A tool',
      inputSchema: { type: 'object', properties: {} },
    };
    expect(tool.name).toBe('my-tool');
  });

  it('TestResult has required fields', () => {
    const result: TestResult = {
      testId: 'protocol/initialize',
      status: 'PASS',
      category: 'SUCCESS',
      target: 'server',
      message: 'OK',
      duration: 10,
    };
    expect(result.status).toBe('PASS');
  });

  it('TestSuite has required fields', () => {
    const suite: TestSuite = {
      name: 'conservative',
      results: [],
      total: 0,
      passed: 0,
      failed: 0,
      warned: 0,
      skipped: 0,
      duration: 0,
      verdict: 'PASS',
    };
    expect(suite.verdict).toBe('PASS');
  });

  it('TestReport has required fields', () => {
    const report: TestReport = {
      suites: [],
      total: 0,
      passed: 0,
      failed: 0,
      warned: 0,
      skipped: 0,
      duration: 0,
      exitCode: 0,
    };
    expect(report.exitCode).toBe(0);
  });

  it('ErrorCode union accepts valid codes', () => {
    const code: ErrorCode = 'E-001';
    expect(code).toBe('E-001');
  });

  it('FailCategory union accepts valid categories', () => {
    const cat: FailCategory = 'PROTOCOL_ERROR';
    expect(cat).toBe('PROTOCOL_ERROR');
  });
});
