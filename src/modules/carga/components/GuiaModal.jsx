import React, { useEffect } from 'react';
import {
  Table,
  BarChart2,
  Calendar,
  CalendarDays,
  CalendarRange,
  Activity,
  Compass,
  Shield,
  Users,
  Trophy,
  Scale,
  User,
  Zap,
  X,
  BookOpen
} from 'lucide-react';

export default function GuiaModal({ isOpen, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="guia-overlay open" onClick={onClose}>
      <div className="guia-modal" onClick={e => e.stopPropagation()}>
        <div className="guia-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={22} className="text-celeste" />
            <h2>Guía del Dashboard · Monitoreo de Cargas</h2>
          </div>
          <button className="guia-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>
        <div className="guia-body">
          <p className="guia-intro">
            Esta plataforma procesa automáticamente los datos GPS crudos cargados en el Google Sheet oficial de Integral Club. A continuación tenés un resumen rápido de las herramientas de análisis disponibles:
          </p>

          <div className="guia-grupo">
            <div className="guia-grupo-tit">Planificación semanal y cargas</div>
            <div className="guia-item">
              <div className="guia-icon">
                <Table size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Planilla semanal</div>
                <div className="guia-desc">Matriz completa de la semana día a día con todas las variables GPS, totales acumulados y porcentaje del estímulo respecto a la competencia oficial.</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <BarChart2 size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Carga del equipo</div>
                <div className="guia-desc">Evolución de la carga aguda (últimos 7 días) vs crónica (últimos 28 días) y el ratio <strong>ACWR</strong> para detectar picos de sobrecarga o subentrenamiento.</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <Calendar size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Microciclo</div>
                <div className="guia-desc">Carga física total y promedio del plantel agrupada por el número oficial de microciclo de la temporada.</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <CalendarDays size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Cargas por día de microciclo</div>
                <div className="guia-desc">Compara lo planificado vs lo realmente ejecutado para cada día relativo al partido (MD-4, MD-3, MD-2, MD-1, MD+1).</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <CalendarRange size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Meso ciclo</div>
                <div className="guia-desc">Agrupa la evolución del plantel en bloques mensuales o bloques de microciclos para evaluar tendencias a mediano plazo.</div>
              </div>
            </div>
          </div>

          <div className="guia-grupo">
            <div className="guia-grupo-tit">Sesiones y partidos</div>
            <div className="guia-item">
              <div className="guia-icon">
                <Activity size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Análisis de sesión</div>
                <div className="guia-desc">Mapa de calor del día, ranking de jugadores en ese entrenamiento y análisis del peor escenario.</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <Compass size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Sesión colectiva por puesto</div>
                <div className="guia-desc">Promedios por posición táctica (centrales, laterales, volantes, extremos, delanteros) y comparativa de cada jugador vs su puesto.</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <Shield size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Informe de partido</div>
                <div className="guia-desc">Rendimiento en un partido específico comparado con el promedio histórico del jugador y del equipo.</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <Users size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Colectivo · Partidos</div>
                <div className="guia-desc">Evolución de los partidos a lo largo del año y comparativa lado a lado entre 2 o 3 rivales.</div>
              </div>
            </div>
          </div>

          <div className="guia-grupo">
            <div className="guia-grupo-tit">Individual y Velocidad</div>
            <div className="guia-item">
              <div className="guia-icon">
                <Trophy size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Ranking del plantel</div>
                <div className="guia-desc">Ordena a los jugadores por la variable que elijas (distancia, alta intensidad, aceleraciones, desaceleraciones, sprints o velocidad máxima).</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <Scale size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Comparar jugadores</div>
                <div className="guia-desc">Superpone hasta 4 futbolistas en cualquier período y calcula porcentajes de diferencia.</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <User size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Informe de jugador</div>
                <div className="guia-desc">Ficha completa individual con perfil, radar comparativo contra el plantel y conclusiones físicas.</div>
              </div>
            </div>
            <div className="guia-item">
              <div className="guia-icon">
                <Zap size={20} className="text-celeste" />
              </div>
              <div className="guia-txt">
                <div className="guia-tit">Histórico de velocidad</div>
                <div className="guia-desc">Seguimiento de qué tan cerca estuvo cada jugador de su récord de velocidad en cada sesión.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
