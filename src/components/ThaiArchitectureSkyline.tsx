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

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (เพิ่ม Gap ตรงกลาง 6px และต่อปลายขอบกลีบแบบ Seamless Snapping) ----------------- */}
        <g id="realPumpkinBuildingPSU" className="drop-shadow-[0_0_22px_rgba(251,191,36,0.7)]">
          {/* ช่องซุ้มเงาลึกด้านใน (Under-shell Shadow Arc) */}
          <rect x="525" y="290" width="550" height="15" fill="#060c1a" stroke="#d97706" strokeWidth="1" />

          {/* เสาค้ำรอบอาคารรับแรงกลีบเปลือกบาง */}
          {[540, 570, 600, 630, 660, 690, 720, 750, 780, 810, 840, 870, 900, 930, 960, 990, 1020, 1050].map((x, i) => (
            <line key={i} x1={x} y1="290" x2={x} y2="304" stroke="#f59e0b" strokeWidth="1.2" opacity="0.8" />
          ))}

          {/* 8 กลีบคอนกรีต: ปลายขอบกลีบชนกันต่อเนื่อง (Seamless Junctions) + แยก Center Gap 6px (797 vs 803) */}
          
          {/* กลีบ 1 (x: 520 -> 590, จุดต่อ x=590) */}
          <path
            d="M 520 292 C 512 210, 555 178, 580 180 C 596 182, 594 245, 590 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          <path d="M 524 292 Q 555 264 586 292" fill="#060c1a" stroke="#fde047" strokeWidth="1" />

          {/* กลีบ 2 (x: 590 -> 660, จุดต่อ x=660) */}
          <path
            d="M 590 292 C 586 190, 632 154, 658 156 C 674 158, 666 240, 660 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          <path d="M 594 292 Q 625 258 656 292" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 3 (x: 660 -> 728, จุดต่อ x=728) */}
          <path
            d="M 660 292 C 658 172, 702 138, 726 140 C 740 142, 734 235, 728 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          <path d="M 664 292 Q 694 252 724 292" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 4 (กลางซ้าย, x: 728 -> 797 | ชนกลีบ 3 ที่ 728, จบที่ 797 เพื่อเปิด Gap) */}
          <path
            d="M 728 292 C 726 160, 770 130, 792 130 C 802 130, 800 230, 797 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="2"
          />
          <path d="M 732 292 Q 762 244 793 292" fill="#060c1a" stroke="#fffbeb" strokeWidth="1.5" />

          {/* === รอยแยกตรงกลางชัดเจน (Vertical Seam / Center Gap: x: 797 ถึง 803 กว้าง 6px) === */}
          <line x1="800" y1="130" x2="800" y2="292" stroke="#060c1a" strokeWidth="2.5" opacity="0.9" />

          {/* กลีบ 5 (กลางขวา, x: 803 -> 872 | เริ่มที่ 803 เว้น Gap, จบที่ 872 เพื่อชนกลีบ 6) */}
          <path
            d="M 803 292 C 800 230, 798 130, 808 130 C 830 130, 874 160, 872 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="2"
          />
          <path d="M 807 292 Q 838 244 868 292" fill="#060c1a" stroke="#fffbeb" strokeWidth="1.5" />

          {/* กลีบ 6 (x: 872 -> 940, จุดต่อ x=872 และ x=940) */}
          <path
            d="M 872 292 C 866 235, 860 142, 874 140 C 898 138, 942 172, 940 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          <path d="M 876 292 Q 906 252 936 292" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 7 (x: 940 -> 1010, จุดต่อ x=940 และ x=1010) */}
          <path
            d="M 940 292 C 934 240, 926 158, 942 156 C 968 154, 1014 190, 1010 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          <path d="M 944 292 Q 975 258 1006 292" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 8 (x: 1010 -> 1080, จุดต่อ x=1010) */}
          <path
            d="M 1010 292 C 1006 245, 1004 182, 1020 180 C 1045 178, 1088 210, 1080 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          <path d="M 1014 292 Q 1045 264 1076 292" fill="#060c1a" stroke="#fde047" strokeWidth="1" />

          {/* สันโครงนูนกลมมนลากผ่านกลางกลีบ (Symmetric Perspective Vault Rib Highlights) */}
          <path d="M 568 180 Q 576 235 572 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />
          <path d="M 640 156 Q 648 225 644 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 710 140 Q 716 220 712 292" fill="none" stroke="#fffbeb" strokeWidth="1.7" />
          <path d="M 776 130 Q 782 215 780 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />

          {/* สันกลางฝั่งขวา */}
          <path d="M 824 130 Q 818 215 820 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />
          <path d="M 890 140 Q 884 220 888 292" fill="none" stroke="#fffbeb" strokeWidth="1.7" />
          <path d="M 960 156 Q 952 225 956 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 1032 180 Q 1024 235 1028 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />

          {/* ชายคาระเบียงคลื่นหยักโค้งต่อเนื่องแบบ Seamless Scalloped Ribbon (มีรอยเว้น Gap ตรงกลาง 797->803) */}
          <path
            d="M 520 292 
               Q 555 278 590 292 
               Q 625 276 660 292 
               Q 694 274 728 292 
               Q 762 272 797 292 
               M 803 292
               Q 838 272 872 292 
               Q 906 274 940 292 
               Q 975 276 1010 292 
               Q 1045 278 1080 292"
            fill="none"
            stroke="#fffbeb"
            strokeWidth="2.8"
          />

          {/* ฐานตึกเตี้ยบางๆ แนบสนิทบนแนวพื้นหินตลิ่งริมแม่น้ำ */}
          <rect x="510" y="304" width="580" height="16" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />
          <line x1="515" y1="316" x2="1085" y2="316" stroke="#f59e0b" strokeWidth="1.5" />

          {/* บันไดท่าน้ำกลาง ทอดยาวลงสู่แม่น้ำอย่างกลมกลืน */}
          <polygon points="720,320 880,320 900,345 700,345" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของทรงกลีบมนตึกฟักทองทอดลงบนผิวน้ำ (Soft Scalloped Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
