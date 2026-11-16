import React, { useState } from 'react';
import {
  Radio,
  Table,
  Activity,
  BarChart2,
  Calendar,
  Trophy,
  CalendarDays,
  Compass,
  Scale,
  User,
  Shield,
  Users,
  Zap,
  CalendarRange,
  Plus,
  Minus,
  Award
} from 'lucide-react';

export const OPTIONS = [
  { id: 'sesion', Icon: Activity, title: 'Análisis de sesión', desc: 'Mapa de calor del día, peor escenario y gráfico por jugador' },
  { id: 'planilla', Icon: Table, title: 'Planilla semanal', desc: 'Matriz de la semana con todas las variables, totales y % de competencia' },
  { id: 'carga', Icon: BarChart2, title: 'Carga del equipo', desc: 'Evolución aguda vs crónica y ACWR del equipo', hidden: true },
  { id: 'colent', Icon: Calendar, title: 'Microciclo', desc: 'Carga del plantel agrupada por número de microciclo' },
  { id: 'mapeoGps', Icon: Radio, title: 'Mapeo semanal GPS', desc: 'Asignación de chalecos GPS por jugador y microciclo', extra: true },
  { id: 'ranking', Icon: Trophy, title: 'Ranking del plantel', desc: 'Jugadores ordenados por la variable que elijas', extra: true },
  { id: 'microMD', Icon: CalendarDays, title: 'Cargas por día de microciclo', desc: 'Estímulo planificado vs ejecutado por MD-X, con histórico', hidden: true },
  // Extras
  { id: 'sespos', Icon: Compass, title: 'Sesión colectiva por puesto', desc: 'Promedio por puesto y cada jugador vs su puesto', extra: true, hidden: true },
  { id: 'comparar', Icon: Scale, title: 'Comparar jugadores', desc: 'Hasta 4 jugadores en la variable y período que elijas', extra: true, hidden: true },
  { id: 'informe', Icon: User, title: 'Informe de jugador', desc: 'Informe completo con perfil y conclusiones de un jugador', extra: true },
  { id: 'partido', Icon: Shield, title: 'Informe de partido', desc: 'Rendimiento en un partido vs su propio historial', extra: true },
  { id: 'compararPuestoPartido', Icon: Users, title: 'Comparar por puesto en partidos', desc: 'Comparativa de un jugador vs puestos de compañeros en cada partido y multi-categoría', extra: true },
  { id: 'colpart', Icon: Users, title: 'Colectivo · Partidos', desc: 'Promedios del equipo en cada partido y comparador de partidos', extra: true },
  { id: 'histvel', Icon: Zap, title: 'Histórico de velocidad', desc: 'Por semana y día, qué tan cerca estuvo cada jugador de su velocidad máxima', extra: true },
  { id: 'meso', Icon: CalendarRange, title: 'Meso ciclo', desc: 'Carga del plantel agrupada en bloques de microciclos', extra: true },
  { id: 'informeFinal', Icon: Award, title: 'Informe Final', desc: 'Reporte horizontal de partidos: carátula de categoría y 1 hoja por jugador con 6 gráficos evolutivos', extra: true }
];

export default function MenuGrid({ activePanel, onSelectPanel }) {
  const [expandido, setExpandido] = useState(false);

  const visibles = OPTIONS.filter(o => !o.extra && !o.hidden);
  const extras = OPTIONS.filter(o => o.extra && !o.hidden);

  return (
    <section className="opts-section">
      <h2 className="opts-section-title">¿Qué querés ver?</h2>
      <div className={`opts ${expandido ? 'expandido' : ''}`}>
        {visibles.map(opt => {
          const IconComponent = opt.Icon;
          return (
            <div
              key={opt.id}
              className={`opt ${activePanel === opt.id ? 'active' : ''}`}
              onClick={() => onSelectPanel(opt.id)}
            >
              <div className="opt-icon-badge">
                <IconComponent size={22} className="opt-icon-svg" />
                </div>
              <div className="opt-title">{opt.title}</div>
              <div className="opt-desc">{opt.desc}</div>
            </div>
          );
        })}

        <button
          className="btn-mas-analisis"
          onClick={() => setExpandido(!expandido)}
          type="button"
        >
          {expandido ? (
            <Minus size={16} className="btn-mas-icon" />
          ) : (
            <Plus size={16} className="btn-mas-icon" />
          )}
          <span>{expandido ? 'Ver menos paneles' : 'Más análisis y reportes'}</span>
        </button>

        {expandido && (
          <>
            <div
              style={{
                gridColumn: '1 / -1',
                fontFamily: 'var(--font-head)',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                margin: '16px 0 6px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
              }}
            >
              Más análisis
            </div>
            {extras.map(opt => {
              const IconComponent = opt.Icon;
              return (
                <div
                  key={opt.id}
                  className={`opt opt-extra ${activePanel === opt.id ? 'active' : ''}`}
                  onClick={() => onSelectPanel(opt.id)}
                >
                  <div className="opt-icon-badge">
                    <IconComponent size={22} className="opt-icon-svg" />
                    </div>
                  <div className="opt-title">{opt.title}</div>
                  <div className="opt-desc">{opt.desc}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
