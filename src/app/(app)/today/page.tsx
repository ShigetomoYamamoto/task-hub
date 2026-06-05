"use client";

import { CheckCircle2, Clock, FileText, Sun, TrendingUp } from "lucide-react";
import Link from "next/link";
import { type MouseEvent, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { STATUS_DOT, STATUS_LABELS } from "@/features/tasks/constants/taskLabels";
import { formatHours } from "@/lib/format";
import { todayISO } from "@/lib/mock/dates";
import { useTaskHubStore } from "@/lib/mock/store";
import type { Subtask, Task, TaskStatus } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

const STATUS_VALUES: TaskStatus[] = ["todo", "in_progress", "in_review", "done", "cancelled"];

export default function TodayPage() {
  const tasks = useTaskHubStore((state) => state.tasks);
  const today = todayISO();

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === today || task.status === "in_progress"),
    [tasks, today]
  );

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalWorkHours = useMemo(
    () => todayTasks.reduce((sum, task) => sum + (task.workHoursByDate[today] ?? 0), 0),
    [todayTasks, today]
  );
  const completedCount = todayTasks.filter((task) => task.status === "done").length;
  const completionRate =
    todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  const handleOpen = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const reportActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/reports?template=tpl-2" />}
      >
        作業開始報告を生成
      </Button>
      <Button
        size="sm"
        nativeButton={false}
        render={<Link href="/reports?template=tpl-1" />}
        className="gap-1.5"
      >
        <FileText className="size-3.5" aria-hidden="true" />
        日報を生成
      </Button>
    </div>
  );

  return (
    <PageShell title="今日">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Clock}
            iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
            label="合計作業時間"
            value={formatHours(totalWorkHours)}
            suffix="h"
          />
          <StatCard
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
            label="完了タスク"
            value={completedCount}
            suffix={`/ ${todayTasks.length}`}
          />
          <StatCard
            icon={TrendingUp}
            iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
            label="達成率"
            value={`${completionRate}%`}
          >
            <Progress value={completionRate} className="h-1.5" />
          </StatCard>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">今日のタスク（{todayTasks.length}）</h2>
            <div className="hidden sm:block">{reportActions}</div>
          </div>

          {todayTasks.length > 0 ? (
            <Card className="overflow-hidden p-0">
              <div className="divide-y divide-border">
                {todayTasks.map((task) => (
                  <TodayTaskRow key={task.id} task={task} today={today} onOpen={handleOpen} />
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-0">
              <EmptyState
                icon={Sun}
                title="今日のタスクはありません"
                description="期限が今日のタスクや進行中のタスクがここに表示されます。"
              />
            </Card>
          )}

          <div className="sm:hidden">{reportActions}</div>
        </section>
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </PageShell>
  );
}

interface TodayTaskRowProps {
  task: Task;
  today: string;
  onOpen: (task: Task) => void;
}

/** Inline-editable today row: checkbox + title + status Select + work-hours Input + progress. */
function TodayTaskRow({ task, today, onOpen }: TodayTaskRowProps) {
  const toggleTaskDone = useTaskHubStore((state) => state.toggleTaskDone);
  const setTaskStatus = useTaskHubStore((state) => state.setTaskStatus);
  const setWorkHours = useTaskHubStore((state) => state.setWorkHours);

  const isDone = task.status === "done";
  const workHours = task.workHoursByDate[today] ?? 0;

  const stop = (event: MouseEvent) => event.stopPropagation();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(task);
    }
  };

  return (
    <div>
      {/** biome-ignore lint/a11y/useSemanticElements: interactive controls are nested, so a real <button> wrapper is invalid. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(task)}
        onKeyDown={handleKeyDown}
        className="group flex min-h-12 cursor-pointer flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
      >
        <button
          type="button"
          aria-label={isDone ? "未完了に戻す" : "完了にする"}
          onClick={(event) => {
            event.stopPropagation();
            toggleTaskDone(task.id);
          }}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
            isDone
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border hover:border-emerald-500"
          )}
        >
          {isDone ? <CheckCircle2 className="size-3" aria-hidden="true" /> : null}
        </button>

        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            isDone && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </span>

        {/** biome-ignore lint/a11y/noStaticElementInteractions: this wrapper only stops the row click from bubbling; the nested Select/Input handle their own keyboard events. */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: this wrapper only stops the row click from bubbling; the nested Select/Input handle their own keyboard events. */}
        <div className="flex shrink-0 items-center gap-2" onClick={stop}>
          <Select
            value={task.status}
            items={STATUS_LABELS}
            onValueChange={(value) => {
              if (value !== null) setTaskStatus(task.id, value as TaskStatus);
            }}
          >
            <SelectTrigger size="sm" className="w-32" aria-label="ステータスを変更">
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

          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={workHours}
              aria-label={`${task.title} の今日の作業時間（時間）`}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setWorkHours(task.id, today, Number(event.target.value))}
              className="h-7 w-20"
            />
            <span className="text-xs text-muted-foreground">h</span>
          </div>

          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
            {task.progress}%
          </span>
        </div>
      </div>

      {task.subtasks.length > 0 ? (
        <ul className="space-y-1.5 pr-4 pb-3 pl-12">
          {task.subtasks.map((subtask) => (
            <SubtaskItem key={subtask.id} taskId={task.id} subtask={subtask} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface SubtaskItemProps {
  taskId: string;
  subtask: Subtask;
}

function SubtaskItem({ taskId, subtask }: SubtaskItemProps) {
  const toggleSubtask = useTaskHubStore((state) => state.toggleSubtask);
  const checkboxId = `today-subtask-${subtask.id}`;

  return (
    <li className="flex items-center gap-2 text-sm">
      <Checkbox
        id={checkboxId}
        checked={subtask.isCompleted}
        onCheckedChange={() => toggleSubtask(taskId, subtask.id)}
      />
      <label
        htmlFor={checkboxId}
        className={cn(
          "cursor-pointer",
          subtask.isCompleted && "text-muted-foreground line-through"
        )}
      >
        {subtask.title}
      </label>
    </li>
  );
}
