// src/components/KrathongCustomizer.tsx
import React, { useState } from 'react';
import type { UserType } from '../types';
import { KrathongVisual } from './KrathongVisual';
import { ShareCardModal } from './ShareCardModal';
import { Sparkles, ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface KrathongCustomizerProps {
  onBackToRiver: () => void;
  onSuccessFloating: (krathongId: string, userType: UserType) => void;
}

export const KrathongCustomizer: React.FC<KrathongCustomizerProps> = ({
  onBackToRiver,
  onSuccessFloating
}) => {
  const [userType, setUserType] = useState<UserType>('student');
  const [ownerName, setOwnerName] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [baseType, setBaseType] = useState('banana_leaf');
  const [flowerType, setFlowerType] = useState('lotus_flower');
  const [candleColor, setCandleColor] = useState('yellow');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const bases = [
    { id: 'banana_leaf', name: 'ใบตองธรรมชาติ', desc: 'ย่อยสลายง่าย อนุรักษ์ไทย', icon: '🍃' },
    { id: 'coconut', name: 'กะลามะพร้าว', desc: 'ทนทาน สวยงามแบบพื้นบ้าน', icon: '🥥' },
    { id: 'bread', name: 'ขนมปังรักษ์โลก', desc: 'เป็นอาหารปลาในสายน้ำ', icon: '🍞' },
    { id: 'lotus', name: 'กลีบบัวหลวง', desc: 'งดงาม บริสุทธิ์ ศักดิ์สิทธิ์', icon: '🪷' },
  ];

  const flowers = [
    { id: 'lotus_flower', name: 'ดอกบัวชมพู', color: '#f43f5e' },
    { id: 'marigold', name: 'ดอกดาวเรืองทอง', color: '#fbbf24' },
    { id: 'orchid', name: 'ดอกกล้วยไม้ม่วง', color: '#c084fc' },
  ];

  const candles = [
    { id: 'yellow', name: 'สีทองอร่าม', hex: '#fde047' },
    { id: 'red', name: 'สีแดงนำโชค', hex: '#f87171' },
    { id: 'orange', name: 'สีส้มอบอุ่น', hex: '#fb923c' },
    { id: 'cyan', name: 'สีฟ้าน้ำทะเล', hex: '#38bdf8' },
  ];

  const handleFloatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!ownerName.trim()) {
      setErrorMsg('กรุณาระบุชื่อหรือนามแฝงของคุณ');
      return;
    }
    if (!wishMessage.trim()) {
      setErrorMsg('กรุณาระบุคำอวยพรหรือคำขอขมา');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/krathongs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          ownerName: ownerName.trim(),
          wishMessage: wishMessage.trim(),
          baseType,
          flowerType,
          candleColor
        })
      });

      const data = await res.json() as any;

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถปล่อยกระทงได้');
      }

      // ส่งต่อไปยังแบบประเมินความพึงพอใจทันที
      onSuccessFloating(data.id, userType);
    } catch (err: any) {
      // โหมด Offline/Demo fallback ถ้ายังไม่ได้ต่อ D1 จริง
      console.warn('API error, using local fallback:', err);
      const fakeId = `local-${Date.now()}`;
      onSuccessFloating(fakeId, userType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={onBackToRiver}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่แม่น้ำ</span>
        </button>

        <h2 className="text-lg font-bold text-amber-200">
          รังสรรค์กระทงออนไลน์ 🪷
        </h2>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-medium border border-amber-500/30 transition"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">การ์ดรูปภาพ</span>
        </button>
      </div>

      {/* Main Builder Grid */}
      <div className="max-w-4xl mx-auto w-full my-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
        {/* Left Side: Real-time Live Preview */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />

          <p className="text-xs text-amber-300/80 font-medium mb-2 tracking-wide uppercase">
            ตัวอย่างกระทงจริง (Live Preview)
          </p>

          <div className="my-3 transform hover:scale-105 transition-transform duration-300">
            <KrathongVisual
              baseType={baseType}
              flowerType={flowerType}
              candleColor={candleColor}
              size="lg"
            />
          </div>

          {/* Speech Bubble Preview */}
          <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center mt-3 shadow-lg">
            <p className="font-bold text-amber-200 text-sm">
              {ownerName || 'ชื่อของคุณจะปรากฏที่นี่'}
            </p>
            <p className="text-xs text-slate-200 italic mt-1 break-words">
              "{wishMessage || 'คำขอขมาพระแม่คงคาหรือคำอธิษฐาน...'}"
            </p>
          </div>
        </div>

        {/* Right Side: Form Controls */}
        <div className="md:col-span-7 bg-slate-900/80 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
          <form onSubmit={handleFloatSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs text-center">
                {errorMsg}
              </div>
            )}

            {/* 1. ประเภทผู้ใช้งาน (บังคับ) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                1. ประเภทผู้ใช้งาน <span className="text-amber-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'student', label: 'นักศึกษา' },
                  { id: 'staff', label: 'บุคลากร' },
                  { id: 'general', label: 'บุคคลทั่วไป' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setUserType(type.id as UserType)}
                    className={`py-2 text-xs font-medium rounded-xl border transition ${
                      userType === type.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. ชื่อ & คำอวยพร */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ชื่อ / นามแฝง <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="เช่น มะลิวัลย์, สมชาย"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  คำอธิษฐาน / คำขอขมา <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="ขอขมาพระแม่คงคา ขอให้ชีวิตราบรื่น..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 3. เลือกฐานกระทง */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                2. เลือกฐานกระทง
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {bases.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBaseType(b.id)}
                    className={`p-2 rounded-xl border text-left transition flex flex-col items-center text-center ${
                      baseType === b.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl mb-1">{b.icon}</span>
                    <span className="text-xs font-bold">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ดอกไม้ & แสงเทียน */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Flowers */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  3. ดอกไม้ประดับ
                </label>
                <div className="flex space-x-2">
                  {flowers.map((fl) => (
                    <button
                      key={fl.id}
                      type="button"
                      onClick={() => setFlowerType(fl.id)}
                      className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-medium transition flex items-center justify-center space-x-1.5 ${
                        flowerType === fl.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fl.color }} />
                      <span className="text-[11px] truncate">{fl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Candles */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  4. แสงเทียนนำทาง
                </label>
                <div className="flex space-x-2">
                  {candles.map((cd) => (
                    <button
                      key={cd.id}
                      type="button"
                      onClick={() => setCandleColor(cd.id)}
                      className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-medium transition flex items-center justify-center space-x-1.5 ${
                        candleColor === cd.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cd.hex }} />
                      <span className="text-[11px] truncate">{cd.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-2xl shadow-xl transition active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'กำลังส่งข้อมูล...' : 'ปล่อยกระทงลงน้ำ 🌊'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Social Card Modal */}
      {showShareModal && (
        <ShareCardModal
          ownerName={ownerName || 'ผู้มีจิตศรัทธา'}
          wishMessage={wishMessage || 'ขอขมาพระแม่คงคา'}
          userType={userType}
          baseType={baseType}
          flowerType={flowerType}
          candleColor={candleColor}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
