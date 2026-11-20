// src/components/RiverCanvas.tsx
// หน้าแม่น้ำเทศกาลลอยกระทง 3 มิติ (Three.js + Realistic Rippling Water + Planar Reflections + 3D PSU Skyline + Translucent Wish Labels)

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { KrathongItem } from '../types';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  ShieldAlert,
  QrCode,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Leaf,
  Download,
  MessageSquareHeart
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { containsProfanity, sanitizeInputText } from '../utils/security';
import { getLocalKrathongRecords, getModerationOverrides, mergeModerationOverrides } from '../utils/evaluationHelpers';
import { ThaiArchitectureSkyline } from './ThaiArchitectureSkyline';
import { DecorativeScreenBorders } from './DecorativeScreenBorders';
import { KrathongThumb3D } from './KrathongThumb3D';
import { ShareCardModal } from './ShareCardModal';
import { soundManager } from '../utils/soundEffects';
import {
  buildKrathong3D,
  animateKrathong3D,
  disposeKrathong3D,
  type KrathongAnimHandles
} from '../three/krathongBuilder';
import { createRealisticRiverWater, type WaterSystem } from '../three/waterShader';
import { buildFestivalSkyline3D, type Skyline3DSystem } from '../three/skyline3D';
import { isWebGLAvailable } from '../three/krathongThumbnail';

interface RiverCanvasProps {
  myKrathongId?: string | null;
  justFloated?: boolean;
  enableRealtime?: boolean;
  onNavigateCustomize: () => void;
  onNavigateWishes: () => void;
  onNavigateAdmin: () => void;
}

interface FloatingKrathong3DEntry {
  item: KrathongItem;
  group: THREE.Group;
  anim: KrathongAnimHandles;
  worldX: number;
  worldZ: number;
  worldSpeed: number;
  age: number;
  maxLife: number;
  opacity: number;
  scale: number;
  phase: number;
  justLaunched: boolean;
}

function getLaneZ(winW: number, slot?: number): number {
  const isMobile = winW < 640;
  if (typeof slot === 'number') {
    const laneIdx = Math.abs(slot) % 3;
    return isMobile ? -1.4 + laneIdx * 1.9 : -3.4 + laneIdx * 2.8;
  }
  return isMobile ? -2.2 + Math.random() * 5.2 : -4.4 + Math.random() * 7.8;
}

function getLaneHalfWidth(winW: number, winH: number): number {
  const aspect = winW / Math.max(1, winH);
  return Math.max(5.8, Math.min(12.2, 9.6 * Math.max(0.65, aspect * 0.72)));
}

export const RiverCanvas: React.FC<RiverCanvasProps> = ({
  myKrathongId,
  justFloated = false,
  enableRealtime = true,
  onNavigateCustomize,
  onNavigateWishes,
  onNavigateAdmin
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady] = useState<boolean>(() => isWebGLAvailable());

  const justFloatedRef = useRef<boolean>(justFloated);
  useEffect(() => {
    justFloatedRef.current = justFloated;
  }, [justFloated]);

  const krathongsRef = useRef<KrathongItem[]>([]);
  const pendingQueueRef = useRef<KrathongItem[]>([]);
  const initialLoadedRef = useRef<boolean>(false);
  const botSlotRef = useRef<number>(0);

  // Synced list of currently visible krathongs for projected DOM labels (updates ONLY when items enter/leave)
  const [labelItems, setLabelItems] = useState<KrathongItem[]>([]);
  const labelDomMapRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const sceneEntriesRef = useRef<FloatingKrathong3DEntry[]>([]);
  const sceneAddQueueRef = useRef<KrathongItem[]>([]);
  const removedIdsRef = useRef<Set<string>>(new Set());
  const skylineRef = useRef<Skyline3DSystem | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedKrathong, setSelectedKrathong] = useState<KrathongItem | null>(null);
  const [shareCardKrathong, setShareCardKrathong] = useState<KrathongItem | null>(null);
  const [launchNoticeKrathong, setLaunchNoticeKrathong] = useState<KrathongItem | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showWishLabels, setShowWishLabels] = useState(true);
  const [isQrExpanded, setIsQrExpanded] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() => soundManager.isAudioEnabled());
  const [totalFloatedCount, setTotalFloatedCount] = useState<number>(() => {
    try {
      const overrides = getModerationOverrides();
      return getLocalKrathongRecords().filter(
        (item) => (overrides[item.id] || item.status || 'approved') === 'approved'
      ).length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (!launchNoticeKrathong) return;
    const timer = window.setTimeout(() => setLaunchNoticeKrathong(null), 8000);
    return () => window.clearTimeout(timer);
  }, [launchNoticeKrathong]);

  const spawnFireworkBurst = useCallback((customX?: number, customY?: number) => {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const fx = customX !== undefined ? ((customX / winW) - 0.5) * 18 : undefined;
    const fy = customY !== undefined ? Math.max(4.5, 11 - (customY / winH) * 10) : undefined;
    skylineRef.current?.spawnFirework(fx, fy);
    soundManager.playFireworkSparkle();
  }, []);

  const spawnBot = useCallback((slotIndex?: number): KrathongItem => {
    const sampleBots = [
      {
        name: 'น้องฟ้า',
        wish: 'ขอให้ปีนี้สมหวังทุกประการ และครอบครัวมีแต่ความสุขค่ะ 🌸',
        base: 'lotus',
        flower: 'lotus_flower',
        candle: 'pink|sparkler'
      },
      {
        name: 'พี่โชคดี',
        wish: 'ขอขมาพระแม่คงคา กิจการรุ่งเรือง สุขภาพแข็งแรง 🌕',
        base: 'banana_gold',
        flower: 'pumpkin',
        candle: 'yellow'
      },
      {
        name: 'ชมรมอนุรักษ์',
        wish: 'สืบสานประเพณีไทย รักษ์สายน้ำ Zero-Waste 100% 🪷',
        base: 'peacock_royal',
        flower: 'mixed_garland',
        candle: 'emerald|flag_thai,butterfly'
      }
    ];

    const slot = typeof slotIndex === 'number' ? slotIndex : botSlotRef.current++;
    const pick = sampleBots[Math.abs(slot) % sampleBots.length];
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const halfW = getLaneHalfWidth(winW, winH);

    return {
      id: `bot-${Date.now()}-${slot}-${Math.floor(Math.random() * 1000)}`,
      user_type: 'general',
      owner_name: pick.name,
      wish_message: pick.wish,
      base_type: pick.base,
      flower_type: pick.flower,
      candle_color: pick.candle,
      x: -halfW - 1.2,
      y: getLaneZ(winW, slot),
      speed: 0.65 + (Math.abs(slot) % 3) * 0.1,
      opacity: 1,
      age: 0,
      maxLife: 45,
      isMine: false
    };
  }, []);

  // 1. ดึงประวัติกระทงและฟัง Realtime (Supabase + SSE Fallback + LocalStorage)
  useEffect(() => {
    initialLoadedRef.current = false;
    krathongsRef.current = [];
    pendingQueueRef.current = [];
    sceneAddQueueRef.current = [];
    removedIdsRef.current.clear();

    const fetchRecentKrathongs = async () => {
      try {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const halfW = getLaneHalfWidth(winW, winH);

        let overrides = getModerationOverrides();
        try {
          const modRes = await fetch('/api/admin/moderate');
          if (modRes.ok && (modRes.headers.get('content-type') || '').includes('application/json')) {
            const modData = await modRes.json();
            if (modData.overrides && typeof modData.overrides === 'object') {
              overrides = mergeModerationOverrides(modData.overrides);
            }
          }
        } catch {}

        const localItems = getLocalKrathongRecords().filter(
          (item) => (overrides[item.id] || item.status || 'approved') === 'approved'
        );

        let supaItems: any[] = [];
        let supaTotalCount = 0;
        const hiddenUuidList = Object.entries(overrides)
          .filter(([id, st]) => (st === 'deleted' || st === 'rejected') && /^[0-9a-f-]{36}$/i.test(id))
          .map(([id]) => id)
          .slice(0, 50);

        try {
          let query = supabase
            .from('krathongs')
            .select('*', { count: 'exact' })
            .eq('status', 'approved');

          if (hiddenUuidList.length > 0) {
            query = query.not('id', 'in', `(${hiddenUuidList.join(',')})`);
          }

          const { data, count } = await query
            .order('created_at', { ascending: false })
            .limit(12);
          if (data) supaItems = data;
          if (typeof count === 'number') supaTotalCount = count;
        } catch {}

        const combinedMap = new Map<string, any>();
        localItems.forEach((item) => combinedMap.set(item.id, item));
        supaItems.forEach((item) => {
          const effectiveStatus = overrides[item.id] || item.status || 'approved';
          if (effectiveStatus === 'approved' && !combinedMap.has(item.id)) {
            combinedMap.set(item.id, item);
          }
        });

        setTotalFloatedCount(Math.max(supaTotalCount, combinedMap.size));

        const mergedList = Array.from(combinedMap.values()).slice(0, 12);
        botSlotRef.current = 0;

        let launchedItem: KrathongItem | null = null;
        const initialBatch: KrathongItem[] = [];

        mergedList.forEach((item, index) => {
          if (containsProfanity(item.owner_name) || containsProfanity(item.wish_message)) return;
          const isMyItem = Boolean(myKrathongId && item.id === myKrathongId);
          const span = halfW * 1.65;
          const worldX = isMyItem
            ? justFloatedRef.current
              ? -halfW * 0.85
              : -halfW * 0.45
            : -halfW * 0.82 + (index / Math.max(1, mergedList.length)) * span + (Math.random() - 0.5) * 1.4;

          const krathongObj: KrathongItem = {
            ...item,
            owner_name: sanitizeInputText(item.owner_name, 40),
            wish_message: sanitizeInputText(item.wish_message, 150),
            x: worldX,
            y: isMyItem ? (winW < 640 ? 1.8 : 2.1) : getLaneZ(winW, index),
            speed: isMyItem ? 0.62 : 0.58 + Math.random() * 0.25,
            opacity: 1,
            age: 0,
            maxLife: 45,
            isMine: isMyItem
          };
          initialBatch.push(krathongObj);
          if (isMyItem && justFloatedRef.current) {
            launchedItem = krathongObj;
          }
        });

        while (initialBatch.length < 3) {
          const idx = initialBatch.length;
          const bot = spawnBot(idx);
          bot.x = -halfW * 0.72 + idx * (halfW * 0.72);
          initialBatch.push(bot);
          botSlotRef.current = idx + 1;
        }

        initialBatch.forEach((k) => {
          krathongsRef.current.push(k);
          sceneAddQueueRef.current.push(k);
        });
        initialLoadedRef.current = true;

        if (launchedItem) {
          setLaunchNoticeKrathong(launchedItem);
        }

        if (myKrathongId) {
          skylineRef.current?.spawnFirework(-4.5, 7.2, -13);
          setTimeout(() => skylineRef.current?.spawnFirework(4.5, 7.8, -14), 450);
          if (justFloatedRef.current) {
            setTimeout(() => skylineRef.current?.spawnFirework(0, 8.2, -12.5), 900);
          }
        }
      } catch (err) {
        console.warn('Initial krathongs fetch error:', err);
      } finally {
        initialLoadedRef.current = true;
      }
    };
    fetchRecentKrathongs();

    const handleStorageModerationSync = () => {
      const overrides = getModerationOverrides();
      krathongsRef.current = krathongsRef.current.filter((k) => {
        if (k.id.startsWith('bot-')) return true;
        const status = overrides[k.id];
        if (status === 'rejected' || status === 'deleted') {
          removedIdsRef.current.add(k.id);
          return false;
        }
        return true;
      });
      const localApproved = getLocalKrathongRecords().filter(
        (item) => (overrides[item.id] || item.status || 'approved') === 'approved'
      );
      setTotalFloatedCount((prev) => Math.max(prev, localApproved.length));
    };
    window.addEventListener('storage', handleStorageModerationSync);

    const pushIncomingKrathong = (data: KrathongItem) => {
      const exists =
        krathongsRef.current.some((k) => k.id === data.id) ||
        pendingQueueRef.current.some((k) => k.id === data.id);
      if (exists) return;

      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const halfW = getLaneHalfWidth(winW, winH);

      const incomingItem: KrathongItem = {
        ...data,
        owner_name: sanitizeInputText(data.owner_name, 40),
        wish_message: sanitizeInputText(data.wish_message, 150),
        x: -halfW - 1.2,
        y: getLaneZ(winW),
        speed: 0.62 + Math.random() * 0.25,
        opacity: 1,
        age: 0,
        maxLife: 45,
        isMine: data.id === myKrathongId
      };

      if (krathongsRef.current.length >= 12) {
        if (incomingItem.isMine) {
          pendingQueueRef.current.unshift(incomingItem);
          if (pendingQueueRef.current.length > 60) pendingQueueRef.current.length = 60;
        } else if (pendingQueueRef.current.length < 60) {
          pendingQueueRef.current.push(incomingItem);
        }
      } else {
        krathongsRef.current.push(incomingItem);
        sceneAddQueueRef.current.push(incomingItem);
      }
      setTotalFloatedCount((prev) => prev + 1);
      skylineRef.current?.spawnFirework();
      soundManager.playFireworkSparkle();
    };

    const channel = enableRealtime
      ? supabase
          .channel('realtime_krathongs')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'krathongs' },
            (payload) => {
              const data = payload.new as KrathongItem;
              if (
                data &&
                (data.status === 'approved' || !data.status) &&
                !containsProfanity(data.owner_name) &&
                !containsProfanity(data.wish_message)
              ) {
                pushIncomingKrathong(data);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'krathongs' },
            (payload) => {
              const data = payload.new as KrathongItem;
              if (!data) return;
              if (data.status === 'rejected' || data.status === 'pending') {
                removedIdsRef.current.add(data.id);
                krathongsRef.current = krathongsRef.current.filter((k) => k.id !== data.id);
                pendingQueueRef.current = pendingQueueRef.current.filter((k) => k.id !== data.id);
                setTotalFloatedCount((prev) => Math.max(0, prev - 1));
              } else if (
                data.status === 'approved' &&
                !containsProfanity(data.owner_name) &&
                !containsProfanity(data.wish_message)
              ) {
                pushIncomingKrathong(data);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'krathongs' },
            (payload) => {
              const oldRow = payload.old as { id?: string };
              if (oldRow?.id) {
                removedIdsRef.current.add(oldRow.id);
                krathongsRef.current = krathongsRef.current.filter((k) => k.id !== oldRow.id);
                pendingQueueRef.current = pendingQueueRef.current.filter((k) => k.id !== oldRow.id);
                setTotalFloatedCount((prev) => Math.max(0, prev - 1));
              }
            }
          )
          .subscribe()
      : null;

    const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
    let eventSource: EventSource | null = null;
    if (enableRealtime && !hasSupabaseConfig) {
      try {
        eventSource = new EventSource('/api/krathongs/stream');
        eventSource.addEventListener('new_krathong', (e) => {
          const data = JSON.parse(e.data) as KrathongItem;
          pushIncomingKrathong(data);
        });
      } catch {}
    }

    return () => {
      window.removeEventListener('storage', handleStorageModerationSync);
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (eventSource) eventSource.close();
    };
  }, [myKrathongId, enableRealtime, spawnBot]);

  // 2. Three.js 3D River Render Loop + Planar Water Reflections + Projected Labels
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !webglReady) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: window.innerWidth >= 768,
        alpha: false,
        powerPreference: 'high-performance'
      });
    } catch {
      return;
    }

    let w = Math.max(1, window.innerWidth);
    let h = Math.max(1, window.innerHeight);
    const getMobileAwareDpr = () => Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2);

    renderer.setPixelRatio(getMobileAwareDpr());
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03081a);
    scene.fog = new THREE.FogExp2(0x091128, 0.014);

    // แสงบรรยากาศกลางคืน + แสงจันทร์ + แสงอุ่นจากแนวตลิ่ง
    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x0b132b, 0.85);
    scene.add(hemi);

    const moonLight = new THREE.DirectionalLight(0xfef08a, 1.35);
    moonLight.position.set(16, 14, -22);
    scene.add(moonLight);

    const frontFillLight = new THREE.DirectionalLight(0xfbbf24, 0.72);
    frontFillLight.position.set(-8, 8, 12);
    scene.add(frontFillLight);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.2, 160);
    const updateCameraFrustum = () => {
      w = Math.max(1, window.innerWidth);
      h = Math.max(1, window.innerHeight);
      const aspect = w / h;
      // ขยายมุมมองบนมือถือแนวตั้งเพื่อไม่ให้ขอบซ้าย-ขวาของแม่น้ำและตึกฟักทองแคบเกินไป
      camera.fov = aspect < 1 ? Math.min(68, 45 / Math.max(0.62, aspect * 0.92)) : 45;
      camera.aspect = aspect;
      camera.position.set(0, aspect < 1 ? 3.9 : 3.55, aspect < 1 ? 12.8 : 11.8);
      camera.lookAt(0, 1.45, -5.5);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(getMobileAwareDpr());
      renderer.setSize(w, h);
    };
    updateCameraFrustum();

    // ฉากพื้นหลัง 3 มิติ (ตึกฟักทอง, เจดีย์, วัด, ภูเขา, ดาว, พระจันทร์, โคมลอย, พลุ)
    const skyline = buildFestivalSkyline3D();
    skylineRef.current = skyline;
    scene.add(skyline.root);

    // ผิวน้ำแม่น้ำ 3 มิติพร้อมคลื่นริ้วเล็กๆ และเงาสะท้อน Planar Reflection
    const reflectionSize = w < 768 ? 256 : 512;
    const water: WaterSystem = createRealisticRiverWater({
      width: 72,
      depth: 36,
      reflectionSize,
      isCircularPond: false,
      hasReflection: true
    });
    water.mesh.position.set(0, 0, -2);
    scene.add(water.mesh);

    const krathongContainer = new THREE.Group();
    scene.add(krathongContainer);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleCanvasClick = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(krathongContainer.children, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.krathongId) {
          obj = obj.parent;
        }
        const hitId = obj?.userData?.krathongId;
        if (hitId) {
          const found = krathongsRef.current.find((k) => k.id === hitId);
          if (found) setSelectedKrathong(found);
        }
      } else if (ev.clientY - rect.top < rect.height * 0.56) {
        spawnFireworkBurst(ev.clientX, ev.clientY);
      }
    };
    renderer.domElement.addEventListener('click', handleCanvasClick);
    window.addEventListener('resize', updateCameraFrustum);

    const syncLabelItems = () => {
      setLabelItems(sceneEntriesRef.current.map((e) => e.item));
    };

    const addKrathongEntryToScene = (item: KrathongItem) => {
      if (sceneEntriesRef.current.some((e) => e.item.id === item.id)) return;
      const isMine = Boolean(item.isMine || item.id === myKrathongId);
      const { group, anim } = buildKrathong3D({
        baseType: item.base_type,
        flowerType: item.flower_type,
        candleColor: item.candle_color,
        isMine,
        withFlameLight: isMine
      });

      const mobileScale = w < 640 ? 0.78 : 0.94;
      const depthScale = 0.88 + ((Number(item.y) || 0) + 4) * 0.025;
      const finalScale = mobileScale * Math.max(0.75, Math.min(1.12, depthScale));

      const worldX = typeof item.x === 'number' ? item.x : -getLaneHalfWidth(w, h);
      const worldZ = typeof item.y === 'number' ? item.y : getLaneZ(w);

      group.position.set(worldX, 0, worldZ);
      group.scale.setScalar(finalScale);
      group.userData.krathongId = item.id;
      krathongContainer.add(group);

      sceneEntriesRef.current.push({
        item,
        group,
        anim,
        worldX,
        worldZ,
        worldSpeed: item.speed || 0.65,
        age: item.age || 0,
        maxLife: item.maxLife || 45,
        opacity: 1,
        scale: finalScale,
        phase: Math.random() * Math.PI * 2,
        justLaunched: Boolean(isMine && justFloatedRef.current)
      });
    };

    let animId = 0;
    let lastTime = performance.now();
    let elapsedSec = 0;
    let lastQueueReleaseSec = 0;
    const projVec = new THREE.Vector3();

    const handleVisibilityChange = () => {
      if (!document.hidden) lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const renderLoop = (now: number) => {
      const rawDt = Math.min(0.08, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      elapsedSec += rawDt;

      let labelListDirty = false;

      // 1. รับกระทงใหม่จากคิวรอสร้าง 3D
      while (sceneAddQueueRef.current.length > 0) {
        const nextItem = sceneAddQueueRef.current.shift()!;
        addKrathongEntryToScene(nextItem);
        labelListDirty = true;
      }

      // 2. ปล่อยกระทงจริงจากคิวสำรอง หรือเติมกระทงตัวอย่างให้ครบ 3 ใบเริ่มต้น
      if (
        pendingQueueRef.current.length > 0 &&
        krathongsRef.current.length < 12 &&
        elapsedSec - lastQueueReleaseSec > 1.0
      ) {
        const nextReal = pendingQueueRef.current.shift();
        if (nextReal) {
          krathongsRef.current.push(nextReal);
          addKrathongEntryToScene(nextReal);
          lastQueueReleaseSec = elapsedSec;
          labelListDirty = true;
        }
      } else if (
        initialLoadedRef.current &&
        pendingQueueRef.current.length === 0 &&
        krathongsRef.current.length < 3 &&
        Math.random() < Math.min(0.25, rawDt * 2.5)
      ) {
        const bot = spawnBot();
        krathongsRef.current.push(bot);
        addKrathongEntryToScene(bot);
        labelListDirty = true;
      }

      // 3. อัปเดตตำแหน่ง การโคลงเคลงตามคลื่นน้ำ และ Label Projection ของกระทง 3D ทุกใบ
      const halfSpan = getLaneHalfWidth(w, h) + 2.2;
      const entries = sceneEntriesRef.current;
      let writeIdx = 0;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (removedIdsRef.current.has(entry.item.id)) {
          krathongContainer.remove(entry.group);
          disposeKrathong3D(entry.group);
          removedIdsRef.current.delete(entry.item.id);
          labelListDirty = true;
          continue;
        }

        entry.age += rawDt;
        entry.worldX += entry.worldSpeed * rawDt;

        // ซิงก์ค่าพิกัดกลับไปให้ปุ่ม "ดูกระทงของฉัน"
        entry.item.x = entry.worldX;
        entry.item.y = entry.worldZ;

        if (entry.age > entry.maxLife - 4 || entry.worldX > halfSpan - 1.8) {
          entry.opacity = Math.max(0, entry.opacity - rawDt * 0.45);
        }

        if (entry.opacity <= 0.01 || entry.worldX > halfSpan) {
          krathongContainer.remove(entry.group);
          disposeKrathong3D(entry.group);
          krathongsRef.current = krathongsRef.current.filter((k) => k.id !== entry.item.id);
          labelListDirty = true;
          continue;
        }

        entries[writeIdx++] = entry;

        // คลื่นลอย + ย่อขยายตอนค่อยๆ เลือนหายขอบขวา + แอนิเมชันปล่อยลงน้ำ
        const launchDrop =
          entry.justLaunched && entry.age < 1.1 ? (1 - entry.age / 1.1) ** 2 * 1.1 : 0;
        const waveY =
          Math.sin(entry.worldX * 1.15 - elapsedSec * 1.4 + entry.phase) * 0.03 + launchDrop;

        entry.group.position.set(entry.worldX, waveY, entry.worldZ);
        entry.group.rotation.z = Math.sin(elapsedSec * 1.8 + entry.phase) * 0.04;
        entry.group.rotation.x = Math.cos(elapsedSec * 1.5 + entry.phase) * 0.03;
        entry.group.scale.setScalar(entry.scale * Math.max(0.25, entry.opacity));

        animateKrathong3D(entry.anim, elapsedSec + entry.phase);

        // Project 3D position -> Screen coordinates สำหรับป้ายคำอวยพรโปร่งแสง (ไร้ re-render React)
        const labelEl = labelDomMapRef.current.get(entry.item.id);
        if (labelEl) {
          projVec.set(
            entry.worldX,
            waveY + 1.38 * entry.scale,
            entry.worldZ
          );
          projVec.project(camera);

          if (projVec.z > 1 || projVec.z < -1 || projVec.x < -1.15 || projVec.x > 1.15) {
            labelEl.style.opacity = '0';
            labelEl.style.pointerEvents = 'none';
          } else {
            const sx = (projVec.x * 0.5 + 0.5) * w;
            const sy = (-projVec.y * 0.5 + 0.5) * h;
            labelEl.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
            labelEl.style.opacity = String(Math.min(1, entry.opacity * 0.96));
            labelEl.style.pointerEvents = 'auto';
          }
        }
      }
      entries.length = writeIdx;

      if (labelListDirty) {
        syncLabelItems();
      }

      // 4. อัปเดตฉาก 3D ผิวน้ำ + เรนเดอร์ Planar Reflection สะท้อนบนน้ำจริง + เรนเดอร์ฉากหลัก
      skyline.update(elapsedSec, rawDt);
      water.update(elapsedSec);
      water.renderReflection(renderer, scene, camera);
      renderer.render(scene, camera);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', updateCameraFrustum);
      renderer.domElement.removeEventListener('click', handleCanvasClick);

      sceneEntriesRef.current.forEach((entry) => {
        krathongContainer.remove(entry.group);
        disposeKrathong3D(entry.group);
      });
      sceneEntriesRef.current = [];
      skylineRef.current = null;

      water.dispose();
      skyline.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [webglReady, myKrathongId, spawnBot, spawnFireworkBurst]);

  const handleFindMyKrathong = () => {
    const mine =
      krathongsRef.current.find((k) => k.isMine || k.id === myKrathongId) ||
      pendingQueueRef.current.find((k) => k.isMine || k.id === myKrathongId);
    if (mine) {
      setSelectedKrathong(mine);
    } else {
      alert('กระทงของคุณอาจจะลอยผ่านสายน้ำไปแล้ว หรือกำลังรอการตรวจสอบจากผู้ดูแล');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleToggleAudio = () => {
    const enabled = soundManager.toggleAudio();
    setIsAudioPlaying(enabled);
  };

  return (
    <div className="fixed inset-0 w-full h-dvh overflow-hidden overscroll-none bg-slate-950 select-none">
      {/* 1. ฉากแม่น้ำ 3D เต็มหน้าจอ พร้อมคลื่นริ้วเล็กๆ เงาสะท้อน และสิ่งปลูกสร้าง 3 มิติ */}
      {webglReady ? (
        <div
          ref={mountRef}
          className="w-full h-full absolute inset-0 cursor-pointer z-0"
        />
      ) : (
        <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0b132b] to-[#132245] z-0">
          <ThaiArchitectureSkyline />
        </div>
      )}

      {/* 2. ลายประดับมุมจอและกอบัวริมตลิ่ง (ไม่บังปุ่มกด) */}
      <DecorativeScreenBorders />

      {/* 3. ป้ายชื่อและคำอวยพรโปร่งแสงลอยตามกระทง 3D ทุกใบ (คลิกอ่านเต็ม/สร้าง E-Card ได้) */}
      {showWishLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {labelItems.map((item) => (
            <button
              key={item.id}
              type="button"
              ref={(el) => {
                if (el) {
                  labelDomMapRef.current.set(item.id, el);
                } else {
                  labelDomMapRef.current.delete(item.id);
                }
              }}
              onClick={() => setSelectedKrathong(item)}
              style={{ opacity: 0, willChange: 'transform, opacity' }}
              className={`absolute top-0 left-0 max-w-[146px] sm:max-w-[205px] px-2.5 py-1 rounded-xl backdrop-blur-[2px] border text-left shadow-md transition-colors cursor-pointer ${
                item.isMine
                  ? 'bg-[#1c2845]/82 border-amber-400/80 text-amber-100 ring-1 ring-amber-300/40'
                  : 'bg-[#0b132b]/72 hover:bg-[#121b33]/90 border-amber-400/35 text-amber-50'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-300 truncate leading-tight">
                {item.isMine ? `✨ ${item.owner_name}` : item.owner_name}
              </p>
              <p className="text-[9px] sm:text-[10px] text-amber-50/90 truncate leading-snug">
                {item.wish_message}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Organizer Logo (มุมขวาบน แสดงสังกัดองค์กรผู้จัดงาน SAM SCI 69) */}
      <div className="absolute top-2.5 right-2.5 sm:top-5 sm:right-6 z-30 pointer-events-none select-none">
        <img
          src="/logo-final-notext-white.png"
          alt="SAM SCI 69 Logo"
          className="h-7 sm:h-11 md:h-14 w-auto object-contain opacity-95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        />
      </div>

      {/* Floating QR Code & Stage Mode Watermark (ซ่อนบนมือถือแสดงเฉพาะจอโปรเจกเตอร์/แท็บเล็ต >= md) */}
      {showControls && (
        <div className="hidden md:block absolute top-5 left-5 z-30 transition-all duration-300 ease-in-out">
          {isQrExpanded ? (
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3.5 p-3 sm:p-3.5 bg-[#0b132b]/90 rounded-2xl border border-amber-500/35 text-amber-50 shadow-xl transition-all">
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#fffbeb] rounded-xl flex items-center justify-center p-1.5 shrink-0 border border-amber-300/80 shadow-md">
                <img
                  src="/qr-create.svg"
                  alt="Scan to Float Krathong"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center sm:text-left flex flex-col justify-center self-center sm:self-auto pr-9 sm:pr-10 pt-0.5">
                <div className="flex items-center justify-center sm:justify-start space-x-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      enableRealtime ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  ></span>
                  <p className="font-bold text-sm tracking-wide text-amber-200 whitespace-nowrap">สแกนร่วมลอยกระทง</p>
                </div>
                <p className="text-[11px] text-amber-100/85 mt-0.5 font-medium whitespace-nowrap">
                  เปิดหน้าสร้างกระทง 3D บนมือถือทันที
                </p>
                <p className="text-[10px] text-amber-300 font-mono mt-1.5 px-2 py-0.5 rounded-lg bg-[#0b132b]/80 inline-block border border-amber-500/40 shadow-inner">
                  {window.location.hostname === 'localhost'
                    ? 'loykrathong-online.pages.dev/?mode=create'
                    : `${window.location.host}/?mode=create`}
                </p>
                <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] text-amber-200/75 whitespace-nowrap">
                    {enableRealtime ? 'โหมดจอเวที (Realtime 3D)' : 'โหมดผู้ร่วมงาน'}
                  </span>
                  <a
                    href="/qr-create.png"
                    download="QR-LoyKrathong-Create.png"
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/40 transition whitespace-nowrap"
                  >
                    <Download className="w-3 h-3" />
                    <span>โหลด QR แปะป้าย</span>
                  </a>
                </div>
              </div>

              <button
                onClick={() => setIsQrExpanded(false)}
                title="พับเก็บกล่อง QR Code"
                aria-label="พับเก็บกล่อง QR Code"
                className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 border border-amber-500/40 transition shadow cursor-pointer active:scale-95"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsQrExpanded(true)}
              title="คลิกเพื่อขยาย QR Code สำหรับสแกนลอยกระทง"
              className="group flex items-center space-x-2 px-3 py-2 bg-[#0b132b]/95 hover:bg-[#0b132b] rounded-xl border border-amber-500/45 hover:border-amber-400 text-amber-200 hover:text-amber-100 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 group-hover:bg-amber-500/30">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold tracking-wide">สแกนร่วมงาน</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>
      )}

      {/* Header Central Brand */}
      {showControls && (
        <header className="absolute top-3 sm:top-5 inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none z-30 px-14 sm:px-4">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-lg sm:text-3xl md:text-4xl font-extrabold text-amber-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] tracking-wide whitespace-nowrap">
              เทศกาลลอยกระทงออนไลน์
            </h1>
            <p className="text-[10px] sm:text-sm text-amber-200/90 tracking-[0.2em] sm:tracking-[0.25em] uppercase mt-1 sm:mt-1.5 font-semibold drop-shadow whitespace-nowrap pl-[0.2em] sm:pl-[0.25em]">
              Loy Krathong River of Lights 3D
            </p>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0b132b]/90 border border-emerald-400/35 text-[10px] sm:text-xs text-emerald-100 shadow-md">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                ร่วมลอยแล้ว <strong className="text-amber-300 font-bold">{totalFloatedCount.toLocaleString()}</strong> ใบ
              </span>
            </div>

            {launchNoticeKrathong && (
              <div className="mt-2.5 pointer-events-auto inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0b132b]/95 border border-amber-400/50 text-xs text-amber-100 shadow-lg max-w-[92vw]">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  กระทง 3D ของ <strong className="text-amber-300">{launchNoticeKrathong.owner_name}</strong> กำลังลอยลงสู่สายน้ำแล้ว!
                </span>
                <button
                  type="button"
                  onClick={() => setShareCardKrathong(launchNoticeKrathong)}
                  className="px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/60 text-amber-200 font-semibold transition cursor-pointer"
                >
                  การ์ด E-Card
                </button>
                <button
                  type="button"
                  onClick={() => setLaunchNoticeKrathong(null)}
                  aria-label="ปิดข้อความแจ้งเตือน"
                  className="px-1.5 py-0.5 text-amber-300/70 hover:text-amber-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 sm:space-x-2.5 bg-[#0b132b]/92 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full border border-amber-500/35 shadow-xl z-30 max-w-[95vw]">
        <button
          onClick={onNavigateCustomize}
          className="flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-full shadow-md border border-amber-300/60 transition active:scale-95 whitespace-nowrap cursor-pointer text-xs sm:text-sm"
        >
          <Sparkles className="w-4 h-4 text-stone-950 shrink-0" />
          <span>สร้างกระทงของคุณ</span>
        </button>

        <button
          onClick={onNavigateWishes}
          title="อ่านคำอวยพรของทุกคน"
          className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-[#162038] hover:bg-[#1c2845] text-amber-200 border border-amber-400/45 rounded-full text-xs sm:text-sm font-semibold shadow-sm transition whitespace-nowrap cursor-pointer"
        >
          <MessageSquareHeart className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="hidden sm:inline">รวมคำอวยพร</span>
          <span className="sm:hidden">คำอวยพร</span>
        </button>

        {myKrathongId && (
          <button
            onClick={handleFindMyKrathong}
            title="ดูกระทงของฉัน"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 rounded-full text-xs sm:text-sm font-semibold shadow-sm transition whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">ดูกระทงของฉัน</span>
          </button>
        )}

        <button
          onClick={handleToggleAudio}
          title={isAudioPlaying ? 'ปิดเสียงเพลงเปียโนและสายน้ำ' : 'เปิดเสียงเพลงลอยกระทง (เปียโน) และสายน้ำ'}
          className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-full border text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            isAudioPlaying
              ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-sm'
              : 'bg-slate-900/80 hover:bg-amber-950/40 text-amber-200/80 border-amber-500/30 hover:border-amber-400'
          }`}
        >
          {isAudioPlaying ? (
            <Volume2 className="w-4 h-4 text-amber-300 shrink-0" />
          ) : (
            <VolumeX className="w-4 h-4 shrink-0" />
          )}
          <span className="hidden md:inline">{isAudioPlaying ? 'เพลงเปียโน: เปิด' : 'เปิดเพลงเปียโน'}</span>
        </button>

        <button
          onClick={() => setShowWishLabels((prev) => !prev)}
          title={showWishLabels ? 'ซ่อนป้ายคำอวยพรเหนือกระทง' : 'แสดงป้ายคำอวยพรเหนือกระทง'}
          className={`hidden sm:inline-flex items-center space-x-1 px-3 py-2 rounded-full border text-xs whitespace-nowrap cursor-pointer transition ${
            showWishLabels
              ? 'bg-slate-900/80 border-amber-500/35 text-amber-200 hover:border-amber-400'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-amber-200'
          }`}
        >
          {showWishLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>ป้ายคำอวยพร</span>
        </button>

        <button
          onClick={toggleFullscreen}
          title="เปิด/ปิด โหมดเต็มจอสำหรับขึ้นจอใหญ่"
          className="hidden sm:inline-flex p-2.5 bg-slate-900/80 hover:bg-amber-950/40 text-amber-200 rounded-full border border-amber-500/30 hover:border-amber-400 transition cursor-pointer shrink-0"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowControls(!showControls)}
          title="ซ่อนแถบควบคุมสำหรับฉายโปรเจกเตอร์"
          className="hidden sm:inline-flex px-3 py-2 bg-slate-900/80 hover:bg-amber-950/40 text-amber-200/80 text-xs rounded-full border border-amber-500/30 hover:border-amber-400 whitespace-nowrap cursor-pointer"
        >
          {showControls ? 'ซ่อน UI' : 'แสดง UI'}
        </button>

        <button
          onClick={onNavigateAdmin}
          title="เข้าสู่แผงควบคุมผู้ดูแล"
          className="p-2 sm:p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 rounded-full border border-slate-700 transition cursor-pointer shrink-0"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Krathong Details Modal */}
      {selectedKrathong && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/35 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center mb-2">
              <KrathongThumb3D
                baseType={selectedKrathong.base_type}
                flowerType={selectedKrathong.flower_type}
                candleColor={selectedKrathong.candle_color}
                size="sm"
              />
            </div>
            <h3 className="text-xl font-bold text-amber-200">{selectedKrathong.owner_name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ประเภท: {selectedKrathong.user_type === 'student' ? 'นักศึกษา' : selectedKrathong.user_type === 'staff' ? 'บุคลากร' : 'บุคคลทั่วไป'}
            </p>
            <div className="my-4 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-slate-200 text-sm italic">
              "{selectedKrathong.wish_message}"
            </div>
            {selectedKrathong.isMine && (
              <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-semibold mb-4">
                ✨ นี่คือกระทงของคุณ
              </span>
            )}
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShareCardKrathong(selectedKrathong);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-md transition cursor-pointer text-sm"
              >
                <ImageIcon className="w-4 h-4" />
                <span>📸 ดาวน์โหลดการ์ดที่ระลึก (E-Card)</span>
              </button>
              <button
                onClick={() => setSelectedKrathong(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition cursor-pointer text-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {shareCardKrathong && (
        <ShareCardModal
          ownerName={shareCardKrathong.owner_name}
          wishMessage={shareCardKrathong.wish_message}
          userType={shareCardKrathong.user_type}
          baseType={shareCardKrathong.base_type}
          flowerType={shareCardKrathong.flower_type}
          candleColor={shareCardKrathong.candle_color}
          onClose={() => setShareCardKrathong(null)}
        />
      )}
    </div>
  );
};
