import type { JsonSchemaObject, McpTool } from '../types/index.js';

export interface GeneratedTestCase {
  toolName: string;
  input: Record<string, unknown>;
  description: string;
}

/**
 * JSON Schema の type から最小有効値を生成する。
 * schema が undefined または type が未定義の場合は null を返す。
 */
export function generateMinimalValue(schema: JsonSchemaObject, _fieldName: string): unknown {
  if (schema === undefined || schema === null) {
    return null;
  }

  if (!schema.type) {
    return null;
  }

  switch (schema.type) {
    case 'string':
      // enum がある場合は最初の要素を使う
      if (schema.enum !== undefined && schema.enum.length > 0) {
        return schema.enum[0];
      }
      return 'test';

    case 'number':
    case 'integer':
      return 0;

    case 'boolean':
      return true;

    case 'array':
      return [];

    case 'object':
      return {};

    default:
      return null;
  }
}

/**
 * ツールの inputSchema から保守的テストケースを生成する。
 * required フィールドのみを含む最小引数ケースを1つ生成する。
 */
export function generateTestCases(tool: McpTool): GeneratedTestCase[] {
  const { inputSchema } = tool;
  const required = inputSchema.required ?? [];
  const properties = inputSchema.properties ?? {};

  const input: Record<string, unknown> = {};

  for (const fieldName of required) {
    const fieldSchema = properties[fieldName] ?? {};
    input[fieldName] = generateMinimalValue(fieldSchema, fieldName);
  }

  const description =
    required.length > 0
      ? `minimal required inputs: ${required.join(', ')}`
      : 'no required inputs — empty call';

  return [
    {
      toolName: tool.name,
      input,
      description,
    },
  ];
}
