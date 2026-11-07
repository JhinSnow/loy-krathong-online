// functions/api/admin/moderate.ts
import { isAuthenticatedAdmin, getSecurityHeaders, sanitizeText } from '../../utils/security';

interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
  ALLOWED_ORIGIN?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = getSecurityHeaders(request, env);

  try {
    const rows = await env.DB.prepare(`
      SELECT key, value FROM system_settings WHERE key IN ('require_approval', 'moderation_overrides')
    `).all<{ key: string; value: string }>();

    let requireApproval = false;
    let overrides: Record<string, string> = {};

    for (const row of rows.results || []) {
      if (row.key === 'require_approval') {
        requireApproval = row.value === 'true';
      } else if (row.key === 'moderation_overrides') {
        try {
          overrides = JSON.parse(row.value || '{}');
        } catch {}
      }
    }

    return new Response(JSON.stringify({ requireApproval, overrides }), {
      status: 200,
      headers
    });
  } catch {
    return new Response(JSON.stringify({ requireApproval: false, overrides: {} }), {
      status: 200,
      headers
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = getSecurityHeaders(request, env);

  // ตรวจสอบสิทธิ์ Admin ก่อนดำเนินการทุกครั้ง
  const auth = await isAuthenticatedAdmin(request, env);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ error: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบผู้ดูแล' }), {
      status: 401,
      headers
    });
  }

  try {
    const body = await request.json() as any;
    const { action } = body;

    // 1. สลับโหมด Approval Mode ทั่วระบบ (รองรับทั้ง toggle_approval และ toggle_setting)
    if (action === 'toggle_approval' || action === 'toggle_setting') {
      const rawValue = body.requireApproval !== undefined ? body.requireApproval : body.value;
      const val = rawValue === true || rawValue === 'true' ? 'true' : 'false';

      await env.DB.prepare(`
        INSERT INTO system_settings (key, value, updated_at) 
        VALUES ('require_approval', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
      `).bind(val, val).run();

      return new Response(JSON.stringify({ success: true, requireApproval: val === 'true' }), {
        status: 200,
        headers
      });
    }

    // 2. อัปเดตสถานะของกระทง หรือลบกระทง (รองรับ update_status, approve, reject, delete)
    const krathongId = sanitizeText(body.krathongId || '', 64);
    if ((action === 'update_status' || action === 'approve' || action === 'reject' || action === 'delete') && krathongId) {
      let status: 'approved' | 'rejected' | 'deleted' = 'rejected';
      if (action === 'delete' || body.status === 'deleted') {
        status = 'deleted';
      } else if (action === 'approve' || body.status === 'approved') {
        status = 'approved';
      }

      if (status === 'deleted') {
        await env.DB.prepare(`DELETE FROM krathongs WHERE id = ?`).bind(krathongId).run();
      } else {
        await env.DB.prepare(`UPDATE krathongs SET status = ? WHERE id = ?`).bind(status, krathongId).run();
      }

      // บันทึกสถานะ Override ลง system_settings เพื่อให้ซิงค์กับรายการที่ดึงจาก Supabase ด้วย
      let overrides: Record<string, string> = {};
      try {
        const existing = await env.DB.prepare(
          `SELECT value FROM system_settings WHERE key = 'moderation_overrides'`
        ).first<{ value: string }>();
        if (existing?.value) {
          overrides = JSON.parse(existing.value);
        }
      } catch {}

      overrides[krathongId] = status;
      const overridesJson = JSON.stringify(overrides);

      await env.DB.prepare(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('moderation_overrides', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
      `).bind(overridesJson, overridesJson).run();

      return new Response(JSON.stringify({ success: true, krathongId, status, overrides }), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({ error: 'คำสั่งไม่ถูกต้อง' }), { status: 400, headers });
  } catch (err) {
    console.error('Admin Moderate Error:', err);
    return new Response(JSON.stringify({ error: 'ไม่สามารถดำเนินการแก้ไขข้อมูลได้' }), {
      status: 500,
      headers
    });
  }
};
