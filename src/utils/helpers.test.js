import { describe, it, expect } from 'vitest';
import { fmt, pct, prom, sum, huellaNombre } from './helpers';
import { isComodin, isCategoryCached } from '../services/api';

describe('Utilidades de Cálculo GPS y Filtros', () => {
  describe('Filtro isComodin', () => {
    it('debe detectar y descartar comodines y placeholders GPS de la planilla', () => {
      expect(isComodin('1 jugador')).toBe(true);
      expect(isComodin('2 jugadores')).toBe(true);
      expect(isComodin('jugador')).toBe(true);
      expect(isComodin('comodin')).toBe(true);
      expect(isComodin('Comodín')).toBe(true);
      expect(isComodin('gps 14')).toBe(true);
      expect(isComodin('33 33')).toBe(true);
      expect(isComodin('-')).toBe(true);
      expect(isComodin('')).toBe(true);
      expect(isComodin(null)).toBe(true);
      expect(isComodin(undefined)).toBe(true);
    });

    it('debe validar como jugadores reales a los nombres propios', () => {
      expect(isComodin('Ezequiel Perez')).toBe(false);
      expect(isComodin('Thiago De Bellis')).toBe(false);
      expect(isComodin('Naranjo')).toBe(false);
      expect(isComodin('Volpe')).toBe(false);
    });
  });

  describe('Cálculos numéricos (prom y sum)', () => {
    it('debe sumar arrays de métricas correctamente', () => {
      expect(sum([100, 200, 300])).toBe(600);
      expect(sum([])).toBe(0);
      expect(sum(null)).toBe(0);
    });

    it('debe promediar métricas correctamente', () => {
      expect(prom([10, 20, 30])).toBe(20);
      expect(prom([])).toBe(0);
      expect(prom(null)).toBe(0);
    });
  });

  describe('Formateo fmt y huellaNombre', () => {
    it('debe formatear con coma decimal según estándar es-AR', () => {
      expect(fmt(12.34, 1)).toBe('12,3');
      expect(fmt(null)).toBe('—');
      expect(fmt(NaN)).toBe('—');
    });

    it('debe normalizar nombres de jugadores para matching insensible a mayúsculas y tildes', () => {
      expect(huellaNombre('Agustín Ojeda')).toBe('agustin ojeda');
      expect(huellaNombre('Ojeda, Agustín')).toBe('agustin ojeda');
    });
  });

  describe('Caché de Categorías GPS', () => {
    it('debe retornar false para categorías que aún no fueron cacheadas', () => {
      expect(isCategoryCached('CategoriaInexistente123')).toBe(false);
    });
  });
});
