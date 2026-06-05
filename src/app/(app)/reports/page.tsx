"use client";

import { Copy, Download, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_TEMPLATES } from "@/lib/mock/data";
import { todayISO } from "@/lib/mock/dates";
import { useTaskHubStore } from "@/lib/mock/store";

/** Variable hints shown in the settings card (§7.5). */
const VARIABLE_HINTS = [
  "{{date}}",
  "{{today.totalHours}}",
  "{{today.workLog}}",
  "{{next.tasks}}",
] as const;

/** value → label map so the Select trigger shows the template name, not its id. */
const TEMPLATE_ITEMS: Record<string, string> = Object.fromEntries(
  MOCK_TEMPLATES.map((tpl) => [tpl.id, `${tpl.name}${tpl.isDefault ? "（デフォルト）" : ""}`])
);

function resolveInitialTemplateId(requested: string | null): string {
  const fallback = MOCK_TEMPLATES[0]?.id ?? "";
  if (requested === null) {
    return fallback;
  }
  return MOCK_TEMPLATES.some((tpl) => tpl.id === requested) ? requested : fallback;
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const generateReport = useTaskHubStore((state) => state.generateReport);

  const initialTemplateId = useMemo(
    () => resolveInitialTemplateId(searchParams.get("template")),
    [searchParams]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [preview, setPreview] = useState<string | null>(null);

  const selectedTemplate = MOCK_TEMPLATES.find((tpl) => tpl.id === selectedTemplateId);
  const today = todayISO();

  function handleGenerate() {
    const result = generateReport(selectedTemplateId);
    if (result === null) {
      toast.error("テンプレートが見つかりませんでした");
      return;
    }
    setPreview(result.body);
    toast.success("日報を生成しました");
  }

  function handleCopy() {
    if (preview === null) {
      return;
    }
    void navigator.clipboard.writeText(preview);
    toast.success("クリップボードにコピーしました");
  }

  function handleDownload() {
    if (preview === null) {
      return;
    }
    const templateName = selectedTemplate?.name ?? "レポート";
    const fileName = `${today}-${templateName}.md`;
    const blob = new Blob([preview], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">レポート設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-template" className="text-xs text-muted-foreground">
                テンプレート
              </Label>
              <Select
                value={selectedTemplateId}
                items={TEMPLATE_ITEMS}
                onValueChange={(value) => {
                  if (value !== null) {
                    setSelectedTemplateId(value);
                  }
                }}
              >
                <SelectTrigger id="report-template" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TEMPLATES.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                      {tpl.isDefault ? "（デフォルト）" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">対象期間</p>
              <p className="text-sm font-medium">{today}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">使用できる変数</p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLE_HINTS.map((variable) => (
                  <code
                    key={variable}
                    className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {variable}
                  </code>
                ))}
              </div>
            </div>

            <Button onClick={handleGenerate} className="w-full gap-1.5">
              <Sparkles className="size-4" aria-hidden="true" />
              生成する
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">プレビュー</CardTitle>
            {preview !== null ? (
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  <Copy className="size-3.5" aria-hidden="true" />
                  コピー
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                  <Download className="size-3.5" aria-hidden="true" />
                  ダウンロード
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {preview !== null ? (
              <Textarea
                value={preview}
                onChange={(event) => setPreview(event.target.value)}
                aria-label="生成されたレポート本文"
                className="min-h-96 resize-y font-mono text-sm"
              />
            ) : (
              <EmptyState
                icon={FileText}
                title="テンプレートを選んで生成してください"
                description="左の「生成する」ボタンでプレビューを作成できます。"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Link
          href="/reports/history"
          className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          レポート履歴を見る →
        </Link>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <PageShell title="日報生成">
      <Suspense fallback={null}>
        <ReportsContent />
      </Suspense>
    </PageShell>
  );
}
