import React from 'react';
import { 
  X, 
  Printer, 
  Edit3, 
  User, 
  Calendar, 
  Award, 
  Phone, 
  Shield, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Activity,
  Compass
} from 'lucide-react';
import { ESTADOS_CAPTACION } from './ProspectoFormulario';

const ESTADO_STYLES = {
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
  'Citado a prueba': { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', border: '#8B5CF6' }
};

function getFichaEstadoStyle(estado) {
  if (!estado) return ESTADO_STYLES['En seguimiento'];
  if (ESTADO_STYLES[estado]) return ESTADO_STYLES[estado];
  const s = String(estado).trim().toLowerCase();
  if (/fichad|aprob/.test(s)) return ESTADO_STYLES['Fichado'];
  if (/volver/.test(s)) return ESTADO_STYLES['Tiene que volver'];
  if (/fuera|descart/.test(s)) return ESTADO_STYLES['Queda fuera'];
  if (/citad|prueba/.test(s)) return ESTADO_STYLES['Citado a prueba'];
  return ESTADO_STYLES['En seguimiento'];
}

export default function ProspectoFichaModal({ prospecto, idFormatted, onClose, onEditar }) {
  if (!prospecto) return null;

  const estStyle = getFichaEstadoStyle(prospecto.estado);

  // Exportar a PDF usando la ventana de impresión nativa optimizada
  const handleExportPDF = () => {
    const nombre = prospecto.jugador || 'Prospecto';
    const cleanTitle = `Ficha_Scouting_${nombre.replace(/[^a-zA-Z0-9_-]/g, '_')}_IntegralClub`;
    const origTitle = document.title;

    document.title = cleanTitle;
    document.body.classList.add('is-printing-ficha');

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = origTitle;
        document.body.classList.remove('is-printing-ficha');
      }, 500);
    }, 150);
  };

  const fisico = Number(prospecto.fisico) || 0;
  const tecnico = Number(prospecto.tecnico) || 0;
  const tactico = Number(prospecto.tactico) || 0;
  const notaGlobal = prospecto.notaGlobal || (
    Math.round(((fisico + tecnico + tactico) / 3) * 10) / 10
  );

  return (
    <div 
      className="ficha-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 15, 25, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="ficha-modal-card card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '28px 32px',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          background: 'var(--card)'
        }}
      >
        {/* Barra superior de controles (No imprimible) */}
        <div 
          className="ficha-no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 800, 
              color: 'var(--celeste)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              fontFamily: 'var(--font-head)'
            }}>
              Ficha Técnica de Evaluación
            </span>
            <span style={{
              background: 'rgba(42, 59, 96, 0.1)',
              color: 'var(--celeste)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              ID #{idFormatted}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Botón Exportar PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              title="Descargar o imprimir ficha en PDF"
              style={{
                background: 'var(--celeste)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '12.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(42, 59, 96, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Printer size={15} color="#ffffff" />
              <span>Exportar PDF</span>
            </button>

            {/* Botón Editar */}
            {onEditar && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditar(prospecto);
                }}
                title="Editar los datos de este jugador"
                style={{
                  background: 'var(--card2)',
                  color: 'var(--text)',
                  border: '1.5px solid var(--border-card)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={14} />
                <span>Editar</span>
              </button>
            )}

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={onClose}
              title="Cerrar ventana"
              style={{
                background: 'var(--card2)',
                border: '1.5px solid var(--border-card)',
                color: 'var(--text)',
                borderRadius: '10px',
                padding: '7px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── CONTENIDO OFICIAL DE LA FICHA (SE IMPRIME EN EL PDF) ─── */}
        <div className="ficha-printable-content">
          {/* Cabecera Institucional Integral Club */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--celeste)',
            paddingBottom: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img 
                src="/escudo.png" 
                alt="Integral Club" 
                style={{ width: '48px', height: 'auto', objectFit: 'contain' }} 
              />
              <div>
                <div style={{ 
                  fontFamily: 'var(--font-head)', 
                  fontWeight: 900, 
                  fontSize: '17px', 
                  color: 'var(--text)',
                  letterSpacing: '0.5px'
                }}>
                  INTEGRAL CLUB
                </div>
                <div style={{ fontSize: '12px', color: 'var(--celeste)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Fútbol Profesional & Formativo · Área de Scouting
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: 800,
                fontSize: '11.5px',
                background: estStyle.bg,
                color: estStyle.text,
                border: `1.5px solid ${estStyle.border}`
              }}>
                {prospecto.estado || 'En seguimiento'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', fontWeight: 600 }}>
                Fecha: <strong>{prospecto.fecha || '—'}</strong>
              </div>
            </div>
          </div>

          {/* Nombre y Posición Principal */}
          <div style={{
            background: 'var(--card2)',
            padding: '16px 20px',
            borderRadius: '14px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            border: '1px solid var(--border-card)'
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.5px' }}>
                Futbolista Evaluado
              </div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 900, 
                color: 'var(--text)', 
                margin: '2px 0 0',
                fontFamily: 'var(--font-head)'
              }}>
                {prospecto.jugador}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                background: 'rgba(42, 59, 96, 0.15)',
                color: 'var(--celeste)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                border: '1px solid rgba(42, 59, 96, 0.3)'
              }}>
                {prospecto.posicion}
              </span>
              {prospecto.posicionSec && (
                <span style={{
                  background: 'var(--card)',
                  color: 'var(--text)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: '1px solid var(--border-card)'
                }}>
                  Secundaria: {prospecto.posicionSec}
                </span>
              )}
            </div>
          </div>

          {/* Ficha de Datos Personales y de Captación */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '12px', 
            marginBottom: '20px' 
          }}>
            <div style={{ background: 'var(--card2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Categoría / Nacimiento
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '3px' }}>
                {prospecto.nacimiento || 'No informada'}
              </div>
            </div>

            <div style={{ background: 'var(--card2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Pierna Hábil
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '3px' }}>
                {prospecto.pierna || 'Derecha'}
              </div>
            </div>

            <div style={{ background: 'var(--card2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Club / Escuela de Origen
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '3px' }}>
                {prospecto.club || 'Libre / Sin club'}
              </div>
            </div>

            <div style={{ background: 'var(--card2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Procedencia / Provincia
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '3px' }}>
                {prospecto.provincia || 'Buenos Aires'}{prospecto.localidad ? ` (${prospecto.localidad})` : ''}
              </div>
            </div>

            <div style={{ background: 'var(--card2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Scout / Evaluador
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '3px' }}>
                {prospecto.scout || 'Área de Captación'}
              </div>
            </div>

            <div style={{ background: 'var(--card2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Contacto / Teléfono
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '3px' }}>
                {prospecto.telefono || 'Sin teléfono registrado'}
              </div>
            </div>

            <div style={{ background: 'var(--card2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Identificador de Registro
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--celeste)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                #{idFormatted}
              </div>
            </div>
          </div>

          {/* Bloque de Calificaciones y Nota Global */}
          <div style={{
            background: 'var(--card2)',
            padding: '20px 22px',
            borderRadius: '16px',
            border: '1px solid var(--border-card)',
            marginBottom: '20px'
          }}>
            <div style={{ 
              fontSize: '11.5px', 
              fontWeight: 800, 
              color: 'var(--celeste)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              marginBottom: '16px' 
            }}>
              Evaluación Técnica Cualitativa & Cuantitativa (Escala 1 al 10)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'center' }}>
              {/* Tarjeta de Nota Global Promedio */}
              <div style={{
                background: 'var(--card)',
                padding: '16px 20px',
                borderRadius: '14px',
                border: '1px solid var(--border-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: notaGlobal >= 8 ? '#10B981' : notaGlobal >= 6 ? 'var(--celeste)' : '#6B7280',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-head)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {notaGlobal}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                    Nota Global del Prospecto
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                    Promedio exacto de los aspectos físico, técnico y táctico.
                  </div>
                </div>
              </div>

              {/* Barras de Desglose */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text)' }}>Aspecto Físico:</span>
                    <span style={{ color: '#10B981', fontWeight: 900 }}>{fisico}/10</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(fisico / 10) * 100}%`, height: '100%', background: '#10B981', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text)' }}>Aspecto Técnico:</span>
                    <span style={{ color: '#2a3b60', fontWeight: 900 }}>{tecnico}/10</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(tecnico / 10) * 100}%`, height: '100%', background: '#2a3b60', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text)' }}>Aspecto Táctico:</span>
                    <span style={{ color: '#8B5CF6', fontWeight: 900 }}>{tactico}/10</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(tactico / 10) * 100}%`, height: '100%', background: '#8B5CF6', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque de Informe Técnico y Observaciones */}
          <div style={{
            background: 'var(--card2)',
            padding: '20px 22px',
            borderRadius: '16px',
            border: '1px solid var(--border-card)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileText size={16} color="var(--celeste)" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--celeste)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Informe Técnico & Observaciones del Observador
              </span>
            </div>

            <div style={{
              background: 'var(--card)',
              padding: '16px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-card)',
              color: 'var(--text)',
              fontSize: '13.5px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              minHeight: '80px'
            }}>
              {prospecto.informe && prospecto.informe.trim() 
                ? prospecto.informe 
                : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Sin informe detallado ni observaciones registradas para este prospecto.</span>
              }
            </div>
          </div>

          {/* Pie de página institucional (en PDF / Print) */}
          <div style={{
            marginTop: '24px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-card)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--muted)'
          }}>
            <span>Integral Club · Centro de Alto Rendimiento</span>
            <span>Documento Oficial de Evaluación Confidencial</span>
          </div>
        </div>
      </div>
    </div>
  );
}
