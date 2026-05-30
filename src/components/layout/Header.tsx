"use client";

import { Menu, Moon, RefreshCw, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

interface HeaderProps {
  title: string;
  onSync?: () => void;
  syncing?: boolean;
}

export function Header({ title, onSync, syncing }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-12 items-center gap-3 border-b bg-background px-4">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
          <Menu size={18} />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-56">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <h1 className="flex-1 text-base font-semibold">{title}</h1>

      <div className="flex items-center gap-1">
        {onSync && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={syncing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            同期
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun
            size={15}
            className="rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all"
          />
          <Moon
            size={15}
            className="absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all"
          />
        </Button>
      </div>
    </header>
  );
}
