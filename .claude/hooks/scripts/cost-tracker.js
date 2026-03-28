#!/usr/bin/env node

/**
 * Stop Hook: cost-tracker
 *
 * セッション終了時にトークン使用量とコストメトリクスを記録する。
 * .claude/cost-log.jsonl に JSONL 形式で追記する。
 *
 * 記録内容:
 * - タイムスタンプ
 * - セッションID（プロセスID）
 * - プロジェクトパス
 *
 * Note: Claude Code の内部トークンカウントには直接アクセスできないため、
 * セッション単位のマーカーを記録する。詳細なトークン数は
 * Claude Code の /cost コマンドや請求ダッシュボードで確認する。
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const LOG_DIR = join(process.env.HOME || process.env.USERPROFILE || '', '.claude');
const LOG_FILE = join(LOG_DIR, 'cost-log.jsonl');

try {
  // ログディレクトリがなければ作成
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }

  const entry = {
    timestamp: new Date().toISOString(),
    session_id: process.pid.toString(),
    project: process.cwd(),
    event: 'session_stop',
  };

  // JSONL形式で追記
  const line = JSON.stringify(entry) + '\n';

  if (existsSync(LOG_FILE)) {
    const existing = readFileSync(LOG_FILE, 'utf-8');
    writeFileSync(LOG_FILE, existing + line, 'utf-8');
  } else {
    writeFileSync(LOG_FILE, line, 'utf-8');
  }
} catch (e) {
  // コスト追跡の失敗でセッションを妨げない
  // エラーは静かに無視
}
