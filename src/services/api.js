// URL del Web App de Google Apps Script que devuelve el JSON
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTT1xqcpoyD_LWD3oqbY-38nHpRKAJyX_DG5BBHJQPPVZIyInRTnXSYtYkj9V-1S7c/exec';

const memoryCache = {};
const inflightPromises = {};

/**
 * Detecta si un registro es un GPS comodín o placeholder de planilla
 * (ej: '1 jugador', '2 jugador', '3 jugador', '4 jugador', 'comodin', '33 33', etc.)
 */
export function isComodin(n) {
  if (!n) return true;
  const s = String(n).trim().toLowerCase();
  if (!s || s === '-' || s === 'null' || s === 'undefined') return true;
  if (/^\d+\s*jugador(?:es)?$/i.test(s)) return true;
  if (/^jugador(?:es)?$/i.test(s)) return true;
  if (/comod[ií]n/i.test(s)) return true;
  if (/^gps\s*\d*$/i.test(s)) return true;
  if (/^\d+(\s+\d+)?$/.test(s)) return true;
  return false;
}

/**
 * Purga de raíz todos los comodines de la estructura de datos
 */
export function sanitizeComodines(payload) {
  if (!payload) return payload;
  const d = payload.data || payload;

  if (Array.isArray(d.roster)) {
    d.roster = d.roster.filter(n => !isComodin(n));
  }

  if (d.jugadores && typeof d.jugadores === 'object') {
    Object.keys(d.jugadores).forEach(k => {
      if (isComodin(k)) {
        delete d.jugadores[k];
      }
    });
  }

  if (Array.isArray(d.sesiones)) {
    d.sesiones.forEach(s => {
      if (Array.isArray(s.jugadores)) {
        s.jugadores = s.jugadores.filter(j => j && !isComodin(j.jugador));
      }
    });
  }

  return payload;
}

export const RESERVA_CT_CSV_URL = 'https://docs.google.com/spreadsheets/d/10cZ1G8jP5swkVj_nCAR7dm5k3SNeEM6H/export?format=csv&gid=1426510180';

export const RESERVA_CT_POSITIONS = {
  'luciano naranjo': 'DC',
  'gonzalo escudero': 'DC',
  'galo volpe': 'DL',
  'samir meza': 'DL',
  'felipe schaare': 'VC',
  'francisco fraga': 'CD',
  'gonzalo leiva': 'CD',
  'gonzalo sosa': 'VM',
  'joaquin doval': 'VC',
  'mateo carmona': 'DC',
  'luciano aguero': 'DC',
  'felipe igon': 'VM',
  'tello lautaro': 'DL',
  'lautaro tello': 'DL',
  'alejandro tello': 'DL',
  'bautista castreje': 'VM',
  'bautista perez': 'CD',
  'ezequiel perez': 'CD',
  'thiago taborda': 'E',
  'santino aguirre': 'VM',
  'leandro milito': 'CD',
  'mateo martinez': 'DL',
  'alexis yegros': 'VM',
  'benjamin gonzalez': 'DC',
  'joan velazquez': 'E',
  'tomas perez': 'CD',
  'lautaro rivas': 'DL',
  'dante deraco': 'VM',
  'fausto macias': 'CD',
  'santiago ranalli': 'CD',
  'lucas alvarez': 'CD',
  'mateo melluso': 'VM',
  'diego villalba': 'E',
  'matias acevedo': 'E',
  '2 acevedo': 'E',
  'axel cabellos': 'DL',
  'alberto campo': 'E'
};

export function resolveCTPos(playerName) {
  if (!playerName) return 'DC';
  const clean = String(playerName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return RESERVA_CT_POSITIONS[clean] || 'DC';
}

export function formatCTRival(rivalStr) {
  if (!rivalStr) return 'Rival';
  const clean = String(rivalStr).trim().toUpperCase();
  const map = {
    'BARRACAS CENTRAL': 'Barracas Central',
    'GIMNASIA (MZA)': 'Gimnasia (Mza)',
    'GODOY CRUZ': 'Godoy Cruz',
    'ATL. TUCUMAN': 'Atlético Tucumán',
    'A TUCUMAN': 'Atlético Tucumán',
    'UNION': 'Unión',
    'GELP': 'Gimnasia LP',
    'GIMNASIA LP': 'Gimnasia LP',
    'ALDOSIVI': 'Aldosivi',
    'AAAJ': 'Argentinos Juniors',
    'SARMIENTO': 'Sarmiento',
    'INDEPENDIENTE': 'Independiente',
    'INDEPENDIENTE (CUARTOS)': 'Independiente (Cuartos)',
    'INSTITUTO': 'Instituto',
    'RIVER': 'River Plate',
    'VELEZ': 'Vélez Sarsfield',
    'SAN LORENZO': 'San Lorenzo',
    'TIGRE': 'Tigre',
    'R. CENTRAL': 'Rosario Central',
    'ROSARIO CENTRAL': 'Rosario Central',
    'BANFIELD': 'Banfield',
    'TALLERES': 'Talleres',
    'FINAL VS RIVER': 'River Plate (Final)'
  };
  return map[clean] || (rivalStr.charAt(0).toUpperCase() + rivalStr.slice(1).toLowerCase());
}

export function formatCTFecha(fechaRaw) {
  if (!fechaRaw) return 'Oficial';
  const str = String(fechaRaw).trim();
  const matchDM = str.match(/^(\d{1,2})-(\d{1,2})$/);
  if (matchDM) {
    const d = matchDM[1].padStart(2, '0');
    const m = matchDM[2].padStart(2, '0');
    return `${d}/${m}/2026`;
  }
  if (/^\d+$/.test(str)) {
    return `Fecha ${str}`;
  }
  if (str.toLowerCase().includes('final')) {
    return 'Final 2026';
  }
  return str;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  return lines.map(line => {
    const row = [];
    let inQuotes = false;
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    row.push(cur.trim());
    return row;
  });
}

export async function fetchReservaCTData(forceRefresh = false) {
  const cacheKey = 'integral_reserva_ct_v2';
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && (Date.now() - parsed.timestamp < 10 * 60 * 1000) && parsed.sesiones) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  const res = await fetch(RESERVA_CT_CSV_URL);
  if (!res.ok) {
    throw new Error(`Error al descargar planilla Reserva CT: ${res.status}`);
  }
  const text = await res.text();
  const rows = parseCSV(text);

  const matchGroups = new Map();
  const rosterSet = new Set();
  const jugadoresMap = {};

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 5) continue;
    let player = r[0];
    if (!player) continue;

    if (player.toLowerCase() === '2 acevedo') player = 'Matías Acevedo';
    if (player.toLowerCase() === 'matias acevedo') player = 'Matías Acevedo';
    if (player.toLowerCase() === 'tello lautaro') player = 'Lautaro Tello';

    rosterSet.add(player);

    const fechaRaw = r[2] || '';
    const rivalRaw = r[3] || 'Rival';
    const dist = parseFloat(r[4]) || 0;
    const drel = parseFloat(r[5]) || 0;
    const min = drel > 0 ? Math.round(dist / drel) : 0;
    const hi = (parseFloat(r[11]) || 0) + (parseFloat(r[12]) || 0);
    const z1618 = parseFloat(r[10]) || 0;
    const z1825 = parseFloat(r[11]) || 0;
    const s25 = parseFloat(r[12]) || 0;
    const accAlta = parseFloat(r[13]) || 0;
    const decAlta = parseFloat(r[14]) || 0;
    const topSpeed = parseFloat(r[17]) || 0;
    const sprints = parseFloat(r[18]) || 0;
    const mp20 = parseFloat(r[6]) || 0;
    const mp55 = parseFloat(r[7]) || 0;
    const mphi = parseFloat(r[8]) || 0;

    const pos = r[1] || resolveCTPos(player);
    const fechaFmt = formatCTFecha(fechaRaw);
    const rivalFmt = formatCTRival(rivalRaw);

    const key = `${fechaRaw}_${rivalRaw}`.toLowerCase();
    if (!matchGroups.has(key)) {
      matchGroups.set(key, {
        fecha: fechaFmt,
        fechaRaw,
        tipo: 'Partido',
        per: 'MD',
        dia: 'Reserva (CT Oficial)',
        rival: rivalFmt,
        rivalRaw,
        origenCT: 'Segundo CT',
        jugadores: []
      });
    }

    matchGroups.get(key).jugadores.push({
      jugador: player,
      pos,
      min,
      dist,
      drel,
      hi,
      z1618,
      z1825,
      s25,
      accAlta,
      decAlta,
      topSpeed,
      sprints,
      mp20,
      mp55,
      mphi,
      rival: rivalFmt
    });

    if (!jugadoresMap[player]) {
      jugadoresMap[player] = [];
    }
    jugadoresMap[player].push({
      fecha: fechaFmt,
      fechaRaw,
      rival: rivalFmt,
      tipo: 'Partido',
      per: 'MD',
      pos,
      min,
      dist,
      drel,
      hi,
      z1618,
      z1825,
      s25,
      accAlta,
      decAlta,
      topSpeed,
      sprints,
      mp20,
      mp55,
      mphi
    });
  }

  const result = {
    timestamp: Date.now(),
    sesiones: Array.from(matchGroups.values()),
    roster: Array.from(rosterSet),
    jugadores: jugadoresMap
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (e) {}

  return result;
}

/**
 * Comprueba si una categoría ya se encuentra lista en memoria o en caché local
 */
export function isCategoryCached(category) {
  if (memoryCache[category]) return true;
  try {
    const cached = localStorage.getItem(`integral_data_v16_${category}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.timestamp && (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) && (parsed.payload && (parsed.payload.data || parsed.payload.sesiones))) {
        return true;
      }
    }
  } catch {}

  const catSlug = String(category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (['cuarta', 'quinta', 'sexta', 'septima', 'octava', 'novena', 'reserva'].includes(catSlug)) {
    return true;
  }
  return false;
}

export async function fetchCategoryData(category = 'Séptima', forceRefresh = false) {
  if (!forceRefresh && memoryCache[category]) {
    return memoryCache[category];
  }

  // Si ya hay una petición en vuelo hacia Google para esta misma categoría, reutilizarla
  if (!forceRefresh && inflightPromises[category]) {
    return inflightPromises[category];
  }

  // Leer de localStorage si existe (válido por 12 horas para respuesta instantánea)
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(`integral_data_v16_${category}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) && (parsed.payload && (parsed.payload.data || parsed.payload.sesiones))) {
          const sanitized = sanitizeComodines(parsed.payload);
          memoryCache[category] = sanitized;
          return sanitized;
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  if (forceRefresh) {
    delete memoryCache[category];
    delete inflightPromises[category];
    try {
      localStorage.removeItem(`integral_data_v16_${category}`);
      if (category === 'Reserva') {
        localStorage.removeItem('integral_reserva_ct_v2');
      }
    } catch (e) {}
  }

  const promise = fetchAndCache(category, forceRefresh).finally(() => {
    delete inflightPromises[category];
  });
  inflightPromises[category] = promise;
  return await promise;
}

async function fetchAndCache(category, forceRefresh = false) {
  // Si la categoría es Reserva, descargamos en paralelo la planilla del segundo CT
  let ctPromise = null;
  if (category === 'Reserva') {
    ctPromise = fetchReservaCTData(forceRefresh).catch(err => {
      console.warn('Error al cargar datos del segundo CT de Reserva:', err);
      return null;
    });
  }

  const catSlug = String(category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const staticUrl = `/data/gps/${catSlug}.json`;
  const refreshParam = forceRefresh ? '&refresh=1' : '';
  const edgeUrl = `/api/gps?cat=${encodeURIComponent(category)}${refreshParam}`;
  const directUrl = `${SCRIPT_URL}?api=1&cat=${encodeURIComponent(category)}${forceRefresh ? `&_t=${Date.now()}` : ''}`;

  let rawPayload = null;

  // 1. Si no es forzado, cargar primero el dataset estático ultrarrápido (30ms garantizados)
  if (!forceRefresh && typeof window !== 'undefined' && window.location) {
    try {
      const res = await fetch(staticUrl);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          rawPayload = await res.json();
        }
      }
    } catch (e) {}
  }

  // 2. Si no se obtuvo del estático o es forzado, consultar Vercel Edge Proxy
  if (!rawPayload && typeof window !== 'undefined' && window.location && window.location.origin) {
    try {
      const res = await fetch(edgeUrl);
      if (res.ok) {
        rawPayload = await res.json();
      }
    } catch (e) {
      console.warn('Proxy Vercel Edge no disponible, recurriendo a conexión directa');
    }
  }

  // 2. Fallback de seguridad directo a Google Apps Script si el proxy de Vercel no estuviera disponible (ej. en tests)
  if (!rawPayload || rawPayload.error) {
    try {
      const res = await fetch(directUrl);
      if (res.ok) {
        rawPayload = await res.json();
      } else {
        console.warn(`Error HTTP ${res.status} al cargar ${category}`);
      }
    } catch (err) {
      console.warn(`Error de red al cargar ${category}:`, err);
    }
  }

  if (!rawPayload && category !== 'Reserva') {
    throw new Error(`Error al conectar con la categoría ${category}`);
  }

  if (!rawPayload && category === 'Reserva') {
    rawPayload = {
      success: true,
      data: {
        categoria: 'Reserva',
        sesiones: [],
        roster: [],
        jugadores: {}
      }
    };
  }

  const d = rawPayload.data || rawPayload;

  // Si es Reserva, unificar sesiones y jugadores del segundo CT
  if (category === 'Reserva' && ctPromise) {
    const ctData = await ctPromise;
    if (ctData && Array.isArray(ctData.sesiones)) {
      if (!Array.isArray(d.sesiones)) d.sesiones = [];
      if (!Array.isArray(d.roster)) d.roster = [];
      if (!d.jugadores || typeof d.jugadores !== 'object') d.jugadores = {};

      // Incorporar sesiones del segundo CT
      d.sesiones.push(...ctData.sesiones);

      // Incorporar jugadores del CT al roster
      (ctData.roster || []).forEach(name => {
        if (!d.roster.includes(name)) {
          d.roster.push(name);
        }
      });

      // Incorporar a d.jugadores
      if (ctData.jugadores) {
        Object.entries(ctData.jugadores).forEach(([name, sessions]) => {
          if (!d.jugadores[name]) {
            d.jugadores[name] = sessions;
          } else if (Array.isArray(d.jugadores[name]) && Array.isArray(sessions)) {
            d.jugadores[name].push(...sessions);
          }
        });
      }
    }
  }

  const payload = sanitizeComodines(rawPayload);
  memoryCache[category] = payload;
  try {
    localStorage.setItem(`integral_data_v16_${category}`, JSON.stringify({
      timestamp: Date.now(),
      payload
    }));
  } catch (e) {}
  return payload;
}
