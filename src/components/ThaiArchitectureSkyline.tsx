// src/components/ThaiArchitectureSkyline.tsx
import React from 'react';

export const ThaiArchitectureSkyline: React.FC = () => {
  return (
    <div className="absolute inset-x-0 bottom-[56vh] sm:bottom-[58vh] h-52 sm:h-64 md:h-80 pointer-events-none select-none z-10 overflow-hidden">
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

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (ปรับสัดส่วนกลีบขยายใหญ่ โอ่โถง ลดฐานลง 60% และทำ Perspective ซ้าย-ขวาสมมาตร) ----------------- */}
        <g id="realPumpkinBuildingPSU" className="drop-shadow-[0_0_22px_rgba(251,191,36,0.7)]">
          {/* ช่องซุ้มเงาลึกด้านใน (Under-shell Shadow Arc) - ลดความสูงฐานลงเหลือเพียงแถบบางๆ (y: 290 ถึง 304) */}
          <rect x="535" y="290" width="530" height="15" fill="#060c1a" stroke="#d97706" strokeWidth="1" />

          {/* เสาค้ำรอบอาคารรับแรงกลีบเปลือกบาง - สั้นลงแนบกับฐานตลิ่ง */}
          {[550, 580, 610, 640, 670, 700, 730, 760, 790, 810, 840, 870, 900, 930, 960, 990, 1020, 1050].map((x, i) => (
            <line key={i} x1={x} y1="290" x2={x} y2="304" stroke="#f59e0b" strokeWidth="1.2" opacity="0.8" />
          ))}

          {/* 8 กลีบคอนกรีตขยายขนาดใหญ่ขึ้น โอ่โถง อวบอิ่ม ทรงพาราโบลาคว่ำ ทอดตัวลงมาแนบชิดฐานตลิ่งที่ y=292 */}
          {/* ซ้าย 3 กลีบ: Perspective เอียงไปทางซ้าย (ยอดกลีบเยื้องซ้าย) */}
          {/* กลาง 2 กลีบ: หน้าตรง สมมาตร กว้างสุด โอ่โถงที่สุด */}
          {/* ขวา 3 กลีบ: Perspective เอียงไปทางขวา (ยอดกลีบเยื้องขวา - Mirror/Symmetric กับฝั่งซ้าย) */}

          {/* กลีบ 1 (ซ้ายสุด - เอียงซ้าย Perspective) */}
          <path
            d="M 530 292 C 520 205, 570 175, 598 178 C 622 181, 626 245, 616 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          <path d="M 542 292 Q 570 262 602 292" fill="#060c1a" stroke="#fde047" strokeWidth="1" />

          {/* กลีบ 2 (ซ้าย - เอียงซ้าย Perspective) */}
          <path
            d="M 596 292 C 590 185, 645 152, 675 155 C 702 158, 705 240, 694 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          <path d="M 612 292 Q 646 256 680 292" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 3 (ซ้ายใน - เอียงซ้าย Perspective) */}
          <path
            d="M 672 292 C 668 170, 722 138, 755 142 C 782 145, 784 235, 772 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          <path d="M 690 292 Q 724 250 758 292" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 4 (กลางซ้าย - หน้าตรง ประธาน กว้าง อวบอิ่ม โอ่โถง) */}
          <path
            d="M 748 292 C 744 158, 792 130, 816 130 C 840 130, 842 230, 836 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="2"
          />
          <path d="M 766 292 Q 792 242 818 292" fill="#060c1a" stroke="#fffbeb" strokeWidth="1.5" />

          {/* กลีบ 5 (กลางขวา - หน้าตรง ประธาน กว้าง อวบอิ่ม โอ่โถง) */}
          <path
            d="M 812 292 C 806 230, 808 130, 832 130 C 856 130, 904 158, 900 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fffbeb"
            strokeWidth="2"
          />
          <path d="M 830 292 Q 856 242 882 292" fill="#060c1a" stroke="#fffbeb" strokeWidth="1.5" />

          {/* กลีบ 6 (ขวาใน - พลิกเอียงขวา Perspective รับกับกลีบ 3) */}
          <path
            d="M 876 292 C 864 235, 866 145, 893 142 C 926 138, 980 170, 976 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.5"
          />
          <path d="M 890 292 Q 924 250 958 292" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 7 (ขวา - พลิกเอียงขวา Perspective รับกับกลีบ 2) */}
          <path
            d="M 954 292 C 943 240, 946 158, 973 155 C 1003 152, 1058 185, 1052 292 Z"
            fill="url(#vaultGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.5"
          />
          <path d="M 968 292 Q 1002 256 1036 292" fill="#060c1a" stroke="#fde047" strokeWidth="1.2" />

          {/* กลีบ 8 (ขวาสุด - พลิกเอียงขวา Perspective รับกับกลีบ 1) */}
          <path
            d="M 1032 292 C 1022 245, 1026 181, 1050 178 C 1078 175, 1128 205, 1118 292 Z"
            fill="url(#vaultShadowGrad)"
            stroke="#fde68a"
            strokeWidth="1.4"
          />
          <path d="M 1046 292 Q 1078 262 1106 292" fill="#060c1a" stroke="#fde047" strokeWidth="1" />

          {/* สันโครงนูนกลมมนลากผ่านกลางกลีบ (Symmetric Perspective Vault Rib Highlights) */}
          {/* ฝั่งซ้าย: สันกลีบโค้งเอียงตาม Perspective ซ้าย */}
          <path d="M 586 178 Q 598 235 596 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />
          <path d="M 660 155 Q 674 225 670 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 738 142 Q 752 220 748 292" fill="none" stroke="#fffbeb" strokeWidth="1.7" />
          {/* กลาง: สันกลีบตรง หน้าตรง */}
          <path d="M 804 130 Q 810 215 806 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />
          <path d="M 844 130 Q 838 215 842 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />
          {/* ฝั่งขวา: สันกลีบโค้งเอียงตาม Perspective ขวา (สมมาตร) */}
          <path d="M 910 142 Q 896 220 900 292" fill="none" stroke="#fffbeb" strokeWidth="1.7" />
          <path d="M 988 155 Q 974 225 978 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          <path d="M 1062 178 Q 1050 235 1052 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />

          {/* ชายคาระเบียงคลื่นหยักโค้งต่อเนื่องแนบชิดฐานตลิ่ง (Scalloped Rim Border at y=292) */}
          <path
            d="M 530 292 
               Q 566 280 602 292 
               Q 638 278 674 292 
               Q 711 276 748 292 
               Q 785 273 822 292 
               Q 859 273 896 292 
               Q 933 276 970 292 
               Q 1007 278 1044 292 
               Q 1081 280 1118 292"
            fill="none"
            stroke="#fffbeb"
            strokeWidth="2.8"
          />

          {/* ฐานตึกเตี้ยบางๆ แนบสนิทบนแนวพื้นหินตลิ่งริมแม่น้ำ (เตี้ยลง 60%) */}
          <rect x="520" y="304" width="610" height="16" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />
          <line x1="525" y1="316" x2="1125" y2="316" stroke="#f59e0b" strokeWidth="1.5" />

          {/* บันไดท่าน้ำกลาง ทอดยาวลงสู่แม่น้ำอย่างกลมกลืน */}
          <polygon points="720,320 930,320 955,345 695,345" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของทรงกลีบมนตึกฟักทองทอดลงบนผิวน้ำ (Soft Scalloped Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
