// Auto-generated modular renderers from production Pagina.html
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { resolvePlayerPhoto, areSamePlayer } from '../utils/photoResolver';
import { isComodin, sanitizeComodines, fetchCategoryData } from '../services/api';
import { obtenerPosicionesJugador } from '../data/jugadoresPosiciones.js';

Chart.register(ChartDataLabels);

if (typeof window !== 'undefined' && !window._printHandlersRegistered) {
  window._printHandlersRegistered = true;
  window.addEventListener('beforeprint', function() {
    document.body.classList.add('is-printing');
    if (window.charts) {
      Object.keys(window.charts).forEach(function(k) {
        try { if (window.charts[k]) window.charts[k].resize(); } catch (e) {}
      });
    }
  });
  window.addEventListener('afterprint', function() {
    document.body.classList.remove('is-printing');
    if (window.charts) {
      Object.keys(window.charts).forEach(function(k) {
        try { if (window.charts[k]) window.charts[k].resize(); } catch (e) {}
      });
    }
  });
}

// Configuración global de Chart.js
Chart.defaults.font.family = "'Plus Jakarta Sans', -apple-system, sans-serif";
Chart.defaults.color = '#000000';
if (Chart.defaults.scale && Chart.defaults.scale.grid) {
  Chart.defaults.scale.grid.display = false;
}

// Global state variables for legacy renderers
export let D = {};
export let CAT_ACTUAL = 'Séptima';
export let CATEGORIAS_LIST = ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena'];
export let CONFIG = { tol: 10, objetivos: {} };
export let TEMA = 'light';
export let EXPORT_RERENDER = null;
export let EXPORT_TITULO = '';
export let charts = {};
export let activeOpt = null;
export let PANEL_ACTUAL = null;

export function setupLegacyEnvironment(D_in, cat, cats, chartsRef, currentTema = 'claro') {
  D = (D_in && D_in.data) ? D_in.data : (D_in || {});
  sanitizeComodines(D);
  CAT_ACTUAL = cat || (D_in && D_in.catActual) || 'Séptima';
  CATEGORIAS_LIST = cats || (D_in && D_in.categorias) || ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena'];
  CONFIG = (D_in && D_in.config) || { tol: 10, objetivos: {} };
  charts = chartsRef || {};
  if (typeof window !== 'undefined') {
    window.charts = charts;
  }
  TEMA = currentTema === 'claro' ? 'light' : 'dark';
  EXPORT_RERENDER = null;

  // Ajustar color base del texto según el tema
  const isLight = TEMA === 'light';
  Chart.defaults.color = isLight ? '#000000' : '#f8fafc';
  if (Chart.defaults.scale && Chart.defaults.scale.grid) {
    Chart.defaults.scale.grid.display = false;
  }

  // Sanear métricas corruptas defensivamente en el frontend
  // Sanear métricas corruptas defensivamente en el frontend
  if (D && D.sesiones && Array.isArray(D.sesiones)) {
    D.sesiones.forEach(function(s) {
      if (!s.jugadores || !Array.isArray(s.jugadores)) return;
      s.jugadores.forEach(function(j) {
        if (j.dist > 20000) {
          var sD = String(j.dist);
          var mD = sD.match(/^1?(\d{4})(\d{2})0000$/);
          if (mD) j.dist = Math.round(parseFloat(mD[1] + '.' + mD[2]));
          else if (j.drel > 20 && j.drel < 150) j.dist = Math.round(j.drel * 70);
          else j.dist = 4000;
        }
        // Sanear minutos corruptos o fracciones de día de Excel/Sheets (ej: 0.05 días = 72 min)
        if (j.min > 0 && j.min < 1) {
          j.min = Math.round(j.min * 1440 * 10) / 10;
        } else if ((!j.min || j.min <= 0) && j.dist > 500 && j.drel > 20 && j.drel < 150) {
          j.min = Math.round((j.dist / j.drel) * 10) / 10;
        }
        if (j.topSpeed > 45) {
          var sT = String(j.topSpeed);
          var mT = sT.match(/^(\d{1,2})202\d(\d{2})?/);
          if (mT) {
            var candT = parseInt(mT[1], 10) + (mT[2] ? parseInt(mT[2], 10)/100 : 0);
            j.topSpeed = (candT <= 40) ? Math.round(candT * 100)/100 : parseInt(mT[1], 10);
          } else if (j.topSpeed <= 450) {
            j.topSpeed = Math.round((j.topSpeed / 10) * 100) / 100;
          } else {
            j.topSpeed = 24;
          }
        }
        if (j.s25 > 2000) j.s25 = 0;
        if (j.mphi > 50) {
          var sM = String(j.mphi);
          var mM = sM.match(/^(\d{1,2})202\d(\d{2})?/);
          if (mM) j.mphi = parseInt(mM[1], 10);
          else j.mphi = 15;
        }
        if (j.accAlta > 200) j.accAlta = 25;
        if (j.decAlta > 200) j.decAlta = 25;
        if (j.acc > 800) j.acc = 250;
        if (j.dec > 800) j.dec = 250;
      });
    });

    // Consolidar fragmentos de partidos divididos por arrastres en la planilla (ej: 2 jugadores en fecha desfasada)
    var partidos = D.sesiones.filter(function(s) { return (s.tipo || '').indexOf('Partido') >= 0; });
    var fechasEliminar = {};
    partidos.forEach(function(p) {
      if (fechasEliminar[p.fecha]) return;
      if (p.jugadores && p.jugadores.length <= 3) {
        var parent = partidos.find(function(p2) {
          return p2 !== p && p2.rival && p2.rival === p.rival && p2.jugadores && p2.jugadores.length >= 8 && !fechasEliminar[p2.fecha];
        });
        if (parent) {
          p.jugadores.forEach(function(j) {
            if (!parent.jugadores.some(function(pj) { return pj.jugador === j.jugador; })) {
              parent.jugadores.push(j);
            }
          });
          fechasEliminar[p.fecha] = true;
        }
      }
    });
    if (Object.keys(fechasEliminar).length > 0) {
      D.sesiones = D.sesiones.filter(function(s) { return !fechasEliminar[s.fecha]; });
    }
    // Descartar partidos fantasma con 1 solo jugador
    D.sesiones = D.sesiones.filter(function(s) {
      if ((s.tipo || '').indexOf('Partido') >= 0 && (!s.jugadores || s.jugadores.length <= 1)) return false;
      return true;
    });
  }

  if (typeof window !== 'undefined') {
    window.D = D;
    window.CAT_ACTUAL = CAT_ACTUAL;
    window.CATEGORIAS_LIST = CATEGORIAS_LIST;
    window.CONFIG = CONFIG;
    window.charts = charts;
    window.TEMA = TEMA;
    window.EXPORT_RERENDER = EXPORT_RERENDER;
    window.EXPORT_TITULO = EXPORT_TITULO;
    window.expl = expl;
    window.exportarPDF = exportarPDF;
    window.resolvePlayerPhoto = resolvePlayerPhoto;
  }
}

// ─── Helpers requeridos por los paneles ───
export function fmt(n, d) {
  if (n == null || isNaN(n)) return '—';
  return d ? n.toFixed(d).replace('.', ',') : Math.round(n).toLocaleString('es-AR');
}
export function pct(s) {
  if (!s || s === '') return 0;
  return parseFloat(String(s).replace('%', '').replace(',', '.')) || 0;
}
export function zonaCls(z) {
  return 'zona-' + (z || '').replace(/[^a-záéíóú]/gi, '');
}
export function objVel(v) {
  if (v >= 100) return { txt: 'Muy bien', col: '#5BA3DE' };
  if (v >= 90) return { txt: 'Bien', col: '#2ECC71' };
  return { txt: 'Baja', col: '#E74C3C' };
}
export function sintesis(html) {
  return '<div class="sintesis"><h4>Síntesis — qué se observa</h4>' + html + '</div>';
}
export function expl(t) {
  return '<div class="chart-expl">' + (t || '') + '</div>';
}
export function exportarPDF(nombre) {
  const orig = typeof document !== 'undefined' ? document.title : '';
  const clean = (nombre || 'Informe').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Informe';
  if (typeof document !== 'undefined') {
    document.title = clean;
    document.body.classList.add('is-printing');
  }

  // Si hay un rerender activo (como en Ranking o Planilla), redibujar con configuración de impresión
  if (typeof EXPORT_RERENDER === 'function') {
    try { EXPORT_RERENDER(true); } catch(e){}
  }

  if (typeof window !== 'undefined' && window.charts) {
    Object.keys(window.charts).forEach(function(k) {
      try {
        if (window.charts[k]) {
          window.charts[k].resize();
          window.charts[k].update('none');
        }
      } catch (e) {}
    });
  }
  setTimeout(function() {
    if (typeof window !== 'undefined') {
      window.print();
      const restore = function() {
        if (typeof document !== 'undefined') {
          document.title = orig;
          document.body.classList.remove('is-printing');
        }
        if (typeof EXPORT_RERENDER === 'function') {
          try { EXPORT_RERENDER(false); } catch(e){}
        }
        if (typeof window !== 'undefined' && window.charts) {
          Object.keys(window.charts).forEach(function(k) {
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
      setTimeout(restore, 2000);
    }
  }, 250);
}
export function prom(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
export function cT() {
  if (typeof document !== 'undefined' && document.body && document.body.classList.contains('is-printing')) {
    return '#06121E';
  }
  return TEMA === 'light' ? '#000000' : '#ffffff';
}
export function cM() {
  if (typeof document !== 'undefined' && document.body && document.body.classList.contains('is-printing')) {
    return '#334155';
  }
  return TEMA === 'light' ? '#000000' : '#cbd5e1';
}
export function cG() { return 'transparent'; }
export function DL_OPT() {
  const isLight = TEMA === 'light';
  return { 
    color: isLight ? '#000000' : '#ffffff', 
    font: { family: "'JetBrains Mono', monospace", size: 11, weight: 'bold' }, 
    anchor: 'end', 
    align: 'end' 
  };
}
export function zonaDe() { return null; }
export function kpi(val, label) {
  return '<div class="kpi"><div class="v">' + val + '</div><div class="l">' + label + '</div></div>';
}
export function kpiCmp(val, avg, label, unit, dec) {
  var u = unit || ''; var d = dec || 0; var dif = avg > 0 ? Math.round((val - avg) / avg * 100) : 0;
  var difTxt = dif > 0 ? '+' + dif + '%' : dif + '%';
  var difCol = Math.abs(dif) < 10 ? 'var(--muted)' : dif > 0 ? 'var(--green)' : 'var(--red)';
  return '<div class="kpi"><div class="v">' + fmt(val, d) + '<small>' + u + '</small></div>' +
    '<div class="l">' + label + '</div>' +
    '<div class="kpi-sub">Prom: ' + fmt(avg, d) + u +
    ' <span style="color:' + difCol + ';font-weight:600">(' + difTxt + ')</span></div></div>';
}
export function rivalesMap() {
  var ses = (window.D && window.D.sesiones) || [];
  var m = {};
  ses.forEach(function (s) {
    if ((s.tipo || '').indexOf('Partido') < 0) return;
    if (s.rival) m[s.fecha] = s.rival;
    if (s.jugadores) {
      s.jugadores.forEach(function (j) {
        if (j.rival) m[s.fecha] = j.rival;
      });
    }
  });
  return m;
}
export function etiquetaPartido(fecha, m) {
  var r = m && m[fecha] ? m[fecha].trim() : '';
  if (!r) return fecha;
  return /^vs\.?\s*/i.test(r) ? r : ('vs ' + r);
}
export function huellaNombreFront_(s) {
  s = String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.split(' ').filter(function (w) { return w; }).sort().join(' ');
}

// Attach helpers to window so legacy code runs seamlessly
if (typeof window !== 'undefined') {
  window.fmt = fmt;
  window.pct = pct;
  window.zonaCls = zonaCls;
  window.objVel = objVel;
  window.sintesis = sintesis;
  window.prom = prom;
  window.cT = cT;
  window.cM = cM;
  window.cG = cG;
  window.DL_OPT = DL_OPT;
  window.zonaDe = zonaDe;
  window.kpi = kpi;
  window.kpiCmp = kpiCmp;
  window.rivalesMap = rivalesMap;
  window.etiquetaPartido = etiquetaPartido;
  window.huellaNombreFront_ = huellaNombreFront_;
  window.expl = expl;
  window.exportarPDF = exportarPDF;
}

// ─── Production Panel Renderers ───
function renderPlanilla(p){
  // Columnas compactas y sin decimales (redondeado directo)
  const COLS=[
    {k:'dist',   lbl:'D (m)',    dec:0},
    {k:'drel',   lbl:'Drel',     dec:0},
    {k:'mp20',   lbl:'MP>20',    dec:0},
    {k:'mp55',   lbl:'MP>55',    dec:0},
    {k:'mphi',   lbl:'MPHI%',    dec:0},
    {k:'hi',     lbl:'S>16',     dec:0},
    {k:'z1618',  lbl:'16-18',    dec:0},
    {k:'z1825',  lbl:'18-25',    dec:0},
    {k:'s25',    lbl:'S>25',     dec:0},
    {k:'acc',    lbl:'Acc>2,5',  dec:0},
    {k:'dec',    lbl:'Dec>-2,5', dec:0},
    {k:'accAlta',lbl:'Acc>4',    dec:0},
    {k:'decAlta',lbl:'Dec>-4',   dec:0},
    {k:'top',    lbl:'Top',      dec:0},
    {k:'sprints',lbl:'Sprint',   dec:0}
  ];
  const NOSUMA={drel:1, mphi:1, top:1};
  const valJ=(j,k)=> k==='top' ? (j.topSpeed||0) : (j[k]||0);
  const fmtN=(v,d)=>{ if(v==null||isNaN(v))return '—'; return Math.round(v).toLocaleString('es-AR'); };
  const pd=f=>{const x=String(f).split('/');return new Date(x[2],x[1]-1,x[0]);};

  function normMD(x){
    x=String(x).trim().toUpperCase().replace(/\s+/g,'');
    if(x==='MD')return 'MD';
    const num=x.match(/\d+/); if(!num)return '';
    const n=parseInt(num[0],10);
    const minus=x.indexOf('-')>=0, plus=x.indexOf('+')>=0;
    if(minus&&!plus)return 'MD-'+n;
    if(plus&&!minus)return 'MD+'+n;
    return 'MD-'+n;
  }

  function isPartido(s){
    if(!s) return false;
    if((s.tipo||'').indexOf('Partido')>=0) return true;
    var raw=String(s.per||s.dia||'').trim();
    return /^MD$/i.test(raw);
  }

  // Primer columna: solo MD sin nombres de días para achicar ancho
  function etqDia(s){
    var raw=String(s.per||s.dia||'').trim();
    var m=raw.match(/MD\s*[+\-]?\s*\d+/i);
    var md=m ? normMD(m[0]) : (/^MD$/i.test(raw)?'MD':'');
    var esP = isPartido(s);
    if(esP){
      var rMap = (typeof rivalesMap === 'function') ? rivalesMap() : {};
      var riv = (s.rival && s.rival.trim()) || (rMap && rMap[s.fecha] ? rMap[s.fecha].trim() : '');
      if(!riv && s.jugadores){
        for(var ji=0; ji<s.jugadores.length; ji++){
          if(s.jugadores[ji].rival){ riv = s.jugadores[ji].rival.trim(); break; }
        }
      }
      if(riv){
        return 'MD vs ' + riv.replace(/^vs\.?\s*/i, '').trim();
      }
      return 'MD';
    }
    if(md) return md;
    return raw || s.dia || s.fecha;
  }

  function ordenDia(s){
    var d=pd(s.fecha);
    return (d.getDay()+6)%7;
  }

  const ses=D.sesiones||[];
  function lunesDe(f){const d=pd(f);const off=(d.getDay()+6)%7;d.setDate(d.getDate()-off);return d;}
  function keyLunes(f){const l=lunesDe(f);return keyF_(l);}
  function keyF_(d){return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear();}

  const semanas={};
  ses.forEach(function(s){
    const kl=keyLunes(s.fecha);
    if(!semanas[kl])semanas[kl]={lunes:lunesDe(s.fecha),sesiones:[]};
    semanas[kl].sesiones.push(s);
  });
  const clavesSemana=Object.keys(semanas).sort(function(a,b){return semanas[b].lunes-semanas[a].lunes;});
  if(!clavesSemana.length){p.innerHTML='<div class="panel-title">Planilla semanal</div><div class="obs">No hay sesiones cargadas todavía.</div>';return;}

  const UMBRAL_MIN={'Séptima':70,'Sexta':70,'Quinta':70,'Cuarta':70,'Octava':50,'Novena':50,'Reserva':70,'Primera':70};
  const minPart=UMBRAL_MIN[CAT_ACTUAL]!=null?UMBRAL_MIN[CAT_ACTUAL]:70;

  function getMinNum(j){
    if(!j) return 0;
    var val = j.min != null ? j.min : (j.minutos || j.duracion || 0);
    if(typeof val === 'number') return isNaN(val) ? 0 : val;
    var s = String(val).replace(',', '.').trim();
    var num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }

  function promEquipo(s,k){
    const esP = isPartido(s);
    let arr = (s.jugadores||[]).filter(function(j){
      if ((j.dist||0) <= 0) return false;
      if (esP) return getMinNum(j) >= minPart;
      return true;
    }).map(function(j){ return valJ(j,k); });

    if (esP && !arr.length) {
      arr = (s.jugadores||[]).filter(function(j){ return (j.dist||0) > 0; }).map(function(j){ return valJ(j,k); });
    }
    if(!arr.length)return 0;
    if(k==='top') return Math.max.apply(null, arr);
    return arr.reduce(function(a,b){return a+b;},0)/arr.length;
  }

  function promPartidoTitulares(s,k){
    let arr=(s.jugadores||[]).filter(function(j){return (j.dist||0)>0 && getMinNum(j)>=minPart;}).map(function(j){return valJ(j,k);});
    if(!arr.length) arr=(s.jugadores||[]).filter(function(j){return (j.dist||0)>0;}).map(function(j){return valJ(j,k);});
    if(!arr.length)return null;
    if(k==='top') return Math.max.apply(null, arr);
    return arr.reduce(function(a,b){return a+b;},0)/arr.length;
  }

  const partidos=ses.filter(function(s){return s.tipo.indexOf('Partido')>=0;});
  const refPartido={};
  COLS.forEach(function(c){
    if(!partidos.length){refPartido[c.k]=0;return;}
    const vals=partidos.map(function(s){return promPartidoTitulares(s,c.k);}).filter(function(v){return v!=null;});
    refPartido[c.k]=vals.length?vals.reduce(function(a,b){return a+b;},0)/vals.length:0;
  });

  function etqSemana(kl){
    const l=semanas[kl].lunes;
    const dom=new Date(l);dom.setDate(dom.getDate()+6);
    const mm=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return l.getDate()+' '+mm[l.getMonth()]+' – '+dom.getDate()+' '+mm[dom.getMonth()]+' '+dom.getFullYear();
  }

  function porMDde(sesLista){
    const byMD={};
    const ord=sesLista.slice().sort(function(a,b){return ordenDia(a)-ordenDia(b);});
    ord.forEach(function(s){
      const etq=etqDia(s);
      if(!byMD[etq])byMD[etq]=[];
      byMD[etq].push(s);
    });
    const mds=Object.keys(byMD);
    return {byMD:byMD,mds:mds};
  }

  function valMD(lista,k){
    const vals=lista.map(function(s){return promEquipo(s,k);}).filter(function(v){return v>0;});
    if(!vals.length)return 0;
    if(k==='top') return Math.max.apply(null, vals);
    return vals.reduce(function(a,b){return a+b;},0)/vals.length;
  }

  p.innerHTML='<div class="panel-title">Planilla semanal</div>'+
    '<div class="panel-sub">Reúne en una sola tabla el promedio del equipo por cada día de la semana con todas las variables físicas. Abajo muestra el acumulado de la semana, la media diaria, el acumulado de la semana anterior, el % comparado entre ambos y una tabla de dosificación: cuánto representa cada % de la carga de un partido, para planificar los estímulos.</div>'+
    '<div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+
      '<select class="sel" id="selPlanSem">'+
        clavesSemana.map(function(kl,i){return '<option value="'+kl+'"'+(i===0?' selected':'')+'>'+etqSemana(kl)+'</option>';}).join('')+
      '</select>'+
      '<select class="sel" id="selPlanModo">'+
        '<option value="sin_partido" selected>Solo entrenamientos (sin sábado / partido)</option>'+
        '<option value="todos">Semana completa (con partido)</option>'+
      '</select>'+
      '<span id="badgeMicroPlan" style="margin-left:auto;background:var(--celeste);border:1px solid rgba(255,255,255,0.3);color:#ffffff !important;font-weight:800;padding:6px 14px;border-radius:8px;font-size:12.5px;display:inline-flex;align-items:center;gap:6px"></span>'+
    '</div>'+
    '<div id="planBody"></div>';

  function dibujar(){
    let kl = document.getElementById('selPlanSem') ? document.getElementById('selPlanSem').value : '';
    if (!semanas[kl]) kl = clavesSemana[0];
    const idxSem = clavesSemana.indexOf(kl);
    const klPrev = clavesSemana[idxSem+1];
    const modoPlan = document.getElementById('selPlanModo') ? document.getElementById('selPlanModo').value : 'sin_partido';
    const sesSemAll = semanas[kl] ? semanas[kl].sesiones : [];

    const mcNums = [];
    sesSemAll.forEach(function(s){
      var rawMc = String(s.micro||'').trim();
      var mMatch = rawMc.match(/\d+/);
      if (mMatch) {
        var num = parseInt(mMatch[0], 10);
        if (num > 0 && mcNums.indexOf(num) < 0) mcNums.push(num);
      }
    });
    mcNums.sort(function(a,b){ return a-b; });
    var badgeEl = document.getElementById('badgeMicroPlan');
    if (badgeEl) {
      badgeEl.innerHTML = 'Microciclo: ' + (mcNums.length ? ('MC ' + mcNums.join(', ')) : 'Sin microciclo registrado');
    }

    let sesSem = sesSemAll;
    if (modoPlan === 'sin_partido') {
      var filtradas = sesSemAll.filter(function(s){
        var d = pd(s.fecha);
        var esSab = d.getDay() === 6;
        return !esSab && !isPartido(s);
      });
      sesSem = filtradas.length ? filtradas : sesSemAll;
    }

    const G=porMDde(sesSem);
    const byMD=G.byMD, mds=G.mds;

    const acum={};
    COLS.forEach(function(c){
      const vv=mds.map(function(md){return valMD(byMD[md],c.k);});
      if(c.k==='top'){
        acum[c.k]=vv.length?Math.max.apply(null,vv):0;
      } else if(NOSUMA[c.k]){
        acum[c.k]=vv.length?vv.reduce(function(a,b){return a+b;},0)/vv.length:0;
      } else {
        acum[c.k]=vv.reduce(function(a,b){return a+b;},0);
      }
    });

    const acumPrev={}; let hayPrev=false;
    if(klPrev){
      var sesPrevAll = semanas[klPrev].sesiones;
      var sesPrev = sesPrevAll;
      if (modoPlan === 'sin_partido') {
        var prevFilt = sesPrevAll.filter(function(s){
          var d = pd(s.fecha);
          return d.getDay() !== 6 && !isPartido(s);
        });
        sesPrev = prevFilt.length ? prevFilt : sesPrevAll;
      }
      const GPrev=porMDde(sesPrev);
      hayPrev=GPrev.mds.length>0;
      COLS.forEach(function(c){
        const vv=GPrev.mds.map(function(md){return valMD(GPrev.byMD[md],c.k);});
        if(c.k==='top'){
          acumPrev[c.k]=vv.length?Math.max.apply(null,vv):0;
        } else if(NOSUMA[c.k]){
          acumPrev[c.k]=vv.length?vv.reduce(function(a,b){return a+b;},0)/vv.length:0;
        } else {
          acumPrev[c.k]=vv.reduce(function(a,b){return a+b;},0);
        }
      });
    }

    // ── Tabla principal sin decimales y con tooltip instantáneo ──
    let head='<tr><th style="position:sticky;left:0;background:var(--card2);z-index:2">DÍA</th>'+COLS.map(function(c){return '<th>'+c.lbl+'</th>';}).join('')+'</tr>';
    let filas=mds.map(function(md){
      return '<tr><td style="position:sticky;left:0;background:var(--card);font-weight:700;color:var(--text)">'+md+'</td>'+
        COLS.map(function(c){
          const v=valMD(byMD[md],c.k);
          if(v <= 0) return '<td>—</td>';
          var refVal = refPartido[c.k];
          var tipHtml = '';
          if(refVal && refVal > 0){
            var pComp = Math.round((v / refVal) * 100);
            tipHtml = '<span class="plan-tip">' + pComp + '% de partido</span>';
          }
          return '<td><div class="plan-cell-wrap">' + Math.round(v).toLocaleString('es-AR') + tipHtml + '</div></td>';
        }).join('')+'</tr>';
    }).join('');

    if(!mds.length){
      filas='<tr><td colspan="'+(COLS.length+1)+'" style="text-align:center;color:var(--muted);padding:16px">Esta semana no tiene sesiones cargadas.</td></tr>';
    }

    // Filas resumen compactas (Acum., Media, Sem. Ant., % vs Ant.)
    function filaResumen(label,obj,estilo,esPct){
      return '<tr style="'+estilo+'"><td style="position:sticky;left:0;'+estilo+';font-weight:700">'+label+'</td>'+
        COLS.map(function(c){
          let v=obj[c.k];
          if(esPct){ return '<td>'+(v!=null&&!isNaN(v)?(v>0?'+':'')+Math.round(v)+'%':'—')+'</td>'; }
          return '<td>'+fmtN(v,0)+'</td>';
        }).join('')+'</tr>';
    }
    const isLight = TEMA === 'light';
    const stAcum = isLight ? 'background:#ecfdf5;color:#065f46;border-top:2px solid #a7f3d0' : 'background:#0d2a1e;color:#7ee6a8';
    const stMedia = isLight ? 'background:#eff6ff;color:#1e40af;border-top:1px solid #bfdbfe' : 'background:#0d2438;color:#8ab4e8';
    const stPrev = isLight ? 'background:#f8fafc;color:#475569;border-top:1px solid #e2e8f0' : 'background:#1a1a2e;color:var(--muted)';
    const stDelta = isLight ? 'background:#faf5ff;color:#6b21a8;border-top:1px solid #e9d5ff' : 'background:#221a2e;color:#c9a0e8';

    let resumen=filaResumen('Acum.',acum,stAcum,false);
    var mediaObj={};
    var nDias=mds.length||1;
    COLS.forEach(function(c){ mediaObj[c.k]=NOSUMA[c.k]?Math.round(acum[c.k]):Math.round(acum[c.k]/nDias); });
    resumen+=filaResumen('Media',mediaObj,stMedia,false);
    if(klPrev && hayPrev){
      resumen+=filaResumen('Sem. Ant.',acumPrev,stPrev,false);
      const delta={};
      COLS.forEach(function(c){ delta[c.k]= acumPrev[c.k]>0 ? Math.round((acum[c.k]-acumPrev[c.k])/acumPrev[c.k]*100) : null; });
      resumen+=filaResumen('% vs Ant.',delta,stDelta,true);
    }

    // ── Tabla de % de competencia (dosificación) sin decimales ──
    const PCTS=[100,90,80,70,60,50,40,30,20,10];
    let compHead='<tr><th style="position:sticky;left:0;background:var(--card2);z-index:2">% comp.</th>'+COLS.map(function(c){return '<th>'+c.lbl+'</th>';}).join('')+'</tr>';
    let compFilas=PCTS.map(function(pct){
      const col = isLight
        ? (pct>=80?'#15803d':pct>=50?'#b45309':'#b91c1c')
        : (pct>=80?'#2ECC71':pct>=50?'#F1C40F':'#E74C3C');
      return '<tr><td style="position:sticky;left:0;background:var(--card);font-weight:700;color:'+col+'">'+pct+'%</td>'+
        COLS.map(function(c){const v=refPartido[c.k]*pct/100;return '<td>'+(refPartido[c.k]>0?fmtN(Math.round(v),0):'—')+'</td>';}).join('')+'</tr>';
    }).join('');

    let sint='<p>Semana <strong>'+etqSemana(kl)+'</strong> con <strong>'+mds.length+'</strong> día(s) de microciclo con entrenamiento'+(mds.length?' ('+mds.join(', ')+')':'')+'. ';
    if(klPrev && hayPrev && acumPrev.dist>0){
      const dd=(acum.dist-acumPrev.dist)/acumPrev.dist*100;
      sint+='La distancia acumulada '+(dd>=0?'subió':'bajó')+' <strong>'+Math.abs(Math.round(dd))+'%</strong> respecto a la semana anterior.';
    } else { sint+='No hay semana anterior para comparar.'; }
    sint+='</p><p>El <strong>Acumulado</strong> suma los días del microciclo en las variables de volumen y conteo; en <strong>Drel (m/min)</strong>, <strong>MPHI %</strong> y <strong>Top speed</strong> muestra el <strong>promedio</strong> (no la suma) porque son relativas o porcentajes.</p>'+
      '<p>La tabla de <strong>% de competencia</strong> usa como referencia del 100% el promedio de los partidos de la temporada, contando <strong>solo a los jugadores que disputaron '+minPart+'+ minutos</strong> (los titulares); los que entraron menos no se promedian para no bajar la referencia. Sirve para fijar objetivos de carga: si querés un estímulo al 70% del partido, apuntá a esos valores.</p>';

    document.getElementById('planBody').innerHTML=
      '<div class="panel-sub" style="margin:16px 0 8px;font-family:var(--font-head);letter-spacing:0.5px;color:#ffffff !important;font-weight:800;font-size:15px">Promedio de cada día y la comparación con la semana anterior</div>'+
      '<div class="card" style="overflow-x:auto"><table class="data planilla-tbl"><thead>'+head+'</thead><tbody>'+filas+resumen+'</tbody></table></div>'+
      '<div id="cargaVarBox"></div>'+

      // Gráficos de a dos (Grid 2 columnas)
      '<div class="panel-sub" style="margin:24px 0 10px;font-family:var(--font-head);letter-spacing:1px;color:#ffffff !important;font-weight:800;font-size:15px">Evolución día por día del microciclo</div>'+
      '<div class="grid-two-charts">'+
        '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="planChartDist"></canvas></div></div>'+
        '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="planChart1618"></canvas></div></div>'+
        '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="planChartS25"></canvas></div></div>'+
        '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="planChartSprints"></canvas></div></div>'+
        '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="planChartAccDec"></canvas></div></div>'+
        '<div class="card">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
            '<span style="font-size:12px;font-weight:800;color:var(--text);font-family:var(--font-head)">Variable configurable</span>'+
            '<select class="sel" id="selPlanCustomVar" style="font-size:11px;padding:4px 8px">'+
              '<option value="drel">Drel (m/min)</option>'+
              '<option value="z1825">18 a 25 km/h (m)</option>'+
              '<option value="hi">S > 16 km/h (m)</option>'+
              '<option value="accAlta">Acc > 4 m/s</option>'+
              '<option value="decAlta">Dec > -4 m/s</option>'+
              '<option value="tension4">Acc + Dec > 4 sumadas</option>'+
              '<option value="top">Top speed (km/h)</option>'+
            '</select>'+
          '</div>'+
          '<div class="chart-wrap" style="height:215px"><canvas id="planChartCustom"></canvas></div>'+
        '</div>'+
      '</div>'+

      '<div class="card"><div class="chart-wrap"><canvas id="acwrChartPlan"></canvas></div></div>'+
      
      '<div class="panel-sub" style="margin:20px 0 8px;font-family:var(--font-head);letter-spacing:1px;color:var(--celeste)">Dosificación · % de competencia</div>'+
      '<div class="card" style="margin-bottom:12px;background:var(--card);border-left:4px solid var(--celeste);padding:12px 16px">'+
        '<div style="font-weight:800;font-size:12.5px;color:var(--celeste);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">¿A qué hace referencia esta tabla de dosificación?</div>'+
        '<div style="font-size:11.5px;color:var(--text);line-height:1.5">Esta tabla sirve para <strong>planificar y dosificar los estímulos de la semana</strong> en relación a la exigencia real de un partido oficial. La fila <strong>100%</strong> toma como referencia el promedio de los partidos contando <strong>únicamente a los jugadores que jugaron '+minPart+'+ minutos</strong> ('+CAT_ACTUAL+'). Cada fila calcula exactamente los metros y acciones físicas equivalentes a cada porcentaje (del 100% al 10%) para fijar metas diarias de entrenamiento (ej. MD-3 al 70%, MD-1 al 30%).</div>'+
      '</div>'+
      '<div class="card" style="overflow-x:auto"><table class="data planilla-tbl"><thead>'+compHead+'</thead><tbody>'+compFilas+'</tbody></table></div>'+
      sintesis(sint);

    dibujarGraficosPlanilla(mds, byMD);
    dibujarCargaVar(acum, kl, idxSem, modoPlan);
    dibujarACWR();
  }

  function dibujarGraficosPlanilla(mds, byMD){
    if(!mds || !mds.length) return;

    var chartDefs = [
      { id: 'planChartDist', title: 'Distancia total (m)', color: '#002B66', fn: function(md){ return Math.round(valMD(byMD[md], 'dist')); }, unit: ' m' },
      { id: 'planChart1618', title: '16 a 18 km/h (m)', color: '#10B981', fn: function(md){ return Math.round(valMD(byMD[md], 'z1618')); }, unit: ' m' },
      { id: 'planChartS25',  title: 'Más de 25 km/h (m)', color: '#F59E0B', fn: function(md){ return Math.round(valMD(byMD[md], 's25')); }, unit: ' m' },
      { id: 'planChartSprints', title: 'Cantidad de sprint', color: '#8B5CF6', fn: function(md){ return Math.round(valMD(byMD[md], 'sprints')); }, unit: '' },
      { id: 'planChartAccDec',  title: 'Acc + Dec (>2,5 m/s) sumadas', color: '#EC4899', fn: function(md){ return Math.round(valMD(byMD[md], 'acc') + valMD(byMD[md], 'dec')); }, unit: '' }
    ];

    chartDefs.forEach(function(def){
      var canvas = document.getElementById(def.id);
      if(!canvas) return;
      var cKey = def.id;
      if(charts[cKey]) { try { charts[cKey].destroy(); } catch(e){} }
      var vals = mds.map(function(md){ return def.fn(md); });
      var maxV = Math.max.apply(null, vals) || 10;

      charts[cKey] = new Chart(canvas.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: mds,
          datasets: [{
            label: def.title,
            data: vals,
            backgroundColor: def.color,
            borderRadius: 4,
            maxBarThickness: 34,
            datalabels: {
              color: cT(),
              font: { size: 10, weight: 'bold' },
              anchor: 'end',
              align: 'top',
              formatter: function(v){ return v > 0 ? (fmt(v) + def.unit) : ''; }
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: def.title, color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' } }
          },
          scales: {
            x: { ticks: { color: cM(), font: { size: 10 } } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: maxV * 1.15 }
          }
        }
      });
    });

    dibujarPlanCustomChart(mds, byMD);
    var selCustom = document.getElementById('selPlanCustomVar');
    if(selCustom) selCustom.onchange = function(){ dibujarPlanCustomChart(mds, byMD); };
  }

  function dibujarPlanCustomChart(mds, byMD){
    var canvas = document.getElementById('planChartCustom');
    if(!canvas || !mds || !mds.length) return;
    var sel = document.getElementById('selPlanCustomVar');
    var varKey = sel ? sel.value : 'drel';

    var varMap = {
      'drel': { title: 'Distancia relativa (m/min)', fn: function(md){ return Math.round(valMD(byMD[md], 'drel')); }, unit: ' m/min', col: '#003882' },
      'z1825': { title: '18 a 25 km/h (m)', fn: function(md){ return Math.round(valMD(byMD[md], 'z1825')); }, unit: ' m', col: '#14B8A6' },
      'hi': { title: 'S > 16 km/h (m)', fn: function(md){ return Math.round(valMD(byMD[md], 'hi')); }, unit: ' m', col: '#6366F1' },
      'accAlta': { title: 'Acc > 4 m/s', fn: function(md){ return Math.round(valMD(byMD[md], 'accAlta')); }, unit: '', col: '#D946EF' },
      'decAlta': { title: 'Dec > -4 m/s', fn: function(md){ return Math.round(valMD(byMD[md], 'decAlta')); }, unit: '', col: '#F43F5E' },
      'tension4': { title: 'Acc + Dec (>4 m/s) sumadas', fn: function(md){ return Math.round(valMD(byMD[md], 'accAlta') + valMD(byMD[md], 'decAlta')); }, unit: '', col: '#E11D48' },
      'top': { title: 'Top speed (km/h)', fn: function(md){ return Math.round(valMD(byMD[md], 'top')); }, unit: ' km/h', col: '#EAB308' }
    };

    var cfg = varMap[varKey] || varMap['drel'];
    if(charts.planCustom) { try { charts.planCustom.destroy(); } catch(e){} }
    var vals = mds.map(function(md){ return cfg.fn(md); });
    var maxV = Math.max.apply(null, vals) || 10;

    charts.planCustom = new Chart(canvas.getContext('2d'), {
      plugins: [ChartDataLabels],
      type: 'bar',
      data: {
        labels: mds,
        datasets: [{
          label: cfg.title,
          data: vals,
          backgroundColor: cfg.col,
          borderRadius: 4,
          maxBarThickness: 34,
          datalabels: {
            color: cT(),
            font: { size: 10, weight: 'bold' },
            anchor: 'end',
            align: 'top',
            formatter: function(v){ return v > 0 ? (fmt(v) + cfg.unit) : ''; }
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: cfg.title, color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' } }
        },
        scales: {
          x: { ticks: { color: cM(), font: { size: 10 } } },
          y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: maxV * 1.15 }
        }
      }
    });
  }

  // ── Tabla de carga por variable sin decimales ──
  function dibujarCargaVar(acumSem, klSel, idxSemSel, modoPlanSel){
    (function(){
    var box = document.getElementById('cargaVarBox');
    if(!box) return;
    var ses = D.sesiones || [];
    if(!ses.length){ box.innerHTML = ''; return; }

    function calcSem(klKey){
      if(!semanas[klKey]) return null;
      var sesSemAll = semanas[klKey].sesiones;
      var sesSem = sesSemAll;
      if (modoPlanSel === 'sin_partido') {
        var filtradas = sesSemAll.filter(function(s){
          var d = pd(s.fecha);
          return d.getDay() !== 6 && !isPartido(s);
        });
        sesSem = filtradas.length ? filtradas : sesSemAll;
      }
      var G = porMDde(sesSem);
      var byMD = G.byMD, mds = G.mds;
      var res = {};
      COLS.forEach(function(c){
        var vv = mds.map(function(md){ return valMD(byMD[md], c.k); });
        if(c.k === 'top'){
          res[c.k] = vv.length ? Math.max.apply(null, vv) : 0;
        } else if(NOSUMA[c.k]){
          res[c.k] = vv.length ? vv.reduce(function(a,b){return a+b;},0)/vv.length : 0;
        } else {
          res[c.k] = vv.reduce(function(a,b){return a+b;},0);
        }
      });
      return res;
    }

    var semActual = acumSem || calcSem(klSel) || {};

    // 4 semanas para Carga Crónica (la seleccionada + hasta 3 anteriores según orden cronológico inverso)
    var idxBase = (typeof idxSemSel === 'number' && idxSemSel >= 0) ? idxSemSel : clavesSemana.indexOf(klSel);
    if(idxBase < 0) idxBase = 0;
    var semanasCronKeys = clavesSemana.slice(idxBase, idxBase + 4);
    var cargasCron = semanasCronKeys.map(function(k){
      return k === klSel ? semActual : calcSem(k);
    }).filter(function(x){ return x != null; });

    var cronica = {}, maxEst = {}, minEst = {};
    COLS.forEach(function(c){
      var vals = cargasCron.map(function(s){ return s[c.k] || 0; }).filter(function(v){ return v > 0; });
      if(c.k === 'top'){
        cronica[c.k] = vals.length ? Math.max.apply(null, vals) : (semActual[c.k] || 0);
      } else {
        cronica[c.k] = vals.length ? (vals.reduce(function(a,b){return a+b;}, 0) / vals.length) : (semActual[c.k] || 0);
      }
      maxEst[c.k] = cronica[c.k] * 1.3;
      minEst[c.k] = cronica[c.k] * 0.8;
    });

    // Acumulado Temporada
    var todasSemCargas = clavesSemana.map(function(k){
      return k === klSel ? semActual : calcSem(k);
    }).filter(function(x){ return x != null; });

    var acumTemp = {};
    COLS.forEach(function(c){
      if(c.k === 'top'){
        var tops = todasSemCargas.map(function(s){ return s[c.k] || 0; });
        acumTemp[c.k] = tops.length ? Math.max.apply(null, tops) : 0;
      } else if(NOSUMA[c.k]){
        var nS = todasSemCargas.filter(function(s){ return (s[c.k] || 0) > 0; });
        acumTemp[c.k] = nS.length ? nS.reduce(function(a, s){ return a + s[c.k]; }, 0) / nS.length : 0;
      } else {
        acumTemp[c.k] = todasSemCargas.reduce(function(a, s){ return a + (s[c.k] || 0); }, 0);
      }
    });

    var isLight = TEMA === 'light';
    var stAcum = isLight ? 'background:#f8fafc;color:#1e293b;border-top:1px solid #e2e8f0' : 'background:#141b26;color:#c9d4e3';
    var stMax  = isLight ? 'background:#fef2f2;color:#991b1b;border-top:1px solid #fecaca' : 'background:#2a1416;color:#f5a3a3';
    var stCron = isLight ? 'background:#fefce8;color:#854d0e;border-top:1px solid #fef08a' : 'background:#2a2410;color:#f1d98a';
    var stMin  = isLight ? 'background:#f0fdf4;color:#166534;border-top:1px solid #bbf7d0' : 'background:#122a1a;color:#8ae6a8';
    var stSem  = isLight ? 'background:#eff6ff;color:#1e40af;border-top:1px solid #bfdbfe' : 'background:#0d2438;color:#8ab4e8';

    function fila(label, obj, estilo){
      return '<tr><td style="position:sticky;left:0;'+estilo+';font-weight:700;white-space:nowrap">'+label+'</td>'+
        COLS.map(function(c){ return '<td style="'+estilo+'">'+fmtN(obj[c.k], 0)+'</td>'; }).join('')+'</tr>';
    }

    var head = '<tr><th style="position:sticky;left:0;background:var(--card2);z-index:2;color:var(--celeste)">' + CAT_ACTUAL + '</th>' + COLS.map(function(c){ return '<th>' + c.lbl + '</th>'; }).join('') + '</tr>';
    var body = fila('Acum. Temporada', acumTemp, stAcum) +
               fila('Máx. Estimada', maxEst, stMax) +
               fila('Carga Crónica', cronica, stCron) +
               fila('Mín. Estimada', minEst, stMin) +
               fila('Semana Actual', semActual, stSem);

    var colCron = isLight ? '#854d0e' : '#f1d98a';
    var colMax  = isLight ? '#991b1b' : '#f5a3a3';
    var colMin  = isLight ? '#166534' : '#8ae6a8';
    var colSem  = isLight ? '#1e40af' : '#8ab4e8';

    box.innerHTML =
      '<div class="panel-sub" style="margin:20px 0 8px;font-family:var(--font-head);letter-spacing:1px;color:#ffffff !important;font-weight:800;font-size:15px">Carga por variable · zona óptima (crónica × 0,8 a 1,3)</div>' +
      '<div class="card" style="overflow-x:auto"><table class="data planilla-tbl"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="obs" style="margin-top:-8px;color:var(--text)">La <span style="color:'+colCron+';font-weight:700">Carga Crónica</span> es la media del acumulado de las últimas 4 semanas. La <span style="color:'+colMax+';font-weight:700">Máx.</span> y <span style="color:'+colMin+';font-weight:700">Mín. Estimada</span> son esa crónica multiplicada por 1,3 y 0,8 (los límites de la zona óptima). Si el <span style="color:'+colSem+';font-weight:700">Acumulado de la Semana Actual</span> queda entre esos dos, la carga está en zona saludable.</div>';
    })();
  }

  function dibujarACWR(){
    (function(){
    var w=(D.equipo&&D.equipo.weeks)||[];
    var canvas=document.getElementById('acwrChartPlan');
    if(!w.length||!canvas)return;
    var labels=w.map(function(x){return x.semana});
    var acwrs=w.map(function(x){return x.acwr});
    var bgColors=acwrs.map(function(v){return v<.8?'#2ECC7144':v<=1.3?'#2ECC71':v<=1.5?'#1E8449':'#0E5E2F'});
    if(charts.acwrPlan){try{charts.acwrPlan.destroy();}catch(e){}}
    charts.acwrPlan=new Chart(canvas.getContext('2d'),{type:'bar',data:{labels:labels,datasets:[
      {label:'ACWR',data:acwrs,backgroundColor:bgColors,borderRadius:4}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{
      legend:{display:false},title:{display:true,text:'ACWR del equipo (0.80-1.30 = óptimo)',color:cT(),font:{family:'Plus Jakarta Sans',size:14}}
    },scales:{x:{ticks:{color:cM(),maxRotation:45}},y:{ticks:{color:cM()},grid:{color:cG()},min:0,max:2}}}});
    })();
  }

  document.getElementById('selPlanSem').onchange=dibujar;
  var selModoEl = document.getElementById('selPlanModo');
  if (selModoEl) selModoEl.onchange=dibujar;
  EXPORT_RERENDER=dibujar;
  dibujar();
}

// ─── CARGA DEL EQUIPO ───
function renderCarga(p){
  var w=D.equipo.weeks;
  var e=D.equipo.estado;
  var ult=w[w.length-1]||{}, prev=w[w.length-2]||{};
  var tend=(ult.acwr&&prev.acwr)?(ult.acwr>prev.acwr?'subiendo':ult.acwr<prev.acwr?'bajando':'estable'):'—';
  var nRiesgo=w.filter(function(x){return x.acwr>1.5}).length;
  var nAlta=w.filter(function(x){return x.acwr>1.3&&x.acwr<=1.5}).length;
  var zonaTxt={'Baja':'por debajo de lo óptimo (poca carga, posible pérdida de forma o semana de descarga)','Óptima':'en zona óptima (carga equilibrada)','Alta':'en zona alta (ojo con la fatiga)','Riesgo':'en zona de riesgo (carga muy alta respecto a las últimas semanas)'}[e.zona]||'';
  var sintCarga='<p>El equipo cerró la última semana ('+e.ultimaSemana+') con un <strong>ACWR de '+fmt(e.acwr,2)+'</strong>, '+zonaTxt+'. La tendencia respecto a la semana anterior viene <strong>'+tend+'</strong>.</p>'+
    '<p>En las '+w.length+' semanas registradas hubo '+(nAlta+nRiesgo)+' semana(s) con carga elevada'+(nRiesgo>0?' ('+nRiesgo+' en zona de riesgo)':'')+'. '+
    (e.zona==='Baja'?'Si el objetivo no es descargar, conviene subir gradualmente el volumen para volver a la zona óptima (0.80–1.30).':e.zona==='Óptima'?'El balance entre carga aguda y crónica es saludable.':'Conviene controlar la progresión para no acumular fatiga.')+'</p>';
  p.innerHTML='<div class="panel-title">Carga del Equipo</div>'+
    '<div class="panel-sub">Muestra cómo evoluciona la carga del plantel semana a semana comparando la carga reciente (aguda) con el promedio de las últimas semanas (crónica). El ratio ACWR resume esa relación: la zona óptima está entre 0,80 y 1,30. Sirve para anticipar riesgo de fatiga o lesión: si la carga sube muy rápido respecto a lo habitual, el ACWR se dispara y conviene descargar.</div>'+
     '<div class="card"><div class="chart-wrap"><canvas id="cargaChart"></canvas></div></div>'+
    '<div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr>'+
    '<th>Semana</th><th>Jugadores</th><th>Aguda</th><th>Crónica</th><th>ACWR</th><th>Zona</th><th>Alerta</th>'+
    '</tr></thead><tbody id="cargaBody"></tbody></table></div>'+
    sintesis(sintCarga);
  
  var labels=w.map(function(x){return x.semana});
  var agudas=w.map(function(x){return x.aguda});
  var cronicas=w.map(function(x){return x.cronica});
  var acwrs=w.map(function(x){return x.acwr});
  var ctx1=document.getElementById('cargaChart').getContext('2d');
  charts.carga=new Chart(ctx1,{type:'line',data:{labels:labels,datasets:[
    {label:'Aguda',data:agudas,borderColor:'#5BA3DE',backgroundColor:'#5BA3DE33',fill:true,tension:.3},
    {label:'Crónica',data:cronicas,borderColor:'#F1C40F',borderDash:[6,3],fill:false,tension:.3}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{
    legend:{labels:{color:cM()}},title:{display:true,text:'Carga aguda vs crónica (equipo)',color:cT(),font:{family:'Plus Jakarta Sans',size:14}}
  },scales:{x:{ticks:{color:cM(),maxRotation:45}},y:{ticks:{color:cM()},grid:{color:cG()}}}}});
   var ctx2=document.createElement('canvas').getContext('2d');
  var bgColors=acwrs.map(function(v){return v<.8?'#E74C3C88':v<=1.3?'#2ECC7188':v<=1.5?'#F1C40F88':'#ff6b6b88'});
  charts.acwr=new Chart(ctx2,{type:'bar',data:{labels:labels,datasets:[
    {label:'ACWR',data:acwrs,backgroundColor:bgColors,borderRadius:4}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{
    legend:{display:false},title:{display:true,text:'ACWR del equipo (0.80-1.30 = óptimo)',color:cT(),font:{family:'Plus Jakarta Sans',size:14}}
  },scales:{x:{ticks:{color:cM(),maxRotation:45}},y:{ticks:{color:cM()},grid:{color:cG()},min:0,max:2}}}});
  var tb=document.getElementById('cargaBody');
  w.slice().reverse().forEach(function(r){
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+r.semana+'</td><td>'+r.njug+'</td><td>'+fmt(r.aguda)+'</td><td>'+fmt(r.cronica)+'</td>'+
      '<td>'+fmt(r.acwr,2)+'</td><td><span class="zona-badge '+zonaCls(r.zona)+'">'+r.zona+'</span></td><td>'+r.alerta+'</td>';
    tb.appendChild(tr);
  });
}
// ─── COMPARAR JUGADORES ───
function renderComparar(p){
  var metsP=[
    {key:'dist',label:'D (m) — Distancia',unit:' m'},
    {key:'drel',label:'Drel (m) — Distancia relativa',unit:' m/min'},
    {key:'mp20',label:'MP > 20 W/Kg',unit:''},
    {key:'mp55',label:'MP > 55 W/Kg',unit:''},
    {key:'mphi',label:'MPHI %D',unit:'%'},
    {key:'hi',label:'S > 16 Km/h (m)',unit:' m'},
    {key:'z1618',label:'16-18 Km/h (m)',unit:' m'},
    {key:'z1825',label:'18-25 Km/h (m)',unit:' m'},
    {key:'s25',label:'S > 25 Km/h (m)',unit:' m'},
    {key:'acc',label:'Acc > 2,5 m/s',unit:''},
    {key:'dec',label:'Dec > -2,5 m/s',unit:''},
    {key:'tension',label:'Acc + Dec >2,5 sumadas',unit:''},
    {key:'accAlta',label:'Acc > 4 m/s',unit:''},
    {key:'decAlta',label:'Dec > -4 m/s',unit:''},
    {key:'topSpeed',label:'Top speed (km/h)',unit:' km/h'},
    {key:'sprints',label:'Sprint',unit:''}
  ];

  var fixedMets = [
    {key:'dist',   label:'Distancia total (m)', unit:' m'},
    {key:'z1618',  label:'16 a 18 km/h (m)', unit:' m'},
    {key:'s25',    label:'Más de 25 km/h (m)', unit:' m'},
    {key:'sprints',label:'Cantidad de Sprints', unit:''},
    {key:'tension',label:'Acc + Dec (>2,5 m/s) sumadas', unit:''}
  ];

  var customMets = metsP.filter(function(m){
    return fixedMets.every(function(fm){ return fm.key !== m.key; });
  });

  var COLORES=['#5BA3DE','#2ECC71','#F1C40F','#E74C3C'];
  var MAX_JUG=4;

  p.innerHTML='<div class="panel-title">Comparar Jugadores</div>'+
    '<div class="panel-sub">Superpone en un mismo gráfico hasta 4 jugadores para comparar su rendimiento en la variable y el período que elijas (carga semanal, partidos o entrenamientos). Solo se listan los jugadores que tienen datos en el ámbito seleccionado. Mostramos los 5 gráficos clave fijos (distancia, 16-18, >25, sprints y acc+dec) más un gráfico configurable.</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;align-items:center">'+
      '<select class="sel" id="selCmpAmb">'+
        '<option value="entrenos">Entrenamientos</option>'+
        '<option value="partidos">Partidos</option>'+
        '<option value="semanal">Carga semanal</option>'+
      '</select>'+
      '<span style="color:var(--muted);font-size:13px">Desde</span><select class="sel" id="selCmpDesde"></select>'+
      '<span style="color:var(--muted);font-size:13px">Hasta</span><select class="sel" id="selCmpHasta"></select>'+
    '</div>'+
    '<div id="cmpJugs" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center"></div>'+
    '<div id="cmpChartsContainer"></div>'+
    '<div id="cmpSint"></div>';

  function pd(f){var x=String(f||'').split('/');return (x.length===3)?new Date(x[2],x[1]-1,x[0]):new Date(0);}

  // Obtener fechas disponibles según ámbito
  function fechasAmbito(amb){
    var set={};
    if(amb==='semanal'){
      Object.keys(D.jugadores||{}).forEach(function(n){
        (D.jugadores[n]||[]).forEach(function(r){ if(r.semana) set[r.semana]=1; });
      });
    } else {
      var esP = amb === 'partidos';
      (D.sesiones||[]).forEach(function(s){
        var sp = (s.tipo||'').indexOf('Partido') >= 0;
        if(esP && !sp) return;
        if(!esP && sp) return;
        if(s.fecha) set[s.fecha]=1;
      });
    }
    return Object.keys(set).sort(function(a,b){return pd(a)-pd(b);});
  }

  // Obtener SOLO los jugadores que tienen datos válidos en el ámbito y rango de fechas seleccionado
  function obtenerJugadoresValidos(amb, dDesde, dHasta){
    var set={};
    if(amb==='semanal'){
      Object.keys(D.jugadores||{}).forEach(function(nom){
        var rows = (D.jugadores[nom]||[]).filter(function(r){
          if(!r.semana) return false;
          var d=pd(r.semana);
          return (!dDesde||d>=dDesde) && (!dHasta||d<=dHasta) && (r.carga>0);
        });
        if(rows.length>0) set[nom]=true;
      });
    } else {
      var esP = amb === 'partidos';
      (D.sesiones||[]).forEach(function(s){
        var sp = (s.tipo||'').indexOf('Partido') >= 0;
        if(esP && !sp) return;
        if(!esP && sp) return;
        var d=pd(s.fecha);
        if((dDesde && d<dDesde) || (dHasta && d>dHasta)) return;
        (s.jugadores||[]).forEach(function(j){
          if(j.jugador && (j.dist||0)>0) set[j.jugador]=true;
        });
      });
    }
    var validos=[];
    (D.roster||[]).forEach(function(nom){ if(set[nom]) validos.push(nom); });
    Object.keys(set).forEach(function(nom){ if(validos.indexOf(nom)<0) validos.push(nom); });
    return validos;
  }

  var jugadoresValidos = [];
  var jugadoresElegidos = [];

  function renderSelectores(){
    var cont=document.getElementById('cmpJugs');
    if(!cont) return;
    if(!jugadoresValidos.length){
      cont.innerHTML='<div style="font-size:13px;color:#f87171;padding:8px 0">No se encontraron jugadores con datos en el ámbito y fechas seleccionados.</div>';
      return;
    }
    var html='';
    jugadoresElegidos.forEach(function(sel,idx){
      html+='<div style="display:inline-flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px 8px;border-radius:8px">'+
        '<span style="width:10px;height:10px;border-radius:50%;background:'+COLORES[idx]+';display:inline-block"></span>'+
        '<select class="sel" data-cmpjug="'+idx+'" style="margin-bottom:0;padding:4px 8px">'+
          jugadoresValidos.map(function(n){return '<option value="'+n+'"'+(n===sel?' selected':'')+'>'+n+'</option>'}).join('')+
        '</select>';
      if(idx>=2){
        html+='<button style="cursor:pointer;background:#1E3A54;color:#E8EDF2;border:1px solid var(--border);padding:4px 8px;border-radius:6px;font-size:11px" data-quitar="'+idx+'">✕</button>';
      }
      html+='</div>';
    });
    if(jugadoresElegidos.length<MAX_JUG && jugadoresValidos.length>jugadoresElegidos.length){
      html+='<button id="btnAddJug" style="cursor:pointer;background:var(--celeste);color:#06121E;border:0;padding:6px 12px;border-radius:6px;font-weight:700;font-size:12px">+ Agregar jugador</button>';
    }
    cont.innerHTML=html;

    cont.querySelectorAll('select[data-cmpjug]').forEach(function(s){
      s.onchange=function(){
        var i=parseInt(this.getAttribute('data-cmpjug'), 10);
        jugadoresElegidos[i]=this.value;
        updateCharts();
      };
    });
    cont.querySelectorAll('button[data-quitar]').forEach(function(b){
      b.onclick=function(){
        var i=parseInt(this.getAttribute('data-quitar'), 10);
        jugadoresElegidos.splice(i,1);
        renderSelectores();
        updateCharts();
      };
    });
    var addBtn=document.getElementById('btnAddJug');
    if(addBtn){
      addBtn.onclick=function(){
        var dispo = jugadoresValidos.filter(function(n){ return jugadoresElegidos.indexOf(n)<0; });
        if(dispo.length){
          jugadoresElegidos.push(dispo[0]);
          renderSelectores();
          updateCharts();
        }
      };
    }
  }

  function datosDe(nombre,amb,metKey){
    if(amb==='semanal'){
      return (D.jugadores[nombre]||[]).map(function(r){
        var val = metKey === 'carga' || metKey === 'dist' ? r.carga : (r[metKey]||0);
        return {f:r.semana, v:val};
      });
    }
    var esP = amb === 'partidos';
    var arr = [];
    (D.sesiones||[]).forEach(function(s){
      var sp = (s.tipo||'').indexOf('Partido') >= 0;
      if(esP && !sp) return;
      if(!esP && sp) return;
      (s.jugadores||[]).forEach(function(j){
        if(j.jugador === nombre && (j.dist||0)>0){
          var val = metKey === 'tension' ? ((j.acc||0) + (j.dec||0)) : (j[metKey]||0);
          arr.push({f:s.fecha, v:val});
        }
      });
    });
    return arr;
  }

  function poblarFechas(){
    var amb = document.getElementById('selCmpAmb').value;
    var fechas = fechasAmbito(amb);
    var od = fechas.slice().reverse().map(function(f){ return '<option value="'+f+'">'+f+'</option>'; }).join('');
    var dd = document.getElementById('selCmpDesde'), hh = document.getElementById('selCmpHasta');
    dd.innerHTML = od;
    hh.innerHTML = od;
    if(fechas.length){
      dd.value = fechas[0];
      hh.value = fechas[fechas.length-1];
    }
  }

  function sincronizarJugadores(){
    var amb = document.getElementById('selCmpAmb').value;
    var desde = document.getElementById('selCmpDesde').value;
    var hasta = document.getElementById('selCmpHasta').value;
    var dDesde = desde ? pd(desde) : null;
    var dHasta = hasta ? pd(hasta) : null;

    jugadoresValidos = obtenerJugadoresValidos(amb, dDesde, dHasta);

    // Ajustar jugadores elegidos para que todos existan en los válidos
    var nuevosElegidos = jugadoresElegidos.filter(function(n){ return jugadoresValidos.indexOf(n) >= 0; });
    if(nuevosElegidos.length < 2){
      jugadoresValidos.forEach(function(n){
        if(nuevosElegidos.length < 2 && nuevosElegidos.indexOf(n) < 0) nuevosElegidos.push(n);
      });
    }
    jugadoresElegidos = nuevosElegidos;
    renderSelectores();
  }

  function updateCharts(){
    var amb = document.getElementById('selCmpAmb').value;
    var desde = document.getElementById('selCmpDesde').value;
    var hasta = document.getElementById('selCmpHasta').value;
    var dDesde = desde ? pd(desde) : null;
    var dHasta = hasta ? pd(hasta) : null;
    var customKey = window._cmpCustomMetKey || 'drel';

    var customMetObj = metsP.filter(function(m){ return m.key === customKey; })[0] || customMets[0] || metsP[1];

    if(!jugadoresElegidos.length){
      document.getElementById('cmpChartsContainer').innerHTML = '<div class="obs">Seleccioná al menos un jugador con datos disponibles.</div>';
      document.getElementById('cmpSint').innerHTML = '';
      return;
    }

    function enRango(f){
      var d = pd(f);
      return (!dDesde || d >= dDesde) && (!dHasta || d <= dHasta);
    }

    // Fechas comunes a considerar
    var allF = {};
    jugadoresElegidos.forEach(function(n){
      datosDe(n, amb, 'dist').filter(function(x){ return enRango(x.f); }).forEach(function(x){ allF[x.f] = 1; });
    });
    var fechas = Object.keys(allF).sort(function(a,b){ return pd(a) - pd(b); });

    var customOptsHtml = customMets.map(function(m){
      return '<option value="' + m.key + '"' + (m.key === customMetObj.key ? ' selected' : '') + '>' + m.label + '</option>';
    }).join('');

    var gridHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(420px, 1fr));gap:16px;margin-bottom:16px">' +
      '<div class="card"><div class="chart-wrap" style="height:270px"><canvas id="cmpChart_dist"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:270px"><canvas id="cmpChart_z1618"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:270px"><canvas id="cmpChart_s25"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:270px"><canvas id="cmpChart_sprints"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:270px"><canvas id="cmpChart_tension"></canvas></div></div>' +
      '<div class="card">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">' +
          '<span style="font-size:12px;font-weight:700;color:var(--celeste)">Variable configurable:</span>' +
          '<select class="sel" id="selCmpCustomMet" style="margin-bottom:0;padding:4px 8px;font-size:12px">' + customOptsHtml + '</select>' +
        '</div>' +
        '<div class="chart-wrap" style="height:235px"><canvas id="cmpChart_custom"></canvas></div>' +
      '</div>' +
    '</div>';

    document.getElementById('cmpChartsContainer').innerHTML = gridHtml;

    var customSelEl = document.getElementById('selCmpCustomMet');
    if (customSelEl) {
      customSelEl.onchange = function(){
        window._cmpCustomMetKey = this.value;
        updateCharts();
      };
    }

    // Helper para dibujar cada gráfico de comparación de líneas
    function dibujarLineCmp(canvasId, mObj, chartKey){
      var canvas = document.getElementById(canvasId);
      if(!canvas) return;
      var datosPorJug = jugadoresElegidos.map(function(n){
        return datosDe(n, amb, mObj.key).filter(function(x){ return enRango(x.f); });
      });
      var datasets = jugadoresElegidos.map(function(n, i){
        var mp = {};
        datosPorJug[i].forEach(function(x){ mp[x.f] = x.v; });
        var vals = fechas.map(function(f){ return mp[f] != null ? mp[f] : null; });
        return {
          label: n,
          data: vals,
          borderColor: COLORES[i],
          backgroundColor: COLORES[i] + '33',
          borderWidth: 2,
          pointRadius: 3,
          fill: false,
          tension: 0.3,
          spanGaps: true
        };
      });

      if (charts[chartKey]) {
        try { charts[chartKey].destroy(); } catch(e){}
      }
      charts[chartKey] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels: fechas, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: cM(), font: { size: 11 } } },
            title: { display: true, text: mObj.label, color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' } }
          },
          scales: {
            x: { ticks: { color: cM(), maxRotation: 45, font: { size: 10 } } },
            y: { ticks: { color: cM() }, grid: { color: cG() } }
          }
        }
      });
    }

    fixedMets.forEach(function(fm){
      dibujarLineCmp('cmpChart_' + fm.key, fm, 'cmp_' + fm.key);
    });
    dibujarLineCmp('cmpChart_custom', customMetObj, 'cmp_custom');

    // Síntesis comparativa en Distancia total
    var datosDist = jugadoresElegidos.map(function(n){
      return datosDe(n, amb, 'dist').filter(function(x){ return enRango(x.f); });
    });
    var proms = jugadoresElegidos.map(function(n,i){
      var vals = datosDist[i].map(function(x){ return x.v; });
      return { n: n, p: prom(vals), m: vals.length ? Math.max.apply(null, vals) : 0 };
    });
    var ord = proms.slice().sort(function(a,b){ return b.p - a.p; });
    var lineas = proms.map(function(x){
      return '<strong>' + x.n + '</strong> promedió <strong>' + fmt(x.p) + ' m</strong> (máx ' + fmt(x.m) + ' m)';
    }).join('; ');
    var ambLabel = amb === 'semanal' ? 'carga semanal' : amb === 'partidos' ? 'partidos' : 'entrenamientos';
    var difPct = ord.length > 1 && ord[ord.length - 1].p > 0 ? Math.round((ord[0].p - ord[ord.length - 1].p) / ord[ord.length - 1].p * 100) : 0;
    var txt = '<p>En <strong>' + ambLabel + '</strong> (distancia): ' + lineas + '.</p>';
    if (ord.length > 1) {
      txt += '<p>El promedio más alto en distancia es de <strong>' + ord[0].n + '</strong>' + (difPct > 0 ? ' — está un <strong>' + difPct + '%</strong> por encima de ' + ord[ord.length - 1].n : '') + '.</p>';
    }
    document.getElementById('cmpSint').innerHTML = sintesis(txt);
  }

  document.getElementById('selCmpAmb').onchange = function(){
    poblarFechas();
    sincronizarJugadores();
    updateCharts();
  };
  document.getElementById('selCmpDesde').onchange = function(){
    sincronizarJugadores();
    updateCharts();
  };
  document.getElementById('selCmpHasta').onchange = function(){
    sincronizarJugadores();
    updateCharts();
  };

  poblarFechas();
  sincronizarJugadores();
  updateCharts();
}
// ─── RANKING DEL PLANTEL ───
function renderRanking(p){
  var aggs = [];
  var playerNamesSet = new Set();
  (D.roster || []).forEach(function(n){ if(n && !isComodin(n)) playerNamesSet.add(n); });
  Object.keys(D.jugadores || {}).forEach(function(n){ if(n && !isComodin(n)) playerNamesSet.add(n); });
  (D.sesiones || []).forEach(function(s){
    (s.jugadores || []).forEach(function(j){
      if(j && j.jugador && !isComodin(j.jugador)) playerNamesSet.add(j.jugador);
    });
  });

  var playerNames = Array.from(playerNamesSet).sort();

  playerNames.forEach(function(n){
    var wk = (D.jugadores && D.jugadores[n]) || [];
    var ss = [];
    (D.sesiones || []).forEach(function(s){
      (s.jugadores || []).forEach(function(j){
        if(j.jugador === n) ss.push(j);
      });
    });
    if(!wk.length && !ss.length) return;

    aggs.push({
      jugador: n,
      dist: ss.length ? prom(ss.map(function(j){ return j.dist || 0; })) : 0,
      drel: ss.length ? prom(ss.map(function(j){ return j.drel || 0; })) : 0,
      carga: wk.length ? prom(wk.map(function(r){ return r.carga || 0; })) : 0,
      topSpeed: ss.length ? Math.max.apply(null, ss.map(function(j){ return j.topSpeed || 0; })) : 0,
      sprints: ss.length ? prom(ss.map(function(j){ return j.sprints || 0; })) : 0,
      acc: ss.length ? prom(ss.map(function(j){ return j.acc || 0; })) : 0,
      dec: ss.length ? prom(ss.map(function(j){ return j.dec || 0; })) : 0,
      accAlta: ss.length ? prom(ss.map(function(j){ return j.accAlta || 0; })) : 0,
      decAlta: ss.length ? prom(ss.map(function(j){ return j.decAlta || 0; })) : 0,
      hi: ss.length ? prom(ss.map(function(j){ return j.hi || 0; })) : 0,
      z1618: ss.length ? prom(ss.map(function(j){ return j.z1618 || 0; })) : 0,
      z1825: ss.length ? prom(ss.map(function(j){ return j.z1825 || 0; })) : 0,
      s25: ss.length ? prom(ss.map(function(j){ return j.s25 || 0; })) : 0,
      mp20: ss.length ? prom(ss.map(function(j){ return j.mp20 || 0; })) : 0,
      mp55: ss.length ? prom(ss.map(function(j){ return j.mp55 || 0; })) : 0,
      mphi: ss.length ? prom(ss.map(function(j){ return j.mphi || 0; })) : 0
    });
  });

  var mets = [
    {key:'dist', label:'D (m) — Distancia promedio', unit:' m', dec:0, color:'#002B66'},
    {key:'drel', label:'Drel (m/min) — Distancia relativa', unit:' m/min', dec:1, color:'#002B66'},
    {key:'carga', label:'Carga semanal (promedio)', unit:'', dec:0, color:'#002B66'},
    {key:'topSpeed', label:'Top speed (km/h) — récord', unit:' km/h', dec:1, color:'#002B66'},
    {key:'sprints', label:'Sprint (promedio)', unit:'', dec:1, color:'#2ECC71'},
    {key:'acc', label:'Acc > 2,5 m/s', unit:'', dec:0, color:'#002B66'},
    {key:'dec', label:'Dec > -2,5 m/s', unit:'', dec:0, color:'#E74C3C'},
    {key:'accAlta', label:'Acc > 4 m/s', unit:'', dec:1, color:'#002B66'},
    {key:'decAlta', label:'Dec > -4 m/s', unit:'', dec:1, color:'#E74C3C'},
    {key:'hi', label:'S > 16 Km/h (m)', unit:' m', dec:0, color:'#F1C40F'},
    {key:'z1618', label:'16-18 Km/h (m)', unit:' m', dec:0, color:'#F1C40F'},
    {key:'z1825', label:'18-25 Km/h (m)', unit:' m', dec:0, color:'#F1C40F'},
    {key:'s25', label:'S > 25 Km/h (m)', unit:' m', dec:0, color:'#2ECC71'},
    {key:'mp20', label:'MP > 20 W/Kg', unit:'', dec:1, color:'#9B59B6'},
    {key:'mp55', label:'MP > 55 W/Kg', unit:'', dec:1, color:'#9B59B6'},
    {key:'mphi', label:'MPHI %D', unit:'%', dec:1, color:'#9B59B6'}
  ];

  p.innerHTML = '<div class="panel-title">Ranking del Plantel</div>' +
    '<div class="panel-sub">Ordena a todo el plantel de mayor a menor según la variable física que elijas. Arriba se visualiza la comparativa gráfica y abajo la tabla de posiciones completa con el porcentaje relativo al promedio del equipo.</div>' +
    '<div style="margin-bottom:14px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">' +
      '<select class="sel" id="selRankMet">' +
        mets.map(function(m){ return '<option value="' + m.key + '">' + m.label + '</option>'; }).join('') +
      '</select>' +
      '<select class="sel" id="selRankTop">' +
        '<option value="20" selected>Mostrar en gráfico: Top 20 (Recomendado)</option>' +
        '<option value="15">Mostrar en gráfico: Top 15</option>' +
        '<option value="30">Mostrar en gráfico: Top 30</option>' +
        '<option value="todos">Mostrar en gráfico: Todo el plantel</option>' +
      '</select>' +
    '</div>' +
    '<div id="rankBody"></div>';

  function dibujar(forPrint){
    var sel = p.querySelector('#selRankMet') || document.getElementById('selRankMet');
    var key = sel ? sel.value : mets[0].key;
    var mt = mets.filter(function(m){ return m.key === key; })[0] || mets[0];

    var selTop = p.querySelector('#selRankTop') || document.getElementById('selRankTop');
    var topVal = selTop ? selTop.value : '20';

    var isPrinting = forPrint || (typeof document !== 'undefined' && document.body && document.body.classList.contains('is-printing'));
    var isLight = isPrinting || (TEMA === 'light');

    var lista = aggs.filter(function(a){ return a[key] > 0; }).sort(function(a, b){ return b[key] - a[key]; });
    var bodyEl = p.querySelector('#rankBody') || document.getElementById('rankBody');
    if(!bodyEl) return;

    if(!lista.length){
      bodyEl.innerHTML = '<div class="obs">Sin datos registrados para ' + mt.label + ' en esta categoría.</div>';
      if(charts.rank) { try { charts.rank.destroy(); } catch(e){} }
      return;
    }

    var avg = prom(lista.map(function(a){ return a[key]; }));
    var nMax = lista[0], nMin = lista[lista.length - 1];
    var nArriba = lista.filter(function(a){ return a[key] >= avg; }).length;

    // Determinar cuántos jugadores mostrar en el gráfico visual
    var limit = 20;
    if (topVal === '15') limit = 15;
    else if (topVal === '30') limit = 30;
    else if (topVal === 'todos') limit = lista.length;

    // En modo impresión (PDF), se limita a un máximo de 20 jugadores para asegurar que
    // cada barra tenga altura suficiente y los números NUNCA se superpongan en la hoja.
    if (isPrinting) {
      limit = Math.min(limit, 20);
    }

    var chartLista = lista.slice(0, limit);

    var kpisHtml = '<div class="kpis rank-kpis" style="margin-bottom:16px">' +
      '<div class="kpi"><div class="v">' + fmt(avg, mt.dec) + '<small>' + mt.unit + '</small></div><div class="l">Promedio Plantel</div></div>' +
      '<div class="kpi"><div class="v" style="color:' + (isLight ? '#16a34a' : 'var(--green)') + '">' + fmt(nMax[key], mt.dec) + '<small>' + mt.unit + '</small></div><div class="l">Líder · ' + nMax.jugador + '</div></div>' +
      '<div class="kpi"><div class="v">' + nArriba + '<small> / ' + lista.length + '</small></div><div class="l">Sobre la media</div></div>' +
      '</div>';

    var sint = '<p>En <strong>' + mt.label.toLowerCase() + '</strong>, el registro más alto es de <strong>' + nMax.jugador + '</strong> (' + fmt(nMax[key], mt.dec) + mt.unit + ') y el más bajo <strong>' + nMin.jugador + '</strong> (' + fmt(nMin[key], mt.dec) + mt.unit + '). El promedio del plantel es <strong>' + fmt(avg, mt.dec) + mt.unit + '</strong>.</p>' +
      '<p><strong>' + nArriba + ' de ' + lista.length + ' jugadores</strong> están por encima del promedio del equipo.</p>';

    // Filas para la tabla de ranking (100% nítidas en pantalla y papel)
    var tableRows = lista.map(function(j, idx){
      var pos = idx + 1;
      var posBadge = String(pos);
      var difPct = avg > 0 ? Math.round(((j[key] - avg) / avg) * 100) : 0;
      var difSign = difPct > 0 ? '+' : '';
      var difCol = difPct >= 0 ? (isLight ? '#15803d' : '#2ECC71') : (isLight ? '#b91c1c' : '#E74C3C');
      var estadoTxt = difPct >= 0 ? 'Sobre el promedio' : 'Bajo el promedio';
      var estadoBg = difPct >= 0 ? (isLight ? '#ecfdf5' : '#0d2a1e') : (isLight ? '#fef2f2' : '#2a1416');
      var rowBorder = isLight ? 'border-bottom: 1px solid #e2e8f0;' : 'border-bottom: 1px solid var(--border);';
      var textColor = isLight ? '#06121E' : 'var(--text)';

      return '<tr style="' + rowBorder + '">' +
        '<td style="text-align:center;font-weight:700;color:' + (isLight ? '#475569' : 'var(--text-muted)') + '">' + posBadge + '</td>' +
        '<td style="font-weight:600;color:' + textColor + '">' + j.jugador + '</td>' +
        '<td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:' + textColor + '">' + fmt(j[key], mt.dec) + mt.unit + '</td>' +
        '<td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:' + difCol + '">' + difSign + difPct + '%</td>' +
        '<td style="text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;background:' + estadoBg + ';color:' + difCol + '">' + estadoTxt + '</span></td>' +
      '</tr>';
    }).join('');

    var tableHtml = '<div class="rank-table-title" style="margin:24px 0 10px;font-family:var(--font-head);letter-spacing:0.5px;color:#ffffff !important;font-size:15px;font-weight:800">' +
      'Tabla de Posiciones Completa · ' + mt.label + ' (' + lista.length + ' jugadores)' +
      '</div>' +
      '<div class="card rank-table-card" style="overflow-x:auto">' +
        '<table class="data rank-table">' +
          '<thead>' +
            '<tr>' +
              '<th style="width:50px;text-align:center">#</th>' +
              '<th>Jugador</th>' +
              '<th style="text-align:right">' + mt.label + '</th>' +
              '<th style="text-align:right">% vs Promedio</th>' +
              '<th style="text-align:center">Estado</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + tableRows + '</tbody>' +
        '</table>' +
      '</div>';

    var chartHeight = isPrinting ? 470 : Math.max(340, chartLista.length * 28);
    var chartNota = '';
    if (chartLista.length < lista.length) {
      chartNota = '<div class="rank-chart-note" style="font-size:11px;color:' + (isLight ? '#64748b' : 'var(--text-muted)') + ';margin-top:6px;text-align:right;font-style:italic">' +
        '* Mostrando los ' + chartLista.length + ' mejores registros en el gráfico' + (isPrinting ? ' para legibilidad ejecutiva en PDF' : '') + '. Los ' + lista.length + ' jugadores están en la tabla a continuación.' +
        '</div>';
    }

    bodyEl.innerHTML = kpisHtml +
      '<div class="card rank-chart-card">' +
        '<div class="chart-wrap rank-chart-wrap" style="height:' + chartHeight + 'px"><canvas id="rankChart"></canvas></div>' +
        chartNota +
      '</div>' +
      '<div class="sintesis rank-sintesis">' + sint + '</div>' +
      tableHtml;

    if(charts.rank) {
      try { charts.rank.destroy(); } catch(e){}
    }

    var chartCanvas = p.querySelector('#rankChart') || document.getElementById('rankChart');
    if(!chartCanvas) return;

    var fontColor = isLight ? '#06121E' : '#f8fafc';
    var tickColor = isLight ? '#334155' : '#94a3b8';
    var barColorAbove = '#002B66';
    var barColorBelow = isLight ? '#93c5fd' : '#002B6666';
    var colors = chartLista.map(function(a){ return a[key] >= avg ? barColorAbove : barColorBelow; });

    var maxi = chartLista[0][key];
    var chartTitleText = mt.label + (chartLista.length < lista.length ? ' · Top ' + chartLista.length + ' de ' + lista.length + ' jugadores' : ' (mayor a menor)');

    charts.rank = new Chart(chartCanvas.getContext('2d'), {
      plugins: [ChartDataLabels],
      type: 'bar',
      data: {
        labels: chartLista.map(function(a){ return a.jugador; }),
        datasets: [{
          data: chartLista.map(function(a){ return a[key]; }),
          backgroundColor: colors,
          borderRadius: 3
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: 85, left: 10, top: 10, bottom: 8 }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: chartTitleText,
            color: fontColor,
            font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' }
          },
          datalabels: {
            color: fontColor,
            font: { family: "'JetBrains Mono', 'Segoe UI', monospace", size: isPrinting ? 10.5 : 11, weight: 'bold' },
            anchor: 'end',
            align: 'end',
            offset: 6,
            clip: false,
            formatter: function(v){ return fmt(v, mt.dec) + mt.unit; }
          }
        },
        scales: {
          x: {
            suggestedMax: maxi * 1.18,
            ticks: {
              color: tickColor,
              font: { family: "'JetBrains Mono', monospace", size: 10 }
            },
            grid: {
              color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
            }
          },
          y: {
            ticks: {
              color: fontColor,
              font: { family: 'Plus Jakarta Sans', size: isPrinting ? 10 : 11, weight: '600' },
              autoSkip: false
            },
            grid: { display: false }
          }
        }
      }
    });

    if (typeof window !== 'undefined') {
      if (!window.charts) window.charts = {};
      window.charts.rank = charts.rank;
    }
  }

  EXPORT_RERENDER = dibujar;
  if (typeof window !== 'undefined') {
    window.EXPORT_RERENDER = dibujar;
  }
  var selMet = p.querySelector('#selRankMet') || document.getElementById('selRankMet');
  if(selMet) selMet.onchange = function(){ dibujar(false); };
  var selTop = p.querySelector('#selRankTop') || document.getElementById('selRankTop');
  if(selTop) selTop.onchange = function(){ dibujar(false); };
  dibujar(false);
}
// ─── INFORME DE JUGADOR ───
function renderInforme(p){
  var nombres = (D.roster || []).filter(function(n){
    if (isComodin(n)) return false;
    if (D.jugadores && D.jugadores[n] && D.jugadores[n].length > 0) return true;
    if (Array.isArray(D.sesiones)) {
      return D.sesiones.some(function(s){
        return (s.jugadores || []).some(function(j){
          return j && (j.jugador === n || areSamePlayer(j.jugador, n));
        });
      });
    }
    return false;
  });

  // Ordenar para que el primer jugador seleccionado tenga entrenamientos cargados
  nombres.sort(function(a, b){
    var cntA = 0, cntB = 0;
    (D.sesiones || []).forEach(function(s){
      var esP = (s.tipo||'').indexOf('Partido') >= 0 || /^MD$/i.test(String(s.per||s.dia||'').trim());
      if (!esP) {
        (s.jugadores || []).forEach(function(j){
          if (j.jugador === a || areSamePlayer(j.jugador, a)) cntA++;
          if (j.jugador === b || areSamePlayer(j.jugador, b)) cntB++;
        });
      }
    });
    if (cntB !== cntA) return cntB - cntA;
    return a.localeCompare(b);
  });
  p.innerHTML='<div class="panel-title">Informe de Jugador</div>'+
    '<div class="panel-sub">Reúne todo el rendimiento de un jugador: carga total acumulada, promedios, velocidad máxima real, comparativa contra el plantel y evolución semanal. Podés filtrar por entrenamientos, partidos o todo. Los datos sin registros se omiten automáticamente para garantizar información 100% confiable.</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">'+
      '<select class="sel" id="selInf">'+nombres.map(function(n){return '<option value="'+n+'">'+n+'</option>'}).join('')+'</select>'+
      '<select class="sel" id="selInfModo">'+
        '<option value="entrenos" selected>Solo Entrenamientos</option>'+
        '<option value="todo">Todo (Entrenamientos + Partidos)</option>'+
        '<option value="partidos">Solo Partidos</option>'+
      '</select>'+
    '</div>'+
    '<div id="infDetail"></div>';

  function refreshDetail(){
    var nom = document.getElementById('selInf') ? document.getElementById('selInf').value : (nombres[0] || '');
    var modo = document.getElementById('selInfModo') ? document.getElementById('selInfModo').value : 'entrenos';
    if(nom) renderInformeDetail(nom, modo);
  }

  document.getElementById('selInf').onchange = refreshDetail;
  document.getElementById('selInfModo').onchange = refreshDetail;

  if(nombres.length>0) refreshDetail();

  if(!window._fotosMap && typeof google!=='undefined' && google.script && google.script.run){
    google.script.run.withSuccessHandler(function(json){
      try{window._fotosMap=JSON.parse(json);}catch(e){window._fotosMap={};}
      refreshDetail();
    }).withFailureHandler(function(){window._fotosMap={};}).getFotosDeCategoria(CAT_ACTUAL);
  }
}

function renderInformeDetail(nombre, modo){
  modo = modo || (document.getElementById('selInfModo') ? document.getElementById('selInfModo').value : 'entrenos');
  EXPORT_RERENDER = function(){ renderInformeDetail(nombre, modo); };
  var c = document.getElementById('infDetail');
  if(!c) return;

  function pd(f){ const x=String(f||'').split('/'); return (x.length===3)?new Date(x[2],x[1]-1,x[0]):new Date(0); }
  function lunesDe(f){ const d=pd(f); const off=(d.getDay()+6)%7; d.setDate(d.getDate()-off); return d; }
  function keyLunes(f){ const l=lunesDe(f); return ('0'+l.getDate()).slice(-2)+'/'+('0'+(l.getMonth()+1)).slice(-2)+'/'+l.getFullYear(); }
  function getMinNum(j){
    if(!j) return 0;
    var val = j.min != null ? j.min : (j.minutos || j.duracion || 0);
    if(typeof val === 'number') return isNaN(val) ? 0 : val;
    var s = String(val).replace(',', '.').trim();
    var num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }

  var sesJugAll = [];
  (D.sesiones || []).forEach(function(s){
    var esP = (s.tipo || '').indexOf('Partido') >= 0 || /^MD$/i.test(String(s.per||s.dia||'').trim());
    (s.jugadores || []).forEach(function(j){
      if(j.jugador === nombre && (j.dist || 0) > 0){
        sesJugAll.push({
          fecha: s.fecha,
          rival: s.rival || j.rival || '',
          per: s.per || s.dia || '',
          semana: s.semana || keyLunes(s.fecha),
          dist: j.dist || 0,
          hi: j.hi || 0,
          z1618: j.z1618 || 0,
          z1825: j.z1825 || 0,
          s25: j.s25 || 0,
          ts: j.topSpeed || 0,
          acc: j.acc || 0,
          dec: j.dec || 0,
          accAlta: j.accAlta || 0,
          decAlta: j.decAlta || 0,
          sprints: j.sprints || 0,
          drel: j.drel || 0,
          min: getMinNum(j),
          esP: esP
        });
      }
    });
  });

  var sesJug = sesJugAll;
  if(modo === 'entrenos') sesJug = sesJugAll.filter(function(x){ return !x.esP; });
  else if(modo === 'partidos') sesJug = sesJugAll.filter(function(x){ return x.esP; });

  if(sesJug.length === 0){
    var modoTxt = modo === 'partidos' ? 'partidos' : modo === 'entrenos' ? 'entrenamientos' : 'el período';
    c.innerHTML = '<div class="obs">No hay datos registrados de ' + modoTxt + ' para ' + nombre + '.</div>';
    return;
  }

  sesJug.sort(function(a,b){ return pd(a.fecha) - pd(b.fecha); });

  var posicionJugador = '—';
  try {
    posicionJugador = obtenerPosicionesJugador(nombre, D.sesiones || []);
  } catch(e){}

  var vMaxEntreno = 0;
  var vMaxPartido = 0;
  (sesJugAll || []).forEach(function(x){
    if(x.esP) {
      if(x.ts > vMaxPartido) vMaxPartido = x.ts;
    } else {
      if(x.ts > vMaxEntreno) vMaxEntreno = x.ts;
    }
  });

  var fotoInfo = null;
  try {
    if (typeof resolvePlayerPhoto === 'function') {
      fotoInfo = resolvePlayerPhoto(nombre, CAT_ACTUAL);
    } else if (typeof window !== 'undefined' && typeof window.resolvePlayerPhoto === 'function') {
      fotoInfo = window.resolvePlayerPhoto(nombre, CAT_ACTUAL);
    }
  } catch(e) {}

  var fotoHTML = '';
  if (fotoInfo && fotoInfo.url) {
    fotoHTML = '<div class="foto-jugador" title="' + nombre + '">' +
      '<img src="' + fotoInfo.url + '" alt="' + nombre + '" loading="lazy" onerror="this.onerror=null;this.parentElement.classList.add(\'foto-error\');">' +
    '</div>';
  } else {
    var inits = (nombre || '').split(' ').filter(Boolean).map(function(w){ return w[0] || ''; }).join('').slice(0, 2).toUpperCase();
    fotoHTML = '<div class="foto-jugador foto-placeholder" title="' + nombre + '">' +
      '<span class="foto-initials">' + (inits || 'RC') + '</span>' +
    '</div>';
  }

  var modoSub = modo === 'partidos' ? 'Partidos' : modo === 'entrenos' ? 'Entrenamientos' : 'General (Entrenamientos + Partidos)';

  var chartKeysToClean = ['infComp', 'infCarga', 'infVel', 'infSemCarga', 'infSemSprints', 'infSemAccDec', 'infSemCustom', 'infPosDist', 'infPos1618', 'infPosS25', 'infPosSpr', 'infPosAccDec', 'infPosCustom', 'infPartMatchChart'];
  chartKeysToClean.forEach(function(k){
    if(charts[k]) { try { charts[k].destroy(); } catch(e){} }
  });

  // ==============================================================
  // MODO 1: SOLO ENTRENAMIENTOS (PDF Página 2) - DE A DOS GRÁFICOS
  // ==============================================================
  if(modo === 'entrenos') {
    var semanasJugMap = {};
    sesJug.forEach(function(s){
      var lKey = keyLunes(s.fecha);
      if(!semanasJugMap[lKey]){
        semanasJugMap[lKey] = {
          lunes: lunesDe(s.fecha),
          label: ('0'+lunesDe(s.fecha).getDate()).slice(-2)+'/'+('0'+(lunesDe(s.fecha).getMonth()+1)).slice(-2),
          carga: 0,
          sprints: 0,
          accDec: 0
        };
      }
      semanasJugMap[lKey].carga += (s.dist || 0);
      semanasJugMap[lKey].sprints += (s.sprints || 0);
      semanasJugMap[lKey].accDec += ((s.acc || 0) + (s.dec || 0));
      if((s.drel || 0) > 0){
        semanasJugMap[lKey].drelSum = (semanasJugMap[lKey].drelSum || 0) + s.drel;
        semanasJugMap[lKey].drelCount = (semanasJugMap[lKey].drelCount || 0) + 1;
      }
      semanasJugMap[lKey].s25 = (semanasJugMap[lKey].s25 || 0) + (s.s25 || 0);
      semanasJugMap[lKey].z1825 = (semanasJugMap[lKey].z1825 || 0) + (s.z1825 || 0);
      semanasJugMap[lKey].z1618 = (semanasJugMap[lKey].z1618 || 0) + (s.z1618 || 0);
      semanasJugMap[lKey].accAlta = (semanasJugMap[lKey].accAlta || 0) + (s.accAlta || 0);
      semanasJugMap[lKey].decAlta = (semanasJugMap[lKey].decAlta || 0) + (s.decAlta || 0);
      semanasJugMap[lKey].minutos = (semanasJugMap[lKey].minutos || 0) + (s.min || 0);
      if((s.ts || 0) > (semanasJugMap[lKey].tsMax || 0)){
        semanasJugMap[lKey].tsMax = s.ts;
      }
    });

    var semKeys = Object.keys(semanasJugMap).sort(function(a,b){
      return semanasJugMap[a].lunes - semanasJugMap[b].lunes;
    });
    var semLabels = semKeys.map(function(k){ return semanasJugMap[k].label; });
    var semCargas = semKeys.map(function(k){ return Math.round(semanasJugMap[k].carga); });
    var semSprints = semKeys.map(function(k){ return Math.round(semanasJugMap[k].sprints); });
    var semAccDec = semKeys.map(function(k){ return Math.round(semanasJugMap[k].accDec); });

    var headerMetrics = '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;margin:16px 0;">'+
      '<div class="card" style="padding:14px 18px;border-left:4px solid var(--celeste);">'+
        '<div class="metric-header-title" style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px">POSICIÓN</div>'+
        '<div style="font-size:17px;font-weight:800;color:var(--celeste);margin-top:4px">' + posicionJugador + '</div>'+
      '</div>'+
      '<div class="card" style="padding:14px 18px;border-left:4px solid var(--celeste);">'+
        '<div class="metric-header-title" style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px">VELOCIDAD MÁXIMA EN ENTRENAMIENTO</div>'+
        '<div style="font-size:17px;font-weight:800;color:var(--celeste);margin-top:4px">' + (vMaxEntreno > 0 ? (Math.round(vMaxEntreno) + ' km/h') : '—') + '</div>'+
      '</div>'+
      '<div class="card" style="padding:14px 18px;border-left:4px solid var(--celeste);">'+
        '<div class="metric-header-title" style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px">V MAX EN PARTIDO</div>'+
        '<div style="font-size:17px;font-weight:800;color:var(--celeste);margin-top:4px">' + (vMaxPartido > 0 ? (Math.round(vMaxPartido) + ' km/h') : '—') + '</div>'+
      '</div>'+
    '</div>';

    function clasificarPuesto(posStr){
      if(!posStr) return 'Otros';
      var s = String(posStr).toLowerCase();
      if(s.includes('central') && (s.includes('def') || s.includes('dc'))) return 'Defensor Central';
      if(s.includes('lateral') || s.includes('ld') || s.includes('li') || s.includes('dl')) return 'Defensor Lateral';
      if(s.includes('volante central') || s === 'vc') return 'Volante Central';
      if(s.includes('mixto') || s.includes('interno') || s.includes('vm') || s.includes('vi')) return 'Volante Mixto';
      if(s.includes('extremo') || s === 'e') return 'Extremo';
      if(s.includes('delantero') || s.includes('centrodelantero') || s === 'cd' || s === 'del') return 'Delantero';
      if(s.includes('arquero') || s === 'a' || s === 'arq') return 'Arquero';
      return 'Otros';
    }

    var puestosOrden = ['Defensor Central', 'Defensor Lateral', 'Volante Central', 'Volante Mixto', 'Extremo', 'Delantero'];
    var posStats = {};
    puestosOrden.forEach(function(po){
      posStats[po] = { dist: [], z1618: [], s25: [], sprints: [], tension: [], drel: [], z1825: [], hi: [], accAlta: [], decAlta: [], top: [] };
    });

    (D.sesiones || []).forEach(function(s){
      var esP = (s.tipo || '').indexOf('Partido') >= 0 || /^MD$/i.test(String(s.per||s.dia||'').trim());
      if(esP) return;
      (s.jugadores || []).forEach(function(j){
        if((j.dist || 0) <= 0) return;
        var pReal = obtenerPosicionesJugador(j.jugador, D.sesiones || []);
        var catPuesto = clasificarPuesto(pReal || j.pos);
        if(posStats[catPuesto]){
          posStats[catPuesto].dist.push(j.dist || 0);
          posStats[catPuesto].z1618.push(j.z1618 || 0);
          posStats[catPuesto].s25.push(j.s25 || 0);
          posStats[catPuesto].sprints.push(j.sprints || 0);
          posStats[catPuesto].tension.push((j.acc || 0) + (j.dec || 0));
          posStats[catPuesto].drel.push(j.drel || 0);
          posStats[catPuesto].z1825.push(j.z1825 || 0);
          posStats[catPuesto].hi.push(j.hi || 0);
          posStats[catPuesto].accAlta.push(j.accAlta || 0);
          posStats[catPuesto].decAlta.push(j.decAlta || 0);
          if(j.topSpeed > 0) posStats[catPuesto].top.push(j.topSpeed);
        }
      });
    });

    function avgArr(arr){ return arr && arr.length ? (arr.reduce(function(a,b){return a+b;},0)/arr.length) : 0; }

    var jugAvg = {
      dist: avgArr(sesJug.map(function(x){return x.dist;})),
      z1618: avgArr(sesJug.map(function(x){return x.z1618;})),
      s25: avgArr(sesJug.map(function(x){return x.s25;})),
      sprints: avgArr(sesJug.map(function(x){return x.sprints;})),
      tension: avgArr(sesJug.map(function(x){return (x.acc||0)+(x.dec||0);})),
      drel: avgArr(sesJug.map(function(x){return x.drel;})),
      z1825: avgArr(sesJug.map(function(x){return x.z1825;})),
      hi: avgArr(sesJug.map(function(x){return x.hi;})),
      accAlta: avgArr(sesJug.map(function(x){return x.accAlta;})),
      decAlta: avgArr(sesJug.map(function(x){return x.decAlta;})),
      top: avgArr(sesJug.map(function(x){return x.ts;}).filter(function(v){return v>0;}))
    };

    var compLabels = [nombre.split(' ')[0] + ' (Jugador)'].concat(puestosOrden);

    var htmlEntrenos = '<div style="margin-bottom:16px"><button onclick="exportarPDF(\''+nombre.replace(/'/g,"")+'\')" style="background:var(--celeste);color:#ffffff;border:none;padding:10px 20px;border-radius:10px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer">Exportar PDF</button></div>'+
      '<div id="informeContent" style="padding:4px">'+
        '<div class="informe-topwrap">' +
          '<div class="informe-head">' +
            '<div class="informe-cat-badge">' + CAT_ACTUAL + '</div>' +
            '<span class="nom">' + nombre + '</span>' +
            '<span class="meta">' + modoSub + ' · ' + semKeys.length + ' semanas · ' + sesJug.length + ' entrenamientos registrados</span>' +
          '</div>' +
          fotoHTML +
        '</div>' +
        headerMetrics +

        // 4 Gráficos semanales de a dos
        '<div class="informe-section-title" style="margin:26px 0 12px;display:flex;align-items:center;gap:12px;background:linear-gradient(90deg, rgba(0, 43, 102,0.18) 0%, rgba(0, 43, 102,0.02) 100%);padding:10px 16px;border-left:5px solid var(--celeste);border-radius:6px">'+
          '<span style="background:var(--celeste);color:#ffffff;font-size:11px;font-weight:900;padding:3px 8px;border-radius:4px;letter-spacing:1px">SECCIÓN 1</span>'+
          '<span style="font-family:var(--font-head);letter-spacing:0.5px;color:#ffffff !important;font-weight:800;font-size:17px;text-transform:uppercase">Evolución semanal en entrenamientos</span>'+
        '</div>'+
        '<div class="grid-two-charts">'+
          '<div class="card"><div class="chart-wrap" style="height:280px"><canvas id="infSemCarga"></canvas></div></div>'+
          '<div class="card"><div class="chart-wrap" style="height:280px"><canvas id="infSemSprints"></canvas></div></div>'+
          '<div class="card"><div class="chart-wrap" style="height:280px"><canvas id="infSemAccDec"></canvas></div></div>'+
          '<div class="card">'+
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
              '<span style="font-size:12px;font-weight:800;color:var(--text);font-family:var(--font-head)">Variable configurable</span>'+
              '<select class="sel" id="selInfSemCustomVar" style="font-size:11px;padding:4px 8px;margin-bottom:0">'+
                '<option value="drel">Distancia relativa (m/min)</option>'+
                '<option value="s25">Sprint >25 km/h (m)</option>'+
                '<option value="z1825">18 a 25 km/h (m)</option>'+
                '<option value="z1618">16 a 18 km/h (m)</option>'+
                '<option value="accAlta">Aceleraciones Altas (>3 m/s²)</option>'+
                '<option value="decAlta">Desaceleraciones Altas (<-3 m/s²)</option>'+
                '<option value="topSpeed">Velocidad máxima (km/h)</option>'+
                '<option value="minutos">Minutos de entreno (min)</option>'+
              '</select>'+
            '</div>'+
            '<div class="chart-wrap" style="height:238px"><canvas id="infSemCustom"></canvas></div>'+
          '</div>'+
        '</div>'+

        // Comparación con posiciones de las categorías (7 a 4) de a dos gráficos
        '<div class="informe-section-title" style="margin:32px 0 12px;display:flex;align-items:center;gap:12px;background:linear-gradient(90deg, rgba(0, 43, 102,0.18) 0%, rgba(0, 43, 102,0.02) 100%);padding:10px 16px;border-left:5px solid var(--celeste);border-radius:6px">'+
          '<span style="background:var(--celeste);color:#ffffff;font-size:11px;font-weight:900;padding:3px 8px;border-radius:4px;letter-spacing:1px">SECCIÓN 2</span>'+
          '<span style="font-family:var(--font-head);letter-spacing:0.5px;color:#ffffff !important;font-weight:800;font-size:17px;text-transform:uppercase">Comparación con otras posiciones del plantel (7ma a 4ta)</span>'+
        '</div>'+
        '<div class="grid-two-charts">'+
          '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="infPosDist"></canvas></div></div>'+
          '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="infPos1618"></canvas></div></div>'+
          '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="infPosS25"></canvas></div></div>'+
          '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="infPosSpr"></canvas></div></div>'+
          '<div class="card"><div class="chart-wrap" style="height:250px"><canvas id="infPosAccDec"></canvas></div></div>'+
          '<div class="card">'+
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
              '<span style="font-size:12px;font-weight:800;color:var(--text);font-family:var(--font-head)">Variable configurable</span>'+
              '<select class="sel" id="selInfCustomPosVar" style="font-size:11px;padding:4px 8px">'+
                '<option value="drel">Distancia relativa (m/min)</option>'+
                '<option value="z1825">18 a 25 km/h (m)</option>'+
                '<option value="hi">S > 16 km/h (m)</option>'+
                '<option value="tension4">Acc + Dec (>4 m/s) sumadas</option>'+
                '<option value="top">Top speed (km/h)</option>'+
              '</select>'+
            '</div>'+
            '<div class="chart-wrap" style="height:215px"><canvas id="infPosCustom"></canvas></div>'+
          '</div>'+
        '</div>'+

        // Tabla comparativa de posiciones sin decimales
        '<div class="card" style="overflow-x:auto;margin-top:16px">'+
          '<table class="data planilla-tbl">'+
            '<thead>'+
              '<tr>'+
                '<th style="text-align:left">Posición / Jugador</th>'+
                '<th>Distancia (m)</th>'+
                '<th>16-18 (m)</th>'+
                '<th>>25 (m)</th>'+
                '<th>Sprints</th>'+
                '<th>Acc+Dec >2,5</th>'+
                '<th>Drel (m/min)</th>'+
              '</tr>'+
            '</thead>'+
            '<tbody>'+
              '<tr style="background:rgba(0, 43, 102,0.12);font-weight:800">'+
                '<td style="text-align:left;color:var(--celeste)"><strong>' + nombre + ' (Jugador)</strong></td>'+
                '<td>' + fmt(Math.round(jugAvg.dist)) + '</td>'+
                '<td>' + fmt(Math.round(jugAvg.z1618)) + '</td>'+
                '<td>' + fmt(Math.round(jugAvg.s25)) + '</td>'+
                '<td>' + Math.round(jugAvg.sprints) + '</td>'+
                '<td>' + Math.round(jugAvg.tension) + '</td>'+
                '<td>' + Math.round(jugAvg.drel) + '</td>'+
              '</tr>'+
              puestosOrden.map(function(po){
                var pVals = posStats[po];
                return '<tr>'+
                  '<td style="text-align:left;font-weight:700">' + po + '</td>'+
                  '<td>' + fmt(Math.round(avgArr(pVals.dist))) + '</td>'+
                  '<td>' + fmt(Math.round(avgArr(pVals.z1618))) + '</td>'+
                  '<td>' + fmt(Math.round(avgArr(pVals.s25))) + '</td>'+
                  '<td>' + Math.round(avgArr(pVals.sprints)) + '</td>'+
                  '<td>' + Math.round(avgArr(pVals.tension)) + '</td>'+
                  '<td>' + Math.round(avgArr(pVals.drel)) + '</td>'+
                '</tr>';
              }).join('')+
            '</tbody>'+
          '</table>'+
        '</div>'+

        '<div class="card" style="margin-top:14px;background:var(--card);border-left:4px solid var(--celeste);padding:12px 16px">'+
          '<div style="font-weight:800;font-size:12px;color:var(--celeste);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">¿A qué hace referencia esta tabla de comparación de posiciones?</div>'+
          '<div style="font-size:11.5px;color:var(--text);line-height:1.5">Esta tabla compara el <strong>rendimiento físico promedio del jugador</strong> en entrenamientos contra el <strong>promedio de cada puesto o función táctica</strong> en el plantel del club (7ma a 4ta). Permite identificar si el futbolista alcanza los volúmenes, aceleraciones y sprints característicos de su posición o si presenta cualidades físicas destacadas compatibles con otras funciones.</div>'+
        '</div>'+

      '</div>';

    c.innerHTML = htmlEntrenos;

    var ctxW1 = document.getElementById('infSemCarga');
    if(ctxW1){
      var maxW1 = Math.max.apply(null, semCargas.concat([1000]));
      charts.infSemCarga = new Chart(ctxW1.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: semLabels,
          datasets: [{
            label: 'Carga semanal (m)',
            data: semCargas,
            backgroundColor: '#002B66',
            borderRadius: 4,
            datalabels: { color: cT(), font: { size: 10, weight: 'bold' }, anchor: 'end', align: 'top', offset: 2, formatter: function(v){ return fmt(Math.round(v)); } }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 14, bottom: 4, left: 4, right: 4 } },
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Carga acumulada por semana (m)', color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' }, padding: { top: 4, bottom: 18 } }
          },
          scales: {
            x: { ticks: { color: cM(), maxRotation: 45 } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: Math.ceil(maxW1 * 1.30) }
          }
        }
      });
    }

    var ctxW2 = document.getElementById('infSemSprints');
    if(ctxW2){
      var maxW2 = Math.max.apply(null, semSprints.concat([5]));
      charts.infSemSprints = new Chart(ctxW2.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: semLabels,
          datasets: [{
            label: 'Sprints por semana',
            data: semSprints,
            backgroundColor: '#8B5CF6',
            borderRadius: 4,
            datalabels: { color: cT(), font: { size: 10, weight: 'bold' }, anchor: 'end', align: 'top', offset: 2, formatter: function(v){ return v > 0 ? Math.round(v) : ''; } }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 14, bottom: 4, left: 4, right: 4 } },
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Cantidad de sprints por semana', color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' }, padding: { top: 4, bottom: 18 } }
          },
          scales: {
            x: { ticks: { color: cM(), maxRotation: 45 } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: Math.ceil(maxW2 * 1.30) }
          }
        }
      });
    }

    var ctxW3 = document.getElementById('infSemAccDec');
    if(ctxW3){
      var maxW3 = Math.max.apply(null, semAccDec.concat([5]));
      charts.infSemAccDec = new Chart(ctxW3.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: semLabels,
          datasets: [{
            label: 'Acc y Dec (>2,5) sumadas',
            data: semAccDec,
            backgroundColor: '#EC4899',
            borderRadius: 4,
            datalabels: { color: cT(), font: { size: 10, weight: 'bold' }, anchor: 'end', align: 'top', offset: 2, formatter: function(v){ return v > 0 ? Math.round(v) : ''; } }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 14, bottom: 4, left: 4, right: 4 } },
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Acc y Dcc (>2,5 m/s) por semana', color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' }, padding: { top: 4, bottom: 18 } }
          },
          scales: {
            x: { ticks: { color: cM(), maxRotation: 45 } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: Math.ceil(maxW3 * 1.30) }
          }
        }
      });
    }

    function renderCustomSemChart(){
      var cv = document.getElementById('infSemCustom');
      if(!cv) return;
      var sel = document.getElementById('selInfSemCustomVar');
      if(sel && window._lastInfSemCustomVar && sel.value !== window._lastInfSemCustomVar) {
        var optExists = Array.prototype.some.call(sel.options, function(o){ return o.value === window._lastInfSemCustomVar; });
        if(optExists) sel.value = window._lastInfSemCustomVar;
      }
      var vKey = sel ? sel.value : (window._lastInfSemCustomVar || 'drel');
      window._lastInfSemCustomVar = vKey;

      var mapVar = {
        'drel': {
          title: 'Distancia relativa media (m/min)',
          label: 'Distancia Relativa',
          col: '#002B66',
          unit: ' m/min',
          vals: semKeys.map(function(k){
            var o = semanasJugMap[k];
            if(o.minutos > 0 && o.carga > 0) return Math.round(o.carga / o.minutos);
            return o.drelCount > 0 ? Math.round(o.drelSum / o.drelCount) : 0;
          })
        },
        's25': {
          title: 'Sprint >25 km/h por semana (m)',
          label: 'Sprint >25 km/h',
          col: '#F59E0B',
          unit: ' m',
          vals: semKeys.map(function(k){ return Math.round(semanasJugMap[k].s25 || 0); })
        },
        'z1825': {
          title: 'High Speed Running 18 a 25 km/h (m)',
          label: '18 a 25 km/h',
          col: '#10B981',
          unit: ' m',
          vals: semKeys.map(function(k){ return Math.round(semanasJugMap[k].z1825 || 0); })
        },
        'z1618': {
          title: 'Distancia 16 a 18 km/h por semana (m)',
          label: '16 a 18 km/h',
          col: '#3B82F6',
          unit: ' m',
          vals: semKeys.map(function(k){ return Math.round(semanasJugMap[k].z1618 || 0); })
        },
        'accAlta': {
          title: 'Aceleraciones Altas (>3 m/s²) por semana',
          label: 'Acc Altas (>3 m/s²)',
          col: '#06B6D4',
          unit: '',
          vals: semKeys.map(function(k){ return Math.round(semanasJugMap[k].accAlta || 0); })
        },
        'decAlta': {
          title: 'Desaceleraciones Altas (<-3 m/s²) por semana',
          label: 'Dec Altas (<-3 m/s²)',
          col: '#EF4444',
          unit: '',
          vals: semKeys.map(function(k){ return Math.round(semanasJugMap[k].decAlta || 0); })
        },
        'topSpeed': {
          title: 'Velocidad máxima por semana (km/h)',
          label: 'Velocidad Máxima',
          col: '#EAB308',
          unit: ' km/h',
          vals: semKeys.map(function(k){ return Math.round(semanasJugMap[k].tsMax || 0); })
        },
        'minutos': {
          title: 'Minutos de entrenamiento por semana',
          label: 'Minutos Totales',
          col: '#8B5CF6',
          unit: ' min',
          vals: semKeys.map(function(k){ return Math.round(semanasJugMap[k].minutos || 0); })
        }
      };

      var cfg = mapVar[vKey] || mapVar['drel'];
      if(charts.infSemCustom) { try { charts.infSemCustom.destroy(); } catch(e){} }
      var maxV = Math.max.apply(null, cfg.vals.concat([10]));

      charts.infSemCustom = new Chart(cv.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: semLabels,
          datasets: [{
            label: cfg.title,
            data: cfg.vals,
            backgroundColor: cfg.col,
            borderRadius: 4,
            datalabels: {
              color: cT(),
              font: { size: 10, weight: 'bold' },
              anchor: 'end',
              align: 'top',
              offset: 2,
              formatter: function(v){
                if(v <= 0) return '';
                return fmt(Math.round(v));
              }
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 14, bottom: 4, left: 4, right: 4 } },
          plugins: {
            legend: { display: false },
            title: { display: true, text: cfg.title, color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' }, padding: { top: 4, bottom: 18 } },
            tooltip: {
              callbacks: {
                label: function(ctx){
                  var v = ctx.parsed.y;
                  return (cfg.label || cfg.title) + ': ' + fmt(v) + (cfg.unit || '');
                }
              }
            }
          },
          scales: {
            x: { ticks: { color: cM(), maxRotation: 45 } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: Math.ceil(maxV * 1.30) }
          }
        }
      });
    }

    renderCustomSemChart();
    var selSemVar = document.getElementById('selInfSemCustomVar');
    if(selSemVar){
      selSemVar.onchange = function(){
        window._lastInfSemCustomVar = this.value;
        renderCustomSemChart();
      };
    }

    function renderPosBarChart(canvasId, cKey, title, jugVal, posKey, colBase, unit){
      var cv = document.getElementById(canvasId);
      if(!cv) return;
      var vals = [Math.round(jugVal)].concat(puestosOrden.map(function(po){ return Math.round(avgArr(posStats[po][posKey])); }));
      var playerCol = '#00D2FF';
      var bgCols = vals.map(function(v, i){ return i === 0 ? playerCol : colBase; });
      var maxV = Math.max.apply(null, vals) || 10;

      charts[cKey] = new Chart(cv.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: [nombre + ' (Jugador)'].concat(puestosOrden),
          datasets: [{
            label: title,
            data: vals,
            backgroundColor: bgCols,
            borderColor: vals.map(function(v, i){ return i === 0 ? '#FFFFFF' : 'transparent'; }),
            borderWidth: vals.map(function(v, i){ return i === 0 ? 2.5 : 0; }),
            borderRadius: 4,
            maxBarThickness: 32,
            datalabels: {
              color: function(ctx){ return ctx.dataIndex === 0 ? '#FFFFFF' : cT(); },
              backgroundColor: function(ctx){ return ctx.dataIndex === 0 ? 'rgba(0, 43, 102, 0.95)' : 'transparent'; },
              borderColor: function(ctx){ return ctx.dataIndex === 0 ? '#FFFFFF' : 'transparent'; },
              borderWidth: function(ctx){ return ctx.dataIndex === 0 ? 1.5 : 0; },
              borderRadius: 4,
              padding: { top: 2, bottom: 2, left: 5, right: 5 },
              font: { size: 10, weight: 'bold' },
              anchor: 'end',
              align: 'top',
              offset: 3,
              formatter: function(v){ return v > 0 ? (fmt(Math.round(v)) + unit) : ''; }
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 18, bottom: 4 } },
          plugins: {
            legend: { display: false },
            title: { display: true, text: title, color: cT(), font: { family: 'Plus Jakarta Sans', size: 12.5, weight: '700' }, padding: { top: 4, bottom: 18 } }
          },
          scales: {
            x: { 
              ticks: { 
                color: function(ctx){ return ctx.index === 0 ? '#00D2FF' : cM(); }, 
                font: { size: 9.5, weight: function(ctx){ return ctx.index === 0 ? 'bold' : 'normal'; } }, 
                maxRotation: 45 
              } 
            },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: Math.ceil(maxV * 1.30) }
          }
        }
      });
    }

    // El jugador analizado se resalta en Celeste Integral con borde blanco y badge;
    // para Distancia, las posiciones usan gris pizarra (#64748B) para no confundirse con el azul
    renderPosBarChart('infPosDist', 'infPosDist', 'Distancia promedio por sesión (m)', jugAvg.dist, 'dist', '#64748B', ' m');
    renderPosBarChart('infPos1618', 'infPos1618', '16 a 18 km/h por sesión (m)', jugAvg.z1618, 'z1618', '#10B981', ' m');
    renderPosBarChart('infPosS25',  'infPosS25',  'Más de 25 km/h por sesión (m)', jugAvg.s25, 's25', '#F59E0B', ' m');
    renderPosBarChart('infPosSpr',  'infPosSpr',  'Cantidad de sprints por sesión', jugAvg.sprints, 'sprints', '#8B5CF6', '');
    renderPosBarChart('infPosAccDec','infPosAccDec','Acc + Dec (>2,5 m/s) por sesión', jugAvg.tension, 'tension', '#EC4899', '');

    function renderCustomPosChart(){
      var cv = document.getElementById('infPosCustom');
      if(!cv) return;
      var sel = document.getElementById('selInfCustomPosVar');
      var vKey = sel ? sel.value : 'drel';

      var mapVar = {
        'drel': { title: 'Distancia relativa (m/min)', jugV: jugAvg.drel, posK: 'drel', col: '#64748B', unit: ' m/min' },
        'z1825': { title: '18 a 25 km/h (m)', jugV: jugAvg.z1825, posK: 'z1825', col: '#14B8A6', unit: ' m' },
        'hi': { title: 'S > 16 km/h (m)', jugV: jugAvg.hi, posK: 'hi', col: '#6366F1', unit: ' m' },
        'tension4': { title: 'Acc + Dec (>4 m/s) sumadas', jugV: avgArr(sesJug.map(function(x){return (x.accAlta||0)+(x.decAlta||0);})), posK: 'accAlta', col: '#E11D48', unit: '' },
        'top': { title: 'Top speed (km/h)', jugV: jugAvg.top, posK: 'top', col: '#EAB308', unit: ' km/h' }
      };

      var cfg = mapVar[vKey] || mapVar['drel'];
      if(charts.infPosCustom) { try { charts.infPosCustom.destroy(); } catch(e){} }
      var vals = [Math.round(cfg.jugV)].concat(puestosOrden.map(function(po){ return Math.round(avgArr(posStats[po][cfg.posK])); }));
      var bgCols = vals.map(function(v, i){ return i === 0 ? '#002B66' : cfg.col; });
      var maxV = Math.max.apply(null, vals) || 10;

      charts.infPosCustom = new Chart(cv.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: compLabels,
          datasets: [{
            label: cfg.title,
            data: vals,
            backgroundColor: bgCols,
            borderRadius: 4,
            maxBarThickness: 32,
            datalabels: {
              color: cT(),
              font: { size: 10, weight: 'bold' },
              anchor: 'end',
              align: 'top',
              offset: 2,
              formatter: function(v){ return v > 0 ? (Math.round(v) + cfg.unit) : ''; }
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 14, bottom: 4 } },
          plugins: {
            legend: { display: false },
            title: { display: true, text: cfg.title, color: cT(), font: { family: 'Plus Jakarta Sans', size: 12.5, weight: '700' }, padding: { top: 4, bottom: 18 } }
          },
          scales: {
            x: { ticks: { color: cM(), font: { size: 9.5 }, maxRotation: 45 } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: Math.ceil(maxV * 1.28) }
          }
        }
      });
    }

    renderCustomPosChart();
    var selPosVar = document.getElementById('selInfCustomPosVar');
    if(selPosVar) selPosVar.onchange = renderCustomPosChart;

    return;
  }

  // ==============================================================
  // MODO 2: SOLO PARTIDOS (PDF Página 3) - TABLA SIN DECIMALES
  // ==============================================================
  if(modo === 'partidos') {
    var minThreshold = (CAT_ACTUAL === 'Octava' || CAT_ACTUAL === 'Novena') ? 50 : 70;
    var partidosJug = sesJug.slice();
    var partidosValidos = partidosJug.filter(function(x){ return x.min >= minThreshold; });

    function avgP(fn){
      if(!partidosValidos.length) return 0;
      var s = partidosValidos.reduce(function(acc, x){ return acc + fn(x); }, 0);
      return s / partidosValidos.length;
    }

    var pDist = avgP(function(x){ return x.dist; });
    var pDrel = avgP(function(x){ return x.drel; });
    var p1625 = avgP(function(x){ return (x.z1618 + x.z1825); });
    var pS25 = avgP(function(x){ return x.s25; });
    var pAccDec25 = avgP(function(x){ return (x.acc + x.dec); });
    var pAccDec4 = avgP(function(x){ return (x.accAlta + x.decAlta); });
    var pSprints = avgP(function(x){ return x.sprints; });
    var pVMax = partidosValidos.length ? Math.max.apply(null, partidosValidos.map(function(x){ return x.ts; })) : vMaxPartido;

    var kpisHtml = '';
    function agregarKpiPart(val, label, unit){
      if(val == null || isNaN(val) || val === '' || val === 'NaN') {
        kpisHtml += kpi('—', label);
        return;
      }
      var display = typeof val === 'number' ? fmt(Math.round(val)) : String(val);
      var u = unit ? '<small>' + unit + '</small>' : '';
      kpisHtml += kpi(display + u, label);
    }

    if(partidosValidos.length > 0){
      agregarKpiPart(pDist, 'Distancia', ' m');
      agregarKpiPart(pDrel, 'Distancia Relativa', ' m/min');
      agregarKpiPart(p1625, '16 a 25 km/h', ' m');
      agregarKpiPart(pS25, 'Más de 25 km/h', ' m');
      agregarKpiPart(pAccDec25, 'Acc + Dec > 2,5', '');
      agregarKpiPart(pAccDec4, 'Acc + Dec > 4', '');
      agregarKpiPart(pSprints, 'Cant. de Sprint', '');
      agregarKpiPart(pVMax > 0 ? pVMax : null, 'V Max', ' km/h');
    } else {
      kpisHtml = '<div class="obs" style="grid-column:1/-1;margin-bottom:8px">No registra partidos con más de <strong>' + minThreshold + ' minutos</strong> jugados (' + CAT_ACTUAL + '). Los promedios oficiales se calculan únicamente sobre partidos con tiempo reglamentario completo.</div>';
    }

    var rMap = (typeof rivalesMap === 'function') ? rivalesMap() : {};
    // Tabla Detalle completo de partidos disputados SIN DECIMALES
    var partidosOrdenadosMin = partidosJug.slice().sort(function(a, b){
      return (b.min || 0) - (a.min || 0);
    });
    var filasPartidos = partidosOrdenadosMin.map(function(pSes){
      var riv = pSes.rival || (rMap && rMap[pSes.fecha]) || '';
      var lblPartido = riv ? ('vs ' + riv.replace(/^vs\.?\s*/i, '')) : (pSes.per || 'Partido');
      var esMenor = pSes.min < minThreshold;
      var badgeSub = esMenor ? (' <span class="badge-sub70">< ' + minThreshold + ' min</span>') : '';

      return '<tr>'+
        '<td style="text-align:left;font-weight:700">' + lblPartido + '</td>'+
        '<td>' + pSes.fecha + '</td>'+
        '<td style="white-space:nowrap"><strong>' + Math.round(pSes.min) + ' min</strong>' + badgeSub + '</td>'+
        '<td>' + fmt(Math.round(pSes.dist)) + ' m</td>'+
        '<td>' + Math.round(pSes.drel) + '</td>'+
        '<td>' + fmt(Math.round(pSes.z1618 + pSes.z1825)) + ' m</td>'+
        '<td>' + fmt(Math.round(pSes.s25)) + ' m</td>'+
        '<td>' + Math.round(pSes.acc + pSes.dec) + '</td>'+
        '<td>' + Math.round(pSes.accAlta + pSes.decAlta) + '</td>'+
        '<td>' + Math.round(pSes.sprints) + '</td>'+
        '<td>' + (pSes.ts > 0 ? (Math.round(pSes.ts) + ' km/h') : '—') + '</td>'+
      '</tr>';
    }).join('');

    var htmlPartidos = '<div style="margin-bottom:16px"><button onclick="exportarPDF(\''+nombre.replace(/'/g,"")+'\')" style="background:var(--celeste);color:#ffffff;border:none;padding:10px 20px;border-radius:10px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer">Exportar PDF</button></div>'+
      '<div id="informeContent" style="padding:4px">'+
        '<div class="informe-topwrap">' +
          '<div class="informe-head">' +
            '<div class="informe-cat-badge">' + CAT_ACTUAL + '</div>' +
            '<span class="nom">' + nombre + '</span>' +
            '<span class="meta">Solo Partidos · ' + partidosJug.length + ' partidos disputados (' + partidosValidos.length + ' con ' + minThreshold + '+ min)</span>' +
          '</div>' +
          fotoHTML +
        '</div>' +

        '<div class="panel-sub" style="margin:16px 0 6px;font-family:var(--font-head);letter-spacing:1px;color:#ffffff !important;font-weight:800;font-size:15px">Promedios en competencia (' + minThreshold + '+ min)</div>'+
        '<div style="font-size:12px;color:#ffffff !important;margin-bottom:12px;font-weight:600">Promedios calculados sobre partidos donde disputó <strong style="color:#ffffff">' + minThreshold + '+ minutos</strong> (' + partidosValidos.length + ' de ' + partidosJug.length + ' jugados).</div>'+
        '<div class="kpis">' + kpisHtml + '</div>'+

        '<div class="panel-sub" style="margin:24px 0 10px;font-family:var(--font-head);letter-spacing:1px;color:#ffffff !important;font-weight:800;font-size:15px">Rendimiento a lo largo de las jornadas disputadas</div>'+
        '<div class="card">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">'+
            '<span style="font-size:12px;font-weight:800;color:var(--text);font-family:var(--font-head)">Evolución partido a partido</span>'+
            '<select class="sel" id="selInfPartMetChart" style="font-size:11.5px;padding:4px 8px">'+
              '<option value="dist" selected>Distancia total (m)</option>'+
              '<option value="drel">Distancia relativa (m/min)</option>'+
              '<option value="z1625">16 a 25 km/h (m)</option>'+
              '<option value="s25">Más de 25 km/h (m)</option>'+
              '<option value="tension">Acc + Dec > 2,5 sumadas</option>'+
              '<option value="tension4">Acc + Dec > 4 sumadas</option>'+
              '<option value="sprints">Cantidad de sprint</option>'+
              '<option value="ts">Velocidad máxima (km/h)</option>'+
            '</select>'+
          '</div>'+
          '<div class="chart-wrap" style="height:280px"><canvas id="infPartMatchChart"></canvas></div>'+
        '</div>'+

        '<div class="panel-sub" style="margin:24px 0 10px;font-family:var(--font-head);letter-spacing:1px;color:#ffffff !important;font-weight:800;font-size:15px">Detalle completo de partidos disputados</div>'+
        '<div class="card" style="overflow-x:auto">'+
          '<table class="data planilla-tbl">'+
            '<thead>'+
              '<tr>'+
                '<th style="text-align:left">Partido / Rival</th>'+
                '<th>Fecha</th>'+
                '<th>Minutos</th>'+
                '<th>Distancia</th>'+
                '<th>Drel</th>'+
                '<th>16-25</th>'+
                '<th>>25</th>'+
                '<th>Acc+Dec >2,5</th>'+
                '<th>Acc+Dec >4</th>'+
                '<th>Sprint</th>'+
                '<th>V Max</th>'+
              '</tr>'+
            '</thead>'+
            '<tbody>' + filasPartidos + '</tbody>'+
          '</table>'+
        '</div>'+
      '</div>';

    c.innerHTML = htmlPartidos;

    function renderPartTimelineChart(){
      var cv = document.getElementById('infPartMatchChart');
      if(!cv || !partidosJug.length) return;
      var sel = document.getElementById('selInfPartMetChart');
      var mKey = sel ? sel.value : 'dist';

      var chartDefs = {
        'dist': { label: 'Distancia (m)', unit: ' m', col: '#002B66', fn: function(p){ return Math.round(p.dist); } },
        'drel': { label: 'Distancia relativa (m/min)', unit: ' m/min', col: '#003882', fn: function(p){ return Math.round(p.drel); } },
        'z1625': { label: '16 a 25 km/h (m)', unit: ' m', col: '#10B981', fn: function(p){ return Math.round(p.z1618 + p.z1825); } },
        's25': { label: 'Más de 25 km/h (m)', unit: ' m', col: '#F59E0B', fn: function(p){ return Math.round(p.s25); } },
        'tension': { label: 'Acc + Dec > 2,5', unit: '', col: '#EC4899', fn: function(p){ return Math.round(p.acc + p.dec); } },
        'tension4': { label: 'Acc + Dec > 4', unit: '', col: '#E11D48', fn: function(p){ return Math.round(p.accAlta + p.decAlta); } },
        'sprints': { label: 'Sprints', unit: '', col: '#8B5CF6', fn: function(p){ return Math.round(p.sprints); } },
        'ts': { label: 'Velocidad máxima (km/h)', unit: ' km/h', col: '#EAB308', fn: function(p){ return p.ts > 0 ? Math.round(p.ts) : 0; } }
      };

      var cfg = chartDefs[mKey] || chartDefs['dist'];
      var labels = partidosJug.map(function(p){
        var r = p.rival || (rMap && rMap[p.fecha]) || '';
        return (r ? ('vs ' + r.replace(/^vs\.?\s*/i, '')) : 'Partido') + ' (' + p.fecha + ')';
      });
      var vals = partidosJug.map(function(p){ return cfg.fn(p); });

      if(charts.infPartMatchChart) { try { charts.infPartMatchChart.destroy(); } catch(e){} }

      var maxMatch = Math.max.apply(null, vals.concat([10]));
      charts.infPartMatchChart = new Chart(cv.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: cfg.label,
            data: vals,
            borderColor: cfg.col,
            backgroundColor: cfg.col + '22',
            borderWidth: 2,
            pointRadius: 5,
            pointBackgroundColor: cfg.col,
            fill: true,
            tension: 0.25,
            datalabels: {
              color: cT(),
              font: { size: 10, weight: 'bold' },
              anchor: 'end',
              align: 'top',
              offset: 2,
              formatter: function(v){ return v > 0 ? (Math.round(v) + cfg.unit) : ''; }
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 14, bottom: 4 } },
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Evolución por jornada — ' + cfg.label, color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' }, padding: { top: 4, bottom: 18 } }
          },
          scales: {
            x: { ticks: { color: cM(), maxRotation: 45, font: { size: 10 } } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true, suggestedMax: Math.ceil(maxMatch * 1.28) }
          }
        }
      });
    }

    renderPartTimelineChart();
    var selPartChartVar = document.getElementById('selInfPartMetChart');
    if(selPartChartVar) selPartChartVar.onchange = renderPartTimelineChart;

    return;
  }

  // ==============================================================
  // MODO 3: TODO
  // ==============================================================
  var nSes = sesJug.length;
  var distancias = sesJug.map(function(x){ return x.dist; });
  var cargaTotal = distancias.reduce(function(a,b){ return a+b; }, 0);
  var cargaProm = Math.round(prom(distancias));
  var cargaMax = Math.max.apply(null, distancias);

  var validTS = sesJug.map(function(x){ return x.ts; }).filter(function(v){ return v && !isNaN(v) && v > 0; });
  var recordTS = validTS.length ? Math.max.apply(null, validTS) : null;
  var tsPromJug = validTS.length ? prom(validTS) : null;

  var hiPromSes = Math.round(prom(sesJug.map(function(x){ return x.hi; })));
  var accProm = Math.round(prom(sesJug.map(function(x){ return x.acc; })));
  var sprintsProm = Math.round(prom(sesJug.map(function(x){ return x.sprints; })));
  var drelProm = Math.round(prom(sesJug.map(function(x){ return x.drel; })));

  var validMin = sesJug.map(function(x){ return x.min; }).filter(function(v){ return v > 0; });
  var minProm = validMin.length ? Math.round(prom(validMin)) : null;

  var allCargaPlantel = [];
  var sqDist=[], sqHI=[], sqAcc=[], sqSpr=[], sqTS=[];
  (D.sesiones || []).forEach(function(s){
    (s.jugadores || []).forEach(function(j){
      if((j.dist || 0) > 0){
        allCargaPlantel.push(j.dist);
        sqDist.push(j.dist);
        sqHI.push(j.hi || 0);
        sqAcc.push(j.acc || 0);
        sqSpr.push(j.sprints || 0);
        if(j.topSpeed > 0) sqTS.push(j.topSpeed);
      }
    });
  });

  var promPlantel = allCargaPlantel.length ? prom(allCargaPlantel) : 0;
  var pctPlantProm = promPlantel > 0 ? Math.round(cargaProm / promPlantel * 100) : null;

  var semanasJugMap = {};
  sesJug.forEach(function(s){
    var lKey = keyLunes(s.fecha);
    if(!semanasJugMap[lKey]){
      semanasJugMap[lKey] = {
        lunes: lunesDe(s.fecha),
        label: ('0'+lunesDe(s.fecha).getDate()).slice(-2)+'/'+('0'+(lunesDe(s.fecha).getMonth()+1)).slice(-2),
        tsMax: 0,
        carga: 0
      };
    }
    if((s.ts || 0) > semanasJugMap[lKey].tsMax){
      semanasJugMap[lKey].tsMax = s.ts;
    }
    semanasJugMap[lKey].carga += (s.dist || 0);
  });

  var semKeys = Object.keys(semanasJugMap).sort(function(a,b){
    return semanasJugMap[a].lunes - semanasJugMap[b].lunes;
  });
  var semLabels = semKeys.map(function(k){ return semanasJugMap[k].label; });
  var semCargas = semKeys.map(function(k){ return Math.round(semanasJugMap[k].carga); });
  var semVel = semKeys.map(function(k){ return Math.round(semanasJugMap[k].tsMax); });

  var kpisHtml = '';
  function agregarKpi(val, label, unit){
    if(val == null || isNaN(val) || val === '' || val === 'NaN') return;
    var display = typeof val === 'number' ? fmt(Math.round(val)) : String(val);
    if(display.indexOf('NaN') >= 0 || display === '—') return;
    var u = unit ? '<small>' + unit + '</small>' : '';
    kpisHtml += kpi(display + u, label);
  }

  agregarKpi(cargaTotal, 'Carga total', ' m');
  agregarKpi(cargaProm, 'Carga promedio', ' m');
  agregarKpi(cargaMax, 'Carga máxima sesión', ' m');
  if(pctPlantProm != null && isFinite(pctPlantProm) && pctPlantProm > 0){
    agregarKpi(pctPlantProm, 'Carga vs plantel', '%');
  }
  if(recordTS != null && recordTS > 0){
    agregarKpi(recordTS, 'Velocidad récord', ' km/h');
  }
  if(hiPromSes != null && hiPromSes > 0){
    agregarKpi(hiPromSes, 'Alta int. prom.', ' m');
  }
  if(accProm != null && accProm > 0){
    agregarKpi(accProm, 'Acel. >2,5 prom.', '');
  }
  if(sprintsProm != null && sprintsProm >= 0){
    agregarKpi(sprintsProm, 'Sprints prom.', '');
  }
  if(drelProm != null && drelProm > 0){
    agregarKpi(drelProm, 'Dist. relativa prom.', ' m/min');
  }
  if(minProm != null && minProm > 0){
    agregarKpi(minProm, 'Minutos prom.', ' min');
  }

  var html = '<div style="margin-bottom:16px"><button onclick="exportarPDF(\''+nombre.replace(/'/g,"")+'\')" style="background:var(--celeste);color:#ffffff;border:none;padding:10px 20px;border-radius:10px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer">Exportar PDF</button></div>'+
    '<div id="informeContent" style="padding:4px">'+
      '<div class="informe-topwrap">' +
        '<div class="informe-head">' +
          '<div class="informe-cat-badge">' + CAT_ACTUAL + '</div>' +
          '<span class="nom">' + nombre + '</span>' +
          '<span class="meta">' + modoSub + ' · ' + semKeys.length + ' semanas con datos · ' + nSes + ' sesiones registradas</span>' +
        '</div>' +
        fotoHTML +
      '</div>' +
      '<div class="kpis">'+kpisHtml+'</div>'+
      '<div class="grid-two-charts">'+
        '<div class="card"><div class="chart-wrap" style="height:280px"><canvas id="infCarga"></canvas></div></div>'+
        '<div class="card"><div class="chart-wrap" style="height:280px"><canvas id="infVel"></canvas></div></div>'+
      '</div>'+
    '</div>';

  c.innerHTML = html;

  var ctx1 = document.getElementById('infCarga').getContext('2d');
  charts.infCarga = new Chart(ctx1, {
    plugins: [ChartDataLabels],
    type: 'bar',
    data: {
      labels: semLabels,
      datasets: [{
        label: 'Carga semanal (m)',
        data: semCargas,
        backgroundColor: '#5BA3DE',
        borderRadius: 4,
        datalabels: { color: cT(), font: { size: 10, weight: 'bold' }, anchor: 'end', align: 'top', formatter: function(v){ return fmt(Math.round(v)); } }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Carga acumulada por semana (m)', color: cT(), font: { family: 'Plus Jakarta Sans', size: 14 } }
      },
      scales: {
        x: { ticks: { color: cM(), maxRotation: 45 } },
        y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true }
      }
    }
  });

  var ctx2 = document.getElementById('infVel').getContext('2d');
  charts.infVel = new Chart(ctx2, {
    plugins: [ChartDataLabels],
    type: 'line',
    data: {
      labels: semLabels,
      datasets: [
        {
          label: 'Vel. máx alcanzada (km/h)',
          data: semVel,
          borderColor: '#2ECC71',
          backgroundColor: '#2ECC7133',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#2ECC71',
          fill: true,
          tension: 0.3,
          datalabels: { color: cT(), font: { size: 10, weight: 'bold' }, anchor: 'end', align: 'top', formatter: function(v){ return v > 0 ? (Math.round(v) + ' km/h') : ''; } }
        },
        recordTS ? {
          label: 'Récord personal (' + Math.round(recordTS) + ' km/h)',
          data: semLabels.map(function(){ return Math.round(recordTS); }),
          borderColor: '#5BA3DE',
          borderDash: [5, 3],
          pointRadius: 0,
          fill: false,
          datalabels: { display: false }
        } : null
      ].filter(Boolean)
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: cM() } },
        title: { display: true, text: 'Velocidad máxima registrada por semana (km/h)', color: cT(), font: { family: 'Plus Jakarta Sans', size: 14 } }
      },
      scales: {
        x: { ticks: { color: cM(), maxRotation: 45 } },
        y: { ticks: { color: cM(), callback: function(v){ return Math.round(v) + ' km/h'; } }, grid: { color: cG() }, min: 0, suggestedMax: (recordTS || 30) + 3 }
      }
    }
  });
}

// ─── INFORME DE PARTIDO ───
function renderPartido(p){
  p.innerHTML='<div class="panel-title" style="text-shadow:none !important">Informe de Partido</div>'+
    '<div class="panel-sub">Análisis detallado de rendimiento físico en partidos oficiales y amistosos. Podés ver el resumen del equipo completo, el desglose individual por jugador o comparar dos rendimientos.</div>'+
    '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:18px;background:var(--card);padding:14px 16px;border-radius:10px;border:1px solid var(--border);box-shadow:var(--shadow-card)">'+
      '<div style="display:flex;flex-direction:column;gap:5px">'+
        '<label for="selPartModo" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text)">Tipo de Informe / Vista</label>'+
        '<select class="sel" id="selPartModo" style="min-width:220px;font-weight:700">'+
          '<option value="equipo" selected>Resumen del equipo (por partido)</option>'+
          '<option value="jugador">Detalle individual por jugador</option>'+
          '<option value="comparar">Comparar 2 jugadores</option>'+
          '<option value="colectivo">Colectivo · Partidos</option>'+
        '</select>'+
      '</div>'+
      '<div id="partSelectores" style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end"></div>'+
    '</div>'+
    '<div id="partDetail"></div>';
  document.getElementById('selPartModo').onchange=function(){construirSelectores(this.value);};
  construirSelectores('equipo');
}
function construirSelectores(modo){
  var cont=document.getElementById('partSelectores');
  var ses=D.sesiones||[];var m=rivalesMap();
  
  // Lista de todos los partidos únicos ordenados del más reciente al más antiguo
  var todosPartidos=[];
  var seen={};
  ses.forEach(function(s){
    if(s.tipo && s.tipo.indexOf('Partido')>=0){
      var fKey = (s.fecha && String(s.fecha).trim()) ? s.fecha : (s.rival ? ('Partido vs ' + s.rival) : 'Sin fecha');
      if(!seen[fKey]){
        seen[fKey]=true;
        if(!s.fecha) s.fecha = fKey;
        todosPartidos.push(s);
      }
    }
  });
  todosPartidos.sort(function(a,b){
    if(!a.fecha || !b.fecha) return 0;
    var pa=String(a.fecha).split('/'), pb=String(b.fecha).split('/');
    if(pa.length<3 || pb.length<3) return 0;
    return new Date(pb[2],pb[1]-1,pb[0]) - new Date(pa[2],pa[1]-1,pa[0]);
  });
  var fechas=todosPartidos.map(function(s){return s.fecha;});

  if(!fechas.length){
    cont.innerHTML='<span style="color:var(--amber);font-size:13px">No hay partidos registrados todavía para esta categoría.</span>';
    document.getElementById('partDetail').innerHTML='<div class="obs">Esta categoría no tiene partidos cargados aún en el Sheet.</div>';
    return;
  }

  if(modo==='comparar'){
    // Obtener jugadores que jugaron un partido específico
    function jugsDeFecha(f){
      var part=null;
      ses.forEach(function(s){if(s.fecha===f && s.tipo && s.tipo.indexOf('Partido')>=0) part=s;});
      return part ? part.jugadores.slice().sort(function(a,b){return a.jugador.localeCompare(b.jugador);}) : [];
    }

    cont.innerHTML='<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:var(--card);padding:10px 14px;border-radius:8px;border:1px solid var(--border)">'+
      // Lado 1 (Celeste)
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
        '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#5BA3DE"></span>'+
        '<span style="font-size:12px;color:var(--celeste);font-weight:700;letter-spacing:1px">1º Partido:</span>'+
        '<select class="sel" id="selCmpP1Fecha" style="margin-bottom:0">'+fechas.map(function(f){return '<option value="'+f+'">'+etiquetaPartido(f,m)+' ('+f+')</option>';}).join('')+'</select>'+
        '<span style="font-size:12px;color:#ffffff;font-weight:600">Jugador:</span>'+
        '<select class="sel" id="selCmpP1Jug" style="margin-bottom:0"></select>'+
      '</div>'+
      '<div style="color:#ffffff;font-weight:800;font-size:13px;padding:0 4px">VS</div>'+
      // Lado 2 (Verde)
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
        '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#2ECC71"></span>'+
        '<span style="font-size:12px;color:#2ECC71;font-weight:700;letter-spacing:1px">2º Partido:</span>'+
        '<select class="sel" id="selCmpP2Fecha" style="margin-bottom:0">'+fechas.map(function(f){return '<option value="'+f+'">'+etiquetaPartido(f,m)+' ('+f+')</option>';}).join('')+'</select>'+
        '<span style="font-size:12px;color:#ffffff;font-weight:600">Jugador:</span>'+
        '<select class="sel" id="selCmpP2Jug" style="margin-bottom:0"></select>'+
      '</div>'+
    '</div>';

    var selP1F=document.getElementById('selCmpP1Fecha');
    var selP1J=document.getElementById('selCmpP1Jug');
    var selP2F=document.getElementById('selCmpP2Fecha');
    var selP2J=document.getElementById('selCmpP2Jug');

    function poblarJugadores1(mantenerNombre){
      var f=selP1F.value;
      var jugs=jugsDeFecha(f);
      if(!jugs.length){
        selP1J.innerHTML='<option value="">— sin jugadores —</option>';
      } else {
        selP1J.innerHTML=jugs.map(function(j){
          return '<option value="'+j.jugador+'">'+j.jugador+(j.min?' ('+Math.round(j.min)+' min)':'')+'</option>';
        }).join('');
        if(mantenerNombre && jugs.some(function(j){return j.jugador===mantenerNombre;})){
          selP1J.value=mantenerNombre;
        } else {
          selP1J.selectedIndex=0;
        }
      }
    }

    function poblarJugadores2(mantenerNombre, defaultSegundo){
      var f=selP2F.value;
      var jugs=jugsDeFecha(f);
      if(!jugs.length){
        selP2J.innerHTML='<option value="">— sin jugadores —</option>';
      } else {
        selP2J.innerHTML=jugs.map(function(j){
          return '<option value="'+j.jugador+'">'+j.jugador+(j.min?' ('+Math.round(j.min)+' min)':'')+'</option>';
        }).join('');
        if(mantenerNombre && jugs.some(function(j){return j.jugador===mantenerNombre;})){
          selP2J.value=mantenerNombre;
        } else if(defaultSegundo && jugs.length>1 && selP1F.value===selP2F.value){
          selP2J.selectedIndex=1;
        } else {
          selP2J.selectedIndex=0;
        }
      }
    }

    function triggerComparar(){
      var n1=selP1J.value;
      var f1=selP1F.value;
      var n2=selP2J.value;
      var f2=selP2F.value;
      renderComparaPartido(n1, f1, n2, f2);
    }

    selP1F.onchange=function(){
      var prevJ1=selP1J.value;
      poblarJugadores1(prevJ1);
      triggerComparar();
    };
    selP1J.onchange=triggerComparar;

    selP2F.onchange=function(){
      var prevJ2=selP2J.value;
      poblarJugadores2(prevJ2, false);
      triggerComparar();
    };
    selP2J.onchange=triggerComparar;

    poblarJugadores1();
    poblarJugadores2(null, true);
    triggerComparar();
  } else if(modo==='equipo'){
    cont.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:5px">'+
        '<label for="selPartFechaEq" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text)">Partido (Rival y Fecha)</label>'+
        '<select class="sel" id="selPartFechaEq" style="min-width:210px;font-weight:600">'+
          fechas.map(function(f){return '<option value="'+f+'">'+etiquetaPartido(f,m)+' ('+f+')</option>'}).join('')+
        '</select>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:5px">'+
        '<label for="selPartMin" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text)">Filtro de Minutos Jugados</label>'+
        '<select class="sel" id="selPartMin" style="min-width:170px">'+
          '<option value="0">Todos los minutos (plantel completo)</option>'+
          '<option value="15">15+ minutos</option>'+
          '<option value="30">30+ minutos</option>'+
          '<option value="45">45+ minutos (Titulares)</option>'+
          '<option value="60">60+ minutos</option>'+
          '<option value="70">70+ minutos</option>'+
        '</select>'+
      '</div>';
    function reEq(){renderEquipoDetail(document.getElementById('selPartFechaEq').value, parseInt(document.getElementById('selPartMin').value)||0);}
    document.getElementById('selPartFechaEq').onchange=reEq;
    document.getElementById('selPartMin').onchange=reEq;
    reEq();
  } else if(modo==='colectivo'){
    cont.innerHTML='';
    renderColPartido(document.getElementById('partDetail'), true);
  } else {
    // Modo JUGADOR: Primero elige el partido (todos a la vista), luego el jugador que jugó ese partido
    cont.innerHTML=
      '<div style="display:flex;flex-direction:column;gap:5px">'+
        '<label for="selPartFecha" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text)">Partido (Rival y Fecha)</label>'+
        '<select class="sel" id="selPartFecha" style="min-width:210px;font-weight:600">'+
          fechas.map(function(f){
            var sPart = ses.find(function(s){ return s.fecha === f && (s.tipo||'').indexOf('Partido') >= 0; });
            var rivalLabel = (sPart && sPart.rival) || (m && m[f]) || '';
            var lbl = rivalLabel ? (/^vs\.?\s*/i.test(rivalLabel) ? rivalLabel : ('vs ' + rivalLabel)) : ('Partido');
            return '<option value="'+f+'">'+lbl+' ('+f+')</option>';
          }).join('')+
        '</select>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:5px">'+
        '<label for="selPartJug" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text)">Jugador a Analizar</label>'+
        '<select class="sel" id="selPartJug" style="min-width:190px;font-weight:600"></select>'+
      '</div>';
    function actualizarJugadoresDelPartido(){
      var fechaSel=document.getElementById('selPartFecha').value;
      var partSes=null;
      ses.forEach(function(s){if(s.fecha===fechaSel && s.tipo.indexOf('Partido')>=0) partSes=s;});
      var jugsPart = partSes ? partSes.jugadores.slice().sort(function(a,b){return a.jugador.localeCompare(b.jugador);}) : [];
      var selJ=document.getElementById('selPartJug');
      if(!jugsPart.length){
        selJ.innerHTML='<option value="">— sin jugadores —</option>';
        document.getElementById('partDetail').innerHTML='<div class="obs">No hay jugadores registrados en este partido.</div>';
        return;
      }
      var prevJug = selJ.value;
      selJ.innerHTML=jugsPart.map(function(j){
        var minTxt = (j.min && !isNaN(j.min) && j.min > 0) ? (' (' + Math.round(j.min) + ' min)') : '';
        return '<option value="'+j.jugador+'">'+j.jugador+minTxt+'</option>';
      }).join('');
      if(prevJug && jugsPart.some(function(j){ return j.jugador === prevJug; })) {
        selJ.value = prevJug;
        renderPartidoDetail(prevJug, fechaSel);
      } else {
        selJ.selectedIndex = 0;
        renderPartidoDetail(jugsPart[0].jugador, fechaSel);
      }
    }
    document.getElementById('selPartFecha').onchange=actualizarJugadoresDelPartido;
    document.getElementById('selPartJug').onchange=function(){renderPartidoDetail(this.value, document.getElementById('selPartFecha').value);};
    actualizarJugadoresDelPartido();
  }
}
function renderPartidoDetail(nombre,fecha){
  EXPORT_RERENDER=function(){renderPartidoDetail(nombre,fecha);};
  var c=document.getElementById('partDetail');
  if(!nombre||!fecha){c.innerHTML='<div class="obs">Selecciona jugador y partido.</div>';return;}
  var ses=D.sesiones||[];var dato=null;var m=rivalesMap();
  ses.forEach(function(s){if(s.tipo.indexOf('Partido')>=0)s.jugadores.forEach(function(j){if(s.fecha===fecha&&j.jugador===nombre)dato=j;});});
  if(!dato){c.innerHTML='<div class="obs">No se encontraron datos de '+nombre+' en el partido del '+fecha+'.</div>';return;}
  function parseMinNum(val) {
    if (val == null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    var s = String(val).replace(',', '.').trim();
    var num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }
  function parseNum(val) {
    if (val == null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    var s = String(val).trim();
    if (s.indexOf(',') >= 0) {
      s = s.replace(/\./g, '').replace(',', '.');
    }
    var num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }

  var histMap = {};
  ses.forEach(function(s){
    if((s.tipo || '').indexOf('Partido') < 0) return;
    (s.jugadores || []).forEach(function(j){
      if(j.jugador === nombre) {
        var rivalNom = j.rival || s.rival || m[s.fecha] || '';
        var etiq = rivalNom ? (/^vs\.?\s*/i.test(rivalNom) ? rivalNom : ('vs ' + rivalNom)) : ('Partido ' + s.fecha);
        var minVal = parseMinNum(j.min != null ? j.min : (j.minutos || j.duracion || 0));
        if(!histMap[s.fecha] || minVal > parseMinNum(histMap[s.fecha].d.min)) {
          histMap[s.fecha] = {f: s.fecha, d: j, s: s, et: etiq, rival: rivalNom};
        }
      }
    });
  });
  var hist = Object.keys(histMap).map(function(k){ return histMap[k]; });
  // Orden cronológico (del más antiguo al más reciente para evolución de temporada)
  hist.sort(function(a,b){var pa=a.f.split('/'),pb=b.f.split('/');return new Date(pa[2],pa[1]-1,pa[0])-new Date(pb[2],pb[1]-1,pb[0]);});
  var catNorm = (CAT_ACTUAL || '').toLowerCase();
  var umbralMin = catNorm.indexOf('novena') >= 0 ? 50 : (catNorm.indexOf('octava') >= 0 ? 60 : 70);
  var hd = hist.map(function(h){return h.d;});
  var histFull = hist.filter(function(h){
    if(!h || !h.d) return false;
    var mVal = parseMinNum(h.d.min != null ? h.d.min : (h.d.minutos || h.d.duracion || 0));
    return mVal >= umbralMin;
  });
  var hdFull = histFull.length > 0 ? histFull.map(function(h){ return h.d; }) : hd;
  var avg = {}, mx = {};
  ['dist','drel','hi','z1618','z1825','s25','sprints','topSpeed','acc','dec','min','mphi'].forEach(function(k){
    var valsFull = hdFull.map(function(h){ return parseNum(h[k]); });
    avg[k] = prom(valsFull);
    var vals = hd.map(function(h){ return parseNum(h[k]); });
    mx[k] = Math.max.apply(null, vals.concat([0]));
  });
  
  // Obtener récord de velocidad real (sin NaN)
  var recordAlert = (D.alertas||[]).filter(function(a){return a.jugador===nombre;})[0];
  var tsMax = (recordAlert && recordAlert.topSpeed) ? recordAlert.topSpeed : 0;
  if (!tsMax) {
    (D.sesiones||[]).forEach(function(s){
      s.jugadores.forEach(function(j){
        if (j.jugador===nombre && (j.topSpeed||0)>tsMax) tsMax=j.topSpeed;
      });
    });
  }
  if (!tsMax && dato.topSpeed) tsMax = dato.topSpeed;
  var pctTS = tsMax > 0 ? Math.round(dato.topSpeed / tsMax * 100) : 0;
  var difDist=avg.dist>0?Math.round((dato.dist-avg.dist)/avg.dist*100):0;
  var partidoRival = dato.rival || (hist.find(function(h){return h.f===fecha;})||{}).rival || m[fecha] || '';
  var sintP='<p><strong>'+nombre+'</strong> en el partido del <strong>'+fecha+'</strong>'+(partidoRival?' (vs '+partidoRival+')':'')+' recorrió <strong>'+fmt(dato.dist)+' m</strong> en '+Math.round(dato.min)+' minutos (dist. relativa: '+fmt(dato.drel,1)+' m/min)'+
    (difDist>10?' — '+difDist+'% por encima de su promedio (+'+umbralMin+' min)':difDist<-10?' — '+Math.abs(difDist)+'% por debajo de su promedio (+'+umbralMin+' min)':' — en línea con su promedio (+'+umbralMin+' min)')+'.</p>'+
    '<p><strong>Zonas de velocidad:</strong> '+fmt(dato.z1618||0)+' m entre 16-18 km/h, '+fmt(dato.z1825||0)+' m entre 18-25 km/h y '+fmt(dato.s25||0)+' m a más de 25 km/h. Hizo <strong>'+dato.sprints+' sprint(s)</strong> y llegó a <strong>'+dato.topSpeed+' km/h</strong> ('+pctTS+'% de su récord de '+tsMax+' km/h).</p>'+
    '<p><strong>Potencia metabólica y neuromuscular:</strong> '+fmt(dato.mphi||0,1)+'% MPHI (% PM) y '+dato.acc+' aceleraciones (>2,5 m/s).</p>'+
    (dato.dist>=mx.dist?'<p><strong>Fue su partido de mayor distancia en la temporada.</strong></p>':'')+
    (dato.hi>=mx.hi?'<p><strong>Fue su partido con más alta intensidad de la temporada.</strong></p>':'');

  // Formato para rivales en el eje X
  function formatoRivalX(h) {
    var r = (h.rival) || (h.d && h.d.rival) || (h.s && h.s.rival) || (m && m[h.f]) || '';
    var dm = (h.f || '').split('/').slice(0, 2).join('/');
    var cleanR = String(r || '').replace(/^vs\.?\s*/i, '').trim();
    return (cleanR ? cleanR : 'Partido') + ' (' + dm + ')';
  }
  var histLabels=hist.map(function(h){return formatoRivalX(h);});

  var html='<div style="margin-bottom:16px"><button onclick="exportarPDF(\''+nombre.replace(/'/g,'')+' '+fecha+'\')" style="background:var(--celeste);color:#ffffff;border:none;padding:10px 20px;border-radius:10px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer">Exportar PDF</button></div>'+
    '<div id="partidoContent" style="padding:4px">'+
    '<div class="informe-head" style="margin-bottom:24px;padding-bottom:16px"><span class="nom partido-head-title" style="font-size:26px;font-weight:800">'+nombre+'</span><span class="meta partido-head-meta" style="font-size:13px">Partido del '+fecha+(m[fecha]?' · vs '+m[fecha]:'')+' | '+Math.round(dato.min)+' min | '+hist.length+' partidos en historial ('+histFull.length+' con +'+umbralMin+' min)</span></div>'+
    '<div class="kpis">'+
    kpiCmp(dato.min,avg.min,'Minutos',' min')+
    kpiCmp(dato.dist,avg.dist,'Distancia (prom +'+umbralMin+'m)',' m')+
    kpiCmp(dato.drel,avg.drel,'Dist. relativa',' m/min',1)+
    kpiCmp(dato.mphi||0,avg.mphi,'Prom. %PM (MPHI)','%',1)+
    kpiCmp(dato.z1618||0,avg.z1618,'16-18 km/h',' m')+
    kpiCmp(dato.z1825||0,avg.z1825,'18-25 km/h',' m')+
    kpiCmp(dato.s25||0,avg.s25,'>25 km/h (prom +'+umbralMin+'m)',' m')+
    kpiCmp(dato.sprints,avg.sprints,'Sprints (prom +'+umbralMin+'m)','')+
    '<div class="kpi"><div class="v">'+fmt(dato.topSpeed,2)+'<small> km/h</small></div><div class="l" title="Top speed">Top speed</div><div class="kpi-sub">'+pctTS+'% récord ('+fmt(tsMax,1)+') · prom +'+umbralMin+'m: '+fmt(avg.topSpeed,1)+'</div></div>'+
    kpiCmp(dato.acc,avg.acc,'Acel. >2,5','')+
    '</div>'+
    // Gráfico 1: Distancia total con corte en distancia relativa
    '<div class="chart-print-page"><div class="card"><div class="chart-wrap" style="height:380px"><canvas id="partG1_DistRel"></canvas></div></div>'+
    expl('Gráfico 1 · Distancia Total (m) con Corte en Distancia Relativa (m/min): Barras celestes (eje izquierdo) = Distancia total recorrida contra cada rival. Línea dorada (eje derecho) = Distancia relativa en m/min (corte de intensidad). Línea punteada verde = Promedio del jugador en partidos de +'+umbralMin+' min. El partido actual está resaltado.')+'</div>'+
    // Gráfico 2: 16-18 hasta 25 km/h HSR
    '<div class="chart-print-page"><div class="card"><div class="chart-wrap" style="height:370px"><canvas id="partG2_HSR"></canvas></div></div>'+
    expl('Gráfico 2 · High Speed Running (16-18 km/h hasta 25 km/h): Barras apiladas de alta intensidad contra cada rival. Celeste = 16-18 km/h, Naranja = 18-25 km/h. La altura combinada de la barra representa el total de metros HSR. Línea punteada dorada = Promedio HSR en partidos de +'+umbralMin+' min.')+'</div>'+
    // Gráfico 3: +25 km/h
    '<div class="chart-print-page"><div class="card"><div class="chart-wrap" style="height:360px"><canvas id="partG3_S25"></canvas></div></div>'+
    expl('Gráfico 3 · Distancia a +25 km/h (Sprint puro): Metros a máxima velocidad (>25 km/h) completados frente a cada rival. Línea punteada dorada = Promedio >25 km/h en partidos de +'+umbralMin+' min.')+'</div>'+
    // Gráfico 4: Top sprint y Cant sprint en el mismo gráfico
    '<div class="chart-print-page"><div class="card"><div class="chart-wrap" style="height:380px"><canvas id="partG4_TopCantSpr"></canvas></div></div>'+
    expl('Gráfico 4 · Sprints y Top Speed (Mismo gráfico): Barras celestes (eje izquierdo) = Cantidad de sprints por partido. Línea roja (eje derecho) = Top speed en km/h. Líneas punteadas = Promedios de sprints y top speed en partidos de +'+umbralMin+' min.')+'</div>'+
    sintesis(sintP)+'</div>';
  c.innerHTML=html;

  // Destruir gráficos previos
  ['partG1','partG2','partG3','partG4'].forEach(function(k){if(charts[k]){charts[k].destroy();delete charts[k];}});

  // Gráfico 1: Distancia Total y Corte en Distancia Relativa
  var distCols=hist.map(function(h){return h.f===fecha?'#5BA3DE':'#5BA3DE55';});
  var distBorders=hist.map(function(h){return h.f===fecha?'#FFFFFF':'transparent';});
  var maxDistVal=Math.max.apply(null,hd.map(function(h){return h.dist||0;}).concat([avg.dist||0,1000]));
  var maxDrelVal=Math.max.apply(null,hd.map(function(h){return h.drel||0;}).concat([100]));
  function isBarHigher(ctx){
    try {
      var ch=ctx.chart;
      if(!ch||!ch.scales||!ch.scales.y||!ch.scales.y1)return true;
      var d=hd[ctx.dataIndex];
      if(!d)return true;
      var yB=ch.scales.y.getPixelForValue(d.dist||0);
      var yL=ch.scales.y1.getPixelForValue(d.drel||0);
      if(isNaN(yB)||isNaN(yL))return true;
      return yB<=yL;
    }catch(e){
      return true;
    }
  }
  charts.partG1=new Chart(document.getElementById('partG1_DistRel').getContext('2d'),{
    type:'bar',
    plugins:[ChartDataLabels],
    data:{
      labels:histLabels,
      datasets:[
        {
          type:'bar',
          label:'Distancia total (m)',
          data:hd.map(function(h){return h.dist;}),
          yAxisID:'y',
          backgroundColor:distCols,
          borderColor:distBorders,
          borderWidth:hist.map(function(h){return h.f===fecha?2:0;}),
          borderRadius:4,
          order:2,
          datalabels:{
            color:'#FFFFFF',
            backgroundColor:'rgba(15, 23, 42, 0.90)',
            borderColor:'#5BA3DE',
            borderWidth:1.5,
            borderRadius:4,
            padding:{top:2,bottom:2,left:5,right:5},
            font:{size:9,weight:'bold'},
            anchor:'end',
            align:function(ctx){return isBarHigher(ctx)?'top':'bottom';},
            offset:function(ctx){return isBarHigher(ctx)?6:8;},
            formatter:function(v){return fmt(v)+' m';}
          }
        },
        {
          type:'line',
          label:'Corte Dist. relativa (m/min)',
          data:hd.map(function(h){return Math.round((h.drel||0)*10)/10;}),
          yAxisID:'y1',
          borderColor:'#F1C40F',
          backgroundColor:'#F1C40F',
          borderWidth:2.5,
          pointRadius:hist.map(function(h){return h.f===fecha?6:4;}),
          pointBackgroundColor:hist.map(function(h){return h.f===fecha?'#FFFFFF':'#F1C40F';}),
          tension:0.2,
          order:1,
          datalabels:{
            color:'#0f172a',
            backgroundColor:'#F1C40F',
            borderColor:'#FFFFFF',
            borderWidth:1.2,
            borderRadius:4,
            padding:{top:2,bottom:2,left:5,right:5},
            font:{size:9,weight:'bold'},
            anchor:'center',
            align:function(ctx){return isBarHigher(ctx)?'bottom':'top';},
            offset:8,
            formatter:function(v){return v+' m/m';}
          }
        },
        {
          type:'line',
          label:'Promedio (+'+umbralMin+' min): '+fmt(Math.round(avg.dist))+' m',
          data:hist.map(function(){return Math.round(avg.dist);}),
          yAxisID:'y',
          borderColor:'rgba(46, 204, 113, 0.45)',
          borderWidth:1.5,
          borderDash:[6,4],
          pointRadius:0,
          fill:false,
          order:3,
          datalabels:{display:false}
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      layout:{
        padding:{top:32,right:16,left:10,bottom:6}
      },
      plugins:{
        legend:{labels:{color:cM()}},
        title:{display:true,text:'1. Distancia Total (m) y Corte en Distancia Relativa (m/min)',color:cT(),font:{family:'Plus Jakarta Sans',size:15}}
      },
      scales:{
        x:{ticks:{color:cM(),maxRotation:45},grid:{display:false}},
        y:{
          position:'left',
          beginAtZero:true,
          suggestedMax:Math.ceil((maxDistVal*1.25)/500)*500,
          title:{display:true,text:'Distancia total (m)',color:cM()},
          ticks:{color:cM(),callback:function(v){return v+' m';}},
          grid:{color:cG()}
        },
        y1:{
          position:'right',
          beginAtZero:true,
          suggestedMax:Math.ceil(maxDrelVal*1.35),
          title:{display:true,text:'Distancia relativa (m/min)',color:'#F1C40F'},
          ticks:{color:'#F1C40F',callback:function(v){return v+' m/min';}},
          grid:{display:false}
        }
      }
    }
  });

  // Gráfico 2: 16-18 hasta 25 km/h (HSR)
  var z16Cols=hist.map(function(h){return h.f===fecha?'#5BA3DE':'#5BA3DE55';});
  var z25Cols=hist.map(function(h){return h.f===fecha?'#E67E22':'#E67E2266';});
  var avgHSR = Math.round((avg.z1618||0) + (avg.z1825||0));
  var maxHsrVal = Math.max.apply(null,hd.map(function(h){return (h.z1618||0)+(h.z1825||0);}).concat([avgHSR,100]));
  charts.partG2=new Chart(document.getElementById('partG2_HSR').getContext('2d'),{
    plugins:[ChartDataLabels],
    type:'bar',
    data:{
      labels:histLabels,
      datasets:[
        {
          label:'16-18 km/h (m)',
          data:hd.map(function(h){return h.z1618||0;}),
          backgroundColor:z16Cols,
          borderRadius:3,
          stack:'hsrBars',
          datalabels:{
            color:'#FFFFFF',
            font:{size:9,weight:'bold'},
            formatter:function(v){return v>30?fmt(v):'';}
          }
        },
        {
          label:'18-25 km/h (m)',
          data:hd.map(function(h){return h.z1825||0;}),
          backgroundColor:z25Cols,
          borderRadius:3,
          stack:'hsrBars',
          datalabels:{
            color:'#FFFFFF',
            font:{size:9,weight:'bold'},
            formatter:function(v){return v>30?fmt(v):'';}
          }
        },
        {
          type:'line',
          label:'Promedio HSR (+'+umbralMin+' min): '+fmt(avgHSR)+' m',
          data:hist.map(function(){return avgHSR;}),
          borderColor:'rgba(241, 196, 15, 0.45)',
          borderWidth:1.5,
          borderDash:[6,4],
          pointRadius:0,
          fill:false,
          stack:'hsrLine',
          datalabels:{display:false}
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      layout:{
        padding:{top:25,right:14,left:10,bottom:6}
      },
      plugins:{
        legend:{labels:{color:cM()}},
        title:{display:true,text:'2. High Speed Running (HSR): 16-18 km/h hasta 25 km/h',color:cT(),font:{family:'Plus Jakarta Sans',size:15}}
      },
      scales:{
        x:{stacked:true,ticks:{color:cM(),maxRotation:45},grid:{display:false}},
        y:{
          stacked:true,
          beginAtZero:true,
          suggestedMax:Math.ceil((maxHsrVal*1.25)/50)*50,
          title:{display:true,text:'HSR acumulado (m)',color:cM()},
          ticks:{color:cM(),callback:function(v){return v+' m';}},
          grid:{color:cG()}
        }
      }
    }
  });

  // Gráfico 3: +25 km/h
  var s25Cols=hist.map(function(h){return h.f===fecha?'#2ECC71':'#2ECC7155';});
  var maxS25Val=Math.max.apply(null,hd.map(function(h){return h.s25||0;}).concat([avg.s25||0,50]));
  charts.partG3=new Chart(document.getElementById('partG3_S25').getContext('2d'),{
    plugins:[ChartDataLabels],
    type:'bar',
    data:{
      labels:histLabels,
      datasets:[
        {
          type:'bar',
          label:'Distancia >25 km/h (m)',
          data:hd.map(function(h){return h.s25||0;}),
          backgroundColor:s25Cols,
          borderRadius:4,
          datalabels:{
            color:cT(),
            font:{size:10,weight:'bold'},
            anchor:'end',
            align:'top',
            offset:4,
            formatter:function(v){return v>0?fmt(v)+' m':'0';}
          }
        },
        {
          type:'line',
          label:'Promedio >25 km/h (+'+umbralMin+' min): '+fmt(Math.round(avg.s25))+' m',
          data:hist.map(function(){return Math.round(avg.s25);}),
          borderColor:'rgba(241, 196, 15, 0.45)',
          borderWidth:1.5,
          borderDash:[6,4],
          pointRadius:0,
          fill:false,
          datalabels:{display:false}
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      layout:{
        padding:{top:25,right:14,left:10,bottom:6}
      },
      plugins:{
        legend:{display:true,labels:{color:cM()}},
        title:{display:true,text:'3. Distancia a +25 km/h (Sprint puro)',color:cT(),font:{family:'Plus Jakarta Sans',size:15}}
      },
      scales:{
        x:{ticks:{color:cM(),maxRotation:45},grid:{display:false}},
        y:{
          beginAtZero:true,
          suggestedMax:Math.ceil((maxS25Val*1.25)/20)*20,
          title:{display:true,text:'Distancia +25 km/h (m)',color:cM()},
          ticks:{color:cM(),callback:function(v){return v+' m';}},
          grid:{color:cG()}
        }
      }
    }
  });

  // Gráfico 4: Sprints y Top Speed (Mismo gráfico)
  var maxSprVal=Math.max.apply(null,hd.map(function(h){return h.sprints||0;}).concat([avg.sprints||0,10]));
  charts.partG4=new Chart(document.getElementById('partG4_TopCantSpr').getContext('2d'),{
    type:'bar',
    plugins:[ChartDataLabels],
    data:{
      labels:histLabels,
      datasets:[
        {
          type:'bar',
          label:'Cantidad de sprints',
          data:hd.map(function(h){return h.sprints;}),
          yAxisID:'y',
          backgroundColor:'#5BA3DE',
          borderRadius:4,
          order:2,
          datalabels:{
            color:cT(),
            font:{size:10,weight:'bold'},
            anchor:'end',
            align:'top',
            offset:4,
            formatter:function(v){return v;}
          }
        },
        {
          type:'line',
          label:'Top speed (km/h)',
          data:hd.map(function(h){return h.topSpeed;}),
          yAxisID:'y1',
          borderColor:'#E74C3C',
          backgroundColor:'#E74C3C',
          borderWidth:2,
          pointRadius:4,
          pointBackgroundColor:'#FFFFFF',
          tension:0.2,
          order:1,
          datalabels:{
            color:'#FFFFFF',
            backgroundColor:'#E74C3C',
            borderRadius:4,
            padding:{top:2,bottom:2,left:4,right:4},
            font:{size:9,weight:'bold'},
            anchor:'center',
            align:'top',
            offset:8,
            formatter:function(v){return v+' km/h';}
          }
        },
        {
          type:'line',
          label:'Prom. sprints (+'+umbralMin+' min): '+fmt(avg.sprints,1),
          data:hist.map(function(){return Math.round(avg.sprints*10)/10;}),
          yAxisID:'y',
          borderColor:'rgba(46, 204, 113, 0.45)',
          borderWidth:1.5,
          borderDash:[6,4],
          pointRadius:0,
          fill:false,
          order:3,
          datalabels:{display:false}
        },
        {
          type:'line',
          label:'Prom. top speed (+'+umbralMin+' min): '+fmt(avg.topSpeed,1)+' km/h',
          data:hist.map(function(){return Math.round(avg.topSpeed*10)/10;}),
          yAxisID:'y1',
          borderColor:'rgba(230, 126, 34, 0.45)',
          borderWidth:1.5,
          borderDash:[4,4],
          pointRadius:0,
          fill:false,
          order:4,
          datalabels:{display:false}
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      layout:{
        padding:{top:25,right:14,left:10,bottom:6}
      },
      plugins:{
        legend:{labels:{color:cM()}},
        title:{display:true,text:'4. Cantidad de Sprints y Top Speed por Partido (Promedios +'+umbralMin+' min)',color:cT(),font:{family:'Plus Jakarta Sans',size:15}}
      },
      scales:{
        x:{ticks:{color:cM(),maxRotation:45},grid:{display:false}},
        y:{
          position:'left',
          beginAtZero:true,
          suggestedMax:Math.ceil((maxSprVal*1.25)/5)*5,
          title:{display:true,text:'Cantidad de sprints',color:cM()},
          ticks:{color:cM(),precision:0},
          grid:{color:cG()}
        },
        y1:{
          position:'right',
          beginAtZero:false,
          suggestedMin:Math.max(0,Math.floor(Math.min.apply(null,hd.map(function(h){return h.topSpeed;}))-2)),
          suggestedMax:Math.ceil(Math.max.apply(null,hd.map(function(h){return h.topSpeed;}))+2),
          title:{display:true,text:'Top speed (km/h)',color:'#E74C3C'},
          ticks:{color:'#E74C3C',callback:function(v){return v+' km/h';}},
          grid:{display:false}
        }
      }
    }
  });
}

function renderEquipoDetail(fecha,minMin){
  EXPORT_RERENDER=function(){renderEquipoDetail(fecha,minMin);};
  minMin=minMin||0;
  var c=document.getElementById('partDetail');
  if(!fecha){c.innerHTML='<div class="obs">Selecciona un partido.</div>';return;}
  var ses=D.sesiones||[];var part=null;var m=rivalesMap();
  ses.forEach(function(s){if(s.fecha===fecha&&s.tipo.indexOf('Partido')>=0)part=s;});
  if(!part){c.innerHTML='<div class="obs">No se encontro el partido.</div>';return;}
  var js=part.jugadores.filter(function(j){return (j.min||0)>=minMin;});
  if(js.length===0){c.innerHTML='<div class="obs">Ningún jugador jugó '+minMin+'+ minutos en este partido.</div>';return;}
  var rival=m[fecha]||'';
  var distProm=Math.round(prom(js.map(function(j){return j.dist})));
  var hiProm=Math.round(prom(js.map(function(j){return j.hi})));
  var mphiProm=prom(js.map(function(j){return j.mphi||0}));
  var accProm=Math.round(prom(js.map(function(j){return j.acc||0})));
  var sprTotal=js.reduce(function(a,j){return a+(j.sprints||0)},0);
  var topJ=js.slice().sort(function(a,b){return b.topSpeed-a.topSpeed})[0];
  var maxDistJ=js.slice().sort(function(a,b){return b.dist-a.dist})[0];
  var filtroTxt=minMin>0?' · filtrado: '+minMin+'+ min':'';
  var html='<div style="margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'+
    '<div style="font-size:12.5px;color:var(--text);font-weight:600">'+
      'Resumen colectivo del partido: métricas medias, líderes del encuentro y tabla completa.'+
    '</div>'+
    '<button onclick="exportarPDF(\'Equipo '+fecha+'\')" style="background:var(--celeste);color:#ffffff;border:none;padding:9px 18px;border-radius:8px;font-family:var(--font-head);font-weight:800;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0, 43, 102,0.35)">'+
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'+
      'Exportar Informe de Partido (PDF)'+
    '</button>'+
  '</div>'+
    '<div id="partidoContent" style="padding:4px">'+
    '<div class="informe-head" style="margin-bottom:24px;padding-bottom:12px"><span class="nom partido-head-title" style="font-size:26px;font-weight:800">Equipo</span><span class="meta partido-head-meta" style="font-size:13px">Partido del '+fecha+(rival?' · vs '+rival:'')+' | '+js.length+' jugadores'+filtroTxt+'</span></div>'+
    '<div class="kpis">'+
    kpi(js.length,'Jugadores')+
    kpi(fmt(distProm)+'<small> m</small>','Dist. promedio')+
    kpi(fmt(hiProm)+'<small> m</small>','Alta int. prom.')+
    kpi(fmt(mphiProm,1)+'<small> %</small>','Prom. %PM (MPHI)')+
    kpi(sprTotal,'Sprints (total)')+
    kpi(accProm,'Acel. >2,5 prom.')+
    '<div class="kpi"><div class="v">'+topJ.topSpeed+'<small> km/h</small></div><div class="l">Top speed máx</div><div style="margin-top:6px;font-size:11px;color:var(--celeste);font-weight:600">'+topJ.jugador+'</div></div>'+
    '<div class="kpi"><div class="v">'+fmt(maxDistJ.dist)+'<small> m</small></div><div class="l">Más distancia</div><div style="margin-top:6px;font-size:11px;color:var(--celeste);font-weight:600">'+maxDistJ.jugador+'</div></div>'+
    '</div>'+
    '<div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr>'+
    '<th>Jugador</th><th>Min</th><th>D (m)</th><th>Drel (m)</th><th>MP>20</th><th>MP>55</th><th>MPHI %D</th><th>>16</th><th>15-18</th><th>18-25</th><th>>25</th><th>Acc>2,5</th><th>Dec>-2,5</th><th>Top</th><th>Sprint</th>'+
    '</tr></thead><tbody>'+
    js.slice().sort(function(a,b){return b.dist-a.dist}).map(function(j){return '<tr><td>'+j.jugador+'</td><td>'+Math.round(j.min)+'</td><td>'+fmt(j.dist)+'</td><td>'+fmt(j.drel,1)+'</td><td>'+fmt(j.mp20||0,1)+'</td><td>'+fmt(j.mp55||0,1)+'</td><td>'+fmt(j.mphi||0,1)+'</td><td>'+fmt(j.hi)+'</td><td>'+fmt(j.z1618||0)+'</td><td>'+fmt(j.z1825||0)+'</td><td>'+fmt(j.s25||0)+'</td><td>'+j.acc+'</td><td>'+j.dec+'</td><td>'+j.topSpeed+'</td><td>'+j.sprints+'</td></tr>';}).join('')+
    '</tbody></table></div>'+
    expl('Tabla con todos los jugadores del partido'+(minMin>0?' que jugaron '+minMin+'+ minutos':'')+' y sus métricas principales, ordenados por distancia recorrida.');
  var metricas=[
    {key:'dist',label:'Distancia total (m)',color:'#5BA3DE',ex:'Distancia total recorrida por cada jugador. Indica el volumen físico de cada uno en el partido.'},
    {key:'drel',label:'Distancia relativa (m/min)',color:'#5BA3DE',ex:'Metros por minuto de cada jugador. Mide la intensidad, independientemente de los minutos jugados.'},
    {key:'mphi',label:'% Potencia Metabólica (MPHI %)',color:'#9B59B6',ex:'Porcentaje de distancia a alta potencia metabólica (>20 W/kg).'},
    {key:'hi',label:'Alta intensidad 18+ (m)',color:'#F1C40F',ex:'Distancia recorrida a más de 18 km/h. Refleja el trabajo a alta velocidad de cada jugador.'},
    {key:'s25',label:'Distancia >25 km/h (m)',color:'#2ECC71',ex:'Distancia a más de 25 km/h (sprint puro). Muestra quiénes hicieron más esfuerzos de máxima velocidad.'},
    {key:'sprints',label:'Sprints',color:'#2ECC71',ex:'Cantidad de sprints de cada jugador. Indica el número de acciones explosivas en el partido.'},
    {key:'topSpeed',label:'Top speed (km/h)',color:'#5BA3DE',ex:'Velocidad máxima alcanzada por cada jugador en el partido.'},
    {key:'acc',label:'Aceleraciones >2,5',color:'#5BA3DE',ex:'Cantidad de aceleraciones intensas (>2,5 m/s). Parte de la carga neuromuscular.'},
    {key:'dec',label:'Desaceleraciones >2,5',color:'#E74C3C',ex:'Cantidad de frenadas intensas (>2,5 m/s). Suelen asociarse al desgaste muscular.'}
  ];
  metricas.forEach(function(mt,i){
    html+='<div class="card"><div class="chart-wrap" style="height:'+Math.max(260,js.length*22)+'px"><canvas id="eqChart'+i+'"></canvas></div></div>'+expl(mt.ex);
  });
  var sintE='<p>En el partido del <strong>'+fecha+'</strong>'+(rival?' frente a <strong>'+rival+'</strong>':'')+' '+(minMin>0?'(jugadores con '+minMin+'+ min) ':'')+'participaron <strong>'+js.length+'</strong> futbolistas con GPS. La distancia promedio fue de <strong>'+fmt(distProm)+' m</strong>.</p>'+
    '<p>El que más recorrió fue <strong>'+maxDistJ.jugador+'</strong> ('+fmt(maxDistJ.dist)+' m) y la mayor velocidad la alcanzó <strong>'+topJ.jugador+'</strong> ('+topJ.topSpeed+' km/h). El equipo sumó <strong>'+sprTotal+' sprints</strong> en total.</p>';
  html+=sintesis(sintE)+'</div>';
  c.innerHTML=html;
  Object.keys(charts).forEach(function(k){if(k.indexOf('eq')===0&&charts[k]){charts[k].destroy();delete charts[k];}});
  metricas.forEach(function(mt,i){
    var arr=js.slice().sort(function(a,b){return (b[mt.key]||0)-(a[mt.key]||0)});
    var ctx=document.getElementById('eqChart'+i).getContext('2d');
    charts['eq'+i]=new Chart(ctx,{plugins:[ChartDataLabels],type:'bar',data:{labels:arr.map(function(j){return j.jugador;}),datasets:[{label:mt.label,data:arr.map(function(j){return j[mt.key]||0;}),backgroundColor:mt.color,borderRadius:3}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:mt.label+' (mayor a menor)',color:cT(),font:{family:'Plus Jakarta Sans',size:13}},datalabels:{color:cT(),font:{size:10,weight:'bold'},anchor:'end',align:'end'}},scales:{x:{ticks:{color:cM()},grid:{color:cG()}},y:{ticks:{color:cM(),font:{size:11}}}}}});
  });
}
function renderComparaPartido(n1,f1,n2,f2){
  // Retrocompatibilidad si se llamase como (n1, n2, fecha)
  if(arguments.length===3 && typeof f1==='string' && typeof n2==='string'){
    var tempF=n2; n2=f1; f1=tempF; f2=tempF;
  }
  if(!f2) f2=f1;
  EXPORT_RERENDER=function(){renderComparaPartido(n1,f1,n2,f2);};
  var c=document.getElementById('partDetail');
  if(!n1||!f1||!n2||!f2){c.innerHTML='<div class="obs">Selecciona los partidos y jugadores a comparar.</div>';return;}
  if(n1===n2 && f1===f2){c.innerHTML='<div class="obs">Elegí dos jugadores distintos (o dos partidos distintos para el mismo jugador).</div>';return;}
  var ses=D.sesiones||[];var m=rivalesMap();var d1=null,d2=null;
  ses.forEach(function(s){
    if(s.tipo && s.tipo.indexOf('Partido')>=0){
      if(s.fecha===f1) s.jugadores.forEach(function(j){if(j.jugador===n1)d1=j;});
      if(s.fecha===f2) s.jugadores.forEach(function(j){if(j.jugador===n2)d2=j;});
    }
  });
  if(!d1){c.innerHTML='<div class="obs">No se encontraron datos de '+n1+' en el partido del '+f1+'.</div>';return;}
  if(!d2){c.innerHTML='<div class="obs">No se encontraron datos de '+n2+' en el partido del '+f2+'.</div>';return;}

  var rival1=m[f1]||'';
  var rival2=m[f2]||'';
  var mismoPartido=(f1===f2);
  var mismoJugador=(n1===n2);

  var rEtq1=rival1?(rival1.replace(/^vs\.?\s*/i,'')):(f1.split('/').slice(0,2).join('/'));
  var rEtq2=rival2?(rival2.replace(/^vs\.?\s*/i,'')):(f2.split('/').slice(0,2).join('/'));

  var lb1=n1+(mismoPartido?'':' ('+rEtq1+')');
  var lb2=n2+(mismoPartido?'':' ('+rEtq2+')');
  if(mismoJugador){
    lb1=n1+' ('+rEtq1+' · '+f1+')';
    lb2=n2+' ('+rEtq2+' · '+f2+')';
  }

  var filas=[
    {k:'min',l:'Minutos',u:' min'},{k:'dist',l:'Distancia',u:' m'},{k:'drel',l:'Dist. relativa',u:' m/min'},
    {k:'mphi',l:'% Potencia Met. (MPHI)',u:'%'},
    {k:'hi',l:'Alta int. 18+',u:' m'},{k:'z1618',l:'15-18 km/h',u:' m'},{k:'z1825',l:'18-25 km/h',u:' m'},
    {k:'s25',l:'>25 km/h',u:' m'},{k:'sprints',l:'Sprints',u:''},{k:'topSpeed',l:'Top speed',u:' km/h'},
    {k:'acc',l:'Acel. >2,5',u:''},{k:'dec',l:'Desac. >2,5',u:''}
  ];
  var filasHtml=filas.map(function(f){
    var v1=d1[f.k]||0,v2=d2[f.k]||0;
    var c1=v1>v2?'color:#5BA3DE;font-weight:700':'',c2=v2>v1?'color:#2ECC71;font-weight:700':'';
    return '<tr><td style="'+c1+'">'+fmt(v1)+f.u+'</td><td style="text-align:center;color:#ffffff;font-weight:600">'+f.l+'</td><td style="'+c2+'">'+fmt(v2)+f.u+'</td></tr>';
  }).join('');
  var g1=0,g2=0;filas.forEach(function(f){var v1=d1[f.k]||0,v2=d2[f.k]||0;if(v1>v2)g1++;else if(v2>v1)g2++;});

  var sintC='';
  if(mismoPartido){
    sintC+='<p>En el partido del <strong>'+f1+'</strong>'+(rival1?' (vs '+rival1+')':'')+', <strong>'+n1+'</strong> jugó '+Math.round(d1.min)+' min y <strong>'+n2+'</strong> '+Math.round(d2.min)+' min.</p>';
  } else {
    sintC+='<p>Comparando a <strong>'+n1+'</strong> en el partido del <strong>'+f1+'</strong>'+(rival1?' (vs '+rival1+')':'')+' ('+Math.round(d1.min)+' min) frente a <strong>'+n2+'</strong> en el partido del <strong>'+f2+'</strong>'+(rival2?' (vs '+rival2+')':'')+' ('+Math.round(d2.min)+' min).</p>';
  }
  var masDist=(d1.dist||0)>=(d2.dist||0)?lb1:lb2;
  var masVel=(d1.topSpeed||0)>=(d2.topSpeed||0)?lb1:lb2;
  sintC+='<p>En distancia, <strong>'+masDist+'</strong> recorrió más ('+fmt(Math.max(d1.dist||0,d2.dist||0))+' m vs '+fmt(Math.min(d1.dist||0,d2.dist||0))+' m). '+
    'La mayor velocidad la alcanzó <strong>'+masVel+'</strong> ('+Math.max(d1.topSpeed||0,d2.topSpeed||0)+' km/h).</p>'+
    '<p>Sumando todas las variables, <strong>'+lb1+'</strong> quedó por encima en '+g1+' y <strong>'+lb2+'</strong> en '+g2+'.</p>';

  var subMeta=mismoPartido?('Partido del '+f1+(rival1?' · vs '+rival1:'')):(etiquetaPartido(f1,m)+' ('+f1+') vs '+etiquetaPartido(f2,m)+' ('+f2+')');

  var html='<div style="margin-bottom:16px"><button onclick="exportarPDF(\''+(n1+' vs '+n2).replace(/'/g,'')+'\')" style="background:var(--celeste);color:#ffffff;border:none;padding:10px 20px;border-radius:10px;font-family:var(--font-head);font-weight:700;font-size:13px;cursor:pointer">Exportar PDF</button></div>'+
    '<div id="partidoContent" style="padding:4px">'+
    '<div class="informe-head" style="margin-bottom:24px;padding-bottom:16px"><span class="nom partido-head-title" style="font-size:26px;font-weight:800">'+lb1+' <span class="partido-head-vs">vs</span> '+lb2+'</span><span class="meta partido-head-meta" style="font-size:13px">'+subMeta+'</span></div>'+
    '<div class="obs" style="margin-bottom:16px"><span style="color:#5BA3DE;font-weight:700">'+lb1+'</span> (celeste) &nbsp;·&nbsp; <span style="color:#2ECC71;font-weight:700">'+lb2+'</span> (verde). En la tabla, el valor más alto de cada variable queda resaltado.</div>'+
    '<div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr><th style="color:#5BA3DE">'+lb1+'</th><th style="text-align:center">Variable</th><th style="color:#2ECC71">'+lb2+'</th></tr></thead><tbody>'+filasHtml+'</tbody></table></div>'+
    '<div class="card"><div class="chart-wrap" style="height:240px"><canvas id="cpDist"></canvas></div></div>'+
    expl('Distancia total recorrida por cada jugador.')+
    '<div class="card"><div class="chart-wrap" style="height:240px"><canvas id="cp1625"></canvas></div></div>'+
    expl('Distancia recorrida entre 15 y 25 km/h (suma de las zonas 15-18 y 18-25 km/h).')+
    '<div class="card"><div class="chart-wrap" style="height:240px"><canvas id="cpS25"></canvas></div></div>'+
    expl('Distancia recorrida a más de 25 km/h (sprint puro).')+
    '<div class="card"><div class="chart-wrap" style="height:240px"><canvas id="cpSpr"></canvas></div></div>'+
    expl('Cantidad de sprints.')+
    '<div class="card"><div class="chart-wrap" style="height:260px"><canvas id="cpAcc25"></canvas></div></div>'+
    expl('Aceleraciones y desaceleraciones de más de 2,5 m/s. Refleja la carga neuromuscular general.')+
    sintesis(sintC)+'</div>';
  c.innerHTML=html;

  ['cpD','cp16','cpS','cpSp','cpA25'].forEach(function(k){if(charts[k]){charts[k].destroy();delete charts[k];}});
  function bar2(id,titulo,v1,v2,fmtFn){
    var maxv=Math.max(v1,v2,1);
    return new Chart(document.getElementById(id).getContext('2d'),{plugins:[ChartDataLabels],type:'bar',data:{labels:[lb1,lb2],datasets:[
      {data:[v1,v2],backgroundColor:['#5BA3DE','#2ECC71'],borderRadius:4,maxBarThickness:60,barPercentage:0.5,categoryPercentage:0.7}
    ]},options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:20,right:16,left:16,bottom:5}},plugins:{legend:{display:false},title:{display:true,text:titulo,color:cT(),font:{family:'Plus Jakarta Sans',size:14},padding:{bottom:16}},datalabels:{color:cT(),font:{size:13,weight:'bold'},anchor:'end',align:'top',offset:4,formatter:fmtFn||function(v){return fmt(v);}}},scales:{x:{ticks:{color:cM(),maxRotation:25},grid:{display:false}},y:{beginAtZero:true,suggestedMax:maxv*1.18,ticks:{color:cM()},grid:{color:cG()}}}}});
  }
  var enM=function(v){return fmt(v)+' m';};
  charts.cpD=bar2('cpDist','Distancia total (m)',d1.dist,d2.dist,enM);
  charts.cp16=bar2('cp1625','15 a 25 km/h (m)',(d1.z1618||0)+(d1.z1825||0),(d2.z1618||0)+(d2.z1825||0),enM);
  charts.cpS=bar2('cpS25','Más de 25 km/h (m)',d1.s25||0,d2.s25||0,enM);
  charts.cpSpr=bar2('cpSpr','Sprints',d1.sprints,d2.sprints);
  var mA25=Math.max(d1.acc,d1.dec,d2.acc,d2.dec,1);
  charts.cpA25=new Chart(document.getElementById('cpAcc25').getContext('2d'),{plugins:[ChartDataLabels],type:'bar',data:{labels:['Aceleraciones','Desaceleraciones'],datasets:[
    {label:lb1,data:[d1.acc,d1.dec],backgroundColor:'#5BA3DE',borderRadius:3,maxBarThickness:55},
    {label:lb2,data:[d2.acc,d2.dec],backgroundColor:'#2ECC71',borderRadius:3,maxBarThickness:55}
  ]},options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:20,right:16,left:16,bottom:5}},plugins:{legend:{labels:{color:cM()}},title:{display:true,text:'Aceleraciones y desaceleraciones >2,5 m/s',color:cT(),font:{family:'Plus Jakarta Sans',size:14},padding:{bottom:16}},datalabels:{color:cT(),font:{size:12,weight:'bold'},anchor:'end',align:'top',offset:4}},scales:{x:{ticks:{color:cM()},grid:{display:false}},y:{beginAtZero:true,suggestedMax:mA25*1.18,ticks:{color:cM()},grid:{color:cG()}}}}});
}
// ─── COLECTIVO · PARTIDOS (con comparar 2 o 3 partidos) ───
function renderColPartido(p, embebido){
  var ses=(D.sesiones||[]).filter(function(s){return s.tipo.indexOf('Partido')>=0;});
  var cab = embebido ? '' : '<div class="panel-title">Colectivo · Partidos</div><div class="panel-sub">Promedia al equipo en cada partido de la temporada para ver cómo rindió el colectivo partido a partido. Mostramos los 5 gráficos clave fijos (distancia, 16-18, >25, sprints y acc+dec) más un gráfico configurable. También podés comparar 2 o 3 partidos lado a lado.</div>';
  if(!ses.length){p.innerHTML=cab+'<div class="obs">No hay partidos cargados todavía.</div>';return;}
  var m=rivalesMap();

  var mets=[
    {key:'dist',label:'Distancia total (m)',unit:' m'},
    {key:'drel',label:'Distancia relativa (m/min)',unit:' m/min'},
    {key:'mphi',label:'% Potencia Metabólica (MPHI %)',unit:'%'},
    {key:'z1618',label:'Zona 16-18 km/h (m)',unit:' m'},
    {key:'z1825',label:'Zona 18-25 km/h (m)',unit:' m'},
    {key:'hi',label:'Alta intensidad >16 km/h (m)',unit:' m'},
    {key:'s25',label:'Distancia >25 km/h (m)',unit:' m'},
    {key:'sprints',label:'Cantidad de Sprints',unit:''},
    {key:'acc',label:'Aceleraciones >2,5',unit:''},
    {key:'dec',label:'Desaceleraciones >2,5',unit:''},
    {key:'tension',label:'Acc + Dec (>2,5 m/s) sumadas',unit:''},
    {key:'topSpeed',label:'Top speed promedio (km/h)',unit:' km/h'}
  ];

  var fixedMets = [
    {key:'dist',   label:'Distancia total', unit:' m'},
    {key:'z1618',  label:'16 a 18 km/h', unit:' m'},
    {key:'s25',    label:'Más de 25 km/h', unit:' m'},
    {key:'sprints',label:'Cantidad de Sprints', unit:''},
    {key:'tension',label:'Acc + Dec (>2,5 m/s) sumadas', unit:''}
  ];

  var customMets = mets.filter(function(mt){
    return fixedMets.every(function(fm){ return fm.key !== mt.key; });
  });

  var etq=ses.map(function(s){return etiquetaPartido(s.fecha,m)+' ('+s.fecha+')';});

  p.innerHTML=cab+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;align-items:center">'+
    '<select class="sel" id="selCpModo"><option value="todos" selected>Todos los partidos</option><option value="comparar">Comparar 2 partidos</option><option value="comparar3">Comparar 3 partidos</option></select>'+
    '<span id="selCpPar" style="display:none;gap:10px;flex-wrap:wrap">'+
    '<select class="sel" id="selCpP1">'+etq.map(function(e,i){return '<option value="'+i+'"'+(i===ses.length-1?' selected':'')+'>'+e+'</option>'}).reverse().join('')+'</select>'+
    '<select class="sel" id="selCpP2">'+etq.map(function(e,i){return '<option value="'+i+'"'+(i===0?' selected':'')+'>'+e+'</option>'}).reverse().join('')+'</select>'+
    '<select class="sel" id="selCpP3" style="display:none">'+etq.map(function(e,i){return '<option value="'+i+'"'+(i===Math.floor(ses.length/2)?' selected':'')+'>'+e+'</option>'}).reverse().join('')+'</select>'+
    '</span></div><div id="cpartBody" style="margin-top:8px"></div>';

  function avgS(s,k){
    var js = (s.jugadores||[]).filter(function(j){ return (j.dist||0)>0; });
    if(!js.length) return 0;
    var a = js.map(function(j){
      if(k === 'tension') return (j.acc||0) + (j.dec||0);
      return j[k] || 0;
    });
    return a.reduce(function(x,y){return x+y;},0)/a.length;
  }

  function dibujar(){
    var modo=document.getElementById('selCpModo').value;
    var customKey = window._cpCustomKey || 'drel';
    var customMetObj = mets.filter(function(x){return x.key===customKey;})[0] || customMets[0] || mets[1];

    document.getElementById('selCpPar').style.display=(modo==='comparar'||modo==='comparar3')?'inline-flex':'none';
    document.getElementById('selCpP3').style.display=(modo==='comparar3')?'inline-block':'none';

    if(modo==='comparar'){
      var i1=+document.getElementById('selCpP1').value,i2=+document.getElementById('selCpP2').value;
      if(i1===i2){document.getElementById('cpartBody').innerHTML='<div class="obs">Elegí dos partidos distintos.</div>';return;}
      var s1=ses[i1],s2=ses[i2];
      var filas=mets.map(function(mm){
        var a1=avgS(s1,mm.key),a2=avgS(s2,mm.key),dd=mm.key==='topSpeed'?1:0;
        var c1=a1>=a2?'color:#5BA3DE;font-weight:700':'',c2=a2>a1?'color:#2ECC71;font-weight:700':'';
        return '<tr><td style="'+c1+'">'+fmt(a1,dd)+mm.unit+'</td><td style="text-align:center;color:#ffffff;font-weight:600">'+mm.label+'</td><td style="'+c2+'">'+fmt(a2,dd)+mm.unit+'</td></tr>';
      }).join('');
      var v1=avgS(s1,'dist'),v2=avgS(s2,'dist'),dif=v2>0?Math.round((v1-v2)/v2*100):0;
      var sint='<p>En distancia total: <strong>'+etiquetaPartido(s1.fecha,m)+'</strong> '+fmt(v1)+' m · <strong>'+etiquetaPartido(s2.fecha,m)+'</strong> '+fmt(v2)+' m.</p><p>'+(Math.abs(dif)<5?'Están muy parejos.':'<strong>'+(v1>=v2?etiquetaPartido(s1.fecha,m):etiquetaPartido(s2.fecha,m))+'</strong> fue '+Math.abs(dif)+'% más alto.')+'</p>';
      document.getElementById('cpartBody').innerHTML='<div class="card"><div class="chart-wrap" style="height:300px"><canvas id="cpartChart"></canvas></div></div><div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr><th style="color:#5BA3DE">'+etiquetaPartido(s1.fecha,m)+'</th><th style="text-align:center">Variable</th><th style="color:#2ECC71">'+etiquetaPartido(s2.fecha,m)+'</th></tr></thead><tbody>'+filas+'</tbody></table></div>'+sintesis(sint);
      if(charts.cpart) charts.cpart.destroy();
      charts.cpart=new Chart(document.getElementById('cpartChart').getContext('2d'),{plugins:[ChartDataLabels],type:'bar',data:{labels:[etiquetaPartido(s1.fecha,m),etiquetaPartido(s2.fecha,m)],datasets:[{data:[v1,v2],backgroundColor:['#5BA3DE','#2ECC71'],borderRadius:6,maxBarThickness:90}]},options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:24}},plugins:{legend:{display:false},title:{display:true,text:'Distancia total (m)',color:cT(),font:{family:'Plus Jakarta Sans',size:14}},datalabels:{color:cT(),font:{size:14,weight:'bold'},anchor:'end',align:'top',formatter:function(v){return fmt(v)+' m';}}},scales:{x:{ticks:{color:cM()},grid:{display:false}},y:{beginAtZero:true,suggestedMax:Math.max(v1,v2)*1.18,ticks:{color:cM()},grid:{color:cG()}}}}});
      return;
    }

    if(modo==='comparar3'){
      var j1=+document.getElementById('selCpP1').value,j2=+document.getElementById('selCpP2').value,j3=+document.getElementById('selCpP3').value;
      if(j1===j2||j1===j3||j2===j3){document.getElementById('cpartBody').innerHTML='<div class="obs">Elegí tres partidos distintos.</div>';return;}
      var t1=ses[j1],t2=ses[j2],t3=ses[j3];
      var cols=['#5BA3DE','#2ECC71','#F1C40F'];
      var lb1=etiquetaPartido(t1.fecha,m),lb2=etiquetaPartido(t2.fecha,m),lb3=etiquetaPartido(t3.fecha,m);
      var filas3=mets.map(function(mm){
        var a1=avgS(t1,mm.key),a2=avgS(t2,mm.key),a3=avgS(t3,mm.key),dd=mm.key==='topSpeed'?1:0;
        var mx=Math.max(a1,a2,a3);
        var c1=a1===mx?'color:'+cols[0]+';font-weight:700':'',c2=a2===mx?'color:'+cols[1]+';font-weight:700':'',c3=a3===mx?'color:'+cols[2]+';font-weight:700':'';
        return '<tr><td style="'+c1+'">'+fmt(a1,dd)+mm.unit+'</td><td style="'+c2+'">'+fmt(a2,dd)+mm.unit+'</td><td style="'+c3+'">'+fmt(a3,dd)+mm.unit+'</td><td style="text-align:center;color:#ffffff;font-weight:600">'+mm.label+'</td></tr>';
      }).join('');
      var w1=avgS(t1,'dist'),w2=avgS(t2,'dist'),w3=avgS(t3,'dist');
      var vals3=[{n:lb1,v:w1},{n:lb2,v:w2},{n:lb3,v:w3}].sort(function(a,b){return b.v-a.v;});
      var sint3='<p>En distancia: <strong>'+lb1+'</strong> '+fmt(w1)+' m · <strong>'+lb2+'</strong> '+fmt(w2)+' m · <strong>'+lb3+'</strong> '+fmt(w3)+' m.</p><p>Más alto: <strong>'+vals3[0].n+'</strong> ('+fmt(vals3[0].v)+' m). Más bajo: <strong>'+vals3[2].n+'</strong> ('+fmt(vals3[2].v)+' m).</p>';
      document.getElementById('cpartBody').innerHTML='<div class="card"><div class="chart-wrap" style="height:320px"><canvas id="cpartChart"></canvas></div></div><div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr><th style="color:'+cols[0]+'">'+lb1+'</th><th style="color:'+cols[1]+'">'+lb2+'</th><th style="color:'+cols[2]+'">'+lb3+'</th><th style="text-align:center">Variable</th></tr></thead><tbody>'+filas3+'</tbody></table></div>'+sintesis(sint3);
      if(charts.cpart) charts.cpart.destroy();
      charts.cpart=new Chart(document.getElementById('cpartChart').getContext('2d'),{plugins:[ChartDataLabels],type:'bar',data:{labels:[lb1,lb2,lb3],datasets:[{data:[w1,w2,w3],backgroundColor:cols,borderRadius:6,maxBarThickness:90}]},options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:24}},plugins:{legend:{display:false},title:{display:true,text:'Distancia total (m)',color:cT(),font:{family:'Plus Jakarta Sans',size:14}},datalabels:{color:cT(),font:{size:14,weight:'bold'},anchor:'end',align:'top',formatter:function(v){return fmt(v)+' m';}}},scales:{x:{ticks:{color:cM()},grid:{display:false}},y:{beginAtZero:true,suggestedMax:Math.max(w1,w2,w3)*1.18,ticks:{color:cM()},grid:{color:cG()}}}}});
      return;
    }

    // Modo "todos": 5 gráficos fijos + 1 personalizable
    var labels=[];
    ses.forEach(function(s){ labels.push(etiquetaPartido(s.fecha,m)); });

    var customOptsHtml = customMets.map(function(mt){
      return '<option value="' + mt.key + '"' + (mt.key === customMetObj.key ? ' selected' : '') + '>' + mt.label + '</option>';
    }).join('');

    // Un gráfico por ancho de pantalla, uno por uno
    var gridHtml = '<div style="display:flex;flex-direction:column;gap:20px;margin-bottom:24px">' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="cpChart_dist"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="cpChart_z1618"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="cpChart_s25"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="cpChart_sprints"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="cpChart_tension"></canvas></div></div>' +
      '<div class="card">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px">' +
          '<span style="font-size:13px;font-weight:800;color:#ffffff">Variable configurable:</span>' +
          '<select class="sel" id="selCpCustomVar" style="margin-bottom:0;padding:6px 12px;font-size:12px">' + customOptsHtml + '</select>' +
        '</div>' +
        '<div class="chart-wrap" style="height:300px"><canvas id="cpChart_custom"></canvas></div>' +
      '</div>' +
    '</div>';

    // Síntesis general en distancia
    var valsDist = ses.map(function(s){ return Math.round(avgS(s, 'dist') * 10) / 10; });
    var prDist = valsDist.reduce(function(a,b){ return a+b; }, 0) / valsDist.length;
    var maxi = Math.max.apply(null, valsDist), mini = Math.min.apply(null, valsDist);
    var sint = '<p>En <strong>distancia total</strong>, el promedio del colectivo en ' + ses.length + ' partidos disputados fue de <strong>' + fmt(prDist) + ' m</strong>. El valor más alto se registró vs <strong>' + labels[valsDist.indexOf(maxi)] + '</strong> (' + fmt(maxi) + ' m) y el más bajo vs <strong>' + labels[valsDist.indexOf(mini)] + '</strong> (' + fmt(mini) + ' m).</p>';

    document.getElementById('cpartBody').innerHTML = gridHtml + sintesis(sint);

    var selCustEl = document.getElementById('selCpCustomVar');
    if (selCustEl) {
      selCustEl.onchange = function(){
        window._cpCustomKey = this.value;
        dibujar();
      };
    }

    function dibujarBarPart(canvasId, mtObj, chartKey){
      var canvas = document.getElementById(canvasId);
      if(!canvas) return;
      var vals = ses.map(function(s){ return Math.round(avgS(s, mtObj.key) * 10) / 10; });
      var promAll = vals.reduce(function(a,b){ return a+b; }, 0) / (vals.length || 1);
      var promRound = Math.round(promAll * 10) / 10;

      if(charts[chartKey]){
        try{ charts[chartKey].destroy(); }catch(e){}
      }
      charts[chartKey] = new Chart(canvas.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'bar',
              label: mtObj.label,
              data: vals,
              backgroundColor: '#5BA3DE',
              borderRadius: 4,
              order: 2,
              datalabels: { color: cT(), font: { size: 10, weight: 'bold' }, anchor: 'end', align: 'top', formatter: function(v){ return fmt(v); } }
            },
            {
              type: 'line',
              label: 'Media (' + fmt(promRound) + (mtObj.unit||'') + ')',
              data: labels.map(function(){ return promRound; }),
              borderColor: '#F1C40F',
              borderDash: [6, 4],
              borderWidth: 2,
              pointRadius: 0,
              fill: false,
              order: 1,
              datalabels: { display: false }
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, labels: { color: cM(), filter: function(item){ return item.text.indexOf('Media') === 0; } } },
            title: { display: true, text: mtObj.label + ' — promedio por partido', color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' } }
          },
          scales: {
            x: { ticks: { color: cM(), maxRotation: 45, font: { size: 10 } } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true }
          }
        }
      });
    }

    fixedMets.forEach(function(fm){
      dibujarBarPart('cpChart_' + fm.key, fm, 'cp_' + fm.key);
    });
    dibujarBarPart('cpChart_custom', customMetObj, 'cp_custom');
  }

  EXPORT_RERENDER=dibujar;
  document.getElementById('selCpModo').onchange=dibujar;
  document.getElementById('selCpP1').onchange=dibujar;
  document.getElementById('selCpP2').onchange=dibujar;
  document.getElementById('selCpP3').onchange=dibujar;
  dibujar();
}
// ─── MICROCICLO (agrupa por número de microciclo con desglose real día por día) ───
function renderColEntrenamiento(p){
  var ses = (D.sesiones || []).slice();
  function pd(f){ const x=String(f||'').split('/'); return (x.length===3)?new Date(x[2],x[1]-1,x[0]):new Date(0); }
  function fmtN(v,d){ if(v==null||isNaN(v))return '—'; return v.toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d}); }

  // Agrupar sesiones ÚNICAMENTE por número de microciclo real de la planilla (sin fallbacks de fechas)
  var grupos = {};
  ses.forEach(function(s){
    var rawMc = String(s.micro || '').trim();
    if (!rawMc || /sem/i.test(rawMc) || /[\/\-]/.test(rawMc)) return;
    var mMatch = rawMc.match(/\d+/);
    if (!mMatch) return;
    var mcNum = parseInt(mMatch[0], 10);
    if (isNaN(mcNum) || mcNum <= 0 || mcNum > 200) return;
    var mcKey = String(mcNum);
    if (!grupos[mcKey]) grupos[mcKey] = { micro: mcKey, microNum: mcNum, sessions: [] };
    grupos[mcKey].sessions.push(s);
  });

  // Ordenar microciclos estrictamente por su número (1, 2, 3...)
  var micros = Object.keys(grupos).map(function(k){ return grupos[k]; }).sort(function(a, b){
    return a.microNum - b.microNum;
  });

  if(!micros.length){
    p.innerHTML = '<div class="panel-title">Microciclo</div><div class="obs">No hay microciclos numerados registrados en la planilla para esta categoría.</div>';
    return;
  }

  // Columnas completas para el desglose diario (idénticas a la planilla oficial y captura de pantalla)
  const COLS_DET = [
    {k:'dist',   lbl:'D (m)',        dec:0},
    {k:'drel',   lbl:'Drel (m/min)', dec:2},
    {k:'mp20',   lbl:'MP>20 W/Kg',   dec:2},
    {k:'mp55',   lbl:'MP>55 W/Kg',   dec:2},
    {k:'mphi',   lbl:'MPHI %D',      dec:2},
    {k:'hi',     lbl:'S>16 Km/h',    dec:2},
    {k:'z1618',  lbl:'16-18 Km/h',   dec:2},
    {k:'z1825',  lbl:'18-25 Km/h',   dec:2},
    {k:'s25',    lbl:'S>25 Km/h',    dec:2},
    {k:'acc',    lbl:'Acc>2,5 m/s',  dec:2},
    {k:'dec',    lbl:'Dec>-2,5 m/s', dec:2},
    {k:'accAlta',lbl:'Acc>4 m/s',    dec:1},
    {k:'decAlta',lbl:'Dec>-4 m/s',   dec:1},
    {k:'topSpeed',lbl:'Top speed',   dec:1},
    {k:'sprints',lbl:'Sprint',       dec:1}
  ];

  var dims = [
    {key:'dist',   label:'D (m) — Distancia total', unit:' m', dec:0},
    {key:'drel',   label:'Drel (m/min) — Distancia relativa', unit:' m/min', dec:1},
    {key:'mp20',   label:'MP > 20 W/Kg', unit:'', dec:1},
    {key:'mp55',   label:'MP > 55 W/Kg', unit:'', dec:1},
    {key:'mphi',   label:'MPHI %D', unit:'%', dec:1},
    {key:'hi',     label:'S > 16 Km/h (m)', unit:' m', dec:0},
    {key:'z1618',  label:'16-18 Km/h (m)', unit:' m', dec:0},
    {key:'z1825',  label:'18-25 Km/h (m)', unit:' m', dec:0},
    {key:'s25',    label:'S > 25 Km/h (m)', unit:' m', dec:0},
    {key:'acc',    label:'Acc > 2,5 m/s', unit:'', dec:0},
    {key:'dec',    label:'Dec > -2,5 m/s', unit:'', dec:0},
    {key:'accAlta',label:'Acc > 4 m/s', unit:'', dec:1},
    {key:'decAlta',label:'Dec > -4 m/s', unit:'', dec:1},
    {key:'topSpeed',label:'Top speed (km/h)', unit:' km/h', dec:1},
    {key:'sprints',label:'Sprint', unit:'', dec:1},
    {key:'tension',label:'Tensión (Acc + Dec >2,5)', unit:'', dec:0}
  ];

  // Promedio de una sesión para una variable
  function promSes(s, k){
    var js = (s.jugadores||[]).filter(function(j){ return (j.dist||0) > 0; });
    if(!js.length) return 0;
    if(k === 'topSpeed') return Math.max.apply(null, js.map(function(j){ return j.topSpeed || 0; }));
    var vals = js.map(function(j){ return (k==='tension' ? ((j.acc||0)+(j.dec||0)) : (j[k]||0)); });
    return vals.reduce(function(a,b){ return a+b; }, 0) / vals.length;
  }

  function sesFiltradas(mc, soloEntrenos){
    if (soloEntrenos) {
      var ent = mc.sessions.filter(function(s){ return String(s.tipo||'').indexOf('Partido') < 0; });
      return ent.length ? ent : mc.sessions;
    }
    return mc.sessions;
  }

  // Obtener todos los registros individuales (jugadores/celdas con datos) del microciclo
  function registrosMc(mc, soloEntrenos){
    var sList = sesFiltradas(mc, soloEntrenos);
    var regs = [];
    sList.forEach(function(s){
      (s.jugadores || []).forEach(function(j){
        if ((j.dist || 0) > 0) regs.push(j);
      });
    });
    return regs;
  }

  // Cálculo real del microciclo para la variable y modo
  function valorMicro(mc, dimKey, modo, soloEntrenos){
    var sList = sesFiltradas(mc, soloEntrenos);
    if(!sList.length) return 0;
    var regs = registrosMc(mc, soloEntrenos);
    var nRegs = regs.length;
    if(!nRegs) return 0;

    if(dimKey === 'topSpeed'){
      return Math.max.apply(null, regs.map(function(j){ return j.topSpeed || 0; }));
    }

    if(modo === 'media'){
      // Promedio del microciclo: total de celdas dividido la cantidad de registros (ej: 40 registros -> total / 40)
      var sumaTotalCeldas = regs.reduce(function(acc, j){
        var v = (dimKey === 'tension') ? ((j.acc || 0) + (j.dec || 0)) : (j[dimKey] || 0);
        return acc + (v || 0);
      }, 0);
      return sumaTotalCeldas / nRegs;
    }

    // Modo Acumulado: suma de promedios de las sesiones del microciclo
    return sList.reduce(function(acc, s){ return acc + promSes(s, dimKey); }, 0);
  }

  p.innerHTML = '<div class="panel-title">Microciclo</div>' +
    '<div class="panel-sub">Monitoreo de cargas agrupadas por microciclo de entrenamiento. Mostramos los 5 gráficos clave fijos (distancia, 16-18 km/h, >25 km/h, sprints y aceleraciones + desaceleraciones sumadas) más un gráfico personalizable. Abajo tenés el desglose exacto día por día de cualquier microciclo con todas sus métricas.</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center">' +
      '<select class="sel" id="selCeModo">' +
        '<option value="acum" selected>Acumulado del microciclo (suma)</option>' +
        '<option value="media">Media diaria (promedio por sesión)</option>' +
      '</select>' +
      '<select class="sel" id="selCeFiltro">' +
        '<option value="todos" selected>Microciclo completo (entrenamientos + partido)</option>' +
        '<option value="solo_entrenos">Solo entrenamientos</option>' +
      '</select>' +
      '<select class="sel" id="selCeN">' +
        '<option value="3">Últimos 3 microciclos</option>' +
        '<option value="5">Últimos 5 microciclos</option>' +
        '<option value="all" selected>Todos los microciclos</option>' +
      '</select>' +
    '</div>' +
    '<div id="ceBody"></div>';

  function dibujar(){
    var modo = document.getElementById('selCeModo').value;
    var filtro = document.getElementById('selCeFiltro').value;
    var soloEntrenos = (filtro === 'solo_entrenos');
    var nSel = document.getElementById('selCeN').value;
    var customKey = window._ceCustomDimKey || 'drel';

    var microsView = (nSel === 'all') ? micros : micros.slice(-parseInt(nSel, 10));
    var labels = microsView.map(function(mc){ return 'Micro ' + mc.micro; });
    var nSes = microsView.map(function(mc){ return sesFiltradas(mc, soloEntrenos).length; });

    var modoTxt = modo === 'acum' ? 'acumulado del equipo' : 'media por registro';
    var rangoTxt = (nSel === 'all') ? 'todos los microciclos' : 'los últimos ' + nSel + ' microciclos';

    var Ld = labels.slice().reverse(), Nd = nSes.slice().reverse();

    // Las 5 métricas fijas requeridas
    var fixedDims = [
      { key: 'dist',   label: 'Distancia total', unit: ' m' },
      { key: 'z1618',  label: '16 a 18 km/h', unit: ' m' },
      { key: 's25',    label: 'Más de 25 km/h', unit: ' m' },
      { key: 'sprints',label: 'Cantidad de Sprints', unit: '' },
      { key: 'tension',label: 'Acc + Dec (>2,5 m/s) sumadas', unit: '' }
    ];

    // Opciones para la variable personalizable
    var customDims = dims.filter(function(d){
      return fixedDims.every(function(fd){ return fd.key !== d.key; });
    });
    var customDimObj = dims.filter(function(d){ return d.key === customKey; })[0] || customDims[0] || dims[1];

    // Selector del microciclo a ver en detalle abajo (el último por defecto)
    var microSelId = window._ceMicroSelId || micros[micros.length - 1].micro;
    var mcActual = micros.filter(function(m){ return m.micro === microSelId; })[0] || micros[micros.length - 1];

    // Construcción de la tabla desglose para mcActual
    var idxMc = micros.indexOf(mcActual);
    var mcPrev = idxMc > 0 ? micros[idxMc - 1] : null;

    var sesMc = sesFiltradas(mcActual, soloEntrenos).slice().sort(function(a,b){ return pd(a.fecha) - pd(b.fecha); });
    function etqSes(s){
      var d = s.dia || '';
      if(!d && s.fecha){
        var dt = pd(s.fecha);
        var dn = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        d = dn[dt.getDay()];
      }
      var per = s.per ? ' (' + s.per + ')' : '';
      var nJ = (s.jugadores || []).filter(function(j){ return (j.dist||0) > 0; }).length;
      return (d ? d : s.fecha) + per + ' <span style="font-size:11px;color:var(--muted);font-weight:normal">(' + nJ + ' reg.)</span>';
    }

    var regsActual = registrosMc(mcActual, soloEntrenos);
    var nRegsActual = regsActual.length || 1;

    // Totales del microciclo seleccionado
    var acumMc = {};
    var nD = sesMc.length || 1;
    COLS_DET.forEach(function(c){
      var vv = sesMc.map(function(s){ return promSes(s, c.k); });
      if(c.k === 'topSpeed'){
        acumMc[c.k] = vv.length ? Math.max.apply(null, vv) : 0;
      } else {
        acumMc[c.k] = vv.reduce(function(a,b){ return a+b; }, 0);
      }
    });

    var mediaMc = {};
    COLS_DET.forEach(function(c){
      if(c.k === 'topSpeed'){
        mediaMc[c.k] = acumMc[c.k];
      } else {
        var totalCeldas = regsActual.reduce(function(acc, j){ return acc + (j[c.k] || 0); }, 0);
        mediaMc[c.k] = totalCeldas / nRegsActual;
      }
    });

    var mediaMcPrev = {};
    var hayMcPrev = false;
    if(mcPrev){
      var regsPrev = registrosMc(mcPrev, soloEntrenos);
      hayMcPrev = regsPrev.length > 0;
      var nRegsPrev = regsPrev.length || 1;
      var acumMcPrev = {};
      var sesPrev = sesFiltradas(mcPrev, soloEntrenos).slice().sort(function(a,b){ return pd(a.fecha) - pd(b.fecha); });
      COLS_DET.forEach(function(c){
        var vv = sesPrev.map(function(s){ return promSes(s, c.k); });
        if(c.k === 'topSpeed'){
          acumMcPrev[c.k] = vv.length ? Math.max.apply(null, vv) : 0;
          mediaMcPrev[c.k] = acumMcPrev[c.k];
        } else {
          acumMcPrev[c.k] = vv.reduce(function(a,b){ return a+b; }, 0);
          var totalCeldasPrev = regsPrev.reduce(function(acc, j){ return acc + (j[c.k] || 0); }, 0);
          mediaMcPrev[c.k] = totalCeldasPrev / nRegsPrev;
        }
      });
    }

    var headDet = '<tr><th style="position:sticky;left:0;background:var(--card2);z-index:2">DÍA</th>' +
      COLS_DET.map(function(c){ return '<th>' + c.lbl + '</th>'; }).join('') + '</tr>';

    var isLight = TEMA === 'light';
    var filasDet = sesMc.map(function(s){
      var esPart = String(s.tipo||'').indexOf('Partido') >= 0;
      var stPart = esPart ? (isLight ? 'color:#b45309;font-weight:700;' : 'color:#F1C40F;') : 'color:var(--text);';
      return '<tr><td style="position:sticky;left:0;background:var(--card);font-weight:600;' + stPart + '">' + etqSes(s) + '</td>' +
        COLS_DET.map(function(c){
          var v = promSes(s, c.k);
          return '<td>' + (v > 0 ? fmtN(v, c.dec) : '—') + '</td>';
        }).join('') + '</tr>';
    }).join('');

    function filaRes(label, obj, estilo, esPct){
      return '<tr style="'+estilo+'"><td style="position:sticky;left:0;'+estilo+';font-weight:700">'+label+'</td>' +
        COLS_DET.map(function(c){
          var v = obj[c.k];
          if(esPct) return '<td>' + (v!=null && !isNaN(v) ? (v>0?'+':'') + v.toFixed(1) + '%' : '—') + '</td>';
          return '<td>' + fmtN(v, c.dec) + '</td>';
        }).join('') + '</tr>';
    }

    var stAcum = isLight ? 'background:#ecfdf5;color:#065f46;border-top:2px solid #a7f3d0' : 'background:#0d2a1e;color:#7ee6a8';
    var stMedia = isLight ? 'background:#eff6ff;color:#1e40af;border-top:1px solid #bfdbfe' : 'background:#0d2438;color:#8ab4e8';
    var stPrev = isLight ? 'background:#f8fafc;color:#475569;border-top:1px solid #e2e8f0' : 'background:#1a1a2e;color:var(--muted)';
    var stDelta = isLight ? 'background:#faf5ff;color:#6b21a8;border-top:1px solid #e9d5ff' : 'background:#221a2e;color:#c9a0e8';

    var resumenDet = filaRes('Acumulado', acumMc, stAcum, false);
    resumenDet += filaRes('Media (' + nRegsActual + ' reg.)', mediaMc, stMedia, false);
    if(mcPrev && hayMcPrev){
      resumenDet += filaRes('Semana anterior', mediaMcPrev, stPrev, false);
      var delta = {};
      COLS_DET.forEach(function(c){
        var pVal = mediaMcPrev[c.k];
        delta[c.k] = (pVal > 0) ? ((mediaMc[c.k] - pVal) / pVal) * 100 : null;
      });
      resumenDet += filaRes('% vs semana ant.', delta, stDelta, true);
    }

    var selMicroDetOpts = micros.slice().reverse().map(function(m){
      var nS = sesFiltradas(m, soloEntrenos).length;
      var nR = registrosMc(m, soloEntrenos).length;
      return '<option value="' + m.micro + '"' + (m.micro === mcActual.micro ? ' selected' : '') + '>Microciclo ' + m.micro + ' (' + nR + ' registros · ' + nS + ' sesiones)</option>';
    }).join('');

    var customOptsHtml = customDims.map(function(d){
      return '<option value="' + d.key + '"' + (d.key === customDimObj.key ? ' selected' : '') + '>' + d.label + '</option>';
    }).join('');

    // Un gráfico por ancho de pantalla, uno por uno
    var chartsHtml = '<div style="display:flex;flex-direction:column;gap:20px;margin-bottom:24px">' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="ceChart_dist"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="ceChart_z1618"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="ceChart_s25"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="ceChart_sprints"></canvas></div></div>' +
      '<div class="card"><div class="chart-wrap" style="height:340px"><canvas id="ceChart_tension"></canvas></div></div>' +
      '<div class="card">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px">' +
          '<span style="font-size:13px;font-weight:800;color:#ffffff">Variable configurable:</span>' +
          '<select class="sel" id="selCeCustomDim" style="margin-bottom:0;padding:6px 12px;font-size:12px">' + customOptsHtml + '</select>' +
        '</div>' +
        '<div class="chart-wrap" style="height:300px"><canvas id="ceChart_custom"></canvas></div>' +
      '</div>' +
    '</div>';

    document.getElementById('ceBody').innerHTML =
      chartsHtml +
      '<div style="margin:24px 0 10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">' +
        '<div>' +
          '<div style="font-family:var(--font-head);letter-spacing:1px;color:#ffffff !important;font-size:15px;font-weight:800">Desglose diario · Microciclo ' + mcActual.micro + '</div>' +
          '<div style="font-size:12px;color:#ffffff !important;opacity:0.9;margin-top:2px">Detalle día por día de cada sesión (entrenamientos y partido) de este microciclo con todas sus métricas, acumulados y comparación con el microciclo anterior.</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:#ffffff !important;font-weight:700">Elegir microciclo:</span><select class="sel" id="selCeMicroDetalle" style="margin-bottom:0">' + selMicroDetOpts + '</select></div>' +
      '</div>' +
      '<div class="card" style="overflow-x:auto"><table class="data planilla-tbl"><thead>' + headDet + '</thead><tbody>' + filasDet + resumenDet + '</tbody></table></div>';

    document.getElementById('selCeMicroDetalle').onchange = function(){
      window._ceMicroSelId = this.value;
      dibujar();
    };

    var customSelEl = document.getElementById('selCeCustomDim');
    if (customSelEl) {
      customSelEl.onchange = function(){
        window._ceCustomDimKey = this.value;
        dibujar();
      };
    }

    // Helper para renderizar cada gráfico de microciclo
    function dibujarMcChart(canvasId, dObj, chartKey) {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return;
      var cVals = microsView.map(function(mc){ return Math.round(valorMicro(mc, dObj.key, modo, soloEntrenos) * 10) / 10; });
      var cValsAll = micros.map(function(mc){ return valorMicro(mc, dObj.key, modo, soloEntrenos); });
      var cProm = cValsAll.length ? cValsAll.reduce(function(a,b){ return a+b; }, 0) / cValsAll.length : 0;
      var cPromRound = Math.round(cProm * 10) / 10;
      var cLd = labels.slice().reverse();
      var cVd = cVals.slice().reverse();
      var cNd = nSes.slice().reverse();

      if (charts[chartKey]) {
        try { charts[chartKey].destroy(); } catch(e){}
      }
      charts[chartKey] = new Chart(canvas.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: cLd,
          datasets: [
            {
              type: 'bar',
              label: dObj.label,
              data: cVd,
              backgroundColor: '#5BA3DE',
              borderRadius: 4,
              order: 2,
              datalabels: { color: cT(), font: { size: 10, weight: 'bold' }, anchor: 'end', align: 'top', formatter: function(v){ return fmt(v); } }
            },
            {
              type: 'line',
              label: 'Media (' + fmt(cPromRound) + (dObj.unit||'') + ')',
              data: cLd.map(function(){ return cPromRound; }),
              borderColor: '#F1C40F',
              borderDash: [6, 4],
              borderWidth: 2,
              pointRadius: 0,
              fill: false,
              order: 1,
              datalabels: { display: false }
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, labels: { color: cM(), filter: function(item){ return item.text.indexOf('Media') === 0; } } },
            title: { display: true, text: dObj.label + ' — ' + modoTxt, color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' } },
            tooltip: { callbacks: { afterLabel: function(c){ return c.datasetIndex === 0 ? (cNd[c.dataIndex] + ' sesión(es)') : ''; } } }
          },
          scales: {
            x: { ticks: { color: cM(), font: { size: 10 } } },
            y: { ticks: { color: cM() }, grid: { color: cG() }, beginAtZero: true }
          }
        }
      });
    }

    // Dibujar los 5 gráficos fijos
    fixedDims.forEach(function(fd){
      dibujarMcChart('ceChart_' + fd.key, fd, 'ce_' + fd.key);
    });
    // Dibujar el gráfico configurable
    dibujarMcChart('ceChart_custom', customDimObj, 'ce_custom');
  }

  EXPORT_RERENDER = dibujar;
  document.getElementById('selCeModo').onchange = dibujar;
  document.getElementById('selCeFiltro').onchange = dibujar;
  document.getElementById('selCeN').onchange = dibujar;
  dibujar();
}

window.exportarMesoSolo = function(){
  var origTitle = typeof document !== 'undefined' ? document.title : '';
  if (typeof document !== 'undefined') {
    document.title = 'Integral Club - Mesociclo - ' + (typeof CAT_ACTUAL !== 'undefined' ? CAT_ACTUAL : '');
    document.body.classList.add('is-printing', 'print-only-meso');
  }
  if (typeof window.EXPORT_RERENDER === 'function') { try { window.EXPORT_RERENDER(true); } catch(e){} }
  setTimeout(function(){
    window.print();
    setTimeout(function(){
      if (typeof document !== 'undefined') {
        document.title = origTitle;
        document.body.classList.remove('is-printing', 'print-only-meso');
      }
    }, 600);
  }, 300);
};

window.exportarMesoCompSolo = function(){
  var origTitle = typeof document !== 'undefined' ? document.title : '';
  if (typeof document !== 'undefined') {
    document.title = 'Integral Club - Comparativa MD entre Categorias';
    document.body.classList.add('is-printing', 'print-only-meso-comp');
  }
  if (typeof window.EXPORT_RERENDER === 'function') { try { window.EXPORT_RERENDER(true); } catch(e){} }
  setTimeout(function(){
    window.print();
    setTimeout(function(){
      if (typeof document !== 'undefined') {
        document.title = origTitle;
        document.body.classList.remove('is-printing', 'print-only-meso-comp');
      }
    }, 600);
  }, 300);
};

// ─── MESO CICLO (línea + barras) ───
function renderMeso(p){
  var ses=(D.sesiones||[]).slice();
  var micros=[],cur={trainings:[],partido:null};
  ses.forEach(function(s){
    var esP = (s.tipo||'').indexOf('Partido')>=0 || /^MD$/i.test(String(s.per||s.dia||'').trim());
    if(esP){
      cur.partido=s;
      micros.push(cur);
      cur={trainings:[],partido:null};
    } else {
      cur.trainings.push(s);
    }
  });
  if(cur.trainings.length) micros.push(cur);
  micros=micros.filter(function(mc){return mc.trainings.length>0;});

  if(!micros.length){
    p.innerHTML='<div class="panel-title">Meso ciclo</div><div class="obs">No hay entrenamientos cargados todavía.</div>';
    return;
  }

  // Únicamente las 3 variables fijas solicitadas (sin selector dropdown de variables)
  var dims=[
    {key:'dist',label:'Distancia Total (m)',unit:' m',fn:function(j){return j.dist||0;}},
    {key:'tension',label:'Tensión (Acc + Dec >2,5)',unit:'',fn:function(j){return (j.acc||0)+(j.dec||0);}},
    {key:'s25',label:'Velocidad (>25 km/h)',unit:' m',fn:function(j){return j.s25||0;}}
  ];

  var activeDimKey = 'dist';

  p.innerHTML='<div class="meso-section-wrap">'+
    '<div class="panel-title">Meso ciclo</div>'+
    '<div class="panel-sub">Agrupa las semanas de trabajo en bloques de mesociclos para analizar la carga física en el mediano plazo (mensual o por fase de la temporada). Permite comparar la suma total acumulada o el promedio por sesión entre cada bloque de entrenamiento.</div>'+
    
    // Botones de dimensión + Botón exclusivo para Exportar Mesociclo
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+
        '<button type="button" class="btn-meso-dim active" id="btnMesoDist">DISTANCIA TOTAL</button>'+
        '<button type="button" class="btn-meso-dim" id="btnMesoTension">TENSIÓN (ACC + DEC > 2,5)</button>'+
        '<button type="button" class="btn-meso-dim" id="btnMesoVel">VELOCIDAD (> 25 KM/H)</button>'+
      '</div>'+
      '<button type="button" onclick="window.exportarMesoSolo()" class="btn-pdf-meso" style="background:var(--celeste);color:#ffffff;border:none;padding:9px 18px;border-radius:8px;font-family:var(--font-head);font-weight:800;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0, 43, 102,0.3)">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>'+
        'Exportar Mesociclo (PDF)'+
      '</button>'+
    '</div>'+

    '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;align-items:center">'+
      '<div style="display:flex;align-items:center;gap:6px">'+
        '<span style="font-size:12px;font-weight:800;color:#ffffff !important">Tamaño de bloque:</span>'+
        '<select class="sel" id="selMsN"><option value="3">Bloques de 3 semanas</option><option value="4" selected>Bloques de 4 semanas</option><option value="5">Bloques de 5 semanas</option></select>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px">'+
        '<span style="font-size:12px;font-weight:800;color:#ffffff !important">Modo de cálculo:</span>'+
        '<select class="sel" id="selMsModo"><option value="acum" selected>Acumulado (suma total del mesociclo)</option><option value="sesion">Promedio por sesión</option></select>'+
      '</div>'+
    '</div>'+
    '<div id="msBody"></div></div><div id="msCompSection"></div>';

  function syncPillButtons(k){
    activeDimKey = k;
    var bD = document.getElementById('btnMesoDist');
    var bT = document.getElementById('btnMesoTension');
    var bV = document.getElementById('btnMesoVel');
    if(bD) bD.classList.toggle('active', k === 'dist');
    if(bT) bT.classList.toggle('active', k === 'tension');
    if(bV) bV.classList.toggle('active', k === 's25');
  }

  document.getElementById('btnMesoDist').onclick = function(){ syncPillButtons('dist'); dibujar(); };
  document.getElementById('btnMesoTension').onclick = function(){ syncPillButtons('tension'); dibujar(); };
  document.getElementById('btnMesoVel').onclick = function(){ syncPillButtons('s25'); dibujar(); };

  function dibujar(){
    var dim=(dims.filter(function(d){return d.key===activeDimKey;})[0])||dims[0];
    var N=parseInt(document.getElementById('selMsN').value)||4;
    var modo=document.getElementById('selMsModo')?document.getElementById('selMsModo').value:'acum';

    // Agrupamiento de atrás hacia adelante: las semanas más recientes forman el último bloque completo
    var allMesos=[];
    for(var i = micros.length; i > 0; i -= N){
      var start = Math.max(0, i - N);
      allMesos.unshift(micros.slice(start, i));
    }

    // Mostrar siempre de atrás para adelante (los últimos 4 mesociclos: ej. si son 40, muestra 37, 38, 39, 40)
    var numToShow = 4;
    var mesos = allMesos.slice(-numToShow);
    var baseMesoNum = allMesos.length - mesos.length; // para numerar ej 37, 38, 39, 40

    function valorMeso(block){
      var nSes=0;
      if(modo==='sesion'){
        var arr=[];
        block.forEach(function(mc){mc.trainings.forEach(function(s){nSes++;(s.jugadores||[]).forEach(function(j){arr.push(dim.fn(j));});});});
        return {val:arr.length?arr.reduce(function(a,b){return a+b;},0)/arr.length:0,nBlock:block.length,nSes:nSes};
      }
      var byP={};
      block.forEach(function(mc){mc.trainings.forEach(function(s){nSes++;(s.jugadores||[]).forEach(function(j){byP[j.jugador]=(byP[j.jugador]||0)+dim.fn(j);});});});
      var sums=Object.keys(byP).map(function(k){return byP[k];});
      return {val:sums.length?sums.reduce(function(a,b){return a+b;},0)/sums.length:0,nBlock:block.length,nSes:nSes};
    }

    function fIni(block){var t=block[0].trainings[0];return t?t.fecha:'';}
    function fFin(block){var last=block[block.length-1];var fin=last.partido||last.trainings[last.trainings.length-1];return fin?fin.fecha:'';}

    var labels=[],vals=[],meta=[];
    mesos.forEach(function(block,i){
      var v=valorMeso(block);
      var mesoNum = baseMesoNum + i + 1;
      labels.push('Meso ' + mesoNum);
      vals.push(Math.round(v.val));
      meta.push({rango:fIni(block)+' → '+fFin(block),nBlock:v.nBlock,nSes:v.nSes,num:mesoNum});
    });

    var promedio=vals.length?Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length):0;
    var maxi=vals.length?Math.max.apply(null,vals):0;
    var mini=vals.length?Math.min.apply(null,vals):0;
    var iMax=vals.indexOf(maxi);
    var iMin=vals.indexOf(mini);

    var ult=vals[vals.length-1],prev=vals.length>1?vals[vals.length-2]:null;
    var difPct=(prev!=null&&prev>0)?Math.round((ult-prev)/prev*100):null;
    var tend=prev!=null?(ult>prev*1.05?'subió':ult<prev*0.95?'bajó':'se mantuvo'):'—';
    var modoTxt=modo==='sesion'?'promedio por sesión':'suma total acumulada';

    var badge;
    if(difPct!=null){
      var up=difPct>=0;
      badge='<div style="margin-top:6px;display:inline-block;padding:2px 10px;border-radius:6px;font-weight:700;font-size:12px;background:'+(up?'rgba(46,204,113,0.18)':'rgba(231,76,60,0.18)')+';color:'+(up?'#2ECC71':'#E74C3C')+'">'+(up?'▲ +':'▼ ')+difPct+'%</div>';
    } else {
      badge='<div style="margin-top:6px;font-size:12px;color:var(--muted)">primer mesociclo</div>';
    }

    var kpis='<div class="kpis">'+
      '<div class="kpi"><div class="v">'+fmt(Math.round(ult))+dim.unit+'</div><div class="l">Último mesociclo ('+labels[labels.length-1]+')</div>'+badge+'</div>'+
      '<div class="kpi"><div class="v">'+fmt(Math.round(promedio))+dim.unit+'</div><div class="l">Promedio entre mesos</div></div>'+
      '<div class="kpi"><div class="v">'+fmt(Math.round(maxi))+dim.unit+'</div><div class="l">Meso más cargado ('+labels[iMax]+')</div></div>'+
    '</div>';

    var sint='<p>En <strong>'+dim.label.toLowerCase()+'</strong> ('+modoTxt+', en bloques de '+N+' semanas), el último mesociclo (<strong>'+labels[labels.length-1]+'</strong>, '+meta[meta.length-1].rango+') dio <strong>'+fmt(Math.round(ult))+dim.unit+'</strong> y respecto al anterior <strong>'+tend+'</strong>'+(difPct!=null?' ('+(difPct>=0?'+':'')+difPct+'%)':'')+'.</p>'+
      '<p>El bloque más exigente fue <strong>'+labels[iMax]+'</strong> ('+fmt(Math.round(maxi))+dim.unit+') y el más liviano <strong>'+labels[iMin]+'</strong> ('+fmt(Math.round(mini))+dim.unit+'). Promedio entre mesos: <strong>'+fmt(Math.round(promedio))+dim.unit+'</strong>.</p>';

    var tabla='<div class="card" style="overflow-x:auto"><table class="data planilla-tbl"><thead><tr><th style="text-align:left">Mesociclo</th><th>Período de fechas</th><th>Entrenamientos</th><th>'+dim.label+'</th></tr></thead><tbody>'+
      mesos.map(function(block,i){
        var isUlt = (i === mesos.length - 1);
        var trSt = isUlt ? 'style="background:rgba(0, 43, 102,0.08);font-weight:700"' : '';
        return '<tr '+trSt+'><td style="text-align:left"><strong>'+labels[i]+(isUlt?' (Último)':'')+'</strong></td><td>'+meta[i].rango+'</td><td>'+meta[i].nSes+'</td><td>'+fmt(Math.round(vals[i]))+dim.unit+'</td></tr>';
      }).join('')+'</tbody></table></div>';

    document.getElementById('msBody').innerHTML=kpis+
      '<div class="grid-two-charts">'+
        '<div class="card"><div class="chart-wrap" style="height:320px"><canvas id="msLine"></canvas></div></div>'+
        '<div class="card"><div class="chart-wrap" style="height:320px"><canvas id="msBar"></canvas></div></div>'+
      '</div>'+
      tabla+sintesis(sint);

    if(charts.msL) { try{charts.msL.destroy();}catch(e){} }
    if(charts.msB) { try{charts.msB.destroy();}catch(e){} }

    charts.msL=new Chart(document.getElementById('msLine').getContext('2d'),{
      plugins:[ChartDataLabels],
      type:'line',
      data:{
        labels:labels,
        datasets:[{
          label:dim.label,
          data:vals,
          borderColor:'#002B66',
          backgroundColor:'#002B6622',
          fill:true,
          tension:.3,
          pointRadius:6,
          pointBackgroundColor:'#002B66'
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          title:{display:true,text:'Evolución por mesociclo — '+dim.label,color:cT(),font:{family:'Plus Jakarta Sans',size:13,weight:'700'}},
          datalabels:{color:cT(),font:{size:11,weight:'bold'},anchor:'end',align:'top',formatter:function(v){return fmt(Math.round(v));}},
          tooltip:{callbacks:{afterLabel:function(c){var mi=meta[c.dataIndex];return mi.rango+' · '+mi.nSes+' entrenamientos';}}}
        },
        scales:{
          x:{ticks:{color:cM()}},
          y:{ticks:{color:cM()},grid:{color:cG()},suggestedMax:(maxi*1.18)||undefined}
        }
      }
    });

    var cols=vals.map(function(v, i){return (i === vals.length - 1) ? '#002B66' : (v>=promedio?'#5BA3DE':'#94A3B8');});
    charts.msB=new Chart(document.getElementById('msBar').getContext('2d'),{
      plugins:[ChartDataLabels],
      type:'bar',
      data:{
        labels:labels,
        datasets:[{
          data:vals,
          backgroundColor:cols,
          borderRadius:4,
          maxBarThickness: 45
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          title:{display:true,text:'Comparación entre mesociclos — '+dim.label,color:cT(),font:{family:'Plus Jakarta Sans',size:13,weight:'700'}},
          datalabels:{color:cT(),font:{size:11,weight:'bold'},anchor:'end',align:'top',formatter:function(v){return fmt(Math.round(v));}},
          tooltip:{callbacks:{afterLabel:function(c){var mi=meta[c.dataIndex];return mi.rango+' · '+mi.nSes+' entrenamientos';}}}
        },
        scales:{
          x:{ticks:{color:cM()}},
          y:{beginAtZero:true,ticks:{color:cM()},grid:{color:cG()},suggestedMax:(maxi*1.18)||undefined}
        }
      }
    });
  }

  EXPORT_RERENDER = function(isPrint) {
    dibujar();
    if (typeof window !== 'undefined' && typeof window._rerenderMesoComp === 'function') {
      window._rerenderMesoComp();
    }
  };
  document.getElementById('selMsN').onchange = dibujar;
  document.getElementById('selMsModo').onchange = dibujar;
  dibujar();

  renderMesoMdComparativa(document.getElementById('msCompSection'));
}


// ─── COMPARATIVA DE DÍAS DE MICROCICLO (MD) ENTRE CATEGORÍAS ───
function renderMesoMdComparativa(container) {
  if (!container) return;

  var CATS = ['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena'];
  var CAT_COLORS = {
    'Cuarta': '#002B66',
    'Quinta': '#10B981',
    'Sexta': '#F59E0B',
    'Séptima': '#8B5CF6',
    'Octava': '#EC4899',
    'Novena': '#06B6D4'
  };

  var targetMDs = ['MD+2', 'MD-4', 'MD-3', 'MD-2', 'MD-1'];
  var targetMDLabels = {
    'MD+2': 'MD+2 (Recuperación)',
    'MD-4': 'MD-4 (Adquisición / Táctica)',
    'MD-3': 'MD-3 (Pico de Carga)',
    'MD-2': 'MD-2 (Velocidad / Reactividad)',
    'MD-1': 'MD-1 (Activación pre-partido)'
  };

  var currentRange = 'anual';
  var activeCats = new Set(['Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena']);
  var activeVarKey = 'dist';

  var VAR_DEFS = {
    'dist': { label: 'Distancia Total', unit: ' m', fn: function(j){ return j.dist || 0; }, dec: 0 },
    'drel': { label: 'Distancia Relativa', unit: ' m/min', fn: function(j){ return j.drel || 0; }, dec: 1 },
    'z1618': { label: '16 a 18 km/h', unit: ' m', fn: function(j){ return j.z1618 || 0; }, dec: 0 },
    's25': { label: 'Más de 25 km/h', unit: ' m', fn: function(j){ return j.s25 || 0; }, dec: 0 },
    'sprints': { label: 'Cantidad de sprints', unit: '', fn: function(j){ return j.sprints || 0; }, dec: 0 },
    'tension': { label: 'Tensión (Acc+Dec >2,5)', unit: '', fn: function(j){ return (j.acc || 0) + (j.dec || 0); }, dec: 0 },
    'accAlta': { label: 'Acc > 4 m/s', unit: '', fn: function(j){ return j.accAlta || 0; }, dec: 0 },
    'decAlta': { label: 'Dec > -4 m/s', unit: '', fn: function(j){ return j.decAlta || 0; }, dec: 0 },
    'top': { label: 'Top speed', unit: ' km/h', fn: function(j){ return j.top || 0; }, dec: 1, isMax: true }
  };

  function normMDDay(s) {
    if (!s) return null;
    var str = String(s).trim().toUpperCase();
    if (str.indexOf('PARTIDO') >= 0 || /^VS\b/i.test(str) || /^MD$/i.test(str)) return null;
    var m = str.match(/MD\s*([+-]?\s*\d+)/i);
    if (m) {
      var sign = m[1].includes('+') ? '+' : '-';
      var num = m[1].replace(/[^0-9]/g, '');
      return 'MD' + sign + num;
    }
    if (/MD\s*1\s*-/i.test(str) || /M\s*-\s*1/i.test(str)) return 'MD-1';
    return null;
  }

  function parseFechaStr(str) {
    if (!str) return null;
    var p = str.split('/');
    if (p.length === 3) return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
    return null;
  }

  if (typeof window !== 'undefined') {
    window._INTEGRAL_CAT_CACHE = window._INTEGRAL_CAT_CACHE || {};
    if (CAT_ACTUAL && D && D.sesiones) {
      window._INTEGRAL_CAT_CACHE[CAT_ACTUAL] = D;
    }
  }

  var html = '<div style="margin-top:36px;border-top:1.5px solid rgba(255,255,255,0.15);padding-top:24px;" id="mesoMdCompContainer">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:8px">' +
      '<div class="meso-comp-title" style="margin:0;font-family:var(--font-head);letter-spacing:1px;color:#ffffff !important;font-weight:800;font-size:16px">' +
        'Comparativa por Día de Microciclo (MD) entre Categorías' +
      '</div>' +
      '<button type="button" onclick="window.exportarMesoCompSolo()" class="btn-pdf-meso-comp" style="background:#10B981;color:#ffffff;border:none;padding:9px 18px;border-radius:8px;font-family:var(--font-head);font-weight:800;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(16,185,129,0.3)">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>' +
        'Exportar Comparativa MD entre Categorías (PDF)' +
      '</button>' +
    '</div>' +
    '<div class="meso-comp-subtitle" style="font-size:12.5px;margin-bottom:16px;line-height:1.5">' +
      'Evolución y comparación del promedio por sesión en cada día del microciclo (MD+2, MD-4, MD-3, MD-2, MD-1) entre divisiones de juveniles y menores.' +
    '</div>' +

    // Controls
    '<div class="meso-comp-controls" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<span style="font-size:12px;font-weight:800;color:#ffffff !important">Rango de fecha:</span>' +
        '<button type="button" class="btn-meso-range active" data-range="anual" id="btnMesoRAnual">Anual (Temporada completa)</button>' +
        '<button type="button" class="btn-meso-range" data-range="semestre" id="btnMesoRSem">Semestre (Últimos 6 meses)</button>' +
        '<button type="button" class="btn-meso-range" data-range="trimestre" id="btnMesoRTri">Trimestre (Últimos 3 meses)</button>' +
      '</div>' +

      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<span style="font-size:12px;font-weight:800;color:#ffffff !important">Comparar:</span>' +
        '<button type="button" class="btn-meso-cat-quick active" id="btnMesoCatAll">TODAS</button>' +
        '<button type="button" class="btn-meso-cat-quick" id="btnMesoCatJuv">Solo Juveniles (4ta a 6ta)</button>' +
        '<button type="button" class="btn-meso-cat-quick" id="btnMesoCatMen">Solo Menores (7ma a 9na)</button>' +
      '</div>' +

      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap" id="mesoCatPillsContainer">' +
        CATS.map(function(c) {
          var col = CAT_COLORS[c] || '#002B66';
          return '<button type="button" class="btn-meso-cat-pill active" data-cat="' + c + '" style="background:' + col + ';border-color:' + col + '">' +
            c +
          '</button>';
        }).join('') +
      '</div>' +

      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<span style="font-size:12px;font-weight:800;color:#ffffff !important">Variable a comparar:</span>' +
        '<select class="sel" id="selMesoCompVar" style="font-size:12px;padding:6px 12px;min-width:210px">' +
          Object.keys(VAR_DEFS).map(function(vk) {
            return '<option value="' + vk + '"' + (vk === activeVarKey ? ' selected' : '') + '>' + VAR_DEFS[vk].label + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
    '</div>' +

    '<div id="mesoCompLoadingIndicator" style="display:none;background:rgba(0, 43, 102,0.12);border:1px solid var(--celeste);color:var(--celeste);padding:10px 14px;border-radius:8px;font-size:12px;font-weight:700;margin-bottom:14px"></div>' +
    '<div class="meso-comp-print-meta print-comp-meta" id="mesoCompPrintMeta" style="display:none"></div>' +

    '<div class="card meso-comp-chart-card" style="padding:16px;margin-bottom:16px">' +
      '<div class="chart-wrap meso-comp-chart-wrap" style="height:370px">' +
        '<canvas id="mesoMdCompChart"></canvas>' +
      '</div>' +
    '</div>' +

    '<div class="card" id="mesoMdCompTableCard" style="overflow-x:auto;margin-bottom:16px"></div>' +
    '<div id="mesoMdCompSintesisCard"></div>' +
  '</div>';

  container.innerHTML = html;

  function updatePillStyles() {
    var pills = container.querySelectorAll('.btn-meso-cat-pill');
    pills.forEach(function(btn) {
      var cat = btn.getAttribute('data-cat');
      var isAct = activeCats.has(cat);
      var col = CAT_COLORS[cat] || '#002B66';
      btn.classList.toggle('active', isAct);
      btn.classList.toggle('inactive', !isAct);
      if (isAct) {
        btn.style.setProperty('background', col, 'important');
        btn.style.setProperty('border-color', col, 'important');
        btn.style.setProperty('color', '#ffffff', 'important');
      } else {
        btn.style.removeProperty('background');
        btn.style.removeProperty('border-color');
        btn.style.removeProperty('color');
      }
    });

    var bAll = document.getElementById('btnMesoCatAll');
    var bJuv = document.getElementById('btnMesoCatJuv');
    var bMen = document.getElementById('btnMesoCatMen');
    if (bAll) bAll.classList.toggle('active', activeCats.size === CATS.length);
    if (bJuv) bJuv.classList.toggle('active', activeCats.size === 3 && activeCats.has('Cuarta') && activeCats.has('Quinta') && activeCats.has('Sexta'));
    if (bMen) bMen.classList.toggle('active', activeCats.size === 3 && activeCats.has('Séptima') && activeCats.has('Octava') && activeCats.has('Novena'));
  }

  function dibujarCompChart() {
    var catsToDraw = CATS.filter(function(c) { return activeCats.has(c); });
    if (!catsToDraw.length) catsToDraw = CATS.slice();

    var varDef = VAR_DEFS[activeVarKey] || VAR_DEFS['dist'];

    // Encontrar fecha máxima entre las categorías cargadas
    var maxDate = new Date(2026, 0, 1);
    catsToDraw.forEach(function(c) {
      var cData = (window._INTEGRAL_CAT_CACHE && window._INTEGRAL_CAT_CACHE[c]) || {};
      (cData.sesiones || []).forEach(function(s) {
        if (!s.dateObj && s.fecha) s.dateObj = parseFechaStr(s.fecha);
        if (s.dateObj && s.dateObj > maxDate) maxDate = s.dateObj;
      });
    });

    var cutoff = currentRange === 'trimestre' ? new Date(maxDate.getTime() - 90 * 86400000)
               : currentRange === 'semestre' ? new Date(maxDate.getTime() - 180 * 86400000)
               : new Date(2000, 0, 1);

    var rangeLabel = currentRange === 'trimestre' ? 'Último Trimestre'
                   : currentRange === 'semestre' ? 'Último Semestre'
                   : 'Anual (Temporada)';

    var printMetaEl = document.getElementById('mesoCompPrintMeta');
    if (printMetaEl) {
      printMetaEl.textContent = 'Período: ' + rangeLabel + ' · Variable: ' + varDef.label + ' · Categorías: ' + catsToDraw.join(', ');
    }

    // Calcular promedios por MD y categoría
    var matrix = {};
    targetMDs.forEach(function(md) {
      matrix[md] = {};
      catsToDraw.forEach(function(cat) {
        var cData = (window._INTEGRAL_CAT_CACHE && window._INTEGRAL_CAT_CACHE[cat]) || {};
        var sesList = (cData.sesiones || []).filter(function(s) {
          if (!s.dateObj && s.fecha) s.dateObj = parseFechaStr(s.fecha);
          return s.dateObj && s.dateObj >= cutoff && normMDDay(s.per || s.dia) === md;
        });

        var sesAvgs = [];
        sesList.forEach(function(s) {
          var jugs = (s.jugadores || []).filter(function(j) { return (j.dist || 0) > 0; });
          if (jugs.length > 0) {
            if (varDef.isMax) {
              var mVal = Math.max.apply(null, jugs.map(function(j) { return varDef.fn(j); }));
              if (mVal > 0) sesAvgs.push(mVal);
            } else {
              var aVal = jugs.reduce(function(acc, j) { return acc + varDef.fn(j); }, 0) / jugs.length;
              if (aVal > 0) sesAvgs.push(aVal);
            }
          }
        });

        var finalAvg = sesAvgs.length ? (sesAvgs.reduce(function(a, b) { return a + b; }, 0) / sesAvgs.length) : 0;
        matrix[md][cat] = {
          val: finalAvg,
          nSes: sesAvgs.length
        };
      });
    });

    // Datasets para Chart.js
    var allVals = [];
    var datasets = catsToDraw.map(function(cat) {
      var col = CAT_COLORS[cat] || '#002B66';
      var dataVals = targetMDs.map(function(md) {
        var v = matrix[md][cat] ? matrix[md][cat].val : 0;
        if (v > 0) allVals.push(v);
        return varDef.dec > 0 ? (Math.round(v * 10) / 10) : Math.round(v);
      });

      return {
        label: cat,
        data: dataVals,
        backgroundColor: col,
        borderRadius: 4,
        maxBarThickness: 34,
        datalabels: {
          color: cT(),
          font: { size: 10, weight: 'bold' },
          anchor: 'end',
          align: 'top',
          offset: 2,
          formatter: function(v) {
            if (!v || v <= 0) return '';
            return (varDef.dec > 0 ? v : fmt(v)) + varDef.unit;
          }
        }
      };
    });

    var maxChartVal = allVals.length ? Math.max.apply(null, allVals) : 10;

    var cv = document.getElementById('mesoMdCompChart');
    if (cv) {
      if (charts.mesoMdComp) {
        try { charts.mesoMdComp.destroy(); } catch(e) {}
      }

      charts.mesoMdComp = new Chart(cv.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: targetMDs,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 16, bottom: 4, left: 6, right: 6 } },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: cT(),
                font: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
                padding: 14,
                boxWidth: 14,
                boxHeight: 14,
                borderRadius: 3,
                useBorderRadius: true
              }
            },
            title: {
              display: true,
              text: 'Comparativa de ' + varDef.label + ' por Día de Microciclo (' + rangeLabel + ')',
              color: cT(),
              font: { family: 'Plus Jakarta Sans', size: 13.5, weight: '800' },
              padding: { top: 4, bottom: 12 }
            },
            tooltip: {
              callbacks: {
                afterLabel: function(ctx) {
                  var cat = catsToDraw[ctx.datasetIndex];
                  var md = targetMDs[ctx.dataIndex];
                  var n = (matrix[md] && matrix[md][cat]) ? matrix[md][cat].nSes : 0;
                  return n + ' sesión(es) registrada(s)';
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: cT(), font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' } },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              ticks: { color: cM() },
              grid: { color: cG() },
              suggestedMax: Math.ceil(maxChartVal * 1.25)
            }
          }
        }
      });
    }

    // Tabla comparativa
    var tblCard = document.getElementById('mesoMdCompTableCard');
    if (tblCard) {
      var thead = '<thead><tr>' +
        '<th style="text-align:left">Día de Microciclo</th>' +
        catsToDraw.map(function(c) {
          var col = CAT_COLORS[c] || '#002B66';
          return '<th style="text-align:center;color:' + col + '">' + c + '</th>';
        }).join('') +
        '<th style="text-align:center;font-weight:800">Promedio General</th>' +
      '</tr></thead>';

      var dayMaxCat = {};
      var dayAverages = {};
      var globalMax = { val: 0, day: '', cat: '' };

      var rowsHtml = targetMDs.map(function(md) {
        var rowVals = [];
        var maxInRow = 0;
        var maxCatInRow = '';

        catsToDraw.forEach(function(c) {
          var v = matrix[md][c] ? matrix[md][c].val : 0;
          rowVals.push(v);
          if (v > maxInRow) {
            maxInRow = v;
            maxCatInRow = c;
          }
          if (v > globalMax.val) {
            globalMax.val = v;
            globalMax.day = md;
            globalMax.cat = c;
          }
        });

        var validVals = rowVals.filter(function(v) { return v > 0; });
        var rowAvg = validVals.length ? (validVals.reduce(function(a, b) { return a + b; }, 0) / validVals.length) : 0;
        dayAverages[md] = rowAvg;
        dayMaxCat[md] = { cat: maxCatInRow, val: maxInRow };

        var cells = catsToDraw.map(function(c) {
          var v = matrix[md][c] ? matrix[md][c].val : 0;
          var isTop = (v > 0 && v === maxInRow);
          var cellStyle = isTop ? 'style="font-weight:800;color:var(--celeste);background:rgba(0, 43, 102,0.08)"' : '';
          var displayV = v > 0 ? ((varDef.dec > 0 ? (Math.round(v * 10) / 10) : fmt(Math.round(v))) + varDef.unit) : '—';
          return '<td style="text-align:center" ' + cellStyle + '>' + displayV + '</td>';
        }).join('');

        var rowAvgDisplay = rowAvg > 0 ? ((varDef.dec > 0 ? (Math.round(rowAvg * 10) / 10) : fmt(Math.round(rowAvg))) + varDef.unit) : '—';

        return '<tr>' +
          '<td style="text-align:left"><strong>' + (targetMDLabels[md] || md) + '</strong></td>' +
          cells +
          '<td style="text-align:center;font-weight:800;color:var(--text)">' + rowAvgDisplay + '</td>' +
        '</tr>';
      }).join('');

      tblCard.innerHTML = '<table class="data planilla-tbl">' + thead + '<tbody>' + rowsHtml + '</tbody></table>';

      // Síntesis
      var sintCard = document.getElementById('mesoMdCompSintesisCard');
      if (sintCard) {
        var peakDay = 'MD-3';
        var peakDayAvg = dayAverages['MD-3'] || 0;
        targetMDs.forEach(function(m) {
          if ((dayAverages[m] || 0) > peakDayAvg) {
            peakDay = m;
            peakDayAvg = dayAverages[m];
          }
        });

        var peakCatObj = dayMaxCat[peakDay] || { cat: '—', val: 0 };
        var taperVal = dayAverages['MD-1'] || 0;
        var taperPct = peakDayAvg > 0 ? Math.round((1 - taperVal / peakDayAvg) * 100) : 0;

        var sintText = '<p>En <strong>' + varDef.label + '</strong> (' + rangeLabel + ', comparando ' + catsToDraw.length + ' categorías), el día con <strong>mayor carga media</strong> de la semana fue <strong>' + (targetMDLabels[peakDay] || peakDay) + '</strong> con un promedio general de <strong>' + (varDef.dec > 0 ? (Math.round(peakDayAvg * 10) / 10) : fmt(Math.round(peakDayAvg))) + varDef.unit + '</strong>, donde <strong>' + peakCatObj.cat + '</strong> alcanzó el registro más elevado (' + (varDef.dec > 0 ? (Math.round(peakCatObj.val * 10) / 10) : fmt(Math.round(peakCatObj.val))) + varDef.unit + ').</p>' +
          '<p>Hacia <strong>MD-1</strong> (activación previa a la competencia), la carga desciende un <strong>' + taperPct + '%</strong> respecto al pico, completando el proceso de descarga planificado para llegar en óptimas condiciones al partido.</p>';

        sintCard.innerHTML = sintesis(sintText);
      }
    }
  }

  window._rerenderMesoComp = dibujarCompChart;

  // Event Listeners: Rango de fecha
  var rangeBtns = container.querySelectorAll('.btn-meso-range');
  rangeBtns.forEach(function(btn) {
    btn.onclick = function() {
      currentRange = this.getAttribute('data-range') || 'anual';
      rangeBtns.forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      dibujarCompChart();
    };
  });

  // Event Listeners: Presets de categorías
  var bAll = document.getElementById('btnMesoCatAll');
  if (bAll) {
    bAll.onclick = function() {
      activeCats = new Set(CATS);
      updatePillStyles();
      dibujarCompChart();
    };
  }

  var bJuv = document.getElementById('btnMesoCatJuv');
  if (bJuv) {
    bJuv.onclick = function() {
      activeCats = new Set(['Cuarta', 'Quinta', 'Sexta']);
      updatePillStyles();
      dibujarCompChart();
    };
  }

  var bMen = document.getElementById('btnMesoCatMen');
  if (bMen) {
    bMen.onclick = function() {
      activeCats = new Set(['Séptima', 'Octava', 'Novena']);
      updatePillStyles();
      dibujarCompChart();
    };
  }

  // Event Listeners: Pastillas individuales
  var pills = container.querySelectorAll('.btn-meso-cat-pill');
  pills.forEach(function(btn) {
    btn.onclick = function() {
      var cat = this.getAttribute('data-cat');
      if (activeCats.has(cat)) {
        if (activeCats.size > 1) {
          activeCats.delete(cat);
        }
      } else {
        activeCats.add(cat);
      }
      updatePillStyles();
      dibujarCompChart();
    };
  });

  // Event Listener: Variable selector
  var selVar = document.getElementById('selMesoCompVar');
  if (selVar) {
    selVar.onchange = function() {
      activeVarKey = this.value || 'dist';
      dibujarCompChart();
    };
  }

  // Preloader de categorías faltantes
  function cargarCategoriasFaltantes() {
    var missing = CATS.filter(function(c) {
      return !window._INTEGRAL_CAT_CACHE || !window._INTEGRAL_CAT_CACHE[c];
    });

    if (!missing.length) {
      dibujarCompChart();
      return;
    }

    var ind = document.getElementById('mesoCompLoadingIndicator');
    if (ind) {
      ind.style.display = 'block';
      ind.textContent = 'Cargando datos de categorías para la comparativa (1 de ' + missing.length + ')...';
    }

    var done = 0;
    missing.forEach(function(c) {
      fetchCategoryData(c).then(function(res) {
        var payload = (res && res.data) ? res.data : res;
        window._INTEGRAL_CAT_CACHE[c] = payload;
        done++;
        if (ind) {
          if (done < missing.length) {
            ind.textContent = 'Cargando datos de categorías para la comparativa (' + (done + 1) + ' de ' + missing.length + ')...';
          } else {
            ind.style.display = 'none';
          }
        }
        dibujarCompChart();
      }).catch(function(e) {
        console.warn('Error al cargar datos de ' + c + ':', e);
        done++;
        if (done >= missing.length && ind) {
          ind.style.display = 'none';
        }
      });
    });

    // Dibujar inmediatamente con las categorías ya disponibles
    dibujarCompChart();
  }

  cargarCategoriasFaltantes();
}

// ─── SESIÓN COLECTIVA POR PUESTO ───
function renderSesionColectiva(p){
  var POS_LABELS={'A':'Arquero','DC':'Defensor central','LD':'Lateral derecho','LI':'Lateral izquierdo','DL':'Defensor lateral','VC':'Volante central','VM':'Volante mixto','VI':'Volante interno / Enganche','E':'Extremo','CD':'Centro delantero'};
  function posLabel(pp){return POS_LABELS[pp]||pp;}
  var ORDEN=['A','DC','LD','LI','DL','VC','VM','VI','E','CD'];
  var PALETA=['#5BA3DE','#2ECC71','#F1C40F','#E74C3C','#9B59B6','#E67E22','#1ABC9C','#E84393','#34495E','#16A085'];
  // Umbral de minutos por categoría — aplica SIEMPRE que la sesión sea un PARTIDO
  // (sea sesión puntual, "Todos los partidos" o dentro del comparador).
  // En ENTRENAMIENTOS entran todos, sin filtrar minutos.
  var UMBRAL_MIN_PART={'Séptima':70,'Sexta':70,'Quinta':70,'Cuarta':70,'Octava':60,'Novena':50,'Reserva':70,'Primera':70};
  var minPartPuesto=UMBRAL_MIN_PART[CAT_ACTUAL]!=null?UMBRAL_MIN_PART[CAT_ACTUAL]:0;
  var ses=D.sesiones||[];
  var hayPos=false; ses.forEach(function(s){s.jugadores.forEach(function(j){if(j.pos)hayPos=true;});});
  if(!hayPos){
    p.innerHTML='<div class="panel-title">Sesión colectiva por puesto</div>'+
      '<div class="obs">Todavía no hay posiciones cargadas. Verificá que la columna POSICIÓN de la matriz tenga los jugadores con su puesto (A, DC, LD, LI, VC, VM, E, CD).</div>';
    return;
  }
  var mets=[
    {key:'dist',label:'D (m)',short:'D',unit:' m',dec:0},
    {key:'drel',label:'Drel (m)',short:'Drel',unit:' m/min',dec:1},
    {key:'mp20',label:'MP > 20 W/Kg',short:'MP>20',unit:'',dec:1},
    {key:'mp55',label:'MP > 55 W/Kg',short:'MP>55',unit:'',dec:1},
    {key:'mphi',label:'MPHI %D',short:'MPHI',unit:'%',dec:1},
    {key:'hi',label:'S > 16 Km/h (m)',short:'>16',unit:' m',dec:0},
    {key:'z1618',label:'16-18 Km/h (m)',short:'16-18',unit:' m',dec:0},
    {key:'z1825',label:'18-25 Km/h (m)',short:'18-25',unit:' m',dec:0},
    {key:'s25',label:'S > 25 Km/h (m)',short:'>25',unit:' m',dec:0},
    {key:'acc',label:'Acc > 2,5 m/s',short:'Acc',unit:'',dec:1},
    {key:'dec',label:'Dec > -2,5 m/s',short:'Dec',unit:'',dec:1},
    {key:'accAlta',label:'Acc > 4 m/s',short:'Acc>4',unit:'',dec:1},
    {key:'decAlta',label:'Dec > -4 m/s',short:'Dec>4',unit:'',dec:1},
    {key:'topSpeed',label:'Top speed (km/h)',short:'Top',unit:' km/h',dec:1},
    {key:'sprints',label:'Sprint',short:'Spr',unit:'',dec:1}
  ];
  var mRiv=rivalesMap();
  // Lista de partidos (para el comparador)
  var partidos=[];
  ses.forEach(function(s,i){ if(s.tipo.indexOf('Partido')>=0) partidos.push({idx:i,fecha:s.fecha,label:etiquetaPartido(s.fecha,mRiv)}); });
  // Ámbito de la vista de arriba: sesión puntual / todos entrenos / todos partidos
  var optGenerales='<optgroup label="Ámbito general">'+
    '<option value="ent">Todos los entrenamientos</option>'+
    '<option value="par">Todos los partidos</option>'+
    '</optgroup>';
  var optPartidos='<optgroup label="Partidos individuales">'+
    partidos.slice().reverse().map(function(pp){
      return '<option value="s'+pp.idx+'">'+pp.label+' ('+pp.fecha+')</option>';
    }).join('')+
    '</optgroup>';
  var entrenos=[];
  ses.forEach(function(s,i){ if(s.tipo.indexOf('Partido')<0) entrenos.push({idx:i,s:s}); });
  var optEntrenos='<optgroup label="Entrenamientos individuales">'+
    entrenos.slice().reverse().map(function(ee){
      return '<option value="s'+ee.idx+'">'+ee.s.fecha+(ee.s.per?' · '+ee.s.per:'')+'</option>';
    }).join('')+
    '</optgroup>';
  var ambOpts=optGenerales+optPartidos+optEntrenos;

  // Listas desplegables de partidos para el comparador por puesto
  var partidosRev=partidos.slice().reverse();
  var optPartidosComp=function(selIdx){
    if(!partidosRev.length)return '<option value="">— sin partidos —</option>';
    return partidosRev.map(function(pp,i){
      var isSel=(selIdx!=null?pp.idx===selIdx:i===0);
      return '<option value="'+pp.idx+'"'+(isSel?' selected':'')+'>'+pp.label+' ('+pp.fecha+')</option>';
    }).join('');
  };
  var p1Default=partidosRev[0]?partidosRev[0].idx:null;
  var p2Default=partidosRev[1]?partidosRev[1].idx:p1Default;
  var p3Default=partidosRev[2]?partidosRev[2].idx:p1Default;

  p.innerHTML='<div class="panel-title">Sesión colectiva por puesto</div>'+
    '<div class="panel-sub">Promedia el rendimiento de cada puesto (arquero, defensores, laterales, volantes, extremos, delantero) y compara a cada jugador contra la media de su propio puesto. Muestra <strong>todas las variables</strong> a la vez, una debajo de la otra. Las posiciones se leen de la columna POSICIÓN de la matriz. En cualquier vista que sea un <strong>partido</strong> (sea puntual, «Todos los partidos» o el comparador) solo cuenta a los jugadores que disputaron <strong>'+(minPartPuesto>0?minPartPuesto+'+ min':'todos')+'</strong> (titulares o suplentes que jugaron lo suficiente); en <strong>entrenamientos</strong> entran todos sin filtrar minutos. Abajo se agrega el <strong>colectivo de todos los partidos por puesto</strong> y un <strong>comparador de partidos</strong> (el resultado aparece al final).</div>'+
    '<div class="sp-controls">'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">'+
        '<span style="font-family:var(--font-head);letter-spacing:1px;color:var(--celeste);font-size:12px">Sesión / ámbito</span>'+
        '<select class="sel" id="selSpAmb" style="margin-bottom:0">'+ambOpts+'</select>'+
      '</div>'+
      '<div style="border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:10px;background:var(--card)">'+
        '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:10px">'+
          '<span style="font-family:var(--font-head);letter-spacing:1px;color:var(--celeste);font-size:12px">Comparar partidos por puesto</span>'+
          '<select class="sel" id="selSpCompModo" style="margin-bottom:0">'+
            '<option value="comparar" selected>Comparar 2 partidos</option>'+
            '<option value="comparar3">Comparar 3 partidos</option>'+
            '<option value="todos">Todos los partidos</option>'+
          '</select>'+
          '<span style="font-size:11px;color:var(--muted)">(el resultado aparece al final del panel)</span>'+
        '</div>'+
        '<div id="spCompSelectores" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">'+
          '<div style="display:flex;gap:6px;align-items:center">'+
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#5BA3DE"></span>'+
            '<span style="font-size:12px;color:var(--celeste);font-weight:700">1º:</span>'+
            '<select class="sel" id="selSpP1" style="margin-bottom:0">'+optPartidosComp(p1Default)+'</select>'+
          '</div>'+
          '<div style="display:flex;gap:6px;align-items:center">'+
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2ECC71"></span>'+
            '<span style="font-size:12px;color:#2ECC71;font-weight:700">2º:</span>'+
            '<select class="sel" id="selSpP2" style="margin-bottom:0">'+optPartidosComp(p2Default)+'</select>'+
          '</div>'+
          '<div id="spP3Wrap" style="display:none;gap:6px;align-items:center">'+
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F1C40F"></span>'+
            '<span style="font-size:12px;color:#F1C40F;font-weight:700">3º:</span>'+
            '<select class="sel" id="selSpP3" style="margin-bottom:0">'+optPartidosComp(p3Default)+'</select>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div id="spBody"></div>'+
    '<div id="spAggBody"></div>'+
    '<div id="spCompBody"></div>';
  // Filas de una sesión / ámbito.
  // REGLA: si la sesión es PARTIDO se aplica el filtro de minPartPuesto (50/60/70 según categoría),
  //        sea sesión puntual, "Todos los partidos" o el comparador.
  //        En entrenamientos NO se filtra: entran todos tal cual.
  function filasDe(amb){
    var rows=[];
    function pushSes(s){
      var esP=s.tipo.indexOf('Partido')>=0;
      s.jugadores.forEach(function(j){
        // Filtro SIEMPRE que sea partido
        if(esP && minPartPuesto>0){
          var min=j.min||0;
          if(min<minPartPuesto) return;
        }
        rows.push(j);
      });
    }
    if(amb==='ent'){ses.forEach(function(s){if(s.tipo.indexOf('Partido')<0)pushSes(s);});}
    else if(amb==='par'){ses.forEach(function(s){if(s.tipo.indexOf('Partido')>=0)pushSes(s);});}
    else{var idx=parseInt(amb.slice(1),10);if(ses[idx])pushSes(ses[idx]);}
    return rows;
  }
  function ambLabel(amb){
    if(amb==='ent')return 'todos los entrenamientos';
    if(amb==='par')return 'todos los partidos (solo jugadores con '+minPartPuesto+'+ min)';
    var idx=parseInt(amb.slice(1),10);
    if(!ses[idx])return '';
    var esP=ses[idx].tipo.indexOf('Partido')>=0;
    return 'la sesión del '+ses[idx].fecha+(esP?' (partido · solo jugadores con '+minPartPuesto+'+ min)':'');
  }
  function avgArr(arr,key){return arr.length?arr.reduce(function(a,r){return a+(r[key]||0);},0)/arr.length:0;}
  function destruirPrefijo(pref){Object.keys(charts).forEach(function(k){if(k.indexOf(pref)===0&&charts[k]){try{charts[k].destroy();}catch(e){}delete charts[k];}});}
  // Agrega por jugador (promedio de sus sesiones en el ámbito) y agrupa por puesto
  function agrupar(rows){
    var byJug={};
    rows.forEach(function(j){var n=j.jugador;if(!byJug[n])byJug[n]={n:0,sum:{},pos:''};var o=byJug[n];o.n++;mets.forEach(function(mt){o.sum[mt.key]=(o.sum[mt.key]||0)+(j[mt.key]||0);});if(j.pos)o.pos=j.pos;});
    var jugs=Object.keys(byJug).map(function(n){var o=byJug[n],r={jugador:n,pos:o.pos||'(sin asignar)'};mets.forEach(function(mt){r[mt.key]=o.n?o.sum[mt.key]/o.n:0;});return r;});
    var grupos={};jugs.forEach(function(r){if(!grupos[r.pos])grupos[r.pos]=[];grupos[r.pos].push(r);});
    var puestos=Object.keys(grupos).sort(function(a,b){var ia=ORDEN.indexOf(a),ib=ORDEN.indexOf(b);if(ia<0)ia=99;if(ib<0)ib=99;return ia-ib;});
    return {grupos:grupos,puestos:puestos};
  }
  // Pinta un bloque completo (tabla resumen + un gráfico y una tabla por variable) en un contenedor
  function pintarBloque(container,rows,prefix,ambTexto,seccionTitulo){
    destruirPrefijo(prefix);
    var A=agrupar(rows),grupos=A.grupos,puestos=A.puestos;
    if(!rows.length){
      var htmlV='';
      if(seccionTitulo)htmlV+='<div class="sp-section-head">'+seccionTitulo+'</div>';
      htmlV+='<div class="obs">Ningún jugador cumple el filtro para «'+ambTexto+'». En partidos se exigen '+minPartPuesto+'+ minutos jugados.</div>';
      container.innerHTML=htmlV;
      return;
    }
    var thead='<tr><th>Puesto</th><th style="text-align:center">Jug.</th>'+mets.map(function(mt){return '<th style="text-align:center">'+mt.short+'</th>';}).join('')+'</tr>';
    var tbody=puestos.map(function(pp){var g=grupos[pp];return '<tr><td><strong>'+posLabel(pp)+'</strong></td><td style="text-align:center">'+g.length+'</td>'+mets.map(function(mt){return '<td style="text-align:center">'+fmt(avgArr(g,mt.key),mt.dec)+'</td>';}).join('')+'</tr>';}).join('');
    var html='';
    if(seccionTitulo)html+='<div class="sp-section-head">'+seccionTitulo+'</div>';
    html+='<div class="obs">Promedio de cada puesto en todas las variables ('+ambTexto+'):</div>'+
      '<div class="card" style="overflow-x:auto"><table class="data"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div>';
    var cbs=[];
    mets.forEach(function(mt,mi){
      var posAvg={};puestos.forEach(function(pp){posAvg[pp]=avgArr(grupos[pp],mt.key);});
      var labels=puestos.map(function(pp){return posLabel(pp);});
      var vals=puestos.map(function(pp){return Math.round(posAvg[pp]*10)/10;});
      var cid=prefix+'_c'+mi;
      var jugRows='';
      puestos.forEach(function(pp){
        grupos[pp].slice().sort(function(a,b){return (b[mt.key]||0)-(a[mt.key]||0);}).forEach(function(r){
          var v=r[mt.key]||0,base=posAvg[pp],dif=base>0?Math.round((v-base)/base*100):0;
          var col=Math.abs(dif)<8?'var(--muted)':dif>0?'#2ECC71':'#E74C3C';
          var fl=dif>0?'▲ +'+dif+'%':dif<0?'▼ '+dif+'%':'≈';
          jugRows+='<tr><td><strong>'+r.jugador+'</strong></td><td style="color:var(--muted)">'+posLabel(pp)+'</td><td style="text-align:center">'+fmt(v,mt.dec)+mt.unit+'</td><td style="text-align:center;color:'+col+';font-weight:600">'+fl+'</td></tr>';
        });
      });
      html+='<div class="sp-sheet">'+
        '<div class="sp-varhead">'+mt.label+' — '+ambTexto+'</div>'+
        '<div class="card"><div class="chart-wrap" style="height:'+Math.max(240,puestos.length*46)+'px"><canvas id="'+cid+'"></canvas></div></div>'+
        '<div class="obs">Cada jugador y su <strong>'+mt.label.toLowerCase()+'</strong> comparado con el promedio de su puesto:</div>'+
        '<div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr><th>Jugador</th><th>Puesto</th><th style="text-align:center">'+mt.short+'</th><th style="text-align:center">vs su puesto</th></tr></thead><tbody>'+jugRows+'</tbody></table></div>'+
      '</div>';
      cbs.push({cid:cid,labels:labels,vals:vals,mt:mt,key:prefix+mi});
    });
    var sinAsignar=grupos['(sin asignar)']?grupos['(sin asignar)'].length:0;
    var sint='<p>El <span style="color:#2ECC71;font-weight:600">▲</span> marca a los jugadores por encima del promedio de su puesto y el <span style="color:#E74C3C;font-weight:600">▼</span> por debajo, en cada variable.</p>';
    if(sinAsignar)sint+='<p>Hay <strong>'+sinAsignar+'</strong> jugador(es) sin puesto asignado. Cargá su posición en la columna POSICIÓN para que entren en la comparación.</p>';
    html+=sintesis(sint);
    container.innerHTML=html;
    cbs.forEach(function(cb){
      charts[cb.key]=new Chart(document.getElementById(cb.cid).getContext('2d'),{plugins:[ChartDataLabels],type:'bar',data:{labels:cb.labels,datasets:[{data:cb.vals,backgroundColor:'#5BA3DE',borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:cb.mt.label+' — promedio por puesto',color:cT(),font:{family:'Plus Jakarta Sans',size:14}},datalabels:{color:cT(),font:{size:11,weight:'bold'},anchor:'end',align:'end',formatter:function(v){return fmt(v,cb.mt.dec)+cb.mt.unit;}}},scales:{x:{ticks:{color:cM()},grid:{color:cG()}},y:{ticks:{color:cM(),font:{size:11}}}}}});
    });
  }
  function dibujarSesion(){var amb=document.getElementById('selSpAmb').value;pintarBloque(document.getElementById('spBody'),filasDe(amb),'spv',ambLabel(amb),null);}
  function dibujarAgg(){pintarBloque(document.getElementById('spAggBody'),filasDe('par'),'spa','todos los partidos (solo jugadores con '+minPartPuesto+'+ min)','Colectivo · Todos los partidos por puesto');}
  function dibujarComp(){
    destruirPrefijo('spc');
    var cont=document.getElementById('spCompBody');
    if(!partidos.length){
      cont.innerHTML='<div class="sp-section-head">Comparación de partidos por puesto</div><div class="obs">No hay partidos registrados todavía para esta categoría.</div>';
      return;
    }
    var modo=document.getElementById('selSpCompModo').value;
    var wrapP3=document.getElementById('spP3Wrap');
    var selControls=document.getElementById('spCompSelectores');
    if(modo==='todos'){
      if(selControls)selControls.style.display='none';
    } else {
      if(selControls)selControls.style.display='flex';
      if(wrapP3)wrapP3.style.display=(modo==='comparar3'?'flex':'none');
    }

    var sel=[];
    if(modo==='todos'){
      sel=partidos.slice();
    } else if(modo==='comparar3'){
      var i1=+document.getElementById('selSpP1').value;
      var i2=+document.getElementById('selSpP2').value;
      var i3=+document.getElementById('selSpP3').value;
      var p1=partidos.filter(function(x){return x.idx===i1;})[0];
      var p2=partidos.filter(function(x){return x.idx===i2;})[0];
      var p3=partidos.filter(function(x){return x.idx===i3;})[0];
      if(p1)sel.push(p1);
      if(p2&&p2!==p1)sel.push(p2);
      if(p3&&p3!==p1&&p3!==p2)sel.push(p3);
    } else {
      var i1=+document.getElementById('selSpP1').value;
      var i2=+document.getElementById('selSpP2').value;
      var p1=partidos.filter(function(x){return x.idx===i1;})[0];
      var p2=partidos.filter(function(x){return x.idx===i2;})[0];
      if(p1)sel.push(p1);
      if(p2&&p2!==p1)sel.push(p2);
    }

    if(sel.length<2){
      cont.innerHTML='<div class="sp-section-head">Comparación de partidos por puesto</div><div class="obs">Elegí al menos 2 partidos distintos en las listas desplegables para ver la comparación por puesto en todas las variables.</div>';
      return;
    }
    // En el comparador filasDe('s'+idx) ya aplica el filtro porque son partidos
    var perPart=sel.map(function(pp){return {pp:pp,A:agrupar(filasDe('s'+pp.idx))};});
    var setP={};perPart.forEach(function(o){o.A.puestos.forEach(function(q){if(q!=='(sin asignar)')setP[q]=1;});});
    var puestos=Object.keys(setP).sort(function(a,b){var ia=ORDEN.indexOf(a),ib=ORDEN.indexOf(b);if(ia<0)ia=99;if(ib<0)ib=99;return ia-ib;});
    var labels=puestos.map(function(q){return posLabel(q);});
    var html='<div class="sp-section-head">Comparación de partidos por puesto</div>'+
      '<div class="obs">Comparando '+sel.length+' partido(s): '+sel.map(function(o){return '<strong>'+o.label+'</strong>';}).join(' · ')+'. Se toman solo los jugadores que disputaron <strong>'+minPartPuesto+'+ min</strong>. Cada gráfico es una variable; para cada puesto se muestran las barras de un partido al lado del otro.</div>';
    var cbs=[];
    mets.forEach(function(mt,mi){
      var datasets=perPart.map(function(o,pi){
        var data=puestos.map(function(q){var g=o.A.grupos[q];return g?Math.round(avgArr(g,mt.key)*10)/10:null;});
        return {label:o.pp.label,data:data,backgroundColor:PALETA[pi%PALETA.length],borderRadius:3};
      });
      var cid='spc_c'+mi;
      html+='<div class="sp-sheet"><div class="sp-varhead">'+mt.label+' — comparación por puesto</div>'+
        '<div class="card"><div class="chart-wrap" style="height:'+Math.max(300,puestos.length*(26+sel.length*9)+70)+'px"><canvas id="'+cid+'"></canvas></div></div></div>';
      cbs.push({cid:cid,labels:labels,datasets:datasets,mt:mt,key:'spc'+mi});
    });
    cont.innerHTML=html;
    cbs.forEach(function(cb){
      charts[cb.key]=new Chart(document.getElementById(cb.cid).getContext('2d'),{type:'bar',data:{labels:cb.labels,datasets:cb.datasets},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:cM()}},title:{display:true,text:cb.mt.label+' — comparación por puesto',color:cT(),font:{family:'Plus Jakarta Sans',size:14}}},scales:{x:{ticks:{color:cM()},grid:{color:cG()}},y:{ticks:{color:cM(),font:{size:11}}}}}});
    });
  }
  function renderTodo(){dibujarSesion();dibujarAgg();dibujarComp();}
  EXPORT_RERENDER=renderTodo;
  document.getElementById('selSpAmb').onchange=dibujarSesion;
  document.getElementById('selSpCompModo').onchange=dibujarComp;
  document.getElementById('selSpP1').onchange=dibujarComp;
  document.getElementById('selSpP2').onchange=dibujarComp;
  document.getElementById('selSpP3').onchange=dibujarComp;
  dibujarSesion();dibujarAgg();dibujarComp();
}
// ─── ANÁLISIS DE SESIÓN (mapa de calor relativo al peor escenario del tipo de día) ───
function renderSesion(p){
  var ses=D.sesiones||[];
  function isPartido(s){
    if(!s) return false;
    if((s.tipo||'').indexOf('Partido')>=0) return true;
    var raw=String(s.per||s.dia||'').trim();
    if(/^MD$/i.test(raw)) return true;
    if(/^VS\b/i.test(raw)) return true;
    return false;
  }
  var entrenamientos=ses.filter(function(s){return !isPartido(s);});
  if(!entrenamientos.length){
    p.innerHTML='<div class="panel-title">Análisis de sesión</div><div class="obs">No hay sesiones de entrenamiento (sin partido) cargadas para esta categoría.</div>';
    return;
  }
  var mets=[
    {key:'dist',label:'D (m)',full:'Distancia total (m)',unit:' m',dec:0},
    {key:'drel',label:'Drel',full:'Distancia relativa (m/min)',unit:' m/min',dec:1},
    {key:'mp20',label:'MP>20',full:'MP > 20 W/Kg',unit:'',dec:1},
    {key:'mp55',label:'MP>55',full:'MP > 55 W/Kg',unit:'',dec:1},
    {key:'mphi',label:'MPHI%',full:'MPHI %D',unit:'%',dec:1},
    {key:'hi',label:'S>16',full:'S > 16 Km/h (m)',unit:' m',dec:0},
    {key:'z1618',label:'16-18',full:'16-18 Km/h (m)',unit:' m',dec:0},
    {key:'z1825',label:'18-25',full:'18-25 Km/h (m)',unit:' m',dec:0},
    {key:'s25',label:'S>25',full:'S > 25 Km/h (m)',unit:' m',dec:0},
    {key:'acc',label:'Acc>2.5',full:'Acc > 2,5 m/s',unit:'',dec:0},
    {key:'dec',label:'Dec>2.5',full:'Dec > -2,5 m/s',unit:'',dec:0},
    {key:'accAlta',label:'Acc>4',full:'Acc > 4 m/s',unit:'',dec:0},
    {key:'decAlta',label:'Dec>4',full:'Dec > -4 m/s',unit:'',dec:0},
    {key:'topSpeed',label:'Top',full:'Top speed (km/h)',unit:' km/h',dec:1},
    {key:'sprints',label:'Spr',full:'Sprint',unit:'',dec:0}
  ];
  function pdDate(f){var pts=(f||'').split('/');return new Date(+pts[2],+pts[1]-1,+pts[0]);}
  function lunesDe(f){var d=pdDate(f);var off=(d.getDay()+6)%7;d.setDate(d.getDate()-off);return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear();}
  function formatMd(per){
    if(!per) return 'Entrenamiento';
    var clean=String(per).trim().toUpperCase();
    var m=clean.match(/^MD\s*([+\-])\s*(\d+)$/i);
    if(m) return 'MD'+m[1]+m[2];
    return clean;
  }
  function grpKey(s){
    return String(s.per||'').trim().toUpperCase().replace(/\s+/g,'');
  }
  function teamAvg(s,key){var a=s.jugadores.map(function(j){return j[key]||0;});return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0;}

  // Pre-calcular mapeo de semana a microciclo conocido si alguna sesión de la semana lo tiene
  var semanaToMicro={};
  ses.forEach(function(s){
    var wk=lunesDe(s.fecha);
    var m=String(s.micro||'').match(/\d+/);
    if(m && !semanaToMicro[wk]){
      semanaToMicro[wk]=parseInt(m[0],10);
    }
  });

  // Agrupar entrenamientos por microciclo
  var microsMap={};
  entrenamientos.forEach(function(s){
    var origIdx=ses.indexOf(s);
    var wk=lunesDe(s.fecha);
    var mMatch=String(s.micro||'').match(/\d+/);
    var mcNum=mMatch?parseInt(mMatch[0],10):(semanaToMicro[wk]||null);
    var mcId=mcNum?('mc_'+mcNum):('sem_'+wk);
    var mcLabel=mcNum?('Microciclo '+mcNum):('Semana '+wk);

    if(!microsMap[mcId]){
      microsMap[mcId]={
        id:mcId,
        label:mcLabel,
        mcNum:mcNum||0,
        refDate:pdDate(s.fecha),
        dias:[]
      };
    }
    microsMap[mcId].dias.push({
      idx:origIdx,
      session:s,
      dateObj:pdDate(s.fecha),
      label:formatMd(s.per)+' ('+s.fecha+')'
    });
  });

  // Ordenar microciclos: numéricos de mayor a menor (más nuevo primero)
  var microList=Object.values(microsMap).sort(function(a,b){
    if(a.mcNum>0 && b.mcNum>0) return b.mcNum-a.mcNum;
    if(a.mcNum>0 && b.mcNum<=0) return -1;
    if(a.mcNum<=0 && b.mcNum>0) return 1;
    return b.refDate-a.refDate;
  });

  // Ordenar los días dentro de cada microciclo cronológicamente (ej: MD+2, MD-4, MD-3, MD-2, MD-1)
  microList.forEach(function(mc){
    mc.dias.sort(function(a,b){return a.dateObj-b.dateObj;});
  });

  p.innerHTML='<div class="panel-title">Análisis de sesión</div>'+
    '<div class="panel-sub">Muestra todo lo que pasó en un día de trabajo: cuánto hizo cada jugador en un mapa de calor donde cuanto más oscura la celda, más cerca estuvo del "peor escenario" (el mejor promedio histórico del equipo para ese tipo de día). Así se ve quién se exigió al máximo y quién quedó lejos. Sirve para controlar que la sesión haya tenido la intensidad planificada.</div>'+
    '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px;background:var(--card);padding:14px 16px;border-radius:10px;border:1px solid var(--border);box-shadow:var(--shadow-card)">'+
      '<div style="display:flex;flex-direction:column;gap:5px">'+
        '<label for="selMicro" class="sesion-filter-label" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Microciclo</label>'+
        '<select class="sel" id="selMicro" style="min-width:160px;font-weight:600">'+
          microList.map(function(mc){return '<option value="'+mc.id+'">'+mc.label+'</option>';}).join('')+
        '</select>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:5px">'+
        '<label for="selDia" class="sesion-filter-label" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Día de entrenamiento (sin partido)</label>'+
        '<select class="sel" id="selDia" style="min-width:190px;font-weight:600"></select>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:5px">'+
        '<label for="selMetSes" class="sesion-filter-label" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Variable métrica</label>'+
        '<select class="sel" id="selMetSes" style="min-width:180px">'+
          mets.map(function(mt){return '<option value="'+mt.key+'">'+mt.full+'</option>';}).join('')+
        '</select>'+
      '</div>'+
    '</div>'+
    '<div id="sesBody"></div>';

  var selMicro=document.getElementById('selMicro');
  var selDia=document.getElementById('selDia');
  var selMetSes=document.getElementById('selMetSes');

  function actualizarDias(){
    var curMcId=selMicro.value;
    var curMc=microsMap[curMcId];
    if(!curMc || !curMc.dias.length) return;
    selDia.innerHTML=curMc.dias.map(function(d){
      return '<option value="'+d.idx+'">'+d.label+'</option>';
    }).join('');
    selDia.selectedIndex=0;
    dibujar();
  }

  function dibujar(){
    var sesIdx=+selDia.value;
    var s=ses[sesIdx];
    if(!s) return;
    var metKey=selMetSes.value,metSel=mets.filter(function(x){return x.key===metKey;})[0];
    var js=s.jugadores.slice().sort(function(a,b){return (b.dist||0)-(a.dist||0);});
    var codigo=formatMd(s.per);
    var grupo=entrenamientos.filter(function(x){return grpKey(x)===grpKey(s);});
    var peorMap={};
    mets.forEach(function(mt){
      var best=0,bestFecha='';
      grupo.forEach(function(x){
        var av=teamAvg(x,mt.key);
        if(av>best){best=av;bestFecha=x.fecha;}
      });
      peorMap[mt.key]={val:best,fecha:bestFecha};
    });
    var txtCell=(TEMA==='light')?'#06121E':'#fff',txtPeor=(TEMA==='light')?'#6b5300':'#F1C40F';
    function cellStyle(mt,v){
      var ref=peorMap[mt.key].val;
      var t=ref>0?v/ref:0;
      if(t>1)t=1;
      var op=(0.10+t*0.75).toFixed(2);
      return 'background:rgba(91,163,222,'+op+');color:'+txtCell+';text-align:center';
    }
    var head='<tr><th>Jugador</th>'+mets.map(function(mt){return '<th style="text-align:center">'+mt.label+'</th>';}).join('')+'</tr>';
    var body=js.map(function(j){
      return '<tr><td><strong>'+j.jugador+'</strong></td>'+mets.map(function(mt){
        var v=j[mt.key]||0;
        var ref=peorMap[mt.key].val;
        var pc=ref>0?Math.round(v/ref*100):0;
        return '<td style="'+cellStyle(mt,v)+'" title="'+pc+'% del peor escenario">'+fmt(v,mt.dec)+'</td>';
      }).join('')+'</tr>';
    }).join('');
    var peorRow='<tr style="border-top:2px solid var(--celeste)"><td><strong style="color:var(--celeste)">Peor escenario · '+codigo+'</strong></td>'+mets.map(function(mt){
      return '<td style="background:rgba(241,196,15,0.18);color:'+txtPeor+';text-align:center;font-weight:700">'+fmt(peorMap[mt.key].val,mt.dec)+'</td>';
    }).join('')+'</tr>';
    var fechaRow='<tr><td style="color:var(--muted);font-size:10px;white-space:nowrap">(mejor día)</td>'+mets.map(function(mt){
      var f = peorMap[mt.key].fecha || '';
      var shortF = f ? f.split('/').slice(0, 2).join('/') : '—';
      return '<td style="text-align:center;color:var(--muted);font-size:9px;padding:3px 1px" title="Fecha: '+f+'">'+shortF+'</td>';
    }).join('')+'</tr>';
    var arr=js.slice().sort(function(a,b){return (b[metKey]||0)-(a[metKey]||0);});
    var n=js.length,topPlayer=js[0]||{jugador:'—',dist:0};
    var avgHoy=teamAvg(s,metKey),peorSel=peorMap[metKey].val,peorFecha=peorMap[metKey].fecha;
    var pctVsPeor=peorSel>0?Math.round(avgHoy/peorSel*100):0;
    var mcActual=microsMap[selMicro.value]||{label:'Microciclo'};
    var sint='<p>En la sesión del <strong>'+s.fecha+'</strong> (<strong>'+mcActual.label+' · '+codigo+'</strong>) participaron <strong>'+n+'</strong> jugadores. El que más recorrió fue <strong>'+topPlayer.jugador+'</strong> ('+fmt(topPlayer.dist)+' m).</p>'+
      '<p>El <strong>Peor escenario</strong> es el mejor promedio de equipo entre los <strong>'+grupo.length+'</strong> día(s) de tipo <strong>'+codigo+'</strong> de la temporada (sin contar partidos). El color de cada celda muestra qué tan cerca está ese jugador de ese techo.</p>'+
      '<p>En <strong>'+metSel.full.toLowerCase()+'</strong>, hoy el equipo promedió <strong>'+fmt(avgHoy,metSel.dec)+'</strong>: un <strong>'+pctVsPeor+'%</strong> del peor escenario de los '+codigo+' ('+fmt(peorSel,metSel.dec)+(peorFecha?', el '+peorFecha:'')+').</p>';
    // Fila peor escenario más compacta para que entre en 14 pulgadas
    var peorRow='<tr style="border-top:2px solid var(--celeste)"><td style="white-space:nowrap"><strong style="color:var(--celeste);font-size:10px">Peor · '+codigo+'</strong></td>'+mets.map(function(mt){
      return '<td style="background:rgba(241,196,15,0.18);color:'+txtPeor+';text-align:center;font-weight:700">'+fmt(peorMap[mt.key].val,mt.dec)+'</td>';
    }).join('')+'</tr>';

    var curChartMet = window._sesCurChartMet || 'dist';

    document.getElementById('sesBody').innerHTML=
      '<div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead>'+head+'</thead><tbody>'+body+peorRow+fechaRow+'</tbody></table></div>'+
      
      // Gráficos uno por uno con botones directos y ajuste para pantalla de 14 pulgadas
      '<div class="card" style="padding:14px 16px;margin-bottom:14px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">'+
          '<div style="font-family:var(--font-head);font-size:13.5px;font-weight:800;color:var(--text);letter-spacing:0.5px">'+
            'Gráfico individual de la sesión (ver uno por uno):'+
          '</div>'+
          '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center" id="sesChartBtnGroup">'+
            '<button type="button" class="btn-ses-chart '+(curChartMet==='dist'?'active':'')+'" data-met="dist">Distancia Total</button>'+
            '<button type="button" class="btn-ses-chart '+(curChartMet==='accDec'?'active':'')+'" data-met="accDec">Acc + Dec</button>'+
            '<button type="button" class="btn-ses-chart '+(curChartMet==='s25'?'active':'')+'" data-met="s25">Sprint >25 km/h</button>'+
            '<button type="button" class="btn-ses-chart '+(curChartMet==='topSpeed'?'active':'')+'" data-met="topSpeed">Velocidad Máx.</button>'+
            '<select class="sel" id="selMetSesExtra" style="font-size:11px;padding:4px 8px;margin-bottom:0">'+
              '<option value="">Otras variables...</option>'+
              mets.filter(function(m){ return ['dist','s25','topSpeed'].indexOf(m.key) < 0; }).map(function(mt){
                return '<option value="'+mt.key+'"'+(curChartMet===mt.key?' selected':'')+'>'+mt.full+'</option>';
              }).join('')+
            '</select>'+
          '</div>'+
        '</div>'+
        '<div class="chart-wrap" style="height:'+Math.min(320, Math.max(220, js.length*17))+'px"><canvas id="sesChart"></canvas></div>'+
      '</div>'+
      sintesis(sint);

    function dibujarSesChart(k){
      window._sesCurChartMet = k;
      var cv = document.getElementById('sesChart');
      if(!cv) return;
      if(charts.ses) { try{charts.ses.destroy();}catch(e){} }

      var metTitle = '', metDec = 0, metUnit = '', metCol = '#002B66';
      function getVal(j){
        if(k === 'accDec') return (j.acc||0) + (j.dec||0);
        return j[k] || 0;
      }

      if(k === 'dist'){
        metTitle = 'Distancia total (m)'; metDec = 0; metUnit = ' m'; metCol = '#002B66';
      } else if(k === 'accDec'){
        metTitle = 'Acc + Dec (>2,5 m/s) sumadas'; metDec = 0; metUnit = ''; metCol = '#EC4899';
      } else if(k === 's25'){
        metTitle = 'Sprint >25 km/h (m)'; metDec = 0; metUnit = ' m'; metCol = '#F59E0B';
      } else if(k === 'topSpeed'){
        metTitle = 'Velocidad máxima (km/h)'; metDec = 1; metUnit = ' km/h'; metCol = '#EAB308';
      } else {
        var found = mets.filter(function(m){ return m.key === k; })[0] || mets[0];
        metTitle = found.full; metDec = found.dec; metUnit = found.unit || ''; metCol = '#002B66';
      }

      var sorted = js.slice().sort(function(a,b){ return getVal(b) - getVal(a); });
      var chartTitle = metTitle + ' — ' + mcActual.label + ' (' + codigo + ') — ' + s.fecha;

      charts.ses = new Chart(cv.getContext('2d'), {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: sorted.map(function(x){ return x.jugador; }),
          datasets: [{
            data: sorted.map(function(x){ return getVal(x); }),
            backgroundColor: metCol,
            borderRadius: 3
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: chartTitle, color: cT(), font: { family: 'Plus Jakarta Sans', size: 13, weight: '700' } },
            datalabels: {
              color: cT(),
              font: { size: 10, weight: 'bold' },
              anchor: 'end',
              align: 'end',
              formatter: function(v){ return fmt(v, metDec) + metUnit; }
            }
          },
          scales: {
            x: { ticks: { color: cM() }, grid: { color: cG() } },
            y: { ticks: { color: cM(), font: { size: 10.5 } } }
          }
        }
      });

      // Actualizar estado activo de botones
      var btnGroup = document.getElementById('sesChartBtnGroup');
      if(btnGroup){
        var btns = btnGroup.querySelectorAll('.btn-ses-chart');
        btns.forEach(function(b){
          b.classList.toggle('active', b.getAttribute('data-met') === k);
        });
      }
    }

    dibujarSesChart(curChartMet);

    // Event handlers para botones
    var btnGroup = document.getElementById('sesChartBtnGroup');
    if(btnGroup){
      var btns = btnGroup.querySelectorAll('.btn-ses-chart');
      btns.forEach(function(b){
        b.onclick = function(){
          var selExtra = document.getElementById('selMetSesExtra');
          if(selExtra) selExtra.value = '';
          dibujarSesChart(this.getAttribute('data-met'));
        };
      });
      var selExtra = document.getElementById('selMetSesExtra');
      if(selExtra){
        selExtra.onchange = function(){
          if(this.value) dibujarSesChart(this.value);
        };
      }
    }
  }
  EXPORT_RERENDER=dibujar;
  selMicro.onchange=actualizarDias;
  selDia.onchange=dibujar;
  selMetSes.onchange=dibujar;
  actualizarDias();
}
/* ============================================================
   TEMPORALMENTE COMENTADO: Análisis IA (descomentar para reactivar)
// ─── ANÁLISIS IA (preguntas predefinidas · texto + gráfico, sin costo de API) ───
function renderIA(p){
  function aggCarga(){
    var out=[];
    (D.roster||[]).forEach(function(n){var wk=D.jugadores[n]||[];if(!wk.length)return;out.push({n:n,v:prom(wk.map(function(r){return r.carga;}))});});
    return out;
  }
  function aggSesion(key){
    var out=[],byN={};
    (D.sesiones||[]).forEach(function(s){if(s.tipo.indexOf('Partido')>=0)return;s.jugadores.forEach(function(j){if(!byN[j.jugador])byN[j.jugador]={s:0,n:0};byN[j.jugador].s+=(j[key]||0);byN[j.jugador].n++;});});
    Object.keys(byN).forEach(function(n){out.push({n:n,v:byN[n].s/byN[n].n});});
    return out;
  }
  function ultimoPartido(){var ps=(D.sesiones||[]).filter(function(s){return s.tipo.indexOf('Partido')>=0;});return ps.length?ps[ps.length-1]:null;}
  function microsTension(){
    var g={};
    (D.sesiones||[]).forEach(function(s){
      if(s.tipo.indexOf('Partido')>=0)return;
      var raw=String(s.micro||'').trim();
      if(!raw||/sem/i.test(raw)||/[\/\-]/.test(raw))return;
      var m=raw.match(/\d+/);
      if(!m)return;
      var mc=String(parseInt(m[0],10));
      if(!g[mc])g[mc]={mc:mc,n:parseInt(mc,10),vals:[]};
      s.jugadores.forEach(function(j){g[mc].vals.push((j.acc||0)+(j.dec||0));});
    });
    return Object.keys(g).map(function(k){return {mc:g[k].mc,n:g[k].n,v:prom(g[k].vals)};}).sort(function(a,b){return a.n-b.n;});
  }
  function velLejos(){
    var out=[];
    (D.alertas||[]).forEach(function(a){
      if(a.topSpeed>0 && a.pctVel>0){
        var ultVel = Math.round(a.topSpeed * (a.pctVel/100) * 10) / 10;
        out.push({n:a.jugador, pct:a.pctVel, rec:a.topSpeed, ult:ultVel});
      }
    });
    return out.filter(function(x){return x.ult>0;});
  }
  var TXT={
    ranking_carga:function(){
      var l=aggCarga().sort(function(a,b){return b.v-a.v;});if(!l.length)return null;
      var top=l.slice(0,Math.min(12,l.length));var avg=prom(l.map(function(x){return x.v;}));
      var t='<p>Ordenando por <b>carga semanal promedio</b>, el que más acumula es <b>'+l[0].n+'</b> ('+fmt(l[0].v)+') y el que menos <b>'+l[l.length-1].n+'</b> ('+fmt(l[l.length-1].v)+'). El promedio del plantel es <b>'+fmt(avg)+'</b>.</p>';
      return {html:t,chart:{labels:top.map(function(x){return x.n;}),data:top.map(function(x){return Math.round(x.v);}),title:'Carga semanal promedio (mayor a menor)',color:'#5BA3DE'}};
    },
    carga_baja:function(){
      var l=aggCarga().sort(function(a,b){return a.v-b.v;});if(!l.length)return null;
      var bottom=l.slice(0,Math.min(10,l.length));
      var t='<p>Los que vienen con <b>menos carga acumulada</b> son <b>'+bottom.slice(0,3).map(function(x){return x.n;}).join('</b>, <b>')+'</b>. Si no están lesionados ni con permiso, puede ser buen momento para sumarles volumen y acercarlos al resto.</p>';
      return {html:t,chart:{labels:bottom.map(function(x){return x.n;}),data:bottom.map(function(x){return Math.round(x.v);}),title:'Jugadores con menor carga (menor a mayor)',color:'#F1C40F'}};
    },
    sobrecarga:function(){
      var e=D.equipo.estado;var alertas=(D.alertas||[]);
      var t='<p>El equipo cerró con un <b>ACWR de '+fmt(e.acwr,2)+'</b> (zona <b>'+(e.zona||'—')+'</b>). ';
      if(alertas.length){t+='Hay <b>'+alertas.length+'</b> jugador(es) marcados con alerta de carga: <b>'+alertas.map(function(a){return a.jugador;}).slice(0,8).join('</b>, <b>')+'</b>.</p>';}
      else{t+='No hay jugadores con alerta de sobrecarga individual en este momento.</p>';}
      var l=aggCarga().sort(function(a,b){return b.v-a.v;}).slice(0,10);
      return {html:t,chart:l.length?{labels:l.map(function(x){return x.n;}),data:l.map(function(x){return Math.round(x.v);}),title:'Jugadores con mayor carga (vigilar)',color:'#E74C3C'}:null};
    },
    acwr_equipo:function(){
      var w=D.equipo.weeks||[];if(!w.length)return null;
      var e=D.equipo.estado;var ult=w[w.length-1]||{},prev=w[w.length-2]||{};
      var tend=(ult.acwr&&prev.acwr)?(ult.acwr>prev.acwr?'subiendo':ult.acwr<prev.acwr?'bajando':'estable'):'—';
      var t='<p>El <b>ACWR del equipo</b> está en <b>'+fmt(e.acwr,2)+'</b> (zona <b>'+(e.zona||'—')+'</b>) y viene <b>'+tend+'</b> respecto a la semana anterior. La zona óptima es 0,80–1,30.</p>';
      return {html:t,chart:{labels:w.map(function(x){return x.semana;}),data:w.map(function(x){return Math.round((x.acwr||0)*100)/100;}),title:'ACWR del equipo por semana',color:'#5BA3DE',dec:2}};
    },
    velocidad_lejos:function(){
      var l=velLejos();if(!l.length)return null;
      l.sort(function(a,b){return a.pct-b.pct;});var lejos=l.slice(0,Math.min(10,l.length));
      var t='<p>Mirando la <b>última velocidad máxima</b> de cada uno contra su récord, los que están <b>más lejos de su techo</b> son <b>'+lejos.slice(0,3).map(function(x){return x.n+' ('+x.pct+'%)';}).join('</b>, <b>')+'</b>. A esos conviene exponerlos a trabajo de sprint máximo.</p>';
      return {html:t,chart:{labels:lejos.map(function(x){return x.n;}),data:lejos.map(function(x){return x.pct;}),title:'% de su velocidad máxima en el último registro',color:'#F1C40F',unit:'%'}};
    },
    sprints:function(){
      var l=aggSesion('sprints').sort(function(a,b){return b.v-a.v;});if(!l.length)return null;
      var top=l.slice(0,Math.min(12,l.length));
      var t='<p>En <b>sprints promedio por sesión</b>, el que más hace es <b>'+l[0].n+'</b> ('+fmt(l[0].v,1)+'). Son los jugadores que más acciones explosivas repiten en los entrenamientos.</p>';
      return {html:t,chart:{labels:top.map(function(x){return x.n;}),data:top.map(function(x){return Math.round(x.v*10)/10;}),title:'Sprints promedio por sesión',color:'#2ECC71',dec:1}};
    },
    micro_exigente:function(){
      var l=microsTension();if(!l.length)return null;
      var max=l.slice().sort(function(a,b){return b.v-a.v;})[0];
      var t='<p>Agrupando por microciclo (tensión = aceleraciones + desaceleraciones >2,5), el <b>más exigente</b> fue el <b>Micro '+max.mc+'</b> ('+fmt(max.v)+' acc+dec por jugador/sesión promedio).</p>';
      return {html:t,chart:{labels:l.map(function(x){return 'Micro '+x.mc;}),data:l.map(function(x){return Math.round(x.v);}),title:'Tensión (Acc+Dec >2,5) por microciclo',color:'#5BA3DE'}};
    },
    micro_ult3:function(){
      var l=microsTension();if(!l.length)return null;
      var u=l.slice(-3);
      var tend=u.length>=2?(u[u.length-1].v>u[u.length-2].v*1.1?'subió':u[u.length-1].v<u[u.length-2].v*0.9?'bajó':'se mantuvo'):'—';
      var t='<p>En los <b>últimos '+u.length+' microciclos</b>, la tensión (acc+dec) '+(u.length>=2?'<b>'+tend+'</b> en el último respecto al anterior':'todavía tiene pocos datos')+'. Último: <b>'+fmt(u[u.length-1].v)+'</b>.</p>';
      return {html:t,chart:{labels:u.map(function(x){return 'Micro '+x.mc;}),data:u.map(function(x){return Math.round(x.v);}),title:'Tensión en los últimos microciclos',color:'#5BA3DE'}};
    },
    partido_corrio:function(){
      var s=ultimoPartido();if(!s)return null;
      var js=s.jugadores.slice().sort(function(a,b){return (b.dist||0)-(a.dist||0);});
      if(!js.length)return null;
      var top=js.slice(0,Math.min(14,js.length));
      var t='<p>En el <b>último partido</b> ('+s.fecha+(s.rival?' vs '+s.rival:'')+'), el que más recorrió fue <b>'+js[0].jugador+'</b> ('+fmt(js[0].dist)+' m). La distancia promedio del equipo fue <b>'+fmt(prom(js.map(function(j){return j.dist||0;})))+' m</b>.</p>';
      return {html:t,chart:{labels:top.map(function(j){return j.jugador;}),data:top.map(function(j){return Math.round(j.dist||0);}),title:'Distancia en el último partido (m)',color:'#5BA3DE'}};
    },
    sesion_peor:function(){
      var ents=(D.sesiones||[]).filter(function(s){return s.tipo.indexOf('Partido')<0;});if(!ents.length)return null;
      var s=ents[ents.length-1];
      function grpKey(x){return String(x.per||'').trim().toUpperCase().replace(/\s+/g,'');}
      function tAvg(x,k){var a=x.jugadores.map(function(j){return j[k]||0;});return a.length?a.reduce(function(p,q){return p+q;},0)/a.length:0;}
      var grupo=ents.filter(function(x){return grpKey(x)===grpKey(s);});
      var best=0,bf='';grupo.forEach(function(x){var v=tAvg(x,'dist');if(v>best){best=v;bf=x.fecha;}});
      var hoy=tAvg(s,'dist');var pc=best>0?Math.round(hoy/best*100):0;
      var cod=String(s.per||'').trim()||'(sin código)';
      var t='<p>La <b>última sesión</b> ('+s.fecha+', tipo <b>'+cod+'</b>) promedió <b>'+fmt(hoy)+' m</b> por jugador. El "peor escenario" (mejor promedio histórico de un '+cod+') es <b>'+fmt(best)+' m</b>'+(bf?' (del '+bf+')':'')+', así que la sesión estuvo al <b>'+pc+'%</b> de ese techo.</p>';
      var comp=[{n:'Esta sesión',v:Math.round(hoy)},{n:'Peor escenario '+cod,v:Math.round(best)}];
      return {html:t,chart:{labels:comp.map(function(x){return x.n;}),data:comp.map(function(x){return x.v;}),title:'Distancia promedio: sesión vs su techo (m)',color:'#5BA3DE'}};
    }
  };
  var preguntas=[
    {id:'ranking_carga',t:'¿Quiénes acumulan más carga?'},
    {id:'carga_baja',t:'¿Quiénes vienen con menos carga?'},
    {id:'acwr_equipo',t:'¿Cómo está el ACWR del equipo?'},
    {id:'sobrecarga',t:'¿Hay jugadores sobrecargados?'},
    {id:'velocidad_lejos',t:'¿Quiénes están lejos de su velocidad máxima?'},
    {id:'sprints',t:'¿Quiénes hacen más sprints?'},
    {id:'micro_exigente',t:'¿Cuál fue el microciclo más exigente?'},
    {id:'micro_ult3',t:'¿Cómo vienen los últimos microciclos?'},
    {id:'partido_corrio',t:'¿Quién corrió más en el último partido?'},
    {id:'sesion_peor',t:'¿Cómo estuvo la última sesión vs su techo?'}
  ];
  var cards=preguntas.map(function(q,i){return '<button class="ia-q" data-id="'+q.id+'"><span class="ia-ico">'+(i+1)+'</span><span>'+q.t+'</span></button>';}).join('');
  p.innerHTML='<div class="panel-title">Análisis IA</div>'+
    '<div class="panel-sub">Respondé las preguntas más comunes sobre el plantel con un solo toque: quién acumula más carga, quién está sobrecargado, quién no llega a su velocidad máxima, cómo vienen los microciclos y más. Cada respuesta viene con su explicación escrita y su gráfico. Sirve para sacar conclusiones rápidas sin tener que recorrer todos los paneles. No tiene costo: usa los datos ya cargados.</div>'+
    '<div class="ia-grid" id="iaGrid">'+cards+'</div>'+
    '<div class="ia-result" id="iaResult"><div class="ia-empty">◍ Elegí una pregunta para empezar</div></div>';
  function responder(id,titulo){
    var res=document.getElementById('iaResult');
    res.innerHTML='<div class="ia-thinking"><span class="ia-dot"></span><span class="ia-dot"></span><span class="ia-dot"></span> Analizando datos…</div><div class="ia-scan" style="margin-top:10px"></div>';
    setTimeout(function(){
      var out=null;try{out=TXT[id]?TXT[id]():null;}catch(e){out=null;}
      if(!out){res.innerHTML='<div class="ia-empty">Todavía no hay datos suficientes para responder esto.</div>';return;}
      var html='<div class="ia-answer"><div class="ia-answer-head"><span class="ia-badge">IA</span><span class="ia-q-title">'+titulo+'</span></div><div class="ia-text">'+out.html+'</div>';
      if(out.chart)html+='<div class="card" style="margin-top:14px"><div class="chart-wrap" style="height:'+Math.max(280,(out.chart.labels.length*24))+'px"><canvas id="iaChart"></canvas></div></div>';
      html+='</div>';
      res.innerHTML=html;
      if(charts.ia){try{charts.ia.destroy();}catch(e){}delete charts.ia;}
      if(out.chart){
        var ch=out.chart,dec=ch.dec||0,unit=ch.unit||'';
        charts.ia=new Chart(document.getElementById('iaChart').getContext('2d'),{plugins:[ChartDataLabels],type:'bar',data:{labels:ch.labels,datasets:[{data:ch.data,backgroundColor:ch.color||'#5BA3DE',borderRadius:3}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:ch.title,color:cT(),font:{family:'Plus Jakarta Sans',size:14}},datalabels:{color:cT(),font:{size:10,weight:'bold'},anchor:'end',align:'end',formatter:function(v){return fmt(v,dec)+unit;}}},scales:{x:{ticks:{color:cM()},grid:{color:cG()}},y:{ticks:{color:cM(),font:{size:11}}}}}});
      }
    },550);
  }
  document.querySelectorAll('#iaGrid .ia-q').forEach(function(btn){
    btn.onclick=function(){
      document.querySelectorAll('#iaGrid .ia-q').forEach(function(b){b.classList.remove('ia-active');});
      btn.classList.add('ia-active');
      var id=btn.getAttribute('data-id');
      var q=preguntas.filter(function(x){return x.id===id;})[0];
      responder(id,q?q.t:'');
    };
  });
}
============================================================ */
// ─── CARGAS POR DÍA DE MICROCICLO (MD-X) ───
function renderMicroMD(p){
  function uniq(arr){ var s={},o=[]; arr.forEach(function(x){ if(x!=null&&!s[x]){s[x]=1;o.push(x);} }); return o; }
  function media(a){ return a.length ? a.reduce(function(x,y){return x+y;},0)/a.length : 0; }
  function dstd(a){ if(a.length<2) return 0; var m=media(a); return Math.sqrt(a.reduce(function(x,y){return x+(y-m)*(y-m);},0)/a.length); }
  function normMD(s){
    if(!s) return '';
    s = String(s).trim().toUpperCase().replace(/\s+/g,'');
    if(s==='MD') return 'MD';
    var num = s.match(/\d+/); if(!num) return '';
    num = parseInt(num[0],10);
    var hasMinus = s.indexOf('-')>=0, hasPlus = s.indexOf('+')>=0;
    if(hasMinus && !hasPlus) return 'MD-'+num;
    if(hasPlus && !hasMinus) return 'MD+'+num;
    return 'MD-'+num;
  }
  function ordenMD(md){
    var o = {
      'MD+1':1,'MD+2':2,'MD+3':3,'MD+4':4,'MD-5':5,'MD-4':6,'MD-3':7,'MD-2':8,'MD-1':9,'MD':10,
      'Lunes':2,'Martes':3,'Miércoles':4,'Miercoles':4,'Jueves':5,'Viernes':6,'Sábado':7,'Sabado':7,'Domingo':1
    };
    return o[md]!=null ? o[md] : 999;
  }
  function colorPorDesvio(actual, mu, sigma, n){
    var isLight = TEMA === 'light';
    var textBlack = isLight ? '#000000' : '#E8EDF2';
    var textMuted = isLight ? '#334155' : '#8A9BB5';
    if(actual==null) return {bg:'transparent', txt: textMuted};
    if(n<3 || sigma===0) return {bg:'transparent', txt: textBlack};
    var z = Math.abs(actual-mu)/sigma;
    if(z<0.5) return {bg: isLight ? 'rgba(0, 43, 102,0.10)' : 'rgba(91,163,222,0.10)', txt: textBlack};
    if(z<1.0) return {bg: isLight ? 'rgba(0, 43, 102,0.20)' : 'rgba(91,163,222,0.30)', txt: textBlack};
    if(z<1.5) return {bg: isLight ? 'rgba(0, 43, 102,0.35)' : 'rgba(91,163,222,0.55)', txt: isLight ? '#000000' : '#06121E'};
    return       {bg: isLight ? 'rgba(0, 43, 102,0.50)' : 'rgba(91,163,222,0.85)', txt: isLight ? '#000000' : '#06121E'};
  }
  function fmtN(v){ if(v==null||isNaN(v)) return '\u2014'; return Math.round(v).toLocaleString('es-AR'); }
  function fmtD(v,d){ if(v==null||isNaN(v)) return '\u2014'; return v.toFixed(d).replace('.',','); }
  var entrenos = [];
  (D.sesiones||[]).forEach(function(s){
    var tipoStr = String(s.tipo||'').toLowerCase();
    if(tipoStr.indexOf('partido')>=0) return;
    var perOrDia = s.per || s.dia || '';
    var mdMatch = String(perOrDia).match(/MD[\s]*[+\-]?\s*\d+|^MD$/i);
    var md = mdMatch ? normMD(mdMatch[0]) : '';
    if(!md) {
      var dName = s.dia || '';
      if(!dName && s.fecha){
        var xp = String(s.fecha).split('/');
        if(xp.length===3){
          var dt = new Date(xp[2], xp[1]-1, xp[0]);
          var diasSem = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
          dName = diasSem[dt.getDay()];
        }
      }
      if(dName) md = dName;
    }
    if(!md) return;
    s.jugadores.forEach(function(j){
      if(!j.dist || j.dist<=0) return;
      var z1618 = j.z1618!=null ? j.z1618 : Math.max(0, (j.hi||0) - (j.z1825||0) - (j.s25||0));
      entrenos.push({
        md: md, micro: s.micro||'', fecha: s.fecha,
        nombre: j.jugador, pos: j.pos||'',
        td: j.dist, mpm: j.drel||0,
        z1618: z1618, z1825: j.z1825||0, s25: j.s25||0,
        spr: j.sprints||0,
        acc25: j.acc||0, dec25: j.dec||0, acc4: j.accAlta||0, dec4: j.decAlta||0
      });
    });
  });
  if(entrenos.length===0){
    p.innerHTML='<div class="panel-title">Cargas por Día de Microciclo</div>'+
      '<div class="panel-sub">No hay entrenamientos con código MD-X cargados todavía.</div>';
    return;
  }
  var mds = uniq(entrenos.map(function(x){return x.md;})).sort(function(a,b){return ordenMD(a)-ordenMD(b);});
  var micros = uniq(entrenos.map(function(x){
    var m = String(x.micro||'').match(/\d+/);
    return (!m || /sem/i.test(x.micro) || /[\/\-]/.test(x.micro)) ? '' : String(parseInt(m[0],10));
  }).filter(function(m){return m;})).sort(function(a,b){
    return parseInt(a,10) - parseInt(b,10);
  });
  var jugadores = uniq(entrenos.map(function(x){return x.nombre;})).sort();
  var posiciones = uniq(entrenos.map(function(x){return x.pos;}).filter(function(po){return po;})).sort();
  var hayPos = posiciones.length>0;
  var sel = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">'+
    '<select class="sel" id="mmdMicro"><option value="__ALL__">Todos los microciclos</option>'+
       micros.slice().reverse().map(function(m){return '<option value="'+m+'">Microciclo '+m+'</option>';}).join('')+'</select>'+
    '<select class="sel" id="mmdJug"><option value="__TEAM__">Promedio del equipo</option>'+
       jugadores.map(function(n){return '<option value="'+n+'">'+n+'</option>';}).join('')+'</select>'+
    '<select class="sel" id="mmdPos"'+(hayPos?'':' disabled')+'>'+
       '<option value="__ALL__">'+(hayPos?'Todas las posiciones':'Cargá posiciones para activar')+'</option>'+
       posiciones.map(function(po){return '<option value="'+po+'">'+po+'</option>';}).join('')+'</select>'+
    '</div>';
  p.innerHTML='<div class="panel-title">Cargas por Día de Microciclo</div>'+
    '<div class="panel-sub">Detalla qué se hizo cada día del microciclo según su código MD-X (MD-4, MD-3… hasta MD-1, y MD+1/MD+2 post-partido). Compara lo ejecutado en la sesión con el promedio histórico de ese mismo día: el gradiente celeste va de claro (dentro de lo esperado) a oscuro (se alejó bastante de lo habitual). Sirve para chequear que cada día haya tenido el estímulo planificado.</div>'+
    sel+'<div id="mmdContent"></div>';
  document.getElementById('mmdMicro').onchange = recalc;
  document.getElementById('mmdJug').onchange = recalc;
  document.getElementById('mmdPos').onchange = recalc;
  function recalc(){
    var fMicro = document.getElementById('mmdMicro').value;
    var fJug = document.getElementById('mmdJug').value;
    var fPos = document.getElementById('mmdPos').value;
    var cont = document.getElementById('mmdContent');
    var METRICAS = ['td','mpm','z1618','z1825','s25','spr','acc25','dec25','acc4','dec4'];
    var sesAgg = {};
    entrenos.forEach(function(e){
      if(fPos!=='__ALL__' && hayPos && e.pos!==fPos) return;
      if(fJug!=='__TEAM__' && e.nombre!==fJug) return;
      var k = e.fecha+'|'+e.md;
      if(!sesAgg[k]) sesAgg[k] = {md:e.md, micro:e.micro, fecha:e.fecha, m:{}};
      METRICAS.forEach(function(m){
        if(!sesAgg[k].m[m]) sesAgg[k].m[m]=[];
        sesAgg[k].m[m].push(e[m]||0);
      });
    });
    var puntos = Object.keys(sesAgg).map(function(k){
      var s = sesAgg[k];
      var out = {md:s.md, micro:s.micro, fecha:s.fecha};
      METRICAS.forEach(function(m){ out[m] = media(s.m[m]); });
      return out;
    });
    var hist = {}; mds.forEach(function(md){ hist[md]={}; METRICAS.forEach(function(m){ hist[md][m]=[]; }); });
    puntos.forEach(function(pt){ METRICAS.forEach(function(m){ hist[pt.md][m].push(pt[m]); }); });
    var puntosAct = (fMicro==='__ALL__') ? puntos : puntos.filter(function(pt){return pt.micro===fMicro;});
    var actArr = {}; mds.forEach(function(md){ actArr[md]={}; METRICAS.forEach(function(m){actArr[md][m]=[];}); });
    puntosAct.forEach(function(pt){ METRICAS.forEach(function(m){ actArr[pt.md][m].push(pt[m]); }); });
    var valAct = {}; mds.forEach(function(md){ valAct[md]={}; METRICAS.forEach(function(m){ valAct[md][m] = actArr[md][m].length ? media(actArr[md][m]) : null; }); });
    var COLS = [
      {key:'td',     lbl:'TD (m)',     fmt:0},
      {key:'mpm',    lbl:'m/min',      fmt:1},
      {key:'z1618',  lbl:'15-18 km/h', fmt:0},
      {key:'z1825',  lbl:'18-25 km/h', fmt:0},
      {key:'s25',    lbl:'>25 km/h',   fmt:0},
      {key:'spr',    lbl:'EF Spr',     fmt:1},
      {key:'acc25',  lbl:'Acc>2,5',    fmt:0},
      {key:'dec25',  lbl:'Dec>-2,5',   fmt:0},
      {key:'acc4',   lbl:'Acc>4',      fmt:1},
      {key:'dec4',   lbl:'Dec>4',      fmt:1}
    ];
    var tabla = '<div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr><th>Día MC</th><th>N hist.</th>'+
      COLS.map(function(c){return '<th>'+c.lbl+'</th>';}).join('')+'</tr></thead><tbody>';
    mds.forEach(function(md){
      var nHist = hist[md][METRICAS[0]].length;
      tabla += '<tr><td><strong style="color:' + (TEMA === 'light' ? '#000000' : '#f8fafc') + '">'+md+'</strong></td><td style="color:' + (TEMA === 'light' ? '#000000' : '#f8fafc') + ';font-weight:700;text-align:center">'+nHist+'</td>';
      COLS.forEach(function(c){
        var v = valAct[md][c.key];
        var arr = hist[md][c.key];
        var mu = media(arr), sg = dstd(arr);
        var col = colorPorDesvio(v, mu, sg, arr.length);
        var txt = v==null ? '\u2014' : (c.fmt===0 ? fmtN(v) : fmtD(v,c.fmt));
        tabla += '<td style="background:'+col.bg+';color:'+col.txt+';font-weight:700;text-align:center">'+txt+'</td>';
      });
      tabla += '</tr>';
    });
    tabla += '</tbody></table></div>';
    var totalHist = mds.reduce(function(s,md){return s+hist[md].td.length;},0);
    var sintHTML;
    if(totalHist<3){
      sintHTML = '<p>Todavía hay pocas sesiones cargadas. El gradiente celeste del semáforo empieza a tener sentido recién con 3+ sesiones por día de microciclo.</p>';
    } else {
      sintHTML = '<p>El semáforo muestra cuánto se aleja la sesión filtrada del promedio histórico de ese mismo MD-X. Celeste muy claro = dentro de \u00b10,5 desvíos (lo esperado). Celeste oscuro = más de 1,5 desvíos del promedio (revisar).</p>'+
                 '<p>Los gráficos respetan el orden cronológico del microciclo: MD+1 y MD+2 (post-partido), luego MD-4 \u2192 MD-1 (preparación del próximo partido).</p>';
    }
    // Armar TODO el HTML de una sola vez (tabla + gráficos + síntesis) antes de crear los charts.
    // Si se usa innerHTML+= después de crear los charts, el navegador recrea los canvas y los gráficos quedan huérfanos (cajas vacías).
    cont.innerHTML = tabla +
      '<div class="card"><div class="chart-wrap"><canvas id="mmdC1"></canvas></div></div>'+
      '<div class="card"><div class="chart-wrap"><canvas id="mmdC2"></canvas></div></div>'+
      '<div class="card"><div class="chart-wrap"><canvas id="mmdC3"></canvas></div></div>'+
      '<div class="card"><div class="chart-wrap"><canvas id="mmdC4"></canvas></div></div>'+
      '<div class="card"><div class="chart-wrap"><canvas id="mmdC5"></canvas></div></div>'+
      '<div class="card"><div class="chart-wrap"><canvas id="mmdC6"></canvas></div></div>'+
      sintesis(sintHTML);
    ['mmd1','mmd2','mmd3','mmd4','mmd5','mmd6'].forEach(function(k){ if(charts[k]){ try{charts[k].destroy();}catch(e){} delete charts[k]; }});
    function valMD(metrica){ return mds.map(function(md){ return valAct[md][metrica]; }); }
    function baseOpt(title){ return {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{labels:{color:cM()}},title:{display:true,text:title,color:cT(),font:{family:'Plus Jakarta Sans',size:14,weight:'bold'}}},
      scales:{x:{ticks:{color:cM()},grid:{display:false,color:cG()}},y:{ticks:{color:cM()},grid:{display:false,color:cG()},beginAtZero:true}}
    }; }
    charts.mmd1 = new Chart(document.getElementById('mmdC1').getContext('2d'),{type:'bar',
      data:{labels:mds,datasets:[{label:'Total Distance (m)',data:valMD('td'),backgroundColor:'#5BA3DE',borderRadius:4}]},
      options:baseOpt('Volumen \u2014 Distancia total')});
    charts.mmd2 = new Chart(document.getElementById('mmdC2').getContext('2d'),{type:'bar',
      data:{labels:mds,datasets:[{label:'m/min',data:valMD('mpm'),backgroundColor:'#5BA3DE',borderRadius:4}]},
      options:baseOpt('Intensidad \u2014 Metros por minuto')});
    charts.mmd3 = new Chart(document.getElementById('mmdC3').getContext('2d'),{type:'bar',
      data:{labels:mds,datasets:[
        {label:'15-18 km/h',data:valMD('z1618'),backgroundColor:'#5BA3DE'},
        {label:'18-25 km/h',data:valMD('z1825'),backgroundColor:'#F1C40F'},
        {label:'>25 km/h',data:valMD('s25'),backgroundColor:'#E74C3C'}
      ]},options:baseOpt('Distancia por zonas de velocidad (m)')});
    charts.mmd4 = new Chart(document.getElementById('mmdC4').getContext('2d'),{type:'bar',
      data:{labels:mds,datasets:[
        {type:'bar',label:'Distancia >25 km/h (m)',data:valMD('s25'),backgroundColor:'#5BA3DE',yAxisID:'y'},
        {type:'line',label:'EF Sprint (cantidad)',data:valMD('spr'),borderColor:'#E74C3C',backgroundColor:'#E74C3C44',tension:.3,yAxisID:'y1',pointRadius:5}
      ]},options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:cM()}},title:{display:true,text:'Sprint \u2014 Distancia >25 km/h y cantidad de sprints',color:cT(),font:{family:'Plus Jakarta Sans',size:14,weight:'bold'}}},
        scales:{x:{ticks:{color:cM()},grid:{display:false,color:cG()}},
                y:{position:'left',ticks:{color:cM()},grid:{display:false,color:cG()},beginAtZero:true,title:{display:true,text:'Metros',color:cM()}},
                y1:{position:'right',ticks:{color:cM()},grid:{display:false,color:cG()},beginAtZero:true,title:{display:true,text:'Sprints (cant.)',color:cM()}}}}});
    charts.mmd5 = new Chart(document.getElementById('mmdC5').getContext('2d'),{type:'bar',
      data:{labels:mds,datasets:[
        {label:'Acc >2,5 m/s\u00b2',data:valMD('acc25'),backgroundColor:'#5BA3DE'},
        {label:'Acc >4 m/s\u00b2',data:valMD('acc4'),backgroundColor:'#F1C40F'}
      ]},options:baseOpt('Aceleraciones')});
    charts.mmd6 = new Chart(document.getElementById('mmdC6').getContext('2d'),{type:'bar',
      data:{labels:mds,datasets:[
        {label:'Dec >-2,5 m/s\u00b2',data:valMD('dec25'),backgroundColor:'#5BA3DE'},
        {label:'Dec >4 m/s\u00b2',data:valMD('dec4'),backgroundColor:'#F1C40F'}
      ]},options:baseOpt('Desaceleraciones')});
  }
  recalc();
}
// ─── HISTÓRICO DE VELOCIDAD (semana de entrenamiento MD+2 a MD-1, % del récord) ───
function renderHistVel(p){
  function parseF(f){var x=String(f).split('/');if(x.length<3)return new Date(NaN);return new Date(+x[2],(+x[1])-1,+x[0]);}
  function dd(n){return (n<10?'0':'')+n;}
  function mondayOf(d){var day=(d.getDay()+6)%7;return new Date(d.getFullYear(),d.getMonth(),d.getDate()-day);}
  function keyOf(d){return d.getFullYear()+'-'+dd(d.getMonth()+1)+'-'+dd(d.getDate());}
  function rangoDe(mon){var fin=new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6);return dd(mon.getDate())+'/'+dd(mon.getMonth()+1)+' al '+dd(fin.getDate())+'/'+dd(fin.getMonth()+1)+'/'+fin.getFullYear();}
  function normMD(x){x=String(x).trim().toUpperCase().replace(/\s+/g,'');if(x==='MD')return 'MD';var num=x.match(/\d+/);if(!num)return '';num=parseInt(num[0],10);var minus=x.indexOf('-')>=0,plus=x.indexOf('+')>=0;if(minus&&!plus)return 'MD-'+num;if(plus&&!minus)return 'MD+'+num;return 'MD-'+num;}
  function mdDe(s){var m=String(s.dia||s.per||'').match(/MD\s*[+\-]?\s*\d+/i);return m?normMD(m[0]):'';}
  // Solo entrenamientos MD+2 a MD-1: se excluyen partidos, el MD (partido) y el MD+1 (recuperación)
  function incluir(s){if(String(s.tipo||'').indexOf('Partido')>=0)return false;var md=mdDe(s);if(md==='MD'||md==='MD+1')return false;return true;}
  // Semanas (lunes a domingo) derivadas SOLO de días de entrenamiento válidos
  var weekMap={};
  (D.sesiones||[]).forEach(function(s){if(!incluir(s))return;var d=parseF(s.fecha);if(isNaN(d))return;var m=mondayOf(d);var k=keyOf(m);if(!weekMap[k])weekMap[k]={key:k,mon:m};});
  var semObjs=Object.keys(weekMap).map(function(k){return weekMap[k];}).sort(function(a,b){return a.mon-b.mon;});
  if(!semObjs.length){p.innerHTML='<div class="panel-title">Histórico de velocidad</div><div class="obs">No hay entrenamientos (MD+2 a MD-1) con datos de velocidad cargados para esta categoría todavía.</div>';return;}
  // Récord de cada jugador = mayor velocidad en entrenamientos válidos (sin partidos)
  var recordMap={};
  (D.sesiones||[]).forEach(function(s){if(!incluir(s))return;s.jugadores.forEach(function(j){var v=j.topSpeed||0;if(recordMap[j.jugador]==null||v>recordMap[j.jugador])recordMap[j.jugador]=v;});});
  var jugadores=Object.keys(recordMap).filter(function(n){return recordMap[n]>0;}).sort();
  function weekOf(fecha){var d=parseF(fecha);if(isNaN(d))return null;return keyOf(mondayOf(d));}
  p.innerHTML='<div class="panel-title">Histórico de velocidad</div>'+
    '<div class="panel-sub">Muestra, semana por semana, qué tan cerca estuvo cada jugador de su velocidad máxima registrada y cuántos días entrenó. Solo toma entrenamientos (MD+2 a MD-1), no partidos. En verde los que llegaron al 90% o más de su récord, en rojo los que quedaron lejos. Sirve para asegurar que cada jugador se exponga a esfuerzos de máxima velocidad y no pierda esa cualidad.</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">'+
    '<select class="sel" id="selHvSem">'+semObjs.slice().reverse().map(function(o,i){return '<option value="'+o.key+'"'+(i===0?' selected':'')+'>Semana del '+rangoDe(o.mon)+'</option>';}).join('')+'</select>'+
    '<select class="sel" id="selHvJug"><option value="__ALL__">Todo el plantel</option>'+jugadores.map(function(n){return '<option value="'+n+'">'+n+'</option>';}).join('')+'</select>'+
    '</div><div id="hvBody"></div>';
  function rangoSemana(key){return rangoDe(weekMap[key].mon);}
  function diasDe(nombre,sem){
    var arr=[];
    (D.sesiones||[]).forEach(function(s){
      if(!incluir(s))return;
      if(weekOf(s.fecha)!==sem)return;
      s.jugadores.forEach(function(j){
        if(j.jugador!==nombre)return;
        arr.push({fecha:s.fecha,dia:(s.dia||s.per||''),md:mdDe(s),ts:j.topSpeed||0});
      });
    });
    arr.sort(function(a,b){return parseF(a.fecha)-parseF(b.fecha);});
    return arr;
  }
  // Días de entrenamiento que tuvo el equipo esa semana (sesiones válidas distintas)
  function diasEquipo(sem){var c=0;(D.sesiones||[]).forEach(function(s){if(!incluir(s))return;if(weekOf(s.fecha)===sem)c++;});return c;}
  function dibujar(){
    var sem=document.getElementById('selHvSem').value;
    var jugSel=document.getElementById('selHvJug').value;
    var totalEntrenoSemana=diasEquipo(sem);
    if(jugSel==='__ALL__'){
      var filas=jugadores.map(function(n){
        var rec=recordMap[n];var dias=diasDe(n,sem);
        var best=0,bd=null;dias.forEach(function(x){if(x.ts>best){best=x.ts;bd=x;}});
        var pct=(rec>0&&best>0)?Math.round(best/rec*100):(dias.length?0:null);
        return {n:n,rec:rec,best:best,pct:pct,bd:bd,nDias:dias.length,tiene:dias.length>0};
      });
      filas.sort(function(a,b){if(a.tiene!==b.tiene)return a.tiene?-1:1;return (b.pct||0)-(a.pct||0);});
      var conDatos=filas.filter(function(f){return f.tiene;});
      var n90=conDatos.filter(function(f){return f.pct>=90;}).length;
      var body=conDatos.map(function(f){
        var pctTxt,pctCol,okTxt,okCol,diaTxt;
        if(!f.tiene){pctTxt='—';pctCol='var(--muted)';okTxt='sin datos';okCol='var(--muted)';diaTxt='<span style="color:var(--muted)">no entrenó esa semana</span>';}
        else{
          pctTxt=f.pct+'%';
          pctCol=f.pct>=90?'#2ECC71':(f.pct>=80?'#F1C40F':'#E74C3C');
          okTxt=f.pct>=90?'Sí':'No';okCol=f.pct>=90?'#2ECC71':'#E74C3C';
          diaTxt='<strong>'+(f.bd.dia||f.bd.md||'—')+'</strong> · '+f.bd.fecha+' <span style="color:var(--muted)">('+fmt(f.best,1)+' km/h)</span>';
        }
        var diasCol='<td style="text-align:center;font-weight:700;color:'+(f.nDias>=3?'#2ECC71':(f.nDias>=1?'#F1C40F':'var(--muted)'))+'">'+f.nDias+'</td>';
        return '<tr><td><strong>'+f.n+'</strong></td>'+diasCol+'<td style="text-align:center">'+fmt(f.rec,1)+'</td><td style="text-align:center">'+(f.tiene?fmt(f.best,1):'—')+'</td><td style="text-align:center;color:'+pctCol+';font-weight:700">'+pctTxt+'</td><td style="text-align:center;color:'+okCol+';font-weight:700">'+okTxt+'</td><td>'+diaTxt+'</td></tr>';
      }).join('');
      var chartFilas=conDatos.slice().sort(function(a,b){return b.pct-a.pct;});
      var sint='<p>En la <strong>semana del '+rangoSemana(sem)+'</strong> hubo <strong>'+totalEntrenoSemana+' día(s) de entrenamiento</strong> (MD+2 a MD-1). <strong>'+n90+' de '+conDatos.length+'</strong> jugador(es) con datos alcanzaron al menos el <strong>90%</strong> de su velocidad récord.</p>';
      if(conDatos.length){var peor=conDatos.slice().sort(function(a,b){return a.pct-b.pct;})[0];sint+='<p>El que quedó más lejos de su techo fue <strong>'+peor.n+'</strong> ('+peor.pct+'% de su récord de '+fmt(peor.rec,1)+' km/h, entrenó '+peor.nDias+' día/s). Cruzá el % con los días entrenados: pocos días suele explicar no llegar a la máxima.</p>';}
      document.getElementById('hvBody').innerHTML=
        (conDatos.length? (
        '<div class="obs"><strong>Cómo leer:</strong> <strong>Días entren.</strong> = cuántos entrenamientos (MD+2 a MD-1) hizo esa semana — puede explicar por qué llega o no a su máxima. El <strong>% del récord</strong> compara su mejor velocidad de la semana con su máxima histórica en entrenamientos. <span style="color:#2ECC71;font-weight:600">Verde ≥90%</span>, <span style="color:#F1C40F;font-weight:600">amarillo 80-89%</span>, <span style="color:#E74C3C;font-weight:600">rojo &lt;80%</span>.</div>'+
        '<div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr><th>Jugador</th><th style="text-align:center">Días entren.</th><th style="text-align:center">Récord (km/h)</th><th style="text-align:center">Mejor de la semana</th><th style="text-align:center">% del récord</th><th style="text-align:center">¿Llegó al 90%?</th><th>Día más cercano</th></tr></thead><tbody>'+body+'</tbody></table></div>'
        ) : '<div class="obs">Ningún jugador registró velocidad en entrenamientos (MD+2 a MD-1) esa semana.</div>')+
        (chartFilas.length?'<div class="card"><div class="chart-wrap" style="height:'+Math.max(280,chartFilas.length*26)+'px"><canvas id="hvChart"></canvas></div></div>':'')+
        sintesis(sint);
      if(charts.hv)charts.hv.destroy();
      if(chartFilas.length){
        var cols=chartFilas.map(function(f){return f.pct>=90?'#2ECC71':(f.pct>=80?'#F1C40F':'#E74C3C');});
        charts.hv=new Chart(document.getElementById('hvChart').getContext('2d'),{plugins:[ChartDataLabels],type:'bar',data:{labels:chartFilas.map(function(f){return f.n+' ('+f.nDias+'d)';}),datasets:[{data:chartFilas.map(function(f){return f.pct;}),backgroundColor:cols,borderRadius:3}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:'% de la velocidad récord en la semana — (Nd = días entrenados)',color:cT(),font:{family:'Plus Jakarta Sans',size:13}},datalabels:{color:cT(),font:{size:10,weight:'bold'},anchor:'end',align:'end',formatter:function(v){return v+'%';}}},scales:{x:{beginAtZero:true,suggestedMax:110,ticks:{color:cM(),callback:function(v){return v+'%';}},grid:{color:cG()}},y:{ticks:{color:cM(),font:{size:11}}}}}});
      }
    } else {
      var rec=recordMap[jugSel];var dias=diasDe(jugSel,sem);
      var best=0,bd=null;dias.forEach(function(x){if(x.ts>best){best=x.ts;bd=x;}});
      var pct=(rec>0&&best>0)?Math.round(best/rec*100):null;
      var lleg90=(pct!=null&&pct>=90);
      var verdict,vcol;
      if(pct==null){verdict='No entrenó esa semana';vcol='var(--muted)';}
      else if(lleg90){verdict='Superó el 90% de su récord';vcol='#2ECC71';}
      else{verdict='No alcanzó el 90% de su récord';vcol='#E74C3C';}
      var kpis='<div class="kpis">'+
        '<div class="kpi"><div class="v" style="color:'+(dias.length>=3?'#2ECC71':(dias.length>=1?'#F1C40F':'var(--muted)'))+'">'+dias.length+'</div><div class="l">Días de entrenamiento</div><div style="margin-top:6px;font-size:11px;color:var(--muted)">(equipo: '+totalEntrenoSemana+' esa semana)</div></div>'+
        '<div class="kpi"><div class="v">'+fmt(rec,1)+'<small> km/h</small></div><div class="l">Récord (entrenos)</div></div>'+
        '<div class="kpi"><div class="v">'+(best>0?fmt(best,1):'—')+'<small> km/h</small></div><div class="l">Mejor de la semana</div></div>'+
        '<div class="kpi"><div class="v" style="color:'+(pct!=null?(lleg90?'#2ECC71':(pct>=80?'#F1C40F':'#E74C3C')):'inherit')+'">'+(pct!=null?pct+'%':'—')+'</div><div class="l">% del récord</div></div>'+
        '</div>';
      var frase;
      if(pct==null){frase='<p><strong>'+jugSel+'</strong> no tiene entrenamientos (MD+2 a MD-1) en la semana del '+rangoSemana(sem)+'.</p>';}
      else{frase='<p>En la <strong>semana del '+rangoSemana(sem)+'</strong>, <strong>'+jugSel+'</strong> entrenó <strong>'+dias.length+' día(s)</strong> y llegó a <strong>'+fmt(best,1)+' km/h</strong>, un <strong>'+pct+'%</strong> de su récord de <strong>'+fmt(rec,1)+' km/h</strong>. <span style="color:'+vcol+';font-weight:700">'+verdict+'.</span></p>'+
        '<p>El día que estuvo <strong>más cerca de su máximo</strong> fue <strong>'+(bd.dia||bd.md||'—')+'</strong> ('+bd.fecha+') con <strong>'+fmt(best,1)+' km/h</strong>.'+(dias.length<3?' Ojo: pocos días de entrenamiento pueden explicar no llegar a la máxima.':'')+'</p>';}
      var tbody=dias.map(function(x){
        var pd=rec>0?Math.round(x.ts/rec*100):0;
        var es=(bd&&x.fecha===bd.fecha&&x.ts===bd.ts);
        var pcol=pd>=90?'#2ECC71':(pd>=80?'#F1C40F':'#E74C3C');
        return '<tr'+(es?' style="background:rgba(46,204,113,0.10)"':'')+'><td><strong>'+(x.dia||x.md||'—')+'</strong></td><td>'+x.fecha+'</td><td style="text-align:center">'+fmt(x.ts,1)+'</td><td style="text-align:center;color:'+pcol+';font-weight:600">'+pd+'%</td></tr>';
      }).join('');
      var tabla=dias.length?'<div class="card" style="overflow-x:auto;padding:0;margin-bottom:14px"><table class="data sesion-tbl"><thead><tr><th>Día</th><th>Fecha</th><th style="text-align:center">Vel. máx (km/h)</th><th style="text-align:center">% del récord</th></tr></thead><tbody>'+tbody+'</tbody></table></div>':'<div class="obs">No hay entrenamientos de este jugador en la semana elegida.</div>';
      document.getElementById('hvBody').innerHTML=kpis+
        (dias.length?'<div class="card"><div class="chart-wrap" style="height:280px"><canvas id="hvChart"></canvas></div></div>':'')+
        (dias.length?'<div class="obs">La fila resaltada es el día en que estuvo más cerca de su velocidad máxima.</div>':'')+
        tabla+sintesis(frase);
      if(charts.hv)charts.hv.destroy();
      if(dias.length){
        var lbls=dias.map(function(x){return (x.dia||x.md||x.fecha);});
        var barCols=dias.map(function(x){return (bd&&x.fecha===bd.fecha&&x.ts===bd.ts)?'#2ECC71':'#5BA3DE';});
        charts.hv=new Chart(document.getElementById('hvChart').getContext('2d'),{plugins:[ChartDataLabels],type:'bar',data:{labels:lbls,datasets:[
          {label:'Vel. máx del día',data:dias.map(function(x){return x.ts;}),backgroundColor:barCols,borderRadius:4,order:2},
          {label:'Récord ('+fmt(rec,1)+' km/h)',type:'line',data:lbls.map(function(){return rec;}),borderColor:'#F1C40F',borderDash:[6,4],pointRadius:0,fill:false,order:1},
          {label:'90% del récord',type:'line',data:lbls.map(function(){return Math.round(rec*0.9*10)/10;}),borderColor:'#E74C3C',borderDash:[3,3],pointRadius:0,fill:false,order:1}
        ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:cM()}},title:{display:true,text:'Velocidad máxima por día — '+jugSel,color:cT(),font:{family:'Plus Jakarta Sans',size:14}},datalabels:{color:cT(),font:{size:10,weight:'bold'},anchor:'end',align:'top',formatter:function(v,ctx){return ctx.datasetIndex===0?fmt(v,1):'';}}},scales:{x:{ticks:{color:cM(),maxRotation:45}},y:{beginAtZero:false,suggestedMin:Math.max(0,rec-12),suggestedMax:rec+2,ticks:{color:cM(),callback:function(v){return v+' km/h';}},grid:{color:cG()}}}}});
      }
    }
  }
  EXPORT_RERENDER=dibujar;
  document.getElementById('selHvSem').onchange=dibujar;
  document.getElementById('selHvJug').onchange=dibujar;
  dibujar();
}
/* ============================================================
   TEMPORALMENTE COMENTADO: Notas del entrenador (descomentar para reactivar)
// ─── NOTAS DEL ENTRENADOR (por categoría) ───
function renderNotas(p){
  var ALERTAS_GRUPOS=[
    {g:'Velocidad',items:[
      {id:'vel85',label:'Superó el 85% de su velocidad máxima'},
      {id:'vel90',label:'Superó el 90% de su velocidad máxima'},
      {id:'vel95',label:'Superó el 95% de su velocidad máxima'},
      {id:'record',label:'Hizo un récord de velocidad'},
      {id:'velBajo',label:'No pasó del 70% de su velocidad máxima en toda la semana'},
      {id:'nadie90',label:'Ningún jugador del plantel llegó al 90% en toda la semana'}
    ]},
    {g:'Distancia y sprints',items:[
      {id:'recordDist',label:'Hizo un récord de distancia'},
      {id:'recordSprints',label:'Hizo un récord de sprints'}
    ]},
    {g:'Partidos',items:[
      {id:'partidoAlto',label:'Corrió mucho más que su promedio en un partido (+20%)'},
      {id:'partidoBajo',label:'Corrió mucho menos que su promedio en un partido (−20%)'}
    ]},
    {g:'Carga',items:[
      {id:'acwr',label:'ACWR del equipo alto (>1.3)'},
      {id:'cargaMecanica',label:'Pico de aceleraciones/desaceleraciones en un día (+30% de su promedio)'},
      {id:'pocosDias',label:'Entrenó menos de 2 días en la semana'},
      {id:'puestoBajo',label:'Un puesto entero quedó por debajo de su promedio'}
    ]}
  ];
  var ALERTAS=[];ALERTAS_GRUPOS.forEach(function(gr){gr.items.forEach(function(a){ALERTAS.push(a);});});
  var inp='background:var(--card2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-family:var(--font-body);font-size:14px';
  var head='font-family:var(--font-head);letter-spacing:1px;color:var(--celeste);font-size:13px;margin-bottom:10px';
  p.innerHTML='<div class="panel-title">Notas del entrenador</div>'+
    '<div class="panel-sub">Indicaciones y alertas por mail para <strong>'+CAT_ACTUAL+'</strong>. Cada categoría tiene su propio espacio, separado del resto.</div>'+
    '<div class="card"><div style="'+head+'">Notas / indicaciones</div>'+
      '<textarea id="notasTexto" placeholder="Escribí acá lo que quieras dejar anotado para esta categoría (indicaciones, recordatorios, lo que necesites)..." style="width:100%;min-height:130px;'+inp+';resize:vertical;box-sizing:border-box"></textarea></div>'+
    '<div class="card"><div style="'+head+'">Alertas que quiero recibir</div>'+
      ALERTAS_GRUPOS.map(function(gr){return '<div style="font-family:var(--font-head);letter-spacing:1px;color:var(--muted);font-size:11px;margin:14px 0 2px;border-bottom:1px solid var(--border);padding-bottom:4px">'+gr.g+'</div>'+gr.items.map(function(a){return '<label style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;cursor:pointer;font-size:14px;line-height:1.4"><input type="checkbox" id="al_'+a.id+'" style="margin-top:2px;width:18px;height:18px;accent-color:var(--celeste);flex-shrink:0"><span>'+a.label+'</span></label>';}).join('');}).join('')+
      '<div style="font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5">Elegí una o varias. Se revisan sobre los datos de <strong>'+CAT_ACTUAL+'</strong> y el aviso llega a los mails de abajo.</div></div>'+
    '<div class="card"><div style="'+head+'">Mails para recibir los avisos</div>'+
      '<div style="display:flex;flex-direction:column;gap:10px;max-width:440px">'+
        '<input type="email" id="notasMail1" placeholder="mail 1 (ej: entrenador@club.com)" style="'+inp+'">'+
        '<input type="email" id="notasMail2" placeholder="mail 2 (opcional)" style="'+inp+'">'+
      '</div></div>'+
    '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:8px">'+
      '<button id="notasGuardar" style="background:var(--celeste);color:#06121E;border:none;padding:12px 26px;border-radius:8px;font-family:var(--font-head);font-weight:600;font-size:15px;cursor:pointer;letter-spacing:1px">GUARDAR</button>'+
      '<span id="notasStatus" style="font-size:13px;color:var(--muted)"></span></div>';
  function poblar(d){
    if(!d)return;
    var t=document.getElementById('notasTexto');if(t)t.value=d.notas||'';
    var m=d.mails||[];
    var m1=document.getElementById('notasMail1'),m2=document.getElementById('notasMail2');
    if(m1&&m[0])m1.value=m[0];if(m2&&m[1])m2.value=m[1];
    ALERTAS.forEach(function(a){var el=document.getElementById('al_'+a.id);if(el)el.checked=!!(d.alertas&&d.alertas[a.id]);});
  }
  function cargar(){
    if(typeof google!=='undefined'&&google.script&&google.script.run){
      google.script.run.withSuccessHandler(function(json){if(json){try{poblar(JSON.parse(json));}catch(e){}}}).withFailureHandler(function(){}).getNotas(CAT_ACTUAL);
    }
  }
  function guardar(){
    var payload={notas:(document.getElementById('notasTexto').value||''),alertas:{},mails:[(document.getElementById('notasMail1').value||'').trim(),(document.getElementById('notasMail2').value||'').trim()]};
    ALERTAS.forEach(function(a){payload.alertas[a.id]=document.getElementById('al_'+a.id).checked;});
    var js=JSON.stringify(payload);
    var st=document.getElementById('notasStatus');
    if(typeof google!=='undefined'&&google.script&&google.script.run){
      st.textContent='Guardando...';st.style.color='var(--muted)';
      google.script.run
        .withSuccessHandler(function(){st.textContent='Guardado para '+CAT_ACTUAL;st.style.color='var(--green)';})
        .withFailureHandler(function(err){st.textContent='Para guardar falta agregar las funciones getNotas/guardarNotas al Codigo.gs.';st.style.color='var(--red)';})
        .guardarNotas(CAT_ACTUAL,js);
    } else {
      st.textContent='En la vista previa no se guarda. Funciona en la web publicada.';st.style.color='var(--amber)';
    }
  }
  document.getElementById('notasGuardar').onclick=guardar;
  cargar();
}
/* ============================================================ */
// Duplicate removed: huellaNombreFront_
(function(){if(typeof google!=='undefined'&&google.script&&google.script.run){google.script.run.withSuccessHandler(function(json){try{window._fotosMap=JSON.parse(json);}catch(e){}}).withFailureHandler(function(){}).getFotosDeCategoria(CAT_ACTUAL);}})();

export const renderers = {
  planilla: renderPlanilla,
  carga: renderCarga,
  colent: renderColEntrenamiento,
  microMD: renderMicroMD,
  meso: renderMeso,
  sesion: renderSesion,
  sespos: renderSesionColectiva,
  ranking: renderRanking,
  comparar: renderComparar,
  informe: renderInforme,
  partido: renderPartido,
  colpart: renderColPartido,
  histvel: renderHistVel
};
