---
name: common-doc-writer
description: ドキュメントやコードファイルを安全に書き出すスキル
context: fork
model: haiku
---

# common-doc-writer スキル

## CONTEXT（状況）

### Who（対象ユーザー）

- **全開発エージェント**: 実装コード、テストコード、設定ファイルの書き出し時に使用
- **Technical Writer**: README、CONTRIBUTING 等のドキュメント書き出し時に使用

### Where（実行環境）

**Context Mode**: `fork`
**Model**: haiku

### What（入力データ）

**Required Parameters**:

```yaml
file_path:
  string
  # 書き出し先の絶対パス

content:
  string
  # 書き出す内容
```

**Optional Parameters**:

```yaml
overwrite:
  boolean (default: false)
  # true の場合、既存ファイルを上書き

create_dirs:
  boolean (default: true)
  # true の場合、親ディレクトリを自動作成

verify:
  boolean (default: false)
  # true の場合、書き出し後に読み戻して内容を検証
```

---

## ROLE（役割）

- **権限**: ファイル書き込み。ただし `.claude/` 配下と `.env` ファイルへの書き込みは禁止
- **責務**: 安全にファイルを書き出し、結果を報告する

---

## INTENT（意図）

### Goal

指定されたファイルを安全に書き出し、書き出し結果を親エージェントに報告する。

### Success Criteria

- [ ] ファイルが正常に書き出されている
- [ ] 既存ファイルの意図しない上書きが防止されている
- [ ] 書き出し結果がJSON形式で報告されている

---

## STEPS（手順）

→ STEP 1: 安全チェック
```
IF file_path contains ".claude/" OR file_path ends with ".env":
  RETURN error: "Protected path - write denied"

IF file exists AND overwrite == false:
  RETURN error: "File exists - set overwrite: true to replace"
```

→ STEP 2: ディレクトリ作成
```
IF create_dirs == true:
  CREATE parent directories if not exist
```

→ STEP 3: ファイル書き出し
```
WRITE content to file_path using Write tool
```

→ STEP 4: 検証（オプション）
```
IF verify == true:
  READ written file
  COMPARE with original content
  REPORT match/mismatch
```

---

## PROOF（証明）

### Output Format

```json
{
  "status": "success",
  "file_path": "/path/to/file",
  "action": "created",
  "metadata": {
    "lines": 50,
    "size_bytes": 1024
  }
}
```
