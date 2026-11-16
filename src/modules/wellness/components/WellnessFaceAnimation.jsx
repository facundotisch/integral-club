import React from 'react';

/**
 * Componente de cara animada y expresiva para cuestionario de Wellness.
 * Reacciona fluidamente a los valores de 0 a 10 con transiciones de color y expresiones faciales.
 * 
 * REGLA INSTITUCIONAL: En todas las variables 0 es ÓPTIMO (Verde) y 10 es ALERTA (Rojo).
 * SIN EMOJIS, SIN SOMBRAS NEÓN RARAS.
 */
export default function WellnessFaceAnimation({ value = 0, positive = false, variableName = '', size = 96 }) {
  // healthScore: 10 = óptimo (verde), 0 = alerta/dolor (rojo)
  const healthScore = positive ? value : (10 - value);

  // Paleta de color semafórico institucional sobrio
  const getColor = (score) => {
    if (score >= 8.5) return { bg: '#ecfdf5', primary: '#10b981', border: '#a7f3d0' };
    if (score >= 6.5) return { bg: '#f7fee7', primary: '#84cc16', border: '#d9f99d' };
    if (score >= 4.5) return { bg: '#fffbeb', primary: '#f59e0b', border: '#fde68a' };
    if (score >= 2.5) return { bg: '#fff7ed', primary: '#f97316', border: '#fed7aa' };
    return { bg: '#fef2f2', primary: '#ef4444', border: '#fecaca' };
  };

  const colors = getColor(healthScore);

  // Expresión facial según healthScore (0 a 10)
  const renderEyes = () => {
    if (healthScore >= 8) {
      // Ojos sonrientes felices en arco (^ ^)
      return (
        <g stroke={colors.primary} strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M 28 42 Q 35 33 42 42" />
          <path d="M 58 42 Q 65 33 72 42" />
        </g>
      );
    }
    if (healthScore >= 6) {
      // Ojos amigables abiertos con brillo
      return (
        <g fill={colors.primary}>
          <circle cx="35" cy="38" r="5" />
          <circle cx="65" cy="38" r="5" />
          <circle cx="37" cy="36" r="1.8" fill="#ffffff" />
          <circle cx="67" cy="36" r="1.8" fill="#ffffff" />
        </g>
      );
    }
    if (healthScore >= 4) {
      // Ojos neutros / pensativos
      return (
        <g fill={colors.primary}>
          <circle cx="35" cy="39" r="4.5" />
          <circle cx="65" cy="39" r="4.5" />
        </g>
      );
    }
    if (healthScore >= 2) {
      // Ojos caídos / cansados con cejas caídas
      return (
        <g stroke={colors.primary} strokeWidth="3" strokeLinecap="round" fill="none">
          <line x1="28" y1="34" x2="42" y2="38" />
          <line x1="72" y1="34" x2="58" y2="38" />
          <circle cx="35" cy="42" r="3.5" fill={colors.primary} stroke="none" />
          <circle cx="65" cy="42" r="3.5" fill={colors.primary} stroke="none" />
        </g>
      );
    }
    // Ojos cerrados en dolor o agotamiento (> <)
    return (
      <g stroke={colors.primary} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M 27 35 L 39 42 L 27 49" />
        <path d="M 73 35 L 61 42 L 73 49" />
      </g>
    );
  };

  const renderMouth = () => {
    if (healthScore >= 8) {
      // Gran sonrisa abierta
      return (
        <g>
          <path
            d="M 32 54 Q 50 74 68 54 Z"
            fill={colors.primary}
          />
          <path
            d="M 38 56 Q 50 63 62 56"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );
    }
    if (healthScore >= 6) {
      // Sonrisa amable moderada
      return (
        <path
          d="M 35 56 Q 50 68 65 56"
          stroke={colors.primary}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    if (healthScore >= 4) {
      // Boca neutra recta
      return (
        <line
          x1="38"
          y1="58"
          x2="62"
          y2="58"
          stroke={colors.primary}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      );
    }
    if (healthScore >= 2) {
      // Boca ligeramente hacia abajo / disgustada
      return (
        <path
          d="M 36 63 Q 50 54 64 63"
          stroke={colors.primary}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    // Boca zigzagueante de molestia o dolor
    return (
      <path
        d="M 34 62 Q 42 56 50 63 T 66 58"
        stroke={colors.primary}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    );
  };

  // Texto descriptor técnico y claro (SIN EMOJIS)
  // Regla unificada: 0 = Óptimo (Verde), 10 = Alerta Máxima (Rojo)
  const getDescriptor = () => {
    if (variableName === 'Descanso') {
      if (value <= 1) return 'Descanso optimo';
      if (value <= 3) return 'Buen descanso';
      if (value <= 5) return 'Descanso regular';
      if (value <= 7) return 'Dormi poco o mal';
      return 'Pesimo descanso / Insomnio';
    }
    if (variableName === 'Fatiga') {
      if (value <= 1) return 'Cuerpo liviano y fresco';
      if (value <= 3) return 'Fatiga leve';
      if (value <= 5) return 'Cansancio moderado';
      if (value <= 7) return 'Bastante fatigado';
      return 'Agotamiento extremo';
    }
    if (variableName === 'Estrés') {
      if (value <= 1) return 'Tranquilo y relajado';
      if (value <= 3) return 'Estres bajo';
      if (value <= 5) return 'Tension moderada';
      if (value <= 7) return 'Tension alta';
      return 'Mucho estres / Presion alta';
    }
    if (variableName === 'Energía') {
      if (value <= 1) return 'Energia al 100%';
      if (value <= 3) return 'Buena energia';
      if (value <= 5) return 'Energia media';
      if (value <= 7) return 'Baja energia / Desgano';
      return 'Sin energia / Vaciado';
    }
    if (variableName === 'Dolor') {
      if (value === 0) return 'Sin dolores musculares';
      if (value <= 2) return 'Molestia muy leve';
      if (value <= 5) return 'Dolor o agujetas moderadas';
      if (value <= 7) return 'Dolor muscular alto';
      return 'Dolor agudo / Fuerte';
    }
    return '';
  };

  return (
    <div 
      className="wellness-face-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        userSelect: 'none'
      }}
    >
      <div 
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: colors.bg,
          border: `2.5px solid ${colors.border}`,
          boxShadow: 'none', // Sin sombras raras
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          width={size * 0.9} 
          height={size * 0.9}
          style={{ overflow: 'visible' }}
        >
          {renderEyes()}
          {renderMouth()}
        </svg>

        {/* Badge numérico circular en esquina */}
        <div style={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          background: colors.primary,
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '13px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #ffffff',
          boxShadow: 'none'
        }}>
          {value}
        </div>
      </div>

      <span 
        style={{
          fontSize: '12.5px',
          fontWeight: 700,
          color: colors.primary,
          letterSpacing: '0.2px',
          textAlign: 'center',
          minHeight: '18px',
          transition: 'color 0.2s ease'
        }}
      >
        {getDescriptor()}
      </span>
    </div>
  );
}
