import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Ash, FOG_COLOR, FOG_DENSITY, Lightning, Mist, Sky } from "./world/atmosphere";
import { createWorldAudio } from "./world/audio";
import { CreatureDirector, Watchers } from "./world/creatures";
import { Effects } from "./world/effects";
import { Billboards, Forest, Road, Roadside, Terrain } from "./world/environment";
import { createWorldLayout, resolveCircle, ROAD_HALF_WIDTH, roadDistance, surfaceHeight } from "./world/layout";
import { CAR_DIMENSIONS, createBeamGeometry, createBeamMaterial, createCar, type CarRig } from "./world/models/car";
import { createExplorer, type ExplorerRig } from "./world/models/explorer";
import { angleDelta, clamp } from "./world/noise";
import { useWorld, WorldContext, type WorldRuntime } from "./world/runtime";
import { createBarkTexture, createGroundTexture, createPuffTexture, createRoadTextures } from "./world/textures";
import type { ContentItem } from "@/data/portfolio";
import type { NearbyState, TravelMode, WorldSceneProps } from "./world/types";
import { createVehicleState, engineRpm, stepVehicle } from "./world/vehicle";

/** Small procedural environment so car paint, chrome and glass have something to reflect. */
function createEnvironment(renderer: THREE.WebGLRenderer) {
  const generator = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  const skyGeometry = new THREE.SphereGeometry(20, 32, 16);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: "varying vec3 vDirection; void main() { vDirection = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec3 vDirection;
      void main() {
        float h = normalize(vDirection).y;
        vec3 horizon = vec3(0.2, 0.05, 0.06);
        vec3 color = h < 0.0 ? mix(horizon, vec3(0.02, 0.012, 0.012), smoothstep(0.0, -0.3, h)) : mix(horizon, vec3(0.03, 0.02, 0.04), smoothstep(0.0, 0.6, h));
        gl_FragColor = vec4(color, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(skyGeometry, skyMaterial));
  const panelGeometry = new THREE.PlaneGeometry(1, 1);
  const panels: [string, number, [number, number, number], number][] = [
    ["#ff5a4a", 4, [-8, 7, -10], 7],
    ["#8a9cff", 1.6, [12, 6, 8], 8],
    ["#fff1dd", 2.2, [0, 18, 0], 10],
  ];
  const panelMaterials = panels.map(([color, strength, position, size]) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide });
    const panel = new THREE.Mesh(panelGeometry, material);
    panel.scale.setScalar(size);
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    scene.add(panel);
    return material;
  });
  const target = generator.fromScene(scene, 0.035);
  generator.dispose();
  skyGeometry.dispose();
  skyMaterial.dispose();
  panelGeometry.dispose();
  panelMaterials.forEach((material) => material.dispose());
  return target;
}

interface LookState {
  chaseYaw: number;
  chaseHeading: number;
  pitch: number;
  driveDistance: number;
  walkDistance: number;
  cockpitYaw: number;
  cockpitPitch: number;
  walkYaw: number;
  walkPitch: number;
  dragging: boolean;
  pointerId: number;
  lastX: number;
  lastY: number;
  lastInteraction: number;
}

interface LoopProps {
  car: CarRig;
  explorer: ExplorerRig;
  flashlight: MutableRefObject<THREE.SpotLight | null>;
  flashlightTarget: THREE.Object3D;
  flashlightBeam: THREE.Mesh;
  moon: MutableRefObject<THREE.DirectionalLight | null>;
  moonTarget: THREE.Object3D;
  callbacks: MutableRefObject<WorldSceneProps>;
}

function GameLoop({ car, explorer, flashlight, flashlightTarget, flashlightBeam, moon, moonTarget, callbacks }: LoopProps) {
  const world = useWorld();
  const { camera, gl } = useThree();
  const look = useRef<LookState>({
    chaseYaw: 0,
    chaseHeading: world.vehicle.heading,
    pitch: 0.3,
    driveDistance: 7.4,
    walkDistance: 4.2,
    cockpitYaw: 0,
    cockpitPitch: -0.06,
    walkYaw: world.vehicle.heading,
    walkPitch: -0.05,
    dragging: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    lastInteraction: -10,
  });
  const previousMode = useRef<TravelMode>("drive");
  const nearby = useRef<NearbyState>({ project: null, car: false });
  const timers = useRef({ nearby: 0, audio: 0, impact: 0, recenter: 0, ready: false, horn: false });
  const temp = useMemo(
    () => ({
      position: new THREE.Vector3(),
      aim: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      right: new THREE.Vector3(),
      bodyQuaternion: new THREE.Quaternion(),
      lookQuaternion: new THREE.Quaternion(),
      euler: new THREE.Euler(0, 0, 0, "YXZ"),
    }),
    [],
  );

  useEffect(() => {
    const element = gl.domElement;
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const current = look.current;
      current.dragging = true;
      current.pointerId = event.pointerId;
      current.lastX = event.clientX;
      current.lastY = event.clientY;
      element.setPointerCapture?.(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      const current = look.current;
      if (!current.dragging || event.pointerId !== current.pointerId) return;
      const dx = event.clientX - current.lastX;
      const dy = event.clientY - current.lastY;
      current.lastX = event.clientX;
      current.lastY = event.clientY;
      current.lastInteraction = performance.now() / 1000;
      const { mode, view } = world.settings.current;
      if (mode === "drive" && view === "first") {
        current.cockpitYaw = clamp(current.cockpitYaw - dx * 0.005, -2.3, 2.3);
        current.cockpitPitch = clamp(current.cockpitPitch - dy * 0.004, -0.8, 0.6);
      } else if (mode === "drive") {
        current.chaseYaw -= dx * 0.006;
        current.pitch = clamp(current.pitch + dy * 0.004, -0.02, 1.25);
      } else {
        current.walkYaw -= dx * 0.005;
        if (view === "first") current.walkPitch = clamp(current.walkPitch - dy * 0.004, -1.2, 1.2);
        else current.pitch = clamp(current.pitch + dy * 0.004, -0.02, 1.25);
      }
    };
    const up = (event: PointerEvent) => {
      const current = look.current;
      if (event.pointerId !== current.pointerId) return;
      current.dragging = false;
      if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = look.current;
      const factor = Math.exp(clamp(event.deltaY, -200, 200) * 0.0012);
      if (world.settings.current.mode === "drive") current.driveDistance = clamp(current.driveDistance * factor, 4, 16);
      else current.walkDistance = clamp(current.walkDistance * factor, 2, 9);
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("wheel", wheel);
    };
  }, [gl, world]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const settings = world.settings.current;
    const props = callbacks.current;
    const controls = props.controls.current;
    const vehicle = world.vehicle;
    const walker = world.walker;
    const lk = look.current;
    const inCar = settings.mode === "drive";
    const reduced = settings.reducedMotion;
    const now = performance.now() / 1000;
    const perspective = camera as THREE.PerspectiveCamera;
    world.wind.value = state.clock.elapsedTime;

    if (props.commands.current.recenterCamera !== timers.current.recenter) {
      timers.current.recenter = props.commands.current.recenterCamera;
      lk.chaseYaw = 0;
      lk.cockpitYaw = 0;
      lk.cockpitPitch = -0.06;
      lk.pitch = 0.3;
      lk.walkYaw = walker.facing;
      lk.walkPitch = -0.05;
    }

    if (previousMode.current !== settings.mode) {
      if (settings.mode === "walk") {
        const cos = Math.cos(vehicle.heading);
        const sin = Math.sin(vehicle.heading);
        const doorX = vehicle.x + cos * 1.55 + sin * 0.1;
        const doorZ = vehicle.z - sin * 1.55 + cos * 0.1;
        const placed = resolveCircle(world.layout.obstacles, doorX, doorZ, 0.35);
        Object.assign(walker, { x: placed.x, z: placed.z, y: surfaceHeight(placed.x, placed.z), vx: 0, vz: 0, facing: vehicle.heading });
        lk.walkYaw = vehicle.heading;
        vehicle.speed = 0;
      } else {
        lk.chaseYaw = 0;
        lk.chaseHeading = vehicle.heading;
      }
      previousMode.current = settings.mode;
    }

    if (!settings.paused) {
      if (inCar) {
        const onRoad = roadDistance(vehicle.x, vehicle.z) < ROAD_HALF_WIDTH + 0.6;
        stepVehicle(
          vehicle,
          { throttle: controls.forward, reverse: controls.backward, left: controls.left, right: controls.right, handbrake: controls.brake },
          dt,
          onRoad,
        );
        const forwardX = Math.sin(vehicle.heading);
        const forwardZ = Math.cos(vehicle.heading);
        let impact = 0;
        for (const offset of [1.25, -1.25]) {
          const cx = vehicle.x + forwardX * offset;
          const cz = vehicle.z + forwardZ * offset;
          const result = resolveCircle(world.layout.obstacles, cx, cz, CAR_DIMENSIONS.collisionRadius);
          if (!result.hit) continue;
          vehicle.x += result.x - cx;
          vehicle.z += result.z - cz;
          const into = -Math.sign(vehicle.speed) * (forwardX * result.normalX + forwardZ * result.normalZ);
          if (into > 0.2) impact = Math.max(impact, Math.abs(vehicle.speed) * into);
        }
        if (impact > 0) {
          vehicle.speed *= impact > 4 ? -0.25 : 0.4;
          if (impact > 3 && now - timers.current.impact > 0.5) {
            timers.current.impact = now;
            world.audio.crash(impact);
            world.fx.shake = Math.max(world.fx.shake, Math.min(1, impact / 12));
          }
        }
      } else {
        const speed = controls.run ? 6.2 : 2.9;
        const strafe = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
        const advance = (controls.forward ? 1 : 0) - (controls.backward ? 1 : 0);
        const forwardX = Math.sin(lk.walkYaw);
        const forwardZ = Math.cos(lk.walkYaw);
        let moveX = forwardX * advance - forwardZ * strafe;
        let moveZ = forwardZ * advance + forwardX * strafe;
        const length = Math.hypot(moveX, moveZ);
        if (length > 0) {
          moveX = (moveX / length) * speed;
          moveZ = (moveZ / length) * speed;
        }
        const blend = 1 - Math.exp(-10 * dt);
        walker.vx += (moveX - walker.vx) * blend;
        walker.vz += (moveZ - walker.vz) * blend;
        const result = resolveCircle(world.layout.obstacles, walker.x + walker.vx * dt, walker.z + walker.vz * dt, 0.35);
        let nextX = result.x;
        let nextZ = result.z;
        for (const offset of [1.2, -1.2]) {
          const cx = vehicle.x + Math.sin(vehicle.heading) * offset;
          const cz = vehicle.z + Math.cos(vehicle.heading) * offset;
          const distance = Math.hypot(nextX - cx, nextZ - cz);
          const minimum = 0.35 + 0.95;
          if (distance < minimum && distance > 0.0001) {
            nextX = cx + ((nextX - cx) / distance) * minimum;
            nextZ = cz + ((nextZ - cz) / distance) * minimum;
          }
        }
        walker.x = nextX;
        walker.z = nextZ;
        walker.y = surfaceHeight(nextX, nextZ);
        walker.facing += angleDelta(walker.facing, lk.walkYaw) * (1 - Math.exp(-8 * dt));
        const previousStride = walker.stride;
        walker.stride += Math.hypot(walker.vx, walker.vz) * dt * 2.6;
        if (Math.floor(previousStride / Math.PI) !== Math.floor(walker.stride / Math.PI)) world.audio.footstep();
      }
    }

    // Car pose: terrain slope on the chassis, dynamic roll and pitch on the sprung body.
    const forwardX = Math.sin(vehicle.heading);
    const forwardZ = Math.cos(vehicle.heading);
    const front = surfaceHeight(vehicle.x + forwardX * 1.35, vehicle.z + forwardZ * 1.35);
    const rear = surfaceHeight(vehicle.x - forwardX * 1.32, vehicle.z - forwardZ * 1.32);
    const left = surfaceHeight(vehicle.x + forwardZ * 0.78, vehicle.z - forwardX * 0.78);
    const right = surfaceHeight(vehicle.x - forwardZ * 0.78, vehicle.z + forwardX * 0.78);
    const carY = (front + rear) / 2;
    car.root.position.set(vehicle.x, carY, vehicle.z);
    car.root.rotation.set(Math.atan2(rear - front, 2.67), vehicle.heading, Math.atan2(left - right, 1.56), "YXZ");
    const motion = reduced ? 0 : 1;
    const roughness = roadDistance(vehicle.x, vehicle.z) < ROAD_HALF_WIDTH ? 1 : 4;
    car.body.rotation.set(vehicle.bodyPitch * motion, 0, vehicle.bodyRoll * motion);
    car.body.position.y = motion * Math.sin(state.clock.elapsedTime * 21) * Math.min(Math.abs(vehicle.speed), 12) * 0.0009 * roughness;
    car.wheels.forEach((wheel, index) => {
      if (index < 2) wheel.steer.rotation.y = vehicle.steer;
      wheel.spin.rotation.x = vehicle.wheelSpin;
    });
    car.steeringWheel.rotation.z = -vehicle.steer * 7;
    const throttle = inCar && controls.forward && !settings.paused;
    const rpm = engineRpm(vehicle.speed, throttle);
    car.speedNeedle.rotation.z = 2.356 - clamp((Math.abs(vehicle.speed) * 3.6) / 180, 0, 1) * 4.712;
    car.rpmNeedle.rotation.z = 2.356 - (inCar ? rpm : 0.1) * 0.875 * 4.712;

    const headlights = settings.headlights;
    const high = headlights && settings.highBeams;
    car.headlights.forEach((light, index) => {
      light.intensity = headlights ? (high ? 320 : 170) : 0;
      light.angle = high ? 0.52 : 0.44;
      light.distance = high ? 120 : 75;
      car.headlightTargets[index].position.set(index === 0 ? -0.95 : 0.95, high ? 1.1 : 0, high ? 40 : 20);
    });
    car.beams.forEach((beam) => {
      beam.visible = headlights;
      beam.material.uniforms.uOpacity.value = high ? 0.17 : 0.12;
      beam.scale.set(high ? 1.15 : 1, high ? 1.15 : 1, high ? 1.6 : 1);
    });
    car.lensMaterial.emissiveIntensity = headlights ? (high ? 6 : 3.4) : 0.12;
    const braking = inCar && vehicle.braking;
    car.tailMaterial.emissiveIntensity = braking ? 4 : headlights ? 1.2 : 0.15;
    car.tailLight.intensity = braking ? 5 : headlights ? 1.4 : 0;
    car.reverseMaterial.emissiveIntensity = inCar && vehicle.reversing ? 3 : 0;
    car.cabinLight.intensity = inCar ? 0.5 : 0.1;

    // Explorer pose and walk cycle.
    const amount = Math.min(1, Math.hypot(walker.vx, walker.vz) / 3);
    const swing = Math.sin(walker.stride) * 0.65 * amount;
    explorer.root.visible = !inCar && settings.view === "third";
    explorer.root.position.set(walker.x, walker.y, walker.z);
    explorer.root.rotation.y = walker.facing;
    explorer.hips.position.y = 0.95 + Math.abs(Math.sin(walker.stride)) * 0.04 * amount;
    explorer.torso.rotation.x = 0.04 + amount * (controls.run ? 0.14 : 0.04);
    explorer.leftLeg.upper.rotation.x = swing;
    explorer.rightLeg.upper.rotation.x = -swing;
    explorer.leftLeg.lower.rotation.x = 0.05 + Math.max(0, Math.sin(walker.stride - Math.PI / 2)) * 0.9 * amount;
    explorer.rightLeg.lower.rotation.x = 0.05 + Math.max(0, Math.sin(walker.stride + Math.PI / 2)) * 0.9 * amount;
    explorer.leftArm.upper.rotation.x = -swing * 0.8;
    explorer.leftArm.lower.rotation.x = -0.3;
    explorer.rightArm.upper.rotation.set(-1.2 + swing * 0.08, 0, 0.12);
    explorer.rightArm.lower.rotation.x = -0.15;

    // Camera rigs.
    const idle = !lk.dragging && now - lk.lastInteraction > 1.6;
    let targetFov = 60;
    if (inCar) {
      if (idle && Math.abs(vehicle.speed) > 2) {
        lk.chaseYaw *= Math.exp(-2.2 * dt);
        lk.cockpitYaw *= Math.exp(-2.5 * dt);
        lk.cockpitPitch += (-0.06 - lk.cockpitPitch) * (1 - Math.exp(-2.5 * dt));
      }
      if (settings.view === "third") {
        lk.chaseHeading += angleDelta(lk.chaseHeading, vehicle.heading) * (reduced ? 1 : 1 - Math.exp(-5 * dt));
        const yaw = lk.chaseHeading + lk.chaseYaw;
        const horizontal = Math.cos(lk.pitch) * lk.driveDistance;
        camera.position.set(
          vehicle.x - Math.sin(yaw) * horizontal,
          carY + 1.85 + Math.sin(lk.pitch) * lk.driveDistance,
          vehicle.z - Math.cos(yaw) * horizontal,
        );
        camera.position.y = Math.max(camera.position.y, surfaceHeight(camera.position.x, camera.position.z) + 0.5);
        camera.lookAt(vehicle.x + Math.sin(yaw) * 2.5, carY + 1.3, vehicle.z + Math.cos(yaw) * 2.5);
        targetFov = 58;
      } else {
        car.root.updateMatrixWorld(true);
        camera.position.copy(car.driverEye).applyMatrix4(car.body.matrixWorld);
        car.body.getWorldQuaternion(temp.bodyQuaternion);
        temp.euler.set(lk.cockpitPitch, Math.PI + lk.cockpitYaw, 0, "YXZ");
        camera.quaternion.copy(temp.bodyQuaternion).multiply(temp.lookQuaternion.setFromEuler(temp.euler));
        targetFov = 70;
      }
    } else if (settings.view === "third") {
      const yaw = lk.walkYaw;
      const horizontal = Math.cos(lk.pitch) * lk.walkDistance;
      const shoulderX = -Math.cos(yaw) * 0.45;
      const shoulderZ = Math.sin(yaw) * 0.45;
      camera.position.set(
        walker.x - Math.sin(yaw) * horizontal + shoulderX,
        walker.y + 1.6 + Math.sin(lk.pitch) * lk.walkDistance,
        walker.z - Math.cos(yaw) * horizontal + shoulderZ,
      );
      camera.position.y = Math.max(camera.position.y, surfaceHeight(camera.position.x, camera.position.z) + 0.4);
      camera.lookAt(walker.x + Math.sin(yaw) * 2 + shoulderX, walker.y + 1.45, walker.z + Math.cos(yaw) * 2 + shoulderZ);
    } else {
      const bob = reduced ? 0 : Math.sin(walker.stride * 2) * 0.035 * amount;
      camera.position.set(walker.x, walker.y + 1.65 + bob, walker.z);
      temp.euler.set(lk.walkPitch, Math.PI + lk.walkYaw, 0, "YXZ");
      camera.quaternion.setFromEuler(temp.euler);
      targetFov = 72;
    }
    if (!reduced && world.fx.shake > 0.001) {
      const strength = world.fx.shake * world.fx.shake;
      camera.position.x += (Math.random() - 0.5) * strength * 0.35;
      camera.position.y += (Math.random() - 0.5) * strength * 0.35;
      camera.position.z += (Math.random() - 0.5) * strength * 0.35;
      camera.rotateZ((Math.random() - 0.5) * strength * 0.06);
    }
    if (Math.abs(perspective.fov - targetFov) > 0.05) {
      perspective.fov += (targetFov - perspective.fov) * (reduced ? 1 : 1 - Math.exp(-6 * dt));
      perspective.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // Flashlight follows the hand in third person and the view in first person.
    const light = flashlight.current;
    const flashlightOn = !inCar && settings.flashlight;
    if (light) {
      if (!inCar) {
        if (settings.view === "third") {
          explorer.root.updateMatrixWorld(true);
          explorer.flashlightTip.getWorldPosition(temp.position);
          explorer.flashlightAim.getWorldPosition(temp.aim);
        } else {
          camera.getWorldDirection(temp.forward);
          temp.right.crossVectors(temp.forward, camera.up).normalize();
          temp.position.copy(camera.position).addScaledVector(temp.right, 0.22);
          temp.position.y -= 0.22;
          temp.aim.copy(camera.position).addScaledVector(temp.forward, 12);
        }
        light.position.copy(temp.position);
        flashlightTarget.position.copy(temp.aim);
        flashlightTarget.updateMatrixWorld();
        flashlightBeam.position.copy(temp.position);
        flashlightBeam.lookAt(temp.aim);
      }
      light.intensity = flashlightOn ? 120 : 0;
      flashlightBeam.visible = flashlightOn;
      explorer.lensMaterial.emissiveIntensity = flashlightOn ? 3 : 0.1;
    }

    world.player.set(inCar ? vehicle.x : walker.x, inCar ? carY : walker.y, inCar ? vehicle.z : walker.z);
    if (moon.current) {
      moon.current.position.set(world.player.x + 30, world.player.y + 60, world.player.z + 22);
      moonTarget.position.copy(world.player);
      moonTarget.updateMatrixWorld();
    }

    world.fx.shake = Math.max(0, world.fx.shake - dt * 1.6);
    world.fx.flash = Math.max(0, world.fx.flash - dt * 1.8);
    world.fx.aberration = Math.max(0, world.fx.aberration - dt * 1.4);
    props.telemetry.current.speedKmh = Math.round(Math.abs(vehicle.speed) * 3.6);

    timers.current.audio += dt;
    if (timers.current.audio > 0.06) {
      timers.current.audio = 0;
      world.audio.updateEngine(rpm, throttle, inCar);
    }
    const horn = inCar && controls.horn && !settings.paused;
    if (horn !== timers.current.horn) {
      timers.current.horn = horn;
      world.audio.setHorn(horn);
    }

    timers.current.nearby += dt;
    if (timers.current.nearby > 0.15) {
      timers.current.nearby = 0;
      let project: ContentItem | null = null;
      let best = inCar ? 26 : 16;
      world.layout.billboards.forEach((spot, index) => {
        const distance = Math.hypot(spot.x - world.player.x, spot.z - world.player.z);
        if (distance < best && props.featured[index]) {
          best = distance;
          project = props.featured[index];
        }
      });
      const carNearby = !inCar && Math.hypot(walker.x - vehicle.x, walker.z - vehicle.z) < 4.5;
      if (project !== nearby.current.project || carNearby !== nearby.current.car) {
        nearby.current = { project, car: carNearby };
        props.onNearbyChange(nearby.current);
      }
    }

    if (!timers.current.ready) {
      timers.current.ready = true;
      props.onReady();
    }
  }, -1);

  return null;
}

function World(props: WorldSceneProps) {
  const { gl } = useThree();
  const settingsRef = useRef(props.settings);
  settingsRef.current = props.settings;
  const callbacks = useRef(props);
  callbacks.current = props;

  const [environment] = useState(() => createEnvironment(gl));
  const [runtime] = useState<WorldRuntime>(() => {
    const layout = createWorldLayout(props.featured.length);
    const bark = createBarkTexture();
    bark.repeat.set(1, 3);
    return {
      layout,
      vehicle: createVehicleState(layout.start.x, layout.start.z, layout.start.heading),
      walker: { x: layout.start.x, y: 0, z: layout.start.z, facing: layout.start.heading, vx: 0, vz: 0, stride: 0 },
      player: new THREE.Vector3(layout.start.x, 0, layout.start.z),
      fx: { shake: 0, flash: 0, aberration: 0, lightning: 0 },
      audio: createWorldAudio(null),
      wind: { value: 0 },
      settings: settingsRef,
      textures: { ground: createGroundTexture(), bark, puff: createPuffTexture(), road: createRoadTextures() },
      envMap: environment.texture,
      scareActive: false,
    };
  });
  const [car] = useState(() => createCar(environment.texture));
  const [explorer] = useState(() => createExplorer());
  const [flashlightTarget] = useState(() => new THREE.Object3D());
  const [moonTarget] = useState(() => new THREE.Object3D());
  const [flashlightBeam] = useState(() => {
    const beam = new THREE.Mesh(createBeamGeometry(11, 2.4), createBeamMaterial("#fff1d6", 0.1));
    beam.renderOrder = 2;
    beam.visible = false;
    return beam;
  });
  const flashlight = useRef<THREE.SpotLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);

  useEffect(
    () => () => {
      car.dispose();
      explorer.dispose();
      environment.dispose();
      flashlightBeam.geometry.dispose();
      (flashlightBeam.material as THREE.Material).dispose();
      const { ground, bark, puff, road } = runtime.textures;
      [ground, bark, puff, road.map, road.roughnessMap].forEach((texture) => texture.dispose());
    },
    [car, explorer, environment, flashlightBeam, runtime],
  );

  useEffect(() => {
    const audio = createWorldAudio(props.audioContext);
    runtime.audio = audio;
    audio.setEnabled(settingsRef.current.sound);
    return () => {
      audio.dispose();
      runtime.audio = createWorldAudio(null);
    };
  }, [props.audioContext, runtime]);

  useEffect(() => {
    runtime.audio.setEnabled(props.settings.sound);
  }, [props.settings.sound, runtime]);

  useEffect(() => {
    if (flashlight.current) flashlight.current.target = flashlightTarget;
    if (moon.current) moon.current.target = moonTarget;
  }, [flashlightTarget, moonTarget]);

  useEffect(() => {
    const high = props.settings.quality === "high";
    if (moon.current) moon.current.castShadow = high;
    if (flashlight.current) flashlight.current.castShadow = high;
    car.headlights[1].castShadow = high;
  }, [props.settings.quality, car]);

  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      callbacks.current.onContextLost();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl]);

  const high = props.settings.quality === "high";
  return (
    <WorldContext.Provider value={runtime}>
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
      <hemisphereLight args={["#8a6890", "#1d0a0d", 1.1]} />
      <directionalLight
        ref={moon}
        color="#a9a6ec"
        intensity={1.1}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <primitive object={moonTarget} />
      <spotLight
        ref={flashlight}
        color="#fff2dc"
        intensity={0}
        distance={36}
        angle={0.42}
        penumbra={0.6}
        decay={1.5}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-near={0.3}
      />
      <primitive object={flashlightTarget} />
      <primitive object={flashlightBeam} />
      <Sky />
      <Terrain />
      <Road />
      <Forest />
      <Roadside />
      <Billboards items={props.featured} onSelect={(item) => callbacks.current.onSelectProject(item)} />
      <primitive object={car.root} />
      <primitive object={explorer.root} />
      <CreatureDirector onScare={() => callbacks.current.onScare()} />
      <Watchers count={14} />
      <Mist count={high ? 150 : 70} />
      <Ash count={high ? 900 : 400} />
      <Lightning />
      <GameLoop
        car={car}
        explorer={explorer}
        flashlight={flashlight}
        flashlightTarget={flashlightTarget}
        flashlightBeam={flashlightBeam}
        moon={moon}
        moonTarget={moonTarget}
        callbacks={callbacks}
      />
      {high && <Effects />}
    </WorldContext.Provider>
  );
}

const StrangerThingsScene = (props: WorldSceneProps) => (
  <Canvas
    shadows
    dpr={props.settings.quality === "high" ? [1, 1.75] : 1}
    camera={{ fov: 60, near: 0.05, far: 520, position: [0, 6, 12] }}
    gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
    onCreated={({ gl }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.35;
    }}
    style={{ touchAction: "none" }}
  >
    <World {...props} />
  </Canvas>
);

export default StrangerThingsScene;
