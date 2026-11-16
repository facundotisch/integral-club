import { POSICIONES_SHEET } from './jugadoresPosiciones.js';
import { normalizeStr } from '../utils/photoResolver.js';

function assignCategory(idx) {
  if (idx <= 35) return 'Reserva';
  if (idx <= 85) return 'Cuarta';
  if (idx <= 135) return 'Quinta';
  if (idx <= 185) return 'Sexta';
  if (idx <= 235) return 'Séptima';
  if (idx <= 285) return 'Octava';
  return 'Novena';
}

let _cachedCatalog = null;

/**
 * Catálogo estático de futbolistas anonimizados para Integral Club
 */
export function buildStaticPlayersCatalog() {
  if (_cachedCatalog) return _cachedCatalog;

  const catalog = [];
  const entries = Object.entries(POSICIONES_SHEET);

  entries.forEach(([nombre, pos], i) => {
    const num = i + 1;
    const cat = assignCategory(num);
    catalog.push({
      displayName: nombre,
      cats: [cat],
      primaryCat: cat,
      pos: pos || 'Jugador de Campo',
      photoUrl: null,
      searchStr: normalizeStr(`${nombre} ${pos} ${cat}`)
    });
  });

  _cachedCatalog = catalog.sort((a, b) => {
    const numA = parseInt(a.displayName.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.displayName.replace(/\D/g, '') || '0', 10);
    return numA - numB;
  });

  return _cachedCatalog;
}
