// src/components/KrathongVisual.tsx
import React from 'react';

interface KrathongVisualProps {
  baseType: string;
  flowerType: string;
  candleColor: string;
  size?: 'sm' | 'md' | 'lg';
}

export const KrathongVisual: React.FC<KrathongVisualProps> = ({
  baseType,
  flowerType,
  candleColor,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  }[size];

  // Base Colors
  const baseColorMap: Record<string, { top: string; bottom: string; border: string }> = {
    banana_leaf: { top: '#2d6a4f', bottom: '#1b4332', border: '#40916c' },
    coconut: { top: '#7f4f24', bottom: '#582f0e', border: '#936639' },
    bread: { top: '#ddb892', bottom: '#b08968', border: '#e6ccb2' },
    lotus: { top: '#d90429', bottom: '#9b2226', border: '#ef233c' }
  };

  // Flower Colors
  const flowerColorMap: Record<string, string> = {
    marigold: '#fbbf24', // ดอกดาวเรือง เหลืองสด
    lotus_flower: '#f43f5e', // ดอกบัว ชมพู
    orchid: '#c084fc' // ดอกกล้วยไม้ ม่วง
  };

  // Candle Flames
  const candleColorMap: Record<string, { flame: string; body: string }> = {
    yellow: { flame: '#fde047', body: '#eab308' },
    red: { flame: '#f87171', body: '#dc2626' },
    orange: { flame: '#fb923c', body: '#ea580c' },
    cyan: { flame: '#38bdf8', body: '#0284c7' }
  };

  const base = baseColorMap[baseType] || baseColorMap.banana_leaf;
  const flowerColor = flowerColorMap[flowerType] || flowerColorMap.marigold;
  const candle = candleColorMap[candleColor] || candleColorMap.yellow;

  return (
    <div className={`relative ${sizeClasses} flex items-center justify-center select-none`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
        <defs>
          {/* Candle Glow */}
          <radialGradient id="candleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={candle.flame} stopOpacity="0.9" />
            <stop offset="40%" stopColor={candle.flame} stopOpacity="0.4" />
            <stop offset="100%" stopColor={candle.flame} stopOpacity="0" />
          </radialGradient>
          {/* Base Gradient */}
          <linearGradient id="baseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={base.top} />
            <stop offset="100%" stopColor={base.bottom} />
          </linearGradient>
        </defs>

        {/* Ambient Candle Light Glow */}
        <circle cx="100" cy="55" r="40" fill="url(#candleGlow)" className="animate-pulse" />

        {/* --- Incense Sticks (ธูป 3 ดอก) --- */}
        <line x1="88" y1="90" x2="84" y2="45" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="93" y1="90" x2="93" y2="40" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="98" y1="90" x2="102" y2="45" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        {/* Incense Ember Tips */}
        <circle cx="84" cy="45" r="2" fill="#ef4444" className="animate-ping" />
        <circle cx="93" cy="40" r="2" fill="#ef4444" className="animate-ping" />
        <circle cx="102" cy="45" r="2" fill="#ef4444" className="animate-ping" />

        {/* --- Candle (เทียนเล่มหลัก) --- */}
        <rect x="97" y="60" width="8" height="35" rx="2" fill={candle.body} />
        {/* Candle Wick */}
        <line x1="101" y1="60" x2="101" y2="52" stroke="#1c1917" strokeWidth="2" />
        {/* Candle Flame */}
        <path
          d="M 101 42 C 96 50, 96 54, 101 55 C 106 54, 106 50, 101 42 Z"
          fill={candle.flame}
          className="animate-pulse origin-bottom"
        />

        {/* --- Flowers (ดอกไม้ล้อมรอบเทียน) --- */}
        {/* กลีบดอกไม้วนรอบ */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <ellipse
            key={i}
            cx={100 + Math.cos((angle * Math.PI) / 180) * 28}
            cy={95 + Math.sin((angle * Math.PI) / 180) * 12}
            rx="12"
            ry="7"
            fill={flowerColor}
            stroke="#ffffff"
            strokeWidth="0.8"
            transform={`rotate(${angle}, ${100 + Math.cos((angle * Math.PI) / 180) * 28}, ${95 + Math.sin((angle * Math.PI) / 180) * 12})`}
          />
        ))}
        {/* เกสรตรงกลาง */}
        <circle cx="100" cy="95" r="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

        {/* --- Krathong Base (ฐานกระทง) --- */}
        {/* กลีบใบตอง/กระทงชั้นนอก */}
        <path
          d="M 25 125 C 20 100, 45 95, 55 115 C 65 92, 95 90, 100 115 C 105 90, 135 92, 145 115 C 155 95, 180 100, 175 125 Z"
          fill={base.top}
          stroke={base.border}
          strokeWidth="2"
        />

        {/* ตัวฐานกระทงรูปทรงกระบอกมน */}
        <ellipse cx="100" cy="125" rx="72" ry="24" fill="url(#baseGrad)" stroke={base.border} strokeWidth="2.5" />
        <path
          d="M 28 125 C 28 148, 172 148, 172 125 L 168 142 C 168 162, 32 162, 32 142 Z"
          fill={base.bottom}
          stroke={base.border}
          strokeWidth="2"
        />
        <ellipse cx="100" cy="142" rx="68" ry="19" fill={base.bottom} opacity="0.7" />

        {/* หมุดปักใบตองจำลอง */}
        <circle cx="50" cy="130" r="2.5" fill="#fef08a" />
        <circle cx="100" cy="138" r="2.5" fill="#fef08a" />
        <circle cx="150" cy="130" r="2.5" fill="#fef08a" />
      </svg>
    </div>
  );
};
