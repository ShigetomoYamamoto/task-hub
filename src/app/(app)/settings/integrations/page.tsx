import { Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_CONNECTIONS } from "@/lib/mock/data";

const CATALOG = [
  {
    toolType: "notion",
    name: "Notion",
    description: "データベース・ページのタスクを同期",
    available: true,
  },
  {
    toolType: "gsheet",
    name: "Google スプレッドシート",
    description: "スプレッドシートのタスクを同期",
    available: true,
  },
  {
    toolType: "jira",
    name: "JIRA",
    description: "JIRA プロジェクトのタスクを同期",
    available: false,
  },
  {
    toolType: "linear",
    name: "Linear",
    description: "Linear チームのイシューを同期",
    available: false,
  },
  {
    toolType: "github",
    name: "GitHub Issues",
    description: "リポジトリのイシューを同期",
    available: false,
  },
] as const;

export default function IntegrationsPage() {
  return (
    <>
      <Header title="連携設定" />
      <div className="h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 p-4">
          {/* Active connections */}
          {MOCK_CONNECTIONS.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold">接続中</h2>
              <div className="space-y-2">
                {MOCK_CONNECTIONS.map((conn) => (
                  <Card key={conn.id}>
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                      <div>
                        <CardTitle className="text-sm">{conn.displayName}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {conn.lastSyncedAt
                            ? `最終同期: ${new Date(conn.lastSyncedAt).toLocaleString("ja-JP")}`
                            : "未同期"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {conn.syncStatus === "completed" ? "同期完了" : conn.syncStatus}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Catalog */}
          <section>
            <h2 className="mb-3 text-sm font-semibold">連携を追加</h2>
            <div className="space-y-2">
              {CATALOG.map((item) => (
                <Card key={item.toolType} className={!item.available ? "opacity-50" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                    <div>
                      <CardTitle className="text-sm">{item.name}</CardTitle>
                      <CardDescription className="text-xs">{item.description}</CardDescription>
                    </div>
                    {item.available ? (
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                        <Plus size={12} />
                        追加
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
