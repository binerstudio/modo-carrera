/* MODO CARRERA · calibración del motor v3 (sin navegador, en paralelo)
   Simula N partidos de liga (temporadas completas de 7 países, ida y vuelta) y pares de equipos de distinta fuerza,
   y compara cada estadística con su rango objetivo de ligas reales (verde = adentro, rojo = afuera).
   Nada se arma de antemano: cada partido se juega entero en la cancha con su propia semilla.
   Uso: node tests/calibrar-v3.mjs [partidosDeLiga=3000] [paresPorCategoria=150] [hilos=núcleos]
   Sale con código 1 si alguna estadística queda fuera de su rango.                                          */
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cargar, armar, resumen } from './v3-ligas.mjs';

if (!isMainThread) {
  const W = cargar(), L = armar(W), M = W.MCMotorV3;
  parentPort.on('message', lote => {
    const out = [];
    for (const [id, h, a, semilla] of lote) {
      try { out.push([id, resumen(M.simular(L.equipo(h), L.equipo(a), { semilla, cinta: false }))]); }
      catch (e) { out.push([id, { error: `${h} vs ${a} (${semilla}): ${e.message}` }]); }
    }
    parentPort.postMessage(out);
  });
} else {
  const N = +(process.argv[2] || 3000), NP = +(process.argv[3] || 150), HILOS = +(process.argv[4] || cpus().length);
  const W = cargar({ trampaRandom: false }), L = armar(W);
  const t0 = Date.now();
  /* partidos de liga: temporadas completas hasta llegar a N (cada temporada con semillas distintas) */
  const jobs = [], meta = [];
  for (let k = 0; jobs.length < N; k++) for (const [p, h, a] of L.fixture) { if (jobs.length >= N) break; const id = jobs.length; jobs.push([id, h, a, 100000 * (k + 1) + id]); meta.push({ tipo: 'liga', pais: p, h, a }); }
  /* pares por fuerza (GRL medio del XI): muy superior (+7 o más), superior (+3 a +6), parejo (menos de 1) */
  const g = new Map(); for (const cl of Object.values(L.ligas).flat()) g.set(cl, L.grlXI(cl));
  const lista = [...g.keys()].sort();
  const CAT = { muySuperior: d => d >= 7, superior: d => d >= 3 && d < 6, parejo: d => d >= 0 && d < 1 };
  for (const [cat, f] of Object.entries(CAT)) {
    let n = 0;
    for (let i = 0; i < lista.length && n < NP; i++) for (let j = 0; j < lista.length && n < NP; j++) {
      const A = lista[(i * 7) % lista.length], B = lista[(j * 13 + i) % lista.length];
      if (A === B || !f(g.get(A) - g.get(B))) continue;
      for (const local of [true, false]) { const id = jobs.length; jobs.push([id, local ? A : B, local ? B : A, 900000 + id]); meta.push({ tipo: cat, fuerte: A, local }); }
      n++;
    }
  }
  /* reparto entre hilos en lotes */
  const res = new Array(jobs.length);
  await new Promise((ok, mal) => {
    let sig = 0, vivos = 0; const LOTE = 20;
    for (let w = 0; w < HILOS; w++) {
      const wk = new Worker(new URL(import.meta.url)); vivos++;
      const dar = () => { if (sig >= jobs.length) { wk.terminate(); if (--vivos === 0) ok(); return; } const l = jobs.slice(sig, sig + LOTE); sig += LOTE; wk.postMessage(l); };
      wk.on('message', out => { for (const [id, r] of out) res[id] = r; dar(); if (process.stdout.isTTY) process.stdout.write(`\r${res.filter(Boolean).length}/${jobs.length}`); });
      wk.on('error', mal); dar();
    }
  });
  if (process.stdout.isTTY) process.stdout.write('\n');
  const errores = res.filter(r => r && r.error).map(r => r.error);
  /* ---------- estadísticas de liga ---------- */
  const liga = res.map((r, i) => [r, meta[i]]).filter(([r, m]) => m.tipo === 'liga' && r && !r.error);
  const n = liga.length, S = {};
  const add = (k, v) => S[k] = (S[k] || 0) + v;
  const marc = {};
  for (const [r, m] of liga) {
    const gl = r.h + r.a; add('goles', gl); add(r.h > r.a ? 'loc' : r.h === r.a ? 'emp' : 'vis', 1);
    for (const k of ['rem', 'arco', 'pases', 'ok', 'corners', 'faltas', 'am', 'rojas', 'pen', 'penGol', 'off', 'lat', 'cambios', 'lesiones']) add(k, r[k] ? r[k][0] + r[k][1] : 0);
    add('xg', r.xg[0] + r.xg[1]); add('enJuego', r.enJuego); add('km', r.km);
    /* posesión del mejor equipo (por GRL del XI) */
    const gh = g.get(m.h), ga = g.get(m.a); if (Math.abs(gh - ga) >= 2) { add('posMejor', gh > ga ? r.pos[0] : r.pos[1]); add('nPosMejor', 1); }
    const dif = Math.abs(r.h - r.a), k = r.h === r.a ? `${r.h}-${r.a}` : `${Math.max(r.h, r.a)}-${Math.min(r.h, r.a)}`;
    marc[k] = (marc[k] || 0) + 1; if (dif >= 4) add('goleada', 1); if (gl >= 7) add('siete', 1); if (gl >= 10) add('diez', 1);
  }
  const pct = x => x / n, pe = x => x / n / 2;
  const fuerza = {};
  for (const cat of Object.keys(CAT)) {
    const rs = res.map((r, i) => [r, meta[i]]).filter(([r, m]) => m.tipo === cat && r && !r.error);
    let gana = 0, empata = 0;
    for (const [r, m] of rs) { const gf = m.local ? r.h : r.a, gc = m.local ? r.a : r.h; if (gf > gc) gana++; else if (gf === gc) empata++; }
    fuerza[cat] = { partidos: rs.length, gana: rs.length ? gana / rs.length : 0, empata: rs.length ? empata / rs.length : 0 };
  }
  /* ---------- tabla: valor vs objetivo (rangos de ligas reales, aproximados) ---------- */
  const T = [
    ['Goles por partido', S.goles / n, 2.5, 2.8, 2],
    ['Local gana', pct(S.loc), .42, .46, '%'], ['Empate', pct(S.emp), .24, .28, '%'], ['Visitante gana', pct(S.vis), .28, .32, '%'],
    ['Remates por equipo', pe(S.rem), 12, 14, 1], ['Remates al arco', S.arco / S.rem, .35, .40, '%'], ['Conversión (goles/remates)', S.goles / S.rem, .085, .115, '%'],
    ['Pases por equipo', pe(S.pases), 400, 500, 0], ['Acierto de pases', S.ok / S.pases, .75, .85, '%'],
    ['Posesión del mejor equipo', (S.posMejor || 0) / (S.nPosMejor || 1) / 100, .50, .65, '%'],
    ['Córners por equipo', pe(S.corners), 4, 6, 1], ['Faltas por equipo', pe(S.faltas), 10, 13, 1], ['Amarillas por equipo', pe(S.am), 1.5, 2.5, 2],
    ['Rojas por partido', S.rojas / n, .1, .2, 3], ['Penales por partido', S.pen / n, .22, .33, 3], ['Offsides por equipo', pe(S.off), 1.6, 2.4, 2],
    ['0-0', (marc['0-0'] || 0) / n, .05, .10, '%'], ['1-0', (marc['1-0'] || 0) / n, .15, .22, '%'], ['2-1', (marc['2-1'] || 0) / n, .13, .19, '%'],
    ['Diferencia de 4 o más', (S.goleada || 0) / n, .015, .05, '%'], ['Partidos con 10+ goles', (S.diez || 0) / n, 0, .001, '%'],
    ['Muy superior (+7 GRL) gana', fuerza.muySuperior.gana, .65, .75, '%'], ['Superior (+3 a +6) gana', fuerza.superior.gana, .50, .63, '%'], ['Parejo (<1) gana', fuerza.parejo.gana, .33, .45, '%'],
    ['Ventaja de local (gana local − gana visitante)', pct(S.loc) - pct(S.vis), .08, .18, '%']
  ];
  const fmt = (v, d) => d === '%' ? (100 * v).toFixed(1) + '%' : (+v).toFixed(d);
  const VERDE = '\x1b[32m', ROJO = '\x1b[31m', FIN = '\x1b[0m';
  const filas = T.map(([nom, v, lo, hi, d]) => ({ estadistica: nom, valor: +(+v).toFixed(4), objetivo: [lo, hi], ok: v >= lo && v <= hi, texto: fmt(v, d), rango: `${fmt(lo, d)} – ${fmt(hi, d)}` }));
  const crece = fuerza.muySuperior.gana > fuerza.superior.gana && fuerza.superior.gana > fuerza.parejo.gana;
  filas.push({ estadistica: 'El % de victorias crece con la diferencia de fuerza', valor: crece ? 1 : 0, objetivo: [1, 1], ok: crece, texto: crece ? 'sí' : 'no', rango: 'sí' });
  console.log(`\nCALIBRACIÓN MOTOR v3 · ${n} partidos de liga + ${Object.values(fuerza).reduce((a, f) => a + f.partidos, 0)} por fuerza · ${HILOS} hilos · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log('Estadística'.padEnd(48) + 'Valor'.padStart(10) + '   Objetivo');
  for (const f of filas) console.log(`${f.ok ? VERDE + '✔' : ROJO + '✘'} ${f.estadistica.padEnd(46)}${f.texto.padStart(10)}   ${f.rango}${FIN}`);
  const info = { xgPorPartido: S.xg / n, lateralesPorEquipo: pe(S.lat), minutosEnJuego: S.enJuego / n, kmPorJugador: S.km / n, cambiosPorPartido: S.cambios / n, lesionesPorPartido: S.lesiones / n,
    conversionPenales: S.penGol / (S.pen || 1), sieteOMasGoles: (S.siete || 0) / n, marcadoresMasComunes: Object.entries(marc).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${(100 * v / n).toFixed(1)}%`), fuerza };
  console.log('informativo:', JSON.stringify(info));
  errores.slice(0, 10).forEach(e => console.log('ERROR:', e));
  mkdirSync('tests/out', { recursive: true });
  const fuera = filas.filter(f => !f.ok);
  writeFileSync('tests/out/calibracion-v3.json', JSON.stringify({ partidosLiga: n, pares: fuerza, segundos: (Date.now() - t0) / 1000, filas, info, errores }, null, 1));
  console.log(fuera.length || errores.length ? `FUERA DE RANGO: ${fuera.length} · errores: ${errores.length}` : 'TODO EN RANGO');
  process.exit(fuera.length || errores.length ? 1 : 0);
}
