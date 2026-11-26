/* MODO CARRERA · prueba de actualización
   1) Con la versión ANTERIOR (carpeta "srv" apuntando a la base) se crean carreras y se juegan partidos.
      - Base 12.2.2: una carrera (motor clásico v1, el único que tenía).
      - Base 12.6.0 (la versión publicada antes de la limpieza de motores): una carrera con cada motor que se podía
        elegir: v1 (clásico), v2 (avanzado) y v3 (en cancha).
   2) Se cambia "srv" a la versión NUEVA en la MISMA dirección (mismo almacenamiento del navegador).
   3) Se recarga y, para cada carrera, se comprueba: se abre, todos sus datos son idénticos (cada campo guardado, salvo
      el motor que cambia la migración y el número de formato), pasó sola al v3 (motor 'v2' por dentro, v3 = true y el
      motor que tenía anotado en motorAnterior), hay copia automática "Antes de actualizar", y se sigue jugando: el
      próximo partido es v3 y termina bien.
   Uso: node tests/actualizacion.mjs <url> <ruta-srv> <dir-base> <dir-nueva> [12.2.2|actual]                        */
import { chromium } from 'playwright';
import { rmSync, symlinkSync, mkdirSync, writeFileSync } from 'node:fs';
const [URL, SRV, BASE, NUEVA, MODO = '12.2.2'] = process.argv.slice(2);
const link = to => { rmSync(SRV, { force: true }); symlinkSync(to, SRV); };
const errors = [], fallas = [], ok = (c, msg) => { if (!c) fallas.push(msg); };
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());

/* 1) versión anterior */
link(BASE);
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);
const MOTORES = MODO === 'actual' ? ['v1', 'v2', 'v3'] : [null];
const antes = await page.evaluate(MOTORES => {
  const out = [];
  for (const mo of MOTORES) {
    go('newcareer'); const c = document.getElementById('country'); c.value = 'Argentina'; fillClubs();
    document.getElementById('clubChoice').value = mo === 'v2' ? 'Boca Juniors' : mo === 'v3' ? 'Racing Club' : 'River Plate';
    if (mo) window.MC_MOTOR_NUEVAS = mo === 'v1' ? 'v1' : 'v2';
    createCareer();
    if (mo === 'v3') { sLoad(); draft.motor = 'v3'; sSave(); }   // así se elegía el v3 en la 12.6.0
    for (let i = 0; i < 6; i++) { openMatch(); mcSimEnd(); match.finished = true; }
    save();
    out.push({ elegido: mo || 'v1 (único)', id: career.id, motor: career.motor || null, v3: career.v3 || null, round: career.round, points: career.points, gf: career.gf, ga: career.ga,
      squad: career.players.map(p => p.name).join('|'), budget: career.budget, transfers: (career.transferHistory || []).length,
      crudo: localStorage.getItem('mc_career_v7_' + career.id) });
  }
  return { title: document.title, carreras: out, activa: localStorage.getItem('mc_active_v7') };
}, MOTORES);

/* 2) versión nueva en la misma dirección */
link(NUEVA);
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2000);
const boot = await page.evaluate(async () => {
  const snaps = window.MCStore ? await MCStore.listSnapshots() : [];
  const resp = window.MCRespaldo ? await MCRespaldo.ready : null;
  return { title: document.title, version: window.MCStore && MCStore.APP_VERSION, snapshot: snaps.map(s => s.reason).filter(r => /Antes de actualizar/.test(r)), respaldo: resp,
    activa: typeof career !== 'undefined' && career ? career.id : null, motorEnAjustes: typeof OP !== 'undefined' && 'motor' in OP };
});
ok(boot.snapshot.length > 0, 'no se hizo la copia automática "Antes de actualizar"');
ok(MODO === 'actual' ? ['al-dia', 'copiada'].includes(boot.respaldo) : boot.respaldo === 'copiada', `respaldo: ${boot.respaldo}`);   // la 12.2.2 no tenía respaldo (se copia); la 12.6.0 ya lo tenía (al día, o se copia si no llegó a escribirlo antes de recargar)
ok(!boot.motorEnAjustes, 'Configuración todavía tiene "Motor de partidos"');
ok(boot.activa === antes.activa, `la carrera activa cambió (${antes.activa} → ${boot.activa})`);

/* 3) cada carrera: se abre, datos idénticos, pasó al v3 y se sigue jugando */
const CAMBIAN = new Set(['motor', 'v3', 'motorAnterior', 'schema']);   // lo que cambia la migración de carrera (y su número de formato)
const despues = [];
for (const a of antes.carreras) {
  const d = await page.evaluate(id => {
    const abre = mcActivate(id, false); if (!abre) return { abre };
    const c = career, r = { abre, id: c.id, motor: c.motor, v3: c.v3, motorAnterior: c.motorAnterior, schema: c.schema, round: c.round, points: c.points, gf: c.gf, ga: c.ga,
      squad: c.players.map(p => p.name).join('|'), budget: c.budget, transfers: (c.transferHistory || []).length, enMemoria: JSON.stringify(c) };
    /* 12.8 (Etapa 4): la rotación arranca apagada, la ficha nueva abre y la ficha del club también */
    r.rotacion = !!c.rotacion; r.fijos = c.players.filter(p => p.fijo).length;
    try { openPlayer(0); const box = document.getElementById('playerProfile'); r.fichaAtributos = box.querySelectorAll('.mc4-atr [data-attr]').length; r.fichaEstimado = !!box.querySelector('.mc4-est'); } catch (e) { r.fichaError = e.message; }
    try { const otro = (c.league ? c.league.teams : []).find(t => t !== c.club); r.fichaClub = !!otro && /FICHA DEL CLUB/.test(mcFichaClubHTML(otro)); } catch (e) { r.fichaError = e.message; }
    const r0 = c.round; openMatch(); r.partidoV3 = !!(match && match.v3); r.aviso2 = !!(match && match.events.some(e => /MOTOR v2/.test(e.title)));
    mcSimEnd(); const m = match, gol = side => m.events.filter(e => e.gol && e.side === side).length;
    r.termino = m.done; r.marcadorOk = m.h === gol('o') && m.a === gol('r'); m.finished = true; save();
    r.avanzo = career.round >= r0; r.guardadoV3 = JSON.parse(localStorage.getItem('mc_career_v7_' + id)).v3 === true;
    /* 12.9 (Etapa 5): al abrirla no se crea nada del mercado nuevo; la pantalla de economía muestra los compromisos
       y la carrera puede negociar y firmar con las reglas nuevas (oferta al club y contrato con el jugador) */
    r.e5AlAbrir = 'e5' in c;
    try { go('board'); renderBoard(); const f = document.getElementById('e5Fin'); r.panelE5 = !!f && /Compromisos del mercado/.test(f.textContent); } catch (e) { r.e5Error = e.message; }
    try { c.budget = Math.max(c.budget, 60); const d = mcDB(), p = d.list.find(x => x.club !== c.club && x.value >= 1 && x.value <= 8 && x.rating < 76 && !c.players.some(y => y.name === x.name));
      const cx = MCE5.ctxClub(p); MCE5.pagarClausula(p.id); const k = MCE5.contratoBase(p), pd = MCReglas.pideJugador(p, MCE5.ctxJugador(p)); k.sueldo = pd.sueldo * 1.3; k.anos = pd.anos[0];
      const rj = MCE5.proponerJugador(p.id, k); r.fichajeE5 = rj.t + (rj.motivo ? ' (' + rj.motivo + ')' : ''); r.firmo = c.players.some(y => y.name === p.name) && !!c.e5; } catch (e) { r.e5Error = e.message; }
    return r;
  }, a.id);
  const viejo = JSON.parse(a.crudo), nuevo = d.enMemoria ? JSON.parse(d.enMemoria) : {};
  /* todo dato guardado sigue ahí con el mismo valor (al abrir, el juego puede AGREGAR datos nuevos, no cambiar ni borrar) */
  const distintos = [], falta = (a, b, ruta) => { if (distintos.length > 20) return;
    if (a && typeof a === 'object') { if (!b || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) { distintos.push(ruta); return }
      if (Array.isArray(a) && a.length > b.length) { distintos.push(ruta + ' (más corto)'); return }
      for (const k of Object.keys(a)) falta(a[k], b[k], ruta + '.' + k); return }
    if ((ruta === 'world.mv' || ruta === '_guardado') && b >= a) return;   // contadores (cambios del mundo y número de guardado): al abrir una carrera suben solos, también en la 12.6.0
    if (a !== b) distintos.push(`${ruta} (${JSON.stringify(a)} → ${JSON.stringify(b)})`) };
  for (const k of Object.keys(viejo)) if (!CAMBIAN.has(k)) falta(viejo[k], nuevo[k], k);
  const esperado = a.v3 === true && a.motor === 'v2' ? undefined : (a.motor === 'v2' ? 'v2' : 'v1');
  const tag = `carrera ${a.elegido}`;
  ok(d.abre, `${tag}: no se abrió`);
  ok(['id', 'round', 'points', 'gf', 'ga', 'squad', 'budget', 'transfers'].every(k => a[k] === d[k]), `${tag}: datos distintos`);
  ok(!distintos.length, `${tag}: campos guardados que cambiaron al abrirla: ${distintos.join(', ')}`);
  ok(d.motor === 'v2' && d.v3 === true, `${tag}: no pasó al v3 (motor ${d.motor}, v3 ${d.v3})`);
  ok(d.motorAnterior === esperado, `${tag}: motorAnterior ${d.motorAnterior} (se esperaba ${esperado})`);
  ok(d.partidoV3 && !d.aviso2 && d.termino && d.marcadorOk && d.avanzo && d.guardadoV3, `${tag}: el partido siguiente no se jugó bien con el v3 ${JSON.stringify({ partidoV3: d.partidoV3, termino: d.termino, marcadorOk: d.marcadorOk, guardadoV3: d.guardadoV3 })}`);
  ok(!d.rotacion && !d.fijos, `${tag}: la rotación automática no arrancó apagada (rotacion ${d.rotacion}, fijos ${d.fijos})`);
  ok(d.fichaAtributos === 30 && d.fichaEstimado && d.fichaClub && !d.fichaError, `${tag}: la ficha nueva no abrió bien ${JSON.stringify({ atributos: d.fichaAtributos, estimado: d.fichaEstimado, club: d.fichaClub, error: d.fichaError })}`);
  ok(!d.e5AlAbrir && d.panelE5 && d.firmo && !d.e5Error, `${tag}: mercado de la Etapa 5 ${JSON.stringify({ alAbrir: d.e5AlAbrir, panel: d.panelE5, fichaje: d.fichajeE5, error: d.e5Error })}`);
  delete d.enMemoria; despues.push({ elegido: a.elegido, antes: { motor: a.motor, v3: a.v3 }, ...d, squad: d.squad ? d.squad.split('|').length + ' jugadores' : null, camposDistintos: distintos });
}
await browser.close();
ok(!errors.length, `${errors.length} errores de JavaScript`);
const res = { modo: MODO, ok: !fallas.length, antes: { title: antes.title, carreras: antes.carreras.map(c => ({ ...c, crudo: undefined, squad: c.squad.split('|').length + ' jugadores' })) }, boot, despues, errores: errors, fallas };
mkdirSync('tests/out', { recursive: true }); writeFileSync(`tests/out/actualizacion-${MODO}.json`, JSON.stringify(res, null, 1));
console.log(`ACTUALIZACIÓN desde ${antes.title} (${MODO}) → ${boot.title}`, res.ok ? 'OK' : 'FALLÓ');
for (const d of despues) console.log(`  ${d.elegido}: antes motor=${d.antes.motor} v3=${d.antes.v3} → motor=${d.motor} v3=${d.v3} motorAnterior=${d.motorAnterior} · fecha ${d.round}, ${d.points} pts, ${d.squad} · campos distintos: ${d.camposDistintos.length} · próximo partido v3: ${d.partidoV3 ? 'sí' : 'NO'} (${d.termino ? 'terminó' : 'no terminó'})`);
console.log('  copia automática:', boot.snapshot, '· respaldo:', boot.respaldo, '· errores:', errors.length);
errors.slice(0, 10).forEach(e => console.log('ERROR:', e.slice(0, 300))); fallas.forEach(f => console.log('FALLA:', f));
process.exit(res.ok ? 0 : 1);
