import * as THREE from "three";
import { createGaugeTexture, createPlateTexture, createRadioTexture } from "../textures";

export interface WheelRig {
  steer: THREE.Group;
  spin: THREE.Group;
}

export interface CarRig {
  root: THREE.Group;
  body: THREE.Group;
  /** Front-left, front-right, rear-left, rear-right. */
  wheels: WheelRig[];
  steeringWheel: THREE.Group;
  speedNeedle: THREE.Object3D;
  rpmNeedle: THREE.Object3D;
  headlights: THREE.SpotLight[];
  headlightTargets: THREE.Object3D[];
  beams: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[];
  lensMaterial: THREE.MeshStandardMaterial;
  tailMaterial: THREE.MeshStandardMaterial;
  reverseMaterial: THREE.MeshStandardMaterial;
  tailLight: THREE.PointLight;
  cabinLight: THREE.PointLight;
  /** Driver's eye position in body space. */
  driverEye: THREE.Vector3;
  dispose: () => void;
}

export const CAR_DIMENSIONS = { frontAxle: 1.38, rearAxle: -1.32, track: 1.56, wheelRadius: 0.34, collisionRadius: 1.02 };

const UP = new THREE.Vector3(0, 1, 0);

/** Volumetric-looking light cone: additive, view-angle and distance faded. */
export function createBeamMaterial(color: string, opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      varying float vAlong;
      varying vec3 vNormalView;
      varying vec3 vViewPosition;
      void main() {
        vAlong = uv.y;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlong;
      varying vec3 vNormalView;
      varying vec3 vViewPosition;
      void main() {
        float facing = abs(dot(normalize(vNormalView), normalize(vViewPosition)));
        float alpha = uOpacity * pow(facing, 1.8) * pow(vAlong, 1.6);
        gl_FragColor = vec4(uColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** Open cone with its apex at the origin, opening along +Z. */
export function createBeamGeometry(length: number, radius: number) {
  const geometry = new THREE.ConeGeometry(radius, length, 28, 1, true);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, length / 2);
  return geometry;
}

const extrude = (shape: THREE.Shape, depth: number, bevel: number, segments = 16) => {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.75,
    bevelSegments: 4,
    curveSegments: segments,
  });
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(depth / 2, 0, 0);
  return geometry;
};

export function createCar(envMap: THREE.Texture | null): CarRig {
  const root = new THREE.Group();
  root.name = "car";
  const body = new THREE.Group();
  root.add(body);
  const textures: THREE.Texture[] = [];

  const paint = new THREE.MeshPhysicalMaterial({
    color: "#5b0d15",
    metalness: 0.55,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMap,
    envMapIntensity: 1.2,
  });
  const chrome = new THREE.MeshStandardMaterial({ color: "#d5d7da", metalness: 1, roughness: 0.16, envMap, envMapIntensity: 1.4 });
  const trim = new THREE.MeshStandardMaterial({ color: "#0c0c0e", metalness: 0.2, roughness: 0.55, envMap, envMapIntensity: 0.4 });
  const rubber = new THREE.MeshStandardMaterial({ color: "#121213", roughness: 0.92 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: "#a7abb0", metalness: 0.9, roughness: 0.28, envMap, envMapIntensity: 1.2 });
  const discMaterial = new THREE.MeshStandardMaterial({ color: "#45484c", metalness: 0.8, roughness: 0.45, envMap });
  const caliperMaterial = new THREE.MeshStandardMaterial({ color: "#b0121c", metalness: 0.3, roughness: 0.4 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#0e1519",
    metalness: 0.25,
    roughness: 0.04,
    transparent: true,
    opacity: 0.42,
    envMap,
    envMapIntensity: 1.6,
    depthWrite: false,
  });
  const interior = new THREE.MeshStandardMaterial({ color: "#1b1617", roughness: 0.85 });
  const seatMaterial = new THREE.MeshStandardMaterial({ color: "#3a1418", roughness: 0.75 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: "#050505", roughness: 1, side: THREE.DoubleSide });
  const lensMaterial = new THREE.MeshStandardMaterial({
    color: "#fff4dc",
    emissive: "#ffe6bd",
    emissiveIntensity: 3,
    roughness: 0.1,
    toneMapped: false,
  });
  const tailMaterial = new THREE.MeshStandardMaterial({ color: "#3a0306", emissive: "#ff1020", emissiveIntensity: 1.2, toneMapped: false });
  const reverseMaterial = new THREE.MeshStandardMaterial({ color: "#d8d8d8", emissive: "#ffffff", emissiveIntensity: 0, toneMapped: false });
  const amberMaterial = new THREE.MeshStandardMaterial({ color: "#7a3d00", emissive: "#ff8a00", emissiveIntensity: 0.35, toneMapped: false });

  const add = (geometry: THREE.BufferGeometry, meshMaterial: THREE.Material, parent: THREE.Object3D, position?: [number, number, number], shadow = true) => {
    const mesh = new THREE.Mesh(geometry, meshMaterial);
    if (position) mesh.position.set(...position);
    mesh.castShadow = shadow;
    mesh.receiveShadow = shadow;
    parent.add(mesh);
    return mesh;
  };
  const box = (size: [number, number, number], meshMaterial: THREE.Material, position: [number, number, number], parent: THREE.Object3D = body) =>
    add(new THREE.BoxGeometry(...size), meshMaterial, parent, position);
  const strut = (from: [number, number, number], to: [number, number, number], thickness: number, meshMaterial: THREE.Material) => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mesh = add(new THREE.BoxGeometry(thickness, start.distanceTo(end), thickness * 1.6), meshMaterial, body);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(UP, end.sub(start).normalize());
    return mesh;
  };

  // Side panels carry the wheel-arch profile; separate lids and fascias keep the cabin hollow.
  const profile = new THREE.Shape();
  profile.moveTo(-2.32, 0.34);
  profile.lineTo(CAR_DIMENSIONS.rearAxle - 0.47, 0.34);
  profile.absarc(CAR_DIMENSIONS.rearAxle, 0.34, 0.47, Math.PI, 0, true);
  profile.lineTo(CAR_DIMENSIONS.frontAxle - 0.47, 0.34);
  profile.absarc(CAR_DIMENSIONS.frontAxle, 0.34, 0.47, Math.PI, 0, true);
  profile.lineTo(2.3, 0.34);
  profile.quadraticCurveTo(2.42, 0.36, 2.4, 0.52);
  profile.lineTo(2.36, 0.74);
  profile.quadraticCurveTo(2.33, 0.83, 2.16, 0.85);
  profile.lineTo(0.98, 0.95);
  profile.lineTo(-1.45, 0.98);
  profile.lineTo(-2.16, 0.97);
  profile.quadraticCurveTo(-2.34, 0.96, -2.37, 0.83);
  profile.lineTo(-2.4, 0.5);
  profile.quadraticCurveTo(-2.41, 0.35, -2.32, 0.34);
  const sidePanel = extrude(profile, 0.05, 0.022, 20);
  for (const side of [-1, 1]) add(sidePanel, paint, body, [side * 0.835, 0, 0]);

  const hood = box([1.68, 0.05, 1.42], paint, [0, 0.885, 1.62]);
  hood.rotation.x = 0.07;
  box([1.68, 0.06, 0.86], paint, [0, 0.95, -1.9]);
  box([1.68, 0.5, 0.14], paint, [0, 0.6, 2.32]);
  box([1.68, 0.58, 0.14], paint, [0, 0.64, -2.32]);
  box([1.68, 0.12, 0.3], trim, [0, 0.92, 1.0]);

  const greenhouse = new THREE.Shape();
  greenhouse.moveTo(1.0, 0.95);
  greenhouse.lineTo(0.17, 1.39);
  greenhouse.quadraticCurveTo(0.07, 1.43, -0.06, 1.43);
  greenhouse.lineTo(-0.94, 1.43);
  greenhouse.quadraticCurveTo(-1.07, 1.42, -1.14, 1.37);
  greenhouse.lineTo(-1.52, 0.98);
  greenhouse.lineTo(1.0, 0.95);
  add(extrude(greenhouse, 1.5, 0.04, 12), glass, body, undefined, false);

  const roof = new THREE.Shape();
  roof.moveTo(0.14, 1.405);
  roof.quadraticCurveTo(0.06, 1.45, -0.06, 1.45);
  roof.lineTo(-0.95, 1.45);
  roof.quadraticCurveTo(-1.08, 1.44, -1.13, 1.395);
  roof.lineTo(-1.1, 1.385);
  roof.lineTo(-0.95, 1.425);
  roof.lineTo(-0.06, 1.425);
  roof.lineTo(0.12, 1.385);
  add(extrude(roof, 1.52, 0.03, 10), paint, body);

  for (const side of [-1, 1]) {
    const x = side * 0.79;
    strut([x, 0.96, 0.99], [x, 1.41, 0.13], 0.06, paint);
    strut([x, 0.97, -0.26], [x, 1.43, -0.3], 0.07, paint);
    strut([x, 0.98, -1.5], [x, 1.38, -1.12], 0.09, paint);
    box([0.03, 0.025, 2.5], chrome, [side * 0.8, 1.01, -0.26]);
    for (const z of [0.95, -0.27, -1.36]) box([0.008, 0.56, 0.012], trim, [side * 0.884, 0.66, z]);
    for (const z of [0.18, -0.98]) box([0.03, 0.03, 0.14], chrome, [side * 0.895, 0.86, z]);
    box([0.02, 0.07, 3.6], chrome, [side * 0.888, 0.5, -0.02]);

    const mirror = new THREE.Group();
    mirror.position.set(side * 0.98, 1.0, 0.84);
    body.add(mirror);
    box([0.12, 0.03, 0.04], trim, [-side * 0.05, -0.02, 0], mirror);
    box([0.07, 0.11, 0.16], paint, [side * 0.02, 0.03, 0], mirror);
    box([0.06, 0.09, 0.01], chrome, [side * 0.02, 0.03, -0.085], mirror);

    // Wheel-well liners hide the hollow body behind the arches.
    for (const axle of [CAR_DIMENSIONS.frontAxle, CAR_DIMENSIONS.rearAxle]) {
      const liner = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 18, 1, true, 0, Math.PI);
      liner.rotateZ(Math.PI / 2);
      add(liner, darkMaterial, body, [side * 0.76, 0.34, axle], false);
    }

    const lamp = side * 0.6;
    box([0.42, 0.2, 0.05], chrome, [lamp, 0.64, 2.425]);
    box([0.36, 0.15, 0.04], lensMaterial, [lamp, 0.64, 2.445]);
    box([0.3, 0.035, 0.03], amberMaterial, [lamp, 0.515, 2.45]);
    box([0.48, 0.17, 0.05], tailMaterial, [side * 0.6, 0.78, -2.43]);
    box([0.12, 0.17, 0.05], reverseMaterial, [side * 0.27, 0.78, -2.43]);
    box([0.1, 0.07, 0.07], chrome, [side * 0.9, 0.42, 2.38]);
    box([0.1, 0.07, 0.07], chrome, [side * 0.9, 0.42, -2.39]);
  }

  // Grille, bumpers, plates, exhaust and underbody.
  box([0.74, 0.24, 0.05], trim, [0, 0.64, 2.425]);
  for (let bar = 0; bar < 5; bar++) box([0.7, 0.018, 0.03], chrome, [0, 0.55 + bar * 0.045, 2.452]);
  add(new THREE.TorusGeometry(0.045, 0.008, 8, 20), chrome, body, [0, 0.8, 2.4]);
  box([1.86, 0.13, 0.13], chrome, [0, 0.42, 2.44]);
  box([1.86, 0.13, 0.13], chrome, [0, 0.42, -2.45]);
  box([1.2, 0.16, 4.3], trim, [0, 0.3, 0]);

  const plateTexture = createPlateTexture("RB 2027");
  textures.push(plateTexture);
  const plateMaterial = new THREE.MeshStandardMaterial({ map: plateTexture, roughness: 0.45, metalness: 0.2 });
  const frontPlate = add(new THREE.PlaneGeometry(0.5, 0.12), plateMaterial, body, [0, 0.42, 2.515]);
  frontPlate.castShadow = false;
  const rearPlate = add(new THREE.PlaneGeometry(0.5, 0.12), plateMaterial, body, [0, 0.6, -2.46]);
  rearPlate.rotation.y = Math.PI;
  const exhaust = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 12);
  exhaust.rotateX(Math.PI / 2);
  add(exhaust, chrome, body, [0.55, 0.28, -2.4]);

  // Cockpit.
  box([1.62, 0.05, 3.0], interior, [0, 0.42, -0.25]);
  for (const side of [-1, 1]) box([0.04, 0.5, 2.5], interior, [side * 0.79, 0.68, -0.26]);
  box([1.5, 0.03, 1.4], interior, [0, 1.405, -0.48]);
  box([1.6, 0.2, 0.42], interior, [0, 0.93, 0.74]);
  const dashTop = box([1.6, 0.05, 0.34], trim, [0, 1.04, 0.74]);
  dashTop.rotation.x = -0.18;
  // Instrument hood: the upper half of a short tube pointing at the driver, shading the gauges.
  const binnacle = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 18, 1, true, Math.PI / 2, Math.PI);
  binnacle.rotateX(Math.PI / 2);
  add(binnacle, darkMaterial, body, [0.38, 1.0, 0.53], false);

  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(0.38, 1.0, 0.524);
  gaugeGroup.rotation.y = Math.PI;
  body.add(gaugeGroup);
  const createGauge = (kind: "speed" | "rpm", x: number) => {
    const texture = createGaugeTexture(kind);
    textures.push(texture);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.068, 32),
      new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: "#ffffff", emissiveIntensity: 0.9 }),
    );
    face.position.set(x, 0, 0);
    gaugeGroup.add(face);
    const needle = new THREE.Group();
    needle.position.set(x, 0, 0.004);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.058, 0.002),
      new THREE.MeshStandardMaterial({ color: "#ff3b1f", emissive: "#ff3b1f", emissiveIntensity: 2, toneMapped: false }),
    );
    blade.position.y = 0.026;
    needle.add(blade);
    gaugeGroup.add(needle);
    return needle;
  };
  const speedNeedle = createGauge("speed", 0.08);
  const rpmNeedle = createGauge("rpm", -0.08);

  const radioTexture = createRadioTexture();
  textures.push(radioTexture);
  box([0.34, 0.34, 0.24], trim, [0, 0.76, 0.5]);
  box([0.24, 0.16, 0.9], trim, [0, 0.52, 0]);
  const radio = add(
    new THREE.PlaneGeometry(0.2, 0.05),
    new THREE.MeshStandardMaterial({ map: radioTexture, emissiveMap: radioTexture, emissive: "#ffffff", emissiveIntensity: 1.2 }),
    body,
    [0, 0.85, 0.376],
    false,
  );
  radio.rotation.y = Math.PI;
  add(new THREE.CylinderGeometry(0.012, 0.016, 0.2, 8), chrome, body, [0, 0.68, 0.16], false).rotation.x = -0.25;
  add(new THREE.SphereGeometry(0.035, 12, 10), trim, body, [0, 0.78, 0.135], false);
  box([0.24, 0.06, 0.02], chrome, [0, 1.33, 0.18]);
  for (const side of [-1, 1]) {
    const visor = box([0.5, 0.02, 0.22], interior, [side * 0.38, 1.37, 0.12]);
    visor.rotation.x = 0.25;
  }
  const wiperBase = 0.995;
  for (const x of [-0.35, 0.3]) {
    const wiper = box([0.5, 0.015, 0.02], trim, [x, wiperBase, 0.96]);
    wiper.rotation.z = 0.12;
  }

  const steeringWheel = new THREE.Group();
  const steeringMount = new THREE.Group();
  steeringMount.position.set(0.38, 1.0, 0.43);
  steeringMount.rotation.x = -0.42;
  steeringMount.add(steeringWheel);
  body.add(steeringMount);
  add(new THREE.TorusGeometry(0.18, 0.019, 12, 40), trim, steeringWheel, undefined, false);
  for (const angle of [0, Math.PI, Math.PI * 1.5]) {
    const spoke = add(new THREE.BoxGeometry(0.17, 0.028, 0.018), trim, steeringWheel, [Math.cos(angle) * 0.09, Math.sin(angle) * 0.09, 0], false);
    spoke.rotation.z = angle;
  }
  add(new THREE.CylinderGeometry(0.05, 0.055, 0.04, 20).rotateX(Math.PI / 2), trim, steeringWheel, [0, 0, -0.01], false);
  const column = add(new THREE.CylinderGeometry(0.03, 0.04, 0.32, 10).rotateX(Math.PI / 2), trim, steeringMount, [0, 0, 0.16], false);
  column.castShadow = false;

  for (const side of [-1, 1]) {
    const seat = new THREE.Group();
    seat.position.set(side * 0.38, 0, -0.22);
    body.add(seat);
    box([0.5, 0.14, 0.52], seatMaterial, [0, 0.58, 0], seat);
    const back = box([0.5, 0.64, 0.13], seatMaterial, [0, 0.93, -0.26], seat);
    back.rotation.x = -0.2;
    box([0.28, 0.18, 0.1], seatMaterial, [0, 1.32, -0.34], seat);
  }
  box([1.46, 0.15, 0.48], seatMaterial, [0, 0.58, -1.12]);
  const rearBack = box([1.46, 0.56, 0.13], seatMaterial, [0, 0.9, -1.36]);
  rearBack.rotation.x = -0.25;
  box([1.5, 0.03, 0.45], interior, [0, 0.99, -1.62]);

  // Wheels: steering pivot (front only) around a spinning tyre/rim assembly.
  const tireProfile = [
    [0.212, -0.118], [0.29, -0.124], [0.322, -0.112], [0.338, -0.085], [0.342, -0.04],
    [0.342, 0.04], [0.338, 0.085], [0.322, 0.112], [0.29, 0.124], [0.212, 0.118],
  ].map(([radius, y]) => new THREE.Vector2(radius, y));
  const tireGeometry = new THREE.LatheGeometry(tireProfile, 36).rotateZ(Math.PI / 2);
  const rimGeometry = new THREE.CylinderGeometry(0.214, 0.214, 0.2, 30).rotateZ(Math.PI / 2);
  const dishGeometry = new THREE.CylinderGeometry(0.19, 0.2, 0.02, 30).rotateZ(Math.PI / 2);
  const spokeGeometry = new THREE.BoxGeometry(0.03, 0.17, 0.05);
  const capGeometry = new THREE.CylinderGeometry(0.05, 0.065, 0.045, 20).rotateZ(Math.PI / 2);
  const discGeometry = new THREE.CylinderGeometry(0.17, 0.17, 0.024, 26).rotateZ(Math.PI / 2);
  const nutGeometry = new THREE.CylinderGeometry(0.011, 0.011, 0.03, 6).rotateZ(Math.PI / 2);

  const wheels: WheelRig[] = [
    [CAR_DIMENSIONS.frontAxle, 1],
    [CAR_DIMENSIONS.frontAxle, -1],
    [CAR_DIMENSIONS.rearAxle, 1],
    [CAR_DIMENSIONS.rearAxle, -1],
  ].map(([axle, side]) => {
    const steer = new THREE.Group();
    steer.position.set(side * (CAR_DIMENSIONS.track / 2), CAR_DIMENSIONS.wheelRadius, axle);
    steer.scale.x = side;
    root.add(steer);
    const spin = new THREE.Group();
    steer.add(spin);
    add(tireGeometry, rubber, spin);
    add(rimGeometry, rimMaterial, spin);
    add(dishGeometry, rimMaterial, spin, [0.1, 0, 0]);
    add(discGeometry, discMaterial, spin, [-0.02, 0, 0], false);
    add(capGeometry, chrome, spin, [0.12, 0, 0]);
    for (let index = 0; index < 5; index++) {
      const angle = (index / 5) * Math.PI * 2;
      const spoke = add(spokeGeometry, rimMaterial, spin, [0.11, Math.cos(angle) * 0.1, Math.sin(angle) * 0.1], false);
      spoke.rotation.x = angle;
      add(nutGeometry, chrome, spin, [0.125, Math.cos(angle + 0.6) * 0.065, Math.sin(angle + 0.6) * 0.065], false);
    }
    add(new THREE.BoxGeometry(0.05, 0.12, 0.09), caliperMaterial, steer, [-0.03, 0.13, -0.07], false);
    return { steer, spin };
  });

  const headlightTargets: THREE.Object3D[] = [];
  const headlights = [-1, 1].map((side) => {
    const light = new THREE.SpotLight("#ffe9c6", 0, 70, 0.44, 0.55, 1.4);
    light.position.set(side * 0.6, 0.66, 2.3);
    const target = new THREE.Object3D();
    target.position.set(side * 0.95, 0, 20);
    body.add(light, target);
    light.target = target;
    headlightTargets.push(target);
    return light;
  });
  headlights[1].castShadow = true;
  headlights[1].shadow.mapSize.set(1024, 1024);
  headlights[1].shadow.camera.near = 0.6;
  headlights[1].shadow.camera.far = 60;
  headlights[1].shadow.bias = -0.0004;

  const beamGeometry = createBeamGeometry(15, 2.8);
  const beams = [-1, 1].map((side) => {
    const beam = new THREE.Mesh(beamGeometry, createBeamMaterial("#ffe2b8", 0.12));
    beam.position.set(side * 0.6, 0.64, 2.42);
    beam.rotation.x = 0.06;
    beam.rotation.y = side * 0.02;
    beam.renderOrder = 2;
    body.add(beam);
    return beam;
  });

  const tailLight = new THREE.PointLight("#ff1a24", 0, 7, 2);
  tailLight.position.set(0, 0.75, -2.7);
  body.add(tailLight);
  const cabinLight = new THREE.PointLight("#ff8a3d", 0.6, 1.6, 2);
  cabinLight.position.set(0.2, 1.05, 0.45);
  body.add(cabinLight);

  return {
    root,
    body,
    wheels,
    steeringWheel,
    speedNeedle,
    rpmNeedle,
    headlights,
    headlightTargets,
    beams,
    lensMaterial,
    tailMaterial,
    reverseMaterial,
    tailLight,
    cabinLight,
    driverEye: new THREE.Vector3(0.38, 1.2, -0.08),
    dispose: () => disposeObject(root, textures),
  };
}

export function disposeObject(object: THREE.Object3D, textures: THREE.Texture[] = []) {
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const childMaterial = mesh.material;
    if (Array.isArray(childMaterial)) childMaterial.forEach((entry) => materials.add(entry));
    else if (childMaterial) materials.add(childMaterial);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((entry) => entry.dispose());
  textures.forEach((texture) => texture.dispose());
}
