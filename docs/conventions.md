# 命名規則・コーディング規約（TaskHub / Swift）

## 命名規則

### Swift 全般

| 対象 | 規則 | 例 |
|------|-----|-----|
| 型（class / struct / enum / protocol） | UpperCamelCase | `TaskRepository`, `IntegrationProvider` |
| 変数・プロパティ・関数 | lowerCamelCase | `fetchInboxTasks()`, `isCompleted` |
| 定数（グローバル） | lowerCamelCase | `defaultSortOrder` |
| 列挙ケース | lowerCamelCase | `case notStarted`, `case inProgress` |
| プロトコル | UpperCamelCase（動詞 + `ing` / 名詞） | `IntegrationProvider`, `Sendable` |
| ファイル名 | 型名と一致（1ファイル = 1型が原則） | `TaskRepository.swift` |

### SwiftData @Model

- プロパティ名は Swift 標準: `lowerCamelCase`
- DB の列名に直接マップされる（SwiftData が自動変換）
- 関係プロパティは逆参照も必ず定義する (`inverse:` 指定)

### ViewModel

- 命名: `{機能名}ViewModel`（例: `TodayViewModel`, `InboxViewModel`）
- `@Observable` を使う（`ObservableObject` は使わない）
- `private(set) var` でデフォルト readonly、`mutating` は避ける

### Repository

- 命名: `{エンティティ名}Repository`（例: `TaskRepository`, `ConnectionRepository`）
- メソッド命名: `fetch*`（取得）、`create`（作成）、`update`（更新）、`delete`（削除）

### Service

- 命名: `{ユースケース名}Service`（例: `SyncService`, `ReportService`）
- 並行アクセスがある場合は `actor` として宣言

### Provider（インテグレーション）

- 命名: `{ツール名}Provider`（例: `NotionProvider`, `GoogleSheetsProvider`）
- `IntegrationProvider` プロトコルを必ず実装

## コーディング規約

### イミュータブル優先

```swift
// Good: 新しい値を作る
let updatedTask = Task(
    id: task.id,
    title: newTitle,
    status: task.status
)

// Bad: 既存の値を直接変更
task.title = newTitle  // SwiftData の @Model では必要な場合もあるが、原則避ける
```

### 非同期処理

- `async/await` を使う（`.then().catch()` スタイルは禁止）
- エラーは `try/catch` でハンドリング
- MainActor への戻りは `await MainActor.run { }` または `@MainActor` アノテーション

```swift
// Good
func loadTasks() async {
    do {
        let tasks = try await taskRepository.fetchInboxTasks()
        await MainActor.run { self.tasks = tasks }
    } catch {
        await MainActor.run { self.errorMessage = error.localizedDescription }
    }
}
```

### エラーハンドリング

- エラーを黙って飲み込まない（`catch { }` 禁止）
- 境界（ViewModel / Service）で必ずキャッチしてユーザーフレンドリーなメッセージに変換
- ログには十分なコンテキストを含める

```swift
// Good
} catch let error as URLError {
    logger.error("Network error: \(error.localizedDescription), code: \(error.code)")
    throw SyncError.networkUnavailable(underlying: error)
}
```

### SwiftData 操作

- `ModelContext` への直接アクセスは Repository 内のみ
- バルク挿入はトランザクションでまとめる
- `FetchDescriptor` のソート・フィルタは可能な限り SwiftData 側で行う（インメモリフィルタは最後の手段）

```swift
// Good: SwiftData でフィルタリング
let descriptor = FetchDescriptor<Task>(
    predicate: #Predicate { task in
        task.list?.isInbox == true && !task.isCompleted
    },
    sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
)
```

### アクセス制御

- デフォルト `internal`
- 外部公開は明示的に `public` / `open`
- テスト用は `@testable import`
- `private` を積極的に使い、必要な範囲を最小化

### デバッグ出力

- `print()` は本番コードに残さない
- `Logger`（os.log）を使う

```swift
import OSLog

private let logger = Logger(subsystem: "com.example.TaskHub", category: "SyncService")

// 使用例
logger.info("Sync started: \(connection.name)")
logger.error("Sync failed: \(error.localizedDescription)")
```

## ファイル構成規約

```swift
// ファイルの並び順
import Foundation  // 1. 標準ライブラリ
import SwiftUI     // 2. Apple フレームワーク
// ブランク行
// 3. サードパーティ（今のところなし）
// ブランク行
// 4. プロジェクト内モジュール（同じモジュール内なら不要）

// MARK: - 型定義
struct TaskRepository {
    // MARK: - Properties
    private let context: ModelContext

    // MARK: - Init
    init(context: ModelContext) { ... }

    // MARK: - Fetch
    func fetchInboxTasks() throws -> [Task] { ... }

    // MARK: - Create / Update / Delete
    func create(_ task: Task) throws { ... }
}
```

## SwiftLint 設定（.swiftlint.yml）

`.swiftlint.yml` で以下のルールを有効にすること（Xcode プロジェクト作成後に設置）:

```yaml
disabled_rules:
  - trailing_whitespace
opt_in_rules:
  - empty_count
  - explicit_init
  - first_where
  - force_unwrapping
  - implicitly_unwrapped_optional
line_length: 120
type_body_length:
  warning: 300
  error: 500
function_body_length:
  warning: 40
  error: 60
file_length:
  warning: 600
  error: 800
```
