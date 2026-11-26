/* MODO CARRERA · Etapa 5: mercado del usuario
   Crea una carrera (River Plate, IA v2) y prueba con las funciones reales del juego (las mismas que usan los botones):
   1) Negociación con el club: acepta / contraoferta / rechaza, como máximo 3 rondas; precio según contrato, importancia y economía.
   2) Formas de pago: contado y cuotas; las cuotas se pagan en el cierre de temporada que corresponde, ni antes ni después.
   3) Bonos: el de goles se paga solo en la temporada en que se cumple; el que no se cumple vence sin pagarse.
   4) Cláusula: pagándola el club no puede negarse; un club de la IA que paga la cláusula de tu jugador te obliga a venderlo.
   5) Agente y jugador: comisión al firmar; el jugador rechaza por club chico, poca titularidad o sueldo bajo.
   6) Ventas: ofertas de clubes reales, contraoferta con % de futura venta y recompra; se cobra la futura venta.
   7) Pantalla de economía con los compromisos y la pantalla de negociación (clics reales). 0 errores de JavaScript.
   Uso: node tests/mercado.mjs <url>                                                                                    */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8080/index.html';
const errors = [], fallas = [], ok = (c, m) => { if (!c) fallas.push(m); };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.addInitScript(`(()=>{let s=777>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})();`);
await ctx.route(u => !u.href.startsWith(new globalThis.URL(URL).origin), r => r.abort());
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(1500);

const R = await page.evaluate(() => {
  const out = {}; const R2 = x => Math.round(x * 100) / 100;
  go('newcareer'); const c0 = document.getElementById('country'); c0.value = 'Argentina'; fillClubs();
  document.getElementById('clubChoice').value = 'River Plate'; window.MC_IA_NUEVAS = 'v2'; createCareer();
  career.budget = 200;   // presupuesto de prueba para poder comprar varias veces
  const d = mcDB(), mine = new Set(career.players.map(p => p.name));
  const cands = d.list.filter(x => x.club !== career.club && !mine.has(x.name) && x.value >= 3 && x.value <= 12 && x.rating >= 70 && x.rating <= 77 && x.age <= 30);
  /* ---- 1) reglas del precio ---- */
  const RG = MCReglas;
  const p1 = RG.pedido({ valor: 10, anos: 1, imp: 'suplente', b: 5, sv: 50, semilla: 'x' }), p4 = RG.pedido({ valor: 10, anos: 4, imp: 'clave', b: 30, sv: 50, semilla: 'x' }), pd = RG.pedido({ valor: 10, anos: 3, imp: 'titular', b: -5, sv: 50, semilla: 'x' }), ps = RG.pedido({ valor: 10, anos: 3, imp: 'titular', b: 5, sv: 50, semilla: 'x' });
  out.reglas = { contrato1suplente: p1.A, contrato4clave: p4.A, conDeuda: pd.A, estable: ps.A,
    contratoBaja: p1.A < p4.A, deudaBaja: pd.A < ps.A, cuotasValenMenos: RG.valorOferta({ monto: 10, cuotas: 3 }, { b: 5, valor: 10 }) < RG.valorOferta({ monto: 10, cuotas: 1 }, { b: 5, valor: 10 }) };
  /* ---- 1b) rondas: oferta baja → contraoferta(s), máximo 3; oferta ridícula → rechazo y corte a las 3 ---- */
  const pa = cands[0], cxa = MCE5.ctxClub(pa); const rondas = [];
  let of = { monto: R2(cxa.ped.A * .75), cuotas: 1 };
  for (let i = 0; i < 5; i++) { const r = MCE5.ofertarClub(pa.id, of); rondas.push({ t: r.t, r: r.r, pide: r.pide || null, final: !!r.final }); if (r.t !== 'contra') break; of = { ...of, monto: R2(of.monto + (r.contra.monto - of.monto) * .5) }; }
  out.rondas = { jugador: pa.name, club: pa.club, pide: cxa.ped, imp: cxa.imp, anos: cxa.anos, eco: cxa.eco, rondas, max: Math.max(...rondas.map(x => x.r || 0)) };
  const pb = cands[1]; const rr = []; for (let i = 0; i < 5; i++) { const r = MCE5.ofertarClub(pb.id, { monto: .05, cuotas: 1 }); rr.push({ t: r.t, r: r.r, final: !!r.final }); if (r.final || r.t === 'acepta') break; }
  const otra = MCE5.ofertarClub(pb.id, { monto: 999, cuotas: 1 });
  out.ridicula = { rondas: rr, despuesDeCortar: otra.t, estado: career.e5.neg[pb.id] && career.e5.neg[pb.id].estado };
  /* ---- 2/3/5) compra en 3 cuotas con bonos: el club acepta lo que pide, el jugador con lo que pide ---- */
  const pc = cands[2], cxc = MCE5.ctxClub(pc), s0 = career.season, b0 = career.budget;
  const bonos = [{ tipo: 'goles', meta: 3, monto: .7 }, { tipo: 'partidos', meta: 200, monto: .4 }];
  let ofc = { monto: 0, cuotas: 3, bonos };
  { const v0 = RG.valorOferta({ ...ofc, monto: 0, base: cxc.valor }, { b: cxc.eco.b, valor: cxc.valor }), v1 = RG.valorOferta({ ...ofc, monto: 1, base: cxc.valor }, { b: cxc.eco.b, valor: cxc.valor }) - v0; ofc.monto = R2((cxc.ped.A - v0) / v1 + .05); }
  const rc = MCE5.ofertarClub(pc.id, ofc);
  const con = MCE5.contratoBase(pc), pdj = MCReglas.pideJugador(pc, MCE5.ctxJugador(pc)); con.sueldo = R2(pdj.sueldo * 1.1); con.anos = pdj.anos[0]; con.comision = pdj.comision; con.clausula = R2(Math.max(.5, pc.value) * 3);   // cláusula normal: con una barata la IA puede pagarla en el cierre
  const rj = MCE5.proponerJugador(pc.id, con);
  const partes = RG.partes(ofc.monto, 3), com = MCE5.comisionMonto(pc, ofc.monto, con.comision);
  const P = career.players.find(x => x.name === pc.name);
  out.compra = { jugador: pc.name, club: pc.club, oferta: ofc, club_: rc.t, jugador_: rj.t, motivo: rj.motivo || null, partes, comision: com, pagadoAlFirmar: R2(b0 - career.budget), esperado: R2(partes[0] + com),
    enPlantel: !!P, clausula: P && P.clausula, cuotasPend: career.e5.pagos.filter(x => x.estado === 'pendiente').map(x => ({ d: x.d, m: x.m, n: x.n })), bonos: career.e5.bonos.map(x => ({ t: x.tipo, desde: x.desde, hasta: x.hasta })) };
  /* ---- 5) el jugador rechaza: club chico (estrella de un club grande) y sueldo bajo ---- */
  const est = d.list.filter(x => x.rating >= 84 && (window.mcClubStrength(x.club) - MCE5.nivelUsuario()) >= 9).sort((a, b) => b.rating - a.rating)[0];
  let chico = null;
  if (est) { const bGuard = career.budget; career.budget = MCE5.ctxClub(est).clausula * 1.25 + 50;   // solo para llegar a la charla con el jugador
    const r1 = MCE5.pagarClausula(est.id); chico = { jugador: est.name, club: est.club, clausula: r1.t };
    const ccon = MCE5.contratoBase(est); ccon.sueldo = Math.min(ccon.sueldo * 3, 4); const rj2 = MCE5.proponerJugador(est.id, ccon); chico.jugador_ = rj2.t; chico.motivo = rj2.motivo; chico.final = !!rj2.final; chico.noFichado = !career.players.some(x => x.name === est.name); career.budget = bGuard; }
  out.clubChico = chico;
  /* poca titularidad: la regla con un plantel donde sería suplente (GRL 80+) */
  { const o = { name: 'Prueba', pos: 'DEL', rating: 81, age: 26, value: 20, wage: 2 }, plantel = [1, 2, 3, 4].map(i => ({ name: 'D' + i, pos: 'DEL', rating: 85 }));
    const ctxS = { nivelOrigen: 78, nivelDestino: 80, rolDestino: RG.rol(o, plantel) }, rs = RG.jugador(o, ctxS, { sueldo: 10, anos: 3, clausula: 40, comision: 10 }, 1);
    out.titularidad = { rol: ctxS.rolDestino, t: rs.t, motivo: rs.motivo, final: !!rs.final }; }
  const pe = cands[3]; MCE5.pagarClausula(pe.id); const bajo = []; const bc = MCE5.contratoBase(pe); bc.sueldo = R2(Math.max(.1, pe.wage) * .5);
  for (let i = 0; i < 4; i++) { const r = MCE5.proponerJugador(pe.id, bc); bajo.push({ t: r.t, r: r.r, motivo: r.motivo || null }); if (r.t !== 'contra') break; }
  out.sueldoBajo = { jugador: pe.name, rondas: bajo, noFichado: !career.players.some(x => x.name === pe.name) };
  /* ---- 4) cláusula: pagándola el club no puede negarse (aunque sea clave y el club esté holgado) ---- */
  const pf = cands.slice(4).find(x => MCE5.ctxClub(x).clausula <= career.budget * .5) || cands[4];
  const bf = career.budget, rf = MCE5.pagarClausula(pf.id), cf = MCE5.ctxClub(pf); const cbase = MCE5.contratoBase(pf), pdf = MCReglas.pideJugador(pf, MCE5.ctxJugador(pf)); cbase.sueldo = R2(pdf.sueldo * 1.2); cbase.anos = pdf.anos[0];
  const rjf = MCE5.proponerJugador(pf.id, cbase);
  out.clausulaUsuario = { jugador: pf.name, club: pf.club, clausula: cf.clausula, club_: rf.t, jugador_: rjf.t, motivo: rjf.motivo || null, pago: R2(bf - career.budget), fichado: career.players.some(x => x.name === pf.name) };
  /* ---- 4b) un club de la IA paga la cláusula de tu jugador: venta obligatoria ---- */
  const victima = career.players.filter(x => !x.loan).sort((a, b) => a.rating - b.rating)[5]; victima.clausula = 1.5;
  const bv = career.budget, nAntes = career.players.length, club = Object.keys(CLUBS).flatMap(cn => CLUBS[cn]).find(k => k !== career.club && mcIAEco(k).b > 5);
  const rv = MCE5.pagarClausulaUsuario(victima.id, club);
  out.clausulaIA = { jugador: victima.name, club, r: rv, cobrado: R2(career.budget - bv), salio: !career.players.some(x => x.id === victima.id), plantel: [nAntes, career.players.length] };
  /* ---- 6) ventas: ofertas reales, contraoferta con % de futura venta + recompra ---- */
  const vend = career.players.filter(x => !x.loan && x.name !== pc.name).sort((a, b) => b.value - a.value)[3]; vend.transferListed = true;
  career.players.filter(x => x !== vend).forEach(x => x.transferListed = false);
  let ofs = []; for (let i = 0; i < 6 && !ofs.length; i++) ofs = MCE5.pedirOfertas() || [];
  const o = ofs[0]; let venta = null;
  if (o) { const hist = []; let ask = { monto: R2(o.monto * 1.4), fv: 20, rec: { precio: R2(vend.value * 1.6), anos: 2 } };
    for (let i = 0; i < 4; i++) { const r = MCE5.contraofertar(o.id, ask); hist.push({ t: r.t, monto: r.monto || null, r: r.r || null }); if (r.t !== 'contra') break; ask = { ...ask, monto: r.monto }; }
    venta = { jugador: vend.name, club: o.club, oferta: o.monto, cuotas: o.cuotas, hist, vendido: !career.players.some(x => x.id === vend.id), ventas: career.e5.ventas.slice(), recompras: career.e5.recompras.slice() }; }
  out.venta = venta; out.ofertas = ofs.length;
  /* la IA revende a ese jugador: cobrás tu % */
  if (venta && venta.vendido) { const bb = career.budget; mcE5TrasMercadoIA([[vend.name, venta.club, 'Otro Club', 20, 'traspaso']], career.season, false); out.futuraVenta = { cobrado: R2(career.budget - bb), esperado: R2(20 * .2) }; }
  out.s0 = s0; out.cuotasEsperadas = partes;
  out.estadoAntes = { budget: career.budget, players: career.players.length };
  save(); return out;
});

/* ---- 2/3) cierres de temporada: las cuotas y los bonos se pagan en la temporada correcta ---- */
const cierres = [];
for (let t = 0; t < 3; t++) {
  const x = await page.evaluate(nombre => {
    const P = career.players.find(p => p.name === nombre);
    if (P && career.season === career.e5.bonos.find(b => b.tipo === 'goles').desde + 1) P.goals = 5;   // el bono de goles se cumple recién en la 2ª temporada
    const s = career.season, b0 = career.budget, pend = career.e5.pagos.filter(p => p.estado === 'pendiente' && p.dir < 0 && p.jug === nombre).map(p => ({ d: p.d, m: p.m }));
    mcNewSeason();
    const pag = career.e5.pagos.filter(p => p.jug === nombre && p.estado === 'pagado' && p.sp === s).map(p => ({ t: p.t, d: p.d, m: p.m }));
    return { cierre: s, pendientesAntes: pend, pagadosEnEsteCierre: pag, bonos: career.e5.bonos.filter(b => b.jug === nombre).map(b => ({ tipo: b.tipo, estado: b.estado, sp: b.sp || null })), ultimo: career.e5.ultimoCierre, budgetAntes: b0, budgetDespues: career.budget };
  }, R.compra.jugador);
  cierres.push(x);
}
/* ---- 7) pantallas: economía y negociación con clics ---- */
const pantallas = await page.evaluate(async () => {
  const out = {}; go('board'); try { renderBoard(); } catch (e) { out.err = e.message; }
  const fin = document.getElementById('e5Fin'); out.panel = !!fin; out.panelTexto = fin ? fin.textContent.slice(0, 200) : '';
  out.tieneSecciones = !!fin && ['Pagos que vencen por temporada', 'Bonos por objetivos', 'Cláusulas', 'Movimientos del mercado'].every(t => fin.textContent.includes(t));
  const d = mcDB(), p = d.list.find(x => x.club !== career.club && x.value > 1 && x.value < 6 && !career.players.some(y => y.name === x.name));
  openTransferOffer(p.id); await new Promise(r => setTimeout(r, 200));
  const send = [...document.querySelectorAll('#negos button.send')][0]; out.botonEnviar = !!send; if (send) send.click(); await new Promise(r => setTimeout(r, 200));
  const sh = document.getElementById('sheet'); out.modalCompra = !!sh && /OFERTA AL CLUB/.test(sh.textContent);
  const btn = [...sh.querySelectorAll('button')].find(b => /ENVIAR OFERTA/.test(b.textContent)); if (btn) btn.click(); await new Promise(r => setTimeout(r, 200));
  out.avisoTrasClic = (document.getElementById('e5Aviso') || {}).textContent || '';
  closeModal(); return out;
});
/* capturas (las sube el CI a la rama capturas-ci): negociación con el club, contrato con el jugador y Finanzas */
mkdirSync('tests/out', { recursive: true });
try {
  const id = await page.evaluate(() => { const d = mcDB(); const p = d.list.find(x => x.club !== career.club && x.value > 2 && x.value < 8 && x.rating >= 72 && !(career.e5 && career.e5.neg[x.id]) && !career.players.some(y => y.name === x.name)); MCE5.abrirCompra(p.id); return p.id; });
  await page.waitForTimeout(300); await page.screenshot({ path: 'tests/out/mercado-1-club.png', fullPage: false });
  await page.evaluate(id => { career.budget = Math.max(career.budget, 80); MCE5.pagarClausula(id); MCE5.abrirCompra(id); }, id);
  await page.waitForTimeout(300); await page.screenshot({ path: 'tests/out/mercado-2-jugador.png' });
  await page.evaluate(() => { closeModal(); go('board'); renderBoard(); document.getElementById('e5Fin').scrollIntoView(); });
  await page.waitForTimeout(300); await page.screenshot({ path: 'tests/out/mercado-3-finanzas.png' });
} catch (e) { errors.push('capturas: ' + e.message); }
const tam = await page.evaluate(() => Math.round(JSON.stringify(career).length * 2 / 1024));
await browser.close();

/* ---- verificaciones ---- */
const g = R.reglas; ok(g.contratoBaja && g.deudaBaja && g.cuotasValenMenos, `reglas del precio: ${JSON.stringify(g)}`);
ok(R.rondas.max <= 3 && R.rondas.rondas.some(x => x.t === 'contra'), `rondas con el club: ${JSON.stringify(R.rondas.rondas)}`);
ok(R.ridicula.rondas.length <= 3 && R.ridicula.rondas.at(-1).final && R.ridicula.estado === 'rota' && R.ridicula.despuesDeCortar === 'rechaza', `oferta ridícula: ${JSON.stringify(R.ridicula)}`);
const cp = R.compra; ok(cp.club_ === 'acepta' && cp.jugador_ === 'firmado' && cp.enPlantel, `compra en cuotas: club ${cp.club_}, jugador ${cp.jugador_} ${cp.motivo || ''}`);
ok(Math.abs(cp.pagadoAlFirmar - cp.esperado) < .02, `al firmar se pagó ${cp.pagadoAlFirmar} (esperado cuota 1 + comisión = ${cp.esperado})`);
ok(cp.comision > 0, 'sin comisión de agente');
ok(cp.cuotasPend.length === 2 && cp.cuotasPend[0].d === R.s0 && cp.cuotasPend[1].d === R.s0 + 1, `cuotas agendadas: ${JSON.stringify(cp.cuotasPend)}`);
const [c1, c2, c3] = cierres;
ok(c1.pagadosEnEsteCierre.filter(x => x.t === 'cuota').length === 1 && Math.abs(c1.pagadosEnEsteCierre.find(x => x.t === 'cuota').m - R.cuotasEsperadas[1]) < .01, `cierre ${c1.cierre}: cuotas ${JSON.stringify(c1.pagadosEnEsteCierre)}`);
ok(!c1.pagadosEnEsteCierre.some(x => x.t === 'bono'), `cierre ${c1.cierre}: se pagó un bono que no se cumplió`);
ok(c2.pagadosEnEsteCierre.filter(x => x.t === 'cuota').length === 1 && Math.abs(c2.pagadosEnEsteCierre.find(x => x.t === 'cuota').m - R.cuotasEsperadas[2]) < .01, `cierre ${c2.cierre}: cuotas ${JSON.stringify(c2.pagadosEnEsteCierre)}`);
ok(c2.pagadosEnEsteCierre.some(x => x.t === 'bono') && c2.bonos.find(b => b.tipo === 'goles').estado === 'pagado' && c2.bonos.find(b => b.tipo === 'goles').sp === c2.cierre, `cierre ${c2.cierre}: bono de goles ${JSON.stringify(c2.bonos)}`);
ok(c2.bonos.find(b => b.tipo === 'partidos').estado === 'vencido', `bono de partidos no cumplido: ${JSON.stringify(c2.bonos)}`);
ok(c3.pagadosEnEsteCierre.length === 0 && !c3.pendientesAntes.length, `cierre ${c3.cierre}: pagos de más ${JSON.stringify(c3.pagadosEnEsteCierre)}`);
ok(!R.clubChico || (R.clubChico.jugador_ === 'rechaza' && R.clubChico.noFichado && /club/.test(R.clubChico.motivo || '')), `club chico: ${JSON.stringify(R.clubChico)}`);
ok(R.clubChico, 'no se encontró un caso de club chico para probar');
ok(R.titularidad.rol === 'suplente' && R.titularidad.t === 'rechaza' && /titular/.test(R.titularidad.motivo), `poca titularidad: ${JSON.stringify(R.titularidad)}`);
ok(R.sueldoBajo.noFichado && R.sueldoBajo.rondas.length <= 3 && R.sueldoBajo.rondas.at(-1).t === 'rechaza' && R.sueldoBajo.rondas.some(x => /sueldo/.test(x.motivo || '')), `sueldo bajo: ${JSON.stringify(R.sueldoBajo)}`);
const cu = R.clausulaUsuario; ok(cu.club_ === 'acepta' && cu.jugador_ === 'firmado' && cu.fichado && cu.pago >= cu.clausula, `cláusula pagada por vos: ${JSON.stringify(cu)}`);
const ci = R.clausulaIA; ok(ci.r && ci.salio && Math.abs(ci.cobrado - 1.5) < .01, `cláusula pagada por la IA: ${JSON.stringify(ci)}`);
ok(R.ofertas > 0 && R.venta && R.venta.vendido, `venta: ${JSON.stringify(R.venta)}`);
ok(R.venta && R.venta.hist.length <= 3 && R.venta.hist[0].t === 'contra', `venta: rondas ${JSON.stringify(R.venta && R.venta.hist)}`);
ok(R.venta && R.venta.ventas.some(v => v.pct === 20) && R.venta.recompras.length === 1, `venta: futura venta / recompra no registradas ${JSON.stringify(R.venta && [R.venta.ventas, R.venta.recompras])}`);
ok(R.futuraVenta && Math.abs(R.futuraVenta.cobrado - R.futuraVenta.esperado) < .01, `futura venta: ${JSON.stringify(R.futuraVenta)}`);
ok(pantallas.panel && pantallas.tieneSecciones, `pantalla de economía: ${JSON.stringify(pantallas)}`);
ok(pantallas.modalCompra && /club|ronda|oferta/i.test(pantallas.avisoTrasClic), `pantalla de negociación (clics): ${JSON.stringify(pantallas)}`);
ok(!errors.length, `${errors.length} errores de JavaScript`);
const out = { ok: !fallas.length, ...R, cierres, pantallas, tamanoKB: tam, errores: errors.slice(0, 20), fallas };
mkdirSync('tests/out', { recursive: true }); writeFileSync('tests/out/mercado.json', JSON.stringify(out, null, 1));
console.log(`MERCADO DEL USUARIO (Etapa 5) · ${out.ok ? 'OK' : 'FALLÓ'}`);
console.log(`  rondas con el club: ${R.rondas.rondas.map(x => x.t + (x.pide ? ' (pide ' + x.pide + ')' : '')).join(' → ')} · oferta ridícula: ${R.ridicula.rondas.map(x => x.t).join(' → ')} (después: ${R.ridicula.despuesDeCortar})`);
console.log(`  compra en 3 cuotas: ${cp.jugador} (${cp.club}) ${cp.oferta.monto}M = ${cp.partes.join(' + ')} · comisión ${cp.comision} · al firmar ${cp.pagadoAlFirmar}`);
cierres.forEach(c => console.log(`  cierre ${c.cierre}: ${c.pagadosEnEsteCierre.map(x => x.t + ' ' + x.m).join(', ') || 'nada'} · bonos ${c.bonos.map(b => b.tipo + ':' + b.estado).join(', ')}`));
console.log(`  jugador: club chico → ${R.clubChico ? R.clubChico.jugador_ + ' (' + R.clubChico.motivo + ')' : 'sin caso'} · sueldo bajo → ${R.sueldoBajo.rondas.map(x => x.t).join(' → ')}`);
console.log(`  cláusula pagada por vos: ${cu.jugador} ${cu.clausula}M → ${cu.jugador_} · la IA paga la cláusula de ${ci.jugador}: ${ci.salio ? 'venta obligatoria' : 'NO'} (+${ci.cobrado})`);
console.log(`  venta: ${R.venta ? R.venta.jugador + ' a ' + R.venta.club + ' ' + R.venta.hist.map(x => x.t).join(' → ') : 'sin ofertas'} · futura venta cobrada ${R.futuraVenta ? R.futuraVenta.cobrado : '—'} · partida ${tam} KB`);
errors.slice(0, 10).forEach(e => console.log('ERROR:', e.slice(0, 300))); fallas.forEach(f => console.log('FALLA:', f));
process.exit(out.ok ? 0 : 1);
