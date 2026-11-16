import React, { useState, useEffect } from 'react';

const TELEMETRY_PHRASES = [
  'Calculando Distancia Total & Distancia Relativa (m/min)...',
  'Procesando High Speed Running (>18 km/h & >25 km/h)...',
  'Indexando Aceleraciones y Desaceleraciones (>3 m/s²)...',
  'Sincronizando Player Load y Carga Mecánica...',
  'Compilando métricas por puesto táctico y microciclo...',
  'Estructurando informe individual y colectivo de partidos...'
];

export default function IntegralLoadingScreen({ catActual = 'Cuarta' }) {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIdx(prev => (prev + 1) % TELEMETRY_PHRASES.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="integral-loading-simple">
      <div className="integral-simple-spinner" />
      <p className="integral-loading-text">
        Cargando datos de {catActual}...
      </p>
      <div className="integral-loading-telemetry-box">
        <span className="integral-telemetry-dot" />
        <span key={phraseIdx} className="integral-telemetry-phrase">
          {TELEMETRY_PHRASES[phraseIdx]}
        </span>
      </div>
    </div>
  );
}
