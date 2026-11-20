// src/components/KrathongVisual.tsx
import React, { useId } from 'react';
import { parseCandleConfig } from '../utils/krathongConfig';

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

  // แยกค่า candleColor รูปแบบใหม่ (รวม scale ของแต่ละชิ้น) และรูปแบบเดิม
  const {
    candleId: activeCandle,
    accessories: activeAccessories,
    accessoryScales,
    centerScale
  } = parseCandleConfig(candleColor, accessory);
  const hasAcc = (id: string) => activeAccessories.includes(id);
  const getAccScale = (id: string) => accessoryScales[id] ?? 1;
  const isCenterpieceModel = [
    'pumpkin',
    'noppamas_crown',
    'elephant_gold',
    'golden_swan',
    'lotus_lamp',
    'gold_pagoda',
    'royal_barge',
    'crystal_heart'
  ].includes(flowerType);

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
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]">
        <defs>
          {/* แสงเทียนเรืองรองแบบพอดีเปลวไฟ */}
          <radialGradient id={`candleAura-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.45" />
            <stop offset="40%" stopColor={cp.flameInner} stopOpacity="0.22" />
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
        <ellipse cx="100" cy="172" rx="76" ry="10" fill={cp.glow} opacity="0.10" />
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

        {/* --- 2. แสงเทียนอุ่นพอดีตา (Subtle Candlelight Halo) --- */}
        <circle cx="100" cy={isCenterpieceModel ? 32 : 44} r="20" fill={`url(#candleAura-${uid})`} />
        <circle cx="100" cy={isCenterpieceModel ? 30 : 42} r="10" fill={`url(#candleAura-${uid})`} opacity="0.6" />

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
        <g transform={isCenterpieceModel ? 'translate(0, -12)' : undefined}>
          {/* สายควันธูปบางๆ ลอยพลิ้ว */}
          <path
            d="M 86 42 Q 81 31 87 22 Q 92 16 89 12"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M 114 42 Q 119 31 113 22 Q 108 16 111 12"
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
          <circle cx="86" cy="44" r="2" fill="#ef4444" stroke="#fef08a" strokeWidth="0.8" />
          <circle cx="100" cy="40" r="2" fill="#ef4444" stroke="#fef08a" strokeWidth="0.8" />
          <circle cx="114" cy="44" r="2" fill="#ef4444" stroke="#fef08a" strokeWidth="0.8" />

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
          <g transform={`translate(68, 102) scale(${getAccScale('flag_thai')}) translate(-24, -58)`}>
            <line x1="24" y1="58" x2="6" y2="6" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="6" cy="6" r="2.5" fill="#fde047" />
            <polygon points="7,9 29,13 11,22" fill="#f43f5e" stroke="#fef08a" strokeWidth="1" />
            <polygon points="12,23 31,26 16,34" fill="#38bdf8" stroke="#fef08a" strokeWidth="1" />
            <polygon points="17,35 32,38 20,44" fill="#10b981" stroke="#fef08a" strokeWidth="1" />
          </g>
        )}

        {/* 6.2 หมวกปริญญา A+ (ซ้ายกลาง) */}
        {hasAcc('grad_cap') && (
          <g transform={`translate(80, 100) scale(${getAccScale('grad_cap')}) translate(-22, -48)`}>
            <line x1="22" y1="48" x2="14" y2="16" stroke="#fbbf24" strokeWidth="2" />
            <polygon points="14,3 0,11 14,19 28,11" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.6" />
            <path d="M 7 15 L 7 21 C 10 24, 18 24, 21 21 L 21 15" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M 24 13 L 26 23" stroke="#fde047" strokeWidth="1.8" />
            <circle cx="26" cy="23" r="2.2" fill="#fde047" />
          </g>
        )}

        {/* 6.3 โมเดลจำลองตึกฟักทอง ม.อ. (3D Miniature Pumpkin Building) */}
        {hasAcc('pumpkin') && (
          <g transform={`translate(121, 100) scale(${getAccScale('pumpkin')}) translate(-7, -58)`}>
            {/* ก้านเสียบปักบนกระทง */}
            <line x1="7" y1="58" x2="18" y2="39" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
            {/* ฐานแท่นรองรับอาคาร */}
            <rect x="3" y="34" width="30" height="4" rx="1.5" fill="#92400e" stroke="#fde047" strokeWidth="0.8" />
            <rect x="6" y="31" width="24" height="3.5" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.7" />
            {/* หลังคาโดมกลีบฟักทองโค้งมน (ซ้าย-กลาง-ขวา) */}
            <path d="M 4 31 C 4 17 11 10 18 10 C 25 10 32 17 32 31 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            {/* กลีบฟักทองซ้อนมิติซ้าย-ขวา */}
            <path d="M 8.5 31 C 8.5 18 13 11 18 10 C 14.5 14 13 22 13 31 Z" fill="#fbbf24" opacity="0.85" />
            <path d="M 27.5 31 C 27.5 18 23 11 18 10 C 21.5 14 23 22 23 31 Z" fill="#d97706" opacity="0.75" />
            {/* กลีบกลางสว่าง + เส้นสันกลีบตึกฟักทอง */}
            <path d="M 13.5 31 C 13.5 19 15.5 11.5 18 10 C 20.5 11.5 22.5 19 22.5 31 Z" fill="#fde68a" stroke="#b45309" strokeWidth="0.7" />
            <line x1="18" y1="8" x2="18" y2="31" stroke="#b45309" strokeWidth="0.8" />
            {/* ยอดจั่วกลาง */}
            <path d="M 16.5 10 L 18 5.5 L 19.5 10 Z" fill="#fde047" stroke="#b45309" strokeWidth="0.6" />
            {/* ช่องซุ้มโค้งฐานตึกโทนเดียวกับสถาปัตยกรรมพื้นหลัง */}
            <path d="M 8 31 L 8 27 Q 10 24.5 12 27 L 12 31 Z" fill="#0b132b" stroke="#fde047" strokeWidth="0.55" />
            <path d="M 15.5 31 L 15.5 26.5 Q 18 23.5 20.5 26.5 L 20.5 31 Z" fill="#0b132b" stroke="#fde047" strokeWidth="0.55" />
            <path d="M 24 31 L 24 27 Q 26 24.5 28 27 L 28 31 Z" fill="#0b132b" stroke="#fde047" strokeWidth="0.55" />
          </g>
        )}

        {/* 6.3b ชฎาทองนพมาศ (ซ้ายบน) */}
        {hasAcc('noppamas_crown') && (
          <g transform={`translate(64, 98) scale(${getAccScale('noppamas_crown')}) translate(-18, -60)`}>
            <line x1="18" y1="60" x2="14" y2="32" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" />
            {/* ยอดชฎาเรียวแหลม */}
            <path d="M 14 2 L 16.5 16 L 11.5 16 Z" fill="#fde047" stroke="#92400e" strokeWidth="0.7" />
            <circle cx="14" cy="1.8" r="1.3" fill="#ffffff" />
            {/* ชั้นยอดทรงเครื่อง */}
            <path d="M 9 23 L 11.5 15 L 16.5 15 L 19 23 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
            {/* กระบังหน้า + จอนหู */}
            <path d="M 6 29 C 6 24 10 22 14 22 C 18 22 22 24 22 29 L 20 32 L 8 32 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="0.8" />
            <path d="M 6 28 Q 3 31 5 35" fill="none" stroke="#fde047" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 22 28 Q 25 31 23 35" fill="none" stroke="#fde047" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="14" cy="26.5" r="1.6" fill="#fef08a" stroke="#b45309" strokeWidth="0.5" />
          </g>
        )}

        {/* 6.3c โคมลอยล้านนา (ลอยเหนือมุมซ้ายบน) */}
        {hasAcc('sky_lantern') && (
          <g transform={`translate(35, 26) scale(${getAccScale('sky_lantern')}) translate(-15, -18)`}>
            {/* โคมกระดาษทรงกระบอกอุ่น */}
            <path d="M 7 6 Q 15 2 23 6 L 26 18 Q 24 28 19 30 L 11 30 Q 6 28 4 18 Z" fill="#fb923c" stroke="#9a3412" strokeWidth="0.9" />
            <path d="M 10 6.5 Q 15 4 20 6.5 L 21.5 18 Q 19.5 27 15 29 Q 10.5 27 8.5 18 Z" fill="#fef08a" opacity="0.75" />
            {/* ลายเส้นขอบและโครงไม้ไผ่ */}
            <ellipse cx="15" cy="30" rx="4.2" ry="1.3" fill="#7c2d12" stroke="#fde047" strokeWidth="0.6" />
            {/* เปลวไฟด้านล่างโคม */}
            <circle cx="15" cy="28.5" r="2.2" fill="#f59e0b" />
            <circle cx="15" cy="28.5" r="1" fill="#ffffff" />
          </g>
        )}

        {/* 6.3d โคมบัวแก้ว (ประดับริมซ้ายล่าง) */}
        {hasAcc('lotus_lamp') && (
          <g transform={`translate(46, 98) scale(${getAccScale('lotus_lamp')}) translate(-16, -26)`}>
            {/* ฐานบัว */}
            <ellipse cx="16" cy="26" rx="11" ry="3.2" fill="#0f766e" stroke="#5eead4" strokeWidth="0.8" />
            {/* กลีบบัวแก้วซ้อน */}
            <path d="M 6 25 Q 4 14 12 12 Q 11 20 13 25 Z" fill="#f472b6" opacity="0.9" stroke="#fbcfe8" strokeWidth="0.6" />
            <path d="M 26 25 Q 28 14 20 12 Q 21 20 19 25 Z" fill="#f472b6" opacity="0.9" stroke="#fbcfe8" strokeWidth="0.6" />
            <path d="M 10 26 Q 11 9 16 7 Q 21 9 22 26 Z" fill="#fdf2f8" stroke="#f472b6" strokeWidth="0.8" />
            {/* ดวงไฟกลางดอกบัว */}
            <circle cx="16" cy="17" r="2.4" fill="#fde047" />
          </g>
        )}

        {/* 6.3e ช้างเผือกมงคล (ประดับมุมขวาล่าง) */}
        {hasAcc('elephant_gold') && (
          <g transform={`translate(147, 98) scale(${getAccScale('elephant_gold')}) translate(-15, -26)`}>
            {/* ฐานตั้งช้าง */}
            <rect x="4" y="25" width="22" height="3.5" rx="1.2" fill="#92400e" stroke="#fde047" strokeWidth="0.7" />
            {/* ลำตัวช้างทรงเครื่องสีครีมงาช้าง */}
            <path d="M 8 25 L 8 15 Q 8 10 15 10 Q 22 10 23 16 L 23 25 L 19 25 L 19 20 L 13 20 L 13 25 Z" fill="#fef3c7" stroke="#92400e" strokeWidth="0.8" />
            {/* ผ้าคลุมหลังสีทองแดง */}
            <path d="M 11 10 L 19 10 L 18 17 L 12 17 Z" fill="#dc2626" stroke="#fde047" strokeWidth="0.7" />
            {/* หู + งวงช้างชูรับโชค */}
            <ellipse cx="19" cy="14" rx="2.8" ry="3.5" fill="#fde68a" stroke="#92400e" strokeWidth="0.6" />
            <path d="M 22.5 14 Q 28 15 27.5 10 Q 27 8.5 25.8 9" fill="none" stroke="#fef3c7" strokeWidth="2.2" strokeLinecap="round" />
            {/* งาและตา */}
            <path d="M 22 17 L 25 18" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
            <circle cx="21" cy="13.2" r="0.8" fill="#1e293b" />
          </g>
        )}

        {/* 6.4 ไฟเย็นระยิบระยับ (ขวาบน) */}
        {hasAcc('sparkler') && (
          <g transform={`translate(122, 98) scale(${getAccScale('sparkler')}) translate(-122, -98)`}>
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
          <g transform={`translate(60, 104) scale(${getAccScale('heart_sign')}) translate(-24, -32)`}>
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
          <g transform={`translate(140, 104) scale(${getAccScale('lucky_coin')}) translate(-2, -32)`}>
            <line x1="2" y1="32" x2="12" y2="16" stroke="#eab308" strokeWidth="2" />
            <circle cx="13" cy="12" r="10.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <circle cx="13" cy="12" r="8" fill="none" stroke="#fde047" strokeWidth="0.8" strokeDasharray="2 2" />
            <rect x="9.5" y="8.5" width="7" height="7" fill="#451a03" stroke="#fef08a" strokeWidth="1.2" />
          </g>
        )}

        {/* 6.7 ผีเสื้อแสงจันทร์ (บินเหนือเทียนด้านซ้ายบน) */}
        {hasAcc('butterfly') && (
          <g transform={`translate(76, 37) scale(${getAccScale('butterfly')}) translate(-12, -15)`}>
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

        {/* --- 7. พุ่มดอกไม้ 3 มิติ หรือ ของตกแต่งตรงกลางกระทง (Centerpiece Model) --- */}
        <g transform={centerScale !== 1 ? `translate(100, 112) scale(${centerScale}) translate(-100, -112)` : undefined}>
          {/* ใบไม้รองรับตรงกลางหน้าตักกระทง */}
          <ellipse cx="100" cy="116" rx="56" ry="15" fill="#14532d" opacity="0.72" />

          {!isCenterpieceModel && flowerPositions.map((pos, idx) => renderBlossom(pos.x, pos.y, pos.s, idx))}

          {/* 7.1 ตึกฟักทอง ม.อ. (3D Centerpiece PSU Pumpkin Building) */}
          {flowerType === 'pumpkin' && (
            <g>
              {/* ฐานแท่นรองรับโค้ง 2 ชั้น */}
              <rect x="52" y="108" width="96" height="8" rx="3" fill="#78350f" stroke="#fde047" strokeWidth="1.2" />
              <rect x="60" y="102" width="80" height="7" rx="2" fill="#fde68a" stroke="#d97706" strokeWidth="1.1" />
              {/* โดมตึกฟักทองกลีบใหญ่ซ้าย-ขวา */}
              <path d="M 55 102 C 55 76 74 64 100 64 C 126 64 145 76 145 102 Z" fill="#d97706" stroke="#78350f" strokeWidth="1.4" />
              {/* กลีบฟักทอง 3 มิติซ้อนกัน 7 กลีบ */}
              <path d="M 62 102 C 62 78 79 65 100 64 C 82 70 72 82 72 102 Z" fill="#f59e0b" />
              <path d="M 138 102 C 138 78 121 65 100 64 C 118 70 128 82 128 102 Z" fill="#b45309" />
              <path d="M 74 102 C 74 79 85 65 100 64 C 88 72 85 84 85 102 Z" fill="#fbbf24" />
              <path d="M 126 102 C 126 79 115 65 100 64 C 112 72 115 84 115 102 Z" fill="#f59e0b" />
              {/* กลีบกลางสีทองสว่าง */}
              <path d="M 88 102 C 88 78 93 65 100 64 C 107 65 112 78 112 102 Z" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
              {/* เส้นสันกลีบและยอดจั่วกลาง */}
              <line x1="100" y1="60" x2="100" y2="102" stroke="#92400e" strokeWidth="1.1" />
              <path d="M 96 64 L 100 55 L 104 64 Z" fill="#fde047" stroke="#92400e" strokeWidth="0.9" />
              {/* ซุ้มโค้งฐานตึก 5 ช่องโทนเดียวกับสถาปัตยกรรมพื้นหลัง */}
              <path d="M 65 102 L 65 93 Q 68.5 88 72 93 L 72 102 Z" fill="#0b132b" stroke="#fde047" strokeWidth="0.85" />
              <path d="M 79 102 L 79 92 Q 83 87 87 92 L 87 102 Z" fill="#0b132b" stroke="#fde047" strokeWidth="0.85" />
              <path d="M 94.5 102 L 94.5 90 Q 100 84 105.5 90 L 105.5 102 Z" fill="#0b132b" stroke="#fde047" strokeWidth="0.95" />
              <path d="M 113 102 L 113 92 Q 117 87 121 92 L 121 102 Z" fill="#0b132b" stroke="#fde047" strokeWidth="0.85" />
              <path d="M 128 102 L 128 93 Q 131.5 88 135 93 L 135 102 Z" fill="#0b132b" stroke="#fde047" strokeWidth="0.85" />
            </g>
          )}

          {/* 7.2 ชฎาทองนพมาศ (Centerpiece Crown on Pedestal) */}
          {flowerType === 'noppamas_crown' && (
            <g>
              {/* พานทองสองชั้น */}
              <path d="M 74 114 L 82 103 L 118 103 L 126 114 Z" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
              <ellipse cx="100" cy="102" rx="28" ry="5" fill="#fbbf24" stroke="#92400e" strokeWidth="1.2" />
              {/* จอนหูชฎาซ้าย-ขวา */}
              <path d="M 79 94 Q 70 100 76 108" fill="none" stroke="#fde047" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M 121 94 Q 130 100 124 108" fill="none" stroke="#fde047" strokeWidth="2.8" strokeLinecap="round" />
              {/* กรอบหน้าและฐานชฎา */}
              <path d="M 79 101 C 79 91 88 86 100 86 C 112 86 121 91 121 101 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1.2" />
              {/* ชั้นยอดทรงเครื่อง 3 ชั้น */}
              <path d="M 85 87 L 89 75 L 111 75 L 115 87 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1.1" />
              <path d="M 90 75 L 94 64 L 106 64 L 110 75 Z" fill="#fde047" stroke="#92400e" strokeWidth="1.1" />
              {/* ยอดแหลมชฎา */}
              <path d="M 95 64 L 100 48 L 105 64 Z" fill="#fef08a" stroke="#92400e" strokeWidth="1" />
              <circle cx="100" cy="47" r="2.2" fill="#ffffff" stroke="#f59e0b" strokeWidth="0.8" />
              {/* อัญมณีประดับ */}
              <circle cx="100" cy="94" r="3" fill="#ef4444" stroke="#fef08a" strokeWidth="1" />
              <circle cx="88" cy="95" r="2" fill="#10b981" stroke="#fef08a" strokeWidth="0.7" />
              <circle cx="112" cy="95" r="2" fill="#10b981" stroke="#fef08a" strokeWidth="0.7" />
            </g>
          )}

          {/* 7.3 ช้างเผือกมงคล (Centerpiece White Elephant) */}
          {flowerType === 'elephant_gold' && (
            <g>
              {/* แท่นบัวทอง */}
              <rect x="64" y="106" width="72" height="8" rx="3" fill="#92400e" stroke="#fde047" strokeWidth="1.2" />
              {/* ขาหน้า-หลังและลำตัวช้างเผือก */}
              <path d="M 74 106 L 74 86 Q 74 71 96 71 Q 116 71 120 84 L 120 106 L 111 106 L 111 94 L 84 94 L 84 106 Z" fill="#fffbeb" stroke="#92400e" strokeWidth="1.4" />
              {/* ผ้าทิพย์คลุมหลังสีแดงขอบทอง */}
              <path d="M 81 71 L 108 71 L 106 90 L 83 90 Z" fill="#dc2626" stroke="#fde047" strokeWidth="1.4" />
              <line x1="83" y1="86" x2="106" y2="86" stroke="#fde047" strokeWidth="1.2" />
              {/* เครื่องประดับหัวและหูช้าง */}
              <path d="M 107 69 L 113 62 L 118 70 Z" fill="#fde047" stroke="#92400e" strokeWidth="0.9" />
              <ellipse cx="109" cy="81" rx="6" ry="7.5" fill="#fef3c7" stroke="#92400e" strokeWidth="1" />
              {/* งวงช้างชูรับโชค + งา */}
              <path d="M 119 82 Q 134 83 133 70 Q 132 64 127 66" fill="none" stroke="#fffbeb" strokeWidth="4.8" strokeLinecap="round" />
              <path d="M 119 82 Q 134 83 133 70 Q 132 64 127 66" fill="none" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <path d="M 118 89 Q 127 91 130 86" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="115" cy="79" r="1.6" fill="#0f172a" />
            </g>
          )}

          {/* 7.4 หงส์ทองคู่บารมี (Centerpiece Twin Golden Swans) */}
          {flowerType === 'golden_swan' && (
            <g>
              {/* แท่นรองหงส์คู่ */}
              <ellipse cx="100" cy="110" rx="44" ry="7" fill="#92400e" stroke="#fde047" strokeWidth="1.2" />
              {/* หงส์ทองซ้าย */}
              <path d="M 64 107 C 56 96, 62 74, 77 68 C 84 65, 89 72, 84 78 C 76 78, 72 93, 86 107 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.3" />
              <path d="M 59 102 Q 70 86 84 102 Z" fill="#fde047" stroke="#92400e" strokeWidth="1" />
              <polygon points="86,70 93,73 86,76" fill="#ea580c" />
              <circle cx="81" cy="71" r="1.3" fill="#0f172a" />
              {/* หงส์ทองขวา */}
              <path d="M 136 107 C 144 96, 138 74, 123 68 C 116 65, 111 72, 116 78 C 124 78, 128 93, 114 107 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.3" />
              <path d="M 141 102 Q 130 86 116 102 Z" fill="#fde047" stroke="#92400e" strokeWidth="1" />
              <polygon points="114,70 107,73 114,76" fill="#ea580c" />
              <circle cx="119" cy="71" r="1.3" fill="#0f172a" />
              {/* ดวงแก้วมณีกลาง */}
              <circle cx="100" cy="92" r="8" fill="#fef08a" stroke="#d97706" strokeWidth="1.4" />
              <circle cx="100" cy="92" r="4" fill="#ffffff" opacity="0.85" />
            </g>
          )}

          {/* 7.5 โคมบัวแก้วทิพย์ (Centerpiece Illuminated Lotus Lamp) */}
          {flowerType === 'lotus_lamp' && (
            <g>
              {/* ฐานใบบัวรองโคม */}
              <ellipse cx="100" cy="110" rx="40" ry="7.5" fill="#0f766e" stroke="#5eead4" strokeWidth="1.2" />
              {/* กลีบบัวแก้วชั้นนอกซ้าย-ขวา */}
              <path d="M 74 107 C 54 96, 54 74, 72 68 C 74 82, 80 96, 86 107 Z" fill="#ec4899" stroke="#fbcfe8" strokeWidth="1.1" />
              <path d="M 126 107 C 146 96, 146 74, 128 68 C 126 82, 120 96, 114 107 Z" fill="#ec4899" stroke="#fbcfe8" strokeWidth="1.1" />
              {/* กลีบบัวชั้นกลาง */}
              <path d="M 82 107 C 68 88, 72 68, 86 64 C 88 80, 92 94, 96 107 Z" fill="#f472b6" stroke="#fdf2f8" strokeWidth="1.1" />
              <path d="M 118 107 C 132 88, 128 68, 114 64 C 112 80, 108 94, 104 107 Z" fill="#f472b6" stroke="#fdf2f8" strokeWidth="1.1" />
              {/* กลีบเอกตรงกลางสว่าง */}
              <path d="M 86 107 C 84 82, 92 60, 100 57 C 108 60, 116 82, 114 107 Z" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.3" />
              {/* ดวงแก้วแสงทองกลางดอกบัว */}
              <circle cx="100" cy="86" r="8" fill="#fef08a" stroke="#f59e0b" strokeWidth="1.2" />
              <circle cx="100" cy="86" r="4" fill="#ffffff" />
            </g>
          )}

          {/* 7.6 เจดีย์ทองมงคล (Centerpiece Golden Pagoda) */}
          {flowerType === 'gold_pagoda' && (
            <g>
              {/* ฐานสิงห์ 2 ชั้น */}
              <rect x="64" y="106" width="72" height="8" rx="2" fill="#92400e" stroke="#fde047" strokeWidth="1.1" />
              <rect x="72" y="100" width="56" height="6.5" rx="1.5" fill="#d97706" stroke="#fef08a" strokeWidth="1" />
              {/* องค์ระฆังคว่ำสีทอง */}
              <path d="M 78 100 C 78 82 86 76 100 76 C 114 76 122 82 122 100 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1.2" />
              {/* บัลลังก์และปล้องไฉน */}
              <rect x="92" y="72" width="16" height="5" fill="#fde047" stroke="#92400e" strokeWidth="0.9" />
              <path d="M 95 72 L 100 52 L 105 72 Z" fill="#fef08a" stroke="#92400e" strokeWidth="1" />
              <circle cx="100" cy="51" r="2" fill="#ffffff" />
              {/* ฉัตรทองขนาบซ้าย-ขวา */}
              <line x1="68" y1="106" x2="68" y2="75" stroke="#fde047" strokeWidth="1.8" />
              <path d="M 62 84 L 68 74 L 74 84 Z M 63 91 L 68 83 L 73 91 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="0.8" />
              <line x1="132" y1="106" x2="132" y2="75" stroke="#fde047" strokeWidth="1.8" />
              <path d="M 126 84 L 132 74 L 138 84 Z M 127 91 L 132 83 L 137 91 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="0.8" />
            </g>
          )}

          {/* 7.7 เรือสุพรรณหงส์ (Centerpiece Royal Barge) */}
          {flowerType === 'royal_barge' && (
            <g>
              {/* ตัวเรือโค้งทองคำ */}
              <path d="M 52 88 Q 100 112 148 90 Q 134 114 100 114 Q 66 114 52 88 Z" fill="#d97706" stroke="#fde047" strokeWidth="1.3" />
              <path d="M 64 98 Q 100 110 136 98" fill="none" stroke="#fef08a" strokeWidth="1.2" />
              {/* หัวเรือสุพรรณหงส์ซ้าย */}
              <path d="M 54 92 C 44 82, 46 66, 56 64 C 60 64, 62 69, 58 72 C 54 71, 53 81, 61 92 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1.1" />
              <polygon points="58,66 64,68 58,70" fill="#ea580c" />
              {/* ท้ายเรือขวา */}
              <path d="M 146 92 C 154 84, 152 72, 145 72 C 147 78, 144 86, 139 92 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
              {/* บุษบกกลางลำเรือ */}
              <rect x="86" y="84" width="28" height="16" rx="1.5" fill="#991b1b" stroke="#fde047" strokeWidth="1.1" />
              <path d="M 83 84 L 100 72 L 117 84 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
              <path d="M 97 72 L 100 61 L 103 72 Z" fill="#fef08a" stroke="#92400e" strokeWidth="0.8" />
            </g>
          )}

          {/* 7.8 หัวใจเพชรคู่รัก (Centerpiece Crystal Heart) */}
          {flowerType === 'crystal_heart' && (
            <g>
              {/* หมอนทองรองรับ */}
              <ellipse cx="100" cy="108" rx="34" ry="8" fill="#9d174d" stroke="#fde047" strokeWidth="1.4" />
              {/* หัวใจคริสตัลใหญ่ตรงกลาง */}
              <path
                d="M 100 76 C 100 62, 74 56, 70 74 C 66 90, 100 107, 100 112 C 100 107, 134 90, 130 74 C 126 56, 100 62, 100 76 Z"
                fill="#ec4899"
                stroke="#fce7f3"
                strokeWidth="1.8"
              />
              {/* เหลี่ยมเจียระไนเพชรด้านใน */}
              <polygon points="100,77 83,70 76,80 100,104 124,80 117,70" fill="#f472b6" opacity="0.65" />
              <polygon points="100,77 88,73 100,104 112,73" fill="#fbcfe8" opacity="0.7" />
              <circle cx="84" cy="74" r="3" fill="#ffffff" opacity="0.85" />
            </g>
          )}
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
