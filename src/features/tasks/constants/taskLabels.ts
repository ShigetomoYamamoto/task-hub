import type { Priority, Task, TaskStatus } from "@/lib/mock/types";

type Source = Task["source"];

// ステータス（唯一の定義源） -----------------------------------------------

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  in_review: "レビュー中",
  done: "完了",
  cancelled: "保留",
};

/** バッジ用の light/dark 両対応スタイル */
export const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  in_review: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

/** ドット用（ステータスの 500 番系統の text / bg 色） */
export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: "bg-slate-500 text-slate-500",
  in_progress: "bg-blue-500 text-blue-500",
  in_review: "bg-amber-500 text-amber-500",
  done: "bg-emerald-500 text-emerald-500",
  cancelled: "bg-violet-500 text-violet-500",
};

// 優先度 -------------------------------------------------------------------

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};

/** Flag アイコンの色 */
export const PRIORITY_STYLES: Record<Priority, string> = {
  low: "text-slate-400",
  medium: "text-amber-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

// ソース -------------------------------------------------------------------

export const SOURCE_LABELS: Record<Source, string> = {
  notion: "Notion",
  gsheet: "GSheet",
  jira: "JIRA",
  manual: "手動",
};

/**
 * ソースバッジのスタイル。manual はバッジ非表示のため空文字。
 * 表示可否は呼び出し側で source === "manual" を判定する。
 */
export const SOURCE_STYLES: Record<Source, string> = {
  notion: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  gsheet:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  jira: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  manual: "",
};
