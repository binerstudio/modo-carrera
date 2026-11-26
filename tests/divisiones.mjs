/* MODO CARRERA · DIVISIONES INFERIORES (etapa de datos)
   A) Datos: cada club de cada división nueva tiene 25 jugadores generados (posiciones equilibradas, edades
      realistas, marcados "generado"), escudo (real o genérico) y se puede empezar una carrera con él
      (una carrera por división).
   B) Tres temporadas SIN INTERVENCIÓN con un club del Championship (motor real, como tests/temporadas.mjs):
      después de cada cierre verifica en TODAS las divisiones (también las que no son la tuya, simuladas livianas):
      tamaño de cada división igual que al principio, ningún club en dos divisiones ni perdido, bajan los
      últimos de cada división de arriba, suben los primeros habilitados de abajo, cada ganador de playoff está
      arriba y cada club de arriba que perdió un playoff está abajo; y que el peso de la partida no se dispare.
   C) Escenarios de tu club (los resultados de TUS partidos se cargan con la API del juego, el resto se juega
      normal): pierde todo → desciende y la carrera sigue en la división nueva; gana todo → asciende;
      termina en zona de playoff → juega el playoff como partido y queda donde dice el resultado.
   Uso: node tests/divisiones.mjs <url> [temporadas]                                                     */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html', N = +(process.argv[3] || 3);
const errors = [], fallas = [], out = {};
const browser = await chromium.launch();
const nuevo = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  await page.addInitScript(`(()=>{let s=777>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();`);
  await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1200); return { ctx, page };
};
const CREAR = `window.__crear=function(K,club){go('newcareer');const c=document.getElementById('country');if(![...c.options].some(o=>o.value===K))c.add(new Option(K,K));c.value=K;fillClubs();
 document.getElementById('clubChoice').value=club;document.getElementById('manager').value='Prueba divisiones';window.MC_IA_NUEVAS='v2';createCareer();return career};`;

/* ---------------- A) datos de todos los clubes ---------------- */
{
  const { ctx, page } = await nuevo(); await page.evaluate(CREAR);
  out.datos = await page.evaluate(() => {
    const R = MC_DIVR, D = MC_DIVS, malos = [], res = { divisiones: D.divs.length, clubes: 0, jugadores: 0, escudosReales: 0, escudosGenericos: 0, conColores: 0, carreras: [] };
    const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const FL = () => window.MC10_FLAGS || {};
    D.divs.forEach(d => {
      const nombres = new Set();
      d.t.forEach(t => {
        res.clubes++; const g = R.generados(t[0]); const r = rosterFor(t[0]);
        const pos = r.reduce((a, x) => (a[x[1]] = (a[x[1]] || 0) + 1, a), {});
        if (r.length < 25) malos.push(`${t[0]}: plantel de ${r.length}`);
        if ((pos.POR || 0) < 2 || (pos.DEF || 0) < 6 || (pos.MED || 0) < 6 || (pos.DEL || 0) < 4) malos.push(`${t[0]}: posiciones ${JSON.stringify(pos)}`);
        g.forEach(p => { res.jugadores++; if (p[3] < 16 || p[3] > 37) malos.push(`${p[0]} (${t[0]}): edad ${p[3]}`); if (!(FL()[fold(p[0]).replace(/\s+/g, ' ').trim()] & 32)) malos.push(`${p[0]}: sin marca de generado`); if (nombres.has(p[0])) malos.push(`${p[0]} repetido en ${d.k}`); nombres.add(p[0]); });
        const b = clubBadge(t[0], 30); if (/assets\/escudos\/div\//.test(b)) res.escudosReales++; else if (/data:image\/svg/.test(b)) res.escudosGenericos++; else malos.push(`${t[0]}: sin escudo`);
        if (t[4]) res.conColores++;
      });
    });
    /* con la base del mercado cargada para cada país (como en una carrera de ese país): 25 por club, sin perder ninguno */
    res.enBase = {}; for (const p in R.paises) { R.setActivo(p); const d = mcDB(); const by = new Map(); d.list.forEach(o => by.set(o.club, (by.get(o.club) || 0) + 1));
      let n = 0; D.divs.filter(x => x.p === p).forEach(x => x.t.forEach(t => { const k = by.get(t[0]) || 0; n += k; if (k < 25) malos.push(`${t[0]}: ${k} jugadores en la base del mercado`) })); res.enBase[p] = n }
    R.setActivo('');
    /* nivel por división: promedio de los 14 mejores */
    res.nivel = D.divs.map(d => { const v = d.t.map(t => { const a = rosterFor(t[0]).map(x => x[2]).sort((x, y) => y - x).slice(0, 14); return a.reduce((p, q) => p + q, 0) / a.length }); return [d.c, Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10] });
    /* una carrera por división, con un club al azar de cada una */
    D.divs.forEach((d, i) => { const club = d.t[(i * 7) % d.t.length][0]; const c = __crear(d.k, club);
      const ok = c.club === club && c.country === d.k && c.players.length === 25 && c.league.teams.length === d.t.length && c.league.teams.includes(club);
      res.carreras.push([d.c, club, c.players.length, c.league.teams.length, c.league.rounds.length, ok ? 'ok' : 'MAL']); if (!ok) malos.push(`carrera con ${club} (${d.k}) no se armó bien`); });
    res.malos = malos.slice(0, 30); res.nMalos = malos.length; return res;
  });
  if (out.datos.nMalos) fallas.push(`Datos: ${out.datos.nMalos} problemas (${out.datos.malos.slice(0, 5).join(' · ')})`);
  await ctx.close();
}

/* ---------------- verificación de un cierre de temporada ---------------- */
const ANTES = `window.__antes=function(){const R=MC_DIVR,D=MC_DIVS,s=career.season;const T={},M=R.membership(s);for(const c in M)T[c]=R.tabla(c,s).map(r=>r.name);
 return{s,T,M,peso:JSON.stringify(career).length,dv:JSON.stringify((career.world||{}).dv||{}).length,club:career.club,country:career.country}};
window.__despues=function(A){const R=MC_DIVR,D=MC_DIVS,s=A.s,mal=[];const M=R.membership(career.season),where=new Map();
 for(const c in M){if(M[c].length!==R.base[c].length)mal.push(c+': '+M[c].length+' clubes (eran '+R.base[c].length+')');M[c].forEach(n=>{if(where.has(n))mal.push(n+' en dos divisiones');where.set(n,c)})}
 for(const c in R.base)R.base[c].forEach(n=>{if(!where.has(n))mal.push(n+' desapareció')});
 const lv={};for(const c in A.M)A.M[c].forEach(n=>{lv[n]=R.nivel(c)});const lvOf=n=>lv[n]!=null?lv[n]:null;
 const stats={bajaron:0,subieron:0,playoffs:0,filiales:0};
 const filialMov=new Set(((career.world.dvLog||[])[0]||{}).filiales||[]);
 D.reglas.forEach(rg=>{const lvSup=R.nivel(rg.sup[0]);const enSup=n=>rg.sup.includes(where.get(n));
  rg.sup.forEach(c=>{A.T[c].slice(A.T[c].length-(rg.bajan||0)).forEach(n=>{stats.bajaron++;if(enSup(n))mal.push(n+' debía bajar de '+c+' (puesto '+(A.T[c].indexOf(n)+1)+')')})});
  if(!rg.liguilla)rg.inf.forEach(c=>{A.T[c].filter(n=>R.puede(n,lvSup,lvOf)).slice(0,rg.suben||0).forEach(n=>{stats.subieron++;if(!enSup(n)&&!(R.club.get(n)||{}).b)mal.push(n+' debía subir desde '+c+' (puesto '+(A.T[c].indexOf(n)+1)+')')})});
  /* lo que entra y sale de cada nivel tiene que compensarse */
  const supAntes=new Set(rg.sup.flatMap(c=>A.M[c]));const supAhora=rg.sup.flatMap(c=>M[c]);const entraron=supAhora.filter(n=>!supAntes.has(n)).length,salieron=[...supAntes].filter(n=>!supAhora.includes(n)).length;
  if(entraron!==salieron)mal.push(rg.sup.join('+')+': entraron '+entraron+' y salieron '+salieron)});
 const ll=(career.world.dvLog||[])[0];
 return{mal:mal.slice(0,20),nMal:mal.length,stats,pesoKB:Math.round(JSON.stringify(career).length/1024),dvKB:Math.round(JSON.stringify(career.world.dv||{}).length/1024*10)/10,
  movimientos:ll?ll.n:0,miClub:ll&&ll.mine,country:career.country,ligaOk:career.league?career.league.teams.length===(CLUBS[career.country]||[]).length&&career.league.teams.includes(career.club):'sin liga'}};`;

/* ---------------- B) tres temporadas sin intervención ---------------- */
{
  const { ctx, page } = await nuevo(); await page.evaluate(CREAR + ANTES);
  const ini = await page.evaluate(() => { const c = __crear('Inglaterra · EFL Championship', 'Birmingham City'); return { club: c.club, country: c.country, peso: JSON.stringify(c).length } });
  out.sinIntervencion = { inicio: ini, temporadas: [] };
  for (let t = 0; t < N; t++) {
    const t0 = Date.now();
    const jug = await page.evaluate(() => { let g = 0; while (!mcSeasonOver() && g++ < 160) { openMatch(); if (!match) break; mcSimEnd(); match.finished = true } return { partidos: g, pos: rank(), comps: ((mcWorld().comps || {}).list || []).filter(x => x.kind === 'asc').map(x => x.name + ': ' + (x.champ || '—')) } });
    const A = await page.evaluate(() => __antes());
    await page.evaluate(() => mcNewSeason()); await page.waitForTimeout(200);
    const V = await page.evaluate(a => __despues(a), A);
    out.sinIntervencion.temporadas.push({ temporada: A.s, ...jug, ...V, ms: Date.now() - t0 });
    if (V.nMal) fallas.push(`B T${t + 1}: ${V.nMal} problemas de ascensos/descensos (${V.mal.slice(0, 4).join(' · ')})`);
    if (V.ligaOk !== true) fallas.push(`B T${t + 1}: la liga de la temporada nueva no quedó bien armada (${V.ligaOk})`);
    if (V.dvKB > 20) fallas.push(`B T${t + 1}: lo guardado de las divisiones pesa ${V.dvKB} KB`);
  }
  const T = out.sinIntervencion.temporadas; out.sinIntervencion.crecimientoKB = T.length ? T[T.length - 1].pesoKB - Math.round(ini.peso / 1024) : 0;
  await ctx.close();
}

/* ---------------- C) escenarios de tu club ---------------- */
const JUGAR = `window.__jugar=function(modo){let g=0;const seen=[];while(!mcSeasonOver()&&g++<200){const c=mcCurrent();if(!c)break;const yo=c.home===career.club;
  let h=1,a=1;const pos=rank();if(modo==='pierde'){h=0;a=3}else if(modo==='gana'){h=3;a=0}else if(modo==='tercero'){if(c.type==='ev'&&/playoff|promoci|barrage/i.test(c.label||'')){openMatch();if(!match)break;mcSimEnd();match.finished=true;seen.push(c.label);continue}if(c.type==='ev'){h=0;a=1}else if(pos<4){h=0;a=1}else if(pos>6){h=2;a=0}else{h=1;a=1}}
  mcLeagueRecord({h,a,events:[],pst:{}})}return{g,pos:rank(),seen}};`;
async function escenario(nombre, K, club, modo, espera) {
  const { ctx, page } = await nuevo(); await page.evaluate(CREAR + ANTES + JUGAR);
  const r = await page.evaluate(async ({ K, club, modo }) => { __crear(K, club); const j = __jugar(modo); const comps = ((mcWorld().comps || {}).list || []).filter(x => x.kind === 'asc' && x.teams.includes(career.club)).map(x => ({ n: x.name, champ: x.champ }));
    const A = __antes(); const prev = MC_DIVR.resolverPais(MC_DIVR.paisDe(career.country), career, career.season, career.league, { preview: true }).mov.find(m => m[0] === career.club);
    mcNewSeason(); const V = __despues(A);
    /* la temporada nueva se puede jugar */
    let jugable = false; try { openMatch(); jugable = !!match; if (match) { mcSimEnd(); match.finished = true } } catch (e) { jugable = 'error ' + e.message }
    return { ...j, comps, antes: A.country, despues: career.country, previsto: prev ? prev[2] : null, mov: V.miClub, nMal: V.nMal, mal: V.mal, ligaOk: V.ligaOk, jugable };
  }, { K, club, modo });
  out[nombre] = r; const ok = espera(r);
  if (ok !== true) fallas.push(`C ${nombre}: ${ok}`);
  if (r.nMal) fallas.push(`C ${nombre}: ${r.mal.slice(0, 3).join(' · ')}`);
  if (r.ligaOk !== true || r.jugable !== true) fallas.push(`C ${nombre}: la temporada siguiente no arrancó bien (${r.ligaOk} / ${r.jugable})`);
  await ctx.close();
}
await escenario('pierdeTodo', 'Inglaterra · EFL League One', 'Barnsley', 'pierde', r => r.despues === 'Inglaterra · EFL League Two' || `terminó ${r.pos}º y quedó en ${r.despues}`);
await escenario('ganaTodo', 'España · Primera Federación · Grupo 2', 'Hércules', 'gana', r => r.despues === 'España · Segunda División' || `terminó ${r.pos}º y quedó en ${r.despues}`);
await escenario('primeraBaja', 'Alemania', 'FC Köln', 'pierde', r => r.despues === 'Alemania · 2. Bundesliga' || `terminó ${r.pos}º y quedó en ${r.despues}`);
await escenario('playoff', 'Inglaterra · EFL Championship', 'Watford', 'tercero', r => {
  if (!r.comps.length) return `terminó ${r.pos}º y no jugó ningún playoff`;
  const gano = r.comps[0].champ === 'Watford'; const arriba = r.despues === 'Inglaterra';
  if (!r.seen.length) return 'el playoff no se jugó como partido del usuario';
  return gano === arriba || `ganó el playoff: ${gano}, quedó en ${r.despues}`;
});

await browser.close();
if (errors.length) fallas.push(`${errors.length} errores de JavaScript (${errors.slice(0, 3).join(' | ')})`);
out.errores = errors.slice(0, 20); out.fallas = fallas; out.ok = !fallas.length;
mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/divisiones.json', JSON.stringify(out, null, 1));
const d = out.datos;
console.log(`DIVISIONES · ${out.ok ? 'OK' : 'FALLÓ'}`);
console.log(`A) ${d.divisiones} divisiones, ${d.clubes} clubes, ${d.jugadores} jugadores generados; escudos reales ${d.escudosReales}, genéricos ${d.escudosGenericos}; carreras creadas ${d.carreras.filter(x => x[5] === 'ok').length}/${d.carreras.length}`);
console.log('   nivel (14 mejores): ' + d.nivel.map(x => x.join(' ')).join(' · '));
out.sinIntervencion.temporadas.forEach((t, i) => console.log(`B) T${i + 1} (${t.temporada}): ${t.partidos} partidos, ${t.pos}º · ${t.movimientos} ascensos/descensos en Europa (bajaron por tabla ${t.stats.bajaron}, subieron ${t.stats.subieron}) · playoffs propios: ${t.comps.join(', ') || '—'} · liga nueva ${t.country} · partida ${t.pesoKB} KB (divisiones ${t.dvKB} KB) · ${Math.round(t.ms / 1000)} s`));
['pierdeTodo', 'ganaTodo', 'primeraBaja', 'playoff'].forEach(k => { const r = out[k]; if (r) console.log(`C) ${k}: ${r.pos}º · ${r.antes} → ${r.despues} (previsto ${r.previsto}) · playoffs ${JSON.stringify(r.comps)} · jugable ${r.jugable}`) });
fallas.forEach(f => console.log('FALLA:', f));
process.exit(out.ok ? 0 : 1);
