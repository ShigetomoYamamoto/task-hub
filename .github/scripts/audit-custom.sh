#!/usr/bin/env bash
# プロジェクト固有の静的解析（TaskHub SaaS / Next.js + TypeScript）
# 終了コード: 0=OK, 1=CRITICAL 違反あり
set -euo pipefail

ERRORS=0

echo "=== TaskHub カスタム静的解析 ==="

# ─────────────────────────────────────────────────────────────────
# CHECK 1: vaultSecretId の DTO 漏洩検出（CLAUDE.md ルール #13）
# Connection レスポンスに vaultSecretId を含めてはならない
# ─────────────────────────────────────────────────────────────────
echo "CHECK 1: vaultSecretId の DTO 漏洩検出..."
if find src -name "*.ts" 2>/dev/null | \
   xargs grep -ln "vaultSecretId" 2>/dev/null | \
   xargs grep -n "NextResponse\.json\|res\.json\|return {" 2>/dev/null | \
   grep "vaultSecretId" | grep -v "// \|test\|spec"; then
  echo "❌ CRITICAL: vaultSecretId がレスポンスに含まれている可能性があります（CLAUDE.md ルール #13）"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✓ vaultSecretId 漏洩: 検出なし"
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 2: Route Handler の Zod バリデーション確認（CLAUDE.md ルール #14）
# POST / PATCH / PUT の Route Handler は冒頭で Zod パースが必要
# ─────────────────────────────────────────────────────────────────
echo "CHECK 2: Route Handler Zod バリデーション確認..."
MISSING_ZOD=""
for f in $(find src/app/api -name "route.ts" 2>/dev/null); do
  if grep -qE "export async function (POST|PATCH|PUT)" "$f"; then
    if ! grep -qE "\.safeParse|\.parseAsync|\.parse\(" "$f"; then
      MISSING_ZOD="${MISSING_ZOD} $f"
    fi
  fi
done
if [ -n "$MISSING_ZOD" ]; then
  echo "❌ CRITICAL: Zod バリデーションがない POST/PATCH/PUT Route Handler（CLAUDE.md ルール #14）:"
  echo "$MISSING_ZOD"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✓ Route Handler Zod バリデーション: OK"
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 3: HTTP 通信の使用検出（CLAUDE.md ルール #6）
# http:// は禁止（localhost 除く）
# ─────────────────────────────────────────────────────────────────
echo "CHECK 3: HTTP（非暗号化）通信の検出..."
if find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
   xargs grep -n '"http://' 2>/dev/null | \
   grep -v "localhost\|127\.0\.0\.1\|// "; then
  echo "❌ CRITICAL: 本番向け HTTP 通信が使用されています（CLAUDE.md ルール #6）"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✓ HTTP 通信: 検出なし"
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 4: ハードコードシークレット検出
# ─────────────────────────────────────────────────────────────────
echo "CHECK 4: ハードコードシークレット検出..."
if find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
   xargs grep -nE "(secret|token|password|key)\s*[:=]\s*['\"][a-zA-Z0-9_\-]{20,}['\"]" 2>/dev/null | \
   grep -v "process\.env\|// \|test\|spec\|mock\|placeholder\|example"; then
  echo "❌ CRITICAL: シークレットがハードコードされている可能性があります"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✓ ハードコードシークレット: 検出なし"
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 5: Repository の userId フィルタ強制確認
# Prisma クエリに where: { userId } が含まれているか
# ─────────────────────────────────────────────────────────────────
echo "CHECK 5: Repository userId フィルタ確認..."
if find src/server/repositories -name "*.ts" 2>/dev/null | \
   xargs grep -n "prisma\.\w*\.(findMany\|findFirst\|findUnique\|update\|delete)" 2>/dev/null | \
   grep -v "userId\|// \|test\|spec" | grep .; then
  echo "⚠️  WARNING: userId フィルタなしの Prisma クエリが存在します（RLS の二重防御を確認してください）"
else
  echo "  ✓ Repository userId フィルタ: OK"
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
