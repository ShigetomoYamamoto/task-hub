// Shared relative-time / due-date formatting helpers (§6.7).
// Used by TaskRow, list footers and report history.

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export type DueTone = "overdue" | "today" | "normal";

export type DueDateInfo = {
  label: string;
  tone: DueTone;
};

/** Shared tone → text color classes for due-date labels (TaskRow / TaskDetailDrawer). */
export const DUE_TONE_CLASSES: Record<DueTone, string> = {
  overdue: "font-medium text-red-500",
  today: "font-medium text-amber-600",
  normal: "",
};

/** Formats hours so integers stay clean and decimals show one place. */
export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
}

/**
 * Formats an ISO datetime as a short relative label:
 * 「たった今」「3 分前」「2 時間前」「昨日」, otherwise a「M/D」date.
 * `now` is injectable for testing.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();

  if (Number.isNaN(diffMs)) {
    return "";
  }
  if (diffMs < MINUTE_MS) {
    return "たった今";
  }
  if (diffMs < HOUR_MS) {
    return `${Math.floor(diffMs / MINUTE_MS)} 分前`;
  }
  if (diffMs < DAY_MS) {
    return `${Math.floor(diffMs / HOUR_MS)} 時間前`;
  }
  if (diffMs < 2 * DAY_MS) {
    return "昨日";
  }
  return `${then.getMonth() + 1}/${then.getDate()}`;
}

/**
 * Classifies an ISO date relative to today and produces a display label.
 * 「今日」「明日」「昨日」for the near days, otherwise「M/D」.
 */
export function formatDueDate(iso: string, now: Date = new Date()): DueDateInfo {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) {
    return { label: "", tone: "normal" };
  }

  const dueStart = startOfDay(due);
  const todayStart = startOfDay(now);
  const diffDays = Math.round((dueStart.getTime() - todayStart.getTime()) / DAY_MS);

  if (diffDays < 0) {
    return { label: dayLabel(due, diffDays), tone: "overdue" };
  }
  if (diffDays === 0) {
    return { label: "今日", tone: "today" };
  }
  return { label: dayLabel(due, diffDays), tone: "normal" };
}

function dayLabel(date: Date, diffDays: number): string {
  if (diffDays === -1) {
    return "昨日";
  }
  if (diffDays === 1) {
    return "明日";
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
