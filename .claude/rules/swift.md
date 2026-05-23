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
