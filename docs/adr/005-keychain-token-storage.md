# ADR-005: リアルタイム同期方式（Supabase Realtime を採用）

**ステータス**: accepted

**日付**: 2026-05-25

## コンテキスト

PC ↔ スマホ間のリアルタイムデータ同期と、同期ジョブ進捗のクライアントへの配信が必要（REQUIREMENTS.md Q2）。

## 検討した選択肢

1. **Supabase Realtime（Postgres Changes）** — Supabase に内蔵。テーブル変更をリアルタイムで配信
2. **Server-Sent Events（SSE）** — 自前実装。サーバーレス（Vercel）では接続維持が困難
3. **ポーリング（1〜5秒間隔）** — シンプルだが余計なリクエストと遅延が発生
4. **WebSocket + 自前サーバー** — Vercel Hobby ではサーバー常駐プロセス不可

## 決定

**Supabase Realtime（Postgres Changes）を採用**。Supabase クライアントからテーブル変更を購読し、変更があればクライアント側で再フェッチする。

同期進捗（SyncRun の progress フィールド更新）も Realtime で配信。

## 結果

**Positive:**
- Supabase を既に採用しているため追加コストなし
- テーブル変更を DB レベルで検知（アプリ層の実装が不要）
- RLS と組み合わせることでユーザーごとの購読を安全に実現

**Negative:**
- Supabase Realtime の接続数制限（Free Tier: 200 concurrent realtime connections）— 個人利用では問題なし
- クライアントが Supabase JS SDK に依存

## コード検証

Realtime 購読は `src/features/*/hooks/use*.ts` の TanStack Query `invalidateQueries` と連携する。
