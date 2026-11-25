/* MODO CARRERA · prueba del motor v3 · Etapas 1, 2 y 3 (sin navegador)
   Etapa 3: faltas, tarjetas, penales, offsides, córners, lesiones y cambios en rangos reales; límites de cambios y de jugadores; la expulsión baja el rendimiento.
   Etapa 2: forma de equipo dentro de rangos reales y causa-efecto de la táctica (ver más abajo).
   - N partidos (1000 por defecto) con planteles de la base, alineación 4-3-3 por GRL: ninguno debe fallar.
   - Coherencia: goles del marcador = eventos de gol, posiciones finitas y dentro de la cancha, posesión = 100 %.
   - Determinismo: misma semilla = mismo resultado (eventos y cinta); otra semilla = otro partido.
   - Sin Math.random: el contexto del motor tiene Math.random reemplazado por una trampa que hace fallar.
   - Tiempo por partido.
   - Etapa 4 (calibración): los N partidos son de liga (temporadas de 7 países, ida y vuelta, como tests/motor.mjs) y sus
     estadísticas tienen que quedar en los rangos de ligas reales (los de tests/motor.mjs para v2 cuando existen); además
     fuerza (el mejor gana más, pero no siempre) y ventaja de local moderada. Se suman 150 partidos entre clubes de todo
     el mundo solo para probar que ningún plantel hace fallar al motor.
   Uso: node tests/motor-v3.mjs [partidosDeLiga] [partidosPorSerieTactica] [paresPorCategoriaDeFuerza]                                                         */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { armar } from './v3-ligas.mjs';
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
const GRUPO_LINEA = { arq: 'POR', def: 'DEF', med: 'MED', atq: 'DEL' };
function equipo(name, tac) {
  const rows = byClub.get(name).rows.slice().sort((a, b) => b[2] - a[2]);
  if (tac && tac.formation && tac.formation !== '4-3-3') {
    /* otra formación: cada puesto con un jugador de su línea, según los roles que da el motor */
    const roles = M.rolesDe(tac.formation), used = new Set(), xi = []; let k = 0;
    const avg = rows.reduce((a, r) => a + r[2], 0) / rows.length;
    for (const rol of roles) { const g = rol === 'POR' ? 'POR' : GRUPO_LINEA[M.LINEA_ROL[rol]]; const r = rows.find(x => !used.has(x) && x[1] === g) || rows.find(x => !used.has(x) && x[1] !== 'POR') || [name + ' (relleno ' + (++k) + ')', g, Math.round(avg - 6), 25]; used.add(r); xi.push({ name: r[0], pos: r[1], grl: r[2], age: r[3], role: rol }); }
    return { name, players: xi.concat(banco(name, rows, used)), tac };
  }
  const used = new Set(), xi = [];
  const avg = rows.length ? rows.reduce((a, r) => a + r[2], 0) / rows.length : 60; let k = 0;
  const filler = g => [name + ' (relleno ' + (++k) + ')', g, Math.round(avg - 6), 25];
  GRP.forEach((g, i) => { const r = rows.find(x => !used.has(x) && x[1] === g) || filler(g); used.add(r); xi.push({ name: r[0], pos: r[1], grl: r[2], age: r[3], role: ROLES[i] }); });
  return { name, players: xi.concat(banco(name, rows, used)), tac: Object.assign({ formation: '4-3-3' }, tac || {}) };
}
/* banco: los demás jugadores del plantel (hasta 9, con un arquero si hay); si el plantel de la base es corto se completa
   hasta 7 con suplentes genéricos algo inferiores, solo para la prueba (igual que hace tests/motor.mjs con el motor v2) */
function banco(name, rows, used) {
  const resto = rows.filter(r => !used.has(r)), gk = resto.find(r => r[1] === 'POR');
  const b = (gk ? [gk] : []).concat(resto.filter(r => r !== gk)).slice(0, 9);
  const avg = rows.length ? rows.reduce((a, r) => a + r[2], 0) / rows.length : 60; let k = 0;
  while (b.length < 7) b.push([name + ' (suplente genérico ' + (++k) + ')', ['POR', 'DEF', 'MED', 'DEL', 'DEF', 'MED', 'DEL'][b.length], Math.round(avg - 8), 24]);
  return b.map(r => ({ name: r[0], pos: r[1], grl: r[2], age: r[3] }));
}
const clubs = [...byClub.entries()].filter(([, v]) => v.rows.length >= 11).map(([k]) => k).sort();
/* partidos de liga (mismo armado que la calibración) + 150 entre clubes de todo el mundo (solo robustez) */
const LG = armar(ctx.window);
const PARTIDOS = [];
for (let i = 0; i < N; i++) { const [p, h, a] = LG.fixture[i % LG.fixture.length]; PARTIDOS.push({ h, a, liga: true, semilla: 1000 + i }); }
for (let i = 0; i < 150; i++) { const a = clubs[(i * 7) % clubs.length], b = clubs[(i * 13 + 5) % clubs.length]; if (a !== b) PARTIDOS.push({ h: a, a: b, liga: false, semilla: 500000 + i }); }
const g2 = new Map();

const out = { N, version: M.VERSION, fallas: [], errores: [], tiempo: {}, estadisticas: {}, determinismo: {}, nota: 'Estadísticas de los partidos de liga (etapa 4: calibradas y verificadas contra rangos reales).' };
const sum = { goles: 0, rem: 0, arco: 0, pases: 0, pasesOk: 0, altos: 0, corners: 0, lat: 0, quites: 0, inter: 0, gamb: 0, gambOk: 0, xg: 0, pos: [], loc: 0, emp: 0, vis: 0, enJuego: 0, dist: 0, nDist: 0, cab: 0, atajadas: 0, palos: 0, max: 0, marc: {} };
const tiempos = [];
const REG = { faltas: 0, amarillas: 0, rojas: 0, penales: 0, penalesGol: 0, offsides: 0, corners: 0, lesiones: 0, cambios: 0, tirosLibres: 0, tirosLibresDirectos: 0, ventajas: 0, descuento1: 0, descuento2: 0, suspendidos: 0, maxCambios: 0, maxVentanas: 0, minEnCancha: 11 };
const FORMA = { con: { n: 0, largo: 0, ancho: 0, dm: 0, ma: 0, alin: 0 }, sin: { n: 0, largo: 0, ancho: 0, dm: 0, ma: 0, alin: 0 } };
const fuera = (x, y) => !(x >= -5 && x <= 110 && y >= -5 && y <= 73);
let nLiga = 0;
for (let i = 0; i < PARTIDOS.length; i++) {
  const { h: a, a: b, liga, semilla } = PARTIDOS[i];
  const t0 = performance.now();
  let r;
  try { r = M.simular(equipo(a), equipo(b), { semilla, cintaCada: 5 }); }
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
  for (let f = 0; f < c.frames; f += 7) { const o = f * n; if (fuera(d[o] / 10, d[o + 1] / 10)) { out.errores.push(`partido ${i}: pelota fuera de lugar en cuadro ${f}`); break; } let mal = false; for (let k = 5; k < n; k += 2) if (d[o + k] !== -32768 && fuera(d[o + k] / 10, d[o + k + 1] / 10)) mal = true; if (mal) { out.errores.push(`partido ${i}: jugador fuera de lugar en cuadro ${f}`); break; } }
  if (r.jugadores.some(j => !Number.isFinite(j.distancia) || !Number.isFinite(j.energiaFinal))) out.errores.push(`partido ${i}: NaN en jugadores`);
  /* estadísticas (solo de los partidos de liga) */
  const s = r.stats, g = r.h + r.a;
  if (liga) {
  nLiga++;
  if (!g2.has(a)) g2.set(a, LG.grlXI(a)); if (!g2.has(b)) g2.set(b, LG.grlXI(b));
  if (Math.abs(g2.get(a) - g2.get(b)) >= 2) { sum.posMejor = (sum.posMejor || 0) + (g2.get(a) > g2.get(b) ? s.posesion[0] : s.posesion[1]); sum.nPosMejor = (sum.nPosMejor || 0) + 1; }
  sum.gkErr = (sum.gkErr || 0) + (s.golesErrorArquero ? s.golesErrorArquero[0] + s.golesErrorArquero[1] : 0); sum.origen = sum.origen || {}; for (const [o, v] of Object.entries(s.origenGoles || {})) sum.origen[o] = (sum.origen[o] || 0) + v;
  sum.goles += g; sum.max = Math.max(sum.max, g); sum.rem += s.remates[0] + s.remates[1]; sum.arco += s.alArco[0] + s.alArco[1]; sum.pases += s.pases[0] + s.pases[1]; sum.pasesOk += s.pasesOk[0] + s.pasesOk[1];
  sum.altos += s.pasesAltos[0] + s.pasesAltos[1]; sum.corners += s.corners[0] + s.corners[1]; sum.lat += s.laterales[0] + s.laterales[1]; sum.quites += s.quites[0] + s.quites[1]; sum.inter += s.intercepciones[0] + s.intercepciones[1];
  sum.gamb += s.gambetas[0] + s.gambetas[1]; sum.gambOk += s.gambetasOk[0] + s.gambetasOk[1]; sum.xg += s.xg[0] + s.xg[1]; sum.pos.push(s.posesion[0]); sum.enJuego += s.minutosEnJuego;
  sum.cab += s.cabezazos[0] + s.cabezazos[1]; sum.atajadas += s.atajadas[0] + s.atajadas[1]; sum.palos += s.palos[0] + s.palos[1];
  for (const j of r.jugadores) if (j.pos !== 'POR') { sum.dist += j.distancia; sum.nDist++; }
  for (const e of [0, 1]) for (const f of ['con', 'sin']) { const F = r.forma[e][f], A = FORMA[f]; if (!F.muestras) continue; A.n++; A.largo += F.largo; A.ancho += F.ancho; A.dm += F.entreLineas[0]; A.ma += F.entreLineas[1]; A.alin += F.alineacionLinea; }
  if (!r.forma.every(t => Number.isFinite(t.con.largo) && Number.isFinite(t.sin.largo))) out.errores.push(`partido ${i}: medición de forma inválida`);
  /* reglas (etapa 3) */
  for (const k of ['faltas', 'amarillas', 'rojas', 'penales', 'penalesGol', 'offsides', 'corners', 'lesiones', 'cambios', 'tirosLibres', 'tirosLibresDirectos', 'ventajas']) REG[k] += s[k][0] + s[k][1];
  REG.descuento1 += s.descuento[0]; REG.descuento2 += s.descuento[1];
  }
  if (r.suspendido) REG.suspendidos++;
  REG.maxCambios = Math.max(REG.maxCambios, ...s.cambios); REG.maxVentanas = Math.max(REG.maxVentanas, ...s.ventanas); REG.minEnCancha = Math.min(REG.minEnCancha, ...s.minimoEnCancha);
  if (s.cambios.some(x => x > 5)) out.errores.push(`partido ${i}: más de 5 cambios (${s.cambios})`);
  if (s.ventanas.some(x => x > 3)) out.errores.push(`partido ${i}: más de 3 ventanas de cambios (${s.ventanas})`);
  if (s.minimoEnCancha.some(x => x < 7)) out.errores.push(`partido ${i}: un equipo quedó con menos de 7 (${s.minimoEnCancha})`);
  const cuenta = t => [0, 1].map(e => r.eventos.filter(ev => ev.tipo === t && ev.equipo === e).length);
  const cc = cuenta('cambio'), pp = cuenta('penal'), rr = cuenta('roja'), pe = [0, 1].map(e => r.eventos.filter(ev => ev.tipo === 'remate' && ev.penal && ev.equipo === e).length);
  if (cc.join() !== s.cambios.join()) out.errores.push(`partido ${i}: cambios en eventos ${cc} distintos de las estadísticas ${s.cambios}`);
  if (rr.join() !== s.rojas.join()) out.errores.push(`partido ${i}: rojas en eventos ${rr} distintas de las estadísticas ${s.rojas}`);
  if (!r.suspendido && pe.join() !== pp.join()) out.errores.push(`partido ${i}: penales cobrados ${pp} y pateados ${pe} no coinciden`);
  for (const e of [0, 1]) { const enCancha = r.jugadores.filter(j => j.equipo === e && j.enCanchaAlFinal).length; if (enCancha !== s.enCancha[e]) out.errores.push(`partido ${i}: jugadores en cancha ${enCancha} vs ${s.enCancha[e]}`); }
  if (liga) { if (r.h > r.a) sum.loc++; else if (r.h === r.a) sum.emp++; else sum.vis++;
   const mk = r.h === r.a ? r.h + '-' + r.a : Math.max(r.h, r.a) + '-' + Math.min(r.h, r.a); sum.marc[mk] = (sum.marc[mk] || 0) + 1; if (Math.abs(r.h - r.a) >= 4) sum.goleadas = (sum.goleadas || 0) + 1; if (r.h + r.a >= 10) sum.diez = (sum.diez || 0) + 1; }
}
const nT = tiempos.length || 1, n = nLiga || 1, f2 = x => +x.toFixed(2);
tiempos.sort((a, b) => a - b);
out.partidos = tiempos.length; out.partidosLiga = nLiga;
out.tiempo = { promedioMs: f2(tiempos.reduce((a, b) => a + b, 0) / nT), medianaMs: f2(tiempos[Math.floor(nT / 2)] || 0), maxMs: f2(tiempos[nT - 1] || 0), totalSeg: f2(tiempos.reduce((a, b) => a + b, 0) / 1000) };
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
/* ===== ETAPA 2 · forma de equipo ===== */
/* rangos aproximados de partidos profesionales con datos de seguimiento (jugadores de campo, en metros):
   con pelota el equipo se estira y se abre; sin pelota se junta. Son referencias amplias, no datos de un partido real. */
const RANGO_FORMA = { con: { largo: [35, 55], ancho: [40, 62], dm: [6, 24], ma: [6, 24] }, sin: { largo: [25, 40], ancho: [28, 45], dm: [6, 20], ma: [6, 20] } };
out.forma = {};
for (const f of ['con', 'sin']) {
  const A = FORMA[f], k = A.n || 1;
  out.forma[f] = { equipos: A.n, largo: f2(A.largo / k), ancho: f2(A.ancho / k), entreLineas: [f2(A.dm / k), f2(A.ma / k)], alineacionLinea: f2(A.alin / k) };
  const v = { largo: A.largo / k, ancho: A.ancho / k, dm: A.dm / k, ma: A.ma / k };
  for (const [m, [lo, hi]] of Object.entries(RANGO_FORMA[f])) if (!(v[m] >= lo && v[m] <= hi)) out.fallas.push(`Forma ${f} pelota: ${m} = ${v[m].toFixed(1)} m fuera del rango real [${lo}, ${hi}]`);
}
if (!(out.forma.con.largo > out.forma.sin.largo + 5)) out.fallas.push('Forma: el equipo no se estira con la pelota');
if (!(out.forma.con.ancho > out.forma.sin.ancho + 5)) out.fallas.push('Forma: el equipo no se abre con la pelota');
if (!(out.forma.sin.alineacionLinea < 4)) out.fallas.push(`Forma: la línea defensiva sin pelota no está alineada (desvío ${out.forma.sin.alineacionLinea} m)`);

/* ===== ETAPA 2 · la táctica cambia lo que pasa en la cancha =====
   El mismo equipo contra el mismo rival, con una sola cosa distinta en su táctica (local y visitante alternados). */
const NT = +(process.argv[3] || 24);
const CA = byClub.has('Arsenal') ? 'Arsenal' : clubs[3], CB = byClub.has('Chelsea') ? 'Chelsea' : clubs[11];
function serieTac(tac) {
  const S = { n: 0, alturaLinea: 0, alturaBloque: 0, recupCampoRival: 0, alturaRecuperacion: 0, pasesPorPosesion: 0, pelotazos: 0, ancho: 0, contrapresiones: 0, repliegues: 0, pases: 0, goles: 0, contrasRival: 0, golesRecibidos: 0 };
  for (let i = 0; i < NT; i++) {
    const loc = i % 2 === 0, yo = equipo(CA, tac), el = equipo(CB);
    let r; try { r = M.simular(loc ? yo : el, loc ? el : yo, { semilla: 50000 + i, cinta: false }); } catch (e) { out.errores.push(`táctica ${JSON.stringify(tac)}: ${e.message}`); continue; }
    const e = loc ? 0 : 1, s = r.stats, F = r.forma[e];
    S.n++; S.alturaLinea += F.sin.alturaLinea; S.alturaBloque += F.sin.alturaBloque; S.recupCampoRival += s.recupCampoRival[e]; S.alturaRecuperacion += s.alturaRecuperacion[e];
    S.pasesPorPosesion += s.pasesPorPosesion[e]; S.pelotazos += s.pelotazos[e]; S.ancho += F.con.ancho; S.contrapresiones += s.contrapresiones[e]; S.repliegues += s.repliegues[e]; S.pases += s.pases[e]; S.goles += loc ? r.h : r.a; S.contrasRival += s.contras[1 - e]; S.golesRecibidos += loc ? r.a : r.h;
  }
  const o = {}; for (const k in S) if (k !== 'n') o[k] = f2(S[k] / (S.n || 1)); o.partidos = S.n; return o;
}
const TAC = {
  bloqueAlto: { style: 'Equilibrado', depth: 85 }, bloqueBajo: { style: 'Equilibrado', depth: 15 },
  presionAlta: { style: 'Equilibrado', pressing: 85 }, presionBaja: { style: 'Equilibrado', pressing: 15 },
  directo: { style: 'Contraataque', rhythm: 80 }, posesion: { style: 'Posesión', rhythm: 30 },
  abierto: { style: 'Equilibrado', width: 85 }, cerrado: { style: 'Equilibrado', width: 15 },
  presionAltaEstilo: { style: 'Presión alta' }, defensivo: { style: 'Defensivo' }
};
const ST = {}; for (const [k, t] of Object.entries(TAC)) ST[k] = serieTac(t);
out.tacticas = { partidosPorSerie: NT, equipo: CA, rival: CB, series: ST, pruebas: [] };
function causa(nombre, a, b, campo, cond, texto) { const ok = cond(ST[a][campo], ST[b][campo]); out.tacticas.pruebas.push({ prueba: nombre, campo, [a]: ST[a][campo], [b]: ST[b][campo], ok, criterio: texto }); if (!ok) out.fallas.push(`Táctica: ${nombre} (${campo}: ${ST[a][campo]} vs ${ST[b][campo]}; se esperaba ${texto})`); }
causa('Bloque alto vs bajo: altura de la línea sin pelota', 'bloqueAlto', 'bloqueBajo', 'alturaLinea', (x, y) => x >= y + 4, 'al menos 4 m más alta');
causa('Bloque alto vs bajo: altura del bloque sin pelota', 'bloqueAlto', 'bloqueBajo', 'alturaBloque', (x, y) => x >= y + 4, 'al menos 4 m más alto');
causa('Presión alta vs baja: recuperaciones en campo rival', 'presionAlta', 'presionBaja', 'recupCampoRival', (x, y) => x >= y * 1.15, 'al menos 15 % más');
causa('Presión alta vs baja: altura media de recuperación', 'presionAlta', 'presionBaja', 'alturaRecuperacion', (x, y) => x >= y + 2, 'al menos 2 m más arriba');
causa('Posesión vs directo: pases por posesión', 'posesion', 'directo', 'pasesPorPosesion', (x, y) => x >= y * 1.3, 'al menos 30 % más');
causa('Directo vs posesión: pelotazos', 'directo', 'posesion', 'pelotazos', (x, y) => x >= y * 1.5, 'al menos 50 % más');
causa('Ancho alto vs bajo: ancho del equipo con pelota', 'abierto', 'cerrado', 'ancho', (x, y) => x >= y + 4, 'al menos 4 m más ancho');
causa('Bloque alto vs bajo: recibe más contraataques', 'bloqueAlto', 'bloqueBajo', 'contrasRival', (x, y) => x >= y * 1.15, 'al menos 15 % más contras del rival');
causa('Presión alta (estilo): al perder presiona en vez de replegarse', 'presionAltaEstilo', 'defensivo', 'contrapresiones', (x, y) => x > 0 && y === 0, 'contrapresión solo con presión alta');
/* todas las formaciones del juego juegan sin errores y respetan sus líneas */
out.formaciones = {};
for (const f of M.FORMACIONES) {
  try {
    const r = M.simular(equipo(CA, { formation: f }), equipo(CB, { formation: f }), { semilla: 7, cinta: false });
    const roles = r.jugadores.filter(j => j.equipo === 0 && j.entro === 0).map(j => j.rolInicial), def = roles.filter(x => M.LINEA_ROL[x] === 'def').length;   // titulares, con su rol al empezar
    out.formaciones[f] = { marcador: `${r.h}-${r.a}`, defensores: def, largoSin: r.forma[0].sin.largo, anchoCon: r.forma[0].con.ancho };
    if (def !== +f.split('-')[0]) out.fallas.push(`Formación ${f}: ${def} defensores en la línea`);
  } catch (e) { out.errores.push(`formación ${f}: ${e.message}`); }
}

/* ===== ETAPA 3 · reglas y pelota parada =====
   Promedios por partido (los dos equipos) contra rangos aproximados de ligas profesionales. Son referencias amplias:
   faltas ~20-28, amarillas ~3-5, rojas ~0,1-0,3, penales ~0,2-0,35, offsides ~3-5, córners ~8-11, lesiones ~0,2-0,8, cambios ~7-9 (con 5 cambios). */
const RANGO_REGLAS = { faltas: [18, 30], amarillas: [2.5, 5.5], rojas: [0.05, 0.4], penales: [0.12, 0.5], offsides: [1.5, 6], corners: [6, 13], lesiones: [0.1, 1], cambios: [5, 10] };
const nP = out.partidosLiga || 1;
out.reglas = { porPartido: {}, limites: { maxCambiosEquipo: REG.maxCambios, maxVentanasEquipo: REG.maxVentanas, minimoJugadoresEnCancha: REG.minEnCancha, suspendidos: REG.suspendidos } };
for (const k of ['faltas', 'amarillas', 'rojas', 'penales', 'penalesGol', 'offsides', 'corners', 'lesiones', 'cambios', 'tirosLibres', 'tirosLibresDirectos', 'ventajas', 'descuento1', 'descuento2']) out.reglas.porPartido[k] = +(REG[k] / nP).toFixed(3);
out.reglas.porPartido.conversionPenales = +(REG.penalesGol / (REG.penales || 1)).toFixed(3);
for (const [k, [lo, hi]] of Object.entries(RANGO_REGLAS)) { const v = out.reglas.porPartido[k]; if (!(v >= lo && v <= hi)) out.fallas.push(`Reglas: ${k} por partido = ${v} fuera del rango real [${lo}, ${hi}]`); }
if (REG.maxCambios > 5) out.fallas.push('Reglas: hubo más de 5 cambios en un equipo');
if (REG.maxVentanas > 3) out.fallas.push('Reglas: hubo más de 3 ventanas de cambios');
if (REG.minEnCancha < 7) out.fallas.push('Reglas: un equipo quedó con menos de 7 jugadores');
/* la expulsión baja el rendimiento: el mismo partido, con y sin una roja forzada al minuto 20 para el equipo de prueba */
function serieRoja(roja) {
  const S = { n: 0, pts: 0, dif: 0, xgPropio: 0, xgRival: 0, posesion: 0 };
  for (let i = 0; i < NT; i++) {
    const loc = i % 2 === 0, e = loc ? 0 : 1, yo = equipo(CA), el = equipo(CB);
    let r; try { r = M.simular(loc ? yo : el, loc ? el : yo, { semilla: 70000 + i, cinta: false, forzarRoja: roja ? { equipo: e, minuto: 20 } : null }); } catch (err) { out.errores.push(`roja forzada: ${err.message}`); continue; }
    const gf = loc ? r.h : r.a, gc = loc ? r.a : r.h;
    S.n++; S.pts += gf > gc ? 3 : gf === gc ? 1 : 0; S.dif += gf - gc; S.xgPropio += r.stats.xg[e]; S.xgRival += r.stats.xg[1 - e]; S.posesion += r.stats.posesion[e];
  }
  const o = {}; for (const k in S) if (k !== 'n') o[k] = +(S[k] / (S.n || 1)).toFixed(3); o.partidos = S.n; return o;
}
const conRoja = serieRoja(true), sinRoja = serieRoja(false);
out.reglas.expulsion = { conRoja, sinRoja };
if (!(conRoja.dif < sinRoja.dif)) out.fallas.push(`Expulsión: la diferencia de gol no bajó (${conRoja.dif} vs ${sinRoja.dif})`);
if (!(conRoja.xgPropio / (conRoja.xgPropio + conRoja.xgRival) < sinRoja.xgPropio / (sinRoja.xgPropio + sinRoja.xgRival))) out.fallas.push('Expulsión: la proporción de xG no bajó');

/* ===== ETAPA 4 · calibración: las estadísticas de liga se parecen al fútbol real =====
   Rangos de ligas reales (los mismos de tests/motor.mjs para el motor v2 cuando existen; si no, los de la consigna).
   La tabla más fina (10.000 partidos, rangos más estrechos) la da tests/calibrar-v3.mjs. */
const pe = x => x / n / 2;
const CALI = [
  ['Goles por partido', sum.goles / n, 2.2, 3.0], ['Local gana', sum.loc / n, .38, .52], ['Empate', sum.emp / n, .20, .32], ['Visitante gana', sum.vis / n, .24, .38],
  ['Remates por equipo', pe(sum.rem), 9, 15], ['Remates al arco', sum.arco / sum.rem, .28, .42], ['Conversión', sum.goles / sum.rem, .08, .14],
  ['Pases por equipo', pe(sum.pases), 400, 500], ['Acierto de pases', sum.pasesOk / sum.pases, .75, .85], ['Posesión del mejor equipo', (sum.posMejor || 0) / (sum.nPosMejor || 1) / 100, .50, .65],
  ['Córners por equipo', pe(REG.corners), 3.5, 6.5], ['Faltas por equipo', pe(REG.faltas), 9, 15], ['Amarillas por equipo', pe(REG.amarillas), 1.3, 2.8], ['Rojas por partido', REG.rojas / n, .04, .3],
  /* 10+ goles: "muy rara vez" está bien (pedido del usuario en la etapa 5); en 1000 partidos el azar da 0 a 3 */
  ['Penales por partido', REG.penales / n, .15, .45], ['Offsides por equipo', pe(REG.offsides), 1, 3.2],
  ['Partidos con 4+ de diferencia', (sum.goleadas || 0) / n, 0, .06], ['Partidos con 10+ goles', (sum.diez || 0) / n, 0, .004]
];
out.calibracion = CALI.map(([k, v, lo, hi]) => ({ estadistica: k, valor: +v.toFixed(4), rango: [lo, hi], ok: v >= lo && v <= hi }));
for (const c of out.calibracion) if (!c.ok) out.fallas.push(`Calibración: ${c.estadistica} = ${c.valor} fuera del rango real [${c.rango[0]}, ${c.rango[1]}]`);
/* ventaja de local: medible pero moderada */
const vLocal = (sum.loc - sum.vis) / n;
out.local = { gana: +(sum.loc / n).toFixed(3), visitante: +(sum.vis / n).toFixed(3), diferencia: +vLocal.toFixed(3) };
if (!(vLocal >= .05 && vLocal <= .2)) out.fallas.push(`Local: la ventaja (gana local − gana visitante) = ${vLocal.toFixed(3)} fuera de [0,05, 0,20]`);
/* fuerza: pares de equipos de liga por diferencia de GRL del XI, ida y vuelta */
const NF = +(process.argv[4] || 60);
const clubesLiga = [...new Set(Object.values(LG.ligas).flat())].sort();
for (const c of clubesLiga) if (!g2.has(c)) g2.set(c, LG.grlXI(c));
const CAT = { muySuperior: d => d >= 7, superior: d => d >= 3 && d < 6, parejo: d => d >= 0 && d < 1 };
out.fuerza = {};
for (const [cat, f] of Object.entries(CAT)) {
  let pares = 0, gana = 0, emp = 0, jug = 0;
  for (let i = 0; i < clubesLiga.length && pares < NF; i++) for (let j = 0; j < clubesLiga.length && pares < NF; j++) {
    const A = clubesLiga[(i * 7) % clubesLiga.length], B = clubesLiga[(j * 13 + i) % clubesLiga.length];
    if (A === B || !f(g2.get(A) - g2.get(B))) continue; pares++;
    for (const local of [true, false]) {
      let r; try { r = M.simular(equipo(local ? A : B), equipo(local ? B : A), { semilla: 800000 + pares * 2 + (local ? 0 : 1), cinta: false }); } catch (e) { out.errores.push(`fuerza: ${e.message}`); continue; }
      const gf = local ? r.h : r.a, gc = local ? r.a : r.h; jug++; if (gf > gc) gana++; else if (gf === gc) emp++;
    }
  }
  out.fuerza[cat] = { partidos: jug, gana: +(gana / (jug || 1)).toFixed(3), empata: +(emp / (jug || 1)).toFixed(3) };
}
const F = out.fuerza;
if (!(F.muySuperior.gana > F.superior.gana && F.superior.gana > F.parejo.gana)) out.fallas.push(`Fuerza: el % de victorias no crece con la diferencia (${F.muySuperior.gana} / ${F.superior.gana} / ${F.parejo.gana})`);
if (!(F.muySuperior.gana >= .60 && F.muySuperior.gana <= .80)) out.fallas.push(`Fuerza: el muy superior gana ${F.muySuperior.gana} (se espera ~0,65-0,75; tolerancia de la prueba 0,60-0,80 por la muestra)`);

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
/* ETAPA 5 · en vivo: avanzar de a un minuto sin tocar nada da exactamente lo mismo que simular() */
{
  const sinCinta = r => JSON.stringify({ h: r.h, a: r.a, ev: r.eventos, st: r.stats });
  const a1 = M.simular(A, B, { semilla: 4242, cinta: false });
  const V = M.enVivo(A, B, { semilla: 4242, cinta: false }); let minutos = 0;
  for (const parte of [1, 2]) { if (!V.empezar(parte)) break; while (!V.minuto()) minutos++; }
  const a2 = V.resultado();
  out.enVivo = { igualQueSimular: sinCinta(a1) === sinCinta(a2), minutos, marcador: `${a2.h}-${a2.a}` };
  if (!out.enVivo.igualQueSimular) out.fallas.push('En vivo: avanzar de a un minuto no da lo mismo que simular()');
  /* un cambio y un cambio de táctica en vivo no rompen nada */
  const W2 = M.enVivo(A, B, { semilla: 99, cinta: false, dtExterno: [true, true] }); W2.empezar(1); for (let k = 0; k < 20; k++) W2.minuto();
  const sale = W2.enCancha(0).find((c, i) => i > 0), banco = A.players[11];
  const hecho = W2.cambio(0, sale, Object.assign({ clave: 'banco0' }, banco), 'prueba'); W2.tactica(0, { style: 'Ofensivo', formation: '4-4-2' });
  while (!W2.minuto()); W2.empezar(2); while (!W2.minuto());
  const r3 = W2.resultado(); out.enVivo.cambio = { hecho, entro: r3.jugadores.some(j => j.nombre === banco.name), terminado: W2.terminado };
  if (!hecho || !out.enVivo.cambio.entro || !W2.terminado) out.fallas.push('En vivo: el cambio o la táctica en vivo fallaron');
}
/* ETAPA 6 · lo que dibuja el 2D: la cinta no salta, nadie se teletransporta, festejos, árbitro, córners de gol, arquero */
{
  const NS = 20; let saltosJ = 0, saltosB = 0, forz = 0, goles = 0, conFestejo = 0, conAbrazo = 0, arbFuera = 0, arbKm = 0, log = null, cierres = 0, cierreVel = 0, festChica = 0, festChica8 = 0; const festLejos = [], arqueros = [], reanud = {};
  const corners = [];
  for (let i = 0; i < NS; i++) {
    const [, h, a] = LG.fixture[(i * 37) % LG.fixture.length];
    let r; try { r = M.simular(equipo(h), equipo(a), { semilla: 'e6-' + i, cintaCada: 1 }); } catch (e) { out.errores.push(`etapa 6: ${e.message}`); continue; }
    const c = r.cinta, n = c.porCuadro, d = c.datos, F = c.frames; forz += r.stats.forzados || 0;
    const idx = t => { let k = Math.max(0, Math.min(F - 1, t - c.t[0])); while (k > 0 && c.t[k] > t) k--; while (k < F - 1 && c.t[k] < t) k++; return k; };
    const camb = new Set(r.eventos.filter(e => e.tipo === 'cambio').map(e => idx(e.t) + '|' + e.sid));
    const seg = r.eventos.find(e => e.tipo === 'segundo_tiempo'), k2 = seg ? idx(seg.t) : -9;
    for (let k = 1; k < F; k++) {
      if (k === k2 || c.t[k] !== c.t[k - 1] + 1) continue; const o = k * n, q = (k - 1) * n;
      if (Math.hypot(d[o] - d[q], d[o + 1] - d[q + 1]) / 10 > 5) { saltosB++; log = log || { pelota: true, partido: i, t: c.t[k] }; }
      for (let j = 0; j < 22; j++) { if (camb.has(k + '|' + j)) continue; const dd = Math.hypot(d[o + 5 + j * 2] - d[q + 5 + j * 2], d[o + 6 + j * 2] - d[q + 6 + j * 2]) / 10; if (dd > 1.5) { saltosJ++; log = log || { partido: i, t: c.t[k], puesto: j, d: dd }; } }
      for (let s = 0; s < 3; s++) { const ia = c.salientes + s * 2; if (d[o + ia] === -32768 || d[q + ia] === -32768) continue; if (Math.hypot(d[o + ia] - d[q + ia], d[o + ia + 1] - d[q + ia + 1]) / 10 > 1.5) { saltosJ++; log = log || { saliente: s, partido: i, t: c.t[k] }; } }
      const ax = d[o + c.arbitro] / 10, ay = d[o + c.arbitro + 1] / 10; if (ax < -2 || ax > 107 || ay < -2 || ay > 70) arbFuera++;
      arbKm += Math.hypot(d[o + c.arbitro] - d[q + c.arbitro], d[o + c.arbitro + 1] - d[q + c.arbitro + 1]) / 10000;
    }
    /* escena de cierre: existe y nadie corre: pasado el primer segundo y medio (cuando frenan) todos van a 1,8 m/s o menos (caminando) */
    /* velocidad medida en 1 s (10 cuadros): la cinta está en decímetros y cuadro a cuadro el redondeo agrega hasta 0,7 m/s */
    { const ce = r.eventos.find(e => e.tipo === 'cierre'); if (ce) { cierres++; for (let k = idx(ce.t) + 15; k < F; k++) for (let j = 0; j < 22; j++) { const o = k * n, q = (k - 10) * n; cierreVel = Math.max(cierreVel, Math.hypot(d[o + 5 + j * 2] - d[q + 5 + j * 2], d[o + 6 + j * 2] - d[q + 6 + j * 2]) / 10); } } }
    /* reanudaciones en el instante en que se ejecutan (primer cuadro "en juego"): saque del medio con cada equipo en su
       mitad y los rivales fuera del círculo; córner y tiro libre con los rivales a 9,15 m; saque de arco con los rivales
       fuera del área; lateral con los rivales a 2 m (medio metro de tolerancia; 0,3 en el lateral) */
    { const t2 = seg ? seg.t : 1e9, P_ = (k, j) => [d[k * n + 5 + j * 2] / 10, d[k * n + 6 + j * 2] / 10];
      for (const e of r.eventos) {
        if (!['lateral', 'corner', 'tiro_libre', 'saque_arco', 'saque_centro'].includes(e.tipo)) continue;
        let k = idx(e.t); if (e.tipo !== 'saque_centro') while (k < F - 1 && d[k * n + 4] !== 1) k++;
        const bx = d[k * n] / 10, by = d[k * n + 1] / 10, riv = [...Array(22).keys()].filter(j => (j < 11 ? 0 : 1) !== e.equipo);
        const dmin = Math.min(...riv.map(j => Math.hypot(P_(k, j)[0] - bx, P_(k, j)[1] - by)));
        let mal = false;
        if (e.tipo === 'saque_centro') { const izq0 = c.t[k] < t2; for (let j = 0; j < 22; j++) { const [x, y] = P_(k, j), te = j < 11 ? 0 : 1, izq = (te === 0) === izq0; if ((izq ? x > 53 : x < 52) || (te !== e.equipo && Math.hypot(x - 52.5, y - 34) < 8.65)) mal = true; } }
        else if (e.tipo === 'lateral') mal = dmin < 1.7;
        else if (e.tipo === 'saque_arco') { const der = bx > 52.5; mal = riv.some(j => { const [x, y] = P_(k, j); return (der ? x > 88.5 : x < 16.5) && y > 13.84 && y < 54.16; }); }
        else mal = dmin < 8.65;
        const R0 = reanud[e.tipo] = reanud[e.tipo] || { n: 0, mal: 0, ejemplo: null }; R0.n++; if (mal) { R0.mal++; R0.ejemplo = R0.ejemplo || { partido: i, t: e.t, distanciaRival: +dmin.toFixed(1) }; }
      }
      /* arqueros: con la pelota en su mitad se corren de costado con ella (bisectriz) y se paran más adelante cuanto más lejos está */
      for (const gkId of [0, 11]) { const xs = [], ys = [], lin = { cerca: [], lejos: [] };
        for (let k = 0; k < F; k += 5) { const [gx, gy] = P_(k, gkId), bx = d[k * n] / 10, by = d[k * n + 1] / 10, arco = gx < 52.5 ? 0 : 105, db = Math.abs(bx - arco);
          if (db < 30) { xs.push(by); ys.push(gy); lin.cerca.push(Math.abs(gx - arco)); } else if (db > 60) lin.lejos.push(Math.abs(gx - arco)); }
        const av = A => A.reduce((s, x) => s + x, 0) / (A.length || 1), mx = av(xs), my = av(ys); let sxy = 0, sxx = 0, syy = 0;
        for (let q = 0; q < xs.length; q++) { sxy += (xs[q] - mx) * (ys[q] - my); sxx += (xs[q] - mx) ** 2; syy += (ys[q] - my) ** 2; }
        arqueros.push({ corr: sxy / Math.sqrt(sxx * syy || 1), desvioY: Math.sqrt(syy / (ys.length || 1)), lineaCerca: av(lin.cerca), lineaLejos: av(lin.lejos) }); } }
    for (const g of r.eventos.filter(e => e.tipo === 'gol')) {
      goles++;
      if (g.festejo) { conFestejo++; const k = idx(g.t + 120), o = k * n, j = g.jid, x = d[o + 5 + j * 2], y = d[o + 6 + j * 2];
        if ([...Array(22).keys()].some(q => q !== j && Math.hypot(d[o + 5 + q * 2] - x, d[o + 6 + q * 2] - y) / 10 < 2.5)) conAbrazo++;
        /* el goleador festeja en el banderín o contra la tribuna; nadie amontonado en el área chica (salvo el arquero) */
        const der = g.x > 52.5, sx = x / 10, sy = y / 10, dc = Math.min(Math.hypot(sx - (der ? 105 : 0), sy), Math.hypot(sx - (der ? 105 : 0), sy - 68));
        if (!(dc < 4.5 || Math.min(sy, 68 - sy) < 3)) festLejos.push({ partido: i, min: Math.round(g.t / 600), pos: [+sx.toFixed(1), +sy.toFixed(1)] });
        /* desde los 5 s: como mucho 2 saliendo caminando (nunca amontonados); desde los 8 s: nadie */
        for (let k = idx(g.t + 50); k <= idx(g.t + g.festejo); k++) { const o2 = k * n; let m = 0; for (let q = 0; q < 22; q++) { if (q === 0 || q === 11) continue; const x2 = d[o2 + 5 + q * 2] / 10, y2 = d[o2 + 6 + q * 2] / 10; if ((der ? x2 > 99.5 : x2 < 5.5) && y2 > 24.84 && y2 < 43.16) m++; } festChica = Math.max(festChica, m); if (c.t[k] >= g.t + 80) festChica8 = Math.max(festChica8, m); } }
      if (g.origen === 'corner') { const der = g.x > 52.5; let max = 0;
        for (let k = idx(g.t - 45); k <= idx(g.t + 15); k++) { const o = k * n; let m = 0; for (let j = 0; j < 22; j++) { const x = d[o + 5 + j * 2] / 10, y = d[o + 6 + j * 2] / 10; if ((der ? x > 88.5 : x < 16.5) && y > 13.84 && y < 54.16) m++; } max = Math.max(max, m); }
        corners.push(max); }
    }
  }
  const gkErr = (sum.gkErr || 0) / (sum.goles || 1);
  out.etapa6 = { partidos: NS, saltosJugadores: saltosJ, saltosPelota: saltosB, primerSalto: log, esperasForzadas: forz, goles, festejos: conFestejo, conAbrazo, arbitroFueraDeLugar: arbFuera, arbitroKmPorPartido: +(arbKm / NS).toFixed(1),
    escenaDeCierre: cierres, velocidadMaximaEnElCierre: +cierreVel.toFixed(2), festejoMaxEnAreaChica: festChica, festejoEnAreaChicaA8s: festChica8, festejosLejosDelBanderin: festLejos, golesDeCorner: corners.length, jugadoresEnElAreaEnLaRepeticion: corners, golesErrorArquero: +gkErr.toFixed(3), origenGoles: Object.fromEntries(Object.entries(sum.origen || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +(v / (sum.goles || 1)).toFixed(3)])) };
  if (saltosJ || saltosB) out.fallas.push(`Etapa 6: la cinta tiene saltos (jugadores ${saltosJ}, pelota ${saltosB}) ${JSON.stringify(log)}`);
  if (forz) out.fallas.push(`Etapa 6: ${forz} pelotas paradas se ejecutaron acomodando jugadores de golpe`);
  { const av = A => A.reduce((s, x) => s + x, 0) / (A.length || 1), Rk = { corr: av(arqueros.map(a => a.corr)), desvioY: av(arqueros.map(a => a.desvioY)), lineaCerca: av(arqueros.map(a => a.lineaCerca)), lineaLejos: av(arqueros.map(a => a.lineaLejos)), peorCorr: Math.min(...arqueros.map(a => a.corr)) };
    out.etapa6.arqueros = Object.fromEntries(Object.entries(Rk).map(([k, v]) => [k, +v.toFixed(2)])); out.etapa6.reanudaciones = reanud;
    if (!(Rk.corr > .6 && Rk.peorCorr > .3 && Rk.desvioY > 1.5 && Rk.lineaLejos - Rk.lineaCerca > 2)) out.fallas.push(`Etapa 6: arqueros clavados ${JSON.stringify(out.etapa6.arqueros)}`);
    for (const [k, v] of Object.entries(reanud)) if (v.mal) out.fallas.push(`Etapa 6: ${v.mal} de ${v.n} ${k} con posiciones antirreglamentarias ${JSON.stringify(v.ejemplo)}`); }
  if (festChica > 2 || festChica8 > 0 || festLejos.length) out.fallas.push(`Etapa 6: festejo con ${festChica} jugadores en el área chica a los 5 s (máximo 2) y ${festChica8} a los 8 s (tiene que ser 0), o goleador lejos del banderín/tribuna ${JSON.stringify(festLejos)}`);
  if (cierres < NS || cierreVel > 1.8) out.fallas.push(`Etapa 6: escena de cierre ${cierres}/${NS}, velocidad máxima ${cierreVel.toFixed(2)} m/s`);
  if (conFestejo < goles * .85 || conAbrazo < conFestejo * .8) out.fallas.push(`Etapa 6: festejos ${conFestejo}/${goles}, con abrazo ${conAbrazo}`);
  if (arbFuera || out.etapa6.arbitroKmPorPartido < 4) out.fallas.push(`Etapa 6: árbitro raro (fuera ${arbFuera}, ${out.etapa6.arbitroKmPorPartido} km)`);
  if (corners.some(x => x < 5)) out.fallas.push(`Etapa 6: un gol de córner con menos de 5 jugadores en el área (${corners})`);
  if (!(gkErr < .10)) out.fallas.push(`Etapa 6: goles por error del arquero ${(100 * gkErr).toFixed(1)}% (máximo 10%)`);
}
/* un partido de ejemplo guardado para inspección (sin la cinta completa) */
const ej = M.simular(A, B, { semilla: 2026 });
out.ejemplo = { partido: `${ej.local} ${ej.h}-${ej.a} ${ej.visitante}`, stats: ej.stats, goles: ej.eventos.filter(e => e.tipo === 'gol'), remates: ej.eventos.filter(e => e.tipo === 'remate').slice(0, 10), cuadros: ej.cinta.frames, hz: ej.cinta.hz, cuadro100: M.cuadro(ej.cinta, 100) };
if (out.errores.length) out.fallas.push(`${out.errores.length} partidos con errores`);
if (out.partidosLiga < N * 0.95) out.fallas.push(`se jugaron solo ${out.partidos} de ${N}`);
if (usoRandom) out.fallas.push('se usó Math.random');

mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/motor-v3.json', JSON.stringify(out, null, 1));
console.log(`MOTOR v3 (etapas 1-6) · ${out.fallas.length ? 'FALLÓ' : 'OK'} · ${out.partidos} partidos sin errores: ${out.errores.length === 0 ? 'sí' : 'no'}`);
console.log('tiempo por partido', JSON.stringify(out.tiempo));
console.log('determinismo', out.determinismo.mismaSemilla ? 'OK' : 'FALLÓ', '· semillas distintas →', out.determinismo.semillasDistintasDistinto ? 'partidos distintos' : 'IGUALES', '· huellas', h1.join(' '));
console.log('estadísticas (solo informativas, sin calibrar):');
for (const [k, v] of Object.entries(out.estadisticas)) console.log('  ', k, Array.isArray(v) ? v.join(' · ') : v);
console.log('forma (promedio de todos los equipos):', JSON.stringify(out.forma));
console.log('tácticas (' + NT + ' partidos por serie, ' + CA + ' vs ' + CB + '):');
for (const p of out.tacticas.pruebas) console.log(p.ok ? '  ✔' : '  ✘', p.prueba, JSON.stringify(Object.fromEntries(Object.entries(p).filter(([k]) => !['prueba', 'ok', 'campo', 'criterio'].includes(k)))));
console.log('formaciones', JSON.stringify(out.formaciones));
console.log('reglas por partido:', JSON.stringify(out.reglas.porPartido));
console.log('límites:', JSON.stringify(out.reglas.limites));
console.log('expulsión (roja forzada al 20\'):', JSON.stringify(out.reglas.expulsion));
console.log('calibración (' + out.partidosLiga + ' partidos de liga):');
for (const c of out.calibracion) console.log(c.ok ? '  ✔' : '  ✘', c.estadistica.padEnd(32), String(c.valor).padStart(8), '  rango', c.rango.join(' – '));
console.log('local:', JSON.stringify(out.local), '· fuerza:', JSON.stringify(out.fuerza));
console.log('en vivo:', JSON.stringify(out.enVivo));
console.log('etapa 6:', JSON.stringify(out.etapa6));
console.log('física', JSON.stringify(out.fisica));
console.log('atributos', JSON.stringify(out.atributos));
console.log('ejemplo:', out.ejemplo.partido);
out.errores.slice(0, 10).forEach(e => console.log('ERROR:', e));
out.fallas.forEach(f => console.log('FALLA:', f));
process.exit(out.fallas.length ? 1 : 0);
