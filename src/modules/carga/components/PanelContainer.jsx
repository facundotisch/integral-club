import React from 'react';
import PlanillaSemanalPanel from '../panels/PlanillaSemanalPanel';
import CargaEquipoPanel from '../panels/CargaEquipoPanel';
import MicrocicloPanel from '../panels/MicrocicloPanel';
import MicroMDPanel from '../panels/MicroMDPanel';
import MesocicloPanel from '../panels/MesocicloPanel';
import AnalisisSesionPanel from '../panels/AnalisisSesionPanel';
import SesionPuestoPanel from '../panels/SesionPuestoPanel';
import RankingPlantelPanel from '../panels/RankingPlantelPanel';
import CompararJugadoresPanel from '../panels/CompararJugadoresPanel';
import InformeJugadorPanel from '../panels/InformeJugadorPanel';
import InformePartidoPanel from '../panels/InformePartidoPanel';
import ColectivoPartidosPanel from '../panels/ColectivoPartidosPanel';
import HistoricoVelocidadPanel from '../panels/HistoricoVelocidadPanel';
import CompararPuestoPartidoPanel from '../panels/CompararPuestoPartidoPanel';
import InformeFinalPanel from '../panels/InformeFinalPanel';
import MapeoSemanalPanel from '../panels/MapeoSemanalPanel';

const PANELS_MAP = {
  'planilla': PlanillaSemanalPanel,
  'sesion': AnalisisSesionPanel,
  'carga': CargaEquipoPanel,
  'colent': MicrocicloPanel,
  'ranking': RankingPlantelPanel,
  'microMD': MicroMDPanel,
  'sespos': SesionPuestoPanel,
  'comparar': CompararJugadoresPanel,
  'compararPuestoPartido': CompararPuestoPartidoPanel,
  'informe': InformeJugadorPanel,
  'partido': InformePartidoPanel,
  'colpart': ColectivoPartidosPanel,
  'histvel': HistoricoVelocidadPanel,
  'meso': MesocicloPanel,
  'informeFinal': InformeFinalPanel,
  'mapeoGps': MapeoSemanalPanel,
};

export default function PanelContainer({ activePanel, data, catActual, categorias, onNavigate, tema = 'claro', targetJugador }) {
  const ActiveComponent = PANELS_MAP[activePanel] || PlanillaSemanalPanel;

  return (
    <main id="panel" className="content-container" style={{ padding: '0 24px 60px' }}>
      <div className="print-only-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2a3b60', paddingBottom: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#2a3b60', letterSpacing: '0.5px', fontFamily: 'var(--font-head)' }}>
              Integral Club • FORMATIVAS
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#222', marginTop: '2px' }}>
              Monitoreo Físico & GPS • {catActual} División
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', fontFamily: 'var(--font-mono)' }}>
            Temporada 2026
          </div>
        </div>
      </div>

      <ActiveComponent 
        data={data} 
        catActual={catActual} 
        categorias={categorias}
        onNavigate={onNavigate} 
        tema={tema}
        targetJugador={targetJugador}
      />
    </main>
  );
}
