"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { TaskCard } from "@/components/task-card";
import { TestCard } from "@/components/test-card";
import { CodeCard } from "@/components/code-card";
import { LevelProgress } from "@/components/level-progress";

export default function Home() {
  const [code, setCode] = useState("");
  const [dark, setDark] = useState(true);
  const [levelCount, setLevelCount] = useState(11);
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="p-4 flex items-center justify-between border-b">
            <SidebarTrigger />
            <DarkModeToggle />
          </header>

          <main className="flex-1 p-4 flex flex-col gap-4">
            <div className="flex flex-1 gap-4">
              <TaskCard title="Aufgabe" />
              <div className="flex-[2] min-h-[50vh] bg-gray-100 dark:bg-gray-900 p-4"></div>
            </div>

            <div className="flex flex-1 gap-4">
              <TestCard title="Tests" />
              <CodeCard code={code} setCode={setCode} />
            </div>
          </main>

          <LevelProgress
            currentLevel={currentLevel}
            setCurrentLevel={setCurrentLevel}
            levelCount={levelCount}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
