import { STATUS_LABELS } from "@/features/tasks/constants/taskLabels";
import { formatHours } from "@/lib/format";
import type { ReportTemplate, Task } from "./types";

export type RenderContext = {
  tasks: Task[];
  date: string;
};

const EMPTY = "（なし）";
const NEXT_TASKS_LIMIT = 5;

/**
 * Renders a report template by substituting `{{変数}}` placeholders with
 * values derived from the given tasks and date (FR-20 mock implementation).
 * Unknown placeholders are left untouched.
 */
export function renderTemplate(template: ReportTemplate, ctx: RenderContext): string {
  const resolvers = buildResolvers(ctx);
  return template.body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) => {
    const resolver = resolvers[key];
    return resolver ? resolver() : match;
  });
}

function buildResolvers(ctx: RenderContext): Record<string, () => string> {
  const { tasks, date } = ctx;
  return {
    date: () => date,
    "today.totalHours": () => formatHours(totalHoursOn(tasks, date)),
    "today.workLog": () => orEmpty(workLogLines(tasks, date)),
    "today.plan": () => orEmpty(planLines(tasks, date)),
    "next.tasks": () => orEmpty(nextTaskLines(tasks)),
    "assigned.tasks": () => orEmpty(assignedTaskLines(tasks)),
  };
}

function totalHoursOn(tasks: Task[], date: string): number {
  return tasks.reduce((sum, t) => sum + (t.workHoursByDate[date] ?? 0), 0);
}

function workLogLines(tasks: Task[], date: string): string[] {
  return tasks
    .filter((t) => (t.workHoursByDate[date] ?? 0) > 0)
    .map((t) => {
      const hours = formatHours(t.workHoursByDate[date] ?? 0);
      return `- ${t.title}（${hours}h）[${STATUS_LABELS[t.status]} ${t.progress}%]`;
    });
}

function planLines(tasks: Task[], date: string): string[] {
  return tasks
    .filter((t) => t.dueDate === date || t.status === "in_progress")
    .map((t) => `- ${t.title}`);
}

function nextTaskLines(tasks: Task[]): string[] {
  return tasks
    .filter((t) => t.status !== "done" && t.status !== "cancelled")
    .slice(0, NEXT_TASKS_LIMIT)
    .map((t) => `- ${t.title}`);
}

function assignedTaskLines(tasks: Task[]): string[] {
  return tasks
    .filter((t) => t.status === "in_progress")
    .map((t) => `- ${t.title}（${t.progress}%）`);
}

function orEmpty(lines: string[]): string {
  return lines.length > 0 ? lines.join("\n") : EMPTY;
}
