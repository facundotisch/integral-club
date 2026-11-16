import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  RotateCw, 
  Moon, 
  Sun, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Users,
  Target,
  Sparkles,
  Eye,
  Calendar,
  Award,
  Printer,
  FileText,
  MapPin,
  Compass
} from 'lucide-react';
import { 
  fetchProspectos, 
  saveProspecto, 
  deleteProspecto 
} from '../../services/captacionApi';
import ProspectoFormulario, { POSICIONES_CAPTACION, ESTADOS_CAPTACION, normalizeEstado, PROVINCIAS_ARGENTINA } from './ProspectoFormulario';
import ProspectoFichaModal from './ProspectoFichaModal';
import MapaArgentina, { getProspectoProvincia } from './MapaArgentina';

export const ESTADO_STYLES = {
  'Fichado': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: '#10B981' },
  'Fichados': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: '#10B981' },
  'Aprobado': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: '#10B981' },
  'Tiene que volver': { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B' },
  'Tienen que volver': { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B' },
  'Volver': { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B' },
  'Queda fuera': { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' },
  'Quedan fuera': { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' },
  'Fuera': { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' },
  'Descartado': { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' },
  'En seguimiento': { bg: 'rgba(42, 59, 96, 0.15)', text: '#2a3b60', border: '#2a3b60' },
  'Citado a prueba': { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', border: '#8B5CF6' },
  'En evaluación': { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', border: '#8B5CF6' }
};

export function getEstadoStyle(estado) {
  if (!estado) return ESTADO_STYLES['En seguimiento'];
  if (ESTADO_STYLES[estado]) return ESTADO_STYLES[estado];
  const norm = normalizeEstado(estado);
  return ESTADO_STYLES[norm] || ESTADO_STYLES['En seguimiento'];
}

// Formateador de fecha siempre en DD/MM/AAAA
function formatFechaDisplay(fStr) {
  if (!fStr) return '—';
  const clean = String(fStr).trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = ('0' + parseInt(parts[0], 10)).slice(-2);
      const m = ('0' + parseInt(parts[1], 10)).slice(-2);
      const a = parts[2].length === 2 ? ('20' + parts[2]) : parts[2];
      return `${d}/${m}/${a}`;
    }
  }
  if (clean.includes('-')) {
    const parts = clean.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return clean;
}

// Formateador de ID siempre en 0001, 0002...
function formatIdDisplay(id, index) {
  if (!id) return String(index + 1).padStart(4, '0');
  const num = parseInt(String(id).replace(/\D/g, ''), 10);
  if (!isNaN(num) && num < 10000 && num > 0) return String(num).padStart(4, '0');
  return String(index + 1).padStart(4, '0');
}

export default function CaptacionModule({ onVolverHub, tema = 'claro', onToggleTema }) {
  const [vista, setVista] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('vista') === 'formulario' ? 'formulario' : 'listado';
    } catch (e) {
      return 'listado';
    }
  }); // 'listado' | 'formulario'
  const [prospectoEditar, setProspectoEditar] = useState(null);
  const [prospectoVer, setProspectoVer] = useState(null);

  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroPosicion, setFiltroPosicion] = useState('Todas');
  const [filtroProvincia, setFiltroProvincia] = useState('Todas');
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProspectos(force);
      setProspectos(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al conectar con la base de datos de Captación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular siguiente ID sugerido (0001, 0002, etc.)
  const nextSuggestedId = useMemo(() => {
    let max = 0;
    prospectos.forEach(p => {
      const num = parseInt(String(p.id).replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return String(max + 1).padStart(4, '0');
  }, [prospectos]);

  // Guardar prospecto
  const handleSaveProspecto = async (formData, isUpdate) => {
    const updating = isUpdate !== undefined ? isUpdate : !!(prospectoEditar && prospectoEditar.id);
    await saveProspecto(formData, updating);
    showToast(updating ? 'Prospecto actualizado con éxito.' : 'Prospecto guardado exitosamente.');
    await loadData(true);
    setVista('listado');
    setProspectoEditar(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Eliminar prospecto
  const handleDeleteProspecto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseás eliminar a "${nombre}" de la base de datos?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteProspecto(id);
      showToast(`Prospecto "${nombre}" eliminado correctamente.`);
      await loadData(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  // Métricas calculadas
  const kpis = useMemo(() => {
    const total = prospectos.length;
    let fichados = 0;
    let volver = 0;
    let fuera = 0;
    let enSeguimiento = 0;

    prospectos.forEach(p => {
      const norm = normalizeEstado(p.estado);
      if (norm === 'Fichado') fichados++;
      else if (norm === 'Tiene que volver') volver++;
      else if (norm === 'Queda fuera') fuera++;
      else enSeguimiento++;
    });

    return { total, fichados, volver, fuera, enSeguimiento };
  }, [prospectos]);

  // Lista filtrada
  const prospectosFiltrados = useMemo(() => {
    const b = busqueda.trim().toLowerCase();
    return prospectos.filter(p => {
      if (filtroEstado !== 'Todos') {
        const normP = normalizeEstado(p.estado);
        const normF = normalizeEstado(filtroEstado);
        if (normP !== normF) return false;
      }
      if (filtroPosicion !== 'Todas' && p.posicion !== filtroPosicion) return false;
      if (filtroProvincia !== 'Todas') {
        const prov = getProspectoProvincia(p);
        if (prov !== filtroProvincia) return false;
      }
      if (!b) return true;
      const prov = getProspectoProvincia(p);
      return (
        (p.jugador || '').toLowerCase().includes(b) ||
        (p.club || '').toLowerCase().includes(b) ||
        (p.scout || '').toLowerCase().includes(b) ||
        (p.posicion || '').toLowerCase().includes(b) ||
        (p.nacimiento || '').toLowerCase().includes(b) ||
        (p.id || '').toLowerCase().includes(b) ||
        (p.fecha || '').toLowerCase().includes(b) ||
        prov.toLowerCase().includes(b) ||
        (p.localidad || '').toLowerCase().includes(b)
      );
    });
  }, [prospectos, busqueda, filtroEstado, filtroPosicion, filtroProvincia]);

  return (
    <div className="integral-app">
      {/* Topbar Institucional idéntico a las demás áreas */}
      <header className="topbar">
        <div className="tb-left">
          <button 
            type="button" 
            className="btn-hub-back"
            onClick={onVolverHub}
            title="Volver a la Pantalla de Inicio"
          >
            <ArrowLeft size={16} />
            <span>Inicio</span>
          </button>
          <div className="tb-divider" />
          <img src="/escudo.png" alt="Integral Club" className="tb-escudo" />
          <span className="tb-brand">Integral Club · Área Scouting</span>
        </div>

        <div className="tb-right">
          <button
            type="button"
            className="btn-refresh-data"
            onClick={() => loadData(true)}
            disabled={loading}
            title="Sincronizar base de datos"
          >
            <RotateCw size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Sincronizando...' : 'Actualizar datos'}</span>
          </button>

          <button
            type="button"
            className="btn-theme-toggle"
            onClick={onToggleTema}
            title="Cambiar tema de color"
          >
            {tema === 'oscuro' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Hero Institucional idéntico a las demás áreas */}
      <section className="hero-section">
        <div className="hero-card">
          <div className="hero-card-top">
            <div className="hero-badge">
              <UserPlus size={15} className="hero-badge-icon" />
              <span>Area Captacion · Formativas</span>
            </div>
            <div className="hero-live-badge">
              <span className="hero-pulse-dot" />
              <span className="hero-live-txt">Base de Datos Conectada</span>
            </div>
          </div>

          <h1 className="hero-title">
            Area <span className="text-celeste">Captacion</span>
          </h1>

          <p className="hero-lede">
            Seguimiento de futbolistas, fichas técnicas y evaluación de talentos para las divisiones del club.
          </p>
        </div>
      </section>

      {/* Toast de confirmación flotante */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10000,
          fontWeight: 700,
          fontSize: '13.5px'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="content-container" style={{ padding: '0 24px 60px' }}>
        {vista === 'formulario' ? (
          <ProspectoFormulario
            prospecto={prospectoEditar}
            nextSuggestedId={nextSuggestedId}
            onSave={handleSaveProspecto}
            onVolver={() => {
              setVista('listado');
              setProspectoEditar(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : vista === 'mapa' ? (
          <MapaArgentina
            prospectos={prospectos}
            tema={tema}
            onVolverTabla={() => {
              setVista('listado');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onVerFicha={(p) => setProspectoVer(p)}
            onVerEnTablaConFiltro={(prov) => {
              setFiltroProvincia(prov);
              setVista('listado');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <>
            {/* Tarjetas de Métricas KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', margin: '0 0 20px' }}>
              <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--celeste)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
                    TOTAL PROSPECTOS
                  </span>
                  <Users size={17} color="var(--celeste)" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', marginTop: '4px', fontFamily: 'var(--font-head)' }}>
                  {kpis.total}
                </div>
              </div>

              <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #10B981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
                    FICHADOS
                  </span>
                  <Sparkles size={17} color="#10B981" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', marginTop: '4px', fontFamily: 'var(--font-head)' }}>
                  {kpis.fichados}
                </div>
              </div>

              <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
                    TIENEN QUE VOLVER
                  </span>
                  <RotateCw size={17} color="#F59E0B" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#F59E0B', marginTop: '4px', fontFamily: 'var(--font-head)' }}>
                  {kpis.volver}
                </div>
              </div>

              <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #EF4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
                    QUEDAN FUERA
                  </span>
                  <AlertCircle size={17} color="#EF4444" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#EF4444', marginTop: '4px', fontFamily: 'var(--font-head)' }}>
                  {kpis.fuera}
                </div>
              </div>

              <div className="card" style={{ padding: '14px 18px', borderLeft: '4px solid #2a3b60' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
                    EN SEGUIMIENTO
                  </span>
                  <Eye size={17} color="#2a3b60" />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#2a3b60', marginTop: '4px', fontFamily: 'var(--font-head)' }}>
                  {kpis.enSeguimiento}
                </div>
              </div>
            </div>

            {/* Barra de Filtros y Botón Nuevo Prospecto */}
            <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {/* Buscador */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input 
                      type="text"
                      placeholder="Buscar por jugador, club, posición, ID o año..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 34px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-card)',
                        background: 'var(--card2)',
                        color: 'var(--text)',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Filtros Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={13} color="var(--muted)" />
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Estado:</span>
                    <select 
                      className="sel"
                      value={filtroEstado}
                      onChange={e => setFiltroEstado(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px', marginBottom: 0 }}
                    >
                      <option value="Todos">Todos los estados</option>
                      <option value="Fichado">Fichados</option>
                      <option value="Tiene que volver">Tienen que volver</option>
                      <option value="Queda fuera">Quedan fuera</option>
                      <option value="En seguimiento">En seguimiento</option>
                      <option value="Citado a prueba">Citados a prueba</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Posición:</span>
                    <select 
                      className="sel"
                      value={filtroPosicion}
                      onChange={e => setFiltroPosicion(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px', marginBottom: 0 }}
                    >
                      <option value="Todas">Todas</option>
                      {POSICIONES_CAPTACION.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Provincia */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="var(--muted)" />
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Provincia:</span>
                    <select 
                      className="sel"
                      value={filtroProvincia}
                      onChange={e => setFiltroProvincia(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px', marginBottom: 0 }}
                    >
                      <option value="Todas">Todas las provincias</option>
                      {PROVINCIAS_ARGENTINA.map(pr => (
                        <option key={pr} value={pr}>{pr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Botón Ver Mapa */}
                  <button
                    type="button"
                    onClick={() => {
                      setVista('mapa');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    title="Ver mapa geográfico de prospectos en Argentina"
                    style={{
                      background: 'var(--card2)',
                      color: 'var(--text)',
                      border: '1.5px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Compass size={14} color="var(--celeste)" />
                    <span>Ver Mapa</span>
                  </button>

                  {/* Botón Exportar Tabla a PDF */}
                  <button
                    type="button"
                    onClick={() => {
                      const orig = document.title;
                      document.title = 'Planilla_Captacion_Integral_Club';
                      window.print();
                      setTimeout(() => { document.title = orig; }, 500);
                    }}
                    title="Exportar listado completo a PDF"
                    style={{
                      background: 'var(--card2)',
                      color: 'var(--text)',
                      border: '1.5px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Printer size={14} color="var(--celeste)" />
                    <span>Exportar Tabla</span>
                  </button>

                  {/* Botón Nuevo Prospecto con Redirección a la UI del Formulario */}
                  <button
                    type="button"
                    onClick={() => {
                      setProspectoEditar(null);
                      setVista('formulario');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      background: 'var(--celeste)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 800,
                      fontSize: '13px',
                      padding: '9px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(42, 59, 96, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <UserPlus size={15} color="#ffffff" />
                    <span style={{ color: '#ffffff' }}>+ Nuevo Prospecto</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mensaje de Error si falló la carga */}
            {error && (
              <div className="card" style={{ padding: '20px', textAlign: 'center', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.08)', marginBottom: '16px' }}>
                <AlertCircle size={28} color="#ef4444" style={{ margin: '0 auto 6px' }} />
                <h3 style={{ color: '#ef4444', fontSize: '15px', fontWeight: 800 }}>Error de conexión con la base de datos</h3>
                <p style={{ color: 'var(--text)', fontSize: '13px', marginTop: '4px' }}>{error}</p>
                <button 
                  type="button" 
                  onClick={() => loadData(true)} 
                  style={{
                    marginTop: '10px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Tabla de Jugadores Prospectos (Optimizada para pantallas de 14" sin scroll horizontal) */}
            <div className="card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="data planilla-tbl" style={{ width: '100%', minWidth: '940px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border-card)' }}>
                      <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '95px' }}>Fecha</th>
                      <th style={{ padding: '12px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '65px', textAlign: 'center' }}>ID</th>
                      <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Jugador</th>
                      <th style={{ padding: '12px 10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '80px', textAlign: 'center' }}>Cat</th>
                      <th style={{ padding: '12px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '135px' }}>Posición</th>
                      <th style={{ padding: '12px 10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '65px', textAlign: 'center' }}>Pierna</th>
                      <th style={{ padding: '12px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '150px' }}>Club Origen</th>
                      <th style={{ padding: '12px 10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '75px', textAlign: 'center' }}>Nota</th>
                      <th style={{ padding: '12px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '125px', textAlign: 'center' }}>Estado</th>
                      <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', width: '180px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && prospectos.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <RotateCw size={16} className="spin" color="var(--celeste)" />
                            <span>Cargando base de datos de captación...</span>
                          </div>
                        </td>
                      </tr>
                    ) : prospectosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: '40px 20px', textAlign: 'center' }}>
                          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <Users size={36} color="var(--celeste)" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                              {prospectos.length === 0 ? 'No hay prospectos registrados aún' : 'No se encontraron prospectos con los filtros activos'}
                            </h4>
                            <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '14px' }}>
                              {prospectos.length === 0 
                                ? 'Comenzá cargando el primer futbolista observado por el equipo de scouting.' 
                                : 'Probá modificando el texto de búsqueda o los selectores de filtro.'}
                            </p>
                            {prospectos.length === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProspectoEditar(null);
                                  setVista('formulario');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                style={{
                                  background: 'var(--celeste)',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontWeight: 800,
                                  padding: '10px 22px',
                                  borderRadius: '10px',
                                  fontSize: '13.5px',
                                  cursor: 'pointer',
                                  boxShadow: '0 3px 10px rgba(42, 59, 96, 0.35)'
                                }}
                              >
                                + Cargar Primer Prospecto
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      prospectosFiltrados.map((p, idx) => {
                        const estStyle = ESTADO_STYLES[p.estado] || { bg: 'rgba(0,0,0,0.06)', text: 'var(--text)', border: 'var(--border-card)' };
                        const isDeleting = deletingId === p.id;
                        return (
                          <tr 
                            key={p.id}
                            style={{ 
                              borderBottom: '1px solid var(--border-card)',
                              transition: 'background 0.15s ease'
                            }}
                            className="table-row-hover"
                          >
                            {/* 1. FECHA (DD/MM/AAAA) PRIMERO */}
                            <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                              {formatFechaDisplay(p.fecha)}
                            </td>

                            {/* 2. ID (0001, 0002...) */}
                            <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                              <span style={{ 
                                fontFamily: 'var(--font-mono)', 
                                fontSize: '11.5px', 
                                fontWeight: 800, 
                                color: 'var(--celeste)',
                                background: 'rgba(42, 59, 96, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {formatIdDisplay(p.id, idx)}
                              </span>
                            </td>

                            {/* 3. JUGADOR */}
                            <td style={{ padding: '11px 14px' }}>
                              <div 
                                onClick={() => setProspectoVer(p)}
                                title="Hacé clic para ver la ficha técnica completa y exportar"
                                style={{ 
                                  fontWeight: 800, 
                                  color: 'var(--text)', 
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>{p.jugador}</span>
                                <FileText size={12} color="var(--celeste)" style={{ opacity: 0.85 }} />
                              </div>
                              {p.informe && (
                                <div 
                                  onClick={() => setProspectoVer(p)}
                                  title="Hacé clic para leer el informe completo"
                                  style={{ 
                                    fontSize: '11px', 
                                    color: 'var(--muted)', 
                                    fontWeight: 400, 
                                    marginTop: '1px', 
                                    maxWidth: '240px', 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {p.informe}
                                </div>
                              )}
                            </td>

                            {/* 4. AÑO / CAT */}
                            <td style={{ padding: '11px 10px', fontSize: '12px', color: 'var(--text)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {p.nacimiento || '—'}
                            </td>

                            {/* 5. POSICIÓN (Exactas 7 posiciones) */}
                            <td style={{ padding: '11px 12px' }}>
                              <span style={{ 
                                background: 'rgba(42, 59, 96, 0.1)', 
                                color: 'var(--celeste)', 
                                padding: '3px 7px', 
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '11px',
                                whiteSpace: 'nowrap',
                                display: 'inline-block'
                              }}>
                                {p.posicion || '—'}
                              </span>
                            </td>

                            {/* 6. PIERNA */}
                            <td style={{ padding: '11px 10px', fontSize: '11.5px', color: 'var(--muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {p.pierna === 'Derecha' ? 'Der' : p.pierna === 'Izquierda' ? 'Izq' : p.pierna || '—'}
                            </td>

                            {/* 7. CLUB ORIGEN & PROCEDENCIA */}
                            <td style={{ padding: '11px 12px', fontSize: '12px', color: 'var(--text)', fontWeight: 600, maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <div>{p.club || '—'}</div>
                              <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                                <MapPin size={10} color="var(--celeste)" />
                                <span>{getProspectoProvincia(p)}{p.localidad ? ` (${p.localidad})` : ''}</span>
                              </div>
                            </td>

                            {/* 8. NOTA GLOBAL (PROMEDIO) */}
                            <td style={{ padding: '11px 10px', textAlign: 'center' }}>
                              {p.notaGlobal ? (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  fontWeight: 900,
                                  fontSize: '11.5px',
                                  background: p.notaGlobal >= 8 ? '#10B981' : p.notaGlobal >= 6 ? 'var(--celeste)' : '#6B7280',
                                  color: '#ffffff'
                                }}>
                                  {p.notaGlobal}
                                </span>
                              ) : '—'}
                            </td>

                            {/* 9. ESTADO (Badge compacto y sin desbordes) */}
                            <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '10.5px',
                                whiteSpace: 'nowrap',
                                background: getEstadoStyle(p.estado).bg,
                                color: getEstadoStyle(p.estado).text,
                                border: `1px solid ${getEstadoStyle(p.estado).border}`
                              }}>
                                {p.estado || 'En seguimiento'}
                              </span>
                            </td>

                            {/* 10. ACCIONES */}
                            <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setProspectoVer(p)}
                                  title="Ver ficha técnica completa y exportar a PDF"
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    background: 'var(--card2)',
                                    color: 'var(--text)',
                                    border: '1.5px solid var(--border-card)',
                                    borderRadius: '7px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <Eye size={13} color="var(--celeste)" />
                                  <span>Ver</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProspectoEditar(p);
                                    setVista('formulario');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  title="Editar ficha del prospecto"
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    background: 'var(--celeste)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '7px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(42, 59, 96, 0.25)'
                                  }}
                                >
                                  <Edit3 size={13} color="#ffffff" />
                                  <span style={{ color: '#ffffff' }}>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProspecto(p.id, p.jugador)}
                                  disabled={isDeleting}
                                  title="Eliminar de la base de datos"
                                  style={{ 
                                    padding: '6px 9px', 
                                    background: 'rgba(239, 68, 68, 0.12)', 
                                    border: '1.5px solid #ef4444', 
                                    color: '#ef4444',
                                    borderRadius: '7px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <Trash2 size={13} color="#ef4444" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Ficha Técnica y Exportación a PDF */}
      {prospectoVer && (
        <ProspectoFichaModal
          prospecto={prospectoVer}
          idFormatted={formatIdDisplay(prospectoVer.id, prospectos.findIndex(x => x.id === prospectoVer.id))}
          onClose={() => setProspectoVer(null)}
          onEditar={(p) => {
            setProspectoVer(null);
            setProspectoEditar(p);
            setVista('formulario');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}
