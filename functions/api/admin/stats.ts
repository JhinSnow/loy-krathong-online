// functions/api/admin/stats.ts
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // 1. ผู้ใช้ทั้งหมด แยกตามประเภท
    const { results: userStats } = await env.DB.prepare(`
      SELECT user_type, count(*) as count 
      FROM krathongs 
      GROUP BY user_type
    `).all();

    // 2. สถานะกระทง (approved, pending, rejected)
    const { results: statusStats } = await env.DB.prepare(`
      SELECT status, count(*) as count 
      FROM krathongs 
      GROUP BY status
    `).all();

    // 3. คะแนนความพึงพอใจเฉลี่ย
    const ratingSummary = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 2) as average_rating
      FROM evaluations
    `).first();

    // 4. สรุปคะแนนแยกรายดาว (1-5)
    const { results: ratingDistribution } = await env.DB.prepare(`
      SELECT rating, count(*) as count 
      FROM evaluations 
      GROUP BY rating 
      ORDER BY rating DESC
    `).all();

    // 5. รายการความคิดเห็นล่าสุด
    const { results: recentFeedbacks } = await env.DB.prepare(`
      SELECT user_type, rating, feedback, created_at 
      FROM evaluations 
      WHERE feedback IS NOT NULL AND feedback != ''
      ORDER BY created_at DESC 
      LIMIT 15
    `).all();

    // 6. การตั้งค่าระบบปัจจุบัน
    const setting = await env.DB.prepare(`
      SELECT value FROM system_settings WHERE key = 'require_approval'
    `).first<{ value: string }>();

    return new Response(JSON.stringify({
      userStats,
      statusStats,
      ratingSummary,
      ratingDistribution,
      recentFeedbacks,
      requireApproval: setting?.value === 'true'
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
