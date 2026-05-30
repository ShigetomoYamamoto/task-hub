// Temporary types — will be replaced by Prisma-generated types in Phase 3

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "cancelled";
export type Priority = "low" | "medium" | "high" | "urgent";

export type Subtask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  memo: string | null;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  dueDate: string | null;
  estimatedHours: number | null;
  workHoursByDate: Record<string, number>;
  subtasks: Subtask[];
  tags: Tag[];
  source: "manual" | "notion" | "gsheet" | "jira";
  externalUrl: string | null;
  listId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskList = {
  id: string;
  name: string;
  isInbox: boolean;
  projectId: string;
  tasks: Task[];
};

export type Project = {
  id: string;
  name: string;
  color: string;
  lists: TaskList[];
};

export type SyncStatus = "idle" | "running" | "completed" | "failed";

export type Connection = {
  id: string;
  toolType: "notion" | "gsheet" | "jira";
  displayName: string;
  lastSyncedAt: string | null;
  syncStatus: SyncStatus;
  syncProgress: number;
};

export type ReportTemplate = {
  id: string;
  name: string;
  body: string;
  isDefault: boolean;
};

export type ReportHistory = {
  id: string;
  templateName: string;
  generatedAt: string;
  body: string;
};
