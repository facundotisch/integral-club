import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, User, Trophy, FileText, ChevronDown } from 'lucide-react';
import { buildStaticPlayersCatalog } from '../data/jugadoresIndex';
import { normalizeStr } from '../utils/photoResolver';

const CATEGORIAS_LIST = ['Todas', 'Cuarta', 'Reserva', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena'];
const INITIAL_LIMIT = 20;

export default function BuscadorJugadorModal({
  isOpen,
  onClose,
  onSelectPlayer,
  tema = 'claro'
}) {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todas');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(INITIAL_LIMIT);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const isNavigatingWithKeys = useRef(false);

  // Catálogo base de jugadores (cacheado globalmente en memoria)
  const catalog = useMemo(() => buildStaticPlayersCatalog(), []);

  // Autofocus inmediato y reset al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedCat('Todas');
      setSelectedIndex(0);
      setDisplayLimit(INITIAL_LIMIT);
      requestAnimationFrame(() => {
        if (inputRef.current) inputRef.current.focus();
      });
    }
  }, [isOpen]);

  // Filtrado de jugadores ultra-optimizado (aprovecha searchStr precalculado)
  const filteredPlayers = useMemo(() => {
    const qNorm = normalizeStr(query);

    return catalog.filter(p => {
      // Filtro por categoría
      if (selectedCat !== 'Todas') {
        if (!p.cats.includes(selectedCat)) return false;
      }

      // Si no hay búsqueda, mostrar todos los de la categoría seleccionada
      if (!qNorm) return true;

      // Coincidencia ultra-rápida precalculada (<0.001ms)
      return p.searchStr.includes(qNorm);
    });
  }, [catalog, query, selectedCat]);

  // Lista visible acotada (máx 20 iniciales) para renderizado ultrarrápido en DOM
  const visiblePlayers = useMemo(() => {
    return filteredPlayers.slice(0, displayLimit);
  }, [filteredPlayers, displayLimit]);

  // Asegurar que el índice seleccionado esté siempre dentro de los límites
  const safeIndex = Math.min(selectedIndex, Math.max(0, visiblePlayers.length - 1));

  // Refs para que los atajos de teclado siempre tengan la lista fresca
  const visibleRef = useRef(visiblePlayers);
  visibleRef.current = visiblePlayers;
  const safeIdxRef = useRef(safeIndex);
  safeIdxRef.current = safeIndex;

  const handleAction = (player, panelTarget) => {
    if (!player) return;
    onSelectPlayer(player, panelTarget);
    onClose();
  };

  // Manejo de atajos de teclado globales (Esc, Flecha Arriba/Abajo, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const currentList = visibleRef.current;
      const currentIdx = safeIdxRef.current;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        isNavigatingWithKeys.current = true;
        setSelectedIndex(prev => (prev < currentList.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        isNavigatingWithKeys.current = true;
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, currentList.length - 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentList && currentList.length > 0 && currentList[currentIdx]) {
          handleAction(currentList[currentIdx], 'informe');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Scroll automático para mantener el ítem seleccionado visible SOLO durante navegación con teclado
  useEffect(() => {
    if (isNavigatingWithKeys.current && listRef.current) {
      const activeEl = listRef.current.querySelector('.bj-item.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
      isNavigatingWithKeys.current = false;
    }
  }, [safeIndex]);

  if (!isOpen) return null;

  return (
    <div className="bj-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bj-modal" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado y Barra de Búsqueda */}
        <div className="bj-header">
          <div className="bj-search-input-wrap">
            <Search size={20} className="bj-search-icon" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              className="bj-search-input"
              placeholder="Buscar por jugador o posición (ej: Naranjo, Volpe, Central, Lateral)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
                setDisplayLimit(INITIAL_LIMIT);
              }}
            />
            {query && (
              <button
                type="button"
                className="bj-clear-btn"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                  setDisplayLimit(INITIAL_LIMIT);
                  if (inputRef.current) inputRef.current.focus();
                }}
              >
                <X size={16} />
              </button>
            )}
            <kbd className="bj-kbd-esc" onClick={onClose} title="Cerrar (Esc)">
              ESC
            </kbd>
          </div>

          {/* Filtros rápidos por división */}
          <div className="bj-cat-tabs">
            {CATEGORIAS_LIST.map(cat => {
              const isActive = selectedCat === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`bj-cat-tab ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCat(cat);
                    setSelectedIndex(0);
                    setDisplayLimit(INITIAL_LIMIT);
                    if (inputRef.current) inputRef.current.focus();
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Resultados */}
        <div ref={listRef} className="bj-results-list">
          {visiblePlayers.length === 0 ? (
            <div className="bj-empty-state">
              <User size={36} className="bj-empty-icon" />
              <h4>No se encontraron futbolistas</h4>
              <p>Probá buscando por apellido, puesto (ej: Volante) o seleccionando otra división.</p>
            </div>
          ) : (
            <>
              {visiblePlayers.map((player, idx) => {
                const isSelected = idx === safeIndex;

                return (
                  <div
                    key={player.displayName}
                    className={`bj-item ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => {
                      if (selectedIndex !== idx) {
                        isNavigatingWithKeys.current = false;
                        setSelectedIndex(idx);
                      }
                    }}
                  >
                    {/* Foto o Avatar con fallback instantáneo */}
                    <div className="bj-avatar-box">
                      <div className="bj-avatar-fallback">
                        {player.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      {player.photoUrl && (
                        <img
                          src={player.photoUrl}
                          alt={player.displayName}
                          loading="lazy"
                          decoding="async"
                          className="bj-avatar-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>

                    {/* Información Principal del Jugador */}
                    <div
                      className="bj-info-col"
                      onClick={() => handleAction(player, 'informe')}
                      title="Clic para abrir Informe Individual"
                    >
                      <div className="bj-name-row">
                        <span className="bj-player-name">{player.displayName}</span>
                        <span className="bj-pos-badge">{player.pos}</span>
                      </div>
                      <div className="bj-cats-row">
                        {player.cats.map(c => (
                          <span key={c} className={`bj-cat-pill bj-cat-${c.toLowerCase()}`}>
                            {c} División
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="bj-actions-col">
                      <button
                        type="button"
                        className="bj-action-btn btn-informe"
                        onClick={() => handleAction(player, 'informe')}
                        title="Ver Informe Individual completo de este jugador"
                      >
                        <FileText size={13} />
                        <span>Informe</span>
                      </button>
                      <button
                        type="button"
                        className="bj-action-btn btn-comparar"
                        onClick={() => handleAction(player, 'compararPuestoPartido')}
                        title="Ver comparativa de puestos en partidos oficiales"
                      >
                        <Trophy size={13} />
                        <span>Partidos</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Botón opcional para cargar más si supera el límite inicial */}
              {filteredPlayers.length > displayLimit && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <button
                    type="button"
                    onClick={() => setDisplayLimit(prev => prev + 25)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--celeste, #0080b7)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ChevronDown size={14} />
                    <span>Cargar más ({filteredPlayers.length - displayLimit} restantes)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Barra de Atajos en el Pie */}
        <div className="bj-footer">
          <div className="bj-shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
            <span><kbd>↵ Enter</kbd> abrir informe</span>
            <span><kbd>Esc</kbd> cerrar</span>
          </div>
          <div className="bj-count-label">
            {filteredPlayers.length > displayLimit
              ? `Mostrando ${visiblePlayers.length} de ${filteredPlayers.length} futbolistas`
              : `${filteredPlayers.length} ${filteredPlayers.length === 1 ? 'futbolista disponible' : 'futbolistas disponibles'}`}
          </div>
        </div>
      </div>
    </div>
  );
}
