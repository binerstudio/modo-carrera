/* MODO CARRERA · etapa 6: el 2D dibuja la simulación real del motor v3 (navegador real)
   Un partido v3 completo a x1 con duración "Corto": 0 saltos de jugadores y pelota (en la cinta y en lo dibujado),
   lo dibujado coincide con la cinta, festejo y repetición si hay goles, duración ~3 min (±20%), pantalla completa,
   y capturas (TV, estadio, repetición, pantalla completa). Después: v2 con la nueva duración y la pantalla completa.
   Uso: node tests/v3tv.mjs <url de index.html>                                                                   */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html';
mkdirSync('tests/out', { recursive: true });
const errors = [], fallas = [], ok = (c, msg) => { if (!c) fallas.push(msg); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
const page = await ctx.newPage();
const ORIGEN = URL.startsWith('file:') ? null : new globalThis.URL(URL).origin;
await ctx.route(u => ORIGEN ? !u.href.startsWith(ORIGEN) : /^https?:/.test(u.href), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if ((m.type() === 'error' && !/Failed to load resource/.test(m.text())) || (m.type() === 'warning' && /MC2D|motor v3/i.test(m.text()))) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept()); page.on('crash', () => errors.push('la página se cayó (crash)'));
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
const club = process.argv[3] || 'River Plate';
const prep = await page.evaluate(club => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
  document.getElementById('clubChoice').value = club; document.getElementById('manager').value = 'Prueba';
  window.MC_MOTOR_NUEVAS = 'v2'; createCareer();
  sLoad(); draft.motor = 'v3'; draft.matchLength = 'quick'; sSave();
  const opt = (OP.motor || []).find(o => o[0] === 'v3');
  openMatch(); go('match'); window.mcSpeed && mcSpeed(1);
  return { v3: !!(match && match.v3), largo: document.getElementById('matchLength').value, texto: opt && opt[1], tv: !!(window.MCV3TV && MCV3TV.de(match)) };
}, club);
ok(prep.v3 && prep.tv, 'el partido no quedó con la cinta v3');
ok(prep.texto === 'En cancha (v3)', `texto de la opción: ${prep.texto}`);
ok(prep.largo === 'quick', 'la duración no quedó en Corto');
await page.evaluate(() => mcMainAction());
const t0 = Date.now(); let muestras = [], verif = [], cap = { tv: false, estadio: false, rep: false, full: false }, maxDif = 0, ht = null;
for (let i = 0; i < 400; i++) {
  await page.waitForTimeout(1000);
  const e = await page.evaluate(() => ({ est: MC2D.estado(), ver: MC2D.verificarV3(), fase: match.phase, done: match.done, min: MC2D.minuto(match) }));
  const v = e.est.v3; muestras.push({ s: Math.round((Date.now() - t0) / 1000), min: e.min, fase: e.fase, ritmo: v && v.ritmo });
  if (e.ver) { maxDif = Math.max(maxDif, e.ver.difMax); verif.push(e.ver) }
  if (!cap.tv && i === 12) { await page.locator('#m2dHost').screenshot({ path: 'tests/out/v3tv-tv.png' }).catch(() => {}); cap.tv = true }
  if (!cap.estadio && i === 20) { await page.evaluate(() => { const b = document.querySelector('.m2d-cams button[data-c="cen"]'); b && b.click() }); await page.waitForTimeout(600);
    await page.locator('#m2dHost').screenshot({ path: 'tests/out/v3tv-estadio.png' }).catch(() => {}); await page.evaluate(() => { const b = document.querySelector('.m2d-cams button[data-c="tv"]'); b && b.click() }); cap.estadio = true }
  if (!cap.full && i === 30) { await page.evaluate(() => MC2D.pantallaCompleta(true)); await page.waitForTimeout(700);
    const fs = await page.evaluate(() => { const w = document.querySelector('.m2d-wrap').getBoundingClientRect(); return { full: document.body.classList.contains('m2d-full'), w: w.width, h: w.height, ctl: !!document.querySelector('.m2d-ctl button[data-a="cambios"]') && getComputedStyle(document.querySelector('.m2d-ctl')).display !== 'none' } });
    ok(fs.full && fs.w >= 880 && fs.h >= 880 && fs.ctl, `pantalla completa: ${JSON.stringify(fs)}`);
    await page.screenshot({ path: 'tests/out/v3tv-pantalla-completa.png' }); await page.evaluate(() => MC2D.pantallaCompleta(false)); cap.full = true }
  if (!cap.rep && v && v.enRepeticion) { await page.locator('#m2dHost').screenshot({ path: 'tests/out/v3tv-repeticion.png' }).catch(() => {}); cap.rep = true }
  if (e.fase === 'ht' && v && v.tp >= (await page.evaluate(() => (MCV3TV.de(match).fin[1] || 0) - 5)) && !ht) { ht = Math.round((Date.now() - t0) / 1000); await page.evaluate(() => mcMainAction()) }
  if (e.done && v && v.tp >= v.tMotor - 1) break;
}
const fin = await page.evaluate(() => ({ est: MC2D.estado(), h: match.h, a: match.a, goles: match.events.filter(e => /GOL (LOCAL|VISITANTE)/.test(e.title)).length, origen: (MCV3TV.de(match).eventos || []).filter(e => e.tipo === 'gol').map(e => ({ origen: e.origen, errorArquero: !!e.errorArquero })) }));
const v = fin.est.v3, dur = v.tiempoReal.viendo;
ok(v.saltosCinta === 0 && v.saltosPelota === 0, `saltos en la cinta: jugadores ${v.saltosCinta}, pelota ${v.saltosPelota} ${JSON.stringify(v.saltoLog)}`);
ok(v.saltosDibujo === 0, `saltos en lo dibujado: ${v.saltosDibujo} ${JSON.stringify(v.saltoLog)}`);
ok(maxDif < 1e-6 && verif.length > 20, `lo dibujado no coincide con la cinta (dif ${maxDif}, ${verif.length} muestras)`);
const golesPropios = fin.origen.filter(g => g.origen !== 'en_contra').length;
ok(fin.h + fin.a === 0 || v.repeticiones.length > 0, `hubo ${fin.h + fin.a} goles pero ninguna repetición`);
ok(golesPropios === 0 || (v.festejos > 0 && v.abrazos > 0), `hubo ${golesPropios} goles (no en contra) pero festejos=${v.festejos} abrazos=${v.abrazos}`);
ok(dur >= 144 && dur <= 216, `duración Corto a x1: ${dur} s (objetivo 180 ±20%)`);
await page.screenshot({ path: 'tests/out/v3tv-final.png' });
/* v2: la nueva duración y la pantalla completa también funcionan */
const v2 = await page.evaluate(async () => {
  sLoad(); draft.motor = 'v2'; draft.matchLength = 'quick'; sSave(); match.finished = true; openMatch(); go('match'); mcSpeed(4);
  const esV3 = !!match.v3; mcMainAction(); await new Promise(r => setTimeout(r, 3000));
  MC2D.pantallaCompleta(true); await new Promise(r => setTimeout(r, 500)); const full = document.body.classList.contains('m2d-full'); MC2D.pantallaCompleta(false);
  const e = MC2D.estado(); return { esV3, full, minuto: match.minute, jugadores: e.jugadores };
});
ok(!v2.esV3 && v2.full && v2.jugadores >= 20, `v2: ${JSON.stringify(v2)}`);
await browser.close();
const res = { ok: !errors.length && !fallas.length, prep, duracionReal: dur, entretiempoEn: ht, v3: v, goles: fin.origen, marcador: [fin.h, fin.a], muestras: muestras.filter((_, i) => i % 10 === 0), v2, errores: errors, fallas };
writeFileSync('tests/out/v3tv.json', JSON.stringify(res, null, 1));
console.log('2D DEL MOTOR v3', res.ok ? 'OK' : 'FALLÓ', '·', `${fin.h}-${fin.a} · duración ${dur}s a x1 (Corto) · saltos cinta ${v.saltosCinta}/${v.saltosPelota} dibujo ${v.saltosDibujo} · festejos ${v.festejos} abrazos ${v.abrazos} · repeticiones ${v.repeticiones.length} ${JSON.stringify(v.repeticiones)} · tiempo ${JSON.stringify(v.tiempoReal)}`);
errors.forEach(e => console.log('ERROR:', e)); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
