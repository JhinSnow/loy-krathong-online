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

export interface ParsedEvaluationRecord {
  id: string;
  krathong_id?: string | null;
  user_type: 'student' | 'staff' | 'general' | string;
  student_id: string;
  scores: number[]; // ความยาว 10 ข้อ (index 0..9)
  average_score: number;
  comment: string;
  created_at: string;
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
 * เข้ารหัสข้อมูลประเมิน 10 ข้อ + รหัสนักศึกษา + ข้อเสนอแนะ ลงในฟิลด์ feedback (JSON string)
 * เพื่อให้บันทึกเข้าตาราง evaluations เดิมของ Supabase และ Cloudflare D1 ได้ทันทีโดยไม่ต้องแก้โครงสร้างตาราง
 */
export function encodeEvaluationPayload(
  scores: number[],
  studentId: string,
  comment: string
): string {
  const safeScores = EVALUATION_QUESTIONS.map((_, idx) => {
    const val = Math.round(Number(scores[idx]) || 5);
    return Math.min(Math.max(val, 1), 5);
  });

  return JSON.stringify({
    s: safeScores,
    sid: (studentId || '').trim().slice(0, 20),
    c: (comment || '').trim().slice(0, 180)
  });
}

/**
 * แปลงแถวข้อมูลจากฐานข้อมูล (ทั้งรูปแบบใหม่ JSON 10 ข้อ, __EVAL_V2__ และรูปแบบเดิมคะแนนเดี่ยว) ให้เป็น ParsedEvaluationRecord
 */
export function parseEvaluationRow(raw: any, index = 0): ParsedEvaluationRecord {
  const baseRating = Math.min(Math.max(Math.round(Number(raw?.rating) || 5), 1), 5);
  let scores: number[] = Array(10).fill(baseRating);
  let studentId = '';
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
    comment = raw.comment || rawFeedback;
  } else {
    comment = rawFeedback;
  }

  const avg = Number((scores.reduce((a, b) => a + b, 0) / 10).toFixed(2));

  return {
    id: raw?.id || `eval-${index + 1}`,
    krathong_id: raw?.krathong_id || null,
    user_type: raw?.user_type || 'general',
    student_id: studentId,
    scores,
    average_score: avg,
    comment,
    created_at: raw?.created_at || new Date().toISOString()
  };
}

const LOCAL_EVAL_STORAGE_KEY = 'loy_krathong_evaluations_10q_v1';
const LOCAL_KRATHONG_STORAGE_KEY = 'loy_krathong_items_v1';
const LOCAL_APPROVAL_SETTING_KEY = 'loy_krathong_require_approval_v1';
const LOCAL_MODERATION_OVERRIDES_KEY = 'loy_krathong_moderation_overrides_v1';

// รายการ ID ทดสอบระบบที่ซ่อนเริ่มต้นโดยอัตโนมัติ
const DEFAULT_HIDDEN_IDS: Record<string, 'approved' | 'rejected' | 'deleted'> = {
  'f2d13964-5717-4aea-b14d-d6ad1c8a40b0': 'deleted'
};

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
    const existing = getLocalKrathongRecords();
    const filtered = existing.filter((item) => item.id !== record.id);
    const updated = [record, ...filtered].slice(0, 500);
    localStorage.setItem(LOCAL_KRATHONG_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getLocalKrathongRecords(): LocalKrathongRecord[] {
  try {
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
    const updated = [record, ...existing].slice(0, 500);
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
      scores: [5, 5, 5, 5, 4, 5, 5, 5, 5, 5],
      comment: 'จัดงานบรรยากาศดีมากครับ ชอบระบบลอยกระทงออนไลน์ขึ้นจอหน้าตึกฟักทอง ลดขยะได้ดีมาก',
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
    },
    {
      id: 'demo-2',
      user_type: 'student',
      student_id: '6510210118',
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
