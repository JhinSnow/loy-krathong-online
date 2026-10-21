// src/components/ShareCardModal.tsx
import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { KrathongVisual } from './KrathongVisual';
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-amber-200 mb-4">การ์ดกระทงของคุณ 🪷</h3>

        {/* --- Exportable Card Target --- */}
        <div
          ref={cardRef}
          className="bg-gradient-to-b from-[#0a1128] via-[#001e3d] to-[#000814] p-6 rounded-2xl border border-amber-500/40 text-center shadow-inner relative overflow-hidden"
        >
          {/* Moon Silhouette */}
          <div className="absolute top-3 right-4 w-10 h-10 rounded-full bg-yellow-200/90 shadow-[0_0_20px_#fde047]" />

          <p className="text-[10px] tracking-widest text-amber-300 uppercase font-semibold">
            Online Loy Krathong Festival
          </p>
          <h4 className="text-base font-extrabold text-amber-100 mt-1">ค่ำคืนวันเพ็ญเดือนสิบสอง</h4>

          {/* Visual */}
          <div className="my-2 flex justify-center">
            <KrathongVisual
              baseType={baseType}
              flowerType={flowerType}
              candleColor={candleColor}
              size="md"
            />
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 mt-2">
            <p className="text-xs font-semibold text-amber-200">{ownerName}</p>
            <p className="text-[10px] text-slate-300">({userTypeMap[userType] || userType})</p>
            <p className="text-xs text-slate-100 italic mt-2 leading-relaxed">
              "{wishMessage}"
            </p>
          </div>

          <p className="text-[9px] text-amber-200/50 mt-4 tracking-wider">
            ร่วมสืบสานประเพณีและขอขมาพระแม่คงคา
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-xl shadow-lg transition"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'กำลังสร้างรูปภาพ...' : 'บันทึกภาพลงเครื่อง (Save Card)'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกลิงก์แล้ว!' : 'แชร์ชวนเพื่อนมาลอยด้วยกัน'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
