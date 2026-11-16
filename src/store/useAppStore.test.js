import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore (Zustand Global State)', () => {
  beforeEach(() => {
    // Resetear el store al estado inicial antes de cada test
    useAppStore.setState({
      categoria: 'Cuarta',
      targetJugador: null,
    });
  });

  it('debe inicializar la categoría en Cuarta División por defecto', () => {
    const state = useAppStore.getState();
    expect(state.categoria).toBe('Cuarta');
    expect(state.targetJugador).toBeNull();
  });

  it('debe actualizar la categoría activa globalmente con setCategoria', () => {
    useAppStore.getState().setCategoria('Quinta');
    expect(useAppStore.getState().categoria).toBe('Quinta');

    useAppStore.getState().setCategoria('Séptima');
    expect(useAppStore.getState().categoria).toBe('Séptima');
  });

  it('debe ignorar valores nulos o vacíos en setCategoria para proteger el estado', () => {
    useAppStore.getState().setCategoria('Quinta');
    useAppStore.getState().setCategoria(null);
    expect(useAppStore.getState().categoria).toBe('Quinta');

    useAppStore.getState().setCategoria('');
    expect(useAppStore.getState().categoria).toBe('Quinta');
  });

  it('debe permitir guardar y limpiar el jugador seleccionado global', () => {
    useAppStore.getState().setTargetJugador('Ezequiel Perez');
    expect(useAppStore.getState().targetJugador).toBe('Ezequiel Perez');

    useAppStore.getState().setTargetJugador(null);
    expect(useAppStore.getState().targetJugador).toBeNull();
  });
});
