"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">TaskHub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Magic Link でサインイン
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border bg-muted/30 p-6 text-center">
            <Mail className="mx-auto mb-3 text-primary" size={32} />
            <p className="text-sm font-medium">メールを送信しました</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {email} に届いたリンクをクリックしてサインインしてください。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full gap-2">
              <Mail size={15} />
              Magic Link を送信
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          このアプリは招待制です。
        </p>
      </div>
    </div>
  );
}
