export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Returns the shortest signed difference between two angles, in radians. */
export const angleDelta = (from: number, to: number) => {
  const delta = (to - from) % (Math.PI * 2);
  return delta > Math.PI ? delta - Math.PI * 2 : delta < -Math.PI ? delta + Math.PI * 2 : delta;
};

/** Small deterministic PRNG so the world is identical on every visit. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, y: number, seed = 0) {
  let value = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

/** Smooth value noise. A non-zero period makes the noise tile every `period` lattice cells. */
export function valueNoise(x: number, y: number, seed = 0, period = 0) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const wrap = (value: number) => (period > 0 ? ((value % period) + period) % period : value);
  const a = hash2(wrap(x0), wrap(y0), seed);
  const b = hash2(wrap(x0 + 1), wrap(y0), seed);
  const c = hash2(wrap(x0), wrap(y0 + 1), seed);
  const d = hash2(wrap(x0 + 1), wrap(y0 + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export function fbm(x: number, y: number, octaves = 4, seed = 0, period = 0) {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let normalizer = 0;
  for (let octave = 0; octave < octaves; octave++) {
    sum += amplitude * valueNoise(x * frequency, y * frequency, seed + octave * 17, period * frequency);
    normalizer += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return sum / normalizer;
}
