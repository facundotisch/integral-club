import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, User, Calendar, Shield, Award, Phone, CheckCircle, AlertCircle } from 'lucide-react';

export const POSICIONES_CAPTACION = [
  'Volante Mixto',
  'Volante Central',
  'Defensor Central',
  'Defensor Lateral',
  'Extremo',
  'Delantero',
  'Arquero'
];

export function normalizeEstado(est) {
  if (!est) return 'En seguimiento';
  const s = String(est).trim().toLowerCase();
  if (/fichad|aprob/.test(s)) return 'Fichado';
  if (/volver/.test(s)) return 'Tiene que volver';
  if (/fuera|descart/.test(s)) return 'Queda fuera';
  if (/citad|prueba/.test(s)) return 'Citado a prueba';
  return 'En seguimiento';
}

export const ESTADOS_CAPTACION = [
  { value: 'Fichado', label: 'Fichado', color: '#10B981' },
  { value: 'Tiene que volver', label: 'Tiene que volver', color: '#F59E0B' },
  { value: 'Queda fuera', label: 'Queda fuera', color: '#EF4444' },
  { value: 'En seguimiento', label: 'En seguimiento', color: '#002B66' },
  { value: 'Citado a prueba', label: 'Citado a prueba', color: '#8B5CF6' }
];

export const PROVINCIAS_ARGENTINA = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
];

const MESES = [
  { val: '01', label: '01 - Enero' },
  { val: '02', label: '02 - Febrero' },
  { val: '03', label: '03 - Marzo' },
  { val: '04', label: '04 - Abril' },
  { val: '05', label: '05 - Mayo' },
  { val: '06', label: '06 - Junio' },
  { val: '07', label: '07 - Julio' },
  { val: '08', label: '08 - Agosto' },
  { val: '09', label: '09 - Septiembre' },
  { val: '10', label: '10 - Octubre' },
  { val: '11', label: '11 - Noviembre' },
  { val: '12', label: '12 - Diciembre' }
];

export default function ProspectoFormulario({ prospecto, nextSuggestedId, onSave, onVolver }) {
  const isEditing = !!(prospecto && prospecto.id);

  // Parsear fecha inicial (DD/MM/AAAA o YYYY-MM-DD o hoy)
  const parseFechaInicial = (fStr) => {
    const hoy = new Date();
    let d = ('0' + hoy.getDate()).slice(-2);
    let m = ('0' + (hoy.getMonth() + 1)).slice(-2);
    let a = String(hoy.getFullYear());

    if (fStr) {
      if (fStr.includes('/')) {
        const parts = fStr.split('/');
        if (parts.length === 3) {
          d = ('0' + parseInt(parts[0], 10)).slice(-2);
          m = ('0' + parseInt(parts[1], 10)).slice(-2);
          a = parts[2].length === 2 ? ('20' + parts[2]) : parts[2];
        }
      } else if (fStr.includes('-')) {
        const parts = fStr.split('-');
        if (parts.length === 3) {
          a = parts[0];
          m = ('0' + parseInt(parts[1], 10)).slice(-2);
          d = ('0' + parseInt(parts[2], 10)).slice(-2);
        }
      }
    }
    return { dia: d, mes: m, anio: a };
  };

  const initDate = parseFechaInicial(prospecto?.fecha);

  const [dia, setDia] = useState(initDate.dia);
  const [mes, setMes] = useState(initDate.mes);
  const [anio, setAnio] = useState(initDate.anio);

  const [jugador, setJugador] = useState(prospecto?.jugador || '');
  const [nacimiento, setNacimiento] = useState(prospecto?.nacimiento || '2009');
  const [posicion, setPosicion] = useState(prospecto?.posicion || 'Volante Mixto');
  const [posicionSec, setPosicionSec] = useState(prospecto?.posicionSec || '');
  const [pierna, setPierna] = useState(prospecto?.pierna || 'Derecha');
  const [club, setClub] = useState(prospecto?.club || '');
  const [provincia, setProvincia] = useState(prospecto?.provincia || 'Buenos Aires');
  const [localidad, setLocalidad] = useState(prospecto?.localidad || '');
  const [scout, setScout] = useState(prospecto?.scout || '');
  const [telefono, setTelefono] = useState(prospecto?.telefono || '');
  const [estado, setEstado] = useState(() => normalizeEstado(prospecto?.estado));

  const [fisico, setFisico] = useState(prospecto?.fisico !== null && prospecto?.fisico !== undefined ? Number(prospecto.fisico) : 7);
  const [tecnico, setTecnico] = useState(prospecto?.tecnico !== null && prospecto?.tecnico !== undefined ? Number(prospecto.tecnico) : 7);
  const [tactico, setTactico] = useState(prospecto?.tactico !== null && prospecto?.tactico !== undefined ? Number(prospecto.tactico) : 7);

  const [informe, setInforme] = useState(prospecto?.informe || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cálculo automático en tiempo real de la Nota Global como promedio exacto
  const notaGlobalPromedio = useMemo(() => {
    const f = Number(fisico) || 0;
    const te = Number(tecnico) || 0;
    const ta = Number(tactico) || 0;
    const count = (f > 0 ? 1 : 0) + (te > 0 ? 1 : 0) + (ta > 0 ? 1 : 0);
    if (count === 0) return 0;
    return Math.round(((f + te + ta) / count) * 10) / 10;
  }, [fisico, tecnico, tactico]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jugador.trim()) {
      setError('Por favor ingresá el nombre y apellido del prospecto.');
      return;
    }

    // Formatear fecha en DD/MM/AAAA
    const dVal = ('0' + (parseInt(dia, 10) || 1)).slice(-2);
    const mVal = ('0' + (parseInt(mes, 10) || 1)).slice(-2);
    const aVal = String(parseInt(anio, 10) || new Date().getFullYear());
    const fechaFinal = `${dVal}/${mVal}/${aVal}`;

    const payload = {
      ...(isEditing && prospecto?.id ? { id: prospecto.id } : {}),
      fecha: fechaFinal,
      jugador: jugador.trim(),
      nacimiento: nacimiento.trim(),
      posicion,
      posicionSec: posicionSec.trim(),
      pierna,
      club: club.trim(),
      provincia: (provincia || 'Buenos Aires').trim(),
      localidad: localidad.trim(),
      scout: scout.trim(),
      telefono: telefono.trim(),
      estado,
      notaGlobal: notaGlobalPromedio,
      fisico,
      tecnico,
      tactico,
      informe: informe.trim()
    };

    setSaving(true);
    setError(null);
    try {
      await onSave(payload, isEditing);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al guardar el prospecto.');
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Botón superior Volver */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onVolver}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--card2)',
            color: 'var(--text)',
            border: '1.5px solid var(--border-card)',
            padding: '9px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={16} />
          <span style={{ color: 'var(--text)' }}>Volver al Listado</span>
        </button>

        <span style={{ 
          fontSize: '12px', 
          color: '#ffffff', 
          background: 'rgba(255, 255, 255, 0.22)', 
          padding: '6px 14px', 
          borderRadius: '20px', 
          fontWeight: 700,
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          {isEditing ? 'Modificando Ficha' : 'Nueva Ficha de Jugador'}
        </span>
      </div>

      <div className="card" style={{ padding: '32px 36px', borderRadius: '20px' }}>
        {/* Cabecera del formulario */}
        <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '18px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--celeste)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-head)' }}>
            Integral Club · Área de Scouting
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: '4px 0 0', fontFamily: 'var(--font-head)' }}>
            {isEditing ? 'Modificar Ficha de Prospecto' : 'Cargar Nuevo Prospecto'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0' }}>
            Completá los datos del futbolista evaluado. Los cambios se guardarán automáticamente en la base de datos.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Bloque 1: Identificación y Fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', marginBottom: '18px' }}>
            {/* Nombre y Apellido */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Nombre y Apellido *
              </label>
              <input
                type="text"
                placeholder="Ej: Nombre y Apellido"
                value={jugador}
                onChange={e => setJugador(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--card2)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Fecha: DÍA - MES - AÑO */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Fecha (Día / Mes / Año)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '55px 110px 65px', gap: '5px' }}>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="DD"
                  value={dia}
                  onChange={e => setDia(e.target.value)}
                  title="Día (1-31)"
                  style={{
                    padding: '10px 6px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-card)',
                    background: 'var(--card2)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}
                />
                <select
                  value={mes}
                  onChange={e => setMes(e.target.value)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-card)',
                    background: 'var(--card2)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    marginBottom: 0
                  }}
                >
                  {MESES.map(m => (
                    <option key={m.val} value={m.val}>{m.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  placeholder="AAAA"
                  value={anio}
                  onChange={e => setAnio(e.target.value)}
                  title="Año"
                  style={{
                    padding: '10px 6px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-card)',
                    background: 'var(--card2)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Características futbolísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Posición Principal *
              </label>
              <select
                className="sel"
                value={posicion}
                onChange={e => setPosicion(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: 0 }}
              >
                {POSICIONES_CAPTACION.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Año de Nacimiento / Cat
              </label>
              <input
                type="text"
                placeholder="Ej: 2008 / 5ta"
                value={nacimiento}
                onChange={e => setNacimiento(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--card2)',
                  color: 'var(--text)',
                  fontSize: '13.5px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Pierna Hábil
              </label>
              <select
                className="sel"
                value={pierna}
                onChange={e => setPierna(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: 0 }}
              >
                <option value="Derecha">Derecha</option>
                <option value="Izquierda">Izquierda</option>
                <option value="Ambidiestro">Ambidiestro</option>
              </select>
            </div>
          </div>

          {/* Bloque 3: Procedencia Geográfica y Origen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Provincia *
              </label>
              <select
                className="sel"
                value={provincia}
                onChange={e => setProvincia(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', fontSize: '13.5px', marginBottom: 0 }}
              >
                {PROVINCIAS_ARGENTINA.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Localidad / Ciudad
              </label>
              <input
                type="text"
                placeholder="Ej: Avellaneda, Rosario, Río Cuarto..."
                value={localidad}
                onChange={e => setLocalidad(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--card2)',
                  color: 'var(--text)',
                  fontSize: '13.5px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Club / Escuela de Origen
              </label>
              <input
                type="text"
                placeholder="Ej: Club / Escuela de fútbol"
                value={club}
                onChange={e => setClub(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--card2)',
                  color: 'var(--text)',
                  fontSize: '13.5px'
                }}
              />
            </div>
          </div>

          {/* Bloque 3.1: Scout y Contacto */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Scout / Observador
              </label>
              <input
                type="text"
                placeholder="Ej: Observador / Captador"
                value={scout}
                onChange={e => setScout(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--card2)',
                  color: 'var(--text)',
                  fontSize: '13.5px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Contacto / Teléfono
              </label>
              <input
                type="text"
                placeholder="Ej: 11 4455-6677"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-card)',
                  background: 'var(--card2)',
                  color: 'var(--text)',
                  fontSize: '13.5px'
                }}
              />
            </div>
          </div>

          {/* Bloque 4: Estado del Prospecto (Selector responsivo y limpio) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              Estado del Prospecto
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ESTADOS_CAPTACION.map(est => {
                const isSelected = estado === est.value || normalizeEstado(estado) === est.value;
                return (
                  <button
                    key={est.value}
                    type="button"
                    onClick={() => setEstado(est.value)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '24px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: `1.5px solid ${est.color}`,
                      background: isSelected ? est.color : 'transparent',
                      color: isSelected ? '#ffffff' : est.color,
                      boxShadow: isSelected ? `0 4px 12px ${est.color}40` : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {est.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bloque 5: Calificaciones con PROMEDIO AUTOMÁTICO */}
          <div style={{ background: 'var(--card2)', padding: '20px 22px', borderRadius: '16px', marginBottom: '22px', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--celeste)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Evaluación del Scout (Puntajes 1 al 10)
              </div>
              <div style={{
                background: notaGlobalPromedio >= 8 ? '#10B981' : notaGlobalPromedio >= 6 ? 'var(--celeste)' : '#6B7280',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 900,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Award size={15} />
                <span>Nota Global (Promedio Automático): <strong>{notaGlobalPromedio > 0 ? `${notaGlobalPromedio}/10` : '—'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '18px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  <span>Físico:</span>
                  <span style={{ color: '#10B981', fontWeight: 900 }}>{fisico}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={fisico}
                  onChange={e => setFisico(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10B981' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  <span>Técnico:</span>
                  <span style={{ color: '#3B82F6', fontWeight: 900 }}>{tecnico}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={tecnico}
                  onChange={e => setTecnico(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#3B82F6' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  <span>Táctico:</span>
                  <span style={{ color: '#8B5CF6', fontWeight: 900 }}>{tactico}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={tactico}
                  onChange={e => setTactico(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#8B5CF6' }}
                />
              </div>
            </div>
          </div>

          {/* Bloque 6: Informe / Observaciones */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Informe Técnico / Observaciones
            </label>
            <textarea
              rows={4}
              placeholder="Describí cualidades futbolísticas, biotipo, velocidad, perfil técnico, aptitudes destacadas y recomendaciones..."
              value={informe}
              onChange={e => setInforme(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-card)',
                background: 'var(--card2)',
                color: 'var(--text)',
                fontSize: '13.5px',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Botones de acción de alto contraste */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-card)', paddingTop: '20px' }}>
            <button
              type="button"
              onClick={onVolver}
              disabled={saving}
              style={{
                background: 'var(--card2)',
                border: '1.5px solid var(--border-card)',
                color: 'var(--text)',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'var(--celeste)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 800,
                padding: '10px 24px',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 43, 102, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Save size={16} color="#ffffff" />
              <span style={{ color: '#ffffff' }}>{saving ? 'Guardando...' : (isEditing ? 'Actualizar Prospecto' : 'Guardar Prospecto')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
