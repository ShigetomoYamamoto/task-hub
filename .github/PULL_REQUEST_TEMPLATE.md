## 概要

<!-- 何を・なぜ変更したか（1〜3文で） -->

Closes #

## 変更種別

- [ ] 機能追加（feat）
- [ ] バグ修正（fix）
- [ ] リファクタリング（refactor）
- [ ] ドキュメント（docs）
- [ ] CI / 設定変更（ci / chore）

## 変更内容

- <!-- 箇条書きで変更内容を記載 -->

## チェックリスト

- [ ] Biome: 警告ゼロ（`pnpm biome ci .`）
- [ ] TypeScript 型チェック: エラーなし（`pnpm tsc --noEmit`）
- [ ] テスト: 全件 PASS（カバレッジ 80% 以上）
- [ ] Next.js ビルド: エラーなし（`pnpm build`）
- [ ] カスタム静的解析: CRITICAL 0 件（`bash .github/scripts/audit-custom.sh`）
- [ ] セキュリティ確認（認証情報のハードコードなし・HTTPS のみ・vaultSecretId 漏洩なし）
- [ ] 全 Route Handler に Zod バリデーション実装済み
- [ ] インボックス保護（isInbox == true の TaskList を削除・リネームしていない）
- [ ] DESIGN.md のアーキテクチャ規約に準拠

## テスト結果

```
// pnpm vitest run --coverage の出力サマリーを貼る
```

## 関連する ADR / 設計書の変更

<!-- 設計上の判断を変更した場合は docs/adr/ に記録し、ここにリンクする -->
