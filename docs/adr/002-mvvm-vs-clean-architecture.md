# ADR-002: アクセス制御方式（Magic Link + ALLOWED_EMAILS を採用）

**ステータス**: accepted

**日付**: 2026-05-25

## コンテキスト

SaaS 版では URL を知るだけでアクセスできてしまうリスクがある（REQUIREMENTS.md R1）。個人利用・シングルユーザーのため、複雑な認証システムは不要。

## 検討した選択肢

1. **Supabase Magic Link + ALLOWED_EMAILS allowlist** — パスワード不要、メールリンクでログイン。env var で許可アドレスを制御
2. **パスワード認証** — パスワード管理の手間、ハッシュ保存の実装が必要
3. **Google OAuth のみ** — Google アカウント必須でアクセス方法が固定される
4. **認証なし + Basic 認証** — セキュリティが低い、モバイル対応が煩雑

## 決定

**Supabase Magic Link + ALLOWED_EMAILS allowlist を採用**。`ALLOWED_EMAILS` 環境変数に記載のあるメールアドレスのみ Magic Link を送信できる。

## 結果

**Positive:**
- パスワード管理不要
- 許可リストで不正アクセスを防止
- Supabase Auth に組み込み（追加実装最小）
- Magic Link は HTTPS + 時間制限付き（セキュリティ十分）

**Negative:**
- メール到達率に依存（迷惑メールフォルダ対策が必要な場合あり）
- env var の ALLOWED_EMAILS 変更後は再デプロイが必要

## コード検証

Middleware で `ALLOWED_EMAILS` チェックを実装。`src/server/auth/withUser.ts` でセッション検証を強制する。
