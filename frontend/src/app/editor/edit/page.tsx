"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast, Toaster } from "sonner";
import {
  ArrowLeft,
  Save,
  Play,
  Download,
} from "lucide-react";
import {
  getLevelStorage,
  createStoredLevel,
} from "@/lib/level-storage";
import type { LevelData, StoredLevel } from "@/types/level";
import { createEmptyLevel } from "@/types/level";
import { BlockPalette } from "@/components/editor/block-palette";
import { ToolPanel, type EditorTool } from "@/components/editor/tool-panel";
import { MetadataForm } from "@/components/editor/metadata-form";
import { EditorScene } from "@/components/editor/editor-scene";
import { TestPlayModal } from "@/components/editor/test-play-modal";
import { downloadYaml } from "@/components/editor/yaml-io";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

function setBlockAt(
  level: LevelData,
  x: number,
  y: number,
  z: number,
  blockId: string,
): LevelData {
  const layerName = `layer_${y}`;
  const layers = { ...level.layers };

  // Determine width/depth from layer_0; refuse out-of-bounds
  const base = layers["layer_0"];
  if (!base) return level;
  const depth = base.length;
  const width = base[0]?.length ?? 0;
  if (x < 0 || x >= width || z < 0 || z >= depth || y < 0) return level;

  // Ensure layer exists
  if (!layers[layerName]) {
    const layer: string[][] = [];
    for (let zi = 0; zi < depth; zi++) {
      const row: string[] = [];
      for (let xi = 0; xi < width; xi++) row.push("empty");
      layer.push(row);
    }
    layers[layerName] = layer;
  } else {
    layers[layerName] = layers[layerName].map((row) => [...row]);
  }

  // Enforce singleton: at most one finish_portal across the whole level
  if (blockId === "finish_portal") {
    for (const lname of Object.keys(layers)) {
      layers[lname] = layers[lname].map((row) =>
        row.map((c) => (c === "finish_portal" ? "empty" : c)),
      );
    }
  }

  layers[layerName][z][x] = blockId;
  return { ...level, layers };
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");

  const [storedId, setStoredId] = useState<string | null>(null);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState("grass");
  const [tool, setTool] = useState<EditorTool>("paint");
  const [activeLayer, setActiveLayer] = useState(1);
  const [showTestPlay, setShowTestPlay] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!idFromUrl) {
        // No id: create a fresh draft and write it so refreshes don't lose it.
        const fresh = createStoredLevel(createEmptyLevel(9, 9, 4));
        await getLevelStorage().save(fresh);
        if (cancelled) return;
        setStoredId(fresh.id);
        setLevel(fresh.yaml);
        setLoading(false);
        // Replace URL so subsequent saves use the id
        router.replace(`${basePath}/editor/edit?id=${fresh.id}`);
        return;
      }
      const found = await getLevelStorage().get(idFromUrl);
      if (cancelled) return;
      if (!found) {
        toast.error("Level not found");
        router.replace(`${basePath}/editor`);
        return;
      }
      setStoredId(found.id);
      setLevel(found.yaml);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [idFromUrl, router]);

  const updateLevel = useCallback((next: LevelData) => {
    setLevel(next);
    setDirty(true);
  }, []);

  const handlePaint = (x: number, y: number, z: number, blockId: string) => {
    if (!level) return;
    updateLevel(setBlockAt(level, x, y, z, blockId));
  };

  const handleErase = (x: number, y: number, z: number) => {
    if (!level) return;
    updateLevel(setBlockAt(level, x, y, z, "empty"));
  };

  const handleSetSpawn = (x: number, y: number, z: number) => {
    if (!level) return;
    updateLevel({ ...level, spawn: { x, y, z } });
  };

  const handleAddLayer = () => {
    if (!level) return;
    const base = level.layers["layer_0"];
    if (!base) return;
    const newY = Object.keys(level.layers).length;
    const newLayer: string[][] = [];
    for (let z = 0; z < base.length; z++) {
      const row: string[] = [];
      for (let x = 0; x < base[0].length; x++) row.push("empty");
      newLayer.push(row);
    }
    updateLevel({
      ...level,
      layers: { ...level.layers, [`layer_${newY}`]: newLayer },
    });
    setActiveLayer(newY);
  };

  const handleSave = async () => {
    if (!level || !storedId) return;
    const stored: StoredLevel = {
      id: storedId,
      source: "user",
      status: "draft",
      yaml: level,
      updatedAt: Date.now(),
    };
    await getLevelStorage().save(stored);
    setDirty(false);
    toast.success("Saved");
  };

  const handleExport = () => {
    if (!level) return;
    const filename =
      (level.title || "Level").replace(/[^a-z0-9_-]+/gi, "_") + ".yaml";
    downloadYaml(level, filename);
  };

  const handleTestPlay = async () => {
    if (!level) return;
    if (dirty) await handleSave();
    setShowTestPlay(true);
  };

  if (loading || !level) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />
        <SidebarBackdrop />

        <div className="flex flex-1 flex-col h-screen overflow-hidden">
          <header className="p-3 flex items-center gap-3 border-b shrink-0">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`${basePath}/editor`)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Library
            </Button>
            <div className="text-sm text-muted-foreground truncate">
              {level.title || "Untitled"} {dirty && "·"}
              {dirty && (
                <span className="text-amber-500 font-medium"> unsaved</span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" />
                Export YAML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestPlay}
                className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Play className="w-4 h-4 mr-1.5" />
                Test Play
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1.5" />
                Save
              </Button>
              <DarkModeToggle />
            </div>
          </header>

          <main className="flex-1 flex overflow-hidden">
            <aside className="w-72 shrink-0 border-r overflow-y-auto p-4 space-y-6 bg-white/50 dark:bg-gray-800/50">
              <BlockPalette
                selectedBlockId={selectedBlockId}
                onSelect={setSelectedBlockId}
              />
              <ToolPanel
                tool={tool}
                onToolChange={setTool}
                activeLayer={activeLayer}
                layerCount={Math.max(
                  Object.keys(level.layers).length,
                  activeLayer + 1,
                )}
                onActiveLayerChange={setActiveLayer}
                onAddLayer={handleAddLayer}
              />
              <MetadataForm level={level} onChange={updateLevel} />
            </aside>

            <div className="flex-1 relative">
              <EditorScene
                level={level}
                selectedBlockId={selectedBlockId}
                tool={tool}
                activeLayer={activeLayer}
                onPaint={handlePaint}
                onErase={handleErase}
                onSetSpawn={handleSetSpawn}
              />
              <div className="absolute bottom-3 left-3 text-xs bg-black/60 text-white rounded px-2 py-1 pointer-events-none">
                {tool === "paint" && `Click to place ${selectedBlockId}`}
                {tool === "erase" && "Click a block to erase"}
                {tool === "spawn" && "Click to set spawn position"}
                {" · Shift+click to erase · Layer Y="}
                {activeLayer}
              </div>
            </div>
          </main>
        </div>
      </div>
      <TestPlayModal
        open={showTestPlay}
        onOpenChange={setShowTestPlay}
        level={level}
      />
      <Toaster position="top-left" richColors closeButton />
    </SidebarProvider>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
