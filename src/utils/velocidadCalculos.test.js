import { describe, it, expect } from 'vitest';
import {
  parseFecha,
  mondayOf,
  normMD,
  esEntrenamientoValidoVelocidad,
  calcularRecordsVelocidad,
  calcularSemanasEntrenamiento,
} from './velocidadCalculos';

describe('Protocolo GPS - Histórico de Velocidad (velocidadCalculos)', () => {
  describe('parseFecha y mondayOf', () => {
    it('debe parsear fechas en formato DD/MM/YYYY correctamente', () => {
      const d = parseFecha('27/10/2026');
      expect(d.getDate()).toBe(27);
      expect(d.getMonth()).toBe(9); // Octubre (0-indexed)
      expect(d.getFullYear()).toBe(2026);
    });

    it('debe calcular el lunes correspondiente a una semana', () => {
      // 27/10/2026 es martes -> su lunes es 26/10/2026
      const d = parseFecha('27/10/2026');
      const mon = mondayOf(d);
      expect(mon.getDate()).toBe(26);
      expect(mon.getMonth()).toBe(9);
    });
  });

  describe('Filtro de sesiones válidas (esEntrenamientoValidoVelocidad)', () => {
    it('debe rechazar partidos', () => {
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Partido Oficial', dia: 'MD' })).toBe(false);
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Partido Amistoso', dia: 'MD' })).toBe(false);
    });

    it('debe rechazar MD (día de partido) y MD+1 (regenerativo)', () => {
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Entrenamiento', dia: 'MD' })).toBe(false);
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Entrenamiento', dia: 'MD+1' })).toBe(false);
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Entrenamiento', per: 'MD + 1' })).toBe(false);
    });

    it('debe aceptar días de entrenamiento válidos (MD-1 a MD-4, MD+2)', () => {
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Entrenamiento', dia: 'MD-4' })).toBe(true);
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Entrenamiento', dia: 'MD-3' })).toBe(true);
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Entrenamiento', dia: 'MD-2' })).toBe(true);
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Entrenamiento', dia: 'MD-1' })).toBe(true);
      expect(esEntrenamientoValidoVelocidad({ tipo: 'Entrenamiento', dia: 'MD+2' })).toBe(true);
    });
  });

  describe('calcularRecordsVelocidad', () => {
    it('debe obtener el récord de velocidad máxima de cada jugador solo en entrenamientos válidos', () => {
      const sesiones = [
        {
          tipo: 'Entrenamiento',
          dia: 'MD-3',
          jugadores: [
            { jugador: 'Ezequiel Perez', topSpeed: 31.5 },
            { jugador: 'Mateo Garcia', topSpeed: 29.8 },
          ],
        },
        {
          tipo: 'Entrenamiento',
          dia: 'MD-2',
          jugadores: [
            { jugador: 'Ezequiel Perez', topSpeed: 33.2 }, // Nuevo récord
            { jugador: 'Mateo Garcia', topSpeed: 28.5 },
          ],
        },
        {
          tipo: 'Partido', // Debe ignorarse según protocolo
          dia: 'MD',
          jugadores: [
            { jugador: 'Ezequiel Perez', topSpeed: 35.0 },
          ],
        },
      ];

      const records = calcularRecordsVelocidad(sesiones);
      expect(records['Ezequiel Perez']).toBe(33.2); // Ignoró los 35.0 del partido
      expect(records['Mateo Garcia']).toBe(29.8);
    });
  });
});
