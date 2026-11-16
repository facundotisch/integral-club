import { describe, it, expect } from 'vitest';
import { formatRivalName, AVAILABLE_METRICS, DEFAULT_SELECTED_METRICS } from './InformeFinalPanel';

describe('InformeFinalPanel Helpers & Config', () => {
  it('debe tener las 6 variables por defecto requeridas', () => {
    expect(DEFAULT_SELECTED_METRICS).toHaveLength(6);
    expect(DEFAULT_SELECTED_METRICS).toEqual([
      'dist',
      's25',
      'sprints',
      'tension',
      'z1618',
      'topSpeed'
    ]);
  });

  it('debe calcular correctamente la variable de Tensión (Acc + Dec sumadas)', () => {
    const tensionMetric = AVAILABLE_METRICS.find(m => m.id === 'tension');
    expect(tensionMetric).toBeDefined();

    const samplePlayer = { acc: 180, dec: 95 };
    expect(tensionMetric.getValue(samplePlayer)).toBe(275);
  });

  it('debe formatear los nombres de rivales de forma prolija para visualización en diagonal', () => {
    expect(formatRivalName('UNIÓN', 0)).toBe('Unión');
    expect(formatRivalName('CASLA', 1)).toBe('San Lorenzo');
    expect(formatRivalName('BOCA', 2)).toBe('Boca');
    expect(formatRivalName('GELP', 3)).toBe('Gimnasia LP');
    expect(formatRivalName('CENTRAL CÓRDOBA', 4)).toBe('C. Córdoba');
    expect(formatRivalName('VELEZ', 5)).toBe('Vélez');
    expect(formatRivalName('ROSARIO CENTRAL', 6)).toBe('R. Central');
    expect(formatRivalName('ATLÉTICO RAFAELA', 7)).toBe('Atl. Rafaela');
    expect(formatRivalName('ATLÉTICO TUCUMÁN', 8)).toBe('Atl. Tucumán');
    expect(formatRivalName('DEFENSA', 9)).toBe('Defensa y Just.');
  });

  it('debe manejar rivales desconocidos, vacíos o MD de forma segura', () => {
    expect(formatRivalName('', 4)).toBe('Fecha 5');
    expect(formatRivalName(null, 9)).toBe('Fecha 10');
    expect(formatRivalName('MD', 2)).toBe('Fecha 3');
    expect(formatRivalName('Aldosivi', 0)).toBe('Aldosivi');
  });

  it('todas las variables disponibles deben tener funciones de formateo válidas', () => {
    AVAILABLE_METRICS.forEach(m => {
      expect(typeof m.getValue).toBe('function');
      expect(typeof m.format).toBe('function');
      expect(typeof m.formatShort).toBe('function');
    });
  });
});
