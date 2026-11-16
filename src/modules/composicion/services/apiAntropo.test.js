import { describe, it, expect } from 'vitest';
import { parseNum, getSemaforoPliegues, normalizeAntropoRow } from './apiAntropo';

describe('Normalizador y Reglas de Negocio de Antropometría (apiAntropo)', () => {
  describe('parseNum', () => {
    it('debe parsear números con coma decimal argentina', () => {
      expect(parseNum('12,5')).toBe(12.5);
      expect(parseNum('75,80')).toBe(75.8);
    });

    it('debe parsear números con punto estándar', () => {
      expect(parseNum('14.2')).toBe(14.2);
    });

    it('debe devolver el default seguro si el valor es nulo, guión o vacío', () => {
      expect(parseNum(null)).toBe(0);
      expect(parseNum(undefined)).toBe(0);
      expect(parseNum('')).toBe(0);
      expect(parseNum('—')).toBe(0);
      expect(parseNum('-', 10)).toBe(10);
    });
  });

  describe('getSemaforoPliegues (Regla de negocio Integral Club)', () => {
    it('debe devolver verde si la sumatoria es <= 42 mm', () => {
      const res = getSemaforoPliegues(42);
      expect(res.nivel).toBe('verde');
      expect(res.label).toContain('≤42');
    });

    it('debe devolver amarillo si la sumatoria está entre 43 mm y 45 mm', () => {
      const res = getSemaforoPliegues(44.5);
      expect(res.nivel).toBe('amarillo');
      expect(res.label).toContain('43-45');
    });

    it('debe devolver rojo si la sumatoria supera 45 mm', () => {
      const res = getSemaforoPliegues(45.1);
      expect(res.nivel).toBe('rojo');
      expect(res.label).toContain('>45');
    });

    it('debe devolver estado s/d (gris) si el valor es 0 o inválido', () => {
      const res = getSemaforoPliegues(0);
      expect(res.nivel).toBe('nd');
      expect(res.label).toBe('S/D');
    });
  });

  describe('normalizeAntropoRow', () => {
    it('debe corregir automáticamente los valores escalados x10 de Google Sheets', () => {
      const filaCruda = {
        'APELLIDO': 'PEREZ',
        'NOMBRE': 'Ezequiel',
        'FECHA': '15/10/2026',
        'Peso bruto (kg)': '72,5',
        'Masas muscular': '345', // Vino multiplicado x10 en la hoja (34.5 kg)
        'Masas adiposa': '182',   // 18.2 kg
        'Masas osea': '105',      // 10.5 kg
        'IMO': '42',              // Vino multiplicado x10 (4.2)
      };

      const normalizado = normalizeAntropoRow(filaCruda);
      expect(normalizado.masas.muscular).toBe(34.5);
      expect(normalizado.masas.adiposa).toBe(18.2);
      expect(normalizado.masas.osea).toBe(10.5);
      expect(normalizado.imo).toBe(4.2);
      expect(normalizado.nombreCompleto).toBe('PEREZ EZEQUIEL');
    });

    it('debe calcular la sumatoria de 6 pliegues si no vino calculada en la hoja', () => {
      const filaSinSumatoria = {
        'APELLIDO': 'GARCIA',
        'NOMBRE': 'Mateo',
        'Tríceps': '6,0',
        'Subescapular': '7,0',
        'Supraespinal': '5,0',
        'Abdominal': '8,0',
        'Muslo Medial': '9,0',
        'Pantorrilla': '5,0',
      };

      const normalizado = normalizeAntropoRow(filaSinSumatoria);
      // 6 + 7 + 5 + 8 + 9 + 5 = 40.0 mm
      expect(normalizado.pliegues6).toBe(40.0);
      expect(normalizado.semaforo.nivel).toBe('verde');
    });
  });
});
