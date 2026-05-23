# 設計書：タスク管理デスクトップアプリ

**バージョン**: 1.0.0
**作成日**: 2026-05-23
**対象要件**: REQUIREMENTS.md v1.2.0
**ステータス**: ドラフト

---

## Phase 1: 要件サマリー

### 1.1 機能要件サマリー

本アプリは macOS ネイティブのローカルファースト型タスク管理ツールで、以下の機能領域を持つ。

**コアタスク管理（FR-01〜FR-09）**
- プロジェクト → リスト → タスク → サブタスクの階層 CRUD
- タグ管理（横断分類）、ステータス5値、進捗度（0-100%）、優先度4段階、期限、メモ、作業時間
- 完了フラグとステータスの双方向連動、進捗100%時の確認ダイアログ
- ⌘N / Space / ⌘F / ⌘⌫ / ⌘, / ⌘T / ↑↓ のキーボードショートカット
- ダーク/ライトテーマ自動連動、SwiftData によるローカル永続化
- 本日の進捗画面（⌘T）：今日のタスク収集、作業時間入力、合計表示、レポート起動

**検索・整理（FR-10〜FR-12）**
- 5,000件 p95 < 200ms の全文検索（タイトル/メモ/タグ/サブタスク）
- 多軸フィルタと並び替え、設定の永続化
- JSON エクスポート/インポート（認証情報除外）

**外部タスクインポート（FR-13〜FR-18）**
- インテグレーションカタログ UI（実装済み + Coming Soon の宣言的表示）
- ツール種別 × N 接続モデル
- MVP: Notion（Integration Token）/ Google スプレッドシート（OAuth 2.0 Desktop App）
- 一括並列同期、自分にアサインされたタスクのみ取得
- インボックスへの取込、移動後の追跡保持、重複防止（connectionId + externalId 複合キー）
- 競合解決ルール：外部の title/note/dueDate は上書き、ローカルの status/progress は保持
- Keychain によるシークレット保管、Exponential Backoff、接続テスト

**日報・作業報告（FR-19〜FR-22）**
- レポートテンプレート CRUD、デフォルト2種プリセット
- 差し込み変数システム（12種類）、クリック挿入エディター、プレビュー
- レポート生成 → クリップボード/Markdown ファイル出力
- レポート履歴のローカル保存と再編集

### 1.2 非機能要件サマリー

| 領域 | 主要指標 |
|------|---------|
| 性能 | 起動 p95 < 2s、検索 p95 < 200ms、5,000タスクで60fps、メモリ < 300MB |
| セキュリティ | Keychain 専用ストア、HTTPS 限定、ログにシークレット非含 |
| 可用性 | 完全オフライン動作、API 障害時もアプリ継続 |
| 互換性 | macOS 14 Sonoma+、Universal Binary、未署名 .dmg |
| スケール | プロジェクト 50 / リスト 500 / タスク 10,000 |
| アクセシビリティ | VoiceOver、キーボードのみ操作完結 |
| 国際化 | 日本語 / 英語、システム追従 |

### 1.3 外部依存と統合点

| 依存先 | 用途 | 認証方式 | レート制限 |
|--------|------|---------|----------|
| Notion API v1 | ページ取得（自分にアサイン） | Integration Token | 3 req/sec |
| Google Sheets API v4 | シート行取得（担当者列マッチ） | OAuth 2.0 Desktop App | 60 req/min/user |
| Google OAuth 2.0 endpoint | トークン取得・更新 | カスタム URL スキーム | - |
| macOS Keychain Services | シークレット永続化 | システム API | - |
| macOS Pasteboard | レポートコピー | システム API | - |
| ファイルシステム | Markdown / JSON 入出力 | NSOpenPanel/NSSavePanel | - |

### 1.4 制約と前提

**制約（要件由来）**
- 未署名 .dmg 配布 → Gatekeeper 警告、Keychain プロンプトのリスク（R1）
- Apple Developer Program なし → Code Signing / Notarization なし
- macOS 14 Sonoma 最低対応 → SwiftData 利用可能ライン
- MVP は単方向同期のみ（読み取りのみ）

**前提**
- ユーザーは個人利用、シングルデバイス
- ネットワーク不在でも全コア機能が動作
- Notion ユーザー ID および Google アカウント担当者列値はユーザーが手動入力
- 自動同期・通知・カレンダー連携は対象外（4.3）

---

## Phase 2: 現状分析（グリーンフィールド）

### 2.1 技術スタック検証

| 検証項目 | 結論 | 根拠 |
|---------|-----|-----|
| SwiftUI on macOS 14+ | 採用可 | NavigationSplitView、Table、Menu Bar 等の必要 API が揃う |
| SwiftData on macOS 14+ | 採用可 | SwiftData は iOS 17 / macOS 14 から。要件の最低 OS を macOS 14 Sonoma に改訂する |
| Universal Binary | 採用可 | Xcode 15 で arm64 + x86_64 ターゲット |
| Keychain Services | 採用可 | Security.framework 標準 |
| AuthenticationServices (ASWebAuthenticationSession) | 採用可 | OAuth リダイレクト処理に macOS 11+ から利用可 |

> **要件との調整**: SwiftData は macOS 14+ 必須のため、REQUIREMENTS.md の最低 OS を「macOS 13 Ventura」から「macOS 14 Sonoma」に改訂する（ADR-001 参照）。

### 2.2 既知の制約と対策の事前整理

| 制約 | 対策方針 |
|------|---------|
| 未署名 → Gatekeeper | 初回起動手順をドキュメント化、`xattr -d com.apple.quarantine` の案内 |
| 未署名 → Keychain プロンプト | `kSecAttrAccessibleAfterFirstUnlock` + アプリ識別子で同一プロセスからのアクセスを最小化（R1） |
| OAuth リダイレクト | カスタム URL スキーム `taskhub://oauth/callback` を Info.plist に登録、`ASWebAuthenticationSession` 利用（R3） |
| Notion レート制限 | `RateLimiter` actor で 3 req/sec、429 時に Exponential Backoff（R2） |
| SwiftData クエリ制限 | 複雑クエリは `FetchDescriptor` + インメモリフィルタ、最悪時 `NSPredicate` フォールバック（R4） |
| 外部 ID 衝突 | `(connectionId, externalId)` 複合一意制約 + 重複チェック（R5） |
| Google Sheet 列多様性 | 接続設定に「列マッピング」UI（担当者列・タイトル列・期限列等を指定）（R6） |

---

## Phase 3: 設計

### 3.1 アプリケーションアーキテクチャ

#### 3.1.1 アーキテクチャパターン

**採用**: **MVVM + Repository + Service Layer**（軽量 Clean Architecture）

```
┌─────────────────────────────────────────────────────────┐
│                       View (SwiftUI)                     │
│   NavigationSplitView / List / Form / Custom Views       │
└──────────────┬──────────────────────────────────────────┘
               │ @Observable / @Bindable
┌──────────────▼──────────────────────────────────────────┐
│                    ViewModel                             │
│   InboxViewModel / TodayViewModel / ReportViewModel ...  │
└──────────────┬──────────────────────────────────────────┘
               │ async/await
┌──────────────▼──────────────────────────────────────────┐
│                  Service / UseCase                       │
│   SyncService / ReportService / SearchService / ...      │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────┐  ┌──────────────────────┐
│      Repository              │  │   IntegrationProvider │
│   TaskRepository             │  │   NotionProvider      │
│   ProjectRepository          │  │   GoogleSheetsProvider│
│   ConnectionRepository       │  │   (Protocol-based)    │
└──────────────┬──────────────┘  └──────────┬────────────┘
               │                             │
┌──────────────▼──────────────┐  ┌──────────▼────────────┐
│      SwiftData               │  │   KeychainStore       │
│      ModelContext            │  │   HTTPClient          │
└─────────────────────────────┘  └───────────────────────┘
```

#### 3.1.2 レイヤー責務

| レイヤー | 責務 | 例 |
|---------|------|-----|
| View | 表示と入力イベント発火のみ。状態は ViewModel に委譲 | `InboxView`, `TaskRowView`, `ReportPreviewView` |
| ViewModel | 画面状態保持、ユーザー操作のサービス呼び出し、表示用 DTO 整形 | `TodayViewModel`, `IntegrationSettingsViewModel` |
| Service | 複数 Repository / Provider を協調させるユースケース | `SyncService`, `ReportService`, `ImportExportService` |
| Repository | SwiftData ModelContext のラッパー、永続化操作の集約 | `TaskRepository`, `ConnectionRepository` |
| IntegrationProvider | 外部ツール固有のプロトコル実装、ローカル DTO 変換 | `NotionProvider`, `GoogleSheetsProvider` |
| Infrastructure | Keychain、HTTP、ファイル IO、ペーストボード等 | `KeychainStore`, `HTTPClient`, `OAuthService` |

#### 3.1.3 モジュール / フィーチャー境界

```
TaskHub/
├── App/                       # @main, AppDelegate, DI コンポジションルート
├── Core/
│   ├── Models/                # SwiftData @Model
│   ├── Repositories/
│   ├── Services/
│   └── Infrastructure/        # Keychain / HTTP / Pasteboard / FileIO
├── Features/
│   ├── Sidebar/               # プロジェクト/リスト/インボックス ナビ
│   ├── Inbox/
│   ├── ProjectList/           # プロジェクト・リスト・タスク表示
│   ├── TaskDetail/            # サブタスク・タグ・メモ等の編集
│   ├── Today/                 # 本日の進捗（⌘T）
│   ├── Search/
│   ├── Settings/
│   │   ├── Integrations/      # カタログ + 接続管理
│   │   ├── Tags/
│   │   └── General/
│   ├── Report/
│   │   ├── Templates/         # テンプレ CRUD
│   │   ├── Generate/          # 生成画面
│   │   └── History/           # 履歴
│   └── ImportExport/
├── Integrations/
│   ├── Provider/              # IntegrationProvider プロトコル
│   ├── Notion/                # NotionProvider
│   ├── GoogleSheets/          # GoogleSheetsProvider
│   └── Catalog/               # IntegrationCatalog 宣言データ
├── DesignSystem/              # カラー・タイポ・共通 View
└── Resources/                 # Localizable.strings, Assets
```

ファイルあたり 200-400 行を目安、800 行を上限とする。

---

### 3.2 データモデル（SwiftData @Model）

すべてのエンティティで `id: UUID` を主キーとし、`createdAt` / `updatedAt` を共通に持つ。SwiftData の `@Model` マクロでクラス宣言する。

#### 3.2.1 Project

```swift
@Model
final class Project {
    @Attribute(.unique) var id: UUID
    var name: String
    var colorHex: String          // "#RRGGBB"
    var iconName: String          // SF Symbol 名
    var sortOrder: Int
    var createdAt: Date
    var updatedAt: Date

    @Relationship(deleteRule: .cascade, inverse: \TaskList.project)
    var lists: [TaskList] = []
}
```

- インデックス: `sortOrder`
- カスケード削除: 配下の TaskList → Task → Subtask

#### 3.2.2 TaskList

```swift
@Model
final class TaskList {
    @Attribute(.unique) var id: UUID
    var name: String
    var sortOrder: Int
    var isInbox: Bool             // 固定の Inbox は true / 削除不可
    var createdAt: Date
    var updatedAt: Date

    var project: Project?         // nil の場合はインボックス（プロジェクト非所属）

    @Relationship(deleteRule: .cascade, inverse: \Task.list)
    var tasks: [Task] = []
}
```

- インボックスは `isInbox = true` かつ `project == nil` の唯一の TaskList として初期化時に生成（削除・リネーム不可をアプリ層で強制）
- インデックス: `(project, sortOrder)`, `isInbox`

#### 3.2.3 Task

```swift
enum TaskStatus: String, Codable, CaseIterable {
    case notStarted, inProgress, inReview, completed, onHold
}

enum TaskPriority: String, Codable, CaseIterable {
    case low, medium, high, urgent
}

enum TaskSource: String, Codable {
    case manual
    case external                 // connectionId が非 nil
}

@Model
final class Task {
    @Attribute(.unique) var id: UUID
    var title: String
    var note: String              // Markdown 可
    var dueDate: Date?
    var priority: TaskPriority
    var status: TaskStatus
    var progress: Int             // 0-100
    var isCompleted: Bool
    var workHoursByDate: [DateKey: Double] = [:]   // 日付ごとの作業時間（h, 0.5刻み）
    var sortOrder: Int
    var isArchived: Bool          // 外部削除時の「残す」選択でグレーアウト
    var createdAt: Date
    var updatedAt: Date

    // Source 情報
    var source: TaskSource
    var connectionId: UUID?       // 外部由来時
    var externalId: String?       // 外部 ID
    var externalUrl: String?      // 外部ツールへのリンク
    var lastSyncedAt: Date?

    var list: TaskList?

    @Relationship(deleteRule: .cascade, inverse: \Subtask.task)
    var subtasks: [Subtask] = []

    @Relationship(inverse: \Tag.tasks)
    var tags: [Tag] = []
}

struct DateKey: Codable, Hashable {
    let year: Int
    let month: Int
    let day: Int
}
```

- 一意制約（複合キー）: `(connectionId, externalId)` を **アプリ層で強制**（SwiftData は複合ユニーク非対応のため、登録時にチェック）
- インデックス: `status`, `dueDate`, `isCompleted`, `(list, sortOrder)`, `externalId`
- `workHoursByDate` は値型辞書として保存（SwiftData の Codable 属性として）

#### 3.2.4 Subtask

```swift
@Model
final class Subtask {
    @Attribute(.unique) var id: UUID
    var title: String
    var isCompleted: Bool
    var sortOrder: Int
    var source: TaskSource        // 外部由来か手動追加か（同期保持判定用）
    var externalId: String?
    var createdAt: Date
    var updatedAt: Date

    var task: Task?
}
```

- インデックス: `(task, sortOrder)`

#### 3.2.5 Tag

```swift
@Model
final class Tag {
    @Attribute(.unique) var id: UUID
    @Attribute(.unique) var name: String
    var colorHex: String
    var createdAt: Date

    var tasks: [Task] = []        // 多対多（Task 側に inverse 定義）
}
```

#### 3.2.6 Connection

```swift
enum IntegrationKind: String, Codable {
    case notion
    case googleSheets
    // 将来: case jira, linear, asana, trello, githubIssues
}

@Model
final class Connection {
    @Attribute(.unique) var id: UUID
    var name: String                       // ユーザー設定名
    var kind: IntegrationKind
    var isEnabled: Bool
    var meIdentifier: String               // 自分の識別子
    var configJSON: Data                   // ツール固有設定（JSON エンコード）
    var keychainRef: String                // Keychain アイテムの service+account 識別子
    var lastSyncedAt: Date?
    var lastSyncStatus: String?            // "success" | "failed: <reason>"
    var createdAt: Date
    var updatedAt: Date
}
```

- 認証情報は **Keychain にのみ** 保存。`keychainRef` は `"com.taskhub.connection.<uuid>"` の形式
- `configJSON` には Notion なら `{ "databaseId": "..." }`、GSheet なら `{ "spreadsheetId": "...", "sheetName": "...", "assigneeColumn": "C", "titleColumn": "B", "dueDateColumn": "D" }` を保存

#### 3.2.7 SyncRecord

```swift
@Model
final class SyncRecord {
    @Attribute(.unique) var id: UUID
    var connectionId: UUID
    var externalId: String                 // 外部一意 ID
    var localTaskId: UUID                  // 紐づくローカル Task
    var lastSyncedAt: Date
    var externalFingerprint: String        // 外部側ハッシュ（差分検出用）
    var createdAt: Date
}
```

- 複合一意制約: `(connectionId, externalId)` をアプリ層で強制
- インデックス: `connectionId`, `externalId`
- 再同期時にこのテーブルで重複を判定し、`localTaskId` を介して既存タスクを更新

#### 3.2.8 ReportTemplate

```swift
enum ReportPeriodKind: String, Codable {
    case today, thisWeek, thisMonth, custom
}

@Model
final class ReportTemplate {
    @Attribute(.unique) var id: UUID
    var name: String
    var periodKind: ReportPeriodKind
    var body: String                       // {{変数}} を含む本文
    var isBuiltIn: Bool                    // デフォルトプリセット
    var sortOrder: Int
    var createdAt: Date
    var updatedAt: Date
}
```

#### 3.2.9 ReportHistory

```swift
@Model
final class ReportHistory {
    @Attribute(.unique) var id: UUID
    var templateName: String               // テンプレ削除に備えてスナップショット
    var templateId: UUID?                  // 元テンプレ参照（削除されていれば nil）
    var periodStart: Date?
    var periodEnd: Date?
    var generatedAt: Date
    var renderedBody: String               // 生成後の本文（編集後の最終形）
}
```

- インデックス: `generatedAt` 降順用

#### 3.2.10 リレーション図

```
Project 1───* TaskList 1───* Task 1───* Subtask
                              *───* Tag
                              *───1 Connection（オプション）
Connection 1───* SyncRecord *───1 Task
ReportTemplate    （独立）
ReportHistory     （独立、templateId は弱参照）
```

---

### 3.3 ナビゲーション・画面構成

#### 3.3.1 メインウィンドウ（NavigationSplitView）

3 ペイン構成：

```
┌───────────────┬──────────────────┬──────────────────────┐
│   Sidebar     │   Content List   │   Detail / Inspector │
│               │                  │                      │
│  📥 インボックス │ タスク一覧（Table）│   タスク詳細         │
│  📅 今日 (⌘T) │ ・ステータス       │   ・サブタスク       │
│  🔍 検索       │ ・進捗 / 期限     │   ・タグ            │
│  ─────        │ ・優先度          │   ・メモ            │
│  📁 Project A │ ・タグ            │   ・作業時間         │
│   └ List 1   │                  │                      │
│   └ List 2   │ [新規 (⌘N)]      │                      │
│  📁 Project B │ [同期 ↻]         │                      │
│  ─────        │                  │                      │
│  ⚙️ 設定 (⌘,) │                  │                      │
└───────────────┴──────────────────┴──────────────────────┘
```

| ペイン | 役割 | 主要 View |
|--------|-----|----------|
| Sidebar | プロジェクト/リスト/固定ビューのナビ | `SidebarView` |
| Content List | 選択中ノードのタスク一覧 | `TaskListView`（Table 使用） |
| Detail | 選択中タスクの詳細編集 | `TaskDetailView` |

#### 3.3.2 画面一覧と遷移

| 画面 ID | 名称 | 入口 | 主要要素 |
|---------|-----|-----|---------|
| S-01 | メインウィンドウ | アプリ起動 | Split View |
| S-02 | インボックス | サイドバー「インボックス」 | タスク Table、ソース badge |
| S-03 | プロジェクト/リスト | サイドバーで選択 | タスク Table |
| S-04 | タスク詳細 | タスク選択 | Form |
| S-05 | 本日の進捗 | ⌘T / サイドバー「今日」 | 工数入力可能 Table + 合計表示 |
| S-06 | 検索 | ⌘F | 全文検索結果 |
| S-07 | 設定 - General | ⌘, → 一般タブ | テーマ等 |
| S-08 | 設定 - Tags | ⌘, → タグタブ | タグ CRUD |
| S-09 | 設定 - Integrations カタログ | ⌘, → インテグレーションタブ | ツール一覧 |
| S-10 | 設定 - 接続管理 | カタログでツール選択 | 接続 CRUD |
| S-11 | 設定 - 接続編集 | + 接続 / 編集 | 認証・configフォーム |
| S-12 | レポート生成 | メニュー / 本日の進捗から | テンプレ選択 + プレビュー |
| S-13 | レポートテンプレ管理 | 設定 → レポートタブ | テンプレ CRUD |
| S-14 | レポート履歴 | メニュー → 履歴 | 履歴一覧 + 詳細 |
| S-15 | JSON エクスポート/インポート | ファイルメニュー | ファイル選択ダイアログ |
| S-16 | 外部削除確認ダイアログ | 同期中に検出 | 削除/残す選択 + 一覧 |

#### 3.3.3 画面遷移マップ

```
                    ┌─── S-12 レポート生成 ──── S-14 履歴
                    │       ▲
S-01 メイン         │       │
 ├── S-02 インボックス      │
 ├── S-03 プロジェクト/リスト│
 ├── S-04 タスク詳細         │
 ├── S-05 本日の進捗 ───────┘ （[作業開始報告/業務日報] ボタン）
 ├── S-06 検索
 └── S-07/08/09 設定
       └── S-09 カタログ ── S-10 接続管理 ── S-11 接続編集
       └── S-13 テンプレ管理
```

#### 3.3.4 メニューバー構成

| メニュー | 項目 | ショートカット |
|---------|------|--------------|
| File | New Task | ⌘N |
| File | Export JSON / Import JSON | - |
| File | Save Report as Markdown | - |
| Edit | Delete Task | ⌘⌫ |
| Edit | Find | ⌘F |
| View | Focus Today | ⌘T |
| Report | Generate Report | ⌘R |
| Report | Report History | - |
| TaskHub | Preferences | ⌘, |

---

### 3.4 インテグレーション層設計

#### 3.4.1 IntegrationProvider プロトコル

```swift
protocol IntegrationProvider: Sendable {
    static var kind: IntegrationKind { get }
    static var displayMetadata: IntegrationDisplayMeta { get }   // 名前・アイコン・説明

    /// 接続テスト
    func testConnection(_ connection: Connection) async throws

    /// 自分にアサインされたタスクのみ取得
    func fetchAssignedTasks(
        connection: Connection,
        progress: @Sendable (Double) -> Void
    ) async throws -> [ExternalTaskDTO]

    /// 認証 UI（OAuth フローなど）の起動
    func authenticate(existing: Connection?) async throws -> AuthResult
}

struct ExternalTaskDTO: Sendable {
    let externalId: String
    let title: String
    let note: String?
    let dueDate: Date?
    let status: TaskStatus?         // 外部ステータスからのマッピング
    let priority: TaskPriority?
    let externalUrl: String?
    let subtasks: [ExternalSubtaskDTO]
    let externalFingerprint: String  // ハッシュ
}

struct ExternalSubtaskDTO: Sendable {
    let externalId: String
    let title: String
    let isCompleted: Bool
}

struct AuthResult: Sendable {
    let keychainRef: String         // 保存後の参照
    let meIdentifier: String?       // 取得できた場合
}

struct IntegrationDisplayMeta: Sendable {
    let id: IntegrationKind
    let name: String
    let iconAssetName: String
    let isComingSoon: Bool
    let description: String
    let docsURL: URL?
}
```

#### 3.4.2 カタログ（宣言データ）

```swift
enum IntegrationCatalog {
    static let entries: [IntegrationDisplayMeta] = [
        NotionProvider.displayMetadata,
        GoogleSheetsProvider.displayMetadata,
        // Coming Soon（プロバイダー未実装）
        .comingSoon(.jira, name: "JIRA", icon: "jira"),
        .comingSoon(.linear, name: "Linear", icon: "linear"),
        .comingSoon(.asana, name: "Asana", icon: "asana"),
        .comingSoon(.trello, name: "Trello", icon: "trello"),
        .comingSoon(.githubIssues, name: "GitHub Issues", icon: "github"),
    ]

    static func provider(for kind: IntegrationKind) -> (any IntegrationProvider)? {
        switch kind {
        case .notion: return NotionProvider()
        case .googleSheets: return GoogleSheetsProvider()
        default: return nil       // Coming Soon
        }
    }
}
```

新ツール追加は「Provider 実装 + Catalog エントリ追加」のみで UI に反映される。

#### 3.4.3 NotionProvider 実装アウトライン

```swift
struct NotionProvider: IntegrationProvider {
    static let kind: IntegrationKind = .notion
    static let displayMetadata = IntegrationDisplayMeta(
        id: .notion, name: "Notion", iconAssetName: "notion",
        isComingSoon: false, description: "Integration Token で接続",
        docsURL: URL(string: "https://developers.notion.com/")
    )

    let httpClient: HTTPClient
    let rateLimiter: RateLimiter  // 3 req/sec actor

    func authenticate(existing: Connection?) async throws -> AuthResult {
        // UI でユーザーが Integration Token を入力 → Keychain 保存
        // /users/me を叩いて Notion ユーザー ID を取得して meIdentifier に
    }

    func testConnection(_ c: Connection) async throws {
        let token = try KeychainStore.shared.read(ref: c.keychainRef)
        try await httpClient.get("/v1/users/me", auth: .bearer(token))
    }

    func fetchAssignedTasks(
        connection c: Connection,
        progress: @Sendable (Double) -> Void
    ) async throws -> [ExternalTaskDTO] {
        let config = try JSONDecoder().decode(NotionConfig.self, from: c.configJSON)
        let token = try KeychainStore.shared.read(ref: c.keychainRef)

        // databases/{id}/query をページング、filter: People プロパティに c.meIdentifier を含む
        var cursor: String? = nil
        var allPages: [NotionPage] = []
        repeat {
            try await rateLimiter.wait()
            let result = try await httpClient.post(
                "/v1/databases/\(config.databaseId)/query",
                body: NotionQueryBody(
                    startCursor: cursor,
                    filter: .peopleContains(
                        propertyName: config.assigneeProperty,
                        userId: c.meIdentifier
                    )
                ),
                auth: .bearer(token),
                retryPolicy: .exponentialBackoff(maxRetries: 5)
            )
            allPages.append(contentsOf: result.results)
            cursor = result.nextCursor
            progress(Double(allPages.count) / Double(result.totalEstimate ?? allPages.count + 1))
        } while cursor != nil

        return allPages.map { Self.toDTO($0) }
    }
}
```

**マッピング規則**:
- Notion `Status` プロパティ → `TaskStatus`（マッピング表は接続設定で調整可能）
- Notion `Due Date` → `dueDate`
- 子ページ / Toggle list block を `Subtask` として取込（オプション）

#### 3.4.4 GoogleSheetsProvider 実装アウトライン

```swift
struct GoogleSheetsProvider: IntegrationProvider {
    static let kind: IntegrationKind = .googleSheets
    static let displayMetadata = IntegrationDisplayMeta(
        id: .googleSheets, name: "Google スプレッドシート",
        iconAssetName: "gsheet", isComingSoon: false,
        description: "OAuth 2.0 で接続",
        docsURL: URL(string: "https://developers.google.com/sheets/api")
    )

    let oauth: GoogleOAuthService

    func authenticate(existing: Connection?) async throws -> AuthResult {
        // 1. AuthorizationCodeRequest を構築（scope: spreadsheets.readonly）
        // 2. ASWebAuthenticationSession でブラウザ起動、callbackURLScheme: "taskhub"
        // 3. code を受け取り、token endpoint で access_token + refresh_token を取得
        // 4. Keychain に { accessToken, refreshToken, expiresAt, clientId } を JSON 保存
        let tokens = try await oauth.runAuthorizationCodeFlow()
        let ref = try KeychainStore.shared.write(tokens: tokens, scope: .connection(UUID()))
        return AuthResult(keychainRef: ref, meIdentifier: nil)
        // meIdentifier（担当者列の値）は別途ユーザーが手動入力
    }

    func fetchAssignedTasks(
        connection c: Connection,
        progress: @Sendable (Double) -> Void
    ) async throws -> [ExternalTaskDTO] {
        let config = try JSONDecoder().decode(GSheetConfig.self, from: c.configJSON)
        let token = try await oauth.validAccessToken(ref: c.keychainRef)  // 必要なら refresh

        // values.get で全行取得
        let range = "\(config.sheetName)!A1:Z"
        let resp = try await httpClient.get(
            "https://sheets.googleapis.com/v4/spreadsheets/\(config.spreadsheetId)/values/\(range)",
            auth: .bearer(token)
        )

        // ヘッダー行 + 列マッピング設定で抽出
        // 担当者列の値が c.meIdentifier と一致する行のみ採用
        return resp.rows
            .filter { $0[config.assigneeColumn] == c.meIdentifier }
            .map { Self.rowToDTO($0, config: config) }
    }
}
```

**列マッピング設定**: 接続編集画面で「担当者列 / タイトル列 / メモ列 / 期限列 / ステータス列 / 優先度列」を A-Z で指定（R6 対応）。

#### 3.4.5 OAuth 2.0 フロー（Google）

```
[アプリ] --1.認可URL構築--> ブラウザ起動 (ASWebAuthenticationSession)
                              ↓
[ユーザー] -- 2.Google にログイン & 許可
                              ↓
[Google] -- 3.taskhub://oauth/callback?code=XXX にリダイレクト
                              ↓
[アプリ] -- 4.受信した code を token endpoint と交換
        -- 5.access_token + refresh_token を Keychain 保存
        -- 6.以降の API 呼び出しは access_token、期限切れは refresh_token で更新
```

- カスタム URL スキーム `taskhub` を Info.plist `CFBundleURLTypes` に登録
- Google Cloud Console で OAuth クライアント（Desktop App）を作成し、`client_id` のみコード埋め込み（`client_secret` も Desktop App では公開前提のため Keychain 不要）
- PKCE 利用（`code_challenge` / `code_verifier`）でセキュリティ強化

#### 3.4.6 Notion Integration Token フロー

```
[ユーザー] -- 1.Notion で Internal Integration 作成、Token をコピー
[ユーザー] -- 2.対象データベースに Integration を Connect
[アプリ] -- 3.接続編集画面で Token を SecureField で入力
[アプリ] -- 4.「接続テスト」ボタンで /users/me を叩き疎通確認
[アプリ] -- 5.Keychain に Token を保存、meIdentifier として返ってきた user ID を保存
```

#### 3.4.7 並列同期パターン（TaskGroup）

```swift
actor SyncService {
    func syncAll() async -> SyncSummary {
        let enabledConnections = try repository.fetchEnabledConnections()
        var results: [SyncResult] = []

        await withTaskGroup(of: SyncResult.self) { group in
            for connection in enabledConnections {
                group.addTask {
                    do {
                        guard let provider = IntegrationCatalog.provider(for: connection.kind)
                        else { return .skipped(connection.id) }

                        let externals = try await provider.fetchAssignedTasks(
                            connection: connection,
                            progress: { self.publishProgress(connection.id, $0) }
                        )
                        try await self.reconcile(connection: connection, externals: externals)
                        return .success(connection.id, count: externals.count)
                    } catch is CancellationError {
                        return .cancelled(connection.id)
                    } catch {
                        return .failure(connection.id, error: error)
                    }
                }
            }
            for await result in group { results.append(result) }
        }

        return SyncSummary(results: results)
    }
}
```

- 各接続のタスクは **独立した Task** として並列実行
- `CancellationError` を補足し中断（ツールバー「中断」ボタンと連動）
- 1接続失敗時も他は続行（部分失敗を許容）

#### 3.4.8 エラー / 部分失敗ハンドリング

| エラー種別 | UI 表示 | データ扱い |
|----------|--------|-----------|
| 認証失敗（401） | トースト「接続 X：認証エラー、設定を確認してください」 | その接続のみスキップ |
| レート制限（429） | 自動 Exponential Backoff（5回まで） | リトライ後失敗で部分失敗扱い |
| ネットワーク | トースト「ネットワーク到達不可」 | 部分失敗扱い、成功分はコミット |
| 設定不正（DB ID 不在） | サマリーパネルに詳細表示 | スキップ |
| キャンセル | ステータス「中断」 | 中断時点まで取得分をコミット |
| 外部削除検出 | 確認ダイアログ S-16 で一括選択 | ユーザー選択に従う |

同期中に書き込み中の `ModelContext` は 1接続単位でトランザクション化し、失敗時はその接続分のみロールバック。

---

### 3.5 レポートエンジン設計

#### 3.5.1 テンプレート保存形式

**採用**: **プレーンテキスト + `{{変数名}}` プレースホルダー**（ADR-004 参照）

```text
【{{date}}業務報告】
■今日やったこと: 計{{today.totalHours}}h
{{today.workLog}}

■明日やること
{{next.tasks}}
```

- `ReportTemplate.body: String` にそのまま保存
- 変数のシンタックスは `{{ identifier }}`（空白は許容、識別子は `[a-zA-Z][a-zA-Z0-9.]*`）

#### 3.5.2 変数解決システム

```swift
protocol ReportVariable {
    var identifier: String { get }           // 例 "today.workLog"
    var displayName: String { get }
    var description: String { get }
    func render(context: ReportContext) -> String
}

struct ReportContext {
    let now: Date
    let periodStart: Date
    let periodEnd: Date
    let taskRepository: TaskRepository
    let projectRepository: ProjectRepository
    let calendar: Calendar
    let locale: Locale
}

enum VariableRegistry {
    static let all: [ReportVariable] = [
        DateVariable(),
        PeriodStartVariable(), PeriodEndVariable(),
        TodayTotalHoursVariable(),
        TodayWorkLogVariable(),
        TodayPlanVariable(),
        TodayCompletedVariable(),
        TodayInProgressVariable(),
        AssignedTasksVariable(),
        NextTasksVariable(),
        ProjectsSummaryVariable(),
        PeriodCompletedVariable(),
    ]

    static func byIdentifier(_ id: String) -> ReportVariable? {
        all.first { $0.identifier == id }
    }
}
```

各 Variable は単一責任クラスとして実装（1ファイル / 1Variable）：

```swift
struct TodayWorkLogVariable: ReportVariable {
    let identifier = "today.workLog"
    let displayName = "今日の作業ログ（工数付き）"

    func render(context: ReportContext) -> String {
        let dateKey = DateKey(from: context.now)
        let tasksWithHours = context.taskRepository
            .tasksWithWorkHours(on: dateKey)
        guard !tasksWithHours.isEmpty else { return "（なし）" }

        let groupedByProject = Dictionary(grouping: tasksWithHours, by: \.list?.project?.name)
        return groupedByProject
            .sorted { ($0.key ?? "") < ($1.key ?? "") }
            .map { renderProjectGroup($0.key, tasks: $0.value) }
            .joined(separator: "\n")          // workLog はプロジェクト間空行なし
    }

    private func renderProjectGroup(_ name: String?, tasks: [Task]) -> String {
        // プロジェクト名 + (workHours)h
        // ● タスク名
        //   ○ サブタスク
        // フォーマットを構築
        var lines: [String] = []
        let totalHours = tasks.reduce(0.0) { $0 + ($1.workHoursByDate[DateKey(from: Date())] ?? 0) }
        if let n = name {
            lines.append("\(n) \(String(format: "%.1f", totalHours))h")
        }
        for task in tasks {
            lines.append("● \(task.title)")
            for subtask in task.subtasks.filter(\.isCompleted == false) {
                lines.append("  ○ \(subtask.title)")
            }
        }
        return lines.joined(separator: "\n")
    }
}
```

#### 3.5.3 出力レンダリングパイプライン

```
ReportTemplate.body
   ↓
TemplateParser.parse(body) → [Segment]
   ・Segment.text("【")
   ・Segment.variable("date")
   ・Segment.text("業務報告】\n■今日やったこと: 計")
   ・Segment.variable("today.totalHours")
   ・…
   ↓
TemplateRenderer.render(segments, context)
   各 variable Segment を VariableRegistry で解決して文字列化
   未知の変数は "{{unknown}}" として保持（エラーにしない）
   ↓
最終文字列
   ↓
[クリップボードコピー / .md ファイル保存]
   ↓
ReportHistory.create(renderedBody, templateName, periodStart, periodEnd)
```

```swift
enum TemplateSegment {
    case text(String)
    case variable(identifier: String)
}

enum TemplateParser {
    static func parse(_ body: String) -> [TemplateSegment] {
        // 正規表現 \{\{\s*([a-zA-Z][a-zA-Z0-9.]*)\s*\}\}
        // でマッチ部とそれ以外を分割
    }
}

struct TemplateRenderer {
    let registry: [ReportVariable]
    func render(_ segments: [TemplateSegment], context: ReportContext) -> String {
        segments.map { seg in
            switch seg {
            case .text(let s): return s
            case .variable(let id):
                return VariableRegistry.byIdentifier(id)?.render(context: context)
                    ?? "{{\(id)}}"
            }
        }.joined()
    }
}
```

#### 3.5.4 テンプレートエディター UX

- テキストエリア横に「変数パレット」を配置
- 変数アイコンクリック → カーソル位置に `{{identifier}}` を挿入
- 「プレビュー」ボタンで `TemplateRenderer` を実データで実行し、別ペインに表示
- バリデーション：未定義変数は黄色ハイライト（保存可能だが警告）

---

### 3.6 主要データフロー

#### 3.6.1 フロー1：外部同期 → インボックス着地

```
[ユーザー] ─ツールバー「同期」クリック
   ↓
[SyncViewModel.startSync()]
   ↓ 進行中フラグ ON、ボタンを「中断」に変更
[SyncService.syncAll()]
   ↓
[ConnectionRepository.fetchEnabledConnections()] → [C1, C2, C3]
   ↓
withTaskGroup:
   ├─ Task A: NotionProvider.fetchAssignedTasks(C1) → [DTO...]
   ├─ Task B: GoogleSheetsProvider.fetchAssignedTasks(C2) → [DTO...]
   └─ Task C: NotionProvider.fetchAssignedTasks(C3) → [DTO...]
       ※ 各 Task は独立、進捗を publishProgress で UI 反映
   ↓
[Reconciler.reconcile(connection, dtos)]   ※ 接続単位で実行
   for each DTO:
       既存 SyncRecord 検索（connectionId + externalId）
       ├ なし → 新規 Task を Inbox に追加、SyncRecord 作成
       └ あり → 既存 Task を更新
            ・title / note / dueDate / externalUrl → 上書き
            ・status / progress / list 所属 / tags → ローカル値保持
            ・subtasks → external 起源のみ上書き、ローカル追加分は保持
   外部側で消えた SyncRecord → 削除確認ダイアログにキュー
   ↓
[全 Task 完了] SyncSummary 生成
   ↓
[UI] フッターに「成功 N / 失敗 M」、トーストでエラー詳細、削除ダイアログ表示
   ↓
[ユーザー] 削除ダイアログで「削除/残す」を選択
   ↓
[TaskRepository] 削除 or isArchived = true 更新
```

#### 3.6.2 フロー2：本日の進捗 → レポート生成

```
[ユーザー] ⌘T 押下
   ↓
[TodayViewModel.load()]
   ・期限日 == today OR status == .inProgress のタスクを TaskRepository から取得
   ・プロジェクト/リストごとにグルーピング
   ↓
[TodayView 表示]
   ・各タスク行で status / progress / workHours[today] を直接編集
   ・合計作業時間 = Σ workHours[today] を画面上部に表示
   ・サブタスク展開トグル
   ↓
[ユーザー] 工数入力（例：「Vercel調査」に 1.0h）
   ↓
[TaskRepository.update(task) { task.workHoursByDate[todayKey] = 1.0 }]
   ↓
[ユーザー] 「業務日報を生成」ボタン押下
   ↓
[ReportViewModel.open(presetTemplate: .businessDailyReport)]
   ・テンプレート選択 = 「業務日報」（自動選択）
   ・期間 = today
   ↓
[ReportService.generate(template, periodStart, periodEnd)]
   1. ReportContext 生成（now, periodStart, periodEnd, repositories）
   2. TemplateParser.parse(template.body) → segments
   3. TemplateRenderer.render(segments, context) → renderedBody
   4. ReportHistory に保存
   ↓
[ReportPreviewView] renderedBody を表示、ユーザー編集可
   ↓
[ユーザー] 「クリップボードへコピー」 or 「Markdown 保存」
   ↓
[PasteboardService.copy()] or [FileExportService.saveAsMarkdown()]
   ↓
[ReportHistory.update(renderedBody)] 最終形を再保存
```

#### 3.6.3 フロー3：再同期の冪等性

```
前提：
   - 初回同期で Task T1 が Inbox に着地
   - ユーザーが T1 を「Project A / List 1」へ移動
   - ユーザーが T1 の status を inReview に手動更新
   - 外部側で T1 のタイトルが更新された

[ユーザー] 同期ボタン押下
   ↓
[Provider.fetchAssignedTasks] → DTO に T1（externalId 一致、title 更新済）
   ↓
[Reconciler] SyncRecord 検索：
   (connectionId=C1, externalId=T1.externalId) → 既存ヒット → localTaskId
   ↓
[TaskRepository.update(localTaskId)] {
   task.title = dto.title           // 上書き
   task.note = dto.note             // 上書き
   task.dueDate = dto.dueDate       // 上書き
   task.externalUrl = dto.externalUrl
   // 以下は触らない:
   //   task.status, task.progress, task.list, task.tags, task.priority
   //   task.workHoursByDate, task.isCompleted
   task.lastSyncedAt = now
   task.externalFingerprint = dto.externalFingerprint
}
   ↓
結果：
   - T1 は List 1 に留まる（インボックスに戻らない）
   - status は inReview のまま（外部値で上書きされない）
   - title だけが外部の最新値に更新される
```

**重複防止**: 新規判定時に `SyncRecord` で `(connectionId, externalId)` を必ず確認することで、同じ外部タスクが2回挿入されることを防ぐ。

---

## Phase 4: トレードオフ分析（ADR）

### ADR-001: SwiftData vs Core Data

#### Context
全データのローカル永続化が必要。エンティティ数は 9（Project / TaskList / Task / Subtask / Tag / Connection / SyncRecord / ReportTemplate / ReportHistory）。最大 10,000 タスクで快適動作要求。

#### Decision
**SwiftData を採用**（最低 OS を macOS 14 Sonoma とする要件改訂を前提とする）。

#### Consequences

**Positive**
- `@Model` マクロで宣言的にスキーマ定義、ボイラープレート削減
- SwiftUI との統合が良好（`@Query` で自動更新）
- マイグレーション API がシンプル
- 将来 CloudKit 連携にも拡張容易

**Negative**
- macOS 13 Ventura 非対応（要件改訂が必要）
- 複合一意制約が直接サポートされない（アプリ層で `(connectionId, externalId)` を強制）
- 複雑な集約クエリは `FetchDescriptor` の表現力に制約（必要時 NSPredicate へフォールバック）
- まだ枯れていない（macOS 14.0 のバグ報告あり、最低 14.2 推奨）

**Alternatives Considered**
- **Core Data**: macOS 13 で動作するが、NSManagedObject の冗長性と SwiftUI 統合の手間が大きい
- **GRDB.swift（SQLite ラッパー）**: SQL 直書きで柔軟だが、Codable 連携・マイグレーション・SwiftUI 統合の自前実装コストが高い
- **Realm**: 第三者依存、Universal Binary・未署名配布での挙動が不確実

#### Status
Accepted（要件側で最低 OS を macOS 14 Sonoma に改訂すること）

#### Date
2026-05-23

---

### ADR-002: MVVM vs Clean Architecture（このアプリのサイズ）

#### Context
個人開発・単一クライアント・ローカルファースト。複雑な依存方向制御や巨大チーム前提のレイヤー分割は過剰な可能性。

#### Decision
**MVVM + Repository + Service の軽量3層** を採用。Clean Architecture の厳密な UseCase / Entity / Interactor 分割は採用しない。

#### Consequences

**Positive**
- SwiftUI の `@Observable` / `@Bindable` と自然に組み合わせ可能
- レイヤー数が少なく、機能追加スピードが速い
- Repository 層により SwiftData との結合を1箇所に閉じ込められる
- Service 層により Sync・Report 等のユースケースを ViewModel から分離

**Negative**
- ViewModel が肥大化するリスク（→ 機能別 ViewModel 分割で対応）
- ドメイン純粋性が Clean Architecture より低い（→ Repository インターフェースで吸収）

**Alternatives Considered**
- **Clean Architecture（4-5層）**: テスト性は高いが、本アプリ規模ではボイラープレート過多
- **TCA (The Composable Architecture)**: 強力だが学習コスト + ライブラリ依存。個人開発の MVP には重い
- **VIPER**: macOS では一般的でない、SwiftUI 親和性低い

#### Status
Accepted

#### Date
2026-05-23

---

### ADR-003: 並列同期戦略（async/await TaskGroup）

#### Context
複数接続から並列にタスクを取得する必要がある。Notion 3 req/sec のレート制限、部分失敗の許容、ユーザーによる中断、進捗報告のリアルタイム性が要求される。

#### Decision
**Swift Concurrency の `withTaskGroup`** で接続ごとに独立 Task を起動。各接続内のリクエストは `RateLimiter` actor で逐次化、リトライは Exponential Backoff。

#### Consequences

**Positive**
- 構造化並行性で自動キャンセル伝播（中断ボタンが全 Task を停止）
- actor によりレート制限ロジックを安全に共有
- 1接続失敗が他に伝播しない（部分失敗の自然な表現）
- 進捗コールバックを `@Sendable` クロージャで安全に MainActor に転送

**Negative**
- 接続数が多いと一時的なメモリ・CPU スパイク（最大10接続想定なら問題なし）
- レート制限超過リスク（→ actor で確実にスロットリング）

**Alternatives Considered**
- **DispatchQueue + GCD**: レガシー、async/await との統合が煩雑
- **Combine Publisher zip/merge**: 中断・部分失敗の表現が複雑
- **逐次実行（for-await）**: シンプルだが時間がかかる（10接続 × 5秒 = 50秒）

#### Status
Accepted

#### Date
2026-05-23

---

### ADR-004: テンプレート保存形式（プレーンテキスト vs 構造化 JSON）

#### Context
レポートテンプレートは差し込み変数を含む本文を持つ。ユーザーは自由テキスト + `{{変数}}` で編集する。

#### Decision
**プレーンテキスト + `{{identifier}}` プレースホルダー** を採用。`ReportTemplate.body: String` にそのまま保存。

#### Consequences

**Positive**
- ユーザーが直感的に編集可能（コードを意識しない）
- 既存のデフォルトプリセット（FR-19）の形式と完全一致
- パースは正規表現1行で済む（保守容易）
- エクスポート JSON でも可読性が高い

**Negative**
- 構造化情報（フォントや色など）は持てない（→ Markdown 出力のみで十分）
- ネスト構造（変数内変数）は表現不可（→ 不要）
- 未定義変数のエラー検出が実行時のみ（→ エディタープレビューでカバー）

**Alternatives Considered**
- **構造化 JSON / AST**: テンプレートを `[{type:"text",value:"..."},{type:"var",id:"today.workLog"},...]` で保存。型安全だが UX が複雑化（リッチエディター必須）、保存サイズ増加
- **Mustache / Handlebars 互換**: ライブラリ依存、`{{#each}}` 等の制御構文は不要

#### Status
Accepted

#### Date
2026-05-23

---

### ADR-005: OAuth トークンの Keychain 保管方式

#### Context
Google OAuth 2.0 の access_token / refresh_token、Notion Integration Token をセキュアに保存する必要がある。未署名アプリでも動作する必要がある（R1）。

#### Decision
**Keychain Services API（Security.framework）** を直接利用し、`KeychainStore` シングルトンで抽象化。`kSecClassGenericPassword` を使用、`service = "com.taskhub.connection.<connectionUUID>"`、`account = "credentials"`、value は JSON シリアライズしたトークンセット。アクセシビリティは `kSecAttrAccessibleAfterFirstUnlock`。

#### Consequences

**Positive**
- OS レベルで暗号化、平文ファイル禁止要件を満たす
- 接続ごとにスコープを分離（削除時に該当アイテムのみクリア）
- 標準 API のみで第三者依存なし
- アプリ終了時にメモリからクリア（ローカル変数のみで保持）

**Negative**
- 未署名アプリは Keychain プロンプトが毎回出る可能性（R1）→ 同一プロセス内でのアクセスでは表示されないことを確認、問題発生時は暗号化ファイル（CryptoKit + ファイル保存）にフォールバック
- Keychain アイテムはアプリ削除時に残存（→ アプリ初回起動でクリーンアップ機構を実装）
- 物理マシン共有時のリスク（個人利用前提のためスコープ外）

**Alternatives Considered**
- **暗号化ファイル（CryptoKit）**: 未署名でもプロンプトなし。ただし鍵管理が問題（鍵を Keychain に置くと結局同じ）→ R1 のフォールバック案として保持
- **KeychainAccess 等のサードパーティラッパー**: 依存追加に値する複雑度ではない
- **平文 UserDefaults**: 要件違反（NG）

#### Status
Accepted（プライマリ）+ R1 顕在化時に暗号化ファイル方式へフォールバック準備

#### Date
2026-05-23

---

## 付録 A: 設計チェックリスト

### 機能要件
- [x] ユーザーストーリー網羅（FR-01〜FR-22）
- [x] API 契約定義（IntegrationProvider プロトコル）
- [x] データモデル定義（9エンティティ）
- [x] UI/UX フロー（16画面 + 遷移マップ）

### 非機能要件
- [x] パフォーマンス目標（起動 2s、検索 200ms 等）
- [x] スケール要件（10,000 タスク）
- [x] セキュリティ要件（Keychain、HTTPS）
- [x] 可用性（オフライン動作）

### 技術設計
- [x] アーキテクチャ図
- [x] コンポーネント責務
- [x] データフロー（3シナリオ）
- [x] 統合ポイント（Notion / Google / Keychain / Pasteboard）
- [x] エラーハンドリング戦略
- [x] テスト戦略：単体（Repository / Service / VariableRender）、結合（SyncService + Mock Provider）、E2E（UI Test で主要動線）

### 運用
- [x] 配布形式（未署名 .dmg）
- [x] 監視：エラーログのローカルファイル出力（`~/Library/Logs/TaskHub/`）
- [x] バックアップ：JSON エクスポート / インポート（FR-12）
- [x] ロールバック：レポート履歴経由で過去のデータを参照可能

---

## 付録 B: 未解決事項 / 次のアクション

| # | 項目 | 担当 | 期限 |
|---|------|-----|-----|
| ~~Q1~~ | ~~要件 v1.2.0 の「最低 OS = macOS 13」を「macOS 14 Sonoma」に改訂（SwiftData 採用根拠）~~ | ~~要件管理~~ | **解決済み（REQUIREMENTS.md v1.3.0 で改訂）** |
| Q2 | Google OAuth Client ID 取得（Google Cloud Console） | 開発 | 実装フェーズ前 |
| Q3 | Notion API スコープ確認（databases.read のみで足りるか） | 開発 | 実装フェーズ前 |
| Q4 | アプリアイコン・Notion/Google ロゴアセット準備 | デザイン | UI 実装前 |
| Q5 | 検索インデックス戦略（全文 5,000 件 < 200ms）の詳細設計 | 開発 | 検索機能着手時 |
