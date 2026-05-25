# データモデル コードマップ（TaskHub SaaS）

DESIGN.md §3（Prisma スキーマ）で詳細設計済み。実装後にこのファイルを更新すること。
スキーマファイル: `prisma/schema.prisma`

## Prisma モデル一覧

| モデル名 | テーブル名 | 主なフィールド / 特記事項 |
|---------|----------|----------------------|
| `User` | `users` | id（Supabase auth.users UUID）、RLS の起点 |
| `Project` | `projects` | name, colorHex, iconName, userId（RLS）、カスケード削除: TaskList → Task |
| `TaskList` | `task_lists` | name, isInbox（削除・リネーム禁止）、projectId（nullable: インボックスは null） |
| `Task` | `tasks` | title, status, progress, workHoursByDate（JSONB）, source, connectionId, externalId, userId（RLS） |
| `Subtask` | `subtasks` | title, isCompleted, taskId（JOIN で userId を引き継ぐ → RLS） |
| `Tag` | `tags` | name（unique per user）, colorHex, userId（RLS） |
| `TaskTag` | `task_tags` | taskId + tagId（複合 PK）、JOIN で userId を引き継ぐ → RLS |
| `Connection` | `connections` | name, toolType, meIdentifier, configJson, vaultSecretId（暗号化済み ID）, isEnabled, userId（RLS） |
| `SyncRecord` | `sync_records` | connectionId, externalId（複合ユニーク）, taskId, externalFingerprint |
| `SyncRun` | `sync_runs` | status, cursor（50s 制限対応）, progress（JSONB）, userId（RLS） |
| `ReportTemplate` | `report_templates` | name, periodKind, body（`{{変数}}` 形式）, isBuiltIn, userId（RLS） |
| `ReportHistory` | `report_histories` | templateName, renderedBody, generatedAt, userId（RLS） |
| `UserSettings` | `user_settings` | theme, language, filterPrefs（JSONB）, userId（1:1） |

## 重要な制約（アプリ層で強制）

| 制約 | 対象 | 強制箇所 |
|-----|------|---------|
| `(connectionId, externalId)` 複合ユニーク | SyncRecord | `syncRepository.findByExternalId()` で事前チェック |
| `isInbox == true` の TaskList 削除禁止 | TaskList | `projectRepository.deleteList()` で isInbox チェック |
| `isInbox == true` の TaskList リネーム禁止 | TaskList | `projectRepository.updateList()` で isInbox チェック |
| `vaultSecretId` をクライアントへ返さない | Connection | DTO 変換時に必ず除外 |
