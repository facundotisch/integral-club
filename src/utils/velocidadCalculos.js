/**
 * Utilidades puras para el cálculo del Histórico de Velocidad (GPS)
 * Protocolo Integral Club: Exclusivamente entrenamientos MD+2 a MD-1 (sin partidos ni MD+1)
 */

export function parseFecha(f) {
  if (!f) return new Date(NaN);
  const x = String(f).split('/');
  if (x.length < 3) return new Date(NaN);
  return new Date(+x[2], (+x[1]) - 1, +x[0]);
}

function padZero(n) {
  return (n < 10 ? '0' : '') + n;
}

export function mondayOf(d) {
  const day = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

export function keyOf(d) {
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

export function rangoDe(mon) {
  const fin = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return `${padZero(mon.getDate())}/${padZero(mon.getMonth() + 1)} al ${padZero(fin.getDate())}/${padZero(fin.getMonth() + 1)}/${fin.getFullYear()}`;
}

export function normMD(x) {
  let s = String(x || '').trim().toUpperCase().replace(/\s+/g, '');
  if (s === 'MD') return 'MD';
  const numMatch = s.match(/\d+/);
  if (!numMatch) return '';
  const num = parseInt(numMatch[0], 10);
  const minus = s.indexOf('-') >= 0;
  const plus = s.indexOf('+') >= 0;
  if (minus && !plus) return `MD-${num}`;
  if (plus && !minus) return `MD+${num}`;
  return `MD-${num}`;
}

export function mdDe(s) {
  const raw = String(s?.dia || s?.per || '').trim();
  if (/^MD$/i.test(raw)) return 'MD';
  const m = raw.match(/MD\s*[+\-]?\s*\d+/i);
  return m ? normMD(m[0]) : '';
}

// Filtro estricto: Solo entrenamientos MD+2 a MD-1 (se excluyen partidos, el día de partido MD y el regenerativo MD+1)
export function esEntrenamientoValidoVelocidad(s) {
  if (!s) return false;
  if (String(s.tipo || '').indexOf('Partido') >= 0) return false;
  const md = mdDe(s);
  if (md === 'MD' || md === 'MD+1') return false;
  return true;
}

export function calcularSemanasEntrenamiento(sesiones = []) {
  const weekMap = {};
  sesiones.forEach(s => {
    if (!esEntrenamientoValidoVelocidad(s)) return;
    const d = parseFecha(s.fecha);
    if (isNaN(d.getTime())) return;
    const m = mondayOf(d);
    const k = keyOf(m);
    if (!weekMap[k]) {
      weekMap[k] = { key: k, mon: m, label: `Semana del ${rangoDe(m)}` };
    }
  });

  return Object.values(weekMap).sort((a, b) => a.mon - b.mon);
}

export function calcularRecordsVelocidad(sesiones = []) {
  const recordMap = {};
  sesiones.forEach(s => {
    if (!esEntrenamientoValidoVelocidad(s)) return;
    (s.jugadores || []).forEach(j => {
      if (!j?.jugador) return;
      const v = parseFloat(j.topSpeed) || 0;
      if (recordMap[j.jugador] == null || v > recordMap[j.jugador]) {
        recordMap[j.jugador] = Math.round(v * 10) / 10;
      }
    });
  });
  return recordMap;
}
