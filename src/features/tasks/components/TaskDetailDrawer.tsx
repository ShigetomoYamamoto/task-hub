"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import type { Priority, Task, TaskStatus } from "@/lib/mock/types";
import { cn } from "@/lib/utils";
import { Calendar, Clock, ExternalLink, Tag } from "lucide-react";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  in_review: "レビュー中",
  done: "完了",
  cancelled: "キャンセル",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

export function TaskDetailDrawer({ task, open, onClose }: TaskDetailDrawerProps) {
  if (!task) return null;

  const totalWorkHours = Object.values(task.workHoursByDate).reduce((a, b) => a + b, 0);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left text-base leading-tight">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ステータス</Label>
              <Select defaultValue={task.status}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">優先度</Label>
              <Select defaultValue={task.priority}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">進捗</Label>
              <span className="text-xs font-semibold">{task.progress}%</span>
            </div>
            <Slider
              defaultValue={[task.progress]}
              max={100}
              step={5}
              className="w-full"
            />
            <Progress value={task.progress} className="h-1.5" />
          </div>

          {/* Due date & Hours */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar size={13} />
              <span>{task.dueDate ?? "期限なし"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock size={13} />
              <span>実績 {totalWorkHours}h / 見積 {task.estimatedHours ?? "—"}h</span>
            </div>
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag size={12} />
                <span>タグ</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-[11px]"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Memo */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">メモ</Label>
            <Textarea
              defaultValue={task.memo ?? ""}
              placeholder="メモを入力..."
              className="min-h-20 text-sm resize-none"
            />
          </div>

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                サブタスク ({task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length})
              </Label>
              <div className="space-y-1.5">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <Checkbox id={sub.id} defaultChecked={sub.isCompleted} />
                    <label
                      htmlFor={sub.id}
                      className={cn(
                        "text-sm cursor-pointer",
                        sub.isCompleted && "line-through text-muted-foreground"
                      )}
                    >
                      {sub.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External link */}
          {task.externalUrl && (
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" asChild>
              <a href={task.externalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} />
                外部ツールで開く（{task.source}）
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
