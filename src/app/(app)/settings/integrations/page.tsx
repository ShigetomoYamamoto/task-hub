"use client";

import { type LucideIcon, Plug, Plus, RefreshCw, Table, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SyncIndicator } from "@/features/sync/components/SyncIndicator";
import { formatRelativeTime } from "@/lib/format";
import { useTaskHubStore } from "@/lib/mock/store";
import type { Connection } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

type AvailableToolType = Connection["toolType"];

type CatalogItem = {
  toolType: string;
  name: string;
  description: string;
  available: boolean;
};

const CATALOG: readonly CatalogItem[] = [
  {
    toolType: "notion",
    name: "Notion",
    description: "データベース・ページのタスクを同期します。",
    available: true,
  },
  {
    toolType: "gsheet",
    name: "Google スプレッドシート",
    description: "スプレッドシートのタスクを同期します。",
    available: true,
  },
  {
    toolType: "jira",
    name: "JIRA",
    description: "JIRA プロジェクトのイシューを同期します。",
    available: false,
  },
  {
    toolType: "linear",
    name: "Linear",
    description: "Linear チームのイシューを同期します。",
    available: false,
  },
  {
    toolType: "asana",
    name: "Asana",
    description: "Asana のタスクを同期します。",
    available: false,
  },
  {
    toolType: "trello",
    name: "Trello",
    description: "Trello のカードを同期します。",
    available: false,
  },
  {
    toolType: "github",
    name: "GitHub Issues",
    description: "リポジトリのイシューを同期します。",
    available: false,
  },
] as const;

/** A solid "N" glyph used as the Notion tool tile. */
function NotionGlyph() {
  return (
    <span aria-hidden="true" className="text-lg font-bold leading-none">
      N
    </span>
  );
}

const TOOL_TILE: Record<
  AvailableToolType,
  { className: string; icon?: LucideIcon; glyph?: () => React.ReactNode }
> = {
  notion: { className: "bg-zinc-900 text-white", glyph: NotionGlyph },
  gsheet: { className: "bg-emerald-500 text-white", icon: Table },
  jira: { className: "bg-blue-500 text-white", icon: Plug },
};

function isAvailableToolType(toolType: string): toolType is AvailableToolType {
  return toolType === "notion" || toolType === "gsheet" || toolType === "jira";
}

function ToolTile({ toolType }: { toolType: string }) {
  const tile = isAvailableToolType(toolType) ? TOOL_TILE[toolType] : null;
  const Icon = tile?.icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        tile?.className ?? "bg-muted text-muted-foreground"
      )}
    >
      {tile?.glyph ? (
        tile.glyph()
      ) : Icon ? (
        <Icon className="size-5" />
      ) : (
        <Plug className="size-5" />
      )}
    </span>
  );
}

export default function IntegrationsPage() {
  const connections = useTaskHubStore((state) => state.connections);

  return (
    <PageShell title="連携設定">
      <div className="space-y-8">
        <ActiveConnectionsSection connections={connections} />
        <CatalogSection />
      </div>
    </PageShell>
  );
}

function ActiveConnectionsSection({ connections }: { connections: Connection[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">接続中</h2>
        <p className="text-xs text-muted-foreground">同期済みの外部ツールです。</p>
      </div>
      {connections.length > 0 ? (
        <div className="space-y-3">
          {connections.map((conn) => (
            <ConnectionCard key={conn.id} connection={conn} />
          ))}
        </div>
      ) : (
        <Card className="p-0">
          <EmptyState
            icon={Plug}
            title="接続中のツールはありません"
            description="下の一覧から連携を追加してください。"
          />
        </Card>
      )}
    </section>
  );
}

function ConnectionCard({ connection }: { connection: Connection }) {
  const runSync = useTaskHubStore((state) => state.runSync);
  const removeConnection = useTaskHubStore((state) => state.removeConnection);
  const syncing = useTaskHubStore((state) => state.syncing);

  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSync() {
    if (syncing) return;
    await runSync();
    toast.success("同期が完了しました");
  }

  function handleRemove() {
    removeConnection(connection.id);
    setConfirmOpen(false);
    toast.success("接続を削除しました");
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToolTile toolType={connection.toolType} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{connection.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {connection.lastSyncedAt
              ? `最終同期 ${formatRelativeTime(connection.lastSyncedAt)}`
              : "未同期"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncIndicator connectionId={connection.id} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} aria-hidden="true" />
            同期
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmOpen(true)}
            aria-label={`${connection.displayName} を削除`}
            className="text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>接続を削除しますか？</DialogTitle>
            <DialogDescription>
              「{connection.displayName}」との連携を解除します。同期済みのタスクはそのまま残ります。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
            <Button variant="destructive" onClick={handleRemove}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CatalogSection() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">連携を追加</h2>
        <p className="text-xs text-muted-foreground">対応ツールを選んで接続します。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CATALOG.map((item) =>
          item.available ? (
            <AvailableCatalogCard key={item.toolType} item={item} />
          ) : (
            <ComingSoonCatalogCard key={item.toolType} item={item} />
          )
        )}
      </div>
    </section>
  );
}

function AvailableCatalogCard({ item }: { item: CatalogItem }) {
  const addConnection = useTaskHubStore((state) => state.addConnection);

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [token, setToken] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setDisplayName("");
      setToken("");
    }
  }

  function handleConnect() {
    const trimmed = displayName.trim();
    if (trimmed === "" || !isAvailableToolType(item.toolType)) return;
    addConnection({ toolType: item.toolType, displayName: trimmed });
    handleOpenChange(false);
    toast.success("接続を追加しました");
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <ToolTile toolType={item.toolType} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
        </div>
      </div>
      <Button variant="outline" onClick={() => setOpen(true)} className="mt-3 w-full gap-1.5">
        <Plus className="size-4" aria-hidden="true" />
        追加
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{item.name} を接続</DialogTitle>
            <DialogDescription>接続名とアクセストークンを入力してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`name-${item.toolType}`}>接続名</Label>
              <Input
                id={`name-${item.toolType}`}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={`${item.name} — 個人ワークスペース`}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`token-${item.toolType}`}>アクセストークン</Label>
              <Input
                id={`token-${item.toolType}`}
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="••••••••••••"
              />
              <p className="text-xs text-muted-foreground">
                トークンは安全に保管され、外部に共有されません。
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
            <Button onClick={handleConnect} disabled={displayName.trim() === ""}>
              接続する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ComingSoonCatalogCard({ item }: { item: CatalogItem }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl text-left opacity-60 transition-opacity hover:opacity-80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <ToolTile toolType={item.toolType} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{item.name}</p>
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>
        </Card>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{item.name} は今後対応予定です</DialogTitle>
            <DialogDescription>{item.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>閉じる</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
