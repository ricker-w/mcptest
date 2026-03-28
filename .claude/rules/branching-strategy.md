# Branching Strategy — 汎用ブランチ戦略

## ブランチ構成

```
main          ← 本番（安定版）。リリースのソース
develop       ← 統合ブランチ（PR のマージ先）
feat/*        ← 機能開発
fix/*         ← バグ修正
docs/*        ← ドキュメント・仕様変更
chore/*       ← 設定・依存更新等
```

## フロー

```
feat/xxx ──PR──▶ develop ──PR──▶ main ──▶ CI/CD ──▶ リリース
```

1. `develop` から作業ブランチを切る
2. 作業ブランチから `develop` へ PR を出してマージする
3. リリース準備が整ったら `develop` から `main` へ PR を出す

## ルール

- 作業ブランチは必ず `develop` から切る
- `main` / `develop` への直接 push は禁止
- PR のベースブランチは `develop` をデフォルトとする
- `main` への force push は絶対に行わない
- **PR は人間のレビューを通さない。** 品質ゲート通過後、即座に develop へマージしてよい

## 品質ゲート（マージ前チェック）

### 作業ブランチ → develop マージ前

以下を **すべて通過** させてから PR を作成すること。
具体的なコマンドはプロジェクトの CLAUDE.md に定義する。

```bash
# 1. Lint
{プロジェクトの lint コマンド}

# 2. ユニットテスト + 統合テスト
{プロジェクトの test コマンド}

# 3. E2E テスト（ある場合）
{プロジェクトの e2e コマンド}
```

**1つでも失敗した場合は PR を作成しない。** 修正してから再実行する。

### develop → main マージ前

develop に複数の PR がマージされた後、main へのリリース PR を出す前に **再度** 品質ゲートを実行する。

### 品質ゲート失敗時の対応

- **develop 上でエラーが見つかった場合**: `fix/*` ブランチを切って修正し、develop にマージしてから main へのリリース PR を出す
- **main マージ後に問題が発覚した場合**: 即座に `fix/*` ブランチで修正 → develop → main の通常フローで修正を反映する。`main` への直接 push は行わない

## Claude Code 作業フロー

Claude Code がコード変更を行う際の標準フロー。
**PR は人間のレビューを通さない。** 作成後、品質ゲートが通過していればそのまま即座に develop へマージする。

```bash
# 1. develop から作業ブランチを作成
git checkout develop
git pull origin develop
git checkout -b <prefix>/<description>

# 2. 変更をコミット
git add <files>
git commit -m "..."

# 3. 品質ゲート（必須）
# プロジェクト固有のコマンドを実行

# 4. リモートにプッシュ & PR作成 & マージ & ローカル最新化
git push -u origin <prefix>/<description>
gh pr create --base develop --title "..." --body "..."
gh pr merge <number> --squash --delete-branch
git checkout develop
git pull origin develop
```

**ブランチプレフィックス選択基準**:
- `feat/` — 新機能追加
- `fix/` — バグ修正
- `docs/` — ドキュメント・仕様のみの変更
- `chore/` — 設定ファイル変更、不要ファイル削除、依存更新等

### develop → main リリース時の追加手順

```bash
git checkout develop
git pull origin develop

# 品質ゲートを全て通過させる

# 全パス後にリリース PR を作成
gh pr create --base main --head develop --title "release: vX.Y.Z" --body "..."
gh pr merge <number> --merge --delete-branch=false
```

**注意**: develop → main は `--merge`（マージコミット）を使用する。`--squash` は使わない（develop の履歴を保持するため）。

## コミットメッセージ規約（Conventional Commits）

```
<type>(<scope>): <subject>

type:
  feat     - 新機能
  fix      - バグ修正
  chore    - ビルド・依存関係・設定変更
  docs     - ドキュメントのみ
  refactor - リファクタリング（機能変更なし）
  test     - テスト追加・修正
  perf     - パフォーマンス改善
  ci       - CI/CD 設定変更

scope（任意）:
  プロジェクト固有のスコープを定義すること

例:
  feat(api): add user authentication endpoint
  fix(ui): resolve dark mode toggle state persistence
  test(api): add path traversal security tests
  chore(deps): update express to v5.x
```

## バージョン管理

```
vMAJOR.MINOR.PATCH

MVP リリース: v0.1.0
安定版: v1.0.0
```

---

## 禁止事項

| # | 禁止 | 理由 |
|---|------|------|
| F1 | `main` への直接 push | 品質ゲートを迂回するため |
| F2 | `develop` への直接 push | CI チェックを迂回するため |
| F3 | `.env` / `.claude/` のコミット | シークレット漏洩・プロンプト機密 |
| F4 | CI が RED のまま `--force` マージ | 品質保証の崩壊 |
| F5 | feat ブランチへの複数機能の混在 | レビュー・ロールバックが困難 |
