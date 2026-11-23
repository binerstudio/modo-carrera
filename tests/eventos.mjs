/* MODO CARRERA · auditoría de eventos del motor v2 (12.7)
   Juega N partidos y controla en cada uno:
   - identificadores únicos y crecientes; minutos que no retroceden dentro de cada tiempo;
   - goles del relato = marcador; atajadas del relato = atajadas de la estadística;
   - cada remate/gol/atajada/gol anulado trae la jugada escrita y su resultado coincide con el evento;
   - la cadena de la jugada es continua (cada pase sale de quien tenía la pelota);
   - los protagonistas son del equipo correcto y no actúan después de ser expulsados o reemplazados;
   - la posesión de cada minuto usa jugadores del equipo que la tiene.
   Uso: node tests/eventos.mjs <url> [partidos]                                                  */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html', N = +(process.argv[3] || 30);
const errors = [];
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.addInitScript(`(()=>{let s=777>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();`);
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1200);
const res = await page.evaluate(N => {
  go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs(); document.getElementById('clubChoice').value = 'River Plate';
  window.MC_MOTOR_NUEVAS = 'v2'; createCareer();
  const P = {}, add = (k, d) => { (P[k] = P[k] || []).push(d) }; let jug = 0, acciones = 0, remates = 0;
  const RES = { 'GOL': ['gol'], 'ATAJADA': ['atajada'], 'OCASI': ['afuera', 'palo'], 'ANULADO': ['anulado'] };
  for (let n = 0; n < N; n++) {
    if (mcSeasonOver()) break;
    openMatch(); if (!match) break; const m = match;
    const ownNames = new Set(career.players.map(p => p.name)), rivNames = new Set((m.riv || []).concat(m.rivBench || []).map(e => e.name));
    mcSimEnd(); jug++;
    const E = m.events, tag = `${m.home}-${m.away}`;
    /* ids y minutos */
    const ids = E.map(e => e.id); if (new Set(ids).size !== ids.length || ids.some((v, i) => i && v <= ids[i - 1])) add('ids', tag);
    let half = 1, last = -1; E.forEach(e => { if (/COMIENZA EL 2/.test(e.title)) { half = 2; last = 45 } if (e.min < last) add('minutos', `${tag} ${e.title} ${e.min}<${last}`); last = Math.max(last, e.min) });
    /* goles y atajadas */
    const go = E.filter(e => /GOL (LOCAL|VISITANTE)/.test(e.title)), gO = go.filter(e => e.side !== 'r').length, gR = go.filter(e => e.side === 'r').length;
    if (gO !== m.h || gR !== m.a) add('marcador', `${tag} relato ${gO}-${gR} vs ${m.h}-${m.a}`);
    const sav = E.filter(e => e.title === 'ATAJADA').length + E.filter(e => /PENAL FALLADO/.test(e.title) && /ataja/i.test(e.msg)).length;
    if (sav !== (m.savesH || 0) + (m.savesA || 0)) add('atajadas', `${tag} relato ${sav} vs estadística ${(m.savesH || 0) + (m.savesA || 0)}`);
    /* jugadas escritas */
    const fuera = { o: new Set(), r: new Set() };
    E.forEach((e, i) => {
      if (/EXPULSI/.test(e.title)) { const nm = [...(e.side === 'r' ? rivNames : ownNames)].find(x => e.msg.includes(x)); if (nm) fuera[e.side || 'o'].add(nm) }
      if (/CAMBIO/.test(e.title)) { const mm = /sale ([^,]+?),/.exec(e.msg); if (mm) fuera[e.side || 'o'].add(mm[1].trim()) }
      const key = Object.keys(RES).find(k => e.title.includes(k) && (k !== 'GOL' || /GOL (LOCAL|VISITANTE)/.test(e.title)));
      if (!key && !/⚠ PENAL/.test(e.title)) return;
      const side = e.side === 'r' ? 'r' : 'o', mine = side === 'o' ? ownNames : rivNames, theirs = side === 'o' ? rivNames : ownNames;
      if (/⚠ PENAL/.test(e.title)) { if (!e.acc) { add('sinJugada', `${tag} PENAL`); return } const r2 = E.slice(i + 1, i + 4).find(x => /GOL (LOCAL|VISITANTE)|PENAL FALLADO/.test(x.title));
        const want = r2 ? (/GOL/.test(r2.title) ? 'gol' : /ataja/i.test(r2.msg) ? 'atajada' : 'afuera') : null; if (want && e.acc[1].res !== want) add('resultado', `${tag} penal ${e.acc[1].res} vs ${want}`); return }
      if (/GOL (LOCAL|VISITANTE)/.test(e.title) && e.gol && e.gol.tipo === 'pen') return;
      if (!e.acc) { add('sinJugada', `${tag} ${e.title}`); return }
      jug; acciones += e.acc.length; remates++;
      const fin = e.acc[e.acc.length - 1]; if (!RES[key].includes(fin.res)) add('resultado', `${tag} ${e.title} → ${fin.res}`);
      let holder = null;
      e.acc.forEach(a => {
        const own = [a.j, a.de, a.a].filter(Boolean);
        if (a.t === 'recupera') { if (!mine.has(a.j)) add('equipo', `${tag} recupera ${a.j}`); holder = a.j }
        else if (a.t === 'pase') { if (!mine.has(a.de) || !mine.has(a.a)) add('equipo', `${tag} pase ${a.de}→${a.a}`); if (holder && a.de !== holder) add('cadena', `${tag} pase de ${a.de} pero la tenía ${holder}`); holder = a.a }
        else if (a.t === 'conduce') { if (holder && a.j !== holder) add('cadena', `${tag} conduce ${a.j} sin pelota`); holder = a.j }
        else if (a.t === 'remate' || a.t === 'cabezazo') { if (!mine.has(a.j)) add('equipo', `${tag} remata ${a.j}`); if (a.arq && !theirs.has(a.arq)) add('equipo', `${tag} arquero ${a.arq}`); if (holder && a.j !== holder && a.t === 'remate' && !/rebote|tirolibre/.test(a.tipo)) add('cadena', `${tag} remata ${a.j} pero la tenía ${holder}`) }
        else if (a.t === 'cierre' || a.t === 'gambeta') { const d = a.t === 'cierre' ? a.j : a.rival; if (d && !theirs.has(d)) add('equipo', `${tag} ${a.t} ${d}`) }
        own.forEach(x => { if (fuera[side].has(x) && a.t !== 'falta') add('imposible', `${tag} ${x} actúa después de salir`) });
      });
    });
    /* posesión escrita */
    ((m.v2 && m.v2.posesion) || []).forEach(r => { const L = r.eq === 'o' ? ownNames : rivNames; r.pases.forEach(x => { if (!L.has(x)) add('posesion', `${tag} ${x}`) }); if (r.recupera && !(r.eq === 'o' ? rivNames : ownNames).has(r.recupera)) add('posesion', `${tag} recupera ${r.recupera}`) });
    match.finished = true;
  }
  const res = {}; for (const k in P) res[k] = { n: P[k].length, ej: P[k].slice(0, 4) };
  return { partidos: jug, remates, accionesPorJugada: +(acciones / Math.max(1, remates)).toFixed(2), problemas: res };
}, N);
await browser.close();
const fallas = Object.entries(res.problemas).map(([k, v]) => `${k}: ${v.n} (${v.ej.join(' | ')})`);
if (errors.length) fallas.push(`${errors.length} errores de JavaScript: ${errors.slice(0, 3).join(' | ')}`);
mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/eventos.json', JSON.stringify({ ...res, errores: errors, fallas }, null, 1));
console.log(`AUDITORÍA DE EVENTOS · ${fallas.length ? 'FALLÓ' : 'OK'} · ${res.partidos} partidos · ${res.remates} jugadas escritas · ${res.accionesPorJugada} acciones por jugada`);
fallas.forEach(f => console.log('FALLA:', f.slice(0, 600)));
process.exit(fallas.length ? 1 : 0);
