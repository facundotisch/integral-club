import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  HeartPulse, 
  Scale, 
  Stethoscope, 
  Brain, 
  UserPlus, 
  ClipboardList, 
  ChevronRight,
  ArrowLeft,
  Sun, 
  Moon,
  Search
} from 'lucide-react';
import BuscadorJugadorModal from '../../components/BuscadorJugadorModal';

const AREAS = [
  { id: 'fisica', title: 'Área Física', icon: Activity, active: true },
  { id: 'composicion', title: 'Área Nutrición', icon: Scale, active: true },
  { id: 'medica', title: 'Área Médica', icon: Stethoscope, active: false },
  { id: 'psicologia', title: 'Área Psicología', icon: Brain, active: false },
  { id: 'captacion', title: 'Área Captación', icon: UserPlus, active: true },
  { id: 'gestion', title: 'Gestión', icon: ClipboardList, active: false },
];

export default function HubModule({ 
  onSelectModulo, 
  tema = 'claro', 
  onToggleTema 
}) {
  const [aviso, setAviso] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [subArea, setSubArea] = useState(null);

  // Tecla Escape para volver del submenú
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && subArea) {
        setSubArea(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [subArea]);

  // Atajo de teclado global Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectPlayer = (player, panelTarget) => {
    let targetCat = 'Cuarta';
    if (player.cats && player.cats.length > 0) {
      targetCat = player.cats[0];
    }
    const targetPanel = panelTarget || 'informe';

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('modulo', 'carga');
      url.searchParams.set('cat', targetCat);
      url.searchParams.set('panel', targetPanel);
      url.searchParams.set('jugador', player.displayName);
      window.history.pushState({}, '', url.toString());
    } catch (e) {}

    onSelectModulo('carga');
  };

  const handleClick = (area) => {
    if (area.id === 'fisica') {
      setSubArea('fisica');
    } else if (area.id === 'composicion') {
      onSelectModulo('composicion');
    } else if (area.id === 'captacion') {
      onSelectModulo('captacion');
    } else {
      setAviso(`El módulo de ${area.title} se encuentra en etapa de desarrollo.`);
      setTimeout(() => setAviso(null), 3500);
    }
  };

  return (
    <div className="hub-viewport-container">
      {/* Topbar institucional idéntico al dashboard */}
      <header className="topbar">
        <div className="tb-left">
          <img src="/escudo.png" alt="Integral Club" className="tb-escudo" />
          <span className="tb-brand">Integral Club</span>
        </div>
        <div className="tb-right">
          <button
            type="button"
            className="btn-quick-search"
            onClick={() => setSearchOpen(true)}
            title="Buscar jugador en el plantel (Ctrl + K)"
          >
            <Search size={14} className="tb-search-icon" />
            <span className="tb-search-text">Buscar jugador</span>
            <kbd className="bj-kbd-topbar">Ctrl K</kbd>
          </button>
          <span className="tb-cat-badge">Panel Integral</span>
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
        </div>
      </header>

      {/* Cuerpo principal fijo en 1 sola pantalla sin scroll */}
      <main className="hub-center-content">
        <div className="hub-content-box">
          <div className="hub-header-titles">
            <div className="hub-center-escudo-wrap">
              <img src="/escudo.png" alt="Integral Club" className="hub-center-escudo" />
            </div>
            <h1 className="hub-main-title">
              {subArea === 'fisica' ? 'Área Física' : 'Plataforma Integral de Rendimiento'}
            </h1>
            <p className="hub-main-sub">
              {subArea === 'fisica' ? 'Control de Carga & Monitoreo de Fatiga' : 'Fútbol Profesional & Formativo · Centro de Alto Rendimiento'}
            </p>
          </div>

          {aviso && (
            <div className="hub-toast-aviso">
              {aviso}
            </div>
          )}

          {/* Subárea Física o Grilla principal de 6 Áreas */}
          {subArea === 'fisica' ? (
            <div className="hub-subarea-wrap" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className="btn-hub-back-subarea"
                  onClick={() => setSubArea(null)}
                  title="Volver a la selección de áreas"
                >
                  <ArrowLeft size={15} />
                  <span>Volver a todas las áreas</span>
                </button>
              </div>

              <div className="hub-buttons-grid" style={{ justifyContent: 'center' }}>
                <button
                  type="button"
                  className="hub-btn-item"
                  onClick={() => onSelectModulo('carga')}
                  style={{ minWidth: '240px', maxWidth: '270px' }}
                >
                  <div className="hub-btn-icon-box">
                    <Activity size={22} className="hub-btn-icon" />
                  </div>
                  <span className="hub-btn-label">Control de carga</span>
                  <ChevronRight size={17} className="hub-btn-chevron" />
                </button>

                <button
                  type="button"
                  className="hub-btn-item hub-btn-item-dev"
                  onClick={() => {
                    setAviso('El módulo de Control de fatiga se encuentra en etapa de desarrollo.');
                    setTimeout(() => setAviso(null), 3500);
                  }}
                  style={{ minWidth: '240px', maxWidth: '270px' }}
                  title="Control de fatiga (En desarrollo)"
                >
                  <div className="hub-btn-icon-box" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
                    <HeartPulse size={22} className="hub-btn-icon" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <span className="hub-btn-label" style={{ fontSize: '13.5px' }}>Control de fatiga</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--amber, #b45309)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>En desarrollo</span>
                  </div>
                  <ChevronRight size={17} className="hub-btn-chevron" />
                </button>
              </div>
            </div>
          ) : (
            <div className="hub-buttons-grid">
              {AREAS.map((area) => {
                const IconComp = area.icon;
                return (
                  <button
                    key={area.id}
                    type="button"
                    className="hub-btn-item"
                    onClick={() => handleClick(area)}
                  >
                    <div className="hub-btn-icon-box">
                      <IconComp size={22} className="hub-btn-icon" />
                    </div>
                    <span className="hub-btn-label">{area.title}</span>
                    <ChevronRight size={17} className="hub-btn-chevron" />
                  </button>
                );
              })}
            </div>
          )}

          <div className="hub-simple-footer">
            Integral Club · Rendimiento & Monitoreo Deportivo.
          </div>
        </div>
      </main>

      {/* Botón flotante de lupa fija */}
      <button
        type="button"
        className="btn-floating-search-lupa"
        onClick={() => setSearchOpen(true)}
        title="Buscador rápido de jugadores (Ctrl + K)"
        aria-label="Buscar jugador"
      >
        <Search size={22} />
      </button>

      {/* Modal global del buscador rápido */}
      <BuscadorJugadorModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPlayer={handleSelectPlayer}
        tema={tema}
      />
    </div>
  );
}
