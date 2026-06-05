"use client";

import { Calendar, Check, Flag, ListChecks } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";

import { Progress } from "@/components/ui/progress";
import {
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  SOURCE_LABELS,
  SOURCE_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/features/tasks/constants/taskLabels";
import { DUE_TONE_CLASSES, formatDueDate } from "@/lib/format";
import { useTaskHubStore } from "@/lib/mock/store";
import type { Tag, Task } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_TAGS = 2;

interface TaskRowProps {
  task: Task;
  onOpen: (task: Task) => void;
}

/** Single task row in a list (§6.3). */
export function TaskRow({ task, onOpen }: TaskRowProps) {
  const toggleTaskDone = useTaskHubStore((state) => state.toggleTaskDone);
  const isDone = task.status === "done";
  const completedSubtasks = task.subtasks.filter((sub) => sub.isCompleted).length;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(task);
    }
  };

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toggleTaskDone(task.id);
  };

  const hasMeta = task.dueDate !== null || task.subtasks.length > 0 || task.tags.length > 0;

  return (
    // biome-ignore lint/a11y/useSemanticElements: a checkbox button is nested inside, so a real <button> wrapper is invalid.
    <div
      role="button"
      tabIndex={0}
      className="group flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      onClick={() => onOpen(task)}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-label={isDone ? "未完了に戻す" : "完了にする"}
        onClick={handleToggle}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isDone
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border hover:border-emerald-500"
        )}
      >
        {isDone ? <Check className="size-3" aria-hidden="true" /> : null}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "truncate text-sm font-medium",
              isDone && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
          {task.priority !== "low" ? (
            <Flag
              className={cn("size-3.5 shrink-0", PRIORITY_STYLES[task.priority])}
              aria-label={`優先度: ${PRIORITY_LABELS[task.priority]}`}
            />
          ) : null}
        </div>

        {hasMeta ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {task.dueDate ? <DueDate iso={task.dueDate} /> : null}
            {task.subtasks.length > 0 ? (
              <span className="flex items-center gap-1">
                <ListChecks className="size-3.5" aria-hidden="true" />
                {completedSubtasks}/{task.subtasks.length}
              </span>
            ) : null}
            {task.tags.length > 0 ? <TagChips tags={task.tags} /> : null}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {task.source !== "manual" ? (
          <span
            className={cn(
              "hidden rounded-md px-1.5 py-0.5 text-xs font-medium sm:inline-block",
              SOURCE_STYLES[task.source]
            )}
          >
            {SOURCE_LABELS[task.source]}
          </span>
        ) : null}

        {task.progress > 0 ? (
          <div className="flex items-center gap-2">
            <Progress value={task.progress} className="hidden w-16 sm:flex" />
            <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
              {task.progress}%
            </span>
          </div>
        ) : null}

        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            STATUS_STYLES[task.status]
          )}
        >
          {STATUS_LABELS[task.status]}
        </span>
      </div>
    </div>
  );
}

function DueDate({ iso }: { iso: string }) {
  const { label, tone } = formatDueDate(iso);
  return (
    <span className={cn("flex items-center gap-1", DUE_TONE_CLASSES[tone])}>
      <Calendar className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

function TagChips({ tags }: { tags: Tag[] }) {
  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - visible.length;
  return (
    <span className="flex items-center gap-1">
      {visible.map((tag) => (
        <span
          key={tag.id}
          className="rounded px-1.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${tag.color}1A`, color: tag.color }}
        >
          {tag.name}
        </span>
      ))}
      {overflow > 0 ? <span className="text-xs text-muted-foreground">+{overflow}</span> : null}
    </span>
  );
}
