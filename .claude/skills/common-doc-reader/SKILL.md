---
name: common-doc-reader
description: ドキュメントやソースコードを効率的に読み込み、要約・構造化して返すスキル
context: fork
mcpServers:
  - serena
model: haiku
---

# common-doc-reader スキル

## CONTEXT（状況）

### Who（対象ユーザー）

このスキルは以下のエージェント・プロセスから呼び出される:

- **Tech Lead**: コードベース分析時に使用
- **Developer**: 実装前に既存コードを理解する際に使用
- **QA Engineer**: テスト対象のモジュール仕様を把握する際に使用
- その他の親エージェント: `Skill("common-doc-reader", args: {...})` で呼び出される

### Where（実行環境）

**Context Mode**: `fork` - 親エージェントコンテキストから完全分離
**Model**: haiku - 高速読み込みと軽量推論
**MCP Servers**: serena（シンボルレベルのコード認識）、Fallback: Read tool

### What（入力データ）

**Required Parameters**:

```yaml
file_path:
  string
  # 読み込むファイルの絶対パス
```

**Optional Parameters**:

```yaml
extract_mode:
  enum
  # - "summary": 要約と主要情報のみ（トークン削減率: 80-95%）
  # - "full": 全文を構造化して返す
  # - "structure": ファイル構造のみ（見出し、関数名等、削減率: 90-98%）

focus:
  string (optional)
  # 抽出対象のフォーカス（例: "API エンドポイント", "CSS変数定義"）
```

### Why（背景）

大量のコード・ドキュメントを扱う際に、親エージェントのコンテキストを圧迫せずに
ファイル内容を効率的に把握する必要がある。fork 分離により親コンテキストには
サマリーのみが返却され、トークン効率が大幅に改善する。

---

## ROLE（役割）

- **権限**: 読み取り専用。ファイルの変更は行わない
- **責務**: 指定されたファイルを読み込み、extract_mode に応じて構造化・要約して返す
- **得意**: Markdown, JavaScript, TypeScript, Python, CSS, JSON, YAML の構造解析

---

## INTENT（意図）

### Goal

指定ファイルの内容を効率的に読み取り、親エージェントが必要とする情報を
最小トークンで返却する。

### Success Criteria

- [ ] 指定ファイルが正常に読み込まれている
- [ ] extract_mode に応じた適切な粒度で情報が返却されている
- [ ] focus が指定されている場合、該当部分が優先的に抽出されている
- [ ] 出力が構造化されている（JSON形式）

---

## STEPS（手順）

### SEQUENCE: ファイル読み込み & 抽出

→ STEP 1: ファイル読み込み
```
IF serena MCP available:
  USE get_symbols_overview(file_path) for code files
  USE search_for_pattern(pattern, file_path) for specific focus
ELSE:
  USE Read(file_path) as fallback
```

→ STEP 2: 抽出モード分岐
```
CASE extract_mode:
  "summary":
    - 主要な関数/クラス/エクスポートの一覧
    - 依存関係（import/require）
    - 主要なロジックの要約（各関数1行）
  "structure":
    - 見出し一覧（Markdown）/ 関数・クラス名一覧（コード）
    - ファイルサイズ、行数
  "full":
    - 全文を構造化して返す
```

→ STEP 3: focus フィルタリング
```
IF focus specified:
  Filter extracted content to prioritize focus-related sections
```

→ STEP 4: 結果返却

---

## PROOF（証明）

### Output Format

```json
{
  "status": "success",
  "file_path": "/path/to/file",
  "extract_mode": "summary",
  "data": {
    "overview": "ファイルの概要（1-2文）",
    "sections": [
      { "name": "セクション名", "summary": "要約" }
    ],
    "exports": ["export1", "export2"],
    "dependencies": ["dep1", "dep2"]
  },
  "metadata": {
    "lines": 150,
    "size_bytes": 4096,
    "language": "javascript"
  }
}
```
