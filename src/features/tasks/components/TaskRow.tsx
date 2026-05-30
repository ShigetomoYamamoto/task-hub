"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { STATUS_LABELS, STATUS_STYLES } from "@/features/tasks/constants/taskLabels";
import type { Task } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

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
    // biome-ignore lint/a11y/useSemanticElements: Checkbox inside prevents nesting <button> in <button>
    <div
      role="button"
      tabIndex={0}
      className="flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 text-sm hover:bg-accent/40 transition-colors last:border-b-0"
      onClick={() => onClick(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(task);
        }
      }}
    >
      <Checkbox checked={isDone} className="flex-shrink-0" onClick={(e) => e.stopPropagation()} />

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
