import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/mock/types";

function calcTotalWorkHours(tasks: Task[], date: string): number {
  return tasks.reduce((sum, t) => sum + (t.workHoursByDate[date] ?? 0), 0);
}

function calcCompletedCount(tasks: Task[]): number {
  return tasks.filter((t) => t.status === "done").length;
}

function calcCompletionRate(completedCount: number, total: number): number {
  return total > 0 ? Math.round((completedCount / total) * 100) : 0;
}

const BASE_TASK: Task = {
  id: "t1",
  title: "Test task",
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
  listId: "list-1",
  createdAt: "2026-05-25T00:00:00Z",
  updatedAt: "2026-05-25T00:00:00Z",
};

describe("TodayPage calculation logic", () => {
  describe("calcTotalWorkHours", () => {
    it("sums work hours for the given date", () => {
      const tasks: Task[] = [
        { ...BASE_TASK, id: "t1", workHoursByDate: { "2026-05-25": 3 } },
        { ...BASE_TASK, id: "t2", workHoursByDate: { "2026-05-25": 2.5 } },
      ];
      expect(calcTotalWorkHours(tasks, "2026-05-25")).toBe(5.5);
    });

    it("skips tasks with no entry for the given date", () => {
      const tasks: Task[] = [{ ...BASE_TASK, id: "t1", workHoursByDate: { "2026-05-24": 5 } }];
      expect(calcTotalWorkHours(tasks, "2026-05-25")).toBe(0);
    });

    it("returns 0 for empty task list", () => {
      expect(calcTotalWorkHours([], "2026-05-25")).toBe(0);
    });
  });

  describe("calcCompletedCount", () => {
    it("counts only done tasks", () => {
      const tasks: Task[] = [
        { ...BASE_TASK, id: "t1", status: "done" },
        { ...BASE_TASK, id: "t2", status: "in_progress" },
        { ...BASE_TASK, id: "t3", status: "done" },
      ];
      expect(calcCompletedCount(tasks)).toBe(2);
    });

    it("returns 0 when no tasks are done", () => {
      const tasks: Task[] = [{ ...BASE_TASK, id: "t1", status: "todo" }];
      expect(calcCompletedCount(tasks)).toBe(0);
    });
  });

  describe("calcCompletionRate", () => {
    it("rounds to nearest integer", () => {
      expect(calcCompletionRate(1, 3)).toBe(33);
    });

    it("returns 100 when all tasks are done", () => {
      expect(calcCompletionRate(5, 5)).toBe(100);
    });

    it("returns 0 when total is 0", () => {
      expect(calcCompletionRate(0, 0)).toBe(0);
    });
  });
});
