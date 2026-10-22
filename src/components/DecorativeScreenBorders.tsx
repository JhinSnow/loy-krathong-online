// src/components/DecorativeScreenBorders.tsx
import React from 'react';

export const DecorativeScreenBorders: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-25">
      {/* ---------------- 1. ลายประดับมุมบนซ้ายและมุมบนขวา (Thai Golden Corner Accents) ---------------- */}
      {/* มุมบนซ้าย (Top-Left Thai Kranok Pattern) */}
      <div className="absolute top-0 left-0 w-36 h-36 sm:w-48 sm:h-48 opacity-45 drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <defs>
            <linearGradient id="cornerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="35%" stopColor="#fde047" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* เส้นขอบซุ้มมุม */}
          <path d="M 0 0 L 150 0 C 110 30 90 60 75 100 C 60 120 40 140 0 150 Z" fill="url(#cornerGoldGrad)" opacity="0.3" />
          {/* ลายกนกมุมอ่อนช้อย */}
          <path d="M 0 15 Q 45 20 60 40 Q 80 70 85 110 Q 75 80 50 55 Q 30 35 0 28" fill="url(#cornerGoldGrad)" />
          <path d="M 15 0 Q 20 45 40 60 Q 70 80 110 85 Q 80 75 55 50 Q 35 30 28 0" fill="url(#cornerGoldGrad)" />
          {/* ลายประจำยามใจกลางมุม */}
          <circle cx="28" cy="28" r="7" fill="#fffbeb" opacity="0.9" />
          <circle cx="28" cy="28" r="14" fill="none" stroke="#fde047" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* มุมบนขวา (Top-Right Thai Kranok Pattern - Flip X) */}
      <div className="absolute top-0 right-0 w-36 h-36 sm:w-48 sm:h-48 opacity-45 drop-shadow-[0_0_12px_rgba(245,158,11,0.35)] transform scale-x-[-1]">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <path d="M 0 0 L 150 0 C 110 30 90 60 75 100 C 60 120 40 140 0 150 Z" fill="url(#cornerGoldGrad)" opacity="0.3" />
          <path d="M 0 15 Q 45 20 60 40 Q 80 70 85 110 Q 75 80 50 55 Q 30 35 0 28" fill="url(#cornerGoldGrad)" />
          <path d="M 15 0 Q 20 45 40 60 Q 70 80 110 85 Q 80 75 55 50 Q 35 30 28 0" fill="url(#cornerGoldGrad)" />
          <circle cx="28" cy="28" r="7" fill="#fffbeb" opacity="0.9" />
          <circle cx="28" cy="28" r="14" fill="none" stroke="#fde047" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* ---------------- 2. สายพาดโคมแขวนด้านบน (Hanging Lantern Garland - ปรับหลบกึ่งกลางและกล่อง QR code) ---------------- */}
      <div className="absolute top-0 inset-x-0 h-28 sm:h-36 overflow-visible pointer-events-none">
        {/* สายเชือกโค้งสลัว (Garland Wire) 2 ฝั่ง ซ้ายและขวา โดยเปิดเว้นช่องตรงกลางและมุมบนซ้าย */}
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-20 overflow-visible opacity-80">
          <defs>
            <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
              <stop offset="25%" stopColor="#fde047" stopOpacity="0.75" />
              <stop offset="42%" stopColor="#d97706" stopOpacity="0" />
              <stop offset="58%" stopColor="#d97706" stopOpacity="0" />
              <stop offset="75%" stopColor="#fde047" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#fde047" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* โค้งเชือกฝั่งซ้าย (หลบ QR Code) */}
          <path d="M 220 5 Q 310 35 410 8" fill="none" stroke="url(#ropeGrad)" strokeWidth="1.2" />
          {/* โค้งเชือกฝั่งขวา */}
          <path d="M 790 8 Q 940 38 1180 5" fill="none" stroke="url(#ropeGrad)" strokeWidth="1.2" />
        </svg>

        {/* รายการโคมแขวนกระดาษ (วางเฉพาะฝั่งซ้ายและขวา ไม่บังหัวข้อตรงกลางและไม่ทับกล่อง QR) */}
        {[
          { left: '23%', top: '12px', size: 'sm', delay: '0s', duration: '5.2s' },
          { left: '31%', top: '22px', size: 'md', delay: '1.2s', duration: '6.0s' },
          { left: '71%', top: '20px', size: 'md', delay: '0.6s', duration: '5.5s' },
          { left: '80%', top: '25px', size: 'lg', delay: '1.8s', duration: '6.4s' },
          { left: '91%', top: '14px', size: 'sm', delay: '0.4s', duration: '5.0s' },
        ].map((item, index) => {
          const widthClass = item.size === 'lg' ? 'w-8 sm:w-10' : item.size === 'md' ? 'w-7 sm:w-8' : 'w-6 sm:w-7';
          return (
            <div
              key={index}
              style={{
                left: item.left,
                top: item.top,
                animation: `swaySlow ${item.duration} ease-in-out infinite alternate`,
                animationDelay: item.delay,
                transformOrigin: 'top center'
              }}
              className={`absolute flex flex-col items-center ${widthClass} drop-shadow-[0_4px_16px_rgba(245,158,11,0.55)]`}
            >
              {/* สายแขวนโคมสั้นๆ */}
              <div className="w-[1.5px] h-3 sm:h-4 bg-gradient-to-b from-amber-300 to-amber-500" />
              
              {/* ตัวโคมกระดาษทรงแปดเหลี่ยม (Lanna Lantern Body) */}
              <div className="relative w-full aspect-[1/1.25] flex items-center justify-center">
                {/* แสงเรืองวงกว้างรอบโคม */}
                <div className="absolute inset-0 bg-amber-400/35 rounded-full blur-md animate-pulse" />
                
                <svg viewBox="0 0 60 75" className="w-full h-full relative z-10">
                  {/* ขอบทองยอดโคม */}
                  <polygon points="18,5 42,5 48,15 12,15" fill="#d97706" stroke="#fde047" strokeWidth="1" />
                  {/* ตัวโคมกระดาษเหลืองทอง */}
                  <polygon points="12,15 48,15 56,48 4,48" fill="url(#lanternGlow)" stroke="#f59e0b" strokeWidth="1.2" />
                  {/* ลายเส้นโครงโคม */}
                  <line x1="22" y1="15" x2="18" y2="48" stroke="#d97706" strokeWidth="0.8" opacity="0.6" />
                  <line x1="30" y1="15" x2="30" y2="48" stroke="#d97706" strokeWidth="0.8" opacity="0.6" />
                  <line x1="38" y1="15" x2="42" y2="48" stroke="#d97706" strokeWidth="0.8" opacity="0.6" />
                  {/* ฐานล่างโคม */}
                  <polygon points="4,48 56,48 44,58 16,58" fill="#b45309" stroke="#fde047" strokeWidth="1" />
                  {/* ไส้เทียนใจกลางโคมสว่างวาบ */}
                  <circle cx="30" cy="34" r="5" fill="#fffbeb" className="animate-ping" opacity="0.75" />
                  <circle cx="30" cy="34" r="3" fill="#fffbeb" />
                </svg>
              </div>

              {/* ชายพู่ห้อยด้านล่าง (Tassel) */}
              <div className="w-[1.5px] h-3 sm:h-5 bg-gradient-to-b from-amber-400 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-300 -mt-1 shadow-sm" />
            </div>
          );
        })}
      </div>

      {/* ---------------- 3. ฉากหน้าริมตลิ่งด้านล่าง (Foreground Riverbank Silhouettes) ---------------- */}
      {/* ฝั่งล่างซ้าย: กอดอกบัวหลวง & ใบบัวริมตลิ่ง (Bottom-Left Lotus Foreground) */}
      <div className="absolute bottom-0 left-0 w-44 sm:w-64 md:w-80 h-36 sm:h-52 z-15 opacity-80 drop-shadow-[0_-3px_15px_rgba(245,158,11,0.25)]">
        <svg viewBox="0 0 280 180" className="w-full h-full">
          <defs>
            <linearGradient id="foreLeftGrad" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#050a16" />
              <stop offset="60%" stopColor="#0b132b" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          {/* ตลิ่งดินริมน้ำ */}
          <path d="M 0 180 L 190 180 Q 120 155 60 145 Q 20 135 0 120 Z" fill="#050a16" />
          
          {/* ก้านและใบบัวหลวงใบใหญ่ 1 */}
          <ellipse cx="65" cy="130" rx="60" ry="22" fill="url(#foreLeftGrad)" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.6" transform="rotate(-12, 65, 130)" />
          {/* ใบบัวใบที่ 2 */}
          <ellipse cx="140" cy="148" rx="48" ry="18" fill="url(#foreLeftGrad)" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.5" transform="rotate(8, 140, 148)" />

          {/* ดอกบัวหลวงตูมชูช่อริมฝั่ง */}
          <path
            d="M 115 160 Q 110 110 112 85 
               Q 102 70 112 50 
               Q 122 70 114 85 
               Q 116 110 118 160 Z"
            fill="url(#foreLeftGrad)"
            stroke="#fde047"
            strokeWidth="1.2"
            strokeOpacity="0.8"
          />
          {/* กลีบบัวสีชมพูเหลือบทองสลัว */}
          <circle cx="112" cy="50" r="4" fill="#fde68a" opacity="0.9" />
        </svg>
      </div>

      {/* ฝั่งล่างขวา: กอใบตองและก้านบัวริมน้ำ (Bottom-Right Banana Leaves / Foliage Foreground) */}
      <div className="absolute bottom-0 right-0 w-44 sm:w-64 md:w-80 h-36 sm:h-52 z-15 opacity-80 drop-shadow-[0_-3px_15px_rgba(245,158,11,0.25)] transform scale-x-[-1]">
        <svg viewBox="0 0 280 180" className="w-full h-full">
          {/* ตลิ่งริมฝั่งขวา */}
          <path d="M 0 180 L 210 180 Q 140 150 70 140 Q 25 130 0 110 Z" fill="#050a16" />
          
          {/* กอใบบัวหลวงหนาทึบ */}
          <ellipse cx="75" cy="125" rx="65" ry="24" fill="url(#foreLeftGrad)" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.6" transform="rotate(-15, 75, 125)" />
          <ellipse cx="155" cy="145" rx="52" ry="19" fill="url(#foreLeftGrad)" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.5" transform="rotate(6, 155, 145)" />

          {/* ดอกบัวบานเผยกลีบรับแสงจันทร์ */}
          <g transform="translate(125, 60)">
            <ellipse cx="0" cy="12" rx="14" ry="7" fill="url(#foreLeftGrad)" stroke="#fde047" strokeWidth="1" />
            <ellipse cx="-7" cy="6" rx="9" ry="14" fill="url(#foreLeftGrad)" stroke="#fde047" strokeWidth="0.9" transform="rotate(-20)" />
            <ellipse cx="7" cy="6" rx="9" ry="14" fill="url(#foreLeftGrad)" stroke="#fde047" strokeWidth="0.9" transform="rotate(20)" />
            <circle cx="0" cy="8" r="3" fill="#fffbeb" opacity="0.95" />
          </g>
        </svg>
      </div>
    </div>
  );
};
