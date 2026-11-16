import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  RotateCw, 
  Moon, 
  Sun, 
  Scale, 
  User, 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Radar, 
  PieChart as PieIcon,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { 
  fetchAntropoData, 
  CATEGORIAS_CONFIG, 
  getSemaforoPliegues 
} from './services/apiAntropo';
import { resolvePlayerPhoto } from '../../utils/photoResolver';
import { obtenerPosicionesJugador } from '../../data/jugadoresPosiciones';
import ChartCanvas from '../../components/ChartCanvas';
import EvolutivoIndividualView from './components/EvolutivoIndividualView';
import { useAppStore } from '../../store/useAppStore';

export default function ComposicionModule({ onVolverHub, tema = 'claro', onToggleTema }) {
  const categoria = useAppStore(state => state.categoria);
  const setCategoria = useAppStore(state => state.setCategoria);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vista activa: 'ficha' (Ficha del Jugador) | 'ranking' (Ranking del Plantel)
  const [vista, setVista] = useState('evolutivo');

  // Jugador y fecha seleccionada
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Par de gráficos activo en la vista derecha:
  // 1: 5 Masas Kerr (círculo con kg y %) + Evolución Pliegues (con semáforo test)
  // 2: Evolución IMO + Evolución Peso Corporal
  // 3: Radar de 6 Pliegues ISAK + Evolución % Muscular vs % Adiposo
  const [parActivo, setParActivo] = useState(1);

  const loadData = (cat = categoria, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    fetchAntropoData(cat, forceRefresh)
      .then(res => {
        setData(res);
        if (res.jugadores && res.jugadores.length > 0) {
          if (!selectedPlayerName || !res.jugadores.some(j => j.nombreCompleto === selectedPlayerName)) {
            setSelectedPlayerName(res.jugadores[0].nombreCompleto);
          }
        } else {
          setSelectedPlayerName('');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching antropo data:', err);
        setError(err.message || 'Error al conectar con Google Sheets.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData(categoria);
  }, [categoria]);

  // Jugador actual
  const jugadorActual = useMemo(() => {
    if (!data || !data.jugadores) return null;
    return data.jugadores.find(j => j.nombreCompleto === selectedPlayerName) || data.jugadores[0] || null;
  }, [data, selectedPlayerName]);

  // Sincronizar fecha al cambiar de jugador
  useEffect(() => {
    if (jugadorActual && jugadorActual.mediciones && jugadorActual.mediciones.length > 0) {
      setSelectedDate(jugadorActual.mediciones[0].fecha);
    }
  }, [jugadorActual]);

  // Medición activa según fecha
  const medicionActiva = useMemo(() => {
    if (!jugadorActual || !jugadorActual.mediciones) return null;
    return jugadorActual.mediciones.find(m => m.fecha === selectedDate) || jugadorActual.mediciones[0] || null;
  }, [jugadorActual, selectedDate]);

  // Foto oficial del jugador
  const fotoInfo = useMemo(() => {
    if (!jugadorActual) return null;
    return resolvePlayerPhoto(jugadorActual.nombreCompleto, categoria);
  }, [jugadorActual, categoria]);

  // Posición del jugador
  const posicionJugador = useMemo(() => {
    if (!jugadorActual) return '—';
    const pos = obtenerPosicionesJugador(jugadorActual.nombreCompleto);
    if (!pos || pos === '—') return 'JUGADOR';
    const up = pos.toUpperCase();
    if (up.includes('EXTREMO DERECHO')) return 'EXT DER';
    if (up.includes('EXTREMO IZQUIERDO')) return 'EXT IZQ';
    if (up.includes('EXTREMO') || up === 'E') return 'EXT';
    if (up.includes('VOLANTE CENTRAL') || up === 'VC') return 'VOL CEN';
    if (up.includes('VOLANTE MIXTO') || up.includes('VOLANTE INTERNO') || up === 'VM' || up === 'VI') return 'VOL MIX';
    if (up.includes('DEFENSOR CENTRAL') || up === 'DC') return 'DEF CEN';
    if (up.includes('LATERAL DERECHO') || up === 'LD') return 'LAT DER';
    if (up.includes('LATERAL IZQUIERDO') || up === 'LI') return 'LAT IZQ';
    if (up.includes('DEFENSOR LATERAL') || up === 'DL') return 'DEF LAT';
    if (up.includes('DELANTERO') || up.includes('CENTRODELANTERO') || up === 'CD' || up === 'DEL') return 'DEL';
    if (up.includes('ARQUERO') || up === 'ARQ' || up === 'A') return 'ARQ';
    return pos.toUpperCase();
  }, [jugadorActual]);

  // Historial cronológico ascendente (de más antigua a más reciente)
  const historialAsc = useMemo(() => {
    if (!jugadorActual || !jugadorActual.mediciones) return [];
    return [...jugadorActual.mediciones].reverse();
  }, [jugadorActual]);

  // Semáforo de la medición activa (regla test: >45 rojo, 43-45 amarillo, <=42 verde)
  const semaforoActivo = useMemo(() => {
    if (!medicionActiva) return getSemaforoPliegues(0);
    return getSemaforoPliegues(medicionActiva.pliegues6);
  }, [medicionActiva]);

  // Deltas vs primera medición
  const deltas = useMemo(() => {
    if (historialAsc.length <= 1) return { pliegues: 0, imo: 0, peso: 0 };
    const primero = historialAsc[0];
    const actual = medicionActiva || historialAsc[historialAsc.length - 1];
    return {
      pliegues: Math.round((actual.pliegues6 - primero.pliegues6) * 10) / 10,
      imo: Math.round((actual.imo - primero.imo) * 100) / 100,
      peso: Math.round((actual.peso - primero.peso) * 10) / 10
    };
  }, [historialAsc, medicionActiva]);

  // =========================================================================
  // GRÁFICO 1: FRACCIONAMIENTO 5 MASAS KERR (DOUGHNUT CON KG Y %)
  // =========================================================================
  const chartMasasConfig = useMemo(() => {
    if (!medicionActiva || !medicionActiva.masas) return null;
    const m = medicionActiva.masas;

    return {
      type: 'doughnut',
      data: {
        labels: ['Masa Muscular', 'Masa Adiposa', 'Masa Ósea', 'Masa Residual', 'Masa Piel'],
        datasets: [{
          data: [m.pctMuscular, m.pctAdiposa, m.pctOsea, m.pctResidual, m.pctPiel],
          backgroundColor: ['#2a3b60', '#f59e0b', '#64748b', '#6366f1', '#f97316'],
          borderWidth: 2,
          borderColor: tema === 'oscuro' ? '#0f172a' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const pct = context.parsed || 0;
                let kg = 0;
                if (label === 'Masa Muscular') kg = m.muscular;
                else if (label === 'Masa Adiposa') kg = m.adiposa;
                else if (label === 'Masa Ósea') kg = m.osea;
                else if (label === 'Masa Residual') kg = m.residual;
                else if (label === 'Masa Piel') kg = m.piel;
                return ` ${label}: ${pct}% (${kg} kg)`;
              }
            }
          },
          datalabels: {
            color: '#ffffff',
            font: { weight: 'bold', size: 11 },
            formatter: (val) => val > 7 ? `${val}` : ''
          }
        },
        cutout: '58%'
      }
    };
  }, [medicionActiva, tema]);

  // =========================================================================
  // GRÁFICO 2: EVOLUCIÓN 6 PLIEGUES (CON SEMÁFORO TEST >45 rojo, 43-45 am, <=42 vd)
  // =========================================================================
  const chartPlieguesConfig = useMemo(() => {
    if (!historialAsc.length) return null;
    const labels = historialAsc.map(m => m.fecha);
    const dataVals = historialAsc.map(m => m.pliegues6);

    const ptBgColors = dataVals.map(val => val > 45 ? '#ef4444' : val >= 43 ? '#f59e0b' : '#10b981');
    const ptBorderColors = dataVals.map(val => val > 45 ? '#991b1b' : val >= 43 ? '#b45309' : '#047857');

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Sumatoria 6 Pliegues (mm)',
            data: dataVals,
            borderColor: '#2a3b60',
            backgroundColor: 'rgba(42, 59, 96, 0.08)',
            fill: true,
            tension: 0.25,
            pointRadius: 5.5,
            pointHoverRadius: 7.5,
            pointBackgroundColor: ptBgColors,
            pointBorderColor: ptBorderColors,
            pointBorderWidth: 2,
            borderWidth: 2.5
          },
          {
            label: 'Alerta (>45 mm)',
            data: labels.map(() => 45),
            borderColor: 'rgba(239, 68, 68, 0.75)',
            borderDash: [5, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Óptimo (≤42 mm)',
            data: labels.map(() => 42),
            borderColor: 'rgba(16, 185, 129, 0.75)',
            borderDash: [5, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 9,
              boxHeight: 9,
              color: tema === 'oscuro' ? '#cbd5e1' : '#475569',
              font: { size: 10, weight: '600' }
            }
          },
          datalabels: {
            color: tema === 'oscuro' ? '#f8fafc' : '#0f172a',
            font: { size: 10, weight: 'bold' },
            formatter: (v, ctx) => ctx.datasetIndex === 0 ? `${v}` : '',
            align: 'top',
            offset: 4
          }
        },
        scales: {
          x: {
            ticks: { 
              color: tema === 'oscuro' ? '#94a3b8' : '#64748b', 
              font: { size: 9.5, weight: '600' },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: { display: false }
          },
          y: {
            ticks: { color: tema === 'oscuro' ? '#94a3b8' : '#64748b', font: { size: 10, weight: '600' } },
            grid: { color: tema === 'oscuro' ? '#1e293b' : '#f1f5f9' },
            grace: '8%'
          }
        }
      }
    };
  }, [historialAsc, tema]);

  // =========================================================================
  // GRÁFICO 3: EVOLUCIÓN IMO (ÍNDICE MÚSCULO / ÓSEO)
  // =========================================================================
  const chartImoConfig = useMemo(() => {
    if (!historialAsc.length) return null;
    const labels = historialAsc.map(m => m.fecha);
    const dataVals = historialAsc.map(m => m.imo);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Índice Músculo/Óseo (IMO)',
          data: dataVals,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fill: true,
          tension: 0.25,
          pointRadius: 5,
          pointHoverRadius: 7.5,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            color: tema === 'oscuro' ? '#f8fafc' : '#0f172a',
            font: { size: 10, weight: 'bold' },
            formatter: (v) => `${v}`,
            align: 'top',
            offset: 4
          }
        },
        scales: {
          x: {
            ticks: { 
              color: tema === 'oscuro' ? '#94a3b8' : '#64748b', 
              font: { size: 9.5, weight: '600' },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: { display: false }
          },
          y: {
            ticks: { color: tema === 'oscuro' ? '#94a3b8' : '#64748b', font: { size: 10, weight: '600' } },
            grid: { color: tema === 'oscuro' ? '#1e293b' : '#f1f5f9' },
            grace: '8%'
          }
        }
      }
    };
  }, [historialAsc, tema]);

  // =========================================================================
  // GRÁFICO 4: EVOLUCIÓN PESO CORPORAL (KG)
  // =========================================================================
  const chartPesoConfig = useMemo(() => {
    if (!historialAsc.length) return null;
    const labels = historialAsc.map(m => m.fecha);
    const dataVals = historialAsc.map(m => m.peso);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Peso Bruto (kg)',
          data: dataVals,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.25,
          pointRadius: 5,
          pointHoverRadius: 7.5,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            color: tema === 'oscuro' ? '#f8fafc' : '#0f172a',
            font: { size: 10, weight: 'bold' },
            formatter: (v) => `${v}`,
            align: 'top',
            offset: 4
          }
        },
        scales: {
          x: {
            ticks: { 
              color: tema === 'oscuro' ? '#94a3b8' : '#64748b', 
              font: { size: 9.5, weight: '600' },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: { display: false }
          },
          y: {
            ticks: { color: tema === 'oscuro' ? '#94a3b8' : '#64748b', font: { size: 10, weight: '600' } },
            grid: { color: tema === 'oscuro' ? '#1e293b' : '#f1f5f9' },
            grace: '8%'
          }
        }
      }
    };
  }, [historialAsc, tema]);

  // =========================================================================
  // GRÁFICO 5: RADAR DE 6 PLIEGUES ISAK
  // =========================================================================
  const chartRadarConfig = useMemo(() => {
    if (!medicionActiva || !medicionActiva.pliegues) return null;
    const p = medicionActiva.pliegues;

    return {
      type: 'radar',
      data: {
        labels: ['Tríceps', 'Subescapular', 'Supraespinal', 'Abdominal', 'Muslo Med.', 'Pantorrilla'],
        datasets: [{
          label: `${jugadorActual?.nombreCompleto || 'Jugador'}`,
          data: [p.triceps, p.subescapular, p.supraespinal, p.abdominal, p.musloMedial, p.pantorrilla],
          backgroundColor: 'rgba(42, 59, 96, 0.22)',
          borderColor: '#2a3b60',
          pointBackgroundColor: '#2a3b60',
          pointBorderColor: '#fff',
          pointRadius: 4.5,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: tema === 'oscuro' ? '#334155' : '#e2e8f0' },
            grid: { color: tema === 'oscuro' ? '#1e293b' : '#f1f5f9' },
            pointLabels: {
              color: tema === 'oscuro' ? '#f8fafc' : '#0f172a',
              font: { size: 10, weight: '700' }
            },
            ticks: { display: false },
            suggestedMin: 0,
            suggestedMax: 20
          }
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            color: tema === 'oscuro' ? '#f8fafc' : '#06121E',
            font: { size: 10, weight: 'bold' },
            formatter: (val) => `${val}`,
            align: 'top'
          }
        }
      }
    };
  }, [medicionActiva, jugadorActual, tema]);

  // =========================================================================
  // GRÁFICO 6: EVOLUCIÓN COMPARATIVA % MUSCULAR VS % ADIPOSO
  // =========================================================================
  const chartMuscVsAdipConfig = useMemo(() => {
    if (!historialAsc.length) return null;
    const labels = historialAsc.map(m => m.fecha);
    const dataMusc = historialAsc.map(m => m.masas.pctMuscular);
    const dataAdip = historialAsc.map(m => m.masas.pctAdiposa);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '% Masa Muscular',
            data: dataMusc,
            borderColor: '#2a3b60',
            backgroundColor: 'rgba(42, 59, 96, 0.12)',
            fill: true,
            tension: 0.25,
            pointRadius: 5,
            pointBackgroundColor: '#2a3b60',
            borderWidth: 2.5
          },
          {
            label: '% Masa Adiposa',
            data: dataAdip,
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            tension: 0.25,
            pointRadius: 5,
            pointBackgroundColor: '#f59e0b',
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 9,
              boxHeight: 9,
              color: tema === 'oscuro' ? '#cbd5e1' : '#475569',
              font: { size: 10, weight: '700' }
            }
          },
          datalabels: {
            color: tema === 'oscuro' ? '#f8fafc' : '#0f172a',
            font: { size: 9.5, weight: 'bold' },
            formatter: (v) => `${v}`,
            align: 'top',
            offset: 3
          }
        },
        scales: {
          x: {
            ticks: { 
              color: tema === 'oscuro' ? '#94a3b8' : '#64748b', 
              font: { size: 9.5, weight: '600' },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: { display: false }
          },
          y: {
            ticks: { color: tema === 'oscuro' ? '#94a3b8' : '#64748b', font: { size: 10, weight: '600' } },
            grid: { color: tema === 'oscuro' ? '#1e293b' : '#f1f5f9' },
            grace: '8%'
          }
        }
      }
    };
  }, [historialAsc, tema]);

  // Ranking del plantel
  const [rankingSortKey, setRankingSortKey] = useState('pliegues');
  const rankingList = useMemo(() => {
    if (!data || !data.jugadores) return [];
    return [...data.jugadores].sort((a, b) => {
      const mA = a.ultimaMedicion;
      const mB = b.ultimaMedicion;
      if (!mA || !mB) return 0;
      if (rankingSortKey === 'pliegues') return (mA.pliegues6 || 0) - (mB.pliegues6 || 0);
      if (rankingSortKey === 'imo') return (mB.imo || 0) - (mA.imo || 0);
      if (rankingSortKey === 'muscular') return (mB.masas?.pctMuscular || 0) - (mA.masas?.pctMuscular || 0);
      if (rankingSortKey === 'adiposa') return (mA.masas?.pctAdiposa || 0) - (mB.masas?.pctAdiposa || 0);
      if (rankingSortKey === 'peso') return (mB.peso || 0) - (mA.peso || 0);
      return a.nombreCompleto.localeCompare(b.nombreCompleto);
    });
  }, [data, rankingSortKey]);

  return (
    <div className="antropo-viewport-page">
      {/* Topbar Institucional */}
      <header className="topbar">
        <div className="tb-left">
          <button 
            type="button" 
            className="btn-hub-back"
            onClick={onVolverHub}
            title="Volver a la Pantalla de Inicio"
          >
            <ArrowLeft size={15} />
            <span>Inicio</span>
          </button>
          <div className="tb-divider" />
          <img src="/escudo.png" alt="Integral Club" className="tb-escudo" />
          <span className="tb-brand">Integral Club · Área Nutrición</span>
        </div>

        <div className="tb-right">
          <span className="tb-cat-badge">{data?.categoriaNombre || 'Cuarta División'}</span>
          <button
            type="button"
            className="btn-refresh-data"
            onClick={() => loadData(categoria, true)}
            disabled={loading}
            title="Sincronizar mediciones en vivo desde Google Sheets"
          >
            <RotateCw size={13} className={loading ? 'spin-anim' : ''} />
            <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
          <button
            type="button"
            className="btn-theme-toggle"
            onClick={onToggleTema}
            title={tema === 'claro' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Blanco'}
          >
            {tema === 'claro' ? (
              <>
                <Moon size={14} />
                <span>Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun size={14} />
                <span>Modo Blanco</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Subnav Fija con Selectores */}
      <div className="antropo-subnav">
        <div className="antropo-subnav-left">
          <div className="antropo-tabs">
            <button
              type="button"
              className={`antropo-tab-btn ${vista === 'evolutivo' ? 'active' : ''}`}
              onClick={() => setVista('evolutivo')}
            >
              <TrendingUp size={14} />
              <span>Evolutivo Individual</span>
            </button>
            <button
              type="button"
              className={`antropo-tab-btn ${vista === 'ficha' ? 'active' : ''}`}
              onClick={() => setVista('ficha')}
            >
              <User size={14} />
              <span>Ficha del Jugador</span>
            </button>
            <button
              type="button"
              className={`antropo-tab-btn ${vista === 'ranking' ? 'active' : ''}`}
              onClick={() => setVista('ranking')}
            >
              <Trophy size={14} />
              <span>Ranking del Plantel</span>
            </button>
          </div>

          {/* Selector de Categoría */}
          <div className="antropo-select-group">
            <label>CATEGORÍA:</label>
            <select
              className="antropo-select cat-select"
              value={categoria}
              onChange={(e) => {
                const newCat = e.target.value;
                setCategoria(newCat);
                setSelectedPlayerName('');
              }}
            >
              {Object.keys(CATEGORIAS_CONFIG).map(catKey => (
                <option key={catKey} value={catKey}>
                  {CATEGORIAS_CONFIG[catKey].nombre}
                </option>
              ))}
            </select>
          </div>

          {vista === 'ficha' && jugadorActual && (
            <>
              {/* Selector de Jugador */}
              <div className="antropo-select-group">
                <label>JUGADOR:</label>
                <select
                  className="antropo-select player-select"
                  value={selectedPlayerName}
                  onChange={(e) => setSelectedPlayerName(e.target.value)}
                >
                  {data?.jugadores?.map(j => (
                    <option key={j.nombreCompleto} value={j.nombreCompleto}>
                      {j.nombreCompleto} ({j.mediciones.length} med.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Fecha */}
              <div className="antropo-select-group">
                <label>FECHA:</label>
                <select
                  className="antropo-select date-select"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  {jugadorActual?.mediciones?.map(m => (
                    <option key={m.fecha} value={m.fecha}>
                      {m.fecha}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="antropo-subnav-right">
          {data && (
            <span className="antropo-dedup-badge" title="Mediciones depuradas sin duplicados por fecha y jugador">
              <CheckCircle2 size={12} color="#10b981" />
              <span>Datos limpios ({data.totalMediciones} med. · {data.duplicadosEliminados} dup. removidos)</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <main className={`antropo-main-view ${vista === 'evolutivo' ? 'antropo-main-view-evolutivo' : ''}`}>

        {loading && !data && (
          <div className="antropo-loading-box">
            <div className="loading-spinner" />
            <p>Sincronizando mediciones cineantropométricas...</p>
          </div>
        )}

        {error && !data && (
          <div className="antropo-error-box">
            <h3>Error de sincronización</h3>
            <p>{error}</p>
            <button className="btn-guia-integral" onClick={() => loadData(categoria, true)}>
              Reintentar
            </button>
          </div>
        )}

        {/* VISTA 1: FICHA DEL JUGADOR + 2 GRÁFICOS POR VISTA */}
        {vista === 'ficha' && medicionActiva && (
          <div className="antropo-console-layout">
            
            {/* ============================================================ */}
            {/* COLUMNA IZQUIERDA: FICHA DEL JUGADOR (FOTO GRANDE + SEMÁFORO ABAJO) */}
            {/* ============================================================ */}
            <aside className="card antropo-col-profile-card">
              
              {/* Header con Foto Grande */}
              <div className="ap-player-top-header">
                <div className="ap-avatar-wrap-large">
                  {fotoInfo ? (
                    <img 
                      src={fotoInfo.url} 
                      alt={jugadorActual.nombreCompleto} 
                      className="ap-avatar-img-large" 
                    />
                  ) : (
                    <div className="ap-avatar-placeholder-large">
                      <User size={38} color="var(--celeste)" />
                    </div>
                  )}
                </div>

                <div className="ap-player-details">
                  <h2 className="ap-player-name-large">{jugadorActual.nombreCompleto}</h2>
                  <div className="ap-meta-row">
                    <span className="ap-badge-cat">{data?.categoriaNombre || categoria}</span>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(42, 59, 96, 0.15)',
                      color: 'var(--celeste)',
                      border: '1px solid rgba(42, 59, 96, 0.35)',
                      letterSpacing: '0.4px'
                    }}>
                      {posicionJugador}
                    </span>
                    <span className="ap-meta-sub">{medicionActiva.edad || 'Juvenil'}</span>
                  </div>
                  <div className="ap-date-sub">
                    <Calendar size={11} />
                    <span>{medicionActiva.fecha}</span>
                  </div>
                  <div className="ap-dni-sub">DNI {medicionActiva.dni || 'S/D'}</div>
                </div>
              </div>

              {/* KPIS CLAVE */}
              <div className="ap-kpi-grid">
                <div className="ap-kpi-box">
                  <span className="ap-kpi-lbl">PESO & TALLA</span>
                  <div className="ap-kpi-val">
                    <b>{medicionActiva.peso} kg</b> · <span>{medicionActiva.talla} cm</span>
                  </div>
                  <span className="ap-kpi-sub">Talla sentado: {medicionActiva.tallaSentado} cm</span>
                </div>

                <div className="ap-kpi-box">
                  <span className="ap-kpi-lbl">MASA MUSCULAR</span>
                  <div className="ap-kpi-val text-celeste">
                    <b>{medicionActiva.masas.pctMuscular}%</b>
                    <span className="ap-kpi-sub-kg">({medicionActiva.masas.muscular} kg)</span>
                  </div>
                  <span className="ap-kpi-sub">Masa Adiposa: {medicionActiva.masas.pctAdiposa}% ({medicionActiva.masas.adiposa}kg)</span>
                </div>

                <div className="ap-kpi-box">
                  <span className="ap-kpi-lbl">ÍNDICE MÚSCULO / ÓSEO</span>
                  <div className="ap-kpi-val text-indigo">
                    <b>{medicionActiva.imo} IMO</b>
                    {deltas.imo !== 0 && (
                      <span className={`ap-delta-pill ${deltas.imo > 0 ? 'text-green' : 'text-amber'}`}>
                        {deltas.imo > 0 ? `+${deltas.imo}` : deltas.imo}
                      </span>
                    )}
                  </div>
                  <span className="ap-kpi-sub">Masa Ósea: {medicionActiva.masas.osea} kg</span>
                </div>

                <div className="ap-kpi-box">
                  <span className="ap-kpi-lbl">PERÍMETROS (CM)</span>
                  <div className="ap-per-mini-row">
                    <span>Br. {medicionActiva.perimetros.brazoFlexionado}</span>
                    <span>Tx. {medicionActiva.perimetros.toraxMesoesternal}</span>
                    <span>Cin. {medicionActiva.perimetros.cintura}</span>
                    <span>Pant. {medicionActiva.perimetros.pantorrilla}</span>
                  </div>
                </div>
              </div>

              {medicionActiva.responsable && (
                <div className="ap-evaluador-tag">
                  <CheckCircle2 size={11} color="var(--celeste)" />
                  <span>Evaluador: {medicionActiva.responsable}</span>
                </div>
              )}

              {/* SEMÁFORO DE PLIEGUES (UBICADO ABAJO DE LA FICHA) */}
              <div 
                className={`ap-semaforo-bottom-card ${semaforoActivo.badgeClass}`}
                style={{
                  backgroundColor: semaforoActivo.bg,
                  borderColor: semaforoActivo.border
                }}
              >
                <div className="ap-sem-top">
                  <div className="ap-sem-title-box">
                    <Scale size={13} color={semaforoActivo.color} />
                    <span className="ap-sem-title">SEMÁFORO 6 PLIEGUES</span>
                  </div>
                  <span 
                    className="ap-sem-badge"
                    style={{ backgroundColor: semaforoActivo.color, color: '#fff' }}
                  >
                    {semaforoActivo.label}
                  </span>
                </div>

                <div className="ap-sem-body">
                  <span className="ap-sem-val" style={{ color: semaforoActivo.color }}>
                    {medicionActiva.pliegues6}
                    <span className="ap-sem-unit"> mm</span>
                  </span>
                  {deltas.pliegues !== 0 && (
                    <span className={`ap-sem-delta ${deltas.pliegues < 0 ? 'text-green' : 'text-red'}`}>
                      {deltas.pliegues < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                      {deltas.pliegues > 0 ? `+${deltas.pliegues}` : deltas.pliegues} mm vs inicio
                    </span>
                  )}
                </div>

                <div className="ap-sem-legend">
                  <span className="asl-item"><b className="dot-green">●</b> ≤42 Verde</span>
                  <span className="asl-sep">·</span>
                  <span className="asl-item"><b className="dot-amber">●</b> 43-45 Amarillo</span>
                  <span className="asl-sep">·</span>
                  <span className="asl-item"><b className="dot-red">●</b> &gt;45 Rojo</span>
                </div>
              </div>

            </aside>

            {/* ============================================================ */}
            {/* ÁREA DERECHA: EXACTAMENTE 2 GRÁFICOS POR VISTA               */}
            {/* ============================================================ */}
            <section className="antropo-two-charts-viewport">
              
              {/* Barra de Navegación de Pares de Gráficos */}
              <div className="antropo-pairs-toolbar">
                <div className="apt-tabs">
                  <button
                    type="button"
                    className={`apt-btn ${parActivo === 1 ? 'active' : ''}`}
                    onClick={() => setParActivo(1)}
                  >
                    <span className="apt-num">1</span>
                    <PieIcon size={13} />
                    <span>5 Masas Kerr & Evolución Pliegues</span>
                  </button>

                  <button
                    type="button"
                    className={`apt-btn ${parActivo === 2 ? 'active' : ''}`}
                    onClick={() => setParActivo(2)}
                  >
                    <span className="apt-num">2</span>
                    <TrendingUp size={13} />
                    <span>Evolución IMO & Peso Corporal</span>
                  </button>

                  <button
                    type="button"
                    className={`apt-btn ${parActivo === 3 ? 'active' : ''}`}
                    onClick={() => setParActivo(3)}
                  >
                    <span className="apt-num">3</span>
                    <Radar size={13} />
                    <span>Radar ISAK & % Muscular vs % Adiposo</span>
                  </button>
                </div>

                {/* Flechas de Navegación Rápida */}
                <div className="apt-arrows">
                  <button
                    type="button"
                    className="apt-nav-arrow"
                    onClick={() => setParActivo(prev => prev === 1 ? 3 : prev - 1)}
                    title="Ver par anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="apt-indicator">Vista {parActivo} de 3</span>
                  <button
                    type="button"
                    className="apt-nav-arrow"
                    onClick={() => setParActivo(prev => prev === 3 ? 1 : prev + 1)}
                    title="Ver siguiente par"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* CONTENEDOR DE LOS 2 GRÁFICOS EN PARALELO */}
              <div className="antropo-pair-grid-2">
                
                {/* -------------------------------------------------------- */}
                {/* PAR 1: 5 MASAS KERR (CÍRCULO) + EVOLUCIÓN PLIEGUES       */}
                {/* -------------------------------------------------------- */}
                {parActivo === 1 && (
                  <>
                    {/* Gráfico A: Fraccionamiento 5 Masas de Kerr */}
                    <div className="card pair-chart-card">
                      <div className="pcc-header">
                        <div className="pcc-title-box">
                          <PieIcon size={15} color="var(--celeste)" />
                          <h3 className="pcc-title">Fraccionamiento 5 Masas (Kerr)</h3>
                        </div>
                        <span className="act-pill">100% Masa Corporal ({medicionActiva.peso} kg)</span>
                      </div>

                      <div className="pcc-doughnut-container">
                        {chartMasasConfig && <ChartCanvas config={chartMasasConfig} />}
                      </div>

                      {/* Tabla Desglose Porcentajes y Kilos */}
                      <div className="amt-table-detailed">
                        <div className="amt-row amt-header">
                          <span>Componente</span>
                          <span style={{ textAlign: 'center' }}>%</span>
                          <span style={{ textAlign: 'right' }}>Kilogramos</span>
                        </div>
                        <div className="amt-row">
                          <span className="amt-name"><b className="dot-cyan">●</b> Masa Muscular</span>
                          <span className="amt-val text-center"><b>{medicionActiva.masas.pctMuscular}%</b></span>
                          <span className="amt-val text-right"><b>{medicionActiva.masas.muscular} kg</b></span>
                        </div>
                        <div className="amt-row">
                          <span className="amt-name"><b className="dot-amber">●</b> Masa Adiposa</span>
                          <span className="amt-val text-center"><b>{medicionActiva.masas.pctAdiposa}%</b></span>
                          <span className="amt-val text-right"><b>{medicionActiva.masas.adiposa} kg</b></span>
                        </div>
                        <div className="amt-row">
                          <span className="amt-name"><b className="dot-slate">●</b> Masa Ósea</span>
                          <span className="amt-val text-center"><b>{medicionActiva.masas.pctOsea}%</b></span>
                          <span className="amt-val text-right"><b>{medicionActiva.masas.osea} kg</b></span>
                        </div>
                        <div className="amt-row">
                          <span className="amt-name"><b className="dot-indigo">●</b> Masa Residual</span>
                          <span className="amt-val text-center"><b>{medicionActiva.masas.pctResidual}%</b></span>
                          <span className="amt-val text-right"><b>{medicionActiva.masas.residual} kg</b></span>
                        </div>
                        <div className="amt-row">
                          <span className="amt-name"><b className="dot-orange">●</b> Masa Piel</span>
                          <span className="amt-val text-center"><b>{medicionActiva.masas.pctPiel}%</b></span>
                          <span className="amt-val text-right"><b>{medicionActiva.masas.piel} kg</b></span>
                        </div>
                      </div>
                    </div>

                    {/* Gráfico B: Evolución 6 Pliegues con Semáforo Test */}
                    <div className="card pair-chart-card">
                      <div className="pcc-header">
                        <div className="pcc-title-box">
                          <span className="pcc-dot dot-cyan"></span>
                          <h3 className="pcc-title">Evolución Sumatoria 6 Pliegues (mm)</h3>
                        </div>
                        <div className="pcc-right-val">
                          <span className="pcc-val" style={{ color: semaforoActivo.color }}>
                            {medicionActiva.pliegues6} mm
                          </span>
                          <span className="pcc-sub-tag">
                            {medicionActiva.pliegues6 <= 42 ? 'Óptimo' : medicionActiva.pliegues6 <= 45 ? 'Atención' : 'Alerta'}
                          </span>
                        </div>
                      </div>

                      <div className="pcc-chart-container">
                        {chartPlieguesConfig && <ChartCanvas config={chartPlieguesConfig} />}
                      </div>

                      <div className="pcc-footer-bar">
                        <div className="pcc-footer-left">
                          <span>Semáforo Test: ≤42 🟢 Verde · 43-45 🟡 Amarillo · &gt;45 🔴 Rojo</span>
                        </div>
                        <div className="pcc-footer-right">
                          {deltas.pliegues !== 0 && (
                            <span className={deltas.pliegues < 0 ? 'text-green' : 'text-red'}>
                              {deltas.pliegues < 0 ? '↓ ' : '↑ '}
                              {Math.abs(deltas.pliegues)} mm vs inicio
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* -------------------------------------------------------- */}
                {/* PAR 2: EVOLUCIÓN IMO + EVOLUCIÓN PESO CORPORAL           */}
                {/* -------------------------------------------------------- */}
                {parActivo === 2 && (
                  <>
                    {/* Gráfico C: Evolución IMO */}
                    <div className="card pair-chart-card">
                      <div className="pcc-header">
                        <div className="pcc-title-box">
                          <span className="pcc-dot dot-indigo"></span>
                          <h3 className="pcc-title">Evolución Índice Músculo / Óseo (IMO)</h3>
                        </div>
                        <div className="pcc-right-val">
                          <span className="pcc-val text-indigo">{medicionActiva.imo}</span>
                          <span className="pcc-sub-tag">
                            {deltas.imo !== 0 ? (deltas.imo > 0 ? `+${deltas.imo}` : `${deltas.imo}`) : 'Base'}
                          </span>
                        </div>
                      </div>

                      <div className="pcc-chart-container">
                        {chartImoConfig && <ChartCanvas config={chartImoConfig} />}
                      </div>

                      <div className="pcc-footer-bar">
                        <span>Relación de masa muscular sobre masa esquelética ósea a lo largo de 2026</span>
                      </div>
                    </div>

                    {/* Gráfico D: Evolución Peso Corporal */}
                    <div className="card pair-chart-card">
                      <div className="pcc-header">
                        <div className="pcc-title-box">
                          <span className="pcc-dot dot-green"></span>
                          <h3 className="pcc-title">Evolución Peso Corporal (kg)</h3>
                        </div>
                        <div className="pcc-right-val">
                          <span className="pcc-val text-green">{medicionActiva.peso} kg</span>
                          <span className="pcc-sub-tag">
                            {deltas.peso !== 0 ? (deltas.peso > 0 ? `+${deltas.peso} kg` : `${deltas.peso} kg`) : 'Base'}
                          </span>
                        </div>
                      </div>

                      <div className="pcc-chart-container">
                        {chartPesoConfig && <ChartCanvas config={chartPesoConfig} />}
                      </div>

                      <div className="pcc-footer-bar">
                        <span>Registro longitudinal de peso corporal en balanza de precisión ISAK</span>
                      </div>
                    </div>
                  </>
                )}

                {/* -------------------------------------------------------- */}
                {/* PAR 3: RADAR ISAK + COMPARATIVA % MUSCULAR VS % ADIPOSO  */}
                {/* -------------------------------------------------------- */}
                {parActivo === 3 && (
                  <>
                    {/* Gráfico E: Radar 6 Pliegues */}
                    <div className="card pair-chart-card">
                      <div className="pcc-header">
                        <div className="pcc-title-box">
                          <Radar size={15} color="var(--celeste)" />
                          <h3 className="pcc-title">Radar de Pliegues Cutáneos ISAK (mm)</h3>
                        </div>
                        <span className="act-pill">{medicionActiva.pliegues6} mm</span>
                      </div>

                      <div className="pcc-chart-container">
                        {chartRadarConfig && <ChartCanvas config={chartRadarConfig} />}
                      </div>

                      <div className="apg-grid-detailed">
                        <div className="apg-item"><span>Tríceps:</span> <b>{medicionActiva.pliegues.triceps} mm</b></div>
                        <div className="apg-item"><span>Subescapular:</span> <b>{medicionActiva.pliegues.subescapular} mm</b></div>
                        <div className="apg-item"><span>Supraespinal:</span> <b>{medicionActiva.pliegues.supraespinal} mm</b></div>
                        <div className="apg-item"><span>Abdominal:</span> <b>{medicionActiva.pliegues.abdominal} mm</b></div>
                        <div className="apg-item"><span>Muslo Med.:</span> <b>{medicionActiva.pliegues.musloMedial} mm</b></div>
                        <div className="apg-item"><span>Pantorrilla:</span> <b>{medicionActiva.pliegues.pantorrilla} mm</b></div>
                      </div>
                    </div>

                    {/* Gráfico F: % Muscular vs % Adiposo */}
                    <div className="card pair-chart-card">
                      <div className="pcc-header">
                        <div className="pcc-title-box">
                          <TrendingUp size={15} color="var(--celeste)" />
                          <h3 className="pcc-title">Evolución % Masa Muscular vs % Adiposa</h3>
                        </div>
                        <div className="pcc-right-val">
                          <span className="pcc-val text-celeste">{medicionActiva.masas.pctMuscular}%</span>
                          <span className="pcc-sub-tag text-amber">{medicionActiva.masas.pctAdiposa}% Adip.</span>
                        </div>
                      </div>

                      <div className="pcc-chart-container">
                        {chartMuscVsAdipConfig && <ChartCanvas config={chartMuscVsAdipConfig} />}
                      </div>

                      <div className="pcc-footer-bar">
                        <span>Curva comparativa de desarrollo muscular e índice de adiposidad</span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </section>

          </div>
        )}

        {/* VISTA 2: RANKING DEL PLANTEL */}
        {vista === 'ranking' && (
          <div className="card antropo-ranking-card">
            <div className="antropo-ranking-header">
              <div>
                <h3 className="arh-title">Ranking Cineantropométrico del Plantel</h3>
                <p className="arh-sub">Última medición registrada por jugador · {data?.categoriaNombre || categoria}</p>
              </div>

              <div className="arh-filter-pills">
                <span className="arh-filter-label">ORDENAR POR:</span>
                <button 
                  type="button" 
                  className={`arh-pill ${rankingSortKey === 'pliegues' ? 'active' : ''}`}
                  onClick={() => setRankingSortKey('pliegues')}
                >
                  6 Pliegues (Menor)
                </button>
                <button 
                  type="button" 
                  className={`arh-pill ${rankingSortKey === 'imo' ? 'active' : ''}`}
                  onClick={() => setRankingSortKey('imo')}
                >
                  IMO (Mayor)
                </button>
                <button 
                  type="button" 
                  className={`arh-pill ${rankingSortKey === 'muscular' ? 'active' : ''}`}
                  onClick={() => setRankingSortKey('muscular')}
                >
                  % Masa Muscular
                </button>
                <button 
                  type="button" 
                  className={`arh-pill ${rankingSortKey === 'adiposa' ? 'active' : ''}`}
                  onClick={() => setRankingSortKey('adiposa')}
                >
                  % Masa Adiposa
                </button>
                <button 
                  type="button" 
                  className={`arh-pill ${rankingSortKey === 'peso' ? 'active' : ''}`}
                  onClick={() => setRankingSortKey('peso')}
                >
                  Peso
                </button>
              </div>
            </div>

            <div className="antropo-table-scroll">
              <table className="antropo-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ width: '48px' }}>Foto</th>
                    <th>Jugador</th>
                    <th>Edad</th>
                    <th>Peso</th>
                    <th>Talla</th>
                    <th>6 Pliegues (Semáforo)</th>
                    <th>IMO</th>
                    <th>% Masa Musc.</th>
                    <th>% Masa Adip.</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingList.map((j, idx) => {
                    const m = j.ultimaMedicion;
                    if (!m) return null;
                    const pFoto = resolvePlayerPhoto(j.nombreCompleto, categoria);
                    const sem = getSemaforoPliegues(m.pliegues6);

                    return (
                      <tr 
                        key={j.nombreCompleto}
                        className={j.nombreCompleto === selectedPlayerName ? 'row-selected' : ''}
                      >
                        <td className="td-rank"><b>{idx + 1}</b></td>
                        <td>
                          {pFoto ? (
                            <img src={pFoto.url} alt={j.nombreCompleto} className="mini-player-avatar" />
                          ) : (
                            <div className="mini-player-placeholder"><User size={13} /></div>
                          )}
                        </td>
                        <td className="td-name"><b>{j.nombreCompleto}</b></td>
                        <td className="td-muted">{m.edad.split(',')[0] || m.edad}</td>
                        <td>{m.peso} kg</td>
                        <td>{m.talla} cm</td>
                        <td>
                          <span 
                            className={`sem-table-pill ${sem.badgeClass}`}
                            style={{ 
                              backgroundColor: sem.bg, 
                              color: sem.color,
                              borderColor: sem.border
                            }}
                          >
                            <span className="stp-dot" style={{ backgroundColor: sem.color }}></span>
                            <b>{m.pliegues6} mm</b>
                            <span className="stp-lvl">({sem.label.split(' ')[0]})</span>
                          </span>
                        </td>
                        <td><b className="text-indigo">{m.imo}</b></td>
                        <td><b className="text-celeste">{m.masas.pctMuscular}%</b> <span className="td-muted">({m.masas.muscular}kg)</span></td>
                        <td><b>{m.masas.pctAdiposa}%</b> <span className="td-muted">({m.masas.adiposa}kg)</span></td>
                        <td className="td-muted">{m.fecha}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-select-player-row"
                            onClick={() => {
                              setSelectedPlayerName(j.nombreCompleto);
                              setVista('ficha');
                            }}
                          >
                            <span>Ficha</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA 3: EVOLUTIVO INDIVIDUAL (POWER BI LAYOUT IDÉNTICO) */}
        {vista === 'evolutivo' && (
          <EvolutivoIndividualView
            jugadores={data?.jugadores || []}
            jugadorSeleccionado={jugadorActual}
            onSelectJugador={(j) => setSelectedPlayerName(j.nombreCompleto)}
            categoria={categoria}
            tema={tema}
          />
        )}
      </main>
    </div>
  );
}
