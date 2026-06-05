"use client";

import { useMemo } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { TaskListView } from "@/features/tasks/components/TaskListView";
import { filterInboxTasks, useTaskHubStore } from "@/lib/mock/store";

export default function InboxPage() {
  // Subscribe to the stable tasks array and derive in useMemo — passing an
  // array-returning selector to the store hook would loop forever (store.ts).
  const tasks = useTaskHubStore((state) => state.tasks);
  const inboxTasks = useMemo(() => filterInboxTasks(tasks), [tasks]);

  return (
    <PageShell title="インボックス">
      <TaskListView tasks={inboxTasks} listId="list-inbox" />
    </PageShell>
  );
}
