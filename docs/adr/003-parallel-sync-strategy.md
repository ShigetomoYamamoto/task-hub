# ADR-003: ORM 選定（Prisma を採用）

**ステータス**: accepted

**日付**: 2026-05-25

## コンテキスト

Supabase Postgres への型安全なアクセス手段が必要。Next.js App Router + TypeScript との統合、マイグレーション管理、開発体験を重視。

## 検討した選択肢

1. **Prisma 5** — スキーマファースト・型安全・マイグレーション管理が充実。Next.js との実績が豊富
2. **Drizzle ORM** — 軽量・SQL ライク・型安全。Prisma より新しく実績が少ない
3. **Kysely（クエリビルダー）** — 型安全だがスキーマ管理は自前
4. **node-postgres（生 SQL）** — 最大限の柔軟性だが型安全性ゼロ、マイグレーション管理が煩雑

## 決定

**Prisma 5 を採用**。`DATABASE_URL`（Pooler）+ `DIRECT_URL`（マイグレーション用）の二 URL 構成で Supabase Pooler と共存。

## 結果

**Positive:**
- `prisma migrate dev` でマイグレーション管理が一元化
- Prisma Client の型が DB スキーマから自動生成
- Prisma Studio で開発中の DB 確認が容易
- Next.js Route Handlers（Node Runtime）で安定動作

**Negative:**
- Edge Runtime では動作しない → 全 Route Handler を Node Runtime で固定
- コールドスタートで Prisma Client 初期化コストあり → singleton パターンで対応

## コード検証

`.claude/rules/architecture.md` でレイヤー責務を明記。Repository のみが Prisma に直接アクセス可能。
