# ADR-004: バックグラウンドジョブ基盤（Vercel Cron + SyncRun テーブルを採用）

**ステータス**: accepted

**日付**: 2026-05-25

## コンテキスト

同期処理（FR-15）はサーバー側で実行するバックグラウンドジョブが必要。Vercel Hobby の関数実行上限が 60 秒のため、複数接続の同期は工夫が必要。

## 検討した選択肢

1. **Vercel Cron + 自前 SyncRun テーブル** — Vercel Hobby で無料利用可能。50s で自主終了し cursor で再起動して継続
2. **Inngest** — イベント駆動ジョブ基盤。Vercel Hobby の無料枠では制約あり（Vercel Integration が必要）
3. **QStash（Upstash）** — HTTP キューイング。設定が複雑、追加費用が発生する可能性
4. **GitHub Actions（cron）** — 外部から API を叩く構成。セキュリティ上の懸念

## 決定

**Vercel Cron + 自前 SyncRun テーブルを採用**（Inngest は MVP では不採用）。
SyncRun に `cursor` フィールドを持ち、50秒で自主終了して次の Cron 起動で再開する設計。

```
SyncRun: { status: "running" | "completed" | "failed", cursor: string | null, progress: JSON }
```

## 結果

**Positive:**
- Vercel Hobby 無料枠で動作
- Cron ジョブの履歴・進捗を DB で管理できる
- cursor で冪等な再起動が可能
- Supabase Realtime で進捗をクライアントにリアルタイム配信可能

**Negative:**
- Vercel Hobby の Cron 最小実行間隔は1分（高頻度ジョブ不可）
- 手動同期は Cron ではなくボタン押下から Route Handler を直接呼び出すため、60秒制限への対応が必要

## コード検証

`src/server/cron/syncJob.ts` が 50秒で自主終了して cursor を保存することを単体テストで確認する。
