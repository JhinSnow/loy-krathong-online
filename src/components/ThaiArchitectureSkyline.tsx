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

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (Brutalist Thin-shell Concrete กลีบโค้งมนเตี้ยกว้าง 100% ตามของจริง) ----------------- */}
        <g id="realPumpkinBuildingPSU" className="drop-shadow-[0_0_18px_rgba(251,191,36,0.65)]">
          {/* ช่องซุ้มเงาลึกด้านใน (Under-shell Shadow Arc) */}
          <rect x="585" y="272" width="430" height="30" fill="#060c1a" stroke="#d97706" strokeWidth="1" />

          {/* เสาค้ำรอบอาคารรับแรงกลีบเปลือกบาง */}
          {[605, 630, 655, 680, 705, 730, 755, 780, 800, 820, 845, 870, 895, 920, 945, 970, 995].map((x, i) => (
            <line key={i} x1={x} y1="272" x2={x} y2="302" stroke="#f59e0b" strokeWidth="1.2" opacity="0.8" />
          ))}

          {/* 8 กลีบคอนกรีตโค้งมนกลมทรงฟักทองผ่าซีก (Bulbous / Rounded Parabolic Shells - ไม่มียอดแหลม) */}
          
          {/* กลีบ 1 (ซ้ายสุด) */}
          <path
            d="M 580 274 C 576 220, 614 200, 634 202 C 650 204, 652 245, 646 274 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.3"
          />
          {/* ซุ้มเกือกม้าใต้กลีบ 1 */}
          <path d="M 590 274 Q 612 250 636 274" fill="#060c1a" stroke="#fde047" strokeWidth="1" />

          {/* กลีบ 2 */}
          <path
            d="M 632 274 C 628 205, 668 186, 690 188 C 708 190, 710 240, 704 274 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.4"
          />
          <path d="M 646 274 Q 668 244 690 274" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 3 */}
          <path
            d="M 688 274 C 684 195, 725 176, 748 178 C 766 180, 768 235, 762 274 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          <path d="M 702 274 Q 724 238 748 274" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 4 (ซ้ายกลาง ประธาน) */}
          <path
            d="M 744 274 C 740 188, 782 170, 804 170 C 826 170, 826 235, 820 274 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="1.8"
          />
          <path d="M 760 274 Q 782 232 804 274" fill="#060c1a" stroke="#fffbeb" strokeWidth="1.4" />

          {/* กลีบ 5 (ขวากลาง ประธาน) */}
          <path
            d="M 798 274 C 794 188, 836 170, 858 170 C 880 170, 878 235, 874 274 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="1.8"
          />
          <path d="M 814 274 Q 836 232 858 274" fill="#060c1a" stroke="#fffbeb" strokeWidth="1.4" />

          {/* กลีบ 6 */}
          <path
            d="M 852 274 C 848 195, 889 176, 912 178 C 930 180, 932 235, 926 274 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          <path d="M 866 274 Q 888 238 912 274" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 7 */}
          <path
            d="M 906 274 C 902 205, 942 186, 964 188 C 982 190, 984 240, 978 274 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.4"
          />
          <path d="M 920 274 Q 942 244 964 274" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 8 (ขวาสุด) */}
          <path
            d="M 960 274 C 956 220, 994 200, 1014 202 C 1030 204, 1032 245, 1026 274 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.3"
          />
          <path d="M 972 274 Q 994 250 1016 274" fill="#060c1a" stroke="#fde047" strokeWidth="1" />

          {/* สันโครงนูนกลมมนลากผ่านกลางกลีบ (Rounded Vault Rib Highlights) */}
          <path d="M 614 202 Q 622 238 620 274" fill="none" stroke="#fffbeb" strokeWidth="1.4" />
          <path d="M 670 188 Q 678 230 676 274" fill="none" stroke="#fffbeb" strokeWidth="1.4" />
          <path d="M 726 178 Q 736 226 734 274" fill="none" stroke="#fffbeb" strokeWidth="1.5" />
          <path d="M 782 170 Q 792 222 790 274" fill="none" stroke="#fffbeb" strokeWidth="1.8" />
          <path d="M 836 170 Q 846 222 844 274" fill="none" stroke="#fffbeb" strokeWidth="1.8" />
          <path d="M 890 178 Q 900 226 898 274" fill="none" stroke="#fffbeb" strokeWidth="1.5" />
          <path d="M 944 188 Q 952 230 950 274" fill="none" stroke="#fffbeb" strokeWidth="1.4" />
          <path d="M 996 202 Q 1004 238 1002 274" fill="none" stroke="#fffbeb" strokeWidth="1.4" />

          {/* ชายคาระเบียงคลื่นหยักโค้งต่อเนื่อง (Scalloped Rim Border) */}
          <path
            d="M 578 274 
               Q 606 266 634 274 
               Q 662 265 690 274 
               Q 719 263 748 274 
               Q 776 261 804 274 
               Q 831 261 858 274 
               Q 885 263 912 274 
               Q 938 265 964 274 
               Q 992 266 1026 274"
            fill="none"
            stroke="#fffbeb"
            strokeWidth="2.5"
          />

          {/* ฐานตึกแนบสนิทบนแนวพื้นหินตลิ่งริมแม่น้ำ (Seamless Terrace Foundation) */}
          <rect x="560" y="302" width="480" height="18" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />
          <line x1="565" y1="316" x2="1035" y2="316" stroke="#f59e0b" strokeWidth="1.5" />

          {/* บันไดท่าน้ำกลาง ทอดยาวลงสู่แม่น้ำเจ้าพระยาอย่างกลมกลืน */}
          <polygon points="730,320 870,320 890,345 710,345" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของทรงกลีบมนตึกฟักทองทอดลงบนผิวน้ำ (Soft Scalloped Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
