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

// Rate limit ป้องกันการปั๊มผลประเมินความพึงพอใจ
const evalRateLimitMap = new Map<string, number>();
const EVAL_COOLDOWN_MS = 60 * 1000; // 1 นาทีต่อ 1 การประเมินต่อ IP

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
    if (feedback) {
      const rawStr = String(feedback);
      if (rawStr.startsWith('__EVAL_V2__:')) {
        try {
          const parsed = JSON.parse(rawStr.slice('__EVAL_V2__:'.length));
          const safeComment = sanitizeText(String(parsed.comment || ''), 200);
          const safeStudentId = sanitizeText(String(parsed.student_id || ''), 20);
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
          cleanFeedback = sanitizeText(rawStr, 300);
        }
      } else {
        cleanFeedback = sanitizeText(rawStr, 300);
        if (cleanFeedback && filterProfanity(cleanFeedback)) {
          return new Response(JSON.stringify({ error: 'กรุณาใช้ถ้อยคำที่สุภาพในข้อเสนอแนะ' }), {
            status: 400,
            headers
          });
        }
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
