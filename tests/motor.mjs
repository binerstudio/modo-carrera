/* MODO CARRERA · validación masiva del motor v2 (sin navegador)
   - Ligas completas (ida y vuelta) con planteles reales de la base, alineación 4-3-3 por GRL.
   - Compara promedios con rangos de referencia APROXIMADOS del fútbol profesional.
   - Pruebas de causa y efecto: cada factor debe mover el resultado en la dirección esperada.
   - Determinismo: misma semilla = mismos resultados.
   Uso: node tests/motor.mjs [partidosPorPrueba]                                              */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
const N = +(process.argv[2] || 1500);
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['data/jugadores.js', 'data/mundo.js', 'js/motor/atributos.js', 'js/motor/motor-v2.js']) vm.runInContext(readFileSync(f, 'utf8'), ctx);
const W = ctx.window.MC_WORLD, P = ctx.window.MC_PLAYERS, M = ctx.window.MCMotor;
const rng = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

/* planteles por club */
const byClub = new Map();
const pais = i => String(W.countries[i] || '').split(',')[0];
const paisClub = new Map(W.clubs.map(c => [c[0], pais(c[1])]));
for (const r of W.rows) { const c = W.clubs[r[6]]; if (!c) continue; const k = c[0]; if (!byClub.has(k)) byClub.set(k, { country: pais(c[1]), rows: [] }); byClub.get(k).rows.push(r); }
/* planteles de jugadores.js (ligas grandes y Argentina); los clubes sin país en la base mundial se asignan por la nacionalidad mayoritaria */
const pRows = new Map();
for (const r of P.rows) { const k = P.clubs[r[6]]; if (!pRows.has(k)) pRows.set(k, []); pRows.get(k).push(r); }
for (const [k, rows] of pRows) {
  let country = paisClub.get(k);
  if (!country) { const cnt = {}; rows.forEach(r => { const n = String(P.nats[r[4]] || ''); cnt[n] = (cnt[n] || 0) + 1; }); const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; country = top && top[1] / rows.length > .6 ? top[0] : '?'; }
  byClub.set(k, { country, rows });
}
const ROLES = ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MCD', 'MC', 'MC', 'EI', 'DC', 'ED'], GRP = ['POR', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL'];
function equipo(name, opts = {}) {
  const rows = byClub.get(name).rows.slice().sort((a, b) => b[2] - a[2]);
  const used = new Set(), xi = [];
  /* si el plantel de la base está incompleto se rellena (como hace el juego) con jugadores genéricos algo inferiores */
  const avg = rows.length ? rows.reduce((a, r) => a + r[2], 0) / rows.length : 60; let k = 0;
  const filler = g => [name + ' (relleno ' + (++k) + ')', g, Math.round(avg - 6), 25];
  GRP.forEach((g, i) => { let r = rows.find(x => !used.has(x) && x[1] === g) || filler(g); used.add(r); xi.push({ name: r[0], pos: r[1], grl: r[2], age: r[3], role: ROLES[i], fit: opts.fit, mor: opts.mor }); });
  const rest = rows.filter(r => !used.has(r)); while (rest.length < 7) rest.push(filler(['POR', 'DEF', 'DEF', 'MED', 'MED', 'DEL', 'DEL'][rest.length]));
  const bench = rest.slice(0, 7).map(r => ({ name: r[0], pos: r[1], grl: r[2], age: r[3] }));
  return { name, players: xi.concat(bench), tac: opts.tac, dt: opts.dt, quimica: opts.quimica };
}
const grlXI = t => t.players.slice(0, 11).reduce((a, p) => a + p.grl, 0) / 11;

/* acumulador de estadísticas */
function acc() { return { n: 0, goles: 0, loc: 0, emp: 0, vis: 0, tiros: 0, alArco: 0, corners: 0, faltas: 0, amarillas: 0, rojas: 0, offsides: 0, penales: 0, var: 0, anulados: 0, errores: 0, arbitrales: 0, lesiones: 0, xg: 0, dif5: 0, max: 0, marcadores: {} }; }
function add(A, r) {
  A.n++; const g = r.h + r.a; A.goles += g; if (r.h > r.a) A.loc++; else if (r.h === r.a) A.emp++; else A.vis++;
  A.tiros += r.shots[0] + r.shots[1]; A.alArco += r.on[0] + r.on[1]; A.corners += r.corners[0] + r.corners[1]; A.faltas += r.fouls[0] + r.fouls[1];
  A.amarillas += r.yellows[0] + r.yellows[1]; A.rojas += r.reds[0] + r.reds[1]; A.offsides += r.offsides[0] + r.offsides[1]; A.penales += r.v2.penales;
  A.var += r.v2.var.revisiones; A.anulados += r.v2.var.anulados; A.errores += r.v2.errores.o + r.v2.errores.r; A.arbitrales += r.v2.arbitrales; A.lesiones += r.v2.lesiones;
  A.xg += r.xg[0] + r.xg[1]; if (Math.abs(r.h - r.a) >= 5) A.dif5++; A.max = Math.max(A.max, g); const k = r.h + '-' + r.a; A.marcadores[k] = (A.marcadores[k] || 0) + 1;
}
function resumen(A) {
  const n = A.n || 1, f = x => +(x / n).toFixed(3);
  const top = Object.entries(A.marcadores).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${(100 * v / n).toFixed(1)}%`);
  return { partidos: A.n, golesPP: f(A.goles), local: f(A.loc), empate: f(A.emp), visitante: f(A.vis), tirosPorEquipo: +(A.tiros / n / 2).toFixed(2), alArcoPct: +(A.alArco / A.tiros).toFixed(3), conversion: +((A.goles) / A.tiros).toFixed(3),
    cornersPorEquipo: +(A.corners / n / 2).toFixed(2), faltasPorEquipo: +(A.faltas / n / 2).toFixed(2), amarillasPorEquipo: +(A.amarillas / n / 2).toFixed(2), rojasPP: f(A.rojas), offsidesPorEquipo: +(A.offsides / n / 2).toFixed(2),
    penalesPP: f(A.penales), varPP: f(A.var), anuladosPP: f(A.anulados), erroresPP: f(A.errores), arbitralesPP: f(A.arbitrales), lesionesPP: f(A.lesiones), xgPP: f(A.xg), goleadas5Pct: +(A.dif5 / n).toFixed(4), maxGoles: A.max, marcadores: top };
}
/* rangos de referencia aproximados (ligas profesionales; promedios por partido) */
const RANGO = { golesPP: [2.2, 3.0], local: [.38, .52], empate: [.20, .32], visitante: [.24, .38], tirosPorEquipo: [9, 15], alArcoPct: [.28, .42], conversion: [.08, .14],
  cornersPorEquipo: [3.5, 6.5], faltasPorEquipo: [9, 15], amarillasPorEquipo: [1.3, 2.8], rojasPP: [.04, .3], offsidesPorEquipo: [1, 3.2], penalesPP: [.15, .45], lesionesPP: [.1, .6], goleadas5Pct: [0, .03] };

const out = { N, ligas: {}, causa: [], fallas: [] };
/* 1) ligas completas */
const PAISES = ['España', 'Inglaterra', 'Italia', 'Alemania', 'Francia', 'Argentina', 'Brasil'];
const TOT = acc(); let seed = 1;
for (const pais of PAISES) {
  const clubs = [...byClub.entries()].filter(([, v]) => v.country === pais && v.rows.length >= 5).map(([k]) => k).slice(0, 20);
  if (clubs.length < 8) { out.ligas[pais] = 'sin datos suficientes'; continue; }
  const T = clubs.map(c => equipo(c)), A = acc(), tabla = new Map(clubs.map(c => [c, 0]));
  for (const h of T) for (const a of T) if (h !== a) { const r = M.simular(h, a, { rng: rng(seed++) }); add(A, r); add(TOT, r); tabla.set(h.name, tabla.get(h.name) + (r.h > r.a ? 3 : r.h === r.a ? 1 : 0)); tabla.set(a.name, tabla.get(a.name) + (r.a > r.h ? 3 : r.h === r.a ? 1 : 0)); }
  /* el más fuerte por GRL debería terminar arriba en promedio: correlación GRL-puntos */
  const xs = T.map(grlXI), ys = T.map(t => tabla.get(t.name)), mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  const cor = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  out.ligas[pais] = { ...resumen(A), equipos: T.length, correlacionGRLPuntos: +cor.toFixed(3), campeon: [...tabla.entries()].sort((a, b) => b[1] - a[1])[0] };
  if (cor < .5) out.fallas.push(`${pais}: la tabla casi no depende de la calidad (correlación ${cor.toFixed(2)})`);
}
out.total = resumen(TOT);
for (const [k, [lo, hi]] of Object.entries(RANGO)) { const v = out.total[k]; if (!(v >= lo && v <= hi)) out.fallas.push(`${k} = ${v} fuera del rango de referencia [${lo}, ${hi}]`); }

/* 2) causa y efecto: A vs B con un solo factor distinto */
const E = (byClub.has('Real Madrid') ? 'Real Madrid' : [...byClub.keys()][0]), BASE = 'Getafe';
function serie(fa, fb, opt = {}, n = N) { const A = acc(); let gf = 0, gc = 0, pts = 0, tiros = 0; for (let i = 0; i < n; i++) { const loc = i % 2 === 0; const a = fa(), b = fb(); const r = M.simular(loc ? a : b, loc ? b : a, { rng: rng(900000 + i), ...opt }); add(A, r); const mg = loc ? r.h : r.a, og = loc ? r.a : r.h; gf += mg; gc += og; pts += mg > og ? 3 : mg === og ? 1 : 0; tiros += loc ? r.shots[0] : r.shots[1]; } return { gf: +(gf / n).toFixed(3), gc: +(gc / n).toFixed(3), pts: +(pts / n).toFixed(3), tiros: +(tiros / n).toFixed(2), tarjetas: +((A.amarillas + A.rojas) / n).toFixed(2), errores: +(A.errores / n).toFixed(3), golesPP: +(A.goles / n).toFixed(3) }; }
const CL = byClub.has(BASE) ? BASE : [...byClub.keys()][5];
function caso(nombre, a, b, campo, mayor, nota) { const ok = mayor ? a[campo] > b[campo] : a[campo] < b[campo]; out.causa.push({ prueba: nombre, campo, con: a[campo], sin: b[campo], ok, nota }); if (!ok) out.fallas.push(`Causa/efecto: ${nombre} (${campo}: ${a[campo]} vs ${b[campo]})`); }
const eq = (o = {}) => () => equipo(CL, o), rival = () => equipo(CL);
const base = serie(eq(), rival);
caso('Mejor estado físico (95 vs 60)', serie(eq({ fit: 95 }), rival), serie(eq({ fit: 60 }), rival), 'pts', true);
caso('Moral alta (95 vs 40)', serie(eq({ mor: 95 }), rival), serie(eq({ mor: 40 }), rival), 'pts', true);
caso('Entrenador bueno (88 vs 52)', serie(eq({ dt: 88 }), rival), serie(eq({ dt: 52 }), rival), 'pts', true);
caso('Química alta (1 vs 0.2)', serie(eq({ quimica: 1 }), rival), serie(eq({ quimica: .2 }), rival), 'pts', true);
caso('Táctica ofensiva genera más remates', serie(eq({ tac: { style: 'Ofensivo', mentality: 75, width: 60, depth: 65, pressing: 60, rhythm: 65, formation: '4-3-3' } }), rival), base, 'tiros', true);
caso('Táctica defensiva concede menos', serie(eq({ tac: { style: 'Defensivo', mentality: 25, width: 45, depth: 30, pressing: 40, rhythm: 40, formation: '5-3-2' } }), rival), base, 'gc', false);
caso('Lluvia: más errores individuales', serie(eq(), rival, { clima: 'Lluvia', cesped: 'Irregular' }), serie(eq(), rival, { clima: 'Despejado', cesped: 'Perfecto' }), 'errores', true);
caso('Partido decisivo: más tarjetas', serie(eq(), rival, { importancia: 1.4 }), serie(eq(), rival, { importancia: 1 }), 'tarjetas', true);
caso('Equipo superior gana más', serie(() => equipo(E), rival), base, 'pts', true);
/* jugar fuera de puesto: delanteros como defensores */
const fuera = () => { const t = equipo(CL); const xi = t.players; const d = xi.slice(8, 11).map(p => ({ ...p })), df = xi.slice(1, 4).map(p => ({ ...p })); for (let i = 0; i < 3; i++) { xi[1 + i] = { ...d[i], role: 'DFC' }; xi[8 + i] = { ...df[i], role: ['EI', 'DC', 'ED'][i] }; } return t; };
/* nota: en simulación sin interfaz el grupo de la línea lo da la posición del jugador; se fuerza con g */
caso('Localía da ventaja', (() => { const A = acc(); let p = 0; for (let i = 0; i < N; i++) { const r = M.simular(equipo(CL), equipo(CL), { rng: rng(500000 + i) }); p += r.h > r.a ? 3 : r.h === r.a ? 1 : 0; } return { pts: p / N }; })(), (() => { const A = acc(); let p = 0; for (let i = 0; i < N; i++) { const r = M.simular(equipo(CL), equipo(CL), { rng: rng(500000 + i) }); p += r.a > r.h ? 3 : r.h === r.a ? 1 : 0; } return { pts: p / N }; })(), 'pts', true);

/* 3) determinismo */
const h1 = createHash('sha256').update(JSON.stringify([0, 1, 2, 3, 4].map(i => M.simular(equipo(CL), equipo(E), { rng: rng(77 + i) })))).digest('hex').slice(0, 16);
const h2 = createHash('sha256').update(JSON.stringify([0, 1, 2, 3, 4].map(i => M.simular(equipo(CL), equipo(E), { rng: rng(77 + i) })))).digest('hex').slice(0, 16);
out.determinismo = { h1, h2, ok: h1 === h2 }; if (h1 !== h2) out.fallas.push('No es determinista');

mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/motor-v2.json', JSON.stringify(out, null, 1));
console.log(`MOTOR v2 · ${out.fallas.length ? 'FALLÓ' : 'OK'} · ${out.total.partidos} partidos de liga + pruebas de ${N} partidos`);
console.log('TOTAL', JSON.stringify(out.total));
for (const [k, v] of Object.entries(out.ligas)) console.log(k, typeof v === 'string' ? v : `golesPP ${v.golesPP} L/E/V ${v.local}/${v.empate}/${v.visitante} corr ${v.correlacionGRLPuntos} campeón ${v.campeon[0]} (${v.campeon[1]})`);
for (const c of out.causa) console.log(c.ok ? '  ✔' : '  ✘', c.prueba, c.campo, c.con, 'vs', c.sin);
console.log('determinismo', out.determinismo.ok ? 'OK' : 'FALLÓ');
out.fallas.forEach(f => console.log('FALLA:', f));
process.exit(out.fallas.length ? 1 : 0);
