export function PumpkinBuilding() {
  return (
    <div className="relative flex justify-center items-end pointer-events-none select-none">
      <svg
        viewBox="0 0 1000 340"
        className="w-[460px] md:w-[600px] lg:w-[700px] h-auto drop-shadow-[0_0_25px_rgba(251,191,36,0.45)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* สี Gradient ผิวกลีบสีทอง */}
          <linearGradient id="petalGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* ซุ้มโค้งสีขาวเรืองแสงด้านล่าง */}
          <linearGradient id="whiteArchGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. แนวระเบียงฐานล่างสุด (เตี้ยติดตลิ่ง) */}
        <rect x="30" y="315" width="940" height="15" rx="3" fill="#0F172A" stroke="#B45309" strokeWidth="2" />
        <line x1="30" y1="322" x2="970" y2="322" stroke="#FDE68A" strokeWidth="1" opacity="0.6" />

        {/* 2. ผืนหลังคาตึกฟักทองฝั่งซ้าย (4 กลีบเชื่อมต่อกันเป็นเส้นเดียว ยอดสัมผัสกันต่อเนื่อง) */}
        <path
          d="
            M 40 315 
            C 40 180, 80 160, 145 160
            C 185 160, 195 190, 200 210
            C 210 130, 260 110, 320 110
            C 365 110, 380 145, 385 170
            C 395 85,  440 60,  495 60
            L 495 315
            Z
          "
          fill="url(#petalGlow)"
        />

        {/* 3. ผืนหลังคาตึกฟักทองฝั่งขวา (4 กลีบเชื่อมต่อกันเป็นเส้นเดียว พลิกสมมาตร เว้นร่องกลาง 10px) */}
        <path
          d="
            M 960 315 
            C 960 180, 920 160, 855 160
            C 815 160, 805 190, 800 210
            C 790 130, 740 110, 680 110
            C 635 110, 620 145, 615 170
            C 605 85,  560 60,  505 60
            L 505 315
            Z
          "
          fill="url(#petalGlow)"
        />

        {/* 4. เส้นสันแนวแบ่งกลีบสีทองสว่าง (Ridge Lines) */}
        <g stroke="#FFFBEB" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" filter="url(#softGlow)">
          {/* ฝั่งซ้าย */}
          <path d="M 145 160 Q 140 240 135 315" />
          <path d="M 260 110 Q 255 210 250 315" />
          <path d="M 380 75 Q 375 195 370 315" />
          <path d="M 495 60 L 495 315" stroke="#FDE68A" strokeWidth="3" />

          {/* ฝั่งขวา */}
          <path d="M 855 160 Q 860 240 865 315" />
          <path d="M 740 110 Q 745 210 750 315" />
          <path d="M 620 75 Q 625 195 630 315" />
          <path d="M 505 60 L 505 315" stroke="#FDE68A" strokeWidth="3" />
        </g>

        {/* 5. ซุ้มโค้งสีขาวใต้ฐานกลีบ (White Arches) เรียงติดกันที่ชายคาล่าง */}
        <g fill="url(#whiteArchGlow)" stroke="#94A3B8" strokeWidth="1">
          {/* ซุ้มฝั่งซ้าย */}
          <path d="M 40 315 Q 92 245 145 315 Z" />
          <path d="M 145 315 Q 202 245 260 315 Z" />
          <path d="M 260 315 Q 320 240 380 315 Z" />
          <path d="M 380 315 Q 437 235 495 315 Z" />

          {/* ซุ้มฝั่งขวา */}
          <path d="M 505 315 Q 563 235 620 315 Z" />
          <path d="M 620 315 Q 680 240 740 315 Z" />
          <path d="M 740 315 Q 798 245 855 315 Z" />
          <path d="M 855 315 Q 907 245 960 315 Z" />
        </g>

        {/* 6. เส้นรอยต่อกึ่งกลางตึก (Center Split Line) */}
        <line x1="500" y1="50" x2="500" y2="315" stroke="#0F172A" strokeWidth="3" opacity="0.8" />
      </svg>
    </div>
  );
}
