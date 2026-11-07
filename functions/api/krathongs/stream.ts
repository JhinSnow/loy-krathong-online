// functions/api/krathongs/stream.ts
import { getSecurityHeaders } from '../../utils/security';

interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  let lastCheckedTime = new Date(Date.now() - 4000).toISOString();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // เคลียร์ Interval ทันทีเมื่อ Client ตัดการเชื่อมต่อ (ป้องกัน Memory / Timer Leak)
  request.signal.addEventListener('abort', cleanup);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: {"status":"connected"}\n\n`));

      intervalId = setInterval(async () => {
        if (request.signal.aborted) {
          cleanup();
          return;
        }
        try {
          const { results } = await env.DB.prepare(`
            SELECT id, user_type, owner_name, wish_message, base_type, flower_type, candle_color, created_at
            FROM krathongs
            WHERE status = 'approved' AND created_at > ?
            ORDER BY created_at ASC
            LIMIT 25
          `).bind(lastCheckedTime).all();

          if (results && results.length > 0) {
            lastCheckedTime = new Date().toISOString();
            for (const item of results) {
              const data = JSON.stringify(item);
              controller.enqueue(encoder.encode(`event: new_krathong\ndata: ${data}\n\n`));
            }
          } else {
            // Heartbeat
            controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        } catch {
          cleanup();
          try {
            controller.close();
          } catch {}
        }
      }, 3000);
    },
    cancel() {
      cleanup();
    }
  });

  const baseHeaders = getSecurityHeaders(request, env, 'text/event-stream');
  return new Response(stream, {
    headers: {
      ...baseHeaders,
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
};
