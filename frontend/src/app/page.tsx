"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { LevelCard } from "@/components/level-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function Home() {
  const [dark, setDark] = useState(true);
  type LevelStatus = "locked" | "unlocked" | "completed";
  const router = useRouter();
  const handleLevelClick = (id: number) => {
    router.push(`/level/${id}`);
  };

  // TODO: get levels from /public/levels
  const levels = [
    {
      id: 1,
      title: "Level 1",
      description: "Introduction",
      status: "completed" as LevelStatus,
      tags: ["Easy", "Variables", "Console Output"],
    },
    {
      id: 2,
      title: "Level 2",
      description: "Basics",
      status: "unlocked" as LevelStatus,
      tags: ["Easy", "Conditions", "For-Loop"],
    },
    {
      id: 3,
      title: "Level 3",
      description: "Advanced",
      status: "locked" as LevelStatus,
      tags: ["Medium", "Functions", "Arrays", "While-Loop"],
    },
  ];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | LevelStatus>("all");

  const filteredLevels = levels.filter((level) => {
    const matchesSearch =
      level.title.toLowerCase().includes(search.toLowerCase()) ||
      level.description.toLowerCase().includes(search.toLowerCase()) ||
      level.tags?.some((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
      );

    const matchesFilter =
      filterStatus === "all" ||
      level.status === filterStatus ||
      (level.tags?.includes(filterStatus) ?? false);

    return matchesSearch && matchesFilter;
  });

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
            <div className="flex justify-end items-center gap-2 mb-0 mt-1">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

                <Input
                  placeholder="Search Levels..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <Select
                value={filterStatus}
                onValueChange={(val) => setFilterStatus(val as any)}
              >
                <SelectTrigger className="w-30">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="unlocked">Unlocked</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col md:flex-row flex-1 gap-4">
              <main className="flex-1 p-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLevels.map((level) => (
                    <LevelCard
                      key={level.id}
                      id={level.id}
                      title={level.title}
                      description={level.description}
                      status={level.status}
                      tags={level.tags}
                      onClick={handleLevelClick}
                    />
                  ))}
                  {filteredLevels.length === 0 && (
                    <p className="text-center text-muted-foreground col-span-full">
                      No levels found.
                    </p>
                  )}
                </div>
              </main>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
