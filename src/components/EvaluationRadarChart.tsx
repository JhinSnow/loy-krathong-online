// src/components/EvaluationRadarChart.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Download, Image as ImageIcon, Sun, Moon, Radar } from 'lucide-react';
import type { QuestionStatRow } from '../utils/evaluationHelpers';

interface EvaluationRadarChartProps {
  questionStats: QuestionStatRow[];
  overallMean: number;
  totalN: number;
}

/**
 * ฟังก์ชันวาด Radar Chart 10 แกนลงบน HTML5 Canvas (ใช้ได้ทั้งแสดงผลหน้าจอ, ดาวน์โหลด PNG/JPG และฝังลงรายงาน PDF A4)
 */
export function drawRadarChartOnCanvas(
  canvas: HTMLCanvasElement,
  questionStats: QuestionStatRow[],
  overallMean: number,
  totalN: number,
  theme: 'light' | 'dark' = 'light'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 1200;
  const height = 860;
  canvas.width = width;
  canvas.height = height;

  const isLight = theme === 'light';

  // 1. Background
  ctx.fillStyle = isLight ? '#fffdf9' : '#1f150d';
  ctx.fillRect(0, 0, width, height);

  // กรอบบางๆ รอบภาพสำหรับแปะรายงาน
  ctx.strokeStyle = isLight ? '#e5d7be' : '#573d24';
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // 2. Header Title
  ctx.textAlign = 'center';
  ctx.fillStyle = isLight ? '#231912' : '#fef3c7';
  ctx.font = 'bold 28px "IBM Plex Sans Thai Looped", sans-serif';
  ctx.fillText(
    'กราฟเรดาร์แสดงระดับความพึงพอใจของผู้เข้าร่วมโครงการเทศกาลลอยกระทง (10 ด้าน)',
    width / 2,
    62
  );

  ctx.fillStyle = isLight ? '#6b5540' : '#d6b88e';
  ctx.font = '600 19px "IBM Plex Sans Thai Looped", sans-serif';
  ctx.fillText(
    `จำนวนผู้ตอบแบบประเมินทั้งหมด (N) = ${totalN.toLocaleString()} คน   |   ค่าเฉลี่ยรวมทุกด้าน (x̄) = ${overallMean.toFixed(2)} / 5.00 คะแนน`,
    width / 2,
    98
  );

  // 3. Radar Geometry Setup
  const centerX = width / 2;
  const centerY = 470;
  const maxRadius = 265;
  const numAxes = 10;
  const maxScore = 5;

  // วาดเส้นใยแมงมุม 5 ระดับ (1.0 - 5.0)
  for (let level = 1; level <= maxScore; level++) {
    const r = (level / maxScore) * maxRadius;
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // สีพื้นสลับชั้นบางๆ
    if (level % 2 === 1) {
      ctx.fillStyle = isLight ? 'rgba(254, 243, 199, 0.35)' : 'rgba(69, 44, 22, 0.45)';
      ctx.fill();
    }

    ctx.strokeStyle =
      level === maxScore
        ? isLight
          ? '#a17c50'
          : '#926b3f'
        : isLight
          ? '#e7dcc8'
          : '#49331e';
    ctx.lineWidth = level === maxScore ? 2 : 1.2;
    ctx.stroke();

    // ตัวเลขกำกับสเกล 1 - 5 บนแกนตั้ง
    ctx.fillStyle = isLight ? '#7c5d3a' : '#d6b88e';
    ctx.font = 'bold 14px "IBM Plex Sans Thai Looped", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${level}.0`, centerX - 8, centerY - r + 5);
  }

  // 4. วาดเส้นแกนทั้ง 10 ด้าน (Spokes) และป้ายชื่อหัวข้อ
  for (let i = 0; i < numAxes; i++) {
    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
    const xEnd = centerX + maxRadius * Math.cos(angle);
    const yEnd = centerY + maxRadius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = isLight ? '#e7dcc8' : '#49331e';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // ตำแหน่งวางข้อความหัวข้อและคะแนนเฉลี่ยแต่ละด้าน
    const labelRadius = maxRadius + 46;
    const lx = centerX + labelRadius * Math.cos(angle);
    const ly = centerY + labelRadius * Math.sin(angle);

    const stat = questionStats[i];
    const labelText = stat ? stat.shortLabel : `ข้อที่ ${i + 1}`;
    const scoreText = stat ? `(x̄ = ${stat.mean.toFixed(2)})` : '';

    ctx.save();
    if (Math.abs(Math.cos(angle)) < 0.15) {
      ctx.textAlign = 'center';
    } else if (Math.cos(angle) > 0) {
      ctx.textAlign = 'left';
    } else {
      ctx.textAlign = 'right';
    }

    ctx.fillStyle = isLight ? '#231912' : '#fffbeb';
    ctx.font = 'bold 17px "IBM Plex Sans Thai Looped", sans-serif';
    ctx.fillText(labelText, lx, ly - 4);

    ctx.fillStyle = isLight ? '#b45309' : '#fbbf24';
    ctx.font = 'bold 16px "IBM Plex Sans Thai Looped", sans-serif';
    ctx.fillText(scoreText, lx, ly + 18);
    ctx.restore();
  }

  // 5. วาดพื้นที่ข้อมูลคะแนนความพึงพอใจ 10 ด้าน (Data Polygon)
  if (questionStats.length > 0) {
    ctx.beginPath();
    questionStats.forEach((stat, i) => {
      const val = Math.min(Math.max(stat.mean || 0, 0), maxScore);
      const r = (val / maxScore) * maxRadius;
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // พื้นที่โปร่งแสงด้านใน
    ctx.fillStyle = isLight ? 'rgba(245, 158, 11, 0.28)' : 'rgba(251, 191, 36, 0.32)';
    ctx.fill();

    // เส้นขอบกราฟ
    ctx.strokeStyle = isLight ? '#d97706' : '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();

    // วาดจุด (Vertices) ของแต่ละด้าน
    questionStats.forEach((stat, i) => {
      const val = Math.min(Math.max(stat.mean || 0, 0), maxScore);
      const r = (val / maxScore) * maxRadius;
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#b45309' : '#fde047';
      ctx.fill();
      ctx.strokeStyle = isLight ? '#fffdf9' : '#1f150d';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
  }

  // 6. Footer Legend
  ctx.textAlign = 'center';
  ctx.fillStyle = isLight ? '#6b5540' : '#d6b88e';
  ctx.font = '14px "IBM Plex Sans Thai Looped", sans-serif';
  ctx.fillText(
    'เกณฑ์ระดับคะแนน: 4.51-5.00 = มากที่สุด | 3.51-4.50 = มาก | 2.51-3.50 = ปานกลาง | 1.51-2.50 = น้อย | 1.00-1.50 = น้อยที่สุด',
    width / 2,
    height - 28
  );
}

/**
 * สร้าง Data URL ของกราฟ Radar Chart พื้นขาวสำหรับแนบลงรายงานสรุปโครงการ PDF A4
 */
export function generateRadarChartDataUrl(
  questionStats: QuestionStatRow[],
  overallMean: number,
  totalN: number,
  theme: 'light' | 'dark' = 'light'
): string {
  const offscreen = document.createElement('canvas');
  drawRadarChartOnCanvas(offscreen, questionStats, overallMean, totalN, theme);
  return offscreen.toDataURL('image/png', 1.0);
}

export const EvaluationRadarChart: React.FC<EvaluationRadarChartProps> = ({
  questionStats,
  overallMean,
  totalN
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chartTheme, setChartTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    if (!canvasRef.current) return;
    drawRadarChartOnCanvas(canvasRef.current, questionStats, overallMean, totalN, chartTheme);
  }, [questionStats, overallMean, totalN, chartTheme]);

  const handleDownloadImage = (format: 'png' | 'jpg', forceLightForReport = false) => {
    const tempCanvas = document.createElement('canvas');
    drawRadarChartOnCanvas(
      tempCanvas,
      questionStats,
      overallMean,
      totalN,
      forceLightForReport ? 'light' : chartTheme
    );

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = tempCanvas.toDataURL(mime, 0.98);
    const link = document.createElement('a');
    link.download = `loy-krathong-radar-chart-${forceLightForReport ? 'report' : chartTheme}.${format}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="bg-white border border-amber-900/12 text-[#231912] rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-amber-900/10">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#231912] flex items-center gap-2">
            <Radar className="w-5 h-5 text-amber-700 shrink-0" />
            <span>กราฟเรดาร์สรุปผลความพึงพอใจ 10 ด้าน (Radar / Spider Web Chart)</span>
          </h3>
          <p className="text-xs text-[#7c5d3a] mt-0.5">
            แสดงค่าเฉลี่ยรายด้าน (สเกล 1.00 – 5.00) พร้อมดาวน์โหลดเป็นไฟล์รูปภาพความละเอียดสูงสำหรับแปะเล่มรายงาน
          </p>
        </div>

        {/* ปุ่มสลับพื้นหลัง & ดาวน์โหลดรูปภาพ */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setChartTheme(chartTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f6efdf] hover:bg-amber-100 text-[#231912] border border-amber-900/15 transition active:scale-95 cursor-pointer"
          >
            {chartTheme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>สลับพื้นครีม-ขาว (สำหรับทำเล่ม)</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-700" />
                <span>สลับพื้นเข้ม (Dark Mode)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDownloadImage('png', true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] border border-amber-600/25 transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด PNG (พื้นขาวแปะเล่มรายงาน)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadImage('jpg', false)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#241911] hover:bg-[#38271a] text-[#fffbeb] border border-[#241911] transition active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด JPG</span>
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-3xl rounded-2xl overflow-hidden border border-amber-900/12 shadow-inner bg-[#f7f1e3] flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-[540px] object-contain rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};
