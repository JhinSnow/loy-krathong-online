// src/components/EvaluationModal.tsx
import React, { useState, useMemo } from 'react';
import { Star, ArrowRight, CheckCircle2, Sparkles, UserCheck, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../utils/supabase';
import {
  containsProfanity,
  sanitizeInputText,
  markRateLimitAction,
  VALID_USER_TYPES
} from '../utils/security';
import {
  EVALUATION_QUESTIONS,
  RATING_LABELS,
  encodeEvaluationPayload,
  saveLocalEvaluationRecord,
  getLocalKrathongRecords
} from '../utils/evaluationHelpers';
import { ShareCardModal } from './ShareCardModal';

interface EvaluationModalProps {
  krathongId: string | null;
  userType: string;
  onFinish: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  krathongId,
  userType: initialUserType,
  onFinish
}) => {
  const [selectedUserType, setSelectedUserType] = useState<string>(initialUserType || 'student');
  const [studentId, setStudentId] = useState<string>('');
  const [scores, setScores] = useState<number[]>(() => Array(10).fill(5));
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const myKrathongRecord = useMemo(() => {
    const records = getLocalKrathongRecords();
    if (krathongId) {
      const found = records.find((r) => r.id === krathongId);
      if (found) return found;
    }
    return records[0] || null;
  }, [krathongId]);

  const handleScoreChange = (questionIndex: number, scoreValue: number) => {
    setScores((prev) => {
      const next = [...prev];
      next[questionIndex] = scoreValue;
      return next;
    });
  };

  const handleSetAllScores = (scoreValue: number) => {
    setScores(Array(10).fill(scoreValue));
  };

  const currentAverage = (scores.reduce((a, b) => a + b, 0) / 10).toFixed(2);

  const handleSubmit = async (isSkip = false) => {
    setErrorMsg('');
    if (!isSkip) {
      const cleanFeedback = sanitizeInputText(feedback, 200);
      const cleanStudentId = sanitizeInputText(studentId, 20);
      if (
        (cleanFeedback && containsProfanity(cleanFeedback)) ||
        (cleanStudentId && containsProfanity(cleanStudentId))
      ) {
        setErrorMsg('กรุณาใช้ถ้อยคำที่สุภาพในแบบประเมิน');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (!isSkip) {
        const safeUserType = VALID_USER_TYPES.includes(selectedUserType as any)
          ? selectedUserType
          : 'general';
        const cleanStudentId = sanitizeInputText(studentId, 20);
        const cleanComment = sanitizeInputText(feedback, 180);

        const avgNumber = Number((scores.reduce((a, b) => a + b, 0) / 10).toFixed(2));
        const roundedOverallRating = Math.min(Math.max(Math.round(avgNumber), 1), 5);
        const encodedPayload = encodeEvaluationPayload(scores, cleanStudentId, cleanComment);

        // 1. บันทึกลง Local Storage เสมอเพื่อให้หน้า Admin Dashboard นำไปคำนวณ Radar Chart ได้ทันที
        saveLocalEvaluationRecord({
          id: `eval-${Date.now()}`,
          krathong_id: krathongId,
          user_type: safeUserType,
          student_id: cleanStudentId,
          scores,
          average_score: avgNumber,
          comment: cleanComment,
          created_at: new Date().toISOString()
        });

        let savedToSupabase = false;

        // 2. ลองส่งเข้า Supabase
        try {
          const isValidUUID =
            krathongId &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(krathongId);
          const { error: supaErr } = await supabase.from('evaluations').insert([
            {
              krathong_id: isValidUUID ? krathongId : null,
              user_type: safeUserType,
              rating: roundedOverallRating,
              feedback: encodedPayload
            }
          ]);
          if (!supaErr) {
            savedToSupabase = true;
          }
        } catch (supaErr) {
          console.warn('Supabase evaluation note:', supaErr);
        }

        // 3. สำรองยิง API ฟังก์ชันเฉพาะเมื่อไม่ได้บันทึกลง Supabase
        if (!savedToSupabase) {
          try {
            await fetch('/api/evaluations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                krathongId,
                userType: safeUserType,
                rating: roundedOverallRating,
                feedback: encodedPayload
              })
            });
          } catch (_) {}
        }

        markRateLimitAction('evaluation_submit');
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
    <div className="fixed inset-0 bg-[#050a16]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#1c2541]/98 to-[#0b132b] border border-amber-400/40 rounded-3xl p-4 sm:p-6 max-w-2xl w-full relative shadow-[0_15px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.25)] my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="text-center pb-3 border-b border-amber-500/25 shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ปล่อยกระทงลงสู่สายน้ำสำเร็จแล้ว!</span>
            </div>
            {myKrathongRecord && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/25 hover:bg-amber-400/40 border border-amber-300 text-amber-100 text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)] transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>📸 ดาวน์โหลดการ์ดที่ระลึก (E-Card)</span>
              </button>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200">
            แบบประเมินความพึงพอใจโครงการเทศกาลลอยกระทง
          </h3>
          <p className="text-[11px] sm:text-xs text-amber-100/75 mt-0.5">
            ข้อมูลของท่านจะถูกนำไปสรุปผลสัมฤทธิ์โครงการและพัฒนาการจัดงานในปีถัดไป
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 py-3 space-y-4 flex-1">
          {/* ส่วนที่ 1: ข้อมูลทั่วไปของผู้ตอบ */}
          <div className="bg-[#0b132b]/85 border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-200">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>ส่วนที่ 1: ข้อมูลทั่วไปของผู้เข้าร่วมกิจกรรม</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* ประเภทผู้เข้าร่วม */}
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-medium text-amber-100/85 mb-1">
                  ประเภทผู้เข้าร่วม <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'student', label: 'นักศึกษา' },
                    { id: 'staff', label: 'บุคลากร' },
                    { id: 'general', label: 'บุคคลภายนอก' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedUserType(t.id)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                        selectedUserType === t.id
                          ? 'bg-amber-400/25 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                          : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* รหัสนักศึกษา (Optional) */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-medium text-amber-100/85 mb-1">
                  รหัสนักศึกษา <span className="text-slate-400 font-normal">(ถ้ามี / ไม่บังคับ)</span>
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/[^0-9a-zA-Z-]/g, ''))}
                  placeholder="เช่น 6610110xxx"
                  maxLength={15}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-amber-50 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ส่วนที่ 2: หัวข้อประเมินความพึงพอใจ 10 ด้าน */}
          <div className="bg-[#0b132b]/85 border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>ส่วนที่ 2: ประเมินความพึงพอใจ 10 ด้าน (ระดับ 1 - 5)</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  เกณฑ์: 5 = มากที่สุด | 4 = มาก | 3 = ปานกลาง | 2 = น้อย | 1 = น้อยที่สุด
                </p>
              </div>

              {/* ปุ่มลัดให้คะแนนทุกข้อพร้อมกัน */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[10px] text-amber-200/70">ตั้งค่าด่วน:</span>
                {[5, 4, 3].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleSetAllScores(lvl)}
                    className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-semibold transition cursor-pointer"
                  >
                    ให้ {lvl} ทุกข้อ
                  </button>
                ))}
              </div>
            </div>

            {/* รายการคำถาม 10 ข้อ */}
            <div className="space-y-2">
              {EVALUATION_QUESTIONS.map((q, idx) => {
                const currentVal = scores[idx];
                return (
                  <div
                    key={q.id}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="text-left flex-1 pr-2">
                      <span className="text-[11px] sm:text-xs font-semibold text-amber-50 leading-snug">
                        {q.id}. {q.title}
                      </span>
                      <span className="ml-2 inline-block text-[10px] text-amber-300/90 font-medium">
                        ({RATING_LABELS[currentVal]})
                      </span>
                    </div>

                    {/* ปุ่มเลือกคะแนน 1 - 5 */}
                    <div className="flex items-center justify-end space-x-1 sm:space-x-1.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((scoreNum) => {
                        const isSelected = currentVal === scoreNum;
                        return (
                          <button
                            key={scoreNum}
                            type="button"
                            onClick={() => handleScoreChange(idx, scoreNum)}
                            title={`${scoreNum} - ${RATING_LABELS[scoreNum]}`}
                            className={`w-8 h-8 sm:w-9 sm:h-8 rounded-lg text-xs font-bold border transition flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950 border-yellow-200 shadow-[0_0_10px_rgba(251,191,36,0.5)] scale-105'
                                : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-amber-400/50 hover:text-amber-200'
                            }`}
                          >
                            {scoreNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* สรุปคะแนนเฉลี่ยปัจจุบัน */}
            <div className="flex items-center justify-between pt-2 px-1 text-xs">
              <span className="text-slate-400">ค่าเฉลี่ยความพึงพอใจของคุณ (x̄):</span>
              <span className="font-extrabold text-amber-300 text-sm">
                {currentAverage} / 5.00 ({RATING_LABELS[Math.round(Number(currentAverage))]})
              </span>
            </div>
          </div>

          {/* ส่วนที่ 3: ข้อเสนอแนะเพิ่มเติม */}
          <div className="bg-[#0b132b]/85 border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 text-left">
            <label className="block text-xs font-bold text-amber-200 mb-1.5">
              ส่วนที่ 3: ข้อเสนอแนะเพิ่มเติมเพื่อการพัฒนา (ถ้ามี)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="ความคิดเห็น ข้อเสนอแนะ หรือความประทับใจจากงานลอยกระทง..."
              maxLength={180}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-amber-50 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
            />
            {errorMsg && <p className="text-xs text-rose-400 mt-1.5 font-medium">{errorMsg}</p>}
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-3 border-t border-amber-500/25 shrink-0 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="w-full sm:flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-stone-950 font-extrabold rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.45)] border border-yellow-200/60 transition cursor-pointer text-xs sm:text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-stone-950" />
            <span>{submitting ? 'กำลังบันทึกผลประเมิน...' : 'ส่งแบบประเมิน 10 ข้อ & ไปดูแม่น้ำ'}</span>
          </button>

          <button
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto px-4 py-2.5 text-amber-200/60 hover:text-amber-100 text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
          >
            <span>ข้ามขั้นตอนนี้</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showShareModal && myKrathongRecord && (
        <ShareCardModal
          ownerName={myKrathongRecord.owner_name}
          wishMessage={myKrathongRecord.wish_message}
          userType={myKrathongRecord.user_type}
          baseType={myKrathongRecord.base_type}
          flowerType={myKrathongRecord.flower_type}
          candleColor={myKrathongRecord.candle_color}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
