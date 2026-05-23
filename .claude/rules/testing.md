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
