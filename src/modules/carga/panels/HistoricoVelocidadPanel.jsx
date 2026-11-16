import React, { useState, useMemo } from 'react';
import ChartCanvas from '../../../components/ChartCanvas';
import { fmt } from '../../../utils/helpers';
import {
  parseFecha,
  mondayOf,
  keyOf,
  rangoDe,
  mdDe,
  esEntrenamientoValidoVelocidad,
  calcularSemanasEntrenamiento,
  calcularRecordsVelocidad,
} from '../../../utils/velocidadCalculos';

export default function HistoricoVelocidadPanel({ data, catActual, tema = 'claro' }) {
  const sesiones = data?.sesiones || [];

  // Semanas disponibles ordenadas cronológicamente
  const semObjs = useMemo(() => calcularSemanasEntrenamiento(sesiones), [sesiones]);

  // Récords de velocidad de los jugadores en entrenamientos válidos
  const recordMap = useMemo(() => calcularRecordsVelocidad(sesiones), [sesiones]);

  // Lista de jugadores con récord > 0 ordenada alfabéticamente
  const jugadores = useMemo(() => {
    return Object.keys(recordMap)
      .filter(n => recordMap[n] > 0)
      .sort((a, b) => a.localeCompare(b, 'es'));
  }, [recordMap]);

  // Semana seleccionada (por defecto la más reciente)
  const [selectedSem, setSelectedSem] = useState(() => {
    return semObjs.length ? semObjs[semObjs.length - 1].key : '';
  });

  // Jugador seleccionado ('__ALL__' o nombre del jugador)
  const [selectedJug, setSelectedJug] = useState('__ALL__');

  // Si cambia la categoría o los datos y la semana ya no existe, actualizar a la última disponible
  const semanaActivaKey = useMemo(() => {
    if (!semObjs.length) return '';
    if (semObjs.some(s => s.key === selectedSem)) return selectedSem;
    return semObjs[semObjs.length - 1].key;
  }, [semObjs, selectedSem]);

  // Mapa de semanas indexado por clave
  const weekMap = useMemo(() => {
    const map = {};
    semObjs.forEach(s => {
      map[s.key] = s;
    });
    return map;
  }, [semObjs]);

  // Sesiones de un jugador en una semana dada
  const diasDeJugador = useMemo(() => {
    if (!semanaActivaKey || selectedJug === '__ALL__') return [];
    const arr = [];
    sesiones.forEach(s => {
      if (!esEntrenamientoValidoVelocidad(s)) return;
      const d = parseFecha(s.fecha);
      if (isNaN(d.getTime()) || keyOf(mondayOf(d)) !== semanaActivaKey) return;
      (s.jugadores || []).forEach(j => {
        if (j.jugador === selectedJug) {
          arr.push({
            fecha: s.fecha,
            dia: s.dia || s.per || '',
            md: mdDe(s),
            ts: parseFloat(j.topSpeed) || 0,
          });
        }
      });
    });
    return arr.sort((a, b) => parseFecha(a.fecha) - parseFecha(b.fecha));
  }, [sesiones, semanaActivaKey, selectedJug]);

  // Cantidad de entrenamientos que tuvo el equipo en esa semana
  const diasEquipoSemana = useMemo(() => {
    if (!semanaActivaKey) return 0;
    let c = 0;
    sesiones.forEach(s => {
      if (!esEntrenamientoValidoVelocidad(s)) return;
      const d = parseFecha(s.fecha);
      if (!isNaN(d.getTime()) && keyOf(mondayOf(d)) === semanaActivaKey) c++;
    });
    return c;
  }, [sesiones, semanaActivaKey]);

  // Colores dinámicos según el tema
  const isDark = tema === 'oscuro';
  const cT = isDark ? '#e2e8f0' : '#1e293b';
  const cM = isDark ? '#94a3b8' : '#64748b';
  const cG = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  if (!semObjs.length) {
    return (
      <div>
        <div className="panel-title">Histórico de velocidad</div>
        <div className="obs">
          No hay entrenamientos (MD+2 a MD-1) con datos de velocidad cargados para esta categoría todavía.
        </div>
      </div>
    );
  }

  // Vista Colectiva (Plantel Completo)
  const filasPlantel = jugadores.map(n => {
    const rec = recordMap[n] || 0;
    const dias = [];
    sesiones.forEach(s => {
      if (!esEntrenamientoValidoVelocidad(s)) return;
      const d = parseFecha(s.fecha);
      if (isNaN(d.getTime()) || keyOf(mondayOf(d)) !== semanaActivaKey) return;
      (s.jugadores || []).forEach(j => {
        if (j.jugador === n) {
          dias.push({
            fecha: s.fecha,
            dia: s.dia || s.per || '',
            md: mdDe(s),
            ts: parseFloat(j.topSpeed) || 0,
          });
        }
      });
    });

    let best = 0;
    let bd = null;
    dias.forEach(x => {
      if (x.ts > best) {
        best = x.ts;
        bd = x;
      }
    });

    const pct = rec > 0 && best > 0 ? Math.round((best / rec) * 100) : (dias.length ? 0 : null);
    return {
      n,
      rec,
      best,
      pct,
      bd,
      nDias: dias.length,
      tiene: dias.length > 0,
    };
  }).sort((a, b) => {
    if (a.tiene !== b.tiene) return a.tiene ? -1 : 1;
    return (b.pct || 0) - (a.pct || 0);
  });

  const conDatos = filasPlantel.filter(f => f.tiene);
  const n90 = conDatos.filter(f => f.pct >= 90).length;
  const peorJugador = conDatos.length ? conDatos.slice().sort((a, b) => a.pct - b.pct)[0] : null;

  // Configuración del gráfico horizontal para el plantel completo
  const chartPlantelConfig = {
    type: 'bar',
    data: {
      labels: conDatos.map(f => `${f.n} (${f.nDias}d)`),
      datasets: [{
        data: conDatos.map(f => f.pct),
        backgroundColor: conDatos.map(f => (f.pct >= 90 ? '#2ECC71' : f.pct >= 80 ? '#F1C40F' : '#E74C3C')),
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: '% de la velocidad récord en la semana — (Nd = días entrenados)',
          color: cT,
          font: { family: 'Plus Jakarta Sans', size: 13, weight: '600' },
        },
        datalabels: {
          color: cT,
          font: { size: 10, weight: 'bold' },
          anchor: 'end',
          align: 'end',
          formatter: v => `${v}%`,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          suggestedMax: 110,
          ticks: { color: cM, callback: v => `${v}%` },
          grid: { color: cG },
        },
        y: {
          ticks: { color: cM, font: { size: 11 } },
        },
      },
    },
  };

  // Configuración del gráfico individual para un jugador específico
  const recIndividual = recordMap[selectedJug] || 0;
  let bestIndividual = 0;
  let bdIndividual = null;
  diasDeJugador.forEach(x => {
    if (x.ts > bestIndividual) {
      bestIndividual = x.ts;
      bdIndividual = x;
    }
  });
  const pctIndividual = recIndividual > 0 && bestIndividual > 0
    ? Math.round((bestIndividual / recIndividual) * 100)
    : null;
  const llego90Individual = pctIndividual != null && pctIndividual >= 90;

  const chartIndividualConfig = {
    type: 'bar',
    data: {
      labels: diasDeJugador.map(x => x.dia || x.md || x.fecha),
      datasets: [
        {
          label: 'Vel. máx del día',
          data: diasDeJugador.map(x => x.ts),
          backgroundColor: diasDeJugador.map(x =>
            bdIndividual && x.fecha === bdIndividual.fecha && x.ts === bdIndividual.ts ? '#2ECC71' : '#5BA3DE'
          ),
          borderRadius: 4,
          order: 2,
        },
        {
          label: `Récord (${fmt(recIndividual, 1)} km/h)`,
          type: 'line',
          data: diasDeJugador.map(() => recIndividual),
          borderColor: '#F1C40F',
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          order: 1,
        },
        {
          label: '90% del récord',
          type: 'line',
          data: diasDeJugador.map(() => Math.round(recIndividual * 0.9 * 10) / 10),
          borderColor: '#E74C3C',
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: cM } },
        title: {
          display: true,
          text: `Velocidad máxima por día — ${selectedJug}`,
          color: cT,
          font: { family: 'Plus Jakarta Sans', size: 14, weight: '700' },
        },
        datalabels: {
          color: cT,
          font: { size: 10, weight: 'bold' },
          anchor: 'end',
          align: 'top',
          formatter: (v, ctx) => (ctx.datasetIndex === 0 ? fmt(v, 1) : ''),
        },
      },
      scales: {
        x: { ticks: { color: cM, maxRotation: 45 } },
        y: {
          beginAtZero: false,
          suggestedMin: Math.max(0, recIndividual - 12),
          suggestedMax: recIndividual + 2,
          ticks: { color: cM, callback: v => `${v} km/h` },
          grid: { color: cG },
        },
      },
    },
  };

  return (
    <div>
      <div className="panel-title">Histórico de velocidad</div>
      <div className="panel-sub">
        Muestra, semana por semana, qué tan cerca estuvo cada jugador de su velocidad máxima registrada y cuántos días entrenó. Solo toma entrenamientos (MD+2 a MD-1), no partidos. En verde los que llegaron al 90% o más de su récord, en rojo los que quedaron lejos. Sirve para asegurar que cada jugador se exponga a esfuerzos de máxima velocidad y no pierda esa cualidad.
      </div>

      {/* Selectores de Semana y Jugador */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <select
          className="sel"
          value={semanaActivaKey}
          onChange={e => setSelectedSem(e.target.value)}
        >
          {semObjs.slice().reverse().map(o => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className="sel"
          value={selectedJug}
          onChange={e => setSelectedJug(e.target.value)}
        >
          <option value="__ALL__">Todo el plantel</option>
          {jugadores.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Vista Plantel Completo */}
      {selectedJug === '__ALL__' && (
        <>
          <div className="obs">
            <strong>Cómo leer:</strong> <strong>Días entren.</strong> = cuántos entrenamientos (MD+2 a MD-1) hizo esa semana — puede explicar por qué llega o no a su máxima. El <strong>% del récord</strong> compara su mejor velocidad de la semana con su máxima histórica en entrenamientos. <span style={{ color: '#2ECC71', fontWeight: 600 }}>Verde ≥90%</span>, <span style={{ color: '#F1C40F', fontWeight: 600 }}>amarillo 80-89%</span>, <span style={{ color: '#E74C3C', fontWeight: 600 }}>rojo &lt;80%</span>.
          </div>

          {conDatos.length > 0 ? (
            <div className="card" style={{ overflowX: 'auto', padding: 0, marginBottom: '16px' }}>
              <table className="data sesion-tbl">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th style={{ textAlign: 'center' }}>Días entren.</th>
                    <th style={{ textAlign: 'center' }}>Récord (km/h)</th>
                    <th style={{ textAlign: 'center' }}>Mejor de la semana</th>
                    <th style={{ textAlign: 'center' }}>% del récord</th>
                    <th style={{ textAlign: 'center' }}>¿Llegó al 90%?</th>
                    <th>Día más cercano</th>
                  </tr>
                </thead>
                <tbody>
                  {conDatos.map(f => {
                    const pctCol = f.pct >= 90 ? '#2ECC71' : f.pct >= 80 ? '#F1C40F' : '#E74C3C';
                    const okTxt = f.pct >= 90 ? 'Sí' : 'No';
                    const okCol = f.pct >= 90 ? '#2ECC71' : '#E74C3C';
                    const diasCol = f.nDias >= 3 ? '#2ECC71' : f.nDias >= 1 ? '#F1C40F' : 'var(--muted)';

                    return (
                      <tr key={f.n}>
                        <td><strong>{f.n}</strong></td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: diasCol }}>
                          {f.nDias}
                        </td>
                        <td style={{ textAlign: 'center' }}>{fmt(f.rec, 1)}</td>
                        <td style={{ textAlign: 'center' }}>{fmt(f.best, 1)}</td>
                        <td style={{ textAlign: 'center', color: pctCol, fontWeight: 700 }}>
                          {f.pct}%
                        </td>
                        <td style={{ textAlign: 'center', color: okCol, fontWeight: 700 }}>
                          {okTxt}
                        </td>
                        <td>
                          <strong>{f.bd?.dia || f.bd?.md || '—'}</strong> · {f.bd?.fecha}{' '}
                          <span style={{ color: 'var(--muted)' }}>({fmt(f.best, 1)} km/h)</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="obs">
              Ningún jugador registró velocidad en entrenamientos (MD+2 a MD-1) esa semana.
            </div>
          )}

          {conDatos.length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <ChartCanvas
                config={chartPlantelConfig}
                height={Math.max(280, conDatos.length * 26)}
              />
            </div>
          )}

          <div className="sintesis">
            <p>
              En la <strong>semana del {weekMap[semanaActivaKey] ? rangoDe(weekMap[semanaActivaKey].mon) : ''}</strong> hubo <strong>{diasEquipoSemana} día(s) de entrenamiento</strong> (MD+2 a MD-1). <strong>{n90} de {conDatos.length}</strong> jugador(es) con datos alcanzaron al menos el <strong>90%</strong> de su velocidad récord.
            </p>
            {peorJugador && (
              <p>
                El que quedó más lejos de su techo fue <strong>{peorJugador.n}</strong> ({peorJugador.pct}% de su récord de {fmt(peorJugador.rec, 1)} km/h, entrenó {peorJugador.nDias} día/s). Cruzá el % con los días entrenados: pocos días suele explicar no llegar a la máxima.
              </p>
            )}
          </div>
        </>
      )}

      {/* Vista Individual (Jugador Específico) */}
      {selectedJug !== '__ALL__' && (
        <>
          <div className="kpis">
            <div className="kpi">
              <div
                className="v"
                style={{
                  color: diasDeJugador.length >= 3 ? '#2ECC71' : diasDeJugador.length >= 1 ? '#F1C40F' : 'var(--muted)',
                }}
              >
                {diasDeJugador.length}
              </div>
              <div className="l">Días de entrenamiento</div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--muted)' }}>
                (equipo: {diasEquipoSemana} esa semana)
              </div>
            </div>

            <div className="kpi">
              <div className="v">
                {fmt(recIndividual, 1)}
                <small> km/h</small>
              </div>
              <div className="l">Récord (entrenos)</div>
            </div>

            <div className="kpi">
              <div className="v">
                {bestIndividual > 0 ? fmt(bestIndividual, 1) : '—'}
                <small> km/h</small>
              </div>
              <div className="l">Mejor de la semana</div>
            </div>

            <div className="kpi">
              <div
                className="v"
                style={{
                  color: pctIndividual != null
                    ? llego90Individual
                      ? '#2ECC71'
                      : pctIndividual >= 80
                      ? '#F1C40F'
                      : '#E74C3C'
                    : 'inherit',
                }}
              >
                {pctIndividual != null ? `${pctIndividual}%` : '—'}
              </div>
              <div className="l">% del récord</div>
            </div>
          </div>

          {diasDeJugador.length > 0 && (
            <div className="card" style={{ marginBottom: '14px' }}>
              <ChartCanvas config={chartIndividualConfig} height={280} />
            </div>
          )}

          {diasDeJugador.length > 0 ? (
            <>
              <div className="obs" style={{ marginBottom: '10px' }}>
                La fila resaltada es el día en que estuvo más cerca de su velocidad máxima.
              </div>
              <div className="card" style={{ overflowX: 'auto', padding: 0, marginBottom: '16px' }}>
                <table className="data sesion-tbl">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Fecha</th>
                      <th style={{ textAlign: 'center' }}>Vel. máx (km/h)</th>
                      <th style={{ textAlign: 'center' }}>% del récord</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diasDeJugador.map(x => {
                      const pd = recIndividual > 0 ? Math.round((x.ts / recIndividual) * 100) : 0;
                      const esMejor = bdIndividual && x.fecha === bdIndividual.fecha && x.ts === bdIndividual.ts;
                      const pcol = pd >= 90 ? '#2ECC71' : pd >= 80 ? '#F1C40F' : '#E74C3C';

                      return (
                        <tr
                          key={x.fecha}
                          style={esMejor ? { background: 'rgba(46, 204, 113, 0.12)' } : undefined}
                        >
                          <td><strong>{x.dia || x.md || '—'}</strong></td>
                          <td>{x.fecha}</td>
                          <td style={{ textAlign: 'center' }}>{fmt(x.ts, 1)}</td>
                          <td style={{ textAlign: 'center', color: pcol, fontWeight: 600 }}>
                            {pd}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="obs" style={{ marginBottom: '14px' }}>
              No hay entrenamientos de este jugador en la semana elegida.
            </div>
          )}

          <div className="sintesis">
            {pctIndividual == null ? (
              <p>
                <strong>{selectedJug}</strong> no tiene entrenamientos (MD+2 a MD-1) en la semana del{' '}
                {weekMap[semanaActivaKey] ? rangoDe(weekMap[semanaActivaKey].mon) : ''}.
              </p>
            ) : (
              <>
                <p>
                  En la <strong>semana del {weekMap[semanaActivaKey] ? rangoDe(weekMap[semanaActivaKey].mon) : ''}</strong>, <strong>{selectedJug}</strong> entrenó <strong>{diasDeJugador.length} día(s)</strong> y llegó a <strong>{fmt(bestIndividual, 1)} km/h</strong>, un <strong>{pctIndividual}%</strong> de su récord de <strong>{fmt(recIndividual, 1)} km/h</strong>.{' '}
                  <span
                    style={{
                      color: llego90Individual ? '#2ECC71' : '#E74C3C',
                      fontWeight: 700,
                    }}
                  >
                    {llego90Individual ? 'Superó el 90% de su récord.' : 'No alcanzó el 90% de su récord.'}
                  </span>
                </p>
                {bdIndividual && (
                  <p>
                    El día que estuvo <strong>más cerca de su máximo</strong> fue <strong>{bdIndividual.dia || bdIndividual.md || '—'}</strong> ({bdIndividual.fecha}) con <strong>{fmt(bestIndividual, 1)} km/h</strong>.
                    {diasDeJugador.length < 3 ? ' Ojo: pocos días de entrenamiento pueden explicar no llegar a la máxima.' : ''}
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
