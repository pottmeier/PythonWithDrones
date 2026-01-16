"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadState, saveState, defaultState } from "@/lib/appState";

type Props = {
  username: string;
  setUsername: (name: string) => void;
  onRequireUsername?: () => void;
};

export function UserMenu({ username, setUsername, onRequireUsername }: Props) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(username);

  useEffect(() => {
    setRenameValue(username);
  }, [username]);

  const rename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;

    const state = loadState();
    const next = {
      ...state,
      user: { ...state.user, username: trimmed },
    };
    saveState(next);
    setUsername(trimmed);
    setRenameOpen(false);
  };

  const removeUsername = () => {
    if (!confirm("This will reset all progress. Are you sure?")) return;
    saveState(defaultState);
    setUsername("");
    window.location.reload();
  };

  const initials = username.slice(0, 2).toUpperCase();

  return (
    <>
      {initials && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-full outline-none">
              <Avatar className="cursor-pointer">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              Signed in as
              <div className="mt-1 font-normal text-sm text-muted-foreground truncate">
                {username || "Guest"}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              Rename
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={removeUsername}
              className="text-red-600 focus:text-red-600"
            >
              Delete username
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename username</DialogTitle>
            <DialogDescription>
              Pick a new name for your next run.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") rename();
              }}
              placeholder="New username"
            />
            <Button onClick={rename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
