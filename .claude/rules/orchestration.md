# Orchestration Rule — AI駆動開発のチーム協調ルール

> Claude Teams における Team Leader・Advisor・Teammates の
> 3層アーキテクチャの役割・責務・制約を定義する。
> すべての orchestrator はこのルールに準拠すること。

---

## 用語

| 用語 | 定義 |
|------|------|
| Team Leader | Team を統括する Opus エージェント。orchestrator を読み、Advisor に照会し、Teammates に指示を出す |
| Advisor | 仕様・コードベースを読み込み、Leader に蒸留した情報を提供する参謀エージェント（読み取り専用） |
| Teammate | Leader の指示を受けて実装する専門エージェント。`.claude/agents/*.md` のプロンプトが注入される |
| SA (Specialist Agent) | Teammate に注入される専門プロンプト（`.claude/agents/*.md`） |
| orchestrator | Team Leader 向けの実行指示書（`.claude/orchestrators/*.md`） |
| DAG | タスク間の依存関係グラフ（Directed Acyclic Graph） |
| Wave | 依存関係で区切られた並列実行可能なタスクグループ |

---

## ディレクトリと役割の対応

```
.claude/
├── agents/         ← Teammate に注入する SA プロンプト
├── orchestrators/  ← Team Leader が読む実行指示書
├── rules/          ← 全エージェント共通の技術ルール（常時参照）
├── skills/         ← fork コンテキストで実行される再利用スキル
└── settings.json   ← MCP 設定・環境変数
```

| ファイル | 誰が読むか | 誰が書くか |
|---------|-----------|-----------|
| `orchestrators/*.md` | **Leader のみ** | 人間 |
| `agents/*.md` | **Teammate に自動注入** | 人間 |
| `rules/*.md` | **全員が参照可能** | 人間 |
| `skills/*/SKILL.md` | **Advisor / Teammate（fork）** | 人間 |
| `docs/`, `logs/` | Advisor（読み取り） | Leader / Teammate |

---

## 3層アーキテクチャ

### 設計動機

Leader が仕様書・コードベースをすべて直接読むとコンテキストウィンドウがパンクする。
Advisor 層を中間に配置し、Leader のコンテキスト消費を **進行管理・品質検証** に集中させる。

```
orchestrator (実行指示書)
    │
    ▼ Leader が読む（orchestrator + rules のみ）
Team Leader (Opus) ─── 進行管理・品質検証・意思決定
    │
    ├── TaskList / TaskCreate / TaskUpdate  ← タスク管理
    ├── Bash (テスト・Lint)                 ← 品質検証
    │
    │     ┌───────────────────────────────────┐
    ├──←→─│ Advisor 層（読み取り専用）         │
    │     │  → 仕様書・コードベースを読み込み  │
    │     │  → 蒸留した情報を Leader へ返す    │
    │     └───────────────────────────────────┘
    │
    ▼ 指示を送信（Advisor から得た情報をインラインで記述）
Teammates (Sonnet × N)
    │
    ├── agent プロンプト (.claude/agents/*.md) ← 専門知識が自動注入
    ├── 実装 (Read/Edit/Write/Bash)           ← コード生成
    ├── MCP ツール                            ← 外部ツール
    └── SendMessage → Leader                  ← 完了報告・質問
```

---

## 各層の責務

### Team Leader

| 属性 | 内容 |
|------|------|
| Model | Opus |
| 責務 | タスク分解、依存関係管理（DAG）、品質検証、コンテキスト最適化 |
| 権限 | タスク委譲、品質判定（PASS/FAIL）、Teammate/Advisor 起動・停止 |
| 制約 | **仕様の直接参照はしない（Advisor に委譲）** |

### Advisor

| 属性 | 内容 |
|------|------|
| Model | Sonnet |
| 責務 | 仕様書・コードベースの読解、情報の蒸留・構造化、DoD 照合支援 |
| 権限 | `docs/`, `rules/`, `skills/`, ソースコードの読み取り専用アクセス |
| 制約 | **書き込みは行わない。Teammate への直接メッセージ禁止** |

### Teammate

| 属性 | 内容 |
|------|------|
| Model | Sonnet |
| 責務 | Leader の指示に基づく実装と報告 |
| 権限 | 指示されたスコープ内のコード生成・変更 |
| 制約 | **仕様書を直接読まない。Leader の指示のみで実装する** |

---

## タスク実行フロー

### STEP 1: Team 初期化

```
1. Leader が orchestrator (.claude/orchestrators/*.md) を読む
2. TeamCreate で Team を作成
3. Advisor を起動（Team 全期間常駐）
4. TaskCreate で全タスクを登録（blocked_by で依存関係を DAG 定義）
5. 最初の Wave の Teammates を起動
```

### STEP 2: タスク委譲（Wave 単位で並列実行）

```
FOR EACH wave IN waves:
  FOR EACH task IN wave (並列実行可能):
    IF task.blocked_by ALL completed:

      2-1. Advisor に照会
           → 「タスク T{XX} の実装に必要な情報を提供してください」
           → Advisor が仕様・コードベースを読み、蒸留して返す

      2-2. Teammate に SendMessage で指示
           Advisor の返答をベースに、以下をインラインで記述:
           - 成果物一覧（ファイルパス）
           - 実装仕様
           - TDD フロー（テストを先に書く指示）
           - DoD チェックリスト
           - 他 Teammate との境界・依存

      2-3. Teammate からの完了報告を待機

      2-4. 品質検証（STEP 3）
           PASS → TaskUpdate(completed)
           FAIL → 具体的フィードバック → 再実装指示（最大3回）
```

**インライン原則**: Teammate に仕様書のパスを伝えるのではなく、Advisor から得た情報を
**Leader のメッセージ本文に直接記述** する。Teammate は仕様ファイルを直接読まない。

### STEP 3: 品質検証

各タスク完了時に Leader が実施する品質ゲート:

| # | 検証項目 | 方法 |
|---|---------|------|
| QG-1 | テスト全 PASS | プロジェクトのテストコマンドを実行 |
| QG-2 | Lint PASS | プロジェクトの Lint コマンドを実行 |
| QG-3 | E2E PASS | プロジェクトの E2E テストコマンドを実行 |
| QG-4 | DoD 全項目チェック | タスク定義の DoD と照合 |
| QG-5 | 成果物レビュー | コード品質、セキュリティ確認 |

### STEP 4: コンテキスト管理

| タスク状態 | Leader が保持する情報 | Leader が保持しない情報 |
|-----------|---------------------|----------------------|
| COMPLETED | task_id, status, 成果物パス | 実装詳細、往復メッセージ |
| IN_PROGRESS | 指示内容、進行状況 | タスク定義全文（Advisor に再クエリ可） |
| PENDING | task_id, blocked_by, wave | タスク定義（Advisor に都度クエリ） |

**圧縮タイミング**: タスク completed 直後、Wave 完了時、コンテキスト使用率 70% 到達時

---

## Teammate ログ出力（必須）

### ログ出力ルール

**全 Teammate は、タスク完了時に以下のログを出力する義務がある。**
ログは `logs/` ディレクトリに保存する。

### ログフォーマット

```markdown
# [タスクID] タスク名 — 実装ログ

**担当:** [エージェント名 (SA プロンプト名)]
**開始:** [タイムスタンプ]
**完了:** [タイムスタンプ]
**所要時間:** [推定所要時間]
**トークン使用量:** [推定トークン数]

## 実装内容

### 変更ファイル一覧
| ファイル | 変更種別 | 行数 |
| path/to/file.js | 新規作成 | 150行 |
| path/to/file.css | 新規作成 | 80行 |

### 実装サマリー
- {何を実装したかの箇条書き}

## テスト結果

| テストファイル | テスト数 | PASS | FAIL |
| tests/unit/xxx.test.js | 12 | 12 | 0 |

## 品質チェック
- [ ] Lint PASS
- [ ] テスト PASS

## 未解決課題・申し送り
- {あれば記載}
```

### ログの目的

1. **コスト追跡**: トークン使用量を記録し、AI開発コストを可視化する
2. **進捗可視化**: 何にどれだけ時間がかかったかを追跡する
3. **再現性**: 同様のタスクの工数見積もりに活用する
4. **デバッグ**: 問題発生時に実装経緯を追跡する

---

## 情報フロー制約

```
【許可される通信】
  Leader  → Advisor  : SendMessage（仕様照会、DoD確認依頼）
  Advisor → Leader   : SendMessage（蒸留された情報）
  Leader  → Teammate : SendMessage（指示、フィードバック）
  Teammate → Leader  : SendMessage（完了報告、質問）

【禁止される通信】
  Teammate → Teammate : 直接メッセージ（Leader 経由のみ）
  Teammate → Advisor  : 直接メッセージ（Leader 経由のみ）
  Advisor  → Teammate : 直接メッセージ（Leader 経由のみ）
```

**Star Topology**: Leader を hub とした star topology。全通信が Leader を経由し、情報の矛盾・散逸を防止する。

---

## Teammate 動作原則

| ID | 原則 | 詳細 |
|----|------|------|
| T-1 | 仕様ファイルを読まない | `docs/`, `skills/` を直接読まない。Leader が必要情報を伝達する |
| T-2 | orchestrator を読まない | `.claude/orchestrators/` は Leader のみが読む |
| T-3 | Leader 指示のみで実装 | 指示にない追加機能・リファクタリングは行わない |
| T-4 | SA プロンプトに従う | 注入された `.claude/agents/*.md` の技術ガイドラインに沿う |
| T-5 | 完了報告 + ログ出力 | (1) 変更ファイル一覧 (2) テスト結果 (3) 未解決課題 + ログファイル出力 |
| T-6 | 判断保留 | 曖昧な点は Leader に確認。自己判断で進めない |
| T-7 | スコープ厳守 | 指示されたスコープのみ。「ついでに」の改善は行わない |
| T-8 | TDD 遵守 | テストを先に書く（プロジェクトの TDD ルールに従う） |

### Teammate 禁止事項

| ID | 禁止事項 | 理由 |
|----|---------|------|
| NT-1 | `.claude/` 配下の読み込み（agents/ は自動注入で除く） | orchestrator, rules, skills は Leader/Advisor の責務 |
| NT-2 | 他の Teammate / Advisor への直接メッセージ | 情報フロー一元化 |
| NT-3 | git commit / push | バージョン管理は Leader が行う |
| NT-4 | 依存パッケージの追加・削除 | package.json の変更は Leader 承認が必要 |
| NT-5 | `.env` ファイルの変更 | 環境変数変更は Leader 承認が必要 |

---

## 並列実行の戦略

### DAG（依存関係グラフ）

全タスクは `blocked_by` で依存関係を定義する。依存がないタスクは **同一 Wave 内で並列実行** する。

```yaml
# 例: 並列実行可能なタスク定義
tasks:
  - id: T01
    name: "タスクA"
    blocked_by: []

  - id: T02
    name: "タスクB"
    blocked_by: []    # T01 と並列実行可能

  - id: T03
    name: "タスクC"
    blocked_by: [T01, T02]    # T01, T02 完了後に実行
```

### Wave 実行パターン

```
Wave N:
  1. blocked_by が全て completed のタスクを特定
  2. 各タスクに対応する Teammate を起動（SA プロンプト注入）
  3. 並列に SendMessage で指示
  4. 全 Teammate の完了報告を待機
  5. 品質検証（QG-1〜QG-5）
  6. 全 PASS → Wave 完了 → 次の Wave へ
```

### 並列実行の安全ルール

| # | ルール |
|---|--------|
| P-1 | **ファイル競合回避**: 並列タスクは異なるファイルを編集する。同一ファイルを触る場合は順次実行 |
| P-2 | **インターフェース先行**: 並列タスクが共有するインターフェース（型定義、API契約）は Wave の最初に定義する |
| P-3 | **統合テストは後**: 個別タスクの完了後に統合テストを実施する（別 Wave） |

---

## Wave 完了サマリー

Wave 完了時に Leader が記録する:

```markdown
## Wave {N} 完了サマリー

| タスク | 担当SA | 状態 | 成果物数 | テスト数 | トークン(推定) |
|--------|--------|------|---------|---------|---------------|
| T{XX}  | {SA名} | PASS | {N}件   | {N}件   | {N}k          |

### 品質指標
- テスト: 全PASS
- Lint: 0エラー
- E2E: 全PASS

### 次 Wave への申し送り
- {メモ}
```

---

## エージェントライフサイクル

```
Team 開始時:
  1. Advisor を起動（常駐。Team 終了まで生存）
  2. Wave 1 の Teammates を起動

Wave 開始時:
  FOR EACH teammate NEEDED in this wave:
    IF NOT already running:
      起動（SA プロンプト注入）

Wave 完了時:
  FOR EACH active teammate NOT needed in next wave:
    SendMessage(shutdown_request)

全タスク完了後:
  1. 全 Teammate を停止
  2. Advisor を停止（最後に）
  3. TeamDelete()
```

---

## 例外処理

| 状況 | 対応 |
|------|------|
| Teammate のコンテキスト枯渇 | Leader が中間成果物を回収し、新 Teammate に引き継ぎ |
| Advisor のコンテキスト枯渇 | 新 Advisor を起動し、参照ドキュメント一覧を再伝達 |
| 品質ゲート 3回連続 FAIL | Leader が Advisor に仕様確認を依頼し、自ら直接修正 |
| Teammate が応答しない | shutdown_request → 新 Teammate 起動で代替 |
| 想定外の依存関係発見 | Leader が TaskUpdate で blocked_by を追加し、DAG を更新 |
| 複数 Teammate の成果物が競合 | Leader がマージ判断し、一方に修正指示 |

---

## orchestrator 作成ガイドライン

新しい orchestrator を作成する際は、以下を含めること:

```markdown
# {name} Orchestrator

## Team Structure
team_name: {name}
lead: Opus

advisors:
  - name: advisor
    model: sonnet
    lifecycle: Team 全期間常駐

teammates:
  - name: {instance-name}
    agent: {sa-prompt-name}    ← .claude/agents/ 配下のファイル名
    model: sonnet

## タスク一覧と DAG
- TaskCreate の一覧（blocked_by 依存関係を明記）

## Wave 実行計画
### Wave N: {name}
- タスク配分と実行順序（並列可能なものは並列）

## 品質ゲート
- orchestration.md STEP 3 に準拠
```
