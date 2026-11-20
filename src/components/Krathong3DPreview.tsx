// src/components/Krathong3DPreview.tsx
// หน้าต่างแสดงตัวอย่างกระทง 3 มิติแบบ Real-time สำหรับหน้าแต่งกระทง
// มุมกล้องเริ่มต้นมุมสูงเฉียง ~58° (เห็นด้านบน กลีบใบตองรอบขอบ และริ้วน้ำสะท้อนแสงทองแบบภาพตัวอย่าง)

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Rotate3D } from 'lucide-react';
import {
  buildKrathong3D,
  animateKrathong3D,
  disposeKrathong3D,
  type KrathongAnimHandles
} from '../three/krathongBuilder';
import { createRealisticRiverWater, type WaterSystem } from '../three/waterShader';
import { isWebGLAvailable } from '../three/krathongThumbnail';
import { KrathongVisual } from './KrathongVisual';

interface Krathong3DPreviewProps {
  baseType: string;
  flowerType: string;
  candleColor: string;
  compact?: boolean;
}

type CameraPreset = 'angled' | 'top';

const ANGLE_DEFAULT_POS = new THREE.Vector3(0, 2.08, 1.52);
const TOP_VIEW_POS = new THREE.Vector3(0, 2.78, 0.36);
const CAMERA_TARGET = new THREE.Vector3(0, 0.24, 0);

export const Krathong3DPreview: React.FC<Krathong3DPreviewProps> = ({
  baseType,
  flowerType,
  candleColor,
  compact = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglReady] = useState<boolean>(() => isWebGLAvailable());
  const [viewMode, setViewMode] = useState<CameraPreset>('angled');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const krathongGroupRef = useRef<THREE.Group | null>(null);
  const animHandlesRef = useRef<KrathongAnimHandles | null>(null);
  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const initialModelPropsRef = useRef({ baseType, flowerType, candleColor });

  // ตั้งค่า Three.js Scene + Warm Rippling Water + OrbitControls ครั้งเดียวต่อการ Mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !webglReady) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !compact,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.2 : 1.5);
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
    const hemi = new THREE.HemisphereLight(0xfff3c4, 0x2b1d11, 1.15);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 1.55);
    keyLight.position.set(2.5, 4.5, 3.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.95);
    rimLight.position.set(-2.5, 2.0, -2.5);
    scene.add(rimLight);

    // ผิวน้ำเต็มพื้นที่พร้อมริ้วคลื่นสะท้อนแสงทอง (เปิด Planar Reflection ในโหมดเต็มจอ)
    const water: WaterSystem = createRealisticRiverWater({
      width: 10,
      depth: 10,
      isCircularPond: false,
      isPreview: true,
      hasReflection: !compact,
      reflectionWidth: 256,
      reflectionHeight: 256
    });
    scene.add(water.mesh);

    const camera = new THREE.PerspectiveCamera(compact ? 42 : 39, width / height, 0.1, 40);
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
    const initial = buildKrathong3D({
      baseType: initProps.baseType,
      flowerType: initProps.flowerType,
      candleColor: initProps.candleColor,
      withFlameLight: true
    });
    krathongGroupRef.current = initial.group;
    animHandlesRef.current = initial.anim;
    scene.add(initial.group);

    let animId = 0;
    const startTime = performance.now();

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(112, container.clientWidth);
      const h = Math.max(112, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);

    const renderLoop = (now: number) => {
      const elapsedSec = (now - startTime) * 0.001;

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
      }

      if (animHandlesRef.current) {
        animateKrathong3D(animHandlesRef.current, elapsedSec);
      }

      water.update(elapsedSec);
      water.renderReflection(renderer, scene, camera);
      renderer.render(scene, camera);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      controls.removeEventListener('start', handleUserInteract);
      controls.dispose();
      if (krathongGroupRef.current) {
        scene.remove(krathongGroupRef.current);
        disposeKrathong3D(krathongGroupRef.current);
        krathongGroupRef.current = null;
      }
      animHandlesRef.current = null;
      water.dispose();
      renderer.dispose();
      sceneRef.current = null;
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglReady, compact]);

  // อัปเดตเฉพาะตัวโมเดล 3D เมื่อมีการเลือกฐาน ดอกไม้ เทียน ของเสริม หรือปรับขนาด
  useEffect(() => {
    initialModelPropsRef.current = { baseType, flowerType, candleColor };
    const scene = sceneRef.current;
    if (!scene) return;

    if (krathongGroupRef.current) {
      scene.remove(krathongGroupRef.current);
      disposeKrathong3D(krathongGroupRef.current);
    }

    const built = buildKrathong3D({
      baseType,
      flowerType,
      candleColor,
      withFlameLight: true
    });
    krathongGroupRef.current = built.group;
    animHandlesRef.current = built.anim;
    scene.add(built.group);
  }, [baseType, flowerType, candleColor]);

  const handleToggleCameraView = () => {
    const nextMode: CameraPreset = viewMode === 'angled' ? 'top' : 'angled';
    setViewMode(nextMode);
    targetCameraPosRef.current = nextMode === 'top' ? TOP_VIEW_POS.clone() : ANGLE_DEFAULT_POS.clone();
  };

  if (!webglReady) {
    return (
      <KrathongVisual
        baseType={baseType}
        flowerType={flowerType}
        candleColor={candleColor}
        size={compact ? 'sm' : 'md'}
      />
    );
  }

  return (
    <div
      className={`relative select-none ${
        compact ? 'w-28 h-28' : 'w-full h-60 sm:h-64'
      } rounded-2xl overflow-hidden bg-[radial-gradient(circle_at_50%_55%,#2e2217_0%,#140e09_80%)]`}
    >
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ปุ่มสลับมุมมอง เอียง 3D (~58°) / มุมตรงด้านบน */}
      <button
        type="button"
        onClick={handleToggleCameraView}
        title={viewMode === 'angled' ? 'สลับเป็นมุมมองตรงจากด้านบน' : 'กลับสู่มุมมองเอียง 3 มิติ'}
        className={`absolute ${
          compact
            ? 'bottom-1 right-1 px-1.5 py-0.5 text-[9px]'
            : 'bottom-2 right-2 px-2.5 py-1 text-[11px]'
        } flex items-center space-x-1 rounded-full bg-[#1f150d]/88 hover:bg-[#2b1d12] text-amber-200 border border-amber-400/45 shadow transition cursor-pointer z-10`}
      >
        <Rotate3D className={compact ? 'w-2.5 h-2.5 text-amber-300' : 'w-3.5 h-3.5 text-amber-300'} />
        <span>{compact ? (viewMode === 'angled' ? 'บน' : '3D') : viewMode === 'angled' ? 'มุมตรงด้านบน' : 'มุมเอียง 3D'}</span>
      </button>

      {!compact && (
        <span className="absolute bottom-2 left-2.5 text-[10px] text-amber-200/75 pointer-events-none bg-[#1f150d]/75 px-2 py-0.5 rounded-full border border-amber-500/20">
          ลากเพื่อหมุนดู 360°
        </span>
      )}
    </div>
  );
};
