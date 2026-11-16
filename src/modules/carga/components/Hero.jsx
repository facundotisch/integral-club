import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export default function Hero({ categorias = [], catActual, onChangeCat, loading }) {
  return (
    <section className="hero-section">
      <div className="hero-card">
        <div className="hero-card-top">
          <div className="hero-badge">
            <Activity size={15} className="hero-badge-icon" />
            <span>Monitoreo GPS · Temporada 2026</span>
          </div>
          <div className="hero-live-badge">
            <span className="hero-pulse-dot" />
            <span className="hero-live-txt">En tiempo real · Google Sheets</span>
          </div>
        </div>

        <h1 className="hero-title">
          Monitoreo <span className="text-celeste">de Cargas</span>
        </h1>

        <p className="hero-lede">
          {loading 
            ? `Sincronizando datos de ${catActual} en tiempo real...` 
            : 'Dashboard en tiempo real del plantel. Los datos se actualizan automáticamente desde el Google Sheet oficial de Integral Club.'}
        </p>

        <div className="hero-footer-row">
          <div className="cat-selector-card">
            <label htmlFor="selCategoria">Categoría:</label>
            <select
              id="selCategoria"
              value={catActual}
              disabled={loading}
              onChange={(e) => onChangeCat(e.target.value)}
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat} División</option>
              ))}
            </select>
          </div>
          
          <div className="hero-info-tag">
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Plantel Juvenil & Reserva</span>
          </div>
        </div>
      </div>
    </section>
  );
}
