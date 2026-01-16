"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadState, updateState } from "@/lib/appState";

type Props = {
  onSaved?: (username: string) => void;
};

export function UsernameDialog({ onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    const state = loadState();
    if (state.user.username?.trim()) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, []);

  const save = () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) return;

    updateState((prev) => ({
      ...prev,
      user: { ...prev.user, username: trimmed },
    }));

    onSaved?.(trimmed);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        const current = loadState().user.username?.trim();
        if (!current) setOpen(true);
        else setOpen(nextOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Let’s get started 🚀</DialogTitle>
          <DialogDescription>
            Enter a username to save your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
            }}
          />
          <Button onClick={save} disabled={!usernameInput.trim()}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
