import { describe, expect, it } from 'vitest';
import { validateSingleSchema, validateToolSchemas } from '../../../src/core/validator.js';
import type { McpTool } from '../../../src/types/index.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function validTool(overrides: Partial<McpTool> = {}): McpTool {
  return {
    name: 'myTool',
    description: 'Does something useful',
    inputSchema: {
      type: 'object',
      description: 'Input schema for myTool',
      properties: {
        arg1: { type: 'string', description: 'First argument' },
      },
      required: ['arg1'],
    },
    ...overrides,
  };
}

// ─── validateSingleSchema ──────────────────────────────────────────────────────

describe('validateSingleSchema', () => {
  it('returns no errors for a valid schema', () => {
    const errors = validateSingleSchema('myTool', {
      type: 'object',
      description: 'A valid schema',
      properties: { x: { type: 'string' } },
      required: ['x'],
    });
    expect(errors).toHaveLength(0);
  });

  it('returns an error when type field is missing', () => {
    const errors = validateSingleSchema('myTool', {
      description: 'Missing type',
      properties: {},
    });
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('inputSchema.type');
  });

  it('returns an error when type is not "object"', () => {
    const errors = validateSingleSchema('myTool', {
      type: 'string',
      description: 'Wrong type',
      properties: {},
    });
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('inputSchema.type');
  });

  it('returns an error when description is an empty string', () => {
    const errors = validateSingleSchema('myTool', {
      type: 'object',
      description: '',
      properties: {},
    });
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('inputSchema.description');
  });

  it('returns an error when description is missing', () => {
    const errors = validateSingleSchema('myTool', {
      type: 'object',
      properties: {},
    });
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('inputSchema.description');
  });

  it('returns an error when required contains a property name not in properties', () => {
    const errors = validateSingleSchema('myTool', {
      type: 'object',
      description: 'Has unknown required',
      properties: { knownProp: { type: 'string' } },
      required: ['knownProp', 'unknownProp'],
    });
    const messages = errors.map((e) => e.message);
    expect(errors.some((e) => e.field === 'inputSchema.required')).toBe(true);
    expect(messages.some((m) => m.includes('unknownProp'))).toBe(true);
  });

  it('returns an error when required is not an array', () => {
    const errors = validateSingleSchema('myTool', {
      type: 'object',
      description: 'Required is a string',
      properties: {},
      // Cast to bypass TypeScript for test purposes
      required: 'notAnArray' as unknown as string[],
    });
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('inputSchema.required');
  });

  it('includes toolName in all returned errors', () => {
    const errors = validateSingleSchema('specificTool', {
      type: 'string',
      description: '',
      properties: {},
    });
    expect(errors.length).toBeGreaterThan(0);
    for (const error of errors) {
      expect(error.toolName).toBe('specificTool');
    }
  });

  it('returns an error when properties is missing', () => {
    const errors = validateSingleSchema('myTool', {
      type: 'object',
      description: 'No properties field',
    });
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('inputSchema.properties');
  });

  it('returns no errors when properties is an empty object', () => {
    const errors = validateSingleSchema('myTool', {
      type: 'object',
      description: 'Empty properties is fine',
      properties: {},
    });
    expect(errors).toHaveLength(0);
  });
});

// ─── validateToolSchemas ───────────────────────────────────────────────────────

describe('validateToolSchemas', () => {
  it('returns valid: true for a list with a single valid tool', () => {
    const result = validateToolSchemas([validTool()]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid: true for an empty tools array', () => {
    const result = validateToolSchemas([]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid: false when one of multiple tools has an invalid schema', () => {
    const tools: McpTool[] = [
      validTool({ name: 'goodTool' }),
      {
        name: 'badTool',
        inputSchema: {
          // missing type and description
          properties: {},
        },
      },
    ];
    const result = validateToolSchemas(tools);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('aggregates errors from all invalid tools', () => {
    const tools: McpTool[] = [
      {
        name: 'toolA',
        inputSchema: {
          // missing type
          description: 'Tool A',
          properties: {},
        },
      },
      {
        name: 'toolB',
        inputSchema: {
          type: 'object',
          // missing description
          properties: {},
        },
      },
    ];
    const result = validateToolSchemas(tools);
    const toolNames = result.errors.map((e) => e.toolName);
    expect(toolNames).toContain('toolA');
    expect(toolNames).toContain('toolB');
  });
});
