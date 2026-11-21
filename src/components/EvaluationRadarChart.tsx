// src/components/EvaluationRadarChart.tsx
import React, { useEffect, useRef } from 'react';
import { Download, Image as ImageIcon, Radar } from 'lucide-react';
import type { DimensionStatRow } from '../utils/evaluationHelpers';

interface EvaluationRadarChartProps {
  dimensionStats: DimensionStatRow[];
  overallMean: number;
  totalN: number;
}

const CHART_FONT_FAMILY = "'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', sans-serif";

/**
 * ฟังก์ชันวาด Radar Chart 9 แกนแบบขาว-ดำมาตรฐานเอกสารราชการ (TH Sarabun PSK)
 */
export function drawRadarChartOnCanvas(
  canvas: HTMLCanvasElement,
  dimensionStats: DimensionStatRow[],
  overallMean: number,
  totalN: number,
  _theme: 'light' | 'dark' | 'bw' = 'bw'
) {
  void _theme;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 1280;
  const height = 900;
  canvas.width = width;
  canvas.height = height;

  // 1. Background & Frame (Pure Black & White)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  // 2. Header Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.font = `bold 34px ${CHART_FONT_FAMILY}`;
  ctx.fillText(
    'กราฟเรดาร์สรุปผลความพึงพอใจโครงการลอยกระทงบุฟเฟต์ 9 หมวดหลัก (มาตรฐานกลาง ม.อ.)',
    width / 2,
    64
  );

  ctx.fillStyle = '#222222';
  ctx.font = `600 24px ${CHART_FONT_FAMILY}`;
  ctx.fillText(
    `จำนวนผู้ตอบแบบประเมินทั้งหมด (N) = ${totalN.toLocaleString()} คน   |   ค่าเฉลี่ยรวมทุกด้าน = ${overallMean.toFixed(2)} / 5.00 คะแนน`,
    width / 2,
    102
  );

  // 3. Radar Geometry Setup
  const centerX = width / 2;
  const centerY = 485;
  const maxRadius = 240;
  const numAxes = Math.max(dimensionStats.length, 3);
  const maxScore = 5;

  // วาดเส้นใยแมงมุม 5 ระดับ (1.0 - 5.0)
  for (let level = maxScore; level >= 1; level--) {
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

    ctx.fillStyle = level % 2 === 1 ? '#f7f7f7' : '#ffffff';
    ctx.fill();

    ctx.strokeStyle = level === maxScore ? '#111111' : '#888888';
    ctx.lineWidth = level === maxScore ? 2 : 1;
    ctx.stroke();

    // ตัวเลขกำกับสเกล 1 - 5 บนแกนตั้ง
    ctx.fillStyle = '#222222';
    ctx.font = `bold 18px ${CHART_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${level}.0`, centerX - 10, centerY - r + 6);
  }

  // 4. วาดเส้นแกน (Spokes) และป้ายชื่อหมวด
  for (let i = 0; i < numAxes; i++) {
    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
    const xEnd = centerX + maxRadius * Math.cos(angle);
    const yEnd = centerY + maxRadius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(xEnd, yEnd);
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.stroke();

    const labelRadius = maxRadius + 48;
    const lx = centerX + labelRadius * Math.cos(angle);
    const ly = centerY + labelRadius * Math.sin(angle);

    const stat = dimensionStats[i];
    const labelText = stat ? stat.shortLabel : `หมวดที่ ${i + 1}`;
    const scoreText = stat ? `(เฉลี่ย ${stat.mean.toFixed(2)})` : '';

    ctx.save();
    if (Math.abs(Math.cos(angle)) < 0.15) {
      ctx.textAlign = 'center';
    } else if (Math.cos(angle) > 0) {
      ctx.textAlign = 'left';
    } else {
      ctx.textAlign = 'right';
    }

    ctx.fillStyle = '#000000';
    ctx.font = `bold 23px ${CHART_FONT_FAMILY}`;
    ctx.fillText(labelText, lx, ly - 6);

    ctx.fillStyle = '#111111';
    ctx.font = `bold 22px ${CHART_FONT_FAMILY}`;
    ctx.fillText(scoreText, lx, ly + 20);
    ctx.restore();
  }

  // 5. วาดพื้นที่ข้อมูลคะแนนความพึงพอใจ (Data Polygon แบบขาว-ดำคมชัด)
  if (dimensionStats.length > 0 && totalN > 0) {
    ctx.beginPath();
    dimensionStats.forEach((stat, i) => {
      const val = Math.min(Math.max(stat.mean || 0, 0), maxScore);
      const r = (val / maxScore) * maxRadius;
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    dimensionStats.forEach((stat, i) => {
      const val = Math.min(Math.max(stat.mean || 0, 0), maxScore);
      const r = (val / maxScore) * maxRadius;
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // 6. Footer Legend
  ctx.textAlign = 'center';
  ctx.fillStyle = '#222222';
  ctx.font = `19px ${CHART_FONT_FAMILY}`;
  ctx.fillText(
    'เกณฑ์ระดับคะแนน: 4.51-5.00 = มากที่สุด | 3.51-4.50 = มาก | 2.51-3.50 = ปานกลาง | 1.51-2.50 = น้อย | 1.00-1.50 = น้อยที่สุด',
    width / 2,
    height - 30
  );
}

/**
 * สร้าง Data URL ของกราฟ Radar Chart พื้นขาว-ดำสำหรับแนบลงรายงานสรุปโครงการ PDF A4
 */
export function generateRadarChartDataUrl(
  dimensionStats: DimensionStatRow[],
  overallMean: number,
  totalN: number,
  _theme: 'light' | 'dark' | 'bw' = 'bw'
): string {
  void _theme;
  const offscreen = document.createElement('canvas');
  drawRadarChartOnCanvas(offscreen, dimensionStats, overallMean, totalN, 'bw');
  return offscreen.toDataURL('image/png', 1.0);
}

export const EvaluationRadarChart: React.FC<EvaluationRadarChartProps> = ({
  dimensionStats,
  overallMean,
  totalN
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!canvasRef.current) return;
    drawRadarChartOnCanvas(canvasRef.current, dimensionStats, overallMean, totalN, 'bw');

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled && canvasRef.current) {
          drawRadarChartOnCanvas(canvasRef.current, dimensionStats, overallMean, totalN, 'bw');
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [dimensionStats, overallMean, totalN]);

  const handleDownloadImage = (format: 'png' | 'jpg') => {
    const tempCanvas = document.createElement('canvas');
    drawRadarChartOnCanvas(tempCanvas, dimensionStats, overallMean, totalN, 'bw');

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = tempCanvas.toDataURL(mime, 0.98);
    const link = document.createElement('a');
    link.download = `loy-krathong-radar-chart-bw.${format}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="bg-white border border-amber-900/12 text-[#231912] rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-amber-900/10">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#231912] flex items-center gap-2">
            <Radar className="w-5 h-5 text-[#231912] shrink-0" />
            <span>กราฟเรดาร์สรุปผลความพึงพอใจ 9 หมวดหลัก (ขาว-ดำ มาตรฐานเล่มรายงาน)</span>
          </h3>
          <p className="text-xs text-[#574536] mt-0.5">
            แสดงค่าเฉลี่ยรายหมวดหลักทั้ง 9 ด้าน แบบขาว-ดำความละเอียดสูงสำหรับแนบเล่มสรุปโครงการ
          </p>
        </div>

        {/* ปุ่มดาวน์โหลดรูปภาพขาว-ดำ */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadImage('png')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#111111] hover:bg-[#333333] text-white border border-[#111111] transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด PNG (ขาว-ดำ แปะเล่มรายงาน)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadImage('jpg')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-neutral-100 text-[#111111] border border-neutral-400 transition active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด JPG (ขาว-ดำ)</span>
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-3xl rounded-2xl overflow-hidden border border-neutral-300 shadow-inner bg-white flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-[540px] object-contain rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};
