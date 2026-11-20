// src/components/KrathongIcons.tsx
// ชุดไอคอนเส้นมินิมอลเข้าชุดกับ Lucide สำหรับสัญลักษณ์งานฝีมือไทยและแลนด์มาร์ก ม.อ. (ปลอดอิโมจิ 100%)

import React from 'react';
import {
  Leaf,
  Crown,
  Gem,
  Flower2,
  Sparkles,
  Heart,
  GraduationCap,
  Coins
} from 'lucide-react';

export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const LotusIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M12 4.5C9.7 8.2 9.2 12 12 15.8c2.8-3.8 2.3-7.6 0-11.3Z" />
    <path d="M10.2 15.3C6.8 14.3 5 11.4 5.2 7.8c2.6 1 4.4 3.2 5 7.5Z" />
    <path d="M13.8 15.3c3.4-1 5.2-3.9 5-7.5-2.6 1-4.4 3.2-5 7.5Z" />
    <path d="M7.5 17.5c-2.5-.2-4.2-1.4-4.7-3.6 1.8.1 3.3.9 4.7 3.6Z" />
    <path d="M16.5 17.5c2.5-.2 4.2-1.4 4.7-3.6-1.8.1-3.3.9-4.7 3.6Z" />
    <path d="M6.5 19.2c3.5.7 7.5.7 11 0" />
  </svg>
);

export const PumpkinBuildingIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M3 18.5h18" />
    <path d="M4.5 18.5C4.5 11.5 7.5 7.5 12 7.5s7.5 4 7.5 11" />
    <path d="M8.5 18.5c0-6.5 1.5-11 3.5-11s3.5 4.5 3.5 11" />
    <path d="M12 7.5v11" />
    <path d="M9.5 6.8h5" />
  </svg>
);

export const ElephantIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M6 19v-5.5c0-3.2 2.2-5.5 5.5-5.5H15c2.5 0 4.5 1.8 4.5 4.4v1.8c0 1.4 1 2.3 1.7 2.8.4.3.2 1-.3 1-.9 0-1.9-.7-2.4-1.7" />
    <path d="M10.5 8.2C9 9.5 8.5 12.2 9.5 14c1 .5 2.4.3 3.2-.6" />
    <path d="M6 13.5c-1.3.4-2 1.5-2 2.8" />
    <path d="M8.5 19v-3" />
    <path d="M14.5 19v-3" />
    <circle cx="15.8" cy="11.2" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const SwanIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M18.2 7.8c-.4-2-2.2-3.1-3.8-2.3-1.6.8-1.4 3.2-.4 5.2.8 1.6 1 3.3.3 4.8H6.2c-.8-1.8-1.7-3.4-2.7-4.5 2.8.2 5 1 6.7 2.2" />
    <path d="M18.2 7.8l2 .8-1.6.9" />
    <path d="M4 18.8h15.5" />
  </svg>
);

export const PagodaIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M12 3v3" />
    <path d="M10.5 6h3L15 11H9l1.5-5Z" />
    <path d="M7.5 14.5h9L15 11H9l-1.5 3.5Z" />
    <path d="M5.5 19.5h13v-3.5h-13v3.5Z" />
    <path d="M4 19.5h16" />
  </svg>
);

export const RoyalBargeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M3.5 14.5c2 2.5 5 3.5 9 3.5 4.2 0 7-1 8.5-4-1.2.4-2.5.4-4 .2-1.5-2.5-.8-6 1.2-7.5-2.6.2-4.2 2-4.4 4.8H7.5c-1.5 0-2.8-1-4-2.2" />
    <path d="M9.5 14.5v-3.2h4v3.2" />
    <path d="M3 20c2.2-.8 4.4-.8 6.5 0s4.3.8 6.5 0 3.8-.5 5 0" />
  </svg>
);

export const SkyLanternIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M12 3.5c3.8 0 6.5 2.4 6.5 5.8 0 3.2-2 6.4-3.3 8.2H8.8c-1.3-1.8-3.3-5-3.3-8.2 0-3.4 2.7-5.8 6.5-5.8Z" />
    <path d="M9 17.5h6" />
    <path d="M10.5 20h3" />
    <circle cx="12" cy="14" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const CandleIncenseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M9 4.5c1.2 1.3 1.4 2.7 0 3.8-1.4-1.1-1.2-2.5 0-3.8Z" />
    <rect x="7" y="10" width="4" height="10" rx="1" />
    <path d="M14.5 20V8" />
    <path d="M17.2 20l1.3-11.5" />
    <path d="M5 20h14" />
  </svg>
);

export const ButterflyIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M12 7.5v10" />
    <path d="M12 10.5C9.5 6.2 4.5 5.2 4 9c-.4 2.8 2.2 4.6 5 4.8-2.4.7-3.7 2.5-2.7 4.4 1 1.7 3.8 1.2 5.7-1.4" />
    <path d="M12 10.5c2.5-4.3 7.5-5.3 8-1.5.4 2.8-2.2 4.6-5 4.8 2.4.7 3.7 2.5 2.7 4.4-1 1.7-3.8 1.2-5.7-1.4" />
    <path d="M10.5 5.2L12 7.5l1.5-2.3" />
  </svg>
);

export const PeacockIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M4.5 14.5a7.5 7.5 0 0 1 15 0" />
    <path d="M12 7v4.5" />
    <path d="M7.5 8.5l2.5 3.5" />
    <path d="M16.5 8.5L14 12" />
    <path d="M10.2 19.5c.3-2.5.8-4.5 1.8-4.5s1.5 2 1.8 4.5H10.2Z" />
  </svg>
);

export const CoconutIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <ellipse cx="12" cy="11" rx="8" ry="3.5" />
    <path d="M4 11c0 4.8 3.6 8 8 8s8-3.2 8-8" />
    <path d="M8.5 11.2c2.2.6 4.8.6 7 0" />
  </svg>
);

export const BreadLoafIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M5.5 12c-1.2-.5-2-1.6-2-3 0-1.9 1.6-3.5 3.5-3.5 1.1 0 2.1.5 2.7 1.3.7-.5 1.5-.8 2.3-.8s1.6.3 2.3.8c.6-.8 1.6-1.3 2.7-1.3 1.9 0 3.5 1.6 3.5 3.5 0 1.4-.8 2.5-2 3v5.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5V12Z" />
    <path d="M9.5 12.5v3" />
    <path d="M14.5 12.5v3" />
  </svg>
);

export const FlagGarlandIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M3 6.5c5.5 3 12.5 3 18 0" />
    <path d="M5 7.5l2 5 2-4.4" />
    <path d="M10 8.5l2 5 2-5" />
    <path d="M15 8.1l2 4.4 2-5" />
  </svg>
);

export const KrathongItemIcon: React.FC<IconProps & { id: string }> = ({
  id,
  className = 'w-4 h-4',
  style
}) => {
  switch (id) {
    // Bases
    case 'banana_leaf':
      return <Leaf className={className} style={style} aria-hidden="true" />;
    case 'banana_gold':
      return <Crown className={className} style={style} aria-hidden="true" />;
    case 'lotus':
      return <LotusIcon className={className} style={style} />;
    case 'lotus_crystal':
      return <Gem className={className} style={style} aria-hidden="true" />;
    case 'coconut':
      return <CoconutIcon className={className} style={style} />;
    case 'bread':
      return <BreadLoafIcon className={className} style={style} />;
    case 'ice_swan':
      return <SwanIcon className={className} style={style} />;
    case 'peacock_royal':
      return <PeacockIcon className={className} style={style} />;

    // Flowers
    case 'lotus_flower':
      return <LotusIcon className={className} style={style} />;
    case 'marigold':
    case 'orchid':
    case 'jasmine':
    case 'rose':
    case 'dok_kem':
    case 'anchan':
    case 'mixed_garland':
      return <Flower2 className={className} style={style} aria-hidden="true" />;

    // Centerpieces
    case 'pumpkin':
      return <PumpkinBuildingIcon className={className} style={style} />;
    case 'noppamas_crown':
      return <Crown className={className} style={style} aria-hidden="true" />;
    case 'elephant_gold':
      return <ElephantIcon className={className} style={style} />;
    case 'golden_swan':
      return <SwanIcon className={className} style={style} />;
    case 'lotus_lamp':
      return <LotusIcon className={className} style={style} />;
    case 'gold_pagoda':
      return <PagodaIcon className={className} style={style} />;
    case 'royal_barge':
      return <RoyalBargeIcon className={className} style={style} />;
    case 'crystal_heart':
      return <Gem className={className} style={style} aria-hidden="true" />;

    // Accessories
    case 'sparkler':
      return <Sparkles className={className} style={style} aria-hidden="true" />;
    case 'sky_lantern':
      return <SkyLanternIcon className={className} style={style} />;
    case 'heart_sign':
      return <Heart className={className} style={style} aria-hidden="true" />;
    case 'grad_cap':
      return <GraduationCap className={className} style={style} aria-hidden="true" />;
    case 'lucky_coin':
      return <Coins className={className} style={style} aria-hidden="true" />;
    case 'flag_thai':
      return <FlagGarlandIcon className={className} style={style} />;
    case 'butterfly':
      return <ButterflyIcon className={className} style={style} />;
    case 'none':
      return <CandleIncenseIcon className={className} style={style} />;

    default:
      return <Sparkles className={className} style={style} aria-hidden="true" />;
  }
};
