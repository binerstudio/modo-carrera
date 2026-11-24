/* MODO CARRERA · prueba de la página visual del motor v3 (v3.html, no enlazada desde el juego)
   - Simula River Plate vs Boca Juniors, reproduce en x16 y comprueba que avanza, sin errores de la página.
   - El marcador dibujado al final coincide con el resultado del motor.
   - Guarda capturas en tests/out/v3-*.png (en CI se suben a la rama capturas-ci).
   Uso: node tests/v3html.mjs <url de v3.html>                                                       */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/v3.html';
mkdirSync('tests/out', { recursive: true });
const errors = [], fallas = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
/* sin red externa (con file:// se bloquea todo lo que sea http) */
const ORIGEN = URL.startsWith('file:') ? null : new globalThis.URL(URL).origin;
await ctx.route(u => ORIGEN ? !u.href.startsWith(ORIGEN) : /^https?:/.test(u.href), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
await page.goto(URL, { waitUntil: 'load' });
await page.selectOption('#cL', 'River Plate').catch(() => fallas.push('no está River Plate'));
await page.selectOption('#cV', 'Boca Juniors').catch(() => fallas.push('no está Boca Juniors'));
await page.click('#simular');
await page.waitForFunction(() => window.V3 && V3.estado().frames > 0, null, { timeout: 60000 });
const e0 = await page.evaluate(() => V3.estado());
/* captura en el minuto ~10, con nombres */
await page.evaluate(() => V3.ir(6000));
await page.click('#nombres');
await page.locator('canvas').screenshot({ path: 'tests/out/v3-minuto10.png' });
await page.click('#nombres');
/* reproducir en x16 unos segundos */
await page.click('.vel[data-v="16"]');
await page.click('#play');
await page.waitForTimeout(3000);
const e1 = await page.evaluate(() => V3.estado());
await page.click('#play');
const avanzo = e1.k - 6000;
if (!(avanzo > 300)) fallas.push(`la reproducción en x16 casi no avanzó (${avanzo} cuadros en 3 s)`);
await page.screenshot({ path: 'tests/out/v3-pagina.png', fullPage: true });
/* capturas en otros momentos del partido */
for (const [k, n] of [[20000, 'minuto33'], [40000, 'minuto65']]) { await page.evaluate(k => V3.ir(k), k); await page.locator('canvas').screenshot({ path: `tests/out/v3-${n}.png` }); }
/* al final, el marcador dibujado es el del motor */
const fin = await page.evaluate(() => { V3.ir(V3.estado().frames - 1); return V3.estado(); });
if (fin.gol !== fin.marcador.join(' - ')) fallas.push(`marcador dibujado ${fin.gol} distinto del resultado ${fin.marcador.join('-')}`);
/* pelota parada (etapa 3): busca un partido con penal, tiro libre con barrera y córner, y mira cómo se paran */
const semilla = await page.evaluate(() => V3.buscarSemilla(80));
const pp = {};
if (!semilla) fallas.push('no se encontró un partido con penal, barrera y córner en 80 semillas');
else {
  await page.evaluate(s => V3.semilla(String(s)), semilla);
  await page.click('#simular');
  await page.waitForFunction(s => window.V3 && V3.estado().frames > 0 && document.getElementById('semilla').value === String(s) && /Listo/.test(document.getElementById('estado').textContent), semilla, { timeout: 60000 });
  pp.semilla = semilla;
  pp.barrera = await page.evaluate(() => V3.pelotaParada('tiro_libre', 0, e => e.barrera >= 2));
  await page.locator('canvas').screenshot({ path: 'tests/out/v3-barrera.png' });
  pp.corner = await page.evaluate(() => V3.pelotaParada('corner', 0));
  await page.locator('canvas').screenshot({ path: 'tests/out/v3-corner.png' });
  pp.penal = await page.evaluate(() => V3.pelotaParada('penal', 0));
  await page.locator('canvas').screenshot({ path: 'tests/out/v3-penal.png' });
  const b = pp.barrera, c = pp.corner, p = pp.penal;
  if (!b || b.enBarrera < b.evento.barrera) fallas.push(`tiro libre: barrera de ${b && b.evento.barrera} pero hay ${b && b.enBarrera} rivales a 9,15 m`);
  if (b && b.rivalesCerca > 0) fallas.push(`tiro libre: ${b.rivalesCerca} rivales a menos de 9,15 m`);
  if (!c || c.propiosEnArea < 3) fallas.push(`córner: solo ${c && c.propiosEnArea} atacantes en el área`);
  if (!p || p.enAreaTotal > 2) fallas.push(`penal: hay ${p && p.enAreaTotal} jugadores en el área (deberían ser el pateador y el arquero)`);
}
/* el lienzo no está vacío: muchos colores distintos */
const colores = await page.evaluate(() => { const c = document.getElementById('cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let i = 0; i < d.length; i += 400) s.add(d[i] >> 4 << 8 | d[i + 1] >> 4 << 4 | d[i + 2] >> 4); return s.size; });
if (colores < 8) fallas.push('el lienzo parece vacío');
await browser.close();
const ok = !errors.length && !fallas.length;
const res = { ok, pelotaParada: pp, inicio: e0, despuesX16: e1, avanzoCuadros: avanzo, final: fin, colores, errores: errors, fallas };
writeFileSync('tests/out/v3html.json', JSON.stringify(res, null, 1));
console.log('PÁGINA v3.html', ok ? 'OK' : 'FALLÓ', '·', `${fin.marcador.join('-')} · ${e0.frames} cuadros · x16 avanzó ${avanzo} cuadros en 3 s · reloj final ${fin.reloj}`);
console.log('pelota parada:', JSON.stringify(pp));
errors.forEach(e => console.log('ERROR:', e)); fallas.forEach(f => console.log('FALLA:', f));
process.exit(ok ? 0 : 1);
