/**
 * Integral Club - SERVICIO DE CONEXIÓN CON GOOGLE SHEETS PARA CAPTACIÓN
 */

export const CAPTACION_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNy0gIhTafNEfbJuh0MZxo2wFQOJU1H52ZxbWo0VBPWQ3d9RgGdcKU6uDpXtpvZOlGSg/exec';
export const CAPTACION_SHEET_URL = 'https://docs.google.com/spreadsheets/d/16m2SJDfpC1_2MYpjoz1P9KQ0-g4sF6UY9Iixk-MogKk/edit';

let memoryCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 segundos

/**
 * Obtiene todos los prospectos desde el Google Sheet
 */
export async function fetchProspectos(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && memoryCache && (now - lastFetchTime < CACHE_TTL)) {
    return memoryCache;
  }

  // Intentar leer de localStorage si está disponible
  if (!forceRefresh) {
    try {
      const stored = localStorage.getItem('integral_captacion_prospectos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (now - parsed.timestamp < CACHE_TTL) {
          memoryCache = parsed.data;
          lastFetchTime = parsed.timestamp;
          return memoryCache;
        }
      }
    } catch (e) {}
  }

  const res = await fetch(CAPTACION_SCRIPT_URL, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Error al conectar con la planilla de captación (HTTP ${res.status})`);
  }

  const payload = await res.json();
  if (!payload || !payload.success) {
    throw new Error((payload && payload.error) || 'Respuesta inválida del servidor');
  }

  const data = Array.isArray(payload.data) ? payload.data : [];
  memoryCache = data;
  lastFetchTime = now;

  try {
    localStorage.setItem('integral_captacion_prospectos', JSON.stringify({
      timestamp: now,
      data
    }));
  } catch (e) {}

  return data;
}

/**
 * Guarda o actualiza un prospecto en la base de datos
 */
export async function saveProspecto(prospecto, isUpdate = false) {
  // Sanitizar campos para evitar que Google Sheets interprete '+' o '=' como fórmula
  const cleanData = {};
  Object.keys(prospecto).forEach(k => {
    let v = prospecto[k];
    if (typeof v === 'string' && (v.startsWith('+') || v.startsWith('='))) {
      v = "'" + v;
    }
    cleanData[k] = v;
  });

  const payload = {
    action: isUpdate ? 'update' : 'create',
    ...cleanData
  };

  const res = await fetch(CAPTACION_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Error de comunicación con el Google Sheet (HTTP ${res.status})`);
  }

  const result = await res.json();
  if (!result || !result.success) {
    throw new Error((result && result.error) || 'No se pudo guardar el prospecto.');
  }

  // Invalidar caché para reflejar cambios inmediatos
  invalidateCache();
  return result;
}

/**
 * Elimina un prospecto del Google Sheet
 */
export async function deleteProspecto(id) {
  if (!id) throw new Error('ID no provisto');

  const res = await fetch(CAPTACION_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action: 'delete',
      id
    })
  });

  if (!res.ok) {
    throw new Error(`Error al intentar eliminar el registro (HTTP ${res.status})`);
  }

  const result = await res.json();
  if (!result || !result.success) {
    throw new Error((result && result.error) || 'No se pudo eliminar el prospecto.');
  }

  invalidateCache();
  return result;
}

export function invalidateCache() {
  memoryCache = null;
  lastFetchTime = 0;
  try {
    localStorage.removeItem('integral_captacion_prospectos');
  } catch (e) {}
}
