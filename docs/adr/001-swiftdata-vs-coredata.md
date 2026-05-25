# ADR-001: クラウド DB・認証基盤の選定（Supabase を採用）

**ステータス**: accepted

**日付**: 2026-05-25

## コンテキスト

SaaS 版への方針転換（v2.0.0-saas）に伴い、クラウド DB・認証・リアルタイム・シークレット管理を提供するバックエンド基盤が必要になった。個人利用・シングルユーザー・無料枠優先。

## 検討した選択肢

1. **Supabase** — Postgres + Auth + Realtime + Vault を単一プラットフォームで提供。Free Tier あり
2. **Firebase / Firestore** — NoSQL のみ、リレーショナルデータに不向き。Prisma 非対応
3. **PlanetScale + NextAuth** — Postgres 非対応（MySQL 互換）。Auth が別サービスで複雑化
4. **Neon + Clerk** — サービスが分散し環境変数・設定が増加。Realtime は自前実装が必要

## 決定

**Supabase を採用**。Postgres + Magic Link Auth + Postgres Changes (Realtime) + Vault (pgsodium) をすべて Supabase Free Tier で賄える。

## 結果

**Positive:**
- 単一プラットフォームで DB・Auth・Realtime・Vault をすべてカバー
- Prisma との組み合わせで型安全な DB アクセス
- Row Level Security (RLS) でデータ分離
- Vercel Hobby との相性が良い

**Negative:**
- Supabase Free Tier: 1週間非活性で一時停止（個人利用でも注意が必要）
- Realtime は Supabase インフラ依存のため障害時に影響あり

## コード検証

`.github/scripts/audit-custom.sh` の CHECK 1-4 でセキュリティ要件を継続検証する。
