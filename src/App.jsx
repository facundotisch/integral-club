import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import HubModule from './modules/hub/HubModule';

// Carga diferida (Code Splitting): Cada módulo se descarga solo a demanda cuando el usuario lo abre
const CargaModule = lazy(() => import('./modules/carga/CargaModule'));
const ComposicionModule = lazy(() => import('./modules/composicion/ComposicionModule'));
const FatigaModule = lazy(() => import('./modules/fatiga/FatigaModule'));
const CaptacionModule = lazy(() => import('./modules/captacion/CaptacionModule'));
const WellnessPlayerPage = lazy(() => import('./modules/wellness/WellnessPlayerPage'));

function ModuleFallback({ nombre = 'Módulo' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '14px',
      color: 'var(--text-muted, #64748b)'
    }}>
      <div 
        className="integral-simple-spinner" 
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 43, 102, 0.18)',
          borderTopColor: '#002B66',
          borderRadius: '50%',
          animation: 'spinAnim 0.9s linear infinite'
        }} 
      />
      <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.4px' }}>
        Cargando {nombre}...
      </span>
    </div>
  );
}

function AppContent() {
  const { tema, toggleTema } = useTheme();

  // Módulo activo: 'hub' (por defecto) | 'carga' | 'composicion' | 'fatiga' | 'captacion' | 'wellness'
  const [moduloActual, setModuloActual] = useState(() => {
    try {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname === '/wellness' || pathname.startsWith('/wellness/')) return 'wellness';
      if (window.location.hash.toLowerCase() === '#wellness') return 'wellness';
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('modulo');
      if (mod === 'wellness' || mod === 'carga' || mod === 'fatiga' || mod === 'composicion' || mod === 'captacion') return mod;
    } catch {}
    return 'hub';
  });

  const handleSelectModulo = (mod) => {
    setModuloActual(mod);
    try {
      const url = new URL(window.location.href);
      if (mod === 'hub') {
        url.searchParams.delete('modulo');
        if (window.location.pathname === '/wellness' || window.location.pathname.startsWith('/wellness/')) {
          window.history.pushState({}, '', '/');
        } else {
          window.history.pushState({}, '', url);
        }
      } else if (mod === 'wellness') {
        window.history.pushState({}, '', '/wellness');
      } else {
        if (window.location.pathname === '/wellness' || window.location.pathname.startsWith('/wellness/')) {
          url.pathname = '/';
        }
        url.searchParams.set('modulo', mod);
        window.history.pushState({}, '', url);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  useEffect(() => {
    const handlePopState = () => {
      try {
        const pathname = window.location.pathname.toLowerCase();
        if (pathname === '/wellness' || pathname.startsWith('/wellness/')) {
          setModuloActual('wellness');
          return;
        }
        if (window.location.hash.toLowerCase() === '#wellness') {
          setModuloActual('wellness');
          return;
        }
        const params = new URLSearchParams(window.location.search);
        const mod = params.get('modulo');
        if (mod === 'wellness') {
          setModuloActual('wellness');
          return;
        }
        setModuloActual(mod === 'carga' || mod === 'fatiga' || mod === 'composicion' || mod === 'captacion' ? mod : 'hub');
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Precarga silenciosa del proxy Edge de GPS al cargar la aplicación
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('/api/gps?cat=Cuarta').catch(() => {});
    }
  }, []);

  return (
    <div className="integral-app">
      <ErrorBoundary>
        {moduloActual === 'hub' && (
          <HubModule 
            onSelectModulo={handleSelectModulo}
            tema={tema}
            onToggleTema={toggleTema}
          />
        )}

        {moduloActual === 'carga' && (
          <Suspense fallback={<ModuleFallback nombre="Área Física (GPS)" />}>
            <CargaModule 
              onVolverHub={() => handleSelectModulo('hub')}
              tema={tema}
              onToggleTema={toggleTema}
            />
          </Suspense>
        )}

        {moduloActual === 'composicion' && (
          <Suspense fallback={<ModuleFallback nombre="Composición Corporal (Nutrición)" />}>
            <ComposicionModule 
              onVolverHub={() => handleSelectModulo('hub')}
              tema={tema}
            />
          </Suspense>
        )}

        {moduloActual === 'fatiga' && (
          <Suspense fallback={<ModuleFallback nombre="Control de Fatiga & Wellness" />}>
            <FatigaModule 
              onVolverHub={() => handleSelectModulo('hub')}
              onIrAWellness={() => handleSelectModulo('wellness')}
              tema={tema}
              onToggleTema={toggleTema}
            />
          </Suspense>
        )}

        {moduloActual === 'captacion' && (
          <Suspense fallback={<ModuleFallback nombre="Captación de Talentos" />}>
            <CaptacionModule 
              onVolverHub={() => handleSelectModulo('hub')}
              tema={tema}
              onToggleTema={toggleTema}
            />
          </Suspense>
        )}

        {moduloActual === 'wellness' && (
          <Suspense fallback={<ModuleFallback nombre="Cuestionario Wellness" />}>
            <WellnessPlayerPage 
              onVolverHub={() => handleSelectModulo('hub')}
              tema={tema}
              onToggleTema={toggleTema}
            />
          </Suspense>
        )}
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
