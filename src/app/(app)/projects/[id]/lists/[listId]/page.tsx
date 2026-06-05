"use client";

import { FolderX } from "lucide-react";
import Link from "next/link";
import { use, useMemo } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { TaskListView } from "@/features/tasks/components/TaskListView";
import { MOCK_PROJECTS } from "@/lib/mock/data";
import { filterListTasks, useTaskHubStore } from "@/lib/mock/store";

type ListPageParams = { id: string; listId: string };

export default function ListPage({ params }: { params: Promise<ListPageParams> }) {
  const { id, listId } = use(params);

  const project = MOCK_PROJECTS.find((candidate) => candidate.id === id);
  const list = project?.lists.find((candidate) => candidate.id === listId);

  // Subscribe to the stable tasks array and derive in useMemo — passing an
  // array-returning selector to the store hook would loop forever (store.ts).
  const tasks = useTaskHubStore((state) => state.tasks);
  const listTasks = useMemo(() => filterListTasks(tasks, listId), [tasks, listId]);

  if (!project || !list) {
    return (
      <PageShell title="リスト">
        <EmptyState
          icon={FolderX}
          title="リストが見つかりません"
          description="指定されたリストは存在しないか、削除された可能性があります。"
          action={
            <Button nativeButton={false} render={<Link href="/inbox" />}>
              インボックスへ戻る
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={list.name}
      titleAccessory={
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          {project.name}
        </span>
      }
    >
      <TaskListView tasks={listTasks} listId={list.id} />
    </PageShell>
  );
}
