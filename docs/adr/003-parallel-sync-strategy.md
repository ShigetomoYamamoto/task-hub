# ADR-003: 並列同期戦略（async/await TaskGroup）

**ステータス**: accepted

**日付**: 2026-05-23

## コンテキスト

複数接続から並列にタスクを取得する必要がある。Notion 3 req/sec のレート制限、部分失敗の許容、ユーザーによる中断、進捗報告のリアルタイム性が要求される。

## 検討した選択肢

1. **Swift Concurrency の `withTaskGroup`** — 構造化並行性で自動キャンセル伝播
2. **DispatchQueue + GCD** — レガシー、async/await との統合が煩雑
3. **Combine Publisher（zip/merge）** — 中断・部分失敗の表現が複雑
4. **逐次実行（for-await）** — シンプルだが遅い（10接続 × 5秒 = 50秒）

## 決定

**Swift Concurrency の `withTaskGroup`** で接続ごとに独立 Task を起動。各接続内のリクエストは `RateLimiter` actor で逐次化、リトライは Exponential Backoff。

```swift
await withTaskGroup(of: SyncResult.self) { group in
    for connection in enabledConnections {
        group.addTask { /* 独立実行 */ }
    }
}
```

## 結果

**Positive:**
- 構造化並行性で自動キャンセル伝播（中断ボタンが全 Task を停止）
- actor によりレート制限ロジックを安全に共有
- 1接続失敗が他に伝播しない（部分失敗の自然な表現）

**Negative:**
- 接続数が多いと一時的なメモリ・CPU スパイク（最大10接続想定なら問題なし）

## コード検証

`SyncService` は `actor` として宣言する。`RateLimiter` も `actor` として実装する。
