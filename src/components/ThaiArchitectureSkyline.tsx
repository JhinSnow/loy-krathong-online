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

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (Brutalist Fluted Shell โค้งแผ่บานออกด้านข้าง ป้านต่ำ กว้างกว่าสูง) ----------------- */}
        <g id="realPumpkinBuildingPSU" className="drop-shadow-[0_0_24px_rgba(251,191,36,0.75)]">
          {/* ช่องซุ้มเงาลึกด้านใน (Under-shell Shadow Arc) */}
          <rect x="500" y="292" width="600" height="13" fill="#060c1a" stroke="#d97706" strokeWidth="1" />

          {/* เสาค้ำรอบอาคารรับแรงกลีบเปลือกบาง ติดแนบตลิ่ง */}
          {[520, 550, 580, 610, 640, 670, 700, 730, 760, 785, 815, 840, 870, 900, 930, 960, 990, 1020, 1050, 1080].map((x, i) => (
            <line key={i} x1={x} y1="292" x2={x} y2="305" stroke="#f59e0b" strokeWidth="1.2" opacity="0.8" />
          ))}

          {/* 
            สถาปัตยกรรมตึกฟักทองที่ถูกต้อง:
            - ทรงเตี้ยแผ่กว้างตามแนวนอน (Fluted Shell Dome) ปลายกลีบด้านข้างจะ "โค้งบานออกผายกว้าง" (Fanning outwards) 
            - สันกลีบสอบเข้าหาจุดศูนย์กลางบนยอดโดมเตี้ยมน
            - ขอบล่างเว้าเป็นซุ้มโค้งรูปเกือกม้าสีขาวล้วน (#FFFFFF)
          */}

          {/* กลีบ 1 (ซ้ายสุด - แผ่บานโค้งผายออกไปทางซ้ายกว้างมาก x: 505 -> 585) */}
          <path
            d="M 505 292 C 485 240, 530 205, 580 195 C 588 235, 588 270, 585 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          {/* ซุ้มโค้งใต้กลีบ 1 สีขาวล้วน */}
          <path d="M 510 292 Q 545 264 580 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 2 (ซ้ายนอก - โค้งผายสอบเอียงตามมุมมอง x: 585 -> 660) */}
          <path
            d="M 585 292 C 580 220, 610 178, 655 170 C 665 215, 664 265, 660 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          {/* ซุ้มโค้งใต้กลีบ 2 สีขาวล้วน */}
          <path d="M 590 292 Q 622 258 655 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 3 (ซ้ายใน - โค้งเริ่มตั้งชันขึ้นแต่ยังเอียงรับกลีบประธาน x: 660 -> 728) */}
          <path
            d="M 660 292 C 658 200, 680 156, 725 150 C 732 205, 730 260, 728 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          {/* ซุ้มโค้งใต้กลีบ 3 สีขาวล้วน */}
          <path d="M 665 292 Q 696 252 725 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 4 (กลางซ้าย - ประธานหน้าตรง โค้งพาราโบลาคว่ำ กว้าง อวบอิ่ม x: 728 -> 797) */}
          <path
            d="M 728 292 C 726 185, 750 145, 792 145 C 798 195, 798 255, 797 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="2"
          />
          {/* ซุ้มโค้งใต้กลีบ 4 สีขาวล้วน */}
          <path d="M 732 292 Q 764 246 793 292" fill="#FFFFFF" stroke="#fffbeb" strokeWidth="1.5" />

          {/* === รอยแยกตรงกลางชัดเจน (Center Gap: x: 797 ถึง 803 กว้าง 6px) === */}
          <line x1="800" y1="145" x2="800" y2="292" stroke="#060c1a" strokeWidth="2.5" opacity="0.9" />

          {/* กลีบ 5 (กลางขวา - ประธานหน้าตรง โค้งพาราโบลาคว่ำ กว้าง อวบอิ่ม x: 803 -> 872) */}
          <path
            d="M 803 292 C 802 255, 802 195, 808 145 C 850 145, 874 185, 872 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="2"
          />
          {/* ซุ้มโค้งใต้กลีบ 5 สีขาวล้วน */}
          <path d="M 807 292 Q 836 246 868 292" fill="#FFFFFF" stroke="#fffbeb" strokeWidth="1.5" />

          {/* กลีบ 6 (ขวาใน - โค้งเอียงสอบออกทางขวา x: 872 -> 940) */}
          <path
            d="M 872 292 C 870 260, 868 205, 875 150 C 920 156, 942 200, 940 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          {/* ซุ้มโค้งใต้กลีบ 6 สีขาวล้วน */}
          <path d="M 875 292 Q 904 252 935 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 7 (ขวานอก - โค้งผายสอบเอียงออกทางขวา x: 940 -> 1015) */}
          <path
            d="M 940 292 C 936 265, 935 215, 945 170 C 990 178, 1020 220, 1015 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          {/* ซุ้มโค้งใต้กลีบ 7 สีขาวล้วน */}
          <path d="M 945 292 Q 978 258 1010 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 8 (ขวาสุด - แผ่บานโค้งผายออกไปทางขวากว้างมาก x: 1015 -> 1095) */}
          <path
            d="M 1015 292 C 1012 270, 1012 235, 1020 195 C 1070 205, 1115 240, 1095 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          {/* ซุ้มโค้งใต้กลีบ 8 สีขาวล้วน */}
          <path d="M 1020 292 Q 1055 264 1090 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />

          {/* สันโครงนูนกลมมนลากผ่านกลางกลีบ (Curved Rib Highlights สอบเข้าสู่ยอดโดมเตี้ย) */}
          <path d="M 545 198 Q 555 245, 545 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />
          <path d="M 622 172 Q 630 235, 622 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 696 152 Q 700 225, 695 292" fill="none" stroke="#fffbeb" strokeWidth="1.7" />
          <path d="M 765 145 Q 768 220, 763 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />

          {/* สันกลางฝั่งขวา */}
          <path d="M 835 145 Q 832 220, 837 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />
          <path d="M 905 152 Q 900 225, 905 292" fill="none" stroke="#fffbeb" strokeWidth="1.7" />
          <path d="M 978 172 Q 970 235, 978 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 1055 198 Q 1045 245, 1055 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />

          {/* ชายคาระเบียงคลื่นหยักโค้งต่อเนื่องแบบ Seamless Scalloped Ribbon แผ่กว้างตามแนวระนาบ */}
          <path
            d="M 505 292 
               Q 545 278 585 292 
               Q 622 276 660 292 
               Q 694 274 728 292 
               Q 762 272 797 292 
               M 803 292
               Q 838 272 872 292 
               Q 906 274 940 292 
               Q 978 276 1015 292 
               Q 1055 278 1095 292"
            fill="none"
            stroke="#fffbeb"
            strokeWidth="2.8"
          />

          {/* ฐานตึกเตี้ยบางๆ แนบสนิทบนแนวพื้นหินตลิ่งริมแม่น้ำ */}
          <rect x="495" y="304" width="610" height="16" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />
          <line x1="500" y1="316" x2="1100" y2="316" stroke="#f59e0b" strokeWidth="1.5" />

          {/* บันไดท่าน้ำกลาง ทอดยาวลงสู่แม่น้ำอย่างกลมกลืน */}
          <polygon points="720,320 880,320 900,345 700,345" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของทรงกลีบมนตึกฟักทองทอดลงบนผิวน้ำ (Soft Scalloped Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
