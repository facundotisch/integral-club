import React from 'react';
import WellnessFaceAnimation from './WellnessFaceAnimation';

/**
 * Tarjeta táctil interactiva mobile-first para una variable de Wellness (0 a 10).
 */
export default function WellnessSliderCard({
  id,
  titulo,
  pregunta,
  icon: Icon,
  value,
  onChange,
  positive = false, // REGLA: En todas las variables 0 es lo mejor/óptimo (Verde) y 10 es lo peor/alerta (Rojo)
  minLabel = '0 (Poco)',
  maxLabel = '10 (Mucho)'
}) {
  const healthScore = positive ? value : (10 - value);

  // Colores dinámicos
  const getAccentColor = (score) => {
    if (score >= 8.5) return '#10b981';
    if (score >= 6.5) return '#84cc16';
    if (score >= 4.5) return '#f59e0b';
    if (score >= 2.5) return '#f97316';
    return '#ef4444';
  };

  const accentColor = getAccentColor(healthScore);

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onChange(val);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
  };

  const handleQuickSelect = (val) => {
    onChange(val);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  // Porcentaje del slider para el fill del gradiente
  const fillPercent = (value / 10) * 100;

  return (
    <div 
      className="wellness-slider-card"
      style={{
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '18px',
        padding: '20px 16px',
        border: '1px solid var(--border-color, rgba(226, 232, 240, 0.9))',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        position: 'relative',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* Encabezado de la Tarjeta */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icon && (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 43, 102, 0.1)',
              color: '#002B66',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={18} />
            </div>
          )}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text, #0f172a)' }}>
              {titulo}
            </h3>
            <p style={{ fontSize: '11.5px', margin: 0, color: 'var(--muted, #64748b)' }}>
              {pregunta}
            </p>
          </div>
        </div>

        {/* Badge numérico grande */}
        <div style={{
          padding: '4px 12px',
          borderRadius: '20px',
          background: `${accentColor}18`,
          color: accentColor,
          fontWeight: 900,
          fontSize: '15px',
          border: `1.5px solid ${accentColor}44`,
          minWidth: '40px',
          textAlign: 'center'
        }}>
          {value} <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7 }}>/ 10</span>
        </div>
      </div>

      {/* Cara animada reactiva */}
      <div style={{ padding: '4px 0' }}>
        <WellnessFaceAnimation
          value={value}
          positive={positive}
          variableName={titulo}
          size={84}
        />
      </div>

      {/* Slider táctil */}
      <div style={{ width: '100%', position: 'relative', padding: '6px 4px 0' }}>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={value}
          onChange={handleSliderChange}
          aria-label={titulo}
          className="wellness-range-slider"
          style={{
            width: '100%',
            height: '10px',
            borderRadius: '8px',
            outline: 'none',
            WebkitAppearance: 'none',
            appearance: 'none',
            cursor: 'pointer',
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${fillPercent}%, #e2e8f0 ${fillPercent}%, #e2e8f0 100%)`,
            transition: 'background 0.1s linear'
          }}
        />

        {/* Etiquetas de los extremos */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10.5px',
          fontWeight: 700,
          color: 'var(--muted, #94a3b8)',
          marginTop: '6px'
        }}>
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>

      {/* Barra de acceso rápido numérico (0 a 10) para un solo toque */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        gap: '3px',
        paddingTop: '2px'
      }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
          const isSelected = num === value;
          return (
            <button
              key={num}
              type="button"
              onClick={() => handleQuickSelect(num)}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: '11.5px',
                fontWeight: isSelected ? 900 : 600,
                color: isSelected ? '#ffffff' : 'var(--text-muted, #64748b)',
                background: isSelected ? accentColor : 'var(--btn-bg, #f1f5f9)',
                border: isSelected ? `1.5px solid ${accentColor}` : '1px solid transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '30px'
              }}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
