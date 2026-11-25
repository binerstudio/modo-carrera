/* MODO CARRERA · pantalla completa del 2D (motor v3) en un iPhone emulado (navegador real)
   - Teléfono vertical: el visor ocupa TODA la pantalla visible (sin franjas), girado a horizontal (el dibujo es más ancho
     que alto) y por encima de todo; los controles quedan adentro.
   - Teléfono horizontal: el visor ocupa toda la pantalla, sin girar.
   - Al salir, vuelve a su lugar en la página.
   Capturas: v3pantalla-vertical.png, v3pantalla-horizontal.png.
   Uso: node tests/v3pantalla.mjs <url de index.html>                                                                  */
import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html';
mkdirSync('tests/out', { recursive: true });
const errors = [], fallas = [], ok = (c, msg) => { if (!c) fallas.push(msg); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
/* en iPhone, Safari no tiene pantalla completa para páginas (solo para videos): se saca la API como allá */
await ctx.addInitScript(() => { try { delete Element.prototype.requestFullscreen; delete Element.prototype.webkitRequestFullscreen; } catch (e) {} });
const page = await ctx.newPage();
const ORIGEN = new globalThis.URL(URL).origin;
await ctx.route(u => !u.href.startsWith(ORIGEN), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
await page.evaluate(() => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
  document.getElementById('clubChoice').value = 'River Plate'; document.getElementById('manager').value = 'Prueba';
  window.MC_MOTOR_NUEVAS = 'v2'; createCareer(); sLoad(); draft.motor = 'v3'; sSave(); openMatch(); go('match');
  mcJugarPartido({ modo: 'completo', min: 3 });
});
await page.waitForTimeout(2500);
const medir = () => page.evaluate(() => {
  const w = document.querySelector('.m2d-wrap'), cv = w && w.querySelector('canvas.m2d'), r = w ? w.getBoundingClientRect() : null;
  const vw = window.innerWidth, vh = window.innerHeight;
  /* lo que está arriba de todo en el centro y en las cuatro esquinas tiene que ser el visor */
  const arriba = [[vw / 2, vh / 2], [2, 2], [vw - 3, 2], [2, vh - 3], [vw - 3, vh - 3]].map(([x, y]) => { const e = document.elementFromPoint(x, y); return !!(e && w && w.contains(e)); });
  return { vw, vh, rect: r && { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, lienzo: cv && { w: cv.clientWidth, h: cv.clientHeight },
    girado: !!(w && getComputedStyle(w).transform !== 'none'), arriba, full: document.body.classList.contains('m2d-full'), v3: !!(MC2D.estado().v3) };
});
await page.evaluate(() => MC2D.pantallaCompleta(true)); await page.waitForTimeout(800);
const vert = await medir();
await page.screenshot({ path: 'tests/out/v3pantalla-vertical.png' });
{ const { vw, vh, rect: r, lienzo: L } = vert;
  ok(vert.full && vert.v3, `pantalla completa (vertical): no se activó ${JSON.stringify(vert)}`);
  ok(r && Math.abs(r.x) <= 1 && Math.abs(r.y) <= 1 && Math.abs(r.w - vw) <= 1 && Math.abs(r.h - vh) <= 1, `pantalla completa (vertical): no ocupa toda la pantalla ${JSON.stringify(vert)}`);
  ok(L && L.w > L.h && Math.abs(L.w - vh) <= 2 && Math.abs(L.h - vw) <= 2, `pantalla completa (vertical): el dibujo no está girado a horizontal ${JSON.stringify(vert)}`);
  ok(vert.arriba.every(Boolean), `pantalla completa (vertical): algo tapa el visor ${JSON.stringify(vert.arriba)}`); }
await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(800);
const hor = await medir();
await page.screenshot({ path: 'tests/out/v3pantalla-horizontal.png' });
{ const { vw, vh, rect: r, lienzo: L } = hor;
  ok(r && Math.abs(r.x) <= 1 && Math.abs(r.y) <= 1 && Math.abs(r.w - vw) <= 1 && Math.abs(r.h - vh) <= 1 && !hor.girado, `pantalla completa (horizontal): ${JSON.stringify(hor)}`);
  ok(L && Math.abs(L.w - vw) <= 2 && Math.abs(L.h - vh) <= 2, `pantalla completa (horizontal): el dibujo no ocupa todo ${JSON.stringify(hor)}`);
  ok(hor.arriba.every(Boolean), `pantalla completa (horizontal): algo tapa el visor ${JSON.stringify(hor.arriba)}`); }
await page.evaluate(() => MC2D.pantallaCompleta(false)); await page.waitForTimeout(500);
const sale = await page.evaluate(() => { const w = document.querySelector('.m2d-wrap'); return { full: document.body.classList.contains('m2d-full'), enPagina: !!(w && w.closest('#m2dHost')) }; });
ok(!sale.full && sale.enPagina, `al salir de pantalla completa: ${JSON.stringify(sale)}`);
await browser.close();
const res = { ok: !errors.length && !fallas.length, vertical: vert, horizontal: hor, salida: sale, errores: errors, fallas };
writeFileSync('tests/out/v3pantalla.json', JSON.stringify(res, null, 1));
console.log('PANTALLA COMPLETA (iPhone)', res.ok ? 'OK' : 'FALLÓ', '·', `vertical ${vert.rect && vert.rect.w}x${vert.rect && vert.rect.h} (dibujo ${vert.lienzo && vert.lienzo.w}x${vert.lienzo && vert.lienzo.h}) · horizontal ${hor.rect && hor.rect.w}x${hor.rect && hor.rect.h}`);
errors.forEach(e => console.log('ERROR:', e)); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
