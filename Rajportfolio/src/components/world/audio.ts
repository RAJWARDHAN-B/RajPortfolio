import { clamp } from "./noise";

export interface WorldAudio {
  setEnabled: (enabled: boolean) => void;
  updateEngine: (rpm: number, throttle: boolean, inCar: boolean) => void;
  setHorn: (on: boolean) => void;
  scream: () => void;
  thunder: (delaySeconds: number) => void;
  footstep: () => void;
  crash: (strength: number) => void;
  growl: () => void;
  dispose: () => void;
}

const silentAudio: WorldAudio = {
  setEnabled: () => undefined,
  updateEngine: () => undefined,
  setHorn: () => undefined,
  scream: () => undefined,
  thunder: () => undefined,
  footstep: () => undefined,
  crash: () => undefined,
  growl: () => undefined,
  dispose: () => undefined,
};

const createNoiseBuffer = (context: AudioContext, seconds: number, brown: boolean) => {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < data.length; index++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[index] = last * 3.5;
    } else {
      data[index] = white;
    }
  }
  return buffer;
};

const createImpulse = (context: AudioContext, seconds: number) => {
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 2.6;
  }
  return impulse;
};

const distortionCurve = (amount: number) => {
  const curve = new Float32Array(1024);
  for (let index = 0; index < curve.length; index++) {
    const x = (index * 2) / curve.length - 1;
    curve[index] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
};

/** Synthesised soundscape, so the world ships no third-party audio files. */
export function createWorldAudio(context: AudioContext | null): WorldAudio {
  if (!context) return silentAudio;

  const sources: AudioScheduledSourceNode[] = [];
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const reverb = context.createConvolver();
  reverb.buffer = createImpulse(context, 3);
  const reverbReturn = context.createGain();
  reverbReturn.gain.value = 0.4;
  reverb.connect(reverbReturn).connect(master);

  const effects = context.createGain();
  effects.connect(master);
  effects.connect(reverb);

  const whiteNoise = createNoiseBuffer(context, 2, false);
  const brownNoise = createNoiseBuffer(context, 4, true);

  const loop = (buffer: AudioBuffer) => {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    sources.push(source);
    return source;
  };
  const oscillator = (type: OscillatorType, frequency: number) => {
    const node = context.createOscillator();
    node.type = type;
    node.frequency.value = frequency;
    sources.push(node);
    return node;
  };

  const windFilter = context.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.5;
  const windGain = context.createGain();
  windGain.gain.value = 0.16;
  loop(brownNoise).connect(windFilter).connect(windGain).connect(master);
  const gust = oscillator("sine", 0.06);
  const gustDepth = context.createGain();
  gustDepth.gain.value = 0.09;
  gust.connect(gustDepth).connect(windGain.gain);

  const droneGain = context.createGain();
  droneGain.gain.value = 0.045;
  oscillator("sine", 46.2).connect(droneGain);
  oscillator("sine", 46.9).connect(droneGain);
  oscillator("triangle", 92.7).connect(droneGain);
  droneGain.connect(master);
  droneGain.connect(reverb);

  const engineFilter = context.createBiquadFilter();
  engineFilter.type = "lowpass";
  engineFilter.Q.value = 2;
  const engineGain = context.createGain();
  engineGain.gain.value = 0;
  const engineLow = oscillator("sawtooth", 40);
  const engineHigh = oscillator("square", 20);
  const engineHighGain = context.createGain();
  engineHighGain.gain.value = 0.45;
  engineLow.connect(engineFilter);
  engineHigh.connect(engineHighGain).connect(engineFilter);
  engineFilter.connect(engineGain).connect(master);

  const hornGain = context.createGain();
  hornGain.gain.value = 0;
  const hornFilter = context.createBiquadFilter();
  hornFilter.type = "lowpass";
  hornFilter.frequency.value = 1800;
  oscillator("square", 392).connect(hornFilter);
  oscillator("square", 494).connect(hornFilter);
  hornFilter.connect(hornGain).connect(effects);

  sources.forEach((source) => source.start());

  const burst = (buffer: AudioBuffer, filterType: BiquadFilterType, frequency: number, gain: number, duration: number, delay = 0) => {
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(envelope).connect(effects);
    source.start(start, Math.random() * (buffer.duration - duration - 0.05), duration + 0.05);
    return { start, filter, envelope };
  };

  let enabled = false;
  return {
    setEnabled(next) {
      enabled = next;
      if (next && context.state === "suspended") void context.resume().catch(() => undefined);
      master.gain.setTargetAtTime(next ? 0.85 : 0, context.currentTime, 0.15);
    },
    updateEngine(rpm, throttle, inCar) {
      const now = context.currentTime;
      const frequency = 34 + rpm * 92;
      engineLow.frequency.setTargetAtTime(frequency, now, 0.06);
      engineHigh.frequency.setTargetAtTime(frequency / 2, now, 0.06);
      engineFilter.frequency.setTargetAtTime(300 + rpm * 1500 + (throttle ? 450 : 0), now, 0.08);
      const level = inCar ? 0.05 + rpm * 0.07 + (throttle ? 0.025 : 0) : 0.012;
      engineGain.gain.setTargetAtTime(level, now, 0.2);
    },
    setHorn(on) {
      hornGain.gain.setTargetAtTime(on ? 0.11 : 0, context.currentTime, 0.02);
    },
    scream() {
      if (!enabled) return;
      const now = context.currentTime;
      const noise = burst(whiteNoise, "bandpass", 2600, 0.5, 1.3);
      noise.filter.Q.value = 3;
      noise.filter.frequency.exponentialRampToValueAtTime(650, now + 1.2);
      const shaper = context.createWaveShaper();
      shaper.curve = distortionCurve(60);
      const voiceGain = context.createGain();
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.exponentialRampToValueAtTime(0.32, now + 0.03);
      voiceGain.gain.setValueAtTime(0.3, now + 0.45);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
      shaper.connect(voiceGain).connect(effects);
      for (const detune of [-38, 0, 27]) {
        const voice = context.createOscillator();
        voice.type = "sawtooth";
        voice.detune.value = detune;
        voice.frequency.setValueAtTime(880, now);
        voice.frequency.exponentialRampToValueAtTime(240, now + 1.3);
        const vibrato = context.createOscillator();
        vibrato.frequency.value = 11;
        const vibratoDepth = context.createGain();
        vibratoDepth.gain.value = 45;
        vibrato.connect(vibratoDepth).connect(voice.frequency);
        voice.connect(shaper);
        voice.start(now);
        vibrato.start(now);
        voice.stop(now + 1.5);
        vibrato.stop(now + 1.5);
      }
    },
    thunder(delaySeconds) {
      if (!enabled) return;
      burst(brownNoise, "lowpass", 240, 0.7, 3.2, delaySeconds);
    },
    footstep() {
      if (!enabled) return;
      burst(whiteNoise, "bandpass", 700 + Math.random() * 500, 0.05, 0.11);
    },
    crash(strength) {
      if (!enabled) return;
      burst(whiteNoise, "lowpass", 1400, clamp(0.12 + strength * 0.05, 0.12, 0.6), 0.5);
      burst(brownNoise, "lowpass", 120, clamp(0.3 + strength * 0.08, 0.3, 0.9), 0.6);
    },
    growl() {
      if (!enabled) return;
      const now = context.currentTime;
      const voice = context.createOscillator();
      voice.type = "sawtooth";
      voice.frequency.setValueAtTime(78, now);
      voice.frequency.exponentialRampToValueAtTime(52, now + 1.8);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 340;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.09, now + 0.4);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 2);
      voice.connect(filter).connect(envelope).connect(reverb);
      voice.start(now);
      voice.stop(now + 2.1);
    },
    dispose() {
      sources.forEach((source) => {
        try {
          source.stop();
        } catch (_error) {
          // Already stopped.
        }
      });
      master.disconnect();
    },
  };
}
