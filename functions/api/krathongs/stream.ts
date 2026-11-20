// functions/api/krathongs/stream.ts
import { getSecurityHeaders } from '../../utils/security';

interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN?: string;
}

// Shared isolate-level cache (2.5s TTL) so hundreds of concurrent SSE viewers share 1 D1 query
let sharedRecentBatch: { fetchedAt: number; items: any[] } = {
  fetchedAt: 0,
  items: []
};
const STREAM_CACHE_TTL_MS = 2500;

async function getRecentApprovedKrathongs(env: Env, sinceIso: string): Promise<any[]> {
  const now = Date.now();
  if (now - sharedRecentBatch.fetchedAt >= STREAM_CACHE_TTL_MS) {
    const windowFloor = new Date(now - 15000).toISOString();
    const { results } = await env.DB.prepare(`
      SELECT id, user_type, owner_name, wish_message, base_type, flower_type, candle_color, created_at
      FROM krathongs
      WHERE status = 'approved' AND created_at > ?
      ORDER BY created_at ASC
      LIMIT 40
    `).bind(windowFloor).all();
    sharedRecentBatch = {
      fetchedAt: now,
      items: results || []
    };
  }
  return sharedRecentBatch.items.filter((item) => String(item.created_at || '') > sinceIso);
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
          const results = await getRecentApprovedKrathongs(env, lastCheckedTime);

          if (results.length > 0) {
            const latestCreatedAt = String(results[results.length - 1].created_at || new Date().toISOString());
            lastCheckedTime = latestCreatedAt;
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
