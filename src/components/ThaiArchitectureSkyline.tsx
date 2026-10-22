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

          {/* Festive Hanging Lantern Gradient (โคมแขวนสีเหลืองส้มเรืองแสง) */}
          <linearGradient id="festiveLanternGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="30%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
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

          {/* ----------------- แนวกำแพงแก้ว/ฐานตลิ่งทอดยาวต่อเนื่องตลอดแนวหน้าจอ (เชื่อมต่อกัน 100% ไม่เว้นช่องว่างตรงกลาง) ----------------- */}
          <rect x="0" y="302" width="1600" height="18" fill="#1c2541" stroke="#f59e0b" strokeWidth="1" />
          <line x1="0" y1="316" x2="1600" y2="316" stroke="#f59e0b" strokeWidth="1.2" opacity="0.7" />

          {[80, 180, 320, 440, 1160, 1280, 1400, 1500].map((pos, i) => (
            <g key={i} transform={`translate(${pos}, 288)`}>
              <rect x="0" y="0" width="10" height="16" rx="2" fill="#d97706" />
              <circle cx="5" cy="-2" r="4.5" fill="#fde047" />
            </g>
          ))}
        </g>

        {/* ----------------- 2.5 สิ่งก่อสร้างฉากหลังด้านหลังตึกฟักทอง (Background Skyline Layer: Opacity 50% สร้างมิติ Depth of Field) ----------------- */}
        <g
          id="backgroundCenterSkyline"
          opacity="0.5"
          className="drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]"
        >
          {/* ยอดรัศมีเรืองแสงของพระเจดีย์ฉากหลัง 3 องค์ */}
          <circle cx="800" cy="48" r="18" fill="url(#spireAura)" className="animate-pulse" />
          <circle cx="800" cy="48" r="2.5" fill="#fffbeb" />
          <circle cx="645" cy="74" r="14" fill="url(#spireAura)" className="animate-pulse" />
          <circle cx="645" cy="74" r="2" fill="#fffbeb" />
          <circle cx="955" cy="74" r="14" fill="url(#spireAura)" className="animate-pulse" />
          <circle cx="955" cy="74" r="2" fill="#fffbeb" />

          <g fill="url(#templeGoldGrad)" stroke="#fde047" strokeWidth="1" strokeOpacity="0.65">
            {/* 1. พระมหาเจดีย์ทรงระฆังคว่ำองค์ประธานด้านหลัง (โผล่พ้นยอดตึกฟักทองตรงกลาง) */}
            <path d="M 798 48 L 802 48 L 805 96 L 795 96 Z" />
            <path d="M 790 96 L 810 96 L 807 114 L 793 114 Z" />
            <path d="M 782 114 L 818 114 L 828 152 Q 832 175 800 178 Q 768 175 772 152 Z" />
            <path d="M 760 260 L 760 178 L 840 178 L 840 260 Z" />

            {/* 2. พระเจดีย์คู่องค์ซ้าย (x=645) */}
            <path d="M 643 74 L 647 74 L 650 115 L 640 115 Z" />
            <path d="M 636 115 L 654 115 L 651 132 L 639 132 Z" />
            <path d="M 629 132 L 661 132 L 668 164 Q 670 185 645 188 Q 620 185 622 164 Z" />
            <path d="M 612 260 L 612 188 L 678 188 L 678 260 Z" />

            {/* 3. พระเจดีย์คู่องค์ขวา (x=955) */}
            <path d="M 953 74 L 957 74 L 960 115 L 950 115 Z" />
            <path d="M 946 115 L 964 115 L 961 132 L 949 132 Z" />
            <path d="M 939 132 L 971 132 L 978 164 Q 980 185 955 188 Q 930 185 932 164 Z" />
            <path d="M 922 260 L 922 188 L 988 188 L 988 260 Z" />

            {/* 4. หลังคาพระวิหารซ้อนชั้นด้านหลังฝั่งซ้าย (x=560 & x=725) */}
            <path d="M 520 175 L 565 130 L 610 175 Z" />
            <path d="M 563 130 Q 560 118 565 110 Q 570 118 567 130" fill="none" strokeWidth="2" stroke="#fffbeb" />
            <path d="M 505 205 L 565 152 L 625 205 Z" />

            <path d="M 685 158 L 725 116 L 765 158 Z" />
            <path d="M 723 116 Q 720 105 725 98 Q 730 105 727 116" fill="none" strokeWidth="2" stroke="#fffbeb" />
            <path d="M 672 185 L 725 136 L 778 185 Z" />

            {/* 5. หลังคาพระวิหารซ้อนชั้นด้านหลังฝั่งขวา (x=875 & x=1035) */}
            <path d="M 835 158 L 875 116 L 915 158 Z" />
            <path d="M 873 116 Q 870 105 875 98 Q 880 105 877 116" fill="none" strokeWidth="2" stroke="#fffbeb" />
            <path d="M 822 185 L 875 136 L 928 185 Z" />

            <path d="M 990 175 L 1035 130 L 1080 175 Z" />
            <path d="M 1033 130 Q 1030 118 1035 110 Q 1040 118 1037 130" fill="none" strokeWidth="2" stroke="#fffbeb" />
            <path d="M 975 205 L 1035 152 L 1095 205 Z" />
          </g>
        </g>

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (ลายเส้นสีขาวบริสุทธิ์ Pure White ด้านหน้า) ----------------- */}
        <g id="realPumpkinBuildingPSU">
          {/* Spotlight แสงนวลส่องหลังตัวตึกฟักทอง */}
          <ellipse cx="800" cy="245" rx="260" ry="60" fill="url(#spireAura)" opacity="0.28" />

          {/* Silhouette บังฉากหลังเฉพาะช่วงตัวอาคารตึกฟักทอง เพื่อไม่ให้เส้นเจดีย์ด้านหลังทะลุเข้ามาซ้อนในลายเส้นตึก */}
          <path
            d="M 512 302 C 512 225, 575 176, 650 162 C 710 150, 755 148, 800 148 C 845 148, 890 150, 950 162 C 1025 176, 1088 225, 1088 302 Z"
            fill="#091024"
            opacity="0.92"
          />

          <image
            href="/vector.png?v=white"
            x="510"
            y="130"
            width="580"
            height="176"
            preserveAspectRatio="xMidYMax meet"
            className="drop-shadow-[0_0_12px_rgba(255,255,255,0.65)]"
          />
        </g>

        {/* ----------------- 4. ของห้อยตกแต่งบนตึกฟักทองตามธีมลอยกระทง (Festive Hanging Lanterns & Bunting Garland) ----------------- */}
        <g id="pumpkinFestiveDecorations">
          {/* สายพาดโคมแขวนและธงราวโค้งรับแนวหลังคาตึกฟักทอง */}
          <path
            d="M 540 198 Q 608 220 675 166 Q 738 188 800 148 Q 862 188 925 166 Q 992 220 1060 198"
            fill="none"
            stroke="#fde047"
            strokeWidth="1.3"
            strokeDasharray="3 2"
            opacity="0.85"
          />
          {/* สายพาดเส้นคู่ด้านล่างสำหรับธงราวสามเหลี่ยม */}
          <path
            d="M 540 198 Q 608 226 675 166 Q 738 194 800 148 Q 862 194 925 166 Q 992 226 1060 198"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.9"
            opacity="0.65"
          />

          {/* ธงราวสามเหลี่ยมสีทองขนาดเล็กประดับตามสาย (Festive Bunting Flags) */}
          {[
            { x: 575, y: 206 },
            { x: 640, y: 192 },
            { x: 708, y: 174 },
            { x: 768, y: 166 },
            { x: 832, y: 166 },
            { x: 892, y: 174 },
            { x: 960, y: 192 },
            { x: 1025, y: 206 },
          ].map((flag, idx) => (
            <polygon
              key={`flag-${idx}`}
              points={`${flag.x - 4},${flag.y} ${flag.x + 4},${flag.y} ${flag.x},${flag.y + 8}`}
              fill={idx % 2 === 0 ? '#fde047' : '#f59e0b'}
              opacity="0.85"
            />
          ))}

          {/* โคมไฟกระดาษ/โคมล้านนาแปดเหลี่ยมเรืองแสง 5 จุดหลัก (พร้อม Subtle Sway Animation) */}
          {[
            { x: 545, y: 198, scale: 0.85, dur: '3.2s', delay: '0s' },
            { x: 608, y: 208, scale: 0.75, dur: '2.8s', delay: '0.4s' },
            { x: 675, y: 166, scale: 0.95, dur: '3.5s', delay: '0.2s' },
            { x: 738, y: 176, scale: 0.8, dur: '3.0s', delay: '0.6s' },
            { x: 800, y: 148, scale: 1.05, dur: '3.4s', delay: '0.1s' },
            { x: 862, y: 176, scale: 0.8, dur: '3.1s', delay: '0.5s' },
            { x: 925, y: 166, scale: 0.95, dur: '3.6s', delay: '0.3s' },
            { x: 992, y: 208, scale: 0.75, dur: '2.9s', delay: '0.7s' },
            { x: 1055, y: 198, scale: 0.85, dur: '3.3s', delay: '0.2s' },
          ].map((lan, idx) => (
            <g
              key={`pumpkin-lantern-${idx}`}
              style={{
                transformOrigin: `${lan.x}px ${lan.y}px`,
                animation: `swaySlow ${lan.dur} ease-in-out ${lan.delay} infinite alternate`,
              }}
              className="drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]"
            >
              <g transform={`translate(${lan.x}, ${lan.y}) scale(${lan.scale})`}>
                {/* แสงออร่าสีทองส้มรอบโคม */}
                <circle cx="0" cy="14" r="14" fill="url(#spireAura)" opacity="0.65" />
                {/* สายห้อยโคม */}
                <line x1="0" y1="0" x2="0" y2="6" stroke="#fde047" strokeWidth="1.2" />
                {/* ฝาครอบบนโคมล้านนา */}
                <rect x="-4" y="6" width="8" height="2" rx="1" fill="#78350f" stroke="#fde047" strokeWidth="0.6" />
                {/* ตัวโคมแปดเหลี่ยมสีเหลืองส้มเรืองแสง */}
                <polygon
                  points="-4,8 4,8 7,12 7,17 4,21 -4,21 -7,17 -7,12"
                  fill="url(#festiveLanternGrad)"
                  stroke="#fffbeb"
                  strokeWidth="0.8"
                />
                {/* ลายเส้นโครงโคม */}
                <line x1="-6.5" y1="14.5" x2="6.5" y2="14.5" stroke="#b45309" strokeWidth="0.6" opacity="0.6" />
                {/* ฝาครอบล่าง */}
                <rect x="-3.5" y="21" width="7" height="2" rx="1" fill="#78350f" stroke="#fde047" strokeWidth="0.5" />
                {/* พู่ห้อยท้ายโคม */}
                <path d="M -1.5 23 L -2.5 30 M 0 23 L 0 31 M 1.5 23 L 2.5 30" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" />
              </g>
            </g>
          ))}
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของทรงกลีบมนตึกฟักทองทอดลงบนผิวน้ำ (Soft Scalloped Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
