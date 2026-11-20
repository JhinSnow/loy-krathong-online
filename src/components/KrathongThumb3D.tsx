// src/components/KrathongThumb3D.tsx
// แสดงผลภาพกระทง 3 มิติจาก Shared Offscreen Renderer พร้อม Fallback เป็น SVG 2D อัตโนมัติ

import React, { useEffect, useState } from 'react';
import { getCachedKrathongThumb3D, renderKrathongThumb3D } from '../three/krathongThumbnail';
import { KrathongVisual } from './KrathongVisual';

interface KrathongThumb3DProps {
  baseType: string;
  flowerType: string;
  candleColor: string;
  size?: 'sm' | 'md' | 'lg';
}

export const KrathongThumb3D: React.FC<KrathongThumb3DProps> = ({
  baseType,
  flowerType,
  candleColor,
  size = 'md'
}) => {
  const pixelSize = size === 'sm' ? 220 : size === 'lg' ? 380 : 300;
  const cached = getCachedKrathongThumb3D(baseType, flowerType, candleColor, pixelSize);
  const [rendered, setRendered] = useState<{ key: string; url: string | null }>(() => ({
    key: `${baseType}|${flowerType}|${candleColor}|${pixelSize}`,
    url: cached
  }));

  const currentKey = `${baseType}|${flowerType}|${candleColor}|${pixelSize}`;
  const activeUrl = cached || (rendered.key === currentKey ? rendered.url : null);

  useEffect(() => {
    let cancelled = false;
    if (cached) return;

    renderKrathongThumb3D(baseType, flowerType, candleColor, pixelSize).then((url) => {
      if (!cancelled) {
        setRendered({ key: currentKey, url });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [baseType, flowerType, candleColor, pixelSize, cached, currentKey]);

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-52 h-52',
    lg: 'w-68 h-68'
  }[size];

  if (!activeUrl) {
    return (
      <KrathongVisual
        baseType={baseType}
        flowerType={flowerType}
        candleColor={candleColor}
        size={size}
      />
    );
  }

  return (
    <div className={`relative ${sizeClasses} flex items-center justify-center select-none`}>
      <img
        src={activeUrl}
        alt="ตัวอย่างกระทง 3 มิติ"
        className="w-full h-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
      />
    </div>
  );
};
