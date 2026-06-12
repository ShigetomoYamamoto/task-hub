"use client";

import { Menu, Monitor, Moon, RefreshCw, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTaskHubStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  titleAccessory?: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
};

export function PageShell({ title, titleAccessory, actions, wide, children }: PageShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile nav Sheet when a sidebar link navigates to another route.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is intentionally a trigger, not a referenced value.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
            aria-label="メニューを開く"
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 max-w-[80vw] p-0" showCloseButton={false}>
            <Sidebar inSheet />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {titleAccessory}
          <h1 className="truncate text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-1.5">
          {actions}
          <SyncButton />
          <ThemeToggle />
          <UserAvatar />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className={cn("mx-auto w-full px-4 py-6 md:px-8", wide ? "max-w-none" : "max-w-5xl")}>
          {children}
        </div>
      </div>
    </>
  );
}

function SyncButton() {
  const syncing = useTaskHubStore((state) => state.syncing);
  const runSync = useTaskHubStore((state) => state.runSync);

  async function handleSync() {
    if (syncing) {
      return;
    }
    await runSync();
    const count = useTaskHubStore.getState().connections.length;
    toast.success(`同期が完了しました（${count} 接続）`);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      aria-label={syncing ? "同期中" : "同期する"}
      className="gap-1.5"
    >
      <RefreshCw size={15} className={syncing ? "animate-spin" : undefined} />
      <span className="hidden sm:inline">{syncing ? "同期中…" : "同期"}</span>
    </Button>
  );
}

const THEME_OPTIONS = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
  { value: "system", label: "システム", icon: Monitor },
] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="テーマを切り替える" disabled>
        <Sun size={15} />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" />}
        aria-label="テーマを切り替える"
      >
        <Sun size={15} className="scale-100 dark:scale-0" />
        <Moon size={15} className="absolute scale-0 dark:scale-100" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(theme === option.value && "text-foreground")}
            >
              <Icon />
              <span className="flex-1">{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserAvatar() {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white"
    >
      S
    </span>
  );
}
