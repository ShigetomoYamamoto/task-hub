# 新機能追加 標準手順書（TaskHub）

## 手順

### 1. Issue 確認

```bash
gh issue view <番号>
```

要件（Acceptance Criteria）・ラベル・担当を確認する。

### 2. 仕様確認

`/spec <機能名>` を実行して REQUIREMENTS.md・DESIGN.md の該当箇所を整理する。

確認事項:
- 対応する FR 番号（FR-01〜FR-22）
- 設計書の該当セクション（DESIGN.md Phase 3）
- 関連する ADR（`docs/adr/`）

### 3. ブランチ作成

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<機能名>_YYYYMMDD
```

### 4. TDD 実装

`/implement-feature <機能名>` を実行。

手順（厳守）:
1. テストファイル作成（`src/__tests__/`）
2. テスト実行 → **FAIL 確認（RED）**
3. 最小実装（`src/server/` / `src/app/`）
4. テスト実行 → **全件 PASS 確認（GREEN）**
5. リファクタリング（REFACTOR）
6. カバレッジ確認（80% 以上）

### 5. プリコミットチェック

`/precommit-check` を実行して全 PASS を確認する:

```bash
# Biome（Lint + フォーマット）
pnpm biome ci .

# TypeScript 型チェック
pnpm tsc --noEmit

# テスト（カバレッジ付き）
pnpm vitest run --coverage

# Next.js ビルド確認
pnpm build

# カスタム静的解析
bash .github/scripts/audit-custom.sh
```

### 6. PR 作成

`/create-pr` を実行して PR を作成する。

- タイトル: `feat: <機能名の概要>`（70文字以内）
- ボディ: `.github/PULL_REQUEST_TEMPLATE.md` に従う
- 関連 Issue: `Closes #<番号>` を必ず記載

### 7. コードマップ更新

実装したファイルを `docs/CODEMAPS/` に追記する。

### 8. ADR 追記（設計判断があった場合）

`docs/adr/000-template.md` をコピーして `docs/adr/00N-<判断内容>.md` を作成する。
`.github/scripts/audit-custom.sh` にコードレベルの検証を追加する。

---

## よくある落とし穴

| 状況 | 対処 |
|------|------|
| DB 複合ユニーク制約 | `(connectionId, externalId)` の重複チェックを Repository の `create` メソッドで事前に実施する |
| インボックスの保護 | `isInbox == true` の TaskList を削除・リネームするコードを書かない（アプリ層 + DB トリガーの二重防御） |
| 再同期時のデータ上書き | SyncRecord 経由でローカル変更を保護する（status / progress / list は外部から上書き禁止） |
| vaultSecretId の漏洩 | Connection の DTO から `vaultSecretId` を必ず除外する。クライアントに返さない |
| Route Handler の認証漏れ | `withUser()` HOF を全 Route Handler の冒頭で使用する |
| Route Handler の型エラー | Next.js の Node Runtime 指定を確認する（Edge Runtime では Prisma 動作不可） |
