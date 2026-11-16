import React, { useState, useMemo } from 'react';
import {
  Printer,
  Filter,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Sliders,
  Shield,
  Search,
  Award,
  Users
} from 'lucide-react';
import { resolvePlayerPhoto } from '../../../utils/photoResolver';

// ─── FORMATEO DE NOMBRES DE RIVALES PARA ROTACIÓN DIAGONAL ───
export function formatRivalName(rivalStr, matchIdx) {
  if (!rivalStr || rivalStr.trim().toUpperCase() === 'MD') {
    return `Fecha ${matchIdx + 1}`;
  }
  let s = String(rivalStr).trim();
  s = s.replace(/^VS\.?\s*/i, ''); // Quitar prefijo 'vs ' o 'vs.'

  const upper = s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (upper.includes('CENTRAL CORDOBA') || upper.includes('CENTRA CBA') || upper.includes('C. CORDONA')) return 'C. Córdoba';
  if (upper === 'CASLA' || upper.includes('SAN LORENZO')) return 'San Lorenzo';
  if (upper === 'GELP' || upper.includes('GIMNASIA LP')) return 'Gimnasia LP';
  if (upper.includes('G. MENDOZA') || upper.includes('G MENDOZA') || upper.includes('GIMNASIA MZA')) return 'G. Mendoza';
  if (upper.includes('ROSARIO CENTRAL') || upper === 'R. CENTRAL' || upper === 'RC') return 'R. Central';
  if (upper.includes('ATL') && upper.includes('RAFAELA')) return 'Atl. Rafaela';
  if (upper.includes('ATL') && upper.includes('TUCUMAN')) return 'Atl. Tucumán';
  if (upper.includes('INDEP') && upper.includes('RIVADAVIA')) return 'Ind. Rivadavia';
  if (upper.includes('SAN MARTIN')) return 'San Martín SJ';
  if (upper.includes('DEFENSA')) return 'Defensa y Just.';
  if (upper === 'AAAJ' || upper.includes('ARGENTINOS')) return 'Argentinos';
  if (upper.includes('BARRACAS')) return 'Barracas Ctl.';
  if (upper === 'UNION') return 'Unión';
  if (upper === 'VELEZ') return 'Vélez';
  if (upper === 'COLON') return 'Colón';
  if (upper === 'HURACAN') return 'Huracán';
  if (upper === 'LANUS') return 'Lanús';
  if (upper === 'NEWELLS' || upper === "NEWELL'S") return "Newell's";

  // Capitalización estándar
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ─── VARIABLES DISPONIBLES PARA CONFIGURAR ───
export const AVAILABLE_METRICS = [
  {
    id: 'dist',
    label: 'Distancia Total',
    unit: 'm',
    decimals: 0,
    getValue: j => j.dist || 0,
    format: v => Math.round(v).toLocaleString('es-AR') + ' m',
    formatShort: v => Math.round(v).toLocaleString('es-AR')
  },
  {
    id: 's25',
    label: 'Distancia > 25 km/h',
    unit: 'm',
    decimals: 0,
    getValue: j => j.s25 || 0,
    format: v => Math.round(v).toLocaleString('es-AR') + ' m',
    formatShort: v => Math.round(v).toLocaleString('es-AR')
  },
  {
    id: 'sprints',
    label: 'Sprints (>25 km/h)',
    unit: 'cant.',
    decimals: 0,
    getValue: j => j.sprints || 0,
    format: v => Math.round(v) + ' spr',
    formatShort: v => Math.round(v)
  },
  {
    id: 'tension',
    label: 'Tensión: Acc + Dec (>2,5 m/s)',
    unit: 'cant.',
    decimals: 0,
    getValue: j => (j.acc || 0) + (j.dec || 0),
    format: v => Math.round(v) + ' acc+dec',
    formatShort: v => Math.round(v)
  },
  {
    id: 'z1618',
    label: 'Distancia 16-18 km/h',
    unit: 'm',
    decimals: 0,
    getValue: j => j.z1618 || 0,
    format: v => Math.round(v).toLocaleString('es-AR') + ' m',
    formatShort: v => Math.round(v).toLocaleString('es-AR')
  },
  {
    id: 'topSpeed',
    label: 'Velocidad Máxima',
    unit: 'km/h',
    decimals: 1,
    getValue: j => j.topSpeed || 0,
    format: v => (Number(v) || 0).toFixed(1) + ' km/h',
    formatShort: v => (Number(v) || 0).toFixed(1)
  },
  {
    id: 'drel',
    label: 'Distancia Relativa (Intensidad)',
    unit: 'm/min',
    decimals: 1,
    getValue: j => j.drel || 0,
    format: v => (Number(v) || 0).toFixed(1) + ' m/min',
    formatShort: v => (Number(v) || 0).toFixed(1)
  },
  {
    id: 'hi',
    label: 'Alta Intensidad (HI)',
    unit: 'm',
    decimals: 0,
    getValue: j => j.hi || 0,
    format: v => Math.round(v).toLocaleString('es-AR') + ' m',
    formatShort: v => Math.round(v).toLocaleString('es-AR')
  },
  {
    id: 'z1825',
    label: 'Distancia 18-25 km/h',
    unit: 'm',
    decimals: 0,
    getValue: j => j.z1825 || 0,
    format: v => Math.round(v).toLocaleString('es-AR') + ' m',
    formatShort: v => Math.round(v).toLocaleString('es-AR')
  },
  {
    id: 'tension4',
    label: 'Tensión Alta: Acc + Dec (>4 m/s)',
    unit: 'cant.',
    decimals: 0,
    getValue: j => (j.accAlta || 0) + (j.decAlta || 0),
    format: v => Math.round(v) + ' acc+dec>4',
    formatShort: v => Math.round(v)
  },
  {
    id: 'acc',
    label: 'Aceleraciones > 2,5 m/s',
    unit: 'cant.',
    decimals: 0,
    getValue: j => j.acc || 0,
    format: v => Math.round(v) + ' acc',
    formatShort: v => Math.round(v)
  },
  {
    id: 'dec',
    label: 'Desaceleraciones > 2,5 m/s',
    unit: 'cant.',
    decimals: 0,
    getValue: j => j.dec || 0,
    format: v => Math.round(v) + ' dec',
    formatShort: v => Math.round(v)
  },
  {
    id: 'accAlta',
    label: 'Aceleraciones > 4 m/s (Máximas)',
    unit: 'cant.',
    decimals: 0,
    getValue: j => j.accAlta || 0,
    format: v => Math.round(v) + ' acc>4',
    formatShort: v => Math.round(v)
  },
  {
    id: 'decAlta',
    label: 'Desaceleraciones > 4 m/s (Frenadas)',
    unit: 'cant.',
    decimals: 0,
    getValue: j => j.decAlta || 0,
    format: v => Math.round(v) + ' dec>4',
    formatShort: v => Math.round(v)
  },
  {
    id: 'min',
    label: 'Minutos Jugados',
    unit: 'min',
    decimals: 0,
    getValue: j => j.min || 0,
    format: v => Math.round(v) + "'",
    formatShort: v => Math.round(v)
  }
];

export const DEFAULT_SELECTED_METRICS = [
  'dist',
  's25',
  'sprints',
  'tension',
  'z1618',
  'topSpeed'
];

// ─── COMPONENTE GRÁFICO SVG CON NOMBRES EN DIAGONAL ───
function SvgLineChart({
  title,
  unit,
  metricDef,
  matches,
  catData,
  playerData,
  isCover = false,
  chartId
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Dimensiones vectoriales del lienzo SVG
  // Damos 58px abajo para que los nombres en diagonal respiren perfectamente sin recortarse
  const width = 450;
  const height = 230;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 28;
  const padBottom = 58;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Recolectar valores válidos para determinar rango Y
  const validCat = catData.filter(v => v !== null && v !== undefined && !isNaN(v));
  const validPlayer = (playerData || []).filter(v => v !== null && v !== undefined && !isNaN(v));
  const allValues = [...validCat, ...validPlayer];

  let rawMin = allValues.length ? Math.min(...allValues) : 0;
  let rawMax = allValues.length ? Math.max(...allValues) : 100;

  let minY = 0;
  let maxY = rawMax > 0 ? rawMax * 1.12 : 100;

  // Caso especial Velocidad Máxima: comenzar en base realista para mejor resolución visual
  if (metricDef.id === 'topSpeed' && rawMin > 20) {
    minY = Math.max(0, Math.floor(rawMin - 2));
    maxY = Math.ceil(rawMax + 1.5);
  }

  const rangeY = maxY - minY || 1;

  // Coordenadas para cada partido
  const nMatches = Math.max(1, matches.length);
  const getX = i => padLeft + (i / Math.max(1, nMatches - 1)) * plotW;
  const getY = val => padTop + plotH - ((val - minY) / rangeY) * plotH;

  // Construir línea de Categoría
  const catPoints = catData.map((val, i) => {
    if (val === null || val === undefined) return null;
    return { x: getX(i), y: getY(val), val, match: matches[i], idx: i };
  });

  const catPathD = catPoints.reduce((acc, p) => {
    if (!p) return acc;
    return acc ? `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  // Construir área bajo la curva para carátula
  let catAreaD = '';
  if (isCover && catPoints.length > 0) {
    const firstP = catPoints[0];
    const lastP = catPoints[catPoints.length - 1];
    const baseY = (padTop + plotH).toFixed(1);
    catAreaD = `${catPathD} L ${lastP.x.toFixed(1)} ${baseY} L ${firstP.x.toFixed(1)} ${baseY} Z`;
  }

  // Construir línea de Jugador (conecta los partidos que jugó)
  const playerPoints = (playerData || []).map((val, i) => {
    if (val === null || val === undefined || isNaN(val)) return null;
    return { x: getX(i), y: getY(val), val, match: matches[i], idx: i };
  });

  const validPlayerPoints = playerPoints.filter(Boolean);
  const playerPathD = validPlayerPoints.reduce((acc, p) => {
    return acc ? `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  // Estadísticas del gráfico
  const catAvg = validCat.length ? validCat.reduce((a, b) => a + b, 0) / validCat.length : 0;
  const catMax = validCat.length ? Math.max(...validCat) : 0;
  const catMaxMatch = validCat.length ? matches[catData.indexOf(catMax)] : null;

  const playerAvg = validPlayer.length ? validPlayer.reduce((a, b) => a + b, 0) / validPlayer.length : 0;
  const playerMax = validPlayer.length ? Math.max(...validPlayer) : 0;
  const playerMaxIdx = validPlayer.length ? playerData.indexOf(playerMax) : -1;

  const deltaPct = catAvg > 0 && playerAvg > 0 ? ((playerAvg - catAvg) / catAvg) * 100 : 0;

  // Ticks horizontales de referencia (3 líneas guía)
  const ticksY = [
    { val: minY, y: getY(minY) },
    { val: minY + rangeY * 0.5, y: getY(minY + rangeY * 0.5) },
    { val: maxY, y: getY(maxY) }
  ];

  const gradId = `catGrad_${chartId || Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="inf-chart-card">
      <div className="inf-chart-header">
        <div className="inf-chart-title-box">
          <span className="inf-chart-title">{title}</span>
        </div>

        <div className="inf-chart-legend-box">
          {isCover ? (
            <div className="inf-legend-cover">
              <span className="inf-pill-cat">
                Promedio: <strong>{metricDef.format(catAvg)}</strong>
              </span>
              {catMaxMatch && (
                <span className="inf-pill-peak">
                  Pico: <strong>{metricDef.format(catMax)}</strong> ({catMaxMatch.rivalName})
                </span>
              )}
            </div>
          ) : (
            <div className="inf-legend-player">
              <span className="inf-pill-cat-ref">
                <span className="inf-line-sample-cat" /> Media Cat: <strong>{metricDef.format(catAvg)}</strong>
              </span>
              <span className="inf-pill-player-main">
                <span className="inf-dot-sample-player" /> Jugador: <strong>{validPlayer.length ? metricDef.format(playerAvg) : 'S/D'}</strong>
              </span>
              {validPlayer.length > 0 && (
                <span className={`inf-delta-badge ${deltaPct >= 0 ? 'pos' : 'neg'}`}>
                  {deltaPct >= 0 ? `+${deltaPct.toFixed(1)}%` : `${deltaPct.toFixed(1)}%`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="inf-svg-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="inf-svg-canvas"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#002B66" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#002B66" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grillas Horizontales */}
          {ticksY.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={t.y}
                x2={width - padRight}
                y2={t.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={idx === 0 ? 'none' : '3 3'}
              />
              <text
                x={padLeft - 6}
                y={t.y + 3}
                fill="#64748b"
                fontSize="8.5"
                fontWeight="500"
                textAnchor="end"
                className="inf-svg-tick"
              >
                {metricDef.formatShort(t.val)}
              </text>
            </g>
          ))}

          {/* Área sombreada bajo la curva (solo en Carátula) */}
          {isCover && catAreaD && (
            <path d={catAreaD} fill={`url(#${gradId})`} />
          )}

          {/* Línea de Categoría */}
          {isCover ? (
            <path
              d={catPathD}
              fill="none"
              stroke="#002B66"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d={catPathD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.8"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Puntos de Categoría en Carátula */}
          {isCover &&
            catPoints.map((p, idx) => {
              if (!p) return null;
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4.5 : 2.8}
                  fill="#002B66"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="inf-point-circle"
                />
              );
            })}

          {/* Línea del Jugador */}
          {!isCover && playerPathD && (
            <path
              d={playerPathD}
              fill="none"
              stroke="#003882"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Puntos individuales del Jugador (solo donde disputó minutos) */}
          {!isCover &&
            validPlayerPoints.map((p, idx) => {
              const isHovered = hoveredIdx === p.idx;
              const isPeak = p.idx === playerMaxIdx;
              return (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 5.5 : isPeak ? 4.2 : 3.2}
                    fill={isPeak ? '#003882' : '#002B66'}
                    stroke="#ffffff"
                    strokeWidth={isPeak ? '2' : '1.5'}
                    className="inf-point-circle"
                  />
                  {isPeak && validPlayerPoints.length > 2 && (
                    <text
                      x={p.x}
                      y={p.y - 7}
                      fill="#003882"
                      fontSize="8"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {metricDef.formatShort(p.val)}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Eje X: Ticks y NOMBRES DE RIVALES EN DIAGONAL (-50°) */}
          {matches.map((m, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIdx === idx;
            const yTick = padTop + plotH;

            return (
              <g
                key={idx}
                className="inf-x-group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Zona de interacción para mouse */}
                <rect
                  x={x - (plotW / nMatches) / 2}
                  y={padTop}
                  width={plotW / nMatches}
                  height={plotH + padBottom}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                />

                {/* Pequeña marca vertical en el eje */}
                <line
                  x1={x}
                  y1={yTick}
                  x2={x}
                  y2={yTick + 4}
                  stroke={isHovered ? '#002B66' : '#cbd5e1'}
                  strokeWidth={isHovered ? '1.5' : '1'}
                />

                {/* Texto del Rival rotado en diagonal hacia la izquierda */}
                <g transform={`translate(${x}, ${yTick + 7})`}>
                  <text
                    x="0"
                    y="0"
                    transform="rotate(-50)"
                    textAnchor="end"
                    fill={isHovered ? '#002B66' : '#475569'}
                    fontSize="7.8"
                    fontWeight={isHovered ? '800' : '600'}
                    letterSpacing="-0.2px"
                    className="inf-x-label-diag"
                  >
                    {m.rivalName}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Línea guía vertical flotante al hacer hover */}
          {hoveredIdx !== null && matches[hoveredIdx] && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={padTop}
                x2={getX(hoveredIdx)}
                y2={padTop + plotH}
                stroke="#002B66"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* Card flotante HTML de detalle al hacer hover */}
        {hoveredIdx !== null && matches[hoveredIdx] && (
          <div
            className="inf-chart-tooltip"
            style={{
              left: `${Math.min(80, Math.max(15, (getX(hoveredIdx) / width) * 100))}%`
            }}
          >
            <div className="inf-tt-rival">
              Fecha {hoveredIdx + 1}: <strong>vs {matches[hoveredIdx].rivalFull}</strong>
            </div>
            <div className="inf-tt-date">{matches[hoveredIdx].fecha}</div>
            <div className="inf-tt-row">
              <span>Media Cat:</span>
              <strong>{catData[hoveredIdx] != null ? metricDef.format(catData[hoveredIdx]) : '—'}</strong>
            </div>
            {!isCover && (
              <div className="inf-tt-row player">
                <span>Jugador:</span>
                <strong>
                  {playerData && playerData[hoveredIdx] != null
                    ? metricDef.format(playerData[hoveredIdx])
                    : 'No disputó'}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PÁGINA 1: CARÁTULA CON EL PROMEDIO DE LA CATEGORÍA ───
function CategoryCoverPage({
  catActual,
  matches,
  playersCount,
  selectedMetrics,
  catAveragesByMetric,
  pageIndex = 1,
  totalPages = 1
}) {
  const firstMatch = matches[0];
  const lastMatch = matches[matches.length - 1];

  return (
    <div className="inf-final-page">
      {/* Encabezado Superior */}
      <header className="inf-page-header">
        <div className="inf-hdr-brand">
          <img src="/escudo.png" alt="Integral Club" className="inf-escudo" />
          <div className="inf-hdr-titles">
            <span className="inf-hdr-sub">Integral Club · ÁREA FÍSICA Y GPS</span>
            <h1 className="inf-hdr-main">PROMEDIO DE LA CATEGORÍA · INFORME COLECTIVO</h1>
            <span className="inf-hdr-cat">TEMPORADA OFICIAL 2026 · {catActual.toUpperCase()} DIVISIÓN</span>
          </div>
        </div>

        <div className="inf-hdr-meta">
          <div className="inf-meta-badge">
            <Shield size={14} />
            <span><strong>{matches.length}</strong> Partidos Oficiales</span>
          </div>
          <div className="inf-meta-badge">
            <Users size={14} />
            <span><strong>{playersCount}</strong> Jugadores Evaluados</span>
          </div>
          <div className="inf-meta-badge date">
            <span>Período: {firstMatch ? firstMatch.fecha : ''} al {lastMatch ? lastMatch.fecha : ''}</span>
          </div>
          <div className="inf-page-pill">
            Hoja {pageIndex} de {totalPages}
          </div>
        </div>
      </header>

      {/* Subtítulo informativo */}
      <div className="inf-section-banner">
        <span>Curva evolutiva promedio de la {catActual} División partido a partido en las 6 variables seleccionadas</span>
      </div>

      {/* Grilla 3x2 de los 6 gráficos con nombres en diagonal */}
      <div className="inf-charts-grid">
        {selectedMetrics.map((metId, idx) => {
          const metricDef = AVAILABLE_METRICS.find(m => m.id === metId) || AVAILABLE_METRICS[0];
          const catData = matches.map(m => catAveragesByMetric[m.id]?.[metId] ?? null);

          return (
            <SvgLineChart
              key={metId}
              chartId={`cover_${metId}_${idx}`}
              title={metricDef.label}
              unit={metricDef.unit}
              metricDef={metricDef}
              matches={matches}
              catData={catData}
              isCover={true}
            />
          );
        })}
      </div>

      {/* Pie de Página */}
      <footer className="inf-page-footer">
        <div className="inf-ft-left">Integral Club Formativas · Centro de Alto Rendimiento</div>
        <div className="inf-ft-center">Dirección de Rendimiento Físico & Monitoreo GPS</div>
        <div className="inf-ft-right">Hoja {pageIndex} de {totalPages}</div>
      </footer>
    </div>
  );
}

// ─── PÁGINA INDIVIDUAL: HOJA POR JUGADOR ───
function PlayerPage({
  player,
  catActual,
  matches,
  selectedMetrics,
  catAveragesByMetric,
  pageIndex,
  totalPages
}) {
  const fotoInfo = useMemo(() => {
    return resolvePlayerPhoto(player.name, catActual);
  }, [player.name, catActual]);

  const initials = useMemo(() => {
    const parts = player.name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'RC';
  }, [player.name]);

  const pctMatches = matches.length > 0 ? Math.round((player.matchesCount / matches.length) * 100) : 0;
  const avgMinPlayed = player.matchesCount > 0 ? Math.round(player.totalMin / player.matchesCount) : 0;
  const kmAcumulados = (player.totalDist / 1000).toFixed(1);

  return (
    <div className="inf-final-page">
      {/* Encabezado Superior con Identificación y Foto Oficial */}
      <header className="inf-page-header player-hdr">
        <div className="inf-hdr-brand">
          <img src="/escudo.png" alt="Integral Club" className="inf-escudo-small" />

          {/* Foto oficial o iniciales con estilo Integral */}
          <div className="inf-player-photo-wrap">
            {fotoInfo && fotoInfo.url ? (
              <img
                src={fotoInfo.url}
                alt={player.name}
                className="inf-player-photo"
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="inf-player-photo-placeholder"
              style={{ display: fotoInfo && fotoInfo.url ? 'none' : 'flex' }}
            >
              <span>{initials}</span>
            </div>
          </div>

          <div className="inf-hdr-titles">
            <span className="inf-hdr-sub">INFORME INDIVIDUAL DE PARTIDOS · {catActual.toUpperCase()}</span>
            <h1 className="inf-player-name">{player.name}</h1>
            <div className="inf-player-tags">
              <span className="inf-tag-pos">{player.pos || 'DC'}</span>
              <span className="inf-tag-cat">{catActual} División</span>
            </div>
          </div>
        </div>

        {/* KPIs de participación del jugador en la temporada */}
        <div className="inf-player-stats-strip">
          <div className="inf-pstat-item">
            <span className="inf-pstat-lbl">Partidos</span>
            <span className="inf-pstat-val"><strong>{player.matchesCount}</strong> <small>/ {matches.length} ({pctMatches}%)</small></span>
          </div>
          <div className="inf-pstat-item">
            <span className="inf-pstat-lbl">Minutos</span>
            <span className="inf-pstat-val"><strong>{Math.round(player.totalMin)}'</strong> <small>(~{avgMinPlayed}'/p)</small></span>
          </div>
          <div className="inf-pstat-item">
            <span className="inf-pstat-lbl">Distancia Total</span>
            <span className="inf-pstat-val"><strong>{kmAcumulados}</strong> <small>km</small></span>
          </div>
          <div className="inf-pstat-item">
            <span className="inf-pstat-lbl">Pico Vel. Máx</span>
            <span className="inf-pstat-val highlight"><strong>{player.topSpeedMax > 0 ? `${player.topSpeedMax.toFixed(1)}` : '—'}</strong> <small>km/h</small></span>
          </div>
          <div className="inf-page-pill">
            Hoja {pageIndex} de {totalPages}
          </div>
        </div>
      </header>

      {/* Subtítulo de guía */}
      <div className="inf-section-banner player-banner">
        <span>Línea celeste sólida: rendimiento individual de {player.name} · Línea gris discontinua: media de la categoría ({catActual})</span>
      </div>

      {/* Grilla 3x2 de los 6 gráficos */}
      <div className="inf-charts-grid">
        {selectedMetrics.map(metId => {
          const metricDef = AVAILABLE_METRICS.find(m => m.id === metId) || AVAILABLE_METRICS[0];
          const catData = matches.map(m => catAveragesByMetric[m.id]?.[metId] ?? null);
          const playerData = matches.map(m => player.sessionsByMatch[m.id]?.[metId] ?? null);

          return (
            <SvgLineChart
              key={metId}
              title={metricDef.label}
              unit={metricDef.unit}
              metricDef={metricDef}
              matches={matches}
              catData={catData}
              playerData={playerData}
              isCover={false}
            />
          );
        })}
      </div>

      {/* Pie de Página */}
      <footer className="inf-page-footer">
        <div className="inf-ft-left">Integral Club Formativas · Informe Individual de Rendimiento Físico</div>
        <div className="inf-ft-center">Centro de Alto Rendimiento · Documento Confidencial</div>
        <div className="inf-ft-right">Hoja {pageIndex} de {totalPages}</div>
      </footer>
    </div>
  );
}

// ─── PANEL PRINCIPAL INFORME FINAL ───
export default function InformeFinalPanel({ data, catActual }) {
  // 1. Estado de las 6 Variables Seleccionadas
  const [selectedMetrics, setSelectedMetrics] = useState(DEFAULT_SELECTED_METRICS);
  const [configOpen, setConfigOpen] = useState(false);

  // 2. Estado de Jugadores Seleccionados
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPartidosFiltro, setMinPartidosFiltro] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deseleccionados, setDeseleccionados] = useState(() => new Set());

  // 3. Modo de visualización en pantalla: 'paginated' (hoja a hoja) o 'all' (scroll continuo)
  const [viewMode, setViewMode] = useState('paginated');
  const [activePageIndex, setActivePageIndex] = useState(0); // 0 = Carátula Promedio Cat, 1..N = Jugador

  // ─── EXTRACCIÓN Y PROCESAMIENTO DE PARTIDOS ───
  const matches = useMemo(() => {
    if (!data || !Array.isArray(data.sesiones)) return [];

    const rawMatches = data.sesiones.filter(s => {
      const tipo = String(s.tipo || '').toLowerCase();
      const per = String(s.per || '').toLowerCase();
      return tipo === 'partido' || per.includes('partido') || per === 'md';
    });

    // Ordenar cronológicamente
    const sorted = [...rawMatches].sort((a, b) => {
      const parseD = str => {
        if (!str) return new Date(0);
        const parts = String(str).split('/').map(Number);
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
        return new Date(0);
      };
      return parseD(a.fecha) - parseD(b.fecha);
    });

    return sorted.map((s, idx) => {
      const rivalClean = (s.rival && s.rival.trim()) || (s.per && s.per !== 'MD' ? s.per.trim() : `Partido ${idx + 1}`);
      const rivalName = formatRivalName(rivalClean, idx);
      return {
        id: `match_${idx}_${s.fecha}`,
        idx,
        fecha: s.fecha || `F${idx + 1}`,
        rivalFull: rivalClean,
        rivalName,
        jugadores: Array.isArray(s.jugadores) ? s.jugadores : []
      };
    });
  }, [data]);

  // ─── PROMEDIOS DE LA CATEGORÍA POR PARTIDO ───
  const catAveragesByMetric = useMemo(() => {
    const result = {};

    matches.forEach(m => {
      result[m.id] = {};
      const activePlayersInMatch = (m.jugadores || []).filter(j => (j.min || 0) > 0 || (j.dist || 0) > 500);

      AVAILABLE_METRICS.forEach(met => {
        if (!activePlayersInMatch.length) {
          result[m.id][met.id] = 0;
          return;
        }

        const vals = activePlayersInMatch.map(j => met.getValue(j));
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        result[m.id][met.id] = avg;
      });
    });

    return result;
  }, [matches]);

  // ─── EXTRACCIÓN Y ESTADÍSTICAS POR JUGADOR ───
  const allPlayers = useMemo(() => {
    const playersMap = {};

    matches.forEach(m => {
      (m.jugadores || []).forEach(j => {
        const pName = (j.jugador || '').trim();
        if (!pName) return;

        const isPlayed = (j.min || 0) > 0 || (j.dist || 0) > 500;
        if (!isPlayed) return;

        if (!playersMap[pName]) {
          playersMap[pName] = {
            name: pName,
            pos: j.pos || 'DC',
            matchesCount: 0,
            totalMin: 0,
            totalDist: 0,
            topSpeedMax: 0,
            sessionsByMatch: {}
          };
        }

        playersMap[pName].matchesCount++;
        playersMap[pName].totalMin += (j.min || 0);
        playersMap[pName].totalDist += (j.dist || 0);
        if ((j.topSpeed || 0) > playersMap[pName].topSpeedMax) {
          playersMap[pName].topSpeedMax = j.topSpeed;
        }
        if (j.pos && (!playersMap[pName].pos || playersMap[pName].pos === 'DC')) {
          playersMap[pName].pos = j.pos;
        }

        // Guardar métricas del partido para este jugador
        playersMap[pName].sessionsByMatch[m.id] = {};
        AVAILABLE_METRICS.forEach(met => {
          playersMap[pName].sessionsByMatch[m.id][met.id] = met.getValue(j);
        });
      });
    });

    // Ordenar de mayor a menor según cantidad de partidos disputados
    return Object.values(playersMap).sort((a, b) => b.matchesCount - a.matchesCount);
  }, [matches]);

  // Jugadores filtrados según umbral de partidos y búsqueda
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(p => {
      if (p.matchesCount < minPartidosFiltro) return false;
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [allPlayers, minPartidosFiltro, searchTerm]);

  // Jugadores habilitados para exportación (los filtrados que no estén deseleccionados)
  const activeExportPlayers = useMemo(() => {
    return filteredPlayers.filter(p => !deseleccionados.has(p.name));
  }, [filteredPlayers, deseleccionados]);

  // Total de hojas (1 carátula promedio categoría + 1 por cada jugador activo)
  const totalPages = activeExportPlayers.length + 1;

  // Manejo de cambio de variable en uno de los 6 casilleros
  const handleSelectMetric = (slotIndex, newMetricId) => {
    setSelectedMetrics(prev => {
      const next = [...prev];
      next[slotIndex] = newMetricId;
      return next;
    });
  };

  const handleResetMetrics = () => {
    setSelectedMetrics(DEFAULT_SELECTED_METRICS);
  };

  const handleTogglePlayer = pName => {
    setDeseleccionados(prev => {
      const next = new Set(prev);
      if (next.has(pName)) {
        next.delete(pName);
      } else {
        next.add(pName);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setDeseleccionados(new Set());
  };

  const handleDeselectAll = () => {
    setDeseleccionados(new Set(allPlayers.map(p => p.name)));
  };

  // ─── DISPARADOR DE IMPRESIÓN / GUARDADO PDF HORIZONTAL ───
  const handlePrint = () => {
    const origTitle = document.title;
    const cleanCat = String(catActual || '').replace(/[^a-zA-Z0-9]/g, '');
    document.title = `Informe_Final_Partidos_${cleanCat}_Integral_Club_2026`;
    document.body.classList.add('is-printing-informe-final');

    setTimeout(() => {
      window.print();

      const restore = () => {
        document.title = origTitle;
        document.body.classList.remove('is-printing-informe-final');
        window.removeEventListener('afterprint', restore);
      };

      if ('onafterprint' in window) {
        window.addEventListener('afterprint', restore, { once: true });
      }
      setTimeout(restore, 2000);
    }, 200);
  };

  if (!matches.length) {
    return (
      <div className="inf-final-empty">
        <Shield size={48} className="inf-empty-icon" />
        <h3>No se encontraron partidos para la categoría {catActual}</h3>
        <p>Asegurate de que las sesiones tengan tipo "Partido" en la planilla.</p>
      </div>
    );
  }

  const safePageIndex = Math.min(activePageIndex, Math.max(0, totalPages - 1));

  return (
    <div className="inf-final-container">
      {/* ─── BARRA DE CONTROL EN PANTALLA (NO SALE EN PDF) ─── */}
      <section className="inf-final-screen-controls">
        <div className="inf-ctrl-left">
          <div className="inf-ctrl-badge-main">
            <Award size={18} className="text-integral-cyan" />
            <div>
              <span className="inf-ctrl-title">Informe Final de Competencia</span>
              <span className="inf-ctrl-sub">{catActual} División · {matches.length} partidos · {totalPages} hojas (1 carátula promedio + {activeExportPlayers.length} jugadores)</span>
            </div>
          </div>
        </div>

        <div className="inf-ctrl-actions">
          {/* Botón Configurar Variables */}
          <button
            type="button"
            className={`btn-inf-ctrl ${configOpen ? 'active' : ''}`}
            onClick={() => setConfigOpen(!configOpen)}
            title="Elegir las 6 variables a graficar"
          >
            <Sliders size={15} />
            <span>Configurar Variables ({selectedMetrics.length})</span>
          </button>

          {/* Botón Filtrar Jugadores */}
          <button
            type="button"
            className={`btn-inf-ctrl ${filterOpen ? 'active' : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
            title="Filtrar qué jugadores entran en el reporte"
          >
            <Filter size={15} />
            <span>Jugadores ({activeExportPlayers.length}/{allPlayers.length})</span>
          </button>

          {/* Selector de Modo de Vista */}
          <div className="inf-view-toggle">
            <button
              type="button"
              className={`btn-toggle-view ${viewMode === 'paginated' ? 'active' : ''}`}
              onClick={() => setViewMode('paginated')}
              title="Ver hoja por hoja"
            >
              <Eye size={14} />
              <span>Hoja a hoja</span>
            </button>
            <button
              type="button"
              className={`btn-toggle-view ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
              title="Ver todas las hojas en continuo"
            >
              <span>Ver todas ({totalPages})</span>
            </button>
          </div>

          {/* BOTÓN PRINCIPAL EXPORTAR PDF / IMPRIMIR HORIZONTAL */}
          <button
            type="button"
            className="btn-inf-export-pdf"
            onClick={handlePrint}
            title="Exportar a PDF en formato Horizontal (Apaisado): 1 carátula + 1 hoja por jugador"
          >
            <Printer size={16} />
            <span>Exportar PDF Horizontal ({totalPages} hojas)</span>
          </button>
        </div>
      </section>

      {/* ─── PANEL DESPLEGABLE: CONFIGURACIÓN DE LAS 6 VARIABLES ─── */}
      {configOpen && (
        <div className="inf-config-drawer">
          <div className="inf-drawer-head">
            <div className="inf-dh-title">
              <Sliders size={16} />
              <span>Seleccioná las 6 variables que querés ver en los gráficos</span>
            </div>
            <button
              type="button"
              className="btn-inf-reset"
              onClick={handleResetMetrics}
              title="Volver a las 6 variables sugeridas"
            >
              <RotateCcw size={13} />
              <span>Restablecer por Defecto</span>
            </button>
          </div>

          <div className="inf-metric-slots-grid">
            {selectedMetrics.map((curMetricId, slotIdx) => (
              <div key={slotIdx} className="inf-slot-card">
                <span className="inf-slot-badge">Gráfico {slotIdx + 1}</span>
                <select
                  className="inf-slot-select"
                  value={curMetricId}
                  onChange={e => handleSelectMetric(slotIdx, e.target.value)}
                >
                  {AVAILABLE_METRICS.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PANEL DESPLEGABLE: FILTRO DE JUGADORES ─── */}
      {filterOpen && (
        <div className="inf-filter-drawer">
          <div className="inf-drawer-head">
            <div className="inf-dh-title">
              <Filter size={16} />
              <span>Filtro de Jugadores a Incluir en el Informe ({activeExportPlayers.length} de {allPlayers.length})</span>
            </div>
            <div className="inf-filter-quick-btns">
              <button type="button" onClick={handleSelectAll} className="btn-inf-link">
                Seleccionar Todos
              </button>
              <span className="inf-sep">·</span>
              <button type="button" onClick={handleDeselectAll} className="btn-inf-link">
                Deseleccionar Todos
              </button>
            </div>
          </div>

          <div className="inf-filter-bar">
            <div className="inf-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar jugador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="inf-min-matches-filter">
              <label>Mínimo partidos jugados:</label>
              <select
                value={minPartidosFiltro}
                onChange={e => setMinPartidosFiltro(Number(e.target.value))}
              >
                <option value={1}>Al menos 1 partido ({allPlayers.filter(p => p.matchesCount >= 1).length})</option>
                <option value={3}>Al menos 3 partidos ({allPlayers.filter(p => p.matchesCount >= 3).length})</option>
                <option value={5}>Al menos 5 partidos ({allPlayers.filter(p => p.matchesCount >= 5).length})</option>
                <option value={10}>Al menos 10 partidos ({allPlayers.filter(p => p.matchesCount >= 10).length})</option>
              </select>
            </div>
          </div>

          <div className="inf-players-chips-list">
            {filteredPlayers.map(p => {
              const isSelected = !deseleccionados.has(p.name);
              return (
                <button
                  key={p.name}
                  type="button"
                  className={`inf-p-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleTogglePlayer(p.name)}
                >
                  {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                  <span className="inf-chip-name">{p.name}</span>
                  <span className="inf-chip-count">{p.matchesCount} p</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── BARRA DE PAGINACIÓN INTERACTIVA EN PANTALLA ─── */}
      {viewMode === 'paginated' && (
        <div className="inf-pagination-toolbar">
          <button
            type="button"
            className="btn-inf-pag"
            disabled={safePageIndex === 0}
            onClick={() => setActivePageIndex(p => Math.max(0, p - 1))}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>

          <div className="inf-pag-info">
            <select
              value={safePageIndex}
              onChange={e => setActivePageIndex(Number(e.target.value))}
              className="inf-page-select"
            >
              <option value={0}>Hoja 1: Carátula · Promedio de la {catActual}</option>
              {activeExportPlayers.map((p, idx) => (
                <option key={p.name} value={idx + 1}>
                  Hoja {idx + 2}: {p.name} ({p.pos || 'DC'} - {p.matchesCount} partidos)
                </option>
              ))}
            </select>
            <span className="inf-pag-total">de {totalPages} hojas</span>
          </div>

          <button
            type="button"
            className="btn-inf-pag"
            disabled={safePageIndex >= totalPages - 1}
            onClick={() => setActivePageIndex(p => Math.min(totalPages - 1, p + 1))}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ─── DOCUMENTO OFICIAL (RENDER EN PANTALLA & IMPRESIÓN PDF) ─── */}
      <div className="inf-final-document">
        {/* MODO PAGINADO EN PANTALLA: MUESTRA LA HOJA ACTIVA */}
        {viewMode === 'paginated' && (
          <div className="inf-screen-page-wrap">
            {safePageIndex === 0 ? (
              <CategoryCoverPage
                catActual={catActual}
                matches={matches}
                playersCount={activeExportPlayers.length}
                selectedMetrics={selectedMetrics}
                catAveragesByMetric={catAveragesByMetric}
                pageIndex={1}
                totalPages={totalPages}
              />
            ) : (
              activeExportPlayers[safePageIndex - 1] && (
                <PlayerPage
                  player={activeExportPlayers[safePageIndex - 1]}
                  catActual={catActual}
                  matches={matches}
                  selectedMetrics={selectedMetrics}
                  catAveragesByMetric={catAveragesByMetric}
                  pageIndex={safePageIndex + 1}
                  totalPages={totalPages}
                />
              )
            )}
          </div>
        )}

        {/* MODO CONTINUO: TODAS LAS HOJAS RENDERIZADAS */}
        {viewMode === 'all' && (
          <div className="inf-all-pages-wrap">
            {/* Hoja 1: Carátula Colectiva Promedio de la Categoría */}
            <CategoryCoverPage
              catActual={catActual}
              matches={matches}
              playersCount={activeExportPlayers.length}
              selectedMetrics={selectedMetrics}
              catAveragesByMetric={catAveragesByMetric}
              pageIndex={1}
              totalPages={totalPages}
            />

            {/* Hojas 2..N: Una por cada jugador */}
            {activeExportPlayers.map((player, idx) => (
              <PlayerPage
                key={player.name}
                player={player}
                catActual={catActual}
                matches={matches}
                selectedMetrics={selectedMetrics}
                catAveragesByMetric={catAveragesByMetric}
                pageIndex={idx + 2}
                totalPages={totalPages}
              />
            ))}
          </div>
        )}

        {/* CONTENEDOR OCULTO EN PANTALLA PERO ACTIVO PARA WINDOW.PRINT (SIEMPRE TODAS LAS HOJAS) */}
        {viewMode === 'paginated' && (
          <div className="inf-print-only-container">
            <CategoryCoverPage
              catActual={catActual}
              matches={matches}
              playersCount={activeExportPlayers.length}
              selectedMetrics={selectedMetrics}
              catAveragesByMetric={catAveragesByMetric}
              pageIndex={1}
              totalPages={totalPages}
            />
            {activeExportPlayers.map((player, idx) => (
              <PlayerPage
                key={player.name}
                player={player}
                catActual={catActual}
                matches={matches}
                selectedMetrics={selectedMetrics}
                catAveragesByMetric={catAveragesByMetric}
                pageIndex={idx + 2}
                totalPages={totalPages}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
