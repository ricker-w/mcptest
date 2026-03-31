import type { McpTool } from '../types/index.js';

// ─── 公開型 ────────────────────────────────────────────────────────────────────

export interface SchemaValidationError {
  /** ツール名 */
  toolName: string;
  /** 問題のあるフィールドパス (例: "inputSchema.type") */
  field: string;
  /** 人間可読なエラーメッセージ */
  message: string;
}

export interface SchemaValidationResult {
  /** エラーが 0 件なら true */
  valid: boolean;
  /** 検出されたエラーの一覧 */
  errors: SchemaValidationError[];
}

// ─── 型ガード ──────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ─── 公開関数 ──────────────────────────────────────────────────────────────────

/**
 * 単一の inputSchema を JSON Schema Draft 7 の構造ルールで検証する。
 *
 * ルール:
 *   1. type が 'object' であること
 *   2. properties が存在すること（空オブジェクトは許可）
 *   3. description が存在し非空文字列であること
 *   4. required が配列であること（存在する場合）
 *   5. required の各要素が properties に存在すること
 */
export function validateSingleSchema(toolName: string, schema: unknown): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  if (!isRecord(schema)) {
    errors.push({
      toolName,
      field: 'inputSchema',
      message: `inputSchema must be an object, but received ${typeof schema}. Fix: provide a JSON Schema Draft 7 object with type "object".`,
    });
    return errors;
  }

  // Rule 1: type must be 'object'
  if (schema.type === undefined) {
    errors.push({
      toolName,
      field: 'inputSchema.type',
      message:
        'inputSchema.type is missing. Why: MCP tool schemas must define a top-level type. Fix: set type to "object".',
    });
  } else if (schema.type !== 'object') {
    errors.push({
      toolName,
      field: 'inputSchema.type',
      message: `inputSchema.type is "${String(schema.type)}", expected "object". Why: MCP tool input schemas must be object types. Fix: set type to "object".`,
    });
  }

  // Rule 2: properties must exist
  if (schema.properties === undefined) {
    errors.push({
      toolName,
      field: 'inputSchema.properties',
      message:
        'inputSchema.properties is missing. Why: tools must declare their parameters. Fix: add a properties object (may be empty {}).',
    });
  } else if (!isRecord(schema.properties)) {
    errors.push({
      toolName,
      field: 'inputSchema.properties',
      message:
        'inputSchema.properties must be an object. Why: properties is a JSON Schema Draft 7 keyword that maps parameter names to sub-schemas. Fix: set properties to an object.',
    });
  }

  // Rule 3: description must exist and be a non-empty string
  if (schema.description === undefined) {
    errors.push({
      toolName,
      field: 'inputSchema.description',
      message:
        'inputSchema.description is missing. Why: descriptions help users understand what the schema accepts. Fix: add a non-empty description string.',
    });
  } else if (typeof schema.description !== 'string' || schema.description.trim() === '') {
    errors.push({
      toolName,
      field: 'inputSchema.description',
      message:
        'inputSchema.description must be a non-empty string. Why: an empty description provides no value to the caller. Fix: provide a meaningful description.',
    });
  }

  // Rules 4 & 5: required must be an array, and each element must exist in properties
  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required)) {
      errors.push({
        toolName,
        field: 'inputSchema.required',
        message: `inputSchema.required must be an array of strings, but received ${typeof schema.required}. Fix: change required to an array.`,
      });
    } else {
      // Only check membership when properties is a valid record
      const props = isRecord(schema.properties) ? schema.properties : null;
      for (const entry of schema.required) {
        if (typeof entry === 'string' && props !== null && !(entry in props)) {
          errors.push({
            toolName,
            field: 'inputSchema.required',
            message: `inputSchema.required references "${entry}", which is not defined in inputSchema.properties. Fix: add "${entry}" to properties or remove it from required.`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * ツール一覧全体の inputSchema を検証する。
 * いずれかのツールでエラーが検出された場合、valid は false になる。
 */
export function validateToolSchemas(tools: McpTool[]): SchemaValidationResult {
  const allErrors: SchemaValidationError[] = [];

  for (const tool of tools) {
    const errors = validateSingleSchema(tool.name, tool.inputSchema);
    allErrors.push(...errors);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
