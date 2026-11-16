import { describe, it, expect } from 'vitest';
import {
  calcularSumatoria6Pliegues,
  calcularIMO,
  clasificarSumatoriaPliegues,
} from './isakCalculos';

describe('Cálculos ISAK II - Nutrición y Composición Corporal', () => {
  describe('calcularSumatoria6Pliegues', () => {
    it('debe sumar correctamente los 6 pliegues estándar', () => {
      const pliegues = {
        triceps: 10.5,
        subescapular: 8.2,
        supraespinal: 7.3,
        abdominal: 12.0,
        musloMedial: 9.4,
        pantorrilla: 6.6,
      };
      // 10.5 + 8.2 + 7.3 + 12.0 + 9.4 + 6.6 = 54.0
      expect(calcularSumatoria6Pliegues(pliegues)).toBe(54.0);
    });

    it('debe soportar nombres de columnas con tildes y variantes ISAK', () => {
      const plieguesAlternativos = {
        'Tríceps': '11.2',
        'Subescapular': '8.0',
        'Supraespinal': '7.5',
        'Abdominal': '13.1',
        'Muslo (medial)': '10.0',
        'Pantorrilla (máxima)': '7.2',
      };
      // 11.2 + 8.0 + 7.5 + 13.1 + 10.0 + 7.2 = 57.0
      expect(calcularSumatoria6Pliegues(plieguesAlternativos)).toBe(57.0);
    });

    it('debe manejar valores faltantes o nulos tratándolos como 0', () => {
      const plieguesIncompletos = {
        triceps: 10,
        abdominal: 15,
      };
      expect(calcularSumatoria6Pliegues(plieguesIncompletos)).toBe(25.0);
    });

    it('debe redondear el resultado a 1 solo decimal', () => {
      const pliegues = {
        triceps: 7.15,
        subescapular: 6.12,
        supraespinal: 5.11,
        abdominal: 8.23,
        musloMedial: 7.33,
        pantorrilla: 5.22,
      };
      // Suma exacta: 39.16 -> redondeado a 39.2
      expect(calcularSumatoria6Pliegues(pliegues)).toBe(39.2);
    });
  });

  describe('calcularIMO (Índice Músculo / Óseo)', () => {
    it('debe calcular el ratio muscular/óseo con 2 decimales', () => {
      const masaMuscularKg = 34.5;
      const masaOseaKg = 7.8;
      // 34.5 / 7.8 = 4.42307... -> 4.42
      expect(calcularIMO(masaMuscularKg, masaOseaKg)).toBe(4.42);
    });

    it('debe devolver 0 de forma segura si la masa ósea es 0, nula o negativa', () => {
      expect(calcularIMO(35, 0)).toBe(0);
      expect(calcularIMO(35, null)).toBe(0);
      expect(calcularIMO(35, -5)).toBe(0);
    });
  });

  describe('clasificarSumatoriaPliegues (Semáforo)', () => {
    it('debe clasificar < 35 mm como Excelente (Verde)', () => {
      const res = clasificarSumatoriaPliegues(32);
      expect(res.nivel).toBe('Excelente');
      expect(res.color).toBe('#047857');
    });

    it('debe clasificar entre 35 mm y 48 mm como Óptimo (Celeste Integral)', () => {
      const res = clasificarSumatoriaPliegues(42);
      expect(res.nivel).toBe('Óptimo');
      expect(res.color).toBe('#2a3b60');
    });

    it('debe clasificar entre 49 mm y 60 mm como Aceptable (Ámbar)', () => {
      const res = clasificarSumatoriaPliegues(55);
      expect(res.nivel).toBe('Aceptable');
      expect(res.color).toBe('#b45309');
    });

    it('debe clasificar > 60 mm como Elevado (Rojo)', () => {
      const res = clasificarSumatoriaPliegues(65);
      expect(res.nivel).toBe('Elevado');
      expect(res.color).toBe('#b91c1c');
    });
  });
});
