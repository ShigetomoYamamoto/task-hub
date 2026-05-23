# アーキテクチャルール（TaskHub）

## 採用パターン: MVVM + Repository + Service Layer

DESIGN.md Phase 3.1 で決定済み。ADR-002 参照。

## レイヤー責務

| レイヤー | 責務 | 禁止事項 |
|---------|------|---------|
| View | 表示と入力イベント発火のみ | ModelContext 直接アクセス禁止、API 呼び出し禁止 |
| ViewModel (@Observable) | 画面状態保持、Service 呼び出し | URLSession 直接呼び出し禁止 |
| Service (actor) | 複数 Repository/Provider の協調 | View への直接参照禁止 |
| Repository | SwiftData ModelContext のラッパー | ビジネスロジック禁止 |
| IntegrationProvider | 外部ツール固有の API 実装 | LocalTask の直接操作禁止 |

## 依存の方向（一方向のみ）

View → ViewModel → Service → Repository → SwiftData
                            → IntegrationProvider → HTTPClient / KeychainStore

逆方向の依存は禁止（Repository が ViewModel を参照するなど）。

## ファイルサイズ規約

- 通常: 200-400 行
- 上限: 800 行（超えたら機能別に分割）
- 関数: 50 行以内

## actor の使い所

SyncService・RateLimiter は actor として宣言する。並行アクセスが発生する共有状態には必ず actor を使う。

## SwiftData の重要制約

- (connectionId, externalId) の複合ユニーク制約はアプリ層で強制
- インボックス (isInbox == true の TaskList) は削除・リネーム禁止をアプリ層で強制
- ModelContext への直接アクセスは Repository 内のみ
