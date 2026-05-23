---
name: PR作成
description: コミット履歴を分析してPRテンプレを埋めて作成します
---

# /create-pr

## 手順

### 1. 変更内容を収集する

```bash
git log develop..HEAD --oneline
git diff develop...HEAD --stat
```

全コミット（最新だけでなく全件）を分析して変更の全容を把握する。

### 2. PR の情報を整理する

- タイトル: 70文字以内、feat: / fix: / refactor: プレフィックスを付ける
- 関連 Issue: Closes #番号 があれば記載
- チェックリスト項目の確認

### 3. PR を作成する

.github/PULL_REQUEST_TEMPLATE.md に従って PR を作成する:

```bash
git push -u origin HEAD
gh pr create \
  --base develop \
  --title "feat: ..." \
  --body "$(cat <<'BODY'
## 概要

Closes #

## 変更内容

-

## チェックリスト

- [ ] SwiftLint: 警告ゼロ
- [ ] ビルド: エラーなし
- [ ] テスト: 全件 PASS（カバレッジ 80% 以上）
- [ ] カスタム静的解析: CRITICAL 0 件
- [ ] セキュリティ確認（認証情報のハードコードなし・HTTPS のみ）
- [ ] Keychain のみで認証情報を保管
- [ ] DESIGN.md のアーキテクチャ規約に準拠
BODY
)"
```
