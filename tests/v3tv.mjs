/* MODO CARRERA · cómo se ve el partido con el motor v3 (navegador real)
   - Menú al tocar "Comenzar partido": Partido completo (3 a 15 min), Mejores jugadas, Simular partido; se recuerda.
   - Partido completo de 3 min a x1: dura ~3 min (±30%, aceptado por el usuario), nunca se mueve nada más rápido que la velocidad real, hay cortes
     de fase, 0 saltos (cinta y dibujo), lo dibujado = la cinta, la cámara no salta, festejo/repetición si hay goles y la
     escena de cierre sin nadie corriendo; al final pasa al resultado.
   - Cada gol con su repetición (cinta, cámara lenta, 5-8 s antes); escena final sin nadie corriendo; en el partido
     completo las jugadas ocupan al menos el doble que la calma; movimiento: pelota-pie < 0,8 m en conducción, largo de
     paso (velocidad/cadencia) entre 0,4 y 2,4 m, sin patinaje ni saltos de pose.
   - Mejores jugadas: solo los tipos marcados, por importancia (máximo 12), en orden de minuto; córners solo con remate. Simular partido: directo al resultado con estadísticas.
   - v2: el menú sin "Mejores jugadas" y el partido completo funciona.
   - Capturas: menú, corte de fase, estadio (TV con tribunas), festejo, repetición, mejores jugadas, escena final.
   Uso: node tests/v3tv.mjs <url de index.html> [largo]   ("largo": además, partido completo de 15 min medido a x4)  */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html', LARGO = process.argv[3] === 'largo';
mkdirSync('tests/out', { recursive: true });
const errors = [], fallas = [], ok = (c, msg) => { if (!c) fallas.push(msg); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 } });
const page = await ctx.newPage();
const ORIGEN = URL.startsWith('file:') ? null : new globalThis.URL(URL).origin;
await ctx.route(u => ORIGEN ? !u.href.startsWith(ORIGEN) : /^https?:/.test(u.href), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if ((m.type() === 'error' && !/Failed to load resource/.test(m.text())) || (m.type() === 'warning' && /MC2D|motor v3/i.test(m.text()))) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept()); page.on('crash', () => errors.push('la página se cayó (crash)'));
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
const cap = async (n, sel) => { for (let k = 0; k < 3; k++) { try { if (sel) { const b = await page.locator(sel).boundingBox(); await page.screenshot({ path: `tests/out/v3tv-${n}.png`, clip: b }); } else await page.screenshot({ path: `tests/out/v3tv-${n}.png` }); return true; } catch (e) { await page.waitForTimeout(150); } } return false; };
await page.evaluate(() => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
  document.getElementById('clubChoice').value = 'River Plate'; document.getElementById('manager').value = 'Prueba';
  window.MC_MOTOR_NUEVAS = 'v2'; createCareer(); sLoad(); draft.motor = 'v3'; sSave(); openMatch(); go('match');
});
await page.waitForTimeout(600);

/* 1) el menú aparece al tocar "Comenzar partido" */
const menu = await page.evaluate(() => { const b = [...document.querySelectorAll('#m12M button')].find(x => /COMENZAR/.test(x.textContent)); if (b) b.click();
  const op = [...document.querySelectorAll('.vp-op')].map(x => x.dataset.m); return { boton: !!b, opciones: op, rango: !!document.getElementById('vpRango'), casillas: document.querySelectorAll('.vp-ck input').length }; });
ok(menu.boton && menu.opciones.join() === 'completo,mejores,simular' && menu.rango && menu.casillas === 8, `menú: ${JSON.stringify(menu)}`);
await page.waitForTimeout(300); await cap('menu');
await page.evaluate(() => closeModal());

/* partido completo: mide duración, velocidad, cortes, saltos, cámara, cierre */
async function completo(min, vel, fotos) {
  await page.evaluate(([min, vel]) => { mcJugarPartido({ modo: 'completo', min }); if (vel !== 1) mcSpeed(vel); }, [min, vel]);
  const t0 = Date.now(); let verif = [], maxDif = 0, f = {}, fin = null;
  for (let i = 0; i < 2000; i++) {
    await page.waitForTimeout(500);
    const e = await page.evaluate(() => ({ v: MC2D.estado().v3, ver: MC2D.verificarV3() }));
    const v = e.v; if (!v) continue;
    if (e.ver && !v.enCorte) { maxDif = Math.max(maxDif, e.ver.difMax); verif.push(e.ver.difMax); }
    if (fotos) {
      if (!f.tv && i === 10) { f.tv = 1; await cap('estadio', '#m2dHost'); }
      if (!f.corte && v.cortes >= 2) { f.corte = 1;   /* el corte dura medio segundo: se espera el próximo y se saca la foto en el fundido */
        await page.waitForFunction(n => { const x = MC2D.estado().v3; return x.cortes > n && x.corteFase === 'entra'; }, v.cortes, { timeout: 60000, polling: 40 }).catch(() => {}); await cap('corte', '#m2dHost'); }
      if (!f.fest && v.festejoActivo && !v.enRepeticion) { f.fest = 1; await page.waitForTimeout(300); await cap('festejo', '#m2dHost'); }
      if (!f.rep && v.enRepeticion) { f.rep = 1; await cap('repeticion', '#m2dHost'); }
      if (!f.cierre && v.cierre && v.cierre.muestras > 400) { f.cierre = 1; await cap('escena-final', '#m2dHost'); }
    }
    if (v.resultado) { fin = v; break; }
  }
  const r = await page.evaluate(() => ({ v: MC2D.estado().v3, h: match.h, a: match.a, done: match.done, tab: (document.querySelector('#m12M .tbs button.on') || {}).textContent || '' }));
  return { min, vel, segundos: Math.round((Date.now() - t0) / 1000), v: r.v, marcador: [r.h, r.a], done: r.done, tab: r.tab, maxDif, muestras: verif.length };
}
const c3 = await completo(3, 1, true);
{ const v = c3.v, dur = c3.segundos;   // tiempo real de reloj, desde que arranca hasta el resultado (esperas incluidas)
  ok(c3.done && v.resultado && /ESTAD/.test(c3.tab), `partido completo (3 min): no terminó en el resultado (${JSON.stringify({ done: c3.done, tab: c3.tab })})`);
  ok(dur >= 126 && dur <= 234, `partido completo (3 min) a x1 duró ${dur} s (objetivo 180 ±30%)`);
  ok(v.velMax <= 1.05, `algo se movió más rápido que la velocidad real a x1 (${v.velMax}x)`);
  ok(v.cortes >= 3, `casi no hubo cortes de fase (${v.cortes})`);
  ok(v.saltosCinta === 0 && v.saltosPelota === 0 && v.saltosDibujo === 0, `saltos: cinta ${v.saltosCinta}/${v.saltosPelota}, dibujo ${v.saltosDibujo} ${JSON.stringify(v.saltoLog)}`);
  ok(c3.maxDif < 1e-6 && c3.muestras > 30, `lo dibujado no coincide con la cinta (dif ${c3.maxDif}, ${c3.muestras} muestras)`);
  ok(v.camara.saltos === 0, `la cámara saltó ${v.camara.saltos} veces fuera de los cortes`);
  /* 1) cada gol tiene su repetición: de la cinta, en cámara lenta, desde 5 a 8 s antes del gol, y se ve */
  const gol = c3.marcador[0] + c3.marcador[1];
  ok(v.golesVistos === gol, `goles vistos ${v.golesVistos} de ${gol}`);
  ok(v.repeticiones.length === gol, `${gol} goles y ${v.repeticiones.length} repeticiones ${JSON.stringify(v.repFallas)}`);
  ok(v.repeticiones.every(r => r.antes >= 5 && r.antes <= 8 && r.vel < 1 && r.real > 3), `repetición fuera de lo pedido: ${JSON.stringify(v.repeticiones)}`);
  /* 2) escena final: nadie corre (velocidad ≤ 1,8 m/s pasado el primer segundo y medio) y hay festejo, piso, saludo o aplauso */
  ok(v.cierre.muestras > 500 && v.cierre.corriendo === 0, `escena final: ${JSON.stringify(v.cierre)}`);
  ok(!Object.keys(v.cierre.poses).some(p => /^(run|trotando|corriendo)$/.test(p)), `escena final con poses de correr: ${JSON.stringify(v.cierre.poses)}`);
  ok(Object.keys(v.cierre.poses).some(p => /celebrando|abrazo|piso|cabeza|saludo|aplauso/.test(p)), 'escena final sin festejos ni saludos');
  /* 4) partido completo: el tiempo es de las jugadas (peligro, goles, pelota parada con remate, festejos); la calma solo como transición corta */
  { const T = v.tiempoReal;
    ok(T.peligro >= 2 * T.calma, `partido completo: ${T.peligro} s de jugadas y ${T.calma} s de calma (las jugadas tienen que ser al menos el doble) ${JSON.stringify(T)}`);
    ok(T.calma / Math.max(1, v.cortes) <= 6, `transiciones largas: ${T.calma} s de calma en ${v.cortes} cortes`); }
  /* lo que se ve: ningún jugador a más de 10 m/s fuera de los fundidos (cortes, repeticiones, entretiempo) */
  ok(v.velocidadVista.n > 10000 && v.velocidadVista.max <= 10, `velocidad vista máxima ${v.velocidadVista.max} m/s (límite 10) ${JSON.stringify(v.velocidadVista.log)}`);
  /* carteles de pelota parada: salen cuando la pelota está en su lugar (córner en el banderín, penal en el punto) */
  ok(v.carteles.every(c => c.tipo === 'corner' ? c.aBanderin <= 3 : c.tipo === 'penal' ? c.aPenal <= 1.5 : c.velPelota < .3), `cartel fuera de lugar: ${JSON.stringify(v.carteles.filter(c => c.tipo === 'corner' ? c.aBanderin > 3 : c.tipo === 'penal' ? c.aPenal > 1.5 : c.velPelota >= .3))}`);
  /* 6) movimiento: pelota pegada al pie en conducción, largo de paso real (velocidad/cadencia), sin patinaje ni saltos de pose */
  { const M = v.movimiento;
    ok(M.conduccion > 100 && M.pelotaPieMax < 0.8, `pelota-pie en conducción: máximo ${M.pelotaPieMax} m (límite 0,8) en ${M.conduccion} muestras`);
    ok(M.pasos > 500 && M.pasoP5 >= 0.4 && M.pasoP95 <= 2.4, `largo de paso (velocidad/cadencia) fuera de rango: ${JSON.stringify(M)}`);
    ok(M.patinaje === 0, `patinaje: ${M.patinaje} ${JSON.stringify(M.patLog)}`);
    /* salto de pose: un ángulo de brazo o pierna que cambia a más de 45 rad/s (unos 0,75 rad en un cuadro de 60 fps); la marcha más rápida llega a ~20 */
    ok(M.saltosPose === 0, `saltos de pose: ${M.saltosPose} ${JSON.stringify(M.saltoLog)}`); }
}
await cap('resultado');

/* 2) mejores jugadas: solo los tipos marcados */
const TIP = { goles: ['gol'], corners: ['remate'], atajadas: ['atajada'], penales: ['remate'] };   // un córner entra solo si termina en remate
const mej = await page.evaluate(async () => {
  match.finished = true; openMatch(); go('match'); mcJugarPartido({ modo: 'mejores', tipos: ['goles', 'corners', 'atajadas'] }); mcSpeed(4);
  let foto = false; const t0 = Date.now();
  while (Date.now() - t0 < 400000) { await new Promise(r => setTimeout(r, 400)); const v = MC2D.estado().v3; if (v && v.mejores && v.mejores.fin) break; }
  const v = MC2D.estado().v3; return { mejores: v.mejores, pref: JSON.parse(localStorage.getItem('mc_ver_partido') || '{}'), done: match.done };
});
{ const M = mej.mejores || { clips: [], vistos: [] };
  ok(M.clips.length > 0 && M.vistos.length === M.clips.length && M.fin, `mejores jugadas: ${M.vistos.length}/${M.clips.length} recortes vistos`);
  ok(M.clips.every(c => ['goles', 'corners', 'atajadas'].includes(c.tipo)), `mejores jugadas con tipos no marcados: ${M.clips.map(c => c.tipo)}`);
  ok(M.vistos.every(c => (TIP[c.tipo] || []).some(t => c.eventos.includes(t))), 'un recorte no tiene la jugada que dice');
  /* 5) por importancia: como máximo 12, en orden de minuto, ninguno menos importante que uno que quedó afuera */
  ok(M.clips.length <= 12, `mejores jugadas: ${M.clips.length} recortes (máximo 12)`);
  ok(M.clips.every((c, i) => i === 0 || c.a > M.clips[i - 1].a), 'mejores jugadas fuera de orden de minuto');
  { const C = M.candidatos || [], el = C.filter(c => c.elegido), fu = C.filter(c => !c.elegido), minEl = Math.min(...el.map(c => c.pri)), maxFu = Math.max(-1, ...fu.map(c => c.pri));
    ok(el.length === M.clips.length && minEl >= maxFu, `mejores jugadas: quedó afuera una más importante (${maxFu} > ${minEl})`); }
  ok(mej.pref.modo === 'mejores', 'no se recordó la elección del menú'); }
/* captura de "mejores jugadas" (otro partido, solo goles, a x1 para la foto) */
await page.evaluate(() => { match.finished = true; openMatch(); go('match'); mcJugarPartido({ modo: 'mejores', tipos: ['goles', 'atajadas'] }); mcSpeed(1); });
await page.waitForTimeout(900); await cap('mejores-jugadas', '#m2dHost');

/* 3) simular partido: directo al resultado con estadísticas */
const sim = await page.evaluate(async () => { MC2D.saltar(); match.finished = true; openMatch(); go('match'); mcJugarPartido({ modo: 'simular' }); await new Promise(r => setTimeout(r, 800));
  return { done: match.done, tiros: [match.shotsH, match.shotsA], tab: (document.querySelector('#m12M .tbs button.on') || {}).textContent || '', filas: document.querySelectorAll('#m12M .pn.st .sr').length }; });
ok(sim.done && sim.tiros[0] + sim.tiros[1] > 0 && /ESTAD/.test(sim.tab) && sim.filas >= 4, `simular: ${JSON.stringify(sim)}`);

/* 4) partido completo de 15 min (solo a mano): se mide a x4 → ~225 s */
let c15 = null;
if (LARGO) {
  await page.evaluate(() => { match.finished = true; openMatch(); go('match'); });
  c15 = await completo(15, 4, false); const v = c15.v, dur = c15.segundos * 4;
  ok(dur >= 630 && dur <= 1170, `partido completo (15 min): ${c15.segundos} s a x4 = ${dur} s a x1 (objetivo 900 ±30%)`);
  ok(v.velMax <= 4.2, `a x4 algo se movió a ${v.velMax}x`);
  ok(v.saltosDibujo === 0 && v.camara.saltos === 0, `15 min: saltos de dibujo ${v.saltosDibujo}, de cámara ${v.camara.saltos}`);
}

/* 5) v2: menú sin "Mejores jugadas" y partido completo que funciona */
const v2 = await page.evaluate(async () => {
  sLoad(); draft.motor = 'v2'; sSave(); match.finished = true; openMatch(); go('match');
  mcVerPartido(); const op = [...document.querySelectorAll('.vp-op')].map(x => x.dataset.m); closeModal();
  mcJugarPartido({ modo: 'completo', min: 3 }); mcSpeed(4); await new Promise(r => setTimeout(r, 4000));
  const e = MC2D.estado(); return { esV3: !!match.v3, opciones: op, minuto: match.minute, jugadores: e.jugadores };
});
ok(!v2.esV3 && v2.opciones.join() === 'completo,simular' && v2.jugadores >= 20 && v2.minuto >= 1, `v2: ${JSON.stringify(v2)}`);

await browser.close();
const res = { ok: !errors.length && !fallas.length, menu, completo3: { ...c3, v: undefined, duracion: c3.v.duracion, velMax: c3.v.velMax, cortes: c3.v.cortes, camara: c3.v.camara, cierre: c3.v.cierre, repeticiones: c3.v.repeticiones, festejos: c3.v.festejos, golesVistos: c3.v.golesVistos, movimiento: c3.v.movimiento, velocidadVista: c3.v.velocidadVista, carteles: c3.v.carteles, saltos: [c3.v.saltosCinta, c3.v.saltosPelota, c3.v.saltosDibujo], pred: c3.v.pred, tiempo: c3.v.tiempoReal },
  completo15: c15 && { segundosX4: c15.segundos, duracionX4: c15.v.duracion, velMax: c15.v.velMax, cortes: c15.v.cortes, camara: c15.v.camara }, mejores: mej, simular: sim, v2, errores: errors, fallas };
writeFileSync('tests/out/v3tv.json', JSON.stringify(res, null, 1));
console.log('VER EL PARTIDO (v3)', res.ok ? 'OK' : 'FALLÓ', '·', `completo 3 min: ${c3.segundos}s a x1 (viendo ${c3.v.duracion}s), vel máx ${c3.v.velMax}x, ${c3.v.cortes} cortes, cámara ${JSON.stringify(c3.v.camara)}, cierre ${c3.v.cierre.corriendo} corriendo de ${c3.v.cierre.muestras}`,
  `· mejores: ${(mej.mejores || { clips: [] }).clips.length} recortes · simular: ${sim.tab}`, c15 ? `· completo 15 min: ${c15.segundos}s a x4` : '');
errors.forEach(e => console.log('ERROR:', e)); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
