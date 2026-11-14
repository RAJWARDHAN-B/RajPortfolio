import { Component, useCallback, useEffect, useRef, useState, type ErrorInfo, type MouseEvent, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Car,
  ChevronRight,
  CircleHelp,
  Eye,
  Flashlight,
  Footprints,
  Ghost,
  Lightbulb,
  List,
  LocateFixed,
  Megaphone,
  Octagon,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import DetailModal from "@/components/DetailModal";
import { projectItems, type ContentItem } from "@/data/portfolio";
import {
  createControlState,
  type ControlState,
  type NearbyState,
  type TravelMode,
  type WorldCommands,
  type WorldSettings,
  type WorldTelemetry,
} from "./world/types";

type SceneComponent = typeof import("./StrangerThingsScene")["default"];
type BooleanSetting = "headlights" | "flashlight" | "highBeams" | "scares" | "sound";

const FEATURED_PROJECTS = projectItems.filter((item) => item.url).slice(0, 6);

const MOVEMENT_KEYS: Record<string, keyof ControlState> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "brake",
  ShiftLeft: "run",
  ShiftRight: "run",
  KeyH: "horn",
};

class SceneErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unable to display the 3D world.", error, info);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const canUseWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch (_error) {
    return false;
  }
};

function HudButton({
  icon,
  label,
  shortcut,
  pressed,
  disabled,
  hint,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  pressed?: boolean;
  disabled?: boolean;
  hint?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={hudButton}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      aria-keyshortcuts={shortcut}
      title={hint ?? (shortcut ? `${label} (${shortcut})` : label)}
    >
      <span aria-hidden="true">{icon}</span>
      <span aria-hidden="true" className="hidden xl:inline">
        {label}
        {shortcut && <span className="ml-1 text-white/55">{shortcut}</span>}
      </span>
    </button>
  );
}

const hudButton =
  "inline-flex items-center gap-2 rounded-sm border border-white/15 bg-black/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:border-primary hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:border-primary aria-pressed:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-45";

const StrangerThings3D = () => {
  const [open, setOpen] = useState(false);
  const [SceneComponent, setSceneComponent] = useState<SceneComponent | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [initialMode, setInitialMode] = useState<TravelMode>("drive");
  const [settings, setSettings] = useState<WorldSettings>({
    mode: "drive",
    view: "third",
    headlights: true,
    flashlight: true,
    highBeams: false,
    scares: true,
    sound: true,
    quality: "high",
    reducedMotion: false,
    paused: false,
  });
  const [nearby, setNearby] = useState<NearbyState>({ project: null, car: false });
  const [selectedProject, setSelectedProject] = useState<ContentItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(true);
  const [scareCount, setScareCount] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  const controls = useRef<ControlState>(createControlState());
  const telemetry = useRef<WorldTelemetry>({ speedKmh: 0 });
  const commands = useRef<WorldCommands>({ recenterCamera: 0 });
  const speedReadout = useRef<HTMLSpanElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const openedFromMenu = useRef(false);
  const worldRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const nearbyRef = useRef(nearby);
  nearbyRef.current = nearby;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(pointer: coarse)");
    const update = () => {
      setIsTouch(pointer.matches);
      setSettings((current) => ({
        ...current,
        reducedMotion: motion.matches,
        scares: motion.matches ? false : current.scares,
      }));
    };
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  const resetControls = useCallback(() => {
    Object.assign(controls.current, createControlState());
  }, []);

  const announce = useCallback((message: string) => setAnnouncement(message), []);

  const toggle = useCallback(
    (key: BooleanSetting, label: string) => {
      setSettings((current) => {
        const next = !current[key];
        announce(`${label} ${next ? "on" : "off"}`);
        return { ...current, [key]: next };
      });
    },
    [announce],
  );

  const switchMode = useCallback(() => {
    resetControls();
    setSettings((current) => {
      const mode: TravelMode = current.mode === "drive" ? "walk" : "drive";
      announce(mode === "walk" ? "You got out of the car. Explore on foot." : "You are back in the car.");
      return { ...current, mode };
    });
  }, [announce, resetControls]);

  const switchView = useCallback(() => {
    setSettings((current) => {
      const view = current.view === "third" ? "first" : "third";
      announce(view === "first" ? (current.mode === "drive" ? "Driver's seat view" : "First-person view") : "Third-person view");
      return { ...current, view };
    });
  }, [announce]);

  const openProject = useCallback(
    (item: ContentItem, trigger: HTMLElement | null, fromMenu = false) => {
      resetControls();
      openedFromMenu.current = fromMenu;
      returnFocusRef.current = trigger ?? worldRef.current;
      setMenuOpen(false);
      setSelectedProject(item);
    },
    [resetControls],
  );

  const openMenu = useCallback((trigger: HTMLButtonElement | null) => {
    menuTriggerRef.current = trigger;
    setMenuOpen(true);
  }, []);

  const launch = async (mode: TravelMode, trigger: HTMLButtonElement) => {
    launchButtonRef.current = trigger;
    if (!canUseWebGL()) {
      setFailure("Your browser or device does not support WebGL, so the 3D world cannot run here. Every project is listed below.");
      return;
    }
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && !audioContext) {
      try {
        setAudioContext(new AudioContextClass());
      } catch (_error) {
        setAudioContext(null);
      }
    } else if (audioContext?.state === "suspended") {
      void audioContext.resume().catch(() => undefined);
    }
    setFailure(null);
    setInitialMode(mode);
    setSettings((current) => ({ ...current, mode, view: "third", paused: false }));
    setNearby({ project: null, car: false });
    setReady(false);
    setHelpOpen(true);
    resetControls();
    if (SceneComponent) {
      setOpen(true);
      return;
    }
    setLoading(true);
    try {
      const { default: Scene } = await import("./StrangerThingsScene");
      setSceneComponent(() => Scene);
      setOpen(true);
    } catch (error) {
      console.error("Unable to load the portfolio's 3D world.", error);
      setFailure("The 3D world could not be loaded. Please try again; every project is listed below.");
    } finally {
      setLoading(false);
    }
  };

  const close = useCallback(() => {
    resetControls();
    setOpen(false);
    setMenuOpen(false);
    void audioContext?.suspend().catch(() => undefined);
  }, [audioContext, resetControls]);

  useEffect(() => () => void audioContext?.close().catch(() => undefined), [audioContext]);

  const paused = !open || Boolean(selectedProject) || menuOpen;
  useEffect(() => {
    setSettings((current) => (current.paused === paused ? current : { ...current, paused }));
    if (paused) resetControls();
  }, [paused, resetControls]);

  useEffect(() => {
    if (!open || !ready) return;
    const interval = window.setInterval(() => {
      if (speedReadout.current) speedReadout.current.textContent = String(telemetry.current.speedKmh);
    }, 100);
    return () => window.clearInterval(interval);
  }, [open, ready]);

  useEffect(() => {
    if (!open) return;
    const isEditable = (target: EventTarget | null) =>
      target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    const onKeyDown = (event: KeyboardEvent) => {
      if (settingsRef.current.paused || isEditable(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const movement = MOVEMENT_KEYS[event.code];
      const onButton = event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement;
      if (movement) {
        if (event.code === "Space" && onButton) return;
        event.preventDefault();
        controls.current[movement] = true;
        return;
      }
      if (event.repeat) return;
      const shortcuts: Record<string, () => void> = {
        KeyE: () => (settingsRef.current.mode === "drive" || nearbyRef.current.car ? switchMode() : undefined),
        KeyF: () => (nearbyRef.current.project ? openProject(nearbyRef.current.project, null) : undefined),
        KeyC: switchView,
        KeyL: () => toggle(settingsRef.current.mode === "drive" ? "headlights" : "flashlight", settingsRef.current.mode === "drive" ? "Headlights" : "Flashlight"),
        KeyB: () => toggle("highBeams", "High beams"),
        KeyM: () => toggle("sound", "Sound"),
        KeyR: () => {
          commands.current.recenterCamera++;
          announce("Camera recentred");
        },
        KeyP: () => openMenu(null),
      };
      const shortcut = shortcuts[event.code];
      if (shortcut && !(onButton && event.code === "Enter")) {
        event.preventDefault();
        shortcut();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const movement = MOVEMENT_KEYS[event.code];
      if (movement) controls.current[movement] = false;
    };
    const onBlur = () => resetControls();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [open, announce, openMenu, openProject, resetControls, switchMode, switchView, toggle]);

  const handleScare = useCallback(() => {
    setScareCount((count) => count + 1);
    if (navigator.vibrate) navigator.vibrate([90, 40, 160]);
  }, []);

  const holdButton = (control: keyof ControlState, label: string, icon: ReactNode, className = "") => (
    <button
      type="button"
      aria-label={label}
      className={`flex h-14 w-14 touch-none select-none items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md active:border-primary active:bg-primary/70 ${className}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        controls.current[control] = true;
      }}
      onPointerUp={() => (controls.current[control] = false)}
      onPointerCancel={() => (controls.current[control] = false)}
      onLostPointerCapture={() => (controls.current[control] = false)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {icon}
    </button>
  );

  const inCar = settings.mode === "drive";

  return (
    <section id="3d-mode" aria-labelledby="world-heading" className="relative px-4 py-16 md:px-12">
      <div className="relative overflow-hidden rounded-sm border border-primary/25 bg-[radial-gradient(ellipse_at_70%_20%,rgba(229,9,20,0.32),transparent_55%),linear-gradient(180deg,#120609,#050304)] px-[4%] py-12 md:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0px,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_3px)]" />
        <p className="relative mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">Interactive 3D · Optional</p>
        <h2 id="world-heading" className="relative font-display text-5xl leading-none text-foreground md:text-7xl">
          The Shadow Road
        </h2>
        <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-foreground/80 md:text-base">
          Drive a vintage car through a fog-choked forest at night, step out with a flashlight, and find my projects on
          glowing roadside billboards. Something lives in the trees.
        </p>
        <ul className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-wider text-muted-foreground">
          <li>Steerable car &amp; driver&apos;s seat</li>
          <li>Headlights &amp; flashlight</li>
          <li>Drag to look around</li>
          <li>Optional jump scares</li>
        </ul>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={(event) => void launch("drive", event.currentTarget)}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-primary px-7 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
          >
            <Car className="h-5 w-5" aria-hidden="true" />
            {loading ? "Loading world..." : "Enter by car"}
            {!loading && <ChevronRight className="h-5 w-5" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={(event) => void launch("walk", event.currentTarget)}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-white/25 bg-black/50 px-7 py-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
          >
            <Footprints className="h-5 w-5" aria-hidden="true" />
            Start on foot
          </button>
        </div>
        <p className="relative mt-4 text-xs text-muted-foreground">
          Opens full screen with sound. Contains flashing lights and sudden jump scares, which you can turn off at any time.
        </p>
        {failure && (
          <p role="alert" className="relative mt-4 text-sm text-destructive">
            {failure}
          </p>
        )}
      </div>

      <div className="mt-10 px-[4%]">
        <h3 className="font-display text-2xl text-foreground">Explore projects</h3>
        <p className="mb-3 text-sm text-muted-foreground">Open any project without entering the world.</p>
        <div className="flex flex-wrap gap-2">
          {projectItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={(event) => openProject(item, event.currentTarget)}
              className="border border-border bg-card px-3 py-2 text-sm text-foreground hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && close()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content
            ref={worldRef}
            className="fixed inset-0 z-[140] bg-black text-white focus:outline-none"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              worldRef.current?.focus();
            }}
            onEscapeKeyDown={(event) => {
              if (selectedProject || menuOpen) event.preventDefault();
            }}
            onCloseAutoFocus={(event) => {
              if (launchButtonRef.current?.isConnected) {
                event.preventDefault();
                launchButtonRef.current.focus();
              }
            }}
          >
            <DialogPrimitive.Title className="sr-only">The Shadow Road 3D world</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Drive or walk with W, A, S and D or the arrow keys, and drag to look around. Press P for a list of every
              project, or Escape to leave the world.
            </DialogPrimitive.Description>
            <div className="absolute inset-0" onPointerDown={() => worldRef.current?.focus({ preventScroll: true })}>
              {SceneComponent && open && (
                <SceneErrorBoundary
                  onError={() => {
                    setFailure("The 3D world stopped unexpectedly. Every project is still listed below.");
                    close();
                  }}
                >
                  <SceneComponent
                    settings={settings}
                    initialMode={initialMode}
                    featured={FEATURED_PROJECTS}
                    controls={controls}
                    telemetry={telemetry}
                    commands={commands}
                    audioContext={audioContext}
                    onReady={() => setReady(true)}
                    onNearbyChange={setNearby}
                    onSelectProject={(item) => openProject(item, null)}
                    onScare={handleScare}
                    onContextLost={() => {
                      setFailure("The 3D display was interrupted by the browser. Enter again to retry, or use the project list below.");
                      close();
                    }}
                  />
                </SceneErrorBoundary>
              )}
            </div>

            {!ready && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050304]">
                <p className="font-display text-4xl tracking-[0.2em] text-primary motion-safe:animate-pulse">The Shadow Road</p>
                <p className="mt-3 text-sm text-white/60">Building the forest…</p>
              </div>
            )}

            {scareCount > 0 && !settings.reducedMotion && (
              <div key={scareCount} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 animate-[scare-flash_0.9s_ease-out_forwards] bg-[radial-gradient(circle,transparent_35%,rgba(150,0,10,0.85))]" />
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 md:p-5">
              <div className="pointer-events-auto flex flex-wrap gap-2" role="toolbar" aria-label="World controls">
                <HudButton
                  icon={inCar ? <Footprints className="h-4 w-4" /> : <Car className="h-4 w-4" />}
                  label={inCar ? "Get out" : "Get in car"}
                  shortcut="E"
                  onClick={switchMode}
                  disabled={!inCar && !nearby.car}
                  hint={!inCar && !nearby.car ? "Walk back to the car to get in" : undefined}
                />
                <HudButton
                  icon={<Eye className="h-4 w-4" />}
                  label={inCar ? "Driver's seat" : "First person"}
                  shortcut="C"
                  pressed={settings.view === "first"}
                  onClick={switchView}
                />
                {inCar ? (
                  <>
                    <HudButton icon={<Lightbulb className="h-4 w-4" />} label="Headlights" shortcut="L" pressed={settings.headlights} onClick={() => toggle("headlights", "Headlights")} />
                    <HudButton icon={<Zap className="h-4 w-4" />} label="High beams" shortcut="B" pressed={settings.highBeams} disabled={!settings.headlights} onClick={() => toggle("highBeams", "High beams")} />
                  </>
                ) : (
                  <HudButton icon={<Flashlight className="h-4 w-4" />} label="Flashlight" shortcut="L" pressed={settings.flashlight} onClick={() => toggle("flashlight", "Flashlight")} />
                )}
                <HudButton icon={<List className="h-4 w-4" />} label="Projects" shortcut="P" onClick={(event) => openMenu(event.currentTarget)} />
              </div>
              <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
                <HudButton icon={<Ghost className="h-4 w-4" />} label="Jump scares" pressed={settings.scares} onClick={() => toggle("scares", "Jump scares")} />
                <HudButton
                  icon={settings.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  label="Sound"
                  shortcut="M"
                  pressed={settings.sound}
                  onClick={() => toggle("sound", "Sound")}
                />
                <HudButton
                  icon={<Sparkles className="h-4 w-4" />}
                  label="High quality"
                  pressed={settings.quality === "high"}
                  onClick={() =>
                    setSettings((current) => {
                      const quality = current.quality === "high" ? "low" : "high";
                      announce(quality === "high" ? "High quality graphics" : "Performance graphics");
                      return { ...current, quality };
                    })
                  }
                />
                <HudButton icon={<CircleHelp className="h-4 w-4" />} label="Controls help" pressed={helpOpen} onClick={() => setHelpOpen((value) => !value)} />
                <DialogPrimitive.Close className={`${hudButton} border-primary/60`} aria-label="Exit 3D world">
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Exit</span>
                </DialogPrimitive.Close>
              </div>
            </div>

            {helpOpen && ready && (
              <div
                className={`pointer-events-auto absolute z-30 max-w-xs rounded-sm border border-white/10 bg-black/70 p-4 text-xs leading-relaxed text-white/85 backdrop-blur-md ${
                  isTouch ? "left-3 top-16" : "bottom-6 left-6"
                }`}
              >
                <p className="mb-2 font-display text-lg tracking-wider text-primary">Controls</p>
                {isTouch ? (
                  <ul className="space-y-1">
                    <li>Hold the arrow pad to {inCar ? "drive and steer" : "walk"}</li>
                    <li>Drag the scene to look around</li>
                    <li>Tap a billboard to open its project</li>
                  </ul>
                ) : (
                  <ul className="space-y-1">
                    <li><kbd className="text-white">W A S D</kbd> / arrows: {inCar ? "drive and steer" : "walk"}</li>
                    <li>{inCar ? <><kbd className="text-white">Space</kbd>: handbrake · <kbd className="text-white">H</kbd>: horn</> : <><kbd className="text-white">Shift</kbd>: run</>}</li>
                    <li>Drag to look around · scroll to zoom</li>
                    <li><kbd className="text-white">E</kbd>: get in/out · <kbd className="text-white">C</kbd>: view · <kbd className="text-white">R</kbd>: recentre</li>
                    <li><kbd className="text-white">F</kbd> or click a billboard: open project</li>
                  </ul>
                )}
                <button type="button" className="mt-3 text-primary underline-offset-4 hover:underline" onClick={() => setHelpOpen(false)}>
                  Hide controls
                </button>
              </div>
            )}

            {nearby.project && ready && (
              <div className="pointer-events-auto absolute bottom-28 left-1/2 z-30 -translate-x-1/2 md:bottom-10">
                <button
                  type="button"
                  onClick={(event) => nearby.project && openProject(nearby.project, event.currentTarget)}
                  className="flex items-center gap-3 rounded-sm border border-primary/70 bg-black/75 px-5 py-3 text-left backdrop-blur-md hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {!isTouch && <kbd className="rounded-sm bg-primary px-2 py-1 font-display text-lg leading-none">F</kbd>}
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.25em] text-white/60">Nearby project</span>
                    <span className="font-display text-2xl leading-none tracking-wide">{nearby.project.title}</span>
                  </span>
                </button>
              </div>
            )}
            {!inCar && nearby.car && ready && !nearby.project && (
              <p className="pointer-events-none absolute bottom-28 left-1/2 z-30 -translate-x-1/2 rounded-sm bg-black/70 px-4 py-2 text-sm md:bottom-10">
                {isTouch ? "Tap “Get in car” to drive again" : <>Press <kbd className="font-semibold text-primary">E</kbd> to get back in the car</>}
              </p>
            )}

            {inCar && ready && (
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute right-4 z-30 rounded-sm border border-white/10 bg-black/60 px-4 py-2 text-right backdrop-blur-md md:right-6 ${
                  isTouch ? "top-16" : "bottom-6"
                }`}
              >
                <span ref={speedReadout} className="font-display text-5xl leading-none tabular-nums">0</span>
                <span className="ml-1 text-xs uppercase tracking-widest text-white/60">km/h</span>
              </div>
            )}

            {isTouch && ready && (
              <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between p-4">
                <div className="grid grid-cols-3 gap-2">
                  <span />
                  {holdButton("forward", inCar ? "Accelerate" : "Walk forward", <ArrowUp className="h-6 w-6" aria-hidden="true" />)}
                  <span />
                  {holdButton("left", inCar ? "Steer left" : "Move left", <ArrowLeft className="h-6 w-6" aria-hidden="true" />)}
                  {holdButton("backward", inCar ? "Brake and reverse" : "Walk back", <ArrowDown className="h-6 w-6" aria-hidden="true" />)}
                  {holdButton("right", inCar ? "Steer right" : "Move right", <ArrowRight className="h-6 w-6" aria-hidden="true" />)}
                </div>
                <div className="flex flex-col gap-2">
                  {inCar ? (
                    <>
                      {holdButton("horn", "Horn", <Megaphone className="h-6 w-6" aria-hidden="true" />)}
                      {holdButton("brake", "Handbrake", <Octagon className="h-6 w-6" aria-hidden="true" />)}
                    </>
                  ) : (
                    holdButton("run", "Run", <Footprints className="h-6 w-6" aria-hidden="true" />)
                  )}
                  <button
                    type="button"
                    aria-label="Recentre camera"
                    onClick={() => commands.current.recenterCamera++}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md"
                  >
                    <LocateFixed className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            <p className="sr-only" role="status" aria-live="polite">
              {announcement}
            </p>

            <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[160] bg-black/70 backdrop-blur-sm" />
                <DialogPrimitive.Content
                  className="fixed left-1/2 top-1/2 z-[161] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm border border-primary/30 bg-card p-6 text-foreground shadow-2xl focus:outline-none"
                  onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    if (openedFromMenu.current) return;
                    (menuTriggerRef.current?.isConnected ? menuTriggerRef.current : worldRef.current)?.focus();
                  }}
                >
                  <DialogPrimitive.Title className="font-display text-3xl">Projects on the road</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mb-4 text-sm text-muted-foreground">
                    Featured billboards in the world, plus every other project.
                  </DialogPrimitive.Description>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {projectItems.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openProject(item, menuTriggerRef.current, true)}
                          className="flex w-full items-center justify-between gap-3 border border-border bg-background/60 px-3 py-2 text-left text-sm hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <span>{item.title}</span>
                          {FEATURED_PROJECTS.includes(item) && <span className="text-[10px] uppercase tracking-wider text-primary">Billboard</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <DialogPrimitive.Close className="absolute right-4 top-4 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label="Close project list">
                    <X className="h-5 w-5" aria-hidden="true" />
                  </DialogPrimitive.Close>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {selectedProject && (
        <DetailModal
          item={selectedProject}
          onClose={() => setSelectedProject(null)}
          returnFocusRef={returnFocusRef}
        />
      )}
    </section>
  );
};

export default StrangerThings3D;
