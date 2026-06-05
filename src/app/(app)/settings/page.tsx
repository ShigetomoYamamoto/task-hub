"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_TAGS } from "@/lib/mock/data";

const ACCOUNT_EMAIL = "shigetomo_yamamoto@crien.jp";

const THEME_OPTIONS = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
  { value: "system", label: "システム", icon: Monitor },
] as const;

export default function SettingsPage() {
  return (
    <PageShell title="設定">
      <div className="space-y-6">
        <ThemeCard />
        <TagsCard />
        <AccountCard />
      </div>
    </PageShell>
  );
}

function ThemeCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">テーマ</CardTitle>
      </CardHeader>
      <CardContent>
        {mounted ? (
          <Tabs
            value={theme ?? "system"}
            onValueChange={(value) => {
              if (value !== null) setTheme(value);
            }}
          >
            <TabsList className="w-full">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <TabsTrigger key={option.value} value={option.value} className="gap-1.5">
                    <Icon className="size-4" aria-hidden="true" />
                    {option.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        ) : (
          <div className="h-8 w-full animate-pulse rounded-lg bg-muted" aria-hidden="true" />
        )}
      </CardContent>
    </Card>
  );
}

function TagsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">タグ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {MOCK_TAGS.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${tag.color}1A`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">タグの追加・編集は今後対応予定です。</p>
      </CardContent>
    </Card>
  );
}

function AccountCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">アカウント</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white"
          >
            S
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{ACCOUNT_EMAIL}</p>
            <p className="text-xs text-muted-foreground">招待制アカウント</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          Magic Link でログイン中
        </Badge>
      </CardContent>
    </Card>
  );
}
