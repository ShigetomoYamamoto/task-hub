---
name: フィーチャー実装（TDD一気通貫）
description: 仕様確認 → TDD → 実装 → コードレビュー → コミットを一気通貫で実行します
---

# /implement-feature

引数として実装する機能名または FR 番号を受け取る。

## 手順

### 1. 仕様確認

`docs/REQUIREMENTS.md` と `docs/DESIGN.md` を読む。
実装対象の機能に関するセクションを特定し、以下を整理する:
- 対応する FR 番号（REQUIREMENTS.md §2）
- 設計書の該当 API / DB スキーマ（DESIGN.md §3〜§4）
- 関連する ADR（docs/adr/）
- Zod バリデーションルール・エラーケース
- 認証・認可の要件（RLS / withUser HOF）
- DB の制約（(connectionId, externalId) 複合ユニーク、インボックス保護など）

仕様が不明確な箇所があれば実装前にユーザーに確認する。

### 2. テストを先に書く（RED）

`src/__tests__/` 配下にテストファイルを作成する（Vitest）。
以下のケースを網羅する:
- 正常系（ハッピーパス）
- Zod バリデーションエラー
- 認証エラー（未認証 → 401）
- 境界値・エッジケース
- DB 制約違反（重複 externalId など）

```bash
pnpm vitest run
```

を実行して **FAIL することを確認する（RED）**。

### 3. 実装（GREEN）

テストがパスする最小限の実装を書く。
`.claude/rules/architecture.md` の責務分離に従う:
- Route Handler / Server Action: Zod 検証 → Service 呼び出し → DTO 整形
- Service: 複数 Repository / Provider の協調
- Repository: Prisma ラッパー（`where: { userId }` を必ず強制）

```bash
pnpm vitest run
```

を実行して **全件 PASS することを確認する（GREEN）**。

### 4. リファクタリング（REFACTOR）

コードの重複・命名・責務の分散を確認して改善する。
テストが引き続き PASS することを確認する。

### 5. コードレビュー

**code-reviewer** エージェントを起動してレビューを受ける。
CRITICAL・HIGH の指摘は修正してから次へ進む。

### 6. セキュリティレビュー（認証・入力検証・Vault に関係する場合）

**security-reviewer** エージェントを起動してレビューを受ける。

### 7. プリコミットチェック

`/precommit-check` を実行して全 PASS を確認する。

### 8. コミット

Conventional Commits 形式でコミットする。
