# ADR-001: SwiftData vs Core Data

**ステータス**: accepted

**日付**: 2026-05-23

## コンテキスト

全データのローカル永続化が必要。エンティティ数は 9（Project / TaskList / Task / Subtask / Tag / Connection / SyncRecord / ReportTemplate / ReportHistory）。最大 10,000 タスクで快適動作要求。

当初要件（v1.2.0）では最低 OS を macOS 13 Ventura としていたが、SwiftData は macOS 14 Sonoma 以降のみ対応のため、要件を改訂（v1.3.0）。

## 検討した選択肢

1. **SwiftData** — `@Model` マクロで宣言的スキーマ定義。SwiftUI との統合が良好
2. **Core Data** — macOS 13 で動作するが NSManagedObject の冗長性が高い
3. **GRDB.swift（SQLite ラッパー）** — SQL 直書きで柔軟だが自前実装コストが高い
4. **Realm** — 第三者依存、Universal Binary・未署名配布での挙動が不確実

## 決定

**SwiftData を採用**。最低 OS を macOS 14.2 Sonoma に改訂することを前提とする。

## 結果

**Positive:**
- `@Model` マクロでボイラープレート削減
- SwiftUI の `@Query` で自動更新
- マイグレーション API がシンプル
- 将来の CloudKit 連携にも拡張容易

**Negative:**
- macOS 13 Ventura 非対応（要件改訂で解決）
- 複合一意制約が直接サポートされない → `(connectionId, externalId)` はアプリ層で強制
- macOS 14.0 にバグ報告あり → 最低 14.2 推奨

## コード検証

`.github/scripts/audit-custom.sh` の CHECK 2 で ModelContext 直接アクセスを検知する。
