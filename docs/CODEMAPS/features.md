# フィーチャー コードマップ（TaskHub SaaS）

DESIGN.md §6 のレイヤー構成に基づく。実装後に更新すること。

## App Router（src/app/）

| ファイルパス | 画面 / 責務 |
|-----------|-----------|
| `src/app/(app)/page.tsx` | ルート → インボックスへリダイレクト |
| `src/app/(app)/inbox/page.tsx` | インボックス（FR-16） |
| `src/app/(app)/today/page.tsx` | 本日の進捗（FR-06c） |
| `src/app/(app)/projects/[projectId]/page.tsx` | プロジェクト/リスト（FR-01） |
| `src/app/(app)/tasks/[taskId]/page.tsx` | タスク詳細（FR-06b） |
| `src/app/(app)/search/page.tsx` | 全文検索（FR-10） |
| `src/app/(app)/reports/page.tsx` | レポート生成（FR-21） |
| `src/app/(app)/reports/history/page.tsx` | レポート履歴（FR-22） |
| `src/app/(app)/settings/integrations/page.tsx` | インテグレーションカタログ（FR-13） |
| `src/app/(app)/settings/integrations/[connectionId]/page.tsx` | 接続編集（FR-14） |
| `src/app/(app)/settings/templates/page.tsx` | テンプレート管理（FR-19） |
| `src/app/auth/login/page.tsx` | Magic Link ログイン |
| `src/app/auth/callback/page.tsx` | Magic Link コールバック |

## Route Handlers（src/app/api/）

| ファイルパス | 責務 |
|-----------|------|
| `src/app/api/projects/route.ts` | GET / POST プロジェクト一覧 |
| `src/app/api/projects/[id]/route.ts` | GET / PATCH / DELETE |
| `src/app/api/tasks/route.ts` | GET / POST タスク一覧 |
| `src/app/api/tasks/[id]/route.ts` | GET / PATCH / DELETE |
| `src/app/api/tasks/[id]/subtasks/route.ts` | GET / POST サブタスク |
| `src/app/api/connections/route.ts` | GET / POST 接続管理 |
| `src/app/api/connections/[id]/route.ts` | PATCH / DELETE |
| `src/app/api/connections/[id]/test/route.ts` | POST 接続テスト |
| `src/app/api/sync/route.ts` | POST 手動同期トリガー |
| `src/app/api/sync/[runId]/route.ts` | GET SyncRun 進捗 |
| `src/app/api/auth/callback/google/route.ts` | GET Google OAuth コールバック |
| `src/app/api/reports/route.ts` | POST レポート生成・履歴保存 |
| `src/app/api/backup/route.ts` | GET JSON エクスポート |
| `src/app/api/cron/sync/route.ts` | POST Vercel Cron エンドポイント（CRON_SECRET 検証） |

## Server Layer（src/server/）

| ファイルパス | 責務 |
|-----------|------|
| `src/server/services/syncService.ts` | SyncRun 管理・接続を順次処理 |
| `src/server/services/reportService.ts` | テンプレートレンダリング・履歴保存 |
| `src/server/services/searchService.ts` | 全文検索（Postgres tsvector） |
| `src/server/services/importExportService.ts` | JSON エクスポート / インポート |
| `src/server/repositories/taskRepository.ts` | Prisma Task CRUD（userId 強制） |
| `src/server/repositories/projectRepository.ts` | Prisma Project / TaskList CRUD |
| `src/server/repositories/connectionRepository.ts` | 接続設定の永続化 |
| `src/server/repositories/syncRepository.ts` | SyncRecord / SyncRun の管理 |
| `src/server/repositories/reportRepository.ts` | テンプレート / 履歴の永続化 |
| `src/server/integrations/IntegrationProvider.ts` | Provider インターフェース + ExternalTaskDTO |
| `src/server/integrations/catalog.ts` | ツール一覧の宣言データ |
| `src/server/integrations/notion/NotionProvider.ts` | Notion API v1 実装 |
| `src/server/integrations/gsheet/GoogleSheetsProvider.ts` | Google Sheets API v4 実装 |
| `src/server/auth/withUser.ts` | 認証 HOF（未認証 → 401） |
| `src/server/vault/index.ts` | Supabase Vault（シークレット暗号化・復号） |
| `src/server/db/index.ts` | Prisma クライアント初期化（singleton） |
| `src/server/cron/syncJob.ts` | 50s 自主終了・cursor 継続ロジック |

## Report エンジン（src/server/services/report/）

| ファイルパス | 責務 |
|-----------|------|
| `src/server/services/report/templateParser.ts` | `{{変数}}` → TemplateSegment 分割 |
| `src/server/services/report/templateRenderer.ts` | Segment → 最終文字列変換 |
| `src/server/services/report/variableRegistry.ts` | 全変数の登録・検索 |
| `src/server/services/report/variables/dateVariable.ts` | `{{date}}` 実装 |
| `src/server/services/report/variables/todayWorkLogVariable.ts` | `{{today.workLog}}` 実装 |
| `src/server/services/report/variables/todayTotalHoursVariable.ts` | `{{today.totalHours}}` 実装 |
| `src/server/services/report/variables/todayPlanVariable.ts` | `{{today.plan}}` 実装 |
| `src/server/services/report/variables/assignedTasksVariable.ts` | `{{assigned.tasks}}` 実装 |
| `src/server/services/report/variables/nextTasksVariable.ts` | `{{next.tasks}}` 実装 |
| （その他 variables/） | 残り 7 変数 |

## Lib / Utilities（src/lib/）

| ファイルパス | 責務 |
|-----------|------|
| `src/lib/rateLimiter.ts` | レート制限（Notion 3 req/sec / GSheet 60 req/min） |
| `src/lib/httpClient.ts` | fetch ラッパー（リトライ・Exponential Backoff） |
| `src/lib/validations/` | Zod スキーマ（全エンティティ） |
