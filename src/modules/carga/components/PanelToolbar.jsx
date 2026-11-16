import React from 'react';
import { Printer } from 'lucide-react';
import { exportarPDF } from '../../../utils/helpers';

const TITLES_MAP = {
  'planilla': 'Planilla Semanal',
  'sesion': 'Análisis de Sesión',
  'carga': 'Carga del Equipo',
  'colent': 'Microciclo',
  'ranking': 'Ranking del Plantel',
  'microMD': 'Cargas por Día de Microciclo',
  'sespos': 'Sesión Colectiva por Puesto',
  'comparar': 'Comparar Jugadores',
  'compararPuestoPartido': 'Comparar Jugador vs Puestos (Partidos)',
  'informe': 'Informe de Jugador',
  'partido': 'Informe de Partido',
  'colpart': 'Colectivo Partidos',
  'histvel': 'Histórico de Velocidad',
  'meso': 'Meso Ciclo',
  'informeFinal': 'Informe Final de Temporada',
  'mapeoGps': 'Mapeo Semanal de GPS (Chalecos)'
};

export default function PanelToolbar({ categorias = [], catActual, onChangeCat, title }) {
  const panelName = TITLES_MAP[title] || title || 'Informe';
  const pdfTitle = `Integral Club - ${panelName} - ${catActual}`;

  return (
    <div className="panel-top" id="panel-top">
      <div className="panel-top-cat">
        <label htmlFor="selCatPanel">Categoría</label>
        <select
          id="selCatPanel"
          value={catActual}
          onChange={(e) => onChangeCat(e.target.value)}
        >
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat} División</option>
          ))}
        </select>
      </div>

      {title === 'meso' ? (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="btn-pdf" 
            onClick={() => typeof window !== 'undefined' && window.exportarMesoSolo ? window.exportarMesoSolo() : exportarPDF(pdfTitle)} 
            type="button"
            title="Exportar únicamente el bloque y gráficos de Mesociclo"
          >
            <Printer size={15} />
            <span>Exportar Mesociclo</span>
          </button>
          <button 
            className="btn-pdf" 
            style={{ background: '#10B981', borderColor: '#10B981' }} 
            onClick={() => typeof window !== 'undefined' && window.exportarMesoCompSolo ? window.exportarMesoCompSolo() : exportarPDF('Integral Club - Comparativa MD')} 
            type="button"
            title="Exportar únicamente la Comparativa MD entre Categorías"
          >
            <Printer size={15} />
            <span>Exportar Comparativa MD</span>
          </button>
        </div>
      ) : (
        <button className="btn-pdf" onClick={() => exportarPDF(pdfTitle)} type="button">
          <Printer size={15} />
          <span>Exportar PDF</span>
        </button>
      )}
    </div>
  );
}
