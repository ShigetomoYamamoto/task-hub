import { describe, expect, it } from "vitest";
import { renderTemplate } from "@/lib/mock/renderTemplate";
import type { ReportTemplate, Task } from "@/lib/mock/types";

const DATE = "2026-06-05";

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
  listId: "list-inbox",
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
};

function tpl(body: string): ReportTemplate {
  return { id: "tpl-test", name: "テスト", body, isDefault: false };
}

describe("renderTemplate", () => {
  describe("{{date}}", () => {
    it("replaces with ctx.date", () => {
      const out = renderTemplate(tpl("日付: {{date}}"), { tasks: [], date: DATE });
      expect(out).toBe("日付: 2026-06-05");
    });
  });

  describe("{{today.totalHours}}", () => {
    it("sums work hours for the given date", () => {
      const tasks: Task[] = [
        { ...BASE_TASK, id: "a", workHoursByDate: { [DATE]: 2 } },
        { ...BASE_TASK, id: "b", workHoursByDate: { [DATE]: 1.5 } },
      ];
      const out = renderTemplate(tpl("{{today.totalHours}}"), { tasks, date: DATE });
      expect(out).toBe("3.5");
    });

    it("formats an integer total without decimals", () => {
      const tasks: Task[] = [{ ...BASE_TASK, id: "a", workHoursByDate: { [DATE]: 3 } }];
      const out = renderTemplate(tpl("{{today.totalHours}}"), { tasks, date: DATE });
      expect(out).toBe("3");
    });

    it("renders 0 when there are no hours", () => {
      const out = renderTemplate(tpl("{{today.totalHours}}"), { tasks: [], date: DATE });
      expect(out).toBe("0");
    });

    it("ignores hours logged on other dates", () => {
      const tasks: Task[] = [{ ...BASE_TASK, id: "a", workHoursByDate: { "2026-06-04": 5 } }];
      const out = renderTemplate(tpl("{{today.totalHours}}"), { tasks, date: DATE });
      expect(out).toBe("0");
    });
  });

  describe("{{today.workLog}}", () => {
    it("lists tasks with work hours today including status and progress", () => {
      const tasks: Task[] = [
        {
          ...BASE_TASK,
          id: "a",
          title: "実装",
          status: "in_progress",
          progress: 60,
          workHoursByDate: { [DATE]: 2 },
        },
      ];
      const out = renderTemplate(tpl("{{today.workLog}}"), { tasks, date: DATE });
      expect(out).toBe("- 実装（2h）[進行中 60%]");
    });

    it("excludes tasks with no hours today", () => {
      const tasks: Task[] = [{ ...BASE_TASK, id: "a", title: "ナシ" }];
      const out = renderTemplate(tpl("{{today.workLog}}"), { tasks, date: DATE });
      expect(out).toBe("（なし）");
    });
  });

  describe("{{today.plan}}", () => {
    it("lists tasks due today or in progress", () => {
      const tasks: Task[] = [
        { ...BASE_TASK, id: "a", title: "期限今日", dueDate: DATE },
        { ...BASE_TASK, id: "b", title: "進行中", status: "in_progress" },
        { ...BASE_TASK, id: "c", title: "関係なし" },
      ];
      const out = renderTemplate(tpl("{{today.plan}}"), { tasks, date: DATE });
      expect(out).toBe("- 期限今日\n- 進行中");
    });

    it("renders （なし） when nothing matches", () => {
      const out = renderTemplate(tpl("{{today.plan}}"), { tasks: [], date: DATE });
      expect(out).toBe("（なし）");
    });
  });

  describe("{{next.tasks}}", () => {
    it("lists incomplete tasks up to 5", () => {
      const tasks: Task[] = Array.from({ length: 7 }, (_, i) => ({
        ...BASE_TASK,
        id: `n${i}`,
        title: `タスク${i}`,
        status: "todo" as const,
      }));
      const out = renderTemplate(tpl("{{next.tasks}}"), { tasks, date: DATE });
      const lines = out.split("\n");
      expect(lines).toHaveLength(5);
      expect(lines[0]).toBe("- タスク0");
    });

    it("excludes done and cancelled tasks", () => {
      const tasks: Task[] = [
        { ...BASE_TASK, id: "a", title: "完了", status: "done" },
        { ...BASE_TASK, id: "b", title: "保留", status: "cancelled" },
      ];
      const out = renderTemplate(tpl("{{next.tasks}}"), { tasks, date: DATE });
      expect(out).toBe("（なし）");
    });
  });

  describe("{{assigned.tasks}}", () => {
    it("lists in-progress tasks with progress", () => {
      const tasks: Task[] = [
        { ...BASE_TASK, id: "a", title: "作業", status: "in_progress", progress: 40 },
        { ...BASE_TASK, id: "b", title: "未着手", status: "todo" },
      ];
      const out = renderTemplate(tpl("{{assigned.tasks}}"), { tasks, date: DATE });
      expect(out).toBe("- 作業（40%）");
    });
  });

  describe("unknown variables", () => {
    it("leaves unknown placeholders untouched", () => {
      const out = renderTemplate(tpl("{{mystery}} の値"), { tasks: [], date: DATE });
      expect(out).toBe("{{mystery}} の値");
    });
  });

  describe("multiple variables", () => {
    it("replaces several variables in one body", () => {
      const tasks: Task[] = [
        {
          ...BASE_TASK,
          id: "a",
          title: "実装",
          status: "in_progress",
          progress: 50,
          workHoursByDate: { [DATE]: 4 },
        },
      ];
      const body = "【{{date}}】計{{today.totalHours}}h\n{{today.workLog}}";
      const out = renderTemplate(tpl(body), { tasks, date: DATE });
      expect(out).toBe("【2026-06-05】計4h\n- 実装（4h）[進行中 50%]");
    });
  });
});
