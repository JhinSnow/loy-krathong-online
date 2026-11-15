// functions/api/evaluations/index.ts
import {
  sanitizeText,
  filterProfanity,
  hashClientIP,
  getSecurityHeaders,
  VALID_USER_TYPES
} from '../../utils/security';

interface Env {
  DB: D1Database;
  IP_HASH_SECRET?: string;
  ALLOWED_ORIGIN?: string;
}

// Rate limit สั้นป้องกันการกดเบิ้ลจาก IP เดียวกันโดยไม่บล็อก WiFi มหาวิทยาลัย
const evalRateLimitMap = new Map<string, number>();
const EVAL_COOLDOWN_MS = 3 * 1000; // 3 วินาทีต่อ 1 การประเมินต่อ IP (รองรับ Shared Campus NAT IP)

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = getSecurityHeaders(request, env);

  try {
    const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const ipHash = await hashClientIP(clientIP, env);

    const lastEvalTime = evalRateLimitMap.get(ipHash) || 0;
    if (Date.now() - lastEvalTime < EVAL_COOLDOWN_MS) {
      return new Response(
        JSON.stringify({ error: 'คุณเพิ่งส่งแบบประเมินไป ขอบคุณสำหรับความคิดเห็นครับ' }),
        { status: 429, headers }
      );
    }

    const body = await request.json() as any;
    const { krathongId, userType, rating, feedback } = body;

    const numericRating = Math.round(Number(rating));
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return new Response(JSON.stringify({ error: 'คะแนนประเมินต้องเป็นจำนวนเต็มระหว่าง 1-5' }), {
        status: 400,
        headers
      });
    }

    const validUserType = VALID_USER_TYPES.includes(userType) ? userType : 'general';
    const cleanKrathongId = krathongId ? sanitizeText(String(krathongId), 64) : null;

    let cleanFeedback: string | null = null;
    let extractedStudentId = '';
    if (feedback) {
      const rawStr = String(feedback).trim();
      if (rawStr.startsWith('__EVAL_V2__:')) {
        try {
          const parsed = JSON.parse(rawStr.slice('__EVAL_V2__:'.length));
          const safeComment = sanitizeText(String(parsed.comment || ''), 160);
          const safeStudentId = sanitizeText(String(parsed.student_id || ''), 15);
          extractedStudentId = safeStudentId;
          if (filterProfanity(safeComment) || filterProfanity(safeStudentId)) {
            return new Response(JSON.stringify({ error: 'กรุณาใช้ถ้อยคำที่สุภาพในข้อเสนอแนะ' }), {
              status: 400,
              headers
            });
          }
          cleanFeedback = `__EVAL_V2__:${JSON.stringify({
            student_id: safeStudentId,
            scores: parsed.scores || {},
            comment: safeComment
          })}`;
        } catch {
          cleanFeedback = sanitizeText(rawStr, 500);
        }
      } else if (rawStr.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawStr);
          const safeSid = String(parsed.sid || parsed.student_id || '').replace(/\D/g, '').slice(0, 15);
          const safeName = sanitizeText(String(parsed.name || parsed.student_name || ''), 60);
          const safeFac = sanitizeText(String(parsed.fac || parsed.faculty || ''), 60);
          const safeDid = String(parsed.did || parsed.device_id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
          const safeComment = sanitizeText(String(parsed.c || parsed.comment || ''), 140);
          extractedStudentId = safeSid;

          if (filterProfanity(safeComment) || filterProfanity(safeName)) {
            return new Response(JSON.stringify({ error: 'กรุณาใช้ถ้อยคำที่สุภาพในข้อเสนอแนะ' }), {
              status: 400,
              headers
            });
          }

          const safeScores = Array.isArray(parsed.s) && parsed.s.length === 10
            ? parsed.s.map((n: any) => Math.min(Math.max(Math.round(Number(n) || 5), 1), 5))
            : Array(10).fill(numericRating);

          const normalizedObj: Record<string, unknown> = { s: safeScores, sid: safeSid };
          if (safeName) normalizedObj.name = safeName;
          if (safeFac) normalizedObj.fac = safeFac;
          if (safeDid) normalizedObj.did = safeDid;
          normalizedObj.c = safeComment;
          cleanFeedback = JSON.stringify(normalizedObj).slice(0, 500);
        } catch {
          cleanFeedback = sanitizeText(rawStr, 500);
        }
      } else {
        cleanFeedback = sanitizeText(rawStr, 500);
        if (cleanFeedback && filterProfanity(cleanFeedback)) {
          return new Response(JSON.stringify({ error: 'กรุณาใช้ถ้อยคำที่สุภาพในข้อเสนอแนะ' }), {
            status: 400,
            headers
          });
        }
      }
    }

    // ตรวจสอบรหัสนักศึกษาซ้ำใน D1 (เฉพาะนักศึกษาที่มีรหัสถูกต้อง)
    if (validUserType === 'student' && /^\d{8,13}$/.test(extractedStudentId)) {
      const existingStudent = await env.DB.prepare(
        `SELECT id FROM evaluations WHERE user_type = 'student' AND feedback LIKE ? LIMIT 1`
      ).bind(`%"sid":"${extractedStudentId}"%`).first();

      if (existingStudent) {
        return new Response(
          JSON.stringify({
            error: `รหัสนักศึกษา ${extractedStudentId} ได้ลงทะเบียนบันทึกชั่วโมงกิจกรรมไปแล้ว`
          }),
          { status: 409, headers }
        );
      }
    }

    const evalId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO evaluations (id, krathong_id, user_type, rating, feedback)
      VALUES (?, ?, ?, ?, ?)
    `).bind(evalId, cleanKrathongId, validUserType, numericRating, cleanFeedback).run();

    evalRateLimitMap.set(ipHash, Date.now());

    return new Response(JSON.stringify({ success: true, id: evalId }), {
      status: 201,
      headers
    });
  } catch (err) {
    console.error('Evaluation Submit Error:', err);
    return new Response(JSON.stringify({ error: 'ไม่สามารถบันทึกผลประเมินได้ในขณะนี้' }), {
      status: 500,
      headers
    });
  }
};
