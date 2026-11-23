/* MODO CARRERA · prueba del motor v3 · Etapa 1 (sin navegador)
   - N partidos (1000 por defecto) con planteles de la base, alineación 4-3-3 por GRL: ninguno debe fallar.
   - Coherencia: goles del marcador = eventos de gol, posiciones finitas y dentro de la cancha, posesión = 100 %.
   - Determinismo: misma semilla = mismo resultado (eventos y cinta); otra semilla = otro partido.
   - Sin Math.random: el contexto del motor tiene Math.random reemplazado por una trampa que hace fallar.
   - Tiempo por partido.
   - Estadísticas iniciales (goles, remates, pases, posesión…) SOLO INFORMADAS: todavía no están calibradas
     (eso es la etapa 4), así que no hacen fallar la prueba.
   Uso: node tests/motor-v3.mjs [partidos]                                                         */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
const N = +(process.argv[2] || 1000);
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['data/jugadores.js', 'data/mundo.js', 'js/motor/atributos.js']) vm.runInContext(readFileSync(f, 'utf8'), ctx);
let usoRandom = 0;
vm.runInContext('Math.random=function(){throw new Error("Math.random usado")};', ctx);
ctx.__contar = () => usoRandom++;
vm.runInContext(readFileSync('js/motor/motor-v3.js', 'utf8'), ctx);
const W = ctx.window.MC_WORLD, P = ctx.window.MC_PLAYERS, M = ctx.window.MCMotorV3;
if (!M || !ctx.window.MCAtributos) { console.log('FALLÓ: no se cargó MCMotorV3 o MCAtributos'); process.exit(1); }

/* planteles por club (igual que tests/motor.mjs) */
const byClub = new Map();
const pais = i => String(W.countries[i] || '').split(',')[0];
for (const r of W.rows) { const c = W.clubs[r[6]]; if (!c) continue; const k = c[0]; if (!byClub.has(k)) byClub.set(k, { country: pais(c[1]), rows: [] }); byClub.get(k).rows.push(r); }
const pRows = new Map();
for (const r of P.rows) { const k = P.clubs[r[6]]; if (!pRows.has(k)) pRows.set(k, []); pRows.get(k).push(r); }
for (const [k, rows] of pRows) byClub.set(k, { country: (byClub.get(k) || {}).country || '?', rows });
const ROLES = ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MCD', 'MC', 'MC', 'EI', 'DC', 'ED'], GRP = ['POR', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL'];
function equipo(name) {
  const rows = byClub.get(name).rows.slice().sort((a, b) => b[2] - a[2]);
  const used = new Set(), xi = [];
  const avg = rows.length ? rows.reduce((a, r) => a + r[2], 0) / rows.length : 60; let k = 0;
  const filler = g => [name + ' (relleno ' + (++k) + ')', g, Math.round(avg - 6), 25];
  GRP.forEach((g, i) => { const r = rows.find(x => !used.has(x) && x[1] === g) || filler(g); used.add(r); xi.push({ name: r[0], pos: r[1], grl: r[2], age: r[3], role: ROLES[i] }); });
  return { name, players: xi, tac: { formation: '4-3-3' } };
}
const clubs = [...byClub.entries()].filter(([, v]) => v.rows.length >= 11).map(([k]) => k).sort();

const out = { N, version: M.VERSION, fallas: [], errores: [], tiempo: {}, estadisticas: {}, determinismo: {}, nota: 'Estadísticas informativas: el motor v3 todavía no está calibrado (etapa 4).' };
const sum = { goles: 0, rem: 0, arco: 0, pases: 0, pasesOk: 0, altos: 0, corners: 0, lat: 0, quites: 0, inter: 0, gamb: 0, gambOk: 0, xg: 0, pos: [], loc: 0, emp: 0, vis: 0, enJuego: 0, dist: 0, nDist: 0, cab: 0, atajadas: 0, palos: 0, max: 0, marc: {} };
const tiempos = [];
const fuera = (x, y) => !(x >= -5 && x <= 110 && y >= -5 && y <= 73);
for (let i = 0; i < N; i++) {
  const a = clubs[(i * 7) % clubs.length], b = clubs[(i * 13 + 5) % clubs.length];
  if (a === b) continue;
  const t0 = performance.now();
  let r;
  try { r = M.simular(equipo(a), equipo(b), { semilla: 1000 + i, cintaCada: 5 }); }
  catch (e) { out.errores.push(`partido ${i} (${a} vs ${b}): ${e.message}`); continue; }
  tiempos.push(performance.now() - t0);
  /* coherencia */
  const gEv = [0, 0]; for (const ev of r.eventos) if (ev.tipo === 'gol') gEv[ev.equipo]++;
  if (gEv[0] !== r.h || gEv[1] !== r.a) out.errores.push(`partido ${i}: marcador ${r.h}-${r.a} no coincide con eventos ${gEv}`);
  if (r.stats.posesion[0] + r.stats.posesion[1] !== 100) out.errores.push(`partido ${i}: posesión no suma 100`);
  if (r.stats.pasesOk[0] > r.stats.pases[0] || r.stats.pasesOk[1] > r.stats.pases[1]) out.errores.push(`partido ${i}: más pases completos que intentados`);
  if (r.eventos.some(ev => !Number.isFinite(ev.min) || !ev.tipo)) out.errores.push(`partido ${i}: evento sin minuto o tipo`);
  const c = r.cinta, n = c.porCuadro, d = c.datos;
  if (d.length !== c.frames * n) out.errores.push(`partido ${i}: cinta de tamaño incorrecto`);
  for (let f = 0; f < c.frames; f += 7) { const o = f * n; if (fuera(d[o] / 10, d[o + 1] / 10)) { out.errores.push(`partido ${i}: pelota fuera de lugar en cuadro ${f}`); break; } let mal = false; for (let k = 5; k < n; k += 2) if (fuera(d[o + k] / 10, d[o + k + 1] / 10)) mal = true; if (mal) { out.errores.push(`partido ${i}: jugador fuera de lugar en cuadro ${f}`); break; } }
  if (r.jugadores.some(j => !Number.isFinite(j.distancia) || !Number.isFinite(j.energiaFinal))) out.errores.push(`partido ${i}: NaN en jugadores`);
  /* estadísticas */
  const s = r.stats, g = r.h + r.a;
  sum.goles += g; sum.max = Math.max(sum.max, g); sum.rem += s.remates[0] + s.remates[1]; sum.arco += s.alArco[0] + s.alArco[1]; sum.pases += s.pases[0] + s.pases[1]; sum.pasesOk += s.pasesOk[0] + s.pasesOk[1];
  sum.altos += s.pasesAltos[0] + s.pasesAltos[1]; sum.corners += s.corners[0] + s.corners[1]; sum.lat += s.laterales[0] + s.laterales[1]; sum.quites += s.quites[0] + s.quites[1]; sum.inter += s.intercepciones[0] + s.intercepciones[1];
  sum.gamb += s.gambetas[0] + s.gambetas[1]; sum.gambOk += s.gambetasOk[0] + s.gambetasOk[1]; sum.xg += s.xg[0] + s.xg[1]; sum.pos.push(s.posesion[0]); sum.enJuego += s.minutosEnJuego;
  sum.cab += s.cabezazos[0] + s.cabezazos[1]; sum.atajadas += s.atajadas[0] + s.atajadas[1]; sum.palos += s.palos[0] + s.palos[1];
  for (const j of r.jugadores) if (j.pos !== 'POR') { sum.dist += j.distancia; sum.nDist++; }
  if (r.h > r.a) sum.loc++; else if (r.h === r.a) sum.emp++; else sum.vis++;
  const k = r.h + '-' + r.a; sum.marc[k] = (sum.marc[k] || 0) + 1;
}
const n = tiempos.length || 1, f2 = x => +x.toFixed(2);
tiempos.sort((a, b) => a - b);
out.partidos = tiempos.length;
out.tiempo = { promedioMs: f2(tiempos.reduce((a, b) => a + b, 0) / n), medianaMs: f2(tiempos[Math.floor(n / 2)] || 0), maxMs: f2(tiempos[n - 1] || 0), totalSeg: f2(tiempos.reduce((a, b) => a + b, 0) / 1000) };
const posDesvio = Math.sqrt(sum.pos.reduce((a, p) => a + (p - 50) ** 2, 0) / n);
out.estadisticas = {
  golesPorPartido: f2(sum.goles / n), maxGoles: sum.max, local: f2(sum.loc / n), empate: f2(sum.emp / n), visitante: f2(sum.vis / n),
  rematesPorEquipo: f2(sum.rem / n / 2), alArcoPct: f2(sum.arco / (sum.rem || 1)), conversion: f2(sum.goles / (sum.rem || 1)), xgPorPartido: f2(sum.xg / n),
  pasesPorEquipo: f2(sum.pases / n / 2), precisionPases: f2(sum.pasesOk / (sum.pases || 1)), pasesAltosPct: f2(sum.altos / (sum.pases || 1)),
  posesionLocalPromedio: f2(sum.pos.reduce((a, b) => a + b, 0) / n), posesionDesvio: f2(posDesvio),
  cornersPorEquipo: f2(sum.corners / n / 2), lateralesPorEquipo: f2(sum.lat / n / 2), quitesPorEquipo: f2(sum.quites / n / 2), intercepcionesPorEquipo: f2(sum.inter / n / 2),
  gambetasPorEquipo: f2(sum.gamb / n / 2), gambetasExito: f2(sum.gambOk / (sum.gamb || 1)), cabezazosPorPartido: f2(sum.cab / n), atajadasPorPartido: f2(sum.atajadas / n), palosPorPartido: f2(sum.palos / n),
  minutosEnJuego: f2(sum.enJuego / n), kmPorJugadorDeCampo: f2(sum.dist / (sum.nDist || 1) / 1000),
  marcadores: Object.entries(sum.marc).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${(100 * v / n).toFixed(1)}%`)
};
/* determinismo */
const A = equipo(clubs[3]), B = equipo(clubs[11]);
const huella = r => createHash('sha256').update(JSON.stringify({ ...r, cinta: null }) + Buffer.from(r.cinta.datos.buffer).toString('base64')).digest('hex').slice(0, 16);
const h1 = [1, 2, 3].map(s => huella(M.simular(A, B, { semilla: s, cintaCada: 1 })));
const h2 = [1, 2, 3].map(s => huella(M.simular(equipo(clubs[3]), equipo(clubs[11]), { semilla: s, cintaCada: 1 })));
const hTxt = [huella(M.simular(A, B, { semilla: 'texto-77' })), huella(M.simular(A, B, { semilla: 'texto-77' }))];
out.determinismo = { mismaSemilla: h1.join(',') === h2.join(',') && hTxt[0] === hTxt[1], semillasDistintasDistinto: new Set(h1).size === 3, huellas: h1, huellaTexto: hTxt[0] };
if (!out.determinismo.mismaSemilla) out.fallas.push('No es determinista: misma semilla dio resultados distintos');
if (!out.determinismo.semillasDistintasDistinto) out.fallas.push('Semillas distintas dieron el mismo partido');
/* física de la pelota (sin jugadores) */
{
  const T = M._trayectoria;
  const raso = T({ x: 0, y: 34, vx: 15 }, 30), vs = raso.puntos.map(p => p[3]);
  const frena = vs.every((v, i) => i === 0 || v <= vs[i - 1] + 1e-9), para = vs[vs.length - 1] === 0, recorrido = raso.puntos[raso.puntos.length - 1][0];
  /* pase por arriba de 30 m en 2 s, con la misma compensación del aire que usa el motor */
  const Tv = 2, alto = T({ x: 0, y: 34, vx: M._vAire(30, Tv), vz: 9.81 * Tv / 2 }, 12), z = alto.puntos.map(p => p[2]), zmax = Math.max(...z);
  const p1 = alto.piques[0], p2 = alto.piques[1], picos = alto.alturas;
  out.fisica = { raso15: { recorridoM: +recorrido.toFixed(1), frenaSiempre: frena, sedetiene: para }, alto: { alturaMaxM: +zmax.toFixed(2), primerPiqueM: p1, segundoPiqueM: p2, alturasPicos: picos.slice(0, 4).map(x => +x.toFixed(2)) }, velPaseRaso: { '10m': +M._velPaseRaso(10).toFixed(1), '30m': +M._velPaseRaso(30).toFixed(1) } };
  if (!frena || !para) out.fallas.push('Física: el pase raso no frena o no se detiene');
  if (!(recorrido > 20 && recorrido < 120)) out.fallas.push(`Física: recorrido del raso fuera de lo razonable (${recorrido})`);
  if (!(Math.abs(p1 - 30) < 1)) out.fallas.push(`Física: el pase por arriba cae lejos de lo esperado (${p1} m, esperado 30)`);
  if (!(p2 > p1) || !(picos.length >= 2 && picos.every((h, i) => i === 0 || h < picos[i - 1]))) out.fallas.push('Física: los piques no pierden altura');
  if (z.some(h => h < 0)) out.fallas.push('Física: la pelota quedó bajo el piso');
}
/* atributos: se usan los de MCAtributos (estimados) y cambian velocidad y aceleración */
{
  const r = M.simular(A, B, { semilla: 9, cinta: false });
  const origen = new Set(r.jugadores.map(j => j.origenAtributos)), vmax = r.jugadores.filter(j => j.pos !== 'POR').map(j => j.vmax);
  out.atributos = { origen: [...origen], vmaxMin: Math.min(...vmax), vmaxMax: Math.max(...vmax), sinCinta: r.cinta === null };
  if (!origen.has('estimado')) out.fallas.push('No se usaron los atributos de MCAtributos');
  if (Math.max(...vmax) - Math.min(...vmax) < .3) out.fallas.push('La velocidad no depende de los atributos');
  /* sin MCAtributos (contexto aislado): usa el GRL y no falla */
  const c2 = { window: {} }; vm.createContext(c2); vm.runInContext(readFileSync('js/motor/motor-v3.js', 'utf8'), c2);
  const r2 = c2.window.MCMotorV3.simular(A, B, { semilla: 9, cinta: false });
  out.atributos.sinMCAtributos = { ok: Number.isFinite(r2.h), origen: r2.jugadores[0].origenAtributos };
  if (!Number.isFinite(r2.h) || r2.jugadores[0].origenAtributos !== 'grl') out.fallas.push('Sin MCAtributos el motor no funciona');
}
/* un partido de ejemplo guardado para inspección (sin la cinta completa) */
const ej = M.simular(A, B, { semilla: 2026 });
out.ejemplo = { partido: `${ej.local} ${ej.h}-${ej.a} ${ej.visitante}`, stats: ej.stats, goles: ej.eventos.filter(e => e.tipo === 'gol'), remates: ej.eventos.filter(e => e.tipo === 'remate').slice(0, 10), cuadros: ej.cinta.frames, hz: ej.cinta.hz, cuadro100: M.cuadro(ej.cinta, 100) };
if (out.errores.length) out.fallas.push(`${out.errores.length} partidos con errores`);
if (out.partidos < N * 0.95) out.fallas.push(`se jugaron solo ${out.partidos} de ${N}`);
if (usoRandom) out.fallas.push('se usó Math.random');

mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/motor-v3.json', JSON.stringify(out, null, 1));
console.log(`MOTOR v3 (etapa 1) · ${out.fallas.length ? 'FALLÓ' : 'OK'} · ${out.partidos} partidos sin errores: ${out.errores.length === 0 ? 'sí' : 'no'}`);
console.log('tiempo por partido', JSON.stringify(out.tiempo));
console.log('determinismo', out.determinismo.mismaSemilla ? 'OK' : 'FALLÓ', '· semillas distintas →', out.determinismo.semillasDistintasDistinto ? 'partidos distintos' : 'IGUALES', '· huellas', h1.join(' '));
console.log('estadísticas (solo informativas, sin calibrar):');
for (const [k, v] of Object.entries(out.estadisticas)) console.log('  ', k, Array.isArray(v) ? v.join(' · ') : v);
console.log('física', JSON.stringify(out.fisica));
console.log('atributos', JSON.stringify(out.atributos));
console.log('ejemplo:', out.ejemplo.partido);
out.errores.slice(0, 10).forEach(e => console.log('ERROR:', e));
out.fallas.forEach(f => console.log('FALLA:', f));
process.exit(out.fallas.length ? 1 : 0);
