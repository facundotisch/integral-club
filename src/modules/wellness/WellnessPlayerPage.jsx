import React, { useState, useEffect, useMemo } from 'react';
import { 
  Moon, Sun, CheckCircle2, Send, 
  RotateCcw, Share2, Sparkles, BedDouble, BatteryCharging, 
  Zap, Brain, ShieldAlert, User, Lock, LogOut, Check,
  KeyRound, ShieldCheck, LayoutDashboard, Smartphone, Calendar
} from 'lucide-react';
import { buildStaticPlayersCatalog } from '../../data/jugadoresIndex';
import WellnessSliderCard from './components/WellnessSliderCard';
import BodyMapSkeleton from './components/BodyMapSkeleton';
import WellnessAdminPanel from './components/WellnessAdminPanel';
import './wellness.css';

// Cuentas demo hardcodeadas para acceso rápido con 1 tap
const DEMO_PLAYERS = [
  {
    displayName: 'Jugador 1',
    primaryCat: 'Reserva',
    pos: 'Defensor Central',
    dni: '1001',
    photoUrl: null
  },
  {
    displayName: 'Jugador 2',
    primaryCat: 'Cuarta',
    pos: 'Volante Mixto',
    dni: '1002',
    photoUrl: null
  },
  {
    displayName: 'Jugador 3',
    primaryCat: 'Séptima',
    pos: 'Delantero',
    dni: '1003',
    photoUrl: null
  },
  {
    displayName: 'Jugador 4',
    primaryCat: 'Novena',
    pos: 'Extremo',
    dni: '1004',
    photoUrl: null
  }
];

export default function WellnessPlayerPage({ onVolverHub, tema = 'claro', onToggleTema }) {
  // Catálogo completo de jugadores
  const catalog = useMemo(() => buildStaticPlayersCatalog(), []);

  // Modo Vista: Jugador vs Admin DT / PF
  const [vistaAdmin, setVistaAdmin] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('admin') === '1' || params.get('vista') === 'admin';
    } catch {}
    return false;
  });

  // 1. Estado de Sesión / Login (hardcodeado / mock auth)
  const [authUser, setAuthUser] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryName = params.get('jugador');
      if (queryName) {
        const found = catalog.find(p => p.displayName.toLowerCase().includes(queryName.toLowerCase()));
        if (found) return found;
      }
      const saved = localStorage.getItem('integral_wellness_auth');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  });

  // Campos del formulario de Login
  const [dniInput, setDniInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [loginError, setLoginError] = useState('');

  // 2. Variables de Wellness (0 a 10)
  // REGLA: En TODAS las variables 0 es ÓPTIMO (Verde) y 10 es ALERTA MÁXIMA (Rojo)
  const [descanso, setDescanso] = useState(0); // 0 = descansé de diez, 10 = pésimo
  const [fatiga, setFatiga] = useState(0);     // 0 = sin fatiga, 10 = agotamiento
  const [estres, setEstres] = useState(0);     // 0 = sin estrés, 10 = mucha presión
  const [energia, setEnergia] = useState(0);   // 0 = con toda la energía, 10 = vaciado
  const [dolor, setDolor] = useState(0);       // 0 = sin dolor muscular, 10 = dolor agudo

  // 3. Mapa Corporal de Molestias
  const [zonasDolor, setZonasDolor] = useState([]);
  const [observaciones, setObservaciones] = useState('');

  // 4. Estado de Envío
  const [enviado, setEnviado] = useState(false);
  const [ultimoReporte, setUltimoReporte] = useState(null);

  // Fecha de hoy en formato simple DD/MM/AAAA
  const fechaHoyStr = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Handler: Iniciar sesión con formulario DNI + Contraseña
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    const query = dniInput.trim();

    if (!query && !passInput) {
      setLoginError('Por favor ingresá tu DNI o usuario.');
      return;
    }

    setLoginError('');

    // Búsqueda en demo primero
    const matchDemo = DEMO_PLAYERS.find(
      p => p.dni === query || p.displayName.toLowerCase().includes(query.toLowerCase())
    );

    // Búsqueda en catálogo general
    const matchCatalog = catalog.find(
      p => p.displayName.toLowerCase().includes(query.toLowerCase()) || 
           (p.searchStr && p.searchStr.includes(query.toLowerCase()))
    );

    const userProfile = matchDemo || matchCatalog || {
      displayName: query || 'Jugador 1',
      primaryCat: 'Reserva',
      pos: 'Jugador de Campo',
      photoUrl: null,
      dni: query
    };

    if (recordar) {
      try {
        localStorage.setItem('integral_wellness_auth', JSON.stringify(userProfile));
      } catch {}
    }

    setAuthUser(userProfile);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Acceso Rápido 1-tap con cuenta demo
  const handleDemoSelect = (demo) => {
    setDniInput(demo.dni);
    setPassInput('••••••');
    setLoginError('');

    if (recordar) {
      try {
        localStorage.setItem('integral_wellness_auth', JSON.stringify(demo));
      } catch {}
    }

    setAuthUser(demo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Cerrar sesión (vuelve al login)
  const handleLogout = () => {
    try {
      localStorage.removeItem('integral_wellness_auth');
    } catch {}
    setAuthUser(null);
    setEnviado(false);
    setDniInput('');
    setPassInput('');
    setZonasDolor([]);
    setObservaciones('');
  };

  // Toggle de zonas de dolor
  const handleToggleZona = (zona) => {
    setZonasDolor((prev) => {
      const exists = prev.some(z => z.id === zona.id);
      if (exists) {
        return prev.filter(z => z.id !== zona.id);
      }
      return [...prev, zona];
    });
  };

  const handleLimpiarZonas = () => {
    setZonasDolor([]);
  };

  // Enviar Reporte
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!authUser) {
      alert('Por favor iniciá sesión antes de enviar.');
      return;
    }

    const totalHooper = descanso + fatiga + estres + energia + dolor;

    const payload = {
      id: `wellness_${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      fechaTexto: fechaHoyStr,
      timestamp: new Date().toISOString(),
      jugador: {
        nombre: authUser.displayName,
        categoria: authUser.primaryCat || 'Formativo',
        posicion: authUser.pos || 'Jugador de Campo',
        foto: authUser.photoUrl || null
      },
      metricas: {
        descanso,
        fatiga,
        estres,
        energia,
        dolor
      },
      totalHooper,
      zonasDolor: zonasDolor.map(z => z.label),
      observaciones: observaciones.trim()
    };

    // Guardar en localStorage para que el admin pueda ver los resultados
    try {
      const exist = JSON.parse(localStorage.getItem('integral_wellness_records') || '[]');
      exist.unshift(payload);
      localStorage.setItem('integral_wellness_records', JSON.stringify(exist.slice(0, 200)));
    } catch {}

    setUltimoReporte(payload);
    setEnviado(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compartir en WhatsApp (SIN EMOJIS)
  const handleShareWhatsApp = () => {
    if (!ultimoReporte) return;
    const { jugador, metricas, totalHooper, zonasDolor: zonas, observaciones: obs } = ultimoReporte;
    
    let msg = `*INTEGRAL CLUB - CONTROL DE WELLNESS*\n`;
    msg += `*Jugador:* ${jugador.nombre} (${jugador.categoria})\n`;
    msg += `*Fecha:* ${fechaHoyStr}\n\n`;
    msg += `*Valores (0 = Optimo / 10 = Alerta Maxima):*\n`;
    msg += `• Descanso: ${metricas.descanso}/10\n`;
    msg += `• Fatiga: ${metricas.fatiga}/10\n`;
    msg += `• Estres: ${metricas.estres}/10\n`;
    msg += `• Falta de Energia: ${metricas.energia}/10\n`;
    msg += `• Dolor Muscular: ${metricas.dolor}/10\n\n`;
    msg += `*Indice Total Hooper:* ${totalHooper}/50 (${totalHooper <= 12 ? 'Zona Verde - Optimo' : totalHooper >= 25 ? 'Alerta Roja' : 'Zona Amarilla'})\n`;

    if (zonas && zonas.length > 0) {
      msg += `*Molestias puntuales senaladas:* ${zonas.join(', ')}\n`;
    } else {
      msg += `*Molestias:* Ninguna (Cuerpo 100% OK)\n`;
    }

    if (obs) {
      msg += `*Aclaracion:* ${obs}\n`;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="wellness-mobile-wrapper">
      {/* 1. Topbar Institucional */}
      <header className="wellness-topbar">
        <div className="wellness-topbar-left">
          <img src="/escudo.png" alt="Integral Club" className="wellness-topbar-escudo" />
          <span className="wellness-topbar-brand">Integral Club</span>
        </div>

        <div className="wellness-topbar-right">
          {/* Switch de Modo Jugador <-> Modo Admin DT */}
          <button
            type="button"
            onClick={() => setVistaAdmin(!vistaAdmin)}
            style={{
              background: vistaAdmin ? '#2a3b60' : 'rgba(42, 59, 96, 0.1)',
              color: vistaAdmin ? '#ffffff' : '#2a3b60',
              border: '1px solid rgba(42, 59, 96, 0.4)',
              borderRadius: '8px',
              padding: '4px 9px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={vistaAdmin ? 'Cambiar a Vista Jugador' : 'Ver Panel Admin / DT'}
          >
            {vistaAdmin ? <Smartphone size={13} /> : <LayoutDashboard size={13} />}
            <span>{vistaAdmin ? 'Ver como Jugador' : 'Panel DT'}</span>
          </button>

          {onToggleTema && (
            <button
              type="button"
              className="wellness-btn-theme"
              onClick={onToggleTema}
              title={tema === 'claro' ? 'Modo Oscuro' : 'Modo Blanco'}
            >
              {tema === 'claro' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          )}
        </div>
      </header>

      {/* CASO ESPECIAL: VISTA ADMIN / PANEL DT */}
      {vistaAdmin ? (
        <WellnessAdminPanel 
          onVolverCuestionario={() => setVistaAdmin(false)}
        />
      ) : (
        <>
          {/* 2. Hero Header con los Colores y Escudo Central del HUB */}
          <div className="wellness-hero-banner">
            <div className="wellness-hero-escudo-wrap">
              <img src="/escudo.png" alt="Integral Club" className="wellness-hero-escudo" />
            </div>
            <div className="wellness-hero-date-badge">
              <Calendar size={13} />
              <span>{fechaHoyStr}</span>
            </div>
            <h1 className="wellness-hero-title">Control de Wellness</h1>
            <p className="wellness-hero-sub">Plataforma de Alto Rendimiento</p>
          </div>

          {/* 3. Contenedor Principal Mobile-First */}
          <main className="wellness-mobile-container" style={{ marginTop: '16px' }}>
            
            {/* CASO A: PANTALLA DE ÉXITO LUEGO DE ENVIAR */}
            {enviado && ultimoReporte ? (
              <div className="wellness-success-card">
                <div className="wellness-success-icon">
                  <CheckCircle2 size={38} />
                </div>

                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 900, margin: '0 0 6px', color: '#10b981' }}>
                    ¡Reporte Enviado!
                  </h2>
                  <p style={{ fontSize: '13px', margin: 0, color: 'var(--muted, #64748b)' }}>
                    Muchas gracias, <strong>{ultimoReporte.jugador.nombre}</strong>. Tu estado de hoy ya quedó registrado para el cuerpo técnico.
                  </p>
                </div>

                {/* Resumen del Reporte con Escala 0=Bueno a 10=Malo (SIN EMOJIS) */}
                <div style={{
                  width: '100%',
                  background: 'var(--btn-bg, #f8fafc)',
                  borderRadius: '14px',
                  padding: '14px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  textAlign: 'left',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#2a3b60', textTransform: 'uppercase' }}>
                      Resumen de Carga (0 = Óptimo · 10 = Alerta)
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      background: ultimoReporte.totalHooper <= 12 ? '#ecfdf5' : ultimoReporte.totalHooper >= 25 ? '#fee2e2' : '#fef3c7',
                      color: ultimoReporte.totalHooper <= 12 ? '#059669' : ultimoReporte.totalHooper >= 25 ? '#b91c1c' : '#b45309',
                      padding: '2px 8px',
                      borderRadius: '8px'
                    }}>
                      Total: {ultimoReporte.totalHooper} / 50
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                    <div>Descanso: <strong>{ultimoReporte.metricas.descanso}/10</strong></div>
                    <div>Falta de Energía: <strong>{ultimoReporte.metricas.energia}/10</strong></div>
                    <div>Fatiga: <strong>{ultimoReporte.metricas.fatiga}/10</strong></div>
                    <div>Estrés: <strong>{ultimoReporte.metricas.estres}/10</strong></div>
                    <div style={{ gridColumn: 'span 2' }}>
                      Dolor Muscular: <strong>{ultimoReporte.metricas.dolor}/10</strong>
                    </div>
                  </div>

                  {ultimoReporte.zonasDolor.length > 0 && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                        Zonas señaladas:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {ultimoReporte.zonasDolor.map((z, idx) => (
                          <span key={idx} style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                            {z}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {ultimoReporte.observaciones && (
                    <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--text-muted, #475569)', fontStyle: 'italic' }}>
                      "{ultimoReporte.observaciones}"
                    </div>
                  )}
                </div>

                {/* Botón Compartir en WhatsApp (Sin sombras raras) */}
                <button
                  type="button"
                  className="wellness-btn-whatsapp"
                  onClick={handleShareWhatsApp}
                >
                  <Share2 size={16} />
                  <span>Pasar reporte por WhatsApp</span>
                </button>

                {/* Acciones de reinicio o cambio */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setEnviado(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#2a3b60',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px'
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>Modificar datos</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px'
                    }}
                  >
                    <LogOut size={15} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* CASO B: PANTALLA DE LOGIN (HARDCODEADO / MOBILE-FIRST) */}
                {!authUser ? (
                  <div className="wellness-login-card">
                    <div className="wellness-login-header">
                      <div className="wellness-login-badge">
                        <ShieldCheck size={14} />
                        <span>Acceso de Jugadores</span>
                      </div>
                      <h2 className="wellness-login-title">Iniciar Sesión</h2>
                      <p className="wellness-login-sub">
                        Ingresá con tu DNI y tu clave personal para registrar tu estado del día.
                      </p>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--btn-bg, #f1f5f9)',
                        border: '1px solid var(--border-color, #cbd5e1)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: 'var(--text-muted, #475569)',
                        marginTop: '4px'
                      }}>
                        <Calendar size={13} color="#2a3b60" />
                        <span>Evaluación: {fechaHoyStr}</span>
                      </div>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="wellness-login-form">
                      {loginError && (
                        <div className="wellness-login-error">
                          {loginError}
                        </div>
                      )}

                      <div className="wellness-input-group">
                        <label className="wellness-input-label">DNI o Usuario</label>
                        <div className="wellness-input-wrap">
                          <User size={18} className="wellness-input-icon" />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={dniInput}
                            onChange={(e) => setDniInput(e.target.value)}
                            placeholder="Ej: 44123456"
                            className="wellness-login-input"
                            autoComplete="username"
                          />
                        </div>
                      </div>

                      <div className="wellness-input-group">
                        <label className="wellness-input-label">Contraseña / PIN</label>
                        <div className="wellness-input-wrap">
                          <Lock size={18} className="wellness-input-icon" />
                          <input
                            type="password"
                            value={passInput}
                            onChange={(e) => setPassInput(e.target.value)}
                            placeholder="••••••••"
                            className="wellness-login-input"
                            autoComplete="current-password"
                          />
                        </div>
                      </div>

                      <label className="wellness-remember-check">
                        <input
                          type="checkbox"
                          checked={recordar}
                          onChange={(e) => setRecordar(e.target.checked)}
                        />
                        <span>Recordar mi sesión en este teléfono</span>
                      </label>

                      <button
                        type="submit"
                        className="wellness-btn-submit"
                        style={{ marginTop: '4px' }}
                      >
                        <span>INGRESAR AL WELLNESS</span>
                        <Send size={16} />
                      </button>
                    </form>

                    {/* Accesos rápidos de prueba para facilitar testeo (SIN EMOJIS) */}
                    <div className="wellness-demo-section">
                      <div className="wellness-demo-title">
                        Acceso de prueba rápido (1 tap):
                      </div>
                      <div className="wellness-demo-grid">
                        {DEMO_PLAYERS.map((demo) => (
                          <button
                            key={demo.displayName}
                            type="button"
                            onClick={() => handleDemoSelect(demo)}
                            className="wellness-demo-chip"
                          >
                            <span className="wellness-demo-chip-name">{demo.displayName}</span>
                            <span className="wellness-demo-chip-cat">{demo.primaryCat}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Banner del Jugador Autenticado */
                  <div className="wellness-player-card">
                    <div className="wellness-player-info">
                      {authUser.photoUrl ? (
                        <img
                          src={authUser.photoUrl}
                          alt={authUser.displayName}
                          className="wellness-player-avatar"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="wellness-player-initials">
                          {authUser.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="wellness-player-name">{authUser.displayName}</div>
                        <div className="wellness-player-cat">
                          {authUser.primaryCat || 'Formativo'} · {authUser.pos || 'Jugador de Campo'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="wellness-btn-change"
                      onClick={handleLogout}
                      title="Cerrar sesión"
                    >
                      <LogOut size={13} style={{ marginRight: '4px' }} />
                      <span>Salir</span>
                    </button>
                  </div>
                )}

                {/* CASO C: FORMULARIO DE WELLNESS (Si el jugador ya inició sesión) */}
                {/* REGLA: En todas las variables 0 es ÓPTIMO (Verde) y 10 es ALERTA MÁXIMA (Rojo) */}
                {authUser && (
                  <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div className="wellness-section-date-strip">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#2a3b60" />
                        <span>Fecha: <strong style={{ color: 'var(--text, #0f172a)' }}>{fechaHoyStr}</strong></span>
                      </div>
                    </div>
                    
                    {/* 1. DESCANSO: 0 = Dormí de 10 (Verde), 10 = Pésimo/Insomnio (Rojo) */}
                    <WellnessSliderCard
                      id="descanso"
                      titulo="Descanso"
                      pregunta="¿Cómo descansaste anoche?"
                      icon={BedDouble}
                      value={descanso}
                      onChange={setDescanso}
                      positive={false} // 0 = óptimo (verde), 10 = pésimo (rojo)
                      minLabel="0 (Dormí 10 puntos / Óptimo)"
                      maxLabel="10 (Pésimo / Insomnio)"
                    />

                    {/* 2. FATIGA: 0 = Cero fatiga (Verde), 10 = Agotamiento (Rojo) */}
                    <WellnessSliderCard
                      id="fatiga"
                      titulo="Fatiga"
                      pregunta="¿Nivel de cansancio o pesadez en el cuerpo?"
                      icon={Zap}
                      value={fatiga}
                      onChange={setFatiga}
                      positive={false} // 0 = fresco/sin fatiga (verde), 10 = agotamiento (rojo)
                      minLabel="0 (Cero fatiga / Cuerpo liviano)"
                      maxLabel="10 (Agotamiento extremo)"
                    />

                    {/* 3. ESTRÉS: 0 = Relajado/Tranquilo (Verde), 10 = Mucho estrés (Rojo) */}
                    <WellnessSliderCard
                      id="estres"
                      titulo="Estrés"
                      pregunta="¿Nivel de tensión mental o preocupaciones?"
                      icon={Brain}
                      value={estres}
                      onChange={setEstres}
                      positive={false} // 0 = relajado (verde), 10 = estrés alto (rojo)
                      minLabel="0 (Tranquilo / Cero estrés)"
                      maxLabel="10 (Mucha tensión / Presión)"
                    />

                    {/* 4. ENERGÍA / DESGANO: 0 = Al 100% (Verde), 10 = Sin energía / Vaciado (Rojo) */}
                    <WellnessSliderCard
                      id="energia"
                      titulo="Energía"
                      pregunta="¿Nivel de falta de energía o desgano?"
                      icon={BatteryCharging}
                      value={energia}
                      onChange={setEnergia}
                      positive={false} // 0 = lleno de energía (verde), 10 = sin batería (rojo)
                      minLabel="0 (Al 100% / Batería llena)"
                      maxLabel="10 (Sin energía / Vaciado)"
                    />

                    {/* 5. DOLOR: 0 = Cero dolor (Verde), 10 = Dolor agudo (Rojo) */}
                    <WellnessSliderCard
                      id="dolor"
                      titulo="Dolor"
                      pregunta="¿Nivel de dolores o agujetas musculares?"
                      icon={ShieldAlert}
                      value={dolor}
                      onChange={setDolor}
                      positive={false} // 0 = cero dolor (verde), 10 = dolor fuerte (rojo)
                      minLabel="0 (Sin dolor muscular)"
                      maxLabel="10 (Dolor fuerte / Agudo)"
                    />

                    {/* 6. ESQUELETO Y GRUPOS MUSCULARES */}
                    <BodyMapSkeleton
                      zonasSeleccionadas={zonasDolor}
                      onToggleZona={handleToggleZona}
                      onLimpiarZonas={handleLimpiarZonas}
                      observaciones={observaciones}
                      onChangeObservaciones={setObservaciones}
                    />

                    {/* 7. BOTÓN DE ENVÍO */}
                    <button
                      type="submit"
                      className="wellness-btn-submit"
                    >
                      <Send size={16} />
                      <span>ENVIAR MI REPORTE HOY</span>
                    </button>
                  </form>
                )}
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
}
