import { createRandom, fbm, smoothstep } from "./noise";

export const ROAD_HALF_WIDTH = 3.8;
export const ROAD_SURFACE_Y = 0.02;
export const WORLD_RADIUS = 226;
export const START_THETA = -1.35;

const BASE_RADIUS = 120;

/** The road is a closed loop described in polar coordinates, so road distance queries stay O(1). */
export const roadRadius = (theta: number) =>
  BASE_RADIUS + 17 * Math.sin(3 * theta) + 7 * Math.sin(5 * theta + 1.3);

export const roadRadiusSlope = (theta: number) => 51 * Math.cos(3 * theta) + 35 * Math.cos(5 * theta + 1.3);

export interface RoadFrame {
  x: number;
  z: number;
  /** Unit tangent in the direction of travel. */
  tx: number;
  tz: number;
  /** Unit normal pointing away from the loop's centre. */
  nx: number;
  nz: number;
}

export function roadFrame(theta: number): RoadFrame {
  const radius = roadRadius(theta);
  const slope = roadRadiusSlope(theta);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  let tx = slope * cos - radius * sin;
  let tz = slope * sin + radius * cos;
  const length = Math.hypot(tx, tz);
  tx /= length;
  tz /= length;
  return { x: radius * cos, z: radius * sin, tx, tz, nx: tz, nz: -tx };
}

/** Approximate perpendicular distance to the road centre line; positive outside the loop. */
export function signedRoadDistance(x: number, z: number) {
  const theta = Math.atan2(z, x);
  const radius = roadRadius(theta);
  return ((Math.hypot(x, z) - radius) * radius) / Math.hypot(radius, roadRadiusSlope(theta));
}

export const roadDistance = (x: number, z: number) => Math.abs(signedRoadDistance(x, z));

export function terrainHeight(x: number, z: number) {
  const distance = roadDistance(x, z);
  const hills =
    (fbm(x * 0.011 + 40, z * 0.011 - 13, 4, 7) - 0.5) * 24 + (fbm(x * 0.07, z * 0.07, 2, 11) - 0.5) * 1.4;
  const ditch = -0.32 * Math.exp(-((distance - 6.6) ** 2) / 2.2);
  return hills * smoothstep(9, 32, distance) + ditch - 0.08;
}

/** Height that vehicles and characters stand on: the road surface blended into the terrain. */
export function surfaceHeight(x: number, z: number) {
  const blend = smoothstep(ROAD_HALF_WIDTH - 0.2, ROAD_HALF_WIDTH + 1.4, roadDistance(x, z));
  return ROAD_SURFACE_Y + (terrainHeight(x, z) - ROAD_SURFACE_Y) * blend;
}

export interface RoadSample extends RoadFrame {
  theta: number;
  distance: number;
}

/** Samples the loop from the start line; the final sample closes the loop at the start position. */
export function sampleRoad(count: number) {
  const samples: RoadSample[] = [];
  let distance = 0;
  for (let index = 0; index <= count; index++) {
    const theta = START_THETA + (index / count) * Math.PI * 2;
    const frame = roadFrame(theta);
    const previous = samples[index - 1];
    if (previous) distance += Math.hypot(frame.x - previous.x, frame.z - previous.z);
    samples.push({ ...frame, theta, distance });
  }
  return { samples, length: distance };
}

export interface Obstacle {
  x: number;
  z: number;
  radius: number;
}

const MAX_OBSTACLE_RADIUS = 2;

export class ObstacleGrid {
  private readonly cells = new Map<number, Obstacle[]>();
  private readonly cellSize: number;

  constructor(cellSize = 8) {
    this.cellSize = cellSize;
  }

  private key(ix: number, iz: number) {
    return (ix + 2048) * 4096 + iz + 2048;
  }

  add(obstacle: Obstacle) {
    const key = this.key(Math.floor(obstacle.x / this.cellSize), Math.floor(obstacle.z / this.cellSize));
    const cell = this.cells.get(key);
    if (cell) cell.push(obstacle);
    else this.cells.set(key, [obstacle]);
  }

  forEachNear(x: number, z: number, radius: number, visit: (obstacle: Obstacle) => void) {
    const reach = radius + MAX_OBSTACLE_RADIUS;
    const minX = Math.floor((x - reach) / this.cellSize);
    const maxX = Math.floor((x + reach) / this.cellSize);
    const minZ = Math.floor((z - reach) / this.cellSize);
    const maxZ = Math.floor((z + reach) / this.cellSize);
    for (let ix = minX; ix <= maxX; ix++) {
      for (let iz = minZ; iz <= maxZ; iz++) this.cells.get(this.key(ix, iz))?.forEach(visit);
    }
  }
}

export interface CollisionResult {
  x: number;
  z: number;
  hit: boolean;
  normalX: number;
  normalZ: number;
}

/** Pushes a circle out of nearby obstacles and the world boundary. */
export function resolveCircle(grid: ObstacleGrid, x: number, z: number, radius: number): CollisionResult {
  let px = x;
  let pz = z;
  let normalX = 0;
  let normalZ = 0;
  let hit = false;
  grid.forEachNear(px, pz, radius, (obstacle) => {
    const dx = px - obstacle.x;
    const dz = pz - obstacle.z;
    const minimum = radius + obstacle.radius;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= minimum * minimum) return;
    const distance = Math.sqrt(distanceSq) || 0.0001;
    const ux = dx / distance;
    const uz = dz / distance;
    px += ux * (minimum - distance);
    pz += uz * (minimum - distance);
    normalX += ux;
    normalZ += uz;
    hit = true;
  });
  const fromCentre = Math.hypot(px, pz);
  const limit = WORLD_RADIUS - radius;
  if (fromCentre > limit) {
    px = (px / fromCentre) * limit;
    pz = (pz / fromCentre) * limit;
    normalX -= px / limit;
    normalZ -= pz / limit;
    hit = true;
  }
  const length = Math.hypot(normalX, normalZ) || 1;
  return { x: px, z: pz, hit, normalX: normalX / length, normalZ: normalZ / length };
}

class PointHash {
  private readonly cells = new Map<number, [number, number][]>();
  private readonly size: number;

  constructor(size: number) {
    this.size = size;
  }

  private key(ix: number, iz: number) {
    return (ix + 4096) * 8192 + iz + 4096;
  }

  near(x: number, z: number, distance: number) {
    const reach = Math.ceil(distance / this.size);
    const cx = Math.floor(x / this.size);
    const cz = Math.floor(z / this.size);
    for (let ix = cx - reach; ix <= cx + reach; ix++) {
      for (let iz = cz - reach; iz <= cz + reach; iz++) {
        const cell = this.cells.get(this.key(ix, iz));
        if (cell?.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < distance * distance)) return true;
      }
    }
    return false;
  }

  add(x: number, z: number) {
    const key = this.key(Math.floor(x / this.size), Math.floor(z / this.size));
    const cell = this.cells.get(key);
    if (cell) cell.push([x, z]);
    else this.cells.set(key, [[x, z]]);
  }
}

export interface Placement {
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
  variant: number;
  shade: number;
}

export interface Spot {
  x: number;
  z: number;
  rotation: number;
}

export interface PoleSpot extends Spot {
  lean: number;
  lamp: boolean;
}

export type SignKind = "welcome" | "creature" | "speed" | "turnBack";

export interface SignSpot extends Spot {
  kind: SignKind;
}

export interface ScareSite {
  x: number;
  z: number;
  kind: "road" | "forest";
}

export interface WorldLayout {
  start: { x: number; z: number; heading: number };
  billboards: Spot[];
  pines: Placement[];
  deadTrees: Placement[];
  rocks: Placement[];
  grass: Placement[];
  poles: PoleSpot[];
  signs: SignSpot[];
  scareSites: ScareSite[];
  vines: [number, number, number][][];
  obstacles: ObstacleGrid;
}

const headingOf = (x: number, z: number) => Math.atan2(x, z);

export function createWorldLayout(billboardCount: number): WorldLayout {
  const random = createRandom(1983);
  const obstacles = new ObstacleGrid();
  const startFrame = roadFrame(START_THETA);
  const start = {
    x: startFrame.x - startFrame.nx * 1.9,
    z: startFrame.z - startFrame.nz * 1.9,
    heading: headingOf(startFrame.tx, startFrame.tz),
  };

  const clearings: { x: number; z: number; radius: number }[] = [];
  const inClearing = (x: number, z: number, padding = 0) =>
    clearings.some((clearing) => (clearing.x - x) ** 2 + (clearing.z - z) ** 2 < (clearing.radius + padding) ** 2);

  const billboards = Array.from({ length: billboardCount }, (_, index) => {
    const frame = roadFrame(START_THETA + 0.42 + (index * (Math.PI * 2 - 0.84)) / Math.max(1, billboardCount));
    const side = index % 2 === 0 ? 1 : -1;
    const offset = ROAD_HALF_WIDTH + 6.5;
    const x = frame.x + frame.nx * offset * side;
    const z = frame.z + frame.nz * offset * side;
    const faceX = -frame.nx * side * 0.85 - frame.tx * 0.55;
    const faceZ = -frame.nz * side * 0.85 - frame.tz * 0.55;
    const rotation = headingOf(faceX, faceZ);
    clearings.push({ x, z, radius: 8.5 });
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    for (const post of [-2.6, 2.6]) obstacles.add({ x: x + cos * post, z: z - sin * post, radius: 0.25 });
    return { x, z, rotation };
  });

  const signs: SignSpot[] = (
    [
      [0.1, "welcome"],
      [0.3, "speed"],
      [0.86, "creature"],
      [3.1, "creature"],
      [4.25, "turnBack"],
    ] as const
  ).map(([offset, kind]) => {
    const frame = roadFrame(START_THETA + offset);
    const distance = ROAD_HALF_WIDTH + (kind === "welcome" ? 3.4 : 1.7);
    const x = frame.x - frame.nx * distance;
    const z = frame.z - frame.nz * distance;
    clearings.push({ x, z, radius: kind === "welcome" ? 4.5 : 2 });
    obstacles.add({ x, z, radius: kind === "welcome" ? 0.6 : 0.14 });
    return { x, z, kind, rotation: headingOf(-frame.tx + frame.nx * 0.25, -frame.tz + frame.nz * 0.25) };
  });

  const { samples, length } = sampleRoad(2400);
  const poles: PoleSpot[] = [];
  for (let distance = 18, sampleIndex = 0; distance < length - 20; distance += 34) {
    while (samples[sampleIndex + 1].distance < distance) sampleIndex++;
    const frame = samples[sampleIndex];
    const x = frame.x + frame.nx * (ROAD_HALF_WIDTH + 2.6);
    const z = frame.z + frame.nz * (ROAD_HALF_WIDTH + 2.6);
    if (inClearing(x, z, 1)) continue;
    poles.push({
      x,
      z,
      rotation: headingOf(frame.tx, frame.tz),
      lean: (random() - 0.5) * 0.07,
      lamp: poles.length % 4 === 1,
    });
    clearings.push({ x, z, radius: 2.2 });
    obstacles.add({ x, z, radius: 0.2 });
  }

  const scareSites: ScareSite[] = (
    [
      [1.0, "road", 0],
      [2.12, "forest", 1],
      [3.3, "road", 0],
      [4.55, "forest", -1],
      [5.55, "road", 0],
    ] as const
  ).map(([offset, kind, side]) => {
    const frame = roadFrame(START_THETA + offset);
    const distance = kind === "road" ? 0.6 : ROAD_HALF_WIDTH + 7;
    return { x: frame.x + frame.nx * distance * side, z: frame.z + frame.nz * distance * side, kind };
  });
  scareSites.forEach((site) => site.kind === "forest" && clearings.push({ x: site.x, z: site.z, radius: 2.5 }));

  const occupied = new PointHash(4);
  const scatter = (
    target: number,
    options: { min: number; max: number; exponent: number; spacing: number; clearance: number },
    create: (x: number, z: number, distance: number) => Placement | null,
  ) => {
    const placements: Placement[] = [];
    for (let attempt = 0; attempt < target * 12 && placements.length < target; attempt++) {
      const frame = roadFrame(random() * Math.PI * 2);
      const side = random() < 0.5 ? 1 : -1;
      const offset = options.min + Math.pow(random(), options.exponent) * (options.max - options.min);
      const x = frame.x + frame.nx * offset * side + (random() - 0.5) * 6;
      const z = frame.z + frame.nz * offset * side + (random() - 0.5) * 6;
      const distance = roadDistance(x, z);
      if (distance < options.min || Math.hypot(x, z) > WORLD_RADIUS - 8 || inClearing(x, z, options.clearance)) continue;
      if (options.spacing > 0 && occupied.near(x, z, options.spacing)) continue;
      const placement = create(x, z, distance);
      if (!placement) continue;
      if (options.spacing > 0) occupied.add(x, z);
      placements.push(placement);
    }
    return placements;
  };

  const pines = scatter(820, { min: ROAD_HALF_WIDTH + 4.2, max: 80, exponent: 1.5, spacing: 2.6, clearance: 1 }, (x, z) => {
    const scale = 0.72 + random() * 0.62;
    obstacles.add({ x, z, radius: 0.32 * scale + 0.08 });
    return { x, z, y: terrainHeight(x, z), rotation: random() * Math.PI * 2, scale, variant: random() < 0.5 ? 0 : 1, shade: random() };
  });

  const deadTrees = scatter(150, { min: ROAD_HALF_WIDTH + 3.6, max: 60, exponent: 1.2, spacing: 3, clearance: 1 }, (x, z) => {
    const scale = 0.8 + random() * 0.55;
    obstacles.add({ x, z, radius: 0.3 * scale + 0.08 });
    return { x, z, y: terrainHeight(x, z), rotation: random() * Math.PI * 2, scale, variant: Math.floor(random() * 3), shade: random() };
  });

  const rocks = scatter(210, { min: ROAD_HALF_WIDTH + 1.8, max: 55, exponent: 1.3, spacing: 1.6, clearance: 0.5 }, (x, z) => {
    const scale = 0.3 + random() ** 2 * 1.3;
    if (scale > 0.55) obstacles.add({ x, z, radius: scale * 0.85 });
    return { x, z, y: terrainHeight(x, z), rotation: random() * Math.PI * 2, scale, variant: Math.floor(random() * 3), shade: random() };
  });

  const grass = scatter(2800, { min: ROAD_HALF_WIDTH + 0.3, max: 34, exponent: 1.7, spacing: 0, clearance: -1 }, (x, z) => ({
    x,
    z,
    y: terrainHeight(x, z),
    rotation: random() * Math.PI * 2,
    scale: 0.55 + random() * 0.8,
    variant: 0,
    shade: random(),
  }));

  const vines: [number, number, number][][] = [];
  for (let index = 0; index < 34; index++) {
    const anchor = index < billboards.length * 2 ? billboards[index % billboards.length] : null;
    const frame = roadFrame(random() * Math.PI * 2);
    const side = random() < 0.5 ? 1 : -1;
    let x = anchor ? anchor.x + (random() - 0.5) * 9 : frame.x + frame.nx * (ROAD_HALF_WIDTH + 2 + random() * 9) * side;
    let z = anchor ? anchor.z + (random() - 0.5) * 9 : frame.z + frame.nz * (ROAD_HALF_WIDTH + 2 + random() * 9) * side;
    let direction = random() * Math.PI * 2;
    const points: [number, number, number][] = [];
    const steps = 9 + Math.floor(random() * 7);
    for (let step = 0; step < steps; step++) {
      const lift = Math.sin((step / (steps - 1)) * Math.PI) * 0.12 + random() * 0.05;
      points.push([x, terrainHeight(x, z) + 0.06 + lift, z]);
      direction += (random() - 0.5) * 1.1;
      x += Math.sin(direction) * 0.9;
      z += Math.cos(direction) * 0.9;
      if (roadDistance(x, z) < ROAD_HALF_WIDTH + 0.4) direction += Math.PI * 0.6;
    }
    vines.push(points);
  }

  return { start, billboards, pines, deadTrees, rocks, grass, poles, signs, scareSites, vines, obstacles };
}
