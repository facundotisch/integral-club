import { describe, it, expect } from 'vitest';
import { formatPosicion, formatRivalLabel, METRICAS_CONFIG } from './CompararPuestoPartidoPanel';

describe('CompararPuestoPartidoPanel Helpers & Logic', () => {
  it('debe mapear correctamente las siglas tácticas a nombres de posiciones legibles', () => {
    expect(formatPosicion('DC')).toBe('Defensor Central');
    expect(formatPosicion('LD')).toBe('Lateral Derecho');
    expect(formatPosicion('LI')).toBe('Lateral Izquierdo');
    expect(formatPosicion('VC')).toBe('Volante Central');
    expect(formatPosicion('VM')).toBe('Volante Mixto');
    expect(formatPosicion('VI')).toBe('Volante Interno / Enganche');
    expect(formatPosicion('E')).toBe('Extremo');
    expect(formatPosicion('CD')).toBe('Centrodelantero');
    expect(formatPosicion('A')).toBe('Arquero');
    expect(formatPosicion(null)).toBe('Sin posición');
    expect(formatPosicion('')).toBe('Sin posición');
  });

  it('debe formatear los nombres de rivales con prefijo "vs" para partidos oficiales', () => {
    expect(formatRivalLabel('Boca Juniors')).toBe('vs Boca Juniors');
    expect(formatRivalLabel('vs River Plate')).toBe('vs River Plate');
    expect(formatRivalLabel('vs. Independiente')).toBe('vs Independiente');
    expect(formatRivalLabel(null, true)).toBe('vs Rival');
    expect(formatRivalLabel('Fútbol Reducido', false)).toBe('Fútbol Reducido');
  });

  it('debe incluir la configuración de métricas requeridas para el panel', () => {
    const metricIds = METRICAS_CONFIG.map(m => m.id);
    expect(metricIds).toContain('dist');
    expect(metricIds).toContain('drel');
    expect(metricIds).toContain('hi');
    expect(metricIds).toContain('s25');
    expect(metricIds).toContain('accAlta');
    expect(metricIds).toContain('decAlta');
    expect(metricIds).toContain('topSpeed');
    expect(metricIds).toContain('min');
  });

  it('lógica de deselección: permite deseleccionar un partido individual y recalcular promedios excluyendo el partido', () => {
    const mockMatches = [
      { id: 'm1', fecha: '2026-03-01', rival: 'Lanús', dist: 10000, min: 90 },
      { id: 'm2', fecha: '2026-03-08', rival: 'Banfield', dist: 2000, min: 15 },
      { id: 'm3', fecha: '2026-03-15', rival: 'Boca', dist: 9500, min: 85 }
    ];

    let deselectedMatchIds = [];
    const isAllSelected = () => deselectedMatchIds.length === 0;
    const getSelected = () => mockMatches.filter(m => !deselectedMatchIds.includes(m.id));

    // Estado inicial: todos los partidos seleccionados
    expect(isAllSelected()).toBe(true);
    expect(getSelected()).toHaveLength(3);

    // Deseleccionar Banfield (partido con pocos minutos)
    deselectedMatchIds = ['m2'];
    expect(isAllSelected()).toBe(false);
    const filtered = getSelected();
    expect(filtered).toHaveLength(2);
    expect(filtered.map(m => m.id)).toEqual(['m1', 'm3']);

    // Promedio de distancia solo sobre los 2 partidos seleccionados (excluyendo Banfield)
    const avgDist = Math.round(filtered.reduce((acc, m) => acc + m.dist, 0) / filtered.length);
    expect(avgDist).toBe(9750); // (10000 + 9500) / 2 = 9750 vs con Banfield que daba 7167

    // Volver a seleccionar todos
    deselectedMatchIds = [];
    expect(isAllSelected()).toBe(true);
    expect(getSelected()).toHaveLength(3);
  });
});
