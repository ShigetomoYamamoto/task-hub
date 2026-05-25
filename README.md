# TaskHub

個人向けタスク管理 SaaS。Notion・Google スプレッドシート・JIRA のタスクを一元集約し、日報・作業報告を自動生成する。

---

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | 要件定義書 v2.0.0-saas |
| [docs/DESIGN.md](docs/DESIGN.md) | 設計書（DB スキーマ・API・アーキテクチャ・セキュリティ） |
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | 実装計画（Phase 0〜6） |
| [CLAUDE.md](CLAUDE.md) | AI エージェント向けプロジェクト規約 |

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| 言語 | TypeScript 5.x |
| フレームワーク | Next.js 15 App Router (RSC + Server Actions) |
| UI | shadcn/ui + Tailwind CSS |
| 状態管理 | TanStack Query + Zustand |
| フォーム/バリデーション | React Hook Form + Zod |
| ORM | Prisma 5 |
| DB / Auth / Realtime / Vault | Supabase (Postgres + Magic Link + Postgres Changes + pgsodium) |
| バックグラウンドジョブ | Vercel Cron |
| デプロイ | Vercel Hobby |
| テスト | Vitest + Playwright + Testing Library |
| Lint / Format | Biome |

---

## セットアップ

### 1. Supabase プロジェクトの作成

1. [supabase.com](https://supabase.com) で新規プロジェクトを作成
2. **Authentication → Providers** で Email（Magic Link）を有効化。パスワード認証は無効化
3. **Database → Extensions** で `pgsodium` を有効化（Vault 機能）
4. **Settings → Database** から以下を取得:
   - `DATABASE_URL`（Pooler / Transaction mode）
   - `DIRECT_URL`（Direct connection）
5. **Settings → API** から以下を取得:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

`.env.local` を作成して以下を設定:

| 変数名 | 説明 |
|-------|------|
| `DATABASE_URL` | Supabase Pooler URL（Prisma 用） |
| `DIRECT_URL` | Supabase Direct URL（マイグレーション用） |
| `SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_ANON_KEY` | Supabase Anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role キー（サーバーサイドのみ） |
| `ALLOWED_EMAILS` | アクセス許可するメールアドレス（カンマ区切り） |
| `APP_BASE_URL` | アプリの公開 URL（例: `http://localhost:3000`） |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアント ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット |
| `CRON_SECRET` | Vercel Cron 認証トークン |

### 4. DB マイグレーションの実行

```bash
pnpm prisma migrate dev
```

### 5. 開発サーバーの起動

```bash
pnpm dev
```

http://localhost:3000 にアクセス。

---

## 開発コマンド

```bash
pnpm dev            # 開発サーバー起動
pnpm build          # プロダクションビルド
pnpm test           # Vitest でユニット/統合テスト実行
pnpm test:e2e       # Playwright で E2E テスト実行
pnpm typecheck      # TypeScript 型チェック
pnpm lint           # Biome Lint
pnpm format         # Biome フォーマット
pnpm prisma studio  # Prisma Studio（DB GUI）
```

---

## スラッシュコマンド（Claude Code）

| コマンド | 役割 |
|---------|------|
| `/plan` | 実装計画の立案 |
| `/tdd` | テスト駆動開発で実装 |
| `/code-review` | コードレビュー |
| `/commit` | Conventional Commits 形式でコミット |
| `/create-pr` | PR 作成（base: develop） |
| `/precommit-check` | Biome・型チェック・テスト・カバレッジ確認 |
| `/implement-feature` | 仕様確認 → TDD → 実装 → レビュー → コミット |

詳細は [CLAUDE.md](CLAUDE.md) を参照。

---

## ライセンス

Private — 個人利用のみ。
