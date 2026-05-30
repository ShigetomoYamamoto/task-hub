"use client";

import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Connection } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
  connection: Connection;
  onStop?: () => void;
}

export function SyncIndicator({ connection, onStop }: SyncIndicatorProps) {
  const isRunning = connection.syncStatus === "running";
  const isCompleted = connection.syncStatus === "completed";
  const isFailed = connection.syncStatus === "failed";

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
      <div className="flex-shrink-0">
        {isRunning && <RefreshCw size={14} className="animate-spin text-blue-500" />}
        {isCompleted && <CheckCircle size={14} className="text-green-500" />}
        {isFailed && <XCircle size={14} className="text-destructive" />}
        {connection.syncStatus === "idle" && (
          <RefreshCw size={14} className="text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium">{connection.displayName}</p>
        {isRunning && <Progress value={connection.syncProgress} className="mt-1 h-1" />}
      </div>

      <span
        className={cn(
          "text-[11px] font-medium flex-shrink-0",
          isRunning && "text-blue-500",
          isCompleted && "text-green-600",
          isFailed && "text-destructive"
        )}
      >
        {isRunning && `${connection.syncProgress}%`}
        {isCompleted && "完了"}
        {isFailed && "失敗"}
        {connection.syncStatus === "idle" && "待機中"}
      </span>

      {isRunning && onStop && (
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onStop}>
          中断
        </Button>
      )}
    </div>
  );
}
