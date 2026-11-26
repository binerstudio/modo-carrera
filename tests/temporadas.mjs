/* MODO CARRERA · temporadas completas sin intervención del usuario (Etapa 3)
   Crea una carrera (12.7: partido del usuario con el v3, el resto de la fecha con el v2) + IA v2 y juega N temporadas
   seguidas sin tocar nada.
   Después de cada mercado verifica: economía sin valores absurdos, planteles con mínimos por puesto,
   ningún jugador en dos clubes, préstamos que vuelven, partidos de la IA con resultados normales,
   el plantel del usuario intacto y 0 errores de JavaScript.
   Uso: node tests/temporadas.mjs <url> [temporadas] [país] [club]                               */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html', N = +(process.argv[3] || 3), PAIS = process.argv[4] || 'Argentina', CLUB = process.argv[5] || 'River Plate';
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.addInitScript(`(()=>{let s=4242>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();`);
await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
const creada = await page.evaluate(({ PAIS, CLUB }) => {
  go('newcareer'); const c = document.getElementById('country'); if (![...c.options].some(o => o.value === PAIS)) c.add(new Option(PAIS, PAIS)); c.value = PAIS; fillClubs();
  document.getElementById('clubChoice').value = CLUB; document.getElementById('manager').value = 'Prueba IA';
  window.MC_IA_NUEVAS = 'v2'; createCareer();
  return { club: career.club, motor: career.motor, v3: career.v3, ia: career.ia, rotacion: !!career.rotacion, plantel: career.players.map(p => p.name).sort().join('|') };
}, { PAIS, CLUB });
const temporadas = [];
for (let t = 0; t < N; t++) {
  const t0 = Date.now();
  const jugada = await page.evaluate(() => {
    let g = 0, goles = 0, gEv = 0, gEvOk = 0, v3 = 0; const s = career.season;
    /* Etapa 4: estado físico y lesiones de la IA. Se mira el rival de cada partido y los planteles que arma la IA */
    const ia = { rivalesConFisico: 0, rivalesSinArquero: 0, rivalesMenos11: 0, lesionadosEnCancha: 0, maxLesionados: 0, fitMin: 100, partidosIA: 0, onceIAmal: 0 };
    const oSim = window.MCMotor.simular; window.MCMotor.simular = function (H, A) { ia.partidosIA++;
      for (const T of [H, A]) { const xi = T.players.slice(0, 11), st = mcIAEstado(T.name);
        if (xi.length < 11 || xi.filter(p => p.pos === 'POR').length < 1) ia.onceIAmal++;
        xi.forEach(p => { const x = st[String(p.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()]; if (x && x.l > 0) ia.lesionadosEnCancha++; }); }
      return oSim.apply(this, arguments) };
    while (!mcSeasonOver() && g++ < 140) { openMatch(); if (!match) break; if (match.v3) v3++;
      const riv = match.riv; if (riv.some(e => e.fit != null)) ia.rivalesConFisico++; if (!riv.some(e => e.pos === 'POR')) ia.rivalesSinArquero++; if (riv.length < 11) ia.rivalesMenos11++;
      const E = mcWorld().estIA; if (E && E.c) { let l = 0; Object.values(E.c).forEach(cl => Object.values(cl).forEach(x => { if (x[1] > 0) l++; ia.fitMin = Math.min(ia.fitMin, x[0]) })); ia.maxLesionados = Math.max(ia.maxLesionados, l); }
      mcSimEnd(); goles += match.h + match.a;
      match.events.filter(e => /GOL (LOCAL|VISITANTE)/.test(e.title)).forEach(e => { gEv++; if (e.gol && e.gol.autor) gEvOk++; }); match.finished = true; }
    const L = career.league, all = []; (L ? L.rounds : []).forEach(d => d.forEach(f => { if (f[2] != null) all.push(f) }));
    const gl = all.reduce((a, f) => a + f[2] + f[3], 0);
    window.MCMotor.simular = oSim;
    const inv = (mcWorld().aiMoves || []).find(x => x.season === s && x.ventana === 'invierno');
    ia.invierno = inv ? { total: inv.total, tipos: inv.tipos } : null;
    return { est: ia, season: s, partidosUsuario: g, golesLiga: +(gl / Math.max(1, all.length)).toFixed(2), partidosLiga: all.length, goleadas5: all.filter(f => Math.abs(f[2] - f[3]) >= 5).length, golesConDetalle: `${gEvOk}/${gEv}`, partidosV3: v3 };
  });
  const before = await page.evaluate(() => career.players.map(p => p.name).sort().join('|'));
  await page.evaluate(() => mcNewSeason());
  await page.waitForTimeout(300);
  const ver = await page.evaluate(() => {
    const w = mcWorld(), A = (w.aiMoves || [])[0] || { moves: [] }, M = A.moves || [];
    const tipos = A.tipos || {}; if (!A.tipos) M.forEach(m => { tipos[m[4] || 'clásico'] = (tipos[m[4] || 'clásico'] || 0) + 1; });
    const dinero = +M.reduce((a, m) => a + (+m[3] || 0), 0).toFixed(1);
    const eco = Object.values(w.eco || {}).map(e => e.b), malos = eco.filter(b => !Number.isFinite(b)).length; eco.sort((a, b) => a - b);
    const L = career.league, clubes = L ? L.teams.filter(c => c !== career.club) : [];
    const planteles = clubes.map(c => { const r = rosterFor(c); return { c, n: r.length, por: r.filter(x => x[1] === 'POR').length, def: r.filter(x => x[1] === 'DEF').length, med: r.filter(x => x[1] === 'MED').length, del: r.filter(x => x[1] === 'DEL').length }; });
    /* el mismo jugador en dos clubes (comparando el índice global) */
    const d = mcDB(), vistos = new Map(); let dup = 0; const ej = [];
    d.list.forEach(o => { const k = (o._n || o.name) + '#' + o.id; if (vistos.has(k)) { dup++; if (ej.length < 3) ej.push(o.name) } vistos.set(k, o.club) });
    const enDos = []; const porNombre = new Map(); clubes.forEach(c => rosterFor(c).forEach(r => { const k = r[0]; if (porNombre.has(k) && porNombre.get(k) !== c) enDos.push(k + ' (' + porNombre.get(k) + ' y ' + c + ')'); porNombre.set(k, c) }));
    return { temporada: A.season, ia: A.ia || 'v1', movimientos: A.total || M.length, tipos, dinero, ejemplos: M.filter(m => m[4] === 'traspaso').slice(0, 4).map(m => `${m[0]}: ${m[1]} → ${m[2]} (${m[3]}M)`),
      eco: { clubes: eco.length, noNumericos: malos, min: eco[0], mediana: eco[Math.floor(eco.length / 2)], max: eco[eco.length - 1] },
      prestamosActivos: (w.loansIA || []).length, plantelMin: Math.min(...planteles.map(p => p.n)), arquerosMin: Math.min(...planteles.map(p => p.por)),
      defMin: Math.min(...planteles.map(p => p.def)), medMin: Math.min(...planteles.map(p => p.med)), delMin: Math.min(...planteles.map(p => p.del)), enDosClubes: enDos.slice(0, 5), enDosCount: enDos.length,
      tamanoKB: Math.round(JSON.stringify(career).length * 2 / 1024),
      /* Etapa 5: negociación, cuotas, comisiones, cláusulas y bonos de la IA; ningún club en bancarrota absurda */
      e5: (() => { const R = mcIAEcoResumen(), quiebra = R.filter(x => x.b < -(x.sv * .3) - 1), neg = R.filter(x => x.b < 0);
        const atrasadas = (w.cuotasIA || []).filter(x => x[3] <= A.season).length, bonosAtrasados = (w.bonosIA || []).filter(x => x[4] <= A.season).length;
        return { clubes: R.length, negativos: neg.length, quiebra: quiebra.length, peor: R.slice().sort((a, b) => a.b / Math.max(1, a.sv) - b.b / Math.max(1, b.sv)).slice(0, 2).map(x => `${x.club} ${x.b}M (plantel ${x.sv}M)`),
          deudaMax: Math.max(0, ...R.map(x => x.deuda)), cuotasPendientes: (w.cuotasIA || []).length, atrasadas, bonosAtrasados, pagos: A.pagos || null, com: A.com || 0, enCuotas: A.cuotas || 0, clausulas: A.clausulas || 0,
          usuario: { budget: career.budget, e5: !!career.e5 } }; })() };
  });
  const toque = await page.evaluate(b => { const antes = new Set(b.split('|')); const M = ((mcWorld().aiMoves || [])[0] || { moves: [] }).moves || [];
    const ahora = new Set(career.players.map(p => p.name)); return { movidos: M.filter(m => antes.has(m[0])).map(m => m[0] + ' → ' + m[2]), salieron: [...antes].filter(n => !ahora.has(n)) }; }, before);
  temporadas.push({ ...jugada, ...ver, plantelUsuarioIntacto: toque.movidos.length === 0, salieronDelPlantel: toque.salieron, ms: Date.now() - t0 });
}
await browser.close();
const fallas = [];
temporadas.forEach((t, i) => {
  if (t.ia !== 'v2') fallas.push(`T${i + 1}: no se usó el mercado v2`);
  if (t.partidosV3 !== t.partidosUsuario) fallas.push(`T${i + 1}: ${t.partidosV3} de ${t.partidosUsuario} partidos del usuario con el v3`);
  if (!(t.movimientos > 20)) fallas.push(`T${i + 1}: muy pocos movimientos (${t.movimientos})`);
  if ((t.tipos['préstamo'] || 0) > 150) fallas.push(`T${i + 1}: demasiados préstamos (${t.tipos['préstamo']})`);
  if (t.tamanoKB > 1100) fallas.push(`T${i + 1}: la partida pesa demasiado (${t.tamanoKB} KB)`);
  if (t.eco.noNumericos) fallas.push(`T${i + 1}: presupuestos no numéricos`);
  if (t.arquerosMin < 1) fallas.push(`T${i + 1}: un club de la liga quedó sin arquero`);
  if (t.defMin < 4 || t.medMin < 3 || t.delMin < 2) fallas.push(`T${i + 1}: un club no puede formar un once completo`);
  if (t.eco.max > 1200) fallas.push(`T${i + 1}: presupuesto desproporcionado (${t.eco.max}M)`);
  if (t.plantelMin < 16) fallas.push(`T${i + 1}: un club quedó con ${t.plantelMin} jugadores`);
  if (t.enDosCount) fallas.push(`T${i + 1}: jugadores en dos clubes: ${t.enDosClubes.join(', ')}`);
  if (!(t.golesLiga >= 2 && t.golesLiga <= 3.2)) fallas.push(`T${i + 1}: goles por partido en la liga fuera de rango (${t.golesLiga})`);
  if (!t.plantelUsuarioIntacto) fallas.push(`T${i + 1}: la IA tocó el plantel del usuario`);
  const [ok, tot] = t.golesConDetalle.split('/').map(Number); if (tot && ok !== tot) fallas.push(`T${i + 1}: goles sin autor/asistencia en el relato (${t.golesConDetalle})`);
});
temporadas.forEach((t, i) => { const e = t.e5;
  if (e.quiebra) fallas.push(`T${i + 1}: ${e.quiebra} clubes en bancarrota absurda (${e.peor.join(', ')})`);
  if (e.atrasadas || e.bonosAtrasados) fallas.push(`T${i + 1}: cuotas (${e.atrasadas}) o bonos (${e.bonosAtrasados}) de la IA sin pagar en su temporada`);
  if (!(e.com > 0)) fallas.push(`T${i + 1}: la IA no pagó comisiones de agente`);
  if (i > 0 && !(e.pagos && e.pagos.cuotas >= 0)) fallas.push(`T${i + 1}: no se procesaron los pagos de la IA`);
  if (e.usuario.e5) fallas.push(`T${i + 1}: sin intervención se crearon datos del mercado del usuario`);
  if (!Number.isFinite(e.usuario.budget) || e.usuario.budget < 0) fallas.push(`T${i + 1}: tu presupuesto quedó en ${e.usuario.budget}`);
});
if (creada.motor !== 'v2' || creada.v3 !== true || creada.ia !== 'v2') fallas.push('La carrera no se creó con v3 (motor v2 por dentro) + IA v2');
if (creada.rotacion) fallas.push('La rotación automática no arrancó apagada');
temporadas.forEach((t, i) => {
  const a = t.est;
  if (!a.invierno) fallas.push(`T${i + 1}: no hubo mercado de invierno de la IA`);
  else if (!(a.invierno.total > 0 && a.invierno.total < 200)) fallas.push(`T${i + 1}: mercado de invierno fuera de rango (${a.invierno.total})`);
  if (!(a.rivalesConFisico > 0)) fallas.push(`T${i + 1}: los rivales nunca llegaron con su estado físico`);
  if (a.rivalesSinArquero || a.rivalesMenos11) fallas.push(`T${i + 1}: rival sin arquero (${a.rivalesSinArquero}) o con menos de 11 (${a.rivalesMenos11})`);
  if (a.onceIAmal) fallas.push(`T${i + 1}: ${a.onceIAmal} onces de la IA sin arquero o con menos de 11`);
  if (a.lesionadosEnCancha) fallas.push(`T${i + 1}: ${a.lesionadosEnCancha} lesionados de la IA en el once`);
  if (!(a.maxLesionados > 0)) fallas.push(`T${i + 1}: las lesiones de la IA no persisten entre partidos`);
  if (!(a.fitMin < 90)) fallas.push(`T${i + 1}: el cansancio de la IA no persiste entre partidos`);
});
if (errors.length) fallas.push(`${errors.length} errores de JavaScript`);
const out = { creada: { club: creada.club, motor: creada.motor, v3: creada.v3, ia: creada.ia }, temporadas, errores: errors.slice(0, 20), fallas, ok: !fallas.length };
mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/temporadas.json', JSON.stringify(out, null, 1));
console.log(`TEMPORADAS SIN INTERVENCIÓN · ${out.ok ? 'OK' : 'FALLÓ'} · ${creada.club} · partido del usuario con el v3 (${creada.v3 ? 'sí' : 'NO'}) · resto de la fecha con el ${creada.motor} · IA ${creada.ia}`);
temporadas.forEach((t, i) => console.log(`T${i + 1} (${t.season}): ${t.partidosUsuario} partidos, liga ${t.golesLiga} goles/p (${t.partidosLiga} partidos, goleadas5 ${t.goleadas5}), goles con detalle ${t.golesConDetalle} | con el v3 ${t.partidosV3}/${t.partidosUsuario} | mercado: ${t.movimientos} ${JSON.stringify(t.tipos)} ${t.dinero}M | eco ${JSON.stringify(t.eco)} | préstamos activos ${t.prestamosActivos} | mín plantel ${t.plantelMin} POR ${t.arquerosMin} DEF ${t.defMin} MED ${t.medMin} DEL ${t.delMin} | en dos clubes ${t.enDosCount} | usuario intacto ${t.plantelUsuarioIntacto} (salieron por retiro/préstamo: ${t.salieronDelPlantel.length}) | ${t.tamanoKB} KB | ${t.ms} ms\n   ej: ${t.ejemplos.join(' · ')}`));
temporadas.forEach((t, i) => { const e = t.e5; console.log(`   E5 T${i + 1}: comisiones ${e.com}M · en cuotas ${e.enCuotas} · cláusulas ${e.clausulas} · pagos del cierre ${JSON.stringify(e.pagos)} · cuotas pendientes ${e.cuotasPendientes} (atrasadas ${e.atrasadas}) · clubes con saldo negativo ${e.negativos}/${e.clubes} · bancarrota absurda ${e.quiebra} · peor ${e.peor.join(' | ')}`) });
temporadas.forEach((t, i) => { const a = t.est; console.log(`   IA T${i + 1}: invierno ${a.invierno ? a.invierno.total + ' movimientos ' + JSON.stringify(a.invierno.tipos) : 'NO'} · rivales con su físico ${a.rivalesConFisico}/${t.partidosUsuario} · lesionados IA a la vez (máx) ${a.maxLesionados} · físico mínimo IA ${a.fitMin} · partidos IA v2 ${a.partidosIA} · onces IA mal ${a.onceIAmal} · lesionados en cancha ${a.lesionadosEnCancha}`) });
errors.slice(0, 10).forEach(e => console.log('  ', e.slice(0, 300)));
fallas.forEach(f => console.log('FALLA:', f));
process.exit(out.ok ? 0 : 1);
