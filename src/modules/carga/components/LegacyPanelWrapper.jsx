import React, { useEffect, useRef } from 'react';
import { setupLegacyEnvironment } from '../../../panels/legacyRenderers';
import { areSamePlayer, normalizeStr } from '../../../utils/photoResolver';

export default function LegacyPanelWrapper({ panelId, renderFn, data, catActual, categorias = [], tema = 'claro', targetJugador }) {
  const containerRef = useRef(null);
  const chartsRef = useRef({});

  // Función dedicada para aplicar selección precisa de jugador en el select de informe
  const applyPlayerSelection = (player) => {
    if (!containerRef.current || !player) return false;
    const sInf = containerRef.current.querySelector('#selInf');
    if (!sInf || !sInf.options || !sInf.options.length) return false;

    const pTrim = String(player).trim();
    const tNorm = normalizeStr(pTrim);
    let matchedIndex = -1;

    // 1. Coincidencia exacta de valor o texto
    for (let i = 0; i < sInf.options.length; i++) {
      const optVal = sInf.options[i].value;
      if (optVal.toLowerCase() === pTrim.toLowerCase() || areSamePlayer(optVal, pTrim)) {
        matchedIndex = i;
        break;
      }
    }

    // 2. Coincidencia normalizada de subcadenas si no hubo exacta
    if (matchedIndex === -1) {
      for (let i = 0; i < sInf.options.length; i++) {
        const optNorm = normalizeStr(sInf.options[i].value);
        if (optNorm.includes(tNorm) || tNorm.includes(optNorm)) {
          matchedIndex = i;
          break;
        }
      }
    }

    if (matchedIndex !== -1) {
      sInf.selectedIndex = matchedIndex;
      sInf.value = sInf.options[matchedIndex].value;
      sInf.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof sInf.onchange === 'function') {
        sInf.onchange();
      }
      return true;
    }
    return false;
  };

  // Función para seleccionar automáticamente el jugador en Informe de Partido
  const applyPartidoPlayerSelection = (player) => {
    if (!containerRef.current || !player) return false;
    const selModo = containerRef.current.querySelector('#selPartModo');
    if (selModo && selModo.value !== 'jugador') {
      selModo.value = 'jugador';
      if (typeof selModo.onchange === 'function') selModo.onchange();
    }
    const selPartFecha = containerRef.current.querySelector('#selPartFecha');
    const selPartJug = containerRef.current.querySelector('#selPartJug');
    if (!selPartJug) return false;

    const pTrim = String(player).trim();
    const tNorm = normalizeStr(pTrim);

    let matchIdx = -1;
    for (let i = 0; i < selPartJug.options.length; i++) {
      const v = selPartJug.options[i].value;
      if (v.toLowerCase() === pTrim.toLowerCase() || areSamePlayer(v, pTrim) || normalizeStr(v).includes(tNorm)) {
        matchIdx = i;
        break;
      }
    }

    if (matchIdx === -1 && selPartFecha && selPartFecha.options.length) {
      const ses = (data && data.sesiones) || [];
      for (let fi = 0; fi < selPartFecha.options.length; fi++) {
        const fVal = selPartFecha.options[fi].value;
        const partSes = ses.find(s => s.fecha === fVal && (s.tipo || '').indexOf('Partido') >= 0);
        if (partSes && (partSes.jugadores || []).some(j => areSamePlayer(j.jugador, pTrim))) {
          selPartFecha.selectedIndex = fi;
          selPartFecha.value = fVal;
          if (typeof selPartFecha.onchange === 'function') selPartFecha.onchange();
          break;
        }
      }
      for (let i = 0; i < selPartJug.options.length; i++) {
        const v = selPartJug.options[i].value;
        if (v.toLowerCase() === pTrim.toLowerCase() || areSamePlayer(v, pTrim) || normalizeStr(v).includes(tNorm)) {
          matchIdx = i;
          break;
        }
      }
    }

    if (matchIdx !== -1) {
      selPartJug.selectedIndex = matchIdx;
      selPartJug.value = selPartJug.options[matchIdx].value;
      selPartJug.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof selPartJug.onchange === 'function') selPartJug.onchange();
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!containerRef.current || !renderFn || !data) return;

    // Destruir gráficos previos
    Object.keys(chartsRef.current).forEach(k => {
      if (chartsRef.current[k]) {
        try { chartsRef.current[k].destroy(); } catch (e) {}
        delete chartsRef.current[k];
      }
    });

    // Inyectar entorno de datos y gráficos con el tema actual
    setupLegacyEnvironment(data, catActual, categorias, chartsRef.current, tema);

    // Ejecutar render del panel
    try {
      renderFn(containerRef.current);
    } catch (err) {
      console.error(`Error al cargar panel ${panelId}:`, err);
      containerRef.current.innerHTML = `
        <div class="obs">
          No se pudo cargar este análisis (${err.message || err}). Puede que falten datos en el Sheet para esta sección.
        </div>
      `;
    }

    // Inicializar selectores internos por defecto
    try {
      if (panelId === 'sesion') {
        const sm = containerRef.current.querySelector('#selMicro');
        if (sm && sm.options.length && sm.onchange) sm.onchange();
        const sd = containerRef.current.querySelector('#selDia') || containerRef.current.querySelector('#selSes');
        if (sd && sd.options.length && sd.onchange) sd.onchange();
      }
      if (panelId === 'partido') {
        const playerToSelect = targetJugador || new URLSearchParams(window.location.search).get('jugador');
        if (playerToSelect) {
          applyPartidoPlayerSelection(playerToSelect);
          setTimeout(() => applyPartidoPlayerSelection(playerToSelect), 50);
        } else {
          const f1 = containerRef.current.querySelector('#selPartFecha');
          if (f1 && f1.options.length && f1.onchange) f1.onchange();
        }
      }
      if (panelId === 'sespos') {
        const a1 = containerRef.current.querySelector('#selSpAmb');
        if (a1) {
          let ultSes = null;
          for (let i = 0; i < a1.options.length; i++) {
            if (/^s\d+$/.test(a1.options[i].value)) {
              ultSes = a1.options[i].value;
              break;
            }
          }
          if (ultSes) {
            a1.value = ultSes;
            if (a1.onchange) a1.onchange();
          }
        }
      }
      if (panelId === 'informe') {
        const playerToSelect = targetJugador || new URLSearchParams(window.location.search).get('jugador');
        if (playerToSelect) {
          applyPlayerSelection(playerToSelect);
          // Reintento de seguridad a los 50ms por si el render original aún no completó
          setTimeout(() => applyPlayerSelection(playerToSelect), 50);
        }
      }
    } catch (e) {}

    return () => {
      Object.keys(chartsRef.current).forEach(k => {
        if (chartsRef.current[k]) {
          try { chartsRef.current[k].destroy(); } catch (e) {}
          delete chartsRef.current[k];
        }
      });
    };
  }, [panelId, renderFn, data, catActual, tema, targetJugador]);

  // Efecto complementario para actualizar la selección si targetJugador cambia dinámicamente
  useEffect(() => {
    if (!targetJugador) return;
    if (panelId === 'informe') {
      applyPlayerSelection(targetJugador);
    } else if (panelId === 'partido') {
      applyPartidoPlayerSelection(targetJugador);
    }
  }, [targetJugador, panelId]);

  return (
    <div
      ref={containerRef}
      className="panel visible"
      id="panel"
    />
  );
}
