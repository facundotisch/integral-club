import React, { useState, useMemo } from 'react';
import { 
  Users, AlertTriangle, CheckCircle2, ShieldAlert, 
  Search, Download, RefreshCw, Copy, Check, ExternalLink,
  Calendar, ArrowLeft, PlusCircle, Trash2, X, UserCheck, 
  Pencil, UserX, MessageSquare, AlertCircle
} from 'lucide-react';
import { buildStaticPlayersCatalog } from '../../../data/jugadoresIndex';

export const getFechaSimple = (fechaStr, timestamp) => {
  if (fechaStr && typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    const [y, m, d] = fechaStr.split('-');
    return `${d}/${m}/${y}`;
  }
  if (fechaStr && typeof fechaStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
    return fechaStr;
  }
  const dateObj = timestamp ? new Date(timestamp) : (fechaStr && fechaStr !== 'Hoy' ? new Date(fechaStr) : new Date());
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const CATEGORIAS = ['Todas', 'Reserva', 'Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena'];

const ZONAS_COMUNES = [
  'Pubis / Ingle',
  'Isquiotibial Der.',
  'Isquiotibial Izq.',
  'Aductor Der.',
  'Aductor Izq.',
  'Cuádriceps Der.',
  'Cuádriceps Izq.',
  'Gemelo Der.',
  'Gemelo Izq.',
  'Zona Lumbar',
  'Rodilla Der.',
  'Rodilla Izq.',
  'Tobillo Der.',
  'Tobillo Izq.'
];

const MOCK_ADMIN_RECORDS = [
  {
    id: 'well_demo_1',
    fecha: new Date().toISOString().split('T')[0],
    fechaTexto: getFechaSimple(new Date().toISOString().split('T')[0]),
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    jugador: {
      nombre: 'Jugador 1',
      categoria: 'Reserva',
      posicion: 'Defensor Central',
      foto: null
    },
    metricas: { descanso: 1, fatiga: 2, estres: 1, energia: 0, dolor: 0 },
    zonasDolor: [],
    observaciones: 'Descansé perfecto, listo para la práctica.'
  },
  {
    id: 'well_demo_2',
    fecha: new Date().toISOString().split('T')[0],
    fechaTexto: getFechaSimple(new Date().toISOString().split('T')[0]),
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    jugador: {
      nombre: 'Jugador 2',
      categoria: 'Cuarta',
      posicion: 'Volante Mixto',
      foto: null
    },
    metricas: { descanso: 6, fatiga: 7, estres: 4, energia: 6, dolor: 7 },
    zonasDolor: ['Isquiotibial Der.', 'Aductor Der.'],
    observaciones: 'Molestia en el posterior derecho desde el reducido de ayer.'
  },
  {
    id: 'well_demo_3',
    fecha: new Date().toISOString().split('T')[0],
    fechaTexto: getFechaSimple(new Date().toISOString().split('T')[0]),
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    jugador: {
      nombre: 'Jugador 3',
      categoria: 'Séptima',
      posicion: 'Jugador de Campo',
      foto: null
    },
    metricas: { descanso: 2, fatiga: 3, estres: 2, energia: 1, dolor: 1 },
    zonasDolor: [],
    observaciones: ''
  },
  {
    id: 'well_demo_4',
    fecha: new Date().toISOString().split('T')[0],
    fechaTexto: getFechaSimple(new Date().toISOString().split('T')[0]),
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    jugador: {
      nombre: 'Jugador 4',
      categoria: 'Novena',
      posicion: 'Delantero',
      foto: null
    },
    metricas: { descanso: 4, fatiga: 5, estres: 3, energia: 4, dolor: 5 },
    zonasDolor: ['Pubis / Ingle'],
    observaciones: 'Molestia en la zona púbica al patear.'
  },
  {
    id: 'well_demo_5',
    fecha: new Date().toISOString().split('T')[0],
    fechaTexto: getFechaSimple(new Date().toISOString().split('T')[0]),
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    jugador: {
      nombre: 'Jugador 5',
      categoria: 'Cuarta',
      posicion: 'Defensor Central',
      foto: null
    },
    metricas: { descanso: 0, fatiga: 1, estres: 0, energia: 0, dolor: 0 },
    zonasDolor: [],
    observaciones: 'Optimo.'
  }
];

export default function WellnessAdminPanel({ onVolverCuestionario }) {
  const catalog = useMemo(() => buildStaticPlayersCatalog(), []);

  // Fecha de hoy en formato simple DD/MM/AAAA (ej: 16/11/2026)
  const hoyISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const fechaHoyStr = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const [registros, setRegistros] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('integral_wellness_records') || '[]');
      if (saved && saved.length > 0) return saved;
    } catch {}
    return MOCK_ADMIN_RECORDS;
  });

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('hoy'); // 'hoy' | 'todas' | string YYYY-MM-DD
  const [catFiltro, setCatFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [vistaEstado, setVistaEstado] = useState('todos'); // 'todos' | 'respondieron' | 'pendientes'
  const [copiado, setCopiado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Estado para el formulario de carga/edición manual rápida
  const [mostrarFormManual, setMostrarFormManual] = useState(false);
  const [registroEditandoId, setRegistroEditandoId] = useState(null);
  const [manualFecha, setManualFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualNombre, setManualNombre] = useState('');
  const [manualCat, setManualCat] = useState('Reserva');
  const [manualPos, setManualPos] = useState('Jugador de Campo');
  const [manualDescanso, setManualDescanso] = useState(0);
  const [manualFatiga, setManualFatiga] = useState(0);
  const [manualEstres, setManualEstres] = useState(0);
  const [manualEnergia, setManualEnergia] = useState(0);
  const [manualDolor, setManualDolor] = useState(0);
  const [manualZonas, setManualZonas] = useState([]);
  const [manualObs, setManualObs] = useState('');
  const [sugerencias, setSugerencias] = useState([]);

  // Filtrado de sugerencias de jugadores al tipear
  const handleNombreChange = (val) => {
    setManualNombre(val);
    if (!val || val.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    const q = val.toLowerCase().trim();
    const matches = catalog.filter(p => p.displayName.toLowerCase().includes(q) || (p.searchStr && p.searchStr.includes(q))).slice(0, 5);
    setSugerencias(matches);
  };

  const handleSelectSugerencia = (jugador) => {
    setManualNombre(jugador.displayName);
    if (jugador.primaryCat) setManualCat(jugador.primaryCat);
    if (jugador.pos) setManualPos(jugador.pos);
    setSugerencias([]);
  };

  // Resetear todo a 0 (Óptimo)
  const handleSetTodoOptimo = () => {
    setManualDescanso(0);
    setManualFatiga(0);
    setManualEstres(0);
    setManualEnergia(0);
    setManualDolor(0);
    setManualZonas([]);
  };

  const handleToggleZonaManual = (zona) => {
    setManualZonas(prev => 
      prev.includes(zona) ? prev.filter(z => z !== zona) : [...prev, zona]
    );
  };

  // Abrir formulario para un jugador pendiente que no respondió
  const handleIniciarCargaPendiente = (jugador) => {
    setRegistroEditandoId(null);
    setManualFecha(filtroFecha === 'hoy' || filtroFecha === 'todas' ? hoyISO : filtroFecha);
    setManualNombre(jugador.displayName);
    setManualCat(jugador.primaryCat || 'Reserva');
    setManualPos(jugador.pos || 'Jugador de Campo');
    handleSetTodoOptimo();
    setManualObs('');
    setMostrarFormManual(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Abrir formulario para EDITAR un registro existente
  const handleIniciarEdicion = (registro) => {
    setRegistroEditandoId(registro.id);
    setManualFecha(registro.fecha || hoyISO);
    setManualNombre(registro.jugador.nombre);
    setManualCat(registro.jugador.categoria || 'Reserva');
    setManualPos(registro.jugador.posicion || 'Jugador de Campo');
    setManualDescanso(registro.metricas.descanso || 0);
    setManualFatiga(registro.metricas.fatiga || 0);
    setManualEstres(registro.metricas.estres || 0);
    setManualEnergia(registro.metricas.energia || 0);
    setManualDolor(registro.metricas.dolor || 0);
    setManualZonas(registro.zonasDolor || []);
    setManualObs(registro.observaciones || '');
    setMostrarFormManual(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Eliminar un registro
  const handleEliminarRegistro = (id, nombre) => {
    if (window.confirm(`¿Seguro que querés eliminar la evaluación de ${nombre}?`)) {
      const updated = registros.filter(r => r.id !== id);
      setRegistros(updated);
      try {
        localStorage.setItem('integral_wellness_records', JSON.stringify(updated));
      } catch {}
      setMensajeExito(`Evaluación de ${nombre} eliminada.`);
      setTimeout(() => setMensajeExito(''), 3000);
    }
  };

  // Guardar Evaluación Manual o Edición
  const handleGuardarManual = (e) => {
    e.preventDefault();
    const nombreLimpio = manualNombre.trim();
    if (!nombreLimpio) {
      alert('Por favor ingresá o seleccioná el nombre del jugador.');
      return;
    }

    const matchedCatalog = catalog.find(p => p.displayName.toLowerCase() === nombreLimpio.toLowerCase());
    const totalHooper = manualDescanso + manualFatiga + manualEstres + manualEnergia + manualDolor;

    if (registroEditandoId) {
      // MODO EDICIÓN: Actualizar registro existente
      const updated = registros.map(r => {
        if (r.id === registroEditandoId) {
          return {
            ...r,
            fecha: manualFecha,
            fechaTexto: getFechaSimple(manualFecha),
            jugador: {
              ...r.jugador,
              nombre: matchedCatalog ? matchedCatalog.displayName : nombreLimpio,
              categoria: manualCat,
              posicion: matchedCatalog ? matchedCatalog.pos : manualPos,
              foto: matchedCatalog ? matchedCatalog.photoUrl : r.jugador.foto
            },
            metricas: {
              descanso: manualDescanso,
              fatiga: manualFatiga,
              estres: manualEstres,
              energia: manualEnergia,
              dolor: manualDolor
            },
            totalHooper,
            zonasDolor: manualZonas,
            observaciones: manualObs.trim()
          };
        }
        return r;
      });

      setRegistros(updated);
      try {
        localStorage.setItem('integral_wellness_records', JSON.stringify(updated));
      } catch {}

      setMensajeExito(`Evaluación de ${nombreLimpio} modificada exitosamente.`);
    } else {
      // MODO NUEVO: Insertar nuevo registro
      const nuevoRegistro = {
        id: `manual_${Date.now()}`,
        fecha: manualFecha,
        fechaTexto: getFechaSimple(manualFecha),
        timestamp: new Date().toISOString(),
        jugador: {
          nombre: matchedCatalog ? matchedCatalog.displayName : nombreLimpio,
          categoria: manualCat,
          posicion: matchedCatalog ? matchedCatalog.pos : manualPos,
          foto: matchedCatalog ? matchedCatalog.photoUrl : null
        },
        metricas: {
          descanso: manualDescanso,
          fatiga: manualFatiga,
          estres: manualEstres,
          energia: manualEnergia,
          dolor: manualDolor
        },
        totalHooper,
        zonasDolor: manualZonas,
        observaciones: manualObs.trim() ? `${manualObs.trim()} (Carga manual DT)` : 'Carga manual DT'
      };

      const updated = [nuevoRegistro, ...registros];
      setRegistros(updated);
      try {
        localStorage.setItem('integral_wellness_records', JSON.stringify(updated.slice(0, 200)));
      } catch {}

      setMensajeExito(`Evaluación de ${nuevoRegistro.jugador.nombre} registrada correctamente para ${manualFecha}.`);
    }

    // Limpiar form
    setRegistroEditandoId(null);
    setManualNombre('');
    handleSetTodoOptimo();
    setManualObs('');
    setMostrarFormManual(false);

    setTimeout(() => setMensajeExito(''), 3500);
  };

  // Recordar por WhatsApp al jugador que no contestó
  const handleRecordarWhatsApp = (jugador) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dashboard-integral-v3.vercel.app';
    const link = `${origin}/wellness`;
    const msg = `Hola ${jugador.displayName}, recordá completar el control de wellness de Integral Club de hoy:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Guardar cambios si se agregan o limpian
  const handleCargarDemo = () => {
    try {
      localStorage.setItem('integral_wellness_records', JSON.stringify(MOCK_ADMIN_RECORDS));
    } catch {}
    setRegistros(MOCK_ADMIN_RECORDS);
    setMensajeExito('Datos demo de hoy cargados correctamente.');
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const handleLimpiarRegistros = () => {
    if (window.confirm('¿Seguro que querés limpiar los registros locales de prueba?')) {
      try {
        localStorage.removeItem('integral_wellness_records');
      } catch {}
      setRegistros([]);
    }
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dashboard-integral-v3.vercel.app';
    const link = `${origin}/wellness`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } else {
      prompt('Copiá este enlace para enviar a los futbolistas:', link);
    }
  };

  // 1. Registros en la fecha seleccionada
  const registrosEnFecha = useMemo(() => {
    return registros.filter(r => {
      if (filtroFecha === 'hoy') {
        return r.fecha === hoyISO || r.fechaTexto === 'Hoy' || r.fechaTexto === fechaHoyStr;
      }
      if (filtroFecha === 'todas') {
        return true;
      }
      return r.fecha === filtroFecha;
    });
  }, [registros, filtroFecha, hoyISO]);

  // Set de nombres que ya respondieron en la fecha
  const nombresQueRespondieron = useMemo(() => {
    return new Set(registrosEnFecha.map(r => r.jugador.nombre.toLowerCase().trim()));
  }, [registrosEnFecha]);

  // Jugadores del plantel completo para la categoría seleccionada
  const jugadoresPlantel = useMemo(() => {
    if (catFiltro === 'Todas') {
      return catalog;
    }
    return catalog.filter(p => p.cats.includes(catFiltro) || p.primaryCat === catFiltro);
  }, [catalog, catFiltro]);

  // Jugadores que NO respondieron en la fecha
  const jugadoresPendientes = useMemo(() => {
    return jugadoresPlantel.filter(p => {
      const yaRespondio = nombresQueRespondieron.has(p.displayName.toLowerCase().trim());
      const matchBusqueda = !busqueda || p.displayName.toLowerCase().includes(busqueda.toLowerCase().trim());
      return !yaRespondio && matchBusqueda;
    });
  }, [jugadoresPlantel, nombresQueRespondieron, busqueda]);

  // Registros de los que SÍ respondieron (filtrados por categoría y búsqueda)
  const registrosRespondieronFiltrados = useMemo(() => {
    return registrosEnFecha.filter(r => {
      const matchCat = catFiltro === 'Todas' || r.jugador.categoria === catFiltro;
      const matchSearch = !busqueda || 
        r.jugador.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()) ||
        (r.zonasDolor && r.zonasDolor.some(z => z.toLowerCase().includes(busqueda.toLowerCase().trim())));
      return matchCat && matchSearch;
    });
  }, [registrosEnFecha, catFiltro, busqueda]);

  // Semáforo y Métricas
  const stats = useMemo(() => {
    let opt = 0;
    let mod = 0;
    let crit = 0;
    let conDolor = 0;

    registrosRespondieronFiltrados.forEach(r => {
      const total = r.metricas.descanso + r.metricas.fatiga + r.metricas.estres + r.metricas.energia + r.metricas.dolor;
      const tieneZonas = r.zonasDolor && r.zonasDolor.length > 0;
      if (tieneZonas || r.metricas.dolor >= 4) conDolor++;

      if (total >= 23 || r.metricas.dolor >= 6) {
        crit++;
      } else if (total >= 11 || r.metricas.fatiga >= 5) {
        mod++;
      } else {
        opt++;
      }
    });

    return { 
      totalRespondieron: registrosRespondieronFiltrados.length, 
      totalPendientes: jugadoresPendientes.length,
      opt, 
      mod, 
      crit, 
      conDolor 
    };
  }, [registrosRespondieronFiltrados, jugadoresPendientes]);

  const handleExportCSV = () => {
    if (registrosRespondieronFiltrados.length === 0) {
      alert('No hay registros cargados para exportar en esta fecha.');
      return;
    }
    const headers = ['Fecha', 'Jugador', 'Categoria', 'Posicion', 'Descanso(0-10)', 'Fatiga(0-10)', 'Estres(0-10)', 'Energia(0-10)', 'Dolor(0-10)', 'ScoreTotalHooper', 'ZonasDolor', 'Observaciones'];
    const rows = registrosRespondieronFiltrados.map(r => [
      `"${getFechaSimple(r.fecha, r.timestamp)}"`,
      `"${r.jugador.nombre}"`,
      `"${r.jugador.categoria}"`,
      `"${r.jugador.posicion || ''}"`,
      r.metricas.descanso,
      r.metricas.fatiga,
      r.metricas.estres,
      r.metricas.energia,
      r.metricas.dolor,
      (r.metricas.descanso + r.metricas.fatiga + r.metricas.estres + r.metricas.energia + r.metricas.dolor),
      `"${(r.zonasDolor || []).join('; ')}"`,
      `"${(r.observaciones || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wellness_integral_${filtroFecha === 'hoy' ? hoyISO : filtroFecha}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getMetricColor = (val) => {
    if (val <= 2) return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    if (val <= 4) return { bg: '#f7fee7', text: '#65a30d', border: '#d9f99d' };
    if (val <= 6) return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    if (val <= 7) return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
    return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
  };

  const getHooperBadge = (total, dolorMax) => {
    if (total >= 23 || dolorMax >= 6) {
      return { label: 'Alerta Roja', bg: '#fee2e2', text: '#b91c1c', border: '#f87171' };
    }
    if (total >= 11 || dolorMax >= 4) {
      return { label: 'Atención', bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
    }
    return { label: 'Óptimo', bg: '#ecfdf5', text: '#059669', border: '#6ee7b7' };
  };

  const renderNumberSelector = (label, value, onChange) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text, #0f172a)' }}>
          <span>{label}</span>
          <span style={{ color: value <= 2 ? '#059669' : value <= 5 ? '#d97706' : '#dc2626', fontWeight: 800 }}>
            {value} / 10
          </span>
        </div>
        <div style={{ display: 'flex', gap: '3px', width: '100%' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
            const isSel = n === value;
            const col = getMetricColor(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  fontSize: '11px',
                  fontWeight: isSel ? 900 : 600,
                  borderRadius: '6px',
                  border: isSel ? `2px solid ${col.text}` : '1px solid var(--border-color, #cbd5e1)',
                  background: isSel ? col.bg : 'var(--btn-bg, #f8fafc)',
                  color: isSel ? col.text : 'var(--text-muted, #475569)',
                  cursor: 'pointer'
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="wellness-admin-container" style={{
      width: '100%',
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '16px 14px 60px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-body, "Inter", sans-serif)'
    }}>
      {/* Mensaje de Confirmación */}
      {mensajeExito && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '10px 16px',
          borderRadius: '12px',
          marginBottom: '14px',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* 1. Header Oficial con Fecha y Botones de Acción */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px',
        background: 'var(--card, #ffffff)',
        padding: '14px 18px',
        borderRadius: '16px',
        border: '1px solid var(--border-color, #e2e8f0)',
        boxShadow: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onVolverCuestionario && (
            <button
              type="button"
              onClick={onVolverCuestionario}
              style={{
                background: 'var(--btn-bg, #f1f5f9)',
                border: '1px solid var(--border-color, #cbd5e1)',
                padding: '7px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text, #0f172a)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={15} />
              <span>Cuestionario Jugador</span>
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: 'var(--text, #0f172a)' }}>
                Panel DT & PF · Control de Wellness
              </h1>
              <span style={{
                background: '#2a3b60',
                color: '#fff',
                fontSize: '10.5px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '8px'
              }}>
                ADMIN
              </span>
            </div>
            
            {/* FECHA DEL DÍA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <Calendar size={13} color="#2a3b60" />
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#2a3b60' }}>
                {fechaHoyStr}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* BOTÓN CARGA MANUAL RÁPIDA */}
          <button
            type="button"
            onClick={() => {
              if (mostrarFormManual) {
                setMostrarFormManual(false);
                setRegistroEditandoId(null);
              } else {
                setRegistroEditandoId(null);
                setManualNombre('');
                handleSetTodoOptimo();
                setMostrarFormManual(true);
              }
            }}
            style={{
              background: mostrarFormManual ? '#0f172a' : '#2a3b60',
              border: 'none',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {mostrarFormManual ? <X size={15} /> : <PlusCircle size={15} />}
            <span>{mostrarFormManual ? 'Cerrar Formulario' : 'Cargar Evaluación Manual'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '7px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copiado ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
            <span>{copiado ? 'Copiado' : 'Copiar Link Celular'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              background: 'var(--btn-bg, #f1f5f9)',
              border: '1px solid var(--border-color, #cbd5e1)',
              color: 'var(--text, #0f172a)',
              padding: '7px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 2. FORMULARIO DE CARGA / EDICIÓN MANUAL */}
      {mostrarFormManual && (
        <form onSubmit={handleGuardarManual} style={{
          background: 'var(--card, #ffffff)',
          border: registroEditandoId ? '2px solid #f59e0b' : '2px solid #2a3b60',
          borderRadius: '16px',
          padding: '18px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: registroEditandoId ? '#d97706' : '#2a3b60' }}>
                  {registroEditandoId ? `Modificar Evaluación: ${manualNombre}` : 'Nueva Evaluación Manual Rápida'}
                </h2>
                {registroEditandoId && (
                  <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                    MODO EDICIÓN
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted, #64748b)', margin: '3px 0 0' }}>
                {registroEditandoId ? 'Ajustá los valores o zonas de molestia guardadas para este futbolista.' : 'Registrá el reporte de un futbolista en segundos (0 = Óptimo, 10 = Alerta).'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSetTodoOptimo}
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#059669',
                fontSize: '11.5px',
                fontWeight: 800,
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Resetear Todo en 0 (Óptimo)
            </button>
          </div>

          {/* Selección de Fecha, Jugador y Categoría */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {/* Selector de Fecha */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', color: 'var(--text)' }}>
                Fecha de la Evaluación
              </label>
              <input
                type="date"
                value={manualFecha}
                onChange={(e) => setManualFecha(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text, #0f172a)'
                }}
                required
              />
            </div>

            {/* Nombre del Jugador */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', color: 'var(--text)' }}>
                Nombre del Jugador
              </label>
              <input
                type="text"
                value={manualNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Escribí apellido o seleccioná..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text, #0f172a)'
                }}
                required
              />
              {sugerencias.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--card, #ffffff)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: '10px',
                  marginTop: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  overflow: 'hidden'
                }}>
                  {sugerencias.map((s) => (
                    <div
                      key={s.displayName}
                      onClick={() => handleSelectSugerencia(s)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontWeight: 800 }}>{s.displayName}</span>
                      <span style={{ color: '#2a3b60', fontSize: '11px' }}>{s.primaryCat} · {s.pos}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, marginBottom: '4px', color: 'var(--text)' }}>
                Categoría / División
              </label>
              <select
                value={manualCat}
                onChange={(e) => setManualCat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text, #0f172a)'
                }}
              >
                {CATEGORIAS.filter(c => c !== 'Todas').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filas de Métricas Rápidas 0 a 10 */}
          <div style={{
            background: 'var(--btn-bg, #f8fafc)',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {renderNumberSelector('1. Descanso', manualDescanso, setManualDescanso)}
            {renderNumberSelector('2. Fatiga', manualFatiga, setManualFatiga)}
            {renderNumberSelector('3. Estrés', manualEstres, setManualEstres)}
            {renderNumberSelector('4. Falta de Energía', manualEnergia, setManualEnergia)}
            {renderNumberSelector('5. Dolor Muscular', manualDolor, setManualDolor)}
          </div>

          {/* Zonas de Molestias Físicas Rápidas */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, marginBottom: '6px', color: 'var(--text)' }}>
              Zonas de Molestia Muscular (Tocar para marcar):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ZONAS_COMUNES.map(zona => {
                const marcada = manualZonas.includes(zona);
                return (
                  <button
                    key={zona}
                    type="button"
                    onClick={() => handleToggleZonaManual(zona)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: marcada ? 800 : 600,
                      background: marcada ? '#fee2e2' : 'var(--btn-bg, #f1f5f9)',
                      color: marcada ? '#b91c1c' : 'var(--text-muted, #475569)',
                      border: marcada ? '1px solid #f87171' : '1px solid var(--border-color, #cbd5e1)',
                      cursor: 'pointer'
                    }}
                  >
                    {zona}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <input
              type="text"
              value={manualObs}
              onChange={(e) => setManualObs(e.target.value)}
              placeholder="Aclaración u observación breve del jugador (opcional)..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '12.5px',
                boxSizing: 'border-box',
                outline: 'none',
                background: 'var(--input-bg, #ffffff)',
                color: 'var(--text, #0f172a)'
              }}
            />
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setMostrarFormManual(false);
                setRegistroEditandoId(null);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color, #cbd5e1)',
                color: 'var(--text, #0f172a)',
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                background: registroEditandoId ? '#d97706' : '#2a3b60',
                border: 'none',
                color: '#ffffff',
                padding: '9px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserCheck size={16} />
              <span>{registroEditandoId ? 'Guardar Cambios' : 'Guardar Evaluación'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Tarjetas KPI de Resumen (Conteo de Respondieron vs Pendientes) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Respondieron */}
        <div 
          onClick={() => setVistaEstado('respondieron')}
          style={{
            background: 'var(--card, #ffffff)',
            border: vistaEstado === 'respondieron' ? '2px solid #2a3b60' : '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '14px',
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#2a3b60', fontWeight: 800, textTransform: 'uppercase' }}>
            Completaron
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#2a3b60', marginTop: '4px' }}>
            {stats.totalRespondieron}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
            Evaluaciones enviadas
          </div>
        </div>

        {/* Sin Responder (Pendientes) - DESTACADO */}
        <div 
          onClick={() => setVistaEstado('pendientes')}
          style={{
            background: 'var(--card, #ffffff)',
            border: vistaEstado === 'pendientes' ? '2px solid #ef4444' : '1.5px solid #fecaca',
            borderRadius: '14px',
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase' }}>
              Sin Responder
            </span>
            {stats.totalPendientes > 0 && (
              <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', padding: '1px 6px', borderRadius: '6px', fontWeight: 800 }}>
                PENDIENTES
              </span>
            )}
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: stats.totalPendientes > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
            {stats.totalPendientes}
          </div>
          <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
            Faltan responder hoy
          </div>
        </div>

        {/* Zona Verde */}
        <div style={{
          background: 'var(--card, #ffffff)',
          border: '1px solid #a7f3d0',
          borderRadius: '14px',
          padding: '14px 16px'
        }}>
          <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>
            Óptimo (Zona Verde)
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
            {stats.opt}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
            0 a 10 Hooper total
          </div>
        </div>

        {/* Alerta Roja o Molestias */}
        <div style={{
          background: 'var(--card, #ffffff)',
          border: '1px solid #fecaca',
          borderRadius: '14px',
          padding: '14px 16px'
        }}>
          <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase' }}>
            Alerta Roja / Molestias
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#ef4444', marginTop: '4px' }}>
            {stats.crit + stats.conDolor}
          </div>
          <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px' }}>
            {stats.conDolor} con zona señalada
          </div>
        </div>
      </div>

      {/* 4. Filtros Combinados: Fecha + Categoría + Búsqueda + Estado (Respondieron vs Pendientes) */}
      <div style={{
        background: 'var(--card, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        {/* Barra de Filtro de Fechas */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          paddingBottom: '12px',
          marginBottom: '12px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)'
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--muted, #64748b)', textTransform: 'uppercase' }}>
            Filtrar Fecha:
          </span>

          <button
            type="button"
            onClick={() => setFiltroFecha('hoy')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: filtroFecha === 'hoy' ? 800 : 600,
              background: filtroFecha === 'hoy' ? '#2a3b60' : 'var(--btn-bg, #f1f5f9)',
              color: filtroFecha === 'hoy' ? '#ffffff' : 'var(--text-muted, #475569)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reportes de Hoy
          </button>

          <button
            type="button"
            onClick={() => setFiltroFecha('todas')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: filtroFecha === 'todas' ? 800 : 600,
              background: filtroFecha === 'todas' ? '#2a3b60' : 'var(--btn-bg, #f1f5f9)',
              color: filtroFecha === 'todas' ? '#ffffff' : 'var(--text-muted, #475569)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Historial Completo
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <Calendar size={13} color="#64748b" />
            <input
              type="date"
              value={filtroFecha === 'hoy' ? hoyISO : filtroFecha === 'todas' ? '' : filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value || 'todas')}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '11.5px',
                outline: 'none',
                background: 'var(--input-bg, #ffffff)',
                color: 'var(--text, #0f172a)'
              }}
            />
          </div>
        </div>

        {/* Barra de Filtro de Estado: Respondieron vs Pendientes */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          paddingBottom: '12px',
          marginBottom: '12px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)'
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--muted, #64748b)', textTransform: 'uppercase' }}>
            Ver Plantel:
          </span>

          <button
            type="button"
            onClick={() => setVistaEstado('todos')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: vistaEstado === 'todos' ? 800 : 600,
              background: vistaEstado === 'todos' ? '#0f172a' : 'var(--btn-bg, #f1f5f9)',
              color: vistaEstado === 'todos' ? '#ffffff' : 'var(--text-muted, #475569)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Todos ({stats.totalRespondieron + stats.totalPendientes})
          </button>

          <button
            type="button"
            onClick={() => setVistaEstado('respondieron')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: vistaEstado === 'respondieron' ? 800 : 600,
              background: vistaEstado === 'respondieron' ? '#2a3b60' : 'var(--btn-bg, #f1f5f9)',
              color: vistaEstado === 'respondieron' ? '#ffffff' : 'var(--text-muted, #475569)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Completaron ({stats.totalRespondieron})
          </button>

          <button
            type="button"
            onClick={() => setVistaEstado('pendientes')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: vistaEstado === 'pendientes' ? 800 : 600,
              background: vistaEstado === 'pendientes' ? '#dc2626' : '#fee2e2',
              color: vistaEstado === 'pendientes' ? '#ffffff' : '#b91c1c',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserX size={13} />
            <span>Sin Responder ({stats.totalPendientes})</span>
          </button>
        </div>

        {/* Categorías y Buscador */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Categorías */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
            WebkitOverflowScrolling: 'touch'
          }}>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFiltro(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '11.5px',
                  fontWeight: catFiltro === cat ? 800 : 600,
                  background: catFiltro === cat ? '#2a3b60' : 'var(--btn-bg, #f1f5f9)',
                  color: catFiltro === cat ? '#ffffff' : 'var(--text-muted, #64748b)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por jugador o lesión..."
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '10px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '12px',
                outline: 'none',
                background: 'var(--input-bg, #ffffff)',
                color: 'var(--text, #0f172a)',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* 5A. VISTA DE JUGADORES PENDIENTES (SIN RESPONDER) */}
        {vistaEstado === 'pendientes' && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626' }}>
                Futbolistas que aún no registraron su reporte hoy ({jugadoresPendientes.length}):
              </span>
            </div>

            {jugadoresPendientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', background: '#f0fdf4', borderRadius: '12px', color: '#15803d' }}>
                <CheckCircle2 size={28} style={{ margin: '0 auto 6px', display: 'block' }} />
                <strong style={{ fontSize: '13.5px' }}>Todo el plantel completó su evaluación</strong>
                <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#166534' }}>
                  No hay futbolistas pendientes para la categoría y fecha seleccionada.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{
                      borderBottom: '2px solid var(--border-color, #e2e8f0)',
                      color: 'var(--text-muted, #64748b)',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      <th style={{ padding: '8px' }}>Jugador</th>
                      <th style={{ padding: '8px' }}>Categoría</th>
                      <th style={{ padding: '8px' }}>Posición</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Estado</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Acciones para el PF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jugadoresPendientes.map((p) => (
                      <tr 
                        key={p.displayName}
                        style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}
                      >
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {p.photoUrl ? (
                              <img
                                src={p.photoUrl}
                                alt={p.displayName}
                                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: '#94a3b8',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 800
                              }}>
                                {p.displayName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                              {p.displayName}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '10px 8px', color: '#2a3b60', fontWeight: 700 }}>
                          {p.primaryCat}
                        </td>

                        <td style={{ padding: '10px 8px', color: 'var(--text-muted, #64748b)' }}>
                          {p.pos}
                        </td>

                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <span style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            Sin responder
                          </span>
                        </td>

                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleIniciarCargaPendiente(p)}
                              style={{
                                background: '#2a3b60',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Cargar evaluación manual ahora"
                            >
                              <PlusCircle size={13} />
                              <span>Evaluar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRecordarWhatsApp(p)}
                              style={{
                                background: 'transparent',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Enviar recordatorio por WhatsApp"
                            >
                              <MessageSquare size={13} />
                              <span>Recordar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5B. TABLA DE RESPUESTAS (COMPLETARON O TODOS) */}
        {vistaEstado !== 'pendientes' && (
          <>
            {registrosRespondieronFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--muted, #64748b)' }}>
                <p style={{ fontSize: '14px', margin: '0 0 12px' }}>
                  No se encontraron evaluaciones registradas para la fecha y filtros seleccionados.
                </p>
                <button
                  type="button"
                  onClick={handleCargarDemo}
                  style={{
                    background: '#2a3b60',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Cargar datos de prueba de hoy
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{
                      borderBottom: '2px solid var(--border-color, #e2e8f0)',
                      color: 'var(--text-muted, #64748b)',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}>
                      <th style={{ padding: '10px 8px' }}>Fecha</th>
                      <th style={{ padding: '10px 8px' }}>Jugador</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }} title="0 = Óptimo, 10 = Pésimo">Descanso</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }} title="0 = Fresco, 10 = Agotado">Fatiga</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }} title="0 = Relajado, 10 = Alto estrés">Estrés</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }} title="0 = Al 100%, 10 = Sin batería">Energía</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }} title="0 = Cero dolor, 10 = Dolor agudo">Dolor</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }}>Total Hooper</th>
                      <th style={{ padding: '10px 8px' }}>Molestias señaladas</th>
                      <th style={{ padding: '10px 8px' }}>Aclaración</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosRespondieronFiltrados.map((r) => {
                      const total = r.metricas.descanso + r.metricas.fatiga + r.metricas.estres + r.metricas.energia + r.metricas.dolor;
                      const badge = getHooperBadge(total, r.metricas.dolor);
                      const descCol = getMetricColor(r.metricas.descanso);
                      const fatCol = getMetricColor(r.metricas.fatiga);
                      const estCol = getMetricColor(r.metricas.estres);
                      const eneCol = getMetricColor(r.metricas.energia);
                      const dolCol = getMetricColor(r.metricas.dolor);

                      return (
                        <tr 
                          key={r.id} 
                          style={{
                            borderBottom: '1px solid var(--border-color, #f1f5f9)',
                            transition: 'background 0.12s ease'
                          }}
                        >
                          {/* Fecha */}
                          <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text, #0f172a)', fontSize: '12px' }}>
                              {getFechaSimple(r.fecha, r.timestamp)}
                            </span>
                          </td>

                          {/* Jugador */}
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {r.jugador.foto ? (
                                <img
                                  src={r.jugador.foto}
                                  alt={r.jugador.nombre}
                                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: '#2a3b60',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 800
                                }}>
                                  {r.jugador.nombre.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                                  {r.jugador.nombre}
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#2a3b60', fontWeight: 600 }}>
                                  {r.jugador.categoria} {r.jugador.posicion ? `· ${r.jugador.posicion}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Descanso */}
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: descCol.bg,
                              color: descCol.text,
                              fontWeight: 800,
                              fontSize: '12px'
                            }}>
                              {r.metricas.descanso}
                            </span>
                          </td>

                          {/* Fatiga */}
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: fatCol.bg,
                              color: fatCol.text,
                              fontWeight: 800,
                              fontSize: '12px'
                            }}>
                              {r.metricas.fatiga}
                            </span>
                          </td>

                          {/* Estrés */}
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: estCol.bg,
                              color: estCol.text,
                              fontWeight: 800,
                              fontSize: '12px'
                            }}>
                              {r.metricas.estres}
                            </span>
                          </td>

                          {/* Energía */}
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: eneCol.bg,
                              color: eneCol.text,
                              fontWeight: 800,
                              fontSize: '12px'
                            }}>
                              {r.metricas.energia}
                            </span>
                          </td>

                          {/* Dolor */}
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: dolCol.bg,
                              color: dolCol.text,
                              fontWeight: 800,
                              fontSize: '12px'
                            }}>
                              {r.metricas.dolor}
                            </span>
                          </td>

                          {/* Total Hooper */}
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 9px',
                              borderRadius: '12px',
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              fontWeight: 900,
                              fontSize: '12px'
                            }}>
                              {total} / 50
                            </span>
                          </td>

                          {/* Zonas Dolor */}
                          <td style={{ padding: '10px 8px' }}>
                            {r.zonasDolor && r.zonasDolor.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {r.zonasDolor.map((z, i) => (
                                  <span key={i} style={{
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    fontSize: '10.5px',
                                    fontWeight: 700
                                  }}>
                                    {z}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                                Sin molestias
                              </span>
                            )}
                          </td>

                          {/* Observaciones */}
                          <td style={{ padding: '10px 8px', fontSize: '11px', color: 'var(--muted, #64748b)', maxWidth: '170px' }}>
                            {r.observaciones ? `"${r.observaciones}"` : '-'}
                          </td>

                          {/* Botones de Editar y Eliminar para el Admin */}
                          <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleIniciarEdicion(r)}
                                style={{
                                  background: 'var(--btn-bg, #f1f5f9)',
                                  border: '1px solid var(--border-color, #cbd5e1)',
                                  color: '#2a3b60',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}
                                title="Editar evaluación"
                              >
                                <Pencil size={12} />
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEliminarRegistro(r.id, r.jugador.nombre)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#94a3b8',
                                  padding: '5px 6px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                                title="Eliminar registro"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* 6. Footer con Botones de Mantenimiento */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCargarDemo}
            style={{
              background: 'transparent',
              border: '1px dashed #2a3b60',
              color: '#2a3b60',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={13} />
            <span>Recargar datos demo</span>
          </button>

          <button
            type="button"
            onClick={handleLimpiarRegistros}
            style={{
              background: 'transparent',
              border: '1px dashed #ef4444',
              color: '#ef4444',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Trash2 size={13} />
            <span>Limpiar registros locales</span>
          </button>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--muted, #94a3b8)' }}>
          Integral Club · Departamento de Rendimiento Físico
        </span>
      </div>
    </div>
  );
}
