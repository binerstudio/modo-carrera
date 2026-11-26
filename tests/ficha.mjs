/* MODO CARRERA · Etapa 4 · la ficha del jugador abre para CUALQUIER jugador sin errores
   1) Los 51.000+ jugadores de la base: atributos (25 de campo + 5 de arquero, enteros de 15 a 99, marcados "estimado")
      y PlayStyles (hasta 4, con ícono y explicación). Se arma el HTML de la ficha de cada uno.
   2) Tu plantel: se abre la pantalla de la ficha de cada jugador (30 valores, marca "estimado", PlayStyles, botón Fijo).
   3) Una muestra de jugadores de otros clubes (todas las posiciones, edades extremas, datos faltantes): ventana de ficha.
   4) Ficha del club de cada club de tu liga y de una muestra del mundo: presupuesto (mcIAEco) numérico y plantel.
   0 errores de JavaScript.
   Uso: node tests/ficha.mjs <url> [muestra]                                                                        */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html', MUESTRA = +(process.argv[3] || 400);
const errors = [], fallas = [], ok = (c, m) => { if (!c) fallas.push(m); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
const r = await page.evaluate(MUESTRA => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs(); document.getElementById('clubChoice').value = 'River Plate'; createCareer();
  const out = { base: 0, malos: [], sinEst: 0, estilos: {}, sinEstilo: 0, maxEstilos: 0, html: 0, porPos: {} };
  const CAMPO = 25, ARQ = 5;
  /* 1) toda la base */
  const d = mcDB();
  for (const o of d.list) {
    out.base++;
    const at = mcAtributosJugador(o), v = at.v;
    const keys = ['ritmo', ...MCAtributos.CAMPO, ...MCAtributos.ARQ];
    const bad = keys.filter(k => !Number.isInteger(v[k]) || v[k] < 15 || v[k] > 99);
    if (keys.length !== CAMPO + ARQ || bad.length) { if (out.malos.length < 5) out.malos.push(o.name + ': ' + bad.join(',')); continue; }
    if (at.origen !== 'estimado' && at.origen !== 'verificado') out.sinEst++;
    const es = mcEstilosJugador(o); out.maxEstilos = Math.max(out.maxEstilos, es.length);
    if (!es.length) out.sinEstilo++; es.forEach(x => { out.estilos[x.n] = (out.estilos[x.n] || 0) + 1; if (!x.ic || !x.t) out.malos.push('estilo sin ícono/texto ' + x.id); });
    out.porPos[o.pos] = (out.porPos[o.pos] || 0) + 1;
    const h = mcFichaAtributosHTML(o) + mcFichaEstilosHTML(o);
    if ((h.match(/data-attr=/g) || []).length === CAMPO + ARQ && /estimado/.test(h)) out.html++;
  }
  /* 2) tu plantel: la pantalla de la ficha */
  out.propios = []; career.players.forEach((p, i) => { openPlayer(i); const b = document.getElementById('playerProfile');
    out.propios.push({ n: p.name, atr: b.querySelectorAll('.mc4-atr [data-attr]').length, est: !!b.querySelector('.mc4-est'), ps: b.querySelectorAll('.mc4-ps').length, fijo: !!b.querySelector('.mc4-fijob'), pagina: document.querySelector('.page.active')?.id }); });
  /* 3) muestra de otros clubes, con casos extremos */
  const L = d.list.filter(o => o.club !== career.club), paso = Math.max(1, Math.floor(L.length / MUESTRA)), mu = [];
  for (let i = 0; i < L.length && mu.length < MUESTRA; i += paso) mu.push(L[i]);
  const extremos = [L.slice().sort((a, b) => a.age - b.age)[0], L.slice().sort((a, b) => b.age - a.age)[0], L.slice().sort((a, b) => a.rating - b.rating)[0], L.slice().sort((a, b) => b.rating - a.rating)[0],
    { name: 'Jugador sin datos' }, { name: 'Sin edad', pos: 'POR', rating: 70 }, { name: 'Posición rara', pos: 'XX', rating: 99, age: 45 }];
  out.ajenos = 0; out.ajenosMal = [];
  for (const o of [...mu, ...extremos]) { const okk = mcFichaJugador(o); const n = document.querySelectorAll('#sheet [data-attr]').length;
    if (okk && n === CAMPO + ARQ && document.querySelector('#sheet .mc4-est')) out.ajenos++; else if (out.ajenosMal.length < 5) out.ajenosMal.push(o.name + ' ' + n); closeModal(); }
  out.ajenosTotal = mu.length + extremos.length;
  /* también por nombre (como se abre desde otras pantallas) */
  out.porNombre = mcFichaJugador(mu[0].name) && document.querySelectorAll('#sheet [data-attr]').length === 30; closeModal();
  /* 4) ficha del club */
  const clubes = career.league.teams.slice(), otros = Object.values(CLUBS).flat(); for (let i = 0; i < otros.length; i += 97) clubes.push(otros[i]);
  out.clubes = 0; out.clubesMal = []; out.presupuestos = [];
  for (const cl of clubes) { const h = mcFichaClubHTML(cl); const m = h.match(/class="mc4-pres" data-b="([-0-9.]+)"/);
    const bien = /FICHA DEL CLUB/.test(h) && (cl === career.club || (m && Number.isFinite(+m[1])));
    if (bien) { out.clubes++; if (m) out.presupuestos.push(+m[1]); } else if (out.clubesMal.length < 5) out.clubesMal.push(cl); }
  out.clubesTotal = clubes.length;
  mcFichaClub('Boca Juniors'); out.mundoClubes = !!document.querySelector('#world .mc4-club') && document.querySelectorAll('#world .mc4-pl').length;
  return out;
}, MUESTRA);
await browser.close();
ok(r.base > 50000, `la base tiene ${r.base} jugadores`);
ok(!r.malos.length, `atributos fuera de rango: ${r.malos.join(' | ')}`);
ok(r.html === r.base, `fichas armadas ${r.html}/${r.base}`);
ok(!r.sinEst, `${r.sinEst} jugadores sin origen (estimado/verificado)`);
ok(r.maxEstilos <= 4, `más de 4 PlayStyles (${r.maxEstilos})`);
const malProp = r.propios.filter(p => p.atr !== 30 || !p.est || p.ps !== 1 || !p.fijo || p.pagina !== 'player');
ok(!malProp.length, `ficha propia mal: ${JSON.stringify(malProp.slice(0, 3))}`);
ok(r.ajenos === r.ajenosTotal, `fichas de otros clubes ${r.ajenos}/${r.ajenosTotal}: ${r.ajenosMal.join(', ')}`);
ok(r.porNombre, 'la ficha por nombre no abrió');
ok(r.clubes === r.clubesTotal, `fichas de club ${r.clubes}/${r.clubesTotal}: ${r.clubesMal.join(', ')}`);
ok(r.mundoClubes > 10, `Mundo → Clubes no mostró el plantel (${r.mundoClubes})`);
ok(!errors.length, `${errors.length} errores de JavaScript`);
const pres = r.presupuestos.sort((a, b) => a - b);
const res = { ok: !fallas.length, base: r.base, porPosicion: r.porPos, fichasArmadas: r.html, sinEstilo: r.sinEstilo, estilos: r.estilos, plantelPropio: r.propios.length,
  otrosClubes: `${r.ajenos}/${r.ajenosTotal}`, clubes: `${r.clubes}/${r.clubesTotal}`, presupuesto: { min: pres[0], mediana: pres[Math.floor(pres.length / 2)], max: pres[pres.length - 1] }, errores: errors, fallas };
mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/ficha.json', JSON.stringify(res, null, 1));
console.log('FICHA DEL JUGADOR Y DEL CLUB ·', res.ok ? 'OK' : 'FALLÓ');
console.log(`  base: ${r.base} jugadores, ${r.html} fichas armadas (25 + 5 atributos, "estimado"), ${r.sinEstilo} sin PlayStyle destacado · posiciones ${JSON.stringify(r.porPos)}`);
console.log(`  PlayStyles: ${Object.entries(r.estilos).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · ')}`);
console.log(`  tu plantel: ${r.propios.length} fichas abiertas · otros clubes: ${res.otrosClubes} · fichas de club: ${res.clubes} · presupuesto IA ${JSON.stringify(res.presupuesto)}`);
errors.slice(0, 10).forEach(e => console.log('ERROR:', e.slice(0, 300))); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
