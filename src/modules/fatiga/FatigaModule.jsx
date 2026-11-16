import React, { useState } from 'react';
import { 
  ArrowLeft, HeartPulse, Activity, Sun, Moon, 
  CheckCircle2, ShieldAlert, Smartphone, ExternalLink, 
  Copy, Check, LayoutDashboard, BookOpen
} from 'lucide-react';
import WellnessAdminPanel from '../wellness/components/WellnessAdminPanel';

export default function FatigaModule({ onVolverHub, onIrAWellness, tema = 'claro', onToggleTema }) {
  const [tabActiva, setTabActiva] = useState('admin'); // 'admin' | 'teoria'
  const [copiado, setCopiado] = useState(false);

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dashboard-integral-v3.vercel.app';
    const link = `${origin}/wellness`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } else {
      prompt('Copia este enlace para los futbolistas:', link);
    }
  };

  return (
    <div className="fatiga-module-page">
      {/* Topbar Oficial del Hub */}
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
          <span className="tb-brand">Control de Fatiga & Recuperación (Wellness)</span>
        </div>

        <div className="tb-right">
          {/* Botón directo para abrir el cuestionario de jugadores */}
          <button
            type="button"
            onClick={onIrAWellness}
            style={{
              background: '#2a3b60',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={14} />
            <span>Abrir Cuestionario /wellness</span>
          </button>

          {onToggleTema && (
            <button
              type="button"
              className="btn-theme-toggle"
              onClick={onToggleTema}
              title={tema === 'claro' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Blanco'}
              aria-label="Alternar modo claro y oscuro"
            >
              {tema === 'claro' ? (
                <>
                  <Moon size={15} />
                  <span>Modo Oscuro</span>
                </>
              ) : (
                <>
                  <Sun size={15} />
                  <span>Modo Blanco</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Hero Banner */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-title-area">
            <h1 className="hero-title">Monitoreo Fisiológico & Bienestar Subjetivo</h1>
            <p className="hero-sub" style={{ color: '#ffffff' }}>
              Seguimiento de Carga Interna, Escala RPE (Borg CR-10) y Cuestionario Hooper / Wellness Diario (0 = Óptimo · 10 = Alerta Máxima)
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación del Módulo */}
      <div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '0 20px', display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setTabActiva('admin')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: tabActiva === 'admin' ? '#2a3b60' : 'var(--card, #ffffff)',
            color: tabActiva === 'admin' ? '#ffffff' : 'var(--text-muted, #64748b)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <LayoutDashboard size={16} />
          <span>Panel de Monitoreo DT (Admin)</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('teoria')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: tabActiva === 'teoria' ? '#2a3b60' : 'var(--card, #ffffff)',
            color: tabActiva === 'teoria' ? '#ffffff' : 'var(--text-muted, #64748b)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <BookOpen size={16} />
          <span>Metodología & Cruce GPS</span>
        </button>
      </div>

      <div className="panel-container" style={{ maxWidth: '1100px', margin: '14px auto 30px', padding: '0 20px' }}>
        
        {/* TAB 1: PANEL ADMIN / MONITOREO */}
        {tabActiva === 'admin' && (
          <WellnessAdminPanel 
            onVolverCuestionario={onIrAWellness}
            onVolverHub={onVolverHub}
          />
        )}

        {/* TAB 2: MARCO TEÓRICO Y METODOLOGÍA */}
        {tabActiva === 'teoria' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Banner link móvil */}
            <div className="card" style={{ 
              padding: '24px 28px', 
              background: 'linear-gradient(135deg, rgba(42, 59, 96, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1.5px solid rgba(42, 59, 96, 0.35)',
              borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '640px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2a3b60 0%, #0055a5 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Smartphone size={26} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 3px', color: 'var(--text)' }}>
                      Cuestionario Mobile-First (/wellness)
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                      Enlace para futbolistas con autenticación rápida por DNI/PIN, caritas animadas y esqueleto anatómico interactivo.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={onIrAWellness}
                    style={{
                      background: '#2a3b60',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>Abrir Cuestionario</span>
                    <ExternalLink size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      background: 'var(--card-bg, #ffffff)',
                      color: 'var(--text, #0f172a)',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {copiado ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                    <span>{copiado ? '¡Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Pilares del Módulo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>1. Wellness Hooper-Mackinnon</h3>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                  Cuestionario diario pre-entrenamiento de 5 factores subjetivos evaluados de 0 (óptimo) a 10 (alerta):
                </p>
                <ul style={{ fontSize: '12px', color: 'var(--text)', paddingLeft: '18px', margin: 0, lineHeight: 1.8 }}>
                  <li><strong>Descanso:</strong> 0 = durmió 10 pts; 10 = pésimo / insomnio.</li>
                  <li><strong>Fatiga corporal:</strong> 0 = fresco y liviano; 10 = agotamiento extremo.</li>
                  <li><strong>Estrés mental:</strong> 0 = relajado; 10 = mucha presión o tensión.</li>
                  <li><strong>Falta de Energía:</strong> 0 = batería al 100%; 10 = vaciado / sin fuerza.</li>
                  <li><strong>Dolor muscular (DOMS):</strong> 0 = sin dolor; 10 = dolor agudo / lesión.</li>
                </ul>
              </div>

              <div className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(42, 59, 96, 0.12)', color: '#2a3b60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>2. Carga Interna (sRPE)</h3>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                  Cuantificación de la intensidad percibida mediante la metodología de Foster (Borg CR-10):
                </p>
                <ul style={{ fontSize: '12px', color: 'var(--text)', paddingLeft: '18px', margin: 0, lineHeight: 1.8 }}>
                  <li><strong>Carga de Sesión (sRPE):</strong> RPE (1-10) × Duración (minutos).</li>
                  <li><strong>Carga Semanal Acumulada:</strong> sumatoria de unidades arbitrarias (UA).</li>
                  <li><strong>Monotonía de Carga:</strong> promedio semanal / desviación estándar.</li>
                  <li><strong>Tensión (Strain):</strong> Carga semanal × Monotonía.</li>
                </ul>
              </div>

              <div className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldAlert size={18} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>3. Cruce con GPS Catapult</h3>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                  Integración bidireccional entre la respuesta subjetiva y la telemetría mecánica:
                </p>
                <ul style={{ fontSize: '12px', color: 'var(--text)', paddingLeft: '18px', margin: 0, lineHeight: 1.8 }}>
                  <li><strong>Ratio Carga Externa / Interna:</strong> metros recorridos vs UA percibidas.</li>
                  <li><strong>Detección de fatiga silenciosa:</strong> caída de alta velocidad con RPE elevado.</li>
                  <li><strong>Alertas preventivas para el PF:</strong> futbolistas en zona roja previa a partido.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Botón de Retorno */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button"
            className="btn-guia-integral"
            onClick={onVolverHub}
            style={{ margin: '0 auto', padding: '10px 24px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} />
            <span>Volver a la Pantalla de Inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
