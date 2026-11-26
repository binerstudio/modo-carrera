/* MODO CARRERA · Etapa 4 · rotación automática del plantel del usuario
   A) Viene APAGADA en una carrera nueva y se prende en Configuración → Partido → "Rotación automática".
   B) Casos forzados (antes de un partido): todos cansados, arquero titular lesionado con suplente sano, todos los
      arqueros lesionados menos uno, un solo arquero y cansado, justo 11 disponibles, fijos cansados y fijos en el banco,
      y 200 planteles al azar (físico, lesiones y suspensiones al azar).
      En cada caso, al armar el partido: 11 en cancha (si hay 11 disponibles), un arquero en el arco si hay uno sano,
      ningún arquero en un puesto de campo, nadie lesionado o suspendido, los fijos sin tocar y sin jugadores duplicados.
   C) Una temporada completa con la rotación prendida (con la recuperación de siempre entre fechas) contra la misma
      temporada sin rotación: las mismas comprobaciones antes de cada partido y el físico medio del once.
   Uso: node tests/rotacion.mjs <url>                                                                            */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html';
const errors = [], fallas = [], ok = (c, m) => { if (!c) fallas.push(m); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(`(()=>{let s=777>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();`);
await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
const nueva = club => page.evaluate(club => { go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs(); document.getElementById('clubChoice').value = club; createCareer(); return career.id }, club);
/* helper en la página: arma el partido y revisa el once real que sale a la cancha */
await page.evaluate(() => {
  window.__revisar = function (fijosXI) {
    const disp = career.players.filter(p => !mcUnavailable(p)), porDisp = disp.filter(p => p.pos === 'POR').length;
    match = null; createMatch(); const own = match.own, m = { n: own.length };
    m.arquero = own.filter(e => e.g === 'POR').length; m.arqueroEsPOR = own.filter(e => e.g === 'POR').every(e => e.p.pos === 'POR');
    m.porEnCampo = own.filter(e => e.g !== 'POR' && e.p.pos === 'POR').length;
    m.noDisp = own.filter(e => mcUnavailable(e.p)).length; m.dup = own.length - new Set(own.map(e => e.p.id)).size;
    m.fijosFuera = (fijosXI || []).filter(id => { const p = career.players.find(x => x.id === id); return p && !mcUnavailable(p) && !own.some(e => e.p.id === id) }).length;
    m.esperado11 = Math.min(11, disp.length); m.hayPOR = porDisp > 0;
    m.fit = +(own.reduce((a, e) => a + e.p.fitness, 0) / Math.max(1, own.length)).toFixed(1);
    m.ok = m.n === m.esperado11 && (!m.hayPOR || (m.arquero === 1 && m.arqueroEsPOR)) && !m.porEnCampo && !m.noDisp && !m.dup && !m.fijosFuera;
    match = null; return m };
});

/* A) apagada por defecto y se prende en Configuración */
await nueva('River Plate');
const A = await page.evaluate(() => { const r = { porDefecto: !!career.rotacion, enAjustes: SS.Partido[2].some(x => x[3] === 'rotacion') };
  sLoad(); r.draft = draft.rotacion; draft.rotacion = 1; sSave(); r.prendida = career.rotacion === true;
  sLoad(); r.draft2 = draft.rotacion; draft.rotacion = 0; sSave(); r.apagada = !career.rotacion; draft.rotacion = 1; sSave(); return r });
ok(!A.porDefecto && A.enAjustes && A.draft === 0 && A.prendida && A.draft2 === 1 && A.apagada, `opción de Configuración: ${JSON.stringify(A)}`);

/* B) casos forzados */
const B = await page.evaluate(() => {
  const base = JSON.stringify(career.players), out = [];
  const reset = () => { career.players = JSON.parse(base); career.rotacion = true; career.formation = '4-3-3'; };
  const POR = () => career.players.map((p, i) => [p, i]).filter(([p]) => p.pos === 'POR');
  const caso = (nombre, prep) => { reset(); const fijos = prep() || []; const m = __revisar(fijos); out.push({ nombre, ...m }); };
  caso('todos cansados (50%)', () => { career.players.forEach(p => p.fitness = 50) });
  caso('arquero titular lesionado, suplente sano', () => { career.players[0].injury = 'Lesión · 3 semanas'; career.players[0].injWeeks = 3 });
  caso('arquero titular cansado (40%), suplente sano', () => { career.players[0].fitness = 40 });
  caso('todos los arqueros lesionados menos uno (en reservas)', () => { const P = POR(); P.slice(0, -1).forEach(([p]) => { p.injury = 'Lesión'; p.injWeeks = 4 }); });
  caso('un solo arquero y cansado (45%)', () => { const P = POR(); P.slice(1).forEach(([p]) => { p.injury = 'Lesión'; p.injWeeks = 4 }); P[0][0].fitness = 45; });
  caso('ningún arquero sano', () => { POR().forEach(([p]) => { p.injury = 'Lesión'; p.injWeeks = 4 }) });
  caso('justo 11 disponibles', () => { career.players.slice(11).forEach(p => { p.injury = 'Lesión'; p.injWeeks = 2 }); career.players.slice(0, 11).forEach(p => p.fitness = 48) });
  caso('justo 11 disponibles, mezclados entre titulares y suplentes', () => { const n = career.players.length; career.players.forEach((p, i) => { if (i % 2 === 1 && i > 0) { p.injury = 'Lesión'; p.injWeeks = 2 } });
    let d = career.players.filter(p => !p.injury).length; for (let i = n - 1; d > 11 && i > 0; i--) { const p = career.players[i]; if (!p.injury && p.pos !== 'POR') { p.injury = 'Lesión'; d-- } } });
  caso('fijos cansados (dos titulares al 45%)', () => { const a = career.players[3], b = career.players[9]; a.fijo = b.fijo = true; a.fitness = b.fitness = 45; career.players.slice(1, 11).forEach(p => { if (!p.fijo) p.fitness = 50 }); return [a.id, b.id] });
  caso('arquero fijo cansado', () => { const g = career.players[0]; g.fijo = true; g.fitness = 42; return [g.id] });
  caso('suspendidos y lesionados en el once', () => { [1, 4, 7, 10].forEach(i => { career.players[i].suspended = 1 }); [2, 5].forEach(i => { career.players[i].injury = 'Lesión'; career.players[i].injWeeks = 1 }) });
  /* 200 planteles al azar */
  let s = 99; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647 };
  let azar = 0, azarMal = [];
  for (let k = 0; k < 200; k++) { reset(); const fijos = [];
    career.players.forEach((p, i) => { p.fitness = 42 + Math.floor(R() * 58); if (R() < .12) { p.injury = 'Lesión'; p.injWeeks = 1 + Math.floor(R() * 4) } if (R() < .05) p.suspended = 1; });
    if (R() < .3) career.formation = ['4-4-2', '3-5-2', '5-3-2', '4-2-3-1', '3-4-3'][Math.floor(R() * 5)];
    try { fitXI() } catch (e) { }
    career.players.slice(0, 11).forEach(p => { if (R() < .1) { p.fijo = true; fijos.push(p.id) } });   /* fijos: elegidos entre los titulares ya acomodados */
    const m = __revisar(fijos); if (m.ok) azar++; else if (azarMal.length < 5) azarMal.push(m); }
  reset(); return { casos: out, azar, azarMal };
});
B.casos.forEach(c => ok(c.ok, `caso "${c.nombre}": ${JSON.stringify(c)}`));
ok(B.azar === 200, `planteles al azar ${B.azar}/200: ${JSON.stringify(B.azarMal)}`);
const tit = n => B.casos.find(c => c.nombre === n);
ok(tit('todos cansados (50%)').fit === 50, 'con todos cansados no debería poder mejorar nada');

/* C) temporada completa con y sin rotación (misma semilla de carrera) */
const temporada = rot => page.evaluate(rot => {
  career.rotacion = rot; const res = { partidos: 0, mal: [], fit: [], cambios: 0 }; let g = 0;
  const fijo = career.players.slice(0, 11).find(p => p.pos === 'DEL'); if (rot && fijo) fijo.fijo = true;
  const oRot = mcRotar; window.mcRotar = function () { const r = oRot.apply(this, arguments); res.cambios += r.length; return r };
  while (!mcSeasonOver() && g++ < 80) {
    openMatch(); if (!match) break; const own = match.own;
    const m = { n: own.length, arq: own.filter(e => e.g === 'POR' && e.p.pos === 'POR').length, porCampo: own.filter(e => e.g !== 'POR' && e.p.pos === 'POR').length, noDisp: own.filter(e => mcUnavailable(e.p)).length };
    const disp = career.players.filter(p => !mcUnavailable(p)).length, hayPOR = career.players.some(p => p.pos === 'POR' && !mcUnavailable(p));
    if (m.n !== Math.min(11, disp) || (hayPOR && m.arq !== 1) || m.porCampo || m.noDisp || (rot && fijo && !mcUnavailable(fijo) && !own.some(e => e.p === fijo))) res.mal.push({ fecha: career.round, ...m });
    res.fit.push(own.reduce((a, e) => a + e.p.fitness, 0) / own.length);
    mcSimEnd(); match.finished = true; nextFixture(); res.partidos++; }
  res.fitMedio = +(res.fit.reduce((a, b) => a + b, 0) / res.fit.length).toFixed(1); res.fitMin = +Math.min(...res.fit).toFixed(1); delete res.fit;
  res.puntos = career.points; res.pos = rank(); window.mcRotar = oRot; return res }, rot);
await nueva('Boca Juniors'); const sin = await temporada(false);
await nueva('Boca Juniors'); const con = await temporada(true);
await browser.close();
ok(!sin.mal.length, `sin rotación, partidos con el once mal armado: ${JSON.stringify(sin.mal.slice(0, 3))}`);
ok(!con.mal.length, `con rotación, partidos con el once mal armado: ${JSON.stringify(con.mal.slice(0, 3))}`);
ok(con.cambios > 0, 'la rotación nunca cambió a nadie en toda la temporada');
ok(con.fitMedio > sin.fitMedio, `con rotación el once no llega más descansado (${con.fitMedio} contra ${sin.fitMedio})`);
ok(!errors.length, `${errors.length} errores de JavaScript`);
const res = { ok: !fallas.length, configuracion: A, casos: B.casos, alAzar: `${B.azar}/200`, temporadaSinRotacion: sin, temporadaConRotacion: con, errores: errors, fallas };
mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/rotacion.json', JSON.stringify(res, null, 1));
console.log('ROTACIÓN AUTOMÁTICA ·', res.ok ? 'OK' : 'FALLÓ');
console.log(`  Configuración: apagada por defecto ${!A.porDefecto ? 'sí' : 'NO'} · se prende y se apaga ${A.prendida && A.apagada ? 'sí' : 'NO'}`);
B.casos.forEach(c => console.log(`  ${c.ok ? '✔' : '✘'} ${c.nombre}: ${c.n} en cancha (de ${c.esperado11}), arquero ${c.arquero}, arqueros de campo ${c.porEnCampo}, no disponibles ${c.noDisp}, fijos fuera ${c.fijosFuera}, físico medio ${c.fit}`));
console.log(`  200 planteles al azar: ${B.azar}/200 bien armados`);
console.log(`  Temporada sin rotación: ${sin.partidos} partidos, físico medio del once ${sin.fitMedio} (mín ${sin.fitMin}), ${sin.puntos} pts (${sin.pos}º)`);
console.log(`  Temporada con rotación: ${con.partidos} partidos, físico medio del once ${con.fitMedio} (mín ${con.fitMin}), ${con.puntos} pts (${con.pos}º), ${con.cambios} rotaciones`);
errors.slice(0, 10).forEach(e => console.log('ERROR:', e.slice(0, 300))); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
