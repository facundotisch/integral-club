/**
 * Integral Club · Módulo de Composición Corporal
 * Fórmulas y utilidades para protocolo ISAK II / 5 Componentes (Kerr)
 */

// Sumatoria de 6 pliegues principales en mm
export function calcularSumatoria6Pliegues(p) {
  const triceps = parseFloat(p.triceps || p['Tríceps'] || 0);
  const subescapular = parseFloat(p.subescapular || p['Subescapular'] || 0);
  const supraespinal = parseFloat(p.supraespinal || p['Supraespinal'] || 0);
  const abdominal = parseFloat(p.abdominal || p['Abdominal'] || 0);
  const muslo = parseFloat(p.musloMedial || p['Muslo Medial'] || p['Muslo (medial)'] || 0);
  const pantorrilla = parseFloat(p.pantorrilla || p['Pantorrilla (máxima)'] || 0);

  const suma = triceps + subescapular + supraespinal + abdominal + muslo + pantorrilla;
  return Math.round(suma * 10) / 10;
}

// Índice Músculo / Óseo (IMO = Masa Muscular (kg) / Masa Ósea (kg))
export function calcularIMO(masaMuscularKg, masaOseaKg) {
  if (!masaOseaKg || masaOseaKg <= 0) return 0;
  return Math.round((masaMuscularKg / masaOseaKg) * 100) / 100;
}

// Clasificación de percentiles / semáforo para fútbol formativo
export function clasificarSumatoriaPliegues(sumatoriaMm) {
  if (sumatoriaMm < 35) return { nivel: 'Excelente', color: '#047857', bg: '#d1fae5' };
  if (sumatoriaMm <= 48) return { nivel: 'Óptimo', color: '#002B66', bg: '#e0f2fe' };
  if (sumatoriaMm <= 60) return { nivel: 'Aceptable', color: '#b45309', bg: '#fef3c7' };
  return { nivel: 'Elevado', color: '#b91c1c', bg: '#fee2e2' };
}
