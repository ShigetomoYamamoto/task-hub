#!/usr/bin/env bash
# プロジェクト固有の静的解析（TaskHub / Swift）
# 終了コード: 0=OK, 1=CRITICAL 違反あり
set -euo pipefail

ERRORS=0

echo "=== TaskHub カスタム静的解析 ==="

# ─────────────────────────────────────────────────────────────────
# CHECK 1: 認証情報のハードコード検出
# Keychain 以外での API キー・トークン保存を検知する
# ─────────────────────────────────────────────────────────────────
echo "CHECK 1: ハードコードされたシークレット検出..."
if find . -name "*.swift" -not -path "./.build/*" -not -path "./DerivedData/*" | \
   xargs grep -l "let.*[Tt]oken\s*=\s*\"[A-Za-z0-9_\-]\{10,\}\"" 2>/dev/null | grep -v "_Tests"; then
  echo "❌ CRITICAL: シークレットが文字列リテラルとして埋め込まれている可能性があります"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✓ ハードコードシークレット: 検出なし"
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 2: ModelContext の直接参照（View/ViewModel から禁止）
# Repository を経由しない直接アクセスを検知する
# ─────────────────────────────────────────────────────────────────
echo "CHECK 2: View/ViewModel からの ModelContext 直接アクセス検出..."
VIOLATION_FILES=$(find . -path "*/Features/*" -name "*View.swift" -o -path "*/Features/*" -name "*ViewModel.swift" 2>/dev/null | \
  xargs grep -l "@Environment(\.modelContext)" 2>/dev/null || true)
if [ -n "$VIOLATION_FILES" ]; then
  echo "❌ CRITICAL: View/ViewModel が ModelContext に直接アクセスしています（Repository を経由すること）"
  echo "$VIOLATION_FILES"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✓ ModelContext 直接アクセス: 検出なし"
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 3: HTTP 通信の使用検出（HTTPS 限定）
# ─────────────────────────────────────────────────────────────────
echo "CHECK 3: HTTP（非暗号化）通信の使用検出..."
if find . -name "*.swift" -not -path "./.build/*" | \
   xargs grep -n '"http://' 2>/dev/null | grep -v "// "; then
  echo "❌ CRITICAL: HTTP 通信が使用されています。HTTPS のみ使用可能です"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✓ HTTP 通信: 検出なし"
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 4: インボックスの保護（削除・リネーム操作を検知）
# ─────────────────────────────────────────────────────────────────
echo "CHECK 4: インボックス保護の確認..."
if find . -name "*.swift" -not -path "./.build/*" | \
   xargs grep -n "isInbox" 2>/dev/null | grep -v "guard\|if\|where\|return\|//"; then
  # isInbox を無条件に変更するコードがないか確認（簡易チェック）
  echo "  ℹ️  isInbox の参照を検出（コードレビューで保護ロジックを確認してください）"
else
  echo "  ✓ インボックス保護: 問題なし"
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 5: 未定義変数パターン（テンプレート変数名のタイポ検出補助）
# ─────────────────────────────────────────────────────────────────
echo "CHECK 5: レポート変数識別子のスペルチェック..."
VALID_VARS="date|periodStart|periodEnd|today.totalHours|today.workLog|today.plan|today.completed|today.inProgress|assigned.tasks|next.tasks|projects.summary|period.completed"
if find . -name "*.swift" -not -path "./.build/*" | \
   xargs grep -o '"\{\{[a-zA-Z.]*\}\}"' 2>/dev/null | \
   sed 's/"{{//;s/}}"//' | \
   grep -vE "^($VALID_VARS)$" 2>/dev/null | grep .; then
  echo "  ⚠️  WARNING: 未定義の可能性があるテンプレート変数が使用されています（VariableRegistry に登録されているか確認してください）"
else
  echo "  ✓ テンプレート変数: 検出なし"
fi

# ─────────────────────────────────────────────────────────────────
# 結果サマリー
# ─────────────────────────────────────────────────────────────────
echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "❌ カスタム静的解析: CRITICAL ${ERRORS} 件"
  exit 1
fi

echo "✅ カスタム静的解析: PASS"
exit 0
