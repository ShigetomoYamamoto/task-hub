"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { TaskRow } from "@/features/tasks/components/TaskRow";
import { MOCK_TODAY_TASKS } from "@/lib/mock/data";
import type { Task } from "@/lib/mock/types";
import { Clock, FileText, TrendingUp } from "lucide-react";
import { useState } from "react";

const TODAY = new Date().toISOString().slice(0, 10);

export default function TodayPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const totalWorkHours = MOCK_TODAY_TASKS.reduce((sum, t) => {
    return sum + (t.workHoursByDate[TODAY] ?? 0);
  }, 0);

  const completedCount = MOCK_TODAY_TASKS.filter((t) => t.status === "done").length;

  return (
    <>
      <Header title="今日" onSync={() => {}} />
      <div className="h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-4 p-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Clock size={12} />
                  合計作業時間
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold">{totalWorkHours}<span className="text-sm font-normal ml-1">h</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <TrendingUp size={12} />
                  完了タスク
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold">{completedCount}<span className="text-sm font-normal ml-1">/ {MOCK_TODAY_TASKS.length}</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <TrendingUp size={12} />
                  達成率
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-2xl font-bold">
                  {MOCK_TODAY_TASKS.length > 0
                    ? Math.round((completedCount / MOCK_TODAY_TASKS.length) * 100)
                    : 0}
                  <span className="text-sm font-normal ml-0.5">%</span>
                </p>
                <Progress
                  value={(completedCount / Math.max(MOCK_TODAY_TASKS.length, 1)) * 100}
                  className="h-1 mt-1"
                />
              </CardContent>
            </Card>
          </div>

          {/* Today tasks */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">今日のタスク</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {MOCK_TODAY_TASKS.map((task) => (
                <div key={task.id} className="border-b last:border-b-0">
                  <TaskRow task={task} onClick={setSelectedTask} />
                  {/* Work hour input */}
                  <div className="flex items-center gap-2 px-4 pb-2 pt-0">
                    <Clock size={12} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">本日の作業時間</span>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      defaultValue={task.workHoursByDate[TODAY] ?? 0}
                      className="h-6 w-16 text-xs px-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Generate report button */}
          <Button className="w-full gap-2" size="sm">
            <FileText size={14} />
            日報を生成する
          </Button>
        </div>
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
