/* MODO CARRERA · motor v3 conectado al juego, en un navegador real (12.7: el partido del usuario es SIEMPRE v3)
   1) Carrera nueva → career.v3 = true y por dentro motor='v2' (el resto de la fecha); en Configuración ya no existe
      "Motor de partidos".
   2) Partido del usuario en vivo con el v3: avanza minuto a minuto, un cambio del usuario entra en la cancha, y
      "Simular hasta el final" lo termina. Se comprueba: marcador = goles del relato, estadísticas, valoraciones,
      resultado cargado en la fecha y en la tabla, el resto de la fecha jugado (con v2), sin errores.
   3) Varias fechas seguidas con el v3 y guardado/recarga: career.v3 se mantiene y la carrera vuelve igual.
   4) Si el v3 no se puede armar (se fuerza la falla): el partido se juega con el v2, con el aviso, sin 2D, y el
      siguiente vuelve a ser v3.
   Uso: node tests/v3juego.mjs <url de index.html>                                                                   */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html';
mkdirSync('tests/out', { recursive: true });
const errors = [], fallas = [], ok = (c, msg) => { if (!c) fallas.push(msg); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const ORIGEN = URL.startsWith('file:') ? null : new globalThis.URL(URL).origin;
await ctx.route(u => ORIGEN ? !u.href.startsWith(ORIGEN) : /^https?:/.test(u.href), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if ((m.type() === 'error' && !/Failed to load resource/.test(m.text())) || (m.type() === 'warning' && /motor v3/i.test(m.text()) && !/prueba:/.test(m.text()))) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);

/* 1) carrera nueva: v3 sin elegir nada; Configuración sin "Motor de partidos" */
const act = await page.evaluate(() => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
  document.getElementById('clubChoice').value = 'River Plate'; document.getElementById('manager').value = 'Prueba';
  createCareer();
  const filas = Object.values(SS).flatMap(x => x[2].map(r => r[3]));
  return { motor: career.motor, v3: career.v3, opcionMotor: typeof OP !== 'undefined' && 'motor' in OP, filaMotor: filas.includes('motor'), esV3: window.mcEsV3 ? mcEsV3(career) : null, version: window.MCMotorV3 && MCMotorV3.VERSION };
});
ok(!act.opcionMotor && !act.filaMotor, 'Configuración todavía muestra "Motor de partidos"');
ok(act.motor === 'v2' && act.v3 === true && act.esV3, `carrera nueva: motor=${act.motor} v3=${act.v3}`);
/* 2) partido en vivo */
await page.evaluate(() => { openMatch(); go('match'); window.mcSpeed && mcSpeed(4); });
const pre = await page.evaluate(() => ({ v3: !!match.v3, v2: !!match.v2, previa: match.events.some(e => /PREVIA/.test(e.title)), aviso: match.events.some(e => /MOTOR v3/.test(e.title)) }));
ok(pre.v3 && pre.v2 && pre.aviso, 'el partido del usuario no quedó marcado como v3');
await page.evaluate(() => mcMainAction());
await page.waitForTimeout(6000);
const vivo = await page.evaluate(() => ({ minuto: match.minute, fase: match.phase, h: match.h, a: match.a, tiros: [match.shotsH, match.shotsA], pos: match.pos }));
ok(vivo.minuto >= 3, `el partido en vivo no avanzó (minuto ${vivo.minuto})`);
/* cambio del usuario durante el partido: tiene que entrar en la cancha */
const cambio = await page.evaluate(() => {
  const m = match, i = m.own.findIndex(e => e.g !== 'POR'), inP = m.ownBench.find(p => !mcUnavailable(p));
  if (i < 0 || !inP) return { hecho: false };
  const hecho = mcDoSubOwn(m, i, inP, 'prueba');
  return { hecho, entra: inP.name, clave: 'o' + inP.id };
});
ok(cambio.hecho, 'no se pudo hacer el cambio de prueba');
await page.waitForTimeout(2500);
await page.evaluate(() => mcSimEnd());
const fin = await page.evaluate(() => {
  const m = match, gol = side => m.events.filter(e => e.gol && e.side === side).length;
  return { done: m.done, h: m.h, a: m.a, golesRelato: [gol('o'), gol('r')], tiros: [m.shotsH, m.shotsA], alArco: [m.onH, m.onA], pos: m.pos, ratings: m.ratings ? m.ratings.o.length : 0,
    historial: career.history.length, ultimo: career.history[career.history.length - 1], minuto: m.minute, tiposGol: m.events.filter(e => e.gol).map(e => e.gol.tipo),
    entroCambio: m.events.some(e => /CAMBIO/.test(e.title) && /prueba/.test(e.msg)), eventos: m.events.length };
});
ok(fin.done, 'el partido no terminó');
ok(fin.h === fin.golesRelato[0] && fin.a === fin.golesRelato[1], `marcador ${fin.h}-${fin.a} distinto de los goles del relato ${fin.golesRelato}`);
ok(fin.tiros[0] + fin.tiros[1] > 5 && fin.minuto >= 90, `estadísticas raras: tiros ${fin.tiros}, minuto ${fin.minuto}`);
ok(fin.ratings >= 11, 'faltan valoraciones');
ok(fin.ultimo && fin.ultimo.h === fin.h && fin.ultimo.a === fin.a, 'el resultado no quedó en el historial');
ok(fin.entroCambio, 'el cambio del usuario no quedó en el relato');
await page.locator('body').screenshot({ path: 'tests/out/v3-juego-partido.png' }).catch(() => {});

/* 3) varias fechas seguidas con v3, la fecha completa jugada y guardado/recarga */
const fechas = await page.evaluate(() => {
  const res = []; let v3 = 0;
  for (let k = 0; k < 5; k++) { match.finished = true; openMatch(); if (!match) break; if (match.v3) v3++; mcSimEnd(); res.push([match.home, match.away, match.h, match.a]); }
  const L = career.league, jugados = L ? L.rounds.slice(0, career.round).flat().filter(f => f[2] != null).length : null, porFecha = L ? L.rounds[0].length : null;
  save(); return { res, v3, round: career.round, jugados, porFecha, id: career.id, points: career.points };
});
ok(fechas.v3 === fechas.res.length && fechas.res.length === 5, `no todas las fechas fueron v3 (${fechas.v3}/${fechas.res.length})`);
ok(fechas.porFecha == null || fechas.jugados === fechas.round * fechas.porFecha, `el resto de la fecha no se jugó completo (${fechas.jugados} de ${fechas.round * fechas.porFecha})`);
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1500);
const recarga = await page.evaluate(() => ({ id: career.id, round: career.round, points: career.points, v3: career.v3, motor: career.motor }));
ok(recarga.id === fechas.id && recarga.round === fechas.round && recarga.points === fechas.points && recarga.v3 === true, `recarga: ${JSON.stringify(recarga)}`);

/* 4) un partido que no se puede armar en la cancha (se fuerza la falla del v3): se juega con el v2 y se avisa */
const vuelta = await page.evaluate(() => {
  if (match) match.finished = true; const o = MCMotorV3.enVivo; MCMotorV3.enVivo = () => { throw new Error('prueba: el v3 no se puede armar'); };
  openMatch(); MCMotorV3.enVivo = o; go('match');
  const m = match, r = { partidoV3: !!m.v3, v2: !!m.v2, aviso: m.events.some(e => /MOTOR v2/.test(e.title)), con2D: !!document.querySelector('#m2dHost') };
  mcSimEnd(); const gol = side => m.events.filter(e => e.gol && e.side === side).length;
  r.termino = m.done; r.marcadorOk = m.h === gol('o') && m.a === gol('r');
  m.finished = true; openMatch(); r.siguienteV3 = !!(match && match.v3); mcSimEnd(); r.v3career = career.v3; r.motor = career.motor; return r; });
ok(!vuelta.partidoV3 && vuelta.v2 && vuelta.aviso && !vuelta.con2D && vuelta.termino && vuelta.marcadorOk, `partido con el v2 (no se pudo armar el v3): ${JSON.stringify(vuelta)}`);
ok(vuelta.siguienteV3 && vuelta.v3career === true && vuelta.motor === 'v2', `el partido siguiente no volvió al v3: ${JSON.stringify(vuelta)}`);

await browser.close();
const res = { ok: !errors.length && !fallas.length, carrera: act, previo: pre, vivo, cambio, fin, fechas, recarga, vuelta, errores: errors, fallas };
writeFileSync('tests/out/v3juego.json', JSON.stringify(res, null, 1));
console.log('MOTOR v3 EN EL JUEGO', res.ok ? 'OK' : 'FALLÓ', '·', `partido en vivo ${fin.h}-${fin.a} (tipos de gol: ${fin.tiposGol.join(', ') || '—'}) · minuto en vivo ${vivo.minuto} · 5 fechas más con v3: ${fechas.res.map(r => r[2] + '-' + r[3]).join(' ')} · recarga ${recarga.v3 ? 'OK' : 'FALLÓ'} · partido con el v2 si falla el v3: ${!vuelta.partidoV3 && vuelta.aviso ? 'OK' : 'FALLÓ'}`);
errors.forEach(e => console.log('ERROR:', e)); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
