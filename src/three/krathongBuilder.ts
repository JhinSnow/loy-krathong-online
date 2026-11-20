// src/three/krathongBuilder.ts
// โมเดลกระทง 3 มิติประณีต (InstancedMesh Batching ~10 Draw Calls/ใบ เพื่อความลื่น 60 FPS)
// ปรับแต่งรูปทรงกลีบใบตองพับ 2 ชั้น หยวกกล้วย ดอกบัวตูม ดาวเรืองฟู มะลิ และธูปเทียนตามแบบงานฝีมือประณีต

import * as THREE from 'three';
import { parseCandleConfig } from '../utils/krathongConfig';

export interface KrathongAnimHandles {
  flames: { mesh: THREE.Object3D; baseY: number; baseScaleY: number; phase: number }[];
  sparklers: THREE.Object3D[];
  butterflies: { leftWing: THREE.Object3D; rightWing: THREE.Object3D; root: THREE.Object3D; baseY: number }[];
  lanterns: { root: THREE.Object3D; baseY: number }[];
  waterHalo?: THREE.Mesh;
  rippleRings?: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; phase: number }[];
}

export interface KrathongScaleTargets {
  centerGroup: THREE.Group;
  accessoryGroups: Map<string, THREE.Group>;
}

export interface BuildKrathong3DOptions {
  baseType: string;
  flowerType: string;
  candleColor: string;
  isMine?: boolean;
  withFlameLight?: boolean;
  withWaterRipples?: boolean;
}

interface SharedAssets {
  bananaTrunkTex: THREE.CanvasTexture;
  bananaGliebTex: THREE.CanvasTexture;
  bananaDeckTex: THREE.CanvasTexture;
  lotusPetalTex: THREE.CanvasTexture;
  marigoldPetalTex: THREE.CanvasTexture;
  petalBump: THREE.CanvasTexture;
  coconutTex: THREE.CanvasTexture;
  breadTex: THREE.CanvasTexture;
  foldedGliebGeo: THREE.BufferGeometry;
  cuppedPetalGeo: THREE.BufferGeometry;
  rufflePetalGeo: THREE.BufferGeometry;
  pumpkinRibGeo: THREE.BufferGeometry;
  jasmineBudGeo: THREE.BufferGeometry;
  baseCupGeo: THREE.CylinderGeometry;
  waistBandGeo: THREE.TorusGeometry;
  deckPadGeo: THREE.CylinderGeometry;
  candleStickGeo: THREE.CylinderGeometry;
  flameOuterGeo: THREE.ConeGeometry;
  flameInnerGeo: THREE.ConeGeometry;
  coconutBowlGeo: THREE.SphereGeometry;
  breadBunGeo: THREE.SphereGeometry;
  incenseStemGeo: THREE.CylinderGeometry;
  incenseTipGeo: THREE.SphereGeometry;
  heartGeo: THREE.BufferGeometry;
  haloGeo: THREE.RingGeometry;
  rippleRingGeo: THREE.RingGeometry;
}

let cachedAssets: SharedAssets | null = null;

function markShared<T extends THREE.BufferGeometry | THREE.Texture>(asset: T): T {
  asset.userData.shared = true;
  return asset;
}

function createBananaTrunkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#c6d54c');
    grad.addColorStop(0.55, '#b2c43a');
    grad.addColorStop(1, '#8fa324');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 64);

    ctx.strokeStyle = 'rgba(255, 250, 220, 0.18)';
    ctx.lineWidth = 1;
    for (let y = 5; y < 64; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return markShared(tex);
}

function createBananaGliebTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 128, 0, 0);
    grad.addColorStop(0, '#4d7c0f');
    grad.addColorStop(0.45, '#65a30d');
    grad.addColorStop(0.85, '#84cc16');
    grad.addColorStop(1, '#a3e635');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // เส้นใบตองตามขวางเฉียงสมจริง
    ctx.strokeStyle = 'rgba(236, 252, 203, 0.22)';
    ctx.lineWidth = 1.2;
    for (let y = 8; y < 128; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(64, y - 8);
      ctx.lineTo(128, y);
      ctx.stroke();
    }

    // แนวสันพับกลางกลีบ (แสงซ้าย-เงาขวาเล็กน้อยให้กลีบดูคมนูน)
    const sideGrad = ctx.createLinearGradient(0, 0, 128, 0);
    sideGrad.addColorStop(0, 'rgba(30, 58, 10, 0.22)');
    sideGrad.addColorStop(0.47, 'rgba(255, 255, 255, 0.14)');
    sideGrad.addColorStop(0.5, 'rgba(255, 255, 230, 0.28)');
    sideGrad.addColorStop(0.54, 'rgba(20, 45, 5, 0.22)');
    sideGrad.addColorStop(1, 'rgba(20, 45, 5, 0.30)');
    ctx.fillStyle = sideGrad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return markShared(tex);
}

function createBananaDeckTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const rad = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
    rad.addColorStop(0, '#5a8f14');
    rad.addColorStop(0.65, '#6ca81b');
    rad.addColorStop(0.92, '#7cb824');
    rad.addColorStop(1, '#4f7f10');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(217, 249, 157, 0.16)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 36; i++) {
      const ang = (i * Math.PI * 2) / 36;
      ctx.beginPath();
      ctx.moveTo(128, 128);
      ctx.lineTo(128 + Math.cos(ang) * 126, 128 + Math.sin(ang) * 126);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return markShared(tex);
}

function createLotusPetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 128, 0, 0);
    grad.addColorStop(0.0, '#fff7e8');
    grad.addColorStop(0.32, '#fde8d7');
    grad.addColorStop(0.62, '#f9a8d4');
    grad.addColorStop(0.88, '#ec5b8c');
    grad.addColorStop(1.0, '#db2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    for (let x = 14; x < 120; x += 11) {
      ctx.beginPath();
      ctx.moveTo(64 + (x - 64) * 0.4, 128);
      ctx.quadraticCurveTo(x, 64, 64 + (x - 64) * 0.25, 0);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return markShared(tex);
}

function createMarigoldPetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 64, 0, 0);
    grad.addColorStop(0, '#c2410c');
    grad.addColorStop(0.45, '#f97316');
    grad.addColorStop(0.85, '#f59e0b');
    grad.addColorStop(1, '#fbbf24');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return markShared(tex);
}

function createPetalBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 64; i += 4) {
      ctx.fillStyle = i % 8 === 0 ? '#949494' : '#6e6e6e';
      ctx.fillRect(i, 0, 2, 64);
    }
  }
  return markShared(new THREE.CanvasTexture(canvas));
}

function createCoconutTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 220; i++) {
      const y = (i * 17) % 128;
      const x = (i * 37) % 128;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(35, 18, 8, 0.45)' : 'rgba(176, 137, 104, 0.25)';
      ctx.fillRect(x, y, 16, 1.5);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return markShared(tex);
}

function createBreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.55, '#d97706');
    grad.addColorStop(1, '#78350f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 251, 235, 0.14)' : 'rgba(120, 53, 15, 0.18)';
      ctx.beginPath();
      ctx.arc((i * 29) % 128, (i * 43) % 128, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return markShared(tex);
}

function createFoldedGliebGeometry(): THREE.BufferGeometry {
  // รูปทรงกลีบใบตองพับจีบตั้งอวบ 3 มิติ (ปลายยอดตั้งตรง โคนป่องรับแสง + สันพับกลางคมชัดแบบภาพตัวอย่าง)
  const cols = 4;
  const rows = 4;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rows; r++) {
    const v = r / rows; // 0 = base, 1 = pointed tip
    const y = v * 0.38;
    const widthCurve = Math.sin(Math.min(1, v * 0.92 + 0.14) * Math.PI) * (1 - v * 0.25);
    const halfW = 0.165 * Math.max(0.05, widthCurve);
    // โค้งเข้าด้านในเล็กน้อยช่วงปลายยอดเพื่อให้กลีบโอบทรงถ้วยกระทง
    const archZ = Math.sin(v * Math.PI) * 0.048 - v * v * 0.032;

    for (let c = 0; c <= cols; c++) {
      const u = c / cols; // 0 .. 1
      const xFrac = u * 2 - 1; // -1 .. +1
      const x = xFrac * halfW;
      // สันพับกลางแหลม (|xFrac| == 0 นูนมาด้านหน้า z)
      const foldRidge = (1 - Math.abs(xFrac)) * 0.068 * (1 - v * 0.45);
      const z = archZ + foldRidge;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = cols + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * stride + c;
      const b = a + 1;
      const d = (r + 1) * stride + c;
      const e = d + 1;
      indices.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return markShared(geo);
}

function createCuppedPetalGeometry(): THREE.BufferGeometry {
  // กลีบดอกบัว/กุหลาบโค้งเว้าเป็นช้อนอวบอิ่ม (UV.y 0 โคน -> 1 ปลายกลีบ)
  const cols = 4;
  const rows = 5;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    const y = v * 0.34;
    const widthProfile = Math.sin(Math.pow(v, 0.72) * Math.PI) * 0.145 + (1 - v) * 0.025;
    // โค้งหุบปลายกลีบเข้าด้านในเหมือนกลีบดอกบัวตูมจริง
    const cupVertical = Math.sin(v * Math.PI * 0.92) * 0.065;

    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const xFrac = u * 2 - 1;
      const x = xFrac * widthProfile;
      const cupSide = (xFrac * xFrac - 0.5) * 0.042 * Math.sin(v * Math.PI);
      const z = cupVertical - cupSide;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = cols + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * stride + c;
      const b = a + 1;
      const d = (r + 1) * stride + c;
      const e = d + 1;
      indices.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return markShared(geo);
}

function createRufflePetalGeometry(): THREE.BufferGeometry {
  // กลีบดอกดาวเรืองทรงพัดหยักเป็นลอนฟู
  const cols = 4;
  const rows = 3;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    const y = v * 0.11;
    const halfW = 0.014 + v * 0.056;
    const ruffleWave = v > 0.4 ? Math.sin(v * 6.0) * 0.008 : 0;

    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const xFrac = u * 2 - 1;
      const x = xFrac * halfW;
      const edgeRipple = Math.cos(xFrac * Math.PI * 2.5) * 0.012 * v;
      const z = Math.sin(v * Math.PI * 0.7) * 0.024 + edgeRipple + ruffleWave;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = cols + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * stride + c;
      const b = a + 1;
      const d = (r + 1) * stride + c;
      const e = d + 1;
      indices.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return markShared(geo);
}

function createHeartGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.08);
  shape.bezierCurveTo(0, 0.22, -0.22, 0.26, -0.24, 0.08);
  shape.bezierCurveTo(-0.26, -0.08, -0.06, -0.20, 0, -0.28);
  shape.bezierCurveTo(0.06, -0.20, 0.26, -0.08, 0.24, 0.08);
  shape.bezierCurveTo(0.22, 0.26, 0, 0.22, 0, 0.08);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.028,
    bevelSegments: 2,
    curveSegments: 10
  });
  geo.center();
  return markShared(geo);
}

function createPumpkinRibGeometry(): THREE.BufferGeometry {
  // 1 กลีบหลังคาโค้งทรงเรเดียลของตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (ทรงจริงรอบวง 360° + ซุ้มโค้งเว้าลึก)
  const radialSteps = 10;
  const arcSteps = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ri = 0; ri <= radialSteps; ri++) {
    const u = ri / radialSteps; // 0 (วงแหวนกลาง) -> 1 (ชายคารอบนอก)
    const z = 0.095 + u * (0.54 - 0.095);
    const halfW = 0.022 + u * (0.102 - 0.022);

    const crestBase = 0.25 + Math.sin(u * Math.PI * 0.85) * 0.055;
    const crestNoseDrop = u > 0.74 ? Math.pow((u - 0.74) / 0.26, 1.8) * 0.105 : 0;
    const yCrest = crestBase - crestNoseDrop;

    const innerRoofValley = 0.21 + u * 0.025;
    const outerPierDrop = u > 0.68 ? Math.pow((u - 0.68) / 0.32, 1.35) * 0.193 : 0;
    const yValley = Math.max(0.042, innerRoofValley - outerPierDrop);

    for (let ai = 0; ai <= arcSteps; ai++) {
      const frac = ai / arcSteps;
      const theta = (frac - 0.5) * Math.PI;
      const x = Math.sin(theta) * halfW;
      const archProfile = Math.cos(theta);
      const y = yValley + (yCrest - yValley) * Math.pow(archProfile, 0.72);
      const zOut = z + archProfile * 0.022 * Math.sin(u * Math.PI);
      positions.push(x, y, zOut);
      uvs.push(frac, u);
    }
  }

  const stride = arcSteps + 1;
  for (let ri = 0; ri < radialSteps; ri++) {
    for (let ai = 0; ai < arcSteps; ai++) {
      const a = ri * stride + ai;
      const b = a + 1;
      const d = (ri + 1) * stride + ai;
      const e = d + 1;
      indices.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return markShared(geo);
}

function getSharedAssets(): SharedAssets {
  if (cachedAssets) return cachedAssets;
  const jasmineBudGeo = new THREE.SphereGeometry(0.03, 7, 6);
  jasmineBudGeo.scale(0.86, 1.4, 0.86);

  cachedAssets = {
    bananaTrunkTex: createBananaTrunkTexture(),
    bananaGliebTex: createBananaGliebTexture(),
    bananaDeckTex: createBananaDeckTexture(),
    lotusPetalTex: createLotusPetalTexture(),
    marigoldPetalTex: createMarigoldPetalTexture(),
    petalBump: createPetalBumpTexture(),
    coconutTex: createCoconutTexture(),
    breadTex: createBreadTexture(),
    foldedGliebGeo: createFoldedGliebGeometry(),
    cuppedPetalGeo: createCuppedPetalGeometry(),
    rufflePetalGeo: createRufflePetalGeometry(),
    pumpkinRibGeo: createPumpkinRibGeometry(),
    jasmineBudGeo: markShared(jasmineBudGeo),
    baseCupGeo: markShared(new THREE.CylinderGeometry(0.91, 0.82, 0.24, 28)),
    waistBandGeo: markShared(new THREE.TorusGeometry(0.89, 0.022, 8, 32)),
    deckPadGeo: markShared(new THREE.CylinderGeometry(0.79, 0.80, 0.06, 28)),
    candleStickGeo: markShared(new THREE.CylinderGeometry(0.064, 0.072, 0.40, 14)),
    flameOuterGeo: markShared(new THREE.ConeGeometry(0.052, 0.16, 8)),
    flameInnerGeo: markShared(new THREE.ConeGeometry(0.025, 0.09, 6)),
    coconutBowlGeo: markShared(new THREE.SphereGeometry(0.90, 24, 14, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5)),
    breadBunGeo: markShared(new THREE.SphereGeometry(0.18, 10, 8)),
    incenseStemGeo: markShared(new THREE.CylinderGeometry(0.011, 0.012, 0.64, 6)),
    incenseTipGeo: markShared(new THREE.SphereGeometry(0.016, 6, 6)),
    heartGeo: createHeartGeometry(),
    haloGeo: markShared(new THREE.RingGeometry(1.08, 1.18, 44)),
    rippleRingGeo: markShared(new THREE.RingGeometry(0.94, 0.995, 40))
  };
  return cachedAssets;
}

const BASE_PALETTES: Record<
  string,
  {
    rimBody: number;
    waist: number;
    outerHex: number;
    innerHex: number;
    deckTint: number;
    metal?: number;
    opacity?: number;
  }
> = {
  banana_leaf: {
    rimBody: 0xffffff,
    waist: 0x98ab2b,
    outerHex: 0xf4fce3,
    innerHex: 0xffffff,
    deckTint: 0xffffff
  },
  banana_gold: {
    rimBody: 0x064e3b,
    waist: 0xfbbf24,
    outerHex: 0x10b981,
    innerHex: 0x34d399,
    deckTint: 0x6ee7b7,
    metal: 0.35
  },
  lotus: {
    rimBody: 0xffffff,
    waist: 0xb0c238,
    outerHex: 0xffe4ec,
    innerHex: 0xffffff,
    deckTint: 0xffffff
  },
  lotus_crystal: {
    rimBody: 0x0ea5e9,
    waist: 0xe0f2fe,
    outerHex: 0x7dd3fc,
    innerHex: 0xe0f2fe,
    deckTint: 0x7dd3fc,
    metal: 0.22,
    opacity: 0.88
  },
  coconut: {
    rimBody: 0x5c3a21,
    waist: 0xfbbf24,
    outerHex: 0x99582a,
    innerHex: 0xb08968,
    deckTint: 0xd9f99d
  },
  bread: {
    rimBody: 0xd97706,
    waist: 0xfef08a,
    outerHex: 0xfbbf24,
    innerHex: 0xfde68a,
    deckTint: 0xfef08a
  },
  ice_swan: {
    rimBody: 0x0284c7,
    waist: 0xffffff,
    outerHex: 0xbae6fd,
    innerHex: 0xf0f9ff,
    deckTint: 0xe0f2fe,
    metal: 0.18,
    opacity: 0.91
  },
  peacock_royal: {
    rimBody: 0x713f12,
    waist: 0xfde047,
    outerHex: 0xeab308,
    innerHex: 0xfef08a,
    deckTint: 0xa3e635,
    metal: 0.42
  }
};

function resolveBaseKey(raw: string): string {
  const alias: Record<string, string> = {
    'banana-classic': 'banana_leaf',
    'lotus-pink': 'lotus',
    'lotus-gold': 'banana_gold',
    'coconut-shell': 'coconut',
    'ice-swan': 'ice_swan',
    'bread-eco': 'bread'
  };
  return BASE_PALETTES[raw] ? raw : alias[raw] || 'banana_leaf';
}

const FLOWER_PALETTES: Record<string, { outer: number; inner: number; core: number }> = {
  marigold: { outer: 0xf59e0b, inner: 0xfbbf24, core: 0xc2410c },
  lotus_flower: { outer: 0xf43f5e, inner: 0xf9a8d4, core: 0xfef08a },
  lotus: { outer: 0xf43f5e, inner: 0xf9a8d4, core: 0xfef08a },
  orchid: { outer: 0x9333ea, inner: 0xd8b4fe, core: 0xfef08a },
  jasmine: { outer: 0xfefce8, inner: 0xffffff, core: 0xfde047 },
  rose: { outer: 0xbe123c, inner: 0xfb7185, core: 0xffe4e6 },
  dok_kem: { outer: 0xea580c, inner: 0xfb923c, core: 0xfef08a },
  anchan: { outer: 0x4338ca, inner: 0x818cf8, core: 0xe0e7ff },
  mixed_garland: { outer: 0xf43f5e, inner: 0xfbbf24, core: 0xfef08a },
  'mixed-thai': { outer: 0xf43f5e, inner: 0xfbbf24, core: 0xfef08a }
};

const MIXED_BLOSSOM_COLORS = [
  { outer: 0xf59e0b, inner: 0xfde047 },
  { outer: 0xe11d48, inner: 0xfb7185 },
  { outer: 0x9333ea, inner: 0xd8b4fe },
  { outer: 0xf97316, inner: 0xfdba74 },
  { outer: 0xffffff, inner: 0xfef9c3 }
];

const CANDLE_PALETTES: Record<string, { wax: number; flame: number; glow: number }> = {
  yellow: { wax: 0xfcf6dc, flame: 0xf59e0b, glow: 0xfbbf24 },
  'yellow-classic': { wax: 0xfcf6dc, flame: 0xf59e0b, glow: 0xfbbf24 },
  red: { wax: 0xfca5a5, flame: 0xef4444, glow: 0xf87171 },
  orange: { wax: 0xfdba74, flame: 0xea580c, glow: 0xfb923c },
  cyan: { wax: 0xbae6fd, flame: 0x38bdf8, glow: 0x7dd3fc },
  pink: { wax: 0xfbcfe8, flame: 0xec4899, glow: 0xf472b6 },
  'scented-pink': { wax: 0xfbcfe8, flame: 0xec4899, glow: 0xf472b6 },
  emerald: { wax: 0xa7f3d0, flame: 0x10b981, glow: 0x34d399 },
  purple: { wax: 0xe9d5ff, flame: 0xa855f7, glow: 0xc084fc },
  rainbow: { wax: 0xfbcfe8, flame: 0xfde047, glow: 0xfbbf24 },
  'gold-glitter': { wax: 0xfef08a, flame: 0xf59e0b, glow: 0xfde047 },
  'twin-fortune': { wax: 0xfbcfe8, flame: 0xfde047, glow: 0xfbbf24 },
  'led-warm': { wax: 0xfef9c3, flame: 0xfacc15, glow: 0xfef08a }
};

const CENTERPIECE_MODELS = new Set([
  'pumpkin',
  'noppamas_crown',
  'elephant_gold',
  'golden_swan',
  'lotus_lamp',
  'gold_pagoda',
  'royal_barge',
  'crystal_heart'
]);

const sharedMatCache = new Map<string, THREE.MeshStandardMaterial>();
const sharedGeoCache = new Map<string, THREE.BufferGeometry>();

function getCachedGeo<T extends THREE.BufferGeometry>(key: string, factory: () => T): T {
  let geo = sharedGeoCache.get(key) as T | undefined;
  if (!geo) {
    geo = markShared(factory());
    sharedGeoCache.set(key, geo);
  }
  return geo;
}

function makeMat(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  const key = [
    params.color ?? 0xffffff,
    params.map?.uuid ?? '',
    params.bumpMap?.uuid ?? '',
    params.bumpScale ?? '',
    params.roughness ?? 0.48,
    params.metalness ?? 0.06,
    params.emissive ?? 0x000000,
    params.emissiveIntensity ?? 1,
    params.transparent ? 1 : 0,
    params.opacity ?? 1,
    params.side ?? THREE.FrontSide
  ].join('|');

  const cached = sharedMatCache.get(key);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.48,
    metalness: 0.06,
    ...params
  });
  mat.userData.shared = true;
  sharedMatCache.set(key, mat);
  return mat;
}

// =========================================================================
// Instanced Floral Helpers (ภาพตัวอย่างที่ 2: บัวตูมชมพู + ดาวเรืองฟู + มะลิ)
// =========================================================================

function addLotusBudInstanced(
  parent: THREE.Group,
  assets: SharedAssets,
  pos: [number, number, number],
  scale = 1
): void {
  const petalMat = makeMat({
    color: 0xffffff,
    map: assets.lotusPetalTex,
    roughness: 0.36,
    side: THREE.DoubleSide
  });

  const tiers = [
    { count: 6, r: 0.085, y: 0.0, tilt: 0.04, sX: 1.05, sY: 0.92 },
    { count: 5, r: 0.056, y: 0.02, tilt: -0.14, sX: 0.95, sY: 0.98 },
    { count: 5, r: 0.028, y: 0.036, tilt: -0.28, sX: 0.84, sY: 1.04 }
  ];
  const total = tiers.reduce((acc, t) => acc + t.count, 0);
  const inst = new THREE.InstancedMesh(assets.cuppedPetalGeo, petalMat, total);

  const dummy = new THREE.Object3D();
  const cObj = new THREE.Color();
  let idx = 0;

  tiers.forEach((t, tIdx) => {
    for (let i = 0; i < t.count; i++) {
      const ang = (i * Math.PI * 2) / t.count + tIdx * 0.52;
      dummy.position.set(
        pos[0] + Math.cos(ang) * t.r * scale,
        pos[1] + t.y * scale,
        pos[2] + Math.sin(ang) * t.r * scale
      );
      dummy.rotation.order = 'YXZ';
      dummy.rotation.y = -ang + Math.PI / 2;
      dummy.rotation.x = t.tilt;
      dummy.scale.set(t.sX * scale, t.sY * scale, t.sX * scale);
      dummy.updateMatrix();
      inst.setMatrixAt(idx, dummy.matrix);

      cObj.setHex(tIdx === 0 ? 0xffeef4 : tIdx === 1 ? 0xfff5f8 : 0xffffff);
      inst.setColorAt(idx, cObj);
      idx++;
    }
  });
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  parent.add(inst);
}

function addMarigoldsInstanced(
  parent: THREE.Group,
  assets: SharedAssets,
  centers: { pos: [number, number, number]; scale: number; outerHex?: number; midHex?: number; coreHex?: number }[]
): void {
  // แต่ละพุ่มดาวเรืองประกอบด้วย 34 กลีบหยักฟูเรียงสลับ 4 ชั้น
  const rings = [
    { count: 12, r: 0.145, tilt: 0.92, y: 0.015, s: 1.08, tier: 0 },
    { count: 10, r: 0.098, tilt: 0.65, y: 0.04, s: 0.94, tier: 1 },
    { count: 7, r: 0.054, tilt: 0.42, y: 0.068, s: 0.78, tier: 2 },
    { count: 5, r: 0.022, tilt: 0.2, y: 0.085, s: 0.62, tier: 2 }
  ];
  const perFlower = rings.reduce((a, b) => a + b.count, 0);
  const total = perFlower * centers.length;

  const mat = makeMat({
    color: 0xffffff,
    map: assets.marigoldPetalTex,
    roughness: 0.42,
    side: THREE.DoubleSide
  });
  const inst = new THREE.InstancedMesh(assets.rufflePetalGeo, mat, total);

  const dummy = new THREE.Object3D();
  const cObj = new THREE.Color();
  let idx = 0;

  centers.forEach((f) => {
    const outerCol = f.outerHex ?? 0xfbbf24;
    const midCol = f.midHex ?? 0xf59e0b;
    const coreCol = f.coreHex ?? 0xc2410c;

    rings.forEach((rg, rIdx) => {
      for (let i = 0; i < rg.count; i++) {
        const ang = (i * Math.PI * 2) / rg.count + rIdx * 0.47;
        dummy.position.set(
          f.pos[0] + Math.cos(ang) * rg.r * f.scale,
          f.pos[1] + rg.y * f.scale,
          f.pos[2] + Math.sin(ang) * rg.r * f.scale
        );
        dummy.rotation.order = 'YXZ';
        dummy.rotation.y = -ang + Math.PI / 2;
        dummy.rotation.x = rg.tilt;
        dummy.scale.setScalar(rg.s * f.scale * 1.15);
        dummy.updateMatrix();
        inst.setMatrixAt(idx, dummy.matrix);

        cObj.setHex(rg.tier === 0 ? outerCol : rg.tier === 1 ? midCol : coreCol);
        inst.setColorAt(idx, cObj);
        idx++;
      }
    });
  });

  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  parent.add(inst);
}

function addJasmineClustersInstanced(
  parent: THREE.Group,
  assets: SharedAssets,
  clusterPositions: [number, number, number][],
  tintHex = 0xfffdf2
): void {
  const budsPerCluster = 9;
  const total = clusterPositions.length * budsPerCluster;
  const mat = makeMat({ color: 0xffffff, roughness: 0.34 });
  const inst = new THREE.InstancedMesh(assets.jasmineBudGeo, mat, total);

  const dummy = new THREE.Object3D();
  const cObj = new THREE.Color(tintHex);
  const altObj = new THREE.Color(0xfef3c7);
  let idx = 0;

  clusterPositions.forEach((cp) => {
    for (let i = 0; i < budsPerCluster; i++) {
      const ang = (i * Math.PI * 2) / budsPerCluster;
      const dist = i === 0 ? 0 : 0.048 + (i % 2) * 0.022;
      dummy.position.set(
        cp[0] + Math.cos(ang) * dist,
        cp[1] + (i === 0 ? 0.04 : 0.02),
        cp[2] + Math.sin(ang) * dist
      );
      dummy.rotation.set((i % 3) * 0.32 - 0.3, ang, (i % 2) * 0.28 - 0.14);
      dummy.scale.setScalar(0.85 + (i % 3) * 0.12);
      dummy.updateMatrix();
      inst.setMatrixAt(idx, dummy.matrix);
      inst.setColorAt(idx, i === 0 ? altObj : cObj);
      idx++;
    }
  });

  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  parent.add(inst);
}

// =========================================================================
// 8 Centerpiece 3D Landmarks & Models (คงครบทั้ง 8 แบบรองรับปรับสเกล)
// =========================================================================

function addCurvedSwanPair(parent: THREE.Group, matBody: THREE.Material, matBeak: THREE.Material): void {
  const matEye = makeMat({ color: 0x1c130b, roughness: 0.25 });
  const headGeo = getCachedGeo('swan_head', () => new THREE.SphereGeometry(0.068, 8, 6));
  const beakGeo = getCachedGeo('swan_beak', () => new THREE.ConeGeometry(0.025, 0.09, 6));
  const eyeGeo = getCachedGeo('swan_eye', () => new THREE.SphereGeometry(0.014, 5, 5));
  const wingGeo = getCachedGeo('swan_wing', () => new THREE.SphereGeometry(0.16, 8, 6));

  [-1, 1].forEach((side) => {
    const neckGeo = getCachedGeo(`swan_neck_${side}`, () => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.72, 0.16, 0.08),
        new THREE.Vector3(side * 0.94, 0.34, 0.04),
        new THREE.Vector3(side * 0.88, 0.58, -0.02),
        new THREE.Vector3(side * 0.72, 0.56, 0.02)
      ]);
      return new THREE.TubeGeometry(curve, 10, 0.055, 6, false);
    });
    parent.add(new THREE.Mesh(neckGeo, matBody));

    const head = new THREE.Mesh(headGeo, matBody);
    head.position.set(side * 0.71, 0.56, 0.03);
    parent.add(head);

    const beak = new THREE.Mesh(beakGeo, matBeak);
    beak.rotation.z = side * (Math.PI * 0.58);
    beak.position.set(side * 0.63, 0.55, 0.03);
    parent.add(beak);

    const eye = new THREE.Mesh(eyeGeo, matEye);
    eye.position.set(side * 0.69, 0.575, 0.085);
    parent.add(eye);

    const wing = new THREE.Mesh(wingGeo, matBody);
    wing.scale.set(0.6, 0.85, 1.45);
    wing.rotation.z = side * -0.45;
    wing.position.set(side * 0.76, 0.21, -0.06);
    parent.add(wing);
  });
}

function buildPumpkinBuilding3D(scaleFactor = 1): THREE.Group {
  // ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. ทรงกลีบเรเดียล 360° 16 กลีบ สีขาวครีมอุ่น + ช่องทางเดินเข้ากลาง + ซุ้มโค้งเว้าลึกตามภาพจริง
  const g = new THREE.Group();
  const assets = getSharedAssets();

  const matStonePlinth = makeMat({ color: 0xc8b9a3, roughness: 0.72, metalness: 0.04 });
  const matInnerHall = makeMat({
    color: 0x1b1511,
    emissive: 0x5c2d0c,
    emissiveIntensity: 0.28,
    roughness: 0.72
  });
  const matShell = makeMat({
    color: 0xffffff,
    roughness: 0.52,
    metalness: 0.04,
    emissive: 0x3b2a14,
    emissiveIntensity: 0.06,
    side: THREE.DoubleSide
  });
  const matCanopy = makeMat({ color: 0xf7f1e5, roughness: 0.48, metalness: 0.05 });

  // 1. ฐานลานวงกลมรับตึกฟักทอง
  const plinth = new THREE.Mesh(
    getCachedGeo('pk_plinth', () => new THREE.CylinderGeometry(0.56, 0.59, 0.042, 24)),
    matStonePlinth
  );
  plinth.position.y = 0.021;
  g.add(plinth);

  // 2. ผนังกระจกโถงมืดชั้นในใต้ซุ้มโค้ง (มองเห็นลอดเข้าซุ้มโค้งรอบอาคาร)
  const innerHall = new THREE.Mesh(
    getCachedGeo('pk_hall', () => new THREE.CylinderGeometry(0.45, 0.46, 0.19, 20)),
    matInnerHall
  );
  innerHall.position.y = 0.135;
  g.add(innerHall);

  // 3. หลังคากลีบฟักทองเรเดียล 15 กลีบ (เว้นช่องที่ 0 ไว้เป็นซุ้มทางเดินเข้าด้านหน้า = 16 ช่องรอบวง 360°)
  const totalSlots = 16;
  const openSlot = 0;
  const angBase = 0.18;
  const ribInst = new THREE.InstancedMesh(assets.pumpkinRibGeo, matShell, totalSlots - 1);
  const dummy = new THREE.Object3D();
  const cObj = new THREE.Color();
  let rIdx = 0;

  for (let i = 0; i < totalSlots; i++) {
    if (i === openSlot) continue;
    const ang = angBase + (i * Math.PI * 2) / totalSlots;
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, ang, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    ribInst.setMatrixAt(rIdx, dummy.matrix);
    cObj.setHex(i % 2 === 0 ? 0xf7f1e5 : 0xf0e7d6);
    ribInst.setColorAt(rIdx, cObj);
    rIdx++;
  }
  ribInst.instanceMatrix.needsUpdate = true;
  if (ribInst.instanceColor) ribInst.instanceColor.needsUpdate = true;
  g.add(ribInst);

  // 4. วงแหวน Skylight กึ่งกลางหลังคา
  const skylightCore = new THREE.Mesh(
    getCachedGeo('pk_sky_core', () => new THREE.CylinderGeometry(0.095, 0.095, 0.06, 16)),
    matInnerHall
  );
  skylightCore.position.y = 0.24;
  g.add(skylightCore);

  const skylightRim = new THREE.Mesh(
    getCachedGeo('pk_sky_rim', () => new THREE.TorusGeometry(0.10, 0.012, 6, 18)),
    matCanopy
  );
  skylightRim.rotation.x = Math.PI / 2;
  skylightRim.position.y = 0.255;
  g.add(skylightRim);

  // 5. ช่องทางเดินเข้ากลาง + หลังคาแผ่นเรียบด้านหน้า (สอดรับกับช่องเปิดที่เว้นไว้ตามภาพถ่ายมุมสูง)
  const entranceGroup = new THREE.Group();
  entranceGroup.rotation.y = angBase;

  const doorway = new THREE.Mesh(
    getCachedGeo('pk_door', () => new THREE.BoxGeometry(0.095, 0.13, 0.15)),
    matInnerHall
  );
  doorway.position.set(0, 0.105, 0.36);
  entranceGroup.add(doorway);

  const canopy = new THREE.Mesh(
    getCachedGeo('pk_canopy', () => new THREE.BoxGeometry(0.10, 0.018, 0.16)),
    matCanopy
  );
  canopy.position.set(0, 0.175, 0.44);
  entranceGroup.add(canopy);

  const walkway = new THREE.Mesh(
    getCachedGeo('pk_walk', () => new THREE.BoxGeometry(0.11, 0.01, 0.26)),
    matStonePlinth
  );
  walkway.position.set(0, 0.047, 0.45);
  entranceGroup.add(walkway);

  g.add(entranceGroup);

  g.scale.setScalar(scaleFactor);
  return g;
}

function buildNoppamasCrown3D(): THREE.Group {
  const g = new THREE.Group();
  const matGold = makeMat({ color: 0xfbbf24, metalness: 0.55, roughness: 0.28 });
  const matBronze = makeMat({ color: 0xb45309, metalness: 0.45, roughness: 0.35 });
  const matRuby = makeMat({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.3, roughness: 0.2 });

  const pedGeo = getCachedGeo('crown_ped', () =>
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.01, 0),
        new THREE.Vector2(0.26, 0),
        new THREE.Vector2(0.14, 0.08),
        new THREE.Vector2(0.32, 0.16),
        new THREE.Vector2(0.30, 0.19),
        new THREE.Vector2(0.01, 0.19)
      ],
      14
    )
  );
  g.add(new THREE.Mesh(pedGeo, matBronze));

  const band = new THREE.Mesh(
    getCachedGeo('crown_band', () => new THREE.CylinderGeometry(0.24, 0.26, 0.14, 12)),
    matGold
  );
  band.position.y = 0.25;
  g.add(band);

  for (let tier = 0; tier < 3; tier++) {
    const rBot = 0.22 - tier * 0.05;
    const cone = new THREE.Mesh(
      getCachedGeo(`crown_tier_${tier}`, () => new THREE.CylinderGeometry(rBot - 0.045, rBot, 0.11, 12)),
      matGold
    );
    cone.position.y = 0.37 + tier * 0.11;
    g.add(cone);
  }

  const spire = new THREE.Mesh(
    getCachedGeo('crown_spire', () => new THREE.ConeGeometry(0.06, 0.28, 10)),
    matGold
  );
  spire.position.y = 0.78;
  g.add(spire);

  const jewel = new THREE.Mesh(
    getCachedGeo('crown_jewel', () => new THREE.SphereGeometry(0.042, 7, 6)),
    matRuby
  );
  jewel.position.set(0, 0.27, 0.25);
  g.add(jewel);
  return g;
}

function buildElephant3D(): THREE.Group {
  const g = new THREE.Group();
  const matIvory = makeMat({ color: 0xfffbeb, roughness: 0.4 });
  const matGold = makeMat({ color: 0xfde047, metalness: 0.45, roughness: 0.3 });
  const matRed = makeMat({ color: 0xdc2626, roughness: 0.55 });
  const matBronze = makeMat({ color: 0x92400e, metalness: 0.3, roughness: 0.45 });

  const ped = new THREE.Mesh(
    getCachedGeo('el_ped', () => new THREE.BoxGeometry(0.68, 0.09, 0.42)),
    matBronze
  );
  ped.position.y = 0.045;
  g.add(ped);

  const body = new THREE.Mesh(
    getCachedGeo('el_body', () => new THREE.SphereGeometry(0.22, 12, 8)),
    matIvory
  );
  body.scale.set(1.35, 0.95, 0.9);
  body.position.set(-0.04, 0.31, 0);
  g.add(body);

  const legGeo = getCachedGeo('el_leg', () => new THREE.CylinderGeometry(0.055, 0.06, 0.24, 7));
  [[-0.18, -0.1], [-0.18, 0.1], [0.12, -0.1], [0.12, 0.1]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, matIvory);
    leg.position.set(lx, 0.18, lz);
    g.add(leg);
  });

  const blanket = new THREE.Mesh(
    getCachedGeo('el_blanket', () => new THREE.BoxGeometry(0.32, 0.22, 0.4)),
    matRed
  );
  blanket.position.set(-0.04, 0.35, 0);
  g.add(blanket);

  const head = new THREE.Mesh(
    getCachedGeo('el_head', () => new THREE.SphereGeometry(0.145, 10, 8)),
    matIvory
  );
  head.position.set(0.25, 0.38, 0);
  g.add(head);

  const crown = new THREE.Mesh(
    getCachedGeo('el_crown', () => new THREE.ConeGeometry(0.07, 0.14, 8)),
    matGold
  );
  crown.position.set(0.25, 0.55, 0);
  g.add(crown);

  const trunkGeo = getCachedGeo('el_trunk', () => {
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.35, 0.34, 0),
      new THREE.Vector3(0.46, 0.32, 0),
      new THREE.Vector3(0.50, 0.44, 0),
      new THREE.Vector3(0.42, 0.52, 0)
    ]);
    return new THREE.TubeGeometry(trunkCurve, 8, 0.036, 6, false);
  });
  g.add(new THREE.Mesh(trunkGeo, matIvory));
  return g;
}

function buildGoldenSwanCenter3D(): THREE.Group {
  const g = new THREE.Group();
  const matGold = makeMat({ color: 0xfbbf24, metalness: 0.55, roughness: 0.28 });
  const matBronze = makeMat({ color: 0x92400e, metalness: 0.35, roughness: 0.4 });
  const matBeak = makeMat({ color: 0xea580c, roughness: 0.35 });
  const matOrb = makeMat({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.65, roughness: 0.15 });

  const ped = new THREE.Mesh(
    getCachedGeo('gswan_ped', () => new THREE.CylinderGeometry(0.46, 0.5, 0.08, 16)),
    matBronze
  );
  ped.position.y = 0.04;
  g.add(ped);

  const swansWrap = new THREE.Group();
  swansWrap.scale.setScalar(0.54);
  addCurvedSwanPair(swansWrap, matGold, matBeak);
  g.add(swansWrap);

  const orb = new THREE.Mesh(
    getCachedGeo('gswan_orb', () => new THREE.SphereGeometry(0.11, 10, 8)),
    matOrb
  );
  orb.position.y = 0.25;
  g.add(orb);
  return g;
}

function buildLotusLamp3D(assets: SharedAssets): THREE.Group {
  const g = new THREE.Group();
  const matLeaf = makeMat({ color: 0x15803d, roughness: 0.5 });
  const matPetal = makeMat({ color: 0xffffff, map: assets.lotusPetalTex, transparent: true, opacity: 0.9, roughness: 0.2, side: THREE.DoubleSide });
  const matCore = makeMat({ color: 0xfef08a, emissive: 0xfbbf24, emissiveIntensity: 0.85, roughness: 0.15 });

  const basePad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.07, 20), matLeaf);
  basePad.position.y = 0.035;
  g.add(basePad);

  const inst = new THREE.InstancedMesh(assets.cuppedPetalGeo, matPetal, 14);
  const dummy = new THREE.Object3D();
  const cObj = new THREE.Color(0xffffff);
  let idx = 0;

  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI * 2) / 8;
    dummy.position.set(Math.cos(ang) * 0.22, 0.08, Math.sin(ang) * 0.22);
    dummy.rotation.order = 'YXZ';
    dummy.rotation.y = -ang + Math.PI / 2;
    dummy.rotation.x = 0.45;
    dummy.scale.setScalar(1.0);
    dummy.updateMatrix();
    inst.setMatrixAt(idx, dummy.matrix);
    cObj.setHex(0xfbcfe8);
    inst.setColorAt(idx, cObj);
    idx++;
  }
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI * 2) / 6 + 0.35;
    dummy.position.set(Math.cos(ang) * 0.12, 0.11, Math.sin(ang) * 0.12);
    dummy.rotation.order = 'YXZ';
    dummy.rotation.y = -ang + Math.PI / 2;
    dummy.rotation.x = 0.2;
    dummy.scale.setScalar(0.85);
    dummy.updateMatrix();
    inst.setMatrixAt(idx, dummy.matrix);
    cObj.setHex(0xffffff);
    inst.setColorAt(idx, cObj);
    idx++;
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  g.add(inst);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), matCore);
  bulb.position.y = 0.22;
  g.add(bulb);
  return g;
}

function buildGoldPagoda3D(): THREE.Group {
  const g = new THREE.Group();
  const matGold = makeMat({ color: 0xfbbf24, metalness: 0.6, roughness: 0.26 });
  const matBronze = makeMat({ color: 0x92400e, metalness: 0.4, roughness: 0.4 });
  const matBright = makeMat({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.25, metalness: 0.5, roughness: 0.2 });

  const plinth1 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.68), matBronze);
  plinth1.position.y = 0.04;
  g.add(plinth1);

  const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 0.5), matGold);
  plinth2.position.y = 0.115;
  g.add(plinth2);

  const bellPoints = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.22, 0),
    new THREE.Vector2(0.21, 0.14),
    new THREE.Vector2(0.14, 0.26),
    new THREE.Vector2(0.07, 0.30),
    new THREE.Vector2(0.07, 0.36),
    new THREE.Vector2(0.01, 0.62)
  ];
  const chedi = new THREE.Mesh(new THREE.LatheGeometry(bellPoints, 16), matGold);
  chedi.position.y = 0.15;
  g.add(chedi);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), matBright);
  tip.position.y = 0.78;
  g.add(tip);
  return g;
}

function buildRoyalBarge3D(): THREE.Group {
  const g = new THREE.Group();
  const matGold = makeMat({ color: 0xfbbf24, metalness: 0.55, roughness: 0.28 });
  const matBronze = makeMat({ color: 0xb45309, metalness: 0.45, roughness: 0.35 });
  const matCrimson = makeMat({ color: 0x991b1b, roughness: 0.5 });

  const hullCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.56, 0.24, 0),
    new THREE.Vector3(-0.32, 0.08, 0),
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0.34, 0.08, 0),
    new THREE.Vector3(0.55, 0.26, 0)
  ]);
  const hull = new THREE.Mesh(new THREE.TubeGeometry(hullCurve, 16, 0.07, 8, false), matBronze);
  hull.scale.set(1, 0.85, 1.35);
  g.add(hull);

  const prowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.54, 0.22, 0),
    new THREE.Vector3(-0.62, 0.38, 0),
    new THREE.Vector3(-0.54, 0.48, 0),
    new THREE.Vector3(-0.46, 0.44, 0)
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(prowCurve, 10, 0.036, 7, false), matGold));

  const pavilion = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.18), matCrimson);
  pavilion.position.y = 0.16;
  g.add(pavilion);

  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 4), matGold);
  roof1.rotation.y = Math.PI / 4;
  roof1.position.y = 0.30;
  g.add(roof1);

  const roofSpire = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), matGold);
  roofSpire.position.y = 0.42;
  g.add(roofSpire);
  return g;
}

function buildCrystalHeartCenter3D(assets: SharedAssets): THREE.Group {
  const g = new THREE.Group();
  const matPillow = makeMat({ color: 0x9d174d, roughness: 0.55 });
  const matRim = makeMat({ color: 0xfde047, metalness: 0.55, roughness: 0.25 });
  const matCrystal = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    emissive: 0xbe185d,
    emissiveIntensity: 0.28,
    roughness: 0.14,
    metalness: 0.2,
    transparent: true,
    opacity: 0.92
  });

  const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10), matPillow);
  pillow.scale.set(1.15, 0.28, 0.9);
  pillow.position.y = 0.06;
  g.add(pillow);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 6, 24), matRim);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.07;
  g.add(ring);

  const heart = new THREE.Mesh(assets.heartGeo, matCrystal);
  heart.scale.setScalar(1.2);
  heart.position.y = 0.38;
  g.add(heart);
  return g;
}

function addAccessory3D(
  id: string,
  pos: [number, number, number],
  scale: number,
  parent: THREE.Group,
  assets: SharedAssets,
  anim: KrathongAnimHandles
): THREE.Group {
  const wrap = new THREE.Group();
  wrap.position.set(pos[0], pos[1], pos[2]);
  wrap.scale.setScalar(scale);

  const matGoldStick = makeMat({ color: 0xfbbf24, metalness: 0.45, roughness: 0.35 });
  const stickLongGeo = getCachedGeo('acc_stick_long', () => new THREE.CylinderGeometry(0.014, 0.014, 0.62, 6));
  const stickMidGeo = getCachedGeo('acc_stick_mid', () => new THREE.CylinderGeometry(0.014, 0.014, 0.34, 6));
  const stickShortGeo = getCachedGeo('acc_stick_short', () => new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6));

  if (id === 'sparkler') {
    const stick = new THREE.Mesh(stickLongGeo, matGoldStick);
    stick.position.y = 0.31;
    wrap.add(stick);

    const starGroup = new THREE.Group();
    starGroup.position.y = 0.63;
    const matSpark = makeMat({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 0.95,
      roughness: 0.2
    });
    starGroup.add(new THREE.Mesh(getCachedGeo('acc_spark_core', () => new THREE.SphereGeometry(0.045, 7, 6)), matSpark));
    const rayGeo = getCachedGeo('acc_spark_ray', () => new THREE.CylinderGeometry(0.008, 0.008, 0.28, 5));
    for (let i = 0; i < 4; i++) {
      const ray = new THREE.Mesh(rayGeo, matSpark);
      ray.rotation.z = (i * Math.PI) / 4;
      ray.rotation.x = (i % 2) * 0.4;
      starGroup.add(ray);
    }
    wrap.add(starGroup);
    anim.sparklers.push(starGroup);
  } else if (id === 'sky_lantern') {
    const cord = new THREE.Mesh(
      getCachedGeo('acc_lan_cord', () => new THREE.CylinderGeometry(0.006, 0.006, 0.46, 5)),
      makeMat({ color: 0xd97706, transparent: true, opacity: 0.65 })
    );
    cord.position.y = 0.23;
    wrap.add(cord);

    const lanternRoot = new THREE.Group();
    lanternRoot.position.y = 0.54;
    const body = new THREE.Mesh(
      getCachedGeo('acc_lan_body', () => new THREE.CylinderGeometry(0.11, 0.08, 0.24, 10)),
      makeMat({
        color: 0xfb923c,
        emissive: 0xf97316,
        emissiveIntensity: 0.65,
        roughness: 0.45
      })
    );
    lanternRoot.add(body);
    const flameDot = new THREE.Mesh(
      getCachedGeo('acc_lan_dot', () => new THREE.SphereGeometry(0.032, 6, 6)),
      makeMat({ color: 0xfffbeb, emissive: 0xfef08a, emissiveIntensity: 1.0 })
    );
    flameDot.position.y = -0.09;
    lanternRoot.add(flameDot);
    wrap.add(lanternRoot);
    anim.lanterns.push({ root: lanternRoot, baseY: 0.54 });
  } else if (id === 'heart_sign') {
    const stick = new THREE.Mesh(stickMidGeo, matGoldStick);
    stick.position.y = 0.17;
    wrap.add(stick);

    const heart = new THREE.Mesh(
      assets.heartGeo,
      makeMat({ color: 0xec4899, emissive: 0xbe185d, emissiveIntensity: 0.35, roughness: 0.2 })
    );
    heart.scale.setScalar(0.55);
    heart.position.y = 0.42;
    wrap.add(heart);
  } else if (id === 'grad_cap') {
    const stick = new THREE.Mesh(stickMidGeo, matGoldStick);
    stick.position.y = 0.17;
    wrap.add(stick);

    const matCap = makeMat({ color: 0x1c1917, roughness: 0.5 });
    const skull = new THREE.Mesh(getCachedGeo('acc_cap_skull', () => new THREE.CylinderGeometry(0.095, 0.1, 0.09, 10)), matCap);
    skull.position.y = 0.36;
    wrap.add(skull);

    const board = new THREE.Mesh(getCachedGeo('acc_cap_board', () => new THREE.BoxGeometry(0.28, 0.025, 0.28)), matCap);
    board.position.y = 0.41;
    board.rotation.y = Math.PI / 4;
    wrap.add(board);

    const tassel = new THREE.Mesh(getCachedGeo('acc_cap_tassel', () => new THREE.CylinderGeometry(0.012, 0.018, 0.14, 6)), matGoldStick);
    tassel.position.set(0.14, 0.35, 0.04);
    tassel.rotation.z = 0.2;
    wrap.add(tassel);
  } else if (id === 'lucky_coin') {
    const stick = new THREE.Mesh(stickMidGeo, matGoldStick);
    stick.position.y = 0.16;
    wrap.add(stick);

    const coin = new THREE.Mesh(
      getCachedGeo('acc_coin_disc', () => new THREE.CylinderGeometry(0.14, 0.14, 0.036, 14)),
      makeMat({ color: 0xf59e0b, metalness: 0.65, roughness: 0.25 })
    );
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 0.40;
    wrap.add(coin);

    const centerHole = new THREE.Mesh(
      getCachedGeo('acc_coin_hole', () => new THREE.BoxGeometry(0.09, 0.09, 0.046)),
      makeMat({ color: 0x451a03, roughness: 0.6 })
    );
    centerHole.position.y = 0.40;
    wrap.add(centerHole);
  } else if (id === 'flag_thai') {
    const pole = new THREE.Mesh(stickLongGeo, matGoldStick);
    pole.position.y = 0.32;
    wrap.add(pole);

    const flagGeo = getCachedGeo('acc_flag_tri', () => new THREE.ConeGeometry(0.055, 0.21, 3));
    const flagColors = [0xf43f5e, 0xfbbf24, 0x10b981];
    flagColors.forEach((col, i) => {
      const flag = new THREE.Mesh(
        flagGeo,
        makeMat({ color: col, emissive: col, emissiveIntensity: 0.18, roughness: 0.45 })
      );
      flag.rotation.z = -Math.PI / 2;
      flag.position.set(0.11, 0.56 - i * 0.12, 0);
      wrap.add(flag);
    });
  } else if (id === 'butterfly') {
    const bRoot = new THREE.Group();
    bRoot.position.y = 0.56;

    const body = new THREE.Mesh(getCachedGeo('acc_bf_body', () => new THREE.CylinderGeometry(0.014, 0.014, 0.14, 6)), matGoldStick);
    body.rotation.x = Math.PI / 2;
    bRoot.add(body);

    const leftWing = new THREE.Group();
    const rightWing = new THREE.Group();
    const matWingBlue = makeMat({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide
    });
    const matWingPink = makeMat({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide
    });

    const wGeo = getCachedGeo('acc_bf_wing', () => new THREE.CircleGeometry(0.09, 8));
    const lTop = new THREE.Mesh(wGeo, matWingBlue);
    lTop.rotation.x = -Math.PI / 2;
    lTop.position.set(-0.085, 0, 0.03);
    leftWing.add(lTop);

    const rTop = new THREE.Mesh(wGeo, matWingPink);
    rTop.rotation.x = -Math.PI / 2;
    rTop.position.set(0.085, 0, -0.03);
    rightWing.add(rTop);

    bRoot.add(leftWing);
    bRoot.add(rightWing);
    wrap.add(bRoot);
    anim.butterflies.push({ leftWing, rightWing, root: bRoot, baseY: 0.56 });
  } else if (id === 'pumpkin') {
    const stick = new THREE.Mesh(stickShortGeo, matGoldStick);
    stick.position.y = 0.12;
    wrap.add(stick);
    const mini = buildPumpkinBuilding3D(0.42);
    mini.position.y = 0.24;
    wrap.add(mini);
  } else if (id === 'noppamas_crown') {
    const stick = new THREE.Mesh(stickShortGeo, matGoldStick);
    stick.position.y = 0.12;
    wrap.add(stick);
    const mini = buildNoppamasCrown3D();
    mini.scale.setScalar(0.45);
    mini.position.y = 0.24;
    wrap.add(mini);
  } else if (id === 'lotus_lamp') {
    const mini = buildLotusLamp3D(assets);
    mini.scale.setScalar(0.45);
    mini.position.y = 0.04;
    wrap.add(mini);
  } else if (id === 'elephant_gold') {
    const mini = buildElephant3D();
    mini.scale.setScalar(0.45);
    mini.position.y = 0.04;
    wrap.add(mini);
  }

  parent.add(wrap);
  return wrap;
}

/**
 * สร้างโมเดลกระทง 3 มิติ (ลด Draw Calls เหลือ ~10 ชิ้น/ใบ เพื่อ 60 FPS ที่สมบูรณ์แบบ)
 */
export function buildKrathong3D(options: BuildKrathong3DOptions): {
  group: THREE.Group;
  anim: KrathongAnimHandles;
  scaleTargets: KrathongScaleTargets;
} {
  const {
    baseType,
    flowerType,
    candleColor,
    isMine = false,
    withFlameLight = false,
    withWaterRipples = false
  } = options;
  const assets = getSharedAssets();
  const baseKey = resolveBaseKey(baseType);
  const bp = BASE_PALETTES[baseKey];
  const fp = FLOWER_PALETTES[flowerType] || FLOWER_PALETTES.lotus_flower;
  const parsed = parseCandleConfig(candleColor);
  const cp = CANDLE_PALETTES[parsed.candleId] || CANDLE_PALETTES.yellow;

  const group = new THREE.Group();
  const anim: KrathongAnimHandles = {
    flames: [],
    sparklers: [],
    butterflies: [],
    lanterns: []
  };

  // --- 1. ฐานหยวกกล้วย + แนวกลีบกระทงตั้ง 2 ชั้น (1 InstancedMesh = 1 Draw Call) ---
  const cupTex =
    baseKey === 'banana_leaf' || baseKey === 'lotus'
      ? assets.bananaTrunkTex
      : baseKey === 'coconut'
        ? assets.coconutTex
        : baseKey === 'bread'
          ? assets.breadTex
          : null;

  const cup = new THREE.Mesh(
    assets.baseCupGeo,
    makeMat({
      color: bp.rimBody,
      map: cupTex,
      roughness: bp.opacity ? 0.25 : 0.62,
      metalness: bp.metal ?? 0.04,
      transparent: Boolean(bp.opacity),
      opacity: bp.opacity ?? 1
    })
  );
  cup.position.y = 0.06;
  group.add(cup);

  const waistBand = new THREE.Mesh(
    assets.waistBandGeo,
    makeMat({ color: bp.waist, metalness: bp.metal ? 0.45 : 0.08, roughness: 0.45 })
  );
  waistBand.rotation.x = Math.PI / 2;
  waistBand.position.y = 0.16;
  group.add(waistBand);

  if (baseKey === 'coconut') {
    const bowl = new THREE.Mesh(
      assets.coconutBowlGeo,
      makeMat({ color: 0x5c3a21, map: assets.coconutTex, roughness: 0.5, side: THREE.DoubleSide })
    );
    bowl.scale.y = 0.44;
    bowl.position.y = 0.22;
    group.add(bowl);
  } else if (baseKey === 'bread') {
    const bunMat = makeMat({ color: 0xffffff, map: assets.breadTex, roughness: 0.55 });
    const bunInst = new THREE.InstancedMesh(assets.breadBunGeo, bunMat, 14);
    const dummy = new THREE.Object3D();
    const cObj = new THREE.Color(0xffffff);
    for (let i = 0; i < 14; i++) {
      const ang = (i * Math.PI * 2) / 14;
      dummy.position.set(Math.cos(ang) * 0.80, 0.22, Math.sin(ang) * 0.80);
      dummy.rotation.set(0, -ang, 0);
      dummy.scale.set(1.15, 0.78, 1.0);
      dummy.updateMatrix();
      bunInst.setMatrixAt(i, dummy.matrix);
      cObj.setHex(i % 2 === 0 ? 0xfbbf24 : 0xfde68a);
      bunInst.setColorAt(i, cObj);
    }
    bunInst.instanceMatrix.needsUpdate = true;
    if (bunInst.instanceColor) bunInst.instanceColor.needsUpdate = true;
    group.add(bunInst);
  } else {
    const isLotusPetalBase = baseKey === 'lotus' || baseKey === 'lotus_crystal' || baseKey === 'ice_swan';
    const wallGeo = isLotusPetalBase ? assets.cuppedPetalGeo : assets.foldedGliebGeo;
    const wallTex = isLotusPetalBase ? assets.lotusPetalTex : assets.bananaGliebTex;

    const wallMat = makeMat({
      color: 0xffffff,
      map: wallTex,
      bumpMap: assets.petalBump,
      bumpScale: 0.01,
      metalness: bp.metal ?? 0.05,
      roughness: bp.opacity ? 0.18 : 0.44,
      transparent: Boolean(bp.opacity),
      opacity: bp.opacity ?? 1,
      side: THREE.DoubleSide
    });

    const outerCount = 20;
    const innerCount = 20;
    const wallInst = new THREE.InstancedMesh(wallGeo, wallMat, outerCount + innerCount);
    const dummy = new THREE.Object3D();
    const cObj = new THREE.Color();
    let idx = 0;

    // ชั้นนอก: กลีบพับตั้งแน่น 20 กลีบโอบขอบหยวกกล้วย
    for (let i = 0; i < outerCount; i++) {
      const ang = (i * Math.PI * 2) / outerCount;
      dummy.position.set(Math.cos(ang) * 0.90, 0.135, Math.sin(ang) * 0.90);
      dummy.rotation.order = 'YXZ';
      dummy.rotation.y = -ang + Math.PI / 2;
      dummy.rotation.x = isLotusPetalBase ? 0.26 : 0.16;
      dummy.scale.set(1.04, 1.04, 1.0);
      dummy.updateMatrix();
      wallInst.setMatrixAt(idx, dummy.matrix);
      cObj.setHex(bp.outerHex);
      wallInst.setColorAt(idx, cObj);
      idx++;
    }

    // ชั้นใน: สับหว่างสูงกว่าเล็กน้อย สร้างความอวบประณีต 2 ชั้น
    for (let i = 0; i < innerCount; i++) {
      const ang = ((i + 0.5) * Math.PI * 2) / innerCount;
      dummy.position.set(Math.cos(ang) * 0.82, 0.18, Math.sin(ang) * 0.82);
      dummy.rotation.order = 'YXZ';
      dummy.rotation.y = -ang + Math.PI / 2;
      dummy.rotation.x = isLotusPetalBase ? 0.14 : 0.08;
      dummy.scale.set(0.98, 0.98, 0.96);
      dummy.updateMatrix();
      wallInst.setMatrixAt(idx, dummy.matrix);
      cObj.setHex(bp.innerHex);
      wallInst.setColorAt(idx, cObj);
      idx++;
    }

    wallInst.instanceMatrix.needsUpdate = true;
    if (wallInst.instanceColor) wallInst.instanceColor.needsUpdate = true;
    group.add(wallInst);
  }

  // หงส์คู่ / นกยูง
  if (baseKey === 'ice_swan') {
    const matIceSwan = makeMat({
      color: 0xf0f9ff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.18,
      roughness: 0.16,
      transparent: true,
      opacity: 0.92
    });
    const matBeak = makeMat({ color: 0xfb923c, roughness: 0.35 });
    addCurvedSwanPair(group, matIceSwan, matBeak);
  } else if (baseKey === 'peacock_royal') {
    const matFeather = makeMat({ color: 0x065f46, metalness: 0.3, roughness: 0.38, side: THREE.DoubleSide });
    const featherInst = new THREE.InstancedMesh(assets.cuppedPetalGeo, matFeather, 7);
    const dummy = new THREE.Object3D();
    for (let f = -3; f <= 3; f++) {
      const ang = f * 0.24;
      dummy.position.set(Math.sin(ang) * 0.5, 0.42 + Math.cos(ang) * 0.18, -0.58);
      dummy.rotation.set(0, 0, -ang);
      dummy.scale.set(0.85, 2.0, 0.7);
      dummy.updateMatrix();
      featherInst.setMatrixAt(f + 3, dummy.matrix);
    }
    featherInst.instanceMatrix.needsUpdate = true;
    group.add(featherInst);
  }

  // แผ่นหน้าใบตองรองกลางกระทง (เรียบอิ่ม ไร้ช่องโหว่)
  const centerPad = new THREE.Mesh(
    assets.deckPadGeo,
    makeMat({ color: bp.deckTint, map: assets.bananaDeckTex, roughness: 0.52 })
  );
  centerPad.position.y = 0.24;
  group.add(centerPad);

  // --- 2. เทียนแท่งอ้วน 3D + ธูป 3 ดอก (Instanced Stems/Tips) ---
  const isCenterpiece = CENTERPIECE_MODELS.has(flowerType);
  const candleGroup = new THREE.Group();
  candleGroup.position.set(-0.08, 0.26, isCenterpiece ? -0.34 : -0.14);

  // ธูป 3 ดอกสีน้ำตาลทองอุ่น ปักเฉียงพอดีแบบภาพตัวอย่าง
  const incenseInst = new THREE.InstancedMesh(
    assets.incenseStemGeo,
    makeMat({ color: 0xb45309, roughness: 0.52 }),
    3
  );
  const tipInst = new THREE.InstancedMesh(
    assets.incenseTipGeo,
    makeMat({ color: 0xef4444, emissive: 0xea580c, emissiveIntensity: 0.85 }),
    3
  );
  const dummy = new THREE.Object3D();
  [-0.08, 0, 0.08].forEach((offset, idx) => {
    const tiltZ = -offset * 0.95;
    const midY = 0.30 + (idx === 1 ? 0.03 : 0);
    dummy.position.set(offset, midY, -0.06);
    dummy.rotation.set(-0.08, 0, tiltZ);
    dummy.scale.set(1, idx === 1 ? 1.06 : 0.98, 1);
    dummy.updateMatrix();
    incenseInst.setMatrixAt(idx, dummy.matrix);

    const tipH = (idx === 1 ? 0.68 : 0.62) + 0.01;
    dummy.position.set(
      offset - Math.sin(tiltZ) * tipH * 0.48,
      tipH * 0.97,
      -0.06 - Math.sin(0.08) * tipH * 0.48
    );
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    tipInst.setMatrixAt(idx, dummy.matrix);
  });
  incenseInst.instanceMatrix.needsUpdate = true;
  tipInst.instanceMatrix.needsUpdate = true;
  candleGroup.add(incenseInst);
  candleGroup.add(tipInst);

  // แท่งเทียนและเปลวเทียน
  const addCandleStick = (cx: number, h: number, waxColor: number, flameColor: number, phaseOffset: number) => {
    const wax = new THREE.Mesh(
      assets.candleStickGeo,
      makeMat({ color: waxColor, roughness: 0.38 })
    );
    wax.position.set(cx, h / 2, 0.02);
    candleGroup.add(wax);

    const flameOuter = new THREE.Mesh(
      assets.flameOuterGeo,
      makeMat({
        color: flameColor,
        emissive: flameColor,
        emissiveIntensity: 1.25,
        transparent: true,
        opacity: 0.9
      })
    );
    flameOuter.position.set(cx, h + 0.10, 0.02);
    candleGroup.add(flameOuter);

    const flameInner = new THREE.Mesh(
      assets.flameInnerGeo,
      makeMat({ color: 0xffffff, emissive: 0xfffbeb, emissiveIntensity: 1.6 })
    );
    flameInner.position.set(cx, h + 0.08, 0.02);
    candleGroup.add(flameInner);

    anim.flames.push({ mesh: flameOuter, baseY: h + 0.10, baseScaleY: 1, phase: phaseOffset });
  };

  if (parsed.candleId === 'rainbow' || parsed.candleId === 'twin-fortune') {
    addCandleStick(-0.075, 0.38, 0xfbcfe8, 0xf59e0b, 0);
    addCandleStick(0.075, 0.36, 0xbae6fd, 0xfbbf24, 1.4);
  } else {
    addCandleStick(0, 0.38, cp.wax, cp.flame, Math.random() * Math.PI * 2);
  }

  if (withFlameLight) {
    const warmLight = new THREE.PointLight(cp.glow, 1.2, 4.2, 1.4);
    warmLight.position.set(0, 0.72, 0.08);
    candleGroup.add(warmLight);
  }
  group.add(candleGroup);

  // --- 3. ช่อดอกไม้ 3 มิติ (ภาพตัวอย่างที่ 2) หรือ ของตกแต่งกลางกระทง 8 แบบ ---
  const centerGroup = new THREE.Group();
  centerGroup.position.y = 0.27;

  if (!isCenterpiece) {
    if (flowerType === 'lotus_flower' || flowerType === 'lotus') {
      // จัดวางเอกลักษณ์แบบภาพตัวอย่าง: บัวตูมชมพูกลาง + ดาวเรืองฟู 2 ดอกใหญ่ซ้าย-หน้า + มะลิประดับซอก
      addLotusBudInstanced(centerGroup, assets, [0.14, 0.01, 0.05], 1.18);
      addMarigoldsInstanced(centerGroup, assets, [
        { pos: [-0.26, 0.0, -0.06], scale: 1.18 },
        { pos: [-0.08, 0.0, 0.28], scale: 1.22 }
      ]);
      addJasmineClustersInstanced(centerGroup, assets, [
        [-0.36, 0.01, 0.16],
        [0.34, 0.01, -0.04],
        [0.16, 0.01, 0.28],
        [-0.08, 0.01, -0.26]
      ]);
    } else if (flowerType === 'marigold') {
      addMarigoldsInstanced(centerGroup, assets, [
        { pos: [0.06, 0.01, 0.12], scale: 1.24 },
        { pos: [-0.25, 0.0, 0.02], scale: 1.12 },
        { pos: [0.22, 0.0, -0.08], scale: 1.08 }
      ]);
      addJasmineClustersInstanced(centerGroup, assets, [
        [-0.14, 0.01, 0.30],
        [0.24, 0.01, 0.22],
        [-0.22, 0.01, -0.22]
      ]);
    } else if (flowerType === 'jasmine') {
      addMarigoldsInstanced(centerGroup, assets, [
        { pos: [0.08, 0.01, 0.14], scale: 1.05, outerHex: 0xffffff, midHex: 0xfefce8, coreHex: 0xfef08a }
      ]);
      addJasmineClustersInstanced(centerGroup, assets, [
        [-0.24, 0.02, -0.04],
        [-0.12, 0.02, 0.28],
        [0.28, 0.02, -0.02],
        [0.16, 0.02, 0.30],
        [-0.26, 0.01, 0.18],
        [0.04, 0.01, -0.24]
      ]);
    } else if (flowerType === 'mixed_garland' || flowerType === 'mixed-thai') {
      addLotusBudInstanced(centerGroup, assets, [0.15, 0.01, 0.06], 1.1);
      addMarigoldsInstanced(centerGroup, assets, [
        { pos: [-0.24, 0.0, -0.04], scale: 1.15, outerHex: MIXED_BLOSSOM_COLORS[0].inner, midHex: MIXED_BLOSSOM_COLORS[0].outer, coreHex: 0xb45309 },
        { pos: [-0.08, 0.0, 0.26], scale: 1.12, outerHex: MIXED_BLOSSOM_COLORS[2].inner, midHex: MIXED_BLOSSOM_COLORS[2].outer, coreHex: 0x581c87 }
      ]);
      addJasmineClustersInstanced(centerGroup, assets, [
        [-0.34, 0.01, 0.16],
        [0.28, 0.01, 0.22]
      ]);
    } else {
      // กุหลาบแดง / กล้วยไม้ม่วง / ดอกเข็มส้ม / อัญชันคราม (พุ่มกลีบฟู + มะลิประดับ)
      addMarigoldsInstanced(centerGroup, assets, [
        { pos: [0.12, 0.01, 0.06], scale: 1.22, outerHex: fp.inner, midHex: fp.outer, coreHex: fp.core },
        { pos: [-0.22, 0.0, -0.05], scale: 1.12, outerHex: fp.inner, midHex: fp.outer, coreHex: fp.core },
        { pos: [-0.06, 0.0, 0.27], scale: 1.15, outerHex: fp.inner, midHex: fp.outer, coreHex: fp.core }
      ]);
      addJasmineClustersInstanced(centerGroup, assets, [
        [-0.32, 0.01, 0.15],
        [0.26, 0.01, 0.22],
        [0.18, 0.01, -0.18]
      ]);
    }
  } else {
    let centerpieceMesh: THREE.Group;
    if (flowerType === 'pumpkin') centerpieceMesh = buildPumpkinBuilding3D(1);
    else if (flowerType === 'noppamas_crown') centerpieceMesh = buildNoppamasCrown3D();
    else if (flowerType === 'elephant_gold') centerpieceMesh = buildElephant3D();
    else if (flowerType === 'golden_swan') centerpieceMesh = buildGoldenSwanCenter3D();
    else if (flowerType === 'lotus_lamp') centerpieceMesh = buildLotusLamp3D(assets);
    else if (flowerType === 'gold_pagoda') centerpieceMesh = buildGoldPagoda3D();
    else if (flowerType === 'royal_barge') centerpieceMesh = buildRoyalBarge3D();
    else centerpieceMesh = buildCrystalHeartCenter3D(assets);

    centerpieceMesh.position.z = 0.06;
    centerGroup.add(centerpieceMesh);
  }

  centerGroup.scale.setScalar(parsed.centerScale);
  group.add(centerGroup);

  // --- 4. ของตกแต่งเสริมพิเศษรอบกระทง (ปรับสเกลได้รายชิ้น 0.6x–1.6x) ---
  const accessoryAnchorMap: Record<string, [number, number, number]> = {
    flag_thai: [-0.52, 0.25, -0.18],
    grad_cap: [-0.48, 0.25, 0.26],
    sparkler: [0.54, 0.25, -0.20],
    heart_sign: [-0.26, 0.25, 0.56],
    lucky_coin: [0.28, 0.25, 0.56],
    sky_lantern: [-0.58, 0.28, -0.44],
    butterfly: [0.36, 0.28, -0.44],
    pumpkin: [0.54, 0.25, 0.22],
    noppamas_crown: [-0.62, 0.25, 0.02],
    lotus_lamp: [0.0, 0.25, 0.60],
    elephant_gold: [0.58, 0.25, 0.44]
  };

  const accessoryGroups = new Map<string, THREE.Group>();
  parsed.accessories.forEach((accId, idx) => {
    const anchor = accessoryAnchorMap[accId] || [
      Math.cos((idx * Math.PI) / 3) * 0.56,
      0.25,
      Math.sin((idx * Math.PI) / 3) * 0.56
    ];
    const scale = parsed.accessoryScales[accId] ?? 1;
    const wrap = addAccessory3D(accId, anchor, scale, group, assets, anim);
    accessoryGroups.set(accId, wrap);
  });

  // วงแหวนแสงสีทองรอบกระทงตัวเอง (isMine)
  if (isMine) {
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(assets.haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.02;
    group.add(halo);
    anim.waterHalo = halo;
  }

  // วงคลื่นน้ำเล็กๆ แผ่ออกจากฐานกระทง (เฉพาะกระทงลอยบนแม่น้ำหลัก)
  if (withWaterRipples) {
    const phases = [0, 0.5];
    anim.rippleRings = phases.map((phase) => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x99f6ff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ring = new THREE.Mesh(assets.rippleRingGeo, mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.016;
      ring.renderOrder = 2;
      group.add(ring);
      return { mesh: ring, mat, phase };
    });
  }

  return { group, anim, scaleTargets: { centerGroup, accessoryGroups } };
}

/**
 * อัปเดตแอนิเมชันเปลวเทียน, ไฟเย็น, ปีกผีเสื้อ และโคมลอยบนกระทง 3D
 */
export function animateKrathong3D(anim: KrathongAnimHandles, elapsedSec: number): void {
  for (let i = 0; i < anim.flames.length; i++) {
    const f = anim.flames[i];
    const flicker = 1 + Math.sin(elapsedSec * 14 + f.phase) * 0.1 + Math.cos(elapsedSec * 23 + f.phase) * 0.06;
    f.mesh.scale.set(1, flicker, 1);
    f.mesh.rotation.z = Math.sin(elapsedSec * 7 + f.phase) * 0.08;
  }
  for (let i = 0; i < anim.sparklers.length; i++) {
    anim.sparklers[i].rotation.y = elapsedSec * 4.5;
    anim.sparklers[i].rotation.z = elapsedSec * 2.2;
  }
  for (let i = 0; i < anim.butterflies.length; i++) {
    const b = anim.butterflies[i];
    const flap = Math.sin(elapsedSec * 11 + i) * 0.55;
    b.leftWing.rotation.z = flap;
    b.rightWing.rotation.z = -flap;
    b.root.position.y = b.baseY + Math.sin(elapsedSec * 3.2 + i) * 0.03;
  }
  for (let i = 0; i < anim.lanterns.length; i++) {
    const l = anim.lanterns[i];
    l.root.position.y = l.baseY + Math.sin(elapsedSec * 2.1 + i) * 0.035;
    l.root.rotation.z = Math.sin(elapsedSec * 1.6 + i) * 0.05;
  }
  if (anim.waterHalo) {
    const pulse = 1 + Math.sin(elapsedSec * 3.2) * 0.05;
    anim.waterHalo.scale.set(pulse, pulse, 1);
  }
  if (anim.rippleRings) {
    for (let i = 0; i < anim.rippleRings.length; i++) {
      const rr = anim.rippleRings[i];
      const cycle = (elapsedSec * 0.55 + rr.phase) % 1;
      const ringScale = 0.92 + cycle * 0.68;
      rr.mesh.scale.set(ringScale, ringScale, 1);
      rr.mat.opacity = Math.sin(cycle * Math.PI) * 0.42;
    }
  }
}

/**
 * คืนหน่วยความจำ GPU ของชิ้นส่วนที่สร้างเฉพาะตัว รวมถึง InstancedMesh (ไม่แตะ Shared Assets)
 */
export function disposeKrathong3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.InstancedMesh) {
      obj.dispose();
    }
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry && !obj.geometry.userData?.shared) {
        obj.geometry.dispose();
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!m || m.userData?.shared) return;
        const std = m as THREE.MeshStandardMaterial;
        if (std.map && !std.map.userData?.shared) std.map.dispose();
        if (std.bumpMap && !std.bumpMap.userData?.shared) std.bumpMap.dispose();
        m.dispose();
      });
    }
  });
}
