// src/components/ThaiArchitectureSkyline.tsx
import React from 'react';

export const ThaiArchitectureSkyline: React.FC = () => {
  return (
    <div className="absolute inset-x-0 bottom-[40vh] md:bottom-[45vh] h-48 md:h-64 pointer-events-none select-none z-0 overflow-hidden">
      {/* Golden Backlight Ambient Aura behind Temples */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-44 bg-gradient-to-t from-amber-500/20 via-yellow-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Responsive Thai Architecture Skyline SVG Layer */}
      <svg
        viewBox="0 0 1600 320"
        preserveAspectRatio="none"
        className="w-full h-full drop-shadow-[0_-2px_15px_rgba(245,158,11,0.35)] opacity-85"
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
        </defs>

        {/* ----------------- 1. ยอดรัศมีเรืองรองเหนือยอดเจดีย์และปรางค์ ----------------- */}
        {/* Phra Prang Spire Glow */}
        <circle cx="800" cy="40" r="28" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="800" cy="40" r="4" fill="#fffbeb" />

        {/* Chedi Left Spire Glow */}
        <circle cx="420" cy="85" r="20" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="420" cy="85" r="3" fill="#fffbeb" />

        {/* Chedi Right Spire Glow */}
        <circle cx="1180" cy="85" r="20" fill="url(#spireAura)" className="animate-pulse" />
        <circle cx="1180" cy="85" r="3" fill="#fffbeb" />

        {/* ----------------- 2. แนวสถาปัตยกรรมไทยริมตลิ่ง (Riverbank Skyline) ----------------- */}
        <g fill="url(#templeGoldGrad)" stroke="#fde047" strokeWidth="1" strokeOpacity="0.6">

          {/* --- ฝั่งซ้าย: ศาลาท่าน้ำ & กุฏิหลังคาจั่วซ้อนชั้น (Thai Waterfront Pavilion) --- */}
          {/* ศาลาท่าน้ำชั้นนอก */}
          <path d="M 60 320 L 60 270 L 140 230 L 220 270 L 220 320 Z" />
          {/* ช่อฟ้า หางหงส์ ศาลา */}
          <path d="M 50 275 Q 55 260 70 265 L 140 220 L 210 265 Q 225 260 230 275" fill="none" strokeWidth="2" stroke="#fde047" />

          {/* พระอุโบสถฝั่งซ้าย (จั่วซ้อน 3 ชั้น เอกลักษณ์ไทย) */}
          {/* จั่วชั้นบนสุด */}
          <path d="M 280 230 L 320 180 L 360 230 Z" />
          {/* ช่อฟ้าเอก */}
          <path d="M 318 180 Q 314 165 320 155 Q 326 165 322 180" fill="none" strokeWidth="2.5" stroke="#fffbeb" />
          {/* จั่วชั้น 2 */}
          <path d="M 250 260 L 320 205 L 390 260 Z" />
          {/* จั่วชั้น 3 ฐานอุโบสถ */}
          <path d="M 220 320 L 220 270 L 320 225 L 420 270 L 420 320 Z" />

          {/* --- พระเจดีย์ทรงระฆังคว่ำองค์ซ้าย (Chedi Bell Shape) --- */}
          {/* ปลียอดเจดีย์ */}
          <path d="M 418 85 L 422 85 L 424 140 L 416 140 Z" />
          {/* ปล้องไฉน */}
          <path d="M 412 140 L 428 140 L 425 165 L 415 165 Z" />
          {/* บัลลังก์ & องค์ระฆัง */}
          <path d="M 405 165 L 435 165 L 442 205 Q 445 235 420 238 Q 395 235 398 205 Z" />
          {/* ฐานเขียง/ฐานแปดเหลี่ยมซ้อนชั้น */}
          <path d="M 380 320 L 380 265 L 392 240 L 448 240 L 460 265 L 460 320 Z" />

          {/* --- กึ่งกลางโดดเด่น: พระปรางค์ประธาน (Royal Phra Prang Landmark) --- */}
          {/* ฝักเพกา/นภศูลยอดปรางค์ */}
          <path d="M 798 40 L 802 40 L 804 75 L 796 75 Z" fill="url(#prangGoldGrad)" stroke="#fffbeb" strokeWidth="1.5" />
          {/* เรือนธาตุและชั้นรัดประคดซ้อนทรงกลีบขนุน (Thai Stepped Stupa Structure) */}
          <path
            d="M 795 75 L 805 75 
               L 812 105 L 788 105 
               L 818 140 L 782 140 
               L 824 178 L 776 178 
               L 832 215 L 768 215 
               L 842 255 L 758 255 
               L 855 295 L 745 295 
               L 860 320 L 740 320 Z"
            fill="url(#prangGoldGrad)"
            stroke="#fde047"
            strokeWidth="1.8"
          />
          {/* ซุ้มทิศพระปรางค์ (Niche details) */}
          <path d="M 788 190 Q 800 175 812 190 L 812 215 L 788 215 Z" fill="#0b132b" opacity="0.6" />
          <path d="M 784 232 Q 800 215 816 232 L 816 255 L 784 255 Z" fill="#0b132b" opacity="0.6" />

          {/* พระปรางค์ทิศบริวาร (ซ้าย-ขวา) */}
          <path d="M 710 320 L 710 240 L 725 180 L 730 180 L 745 240 L 745 320 Z" fill="url(#templeGoldGrad)" />
          <path d="M 855 320 L 855 240 L 870 180 L 875 180 L 890 240 L 890 320 Z" fill="url(#templeGoldGrad)" />

          {/* --- ฝั่งขวา: พระเจดีย์ทรงระฆังคว่ำองค์ขวา --- */}
          {/* ปลียอดเจดีย์ */}
          <path d="M 1178 85 L 1182 85 L 1184 140 L 1176 140 Z" />
          {/* ปล้องไฉน */}
          <path d="M 1172 140 L 1188 140 L 1185 165 L 1175 165 Z" />
          {/* องค์ระฆัง */}
          <path d="M 1165 165 L 1195 165 L 1202 205 Q 1205 235 1180 238 Q 1155 235 1158 205 Z" />
          {/* ฐานซ้อนชั้น */}
          <path d="M 1140 320 L 1140 265 L 1152 240 L 1208 240 L 1220 265 L 1220 320 Z" />

          {/* --- ฝั่งขวา: พระวิหารหลวง & ซุ้มประตูโขง --- */}
          {/* วิหารหลวงหลังคาซ้อน 3 ชั้น */}
          <path d="M 1250 240 L 1310 185 L 1370 240 Z" />
          <path d="M 1308 185 Q 1304 170 1310 160 Q 1316 170 1312 185" fill="none" strokeWidth="2.5" stroke="#fffbeb" />
          <path d="M 1220 275 L 1310 215 L 1400 275 Z" />
          <path d="M 1190 320 L 1190 280 L 1310 230 L 1430 280 L 1430 320 Z" />

          {/* ศาลาท่าน้ำฝั่งขวาสุด */}
          <path d="M 1440 320 L 1440 275 L 1510 235 L 1580 275 L 1580 320 Z" />
          <path d="M 1430 280 Q 1435 265 1450 270 L 1510 228 L 1570 270 Q 1585 265 1590 280" fill="none" strokeWidth="2" stroke="#fde047" />

          {/* ----------------- 3. แนวกำแพงแก้ว ใบเสมา และบันไดท่าน้ำโบราณ ----------------- */}
          {/* แนวระเบียงกำแพงแก้วตลอดแนวริมฝั่ง */}
          <rect x="0" y="302" width="1600" height="18" fill="#1c2541" stroke="#f59e0b" strokeWidth="1" />
          
          {/* เสาหัวเม็ด & ซุ้มใบเสมาบนกำแพงแก้ว */}
          {[120, 260, 480, 620, 680, 920, 980, 1100, 1240, 1380, 1480].map((pos, i) => (
            <g key={i} transform={`translate(${pos}, 288)`}>
              <rect x="0" y="0" width="10" height="16" rx="2" fill="#d97706" />
              <circle cx="5" cy="-2" r="4.5" fill="#fde047" />
            </g>
          ))}

          {/* บันไดท่าน้ำโบราณ (Riverbank Landing Steps) ทอดยาวลงสู่แม่น้ำ */}
          <path d="M 710 320 L 890 320 L 870 340 L 730 340 Z" fill="#b45309" opacity="0.8" />
        </g>
      </svg>

      {/* Shimmering Golden Water Reflection of Temple Skyline */}
      <div className="absolute -bottom-10 inset-x-0 h-16 bg-gradient-to-b from-amber-400/25 via-amber-500/10 to-transparent blur-md pointer-events-none transform scale-y-[-0.6] opacity-75" />
    </div>
  );
};
