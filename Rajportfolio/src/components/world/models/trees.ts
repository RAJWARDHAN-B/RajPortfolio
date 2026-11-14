import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createRandom, valueNoise } from "../noise";

const UP = new THREE.Vector3(0, 1, 0);

const paint = (geometry: THREE.BufferGeometry, colorAt: (x: number, y: number, z: number) => THREE.Color) => {
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index++) {
    const color = colorAt(position.getX(index), position.getY(index), position.getZ(index));
    colors.set([color.r, color.g, color.b], index * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
};

const merge = (parts: THREE.BufferGeometry[]) => {
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error("Unable to merge tree geometry.");
  merged.computeVertexNormals();
  return merged;
};

/** Layered fir: drooping, noise-jittered tiers plus outward branch fans for a ragged silhouette. */
export function createPineGeometry(seed: number) {
  const random = createRandom(seed);
  const needleDark = new THREE.Color("#121c17");
  const needleLight = new THREE.Color("#2c3b31");
  const needleRust = new THREE.Color("#3b2a22");
  const parts: THREE.BufferGeometry[] = [];
  const tiers = 7;
  const tierColor = (x: number, y: number, z: number, radius: number, tierY: number) => {
    const outer = Math.min(1, Math.hypot(x, z) / Math.max(radius, 0.01));
    const color = needleDark.clone().lerp(needleLight, outer * 0.85 + valueNoise(x * 3, z * 3 + tierY, seed) * 0.2);
    return color.lerp(needleRust, Math.max(0, valueNoise(x * 0.8 + 9, y * 0.7, seed + 4) - 0.62) * 1.5);
  };

  for (let tier = 0; tier < tiers; tier++) {
    const t = tier / (tiers - 1);
    const radius = (2.45 - t * 2.0) * (0.88 + random() * 0.24);
    const height = 2.05 - t * 0.85;
    const y = 2.05 + t * 6.9;
    const cone = new THREE.ConeGeometry(radius, height, 9, 2, true);
    const position = cone.getAttribute("position");
    for (let index = 0; index < position.count; index++) {
      const x = position.getX(index);
      const vy = position.getY(index);
      const z = position.getZ(index);
      const rim = 0.5 - vy / height;
      const angle = Math.atan2(z, x);
      const wobble = 0.78 + valueNoise(Math.cos(angle) * 2 + tier * 3.1, Math.sin(angle) * 2 + rim, seed) * 0.45;
      const droop = rim * rim * radius * 0.3;
      position.setXYZ(index, x * wobble, vy - droop, z * wobble);
    }
    cone.rotateY(random() * Math.PI);
    cone.translate(0, y, 0);
    parts.push(paint(cone, (x, py, z) => tierColor(x, py, z, radius, y)));

    const fans = 6;
    for (let fan = 0; fan < fans; fan++) {
      const length = radius * (0.85 + random() * 0.4);
      const branch = new THREE.ConeGeometry(0.2 + radius * 0.1, length, 4, 1, true);
      branch.rotateZ(-Math.PI / 2);
      branch.translate(length / 2, 0, 0);
      branch.scale(1, 0.42, 1);
      branch.rotateZ(-0.3 - random() * 0.25);
      branch.rotateY((fan / fans) * Math.PI * 2 + random() * 0.7);
      branch.translate(0, y - height * 0.3, 0);
      parts.push(paint(branch, (x, py, z) => tierColor(x, py, z, radius, y).multiplyScalar(0.92)));
    }
  }
  const top = new THREE.ConeGeometry(0.2, 1.5, 6, 1, true);
  top.translate(0, 2.05 + 6.9 + 1.05, 0);
  parts.push(paint(top, () => needleLight.clone()));

  const trunk = new THREE.CylinderGeometry(0.1, 0.3, 9.6, 8, 6, true);
  trunk.translate(0, 4.8, 0);
  const trunkPosition = trunk.getAttribute("position");
  for (let index = 0; index < trunkPosition.count; index++) {
    const x = trunkPosition.getX(index);
    const y = trunkPosition.getY(index);
    const z = trunkPosition.getZ(index);
    const flare = 1 + Math.max(0, 0.7 - y) * 1.1;
    const bend = Math.sin(y * 0.45 + seed) * 0.08;
    trunkPosition.setXYZ(index, x * flare + bend, y, z * flare);
  }
  trunk.computeVertexNormals();
  return { foliage: merge(parts), trunk };
}

/** Recursive leafless tree with twisted limbs. */
export function createDeadTreeGeometry(seed: number) {
  const random = createRandom(seed);
  const parts: THREE.BufferGeometry[] = [];
  const segment = (start: THREE.Vector3, end: THREE.Vector3, radiusStart: number, radiusEnd: number) => {
    const direction = end.clone().sub(start);
    const length = direction.length();
    const geometry = new THREE.CylinderGeometry(radiusEnd, radiusStart, length, 6, 1, true);
    geometry.translate(0, length / 2, 0);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize()));
    geometry.translate(start.x, start.y, start.z);
    parts.push(geometry);
  };
  const grow = (start: THREE.Vector3, direction: THREE.Vector3, length: number, radius: number, depth: number) => {
    const segments = depth === 0 ? 4 : Math.max(1, 3 - depth);
    const segmentLength = length / segments;
    const point = start.clone();
    const heading = direction.clone();
    let currentRadius = radius;
    for (let step = 0; step < segments; step++) {
      heading.add(new THREE.Vector3((random() - 0.5) * 0.55, (random() - 0.25) * 0.25, (random() - 0.5) * 0.55)).normalize();
      const next = point.clone().addScaledVector(heading, segmentLength);
      const nextRadius = currentRadius * 0.74;
      segment(point, next, currentRadius, nextRadius);
      if (depth < 3 && step >= (depth === 0 ? 1 : 0)) {
        const branches = depth === 0 ? 2 : random() < 0.6 ? 2 : 1;
        for (let branch = 0; branch < branches; branch++) {
          const spread = new THREE.Vector3(random() - 0.5, 0.25 + random() * 0.45, random() - 0.5).normalize();
          grow(next, heading.clone().lerp(spread, 0.7).normalize(), length * (0.42 + random() * 0.18), nextRadius * 0.78, depth + 1);
        }
      }
      point.copy(next);
      currentRadius = nextRadius;
    }
  };
  grow(new THREE.Vector3(0, -0.4, 0), UP.clone(), 7.8, 0.34, 0);
  for (let root = 0; root < 4; root++) {
    const angle = (root / 4) * Math.PI * 2 + random();
    segment(new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(Math.cos(angle) * 0.9, -0.15, Math.sin(angle) * 0.9), 0.2, 0.05);
  }
  return merge(parts);
}

export function createRockGeometry(seed: number) {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const displacement = 0.72 + valueNoise(x * 1.7 + seed, z * 1.7 + y * 1.3, seed) * 0.5;
    position.setXYZ(index, x * displacement * 1.25, Math.max(-0.3, y * displacement * 0.62), z * displacement);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** A clump of bent, tapering blades with straw-coloured tips. */
export function createGrassGeometry(seed: number) {
  const random = createRandom(seed);
  const positions: number[] = [];
  const colors: number[] = [];
  const base = new THREE.Color("#1c1c12");
  const tip = new THREE.Color("#6d6043");
  for (let blade = 0; blade < 9; blade++) {
    const angle = random() * Math.PI * 2;
    const height = 0.35 + random() * 0.45;
    const bend = 0.12 + random() * 0.22;
    const width = 0.025 + random() * 0.02;
    const ox = (random() - 0.5) * 0.25;
    const oz = (random() - 0.5) * 0.25;
    const forwardX = Math.cos(angle);
    const forwardZ = Math.sin(angle);
    const sideX = -forwardZ * width;
    const sideZ = forwardX * width;
    const point = (fraction: number, side: number): [number, number, number] => [
      ox + forwardX * bend * fraction * fraction + sideX * side * (1 - fraction),
      height * fraction,
      oz + forwardZ * bend * fraction * fraction + sideZ * side * (1 - fraction),
    ];
    const strip = [point(0, -1), point(0, 1), point(0.5, -1), point(0.5, 1), point(1, 0)];
    for (const [a, b, c] of [[0, 1, 2], [1, 3, 2], [2, 3, 4]]) {
      for (const vertex of [strip[a], strip[b], strip[c]]) {
        positions.push(...vertex);
        const color = base.clone().lerp(tip, vertex[1] / height);
        colors.push(color.r, color.g, color.b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const normals = new Float32Array(positions.length);
  for (let index = 1; index < normals.length; index += 3) normals[index] = 1;
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return geometry;
}

export function createVineGeometry(paths: [number, number, number][][]) {
  const random = createRandom(404);
  const parts = paths.map((points) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    return new THREE.TubeGeometry(curve, points.length * 5, 0.045 + random() * 0.05, 5, false);
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error("Unable to merge vine geometry.");
  return merged;
}

/** Injects gentle, height-weighted wind sway into a standard material's vertex shader. */
export function addWindSway(material: THREE.Material, time: { value: number }, amplitude: number, startHeight: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = time;
    shader.vertexShader = `uniform float uWindTime;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      /* glsl */ `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 swayOrigin = instanceMatrix[3].xz;
      #else
        vec2 swayOrigin = vec2(0.0);
      #endif
      float swayHeight = max(position.y - ${startHeight.toFixed(2)}, 0.0);
      float sway = sin(uWindTime * 1.25 + swayOrigin.x * 0.21 + swayOrigin.y * 0.17) * 0.6
        + sin(uWindTime * 2.3 + swayOrigin.x * 0.53) * 0.25;
      transformed.x += sway * ${amplitude.toFixed(4)} * swayHeight;
      transformed.z += sway * ${(amplitude * 0.6).toFixed(4)} * swayHeight;`,
    );
  };
  material.customProgramCacheKey = () => `wind-${amplitude}-${startHeight}`;
}
