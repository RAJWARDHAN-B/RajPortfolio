import * as THREE from "three";
import { clamp, createRandom, fbm, hash2, smoothstep } from "./noise";

/** Metres of road represented by one vertical repeat of the road texture. */
export const ROAD_TEXTURE_LENGTH = 9.6;

const DISPLAY_FONT = '"Bebas Neue", Impact, "Arial Narrow", sans-serif';
const BODY_FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  return { canvas, context };
};

const toTexture = (canvas: HTMLCanvasElement, srgb = true) => {
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
};

/** Redraws once the display font is ready, because canvas text cannot wait for CSS fonts. */
const redrawWhenFontsLoad = (draw: () => void, texture: THREE.Texture) => {
  draw();
  document.fonts
    ?.load(`64px ${DISPLAY_FONT}`)
    .then(() => {
      draw();
      texture.needsUpdate = true;
    })
    .catch(() => undefined);
};

const fitText = (context: CanvasRenderingContext2D, text: string, font: (size: number) => string, size: number, maxWidth: number) => {
  let current = size;
  context.font = font(current);
  while (current > 12 && context.measureText(text).width > maxWidth) {
    current -= 2;
    context.font = font(current);
  }
  return current;
};

export function createRoadTextures() {
  const width = 512;
  const height = 1024;
  const random = createRandom(42);
  const colorCanvas = makeCanvas(width, height);
  const roughCanvas = makeCanvas(width, height);
  const color = colorCanvas.context.createImageData(width, height);
  const rough = roughCanvas.context.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const u = x / width;
      const base = fbm(x / 64, y / 64, 3, 3, 16);
      const grain = hash2(x, y, 5);
      const puddle = smoothstep(0.6, 0.7, fbm(x / 128 + 0.5, y / 128, 2, 9, 8));
      const shoulder = u < 0.035 || u > 0.965;
      let value = shoulder ? 0.14 + base * 0.09 + (grain - 0.5) * 0.14 : 0.105 + base * 0.075 + (grain - 0.5) * 0.06;
      value *= 1 - puddle * 0.4;
      color.data[index] = clamp(value * 262, 0, 255);
      color.data[index + 1] = clamp(value * 250, 0, 255);
      color.data[index + 2] = clamp(value * 258, 0, 255);
      color.data[index + 3] = 255;
      const roughness = shoulder ? 0.96 : 0.84 - puddle * 0.66 + (grain - 0.5) * 0.08;
      rough.data[index] = rough.data[index + 1] = rough.data[index + 2] = clamp(roughness, 0.06, 1) * 255;
      rough.data[index + 3] = 255;
    }
  }

  const paint = colorCanvas.context;
  const roughPaint = roughCanvas.context;
  paint.putImageData(color, 0, 0);
  roughPaint.putImageData(rough, 0, 0);

  const lineWidth = 9;
  const edge = width * 0.065;
  const dashLength = height * (3 / ROAD_TEXTURE_LENGTH);
  const markings: [number, number, number, number, string][] = [
    [edge, 0, lineWidth, height, "rgba(214, 209, 196, 0.85)"],
    [width - edge - lineWidth, 0, lineWidth, height, "rgba(214, 209, 196, 0.85)"],
    [width / 2 - lineWidth - 3, height * 0.12, lineWidth, dashLength, "rgba(206, 158, 54, 0.9)"],
    [width / 2 + 3, height * 0.12, lineWidth, dashLength, "rgba(206, 158, 54, 0.9)"],
  ];
  for (const [x, y, w, h, fill] of markings) {
    paint.fillStyle = fill;
    paint.fillRect(x, y, w, h);
    roughPaint.fillStyle = "rgb(150, 150, 150)";
    roughPaint.fillRect(x, y, w, h);
  }

  for (let patch = 0; patch < 5; patch++) {
    const patchWidth = 60 + random() * 140;
    const patchHeight = 80 + random() * 220;
    const x = width * 0.1 + random() * (width * 0.8 - patchWidth);
    const y = random() * height;
    paint.fillStyle = `rgba(${random() < 0.5 ? "0,0,0" : "60,60,64"}, 0.16)`;
    for (const offset of [-height, 0, height]) paint.fillRect(x, y + offset, patchWidth, patchHeight);
  }

  paint.lineCap = "round";
  for (let crack = 0; crack < 18; crack++) {
    let x = random() * width;
    let y = random() * height;
    let angle = random() * Math.PI * 2;
    const points: [number, number][] = [[x, y]];
    for (let segment = 0; segment < 6 + random() * 12; segment++) {
      angle += (random() - 0.5) * 1.4;
      x += Math.cos(angle) * (6 + random() * 16);
      y += Math.sin(angle) * (6 + random() * 16);
      points.push([x, y]);
    }
    paint.strokeStyle = `rgba(8, 8, 9, ${0.45 + random() * 0.4})`;
    paint.lineWidth = 0.8 + random() * 1.6;
    for (const offset of [-height, 0, height]) {
      paint.beginPath();
      points.forEach(([px, py], index) => (index ? paint.lineTo(px, py + offset) : paint.moveTo(px, py + offset)));
      paint.stroke();
    }
  }

  for (let speck = 0; speck < 9000; speck++) {
    paint.fillStyle = `rgba(${random() < 0.7 ? "12,12,14" : "120,118,112"}, ${random() * 0.35})`;
    paint.fillRect(random() * width, random() * height, 1 + random() * 2.5, 1 + random() * 2.5);
  }

  const map = toTexture(colorCanvas.canvas);
  const roughnessMap = toTexture(roughCanvas.canvas, false);
  map.wrapS = roughnessMap.wrapS = THREE.ClampToEdgeWrapping;
  return { map, roughnessMap };
}

export function createGroundTexture() {
  const size = 512;
  const random = createRandom(77);
  const { canvas, context } = makeCanvas(size, size);
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const broad = fbm(x / 64, y / 64, 4, 21, 8);
      const moss = smoothstep(0.42, 0.66, fbm(x / 32 + 7, y / 32, 3, 23, 16));
      const leaf = hash2(x >> 2, y >> 2, 29) > 0.9 ? 0.55 + hash2(x >> 2, y >> 2, 31) * 0.45 : 0;
      const brightness = 0.7 + broad * 0.65 + (hash2(x, y, 3) - 0.5) * 0.12;
      let r = 0.17 + (0.13 - 0.17) * moss;
      let g = 0.135 + (0.16 - 0.135) * moss;
      let b = 0.125 + (0.11 - 0.125) * moss;
      r += (0.4 - r) * leaf * 0.7;
      g += (0.17 - g) * leaf * 0.7;
      b += (0.1 - b) * leaf * 0.7;
      image.data[index] = clamp(r * brightness * 255, 0, 255);
      image.data[index + 1] = clamp(g * brightness * 255, 0, 255);
      image.data[index + 2] = clamp(b * brightness * 255, 0, 255);
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  context.lineCap = "round";
  for (let twig = 0; twig < 160; twig++) {
    const x = random() * size;
    const y = random() * size;
    const angle = random() * Math.PI * 2;
    const length = 6 + random() * 22;
    context.strokeStyle = `rgba(${40 + random() * 30}, ${26 + random() * 16}, ${18 + random() * 10}, 0.8)`;
    context.lineWidth = 1 + random() * 1.5;
    for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
      context.beginPath();
      context.moveTo(x + ox, y + oy);
      context.lineTo(x + ox + Math.cos(angle) * length, y + oy + Math.sin(angle) * length);
      context.stroke();
    }
  }
  return toTexture(canvas);
}

export function createBarkTexture() {
  const width = 256;
  const height = 512;
  const { canvas, context } = makeCanvas(width, height);
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const streak = fbm(x / 16, y / 128, 4, 31, 16);
      const crack = smoothstep(0.38, 0.3, fbm(x / 8, y / 64, 2, 37, 32));
      const value = (0.16 + streak * 0.26) * (1 - crack * 0.7) * (0.9 + hash2(x, y, 41) * 0.2);
      image.data[index] = clamp(value * 255 * 0.92, 0, 255);
      image.data[index + 1] = clamp(value * 255 * 0.82, 0, 255);
      image.data[index + 2] = clamp(value * 255 * 0.78, 0, 255);
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return toTexture(canvas);
}

export function createPuffTexture() {
  const size = 128;
  const { canvas, context } = makeCanvas(size, size);
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const distance = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
      const cloud = fbm(x / 22, y / 22, 4, 51);
      const alpha = smoothstep(1, 0.15, distance) * clamp(0.35 + cloud * 0.9, 0, 1);
      image.data[index] = image.data[index + 1] = image.data[index + 2] = 255;
      image.data[index + 3] = alpha * 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = toTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createLabelTexture(title: string, subtitle: string) {
  const { canvas, context } = makeCanvas(1024, 160);
  const texture = toTexture(canvas);
  redrawWhenFontsLoad(() => {
    context.fillStyle = "#070707";
    context.fillRect(0, 0, 1024, 160);
    context.fillStyle = "#e50914";
    context.fillRect(0, 0, 18, 160);
    context.fillRect(0, 150, 1024, 10);
    context.fillStyle = "#f4f1ee";
    fitText(context, title.toUpperCase(), (size) => `${size}px ${DISPLAY_FONT}`, 92, 920);
    context.fillText(title.toUpperCase(), 48, 98);
    context.fillStyle = "#a9a3a3";
    context.font = `500 26px ${BODY_FONT}`;
    context.fillText(subtitle, 50, 136);
  }, texture);
  return texture;
}

export function createPlateTexture(text: string) {
  const { canvas, context } = makeCanvas(256, 128);
  const texture = toTexture(canvas);
  redrawWhenFontsLoad(() => {
    context.fillStyle = "#e9e4d6";
    context.fillRect(0, 0, 256, 128);
    context.strokeStyle = "#1c1c1c";
    context.lineWidth = 8;
    context.strokeRect(6, 6, 244, 116);
    context.fillStyle = "#8c0a10";
    context.font = `600 18px ${BODY_FONT}`;
    context.textAlign = "center";
    context.fillText("SHADOW ROAD", 128, 34);
    context.fillStyle = "#151515";
    context.font = `76px ${DISPLAY_FONT}`;
    context.fillText(text, 128, 106);
  }, texture);
  return texture;
}

export function createGaugeTexture(kind: "speed" | "rpm") {
  const { canvas, context } = makeCanvas(256, 256);
  const texture = toTexture(canvas);
  redrawWhenFontsLoad(() => {
    context.clearRect(0, 0, 256, 256);
    context.fillStyle = "#050505";
    context.beginPath();
    context.arc(128, 128, 126, 0, Math.PI * 2);
    context.fill();
    const max = kind === "speed" ? 180 : 8;
    const major = kind === "speed" ? 20 : 1;
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (let value = 0; value <= max; value += major / 2) {
      const angle = (-225 + (value / max) * 270) * (Math.PI / 180);
      const isMajor = value % major === 0;
      const inner = isMajor ? 92 : 102;
      context.strokeStyle = kind === "rpm" && value >= 6 ? "#ff3b30" : "#ffb35c";
      context.lineWidth = isMajor ? 5 : 2;
      context.beginPath();
      context.moveTo(128 + Math.cos(angle) * inner, 128 + Math.sin(angle) * inner);
      context.lineTo(128 + Math.cos(angle) * 114, 128 + Math.sin(angle) * 114);
      context.stroke();
      if (isMajor) {
        context.fillStyle = "#ffd9a8";
        context.font = `30px ${DISPLAY_FONT}`;
        context.fillText(String(value), 128 + Math.cos(angle) * 70, 128 + Math.sin(angle) * 70);
      }
    }
    context.fillStyle = "#ff9b3d";
    context.font = `600 16px ${BODY_FONT}`;
    context.fillText(kind === "speed" ? "KM/H" : "×1000 RPM", 128, 182);
  }, texture);
  return texture;
}

export function createRadioTexture() {
  const { canvas, context } = makeCanvas(256, 64);
  const texture = toTexture(canvas);
  redrawWhenFontsLoad(() => {
    context.fillStyle = "#120402";
    context.fillRect(0, 0, 256, 64);
    context.fillStyle = "#ff8a2a";
    context.font = `44px ${DISPLAY_FONT}`;
    context.fillText("FM 88.1  ·  SHADOW", 14, 48);
  }, texture);
  return texture;
}

const drawCreatureSilhouette = (context: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.beginPath();
  context.ellipse(0, -92, 13, 18, 0, 0, Math.PI * 2);
  context.moveTo(-16, -70);
  context.quadraticCurveTo(-26, -20, -12, 10);
  context.lineTo(-20, 78);
  context.lineTo(-10, 78);
  context.lineTo(0, 22);
  context.lineTo(10, 78);
  context.lineTo(20, 78);
  context.lineTo(12, 10);
  context.quadraticCurveTo(26, -20, 16, -70);
  context.closePath();
  context.fill();
  context.lineWidth = 7;
  context.lineCap = "round";
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(side * 16, -64);
    context.quadraticCurveTo(side * 48, -30, side * 44, 30);
    context.stroke();
    for (const finger of [-8, 0, 8]) {
      context.beginPath();
      context.moveTo(side * 44, 30);
      context.lineTo(side * (48 + finger * 0.4), 56 + Math.abs(finger));
      context.lineWidth = 3;
      context.stroke();
    }
    context.lineWidth = 7;
  }
  context.restore();
};

export function createSignTexture(kind: "welcome" | "creature" | "speed" | "turnBack") {
  const random = createRandom(kind.length * 97);
  const size: [number, number] = kind === "welcome" ? [1024, 512] : kind === "speed" ? [256, 320] : kind === "turnBack" ? [512, 256] : [512, 512];
  const { canvas, context } = makeCanvas(size[0], size[1]);
  const texture = toTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

  const drawPlanks = (width: number, height: number, base: [number, number, number]) => {
    const planks = 4;
    for (let plank = 0; plank < planks; plank++) {
      const shade = 0.8 + random() * 0.35;
      context.fillStyle = `rgb(${base[0] * shade}, ${base[1] * shade}, ${base[2] * shade})`;
      context.fillRect(0, (plank * height) / planks, width, height / planks - 4);
      for (let grain = 0; grain < 40; grain++) {
        context.strokeStyle = `rgba(20, 10, 6, ${0.12 + random() * 0.2})`;
        context.lineWidth = 1 + random() * 2;
        const y = (plank * height) / planks + random() * (height / planks);
        context.beginPath();
        context.moveTo(0, y);
        context.bezierCurveTo(width * 0.3, y + (random() - 0.5) * 10, width * 0.7, y + (random() - 0.5) * 10, width, y);
        context.stroke();
      }
    }
  };

  redrawWhenFontsLoad(() => {
    context.clearRect(0, 0, size[0], size[1]);
    context.textAlign = "center";
    if (kind === "welcome") {
      drawPlanks(1024, 512, [86, 54, 36]);
      context.strokeStyle = "#1b0f09";
      context.lineWidth = 18;
      context.strokeRect(9, 9, 1006, 494);
      context.fillStyle = "#e50914";
      context.shadowColor = "rgba(0,0,0,0.8)";
      context.shadowBlur = 8;
      context.font = `150px ${DISPLAY_FONT}`;
      context.fillText("THE SHADOW ROAD", 512, 210);
      context.shadowBlur = 0;
      context.fillStyle = "#f0e5d0";
      context.font = `52px ${DISPLAY_FONT}`;
      context.fillText("RAJWARDHAN'S PROJECT ARCHIVE", 512, 300);
      context.font = `600 30px ${BODY_FONT}`;
      context.fillStyle = "#d9c7a8";
      context.fillText("FOLLOW THE RED LIGHTS  ·  STAY ON THE ROAD", 512, 380);
      context.fillText("POP. ?", 512, 440);
    } else if (kind === "creature") {
      context.translate(256, 256);
      context.rotate(Math.PI / 4);
      context.fillStyle = "#e0b313";
      context.fillRect(-170, -170, 340, 340);
      context.strokeStyle = "#111";
      context.lineWidth = 16;
      context.strokeRect(-150, -150, 300, 300);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = "#111";
      context.strokeStyle = "#111";
      drawCreatureSilhouette(context, 256, 250, 1.2);
      context.font = `46px ${DISPLAY_FONT}`;
      context.fillText("NEXT 300 M", 256, 470);
    } else if (kind === "speed") {
      context.fillStyle = "#ece8de";
      context.fillRect(0, 0, 256, 320);
      context.strokeStyle = "#111";
      context.lineWidth = 10;
      context.strokeRect(10, 10, 236, 300);
      context.fillStyle = "#111";
      context.font = `56px ${DISPLAY_FONT}`;
      context.fillText("SPEED", 128, 82);
      context.fillText("LIMIT", 128, 136);
      context.font = `150px ${DISPLAY_FONT}`;
      context.fillText("35", 128, 280);
    } else {
      drawPlanks(512, 256, [70, 52, 40]);
      context.fillStyle = "#b3060f";
      context.font = `128px ${DISPLAY_FONT}`;
      context.rotate(-0.05);
      context.fillText("TURN BACK", 262, 168);
      context.setTransform(1, 0, 0, 1, 0, 0);
      for (let drip = 0; drip < 14; drip++) {
        const x = 60 + random() * 400;
        context.fillRect(x, 140 + random() * 30, 4, 20 + random() * 50);
      }
    }
    for (let scratch = 0; scratch < 220; scratch++) {
      context.fillStyle = `rgba(0, 0, 0, ${random() * 0.18})`;
      context.fillRect(random() * size[0], random() * size[1], 1 + random() * 4, 1 + random() * 3);
    }
  }, texture);
  return texture;
}
