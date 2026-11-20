// src/components/KrathongThumb3D.tsx
// แสดงผลภาพกระทง 3 มิติจาก Shared Offscreen Renderer พร้อม Lazy-Load (IntersectionObserver) และ Placeholder ลดภาระ CPU/DOM

import React, { useEffect, useRef, useState } from 'react';
import { getCachedKrathongThumb3D, renderKrathongThumb3D } from '../three/krathongThumbnail';
import { KrathongVisual } from './KrathongVisual';
import { LotusIcon } from './KrathongIcons';

interface KrathongThumb3DProps {
  baseType: string;
  flowerType: string;
  candleColor: string;
  size?: 'sm' | 'md' | 'lg';
  lazy?: boolean;
}

export const KrathongThumb3D: React.FC<KrathongThumb3DProps> = ({
  baseType,
  flowerType,
  candleColor,
  size = 'md',
  lazy = false
}) => {
  const pixelSize = size === 'sm' ? 220 : size === 'lg' ? 380 : 300;
  const cached = getCachedKrathongThumb3D(baseType, flowerType, candleColor, pixelSize);
  const currentKey = `${baseType}|${flowerType}|${candleColor}|${pixelSize}`;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(() => !lazy || Boolean(cached));
  const [renderFailed, setRenderFailed] = useState<boolean>(false);
  const [rendered, setRendered] = useState<{ key: string; url: string | null }>(() => ({
    key: currentKey,
    url: cached
  }));

  useEffect(() => {
    if (!lazy || isVisible || cached) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '180px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy, isVisible, cached]);

  const activeUrl = cached || (rendered.key === currentKey ? rendered.url : null);

  useEffect(() => {
    let cancelled = false;
    if (!isVisible || cached) return;

    renderKrathongThumb3D(baseType, flowerType, candleColor, pixelSize).then((url) => {
      if (cancelled) return;
      if (url) {
        setRenderFailed(false);
        setRendered({ key: currentKey, url });
      } else {
        setRenderFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [baseType, flowerType, candleColor, pixelSize, cached, currentKey, isVisible]);

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-52 h-52',
    lg: 'w-68 h-68'
  }[size];

  if (!activeUrl && renderFailed) {
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
    <div
      ref={containerRef}
      className={`relative ${sizeClasses} flex items-center justify-center select-none`}
    >
      {activeUrl ? (
        <img
          src={activeUrl}
          alt="ตัวอย่างกระทง 3 มิติ"
          className="w-full h-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)] animate-ui-fade"
        />
      ) : (
        <div className="w-[74%] h-[74%] rounded-full bg-amber-500/10 border border-amber-400/20 flex items-center justify-center animate-ui-skeleton">
          <LotusIcon className="w-7 h-7 text-amber-300/60" />
        </div>
      )}
    </div>
  );
};
