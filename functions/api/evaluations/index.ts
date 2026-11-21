// functions/api/evaluations/index.ts
import {
  sanitizeText,
  filterProfanity,
  hashClientIP,
  isAuthenticatedAdmin,
  getSecurityHeaders,
  VALID_USER_TYPES
} from '../../utils/security';

interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
  IP_HASH_SECRET?: string;
  ALLOWED_ORIGIN?: string;
}

// Rate limit สั้นป้องกันการกดเบิ้ลจากเครื่องเดียวกันโดยไม่บล็อก WiFi มหาวิทยาลัย (Shared Campus NAT IP)
const evalRateLimitMap = new Map<string, number>();
const EVAL_COOLDOWN_MS = 3 * 1000; // 3 วินาทีต่อ 1 การประเมินต่อเครื่อง (IP + Device ID)

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = getSecurityHeaders(request, env);

  const auth = await isAuthenticatedAdmin(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ error: 'ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลแบบประเมิน' }), {
      status: 403,
      headers
    });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 1000, 1), 5000);

  try {
    const { results } = await env.DB.prepare(`
      SELECT id, krathong_id, user_type, rating, feedback, created_at
      FROM evaluations
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers
    });
  } catch (err) {
    console.error('Get Evaluations Error:', err);
    return new Response(JSON.stringify({ error: 'ไม่สามารถดึงข้อมูลแบบประเมินได้' }), {
      status: 500,
      headers
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = getSecurityHeaders(request, env);

  try {
    const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const body = await request.json() as any;
    const { krathongId, userType, rating, feedback } = body;
    const rawBodyDeviceId = String(body.deviceId || body.device_id || '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 28);

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
    let extractedDeviceId = rawBodyDeviceId;
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

          if (parsed?.v === 3) {
            const safeSid = String(parsed.sid || '').replace(/\D/g, '').slice(0, 15);
            const safeFac = sanitizeText(String(parsed.fac || ''), 50);
            let safeMaj = sanitizeText(String(parsed.maj || ''), 60);
            const safeYr = ['1', '2', '3', '4', 'm'].includes(String(parsed.yr || ''))
              ? String(parsed.yr)
              : '';
            let safeRl = sanitizeText(String(parsed.rl || ''), 50);
            const safeDid = String(parsed.did || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
            let safeC1 = sanitizeText(String(parsed.c1 || ''), 150);
            let safeC2 = sanitizeText(String(parsed.c2 || ''), 150);
            let safeC3 = sanitizeText(String(parsed.c3 || ''), 100);

            extractedStudentId = safeSid;
            if (safeDid) extractedDeviceId = safeDid;

            if (
              filterProfanity(safeMaj) ||
              filterProfanity(safeRl) ||
              filterProfanity(safeC1) ||
              filterProfanity(safeC2) ||
              filterProfanity(safeC3)
            ) {
              return new Response(JSON.stringify({ error: 'กรุณาใช้ถ้อยคำที่สุภาพในข้อเสนอแนะและข้อมูลผู้ตอบ' }), {
                status: 400,
                headers
              });
            }

            const normalizeDigitSeq = (input: unknown, expectedLen: number, fallbackDigit: number): string => {
              if (typeof input === 'string' && new RegExp(`^[1-5]{${expectedLen}}$`).test(input)) {
                return input;
              }
              if (Array.isArray(input) && input.length === expectedLen) {
                return input
                  .map((n: unknown) => String(Math.min(Math.max(Math.round(Number(n) || fallbackDigit), 1), 5)))
                  .join('');
              }
              return String(fallbackDigit).repeat(expectedLen);
            };

            const safeCore = normalizeDigitSeq(parsed.s, 36, numericRating);
            const hasCommunity =
              (typeof parsed.cs === 'string' && parsed.cs.length === 4) ||
              (Array.isArray(parsed.cs) && parsed.cs.length === 4);
            const safeCommunity = hasCommunity ? normalizeDigitSeq(parsed.cs, 4, numericRating) : '';

            let safeSdg = '0000000';
            if (typeof parsed.sdg === 'string' && /^[01]{7}$/.test(parsed.sdg)) {
              safeSdg = parsed.sdg;
            } else if (Array.isArray(parsed.sdg) && parsed.sdg.length === 7) {
              safeSdg = parsed.sdg.map((v: unknown) => (v === 1 || v === true || v === '1' ? '1' : '0')).join('');
            }

            const normalizedObj: Record<string, unknown> = {
              v: 3,
              pd: parsed.pd === 1 || parsed.pd === true ? 1 : 0,
              s: safeCore,
              sdg: safeSdg,
              sid: safeSid
            };
            if (safeCommunity) normalizedObj.cs = safeCommunity;
            if (safeFac) normalizedObj.fac = safeFac;
            if (safeYr) normalizedObj.yr = safeYr;
            if (safeDid) normalizedObj.did = safeDid;

            const buildBoundedV3 = () => {
              if (safeMaj) normalizedObj.maj = safeMaj;
              else delete normalizedObj.maj;
              if (safeRl) normalizedObj.rl = safeRl;
              else delete normalizedObj.rl;
              if (safeC1) normalizedObj.c1 = safeC1;
              else delete normalizedObj.c1;
              if (safeC2) normalizedObj.c2 = safeC2;
              else delete normalizedObj.c2;
              if (safeC3) normalizedObj.c3 = safeC3;
              else delete normalizedObj.c3;
              return JSON.stringify(normalizedObj);
            };

            let bounded = buildBoundedV3();
            while (bounded.length > 980) {
              if (safeC3.length > 0) {
                safeC3 = safeC3.slice(0, Math.max(0, safeC3.length - Math.max(10, bounded.length - 980)));
              } else if (safeC2.length > 0) {
                safeC2 = safeC2.slice(0, Math.max(0, safeC2.length - Math.max(10, bounded.length - 980)));
              } else if (safeC1.length > 0) {
                safeC1 = safeC1.slice(0, Math.max(0, safeC1.length - Math.max(10, bounded.length - 980)));
              } else if (safeRl.length > 20) {
                safeRl = safeRl.slice(0, safeRl.length - 10);
              } else if (safeMaj.length > 20) {
                safeMaj = safeMaj.slice(0, safeMaj.length - 10);
              } else {
                break;
              }
              bounded = buildBoundedV3();
            }
            cleanFeedback = bounded;
          } else {
            const safeSid = String(parsed.sid || parsed.student_id || '').replace(/\D/g, '').slice(0, 15);
            const safeName = sanitizeText(String(parsed.name || parsed.student_name || ''), 60);
            const safeFac = sanitizeText(String(parsed.fac || parsed.faculty || ''), 60);
            const safeDid = String(parsed.did || parsed.device_id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
            const safeComment = sanitizeText(String(parsed.c || parsed.comment || ''), 140);
            extractedStudentId = safeSid;
            if (safeDid) extractedDeviceId = safeDid;

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
          }
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

    // ตรวจสอบ Cooldown 3 วินาทีแบบแยกตามเครื่อง (IP + Device ID / Student ID / Krathong ID) เพื่อรองรับ Campus WiFi 1,000+ คน
    const uniqueClientUnit = extractedDeviceId || extractedStudentId || cleanKrathongId || 'anon';
    const rateKey = await hashClientIP(`${clientIP}:${uniqueClientUnit}`, env);
    const lastEvalTime = evalRateLimitMap.get(rateKey) || 0;
    if (Date.now() - lastEvalTime < EVAL_COOLDOWN_MS) {
      return new Response(
        JSON.stringify({ error: 'คุณเพิ่งส่งแบบประเมินไป ขอบคุณสำหรับความคิดเห็นครับ' }),
        { status: 429, headers }
      );
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

    if (evalRateLimitMap.size > 5000) {
      evalRateLimitMap.clear();
    }
    evalRateLimitMap.set(rateKey, Date.now());

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
