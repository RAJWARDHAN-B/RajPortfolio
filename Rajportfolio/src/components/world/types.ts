import type { MutableRefObject } from "react";
import type { ContentItem } from "@/data/portfolio";

export type TravelMode = "drive" | "walk";
export type CameraView = "third" | "first";
export type Quality = "high" | "low";

export interface ControlState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  run: boolean;
  horn: boolean;
}

export const createControlState = (): ControlState => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
  run: false,
  horn: false,
});

export interface WorldTelemetry {
  speedKmh: number;
}

export interface WorldCommands {
  recenterCamera: number;
}

export interface NearbyState {
  project: ContentItem | null;
  car: boolean;
}

export interface WorldSettings {
  mode: TravelMode;
  view: CameraView;
  headlights: boolean;
  flashlight: boolean;
  highBeams: boolean;
  scares: boolean;
  sound: boolean;
  quality: Quality;
  reducedMotion: boolean;
  paused: boolean;
}

export interface WorldSceneProps {
  settings: WorldSettings;
  initialMode: TravelMode;
  featured: ContentItem[];
  controls: MutableRefObject<ControlState>;
  telemetry: MutableRefObject<WorldTelemetry>;
  commands: MutableRefObject<WorldCommands>;
  audioContext: AudioContext | null;
  onReady: () => void;
  onNearbyChange: (nearby: NearbyState) => void;
  onSelectProject: (item: ContentItem) => void;
  onScare: () => void;
  onContextLost: () => void;
}
