"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task, TaskStatus } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  in_review: "レビュー中",
  done: "完了",
  cancelled: "キャンセル",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_review: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-slate-100 text-slate-400",
};

const SOURCE_LABELS: Record<Task["source"], string> = {
  manual: "手動",
  notion: "Notion",
  gsheet: "GSheet",
  jira: "JIRA",
};

interface TaskRowProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskRow({ task, onClick }: TaskRowProps) {
  const isDone = task.status === "done";

  return (
    <div
      className="flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 text-sm hover:bg-accent/40 transition-colors last:border-b-0"
      onClick={() => onClick(task)}
    >
      <Checkbox
        checked={isDone}
        className="flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      />

      <span className={cn("flex-1 truncate", isDone && "line-through text-muted-foreground")}>
        {task.title}
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {task.source !== "manual" && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {SOURCE_LABELS[task.source]}
          </Badge>
        )}
        <span className="w-8 text-right text-xs text-muted-foreground">{task.progress}%</span>
        <Badge className={cn("text-[10px] px-1.5 py-0 h-4 border-0", STATUS_STYLES[task.status])}>
          {STATUS_LABELS[task.status]}
        </Badge>
      </div>
    </div>
  );
}
