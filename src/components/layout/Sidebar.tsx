"use client";

import {
  CheckSquare,
  ChevronDown,
  FileText,
  History,
  Inbox,
  RefreshCw,
  Settings,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MOCK_PROJECTS } from "@/lib/mock/data";
import {
  selectInboxCount,
  selectListCount,
  selectTodayOpenCount,
  useTaskHubStore,
} from "@/lib/mock/store";
import { cn } from "@/lib/utils";

const NAV_ROW =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const SECTION_HEADING = "px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground";

export function Sidebar({ inSheet = false }: { inSheet?: boolean }) {
  const pathname = usePathname();
  const inboxCount = useTaskHubStore(selectInboxCount);
  const todayCount = useTaskHubStore(selectTodayOpenCount);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    () => new Set(["project-1"])
  );

  function toggleProject(id: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        inSheet ? "w-full" : "hidden w-60 shrink-0 md:flex"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
          <CheckSquare size={18} />
        </span>
        <span className="text-base font-semibold">TaskHub</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {/* Main */}
        <SidebarLink
          href="/inbox"
          icon={<Inbox size={16} />}
          label="インボックス"
          badge={inboxCount}
          active={pathname === "/inbox"}
        />
        <SidebarLink
          href="/today"
          icon={<Sun size={16} />}
          label="今日"
          badge={todayCount}
          active={pathname === "/today"}
        />

        {/* Reports */}
        <div className={SECTION_HEADING}>レポート</div>
        <SidebarLink
          href="/reports"
          icon={<FileText size={16} />}
          label="日報生成"
          active={pathname === "/reports"}
        />
        <SidebarLink
          href="/reports/history"
          icon={<History size={16} />}
          label="レポート履歴"
          active={pathname === "/reports/history"}
        />

        {/* Projects */}
        <div className={SECTION_HEADING}>プロジェクト</div>
        {MOCK_PROJECTS.map((project) => {
          const expanded = expandedProjects.has(project.id);
          const lists = project.lists.filter((list) => !list.isInbox);
          return (
            <div key={project.id}>
              <button
                type="button"
                onClick={() => toggleProject(project.id)}
                aria-expanded={expanded}
                className={cn(NAV_ROW, "w-full hover:bg-muted")}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 truncate text-left">{project.name}</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "shrink-0 text-muted-foreground transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              </button>
              {expanded && (
                <div className="mt-0.5 ml-3 space-y-0.5 border-l border-sidebar-border pl-2">
                  {lists.map((list) => (
                    <SidebarListLink
                      key={list.id}
                      projectId={project.id}
                      listId={list.id}
                      name={list.name}
                      active={pathname === `/projects/${project.id}/lists/${list.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="space-y-0.5 border-t border-sidebar-border px-2 py-3">
        <SidebarLink
          href="/settings/integrations"
          icon={<RefreshCw size={16} />}
          label="連携設定"
          active={pathname === "/settings/integrations"}
        />
        <SidebarLink
          href="/settings"
          icon={<Settings size={16} />}
          label="設定"
          active={pathname === "/settings"}
        />
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  badge,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        NAV_ROW,
        active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "hover:bg-muted"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
            active
              ? "bg-sidebar-accent-foreground/15 text-sidebar-accent-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function SidebarListLink({
  projectId,
  listId,
  name,
  active,
}: {
  projectId: string;
  listId: string;
  name: string;
  active: boolean;
}) {
  const count = useTaskHubStore((state) => selectListCount(state, listId));
  return (
    <Link
      href={`/projects/${projectId}/lists/${listId}`}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "hover:bg-muted"
      )}
    >
      <span className="flex-1 truncate">{name}</span>
      {count > 0 && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
    </Link>
  );
}
