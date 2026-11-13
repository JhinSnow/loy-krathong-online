// src/components/RiverCanvas.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { KrathongItem } from '../types';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  ShieldAlert,
  QrCode,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Leaf,
  Download
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { containsProfanity, sanitizeInputText } from '../utils/security';
import { getLocalKrathongRecords, getModerationOverrides, mergeModerationOverrides } from '../utils/evaluationHelpers';
import { ThaiArchitectureSkyline } from './ThaiArchitectureSkyline';
import { DecorativeScreenBorders } from './DecorativeScreenBorders';
import { KrathongVisual } from './KrathongVisual';
import { ShareCardModal } from './ShareCardModal';
import { soundManager } from '../utils/soundEffects';

interface RiverCanvasProps {
  myKrathongId?: string | null;
  justFloated?: boolean;
  enableRealtime?: boolean;
  onNavigateCustomize: () => void;
  onNavigateAdmin: () => void;
}

export const RiverCanvas: React.FC<RiverCanvasProps> = ({
  myKrathongId,
  justFloated = false,
  enableRealtime = true,
  onNavigateCustomize,
  onNavigateAdmin
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const justFloatedRef = useRef<boolean>(justFloated);
  useEffect(() => {
    justFloatedRef.current = justFloated;
  }, [justFloated]);
  const krathongsRef = useRef<KrathongItem[]>([]);
  const pendingQueueRef = useRef<KrathongItem[]>([]);
  const initialLoadedRef = useRef<boolean>(false);
  const botSlotRef = useRef<number>(0);
  const starsRef = useRef<{ x: number; y: number; size: number; alpha: number; delta: number }[]>([]);
  const lanternsRef = useRef<{ x: number; y: number; speedY: number; speedX: number; size: number; alpha: number }[]>([]);
  const fireworksRef = useRef<
    { x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number; decay: number }[]
  >([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedKrathong, setSelectedKrathong] = useState<KrathongItem | null>(null);
  const [shareCardKrathong, setShareCardKrathong] = useState<KrathongItem | null>(null);
  const [launchNoticeKrathong, setLaunchNoticeKrathong] = useState<KrathongItem | null>(null);
  const [showControls, setShowControls] = useState(true);
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

  // จุดพลุดอกไม้ไฟเฉลิมฉลองบนท้องฟ้าเหนือตึกฟักทอง
  const spawnFireworkBurst = useCallback((customX?: number, customY?: number) => {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const fx = customX ?? winW * (0.2 + Math.random() * 0.6);
    const fy = customY ?? winH * (0.09 + Math.random() * 0.17);
    const palettes = [
      ['#fde047', '#f59e0b', '#fffbeb'],
      ['#fb7185', '#f43f5e', '#fde047'],
      ['#38bdf8', '#fde047', '#e0f2fe'],
      ['#c084fc', '#f472b6', '#fef08a'],
      ['#34d399', '#fde047', '#a7f3d0']
    ];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    const count = 34;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.12;
      const speed = 1.2 + Math.random() * 2.8;
      fireworksRef.current.push({
        x: fx,
        y: fy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: palette[i % palette.length],
        alpha: 1,
        size: 1.6 + Math.random() * 1.6,
        decay: 0.012 + Math.random() * 0.01
      });
    }
    soundManager.playFireworkSparkle();
  }, []);

  // กระทงตัวอย่าง 3 แบบสำหรับแสดงผลเริ่มต้นบนสายน้ำ
  const spawnBot = useCallback((slotIndex?: number): KrathongItem => {
    const sampleBots = [
      {
        name: "น้องฟ้า",
        wish: "ขอให้ปีนี้สมหวังทุกประการ และครอบครัวมีแต่ความสุขค่ะ 🌸",
        base: "lotus",
        flower: "lotus_flower",
        candle: "pink|sparkler"
      },
      {
        name: "พี่โชคดี",
        wish: "ขอขมาพระแม่คงคา กิจการรุ่งเรือง สุขภาพแข็งแรง 🌕",
        base: "banana_gold",
        flower: "marigold",
        candle: "yellow|pumpkin"
      },
      {
        name: "ชมรมอนุรักษ์",
        wish: "สืบสานประเพณีไทย รักษ์สายน้ำ Zero-Waste 100% 🪷",
        base: "peacock_royal",
        flower: "mixed_garland",
        candle: "emerald|flag_thai,butterfly"
      }
    ];

    const slot = typeof slotIndex === 'number' ? slotIndex : botSlotRef.current++;
    const pick = sampleBots[Math.abs(slot) % sampleBots.length];
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

    return {
      id: `bot-${Date.now()}-${slot}-${Math.floor(Math.random() * 1000)}`,
      user_type: 'general',
      owner_name: pick.name,
      wish_message: pick.wish,
      base_type: pick.base,
      flower_type: pick.flower,
      candle_color: pick.candle,
      x: -55,
      y: winH * 0.52 + ((Math.abs(slot) % 3) * 0.12 + Math.random() * 0.08) * winH,
      speed: 1.55 + (Math.abs(slot) % 3) * 0.18,
      opacity: 1,
      age: 0,
      maxLife: 60,
      isMine: false
    };
  }, []);

  // 1. Listen for new krathongs (LocalStorage + Supabase Realtime + SSE Fallback)
  useEffect(() => {
    initialLoadedRef.current = false;
    // 1.1 ดึงประวัติกระทงล่าสุดจากทั้ง LocalStorage และ Supabase
    const fetchRecentKrathongs = async () => {
      try {
        const winH = window.innerHeight;
        const winW = window.innerWidth;

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
        krathongsRef.current = [];
        pendingQueueRef.current = [];
        botSlotRef.current = 0;

        const speedScale = winW < 640 ? 0.72 : 1;
        let launchedItem: KrathongItem | null = null;

        mergedList.forEach((item, index) => {
          if (containsProfanity(item.owner_name) || containsProfanity(item.wish_message)) return;
          const isMyItem = Boolean(myKrathongId && item.id === myKrathongId);
          const krathongObj: KrathongItem = {
            ...item,
            owner_name: sanitizeInputText(item.owner_name, 40),
            wish_message: sanitizeInputText(item.wish_message, 150),
            // หากเพิ่งปล่อยกระทง ให้ลอยออกมาจากริมตลิ่งฝั่งซ้ายอย่างนุ่มนวล
            x: isMyItem ? (justFloatedRef.current ? -20 : 85) : 110 + index * 165 + Math.random() * 40,
            y: isMyItem ? winH * 0.62 : winH * 0.5 + Math.random() * (winH * 0.36),
            speed: (isMyItem ? 1.45 : 1.45 + Math.random() * 0.65) * speedScale,
            opacity: 1,
            age: 0,
            maxLife: 60,
            isMine: isMyItem
          };
          krathongsRef.current.push(krathongObj);
          if (isMyItem && justFloatedRef.current) {
            launchedItem = krathongObj;
          }
        });

        // เติมกระทงตัวอย่างให้รวมบนผิวน้ำไม่เกิน 3 ใบเริ่มต้น
        while (krathongsRef.current.length < 3) {
          const idx = krathongsRef.current.length;
          const bot = spawnBot(idx);
          bot.x = Math.max(80, winW * (0.14 + idx * 0.28));
          bot.speed = (bot.speed || 1.55) * speedScale;
          krathongsRef.current.push(bot);
          botSlotRef.current = idx + 1;
        }
        initialLoadedRef.current = true;

        if (launchedItem) {
          setLaunchNoticeKrathong(launchedItem);
        }

        // จุดพลุฉลองต้อนรับหากผู้ใช้เพิ่งปล่อยกระทงเสร็จ
        if (myKrathongId) {
          spawnFireworkBurst(winW * 0.35, winH * 0.16);
          setTimeout(() => spawnFireworkBurst(winW * 0.65, winH * 0.14), 450);
          if (justFloatedRef.current) {
            setTimeout(() => spawnFireworkBurst(winW * 0.5, winH * 0.2), 900);
          }
        }
      } catch (err) {
        console.warn('Initial krathongs fetch error:', err);
      } finally {
        initialLoadedRef.current = true;
      }
    };
    fetchRecentKrathongs();

    // ซิงก์สถานะการซ่อน/ลบ/อนุมัติจาก LocalStorage เมื่อแอดมินจัดการในอีกแท็บ
    const handleStorageModerationSync = () => {
      const overrides = getModerationOverrides();
      krathongsRef.current = krathongsRef.current.filter((k) => {
        if (k.id.startsWith('bot-')) return true;
        const status = overrides[k.id];
        return status !== 'rejected' && status !== 'deleted';
      });
      const localApproved = getLocalKrathongRecords().filter(
        (item) => (overrides[item.id] || item.status || 'approved') === 'approved'
      );
      setTotalFloatedCount((prev) => Math.max(prev, localApproved.length));
    };
    window.addEventListener('storage', handleStorageModerationSync);

    // 1.2 ฟัง Realtime Broadcast เฉพาะโหมดจอเวที (Stage/Projector Mode) เพื่อไม่ให้เกินโควตา WebSocket บนแผน Free
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
            const exists =
              krathongsRef.current.some((k) => k.id === data.id) ||
              pendingQueueRef.current.some((k) => k.id === data.id);
            if (exists) return;
            const winH = window.innerHeight;
            const incomingItem: KrathongItem = {
              ...data,
              owner_name: sanitizeInputText(data.owner_name, 40),
              wish_message: sanitizeInputText(data.wish_message, 150),
              x: -55,
              y: winH * 0.5 + Math.random() * (winH * 0.36),
              speed: 1.5 + Math.random() * 0.7,
              opacity: 1,
              age: 0,
              maxLife: 60,
              isMine: data.id === myKrathongId
            };
            if (krathongsRef.current.length >= 12) {
              pendingQueueRef.current.push(incomingItem);
            } else {
              krathongsRef.current.push(incomingItem);
            }
            setTotalFloatedCount((prev) => prev + 1);
            spawnFireworkBurst();
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
            // หากแอดมินกดซ่อน ให้ลบออกจากแม่น้ำทันที
            krathongsRef.current = krathongsRef.current.filter((k) => k.id !== data.id);
            pendingQueueRef.current = pendingQueueRef.current.filter((k) => k.id !== data.id);
            setTotalFloatedCount((prev) => Math.max(0, prev - 1));
          } else if (
            data.status === 'approved' &&
            !containsProfanity(data.owner_name) &&
            !containsProfanity(data.wish_message)
          ) {
            // หากแอดมินกดอนุมัติกระทงที่ค้างอยู่ ให้ปล่อยลงแม่น้ำทันที
            const exists =
              krathongsRef.current.some((k) => k.id === data.id) ||
              pendingQueueRef.current.some((k) => k.id === data.id);
            if (!exists) {
              const winH = window.innerHeight;
              const approvedItem: KrathongItem = {
                ...data,
                owner_name: sanitizeInputText(data.owner_name, 40),
                wish_message: sanitizeInputText(data.wish_message, 150),
                x: -55,
                y: winH * 0.5 + Math.random() * (winH * 0.36),
                speed: 1.5 + Math.random() * 0.7,
                opacity: 1,
                age: 0,
                maxLife: 60,
                isMine: data.id === myKrathongId
              };
              if (krathongsRef.current.length >= 12) {
                pendingQueueRef.current.push(approvedItem);
              } else {
                krathongsRef.current.push(approvedItem);
              }
              setTotalFloatedCount((prev) => prev + 1);
              spawnFireworkBurst();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'krathongs' },
        (payload) => {
          const oldRow = payload.old as { id?: string };
          if (oldRow?.id) {
            krathongsRef.current = krathongsRef.current.filter((k) => k.id !== oldRow.id);
            pendingQueueRef.current = pendingQueueRef.current.filter((k) => k.id !== oldRow.id);
            setTotalFloatedCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe()
      : null;

    // เปิด SSE /api/krathongs/stream เฉพาะโหมดจอเวที + Fallback ที่ไม่ได้ใช้ Supabase เพื่อไม่ให้ยิง D1 ซ้ำซ้อน 1,000+ connections
    const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
    let eventSource: EventSource | null = null;
    if (enableRealtime && !hasSupabaseConfig) {
      try {
        eventSource = new EventSource('/api/krathongs/stream');
        eventSource.addEventListener('new_krathong', (e) => {
          const data = JSON.parse(e.data);
          const exists =
            krathongsRef.current.some((k) => k.id === data.id) ||
            pendingQueueRef.current.some((k) => k.id === data.id);
          if (exists) return;
          const winH = window.innerHeight;
          const newK: KrathongItem = {
            ...data,
            x: -55,
            y: winH * 0.5 + Math.random() * (winH * 0.36),
            speed: 1.5 + Math.random() * 0.7,
            opacity: 1,
            age: 0,
            maxLife: 60,
            isMine: data.id === myKrathongId
          };
          if (krathongsRef.current.length >= 12) {
            pendingQueueRef.current.push(newK);
          } else {
            krathongsRef.current.push(newK);
          }
          setTotalFloatedCount((prev) => prev + 1);
          spawnFireworkBurst();
        });
      } catch (_) {}
    }

    return () => {
      window.removeEventListener('storage', handleStorageModerationSync);
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (eventSource) eventSource.close();
    };
  }, [myKrathongId, enableRealtime, spawnBot, spawnFireworkBurst]);

  // 2. Initialize Stars & Floating Sky Lanterns (โคมลอย)
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.45),
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        delta: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
      });
    }
    starsRef.current = stars;

    const lanterns = [];
    for (let i = 0; i < 14; i++) {
      lanterns.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speedY: 0.3 + Math.random() * 0.4,
        speedX: 0.15 + Math.random() * 0.2,
        size: 14 + Math.random() * 18,
        alpha: 0.4 + Math.random() * 0.5
      });
    }
    lanternsRef.current = lanterns;
  }, []);

  // 3. Canvas Render Loop (60/120 FPS Smooth Delta-Time + Offscreen Sprite Caching)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const BASE_COLORS: Record<string, { dark: string; main: string; petal: string; rim: string; baseCup: string }> = {
      banana_leaf: { dark: '#0f291e', main: '#1b4332', petal: '#2d6a4f', rim: '#74c69d', baseCup: '#143628' },
      banana_gold: { dark: '#042f2e', main: '#064e3b', petal: '#047857', rim: '#fbbf24', baseCup: '#064e3b' },
      lotus: { dark: '#831843', main: '#be185d', petal: '#f472b6', rim: '#fbcfe8', baseCup: '#9d174d' },
      lotus_crystal: { dark: '#0c4a6e', main: '#0284c7', petal: '#38bdf8', rim: '#e0f2fe', baseCup: '#0369a1' },
      coconut: { dark: '#2b1810', main: '#432818', petal: '#99582a', rim: '#fde68a', baseCup: '#3b2112' },
      bread: { dark: '#78350f', main: '#b45309', petal: '#f59e0b', rim: '#fef3c7', baseCup: '#92400e' },
      ice_swan: { dark: '#075985', main: '#0284c7', petal: '#7dd3fc', rim: '#ffffff', baseCup: '#0369a1' },
      peacock_royal: { dark: '#713f12', main: '#a16207', petal: '#eab308', rim: '#fde047', baseCup: '#854d0e' }
    };

    const FLOWER_PALETTES: Record<string, { outer: string; core: string }> = {
      marigold: { outer: '#f59e0b', core: '#fef08a' },
      lotus_flower: { outer: '#f43f5e', core: '#fbcfe8' },
      orchid: { outer: '#a855f7', core: '#f3e8ff' },
      jasmine: { outer: '#e2e8f0', core: '#fef9c3' },
      rose: { outer: '#e11d48', core: '#fda4af' },
      dok_kem: { outer: '#ea580c', core: '#fed7aa' },
      anchan: { outer: '#4f46e5', core: '#c7d2fe' },
      mixed_garland: { outer: '#f59e0b', core: '#fef08a' }
    };

    const GARLAND_PALETTE = [
      { outer: '#f59e0b', core: '#fef08a' },
      { outer: '#f43f5e', core: '#ffe4e6' },
      { outer: '#a855f7', core: '#f3e8ff' },
      { outer: '#38bdf8', core: '#e0f2fe' },
      { outer: '#10b981', core: '#d1fae5' }
    ];

    const CANDLE_COLORS: Record<string, string> = {
      yellow: '#fde047',
      red: '#f87171',
      orange: '#fb923c',
      cyan: '#38bdf8',
      pink: '#f472b6',
      emerald: '#34d399',
      purple: '#c084fc',
      rainbow: '#fde047'
    };

    const INCENSE_ANGLES = [-0.14, 0, 0.14];

    // Sprite-sheet dimensions (logical CSS px)
    const SPRITE_W = 264;
    const SPRITE_OX = 132;
    const BODY_H = 152;
    const BODY_OY = 68;
    const BUBBLE_PAD_TOP = 14;
    const BUBBLE_H = 60;

    const drawFoldedPetal = (
      targetCtx: CanvasRenderingContext2D,
      px: number,
      py: number,
      pw: number,
      ph: number,
      tilt: number,
      fill: string,
      rim: string
    ) => {
      targetCtx.save();
      targetCtx.translate(px, py);
      targetCtx.rotate(tilt);
      targetCtx.beginPath();
      targetCtx.moveTo(0, -ph);
      targetCtx.quadraticCurveTo(pw, -ph * 0.25, pw * 0.72, ph * 0.45);
      targetCtx.quadraticCurveTo(0, ph * 0.7, -pw * 0.72, ph * 0.45);
      targetCtx.quadraticCurveTo(-pw, -ph * 0.25, 0, -ph);
      targetCtx.closePath();
      targetCtx.fillStyle = fill;
      targetCtx.fill();
      targetCtx.strokeStyle = rim;
      targetCtx.lineWidth = 1;
      targetCtx.stroke();

      // เส้นพับสันกลีบตรงกลางเพิ่มมิติ
      targetCtx.beginPath();
      targetCtx.moveTo(0, -ph * 0.85);
      targetCtx.lineTo(0, ph * 0.45);
      targetCtx.strokeStyle = 'rgba(255,255,255,0.28)';
      targetCtx.lineWidth = 0.8;
      targetCtx.stroke();
      targetCtx.restore();
    };

    const drawMiniBlossom = (
      targetCtx: CanvasRenderingContext2D,
      bx: number,
      by: number,
      radius: number,
      outerColor: string,
      coreColor: string
    ) => {
      targetCtx.fillStyle = outerColor;
      for (let pet = 0; pet < 6; pet++) {
        const ang = (pet * Math.PI) / 3;
        targetCtx.beginPath();
        targetCtx.arc(bx + Math.cos(ang) * (radius * 0.55), by + Math.sin(ang) * (radius * 0.55), radius * 0.55, 0, Math.PI * 2);
        targetCtx.fill();
      }
      targetCtx.fillStyle = coreColor;
      targetCtx.beginPath();
      targetCtx.arc(bx, by, radius * 0.48, 0, Math.PI * 2);
      targetCtx.fill();
    };

    const renderStaticBackground = (targetCtx: CanvasRenderingContext2D, width: number, height: number) => {
      // --- Background: Sky & Full Moon ---
      const skyGrad = targetCtx.createLinearGradient(0, 0, 0, height * 0.42);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      targetCtx.fillStyle = skyGrad;
      targetCtx.fillRect(0, 0, width, height * 0.42);

      // Full Moon (พระจันทร์วันเพ็ญสีทองสว่าง)
      const moonX = width * 0.82;
      const moonY = height * 0.18;
      const moonR = 48;

      const moonGlow = targetCtx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3);
      moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
      moonGlow.addColorStop(0.5, 'rgba(253, 224, 71, 0.12)');
      moonGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      targetCtx.fillStyle = moonGlow;
      targetCtx.beginPath();
      targetCtx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2);
      targetCtx.fill();

      targetCtx.fillStyle = '#fef08a';
      targetCtx.beginPath();
      targetCtx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      targetCtx.fill();

      // --- River (แม่น้ำเจ้าพระยาจำลอง) ---
      const riverTop = height * 0.38;
      const riverGrad = targetCtx.createLinearGradient(0, riverTop, 0, height);
      riverGrad.addColorStop(0, '#0b132b');
      riverGrad.addColorStop(0.25, '#1c2541');
      riverGrad.addColorStop(0.65, '#0a1128');
      riverGrad.addColorStop(1, '#050a16');
      targetCtx.fillStyle = riverGrad;
      targetCtx.fillRect(0, riverTop, width, height - riverTop);

      // แสงจันทร์และประกายเทียนสีทองสะท้อนผิวน้ำ
      const refGrad = targetCtx.createLinearGradient(moonX - 120, riverTop, moonX + 120, riverTop);
      refGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
      refGrad.addColorStop(0.3, 'rgba(251, 191, 36, 0.1)');
      refGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.28)');
      refGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.1)');
      refGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      targetCtx.fillStyle = refGrad;
      targetCtx.fillRect(moonX - 150, riverTop, 300, height - riverTop);
    };

    interface CachedSprite {
      sig: string;
      canvas: HTMLCanvasElement;
      sw: number;
      bodySh: number;
      bubbleSh: number;
      flameColor: string;
      hasSparkler: boolean;
    }

    const spriteCache = new Map<string, CachedSprite>();
    let fontsCancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!fontsCancelled) {
          spriteCache.clear();
        }
      });
    }

    let w = Math.max(1, window.innerWidth);
    let h = Math.max(1, window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const bgCanvas = document.createElement('canvas');
    const bgCtx = bgCanvas.getContext('2d', { alpha: false });

    const createKrathongSprite = (k: KrathongItem, currentDpr: number): CachedSprite => {
      const [rawCandleColor, rawAccessory] = (k.candle_color || 'yellow').split('|');
      const flameColor = CANDLE_COLORS[rawCandleColor] || '#fde047';
      const accList = (rawAccessory || '').split(',').filter(Boolean);
      const hasAcc = (id: string) => accList.includes(id);
      const hasSparkler = hasAcc('sparkler');

      const sw = Math.ceil(SPRITE_W * currentDpr);
      const bodySh = Math.ceil(BODY_H * currentDpr);
      const bubbleSh = Math.ceil(BUBBLE_H * currentDpr);

      const sheet = document.createElement('canvas');
      sheet.width = sw;
      sheet.height = bodySh + bubbleSh;

      const sCtx = sheet.getContext('2d');
      if (sCtx) {
        sCtx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

        // --- Part 1: Static Krathong Body ---
        sCtx.save();
        sCtx.beginPath();
        sCtx.rect(0, 0, SPRITE_W, BODY_H);
        sCtx.clip();

        const kx = SPRITE_OX;
        const cy = BODY_OY;

        if (k.isMine) {
          sCtx.beginPath();
          sCtx.arc(kx, cy + 10, 68, 0, Math.PI * 2);
          sCtx.fillStyle = 'rgba(234, 179, 8, 0.25)';
          sCtx.fill();
          sCtx.strokeStyle = '#eab308';
          sCtx.lineWidth = 2.5;
          sCtx.setLineDash([6, 4]);
          sCtx.stroke();
          sCtx.setLineDash([]);
        }

        // เงาสะท้อนสีทองใต้กระทง (Static base glow)
        sCtx.save();
        sCtx.globalAlpha = 0.35;
        sCtx.fillStyle = '#f59e0b';
        sCtx.beginPath();
        sCtx.ellipse(kx, cy + 26, 36, 7, 0, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.restore();

        const bStyle = BASE_COLORS[k.base_type] || BASE_COLORS.banana_leaf;

        // แพนหางนกยูง
        if (k.base_type === 'peacock_royal') {
          for (let f = -3; f <= 3; f++) {
            const fx = kx + f * 9.5;
            const fy = cy - 7 - (3 - Math.abs(f)) * 2.5;
            drawFoldedPetal(sCtx, fx, fy, 6, 15, f * 0.18, '#065f46', '#fbbf24');
            sCtx.fillStyle = '#38bdf8';
            sCtx.beginPath();
            sCtx.arc(fx + f * 1.2, fy - 5, 2.5, 0, Math.PI * 2);
            sCtx.fill();
            sCtx.fillStyle = '#fde047';
            sCtx.beginPath();
            sCtx.arc(fx + f * 1.2, fy - 5, 1.2, 0, Math.PI * 2);
            sCtx.fill();
          }
        }

        // กลีบชั้นหลัง (7 กลีบ)
        for (let p = -3; p <= 3; p++) {
          drawFoldedPetal(sCtx, kx + p * 10.5, cy + 1 + Math.abs(p) * 0.8, 8.5, 14, p * 0.11, bStyle.dark, bStyle.rim);
        }

        // กลีบชั้นกลาง (6 กลีบ)
        for (let p = 0; p < 6; p++) {
          const offset = p - 2.5;
          drawFoldedPetal(sCtx, kx + offset * 11.5, cy + 5 + Math.abs(offset) * 0.7, 9, 13, offset * 0.1, bStyle.main, bStyle.rim);
        }

        // ฐานรองกระทงทรงถ้วย
        sCtx.beginPath();
        sCtx.moveTo(kx - 40, cy + 10);
        sCtx.quadraticCurveTo(kx, cy + 18, kx + 40, cy + 10);
        sCtx.lineTo(kx + 32, cy + 21);
        sCtx.quadraticCurveTo(kx, cy + 27, kx - 32, cy + 21);
        sCtx.closePath();
        sCtx.fillStyle = bStyle.baseCup;
        sCtx.fill();
        sCtx.strokeStyle = bStyle.rim;
        sCtx.lineWidth = 1.3;
        sCtx.stroke();

        // แถบคาดดิ้นทอง
        sCtx.beginPath();
        sCtx.moveTo(kx - 35, cy + 16);
        sCtx.quadraticCurveTo(kx, cy + 23, kx + 35, cy + 16);
        sCtx.strokeStyle = '#fbbf24';
        sCtx.lineWidth = 1.2;
        sCtx.stroke();

        // กลีบชั้นหน้า (5 กลีบ)
        for (let p = -2; p <= 2; p++) {
          drawFoldedPetal(sCtx, kx + p * 12.5, cy + 8 + Math.abs(p) * 0.6, 9.5, 11.5, p * 0.08, bStyle.petal, bStyle.rim);
        }

        // เอกลักษณ์พิเศษหงส์น้ำแข็ง / นกยูง
        if (k.base_type === 'ice_swan') {
          sCtx.strokeStyle = '#f0f9ff';
          sCtx.lineWidth = 3;
          sCtx.lineCap = 'round';
          sCtx.beginPath();
          sCtx.moveTo(kx - 28, cy + 8);
          sCtx.bezierCurveTo(kx - 42, cy - 2, kx - 38, cy - 16, kx - 27, cy - 14);
          sCtx.stroke();
          sCtx.beginPath();
          sCtx.moveTo(kx + 28, cy + 8);
          sCtx.bezierCurveTo(kx + 42, cy - 2, kx + 38, cy - 16, kx + 27, cy - 14);
          sCtx.stroke();
          sCtx.fillStyle = '#fbbf24';
          sCtx.beginPath();
          sCtx.arc(kx - 25, cy - 13, 2, 0, Math.PI * 2);
          sCtx.arc(kx + 25, cy - 13, 2, 0, Math.PI * 2);
          sCtx.fill();
        } else if (k.base_type === 'peacock_royal') {
          sCtx.strokeStyle = '#fde047';
          sCtx.lineWidth = 3;
          sCtx.beginPath();
          sCtx.moveTo(kx - 24, cy + 8);
          sCtx.quadraticCurveTo(kx - 34, cy - 6, kx - 24, cy - 15);
          sCtx.stroke();
          sCtx.fillStyle = '#eab308';
          sCtx.beginPath();
          sCtx.arc(kx - 24, cy - 15, 3, 0, Math.PI * 2);
          sCtx.fill();
        }

        // พุ่มดอกไม้มงคล 7 ดอก
        for (let flIdx = 0; flIdx < 7; flIdx++) {
          const pal =
            k.flower_type === 'mixed_garland'
              ? GARLAND_PALETTE[flIdx % GARLAND_PALETTE.length]
              : FLOWER_PALETTES[k.flower_type] || FLOWER_PALETTES.marigold;
          const fx = kx - 24 + flIdx * 8;
          const fy = cy + 2 + Math.sin(flIdx * 1.1) * 2.2;
          drawMiniBlossom(sCtx, fx, fy, 4.8, pal.outer, pal.core);
        }

        // ธูปมงคล 3 ดอก
        INCENSE_ANGLES.forEach((ang, idx) => {
          const ix = kx + (idx - 1) * 3.5;
          const iyTop = cy - 24;
          sCtx.strokeStyle = '#a16207';
          sCtx.lineWidth = 1.1;
          sCtx.beginPath();
          sCtx.moveTo(ix, cy);
          sCtx.lineTo(ix + ang * 18, iyTop);
          sCtx.stroke();

          sCtx.fillStyle = '#ef4444';
          sCtx.beginPath();
          sCtx.arc(ix + ang * 18, iyTop, 1.3, 0, Math.PI * 2);
          sCtx.fill();
        });

        // ตัวเทียนขี้ผึ้ง
        if (rawCandleColor === 'rainbow') {
          sCtx.fillStyle = '#f472b6';
          sCtx.fillRect(kx - 5.5, cy - 19, 4.2, 18);
          sCtx.fillStyle = '#38bdf8';
          sCtx.fillRect(kx + 1.5, cy - 18, 4.2, 17);
        } else {
          sCtx.fillStyle = flameColor;
          sCtx.fillRect(kx - 2.5, cy - 20, 5.5, 19);
          sCtx.strokeStyle = 'rgba(255,255,255,0.55)';
          sCtx.lineWidth = 1;
          sCtx.beginPath();
          sCtx.moveTo(kx - 2.5, cy - 14);
          sCtx.lineTo(kx + 3, cy - 11);
          sCtx.moveTo(kx - 2.5, cy - 8);
          sCtx.lineTo(kx + 3, cy - 5);
          sCtx.stroke();
        }

        // ของตกแต่งเสริม
        if (hasAcc('flag_thai')) {
          sCtx.strokeStyle = '#fbbf24';
          sCtx.lineWidth = 1.2;
          sCtx.beginPath();
          sCtx.moveTo(kx - 16, cy + 1);
          sCtx.lineTo(kx - 16, cy - 23);
          sCtx.stroke();
          sCtx.fillStyle = '#f43f5e';
          sCtx.beginPath();
          sCtx.moveTo(kx - 16, cy - 23);
          sCtx.lineTo(kx - 5, cy - 19);
          sCtx.lineTo(kx - 16, cy - 15);
          sCtx.closePath();
          sCtx.fill();
        }
        if (hasAcc('grad_cap')) {
          sCtx.fillStyle = '#1e293b';
          sCtx.strokeStyle = '#fbbf24';
          sCtx.lineWidth = 1;
          sCtx.beginPath();
          sCtx.moveTo(kx - 11, cy - 16);
          sCtx.lineTo(kx - 4, cy - 13);
          sCtx.lineTo(kx - 11, cy - 10);
          sCtx.lineTo(kx - 18, cy - 13);
          sCtx.closePath();
          sCtx.fill();
          sCtx.stroke();
        }
        if (hasAcc('pumpkin')) {
          sCtx.fillStyle = '#fef3c7';
          sCtx.strokeStyle = '#d97706';
          sCtx.lineWidth = 1.2;
          sCtx.beginPath();
          sCtx.ellipse(kx + 14, cy - 13, 5, 6.5, 0, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.stroke();
        }
        if (hasAcc('heart_sign')) {
          sCtx.fillStyle = '#ec4899';
          sCtx.beginPath();
          sCtx.arc(kx - 23, cy - 5, 4.5, 0, Math.PI * 2);
          sCtx.fill();
        }
        if (hasAcc('lucky_coin')) {
          sCtx.fillStyle = '#fbbf24';
          sCtx.strokeStyle = '#fef08a';
          sCtx.lineWidth = 1;
          sCtx.beginPath();
          sCtx.arc(kx + 23, cy - 5, 5, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.stroke();
        }
        if (hasAcc('butterfly')) {
          sCtx.fillStyle = '#38bdf8';
          sCtx.beginPath();
          sCtx.arc(kx - 13, cy - 26, 3.2, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.fillStyle = '#f472b6';
          sCtx.beginPath();
          sCtx.arc(kx - 8, cy - 26, 3.2, 0, Math.PI * 2);
          sCtx.fill();
        }
        if (hasAcc('noppamas_crown')) {
          sCtx.fillStyle = '#fbbf24';
          sCtx.beginPath();
          sCtx.moveTo(kx - 6, cy - 1);
          sCtx.lineTo(kx, cy - 10);
          sCtx.lineTo(kx + 6, cy - 1);
          sCtx.closePath();
          sCtx.fill();
        }

        sCtx.restore();

        // --- Part 2: Static Speech Bubble (text measurement & glow baked once) ---
        sCtx.save();
        sCtx.translate(0, bodySh / currentDpr);
        sCtx.beginPath();
        sCtx.rect(0, 0, SPRITE_W, BUBBLE_H);
        sCtx.clip();

        const safeOwner = k.owner_name || '';
        const safeWish = k.wish_message || '';

        sCtx.font = 'bold 12px "Sarabun", sans-serif';
        const ownerTextWidth = sCtx.measureText(safeOwner).width;

        sCtx.font = '500 11px "Sarabun", sans-serif';
        const maxWishPixelWidth = 196;
        let displayWish = safeWish;
        if (sCtx.measureText(displayWish).width > maxWishPixelWidth) {
          let cut = displayWish;
          while (cut.length > 0 && sCtx.measureText(cut + '…').width > maxWishPixelWidth) {
            cut = cut.slice(0, -1);
          }
          displayWish = cut + '…';
        }
        const wishTextWidth = sCtx.measureText(displayWish).width;

        const bubbleW = Math.min(230, Math.max(142, Math.max(ownerTextWidth, wishTextWidth) + 22));
        const bubbleH = 36;
        const bx = kx - bubbleW / 2;
        const by = BUBBLE_PAD_TOP;

        sCtx.fillStyle = k.isMine ? '#fef3c7' : '#fffbeb';
        sCtx.beginPath();
        sCtx.roundRect(bx, by, bubbleW, bubbleH, 10);
        sCtx.fill();

        // Soft warm outer glow stroke (zero shadowBlur frame stall)
        sCtx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
        sCtx.lineWidth = 4.5;
        sCtx.stroke();

        sCtx.strokeStyle = k.isMine ? '#d97706' : '#f59e0b';
        sCtx.lineWidth = 1.4;
        sCtx.stroke();

        sCtx.fillStyle = k.isMine ? '#fef3c7' : '#fffbeb';
        sCtx.beginPath();
        sCtx.moveTo(kx - 4, by + bubbleH);
        sCtx.lineTo(kx, by + bubbleH + 6);
        sCtx.lineTo(kx + 4, by + bubbleH);
        sCtx.fill();

        sCtx.fillStyle = '#92400e';
        sCtx.font = 'bold 12px "Sarabun", sans-serif';
        sCtx.fillText(safeOwner, bx + 11, by + 15);

        sCtx.font = '500 11px "Sarabun", sans-serif';
        sCtx.fillStyle = '#1c1917';
        sCtx.fillText(displayWish, bx + 11, by + 30);

        sCtx.restore();
      }

      const sig = `${k.base_type}|${k.flower_type}|${k.candle_color}|${k.owner_name}|${k.wish_message}|${k.isMine ? 1 : 0}|${currentDpr}`;
      return { sig, canvas: sheet, sw, bodySh, bubbleSh, flameColor, hasSparkler };
    };

    const handleResize = () => {
      w = Math.max(1, window.innerWidth);
      h = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (bgCtx) {
        bgCanvas.width = Math.floor(w * dpr);
        bgCanvas.height = Math.floor(h * dpr);
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderStaticBackground(bgCtx, w, h);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animId: number;
    let lastTime = performance.now();
    let smoothDt = 1 / 60;
    let elapsedMs = 0;
    let lastQueueReleaseMs = 0;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      let dt = smoothDt;
      if (rawDt > 0.001 && rawDt <= 0.1) {
        smoothDt = smoothDt * 0.85 + rawDt * 0.15;
        dt = smoothDt;
      }
      const frameScale = dt * 60;
      elapsedMs += dt * 1000;

      // 1. Blit pre-rendered static sky, moon & river background
      ctx.drawImage(bgCanvas, 0, 0, w, h);

      const riverTop = h * 0.38;

      // 2. Sky Elements (clipped cleanly above riverTop horizon)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, riverTop);
      ctx.clip();

      // Stars
      ctx.fillStyle = '#ffffff';
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.alpha += star.delta * frameScale;
        if (star.alpha >= 0.9) {
          star.alpha = 0.9;
          star.delta = -Math.abs(star.delta);
        } else if (star.alpha <= 0.2) {
          star.alpha = 0.2;
          star.delta = Math.abs(star.delta);
        }
        if (star.y - star.size > riverTop) continue;
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lanterns (โคมลอย)
      const lanterns = lanternsRef.current;
      for (let i = 0; i < lanterns.length; i++) {
        const lan = lanterns[i];
        lan.y -= lan.speedY * frameScale;
        lan.x += lan.speedX * frameScale;
        if (lan.y < -50) {
          lan.y = h * 0.7;
          lan.x = Math.random() * w;
        }
        if (lan.y - lan.size * 1.5 > riverTop) continue;

        ctx.globalAlpha = lan.alpha;
        ctx.fillStyle = 'rgba(251, 146, 60, 0.35)';
        ctx.beginPath();
        ctx.arc(lan.x, lan.y, lan.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fdba74';
        ctx.fillRect(lan.x - lan.size * 0.4, lan.y - lan.size * 0.6, lan.size * 0.8, lan.size * 1.2);

        ctx.fillStyle = '#ea580c';
        ctx.fillRect(lan.x - lan.size * 0.2, lan.y + lan.size * 0.4, lan.size * 0.4, lan.size * 0.3);
      }

      // --- Sky Fireworks (พลุดอกไม้ไฟเฉลิมฉลองเหนือตึกฟักทอง, ไร้ shadowBlur รายเฟรม) ---
      const fireworks = fireworksRef.current;
      if (fireworks.length < 15 && Math.random() < Math.min(0.15, 0.007 * frameScale)) {
        spawnFireworkBurst();
      }
      const drag = Math.pow(0.985, frameScale);
      let fwWrite = 0;
      for (let i = 0; i < fireworks.length; i++) {
        const fw = fireworks[i];
        fw.x += fw.vx * frameScale;
        fw.y += fw.vy * frameScale;
        fw.vy += 0.032 * frameScale;
        fw.vx *= drag;
        fw.alpha -= fw.decay * frameScale;
        if (fw.alpha <= 0.02) continue;

        fireworks[fwWrite++] = fw;
        if (fw.y - fw.size * 2.5 > riverTop) continue;

        const alpha = Math.max(0, fw.alpha);
        ctx.fillStyle = fw.color;
        ctx.globalAlpha = alpha * 0.25;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, fw.size * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, fw.size, 0, Math.PI * 2);
        ctx.fill();
      }
      fireworks.length = fwWrite;
      ctx.globalAlpha = 1;
      ctx.restore();

      // 3. Water Ripple Lines with Golden Tint (batched into 2 stroke passes)
      const time = elapsedMs * 0.002;
      const lineSpacing = h * 0.046;

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 13; i += 2) {
        const y = riverTop + 15 + i * lineSpacing;
        ctx.moveTo(0, y + Math.sin(time + i) * 3.5);
        for (let x = 55; x < w; x += 55) {
          ctx.lineTo(x, y + Math.sin(x * 0.016 + time + i) * 3.5);
        }
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 1; i < 13; i += 2) {
        const y = riverTop + 15 + i * lineSpacing;
        ctx.moveTo(0, y + Math.sin(time + i) * 3.5);
        for (let x = 55; x < w; x += 55) {
          ctx.lineTo(x, y + Math.sin(x * 0.016 + time + i) * 3.5);
        }
      }
      ctx.stroke();

      // 4. Release queued real krathongs or maintain at most 3 sample krathongs on river
      const krathongs = krathongsRef.current;
      if (
        pendingQueueRef.current.length > 0 &&
        krathongs.length < 12 &&
        elapsedMs - lastQueueReleaseMs > 900
      ) {
        const nextReal = pendingQueueRef.current.shift();
        if (nextReal) {
          krathongs.push(nextReal);
          lastQueueReleaseMs = elapsedMs;
        }
      } else if (
        initialLoadedRef.current &&
        pendingQueueRef.current.length === 0 &&
        krathongs.length < 3 &&
        Math.random() < Math.min(0.25, 0.045 * frameScale)
      ) {
        krathongs.push(spawnBot());
      }

      // 5. Krathong Lifecycles & Cached Sprite Rendering
      const ripplePulse = Math.sin(elapsedMs * 0.005) * 3;
      const flameHaloPulse = Math.sin(elapsedMs * 0.02) * 2;
      let kWrite = 0;

      for (let i = 0; i < krathongs.length; i++) {
        const k = krathongs[i];
        k.age = (k.age || 0) + dt;
        k.x = (k.x || 0) + (k.speed || 1.5) * frameScale;

        const maxLife = k.maxLife || 60;
        if (k.age > maxLife - 6 || (k.x || 0) > w - 100) {
          k.opacity = Math.max(0, (k.opacity ?? 1) - dt * 0.25);
        }

        const baseAlpha = k.opacity ?? 1;
        if (baseAlpha <= 0 || (k.x || 0) >= w + 150) {
          spriteCache.delete(k.id);
          continue;
        }
        krathongs[kWrite++] = k;

        const kx = (k.x || 0) + 40;
        if (kx + SPRITE_OX < 0 || kx - SPRITE_OX > w) continue;

        const ageSec = k.age || 0;
        const isLaunchingMine = Boolean(k.isMine && justFloatedRef.current && ageSec < 4.5);
        const launchDrop = isLaunchingMine && ageSec < 1.1 ? -Math.pow(1 - ageSec / 1.1, 2) * 28 : 0;

        const wave = Math.sin((k.x || 0) * 0.025 + elapsedMs * 0.003) * 2.5;
        const currentY = (k.y || 500) + wave + launchDrop;

        const expectedSig = `${k.base_type}|${k.flower_type}|${k.candle_color}|${k.owner_name}|${k.wish_message}|${k.isMine ? 1 : 0}|${dpr}`;
        let sprite = spriteCache.get(k.id);
        if (!sprite || sprite.sig !== expectedSig) {
          sprite = createKrathongSprite(k, dpr);
          spriteCache.set(k.id, sprite);
        }

        // A. Animated expanding water ripple ring behind krathong
        ctx.globalAlpha = baseAlpha * 0.35;
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(kx, currentY + 23, 46 + ripplePulse, 8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Extra celebratory water ripples when user's krathong launches onto the river
        if (isLaunchingMine) {
          const ringPhase = (ageSec * 0.85) % 1;
          ctx.globalAlpha = baseAlpha * (1 - ringPhase) * 0.75;
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(kx, currentY + 23, 46 + ringPhase * 52, 8 + ringPhase * 12, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // B. Cached static krathong body (aura + shadow + petals + cup + flowers + incense + candle + accessories)
        ctx.globalAlpha = baseAlpha;
        ctx.drawImage(
          sprite.canvas,
          0,
          0,
          sprite.sw,
          sprite.bodySh,
          kx - SPRITE_OX,
          currentY - BODY_OY,
          SPRITE_W,
          sprite.bodySh / dpr
        );

        // C. Animated sparkler (if equipped)
        if (sprite.hasSparkler) {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let sp = 0; sp < 6; sp++) {
            const ang = (sp * Math.PI) / 3 + elapsedMs * 0.008;
            ctx.moveTo(kx + 23, currentY - 18);
            ctx.lineTo(kx + 23 + Math.cos(ang) * 7, currentY - 18 + Math.sin(ang) * 7);
          }
          ctx.stroke();
        }

        // D. Animated teardrop candle flame & halo
        const sway = Math.sin(elapsedMs * 0.015 + kx) * 1.4;
        ctx.beginPath();
        ctx.arc(kx + 0.5, currentY - 25, 13 + flameHaloPulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.26)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(kx + 0.5 + sway, currentY - 34);
        ctx.quadraticCurveTo(kx + 7, currentY - 24, kx + 0.5, currentY - 19);
        ctx.quadraticCurveTo(kx - 6, currentY - 24, kx + 0.5 + sway, currentY - 34);
        ctx.closePath();
        ctx.fillStyle = sprite.flameColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(kx + 0.5 + sway * 0.5, currentY - 30);
        ctx.quadraticCurveTo(kx + 3.5, currentY - 24, kx + 0.5, currentY - 20.5);
        ctx.quadraticCurveTo(kx - 2.5, currentY - 24, kx + 0.5 + sway * 0.5, currentY - 30);
        ctx.closePath();
        ctx.fillStyle = '#fffbeb';
        ctx.fill();

        // Rising golden sparkles during the user's krathong launch entrance
        if (isLaunchingMine) {
          for (let sp = 0; sp < 5; sp++) {
            const spPhase = (ageSec * 0.65 + sp * 0.2) % 1;
            const spX = kx + Math.sin(elapsedMs * 0.004 + sp * 2.1) * (18 + sp * 4);
            const spY = currentY + 4 - spPhase * 56;
            ctx.globalAlpha = baseAlpha * (1 - spPhase) * 0.9;
            ctx.fillStyle = sp % 2 === 0 ? '#fef08a' : '#fbbf24';
            ctx.beginPath();
            ctx.arc(spX, spY, 2.2 - spPhase * 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = baseAlpha;
        }

        // E. Cached speech bubble
        ctx.drawImage(
          sprite.canvas,
          0,
          sprite.bodySh,
          sprite.sw,
          sprite.bubbleSh,
          kx - SPRITE_OX,
          currentY - 70 - BUBBLE_PAD_TOP,
          SPRITE_W,
          sprite.bubbleSh / dpr
        );
      }
      krathongs.length = kWrite;
      ctx.globalAlpha = 1;

      // Prune stale cache entries if removed externally via realtime/storage events
      if (spriteCache.size > krathongs.length + 4) {
        const activeIds = new Set<string>();
        for (let i = 0; i < krathongs.length; i++) {
          activeIds.add(krathongs[i].id);
        }
        spriteCache.forEach((_, id) => {
          if (!activeIds.has(id)) {
            spriteCache.delete(id);
          }
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      fontsCancelled = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      spriteCache.clear();
    };
  }, [spawnBot, spawnFireworkBurst]);

  // Click on Canvas to Zoom in on a Krathong
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clicked = krathongsRef.current.find(k => {
      const dx = clickX - ((k.x || 0) + 40);
      const dy = clickY - (k.y || 0);
      return Math.sqrt(dx * dx + dy * dy) < 45;
    });

    if (clicked) {
      setSelectedKrathong(clicked);
    }
  };

  // Find My Krathong
  const handleFindMyKrathong = () => {
    const mine =
      krathongsRef.current.find((k) => k.isMine || k.id === myKrathongId) ||
      pendingQueueRef.current.find((k) => k.isMine || k.id === myKrathongId);
    if (mine) {
      setSelectedKrathong(mine);
    } else {
      alert("กระทงของคุณอาจจะลอยผ่านสายน้ำไปแล้ว หรือกำลังรอการตรวจสอบจากผู้ดูแล");
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
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 1. Canvas พื้นหลัง: วาดท้องฟ้า พระจันทร์ และผิวน้ำแม่น้ำ */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full absolute inset-0 cursor-pointer z-0 will-change-transform transform-gpu"
      />

      {/* 2. สิ่งก่อสร้าง: วางบนผิวน้ำอย่างคมชัด สีทองสว่าง 100% ไม่จาง */}
      <ThaiArchitectureSkyline />

      {/* 3. Foreground & Edge Borders: โคมแขวนล้านนา ลายกนกมุมจอ และกอดอกบัวริมตลิ่ง */}
      <DecorativeScreenBorders />

      {/* Floating QR Code & Stage Mode Watermark (Frosted Glassmorphism with Collapsible Toggle) */}
      {showControls && (
        <div className="absolute top-5 left-5 z-30 transition-all duration-300 ease-in-out">
          {isQrExpanded ? (
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3.5 p-3 sm:p-3.5 bg-[#0b132b]/90 rounded-2xl border border-amber-500/40 text-amber-50 shadow-[0_4px_24px_rgba(0,0,0,0.5),0_0_15px_rgba(245,158,11,0.2)] transition-all">
              {/* QR Code Container with High-Contrast Cream Background (Static Local Asset) */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#fffbeb] rounded-xl flex items-center justify-center p-1.5 shrink-0 border border-amber-300/80 shadow-md">
                <img
                  src="/qr-create.svg"
                  alt="Scan to Float Krathong"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Header Text Container: เว้น padding-right (pr-9 sm:pr-10 = 36-40px) ป้องกันข้อความชนปุ่มมุมบนขวา */}
              <div className="text-center sm:text-left flex flex-col justify-center self-center sm:self-auto pr-9 sm:pr-10 pt-0.5">
                <div className="flex items-center justify-center sm:justify-start space-x-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      enableRealtime
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                        : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                    }`}
                  ></span>
                  <p className="font-bold text-sm tracking-wide text-amber-200 whitespace-nowrap">สแกนร่วมลอยกระทง</p>
                </div>
                <p className="text-[11px] text-amber-100/85 mt-0.5 font-medium whitespace-nowrap">
                  เปิดหน้าสร้างกระทงบนมือถือทันที
                </p>
                <p className="text-[10px] text-amber-300 font-mono mt-1.5 px-2 py-0.5 rounded-lg bg-[#0b132b]/80 inline-block border border-amber-500/40 shadow-inner">
                  {window.location.hostname === 'localhost'
                    ? 'loykrathong-online.pages.dev/?mode=create'
                    : `${window.location.host}/?mode=create`}
                </p>
                <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] text-amber-200/75 whitespace-nowrap">
                    {enableRealtime ? 'โหมดจอเวที (Realtime)' : 'โหมดผู้ร่วมงาน'}
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

              {/* ปุ่มพับเก็บกล่อง QR (Collapse Button) วางมุมบนขวา มี Hitbox 28x28px (w-7 h-7) กดง่าย ไม่ทับข้อความ */}
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
            /* สถานะพับเก็บ (Collapsed): แสดงแถบ/ปุ่มขนาดกะทัดรัด พร้อม Tooltip และไอคอน QR */
            <button
              onClick={() => setIsQrExpanded(true)}
              title="คลิกเพื่อขยาย QR Code สำหรับสแกนลอยกระทง"
              className="group flex items-center space-x-2 px-3 py-2 bg-[#0b132b]/92 hover:bg-[#0b132b] rounded-xl border border-amber-500/50 hover:border-amber-400 text-amber-200 hover:text-amber-100 shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_12px_rgba(245,158,11,0.25)] transition-all active:scale-95 cursor-pointer"
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

      {/* Header Central Brand (สมมาตรสมบูรณ์แบบ พร้อมตัวนับสถิติรักษ์โลก Zero-Waste แบบเรียลไทม์) */}
      {showControls && (
        <header className="fixed top-5 inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none z-30 px-4">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 drop-shadow-[0_2px_18px_rgba(245,158,11,0.65)] tracking-wide whitespace-nowrap">
              เทศกาลลอยกระทงออนไลน์
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/90 tracking-[0.25em] uppercase mt-1.5 font-semibold drop-shadow whitespace-nowrap pl-[0.25em]">
              Loy Krathong River of Lights
            </p>
            {/* Live Krathong Counter (แสดงเฉพาะจำนวนกระทงที่ลอยจริง) */}
            <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0b132b]/90 border border-emerald-400/40 text-[10px] sm:text-xs text-emerald-100 shadow-[0_4px_16px_rgba(0,0,0,0.45),0_0_12px_rgba(16,185,129,0.2)]">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                ร่วมลอยแล้ว <strong className="text-amber-300 font-bold">{totalFloatedCount.toLocaleString()}</strong> ใบ
              </span>
            </div>

            {launchNoticeKrathong && (
              <div className="mt-2.5 pointer-events-auto inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0b132b]/95 border border-amber-400/60 text-xs text-amber-100 shadow-[0_6px_24px_rgba(0,0,0,0.55),0_0_18px_rgba(245,158,11,0.3)] max-w-[92vw]">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  กระทงของ <strong className="text-amber-300">{launchNoticeKrathong.owner_name}</strong> กำลังลอยลงสู่สายน้ำแล้ว!
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2 sm:space-x-3 bg-[#0b132b]/92 px-4 sm:px-5 py-3 rounded-full border border-amber-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.25)] z-20 max-w-[96vw]">
        <button
          onClick={onNavigateCustomize}
          className="flex items-center space-x-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-stone-900 font-bold rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-yellow-200/60 transition active:scale-95 whitespace-nowrap cursor-pointer text-xs sm:text-sm"
        >
          <Sparkles className="w-4 h-4 text-stone-900 shrink-0" />
          <span>สร้างกระทงของคุณ</span>
        </button>

        {myKrathongId && (
          <button
            onClick={handleFindMyKrathong}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/60 rounded-full text-xs sm:text-sm font-semibold shadow-[0_0_12px_rgba(245,158,11,0.25)] transition whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">ดูกระทงของฉัน</span>
          </button>
        )}

        <button
          onClick={handleToggleAudio}
          title={isAudioPlaying ? 'ปิดเสียงดนตรีบรรเลงและสายน้ำ' : 'เปิดเสียงดนตรีไทยบรรเลงและสายน้ำ'}
          className={`flex items-center space-x-1.5 px-3 py-2.5 rounded-full border text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            isAudioPlaying
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-slate-900/80 hover:bg-amber-950/40 text-amber-200/80 border-amber-500/30 hover:border-amber-400'
          }`}
        >
          {isAudioPlaying ? (
            <Volume2 className="w-4 h-4 text-amber-300 shrink-0" />
          ) : (
            <VolumeX className="w-4 h-4 shrink-0" />
          )}
          <span className="hidden md:inline">{isAudioPlaying ? 'เพลงบรรเลง: เปิด' : 'เปิดเพลงบรรเลง'}</span>
        </button>

        <button
          onClick={toggleFullscreen}
          title="เปิด/ปิด โหมดเต็มจอสำหรับขึ้นจอใหญ่"
          className="p-2.5 bg-slate-900/80 hover:bg-amber-950/40 text-amber-200 rounded-full border border-amber-500/30 hover:border-amber-400 transition cursor-pointer shrink-0"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowControls(!showControls)}
          title="ซ่อนแถบควบคุมสำหรับฉายโปรเจกเตอร์"
          className="px-3 py-2 bg-slate-900/80 hover:bg-amber-950/40 text-amber-200/80 text-xs rounded-full border border-amber-500/30 hover:border-amber-400 whitespace-nowrap cursor-pointer"
        >
          {showControls ? 'ซ่อน UI' : 'แสดง UI'}
        </button>

        <button
          onClick={onNavigateAdmin}
          title="เข้าสู่แผงควบคุมผู้ดูแล"
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 rounded-full border border-slate-700 transition cursor-pointer shrink-0"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Krathong Details Modal */}
      {selectedKrathong && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center mb-2">
              <KrathongVisual
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
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg transition cursor-pointer text-sm"
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

      {/* Share Card Modal when triggered from RiverCanvas */}
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
