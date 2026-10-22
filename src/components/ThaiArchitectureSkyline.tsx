// src/components/ThaiArchitectureSkyline.tsx
import React from 'react';

export const ThaiArchitectureSkyline: React.FC = () => {
  return (
    <div className="absolute inset-x-0 bottom-[60vh] sm:bottom-[62vh] h-52 sm:h-64 md:h-80 pointer-events-none select-none z-10 overflow-hidden">
      {/* Golden Backlight Ambient Spotlight behind Centerpiece Pumpkin Building */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[420px] sm:w-[560px] md:w-[680px] h-36 bg-gradient-to-t from-amber-500/35 via-yellow-400/20 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Golden Backlight Ambient Aura across riverbank */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-amber-500/20 via-yellow-500/10 to-transparent blur-2xl pointer-events-none" />

      {/* Responsive Thai Architecture Skyline SVG Layer */}
      <svg
        viewBox="0 0 1600 320"
        preserveAspectRatio="xMidYMax meet"
        className="w-full h-full drop-shadow-[0_-3px_18px_rgba(245,158,11,0.45)] opacity-95 overflow-visible"
      >
        <defs>
          {/* Main Architecture Golden Gradient */}
          <linearGradient id="templeGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="65%" stopColor="#b45309" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0b132b" stopOpacity="0.9" />
          </linearGradient>

          {/* Prang Wat Arun Golden Gradient */}
          <linearGradient id="prangGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
            <stop offset="15%" stopColor="#fde047" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#d97706" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#1c2541" stopOpacity="0.85" />
          </linearGradient>

          {/* Real Fluted Pumpkin Vault Gold Gradient */}
          <linearGradient id="vaultGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
            <stop offset="20%" stopColor="#fde047" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="90%" stopColor="#b45309" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0b132b" stopOpacity="0.9" />
          </linearGradient>

          {/* Fluted Vault Ridge Side Gradient (สร้างแสงเงาร่องกลีบ) */}
          <linearGradient id="vaultShadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#b45309" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#78350f" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0b132b" stopOpacity="0.95" />
          </linearGradient>

          {/* Golden Aura Radial Gradient for Stupa Tip */}
          <radialGradient id="spireAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ----------------- 1. ยอดรัศมีเรืองรอง ----------------- */}
        {/* Chedi Left Spire Glow */}
        <circle cx="310" cy="85" r="20" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="310" cy="85" r="3" fill="#fffbeb" />

        {/* Chedi Right Spire Glow */}
        <circle cx="1290" cy="85" r="20" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="1290" cy="85" r="3" fill="#fffbeb" />

        {/* ----------------- 2. แนวสถาปัตยกรรมไทยริมตลิ่ง (ฝั่งซ้ายและขวา) ----------------- */}
        <g fill="url(#templeGoldGrad)" stroke="#fde047" strokeWidth="1" strokeOpacity="0.6">

          {/* --- ฝั่งซ้าย: ศาลาท่าน้ำ & พระอุโบสถ --- */}
          <path d="M 20 320 L 20 270 L 90 230 L 160 270 L 160 320 Z" />
          <path d="M 10 275 Q 15 260 30 265 L 90 220 L 150 265 Q 165 260 170 275" fill="none" strokeWidth="2" stroke="#fde047" />

          {/* พระอุโบสถฝั่งซ้าย */}
          <path d="M 190 230 L 230 180 L 270 230 Z" />
          <path d="M 228 180 Q 224 165 230 155 Q 236 165 232 180" fill="none" strokeWidth="2.5" stroke="#fffbeb" />
          <path d="M 160 260 L 230 205 L 300 260 Z" />
          <path d="M 130 320 L 130 270 L 230 225 L 330 270 L 330 320 Z" />

          {/* พระเจดีย์ทรงระฆังคว่ำองค์ซ้าย */}
          <path d="M 308 85 L 312 85 L 314 140 L 306 140 Z" />
          <path d="M 302 140 L 318 140 L 315 165 L 305 165 Z" />
          <path d="M 295 165 L 325 165 L 332 205 Q 335 235 310 238 Q 285 235 288 205 Z" />
          <path d="M 270 320 L 270 265 L 282 240 L 338 240 L 350 265 L 350 320 Z" />

          {/* พระปรางค์องค์เสริมฝั่งซ้าย */}
          <path d="M 420 320 L 420 235 L 445 135 L 450 135 L 475 235 L 475 320 Z" fill="url(#prangGoldGrad)" />

          {/* --- ฝั่งขวา: พระปรางค์องค์เสริมฝั่งขวา --- */}
          <path d="M 1125 320 L 1125 235 L 1150 135 L 1155 135 L 1180 235 L 1180 320 Z" fill="url(#prangGoldGrad)" />

          {/* พระเจดีย์ทรงระฆังคว่ำองค์ขวา */}
          <path d="M 1288 85 L 1292 85 L 1294 140 L 1286 140 Z" />
          <path d="M 1282 140 L 1298 140 L 1295 165 L 1285 165 Z" />
          <path d="M 1275 165 L 1305 165 L 1312 205 Q 1315 235 1290 238 Q 1265 235 1268 205 Z" />
          <path d="M 1250 320 L 1250 265 L 1262 240 L 1318 240 L 1330 265 L 1330 320 Z" />

          {/* วิหารหลวงหลังคาซ้อน 3 ชั้นฝั่งขวา */}
          <path d="M 1370 240 L 1420 185 L 1470 240 Z" />
          <path d="M 1418 185 Q 1414 170 1420 160 Q 1426 170 1422 185" fill="none" strokeWidth="2.5" stroke="#fffbeb" />
          <path d="M 1340 275 L 1420 215 L 1500 275 Z" />
          <path d="M 1310 320 L 1310 280 L 1420 230 L 1530 280 L 1530 320 Z" />

          {/* ----------------- แนวกำแพงแก้ว ใบเสมา ----------------- */}
          <rect x="0" y="302" width="580" height="18" fill="#1c2541" stroke="#f59e0b" strokeWidth="1" />
          <rect x="1020" y="302" width="580" height="18" fill="#1c2541" stroke="#f59e0b" strokeWidth="1" />

          {[80, 180, 390, 510, 1080, 1210, 1360, 1490].map((pos, i) => (
            <g key={i} transform={`translate(${pos}, 288)`}>
              <rect x="0" y="0" width="10" height="16" rx="2" fill="#d97706" />
              <circle cx="5" cy="-2" r="4.5" fill="#fde047" />
            </g>
          ))}
        </g>

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (ปรับกลีบทั้ง 8 ให้มีขนาดความกว้างและความสูงเท่ากันสม่ำเสมอสมมาตร) ----------------- */}
        <g id="realPumpkinBuildingPSU" className="drop-shadow-[0_0_24px_rgba(251,191,36,0.75)]">
          {/* ช่องซุ้มเงาลึกด้านใน (Under-shell Shadow Arc) */}
          <rect x="510" y="292" width="580" height="13" fill="#060c1a" stroke="#d97706" strokeWidth="1" />

          {/* เสาค้ำรอบอาคารรับแรงกลีบเปลือกบาง ติดแนบตลิ่ง */}
          {[525, 555, 585, 615, 645, 675, 705, 735, 765, 790, 810, 835, 865, 895, 925, 955, 985, 1015, 1045, 1075].map((x, i) => (
            <line key={i} x1={x} y1="292" x2={x} y2="305" stroke="#f59e0b" strokeWidth="1.2" opacity="0.8" />
          ))}

          {/* 
            กลีบทั้ง 8 มีขนาดเท่ากันทุกประการ (ความกว้างกลีบละ 69px, ความสูงแตะยอดที่ y=155 เท่ากันทั้งหมด)
            - ซ้าย 4 กลีบ (x: 521 ถึง 797): 4 x 69px = 276px
            - Gap ตรงกลาง: x: 797 ถึง 803 (6px)
            - ขวา 4 กลีบ (x: 803 ถึง 1079): 4 x 69px = 276px
            - ซุ้มโค้งใต้กลีบเป็นสีขาวบริสุทธิ์ #FFFFFF ขนาดเท่ากันทุกกลีบ
          */}

          {/* กลีบ 1 (x: 521 -> 590) */}
          <path
            d="M 521 292 C 518 195, 535 155, 555.5 155 C 576 155, 593 195, 590 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          <path d="M 526 292 Q 555.5 258 585 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 2 (x: 590 -> 659) */}
          <path
            d="M 590 292 C 587 195, 604 155, 624.5 155 C 645 155, 662 195, 659 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          <path d="M 595 292 Q 624.5 258 654 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 3 (x: 659 -> 728) */}
          <path
            d="M 659 292 C 656 195, 673 155, 693.5 155 C 714 155, 731 195, 728 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          <path d="M 664 292 Q 693.5 258 723 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 4 (กลางซ้าย, x: 728 -> 797) */}
          <path
            d="M 728 292 C 725 195, 742 155, 762.5 155 C 783 155, 800 195, 797 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="1.8"
          />
          <path d="M 733 292 Q 762.5 258 792 292" fill="#FFFFFF" stroke="#fffbeb" strokeWidth="1.4" />

          {/* === รอยแยกตรงกลางชัดเจน (Center Gap: x: 797 ถึง 803 กว้าง 6px) === */}
          <line x1="800" y1="155" x2="800" y2="292" stroke="#060c1a" strokeWidth="2.5" opacity="0.9" />

          {/* กลีบ 5 (กลางขวา, x: 803 -> 872) */}
          <path
            d="M 803 292 C 800 195, 817 155, 837.5 155 C 858 155, 875 195, 872 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="1.8"
          />
          <path d="M 808 292 Q 837.5 258 867 292" fill="#FFFFFF" stroke="#fffbeb" strokeWidth="1.4" />

          {/* กลีบ 6 (x: 872 -> 941) */}
          <path
            d="M 872 292 C 869 195, 886 155, 906.5 155 C 927 155, 944 195, 941 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          <path d="M 877 292 Q 906.5 258 936 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 7 (x: 941 -> 1010) */}
          <path
            d="M 941 292 C 938 195, 955 155, 975.5 155 C 996 155, 1013 195, 1010 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          <path d="M 946 292 Q 975.5 258 1005 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 8 (x: 1010 -> 1079) */}
          <path
            d="M 1010 292 C 1007 195, 1024 155, 1044.5 155 C 1065 155, 1082 195, 1079 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          <path d="M 1015 292 Q 1044.5 258 1074 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* สันโครงนูนกลมมนลากผ่านกลางแต่ละกลีบ (ตำแหน่งกึ่งกลางสมมาตรเท่ากันทุกกลีบ) */}
          <path d="M 555.5 155 Q 556 225 555.5 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 624.5 155 Q 625 225 624.5 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 693.5 155 Q 694 225 693.5 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 762.5 155 Q 763 225 762.5 292" fill="none" stroke="#fffbeb" strokeWidth="1.8" />

          <path d="M 837.5 155 Q 837 225 837.5 292" fill="none" stroke="#fffbeb" strokeWidth="1.8" />
          <path d="M 906.5 155 Q 906 225 906.5 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 975.5 155 Q 975 225 975.5 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 1044.5 155 Q 1044 225 1044.5 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />

          {/* ชายคาระเบียงคลื่นหยักโค้งต่อเนื่องแบบ Seamless Scalloped Ribbon ช่วงละ 69px สม่ำเสมอเป๊ะ */}
          <path
            d="M 521 292 
               Q 555.5 276 590 292 
               Q 624.5 276 659 292 
               Q 693.5 276 728 292 
               Q 762.5 276 797 292 
               M 803 292
               Q 837.5 276 872 292 
               Q 906.5 276 941 292 
               Q 975.5 276 1010 292 
               Q 1044.5 276 1079 292"
            fill="none"
            stroke="#fffbeb"
            strokeWidth="2.8"
          />

          {/* ฐานตึกเตี้ยบางๆ แนบสนิทบนแนวพื้นหินตลิ่งริมแม่น้ำ */}
          <rect x="510" y="304" width="580" height="16" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />
          <line x1="515" y1="316" x2="1085" y2="316" stroke="#f59e0b" strokeWidth="1.5" />

          {/* บันไดท่าน้ำกลาง ทอดยาวลงสู่แม่น้ำอย่างกลมกลืน */}
          <polygon points="730,320 870,320 890,345 710,345" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของทรงกลีบมนตึกฟักทองทอดลงบนผิวน้ำ (Soft Scalloped Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
