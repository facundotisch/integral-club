import React from 'react';
import { Sun, Moon, RotateCw, ArrowLeft, Search } from 'lucide-react';

export default function Topbar({ 
  catActual, 
  tema = 'claro', 
  onToggleTema, 
  onRefresh, 
  refreshing, 
  lastUpdated,
  onVolverHub,
  onOpenSearch
}) {
  return (
    <header className="topbar">
      <div className="tb-left">
        {onVolverHub && (
          <button 
            type="button" 
            className="btn-hub-back"
            onClick={onVolverHub}
            title="Volver a la Pantalla de Inicio"
          >
            <ArrowLeft size={16} />
            <span>Inicio</span>
          </button>
        )}
        {onVolverHub && <div className="tb-divider" />}
        <img src="/escudo.png" alt="Integral Club" className="tb-escudo" />
        <span className="tb-brand">Integral Club · Monitoreo GPS</span>
      </div>
      <div className="tb-right">
        {onOpenSearch && (
          <button
            type="button"
            className="btn-quick-search"
            onClick={onOpenSearch}
            title="Buscar jugador en todas las divisiones (Ctrl + K)"
            aria-label="Buscar jugador"
          >
            <Search size={14} />
            <span className="tb-search-text">Buscar jugador...</span>
            <kbd className="tb-search-kbd">Ctrl K</kbd>
          </button>
        )}
        <span className="tb-cat-badge">{catActual} División</span>
        {onRefresh && (
          <button
            type="button"
            className="btn-refresh-data"
            onClick={onRefresh}
            disabled={refreshing}
            title={lastUpdated ? `Última sincronización: ${lastUpdated}. Click para actualizar desde Google Sheet` : 'Actualizar datos desde Google Sheet'}
            aria-label="Actualizar datos desde Google Sheet"
          >
            <RotateCw size={13} className={refreshing ? 'spin-anim' : ''} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar datos'}</span>
          </button>
        )}
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
  );
}
