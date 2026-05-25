# TaskHub SaaS 版 設計書

**バージョン**: v2.0.0-saas
**作成日**: 2026-05-25
**ステータス**: 承認済み
**対応要件定義**: `docs/REQUIREMENTS.md` v2.0.0-saas
**対象プラットフォーム**: モダン Web ブラウザ（PC + スマホ）

---

## 0. 本書の位置づけ

本書は要件定義書 v2.0.0-saas を受けて、TaskHub SaaS 版（Web アプリ）の技術設計を確定するものである。以下の未解決事項に対する判断を含む：

- Q1: アクセス制御方式 → Supabase Auth Magic Link + ALLOWED_EMAILS allowlist
- Q2: リアルタイム同期方式 → Supabase Realtime (Postgres Changes)
- Q3: 同期ジョブの実行方式 → Vercel Cron + Vercel Background Functions（Inngest は MVP では採用しない）
- Q4: デプロイ先 → Vercel Hobby
- Q5: ホスティング費用 → 無料枠優先（Supabase Free + Vercel Hobby）
- Q6: クラウド DB → Supabase Postgres
- Q7: 認証情報の暗号化ストレージ → Supabase Vault (pgsodium)

---

## 1. 技術スタック決定表

| レイヤー | 採用技術 | 主な代替案 | 決定理由 |
|---------|---------|----------|---------| 
| 言語 | TypeScript 5.x | — | 型安全性、要件で必須指定 |
| フレームワーク | Next.js 15 App Router | Remix / SvelteKit | RSC + Server Actions による楽観的 UI、Vercel との親和性、要件で前提 |
| UI ライブラリ | shadcn/ui (Radix UI + Tailwind CSS) | MUI / Chakra | コピー&ペースト型でカスタマイズ容易、a11y 標準準拠、レスポンシブ容易 |
| 状態管理 (Server) | TanStack Query | SWR | キャッシュ・楽観的更新・無効化が宣言的 |
| 状態管理 (Client) | Zustand | Jotai / Redux | UI ステートのみに限定、軽量 |
| フォーム | React Hook Form + Zod | Formik | Zod スキーマをサーバー検証と共用 |
| スキーマ検証 | Zod | Yup / Valibot | TS 親和性、Route Handlers / Server Actions 双方で再利用 |
| ORM | Prisma 5 | Drizzle | DX・マイグレーション・型生成が安定 |
| DB / Auth / Realtime / Vault | Supabase | Neon + Clerk / PlanetScale | DB + Auth + Realtime + Vault を統合提供 |
| 認証方式 (Q1) | Supabase Auth Magic Link + ALLOWED_EMAILS allowlist | NextAuth / Clerk / Vercel パスワード | Email allowlist で個人限定、パスワード管理不要、無料 |
| バックグラウンドジョブ (Q3) | Vercel Cron + 自前 SyncRun テーブル | Inngest / Trigger.dev / Supabase Edge | MVP では外部依存を増やさず Vercel 標準機構で実装。Cron で接続ごとに順次起動、進捗は DB に書き込み Realtime 配信 |
| リアルタイム (Q2) | Supabase Realtime (Postgres Changes) | SSE / ポーリング | 既存 Supabase 採用なら追加コスト 0 |
| デプロイ (Q4) | Vercel Hobby | Cloudflare Pages | Next.js 公式、Hobby 無料枠で個人利用は十分 |
| シークレット保管 (Q7) | Supabase Vault (pgsodium) | AWS KMS / Doppler | DB と同基盤、サーバー側のみ復号可能 |
| 監視 | Vercel Analytics + Sentry (任意) | Datadog | 無料枠あり |
| 国際化 | next-intl | next-i18next | App Router 公式対応、軽量 |
| テスト | Vitest + Playwright + Testing Library | Jest | App Router + ESM 親和性 |
| Lint / Format | Biome | ESLint + Prettier | 高速、設定統合 |

---

## 2. Architecture Decision Records (ADR)

### ADR-001: Supabase をプラットフォーム基盤として採用

**Context**
DB / Auth / Realtime / Vault が個別サービスだと運用とコストが複雑化する。個人利用前提のため、低運用コストを最優先したい。

**Decision**
Supabase に統合する（Postgres / Auth / Realtime / Vault / Storage）。

**Consequences**

Positive:
- 無料枠（500MB DB / 2GB egress / 50,000 MAU）で本要件を満たす
- 標準 Postgres のため SQL の知見がそのまま使える
- Vault による暗号化保管が DB と同じトランザクション境界で扱える

Negative:
- ベンダーロックインのリスク

Alternatives Considered:
- Neon (Postgres) + Clerk (Auth) + Upstash (Redis): 構成要素が増え運用負荷増
- PlanetScale (MySQL) + 他 Auth: MySQL は Postgres ほど検索・JSONB 機能が強くない

**Mitigation**
- Prisma 経由のアクセスで標準 Postgres から逸脱しない
- JSON エクスポート（FR-12）で脱出経路を確保

**Status**: Accepted

---

### ADR-002: 認証は Supabase Auth Magic Link + メール allowlist

**Context**
URL を知る他者からのアクセスを拒否する必要がある（R1）。同時に、個人利用前提でパスワード管理の負荷を増やしたくない。

**Decision**
- Supabase Auth の Magic Link を採用
- サーバー側 `ALLOWED_EMAILS` 環境変数で許可メールアドレスを限定
- Magic Link 送信前 / コールバック後の二段階で allowlist 検証

**Consequences**

Positive:
- パスワード漏洩・忘却リスクなし
- 無料枠内
- 将来マルチユーザー対応へ拡張可能（allowlist を解除）
- RLS と統合可能

Negative:
- メール到達遅延（数秒〜1 分）
- メールアカウントを失うとアクセス不能

Alternatives Considered:
- NextAuth.js: DB スキーマ管理が増え重複
- Clerk: 無料枠を超えやすい
- Vercel Password Protection: アプリ層のセッション情報を持てず RLS と統合できない
- シンプルパスワード（環境変数）: セッション・ログイン状態管理を自前実装する必要あり

**Status**: Accepted

---

### ADR-003: ORM は Prisma

**Context**
型安全な DB アクセスとマイグレーション管理が必要。Supabase Postgres 上で動かす。

**Decision**
Prisma 5 を採用。

**Consequences**

Positive:
- 型生成、マイグレーション CLI、TS 親和性
- Supabase 公式ガイドあり

Negative:
- Edge Runtime での制限あり → Route Handlers は Node Runtime を明示

Alternatives Considered:
- Drizzle: 軽量だが、個人利用規模では Prisma の DX 優位が大きい

**Status**: Accepted

---

### ADR-004: バックグラウンド同期は Vercel Cron + 自前 SyncRun テーブル（Inngest 不採用）

**Context**
Vercel Hobby は関数実行時間が 60 秒上限。Notion / GSheet の全件同期は条件次第でこれを超え得る（R5）。当初 Inngest を候補としたが、MVP では外部サービス依存を最小化し、運用と学習コストを下げたい。

**Decision**
- MVP では **Inngest を採用しない**
- Vercel Cron（任意の手動同期は API 経由でも起動可）+ 自前 `SyncRun` テーブルで同期ジョブを管理
- 同期処理は **1 接続ずつ順次実行**（並列化しない）
- 進捗は `SyncRun.progress` / `SyncRun.itemsProcessed` への書き込みで管理し、Supabase Realtime で UI に配信
- 60 秒制限を超え得る接続は **「接続を内部的に分割して複数回呼び出す」設計**（カーソル/ページトークンを `SyncRun.cursor` カラムに保存し、次回継続実行）
- レート制限はサーバープロセス内の token bucket で制御（Notion 3 req/sec、GSheet 60 req/min）

**Consequences**

Positive:
- 外部依存ゼロ、無料
- ジョブ実装が標準 Next.js Route Handler で完結
- 個人利用（1 ユーザー、想定タスク 10,000 件）規模では十分

Negative:
- 並列化なし → 接続数が多いと総時間が長くなる
- 関数 60 秒制限への対応として分割実行ロジックを自前で書く必要がある
- Inngest のような Step ベースの可観測性は得られない（自前でログ整備する必要あり）

Alternatives Considered:
- **Inngest**: 機能は強力だが MVP では過剰、将来必要になれば追加
- **Trigger.dev**: 同上
- **Supabase Edge Functions**: 別ランタイム管理が増える

**Future Path**
- スループット要件が増えた段階で Inngest へ移行（Service 層インターフェースは維持）

**Status**: Accepted

---

### ADR-005: リアルタイム同期は Supabase Realtime (Postgres Changes)

**Context**
PC ↔ スマホで同データを反映する必要がある（FR-09）。同期進捗もリアルタイムに UI に表示したい（FR-15）。

**Decision**
- `tasks` / `subtasks` / `sync_runs` テーブルの Postgres Changes (CDC) を Supabase Realtime クライアントで購読
- `user_id = auth.uid()` でフィルタ

**Consequences**

Positive:
- 既存 Supabase 基盤の上で動く（追加コストなし）
- SSE 自前実装より堅牢
- フィルタ条件をクライアントから指定可能

Negative:
- 無料枠の同時接続数上限あり（個人利用 PC + スマホ程度では問題なし）

Alternatives Considered:
- SSE: Vercel 上で長時間接続を維持するコストが高い
- ポーリング: バッテリー消費・無駄なリクエスト

**Status**: Accepted

---

## 3. データベース設計

### 3.1 Prisma スキーマ

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ===== Users (Supabase auth.users を参照) =====
model User {
  id        String   @id @db.Uuid // = auth.users.id
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  projects        Project[]
  taskLists       TaskList[]
  tasks           Task[]
  tags            Tag[]
  connections     Connection[]
  reportTemplates ReportTemplate[]
  reportHistory   ReportHistory[]
  settings        UserSettings?

  @@map("users")
}

// ===== Projects =====
model Project {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  name      String
  color     String   @default("#6366f1")
  icon      String?
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskLists TaskList[]

  @@index([userId])
  @@map("projects")
}

// ===== TaskLists (Inbox 含む) =====
model TaskList {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  projectId String?  @map("project_id") @db.Uuid // null = Inbox 等の独立リスト
  name      String
  isInbox   Boolean  @default(false) @map("is_inbox")
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   Task[]

  @@index([userId, projectId])
  @@map("task_lists")
}

// ===== Tasks =====
enum TaskStatus {
  not_started
  in_progress
  in_review
  completed
  on_hold
}

enum TaskPriority {
  low
  medium
  high
  urgent
}

enum TaskSource {
  manual
  notion
  gsheet
}

model Task {
  id              String        @id @default(uuid()) @db.Uuid
  userId          String        @map("user_id") @db.Uuid
  taskListId      String        @map("task_list_id") @db.Uuid
  title           String
  memo            String?
  dueDate         DateTime?     @map("due_date") @db.Date
  priority        TaskPriority  @default(medium)
  status          TaskStatus    @default(not_started)
  progress        Int           @default(0)  // 0..100
  isCompleted     Boolean       @default(false) @map("is_completed")
  isArchived      Boolean       @default(false) @map("is_archived")
  source          TaskSource    @default(manual)
  workHoursByDate Json          @default("{}") @map("work_hours_by_date") // { "2026-05-25": 1.5 }
  sortOrder       Int           @default(0) @map("sort_order")
  searchVector   Unsupported("tsvector")? @map("search_vector")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskList   TaskList    @relation(fields: [taskListId], references: [id], onDelete: Cascade)
  subtasks   Subtask[]
  taskTags   TaskTag[]
  syncRecord SyncRecord?

  @@index([userId, status, isCompleted])
  @@index([userId, dueDate])
  @@index([taskListId])
  @@map("tasks")
}

// ===== Subtasks =====
model Subtask {
  id          String   @id @default(uuid()) @db.Uuid
  taskId      String   @map("task_id") @db.Uuid
  title       String
  isCompleted Boolean  @default(false) @map("is_completed")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("subtasks")
}

// ===== Tags =====
model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  name      String
  color     String   @default("#94a3b8")
  createdAt DateTime @default(now()) @map("created_at")

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskTags TaskTag[]

  @@unique([userId, name])
  @@map("tags")
}

model TaskTag {
  taskId String @map("task_id") @db.Uuid
  tagId  String @map("tag_id") @db.Uuid

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
  @@map("task_tags")
}

// ===== Connections (外部ツール接続) =====
enum ConnectionKind {
  notion
  gsheet
}

model Connection {
  id             String         @id @default(uuid()) @db.Uuid
  userId         String         @map("user_id") @db.Uuid
  kind           ConnectionKind
  name           String
  isEnabled      Boolean        @default(true) @map("is_enabled")
  selfIdentifier String         @map("self_identifier")
  config         Json           @default("{}") // Notion: {databaseId}, GSheet: {spreadsheetId, sheet, columnMap}
  vaultSecretId  String         @map("vault_secret_id") // Supabase Vault の secret id
  lastSyncAt     DateTime?      @map("last_sync_at")
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  syncRecords SyncRecord[]
  syncRuns    SyncRun[]

  @@index([userId, kind])
  @@map("connections")
}

// ===== Sync Records (外部タスクとローカルの対応) =====
model SyncRecord {
  id                String    @id @default(uuid()) @db.Uuid
  connectionId      String    @map("connection_id") @db.Uuid
  externalId        String    @map("external_id")
  taskId            String    @unique @map("task_id") @db.Uuid
  externalUrl       String?   @map("external_url")
  externalUpdatedAt DateTime? @map("external_updated_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  connection Connection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  task       Task       @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([connectionId, externalId])
  @@map("sync_records")
}

// ===== Sync Runs (ジョブ実行履歴・進捗配信用) =====
enum SyncRunStatus {
  queued
  running
  succeeded
  failed
  cancelled
  partial
}

model SyncRun {
  id             String         @id @default(uuid()) @db.Uuid
  userId         String         @map("user_id") @db.Uuid
  connectionId   String?        @map("connection_id") @db.Uuid // null = 一括ジョブの親
  parentRunId    String?        @map("parent_run_id") @db.Uuid // 一括ジョブ配下の子
  status         SyncRunStatus  @default(queued)
  progress       Int            @default(0) // 0..100
  itemsTotal     Int            @default(0) @map("items_total")
  itemsProcessed Int            @default(0) @map("items_processed")
  cursor         String?        // 分割実行のための継続トークン
  errorMessage   String?        @map("error_message")
  startedAt      DateTime?      @map("started_at")
  finishedAt     DateTime?      @map("finished_at")
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")

  connection Connection? @relation(fields: [connectionId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([status])
  @@map("sync_runs")
}

// ===== Report Templates =====
enum ReportPeriod {
  today
  week
  month
  custom
}

model ReportTemplate {
  id        String       @id @default(uuid()) @db.Uuid
  userId    String       @map("user_id") @db.Uuid
  name      String
  period    ReportPeriod @default(today)
  body      String       @db.Text
  isDefault Boolean      @default(false) @map("is_default")
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("report_templates")
}

model ReportHistory {
  id           String    @id @default(uuid()) @db.Uuid
  userId       String    @map("user_id") @db.Uuid
  templateName String    @map("template_name")
  body         String    @db.Text
  periodStart  DateTime? @map("period_start") @db.Date
  periodEnd    DateTime? @map("period_end") @db.Date
  generatedAt  DateTime  @default(now()) @map("generated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, generatedAt])
  @@map("report_history")
}

// ===== User Settings =====
model UserSettings {
  userId    String   @id @map("user_id") @db.Uuid
  theme     String   @default("auto") // light / dark / auto
  locale    String   @default("ja")
  filters   Json     @default("{}")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

### 3.2 補助マイグレーション SQL

Prisma で表現できない以下を、生 SQL マイグレーションで補う。

```sql
-- 1) インボックスは1ユーザーに1つだけ
CREATE UNIQUE INDEX uniq_user_inbox_partial
  ON task_lists(user_id) WHERE is_inbox = true;

-- 2) tasks.search_vector の自動生成
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(memo,'')),  'B')
  ) STORED;
CREATE INDEX idx_tasks_search_vector ON tasks USING GIN (search_vector);

-- 3) Row Level Security
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_runs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON projects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own rows" ON task_lists
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own rows" ON tasks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- subtasks / task_tags は user_id を持たないため JOIN で制御
CREATE POLICY "own via task" ON subtasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "own via task" ON task_tags
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "own rows" ON tags
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own rows" ON connections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- sync_records は connection 経由でユーザーを判定
CREATE POLICY "own via connection" ON sync_records
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM connections WHERE connections.id = sync_records.connection_id AND connections.user_id = auth.uid()));

CREATE POLICY "own rows" ON sync_runs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own rows" ON report_templates
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own rows" ON report_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own row" ON user_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4) インボックス保護: 削除・リネーム禁止
CREATE OR REPLACE FUNCTION protect_inbox() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.is_inbox THEN
    RAISE EXCEPTION 'inbox cannot be deleted';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_inbox AND NEW.name <> OLD.name THEN
    RAISE EXCEPTION 'inbox cannot be renamed';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_inbox
BEFORE UPDATE OR DELETE ON task_lists
FOR EACH ROW EXECUTE FUNCTION protect_inbox();

-- 5) ステータスと isCompleted の整合性(二重保険)
CREATE OR REPLACE FUNCTION sync_task_completion() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' THEN NEW.is_completed := true;
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    NEW.status := 'not_started';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_task_completion
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION sync_task_completion();
```

### 3.3 主要な制約とその実装場所

| 制約 | 実装場所 |
|------|---------| 
| `(connectionId, externalId)` 一意 | Prisma `@@unique` + DB UNIQUE 制約 |
| インボックス 1 ユーザー 1 件 | 部分ユニーク INDEX |
| インボックス削除・リネーム禁止 | DB トリガー + Service 層 二重防御 |
| ステータス↔isCompleted 同期 | DB トリガー + Service 層 |
| ユーザー越境アクセス禁止 | RLS + Service 層 `where: { userId }` 強制 |
| シークレットを返さない | DTO 変換層で `vaultSecretId` を除外 |

---

## 4. API コントラクト

すべて Next.js Route Handlers (`app/api/**/route.ts`)。RSC + Server Actions も併用。
共通レスポンス規約：

```ts
// 成功
{ data: T }
// エラー
{ error: { code: string; message: string; details?: unknown } }
```

### 4.1 認証

| Method | Path | 説明 |
|---|---|---|
| POST | `/api/auth/magic-link` | Magic Link 送信（allowlist 検証込み） |
| GET  | `/api/auth/callback` | Supabase Auth コールバック |
| POST | `/api/auth/signout` | サインアウト |

### 4.2 Projects / Lists

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/projects` | プロジェクト一覧 |
| POST | `/api/projects` | 作成 `{name, color, icon?}` |
| PATCH | `/api/projects/:id` | 更新 |
| DELETE | `/api/projects/:id` | 削除（カスケード） |
| GET | `/api/projects/:id/lists` | リスト一覧 |
| POST | `/api/lists` | 作成 `{projectId, name}` |
| PATCH | `/api/lists/:id` | 更新（インボックス name 変更不可） |
| DELETE | `/api/lists/:id` | 削除（インボックス削除不可） |

### 4.3 Tasks

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/tasks?listId=&status=&tag=&dueRange=&q=&sort=&dir=&cursor=` | 一覧（カーソルページング、検索/フィルタ統合） |
| GET | `/api/tasks/today` | 本日の進捗ビュー (FR-06c) |
| POST | `/api/tasks` | 作成 |
| GET | `/api/tasks/:id` | 詳細 |
| PATCH | `/api/tasks/:id` | 部分更新（status, progress, workHoursByDate.YYYY-MM-DD 等） |
| DELETE | `/api/tasks/:id` | 削除 |
| POST | `/api/tasks/:id/move` | リスト移動 `{taskListId}` |
| POST | `/api/tasks/bulk-update` | 一括ステータス変更 |

### 4.4 Subtasks

| Method | Path | 説明 |
|---|---|---|
| POST | `/api/tasks/:id/subtasks` | 追加 |
| PATCH | `/api/subtasks/:id` | 更新 |
| DELETE | `/api/subtasks/:id` | 削除 |
| POST | `/api/subtasks/reorder` | 並び替え `{taskId, orderedIds}` |

### 4.5 Tags

| Method | Path | 説明 |
|---|---|---|
| GET / POST | `/api/tags` | 一覧 / 作成 |
| PATCH / DELETE | `/api/tags/:id` | 更新 / 削除 |
| POST | `/api/tasks/:id/tags` | 紐付け |
| DELETE | `/api/tasks/:id/tags/:tagId` | 解除 |

### 4.6 Connections

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/integrations/catalog` | カタログ（実装済み + Coming Soon） |
| GET | `/api/connections` | 一覧 |
| POST | `/api/connections` | 作成（シークレットは即 Vault 投入） |
| PATCH | `/api/connections/:id` | 編集（シークレット再送信時のみ Vault 更新） |
| DELETE | `/api/connections/:id` | 削除 |
| POST | `/api/connections/:id/test` | 疎通確認 |
| GET | `/api/connections/:id/gsheet-columns` | GSheet 列マッピング補助 |

### 4.7 OAuth (Google)

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/oauth/google/start?connectionDraftId=` | PKCE 生成 → Google 認可ページへ |
| GET | `/api/oauth/google/callback` | コード → トークン交換 → Vault 保存 |

### 4.8 Sync

| Method | Path | 説明 |
|---|---|---|
| POST | `/api/sync` | 一括同期キック → 親 `SyncRun` 作成、子 Run を順次起動 |
| POST | `/api/sync/:connectionId` | 単一接続の同期 |
| POST | `/api/sync/runs/:runId/cancel` | 進行中ジョブ中断 |
| POST | `/api/sync/runs/:runId/resume` | 分割実行の継続（cursor から再開、内部呼び出し用） |
| GET | `/api/sync/runs?limit=20` | 履歴 |
| POST | `/api/sync/runs/:runId/resolve-deletions` | 外部削除タスクへの判断 `{taskIds, action:"delete"\|"archive"}` |
| GET | `/api/cron/sync` | Vercel Cron 起動エンドポイント（`Authorization: Bearer ${CRON_SECRET}`） |

### 4.9 Reports

| Method | Path | 説明 |
|---|---|---|
| GET / POST | `/api/report-templates` | 一覧 / 作成 |
| PATCH / DELETE | `/api/report-templates/:id` | 更新 / 削除 |
| POST | `/api/reports/preview` | プレビュー `{templateId, periodStart?, periodEnd?}` |
| POST | `/api/reports/generate` | 生成 + 履歴保存 |
| GET | `/api/reports/history?templateName=&from=&to=` | 履歴一覧 |
| GET | `/api/reports/history/:id` | 履歴詳細 |

### 4.10 Backup

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/export` | 全データ JSON ダウンロード（トークン除外） |
| POST | `/api/import` | JSON インポート |

---

## 5. アーキテクチャ図

```
┌─────────────────────────── Browser (PC / Mobile) ────────────────────────────┐
│  Next.js App Router (Client)                                                  │
│  ├─ Server Components (一覧の初期描画)                                          │
│  ├─ Client Components (編集UI / shadcn/ui)                                     │
│  ├─ TanStack Query (cache / optimistic update)                                │
│  ├─ Zustand (UI state: 選択中タスク / モーダル開閉)                              │
│  └─ Supabase Realtime Client (tasks / subtasks / sync_runs 購読)               │
└────────────┬─────────────────────────────────────────┬──────────────────────-─┘
             │ HTTPS (RSC fetch / Server Actions / API)│ WSS (Realtime)
             ▼                                         ▼
┌────────────────────────────── Vercel ─────────────────────────────────────────┐
│  Next.js Server (Node Runtime)                                                 │
│  ├─ Route Handlers (/api/**)        ─── Zod 検証 → Service → Repository         │
│  ├─ Server Actions                  ─── 同上                                    │
│  ├─ Middleware: 認証ガード + allowlist 検証                                       │
│  ├─ Services: TaskService / SyncService / ReportService / VariableRenderer     │
│  ├─ Repositories: Prisma ベース                                                 │
│  ├─ Providers: NotionProvider / GSheetProvider (IntegrationProvider IF)        │
│  └─ Cron Handlers: GET /api/cron/sync (Vercel Cron が定期呼び出し)               │
│                                                                                │
│  Vercel Cron Scheduler ─── 定期的に /api/cron/sync を Bearer 認証で呼び出す      │
└─────────┬───────────────────────────────────────┬──────────────────────────────┘
          │ Prisma                                │ Vault RPC
          ▼                                       ▼
┌──────────────────── Supabase ────────────────────┐
│ Postgres (RLS 有効)                                │
│   ├ tables (projects, tasks, sync_runs, ...)      │
│   └ search_vector (tsvector + GIN)                │
│ Realtime (Postgres Changes)                       │
│ Auth (Magic Link)                                  │
│ Vault (pgsodium) ─── encrypted connection secrets │
└────────────────────────────────────────────────────┘
                       ▲
                       │ HTTPS
                       │
                Notion API / Google Sheets API（外部 SaaS）
```

### 5.1 楽観的 UI 更新フロー

```
[User clicks status dropdown "進行中"]
   ↓
Client: TanStack Query mutation
   ├─ onMutate: cache を即座に更新（UI即反映 200ms以内）
   ├─ fetch PATCH /api/tasks/:id { status: "in_progress" }
   │     Server: Zod → TaskService.updateStatus → Prisma → Postgres
   │     Postgres CDC → Supabase Realtime → 他端末へ push
   ├─ onError: cache ロールバック + Toast「保存失敗 リトライ」
   └─ onSettled: invalidateQueries(["tasks"])
```

### 5.2 同期ジョブのフロー（Vercel Cron + 自前 SyncRun）

```
[手動同期] POST /api/sync
[定期同期] Vercel Cron → GET /api/cron/sync (Bearer 認証)
   ↓
SyncService.startBulkSync(userId)
   ├─ 親 SyncRun(connectionId=null, status=queued) を作成
   ├─ 有効な connection を取得し、それぞれ子 SyncRun(queued) を作成
   └─ 子 SyncRun を「1接続ずつ順次」処理:
        ├─ 子 SyncRun を running に更新 → Realtime 配信
        ├─ Vault から credentials を復号
        ├─ Provider.fetchAssignedTasks(cursor) を呼び出し
        │   - Notion: 3 req/sec RateLimiter
        │   - GSheet: 60 req/min RateLimiter
        │   - Exponential Backoff リトライ
        ├─ 取得タスクを upsert: (connectionId, externalId) でユニーク判定
        │   - 新規 → インボックスへ追加
        │   - 既存 → タイトル・メモ・期限を上書き、status/progress は保持
        │   - 外部側削除分は別途記録（resolve-deletions API で処理）
        ├─ itemsProcessed / progress を更新 → Realtime 配信
        └─ 50秒経過時点で未完了なら:
             - cursor を SyncRun.cursor に保存
             - status は running のまま終了
             - 続きは「/api/sync/runs/:runId/resume」で再開
               (起動側: 手動同期はクライアントが再呼び出し、定期同期は次回 Cron が拾う)
   ↓
全子 Run 完了で親 Run を succeeded / partial / failed に確定
最終同期日時とサマリーを UI のフッターに表示 (Realtime)
```

#### 60秒制限への対応設計

- 各子 `SyncRun` は **最大 50 秒で自主終了**（Vercel 上限 60 秒の安全マージン）
- 続きは `cursor` カラムに保存し、次回起動で `resume` する
- 一度の Cron 起動で処理しきれない場合は、次回の Cron で queued / running(中断) 状態の Run を拾って継続
- 並列化はしない（複雑度を抑え、レート制限を超えにくくする）

### 5.3 エラーハンドリング戦略

| 層 | 戦略 |
|----|------|
| View | TanStack Query の `onError` で Toast 表示。永続失敗時のみ Sentry へ |
| Route Handler | `try/catch` で `AppError` に変換し `{error}` レスポンスを返す |
| Service | `ValidationError` / `NotFoundError` / `ExternalApiError` / `RateLimitError` の具体型 |
| Provider | HTTP エラーは `ExternalApiError`、レート制限は `RateLimitError`（リトライ可能） |
| Sync ジョブ | 接続単位で失敗を許容（partial 状態）。成功分はロールバックしない |
| ログ | `pino` で JSON 構造化、トークン・個人情報は自動マスク |

---

## 6. レイヤー構成とディレクトリ構造

### 6.1 採用パターン

**MVVM + Repository + Service Layer**（macOS 版から踏襲、Next.js 文脈に合わせて調整）

| レイヤー | 責務 | 禁止事項 |
|---------|------|---------| 
| View (Server / Client Component) | 表示と入力イベント発火 | Prisma 直接アクセス禁止、API 呼び出しは hook 経由 |
| Hook (TanStack Query / Zustand) | 画面状態保持、API 呼び出し | UI ロジックを内部に閉じない |
| Route Handler / Server Action | Zod 検証 → Service 呼び出し → DTO 整形 | ビジネスロジック禁止 |
| Service | 複数 Repository / Provider の協調、ユースケース | View / Hook への参照禁止 |
| Repository | Prisma のラッパー（ユーザー越境チェック含む） | ビジネスロジック禁止 |
| IntegrationProvider | 外部ツール固有の API 実装 | 直接 DB 操作禁止 |

依存方向（一方向のみ）：

```
View → Hook → Route Handler / Server Action → Service → Repository → Prisma
                                                     ↘ IntegrationProvider → HTTPClient / Vault
```

### 6.2 ディレクトリ構造

```
src/
├─ app/
│   ├─ (auth)/login/page.tsx               # Magic Link 入力 (Server Component)
│   ├─ (app)/                              # 認証必須レイアウト
│   │   ├─ layout.tsx                      # 認証ガード + Sidebar
│   │   ├─ today/page.tsx                  # FR-06c 本日の進捗
│   │   ├─ inbox/page.tsx
│   │   ├─ projects/[id]/lists/[listId]/page.tsx
│   │   ├─ search/page.tsx
│   │   ├─ reports/
│   │   │   ├─ page.tsx                    # 生成
│   │   │   ├─ templates/page.tsx
│   │   │   └─ history/page.tsx
│   │   └─ settings/
│   │       ├─ integrations/page.tsx       # カタログ
│   │       ├─ connections/[id]/page.tsx
│   │       └─ tags/page.tsx
│   ├─ api/                                # §4 の API
│   │   ├─ auth/
│   │   ├─ projects/
│   │   ├─ tasks/
│   │   ├─ subtasks/
│   │   ├─ tags/
│   │   ├─ connections/
│   │   ├─ oauth/google/
│   │   ├─ sync/
│   │   ├─ cron/sync/                      # Vercel Cron エンドポイント
│   │   ├─ report-templates/
│   │   ├─ reports/
│   │   ├─ export/
│   │   └─ import/
│   └─ middleware.ts                       # 認証 + allowlist
├─ components/                             # 純粋 UI (shadcn ベース)
│   ├─ ui/                                 # shadcn 生成物
│   ├─ tasks/TaskRow.tsx
│   ├─ tasks/TaskStatusDropdown.tsx
│   └─ reports/TemplateEditor.tsx
├─ features/                               # 機能ドメイン (View + Hook)
│   ├─ tasks/
│   │   ├─ hooks/useTasksQuery.ts
│   │   └─ hooks/useUpdateTaskMutation.ts
│   ├─ sync/
│   │   └─ hooks/useSyncRun.ts             # Realtime 購読
│   └─ reports/
├─ server/                                 # サーバー専用 (import 'server-only')
│   ├─ services/
│   │   ├─ TaskService.ts
│   │   ├─ SyncService.ts
│   │   ├─ ReportService.ts
│   │   └─ VariableRenderer.ts             # {{...}} 展開
│   ├─ repositories/
│   │   ├─ TaskRepository.ts
│   │   ├─ ConnectionRepository.ts
│   │   └─ SyncRunRepository.ts
│   ├─ integrations/
│   │   ├─ IntegrationProvider.ts          # IF
│   │   ├─ NotionProvider.ts
│   │   ├─ GSheetProvider.ts
│   │   └─ RateLimiter.ts                  # token bucket
│   ├─ auth/
│   │   ├─ supabase.ts
│   │   └─ allowlist.ts
│   ├─ vault/EncryptedSecrets.ts           # Supabase Vault ラッパ
│   ├─ cron/                               # Vercel Cron 用ハンドラ
│   │   └─ syncCron.ts
│   └─ db/prisma.ts
├─ lib/
│   ├─ schemas/                            # Zod (クライアント・サーバー共用)
│   ├─ utils/dates.ts
│   └─ utils/markdown.ts
└─ styles/globals.css
```

### 6.3 ファイルサイズ規約

- 通常: 200〜400 行
- 上限: 800 行（超えたら機能別に分割）
- 関数: 50 行以内

---

## 7. セキュリティ設計

### 7.1 認証 / アクセス制御

- Supabase Auth Magic Link
- `middleware.ts` で `(app)` 配下と `/api/*`（auth 系を除く）にセッション必須
- `server/auth/allowlist.ts` で `process.env.ALLOWED_EMAILS.split(",")` に含まれるメールのみ許可（R1 対策）
- Magic Link 送信前 / コールバック後の二段階で allowlist 検証
- セッションは Supabase の HTTP-Only Cookie（SameSite=Lax, Secure）

### 7.2 Row Level Security (RLS)

- 全業務テーブルで `user_id = auth.uid()` のポリシーを必須化
- Prisma はサービスロールキーを使うため、**Service レイヤーで必ず `where: { userId }` を強制**
- `withUser(handler)` HOF で Service 関数の第一引数を `(ctx: { userId })` に統一

### 7.3 シークレット管理 (Q7)

- 接続作成時: `vault.create_secret(plaintext)` で Vault に格納、返却された `secret_id` を `connections.vault_secret_id` に保存
- 復号は同期ジョブ実行時のみ `vault.decrypted_secrets` ビューから取得
- クライアントへ返却する `Connection` DTO は `vaultSecretId` を必ず除外
- OAuth `client_secret` / Notion 用テンプレ：`process.env.GOOGLE_CLIENT_SECRET` 等、サーバー側のみ参照

### 7.4 HTTPS / トランスポート

- Vercel デフォルトで HTTPS 強制
- 外部 API 通信も HTTPS のみ（Provider 実装内で `https:` 以外を弾くガード）

### 7.5 入力検証

- すべての Route Handler / Server Action は冒頭で Zod パース
- 失敗時は `400 { error: { code: "validation_error", details } }`
- ID は UUID 形式、`progress` は `z.number().int().min(0).max(100)` 等

### 7.6 OAuth (Google) フロー

- `state` + `code_verifier`（PKCE）を HTTP-Only Cookie に保存
- `state` 検証失敗時は拒否
- リダイレクト URI は `${APP_BASE_URL}/api/oauth/google/callback` のみホワイトリスト
- スコープは最小: `https://www.googleapis.com/auth/spreadsheets.readonly`
- アクセストークン + リフレッシュトークンを Vault へ

### 7.7 レート制限・乱用対策

- 同一ユーザーで同時実行中の親 SyncRun は 1 つに制限（Service 層で running を判定）
- 外部 API 側: `RateLimiter`（token bucket）で Notion 3 req/sec、GSheet 60 req/min
- Cron エンドポイントは `Authorization: Bearer ${CRON_SECRET}` で保護

### 7.8 監査ログ

- `audit_log` テーブルを任意で追加
- 記録対象: `connection.create` / `connection.delete` / `oauth.granted` / `import.executed` / `export.executed`
- ログにトークン本文は含めない（接続名と種別のみ）

### 7.9 XSS / CSRF

- Server Actions は CSRF トークン同梱（Origin 検証）
- Markdown レンダリング時は DOMPurify でサニタイズ

### 7.10 ログ

- `pino` で JSON 構造化
- トークン・個人情報はマスク（ロガーミドルウェアで `Authorization` 等を自動除去）

---

## 8. パフォーマンス設計

| 要件 | 設計 |
|------|------|
| 初回ページロード LCP p95 < 2.5s | Server Components で初回 HTML を SSR、Hydration 後に Realtime 接続開始 |
| ページ間ナビゲーション p95 < 300ms | Next.js のクライアントナビゲーション + Prefetch |
| タスク一覧描画 1,000 件 | `@tanstack/react-virtual` で仮想スクロール |
| 全文検索 5,000 件 p95 < 300ms | Postgres `tsvector` GIN + `websearch_to_tsquery` |
| 同期処理 100 タスク 5 秒以内 | RateLimiter + バッチ upsert（Provider 単位の最適化） |
| API レスポンス CRUD p95 < 200ms | Prisma の効率的クエリ、index 最適化 |
| 楽観的 UI 更新 | TanStack Query `onMutate` で API レスポンス前に反映 |
| ページネーション | カーソルベース (`created_at, id`) |

---

## 9. 開発・運用

### 9.1 環境変数

| 変数 | 用途 |
|------|------|
| `DATABASE_URL` | Prisma 接続（Supabase Pooler 経由） |
| `DIRECT_URL` | Prisma migrate 用（Supabase Direct） |
| `SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_ANON_KEY` | クライアント用 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー側 Vault / 管理操作用 |
| `ALLOWED_EMAILS` | カンマ区切りメールアドレス allowlist |
| `APP_BASE_URL` | OAuth リダイレクト URI 構築用 |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `CRON_SECRET` | Vercel Cron 認証用 Bearer トークン |
| `SENTRY_DSN` | Sentry（任意） |

### 9.2 Vercel Cron 設定（`vercel.json`）

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

- 30 分ごとに `/api/cron/sync` を起動（個人利用前提のスケジュール、後で調整可）
- ハンドラ側で `Authorization: Bearer ${CRON_SECRET}` を検証
- 進行中（running）または queued の SyncRun を拾って継続処理

### 9.3 バックアップ

- Supabase Free のバックアップ機能 + JSON エクスポート（FR-12）で二重化
- 将来は GitHub Actions で日次ダンプを取得する任意の運用を検討

### 9.4 CI

- GitHub Actions: `pnpm typecheck && pnpm lint && pnpm test && pnpm prisma migrate deploy`
- E2E（Playwright）は主要フローのみ（インボックス・本日ビュー・レポート生成）

### 9.5 デプロイ

- `develop` → Vercel Preview
- `main` → Vercel Production
- マイグレーションは Vercel デプロイ前に手動 or CI で `prisma migrate deploy`

### 9.6 監視・観測性

- Vercel Analytics 標準
- Sentry は MVP では任意（必要に応じて後追い）
- 同期ジョブの実行履歴は `sync_runs` テーブルで参照可能

### 9.7 将来の移行ポイント

| トリガー | 移行先 |
|---------|------|
| 接続数が増え順次実行で間に合わない | Inngest 導入（Service 層の起動部分のみ差し替え） |
| 同時ユーザー対応 | allowlist を解除、Auth プロバイダ追加 |
| 検索が遅くなる | `pg_bigm` 拡張 or Meilisearch 連携 |
| バックアップ要件強化 | Supabase Pro（PITR）へアップグレード |

---

## 10. 関連ドキュメント

- 要件定義: `docs/REQUIREMENTS.md` v2.0.0-saas
- プロジェクト指示: `CLAUDE.md`
- アーキテクチャ規約: `.claude/rules/architecture.md`
