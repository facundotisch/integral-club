import React, { useState } from 'react';
import { User, RotateCw, CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Zonas anatómicas mapeadas con coordenadas SVG para Frente y Dorso.
 */
const ZONAS_FRENTE = [
  { id: 'cuello_frente', label: 'Cuello / Cervical', path: 'M 92,48 L 108,48 L 110,60 L 90,60 Z' },
  { id: 'hombro_izq', label: 'Hombro Izq.', path: 'M 54,64 C 54,60 74,58 84,62 L 80,78 L 56,76 Z' },
  { id: 'hombro_der', label: 'Hombro Der.', path: 'M 146,64 C 146,60 126,58 116,62 L 120,78 L 144,76 Z' },
  { id: 'pecho_izq', label: 'Pectoral Izq.', path: 'M 80,64 L 98,64 L 97,94 L 74,90 C 73,78 77,70 80,64 Z' },
  { id: 'pecho_der', label: 'Pectoral Der.', path: 'M 120,64 L 102,64 L 103,94 L 126,90 C 127,78 123,70 120,64 Z' },
  { id: 'biceps_izq', label: 'Brazo / Bíceps Izq.', path: 'M 52,78 L 68,80 L 63,122 L 48,118 Z' },
  { id: 'biceps_der', label: 'Brazo / Bíceps Der.', path: 'M 148,78 L 132,80 L 137,122 L 152,118 Z' },
  { id: 'antebrazo_izq', label: 'Antebrazo Izq.', path: 'M 47,122 L 62,125 L 56,165 L 42,160 Z' },
  { id: 'antebrazo_der', label: 'Antebrazo Der.', path: 'M 153,122 L 138,125 L 144,165 L 158,160 Z' },
  { id: 'abdomen', label: 'Abdomen / Core', path: 'M 76,94 L 124,94 L 118,136 L 82,136 Z' },
  { id: 'pubis', label: 'Pubis / Ingle', path: 'M 86,138 L 114,138 L 108,156 L 92,156 Z' },
  { id: 'aductor_izq', label: 'Aductor Izq.', path: 'M 92,158 L 99,158 L 95,205 L 88,198 Z' },
  { id: 'aductor_der', label: 'Aductor Der.', path: 'M 108,158 L 101,158 L 105,205 L 112,198 Z' },
  { id: 'cuadriceps_izq', label: 'Cuádriceps Izq.', path: 'M 68,154 L 88,156 L 86,218 L 68,214 C 64,195 65,172 68,154 Z' },
  { id: 'cuadriceps_der', label: 'Cuádriceps Der.', path: 'M 132,154 L 112,156 L 114,218 L 132,214 C 136,195 135,172 132,154 Z' },
  { id: 'rodilla_izq', label: 'Rodilla Izq.', path: 'M 68,220 L 86,220 L 84,242 L 68,242 Z' },
  { id: 'rodilla_der', label: 'Rodilla Der.', path: 'M 132,220 L 114,220 L 116,242 L 132,242 Z' },
  { id: 'tibia_izq', label: 'Tibia / Canilla Izq.', path: 'M 69,244 L 84,244 L 80,305 L 68,300 Z' },
  { id: 'tibia_der', label: 'Tibia / Canilla Der.', path: 'M 131,244 L 116,244 L 120,305 L 132,300 Z' },
  { id: 'tobillo_izq', label: 'Tobillo / Empeine Izq.', path: 'M 67,308 L 81,308 L 84,338 L 62,338 Z' },
  { id: 'tobillo_der', label: 'Tobillo / Empeine Der.', path: 'M 133,308 L 119,308 L 116,338 L 138,338 Z' }
];

const ZONAS_DORSO = [
  { id: 'cervical_dorso', label: 'Nuca / Cervical', path: 'M 92,48 L 108,48 L 110,60 L 90,60 Z' },
  { id: 'trapecios', label: 'Trapecios / Espalda Alta', path: 'M 66,62 L 134,62 L 122,86 L 78,86 Z' },
  { id: 'dorsal_izq', label: 'Dorsal Izq.', path: 'M 74,88 L 98,88 L 96,126 L 72,120 Z' },
  { id: 'dorsal_der', label: 'Dorsal Der.', path: 'M 126,88 L 102,88 L 104,126 L 128,120 Z' },
  { id: 'triceps_izq', label: 'Tríceps Izq.', path: 'M 52,78 L 68,80 L 63,122 L 48,118 Z' },
  { id: 'triceps_der', label: 'Tríceps Der.', path: 'M 148,78 L 132,80 L 137,122 L 152,118 Z' },
  { id: 'antebrazo_dorso_izq', label: 'Antebrazo Izq.', path: 'M 47,122 L 62,125 L 56,165 L 42,160 Z' },
  { id: 'antebrazo_dorso_der', label: 'Antebrazo Der.', path: 'M 153,122 L 138,125 L 144,165 L 158,160 Z' },
  { id: 'lumbar', label: 'Zona Lumbar / Cintura', path: 'M 78,126 L 122,126 L 118,152 L 82,152 Z' },
  { id: 'gluteo_izq', label: 'Glúteo Izq.', path: 'M 76,154 L 98,154 L 96,186 L 70,182 C 68,170 71,160 76,154 Z' },
  { id: 'gluteo_der', label: 'Glúteo Der.', path: 'M 124,154 L 102,154 L 104,186 L 130,182 C 132,170 129,160 124,154 Z' },
  { id: 'isquio_izq', label: 'Isquiotibial Izq.', path: 'M 70,188 L 94,188 L 90,238 L 68,236 C 65,220 66,204 70,188 Z' },
  { id: 'isquio_der', label: 'Isquiotibial Der.', path: 'M 130,188 L 106,188 L 110,238 L 132,236 C 135,220 134,204 130,188 Z' },
  { id: 'popliteo_izq', label: 'Hueco Poplíteo Izq.', path: 'M 68,238 L 90,238 L 88,252 L 70,252 Z' },
  { id: 'popliteo_der', label: 'Hueco Poplíteo Der.', path: 'M 132,238 L 110,238 L 112,252 L 130,252 Z' },
  { id: 'gemelo_izq', label: 'Gemelo / Sóleo Izq.', path: 'M 68,254 L 88,254 L 82,308 L 66,304 C 62,285 64,268 68,254 Z' },
  { id: 'gemelo_der', label: 'Gemelo / Sóleo Der.', path: 'M 132,254 L 112,254 L 118,308 L 134,304 C 138,285 136,268 132,254 Z' },
  { id: 'aquiles_izq', label: 'Tendón de Aquiles Izq.', path: 'M 68,310 L 80,310 L 82,338 L 64,338 Z' },
  { id: 'aquiles_der', label: 'Tendón de Aquiles Der.', path: 'M 132,310 L 120,310 L 118,338 L 136,338 Z' }
];

export default function BodyMapSkeleton({
  zonasSeleccionadas = [],
  onToggleZona,
  onLimpiarZonas,
  observaciones = '',
  onChangeObservaciones
}) {
  const [vista, setVista] = useState('frente'); // 'frente' | 'dorso'

  const zonasActuales = vista === 'frente' ? ZONAS_FRENTE : ZONAS_DORSO;

  const handleZoneClick = (zona) => {
    onToggleZona(zona);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const cantidadMolestias = zonasSeleccionadas.length;

  return (
    <div 
      className="wellness-bodymap-card"
      style={{
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '18px',
        padding: '20px 16px',
        border: '1px solid var(--border-color, rgba(226, 232, 240, 0.9))',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        userSelect: 'none'
      }}
    >
      {/* Encabezado */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: cantidadMolestias > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: cantidadMolestias > 0 ? '#ef4444' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {cantidadMolestias > 0 ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text, #0f172a)' }}>
            Mapa Corporal de Molestias
          </h3>
        </div>
        <p style={{ fontSize: '12px', margin: 0, color: 'var(--muted, #64748b)' }}>
          ¿Sentís alguna molestia puntual? Tocá el grupo muscular en el esquema.
        </p>
      </div>

      {/* Selector de Vista: Frente / Dorso */}
      <div style={{
        display: 'flex',
        background: 'var(--btn-bg, #f1f5f9)',
        borderRadius: '30px',
        padding: '3px',
        width: '100%',
        maxWidth: '260px'
      }}>
        <button
          type="button"
          onClick={() => setVista('frente')}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: '26px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: vista === 'frente' ? '#2a3b60' : 'transparent',
            color: vista === 'frente' ? '#ffffff' : 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <User size={15} />
          <span>Frente</span>
        </button>

        <button
          type="button"
          onClick={() => setVista('dorso')}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: '26px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: vista === 'dorso' ? '#2a3b60' : 'transparent',
            color: vista === 'dorso' ? '#ffffff' : 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <RotateCw size={14} />
          <span>Dorso / Espalda</span>
        </button>
      </div>

      {/* Silueta Anatómica SVG Interactiva */}
      <div style={{
        position: 'relative',
        width: '210px',
        height: '370px',
        background: 'radial-gradient(circle at center, rgba(42, 59, 96, 0.07) 0%, transparent 70%)',
        borderRadius: '16px',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg 
          viewBox="0 0 200 360" 
          width="100%" 
          height="100%"
          style={{ overflow: 'visible', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))' }}
        >
          {/* Cabeza (referencial) */}
          <ellipse cx="100" cy="26" rx="15" ry="19" fill="#94a3b8" opacity="0.35" />

          {/* Manos (referenciales) */}
          <ellipse cx="38" cy="174" rx="6" ry="9" fill="#94a3b8" opacity="0.3" />
          <ellipse cx="162" cy="174" rx="6" ry="9" fill="#94a3b8" opacity="0.3" />

          {/* Grupos musculares tocables */}
          {zonasActuales.map((zona) => {
            const isSelected = zonasSeleccionadas.some(z => z.id === zona.id);
            return (
              <g key={zona.id} onClick={() => handleZoneClick(zona)} style={{ cursor: 'pointer' }}>
                <path
                  d={zona.path}
                  fill={isSelected ? '#ef4444' : '#cbd5e1'}
                  stroke={isSelected ? '#b91c1c' : '#94a3b8'}
                  strokeWidth={isSelected ? '2' : '1'}
                  strokeLinejoin="round"
                  style={{
                    transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: isSelected ? 'drop-shadow(0 0 7px rgba(239, 68, 68, 0.75))' : 'none'
                  }}
                />
                {isSelected && (
                  <circle
                    cx={zona.id.includes('izq') ? 76 : zona.id.includes('der') ? 124 : 100}
                    cy={zona.id.includes('cuello') ? 54 : zona.id.includes('pecho') ? 78 : zona.id.includes('cuadriceps') || zona.id.includes('isquio') ? 190 : 130}
                    r="4"
                    fill="#ffffff"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Indicador flotante de vista */}
        <span style={{
          position: 'absolute',
          top: 10,
          right: 10,
          fontSize: '10px',
          fontWeight: 800,
          color: '#64748b',
          background: 'rgba(255,255,255,0.85)',
          padding: '2px 8px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          {vista === 'frente' ? 'VISTA FRENTE' : 'VISTA ESPALDA'}
        </span>
      </div>

      {/* Botón rápido "Sin molestias hoy" */}
      {cantidadMolestias > 0 ? (
        <button
          type="button"
          onClick={onLimpiarZonas}
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '20px',
            padding: '5px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <X size={13} />
          <span>Limpiar todas las zonas ({cantidadMolestias})</span>
        </button>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#10b981',
          background: 'rgba(16, 185, 129, 0.08)',
          padding: '6px 14px',
          borderRadius: '20px'
        }}>
          <CheckCircle2 size={15} />
          <span>Sin molestias marcadas (Cuerpo 100% OK)</span>
        </div>
      )}

      {/* Pastillas de Zonas Seleccionadas */}
      {cantidadMolestias > 0 && (
        <div style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          justifyContent: 'center',
          padding: '4px 0'
        }}>
          {zonasSeleccionadas.map((z) => (
            <span
              key={z.id}
              onClick={() => onToggleZona(z)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '14px',
                fontSize: '11px',
                fontWeight: 700,
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                cursor: 'pointer'
              }}
              title="Tocar para quitar"
            >
              <span>{z.label}</span>
              <X size={12} />
            </span>
          ))}
        </div>
      )}

      {/* Casilla de Texto para Observaciones */}
      <div style={{ width: '100%', marginTop: '4px' }}>
        <label 
          htmlFor="wellness-obs" 
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text, #0f172a)',
            marginBottom: '6px'
          }}
        >
          ¿Alguna aclaración o detalle para el cuerpo técnico / médico? <span style={{ fontWeight: 400, color: 'var(--muted, #64748b)' }}>(Opcional)</span>
        </label>
        <textarea
          id="wellness-obs"
          rows={3}
          value={observaciones}
          onChange={(e) => onChangeObservaciones(e.target.value)}
          placeholder="Ej: Sentí una puntada en el posterior en el último pique, me cargué en el gimnasio..."
          maxLength={280}
          style={{
            width: '100%',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #cbd5e1)',
            padding: '10px 12px',
            fontSize: '12.5px',
            color: 'var(--text, #0f172a)',
            background: 'var(--input-bg, #ffffff)',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '10.5px', color: 'var(--muted, #94a3b8)', marginTop: '2px' }}>
          {observaciones.length} / 280
        </div>
      </div>
    </div>
  );
}
