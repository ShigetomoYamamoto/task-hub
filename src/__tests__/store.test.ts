import { beforeEach, describe, expect, it } from "vitest";
import { useTaskHubStore } from "@/lib/mock/store";
import type { Task } from "@/lib/mock/types";

const TODAY = (() => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
})();

const BASE_TASK: Task = {
  id: "t1",
  title: "テストタスク",
  memo: null,
  status: "todo",
  priority: "medium",
  progress: 0,
  dueDate: null,
  estimatedHours: null,
  workHoursByDate: {},
  subtasks: [],
  tags: [],
  source: "manual",
  externalUrl: null,
  listId: "list-inbox",
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
};

function seed(tasks: Task[]): void {
  useTaskHubStore.setState({ tasks });
}

function getTask(id: string): Task {
  const found = useTaskHubStore.getState().tasks.find((t) => t.id === id);
  if (!found) {
    throw new Error(`task ${id} not found`);
  }
  return found;
}

describe("useTaskHubStore", () => {
  describe("toggleTaskDone (FR-04)", () => {
    it("marks a task done and sets progress to 100", () => {
      seed([{ ...BASE_TASK, id: "t1", status: "in_progress", progress: 40 }]);
      useTaskHubStore.getState().toggleTaskDone("t1");
      const task = getTask("t1");
      expect(task.status).toBe("done");
      expect(task.progress).toBe(100);
    });

    it("reverting a done task sets status to todo but keeps progress", () => {
      seed([{ ...BASE_TASK, id: "t1", status: "done", progress: 100 }]);
      useTaskHubStore.getState().toggleTaskDone("t1");
      const task = getTask("t1");
      expect(task.status).toBe("todo");
      expect(task.progress).toBe(100);
    });

    it("does not mutate the original task object", () => {
      const original: Task = { ...BASE_TASK, id: "t1", status: "todo", progress: 10 };
      seed([original]);
      useTaskHubStore.getState().toggleTaskDone("t1");
      expect(original.status).toBe("todo");
      expect(original.progress).toBe(10);
    });
  });

  describe("setTaskStatus", () => {
    it("forces progress to 100 when status becomes done", () => {
      seed([{ ...BASE_TASK, id: "t1", status: "todo", progress: 20 }]);
      useTaskHubStore.getState().setTaskStatus("t1", "done");
      expect(getTask("t1").progress).toBe(100);
    });

    it("keeps progress for non-done statuses", () => {
      seed([{ ...BASE_TASK, id: "t1", status: "todo", progress: 20 }]);
      useTaskHubStore.getState().setTaskStatus("t1", "in_progress");
      expect(getTask("t1").progress).toBe(20);
    });
  });

  describe("setTaskProgress", () => {
    it("clamps values above 100", () => {
      seed([{ ...BASE_TASK, id: "t1" }]);
      useTaskHubStore.getState().setTaskProgress("t1", 150);
      expect(getTask("t1").progress).toBe(100);
    });

    it("clamps values below 0", () => {
      seed([{ ...BASE_TASK, id: "t1" }]);
      useTaskHubStore.getState().setTaskProgress("t1", -5);
      expect(getTask("t1").progress).toBe(0);
    });
  });

  describe("setWorkHours", () => {
    it("sets hours for a date immutably", () => {
      seed([{ ...BASE_TASK, id: "t1", workHoursByDate: {} }]);
      useTaskHubStore.getState().setWorkHours("t1", TODAY, 2.5);
      expect(getTask("t1").workHoursByDate[TODAY]).toBe(2.5);
    });

    it("overwrites existing hours for the same date", () => {
      seed([{ ...BASE_TASK, id: "t1", workHoursByDate: { [TODAY]: 1 } }]);
      useTaskHubStore.getState().setWorkHours("t1", TODAY, 3);
      expect(getTask("t1").workHoursByDate[TODAY]).toBe(3);
    });

    it("removes the key when hours is 0 or less", () => {
      seed([{ ...BASE_TASK, id: "t1", workHoursByDate: { [TODAY]: 4, "2026-06-04": 2 } }]);
      useTaskHubStore.getState().setWorkHours("t1", TODAY, 0);
      const hours = getTask("t1").workHoursByDate;
      expect(TODAY in hours).toBe(false);
      expect(hours["2026-06-04"]).toBe(2);
    });
  });

  describe("toggleSubtask", () => {
    it("flips the completion of the matching subtask only", () => {
      seed([
        {
          ...BASE_TASK,
          id: "t1",
          subtasks: [
            { id: "s1", title: "A", isCompleted: false },
            { id: "s2", title: "B", isCompleted: false },
          ],
        },
      ]);
      useTaskHubStore.getState().toggleSubtask("t1", "s1");
      const subtasks = getTask("t1").subtasks;
      expect(subtasks[0]?.isCompleted).toBe(true);
      expect(subtasks[1]?.isCompleted).toBe(false);
    });
  });

  describe("addTask", () => {
    it("prepends a new todo task with the given title and listId", () => {
      seed([{ ...BASE_TASK, id: "t1" }]);
      useTaskHubStore.getState().addTask({ title: "新規タスク", listId: "list-3" });
      const tasks = useTaskHubStore.getState().tasks;
      expect(tasks).toHaveLength(2);
      expect(tasks[0]?.title).toBe("新規タスク");
      expect(tasks[0]?.listId).toBe("list-3");
      expect(tasks[0]?.status).toBe("todo");
    });
  });

  describe("connections", () => {
    it("addConnection appends an idle connection", () => {
      useTaskHubStore.setState({ connections: [] });
      useTaskHubStore.getState().addConnection({ toolType: "notion", displayName: "テスト" });
      const conns = useTaskHubStore.getState().connections;
      expect(conns).toHaveLength(1);
      expect(conns[0]?.displayName).toBe("テスト");
      expect(conns[0]?.syncStatus).toBe("idle");
    });

    it("removeConnection drops the matching connection", () => {
      useTaskHubStore.setState({
        connections: [
          {
            id: "c1",
            toolType: "notion",
            displayName: "A",
            lastSyncedAt: null,
            syncStatus: "idle",
            syncProgress: 0,
          },
        ],
      });
      useTaskHubStore.getState().removeConnection("c1");
      expect(useTaskHubStore.getState().connections).toHaveLength(0);
    });
  });

  describe("generateReport", () => {
    beforeEach(() => {
      useTaskHubStore.setState({ reportHistory: [] });
    });

    it("renders a known template and prepends it to history", () => {
      seed([
        {
          ...BASE_TASK,
          id: "t1",
          title: "実装",
          status: "in_progress",
          progress: 50,
          workHoursByDate: { [TODAY]: 3 },
        },
      ]);
      const result = useTaskHubStore.getState().generateReport("tpl-1");
      expect(result).not.toBeNull();
      expect(result?.templateName).toBe("業務日報");
      expect(result?.body).toContain("実装");
      expect(useTaskHubStore.getState().reportHistory[0]?.id).toBe(result?.id);
    });

    it("returns null for an unknown template id", () => {
      const result = useTaskHubStore.getState().generateReport("does-not-exist");
      expect(result).toBeNull();
      expect(useTaskHubStore.getState().reportHistory).toHaveLength(0);
    });
  });
});
