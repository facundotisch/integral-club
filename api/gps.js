export const config = {
  runtime: 'edge',
};

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTT1xqcpoyD_LWD3oqbY-38nHpRKAJyX_DG5BBHJQPPVZIyInRTnXSYtYkj9V-1S7c/exec';

export default async function handler(req) {
  const url = new URL(req.url);
  const cat = url.searchParams.get('cat') || 'Cuarta';
  const refresh = url.searchParams.get('refresh') === '1';

  // Si se solicita refrescar, agregamos un timestamp para que Google no devuelva caché intermedia
  const cacheBuster = refresh ? `&_t=${Date.now()}` : '';
  const googleUrl = `${SCRIPT_URL}?api=1&cat=${encodeURIComponent(cat)}${cacheBuster}`;

  try {
    const res = await fetch(googleUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Google Apps Script respondió con status ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    if (refresh) {
      // Si el usuario forzó "Refrescar", no guardamos caché
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      // Vercel Edge CDN: Cachea la respuesta en el servidor Edge por 12 horas (43200s)
      // y revalida silenciosamente en segundo plano por hasta 24 horas (86400s)
      headers['Cache-Control'] = 'public, s-maxage=43200, stale-while-revalidate=86400';
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error de conexión con Google Apps Script' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
