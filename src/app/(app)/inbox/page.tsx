"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { TaskRow } from "@/features/tasks/components/TaskRow";
import { MOCK_INBOX_TASKS } from "@/lib/mock/data";
import type { Task } from "@/lib/mock/types";

export default function InboxPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      <Header title="インボックス" onSync={() => {}} />
      <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b text-sm text-muted-foreground">
          <span>{MOCK_INBOX_TASKS.length} 件</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {MOCK_INBOX_TASKS.map((task) => (
            <TaskRow key={task.id} task={task} onClick={setSelectedTask} />
          ))}
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
