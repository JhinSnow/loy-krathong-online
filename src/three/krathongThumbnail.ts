// src/three/krathongThumbnail.ts
// Shared Offscreen Three.js Renderer (WebGL Context กลางเพียง 1 ตัว + LRU Cache)
// สำหรับสร้างภาพกระทง 3 มิติแบบ PNG Data URL ใช้ใน WishesGallery, ShareCardModal และ Modal รายละเอียด

import * as THREE from 'three';
import { buildKrathong3D, disposeKrathong3D } from './krathongBuilder';

const MAX_CACHE_ENTRIES = 120;
const thumbCache = new Map<string, string>();
const inFlightMap = new Map<string, Promise<string | null>>();

interface OffscreenEngine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

let engine: OffscreenEngine | null = null;
let webglChecked = false;
let webglSupported = false;

export function isWebGLAvailable(): boolean {
  if (webglChecked) return webglSupported;
  webglChecked = true;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    webglSupported = false;
    return false;
  }
  try {
    const testCanvas = document.createElement('canvas');
    const gl =
      testCanvas.getContext('webgl2') ||
      testCanvas.getContext('webgl') ||
      testCanvas.getContext('experimental-webgl');
    webglSupported = Boolean(gl);
  } catch {
    webglSupported = false;
  }
  return webglSupported;
}

function getOffscreenEngine(): OffscreenEngine | null {
  if (!isWebGLAvailable()) return null;
  if (engine) return engine;

  try {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power'
    });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();

    const hemi = new THREE.HemisphereLight(0xc7d2fe, 0x1e293b, 0.95);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    keyLight.position.set(2.5, 4.2, 3.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfbbf24, 0.95);
    rimLight.position.set(-2.8, 2.2, -2.5);
    scene.add(rimLight);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20);
    camera.position.set(0.32, 1.85, 2.55);
    camera.lookAt(0, 0.34, 0);

    engine = { renderer, scene, camera };
    return engine;
  } catch {
    webglSupported = false;
    return null;
  }
}

interface RenderJob {
  key: string;
  baseType: string;
  flowerType: string;
  candleColor: string;
  pixelSize: number;
  resolve: (val: string | null) => void;
}

const renderQueue: RenderJob[] = [];
let queueScheduled = false;

function processRenderQueue(): void {
  queueScheduled = false;
  const eng = getOffscreenEngine();
  if (!eng) {
    while (renderQueue.length > 0) {
      renderQueue.shift()?.resolve(null);
    }
    return;
  }

  // เรนเดอร์สูงสุด 2 ภาพต่อเฟรม เพื่อไม่ให้หน้าเว็บสะดุดเมื่อเปิดหลายการ์ดพร้อมกัน
  let budget = 2;
  while (budget > 0 && renderQueue.length > 0) {
    const job = renderQueue.shift()!;
    budget--;

    const cached = thumbCache.get(job.key);
    if (cached) {
      job.resolve(cached);
      continue;
    }

    try {
      eng.renderer.setSize(job.pixelSize, job.pixelSize, false);
      const { group } = buildKrathong3D({
        baseType: job.baseType,
        flowerType: job.flowerType,
        candleColor: job.candleColor,
        withFlameLight: true
      });
      eng.scene.add(group);
      eng.renderer.render(eng.scene, eng.camera);
      const dataUrl = eng.renderer.domElement.toDataURL('image/png');
      eng.scene.remove(group);
      disposeKrathong3D(group);

      if (thumbCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = thumbCache.keys().next().value;
        if (oldestKey) thumbCache.delete(oldestKey);
      }
      thumbCache.set(job.key, dataUrl);
      job.resolve(dataUrl);
    } catch {
      job.resolve(null);
    }
  }

  if (renderQueue.length > 0 && !queueScheduled) {
    queueScheduled = true;
    requestAnimationFrame(processRenderQueue);
  }
}

export function getCachedKrathongThumb3D(
  baseType: string,
  flowerType: string,
  candleColor: string,
  pixelSize = 256
): string | null {
  const key = `${baseType}|${flowerType}|${candleColor}|${pixelSize}`;
  return thumbCache.get(key) || null;
}

export function renderKrathongThumb3D(
  baseType: string,
  flowerType: string,
  candleColor: string,
  pixelSize = 256
): Promise<string | null> {
  const key = `${baseType}|${flowerType}|${candleColor}|${pixelSize}`;
  const cached = thumbCache.get(key);
  if (cached) return Promise.resolve(cached);

  if (!isWebGLAvailable()) return Promise.resolve(null);

  const pending = inFlightMap.get(key);
  if (pending) return pending;

  const promise = new Promise<string | null>((resolve) => {
    renderQueue.push({
      key,
      baseType,
      flowerType,
      candleColor,
      pixelSize,
      resolve: (val) => {
        inFlightMap.delete(key);
        resolve(val);
      }
    });
    if (!queueScheduled) {
      queueScheduled = true;
      requestAnimationFrame(processRenderQueue);
    }
  });

  inFlightMap.set(key, promise);
  return promise;
}
