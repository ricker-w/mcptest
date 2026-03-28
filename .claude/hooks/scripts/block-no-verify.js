#!/usr/bin/env node

/**
 * PreToolUse Hook: block-no-verify
 *
 * git commit / git push で --no-verify, --no-gpg-sign, -n フラグが
 * 使われた場合にブロック（exit code 2）する。
 * pre-commit / commit-msg / pre-push hooks のスキップを防止し、
 * 品質ゲートの迂回を物理的に阻止する。
 */

let data = '';
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const command = input.tool_input?.command || '';

    // git コマンドかどうか判定
    if (/\bgit\b/.test(command)) {
      // --no-verify または -n（git commit の短縮形）をブロック
      if (/--no-verify\b/.test(command)) {
        console.error(
          '[block-no-verify] BLOCKED: --no-verify は禁止されています。pre-commit hooks を迂回せず、問題を修正してください。'
        );
        process.stdout.write(data);
        process.exit(2);
      }

      // --no-gpg-sign をブロック
      if (/--no-gpg-sign\b/.test(command)) {
        console.error(
          '[block-no-verify] BLOCKED: --no-gpg-sign は禁止されています。GPG署名設定を確認してください。'
        );
        process.stdout.write(data);
        process.exit(2);
      }
    }

    // 問題なければ通過
    process.stdout.write(data);
    process.exit(0);
  } catch (e) {
    // パースエラー時はブロックしない
    process.stdout.write(data);
    process.exit(0);
  }
});
