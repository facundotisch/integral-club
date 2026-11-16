/**
 * Servicio de datos de Nutrición & Antropometría ISAK
 * Conexión en vivo con Google Sheets (Integral Club Formativas)
 */

export const CATEGORIAS_CONFIG = {
  'Cuarta': {
    nombre: 'Cuarta División',
    gid: '1316696562',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1Wd9CnLvtf5NqWB526sIf6zzQu-jpEBZBkQRDcaNUrXM/export?format=csv&gid=1316696562',
    disponible: true
  },
  'Quinta': {
    nombre: 'Quinta División',
    gid: '1379057191',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1Wd9CnLvtf5NqWB526sIf6zzQu-jpEBZBkQRDcaNUrXM/export?format=csv&gid=1379057191',
    disponible: true
  },
  'Sexta': {
    nombre: 'Sexta División',
    gid: '1260254060',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1Wd9CnLvtf5NqWB526sIf6zzQu-jpEBZBkQRDcaNUrXM/export?format=csv&gid=1260254060',
    disponible: true
  },
  'Séptima': {
    nombre: 'Séptima División',
    gid: '1510362152',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1Wd9CnLvtf5NqWB526sIf6zzQu-jpEBZBkQRDcaNUrXM/export?format=csv&gid=1510362152',
    disponible: true
  },
  'Octava': {
    nombre: 'Octava División',
    gid: '1836389105',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1Wd9CnLvtf5NqWB526sIf6zzQu-jpEBZBkQRDcaNUrXM/export?format=csv&gid=1836389105',
    disponible: true
  },
  'Novena': {
    nombre: 'Novena División',
    gid: '0',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1Wd9CnLvtf5NqWB526sIf6zzQu-jpEBZBkQRDcaNUrXM/export?format=csv&gid=0',
    disponible: true
  }
};

const CACHE_KEY_BASE = 'integral_antropo_cache_v3';

// Parseador de números con coma decimal o punto
export function parseNum(val, defaultVal = 0) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const s = String(val).replace(',', '.').trim();
  const n = parseFloat(s);
  return isNaN(n) ? defaultVal : n;
}

// Parseador robusto de CSV estándar compatible con comillas
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (!lines.length) return [];

  const parseRow = (line) => {
    const row = [];
    let insideQuotes = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    return row;
  };

  const headers = parseRow(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length >= 5) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] !== undefined ? values[idx] : '';
      });
      rows.push(obj);
    }
  }

  return rows;
}

/**
 * Semáforo Oficial de Pliegues (Regla de test especificada por usuario):
 * - Arriba de 45 mm: ROJO (>45)
 * - 43 a 45 mm: AMARILLO (43-45)
 * - 42 mm o menos: VERDE (≤42)
 */
export function getSemaforoPliegues(val) {
  const n = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(n) || n <= 0) {
    return {
      nivel: 'nd',
      color: '#94a3b8',
      label: 'S/D',
      bg: 'rgba(148, 163, 184, 0.1)',
      border: 'rgba(148, 163, 184, 0.3)',
      textClass: 'text-muted'
    };
  }
  if (n > 45) {
    return {
      nivel: 'rojo',
      color: '#ef4444',
      label: 'Alerta (>45)',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: '#ef4444',
      badgeClass: 'semaforo-rojo',
      textClass: 'text-red'
    };
  }
  if (n >= 43) {
    return {
      nivel: 'amarillo',
      color: '#f59e0b',
      label: 'Atención (43-45)',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '#f59e0b',
      badgeClass: 'semaforo-amarillo',
      textClass: 'text-amber'
    };
  }
  return {
    nivel: 'verde',
    color: '#10b981',
    label: 'Óptimo (≤42)',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: '#10b981',
    badgeClass: 'semaforo-verde',
    textClass: 'text-green'
  };
}

// Normaliza las mediciones del protocolo ISAK
export function normalizeAntropoRow(r) {
  const apellido = (r['APELLIDO'] || '').trim().toUpperCase().replace(/\s+/g, ' ');
  const nombre = (r['NOMBRE'] || '').trim().toUpperCase().replace(/\s+/g, ' ');
  const nombreCompleto = `${apellido} ${nombre}`.trim();
  const fecha = (r['FECHA'] || '').trim();
  const edad = (r['EDAD'] || '').trim();
  const dni = (r['Nº DOCUMENTO'] || r['N° DOCUMENTO'] || '').trim();
  const responsable = (r['RESPONSABLE'] || '').trim();

  const peso = parseNum(r['Peso bruto (kg)']);
  const talla = parseNum(r['Talla corporal (cm)']);
  const tallaSentado = parseNum(r['Talla sentado (cm)']);
  const envergadura = parseNum(r['Envergadura']);

  // Pliegues individuales (mm)
  const triceps = parseNum(r['Tríceps']);
  const subescapular = parseNum(r['Subescapular']);
  const supraespinal = parseNum(r['Supraespinal']);
  const abdominal = parseNum(r['Abdominal']);
  const musloMedial = parseNum(r['Muslo Medial'] || r['Muslo (medial)']);
  const pantorrilla = parseNum(r['Pantorrilla (máxima)'] || r['Pantorrilla']);
  const biceps = parseNum(r['Biceps']);
  const crestaIliaca = parseNum(r['Cresta Iliaca']);

  let pliegues6 = parseNum(r['6 Pliegues']);
  if (!pliegues6 || pliegues6 <= 0) {
    pliegues6 = triceps + subescapular + supraespinal + abdominal + musloMedial + pantorrilla;
  }
  pliegues6 = Math.round(pliegues6 * 10) / 10;

  // Fraccionamiento en 5 Masas (normalización si vino escalado por 10 en la hoja)
  let masaMuscular = parseNum(r['Masas muscular']);
  if (masaMuscular > 100) masaMuscular /= 10.0;
  masaMuscular = Math.round(masaMuscular * 100) / 100;

  let masaAdiposa = parseNum(r['Masas adiposa']);
  if (masaAdiposa > 100) masaAdiposa /= 10.0;
  masaAdiposa = Math.round(masaAdiposa * 100) / 100;

  let masaOsea = parseNum(r['Masas osea']);
  if (masaOsea > 50) masaOsea /= 10.0;
  masaOsea = Math.round(masaOsea * 100) / 100;

  let masaResidual = parseNum(r['Masas residual']);
  if (masaResidual > 50) masaResidual /= 10.0;
  masaResidual = Math.round(masaResidual * 100) / 100;

  let masaPiel = parseNum(r['Masas piel']);
  if (masaPiel > 20) masaPiel /= 10.0;
  masaPiel = Math.round(masaPiel * 100) / 100;

  // Porcentajes respecto al peso
  const refPeso = peso > 0 ? peso : (masaMuscular + masaAdiposa + masaOsea + masaResidual + masaPiel);
  const pctMuscular = refPeso > 0 ? Math.round((masaMuscular / refPeso) * 1000) / 10 : 0;
  const pctAdiposa = refPeso > 0 ? Math.round((masaAdiposa / refPeso) * 1000) / 10 : 0;
  const pctOsea = refPeso > 0 ? Math.round((masaOsea / refPeso) * 1000) / 10 : 0;
  const pctResidual = refPeso > 0 ? Math.round((masaResidual / refPeso) * 1000) / 10 : 0;
  const pctPiel = refPeso > 0 ? Math.round((masaPiel / refPeso) * 1000) / 10 : 0;

  // IMO (Índice Músculo/Óseo)
  let imo = parseNum(r['IMO']);
  if (imo > 10) imo /= 10.0;
  if (!imo && masaOsea > 0) imo = Math.round((masaMuscular / masaOsea) * 100) / 100;
  imo = Math.round(imo * 100) / 100;

  // Semáforo asociado a la medición
  const semaforo = getSemaforoPliegues(pliegues6);

  // Diámetros y Perímetros
  const perimetros = {
    cabeza: parseNum(r['Cabeza']),
    brazoRelajado: parseNum(r['Brazo Relajado']),
    brazoFlexionado: parseNum(r['Brazo Flexionado en Tensión']),
    antebrazo: parseNum(r['Antebrazo Máximo']),
    toraxMesoesternal: parseNum(r['Tórax Mesoesternal']),
    cintura: parseNum(r['Cintura (mínima)']),
    cadera: parseNum(r['Cadera (máximo)']),
    musloMax: parseNum(r['Muslo (máximo)']),
    musloMedial: parseNum(r['Muslo (medial)']),
    pantorrilla: parseNum(r['Pantorrilla (máxima)'])
  };

  const diametros = {
    biacromial: parseNum(r['Biacromial']),
    toraxTransverso: parseNum(r['Tórax Transverso']),
    toraxAnteroPost: parseNum(r['Tórax Antero-posterior']),
    biIliocrestideo: parseNum(r['Bi-iliocrestídeo']),
    humeral: parseNum(r['Humeral (biepicondilar)']),
    femoral: parseNum(r['Femoral (biepicondilar)'])
  };

  return {
    apellido,
    nombre,
    nombreCompleto,
    fecha,
    edad,
    dni,
    responsable,
    peso,
    talla,
    tallaSentado,
    envergadura,
    pliegues6,
    semaforo,
    pliegues: {
      triceps,
      subescapular,
      supraespinal,
      abdominal,
      musloMedial,
      pantorrilla,
      biceps,
      crestaIliaca
    },
    masas: {
      muscular: masaMuscular,
      adiposa: masaAdiposa,
      osea: masaOsea,
      residual: masaResidual,
      piel: masaPiel,
      pctMuscular,
      pctAdiposa,
      pctOsea,
      pctResidual,
      pctPiel
    },
    imo,
    perimetros,
    diametros
  };
}

/**
 * Consulta y normaliza datos de antropometría por categoría
 * Incluye DESDUPLICACIÓN estricta de filas y mediciones.
 */
export async function fetchAntropoData(categoria = 'Cuarta', forceRefresh = false) {
  const cacheKey = `${CACHE_KEY_BASE}_${categoria}`;

  // 1. Revisar caché local
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed._timestamp || 0);
        if (age < 30 * 60 * 1000) { // 30 min
          return parsed.data;
        }
      }
    } catch (e) {}
  }

  // 2. Obtener URL de la categoría solicitada
  const catConfig = CATEGORIAS_CONFIG[categoria] || CATEGORIAS_CONFIG['Cuarta'];
  const targetUrl = catConfig.sheetUrl || CATEGORIAS_CONFIG['Cuarta'].sheetUrl;

  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error(`Error al conectar con Google Sheets (${res.status})`);
  }
  const text = await res.text();
  const rawRows = parseCSV(text);

  let rawTotal = rawRows.length;
  let duplicadosEliminados = 0;

  // 3. Normalizar filas
  const normalized = rawRows.map(normalizeAntropoRow);

  // 4. DESDUPLICACIÓN ESTRICTA Y ANONIMIZACIÓN:
  // Agrupar por jugador y evitar duplicados en la misma fecha
  const playersMap = {};
  const seenMeasurementKey = new Set();
  const seenPlayers = new Map();
  let playerCounter = 1;
  const getAnonName = (raw) => {
    if (!raw) return 'Jugador';
    const c = String(raw).trim();
    if (c.toLowerCase().startsWith('jugador ')) return c;
    if (!seenPlayers.has(c)) {
      seenPlayers.set(c, 'Jugador ' + (playerCounter++));
    }
    return seenPlayers.get(c);
  };

  normalized.forEach(m => {
    const rawKey = m.nombreCompleto;
    if (!rawKey || !m.fecha) return;

    const pKey = getAnonName(rawKey);
    m.nombreCompleto = pKey;
    m.apellido = pKey;
    m.nombre = '';

    // Clave única de medición: JUGADOR + FECHA
    const mKey = `${pKey}___${m.fecha}`;
    if (seenMeasurementKey.has(mKey)) {
      duplicadosEliminados++;
      return; // Descartar fila duplicada
    }
    seenMeasurementKey.add(mKey);

    if (!playersMap[pKey]) {
      playersMap[pKey] = {
        nombreCompleto: pKey,
        apellido: pKey,
        nombre: '',
        dni: m.dni,
        edad: m.edad,
        categoria: categoria,
        mediciones: []
      };
    }
    playersMap[pKey].mediciones.push(m);
  });

  // 5. Ordenar mediciones cronológicamente
  const players = Object.values(playersMap).map(p => {
    p.mediciones.sort((a, b) => {
      const partsA = a.fecha.split('/');
      const partsB = b.fecha.split('/');
      if (partsA.length === 3 && partsB.length === 3) {
        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
        return dateB - dateA; // Descendente: la más reciente primero
      }
      return 0;
    });
    p.ultimaMedicion = p.mediciones[0] || null;
    return p;
  });

  // Ordenar jugadores alfabéticamente
  players.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

  const totalMediciones = players.reduce((sum, p) => sum + p.mediciones.length, 0);

  const result = {
    categoria: categoria,
    categoriaNombre: catConfig.nombre,
    totalMediciones,
    totalJugadores: players.length,
    duplicadosEliminados,
    filasCrudas: rawTotal,
    jugadores: players,
    ultimaActualizacion: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  };

  // Guardar en caché
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data: result,
      _timestamp: Date.now()
    }));
  } catch (e) {}

  return result;
}
