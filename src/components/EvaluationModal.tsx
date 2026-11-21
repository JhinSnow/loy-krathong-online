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
  ArrowLeft,
  ShieldCheck,
  Leaf,
  Award,
  Users,
  X,
  Check
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
  PDPA_CONSENT_PARAGRAPHS,
  PDPA_CONSENT_CHECK_LABEL,
  STUDENT_YEAR_OPTIONS,
  COMMUNITY_ROLE_OPTIONS,
  EVALUATION_DIMENSIONS,
  EVALUATION_QUESTIONS,
  COMMUNITY_EVALUATION_QUESTIONS,
  SDG_EVALUATION_ITEMS,
  RATING_LABELS,
  formatYearLevel,
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

type WizardStep = 1 | 2 | 3 | 4;

const STEP_LABELS: readonly { step: WizardStep; shortTitle: string }[] = [
  { step: 1, shortTitle: '1. ข้อมูลผู้ตอบ' },
  { step: 2, shortTitle: '2. คุณภาพ/วัตถุประสงค์' },
  { step: 3, shortTitle: '3. ประเภทงาน/5Hs' },
  { step: 4, shortTitle: '4. SDGs & ข้อเสนอแนะ' }
];

const STEP2_DIMENSION_IDS = new Set(['quality', 'management', 'learning', 'project_kpi']);
const STEP3_DIMENSION_IDS = new Set([
  'type_volunteer',
  'type_culture',
  'type_ethics',
  'psu_5hs',
  'community_impact'
]);

const indexedQuestions = EVALUATION_QUESTIONS.map((q, idx) => ({ q, idx }));
const STEP2_GROUPS = EVALUATION_DIMENSIONS.filter((d) => STEP2_DIMENSION_IDS.has(d.id)).map(
  (dim) => ({
    dimension: dim,
    items: indexedQuestions.filter((item) => item.q.dimensionId === dim.id)
  })
);
const STEP3_GROUPS = EVALUATION_DIMENSIONS.filter((d) => STEP3_DIMENSION_IDS.has(d.id)).map(
  (dim) => ({
    dimension: dim,
    items: indexedQuestions.filter((item) => item.q.dimensionId === dim.id)
  })
);

interface LikertQuestionRowProps {
  qId: number;
  title: string;
  subGroupLabel?: string;
  currentVal: number | null;
  onSelect: (val: number) => void;
  focusKey: string;
  showValidation: boolean;
  focusedMissingKey: string | null;
}

const LikertQuestionRow = React.forwardRef<HTMLDivElement, LikertQuestionRowProps>(
  (
    {
      qId,
      title,
      subGroupLabel,
      currentVal,
      onSelect,
      focusKey,
      showValidation,
      focusedMissingKey
    },
    ref
  ) => {
    const isMissingError = showValidation && currentVal === null;
    const isFocusedMissing = focusedMissingKey === focusKey && currentVal === null;

    return (
      <div
        ref={ref}
        className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isFocusedMissing
            ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400/80 shadow-md'
            : isMissingError
              ? 'bg-rose-50/75 border-rose-400 ring-1 ring-rose-300'
              : 'bg-[#fdfaf4] border-amber-900/10 hover:border-amber-600/35'
        }`}
      >
        <div className="text-left flex-1 pr-1">
          {subGroupLabel && (
            <span className="inline-block mb-0.5 mr-1.5 px-1.5 py-0.5 rounded bg-amber-100/80 border border-amber-300/60 text-[9px] font-bold text-amber-900">
              {subGroupLabel}
            </span>
          )}
          <span className="text-[11px] sm:text-xs font-semibold text-[#231912] leading-snug">
            {qId}. {title}
          </span>
          {currentVal !== null ? (
            <span className="ml-1.5 inline-block text-[10px] text-amber-800 font-semibold">
              ({RATING_LABELS[currentVal]})
            </span>
          ) : isMissingError ? (
            <span
              className={`ml-1.5 inline-block text-[10px] text-rose-600 font-bold ${
                isFocusedMissing ? 'animate-pulse' : ''
              }`}
            >
              (กรุณาเลือกคะแนน)
            </span>
          ) : (
            <span className="ml-1.5 inline-block text-[10px] text-[#9c8671] font-medium">
              (ยังไม่ได้เลือก)
            </span>
          )}
        </div>

        <div className="flex items-center justify-end space-x-1 sm:space-x-1.5 shrink-0">
          {[1, 2, 3, 4, 5].map((scoreNum) => {
            const isSelected = currentVal === scoreNum;
            return (
              <button
                key={scoreNum}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(scoreNum)}
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
  }
);
LikertQuestionRow.displayName = 'LikertQuestionRow';

function createEvalTimestampMeta(): { id: string; created_at: string } {
  return {
    id: `eval-${Date.now()}`,
    created_at: new Date().toISOString()
  };
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

  const normalizedInitialType = useMemo(() => {
    if (initialUserType === 'student' || initialUserType === 'staff' || initialUserType === 'general') {
      return initialUserType;
    }
    return 'student';
  }, [initialUserType]);

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1: PDPA & Demographics (ทุกช่องเริ่มต้นว่าง ไม่มีค่าที่ถูกเลือกไว้ล่วงหน้า)
  const [pdpaAccepted, setPdpaAccepted] = useState<boolean>(false);
  const [selectedUserType, setSelectedUserType] = useState<'student' | 'staff' | 'general'>(
    normalizedInitialType
  );
  const [studentId, setStudentId] = useState<string>(() =>
    isAdminTestMode ? '' : getBoundStudentId() || ''
  );
  const [major, setMajor] = useState<string>('');
  const [yearCode, setYearCode] = useState<string>('');
  const [staffDept, setStaffDept] = useState<string>('');
  const [staffRole, setStaffRole] = useState<string>('');
  const [communityRole, setCommunityRole] = useState<string>('');
  const [communityRoleOther, setCommunityRoleOther] = useState<string>('');

  // Steps 2 & 3: Likert 1-5 Ratings (เริ่มต้น null ทุกข้อ)
  const [scores, setScores] = useState<(number | null)[]>(() =>
    Array<number | null>(EVALUATION_QUESTIONS.length).fill(null)
  );
  const [communityScores, setCommunityScores] = useState<(number | null)[]>(() =>
    Array<number | null>(COMMUNITY_EVALUATION_QUESTIONS.length).fill(null)
  );

  // Step 4: 7 SDGs & Open Feedback 3 ช่อง (เริ่มต้น null / ว่างทั้งหมด)
  const [sdgAnswers, setSdgAnswers] = useState<(boolean | null)[]>(() =>
    Array<boolean | null>(SDG_EVALUATION_ITEMS.length).fill(null)
  );
  const [feedbackImpressed, setFeedbackImpressed] = useState<string>('');
  const [feedbackImprove, setFeedbackImprove] = useState<string>('');
  const [feedbackOther, setFeedbackOther] = useState<string>('');

  // Validation, Navigation & Submission State
  const [stepValidatedFlags, setStepValidatedFlags] = useState<Record<WizardStep, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false
  });
  const [focusedMissingKey, setFocusedMissingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showSkipEscape, setShowSkipEscape] = useState<boolean>(() =>
    isAdminTestMode ? false : Boolean(getBoundStudentId())
  );

  // Refs for auto-scroll to first missing/invalid field
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const pdpaRef = useRef<HTMLDivElement | null>(null);
  const studentIdSectionRef = useRef<HTMLDivElement | null>(null);
  const studentIdInputRef = useRef<HTMLInputElement | null>(null);
  const majorSectionRef = useRef<HTMLDivElement | null>(null);
  const majorInputRef = useRef<HTMLInputElement | null>(null);
  const yearSectionRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const communityRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sdgRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  const markMissingFocus = (
    step: WizardStep,
    focusKey: string,
    targetEl: HTMLElement | null,
    inputToFocus?: HTMLInputElement | null
  ) => {
    setStepValidatedFlags((prev) => ({ ...prev, [step]: true }));
    setFocusedMissingKey(focusKey);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setFocusedMissingKey(null);
      highlightTimerRef.current = null;
    }, 2200);
    targetEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (inputToFocus) {
      window.setTimeout(() => inputToFocus.focus(), 250);
    }
  };

  const scrollStepTop = () => {
    window.requestAnimationFrame(() => {
      scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleStudentIdChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 13);
    setStudentId(digitsOnly);
    if (focusedMissingKey === 'student_id') setFocusedMissingKey(null);
    setErrorMsg('');
  };

  const handleScoreChange = (questionIndex: number, scoreValue: number) => {
    const next = [...scores];
    next[questionIndex] = scoreValue;
    setScores(next);
    if (focusedMissingKey === `q-${questionIndex}`) {
      setFocusedMissingKey(null);
    }
    if (currentStep === 2 && STEP2_GROUPS.every((g) => g.items.every((it) => next[it.idx] !== null))) {
      setStepValidatedFlags((prev) => ({ ...prev, 2: false }));
    }
    if (
      currentStep === 3 &&
      STEP3_GROUPS.every((g) => g.items.every((it) => next[it.idx] !== null)) &&
      (selectedUserType !== 'general' || communityScores.every((c) => c !== null))
    ) {
      setStepValidatedFlags((prev) => ({ ...prev, 3: false }));
    }
    setErrorMsg('');
  };

  const handleCommunityScoreChange = (commIndex: number, scoreValue: number) => {
    const next = [...communityScores];
    next[commIndex] = scoreValue;
    setCommunityScores(next);
    if (focusedMissingKey === `comm-${commIndex}`) {
      setFocusedMissingKey(null);
    }
    if (
      STEP3_GROUPS.every((g) => g.items.every((it) => scores[it.idx] !== null)) &&
      next.every((c) => c !== null)
    ) {
      setStepValidatedFlags((prev) => ({ ...prev, 3: false }));
    }
    setErrorMsg('');
  };

  const handleSdgChange = (sdgIndex: number, compliant: boolean) => {
    const next = [...sdgAnswers];
    next[sdgIndex] = compliant;
    setSdgAnswers(next);
    if (focusedMissingKey === `sdg-${sdgIndex}`) {
      setFocusedMissingKey(null);
    }
    if (next.every((val) => val !== null)) {
      setStepValidatedFlags((prev) => ({ ...prev, 4: false }));
    }
    setErrorMsg('');
  };

  // ปุ่มช่วยกรอกเร็วเฉพาะโหมดทดสอบของ Admin เท่านั้น
  const handleAdminQuickFillStep = (scoreValue: number) => {
    if (!isAdminTestMode) return;
    if (currentStep === 2) {
      const next = [...scores];
      STEP2_GROUPS.forEach((g) =>
        g.items.forEach(({ idx }) => {
          next[idx] = scoreValue;
        })
      );
      setScores(next);
      setStepValidatedFlags((prev) => ({ ...prev, 2: false }));
      setErrorMsg('');
    } else if (currentStep === 3) {
      const next = [...scores];
      STEP3_GROUPS.forEach((g) =>
        g.items.forEach(({ idx }) => {
          next[idx] = scoreValue;
        })
      );
      setScores(next);
      if (selectedUserType === 'general') {
        setCommunityScores(Array<number | null>(COMMUNITY_EVALUATION_QUESTIONS.length).fill(scoreValue));
      }
      setStepValidatedFlags((prev) => ({ ...prev, 3: false }));
      setErrorMsg('');
    }
  };

  const handleAdminQuickFillSdgs = (compliant: boolean) => {
    if (!isAdminTestMode) return;
    setSdgAnswers(Array<boolean | null>(SDG_EVALUATION_ITEMS.length).fill(compliant));
    setStepValidatedFlags((prev) => ({ ...prev, 4: false }));
    setErrorMsg('');
  };

  // นับความคืบหน้าแต่ละ Step
  const step2Indices = useMemo(
    () => STEP2_GROUPS.flatMap((g) => g.items.map((it) => it.idx)),
    []
  );
  const step3Indices = useMemo(
    () => STEP3_GROUPS.flatMap((g) => g.items.map((it) => it.idx)),
    []
  );

  const step2Answered = step2Indices.filter((idx) => scores[idx] !== null).length;
  const step2Total = step2Indices.length;

  const step3CoreAnswered = step3Indices.filter((idx) => scores[idx] !== null).length;
  const step3CommAnswered =
    selectedUserType === 'general' ? communityScores.filter((v) => v !== null).length : 0;
  const step3Total =
    step3Indices.length + (selectedUserType === 'general' ? COMMUNITY_EVALUATION_QUESTIONS.length : 0);
  const step3Answered = step3CoreAnswered + step3CommAnswered;

  const step4Answered = sdgAnswers.filter((v) => v !== null).length;
  const step4Total = SDG_EVALUATION_ITEMS.length;

  const totalRateable = step2Total + step3Total + step4Total;
  const totalRatedNow = step2Answered + step3Answered + step4Answered;

  const answeredCoreScores = scores.filter((s): s is number => s !== null);
  const currentCoreAverage =
    answeredCoreScores.length > 0
      ? (answeredCoreScores.reduce((a, b) => a + b, 0) / answeredCoreScores.length).toFixed(2)
      : null;

  // ตรวจสอบความถูกต้องทีละ Step พร้อมเด้งเลื่อนไปจุดที่ขาด
  const validateStep1 = (scrollIfError = true): boolean => {
    if (!pdpaAccepted) {
      setErrorMsg('กรุณากดยอมรับคำชี้แจงและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อนดำเนินการต่อ');
      if (scrollIfError) markMissingFocus(1, 'pdpa', pdpaRef.current);
      return false;
    }

    const cleanMajor = sanitizeInputText(major, 60);
    const cleanStaffDept = sanitizeInputText(staffDept, 60);
    const cleanStaffRole = sanitizeInputText(staffRole, 50);
    const cleanCommOther = sanitizeInputText(communityRoleOther, 50);

    if (
      (cleanMajor && containsProfanity(cleanMajor)) ||
      (cleanStaffDept && containsProfanity(cleanStaffDept)) ||
      (cleanStaffRole && containsProfanity(cleanStaffRole)) ||
      (cleanCommOther && containsProfanity(cleanCommOther))
    ) {
      setErrorMsg('กรุณาใช้ถ้อยคำที่สุภาพในข้อมูลผู้ตอบแบบประเมิน');
      return false;
    }

    if (selectedUserType === 'student') {
      const cleanSid = studentId.replace(/\D/g, '').trim();
      if (!/^\d{8,13}$/.test(cleanSid)) {
        setErrorMsg('กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (ตัวเลข 8–13 หลัก เช่น 6610210245)');
        if (scrollIfError) {
          markMissingFocus(1, 'student_id', studentIdSectionRef.current, studentIdInputRef.current);
        }
        return false;
      }

      const boundId = getBoundStudentId();
      if (!isAdminTestMode && boundId && boundId !== cleanSid) {
        setShowSkipEscape(true);
        setErrorMsg(
          `อุปกรณ์นี้ได้ใช้ลงทะเบียนรหัสนักศึกษา ${boundId} ไปแล้ว (สงวนสิทธิ์ 1 อุปกรณ์ ต่อ 1 รหัสนักศึกษา)`
        );
        if (scrollIfError) markMissingFocus(1, 'student_id', studentIdSectionRef.current);
        return false;
      }

      if (!isAdminTestMode) {
        const deletedSetLocal = new Set(getDeletedEvaluationIds());
        const localDuplicate = getLocalEvaluationRecords().some(
          (rec) =>
            rec.user_type === 'student' &&
            !deletedSetLocal.has(rec.id) &&
            (rec.student_id || '').trim() === cleanSid
        );
        if (localDuplicate) {
          setShowSkipEscape(true);
          setErrorMsg(`รหัสนักศึกษา ${cleanSid} ได้ลงทะเบียนบันทึกชั่วโมงกิจกรรมไปแล้ว`);
          if (scrollIfError) markMissingFocus(1, 'student_id', studentIdSectionRef.current);
          return false;
        }
      }

      if (!cleanMajor) {
        setErrorMsg('กรุณากรอกสาขาวิชาของท่าน');
        if (scrollIfError) {
          markMissingFocus(1, 'major', majorSectionRef.current, majorInputRef.current);
        }
        return false;
      }

      if (!yearCode) {
        setErrorMsg('กรุณาเลือกชั้นปีของท่าน');
        if (scrollIfError) markMissingFocus(1, 'year', yearSectionRef.current);
        return false;
      }
    }

    return true;
  };

  const validateStep2 = (scrollIfError = true): boolean => {
    const missingIdx = step2Indices.find((idx) => scores[idx] === null);
    if (missingIdx !== undefined) {
      const missingNums = step2Indices.filter((idx) => scores[idx] === null).map((idx) => idx + 1);
      setErrorMsg(
        `กรุณาเลือกคะแนนให้ครบทั้ง ${step2Total} ข้อในหน้านี้ (ยังไม่ได้เลือกข้อที่ ${missingNums.join(', ')})`
      );
      if (scrollIfError) {
        markMissingFocus(2, `q-${missingIdx}`, questionRefs.current[missingIdx]);
      }
      return false;
    }
    return true;
  };

  const validateStep3 = (scrollIfError = true): boolean => {
    const missingCoreIdx = step3Indices.find((idx) => scores[idx] === null);
    if (missingCoreIdx !== undefined) {
      const missingNums = step3Indices.filter((idx) => scores[idx] === null).map((idx) => idx + 1);
      setErrorMsg(
        `กรุณาเลือกคะแนนให้ครบทุกข้อในหน้านี้ (ยังไม่ได้เลือกข้อที่ ${missingNums.join(', ')})`
      );
      if (scrollIfError) {
        markMissingFocus(3, `q-${missingCoreIdx}`, questionRefs.current[missingCoreIdx]);
      }
      return false;
    }

    if (selectedUserType === 'general') {
      const missingCommIdx = communityScores.findIndex((val) => val === null);
      if (missingCommIdx !== -1) {
        const missingCommNums = communityScores.reduce<number[]>(
          (acc, val, i) => (val === null ? [...acc, i + 1] : acc),
          []
        );
        setErrorMsg(
          `กรุณาเลือกคะแนนหมวด "สำหรับผู้ปกครอง / ชุมชน" ให้ครบทั้ง 4 ข้อ (ยังไม่ได้เลือกข้อที่ ${missingCommNums.join(', ')})`
        );
        if (scrollIfError) {
          markMissingFocus(3, `comm-${missingCommIdx}`, communityRefs.current[missingCommIdx]);
        }
        return false;
      }
    }

    return true;
  };

  const validateStep4 = (scrollIfError = true): boolean => {
    const missingSdgIdx = sdgAnswers.findIndex((val) => val === null);
    if (missingSdgIdx !== -1) {
      const missingCodes = sdgAnswers.reduce<string[]>(
        (acc, val, i) => (val === null ? [...acc, `SDG ${SDG_EVALUATION_ITEMS[i].code}`] : acc),
        []
      );
      setErrorMsg(
        `กรุณาประเมินความสอดคล้อง SDGs ให้ครบทั้ง 7 เป้าหมาย (ยังไม่ได้เลือก ${missingCodes.join(', ')})`
      );
      if (scrollIfError) {
        markMissingFocus(4, `sdg-${missingSdgIdx}`, sdgRefs.current[missingSdgIdx]);
      }
      return false;
    }

    const c1 = sanitizeInputText(feedbackImpressed, 150);
    const c2 = sanitizeInputText(feedbackImprove, 150);
    const c3 = sanitizeInputText(feedbackOther, 100);
    if (
      (c1 && containsProfanity(c1)) ||
      (c2 && containsProfanity(c2)) ||
      (c3 && containsProfanity(c3))
    ) {
      setErrorMsg('กรุณาใช้ถ้อยคำที่สุภาพในข้อเสนอแนะ');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!validateStep1(true)) return;
      setCurrentStep(2);
      scrollStepTop();
    } else if (currentStep === 2) {
      if (!validateStep2(true)) return;
      setCurrentStep(3);
      scrollStepTop();
    } else if (currentStep === 3) {
      if (!validateStep3(true)) return;
      setCurrentStep(4);
      scrollStepTop();
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
      scrollStepTop();
    }
  };

  const handleStepHeaderClick = (targetStep: WizardStep) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setErrorMsg('');
      setCurrentStep(targetStep);
      scrollStepTop();
      return;
    }
    if (targetStep === currentStep + 1) {
      handleNextStep();
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    // ตรวจสอบความครบถ้วนของทุกขั้นตอนอีกครั้งก่อนส่ง
    if (!validateStep1(currentStep === 1)) {
      if (currentStep !== 1) {
        setCurrentStep(1);
        window.setTimeout(() => validateStep1(true), 120);
      }
      return;
    }
    if (!validateStep2(currentStep === 2)) {
      if (currentStep !== 2) {
        setCurrentStep(2);
        window.setTimeout(() => validateStep2(true), 120);
      }
      return;
    }
    if (!validateStep3(currentStep === 3)) {
      if (currentStep !== 3) {
        setCurrentStep(3);
        window.setTimeout(() => validateStep3(true), 120);
      }
      return;
    }
    if (!validateStep4(true)) return;

    const safeUserType = VALID_USER_TYPES.includes(selectedUserType as any)
      ? selectedUserType
      : 'general';
    const isStudent = safeUserType === 'student';

    const cleanStudentId = isStudent ? studentId.replace(/\D/g, '').trim() : '';
    const derivedFaculty = isStudent
      ? guessFacultyFromStudentId(cleanStudentId) || 'คณะ/หน่วยงานอื่นๆ'
      : '';
    const cleanMajor =
      isStudent
        ? sanitizeInputText(major, 60)
        : safeUserType === 'staff'
          ? sanitizeInputText(staffDept, 60)
          : '';
    const cleanRole =
      safeUserType === 'staff'
        ? sanitizeInputText(staffRole, 50)
        : safeUserType === 'general'
          ? sanitizeInputText(
              communityRole === 'อื่นๆ' ? communityRoleOther || 'อื่นๆ' : communityRole,
              50
            )
          : '';

    const cleanImpressed = sanitizeInputText(feedbackImpressed, 150);
    const cleanImprove = sanitizeInputText(feedbackImprove, 150);
    const cleanOther = sanitizeInputText(feedbackOther, 100);

    const completedScores = scores.map((s) => s ?? 5);
    const completedCommunityScores =
      safeUserType === 'general' ? communityScores.map((s) => s ?? 5) : undefined;
    const completedSdgResults = sdgAnswers.map((v) => Boolean(v));

    setSubmitting(true);
    let didSucceed = false;
    try {
      const deviceId = getOrCreateDeviceToken();

      // เช็กรหัสนักศึกษาซ้ำบนฐานข้อมูล Supabase ก่อนบันทึก
      if (isStudent && !isAdminTestMode) {
        try {
          let deletedIds = getDeletedEvaluationIds();
          try {
            const modRes = await fetch('/api/admin/moderate');
            if (
              modRes.ok &&
              (modRes.headers.get('content-type') || '').includes('application/json')
            ) {
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

      const avgNumber = Number(
        (completedScores.reduce((a, b) => a + b, 0) / completedScores.length).toFixed(2)
      );
      const roundedOverallRating = Math.min(Math.max(Math.round(avgNumber), 1), 5);

      const encodedPayload = encodeEvaluationPayload({
        pdpaAccepted: true,
        scores: completedScores,
        communityScores: completedCommunityScores,
        sdgResults: completedSdgResults,
        studentId: cleanStudentId,
        faculty: derivedFaculty,
        major: cleanMajor,
        yearCode: isStudent ? yearCode : '',
        role: cleanRole,
        deviceId,
        feedbackImpressed: cleanImpressed,
        feedbackImprove: cleanImprove,
        feedbackOther: cleanOther
      });

      let savedToSupabase = false;
      const isValidUUID =
        krathongId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(krathongId);

      // 1. บันทึกเข้า Supabase พร้อม Retry 2 ครั้ง
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

      // 2. สำรองยิง Cloudflare API เฉพาะเมื่อไม่ได้บันทึกลง Supabase
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
              errBody.error ||
                `รหัสนักศึกษา ${cleanStudentId} ได้ลงทะเบียนบันทึกชั่วโมงกิจกรรมไปแล้ว`
            );
            return;
          }
        } catch {}
      }

      const commentParts: string[] = [];
      if (cleanImpressed) commentParts.push(`ประทับใจ: ${cleanImpressed}`);
      if (cleanImprove) commentParts.push(`ควรปรับปรุง: ${cleanImprove}`);
      if (cleanOther) commentParts.push(`อื่นๆ: ${cleanOther}`);

      // 3. บันทึกลง Local Storage และผูกสิทธิ์ 1 เครื่อง = 1 รหัส
      const { id: localEvalId, created_at: localCreatedAt } = createEvalTimestampMeta();
      saveLocalEvaluationRecord({
        id: localEvalId,
        krathong_id: krathongId,
        schemaVersion: 3,
        pdpaAccepted: true,
        user_type: safeUserType,
        student_id: cleanStudentId,
        student_name: '',
        faculty: derivedFaculty,
        major: cleanMajor,
        year_level: isStudent ? formatYearLevel(yearCode) : '',
        role: cleanRole,
        device_id: deviceId,
        scores: completedScores,
        community_scores: completedCommunityScores || [],
        sdg_results: completedSdgResults,
        average_score: avgNumber,
        feedback_impressed: cleanImpressed,
        feedback_improve: cleanImprove,
        feedback_other: cleanOther,
        comment: commentParts.join(' | '),
        created_at: localCreatedAt
      });

      if (isStudent && cleanStudentId && !isAdminTestMode) {
        bindStudentIdToDevice(cleanStudentId);
      }

      markRateLimitAction('evaluation_submit');
      didSucceed = true;

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
          <div className="flex flex-wrap items-center justify-center gap-2 mb-1.5">
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
          <h3 className="text-base sm:text-lg font-extrabold text-[#231912]">
            แบบประเมินผลการดำเนินการโครงการลอยกระทงบุฟเฟต์
          </h3>
          <p className="text-[11px] text-[#7c5d3a] mt-0.5">
            สโมสรนักศึกษาคณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์ • 24 พฤศจิกายน 2569
          </p>

          {/* 4-Step Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {STEP_LABELS.map((item) => {
              const isActive = currentStep === item.step;
              const isDone = item.step < currentStep;
              const canClick = item.step < currentStep || item.step === currentStep + 1;
              return (
                <button
                  key={item.step}
                  type="button"
                  disabled={!canClick && !isActive}
                  onClick={() => handleStepHeaderClick(item.step)}
                  className={`px-1.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    isActive
                      ? 'bg-[#241911] border-[#241911] text-[#fffbeb] shadow-sm'
                      : isDone
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                        : canClick
                          ? 'bg-white border-amber-900/15 text-[#574536] hover:bg-amber-50 cursor-pointer'
                          : 'bg-[#f6efdf]/70 border-amber-900/10 text-[#9c8671] cursor-default'
                  }`}
                >
                  {isDone && <Check className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{item.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div ref={scrollBodyRef} className="overflow-y-auto pr-1 py-3 space-y-3.5 flex-1">
          {/* ================= STEP 1: PDPA & ข้อมูลผู้ตอบ ================= */}
          {currentStep === 1 && (
            <>
              {/* PDPA Card */}
              <div
                ref={pdpaRef}
                className={`rounded-2xl p-3.5 sm:p-4 border transition-all space-y-2.5 shadow-2xs ${
                  focusedMissingKey === 'pdpa'
                    ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400/80'
                    : stepValidatedFlags[1] && !pdpaAccepted
                      ? 'bg-rose-50/75 border-rose-400 ring-1 ring-rose-300'
                      : 'bg-white border-amber-900/12'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#231912] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>คำชี้แจงและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) *</span>
                  </h4>
                  {!pdpaAccepted && stepValidatedFlags[1] && (
                    <span className="text-[10px] font-bold text-rose-600">กรุณายอมรับ</span>
                  )}
                </div>
                <div className="space-y-1.5 text-[11px] text-[#574536] leading-relaxed bg-[#fdfaf4] p-2.5 rounded-xl border border-amber-900/10">
                  {PDPA_CONSENT_PARAGRAPHS.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#fffbeb] border border-amber-400/50 cursor-pointer hover:bg-amber-100/60 transition">
                  <input
                    type="checkbox"
                    checked={pdpaAccepted}
                    onChange={(e) => {
                      setPdpaAccepted(e.target.checked);
                      if (e.target.checked && focusedMissingKey === 'pdpa') {
                        setFocusedMissingKey(null);
                      }
                      setErrorMsg('');
                    }}
                    className="mt-0.5 w-4 h-4 accent-[#241911] rounded cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs font-semibold text-[#231912] leading-snug">
                    {PDPA_CONSENT_CHECK_LABEL} <span className="text-rose-600">*</span>
                  </span>
                </label>
              </div>

              {/* สถานะผู้ตอบและข้อมูลเบื้องต้น */}
              <div className="bg-white border border-amber-900/12 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-[#231912]">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <span>ข้อมูลเบื้องต้นของผู้ตอบแบบสอบถาม</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#574536] mb-1.5">
                    สถานะของผู้เข้าร่วมโครงการ <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'student' as const, label: 'นักศึกษา' },
                      { id: 'staff' as const, label: 'อาจารย์/บุคลากร' },
                      { id: 'general' as const, label: 'บุคคลทั่วไป/ชุมชน' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserType(t.id);
                          setFocusedMissingKey(null);
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

                {/* สาขาข้อมูล: นักศึกษา */}
                {selectedUserType === 'student' && (
                  <div className="pt-2.5 border-t border-amber-900/10 space-y-3 animate-ui-step">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#231912]">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>ข้อมูลนักศึกษาสำหรับบันทึก Activity Transcript</span>
                      </p>
                      {boundStudentIdOnDevice && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-400/50 text-amber-900 font-semibold">
                          เครื่องนี้ผูกสิทธิ์รหัส {boundStudentIdOnDevice}
                        </span>
                      )}
                    </div>

                    <div
                      ref={studentIdSectionRef}
                      className={`rounded-xl p-2 transition-all ${
                        focusedMissingKey === 'student_id'
                          ? 'bg-rose-50 ring-2 ring-rose-400'
                          : ''
                      }`}
                    >
                      <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                        รหัสนักศึกษา <span className="text-rose-600">*</span>
                      </label>
                      <input
                        ref={studentIdInputRef}
                        type="text"
                        inputMode="numeric"
                        value={studentId}
                        onChange={(e) => handleStudentIdChange(e.target.value)}
                        placeholder="กรอกรหัสนักศึกษา 8–13 หลัก เช่น 6610210245"
                        maxLength={13}
                        className="w-full bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 focus:ring-1 focus:ring-amber-600 rounded-xl px-3 py-2 text-base sm:text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none"
                      />
                    </div>

                    <div
                      ref={majorSectionRef}
                      className={`rounded-xl p-2 transition-all ${
                        focusedMissingKey === 'major'
                          ? 'bg-rose-50 ring-2 ring-rose-400'
                          : ''
                      }`}
                    >
                      <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                        สาขาวิชา <span className="text-rose-600">*</span>
                      </label>
                      <input
                        ref={majorInputRef}
                        type="text"
                        value={major}
                        onChange={(e) => {
                          setMajor(e.target.value);
                          if (focusedMissingKey === 'major') setFocusedMissingKey(null);
                          setErrorMsg('');
                        }}
                        placeholder="เช่น วิทยาการคอมพิวเตอร์, เคมีประยุกต์, ฟิสิกส์..."
                        maxLength={60}
                        className="w-full bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 focus:ring-1 focus:ring-amber-600 rounded-xl px-3 py-2 text-base sm:text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none"
                      />
                    </div>

                    <div
                      ref={yearSectionRef}
                      className={`rounded-xl p-2 transition-all ${
                        focusedMissingKey === 'year'
                          ? 'bg-rose-50 ring-2 ring-rose-400'
                          : ''
                      }`}
                    >
                      <label className="block text-[11px] font-semibold text-[#574536] mb-1.5">
                        ชั้นปี <span className="text-rose-600">*</span>
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                        {STUDENT_YEAR_OPTIONS.map((yr) => {
                          const isSelected = yearCode === yr.code;
                          return (
                            <button
                              key={yr.code}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => {
                                setYearCode(yr.code);
                                if (focusedMissingKey === 'year') setFocusedMissingKey(null);
                                setErrorMsg('');
                              }}
                              className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#241911] border-[#241911] text-[#fffbeb] shadow-sm'
                                  : 'bg-[#fdfaf4] border-amber-900/15 text-[#574536] hover:bg-amber-50'
                              }`}
                            >
                              {yr.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-[10px] text-[#7c5d3a]">
                      * ระบบจำแนกคณะและตัดรหัสซ้ำอัตโนมัติ พร้อมสงวนสิทธิ์ 1 อุปกรณ์ ต่อ 1 รหัสนักศึกษา
                    </p>
                  </div>
                )}

                {/* สาขาข้อมูล: อาจารย์/บุคลากร */}
                {selectedUserType === 'staff' && (
                  <div className="pt-2.5 border-t border-amber-900/10 space-y-2.5 animate-ui-step">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                        สังกัด / สาขา (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        value={staffDept}
                        onChange={(e) => {
                          setStaffDept(e.target.value);
                          setErrorMsg('');
                        }}
                        placeholder="เช่น คณะวิทยาศาสตร์, สาขาวิทยาศาสตร์ชีวภาพ..."
                        maxLength={60}
                        className="w-full bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 rounded-xl px-3 py-2 text-base sm:text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                        บทบาทในโครงการ (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        value={staffRole}
                        onChange={(e) => {
                          setStaffRole(e.target.value);
                          setErrorMsg('');
                        }}
                        placeholder="เช่น อาจารย์ที่ปรึกษา, ผู้ร่วมกิจกรรม..."
                        maxLength={50}
                        className="w-full bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 rounded-xl px-3 py-2 text-base sm:text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* สาขาข้อมูล: บุคคลทั่วไป / ชุมชน */}
                {selectedUserType === 'general' && (
                  <div className="pt-2.5 border-t border-amber-900/10 space-y-2 animate-ui-step">
                    <label className="block text-[11px] font-semibold text-[#574536]">
                      บทบาทของผู้เข้าร่วม (ไม่บังคับ)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {COMMUNITY_ROLE_OPTIONS.map((roleOpt) => {
                        const isSelected = communityRole === roleOpt;
                        return (
                          <button
                            key={roleOpt}
                            type="button"
                            onClick={() => {
                              setCommunityRole(isSelected ? '' : roleOpt);
                              setErrorMsg('');
                            }}
                            className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#241911] border-[#241911] text-[#fffbeb] shadow-sm'
                                : 'bg-[#fdfaf4] border-amber-900/15 text-[#574536] hover:bg-amber-50'
                            }`}
                          >
                            {roleOpt}
                          </button>
                        );
                      })}
                    </div>
                    {communityRole === 'อื่นๆ' && (
                      <input
                        type="text"
                        value={communityRoleOther}
                        onChange={(e) => {
                          setCommunityRoleOther(e.target.value);
                          setErrorMsg('');
                        }}
                        placeholder="ระบุบทบาทของท่าน..."
                        maxLength={50}
                        className="w-full bg-[#fffdf9] border border-amber-900/20 focus:border-amber-700 rounded-xl px-3 py-2 text-sm text-[#231912] placeholder-[#9c8671] focus:outline-none"
                      />
                    )}
                    <p className="text-[10px] text-[#7c5d3a]">
                      * สำหรับบุคคลทั่วไป/ชุมชน จะมีหมวดประเมิน "สำหรับผู้ปกครอง / ชุมชน" 4 ข้อเพิ่มเติมในขั้นตอนที่ 3
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= STEP 2: คุณภาพ การบริหารจัดการ Learning & KPI โครงการ (Q1-Q15) ================= */}
          {currentStep === 2 && (
            <>
              <div className="bg-amber-50/90 border border-amber-300/70 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#231912] flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>แบบประเมินตามวัตถุประสงค์เฉพาะของโครงการ ({step2Answered}/{step2Total} ข้อ)</span>
                  </p>
                  <p className="text-[10px] text-[#7c5d3a] mt-0.5">
                    ระดับคะแนน: 5 = มากที่สุด • 4 = มาก • 3 = ปานกลาง • 2 = น้อย • 1 = น้อยที่สุด
                  </p>
                </div>
                {isAdminTestMode && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-semibold text-amber-900">ทดสอบ Admin:</span>
                    {[5, 4, 3].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleAdminQuickFillStep(lvl)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-400/60 text-amber-900 text-[10px] font-bold cursor-pointer"
                      >
                        ให้ {lvl}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {STEP2_GROUPS.map(({ dimension, items }) => {
                const groupDone = items.filter(({ idx }) => scores[idx] !== null).length;
                return (
                  <div
                    key={dimension.id}
                    className="bg-white border border-amber-900/12 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-900/10">
                      <h4 className="text-xs sm:text-sm font-bold text-[#231912]">
                        {dimension.label}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          groupDone === items.length
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : stepValidatedFlags[2]
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-amber-50 border-amber-300/70 text-amber-900'
                        }`}
                      >
                        {groupDone}/{items.length} ข้อ
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map(({ q, idx }) => (
                        <LikertQuestionRow
                          key={`q-${idx}`}
                          ref={(el) => {
                            questionRefs.current[idx] = el;
                          }}
                          qId={q.id}
                          title={q.title}
                          subGroupLabel={q.subGroupLabel}
                          currentVal={scores[idx]}
                          onSelect={(val) => handleScoreChange(idx, val)}
                          focusKey={`q-${idx}`}
                          showValidation={stepValidatedFlags[2]}
                          focusedMissingKey={focusedMissingKey}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ================= STEP 3: ประเภทโครงการ (1,3,7), PSU Style & 5Hs [4,5], ชุมชน/ความเท่าเทียม + ส่วนที่ 15 ================= */}
          {currentStep === 3 && (
            <>
              <div className="bg-amber-50/90 border border-amber-300/70 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#231912] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-700" />
                    <span>
                      ประเภทโครงการ (1, 3, 7) • คุณลักษณะ PSU Style & 5Hs [4,5] ({step3Answered}/{step3Total} ข้อ)
                    </span>
                  </p>
                  <p className="text-[10px] text-[#7c5d3a] mt-0.5">
                    ระดับคะแนน: 5 = มากที่สุด • 4 = มาก • 3 = ปานกลาง • 2 = น้อย • 1 = น้อยที่สุด
                  </p>
                </div>
                {isAdminTestMode && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-semibold text-amber-900">ทดสอบ Admin:</span>
                    {[5, 4, 3].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleAdminQuickFillStep(lvl)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-400/60 text-amber-900 text-[10px] font-bold cursor-pointer"
                      >
                        ให้ {lvl}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {STEP3_GROUPS.map(({ dimension, items }) => {
                const groupDone = items.filter(({ idx }) => scores[idx] !== null).length;
                return (
                  <div
                    key={dimension.id}
                    className="bg-white border border-amber-900/12 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-900/10">
                      <div>
                        <span className="text-[10px] font-semibold text-amber-800 block">
                          {dimension.sectionGroup}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-[#231912]">
                          {dimension.label}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          groupDone === items.length
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : stepValidatedFlags[3]
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-amber-50 border-amber-300/70 text-amber-900'
                        }`}
                      >
                        {groupDone}/{items.length} ข้อ
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map(({ q, idx }) => (
                        <LikertQuestionRow
                          key={`q-${idx}`}
                          ref={(el) => {
                            questionRefs.current[idx] = el;
                          }}
                          qId={q.id}
                          title={q.title}
                          subGroupLabel={q.subGroupLabel}
                          currentVal={scores[idx]}
                          onSelect={(val) => handleScoreChange(idx, val)}
                          focusKey={`q-${idx}`}
                          showValidation={stepValidatedFlags[3]}
                          focusedMissingKey={focusedMissingKey}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* ส่วนที่ 15 เฉพาะกลุ่มบุคคลทั่วไป / ชุมชน */}
              {selectedUserType === 'general' && (
                <div className="bg-white border border-emerald-700/20 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-900/10">
                    <div>
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>ส่วนเพิ่มเติมเฉพาะผู้ปกครอง / ชุมชน / บุคคลทั่วไป</span>
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#231912]">
                        สำหรับผู้ปกครอง / ชุมชน (4 ข้อ)
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        step3CommAnswered === COMMUNITY_EVALUATION_QUESTIONS.length
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : stepValidatedFlags[3]
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'bg-amber-50 border-amber-300/70 text-amber-900'
                      }`}
                    >
                      {step3CommAnswered}/{COMMUNITY_EVALUATION_QUESTIONS.length} ข้อ
                    </span>
                  </div>
                  <div className="space-y-2">
                    {COMMUNITY_EVALUATION_QUESTIONS.map((cq, commIdx) => (
                      <LikertQuestionRow
                        key={`comm-${commIdx}`}
                        ref={(el) => {
                          communityRefs.current[commIdx] = el;
                        }}
                        qId={cq.id}
                        title={cq.title}
                        currentVal={communityScores[commIdx]}
                        onSelect={(val) => handleCommunityScoreChange(commIdx, val)}
                        focusKey={`comm-${commIdx}`}
                        showValidation={stepValidatedFlags[3]}
                        focusedMissingKey={focusedMissingKey}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= STEP 4: SDGs 7 เป้าหมาย & ข้อเสนอแนะ 3 ช่อง ================= */}
          {currentStep === 4 && (
            <>
              <div className="bg-white border border-amber-900/12 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-900/10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-[#231912] flex items-center gap-1.5">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                        <span>ประเมินความสอดคล้อง SDGs ของโครงการ (7 เป้าหมาย)</span>
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          step4Answered === step4Total
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : stepValidatedFlags[4]
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-amber-50 border-amber-300/70 text-amber-900'
                        }`}
                      >
                        ตอบแล้ว {step4Answered}/{step4Total} ข้อ
                      </span>
                    </div>
                    <p className="text-[10px] text-[#7c5d3a] mt-0.5">
                      อ้างอิงตามกรอบเป้าหมายการพัฒนาที่ยั่งยืนในเล่มโครงการ (SDG 5, 11, 12, 13, 14, 15, 17)
                    </p>
                  </div>

                  {isAdminTestMode && (
                    <button
                      type="button"
                      onClick={() => handleAdminQuickFillSdgs(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#fffbeb] hover:bg-amber-100 border border-amber-400/60 text-amber-900 text-[10px] font-bold cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      ทดสอบ Admin: ติ๊กสอดคล้องทั้งหมด
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {SDG_EVALUATION_ITEMS.map((sdg, sdgIdx) => {
                    const currentVal = sdgAnswers[sdgIdx];
                    const isMissing = stepValidatedFlags[4] && currentVal === null;
                    const isFocused = focusedMissingKey === `sdg-${sdgIdx}` && currentVal === null;

                    return (
                      <div
                        key={sdg.key}
                        ref={(el) => {
                          sdgRefs.current[sdgIdx] = el;
                        }}
                        className={`p-3 rounded-xl border transition-all space-y-2 ${
                          isFocused
                            ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400/80 shadow-md'
                            : isMissing
                              ? 'bg-rose-50/75 border-rose-400 ring-1 ring-rose-300'
                              : 'bg-[#fdfaf4] border-amber-900/12'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded-md text-white text-[10px] font-extrabold tracking-wide shadow-2xs"
                              style={{ backgroundColor: sdg.colorHex }}
                            >
                              SDG {sdg.code}
                            </span>
                            <span className="text-xs font-bold text-[#231912]">
                              {sdg.nameTh}{' '}
                              <span className="text-[10px] font-medium text-[#7c5d3a]">
                                ({sdg.nameEn})
                              </span>
                            </span>
                          </div>
                          {isMissing && (
                            <span
                              className={`text-[10px] font-bold text-rose-600 ${
                                isFocused ? 'animate-pulse' : ''
                              }`}
                            >
                              (กรุณาเลือกคำตอบ)
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#574536] leading-snug">
                          {sdg.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          {[
                            { val: true, label: 'สอดคล้อง / บรรลุ' },
                            { val: false, label: 'ไม่สอดคล้อง' }
                          ].map((opt) => {
                            const selected = currentVal === opt.val;
                            return (
                              <button
                                key={String(opt.val)}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => handleSdgChange(sdgIdx, opt.val)}
                                className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                  selected
                                    ? opt.val
                                      ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                                      : 'bg-[#241911] border-[#241911] text-[#fffbeb] shadow-sm'
                                    : 'bg-white border-amber-900/15 text-[#574536] hover:bg-amber-50'
                                }`}
                              >
                                {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ข้อเสนอแนะ 3 ช่อง ตามส่วนที่ 16 */}
              <div className="bg-white border border-amber-900/12 rounded-2xl p-3.5 sm:p-4 space-y-3 text-left shadow-2xs">
                <h4 className="text-xs sm:text-sm font-bold text-[#231912]">
                  ข้อเสนอแนะเพิ่มเติม (ไม่บังคับกรอก)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                    1. สิ่งที่ท่านประทับใจหรือเห็นว่าโครงการทำได้ดี
                  </label>
                  <textarea
                    value={feedbackImpressed}
                    onChange={(e) => {
                      setFeedbackImpressed(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="เช่น แนวคิด 1 ครอบครัว 1 กระทง, ลอยกระทงออนไลน์, บรรยากาศตึกฟักทอง, ดนตรี SMC..."
                    maxLength={150}
                    rows={2}
                    className="w-full bg-[#fffdf9] border border-amber-900/20 rounded-xl p-2.5 text-xs text-[#231912] placeholder-[#9c8671] focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-600 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                    2. สิ่งที่ควรปรับปรุงหรือข้อเสนอแนะเพิ่มเติม
                  </label>
                  <textarea
                    value={feedbackImprove}
                    onChange={(e) => {
                      setFeedbackImprove(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="ข้อเสนอแนะเพื่อพัฒนาการจัดโครงการในปีถัดไป..."
                    maxLength={150}
                    rows={2}
                    className="w-full bg-[#fffdf9] border border-amber-900/20 rounded-xl p-2.5 text-xs text-[#231912] placeholder-[#9c8671] focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-600 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#574536] mb-1">
                    3. ข้อเสนอแนะอื่น ๆ (ถ้ามี)
                  </label>
                  <textarea
                    value={feedbackOther}
                    onChange={(e) => {
                      setFeedbackOther(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="ความคิดเห็นเพิ่มเติมอื่นๆ..."
                    maxLength={100}
                    rows={2}
                    className="w-full bg-[#fffdf9] border border-amber-900/20 rounded-xl p-2.5 text-xs text-[#231912] placeholder-[#9c8671] focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-600 resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-amber-900/12 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-[#7c5d3a] px-0.5">
            <span>
              ความคืบหน้าการประเมิน: <strong className="text-[#231912]">{totalRatedNow}/{totalRateable}</strong> ข้อ
            </span>
            <span>
              คะแนนเฉลี่ยปัจจุบัน:{' '}
              <strong className="text-amber-800">
                {currentCoreAverage !== null ? `${currentCoreAverage} / 5.00` : '- / 5.00'}
              </strong>
            </span>
          </div>

          {errorMsg && (
            <p className="w-full px-3 py-2 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-700 font-semibold text-center animate-ui-step">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center gap-2 w-full">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="px-3.5 py-3 rounded-xl bg-[#f5eedf] hover:bg-amber-100 text-[#231912] font-bold border border-amber-900/20 transition active:scale-[0.98] cursor-pointer text-xs sm:text-sm flex items-center gap-1 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] font-extrabold rounded-xl shadow-md border border-amber-600/25 transition-all duration-150 active:scale-[0.98] cursor-pointer text-xs sm:text-sm"
              >
                <span>ถัดไป ({currentStep}/4)</span>
                <ArrowRight className="w-4 h-4 text-[#231912]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#231912] font-extrabold rounded-xl shadow-md border border-amber-600/25 transition-all duration-150 active:scale-[0.98] cursor-pointer text-xs sm:text-sm disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4 text-[#231912]" />
                <span>
                  {submitting
                    ? 'กำลังบันทึกผลประเมิน...'
                    : isAdminTestMode
                      ? 'ส่งแบบประเมินทดสอบทั้งหมด'
                      : 'ส่งแบบประเมิน & ลอยกระทงสู่สายน้ำ'}
                </span>
              </button>
            )}
          </div>

          {showSkipEscape && (
            <button
              type="button"
              onClick={onFinish}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#f5eedf] hover:bg-amber-100 text-[#231912] font-semibold rounded-xl border border-amber-900/20 transition-all duration-150 active:scale-[0.98] cursor-pointer text-xs"
            >
              <span>เคยลงทะเบียนแล้ว — ข้ามไปชมกระทงบนสายน้ำ</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
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
