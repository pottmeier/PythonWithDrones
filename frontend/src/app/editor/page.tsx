"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Upload, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  getLevelStorage,
  newLevelId,
  createStoredLevel,
} from "@/lib/level-storage";
import type { StoredLevel, LevelData } from "@/types/level";
import { createEmptyLevel } from "@/types/level";
import { readYamlFile } from "@/components/editor/yaml-io";
import { loadState } from "@/lib/app-state";
import { UserMenu } from "@/components/user-menu";

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

export default function EditorLibraryPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<StoredLevel[]>([]);
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const state = loadState();
    setUsername(state.user.username ?? "");
    setToken(state.user.token ?? "");
  }, []);

  const refresh = useCallback(async () => {
    const list = await getLevelStorage().list();
    setLevels(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleNewLevel = async () => {
    const stored = createStoredLevel(createEmptyLevel(9, 9, 4));
    await getLevelStorage().save(stored);
    router.push(`/editor/edit?id=${stored.id}`);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data: LevelData = await readYamlFile(file);
      const stored = {
        id: newLevelId(),
        source: "user" as const,
        status: "draft" as const,
        yaml: data,
        updatedAt: Date.now(),
      };
      await getLevelStorage().save(stored);
      toast.success(`Imported "${data.title ?? "Untitled"}"`);
      router.push(`/editor/edit?id=${stored.id}`);
    } catch (err) {
      toast.error(
        `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this level? This cannot be undone.")) return;
    await getLevelStorage().delete(id);
    refresh();
  };

  const handleDeleteAll = async () => {
    if (levels.length === 0) return;
    if (
      !window.confirm(
        `Delete ALL ${levels.length} saved levels? This cannot be undone.`,
      )
    )
      return;
    await Promise.all(levels.map((l) => getLevelStorage().delete(l.id)));
    refresh();
    toast.success(`Deleted ${levels.length} levels`);
  };

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
                token={token}
                onAuthChange={(u, t) => { setUsername(u); setToken(t); }}
              />
              <DarkModeToggle />
            </div>
          </header>

          <main className="flex-1 p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold">Level Editor</h1>
                <p className="text-sm text-muted-foreground">
                  Create new levels visually. Saved locally; export YAML to
                  ship them.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleDeleteAll}
                  disabled={levels.length === 0}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
                <Button variant="outline" onClick={handleImportClick}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import YAML
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".yaml,.yml"
                  className="hidden"
                  onChange={handleImportChange}
                />
                <Button onClick={handleNewLevel}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Level
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loaded && levels.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <h3 className="text-lg font-medium">No levels yet</h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Click <span className="font-semibold">New Level</span> to
                    get started.
                  </p>
                </div>
              )}

              {levels.map((lvl) => (
                <Card
                  key={lvl.id}
                  className="relative cursor-pointer hover:shadow-lg hover:bg-muted/50 transition-all"
                  onClick={() =>
                    router.push(`/editor/edit?id=${lvl.id}`)
                  }
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Pencil className="h-6 w-6 text-blue-500 mt-1" />
                      <div className="flex-1">
                        <CardTitle>
                          {lvl.yaml.title || "Untitled Level"}
                        </CardTitle>
                        <CardDescription>
                          {lvl.yaml.homepage_intro ||
                            lvl.yaml.description?.split("\n")[0] ||
                            "No description"}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground mt-2">
                          Updated {new Date(lvl.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        aria-label="Delete level"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(lvl.id);
                        }}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </SidebarProvider>
  );
}
