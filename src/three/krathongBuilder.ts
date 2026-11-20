// src/three/krathongBuilder.ts
// ตัวสร้างโมเดลกระทง 3 มิติ (Procedural PBR Geometry + Shared Texture Cache + Animation Handles)
// รองรับฐานกระทง 8 แบบ, ดอกไม้ 8 ชนิด, ของตกแต่งกลาง 8 แบบ, เทียน 8 สี, ของเสริมครบชุด และการปรับสเกลแยกชิ้น

import * as THREE from 'three';
import { parseCandleConfig } from '../utils/krathongConfig';

export interface KrathongAnimHandles {
  flames: { mesh: THREE.Object3D; baseY: number; baseScaleY: number; phase: number }[];
  sparklers: THREE.Object3D[];
  butterflies: { leftWing: THREE.Object3D; rightWing: THREE.Object3D; root: THREE.Object3D; baseY: number }[];
  lanterns: { root: THREE.Object3D; baseY: number }[];
  waterHalo?: THREE.Mesh;
}

export interface BuildKrathong3DOptions {
  baseType: string;
  flowerType: string;
  candleColor: string;
  isMine?: boolean;
  withFlameLight?: boolean;
}

interface SharedAssets {
  leafTex: THREE.CanvasTexture;
  petalBump: THREE.CanvasTexture;
  coconutTex: THREE.CanvasTexture;
  breadTex: THREE.CanvasTexture;
  foldedPetalGeo: THREE.BufferGeometry;
  lotusPetalGeo: THREE.BufferGeometry;
  heartGeo: THREE.BufferGeometry;
  haloGeo: THREE.RingGeometry;
}

let cachedAssets: SharedAssets | null = null;

function markShared<T extends THREE.BufferGeometry | THREE.Texture>(asset: T): T {
  asset.userData.shared = true;
  return asset;
}

function createLeafTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#9ae6b4');
    grad.addColorStop(0.5, '#38a169');
    grad.addColorStop(1, '#1b4332');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.2;
    for (let y = 6; y < 128; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y - 4);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(10, 40, 22, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, 128);
    ctx.stroke();
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
      ctx.fillStyle = i % 8 === 0 ? '#969696' : '#6c6c6c';
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

function createFoldedPetalGeometry(): THREE.BufferGeometry {
  // รูปทรงกลีบกระทงพับจีบ 3 มิติ (ปลายแหลมด้านบน + สันพับกลางนูนออกด้านหน้า)
  const positions = new Float32Array([
    // Left half front/outer triangle
    0.0, 0.38, 0.015,
    -0.135, 0.03, -0.02,
    0.0, -0.02, 0.06,
    // Right half front/outer triangle
    0.0, 0.38, 0.015,
    0.0, -0.02, 0.06,
    0.135, 0.03, -0.02,
    // Lower skirt bridge left
    -0.135, 0.03, -0.02,
    -0.10, -0.08, -0.01,
    0.0, -0.02, 0.06,
    // Lower skirt bridge right
    0.0, -0.02, 0.06,
    0.10, -0.08, -0.01,
    0.135, 0.03, -0.02
  ]);
  const uvs = new Float32Array([
    0.5, 1.0, 0.0, 0.25, 0.5, 0.2,
    0.5, 1.0, 0.5, 0.2, 1.0, 0.25,
    0.0, 0.25, 0.1, 0.0, 0.5, 0.2,
    0.5, 0.2, 0.9, 0.0, 1.0, 0.25
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return markShared(geo);
}

function createLotusPetalGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.05);
  shape.bezierCurveTo(-0.12, 0.05, -0.14, 0.24, 0, 0.36);
  shape.bezierCurveTo(0.14, 0.24, 0.12, 0.05, 0, -0.05);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.026,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 8
  });
  geo.center();
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

function getSharedAssets(): SharedAssets {
  if (cachedAssets) return cachedAssets;
  cachedAssets = {
    leafTex: createLeafTexture(),
    petalBump: createPetalBumpTexture(),
    coconutTex: createCoconutTexture(),
    breadTex: createBreadTexture(),
    foldedPetalGeo: createFoldedPetalGeometry(),
    lotusPetalGeo: createLotusPetalGeometry(),
    heartGeo: createHeartGeometry(),
    haloGeo: markShared(new THREE.RingGeometry(1.06, 1.15, 48))
  };
  return cachedAssets;
}

const BASE_PALETTES: Record<
  string,
  { outer: number; mid: number; inner: number; rim: number; body: number; pin: number; metal?: number; opacity?: number }
> = {
  banana_leaf: { outer: 0x1b4332, mid: 0x2d6a4f, inner: 0x52b788, rim: 0x74c69d, body: 0x143628, pin: 0xfde047 },
  banana_gold: { outer: 0x064e3b, mid: 0x047857, inner: 0x10b981, rim: 0xfbbf24, body: 0x042f2e, pin: 0xfde047, metal: 0.35 },
  lotus: { outer: 0x831843, mid: 0xdb2777, inner: 0xf472b6, rim: 0xfbcfe8, body: 0x701a45, pin: 0xfef08a },
  lotus_crystal: { outer: 0x0c4a6e, mid: 0x0284c7, inner: 0x7dd3fc, rim: 0xe0f2fe, body: 0x082f49, pin: 0xffffff, metal: 0.25, opacity: 0.9 },
  coconut: { outer: 0x432818, mid: 0x7f5539, inner: 0xb08968, rim: 0xddb892, body: 0x3b2112, pin: 0xfbbf24 },
  bread: { outer: 0x78350f, mid: 0xd97706, inner: 0xfbbf24, rim: 0xfef08a, body: 0x92400e, pin: 0xfffbeb },
  ice_swan: { outer: 0x0369a1, mid: 0x38bdf8, inner: 0xe0f2fe, rim: 0xffffff, body: 0x075985, pin: 0xbae6fd, metal: 0.2, opacity: 0.92 },
  peacock_royal: { outer: 0x713f12, mid: 0xca8a04, inner: 0xfde047, rim: 0xfef08a, body: 0x422006, pin: 0x10b981, metal: 0.45 }
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
  marigold: { outer: 0xf59e0b, inner: 0xfbbf24, core: 0xb45309 },
  lotus_flower: { outer: 0xe11d48, inner: 0xfb7185, core: 0xfef08a },
  lotus: { outer: 0xe11d48, inner: 0xfb7185, core: 0xfef08a },
  orchid: { outer: 0x9333ea, inner: 0xd8b4fe, core: 0xfef08a },
  jasmine: { outer: 0xe2e8f0, inner: 0xffffff, core: 0xfde047 },
  rose: { outer: 0x9f1239, inner: 0xf43f5e, core: 0xfecdd3 },
  dok_kem: { outer: 0xea580c, inner: 0xfb923c, core: 0xfef08a },
  anchan: { outer: 0x4338ca, inner: 0x818cf8, core: 0xe0e7ff },
  mixed_garland: { outer: 0xf43f5e, inner: 0xfbbf24, core: 0xfef08a },
  'mixed-thai': { outer: 0xf43f5e, inner: 0xfbbf24, core: 0xfef08a }
};

const MIXED_BLOSSOM_COLORS = [
  { outer: 0xf59e0b, inner: 0xfde047 },
  { outer: 0xe11d48, inner: 0xfb7185 },
  { outer: 0x9333ea, inner: 0xd8b4fe },
  { outer: 0x0284c7, inner: 0x7dd3fc },
  { outer: 0x059669, inner: 0x6ee7b7 },
  { outer: 0xea580c, inner: 0xfdba74 },
  { outer: 0xcbd5e1, inner: 0xffffff }
];

const CANDLE_PALETTES: Record<string, { wax: number; flame: number; glow: number }> = {
  yellow: { wax: 0xfef08a, flame: 0xf59e0b, glow: 0xfbbf24 },
  'yellow-classic': { wax: 0xfef08a, flame: 0xf59e0b, glow: 0xfbbf24 },
  red: { wax: 0xf87171, flame: 0xef4444, glow: 0xfca5a5 },
  orange: { wax: 0xfb923c, flame: 0xea580c, glow: 0xfdba74 },
  cyan: { wax: 0x7dd3fc, flame: 0x0ea5e9, glow: 0xbae6fd },
  pink: { wax: 0xf472b6, flame: 0xec4899, glow: 0xfbcfe8 },
  'scented-pink': { wax: 0xf472b6, flame: 0xec4899, glow: 0xfbcfe8 },
  emerald: { wax: 0x6ee7b7, flame: 0x10b981, glow: 0xa7f3d0 },
  purple: { wax: 0xc084fc, flame: 0xa855f7, glow: 0xe9d5ff },
  rainbow: { wax: 0xf472b6, flame: 0xfde047, glow: 0xf472b6 },
  'gold-glitter': { wax: 0xfde047, flame: 0xf59e0b, glow: 0xfef08a },
  'twin-fortune': { wax: 0xf472b6, flame: 0xfde047, glow: 0xfbbf24 },
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

function makeMat(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    roughness: 0.48,
    metalness: 0.08,
    ...params
  });
}

function addCurvedSwanPair(parent: THREE.Group, matBody: THREE.Material, matBeak: THREE.Material): void {
  const matEye = makeMat({ color: 0x0f172a, roughness: 0.2 });
  [-1, 1].forEach((side) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.72, 0.16, 0.08),
      new THREE.Vector3(side * 0.94, 0.34, 0.04),
      new THREE.Vector3(side * 0.88, 0.58, -0.02),
      new THREE.Vector3(side * 0.72, 0.56, 0.02)
    ]);
    const neck = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.055, 8, false), matBody);
    parent.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), matBody);
    head.position.set(side * 0.71, 0.56, 0.03);
    parent.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 6), matBeak);
    beak.rotation.z = side * (Math.PI * 0.58);
    beak.position.set(side * 0.63, 0.55, 0.03);
    parent.add(beak);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), matEye);
    eye.position.set(side * 0.69, 0.575, 0.085);
    parent.add(eye);

    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), matBody);
    wing.scale.set(0.6, 0.85, 1.45);
    wing.rotation.z = side * -0.45;
    wing.position.set(side * 0.76, 0.21, -0.06);
    parent.add(wing);
  });
}

function buildSingleBlossom3D(outerColor: number, innerColor: number, coreColor: number): THREE.Group {
  const g = new THREE.Group();
  const outerMat = makeMat({ color: outerColor, roughness: 0.42 });
  const innerMat = makeMat({ color: innerColor, roughness: 0.35 });
  const coreMat = makeMat({ color: coreColor, emissive: coreColor, emissiveIntensity: 0.18, roughness: 0.3 });

  const petalGeo = new THREE.SphereGeometry(0.068, 8, 6);
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI * 2) / 6;
    const p = new THREE.Mesh(petalGeo, outerMat);
    p.scale.set(0.75, 0.42, 1.35);
    p.position.set(Math.cos(ang) * 0.095, 0.015, Math.sin(ang) * 0.095);
    p.rotation.y = -ang + Math.PI / 2;
    p.rotation.x = 0.28;
    g.add(p);
  }
  for (let i = 0; i < 5; i++) {
    const ang = (i * Math.PI * 2) / 5 + 0.3;
    const p = new THREE.Mesh(petalGeo, innerMat);
    p.scale.set(0.6, 0.42, 1.0);
    p.position.set(Math.cos(ang) * 0.055, 0.042, Math.sin(ang) * 0.055);
    p.rotation.y = -ang + Math.PI / 2;
    p.rotation.x = 0.55;
    g.add(p);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), coreMat);
  core.position.y = 0.052;
  g.add(core);
  return g;
}

function buildPumpkinBuilding3D(scaleFactor = 1): THREE.Group {
  // ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. แบบ 3D (โดมกลีบสีทอง + ซุ้มโค้งขอบทอง + ไฟส่องภายในอุ่น)
  const g = new THREE.Group();
  const matGoldDark = makeMat({ color: 0xb45309, metalness: 0.35, roughness: 0.4 });
  const matGoldMid = makeMat({ color: 0xf59e0b, metalness: 0.3, roughness: 0.35 });
  const matGoldBright = makeMat({
    color: 0xfde68a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.2,
    metalness: 0.28,
    roughness: 0.32
  });
  const matArchDark = makeMat({
    color: 0x0b132b,
    emissive: 0x451a03,
    emissiveIntensity: 0.35,
    roughness: 0.65
  });
  const matRim = makeMat({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.25, roughness: 0.3 });

  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.6, 0.07, 24), matGoldDark);
  tier1.position.y = 0.035;
  g.add(tier1);

  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.52, 0.055, 24), matGoldBright);
  tier2.position.y = 0.095;
  g.add(tier2);

  // กลีบโดมฟักทอง 7 กลีบโค้งนูนแบบ 3D
  const lobeAngles = [-0.95, -0.62, -0.31, 0, 0.31, 0.62, 0.95];
  const lobeHeights = [0.34, 0.42, 0.48, 0.53, 0.48, 0.42, 0.34];
  const lobeGeo = new THREE.SphereGeometry(0.16, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);

  lobeAngles.forEach((ang, idx) => {
    const isCenter = idx === 3;
    const lobeMat = isCenter ? matGoldBright : idx % 2 === 0 ? matGoldDark : matGoldMid;
    const lobe = new THREE.Mesh(lobeGeo, lobeMat);
    const h = lobeHeights[idx];
    lobe.scale.set(isCenter ? 1.15 : 0.95, h / 0.16, 1.35);
    lobe.position.set(Math.sin(ang) * 0.28, 0.12, Math.cos(ang) * 0.05);
    lobe.rotation.z = -ang * 0.32;
    g.add(lobe);
  });

  // โดมครอบหลักด้านบนเชื่อมกลีบ
  const coreDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
    matGoldMid
  );
  coreDome.scale.set(1.06, 0.88, 0.72);
  coreDome.position.y = 0.12;
  g.add(coreDome);

  // ยอดจั่วกลาง
  const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.14, 8), matRim);
  pinnacle.position.y = 0.59;
  g.add(pinnacle);

  // ซุ้มโค้งด้านหน้าและด้านหลัง
  for (const zDir of [1, -1]) {
    for (let i = -2; i <= 2; i++) {
      const archX = i * 0.145;
      const archH = i === 0 ? 0.14 : 0.115;
      const archW = i === 0 ? 0.055 : 0.045;
      const archVoid = new THREE.Mesh(new THREE.CylinderGeometry(archW, archW, archH, 10), matArchDark);
      archVoid.position.set(archX, 0.12 + archH * 0.45, zDir * 0.26);
      archVoid.scale.z = 0.55;
      g.add(archVoid);

      const archTop = new THREE.Mesh(new THREE.SphereGeometry(archW, 10, 8), matArchDark);
      archTop.position.set(archX, 0.12 + archH * 0.9, zDir * 0.26);
      archTop.scale.z = 0.55;
      g.add(archTop);

      const frameRing = new THREE.Mesh(new THREE.TorusGeometry(archW * 1.15, 0.01, 6, 12, Math.PI), matRim);
      frameRing.position.set(archX, 0.12 + archH * 0.9, zDir * 0.285);
      g.add(frameRing);
    }
  }

  g.scale.setScalar(scaleFactor);
  return g;
}

function buildNoppamasCrown3D(): THREE.Group {
  const g = new THREE.Group();
  const matGold = makeMat({ color: 0xfbbf24, metalness: 0.55, roughness: 0.28 });
  const matBronze = makeMat({ color: 0xb45309, metalness: 0.45, roughness: 0.35 });
  const matRuby = makeMat({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.3, roughness: 0.2 });
  const matGem = makeMat({ color: 0x10b981, emissive: 0x047857, emissiveIntensity: 0.25, roughness: 0.2 });

  const pedPoints = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.26, 0),
    new THREE.Vector2(0.14, 0.08),
    new THREE.Vector2(0.32, 0.16),
    new THREE.Vector2(0.30, 0.19),
    new THREE.Vector2(0.01, 0.19)
  ];
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pedPoints, 20), matBronze));

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.14, 16), matGold);
  band.position.y = 0.25;
  g.add(band);

  for (let tier = 0; tier < 3; tier++) {
    const rBot = 0.22 - tier * 0.05;
    const rTop = rBot - 0.045;
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 0.11, 16), matGold);
    cone.position.y = 0.37 + tier * 0.11;
    g.add(cone);
  }

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 12), matGold);
  spire.position.y = 0.78;
  g.add(spire);

  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), matRuby);
  jewel.position.set(0, 0.27, 0.25);
  g.add(jewel);

  [-0.14, 0.14].forEach((x) => {
    const sideGem = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), matGem);
    sideGem.position.set(x, 0.26, 0.21);
    g.add(sideGem);
  });

  return g;
}

function buildElephant3D(): THREE.Group {
  const g = new THREE.Group();
  const matIvory = makeMat({ color: 0xfffbeb, roughness: 0.4 });
  const matGold = makeMat({ color: 0xfde047, metalness: 0.45, roughness: 0.3 });
  const matRed = makeMat({ color: 0xdc2626, roughness: 0.55 });
  const matBronze = makeMat({ color: 0x92400e, metalness: 0.3, roughness: 0.45 });

  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.09, 0.42), matBronze);
  ped.position.y = 0.045;
  g.add(ped);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), matIvory);
  body.scale.set(1.35, 0.95, 0.9);
  body.position.set(-0.04, 0.31, 0);
  g.add(body);

  [
    [-0.18, -0.1],
    [-0.18, 0.1],
    [0.12, -0.1],
    [0.12, 0.1]
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.24, 10), matIvory);
    leg.position.set(lx, 0.18, lz);
    g.add(leg);
  });

  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.4), matRed);
  blanket.position.set(-0.04, 0.35, 0);
  g.add(blanket);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), matIvory);
  head.position.set(0.25, 0.38, 0);
  g.add(head);

  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 8), matGold);
  crown.position.set(0.25, 0.55, 0);
  g.add(crown);

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.35, 0.34, 0),
    new THREE.Vector3(0.46, 0.32, 0),
    new THREE.Vector3(0.50, 0.44, 0),
    new THREE.Vector3(0.42, 0.52, 0)
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 12, 0.036, 8, false), matIvory));

  [-0.12, 0.12].forEach((ez) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), matIvory);
    ear.scale.set(0.4, 1.1, 0.95);
    ear.position.set(0.19, 0.37, ez * 1.15);
    g.add(ear);
  });

  return g;
}

function buildGoldenSwanCenter3D(): THREE.Group {
  const g = new THREE.Group();
  const matGold = makeMat({ color: 0xfbbf24, metalness: 0.55, roughness: 0.28 });
  const matBronze = makeMat({ color: 0x92400e, metalness: 0.35, roughness: 0.4 });
  const matBeak = makeMat({ color: 0xea580c, roughness: 0.35 });
  const matOrb = makeMat({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.65, roughness: 0.15 });

  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.08, 24), matBronze);
  ped.position.y = 0.04;
  g.add(ped);

  const swansWrap = new THREE.Group();
  swansWrap.scale.setScalar(0.54);
  addCurvedSwanPair(swansWrap, matGold, matBeak);
  g.add(swansWrap);

  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), matOrb);
  orb.position.y = 0.25;
  g.add(orb);
  return g;
}

function buildLotusLamp3D(assets: SharedAssets): THREE.Group {
  const g = new THREE.Group();
  const matLeaf = makeMat({ color: 0x0f766e, roughness: 0.5 });
  const matOuter = makeMat({ color: 0xec4899, transparent: true, opacity: 0.85, roughness: 0.22 });
  const matInner = makeMat({ color: 0xfdf2f8, transparent: true, opacity: 0.92, roughness: 0.18 });
  const matCore = makeMat({ color: 0xfef08a, emissive: 0xfbbf24, emissiveIntensity: 0.85, roughness: 0.15 });

  const basePad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.07, 24), matLeaf);
  basePad.position.y = 0.035;
  g.add(basePad);

  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI * 2) / 8;
    const p = new THREE.Mesh(assets.lotusPetalGeo, matOuter);
    p.scale.setScalar(1.05);
    p.position.set(Math.cos(ang) * 0.23, 0.22, Math.sin(ang) * 0.23);
    p.rotation.y = -ang + Math.PI / 2;
    p.rotation.x = 0.52;
    g.add(p);
  }
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI * 2) / 6 + 0.35;
    const p = new THREE.Mesh(assets.lotusPetalGeo, matInner);
    p.scale.setScalar(0.85);
    p.position.set(Math.cos(ang) * 0.13, 0.28, Math.sin(ang) * 0.13);
    p.rotation.y = -ang + Math.PI / 2;
    p.rotation.x = 0.24;
    g.add(p);
  }

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), matCore);
  bulb.position.y = 0.24;
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
  const chedi = new THREE.Mesh(new THREE.LatheGeometry(bellPoints, 20), matGold);
  chedi.position.y = 0.15;
  g.add(chedi);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), matBright);
  tip.position.y = 0.78;
  g.add(tip);

  [-0.36, 0.36].forEach((ux) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), matBright);
    pole.position.set(ux, 0.25, 0);
    g.add(pole);
    for (let t = 0; t < 3; t++) {
      const tier = new THREE.Mesh(new THREE.ConeGeometry(0.075 - t * 0.018, 0.07, 8), matGold);
      tier.position.set(ux, 0.28 + t * 0.09, 0);
      g.add(tier);
    }
  });
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
  const hull = new THREE.Mesh(new THREE.TubeGeometry(hullCurve, 20, 0.07, 10, false), matBronze);
  hull.scale.set(1, 0.85, 1.35);
  g.add(hull);

  const prowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.54, 0.22, 0),
    new THREE.Vector3(-0.62, 0.38, 0),
    new THREE.Vector3(-0.54, 0.48, 0),
    new THREE.Vector3(-0.46, 0.44, 0)
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(prowCurve, 12, 0.036, 8, false), matGold));

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
    roughness: 0.12,
    metalness: 0.2,
    transparent: true,
    opacity: 0.92
  });

  const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 10), matPillow);
  pillow.scale.set(1.15, 0.28, 0.9);
  pillow.position.y = 0.06;
  g.add(pillow);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 8, 28), matRim);
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
): void {
  const wrap = new THREE.Group();
  wrap.position.set(pos[0], pos[1], pos[2]);
  wrap.scale.setScalar(scale);

  const matGoldStick = makeMat({ color: 0xfbbf24, metalness: 0.45, roughness: 0.35 });

  if (id === 'sparkler') {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8), matGoldStick);
    stick.position.y = 0.32;
    wrap.add(stick);

    const starGroup = new THREE.Group();
    starGroup.position.y = 0.66;
    const matSpark = makeMat({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    starGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), matSpark));
    for (let i = 0; i < 6; i++) {
      const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 5), matSpark);
      ray.rotation.z = (i * Math.PI) / 6;
      ray.rotation.x = (i % 2) * 0.4;
      starGroup.add(ray);
    }
    wrap.add(starGroup);
    anim.sparklers.push(starGroup);
  } else if (id === 'sky_lantern') {
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.48, 5),
      makeMat({ color: 0xd97706, transparent: true, opacity: 0.6 })
    );
    cord.position.y = 0.24;
    wrap.add(cord);

    const lanternRoot = new THREE.Group();
    lanternRoot.position.y = 0.56;
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.08, 0.24, 10),
      makeMat({
        color: 0xfb923c,
        emissive: 0xf97316,
        emissiveIntensity: 0.65,
        roughness: 0.45
      })
    );
    lanternRoot.add(body);
    const flameDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 8, 6),
      makeMat({ color: 0xfffbeb, emissive: 0xfef08a, emissiveIntensity: 1.0 })
    );
    flameDot.position.y = -0.09;
    lanternRoot.add(flameDot);
    wrap.add(lanternRoot);
    anim.lanterns.push({ root: lanternRoot, baseY: 0.56 });
  } else if (id === 'heart_sign') {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 6), matGoldStick);
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
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.34, 6), matGoldStick);
    stick.position.y = 0.17;
    wrap.add(stick);

    const matCap = makeMat({ color: 0x0f172a, roughness: 0.5 });
    const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.1, 0.09, 12), matCap);
    skull.position.y = 0.36;
    wrap.add(skull);

    const board = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.28), matCap);
    board.position.y = 0.41;
    board.rotation.y = Math.PI / 4;
    wrap.add(board);

    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.14, 6), matGoldStick);
    tassel.position.set(0.14, 0.35, 0.04);
    tassel.rotation.z = 0.2;
    wrap.add(tassel);
  } else if (id === 'lucky_coin') {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 6), matGoldStick);
    stick.position.y = 0.16;
    wrap.add(stick);

    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.036, 20),
      makeMat({ color: 0xf59e0b, metalness: 0.65, roughness: 0.25 })
    );
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 0.40;
    wrap.add(coin);

    const centerHole = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.09, 0.046),
      makeMat({ color: 0x451a03, roughness: 0.6 })
    );
    centerHole.position.y = 0.40;
    wrap.add(centerHole);
  } else if (id === 'flag_thai') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.68, 8), matGoldStick);
    pole.position.y = 0.34;
    wrap.add(pole);

    const flagColors = [0xf43f5e, 0x38bdf8, 0x10b981];
    flagColors.forEach((col, i) => {
      const flag = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.22, 3),
        makeMat({ color: col, emissive: col, emissiveIntensity: 0.18, roughness: 0.45 })
      );
      flag.rotation.z = -Math.PI / 2;
      flag.position.set(0.11, 0.60 - i * 0.13, 0);
      wrap.add(flag);
    });
  } else if (id === 'butterfly') {
    const bRoot = new THREE.Group();
    bRoot.position.y = 0.58;

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 6), matGoldStick);
    body.rotation.x = Math.PI / 2;
    bRoot.add(body);

    const leftWing = new THREE.Group();
    const rightWing = new THREE.Group();
    const matWingBlue = makeMat({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide
    });
    const matWingPink = makeMat({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide
    });

    const wGeo = new THREE.CircleGeometry(0.09, 10);
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
    anim.butterflies.push({ leftWing, rightWing, root: bRoot, baseY: 0.58 });
  } else if (id === 'pumpkin') {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6), matGoldStick);
    stick.position.y = 0.12;
    wrap.add(stick);
    const mini = buildPumpkinBuilding3D(0.42);
    mini.position.y = 0.24;
    wrap.add(mini);
  } else if (id === 'noppamas_crown') {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6), matGoldStick);
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
}

/**
 * สร้าง Group โมเดลกระทง 3 มิติพร้อมตัวควบคุมแอนิเมชันและ Cleanup GPU Resources
 */
export function buildKrathong3D(options: BuildKrathong3DOptions): {
  group: THREE.Group;
  anim: KrathongAnimHandles;
} {
  const { baseType, flowerType, candleColor, isMine = false, withFlameLight = false } = options;
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

  // --- 1. ฐานกระทง 3D (8 รูปแบบ) ---
  const baseMatOuter = makeMat({
    color: bp.outer,
    map: baseKey === 'banana_leaf' || baseKey === 'banana_gold' ? assets.leafTex : baseKey === 'coconut' ? assets.coconutTex : baseKey === 'bread' ? assets.breadTex : null,
    bumpMap: assets.petalBump,
    bumpScale: 0.015,
    metalness: bp.metal ?? 0.08,
    roughness: bp.opacity ? 0.2 : 0.48,
    transparent: Boolean(bp.opacity),
    opacity: bp.opacity ?? 1
  });
  const baseMatMid = makeMat({
    color: bp.mid,
    bumpMap: assets.petalBump,
    bumpScale: 0.012,
    metalness: bp.metal ?? 0.08,
    roughness: bp.opacity ? 0.18 : 0.44,
    transparent: Boolean(bp.opacity),
    opacity: bp.opacity ?? 1
  });
  const baseMatInner = makeMat({
    color: bp.inner,
    metalness: bp.metal ?? 0.08,
    roughness: bp.opacity ? 0.14 : 0.4,
    transparent: Boolean(bp.opacity),
    opacity: bp.opacity ?? 1
  });
  const rimMat = makeMat({ color: bp.rim, metalness: 0.45, roughness: 0.3 });
  const pinMat = makeMat({ color: bp.pin, metalness: 0.55, roughness: 0.25 });

  // ตัวถ้วยฐานด้านล่าง (วางลึกลงในน้ำเล็กน้อย y: -0.10 .. +0.20)
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.72, 0.28, 32),
    makeMat({
      color: bp.body,
      map: baseKey === 'coconut' ? assets.coconutTex : baseKey === 'bread' ? assets.breadTex : null,
      roughness: 0.6
    })
  );
  cup.position.y = 0.05;
  group.add(cup);

  // แถบคาดขอบทองรอบฐาน
  const waistBand = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.025, 8, 36), rimMat);
  waistBand.rotation.x = Math.PI / 2;
  waistBand.position.y = 0.14;
  group.add(waistBand);

  if (baseKey === 'coconut') {
    const bowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.88, 28, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      makeMat({ color: bp.outer, map: assets.coconutTex, roughness: 0.5, side: THREE.DoubleSide })
    );
    bowl.scale.y = 0.45;
    bowl.position.y = 0.20;
    group.add(bowl);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.87, 0.032, 8, 36), rimMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.20;
    group.add(lip);
  } else if (baseKey === 'bread') {
    for (let i = 0; i < 14; i++) {
      const ang = (i * Math.PI * 2) / 14;
      const bun = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 10),
        makeMat({ color: bp.inner, map: assets.breadTex, roughness: 0.55 })
      );
      bun.scale.set(1.15, 0.78, 1.0);
      bun.position.set(Math.cos(ang) * 0.78, 0.22, Math.sin(ang) * 0.78);
      bun.rotation.y = -ang;
      group.add(bun);

      const sesame = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 6, 4),
        makeMat({ color: 0xfffbeb, roughness: 0.4 })
      );
      sesame.position.set(Math.cos(ang) * 0.80, 0.35, Math.sin(ang) * 0.80);
      group.add(sesame);
    }
  } else {
    const isLotusPetal = baseKey === 'lotus' || baseKey === 'lotus_crystal' || baseKey === 'ice_swan';
    const petalGeo = isLotusPetal ? assets.lotusPetalGeo : assets.foldedPetalGeo;

    const petalTiers = [
      { count: 14, radius: 0.88, y: 0.16, tilt: 0.72, scale: 1.05, mat: baseMatOuter },
      { count: 12, radius: 0.76, y: 0.22, tilt: 0.48, scale: 0.96, mat: baseMatMid },
      { count: 10, radius: 0.62, y: 0.27, tilt: 0.26, scale: 0.86, mat: baseMatInner }
    ];

    petalTiers.forEach((tier, tIdx) => {
      for (let i = 0; i < tier.count; i++) {
        const ang = (i * Math.PI * 2) / tier.count + tIdx * 0.22;
        const px = Math.cos(ang) * tier.radius;
        const pz = Math.sin(ang) * tier.radius;

        const petal = new THREE.Mesh(petalGeo, tier.mat);
        petal.scale.setScalar(tier.scale);
        petal.position.set(px, tier.y, pz);
        petal.rotation.order = 'YXZ';
        petal.rotation.y = -ang + Math.PI / 2;
        petal.rotation.x = tier.tilt;
        group.add(petal);

        if (tIdx === 1 && i % 2 === 0) {
          const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), pinMat);
          pin.position.set(Math.cos(ang) * (tier.radius + 0.07), tier.y - 0.04, Math.sin(ang) * (tier.radius + 0.07));
          group.add(pin);
        }
      }
    });
  }

  // รายละเอียดพิเศษฐานหงส์คู่ (ice_swan) และนกยูงทองคำ (peacock_royal)
  if (baseKey === 'ice_swan') {
    const matIceSwan = makeMat({
      color: 0xf0f9ff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.18,
      roughness: 0.16,
      transparent: true,
      opacity: 0.93
    });
    const matBeak = makeMat({ color: 0xfb923c, roughness: 0.35 });
    addCurvedSwanPair(group, matIceSwan, matBeak);
  } else if (baseKey === 'peacock_royal') {
    const matFeather = makeMat({ color: 0x065f46, metalness: 0.3, roughness: 0.38 });
    const matEyeBlue = makeMat({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.25 });
    for (let f = -3; f <= 3; f++) {
      const ang = f * 0.24;
      const feather = new THREE.Mesh(assets.lotusPetalGeo, matFeather);
      feather.scale.set(0.85, 2.2, 0.7);
      feather.position.set(Math.sin(ang) * 0.5, 0.56 + Math.cos(ang) * 0.22, -0.58);
      feather.rotation.z = -ang;
      group.add(feather);

      const ocellus = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), matEyeBlue);
      ocellus.scale.z = 0.4;
      ocellus.position.set(Math.sin(ang) * 0.65, 0.72 + Math.cos(ang) * 0.26, -0.55);
      group.add(ocellus);
    }

    const headNeck = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.18, 0.65),
      new THREE.Vector3(0, 0.42, 0.76),
      new THREE.Vector3(0, 0.64, 0.66),
      new THREE.Vector3(0, 0.62, 0.58)
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(headNeck, 12, 0.048, 8, false), rimMat));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), makeMat({ color: 0x047857, roughness: 0.3 }));
    head.position.set(0, 0.64, 0.62);
    group.add(head);
  }

  // ใบตองรองกลางหน้าตักกระทง
  const centerPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.66, 0.06, 28),
    makeMat({ color: 0x14532d, map: assets.leafTex, roughness: 0.55 })
  );
  centerPad.position.y = 0.22;
  group.add(centerPad);

  // --- 2. ธูป 3 ดอก & เทียน 3D (วางถอยหลังเล็กน้อยเมื่อเป็น Centerpiece Model) ---
  const isCenterpiece = CENTERPIECE_MODELS.has(flowerType);
  const candleGroup = new THREE.Group();
  candleGroup.position.set(0, 0.24, isCenterpiece ? -0.34 : -0.14);

  // ธูป 3 ดอก
  const matIncense = makeMat({ color: 0x991b1b, roughness: 0.6 });
  const matIncenseBody = makeMat({ color: 0xd97706, roughness: 0.5 });
  const matTip = makeMat({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.95 });

  [-0.1, 0, 0.1].forEach((offset, idx) => {
    const incenseHolder = new THREE.Group();
    incenseHolder.position.set(offset, 0, -0.06);
    incenseHolder.rotation.z = -offset * 1.1;

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.32, 6), matIncense);
    stem.position.y = 0.16;
    incenseHolder.add(stem);

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36 + (idx === 1 ? 0.05 : 0), 6), matIncenseBody);
    upper.position.y = 0.48 + (idx === 1 ? 0.025 : 0);
    incenseHolder.add(upper);

    const glowingTip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), matTip);
    glowingTip.position.y = 0.67 + (idx === 1 ? 0.05 : 0);
    incenseHolder.add(glowingTip);
    candleGroup.add(incenseHolder);
  });

  // ตัวเทียน & เปลวไฟ
  const addCandleStick = (cx: number, h: number, waxColor: number, flameColor: number, phaseOffset: number) => {
    const wax = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.05, h, 14),
      makeMat({ color: waxColor, roughness: 0.35 })
    );
    wax.position.set(cx, h / 2, 0);
    candleGroup.add(wax);

    const wick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.06, 5),
      makeMat({ color: 0x1c1917 })
    );
    wick.position.set(cx, h + 0.03, 0);
    candleGroup.add(wick);

    const flameOuter = new THREE.Mesh(
      new THREE.ConeGeometry(0.048, 0.17, 10),
      makeMat({
        color: flameColor,
        emissive: flameColor,
        emissiveIntensity: 1.15,
        transparent: true,
        opacity: 0.92
      })
    );
    flameOuter.position.set(cx, h + 0.13, 0);
    candleGroup.add(flameOuter);

    const flameInner = new THREE.Mesh(
      new THREE.ConeGeometry(0.024, 0.1, 8),
      makeMat({ color: 0xffffff, emissive: 0xfffbeb, emissiveIntensity: 1.5 })
    );
    flameInner.position.set(cx, h + 0.11, 0);
    candleGroup.add(flameInner);

    anim.flames.push({ mesh: flameOuter, baseY: h + 0.13, baseScaleY: 1, phase: phaseOffset });
  };

  if (parsed.candleId === 'rainbow' || parsed.candleId === 'twin-fortune') {
    addCandleStick(-0.06, 0.56, 0xf472b6, 0xf59e0b, 0);
    addCandleStick(0.06, 0.52, 0x38bdf8, 0xec4899, 1.4);
  } else {
    addCandleStick(0, 0.58, cp.wax, cp.flame, Math.random() * Math.PI * 2);
  }

  if (withFlameLight) {
    const warmLight = new THREE.PointLight(cp.glow, 1.1, 4.5, 1.5);
    warmLight.position.set(0, 0.78, 0.05);
    candleGroup.add(warmLight);
  }
  group.add(candleGroup);

  // --- 3. พุ่มดอกไม้ 3 มิติ หรือ ของตกแต่งตรงกลางกระทง (ปรับสเกลได้ผ่าน centerScale) ---
  const centerGroup = new THREE.Group();
  centerGroup.position.y = 0.25;

  if (!isCenterpiece) {
    const isMixed = flowerType === 'mixed_garland' || flowerType === 'mixed-thai';
    const clusterOffsets: [number, number, number, number][] = [
      [0, 0.08, 0.1, 1.12],
      [-0.28, 0.04, 0.18, 0.92],
      [0.28, 0.04, 0.18, 0.92],
      [-0.44, 0.02, -0.02, 0.85],
      [0.44, 0.02, -0.02, 0.85],
      [-0.18, 0.03, 0.34, 0.96],
      [0.18, 0.03, 0.34, 0.96],
      [-0.24, 0.02, -0.26, 0.84],
      [0.24, 0.02, -0.26, 0.84]
    ];
    clusterOffsets.forEach(([fx, fy, fz, fs], idx) => {
      const col = isMixed ? MIXED_BLOSSOM_COLORS[idx % MIXED_BLOSSOM_COLORS.length] : fp;
      const blossom = buildSingleBlossom3D(col.outer, col.inner, fp.core);
      blossom.position.set(fx, fy, fz);
      blossom.scale.setScalar(fs);
      blossom.rotation.x = fz * 0.35;
      blossom.rotation.z = -fx * 0.35;
      centerGroup.add(blossom);
    });
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

  // --- 4. ของตกแต่งเสริมพิเศษรอบกระทง (ปรับขนาดแยกแต่ละชิ้นได้ 0.6x–1.6x) ---
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

  parsed.accessories.forEach((accId, idx) => {
    const anchor = accessoryAnchorMap[accId] || [
      Math.cos((idx * Math.PI) / 3) * 0.56,
      0.25,
      Math.sin((idx * Math.PI) / 3) * 0.56
    ];
    const scale = parsed.accessoryScales[accId] ?? 1;
    addAccessory3D(accId, anchor, scale, group, assets, anim);
  });

  // วงแหวนแสงสีทองรอบกระทงตัวเอง (isMine)
  if (isMine) {
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(assets.haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.02;
    group.add(halo);
    anim.waterHalo = halo;
  }

  return { group, anim };
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
}

/**
 * คืนหน่วยความจำ GPU ของชิ้นส่วนที่สร้างเฉพาะตัว (ไม่แตะ Shared Assets)
 */
export function disposeKrathong3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry && !obj.geometry.userData?.shared) {
        obj.geometry.dispose();
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!m) return;
        const std = m as THREE.MeshStandardMaterial;
        if (std.map && !std.map.userData?.shared) std.map.dispose();
        if (std.bumpMap && !std.bumpMap.userData?.shared) std.bumpMap.dispose();
        m.dispose();
      });
    }
  });
}
