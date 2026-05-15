"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
  Undo2,
  Redo2,
} from "lucide-react";
import {
  getLevelStorage,
  createStoredLevel,
} from "@/lib/level-storage";
import type {
  LevelData,
  StoredLevel,
  LevelDimensions,
} from "@/types/level";
import {
  createEmptyLevel,
  getLevelDimensions,
  makeLayer,
  resizeLevel,
} from "@/types/level";
import { BlockPalette } from "@/components/editor/block-palette";
import {
  ToolPanel,
  type EditorTool,
  type EditorMode,
} from "@/components/editor/tool-panel";
import { MetadataForm } from "@/components/editor/metadata-form";
import { ResizePanel } from "@/components/editor/resize-panel";
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
  const base = level.layers["layer_0"];
  if (!base) return level;
  const depth = base.length;
  const width = base[0]?.length ?? 0;
  if (x < 0 || x >= width || z < 0 || z >= depth || y < 0) return level;

  const layers = { ...level.layers };
  const layerName = `layer_${y}`;
  if (!layers[layerName]) {
    layers[layerName] = makeLayer(width, depth, y);
  } else {
    layers[layerName] = layers[layerName].map((row) => [...row]);
  }

  if (blockId === "finish_portal") {
    for (const lname of Object.keys(layers)) {
      if (lname === layerName) continue;
      layers[lname] = layers[lname].map((row) =>
        row.map((c) => (c === "finish_portal" ? "empty" : c)),
      );
    }
    layers[layerName] = layers[layerName].map((row) =>
      row.map((c) => (c === "finish_portal" ? "empty" : c)),
    );
  }

  layers[layerName][z][x] = blockId;
  return { ...level, layers };
}

const HISTORY_LIMIT = 50;

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");

  const [storedId, setStoredId] = useState<string | null>(null);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedBlockId, setSelectedBlockId] = useState("grass");
  const [tool, setTool] = useState<EditorTool>("paint");
  const [mode, setMode] = useState<EditorMode>("placement");
  const [activeLayer, setActiveLayer] = useState(1);
  const [showTestPlay, setShowTestPlay] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [altHeld, setAltHeld] = useState(false);
  const [xHeld, setXHeld] = useState(false);

  const [past, setPast] = useState<LevelData[]>([]);
  const [future, setFuture] = useState<LevelData[]>([]);

  const [pendingResize, setPendingResize] = useState<LevelDimensions | null>(
    null,
  );

  const levelRef = useRef<LevelData | null>(null);
  levelRef.current = level;

  const sceneWrapRef = useRef<HTMLDivElement>(null);

  // Effective mode/tool after holding modifier keys
  const effectiveMode: EditorMode = altHeld ? "camera" : mode;
  const effectiveTool: EditorTool = xHeld ? "erase" : tool;

  // Load level
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!idFromUrl) {
        const fresh = createStoredLevel(createEmptyLevel(9, 9, 4));
        await getLevelStorage().save(fresh);
        if (cancelled) return;
        setStoredId(fresh.id);
        setLevel(fresh.yaml);
        setLoading(false);
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

  // Push to history before each structural edit
  const applyEdit = useCallback(
    (transform: (prev: LevelData) => LevelData) => {
      setLevel((prev) => {
        if (!prev) return prev;
        const next = transform(prev);
        if (next === prev) return prev;
        setPast((p) => {
          const np = [...p, prev];
          return np.length > HISTORY_LIMIT
            ? np.slice(np.length - HISTORY_LIMIT)
            : np;
        });
        setFuture([]);
        setDirty(true);
        return next;
      });
    },
    [],
  );

  // Metadata edits: no history push (avoid stack spam while typing)
  const updateLevelMeta = useCallback((next: LevelData) => {
    setLevel(next);
    setDirty(true);
  }, []);

  const handlePaint = (x: number, y: number, z: number, blockId: string) => {
    applyEdit((prev) => setBlockAt(prev, x, y, z, blockId));
  };
  const handleErase = (x: number, y: number, z: number) => {
    applyEdit((prev) => setBlockAt(prev, x, y, z, "air"));
  };
  const handleSetSpawn = (x: number, y: number, z: number) => {
    applyEdit((prev) => ({ ...prev, spawn: { x, y, z } }));
  };

  const handleAddLayer = () => {
    applyEdit((prev) => {
      const base = prev.layers["layer_0"];
      if (!base) return prev;
      const newY = Object.keys(prev.layers).length;
      const newLayer = makeLayer(base[0].length, base.length, newY);
      return {
        ...prev,
        layers: { ...prev.layers, [`layer_${newY}`]: newLayer },
      };
    });
    setActiveLayer((y) =>
      Math.max(y, level ? Object.keys(level.layers).length : 0),
    );
  };

  const undo = useCallback(() => {
    if (past.length === 0 || !level) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [level, ...f]);
    setLevel(prev);
    setDirty(true);
  }, [past, level]);

  const redo = useCallback(() => {
    if (future.length === 0 || !level) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, level]);
    setLevel(next);
    setDirty(true);
  }, [future, level]);

  const handleSave = useCallback(async () => {
    if (!levelRef.current || !storedId) return;
    const stored: StoredLevel = {
      id: storedId,
      source: "user",
      status: "draft",
      yaml: levelRef.current,
      updatedAt: Date.now(),
    };
    await getLevelStorage().save(stored);
    setDirty(false);
    toast.success("Saved");
  }, [storedId]);

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

  // Keyboard: Alt/X hold, Ctrl+Z/Y, layer arrows
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Avoid hijacking typing in form fields
      const tag = (e.target as HTMLElement)?.tagName;
      const isFormField =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Alt") {
        setAltHeld(true);
        e.preventDefault();
        return;
      }
      if ((e.key === "x" || e.key === "X") && !isFormField) {
        setXHeld(true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleSave();
        return;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHeld(false);
      if (e.key === "x" || e.key === "X") setXHeld(false);
    };
    const onBlur = () => {
      setAltHeld(false);
      setXHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [undo, redo, handleSave]);

  // Wheel: change Y layer in placement mode (camera mode lets OrbitControls zoom)
  useEffect(() => {
    const el = sceneWrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (effectiveMode !== "placement") return;
      e.preventDefault();
      if (!level) return;
      const dir = e.deltaY > 0 ? -1 : 1;
      const maxLayer = Math.max(Object.keys(level.layers).length - 1, 0);
      setActiveLayer((y) => Math.min(Math.max(y + dir, 0), maxLayer));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [effectiveMode, level]);

  const currentDims = level ? getLevelDimensions(level) : null;
  useEffect(() => {
    if (currentDims) {
      setPendingResize((prev) =>
        prev &&
        prev.width === currentDims.width &&
        prev.height === currentDims.height &&
        prev.depth === currentDims.depth
          ? prev
          : currentDims,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDims?.width, currentDims?.height, currentDims?.depth]);

  const handleApplyResize = () => {
    if (!level || !pendingResize) return;
    applyEdit((prev) =>
      resizeLevel(
        prev,
        pendingResize.width,
        pendingResize.depth,
        pendingResize.height,
      ),
    );
    setActiveLayer((y) => Math.min(y, pendingResize.height - 1));
  };

  const handleResetResize = () => {
    if (currentDims) setPendingResize(currentDims);
  };

  if (loading || !level || !currentDims || !pendingResize) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const resizeDirty =
    pendingResize.width !== currentDims.width ||
    pendingResize.height !== currentDims.height ||
    pendingResize.depth !== currentDims.depth;

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
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={past.length === 0}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={future.length === 0}
                title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
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
              <ToolPanel
                mode={mode}
                onModeChange={setMode}
                altHeld={altHeld}
                xHeld={xHeld}
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
              <BlockPalette
                selectedBlockId={selectedBlockId}
                onSelect={setSelectedBlockId}
              />
              <ResizePanel
                current={currentDims}
                pending={pendingResize}
                onPendingChange={setPendingResize}
                onApply={handleApplyResize}
                onReset={handleResetResize}
              />
              <MetadataForm level={level} onChange={updateLevelMeta} />
            </aside>

            <div ref={sceneWrapRef} className="flex-1 relative">
              <EditorScene
                level={level}
                selectedBlockId={selectedBlockId}
                tool={effectiveTool}
                mode={effectiveMode}
                activeLayer={activeLayer}
                pendingResize={resizeDirty ? pendingResize : null}
                onPaint={handlePaint}
                onErase={handleErase}
                onSetSpawn={handleSetSpawn}
              />
              <div className="absolute bottom-3 left-3 text-xs bg-black/60 text-white rounded px-2 py-1 pointer-events-none">
                {effectiveMode === "camera" ? (
                  <>Camera mode {altHeld && "(Alt held)"} · drag to orbit</>
                ) : (
                  <>
                    {effectiveTool === "paint" &&
                      `Click to place ${selectedBlockId}`}
                    {effectiveTool === "erase" &&
                      `Click to erase ${xHeld ? "(X held)" : ""}`}
                    {effectiveTool === "spawn" &&
                      "Click to set spawn position"}
                    {" · Layer Y="}
                    {activeLayer}
                  </>
                )}
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
