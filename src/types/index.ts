/**
 * mcptest 共有型定義
 */

// ─── 設定型 ────────────────────────────────────────────────

/**
 * mcptest の設定型。mcptest.config.ts / package.json / CLI 引数から解決される。
 */
export interface McptestConfig {
  /** MCP サーバーのエントリポイント（パスまたはコマンド） */
  server: string;

  /** MCP サーバーに渡すコマンドライン引数 */
  serverArgs?: string[];

  /** トランスポート種別 */
  transport: 'stdio' | 'sse';

  /** SSE 時のサーバー URL */
  url?: string;

  /** テストタイムアウト (ms) */
  timeout: number;

  /** サーバー起動時に注入する環境変数 */
  env?: Record<string, string>;

  /** レポーター種別 */
  reporter: 'default' | 'junit';

  /** レポート出力先パス（junit 時） */
  output?: string;

  /** テストモード */
  mode: 'conservative' | 'strict';

  /** MCP 仕様バージョン */
  specVersion: string;

  /** 最初の失敗で停止 */
  bail: boolean;

  /** 詳細ログ出力 */
  verbose: boolean;

  /** ツール名フィルタ */
  filter?: string;

  /** JSON 出力 */
  json: boolean;

  /** カラー出力を無効化 */
  noColor: boolean;
}

/** デフォルト設定値 */
export const DEFAULT_CONFIG: McptestConfig = {
  server: '',
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

// ─── テスト結果型 ──────────────────────────────────────────

/** テスト結果のステータス */
export type TestStatus = 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';

/** 失敗カテゴリ（TestResult.category の値） */
export type FailCategory = 'PROTOCOL_ERROR' | 'SCHEMA_ERROR' | 'RESPONSE_ERROR' | 'TIMEOUT';

/** テスト結果カテゴリ */
export type TestCategory = FailCategory | 'SUCCESS';

/** 個別テストの結果 */
export interface TestResult {
  /** テストの一意識別子 */
  testId: string;

  /** テストステータス */
  status: TestStatus;

  /** 結果カテゴリ */
  category: TestCategory;

  /** テスト対象のツール/リソース/プロンプト名 */
  target: string;

  /** 結果メッセージ（人間可読） */
  message: string;

  /** テスト実行時間 (ms) */
  duration: number;

  /** エラー詳細（FAIL/WARNING 時のみ） */
  error?: TestErrorDetail;
}

/** テストエラーの詳細情報 */
export interface TestErrorDetail {
  /** エラーコード（E-001 形式） */
  code?: string;

  /** 期待値 */
  expected?: string;

  /** 実際の値 */
  actual?: string;

  /** スタックトレース */
  stack?: string;

  /** 修正ヒント */
  hint?: string;
}

/** テストスイート全体の結果 */
export interface TestSuite {
  /** テストスイート名 */
  name: string;

  /** 個別テスト結果の配列 */
  results: TestResult[];

  /** テスト総数 */
  total: number;

  /** PASS 数 */
  passed: number;

  /** FAIL 数 */
  failed: number;

  /** WARNING 数 */
  warned: number;

  /** SKIP 数 */
  skipped: number;

  /** スイート全体の所要時間 (ms) */
  duration: number;

  /** スイートの最終判定 */
  verdict: 'PASS' | 'FAIL';
}

/** テスト実行全体のレポート */
export interface TestReport {
  /** テストスイートの配列 */
  suites: TestSuite[];

  /** テスト総数 */
  total: number;

  /** PASS 数 */
  passed: number;

  /** FAIL 数 */
  failed: number;

  /** WARNING 数 */
  warned: number;

  /** SKIP 数 */
  skipped: number;

  /** 全体の所要時間 (ms) */
  duration: number;

  /** プロセス終了コード（FAIL があれば 1、それ以外は 0） */
  exitCode: number;
}

// ─── MCP エンティティ型 ─────────────────────────────────────

/** JSON Schema Draft 7 オブジェクト型 */
export interface JsonSchemaObject {
  type?: string;
  properties?: Record<string, JsonSchemaObject>;
  required?: string[];
  description?: string;
  enum?: unknown[];
  items?: JsonSchemaObject;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

/** MCP ツール */
export interface McpTool {
  name: string;
  description?: string;
  inputSchema: JsonSchemaObject;
}

/** MCP リソース */
export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/** MCP プロンプト引数 */
export interface McpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

/** MCP プロンプト */
export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: McpPromptArgument[];
}

/** ツール呼び出し結果 */
export interface McpToolCallResult {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/** サーバー capabilities */
export interface McpServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
  logging?: Record<string, never>;
}

/** MCP サーバー情報 */
export interface McpServerInfo {
  name: string;
  version: string;
  capabilities: McpServerCapabilities;
  toolCount: number;
  resourceCount: number;
  promptCount: number;
  transport: 'stdio' | 'sse';
}

// ─── エラー型 ──────────────────────────────────────────────

/** エラーコード */
export type ErrorCode = 'E-001' | 'E-002' | 'E-003' | 'E-004';

/** McptestError オプション */
export interface McptestErrorOptions {
  hint?: string;
  cause?: Error | unknown;
}

/**
 * mcptest 専用エラークラス。
 * code: E-001 サーバー検出失敗
 * code: E-002 サーバー起動/接続失敗
 * code: E-003 タイムアウト
 * code: E-004 予期しないエラー
 */
export class McptestError extends Error {
  readonly code: ErrorCode;
  readonly hint?: string;

  constructor(code: ErrorCode, message: string, options?: McptestErrorOptions) {
    super(message, { cause: options?.cause });
    this.name = 'McptestError';
    this.code = code;
    if (options?.hint !== undefined) {
      this.hint = options.hint;
    }

    // Fix prototype chain for ES5 transpilation
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
