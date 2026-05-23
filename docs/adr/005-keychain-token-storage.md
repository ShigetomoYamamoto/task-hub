# ADR-005: OAuth トークンの Keychain 保管方式

**ステータス**: accepted

**日付**: 2026-05-23

## コンテキスト

Google OAuth 2.0 の access_token / refresh_token、Notion Integration Token をセキュアに保存する必要がある。未署名アプリでも動作する必要がある（リスク R1）。

## 検討した選択肢

1. **Keychain Services API（Security.framework）** — OS レベルで暗号化、標準 API のみ
2. **暗号化ファイル（CryptoKit）** — 未署名でもプロンプトなしだが鍵管理の問題
3. **KeychainAccess 等のサードパーティラッパー** — 依存追加に値する複雑度ではない
4. **平文 UserDefaults** — 要件違反（NG）

## 決定

**Keychain Services API（Security.framework）** を直接利用し、`KeychainStore` シングルトンで抽象化。

- `kSecClassGenericPassword` を使用
- `service = "com.example.TaskHub.connection.<connectionUUID>"`
- `account = "credentials"`
- value = JSON シリアライズしたトークンセット
- アクセシビリティ = `kSecAttrAccessibleAfterFirstUnlock`

R1（未署名 Keychain プロンプト）が顕在化した場合は CryptoKit 暗号化ファイルにフォールバック可能な設計を維持する。

## 結果

**Positive:**
- OS レベルで暗号化、平文保存禁止要件を満たす
- 接続ごとにスコープを分離（削除時に該当アイテムのみクリア）
- 標準 API のみで第三者依存なし

**Negative:**
- 未署名アプリで Keychain プロンプトが出る可能性（R1）
- Keychain アイテムはアプリ削除時に残存 → 初回起動でクリーンアップ機構を実装

## コード検証

`.github/scripts/audit-custom.sh` の CHECK 1 でシークレットのハードコードを検知する。
SwiftData の configJSON にトークンを含めないことを CHECK 1 でカバー。
