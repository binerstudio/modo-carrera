/* MODO CARRERA · banco de pruebas de regresión (Etapa 1)
   Juega temporadas completas en un navegador real con azar y reloj fijos, para que
   el mismo código produzca SIEMPRE los mismos resultados. Guarda un resumen en
   tests/out/<nombre>.json; la "huella" permite comparar versiones.
   Uso: node tests/regresion.mjs http://localhost:8080/index.html [nombre]           */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = process.argv[2] || 'http://localhost:8080/index.html';
const NAME = process.argv[3] || 'resultado';
const SEED = 20261123;
const CASES = [
  { country: 'Argentina', club: 'River Plate', seasons: 2 },
  { country: 'España', club: 'Real Madrid', seasons: 1 },
  { country: 'Inglaterra', club: 'Arsenal', seasons: 1 },
];

const seedScript = `(()=>{let s=${SEED}>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};})();`;
const sha = o => createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 16);

async function newPage(browser, errors, missing) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
  await page.addInitScript(seedScript);
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) missing.add(r.status() + ' ' + new globalThis.URL(r.url()).pathname); });
  page.on('dialog', d => d.accept());
  // Sin red externa: fuentes y escudos en línea no deben afectar el resultado.
  await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
  return { ctx, page };
}

async function playCase(browser, cs) {
  const errors = [], missing = new Set();
  const { ctx, page } = await newPage(browser, errors, missing);
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const boot = await page.evaluate(() => ({
    title: document.title,
    players: (window.MC_PLAYERS || {}).rows?.length || 0,
    leagues: Object.keys(window.LEAGUES || {}).length,
  }));
  const created = await page.evaluate(({ country, club }) => {
    go('newcareer');
    const c = document.getElementById('country');
    if (![...c.options].some(o => o.value === country)) c.add(new Option(country, country));
    c.value = country; fillClubs();
    const s = document.getElementById('clubChoice');
    const opt = [...s.options].find(o => o.value === club || o.textContent.trim() === club);
    if (!opt) return { ok: false, options: [...s.options].slice(0, 8).map(o => o.value) };
    s.value = opt.value;
    document.getElementById('manager').value = 'Prueba';
    createCareer();
    return { ok: !!career && career.club === opt.value, club: career && career.club, squad: career && career.players.length };
  }, cs);
  if (!created.ok) { await ctx.close(); return { case: cs, boot, created, errors, missing: [...missing], ok: false }; }

  const seasons = [];
  for (let s = 0; s < cs.seasons; s++) {
    const res = await page.evaluate(() => {
      const user = []; let guard = 0;
      while (!mcSeasonOver() && guard++ < 120) {
        openMatch();
        if (!match) break;
        mcSimEnd();
        user.push([match.home || '', match.away || '', match.h, match.a]);
        match.finished = true;
      }
      const L = career.league; const all = [];
      (L ? L.rounds : []).forEach(d => d.forEach(f => { if (f[2] != null) all.push([L.teams[f[0]], L.teams[f[1]], f[2], f[3]]) }));
      const goals = all.reduce((a, f) => a + f[2] + f[3], 0);
      const hw = all.filter(f => f[2] > f[3]).length, dr = all.filter(f => f[2] === f[3]).length;
      const big = all.filter(f => Math.abs(f[2] - f[3]) >= 5).length;
      const ug = user.reduce((a, f) => a + f[2] + f[3], 0);
      const table = (window.mcLeagueTable ? [] : []);
      return {
        season: career.season, userMatches: user.length, user,
        league: { matches: all.length, goalsPerMatch: +(goals / Math.max(1, all.length)).toFixed(3),
          homeWin: +(hw / Math.max(1, all.length)).toFixed(3), draw: +(dr / Math.max(1, all.length)).toFixed(3),
          diff5plus: big, maxGoals: Math.max(0, ...all.map(f => f[2] + f[3])) },
        userGoalsPerMatch: +(ug / Math.max(1, user.length)).toFixed(3),
        position: typeof rank === 'function' ? rank() : null,
        points: career.points, budget: career.budget, squad: career.players.length,
        allResults: all, guard,
      };
    });
    res.hash = sha([res.user, res.allResults]);
    seasons.push(res);
    if (s < cs.seasons - 1) await page.evaluate(() => mcNewSeason());
  }

  // Guardar, recargar y comprobar que la carrera vuelve igual.
  const size = await page.evaluate(() => window.MCRespaldo ? MCRespaldo.usage().then(u => ({ localStorageKB: Math.round(u.localStorageBytes / 1024), careerKB: Math.round(u.careerBytes / 1024) })) : null);
  const before = await page.evaluate(() => { save(); return { id: career.id, season: career.season, round: career.round, points: career.points, squad: career.players.length, budget: career.budget, keys: Object.keys(localStorage).filter(k => /^(mc_|modo_carrera)/.test(k)).sort() }; });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => (typeof career !== 'undefined' && career) ? { id: career.id, season: career.season, round: career.round, points: career.points, squad: career.players.length, budget: career.budget } : null);
  const reloadOk = !!after && ['id', 'season', 'round', 'points', 'squad', 'budget'].every(k => after[k] === before[k]);

  await ctx.close();
  for (const s of seasons) delete s.allResults;
  return { case: cs, boot, created, seasons, save: { before, after, reloadOk }, size, errors, missing: [...missing].sort(), ms: Date.now() - t0,
    ok: errors.length === 0 && reloadOk && seasons.every(s => s.userMatches > 0) };
}

async function pruebaEspacio(browser) {
  const errors = [], missing = new Set();
  const { ctx, page } = await newPage(browser, errors, missing);
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1200);
  if (!(await page.evaluate(() => !!window.MCRespaldo))) { await ctx.close(); return { ok: null, nota: 'sin módulo de respaldo (versión base)' }; }
  const snap = await page.evaluate(async () => {
    go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
    document.getElementById('clubChoice').value = 'Boca Juniors'; createCareer();
    for (let i = 0; i < 3; i++) { openMatch(); mcSimEnd(); match.finished = true; }
    save(); await MCRespaldo.flush();
    const okBefore = { round: career.round, seq: career._guardado };
    // simular almacenamiento lleno SOLO para la carrera
    const proto = Storage.prototype, o = proto.setItem;
    proto.setItem = function (k, v) { if (String(k).startsWith('mc_career_v7_')) throw new DOMException('lleno', 'QuotaExceededError'); return o.call(this, k, v); };
    for (let i = 0; i < 2; i++) { openMatch(); mcSimEnd(); match.finished = true; }
    save();
    const modal = document.getElementById('modal').classList.contains('open') && /Sin espacio/.test(document.getElementById('sheet').textContent);
    await MCRespaldo.flush();
    proto.setItem = o;
    return { okBefore, lost: { round: career.round, seq: career._guardado, points: career.points }, modal };
  });
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800);
  const res = await page.evaluate(async () => { const r = await MCRespaldo.ready; return { estado: r, round: career.round, seq: career._guardado, points: career.points }; });
  await ctx.close();
  const ok = snap.modal && res.estado === 'recuperada' && res.round === snap.lost.round && res.points === snap.lost.points && errors.length === 0;
  return { ok, snap, res, errors };
}

async function pruebaPWA(browser) {
  const errors = [], missing = new Set();
  const { ctx, page } = await newPage(browser, errors, missing);
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  const r = await page.evaluate(async () => {
    const man = await fetch('manifest.webmanifest').then(x => x.ok ? x.json() : null).catch(() => null);
    const sw = await fetch('sw.js').then(x => x.ok).catch(() => false);
    const reg = navigator.serviceWorker ? !!(await navigator.serviceWorker.getRegistration()) : false;
    const cats = typeof CAT !== 'undefined' ? Object.keys(CAT) : null;
    const visibles = typeof SS !== 'undefined' ? Object.values(SS).flatMap(x => x[2].map(r => r[3])) : null;
    const visible = !document.documentElement.classList.contains('mc-cargando') && getComputedStyle(document.body).visibility === 'visible';
    return { manifest: man && man.name, sw, reg, cats, visibles, visible, diseno12: document.body.className, version: window.MCStore && MCStore.APP_VERSION, title: document.title };
  });
  await ctx.close();
  // la pantalla de carga debe estar activa ANTES de que cargue el diseño (contexto nuevo, sin service worker)
  const ctx2 = await browser.newContext({ serviceWorkers: 'block' });
  const p2 = await ctx2.newPage(); let tapado = null;
  await ctx2.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
  await p2.route('**/js/mc12-diseno.js*', async route => { tapado = await p2.evaluate(() => document.documentElement.classList.contains('mc-cargando')).catch(() => null); route.continue(); });
  await p2.goto(URL, { waitUntil: 'load' });
  await ctx2.close();
  const ok = r.manifest === 'MODO CARRERA' && r.sw && r.reg && r.visible && tapado === true && errors.length === 0;
  r.tapadoMientrasCarga = tapado;
  return { ok, ...r, errors };
}

const browser = await chromium.launch();
const results = [];
for (const cs of CASES) {
  try { results.push(await playCase(browser, cs)); }
  catch (e) { results.push({ case: cs, ok: false, crash: String(e && e.stack || e) }); }
}
const pwa = await pruebaPWA(browser).catch(e => ({ ok: false, crash: String(e && e.stack || e) }));
const espacio = await pruebaEspacio(browser).catch(e => ({ ok: false, crash: String(e && e.stack || e) }));
await browser.close();
const fingerprint = sha(results.map(r => (r.seasons || []).map(s => s.hash)));
const out = { name: NAME, seed: SEED, fingerprint, ok: results.every(r => r.ok) && espacio.ok !== false && pwa.ok !== false, results, espacio, pwa };
mkdirSync('tests/out', { recursive: true });
writeFileSync(`tests/out/${NAME}.json`, JSON.stringify(out, null, 1));
// Resumen legible en el registro de GitHub Actions
console.log(`HUELLA ${fingerprint} · ${out.ok ? 'OK' : 'FALLÓ'}`);
for (const r of results) {
  console.log(`\n== ${r.case.club} (${r.case.country}) ok=${r.ok} ms=${r.ms}`);
  if (r.crash) console.log('CRASH', r.crash);
  if (r.created && !r.created.ok) console.log('NO SE CREÓ', JSON.stringify(r.created));
  for (const s of r.seasons || []) console.log(`  temporada ${s.season}: partidos usuario ${s.userMatches} (goles/p ${s.userGoalsPerMatch}), liga ${s.league.matches} partidos, goles/p ${s.league.goalsPerMatch}, local ${s.league.homeWin}, empates ${s.league.draw}, dif>=5: ${s.league.diff5plus}, máx goles ${s.league.maxGoals}, puesto ${s.position}, pts ${s.points}, presupuesto ${s.budget}, hash ${s.hash}`);
  if (r.size) console.log('  tamaño: carrera ' + r.size.careerKB + ' KB · localStorage total ' + r.size.localStorageKB + ' KB');
  if (r.save) console.log('  guardado/recarga:', r.save.reloadOk ? 'OK' : 'FALLÓ', JSON.stringify(r.save.after));
  console.log('  archivos inexistentes pedidos:', (r.missing || []).length, (r.missing || []).slice(0, 5).join(' | '));
  console.log('  errores:', r.errors ? r.errors.length : '-'); (r.errors || []).slice(0, 15).forEach(e => console.log('   ', e.slice(0, 300)));
}
console.log('\n== App instalable y ajustes:', JSON.stringify(pwa));
console.log('\n== Almacenamiento lleno (recuperación):', JSON.stringify(espacio));
process.exit(out.ok ? 0 : 1);
