// src/components/ThaiArchitectureSkyline.tsx
import React from 'react';

export const ThaiArchitectureSkyline: React.FC = () => {
  return (
    <div className="absolute inset-x-0 bottom-[47vh] sm:bottom-[49vh] h-52 sm:h-64 md:h-80 pointer-events-none select-none z-10 overflow-hidden">
      {/* Golden Backlight Ambient Spotlight behind Centerpiece */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] md:w-[600px] h-48 bg-gradient-to-t from-amber-500/35 via-yellow-400/20 to-transparent blur-3xl rounded-full pointer-events-none" />

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

          {/* Pumpkin Building Dome Outer Shading */}
          <linearGradient id="pumpkinDomeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
            <stop offset="20%" stopColor="#fde047" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#b45309" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1c2541" stopOpacity="0.9" />
          </linearGradient>

          {/* Pumpkin Rib Dark Shadow Gradient */}
          <linearGradient id="ribShadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#78350f" stopOpacity="0.75" />
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
        <circle cx="340" cy="85" r="20" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="340" cy="85" r="3" fill="#fffbeb" />

        {/* Chedi Right Spire Glow */}
        <circle cx="1260" cy="85" r="20" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="1260" cy="85" r="3" fill="#fffbeb" />

        {/* ----------------- 2. แนวสถาปัตยกรรมไทยริมตลิ่ง ----------------- */}
        <g fill="url(#templeGoldGrad)" stroke="#fde047" strokeWidth="1" strokeOpacity="0.6">

          {/* --- ฝั่งซ้าย: ศาลาท่าน้ำ & กุฏิหลังคาจั่วซ้อนชั้น --- */}
          <path d="M 30 320 L 30 270 L 100 230 L 170 270 L 170 320 Z" />
          <path d="M 20 275 Q 25 260 40 265 L 100 220 L 160 265 Q 175 260 180 275" fill="none" strokeWidth="2" stroke="#fde047" />

          {/* พระอุโบสถฝั่งซ้าย */}
          <path d="M 210 230 L 250 180 L 290 230 Z" />
          <path d="M 248 180 Q 244 165 250 155 Q 256 165 252 180" fill="none" strokeWidth="2.5" stroke="#fffbeb" />
          <path d="M 180 260 L 250 205 L 320 260 Z" />
          <path d="M 150 320 L 150 270 L 250 225 L 350 270 L 350 320 Z" />

          {/* พระเจดีย์ทรงระฆังคว่ำองค์ซ้าย */}
          <path d="M 338 85 L 342 85 L 344 140 L 336 140 Z" />
          <path d="M 332 140 L 348 140 L 345 165 L 335 165 Z" />
          <path d="M 325 165 L 355 165 L 362 205 Q 365 235 340 238 Q 315 235 318 205 Z" />
          <path d="M 300 320 L 300 265 L 312 240 L 368 240 L 380 265 L 380 320 Z" />

          {/* พระปรางค์องค์เสริมฝั่งซ้าย */}
          <path d="M 460 320 L 460 235 L 485 140 L 490 140 L 515 235 L 515 320 Z" fill="url(#prangGoldGrad)" />

          {/* --- ฝั่งขวา: พระปรางค์องค์เสริมฝั่งขวา --- */}
          <path d="M 1085 320 L 1085 235 L 1110 140 L 1115 140 L 1140 235 L 1140 320 Z" fill="url(#prangGoldGrad)" />

          {/* พระเจดีย์ทรงระฆังคว่ำองค์ขวา */}
          <path d="M 1258 85 L 1262 85 L 1264 140 L 1256 140 Z" />
          <path d="M 1252 140 L 1268 140 L 1265 165 L 1255 165 Z" />
          <path d="M 1245 165 L 1275 165 L 1282 205 Q 1285 235 1260 238 Q 1235 235 1238 205 Z" />
          <path d="M 1220 320 L 1220 265 L 1232 240 L 1288 240 L 1300 265 L 1300 320 Z" />

          {/* วิหารหลวงหลังคาซ้อน 3 ชั้นฝั่งขวา */}
          <path d="M 1340 240 L 1390 185 L 1440 240 Z" />
          <path d="M 1388 185 Q 1384 170 1390 160 Q 1396 170 1392 185" fill="none" strokeWidth="2.5" stroke="#fffbeb" />
          <path d="M 1310 275 L 1390 215 L 1470 275 Z" />
          <path d="M 1280 320 L 1280 280 L 1390 230 L 1500 280 L 1500 320 Z" />

          {/* ----------------- 3. แนวกำแพงแก้ว ใบเสมา ต่อเนื่องทั้งซ้ายและขวา ----------------- */}
          <rect x="0" y="302" width="650" height="18" fill="#1c2541" stroke="#f59e0b" strokeWidth="1" />
          <rect x="950" y="302" width="650" height="18" fill="#1c2541" stroke="#f59e0b" strokeWidth="1" />

          {[100, 200, 420, 540, 1060, 1180, 1320, 1460].map((pos, i) => (
            <g key={i} transform={`translate(${pos}, 288)`}>
              <rect x="0" y="0" width="10" height="16" rx="2" fill="#d97706" />
              <circle cx="5" cy="-2" r="4.5" fill="#fde047" />
            </g>
          ))}
        </g>

        {/* ----------------- 4. ตึกฟักทอง สัญลักษณ์ประจำคณะวิทยาศาสตร์ (Golden Vector Silhouette) ----------------- */}
        <g id="pumpkinBuildingVector" className="drop-shadow-[0_0_16px_rgba(251,191,36,0.55)]">
          {/* แสงเรืองรองเฉพาะยอดโดมกลีบฟักทอง */}
          <circle cx="800" cy="115" r="45" fill="url(#spireAura)" opacity="0.6" className="animate-pulse" />

          {/* ยอดเสาอากาศ/สไปร์บนยอดโดม */}
          <path d="M 799 110 L 801 110 L 801 130 L 799 130 Z" fill="#fffbeb" />
          <circle cx="800" cy="110" r="2.5" fill="#fffbeb" />

          {/* โครงสร้างหลักของโดมกลีบฟักทอง (Overall Dome Silhouette) */}
          <path
            d="M 685 270 
               C 685 185, 740 130, 800 130 
               C 860 130, 915 185, 915 270 
               Z"
            fill="url(#pumpkinDomeGrad)"
            stroke="#fde047"
            strokeWidth="1.8"
          />

          {/* องค์ประกอบกลีบฟักทองโค้งซ้อน (Fluted Pumpkin Ribs & Segment Grooves) */}
          {/* กลีบที่ 1 (นอกซ้ายสุด) */}
          <path
            d="M 685 270 C 690 195, 735 145, 800 130 C 730 150, 700 205, 705 270 Z"
            fill="url(#ribShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.2"
            opacity="0.9"
          />
          {/* กลีบที่ 2 (ซ้ายกลาง) */}
          <path
            d="M 725 270 C 730 190, 760 145, 800 130 C 750 155, 735 210, 745 270 Z"
            fill="url(#pumpkinDomeGrad)"
            stroke="#fde68a"
            strokeWidth="1.2"
          />
          {/* กลีบที่ 3 (กึ่งกลางเด่นสง่า) */}
          <path
            d="M 770 270 C 772 185, 785 140, 800 130 C 815 140, 828 185, 830 270 Z"
            fill="url(#pumpkinDomeGrad)"
            stroke="#fffbeb"
            strokeWidth="1.5"
          />
          {/* กลีบที่ 4 (ขวากลาง) */}
          <path
            d="M 855 270 C 865 210, 850 155, 800 130 C 840 145, 870 190, 875 270 Z"
            fill="url(#pumpkinDomeGrad)"
            stroke="#fde68a"
            strokeWidth="1.2"
          />
          {/* กลีบที่ 5 (นอกขวาสุด) */}
          <path
            d="M 895 270 C 900 205, 870 150, 800 130 C 865 145, 910 195, 915 270 Z"
            fill="url(#ribShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.2"
            opacity="0.9"
          />

          {/* ลายเส้นโครงสร้างสันกลีบพุ่งลงมาจากยอด (Fluted Arch Rib Lines) */}
          <path d="M 800 130 Q 755 175 745 270" fill="none" stroke="#fde047" strokeWidth="1.4" />
          <path d="M 800 130 Q 782 175 780 270" fill="none" stroke="#fffbeb" strokeWidth="1.2" />
          <path d="M 800 130 Q 818 175 820 270" fill="none" stroke="#fffbeb" strokeWidth="1.2" />
          <path d="M 800 130 Q 845 175 855 270" fill="none" stroke="#fde047" strokeWidth="1.4" />

          {/* ระเบียงคอดรอบใต้ชายคาโดม (Under-Dome Cornice & Arch Louvers) */}
          <rect x="675" y="270" width="250" height="9" fill="#d97706" stroke="#fde047" strokeWidth="1" />

          {/* ช่องซุ้มหน้าต่างฐานอาคารทรงโค้ง (Base Columns & Arched Windows) */}
          <rect x="682" y="279" width="236" height="23" fill="#0b132b" stroke="#f59e0b" strokeWidth="1.2" />
          {[696, 722, 748, 774, 800, 826, 852, 878, 904].map((xPos, i) => (
            <g key={i}>
              <path d={`M ${xPos - 8} 302 L ${xPos - 8} 288 Q ${xPos} 282 ${xPos + 8} 288 L ${xPos + 8} 302 Z`} fill="url(#pumpkinDomeGrad)" opacity="0.85" />
              <line x1={xPos} y1="302" x2={xPos} y2="284" stroke="#0b132b" strokeWidth="1" />
            </g>
          ))}

          {/* ฐานอาคารแนบสนิทลงบนแนวตลิ่งหินอ่อน (Riverbank Horizon Terrace) */}
          <rect x="665" y="302" width="270" height="18" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />
          {/* ขอบทองตกแต่งฐานล่าง */}
          <rect x="670" y="316" width="260" height="3" fill="#fde047" />

          {/* บันไดท่าน้ำหลวง ทอดตัวลงสู่แม่น้ำเจ้าพระยาอย่างกลมกลืน */}
          <polygon points="720,320 880,320 900,345 700,345" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของแนวโค้งตึกฟักทองทอดยาวลงบนผิวน้ำ (Shimmering Golden Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[280px] sm:w-[360px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
