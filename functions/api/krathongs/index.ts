// functions/api/krathongs/index.ts
import { filterProfanity, sanitizeText, hashString } from '../../utils/security';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'approved';
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

  try {
    const { results } = await env.DB.prepare(`
      SELECT id, user_type, owner_name, wish_message, base_type, flower_type, candle_color, status, created_at
      FROM krathongs
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(status, limit).all();

    return new Response(JSON.stringify(results || []), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    const body = await request.json() as any;
    const { userType, ownerName, wishMessage, baseType, flowerType, candleColor } = body;

    if (!ownerName || !wishMessage || !userType) {
      return new Response(JSON.stringify({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }), { status: 400 });
    }

    const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const ipHash = await hashString(clientIP);

    // Rate Limiting (1 ครั้ง ใน 2 นาที)
    const recentCheck = await env.DB.prepare(
      `SELECT created_at FROM krathongs 
       WHERE ip_hash = ? AND created_at > datetime('now', '-2 minutes') 
       LIMIT 1`
    ).bind(ipHash).first();

    if (recentCheck) {
      return new Response(JSON.stringify({ error: 'คุณเพิ่งปล่อยกระทงไป กรุณารอ 2 นาทีเพื่อปล่อยใหม่อีกครั้ง' }), { status: 429 });
    }

    const cleanName = sanitizeText(ownerName).slice(0, 40);
    const cleanWish = sanitizeText(wishMessage).slice(0, 150);

    const hasBadWord = filterProfanity(cleanName) || filterProfanity(cleanWish);

    const setting = await env.DB.prepare(`SELECT value FROM system_settings WHERE key = 'require_approval'`).first<{ value: string }>();
    const requireApproval = setting?.value === 'true';

    let status = 'approved';
    if (hasBadWord) {
      status = 'rejected';
    } else if (requireApproval) {
      status = 'pending';
    }

    const krathongId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO krathongs (id, user_type, owner_name, wish_message, base_type, flower_type, candle_color, status, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      krathongId, userType, cleanName, cleanWish,
      baseType || 'banana_leaf', flowerType || 'lotus', candleColor || 'yellow',
      status, ipHash
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: krathongId,
      status: status,
      message: status === 'pending' ? 'กระทงของคุณกำลังรอการตรวจสอบจากผู้ดูแล' : 'ปล่อยกระทงสำเร็จแล้ว!'
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
