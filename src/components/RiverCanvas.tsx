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
  Leaf
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
  onNavigateCustomize: () => void;
  onNavigateAdmin: () => void;
}

export const RiverCanvas: React.FC<RiverCanvasProps> = ({
  myKrathongId,
  onNavigateCustomize,
  onNavigateAdmin
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const krathongsRef = useRef<KrathongItem[]>([]);
  const starsRef = useRef<{ x: number; y: number; size: number; alpha: number; delta: number }[]>([]);
  const lanternsRef = useRef<{ x: number; y: number; speedY: number; speedX: number; size: number; alpha: number }[]>([]);
  const fireworksRef = useRef<
    { x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number; decay: number }[]
  >([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedKrathong, setSelectedKrathong] = useState<KrathongItem | null>(null);
  const [shareCardKrathong, setShareCardKrathong] = useState<KrathongItem | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isQrExpanded, setIsQrExpanded] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() => soundManager.isAudioEnabled());
  const [totalFloatedCount, setTotalFloatedCount] = useState<number>(128);

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

  // สุ่ม Bot กระทงหลากหลายรูปแบบ เพื่อให้แม่น้ำมีสีสันสวยงาม
  const spawnBot = useCallback((): KrathongItem => {
    const bots = [
      { name: "น้องฟ้า", wish: "ขอให้ปีนี้เกรด 4.00 ทุกวิชา และครอบครัวมีแต่ความสุขค่ะ 🌸" },
      { name: "พี่โชคดี", wish: "ขอขมาพระแม่คงคา กิจการรุ่งเรือง ไร้โรคภัยเบียดเบียน" },
      { name: "ชาวมหาลัย", wish: "ขอให้โปรเจกต์ผ่านฉลุย มีสุขภาพแข็งแรง ร่ำรวยเงินทอง" },
      { name: "กัปตันมิว", wish: "ขอให้เจอคนที่รักและจริงใจในเร็ววันนี้ด้วยเถิด 🕯️" },
      { name: "เด็กวิศวะ", wish: "ขอให้ไม่ติด F ไม่โดนแก้บั๊กจนดึกดื่น สาธุ!" },
      { name: "น้องใบเตย", wish: "ขอให้สอบผ่านทุกวิชา มีความสุขสมหวังตลอดปี ✨" },
      { name: "ชมรมอนุรักษ์", wish: "สืบสานประเพณีไทย รักษ์สายน้ำและสิ่งแวดล้อม 🪷" }
    ];
    const bases = ['banana_leaf', 'banana_gold', 'lotus', 'lotus_crystal', 'coconut', 'bread', 'ice_swan', 'peacock_royal'];
    const flowers = ['marigold', 'lotus_flower', 'orchid', 'jasmine', 'rose', 'dok_kem', 'anchan', 'mixed_garland'];
    const candles = ['yellow', 'red', 'orange', 'cyan', 'pink', 'emerald', 'purple', 'rainbow'];
    const accessories = ['pumpkin', 'sparkler', 'heart_sign', 'grad_cap', 'lucky_coin', 'flag_thai', 'butterfly'];

    const pick = bots[Math.floor(Math.random() * bots.length)];
    const pickedCandle = candles[Math.floor(Math.random() * candles.length)];
    const accCount = Math.floor(Math.random() * 3); // 0 ถึง 2 ชิ้น
    const pickedAccList = [...accessories].sort(() => 0.5 - Math.random()).slice(0, accCount);
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

    return {
      id: `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_type: 'general',
      owner_name: pick.name,
      wish_message: pick.wish,
      base_type: bases[Math.floor(Math.random() * bases.length)],
      flower_type: flowers[Math.floor(Math.random() * flowers.length)],
      candle_color: pickedAccList.length === 0 ? pickedCandle : `${pickedCandle}|${pickedAccList.join(',')}`,
      x: -55 - Math.random() * 25,
      y: winH * 0.49 + Math.random() * (winH * 0.39),
      speed: 1.45 + Math.random() * 0.95,
      opacity: 1,
      age: 0,
      maxLife: 60,
      isMine: false
    };
  }, []);

  // 1. Listen for new krathongs (LocalStorage + Supabase Realtime + SSE Fallback)
  useEffect(() => {
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
        try {
          const { data, count } = await supabase
            .from('krathongs')
            .select('*', { count: 'exact' })
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(8);
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

        setTotalFloatedCount(128 + Math.max(supaTotalCount, combinedMap.size));

        const mergedList = Array.from(combinedMap.values()).slice(0, 8);
        krathongsRef.current = [];

        mergedList.forEach((item, index) => {
          if (containsProfanity(item.owner_name) || containsProfanity(item.wish_message)) return;
          const isMyItem = Boolean(myKrathongId && item.id === myKrathongId);
          krathongsRef.current.push({
            ...item,
            owner_name: sanitizeInputText(item.owner_name, 40),
            wish_message: sanitizeInputText(item.wish_message, 150),
            // หากเป็นกระทงที่ผู้ใช้เพิ่งปล่อย ให้เริ่มลอยจากฝั่งซ้ายของหน้าจอทันทีเพื่อให้มองเห็นชัด
            x: isMyItem ? 85 : 110 + index * 155 + Math.random() * 45,
            y: isMyItem ? winH * 0.62 : winH * 0.49 + Math.random() * (winH * 0.39),
            speed: isMyItem ? 1.55 : 1.4 + Math.random() * 0.9,
            opacity: 1,
            age: 0,
            maxLife: 60,
            isMine: isMyItem
          });
        });

        // เติม Bot กระทงเริ่มต้นให้กระจายเต็มลำน้ำทันทีที่เปิดหน้าเว็บ (ไม่ให้แม่น้ำโล่งหรือรอนาน)
        while (krathongsRef.current.length < 6) {
          const idx = krathongsRef.current.length;
          const bot = spawnBot();
          bot.x = 120 + idx * ((winW * 0.72) / 6) + Math.random() * 40;
          krathongsRef.current.push(bot);
        }

        // จุดพลุฉลองต้อนรับหากผู้ใช้เพิ่งปล่อยกระทงเสร็จ
        if (myKrathongId) {
          spawnFireworkBurst(winW * 0.35, winH * 0.16);
          setTimeout(() => spawnFireworkBurst(winW * 0.65, winH * 0.14), 450);
        }
      } catch (err) {
        console.warn('Initial krathongs fetch error:', err);
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
    };
    window.addEventListener('storage', handleStorageModerationSync);

    // 1.2 ฟัง Realtime Broadcast ทั้งการสร้างใหม่ (INSERT), อัปเดตสถานะอนุมัติ/ซ่อน (UPDATE) และลบ (DELETE)
    const channel = supabase
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
            const exists = krathongsRef.current.some((k) => k.id === data.id);
            if (exists) return;
            const winH = window.innerHeight;
            krathongsRef.current.push({
              ...data,
              owner_name: sanitizeInputText(data.owner_name, 40),
              wish_message: sanitizeInputText(data.wish_message, 150),
              x: -55,
              y: winH * 0.49 + Math.random() * (winH * 0.39),
              speed: 1.5 + Math.random() * 0.85,
              opacity: 1,
              age: 0,
              maxLife: 60,
              isMine: data.id === myKrathongId
            });
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
          } else if (
            data.status === 'approved' &&
            !containsProfanity(data.owner_name) &&
            !containsProfanity(data.wish_message)
          ) {
            // หากแอดมินกดอนุมัติกระทงที่ค้างอยู่ ให้ปล่อยลงแม่น้ำทันที
            const exists = krathongsRef.current.some((k) => k.id === data.id);
            if (!exists) {
              const winH = window.innerHeight;
              krathongsRef.current.push({
                ...data,
                owner_name: sanitizeInputText(data.owner_name, 40),
                wish_message: sanitizeInputText(data.wish_message, 150),
                x: -55,
                y: winH * 0.49 + Math.random() * (winH * 0.39),
                speed: 1.5 + Math.random() * 0.85,
                opacity: 1,
                age: 0,
                maxLife: 60,
                isMine: data.id === myKrathongId
              });
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
          }
        }
      )
      .subscribe();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/krathongs/stream');
      eventSource.addEventListener('new_krathong', (e) => {
        const data = JSON.parse(e.data);
        const winH = window.innerHeight;
        const newK: KrathongItem = {
          ...data,
          x: -55,
          y: winH * 0.49 + Math.random() * (winH * 0.39),
          speed: 1.5 + Math.random() * 0.85,
          opacity: 1,
          age: 0,
          maxLife: 60,
          isMine: data.id === myKrathongId
        };
        krathongsRef.current.push(newK);
        setTotalFloatedCount((prev) => prev + 1);
        spawnFireworkBurst();
      });
    } catch (_) {}

    return () => {
      window.removeEventListener('storage', handleStorageModerationSync);
      supabase.removeChannel(channel);
      if (eventSource) eventSource.close();
    };
  }, [myKrathongId, spawnBot, spawnFireworkBurst]);

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

  // 3. Canvas Render Loop (60 FPS + Lifecycle Management)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // --- Background: Sky & Full Moon ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.42);
      skyGrad.addColorStop(0, '#020617'); // Dark Slate
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b'); // Deep Midnight Indigo
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.42);

      // Full Moon (พระจันทร์วันเพ็ญสีทองสว่าง)
      const moonX = w * 0.82;
      const moonY = h * 0.18;
      const moonR = 48;

      // Moon outer glow
      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3);
      moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
      moonGlow.addColorStop(0.5, 'rgba(253, 224, 71, 0.12)');
      moonGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Stars & Lanterns
      ctx.fillStyle = '#ffffff';
      starsRef.current.forEach(star => {
        star.alpha += star.delta;
        if (star.alpha > 0.9 || star.alpha < 0.2) star.delta *= -1;
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Lanterns (โคมลอย)
      lanternsRef.current.forEach(lan => {
        lan.y -= lan.speedY;
        lan.x += lan.speedX;
        if (lan.y < -50) {
          lan.y = h * 0.7;
          lan.x = Math.random() * w;
        }
        ctx.save();
        ctx.globalAlpha = lan.alpha;
        // Glow
        ctx.fillStyle = 'rgba(251, 146, 60, 0.35)';
        ctx.beginPath();
        ctx.arc(lan.x, lan.y, lan.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = '#fdba74';
        ctx.fillRect(lan.x - lan.size * 0.4, lan.y - lan.size * 0.6, lan.size * 0.8, lan.size * 1.2);
        // Flame core
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(lan.x - lan.size * 0.2, lan.y + lan.size * 0.4, lan.size * 0.4, lan.size * 0.3);
        ctx.restore();
      });

      // --- Sky Fireworks (พลุดอกไม้ไฟเฉลิมฉลองเหนือตึกฟักทอง) ---
      if (fireworksRef.current.length < 15 && Math.random() < 0.007) {
        spawnFireworkBurst();
      }
      fireworksRef.current = fireworksRef.current.filter((fw) => {
        fw.x += fw.vx;
        fw.y += fw.vy;
        fw.vy += 0.032; // gravity
        fw.vx *= 0.985;
        fw.alpha -= fw.decay;
        if (fw.alpha <= 0.02) return false;

        ctx.save();
        ctx.globalAlpha = Math.max(0, fw.alpha);
        ctx.fillStyle = fw.color;
        ctx.shadowColor = fw.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, fw.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      });

      // --- River (แม่น้ำเจ้าพระยาจำลอง: ปรับระดับให้สูงขึ้นเป็น 0.38h ขยายพื้นที่ผิวน้ำให้กว้างขึ้น) ---
      const riverTop = h * 0.38;
      const riverGrad = ctx.createLinearGradient(0, riverTop, 0, h);
      riverGrad.addColorStop(0, '#0b132b');
      riverGrad.addColorStop(0.25, '#1c2541');
      riverGrad.addColorStop(0.65, '#0a1128');
      riverGrad.addColorStop(1, '#050a16');
      ctx.fillStyle = riverGrad;
      ctx.fillRect(0, riverTop, w, h - riverTop);

      // แสงจันทร์และประกายเทียนสีทองสะท้อนผิวน้ำ (Golden Moonlight & Candle Shimmer)
      const refGrad = ctx.createLinearGradient(moonX - 120, riverTop, moonX + 120, riverTop);
      refGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
      refGrad.addColorStop(0.3, 'rgba(251, 191, 36, 0.1)');
      refGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.28)');
      refGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.1)');
      refGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = refGrad;
      ctx.fillRect(moonX - 150, riverTop, 300, h - riverTop);

      // Water Ripple Lines with Golden Tint
      const time = currentTime * 0.002;
      for (let i = 0; i < 13; i++) {
        const y = riverTop + 15 + i * (h * 0.046);
        ctx.beginPath();
        // เส้นคลื่นผิวน้ำประกายทองอ่อน
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(253, 224, 71, 0.12)' : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = i % 2 === 0 ? 1.5 : 1.0;
        ctx.moveTo(0, y);
        for (let x = 0; x < w; x += 55) {
          ctx.lineTo(x, y + Math.sin(x * 0.016 + time + i) * 3.5);
        }
        ctx.stroke();
      }

      // Ambient Bot Replenishment (ปล่อยกระทงต่อเนื่องด้วยความเร็วที่ลื่นไหลขึ้น)
      if (krathongsRef.current.length < 7 && Math.random() < 0.045) {
        krathongsRef.current.push(spawnBot());
      }

      // --- Krathong Lifecycles & Rendering ---
      krathongsRef.current = krathongsRef.current.filter((k) => {
        k.age = (k.age || 0) + dt;
        k.x = (k.x || 0) + (k.speed || 1.5);

        // คำนวณคลื่นลอยโคลงเคลง
        const wave = Math.sin((k.x || 0) * 0.025 + (currentTime * 0.003)) * 2.5;
        const currentY = (k.y || 500) + wave;

        // ค่อยๆ Fade out เมื่อเข้าใกล้ขอบขวา หรือเกินอายุ 45-60 วินาที
        const maxLife = k.maxLife || 60;
        if (k.age > maxLife - 6 || (k.x || 0) > w - 100) {
          k.opacity = Math.max(0, (k.opacity ?? 1) - dt * 0.25);
        }

        ctx.save();
        ctx.globalAlpha = k.opacity ?? 1;

        // Aura สำหรับ "Find My Krathong" (กระทงของฉัน)
        if (k.isMine) {
          ctx.beginPath();
          ctx.arc((k.x || 0) + 40, currentY + 10, 68, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
          ctx.fill();
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Krathong Base (รองรับทั้ง 8 รูปแบบฐานกระทง แบบ 3 มิติ กลีบซ้อน 3 ชั้น)
        const baseColors: Record<string, { dark: string; main: string; petal: string; rim: string; baseCup: string }> = {
          banana_leaf: { dark: '#0f291e', main: '#1b4332', petal: '#2d6a4f', rim: '#74c69d', baseCup: '#143628' },
          banana_gold: { dark: '#042f2e', main: '#064e3b', petal: '#047857', rim: '#fbbf24', baseCup: '#064e3b' },
          lotus: { dark: '#831843', main: '#be185d', petal: '#f472b6', rim: '#fbcfe8', baseCup: '#9d174d' },
          lotus_crystal: { dark: '#0c4a6e', main: '#0284c7', petal: '#38bdf8', rim: '#e0f2fe', baseCup: '#0369a1' },
          coconut: { dark: '#2b1810', main: '#432818', petal: '#99582a', rim: '#fde68a', baseCup: '#3b2112' },
          bread: { dark: '#78350f', main: '#b45309', petal: '#f59e0b', rim: '#fef3c7', baseCup: '#92400e' },
          ice_swan: { dark: '#075985', main: '#0284c7', petal: '#7dd3fc', rim: '#ffffff', baseCup: '#0369a1' },
          peacock_royal: { dark: '#713f12', main: '#a16207', petal: '#eab308', rim: '#fde047', baseCup: '#854d0e' }
        };
        const bStyle = baseColors[k.base_type] || baseColors.banana_leaf;
        const kx = (k.x || 0) + 40;

        // ฟังก์ชันวาดกลีบกระทงพับจีบยอดแหลมพร้อมเส้นสันกลีบ
        const drawFoldedPetal = (
          px: number,
          py: number,
          pw: number,
          ph: number,
          tilt: number,
          fill: string,
          rim: string
        ) => {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(tilt);
          ctx.beginPath();
          ctx.moveTo(0, -ph);
          ctx.quadraticCurveTo(pw, -ph * 0.25, pw * 0.72, ph * 0.45);
          ctx.quadraticCurveTo(0, ph * 0.7, -pw * 0.72, ph * 0.45);
          ctx.quadraticCurveTo(-pw, -ph * 0.25, 0, -ph);
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.strokeStyle = rim;
          ctx.lineWidth = 1;
          ctx.stroke();

          // เส้นพับสันกลีบตรงกลางเพิ่มมิติ
          ctx.beginPath();
          ctx.moveTo(0, -ph * 0.85);
          ctx.lineTo(0, ph * 0.45);
          ctx.strokeStyle = 'rgba(255,255,255,0.28)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        };

        // 1. เงาสะท้อนน้ำและระลอกคลื่นสีทองใต้กระทง
        const baseAlpha = k.opacity ?? 1;
        ctx.save();
        ctx.globalAlpha = baseAlpha * 0.35;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(kx, currentY + 26, 36, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(kx, currentY + 23, 46 + Math.sin(currentTime * 0.005) * 3, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 2. หากเป็นกระทงนกยูงทองคำ วาดแพนหางนกยูงด้านหลัง 7 เส้น
        if (k.base_type === 'peacock_royal') {
          for (let f = -3; f <= 3; f++) {
            const fx = kx + f * 9.5;
            const fy = currentY - 7 - (3 - Math.abs(f)) * 2.5;
            drawFoldedPetal(fx, fy, 6, 15, f * 0.18, '#065f46', '#fbbf24');
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(fx + f * 1.2, fy - 5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(fx + f * 1.2, fy - 5, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 3. กลีบกระทงชั้นหลัง (Back Row - 7 กลีบ)
        for (let p = -3; p <= 3; p++) {
          drawFoldedPetal(
            kx + p * 10.5,
            currentY + 1 + Math.abs(p) * 0.8,
            8.5,
            14,
            p * 0.11,
            bStyle.dark,
            bStyle.rim
          );
        }

        // 4. กลีบกระทงชั้นกลาง (Middle Row - 6 กลีบสับหว่าง)
        for (let p = 0; p < 6; p++) {
          const offset = p - 2.5;
          drawFoldedPetal(
            kx + offset * 11.5,
            currentY + 5 + Math.abs(offset) * 0.7,
            9,
            13,
            offset * 0.1,
            bStyle.main,
            bStyle.rim
          );
        }

        // 5. ฐานรองกระทงทรงถ้วย (Tapered Cup Base) พร้อมแถบดิ้นทอง
        ctx.beginPath();
        ctx.moveTo(kx - 40, currentY + 10);
        ctx.quadraticCurveTo(kx, currentY + 18, kx + 40, currentY + 10);
        ctx.lineTo(kx + 32, currentY + 21);
        ctx.quadraticCurveTo(kx, currentY + 27, kx - 32, currentY + 21);
        ctx.closePath();
        ctx.fillStyle = bStyle.baseCup;
        ctx.fill();
        ctx.strokeStyle = bStyle.rim;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // แถบคาดดิ้นทองและหมุดประดับฐาน
        ctx.beginPath();
        ctx.moveTo(kx - 35, currentY + 16);
        ctx.quadraticCurveTo(kx, currentY + 23, kx + 35, currentY + 16);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 6. กลีบกระทงชั้นหน้า (Front Row - 5 กลีบเด่น)
        for (let p = -2; p <= 2; p++) {
          drawFoldedPetal(
            kx + p * 12.5,
            currentY + 8 + Math.abs(p) * 0.6,
            9.5,
            11.5,
            p * 0.08,
            bStyle.petal,
            bStyle.rim
          );
        }

        // 7. เอกลักษณ์พิเศษของฐานหงส์น้ำแข็งและนกยูงทองคำ
        if (k.base_type === 'ice_swan') {
          ctx.strokeStyle = '#f0f9ff';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          // หงส์ซ้าย
          ctx.beginPath();
          ctx.moveTo(kx - 28, currentY + 8);
          ctx.bezierCurveTo(kx - 42, currentY - 2, kx - 38, currentY - 16, kx - 27, currentY - 14);
          ctx.stroke();
          // หงส์ขวา
          ctx.beginPath();
          ctx.moveTo(kx + 28, currentY + 8);
          ctx.bezierCurveTo(kx + 42, currentY - 2, kx + 38, currentY - 16, kx + 27, currentY - 14);
          ctx.stroke();
          // จะงอยปากทอง
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(kx - 25, currentY - 13, 2, 0, Math.PI * 2);
          ctx.arc(kx + 25, currentY - 13, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (k.base_type === 'peacock_royal') {
          // คอและหงอนนกยูงทองด้านหน้า
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(kx - 24, currentY + 8);
          ctx.quadraticCurveTo(kx - 34, currentY - 6, kx - 24, currentY - 15);
          ctx.stroke();
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(kx - 24, currentY - 15, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // 8. พุ่มดอกไม้มงคลแบบมีกลีบล้อมเกสร (7 ดอกเรียงโค้งเต็มหน้ากระทง)
        const flPalettes: Record<string, { outer: string; core: string }> = {
          marigold: { outer: '#f59e0b', core: '#fef08a' },
          lotus_flower: { outer: '#f43f5e', core: '#fbcfe8' },
          orchid: { outer: '#a855f7', core: '#f3e8ff' },
          jasmine: { outer: '#e2e8f0', core: '#fef9c3' },
          rose: { outer: '#e11d48', core: '#fda4af' },
          dok_kem: { outer: '#ea580c', core: '#fed7aa' },
          anchan: { outer: '#4f46e5', core: '#c7d2fe' },
          mixed_garland: { outer: '#f59e0b', core: '#fef08a' }
        };
        const garlandPalette = [
          { outer: '#f59e0b', core: '#fef08a' },
          { outer: '#f43f5e', core: '#ffe4e6' },
          { outer: '#a855f7', core: '#f3e8ff' },
          { outer: '#38bdf8', core: '#e0f2fe' },
          { outer: '#10b981', core: '#d1fae5' }
        ];

        const drawMiniBlossom = (bx: number, by: number, radius: number, outerColor: string, coreColor: string) => {
          ctx.fillStyle = outerColor;
          for (let pet = 0; pet < 6; pet++) {
            const ang = (pet * Math.PI) / 3;
            ctx.beginPath();
            ctx.arc(bx + Math.cos(ang) * (radius * 0.55), by + Math.sin(ang) * (radius * 0.55), radius * 0.55, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = coreColor;
          ctx.beginPath();
          ctx.arc(bx, by, radius * 0.48, 0, Math.PI * 2);
          ctx.fill();
        };

        for (let flIdx = 0; flIdx < 7; flIdx++) {
          const pal =
            k.flower_type === 'mixed_garland'
              ? garlandPalette[flIdx % garlandPalette.length]
              : flPalettes[k.flower_type] || flPalettes.marigold;
          const fx = kx - 24 + flIdx * 8;
          const fy = currentY + 2 + Math.sin(flIdx * 1.1) * 2.2;
          drawMiniBlossom(fx, fy, 4.8, pal.outer, pal.core);
        }

        // 9. ธูปมงคล 3 ดอก พร้อมปลายไฟแดงเรืองแสง
        const incenseAngles = [-0.14, 0, 0.14];
        incenseAngles.forEach((ang, idx) => {
          const ix = kx + (idx - 1) * 3.5;
          const iyTop = currentY - 24;
          ctx.strokeStyle = '#a16207';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(ix, currentY);
          ctx.lineTo(ix + ang * 18, iyTop);
          ctx.stroke();

          // ปลายธูปติดไฟสีแดงส้ม
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(ix + ang * 18, iyTop, 1.3, 0, Math.PI * 2);
          ctx.fill();
        });

        // 10. เทียนขี้ผึ้งและเปลวไฟทรงหยดน้ำพริ้วไหว
        const [rawCandleColor, rawAccessory] = (k.candle_color || 'yellow').split('|');
        const candleColors: Record<string, string> = {
          yellow: '#fde047',
          red: '#f87171',
          orange: '#fb923c',
          cyan: '#38bdf8',
          pink: '#f472b6',
          emerald: '#34d399',
          purple: '#c084fc',
          rainbow: '#fde047'
        };
        const flameColor = candleColors[rawCandleColor] || '#fde047';

        if (rawCandleColor === 'rainbow') {
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(kx - 5.5, currentY - 19, 4.2, 18);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(kx + 1.5, currentY - 18, 4.2, 17);
        } else {
          ctx.fillStyle = flameColor;
          ctx.fillRect(kx - 2.5, currentY - 20, 5.5, 19);
          // ลายเกลียวทองคาดเทียน
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(kx - 2.5, currentY - 14);
          ctx.lineTo(kx + 3, currentY - 11);
          ctx.moveTo(kx - 2.5, currentY - 8);
          ctx.lineTo(kx + 3, currentY - 5);
          ctx.stroke();
        }

        // 11. วาดของตกแต่งเสริมพิเศษ (รองรับการเลือกพร้อมกันหลายชิ้นโดยไม่ทับซ้อนกัน)
        const accList = (rawAccessory || '').split(',').filter(Boolean);
        const hasAcc = (id: string) => accList.includes(id);

        if (hasAcc('flag_thai')) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(kx - 16, currentY + 1);
          ctx.lineTo(kx - 16, currentY - 23);
          ctx.stroke();
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(kx - 16, currentY - 23);
          ctx.lineTo(kx - 5, currentY - 19);
          ctx.lineTo(kx - 16, currentY - 15);
          ctx.closePath();
          ctx.fill();
        }
        if (hasAcc('grad_cap')) {
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(kx - 11, currentY - 16);
          ctx.lineTo(kx - 4, currentY - 13);
          ctx.lineTo(kx - 11, currentY - 10);
          ctx.lineTo(kx - 18, currentY - 13);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        if (hasAcc('pumpkin')) {
          ctx.fillStyle = '#fef3c7';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(kx + 14, currentY - 13, 5, 6.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        if (hasAcc('sparkler')) {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.2;
          for (let sp = 0; sp < 6; sp++) {
            const ang = (sp * Math.PI) / 3 + currentTime * 0.008;
            ctx.beginPath();
            ctx.moveTo(kx + 23, currentY - 18);
            ctx.lineTo(kx + 23 + Math.cos(ang) * 7, currentY - 18 + Math.sin(ang) * 7);
            ctx.stroke();
          }
        }
        if (hasAcc('heart_sign')) {
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(kx - 23, currentY - 5, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (hasAcc('lucky_coin')) {
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(kx + 23, currentY - 5, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        if (hasAcc('butterfly')) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(kx - 13, currentY - 26, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(kx - 8, currentY - 26, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        if (hasAcc('noppamas_crown')) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(kx - 6, currentY - 1);
          ctx.lineTo(kx, currentY - 10);
          ctx.lineTo(kx + 6, currentY - 1);
          ctx.closePath();
          ctx.fill();
        }

        // 12. เปลวเทียนทรงหยดน้ำพร้อมรัศมีเรืองรอง (Teardrop Candle Flame & Warm Halo)
        const sway = Math.sin(currentTime * 0.015 + kx) * 1.4;
        // ชั้นที่ 1: รัศมีแสงเทียนรอบนอก
        ctx.beginPath();
        ctx.arc(kx + 0.5, currentY - 25, 13 + Math.sin(currentTime * 0.02) * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.26)';
        ctx.fill();

        // ชั้นที่ 2: เปลวเทียนทรงหยดน้ำ
        ctx.beginPath();
        ctx.moveTo(kx + 0.5 + sway, currentY - 34);
        ctx.quadraticCurveTo(kx + 7, currentY - 24, kx + 0.5, currentY - 19);
        ctx.quadraticCurveTo(kx - 6, currentY - 24, kx + 0.5 + sway, currentY - 34);
        ctx.closePath();
        ctx.fillStyle = flameColor;
        ctx.fill();

        // ชั้นที่ 3: แกนไฟสีขาวอมทองตรงกลาง
        ctx.beginPath();
        ctx.moveTo(kx + 0.5 + sway * 0.5, currentY - 30);
        ctx.quadraticCurveTo(kx + 3.5, currentY - 24, kx + 0.5, currentY - 20.5);
        ctx.quadraticCurveTo(kx - 2.5, currentY - 24, kx + 0.5 + sway * 0.5, currentY - 30);
        ctx.closePath();
        ctx.fillStyle = '#fffbeb';
        ctx.fill();

        // --- Speech Bubble สำหรับคำอวยพร (วัดความกว้างจริงด้วย measureText รองรับสระ/วรรณยุกต์ภาษาไทยไม่ให้ถูกตัดสั้นผิดปกติ) ---
        ctx.font = 'bold 12px "Sarabun", sans-serif';
        const ownerTextWidth = ctx.measureText(k.owner_name).width;

        ctx.font = '500 11px "Sarabun", sans-serif';
        const maxWishPixelWidth = 196;
        let displayWish = k.wish_message;
        if (ctx.measureText(displayWish).width > maxWishPixelWidth) {
          let cut = displayWish;
          while (cut.length > 0 && ctx.measureText(cut + '…').width > maxWishPixelWidth) {
            cut = cut.slice(0, -1);
          }
          displayWish = cut + '…';
        }
        const wishTextWidth = ctx.measureText(displayWish).width;

        const bubbleW = Math.min(230, Math.max(142, Math.max(ownerTextWidth, wishTextWidth) + 22));
        const bubbleH = 36;
        const bx = (k.x || 0) - bubbleW / 2 + 40;
        const by = currentY - 70;

        // Bubble Shadow Glow
        ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
        ctx.shadowBlur = 8;

        // Bubble Background with creamy/warm gold
        ctx.fillStyle = k.isMine ? '#fef3c7' : '#fffbeb';
        ctx.beginPath();
        ctx.roundRect(bx, by, bubbleW, bubbleH, 10);
        ctx.fill();

        // Bubble Golden Border
        ctx.strokeStyle = k.isMine ? '#d97706' : '#f59e0b';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.shadowBlur = 0; // reset shadow

        // Bubble Arrow Tip
        ctx.fillStyle = k.isMine ? '#fef3c7' : '#fffbeb';
        ctx.beginPath();
        ctx.moveTo((k.x || 0) + 36, by + bubbleH);
        ctx.lineTo((k.x || 0) + 40, by + bubbleH + 6);
        ctx.lineTo((k.x || 0) + 44, by + bubbleH);
        ctx.fill();

        // Bubble Text
        ctx.fillStyle = '#92400e'; // Warm dark amber for name
        ctx.font = 'bold 12px "Sarabun", sans-serif';
        ctx.fillText(k.owner_name, bx + 11, by + 15);

        ctx.font = '500 11px "Sarabun", sans-serif';
        ctx.fillStyle = '#1c1917'; // Rich dark warm charcoal
        ctx.fillText(displayWish, bx + 11, by + 30);

        ctx.restore();

        // Garbage collection: คืน Memory เมื่อ Fade out หมด หรือเกินหน้าจอ
        return (k.opacity ?? 1) > 0 && (k.x || 0) < w + 150;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
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
    const mine = krathongsRef.current.find(k => k.isMine || k.id === myKrathongId);
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
        className="absolute inset-0 cursor-pointer z-0"
      />

      {/* 2. สิ่งก่อสร้าง: วางบนผิวน้ำอย่างคมชัด สีทองสว่าง 100% ไม่จาง */}
      <ThaiArchitectureSkyline />

      {/* 3. Foreground & Edge Borders: โคมแขวนล้านนา ลายกนกมุมจอ และกอดอกบัวริมตลิ่ง */}
      <DecorativeScreenBorders />

      {/* Floating QR Code & Stage Mode Watermark (Frosted Glassmorphism with Collapsible Toggle) */}
      {showControls && (
        <div className="absolute top-5 left-5 z-30 transition-all duration-300 ease-in-out">
          {isQrExpanded ? (
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3.5 p-3 sm:p-3.5 bg-[#0b132b]/65 backdrop-blur-[16px] rounded-2xl border border-amber-500/40 text-amber-50 shadow-[0_4px_24px_rgba(0,0,0,0.5),0_0_15px_rgba(245,158,11,0.2)] transition-all">
              {/* QR Code Container with High-Contrast Cream Background */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#fffbeb] rounded-xl flex items-center justify-center p-2 shrink-0 border border-amber-300/80 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=0b132b&bgcolor=fffbeb&margin=1&data=${encodeURIComponent(
                    (window.location.origin + window.location.pathname).includes('localhost')
                      ? (window.location.origin + window.location.pathname).replace('localhost', '172.24.135.154')
                      : window.location.origin + window.location.pathname
                  )}`}
                  alt="Scan to Float"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Header Text Container: เว้น padding-right (pr-9 sm:pr-10 = 36-40px) ป้องกันข้อความชนปุ่มมุมบนขวา */}
              <div className="text-center sm:text-left flex flex-col justify-center self-center sm:self-auto pr-9 sm:pr-10 pt-0.5">
                <div className="flex items-center justify-center sm:justify-start space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
                  <p className="font-bold text-sm tracking-wide text-amber-200 whitespace-nowrap">สแกนร่วมลอยกระทง</p>
                </div>
                <p className="text-[11px] text-amber-100/85 mt-0.5 font-medium whitespace-nowrap">ปล่อยกระทงจากมือถือขึ้นจอนี้</p>
                <p className="text-[11px] text-amber-300 font-mono mt-1.5 px-2.5 py-0.5 rounded-lg bg-[#0b132b]/80 inline-block border border-amber-500/40 shadow-inner">
                  {window.location.hostname === 'localhost' ? '172.24.135.154:5173' : window.location.host}
                </p>
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
              className="group flex items-center space-x-2 px-3 py-2 bg-[#0b132b]/80 hover:bg-[#0b132b] backdrop-blur-[14px] rounded-xl border border-amber-500/50 hover:border-amber-400 text-amber-200 hover:text-amber-100 shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_12px_rgba(245,158,11,0.25)] transition-all active:scale-95 cursor-pointer"
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
            {/* Live Eco-Impact & Zero-Waste Counter */}
            <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0b132b]/80 backdrop-blur-md border border-emerald-400/40 text-[10px] sm:text-xs text-emerald-100 shadow-[0_4px_16px_rgba(0,0,0,0.45),0_0_12px_rgba(16,185,129,0.2)]">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                ร่วมลอยแล้ว <strong className="text-amber-300 font-bold">{totalFloatedCount.toLocaleString()}</strong> ใบ
                <span className="hidden sm:inline">
                  {' '}• ลดขยะในแหล่งน้ำ <strong className="text-emerald-300 font-bold">~{(totalFloatedCount * 0.35).toFixed(1)} กก.</strong> (Zero-Waste 100%)
                </span>
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2 sm:space-x-3 bg-[#0b132b]/85 backdrop-blur-lg px-4 sm:px-5 py-3 rounded-full border border-amber-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.25)] z-20 max-w-[96vw]">
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
            <Volume2 className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
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
