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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast, Toaster } from "sonner";
import {
  ArrowLeft,
  Save,
  Play,
  Download,
  Undo2,
  Redo2,
  ScanEye,
  Grid3X3,
  Menu,
  ChevronUp,
  ChevronDown,
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
import {
  EditorScene,
  type HoverCell,
  type SceneAPI,
} from "@/components/editor/editor-scene";
import { TestPlayModal } from "@/components/editor/test-play-modal";
import { downloadYaml } from "@/components/editor/yaml-io";

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

function EditorPalette({
  mode,
  onModeChange,
  altHeld,
  xHeld,
  tool,
  onToolChange,
  selectedBlockId,
  onSelect,
  currentDims,
  onPreviewChange,
  onApply,
  level,
  onChange,
}: {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  altHeld: boolean;
  xHeld: boolean;
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  selectedBlockId: string;
  onSelect: (id: string) => void;
  currentDims: LevelDimensions;
  onPreviewChange: (dims: LevelDimensions | null) => void;
  onApply: (dims: LevelDimensions) => void;
  level: LevelData;
  onChange: (level: LevelData) => void;
}) {
  return (
    <div className="space-y-6">
      <ToolPanel
        mode={mode}
        onModeChange={onModeChange}
        altHeld={altHeld}
        xHeld={xHeld}
        tool={tool}
        onToolChange={onToolChange}
      />
      <BlockPalette selectedBlockId={selectedBlockId} onSelect={onSelect} />
      <ResizePanel
        current={currentDims}
        onPreviewChange={onPreviewChange}
        onApply={onApply}
      />
      <MetadataForm level={level} onChange={onChange} />
    </div>
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
  const [showGrid, setShowGrid] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const hoverRef = useRef<HoverCell | null>(null);
  const sceneApiRef = useRef<SceneAPI | null>(null);
  const spaceHeldRef = useRef(false);

  const [past, setPast] = useState<LevelData[]>([]);
  const [future, setFuture] = useState<LevelData[]>([]);

  // Only the red-slab preview; null when no resize is staged (invalid or
  // equal to current). ResizePanel emits this via onPreviewChange.
  const [resizePreview, setResizePreview] = useState<LevelDimensions | null>(
    null,
  );

  const levelRef = useRef<LevelData | null>(null);
  levelRef.current = level;

  const sceneWrapRef = useRef<HTMLDivElement>(null);

  const effectiveMode: EditorMode = altHeld ? "camera" : mode;
  const effectiveTool: EditorTool = xHeld ? "erase" : tool;

  // Kept in sync with activeLayer state — read by handlers that need the
  // current layer synchronously (e.g. handleApplyResize) without depending
  // on stale closures.
  const activeLayerRef = useRef(activeLayer);
  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  // Callback for SceneController to sync React state whenever the scene's
  // truth (currentLayerRef) changes — keeps the sidebar UI consistent.
  const handleLayerChange = useCallback((newLayer: number) => {
    activeLayerRef.current = newLayer;
    setActiveLayer(newLayer);
  }, []);

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
        setActiveLayer(1);
        activeLayerRef.current = 1;
        setLoading(false);
        router.replace(`/editor/edit?id=${fresh.id}`);
        return;
      }
      const found = await getLevelStorage().get(idFromUrl);
      if (cancelled) return;
      if (!found) {
        toast.error("Level not found");
        router.replace(`/editor`);
        return;
      }
      setStoredId(found.id);
      setLevel(found.yaml);
      setActiveLayer(1);
      activeLayerRef.current = 1;
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [idFromUrl, router]);

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

  const updateLevelMeta = useCallback((next: LevelData) => {
    setLevel(next);
    setDirty(true);
  }, []);

  const handlePaint = useCallback(
    (x: number, y: number, z: number, blockId: string) => {
      applyEdit((prev) => setBlockAt(prev, x, y, z, blockId));
    },
    [applyEdit],
  );
  const handleErase = useCallback(
    (x: number, y: number, z: number) => {
      applyEdit((prev) => setBlockAt(prev, x, y, z, "air"));
    },
    [applyEdit],
  );
  const handleSetSpawn = useCallback(
    (x: number, y: number, z: number) => {
      applyEdit((prev) => ({ ...prev, spawn: { x, y, z } }));
    },
    [applyEdit],
  );

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

  const handleResetCamera = () => {
    if (!controlsRef.current || !level) return;
    const dims = getLevelDimensions(level);
    const cx = (dims.width - 1) / 2;
    const cz = (dims.depth - 1) / 2;
    const ty = activeLayer - 0.5;
    const controls = controlsRef.current;
    controls.object.position.set(cx - 8, ty + 9.5, cz + 10);
    controls.target.set(cx, ty, cz);
    controls.update();
  };

  const handleApplyResize = (dims: LevelDimensions) => {
    applyEdit((prev) => resizeLevel(prev, dims.width, dims.depth, dims.height));
    // Clamp to new height — pass override so SceneController uses the
    // post-resize layer count (React state level not yet propagated).
    sceneApiRef.current?.applyLayerSet(
      activeLayerRef.current,
      dims.height,
    );
  };

  // Stable ref so the keyboard handler can read the current effective mode
  // without re-binding the listener on every change.
  const placementRef = useRef({ effectiveMode });
  placementRef.current = { effectiveMode };

  // Keyboard handler: Alt/X hold, Ctrl+Z/Y/S, Space-to-place
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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

      if (e.code === "Space" && !isFormField) {
        if (e.repeat) return;
        e.preventDefault();
        if (placementRef.current.effectiveMode !== "placement") return;
        // Mark held first so the action handler can re-fire as the hover
        // moves to new cells; then paint the initial cell.
        spaceHeldRef.current = true;
        sceneApiRef.current?.performActionAtHover();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHeld(false);
      if (e.key === "x" || e.key === "X") setXHeld(false);
      if (e.code === "Space") spaceHeldRef.current = false;
    };
    const onBlur = () => {
      setAltHeld(false);
      setXHeld(false);
      spaceHeldRef.current = false;
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

  // Wheel handler: one event = one layer step in placement, manual zoom in
  // camera mode. The imperative scene API absorbs rapid bursts cleanly, so
  // there's no need for an accumulator or rate cap.
  useEffect(() => {
    const el = sceneWrapRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (effectiveMode === "placement") {
        const dir = e.deltaY > 0 ? -1 : 1;
        sceneApiRef.current?.applyLayerStep(dir);
      } else {
        const ctrl = controlsRef.current;
        if (!ctrl) return;
        const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
        const dx = ctrl.object.position.x - ctrl.target.x;
        const dy = ctrl.object.position.y - ctrl.target.y;
        const dz = ctrl.object.position.z - ctrl.target.z;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (len === 0) return;
        const newLen = Math.min(Math.max(len * factor, 2), 30);
        const scale = newLen / len;
        ctrl.object.position.set(
          ctrl.target.x + dx * scale,
          ctrl.target.y + dy * scale,
          ctrl.target.z + dz * scale,
        );
        ctrl.update();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // `loading` is included so this re-attaches once sceneWrapRef's div
    // actually mounts — this effect is declared above the loading-guard's
    // early return (required by rules of hooks), so its first run always
    // sees sceneWrapRef.current as null while the spinner is showing.
  }, [effectiveMode, loading]);


  const currentDims = level ? getLevelDimensions(level) : null;

  if (loading || !level || !currentDims) {
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
          <header className="p-2 sm:p-3 flex items-center gap-1.5 sm:gap-3 border-b shrink-0">
            <SidebarTrigger />
            <Button
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setPaletteOpen(true)}
              title="Open block palette"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/editor`)}
            >
              <ArrowLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Library</span>
            </Button>
            <div className="min-w-0 flex-1 text-sm text-muted-foreground truncate">
              {level.title || "Untitled"} {dirty && "·"}
              {dirty && (
                <span className="text-amber-500 font-medium"> unsaved</span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
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
                <Download className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Export YAML</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestPlay}
                className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Play className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Test Play</span>
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <DarkModeToggle />
            </div>
          </header>

          <main className="flex-1 flex overflow-hidden">
            <aside className="hidden md:flex md:flex-col w-72 shrink-0 border-r overflow-y-auto p-4 bg-white/50 dark:bg-gray-800/50">
              <EditorPalette
                mode={mode}
                onModeChange={setMode}
                altHeld={altHeld}
                xHeld={xHeld}
                tool={tool}
                onToolChange={setTool}
                selectedBlockId={selectedBlockId}
                onSelect={setSelectedBlockId}
                currentDims={currentDims}
                onPreviewChange={setResizePreview}
                onApply={handleApplyResize}
                level={level}
                onChange={updateLevelMeta}
              />
            </aside>

            <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
              <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
                <SheetHeader className="sr-only">
                  <SheetTitle>Block Palette</SheetTitle>
                </SheetHeader>
                <EditorPalette
                  mode={mode}
                  onModeChange={setMode}
                  altHeld={altHeld}
                  xHeld={xHeld}
                  tool={tool}
                  onToolChange={setTool}
                  selectedBlockId={selectedBlockId}
                  onSelect={setSelectedBlockId}
                  currentDims={currentDims}
                  onPreviewChange={setResizePreview}
                  onApply={handleApplyResize}
                  level={level}
                  onChange={updateLevelMeta}
                />
              </SheetContent>
            </Sheet>

            <div ref={sceneWrapRef} className="flex-1 relative min-w-0">
              <EditorScene
                key={storedId ?? "no-id"}
                level={level}
                selectedBlockId={selectedBlockId}
                tool={effectiveTool}
                mode={effectiveMode}
                activeLayer={activeLayer}
                showGrid={showGrid}
                pendingResize={resizePreview}
                controlsRef={controlsRef}
                hoverRef={hoverRef}
                sceneApiRef={sceneApiRef}
                spaceHeldRef={spaceHeldRef}
                onPaint={handlePaint}
                onErase={handleErase}
                onSetSpawn={handleSetSpawn}
                onLayerChange={handleLayerChange}
              />
              <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-2 z-10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetCamera}
                  title="Reset camera view"
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur"
                >
                  <ScanEye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowGrid((s) => !s)}
                  title={showGrid ? "Hide grid" : "Show grid"}
                  className={
                    showGrid
                      ? "bg-blue-500/20 backdrop-blur border-blue-400"
                      : "bg-white/80 dark:bg-gray-800/80 backdrop-blur"
                  }
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-0.5 h-8 rounded-md border bg-white/80 dark:bg-gray-800/80 backdrop-blur px-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => sceneApiRef.current?.applyLayerStep(-1)}
                    disabled={activeLayer <= 0}
                    title="Layer down"
                    className="h-6 w-6"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs font-medium px-0.5 tabular-nums">
                    Y={activeLayer}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => sceneApiRef.current?.applyLayerStep(1)}
                    disabled={activeLayer >= currentDims.height - 1}
                    title="Layer up"
                    className="h-6 w-6"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 text-xs bg-black/60 text-white rounded px-2 py-1 pointer-events-none">
                {effectiveMode === "camera" ? (
                  <>Camera mode {altHeld && "(Alt held)"} · drag to orbit</>
                ) : (
                  <>
                    {effectiveTool === "paint" &&
                      `Click or Space to place ${selectedBlockId}`}
                    {effectiveTool === "erase" &&
                      `Click or Space to erase ${xHeld ? "(X held)" : ""}`}
                    {effectiveTool === "spawn" &&
                      "Click or Space to set spawn position"}
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
      <Toaster position="top-center" richColors closeButton />
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
