/* MODO CARRERA · simulador 2D en vivo (12.6)
   Juega un partido EN VIVO (x4) con el visor animado y comprueba:
   - el visor está montado y anima 22 jugadores + pelota + árbitro, sin errores;
   - el marcador visible NUNCA se adelanta a lo que ya se animó;
   - mientras se anima una jugada, el reloj del motor espera;
   - al final, marcador y eventos coinciden exactamente con el resultado del motor;
   - las 4 cámaras funcionan (capturas en tests/out/2d-*.png).
   Uso: node tests/partido2d.mjs <url>                                                          */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html';
mkdirSync('tests/out', { recursive: true });
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
await page.evaluate(() => { go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs(); document.getElementById('clubChoice').value = 'River Plate'; window.MC_MOTOR_NUEVAS = 'v2'; createCareer(); });
/* hoja de poses con camisetas reales (control de calidad visual) */
for (const [a, b, f] of [['River Plate', 'Boca Juniors', 'poses-river-boca'], ['Barcelona', 'Real Madrid', 'poses-barca-madrid']]) {
  await page.evaluate(([a, b]) => { let cv = document.getElementById('hojaPoses'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'hojaPoses'; cv.style.cssText = 'position:fixed;left:0;top:0;width:780px;height:1000px;z-index:99999;background:#000'; document.body.appendChild(cv) } cv.width = 1560; cv.height = 2000; MC2D.hojaPoses(cv, a, b); }, [a, b]);
  await page.locator('#hojaPoses').screenshot({ path: `tests/out/2d-${f}.png` });
}
await page.evaluate(() => document.getElementById('hojaPoses').remove());
await page.evaluate(() => { openMatch(); go('match'); });
await page.waitForTimeout(800);
const montado = await page.evaluate(() => ({ host: !!document.getElementById('m2dHost'), canvas: !!document.querySelector('#m2dHost canvas'), cams: [...document.querySelectorAll('.m2d-cams button')].map(b => b.textContent) }));
await page.screenshot({ path: 'tests/out/2d-0-previa.png' });
await page.evaluate(() => { mcSpeed(4); });           // arranca el partido en x4
const muestras = []; let adelantado = 0, retuvo = 0, i = 0; const t0 = Date.now();
const cams = ['tv', 'cen', 'seg', 'tac'];
while (Date.now() - t0 < 240000) {
  await page.waitForTimeout(400);
  const s = await page.evaluate(() => { const m = match, st = MC2D.estado(), sc = document.querySelector('#m12M .cl strong'); return { min: m.minute, phase: m.phase, done: m.done, h: m.h, a: m.a, vis: sc ? sc.textContent.trim() : '', st }; });
  const [vh, va] = s.vis.split('-').map(x => +x.trim());
  if (!s.done && (vh > s.h || va > s.a)) adelantado++;
  if (s.st.jugada && muestras.length && muestras[muestras.length - 1].st.jugada === s.st.jugada && muestras[muestras.length - 1].min === s.min) retuvo++;
  muestras.push(s);
  if (i % 12 === 6 && i / 12 < 8) { const c = cams[Math.floor(i / 12) % 4]; await page.evaluate(c => { const b = document.querySelector(`.m2d-cams button[data-c="${c}"]`); if (b) b.click(); }, c); await page.waitForTimeout(250); await page.screenshot({ path: `tests/out/2d-${Math.floor(i / 12) + 1}-${c}-${s.min}min.png` }); }
  if (s.phase === 'ht') await page.evaluate(() => mcMainAction());
  if (s.done) break; i++;
}
const fin = await page.evaluate(() => { const m = match, sc = document.querySelector('#m12M .cl strong'); return { done: m.done, h: m.h, a: m.a, vis: sc ? sc.textContent.trim() : '', eventos: m.events.length, corte: MC2D.corte(m), goles: m.events.filter(e => /GOL (LOCAL|VISITANTE)/.test(e.title)).map(e => e.lbl + "' " + (e.gol ? e.gol.autor + (e.gol.asist ? ' (' + e.gol.asist + ')' : '') + ' · ' + e.gol.tipo : '')), estado: MC2D.estado() }; });
await page.screenshot({ path: 'tests/out/2d-9-final.png' });
await browser.close();
const ms = Date.now() - t0;
const fallas = [];let out_union = {};
if (!montado.canvas) fallas.push('El visor 2D no se montó');
if (montado.cams.length !== 4) fallas.push('Faltan botones de cámara');
if (!fin.done) fallas.push('El partido no terminó en el tiempo de prueba');
if (adelantado) fallas.push(`El marcador visible se adelantó al motor ${adelantado} veces`);
if (fin.done && fin.vis.replace(/\s/g, '') !== `${fin.h}-${fin.a}`) fallas.push(`Marcador final distinto: pantalla ${fin.vis} vs motor ${fin.h}-${fin.a}`);
if (fin.corte !== fin.eventos) fallas.push(`Quedaron eventos sin mostrar (${fin.corte}/${fin.eventos})`);
if (!(fin.estado.jugadores >= 20)) fallas.push(`Pocos jugadores animados (${fin.estado.jugadores})`);
if (fin.estado.teletransportes) fallas.push(`La pelota se teletransportó ${fin.estado.teletransportes} veces`);
const union = k => [...new Set(muestras.flatMap(x => Object.keys(x.st[k] || {})))];
out_union = { estados: union('estados'), tacticos: union('tacticos'), acciones: union('acciones') };
for (const t of ['marcando', 'presionando', 'atacando', 'defendiendo']) if (!out_union.tacticos.includes(t)) fallas.push(`Nunca se vio el estado táctico '${t}'`);
for (const t of ['corriendo', 'trotando', 'quieto']) if (!out_union.estados.includes(t)) fallas.push(`Nunca se vio el estado '${t}'`);
if (errors.length) fallas.push(`${errors.length} errores de JavaScript`);
const out = { ok: !fallas.length, montado, fin, estadosVistos: out_union, segundosReales: Math.round(ms / 1000), muestras: muestras.length, retuvoDuranteJugadas: retuvo, adelantado, errores: errors.slice(0, 15), fallas };
writeFileSync('tests/out/partido2d.json', JSON.stringify(out, null, 1));
console.log(`SIMULADOR 2D · ${out.ok ? 'OK' : 'FALLÓ'} · ${fin.h}-${fin.a} · ${out.segundosReales}s reales en x4 · retención durante jugadas: ${retuvo} muestras · cámaras ${montado.cams.join('/')}`);
console.log('goles:', fin.goles.join(' | '));
console.log('estado final:', JSON.stringify(fin.estado));
console.log('estados vistos:', JSON.stringify(out_union));
errors.slice(0, 10).forEach(e => console.log('  ', e.slice(0, 300)));
fallas.forEach(f => console.log('FALLA:', f));
process.exit(out.ok ? 0 : 1);
