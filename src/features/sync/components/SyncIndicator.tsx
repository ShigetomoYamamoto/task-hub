"use client";

import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { formatRelativeTime } from "@/lib/format";
import { useTaskHubStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
  connectionId: string;
}

/** Per-connection sync status badge connected to the store (§6.6). */
export function SyncIndicator({ connectionId }: SyncIndicatorProps) {
  const connection = useTaskHubStore((state) =>
    state.connections.find((conn) => conn.id === connectionId)
  );

  if (!connection) return null;

  const isRunning = connection.syncStatus === "running";
  const isFailed = connection.syncStatus === "failed";

  if (isRunning) {
    return (
      <div className="flex min-w-32 items-center gap-2 text-xs text-primary">
        <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />
        <span className="shrink-0">同期中…</span>
        <Progress value={connection.syncProgress} className="flex-1" />
      </div>
    );
  }

  if (isFailed) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <XCircle className="size-3.5" aria-hidden="true" />
        同期に失敗しました
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs",
        connection.lastSyncedAt ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
      )}
    >
      <CheckCircle2 className="size-3.5" aria-hidden="true" />
      {connection.lastSyncedAt
        ? `最終同期 ${formatRelativeTime(connection.lastSyncedAt)}`
        : "未同期"}
    </span>
  );
}
