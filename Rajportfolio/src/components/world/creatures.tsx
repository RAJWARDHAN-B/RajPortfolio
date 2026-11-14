import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROAD_HALF_WIDTH, roadFrame, surfaceHeight, terrainHeight } from "./layout";
import { createMonster, type MonsterRig } from "./models/monster";
import { clamp, createRandom, smoothstep } from "./noise";
import { useWorld } from "./runtime";
import { chargeDistance, consumeSite, createScareTracker, findLurkSite, rearmSites, SCARE_APPEAR_DISTANCE } from "./scares";

type Phase = "hidden" | "rising" | "lurking" | "charging" | "scare" | "vanishing" | "retreating";

function poseIdle(rig: MonsterRig, time: number, twitch: THREE.Euler) {
  rig.body.rotation.x = 0.35 + Math.sin(time * 1.3) * 0.03;
  rig.body.scale.set(1 + Math.sin(time * 1.9) * 0.015, 1, 1 + Math.sin(time * 1.9) * 0.02);
  rig.head.rotation.x += (twitch.x - rig.head.rotation.x) * 0.35;
  rig.head.rotation.y += (twitch.y - rig.head.rotation.y) * 0.35;
  rig.head.rotation.z += (twitch.z - rig.head.rotation.z) * 0.35;
  rig.jaw.rotation.x = 0.08 + Math.max(0, Math.sin(time * 0.8)) * 0.18;
  rig.arms.forEach((arm, index) => {
    const side = index === 0 ? 1 : -1;
    arm.shoulder.rotation.set(0.12 + Math.sin(time * 0.9 + index) * 0.07, 0, side * 0.14);
    arm.elbow.rotation.x = -0.3 + Math.sin(time * 1.1 + index) * 0.05;
    arm.fingers.forEach((finger, fingerIndex) => (finger.rotation.x = 0.3 + Math.sin(time * 2.2 + fingerIndex + index) * 0.18));
  });
  rig.legs.forEach((leg, index) => {
    leg.hip.rotation.x = -0.12 + index * 0.08;
    leg.knee.rotation.x = 0.28;
  });
  rig.tendrils.forEach((tendril, index) => tendril.rotation.set(Math.sin(time * 1.4 + index) * 0.25, 0, Math.cos(time * 1.1 + index) * 0.2));
}

function poseRun(rig: MonsterRig, stride: number) {
  rig.body.rotation.x = 0.75;
  rig.body.scale.set(1, 1, 1);
  rig.head.rotation.set(-0.45 + Math.sin(stride * 2) * 0.05, 0, Math.sin(stride) * 0.08);
  rig.jaw.rotation.x = 0.45;
  rig.legs.forEach((leg, index) => {
    const phase = stride + index * Math.PI;
    leg.hip.rotation.x = Math.sin(phase) * 0.95 - 0.2;
    leg.knee.rotation.x = 0.35 + Math.max(0, Math.sin(phase + 1.3)) * 1.1;
  });
  rig.arms.forEach((arm, index) => {
    const side = index === 0 ? 1 : -1;
    arm.shoulder.rotation.set(-1.15 + Math.sin(stride + index * Math.PI + Math.PI) * 0.55, 0, side * 0.35);
    arm.elbow.rotation.x = -0.45;
    arm.fingers.forEach((finger) => (finger.rotation.x = -0.1));
  });
  rig.tendrils.forEach((tendril, index) => tendril.rotation.set(0.9 + Math.sin(stride * 2 + index) * 0.2, 0, 0));
}

function poseLunge(rig: MonsterRig, time: number) {
  rig.body.rotation.x = 0.5;
  rig.head.rotation.set(-0.12 + Math.sin(time * 37) * 0.035, Math.sin(time * 23) * 0.04, 0.18);
  rig.jaw.rotation.x = 0.9 + Math.sin(time * 41) * 0.06;
  rig.arms.forEach((arm, index) => {
    const side = index === 0 ? 1 : -1;
    arm.shoulder.rotation.set(-1.75 + Math.sin(time * 29 + index) * 0.04, 0, side * 0.95);
    arm.elbow.rotation.x = -0.55;
    arm.fingers.forEach((finger, fingerIndex) => (finger.rotation.x = -0.35 + fingerIndex * 0.05));
  });
  rig.tendrils.forEach((tendril, index) => tendril.rotation.set(1.2 + Math.sin(time * 18 + index) * 0.3, 0, Math.sin(time * 13 + index) * 0.4));
}

/** Runs one creature through lurk → charge → scare (or retreat when scares are off). */
export function CreatureDirector({ onScare }: { onScare: () => void }) {
  const world = useWorld();
  const monster = useMemo(() => createMonster(world.textures.bark, 7), [world.textures.bark]);
  useEffect(() => () => monster.dispose(), [monster]);
  const tracker = useMemo(() => createScareTracker(world.layout.scareSites.length), [world.layout]);
  const random = useMemo(() => createRandom(13), []);
  const temp = useMemo(() => ({ forward: new THREE.Vector3(), head: new THREE.Vector3(), desired: new THREE.Vector3() }), []);
  const state = useRef({
    phase: "hidden" as Phase,
    site: -1,
    timer: 0,
    position: new THREE.Vector3(),
    facing: 0,
    stride: 0,
    twitch: new THREE.Euler(),
    nextTwitch: 0,
  });

  useEffect(() => {
    monster.root.visible = false;
    return () => {
      world.scareActive = false;
    };
  }, [monster, world]);

  useFrame(({ camera, clock }, delta) => {
    const current = state.current;
    const settings = world.settings.current;
    if (settings.paused) return;
    const root = monster.root;
    const time = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const player = world.player;
    const sites = world.layout.scareSites;
    rearmSites(tracker, sites, player.x, player.z, time);
    if (time > current.nextTwitch) {
      current.twitch.set((random() - 0.5) * 0.5, (random() - 0.5) * 0.9, (random() - 0.5) * 0.8);
      current.nextTwitch = time + 0.35 + random() * 1.6;
    }
    const distanceToPlayer = Math.hypot(current.position.x - player.x, current.position.z - player.z);
    monster.eyeMaterial.emissiveIntensity = current.phase === "scare" ? 9 : 5;

    switch (current.phase) {
      case "hidden": {
        root.visible = false;
        const site = findLurkSite(tracker, sites, player.x, player.z);
        if (site >= 0) {
          current.site = site;
          current.phase = "rising";
          current.timer = 0;
          current.position.set(sites[site].x, surfaceHeight(sites[site].x, sites[site].z), sites[site].z);
        }
        break;
      }
      case "rising":
      case "lurking": {
        root.visible = true;
        current.timer += dt;
        if (current.phase === "rising" && current.timer > 1.8) current.phase = "lurking";
        const rise = current.phase === "rising" ? smoothstep(0, 1.8, current.timer) : 1;
        current.facing = Math.atan2(player.x - current.position.x, player.z - current.position.z);
        poseIdle(monster, time, current.twitch);
        root.scale.setScalar(1);
        root.position.set(current.position.x, current.position.y - (1 - rise) * 2.9, current.position.z);
        root.rotation.set(0, current.facing, 0);
        if (distanceToPlayer > SCARE_APPEAR_DISTANCE + 12) {
          current.phase = "hidden";
        } else if (distanceToPlayer < chargeDistance(settings.mode)) {
          consumeSite(tracker, current.site, time);
          current.timer = 0;
          current.phase = settings.scares ? "charging" : "retreating";
          if (settings.scares) world.audio.growl();
        }
        break;
      }
      case "charging": {
        current.timer += dt;
        const dx = camera.position.x - current.position.x;
        const dz = camera.position.z - current.position.z;
        const distance = Math.hypot(dx, dz) || 0.001;
        const step = Math.min(distance, 17 * dt);
        current.position.x += (dx / distance) * step;
        current.position.z += (dz / distance) * step;
        current.position.y = surfaceHeight(current.position.x, current.position.z);
        current.facing = Math.atan2(dx, dz);
        current.stride += dt * 15;
        poseRun(monster, current.stride);
        const carDistance = settings.mode === "drive" ? Math.hypot(current.position.x - world.vehicle.x, current.position.z - world.vehicle.z) : 99;
        const leap = smoothstep(8, 2.5, carDistance) * 2.1;
        root.position.set(current.position.x, current.position.y + leap, current.position.z);
        root.rotation.set(0, current.facing, 0);
        if (distance < 2.8) {
          current.phase = "scare";
          current.timer = 0;
          world.scareActive = true;
          world.fx.shake = 1;
          world.fx.flash = 1;
          world.fx.aberration = 1;
          world.audio.scream();
          onScare();
        } else if (current.timer > 4.5) {
          current.phase = "retreating";
          current.timer = 0;
        }
        break;
      }
      case "scare": {
        current.timer += dt;
        poseLunge(monster, time);
        camera.getWorldDirection(temp.forward);
        const reach = settings.mode === "drive" ? (settings.view === "first" ? 1.8 : 1.2) : 1.0;
        temp.desired
          .copy(camera.position)
          .addScaledVector(temp.forward, reach + (1 - smoothstep(0, 0.12, current.timer)) * 1.6);
        temp.desired.y -= 0.08;
        current.facing = Math.atan2(-temp.forward.x, -temp.forward.z);
        root.visible = true;
        root.scale.setScalar(1);
        root.rotation.set(0, current.facing, 0);
        root.position.copy(temp.desired);
        root.updateMatrixWorld(true);
        monster.head.getWorldPosition(temp.head);
        root.position.add(temp.desired.sub(temp.head));
        if (current.timer > 1.05) {
          current.phase = "vanishing";
          current.timer = 0;
        }
        break;
      }
      case "vanishing": {
        current.timer += dt;
        root.scale.setScalar(Math.max(0.001, 1 - smoothstep(0, 0.45, current.timer)));
        root.position.y -= dt * 3;
        if (current.timer > 0.45) {
          root.visible = false;
          root.scale.setScalar(1);
          current.phase = "hidden";
          world.scareActive = false;
        }
        break;
      }
      case "retreating": {
        current.timer += dt;
        const dx = current.position.x - player.x;
        const dz = current.position.z - player.z;
        const length = Math.hypot(dx, dz) || 1;
        current.position.x += (dx / length) * 9 * dt;
        current.position.z += (dz / length) * 9 * dt;
        current.position.y = surfaceHeight(current.position.x, current.position.z);
        current.facing = Math.atan2(dx, dz);
        current.stride += dt * 12;
        poseRun(monster, current.stride);
        root.position.copy(current.position);
        root.rotation.set(0, current.facing, 0);
        if (current.timer > 2.4) {
          root.visible = false;
          current.phase = "hidden";
        }
        break;
      }
    }
  });

  return <primitive object={monster.root} />;
}

/** Pairs of glowing eyes in the tree line that blink and vanish when approached. */
export function Watchers({ count }: { count: number }) {
  const world = useWorld();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const random = useMemo(() => createRandom(99), []);
  const watchers = useMemo(
    () => Array.from({ length: count }, () => ({ x: 0, y: -50, z: 0, fade: 0, active: false, cooldown: random() * 5, nextBlink: 0, blinkUntil: 0 })),
    [count, random],
  );
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 0.32, 0.22), toneMapped: false }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, delta) => {
    const instanced = mesh.current;
    if (!instanced) return;
    const time = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const player = world.player;
    watchers.forEach((watcher, index) => {
      if (!watcher.active) {
        watcher.cooldown -= dt;
        if (watcher.cooldown <= 0) {
          const frame = roadFrame(Math.atan2(player.z, player.x) + (random() < 0.75 ? 1 : -1) * (0.1 + random() * 0.45));
          const side = random() < 0.5 ? 1 : -1;
          const offset = ROAD_HALF_WIDTH + 10 + random() * 24;
          watcher.x = frame.x + frame.nx * offset * side;
          watcher.z = frame.z + frame.nz * offset * side;
          watcher.y = terrainHeight(watcher.x, watcher.z) + 1.9 + random() * 0.6;
          watcher.fade = 0;
          watcher.active = true;
        }
      }
      const distance = Math.hypot(watcher.x - player.x, watcher.z - player.z);
      const leaving = distance < 14 || distance > 75;
      watcher.fade = clamp(watcher.fade + (leaving ? -dt * 2.5 : dt * 0.5), 0, 1);
      if (watcher.active && leaving && watcher.fade === 0) {
        watcher.active = false;
        watcher.cooldown = 2 + random() * 7;
      }
      if (time > watcher.nextBlink) {
        watcher.blinkUntil = time + 0.13;
        watcher.nextBlink = time + 1.5 + random() * 5;
      }
      const facing = Math.atan2(player.x - watcher.x, player.z - watcher.z);
      const scale = watcher.active ? watcher.fade : 0;
      const blink = time < watcher.blinkUntil ? 0.1 : 1;
      for (const side of [0, 1]) {
        const offset = side === 0 ? -0.085 : 0.085;
        dummy.position.set(watcher.x + Math.cos(facing) * offset, watcher.y, watcher.z - Math.sin(facing) * offset);
        dummy.scale.set(Math.max(scale, 0.0001), Math.max(scale * blink, 0.0001), Math.max(scale, 0.0001));
        dummy.updateMatrix();
        instanced.setMatrixAt(index * 2 + side, dummy.matrix);
      }
    });
    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, material, count * 2]} frustumCulled={false}>
      <sphereGeometry args={[0.05, 10, 8]} />
    </instancedMesh>
  );
}
