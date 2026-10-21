// functions/api/admin/moderate.ts
interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as any;
    const { action, krathongId, requireApproval } = body;

    // สลับโหมด Approval Mode ทั่วระบบ
    if (action === 'toggle_approval') {
      const val = requireApproval ? 'true' : 'false';
      await env.DB.prepare(`
        INSERT INTO system_settings (key, value, updated_at) 
        VALUES ('require_approval', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
      `).bind(val, val).run();

      return new Response(JSON.stringify({ success: true, requireApproval }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // อัปเดตสถานะของกระทง (approve / reject)
    if (action === 'update_status' && krathongId) {
      const status = body.status === 'approved' ? 'approved' : 'rejected';
      await env.DB.prepare(`
        UPDATE krathongs SET status = ? WHERE id = ?
      `).bind(status, krathongId).run();

      return new Response(JSON.stringify({ success: true, krathongId, status }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'คำสั่งไม่ถูกต้อง' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
