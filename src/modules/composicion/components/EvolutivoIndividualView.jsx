import React, { useState, useMemo } from 'react';
import ChartCanvas from '../../../components/ChartCanvas';
import { resolvePlayerPhoto } from '../../../utils/photoResolver';
import { obtenerPosicionesJugador } from '../../../data/jugadoresPosiciones';

function formatFechaDisplay(fStr) {
  if (!fStr) return '';
  const parts = String(fStr).split('/');
  if (parts.length === 3) {
    const d = ('0' + parseInt(parts[0], 10)).slice(-2);
    const m = ('0' + parseInt(parts[1], 10)).slice(-2);
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${d}/${m}/${y}`;
  }
  return fStr;
}

function formatNum(val, dec = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(dec).replace('.', ',');
}

function BulletGauge({ label, value, min = 0, max = 100, displayValue, tema, isLast = false }) {
  const num = Number(value) || 0;
  const pct = Math.min(100, Math.max(0, ((num - min) / (max - min)) * 100));

  return (
    <div style={{ marginBottom: isLast ? 0 : '6px' }}>
      <div style={{ 
        fontSize: '10.5px', 
        fontWeight: 800, 
        color: tema === 'oscuro' ? '#f8fafc' : '#0f172a', 
        marginBottom: '2px',
        lineHeight: 1.15
      }}>
        {label}: {displayValue !== undefined ? displayValue : formatNum(value)}
      </div>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '12px',
        background: tema === 'oscuro' ? '#1e293b' : '#e2e8f0',
        border: `1px solid ${tema === 'oscuro' ? '#334155' : '#cbd5e1'}`,
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: tema === 'oscuro' ? '#475569' : '#718096'
        }} />
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 1px)`,
          top: 0,
          bottom: 0,
          width: '2px',
          background: tema === 'oscuro' ? '#ffffff' : '#0f172a'
        }} />
      </div>
    </div>
  );
}

export default function EvolutivoIndividualView({
  jugadores = [],
  jugadorSeleccionado,
  onSelectJugador,
  categoria,
  tema = 'claro'
}) {
  const [fechaFiltro, setFechaFiltro] = useState('Todas');

  const jugador = useMemo(() => {
    if (!jugadores || jugadores.length === 0) return null;
    if (jugadorSeleccionado) {
      const found = jugadores.find(j => j.nombreCompleto === jugadorSeleccionado.nombreCompleto);
      if (found) return found;
    }
    return jugadores[0];
  }, [jugadores, jugadorSeleccionado]);

  // Lista de fechas únicas para el selector de fecha
  const fechasDisponibles = useMemo(() => {
    if (!jugador || !jugador.mediciones) return [];
    return Array.from(new Set(jugador.mediciones.map(m => formatFechaDisplay(m.fecha))));
  }, [jugador]);

  // Mediciones ordenadas cronológicamente (antigua a reciente)
  const medicionesCronologicas = useMemo(() => {
    if (!jugador || !jugador.mediciones) return [];
    const list = [...jugador.mediciones].sort((a, b) => {
      const partsA = a.fecha.split('/');
      const partsB = b.fecha.split('/');
      if (partsA.length === 3 && partsB.length === 3) {
        const dA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
        const dB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
        return dA - dB;
      }
      return 0;
    });

    if (fechaFiltro !== 'Todas') {
      return list.filter(m => formatFechaDisplay(m.fecha) === fechaFiltro);
    }
    return list;
  }, [jugador, fechaFiltro]);

  // Última medición registrada
  const ultimaMed = useMemo(() => {
    if (medicionesCronologicas.length === 0) return null;
    return medicionesCronologicas[medicionesCronologicas.length - 1];
  }, [medicionesCronologicas]);

  // Foto y posición
  const fotoInfo = useMemo(() => {
    if (!jugador) return null;
    return resolvePlayerPhoto(jugador.nombreCompleto, categoria);
  }, [jugador, categoria]);

  const posicionDisplay = useMemo(() => {
    if (!jugador) return '—';
    const pos = obtenerPosicionesJugador(jugador.nombreCompleto);
    if (!pos || pos === '—') {
      if (jugador.nombreCompleto.includes('PEREZ EZEQUIEL')) return 'EXT DER';
      return 'JUGADOR';
    }
    const up = pos.toUpperCase();
    if (up.includes('EXTREMO DERECHO')) return 'EXT DER';
    if (up.includes('EXTREMO IZQUIERDO')) return 'EXT IZQ';
    if (up.includes('EXTREMO')) return 'EXT DER';
    if (up.includes('VOLANTE CENTRAL')) return 'VOL CEN';
    if (up.includes('VOLANTE MIXTO') || up.includes('VOLANTE INTERNO')) return 'VOL MIX';
    if (up.includes('DEFENSOR CENTRAL')) return 'DEF CEN';
    if (up.includes('LATERAL DERECHO')) return 'LAT DER';
    if (up.includes('LATERAL IZQUIERDO')) return 'LAT IZQ';
    if (up.includes('DEFENSOR LATERAL')) return 'DEF LAT';
    if (up.includes('DELANTERO') || up.includes('CENTRODELANTERO')) return 'DEL';
    if (up.includes('ARQUERO')) return 'ARQ';
    return pos.toUpperCase();
  }, [jugador]);

  // Fechas y valores para los gráficos
  const labelsX = useMemo(() => {
    return medicionesCronologicas.map(m => formatFechaDisplay(m.fecha));
  }, [medicionesCronologicas]);

  // Averages para masa adiposa y muscular
  const avgAdiposa = useMemo(() => {
    if (medicionesCronologicas.length === 0) return 0;
    const sum = medicionesCronologicas.reduce((acc, m) => acc + (m.masas?.adiposa || 0), 0);
    return Math.round((sum / medicionesCronologicas.length) * 100) / 100;
  }, [medicionesCronologicas]);

  const avgMuscular = useMemo(() => {
    if (medicionesCronologicas.length === 0) return 0;
    const sum = medicionesCronologicas.reduce((acc, m) => acc + (m.masas?.muscular || 0), 0);
    return Math.round((sum / medicionesCronologicas.length) * 100) / 100;
  }, [medicionesCronologicas]);

  // Estilos de tarjetas adaptados a pantalla completa sin scroll
  const cardStyle = {
    background: tema === 'oscuro' ? '#0f172a' : '#ffffff',
    border: `1px solid ${tema === 'oscuro' ? '#1e293b' : '#e2e8f0'}`,
    borderRadius: '8px',
    padding: '8px 12px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
    minWidth: 0,
    minHeight: 0,
    height: '100%'
  };

  const titleStyle = {
    fontSize: '11.5px',
    fontWeight: 800,
    color: tema === 'oscuro' ? '#f8fafc' : '#0f172a',
    marginBottom: '4px',
    lineHeight: 1.1,
    flexShrink: 0
  };

  // 1. GRÁFICO: Evolución peso
  const chartPesoConfig = useMemo(() => {
    const dataVals = medicionesCronologicas.map(m => m.peso || 0);
    return {
      type: 'line',
      data: {
        labels: labelsX,
        datasets: [
          {
            data: dataVals,
            borderColor: '#3b82f6',
            borderDash: [5, 4],
            borderWidth: 2,
            tension: 0.45,
            pointRadius: 4,
            pointBackgroundColor: '#64748b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Peso: ${formatNum(ctx.parsed.y)} kg`
            }
          },
          datalabels: {
            display: true,
            align: (ctx) => (ctx.dataIndex % 2 === 0 ? 'bottom' : 'top'),
            offset: 3,
            color: tema === 'oscuro' ? '#f1f5f9' : '#0f172a',
            font: { size: 9, weight: '800' },
            formatter: (v) => formatNum(v)
          }
        },
        scales: {
          x: {
            ticks: { 
              font: { size: 8.5, weight: '700' },
              color: tema === 'oscuro' ? '#cbd5e1' : '#334155'
            },
            grid: { display: false }
          },
          y: {
            display: false,
            grace: '18%'
          }
        }
      }
    };
  }, [medicionesCronologicas, labelsX, tema]);

  // 2. GRÁFICO: Evolución 6Pliegues
  const chartPlieguesConfig = useMemo(() => {
    const dataVals = medicionesCronologicas.map(m => m.pliegues6 || 0);
    return {
      type: 'bar',
      data: {
        labels: labelsX,
        datasets: [
          {
            data: dataVals,
            backgroundColor: dataVals.map(v => {
              if (v > 42) return '#D32F2F'; // Rojo
              if (v >= 40) return '#FACC15'; // Amarillo
              return '#8BC34A'; // Verde
            }),
            borderRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` 6 Pliegues: ${formatNum(ctx.parsed.y)} mm`
            }
          },
          datalabels: {
            display: true,
            rotation: -90,
            align: 'center',
            color: (ctx) => {
              const val = ctx.dataset.data[ctx.dataIndex] || 0;
              return val > 42 ? '#ffffff' : '#0f172a';
            },
            font: { size: 8.5, weight: '800' },
            formatter: (v) => formatNum(v)
          }
        },
        scales: {
          x: {
            ticks: { 
              font: { size: 8, weight: '700' },
              maxRotation: 45,
              minRotation: 45,
              color: tema === 'oscuro' ? '#cbd5e1' : '#334155'
            },
            grid: { display: false }
          },
          y: {
            min: 0,
            max: 50,
            ticks: { 
              stepSize: 50, 
              font: { size: 8.5, weight: '800' },
              color: tema === 'oscuro' ? '#cbd5e1' : '#334155'
            },
            grid: { color: tema === 'oscuro' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
          }
        }
      }
    };
  }, [medicionesCronologicas, labelsX, tema]);

  // 3. GRÁFICO: Evolución Masa Adiposa
  const chartAdiposaConfig = useMemo(() => {
    const dataVals = medicionesCronologicas.map(m => m.masas?.adiposa || 0);
    return {
      type: 'bar',
      data: {
        labels: labelsX,
        datasets: [
          {
            type: 'bar',
            data: dataVals,
            backgroundColor: '#93C5FD',
            borderRadius: 2,
            datalabels: {
              display: true,
              rotation: -90,
              align: 'center',
              color: '#0f172a',
              font: { size: 8.5, weight: '800' },
              formatter: (v) => formatNum(v)
            }
          },
          {
            type: 'line',
            data: Array(labelsX.length).fill(avgAdiposa),
            borderColor: '#94A3B8',
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            datalabels: { display: false }
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Masa Adiposa: ${formatNum(ctx.parsed.y)} kg`
            }
          }
        },
        scales: {
          x: {
            ticks: { 
              font: { size: 8, weight: '700' },
              maxRotation: 45,
              minRotation: 45,
              color: tema === 'oscuro' ? '#cbd5e1' : '#334155'
            },
            grid: { display: false }
          },
          y: {
            display: false,
            grace: '25%'
          }
        }
      }
    };
  }, [medicionesCronologicas, labelsX, avgAdiposa, tema]);

  // 4. GRÁFICO: Evolución Masa Muscular
  const chartMuscularConfig = useMemo(() => {
    const dataVals = medicionesCronologicas.map(m => m.masas?.muscular || 0);
    return {
      type: 'bar',
      data: {
        labels: labelsX,
        datasets: [
          {
            type: 'bar',
            data: dataVals,
            backgroundColor: '#3B82F6',
            borderRadius: 2,
            datalabels: {
              display: true,
              rotation: -90,
              align: 'center',
              color: '#ffffff',
              font: { size: 8.5, weight: '800' },
              formatter: (v) => formatNum(v)
            }
          },
          {
            type: 'line',
            data: Array(labelsX.length).fill(avgMuscular),
            borderColor: '#94A3B8',
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            datalabels: { display: false }
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Masa Muscular: ${formatNum(ctx.parsed.y)} kg`
            }
          }
        },
        scales: {
          x: {
            ticks: { 
              font: { size: 8, weight: '700' },
              maxRotation: 45,
              minRotation: 45,
              color: tema === 'oscuro' ? '#cbd5e1' : '#334155'
            },
            grid: { display: false }
          },
          y: {
            display: false,
            grace: '20%'
          }
        }
      }
    };
  }, [medicionesCronologicas, labelsX, avgMuscular, tema]);

  // 5. GRÁFICO: Evolución IMO
  const chartIMOConfig = useMemo(() => {
    const dataVals = medicionesCronologicas.map(m => m.imo || 0);
    return {
      type: 'bar',
      data: {
        labels: labelsX,
        datasets: [
          {
            data: dataVals,
            backgroundColor: '#D32F2F',
            borderRadius: 2,
            datalabels: {
              display: true,
              rotation: -90,
              align: 'center',
              color: '#ffffff',
              font: { size: 8.5, weight: '800' },
              formatter: (v) => formatNum(v)
            }
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` IMO: ${formatNum(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            ticks: { 
              font: { size: 8, weight: '700' },
              maxRotation: 45,
              minRotation: 45,
              color: tema === 'oscuro' ? '#cbd5e1' : '#334155'
            },
            grid: { display: false }
          },
          y: {
            min: 0,
            max: 4.6,
            ticks: { 
              stepSize: 2, 
              font: { size: 8.5, weight: '800' },
              color: tema === 'oscuro' ? '#cbd5e1' : '#334155'
            },
            grid: { color: tema === 'oscuro' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
          }
        }
      }
    };
  }, [medicionesCronologicas, labelsX, tema]);

  // 6. GRÁFICO: Masas (Horizontal 100% Stacked Bar)
  const chartMasasStackedConfig = useMemo(() => {
    const reversedMediciones = [...medicionesCronologicas].reverse();
    const reversedLabels = reversedMediciones.map(m => formatFechaDisplay(m.fecha));

    const pctAdip = reversedMediciones.map(m => m.masas?.pctAdiposa || 0);
    const pctMusc = reversedMediciones.map(m => m.masas?.pctMuscular || 0);
    const pctOsea = reversedMediciones.map(m => m.masas?.pctOsea || 0);
    const pctPiel = reversedMediciones.map(m => m.masas?.pctPiel || 0);
    const pctRes = reversedMediciones.map(m => m.masas?.pctResidual || 0);

    return {
      type: 'bar',
      data: {
        labels: reversedLabels,
        datasets: [
          {
            label: 'Adiposa',
            data: pctAdip,
            backgroundColor: '#8ecae6',
            stack: 'masas',
            barThickness: 26,
            maxBarThickness: 32
          },
          {
            label: 'Muscular',
            data: pctMusc,
            backgroundColor: '#1b3a6b',
            stack: 'masas',
            barThickness: 26,
            maxBarThickness: 32
          },
          {
            label: 'Osea',
            data: pctOsea,
            backgroundColor: '#5b9bd5',
            stack: 'masas',
            barThickness: 26,
            maxBarThickness: 32
          },
          {
            label: 'Piel',
            data: pctPiel,
            backgroundColor: '#2e6bb5',
            stack: 'masas',
            barThickness: 26,
            maxBarThickness: 32
          },
          {
            label: 'Residual',
            data: pctRes,
            backgroundColor: '#6cb2eb',
            stack: 'masas',
            barThickness: 26,
            maxBarThickness: 32
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
              label: (ctx) => ` ${ctx.dataset.label}: ${formatNum(ctx.parsed.x)}%`
            }
          },
          datalabels: {
            color: '#FFFFFF',
            font: { size: 9, weight: '800' },
            formatter: (v) => `${formatNum(v, 1)}%`,
            display: (ctx) => (ctx.dataset.data[ctx.dataIndex] || 0) >= 6.0,
            align: 'center'
          }
        },
        scales: {
          x: {
            stacked: true,
            max: 100,
            ticks: {
              callback: (v) => `${v}%`,
              stepSize: 20,
              font: { size: 8.5, weight: '700' },
              color: tema === 'oscuro' ? '#cbd5e1' : '#334155'
            },
            grid: { color: tema === 'oscuro' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
          },
          y: {
            stacked: true,
            ticks: { 
              font: { size: 9, weight: '700' },
              color: tema === 'oscuro' ? '#f1f5f9' : '#0f172a'
            },
            grid: { display: false }
          }
        }
      }
    };
  }, [medicionesCronologicas, tema]);

  if (!jugador) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        No hay datos de jugadores disponibles para esta categoría.
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      flex: 1,
      minHeight: 0,
      padding: 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* ─── CONTENEDOR PRINCIPAL: COLUMNA IZQUIERDA LIBERADA + PANEL DERECHO ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '430px minmax(0, 1fr)',
        gap: '8px',
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        {/* ============================================================== */}
        {/* COLUMNA IZQUIERDA: FICHA MÁS GRANDE + 6 PLIEGUES E IMO COMPACTAS */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* 1. FICHA DE PERFIL Y SELECTORES (AMPLIADA VERTICALMENTE) */}
          <div style={{ ...cardStyle, flex: 1.42, minHeight: 0 }}>
            {/* Selectores superiores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px', marginBottom: '6px', flexShrink: 0 }}>
              <div>
                <label style={{ display: 'block', fontSize: '9.5px', fontWeight: 800, color: tema === 'oscuro' ? '#94a3b8' : '#475569', marginBottom: '1px' }}>
                  Jugador
                </label>
                <select
                  value={jugador.nombreCompleto}
                  onChange={(e) => {
                    const target = jugadores.find(j => j.nombreCompleto === e.target.value);
                    if (target && onSelectJugador) onSelectJugador(target);
                  }}
                  style={{
                    width: '100%',
                    padding: '3px 4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: `1px solid ${tema === 'oscuro' ? '#334155' : '#cbd5e1'}`,
                    background: tema === 'oscuro' ? '#1e293b' : '#ffffff',
                    color: tema === 'oscuro' ? '#f8fafc' : '#0f172a',
                    boxSizing: 'border-box'
                  }}
                >
                  {jugadores.map(j => (
                    <option key={j.nombreCompleto} value={j.nombreCompleto}>
                      {j.nombreCompleto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9.5px', fontWeight: 800, color: tema === 'oscuro' ? '#94a3b8' : '#475569', marginBottom: '1px' }}>
                  Año-Mes, Fecha
                </label>
                <select
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '3px 4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: `1px solid ${tema === 'oscuro' ? '#334155' : '#cbd5e1'}`,
                    background: tema === 'oscuro' ? '#1e293b' : '#ffffff',
                    color: tema === 'oscuro' ? '#f8fafc' : '#0f172a',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Todas">Todas</option>
                  {fechasDisponibles.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Foto Grande + Posición Visible + Gauges */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {/* Foto del jugador y posición */}
              <div style={{ textAlign: 'center', width: '115px', flexShrink: 0 }}>
                <div style={{
                  width: '115px',
                  height: '130px',
                  margin: '0 auto',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: tema === 'oscuro' ? '#1e293b' : '#f1f5f9',
                  border: `1.5px solid ${tema === 'oscuro' ? '#334155' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(fotoInfo?.url || fotoInfo?.src) ? (
                    <img
                      src={fotoInfo.url || fotoInfo.src}
                      alt={jugador.nombreCompleto}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    />
                  ) : (
                    <span style={{ fontSize: '32px', fontWeight: 900, color: '#002B66' }}>
                      {jugador.nombre?.[0] || 'R'}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  color: tema === 'oscuro' ? '#38bdf8' : '#003882',
                  marginTop: '5px',
                  letterSpacing: '0.6px',
                  background: tema === 'oscuro' ? 'rgba(0, 43, 102, 0.16)' : '#e0f2fe',
                  border: `1px solid ${tema === 'oscuro' ? 'rgba(56, 189, 248, 0.35)' : '#bae6fd'}`,
                  borderRadius: '4px',
                  padding: '2px 5px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {posicionDisplay}
                </div>
              </div>

              {/* Gauges de Edad, Último Peso y Talla con más aire vertical */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
                <BulletGauge
                  label="Edad"
                  value={ultimaMed?.edad ? parseFloat(String(ultimaMed.edad).replace(',', '.')) : (jugador.edad ? parseFloat(String(jugador.edad).replace(',', '.')) : 18)}
                  min={10}
                  max={30}
                  displayValue={ultimaMed?.edad || jugador.edad || 18}
                  tema={tema}
                />
                <BulletGauge
                  label="Último Peso"
                  value={ultimaMed?.peso || 0}
                  min={40}
                  max={100}
                  displayValue={formatNum(ultimaMed?.peso)}
                  tema={tema}
                />
                <BulletGauge
                  label="Talla"
                  value={ultimaMed?.talla || 0}
                  min={130}
                  max={210}
                  displayValue={formatNum(ultimaMed?.talla, 1)}
                  tema={tema}
                  isLast
                />
              </div>
            </div>
          </div>

          {/* 2. EVOLUCIÓN 6PLIEGUES (MÁS COMPACTA) */}
          <div style={{ ...cardStyle, flex: 0.79, minHeight: 0 }}>
            <div style={titleStyle}>Evolución 6Pliegues</div>
            <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
              <ChartCanvas config={chartPlieguesConfig} />
            </div>
          </div>

          {/* 3. EVOLUCIÓN IMO (MÁS COMPACTA) */}
          <div style={{ ...cardStyle, flex: 0.79, minHeight: 0 }}>
            <div style={titleStyle}>Evolución IMO</div>
            <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
              <ChartCanvas config={chartIMOConfig} />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMNA DERECHA: GRILLA INTACTA (PESO, ADIPOSA, MUSCULAR, MASAS) */}
        {/* ============================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gridTemplateRows: '0.94fr 1fr 1.06fr',
          gap: '8px',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* FILA 1: EVOLUCIÓN PESO (SPANS 2 COLUMNS) */}
          <div style={{ ...cardStyle, gridColumn: '1 / span 2', gridRow: '1' }}>
            <div style={titleStyle}>Evolución peso</div>
            <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
              <ChartCanvas config={chartPesoConfig} />
            </div>
          </div>

          {/* FILA 2, COL 1: EVOLUCIÓN MASA ADIPOSA */}
          <div style={{ ...cardStyle, gridColumn: '1', gridRow: '2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={titleStyle}>Evolución Masa Adiposa</div>
              <div style={{ fontSize: '10px', color: tema === 'oscuro' ? '#cbd5e1' : '#334155', fontWeight: 800 }}>
                Avg: {formatNum(avgAdiposa)}
              </div>
            </div>
            <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
              <ChartCanvas config={chartAdiposaConfig} />
            </div>
          </div>

          {/* FILA 2, COL 2: EVOLUCIÓN MASA MUSCULAR */}
          <div style={{ ...cardStyle, gridColumn: '2', gridRow: '2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={titleStyle}>Evolución Masa Muscular</div>
              <div style={{ fontSize: '10px', color: tema === 'oscuro' ? '#cbd5e1' : '#334155', fontWeight: 800 }}>
                Avg: {formatNum(avgMuscular)}
              </div>
            </div>
            <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
              <ChartCanvas config={chartMuscularConfig} />
            </div>
          </div>

          {/* FILA 3: MASAS (CON SCROLL VERTICAL) */}
          <div style={{ ...cardStyle, gridColumn: '1 / span 2', gridRow: '3' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px', flexWrap: 'wrap', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ ...titleStyle, marginBottom: 0 }}>Masas</div>
                <span style={{ fontSize: '9px', fontWeight: 600, color: tema === 'oscuro' ? '#94a3b8' : '#64748b' }}>
                  ({medicionesCronologicas.length} {medicionesCronologicas.length === 1 ? 'medición' : 'mediciones'})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9.5px', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: tema === 'oscuro' ? '#cbd5e1' : '#475569' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8ecae6', display: 'inline-block' }} />
                  Adiposa
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: tema === 'oscuro' ? '#cbd5e1' : '#475569' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1b3a6b', display: 'inline-block' }} />
                  Muscular
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: tema === 'oscuro' ? '#cbd5e1' : '#475569' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#5b9bd5', display: 'inline-block' }} />
                  Osea
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: tema === 'oscuro' ? '#cbd5e1' : '#475569' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2e6bb5', display: 'inline-block' }} />
                  Piel
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: tema === 'oscuro' ? '#cbd5e1' : '#475569' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6cb2eb', display: 'inline-block' }} />
                  Residual
                </span>
              </div>
            </div>
            {/* Contenedor con scroll vertical para que no quede apretado */}
            <div style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              position: 'relative',
              paddingRight: '6px'
            }}>
              <div style={{
                width: '100%',
                height: `${Math.max(160, medicionesCronologicas.length * 42 + 25)}px`,
                minHeight: '100%',
                position: 'relative'
              }}>
                <ChartCanvas config={chartMasasStackedConfig} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
