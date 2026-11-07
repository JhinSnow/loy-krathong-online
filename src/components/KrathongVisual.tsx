// src/components/KrathongVisual.tsx
import React, { useId } from 'react';

interface KrathongVisualProps {
  baseType: string;
  flowerType: string;
  candleColor: string;
  accessory?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const KrathongVisual: React.FC<KrathongVisualProps> = ({
  baseType,
  flowerType,
  candleColor,
  accessory,
  size = 'md'
}) => {
  const uid = useId().replace(/:/g, '');

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-52 h-52',
    lg: 'w-68 h-68'
  }[size];

  // แยกค่า candleColor กรณีเก็บในรูปแบบ "candle|acc1,acc2,acc3"
  const [parsedCandle, parsedAcc] = (candleColor || 'yellow').split('|');
  const activeCandle = parsedCandle || 'yellow';
  const rawAccStr = accessory !== undefined ? accessory : (parsedAcc || '');
  const activeAccessories = rawAccStr
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'none');
  const hasAcc = (id: string) => activeAccessories.includes(id);

  // 1. โทนสีฐานกระทง 8 สไตล์ (ไล่เฉด 3 มิติ: สว่าง, กลาง, เข้ม, ขอบทอง/ไฮไลต์)
  const basePaletteMap: Record<
    string,
    { light: string; mid: string; dark: string; rim: string; trunk: string; pin: string }
  > = {
    banana_leaf: {
      light: '#52b788',
      mid: '#2d6a4f',
      dark: '#1b4332',
      rim: '#74c69d',
      trunk: '#d8f3dc',
      pin: '#fde047'
    },
    banana_gold: {
      light: '#10b981',
      mid: '#047857',
      dark: '#064e3b',
      rim: '#fbbf24',
      trunk: '#fef08a',
      pin: '#fde047'
    },
    lotus: {
      light: '#f472b6',
      mid: '#db2777',
      dark: '#831843',
      rim: '#fbcfe8',
      trunk: '#fce7f3',
      pin: '#fde047'
    },
    lotus_crystal: {
      light: '#7dd3fc',
      mid: '#0284c7',
      dark: '#0c4a6e',
      rim: '#e0f2fe',
      trunk: '#f0f9ff',
      pin: '#ffffff'
    },
    coconut: {
      light: '#b08968',
      mid: '#7f5539',
      dark: '#432818',
      rim: '#ddb892',
      trunk: '#ede0d4',
      pin: '#fbbf24'
    },
    bread: {
      light: '#fbbf24',
      mid: '#d97706',
      dark: '#78350f',
      rim: '#fef08a',
      trunk: '#fef3c7',
      pin: '#fffbeb'
    },
    ice_swan: {
      light: '#e0f2fe',
      mid: '#38bdf8',
      dark: '#0369a1',
      rim: '#ffffff',
      trunk: '#f0f9ff',
      pin: '#bae6fd'
    },
    peacock_royal: {
      light: '#fde047',
      mid: '#ca8a04',
      dark: '#713f12',
      rim: '#fef08a',
      trunk: '#fef9c3',
      pin: '#10b981'
    }
  };

  // 2. โทนสีดอกไม้ประดับ 8 ชนิด
  const flowerPaletteMap: Record<
    string,
    { outer: string; inner: string; core: string; border: string }
  > = {
    marigold: { outer: '#f59e0b', inner: '#fbbf24', core: '#b45309', border: '#fef08a' },
    lotus_flower: { outer: '#e11d48', inner: '#fb7185', core: '#fef08a', border: '#ffe4e6' },
    orchid: { outer: '#9333ea', inner: '#d8b4fe', core: '#fef08a', border: '#f3e8ff' },
    jasmine: { outer: '#e2e8f0', inner: '#ffffff', core: '#fde047', border: '#f8fafc' },
    rose: { outer: '#9f1239', inner: '#f43f5e', core: '#fecdd3', border: '#fda4af' },
    dok_kem: { outer: '#ea580c', inner: '#fb923c', core: '#fef08a', border: '#ffedd5' },
    anchan: { outer: '#4338ca', inner: '#818cf8', core: '#e0e7ff', border: '#c7d2fe' },
    mixed_garland: { outer: '#f43f5e', inner: '#fbbf24', core: '#fef08a', border: '#ffffff' }
  };

  // 3. โทนสีเทียน 8 สีมงคล
  const candlePaletteMap: Record<
    string,
    { flameOuter: string; flameInner: string; waxTop: string; waxBottom: string; glow: string }
  > = {
    yellow: {
      flameOuter: '#f59e0b',
      flameInner: '#fde047',
      waxTop: '#fef08a',
      waxBottom: '#ca8a04',
      glow: '#fbbf24'
    },
    red: {
      flameOuter: '#ef4444',
      flameInner: '#fca5a5',
      waxTop: '#f87171',
      waxBottom: '#991b1b',
      glow: '#ef4444'
    },
    orange: {
      flameOuter: '#ea580c',
      flameInner: '#fdba74',
      waxTop: '#fb923c',
      waxBottom: '#9a3412',
      glow: '#f97316'
    },
    cyan: {
      flameOuter: '#0ea5e9',
      flameInner: '#bae6fd',
      waxTop: '#7dd3fc',
      waxBottom: '#0369a1',
      glow: '#38bdf8'
    },
    pink: {
      flameOuter: '#ec4899',
      flameInner: '#fbcfe8',
      waxTop: '#f472b6',
      waxBottom: '#9d174d',
      glow: '#f472b6'
    },
    emerald: {
      flameOuter: '#10b981',
      flameInner: '#a7f3d0',
      waxTop: '#6ee7b7',
      waxBottom: '#065f46',
      glow: '#34d399'
    },
    purple: {
      flameOuter: '#a855f7',
      flameInner: '#e9d5ff',
      waxTop: '#c084fc',
      waxBottom: '#5b21b6',
      glow: '#c084fc'
    },
    rainbow: {
      flameOuter: '#f59e0b',
      flameInner: '#fde047',
      waxTop: '#f472b6',
      waxBottom: '#38bdf8',
      glow: '#f472b6'
    }
  };

  const bp = basePaletteMap[baseType] || basePaletteMap.banana_leaf;
  const fp = flowerPaletteMap[flowerType] || flowerPaletteMap.marigold;
  const cp = candlePaletteMap[activeCandle] || candlePaletteMap.yellow;

  const mixedFlowerColors = [
    { outer: '#f59e0b', inner: '#fde047' },
    { outer: '#e11d48', inner: '#fb7185' },
    { outer: '#9333ea', inner: '#d8b4fe' },
    { outer: '#0284c7', inner: '#7dd3fc' },
    { outer: '#059669', inner: '#6ee7b7' },
    { outer: '#ea580c', inner: '#fdba74' },
    { outer: '#cbd5e1', inner: '#ffffff' }
  ];

  // ฟังก์ชันช่วยวาดกลีบใบตอง/กลีบบัวพับจีบแบบมีมิติ (Lotus/Banana Folded Petal)
  const renderPetal = (
    cx: number,
    cy: number,
    w: number,
    h: number,
    rot: number,
    gradId: string,
    strokeCol: string,
    key: string
  ) => (
    <g key={key} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
      <path
        d={`M 0 ${-h} C ${w * 0.65} ${-h * 0.45}, ${w} ${h * 0.2}, 0 ${h * 0.4} C ${-w} ${h * 0.2}, ${-w * 0.65} ${-h * 0.45}, 0 ${-h} Z`}
        fill={`url(#${gradId})`}
        stroke={strokeCol}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      {/* เส้นสันกลีบใบตองตรงกลางเพิ่มมิติ 3D */}
      <line
        x1="0"
        y1={-h * 0.88}
        x2="0"
        y2={h * 0.28}
        stroke={strokeCol}
        strokeWidth="0.8"
        opacity="0.55"
      />
    </g>
  );

  // ฟังก์ชันวาดดอกไม้ 1 ดอกแบบกลีบซ้อน (3D Layered Blossom)
  const renderBlossom = (bx: number, by: number, scale: number, index: number) => {
    const col =
      flowerType === 'mixed_garland'
        ? mixedFlowerColors[index % mixedFlowerColors.length]
        : { outer: fp.outer, inner: fp.inner };

    return (
      <g key={`blossom-${index}`} transform={`translate(${bx}, ${by}) scale(${scale})`}>
        {/* กลีบชั้นนอก 6 กลีบ */}
        {[0, 60, 120, 180, 240, 300].map((ang) => (
          <ellipse
            key={`o-${ang}`}
            cx="0"
            cy="-6.5"
            rx="4.8"
            ry="7.5"
            fill={col.outer}
            stroke={fp.border}
            strokeWidth="0.6"
            transform={`rotate(${ang})`}
          />
        ))}
        {/* กลีบชั้นใน 6 กลีบสับหว่าง */}
        {[30, 90, 150, 210, 270, 330].map((ang) => (
          <ellipse
            key={`i-${ang}`}
            cx="0"
            cy="-4.5"
            rx="3.6"
            ry="5.5"
            fill={col.inner}
            transform={`rotate(${ang})`}
          />
        ))}
        {/* เกสรดอกไม้ */}
        <circle cx="0" cy="0" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="1.8" fill={fp.core} />
      </g>
    );
  };

  // ตำแหน่งกลีบชั้นหลัง (Back row petals)
  const backPetals = [
    { x: 42, y: 112, w: 14, h: 30, rot: -32 },
    { x: 64, y: 103, w: 15, h: 33, rot: -18 },
    { x: 88, y: 98, w: 16, h: 35, rot: -6 },
    { x: 112, y: 98, w: 16, h: 35, rot: 6 },
    { x: 136, y: 103, w: 15, h: 33, rot: 18 },
    { x: 158, y: 112, w: 14, h: 30, rot: 32 }
  ];

  // ตำแหน่งกลีบชั้นกลาง (Middle row petals - สับหว่าง)
  const midPetals = [
    { x: 32, y: 122, w: 15, h: 29, rot: -42 },
    { x: 52, y: 114, w: 16, h: 32, rot: -25 },
    { x: 76, y: 108, w: 17, h: 34, rot: -12 },
    { x: 100, y: 105, w: 18, h: 36, rot: 0 },
    { x: 124, y: 108, w: 17, h: 34, rot: 12 },
    { x: 148, y: 114, w: 16, h: 32, rot: 25 },
    { x: 168, y: 122, w: 15, h: 29, rot: 42 }
  ];

  // ตำแหน่งกลีบชั้นหน้า (Front row petals - โอบรอบฐานด้านหน้า)
  const frontPetals = [
    { x: 40, y: 132, w: 15, h: 26, rot: -28 },
    { x: 64, y: 127, w: 17, h: 28, rot: -14 },
    { x: 88, y: 124, w: 18, h: 30, rot: -4 },
    { x: 112, y: 124, w: 18, h: 30, rot: 4 },
    { x: 136, y: 127, w: 17, h: 28, rot: 14 },
    { x: 160, y: 132, w: 15, h: 26, rot: 28 }
  ];

  // ตำแหน่งพุ่มดอกไม้ 9 ดอกเรียงซ้อนเป็นมิติโค้งรับหน้าตักกระทง
  const flowerPositions = [
    { x: 52, y: 112, s: 0.82 },
    { x: 148, y: 112, s: 0.82 },
    { x: 72, y: 105, s: 0.9 },
    { x: 128, y: 105, s: 0.9 },
    { x: 100, y: 102, s: 0.95 },
    { x: 60, y: 121, s: 0.92 },
    { x: 140, y: 121, s: 0.92 },
    { x: 83, y: 119, s: 1.02 },
    { x: 117, y: 119, s: 1.02 },
    { x: 100, y: 122, s: 1.1 }
  ];

  return (
    <div className={`relative ${sizeClasses} flex items-center justify-center select-none`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_12px_22px_rgba(0,0,0,0.65)]">
        <defs>
          {/* แสงเทียนเรืองรอง (Candle Aura) */}
          <radialGradient id={`candleAura-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
            <stop offset="30%" stopColor={cp.flameInner} stopOpacity="0.65" />
            <stop offset="65%" stopColor={cp.glow} stopOpacity="0.25" />
            <stop offset="100%" stopColor={cp.glow} stopOpacity="0" />
          </radialGradient>

          {/* เฉดสีกลีบชั้นหลัง */}
          <linearGradient id={`petalBack-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bp.mid} />
            <stop offset="100%" stopColor={bp.dark} />
          </linearGradient>

          {/* เฉดสีกลีบชั้นกลาง */}
          <linearGradient id={`petalMid-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bp.light} />
            <stop offset="55%" stopColor={bp.mid} />
            <stop offset="100%" stopColor={bp.dark} />
          </linearGradient>

          {/* เฉดสีกลีบชั้นหน้า */}
          <linearGradient id={`petalFront-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bp.rim} />
            <stop offset="30%" stopColor={bp.light} />
            <stop offset="100%" stopColor={bp.mid} />
          </linearGradient>

          {/* เฉดสีตัวฐานล่าง */}
          <linearGradient id={`baseBody-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bp.mid} />
            <stop offset="50%" stopColor={bp.dark} />
            <stop offset="100%" stopColor="#091510" />
          </linearGradient>

          {/* เฉดสีเทียน */}
          <linearGradient id={`candleWax-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={cp.waxTop} />
            <stop offset="100%" stopColor={cp.waxBottom} />
          </linearGradient>

          <linearGradient id={`rainbowWax-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="35%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* --- 0. เงาสะท้อนน้ำและระลอกคลื่นใต้กระทง (Water Ripples & Golden Reflection) --- */}
        <ellipse cx="100" cy="172" rx="82" ry="12" fill={cp.glow} opacity="0.18" />
        <ellipse
          cx="100"
          cy="168"
          rx="74"
          ry="9"
          fill="none"
          stroke={bp.rim}
          strokeWidth="1"
          strokeDasharray="10 6"
          opacity="0.4"
        />
        <ellipse
          cx="100"
          cy="176"
          rx="55"
          ry="5"
          fill="none"
          stroke="#fde047"
          strokeWidth="1"
          strokeDasharray="8 5"
          opacity="0.35"
        />

        {/* --- 1. แพนหางนกยูงรำแพนด้านหลัง (สำหรับฐานนกยูงทองคำ peacock_royal) --- */}
        {baseType === 'peacock_royal' && (
          <g opacity="0.96">
            {[-54, -36, -18, 0, 18, 36, 54].map((ang, idx) => (
              <g key={`pf-${idx}`} transform={`rotate(${ang}, 100, 118)`}>
                <path
                  d="M 100 118 C 90 74, 88 38, 100 24 C 112 38, 110 74, 100 118 Z"
                  fill="#065f46"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
                <ellipse cx="100" cy="40" rx="7" ry="9" fill="#d97706" stroke="#fef08a" strokeWidth="1" />
                <ellipse cx="100" cy="40" rx="4.5" ry="6" fill="#0284c7" />
                <circle cx="100" cy="41" r="2.2" fill="#1e1b4b" />
                <circle cx="99" cy="39" r="0.9" fill="#ffffff" />
              </g>
            ))}
          </g>
        )}

        {/* --- 2. แสงออร่าเทียนด้านหลัง (Warm Candlelight Halo) --- */}
        <circle cx="100" cy="44" r="46" fill={`url(#candleAura-${uid})`} className="animate-pulse" />
        <circle cx="100" cy="42" r="24" fill={`url(#candleAura-${uid})`} opacity="0.85" />

        {/* --- 3. กลีบกระทงชั้นหลัง (Back Layer Folded Petals) --- */}
        {baseType !== 'coconut' &&
          baseType !== 'bread' &&
          backPetals.map((p, i) =>
            renderPetal(p.x, p.y, p.w, p.h, p.rot, `petalBack-${uid}`, bp.rim, `bp-${i}`)
          )}

        {/* --- 4. กลีบกระทงชั้นกลาง (Middle Layer Folded Petals) --- */}
        {baseType !== 'coconut' &&
          baseType !== 'bread' &&
          midPetals.map((p, i) =>
            renderPetal(p.x, p.y, p.w, p.h, p.rot, `petalMid-${uid}`, bp.rim, `mp-${i}`)
          )}

        {/* --- 5. ธูปหอม 3 ดอก & ควันธูปมงคล + เทียนขี้ผึ้งแกะสลัก --- */}
        <g>
          {/* สายควันธูปบางๆ ลอยพลิ้ว */}
          <path
            d="M 86 42 Q 80 28 88 18 Q 94 10 89 4"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M 114 42 Q 120 28 112 18 Q 106 10 111 4"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.35"
          />

          {/* ก้านธูป 3 ดอก */}
          <line x1="94" y1="106" x2="86" y2="44" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="100" y1="106" x2="100" y2="40" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="106" y1="106" x2="114" y2="44" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" />

          {/* ตัวธูปส่วนบนสีน้ำตาลไม้จันทน์ */}
          <line x1="90" y1="75" x2="86" y2="44" stroke="#d97706" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="100" y1="72" x2="100" y2="40" stroke="#d97706" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="110" y1="75" x2="114" y2="44" stroke="#d97706" strokeWidth="2.6" strokeLinecap="round" />

          {/* ปลายธูปติดไฟแดงเรืองแสง */}
          <circle cx="86" cy="44" r="2.2" fill="#ef4444" stroke="#fef08a" strokeWidth="0.8" className="animate-ping" />
          <circle cx="100" cy="40" r="2.2" fill="#ef4444" stroke="#fef08a" strokeWidth="0.8" className="animate-ping" />
          <circle cx="114" cy="44" r="2.2" fill="#ef4444" stroke="#fef08a" strokeWidth="0.8" className="animate-ping" />

          {/* เทียนเล่มหลัก หรือ เทียนคู่สายรุ้ง */}
          {activeCandle === 'rainbow' ? (
            <g>
              {/* เทียนคู่ 2 เล่ม */}
              <path
                d="M 89 104 L 91 56 L 98 56 L 99 104 Z"
                fill={`url(#rainbowWax-${uid})`}
                stroke="#ffffff"
                strokeWidth="0.8"
              />
              <path
                d="M 101 104 L 102 58 L 109 58 L 111 104 Z"
                fill={`url(#rainbowWax-${uid})`}
                stroke="#ffffff"
                strokeWidth="0.8"
              />
              {/* ไส้เทียนคู่ */}
              <line x1="94.5" y1="56" x2="94.5" y2="50" stroke="#1c1917" strokeWidth="1.6" />
              <line x1="105.5" y1="58" x2="105.5" y2="52" stroke="#1c1917" strokeWidth="1.6" />
              {/* เปลวเทียนซ้าย */}
              <path
                d="M 94.5 32 C 88 43, 89 50, 94.5 51 C 100 50, 101 43, 94.5 32 Z"
                fill="#f59e0b"
                className="animate-pulse origin-bottom"
              />
              <path
                d="M 94.5 36 C 90.5 44, 91 49, 94.5 50 C 98 49, 98.5 44, 94.5 36 Z"
                fill="#fde047"
              />
              <circle cx="94.5" cy="46.5" r="2" fill="#ffffff" />
              {/* เปลวเทียนขวา */}
              <path
                d="M 105.5 34 C 99 45, 100 52, 105.5 53 C 111 52, 112 45, 105.5 34 Z"
                fill="#ec4899"
                className="animate-pulse origin-bottom"
              />
              <path
                d="M 105.5 38 C 101.5 46, 102 51, 105.5 52 C 109 51, 109.5 46, 105.5 38 Z"
                fill="#fbcfe8"
              />
              <circle cx="105.5" cy="48.5" r="2" fill="#ffffff" />
            </g>
          ) : (
            <g>
              {/* ตัวเทียนทรงเรียวพร้อมหยดน้ำตาเทียนและลวดลายเกลียวทอง */}
              <path
                d="M 94 105 L 95.5 54 C 98 52, 102 52, 104.5 54 L 106 105 Z"
                fill={`url(#candleWax-${uid})`}
                stroke="#fef08a"
                strokeWidth="0.9"
              />
              {/* ลายเกลียวทองพันรอบเทียน */}
              <path
                d="M 95.5 64 Q 100 68 104.5 64 M 95 76 Q 100 80 105 76 M 94.5 88 Q 100 92 105.5 88"
                fill="none"
                stroke="#fef08a"
                strokeWidth="1.1"
                opacity="0.75"
              />
              {/* ไส้เทียน */}
              <line x1="100" y1="53" x2="100" y2="47" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
              {/* เปลวเทียน 3 ชั้น (Outer, Mid, Core) */}
              <path
                d="M 100 26 C 91 39, 92 47, 100 49 C 108 47, 109 39, 100 26 Z"
                fill={cp.flameOuter}
                className="animate-pulse origin-bottom"
              />
              <path
                d="M 100 31 C 94 41, 95 46, 100 48 C 105 46, 106 41, 100 31 Z"
                fill={cp.flameInner}
              />
              <ellipse cx="100" cy="44" rx="2.5" ry="4" fill="#ffffff" />
            </g>
          )}
        </g>

        {/* --- 6. ของตกแต่งเสริมพิเศษ (Accessories / Toppers — จัดวางแยกตำแหน่งอย่างประณีต) --- */}
        {/* 6.1 ธงราวงานวัด (ซ้ายบน) */}
        {hasAcc('flag_thai') && (
          <g transform="translate(44, 44)">
            <line x1="24" y1="58" x2="6" y2="6" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="6" cy="6" r="2.5" fill="#fde047" />
            <polygon points="7,9 29,13 11,22" fill="#f43f5e" stroke="#fef08a" strokeWidth="1" />
            <polygon points="12,23 31,26 16,34" fill="#38bdf8" stroke="#fef08a" strokeWidth="1" />
            <polygon points="17,35 32,38 20,44" fill="#10b981" stroke="#fef08a" strokeWidth="1" />
          </g>
        )}

        {/* 6.2 หมวกปริญญา A+ (ซ้ายกลาง) */}
        {hasAcc('grad_cap') && (
          <g transform="translate(58, 52)">
            <line x1="22" y1="48" x2="14" y2="16" stroke="#fbbf24" strokeWidth="2" />
            <polygon points="14,3 0,11 14,19 28,11" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.6" />
            <path d="M 7 15 L 7 21 C 10 24, 18 24, 21 21 L 21 15" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M 24 13 L 26 23" stroke="#fde047" strokeWidth="1.8" />
            <circle cx="26" cy="23" r="2.2" fill="#fde047" />
          </g>
        )}

        {/* 6.3 ป้ายตึกฟักทองทองคำ (ขวากลาง) */}
        {hasAcc('pumpkin') && (
          <g transform="translate(114, 50)">
            <line x1="8" y1="50" x2="14" y2="20" stroke="#fbbf24" strokeWidth="2.2" />
            <circle cx="14" cy="14" r="13" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
            {/* โดมตึกฟักทองลายเส้นสีขาวทอง */}
            <path d="M 4 18 Q 14 4 24 18 Z" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
            <path d="M 8 18 Q 14 6 20 18" fill="none" stroke="#fef08a" strokeWidth="1.1" />
            <line x1="14" y1="4" x2="14" y2="18" stroke="#ffffff" strokeWidth="1.1" />
            <rect x="6" y="18" width="16" height="3" rx="1" fill="#fde047" />
          </g>
        )}

        {/* 6.4 ไฟเย็นระยิบระยับ (ขวาบน) */}
        {hasAcc('sparkler') && (
          <g>
            <line x1="122" y1="98" x2="148" y2="44" stroke="#a8a29e" strokeWidth="2" />
            <line x1="133" y1="75" x2="148" y2="44" stroke="#fde047" strokeWidth="2.8" />
            <g transform="translate(148, 44)" className="animate-spin" style={{ animationDuration: '4s' }}>
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, idx) => (
                <line
                  key={a}
                  x1="0"
                  y1="0"
                  x2={Math.cos((a * Math.PI) / 180) * (idx % 2 === 0 ? 14 : 9)}
                  y2={Math.sin((a * Math.PI) / 180) * (idx % 2 === 0 ? 14 : 9)}
                  stroke={idx % 2 === 0 ? '#fef08a' : '#fb923c'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ))}
              <circle cx="0" cy="0" r="4" fill="#ffffff" />
            </g>
          </g>
        )}

        {/* 6.5 หัวใจคู่รัก (ประดับหน้าซ้าย) */}
        {hasAcc('heart_sign') && (
          <g transform="translate(36, 72)">
            <line x1="24" y1="32" x2="14" y2="16" stroke="#f472b6" strokeWidth="2" />
            <path
              d="M 14 9 C 14 4, 6 2, 4 7 C 2 12, 14 19, 14 22 C 14 19, 26 12, 24 7 C 22 2, 14 4, 14 9 Z"
              fill="#ec4899"
              stroke="#fdf2f8"
              strokeWidth="1.5"
            />
            <circle cx="9" cy="8" r="1.5" fill="#ffffff" opacity="0.8" />
          </g>
        )}

        {/* 6.6 เหรียญทองนำโชค (ประดับหน้าขวา) */}
        {hasAcc('lucky_coin') && (
          <g transform="translate(138, 72)">
            <line x1="2" y1="32" x2="12" y2="16" stroke="#eab308" strokeWidth="2" />
            <circle cx="13" cy="12" r="10.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <circle cx="13" cy="12" r="8" fill="none" stroke="#fde047" strokeWidth="0.8" strokeDasharray="2 2" />
            <rect x="9.5" y="8.5" width="7" height="7" fill="#451a03" stroke="#fef08a" strokeWidth="1.2" />
          </g>
        )}

        {/* 6.7 ผีเสื้อแสงจันทร์ (บินเหนือเทียนด้านซ้ายบน) */}
        {hasAcc('butterfly') && (
          <g transform="translate(64, 22)">
            <path
              d="M 11 12 C 1 0, -2 15, 11 16 C 1 18, 3 27, 11 19 Z"
              fill="#38bdf8"
              stroke="#e0f2fe"
              strokeWidth="1.1"
            />
            <path
              d="M 13 12 C 23 0, 26 15, 13 16 C 23 18, 21 27, 13 19 Z"
              fill="#f472b6"
              stroke="#fce7f3"
              strokeWidth="1.1"
            />
            <line x1="12" y1="8" x2="12" y2="21" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* --- 7. พุ่มดอกไม้ 3 มิติประดับเต็มหน้าตักกระทง (Lush 3D Flower Bouquet) --- */}
        <g>
          {/* ใบไม้รองพุ่มดอกไม้ */}
          <ellipse cx="100" cy="116" rx="56" ry="15" fill="#14532d" opacity="0.7" />
          {flowerPositions.map((pos, idx) => renderBlossom(pos.x, pos.y, pos.s, idx))}
        </g>

        {/* --- 8. กลีบกระทงชั้นหน้า & ตัวฐานล่างแยกตามสไตล์ทั้ง 8 แบบ --- */}
        {baseType === 'coconut' ? (
          <g>
            {/* ฐานกะลามะพร้าวขัดเงาแกะสลักขอบทอง */}
            <path
              d="M 28 122 C 30 172, 170 172, 172 122 Q 100 136 28 122 Z"
              fill={`url(#baseBody-${uid})`}
              stroke={bp.rim}
              strokeWidth="2.5"
            />
            {/* ขอบปากกะลา */}
            <path
              d="M 28 122 Q 100 136 172 122 Q 100 112 28 122 Z"
              fill={bp.mid}
              stroke={bp.rim}
              strokeWidth="2"
            />
            {/* เชือกป่านถัก золотคาดกลางกะลา */}
            <path
              d="M 35 138 Q 100 152 165 138"
              fill="none"
              stroke="#fde68a"
              strokeWidth="3.5"
              strokeDasharray="7 4"
              strokeLinecap="round"
            />
          </g>
        ) : baseType === 'bread' ? (
          <g>
            {/* ฐานขนมปังอบเกลียวสีทองฟูสวย */}
            <path
              d="M 26 126 C 28 168, 172 168, 174 126 Z"
              fill={`url(#baseBody-${uid})`}
              stroke={bp.rim}
              strokeWidth="2.2"
            />
            {/* เกลียวขนมปังโอบรอบขอบหน้า */}
            {[38, 58, 79, 100, 121, 142, 162].map((bx, i) => (
              <ellipse
                key={`br-${i}`}
                cx={bx}
                cy={124 + Math.sin(i * 0.9) * 2}
                rx="14"
                ry="11"
                fill={`url(#petalFront-${uid})`}
                stroke={bp.rim}
                strokeWidth="1.6"
                transform={`rotate(${(i - 3) * 6}, ${bx}, 124)`}
              />
            ))}
            {/* เมล็ดงาขาวบนขนมปัง */}
            {[55, 80, 100, 120, 145].map((sx, i) => (
              <ellipse key={`ss-${i}`} cx={sx} cy={142 + (i % 2) * 4} rx="2" ry="1.2" fill="#fffbeb" />
            ))}
          </g>
        ) : (
          <g>
            {/* กลีบกระทงชั้นหน้าโอบรอบพุ่มดอกไม้ */}
            {frontPetals.map((p, i) =>
              renderPetal(p.x, p.y, p.w, p.h, p.rot, `petalFront-${uid}`, bp.rim, `fp-${i}`)
            )}

            {/* ฐานต้นกล้วย / ฐานทองคำด้านล่าง */}
            <path
              d="M 26 132 Q 100 148 174 132 L 166 156 Q 100 172 34 156 Z"
              fill={`url(#baseBody-${uid})`}
              stroke={bp.rim}
              strokeWidth="2.2"
            />

            {/* แถบคาดฐานประดับลวดลายไทย */}
            <path
              d="M 30 142 Q 100 158 170 142"
              fill="none"
              stroke={bp.rim}
              strokeWidth="1.8"
              opacity="0.85"
            />

            {/* หมุดทองปักกลีบกระทง */}
            {[46, 72, 100, 128, 154].map((px, idx) => (
              <circle
                key={`pin-${idx}`}
                cx={px}
                cy={138 + Math.sin(idx * 0.8) * 3}
                r="2.4"
                fill={bp.pin}
                stroke="#78350f"
                strokeWidth="0.6"
              />
            ))}
          </g>
        )}

        {/* --- 9. รายละเอียดพิเศษด้านหน้าสำหรับ หงส์คู่ (ice_swan) และ นกยูงทองคำ (peacock_royal) --- */}
        {baseType === 'ice_swan' && (
          <g>
            {/* หงส์แก้วซ้าย */}
            <path
              d="M 36 136 C 14 112, 16 74, 38 72 C 46 72, 48 80, 42 84 C 32 82, 28 106, 48 128 Z"
              fill="#f0f9ff"
              stroke="#bae6fd"
              strokeWidth="2"
            />
            <polygon points="44,75 53,78 44,81" fill="#fb923c" />
            <circle cx="40" cy="76" r="1.4" fill="#0f172a" />
            {/* หงส์แก้วขวา */}
            <path
              d="M 164 136 C 186 112, 184 74, 162 72 C 154 72, 152 80, 158 84 C 168 82, 172 106, 152 128 Z"
              fill="#f0f9ff"
              stroke="#bae6fd"
              strokeWidth="2"
            />
            <polygon points="156,75 147,78 156,81" fill="#fb923c" />
            <circle cx="160" cy="76" r="1.4" fill="#0f172a" />
          </g>
        )}

        {baseType === 'peacock_royal' && (
          <g>
            {/* เศียรและลำคอนกยูงทองคำสง่างามด้านหน้า */}
            <path
              d="M 94 148 C 92 118, 94 90, 100 84 C 106 90, 108 118, 106 148 Z"
              fill="#eab308"
              stroke="#fef08a"
              strokeWidth="1.8"
            />
            {/* หงอนนกยูงทอง */}
            <line x1="97" y1="84" x2="94" y2="75" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="100" y1="83" x2="100" y2="73" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="103" y1="84" x2="106" y2="75" stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="94" cy="75" r="1.8" fill="#10b981" />
            <circle cx="100" cy="73" r="2" fill="#10b981" />
            <circle cx="106" cy="75" r="1.8" fill="#10b981" />
            <circle cx="100" cy="86" r="6.5" fill="#047857" stroke="#fef08a" strokeWidth="1.6" />
            <polygon points="100,90 96,97 104,97" fill="#f59e0b" />
          </g>
        )}
      </svg>
    </div>
  );
};
