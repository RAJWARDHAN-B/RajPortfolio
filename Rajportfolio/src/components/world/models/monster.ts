import * as THREE from "three";
import { createRandom } from "../noise";
import { disposeObject } from "./car";

export interface MonsterArm {
  shoulder: THREE.Group;
  elbow: THREE.Group;
  fingers: THREE.Group[];
}

export interface MonsterRig {
  root: THREE.Group;
  hips: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Group;
  arms: MonsterArm[];
  legs: { hip: THREE.Group; knee: THREE.Group }[];
  tendrils: THREE.Group[];
  eyeMaterial: THREE.MeshStandardMaterial;
  mouthMaterial: THREE.MeshStandardMaterial;
  dispose: () => void;
}

const tapered = (length: number, top: number, bottom: number, segments = 8) => {
  const geometry = new THREE.CylinderGeometry(top, bottom, length, segments, 2);
  geometry.translate(0, -length / 2, 0);
  return geometry;
};

/** An original, gaunt creature (about 2.5 m tall) facing +Z. */
export function createMonster(skinBump: THREE.Texture | null, seed = 7): MonsterRig {
  const random = createRandom(seed);
  const root = new THREE.Group();
  root.name = "creature";
  const skin = new THREE.MeshStandardMaterial({
    color: "#1a1213",
    roughness: 0.36,
    metalness: 0.12,
    emissive: "#160203",
    bumpMap: skinBump,
    bumpScale: 2.5,
  });
  const bone = new THREE.MeshStandardMaterial({ color: "#cbbfa9", roughness: 0.45 });
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: "#ff2a1a", emissive: "#ff1a10", emissiveIntensity: 5, toneMapped: false });
  const mouthMaterial = new THREE.MeshStandardMaterial({ color: "#2a0003", emissive: "#a0000c", emissiveIntensity: 1.6, toneMapped: false });

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, position: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const hips = new THREE.Group();
  hips.position.y = 1.32;
  root.add(hips);
  add(new THREE.SphereGeometry(0.15, 14, 10), skin, hips).scale.set(1.3, 0.8, 0.9);

  const legs = [1, -1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.13, -0.02, 0);
    hips.add(hip);
    add(tapered(0.7, 0.075, 0.045), skin, hip);
    const knee = new THREE.Group();
    knee.position.y = -0.7;
    hip.add(knee);
    add(new THREE.SphereGeometry(0.055, 10, 8), skin, knee);
    add(tapered(0.66, 0.045, 0.028), skin, knee);
    for (const toe of [-0.05, 0, 0.05]) {
      const claw = add(new THREE.ConeGeometry(0.018, 0.2, 6), bone, knee, [toe, -0.66, 0.08]);
      claw.rotation.x = Math.PI / 2 + 0.25;
    }
    return { hip, knee };
  });

  const body = new THREE.Group();
  body.rotation.x = 0.35;
  hips.add(body);
  const torsoProfile = [
    [0.0, 0.0], [0.11, 0.02], [0.1, 0.18], [0.14, 0.36], [0.2, 0.55], [0.19, 0.7], [0.15, 0.82], [0.06, 0.9], [0.0, 0.92],
  ].map(([radius, y]) => new THREE.Vector2(radius, y));
  add(new THREE.LatheGeometry(torsoProfile, 18), skin, body).scale.set(1.25, 1, 0.82);
  for (let rib = 0; rib < 5; rib++) {
    const ribMesh = add(new THREE.TorusGeometry(0.19 - rib * 0.008, 0.011, 6, 18, Math.PI * 0.9), bone, body, [0, 0.4 + rib * 0.075, 0.02]);
    ribMesh.rotation.set(Math.PI / 2, 0, Math.PI * 0.05);
    ribMesh.scale.set(1.28, 0.82, 1);
  }
  for (let ridge = 0; ridge < 7; ridge++) {
    const spine = add(new THREE.ConeGeometry(0.025, 0.09, 5), bone, body, [0, 0.15 + ridge * 0.11, -0.15]);
    spine.rotation.x = -Math.PI / 2 - 0.4;
  }

  const head = new THREE.Group();
  head.position.set(0, 1.04, 0.1);
  body.add(head);
  add(tapered(0.24, 0.045, 0.06), skin, body, [0, 1.04, 0.06]).rotation.x = 0.2;
  add(new THREE.SphereGeometry(0.16, 22, 18), skin, head, [0, 0.12, 0]).scale.set(0.82, 1.3, 1.05);
  add(new THREE.BoxGeometry(0.22, 0.035, 0.08), skin, head, [0, 0.19, 0.11]).rotation.x = 0.35;
  const eyes: [number, number, number][] = [
    [0.055, 0.15, 0.15], [-0.055, 0.15, 0.15], [0.075, 0.09, 0.14], [-0.075, 0.09, 0.14], [0.035, 0.03, 0.155], [-0.035, 0.03, 0.155],
  ];
  eyes.forEach(([x, y, z], index) => add(new THREE.SphereGeometry(index < 2 ? 0.026 : 0.019, 10, 8), eyeMaterial, head, [x, y, z]));
  add(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mouthMaterial, head, [0, -0.04, 0.07]).scale.set(1, 0.6, 1);
  for (let tooth = 0; tooth < 9; tooth++) {
    const angle = -0.9 + (tooth / 8) * 1.8;
    const fang = add(new THREE.ConeGeometry(0.009, 0.05 + random() * 0.03, 5), bone, head, [Math.sin(angle) * 0.075, -0.035, 0.1 + Math.cos(angle) * 0.04]);
    fang.rotation.x = Math.PI;
  }
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.04, 0.02);
  head.add(jaw);
  add(new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), skin, jaw, [0, 0, 0.04]).scale.set(0.9, 0.9, 1.25);
  for (let tooth = 0; tooth < 8; tooth++) {
    const angle = -0.85 + (tooth / 7) * 1.7;
    add(new THREE.ConeGeometry(0.008, 0.045 + random() * 0.025, 5), bone, jaw, [Math.sin(angle) * 0.07, 0.015, 0.06 + Math.cos(angle) * 0.07]);
  }

  const arms = [1, -1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.25, 0.82, 0);
    body.add(shoulder);
    add(new THREE.SphereGeometry(0.06, 10, 8), skin, shoulder);
    add(tapered(0.78, 0.05, 0.034), skin, shoulder);
    const elbow = new THREE.Group();
    elbow.position.y = -0.78;
    shoulder.add(elbow);
    add(new THREE.SphereGeometry(0.038, 10, 8), skin, elbow);
    add(tapered(0.84, 0.034, 0.024), skin, elbow);
    const hand = new THREE.Group();
    hand.position.y = -0.86;
    elbow.add(hand);
    add(new THREE.SphereGeometry(0.035, 10, 8), skin, hand).scale.set(1.2, 1, 0.6);
    const fingers = [-0.045, -0.015, 0.015, 0.045].map((offset, index) => {
      const finger = new THREE.Group();
      finger.position.set(offset, -0.02, 0);
      finger.rotation.z = offset * 3;
      hand.add(finger);
      add(tapered(0.2, 0.011, 0.008, 6), skin, finger);
      const tip = new THREE.Group();
      tip.position.y = -0.2;
      tip.rotation.x = 0.35;
      finger.add(tip);
      add(new THREE.ConeGeometry(0.008, 0.16 + index * 0.01, 6).rotateX(Math.PI).translate(0, -0.08, 0), bone, tip);
      return finger;
    });
    return { shoulder, elbow, fingers };
  });

  const tendrils = Array.from({ length: 6 }, (_, index) => {
    const pivot = new THREE.Group();
    const side = index % 2 === 0 ? 1 : -1;
    pivot.position.set(side * (0.06 + random() * 0.12), 0.55 + random() * 0.3, -0.12);
    body.add(pivot);
    const points = Array.from({ length: 6 }, (_, step) => {
      const t = step / 5;
      return new THREE.Vector3(side * t * 0.12 + Math.sin(t * 5 + index) * 0.06, -t * (0.7 + random() * 0.5), -t * 0.25);
    });
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.018, 5), skin, pivot);
    return pivot;
  });

  return {
    root,
    hips,
    body,
    head,
    jaw,
    arms,
    legs,
    tendrils,
    eyeMaterial,
    mouthMaterial,
    dispose: () => disposeObject(root),
  };
}
