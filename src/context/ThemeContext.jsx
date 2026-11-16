import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  tema: 'claro',
  toggleTema: () => {},
});

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem('integral_tema') || 'claro';
    } catch {
      return 'claro';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('integral_tema', tema);
    } catch {}
    if (tema === 'oscuro') {
      document.body.className = 'tema-oscuro';
    } else {
      document.body.className = 'tema-claro';
    }
  }, [tema]);

  const toggleTema = () => {
    setTema(prev => (prev === 'claro' ? 'oscuro' : 'claro'));
  };

  return (
    <ThemeContext.Provider value={{ tema, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
