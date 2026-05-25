# 実装計画書：TaskHub SaaS 版

**バージョン**: v1.1.0
**作成日**: 2026-05-25
**対応設計書**: `docs/DESIGN.md` v2.0.0-saas
**対応要件定義**: `docs/REQUIREMENTS.md` v2.0.0-saas

---

## Overview

個人用タスク管理 Web アプリ「TaskHub」の SaaS 版をゼロから構築する。Next.js 15 App Router + Supabase（Postgres / Auth / Realtime / Vault）を採用し、Notion / Google Sheets からのタスク取込、本日進捗管理、Markdown レポート生成までを MVP として実装する。

---

## フェーズ一覧

```
Phase 0 (環境構築)
  ↓
Phase 1 (モック版 UI)
  ↓
Phase 2 (DB + 認証基盤)
  ↓
Phase 3 (コアタスク管理 UI ← バックエンド接続)
  ↓
Phase 4 (外部インテグレーション) ──┐
                                   ├── 並走可能
Phase 5 (レポート機能) ────────────┘
  ↓
Phase 6 (仕上げ・デプロイ)
```

---

## Global Conventions（全フェーズ共通）

- TDD：RED → GREEN → REFACTOR の順で進める（`.claude/rules/testing.md`）
- イミュータブル優先・関数 50 行以内・ファイル 200〜400 行（上限 800 行）
- 全 Route Handler 冒頭で Zod パース、`{ data }` / `{ error }` 共通レスポンス
- Service 層で `where: { userId }` を必ず強制（RLS との二重防御）
- Connection DTO は `vaultSecretId` を必ず除外
- HTTPS のみ（Provider 内で `https:` 以外を弾く）
- 認証情報は Supabase Vault のみ（DB / Cookie への平文保存禁止）

---

## Phase 0: 環境構築・スキャフォールディング

**ゴール**：Next.js 15 App Router プロジェクトと Supabase プロジェクトを起動状態にし、CI / Vercel に接続する。

### 手動操作（ユーザー作業必須）

| # | 内容 | 備考 |
|---|---|---|
| M0-1 | Supabase ダッシュボードで新規プロジェクト作成（リージョン: ap-northeast-1 等） | Free プラン |
| M0-2 | Supabase ダッシュボードで Vault を有効化（Database → Extensions → `pgsodium`） | RLS 利用のため |
| M0-3 | Supabase Auth で Email Provider を有効化、Magic Link 用 SMTP / メールテンプレート設定 | Site URL / Redirect URL を後で設定 |
| M0-4 | Supabase の `DATABASE_URL`（Pooler）/ `DIRECT_URL` / anon key / service_role key を控える | `.env.local` に投入 |
| M0-5 | Google Cloud Console で OAuth クライアント（Web）作成、リダイレクト URI を仮設定 | Phase 4 で使用 |
| M0-6 | Notion Internal Integration の作成手順を README に明記（個別接続ごとにユーザーが取得） | 実トークンは UI 経由で投入 |
| M0-7 | Vercel プロジェクト作成、GitHub リポジトリ連携、Preview / Production を `develop` / `main` に紐付け | `vercel.json` 後で追加 |
| M0-8 | Vercel に環境変数を投入（Production / Preview / Development 各環境） | `.env.local` と同一キー |

### 自動化ステップ

| # | 内容 | ファイル / コマンド | 複雑度 |
|---|---|---|---|
| 0-1 | プロジェクト初期化（`develop` ブランチから） | `pnpm create next-app@latest . --typescript --app --tailwind --src-dir --import-alias "@/*" --no-eslint` | 低 |
| 0-2 | 依存パッケージ導入 | `pnpm add @supabase/supabase-js @supabase/ssr @prisma/client @tanstack/react-query @tanstack/react-virtual zustand react-hook-form zod @hookform/resolvers next-intl pino @sentry/nextjs` / `pnpm add -D prisma vitest @testing-library/react @testing-library/jest-dom @playwright/test @biomejs/biome jsdom @vitejs/plugin-react` | 低 |
| 0-3 | shadcn/ui 初期化 | `pnpm dlx shadcn@latest init`、`button / input / dialog / dropdown-menu / toast / sheet / select / checkbox / slider / textarea / tooltip / tabs / table / badge / scroll-area` を `add` | 低 |
| 0-4 | Biome 初期化（既存 ESLint を撤去） | `biome init`、`biome.json` を `.claude/rules` 準拠の設定に | 低 |
| 0-5 | Vitest 設定（jsdom + RTL） | `vitest.config.ts`、`vitest.setup.ts` | 低 |
| 0-6 | Playwright 初期化 | `pnpm exec playwright install`、`playwright.config.ts` | 低 |
| 0-7 | `.env.local.example` 作成（DESIGN.md §9.1 の全変数） | `.env.local.example`、`README.md`、`.gitignore` 更新 | 低 |
| 0-8 | `vercel.json` 作成（Cron `*/30 * * * *` → `/api/cron/sync`） | `vercel.json` | 低 |
| 0-9 | CI 刷新（Swift → Next.js） | `.github/workflows/ci.yml`（`pnpm typecheck && biome check && pnpm test && pnpm prisma migrate deploy`） | 中 |
| 0-10 | ディレクトリ雛形作成（DESIGN.md §6.2） | `src/app/(auth)`、`src/app/(app)`、`src/app/api`、`src/components`、`src/features`、`src/server/{services,repositories,integrations,auth,vault,cron,db}`、`src/lib/{schemas,utils}` | 低 |
| 0-11 | `src/server/db/prisma.ts` シングルトン雛形 | グローバル開発向けキャッシュ含む | 低 |
| 0-12 | TS strict 設定、`paths` 整備、`server-only` パッケージ導入 | `tsconfig.json` | 低 |

**依存**：なし
**リスク**：Supabase 無料枠の Vault 利用制約 → 事前に拡張機能の可用性を確認

---

## Phase 1: モック版 UI

**ゴール**：バックエンド実装前に全画面を静的ハードコードデータで構築し、`site/mockup.html` を参照しながら UI / UX を確定する。Phase 3 でモックデータをリアル API に差し替えるだけで済む状態にする。

### 参考ファイル

- `site/mockup.html` — 既存インタラクティブモックアップ（3ペイン構成、スマホ対応済み）

### ステップ

| # | 内容 | ファイル | 複雑度 |
|---|---|---|---|
| 1-1 | モックデータ定義（タスク・プロジェクト・リスト・今日ビュー・同期履歴・レポート用） | `src/lib/mock/data.ts` | 低 |
| 1-2 | 型定義（Prisma 生成前の暫定型、後で置き換え） | `src/lib/mock/types.ts` | 低 |
| 1-3 | レイアウト（Sidebar + Header、PC=サイドバー固定、スマホ=Sheet スライドイン） | `src/app/(app)/layout.tsx`、`src/components/layout/Sidebar.tsx` | 中 |
| 1-4 | インボックス画面（タスク一覧 + ステータス / 進捗ドロップダウン） | `src/app/(app)/inbox/page.tsx` | 中 |
| 1-5 | タスク詳細 Drawer（メモ・タグ・サブタスク・作業時間・優先度） | `src/features/tasks/components/TaskDetailDrawer.tsx` | 中 |
| 1-6 | 本日の進捗画面（合計工数・作業時間入力・「報告生成」ボタン） | `src/app/(app)/today/page.tsx` | 中 |
| 1-7 | プロジェクト / リスト画面（タスク一覧） | `src/app/(app)/projects/[id]/lists/[listId]/page.tsx` | 中 |
| 1-8 | 設定 > インテグレーションカタログ画面（カード一覧・Coming Soon モーダル） | `src/app/(app)/settings/integrations/page.tsx` | 低 |
| 1-9 | 設定 > 接続管理画面（一覧・編集・削除・テストボタン） | `src/app/(app)/settings/connections/[id]/page.tsx` | 中 |
| 1-10 | 同期プログレス UI（プログレスバー・接続名・中断ボタン） | `src/features/sync/components/SyncIndicator.tsx` | 中 |
| 1-11 | レポート生成画面（テンプレート選択・プレビュー・コピー / DL ボタン） | `src/app/(app)/reports/page.tsx` | 中 |
| 1-12 | レポート履歴画面 | `src/app/(app)/reports/history/page.tsx` | 低 |
| 1-13 | ログイン画面（Magic Link メール入力フォーム） | `src/app/(auth)/login/page.tsx` | 低 |
| 1-14 | ダーク / ライトテーマ切替（next-themes）、レスポンシブ確認（360px / 768px / 1280px） | `src/features/_shared/components/ThemeToggle.tsx` | 低 |
| 1-15 | `site/mockup.html` との見た目・操作感の比較・調整 | — | 低 |

**依存**：Phase 0
**リスク**：モック段階で大きく変更した UI コンポーネントが Phase 3 で大幅修正になる → 型定義を仮置きにして差し替えを前提とした設計にする

---

## Phase 2: DB・認証基盤

**ゴール**：Prisma スキーマと RLS / トリガー / Realtime を有効化し、Magic Link + ALLOWED_EMAILS で認証ガードを通過できる状態にする。

### 手動操作

| # | 内容 |
|---|---|
| M2-1 | Supabase で `tasks` / `subtasks` / `sync_runs` の Realtime Publication を有効化（Database → Replication） |
| M2-2 | `ALLOWED_EMAILS` に自身のメールアドレスを設定 |
| M2-3 | Supabase Auth の Redirect URLs に `${APP_BASE_URL}/api/auth/callback` を追加 |

### ステップ

| # | 内容 | ファイル | 複雑度 |
|---|---|---|---|
| 2-1 | `prisma/schema.prisma` 作成（DESIGN.md §3.1 全文） | `prisma/schema.prisma` | 中 |
| 2-2 | `pnpm prisma migrate dev --name init` で初期マイグレーション | 自動生成 | 低 |
| 2-3 | 補助 SQL マイグレーション（DESIGN.md §3.2：部分ユニーク・tsvector・RLS 全テーブル・インボックス保護トリガー・status↔isCompleted トリガー） | `prisma/migrations/{ts}_supplemental/migration.sql` | 高 |
| 2-4 | Auth helper（SSR / Route Handler / Server Action 用） | `src/server/auth/supabase.ts`、`src/lib/supabase/client.ts` | 中 |
| 2-5 | allowlist モジュール + テスト | `src/server/auth/allowlist.ts` + `allowlist.test.ts` | 低 |
| 2-6 | Magic Link 送信 API | `src/app/api/auth/magic-link/route.ts` | 中 |
| 2-7 | Auth コールバック（コード交換 → allowlist 再検証 → `users` upsert） | `src/app/api/auth/callback/route.ts` | 中 |
| 2-8 | Signout | `src/app/api/auth/signout/route.ts` | 低 |
| 2-9 | Middleware（認証ガード + allowlist） | `src/middleware.ts` | 中 |
| 2-10 | `withUser` HOF（Service 関数の `(ctx: { userId })` 統一） | `src/server/auth/withUser.ts` | 中 |
| 2-11 | Repository 基底クラス（`where: { userId }` 強制） | `src/server/repositories/base.ts` | 中 |
| 2-12 | エラー型定義 | `src/server/errors.ts` + テスト | 低 |
| 2-13 | Route Handler 共通ラッパー（try/catch → `{ error }` 整形・pino ログ） | `src/server/http/withErrorHandler.ts` | 中 |
| 2-14 | RLS 動作検証（インテグレーションテスト） | `tests/integration/rls.test.ts` | 中 |

**依存**：Phase 0（Supabase 接続情報が必要）
**リスク**：インボックス保護トリガーの `OLD.is_inbox` が UPDATE 時に正しく評価されない → Supabase 上で先に検証

---

## Phase 3: コアタスク管理 UI（バックエンド接続）

**ゴール**：Phase 1 のモック UI をリアル API に差し替え、インボックス・プロジェクト・リスト・タスク・サブタスク・タグの CRUD と楽観的 UI 更新・Realtime 反映が動作する。

### 3.1 サーバー（Service / Repository / API）

| # | 内容 | ファイル | 複雑度 |
|---|---|---|---|
| 3-1 | Zod スキーマ群 | `src/lib/schemas/{project,taskList,task,subtask,tag}.ts` | 中 |
| 3-2 | Repository 群（Project / TaskList / Task / Subtask / Tag / TaskTag） | `src/server/repositories/*.ts` | 中 |
| 3-3 | TaskService（CRUD・status↔isCompleted 同期・進捗 100% 確認・workHoursByDate） | `src/server/services/TaskService.ts` + テスト | 高 |
| 3-4 | ProjectService / TaskListService（インボックス保護を Service 層でも強制） | `src/server/services/{Project,TaskList}Service.ts` | 中 |
| 3-5 | TagService | `src/server/services/TagService.ts` | 低 |
| 3-6 | TodayService（期限=今日 OR status=in_progress を集約） | `src/server/services/TodayService.ts` + テスト | 中 |
| 3-7 | Route Handlers（DESIGN.md §4.2〜§4.5 全エンドポイント） | `src/app/api/{projects,lists,tasks,subtasks,tags}/**/*.ts` | 高 |
| 3-8 | 一括更新・移動・並び替えエンドポイント | `tasks/bulk-update`、`tasks/:id/move`、`subtasks/reorder` | 中 |
| 3-9 | カーソルページネーション | `src/lib/utils/pagination.ts` | 中 |
| 3-10 | 初期データ投入（新規ユーザー callback 時にインボックス + デフォルトテンプレ 2 種を作成） | `src/server/services/UserBootstrapService.ts` | 中 |

### 3.2 クライアント（Hook / View 差し替え）

| # | 内容 | ファイル | 複雑度 |
|---|---|---|---|
| 3-11 | TanStack Query Provider + Supabase Realtime Provider | `src/app/providers.tsx` | 中 |
| 3-12 | Zustand store（選択中タスク・モーダル開閉・サイドバー開閉） | `src/features/_shared/store.ts` | 低 |
| 3-13 | useTasksQuery / useUpdateTaskMutation（楽観的更新・onError ロールバック） | `src/features/tasks/hooks/*.ts` | 高 |
| 3-14 | Realtime 購読 hook（`tasks` / `subtasks` / `sync_runs`） | `src/features/_shared/hooks/useRealtimeTasks.ts` | 高 |
| 3-15 | モックデータ → リアル API 差し替え（各画面の hook を接続） | 各 `page.tsx` / コンポーネント | 高 |
| 3-16 | 仮想スクロール（`@tanstack/react-virtual`、1,000 件対応） | インボックス・リスト画面 | 中 |
| 3-17 | フィルタ＆並び替えバー + サーバー保存 | `src/features/_shared/components/FilterBar.tsx` | 中 |
| 3-18 | キーボードショートカット（PC のみ） | `src/features/_shared/hooks/useShortcuts.ts` | 中 |
| 3-19 | i18n 雛形（next-intl、ja / en） | `src/i18n/*`、`messages/{ja,en}.json` | 中 |

**依存**：Phase 1（UI）、Phase 2（DB・認証）
**リスク**：楽観的更新と Realtime push の競合 → mutation 完了時にキャッシュ更新元を判別

---

## Phase 4: 外部インテグレーション（Notion / Google Sheets）

**ゴール**：インテグレーションカタログから接続を作成しシークレットを Vault に保管、同期ジョブで自分のタスクを取り込み、Realtime で進捗表示する。

### 手動操作

| # | 内容 |
|---|---|
| M4-1 | Google Cloud Console で OAuth クライアントの Authorized Redirect URI に `${APP_BASE_URL}/api/oauth/google/callback` を設定 |
| M4-2 | Google Sheets API の有効化 |
| M4-3 | テスト用 Notion Integration を作成（手動 E2E 用） |
| M4-4 | テスト用スプレッドシートを準備（担当者列を持つ） |
| M4-5 | Vercel ダッシュボードで `CRON_SECRET` を生成・投入 |

### ステップ

| # | 内容 | ファイル | 複雑度 |
|---|---|---|---|
| 4-1 | IntegrationProvider インターフェース | `src/server/integrations/IntegrationProvider.ts` | 中 |
| 4-2 | RateLimiter（token bucket） | `src/server/integrations/RateLimiter.ts` + テスト | 中 |
| 4-3 | HTTPClient（HTTPS ガード・Exponential Backoff・ログマスク） | `src/server/integrations/HttpClient.ts` + テスト | 中 |
| 4-4 | EncryptedSecrets（Vault ラッパー） | `src/server/vault/EncryptedSecrets.ts` + テスト | 中 |
| 4-5 | NotionProvider（DB クエリ・People フィルタ・サブタスク・ページング） | `src/server/integrations/NotionProvider.ts` + テスト | 高 |
| 4-6 | GSheetProvider（範囲取得・担当者列フィルタ・列マッピング） | `src/server/integrations/GSheetProvider.ts` + テスト | 高 |
| 4-7 | ConnectionService（作成時 Vault 投入・DTO で `vaultSecretId` 除外） | `src/server/services/ConnectionService.ts` + テスト | 中 |
| 4-8 | カタログ定義（JSON ベース、ハードコード回避） | `src/server/integrations/catalog.ts` | 低 |
| 4-9 | OAuth (Google) start / callback（PKCE・`state` HTTP-Only Cookie・Vault 保存） | `src/app/api/oauth/google/{start,callback}/route.ts` + テスト | 高 |
| 4-10 | GSheet 列マッピング補助 API | `src/app/api/connections/:id/gsheet-columns/route.ts` | 中 |
| 4-11 | SyncRunRepository / SyncRecordRepository | `src/server/repositories/*.ts` | 中 |
| 4-12 | SyncService（startBulkSync / syncSingleConnection / resume・50 秒分割） | `src/server/services/SyncService.ts` + テスト | 高 |
| 4-13 | 競合ルール実装（タイトル / メモ / 期限上書き・status / progress 保持・サブタスク差分） | SyncService 内 + テスト | 高 |
| 4-14 | 外部削除検知 + resolve-deletions | SyncService 内 | 中 |
| 4-15 | Sync API 群（DESIGN.md §4.8） | `src/app/api/sync/**/*.ts` | 中 |
| 4-16 | Cron ハンドラ（Bearer 認証） | `src/app/api/cron/sync/route.ts` | 中 |
| 4-17 | カタログ UI → モック差し替え（実接続動作） | `settings/integrations/page.tsx` | 中 |
| 4-18 | Connection 作成ウィザード（Notion / GSheet 別フォーム、Secure 入力） | `src/features/connections/components/*` | 高 |
| 4-19 | 同期ボタン + プログレス UI → Realtime 接続（モック差し替え） | `SyncIndicator.tsx`、`useSyncRun.ts` | 高 |
| 4-20 | 外部削除タスク確認ダイアログ | `src/features/sync/components/ResolveDeletionsDialog.tsx` | 中 |
| 4-21 | フッターサマリー（最終同期日時） | `src/components/layout/SyncSummaryFooter.tsx` | 低 |

**依存**：Phase 3
**リスク**：Vault RPC に service_role 必須 → `import "server-only"` 厳守 / security-reviewer 必須

---

## Phase 5: レポート機能

**ゴール**：テンプレート CRUD、差し込み変数、生成・履歴を完了し、本日ビューから 1 クリック生成できる。

| # | 内容 | ファイル | 複雑度 |
|---|---|---|---|
| 5-1 | ReportTemplate / ReportHistory Repository | `src/server/repositories/Report*Repository.ts` | 低 |
| 5-2 | VariableRenderer（FR-20 全 12 変数、出力フォーマット仕様準拠） | `src/server/services/VariableRenderer.ts` + ゴールデンファイルテスト | 高 |
| 5-3 | ReportService（テンプレート CRUD・preview・generate・履歴保存） | `src/server/services/ReportService.ts` + テスト | 中 |
| 5-4 | プリセットテンプレート 2 種の seed（UserBootstrapService に統合） | — | 低 |
| 5-5 | API（DESIGN.md §4.9 全エンドポイント） | `src/app/api/{report-templates,reports}/**/*.ts` | 中 |
| 5-6 | TemplateEditor（変数パネル・カーソル挿入・プレビュー）→ モック差し替え | `src/components/reports/TemplateEditor.tsx` | 高 |
| 5-7 | レポート生成画面 → モック差し替え | `src/app/(app)/reports/page.tsx` | 中 |
| 5-8 | Clipboard API + Markdown ダウンロード | `src/lib/utils/download.ts` | 低 |
| 5-9 | レポート履歴 → モック差し替え | `reports/history/page.tsx` | 中 |
| 5-10 | 本日ビューからの 1 クリック呼び出し | 本日ビューに統合 | 低 |

**依存**：Phase 3（Task データ参照）。Phase 4 は不要（独立して進められる）
**リスク**：VariableRenderer の出力フォーマット（プロジェクト間空行有無・`[sub]` インデント）が厳格 → ゴールデンファイルテストで担保

---

## Phase 6: 仕上げ・デプロイ

**ゴール**：検索・エクスポート / インポート、E2E テスト、本番デプロイ、観測性確保。

### ステップ

| # | 内容 | ファイル | 複雑度 |
|---|---|---|---|
| 6-1 | 全文検索（tsvector + `websearch_to_tsquery` + GIN） | `src/app/api/tasks/route.ts`（`q=` パラメータ）+ テスト | 中 |
| 6-2 | 検索画面（インクリメンタル検索・結果からジャンプ） | `src/app/(app)/search/page.tsx` | 中 |
| 6-3 | JSON エクスポート（認証情報除外） | `src/app/api/export/route.ts`、`ExportService.ts` + テスト | 中 |
| 6-4 | JSON インポート（バリデーション・再入力誘導） | `src/app/api/import/route.ts`、`ImportService.ts` + テスト | 高 |
| 6-5 | エクスポート / インポート UI（設定画面） | `src/app/(app)/settings/backup/page.tsx` | 低 |
| 6-6 | アクセシビリティ監査（aria 属性・キーボード操作・`@axe-core/playwright`） | E2E テストに統合 | 中 |
| 6-7 | レスポンシブ最終調整（360px / 768px / 1280px） | 各画面 CSS 微調整 | 中 |
| 6-8 | E2E テスト（Playwright）：認証・インボックス CRUD・本日ビュー・同期・レポート生成 | `tests/e2e/*.spec.ts` | 高 |
| 6-9 | カバレッジ 80% 確認 | `pnpm vitest run --coverage` | 中 |
| 6-10 | pino ロガー設定（トークン自動マスク） | `src/lib/logger.ts` | 低 |
| 6-11 | Sentry 初期化（任意） | `sentry.{client,server}.config.ts` | 低 |
| 6-12 | README / 運用ドキュメント（Supabase 設定手順・OAuth 設定・環境変数一覧） | `README.md`、`docs/SETUP.md` | 中 |
| 6-13 | CODEMAPS 更新 | `docs/CODEMAPS/*` | 低 |

### 手動操作

| # | 内容 |
|---|---|
| M6-1 | Vercel Production への初回デプロイ（`main` マージ） |
| M6-2 | 本番 `ALLOWED_EMAILS` 設定確認、Magic Link 実機検証 |
| M6-3 | Supabase の自動バックアップ設定確認 |
| M6-4 | Google OAuth クライアントを本番リダイレクト URI へ正式登録 |

**依存**：Phase 4、Phase 5
**リスク**：tsvector の日本語精度は `simple` のため限界あり → MVP 受け入れ、将来 `pg_bigm` 移行

---

## テスト戦略

| 種別 | 対象 | ツール |
|---|---|---|
| Unit | VariableRenderer / RateLimiter / allowlist / Repository / Service / Zod スキーマ | Vitest |
| Integration | Route Handlers・RLS 動作確認・SyncService + MockProvider | Vitest + Supabase ローカル |
| E2E | 認証 → インボックス → タスク → 本日ビュー → 同期（モック）→ レポート生成 | Playwright |

TDD 順序：Zod スキーマ → Repository → Service → Route Handler → Hook → View

---

## リスク一覧

| リスク | 影響 | 対処 |
|---|---|---|
| Vercel Hobby 60 秒制限超過 | 高 | 50 秒で自主終了・cursor 保存・Cron で継続 |
| Supabase Vault 権限ミスでトークン漏洩 | 致命 | `server-only` 必須・security-reviewer 必須 |
| RLS と Prisma Service Role 併用で越境アクセス | 高 | Service 層 `where: { userId }` 強制 + RLS テスト |
| 楽観的更新と Realtime の競合 | 中 | `updated_at` で新旧判別 |
| OAuth state / PKCE 実装不備 | 致命 | DESIGN.md §7.6 準拠・security-reviewer 必須 |
| モック UI と実装 UI の乖離 | 中 | 型定義を仮置きにして差し替えを前提とした設計 |
| インボックスの誤削除・誤リネーム | 高 | DB トリガー + Service 層の二重防御 |

---

## 成功基準

- [ ] `ALLOWED_EMAILS` で Magic Link ログインが自分のみ通過する
- [ ] インボックス・プロジェクト・リスト・タスク・サブタスク・タグの CRUD が PC / スマホで動作する
- [ ] PC ↔ スマホで Realtime 反映が確認できる
- [ ] 本日の進捗画面で作業時間入力・合計工数表示が動作する
- [ ] Notion / Google Sheets 接続でシークレットが Vault に保管される（DB に平文非存在確認）
- [ ] 同期ジョブの進捗が Realtime で UI に反映される
- [ ] レポート生成でプリセット 2 種が初期表示され `{{today.workLog}}` 等が仕様通り展開される
- [ ] 全文検索が 5,000 件で p95 < 300ms
- [ ] JSON エクスポート / インポートが成功（認証情報除外）
- [ ] Vitest カバレッジ 80% 以上
- [ ] Playwright E2E 主要フローが通る
- [ ] Vercel Production デプロイ + Cron 動作確認

---

## 関連ドキュメント

- `docs/REQUIREMENTS.md` — 要件定義書 v2.0.0-saas
- `docs/DESIGN.md` — 設計書 v2.0.0-saas
- `CLAUDE.md` — プロジェクト指示・スラッシュコマンド一覧
- `site/mockup.html` — UI モックアップ（Phase 1 の参考）
