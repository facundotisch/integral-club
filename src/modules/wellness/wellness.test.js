import { describe, it, expect } from 'vitest';
import { getFechaSimple } from './components/WellnessAdminPanel';

describe('Wellness Logic & Scoring (Regla: 0 = Bueno / 10 = Malo)', () => {
  // En todas las variables (Descanso, Fatiga, Estrés, Energía, Dolor), 0 es óptimo (10 pts de salud) y 10 es crítico (0 pts de salud)
  const getHealthScore = (val) => 10 - val;

  it('calcula 10 de salud (óptimo/verde) cuando el jugador marca 0', () => {
    expect(getHealthScore(0)).toBe(10);
  });

  it('calcula puntaje medio cuando el jugador marca 5', () => {
    expect(getHealthScore(5)).toBe(5);
  });

  it('calcula 0 de salud (alerta máxima/rojo) cuando el jugador marca 10', () => {
    expect(getHealthScore(10)).toBe(0);
  });

  it('asigna la categoría semafórica correcta para cada puntaje de salud', () => {
    const getColorCategory = (score) => {
      if (score >= 8.5) return 'verde-optimo';
      if (score >= 6.5) return 'lima-bueno';
      if (score >= 4.5) return 'amarillo-medio';
      if (score >= 2.5) return 'naranja-alerta';
      return 'rojo-critico';
    };

    // 0 en la variable -> 10 en salud -> verde
    expect(getColorCategory(getHealthScore(0))).toBe('verde-optimo');
    // 2 en la variable -> 8 en salud -> lima
    expect(getColorCategory(getHealthScore(2))).toBe('lima-bueno');
    // 5 en la variable -> 5 en salud -> amarillo
    expect(getColorCategory(getHealthScore(5))).toBe('amarillo-medio');
    // 7 en la variable -> 3 en salud -> naranja
    expect(getColorCategory(getHealthScore(7))).toBe('naranja-alerta');
    // 10 en la variable -> 0 en salud -> rojo crítico
    expect(getColorCategory(getHealthScore(10))).toBe('rojo-critico');
  });

  it('calcula el Índice Hooper Total (0 a 50) y asigna zona correcta', () => {
    const getHooperZone = (desc, fat, est, ene, dol) => {
      const total = desc + fat + est + ene + dol;
      if (total >= 23 || dol >= 6) return 'alerta-roja';
      if (total >= 11 || dol >= 4) return 'zona-amarilla';
      return 'zona-verde';
    };

    // Jugador 100% fresco (todos 0)
    expect(getHooperZone(0, 0, 0, 0, 0)).toBe('zona-verde');
    // Jugador con fatiga leve (total 8)
    expect(getHooperZone(2, 2, 1, 2, 1)).toBe('zona-verde');
    // Jugador con fatiga moderada (total 16)
    expect(getHooperZone(3, 4, 3, 4, 2)).toBe('zona-amarilla');
    // Jugador con sobrecarga o dolor agudo (dolor = 7)
    expect(getHooperZone(2, 3, 1, 2, 7)).toBe('alerta-roja');
    // Jugador con fatiga extrema general (total 35)
    expect(getHooperZone(7, 8, 6, 7, 7)).toBe('alerta-roja');
  });

  it('formatea el mensaje de WhatsApp adecuadamente sin emojis', () => {
    const formatWhatsApp = (jugador, descanso, fatiga, zonas) => {
      let msg = `*INTEGRAL CLUB - WELLNESS: ${jugador}* | Descanso: ${descanso}/10 | Fatiga: ${fatiga}/10 (0=Optimo)`;
      if (zonas.length > 0) {
        msg += ` | Molestias: ${zonas.join(', ')}`;
      }
      return msg;
    };

    const out = formatWhatsApp('Jugador 1', 0, 1, ['Isquiotibial Der']);
    expect(out).toContain('Jugador 1');
    expect(out).toContain('Descanso: 0/10');
    expect(out).toContain('Isquiotibial Der');
    expect(out).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
  });
});

describe('Wellness Mock Login & Session', () => {
  const DEMO_PLAYERS = [
    { displayName: 'Jugador 1', primaryCat: 'Reserva', pos: 'Defensor Central', dni: '1001' },
    { displayName: 'Jugador 2', primaryCat: 'Cuarta', pos: 'Volante Mixto', dni: '1002' },
    { displayName: 'Jugador 3', primaryCat: 'Séptima', pos: 'Jugador de Campo', dni: '1003' },
    { displayName: 'Jugador 4', primaryCat: 'Novena', pos: 'Delantero', dni: '1004' }
  ];

  const resolveMockLogin = (query, catalog = []) => {
    const q = query.trim().toLowerCase();
    const matchDemo = DEMO_PLAYERS.find(p => p.dni === query.trim() || p.displayName.toLowerCase().includes(q));
    if (matchDemo) return matchDemo;

    const matchCat = catalog.find(p => p.displayName.toLowerCase().includes(q));
    if (matchCat) return matchCat;

    return {
      displayName: query.trim() || 'Jugador 1',
      primaryCat: 'Reserva',
      pos: 'Jugador de Campo',
      photoUrl: null,
      dni: query.trim()
    };
  };

  it('autentica correctamente mediante DNI demo', () => {
    const user = resolveMockLogin('1001');
    expect(user.displayName).toBe('Jugador 1');
    expect(user.primaryCat).toBe('Reserva');
  });

  it('autentica correctamente mediante nombre demo', () => {
    const user = resolveMockLogin('jugador 4');
    expect(user.displayName).toBe('Jugador 4');
    expect(user.primaryCat).toBe('Novena');
  });

  it('genera un perfil mock válido si el usuario ingresa un nombre arbitrario', () => {
    const user = resolveMockLogin('Jugador Demo');
    expect(user.displayName).toBe('Jugador Demo');
    expect(user.primaryCat).toBe('Reserva');
    expect(user.pos).toBe('Jugador de Campo');
  });

  it('serializa y recupera la sesión de usuario en storage', () => {
    const sampleSession = { displayName: 'Jugador 1', primaryCat: 'Reserva', pos: 'Defensor Central' };
    const serialized = JSON.stringify(sampleSession);
    const parsed = JSON.parse(serialized);
    expect(parsed.displayName).toBe('Jugador 1');
    expect(parsed.primaryCat).toBe('Reserva');
  });
});

describe('Wellness Admin Manual Evaluation Entry', () => {
  it('construye un payload de evaluación manual rápida correctamente', () => {
    const createManualEntry = ({ nombre, categoria, posicion, metricas, zonasDolor, observaciones }) => {
      const totalHooper = metricas.descanso + metricas.fatiga + metricas.estres + metricas.energia + metricas.dolor;
      return {
        id: `manual_${Date.now()}`,
        fechaTexto: 'Hoy',
        jugador: { nombre, categoria, posicion },
        metricas,
        totalHooper,
        zonasDolor: zonasDolor || [],
        observaciones: observaciones || 'Carga manual DT'
      };
    };

    const entry = createManualEntry({
      nombre: 'Gonzalo Alcaraz',
      categoria: 'Cuarta',
      posicion: 'Volante',
      metricas: { descanso: 0, fatiga: 2, estres: 1, energia: 0, dolor: 0 },
      zonasDolor: []
    });

    expect(entry.jugador.nombre).toBe('Gonzalo Alcaraz');
    expect(entry.totalHooper).toBe(3); // 0+2+1+0+0 = 3
    expect(entry.observaciones).toBe('Carga manual DT');
  });

  it('detecta correctamente qué jugadores no respondieron (pendientes)', () => {
    const catalogMock = [
      { displayName: 'Naranjo L', primaryCat: 'Reserva', pos: 'Defensor' },
      { displayName: 'Aguirre S', primaryCat: 'Reserva', pos: 'Volante' },
      { displayName: 'Perez J', primaryCat: 'Reserva', pos: 'Delantero' },
      { displayName: 'Gomez M', primaryCat: 'Cuarta', pos: 'Arquero' }
    ];

    const registrosHoyMock = [
      { id: '1', jugador: { nombre: 'Naranjo L', categoria: 'Reserva' }, fecha: '2026-11-16' }
    ];

    const respondieronNames = new Set(registrosHoyMock.map(r => r.jugador.nombre.trim().toLowerCase()));

    const pendientesReserva = catalogMock
      .filter(p => p.primaryCat === 'Reserva')
      .filter(p => !respondieronNames.has(p.displayName.trim().toLowerCase()));

    expect(pendientesReserva.length).toBe(2);
    expect(pendientesReserva.map(p => p.displayName)).toEqual(['Aguirre S', 'Perez J']);
  });

  it('permite editar una evaluación existente actualizando sus métricas', () => {
    let registros = [
      {
        id: 'reg_101',
        jugador: { nombre: 'Aguirre S', categoria: 'Reserva' },
        metricas: { descanso: 5, fatiga: 5, estres: 4, energia: 4, dolor: 2 },
        totalHooper: 20
      }
    ];

    // Simular edición: se actualizan descanso y fatiga a 0 (óptimo)
    const idAEditar = 'reg_101';
    const metricasNuevas = { descanso: 0, fatiga: 0, estres: 0, energia: 0, dolor: 0 };
    const nuevoTotal = Object.values(metricasNuevas).reduce((a, b) => a + b, 0);

    registros = registros.map(r => {
      if (r.id === idAEditar) {
        return {
          ...r,
          metricas: metricasNuevas,
          totalHooper: nuevoTotal,
          editadoManualmente: true
        };
      }
      return r;
    });

    expect(registros[0].totalHooper).toBe(0);
    expect(registros[0].metricas.descanso).toBe(0);
    expect(registros[0].editadoManualmente).toBe(true);
  });

  it('permite eliminar un registro del listado', () => {
    let registros = [
      { id: 'reg_1', jugador: { nombre: 'Naranjo L' } },
      { id: 'reg_2', jugador: { nombre: 'Aguirre S' } }
    ];

    registros = registros.filter(r => r.id !== 'reg_1');
    expect(registros.length).toBe(1);
    expect(registros[0].id).toBe('reg_2');
  });

  it('formatea fechas en DD/MM/AAAA y nunca muestra "Hoy" ni la hora en la tabla', () => {
    expect(getFechaSimple('2026-11-16')).toBe('16/11/2026');
    expect(getFechaSimple('16/11/2026')).toBe('16/11/2026');
    // Si viene 'Hoy' con timestamp
    const ts = new Date('2026-11-16T12:30:00Z').toISOString();
    const formatted = getFechaSimple('Hoy', ts);
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(formatted).not.toContain('Hoy');
    expect(formatted).not.toContain('hs');
  });
});
