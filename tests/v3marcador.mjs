/* MODO CARRERA · motor v3 en el juego: una sola verdad del marcador, del lado del local y del reloj (navegador real)
   Partidos de liga de local y de visitante, de copa (como la arma el juego: un módulo de competencia con un partido
   pendiente) y en cancha neutral (el juego hoy no arma partidos propios en cancha neutral: se fuerza para probar que
   el código lo resuelve). En cada uno, partido completo de 3 minutos a x4, mirando cada 300 ms:
   - el marcador del encabezado, el de la gráfica de TV del 2D y el que sale de los eventos mostrados son siempre iguales
     (y un gol aparece recién cuando se ve en el 2D);
   - el local siempre del mismo lado: encabezado a la izquierda, gráfica de TV a la izquierda, el "(local)" del relato,
     camiseta de local en el 2D;
   - el minuto del encabezado y el reloj del juego nunca van más de 1' adelante del minuto que se ve en el 2D, y el partido
     no termina (ni pasa al descanso) antes de que el 2D llegue al pitazo.
   Además: "Simular hasta el final" termina de una.
   Uso: node tests/v3marcador.mjs <url de index.html>                                                                  */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html';
mkdirSync('tests/out', { recursive: true });
const errors = [], fallas = [], ok = (c, msg) => { if (!c) fallas.push(msg); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 } });
const page = await ctx.newPage();
const ORIGEN = new globalThis.URL(URL).origin;
await ctx.route(u => !u.href.startsWith(ORIGEN), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
await page.evaluate(() => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
  document.getElementById('clubChoice').value = 'River Plate'; document.getElementById('manager').value = 'Prueba';
  window.MC_MOTOR_NUEVAS = 'v2'; createCareer(); sLoad(); draft.motor = 'v3'; sSave();
  window.__venueReal = window.mcVenue;
});

const min2 = t => { const m = String(t || '').match(/(\d+)(?:\+(\d+))?/); return m ? +m[1] + (+m[2] || 0) : null; };
async function caso(nombre, preparar) {
  await page.evaluate(preparar);
  const ini = await page.evaluate(() => { if (match && !match.finished) match.finished = true; openMatch(); go('match');
    MC12.mTab('ev'); return { venue: match.venue, home: match.home, away: match.away, v3: !!match.v3, comp: match.compLabel || '' }; });
  ok(ini.v3, `${nombre}: el partido no es v3 ${JSON.stringify(ini)}`);
  await page.evaluate(() => { mcJugarPartido({ modo: 'completo', min: 3 }); mcSpeed(4); MC12.mTab('ev'); });
  const local = ini.venue === 'a' ? ini.away : ini.home, visita = ini.venue === 'a' ? ini.home : ini.away;
  let relojLog = null, n = 0, maxAdel = -99, maxAdelJuego = -99, finAntes = null, vistos = new Set(), primero = null; const malos = [];
  for (let i = 0; i < 900; i++) {
    await page.waitForTimeout(300);
    const s = await page.evaluate(() => {
      const q = x => document.querySelector(x), v = MC2D.estado().v3;
      if (!q('#m12M .pn.ev.all')) MC12.mTab('ev');   // al terminar, la pantalla pasa sola a "Estadísticas": se vuelve a "Eventos" para leerlos
      const ev = [...document.querySelectorAll('#m12M .pn.ev.all .er strong')].map(x => x.textContent);
      return { izq: (q('#m12M .np.l b') || {}).textContent, der: (q('#m12M .np.r b') || {}).textContent, sc: (q('#m12M .cl strong') || {}).textContent,
        mn: (q('#m12M .cl .mn') || {}).textContent, ev, gl: ev.filter(t => /GOL LOCAL/.test(t)).length, gv: ev.filter(t => /GOL VISITANTE/.test(t)).length,
        tv: v && v.tvMarcador, min2d: v && v.minuto, resultado: v && v.resultado, saltado: !v, phase: match.phase, done: match.done,
        juego: match.minute, h: match.h, a: match.a, ojo: !!(v && v.visto != null), kick: ((match.events || []).find(e => /COMIENZA EL PARTIDO/.test(e.title)) || {}).msg || '' };
    });
    if (!s.tv) continue;
    n++;
    const sc = String(s.sc || '').split('-').map(x => +x.trim());
    const enc = sc, tv = s.tv.g, evs = [s.gl, s.gv];
    if (!(enc[0] === tv[0] && enc[1] === tv[1] && enc[0] === evs[0] && enc[1] === evs[1])) malos.push({ i, enc, tv, evs, min: s.min2d });
    if (s.izq !== local || s.der !== visita || s.tv.loc !== local || s.tv.vis !== visita) malos.push({ i, lados: [s.izq, s.der, s.tv.loc, s.tv.vis], local });
    if (primero == null) { primero = s; ok(s.kick.includes(`${local} (local) recibe a ${visita}`), `${nombre}: el relato no pone a ${local} de local: "${s.kick.slice(0, 80)}"`); }
    const m2 = min2(s.min2d);
    if (m2 != null && !s.resultado && !s.done) {
      const mh = min2(s.mn); if (mh != null) maxAdel = Math.max(maxAdel, mh - m2);
      if (s.phase === 'first' || s.phase === 'second') { const d = (s.juego || 0) - m2; if (d > maxAdelJuego) { maxAdelJuego = d; relojLog = { i, juego: s.juego, min2d: s.min2d, phase: s.phase, ojo: s.ojo }; } }
    }
    if (s.done && finAntes == null) finAntes = m2;
    vistos.add(s.phase);
    if (s.resultado) { const fin = await page.evaluate(() => ({ h: match.h, a: match.a, venue: match.venue }));
      const real = fin.venue === 'a' ? [fin.a, fin.h] : [fin.h, fin.a]; ok(enc[0] === real[0] && enc[1] === real[1], `${nombre}: al final el encabezado dice ${enc} y el resultado es ${real}`); break; }
  }
  ok(n > 50, `${nombre}: casi no hubo muestras (${n})`);
  ok(!malos.length, `${nombre}: ${malos.length} muestras con marcador o lados distintos; primera: ${JSON.stringify(malos[0])}`);
  ok(maxAdel <= 1, `${nombre}: el minuto del encabezado fue ${maxAdel}' adelante del 2D`);
  ok(maxAdelJuego <= 1, `${nombre}: el reloj del juego fue ${maxAdelJuego}' adelante del 2D ${JSON.stringify(relojLog)}`);
  ok(finAntes == null || finAntes >= 90, `${nombre}: el partido terminó cuando el 2D mostraba el minuto ${finAntes}`);
  ok(vistos.has('ht') || vistos.has('second'), `${nombre}: no pasó por el entretiempo`);
  return { nombre, venue: ini.venue, local, visita, comp: ini.comp, muestras: n, malos: malos.length, adelantoEncabezado: maxAdel, adelantoReloj: maxAdelJuego, finCon2D: finAntes };
}
const R = [];
R.push(await caso('liga de local', () => { window.mcVenue = () => 'h'; }));
R.push(await caso('liga de visitante', () => { window.mcVenue = () => 'a'; }));
R.push(await caso('copa (de visitante)', () => { window.mcVenue = window.__venueReal;
  /* así arma el juego un partido de copa: un módulo de competencia con un partido pendiente para esta fecha */
  const opp = career.league.teams.find(t => t !== career.club);
  window.MC_COMPS.push({ pending: c => window.__copaJugada ? null : { at: c.round, home: opp, away: c.club, label: 'COPA DE PRUEBA · OCTAVOS', prio: -9 }, record: () => { window.__copaJugada = true; }, tick: () => {} }); }));
R.push(await caso('cancha neutral', () => { window.__copaJugada = true; window.mcVenue = () => 'n'; }));
/* "Simular hasta el final" termina de una */
const sim = await page.evaluate(async () => { window.mcVenue = window.__venueReal; match.finished = true; openMatch(); go('match'); mcJugarPartido({ modo: 'completo', min: 3 }); mcSpeed(1);
  await new Promise(r => setTimeout(r, 3000)); const t0 = performance.now(); mcSimEnd(); return { done: match.done, ms: Math.round(performance.now() - t0), h: match.h, a: match.a }; });
ok(sim.done && sim.ms < 5000, `simular hasta el final: ${JSON.stringify(sim)}`);
await browser.close();
const res = { ok: !errors.length && !fallas.length, casos: R, simular: sim, errores: errors, fallas };
writeFileSync('tests/out/v3marcador.json', JSON.stringify(res, null, 1));
console.log('MARCADOR, LOCALÍA Y RELOJ (v3)', res.ok ? 'OK' : 'FALLÓ', '·', R.map(r => `${r.nombre}: ${r.muestras} muestras, adelanto ${r.adelantoEncabezado}/${r.adelantoReloj}'`).join(' · '));
errors.forEach(e => console.log('ERROR:', e)); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
