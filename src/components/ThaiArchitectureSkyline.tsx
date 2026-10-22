// src/components/ThaiArchitectureSkyline.tsx
import React from 'react';

export const ThaiArchitectureSkyline: React.FC = () => {
  return (
    <div className="absolute inset-x-0 bottom-[47vh] sm:bottom-[49vh] h-52 sm:h-64 md:h-80 pointer-events-none select-none z-10 overflow-hidden">
      {/* Mega Golden Aura & Spotlight directly behind Pumpkin Building */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[340px] sm:w-[460px] md:w-[580px] h-48 sm:h-60 bg-gradient-to-t from-amber-500/45 via-yellow-400/30 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Golden Backlight Ambient Aura across riverbank */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full h-36 bg-gradient-to-t from-amber-500/25 via-yellow-500/10 to-transparent blur-2xl pointer-events-none" />

      {/* Responsive Thai Architecture Skyline SVG Layer */}
      <svg
        viewBox="0 0 1600 320"
        preserveAspectRatio="xMidYMax meet"
        className="w-full h-full drop-shadow-[0_-4px_22px_rgba(245,158,11,0.5)] opacity-95 overflow-visible"
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

          {/* Golden Aura Radial Gradient for Stupa Tip */}
          <radialGradient id="spireAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          {/* Golden Halo specifically for Pumpkin Building Dome */}
          <radialGradient id="pumpkinDomeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#fde047" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>

          {/* Stylized Warm Gold Filter for Pumpkin Image */}
          <filter id="festiveGoldShine" x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix
              type="matrix"
              values="
                1.30  0.15  0.00  0  0.08
                0.20  1.15  0.00  0  0.05
                0.05  0.10  0.70  0  0.00
                0.00  0.00  0.00  1  0.00"
            />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.15" />
              <feFuncG type="linear" slope="1.08" />
              <feFuncB type="linear" slope="0.85" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* ----------------- 1. ยอดรัศมีเรืองรอง ----------------- */}
        {/* Chedi Left Spire Glow */}
        <circle cx="360" cy="85" r="20" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="360" cy="85" r="3" fill="#fffbeb" />

        {/* Chedi Right Spire Glow */}
        <circle cx="1240" cy="85" r="20" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="1240" cy="85" r="3" fill="#fffbeb" />

        {/* ----------------- 2. แนวสถาปัตยกรรมไทยริมตลิ่ง ----------------- */}
        <g fill="url(#templeGoldGrad)" stroke="#fde047" strokeWidth="1" strokeOpacity="0.6">

          {/* --- ฝั่งซ้าย: ศาลาท่าน้ำ & กุฏิหลังคาจั่วซ้อนชั้น --- */}
          <path d="M 40 320 L 40 270 L 110 230 L 180 270 L 180 320 Z" />
          <path d="M 30 275 Q 35 260 50 265 L 110 220 L 170 265 Q 185 260 190 275" fill="none" strokeWidth="2" stroke="#fde047" />

          {/* พระอุโบสถฝั่งซ้าย */}
          <path d="M 230 230 L 270 180 L 310 230 Z" />
          <path d="M 268 180 Q 264 165 270 155 Q 276 165 272 180" fill="none" strokeWidth="2.5" stroke="#fffbeb" />
          <path d="M 200 260 L 270 205 L 340 260 Z" />
          <path d="M 170 320 L 170 270 L 270 225 L 370 270 L 370 320 Z" />

          {/* พระเจดีย์ทรงระฆังคว่ำองค์ซ้าย */}
          <path d="M 358 85 L 362 85 L 364 140 L 356 140 Z" />
          <path d="M 352 140 L 368 140 L 365 165 L 355 165 Z" />
          <path d="M 345 165 L 375 165 L 382 205 Q 385 235 360 238 Q 335 235 338 205 Z" />
          <path d="M 320 320 L 320 265 L 332 240 L 388 240 L 400 265 L 400 320 Z" />

          {/* พระปรางค์องค์เสริมฝั่งซ้าย */}
          <path d="M 470 320 L 470 240 L 490 150 L 495 150 L 515 240 L 515 320 Z" fill="url(#prangGoldGrad)" />

          {/* --- ฝั่งขวา: พระปรางค์องค์เสริมฝั่งขวา --- */}
          <path d="M 1085 320 L 1085 240 L 1105 150 L 1110 150 L 1130 240 L 1130 320 Z" fill="url(#prangGoldGrad)" />

          {/* พระเจดีย์ทรงระฆังคว่ำองค์ขวา */}
          <path d="M 1238 85 L 1242 85 L 1244 140 L 1236 140 Z" />
          <path d="M 1232 140 L 1248 140 L 1245 165 L 1235 165 Z" />
          <path d="M 1225 165 L 1255 165 L 1262 205 Q 1265 235 1240 238 Q 1215 235 1218 205 Z" />
          <path d="M 1200 320 L 1200 265 L 1212 240 L 1268 240 L 1280 265 L 1280 320 Z" />

          {/* วิหารหลวงหลังคาซ้อน 3 ชั้นฝั่งขวา */}
          <path d="M 1320 240 L 1370 185 L 1420 240 Z" />
          <path d="M 1368 185 Q 1364 170 1370 160 Q 1376 170 1372 185" fill="none" strokeWidth="2.5" stroke="#fffbeb" />
          <path d="M 1290 275 L 1370 215 L 1450 275 Z" />
          <path d="M 1260 320 L 1260 280 L 1370 230 L 1480 280 L 1480 320 Z" />

          {/* ----------------- 3. แนวกำแพงแก้ว ใบเสมา ----------------- */}
          <rect x="0" y="302" width="1600" height="18" fill="#1c2541" stroke="#f59e0b" strokeWidth="1" />
          {[120, 240, 430, 560, 1040, 1170, 1340, 1480].map((pos, i) => (
            <g key={i} transform={`translate(${pos}, 288)`}>
              <rect x="0" y="0" width="10" height="16" rx="2" fill="#d97706" />
              <circle cx="5" cy="-2" r="4.5" fill="#fde047" />
            </g>
          ))}
        </g>

        {/* ----------------- 4. ตึกฟักทอง สัญลักษณ์คณะวิทยาศาสตร์ (Center Stage Landmark) ----------------- */}
        {/* แท่นฐานรองรับบารมีตึกฟักทอง สไตล์ศาลาจัตุรมุขไทย-โมเดิร์น */}
        <g>
          {/* แสงสปอตไลท์สีทองทรงกลมหลังยอดตึกฟักทอง */}
          <circle cx="800" cy="140" r="130" fill="url(#pumpkinDomeGlow)" opacity="0.85" className="animate-pulse" />

          {/* ฐานแท่นหินอ่อนขอบทอง */}
          <polygon points="630,320 970,320 940,245 660,245" fill="#0b132b" stroke="#f59e0b" strokeWidth="2" />
          <polygon points="660,245 940,245 925,230 675,230" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />

          {/* ลายบัวหงาย-บัวคว่ำรองรับฐานอาคาร */}
          <rect x="670" y="240" width="260" height="5" fill="#fde047" />

          {/* ภาพตึกฟักทอง คมชัด โดดเด่น ยิ่งใหญ่ อาบแสงไฟเทศกาล */}
          <g filter="url(#festiveGoldShine)">
            <image
              href="/pumpkin-building.webp"
              x="625"
              y="20"
              width="350"
              height="240"
              preserveAspectRatio="xMidYMid meet"
              className="drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]"
            />
          </g>

          {/* ป้ายชื่อทรงเกียรติยศสีทองใต้ตึกฟักทอง */}
          <g transform="translate(800, 275)">
            <rect x="-140" y="-12" width="280" height="25" rx="12" fill="#0b132b" stroke="#fde047" strokeWidth="1.5" className="drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]" />
            <text x="0" y="5" textAnchor="middle" fill="#fffbeb" fontSize="13" fontWeight="bold" letterSpacing="1.5">
              ตึกฟักทอง • คณะวิทยาศาสตร์
            </text>
          </g>

          {/* บันไดท่าน้ำหลวง ทอดยาวตรงกลางลงสู่แม่น้ำเจ้าพระยา */}
          <polygon points="700,320 900,320 930,345 670,345" fill="#b45309" stroke="#fde047" strokeWidth="1" />
        </g>
      </svg>

      {/* Shimmering Golden Water Reflection ทอดเงาตึกฟักทองลงบนผิวน้ำกึ่งกลางจอ */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[380px] sm:w-[500px] h-20 bg-gradient-to-b from-amber-400/40 via-yellow-500/20 to-transparent blur-md pointer-events-none transform scale-y-[-0.8]" />
    </div>
  );
};
