// functions/api/krathongs/stream.ts
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  let lastCheckedTime = new Date(Date.now() - 4000).toISOString();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: {"status":"connected"}\n\n`));

      const interval = setInterval(async () => {
        try {
          const { results } = await env.DB.prepare(`
            SELECT id, user_type, owner_name, wish_message, base_type, flower_type, candle_color, created_at
            FROM krathongs
            WHERE status = 'approved' AND created_at > ?
            ORDER BY created_at ASC
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
        } catch (e) {
          clearInterval(interval);
          try {
            controller.close();
          } catch (_) {}
        }
      }, 3000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
