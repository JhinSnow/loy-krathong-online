// functions/api/krathongs/index.ts
import {
  filterProfanity,
  sanitizeText,
  hashClientIP,
  isAuthenticatedAdmin,
  getSecurityHeaders,
  VALID_USER_TYPES,
  VALID_KRATHONG_MODELS,
  VALID_FLOWER_DECORS,
  isValidCandleField
} from '../../utils/security';

interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
  IP_HASH_SECRET?: string;
  ALLOWED_ORIGIN?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const headers = getSecurityHeaders(request, env);
  const url = new URL(request.url);
  const requestedStatus = url.searchParams.get('status') || 'approved';
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);

  // หากร้องขอดูกระทงที่ยังไม่อนุมัติ (pending / rejected / all) ต้องเป็น Admin เท่านั้น
  let statusFilter = 'approved';
  if (requestedStatus !== 'approved') {
    const auth = await isAuthenticatedAdmin(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: 'ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลสถานะนี้' }), {
        status: 403,
        headers
      });
    }
    if (['pending', 'rejected', 'approved'].includes(requestedStatus)) {
      statusFilter = requestedStatus;
    }
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT id, user_type, owner_name, wish_message, base_type, flower_type, candle_color, status, created_at
      FROM krathongs
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(statusFilter, limit).all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers
    });
  } catch (err) {
    console.error('Get Krathongs Error:', err);
    return new Response(JSON.stringify({ error: 'ไม่สามารถดึงข้อมูลกระทงได้' }), {
      status: 500,
      headers
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = getSecurityHeaders(request, env);

  try {
    const body = await request.json() as any;
    const rawUserType = body.userType || body.user_type;
    const rawOwnerName = body.ownerName || body.owner_name;
    const rawWishMessage = body.wishMessage || body.wish_message;
    const rawBaseType = body.krathongModel || body.krathong_model || body.baseType || body.base_type;
    const rawFlowerType = body.flowerDecor || body.flower_decor || body.flowerType || body.flower_type;
    const rawCandleColor = body.candleStyle || body.candle_style || body.candleColor || body.candle_color;

    if (!rawOwnerName || !rawWishMessage || !rawUserType) {
      return new Response(JSON.stringify({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }), {
        status: 400,
        headers
      });
    }

    // ตรวจสอบ Whitelist ของตัวเลือกเพื่อป้องกันการส่งค่าแปลกปลอม
    const userType = VALID_USER_TYPES.includes(rawUserType) ? rawUserType : 'general';
    const baseType = VALID_KRATHONG_MODELS.includes(rawBaseType) ? rawBaseType : 'banana_leaf';
    const flowerType = VALID_FLOWER_DECORS.includes(rawFlowerType) ? rawFlowerType : 'lotus_flower';
    const candleColor = isValidCandleField(rawCandleColor) ? rawCandleColor : 'yellow';

    const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const ipHash = await hashClientIP(clientIP, env);

    // Rate Limiting (1 ครั้ง ใน 2 นาที ต่อ IP)
    const recentCheck = await env.DB.prepare(
      `SELECT created_at FROM krathongs 
       WHERE ip_hash = ? AND created_at > datetime('now', '-2 minutes') 
       LIMIT 1`
    ).bind(ipHash).first();

    if (recentCheck) {
      return new Response(
        JSON.stringify({ error: 'คุณเพิ่งปล่อยกระทงไป กรุณารอ 2 นาทีเพื่อปล่อยใหม่อีกครั้ง' }),
        { status: 429, headers }
      );
    }

    const cleanName = sanitizeText(rawOwnerName, 50);
    const cleanWish = sanitizeText(rawWishMessage, 120);

    if (!cleanName || !cleanWish) {
      return new Response(JSON.stringify({ error: 'ข้อมูลชื่อหรือคำอธิษฐานไม่ถูกต้อง' }), {
        status: 400,
        headers
      });
    }

    const hasBadWord = filterProfanity(cleanName) || filterProfanity(cleanWish);
    if (hasBadWord) {
      return new Response(
        JSON.stringify({ error: 'พบถ้อยคำไม่สุภาพ กรุณาใช้ถ้อยคำที่เหมาะสมในเทศกาลลอยกระทง' }),
        { status: 400, headers }
      );
    }

    const setting = await env.DB.prepare(
      `SELECT value FROM system_settings WHERE key = 'require_approval'`
    ).first<{ value: string }>();
    const requireApproval = setting?.value === 'true';

    const status = requireApproval ? 'pending' : 'approved';
    const krathongId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO krathongs (id, user_type, owner_name, wish_message, base_type, flower_type, candle_color, status, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      krathongId, userType, cleanName, cleanWish,
      baseType, flowerType, candleColor,
      status, ipHash
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: krathongId,
      status,
      message: status === 'pending'
        ? 'กระทงของคุณกำลังรอการตรวจสอบจากผู้ดูแล'
        : 'ปล่อยกระทงสำเร็จแล้ว!'
    }), {
      status: 201,
      headers
    });
  } catch (err) {
    console.error('Create Krathong Error:', err);
    return new Response(JSON.stringify({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลกระทง' }), {
      status: 500,
      headers
    });
  }
};
