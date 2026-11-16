import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Activity,
  Layers,
  ArrowUpDown,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Zap,
  TrendingUp,
  User,
  Info,
  ChevronDown,
  Printer,
  Table as TableIcon,
  Check,
  X
} from 'lucide-react';
import ChartCanvas from '../../../components/ChartCanvas';
import { resolvePlayerPhoto, normalizeStr } from '../../../utils/photoResolver';
import { fetchCategoryData, fetchReservaCTData } from '../../../services/api';
import { exportarPDF } from '../../../utils/helpers';

const ALL_CATEGORIAS = ['Cuarta', 'Reserva', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena'];

// Mapeo exhaustivo de códigos de posición a descripciones tácticas legibles
const POS_LABELS = {
  'DC': 'Defensor Central',
  'DEFENSOR CENTRAL': 'Defensor Central',
  'LD': 'Lateral Derecho',
  'LATERAL DERECHO': 'Lateral Derecho',
  'LI': 'Lateral Izquierdo',
  'LATERAL IZQUIERDO': 'Lateral Izquierdo',
  'DL': 'Defensor Lateral',
  'DEFENSOR LATERAL': 'Defensor Lateral',
  'VC': 'Volante Central',
  'VOLANTE CENTRAL': 'Volante Central',
  'VM': 'Volante Mixto',
  'VOLANTE MIXTO': 'Volante Mixto',
  'VI': 'Volante Interno / Enganche',
  'VOLANTE INTERNO': 'Volante Interno / Enganche',
  'E': 'Extremo',
  'EXTREMO': 'Extremo',
  'ED': 'Extremo Derecho',
  'EI': 'Extremo Izquierdo',
  'CD': 'Centrodelantero',
  'CENTRODELANTERO': 'Centrodelantero',
  'DEL': 'Delantero',
  'DELANTERO': 'Delantero',
  'A': 'Arquero',
  'ARQ': 'Arquero',
  'ARQUERO': 'Arquero'
};

export const METRICAS_CONFIG = [
  { id: 'dist', label: 'Distancia Total', unidad: 'm', desc: 'Metros totales recorridos en el partido' },
  { id: 'drel', label: 'Distancia Relativa', unidad: 'm/min', desc: 'Intensidad media en metros por minuto' },
  { id: 'hi', label: 'HSR (>20 km/h)', unidad: 'm', desc: 'Distancia a alta intensidad a más de 20 km/h' },
  { id: 's25', label: 'Sprints (>25 km/h)', unidad: 'm', desc: 'Metros recorridos a velocidad de sprint' },
  { id: 'accAlta', label: 'Acel. Altas (>3 m/s²)', unidad: 'cant.', desc: 'Aceleraciones de máxima exigencia mecánica' },
  { id: 'decAlta', label: 'Desacel. Altas (<-3 m/s²)', unidad: 'cant.', desc: 'Desaceleraciones bruscas de frenado' },
  { id: 'topSpeed', label: 'Velocidad Máxima', unidad: 'km/h', desc: 'Pico de velocidad máxima registrado' },
  { id: 'min', label: 'Minutos Jugados', unidad: 'min', desc: 'Tiempo neto de juego en el partido' }
];

export function formatPosicion(posStr) {
  if (!posStr) return 'Sin posición';
  const clean = String(posStr).trim().toUpperCase();
  if (/^\d+(\.\d+)?$/.test(clean)) return 'Sin posición';
  return POS_LABELS[clean] || 'Sin posición';
}

export function formatRivalLabel(rival, esPartido = true) {
  if (!rival) return esPartido ? 'vs Rival' : 'Sesión';
  const clean = String(rival).trim();
  if (!esPartido) return clean;
  if (/^vs\.?\s*/i.test(clean)) {
    return `vs ${clean.replace(/^vs\.?\s*/i, '')}`;
  }
  return `vs ${clean}`;
}

/**
 * Construye la comparativa de un partido entre el jugador evaluado y sus compañeros por posición táctica.
 * Los compañeros se anonimizan con su demarcación táctica (ej: 'Defensor Central #1', 'Volante Central #1').
 */
function buildMatchComparison(match, selectedPlayer) {
  if (!match || !match.rawSession || !match.rawSession.jugadores) {
    return { playerRow: null, teammateRows: [], allRows: [], teammatesAvg: null, diffVsAvg: null };
  }
  const s = match.rawSession;
  const pRecord = match.playerData || {};

  const pMin = Math.round(pRecord.min || 0);
  const pDist = Math.round(pRecord.dist || 0);
  const pDrel = Math.round(pRecord.drel || (pMin > 0 ? (pDist / pMin) : 0));
  const pHi = Math.round(pRecord.hi || pRecord.z1825 || 0);
  const pS25 = Math.round(pRecord.s25 || 0);
  const pAccAlta = Math.round(pRecord.accAlta || 0);
  const pDecAlta = Math.round(pRecord.decAlta || 0);
  const pTopSpeed = Number((pRecord.topSpeed || 0).toFixed(1));

  const playerRow = {
    isPlayer: true,
    nombreDisplay: selectedPlayer,
    puestoDisplay: formatPosicion(pRecord.pos),
    puestoCorto: (pRecord.pos || 'DC').toUpperCase(),
    min: pMin,
    dist: pDist,
    drel: pDrel,
    hi: pHi,
    s25: pS25,
    accAlta: pAccAlta,
    decAlta: pDecAlta,
    topSpeed: pTopSpeed,
    sprints: Math.round(pRecord.sprints || 0),
    deltaDistVsPlayer: 0,
    deltaDrelVsPlayer: 0,
    pctDistVsPlayer: 100
  };

  const posCounter = {};
  const teammateRows = [];

  (s.jugadores || []).forEach(j => {
    if (!j || areSamePlayer(j.jugador, selectedPlayer)) return;
    if ((j.dist || 0) <= 0 && (j.min || 0) <= 0) return;

    const tMin = Math.round(j.min || 0);
    // Filtrar compañeros con menos de 40 minutos jugados en la posición
    if (tMin < 40) return;

    const pLabel = formatPosicion(j.pos);
    posCounter[pLabel] = (posCounter[pLabel] || 0) + 1;
    const count = posCounter[pLabel];

    const posDisplay = `${pLabel} #${count}`;
    const tDist = Math.round(j.dist || 0);
    const tDrel = Math.round(j.drel || (tMin > 0 ? (tDist / tMin) : 0));
    const tHi = Math.round(j.hi || j.z1825 || 0);
    const tS25 = Math.round(j.s25 || 0);
    const tAccAlta = Math.round(j.accAlta || 0);
    const tDecAlta = Math.round(j.decAlta || 0);
    const tTopSpeed = Number((j.topSpeed || 0).toFixed(1));

    teammateRows.push({
      isPlayer: false,
      nombreDisplay: posDisplay,
      puestoDisplay: pLabel,
      puestoCorto: (j.pos || 'CAMPO').toUpperCase(),
      min: tMin,
      dist: tDist,
      drel: tDrel,
      hi: tHi,
      s25: tS25,
      accAlta: tAccAlta,
      decAlta: tDecAlta,
      topSpeed: tTopSpeed,
      sprints: Math.round(j.sprints || 0),
      deltaDistVsPlayer: tDist - pDist,
      deltaDrelVsPlayer: tDrel - pDrel,
      pctDistVsPlayer: pDist > 0 ? Math.round((tDist / pDist) * 100) : 0
    });
  });

  // Ordenar compañeros por minutos descendente, y luego distancia
  teammateRows.sort((a, b) => (b.min - a.min) || (b.dist - a.dist));

  let teammatesAvg = null;
  let diffVsAvg = null;

  if (teammateRows.length > 0) {
    const sum = (k) => teammateRows.reduce((acc, r) => acc + (r[k] || 0), 0);
    const len = teammateRows.length;
    const avgMin = Math.round(sum('min') / len);
    const avgDist = Math.round(sum('dist') / len);
    const avgDrel = Math.round(sum('drel') / len);
    const avgHi = Math.round(sum('hi') / len);
    const avgS25 = Math.round(sum('s25') / len);
    const avgAccAlta = Number((sum('accAlta') / len).toFixed(1));
    const avgDecAlta = Number((sum('decAlta') / len).toFixed(1));
    const avgTopSpeed = Number((sum('topSpeed') / len).toFixed(1));

    teammatesAvg = {
      min: avgMin,
      dist: avgDist,
      drel: avgDrel,
      hi: avgHi,
      s25: avgS25,
      accAlta: avgAccAlta,
      decAlta: avgDecAlta,
      topSpeed: avgTopSpeed,
      deltaDistVsPlayer: avgDist - pDist,
      deltaDrelVsPlayer: avgDrel - pDrel,
      pctDistVsPlayer: pDist > 0 ? Math.round((avgDist / pDist) * 100) : 0
    };

    // Comparativa del promedio de cada variable frente al jugador evaluado (ej: Naranjo)
    diffVsAvg = {
      min: pMin - avgMin,
      dist: pDist - avgDist,
      drel: pDrel - avgDrel,
      hi: pHi - avgHi,
      s25: pS25 - avgS25,
      accAlta: Number((pAccAlta - avgAccAlta).toFixed(1)),
      decAlta: Number((pDecAlta - avgDecAlta).toFixed(1)),
      topSpeed: Number((pTopSpeed - avgTopSpeed).toFixed(1)),
      pctDist: avgDist > 0 ? Math.round((pDist / avgDist) * 100) : 100
    };
  }

  return {
    playerRow,
    teammateRows,
    allRows: playerRow ? [playerRow, ...teammateRows] : teammateRows,
    teammatesAvg,
    diffVsAvg
  };
}

/**
 * Comparación robusta de nombres para no mezclar jugadores de distintas categorías
 * con iniciales similares (ej: 'Lopez N' de Novena no debe matchear con 'Naranjo L' de Cuarta).
 */
function areSamePlayer(nameA, nameB) {
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

export default function CompararPuestoPartidoPanel({ data, catActual, categorias = [], tema = 'claro', targetJugador }) {
  const [multiCatData, setMultiCatData] = useState({});
  const [loadingMulti, setLoadingMulti] = useState(false);

  // Jugador seleccionado
  const [selectedPlayer, setSelectedPlayer] = useState(() => {
    if (targetJugador) return targetJugador;
    try {
      const q = new URLSearchParams(window.location.search).get('jugador');
      if (q) return q;
    } catch {}
    return 'Naranjo L';
  });

  // Control multi-selección de categorías (puede seleccionar 1, 2, 3 o todas)
  const [selectedCategorias, setSelectedCategorias] = useState([]);

  // Partidos deseleccionados manualmente por el usuario (por defecto ninguno, todos seleccionados)
  const [deselectedMatchIds, setDeselectedMatchIds] = useState([]);

  // Partido seleccionado en detalle
  const [selectedMatchId, setSelectedMatchId] = useState('');

  // Métrica activa para el gráfico comparativo
  const [metricaActiva, setMetricaActiva] = useState('dist');

  // Ordenamiento de tabla de detalle de partido
  const [sortCol, setSortCol] = useState('min');
  const [sortDir, setSortDir] = useState('desc');

  // Ordenamiento de tabla consolidada de partidos
  const [histSortCol, setHistSortCol] = useState('fecha');
  const [histSortDir, setHistSortDir] = useState('desc');

  // Carga inicial y background-fetch de todas las divisiones
  useEffect(() => {
    let isMounted = true;
    setLoadingMulti(true);

    if (data && catActual) {
      setMultiCatData(prev => ({ ...prev, [catActual]: data }));
    }

    // Carga rápida inmediata de la planilla del segundo CT de Reserva
    fetchReservaCTData().then(ctData => {
      if (!isMounted || !ctData || !ctData.sesiones) return;
      setMultiCatData(prev => {
        const prevRes = prev['Reserva'] || (catActual === 'Reserva' ? data : null) || { sesiones: [], roster: [], jugadores: {} };
        const baseSesiones = [...(prevRes.sesiones || [])];
        const existingKeys = new Set(baseSesiones.map(s => `${s.fecha}_${s.rival}`.toLowerCase()));
        
        const newSesiones = ctData.sesiones.filter(s => !existingKeys.has(`${s.fecha}_${s.rival}`.toLowerCase()));
        if (newSesiones.length === 0) return prev;

        return {
          ...prev,
          Reserva: {
            ...prevRes,
            categoria: 'Reserva',
            sesiones: [...baseSesiones, ...newSesiones],
            roster: Array.from(new Set([...(prevRes.roster || []), ...(ctData.roster || [])])),
            jugadores: { ...(prevRes.jugadores || {}), ...(ctData.jugadores || {}) }
          }
        };
      });
    }).catch(err => {
      console.warn('Error en carga rápida de CT Reserva:', err);
    });

    Promise.allSettled(
      ALL_CATEGORIAS.map(cat =>
        fetchCategoryData(cat)
          .then(res => ({ cat, data: (res && res.data) ? res.data : res }))
          .catch(err => {
            console.warn(`Error al cargar categoría ${cat}:`, err);
            return null;
          })
      )
    ).then(results => {
      if (!isMounted) return;
      const map = {};
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value && r.value.data) {
          map[r.value.cat] = r.value.data;
        }
      });
      setMultiCatData(prev => ({ ...prev, ...map }));
      setLoadingMulti(false);
    });

    return () => {
      isMounted = false;
    };
  }, [catActual, data]);

  // Lista unificada de todos los jugadores disponibles (con conteo estricto de partidos oficiales)
  const rosterUnificado = useMemo(() => {
    const playersMap = {};

    const processCat = (catName, catData) => {
      if (!catData) return;
      const roster = catData.roster || [];
      const sesiones = catData.sesiones || [];

      roster.forEach(name => {
        if (!name || String(name).trim() === '') return;
        let foundKey = Object.keys(playersMap).find(k => areSamePlayer(k, name));

        if (!foundKey) {
          foundKey = name;
          playersMap[foundKey] = {
            displayName: name,
            variantes: [name],
            cats: [],
            partidosCount: 0
          };
        }
      });

      sesiones.forEach(s => {
        const esPartido = (s.tipo || '').toLowerCase().includes('partido') || /^MD$/i.test(String(s.per || s.dia || ''));
        if (!esPartido) return; // Solo partidos oficiales

        (s.jugadores || []).forEach(j => {
          if (!j || !j.jugador) return;
          if ((j.dist || 0) <= 0 && (j.min || 0) <= 0) return;

          let foundKey = Object.keys(playersMap).find(k => areSamePlayer(k, j.jugador));
          if (!foundKey) {
            foundKey = j.jugador;
            playersMap[foundKey] = {
              displayName: j.jugador,
              variantes: [j.jugador],
              cats: [catName],
              partidosCount: 1
            };
          } else {
            if (!playersMap[foundKey].cats.includes(catName)) {
              playersMap[foundKey].cats.push(catName);
            }
            playersMap[foundKey].partidosCount += 1;
          }
        });
      });
    };

    ALL_CATEGORIAS.forEach(cat => processCat(cat, multiCatData[cat]));

    return Object.values(playersMap)
      .filter(p => p.partidosCount > 0)
      .sort((a, b) => {
        if (a.displayName.toLowerCase().includes('naranjo')) return -1;
        if (b.displayName.toLowerCase().includes('naranjo')) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [multiCatData]);

  // Selección automática inicial o por prop de jugador
  useEffect(() => {
    if (rosterUnificado.length > 0) {
      let targetQ = targetJugador;
      if (!targetQ) {
        try {
          targetQ = new URLSearchParams(window.location.search).get('jugador');
        } catch {}
      }

      if (targetQ) {
        const found = rosterUnificado.find(p => areSamePlayer(p.displayName, targetQ) || 
          p.displayName.toLowerCase().includes(targetQ.toLowerCase()) || 
          targetQ.toLowerCase().includes(p.displayName.toLowerCase()));
        if (found) {
          setSelectedPlayer(found.displayName);
          return;
        } else {
          setSelectedPlayer(targetQ);
          return;
        }
      }

      if (!selectedPlayer) {
        const naranjo = rosterUnificado.find(p => p.displayName.toLowerCase().includes('naranjo'));
        if (naranjo) {
          setSelectedPlayer(naranjo.displayName);
        } else {
          setSelectedPlayer(rosterUnificado[0].displayName);
        }
      }
    }
  }, [rosterUnificado, targetJugador]);

  // Info del jugador activo
  const activePlayerInfo = useMemo(() => {
    return rosterUnificado.find(p => areSamePlayer(p.displayName, selectedPlayer)) || null;
  }, [rosterUnificado, selectedPlayer]);

  // Obtener TODOS los partidos donde participó el jugador seleccionado (SOLO PARTIDOS OFICIALES)
  const partidosJugador = useMemo(() => {
    if (!selectedPlayer) return [];
    const list = [];

    ALL_CATEGORIAS.forEach(catName => {
      const cData = multiCatData[catName] || (catName === catActual ? data : null);
      if (!cData || !cData.sesiones) return;

      cData.sesiones.forEach((s, idx) => {
        const esPartido = (s.tipo || '').toLowerCase().includes('partido') || /^MD$/i.test(String(s.per || s.dia || ''));
        if (!esPartido) return; // Exclusivo partidos oficiales

        const pRecord = (s.jugadores || []).find(j => areSamePlayer(j.jugador, selectedPlayer));

        if (pRecord && (pRecord.dist > 0 || (pRecord.min || 0) > 0)) {
          const rivalClean = (s.rival && s.rival.trim()) || (s.per && s.per.trim()) || 'Rival';
          const matchId = `${catName}_${s.fecha}_${idx}`;

          const teammates = (s.jugadores || []).filter(j => j && !areSamePlayer(j.jugador, selectedPlayer) && Math.round(j.min || 0) >= 40 && ((j.dist || 0) > 0 || (j.min || 0) > 0));
          const tLen = teammates.length;
          const avgDist = tLen > 0 ? Math.round(teammates.reduce((acc, t) => acc + (t.dist || 0), 0) / tLen) : 0;
          const avgDrel = tLen > 0 ? Math.round(teammates.reduce((acc, t) => acc + (t.drel || 0), 0) / tLen) : 0;

          list.push({
            id: matchId,
            cat: catName,
            fecha: s.fecha,
            rival: rivalClean,
            tipo: s.tipo || 'Partido',
            esPartido: true,
            per: s.per || '',
            dia: s.dia || '',
            playerData: pRecord,
            rawSession: s,
            teammatesCount: tLen,
            avgDist,
            avgDrel
          });
        }
      });
    });

    return list.sort((a, b) => {
      return (b.playerData.min || 0) - (a.playerData.min || 0);
    });
  }, [selectedPlayer, multiCatData, catActual, data]);

  // Categorías donde este jugador efectivamente tiene partidos
  const catsDelJugador = useMemo(() => {
    const set = new Set();
    partidosJugador.forEach(m => set.add(m.cat));
    return Array.from(set);
  }, [partidosJugador]);

  // Al cambiar de jugador, inicializar con todas sus divisiones disponibles y todos sus partidos seleccionados
  useEffect(() => {
    if (catsDelJugador.length > 0) {
      setSelectedCategorias(catsDelJugador);
    }
    setDeselectedMatchIds([]);
  }, [selectedPlayer, catsDelJugador.join(',')]);

  // Manejador del toggle de categorías múltiples (1, 2, 3 o todas)
  const handleToggleCat = (cat) => {
    setSelectedCategorias(prev => {
      if (prev.includes(cat)) {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleSelectAllCats = () => {
    setSelectedCategorias(catsDelJugador);
  };

  const handleSelectOnlyCat = (cat) => {
    setSelectedCategorias([cat]);
  };

  const handleSelectPreset = (catsArray) => {
    setSelectedCategorias(catsArray.filter(c => catsDelJugador.includes(c)));
  };

  // Control de selección de partidos individuales
  const handleToggleMatch = (matchId) => {
    setDeselectedMatchIds(prev => {
      if (prev.includes(matchId)) {
        return prev.filter(id => id !== matchId);
      } else {
        return [...prev, matchId];
      }
    });
  };

  const handleSelectAllMatches = () => {
    setDeselectedMatchIds([]);
  };

  const handleDeselectAllMatches = () => {
    setDeselectedMatchIds(partidosFiltrados.map(m => m.id));
  };

  // Partidos filtrados según las categorías seleccionadas
  const partidosFiltrados = useMemo(() => {
    return partidosJugador.filter(m => {
      if (!selectedCategorias.includes(m.cat)) return false;
      return true;
    });
  }, [partidosJugador, selectedCategorias]);

  // Selección automática de partido para la vista de detalle
  useEffect(() => {
    if (partidosFiltrados.length > 0) {
      const exists = partidosFiltrados.some(m => m.id === selectedMatchId);
      if (!exists) {
        setSelectedMatchId(partidosFiltrados[0].id);
      }
    } else {
      setSelectedMatchId('');
    }
  }, [partidosFiltrados, selectedMatchId]);

  // Partido actualmente seleccionado en detalle
  const activeMatch = useMemo(() => {
    return partidosFiltrados.find(m => m.id === selectedMatchId) || partidosFiltrados[0] || null;
  }, [partidosFiltrados, selectedMatchId]);

  // Lista de todos los partidos formateados con su estado de selección
  const allFormattedMatches = useMemo(() => {
    const list = partidosFiltrados.map(m => {
      const p = m.playerData;
      const min = Math.round(p.min || 0);
      const dist = Math.round(p.dist || 0);
      const drel = Math.round(p.drel || (min > 0 ? dist / min : 0));
      const hi = Math.round(p.hi || p.z1825 || 0);
      const s25 = Math.round(p.s25 || 0);
      const accAlta = Math.round(p.accAlta || 0);
      const decAlta = Math.round(p.decAlta || 0);
      const topSpeed = Number((p.topSpeed || 0).toFixed(1));
      const deltaDist = m.avgDist ? dist - m.avgDist : 0;
      const deltaDrel = m.avgDrel ? drel - m.avgDrel : 0;

      return {
        id: m.id,
        fecha: m.fecha,
        cat: m.cat,
        rival: m.rival,
        tipo: m.tipo,
        esPartido: m.esPartido,
        pos: formatPosicion(p.pos),
        min,
        dist,
        drel,
        hi,
        s25,
        accAlta,
        decAlta,
        topSpeed,
        deltaDist,
        deltaDrel,
        rawMatch: m,
        isIncluded: !deselectedMatchIds.includes(m.id)
      };
    });

    return list.sort((a, b) => {
      let valA = a[histSortCol];
      let valB = b[histSortCol];
      if (typeof valA === 'string') {
        return histSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = valA || 0;
      valB = valB || 0;
      return histSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [partidosFiltrados, deselectedMatchIds, histSortCol, histSortDir]);

  // Partidos efectivamente seleccionados (para cálculos, tabla consolidada y export PDF)
  const consolidatedMatches = useMemo(() => {
    return allFormattedMatches.filter(m => m.isIncluded);
  }, [allFormattedMatches]);

  const isAllMatchesSelected = partidosFiltrados.length > 0 && deselectedMatchIds.length === 0;
  const isSomeMatchesSelected = deselectedMatchIds.length > 0 && deselectedMatchIds.length < partidosFiltrados.length;

  const handleMasterCheckboxChange = () => {
    if (isAllMatchesSelected) {
      handleDeselectAllMatches();
    } else {
      handleSelectAllMatches();
    }
  };

  // Comparativa completa calculada para cada uno de los partidos seleccionados
  const matchComparisons = useMemo(() => {
    return consolidatedMatches.map(m => {
      const comp = m.rawMatch
        ? buildMatchComparison(m.rawMatch, selectedPlayer)
        : { playerRow: null, teammateRows: [], allRows: [], teammatesAvg: null, diffVsAvg: null };
      return {
        match: m,
        comp
      };
    });
  }, [consolidatedMatches, selectedPlayer]);

  // Construir comparativa de compañeros por posición para el partido activo en pantalla
  const { comparativaRows, teammatesAvg, diffVsAvg } = useMemo(() => {
    if (!activeMatch) return { comparativaRows: [], teammatesAvg: null, diffVsAvg: null };
    const found = matchComparisons.find(mc => mc.match.id === activeMatch.id);
    const comp = found ? found.comp : buildMatchComparison(activeMatch, selectedPlayer);
    return {
      comparativaRows: comp.allRows,
      teammatesAvg: comp.teammatesAvg,
      diffVsAvg: comp.diffVsAvg
    };
  }, [activeMatch, matchComparisons, selectedPlayer]);

  // Filas ordenadas para la tabla de detalle en pantalla
  const sortedRows = useMemo(() => {
    const list = [...comparativaRows];
    return list.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];

      if (typeof valA === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = valA || 0;
      valB = valB || 0;
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [comparativaRows, sortCol, sortDir]);

  // Estadísticas acumuladas y promedios de los partidos seleccionados
  const summaryConsolidated = useMemo(() => {
    if (!consolidatedMatches.length) return null;
    const len = consolidatedMatches.length;
    const sum = (k) => consolidatedMatches.reduce((acc, m) => acc + (m[k] || 0), 0);

    return {
      totalMin: sum('min'),
      totalDist: sum('dist'),
      totalHi: sum('hi'),
      totalS25: sum('s25'),
      avgMin: Math.round(sum('min') / len),
      avgDist: Math.round(sum('dist') / len),
      avgDrel: Math.round(sum('drel') / len),
      avgHi: Math.round(sum('hi') / len),
      avgS25: Math.round(sum('s25') / len),
      avgAccAlta: Number((sum('accAlta') / len).toFixed(1)),
      avgDecAlta: Number((sum('decAlta') / len).toFixed(1)),
      maxTopSpeed: Math.max(...consolidatedMatches.map(m => m.topSpeed || 0))
    };
  }, [consolidatedMatches]);

  // Foto oficial del jugador seleccionado
  const fotoPlayer = useMemo(() => {
    if (!selectedPlayer) return null;
    const cat = activeMatch ? activeMatch.cat : catActual;
    return resolvePlayerPhoto(selectedPlayer, cat);
  }, [selectedPlayer, activeMatch, catActual]);

  // Configuración del gráfico de barras horizontales
  const chartConfig = useMemo(() => {
    if (!comparativaRows || comparativaRows.length === 0) return null;

    const metricInfo = METRICAS_CONFIG.find(m => m.id === metricaActiva) || METRICAS_CONFIG[0];
    const sorted = [...comparativaRows].sort((a, b) => (b[metricaActiva] || 0) - (a[metricaActiva] || 0));

    const labels = sorted.map(r => {
      if (r.isPlayer) {
        return `★ ${r.nombreDisplay} (${r.puestoCorto})`;
      }
      return `${r.nombreDisplay}`;
    });

    const values = sorted.map(r => r[metricaActiva] || 0);

    const bgColors = sorted.map(r => {
      if (r.isPlayer) return '#002B66';
      return tema === 'oscuro' ? '#475569' : '#64748b';
    });

    const borderColors = sorted.map(r => {
      if (r.isPlayer) return '#0077b6';
      return tema === 'oscuro' ? '#64748b' : '#334155';
    });

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: `${metricInfo.label} (${metricInfo.unidad})`,
            data: values,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: 4,
            barThickness: 20
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${metricInfo.label}: ${ctx.raw} ${metricInfo.unidad}`
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: tema === 'oscuro' ? '#f1f5f9' : '#1e293b',
            font: {
              family: 'var(--font-mono, monospace)',
              size: 11,
              weight: 'bold'
            },
            formatter: (v) => `${v}`
          }
        },
        scales: {
          x: {
            grid: {
              color: tema === 'oscuro' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
            },
            ticks: {
              color: tema === 'oscuro' ? '#94a3b8' : '#64748b',
              font: { family: 'var(--font-mono, monospace)', size: 11 }
            },
            grace: '10%'
          },
          y: {
            grid: { display: false },
            ticks: {
              color: (ctx) => {
                const label = labels[ctx.index] || '';
                return label.startsWith('★') ? '#002B66' : (tema === 'oscuro' ? '#e2e8f0' : '#334155');
              },
              font: (ctx) => {
                const label = labels[ctx.index] || '';
                return {
                  family: 'var(--font-head, sans-serif)',
                  size: 11,
                  weight: label.startsWith('★') ? 'bold' : 'normal'
                };
              }
            }
          }
        }
      }
    };
  }, [comparativaRows, metricaActiva, tema]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const handleHistSort = (col) => {
    if (histSortCol === col) {
      setHistSortDir(histSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setHistSortCol(col);
      setHistSortDir('desc');
    }
  };

  const handleExportPDF = () => {
    if (consolidatedMatches.length === 0) {
      alert('Seleccioná al menos un partido para exportar el documento PDF.');
      return;
    }
    const catsStr = selectedCategorias.join(' + ');
    const title = `Integral Club - Partidos de ${selectedPlayer} (${catsStr} - Total ${consolidatedMatches.length} partidos)`;
    exportarPDF(title);
  };

  const isAllSelected = catsDelJugador.length > 0 && selectedCategorias.length === catsDelJugador.length;
  const isOnlyCuarta = selectedCategorias.length === 1 && selectedCategorias[0] === 'Cuarta';
  const isOnlyReserva = selectedCategorias.length === 1 && selectedCategorias[0] === 'Reserva';
  const isCuartaAndReserva = selectedCategorias.length === 2 && selectedCategorias.includes('Cuarta') && selectedCategorias.includes('Reserva');

  return (
    <div id="panel" className="comparar-puesto-container">
      {/* ─── ENCABEZADO EN PANTALLA ─── */}
      <div className="cpp-header-card">
        <div className="cpp-header-top">
          <div className="cpp-title-group">
            <h2 className="cpp-main-title">Comparativa por Puesto (Partido a Partido)</h2>
            <p className="cpp-main-desc">
              Monitoreo físico y métricas GPS de un jugador contra las distintas posiciones tácticas de sus compañeros en cada partido (filtro: mínimo 40 minutos jugados en la posición).
            </p>
          </div>

          <div className="cpp-header-actions">
            <button
              type="button"
              className="btn-pdf cpp-btn-export"
              onClick={handleExportPDF}
              disabled={consolidatedMatches.length === 0}
            >
              <Printer size={15} />
              <span>Exportar PDF (Total: {consolidatedMatches.length} {consolidatedMatches.length === 1 ? 'partido' : 'partidos'})</span>
            </button>
          </div>
        </div>

        {/* Banner explicativo de Multi-Categoría */}
        {activePlayerInfo && activePlayerInfo.cats.length > 1 && (
          <div className="cpp-multicat-alert-banner">
            <div className="cpp-alert-icon-wrap">
              <Layers size={18} />
            </div>
            <div className="cpp-alert-content">
              <strong>Historial Multi-Categoría detectado para {activePlayerInfo.displayName}:</strong>
              <span>
                {' '}Este jugador registra partidos oficiales en{' '}
                {activePlayerInfo.cats.map((c) => {
                  const cCount = partidosJugador.filter(m => m.cat === c).length;
                  return (
                    <span key={c} className={`cpp-cat-pill cpp-cat-${c.toLowerCase()}`}>
                      {c} División ({cCount} {cCount === 1 ? 'partido' : 'partidos'})
                    </span>
                  );
                })}
                . Podés seleccionar abajo exactamente qué categorías querés ver y exportar en un mismo documento PDF.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── BARRA DE CONTROLES Y PRESETS DE CATEGORÍAS ─── */}
      <div className="cpp-controls-bar">
        {/* Selector de Jugador */}
        <div className="cpp-control-group cpp-player-selector">
          <label className="cpp-control-label">
            <User size={14} />
            <span>Jugador a evaluar</span>
          </label>
          <div className="cpp-select-wrap">
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="cpp-select"
            >
              {rosterUnificado.map(p => (
                <option key={p.displayName} value={p.displayName}>
                  {p.displayName} {p.cats.length > 1 ? `(${p.cats.join(' + ')})` : `(${p.cats[0]})`} · {p.partidosCount} {p.partidosCount === 1 ? 'partido' : 'partidos'}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="cpp-select-arrow" />
          </div>
        </div>

        {/* MULTI-SELECCIÓN DE CATEGORÍAS CON BOTONES DIRECTOS (Cuarta + Reserva, Solo Cuarta, Solo Reserva) */}
        {catsDelJugador.length > 1 && (
          <div className="cpp-control-group cpp-cat-filter">
            <label className="cpp-control-label">
              <Filter size={14} />
              <span>Divisiones a incluir en el documento</span>
            </label>
            <div className="cpp-pills-row">
              {/* Presets Rápidos */}
              {catsDelJugador.includes('Cuarta') && catsDelJugador.includes('Reserva') && (
                <button
                  type="button"
                  className={`cpp-filter-pill cpp-preset-pill ${isCuartaAndReserva ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(['Cuarta', 'Reserva'])}
                >
                  <Check size={12} className="cpp-check-icon" />
                  <span>Reserva + Cuarta</span>
                </button>
              )}

              {catsDelJugador.includes('Cuarta') && (
                <button
                  type="button"
                  className={`cpp-filter-pill cpp-preset-pill ${isOnlyCuarta ? 'active' : ''}`}
                  onClick={() => handleSelectOnlyCat('Cuarta')}
                >
                  <span>Solo Cuarta</span>
                </button>
              )}

              {catsDelJugador.includes('Reserva') && (
                <button
                  type="button"
                  className={`cpp-filter-pill cpp-preset-pill ${isOnlyReserva ? 'active' : ''}`}
                  onClick={() => handleSelectOnlyCat('Reserva')}
                >
                  <span>Solo Reserva</span>
                </button>
              )}

              <button
                type="button"
                className={`cpp-filter-pill ${isAllSelected && !isCuartaAndReserva ? 'active' : ''}`}
                onClick={handleSelectAllCats}
              >
                Todas ({partidosJugador.length})
              </button>

              {/* Casillas individuales para control manual fino */}
              {catsDelJugador.map(cat => {
                const isSelected = selectedCategorias.includes(cat);
                const count = partidosJugador.filter(m => m.cat === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`cpp-filter-pill cpp-cat-toggle-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleToggleCat(cat)}
                    title={`Clic para alternar ${cat} División`}
                  >
                    <span className="cpp-checkbox-indicator">{isSelected ? '✓' : '○'}</span>
                    <span>{cat} ({count} {count === 1 ? 'partido' : 'partidos'})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── TABLA CONSOLIDADA DE TODOS LOS PARTIDOS SELECCIONADOS (PANTALLA & EXPORT PDF) ─── */}
      <div className="cpp-table-section-card cpp-consolidated-section">
        <div className="cpp-table-header">
          <div className="cpp-table-title-wrap">
            <TableIcon size={18} />
            <h3>
              Partidos Seleccionados ({consolidatedMatches.length}
              {allFormattedMatches.length !== consolidatedMatches.length ? (
                <span className="cpp-count-sub"> de {allFormattedMatches.length}</span>
              ) : null})
            </h3>
            <span className="cpp-cat-selection-badge">
              {selectedCategorias.join(' + ')}
            </span>
            {deselectedMatchIds.length > 0 && (
              <button
                type="button"
                className="cpp-btn-reselect-all"
                onClick={handleSelectAllMatches}
                title="Volver a seleccionar todos los partidos disponibles"
              >
                <Check size={13} />
                <span>Seleccionar todos ({allFormattedMatches.length})</span>
              </button>
            )}
          </div>

          <div className="cpp-table-actions">
            <button
              type="button"
              className="btn-pdf"
              onClick={handleExportPDF}
              disabled={consolidatedMatches.length === 0}
              title={consolidatedMatches.length === 0 ? "Seleccioná al menos un partido para exportar" : "Exportar reporte PDF oficial"}
            >
              <Printer size={14} />
              <span>Exportar PDF ({consolidatedMatches.length})</span>
            </button>
          </div>
        </div>

        {allFormattedMatches.length === 0 ? (
          <div className="cpp-empty-state">
            <Info size={20} />
            <p>No hay partidos con las categorías seleccionadas. Seleccioná al menos una división.</p>
          </div>
        ) : (
          <div className="table-responsive cpp-table-wrap">
            <table className="tabla-integral cpp-table cpp-table-consolidated">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }} title={isAllMatchesSelected ? 'Deseleccionar todos los partidos' : 'Seleccionar todos los partidos'}>
                    <input
                      type="checkbox"
                      checked={isAllMatchesSelected}
                      ref={el => {
                        if (el) el.indeterminate = isSomeMatchesSelected;
                      }}
                      onChange={handleMasterCheckboxChange}
                      className="cpp-checkbox-round"
                      aria-label="Seleccionar o deseleccionar todos los partidos"
                    />
                  </th>
                  <th onClick={() => handleHistSort('fecha')} className="cpp-th-sortable">
                    <div className="cpp-th-content">
                      <span>Fecha</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('cat')} className="cpp-th-sortable">
                    <div className="cpp-th-content">
                      <span>División</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('rival')} className="cpp-th-sortable">
                    <div className="cpp-th-content">
                      <span>Rival / Encuentro</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('pos')} className="cpp-th-sortable">
                    <div className="cpp-th-content">
                      <span>Puesto</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('min')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>Min</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('dist')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>Distancia (m)</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('drel')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>m/min</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('hi')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>HSR &gt;20</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('s25')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>Sprints &gt;25</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('accAlta')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>Acel. A</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('decAlta')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>Desacel. A</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('topSpeed')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>V. Máx</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => handleHistSort('deltaDist')} className="cpp-th-sortable cpp-th-num">
                    <div className="cpp-th-content">
                      <span>vs Prom. Equipo</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allFormattedMatches.map((m) => {
                  const isCurrent = m.id === selectedMatchId;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMatchId(m.id)}
                      className={`cpp-tr cpp-tr-clickable ${isCurrent ? 'cpp-tr-current-match' : ''} ${!m.isIncluded ? 'cpp-tr-excluded' : ''}`}
                      title="Clic para ver la comparativa por puestos de este partido abajo"
                    >
                      <td style={{ width: 44, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={m.isIncluded}
                          onChange={() => handleToggleMatch(m.id)}
                          className="cpp-checkbox-round"
                          title={m.isIncluded ? 'Deseleccionar este partido' : 'Incluir este partido'}
                          aria-label={`Incluir partido del ${m.fecha} vs ${m.rival}`}
                        />
                      </td>
                      <td className="font-mono">{m.fecha}</td>
                      <td>
                        <span className={`cpp-chip-cat-badge ${m.cat.toLowerCase()}`}>
                          {m.cat}
                        </span>
                      </td>
                      <td>
                        <strong>{formatRivalLabel(m.rival, m.esPartido)}</strong>
                        {!m.isIncluded && (
                          <span className="cpp-match-excluded-tag">Excluido</span>
                        )}
                      </td>
                      <td>
                        <span className="cpp-pos-badge">{m.pos}</span>
                      </td>
                      <td className="cpp-td-num">{m.min}</td>
                      <td className="cpp-td-num font-mono"><strong>{m.dist.toLocaleString()}</strong></td>
                      <td className="cpp-td-num font-mono">{m.drel}</td>
                      <td className="cpp-td-num font-mono">{m.hi}</td>
                      <td className="cpp-td-num font-mono">{m.s25}</td>
                      <td className="cpp-td-num font-mono">{m.accAlta}</td>
                      <td className="cpp-td-num font-mono">{m.decAlta}</td>
                      <td className="cpp-td-num font-mono">{m.topSpeed}</td>
                      <td className="cpp-td-num font-mono">
                        <span style={{ color: m.deltaDist >= 0 ? '#10b981' : '#f43f5e' }}>
                          {m.deltaDist > 0 ? `+${m.deltaDist}` : m.deltaDist} m
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {allFormattedMatches.length > 0 && consolidatedMatches.length === 0 && (
                <tfoot>
                  <tr className="cpp-tr-footer-empty">
                    <td colSpan={14} style={{ textAlign: 'center', padding: '16px', color: '#f43f5e', fontWeight: 600 }}>
                      Todos los partidos están deseleccionados.{' '}
                      <button
                        type="button"
                        onClick={handleSelectAllMatches}
                        className="cpp-link-reinclude"
                        style={{ textDecoration: 'underline', background: 'none', border: 'none', color: '#002B66', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Seleccionar todos los partidos
                      </button>{' '}
                      para reactivar los promedios y la exportación PDF.
                    </td>
                  </tr>
                </tfoot>
              )}
              {summaryConsolidated && (
                <tfoot>
                  <tr className="cpp-tr-footer-avg">
                    <td colSpan={5}>
                      <strong>
                        PROMEDIO POR ENCUENTRO ({consolidatedMatches.length} {consolidatedMatches.length === 1 ? 'partido' : 'partidos'}
                        {allFormattedMatches.length !== consolidatedMatches.length ? ` de ${allFormattedMatches.length}` : ''})
                      </strong>
                    </td>
                    <td className="cpp-td-num">{summaryConsolidated.avgMin}</td>
                    <td className="cpp-td-num font-mono"><strong>{summaryConsolidated.avgDist.toLocaleString()}</strong></td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgDrel}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgHi}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgS25}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgAccAlta}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgDecAlta}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.maxTopSpeed} (pico)</td>
                    <td className="cpp-td-num font-mono">-</td>
                  </tr>
                  <tr className="cpp-tr-footer-totales">
                    <td colSpan={5}>
                      <strong>TOTAL ACUMULADO ({consolidatedMatches.length} {consolidatedMatches.length === 1 ? 'partido' : 'partidos'})</strong>
                    </td>
                    <td className="cpp-td-num"><strong>{summaryConsolidated.totalMin} min</strong></td>
                    <td className="cpp-td-num font-mono"><strong>{summaryConsolidated.totalDist.toLocaleString()} m</strong></td>
                    <td colSpan={7}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ─── SELECTOR HORIZONTAL DE PARTIDOS (PANTALLA) ─── */}
      <div className="cpp-matches-selector-card">
        <div className="cpp-matches-header">
          <div className="cpp-matches-header-left">
            <Calendar size={16} />
            <span>
              Partidos disponibles ({partidosFiltrados.length}) ·{' '}
              <strong style={{ color: '#002B66' }}>
                {consolidatedMatches.length} {consolidatedMatches.length === 1 ? 'seleccionado' : 'seleccionados'}
              </strong>
            </span>
          </div>
          {deselectedMatchIds.length > 0 && (
            <button
              type="button"
              className="cpp-btn-select-all-link"
              onClick={handleSelectAllMatches}
              title="Volver a seleccionar todos los partidos"
            >
              <Check size={13} />
              <span>Seleccionar todos</span>
            </button>
          )}
        </div>

        {partidosFiltrados.length > 0 && (
          <div className="cpp-matches-scroll">
            {partidosFiltrados.map(m => {
              const isSelected = m.id === selectedMatchId;
              const isIncluded = !deselectedMatchIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMatchId(m.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMatchId(m.id); }}
                  className={`cpp-match-chip ${isSelected ? 'active' : ''} ${m.cat.toLowerCase()} ${!isIncluded ? 'cpp-match-chip-excluded' : ''}`}
                >
                  <div className="cpp-chip-top">
                    <span className={`cpp-chip-cat-badge ${m.cat.toLowerCase()}`}>
                      {m.cat}
                    </span>
                    <span className="cpp-chip-date">{m.fecha}</span>
                    <button
                      type="button"
                      className={`cpp-chip-toggle-btn ${isIncluded ? 'active' : 'inactive'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMatch(m.id);
                      }}
                      title={isIncluded ? "Clic para deseleccionar este partido" : "Clic para incluir este partido"}
                      aria-label={isIncluded ? `Deseleccionar partido del ${m.fecha}` : `Incluir partido del ${m.fecha}`}
                    >
                      {isIncluded ? <Check size={11} /> : <span style={{ fontSize: '10px', lineHeight: 1 }}>✕</span>}
                    </button>
                  </div>
                  <div className="cpp-chip-rival">
                    <span>{formatRivalLabel(m.rival, m.esPartido)}</span>
                    {!isIncluded && <span className="cpp-chip-excluded-badge">Excluido</span>}
                  </div>
                  <div className="cpp-chip-metrics">
                    <span>{Math.round(m.playerData.min || 0)} min</span>
                    <span>·</span>
                    <span>{Math.round(m.playerData.dist || 0)} m</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DETALLE DEL PARTIDO SELECCIONADO ─── */}
      {activeMatch && (
        <>
          {/* Ficha Resumen del Encuentro & Jugador */}
          <div className="cpp-match-summary-card">
            <div className="cpp-match-player-profile">
              <div className="cpp-player-avatar-wrap">
                {fotoPlayer ? (
                  <img
                    src={fotoPlayer.url}
                    alt={selectedPlayer}
                    className="cpp-player-avatar-img"
                  />
                ) : (
                  <div className="cpp-player-avatar-placeholder">
                    <User size={30} />
                  </div>
                )}
              </div>
              <div className="cpp-player-meta">
                <div className="cpp-player-name">{selectedPlayer}</div>
                <div className="cpp-player-pos-role">
                  Puesto táctico: <strong>{formatPosicion(activeMatch.playerData.pos)}</strong>
                </div>
                <div className="cpp-match-provenance">
                  Partido disputado en <span className="cpp-cat-highlight">{activeMatch.cat} División</span> · Rival:{' '}
                  <strong>{activeMatch.rival}</strong> ({activeMatch.fecha})
                  {deselectedMatchIds.includes(activeMatch.id) && (
                    <span className="cpp-match-excluded-tag" style={{ marginLeft: 8 }}>
                      Excluido del consolidado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tarjetas resumen del jugador en este partido */}
            <div className="cpp-summary-stats-grid">
              <div className="cpp-stat-box">
                <span className="cpp-stat-label">Minutos Jugados</span>
                <span className="cpp-stat-value">{Math.round(activeMatch.playerData.min || 0)}</span>
                <span className="cpp-stat-unit">minutos netos</span>
              </div>
              <div className="cpp-stat-box">
                <span className="cpp-stat-label">Distancia Total</span>
                <span className="cpp-stat-value">{Math.round(activeMatch.playerData.dist || 0).toLocaleString()}</span>
                <span className="cpp-stat-unit">
                  {teammatesAvg ? `${(Math.round(activeMatch.playerData.dist || 0) - teammatesAvg.dist > 0 ? '+' : '')}${Math.round(activeMatch.playerData.dist || 0) - teammatesAvg.dist} m vs compañeros` : 'metros'}
                </span>
              </div>
              <div className="cpp-stat-box">
                <span className="cpp-stat-label">Distancia Relativa</span>
                <span className="cpp-stat-value">{Math.round(activeMatch.playerData.drel || 0)}</span>
                <span className="cpp-stat-unit">m/min</span>
              </div>
              <div className="cpp-stat-box">
                <span className="cpp-stat-label">HSR (&gt;20 km/h)</span>
                <span className="cpp-stat-value">{Math.round(activeMatch.playerData.hi || activeMatch.playerData.z1825 || 0)}</span>
                <span className="cpp-stat-unit">metros alta velocidad</span>
              </div>
              <div className="cpp-stat-box">
                <span className="cpp-stat-label">Sprints (&gt;25 km/h)</span>
                <span className="cpp-stat-value">{Math.round(activeMatch.playerData.s25 || 0)}</span>
                <span className="cpp-stat-unit">metros sprint</span>
              </div>
              <div className="cpp-stat-box">
                <span className="cpp-stat-label">Acel. / Desacel. Altas</span>
                <span className="cpp-stat-value">
                  {Math.round(activeMatch.playerData.accAlta || 0)} / {Math.round(activeMatch.playerData.decAlta || 0)}
                </span>
                <span className="cpp-stat-unit">esfuerzos mecánicos</span>
              </div>
            </div>
          </div>

          {/* ─── GRÁFICO COMPARATIVO POR PUESTO TÁCTICO ─── */}
          <div className="cpp-chart-section-card">
            <div className="cpp-chart-header">
              <div className="cpp-chart-title-wrap">
                <TrendingUp size={18} />
                <h3>Comparativa Gráfica por Puesto Táctico</h3>
              </div>

              {/* Selector de Métrica */}
              <div className="cpp-metric-selector">
                <label>Métrica:</label>
                <select
                  value={metricaActiva}
                  onChange={(e) => setMetricaActiva(e.target.value)}
                  className="cpp-select cpp-metric-select"
                >
                  {METRICAS_CONFIG.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.unidad})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cpp-chart-body" style={{ height: `${Math.max(340, comparativaRows.length * 28)}px` }}>
              {chartConfig && <ChartCanvas config={chartConfig} />}
            </div>

            <div className="cpp-chart-legend-footer">
              <div className="cpp-legend-item">
                <span className="cpp-legend-dot cpp-dot-player" />
                <span><strong>{selectedPlayer}</strong> (Jugador evaluado)</span>
              </div>
              <div className="cpp-legend-item">
                <span className="cpp-legend-dot cpp-dot-teammate" />
                <span>Puestos tácticos de compañeros en este partido</span>
              </div>
            </div>
          </div>

          {/* ─── TABLA DE DETALLE POR POSICIÓN TÁCTICA (EN PANTALLA) ─── */}
          <div className="cpp-table-section-card cpp-screen-match-detail-table">
            <div className="cpp-table-header">
              <div className="cpp-table-title-wrap">
                <Users size={18} />
                <h3>Planilla de Rendimiento por Posición Táctica</h3>
              </div>
            </div>

            <div className="table-responsive cpp-table-wrap">
              <table className="tabla-integral cpp-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('nombreDisplay')} className="cpp-th-sortable">
                      <div className="cpp-th-content">
                        <span>Puesto Táctico / Rol</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('min')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>Minutos</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('dist')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>Distancia (m)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('drel')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>m/min</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('hi')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>HSR &gt;20 (m)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('s25')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>Sprints &gt;25</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('accAlta')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>Acel. Altas</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('decAlta')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>Desacel. Altas</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('topSpeed')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>V. Máx (km/h)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('deltaDistVsPlayer')} className="cpp-th-sortable cpp-th-num">
                      <div className="cpp-th-content">
                        <span>vs {selectedPlayer}</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r, i) => {
                    const isSelected = r.isPlayer;
                    return (
                      <tr
                        key={i}
                        className={`cpp-tr ${isSelected ? 'cpp-tr-selected-player' : 'cpp-tr-teammate'}`}
                      >
                        <td className="cpp-td-role">
                          {isSelected ? (
                            <div className="cpp-player-cell-highlight">
                              {fotoPlayer ? (
                                <img
                                  src={fotoPlayer.url}
                                  alt={r.nombreDisplay}
                                  className="cpp-mini-avatar"
                                />
                              ) : (
                                <div className="cpp-mini-placeholder">
                                  <User size={13} />
                                </div>
                              )}
                              <div className="cpp-player-cell-text">
                                <span className="cpp-player-cell-name">{r.nombreDisplay}</span>
                                <span className="cpp-player-cell-badge">★ Seleccionado ({r.puestoDisplay})</span>
                              </div>
                            </div>
                          ) : (
                            <div className="cpp-teammate-cell-anon">
                              <div className="cpp-shield-anon">
                                <Shield size={13} />
                              </div>
                              <span className="cpp-teammate-pos-name">{r.nombreDisplay}</span>
                            </div>
                          )}
                        </td>
                        <td className="cpp-td-num">{r.min}</td>
                        <td className="cpp-td-num font-mono"><strong>{r.dist.toLocaleString()}</strong></td>
                        <td className="cpp-td-num font-mono">{r.drel}</td>
                        <td className="cpp-td-num font-mono">{r.hi}</td>
                        <td className="cpp-td-num font-mono">{r.s25}</td>
                        <td className="cpp-td-num font-mono">{r.accAlta}</td>
                        <td className="cpp-td-num font-mono">{r.decAlta}</td>
                        <td className="cpp-td-num font-mono">{r.topSpeed}</td>
                        <td className="cpp-td-num font-mono">
                          {isSelected ? (
                            <span className="cpp-ref-badge">★ Base</span>
                          ) : (
                            <div className="cpp-delta-cell">
                              <span style={{ color: r.deltaDistVsPlayer >= 0 ? '#10b981' : '#f43f5e', fontWeight: 800 }}>
                                {r.deltaDistVsPlayer > 0 ? `+${r.deltaDistVsPlayer.toLocaleString()}` : r.deltaDistVsPlayer.toLocaleString()} m
                              </span>
                              <span className="cpp-delta-sub">
                                {r.deltaDrelVsPlayer > 0 ? `+${r.deltaDrelVsPlayer}` : r.deltaDrelVsPlayer} m/min
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {teammatesAvg && (
                  <tfoot>
                    <tr className="cpp-tr-footer-avg">
                      <td>
                        <strong>Promedio Compañeros (Plantel)</strong>
                      </td>
                      <td className="cpp-td-num">{teammatesAvg.min}</td>
                      <td className="cpp-td-num font-mono"><strong>{teammatesAvg.dist.toLocaleString()}</strong></td>
                      <td className="cpp-td-num font-mono">{teammatesAvg.drel}</td>
                      <td className="cpp-td-num font-mono">{teammatesAvg.hi}</td>
                      <td className="cpp-td-num font-mono">{teammatesAvg.s25}</td>
                      <td className="cpp-td-num font-mono">{teammatesAvg.accAlta}</td>
                      <td className="cpp-td-num font-mono">{teammatesAvg.decAlta}</td>
                      <td className="cpp-td-num font-mono">{teammatesAvg.topSpeed}</td>
                      <td className="cpp-td-num font-mono">
                        <span style={{ color: teammatesAvg.deltaDistVsPlayer >= 0 ? '#10b981' : '#f43f5e', fontWeight: 800 }}>
                          {teammatesAvg.deltaDistVsPlayer > 0 ? `+${teammatesAvg.deltaDistVsPlayer.toLocaleString()}` : teammatesAvg.deltaDistVsPlayer.toLocaleString()} m
                        </span>
                      </td>
                    </tr>
                    {diffVsAvg && (
                      <tr className="cpp-tr-footer-diff">
                        <td>
                          <strong>Dif. {selectedPlayer} vs Promedio</strong>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: diffVsAvg.min >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                            {diffVsAvg.min > 0 ? `+${diffVsAvg.min}` : diffVsAvg.min}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <strong style={{ color: diffVsAvg.dist >= 0 ? '#10b981' : '#f43f5e' }}>
                            {diffVsAvg.dist > 0 ? `+${diffVsAvg.dist.toLocaleString()}` : diffVsAvg.dist.toLocaleString()} m
                          </strong>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: diffVsAvg.drel >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                            {diffVsAvg.drel > 0 ? `+${diffVsAvg.drel}` : diffVsAvg.drel}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: diffVsAvg.hi >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                            {diffVsAvg.hi > 0 ? `+${diffVsAvg.hi}` : diffVsAvg.hi}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: diffVsAvg.s25 >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                            {diffVsAvg.s25 > 0 ? `+${diffVsAvg.s25}` : diffVsAvg.s25}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: diffVsAvg.accAlta >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                            {diffVsAvg.accAlta > 0 ? `+${diffVsAvg.accAlta}` : diffVsAvg.accAlta}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: diffVsAvg.decAlta >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                            {diffVsAvg.decAlta > 0 ? `+${diffVsAvg.decAlta}` : diffVsAvg.decAlta}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: diffVsAvg.topSpeed >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                            {diffVsAvg.topSpeed > 0 ? `+${diffVsAvg.topSpeed}` : diffVsAvg.topSpeed}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: diffVsAvg.dist >= 0 ? '#10b981' : '#f43f5e', fontWeight: 800 }}>
                            {diffVsAvg.dist > 0 ? `+${diffVsAvg.dist.toLocaleString()}` : diffVsAvg.dist.toLocaleString()} m ({diffVsAvg.pctDist}%)
                          </span>
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DOCUMENTO OFICIAL EXCLUSIVO PARA EXPORTACIÓN PDF
          Hoja 1: Resumen ejecutivo consolidado de todos los partidos
          Hojas 2..N+1: Un solo partido por hoja con Planilla por Posición Táctica
         ════════════════════════════════════════════════════════════════════ */}
      <div className="cpp-print-document">
        {/* ─── HOJA 1: RESUMEN EJECUTIVO CONSOLIDADO ─── */}
        <div className="cpp-print-page cpp-print-summary-page">
          <div className="cpp-print-top-row">
            <div>
              <div className="cpp-print-inst-name">Integral Club • FORMATIVAS & RESERVA</div>
              <div className="cpp-print-doc-title">
                Informe Resumen de Partidos Disputados · {selectedPlayer}
              </div>
              <div className="cpp-print-doc-sub">
                Divisiones evaluadas: <strong>{selectedCategorias.join(' + ')}</strong> · Total: <strong>{consolidatedMatches.length} {consolidatedMatches.length === 1 ? 'partido' : 'partidos'}</strong>
              </div>
            </div>
            <div className="cpp-print-meta-col">
              <div><strong>Temporada 2026</strong></div>
              <div>Fecha de emisión: {new Date().toLocaleDateString('es-AR')}</div>
              <div className="cpp-print-page-pill">Hoja 1 de {consolidatedMatches.length + 1}</div>
            </div>
          </div>

          {/* Ficha ejecutiva del jugador */}
          <div className="cpp-print-player-strip">
            {fotoPlayer && (
              <img src={fotoPlayer.url} alt={selectedPlayer} className="cpp-print-photo" />
            )}
            <div className="cpp-print-player-meta">
              <div className="cpp-print-player-name">{selectedPlayer}</div>
              <div className="cpp-print-player-puesto">
                Puesto táctico: <strong>{activeMatch ? formatPosicion(activeMatch.playerData.pos) : 'Defensor Central'}</strong>
              </div>
              <div className="cpp-print-cat-tags">
                {selectedCategorias.map(c => {
                  const pCount = consolidatedMatches.filter(m => m.cat === c).length;
                  return (
                    <span key={c} className={`cpp-cat-pill cpp-cat-${c.toLowerCase()}`}>
                      {c} División ({pCount} {pCount === 1 ? 'partido' : 'partidos'})
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 7 KPIs consolidados */}
            {summaryConsolidated && (
              <div className="cpp-print-kpis-grid">
                <div className="cpp-print-kpi">
                  <span className="cpp-kpi-val">{consolidatedMatches.length}</span>
                  <span className="cpp-kpi-lbl">Total Partidos</span>
                </div>
                <div className="cpp-print-kpi">
                  <span className="cpp-kpi-val">{summaryConsolidated.totalMin.toLocaleString()} min</span>
                  <span className="cpp-kpi-lbl">Min. Totales ({summaryConsolidated.avgMin} prom.)</span>
                </div>
                <div className="cpp-print-kpi">
                  <span className="cpp-kpi-val">{summaryConsolidated.totalDist.toLocaleString()} m</span>
                  <span className="cpp-kpi-lbl">Dist. Total ({summaryConsolidated.avgDist.toLocaleString()} m prom.)</span>
                </div>
                <div className="cpp-print-kpi">
                  <span className="cpp-kpi-val">{summaryConsolidated.avgDrel} m/min</span>
                  <span className="cpp-kpi-lbl">Intensidad Media</span>
                </div>
                <div className="cpp-print-kpi">
                  <span className="cpp-kpi-val">{summaryConsolidated.totalHi.toLocaleString()} m</span>
                  <span className="cpp-kpi-lbl">HSR Total ({summaryConsolidated.avgHi} m prom.)</span>
                </div>
                <div className="cpp-print-kpi">
                  <span className="cpp-kpi-val">{summaryConsolidated.totalS25.toLocaleString()} m</span>
                  <span className="cpp-kpi-lbl">Sprints Total</span>
                </div>
                <div className="cpp-print-kpi">
                  <span className="cpp-kpi-val">{summaryConsolidated.maxTopSpeed} km/h</span>
                  <span className="cpp-kpi-lbl">Vel. Máx Pico</span>
                </div>
              </div>
            )}
          </div>

          {/* Tabla resumen consolidada de todos los partidos */}
          <div className="cpp-print-summary-table-wrap">
            <div className="cpp-print-table-header-strip">
              <span className="cpp-print-table-title">Resumen de Encuentros Seleccionados (Total: {consolidatedMatches.length} {consolidatedMatches.length === 1 ? 'partido' : 'partidos'})</span>
              <span className="cpp-print-badge-pill">{selectedCategorias.join(' + ')}</span>
            </div>
            <table className="tabla-integral cpp-table cpp-table-print-summary">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>División</th>
                  <th>Rival / Encuentro</th>
                  <th>Puesto</th>
                  <th className="cpp-th-num">Min</th>
                  <th className="cpp-th-num">Distancia (m)</th>
                  <th className="cpp-th-num">m/min</th>
                  <th className="cpp-th-num">HSR &gt;20</th>
                  <th className="cpp-th-num">Sprints &gt;25</th>
                  <th className="cpp-th-num">Acel. A</th>
                  <th className="cpp-th-num">Desacel. A</th>
                  <th className="cpp-th-num">V. Máx</th>
                  <th className="cpp-th-num">vs Prom. Equipo</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedMatches.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono">{m.fecha}</td>
                    <td><span className={`cpp-chip-cat-badge ${m.cat.toLowerCase()}`}>{m.cat}</span></td>
                    <td><strong>{formatRivalLabel(m.rival, m.esPartido)}</strong></td>
                    <td><span className="cpp-pos-badge">{m.pos}</span></td>
                    <td className="cpp-td-num">{m.min}</td>
                    <td className="cpp-td-num font-mono"><strong>{m.dist.toLocaleString()}</strong></td>
                    <td className="cpp-td-num font-mono">{m.drel}</td>
                    <td className="cpp-td-num font-mono">{m.hi}</td>
                    <td className="cpp-td-num font-mono">{m.s25}</td>
                    <td className="cpp-td-num font-mono">{m.accAlta}</td>
                    <td className="cpp-td-num font-mono">{m.decAlta}</td>
                    <td className="cpp-td-num font-mono">{m.topSpeed}</td>
                    <td className="cpp-td-num font-mono">
                      <span style={{ color: m.deltaDist >= 0 ? '#059669' : '#dc2626' }}>
                        {m.deltaDist > 0 ? `+${m.deltaDist}` : m.deltaDist} m
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {summaryConsolidated && (
                <tfoot>
                  <tr className="cpp-tr-footer-avg">
                    <td colSpan={4}><strong>PROMEDIO POR ENCUENTRO (Total: {consolidatedMatches.length} {consolidatedMatches.length === 1 ? 'partido' : 'partidos'})</strong></td>
                    <td className="cpp-td-num">{summaryConsolidated.avgMin}</td>
                    <td className="cpp-td-num font-mono"><strong>{summaryConsolidated.avgDist.toLocaleString()}</strong></td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgDrel}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgHi}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgS25}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgAccAlta}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.avgDecAlta}</td>
                    <td className="cpp-td-num font-mono">{summaryConsolidated.maxTopSpeed} (pico)</td>
                    <td className="cpp-td-num font-mono">-</td>
                  </tr>
                  <tr className="cpp-tr-footer-totales">
                    <td colSpan={4}><strong>TOTAL ACUMULADO ({consolidatedMatches.length} {consolidatedMatches.length === 1 ? 'partido' : 'partidos'})</strong></td>
                    <td className="cpp-td-num"><strong>{summaryConsolidated.totalMin} min</strong></td>
                    <td className="cpp-td-num font-mono"><strong>{summaryConsolidated.totalDist.toLocaleString()} m</strong></td>
                    <td colSpan={7}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ─── HOJAS SIGUIENTES: PARTIDO A PARTIDO (EXACTAMENTE 1 PARTIDO POR HOJA) ─── */}
        {matchComparisons.map(({ match: m, comp }, idx) => {
          const pageNum = idx + 2;
          const totalPages = consolidatedMatches.length + 1;

          return (
            <div key={m.id} className="cpp-print-page cpp-print-match-page">
              {/* Encabezado del Partido */}
              <div className="cpp-print-match-header">
                <div className="cpp-print-match-header-left">
                  <div className="cpp-print-inst-name">Integral Club • FORMATIVAS & RESERVA</div>
                  <div className="cpp-print-match-title-row">
                    <span className={`cpp-chip-cat-badge ${m.cat.toLowerCase()}`}>{m.cat} División</span>
                    <span className="cpp-print-match-rival-title">{formatRivalLabel(m.rival, m.esPartido)}</span>
                  </div>
                  <div className="cpp-print-match-meta-sub">
                    Fecha del encuentro: <strong>{m.fecha}</strong> · Tipo: <strong>{m.tipo}</strong>
                  </div>
                </div>

                <div className="cpp-print-match-header-right">
                  <div className="cpp-print-player-badge-line">
                    Jugador: <strong>{selectedPlayer}</strong> ({m.pos})
                  </div>
                  <div className="cpp-print-match-page-count">
                    Partido {idx + 1} de {consolidatedMatches.length} · Hoja {pageNum} de {totalPages}
                  </div>
                </div>
              </div>

              {/* Barra Resumen de Rendimiento del Jugador en este partido */}
              <div className="cpp-print-match-kpi-bar">
                <div className="cpp-print-kpi-item">
                  <span className="cpp-pki-val">{m.min} min</span>
                  <span className="cpp-pki-lbl">Minutos</span>
                </div>
                <div className="cpp-print-kpi-item">
                  <span className="cpp-pki-val">{m.dist.toLocaleString()} m</span>
                  <span className="cpp-pki-lbl">Distancia Total</span>
                </div>
                <div className="cpp-print-kpi-item">
                  <span className="cpp-pki-val">{m.drel} m/min</span>
                  <span className="cpp-pki-lbl">Intensidad</span>
                </div>
                <div className="cpp-print-kpi-item">
                  <span className="cpp-pki-val">{m.hi} m</span>
                  <span className="cpp-pki-lbl">HSR &gt;20</span>
                </div>
                <div className="cpp-print-kpi-item">
                  <span className="cpp-pki-val">{m.s25} m</span>
                  <span className="cpp-pki-lbl">Sprints &gt;25</span>
                </div>
                <div className="cpp-print-kpi-item">
                  <span className="cpp-pki-val">{m.accAlta} / {m.decAlta}</span>
                  <span className="cpp-pki-lbl">Acel / Desac</span>
                </div>
                <div className="cpp-print-kpi-item">
                  <span className="cpp-pki-val">{m.topSpeed} km/h</span>
                  <span className="cpp-pki-lbl">Vel. Máxima</span>
                </div>
                <div className="cpp-print-kpi-item">
                  <span className="cpp-pki-val" style={{ color: m.deltaDist >= 0 ? '#059669' : '#dc2626' }}>
                    {m.deltaDist > 0 ? `+${m.deltaDist}` : m.deltaDist} m
                  </span>
                  <span className="cpp-pki-lbl">vs Prom. Plantel</span>
                </div>
              </div>

              {/* Subtítulo de Planilla de Rendimiento por Posición */}
              <div className="cpp-print-match-table-title-strip">
                <span className="cpp-print-table-title">Planilla de Rendimiento por Posición Táctica</span>
                <span className="cpp-print-match-sub-detail">
                  Monitoreo físico de {selectedPlayer} frente a las posiciones tácticas de sus compañeros en este encuentro
                </span>
              </div>

              {/* Tabla Comparativa de Rendimiento por Posición Táctica */}
              <table className="tabla-integral cpp-table cpp-table-match-positions">
                <thead>
                  <tr>
                    <th>Puesto Táctico / Rol</th>
                    <th className="cpp-th-num">Minutos</th>
                    <th className="cpp-th-num">Distancia (m)</th>
                    <th className="cpp-th-num">m/min</th>
                    <th className="cpp-th-num">HSR &gt;20 (m)</th>
                    <th className="cpp-th-num">Sprints &gt;25</th>
                    <th className="cpp-th-num">Acel. Altas</th>
                    <th className="cpp-th-num">Desacel. Altas</th>
                    <th className="cpp-th-num">V. Máx (km/h)</th>
                    <th className="cpp-th-num">vs {selectedPlayer}</th>
                  </tr>
                </thead>
                <tbody>
                  {comp.allRows.map((r, rIdx) => {
                    const isSelected = r.isPlayer;
                    return (
                      <tr
                        key={rIdx}
                        className={`cpp-tr ${isSelected ? 'cpp-tr-selected-player' : 'cpp-tr-teammate'}`}
                      >
                        <td className="cpp-td-role">
                          {isSelected ? (
                            <div className="cpp-player-cell-highlight">
                              <span className="cpp-star-badge">★</span>
                              <strong>{r.nombreDisplay}</strong>
                              <span className="cpp-player-cell-badge">({r.puestoDisplay})</span>
                            </div>
                          ) : (
                            <span className="cpp-teammate-pos-name">{r.nombreDisplay}</span>
                          )}
                        </td>
                        <td className="cpp-td-num">{r.min}</td>
                        <td className="cpp-td-num font-mono"><strong>{r.dist.toLocaleString()}</strong></td>
                        <td className="cpp-td-num font-mono">{r.drel}</td>
                        <td className="cpp-td-num font-mono">{r.hi}</td>
                        <td className="cpp-td-num font-mono">{r.s25}</td>
                        <td className="cpp-td-num font-mono">{r.accAlta}</td>
                        <td className="cpp-td-num font-mono">{r.decAlta}</td>
                        <td className="cpp-td-num font-mono">{r.topSpeed}</td>
                        <td className="cpp-td-num font-mono">
                          {isSelected ? (
                            <span className="cpp-ref-badge-print">★ Base</span>
                          ) : (
                            <div>
                              <span style={{ color: r.deltaDistVsPlayer >= 0 ? '#059669' : '#dc2626', fontWeight: 800 }}>
                                {r.deltaDistVsPlayer > 0 ? `+${r.deltaDistVsPlayer.toLocaleString()}` : r.deltaDistVsPlayer.toLocaleString()} m
                              </span>
                              <span style={{ fontSize: '7.5px', color: '#64748b', display: 'block' }}>
                                {r.deltaDrelVsPlayer > 0 ? `+${r.deltaDrelVsPlayer}` : r.deltaDrelVsPlayer} m/min
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {comp.teammatesAvg && (
                  <tfoot>
                    <tr className="cpp-tr-footer-avg">
                      <td>
                        <strong>Promedio Compañeros (Plantel)</strong>
                      </td>
                      <td className="cpp-td-num">{comp.teammatesAvg.min}</td>
                      <td className="cpp-td-num font-mono"><strong>{comp.teammatesAvg.dist.toLocaleString()}</strong></td>
                      <td className="cpp-td-num font-mono">{comp.teammatesAvg.drel}</td>
                      <td className="cpp-td-num font-mono">{comp.teammatesAvg.hi}</td>
                      <td className="cpp-td-num font-mono">{comp.teammatesAvg.s25}</td>
                      <td className="cpp-td-num font-mono">{comp.teammatesAvg.accAlta}</td>
                      <td className="cpp-td-num font-mono">{comp.teammatesAvg.decAlta}</td>
                      <td className="cpp-td-num font-mono">{comp.teammatesAvg.topSpeed}</td>
                      <td className="cpp-td-num font-mono">
                        <span style={{ color: comp.teammatesAvg.deltaDistVsPlayer >= 0 ? '#059669' : '#dc2626', fontWeight: 800 }}>
                          {comp.teammatesAvg.deltaDistVsPlayer > 0 ? `+${comp.teammatesAvg.deltaDistVsPlayer.toLocaleString()}` : comp.teammatesAvg.deltaDistVsPlayer.toLocaleString()} m
                        </span>
                      </td>
                    </tr>
                    {comp.diffVsAvg && (
                      <tr className="cpp-tr-footer-diff">
                        <td>
                          <strong>Dif. {selectedPlayer} vs Promedio</strong>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: comp.diffVsAvg.min >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {comp.diffVsAvg.min > 0 ? `+${comp.diffVsAvg.min}` : comp.diffVsAvg.min}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <strong style={{ color: comp.diffVsAvg.dist >= 0 ? '#059669' : '#dc2626' }}>
                            {comp.diffVsAvg.dist > 0 ? `+${comp.diffVsAvg.dist.toLocaleString()}` : comp.diffVsAvg.dist.toLocaleString()} m
                          </strong>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: comp.diffVsAvg.drel >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {comp.diffVsAvg.drel > 0 ? `+${comp.diffVsAvg.drel}` : comp.diffVsAvg.drel}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: comp.diffVsAvg.hi >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {comp.diffVsAvg.hi > 0 ? `+${comp.diffVsAvg.hi}` : comp.diffVsAvg.hi}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: comp.diffVsAvg.s25 >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {comp.diffVsAvg.s25 > 0 ? `+${comp.diffVsAvg.s25}` : comp.diffVsAvg.s25}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: comp.diffVsAvg.accAlta >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {comp.diffVsAvg.accAlta > 0 ? `+${comp.diffVsAvg.accAlta}` : comp.diffVsAvg.accAlta}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: comp.diffVsAvg.decAlta >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {comp.diffVsAvg.decAlta > 0 ? `+${comp.diffVsAvg.decAlta}` : comp.diffVsAvg.decAlta}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: comp.diffVsAvg.topSpeed >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {comp.diffVsAvg.topSpeed > 0 ? `+${comp.diffVsAvg.topSpeed}` : comp.diffVsAvg.topSpeed}
                          </span>
                        </td>
                        <td className="cpp-td-num font-mono">
                          <span style={{ color: comp.diffVsAvg.dist >= 0 ? '#059669' : '#dc2626', fontWeight: 800 }}>
                            {comp.diffVsAvg.dist > 0 ? `+${comp.diffVsAvg.dist.toLocaleString()}` : comp.diffVsAvg.dist.toLocaleString()} m ({comp.diffVsAvg.pctDist}%)
                          </span>
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
