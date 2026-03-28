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

  - name: legal
    agent: legal-counsel
    model: sonnet
    phase: [1, 2, 3]        # Phase 1〜3 全期間常駐

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
同時に法的リスクを早期にスクリーニングし、致命的な問題があれば方向転換する。

### リサーチ方針

| # | 方針 |
|---|------|
| R1 | **差別化のための機能拡張**: 競合調査の結果、不足している機能や差別化に繋がる機能があれば仕様を修正・追加する |
| R2 | **OSSの模倣**: 先駆者となるOSSが存在し、そのUI/UX・アーキテクチャが優れている場合は積極的に模倣する |
| R3 | **仕様へのフィードバック**: リサーチ結果を後続フェーズの仕様に反映する |
| R4 | **法的スクリーニング最優先**: TL0 の結果が REJECT の場合、T04 統合を待たずに CEO が即座にプロジェクト方向性を再検討する |

### タスク定義

```yaml
tasks:
  - id: TL0
    name: 法的初期スクリーニング
    assignee: legal
    description: >
      プロダクトコンセプト・想定機能・収益モデルをもとに、適用される法律・規制を
      網羅的に洗い出し、致命的な法的問題がないかを初期評価する。
      REJECT 判定の場合は代替案を最低1案提示すること。
    output: docs/phase1-legal-screening.md
    blocked_by: []

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
      TL0〜T03 統合 → 差別化マトリクス、Value Proposition、
      MVP機能最終確認、リスク評価。
      TL0 が REJECT の場合: プロジェクトを即座にリジェクトし、
      TL0 で提示された代替案から新たな方向性を選定して Phase 2 へ進む。
      TL0 が CONDITIONAL の場合: 条件を Phase 2 以降のタスクに明示的に引き継ぐ。
    output: docs/phase1-synthesis.md
    blocked_by: [TL0, T01, T02, T03]
```

### Wave 1
```
Wave 1-A（並列）: TL0 + T01 + T02 + T03
Wave 1-B（逐次）: T04

⚠️ 法的ゲート:
  TL0 = REJECT  → T04 で方向性を再選定。Phase 2 は TL0 の代替案に基づき再スタート
  TL0 = CONDITIONAL → T04 に条件を明記。Phase 2 以降のタスクに条件を引き継ぐ
  TL0 = APPROVE  → 通常フローで Phase 2 へ進む
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
      TL0 が CONDITIONAL の場合、データ処理・セキュリティ要件に条件を反映すること。
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
      TL0 が CONDITIONAL の場合、広告・景品表示・特商法の条件をマーケ戦略に組み込むこと。
    output: docs/phase2-marketing-strategy.md
    blocked_by: [T04]

  - id: TL1
    name: 法的コンプライアンス設計レビュー
    assignee: legal
    description: >
      T05（技術設計）・T06（UI/UX）・T07（マーケ戦略）の初期案を法的観点でレビュー。
      特にデータ処理・プライバシー・広告表示・利用規約の観点を重点的に評価し、
      APPROVE / CONDITIONAL / REJECT を判定する。
      REJECT の場合は代替設計の方向性を提示する。
    output: docs/phase2-legal-review.md
    blocked_by: [T05, T06, T07]

  - id: T08
    name: CEO 意思決定 — アーキテクチャ確定
    assignee: leader
    description: >
      T05〜T07 + TL1 統合 → 技術スタック、MVP優先順位、戦略 確定。
      TL1 が REJECT の場合: 法的問題のある設計を破棄し、TL1 の代替案に基づき設計を再選定する。
      TL1 が CONDITIONAL の場合: 条件事項を Phase 3 タスクへ明示的に引き継ぐ。
    output: docs/phase2-decision.md
    blocked_by: [TL1]
```

### Wave 2
```
Wave 2-A（並列）: T05 + T06 + T07
Wave 2-B（逐次）: TL1
Wave 2-C（逐次）: T08

⚠️ 法的ゲート（Wave 2-B → 2-C）:
  TL1 = REJECT  → T08 で問題箇所を修正・再設計指示
  TL1 = CONDITIONAL → T08 で条件を確定事項に変換して引き継ぐ
  TL1 = APPROVE  → 通常フローで T08 へ進む
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
      TL0・TL1 で CONDITIONAL 条件がある場合は機能要件に組み込むこと。
    output: docs/phase3-functional-requirements.md
    blocked_by: [T08]

  - id: T11
    name: ビジネスモデル
    assignee: strategist-business
    output: docs/phase3-business-model.md
    blocked_by: [T08]

  - id: TL2
    name: 法的最終レビュー — ビジネスモデル & MVP仕様
    assignee: legal
    description: >
      T09（ペルソナ）・T10（機能要件）・T11（ビジネスモデル）を法的観点で最終レビュー。
      収益モデル（課金・広告・データ利用）・利用規約・プライバシーポリシーの要件、
      特商法・消費者契約法・景品表示法への適合性を評価する。
      最終 APPROVE / CONDITIONAL / REJECT を判定すること。
      REJECT の場合は代替ビジネスモデルを提示する。
    output: docs/phase3-legal-final-review.md
    blocked_by: [T09, T10, T11]

  - id: T12
    name: CEO 意思決定 — MVP スコープ確定
    assignee: leader
    description: >
      T09〜T11 + TL2 統合 → MVP スコープ確定。
      TL2 が REJECT の場合: 問題のあるビジネスモデル・機能を除外し、代替案に切り替える。
      TL2 が CONDITIONAL の場合: 条件事項を Phase 4 仕様書へ必須要件として引き継ぐ。
    output: docs/phase3-mvp-scope.md
    blocked_by: [TL2]
```

### Wave 3
```
Wave 3-A（並列）: T09 + T10 + T11
Wave 3-B（逐次）: TL2
Wave 3-C（逐次）: T12

⚠️ 法的ゲート（Wave 3-B → 3-C）:
  TL2 = REJECT  → T12 でビジネスモデルを代替案に切り替えて確定
  TL2 = CONDITIONAL → T12 で条件を Phase 4 の必須仕様として確定
  TL2 = APPROVE  → 通常フローで T12 へ進む
```

---

## Phase 4: 仕様具体化

### 目的

Phase 1-3 の成果を元に、開発フェーズに入るための具体的な仕様書を作成する。
このフェーズの成果物が開発オーケストレーターへの入力となる。
**法的レビューで確定した必須要件（CONDITIONAL 条件・コンプライアンス要件）を仕様書に必ず反映すること。**

### タスク定義

```yaml
tasks:
  - id: T13
    name: 技術スタック & アーキテクチャ定義
    assignee: tech
    description: >
      採用技術の DO/DON'T ルール、品質ゲート、技術制約を文書化。
      法的レビューで確定したデータ処理・セキュリティ要件を技術制約として明記すること。
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
      法的要件（利用規約同意フロー・年齢確認・プライバシーポリシー表示等）を含めること。
    output: docs/phase4-ux-spec.md
    blocked_by: [T12]

  - id: T16
    name: 機能要件定義（実装レベル）
    assignee: pm
    description: >
      各機能の実装レベルの詳細仕様。API設計、データモデル、エッジケース。
      コンプライアンス要件（GDPR対応・個人情報取扱い・データ保持期間等）を必須仕様として含めること。
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
  Wave 1-A ─── TL0 + T01 + T02 + T03 ──（並列）
                 │
              ⚠️ 法的ゲート（TL0）
                 │
  Wave 1-B ─── T04 ──────────────────────（逐次）

Phase 2: 技術設計
  Wave 2-A ─── T05 + T06 + T07 ──────────（並列、T04 完了後）
  Wave 2-B ─── TL1 ───────────────────────（逐次）
                 │
              ⚠️ 法的ゲート（TL1）
                 │
  Wave 2-C ─── T08 ──────────────────────（逐次）

Phase 3: プロダクト定義
  Wave 3-A ─── T09 + T10 + T11 ──────────（並列、T08 完了後）
  Wave 3-B ─── TL2 ───────────────────────（逐次）
                 │
              ⚠️ 法的ゲート（TL2）
                 │
  Wave 3-C ─── T12 ──────────────────────（逐次）

Phase 4: 仕様具体化
  Wave 4 ──── T13 + T14 + T15 + T16 ──────（並列、T12 完了後）
```

---

## 法的ゲートの処理フロー

```
TL0 / TL1 / TL2 の判定に基づき、Leader（CEO）は以下を実行する:

APPROVE ─────────────────────────────────────────────────────────────
  → 次の Wave / Phase へ通常進行

CONDITIONAL ─────────────────────────────────────────────────────────
  → 条件事項を次タスクの指示に明示的に記述して引き継ぐ
  → 条件未達の機能は MVP スコープから除外するか、条件を満たす設計に変更する

REJECT ──────────────────────────────────────────────────────────────
  → 現在のプロジェクト提案をリジェクト
  → Legal Counsel が提示した代替案を評価する
  → CEO が代替案から新方向性を選定し、新しい前提条件でフェーズを再実行する
  → ログ: logs/decision-timeline.md に REJECT 理由・代替案選定の記録を残す
```

---

## 議事ログ管理

1. **タスクログ** (`logs/phaseN/tXX-*-log.md`) — 調査・分析過程
2. **法的レビューログ** (`logs/phaseN/tLX-legal-review-log.md`) — 法的判定過程・根拠
3. **ディスカッションログ** (`logs/phaseN/discussion-*.md`) — チームメイト間のやり取り
4. **意思決定タイムライン** (`logs/decision-timeline.md`) — 全フェーズの主要決定（法的REJECT記録を含む）

---

## 成果物一覧（企画完了時）

| フェーズ | 成果物 | パス |
|---------|--------|------|
| Phase 1 | 法的初期スクリーニング | `docs/phase1-legal-screening.md` |
| Phase 1 | 競合分析レポート | `docs/phase1-competitor-analysis.md` |
| Phase 1 | トレンド分析レポート | `docs/phase1-trend-analysis.md` |
| Phase 1 | ペインポイントレポート | `docs/phase1-pain-points.md` |
| Phase 1 | リサーチ統合レポート | `docs/phase1-synthesis.md` |
| Phase 2 | アーキテクチャ設計 | `docs/phase2-architecture.md` |
| Phase 2 | UI/UX設計 | `docs/phase2-ui-design.md` |
| Phase 2 | マーケティング戦略 | `docs/phase2-marketing-strategy.md` |
| Phase 2 | 法的コンプライアンスレビュー | `docs/phase2-legal-review.md` |
| Phase 2 | アーキテクチャ意思決定 | `docs/phase2-decision.md` |
| Phase 3 | ペルソナ定義 | `docs/phase3-personas.md` |
| Phase 3 | 機能要件定義 | `docs/phase3-functional-requirements.md` |
| Phase 3 | ビジネスモデル | `docs/phase3-business-model.md` |
| Phase 3 | 法的最終レビュー | `docs/phase3-legal-final-review.md` |
| Phase 3 | MVPスコープ確定 | `docs/phase3-mvp-scope.md` |
| Phase 4 | 技術スタック定義 | `.claude/rules/tech-stack.md` |
| Phase 4 | ブランチ戦略 | `.claude/rules/branching-strategy.md` |
| Phase 4 | UX/UI設計仕様 | `docs/phase4-ux-spec.md` |
| Phase 4 | 機能要件（実装レベル） | `docs/phase4-impl-spec.md` |

---

## 起動手順

1. Leader（CEO）が本ファイルを読み込む
2. Phase 1 → Phase 4 を順次実行（各Phase内は並列最大化）
3. 各フェーズの法的ゲート（TL0/TL1/TL2）の判定に基づいてフロー分岐を制御する
4. Phase 4 完了後、全成果物を確認し、開発オーケストレーターへ引き継ぐ
