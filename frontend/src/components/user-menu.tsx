"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from "@/components/user-dialog";
import { updateState } from "@/lib/app-state";

type Props = {
  username: string;
  token: string;
  onAuthChange: (username: string, token: string) => void;
};

export function UserMenu({ username, token, onAuthChange }: Props) {
  const [authOpen, setAuthOpen] = useState(false);

  const logout = () => {
    updateState((prev) => ({
      ...prev,
      user: { ...prev.user, username: "", token: "" },
    }));
    onAuthChange("", "");
  };

  const initials = username.slice(0, 2).toUpperCase();

  return (
    <>
      {token ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-full outline-none">
              <Avatar className="cursor-pointer">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="font-normal text-sm text-muted-foreground truncate">
                {username}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 focus:text-red-600"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}>
          Log in
        </Button>
      )}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthChange={onAuthChange}
      />
    </>
  );
}
