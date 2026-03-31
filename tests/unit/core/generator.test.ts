import { describe, expect, it } from 'vitest';
import { generateMinimalValue, generateTestCases } from '../../../src/core/generator.js';
import type { JsonSchemaObject, McpTool } from '../../../src/types/index.js';

// Helper to build a minimal McpTool
function makeTool(inputSchema: JsonSchemaObject, name = 'testTool'): McpTool {
  return { name, description: 'A test tool', inputSchema };
}

describe('generateMinimalValue', () => {
  it('returns "test" for type string without enum', () => {
    const schema: JsonSchemaObject = { type: 'string' };
    expect(generateMinimalValue(schema, 'myField')).toBe('test');
  });

  it('returns enum[0] for type string with enum', () => {
    const schema: JsonSchemaObject = { type: 'string', enum: ['alpha', 'beta'] };
    expect(generateMinimalValue(schema, 'myField')).toBe('alpha');
  });

  it('returns 0 for type number', () => {
    const schema: JsonSchemaObject = { type: 'number' };
    expect(generateMinimalValue(schema, 'myField')).toBe(0);
  });

  it('returns 0 for type integer', () => {
    const schema: JsonSchemaObject = { type: 'integer' };
    expect(generateMinimalValue(schema, 'myField')).toBe(0);
  });

  it('returns true for type boolean', () => {
    const schema: JsonSchemaObject = { type: 'boolean' };
    expect(generateMinimalValue(schema, 'myField')).toBe(true);
  });

  it('returns [] for type array', () => {
    const schema: JsonSchemaObject = { type: 'array' };
    expect(generateMinimalValue(schema, 'myField')).toEqual([]);
  });

  it('returns {} for type object', () => {
    const schema: JsonSchemaObject = { type: 'object' };
    expect(generateMinimalValue(schema, 'myField')).toEqual({});
  });

  it('returns null for undefined schema', () => {
    expect(generateMinimalValue(undefined as unknown as JsonSchemaObject, 'myField')).toBeNull();
  });

  it('returns null for schema with no type', () => {
    const schema: JsonSchemaObject = {};
    expect(generateMinimalValue(schema, 'myField')).toBeNull();
  });
});

describe('generateTestCases', () => {
  it('generates a test case with string required field set to "test"', () => {
    const tool = makeTool({
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    });

    const cases = generateTestCases(tool);

    expect(cases).toHaveLength(1);
    expect(cases[0].input).toEqual({ query: 'test' });
  });

  it('generates a test case with enum[0] when string field has enum', () => {
    const tool = makeTool({
      type: 'object',
      properties: { color: { type: 'string', enum: ['red', 'green', 'blue'] } },
      required: ['color'],
    });

    const cases = generateTestCases(tool);

    expect(cases[0].input).toEqual({ color: 'red' });
  });

  it('generates a test case with number required field set to 0', () => {
    const tool = makeTool({
      type: 'object',
      properties: { count: { type: 'number' } },
      required: ['count'],
    });

    const cases = generateTestCases(tool);

    expect(cases[0].input).toEqual({ count: 0 });
  });

  it('generates a test case with boolean required field set to true', () => {
    const tool = makeTool({
      type: 'object',
      properties: { enabled: { type: 'boolean' } },
      required: ['enabled'],
    });

    const cases = generateTestCases(tool);

    expect(cases[0].input).toEqual({ enabled: true });
  });

  it('generates a test case with array required field set to []', () => {
    const tool = makeTool({
      type: 'object',
      properties: { items: { type: 'array' } },
      required: ['items'],
    });

    const cases = generateTestCases(tool);

    expect(cases[0].input).toEqual({ items: [] });
  });

  it('generates a test case with object required field set to {}', () => {
    const tool = makeTool({
      type: 'object',
      properties: { options: { type: 'object' } },
      required: ['options'],
    });

    const cases = generateTestCases(tool);

    expect(cases[0].input).toEqual({ options: {} });
  });

  it('returns input: {} when required is an empty array', () => {
    const tool = makeTool({
      type: 'object',
      properties: { optional: { type: 'string' } },
      required: [],
    });

    const cases = generateTestCases(tool);

    expect(cases).toHaveLength(1);
    expect(cases[0].input).toEqual({});
  });

  it('returns input: {} when required is undefined', () => {
    const tool = makeTool({
      type: 'object',
      properties: { optional: { type: 'string' } },
    });

    const cases = generateTestCases(tool);

    expect(cases).toHaveLength(1);
    expect(cases[0].input).toEqual({});
  });

  it('does not include optional (non-required) fields in the generated input', () => {
    const tool = makeTool({
      type: 'object',
      properties: {
        required_field: { type: 'string' },
        optional_field: { type: 'string' },
      },
      required: ['required_field'],
    });

    const cases = generateTestCases(tool);

    expect(cases[0].input).toEqual({ required_field: 'test' });
    expect(Object.keys(cases[0].input)).not.toContain('optional_field');
  });

  it('always returns an array with at least one element', () => {
    const tool = makeTool({ type: 'object' });

    const cases = generateTestCases(tool);

    expect(Array.isArray(cases)).toBe(true);
    expect(cases.length).toBeGreaterThanOrEqual(1);
  });

  it('sets toolName and description on the generated test case', () => {
    const tool = makeTool(
      { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] },
      'search',
    );

    const cases = generateTestCases(tool);

    expect(cases[0].toolName).toBe('search');
    expect(typeof cases[0].description).toBe('string');
    expect(cases[0].description.length).toBeGreaterThan(0);
  });
});
