# 命名規則・コーディング規約（TaskHub / TypeScript + Next.js）

## 命名規則

### TypeScript 全般

| 対象 | 規則 | 例 |
|------|-----|-----|
| 型・インターフェース・クラス | PascalCase | `TaskRepository`, `IntegrationProvider` |
| 変数・関数・メソッド | camelCase | `fetchInboxTasks()`, `isCompleted` |
| 定数（モジュールスコープ） | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| ファイル名（コンポーネント） | PascalCase | `TaskList.tsx` |
| ファイル名（ユーティリティ） | kebab-case | `rate-limiter.ts` |
| DB テーブル名（Prisma） | snake_case 複数形 | `tasks`, `sync_records` |
| API エンドポイント | kebab-case、RESTful | `/api/tasks`, `/api/sync-runs` |

### React コンポーネント

- 命名: `{機能名}` PascalCase（例: `TaskList`, `SidebarNav`）
- Server Component はデフォルト、`'use client'` は最小限のコンポーネントのみ
- カスタムフックは `use` プレフィックス（例: `useTaskList`, `useSyncProgress`）

### Repository

- 命名: `{エンティティ名}Repository`（例: `taskRepository`, `connectionRepository`）
- メソッド命名: `find*`（取得）、`create`（作成）、`update`（更新）、`delete`（削除）

### Service

- 命名: `{ユースケース名}Service`（例: `syncService`, `reportService`）

### IntegrationProvider

- 命名: `{ツール名}Provider`（例: `NotionProvider`, `GoogleSheetsProvider`）
- `IntegrationProvider` インターフェースを必ず実装

---

## コーディング規約

### イミュータブル優先

```typescript
// Good: 新しいオブジェクトを作る
const updatedTask = { ...task, title: newTitle }

// Bad: 直接変更
task.title = newTitle
```

### 型安全

```typescript
// Good
function parseResponse(data: unknown): ApiResponse {
  const result = ApiResponseSchema.safeParse(data)
  if (!result.success) throw new Error('Invalid response shape')
  return result.data
}

// Bad
function parseResponse(data: any): any {
  return data
}
```

- `any` 禁止。型が不明な場合は `unknown` + 型ガード（または Zod）
- `as unknown as T` の多用は警告サイン

### 非同期処理

```typescript
// Good
async function loadTasks(userId: string): Promise<Task[]> {
  try {
    return await taskRepository.findByUser(userId)
  } catch (error) {
    throw new AppError('タスクの取得に失敗しました', { cause: error })
  }
}

// Bad
function loadTasks(userId: string) {
  return taskRepository.findByUser(userId)
    .then(tasks => tasks)
    .catch(err => { /* swallow */ })
}
```

- `async/await` を使う（`.then().catch()` チェーンは避ける）
- エラーを黙って飲み込まない

### エラーハンドリング

- Route Handler / Service 層で必ずキャッチし、View まで伝播させない
- 境界では `AppError` / `ZodError` を判別してユーザーフレンドリーなメッセージに変換
- `console.log` は本番コードに残さない（Biome で検出）

### Prisma / DB 操作

```typescript
// Good: userId を必ず含める
const tasks = await prisma.task.findMany({
  where: { userId, listId },
  orderBy: { createdAt: 'desc' },
})

// Bad: userId なし（RLS だけに頼らない）
const tasks = await prisma.task.findMany({
  where: { listId },
})
```

- Repository 内でのみ Prisma に直接アクセス（Route Handler / View から禁止）
- `where: { userId }` を必ず強制（アプリ層 + RLS の二重防御）
- `(connectionId, externalId)` の複合ユニーク制約はアプリ層でも事前チェック

### Zod バリデーション

```typescript
// Route Handler の冒頭で必ず実施
const body = await req.json()
const parsed = CreateTaskSchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
```

- 全 POST / PATCH / PUT Route Handler は冒頭で Zod パース
- バリデーション失敗は `400 { error }` を返す

---

## ファイル構成規約

```
src/
  app/              # Next.js App Router（ルーティング）
    api/            # Route Handlers（外部向け API）
    (auth)/         # 認証ページ
    (app)/          # アプリ本体ページ
  components/       # 共通 UI コンポーネント（shadcn/ui ベース）
  features/         # 機能別コンポーネント・フック
  server/           # サーバーサイド専用コード
    services/       # ビジネスロジック
    repositories/   # Prisma ラッパー
    integrations/   # 外部ツール Provider
    auth/           # 認証ヘルパー（withUser HOF）
    vault/          # Supabase Vault アクセス
    cron/           # Vercel Cron ジョブ
    db/             # Prisma クライアント初期化
  lib/              # ユーティリティ（バリデーション・レート制限等）
  types/            # 共有型定義
```

### import の順序（Biome が自動整理）

1. React / Next.js
2. サードパーティ
3. 内部モジュール（`@/` エイリアス）
4. 型のみ import（`import type`）

---

## Biome 設定

`biome.json` でプロジェクト全体のスタイルを統一する:

```json
{
  "formatter": { "indentStyle": "space", "indentWidth": 2 },
  "linter": {
    "rules": {
      "correctness": { "noUnusedVariables": "error" },
      "suspicious": { "noExplicitAny": "error" },
      "style": { "noNonNullAssertion": "warn" }
    }
  }
}
```

自動修正: `pnpm biome check --write .`
チェックのみ: `pnpm biome ci .`
