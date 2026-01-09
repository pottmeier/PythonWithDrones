"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type LevelStatus = "locked" | "unlocked" | "completed";

type Level = {
  id: number;
  title: string;
  description: string;
  status: LevelStatus;
  tags?: string[];
};

// TODO: get levels from /public/levels
const levels: Level[] = [
  {
    id: 1,
    title: "Level 1",
    description: "Introduction",
    status: "completed",
    tags: ["Easy", "Variables", "Console Output"],
  },
  {
    id: 2,
    title: "Level 2",
    description: "Basics",
    status: "unlocked",
    tags: ["Easy", "Conditions", "For-Loop"],
  },
  {
    id: 3,
    title: "Level 3",
    description: "Advanced",
    status: "locked",
    tags: ["Medium", "Functions", "Arrays", "While-Loop"],
  },
];

export default function ProgressPage() {
  const totalLevels = levels.length;
  const completedLevels = levels.filter((l) => l.status === "completed").length;
  const progressPercent = (completedLevels / totalLevels) * 100;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="p-4 flex items-center justify-between border-b">
            <SidebarTrigger />
            <DarkModeToggle />
          </header>

          <main className="flex-1 p-4 flex flex-col gap-6">
            {/* Gesamtfortschritt */}
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Gesamtfortschritt</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progressPercent} className="h-6" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {completedLevels} von {totalLevels} Levels abgeschlossen (
                  {Math.round(progressPercent)}%)
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
