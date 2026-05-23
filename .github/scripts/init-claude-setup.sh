#!/usr/bin/env bash
# TaskHub — .claude/ 配下の設定ファイルを一括生成するセットアップスクリプト
# 実行方法: bash .github/scripts/init-claude-setup.sh
set -euo pipefail

echo "=== TaskHub .claude/ セットアップ ==="

mkdir -p .claude/rules .claude/commands .claude/agents .claude/hooks

# ─────────────────────────────────────────────────────────────────
# .claude/settings.json
# ─────────────────────────────────────────────────────────────────
cat > .claude/settings.json << 'EOF'
{
  "defaultMode": "auto",
  "permissions": {
    "allow": [
      "Bash(xcodebuild *)",
      "Bash(xcrun *)",
      "Bash(swift *)",
      "Bash(swiftlint *)",
      "Bash(swiftformat *)",
      "Bash(brew install swiftlint)",
      "Bash(brew install swiftformat)",
      "Bash(bash .github/scripts/*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/debug-output-detector.py"
          }
        ]
      }
    ]
  }
}
EOF
echo "✓ .claude/settings.json"

# ─────────────────────────────────────────────────────────────────
# .claude/hooks/debug-output-detector.py
# ─────────────────────────────────────────────────────────────────
cat > .claude/hooks/debug-output-detector.py << 'EOF'
#!/usr/bin/env python3
"""PostToolUse(Edit|Write|MultiEdit): Swift デバッグ出力を即時警告"""
import json, sys, re

try:
    data = json.load(sys.stdin)
    path = data.get('tool_input', {}).get('file_path', '')
    if not path or not path.endswith('.swift'):
        sys.exit(0)

    PATTERNS = [r'\bprint\(', r'\bdebugPrint\(', r'\bdump\(', r'\bbreakpoint\(\)']

    try:
        content = open(path).read()
    except Exception:
        sys.exit(0)

    found = []
    for n, line in enumerate(content.splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith('//'):
            continue
        if any(re.search(p, line) for p in PATTERNS):
            found.append((n, stripped))

    if found:
        print(f'⚠️  デバッグ出力を検出: {path}')
        for n, line in found[:5]:
            print(f'  L{n}: {line}')
        print('  → Logger(subsystem:category:) を使用してください')
except SystemExit:
    raise
except Exception:
    sys.exit(0)
EOF
echo "✓ .claude/hooks/debug-output-detector.py"

# ─────────────────────────────────────────────────────────────────
# .claude/rules/architecture.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/rules/architecture.md << 'EOF'
# アーキテクチャルール（TaskHub）

## 採用パターン: MVVM + Repository + Service Layer

DESIGN.md Phase 3.1 で決定済み。ADR-002 参照。

## レイヤー責務

| レイヤー | 責務 | 禁止事項 |
|---------|------|---------|
| View | 表示と入力イベント発火のみ | ModelContext 直接アクセス禁止、API 呼び出し禁止 |
| ViewModel (@Observable) | 画面状態保持、Service 呼び出し | URLSession 直接呼び出し禁止 |
| Service (actor) | 複数 Repository/Provider の協調 | View への直接参照禁止 |
| Repository | SwiftData ModelContext のラッパー | ビジネスロジック禁止 |
| IntegrationProvider | 外部ツール固有の API 実装 | LocalTask の直接操作禁止 |

## 依存の方向（一方向のみ）

View → ViewModel → Service → Repository → SwiftData
                            → IntegrationProvider → HTTPClient / KeychainStore

逆方向の依存は禁止（Repository が ViewModel を参照するなど）。

## ファイルサイズ規約

- 通常: 200-400 行
- 上限: 800 行（超えたら機能別に分割）
- 関数: 50 行以内

## actor の使い所

SyncService・RateLimiter は actor として宣言する。並行アクセスが発生する共有状態には必ず actor を使う。

## SwiftData の重要制約

- (connectionId, externalId) の複合ユニーク制約はアプリ層で強制
- インボックス (isInbox == true の TaskList) は削除・リネーム禁止をアプリ層で強制
- ModelContext への直接アクセスは Repository 内のみ
EOF
echo "✓ .claude/rules/architecture.md"

# ─────────────────────────────────────────────────────────────────
# .claude/rules/swift.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/rules/swift.md << 'EOF'
# Swift コーディングルール（TaskHub）

## イミュータブル優先

ALWAYS create new values, NEVER mutate existing ones（global rule より）。
SwiftData の @Model クラスは更新が必要だが、値型（struct）は必ずイミュータブルパターンを使う。

## 非同期処理

- async/await を使う（DispatchQueue や completion handler は禁止）
- エラーは try/catch でハンドリング
- MainActor への戻りは @MainActor アノテーションか await MainActor.run { }

## ロギング（print() 禁止）

```swift
import OSLog
private let logger = Logger(subsystem: "com.example.TaskHub", category: "SyncService")
logger.info("Sync started: \(connection.name)")
logger.error("Sync failed: \(error.localizedDescription)")
```

## Keychain 操作

KeychainStore.shared 経由のみ。直接 SecItemAdd などを呼ばない。

## HTTP 通信

- HTTPS のみ（http:// 禁止）
- すべての API 呼び出しは HTTPClient 経由
- レート制限は RateLimiter actor で制御（Notion: 3 req/sec）

## エラーハンドリング

- catch { } （空キャッチ）禁止
- ViewModel / Service の境界でキャッチしてユーザーフレンドリーなメッセージに変換

## 型安全

- any プロトコル型の濫用禁止（理由をコメントで記載すること）
- 強制アンラップ (!) 禁止（guard let / if let を使う）
- 強制キャスト (as!) 禁止（as? + guard を使う）
EOF
echo "✓ .claude/rules/swift.md"

# ─────────────────────────────────────────────────────────────────
# .claude/rules/testing.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/rules/testing.md << 'EOF'
# テスト規約（TaskHub）

## カバレッジ目標: 80% 以上

## TDD の手順（必須）

1. テストファイル作成（RED）
2. xcodebuild test で FAIL 確認
3. 最小実装（GREEN）
4. xcodebuild test で全件 PASS 確認
5. リファクタリング（REFACTOR）
6. カバレッジ確認（80% 以上）

## テストの種別

- Unit: Repository / Service / VariableRenderer（モック使用可）
- Integration: SyncService + MockProvider（DB はリアル SwiftData、APIはモック）
- UI: XCUITest で主要フロー（インボックス、今日ビュー、レポート生成）

## テスト実行

```bash
xcodebuild test \
  -scheme TaskHub \
  -destination "platform=macOS,arch=arm64" \
  -enableCodeCoverage YES \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO
```

## モック方針

- 外部 API（Notion / GSheet）: MockProvider を作成してテスト
- SwiftData: インメモリ ModelContext（.inMemory configuration）
- Keychain: MockKeychainStore

## テストファイルの配置

TaskHubTests/{機能名}Tests.swift
TaskHubUITests/{フロー名}UITests.swift
EOF
echo "✓ .claude/rules/testing.md"

# ─────────────────────────────────────────────────────────────────
# .claude/commands/precommit-check.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/commands/precommit-check.md << 'EOF'
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
EOF
echo "✓ .claude/commands/precommit-check.md"

# ─────────────────────────────────────────────────────────────────
# .claude/commands/implement-feature.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/commands/implement-feature.md << 'EOF'
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
EOF
echo "✓ .claude/commands/implement-feature.md"

# ─────────────────────────────────────────────────────────────────
# .claude/commands/spec.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/commands/spec.md << 'EOF'
---
name: 仕様確認
description: 実装前に仕様書の該当箇所を読んで整理します
---

# /spec

引数として機能名・FR番号・画面名等を受け取る。

## 手順

### 1. 仕様書を読む

以下を順に読んで対象機能の仕様を収集する:
1. docs/REQUIREMENTS.md — 対応する FR の機能要件・受け入れ基準
2. docs/DESIGN.md — 設計（データモデル・フロー・インテグレーション）
3. docs/adr/ — 関連する ADR

### 2. 整理して出力する

以下の形式で整理して出力する:

```
## {{ 機能名 }} の仕様

**対応 FR**: FR-XX
**目的**: ...
**関連エンティティ**: ...
**設計書参照**: DESIGN.md Phase X.X

**動作フロー**:
1. ...

**バリデーション / 制約**:
- ...

**エラーケース**:
- ケース: 期待する動作

**SwiftData 上の注意点**:
- ...

**不明点**: （ある場合のみ）
```
EOF
echo "✓ .claude/commands/spec.md"

# ─────────────────────────────────────────────────────────────────
# .claude/commands/create-pr.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/commands/create-pr.md << 'EOF'
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
EOF
echo "✓ .claude/commands/create-pr.md"

# ─────────────────────────────────────────────────────────────────
# .claude/agents/code-reviewer.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/agents/code-reviewer.md << 'EOF'
---
name: code-reviewer
description: Swift コードの品質・セキュリティ・アーキテクチャ準拠をレビューします
model: claude-haiku-4-5
---

# コードレビューエージェント（TaskHub）

## レビュー観点

**アーキテクチャ準拠（.claude/rules/architecture.md）:**
- レイヤー間の依存方向は正しいか
- View が ModelContext に直接アクセスしていないか
- ViewModel から URLSession を直接呼んでいないか

**コード品質（docs/conventions.md）:**
- 関数 50 行以内か
- ファイル 800 行以内か
- print() が残っていないか（Logger を使うこと）
- 強制アンラップ (!) がないか
- any 型の濫用がないか

**セキュリティ（.claude/rules/security.md）:**
- 認証情報のハードコードがないか
- HTTP 通信（非 HTTPS）がないか
- Keychain 以外での認証情報保存がないか

**SwiftData 固有:**
- (connectionId, externalId) の複合ユニーク重複チェックがあるか
- インボックス保護ロジックがあるか
- カスケード削除の deleteRule が正しく設定されているか

## 出力形式

```
## コードレビュー結果

### CRITICAL（必ず修正）
- [ ] ファイル名:行番号 — 問題の説明

### HIGH（強く推奨）
- [ ] ファイル名:行番号 — 問題の説明

### MEDIUM（改善推奨）
- [ ] ファイル名:行番号 — 問題の説明

### 総評
（全体の品質評価を2〜3文で）
```

CRITICAL が 0 件になるまでレビューサイクルを繰り返す。
EOF
echo "✓ .claude/agents/code-reviewer.md"

# ─────────────────────────────────────────────────────────────────
# .claude/agents/tdd-writer.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/agents/tdd-writer.md << 'EOF'
---
name: tdd-writer
description: Swift Testing / XCTest でテストファースト開発を支援します
model: claude-haiku-4-5
---

# TDDライターエージェント（TaskHub）

## 手順

1. 仕様（REQUIREMENTS.md の FR）を確認してテストケースを列挙する:
   - 正常系
   - バリデーションエラー
   - SwiftData 制約違反（重複 externalId など）
   - エッジケース（nil、空配列、0.5h 境界値）

2. TaskHubTests/ にテストファイルを作成する

3. xcodebuild test を実行して **FAIL を確認する（RED）**

4. 最小限の実装を書く

5. xcodebuild test を実行して **全件 PASS を確認する（GREEN）**

6. リファクタリング（REFACTOR）

7. カバレッジ確認（80% 以上）

## 出力形式

- 🔴 RED: テスト X 件作成、全件 FAIL 確認
- 🟢 GREEN: 全 X 件 PASS
- ♻️  REFACTOR: 改善内容
- 📊 カバレッジ: XX%
EOF
echo "✓ .claude/agents/tdd-writer.md"

# ─────────────────────────────────────────────────────────────────
# .claude/agents/security-reviewer.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/agents/security-reviewer.md << 'EOF'
---
name: security-reviewer
description: Keychain・HTTP・認証情報のセキュリティをチェックします
model: claude-haiku-4-5
---

# セキュリティレビューエージェント（TaskHub）

## トリガー条件

- Keychain / HTTP / OAuth に関わるコードを書いたとき
- IntegrationProvider の実装を変更したとき
- Connection / 認証情報を扱うコードを変更したとき

## チェック項目

- [ ] 認証情報（Token / OAuth tokens）が Swift コードにハードコードされていない
- [ ] すべての HTTP 通信が HTTPS を使用している
- [ ] Keychain 操作が KeychainStore.shared 経由のみ
- [ ] アクセストークンがログに出力されていない（logger.info に token を含めない）
- [ ] OAuth PKCE が実装されている（Google Sheets）
- [ ] エラーメッセージに内部情報が含まれていない
- [ ] SwiftData のデータに認証情報が保存されていない（configJSON に token を入れていない）

## 出力形式

```
## セキュリティレビュー結果

### CRITICAL（即座に修正必須）
- [ ] 問題の説明と修正方法

### HIGH（コミット前に修正）
- [ ] 問題の説明と修正方法

### 問題なし
セキュリティ上の問題は検出されませんでした ✅
```

CRITICAL が存在する場合は修正するまで STOP する。
EOF
echo "✓ .claude/agents/security-reviewer.md"

# ─────────────────────────────────────────────────────────────────
# .claude/agents/build-fixer.md
# ─────────────────────────────────────────────────────────────────
cat > .claude/agents/build-fixer.md << 'EOF'
---
name: build-fixer
description: Xcode ビルドエラー・Swift 型エラーを最小差分で修正します
model: claude-haiku-4-5
---

# ビルドフィクサーエージェント（TaskHub）

## 手順

1. xcodebuild のエラー出力を読んで根本原因を特定する
2. 関連ファイルを読む（エラー箇所と周辺コンテキスト）
3. 最小差分の修正を適用する
4. xcodebuild build で修正を確認する

## 制約

- 修正範囲をエラーの直接原因に限定する
- 「ついでに」リファクタリングしない
- SwiftData のスキーマ変更は migration を検討する

## 出力形式

```
## ビルドエラー修正

**根本原因:** ...
**修正ファイル:** ファイル名:行番号
**修正内容:** 変更の説明
**結果:** ✅ ビルド成功 / ❌ 別のエラーが発生（詳細）
```
EOF
echo "✓ .claude/agents/build-fixer.md"

# ─────────────────────────────────────────────────────────────────
# .mcp.json
# ─────────────────────────────────────────────────────────────────
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {}
    }
  }
}
EOF
echo "✓ .mcp.json"

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "生成したファイル:"
echo "  .claude/settings.json"
echo "  .claude/hooks/debug-output-detector.py"
echo "  .claude/rules/architecture.md"
echo "  .claude/rules/swift.md"
echo "  .claude/rules/testing.md"
echo "  .claude/commands/precommit-check.md"
echo "  .claude/commands/implement-feature.md"
echo "  .claude/commands/spec.md"
echo "  .claude/commands/create-pr.md"
echo "  .claude/agents/code-reviewer.md"
echo "  .claude/agents/tdd-writer.md"
echo "  .claude/agents/security-reviewer.md"
echo "  .claude/agents/build-fixer.md"
echo "  .mcp.json"
