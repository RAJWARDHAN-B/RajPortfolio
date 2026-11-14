import * as THREE from "three";
import { disposeObject } from "./car";

export interface LimbRig {
  upper: THREE.Group;
  lower: THREE.Group;
}

export interface ExplorerRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: LimbRig;
  rightArm: LimbRig;
  leftLeg: LimbRig;
  rightLeg: LimbRig;
  flashlightTip: THREE.Object3D;
  flashlightAim: THREE.Object3D;
  lensMaterial: THREE.MeshStandardMaterial;
  dispose: () => void;
}

/** Stylised explorer facing +Z; the right hand carries a working flashlight. */
export function createExplorer(): ExplorerRig {
  const root = new THREE.Group();
  root.name = "explorer";
  const jacket = new THREE.MeshStandardMaterial({ color: "#5c1218", roughness: 0.7 });
  const jacketDark = new THREE.MeshStandardMaterial({ color: "#2b0c0f", roughness: 0.8 });
  const denim = new THREE.MeshStandardMaterial({ color: "#26303f", roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: "#b98a6c", roughness: 0.6 });
  const hair = new THREE.MeshStandardMaterial({ color: "#17100c", roughness: 0.9 });
  const shoe = new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.6 });
  const pack = new THREE.MeshStandardMaterial({ color: "#363a2c", roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: "#2a2b2e", metalness: 0.7, roughness: 0.35 });
  const lensMaterial = new THREE.MeshStandardMaterial({ color: "#fff7e0", emissive: "#fff1cf", emissiveIntensity: 3, toneMapped: false });

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, position: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const limb = (
    parent: THREE.Object3D,
    position: [number, number, number],
    lengths: [number, number],
    radii: [number, number],
    materials: [THREE.Material, THREE.Material],
  ): LimbRig => {
    const upper = new THREE.Group();
    upper.position.set(...position);
    parent.add(upper);
    add(new THREE.CapsuleGeometry(radii[0], lengths[0] - radii[0] * 2, 4, 10), materials[0], upper, [0, -lengths[0] / 2, 0]);
    const lower = new THREE.Group();
    lower.position.y = -lengths[0];
    upper.add(lower);
    add(new THREE.CapsuleGeometry(radii[1], lengths[1] - radii[1] * 2, 4, 10), materials[1], lower, [0, -lengths[1] / 2, 0]);
    return { upper, lower };
  };

  const hips = new THREE.Group();
  hips.position.y = 0.95;
  root.add(hips);
  add(new THREE.CapsuleGeometry(0.15, 0.08, 4, 12), denim, hips, [0, 0.02, 0]).scale.set(1.15, 1, 0.8);

  const torso = new THREE.Group();
  hips.add(torso);
  add(new THREE.CapsuleGeometry(0.18, 0.3, 6, 14), jacket, torso, [0, 0.32, 0]).scale.set(1.2, 1, 0.78);
  add(new THREE.CylinderGeometry(0.16, 0.2, 0.08, 14), jacketDark, torso, [0, 0.1, 0]).scale.set(1.15, 1, 0.8);
  add(new THREE.BoxGeometry(0.02, 0.36, 0.02), jacketDark, torso, [0, 0.33, 0.145]);
  add(new THREE.BoxGeometry(0.3, 0.38, 0.14), pack, torso, [0, 0.36, -0.2]);
  add(new THREE.BoxGeometry(0.24, 0.12, 0.06), pack, torso, [0, 0.24, -0.29]);
  for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.04, 0.42, 0.02), pack, torso, [side * 0.11, 0.36, 0.13]);
  add(new THREE.TorusGeometry(0.1, 0.035, 8, 18), jacketDark, torso, [0, 0.58, 0]).rotation.x = Math.PI / 2;

  const head = new THREE.Group();
  head.position.y = 0.72;
  torso.add(head);
  add(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10), skin, head, [0, -0.08, 0]);
  add(new THREE.SphereGeometry(0.11, 20, 16), skin, head, [0, 0.04, 0]).scale.set(0.92, 1.08, 1);
  add(new THREE.SphereGeometry(0.118, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, head, [0, 0.05, -0.008]).scale.set(0.95, 1.05, 1.04);
  add(new THREE.SphereGeometry(0.02, 8, 6), skin, head, [0, 0.03, 0.105]);

  const leftArm = limb(torso, [0.23, 0.52, 0], [0.3, 0.28], [0.055, 0.045], [jacket, jacket]);
  const rightArm = limb(torso, [-0.23, 0.52, 0], [0.3, 0.28], [0.055, 0.045], [jacket, jacket]);
  for (const arm of [leftArm, rightArm]) add(new THREE.SphereGeometry(0.045, 10, 8), skin, arm.lower, [0, -0.3, 0]);

  const flashlight = new THREE.Group();
  flashlight.position.set(0, -0.31, 0.02);
  rightArm.lower.add(flashlight);
  add(new THREE.CylinderGeometry(0.024, 0.02, 0.2, 12), metal, flashlight, [0, -0.06, 0]);
  add(new THREE.CylinderGeometry(0.035, 0.026, 0.05, 14), metal, flashlight, [0, -0.17, 0]);
  add(new THREE.CircleGeometry(0.03, 14), lensMaterial, flashlight, [0, -0.196, 0]).rotation.x = Math.PI / 2;
  const flashlightTip = new THREE.Object3D();
  flashlightTip.position.set(0, -0.21, 0);
  const flashlightAim = new THREE.Object3D();
  flashlightAim.position.set(0, -1.2, 0);
  flashlight.add(flashlightTip, flashlightAim);

  const leftLeg = limb(hips, [0.1, -0.02, 0], [0.45, 0.44], [0.075, 0.06], [denim, denim]);
  const rightLeg = limb(hips, [-0.1, -0.02, 0], [0.45, 0.44], [0.075, 0.06], [denim, denim]);
  for (const leg of [leftLeg, rightLeg]) add(new THREE.BoxGeometry(0.11, 0.08, 0.27), shoe, leg.lower, [0, -0.47, 0.05]);

  return {
    root,
    hips,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    flashlightTip,
    flashlightAim,
    lensMaterial,
    dispose: () => disposeObject(root),
  };
}
