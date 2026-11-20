// src/components/RiverCanvas.tsx
// หน้าแม่น้ำเทศกาลลอยกระทง (พื้นหลังสถาปัตยกรรมเดิมโทนอุ่นสีเหลืองทอง + แม่น้ำ 3D ริ้วคลื่น & เงาสะท้อน + กระทง 3D 60 FPS)

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
  MessageSquareHeart,
  X
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

interface RiverBounds {
  zHorizon: number;
  zFar: number;
  zNear: number;
  camZ: number;
  tanHalfFov: number;
  aspect: number;
}

interface SkyStar {
  xFrac: number;
  yFrac: number;
  size: number;
  alpha: number;
  delta: number;
}

interface SkyLantern {
  xFrac: number;
  yFrac: number;
  speedY: number;
  driftX: number;
  size: number;
  alpha: number;
}

interface SkyFireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
}

function getLaneZFromBounds(bounds: RiverBounds, slot?: number): number {
  const { zFar, zNear } = bounds;
  if (typeof slot === 'number') {
    const laneIdx = Math.abs(slot) % 3;
    const t = laneIdx === 0 ? 0.16 : laneIdx === 1 ? 0.52 : 0.88;
    return zFar + (zNear - zFar) * t;
  }
  return zFar + (zNear - zFar) * (0.1 + Math.random() * 0.85);
}

function getHalfSpanAtZ(bounds: RiverBounds, worldZ: number): number {
  const dist = Math.max(4.5, bounds.camZ - worldZ);
  return Math.max(4.6, dist * bounds.tanHalfFov * bounds.aspect * 0.94);
}

export const RiverCanvas: React.FC<RiverCanvasProps> = ({
  myKrathongId,
  justFloated = false,
  enableRealtime = true,
  onNavigateCustomize,
  onNavigateWishes,
  onNavigateAdmin
}) => {
  const skyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady] = useState<boolean>(() => isWebGLAvailable());

  const justFloatedRef = useRef<boolean>(justFloated);
  useEffect(() => {
    justFloatedRef.current = justFloated;
  }, [justFloated]);

  const myKrathongIdRef = useRef<string | null | undefined>(myKrathongId);
  useEffect(() => {
    myKrathongIdRef.current = myKrathongId;
  }, [myKrathongId]);

  const overlayPausedRef = useRef<boolean>(false);
  const resumeLoopRef = useRef<(() => void) | null>(null);

  const boundsRef = useRef<RiverBounds>({
    zHorizon: -18,
    zFar: -11,
    zNear: 2.2,
    camZ: 11.2,
    tanHalfFov: Math.tan(THREE.MathUtils.degToRad(21)),
    aspect: typeof window !== 'undefined' ? window.innerWidth / Math.max(1, window.innerHeight) : 1.77
  });

  const krathongsRef = useRef<KrathongItem[]>([]);
  const pendingQueueRef = useRef<KrathongItem[]>([]);
  const initialLoadedRef = useRef<boolean>(false);
  const botSlotRef = useRef<number>(0);

  const starsRef = useRef<SkyStar[]>([]);
  const lanternsRef = useRef<SkyLantern[]>([]);
  const fireworksRef = useRef<SkyFireworkParticle[]>([]);

  // รายชื่อกระทงที่ลอยอยู่ในฉาก ณ ปัจจุบันสำหรับป้ายคำอวยพร (อัปเดตเมื่อเข้า/ออกเท่านั้น ไม่ re-render ทุกเฟรม)
  const [labelItems, setLabelItems] = useState<KrathongItem[]>([]);
  const labelDomMapRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const sceneEntriesRef = useRef<FloatingKrathong3DEntry[]>([]);
  const sceneAddQueueRef = useRef<KrathongItem[]>([]);
  const removedIdsRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    overlayPausedRef.current = Boolean(selectedKrathong || shareCardKrathong);
    if (!overlayPausedRef.current) {
      resumeLoopRef.current?.();
    }
  }, [selectedKrathong, shareCardKrathong]);

  // จุดพลุโทนทอง-อุ่นบนท้องฟ้าเหนือแนวตึกฟักทอง
  const spawnFireworkBurst = useCallback((customX?: number, customY?: number) => {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const fx = customX ?? winW * (0.2 + Math.random() * 0.6);
    const fy = customY ?? winH * (0.08 + Math.random() * 0.16);
    const palettes = [
      ['#fde047', '#f59e0b', '#fffbeb'],
      ['#fb7185', '#fde047', '#fed7aa'],
      ['#fbbf24', '#fef08a', '#f97316'],
      ['#34d399', '#fde047', '#fffbeb'],
      ['#f472b6', '#fbbf24', '#fef3c7']
    ];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.14;
      const speed = 1.1 + Math.random() * 2.5;
      fireworksRef.current.push({
        x: fx,
        y: fy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: palette[i % palette.length],
        alpha: 1,
        size: 1.5 + Math.random() * 2.0,
        decay: 0.015 + Math.random() * 0.015
      });
    }
    if (fireworksRef.current.length > 260) {
      fireworksRef.current.splice(0, fireworksRef.current.length - 260);
    }
    soundManager.playFireworkSparkle();
  }, []);

  const spawnBot = useCallback((slotIndex?: number): KrathongItem => {
    const sampleBots = [
      {
        name: 'น้องฟ้า',
        wish: 'ขอให้ปีนี้สมหวังทุกประการ และครอบครัวมีแต่ความสุขค่ะ',
        base: 'lotus',
        flower: 'lotus_flower',
        candle: 'pink|sparkler'
      },
      {
        name: 'พี่โชคดี',
        wish: 'ขอขมาพระแม่คงคา กิจการรุ่งเรือง สุขภาพแข็งแรง',
        base: 'banana_leaf',
        flower: 'lotus_flower',
        candle: 'yellow'
      },
      {
        name: 'ชมรมอนุรักษ์',
        wish: 'สืบสานประเพณีไทย รักษ์สายน้ำ Zero-Waste 100%',
        base: 'banana_gold',
        flower: 'pumpkin',
        candle: 'emerald|flag_thai,butterfly'
      }
    ];

    const slot = typeof slotIndex === 'number' ? slotIndex : botSlotRef.current++;
    const pick = sampleBots[Math.abs(slot) % sampleBots.length];
    const z = getLaneZFromBounds(boundsRef.current, slot);
    const halfSpan = getHalfSpanAtZ(boundsRef.current, z);

    return {
      id: `bot-${Date.now()}-${slot}-${Math.floor(Math.random() * 1000)}`,
      user_type: 'general',
      owner_name: pick.name,
      wish_message: pick.wish,
      base_type: pick.base,
      flower_type: pick.flower,
      candle_color: pick.candle,
      x: -halfSpan - 1.1,
      y: z,
      speed: 0.68 + (Math.abs(slot) % 3) * 0.12,
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
        const bounds = boundsRef.current;
        const maxActive = window.innerWidth < 768 ? 7 : 10;

        let overrides = getModerationOverrides();
        try {
          const modRes = await fetch('/api/admin/moderate');
          if (modRes.ok) {
            const modData = (await modRes.json()) as { overrides?: Record<string, string> };
            if (modData.overrides) {
              overrides = mergeModerationOverrides(modData.overrides);
            }
          }
        } catch {}

        const combinedMap = new Map<string, KrathongItem>();
        let supaTotalCount = 0;

        try {
          const { count } = await supabase
            .from('krathongs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');
          if (typeof count === 'number') supaTotalCount = count;

          const { data, error } = await supabase
            .from('krathongs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (!error && data) {
            (data as KrathongItem[]).forEach((item) => {
              const effectiveStatus = overrides[item.id] || item.status || 'approved';
              if (effectiveStatus === 'approved') {
                combinedMap.set(item.id, item);
              }
            });
          }
        } catch {}

        try {
          const apiRes = await fetch('/api/krathongs');
          if (apiRes.ok) {
            const apiData = (await apiRes.json()) as KrathongItem[];
            if (Array.isArray(apiData)) {
              apiData.forEach((item) => {
                const effectiveStatus = overrides[item.id] || item.status || 'approved';
                if (effectiveStatus === 'approved' && !combinedMap.has(item.id)) {
                  combinedMap.set(item.id, item);
                }
              });
            }
          }
        } catch {}

        const localRecords = getLocalKrathongRecords();
        localRecords.forEach((item) => {
          const effectiveStatus = overrides[item.id] || item.status || 'approved';
          if (effectiveStatus === 'approved' && !combinedMap.has(item.id)) {
            combinedMap.set(item.id, item as KrathongItem);
          }
        });

        setTotalFloatedCount(Math.max(supaTotalCount, combinedMap.size));

        const mergedList = Array.from(combinedMap.values()).slice(0, maxActive);
        botSlotRef.current = 0;

        let launchedItem: KrathongItem | null = null;
        const initialBatch: KrathongItem[] = [];

        mergedList.forEach((item, index) => {
          if (containsProfanity(item.owner_name) || containsProfanity(item.wish_message)) return;
          const isMyItem = Boolean(myKrathongId && item.id === myKrathongId);
          const worldZ = isMyItem
            ? bounds.zFar + (bounds.zNear - bounds.zFar) * 0.86
            : getLaneZFromBounds(bounds, index);
          const halfW = getHalfSpanAtZ(bounds, worldZ);
          const span = halfW * 1.65;
          const worldX = isMyItem
            ? justFloatedRef.current
              ? -halfW * 0.85
              : -halfW * 0.35
            : -halfW * 0.82 + (index / Math.max(1, mergedList.length)) * span + (Math.random() - 0.5) * 1.1;

          const krathongObj: KrathongItem = {
            ...item,
            owner_name: sanitizeInputText(item.owner_name, 40),
            wish_message: sanitizeInputText(item.wish_message, 150),
            x: worldX,
            y: worldZ,
            speed: isMyItem ? 0.72 : 0.65 + Math.random() * 0.25,
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
          const halfW = getHalfSpanAtZ(bounds, Number(bot.y) || bounds.zNear);
          bot.x = -halfW * 0.65 + idx * (halfW * 0.65);
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
          const winW = window.innerWidth;
          const winH = window.innerHeight;
          spawnFireworkBurst(winW * 0.28, winH * 0.14);
          setTimeout(() => spawnFireworkBurst(winW * 0.72, winH * 0.16), 450);
          if (justFloatedRef.current) {
            setTimeout(() => spawnFireworkBurst(winW * 0.5, winH * 0.11), 900);
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

      const worldZ = getLaneZFromBounds(boundsRef.current);
      const halfW = getHalfSpanAtZ(boundsRef.current, worldZ);
      const maxActive = window.innerWidth < 768 ? 7 : 10;

      const incomingItem: KrathongItem = {
        ...data,
        owner_name: sanitizeInputText(data.owner_name, 40),
        wish_message: sanitizeInputText(data.wish_message, 150),
        x: -halfW - 1.1,
        y: worldZ,
        speed: 0.7 + Math.random() * 0.25,
        opacity: 1,
        age: 0,
        maxLife: 45,
        isMine: data.id === myKrathongId
      };

      if (krathongsRef.current.length >= maxActive) {
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
      spawnFireworkBurst();
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
  }, [myKrathongId, enableRealtime, spawnBot, spawnFireworkBurst]);

  // 2. Initialize Warm Night Sky Stars & Sky Lanterns (ทำงานใน Single rAF Loop)
  useEffect(() => {
    const stars: SkyStar[] = [];
    for (let i = 0; i < 55; i++) {
      stars.push({
        xFrac: Math.random(),
        yFrac: Math.random() * 0.86,
        size: 0.7 + Math.random() * 1.6,
        alpha: 0.25 + Math.random() * 0.75,
        delta: (0.008 + Math.random() * 0.018) * (Math.random() > 0.5 ? 1 : -1)
      });
    }
    starsRef.current = stars;

    const lanterns: SkyLantern[] = [];
    for (let i = 0; i < 12; i++) {
      lanterns.push({
        xFrac: Math.random(),
        yFrac: Math.random(),
        speedY: 0.025 + Math.random() * 0.035,
        driftX: (Math.random() - 0.5) * 0.01,
        size: 11 + Math.random() * 11,
        alpha: 0.45 + Math.random() * 0.45
      });
    }
    lanternsRef.current = lanterns;
  }, []);

  // 3. Single Unified Animation Loop (2D Warm Night Sky + Three.js 3D Rippling River & Krathongs)
  useEffect(() => {
    const skyCanvas = skyCanvasRef.current;
    const skyCtx = skyCanvas?.getContext('2d', { alpha: false }) ?? null;
    const mount = mountRef.current;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let water: WaterSystem | null = null;
    let krathongContainer: THREE.Group | null = null;
    let petalInst: THREE.InstancedMesh | null = null;
    let petalGeo: THREE.BufferGeometry | null = null;
    let petalMat: THREE.MeshStandardMaterial | null = null;

    interface FloatingPetal {
      x: number;
      z: number;
      speed: number;
      rotY: number;
      phase: number;
      scale: number;
    }
    const floatingPetals: FloatingPetal[] = [];
    const petalDummy = new THREE.Object3D();

    if (mount && webglReady) {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance'
        });
      } catch {
        renderer = null;
      }
    }

    let w = Math.max(1, window.innerWidth);
    let h = Math.max(1, window.innerHeight);

    let cachedSkyGrad: CanvasGradient | null = null;
    let cachedHaloGrad: CanvasGradient | null = null;
    let cachedMoonX = 0;
    let cachedMoonY = 0;
    let cachedMoonR = 0;

    // Pre-render offscreen sky lantern sprite once so renderLoop uses fast drawImage instead of per-frame radial gradients
    const lanternSprite = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (lanternSprite) {
      lanternSprite.width = 64;
      lanternSprite.height = 64;
      const lCtx = lanternSprite.getContext('2d');
      if (lCtx) {
        const lg = lCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
        lg.addColorStop(0, '#fffbeb');
        lg.addColorStop(0.45, '#f59e0b');
        lg.addColorStop(1, 'rgba(245, 158, 11, 0)');
        lCtx.fillStyle = lg;
        lCtx.beginPath();
        lCtx.arc(32, 32, 30, 0, Math.PI * 2);
        lCtx.fill();

        lCtx.fillStyle = '#f97316';
        lCtx.fillRect(26.5, 24.5, 11, 13.5);
      }
    }

    const syncSkyCanvasSize = () => {
      if (!skyCanvas || !skyCtx) return;
      const skyH = Math.max(120, Math.ceil(h * 0.39));
      skyCanvas.width = w;
      skyCanvas.height = skyH;

      cachedSkyGrad = skyCtx.createLinearGradient(0, 0, 0, skyH);
      cachedSkyGrad.addColorStop(0.0, '#120b06');
      cachedSkyGrad.addColorStop(0.48, '#24160b');
      cachedSkyGrad.addColorStop(0.84, '#362312');
      cachedSkyGrad.addColorStop(1.0, '#221810');

      cachedMoonX = w * 0.82;
      cachedMoonY = skyH * 0.34;
      cachedMoonR = Math.min(w, h) * 0.045;
      cachedHaloGrad = skyCtx.createRadialGradient(
        cachedMoonX,
        cachedMoonY,
        cachedMoonR * 0.4,
        cachedMoonX,
        cachedMoonY,
        cachedMoonR * 3.6
      );
      cachedHaloGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
      cachedHaloGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.20)');
      cachedHaloGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    };

    if (renderer && mount) {
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      mount.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      // แสงโทนเหลืองทองอบอุ่น
      const hemi = new THREE.HemisphereLight(0xfff3c4, 0x2b1d11, 1.05);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xffe8a3, 1.45);
      keyLight.position.set(10, 14, 8);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.85);
      rimLight.position.set(-8, 6, -12);
      scene.add(rimLight);

      camera = new THREE.PerspectiveCamera(42, w / h, 0.2, 120);

      water = createRealisticRiverWater({
        width: 90,
        depth: 44,
        reflectionWidth: w < 768 ? 256 : 512,
        reflectionHeight: w < 768 ? 160 : 256,
        isCircularPond: false,
        hasReflection: true,
        isPreview: false
      });
      scene.add(water.mesh);

      krathongContainer = new THREE.Group();
      scene.add(krathongContainer);

      // กลีบดอกไม้เล็กๆ 24 ชิ้นลอยบนผิวน้ำ (1 InstancedMesh Draw Call)
      petalGeo = new THREE.SphereGeometry(0.085, 6, 5);
      petalGeo.scale(1.15, 0.25, 0.82);
      petalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
      petalInst = new THREE.InstancedMesh(petalGeo, petalMat, 24);
      const pColor = new THREE.Color();
      const petalHexes = [0xf472b6, 0xfbcfe8, 0xfbbf24, 0xf97316, 0xe11d48];

      for (let i = 0; i < 24; i++) {
        floatingPetals.push({
          x: (Math.random() - 0.5) * 20,
          z: -10 + Math.random() * 12,
          speed: 0.45 + Math.random() * 0.35,
          rotY: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI * 2,
          scale: 0.7 + Math.random() * 0.65
        });
        pColor.setHex(petalHexes[i % petalHexes.length]);
        petalInst.setColorAt(i, pColor);
      }
      if (petalInst.instanceColor) petalInst.instanceColor.needsUpdate = true;
      scene.add(petalInst);
    }

    const projectNdcYToRiverZ = (cam: THREE.PerspectiveCamera, ndcY: number): number => {
      const ndcPt = new THREE.Vector3(0, ndcY, 0.5).unproject(cam);
      const rayDir = ndcPt.sub(cam.position).normalize();
      const t = Math.abs(rayDir.y) > 0.001 ? -cam.position.y / rayDir.y : 25;
      return cam.position.z + rayDir.z * t;
    };

    let isDisposed = false;
    let isRunning = false;
    let frameCount = 0;
    let reflectionDirty = true;

    const updateLayoutAndCamera = () => {
      w = Math.max(1, window.innerWidth);
      h = Math.max(1, window.innerHeight);
      syncSkyCanvasSize();
      reflectionDirty = true;

      if (!renderer || !camera || !water) return;

      const aspect = w / h;
      const fov = aspect < 1 ? Math.min(62, 42 / Math.max(0.68, aspect)) : 42;
      const camY = aspect < 1 ? 4.2 : 3.6;
      const camZ = aspect < 1 ? 12.6 : 11.2;

      camera.fov = fov;
      camera.aspect = aspect;
      camera.position.set(0, camY, camZ);
      camera.lookAt(0, 0.55, -3.2);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      // ตำแหน่งเส้นขอบน้ำจริง (y = 37.8% จากด้านบนจอ ซิงก์รอยต่อแบบนุ่มนวลกับฐานตึกฟักทอง)
      const zHorizon = projectNdcYToRiverZ(camera, 1 - 2 * 0.378);
      const zFar = projectNdcYToRiverZ(camera, aspect < 1 ? 0.14 : 0.15);
      const zNear = projectNdcYToRiverZ(camera, aspect < 1 ? -0.34 : -0.45);

      boundsRef.current = {
        zHorizon,
        zFar,
        zNear,
        camZ,
        tanHalfFov: Math.tan(THREE.MathUtils.degToRad(fov * 0.5)),
        aspect
      };

      water.mesh.position.set(0, 0, zHorizon + 22 - 0.1);
      water.setShoreZ(zHorizon);

      const maxDpr = w < 768 ? 1.25 : 1.5;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(w, h);
    };

    updateLayoutAndCamera();
    window.addEventListener('resize', updateLayoutAndCamera);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleSceneClick = (ev: MouseEvent) => {
      const targetEl = renderer?.domElement || skyCanvas;
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();

      if (renderer && camera && krathongContainer) {
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
            if (found) {
              setSelectedKrathong(found);
              return;
            }
          }
        }
      }

      if (ev.clientY - rect.top < rect.height * 0.42) {
        spawnFireworkBurst(ev.clientX, ev.clientY);
      }
    };

    const clickTarget = renderer?.domElement || skyCanvas;
    clickTarget?.addEventListener('click', handleSceneClick);

    const syncLabelItems = () => {
      setLabelItems(sceneEntriesRef.current.map((e) => e.item));
    };

    const addKrathongEntryToScene = (item: KrathongItem) => {
      if (!krathongContainer) return;
      if (sceneEntriesRef.current.some((e) => e.item.id === item.id)) return;
      const isMine = Boolean(item.isMine || item.id === myKrathongIdRef.current);
      const { group, anim } = buildKrathong3D({
        baseType: item.base_type,
        flowerType: item.flower_type,
        candleColor: item.candle_color,
        isMine,
        withFlameLight: isMine
      });

      const bounds = boundsRef.current;
      const mobileScale = w < 640 ? 0.72 : 0.88;
      const depthT = THREE.MathUtils.clamp(
        ((Number(item.y) || bounds.zNear) - bounds.zFar) / Math.max(0.5, bounds.zNear - bounds.zFar),
        0,
        1
      );
      const finalScale = mobileScale * (0.86 + depthT * 0.24);

      const worldZ =
        typeof item.y === 'number'
          ? THREE.MathUtils.clamp(item.y, bounds.zFar - 0.5, bounds.zNear + 0.6)
          : getLaneZFromBounds(bounds);
      const halfSpan = getHalfSpanAtZ(bounds, worldZ);
      const worldX = typeof item.x === 'number' ? item.x : -halfSpan - 1.1;

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
        worldSpeed: item.speed || 0.72,
        age: item.age || 0,
        maxLife: item.maxLife || 45,
        opacity: 1,
        scale: finalScale,
        phase: Math.random() * Math.PI * 2,
        justLaunched: Boolean(isMine && justFloatedRef.current)
      });
    };

    const renderWarmNightSky = (dtNorm: number) => {
      if (!skyCtx || !skyCanvas) return;
      const sw = skyCanvas.width;
      const sh = skyCanvas.height;

      // ท้องฟ้ายามค่ำคืนโทนอุ่นสีน้ำตาลทองนวล (กลมกลืนไร้แถบน้ำตาลขอบล่าง)
      skyCtx.fillStyle = cachedSkyGrad || '#120b06';
      skyCtx.fillRect(0, 0, sw, sh);

      // ดวงดาวระยิบระยับสีทองนวล (ใช้ fillStyle คงที่และปรับ globalAlpha แทนการสร้างสตริงใหม่ทุกเฟรม)
      const stars = starsRef.current;
      skyCtx.fillStyle = '#fef3c7';
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.alpha += s.delta * dtNorm;
        if (s.alpha >= 1) {
          s.alpha = 1;
          s.delta = -Math.abs(s.delta);
        } else if (s.alpha <= 0.2) {
          s.alpha = 0.2;
          s.delta = Math.abs(s.delta);
        }
        skyCtx.globalAlpha = s.alpha;
        skyCtx.beginPath();
        skyCtx.arc(s.xFrac * sw, s.yFrac * sh, s.size, 0, Math.PI * 2);
        skyCtx.fill();
      }
      skyCtx.globalAlpha = 1;

      // พระจันทร์วันเพ็ญสีเหลืองทองนวล + แสงรัศมีอุ่น (Cached Gradient)
      if (cachedHaloGrad) {
        skyCtx.fillStyle = cachedHaloGrad;
        skyCtx.beginPath();
        skyCtx.arc(cachedMoonX, cachedMoonY, cachedMoonR * 3.6, 0, Math.PI * 2);
        skyCtx.fill();
      }

      skyCtx.fillStyle = '#fef3c7';
      skyCtx.beginPath();
      skyCtx.arc(cachedMoonX, cachedMoonY, cachedMoonR, 0, Math.PI * 2);
      skyCtx.fill();

      // โคมลอยสีทองอุ่นบนท้องฟ้า (วาดจาก Offscreen Sprite ลด save/restore & createRadialGradient)
      const lanterns = lanternsRef.current;
      if (lanternSprite) {
        for (let i = 0; i < lanterns.length; i++) {
          const l = lanterns[i];
          l.yFrac -= l.speedY * 0.016 * dtNorm;
          l.xFrac += l.driftX * 0.016 * dtNorm;
          if (l.yFrac < -0.1) {
            l.yFrac = 1.05;
            l.xFrac = Math.random();
          }
          const lx = l.xFrac * sw;
          const ly = l.yFrac * sh;
          const drawSize = l.size * 2.4;
          skyCtx.globalAlpha = l.alpha;
          skyCtx.drawImage(lanternSprite, lx - drawSize * 0.5, ly - drawSize * 0.5, drawSize, drawSize);
        }
        skyCtx.globalAlpha = 1;
      }

      // พลุโทนเหลืองทอง-ส้ม-ชมพูบนท้องฟ้า (ไม่เรียก save/restore ต่ออนุภาค)
      const fws = fireworksRef.current;
      let fwWrite = 0;
      for (let i = 0; i < fws.length; i++) {
        const p = fws[i];
        p.x += p.vx * dtNorm;
        p.y += p.vy * dtNorm;
        p.vy += 0.03 * dtNorm;
        p.alpha -= p.decay * dtNorm;
        if (p.alpha <= 0.02 || p.y > sh * 1.1) continue;
        fws[fwWrite++] = p;
        skyCtx.globalAlpha = p.alpha;
        skyCtx.fillStyle = p.color;
        skyCtx.beginPath();
        skyCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        skyCtx.fill();
      }
      skyCtx.globalAlpha = 1;
      fws.length = fwWrite;
    };

    let animId = 0;
    let lastTime = performance.now();
    let elapsedSec = 0;
    let lastQueueReleaseSec = 0;
    let autoFwCooldown = 2.6;
    const projVec = new THREE.Vector3();

    const shouldPause = () => isDisposed || document.hidden || overlayPausedRef.current;

    const renderLoop = (now: number) => {
      if (shouldPause()) {
        isRunning = false;
        animId = 0;
        return;
      }

      const rawDt = Math.min(0.08, Math.max(0.001, (now - lastTime) / 1000));
      const dtNorm = rawDt * 60;
      lastTime = now;
      elapsedSec += rawDt;

      autoFwCooldown -= rawDt;
      if (autoFwCooldown <= 0) {
        spawnFireworkBurst();
        autoFwCooldown = 2.8 + Math.random() * 2.5;
      }

      // วาดท้องฟ้ายามค่ำคืนโทนอุ่น
      renderWarmNightSky(dtNorm);

      if (renderer && scene && camera && water && krathongContainer) {
        let labelListDirty = false;
        const maxActive = w < 768 ? 7 : 10;

        // 1. รับกระทงใหม่เข้าฉาก
        while (sceneAddQueueRef.current.length > 0) {
          const nextItem = sceneAddQueueRef.current.shift()!;
          addKrathongEntryToScene(nextItem);
          labelListDirty = true;
        }

        // 2. ปล่อยจากคิว หรือเติมกระทงตัวอย่างเริ่มต้นให้ครบ 3 ใบ
        if (
          pendingQueueRef.current.length > 0 &&
          krathongsRef.current.length < maxActive &&
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

        // 3. อัปเดตกลีบดอกไม้ลอยบนผิวน้ำ (1 InstancedMesh Draw Call)
        if (petalInst) {
          const bounds = boundsRef.current;
          for (let i = 0; i < floatingPetals.length; i++) {
            const p = floatingPetals[i];
            p.x += p.speed * rawDt;
            p.rotY += 0.35 * rawDt;
            const halfSpan = getHalfSpanAtZ(bounds, p.z);
            if (p.x > halfSpan + 1.2) {
              p.x = -halfSpan - 1.2;
              p.z = bounds.zFar + Math.random() * (bounds.zNear - bounds.zFar);
            }
            const bobY = Math.sin(p.z * 2.4 + p.x * 0.8 - elapsedSec * 1.6 + p.phase) * 0.015 + 0.025;
            petalDummy.position.set(p.x, bobY, p.z);
            petalDummy.rotation.set(0.08 * Math.sin(elapsedSec + p.phase), p.rotY, 0.05);
            petalDummy.scale.setScalar(p.scale);
            petalDummy.updateMatrix();
            petalInst.setMatrixAt(i, petalDummy.matrix);
          }
          petalInst.instanceMatrix.needsUpdate = true;
        }

        // 4. อัปเดตกระทง 3D และป้ายคำอวยพร
        const bounds = boundsRef.current;
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
          entry.item.x = entry.worldX;
          entry.item.y = entry.worldZ;

          const exitHalfSpan = getHalfSpanAtZ(bounds, entry.worldZ) + 1.4;
          if (entry.age > entry.maxLife - 4 || entry.worldX > exitHalfSpan - 1.4) {
            entry.opacity = Math.max(0, entry.opacity - rawDt * 0.55);
          }

          if (entry.opacity <= 0.01 || entry.worldX > exitHalfSpan) {
            krathongContainer.remove(entry.group);
            disposeKrathong3D(entry.group);
            krathongsRef.current = krathongsRef.current.filter((k) => k.id !== entry.item.id);
            labelListDirty = true;
            continue;
          }

          entries[writeIdx++] = entry;

          const launchDrop =
            entry.justLaunched && entry.age < 1.1 ? (1 - entry.age / 1.1) ** 2 * 1.1 : 0;
          const waveY =
            Math.sin(entry.worldX * 0.8 + elapsedSec * 1.1) *
              Math.cos(entry.worldZ * 2.4 - elapsedSec * 1.6) *
              0.018 +
            Math.sin(elapsedSec * 2.2 + entry.phase) * 0.012 +
            launchDrop;

          entry.group.position.set(entry.worldX, waveY, entry.worldZ);
          entry.group.rotation.z = Math.sin(elapsedSec * 1.6 + entry.phase) * 0.032;
          entry.group.rotation.x = Math.cos(elapsedSec * 1.4 + entry.phase) * 0.024;
          entry.group.scale.setScalar(entry.scale * Math.max(0.25, entry.opacity));

          animateKrathong3D(entry.anim, elapsedSec + entry.phase);

          const labelEl = labelDomMapRef.current.get(entry.item.id);
          if (labelEl) {
            projVec.set(entry.worldX, waveY + 1.25 * entry.scale, entry.worldZ);
            projVec.project(camera);

            if (projVec.z > 1 || projVec.z < -1 || projVec.x < -1.12 || projVec.x > 1.12) {
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
          reflectionDirty = true;
          syncLabelItems();
        }

        // 5. อัปเดต Shader ผิวน้ำ + เรนเดอร์ Planar Reflection ที่ 30Hz (ลดภาระ GPU ลงครึ่งหนึ่ง)
        water.update(elapsedSec);
        if (frameCount === 0 || reflectionDirty || frameCount % 2 === 0) {
          water.renderReflection(renderer, scene, camera);
          reflectionDirty = false;
        }
        frameCount++;
        renderer.render(scene, camera);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    const resumeLoop = () => {
      if (isRunning || shouldPause()) return;
      isRunning = true;
      lastTime = performance.now();
      animId = requestAnimationFrame(renderLoop);
    };
    resumeLoopRef.current = resumeLoop;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reflectionDirty = true;
        resumeLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resumeLoop();

    return () => {
      isDisposed = true;
      isRunning = false;
      resumeLoopRef.current = null;
      if (animId) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', updateLayoutAndCamera);
      clickTarget?.removeEventListener('click', handleSceneClick);

      if (krathongContainer) {
        sceneEntriesRef.current.forEach((entry) => {
          krathongContainer!.remove(entry.group);
          disposeKrathong3D(entry.group);
        });
      }
      sceneEntriesRef.current = [];
      if (petalInst) {
        petalInst.dispose();
        petalGeo?.dispose();
        petalMat?.dispose();
      }
      water?.dispose();
      renderer?.dispose();
      if (renderer && mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [webglReady, spawnBot, spawnFireworkBurst]);

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
    <div className="fixed inset-0 w-full h-dvh overflow-hidden overscroll-none bg-[#140e09] select-none">
      {/* Layer 1: ท้องฟ้ายามค่ำคืนโทนอุ่นสีเหลืองทอง + ดวงจันทร์ + ดาว + โคมลอย + พลุ */}
      <canvas
        ref={skyCanvasRef}
        className="w-full h-[39%] absolute top-0 left-0 z-0 pointer-events-none"
      />

      {/* Fallback River Surface เมื่อเครื่องไม่รองรับ WebGL */}
      {!webglReady && (
        <div className="w-full h-[64%] absolute bottom-0 inset-x-0 bg-gradient-to-b from-[#2a1f16] via-[#1c140e] to-[#140e09] z-5" />
      )}

      {/* Layer 2: สถาปัตยกรรมพื้นหลังเดิม (ตึกฟักทอง ม.อ. + วัด/เจดีย์ + ทิวเขาคอหงส์ + โคมไฟตลิ่ง) */}
      <ThaiArchitectureSkyline />

      {/* Layer 3: ผืนน้ำแม่น้ำ 3D ริ้วคลื่นแนวนอน + เงาสะท้อน + กระทง 3D ลอยบนผิวน้ำ */}
      {webglReady && (
        <div
          ref={mountRef}
          className="w-full h-full absolute inset-0 cursor-pointer z-[15]"
        />
      )}

      {/* ลายกนกมุมจอและกอบัวริมตลิ่ง */}
      <DecorativeScreenBorders />

      {/* Layer 4: ป้ายชื่อและคำอวยพรโทนครีมอุ่นลอยตามกระทง 3D */}
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
              className={`absolute top-0 left-0 max-w-[150px] sm:max-w-[210px] px-2.5 py-1.5 rounded-xl border text-left shadow-md transition-colors cursor-pointer ${
                item.isMine
                  ? 'bg-[#fffbeb]/98 border-amber-500 text-[#231912] ring-2 ring-amber-400/55'
                  : 'bg-[#fdfaf4]/95 hover:bg-white border-amber-900/18 text-[#231912]'
              }`}
            >
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-800 truncate leading-tight flex items-center gap-1">
                {item.isMine && <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />}
                <span className="truncate">{item.owner_name}</span>
              </p>
              <p className="text-[9px] sm:text-[10px] text-[#574536] truncate leading-snug">
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
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3.5 p-3 sm:p-3.5 bg-[#fdfaf4]/95 rounded-2xl border border-amber-900/15 text-[#231912] shadow-xl animate-ui-step">
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#fffbeb] rounded-xl flex items-center justify-center p-1.5 shrink-0 border border-amber-900/15 shadow-sm">
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
                      enableRealtime ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                  <p className="font-extrabold text-sm tracking-wide text-[#231912] whitespace-nowrap">สแกนร่วมลอยกระทง</p>
                </div>
                <p className="text-[11px] text-[#574536] mt-0.5 font-medium whitespace-nowrap">
                  เปิดหน้าสร้างกระทง 3D บนมือถือทันที
                </p>
                <p className="text-[10px] text-[#231912] font-mono mt-1.5 px-2 py-0.5 rounded-lg bg-[#f4ecdd] inline-block border border-amber-900/15">
                  {window.location.hostname === 'localhost'
                    ? 'loykrathong-online.pages.dev/?mode=create'
                    : `${window.location.host}/?mode=create`}
                </p>
                <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] text-[#7c5d3a] whitespace-nowrap">
                    {enableRealtime ? 'โหมดจอเวที (Realtime 3D)' : 'โหมดผู้ร่วมงาน'}
                  </span>
                  <a
                    href="/qr-create.png"
                    download="QR-LoyKrathong-Create.png"
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-[#241911] hover:bg-[#38271a] text-[#fffbeb] font-semibold transition whitespace-nowrap"
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
                className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-amber-50 text-[#574536] hover:text-[#231912] border border-amber-900/15 transition-all duration-150 shadow-2xs cursor-pointer active:scale-95"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsQrExpanded(true)}
              title="คลิกเพื่อขยาย QR Code สำหรับสแกนลอยกระทง"
              className="group flex items-center space-x-2 px-3 py-2 bg-[#fdfaf4]/95 hover:bg-white rounded-xl border border-amber-900/15 text-[#231912] shadow-lg transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-amber-100 text-amber-800 group-hover:bg-amber-200/70">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold tracking-wide">สแกนร่วมงาน</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-700 group-hover:translate-y-0.5 transition-transform" />
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
            <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#fdfaf4]/95 border border-amber-900/15 text-[10px] sm:text-xs text-[#231912] shadow-md">
              <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                ร่วมลอยแล้ว <strong className="text-amber-800 font-extrabold">{totalFloatedCount.toLocaleString()}</strong> ใบ
              </span>
            </div>

            {launchNoticeKrathong && (
              <div className="mt-2.5 pointer-events-auto inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-[#fdfaf4]/95 border border-amber-900/15 text-xs text-[#231912] shadow-lg max-w-[92vw] animate-ui-step">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  กระทง 3D ของ <strong className="text-amber-800">{launchNoticeKrathong.owner_name}</strong> กำลังลอยลงสู่สายน้ำแล้ว
                </span>
                <button
                  type="button"
                  onClick={() => setShareCardKrathong(launchNoticeKrathong)}
                  className="px-2.5 py-0.5 rounded-lg bg-[#241911] hover:bg-[#38271a] text-[#fffbeb] font-semibold transition active:scale-95 cursor-pointer"
                >
                  การ์ด E-Card
                </button>
                <button
                  type="button"
                  onClick={() => setLaunchNoticeKrathong(null)}
                  aria-label="ปิดข้อความแจ้งเตือน"
                  className="p-1 rounded-lg text-[#7c5d3a] hover:text-[#231912] hover:bg-amber-50 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 sm:space-x-2 bg-[#fdfaf4]/95 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-amber-900/15 shadow-2xl z-30 max-w-[95vw]">
        <button
          onClick={onNavigateCustomize}
          className="flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] font-extrabold rounded-full shadow-sm border border-amber-600/25 transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer text-xs sm:text-sm"
        >
          <Sparkles className="w-4 h-4 text-[#231912] shrink-0" />
          <span>สร้างกระทงของคุณ</span>
        </button>

        <button
          onClick={onNavigateWishes}
          title="อ่านคำอวยพรของทุกคน"
          className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 bg-white hover:bg-amber-50 text-[#231912] border border-amber-900/15 rounded-full text-xs sm:text-sm font-semibold shadow-2xs transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <MessageSquareHeart className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="hidden sm:inline">รวมคำอวยพร</span>
          <span className="sm:hidden">คำอวยพร</span>
        </button>

        {myKrathongId && (
          <button
            onClick={handleFindMyKrathong}
            title="ดูกระทงของฉัน"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-2 bg-amber-100 hover:bg-amber-200/75 text-amber-950 border border-amber-400/60 rounded-full text-xs sm:text-sm font-semibold shadow-2xs transition-all duration-150 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="hidden sm:inline">ดูกระทงของฉัน</span>
          </button>
        )}

        <button
          onClick={handleToggleAudio}
          title={isAudioPlaying ? 'ปิดเสียงเพลงเปียโนและสายน้ำ' : 'เปิดเสียงเพลงลอยกระทง (เปียโน) และสายน้ำ'}
          className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 rounded-full border text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap ${
            isAudioPlaying
              ? 'bg-amber-100 border-amber-500 text-[#231912] shadow-2xs'
              : 'bg-white hover:bg-amber-50 text-[#574536] border-amber-900/15'
          }`}
        >
          {isAudioPlaying ? (
            <Volume2 className="w-4 h-4 text-amber-700 shrink-0" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#7c5d3a] shrink-0" />
          )}
          <span className="hidden md:inline">{isAudioPlaying ? 'เพลงเปียโน: เปิด' : 'เปิดเพลงเปียโน'}</span>
        </button>

        <button
          onClick={() => setShowWishLabels((prev) => !prev)}
          title={showWishLabels ? 'ซ่อนป้ายคำอวยพรเหนือกระทง' : 'แสดงป้ายคำอวยพรเหนือกระทง'}
          className={`hidden sm:inline-flex items-center space-x-1 px-3 py-2 rounded-full border text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-150 active:scale-95 ${
            showWishLabels
              ? 'bg-white border-amber-900/15 text-[#231912] hover:bg-amber-50'
              : 'bg-[#f4ecdd] border-amber-900/15 text-[#7c5d3a] hover:text-[#231912]'
          }`}
        >
          {showWishLabels ? <Eye className="w-3.5 h-3.5 text-amber-700" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>ป้ายคำอวยพร</span>
        </button>

        <button
          onClick={toggleFullscreen}
          title="เปิด/ปิด โหมดเต็มจอสำหรับขึ้นจอใหญ่"
          className="hidden sm:inline-flex p-2 bg-white hover:bg-amber-50 text-[#231912] rounded-full border border-amber-900/15 transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowControls(!showControls)}
          title="ซ่อนแถบควบคุมสำหรับฉายโปรเจกเตอร์"
          className="hidden sm:inline-flex px-3 py-2 bg-white hover:bg-amber-50 text-[#574536] font-semibold text-xs rounded-full border border-amber-900/15 whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer"
        >
          {showControls ? 'ซ่อน UI' : 'แสดง UI'}
        </button>

        <button
          onClick={onNavigateAdmin}
          title="เข้าสู่แผงควบคุมผู้ดูแล"
          className="p-2 bg-white hover:bg-amber-50 text-[#574536] hover:text-[#231912] rounded-full border border-amber-900/15 transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Krathong Details Modal */}
      {selectedKrathong && (
        <div className="fixed inset-0 bg-[#1c140d]/70 flex items-center justify-center p-4 z-50 animate-ui-fade">
          <div className="bg-[#fdfaf4] border border-amber-900/15 text-[#231912] rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-ui-modal">
            <div className="flex items-center justify-center mb-3">
              <div className="w-28 h-28 rounded-2xl bg-[radial-gradient(circle_at_50%_60%,#332417_0%,#1c140e_85%)] border border-amber-900/20 flex items-center justify-center overflow-hidden shadow-inner">
                <KrathongThumb3D
                  baseType={selectedKrathong.base_type}
                  flowerType={selectedKrathong.flower_type}
                  candleColor={selectedKrathong.candle_color}
                  size="sm"
                />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-[#231912]">{selectedKrathong.owner_name}</h3>
            <p className="text-xs text-[#7c5d3a] mt-0.5 font-medium">
              ประเภท: {selectedKrathong.user_type === 'student' ? 'นักศึกษา' : selectedKrathong.user_type === 'staff' ? 'บุคลากร' : 'บุคคลทั่วไป'}
            </p>
            <div className="my-4 p-4 bg-[#fffbeb] border border-amber-300/80 rounded-2xl text-[#2a1f16] text-sm italic leading-relaxed">
              &ldquo;{selectedKrathong.wish_message}&rdquo;
            </div>
            {selectedKrathong.isMine && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#241911] text-[#fffbeb] rounded-full text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>นี่คือกระทงของคุณ</span>
              </span>
            )}
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShareCardKrathong(selectedKrathong);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] font-extrabold rounded-xl border border-amber-600/25 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer text-sm"
              >
                <ImageIcon className="w-4 h-4" />
                <span>ดาวน์โหลดการ์ดที่ระลึก (E-Card)</span>
              </button>
              <button
                onClick={() => setSelectedKrathong(null)}
                className="w-full py-2.5 bg-white hover:bg-amber-50 text-[#231912] border border-amber-900/18 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer text-sm"
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
