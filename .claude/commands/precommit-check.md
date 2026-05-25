---
name: プリコミットチェック
description: Biome・型チェック・テスト・カスタム静的解析を順番に実行します
---

# /precommit-check

以下を順番に実行する。いずれかが失敗したら **その場で停止して修正する**。次のステップには進まない。

### 1. Biome（Lint + フォーマット）

```bash
pnpm biome ci .
```

違反が 0 件になるまで修正する。自動修正は `pnpm biome check --write .`。

### 2. TypeScript 型チェック

```bash
pnpm tsc --noEmit
```

型エラーが 0 件になるまで修正する。

### 3. テスト実行（カバレッジ付き）

```bash
pnpm vitest run --coverage
```

カバレッジが 80% 未満の場合は追加テストを書いてから進む。

### 4. Next.js ビルド確認

```bash
pnpm build
```

ビルドエラーが 0 件になるまで修正する。

### 5. カスタム静的解析

```bash
bash .github/scripts/audit-custom.sh
```

CRITICAL が 0 件になるまで修正する。

### 6. 完了報告

全ステップが PASS したら「プリコミットチェック: 全 PASS ✅」と報告する。
