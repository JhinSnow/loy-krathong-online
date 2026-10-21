// functions/api/admin/auth.ts
import { hashString } from '../../utils/security';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const { username, password } = await request.json() as any;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'กรุณากรอก Username และ Password' }), { status: 400 });
    }

    const passwordHash = await hashString(password);

    const user = await env.DB.prepare(`
      SELECT username, role FROM admin_users 
      WHERE username = ? AND password_hash = ?
    `).bind(username, passwordHash).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }), { status: 401 });
    }

    return new Response(JSON.stringify({
      success: true,
      user: { username: user.username, role: user.role }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `admin_session=${user.username}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
