# フィーチャー コードマップ（TaskHub）

DESIGN.md Phase 3.1.3 のモジュール境界に基づく。実装後に更新すること。

## Core レイヤー

| ファイルパス | 責務 |
|-----------|------|
| `TaskHub/Core/Repositories/TaskRepository.swift` | SwiftData Task CRUD ラッパー |
| `TaskHub/Core/Repositories/ProjectRepository.swift` | SwiftData Project / TaskList CRUD |
| `TaskHub/Core/Repositories/ConnectionRepository.swift` | 接続設定の永続化 |
| `TaskHub/Core/Repositories/SyncRecordRepository.swift` | 外部タスク追跡レコードの管理 |
| `TaskHub/Core/Repositories/ReportRepository.swift` | テンプレート / 履歴の永続化 |
| `TaskHub/Core/Services/SyncService.swift` | 並列同期・Reconciler（actor） |
| `TaskHub/Core/Services/ReportService.swift` | テンプレートレンダリング・履歴保存 |
| `TaskHub/Core/Services/SearchService.swift` | 全文検索（FetchDescriptor + インメモリ） |
| `TaskHub/Core/Services/ImportExportService.swift` | JSON エクスポート / インポート |
| `TaskHub/Core/Infrastructure/KeychainStore.swift` | Keychain Services API ラッパー |
| `TaskHub/Core/Infrastructure/HTTPClient.swift` | URLSession ラッパー（リトライ・認証） |
| `TaskHub/Core/Infrastructure/RateLimiter.swift` | actor ベースのレート制限 |
| `TaskHub/Core/Infrastructure/OAuthService.swift` | Google OAuth 2.0 フロー管理 |

## Integrations レイヤー

| ファイルパス | 責務 |
|-----------|------|
| `TaskHub/Integrations/Provider/IntegrationProvider.swift` | プロトコル定義・ExternalTaskDTO |
| `TaskHub/Integrations/Catalog/IntegrationCatalog.swift` | ツール一覧の宣言データ |
| `TaskHub/Integrations/Notion/NotionProvider.swift` | Notion API v1 実装 |
| `TaskHub/Integrations/Notion/NotionConfig.swift` | Notion 接続設定 Codable |
| `TaskHub/Integrations/GoogleSheets/GoogleSheetsProvider.swift` | Google Sheets API v4 実装 |
| `TaskHub/Integrations/GoogleSheets/GSheetConfig.swift` | GSheet 列マッピング設定 |

## Report エンジン

| ファイルパス | 責務 |
|-----------|------|
| `TaskHub/Features/Report/TemplateParser.swift` | `{{変数}}` → TemplateSegment 分割 |
| `TaskHub/Features/Report/TemplateRenderer.swift` | Segment → 最終文字列変換 |
| `TaskHub/Features/Report/VariableRegistry.swift` | 全変数の登録・検索 |
| `TaskHub/Features/Report/Variables/DateVariable.swift` | `{{date}}` 実装 |
| `TaskHub/Features/Report/Variables/TodayWorkLogVariable.swift` | `{{today.workLog}}` 実装 |
| `TaskHub/Features/Report/Variables/TodayTotalHoursVariable.swift` | `{{today.totalHours}}` 実装 |
| `TaskHub/Features/Report/Variables/TodayPlanVariable.swift` | `{{today.plan}}` 実装 |
| `TaskHub/Features/Report/Variables/AssignedTasksVariable.swift` | `{{assigned.tasks}}` 実装 |
| `TaskHub/Features/Report/Variables/NextTasksVariable.swift` | `{{next.tasks}}` 実装 |
| （その他 Variables/） | 残り6変数 |

## Features レイヤー

| ファイルパス | 画面 / 責務 |
|-----------|-----------|
| `TaskHub/Features/Sidebar/SidebarView.swift` | プロジェクト/リスト/固定ビューのナビ |
| `TaskHub/Features/Inbox/InboxView.swift` | インボックス（S-02） |
| `TaskHub/Features/Inbox/InboxViewModel.swift` | インボックスの状態管理 |
| `TaskHub/Features/ProjectList/TaskListView.swift` | プロジェクト/リスト（S-03） |
| `TaskHub/Features/TaskDetail/TaskDetailView.swift` | タスク詳細（S-04） |
| `TaskHub/Features/Today/TodayView.swift` | 本日の進捗（S-05、⌘T） |
| `TaskHub/Features/Today/TodayViewModel.swift` | 今日のタスク収集・工数管理 |
| `TaskHub/Features/Search/SearchView.swift` | 全文検索（S-06） |
| `TaskHub/Features/Settings/Integrations/CatalogView.swift` | ツール一覧（S-09） |
| `TaskHub/Features/Settings/Integrations/ConnectionListView.swift` | 接続管理（S-10） |
| `TaskHub/Features/Settings/Integrations/ConnectionEditView.swift` | 接続編集（S-11） |
| `TaskHub/Features/Report/Generate/ReportGenerateView.swift` | レポート生成（S-12） |
| `TaskHub/Features/Report/Templates/TemplateEditorView.swift` | テンプレ管理（S-13） |
| `TaskHub/Features/Report/History/ReportHistoryView.swift` | レポート履歴（S-14） |
