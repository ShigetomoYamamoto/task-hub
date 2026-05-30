"use client";

import { use, useState } from "react";
import { Header } from "@/components/layout/Header";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { TaskRow } from "@/features/tasks/components/TaskRow";
import { MOCK_PROJECTS } from "@/lib/mock/data";
import type { Task } from "@/lib/mock/types";

export default function ListPage({ params }: { params: Promise<{ id: string; listId: string }> }) {
  const { id, listId } = use(params);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const project = MOCK_PROJECTS.find((p) => p.id === id);
  const list = project?.lists.find((l) => l.id === listId);

  if (!project || !list) {
    return <div className="p-4 text-sm text-muted-foreground">リストが見つかりません</div>;
  }

  return (
    <>
      <Header title={`${project.name} / ${list.name}`} onSync={() => {}} />
      <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b text-sm text-muted-foreground">
          <span>{list.tasks.length} 件</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.tasks.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">タスクがありません</p>
          ) : (
            list.tasks.map((task) => (
              <TaskRow key={task.id} task={task} onClick={setSelectedTask} />
            ))
          )}
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
