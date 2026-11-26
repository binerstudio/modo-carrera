/* MODO CARRERA · carga en el celular (Etapa de datos)
   Abre la página emulando un iPhone 13 con la CPU 4 veces más lenta y mide: tiempo hasta que se ve,
   bytes descargados al abrir (sin escudos de ligas que no se miran), tamaño de la base de jugadores y memoria.
   Después crea una carrera con un club de una división nueva (planteles generados en la base) y vuelve a abrir la
   página: mide otra vez el tiempo hasta que se ve con esa carrera abierta.
   Uso: node tests/carga-movil.mjs <url> [máximo de ms visibles] [máximo de KB al abrir]           */
import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html', MAXMS = +(process.argv[3] || 0), MAXKB = +(process.argv[4] || 0);
const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
const files = []; let bytes = 0;
p.on('response', async r => { try { const buf = await r.body(); bytes += buf.length; files.push([r.url().replace(/^.*\/\/[^/]+\//, ''), buf.length]); } catch (e) { } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
const t0 = Date.now(); await p.goto(URL, { waitUntil: 'load' }); const tLoad = Date.now() - t0;
await p.waitForFunction(() => !document.documentElement.classList.contains('mc-cargando'), null, { timeout: 30000 }); const tVis = Date.now() - t0;
await p.waitForTimeout(800);
const m = await p.evaluate(() => { const t = performance.now(); const d = mcDB(); return { jugadores: d.list.length, dbMs: Math.round(performance.now() - t), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null, ligas: Object.keys(CLUBS).length }; });
const escudos = files.filter(f => /assets\/(escudos|ligas)/.test(f[0]));
const out = { url: URL, msHastaLoad: tLoad, msHastaVisible: tVis, kbAlAbrir: Math.round(bytes / 1024), archivos: files.length, escudosDescargados: escudos.length, kbEscudos: Math.round(escudos.reduce((a, f) => a + f[1], 0) / 1024), ...m, errores: errors,
  masPesados: files.sort((a, c) => c[1] - a[1]).slice(0, 8).map(f => f[0].split('?')[0] + ' ' + Math.round(f[1] / 1024) + ' KB') };
const kbPrimera = bytes / 1024;
/* con una carrera abierta: una de primera (Arsenal, existe también en la versión anterior) y una de una división nueva */
const hayDiv = await p.evaluate(() => !!window.MC_DIVR);
async function conCarrera(K, club) {
  await p.evaluate(({ K, club }) => { go('newcareer'); const c = document.getElementById('country'); if (![...c.options].some(o => o.value === K)) c.add(new Option(K, K)); c.value = K; fillClubs(); document.getElementById('clubChoice').value = club; createCareer(); }, { K, club });
  const t1 = Date.now(); await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => !document.documentElement.classList.contains('mc-cargando'), null, { timeout: 60000 });
  const ms = Date.now() - t1; await p.waitForTimeout(800);
  return { ms, ...(await p.evaluate(() => ({ club: career && career.club, jugadores: mcDB().list.length, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null }))) };
}
out.conCarreraPrimera = await conCarrera('Inglaterra', 'Arsenal');
if (hayDiv) out.conCarreraDivision = await conCarrera('Inglaterra · EFL Championship', 'Wrexham');
console.log(JSON.stringify(out, null, 1));
mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/carga-movil.json', JSON.stringify(out, null, 1));
await b.close();
let ok = !errors.length; if (MAXMS && out.conCarreraDivision && out.conCarreraDivision.ms > MAXMS * 1.2 + out.conCarreraPrimera.ms - tVis) { console.log(`✗ con la carrera de una división nueva tardó ${out.conCarreraDivision.ms} ms (con una de primera ${out.conCarreraPrimera.ms})`); ok = false; }
if (MAXMS && tVis > MAXMS) { console.log(`✗ tardó ${tVis} ms en verse (máximo ${MAXMS})`); ok = false; } if (MAXKB && kbPrimera > MAXKB) { console.log(`✗ descargó ${Math.round(kbPrimera)} KB al abrir (máximo ${MAXKB})`); ok = false; }
console.log(ok ? '✓ carga en el celular OK' : '✗ carga en el celular con problemas'); process.exit(ok ? 0 : 1);
