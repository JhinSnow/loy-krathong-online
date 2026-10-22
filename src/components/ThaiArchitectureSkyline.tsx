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

        {/* ----------------- 3. ตึกฟักทอง คณะวิทยาศาสตร์ ม.อ. (Perspective/Radial Fan-shape: ไล่ระดับความสูงโค้งมน + เอียงแกนรัศมี + เลเยอร์ซ้อนมิติ) ----------------- */}
        <g id="realPumpkinBuildingPSU" className="drop-shadow-[0_0_24px_rgba(251,191,36,0.75)]">
          {/* ช่องซุ้มเงาลึกด้านใน (Under-shell Shadow Arc) */}
          <rect x="500" y="292" width="600" height="13" fill="#060c1a" stroke="#d97706" strokeWidth="1" />

          {/* เสาค้ำรอบอาคารรับแรงกลีบเปลือกบาง ติดแนบตลิ่ง */}
          {[515, 545, 575, 605, 635, 665, 695, 725, 755, 785, 815, 845, 875, 905, 935, 965, 995, 1025, 1055, 1085].map((x, i) => (
            <line key={i} x1={x} y1="292" x2={x} y2="305" stroke="#f59e0b" strokeWidth="1.2" opacity="0.8" />
          ))}

          {/* 
            Geometry & Perspective Radial Fan-Shape:
            1. Dome Envelope Profile (ยอดโค้งพาราโบลาลาดลงตามธรรมชาติ):
               - กลีบ 4, 5 (คู่กลาง): ยอดสูงที่สุด y = 142 (100% Height)
               - กลีบ 3, 6 (ถัดมา): ยอด y = 157 (~90% Height)
               - กลีบ 2, 7 (ถัดมา): ยอด y = 179 (~75% Height)
               - กลีบ 1, 8 (ขอบนอก): ยอด y = 202 (~60% Height)
            2. Radial Splay / Tilt: ยอดกลีบสอบเอียงเข้าหาจุดศูนย์กลาง และแผ่ผายออกด้านข้าง
            3. Render Order Layering: กลีบนอกสุดวาดก่อน -> กลีบในและกลีบคู่กลางวาดทับหน้าสุด (Front layer)
          */}

          {/* ================= LAYER 1: กลีบขอบนอกสุด (1 และ 8) ความสูง ~60% (y_peak = 202) เอียง 14° ================= */}
          {/* กลีบ 1 (ซ้ายสุด) */}
          <g id="petal-1">
            <path
              d="M 505 292 C 498 245, 524 202, 546 202 C 568 202, 584 240, 582 292 Z"
              fill="url(#vaultShadowGrad)"
              stroke="#fde68a"
              strokeWidth="1.3"
            />
            <path d="M 510 292 Q 544 266 578 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />
            <path d="M 542 202 Q 550 248 544 292" fill="none" stroke="#fffbeb" strokeWidth="1.4" opacity="0.85" />
          </g>

          {/* กลีบ 8 (ขวาสุด) */}
          <g id="petal-8">
            <path
              d="M 1018 292 C 1016 240, 1032 202, 1054 202 C 1076 202, 1102 245, 1095 292 Z"
              fill="url(#vaultShadowGrad)"
              stroke="#fde68a"
              strokeWidth="1.3"
            />
            <path d="M 1022 292 Q 1056 266 1090 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />
            <path d="M 1058 202 Q 1050 248 1056 292" fill="none" stroke="#fffbeb" strokeWidth="1.4" opacity="0.85" />
          </g>

          {/* ================= LAYER 2: กลีบถัดมา (2 และ 7) ความสูง ~75% (y_peak = 179) เอียง 8° ================= */}
          {/* กลีบ 2 (ซ้าย) ซ้อนทับขอบกลีบ 1 */}
          <g id="petal-2">
            <path
              d="M 572 292 C 568 228, 595 179, 620 179 C 646 179, 663 228, 660 292 Z"
              fill="url(#vaultGoldGrad)"
              stroke="#fde047"
              strokeWidth="1.5"
            />
            <path d="M 577 292 Q 618 262 656 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />
            <path d="M 616 179 Q 624 236 617 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />
          </g>

          {/* กลีบ 7 (ขวา) ซ้อนทับขอบกลีบ 8 */}
          <g id="petal-7">
            <path
              d="M 940 292 C 937 228, 954 179, 980 179 C 1005 179, 1032 228, 1028 292 Z"
              fill="url(#vaultGoldGrad)"
              stroke="#fde047"
              strokeWidth="1.5"
            />
            <path d="M 944 292 Q 982 262 1023 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />
            <path d="M 984 179 Q 976 236 983 292" fill="none" stroke="#fffbeb" strokeWidth="1.5" />
          </g>

          {/* ================= LAYER 3: กลีบถัดมา (3 และ 6) ความสูง ~90% (y_peak = 157) เอียง 4° ================= */}
          {/* กลีบ 3 (ซ้าย) ซ้อนทับขอบกลีบ 2 */}
          <g id="petal-3">
            <path
              d="M 648 292 C 646 215, 672 157, 698 157 C 723 157, 737 215, 734 292 Z"
              fill="url(#vaultShadowGrad)"
              stroke="#fde68a"
              strokeWidth="1.5"
            />
            <path d="M 653 292 Q 694 256 730 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />
            <path d="M 696 157 Q 701 226 695 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          </g>

          {/* กลีบ 6 (ขวา) ซ้อนทับขอบกลีบ 7 */}
          <g id="petal-6">
            <path
              d="M 866 292 C 863 215, 877 157, 902 157 C 928 157, 954 215, 952 292 Z"
              fill="url(#vaultShadowGrad)"
              stroke="#fde68a"
              strokeWidth="1.5"
            />
            <path d="M 870 292 Q 906 256 947 292" fill="#FFFFFF" stroke="#fde047" strokeWidth="1.2" />
            <path d="M 904 157 Q 899 226 905 292" fill="none" stroke="#fffbeb" strokeWidth="1.6" />
          </g>

          {/* ================= LAYER 4 (FRONT): กลีบคู่กลาง (4 และ 5) สูงที่สุด 100% (y_peak = 142) หน้าตรง นูนเด่นสุด ================= */}
          {/* กลีบ 4 (กลางซ้าย) */}
          <g id="petal-4">
            <path
              d="M 724 292 C 722 205, 745 142, 770 142 C 794 142, 800 205, 797 292 Z"
              fill="url(#vaultGoldGrad)"
              stroke="#fffbeb"
              strokeWidth="2.0"
            />
            <path d="M 729 292 Q 763 250 793 292" fill="#FFFFFF" stroke="#fffbeb" strokeWidth="1.5" />
            <path d="M 769 142 Q 771 220 766 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />
          </g>

          {/* === รอยแยกตรงกลางชัดเจน (Center Gap: x: 797 ถึง 803 กว้าง 6px) === */}
          <line x1="800" y1="142" x2="800" y2="292" stroke="#060c1a" strokeWidth="2.5" opacity="0.9" />

          {/* กลีบ 5 (กลางขวา) */}
          <g id="petal-5">
            <path
              d="M 803 292 C 800 205, 806 142, 830 142 C 855 142, 878 205, 876 292 Z"
              fill="url(#vaultGoldGrad)"
              stroke="#fffbeb"
              strokeWidth="2.0"
            />
            <path d="M 807 292 Q 837 250 871 292" fill="#FFFFFF" stroke="#fffbeb" strokeWidth="1.5" />
            <path d="M 831 142 Q 829 220 834 292" fill="none" stroke="#fffbeb" strokeWidth="2.0" />
          </g>

          {/* ชายคาระเบียงคลื่นหยักโค้งต่อเนื่องแบบ Seamless Scalloped Ribbon โค้งรับมิติความลึก */}
          <path
            d="M 505 292 
               Q 542 278 578 292 
               Q 616 276 654 292 
               Q 692 274 730 292 
               Q 763 270 797 292 
               M 803 292
               Q 837 270 871 292 
               Q 909 274 947 292 
               Q 985 276 1023 292 
               Q 1058 278 1095 292"
            fill="none"
            stroke="#fffbeb"
            strokeWidth="2.8"
          />

          {/* ฐานตึกเตี้ยบางๆ แนบสนิทบนแนวพื้นหินตลิ่งริมแม่น้ำ */}
          <rect x="495" y="304" width="610" height="16" fill="#1c2541" stroke="#fde047" strokeWidth="1.5" />
          <line x1="500" y1="316" x2="1100" y2="316" stroke="#f59e0b" strokeWidth="1.5" />

          {/* บันไดท่าน้ำกลาง ทอดยาวลงสู่แม่น้ำอย่างกลมกลืน */}
          <polygon points="730,320 870,320 890,345 710,345" fill="#b45309" stroke="#fde047" strokeWidth="1.2" />
        </g>
      </svg>

      {/* เงาสะท้อนสีทองของทรงกลีบมนตึกฟักทองทอดลงบนผิวน้ำ (Soft Scalloped Water Reflection) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-18 bg-gradient-to-b from-amber-400/35 via-yellow-500/15 to-transparent blur-md pointer-events-none transform scale-y-[-0.7]" />
    </div>
  );
};
