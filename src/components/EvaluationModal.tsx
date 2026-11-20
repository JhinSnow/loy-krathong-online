// src/components/EvaluationModal.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Image as ImageIcon,
  GraduationCap,
  ArrowRight,
  X
} from 'lucide-react';
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
  getLocalKrathongRecords,
  getDeletedEvaluationIds,
  mergeDeletedEvaluationIds
} from '../utils/evaluationHelpers';
import { ShareCardModal } from './ShareCardModal';

interface EvaluationModalProps {
  krathongId: string | null;
  userType: string;
  onFinish: () => void;
  isAdminTestMode?: boolean;
  onClose?: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  krathongId,
  userType: initialUserType,
  onFinish,
  isAdminTestMode = false,
  onClose
}) => {
  const myKrathongRecord = useMemo(() => {
    const records = getLocalKrathongRecords();
    if (krathongId) {
      const found = records.find((r) => r.id === krathongId);
      if (found) return found;
    }
    return isAdminTestMode ? null : records[0] || null;
  }, [krathongId, isAdminTestMode]);

  const [selectedUserType, setSelectedUserType] = useState<string>(initialUserType || 'student');
  const [studentId, setStudentId] = useState<string>(() =>
    isAdminTestMode ? '' : getBoundStudentId() || ''
  );
  const [scores, setScores] = useState<(number | null)[]>(() =>
    Array<number | null>(EVALUATION_QUESTIONS.length).fill(null)
  );
  const [showMissingHighlights, setShowMissingHighlights] = useState<boolean>(false);
  const [focusedMissingIdx, setFocusedMissingIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showSkipEscape, setShowSkipEscape] = useState<boolean>(() =>
    isAdminTestMode ? false : Boolean(getBoundStudentId())
  );

  const studentIdSectionRef = useRef<HTMLDivElement | null>(null);
  const studentIdInputRef = useRef<HTMLInputElement | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const highlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const boundStudentIdOnDevice = useMemo(
    () => (isAdminTestMode ? null : getBoundStudentId()),
    [isAdminTestMode]
  );

  const handleStudentIdChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 13);
    setStudentId(digitsOnly);
    setErrorMsg('');
  };

  const handleScoreChange = (questionIndex: number, scoreValue: number) => {
    const next = [...scores];
    next[questionIndex] = scoreValue;
    setScores(next);
    if (next.every((s) => s !== null)) {
      setShowMissingHighlights(false);
    }
    if (focusedMissingIdx === questionIndex) {
      setFocusedMissingIdx(null);
    }
    setErrorMsg('');
  };

  const handleSetAllScores = (scoreValue: number) => {
    setScores(Array<number | null>(EVALUATION_QUESTIONS.length).fill(scoreValue));
    setShowMissingHighlights(false);
    setFocusedMissingIdx(null);
    setErrorMsg('');
  };

  const answeredScores = scores.filter((s): s is number => s !== null);
  const answeredCount = answeredScores.length;
  const totalQuestions = EVALUATION_QUESTIONS.length;
  const currentAverage =
    answeredCount > 0
      ? (answeredScores.reduce((a, b) => a + b, 0) / answeredCount).toFixed(2)
      : null;

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

    if (isStudent && !/^\d{8,13}$/.test(cleanStudentId)) {
      setErrorMsg('กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (ตัวเลข 8–13 หลัก เช่น 6610110245)');
      studentIdSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      studentIdInputRef.current?.focus();
      return;
    }

    const firstMissingIdx = scores.findIndex((s) => s === null);
    if (firstMissingIdx !== -1) {
      const missingNums = scores.reduce<number[]>(
        (acc, val, i) => (val === null ? [...acc, i + 1] : acc),
        []
      );
      setShowMissingHighlights(true);
      setFocusedMissingIdx(firstMissingIdx);
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = window.setTimeout(() => {
        setFocusedMissingIdx(null);
        highlightTimerRef.current = null;
      }, 2200);
      setErrorMsg(
        `กรุณาเลือกคะแนนประเมินให้ครบทั้ง ${totalQuestions} ข้อ (ยังไม่ได้เลือกข้อที่ ${missingNums.join(', ')})`
      );
      questionRefs.current[firstMissingIdx]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      return;
    }

    if (isStudent) {
      // เช็กการกรอกแทนเพื่อน (1 อุปกรณ์ ต่อ 1 รหัสนักศึกษา — ข้ามเฉพาะโหมดทดสอบของ Admin)
      const boundId = getBoundStudentId();
      if (!isAdminTestMode && boundId && boundId !== cleanStudentId) {
        setShowSkipEscape(true);
        setErrorMsg(
          `อุปกรณ์นี้ได้ใช้ลงทะเบียนรหัสนักศึกษา ${boundId} ไปแล้ว (สงวนสิทธิ์ 1 อุปกรณ์ ต่อ 1 รหัสนักศึกษา เพื่อป้องกันการลงชื่อแทนกัน)`
        );
        return;
      }

      // เช็กรหัสนักศึกษาซ้ำในเครื่อง
      const deletedSetLocal = new Set(getDeletedEvaluationIds());
      const localDuplicate = getLocalEvaluationRecords().some(
        (rec) =>
          rec.user_type === 'student' &&
          !deletedSetLocal.has(rec.id) &&
          (rec.student_id || '').trim() === cleanStudentId
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

      // เช็กรหัสนักศึกษาซ้ำบนฐานข้อมูล Supabase ก่อนบันทึก (ไม่นับรายการที่ผู้ดูแลลบออกไปแล้ว)
      if (isStudent) {
        try {
          let deletedIds = getDeletedEvaluationIds();
          try {
            const modRes = await fetch('/api/admin/moderate');
            if (modRes.ok && (modRes.headers.get('content-type') || '').includes('application/json')) {
              const modData = (await modRes.json()) as { deletedEvalIds?: string[] };
              if (Array.isArray(modData.deletedEvalIds)) {
                deletedIds = mergeDeletedEvaluationIds(modData.deletedEvalIds);
              }
            }
          } catch {}
          const deletedSet = new Set(deletedIds);

          const { data: dupRows } = await supabase
            .from('evaluations')
            .select('id')
            .ilike('feedback', `%"sid":"${cleanStudentId}"%`)
            .limit(20);
          const activeDups = (dupRows || []).filter((r) => r?.id && !deletedSet.has(r.id));
          if (activeDups.length > 0) {
            setShowSkipEscape(true);
            setErrorMsg(`รหัสนักศึกษา ${cleanStudentId} ได้ลงทะเบียนบันทึกชั่วโมงกิจกรรมไปแล้ว`);
            return;
          }
        } catch (dupErr) {
          console.warn('Duplicate SID check note:', dupErr);
        }
      }

      const completedScores = scores.filter((s): s is number => s !== null);
      const avgNumber = Number(
        (completedScores.reduce((a, b) => a + b, 0) / completedScores.length).toFixed(2)
      );
      const roundedOverallRating = Math.min(Math.max(Math.round(avgNumber), 1), 5);
      const encodedPayload = encodeEvaluationPayload(
        completedScores,
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
              feedback: encodedPayload,
              deviceId
            })
          });
          if (apiRes.status === 409) {
            const errBody = (await apiRes.json().catch(() => ({}))) as any;
            setShowSkipEscape(true);
            setErrorMsg(
              errBody.error || `รหัสนักศึกษา ${cleanStudentId} ได้ลงทะเบียนบันทึกชั่วโมงกิจกรรมไปแล้ว`
            );
            return;
          }
        } catch {}
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
        scores: completedScores,
        average_score: avgNumber,
        comment: cleanComment,
        created_at: new Date().toISOString()
      });

      if (isStudent && cleanStudentId && !isAdminTestMode) {
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
    <div className="fixed inset-0 bg-[#1c140d]/75 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto touch-auto animate-ui-fade">
      <div className="bg-[#fdfaf4] border border-amber-900/15 text-[#231912] rounded-3xl p-4 sm:p-6 max-w-2xl w-full relative shadow-2xl my-auto max-h-[94vh] flex flex-col animate-ui-modal">
        {isAdminTestMode && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างทดสอบแบบประเมิน"
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white hover:bg-amber-50 text-[#574536] hover:text-[#231912] border border-amber-900/15 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center pb-3 border-b border-amber-900/12 shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-400/60 text-amber-900 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {isAdminTestMode
                  ? 'โหมดทดสอบแบบประเมิน (ผู้ดูแลระบบ)'
                  : 'ปล่อยกระทงลงสู่สายน้ำสำเร็จแล้ว'}
              </span>
            </div>
            {myKrathongRecord && (
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white hover:bg-amber-50 border border-amber-900/20 text-[#231912] text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>ดาวน์โหลดการ์ดที่ระลึก (E-Card)</span>
              </button>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#231912]">
            แบบประเมินความพึงพอใจโครงการเทศกาลลอยกระทง
          </h3>
          <p className="text-[11px] sm:text-xs text-[#7c5d3a] mt-0.5">
            ข้อมูลของท่านจะถูกนำไปสรุปผลสัมฤทธิ์โครงการและพัฒนาการจัดงานในปีถัดไป
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 py-3 space-y-4 flex-1">
          {/* ส่วนที่ 1: ข้อมูลทั่วไปของผู้ตอบ */}
          <div className="bg-white border border-amber-900/12 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#231912]">
              <UserCheck className="w-4 h-4 text-amber-700" />
              <span>ส่วนที่ 1: ข้อมูลทั่วไปของผู้เข้าร่วมกิจกรรม</span>
            </div>

            {/* ประเภทผู้เข้าร่วม */}
            <div>
              <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                ประเภทผู้เข้าร่วม <span className="text-amber-700">*</span>
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
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                      selectedUserType === t.id
                        ? 'bg-[#241911] border-[#241911] text-[#fffbeb] shadow-sm'
                        : 'bg-[#fdfaf4] border-amber-900/15 text-[#574536] hover:bg-amber-50 hover:border-amber-600/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ช่องกรอกบังคับเฉพาะกลุ่มนักศึกษาเพื่อบันทึก Transcript (เก็บเฉพาะรหัสนักศึกษา) */}
            {selectedUserType === 'student' && (
              <div
                ref={studentIdSectionRef}
                className="pt-2.5 border-t border-amber-900/10 space-y-2 animate-ui-step"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#231912]">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>กรอกรหัสนักศึกษาสำหรับบันทึกชั่วโมงกิจกรรม (Activity Transcript)</span>
                  </p>
                  {boundStudentIdOnDevice && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-400/50 text-amber-900 font-semibold">
                      เครื่องนี้ผูกสิทธิ์รหัส {boundStudentIdOnDevice}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                    รหัสนักศึกษา <span className="text-rose-600">*</span>
                  </label>
                  <input
                    ref={studentIdInputRef}
                    type="text"
                    inputMode="numeric"
                    value={studentId}
                    onChange={(e) => handleStudentIdChange(e.target.value)}
                    placeholder="กรอกรหัสนักศึกษา 8–13 หลัก เช่น 6610110245"
                    maxLength={13}
                    required
                    className="w-full bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 focus:ring-1 focus:ring-amber-600 rounded-xl px-3 py-2 text-base sm:text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none"
                  />
                </div>

                <p className="text-[10px] text-[#7c5d3a]">
                  * ระบบจำแนกคณะและตัดรหัสซ้ำอัตโนมัติ พร้อมสงวนสิทธิ์ 1 อุปกรณ์ ต่อ 1 รหัสนักศึกษา
                </p>
              </div>
            )}
          </div>

          {/* ส่วนที่ 2: หัวข้อประเมินความพึงพอใจ 10 ด้าน */}
          <div className="bg-white border border-amber-900/12 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-900/10">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-bold text-[#231912] flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>ส่วนที่ 2: ประเมินความพึงพอใจ 10 ด้าน (ระดับ 1 - 5)</span>
                  </h4>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      answeredCount === totalQuestions
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : showMissingHighlights
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-amber-50 border-amber-300/70 text-amber-900'
                    }`}
                  >
                    ตอบแล้ว {answeredCount}/{totalQuestions} ข้อ
                  </span>
                </div>
                <p className="text-[10px] text-[#7c5d3a] mt-0.5">
                  เกณฑ์: 5 = มากที่สุด | 4 = มาก | 3 = ปานกลาง | 2 = น้อย | 1 = น้อยที่สุด
                </p>
              </div>

              {/* ปุ่มลัดให้คะแนนทุกข้อพร้อมกัน */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[10px] text-[#7c5d3a]">ตั้งค่าด่วน:</span>
                {[5, 4, 3].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleSetAllScores(lvl)}
                    className="px-2 py-1 rounded-lg bg-[#fffbeb] hover:bg-amber-100 border border-amber-400/50 text-amber-900 text-[10px] font-semibold transition active:scale-95 cursor-pointer"
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
                const isMissingError = showMissingHighlights && currentVal === null;
                const isFocusedMissing = focusedMissingIdx === idx && currentVal === null;
                return (
                  <div
                    key={q.id}
                    ref={(el) => {
                      questionRefs.current[idx] = el;
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isFocusedMissing
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400/80 shadow-md'
                        : isMissingError
                          ? 'bg-rose-50/75 border-rose-400 ring-1 ring-rose-300'
                          : 'bg-[#fdfaf4] border-amber-900/10 hover:border-amber-600/35'
                    }`}
                  >
                    <div className="text-left flex-1 pr-2">
                      <span className="text-[11px] sm:text-xs font-semibold text-[#231912] leading-snug">
                        {q.id}. {q.title}
                      </span>
                      {currentVal !== null ? (
                        <span className="ml-2 inline-block text-[10px] text-amber-800 font-semibold">
                          ({RATING_LABELS[currentVal]})
                        </span>
                      ) : isMissingError ? (
                        <span
                          className={`ml-2 inline-block text-[10px] text-rose-600 font-bold ${
                            isFocusedMissing ? 'animate-pulse' : ''
                          }`}
                        >
                          (กรุณาเลือกคะแนน)
                        </span>
                      ) : (
                        <span className="ml-2 inline-block text-[10px] text-[#9c8671] font-medium">
                          (ยังไม่ได้เลือก)
                        </span>
                      )}
                    </div>

                    {/* ปุ่มเลือกคะแนน 1 - 5 */}
                    <div className="flex items-center justify-end space-x-1 sm:space-x-1.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((scoreNum) => {
                        const isSelected = currentVal === scoreNum;
                        return (
                          <button
                            key={scoreNum}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handleScoreChange(idx, scoreNum)}
                            title={`${scoreNum} - ${RATING_LABELS[scoreNum]}`}
                            className={`w-8 h-8 sm:w-9 sm:h-8 rounded-lg text-xs font-bold border transition-all duration-150 active:scale-90 flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-[#241911] text-[#fffbeb] border-[#241911] shadow-sm scale-105'
                                : 'bg-white text-[#574536] border-amber-900/15 hover:bg-amber-50 hover:border-amber-600/45 hover:text-[#231912]'
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
              <span className="text-[#7c5d3a] font-medium">ค่าเฉลี่ยความพึงพอใจของคุณ (x̄):</span>
              {currentAverage === null ? (
                <span className="font-semibold text-[#9c8671] text-xs sm:text-sm">
                  - / 5.00 (ยังไม่ได้ให้คะแนน)
                </span>
              ) : answeredCount < totalQuestions ? (
                <span className="font-extrabold text-amber-800 text-sm">
                  {currentAverage} / 5.00 (ตอบแล้ว {answeredCount}/{totalQuestions} ข้อ)
                </span>
              ) : (
                <span className="font-extrabold text-amber-800 text-sm">
                  {currentAverage} / 5.00 ({RATING_LABELS[Math.round(Number(currentAverage))]})
                </span>
              )}
            </div>
          </div>

          {/* ส่วนที่ 3: ข้อเสนอแนะเพิ่มเติม */}
          <div className="bg-white border border-amber-900/12 rounded-2xl p-3.5 sm:p-4 text-left shadow-2xs">
            <label className="block text-xs font-bold text-[#231912] mb-1.5">
              ส่วนที่ 3: ข้อเสนอแนะเพิ่มเติมเพื่อการพัฒนา (ถ้ามี)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="ความคิดเห็น ข้อเสนอแนะ หรือความประทับใจจากงานลอยกระทง..."
              maxLength={140}
              rows={2}
              className="w-full bg-[#fffdf9] border border-amber-900/20 rounded-xl p-2.5 text-xs text-[#231912] placeholder-[#9c8671] focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-600 resize-none"
            />
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-3 border-t border-amber-900/12 shrink-0 flex flex-col items-center gap-2">
          {errorMsg && (
            <p className="w-full px-3 py-2 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-700 font-semibold text-center animate-ui-step">
              {errorMsg}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] font-extrabold rounded-xl shadow-md border border-amber-600/25 transition-all duration-150 active:scale-[0.98] cursor-pointer text-xs sm:text-sm disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4 text-[#231912]" />
            <span>
              {submitting
                ? 'กำลังบันทึกผลประเมิน...'
                : isAdminTestMode
                  ? 'ส่งแบบประเมินทดสอบ 10 ข้อ'
                  : 'ส่งแบบประเมิน 10 ข้อ & ลอยกระทงสู่สายน้ำ'}
            </span>
          </button>
          {showSkipEscape && (
            <button
              type="button"
              onClick={onFinish}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#f5eedf] hover:bg-amber-100 text-[#231912] font-semibold rounded-xl border border-amber-900/20 transition-all duration-150 active:scale-[0.98] cursor-pointer text-xs sm:text-sm"
            >
              <span>เคยลงทะเบียนแล้ว — ข้ามไปชมกระทงบนสายน้ำ</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
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
