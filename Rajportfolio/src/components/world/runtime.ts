import { createContext, useContext, type MutableRefObject } from "react";
import type * as THREE from "three";
import type { WorldAudio } from "./audio";
import type { WorldLayout } from "./layout";
import type { WorldSettings } from "./types";
import type { VehicleState } from "./vehicle";

export interface WalkerState {
  x: number;
  y: number;
  z: number;
  facing: number;
  vx: number;
  vz: number;
  stride: number;
}

/** Transient screen effects, decayed every frame by the game loop. */
export interface FxState {
  shake: number;
  flash: number;
  aberration: number;
  lightning: number;
}

export interface SharedTextures {
  ground: THREE.Texture;
  bark: THREE.Texture;
  puff: THREE.Texture;
  road: { map: THREE.Texture; roughnessMap: THREE.Texture };
}

export interface WorldRuntime {
  layout: WorldLayout;
  vehicle: VehicleState;
  walker: WalkerState;
  /** Position of whoever the visitor currently controls. */
  player: THREE.Vector3;
  fx: FxState;
  audio: WorldAudio;
  wind: { value: number };
  settings: MutableRefObject<WorldSettings>;
  textures: SharedTextures;
  envMap: THREE.Texture | null;
  scareActive: boolean;
}

export const WorldContext = createContext<WorldRuntime | null>(null);

export function useWorld() {
  const world = useContext(WorldContext);
  if (!world) throw new Error("World components must be rendered inside the world provider.");
  return world;
}
