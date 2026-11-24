/* MODO CARRERA · motor v3 conectado al juego (etapa 5), en un navegador real
   1) Carrera nueva (v2) → en Configuración se elige "Simulado en cancha (v3)" → career.v3 = true y la carrera sigue en v2 por dentro.
   2) Partido del usuario en vivo con el v3: avanza minuto a minuto, un cambio del usuario entra en la cancha, y
      "Simular hasta el final" lo termina. Se comprueba: marcador = goles del relato, estadísticas, valoraciones,
      resultado cargado en la fecha y en la tabla, el resto de la fecha jugado (con v2), sin errores.
   3) Varias fechas seguidas con el v3 y guardado/recarga: career.v3 se mantiene y la carrera vuelve igual.
   4) Volver a v2 en Configuración: el próximo partido ya no es v3.
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
page.on('console', m => { if ((m.type() === 'error' && !/Failed to load resource/.test(m.text())) || (m.type() === 'warning' && /motor v3/i.test(m.text()))) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);

/* 1) carrera y activación del v3 en Configuración */
const act = await page.evaluate(() => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
  document.getElementById('clubChoice').value = 'River Plate'; document.getElementById('manager').value = 'Prueba';
  window.MC_MOTOR_NUEVAS = 'v2'; createCareer();
  const opciones = (OP.motor || []).map(o => o[0]);
  sLoad(); draft.motor = 'v3'; sSave();
  sLoad(); const enAjustes = draft.motor;
  return { motor: career.motor, v3: career.v3, opciones, enAjustes, esV3: window.mcEsV3 ? mcEsV3(career) : null, version: window.MCMotorV3 && MCMotorV3.VERSION };
});
ok(act.opciones.includes('v3'), 'la opción v3 no aparece en Motor de partidos');
ok(act.motor === 'v2' && act.v3 === true && act.esV3, `activar v3: motor=${act.motor} v3=${act.v3}`);
ok(act.enAjustes === 'v3', 'Configuración no muestra v3 como elegido');

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

/* 4) volver al v2 */
const vuelta = await page.evaluate(() => { sLoad(); draft.motor = 'v2'; sSave(); openMatch(); const v3 = !!(match && match.v3); mcSimEnd(); return { v3career: career.v3, motor: career.motor, partidoV3: v3, termino: match.done }; });
ok(vuelta.v3career === false && vuelta.motor === 'v2' && !vuelta.partidoV3 && vuelta.termino, `volver a v2: ${JSON.stringify(vuelta)}`);

await browser.close();
const res = { ok: !errors.length && !fallas.length, activacion: act, previo: pre, vivo, cambio, fin, fechas, recarga, vuelta, errores: errors, fallas };
writeFileSync('tests/out/v3juego.json', JSON.stringify(res, null, 1));
console.log('MOTOR v3 EN EL JUEGO', res.ok ? 'OK' : 'FALLÓ', '·', `partido en vivo ${fin.h}-${fin.a} (tipos de gol: ${fin.tiposGol.join(', ') || '—'}) · minuto en vivo ${vivo.minuto} · 5 fechas más con v3: ${fechas.res.map(r => r[2] + '-' + r[3]).join(' ')} · recarga ${recarga.v3 ? 'OK' : 'FALLÓ'} · vuelta a v2 ${vuelta.partidoV3 ? 'FALLÓ' : 'OK'}`);
errors.forEach(e => console.log('ERROR:', e)); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
