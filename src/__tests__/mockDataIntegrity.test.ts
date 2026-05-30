import { describe, expect, it } from "vitest";
import { MOCK_INBOX_TASKS, MOCK_PROJECTS, MOCK_TAGS, MOCK_TODAY_TASKS } from "@/lib/mock/data";
import type { TaskStatus } from "@/lib/mock/types";

const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "in_review", "done", "cancelled"];
const INBOX_TASK_IDS = new Set(MOCK_INBOX_TASKS.map((t) => t.id));
const TAG_IDS = new Set(MOCK_TAGS.map((t) => t.id));

describe("Mock data integrity", () => {
  it("inbox tasks have unique non-empty IDs", () => {
    const ids = MOCK_INBOX_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it("inbox tasks have non-empty titles", () => {
    for (const t of MOCK_INBOX_TASKS) {
      expect(t.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("inbox tasks have valid statuses", () => {
    for (const t of MOCK_INBOX_TASKS) {
      expect(VALID_STATUSES).toContain(t.status);
    }
  });

  it("progress is between 0 and 100", () => {
    for (const t of MOCK_INBOX_TASKS) {
      expect(t.progress).toBeGreaterThanOrEqual(0);
      expect(t.progress).toBeLessThanOrEqual(100);
    }
  });

  it("externalUrl uses https when present", () => {
    for (const t of MOCK_INBOX_TASKS) {
      if (t.externalUrl !== null) {
        expect(t.externalUrl.startsWith("https://")).toBe(true);
      }
    }
  });

  it("today tasks are a subset of inbox tasks", () => {
    for (const t of MOCK_TODAY_TASKS) {
      expect(INBOX_TASK_IDS.has(t.id)).toBe(true);
    }
  });

  it("all projects have at least one list", () => {
    for (const p of MOCK_PROJECTS) {
      expect(p.lists.length).toBeGreaterThan(0);
    }
  });

  it("task tags reference known tag IDs", () => {
    for (const t of MOCK_INBOX_TASKS) {
      for (const tag of t.tags) {
        expect(TAG_IDS.has(tag.id)).toBe(true);
      }
    }
  });
});
