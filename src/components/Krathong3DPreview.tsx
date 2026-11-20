// src/components/Krathong3DPreview.tsx
// หน้าต่างแสดงตัวอย่างกระทง 3 มิติแบบ Real-time สำหรับหน้าแต่งกระทง
// รองรับโหมดเต็มพื้นที่ (Full-Bleed) คู่ผิวน้ำริ้วคลื่น ใบไม้/ดอกไม้ลอยน้ำ และมุมกล้องสูงเฉียง ~58°

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Rotate3D } from 'lucide-react';
import {
  buildKrathong3D,
  animateKrathong3D,
  disposeKrathong3D,
  type KrathongAnimHandles,
  type KrathongScaleTargets
} from '../three/krathongBuilder';
import { createRealisticRiverWater, type WaterSystem } from '../three/waterShader';
import { isWebGLAvailable } from '../three/krathongThumbnail';
import { parseCandleConfig } from '../utils/krathongConfig';
import { KrathongVisual } from './KrathongVisual';

interface Krathong3DPreviewProps {
  baseType: string;
  flowerType: string;
  candleColor: string;
  compact?: boolean;
  fullBleed?: boolean;
  paused?: boolean;
  pulseNonce?: number;
}

type CameraPreset = 'angled' | 'top';

const ANGLE_DEFAULT_POS = new THREE.Vector3(0, 2.08, 1.52);
const TOP_VIEW_POS = new THREE.Vector3(0, 2.78, 0.36);
const CAMERA_TARGET = new THREE.Vector3(0, 0.22, 0);

function getStructureKey(
  baseType: string,
  flowerType: string,
  candleId: string,
  accessories: string[]
): string {
  return `${baseType}|${flowerType}|${candleId}|${accessories.join(',')}`;
}

interface PreviewWaterAccent {
  x: number;
  z: number;
  rotY: number;
  phase: number;
  scale: number;
  driftSpeed: number;
}

export const Krathong3DPreview: React.FC<Krathong3DPreviewProps> = ({
  baseType,
  flowerType,
  candleColor,
  compact = false,
  fullBleed = false,
  paused = false,
  pulseNonce = 0
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglReady] = useState<boolean>(() => isWebGLAvailable());
  const [viewMode, setViewMode] = useState<CameraPreset>('angled');

  const parsedCandle = useMemo(() => parseCandleConfig(candleColor), [candleColor]);
  const structureKey = getStructureKey(
    baseType,
    flowerType,
    parsedCandle.candleId,
    parsedCandle.accessories
  );

  const sceneRef = useRef<THREE.Scene | null>(null);
  const krathongGroupRef = useRef<THREE.Group | null>(null);
  const animHandlesRef = useRef<KrathongAnimHandles | null>(null);
  const scaleTargetsRef = useRef<KrathongScaleTargets | null>(null);
  const builtStructureKeyRef = useRef<string>('');
  const latestCandleColorRef = useRef<string>(candleColor);

  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const initialModelPropsRef = useRef({ baseType, flowerType, candleColor });
  const pausedRef = useRef<boolean>(paused);
  const reflectionDirtyRef = useRef<boolean>(true);
  const resumeLoopRef = useRef<(() => void) | null>(null);
  const pulseStartRef = useRef<number | null>(null);
  const prevPulseNonceRef = useRef<number>(pulseNonce);

  // ตั้งค่า Three.js Scene + Rippling Water + Floating Leaves/Blooms + OrbitControls
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !webglReady) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.15 : 1.25);
    const width = Math.max(112, container.clientWidth);
    const height = Math.max(112, container.clientHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ระบบแสงเหลืองทองอบอุ่น
    const hemi = new THREE.HemisphereLight(0xfff3c4, 0x2b1d11, 1.18);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 1.55);
    keyLight.position.set(2.5, 4.5, 3.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.95);
    rimLight.position.set(-2.5, 2.0, -2.5);
    scene.add(rimLight);

    // ผิวน้ำเต็มพื้นที่พร้อมริ้วคลื่นแนวนอนและเงาสะท้อนกระทง
    const water: WaterSystem = createRealisticRiverWater({
      width: 18,
      depth: 18,
      isCircularPond: false,
      isPreview: true,
      hasReflection: !compact,
      reflectionWidth: 224,
      reflectionHeight: 224
    });
    scene.add(water.mesh);

    // ใบไม้และกลีบดอกไม้เล็กๆ ลอยประดับผิวน้ำรอบกระทง (2 InstancedMeshes = 2 Draw Calls)
    const leafGeo = new THREE.SphereGeometry(0.14, 7, 5);
    leafGeo.scale(1.65, 0.14, 0.68);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
    const leafInst = new THREE.InstancedMesh(leafGeo, leafMat, 6);
    const leafPositions: PreviewWaterAccent[] = [
      { x: -1.75, z: -1.45, rotY: 0.5, phase: 0.2, scale: 1.05, driftSpeed: 0.08 },
      { x: -2.35, z: 1.35, rotY: 1.2, phase: 1.4, scale: 1.25, driftSpeed: 0.06 },
      { x: 1.65, z: 0.35, rotY: -0.4, phase: 2.3, scale: 0.9, driftSpeed: 0.07 },
      { x: 2.25, z: -1.85, rotY: 2.1, phase: 3.1, scale: 0.95, driftSpeed: 0.05 },
      { x: -0.25, z: -2.25, rotY: 0.85, phase: 4.0, scale: 1.1, driftSpeed: 0.07 },
      { x: 1.45, z: 1.95, rotY: -1.1, phase: 5.2, scale: 0.85, driftSpeed: 0.06 }
    ];
    const leafColors = [0x84cc16, 0x65a30d, 0xa3e635, 0xd97706, 0x84cc16, 0xeab308];
    const accentColor = new THREE.Color();
    for (let i = 0; i < leafPositions.length; i++) {
      accentColor.setHex(leafColors[i % leafColors.length]);
      leafInst.setColorAt(i, accentColor);
    }
    if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;
    scene.add(leafInst);

    const bloomGeo = new THREE.SphereGeometry(0.11, 8, 6);
    bloomGeo.scale(1.12, 0.45, 1.12);
    const bloomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42 });
    const bloomInst = new THREE.InstancedMesh(bloomGeo, bloomMat, 6);
    const bloomPositions: PreviewWaterAccent[] = [
      { x: 1.85, z: 1.05, rotY: 0.4, phase: 0.7, scale: 1.15, driftSpeed: 0.06 },
      { x: 1.95, z: -1.35, rotY: 1.6, phase: 1.9, scale: 1.0, driftSpeed: 0.08 },
      { x: -2.05, z: -0.65, rotY: 2.4, phase: 2.8, scale: 0.85, driftSpeed: 0.07 },
      { x: -1.45, z: 1.75, rotY: 0.9, phase: 3.6, scale: 0.92, driftSpeed: 0.05 },
      { x: 0.85, z: -2.35, rotY: 1.1, phase: 4.5, scale: 0.95, driftSpeed: 0.06 },
      { x: -0.75, z: 2.15, rotY: 2.9, phase: 5.4, scale: 0.88, driftSpeed: 0.07 }
    ];
    const bloomColors = [0xf59e0b, 0xf97316, 0xfbbf24, 0xf472b6, 0xf59e0b, 0xfb923c];
    for (let i = 0; i < bloomPositions.length; i++) {
      accentColor.setHex(bloomColors[i % bloomColors.length]);
      bloomInst.setColorAt(i, accentColor);
    }
    if (bloomInst.instanceColor) bloomInst.instanceColor.needsUpdate = true;
    scene.add(bloomInst);

    const accentDummy = new THREE.Object3D();

    const camera = new THREE.PerspectiveCamera(compact ? 42 : fullBleed ? 40 : 39, width / height, 0.1, 40);
    camera.position.copy(ANGLE_DEFAULT_POS);
    camera.lookAt(CAMERA_TARGET);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(CAMERA_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI * 0.44;
    controls.update();

    const handleUserInteract = () => {
      targetCameraPosRef.current = null;
    };
    controls.addEventListener('start', handleUserInteract);

    // สร้างโมเดลกระทงเริ่มต้นทันทีที่ mount
    const initProps = initialModelPropsRef.current;
    const initParsed = parseCandleConfig(initProps.candleColor);
    const initial = buildKrathong3D({
      baseType: initProps.baseType,
      flowerType: initProps.flowerType,
      candleColor: initProps.candleColor,
      withFlameLight: true
    });
    krathongGroupRef.current = initial.group;
    animHandlesRef.current = initial.anim;
    scaleTargetsRef.current = initial.scaleTargets;
    builtStructureKeyRef.current = getStructureKey(
      initProps.baseType,
      initProps.flowerType,
      initParsed.candleId,
      initParsed.accessories
    );
    reflectionDirtyRef.current = true;
    scene.add(initial.group);

    let animId = 0;
    let isDisposed = false;
    let isRunning = false;
    let frameCount = 0;
    let elapsedSec = 0;
    let lastNow = performance.now();

    const shouldPause = () => isDisposed || document.hidden || pausedRef.current;

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(112, container.clientWidth);
      const h = Math.max(112, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      reflectionDirtyRef.current = true;
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);

    const renderLoop = (now: number) => {
      if (shouldPause()) {
        isRunning = false;
        animId = 0;
        return;
      }

      const dt = Math.min(Math.max((now - lastNow) * 0.001, 0), 0.1);
      lastNow = now;
      elapsedSec += dt;

      if (targetCameraPosRef.current) {
        camera.position.lerp(targetCameraPosRef.current, 0.14);
        if (camera.position.distanceTo(targetCameraPosRef.current) < 0.02) {
          camera.position.copy(targetCameraPosRef.current);
          targetCameraPosRef.current = null;
        }
      }

      controls.update();

      const kGroup = krathongGroupRef.current;
      if (kGroup) {
        kGroup.position.y = Math.sin(elapsedSec * 2.0) * 0.018;
        kGroup.rotation.z = Math.sin(elapsedSec * 1.4) * 0.016;
        kGroup.rotation.x = Math.cos(elapsedSec * 1.6) * 0.012;

        if (pulseStartRef.current !== null) {
          const t = Math.min(1, (now - pulseStartRef.current) / 520);
          const easeOut = 1 - (1 - t) ** 3;
          kGroup.rotation.y = Math.PI * 0.55 * easeOut * (1 - t * 0.15) * (t < 1 ? Math.sin(t * Math.PI) : 0);
          const pulseScale = 1 + Math.sin(t * Math.PI) * 0.065;
          kGroup.scale.setScalar(pulseScale);
          if (t >= 1) {
            pulseStartRef.current = null;
            kGroup.rotation.y = 0;
            kGroup.scale.setScalar(1);
          }
        }
      }

      for (let i = 0; i < leafPositions.length; i++) {
        const lp = leafPositions[i];
        const lx = lp.x + Math.sin(elapsedSec * 0.45 + lp.phase) * 0.16;
        const lz = lp.z + Math.cos(elapsedSec * 0.38 + lp.phase) * 0.12;
        const ly = Math.sin(lx * 0.8 + elapsedSec * 1.1) * Math.cos(lz * 2.4 - elapsedSec * 1.6) * 0.018 + 0.016;
        accentDummy.position.set(lx, ly, lz);
        accentDummy.rotation.set(0.06 * Math.sin(elapsedSec + lp.phase), lp.rotY + elapsedSec * lp.driftSpeed, 0.04);
        accentDummy.scale.setScalar(lp.scale);
        accentDummy.updateMatrix();
        leafInst.setMatrixAt(i, accentDummy.matrix);
      }
      leafInst.instanceMatrix.needsUpdate = true;

      for (let i = 0; i < bloomPositions.length; i++) {
        const bp = bloomPositions[i];
        const bx = bp.x + Math.cos(elapsedSec * 0.4 + bp.phase) * 0.14;
        const bz = bp.z + Math.sin(elapsedSec * 0.35 + bp.phase) * 0.11;
        const by = Math.sin(bx * 0.8 + elapsedSec * 1.1) * Math.cos(bz * 2.4 - elapsedSec * 1.6) * 0.018 + 0.022;
        accentDummy.position.set(bx, by, bz);
        accentDummy.rotation.set(0.05, bp.rotY - elapsedSec * bp.driftSpeed, 0.04 * Math.cos(elapsedSec + bp.phase));
        accentDummy.scale.setScalar(bp.scale);
        accentDummy.updateMatrix();
        bloomInst.setMatrixAt(i, accentDummy.matrix);
      }
      bloomInst.instanceMatrix.needsUpdate = true;

      if (animHandlesRef.current) {
        animateKrathong3D(animHandlesRef.current, elapsedSec);
      }

      water.update(elapsedSec);
      // Render reflection at 30Hz (and immediately whenever scene/model state changes)
      if (frameCount === 0 || reflectionDirtyRef.current || frameCount % 2 === 0) {
        water.renderReflection(renderer, scene, camera);
        reflectionDirtyRef.current = false;
      }
      frameCount++;
      renderer.render(scene, camera);

      animId = requestAnimationFrame(renderLoop);
    };

    const resumeLoop = () => {
      if (isRunning || shouldPause()) return;
      isRunning = true;
      lastNow = performance.now();
      animId = requestAnimationFrame(renderLoop);
    };
    resumeLoopRef.current = resumeLoop;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reflectionDirtyRef.current = true;
        resumeLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resumeLoop();

    return () => {
      isDisposed = true;
      isRunning = false;
      resumeLoopRef.current = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animId) cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      controls.removeEventListener('start', handleUserInteract);
      controls.dispose();
      if (krathongGroupRef.current) {
        scene.remove(krathongGroupRef.current);
        disposeKrathong3D(krathongGroupRef.current);
        krathongGroupRef.current = null;
      }
      animHandlesRef.current = null;
      scaleTargetsRef.current = null;
      builtStructureKeyRef.current = '';
      leafInst.dispose();
      leafGeo.dispose();
      leafMat.dispose();
      bloomInst.dispose();
      bloomGeo.dispose();
      bloomMat.dispose();
      water.dispose();
      renderer.dispose();
      sceneRef.current = null;
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglReady, compact, fullBleed]);

  // พัก/ปลุกลูปเรนเดอร์ 3D อัตโนมัติเมื่อเปิด Modal ทับหน้าแต่งกระทง
  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) {
      reflectionDirtyRef.current = true;
      resumeLoopRef.current?.();
    }
  }, [paused]);

  useEffect(() => {
    latestCandleColorRef.current = candleColor;
  }, [candleColor]);

  // สร้างโมเดล 3D ใหม่เฉพาะเมื่อเปลี่ยนโครงสร้าง (ฐาน ดอกไม้ สีเทียน หรือรายการของเสริม) เท่านั้น
  useEffect(() => {
    initialModelPropsRef.current = {
      baseType,
      flowerType,
      candleColor: latestCandleColorRef.current
    };
    const scene = sceneRef.current;
    if (!scene || builtStructureKeyRef.current === structureKey) return;

    if (krathongGroupRef.current) {
      scene.remove(krathongGroupRef.current);
      disposeKrathong3D(krathongGroupRef.current);
    }

    const built = buildKrathong3D({
      baseType,
      flowerType,
      candleColor: latestCandleColorRef.current,
      withFlameLight: true
    });
    krathongGroupRef.current = built.group;
    animHandlesRef.current = built.anim;
    scaleTargetsRef.current = built.scaleTargets;
    builtStructureKeyRef.current = structureKey;
    reflectionDirtyRef.current = true;
    scene.add(built.group);
  }, [structureKey, baseType, flowerType]);

  // ปรับขนาดพุ่มดอกไม้กลางและของเสริมแบบ Real-time ทันทีโดยไม่สร้าง Mesh ใหม่
  useEffect(() => {
    const targets = scaleTargetsRef.current;
    if (!targets) return;
    targets.centerGroup.scale.setScalar(parsedCandle.centerScale);
    targets.accessoryGroups.forEach((accGroup, accId) => {
      accGroup.scale.setScalar(parsedCandle.accessoryScales[accId] ?? 1);
    });
    reflectionDirtyRef.current = true;
  }, [parsedCandle]);

  // แอนิเมชันตอบสนองแบบหมุนนุ่ม+เด้งเบาๆ เมื่อเลือกไอเดียหรือสุ่มกระทงใหม่
  useEffect(() => {
    if (pulseNonce > 0 && pulseNonce !== prevPulseNonceRef.current) {
      pulseStartRef.current = performance.now();
      reflectionDirtyRef.current = true;
      resumeLoopRef.current?.();
    }
    prevPulseNonceRef.current = pulseNonce;
  }, [pulseNonce]);

  const handleToggleCameraView = () => {
    const nextMode: CameraPreset = viewMode === 'angled' ? 'top' : 'angled';
    setViewMode(nextMode);
    targetCameraPosRef.current = nextMode === 'top' ? TOP_VIEW_POS.clone() : ANGLE_DEFAULT_POS.clone();
    reflectionDirtyRef.current = true;
  };

  if (!webglReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a4f5c]">
        <KrathongVisual
          baseType={baseType}
          flowerType={flowerType}
          candleColor={candleColor}
          size={compact ? 'sm' : 'md'}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative select-none ${
        fullBleed
          ? 'w-full h-full bg-[#0a4f5c]'
          : compact
            ? 'w-28 h-28 rounded-2xl overflow-hidden bg-[radial-gradient(circle_at_50%_55%,#149cb3_0%,#083e4a_85%)]'
            : 'w-full h-60 sm:h-64 rounded-2xl overflow-hidden bg-[radial-gradient(circle_at_50%_55%,#149cb3_0%,#083e4a_85%)]'
      }`}
    >
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* แคปซูลแนะนำการหมุนตรงกลางล่าง (ตามภาพตัวอย่างที่ 4) */}
      {!compact && (
        <span
          className={`pointer-events-none px-3.5 py-1.5 rounded-full text-[11px] font-medium bg-[#fdfaf4]/95 text-[#2a1f16] border border-amber-900/15 shadow-md z-10 whitespace-nowrap ${
            fullBleed
              ? 'hidden sm:inline-flex absolute bottom-4 left-1/2 -translate-x-1/2'
              : 'absolute bottom-2 left-2.5'
          }`}
        >
          ลากเพื่อหมุนดูรอบๆ
        </span>
      )}

      {/* ปุ่มสลับมุมมอง เอียง 3D (~58°) / มุมตรงด้านบน */}
      <button
        type="button"
        onClick={handleToggleCameraView}
        title={viewMode === 'angled' ? 'สลับเป็นมุมมองตรงจากด้านบน' : 'กลับสู่มุมมองเอียง 3 มิติ'}
        className={`absolute ${
          compact
            ? 'bottom-1 right-1 px-1.5 py-0.5 text-[9px]'
            : fullBleed
              ? 'bottom-4 right-3 sm:right-4 px-3 py-1.5 text-[11px] font-semibold'
              : 'bottom-2 right-2 px-2.5 py-1 text-[11px]'
        } flex items-center space-x-1.5 rounded-full bg-[#fdfaf4]/95 hover:bg-white text-[#2a1f16] border border-amber-900/15 shadow-md transition-all duration-150 active:scale-95 cursor-pointer z-10`}
      >
        <Rotate3D className={compact ? 'w-2.5 h-2.5 text-amber-700' : 'w-3.5 h-3.5 text-amber-700'} />
        <span>{compact ? (viewMode === 'angled' ? 'บน' : '3D') : viewMode === 'angled' ? 'มุมตรงด้านบน' : 'มุมเอียง 3D'}</span>
      </button>
    </div>
  );
};
