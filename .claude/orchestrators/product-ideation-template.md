# {プロダクト名} — 企画・仕様策定オーケストレーター（テンプレート）

> AI駆動開発における企画ディスカッション → リサーチ → 仕様策定までの
> 実行指示書テンプレート。
> プロジェクト固有の情報を `{...}` で記述してカスタマイズすること。

---

## プロダクト概要

### 名前

**{プロダクト名}**

### コンセプト

**{プロダクトのコンセプトを1-2文で}**

### コア思想

- {思想1}
- {思想2}
- {思想3}

---

## 前提条件（全フェーズ共通）

| 制約 | 内容 |
|------|------|
| 形態 | {OSS / SaaS / ツール等} |
| チーム規模 | {1人 + AI駆動開発 等} |
| 技術 | {技術スタック概要} |
| 配布 | {配布方法: npm / Docker / Web 等} |
| テスト | {テスト戦略: TDD等} |
| 成果物 | {成果物の保存先} |
| 議事ログ | {ログの保存先: logs/ 等} |

---

## 機能一覧（初期案）

### コア機能（Must — MVP）

| # | 機能 | 説明 | 備考 |
|---|------|------|------|
| F1 | {機能名} | {説明} | {新規 / 流用} |
| F2 | {機能名} | {説明} | {新規 / 流用} |

### 将来機能（v1.1+）

| # | 機能 |
|---|------|
| F{N} | {機能名} |

---

## Team Structure

```yaml
team_name: {プロダクト名}
lead:
  model: opus
  agent: ceo

advisors:
  - name: advisor
    model: sonnet
    lifecycle: Team 全期間常駐
    role: >
      仕様書・コードベースを読み込み、Leader に蒸留した情報を提供する。

teammates:
  # === Phase 1: リサーチ ===
  - name: researcher-market
    agent: market-researcher
    model: sonnet
    phase: [1]

  - name: researcher-trend
    agent: trend-analyst
    model: sonnet
    phase: [1]

  - name: researcher-ux
    agent: ux-researcher
    model: sonnet
    phase: [1]

  # === Phase 2-4: 企画・設計・仕様 ===
  - name: tech
    agent: tech-lead
    model: opus
    phase: [2, 3, 4]

  - name: dev-estimator
    agent: developer
    model: opus
    phase: [2, 3, 4]

  - name: pm
    agent: product-manager
    model: sonnet
    phase: [3, 4]

  - name: designer
    agent: product-designer
    model: sonnet
    phase: [3, 4]

  - name: strategist-marketing
    agent: marketer
    model: sonnet
    phase: [2, 3]

  - name: strategist-business
    agent: business-analyst
    model: sonnet
    phase: [2, 3]
```

---

## Phase 1: リサーチ — 競合・類似ツール徹底調査

### 目的

{プロダクト名} と類似するツール・アプローチを調査し、差別化ポイントを明確にする。

### リサーチ方針

| # | 方針 |
|---|------|
| R1 | **差別化のための機能拡張**: 競合調査の結果、不足している機能や差別化に繋がる機能があれば仕様を修正・追加する |
| R2 | **OSSの模倣**: 先駆者となるOSSが存在し、そのUI/UX・アーキテクチャが優れている場合は積極的に模倣する |
| R3 | **仕様へのフィードバック**: リサーチ結果を後続フェーズの仕様に反映する |

### タスク定義

```yaml
tasks:
  - id: T01
    name: 類似ツール・競合調査
    assignee: researcher-market
    description: >
      {プロダクト名} と競合・類似するツールを網羅的に調査。
      各ツールのユースケース、機能比較、差別化ポイントを明確にする。
    output: docs/phase1-competitor-analysis.md
    blocked_by: []

  - id: T02
    name: トレンド・ワークフロー調査
    assignee: researcher-trend
    description: >
      {対象ドメイン} における最新トレンドとワークフローを分析。
      Why Now? を明確にする。
    output: docs/phase1-trend-analysis.md
    blocked_by: []

  - id: T03
    name: ユーザーペインポイント調査
    assignee: researcher-ux
    description: >
      ターゲットユーザーのペインポイントをJTBDフレームワークで構造化。
    output: docs/phase1-pain-points.md
    blocked_by: []

  - id: T04
    name: リサーチ統合 & 差別化マトリクス
    assignee: leader
    description: >
      T01〜T03 統合 → 差別化マトリクス、Value Proposition、
      MVP機能最終確認、リスク評価
    output: docs/phase1-synthesis.md
    blocked_by: [T01, T02, T03]
```

### Wave 1
```
Wave 1-A（並列）: T01 + T02 + T03
Wave 1-B（逐次）: T04
```

---

## Phase 2: 技術設計 & アーキテクチャ

### タスク定義

```yaml
tasks:
  - id: T05
    name: 技術設計 & アーキテクチャ
    assignee: tech
    description: >
      技術スタック選定、アーキテクチャ設計、移行設計（既存コードがある場合）。
    output: docs/phase2-architecture.md
    blocked_by: [T04]

  - id: T06
    name: UI/UX コンポーネント設計
    assignee: designer
    description: >
      プロダクトのUI/UXをテキストベースで設計。
    output: docs/phase2-ui-design.md
    blocked_by: [T04]

  - id: T07
    name: コミュニティ・マーケティング戦略
    assignee: strategist-marketing
    description: >
      ポジショニング、ローンチ戦略、コミュニティ戦略。
    output: docs/phase2-marketing-strategy.md
    blocked_by: [T04]

  - id: T08
    name: CEO 意思決定 — アーキテクチャ確定
    assignee: leader
    description: >
      T05〜T07 統合 → 技術スタック、MVP優先順位、戦略 確定
    output: docs/phase2-decision.md
    blocked_by: [T05, T06, T07]
```

### Wave 2
```
Wave 2-A（並列）: T05 + T06 + T07
Wave 2-B（逐次）: T08
```

---

## Phase 3: プロダクト定義 & MVP仕様

### タスク定義

```yaml
tasks:
  - id: T09
    name: ペルソナ定義
    assignee: pm
    output: docs/phase3-personas.md
    blocked_by: [T08]

  - id: T10
    name: 機能要件定義
    assignee: pm
    description: >
      MVP機能の詳細要件を定義。特にコア差別化機能を重点的に。
    output: docs/phase3-functional-requirements.md
    blocked_by: [T08]

  - id: T11
    name: ビジネスモデル
    assignee: strategist-business
    output: docs/phase3-business-model.md
    blocked_by: [T08]

  - id: T12
    name: CEO 意思決定 — MVP スコープ確定
    assignee: leader
    output: docs/phase3-mvp-scope.md
    blocked_by: [T09, T10, T11]
```

### Wave 3
```
Wave 3-A（並列）: T09 + T10 + T11
Wave 3-B（逐次）: T12
```

---

## Phase 4: 仕様具体化

### 目的

Phase 1-3 の成果を元に、開発フェーズに入るための具体的な仕様書を作成する。
このフェーズの成果物が開発オーケストレーターへの入力となる。

### タスク定義

```yaml
tasks:
  - id: T13
    name: 技術スタック & アーキテクチャ定義
    assignee: tech
    description: >
      採用技術の DO/DON'T ルール、品質ゲート、技術制約を文書化。
    output: .claude/rules/tech-stack.md
    blocked_by: [T12]

  - id: T14
    name: ブランチ戦略 & 開発フロー
    assignee: dev-estimator
    description: >
      ブランチ構成、品質ゲート、コミットメッセージ規約、CI/CDフローを定義。
    output: .claude/rules/branching-strategy.md
    blocked_by: [T12]

  - id: T15
    name: UX/UI設計仕様
    assignee: designer
    description: >
      画面一覧、画面遷移、ワイヤーフレーム、インタラクション定義。
    output: docs/phase4-ux-spec.md
    blocked_by: [T12]

  - id: T16
    name: 機能要件定義（実装レベル）
    assignee: pm
    description: >
      各機能の実装レベルの詳細仕様。API設計、データモデル、エッジケース。
    output: docs/phase4-impl-spec.md
    blocked_by: [T12]
```

### Wave 4
```
Wave 4（並列）: T13 + T14 + T15 + T16
→ 全仕様書が揃ったら企画フェーズ完了。開発オーケストレーターへ引き継ぐ。
```

---

## 全体 Wave チャート

```
Phase 1: リサーチ
  Wave 1-A ─── T01 + T02 + T03 ──（並列）
  Wave 1-B ─── T04 ──────────────（逐次）

Phase 2: 技術設計
  Wave 2-A ─── T05 + T06 + T07 ──（並列）
  Wave 2-B ─── T08 ──────────────（逐次）

Phase 3: プロダクト定義
  Wave 3-A ─── T09 + T10 + T11 ──（並列）
  Wave 3-B ─── T12 ──────────────（逐次）

Phase 4: 仕様具体化
  Wave 4 ──── T13 + T14 + T15 + T16 ──（並列）
```

---

## 議事ログ管理

1. **タスクログ** (`logs/phaseN/tXX-*-log.md`) — 調査・分析過程
2. **ディスカッションログ** (`logs/phaseN/discussion-*.md`) — チームメイト間のやり取り
3. **意思決定タイムライン** (`logs/decision-timeline.md`) — 全フェーズの主要決定

---

## 成果物一覧（企画完了時）

| フェーズ | 成果物 | パス |
|---------|--------|------|
| Phase 1 | 競合分析レポート | `docs/phase1-competitor-analysis.md` |
| Phase 1 | トレンド分析レポート | `docs/phase1-trend-analysis.md` |
| Phase 1 | ペインポイントレポート | `docs/phase1-pain-points.md` |
| Phase 1 | リサーチ統合レポート | `docs/phase1-synthesis.md` |
| Phase 2 | アーキテクチャ設計 | `docs/phase2-architecture.md` |
| Phase 2 | UI/UX設計 | `docs/phase2-ui-design.md` |
| Phase 2 | マーケティング戦略 | `docs/phase2-marketing-strategy.md` |
| Phase 2 | アーキテクチャ意思決定 | `docs/phase2-decision.md` |
| Phase 3 | ペルソナ定義 | `docs/phase3-personas.md` |
| Phase 3 | 機能要件定義 | `docs/phase3-functional-requirements.md` |
| Phase 3 | ビジネスモデル | `docs/phase3-business-model.md` |
| Phase 3 | MVPスコープ確定 | `docs/phase3-mvp-scope.md` |
| Phase 4 | 技術スタック定義 | `.claude/rules/tech-stack.md` |
| Phase 4 | ブランチ戦略 | `.claude/rules/branching-strategy.md` |
| Phase 4 | UX/UI設計仕様 | `docs/phase4-ux-spec.md` |
| Phase 4 | 機能要件（実装レベル） | `docs/phase4-impl-spec.md` |

---

## 起動手順

1. Leader（CEO）が本ファイルを読み込む
2. Phase 1 → Phase 4 を順次実行（各Phase内は並列最大化）
3. Phase 4 完了後、全成果物を確認し、開発オーケストレーターへ引き継ぐ
