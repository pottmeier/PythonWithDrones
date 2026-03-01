"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
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
import { UserMenu } from "@/components/user-menu";
import { loadState } from "@/lib/app-state";
import { UsernameDialog } from "@/components/user-dialog";
import yaml from "js-yaml";
import { Skeleton } from "@/components/ui/skeleton";

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

function LevelCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export default function Home() {
  const [dark, setDark] = useState(true);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [levelsState, setLevelsState] = useState<LevelsState>({
    levels: {},
  });
  const [levels, setLevels] = useState<Level[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | LevelStatus>("all");
  const [isLoading, setIsLoading] = useState(true);

  const handleLevelClick = (id: number) => {
    router.push(`/level/${id}`);
  };

  type LevelStatus = "locked" | "unlocked" | "completed";

  interface Level {
    id: number;
    title: string;
    homepage_intro: string;
    status: LevelStatus;
    tags: string[];
  }

  type LevelsState = {
    levels: Record<
      number,
      {
        status: LevelStatus;
        code: string;
      }
    >;
  };

  useEffect(() => {
    const loadLevels = async () => {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

      // This constant needs to be present for static export aka GitHub Pages
      // TODO: Please add the level that needs to be represented, by adding it to the list.
      const files = ["Level_1.yaml", "Level_2.yaml","Level_3.yaml", "Level_4.yaml", "Level_5.yaml", "Level_6.yaml"];

      const loadedLevels = await Promise.all(
        files.map(async (file) => {
          const res = await fetch(`${basePath}/levels/${file}`);
          const text = await res.text();
          return yaml.load(text) as Level;
        }),
      );

      setLevels(loadedLevels);
      setIsLoading(false);
    };

    loadLevels();
  }, []);

  console.log(levels);

  const filteredLevels = levels.filter((level) => {
    const matchesSearch =
      level.title.toLowerCase().includes(search.toLowerCase()) ||
      level.homepage_intro.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      levelsState.levels[level.id].status === filterStatus ||
      (level.tags?.includes(filterStatus) ?? false);

    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    setUsername(loadState().user.username || "");
    setLevelsState(loadState().progress || "");
  }, []);

  console.log(levelsState);

  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />
        <SidebarBackdrop />

        <div className="flex flex-1 flex-col">
          <header className="p-4 flex items-center border-b">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              <UserMenu
                username={username}
                setUsername={setUsername}
                onRequireUsername={() => {}}
              />
              <DarkModeToggle />
            </div>
          </header>

          <UsernameDialog onSaved={(name) => setUsername(name)} />

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
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <LevelCardSkeleton key={i} />
                      ))
                    : filteredLevels.map((level) => (
                        <LevelCard
                          key={level.id}
                          id={level.id}
                          title={level.title}
                          description={level.homepage_intro}
                          status={levelsState.levels[level.id]?.status ?? "locked"}
                          tags={level.tags}
                          onClick={handleLevelClick}
                        />
                      ))}

                  {!isLoading && filteredLevels.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <h3 className="text-lg font-medium">No levels found</h3>
                      <p className="mt-2 text-muted-foreground text-sm">
                        Adjust your filters and try again.
                      </p>
                    </div>
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
