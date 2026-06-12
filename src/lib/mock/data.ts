import { daysFromToday, isoAt, todayISO } from "./dates";
import type { Connection, Project, ReportHistory, ReportTemplate, Task, TaskList } from "./types";

export const MOCK_TAGS = [
  { id: "tag-1", name: "フロントエンド", color: "#3b82f6" },
  { id: "tag-2", name: "バックエンド", color: "#10b981" },
  { id: "tag-3", name: "デザイン", color: "#8b5cf6" },
  { id: "tag-4", name: "緊急", color: "#ef4444" },
];

const TAG_FRONTEND = MOCK_TAGS[0]!;
const TAG_BACKEND = MOCK_TAGS[1]!;
const TAG_DESIGN = MOCK_TAGS[2]!;
const TAG_URGENT = MOCK_TAGS[3]!;

const TODAY = todayISO();
const YESTERDAY = daysFromToday(-1);
const TWO_DAYS_AGO = daysFromToday(-2);

// Tasks that qualify for the "today" view (due today or in progress) all live
// in the inbox so MOCK_TODAY_TASKS stays a subset of MOCK_INBOX_TASKS.
export const MOCK_INBOX_TASKS: Task[] = [
  {
    id: "task-1",
    title: "TaskHub Phase 1 モック UI 実装",
    memo: "Next.js App Router でモックデータを使った全画面を構築する",
    status: "in_progress",
    priority: "high",
    progress: 60,
    dueDate: TODAY,
    estimatedHours: 8,
    workHoursByDate: { [YESTERDAY]: 2, [TODAY]: 3 },
    subtasks: [
      { id: "sub-1", title: "レイアウト実装", isCompleted: true },
      { id: "sub-2", title: "インボックス画面", isCompleted: true },
      { id: "sub-3", title: "タスク詳細 Drawer", isCompleted: false },
      { id: "sub-4", title: "今日の進捗画面", isCompleted: false },
    ],
    tags: [TAG_FRONTEND, TAG_BACKEND],
    source: "manual",
    externalUrl: null,
    listId: "list-inbox",
    createdAt: isoAt(-3, 9, 0),
    updatedAt: isoAt(0, 14, 0),
  },
  {
    id: "task-4",
    title: "API エンドポイント設計レビュー",
    memo: null,
    status: "done",
    priority: "high",
    progress: 100,
    dueDate: TODAY,
    estimatedHours: 3,
    workHoursByDate: { [TODAY]: 2 },
    subtasks: [],
    tags: [TAG_BACKEND],
    source: "manual",
    externalUrl: null,
    listId: "list-inbox",
    createdAt: isoAt(-4, 9, 0),
    updatedAt: isoAt(0, 16, 0),
  },
  {
    id: "task-5",
    title: "週次レポート作成",
    memo: null,
    status: "todo",
    priority: "medium",
    progress: 0,
    dueDate: YESTERDAY,
    estimatedHours: 1,
    workHoursByDate: {},
    subtasks: [],
    tags: [],
    source: "manual",
    externalUrl: null,
    listId: "list-inbox",
    createdAt: isoAt(-2, 8, 0),
    updatedAt: isoAt(-2, 8, 0),
  },
  {
    id: "task-6",
    title: "Supabase RLS ポリシー設計",
    memo: "行レベルセキュリティのポリシーを userId 起点で設計する",
    status: "in_progress",
    priority: "urgent",
    progress: 30,
    dueDate: TODAY,
    estimatedHours: 5,
    workHoursByDate: { [TODAY]: 1.5 },
    subtasks: [
      { id: "sub-6", title: "ポリシー一覧の洗い出し", isCompleted: true },
      { id: "sub-7", title: "テストケース作成", isCompleted: false },
    ],
    tags: [TAG_BACKEND],
    source: "notion",
    externalUrl: "https://notion.so/example-rls",
    listId: "list-inbox",
    createdAt: isoAt(-2, 10, 0),
    updatedAt: isoAt(0, 11, 0),
  },
];

const MOCK_PHASE1_TASKS: Task[] = [
  {
    id: "task-2",
    title: "Vercel Cron ジョブ設計",
    memo: null,
    status: "todo",
    priority: "medium",
    progress: 0,
    dueDate: daysFromToday(3),
    estimatedHours: 4,
    workHoursByDate: {},
    subtasks: [],
    tags: [TAG_BACKEND],
    source: "notion",
    externalUrl: "https://notion.so/example",
    listId: "list-phase1",
    createdAt: isoAt(-3, 10, 0),
    updatedAt: isoAt(-3, 10, 0),
  },
];

const MOCK_PHASE2_TASKS: Task[] = [
  {
    id: "task-3",
    title: "デザインシステム策定",
    memo: "shadcn/ui をベースに色・タイポグラフィを決定する",
    status: "in_review",
    priority: "low",
    progress: 80,
    dueDate: null,
    estimatedHours: 2,
    workHoursByDate: { [TWO_DAYS_AGO]: 1.5 },
    subtasks: [{ id: "sub-5", title: "カラーパレット決定", isCompleted: true }],
    tags: [TAG_DESIGN],
    source: "gsheet",
    externalUrl: null,
    listId: "list-phase2",
    createdAt: isoAt(-5, 9, 0),
    updatedAt: isoAt(-2, 11, 0),
  },
];

const MOCK_RESEARCH_TASKS: Task[] = [
  {
    id: "task-7",
    title: "LP ファーストビュー改善",
    memo: null,
    status: "todo",
    priority: "low",
    progress: 0,
    dueDate: daysFromToday(7),
    estimatedHours: 6,
    workHoursByDate: {},
    subtasks: [],
    tags: [TAG_DESIGN, TAG_FRONTEND],
    source: "manual",
    externalUrl: null,
    listId: "list-3",
    createdAt: isoAt(-1, 9, 0),
    updatedAt: isoAt(-1, 9, 0),
  },
  {
    id: "task-8",
    title: "同期エラーハンドリング実装",
    memo: "Provider 境界でのエラーをユーザー向けメッセージに変換する",
    status: "in_review",
    priority: "high",
    progress: 90,
    dueDate: daysFromToday(1),
    estimatedHours: 4,
    workHoursByDate: { [YESTERDAY]: 3 },
    subtasks: [],
    tags: [TAG_BACKEND, TAG_URGENT],
    source: "gsheet",
    externalUrl: null,
    listId: "list-3",
    createdAt: isoAt(-2, 13, 0),
    updatedAt: isoAt(0, 9, 30),
  },
];

// MOCK_TODAY_TASKS is derived (not hardcoded indices): due today or in progress.
export const MOCK_TODAY_TASKS: Task[] = MOCK_INBOX_TASKS.filter(
  (t) => t.dueDate === TODAY || t.status === "in_progress"
);

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
  tasks: MOCK_PHASE1_TASKS,
};

const MOCK_LIST_PHASE2: TaskList = {
  id: "list-phase2",
  name: "Phase 2",
  isInbox: false,
  projectId: "project-1",
  tasks: MOCK_PHASE2_TASKS,
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
        tasks: MOCK_RESEARCH_TASKS,
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
    lastSyncedAt: isoAt(0, 8, 30),
    syncStatus: "completed",
    syncProgress: 100,
  },
  {
    id: "conn-2",
    toolType: "gsheet",
    displayName: "Google Sheets — タスク管理表",
    lastSyncedAt: isoAt(-1, 18, 0),
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
    generatedAt: isoAt(-1, 18, 0),
    body: `【${YESTERDAY}業務報告】
■今日やったこと: 計5h
- TaskHub Phase 1 モック UI 実装（3h）[進行中 60%]
- デザインシステム策定（1.5h）[レビュー中 80%]

■勉強になったこと


■明日やること
- Vercel Cron ジョブ設計
- 週次レポート作成

■連絡事項
`,
  },
  {
    id: "hist-2",
    templateName: "作業開始報告",
    generatedAt: isoAt(-1, 9, 0),
    body: `【${YESTERDAY} 作業開始】
本日の予定:
- TaskHub Phase 1 モック UI 実装
- Supabase RLS ポリシー設計

担当タスク:
- TaskHub Phase 1 モック UI 実装（60%）
- Supabase RLS ポリシー設計（30%）
`,
  },
];
