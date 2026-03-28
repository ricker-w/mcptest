---
name: spec-creator
description: CRISP形式の仕様書・エージェントプロンプト・スキル定義を作成するスキル
context: fork
mcpServers:
  - serena
  - context7
model: sonnet
---

# spec-creator スキル

## CONTEXT（状況）

### Who（対象ユーザー）

- **CEO / Team Leader**: 新しいエージェントやスキルの定義が必要な際に呼び出す
- **Product Manager**: 機能仕様書の作成を依頼する際に使用

### Where（実行環境）

**Context Mode**: `fork`
**Model**: sonnet（仕様策定には推論力が必要）
**MCP Servers**: serena（既存ファイル参照）、context7（ライブラリドキュメント参照）

### What（入力データ）

**Required Parameters**:

```yaml
spec_type:
  enum
  # - "agent": エージェントプロンプト（CRISP形式、.claude/agents/に配置）
  # - "skill": スキル定義（CRISP形式、.claude/skills/に配置）
  # - "rule": ルール定義（.claude/rules/に配置）
  # - "orchestrator": オーケストレーター定義（.claude/orchestrators/に配置）

name:
  string
  # 仕様名（kebab-case）

description:
  string
  # 仕様の概要説明
```

**Optional Parameters**:

```yaml
reference_files:
  list[string]
  # 参考にする既存ファイルのパス

mcp_servers:
  list[string]
  # 使用するMCPサーバー名

model:
  string
  # 推奨モデル（haiku / sonnet / opus）
```

### Why（背景）

AI駆動開発プロジェクトでは CRISP 形式でエージェント・スキル・ルールを標準化する。
新しい仕様書を作成する際に一貫したフォーマットを保つため、このスキルで生成する。

---

## ROLE（役割）

- **権限**: 仕様書ファイルの作成・更新
- **責務**: CRISP 形式（Context / Role / Intent / Steps / Proof）に準拠した仕様書を生成する
- **参照**: 既存の agents/, skills/, rules/ のファイルをフォーマット参考にする

---

## INTENT（意図）

### Goal

指定された仕様タイプに応じて、CRISP 形式に準拠した仕様書を生成する。

### Success Criteria

- [ ] CRISP の5セクション（C/R/I/S/P）が全て含まれている
- [ ] フロントマター（YAML）が正しく定義されている（スキルの場合）
- [ ] 既存の仕様書とフォーマットが一貫している
- [ ] 出力先パスが正しい（agents/, skills/, rules/, orchestrators/）

---

## STEPS（手順）

→ STEP 1: 既存仕様の参照
```
READ existing files in target directory for format reference
IF reference_files specified:
  READ each reference file for content guidance
```

→ STEP 2: CRISP テンプレート選択
```
CASE spec_type:
  "agent":
    Template: agents/*.md format
    Sections: MCP Tools, CONTEXT, ROLE, INTENT, STEPS, PROOF
    Output: .claude/agents/{name}.md

  "skill":
    Template: skills/*/SKILL.md format
    Frontmatter: name, description, context, mcpServers, model
    Sections: CONTEXT (Who/Where/What/Why), ROLE, INTENT, STEPS, PROOF
    Output: .claude/skills/{name}/SKILL.md

  "rule":
    Template: rules/*.md format
    Sections: DO/DON'T table, specific rules
    Output: .claude/rules/{name}.md

  "orchestrator":
    Template: orchestrators/*.md format
    Sections: Team Structure, Phase/Task definitions, Wave plan
    Output: .claude/orchestrators/{name}.md
```

→ STEP 3: 仕様書生成
```
GENERATE spec content following selected template
ENSURE all CRISP sections are present
ENSURE MCP Tools section is included (for agents)
```

→ STEP 4: 書き出し
```
WRITE spec to appropriate path
```

---

## PROOF（証明）

### 検証チェックリスト

| # | 検証項目 | 基準 |
|---|----------|------|
| 1 | CRISP 準拠 | C/R/I/S/P の5セクションが全て存在する |
| 2 | フロントマター | スキルの場合、name/description/context/model が定義されている |
| 3 | MCP Tools | エージェントの場合、使用するMCPツールが明記されている |
| 4 | 一貫性 | 既存の同タイプ仕様書とフォーマットが統一されている |
| 5 | パス正確性 | 出力先が正しいディレクトリに配置されている |
