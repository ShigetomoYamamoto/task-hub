---
name: フィーチャー実装（TDD一気通貫）
description: 仕様確認 → TDD → 実装 → コードレビュー → コミットを一気通貫で実行します
---

# /implement-feature

## 手順

### 1. 仕様確認

REQUIREMENTS.md と DESIGN.md を読む。
実装対象の機能に関するセクションを特定し、以下を整理する:
- 対応する FR 番号
- 設計書の該当セクション（DESIGN.md Phase 3）
- 関連する ADR（docs/adr/）
- 入力値・バリデーション・エラーケース
- SwiftData の制約（複合ユニーク、インボックス保護など）

### 2. テストを先に書く（RED）

TaskHubTests/ にテストファイルを作成する。
以下のケースを網羅する:
- 正常系（ハッピーパス）
- バリデーションエラー
- エッジケース（空配列、nil、重複IDなど）
- SwiftData 制約違反（重複 externalId など）

xcodebuild test を実行して **FAIL することを確認する**。

### 3. 実装（GREEN）

テストがパスする最小限の実装を書く。
.claude/rules/architecture.md の責務分離ルールに従う。
.claude/rules/swift.md の規約に従う。

xcodebuild test を実行して **全件 PASS することを確認する**。

### 4. リファクタリング（REFACTOR）

コードの重複・命名・責務の分散を確認して改善する。
テストが引き続き PASS することを確認する。

### 5. コードレビュー

code-reviewer エージェントを起動してレビューを受ける。
CRITICAL・HIGH の指摘は修正してから次へ進む。

### 6. セキュリティレビュー（Keychain/HTTP/認証に関係する場合）

security-reviewer エージェントを起動してレビューを受ける。

### 7. プリコミットチェック

/precommit-check を実行して全 PASS を確認する。

### 8. コミット

Conventional Commits 形式でコミットする。
