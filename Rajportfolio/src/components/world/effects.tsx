import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { useWorld } from "./runtime";

const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAberration: { value: 0.001 },
    uFlash: { value: 0 },
    uGrain: { value: 0.04 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAberration;
    uniform float uFlash;
    uniform float uGrain;
    varying vec2 vUv;
    float random(vec2 point) {
      return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec2 fromCentre = vUv - 0.5;
      float distance = length(fromCentre);
      vec2 offset = fromCentre * uAberration * (0.4 + distance * 1.6);
      vec3 color = vec3(
        texture2D(tDiffuse, vUv + offset).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - offset).b
      );
      color *= mix(0.32, 1.0, smoothstep(0.82, 0.22, distance));
      color = mix(color, vec3(0.42, 0.0, 0.03), uFlash * smoothstep(0.12, 0.75, distance) * 0.85);
      color += vec3(0.16, 0.0, 0.01) * uFlash;
      color += (random(vUv * 1000.0 + fract(uTime * 7.0)) - 0.5) * uGrain;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

/** Bloom for lights and eyes, then vignette, film grain and scare-driven chromatic aberration. */
export function Effects() {
  const { gl, scene, camera, size, viewport } = useThree();
  const { fx } = useWorld();
  const pipeline = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(gl, target);
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.4, 0.92);
    const cinematic = new ShaderPass(CinematicShader);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.addPass(cinematic);
    return { composer, bloom, cinematic };
  }, [gl, scene, camera]);

  useEffect(() => {
    pipeline.composer.setPixelRatio(viewport.dpr);
    pipeline.composer.setSize(size.width, size.height);
  }, [pipeline, size.width, size.height, viewport.dpr]);

  useEffect(
    () => () => {
      pipeline.bloom.dispose();
      pipeline.composer.dispose();
    },
    [pipeline],
  );

  useFrame(({ clock }, delta) => {
    const uniforms = pipeline.cinematic.uniforms;
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uAberration.value = 0.0015 + fx.aberration * 0.018;
    uniforms.uFlash.value = fx.flash;
    pipeline.composer.render(delta);
  }, 1);

  return null;
}
