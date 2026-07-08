"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { login, register } from "@/lib/leaderboard-api";
import { updateState } from "@/lib/app-state";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthChange: (username: string, token: string) => void;
};

export function AuthDialog({ open, onOpenChange, onAuthChange }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    const result =
      tab === "login"
        ? await login(username.trim(), password)
        : await register(username.trim(), password);
    setLoading(false);

    if (result === null) {
      setError("Server unavailable — try again later");
      return;
    }
    if (typeof result === "string") {
      setError(result);
      return;
    }
    updateState((prev) => ({
      ...prev,
      user: { ...prev.user, username: result.username, token: result.token },
    }));
    onAuthChange(result.username, result.token);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to save your scores</DialogTitle>
          <DialogDescription>
            Your times appear on the leaderboard only when signed in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-0 border-b mb-4">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
              }}
              className={[
                "pb-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t === "login" ? "Log in" : "Register"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Input
            placeholder="Username"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={submit}
            disabled={loading || !username.trim() || password.length < 6}
          >
            {loading ? "…" : tab === "login" ? "Log in" : "Create account"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Play as guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
