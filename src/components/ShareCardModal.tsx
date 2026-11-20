// src/components/ShareCardModal.tsx
import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { KrathongThumb3D } from './KrathongThumb3D';
import { LotusIcon } from './KrathongIcons';
import { Download, X, Share2, Check } from 'lucide-react';

interface ShareCardModalProps {
  ownerName: string;
  wishMessage: string;
  userType: string;
  baseType: string;
  flowerType: string;
  candleColor: string;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  ownerName,
  wishMessage,
  userType,
  baseType,
  flowerType,
  candleColor,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `krathong-${ownerName || 'wish'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userTypeMap: Record<string, string> = {
    student: 'นักศึกษา',
    staff: 'บุคลากร',
    general: 'บุคคลทั่วไป'
  };

  return (
    <div className="fixed inset-0 bg-[#1c140d]/75 flex items-center justify-center p-4 z-50 overflow-y-auto animate-ui-fade">
      <div className="bg-[#fdfaf4] border border-amber-900/15 text-[#231912] rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-ui-modal">
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="absolute top-4 right-4 p-2 text-[#574536] hover:text-[#231912] rounded-full bg-white hover:bg-amber-50 border border-amber-900/12 transition active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-extrabold text-[#231912] mb-4 inline-flex items-center justify-center gap-1.5">
          <LotusIcon className="w-5 h-5 text-amber-600 shrink-0" />
          <span>การ์ดกระทงของคุณ</span>
        </h3>

        {/* --- Exportable Card Target (คงพื้นหลังค่ำคืนทองอุ่นให้กระทง 3 มิติส่องสว่างเด่น) --- */}
        <div
          ref={cardRef}
          className="bg-gradient-to-b from-[#24160b] via-[#362210] to-[#140c06] p-6 rounded-2xl border border-amber-500/45 text-center shadow-inner relative overflow-hidden"
        >
          {/* Moon Silhouette */}
          <div className="absolute top-3 right-4 w-10 h-10 rounded-full bg-yellow-200/90 shadow-sm" />

          <p className="text-[10px] tracking-widest text-amber-300 uppercase font-semibold">
            Online Loy Krathong Festival
          </p>
          <h4 className="text-base font-extrabold text-amber-100 mt-1">ค่ำคืนวันเพ็ญเดือนสิบสอง</h4>

          {/* Visual */}
          <div className="my-2 flex justify-center">
            <KrathongThumb3D
              baseType={baseType}
              flowerType={flowerType}
              candleColor={candleColor}
              size="md"
            />
          </div>

          <div className="bg-[#1a1109]/75 rounded-xl p-3 border border-amber-300/25 mt-2">
            <p className="text-xs font-semibold text-amber-200">{ownerName}</p>
            <p className="text-[10px] text-amber-200/75">({userTypeMap[userType] || userType})</p>
            <p className="text-xs text-amber-50 italic mt-2 leading-relaxed">
              &ldquo;{wishMessage}&rdquo;
            </p>
          </div>

          <p className="text-[9px] text-amber-200/60 mt-4 tracking-wider">
            ร่วมสืบสานประเพณีและขอขมาพระแม่คงคา
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] font-bold rounded-xl border border-amber-600/25 shadow-md transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'กำลังสร้างรูปภาพ...' : 'บันทึกภาพลงเครื่อง (Save Card)'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-white hover:bg-amber-50 text-[#231912] border border-amber-900/18 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-amber-700" />}
            <span>{copied ? 'คัดลอกลิงก์แล้ว!' : 'แชร์ชวนเพื่อนมาลอยด้วยกัน'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
