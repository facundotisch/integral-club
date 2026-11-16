export const config = {
  runtime: 'edge',
};

const CATEGORIAS = ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena'];

export default async function handler(req) {
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
  const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'https';
  const baseUrl = `${proto}://${host}`;

  const t0 = Date.now();

  const results = await Promise.all(
    CATEGORIAS.map(async (cat) => {
      const startCat = Date.now();
      try {
        const targetUrl = `${baseUrl}/api/gps?cat=${encodeURIComponent(cat)}`;
        const res = await fetch(targetUrl);
        const timeMs = Date.now() - startCat;
        const cache = res.headers.get('x-vercel-cache') || 'UNKNOWN';
        return {
          categoria: cat,
          status: res.status,
          timeMs,
          cache,
          ok: res.ok,
        };
      } catch (err) {
        return {
          categoria: cat,
          error: err.message,
          timeMs: Date.now() - startCat,
          ok: false,
        };
      }
    })
  );

  const totalTimeMs = Date.now() - t0;

  return new Response(
    JSON.stringify({
      message: 'Cache warmup ejecutado con éxito',
      programacion: '7:00 AM Argentina (10:00 UTC)',
      totalTimeMs,
      results,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
