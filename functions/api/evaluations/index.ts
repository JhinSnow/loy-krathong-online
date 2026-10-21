// functions/api/evaluations/index.ts
import { sanitizeText } from '../../utils/security';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as any;
    const { krathongId, userType, rating, feedback } = body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return new Response(JSON.stringify({ error: 'คะแนนประเมินต้องอยู่ระหว่าง 1-5' }), { status: 400 });
    }

    const evalId = crypto.randomUUID();
    const cleanFeedback = feedback ? sanitizeText(feedback).slice(0, 500) : null;

    await env.DB.prepare(`
      INSERT INTO evaluations (id, krathong_id, user_type, rating, feedback)
      VALUES (?, ?, ?, ?, ?)
    `).bind(evalId, krathongId || null, userType || 'general', numericRating, cleanFeedback).run();

    return new Response(JSON.stringify({ success: true, id: evalId }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
