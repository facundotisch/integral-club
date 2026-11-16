import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { buildStaticPlayersCatalog } from '../../../data/jugadoresIndex';

// Helper: obtener el lunes correspondiente a una fecha
function getMondayOfDate(inputDate) {
  let d = inputDate ? new Date(inputDate) : new Date();
  if (typeof inputDate === 'string' && inputDate.length === 10) {
    const parts = inputDate.split('-').map(Number);
    d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  } else {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  }
  const dayOfWeek = d.getDay(); // 0 domingo, 1 lunes...
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  const yyyy = mon.getFullYear();
  const mm = String(mon.getMonth() + 1).padStart(2, '0');
  const dd = String(mon.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper: sumar semanas a una fecha de lunes
function addWeeksToMonday(mondayStr, weeks = 1) {
  if (!mondayStr) return getMondayOfDate(new Date());
  const parts = mondayStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2] + (weeks * 7), 12, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper: formato legible del rango de 5 días (Lunes a Viernes: MD-5 a MD-1)
function formatRangeDates(mondayStr) {
  if (!mondayStr) return '';
  const parts = mondayStr.split('-').map(Number);
  const mon = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const fri = new Date(parts[0], parts[1] - 1, parts[2] + 4, 12, 0, 0);
  const dMon = String(mon.getDate()).padStart(2, '0');
  const mMon = String(mon.getMonth() + 1).padStart(2, '0');
  const dFri = String(fri.getDate()).padStart(2, '0');
  const mFri = String(fri.getMonth() + 1).padStart(2, '0');
  return `Lunes ${dMon}/${mMon} al Viernes ${dFri}/${mFri} (5 días: MD+2, MD-4, MD-3, MD-2, MD-1)`;
}

const OBJETIVOS_OPCIONES = [
  'Toda la semana (MD+2 a MD-1)',
  'Partidos oficiales (MD)',
  'Días de alta intensidad (MD-4 y MD-3)',
  'Velocidad y aceleración (MD-2)',
  'Readaptación / Retorno al juego',
  'Específico de cargas reducidas'
];

function getStoredKey(cat, micro) {
  return `integral_mapeo_gps_${cat.toLowerCase()}_m_${micro}`;
}

function getStoredObsKey(cat, micro) {
  return `integral_mapeo_obs_${cat.toLowerCase()}_m_${micro}`;
}

function getStoredObjKey(cat, micro) {
  return `integral_mapeo_obj_${cat.toLowerCase()}_m_${micro}`;
}

export default function MapeoSemanalPanel({ data, catActual = 'Quinta', tema = 'claro' }) {
  // 1. Detectar el microciclo actual en los datos cargados
  const defaultMicro = useMemo(() => {
    try {
      const sesiones = (data && data.sesiones) || [];
      const micros = sesiones
        .map(s => parseInt(s.micro || s.sem, 10))
        .filter(n => !isNaN(n) && n > 0);
      if (micros.length > 0) {
        return Math.max(...micros);
      }
    } catch {}
    return 35;
  }, [data]);

  const [microciclo, setMicrociclo] = useState(defaultMicro);
  const [numChalecos, setNumChalecos] = useState(8);

  // Fecha de inicio: inicia por defecto en el LUNES de la semana actual
  const [fechaSemana, setFechaSemana] = useState(() => getMondayOfDate(new Date()));

  // Objetivo del microciclo (por fuera de la tabla)
  const [objetivoSemana, setObjetivoSemana] = useState(() => {
    try {
      const saved = localStorage.getItem(getStoredObjKey(catActual, defaultMicro));
      if (saved) return saved;
    } catch {}
    return OBJETIVOS_OPCIONES[0];
  });

  // Observaciones diarias para la descarga de Catapult (por fuera de la tabla)
  const [obsDiarias, setObsDiarias] = useState(() => {
    try {
      const saved = localStorage.getItem(getStoredObsKey(catActual, defaultMicro));
      if (saved) return saved;
    } catch {}
    return '';
  });

  const [copiado, setCopiado] = useState(false);
  const [guardadoMsg, setGuardadoMsg] = useState(false);

  // 2. Catálogo completo de jugadores de la categoría
  const catalog = useMemo(() => buildStaticPlayersCatalog(), []);
  
  const jugadoresCategoria = useMemo(() => {
    const rosterSheet = (data && Array.isArray(data.roster)) ? data.roster : [];
    const catPlayers = catalog.filter(p => p.cats && p.cats.includes(catActual));
    
    const setNombres = new Map();

    // 1. Roster de la planilla oficial
    rosterSheet.forEach(nombreRaw => {
      const clean = String(nombreRaw).trim();
      if (!clean) return;
      setNombres.set(clean.toLowerCase(), clean);
    });

    // 2. Catálogo estático oficial
    catPlayers.forEach(p => {
      const clean = p.displayName.trim();
      const key = clean.toLowerCase();
      if (!setNombres.has(key)) {
        setNombres.set(key, clean);
      }
    });

    return Array.from(setNombres.values()).sort((a, b) => a.localeCompare(b));
  }, [data, catalog, catActual]);

  // 3. Estructura base de asignaciones
  const [asignaciones, setAsignaciones] = useState(() => {
    try {
      const saved = localStorage.getItem(getStoredKey(catActual, defaultMicro));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      gpsNum: i + 1,
      gpsLabel: `GPS ${String(i + 1).padStart(2, '0')}`,
      jugador: ''
    }));
  });

  // Sincronizar al cambiar de categoría o microciclo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getStoredKey(catActual, microciclo));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAsignaciones(parsed);
          setNumChalecos(parsed.length);
        } else {
          resetRows(numChalecos);
        }
      } else {
        resetRows(numChalecos);
      }

      const savedObs = localStorage.getItem(getStoredObsKey(catActual, microciclo));
      setObsDiarias(savedObs || '');

      const savedObj = localStorage.getItem(getStoredObjKey(catActual, microciclo));
      setObjetivoSemana(savedObj || OBJETIVOS_OPCIONES[0]);
    } catch {}
  }, [catActual, microciclo]);

  const resetRows = (count) => {
    setAsignaciones(
      Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        gpsNum: i + 1,
        gpsLabel: `GPS ${String(i + 1).padStart(2, '0')}`,
        jugador: ''
      }))
    );
  };

  // Guardado automático en localStorage
  const autoSave = (list, obsVal = obsDiarias, objVal = objetivoSemana) => {
    try {
      localStorage.setItem(getStoredKey(catActual, microciclo), JSON.stringify(list));
      localStorage.setItem(getStoredObsKey(catActual, microciclo), obsVal || '');
      localStorage.setItem(getStoredObjKey(catActual, microciclo), objVal || '');
      setGuardadoMsg(true);
      setTimeout(() => setGuardadoMsg(false), 1800);
    } catch {}
  };

  // Cambiar selector de cantidad de chalecos (8, 10, 12)
  const handleChangeNumChalecos = (count) => {
    setNumChalecos(count);
    setAsignaciones(prev => {
      if (prev.length === count) return prev;
      let nextList;
      if (prev.length < count) {
        const extra = Array.from({ length: count - prev.length }, (_, idx) => {
          const num = prev.length + idx + 1;
          return {
            id: num,
            gpsNum: num,
            gpsLabel: `GPS ${String(num).padStart(2, '0')}`,
            jugador: ''
          };
        });
        nextList = [...prev, ...extra];
      } else {
        nextList = prev.slice(0, count);
      }
      autoSave(nextList);
      return nextList;
    });
  };

  // Botón "+ Agregar dispositivo"
  const handleAgregarDispositivo = () => {
    setAsignaciones(prev => {
      const num = prev.length + 1;
      const newItem = {
        id: num,
        gpsNum: num,
        gpsLabel: `GPS ${String(num).padStart(2, '0')}`,
        jugador: ''
      };
      const updated = [...prev, newItem];
      setNumChalecos(updated.length);
      autoSave(updated);
      return updated;
    });
  };

  // Modificar jugador de un chaleco
  const handleUpdateJugador = (index, nuevoJugador) => {
    setAsignaciones(prev => {
      const clone = [...prev];
      clone[index] = { ...clone[index], jugador: nuevoJugador };
      autoSave(clone);
      return clone;
    });
  };

  // Actualizar Objetivo del microciclo
  const handleUpdateObjetivo = (val) => {
    setObjetivoSemana(val);
    autoSave(asignaciones, obsDiarias, val);
  };

  // Actualizar Observaciones Diarias
  const handleUpdateObsDiarias = (val) => {
    setObsDiarias(val);
    autoSave(asignaciones, val, objetivoSemana);
  };

  // Insertar tag rápido de día en observaciones
  const handleInsertDiaObs = (diaNombre) => {
    setObsDiarias(prev => {
      const prefix = prev && !prev.endsWith('\n') ? `${prev}\n` : prev;
      const updated = `${prefix}• ${diaNombre}: `;
      autoSave(asignaciones, updated, objetivoSemana);
      return updated;
    });
  };

  // Paso al siguiente microciclo: suma 1 al microciclo y avanza la fecha exactamente 1 semana (7 días)
  const handleSiguienteMicrociclo = () => {
    const nextMicro = microciclo + 1;
    const nextMonday = addWeeksToMonday(fechaSemana, 1);
    
    // Duplicar asignaciones actuales al siguiente microciclo para que no carguen de cero
    try {
      localStorage.setItem(getStoredKey(catActual, nextMicro), JSON.stringify(asignaciones));
      localStorage.setItem(getStoredObjKey(catActual, nextMicro), objetivoSemana);
    } catch {}

    setMicrociclo(nextMicro);
    setFechaSemana(nextMonday);
  };

  // Stepper anterior microciclo (-1 micro y -7 días de fecha)
  const handlePrevMicrociclo = () => {
    if (microciclo <= 1) return;
    const prevMicro = microciclo - 1;
    const prevMonday = addWeeksToMonday(fechaSemana, -1);
    setMicrociclo(prevMicro);
    setFechaSemana(prevMonday);
  };

  // Stepper siguiente microciclo (+1 micro y +7 días de fecha)
  const handleNextMicrociclo = () => {
    const nextMicro = microciclo + 1;
    const nextMonday = addWeeksToMonday(fechaSemana, 1);
    setMicrociclo(nextMicro);
    setFechaSemana(nextMonday);
  };

  // Manejo de cambio manual en fecha (asegura que caiga siempre en lunes)
  const handleChangeFecha = (val) => {
    if (!val) return;
    const mon = getMondayOfDate(val);
    setFechaSemana(mon);
  };

  // Limpiar todas las asignaciones
  const handleLimpiarTodo = () => {
    if (!window.confirm(`¿Querés vaciar las asignaciones de GPS del Microciclo ${microciclo}?`)) return;
    const clean = asignaciones.map(a => ({ ...a, jugador: '' }));
    setAsignaciones(clean);
    setObsDiarias('');
    autoSave(clean, '', objetivoSemana);
  };

  // Copiar del microciclo anterior
  const handleCopiarAnterior = () => {
    const prevMicro = microciclo - 1;
    if (prevMicro < 1) {
      alert('No hay microciclo anterior disponible.');
      return;
    }
    try {
      const savedPrev = localStorage.getItem(getStoredKey(catActual, prevMicro));
      if (savedPrev) {
        const parsed = JSON.parse(savedPrev);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAsignaciones(parsed);
          setNumChalecos(parsed.length);
          autoSave(parsed);
          alert(`¡Listo! Se copiaron los chalecos del Microciclo ${prevMicro}.`);
          return;
        }
      }
    } catch {}
    alert(`No se encontraron asignaciones guardadas para el Microciclo ${prevMicro}.`);
  };

  // Copiar al portapapeles para Google Sheets
  const handleCopiarGoogleSheets = () => {
    let tsv = `Integral Club • FORMATIVAS · ASIGNACIÓN SEMANAL DE GPS\n`;
    tsv += `Categoría: ${catActual} División\tMicrociclo: ${microciclo}\tSemana: ${fechaSemana} (${formatRangeDates(fechaSemana)})\n`;
    tsv += `Objetivo: ${objetivoSemana}\n\n`;
    tsv += `N° GPS\tDispositivo\tFutbolista Asignado\n`;

    asignaciones.forEach(a => {
      tsv += `${a.gpsLabel}\tChaleco ${String(a.gpsNum).padStart(2, '0')}\t${a.jugador || 'Sin Asignar'}\n`;
    });

    if (obsDiarias.trim()) {
      tsv += `\nObservaciones Diarias / Novedades de la semana:\n${obsDiarias.trim()}\n`;
    }

    navigator.clipboard.writeText(tsv).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  // Descargar CSV
  const handleDescargarCSV = () => {
    let csv = `\uFEFFIntegral Club - MAPEO SEMANAL GPS\n`;
    csv += `"Categoría";"${catActual} División";"Microciclo";"${microciclo}";"Semana";"${fechaSemana}"\n`;
    csv += `"Objetivo";"${objetivoSemana}"\n\n`;
    csv += `"N° GPS";"Dispositivo";"Futbolista Asignado"\n`;
    asignaciones.forEach(a => {
      csv += `"${a.gpsLabel}";"Chaleco ${String(a.gpsNum).padStart(2, '0')}";"${a.jugador || ''}"\n`;
    });

    if (obsDiarias.trim()) {
      csv += `\n"Observaciones Diarias";"${obsDiarias.replace(/"/g, '""')}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mapeo_GPS_${catActual}_Microciclo_${microciclo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalAsignados = asignaciones.filter(a => !!a.jugador).length;
  const libres = asignaciones.length - totalAsignados;
  const jugadoresElegidos = asignaciones.map(a => a.jugador).filter(Boolean);
  const duplicados = jugadoresElegidos.filter((item, idx) => jugadoresElegidos.indexOf(item) !== idx);

  return (
    <div className="mapeo-gps-container">
      {/* Vista de Impresión Oficial A4 */}
      <div className="mapeo-print-view">
        <div className="mp-print-header">
          <div className="mp-print-brand">
            <img src="/escudo.png" alt="Integral Club" className="mp-print-logo" />
            <div>
              <h2>Integral Club</h2>
              <p>Fútbol Formativo & Reserva · Monitoreo GPS</p>
            </div>
          </div>
          <div className="mp-print-meta">
            <span className="mp-print-cat">{catActual} División</span>
            <span className="mp-print-micro">Microciclo {microciclo}</span>
            <span className="mp-print-date">Inicio: {fechaSemana}</span>
          </div>
        </div>

        <div style={{ margin: '10px 0 14px', fontSize: '12px', fontWeight: 600 }}>
          <strong>Semana de trabajo:</strong> {formatRangeDates(fechaSemana)} &nbsp;|&nbsp; <strong>Objetivo:</strong> {objetivoSemana}
        </div>

        <table className="mp-print-table">
          <thead>
            <tr>
              <th style={{ width: '140px', textAlign: 'center' }}>CHALECO</th>
              <th>FUTBOLISTA ASIGNADO</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.map((a) => (
              <tr key={a.id}>
                <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{a.gpsLabel}</td>
                <td style={{ fontWeight: 700, fontSize: '14px' }}>{a.jugador || '__________________________________'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {obsDiarias.trim() && (
          <div style={{ marginTop: '14px', padding: '10px', border: '1px solid #000', borderRadius: '4px', fontSize: '11px' }}>
            <strong>Novedades & Cambios Diarios de GPS:</strong>
            <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{obsDiarias.trim()}</p>
          </div>
        )}


      </div>

      {/* Pantalla Interactiva en la Web */}
      <div className="mapeo-web-content">
        {/* Tarjeta de Configuración y Encabezado */}
        <div className="mapeo-header-card">
          <div className="mapeo-title-row">
            <div className="mapeo-badge-cat">
              <Radio size={16} className="mapeo-badge-icon" />
              <span>{catActual} División · Mapeo Semanal de GPS</span>
            </div>
            {guardadoMsg && (
              <span className="mapeo-save-toast">
                <CheckCircle2 size={14} /> Guardado automáticamente
              </span>
            )}
          </div>

          <div className="mapeo-controls-row">
            {/* Selector de Microciclo */}
            <div className="mapeo-control-group">
              <label>Microciclo:</label>
              <div className="mapeo-stepper-wrap">
                <div className="mapeo-stepper">
                  <button 
                    type="button"
                    className="btn-stepper"
                    onClick={handlePrevMicrociclo}
                    title="Microciclo anterior (-1 semana)"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <input 
                    type="number"
                    min="1"
                    max="52"
                    value={microciclo}
                    onChange={(e) => setMicrociclo(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="input-micro-number"
                  />
                  <button 
                    type="button"
                    className="btn-stepper"
                    onClick={handleNextMicrociclo}
                    title="Siguiente microciclo (+1 semana)"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-siguiente-micro"
                  onClick={handleSiguienteMicrociclo}
                  title="Avanzar automáticamente al siguiente microciclo, sumando 7 días y manteniendo los futbolistas actuales"
                >
                  <Plus size={14} />
                  <span>+ Siguiente Semana</span>
                </button>
              </div>
            </div>

            {/* Fecha de inicio (Lunes garantizado) */}
            <div className="mapeo-control-group">
              <label>Fecha de inicio (Lunes):</label>
              <div className="mapeo-input-wrap">
                <Calendar size={15} />
                <input 
                  type="date"
                  value={fechaSemana}
                  onChange={(e) => handleChangeFecha(e.target.value)}
                />
              </div>
              <span className="mapeo-sub-range">{formatRangeDates(fechaSemana)}</span>
            </div>

            {/* GPS a utilizar: 8, 10, 12 + Botón Agregar Dispositivo */}
            <div className="mapeo-control-group">
              <label>GPS a utilizar:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={numChalecos}
                  onChange={(e) => handleChangeNumChalecos(parseInt(e.target.value, 10))}
                  className="select-chalecos-count"
                >
                  <option value="8">8 chalecos</option>
                  <option value="10">10 chalecos</option>
                  <option value="12">12 chalecos</option>
                  {![8, 10, 12].includes(numChalecos) && (
                    <option value={numChalecos}>{numChalecos} chalecos</option>
                  )}
                </select>

                <button
                  type="button"
                  className="btn-agregar-disp"
                  onClick={handleAgregarDispositivo}
                  title="Agregar un chaleco GPS adicional a la lista"
                >
                  <Plus size={14} />
                  <span>+ Agregar dispositivo</span>
                </button>
              </div>
            </div>

            {/* Objetivo / Días del microciclo (POR FUERA DE LA TABLA) */}
            <div className="mapeo-control-group mapeo-group-full">
              <label>Días / Objetivo del microciclo:</label>
              <select
                className="select-objetivo-semanal"
                value={objetivoSemana}
                onChange={(e) => handleUpdateObjetivo(e.target.value)}
              >
                {OBJETIVOS_OPCIONES.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Barra de Acciones */}
          <div className="mapeo-actions-bar">
            <button
              type="button"
              className={`btn-mapeo-action ${copiado ? 'copiado' : ''}`}
              onClick={handleCopiarGoogleSheets}
              title="Copiar datos al portapapeles para pegar en Google Sheets con Ctrl+V"
            >
              {copiado ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiado ? '¡Copiado para Google Sheets!' : 'Copiar para Sheets'}</span>
            </button>

            <button
              type="button"
              className="btn-mapeo-action"
              onClick={handleDescargarCSV}
              title="Descargar archivo CSV"
            >
              <Download size={15} />
              <span>Descargar CSV</span>
            </button>

            <button
              type="button"
              className="btn-mapeo-action"
              onClick={handleCopiarAnterior}
              title="Copiar asignaciones del microciclo anterior"
            >
              <RotateCcw size={15} />
              <span>Copiar de Microciclo {microciclo - 1}</span>
            </button>

            <button
              type="button"
              className="btn-mapeo-action btn-imprimir"
              onClick={() => window.print()}
              title="Imprimir planilla de vestuario en tamaño A4"
            >
              <Printer size={15} />
              <span>Imprimir Ficha Vestuario (A4)</span>
            </button>

            <button
              type="button"
              className="btn-mapeo-action btn-danger"
              onClick={handleLimpiarTodo}
              title="Vaciar las asignaciones actuales de este microciclo"
            >
              <Trash2 size={15} />
              <span>Vaciar</span>
            </button>
          </div>

          {/* Alerta de jugador duplicado */}
          {duplicados.length > 0 && (
            <div className="mapeo-warning-box">
              <AlertCircle size={16} />
              <span>
                <strong>Atención:</strong> Asignaste a <strong>{duplicados[0]}</strong> en más de un chaleco GPS a la vez.
              </span>
            </div>
          )}
        </div>

        {/* Tabla Simplificada de Asignación */}
        <div className="mapeo-table-card">
          <div className="mapeo-table-header">
            <h3>Cuadrícula de Asignación de Chalecos GPS</h3>
            <div className="mapeo-status-pills">
              <span className="pill-status asignados">
                <CheckCircle2 size={12} /> {totalAsignados} / {numChalecos} asignados
              </span>
              {libres > 0 && (
                <span className="pill-status libres">
                  {libres} libre{libres > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="mapeo-table-responsive">
            <table className="mapeo-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '120px', textAlign: 'center' }}>Chaleco</th>
                  <th>Futbolista Asignado ({catActual} División)</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Quitar</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((a, idx) => {
                  const isAssigned = !!a.jugador;
                  return (
                    <tr key={a.id} className={isAssigned ? 'row-assigned' : 'row-empty'}>
                      {/* Número de Chaleco */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="badge-gps-number">
                          <Radio size={12} />
                          <span>{a.gpsLabel}</span>
                        </div>
                      </td>

                      {/* Futbolista Asignado: en negrita, sin cursiva, sin "JUGADOR DE CAMPO", sin puesto */}
                      <td>
                        <select
                          className="select-jugador-gps"
                          value={a.jugador}
                          onChange={(e) => handleUpdateJugador(idx, e.target.value)}
                        >
                          <option value="">-- Seleccionar futbolista --</option>
                          {jugadoresCategoria.map(nombre => (
                            <option key={nombre} value={nombre}>
                              {nombre}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quitar asignación */}
                      <td style={{ textAlign: 'center' }}>
                        {a.jugador && (
                          <button
                            type="button"
                            className="btn-row-clear"
                            onClick={() => handleUpdateJugador(idx, '')}
                            title="Quitar jugador de este GPS"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección de Observaciones Diarias & Cambios de GPS */}
        <div className="mapeo-obs-card">
          <div className="mapeo-obs-header">
            <div className="mapeo-obs-title-wrap">
              <FileText size={18} className="mapeo-obs-icon" />
              <div>
                <h4>Observaciones Diarias & Cambios de GPS</h4>
                <p className="mapeo-obs-sub">
                  Registrá acá si en algún día específico se cambió un chaleco, no prendió un GPS o se lo pasó a otro jugador, para saber los nombres exactos al descargar Catapult.
                </p>
              </div>
            </div>

            <div className="mapeo-obs-quick-tags">
              <span className="quick-tag-label">Insertar día:</span>
              {['Lunes (MD+2)', 'Martes (MD-4)', 'Miércoles (MD-3)', 'Jueves (MD-2)', 'Viernes (MD-1)', 'Sábado (MD)'].map(d => (
                <button
                  key={d}
                  type="button"
                  className="btn-quick-dia"
                  onClick={() => handleInsertDiaObs(d)}
                  title={`Insertar encabezado para ${d}`}
                >
                  {d.replace(' (', ' ').replace(')', '')}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="textarea-obs-diarias"
            rows={4}
            placeholder={`Ejemplos:\n• Lunes (MD+2): GPS 02 lo usó Martinez para compensación.\n• Martes (MD-4): GPS 03 no encendió batería, se le dio GPS 11 a Perez.\n• Jueves (MD-2): GPS 07 se lo pasó a Gonzalez en el 2do bloque táctico.`}
            value={obsDiarias}
            onChange={(e) => handleUpdateObsDiarias(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
