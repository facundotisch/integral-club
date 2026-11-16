export function fmt(n, d) {
  if (n == null || isNaN(n)) return '—';
  return d ? n.toFixed(d).replace('.', ',') : Math.round(n).toLocaleString('es-AR');
}

export function pct(s) {
  if (!s || s === '') return 0;
  return parseFloat(String(s).replace('%', '').replace(',', '.')) || 0;
}

export function prom(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function sum(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0);
}

export function zonaCls(z) {
  return 'zona-' + (z || '').replace(/[^a-záéíóú]/gi, '');
}

export function objVel(v) {
  if (v >= 100) return { txt: 'Muy bien', col: '#5BA3DE' };
  if (v >= 90) return { txt: 'Bien', col: '#2ECC71' };
  return { txt: 'Baja', col: '#E74C3C' };
}

export function rivalesMap(sesiones = []) {
  const m = {};
  sesiones.forEach(s => {
    if (!s.tipo || s.tipo.indexOf('Partido') < 0) return;
    if (s.rival) m[s.fecha] = s.rival;
    if (s.jugadores) {
      s.jugadores.forEach(j => {
        if (j.rival) m[s.fecha] = j.rival;
      });
    }
  });
  return m;
}

export function etiquetaPartido(fecha, m) {
  const r = m && m[fecha] ? m[fecha].trim() : '';
  if (!r) return fecha;
  return /^vs\.?\s*/i.test(r) ? r : ('vs ' + r);
}

export function huellaNombre(s) {
  s = String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.split(' ').filter(w => w).sort().join(' ');
}

export function exportarPDF(titulo = 'Informe') {
  const orig = typeof document !== 'undefined' ? document.title : '';
  const cleanTitle = (titulo || 'Informe').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Informe';
  if (typeof document !== 'undefined') {
    document.title = cleanTitle;
    document.body.classList.add('is-printing');
  }

  // Si hay un rerender activo (como en Ranking o Planilla), redibujar con configuración de impresión
  if (typeof window !== 'undefined' && typeof window.EXPORT_RERENDER === 'function') {
    try { window.EXPORT_RERENDER(true); } catch(e){}
  }

  // Asegurar que los gráficos de Chart.js hagan resize antes de imprimir
  if (typeof window !== 'undefined' && window.charts) {
    Object.keys(window.charts).forEach(k => {
      try {
        if (window.charts[k]) {
          window.charts[k].resize();
          window.charts[k].update('none');
        }
      } catch (e) {}
    });
  }

  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.print();

      const restore = () => {
        if (typeof document !== 'undefined') {
          document.title = orig;
          document.body.classList.remove('is-printing');
        }
        if (typeof window !== 'undefined' && typeof window.EXPORT_RERENDER === 'function') {
          try { window.EXPORT_RERENDER(false); } catch(e){}
        }
        if (typeof window !== 'undefined' && window.charts) {
          Object.keys(window.charts).forEach(k => {
            try {
              if (window.charts[k]) {
                window.charts[k].resize();
                window.charts[k].update('none');
              }
            } catch (e) {}
          });
        }
      };
      if ('onafterprint' in window) {
        window.addEventListener('afterprint', restore, { once: true });
      }
      setTimeout(restore, 2500);
    }
  }, 250);
}
