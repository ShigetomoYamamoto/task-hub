"use client";

import { ChevronDown, Inbox, LayoutDashboard, RefreshCw, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MOCK_PROJECTS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(["project-1"]));

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
    <aside className="flex h-full w-56 flex-col border-r bg-muted/30 px-2 py-3">
      {/* App logo */}
      <div className="mb-4 px-2 text-lg font-bold tracking-tight">TaskHub</div>

      {/* Fixed views */}
      <nav className="mb-4 space-y-0.5">
        <SidebarLink
          href="/inbox"
          icon={<Inbox size={15} />}
          label="インボックス"
          badge={5}
          active={pathname === "/inbox"}
        />
        <SidebarLink
          href="/today"
          icon={<Sun size={15} />}
          label="今日"
          badge={3}
          active={pathname === "/today"}
        />
      </nav>

      <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        プロジェクト
      </div>

      {/* Projects */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {MOCK_PROJECTS.map((project) => (
          <div key={project.id}>
            <button
              type="button"
              onClick={() => toggleProject(project.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="flex-1 truncate text-left">{project.name}</span>
              <ChevronDown
                size={12}
                className={cn(
                  "transition-transform text-muted-foreground",
                  expandedProjects.has(project.id) && "rotate-180"
                )}
              />
            </button>
            {expandedProjects.has(project.id) && (
              <div className="ml-4 space-y-0.5 border-l pl-2">
                {project.lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/projects/${project.id}/lists/${list.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1 text-sm",
                      pathname === `/projects/${project.id}/lists/${list.id}`
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                  >
                    <LayoutDashboard size={13} className="flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">{list.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="mt-2 space-y-0.5 border-t pt-2">
        <SidebarLink
          href="/settings/integrations"
          icon={<RefreshCw size={15} />}
          label="連携設定"
          active={pathname === "/settings/integrations"}
        />
        <SidebarLink
          href="/settings"
          icon={<Settings size={15} />}
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
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[11px] font-semibold",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
