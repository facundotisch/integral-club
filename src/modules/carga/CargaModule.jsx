import React, { useState, useEffect } from 'react';
import Topbar from './components/Topbar';
import Hero from './components/Hero';
import MenuGrid from './components/MenuGrid';
import PanelToolbar from './components/PanelToolbar';
import PanelContainer from './components/PanelContainer';
import GuiaModal from './components/GuiaModal';
import BuscadorJugadorModal from '../../components/BuscadorJugadorModal';
import IntegralLoadingScreen from '../../components/IntegralLoadingScreen';
import { BookOpen, Search } from 'lucide-react';
import { fetchCategoryData, isCategoryCached } from '../../services/api';
import { areSamePlayer } from '../../utils/photoResolver';
import { useAppStore } from '../../store/useAppStore';

const DEFAULT_CATEGORIAS = ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena'];

export default function CargaModule({ onVolverHub, tema = 'claro', onToggleTema }) {
  const catActual = useAppStore(state => state.categoria);
  const setCatActual = useAppStore(state => state.setCategoria);

  // Sincronizar desde query param ?cat= si viene especificado
  useEffect(() => {
    try {
      const c = new URLSearchParams(window.location.search).get('cat');
      if (c && c !== catActual) {
        setCatActual(c);
      }
    } catch {}
  }, []);
  const [categorias, setCategorias] = useState(DEFAULT_CATEGORIAS);
  const [activePanel, setActivePanel] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('panel');
      if (p) return p;
    } catch {}
    return 'sesion';
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guiaOpen, setGuiaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPlayerTarget, setSelectedPlayerTarget] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('jugador');
    } catch {}
    return null;
  });
  const [lastUpdated, setLastUpdated] = useState('');

  const loadData = (categoria, forceRefresh = false) => {
    const isCached = !forceRefresh && isCategoryCached(categoria);

    // Si no está en caché, mostramos la pantalla de carga
    if (!isCached) {
      setLoading(true);
      setData(null);
    }
    setError(null);

    fetchCategoryData(categoria, forceRefresh)
      .then((res) => {
        if (!res || res.error) {
          throw new Error((res && res.error) || 'No se recibieron datos de la planilla.');
        }
        const actualData = (res && res.data) ? res.data : res;
        setData(actualData);
        if (res.categorias && Array.isArray(res.categorias) && res.categorias.length > 0) {
          setCategorias(res.categorias);
        }
        setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching category data:', err);
        setError(err.message || 'Error al conectar con el servidor.');
        setLoading(false);
      });
  };

  const handleRefresh = () => {
    loadData(catActual, true);
  };

  useEffect(() => {
    loadData(catActual);
  }, [catActual]);

  // Atajo global Ctrl+K / Cmd+K para abrir/cerrar buscador
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChangeCat = (newCat) => {
    if (newCat && newCat !== catActual) {
      setCatActual(newCat);
    }
  };

  const handleSelectPanel = (panelId) => {
    setActivePanel(panelId);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('panel', panelId);
      window.history.pushState({}, '', url);
    } catch {}
    setTimeout(() => {
      const el = document.getElementById('panel') ||
                 document.getElementById('panel-top') ||
                 document.querySelector('.content-container') ||
                 document.querySelector('.comparar-puesto-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSelectPlayerFromSearch = (player, panelTarget) => {
    let targetCat = catActual;
    const playerHasCurrentCatData = data && (
      (data.roster && data.roster.some(n => areSamePlayer(n, player.displayName))) ||
      (Array.isArray(data.sesiones) && data.sesiones.some(s => (s.jugadores || []).some(j => areSamePlayer(j.jugador, player.displayName))))
    );

    if (player.cats && player.cats.length > 0) {
      if (!playerHasCurrentCatData) {
        // Si no tiene registros en la categoría activa, cambiamos a la categoría donde sí tiene registros o a su categoría principal
        const otherCat = player.cats.find(c => c !== catActual);
        targetCat = otherCat || player.cats[0];
      } else if (!player.cats.includes(catActual)) {
        targetCat = player.cats[0];
      }
    }

    if (targetCat !== catActual) {
      setCatActual(targetCat);
      loadData(targetCat);
    }

    const targetPanel = panelTarget || 'informe';
    setActivePanel(targetPanel);
    setSelectedPlayerTarget(player.displayName);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('cat', targetCat);
      url.searchParams.set('panel', targetPanel);
      url.searchParams.set('jugador', player.displayName);
      window.history.pushState({}, '', url.toString());
    } catch (e) {}

    setTimeout(() => {
      const el = document.getElementById('panel') ||
                 document.getElementById('panel-top') ||
                 document.querySelector('.content-container') ||
                 document.querySelector('.comparar-puesto-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  return (
    <div className="integral-app">
      <Topbar 
        catActual={catActual} 
        tema={tema}
        onToggleTema={onToggleTema}
        onRefresh={handleRefresh}
        refreshing={loading}
        lastUpdated={lastUpdated}
        onVolverHub={onVolverHub}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <Hero 
        categorias={categorias} 
        catActual={catActual} 
        onChangeCat={handleChangeCat} 
        loading={loading} 
      />

      <div className="guia-cta-wrap">
        <button 
          className="btn-guia-integral" 
          onClick={() => setGuiaOpen(true)}
          type="button"
        >
          <BookOpen size={17} className="btn-guia-icon" />
          <span>Guía del Dashboard & Glosario</span>
        </button>
      </div>

      <MenuGrid 
        activePanel={activePanel} 
        onSelectPanel={handleSelectPanel} 
      />

      <PanelToolbar 
        categorias={categorias} 
        catActual={catActual} 
        onChangeCat={handleChangeCat} 
        title={activePanel} 
      />

      {loading && !data && (
        <IntegralLoadingScreen catActual={catActual} />
      )}

      {error && !data && (
        <div style={{ maxWidth: '700px', margin: '40px auto', padding: '24px', background: 'rgba(235, 87, 87, 0.1)', border: '1px solid #eb5757', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ color: '#eb5757', marginBottom: '8px', fontFamily: 'var(--font-head)', letterSpacing: '0.5px' }}>
            Error al sincronizar datos
          </h3>
          <p style={{ color: '#ccc', marginBottom: '16px', fontSize: '14px' }}>{error}</p>
          <button 
            className="btn-pdf" 
            style={{ background: '#eb5757', color: '#fff', cursor: 'pointer' }}
            onClick={() => loadData(catActual)}
          >
            Reintentar
          </button>
        </div>
      )}

      {data && (
        <PanelContainer 
          activePanel={activePanel} 
          data={data} 
          catActual={catActual} 
          categorias={categorias}
          onNavigate={handleSelectPanel} 
          tema={tema}
          targetJugador={selectedPlayerTarget}
        />
      )}

      <footer className="update-info">
        Datos actualizados: {lastUpdated || 'En vivo'} · Integral Club
      </footer>

      {/* Botón flotante de lupa fija */}
      <button
        type="button"
        className="btn-floating-search-lupa"
        onClick={() => setSearchOpen(true)}
        title="Buscar jugador en todas las divisiones (Ctrl + K)"
        aria-label="Abrir buscador rápido de jugadores"
      >
        <Search size={22} />
        <span className="btn-floating-tooltip">Buscar Jugador (Ctrl + K)</span>
      </button>

      {/* Modal Buscador Rápido */}
      <BuscadorJugadorModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPlayer={handleSelectPlayerFromSearch}
        tema={tema}
      />

      <GuiaModal 
        isOpen={guiaOpen} 
        onClose={() => setGuiaOpen(false)} 
      />
    </div>
  );
}
