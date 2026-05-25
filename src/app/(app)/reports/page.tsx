"use client";

import { Header } from "@/components/layout/Header";
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
import { Check, Copy, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PREVIEW = `【2026-05-25業務報告】
■今日やったこと: 計5h
- TaskHub Phase 1 モック UI 実装 (3h) [進行中 60%]
- API エンドポイント設計レビュー (2h) [完了 100%]

■勉強になったこと

■明日やること
- TaskHub Phase 1 モック UI 実装（続き）
- 週次レポート作成

■連絡事項
`;

export default function ReportsPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(MOCK_TEMPLATES[0]!.id);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(PREVIEW);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([PREVIEW], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-2026-05-25.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Header title="日報生成" />
      <div className="h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-4 p-4">
          {/* Template selector */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">テンプレートを選ぶ</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">テンプレート</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TEMPLATES.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id} className="text-xs">
                        {tpl.name}
                        {tpl.isDefault && " (デフォルト)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gap-2" size="sm">
                <FileText size={14} />
                生成する
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm">プレビュー</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={handleDownload}>
                  <Download size={12} />
                  DL
                </Button>
                <Button size="sm" className="gap-1.5 text-xs h-7" onClick={handleCopy}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "コピー済" : "コピー"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Textarea
                value={PREVIEW}
                readOnly
                className="min-h-48 text-xs font-mono resize-none bg-muted/30"
              />
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/reports/history" className="text-xs text-muted-foreground hover:underline">
              レポート履歴を見る →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
