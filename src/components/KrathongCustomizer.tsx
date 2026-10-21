// src/components/KrathongCustomizer.tsx
import React, { useState } from 'react';
import type { UserType } from '../types';
import { KrathongVisual } from './KrathongVisual';
import { ShareCardModal } from './ShareCardModal';
import { Sparkles, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../utils/supabase';

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
    { id: 'banana_leaf', name: 'ใบตอง', icon: '🍃' },
    { id: 'coconut', name: 'กะลา', icon: '🥥' },
    { id: 'bread', name: 'ขนมปัง', icon: '🍞' },
    { id: 'lotus', name: 'บัวหลวง', icon: '🪷' },
  ];

  const flowers = [
    { id: 'lotus_flower', name: 'ดอกบัว', color: '#f43f5e' },
    { id: 'marigold', name: 'ดาวเรือง', color: '#fbbf24' },
    { id: 'orchid', name: 'กล้วยไม้', color: '#c084fc' },
  ];

  const candles = [
    { id: 'yellow', name: 'สีทอง', hex: '#fde047' },
    { id: 'red', name: 'สีแดง', hex: '#f87171' },
    { id: 'orange', name: 'สีส้ม', hex: '#fb923c' },
    { id: 'cyan', name: 'สีฟ้า', hex: '#38bdf8' },
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
      let createdId: string | null = null;

      // 1. ลองบันทึกลง Supabase ก่อน
      try {
        const { data: supaData, error: supaErr } = await supabase
          .from('krathongs')
          .insert([
            {
              user_type: userType,
              owner_name: ownerName.trim(),
              wish_message: wishMessage.trim(),
              base_type: baseType,
              flower_type: flowerType,
              candle_color: candleColor,
              status: 'approved'
            }
          ])
          .select('id')
          .single();

        if (!supaErr && supaData) {
          createdId = supaData.id;
        }
      } catch (err) {
        console.warn('Supabase insert note:', err);
      }

      // 2. ถ้า Supabase ยังไม่ได้สร้างตารางหรือไม่ตอบสนอง ให้ลอง Cloudflare Function
      if (!createdId) {
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

        if (res.ok) {
          const data = await res.json() as any;
          createdId = data.id;
        }
      }

      // ส่งต่อไปยังแบบประเมินความพึงพอใจทันที
      onSuccessFloating(createdId || `local-${Date.now()}`, userType);
    } catch (err: any) {
      console.warn('Using local fallback:', err);
      const fakeId = `local-${Date.now()}`;
      onSuccessFloating(fakeId, userType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col py-3 px-3 sm:px-6 lg:px-8 overflow-y-auto">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <button
          onClick={onBackToRiver}
          className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition text-xs sm:text-sm py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับแม่น้ำ</span>
        </button>

        <h2 className="text-sm sm:text-lg font-bold text-amber-200">
          รังสรรค์กระทงออนไลน์ 🪷
        </h2>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-medium border border-amber-500/30 transition"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>การ์ดรูปภาพ</span>
        </button>
      </div>

      {/* Main Builder Container */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-start py-4 pb-12">
        {/* Left Side: Real-time Live Preview */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <p className="text-[11px] text-amber-300/80 font-medium mb-1 tracking-wide uppercase">
            ตัวอย่างกระทงจริง (Live Preview)
          </p>

          <div className="my-1 sm:my-3 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center">
            <KrathongVisual
              baseType={baseType}
              flowerType={flowerType}
              candleColor={candleColor}
              size="md"
            />
          </div>

          {/* Speech Bubble Preview */}
          <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15 text-center mt-2 shadow-lg">
            <p className="font-bold text-amber-200 text-xs sm:text-sm">
              {ownerName || 'ชื่อของคุณจะปรากฏที่นี่'}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-200 italic mt-0.5 break-words line-clamp-2">
              "{wishMessage || 'คำขอขมาพระแม่คงคาหรือคำอธิษฐาน...'}"
            </p>
          </div>
        </div>

        {/* Right Side: Form Controls */}
        <div className="md:col-span-7 bg-slate-900/80 backdrop-blur-md p-4 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
          <form onSubmit={handleFloatSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs text-center">
                {errorMsg}
              </div>
            )}

            {/* 1. ประเภทผู้ใช้งาน (บังคับ) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                1. ประเภทผู้ใช้งาน <span className="text-amber-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { id: 'student', label: 'นักศึกษา' },
                  { id: 'staff', label: 'บุคลากร' },
                  { id: 'general', label: 'บุคคลทั่วไป' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setUserType(type.id as UserType)}
                    className={`py-2 px-1 text-[11px] sm:text-xs font-medium rounded-xl border transition text-center truncate ${
                      userType === type.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 3. เลือกฐานกระทง */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                2. เลือกฐานกระทง
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {bases.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBaseType(b.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center text-center ${
                      baseType === b.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl mb-1">{b.icon}</span>
                    <span className="text-[11px] sm:text-xs font-bold leading-tight">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ดอกไม้ประดับ */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                3. ดอกไม้ประดับ
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {flowers.map((fl) => (
                  <button
                    key={fl.id}
                    type="button"
                    onClick={() => setFlowerType(fl.id)}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] sm:text-xs font-medium transition flex items-center justify-center space-x-1.5 ${
                      flowerType === fl.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fl.color }} />
                    <span className="truncate">{fl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. แสงเทียนนำทาง */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                4. แสงเทียนนำทาง
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {candles.map((cd) => (
                  <button
                    key={cd.id}
                    type="button"
                    onClick={() => setCandleColor(cd.id)}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] sm:text-xs font-medium transition flex items-center justify-center space-x-1.5 ${
                      candleColor === cd.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cd.hex }} />
                    <span className="truncate">{cd.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-2xl shadow-xl transition active:scale-98 text-sm sm:text-base cursor-pointer"
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
