"use client";

import { useState, useEffect } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { loadState } from "@/lib/app-state";
import { UserMenu } from "@/components/user-menu";
import MarkdownRenderer from "./MardownRenderer";

function SidebarBackdrop() {
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  const close = () => {
    if (isMobile) setOpenMobile(false);
    else setOpen(false);
  };

  return (
    <div
      aria-hidden="true"
      onClick={close}
      className={[
        "fixed inset-0 z-40 bg-black/40 transition-opacity",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    />
  );
}

export default function DocumentationPage() {
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    setUsername(loadState().user.username || "");

    fetch("/content/docu.md")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(setContent)
      .catch((err) => console.error("Failed to load markdown:", err));
  }, []);

  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />
        <SidebarBackdrop />

        <div className="flex flex-1 flex-col">
          <header className="p-4 flex items-center border-b">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              <div className="pointer-events-none">
                <UserMenu
                  username={username}
                  setUsername={setUsername}
                  onRequireUsername={() => {}}
                />
              </div>

              <DarkModeToggle />
            </div>
          </header>

          <main className="flex-1 my-6 mx-6 sm:mx-6 md:mx-16 lg:mx-40 flex flex-col gap-6">
            <MarkdownRenderer>{content}</MarkdownRenderer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
