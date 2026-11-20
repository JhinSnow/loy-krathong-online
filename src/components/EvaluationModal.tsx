// src/components/EvaluationModal.tsx
import React, { useState, useMemo } from 'react';
import { Star, CheckCircle2, Sparkles, UserCheck, Image as ImageIcon } from 'lucide-react';
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
  guessFacultyFromStudentId,
  getOrCreateDeviceToken,
  getBoundStudentId,
  bindStudentIdToDevice,
  encodeEvaluationPayload,
  saveLocalEvaluationRecord,
  getLocalEvaluationRecords,
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
  const myKrathongRecord = useMemo(() => {
    const records = getLocalKrathongRecords();
    if (krathongId) {
      const found = records.find((r) => r.id === krathongId);
      if (found) return found;
    }
    return records[0] || null;
  }, [krathongId]);

  const [selectedUserType, setSelectedUserType] = useState<string>(initialUserType || 'student');
  const [studentId, setStudentId] = useState<string>(() => getBoundStudentId() || '');
  const [scores, setScores] = useState<number[]>(() => Array(10).fill(5));
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showSkipEscape, setShowSkipEscape] = useState<boolean>(() => Boolean(getBoundStudentId()));

  const boundStudentIdOnDevice = useMemo(() => getBoundStudentId(), []);

  const handleStudentIdChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 13);
    setStudentId(digitsOnly);
    setErrorMsg('');
  };

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

  const handleSubmit = async () => {
    setErrorMsg('');
    const safeUserType = VALID_USER_TYPES.includes(selectedUserType as any)
      ? selectedUserType
      : 'general';
    const isStudent = safeUserType === 'student';

    const cleanComment = sanitizeInputText(feedback, 140);
    const cleanStudentId = isStudent ? studentId.replace(/\D/g, '').trim() : '';
    const derivedFaculty = isStudent ? guessFacultyFromStudentId(cleanStudentId) || 'คณะ/หน่วยงานอื่นๆ' : '';

    if (
      (cleanComment && containsProfanity(cleanComment)) ||
      (cleanStudentId && containsProfanity(cleanStudentId))
    ) {
      setErrorMsg('กรุณาใช้ถ้อยคำที่สุภาพในแบบประเมิน');
      return;
    }

    if (isStudent) {
      if (!/^\d{8,13}$/.test(cleanStudentId)) {
        setErrorMsg('กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (ตัวเลข 8–13 หลัก เช่น 6610110245)');
        return;
      }

      // เช็กการกรอกแทนเพื่อน (1 อุปกรณ์ ต่อ 1 รหัสนักศึกษา)
      const boundId = getBoundStudentId();
      if (boundId && boundId !== cleanStudentId) {
        setShowSkipEscape(true);
        setErrorMsg(
          `อุปกรณ์นี้ได้ใช้ลงทะเบียนรหัสนักศึกษา ${boundId} ไปแล้ว (สงวนสิทธิ์ 1 อุปกรณ์ ต่อ 1 รหัสนักศึกษา เพื่อป้องกันการลงชื่อแทนกัน)`
        );
        return;
      }

      // เช็กรหัสนักศึกษาซ้ำในเครื่อง
      const localDuplicate = getLocalEvaluationRecords().some(
        (rec) => rec.user_type === 'student' && (rec.student_id || '').trim() === cleanStudentId
      );
      if (localDuplicate) {
        setShowSkipEscape(true);
        setErrorMsg(`รหัสนักศึกษา ${cleanStudentId} ได้ลงทะเบียนบันทึกชั่วโมงกิจกรรมไปแล้ว`);
        return;
      }
    }

    setSubmitting(true);
    let didSucceed = false;
    try {
      const deviceId = getOrCreateDeviceToken();

      // เช็กรหัสนักศึกษาซ้ำบนฐานข้อมูล Supabase ก่อนบันทึก
      if (isStudent) {
        try {
          const { data: dupRows } = await supabase
            .from('evaluations')
            .select('id')
            .ilike('feedback', `%"sid":"${cleanStudentId}"%`)
            .limit(1);
          if (dupRows && dupRows.length > 0) {
            setShowSkipEscape(true);
            setErrorMsg(`รหัสนักศึกษา ${cleanStudentId} ได้ลงทะเบียนบันทึกชั่วโมงกิจกรรมไปแล้ว`);
            return;
          }
        } catch (dupErr) {
          console.warn('Duplicate SID check note:', dupErr);
        }
      }

      const avgNumber = Number((scores.reduce((a, b) => a + b, 0) / 10).toFixed(2));
      const roundedOverallRating = Math.min(Math.max(Math.round(avgNumber), 1), 5);
      const encodedPayload = encodeEvaluationPayload(
        scores,
        cleanStudentId,
        cleanComment,
        '',
        derivedFaculty,
        deviceId
      );

      let savedToSupabase = false;
      const isValidUUID =
        krathongId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(krathongId);

      // 1. บันทึกเข้า Supabase พร้อม Retry อัตโนมัติสูงสุด 2 ครั้งกรณีเน็ตหนาแน่นในงาน
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
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
            break;
          }
        } catch (supaErr) {
          console.warn(`Supabase evaluation retry ${attempt + 1}:`, supaErr);
        }
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }

      // 2. สำรองยิง API ฟังก์ชันเฉพาะเมื่อไม่ได้บันทึกลง Supabase
      if (!savedToSupabase) {
        try {
          const apiRes = await fetch('/api/evaluations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              krathongId,
              userType: safeUserType,
              rating: roundedOverallRating,
              feedback: encodedPayload
            })
          });
          if (apiRes.status === 409) {
            const errBody = await apiRes.json().catch(() => ({})) as any;
            setShowSkipEscape(true);
            setErrorMsg(
              errBody.error || `รหัสนักศึกษา ${cleanStudentId} ได้ลงทะเบียนบันทึกชั่วโมงกิจกรรมไปแล้ว`
            );
            return;
          }
        } catch (_) {}
      }

      // 3. บันทึกลง Local Storage และผูกสิทธิ์ 1 เครื่อง = 1 รหัสนักศึกษา หลังผ่านการตรวจครบถ้วน
      saveLocalEvaluationRecord({
        id: `eval-${Date.now()}`,
        krathong_id: krathongId,
        user_type: safeUserType,
        student_id: cleanStudentId,
        student_name: '',
        faculty: derivedFaculty,
        device_id: deviceId,
        scores,
        average_score: avgNumber,
        comment: cleanComment,
        created_at: new Date().toISOString()
      });

      if (isStudent && cleanStudentId) {
        bindStudentIdToDevice(cleanStudentId);
      }

      markRateLimitAction('evaluation_submit');
      didSucceed = true;

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
      if (didSucceed) {
        onFinish();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f0a06]/90 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#281b10] to-[#160f09] border border-amber-400/35 rounded-3xl p-4 sm:p-6 max-w-2xl w-full relative shadow-2xl my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="text-center pb-3 border-b border-amber-500/20 shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ปล่อยกระทงลงสู่สายน้ำสำเร็จแล้ว!</span>
            </div>
            {myKrathongRecord && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-100 text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>📸 ดาวน์โหลดการ์ดที่ระลึก (E-Card)</span>
              </button>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-amber-100">
            แบบประเมินความพึงพอใจโครงการเทศกาลลอยกระทง
          </h3>
          <p className="text-[11px] sm:text-xs text-amber-100/75 mt-0.5">
            ข้อมูลของท่านจะถูกนำไปสรุปผลสัมฤทธิ์โครงการและพัฒนาการจัดงานในปีถัดไป
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 py-3 space-y-4 flex-1">
          {/* ส่วนที่ 1: ข้อมูลทั่วไปของผู้ตอบ */}
          <div className="bg-[#17100a]/85 border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-200">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>ส่วนที่ 1: ข้อมูลทั่วไปของผู้เข้าร่วมกิจกรรม</span>
            </div>

            {/* ประเภทผู้เข้าร่วม */}
            <div>
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
                    onClick={() => {
                      setSelectedUserType(t.id);
                      setErrorMsg('');
                    }}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                      selectedUserType === t.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-sm'
                        : 'bg-[#1f150d]/90 border-amber-500/25 text-amber-100/75 hover:border-amber-400/50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ช่องกรอกบังคับเฉพาะกลุ่มนักศึกษาเพื่อบันทึก Transcript (เก็บเฉพาะรหัสนักศึกษา) */}
            {selectedUserType === 'student' && (
              <div className="pt-2 border-t border-amber-500/20 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-[11px] font-semibold text-amber-300">
                    🎓 กรอกรหัสนักศึกษาสำหรับบันทึกชั่วโมงกิจกรรม (Activity Transcript)
                  </p>
                  {boundStudentIdOnDevice && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200">
                      เครื่องนี้ผูกสิทธิ์รหัส {boundStudentIdOnDevice}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-amber-100/85 mb-1">
                    รหัสนักศึกษา <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={studentId}
                    onChange={(e) => handleStudentIdChange(e.target.value)}
                    placeholder="กรอกรหัสนักศึกษา 8–13 หลัก เช่น 6610110245"
                    maxLength={13}
                    required
                    className="w-full bg-[#140e09] border border-amber-500/35 focus:border-amber-400 rounded-xl px-3 py-2 text-base sm:text-sm text-amber-50 placeholder-amber-200/40 focus:outline-none"
                  />
                </div>

                <p className="text-[10px] text-amber-100/65">
                  * ระบบจำแนกคณะและตัดรหัสซ้ำอัตโนมัติ พร้อมสงวนสิทธิ์ 1 อุปกรณ์ ต่อ 1 รหัสนักศึกษา
                </p>
              </div>
            )}
          </div>

          {/* ส่วนที่ 2: หัวข้อประเมินความพึงพอใจ 10 ด้าน */}
          <div className="bg-[#17100a]/85 border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
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
                    className="p-2.5 sm:p-3 rounded-xl bg-[#1f150d]/85 border border-amber-500/20 hover:border-amber-400/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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
                                ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-sm scale-105'
                                : 'bg-[#140e09] text-amber-200/65 border-amber-500/25 hover:border-amber-400/55 hover:text-amber-200'
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
              <span className="text-amber-200/70">ค่าเฉลี่ยความพึงพอใจของคุณ (x̄):</span>
              <span className="font-extrabold text-amber-300 text-sm">
                {currentAverage} / 5.00 ({RATING_LABELS[Math.round(Number(currentAverage))]})
              </span>
            </div>
          </div>

          {/* ส่วนที่ 3: ข้อเสนอแนะเพิ่มเติม */}
          <div className="bg-[#17100a]/85 border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 text-left">
            <label className="block text-xs font-bold text-amber-200 mb-1.5">
              ส่วนที่ 3: ข้อเสนอแนะเพิ่มเติมเพื่อการพัฒนา (ถ้ามี)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="ความคิดเห็น ข้อเสนอแนะ หรือความประทับใจจากงานลอยกระทง..."
              maxLength={140}
              rows={2}
              className="w-full bg-[#140e09] border border-amber-500/35 rounded-xl p-2.5 text-xs text-amber-50 placeholder-amber-200/40 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-3 border-t border-amber-500/25 shrink-0 flex flex-col items-center gap-2">
          {errorMsg && (
            <p className="w-full px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-semibold text-center">
              {errorMsg}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-md border border-amber-300/60 transition cursor-pointer text-xs sm:text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-stone-950" />
            <span>{submitting ? 'กำลังบันทึกผลประเมิน & ปล่อยกระทง...' : 'ส่งแบบประเมิน 10 ข้อ & ลอยกระทงสู่สายน้ำ'}</span>
          </button>
          {showSkipEscape && (
            <button
              type="button"
              onClick={onFinish}
              className="w-full py-2.5 bg-[#2a1d11] hover:bg-[#3a2818] text-amber-200 font-semibold rounded-xl border border-amber-400/40 transition cursor-pointer text-xs sm:text-sm"
            >
              เคยลงทะเบียนแล้ว — ข้ามไปชมกระทงบนสายน้ำ →
            </button>
          )}
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
