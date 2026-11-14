import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { terrainHeight } from "./layout";
import { createRandom, smoothstep } from "./noise";
import { useWorld } from "./runtime";

export const FOG_COLOR = "#1c0b11";
export const FOG_DENSITY = 0.021;

export function Sky() {
  const { fx } = useWorld();
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uFlash: { value: 0 },
          uHorizon: { value: new THREE.Color(FOG_COLOR) },
          uZenith: { value: new THREE.Color("#030205") },
          uRift: { value: new THREE.Vector3(-0.55, 0.42, -0.72).normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDirection;
          void main() {
            vDirection = position;
            vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = clip.xyww;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uFlash;
          uniform vec3 uHorizon;
          uniform vec3 uZenith;
          uniform vec3 uRift;
          varying vec3 vDirection;
          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
          }
          float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int octave = 0; octave < 5; octave++) {
              value += amplitude * noise(p);
              p *= 2.03;
              amplitude *= 0.5;
            }
            return value;
          }
          void main() {
            vec3 direction = normalize(vDirection);
            float height = direction.y;
            vec3 color = mix(uHorizon, uZenith, smoothstep(-0.02, 0.55, height));
            vec2 uv = direction.xz / max(height + 0.2, 0.06);
            float clouds = fbm(uv * 0.85 + vec2(uTime * 0.012, uTime * 0.004));
            clouds = smoothstep(0.42, 0.9, clouds + fbm(uv * 2.2 - uTime * 0.009) * 0.38);
            float facing = max(dot(direction, uRift), 0.0);
            float riftCore = pow(facing, 26.0);
            float riftGlow = pow(facing, 4.0);
            float mask = clouds * smoothstep(-0.04, 0.22, height);
            vec3 cloudColor = mix(vec3(0.028, 0.01, 0.018), vec3(0.34, 0.035, 0.045), riftGlow * 0.95 + 0.06);
            color = mix(color, cloudColor, mask);
            color += vec3(1.0, 0.09, 0.07) * riftCore * (1.0 - mask * 0.5) * 0.9;
            color += vec3(0.95, 0.4, 0.48) * uFlash * (0.2 + mask) * smoothstep(-0.1, 0.25, height);
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  useFrame(({ camera, clock }) => {
    mesh.current?.position.copy(camera.position);
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uFlash.value = fx.lightning;
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[400, 48, 24]} />
    </mesh>
  );
}

const MIST_RANGE = 44;

/** Camera-facing mist sheets that drift with the wind and catch headlight and flashlight beams. */
export function Mist({ count }: { count: number }) {
  const { textures } = useWorld();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const random = useMemo(() => createRandom(2024), []);
  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (random() - 0.5) * MIST_RANGE * 2,
        z: (random() - 0.5) * MIST_RANGE * 2,
        height: 0.4 + random() * 2.8,
        ground: 0,
        size: 6 + random() * 9,
        speed: 0.45 + random() * 0.7,
        spin: (random() - 0.5) * 0.12,
        rotation: random() * Math.PI * 2,
        refresh: Math.floor(random() * 30),
      })),
    [count, random],
  );
  const material = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        map: textures.puff,
        color: "#9a8792",
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    [textures.puff],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const frame = useRef(0);

  useFrame(({ camera, clock }, delta) => {
    const instanced = mesh.current;
    if (!instanced) return;
    const dt = Math.min(delta, 0.05);
    const windX = Math.cos(clock.elapsedTime * 0.05) * 0.8;
    const windZ = 0.55;
    frame.current++;
    particles.forEach((particle, index) => {
      particle.x += windX * particle.speed * dt;
      particle.z += windZ * particle.speed * dt;
      particle.rotation += particle.spin * dt;
      const shiftX = Math.round((particle.x - camera.position.x) / (MIST_RANGE * 2));
      const shiftZ = Math.round((particle.z - camera.position.z) / (MIST_RANGE * 2));
      particle.x -= shiftX * MIST_RANGE * 2;
      particle.z -= shiftZ * MIST_RANGE * 2;
      const wrapped = shiftX !== 0 || shiftZ !== 0;
      if (wrapped || (frame.current + particle.refresh) % 30 === 0) particle.ground = terrainHeight(particle.x, particle.z);
      const distance = Math.hypot(particle.x - camera.position.x, particle.z - camera.position.z);
      const fade = smoothstep(MIST_RANGE, MIST_RANGE * 0.7, distance) * smoothstep(1.5, 6, distance);
      dummy.position.set(particle.x, particle.ground + particle.height, particle.z);
      dummy.quaternion.copy(camera.quaternion);
      dummy.rotateZ(particle.rotation);
      dummy.scale.setScalar(Math.max(0.001, particle.size * fade));
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, material, count]} frustumCulled={false} renderOrder={3}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

/** Floating ash drifting around the camera; positions wrap entirely on the GPU. */
export function Ash({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const random = createRandom(8);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      positions.set([(random() - 0.5) * 80, (random() - 0.5) * 30, (random() - 0.5) * 80], index * 3);
      seeds[index] = random();
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return buffer;
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCenter: { value: new THREE.Vector3() },
          uRange: { value: new THREE.Vector3(36, 12, 36) },
          uScale: { value: 1 },
          uColor: { value: new THREE.Color("#c9b3b8") },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uCenter;
          uniform vec3 uRange;
          uniform float uScale;
          attribute float aSeed;
          varying float vAlpha;
          void main() {
            float t = uTime;
            vec3 drift = vec3(
              sin(t * 0.3 + aSeed * 6.283) * 0.7 + t * 0.32,
              t * (0.1 + fract(aSeed * 7.0) * 0.16) + sin(t * 0.7 + aSeed * 20.0) * 0.2,
              cos(t * 0.23 + aSeed * 12.0) * 0.6 + t * 0.18
            );
            vec3 local = mod(position + drift - uCenter + uRange, uRange * 2.0) - uRange;
            vec4 mvPosition = viewMatrix * vec4(uCenter + local, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float distance = max(-mvPosition.z, 0.3);
            gl_PointSize = uScale * (2.5 + fract(aSeed * 13.0) * 6.0) / distance;
            vAlpha = smoothstep(1.0, 0.55, length(local / uRange)) * smoothstep(0.3, 1.5, distance);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            float edge = length(gl_PointCoord - 0.5);
            float alpha = smoothstep(0.5, 0.05, edge) * vAlpha * 0.65;
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(uColor, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  useFrame(({ camera, clock, size, viewport }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uCenter.value.copy(camera.position);
    material.uniforms.uScale.value = (size.height * viewport.dpr) / 220;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={4} />;
}

/** Occasional red lightning: two short flashes per strike, never more than three per second. */
export function Lightning() {
  const { fx, audio, settings } = useWorld();
  const light = useRef<THREE.DirectionalLight>(null);
  const random = useMemo(() => createRandom(66), []);
  const bolt = useMemo(() => {
    const mesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.1, 1.3), transparent: true, toneMapped: false, fog: false, side: THREE.DoubleSide }),
    );
    mesh.visible = false;
    mesh.frustumCulled = false;
    return mesh;
  }, []);
  const strike = useRef({ next: 9, start: -10 });

  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;
    const state = strike.current;
    const current = settings.current;
    if (!current.reducedMotion && !current.paused && time > state.next) {
      state.start = time;
      state.next = time + 14 + random() * 20;
      const angle = random() * Math.PI * 2;
      const distance = 150 + random() * 90;
      const origin = new THREE.Vector3(camera.position.x + Math.cos(angle) * distance, 130, camera.position.z + Math.sin(angle) * distance);
      const toCamera = new THREE.Vector3(camera.position.x - origin.x, 0, camera.position.z - origin.z).normalize();
      const side = new THREE.Vector3(-toCamera.z, 0, toCamera.x);
      const positions: number[] = [];
      const addRibbon = (start: THREE.Vector3, steps: number, width: number) => {
        const point = start.clone();
        let previous = point.clone();
        for (let step = 0; step < steps; step++) {
          point.add(new THREE.Vector3((random() - 0.5) * 12, -(7 + random() * 6), (random() - 0.5) * 12));
          const a = previous.clone().addScaledVector(side, -width);
          const b = previous.clone().addScaledVector(side, width);
          const c = point.clone().addScaledVector(side, -width);
          const d = point.clone().addScaledVector(side, width);
          positions.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...b.toArray(), ...d.toArray(), ...c.toArray());
          if (step === 3 || step === 6) addRibbon(point.clone(), 3, width * 0.6);
          previous = point.clone();
        }
      };
      addRibbon(origin, 11, 0.9);
      bolt.geometry.dispose();
      bolt.geometry = new THREE.BufferGeometry();
      bolt.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      if (light.current) light.current.position.set(origin.x * 0.2 + camera.position.x * 0.8, 80, origin.z * 0.2 + camera.position.z * 0.8);
      audio.thunder(0.8 + distance / 160);
    }
    const t = time - state.start;
    const pulse = t < 0 ? 0 : t < 0.08 ? 1 : t < 0.17 ? 0.12 : t < 0.27 ? 0.75 : Math.max(0, 0.75 - (t - 0.27) * 2.8);
    fx.lightning = pulse;
    bolt.visible = pulse > 0.04;
    (bolt.material as THREE.MeshBasicMaterial).opacity = pulse;
    if (light.current) light.current.intensity = pulse * 2.4;
  });

  return (
    <>
      <primitive object={bolt} />
      <directionalLight ref={light} color="#ff9aa6" intensity={0} position={[0, 80, 0]} />
    </>
  );
}
