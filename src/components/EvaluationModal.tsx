// src/components/EvaluationModal.tsx
import React, { useState } from 'react';
import { Star, Send, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../utils/supabase';

interface EvaluationModalProps {
  krathongId: string | null;
  userType: string;
  onFinish: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  krathongId,
  userType,
  onFinish
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (isSkip = false) => {
    setSubmitting(true);
    try {
      if (!isSkip) {
        // ลองส่งเข้า Supabase ก่อน
        try {
          const isValidUUID = krathongId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(krathongId);
          await supabase.from('evaluations').insert([
            {
              krathong_id: isValidUUID ? krathongId : null,
              user_type: userType || 'general',
              rating: rating || 5,
              feedback: feedback.trim() || null
            }
          ]);
        } catch (supaErr) {
          console.warn('Supabase evaluation error:', supaErr);
        }

        // สำรองยิง API ฟังก์ชัน
        try {
          await fetch('/api/evaluations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              krathongId,
              userType,
              rating: rating || 5,
              feedback: feedback.trim()
            })
          });
        } catch (_) {}
      }
      // จุดพลุเฉลิมฉลอง
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn('Evaluation failed to save:', e);
    } finally {
      setSubmitting(false);
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050a16]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-b from-[#1c2541]/95 to-[#0b132b]/98 border border-amber-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center relative shadow-[0_10px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(245,158,11,0.25)] animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-3xl mb-3 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          ✨
        </div>

        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200">
          ปล่อยกระทงลงสู่สายน้ำแล้ว!
        </h3>
        <p className="text-xs text-amber-100/80 mt-1">
          โปรดสละเวลาประเมินความพึงพอใจสั้นๆ เพื่อนำไปพัฒนาการจัดงานในครั้งต่อไป
        </p>

        {/* 1-5 Star Rating */}
        <div className="my-6">
          <p className="text-xs text-amber-200/90 mb-2 font-medium">ความพึงพอใจในภาพรวมของระบบ</p>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1.5 focus:outline-none transition-transform hover:scale-125"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-amber-300 font-semibold mt-2">
            {rating === 5 && '🌟 ยอดเยี่ยมมาก'}
            {rating === 4 && '😊 พึงพอใจมาก'}
            {rating === 3 && '🙂 ปานกลาง'}
            {rating === 2 && '😐 พอใช้'}
            {rating === 1 && '🙁 ควรปรับปรุง'}
          </p>
        </div>

        {/* Optional Feedback */}
        <div className="text-left mb-6">
          <label className="block text-xs text-amber-200/80 mb-1">
            ข้อเสนอแนะเพิ่มเติม (ถ้ามี)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="ข้อความติชม หรือสิ่งที่อยากให้เพิ่มในงานครั้งต่อไป..."
            maxLength={300}
            rows={3}
            className="w-full bg-[#0b132b]/90 border border-amber-500/35 rounded-xl p-3 text-xs text-amber-50 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-stone-900 font-extrabold rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.45)] border border-yellow-200/60 transition cursor-pointer"
          >
            <Send className="w-4 h-4 text-stone-900" />
            <span>{submitting ? 'กำลังส่งข้อมูล...' : 'ส่งผลประเมิน & ไปดูแม่น้ำ'}</span>
          </button>

          <button
            onClick={() => handleSubmit(true)}
            className="w-full flex items-center justify-center space-x-1 py-2 text-amber-200/60 hover:text-amber-100 text-xs transition cursor-pointer"
          >
            <span>ข้ามขั้นตอนนี้</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
