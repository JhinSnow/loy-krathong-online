// src/components/RiverCanvas.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { KrathongItem } from '../types';
import { Sparkles, Maximize2, Minimize2, Eye, ShieldAlert } from 'lucide-react';

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
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lowPerfMode, setLowPerfMode] = useState(false);
  const [selectedKrathong, setSelectedKrathong] = useState<KrathongItem | null>(null);
  const [showControls, setShowControls] = useState(true);

  // สุ่ม Bot กระทง เพื่อให้แม่น้ำไม่ร้าง
  const spawnBot = useCallback((): KrathongItem => {
    const bots = [
      { name: "น้องฟ้า", wish: "ขอให้ปีนี้เกรด 4.00 ทุกวิชา และครอบครัวมีแต่ความสุขค่ะ 🌸" },
      { name: "พี่โชคดี", wish: "ขอขมาพระแม่คงคา กิจการรุ่งเรือง ไร้โรคภัยเบียดเบียน" },
      { name: "ชาวมหาลัย", wish: "ขอให้โปรเจกต์ผ่านฉลุย มีสุขภาพแข็งแรง ร่ำรวยเงินทอง" },
      { name: "กัปตันมิว", wish: "ขอให้เจอคนที่รักและจริงใจในเร็ววันนี้ด้วยเถิด 🕯️" },
      { name: "เด็กวิศวะ", wish: "ขอให้ไม่ติด F ไม่โดนแก้บั๊กจนดึกดื่น สาธุ!" }
    ];
    const bases = ['banana_leaf', 'coconut', 'bread', 'lotus'];
    const flowers = ['marigold', 'lotus_flower', 'orchid'];
    const candles = ['yellow', 'red', 'orange', 'cyan'];

    const pick = bots[Math.floor(Math.random() * bots.length)];
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

    return {
      id: `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_type: 'general',
      owner_name: pick.name,
      wish_message: pick.wish,
      base_type: bases[Math.floor(Math.random() * bases.length)],
      flower_type: flowers[Math.floor(Math.random() * flowers.length)],
      candle_color: candles[Math.floor(Math.random() * candles.length)],
      x: -120 - Math.random() * 80,
      y: winH * 0.48 + Math.random() * (winH * 0.42),
      speed: 0.5 + Math.random() * 0.4,
      opacity: 1,
      age: 0,
      maxLife: 60,
      isMine: false
    };
  }, []);

  // 1. Listen for new krathongs (SSE หรือ Fallback Local)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/krathongs/stream');
      eventSource.addEventListener('new_krathong', (e) => {
        const data = JSON.parse(e.data);
        const winH = window.innerHeight;
        const newK: KrathongItem = {
          ...data,
          x: -120,
          y: winH * 0.48 + Math.random() * (winH * 0.42),
          speed: 0.65 + Math.random() * 0.35,
          opacity: 1,
          age: 0,
          maxLife: 60,
          isMine: data.id === myKrathongId
        };
        krathongsRef.current.push(newK);
      });
    } catch (_) {
      // Offline / standalone mode
    }

    // Populate initial ambient krathongs
    for (let i = 0; i < 4; i++) {
      const b = spawnBot();
      b.x = 100 + i * 260 + Math.random() * 80;
      krathongsRef.current.push(b);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [myKrathongId, spawnBot]);

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
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      skyGrad.addColorStop(0, '#020617'); // Dark Slate
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b'); // Deep Midnight Indigo
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.5);

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

      // Stars
      if (!lowPerfMode) {
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
      }

      // --- River (แม่น้ำเจ้าพระยาจำลอง) ---
      const riverTop = h * 0.45;
      const riverGrad = ctx.createLinearGradient(0, riverTop, 0, h);
      riverGrad.addColorStop(0, '#0a192f');
      riverGrad.addColorStop(0.3, '#032030');
      riverGrad.addColorStop(0.7, '#001427');
      riverGrad.addColorStop(1, '#000814');
      ctx.fillStyle = riverGrad;
      ctx.fillRect(0, riverTop, w, h - riverTop);

      // แสงจันทร์สะท้อนผิวน้ำ (Moon Reflection on River)
      const refGrad = ctx.createLinearGradient(moonX - 80, riverTop, moonX + 80, riverTop);
      refGrad.addColorStop(0, 'rgba(253, 224, 71, 0)');
      refGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.15)');
      refGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = refGrad;
      ctx.fillRect(moonX - 100, riverTop, 200, h - riverTop);

      // Water Ripple Lines
      if (!lowPerfMode) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1.2;
        const time = currentTime * 0.002;
        for (let i = 0; i < 10; i++) {
          const y = riverTop + 20 + i * (h * 0.05);
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x < w; x += 60) {
            ctx.lineTo(x, y + Math.sin(x * 0.015 + time + i) * 3);
          }
          ctx.stroke();
        }
      }

      // Ambient Bot Replenishment (คงจำนวนไว้ 4-7 ลำ)
      if (krathongsRef.current.length < 5 && Math.random() < 0.02) {
        krathongsRef.current.push(spawnBot());
      }

      // --- Krathong Lifecycles & Rendering ---
      krathongsRef.current = krathongsRef.current.filter((k) => {
        k.age = (k.age || 0) + dt;
        k.x = (k.x || 0) + (k.speed || 0.6);

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

        // Draw Krathong Base
        const baseColors: Record<string, string> = {
          banana_leaf: '#2d6a4f',
          coconut: '#7f4f24',
          bread: '#b08968',
          lotus: '#9b2226'
        };
        ctx.fillStyle = baseColors[k.base_type] || '#2d6a4f';
        ctx.beginPath();
        ctx.ellipse((k.x || 0) + 40, currentY + 12, 42, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Petals
        ctx.fillStyle = baseColors[k.base_type] ? '#40916c' : '#52b788';
        for (let p = 0; p < 5; p++) {
          ctx.beginPath();
          ctx.ellipse((k.x || 0) + 12 + p * 14, currentY + 6, 8, 12, -0.2 + p * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Flowers
        const flColors: Record<string, string> = {
          marigold: '#fbbf24',
          lotus_flower: '#f43f5e',
          orchid: '#c084fc'
        };
        ctx.fillStyle = flColors[k.flower_type] || '#fbbf24';
        ctx.beginPath();
        ctx.arc((k.x || 0) + 40, currentY - 2, 11, 0, Math.PI * 2);
        ctx.fill();

        // Candle flame & incense glow
        const candleColors: Record<string, string> = {
          yellow: '#fde047',
          red: '#f87171',
          orange: '#fb923c',
          cyan: '#38bdf8'
        };
        const flameColor = candleColors[k.candle_color] || '#fde047';

        // Candle stick
        ctx.fillStyle = flameColor;
        ctx.fillRect((k.x || 0) + 38, currentY - 20, 5, 18);

        // Candle Flame
        ctx.beginPath();
        ctx.arc((k.x || 0) + 40.5, currentY - 24, 5 + Math.sin(currentTime * 0.02) * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = flameColor;
        ctx.fill();

        // Ambient Water Reflection underneath
        ctx.fillStyle = flameColor;
        ctx.globalAlpha = (k.opacity ?? 1) * 0.25;
        ctx.beginPath();
        ctx.ellipse((k.x || 0) + 40, currentY + 28, 25, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = k.opacity ?? 1;

        // --- Speech Bubble สำหรับคำอวยพร ---
        const bubbleW = Math.min(220, Math.max(140, (k.owner_name.length + 10) * 8.5));
        const bubbleH = 34;
        const bx = (k.x || 0) - bubbleW / 2 + 40;
        const by = currentY - 68;

        // Bubble Background with rounded corners
        ctx.fillStyle = k.isMine ? 'rgba(254, 240, 138, 0.95)' : 'rgba(255, 255, 255, 0.92)';
        ctx.beginPath();
        ctx.roundRect(bx, by, bubbleW, bubbleH, 10);
        ctx.fill();

        // Bubble Arrow Tip
        ctx.beginPath();
        ctx.moveTo((k.x || 0) + 36, by + bubbleH);
        ctx.lineTo((k.x || 0) + 40, by + bubbleH + 6);
        ctx.lineTo((k.x || 0) + 44, by + bubbleH);
        ctx.fill();

        // Bubble Text
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(k.owner_name, bx + 10, by + 14);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#334155';
        const displayWish = k.wish_message.length > 20 ? k.wish_message.slice(0, 19) + '…' : k.wish_message;
        ctx.fillText(displayWish, bx + 10, by + 28);

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
  }, [lowPerfMode, spawnBot]);

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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-pointer"
      />

      {/* Floating QR Code & Stage Mode Watermark (ฉายขึ้นจอโปรเจกเตอร์) */}
      {showControls && (
        <div className="absolute top-6 left-6 flex items-center space-x-3 p-3 bg-slate-900/75 backdrop-blur-md rounded-2xl border border-amber-500/30 text-white shadow-2xl transition-all">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-1 shadow-inner">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://loykrathong.pages.dev"
              alt="Scan to Float"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <p className="font-bold text-sm tracking-wide text-amber-200">สแกนเพื่อร่วมลอยกระทง</p>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">สัมผัสค่ำคืนวันเพ็ญบนจอนี้</p>
          </div>
        </div>
      )}

      {/* Header Central Brand */}
      {showControls && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 drop-shadow">
            เทศกาลลอยกระทงออนไลน์ 🌕
          </h1>
          <p className="text-xs text-amber-200/70 tracking-widest uppercase mt-0.5">
            Loy Krathong River of Lights
          </p>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-slate-900/80 backdrop-blur-lg px-5 py-3 rounded-full border border-slate-700/80 shadow-2xl z-20">
        <button
          onClick={onNavigateCustomize}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-full shadow-lg transition active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>สร้างกระทงของคุณ</span>
        </button>

        {myKrathongId && (
          <button
            onClick={handleFindMyKrathong}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/50 rounded-full text-sm font-medium transition"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">ดูกระทงของฉัน</span>
          </button>
        )}

        <button
          onClick={() => setLowPerfMode(!lowPerfMode)}
          title="สลับโหมดประหยัดพลังงาน (สำหรับเครื่องสเปกเริ่มต้น)"
          className={`px-3.5 py-2.5 rounded-full text-xs font-medium border transition ${
            lowPerfMode
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {lowPerfMode ? '🍃 ประหยัดพลังงาน: เปิด' : '⚡ ประหยัดพลังงาน'}
        </button>

        <button
          onClick={toggleFullscreen}
          title="เปิด/ปิด โหมดเต็มจอสำหรับขึ้นจอใหญ่"
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 transition"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowControls(!showControls)}
          title="ซ่อนแถบควบคุมสำหรับฉายโปรเจกเตอร์"
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-full border border-slate-700"
        >
          {showControls ? 'ซ่อน UI' : 'แสดง UI'}
        </button>

        <button
          onClick={onNavigateAdmin}
          title="เข้าสู่แผงควบคุมผู้ดูแล"
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 rounded-full border border-slate-700 transition"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Krathong Details Modal */}
      {selectedKrathong && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-3xl mb-3">
              🪷
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
            <button
              onClick={() => setSelectedKrathong(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
