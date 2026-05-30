import { Copy } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_REPORT_HISTORY } from "@/lib/mock/data";

export default function ReportHistoryPage() {
  return (
    <>
      <Header title="レポート履歴" />
      <div className="h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-3 p-4">
          {MOCK_REPORT_HISTORY.map((report) => (
            <Card key={report.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
                <div>
                  <CardTitle className="text-sm">{report.templateName}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(report.generatedAt).toLocaleString("ja-JP")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Markdown
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Copy size={12} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-3 bg-muted/30 rounded p-2">
                  {report.body}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
