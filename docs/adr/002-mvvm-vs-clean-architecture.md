# ADR-002: MVVM vs Clean Architecture

**ステータス**: accepted

**日付**: 2026-05-23

## コンテキスト

個人開発・単一クライアント・ローカルファースト。複雑な依存方向制御や巨大チーム前提のレイヤー分割は過剰な可能性がある。

## 検討した選択肢

1. **MVVM + Repository + Service（軽量3層）** — SwiftUI との統合が自然
2. **Clean Architecture（4-5層）** — テスト性は高いがボイラープレート過多
3. **TCA（The Composable Architecture）** — 強力だが学習コスト大・ライブラリ依存
4. **VIPER** — macOS では一般的でない、SwiftUI 親和性低い

## 決定

**MVVM + Repository + Service の軽量3層**を採用。Clean Architecture の厳密な UseCase / Entity / Interactor 分割は採用しない。

## 結果

**Positive:**
- SwiftUI の `@Observable` / `@Bindable` と自然に組み合わせ可能
- レイヤー数が少なく機能追加スピードが速い
- Repository 層により SwiftData との結合を1箇所に閉じ込められる

**Negative:**
- ViewModel が肥大化するリスク → 機能別 ViewModel 分割で対応
- ドメイン純粋性が Clean Architecture より低い → Repository インターフェースで吸収

## コード検証

`.claude/rules/architecture.md` にレイヤー責務と禁止事項を明記。
