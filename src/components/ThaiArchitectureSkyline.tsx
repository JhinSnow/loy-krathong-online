// src/components/ThaiArchitectureSkyline.tsx
import React from 'react';

export const ThaiArchitectureSkyline: React.FC = () => {
  return (
    <div className="absolute inset-x-0 bottom-[47vh] sm:bottom-[49vh] h-52 sm:h-64 md:h-80 pointer-events-none select-none z-10 overflow-hidden">
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

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (สถาปัตยกรรมคอนกรีตเปลือกบางกลีบพาราโบลาคว่ำ 100% ถูกต้องตามของจริง) ----------------- */}
        <g id="realPumpkinBuilding" className="drop-shadow-[0_0_18px_rgba(251,191,36,0.6)]">

          {/* แนวหลังคาโค้งป้านรวมด้านหลัง (Continuous Fluted Shell Horizon - ทรงเตี้ยกว้าง ไม่มีเสาแหลม) */}
          <path
            d="M 580 275 
               C 610 195, 700 170, 800 168 
               C 900 170, 990 195, 1020 275 
               Z"
            fill="#0b132b"
            opacity="0.85"
          />

          {/* แนวกลีบโค้งรูปพาราโบลาคว่ำเรียงต่อกัน 9 กลีบหน้ากระดาน (9 Fluted Parabolic Convex Shell Vaults) */}
          {/* กลีบที่ 1 (ริมซ้ายสุด) */}
          <path
            d="M 580 275 Q 600 198 625 204 Q 635 240 635 275 Q 608 270 580 275 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.2"
          />
          {/* กลีบที่ 2 */}
          <path
            d="M 625 275 Q 640 188 670 192 Q 685 235 685 275 Q 655 268 625 275 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.4"
          />
          {/* กลีบที่ 3 */}
          <path
            d="M 675 275 Q 690 180 722 182 Q 738 230 738 275 Q 706 266 675 275 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          {/* กลีบที่ 4 */}
          <path
            d="M 728 275 Q 742 173 775 174 Q 790 225 790 275 Q 759 265 728 275 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          {/* กลีบที่ 5 (กลีบประธานกึ่งกลาง ทรงโค้งพาราโบลาคว่ำมนป้าน ไม่มีเสายอด) */}
          <path
            d="M 780 275 Q 785 168 800 168 Q 815 168 820 275 Q 800 264 780 275 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="1.8"
          />
          {/* กลีบที่ 6 */}
          <path
            d="M 810 275 Q 810 225 825 174 Q 858 173 872 275 Q 841 265 810 275 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          {/* กลีบที่ 7 */}
          <path
            d="M 862 275 Q 862 230 878 182 Q 910 180 925 275 Q 894 266 862 275 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          {/* กลีบที่ 8 */}
          <path
            d="M 915 275 Q 915 235 930 192 Q 960 188 975 275 Q 945 268 915 275 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.4"
          />
          {/* กลีบที่ 9 (ริมขวาสุด) */}
          <path
            d="M 965 275 Q 965 240 975 204 Q 1000 198 1020 275 Q 992 270 965 275 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.2"
          />

          {/* สันโครงสร้างพาราโบลาเน้นความนูนกลีบ (Convex Arch Rib Lines) */}
          <path d="M 605 200 Q 618 245 615 275" fill="none" stroke="#fde047" strokeWidth="1.2" opacity="0.8" />
          <path d="M 650 190 Q 665 240 660 275" fill="none" stroke="#fffbeb" strokeWidth="1.3" />
          <path d="M 700 181 Q 716 235 712 275" fill="none" stroke="#fffbeb" strokeWidth="1.3" />
          <path d="M 752 173 Q 768 230 765 275" fill="none" stroke="#fffbeb" strokeWidth="1.4" />
          <path d="M 800 168 L 800 275" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 848 173 Q 832 230 835 275" fill="none" stroke="#fffbeb" strokeWidth="1.4" />
          <path d="M 900 181 Q 884 235 888 275" fill="none" stroke="#fffbeb" strokeWidth="1.3" />
          <path d="M 950 190 Q 935 240 940 275" fill="none" stroke="#fffbeb" strokeWidth="1.3" />
          <path d="M 995 200 Q 982 245 985 275" fill="none" stroke="#fde047" strokeWidth="1.2" opacity="0.8" />

          {/* ขอบล่างเว้าเป็นคลื่นหยักโค้งต่อเนื่องตามกลีบ (Scalloped Vault Edges) */}
          <path
            d="M 580 275 
               Q 602 268 625 275 
               Q 650 267 675 275 
               Q 701 265 728 275 
               Q 754 264 780 275 
               Q 800 263 820 275 
               Q 846 264 872 275 
               Q 898 265 925 275 
               Q 950 267 975 275 
               Q 998 268 1020 275"
            fill="none"
            stroke="#fffbeb"
            strokeWidth="2.2"
          />

          {/* แถบกระจกและเสารองรับใต้ร่มกลีบโดม (Recessed Glass Facade & Columns Under Fluted Canopy) */}
          <rect x="590" y="278" width="420" height="24" fill="#0b132b" stroke="#f59e0b" strokeWidth="1" />
          {[605, 630, 655, 680, 705, 730, 755, 780, 800, 820, 845, 870, 895, 920, 945, 970, 995].map((x, i) => (
            <line key={i} x1={x} y1="278" x2={x} y2="302" stroke="#fde047" strokeWidth="1" opacity="0.8" />
          ))}

          {/* ฐานตึกแนบสนิทบนแนวพื้นหินตลิ่งริมแม่น้ำ (Seamless Terrace Foundation) */}
          <rect x="570" y="302" width="460" height="18" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />
          <line x1="575" y1="316" x2="1025" y2="316" stroke="#f59e0b" strokeWidth="1.5" />

          {/* บันไดท่าน้ำกลาง ทอดยาวลงสู่แม่น้ำเจ้าพระยาอย่างกลมกลืน */}
          <polygon points="730,320 870,320 890,345 710,345" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของทรงกลีบพาราโบลาตึกฟักทองทอดลงบนผิวน้ำ (Soft Scalloped Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
