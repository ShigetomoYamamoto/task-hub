"use client";

import { Calendar, Clock, ExternalLink, Flag } from "lucide-react";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  SOURCE_LABELS,
  SOURCE_STYLES,
  STATUS_DOT,
  STATUS_LABELS,
} from "@/features/tasks/constants/taskLabels";
import { DUE_TONE_CLASSES, formatDueDate, formatHours } from "@/lib/format";
import { todayISO } from "@/lib/mock/dates";
import { useTaskHubStore } from "@/lib/mock/store";
import type { Priority, Task, TaskStatus } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

const STATUS_VALUES: TaskStatus[] = ["todo", "in_progress", "in_review", "done", "cancelled"];
const PRIORITY_VALUES: Priority[] = ["low", "medium", "high", "urgent"];
const PROGRESS_STEPS = [0, 25, 50, 75, 100];

function isSafeUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

/** Right-side detail drawer; every field is wired to the store (§6.5). */
export function TaskDetailDrawer({ task, open, onClose }: TaskDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {task ? <DrawerBody key={task.id} taskId={task.id} fallback={task} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ taskId, fallback }: { taskId: string; fallback: Task }) {
  // The parent only holds a snapshot from when the row was clicked; subscribe
  // to the live task so slider / quick buttons / inputs reflect store updates.
  // `find` returns the element reference itself, so the snapshot stays stable.
  const liveTask = useTaskHubStore((state) => state.tasks.find((t) => t.id === taskId));
  const task = liveTask ?? fallback;

  const setTaskStatus = useTaskHubStore((state) => state.setTaskStatus);
  const setTaskPriority = useTaskHubStore((state) => state.setTaskPriority);
  const setTaskProgress = useTaskHubStore((state) => state.setTaskProgress);
  const setWorkHours = useTaskHubStore((state) => state.setWorkHours);
  const toggleSubtask = useTaskHubStore((state) => state.toggleSubtask);

  const [memo, setMemo] = useState(task.memo ?? "");

  const today = todayISO();
  const todayHours = task.workHoursByDate[today] ?? 0;
  const totalHours = Object.values(task.workHoursByDate).reduce((sum, h) => sum + h, 0);
  const completedSubtasks = task.subtasks.filter((sub) => sub.isCompleted).length;
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-start justify-between gap-3 pr-8">
          <SheetTitle className="text-left text-base leading-snug font-semibold">
            {task.title}
          </SheetTitle>
          {task.source !== "manual" ? (
            <span
              className={cn(
                "mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                SOURCE_STYLES[task.source]
              )}
            >
              {SOURCE_LABELS[task.source]}
            </span>
          ) : null}
        </div>
        {task.externalUrl && isSafeUrl(task.externalUrl) ? (
          <a
            href={task.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            外部ツールで開く
          </a>
        ) : null}
      </SheetHeader>

      <div className="space-y-5 px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="ステータス">
            <Select
              value={task.status}
              items={STATUS_LABELS}
              onValueChange={(value) => {
                if (value !== null) setTaskStatus(task.id, value as TaskStatus);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_VALUES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span
                      className={cn("size-2 rounded-full", STATUS_DOT[status])}
                      aria-hidden="true"
                    />
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="優先度">
            <Select
              value={task.priority}
              items={PRIORITY_LABELS}
              onValueChange={(value) => {
                if (value !== null) setTaskPriority(task.id, value as Priority);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_VALUES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <Flag
                      className={cn("size-3.5", PRIORITY_STYLES[priority])}
                      aria-hidden="true"
                    />
                    {PRIORITY_LABELS[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="進捗">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Slider
                value={task.progress}
                max={100}
                step={5}
                className="flex-1"
                onValueChange={(value) => {
                  if (typeof value === "number") setTaskProgress(task.id, value);
                }}
              />
              <span className="w-10 text-right text-sm font-semibold tabular-nums">
                {task.progress}%
              </span>
            </div>
            <div className="flex gap-1">
              {PROGRESS_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setTaskProgress(task.id, step)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    task.progress === step
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="期限">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {due ? (
                <span className={cn(DUE_TONE_CLASSES[due.tone])}>{due.label}</span>
              ) : (
                <span className="text-muted-foreground">期限なし</span>
              )}
            </span>
          </Field>
          <Field label="見積もり">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {task.estimatedHours !== null ? `${task.estimatedHours}h` : "—"}
            </span>
          </Field>
        </div>

        <Field label="今日の作業時間">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={todayHours}
              aria-label="今日の作業時間（時間）"
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setWorkHours(task.id, today, Number(event.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">h</span>
            <span className="ml-auto text-xs text-muted-foreground">
              累計 {formatHours(totalHours)}h
            </span>
          </div>
        </Field>

        {task.tags.length > 0 ? (
          <Field label="タグ">
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${tag.color}1A`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </Field>
        ) : null}

        {task.subtasks.length > 0 ? (
          <Field label={`サブタスク（${completedSubtasks}/${task.subtasks.length}）`}>
            <div className="space-y-2">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id={`subtask-${sub.id}`}
                    checked={sub.isCompleted}
                    onCheckedChange={() => toggleSubtask(task.id, sub.id)}
                  />
                  <label
                    htmlFor={`subtask-${sub.id}`}
                    className={cn(
                      "cursor-pointer",
                      sub.isCompleted && "text-muted-foreground line-through"
                    )}
                  >
                    {sub.title}
                  </label>
                </div>
              ))}
            </div>
          </Field>
        ) : null}

        <Field label="メモ">
          <Textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="メモを追加…"
            className="min-h-24 text-sm"
          />
        </Field>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
