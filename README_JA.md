# TeamUp — AI駆動型 新規事業アイデエーションテンプレート

Claude Teams を使って専門AIエージェントチームを起動し、市場調査・競合分析からMVP仕様・技術アーキテクチャまでを一気通貫で実施するテンプレートリポジトリ。エージェント間のディスカッションはすべてログとして保存され、人間が議事録として確認できます。

---

## 概要

新しいビジネスアイデアが生まれたら、このリポジトリをクローンしてプロダクトコンセプトを記入し、オーケストレーターを起動するだけです。CEO・市場リサーチャー・Tech Lead・マーケターなどのAI専門家チームが議論・分析を行い、開発チームに引き継げる仕様書セット一式を生成します。

```
新規事業アイデア
       │
       ▼
TeamUp（このリポジトリ）をクロースして新プロジェクトリポジトリとして使用
       │
       ▼
Claude Teams 起動
  ├── Phase 1: リサーチ       （市場・トレンド・UXペインポイント）
  ├── Phase 2: 技術設計       （アーキテクチャ・UI/UX・マーケ戦略）
  ├── Phase 3: プロダクト定義 （ペルソナ・要件定義・ビジネスモデル）
  └── Phase 4: 仕様具体化     （技術スタック・UX仕様・実装仕様）
       │
       ▼
docs/          ← 分析レポート・仕様書
logs/          ← ディスカッションログ（議事録）
.claude/rules/ ← 次の開発リポジトリ向け確定仕様
```

---

## 使い方

### 1. クローンして新プロジェクトリポジトリを作成

```bash
gh repo create my-new-product --template <このリポジトリ>
cd my-new-product
```

### 2. オーケストレーターをカスタマイズ

`.claude/orchestrators/product-ideation-template.md` を編集し、`{...}` プレースホルダーを埋めます:

- プロダクト名とコンセプト
- コア思想
- 制約条件（チーム規模・技術要件・配布形態）
- 初期機能一覧

### 3. Team Leader を起動

Claude Code を開き、Team Leader（CEO エージェント）にオーケストレーターを読み込ませて実行を開始させます:

```
.claude/orchestrators/product-ideation-template.md を読み込んで Phase 1 を開始してください。
```

Leader は自動的に Teammate を起動し、並列ウェーブでタスクを委譲・収集します。

### 4. 成果物を確認

全フェーズ完了後、以下の成果物を確認できます:

| 場所 | 内容 |
|------|------|
| `docs/` | フェーズごとのレポート（競合分析・アーキテクチャ・ペルソナ等） |
| `logs/` | フェーズごとのディスカッションログ（議事録として読める） |
| `.claude/rules/` | 次の開発リポジトリ向けの確定済み技術スタック・ブランチ戦略 |

---

## ディレクトリ構造

```
.
├── .claude/
│   ├── agents/          # 専門エージェントプロンプト（Teammate に自動注入）
│   ├── contexts/        # 実行モードオーバーレイ（planning / research / dev / review）
│   ├── hooks/           # 自動フック（コスト追跡・安全ガード）
│   ├── orchestrators/   # Team Leader が読む実行指示書
│   ├── rules/           # 全エージェント共通ルール
│   └── skills/          # fork コンテキストで実行される再利用スキル
├── docs/                # 生成されたレポート・仕様書（実行時に作成）
└── logs/                # エージェント議事録・ディスカッションログ（実行時に作成）
```

### `.claude/agents/`

各エージェントのペルソナ・能力・出力形式・成功基準を定義した Specialist Agent（SA）プロンプト。CRISP 形式（Context / Role / Intent / Steps / Proof）で記述します。

| エージェント | 役割 |
|------------|------|
| `ceo.md` | 最終意思決定者。全分析を評価し方向性を決定する |
| `market-researcher.md` | TAM/SAM/SOM・競合ベンチマーク・定量データ収集 |
| `trend-analyst.md` | 業界トレンド・「Why Now?」タイミング分析 |
| `ux-researcher.md` | JTBDフレームワークによるユーザーペインポイント分析 |
| `tech-lead.md` | 技術スタック選定・アーキテクチャ設計 |
| `developer.md` | 実装工数見積もり・開発フロー定義 |
| `product-manager.md` | ペルソナ・機能要件・MVPスコープ定義 |
| `product-designer.md` | UI/UXコンポーネント設計・画面フロー |
| `marketer.md` | ポジショニング・ローンチ戦略・コミュニティ構築 |
| `business-analyst.md` | ビジネスモデル・マネタイズ・収益予測 |
| `devops-engineer.md` | CI/CD・インフラ・デプロイ戦略 |
| `qa-engineer.md` | テスト戦略・品質ゲート定義 |
| `technical-writer.md` | ドキュメント基準・成果物出力 |

### `.claude/orchestrators/`

Team Leader 向けの実行指示書。タスクDAG・ウェーブ実行計画・エージェントアサイン・成果物一覧を定義します。

- `product-ideation-template.md` — 新規プロダクト企画テンプレート（Phase 1〜4）

新プロジェクトごとにこのファイルをコピーしてカスタマイズします。

### `.claude/rules/`

全エージェントが参照する共通ルール。チーム全体の一貫した動作を強制します。

| ファイル | 内容 |
|---------|------|
| `orchestration.md` | 3層アーキテクチャ（Leader / Advisor / Teammate）・通信プロトコル |
| `tdd-practices.md` | TDDサイクル・テストピラミッド・カバレッジ目標 |
| `branching-strategy.md` | Gitブランチング・PRフロー・品質ゲート |
| `coding-style.md` | 言語非依存のコード品質基準 |
| `security.md` | 入力バリデーション・インジェクション防止・シークレット管理 |

> **注意**: `tech-stack.md` は Phase 4 で Tech Lead エージェントが生成してここに配置します。

### `.claude/contexts/`

特定の実行コンテキスト向けにエージェントの動作を変えるモードオーバーレイです。

| ファイル | 使用タイミング |
|---------|--------------|
| `planning.md` | アーキテクチャ設計・タスク分解セッション |
| `research.md` | 競合・市場リサーチセッション |
| `dev.md` | 実装セッション |
| `review.md` | コード・仕様レビューセッション |

### `.claude/skills/`

fork コンテキストで実行される再利用可能なマイクロスキル。各スキルに `SKILL.md` があり、入力・手順・成功基準を定義しています。

| スキル | 目的 |
|-------|------|
| `spec-creator` | CRISP形式のエージェント/スキル/ルール/オーケストレーター仕様書を生成 |
| `common-doc-writer` | ドキュメントやコードファイルを安全に書き出す |
| `common-doc-reader` | ドキュメントを効率的に読み込み要約・構造化して返す |

### `.claude/hooks/`

ツールイベントに応じて自動実行されるフックスクリプト。

| フック | トリガー | 目的 |
|-------|---------|------|
| `block-no-verify.js` | `PreToolUse(Bash)` | `git --no-verify` の使用を禁止しpre-commitフックを強制 |
| `cost-tracker.js` | `Stop` | セッションごとのトークン使用量とコストを記録 |

### `docs/`

実行時に作成されます。フェーズごとの全成果物を格納します:

```
docs/
├── phase1-competitor-analysis.md    # 競合分析レポート
├── phase1-trend-analysis.md         # トレンド分析レポート
├── phase1-pain-points.md            # ペインポイントレポート
├── phase1-synthesis.md              # リサーチ統合レポート
├── phase2-architecture.md           # アーキテクチャ設計
├── phase2-ui-design.md              # UI/UX設計
├── phase2-marketing-strategy.md     # マーケティング戦略
├── phase2-decision.md               # CEO意思決定（アーキテクチャ確定）
├── phase3-personas.md               # ペルソナ定義
├── phase3-functional-requirements.md # 機能要件定義
├── phase3-business-model.md         # ビジネスモデル
├── phase3-mvp-scope.md              # MVPスコープ確定
├── phase4-ux-spec.md                # UX/UI設計仕様
└── phase4-impl-spec.md              # 機能要件（実装レベル）
```

### `logs/`

実行時に作成されます。フェーズごとのディスカッションログを格納します。議事録として人間が確認できます。

```
logs/
├── phase1/
│   ├── t01-competitor-analysis-log.md
│   ├── t02-trend-analysis-log.md
│   └── ...
├── phase2/
├── phase3/
├── phase4/
└── decision-timeline.md    ← 全フェーズの主要意思決定タイムライン
```

---

## 実行フロー

オーケストレーターは4フェーズで動作し、各フェーズは並列ウェーブで構成されます:

```
Phase 1 — リサーチ
  Wave 1-A（並列）: T01 競合分析
                    T02 トレンド分析
                    T03 UXペインポイント調査
  Wave 1-B（逐次）: T04 リサーチ統合・差別化マトリクス

Phase 2 — 技術設計
  Wave 2-A（並列）: T05 技術設計・アーキテクチャ
                    T06 UI/UXコンポーネント設計
                    T07 マーケティング戦略
  Wave 2-B（逐次）: T08 CEO意思決定（アーキテクチャ確定）

Phase 3 — プロダクト定義
  Wave 3-A（並列）: T09 ペルソナ定義
                    T10 機能要件定義
                    T11 ビジネスモデル
  Wave 3-B（逐次）: T12 CEO意思決定（MVPスコープ確定）

Phase 4 — 仕様具体化
  Wave 4（並列）:   T13 技術スタックルール
                    T14 ブランチ戦略・開発フロー
                    T15 UX/UI設計仕様
                    T16 機能要件（実装レベル）
```

Phase 4 完了時点で全仕様書が揃い、開発リポジトリへの引き継ぎが可能になります。

---

## エージェント通信アーキテクチャ

全エージェントはスター型トポロジーで Team Leader（CEO）を経由して通信します。エージェント間の直接通信は禁止されています。

```
                Team Leader（CEO / Opus）
                        │
         ┌──────────────┼──────────────┐
         │              │              │
      Advisor       Teammate A     Teammate B
    （読み取り専用） （Sonnet）      （Sonnet）
```

- **Team Leader**: タスク委譲・品質ゲート確認・意思決定
- **Advisor**: 仕様書・コードベースを読み込み、Leaderへ蒸留した情報を提供（書き込み禁止）
- **Teammate**: Leaderの指示のみに基づいて実装・調査を実施

---

## カスタマイズガイド

### 新しいエージェントを追加する

```bash
cp .claude/agents/market-researcher.md .claude/agents/my-new-agent.md
# CRISPセクションを編集して新しい専門家を定義する
```

### 新しいオーケストレーターを作成する

spec-creator スキルを使うか、テンプレートをコピーします:

```bash
cp .claude/orchestrators/product-ideation-template.md \
   .claude/orchestrators/my-product.md
# すべての {プレースホルダー} を埋める
```

### ルールを追加・拡張する

`.claude/rules/` に新しい `.md` ファイルを追加します。全エージェントが参照できます。

---

## 動作要件

- [Claude Code](https://claude.ai/code)（Claude Teams 機能が有効なこと）
- Claude Opus 4.x（Team Leader用）+ Claude Sonnet 4.x（Teammate用）
- `.claude/settings.json` に設定された MCP サーバー: `context7`, `serena`, `github`

---

## 関連リソース

- [README.md](./README.md) — 英語版ドキュメント
- `.claude/rules/orchestration.md` — オーケストレーション完全プロトコル
- `.claude/orchestrators/product-ideation-template.md` — オーケストレーターテンプレート
