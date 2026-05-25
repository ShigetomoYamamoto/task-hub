# task-hub — CLAUDE.md

## ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/REQUIREMENTS.md` | 要件定義書 v2.0.0-saas（FR-01〜FR-22、承認済み） |
| `docs/DESIGN.md` | 設計書 v2.0.0-saas（技術スタック・DB スキーマ・API・アーキテクチャ・セキュリティ） |
| `docs/IMPLEMENTATION_PLAN.md` | 実装計画書 v1.1.0（Phase 0〜6、モック版 UI フェーズ含む） |
| `docs/conventions.md` | 命名規則・コーディング規約（TypeScript / Next.js スタイル） |
| `docs/adr/` | 設計上の重要判断の記録（ADR-001〜ADR-005 は DESIGN.md §2 に記載） |
| `docs/CODEMAPS/` | ファイル責務一覧 |

**実装前に必ず `docs/REQUIREMENTS.md` と `docs/DESIGN.md` を読むこと。**

---

## 技術スタック

- **言語**: TypeScript 5.x
- **フレームワーク**: Next.js 15 App Router（RSC + Server Actions）
- **UI**: shadcn/ui（Radix UI + Tailwind CSS）
- **状態管理**: TanStack Query（サーバー状態）+ Zustand（UI 状態）
- **フォーム / バリデーション**: React Hook Form + Zod
- **ORM**: Prisma 5
- **DB / Auth / Realtime / Vault**: Supabase（Postgres + Magic Link + Postgres Changes + pgsodium）
- **バックグラウンドジョブ**: Vercel Cron + 自前 SyncRun テーブル
- **デプロイ**: Vercel Hobby
- **テスト**: Vitest + Playwright + Testing Library
- **Lint / Format**: Biome

---

## アーキテクチャ（DESIGN.md §6 参照）

```
View (Server / Client Component)
  ↓ TanStack Query / Zustand
Hook
  ↓ fetch
Route Handler / Server Action  ← Zod 検証
  ↓
Service  ←→  IntegrationProvider
  ↓                ↓
Repository      HTTPClient / Vault
  ↓
Prisma → Supabase Postgres (RLS)
```

**レイヤー責務**（詳細は `.claude/rules/architecture.md`）：
- View：表示と入力イベント発火のみ（Prisma 直接アクセス禁止）
- Hook：画面状態保持・API 呼び出し（TanStack Query mutation / query）
- Route Handler / Server Action：Zod 検証 → Service 呼び出し → DTO 整形
- Service：複数 Repository / Provider を協調させるユースケース
- Repository：Prisma のラッパー（`where: { userId }` を必ず強制）
- IntegrationProvider：外部ツール固有の API 実装

---

## ドメインエンティティ（DESIGN.md §3 参照）

- **User** — Supabase `auth.users` と 1:1（RLS の起点）
- **Project** — プロジェクト（カスケード削除: TaskList → Task → Subtask）
- **TaskList** — リスト（`isInbox: true` の固定インボックスを含む）
- **Task** — タスク（`workHoursByDate` は JSONB `{ "YYYY-MM-DD": number }`）
- **Subtask** — サブタスク（title + isCompleted）
- **Tag** — タグ（Task と多対多 via TaskTag）
- **Connection** — 外部ツール接続（認証情報は Supabase Vault に保管）
- **SyncRecord** — 外部タスクとローカル Task の対応記録（`(connectionId, externalId)` 複合ユニーク）
- **SyncRun** — 同期ジョブ実行履歴・進捗配信用（`cursor` で 60 秒制限対応）
- **ReportTemplate** — レポートテンプレート（`{{変数}}` プレースホルダー形式）
- **ReportHistory** — 生成済みレポート履歴

---

## ユーザーロール

Magic Link 認証（Supabase Auth）+ ALLOWED_EMAILS allowlist による個人限定アクセス。
シングルユーザー・マルチデバイス（PC / スマホ）。

---

## 絶対に守るルール

1. **実装前に REQUIREMENTS.md と DESIGN.md を必ず読む**
2. **イミュータブル優先**：値を直接変更せず、新しい値を作る
3. **複合ユニーク制約はアプリ層でも強制**：`(connectionId, externalId)` の重複チェックを登録前に必ず実行
4. **インボックスは削除・リネーム禁止**：`isInbox == true` の TaskList はアプリ層で保護（DB トリガーと二重防御）
5. **認証情報は Supabase Vault のみ**：DB / localStorage / Cookie への平文保存は厳禁
6. **HTTPS 限定**：HTTP 通信は禁止。Provider 内で `https:` 以外を弾くガードを必ず入れる
7. **レート制限を守る**：Notion 3 req/sec、Google Sheets 60 req/min を `RateLimiter` で制御
8. **エラーは境界でキャッチ**：Route Handler / Service 層でハンドリングし View まで伝播させない
9. **テストファースト（TDD）**：RED → GREEN → REFACTOR の順序を厳守
10. **シークレットをコードにハードコードしない**：API トークン・OAuth Client Secret は環境変数のみ
11. **`any` 型の濫用禁止**：型が不明な場合は `unknown` + 型ガードを使う
12. **1タスク = 1機能**：スコープを超えたリファクタリング・機能追加をしない
13. **DTO で `vaultSecretId` を必ず除外**：Connection レスポンスにシークレット ID を含めない
14. **全 Route Handler は冒頭で Zod パース**：バリデーション失敗時は `400 { error }` を返す

---

## 技術制約

- Next.js Route Handlers は Node Runtime（Edge Runtime では Prisma 動作不可）
- Vercel Hobby の関数実行上限 60 秒 → SyncRun は 50 秒で自主終了し cursor で継続
- MVP は読み取り専用の単方向同期（外部ツールへの書き戻しなし）
- 自動同期・プッシュ通知・PWA オフライン・カレンダー連携は対象外

---

## スラッシュコマンド

### 全自動モード（要件 → デプロイ）

| コマンド | 役割 |
|---------|------|
| `/requirements` | 要件分析（曖昧な要望を構造化要件に変換） |
| `/design` | システム設計（アーキテクチャ・DB スキーマ・技術選定） |
| `/plan` | 実装計画 |
| `/tdd` | テスト駆動開発で実装 |

### サポートモード（タスク → PR）

| コマンド | 役割 |
|---------|------|
| `/analyze-task` | タスク・課題・バグ報告を実装可能な単位に分解 |
| `/plan` | 実装計画 |
| `/tdd` | テスト駆動開発で実装 |
| `/respond-review` | PR レビューコメントへの対応 |

### 共通

| コマンド | 役割 |
|---------|------|
| `/code-review` | コードレビュー |
| `/commit` | Conventional Commits 形式でコミット |
| `/create-pr` | PR 作成（base は develop 固定） |
| `/build-fix` | ビルド・型エラーの修正 |
| `/e2e` | Playwright E2E テスト生成・実行 |
| `/update-docs` | ドキュメント同期 |
| `/update-codemaps` | コードマップ更新 |

### プロジェクト固有

| コマンド | 役割 |
|---------|------|
| `/precommit-check` | Biome・型チェック・テスト・カバレッジ確認を順番に実行 |
| `/audit-custom` | プロジェクト固有の静的解析を実行 |
| `/implement-feature` | 仕様確認 → TDD → 実装 → レビュー → コミットを一気通貫で実行 |
| `/spec` | 実装前に仕様書の該当箇所を読んで整理 |
