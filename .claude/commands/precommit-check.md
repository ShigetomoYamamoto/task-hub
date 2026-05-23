---
name: プリコミットチェック（Swift）
description: SwiftLint・ビルド・テスト・カスタム静的解析を順番に実行します
---

# /precommit-check

以下を順番に実行する。いずれかが失敗したら **その場で停止して修正する**。

### 1. SwiftLint

```bash
swiftlint lint --strict --reporter xcode
```

警告・エラーが 0 件になるまで修正する。

### 2. ビルド確認

```bash
xcodebuild build \
  -scheme TaskHub \
  -destination "platform=macOS,arch=arm64" \
  -configuration Debug \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO \
  | xcpretty
```

### 3. テスト実行（カバレッジ付き）

```bash
xcodebuild test \
  -scheme TaskHub \
  -destination "platform=macOS,arch=arm64" \
  -configuration Debug \
  -enableCodeCoverage YES \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO \
  | xcpretty
```

カバレッジが 80% 未満の場合は追加テストを書いてから進む。

### 4. カスタム静的解析

```bash
bash .github/scripts/audit-custom.sh
```

### 5. 完了報告

全ステップが PASS したら「プリコミットチェック: 全 PASS ✅」と報告する。
