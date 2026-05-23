# task-hub — CLAUDE.md

## ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/REQUIREMENTS.md` | 要件定義書 v1.2.0（FR-01〜FR-22、承認済み） |
| `docs/DESIGN.md` | 設計書 v1.0.0（アーキテクチャ・データモデル・インテグレーション・レポートエンジン） |
| `docs/conventions.md` | 命名規則・コーディング規約（Swift スタイル） |
| `docs/adr/` | 設計上の重要判断の記録（ADR-001〜ADR-005 は DESIGN.md Phase 4 に記載） |
| `docs/CODEMAPS/` | ファイル責務一覧 |
| `docs/playbooks/` | 開発標準手順書 |

**実装前に必ず `docs/REQUIREMENTS.md` と `docs/DESIGN.md` を読むこと。**

---

## 技術スタック

- **言語**: Swift 5.9+
- **UI フレームワーク**: SwiftUI（macOS 14 Sonoma+）
- **永続化**: SwiftData（`@Model` マクロ）
- **並行処理**: Swift Concurrency（async/await、actor、TaskGroup）
- **OAuth**: AuthenticationServices（ASWebAuthenticationSession）
- **セキュリティ**: Security.framework（Keychain Services API）
- **配布**: 未署名 Universal Binary .dmg（arm64 + x86_64）
- **テスト**: XCTest + Swift Testing
- **ビルド**: Xcode 15.x（スキーム: `TaskHub`）
- **最低 OS**: macOS 14.2 Sonoma

---

## アーキテクチャ（DESIGN.md Phase 3.1 参照）

```
View (SwiftUI)
  ↓ @Observable / @Bindable
ViewModel
  ↓ async/await
Service / UseCase  ←→  IntegrationProvider
  ↓                         ↓
Repository               KeychainStore / HTTPClient
  ↓
SwiftData (ModelContext)
```

**レイヤー責務**（詳細は `.claude/rules/architecture.md`）：
- View：表示と入力イベント発火のみ
- ViewModel：画面状態保持、サービス呼び出し
- Service：複数 Repository / Provider を協調させるユースケース
- Repository：SwiftData ModelContext のラッパー
- IntegrationProvider：外部ツール固有実装（プロトコル）

---

## ドメインエンティティ（DESIGN.md 3.2 参照）

- **Project** — プロジェクト（カスケード削除: TaskList → Task → Subtask）
- **TaskList** — リスト（`isInbox: true` の固定インボックスを含む）
- **Task** — タスク（作業時間辞書 `workHoursByDate` を持つ）
- **Subtask** — サブタスク（2階層まで、title + isCompleted）
- **Tag** — タグ（Task と多対多）
- **Connection** — 外部ツール接続（認証情報は Keychain に保管）
- **SyncRecord** — 外部タスクとローカル Task の対応記録（冪等性の鍵）
- **ReportTemplate** — レポートテンプレート（`{{変数}}` プレースホルダー形式）
- **ReportHistory** — 生成済みレポート履歴

---

## ユーザーロール

認証なし（個人利用・シングルユーザー・シングルデバイス）

---

## 絶対に守るルール

1. **実装前に REQUIREMENTS.md と DESIGN.md を必ず読む**
2. **イミュータブル優先**：値を直接変更せず、新しい値を作る
3. **SwiftData の複合ユニーク制約はアプリ層で強制**：`(connectionId, externalId)` の重複チェックを登録前に必ず実行
4. **インボックスは削除・リネーム禁止**：`isInbox == true` の TaskList はアプリ層で保護
5. **認証情報は Keychain のみ**：SwiftData / UserDefaults / ファイルへの平文保存は厳禁
6. **HTTPS 限定**：HTTP 通信は禁止。Info.plist の `NSAppTransportSecurity` 例外不可
7. **レート制限を守る**：Notion 3 req/sec、Google Sheets 60 req/min を `RateLimiter` actor で制御
8. **エラーは境界でキャッチ**：View 層まで伝播させず ViewModel でハンドリング
9. **テストファースト（TDD）**：RED → GREEN → REFACTOR の順序を厳守
10. **シークレットをコードにハードコードしない**：API トークン・OAuth Client Secret は禁止
11. `any` 型の濫用禁止：型消去が必要な場合はコメントで理由を記載
12. **1タスク = 1機能**：スコープを超えたリファクタリング・機能追加をしない

---

## 技術制約

- macOS 14 Sonoma 以上（SwiftData のため）
- 未署名 .dmg のため App Store 配布不可
- MVP は読み取り専用の単方向同期（外部ツールへの書き戻しなし）
- 自動同期・プッシュ通知・カレンダー連携は対象外

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
| `/e2e` | UI テスト生成・実行 |
| `/update-docs` | ドキュメント同期 |
| `/update-codemaps` | コードマップ更新 |

### プロジェクト固有

| コマンド | 役割 |
|---------|------|
| `/precommit-check` | SwiftLint・テスト・ビルドチェックを順番に実行 |
| `/audit-custom` | プロジェクト固有の静的解析を実行 |
| `/implement-feature` | 仕様確認 → TDD → 実装 → レビュー → コミットを一気通貫で実行 |
| `/spec` | 実装前に仕様書の該当箇所を読んで整理 |
