import type { Connection, Project, ReportHistory, ReportTemplate, Task, TaskList } from "./types";

export const MOCK_TAGS = [
  { id: "tag-1", name: "フロントエンド", color: "#3b82f6" },
  { id: "tag-2", name: "バックエンド", color: "#10b981" },
  { id: "tag-3", name: "デザイン", color: "#8b5cf6" },
  { id: "tag-4", name: "緊急", color: "#ef4444" },
];

export const MOCK_INBOX_TASKS: Task[] = [
  {
    id: "task-1",
    title: "TaskHub Phase 1 モック UI 実装",
    memo: "Next.js App Router でモックデータを使った全画面を構築する",
    status: "in_progress",
    priority: "high",
    progress: 60,
    dueDate: "2026-05-30",
    estimatedHours: 8,
    workHoursByDate: { "2026-05-25": 3, "2026-05-26": 2 },
    subtasks: [
      { id: "sub-1", title: "レイアウト実装", isCompleted: true },
      { id: "sub-2", title: "インボックス画面", isCompleted: true },
      { id: "sub-3", title: "タスク詳細 Drawer", isCompleted: false },
      { id: "sub-4", title: "今日の進捗画面", isCompleted: false },
    ],
    tags: [MOCK_TAGS[0]!, MOCK_TAGS[1]!],
    source: "manual",
    externalUrl: null,
    listId: "list-inbox",
    createdAt: "2026-05-25T09:00:00Z",
    updatedAt: "2026-05-25T14:00:00Z",
  },
  {
    id: "task-2",
    title: "Vercel Cron ジョブ設計",
    memo: null,
    status: "todo",
    priority: "medium",
    progress: 0,
    dueDate: "2026-06-01",
    estimatedHours: 4,
    workHoursByDate: {},
    subtasks: [],
    tags: [MOCK_TAGS[1]!],
    source: "notion",
    externalUrl: "https://notion.so/example",
    listId: "list-inbox",
    createdAt: "2026-05-25T10:00:00Z",
    updatedAt: "2026-05-25T10:00:00Z",
  },
  {
    id: "task-3",
    title: "デザインシステム策定",
    memo: "shadcn/ui をベースに色・タイポグラフィを決定する",
    status: "in_review",
    priority: "low",
    progress: 80,
    dueDate: null,
    estimatedHours: 2,
    workHoursByDate: { "2026-05-24": 1.5 },
    subtasks: [{ id: "sub-5", title: "カラーパレット決定", isCompleted: true }],
    tags: [MOCK_TAGS[2]!],
    source: "gsheet",
    externalUrl: null,
    listId: "list-inbox",
    createdAt: "2026-05-24T09:00:00Z",
    updatedAt: "2026-05-25T11:00:00Z",
  },
  {
    id: "task-4",
    title: "API エンドポイント設計レビュー",
    memo: null,
    status: "done",
    priority: "high",
    progress: 100,
    dueDate: "2026-05-25",
    estimatedHours: 3,
    workHoursByDate: { "2026-05-25": 3 },
    subtasks: [],
    tags: [MOCK_TAGS[1]!],
    source: "manual",
    externalUrl: null,
    listId: "list-inbox",
    createdAt: "2026-05-23T09:00:00Z",
    updatedAt: "2026-05-25T16:00:00Z",
  },
  {
    id: "task-5",
    title: "週次レポート作成",
    memo: null,
    status: "todo",
    priority: "medium",
    progress: 0,
    dueDate: "2026-05-26",
    estimatedHours: 1,
    workHoursByDate: {},
    subtasks: [],
    tags: [],
    source: "manual",
    externalUrl: null,
    listId: "list-inbox",
    createdAt: "2026-05-25T08:00:00Z",
    updatedAt: "2026-05-25T08:00:00Z",
  },
];

export const MOCK_TODAY_TASKS: Task[] = [
  MOCK_INBOX_TASKS[0]!,
  MOCK_INBOX_TASKS[3]!,
  MOCK_INBOX_TASKS[4]!,
];

const MOCK_INBOX_LIST: TaskList = {
  id: "list-inbox",
  name: "インボックス",
  isInbox: true,
  projectId: "project-1",
  tasks: MOCK_INBOX_TASKS,
};

const MOCK_LIST_PHASE1: TaskList = {
  id: "list-phase1",
  name: "Phase 1",
  isInbox: false,
  projectId: "project-1",
  tasks: [MOCK_INBOX_TASKS[0]!, MOCK_INBOX_TASKS[1]!],
};

const MOCK_LIST_PHASE2: TaskList = {
  id: "list-phase2",
  name: "Phase 2",
  isInbox: false,
  projectId: "project-1",
  tasks: [MOCK_INBOX_TASKS[2]!],
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "project-1",
    name: "TaskHub 開発",
    color: "#3b82f6",
    lists: [MOCK_INBOX_LIST, MOCK_LIST_PHASE1, MOCK_LIST_PHASE2],
  },
  {
    id: "project-2",
    name: "AI エージェント",
    color: "#10b981",
    lists: [
      {
        id: "list-3",
        name: "リサーチ",
        isInbox: false,
        projectId: "project-2",
        tasks: [],
      },
    ],
  },
  {
    id: "project-3",
    name: "クライアント A",
    color: "#8b5cf6",
    lists: [
      {
        id: "list-4",
        name: "バックログ",
        isInbox: false,
        projectId: "project-3",
        tasks: [],
      },
    ],
  },
];

export const MOCK_CONNECTIONS: Connection[] = [
  {
    id: "conn-1",
    toolType: "notion",
    displayName: "Notion — 個人ワークスペース",
    lastSyncedAt: "2026-05-25T14:30:00Z",
    syncStatus: "completed",
    syncProgress: 100,
  },
  {
    id: "conn-2",
    toolType: "gsheet",
    displayName: "Google Sheets — タスク管理表",
    lastSyncedAt: "2026-05-25T13:00:00Z",
    syncStatus: "completed",
    syncProgress: 100,
  },
];

export const MOCK_TEMPLATES: ReportTemplate[] = [
  {
    id: "tpl-1",
    name: "業務日報",
    isDefault: true,
    body: `【{{date}}業務報告】
■今日やったこと: 計{{today.totalHours}}h
{{today.workLog}}

■勉強になったこと


■明日やること
{{next.tasks}}

■連絡事項
`,
  },
  {
    id: "tpl-2",
    name: "作業開始報告",
    isDefault: false,
    body: `【{{date}} 作業開始】
本日の予定:
{{today.plan}}

担当タスク:
{{assigned.tasks}}
`,
  },
];

export const MOCK_REPORT_HISTORY: ReportHistory[] = [
  {
    id: "hist-1",
    templateName: "業務日報",
    generatedAt: "2026-05-24T18:00:00Z",
    body: "【2026-05-24業務報告】\n■今日やったこと: 計5h\n...",
  },
  {
    id: "hist-2",
    templateName: "作業開始報告",
    generatedAt: "2026-05-24T09:00:00Z",
    body: "【2026-05-24 作業開始】\n本日の予定:\n...",
  },
];
