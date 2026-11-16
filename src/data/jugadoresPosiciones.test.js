import { describe, it, expect } from 'vitest';
import { obtenerPosicionesJugador, POSICIONES_SHEET } from './jugadoresPosiciones';

describe('obtenerPosicionesJugador', () => {
  it('resuelve posiciones de jugadores en POSICIONES_SHEET', () => {
    expect(obtenerPosicionesJugador('Jugador 1')).toBeTruthy();
    expect(obtenerPosicionesJugador('Jugador 2')).toBeTruthy();
  });

  it('resuelve posiciones de jugadores desde catálogo anonimizado', () => {
    expect(obtenerPosicionesJugador('Jugador 10')).toBeTruthy();
  });

  it('resuelve posiciones desde sesiones GPS pasadas como argumento', () => {
    const mockSesiones = [
      {
        jugadores: [
          { jugador: 'JUAN PEREZ', pos: 'DL' }
        ]
      }
    ];
    expect(obtenerPosicionesJugador('JUAN PEREZ', mockSesiones)).toBe('Defensor Lateral');
  });

  it('devuelve guión si el jugador no existe o está vacío', () => {
    expect(obtenerPosicionesJugador('')).toBe('—');
    expect(obtenerPosicionesJugador(null)).toBe('—');
    expect(obtenerPosicionesJugador('JUGADOR_INEXISTENTE_XYZ_123')).toBe('—');
  });
});
