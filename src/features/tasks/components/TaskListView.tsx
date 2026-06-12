"use client";

import { Inbox, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { TaskRow } from "@/features/tasks/components/TaskRow";
import { STATUS_LABELS } from "@/features/tasks/constants/taskLabels";
import { formatRelativeTime } from "@/lib/format";
import { useTaskHubStore } from "@/lib/mock/store";
import type { Task, TaskStatus } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | TaskStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "todo", label: STATUS_LABELS.todo },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "in_review", label: STATUS_LABELS.in_review },
  { value: "done", label: STATUS_LABELS.done },
];

interface TaskListViewProps {
  tasks: Task[];
  listId: string;
  emptyMessage?: string;
}

/** Shared list view for inbox / project lists (§6.4). */
export function TaskListView({ tasks, listId, emptyMessage }: TaskListViewProps) {
  const addTask = useTaskHubStore((state) => state.addTask);
  const connections = useTaskHubStore((state) => state.connections);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesStatus = statusFilter === "all" || task.status === statusFilter;
        const matchesQuery = trimmedQuery === "" || task.title.toLowerCase().includes(trimmedQuery);
        return matchesStatus && matchesQuery;
      }),
    [tasks, statusFilter, trimmedQuery]
  );

  const isFiltering = trimmedQuery !== "" || statusFilter !== "all";

  const lastSyncedAt = useMemo(() => {
    const timestamps = connections
      .map((conn) => conn.lastSyncedAt)
      .filter((value): value is string => value !== null)
      .sort();
    return timestamps.at(-1) ?? null;
  }, [connections]);

  const handleOpen = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    const title = newTitle.trim();
    if (title === "") return;
    addTask({ title, listId });
    setNewTitle("");
    setAddOpen(false);
    toast.success("タスクを追加しました");
  };

  return (
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
            placeholder="タスクを検索…"
            aria-label="タスクを検索"
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                statusFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <Button onClick={() => setAddOpen(true)} className="ml-auto gap-1.5">
          <Plus className="size-4" aria-hidden="true" />
          タスク
        </Button>
      </div>

      {filtered.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-border">
            {filtered.map((task) => (
              <TaskRow key={task.id} task={task} onOpen={handleOpen} />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          {isFiltering ? (
            <EmptyState
              icon={Search}
              title="条件に一致するタスクがありません"
              description="検索語やフィルタを変更してください。"
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="タスクがありません"
              description={emptyMessage ?? "新しいタスクを追加して始めましょう。"}
              action={
                <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                  <Plus className="size-4" aria-hidden="true" />
                  タスクを追加
                </Button>
              }
            />
          )}
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length}/{tasks.length} 件
        {lastSyncedAt ? ` ・ 最終同期 ${formatRelativeTime(lastSyncedAt)}` : ""}
      </p>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タスクを追加</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAdd();
              }
            }}
            placeholder="タスクのタイトル"
            aria-label="タスクのタイトル"
            autoFocus
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
            <Button onClick={handleAdd} disabled={newTitle.trim() === ""}>
              追加する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
