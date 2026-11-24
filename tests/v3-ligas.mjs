/* MODO CARRERA · equipos y ligas para probar y calibrar el motor v3 (sin navegador)
   Mismo armado que tests/motor.mjs (motor v2): planteles de data/mundo.js y data/jugadores.js, XI 4-3-3 por GRL,
   ligas completas por país. Si un plantel de la base está incompleto se completa con jugadores genéricos algo
   inferiores (solo para las pruebas; no son datos reales y se nombran como "relleno"/"suplente genérico"). */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function cargar({ trampaRandom = true } = {}) {
  const ctx = { window: {} }; vm.createContext(ctx);
  for (const f of ['data/jugadores.js', 'data/mundo.js', 'js/motor/atributos.js']) vm.runInContext(readFileSync(f, 'utf8'), ctx);
  if (trampaRandom) vm.runInContext('Math.random=function(){throw new Error("Math.random usado")};', ctx);
  vm.runInContext(readFileSync('js/motor/motor-v3.js', 'utf8'), ctx);
  return ctx.window;
}

export function armar(W) {
  const MW = W.MC_WORLD, P = W.MC_PLAYERS, M = W.MCMotorV3;
  const byClub = new Map();
  const pais = i => String(MW.countries[i] || '').split(',')[0];
  const paisClub = new Map(MW.clubs.map(c => [c[0], pais(c[1])]));
  for (const r of MW.rows) { const c = MW.clubs[r[6]]; if (!c) continue; const k = c[0]; if (!byClub.has(k)) byClub.set(k, { country: pais(c[1]), rows: [] }); byClub.get(k).rows.push(r); }
  const pRows = new Map();
  for (const r of P.rows) { const k = P.clubs[r[6]]; if (!pRows.has(k)) pRows.set(k, []); pRows.get(k).push(r); }
  for (const [k, rows] of pRows) {
    let country = paisClub.get(k);
    if (!country) { const cnt = {}; rows.forEach(r => { const n = String(P.nats[r[4]] || ''); cnt[n] = (cnt[n] || 0) + 1; }); const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; country = top && top[1] / rows.length > .6 ? top[0] : '?'; }
    byClub.set(k, { country, rows });
  }
  const GRP = ['POR', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL'];
  const LIN = { arq: 'POR', def: 'DEF', med: 'MED', atq: 'DEL' };
  function equipo(name, tac) {
    const rows = byClub.get(name).rows.slice().sort((a, b) => b[2] - a[2]);
    const avg = rows.length ? rows.reduce((a, r) => a + r[2], 0) / rows.length : 60; let k = 0;
    const filler = g => [name + ' (relleno ' + (++k) + ')', g, Math.round(avg - 6), 25];
    const used = new Set(), xi = [];
    const roles = tac && tac.formation && tac.formation !== '4-3-3' ? M.rolesDe(tac.formation) : null;
    (roles || GRP).forEach((x, i) => { const g = roles ? (x === 'POR' ? 'POR' : LIN[M.LINEA_ROL[x]]) : x; const r = rows.find(y => !used.has(y) && y[1] === g) || filler(g); used.add(r); xi.push({ name: r[0], pos: r[1], grl: r[2], age: r[3] }); });
    const resto = rows.filter(r => !used.has(r)), gk = resto.find(r => r[1] === 'POR');
    const b = (gk ? [gk] : []).concat(resto.filter(r => r !== gk)).slice(0, 9); let s = 0;
    while (b.length < 7) b.push([name + ' (suplente genérico ' + (++s) + ')', ['POR', 'DEF', 'MED', 'DEL', 'DEF', 'MED', 'DEL'][b.length], Math.round(avg - 8), 24]);
    return { name, tac: Object.assign({ formation: '4-3-3' }, tac || {}), players: xi.concat(b.map(r => ({ name: r[0], pos: r[1], grl: r[2], age: r[3] }))) };
  }
  const grlXI = name => { const t = equipo(name); return t.players.slice(0, 11).reduce((a, p) => a + p.grl, 0) / 11; };
  /* ligas: los 20 primeros clubes (con 5+ jugadores en la base) de cada país, como en tests/motor.mjs */
  const PAISES = ['España', 'Inglaterra', 'Italia', 'Alemania', 'Francia', 'Argentina', 'Brasil'];
  const ligas = {};
  for (const p of PAISES) { const cl = [...byClub.entries()].filter(([, v]) => v.country === p && v.rows.length >= 5).map(([k]) => k).slice(0, 20); if (cl.length >= 8) ligas[p] = cl; }
  /* fixture de una temporada: todos contra todos, ida y vuelta */
  /* cada par juega ida y vuelta seguidos, en un orden mezclado fijo: así una muestra parcial no favorece a nadie de local */
  const pares = [];
  for (const [p, cl] of Object.entries(ligas)) for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) pares.push([p, cl[i], cl[j]]);
  const hs = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  pares.sort((x, y) => hs(x.join('|')) - hs(y.join('|')));
  const fixture = [];
  for (const [p, a, b] of pares) { fixture.push([p, a, b]); fixture.push([p, b, a]); }
  return { byClub, equipo, grlXI, ligas, fixture, clubs: [...byClub.keys()] };
}

/* resumen compacto de un partido para sumar */
export function resumen(r) {
  const s = r.stats;
  return { h: r.h, a: r.a, rem: s.remates, arco: s.alArco, pases: s.pases, ok: s.pasesOk, pos: s.posesion, corners: s.corners, faltas: s.faltas, am: s.amarillas, rojas: s.rojas,
    pen: s.penales, penGol: s.penalesGol, gkErr: s.golesErrorArquero || [0, 0], origen: s.origenGoles || {}, off: s.offsides, lat: s.laterales, xg: s.xg, enJuego: s.minutosEnJuego, cambios: s.cambios, lesiones: s.lesiones,
    km: r.jugadores.filter(j => j.pos !== 'POR' && j.entro === 0).reduce((a, j) => a + j.distancia, 0) / Math.max(1, r.jugadores.filter(j => j.pos !== 'POR' && j.entro === 0).length) / 1000 };
}
