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

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (ซุ้มสีขาวนวล Pure White Under-arches + ขอบและยอดกลีบแตะชนกันสนิท Adjoining Petals) ----------------- */}
        <g id="realPumpkinBuildingPSU" className="drop-shadow-[0_0_22px_rgba(251,191,36,0.7)]">
          {/* ช่องซุ้มเงาลึกด้านใน (Under-shell Shadow Arc) */}
          <rect x="525" y="290" width="550" height="15" fill="#060c1a" stroke="#d97706" strokeWidth="1" />

          {/* เสาค้ำรอบอาคารรับแรงกลีบเปลือกบาง */}
          {[540, 570, 600, 630, 660, 690, 720, 750, 780, 810, 840, 870, 900, 930, 960, 990, 1020, 1050].map((x, i) => (
            <line key={i} x1={x} y1="290" x2={x} y2="304" stroke="#f59e0b" strokeWidth="1.2" opacity="0.8" />
          ))}

          {/* 8 กลีบคอนกรีต: ขอบข้างและยอดกลีบแตะสัมผัสชนกันสนิท (Adjoining & Seamless) + ซุ้มโค้งใต้กลีบสีขาวบริสุทธิ์ #FFFFFF */}
          
          {/* กลีบ 1 (x: 520 -> 590, ยอดชนที่ 585) */}
          <path
            d="M 520 292 C 516 200, 555 178, 585 180 C 596 182, 594 245, 590 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          {/* ซุ้มโค้งใต้กลีบ 1 (สีขาวล้วน #FFFFFF ขอบทอง) */}
          <path d="M 524 292 Q 555 264 586 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 2 (x: 590 -> 660, ยอดเริ่มที่ 585 ชนกลีบ 1 สนิท, ไปยอด 655) */}
          <path
            d="M 590 292 C 586 205, 585 180, 615 158 C 638 154, 655 156, 660 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          {/* ซุ้มโค้งใต้กลีบ 2 (สีขาวล้วน #FFFFFF) */}
          <path d="M 594 292 Q 625 258 656 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 3 (x: 660 -> 728, ยอดเริ่มที่ 655 ชนกลีบ 2 สนิท, ไปยอด 725) */}
          <path
            d="M 660 292 C 658 190, 655 156, 690 138 C 712 136, 725 140, 728 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          {/* ซุ้มโค้งใต้กลีบ 3 (สีขาวล้วน #FFFFFF) */}
          <path d="M 664 292 Q 694 252 724 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 4 (กลางซ้าย, x: 728 -> 797, ยอดเริ่มที่ 725 ชนกลีบ 3 สนิท, ไปยอด 796) */}
          <path
            d="M 728 292 C 726 175, 725 140, 762 130 C 785 130, 796 130, 797 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="2"
          />
          {/* ซุ้มโค้งใต้กลีบ 4 (สีขาวล้วน #FFFFFF) */}
          <path d="M 732 292 Q 762 244 793 292" fill="#FFFFFF" stroke="#fffbeb" strokeWidth="1.5" />

          {/* === รอยแยกตรงกลางชัดเจน (Center Gap Seam: x: 797 ถึง 803 กว้าง 6px) === */}
          <line x1="800" y1="130" x2="800" y2="292" stroke="#060c1a" strokeWidth="2.5" opacity="0.9" />

          {/* กลีบ 5 (กลางขวา, x: 803 -> 872, ยอดเริ่มที่ 804 เว้น Gap, ไปยอด 875) */}
          <path
            d="M 803 292 C 804 175, 804 130, 838 130 C 875 130, 874 140, 872 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="2"
          />
          {/* ซุ้มโค้งใต้กลีบ 5 (สีขาวล้วน #FFFFFF) */}
          <path d="M 807 292 Q 838 244 868 292" fill="#FFFFFF" stroke="#fffbeb" strokeWidth="1.5" />

          {/* กลีบ 6 (x: 872 -> 940, ยอดเริ่มที่ 875 ชนกลีบ 5 สนิท, ไปยอด 945) */}
          <path
            d="M 872 292 C 874 190, 875 140, 910 138 C 945 156, 942 190, 940 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          {/* ซุ้มโค้งใต้กลีบ 6 (สีขาวล้วน #FFFFFF) */}
          <path d="M 876 292 Q 906 252 936 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 7 (x: 940 -> 1010, ยอดเริ่มที่ 945 ชนกลีบ 6 สนิท, ไปยอด 1015) */}
          <path
            d="M 940 292 C 942 205, 945 156, 985 158 C 1015 180, 1014 205, 1010 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          {/* ซุ้มโค้งใต้กลีบ 7 (สีขาวล้วน #FFFFFF) */}
          <path d="M 944 292 Q 975 258 1006 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 8 (x: 1010 -> 1080, ยอดเริ่มที่ 1015 ชนกลีบ 7 สนิท) */}
          <path
            d="M 1010 292 C 1014 245, 1015 182, 1045 180 C 1075 178, 1084 200, 1080 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          {/* ซุ้มโค้งใต้กลีบ 8 (สีขาวล้วน #FFFFFF) */}
          <path d="M 1014 292 Q 1045 264 1076 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1" />

          {/* สันโครงนูนกลมมนลากผ่านกลางกลีบ (Symmetric Perspective Vault Rib Highlights) */}
          <path d="M 552 180 Q 562 235 558 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />
          <path d="M 625 158 Q 632 225 628 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 694 138 Q 700 220 696 292" fill="none" stroke="#fffbeb" strokeWidth="1.7" />
          <path d="M 762 130 Q 768 215 764 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />

          {/* สันกลางฝั่งขวา */}
          <path d="M 838 130 Q 832 215 836 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />
          <path d="M 906 138 Q 900 220 904 292" fill="none" stroke="#fffbeb" strokeWidth="1.7" />
          <path d="M 975 158 Q 968 225 972 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 1048 180 Q 1038 235 1042 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />

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
