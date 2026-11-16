import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Sparkles, 
  RotateCw, 
  AlertCircle, 
  Eye, 
  Search, 
  Filter, 
  Compass, 
  ChevronRight, 
  X, 
  Award,
  FileText,
  Layers,
  Map as MapIcon
} from 'lucide-react';
import { PROVINCIAS_MAPA, ARGENTINA_VIEWBOX, REGIONES_INFO } from './argentinaMapData';
import { ESTADO_STYLES, getEstadoStyle } from './CaptacionModule';
import { normalizeEstado, POSICIONES_CAPTACION } from './ProspectoFormulario';

/**
 * Obtiene la provincia de un prospecto de forma normalizada,
 * con inferencia automática inteligente para registros antiguos sin provincia explícita.
 */
export function getProspectoProvincia(p) {
  if (p?.provincia && String(p.provincia).trim()) {
    const raw = String(p.provincia).trim();
    if (raw.toLowerCase().includes('ciudad') || raw.toLowerCase().includes('capital')) return 'CABA';
    return raw;
  }
  const txt = `${p?.club || ''} ${p?.localidad || ''}`.toLowerCase();
  if (/talleres|belgrano|instituto|córdoba|cordoba|río cuarto|rio cuarto|villa maría/.test(txt)) return 'Córdoba';
  if (/newell|rosario central|colón|colon|unión|union|rafaela|santa fe/.test(txt)) return 'Santa Fe';
  if (/godoy cruz|independiente rivadavia|gimnasia mendoza|mendoza/.test(txt)) return 'Mendoza';
  if (/atlético tucumán|atletico tucuman|san martín tucumán|san martin tucuman|tucumán|tucuman/.test(txt)) return 'Tucumán';
  if (/gimnasia jujuy|jujuy/.test(txt)) return 'Jujuy';
  if (/central córdoba sd|central cordoba sd|mitre sde|güemes|santiago del estero/.test(txt)) return 'Santiago del Estero';
  if (/patronato|paraná|concordia|entre ríos|entre rios/.test(txt)) return 'Entre Ríos';
  if (/boca unidos|corrientes|goya/.test(txt)) return 'Corrientes';
  if (/guaraní antonio franco|crucero del norte|posadas|misiones/.test(txt)) return 'Misiones';
  if (/chaco for ever|sarmiento resistencia|chaco/.test(txt)) return 'Chaco';
  if (/san martín sj|san martin sj|san juan/.test(txt)) return 'San Juan';
  if (/juventud unida sl|estudiantes sl|san luis/.test(txt)) return 'San Luis';
  if (/cipolletti|bariloche|río negro|rio negro/.test(txt)) return 'Río Negro';
  if (/guillermo brown|madryn|comodoro|chubut/.test(txt)) return 'Chubut';
  if (/boca|river|velez|vélez|san lorenzo|huracán|huracan|ferro|argentinos|caba|capital federal/.test(txt)) return 'CABA';
  return 'Buenos Aires';
}

export default function MapaArgentina({ 
  prospectos = [], 
  onVolverTabla, 
  onVerFicha,
  onVerEnTablaConFiltro,
  tema = 'claro'
}) {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState(null);
  const [hoveredProvincia, setHoveredProvincia] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Filtros internos del Mapa
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroPosicion, setFiltroPosicion] = useState('Todas');
  const [filtroRegion, setFiltroRegion] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Prospectos filtrados según controles superiores
  const prospectosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return prospectos.filter(p => {
      if (filtroEstado !== 'Todos') {
        if (normalizeEstado(p.estado) !== normalizeEstado(filtroEstado)) return false;
      }
      if (filtroPosicion !== 'Todas' && p.posicion !== filtroPosicion) return false;
      if (filtroRegion !== 'Todas') {
        const prov = getProspectoProvincia(p);
        const mapProv = PROVINCIAS_MAPA.find(m => m.nombre === prov);
        if (mapProv?.region !== filtroRegion) return false;
      }
      if (!q) return true;
      const prov = getProspectoProvincia(p);
      return (
        (p.jugador || '').toLowerCase().includes(q) ||
        (p.club || '').toLowerCase().includes(q) ||
        (p.localidad || '').toLowerCase().includes(q) ||
        prov.toLowerCase().includes(q) ||
        (p.posicion || '').toLowerCase().includes(q)
      );
    });
  }, [prospectos, filtroEstado, filtroPosicion, filtroRegion, busqueda]);

  // Agrupación y conteo por provincia
  const { conteoPorProvincia, maxConteo, statsGlobales } = useMemo(() => {
    const conteo = {};
    PROVINCIAS_MAPA.forEach(p => {
      conteo[p.nombre] = {
        total: 0,
        fichados: 0,
        volver: 0,
        fuera: 0,
        enSeguimiento: 0,
        prospectos: []
      };
    });

    let totalJugadores = 0;
    let ambaCabaCount = 0;

    prospectosFiltrados.forEach(p => {
      const prov = getProspectoProvincia(p);
      if (!conteo[prov]) {
        conteo[prov] = { total: 0, fichados: 0, volver: 0, fuera: 0, enSeguimiento: 0, prospectos: [] };
      }
      conteo[prov].total += 1;
      conteo[prov].prospectos.push(p);

      const norm = normalizeEstado(p.estado);
      if (norm === 'Fichado') conteo[prov].fichados += 1;
      else if (norm === 'Tiene que volver') conteo[prov].volver += 1;
      else if (norm === 'Queda fuera') conteo[prov].fuera += 1;
      else conteo[prov].enSeguimiento += 1;

      totalJugadores += 1;
      if (prov === 'Buenos Aires' || prov === 'CABA') {
        ambaCabaCount += 1;
      }
    });

    let max = 0;
    let provConMas = 'Ninguna';
    let provConMasTotal = 0;
    let provinciasConProspectos = 0;

    Object.entries(conteo).forEach(([nombre, data]) => {
      if (data.total > max) {
        max = data.total;
        provConMas = nombre;
        provConMasTotal = data.total;
      }
      if (data.total > 0) provinciasConProspectos += 1;
    });

    const interiorCount = totalJugadores - ambaCabaCount;
    const pctInterior = totalJugadores > 0 ? Math.round((interiorCount / totalJugadores) * 100) : 0;
    const pctAmba = totalJugadores > 0 ? 100 - pctInterior : 0;

    return {
      conteoPorProvincia: conteo,
      maxConteo: max,
      statsGlobales: {
        totalJugadores,
        provinciasConProspectos,
        provConMas,
        provConMasTotal,
        ambaCabaCount,
        interiorCount,
        pctAmba,
        pctInterior
      }
    };
  }, [prospectosFiltrados]);

  // Ranking Top Provincias
  const rankingProvincias = useMemo(() => {
    return Object.entries(conteoPorProvincia)
      .filter(([_, data]) => data.total > 0)
      .sort((a, b) => b[1].total - a[1].total);
  }, [conteoPorProvincia]);

  // Distribución por regiones
  const distribucionRegiones = useMemo(() => {
    const reg = {};
    Object.keys(REGIONES_INFO).forEach(r => {
      reg[r] = { total: 0, color: REGIONES_INFO[r].color, label: REGIONES_INFO[r].label };
    });

    PROVINCIAS_MAPA.forEach(p => {
      const cant = conteoPorProvincia[p.nombre]?.total || 0;
      if (reg[p.region]) {
        reg[p.region].total += cant;
      }
    });

    return Object.entries(reg).map(([region, d]) => ({
      region,
      ...d,
      pct: statsGlobales.totalJugadores > 0 ? Math.round((d.total / statsGlobales.totalJugadores) * 100) : 0
    }));
  }, [conteoPorProvincia, statsGlobales.totalJugadores]);

  // Jugadores a mostrar en la columna lateral
  const jugadoresAMostrar = useMemo(() => {
    if (provinciaSeleccionada) {
      return conteoPorProvincia[provinciaSeleccionada]?.prospectos || [];
    }
    return prospectosFiltrados;
  }, [provinciaSeleccionada, conteoPorProvincia, prospectosFiltrados]);

  // Color de relleno de provincia según densidad de prospectos
  const getProvinceFill = (provNombre) => {
    const data = conteoPorProvincia[provNombre];
    const total = data ? data.total : 0;
    const isSelected = provinciaSeleccionada === provNombre;
    const isHovered = hoveredProvincia?.nombre === provNombre;

    if (isSelected) {
      return '#002B66';
    }
    if (isHovered) {
      return total > 0 ? '#38bdf8' : 'rgba(0, 43, 102, 0.25)';
    }
    if (total === 0) {
      return tema === 'oscuro' ? '#182438' : '#e2e8f0';
    }
    if (maxConteo <= 1) return 'rgba(0, 43, 102, 0.65)';
    
    // Escala de intensidad celeste Integral
    const ratio = total / maxConteo;
    if (ratio >= 0.8) return '#002B66';
    if (ratio >= 0.5) return 'rgba(0, 43, 102, 0.85)';
    if (ratio >= 0.25) return 'rgba(0, 43, 102, 0.60)';
    return 'rgba(0, 43, 102, 0.40)';
  };

  const handleMouseMove = (e, prov) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX,
      y: e.clientY
    });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* ─── BARRA SUPERIOR CON BOTÓN VOLVER Y TÍTULO ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onVolverTabla}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              color: '#000000',
              border: '1.5px solid #ffffff',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={16} color="#000000" />
            <span style={{ color: '#000000' }}>Volver a la Tabla</span>
          </button>

          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-head)' }}>
              Fútbol Formativo · Red de Captación Nacional
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '2px 0 0', fontFamily: 'var(--font-head)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={22} color="#ffffff" />
              <span style={{ color: '#ffffff' }}>Mapa Federal de Prospectos</span>
            </h2>
          </div>
        </div>

        {/* Indicador de cobertura */}
        <div style={{ 
          background: 'var(--card2)', 
          border: '1px solid var(--border-card)', 
          padding: '8px 16px', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Provincias con Presencia
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>
              <span style={{ color: 'var(--celeste)' }}>{statsGlobales.provinciasConProspectos}</span>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}> / 24 Provincias</span>
            </div>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'var(--border-card)' }} />
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Distribución Federal
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
              AMBA <strong style={{ color: 'var(--celeste)' }}>{statsGlobales.pctAmba}%</strong> · Interior <strong style={{ color: '#10B981' }}>{statsGlobales.pctInterior}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TARJETAS DE MÉTRICAS RÁPIDAS DEL MAPA ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid var(--celeste)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
              JUGADORES EN MAPA
            </span>
            <Users size={16} color="var(--celeste)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)', marginTop: '2px', fontFamily: 'var(--font-head)' }}>
            {statsGlobales.totalJugadores}
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
              PROVINCIA LÍDER
            </span>
            <Award size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {statsGlobales.provConMas} ({statsGlobales.provConMasTotal})
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
              INTERIOR DEL PAÍS
            </span>
            <MapPin size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#F59E0B', marginTop: '2px', fontFamily: 'var(--font-head)' }}>
            {statsGlobales.interiorCount} <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>({statsGlobales.pctInterior}%)</span>
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
              SELECCIÓN ACTIVA
            </span>
            <Layers size={16} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '14.5px', fontWeight: 900, color: 'var(--text)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {provinciaSeleccionada ? provinciaSeleccionada : 'Todo el País'}
          </div>
        </div>
      </div>

      {/* ─── BARRA DE FILTROS DEL MAPA ─── */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text"
              placeholder="Buscar por jugador, localidad, club o provincia..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                border: '1px solid var(--border-card)',
                background: 'var(--card2)',
                color: 'var(--text)',
                fontSize: '12.5px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Filtro Estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700 }}>Estado:</span>
              <select 
                className="sel"
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                style={{ fontSize: '12px', padding: '6px 10px', marginBottom: 0 }}
              >
                <option value="Todos">Todos</option>
                <option value="Fichado">Fichados</option>
                <option value="Tiene que volver">Tienen que volver</option>
                <option value="Queda fuera">Quedan fuera</option>
                <option value="En seguimiento">En seguimiento</option>
                <option value="Citado a prueba">Citados a prueba</option>
              </select>
            </div>

            {/* Filtro Posición */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700 }}>Posición:</span>
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

            {/* Filtro Región */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700 }}>Región:</span>
              <select 
                className="sel"
                value={filtroRegion}
                onChange={e => setFiltroRegion(e.target.value)}
                style={{ fontSize: '12px', padding: '6px 10px', marginBottom: 0 }}
              >
                <option value="Todas">Todas las regiones</option>
                {Object.keys(REGIONES_INFO).map(r => (
                  <option key={r} value={r}>{REGIONES_INFO[r].label}</option>
                ))}
              </select>
            </div>

            {/* Reset Filtros */}
            {(filtroEstado !== 'Todos' || filtroPosicion !== 'Todas' || filtroRegion !== 'Todas' || busqueda || provinciaSeleccionada) && (
              <button
                type="button"
                onClick={() => {
                  setFiltroEstado('Todos');
                  setFiltroPosicion('Todas');
                  setFiltroRegion('Todas');
                  setBusqueda('');
                  setProvinciaSeleccionada(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--muted)',
                  color: 'var(--muted)',
                  borderRadius: '7px',
                  padding: '6px 10px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={12} />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── CUERPO PRINCIPAL: MAPA INTERACTIVO + PANEL LATERAL ─── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(340px, 520px) 1fr', 
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* COLUMNA IZQUIERDA: EL MAPA SVG DE ARGENTINA */}
        <div className="card" style={{ padding: '20px', borderRadius: '18px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapIcon size={16} color="var(--celeste)" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mapa de la República Argentina
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Hacé clic en una provincia para filtrar
            </div>
          </div>

          {/* CONTENEDOR DEL SVG */}
          <div style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            position: 'relative',
            background: tema === 'oscuro' ? '#0d1624' : '#f8fafc',
            borderRadius: '14px',
            padding: '16px 8px',
            border: '1px solid var(--border-card)',
            minHeight: '620px'
          }}>
            <svg
              viewBox={ARGENTINA_VIEWBOX}
              style={{
                width: '100%',
                maxHeight: '680px',
                height: 'auto',
                
              }}
            >
              {/* Provincias (paths) */}
              {PROVINCIAS_MAPA.map(prov => {
                const total = conteoPorProvincia[prov.nombre]?.total || 0;
                const isSelected = provinciaSeleccionada === prov.nombre;
                const isHovered = hoveredProvincia?.nombre === prov.nombre;

                return (
                  <path
                    key={prov.id}
                    id={prov.id}
                    d={prov.d}
                    fill={getProvinceFill(prov.nombre)}
                    stroke={isSelected ? '#ffffff' : isHovered ? '#002B66' : tema === 'oscuro' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.2)'}
                    strokeWidth={isSelected ? '2.4' : isHovered ? '1.8' : '0.8'}
                    style={{
                      cursor: 'pointer',
                      transition: 'fill 0.15s ease, stroke 0.15s ease, stroke-width 0.15s ease'
                    }}
                    onClick={() => {
                      if (provinciaSeleccionada === prov.nombre) {
                        setProvinciaSeleccionada(null);
                      } else {
                        setProvinciaSeleccionada(prov.nombre);
                      }
                    }}
                    onMouseEnter={(e) => {
                      setHoveredProvincia(prov);
                      handleMouseMove(e, prov);
                    }}
                    onMouseMove={(e) => handleMouseMove(e, prov)}
                    onMouseLeave={() => setHoveredProvincia(null)}
                  />
                );
              })}

              {/* Pin interactivo y destacado para CABA (Ciudad Autónoma de Buenos Aires) */}
              <g 
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setProvinciaSeleccionada(provinciaSeleccionada === 'CABA' ? null : 'CABA');
                }}
                onMouseEnter={(e) => {
                  const cabaMeta = PROVINCIAS_MAPA.find(p => p.nombre === 'CABA');
                  setHoveredProvincia(cabaMeta);
                  handleMouseMove(e, cabaMeta);
                }}
                onMouseLeave={() => setHoveredProvincia(null)}
              >
                {/* Línea guía de CABA */}
                <line 
                  x1={274.3} 
                  y1={263.3} 
                  x2={305} 
                  y2={250} 
                  stroke="var(--celeste)" 
                  strokeWidth="1.2" 
                  strokeDasharray="2,2" 
                />
                <circle 
                  cx={305} 
                  cy={250} 
                  r={provinciaSeleccionada === 'CABA' ? 8 : 6} 
                  fill={conteoPorProvincia['CABA']?.total > 0 ? 'var(--celeste)' : '#64748b'} 
                  stroke="#ffffff" 
                  strokeWidth="1.5" 
                />
                <text 
                  x={315} 
                  y={253} 
                  fontSize="9.5" 
                  fontWeight="800" 
                  fill="var(--text)"
                  style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}
                >
                  CABA {conteoPorProvincia['CABA']?.total > 0 ? `(${conteoPorProvincia['CABA'].total})` : ''}
                </text>
              </g>

              {/* Badges circulares con la cantidad de prospectos sobre cada provincia activa */}
              {PROVINCIAS_MAPA.map(prov => {
                const total = conteoPorProvincia[prov.nombre]?.total || 0;
                if (total === 0 || prov.nombre === 'CABA') return null;

                const cx = prov.pinOffset ? prov.cx + prov.pinOffset[0] : prov.cx;
                const cy = prov.pinOffset ? prov.cy + prov.pinOffset[1] : prov.cy;
                const isSelected = provinciaSeleccionada === prov.nombre;

                return (
                  <g 
                    key={`badge-${prov.id}`}
                    transform={`translate(${cx}, ${cy})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    <circle 
                      r={isSelected ? 10 : 8} 
                      fill="#ffffff" 
                      stroke="var(--celeste)" 
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      
                    />
                    <text 
                      textAnchor="middle" 
                      dominantBaseline="central" 
                      fontSize={isSelected ? '9.5' : '8.5'} 
                      fontWeight="900" 
                      fill="#000000"
                      style={{ fontFamily: 'sans-serif' }}
                    >
                      {total}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Referencias del Mapa (Leyenda) */}
            <div style={{
              position: 'absolute',
              bottom: '14px',
              left: '14px',
              background: 'var(--card)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '10.5px'
            }}>
              <div style={{ fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', color: 'var(--muted)', fontSize: '9.5px' }}>
                Intensidad de Captación
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: tema === 'oscuro' ? '#182438' : '#e2e8f0', display: 'inline-block' }} />
                <span>0</span>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(0, 43, 102, 0.45)', display: 'inline-block' }} />
                <span>1-2</span>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(0, 43, 102, 0.85)', display: 'inline-block' }} />
                <span>3+</span>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#002B66', display: 'inline-block' }} />
                <span>Líder</span>
              </div>
            </div>
          </div>

          {/* TOOLTIP FLOTANTE AL PASAR EL MOUSE */}
          {hoveredProvincia && (
            <div style={{
              position: 'fixed',
              left: `${tooltipPos.x + 15}px`,
              top: `${tooltipPos.y - 15}px`,
              background: 'var(--card)',
              border: '1.5px solid var(--celeste)',
              color: 'var(--text)',
              padding: '10px 14px',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
              zIndex: 99999,
              minWidth: '180px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{hoveredProvincia.nombre}</strong>
                <span style={{ 
                  fontSize: '9.5px', 
                  fontWeight: 700, 
                  background: 'rgba(0, 43, 102, 0.1)', 
                  color: 'var(--celeste)', 
                  padding: '2px 6px', 
                  borderRadius: '4px' 
                }}>
                  {hoveredProvincia.region}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--celeste)', marginBottom: '6px' }}>
                {conteoPorProvincia[hoveredProvincia.nombre]?.total || 0} prospectos registrados
              </div>

              {conteoPorProvincia[hoveredProvincia.nombre]?.total > 0 && (
                <div style={{ fontSize: '10.5px', borderTop: '1px solid var(--border-card)', paddingTop: '5px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                  <span style={{ color: '#10B981' }}>Fichados: {conteoPorProvincia[hoveredProvincia.nombre].fichados}</span>
                  <span style={{ color: '#F59E0B' }}>Volver: {conteoPorProvincia[hoveredProvincia.nombre].volver}</span>
                  <span style={{ color: '#EF4444' }}>Fuera: {conteoPorProvincia[hoveredProvincia.nombre].fuera}</span>
                  <span style={{ color: '#002B66' }}>Seguimiento: {conteoPorProvincia[hoveredProvincia.nombre].enSeguimiento}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: DETALLE DE JUGADORES + RANKING FEDERAL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tarjeta de Lista de Jugadores de la Provincia Seleccionada o General */}
          <div className="card" style={{ padding: '20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--celeste)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {provinciaSeleccionada ? 'Futbolistas en esta Provincia' : 'Futbolistas Evaluados (Nacional)'}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text)', margin: '2px 0 0', fontFamily: 'var(--font-head)' }}>
                  {provinciaSeleccionada ? provinciaSeleccionada : 'Todos los Prospectos'}
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', marginLeft: '8px' }}>
                    ({jugadoresAMostrar.length} {jugadoresAMostrar.length === 1 ? 'jugador' : 'jugadores'})
                  </span>
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {provinciaSeleccionada && (
                  <>
                    <button
                      type="button"
                      onClick={() => onVerEnTablaConFiltro(provinciaSeleccionada)}
                      title="Ver estos futbolistas en la tabla principal con todos los detalles"
                      style={{
                        background: 'var(--celeste)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0, 43, 102, 0.25)'
                      }}
                    >
                      <FileText size={12} color="#ffffff" />
                      <span style={{ color: '#ffffff' }}>Ver en Tabla</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvinciaSeleccionada(null)}
                      title="Desmarcar provincia"
                      style={{
                        background: 'var(--card2)',
                        color: 'var(--text)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <X size={12} />
                      <span>Ver Todos</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Lista scrollable de jugadores */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {jugadoresAMostrar.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>
                  <Users size={32} color="var(--celeste)" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                  <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>
                    {provinciaSeleccionada 
                      ? `No hay prospectos registrados actualmente en ${provinciaSeleccionada}.`
                      : 'No se encontraron prospectos con los filtros activos.'}
                  </p>
                  <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
                    Probá seleccionando otra provincia en el mapa o limpiando los filtros.
                  </p>
                </div>
              ) : (
                jugadoresAMostrar.map(p => {
                  const prov = getProspectoProvincia(p);
                  const estStyle = getEstadoStyle(p.estado);
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: 'var(--card2)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'border-color 0.15s ease'
                      }}
                      className="table-row-hover"
                    >
                      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span 
                            onClick={() => onVerFicha(p)}
                            style={{ 
                              fontWeight: 800, 
                              fontSize: '13.5px', 
                              color: 'var(--text)', 
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Hacé clic para ver la ficha técnica completa"
                          >
                            {p.jugador}
                            <FileText size={12} color="var(--celeste)" />
                          </span>

                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            background: estStyle.bg,
                            color: estStyle.text,
                            border: `1px solid ${estStyle.border}`
                          }}>
                            {p.estado || 'En seguimiento'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '11.5px', color: 'var(--muted)', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text)', fontWeight: 600 }}>
                            <MapPin size={11} color="var(--celeste)" />
                            {p.localidad ? `${p.localidad}, ${prov}` : prov}
                          </span>
                          <span>·</span>
                          <span>Club: <strong>{p.club || 'Libre'}</strong></span>
                          <span>·</span>
                          <span style={{ color: 'var(--celeste)', fontWeight: 700 }}>{p.posicion}</span>
                          {p.nacimiento && <span>(Cat {p.nacimiento})</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.notaGlobal && (
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>NOTA</div>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '5px',
                              fontWeight: 900,
                              fontSize: '11.5px',
                              background: p.notaGlobal >= 8 ? '#10B981' : 'var(--celeste)',
                              color: '#ffffff'
                            }}>
                              {p.notaGlobal}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => onVerFicha(p)}
                          title="Ver Ficha Técnica Completa"
                          style={{
                            background: 'transparent',
                            color: 'var(--text)',
                            border: '1.5px solid var(--border-card)',
                            borderRadius: '8px',
                            padding: '6px 9px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <Eye size={12} color="var(--celeste)" />
                          <span>Ficha</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Ranking Top 5 Provincias */}
          <div className="card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                RANKING DE CAPTACIÓN POR PROVINCIA
              </span>
              <Award size={15} color="#10B981" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rankingProvincias.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Sin datos para mostrar.</div>
              ) : (
                rankingProvincias.slice(0, 5).map(([nombre, d], idx) => {
                  const pct = statsGlobales.totalJugadores > 0 ? Math.round((d.total / statsGlobales.totalJugadores) * 100) : 0;
                  const isSelected = provinciaSeleccionada === nombre;
                  return (
                    <div 
                      key={nombre}
                      onClick={() => setProvinciaSeleccionada(isSelected ? null : nombre)}
                      style={{
                        cursor: 'pointer',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(0, 43, 102, 0.12)' : 'transparent',
                        border: isSelected ? '1px solid var(--celeste)' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 800, color: isSelected ? 'var(--celeste)' : 'var(--text)' }}>
                          {idx + 1}. {nombre}
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: '12px' }}>
                          {d.total} {d.total === 1 ? 'jugador' : 'jugadores'} <span style={{ color: 'var(--muted)', fontSize: '11px' }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--border-card)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isSelected ? 'var(--celeste)' : '#10B981', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Distribución por Región Geográfica */}
          <div className="card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                DISTRIBUCIÓN POR REGIÓN
              </span>
              <Compass size={15} color="var(--celeste)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {distribucionRegiones.map(r => (
                <div 
                  key={r.region}
                  onClick={() => setFiltroRegion(filtroRegion === r.region ? 'Todas' : r.region)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: filtroRegion === r.region ? `${r.color}20` : 'var(--card2)',
                    border: `1px solid ${filtroRegion === r.region ? r.color : 'var(--border-card)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 800, color: r.color }}>{r.label}</span>
                    <strong style={{ color: 'var(--text)' }}>{r.total}</strong>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--border-card)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
