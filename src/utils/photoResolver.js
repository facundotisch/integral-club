import { FOTOS_CATALOG } from '../data/fotosCatalog.js';

/**
 * Normaliza un string para comparación: sin acentos, minúsculas, solo letras/números y espacios simples.
 */
export function normalizeStr(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Descompone un nombre en inicial y lista de apellidos.
 * Soporta formatos:
 * - 'Alcaraz F' (apellido + inicial)
 * - 'F Alcaraz' (inicial + apellido)
 * - 'López Astrada T' (doble apellido + inicial)
 * - 'Alcaraz' (solo apellido)
 * - 'Balsano Franco' (apellido + nombre completo)
 */
export function parseName(str) {
  const norm = normalizeStr(str);
  const words = norm.split(' ').filter(Boolean);
  if (!words.length) return { words: [], initial: '', initials: [], surnames: [] };

  let initial = '';
  let initials = [];
  let surnames = [...words];

  // Caso: último token es una sola letra ('Alcaraz F')
  if (words.length > 1 && words[words.length - 1].length === 1) {
    initial = words[words.length - 1];
    initials = [initial];
    surnames = words.slice(0, -1);
  }
  // Caso: primer token es una sola letra ('F Alcaraz')
  else if (words.length > 1 && words[0].length === 1) {
    initial = words[0];
    initials = [initial];
    surnames = words.slice(1);
  }
  // Caso: formato APELLIDO NOMBRE(S) ('SCHAARE FELIPE VALENTIN', 'AGUERO LUCIANO', etc.)
  else if (words.length > 1) {
    const posiblesDobles = ['leiva aguero', 'milito bonetto', 'gagliardi piris', 'castreje rodriguez', 'campo deusa', 'tello larrory', 'costa storniolo', 'rivas saleski', 'velazquez fernandez'];
    const primerDos = `${words[0]} ${words[1]}`;
    if (posiblesDobles.includes(primerDos) && words.length >= 3) {
      surnames = [words[0], words[1]];
      initials = words.slice(2).map(w => w[0]);
    } else {
      surnames = [words[0]];
      initials = words.slice(1).map(w => w[0]);
    }
    initial = initials[0] || '';
  }

  return { words, initial, initials, surnames };
}

/**
 * Distancia de Levenshtein para capturar pequeños errores tipográficos de los profesores
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  const d = [];
  for (let i = 0; i <= a.length; i++) d[i] = [i];
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[a.length][b.length];
}

/**
 * Compara dos palabras (apellidos) considerando variantes fonéticas y tipográficas comunes
 * en planillas deportivas argentinas (b/v, s/z/c, ll/y, caamaño/camaño, etc.)
 */
function wordsMatch(w1, w2) {
  if (w1 === w2) return 2;

  // Normalización fonética rápida
  const norm1 = w1.replace(/b/g, 'v').replace(/z/g, 's').replace(/c(?=[ei])/g, 's').replace(/ll/g, 'y');
  const norm2 = w2.replace(/b/g, 'v').replace(/z/g, 's').replace(/c(?=[ei])/g, 's').replace(/ll/g, 'y');
  if (norm1 === norm2) return 1.9;

  // Prefijo largo idéntico (ej: caamaño y camaño, o velardes y velardez)
  if (w1.length >= 5 && w2.length >= 5 && (w1.startsWith(w2.slice(0, 5)) || w2.startsWith(w1.slice(0, 5)))) {
    return 1.8;
  }

  // Levenshtein con tolerancia controlada por longitud
  const lev = levenshtein(w1, w2);
  if (lev === 1 && Math.min(w1.length, w2.length) >= 4) return 1.6;
  if (lev <= 2 && Math.min(w1.length, w2.length) >= 6) return 1.4;

  return 0;
}

/**
 * Calcula un puntaje de coincidencia entre el nombre del jugador (según planilla/sheet)
 * y el nombre del archivo de foto.
 */
function matchScore(playerStr, photoFile) {
  // Extraer nombre base sin extensión
  const lastDot = photoFile.lastIndexOf('.');
  const baseName = lastDot > 0 ? photoFile.slice(0, lastDot) : photoFile;

  const p = parseName(playerStr);
  const f = parseName(baseName);

  if (!p.words.length || !f.words.length) return 0;

  // Coincidencia exacta completa
  if (p.words.join(' ') === f.words.join(' ')) return 100;

  // Cruce inteligente: Nombre completo ('Luciano Naranjo') vs Apellido e inicial ('Naranjo L')
  const pWords = p.words;
  const fWords = f.words;
  const pInit = pWords.find(w => w.length === 1);
  const fInit = fWords.find(w => w.length === 1);
  const pNonInit = pWords.filter(w => w.length > 1);
  const fNonInit = fWords.filter(w => w.length > 1);

  if (fInit && !pInit && pWords.length >= 2) {
    const hasInitial = pWords.some(w => w[0] === fInit);
    const hasSurname = fNonInit.every(fw => pWords.includes(fw));
    if (hasInitial && hasSurname) return 96;
  }
  if (pInit && !fInit && fWords.length >= 2) {
    const hasInitial = fWords.some(w => w[0] === pInit);
    const hasSurname = pNonInit.every(pw => fWords.includes(pw));
    if (hasInitial && hasSurname) return 96;
  }

  // Protección contra colisión de iniciales:
  // Si la foto tiene inicial, debe coincidir con alguna inicial reconocida del jugador
  const pInitials = p.initials && p.initials.length ? p.initials : (p.initial ? [p.initial] : []);
  if (f.initial && pInitials.length && !pInitials.includes(f.initial)) {
    return 0;
  }

  // Filtrar partículas comunes ('de', 'del', 'la', 'los')
  const cleanSur = (arr) => arr.filter(w => !['de', 'del', 'la', 'los', 'san'].includes(w));
  const pSur = cleanSur(p.surnames);
  const fSur = cleanSur(f.surnames);

  let surnamePoints = 0;
  for (const ps of pSur) {
    for (const fs of fSur) {
      const pts = wordsMatch(ps, fs);
      if (pts > 0) {
        surnamePoints += pts;
        break; // Máximo un match por cada apellido del jugador
      }
    }
  }

  if (surnamePoints === 0) return 0;

  let score = 50 + surnamePoints * 15;
  if (f.initial && pInitials.includes(f.initial)) score += 25;
  if (!p.initial && fSur.includes(pSur[0])) score += 10;

  return score;
}

/**
 * Normaliza el identificador de categoría a la clave de la carpeta ('septima', 'sexta', etc.)
 */
export function normalizeCategory(cat) {
  if (!cat) return '';
  return String(cat)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Resuelve la foto adecuada para un jugador en base a su nombre y categoría actual.
 * @param {string} playerName Nombre del jugador como viene en la planilla
 * @param {string} category Categoría actual ('Séptima', 'Sexta', etc.)
 * @returns {{ url: string, file: string, category: string, score: number } | null}
 */
export function resolvePlayerPhoto(playerName, category) {
  // Anonimizado para Integral Club: sin fotos de futbolistas
  return null;
}

/**
 * Comparación robusta de nombres para vincular registros entre planillas,
 * iniciales y variantes ortográficas.
 */
export function areSamePlayer(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const a = normalizeStr(nameA);
  const b = normalizeStr(nameB);
  if (a === b) return true;

  const wordsA = a.split(' ').filter(Boolean);
  const wordsB = b.split(' ').filter(Boolean);
  if (!wordsA.length || !wordsB.length) return false;

  // Coincidencia exacta de conjunto de palabras
  if (wordsA.length === wordsB.length && wordsA.every(w => wordsB.includes(w))) {
    return true;
  }

  const initsA = wordsA.filter(w => w.length === 1);
  const initsB = wordsB.filter(w => w.length === 1);
  const sursA = wordsA.filter(w => w.length > 1);
  const sursB = wordsB.filter(w => w.length > 1);

  // Caso 1: Ambos tienen iniciales (ej: 'Naranjo L' vs 'Naranjo L')
  if (initsA.length > 0 && initsB.length > 0) {
    if (sursA.length !== sursB.length) return false;
    const sameSurnames = sursA.every(sa => sursB.includes(sa));
    const sameInitials = initsA.every(ia => initsB.includes(ia));
    return sameSurnames && sameInitials;
  }

  // Caso 2: Uno tiene inicial y el otro nombre completo (ej: 'Naranjo L' vs 'Luciano Naranjo')
  if (initsA.length > 0 && initsB.length === 0) {
    const init = initsA[0];
    const hasCommonSurname = sursA.some(sa => sa.length >= 3 && sursB.includes(sa));
    const otherWords = sursB.filter(sb => !sursA.includes(sb));
    const hasMatchingInitial = otherWords.some(ow => ow[0] === init);
    return hasCommonSurname && hasMatchingInitial;
  }

  if (initsB.length > 0 && initsA.length === 0) {
    const init = initsB[0];
    const hasCommonSurname = sursB.some(sb => sb.length >= 3 && sursA.includes(sb));
    const otherWords = sursA.filter(sa => !sursB.includes(sa));
    const hasMatchingInitial = otherWords.some(ow => ow[0] === init);
    return hasCommonSurname && hasMatchingInitial;
  }

  // Caso 3: Dos nombres completos
  if (sursA.length >= 2 && sursB.length >= 2) {
    const common = sursA.filter(w => sursB.includes(w));
    if (common.length >= 2) return true;
  }

  return false;
}
