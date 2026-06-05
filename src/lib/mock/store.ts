import { create } from "zustand";
import { MOCK_CONNECTIONS, MOCK_PROJECTS, MOCK_REPORT_HISTORY, MOCK_TEMPLATES } from "./data";
import { todayISO } from "./dates";
import { renderTemplate } from "./renderTemplate";
import type { Connection, Priority, ReportHistory, Task, TaskStatus } from "./types";

const INBOX_LIST_ID = "list-inbox";
const SYNC_DURATION_MS = 1800;
const SYNC_STEPS = 6;

/**
 * Flattens every list across all projects into the canonical task array.
 * Tasks are shallow-copied so store updates can never touch the mock fixtures.
 */
function initialTasks(): Task[] {
  return MOCK_PROJECTS.flatMap((project) =>
    project.lists.flatMap((list) => list.tasks.map((task) => ({ ...task })))
  );
}

export type AddTaskInput = {
  title: string;
  listId: string;
};

export type AddConnectionInput = {
  toolType: Connection["toolType"];
  displayName: string;
};

export type TaskHubState = {
  tasks: Task[];
  connections: Connection[];
  reportHistory: ReportHistory[];
  syncing: boolean;

  toggleTaskDone: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  setTaskPriority: (id: string, priority: Priority) => void;
  setTaskProgress: (id: string, progress: number) => void;
  setWorkHours: (id: string, dateISO: string, hours: number) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addTask: (input: AddTaskInput) => void;
  removeConnection: (id: string) => void;
  addConnection: (input: AddConnectionInput) => void;
  runSync: () => Promise<void>;
  generateReport: (templateId: string) => ReportHistory | null;
};

function clampProgress(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Applies an immutable update to the task matching `id`. */
function mapTask(tasks: Task[], id: string, update: (task: Task) => Task): Task[] {
  return tasks.map((task) => (task.id === id ? update(task) : task));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const useTaskHubStore = create<TaskHubState>()((set, get) => ({
  tasks: initialTasks(),
  connections: MOCK_CONNECTIONS.map((conn) => ({ ...conn })),
  reportHistory: MOCK_REPORT_HISTORY.map((history) => ({ ...history })),
  syncing: false,

  toggleTaskDone: (id) =>
    set((state) => ({
      tasks: mapTask(state.tasks, id, (task) =>
        task.status === "done"
          ? { ...task, status: "todo" }
          : { ...task, status: "done", progress: 100 }
      ),
    })),

  setTaskStatus: (id, status) =>
    set((state) => ({
      tasks: mapTask(state.tasks, id, (task) => ({
        ...task,
        status,
        progress: status === "done" ? 100 : task.progress,
      })),
    })),

  setTaskPriority: (id, priority) =>
    set((state) => ({
      tasks: mapTask(state.tasks, id, (task) => ({ ...task, priority })),
    })),

  setTaskProgress: (id, progress) =>
    set((state) => ({
      tasks: mapTask(state.tasks, id, (task) => ({
        ...task,
        progress: clampProgress(progress),
      })),
    })),

  setWorkHours: (id, dateISO, hours) =>
    set((state) => ({
      tasks: mapTask(state.tasks, id, (task) => {
        if (hours <= 0) {
          const { [dateISO]: _removed, ...rest } = task.workHoursByDate;
          return { ...task, workHoursByDate: rest };
        }
        return {
          ...task,
          workHoursByDate: { ...task.workHoursByDate, [dateISO]: hours },
        };
      }),
    })),

  toggleSubtask: (taskId, subtaskId) =>
    set((state) => ({
      tasks: mapTask(state.tasks, taskId, (task) => ({
        ...task,
        subtasks: task.subtasks.map((sub) =>
          sub.id === subtaskId ? { ...sub, isCompleted: !sub.isCompleted } : sub
        ),
      })),
    })),

  addTask: ({ title, listId }) =>
    set((state) => {
      const now = new Date().toISOString();
      const newTask: Task = {
        id: `task-${crypto.randomUUID()}`,
        title,
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
        listId,
        createdAt: now,
        updatedAt: now,
      };
      return { tasks: [newTask, ...state.tasks] };
    }),

  removeConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
    })),

  addConnection: ({ toolType, displayName }) =>
    set((state) => {
      const newConnection: Connection = {
        id: `conn-${crypto.randomUUID()}`,
        toolType,
        displayName,
        lastSyncedAt: null,
        syncStatus: "idle",
        syncProgress: 0,
      };
      return { connections: [...state.connections, newConnection] };
    }),

  runSync: async () => {
    if (get().syncing) {
      return;
    }
    set((state) => ({
      syncing: true,
      connections: state.connections.map((conn) => ({
        ...conn,
        syncStatus: "running",
        syncProgress: 0,
      })),
    }));

    const stepMs = SYNC_DURATION_MS / SYNC_STEPS;
    for (let step = 1; step <= SYNC_STEPS; step += 1) {
      await delay(stepMs);
      const progress = Math.round((step / SYNC_STEPS) * 100);
      set((state) => ({
        connections: state.connections.map((conn) => ({ ...conn, syncProgress: progress })),
      }));
    }

    const now = new Date().toISOString();
    set((state) => ({
      syncing: false,
      connections: state.connections.map((conn) => ({
        ...conn,
        syncStatus: "completed",
        syncProgress: 100,
        lastSyncedAt: now,
      })),
    }));
  },

  generateReport: (templateId) => {
    const template = MOCK_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return null;
    }
    const date = todayISO();
    const body = renderTemplate(template, { tasks: get().tasks, date });
    const history: ReportHistory = {
      id: `hist-${crypto.randomUUID()}`,
      templateName: template.name,
      generatedAt: new Date().toISOString(),
      body,
    };
    set((state) => ({ reportHistory: [history, ...state.reportHistory] }));
    return history;
  },
}));

// --- Pure task filters ---
// Components should subscribe to the stable `state.tasks` array and derive
// with these helpers inside `useMemo`. Never pass an array-returning selector
// straight to `useTaskHubStore` — `.filter()` creates a new reference every
// call, which makes useSyncExternalStore loop forever (Zustand v5 + React 19).

export function filterInboxTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.listId === INBOX_LIST_ID);
}

export function filterTodayTasks(tasks: Task[]): Task[] {
  const today = todayISO();
  return tasks.filter((task) => task.dueDate === today || task.status === "in_progress");
}

export function filterListTasks(tasks: Task[], listId: string): Task[] {
  return tasks.filter((task) => task.listId === listId);
}

// --- Selectors (module functions) ---
// Array-returning selectors are for one-shot reads (tests, getState()) only —
// see the warning above before using them with useTaskHubStore.

export function selectInboxTasks(state: TaskHubState): Task[] {
  return filterInboxTasks(state.tasks);
}

export function selectTodayTasks(state: TaskHubState): Task[] {
  return filterTodayTasks(state.tasks);
}

export function selectListTasks(state: TaskHubState, listId: string): Task[] {
  return filterListTasks(state.tasks, listId);
}

/** Sidebar badge: total tasks in the inbox. */
export function selectInboxCount(state: TaskHubState): number {
  return selectInboxTasks(state).length;
}

/** Sidebar badge: incomplete tasks in the today view. */
export function selectTodayOpenCount(state: TaskHubState): number {
  return selectTodayTasks(state).filter(
    (task) => task.status !== "done" && task.status !== "cancelled"
  ).length;
}

/** Tasks belonging to the given list id (for project list views). */
export function selectListCount(state: TaskHubState, listId: string): number {
  return selectListTasks(state, listId).length;
}
