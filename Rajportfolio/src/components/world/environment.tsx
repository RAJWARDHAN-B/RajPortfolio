import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ContentItem } from "@/data/portfolio";
import { ROAD_HALF_WIDTH, ROAD_SURFACE_Y, roadDistance, sampleRoad, terrainHeight, type Placement, type Spot } from "./layout";
import { fbm, smoothstep } from "./noise";
import { disposeObject } from "./models/car";
import {
  addWindSway,
  createDeadTreeGeometry,
  createGrassGeometry,
  createPineGeometry,
  createRockGeometry,
  createVineGeometry,
} from "./models/trees";
import { useWorld } from "./runtime";
import { createLabelTexture, createSignTexture, ROAD_TEXTURE_LENGTH } from "./textures";

const SECTORS = 10;
const UP = new THREE.Vector3(0, 1, 0);

interface SectorOptions {
  castShadow?: boolean;
  scale?: (placement: Placement) => [number, number, number];
  yOffset?: (placement: Placement) => number;
  tint?: (placement: Placement, target: THREE.Color) => THREE.Color;
}

/** Splits instances into angular sectors so the GPU can frustum-cull most of the forest. */
function buildSectors(geometry: THREE.BufferGeometry, material: THREE.Material, placements: Placement[], options: SectorOptions = {}) {
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  const buckets: Placement[][] = Array.from({ length: SECTORS }, () => []);
  for (const placement of placements) {
    const sector = Math.floor(((Math.atan2(placement.z, placement.x) + Math.PI) / (Math.PI * 2)) * SECTORS);
    buckets[Math.min(SECTORS - 1, sector)].push(placement);
  }
  return buckets
    .filter((bucket) => bucket.length > 0)
    .map((bucket) => {
      const mesh = new THREE.InstancedMesh(geometry, material, bucket.length);
      bucket.forEach((placement, index) => {
        const [sx, sy, sz] = options.scale?.(placement) ?? [placement.scale, placement.scale, placement.scale];
        matrix.compose(
          position.set(placement.x, placement.y + (options.yOffset?.(placement) ?? 0), placement.z),
          quaternion.setFromAxisAngle(UP, placement.rotation),
          scale.set(sx, sy, sz),
        );
        mesh.setMatrixAt(index, matrix);
        if (options.tint) mesh.setColorAt(index, options.tint(placement, color));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = options.castShadow ?? true;
      mesh.receiveShadow = true;
      return mesh;
    });
}

export function Terrain() {
  const { textures } = useWorld();
  const terrain = useMemo(() => {
    const size = 480;
    const geometry = new THREE.PlaneGeometry(size, size, 200, 200);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.getAttribute("position");
    const colors = new Float32Array(position.count * 3);
    for (let index = 0; index < position.count; index++) {
      const x = position.getX(index);
      const z = position.getZ(index);
      position.setY(index, terrainHeight(x, z));
      const shade = 0.6 + fbm(x * 0.025, z * 0.025, 3, 5) * 0.75;
      const shoulder = 1 - smoothstep(ROAD_HALF_WIDTH, ROAD_HALF_WIDTH + 5, roadDistance(x, z));
      colors.set([shade * (1 + shoulder * 0.35), shade * (0.92 + shoulder * 0.3), shade * (0.9 + shoulder * 0.28)], index * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    textures.ground.repeat.set(size / 9, size / 9);
    const material = new THREE.MeshStandardMaterial({ map: textures.ground, vertexColors: true, roughness: 1, metalness: 0 });
    return { geometry, material };
  }, [textures.ground]);
  useEffect(() => () => {
    terrain.geometry.dispose();
    terrain.material.dispose();
  }, [terrain]);
  return <mesh geometry={terrain.geometry} material={terrain.material} receiveShadow />;
}

export function Road() {
  const { textures } = useWorld();
  const road = useMemo(() => {
    const { samples, length } = sampleRoad(1600);
    const vScale = Math.round(length / ROAD_TEXTURE_LENGTH) / length;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    samples.forEach((sample, index) => {
      positions.push(sample.x + sample.nx * ROAD_HALF_WIDTH, ROAD_SURFACE_Y, sample.z + sample.nz * ROAD_HALF_WIDTH);
      positions.push(sample.x - sample.nx * ROAD_HALF_WIDTH, ROAD_SURFACE_Y, sample.z - sample.nz * ROAD_HALF_WIDTH);
      uvs.push(0, sample.distance * vScale, 1, sample.distance * vScale);
      if (index < samples.length - 1) {
        const outer = index * 2;
        indices.push(outer, outer + 1, outer + 2, outer + 1, outer + 3, outer + 2);
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      map: textures.road.map,
      roughnessMap: textures.road.roughnessMap,
      bumpMap: textures.road.map,
      bumpScale: 1.4,
      roughness: 1,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    return { geometry, material };
  }, [textures.road]);
  useEffect(() => () => {
    road.geometry.dispose();
    road.material.dispose();
  }, [road]);
  return <mesh geometry={road.geometry} material={road.material} receiveShadow />;
}

export function Forest() {
  const { layout, textures, wind } = useWorld();
  const forest = useMemo(() => {
    const pineVariants = [createPineGeometry(11), createPineGeometry(29)];
    const deadVariants = [createDeadTreeGeometry(5), createDeadTreeGeometry(17), createDeadTreeGeometry(23)];
    const rockVariants = [createRockGeometry(1), createRockGeometry(2), createRockGeometry(3)];
    const grass = createGrassGeometry(9);
    const vines = createVineGeometry(layout.vines);

    const foliage = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
    addWindSway(foliage, wind, 0.0055, 2);
    const bark = new THREE.MeshStandardMaterial({ map: textures.bark, color: "#8a7f78", roughness: 0.95 });
    const deadBark = new THREE.MeshStandardMaterial({ map: textures.bark, color: "#77706c", roughness: 0.95 });
    const rock = new THREE.MeshStandardMaterial({ color: "#4f4b4c", roughness: 0.88, flatShading: true });
    const grassMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide });
    addWindSway(grassMaterial, wind, 0.12, 0);
    const vine = new THREE.MeshStandardMaterial({ color: "#1c090c", roughness: 0.3, metalness: 0.15, emissive: "#3a0409", emissiveIntensity: 0.7 });

    const pineTint = (placement: Placement, target: THREE.Color) =>
      target.setRGB(0.8 + placement.shade * 0.45, 0.8 + placement.shade * 0.35, 0.82 + placement.shade * 0.3);
    const objects: THREE.Object3D[] = [];
    pineVariants.forEach((variant, index) => {
      const placements = layout.pines.filter((placement) => placement.variant === index);
      objects.push(...buildSectors(variant.foliage, foliage, placements, { tint: pineTint }));
      objects.push(...buildSectors(variant.trunk, bark, placements));
    });
    deadVariants.forEach((geometry, index) =>
      objects.push(...buildSectors(geometry, deadBark, layout.deadTrees.filter((placement) => placement.variant === index))),
    );
    rockVariants.forEach((geometry, index) =>
      objects.push(
        ...buildSectors(geometry, rock, layout.rocks.filter((placement) => placement.variant === index), {
          scale: (placement) => [placement.scale, placement.scale * (0.7 + placement.shade * 0.5), placement.scale * 0.9],
          yOffset: (placement) => -placement.scale * 0.12,
          tint: (placement, target) => target.setScalar(0.7 + placement.shade * 0.5),
        }),
      ),
    );
    objects.push(
      ...buildSectors(grass, grassMaterial, layout.grass, {
        castShadow: false,
        tint: (placement, target) => target.setRGB(0.75 + placement.shade * 0.5, 0.75 + placement.shade * 0.4, 0.7 + placement.shade * 0.3),
      }),
    );
    const vineMesh = new THREE.Mesh(vines, vine);
    vineMesh.castShadow = true;
    vineMesh.receiveShadow = true;
    objects.push(vineMesh);

    const geometries = [...pineVariants.flatMap((variant) => [variant.foliage, variant.trunk]), ...deadVariants, ...rockVariants, grass, vines];
    const materials = [foliage, bark, deadBark, rock, grassMaterial, vine];
    return {
      objects,
      dispose: () => {
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        objects.forEach((object) => (object as THREE.InstancedMesh).dispose?.());
      },
    };
  }, [layout, textures.bark, wind]);
  useEffect(() => () => forest.dispose(), [forest]);
  return (
    <>
      {forest.objects.map((object) => (
        <primitive key={object.uuid} object={object} />
      ))}
    </>
  );
}

const WIRE_OFFSETS: [number, number][] = [[-0.95, 8.38], [0.95, 8.38], [0, 9.12]];

export function Roadside() {
  const { layout, textures, player } = useWorld();
  const lampLight = useRef<THREE.PointLight>(null);
  const roadside = useMemo(() => {
    const group = new THREE.Group();
    const signTextures: THREE.Texture[] = [];
    const wood = new THREE.MeshStandardMaterial({ map: textures.bark, color: "#6f5a4b", roughness: 0.92 });
    const metal = new THREE.MeshStandardMaterial({ color: "#55585c", metalness: 0.65, roughness: 0.45 });
    const insulatorMaterial = new THREE.MeshStandardMaterial({ color: "#3d6b62", roughness: 0.15, metalness: 0.1 });
    const wireMaterial = new THREE.MeshStandardMaterial({ color: "#0a0a0a", roughness: 0.55 });
    const bulbMaterial = new THREE.MeshStandardMaterial({ color: "#ffd9a6", emissive: "#ffb56b", emissiveIntensity: 3, toneMapped: false });

    const poleParts = [
      new THREE.CylinderGeometry(0.12, 0.17, 9, 9).translate(0, 4.5, 0),
      new THREE.BoxGeometry(2.3, 0.13, 0.13).translate(0, 8.25, 0),
      new THREE.BoxGeometry(0.06, 0.9, 0.06).rotateZ(0.9).translate(-0.4, 7.95, 0),
      new THREE.BoxGeometry(0.06, 0.9, 0.06).rotateZ(-0.9).translate(0.4, 7.95, 0),
    ];
    const poleGeometry = mergeGeometries(poleParts.map((part) => part.toNonIndexed()));
    const insulatorGeometry = mergeGeometries(
      WIRE_OFFSETS.map(([x, y]) => new THREE.CylinderGeometry(0.035, 0.055, 0.16, 8).translate(x, y - 0.06, 0).toNonIndexed()),
    );
    if (!poleGeometry || !insulatorGeometry) throw new Error("Unable to build utility poles.");
    const poles = new THREE.InstancedMesh(poleGeometry, wood, layout.poles.length);
    const insulators = new THREE.InstancedMesh(insulatorGeometry, insulatorMaterial, layout.poles.length);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const lean = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const anchors: THREE.Vector3[][] = [];
    const lamps: THREE.Vector3[] = [];
    layout.poles.forEach((pole, index) => {
      const base = new THREE.Vector3(pole.x, terrainHeight(pole.x, pole.z) - 0.4, pole.z);
      quaternion.setFromAxisAngle(UP, pole.rotation).multiply(lean.setFromAxisAngle(new THREE.Vector3(0, 0, 1), pole.lean));
      matrix.compose(base, quaternion, scale);
      poles.setMatrixAt(index, matrix);
      insulators.setMatrixAt(index, matrix);
      anchors.push(WIRE_OFFSETS.map(([x, y]) => new THREE.Vector3(x, y, 0).applyQuaternion(quaternion).add(base)));
      if (pole.lamp) {
        const lamp = new THREE.Group();
        lamp.position.copy(base);
        lamp.quaternion.copy(quaternion);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.08), metal);
        arm.position.set(-1.35, 7.35, 0);
        arm.rotation.z = -0.08;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.3), metal);
        head.position.set(-2.7, 7.24, 0);
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.03, 0.2), bulbMaterial);
        bulb.position.set(-2.7, 7.16, 0);
        lamp.add(arm, head, bulb);
        arm.castShadow = head.castShadow = true;
        group.add(lamp);
        lamps.push(new THREE.Vector3(-2.7, 6.9, 0).applyQuaternion(quaternion).add(base));
      }
    });
    poles.castShadow = insulators.castShadow = true;
    poles.computeBoundingSphere();
    insulators.computeBoundingSphere();
    group.add(poles, insulators);

    const wireParts: THREE.BufferGeometry[] = [];
    anchors.forEach((current, index) => {
      const next = anchors[(index + 1) % anchors.length];
      if (current[0].distanceTo(next[0]) > 48) return;
      current.forEach((start, wire) => {
        const end = next[wire];
        const control = start.clone().add(end).multiplyScalar(0.5);
        control.y -= 1.6;
        wireParts.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start, control, end), 12, 0.014, 4, false));
      });
    });
    const wireGeometry = mergeGeometries(wireParts);
    wireParts.forEach((part) => part.dispose());
    if (wireGeometry) group.add(new THREE.Mesh(wireGeometry, wireMaterial));

    layout.signs.forEach((sign) => {
      const texture = createSignTexture(sign.kind);
      signTextures.push(texture);
      const signGroup = new THREE.Group();
      signGroup.position.set(sign.x, terrainHeight(sign.x, sign.z), sign.z);
      signGroup.rotation.y = sign.rotation;
      const face = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.55,
        metalness: sign.kind === "welcome" || sign.kind === "turnBack" ? 0 : 0.3,
        transparent: sign.kind === "creature",
        alphaTest: sign.kind === "creature" ? 0.4 : 0,
      });
      const addMesh = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], rotationZ = 0) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        mesh.rotation.z = rotationZ;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        signGroup.add(mesh);
        return mesh;
      };
      if (sign.kind === "welcome") {
        for (const x of [-2, 2]) addMesh(new THREE.BoxGeometry(0.2, 3.6, 0.2), wood, [x, 1.6, -0.08]);
        addMesh(new THREE.BoxGeometry(4.7, 2.4, 0.12), wood, [0, 2.4, -0.1]);
        addMesh(new THREE.PlaneGeometry(4.5, 2.25), face, [0, 2.4, -0.035]);
      } else if (sign.kind === "turnBack") {
        addMesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), wood, [0, 0.7, -0.05], 0.12);
        addMesh(new THREE.PlaneGeometry(1.5, 0.75), face, [0.05, 1.25, 0.02], 0.1);
      } else {
        addMesh(new THREE.CylinderGeometry(0.035, 0.035, 2.8, 8), metal, [0, 1.4, -0.04]);
        const size: [number, number] = sign.kind === "creature" ? [1.2, 1.2] : [0.62, 0.78];
        addMesh(new THREE.PlaneGeometry(...size), face, [0, 2.45, 0]);
        addMesh(new THREE.PlaneGeometry(...size), metal, [0, 2.45, -0.01]).rotation.y = Math.PI;
      }
      group.add(signGroup);
    });

    return {
      group,
      lamps,
      dispose: () => {
        disposeObject(group, signTextures);
        poleParts.forEach((part) => part.dispose());
      },
    };
  }, [layout, textures.bark]);
  useEffect(() => () => roadside.dispose(), [roadside]);

  useFrame(({ clock }) => {
    const light = lampLight.current;
    if (!light || roadside.lamps.length === 0) return;
    let nearest = roadside.lamps[0];
    for (const lamp of roadside.lamps) if (lamp.distanceToSquared(player) < nearest.distanceToSquared(player)) nearest = lamp;
    light.position.copy(nearest);
    const time = clock.elapsedTime;
    const flicker = Math.sin(time * 1.7) * Math.sin(time * 2.9 + 1.3) > 0.82 ? 0.35 : 1;
    light.intensity = 26 * flicker;
  });

  return (
    <>
      <primitive object={roadside.group} />
      <pointLight ref={lampLight} color="#ffae5c" distance={22} decay={1.6} intensity={26} />
    </>
  );
}

function Billboard({ item, spot, onSelect }: { item: ContentItem; spot: Spot; onSelect: (item: ContentItem) => void }) {
  const { gl } = useThree();
  const [hovered, setHovered] = useState(false);
  const assets = useMemo(() => {
    const screen = new THREE.TextureLoader().load(item.image, (texture) => {
      const image = texture.image as HTMLImageElement;
      const aspect = image.width / image.height;
      const target = 16 / 9;
      if (aspect > target) {
        texture.repeat.set(target / aspect, 1);
        texture.offset.set((1 - target / aspect) / 2, 0);
      } else {
        texture.repeat.set(1, aspect / target);
        texture.offset.set(0, (1 - aspect / target) / 2);
      }
    });
    screen.colorSpace = THREE.SRGBColorSpace;
    screen.anisotropy = 8;
    return { screen, label: createLabelTexture(item.title, `${item.category} · ${item.year}`) };
  }, [item]);
  useEffect(() => () => {
    assets.screen.dispose();
    assets.label.dispose();
  }, [assets]);
  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "";
  }, [gl, hovered]);
  useEffect(() => () => {
    gl.domElement.style.cursor = "";
  }, [gl]);

  const select = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 6) return;
    event.stopPropagation();
    onSelect(item);
  };
  const neon = hovered ? 5 : 2.6;

  return (
    <group position={[spot.x, terrainHeight(spot.x, spot.z) - 0.2, spot.z]} rotation={[0, spot.rotation, 0]}>
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 3.1, -0.22]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 6.2, 0.22]} />
          <meshStandardMaterial color="#26282b" metalness={0.65} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 4.35, -0.12]} castShadow receiveShadow>
        <boxGeometry args={[6.95, 4.1, 0.22]} />
        <meshStandardMaterial color="#141416" metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh
        position={[0, 4.35, 0.005]}
        onClick={select}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[6.4, 3.6]} />
        <meshStandardMaterial map={assets.screen} emissiveMap={assets.screen} emissive="#ffffff" emissiveIntensity={hovered ? 0.8 : 0.5} roughness={0.5} />
      </mesh>
      {[
        [0, 6.19, 6.56, 0.08],
        [0, 2.51, 6.56, 0.08],
        [-3.24, 4.35, 0.08, 3.76],
        [3.24, 4.35, 0.08, 3.76],
      ].map(([x, y, width, height]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 0.04]}>
          <boxGeometry args={[width, height, 0.06]} />
          <meshStandardMaterial color="#5a0008" emissive="#ff1424" emissiveIntensity={neon} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 6.95, -0.05]}>
        <planeGeometry args={[6.6, 1.03]} />
        <meshStandardMaterial map={assets.label} emissiveMap={assets.label} emissive="#ffffff" emissiveIntensity={0.85} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.2, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[6.9, 0.07, 0.75]} />
        <meshStandardMaterial color="#2c2e31" metalness={0.6} roughness={0.5} />
      </mesh>
      {[-2.2, 0, 2.2].map((x) => (
        <group key={x} position={[x, 2.3, 0.62]} rotation={[-0.6, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.32, 0.14, 0.18]} />
            <meshStandardMaterial color="#1b1b1d" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.071, 0]}>
            <boxGeometry args={[0.26, 0.01, 0.12]} />
            <meshStandardMaterial color="#fff2da" emissive="#ffe2b0" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Billboards({ items, onSelect }: { items: ContentItem[]; onSelect: (item: ContentItem) => void }) {
  const { layout, player } = useWorld();
  const glow = useRef<THREE.PointLight>(null);
  const forward = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const light = glow.current;
    if (!light || layout.billboards.length === 0) return;
    let nearest = layout.billboards[0];
    let nearestDistance = Infinity;
    for (const spot of layout.billboards) {
      const distance = (spot.x - player.x) ** 2 + (spot.z - player.z) ** 2;
      if (distance < nearestDistance) {
        nearest = spot;
        nearestDistance = distance;
      }
    }
    forward.set(Math.sin(nearest.rotation), 0, Math.cos(nearest.rotation));
    light.position.set(nearest.x + forward.x * 3.2, terrainHeight(nearest.x, nearest.z) + 3.6, nearest.z + forward.z * 3.2);
  });
  return (
    <>
      {items.map((item, index) =>
        layout.billboards[index] ? <Billboard key={item.id} item={item} spot={layout.billboards[index]} onSelect={onSelect} /> : null,
      )}
      <pointLight ref={glow} color="#ff4050" intensity={30} distance={16} decay={1.5} />
    </>
  );
}
