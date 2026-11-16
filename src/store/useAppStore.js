import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Almacenamiento seguro compatible con SSR, tests y navegadores
const safeStorage = {
  getItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {}
    return null;
  },
  setItem: (name, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
      }
    } catch {}
  },
  removeItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch {}
  },
};

export const useAppStore = create(
  persist(
    (set) => ({
      // Categoría formativa activa global ('Cuarta' | 'Quinta' | 'Sexta' | 'Séptima' | 'Octava' | 'Novena')
      categoria: 'Cuarta',
      setCategoria: (nuevaCat) => {
        if (!nuevaCat) return;
        set({ categoria: nuevaCat });
      },

      // Jugador seleccionado global (para cruzar datos de GPS y Nutrición)
      targetJugador: null,
      setTargetJugador: (jugador) => set({ targetJugador: jugador }),
    }),
    {
      name: 'integral_app_store',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
