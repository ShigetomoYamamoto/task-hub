import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  /** Tailwind classes for the colored icon tile (bg + text). */
  iconClassName: string;
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  /** Optional content rendered below the value (e.g. a Progress bar). */
  children?: ReactNode;
}

/** Summary metric tile used on the「今日」page (§6.1). */
export function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  suffix,
  children,
}: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            iconClassName
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
          </p>
        </div>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </Card>
  );
}
