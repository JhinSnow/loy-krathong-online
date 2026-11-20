// src/utils/evaluationHelpers.ts
// โมดูลจัดการข้อมูลแบบประเมินความพึงพอใจ 10 ข้อ และการคำนวณสถิติสำหรับเล่มรายงานสรุปโครงการ

export interface EvaluationQuestion {
  id: number;
  shortLabel: string;
  title: string;
}

export const EVALUATION_QUESTIONS: EvaluationQuestion[] = [
  {
    id: 1,
    shortLabel: '1. การประชาสัมพันธ์',
    title: 'ด้านการประชาสัมพันธ์และการเข้าถึงข้อมูลกิจกรรม'
  },
  {
    id: 2,
    shortLabel: '2. สถานที่และบรรยากาศ',
    title: 'ความเหมาะสมของสถานที่และบรรยากาศภายในงาน'
  },
  {
    id: 3,
    shortLabel: '3. ความหลากหลายกิจกรรม',
    title: 'ความหลากหลายและความน่าสนใจของกิจกรรม'
  },
  {
    id: 4,
    shortLabel: '4. ความสะดวกในการเข้าร่วม',
    title: 'ความสะดวกในการเข้าร่วมกิจกรรม'
  },
  {
    id: 5,
    shortLabel: '5. ความเพียงพอของวัสดุอุปกรณ์',
    title: 'ความเพียงพอของวัสดุและอุปกรณ์ภายในงาน'
  },
  {
    id: 6,
    shortLabel: '6. ส่งเสริมวัฒนธรรมไทย',
    title: 'การส่งเสริมคุณค่าทางวัฒนธรรมไทยและความเป็นไทย'
  },
  {
    id: 7,
    shortLabel: '7. อนุรักษ์สิ่งแวดล้อม/SDGs',
    title: 'การส่งเสริมแนวคิดการอนุรักษ์สิ่งแวดล้อมและ SDGs (รวมถึง 1 ครอบครัว 1 กระทง / ลอยกระทงออนไลน์)'
  },
  {
    id: 8,
    shortLabel: '8. การสร้างความสามัคคี',
    title: 'การสร้างความสามัคคีและความสัมพันธ์อันดีระหว่างผู้เข้าร่วม'
  },
  {
    id: 9,
    shortLabel: '9. ความเหมาะสมของระยะเวลา',
    title: 'ความเหมาะสมของระยะเวลาในการจัดกิจกรรม'
  },
  {
    id: 10,
    shortLabel: '10. ภาพรวมความพึงพอใจ',
    title: 'ภาพรวมความพึงพอใจต่อการจัดกิจกรรมทั้งหมด'
  }
];

export const RATING_LABELS: Record<number, string> = {
  5: 'มากที่สุด',
  4: 'มาก',
  3: 'ปานกลาง',
  2: 'น้อย',
  1: 'น้อยที่สุด'
};

export const PSU_FACULTIES: readonly string[] = [
  'คณะวิศวกรรมศาสตร์',
  'คณะวิทยาศาสตร์',
  'คณะแพทยศาสตร์',
  'คณะพยาบาลศาสตร์',
  'คณะวิทยาการจัดการ',
  'คณะทรัพยากรธรรมชาติ',
  'คณะเภสัชศาสตร์',
  'คณะทันตแพทยศาสตร์',
  'คณะสัตวแพทยศาสตร์',
  'คณะอุตสาหกรรมเกษตร',
  'คณะศิลปศาสตร์',
  'คณะเศรษฐศาสตร์',
  'คณะนิติศาสตร์',
  'คณะการแพทย์แผนไทย',
  'คณะเทคนิคการแพทย์',
  'วิทยาลัยนานาชาติ',
  'วิทยาลัยการคอมพิวเตอร์',
  'บัณฑิตวิทยาลัย',
  'วิทยาเขตปัตตานี / ภูเก็ต / สุราษฎร์ธานี / ตรัง',
  'คณะ/หน่วยงานอื่นๆ'
];

const PSU_FACULTY_CODE_MAP: Record<string, string> = {
  '101': 'คณะวิศวกรรมศาสตร์',
  '102': 'คณะวิทยาศาสตร์',
  '103': 'คณะแพทยศาสตร์',
  '104': 'คณะพยาบาลศาสตร์',
  '105': 'คณะวิทยาการจัดการ',
  '106': 'คณะทรัพยากรธรรมชาติ',
  '107': 'คณะเภสัชศาสตร์',
  '108': 'คณะทันตแพทยศาสตร์',
  '109': 'คณะสัตวแพทยศาสตร์',
  '110': 'คณะอุตสาหกรรมเกษตร',
  '111': 'คณะศิลปศาสตร์',
  '112': 'คณะเศรษฐศาสตร์',
  '113': 'คณะนิติศาสตร์',
  '114': 'คณะการแพทย์แผนไทย',
  '115': 'คณะเทคนิคการแพทย์',
  '116': 'วิทยาลัยนานาชาติ',
  '120': 'วิทยาลัยการคอมพิวเตอร์'
};

/**
 * เดาคณะอัตโนมัติจากรหัสคณะ 3 หลักในรหัสนักศึกษา 10 หลัก (เช่น 6610110xxx -> 101 คณะวิศวกรรมศาสตร์)
 */
export function guessFacultyFromStudentId(studentId: string): string {
  const digits = (studentId || '').replace(/\D/g, '');
  if (digits.length < 5) return '';
  const campusFacCode = digits.slice(2, 5);
  if (PSU_FACULTY_CODE_MAP[campusFacCode]) {
    return PSU_FACULTY_CODE_MAP[campusFacCode];
  }
  const campusChar = digits[2];
  if (['2', '3', '4', '5'].includes(campusChar)) {
    return 'วิทยาเขตปัตตานี / ภูเก็ต / สุราษฎร์ธานี / ตรัง';
  }
  return '';
}

export interface ParsedEvaluationRecord {
  id: string;
  krathong_id?: string | null;
  user_type: 'student' | 'staff' | 'general' | string;
  student_id: string;
  student_name?: string;
  faculty?: string;
  device_id?: string;
  scores: number[]; // ความยาว 10 ข้อ (index 0..9)
  average_score: number;
  comment: string;
  created_at: string;
}

export interface StudentTranscriptEntry {
  student_id: string;
  student_name: string;
  faculty: string;
  device_id: string;
  deviceStatus: 'verified' | 'shared_device';
  created_at: string;
  krathong_id?: string | null;
}

export interface FacultyCountRow {
  faculty: string;
  count: number;
  percentage: number;
}

export interface StudentTranscriptRoster {
  uniqueStudents: StudentTranscriptEntry[];
  totalSubmittedStudentRows: number;
  duplicateIdCount: number;
  sharedDeviceCount: number;
  facultyBreakdown: FacultyCountRow[];
}

export interface QuestionStatRow {
  questionId: number;
  shortLabel: string;
  title: string;
  totalN: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  percentages: Record<1 | 2 | 3 | 4 | 5, number>;
  mean: number;
  sd: number;
  levelText: string;
}

export interface EvaluationAnalyticsSummary {
  totalN: number;
  userTypeCounts: {
    student: number;
    staff: number;
    general: number;
  };
  questionStats: QuestionStatRow[];
  overallMean: number;
  overallSD: number;
  overallLevelText: string;
  highestDimension: QuestionStatRow | null;
  lowestDimension: QuestionStatRow | null;
  records: ParsedEvaluationRecord[];
}

/**
 * แปลผลค่าเฉลี่ยคะแนนความพึงพอใจตามเกณฑ์มาตรฐาน 5 ระดับ
 */
export function getSatisfactionLevelText(mean: number): string {
  if (mean >= 4.51) return 'มากที่สุด';
  if (mean >= 3.51) return 'มาก';
  if (mean >= 2.51) return 'ปานกลาง';
  if (mean >= 1.51) return 'น้อย';
  return 'น้อยที่สุด';
}

/**
 * เข้ารหัสข้อมูลประเมิน 10 ข้อ + รหัสนักศึกษา + ชื่อ + คณะ + Device ID + ข้อเสนอแนะ ลงในฟิลด์ feedback (JSON string)
 * เพื่อให้บันทึกเข้าตาราง evaluations เดิมของ Supabase และ Cloudflare D1 ได้ทันทีโดยไม่ต้องแก้โครงสร้างตาราง
 */
export function encodeEvaluationPayload(
  scores: number[],
  studentId: string,
  comment: string,
  studentName = '',
  faculty = '',
  deviceId = ''
): string {
  const safeScores = EVALUATION_QUESTIONS.map((_, idx) => {
    const val = Math.round(Number(scores[idx]) || 5);
    return Math.min(Math.max(val, 1), 5);
  });

  const payload: Record<string, unknown> = {
    s: safeScores,
    sid: (studentId || '').trim().slice(0, 15)
  };
  if (studentName.trim()) payload.name = studentName.trim().slice(0, 60);
  if (faculty.trim()) payload.fac = faculty.trim().slice(0, 60);
  if (deviceId.trim()) payload.did = deviceId.trim().slice(0, 16);
  payload.c = (comment || '').trim().slice(0, 140);

  return JSON.stringify(payload);
}

/**
 * แปลงแถวข้อมูลจากฐานข้อมูล (ทั้งรูปแบบใหม่ JSON 10 ข้อ, __EVAL_V2__ และรูปแบบเดิมคะแนนเดี่ยว) ให้เป็น ParsedEvaluationRecord
 */
export function parseEvaluationRow(raw: any, index = 0): ParsedEvaluationRecord {
  const baseRating = Math.min(Math.max(Math.round(Number(raw?.rating) || 5), 1), 5);
  let scores: number[] = Array(10).fill(baseRating);
  let studentId = '';
  let studentName = '';
  let faculty = '';
  let deviceId = '';
  let comment = '';

  const rawFeedback = typeof raw?.feedback === 'string' ? raw.feedback.trim() : '';
  const jsonCandidate = rawFeedback.startsWith('__EVAL_V2__:')
    ? rawFeedback.slice('__EVAL_V2__:'.length).trim()
    : rawFeedback;

  if (jsonCandidate.startsWith('{')) {
    try {
      const parsed = JSON.parse(jsonCandidate);
      if (Array.isArray(parsed.s) && parsed.s.length === 10) {
        scores = parsed.s.map((n: any) => Math.min(Math.max(Math.round(Number(n) || 5), 1), 5));
      } else if (Array.isArray(parsed.scores) && parsed.scores.length === 10) {
        scores = parsed.scores.map((n: any) => Math.min(Math.max(Math.round(Number(n) || 5), 1), 5));
      } else if (parsed.scores && typeof parsed.scores === 'object') {
        scores = EVALUATION_QUESTIONS.map((_, idx) => {
          const val = parsed.scores[`q${idx + 1}`] ?? parsed.scores[idx] ?? baseRating;
          return Math.min(Math.max(Math.round(Number(val) || 5), 1), 5);
        });
      }
      if (typeof parsed.sid === 'string') {
        studentId = parsed.sid;
      } else if (typeof parsed.student_id === 'string') {
        studentId = parsed.student_id;
      }
      if (typeof parsed.name === 'string') {
        studentName = parsed.name;
      } else if (typeof parsed.student_name === 'string') {
        studentName = parsed.student_name;
      }
      if (typeof parsed.fac === 'string') {
        faculty = parsed.fac;
      } else if (typeof parsed.faculty === 'string') {
        faculty = parsed.faculty;
      }
      if (typeof parsed.did === 'string') {
        deviceId = parsed.did;
      } else if (typeof parsed.device_id === 'string') {
        deviceId = parsed.device_id;
      }
      if (typeof parsed.c === 'string') {
        comment = parsed.c;
      } else if (typeof parsed.comment === 'string') {
        comment = parsed.comment;
      }
    } catch {
      // กรณี JSON ถูกตัดขาด ให้ดึงเฉพาะข้อความใน comment หรือ c ออกมา ไม่ให้แสดงโค้ดดิบ
      const commentMatch = jsonCandidate.match(/"(?:comment|c)"\s*:\s*"([^"]*)"/);
      comment = commentMatch ? commentMatch[1] : '';
    }
  } else if (Array.isArray(raw?.scores) && raw.scores.length === 10) {
    scores = raw.scores.map((n: any) => Math.min(Math.max(Math.round(Number(n) || 5), 1), 5));
    studentId = raw.student_id || '';
    studentName = raw.student_name || '';
    faculty = raw.faculty || '';
    deviceId = raw.device_id || '';
    comment = raw.comment || rawFeedback;
  } else {
    comment = rawFeedback;
  }

  const avg = Number((scores.reduce((a, b) => a + b, 0) / 10).toFixed(2));
  const cleanSid = (studentId || '').trim();
  const derivedFaculty = cleanSid ? guessFacultyFromStudentId(cleanSid) : '';

  return {
    id: raw?.id || `eval-${index + 1}`,
    krathong_id: raw?.krathong_id || null,
    user_type: raw?.user_type || 'general',
    student_id: cleanSid,
    student_name: (studentName || '').trim(),
    faculty: derivedFaculty || (faculty || '').trim(),
    device_id: (deviceId || '').trim(),
    scores,
    average_score: avg,
    comment,
    created_at: raw?.created_at || new Date().toISOString()
  };
}

const LOCAL_EVAL_STORAGE_KEY = 'loy_krathong_evaluations_10q_v1';
const LOCAL_KRATHONG_STORAGE_KEY = 'loy_krathong_items_v1';
const LOCAL_KRATHONG_CLEAN_FLAG = 'loy_krathong_clean_v2';
const LOCAL_APPROVAL_SETTING_KEY = 'loy_krathong_require_approval_v1';
const LOCAL_MODERATION_OVERRIDES_KEY = 'loy_krathong_moderation_overrides_v1';
const LOCAL_DEVICE_TOKEN_KEY = 'loy_krathong_device_token_v1';
const LOCAL_BOUND_STUDENT_ID_KEY = 'loy_krathong_bound_sid_v1';

/**
 * สร้างหรือดึง Device Token ประจำเบราว์เซอร์ เพื่อตรวจสอบกรณีมีการลงทะเบียนหลายรหัสจากอุปกรณ์เดียวกัน
 */
export function getOrCreateDeviceToken(): string {
  try {
    if (typeof localStorage === 'undefined') return 'srv-device';
    const existing = localStorage.getItem(LOCAL_DEVICE_TOKEN_KEY);
    if (existing) return existing;
    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 12);
    localStorage.setItem(LOCAL_DEVICE_TOKEN_KEY, token);
    return token;
  } catch {
    return 'mem-device';
  }
}

export function getBoundStudentId(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const sid = localStorage.getItem(LOCAL_BOUND_STUDENT_ID_KEY);
    return sid ? sid.trim() : null;
  } catch {
    return null;
  }
}

export function bindStudentIdToDevice(studentId: string): void {
  try {
    const clean = (studentId || '').trim();
    if (clean && typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_BOUND_STUDENT_ID_KEY, clean);
    }
  } catch {}
}

/**
 * ตรวจสอบว่าอุปกรณ์นี้เคยส่งแบบประเมินความพึงพอใจไปแล้วหรือไม่ (จาก Student ID ที่ผูกไว้หรือประวัติในเครื่อง)
 */
export function hasCompletedEvaluationOnDevice(): boolean {
  try {
    if (getBoundStudentId()) return true;
    return getLocalEvaluationRecords().length > 0;
  } catch {
    return false;
  }
}

/**
 * ล้างสถานะล็อกเครื่อง ประวัติแบบประเมินในเครื่อง และ Rate Limit เพื่อใช้ทดสอบระบบ (ไม่กระทบฐานข้อมูล Supabase/D1)
 */
export function resetDeviceEvaluationLock(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_BOUND_STUDENT_ID_KEY);
      localStorage.removeItem(LOCAL_EVAL_STORAGE_KEY);
      localStorage.removeItem(LOCAL_DEVICE_TOKEN_KEY);
    }
  } catch {}

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('rl_krathong_submit');
      sessionStorage.removeItem('rl_evaluation_submit');
    }
  } catch {}
}

// รายการ ID ทดสอบระบบช่วงพัฒนาที่เคลียร์ออกจากหน้าเว็บและสถิติเริ่มต้น
const DEFAULT_HIDDEN_IDS: Record<string, 'approved' | 'rejected' | 'deleted'> = {
  'f2d13964-5717-4aea-b14d-d6ad1c8a40b0': 'deleted',
  '589097cb-612c-43b0-aeba-680958b0c47f': 'deleted',
  'a8c1eb41-198b-4182-a2a7-6a4783d6aedb': 'deleted',
  '19dfe3ad-e967-4f78-a638-61ac4b50226a': 'deleted',
  'e357eecc-e1f0-4ed8-8176-8da4634e2dfb': 'deleted'
};

function ensureLegacyLocalKrathongsCleared(): void {
  try {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(LOCAL_KRATHONG_CLEAN_FLAG)) {
      localStorage.removeItem(LOCAL_KRATHONG_STORAGE_KEY);
      localStorage.setItem(LOCAL_KRATHONG_CLEAN_FLAG, '1');
    }
  } catch {}
}

export interface LocalKrathongRecord {
  id: string;
  user_type: string;
  owner_name: string;
  wish_message: string;
  base_type: string;
  flower_type: string;
  candle_color: string;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
}

export function getModerationOverrides(): Record<string, 'approved' | 'rejected' | 'deleted'> {
  try {
    const raw = localStorage.getItem(LOCAL_MODERATION_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_HIDDEN_IDS, ...(typeof parsed === 'object' && parsed ? parsed : {}) };
  } catch {
    return { ...DEFAULT_HIDDEN_IDS };
  }
}

export function mergeModerationOverrides(
  remoteOverrides: Record<string, string>
): Record<string, 'approved' | 'rejected' | 'deleted'> {
  try {
    const current = getModerationOverrides();
    const merged: Record<string, 'approved' | 'rejected' | 'deleted'> = {
      ...DEFAULT_HIDDEN_IDS,
      ...(remoteOverrides as any),
      ...current
    };
    localStorage.setItem(LOCAL_MODERATION_OVERRIDES_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return getModerationOverrides();
  }
}

export function saveLocalKrathongRecord(record: LocalKrathongRecord): void {
  try {
    ensureLegacyLocalKrathongsCleared();
    const existing = getLocalKrathongRecords();
    const filtered = existing.filter((item) => item.id !== record.id);
    const updated = [record, ...filtered].slice(0, 2000);
    localStorage.setItem(LOCAL_KRATHONG_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getLocalKrathongRecords(): LocalKrathongRecord[] {
  try {
    ensureLegacyLocalKrathongsCleared();
    const raw = localStorage.getItem(LOCAL_KRATHONG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function updateLocalKrathongStatus(
  krathongId: string,
  status: 'approved' | 'rejected' | 'deleted'
): void {
  try {
    // 1. บันทึกลง Moderation Overrides เพื่อให้ใช้ได้กับทั้งกระทงจาก Supabase, D1 และ LocalStorage
    const overrides = getModerationOverrides();
    overrides[krathongId] = status;
    localStorage.setItem(LOCAL_MODERATION_OVERRIDES_KEY, JSON.stringify(overrides));

    // 2. อัปเดตหรือลบในรายการ LocalStorage
    const existing = getLocalKrathongRecords();
    if (status === 'deleted') {
      const filtered = existing.filter((item) => item.id !== krathongId);
      localStorage.setItem(LOCAL_KRATHONG_STORAGE_KEY, JSON.stringify(filtered));
    } else {
      const updated = existing.map((item) =>
        item.id === krathongId ? { ...item, status } : item
      );
      localStorage.setItem(LOCAL_KRATHONG_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {}
}

export function getLocalRequireApproval(): boolean {
  try {
    return localStorage.getItem(LOCAL_APPROVAL_SETTING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLocalRequireApproval(val: boolean): void {
  try {
    localStorage.setItem(LOCAL_APPROVAL_SETTING_KEY, val ? 'true' : 'false');
  } catch {}
}

export function saveLocalEvaluationRecord(record: ParsedEvaluationRecord): void {
  try {
    const existing = getLocalEvaluationRecords();
    const updated = [record, ...existing].slice(0, 2000);
    localStorage.setItem(LOCAL_EVAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getLocalEvaluationRecords(): ParsedEvaluationRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_EVAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, idx) => parseEvaluationRow(item, idx));
  } catch {
    return [];
  }
}

/**
 * ข้อมูลตัวอย่างเริ่มต้นกรณีฐานข้อมูลยังไม่มีผู้ทำแบบประเมิน เพื่อให้สามารถดูและทดสอบ Radar Chart / Export เล่มรายงานได้ทันที
 */
export function getDemoEvaluationRecords(): ParsedEvaluationRecord[] {
  const sampleData = [
    {
      id: 'demo-1',
      user_type: 'student',
      student_id: '6610110245',
      faculty: 'คณะวิศวกรรมศาสตร์',
      device_id: 'demo-dev-01',
      scores: [5, 5, 5, 5, 4, 5, 5, 5, 5, 5],
      comment: 'จัดงานบรรยากาศดีมากครับ ชอบระบบลอยกระทงออนไลน์ขึ้นจอหน้าตึกฟักทอง ลดขยะได้ดีมาก',
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
    },
    {
      id: 'demo-2',
      user_type: 'student',
      student_id: '6510210118',
      faculty: 'คณะวิทยาศาสตร์',
      device_id: 'demo-dev-02',
      scores: [5, 5, 4, 5, 4, 5, 5, 4, 4, 5],
      comment: 'กระทงมีให้เลือกแต่งหลายแบบมาก น่ารักสุดๆ สแกน QR ง่ายและสะดวกมากค่ะ',
      created_at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString()
    },
    {
      id: 'demo-3',
      user_type: 'staff',
      student_id: '',
      scores: [4, 5, 5, 5, 5, 5, 5, 5, 4, 5],
      comment: 'เป็นการผสมผสานเทคโนโลยีกับประเพณีไทยและแนวคิด SDGs ได้อย่างลงตัว',
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    },
    {
      id: 'demo-4',
      user_type: 'general',
      student_id: '',
      scores: [4, 5, 4, 5, 4, 5, 5, 4, 5, 5],
      comment: 'อยู่ต่างจังหวัดก็มาร่วมลอยกระทงกับมหาวิทยาลัยได้ ประทับใจมากครับ',
      created_at: new Date(Date.now() - 3600 * 1000 * 1.2).toISOString()
    },
    {
      id: 'demo-5',
      user_type: 'student',
      student_id: '6710510089',
      faculty: 'คณะวิทยาการจัดการ',
      device_id: 'demo-dev-03',
      scores: [5, 4, 5, 5, 4, 5, 5, 5, 4, 5],
      comment: 'อยากให้จัดกิจกรรมดีๆ แบบนี้ทุกปีเลยค่ะ',
      created_at: new Date(Date.now() - 3600 * 1000 * 0.5).toISOString()
    }
  ];

  return sampleData.map((d, i) => parseEvaluationRow(d, i));
}

/**
 * คำนวณสถิติทั้ง 10 ข้อ (N, ร้อยละแต่ละระดับคะแนน 1-5, ค่าเฉลี่ย x̄, ส่วนเบี่ยงเบนมาตรฐาน S.D. และค่าเฉลี่ยรวม)
 */
export function calculateEvaluationAnalytics(records: ParsedEvaluationRecord[]): EvaluationAnalyticsSummary {
  const totalN = records.length;

  const userTypeCounts = {
    student: records.filter(r => r.user_type === 'student').length,
    staff: records.filter(r => r.user_type === 'staff').length,
    general: records.filter(r => r.user_type !== 'student' && r.user_type !== 'staff').length
  };

  const questionStats: QuestionStatRow[] = EVALUATION_QUESTIONS.map((q, qIdx) => {
    const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    records.forEach((rec) => {
      const score = Math.min(Math.max(Math.round(Number(rec.scores[qIdx]) || 5), 1), 5) as 1 | 2 | 3 | 4 | 5;
      counts[score] += 1;
      sum += score;
    });

    const mean = totalN > 0 ? Number((sum / totalN).toFixed(2)) : 0;

    // คำนวณส่วนเบี่ยงเบนมาตรฐาน (S.D.)
    let varianceSum = 0;
    if (totalN > 1) {
      records.forEach((rec) => {
        const score = Math.min(Math.max(Math.round(Number(rec.scores[qIdx]) || 5), 1), 5);
        varianceSum += Math.pow(score - sum / totalN, 2);
      });
    }
    const sd = totalN > 1 ? Number(Math.sqrt(varianceSum / (totalN - 1)).toFixed(2)) : 0;

    const percentages: Record<1 | 2 | 3 | 4 | 5, number> = {
      5: totalN > 0 ? Number(((counts[5] / totalN) * 100).toFixed(1)) : 0,
      4: totalN > 0 ? Number(((counts[4] / totalN) * 100).toFixed(1)) : 0,
      3: totalN > 0 ? Number(((counts[3] / totalN) * 100).toFixed(1)) : 0,
      2: totalN > 0 ? Number(((counts[2] / totalN) * 100).toFixed(1)) : 0,
      1: totalN > 0 ? Number(((counts[1] / totalN) * 100).toFixed(1)) : 0
    };

    return {
      questionId: q.id,
      shortLabel: q.shortLabel,
      title: q.title,
      totalN,
      counts,
      percentages,
      mean,
      sd,
      levelText: totalN > 0 ? getSatisfactionLevelText(mean) : '-'
    };
  });

  const overallMean =
    totalN > 0
      ? Number((questionStats.reduce((acc, cur) => acc + cur.mean, 0) / questionStats.length).toFixed(2))
      : 0;

  const overallSD =
    totalN > 0
      ? Number((questionStats.reduce((acc, cur) => acc + cur.sd, 0) / questionStats.length).toFixed(2))
      : 0;

  const sortedByMean = [...questionStats].sort((a, b) => b.mean - a.mean);
  const highestDimension = totalN > 0 ? sortedByMean[0] : null;
  const lowestDimension = totalN > 0 ? sortedByMean[sortedByMean.length - 1] : null;

  return {
    totalN,
    userTypeCounts,
    questionStats,
    overallMean,
    overallSD,
    overallLevelText: totalN > 0 ? getSatisfactionLevelText(overallMean) : '-',
    highestDimension,
    lowestDimension,
    records
  };
}

/**
 * สร้างบัญชีรายชื่อนักศึกษาเพื่อบันทึกชั่วโมงกิจกรรม (Activity Transcript)
 * พร้อมระบบตัดรหัสนักศึกษาซ้ำ (Deduplicate), ตรวจจับเครื่องที่ส่งซ้ำหลายรหัส และสรุปยอดแยกตามคณะ
 */
export function buildStudentTranscriptRoster(
  records: ParsedEvaluationRecord[],
  _krathongs: { id: string; owner_name: string }[] = []
): StudentTranscriptRoster {
  void _krathongs;
  const validStudentRows = records.filter((rec) => {
    const cleanSid = (rec.student_id || '').trim();
    return rec.user_type === 'student' && /^\d{8,13}$/.test(cleanSid);
  });

  // ตรวจจับ Device Token ที่ส่งมามากกว่า 1 รหัสนักศึกษา
  const deviceToStudentIds = new Map<string, Set<string>>();
  validStudentRows.forEach((rec) => {
    const did = (rec.device_id || '').trim();
    const sid = (rec.student_id || '').trim();
    if (did) {
      if (!deviceToStudentIds.has(did)) {
        deviceToStudentIds.set(did, new Set());
      }
      deviceToStudentIds.get(did)!.add(sid);
    }
  });

  // ตัดรหัสนักศึกษาซ้ำให้เหลือ 1 คนต่อ 1 รหัส (เก็บเฉพาะรหัสนักศึกษาและจำแนกคณะจากรหัส)
  const dedupedMap = new Map<string, StudentTranscriptEntry>();
  const chronological = [...validStudentRows].sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );

  chronological.forEach((rec) => {
    const sid = (rec.student_id || '').trim();
    const did = (rec.device_id || '').trim();
    const resolvedFaculty =
      guessFacultyFromStudentId(sid) || (rec.faculty || '').trim() || 'คณะ/หน่วยงานอื่นๆ';

    const sharedOnSameDevice = did ? (deviceToStudentIds.get(did)?.size || 0) > 1 : false;

    const existing = dedupedMap.get(sid);
    if (!existing) {
      dedupedMap.set(sid, {
        student_id: sid,
        student_name: '',
        faculty: resolvedFaculty,
        device_id: did,
        deviceStatus: sharedOnSameDevice ? 'shared_device' : 'verified',
        created_at: rec.created_at,
        krathong_id: rec.krathong_id || null
      });
    } else {
      if (
        (existing.faculty === 'ไม่ระบุคณะ' || existing.faculty === 'คณะ/หน่วยงานอื่นๆ') &&
        resolvedFaculty !== 'ไม่ระบุคณะ' &&
        resolvedFaculty !== 'คณะ/หน่วยงานอื่นๆ'
      ) {
        existing.faculty = resolvedFaculty;
      }
      if (sharedOnSameDevice) {
        existing.deviceStatus = 'shared_device';
      }
    }
  });

  const uniqueStudents = Array.from(dedupedMap.values()).sort((a, b) => {
    const facCmp = a.faculty.localeCompare(b.faculty, 'th');
    if (facCmp !== 0) return facCmp;
    return a.student_id.localeCompare(b.student_id);
  });

  const facultyCounts = new Map<string, number>();
  uniqueStudents.forEach((s) => {
    facultyCounts.set(s.faculty, (facultyCounts.get(s.faculty) || 0) + 1);
  });

  const totalUnique = uniqueStudents.length;
  const facultyBreakdown: FacultyCountRow[] = Array.from(facultyCounts.entries())
    .map(([faculty, count]) => ({
      faculty,
      count,
      percentage: totalUnique > 0 ? Number(((count / totalUnique) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count || a.faculty.localeCompare(b.faculty, 'th'));

  return {
    uniqueStudents,
    totalSubmittedStudentRows: validStudentRows.length,
    duplicateIdCount: Math.max(0, validStudentRows.length - totalUnique),
    sharedDeviceCount: uniqueStudents.filter((s) => s.deviceStatus === 'shared_device').length,
    facultyBreakdown
  };
}
