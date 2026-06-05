"use client";

import { Copy, Download, FileText, History, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/format";
import { MOCK_TEMPLATES } from "@/lib/mock/data";
import { useTaskHubStore } from "@/lib/mock/store";
import type { ReportHistory } from "@/lib/mock/types";

const ALL_TEMPLATES = "all";

const TEMPLATE_FILTERS = [
  { value: ALL_TEMPLATES, label: "すべてのテンプレート" },
  ...MOCK_TEMPLATES.map((tpl) => ({ value: tpl.name, label: tpl.name })),
];

/** value → label map so the Select trigger shows the label, not the raw value. */
const TEMPLATE_FILTER_ITEMS: Record<string, string> = Object.fromEntries(
  TEMPLATE_FILTERS.map((filter) => [filter.value, filter.label])
);

function downloadReport(report: ReportHistory): void {
  const datePart = report.generatedAt.slice(0, 10);
  const fileName = `${datePart}-${report.templateName}.md`;
  const blob = new Blob([report.body], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export default function ReportHistoryPage() {
  const reportHistory = useTaskHubStore((state) => state.reportHistory);

  const [query, setQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState<string>(ALL_TEMPLATES);

  const trimmedQuery = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      reportHistory.filter((report) => {
        const matchesTemplate =
          templateFilter === ALL_TEMPLATES || report.templateName === templateFilter;
        const matchesQuery =
          trimmedQuery === "" ||
          report.body.toLowerCase().includes(trimmedQuery) ||
          report.templateName.toLowerCase().includes(trimmedQuery);
        return matchesTemplate && matchesQuery;
      }),
    [reportHistory, templateFilter, trimmedQuery]
  );

  const isFiltering = trimmedQuery !== "" || templateFilter !== ALL_TEMPLATES;

  function handleCopy(report: ReportHistory) {
    void navigator.clipboard.writeText(report.body);
    toast.success("クリップボードにコピーしました");
  }

  return (
    <PageShell title="レポート履歴">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-44 flex-1">
            <Search
              className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="レポートを検索…"
              aria-label="レポートを検索"
              className="pl-8"
            />
          </div>

          <Select
            value={templateFilter}
            items={TEMPLATE_FILTER_ITEMS}
            onValueChange={(value) => {
              if (value !== null) {
                setTemplateFilter(value);
              }
            }}
          >
            <SelectTrigger aria-label="テンプレートで絞り込む" className="min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((report) => (
              <Card key={report.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{report.templateName}</p>
                      <Badge variant="secondary">Markdown</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(report.generatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(report)}
                      className="gap-1.5"
                    >
                      <Copy className="size-3.5" aria-hidden="true" />
                      コピー
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report)}
                      className="gap-1.5"
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      ダウンロード
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="line-clamp-3 overflow-hidden whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
                    {report.body}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isFiltering ? (
          <Card>
            <EmptyState
              icon={Search}
              title="条件に一致するレポートがありません"
              description="検索語やテンプレートの絞り込みを変更してください。"
            />
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={History}
              title="レポート履歴がありません"
              description="日報を生成すると、ここに履歴が表示されます。"
              action={
                <Button nativeButton={false} render={<Link href="/reports" />} className="gap-1.5">
                  <FileText className="size-4" aria-hidden="true" />
                  日報生成へ
                </Button>
              }
            />
          </Card>
        )}
      </div>
    </PageShell>
  );
}
