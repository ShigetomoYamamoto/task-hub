"use client";

import { CheckCircle2, CheckSquare, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HIGHLIGHTS = [
  "Notion・Google Sheets と同期",
  "今日やることに集中",
  "日報をワンクリック生成",
] as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (email.trim() === "") return;
    setSent(true);
  }

  function handleReset() {
    setSent(false);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <HeroPanel />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {sent ? (
            <SentState email={email} onReset={handleReset} />
          ) : (
            <FormState email={email} onEmailChange={setEmail} onSubmit={handleSubmit} />
          )}
          <p className="text-center text-xs text-muted-foreground">このアプリは招待制です。</p>
        </div>
      </div>
    </div>
  );
}

function HeroPanel() {
  return (
    <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-12 text-white lg:flex">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur"
        >
          <CheckSquare className="size-5" />
        </span>
        <span className="text-lg font-semibold">TaskHub</span>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">タスクを、ぜんぶ一箇所に。</h1>
          <p className="max-w-sm text-sm text-white/80">
            外部ツールに散らばったタスクを集約し、今日やることに集中して、振り返りまでをワンストップで。
          </p>
        </div>
        <ul className="space-y-3">
          {HIGHLIGHTS.map((highlight) => (
            <li key={highlight} className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className="size-5 shrink-0 text-white/90" aria-hidden="true" />
              {highlight}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-white/60">© TaskHub</p>
    </div>
  );
}

interface FormStateProps {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

function FormState({ email, onEmailChange, onSubmit }: FormStateProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">おかえりなさい</h2>
        <p className="text-sm text-muted-foreground">
          登録済みのメールアドレスに Magic Link を送信します。
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <Button type="submit" className="w-full gap-2">
          <Mail className="size-4" aria-hidden="true" />
          Magic Link を送信
        </Button>
      </form>
    </div>
  );
}

interface SentStateProps {
  email: string;
  onReset: () => void;
}

function SentState({ email, onReset }: SentStateProps) {
  return (
    <div className="space-y-6 text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
      >
        <CheckCircle2 className="size-7" />
      </span>
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">メールを確認してください</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{email}</span>{" "}
          に届いたリンクをクリックしてサインインしてください。
        </p>
      </div>
      <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
        別のメールアドレスでやり直す
      </Button>
    </div>
  );
}
