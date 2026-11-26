/* ===== MODO CARRERA 12.9 · ETAPA 5 · TU MERCADO: NEGOCIACIÓN =====
   COMPRAR (reemplaza la oferta de un solo tiro):
   1) Oferta al club: monto, forma de pago (contado, 2 o 3 cuotas), bonos por objetivos (goles, partidos, títulos)
      y porcentaje de futura venta para el vendedor. El club acepta, rechaza o contraoferta según el valor del jugador,
      su contrato, su importancia en el plantel y su economía (js/mercado/reglas.js). Máximo 3 rondas por temporada.
      Si pagás la cláusula de rescisión (estimada) al contado, el club no puede negarse.
   2) Contrato con el jugador (aparte): sueldo, años, cláusula de rescisión y comisión de su agente. Puede rechazar
      si tu club es chico para él, si tendría poca titularidad o si el sueldo es bajo. Máximo 3 rondas.
   3) Firma: se paga la primera cuota y la comisión; las otras cuotas y los bonos quedan en Finanzas.
   VENDER (reemplaza "Consultar ofertas"): clubes reales con presupuesto ofertan por tus transferibles (contado o en
   cuotas). Podés aceptar, rechazar o contraofertar pidiendo más plata, un porcentaje de futura venta y una opción de
   recompra. Máximo 3 rondas. */
(function(){
'use strict';
const RG=window.MCReglas,F=window.MCE5;if(!RG||!F||!F.E5)return;
const R2=RG.R2,fold=RG.fold,hash=RG.hash,money=F.money,esc=F.esc,temp=F.temp;
const $=id=>document.getElementById(id);
const C=()=>(typeof career!=='undefined'&&career)?career:null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const q=v=>JSON.stringify(v).replace(/"/g,'&quot;');
const toast=m=>{try{window.xToast?xToast(m):0}catch(e){}};
const findP=id=>{try{const d=mcDB();return d.byId.get(id)||((C().mkt||{}).extra||[]).find(x=>x.id===id)||null}catch(e){return null}};
const findByName=n=>{try{n=fold(n);const ex=((C().mkt||{}).extra||[]).filter(x=>fold(x.name)===n).pop();if(ex)return ex;return mcDB().list.find(x=>(x._n||fold(x.name))===n)||null}catch(e){return null}};
const XI=RG.XI;
/* fuerza del plantel del usuario en la misma escala que mcClubStrength (promedio de los 14 mejores) */
function nivelUsuario(){const a=(C().players||[]).map(p=>+p.rating||0).sort((x,y)=>y-x).slice(0,14);return a.length?a.reduce((s,x)=>s+x,0)/a.length:60}
const nivelClub=k=>window.mcClubStrength?mcClubStrength(k):60;
function plantelDe(k){try{if(window.mcIAPlantel){const a=mcIAPlantel(k);if(a.length)return a}}catch(e){}try{return mcDB().list.filter(x=>x.club===k)}catch(e){return[]}}
function anosRestantes(p){const c=C();try{if(c.ia==='v2'&&window.mcIAContratoFin){const f=mcIAContratoFin(p);if(isFinite(f))return clamp(f-c.season,1,6)}}catch(e){}return clamp(+p.contract||2,1,6)}
function ecoDe(k){try{const e=mcIAEco(k);return{b:+e.b||0,sv:+e.sv||0}}catch(e){return{b:10,sv:50}}}
/* contexto del club vendedor */
function ctxClub(p){const c=C(),P=plantelDe(p.club),eco=ecoDe(p.club),anos=anosRestantes(p),imp=RG.importancia(p,P);
 const ped=RG.pedido({valor:+p.value||0,anos,imp,b:eco.b,sv:eco.sv||P.reduce((a,x)=>a+(+x.value||0),0),semilla:'u'+fold(p.name)+c.season});
 return{anos,imp,eco,ped,clausula:RG.clausula(p),valor:+p.value||0}}
function ctxJugador(p){return{nivelOrigen:nivelClub(p.club),nivelDestino:nivelUsuario(),rolDestino:RG.rol(p,C().players||[])}}
/* ---------- estado de una negociación (career.e5.neg[id], por temporada) ---------- */
function NEG(id,crear){const e=F.E5(),c=C();for(const k in e.neg)if(e.neg[k].s<c.season-0&&e.neg[k].estado!=='jugador')delete e.neg[k];
 let n=e.neg[id];if(n&&n.s!==c.season&&n.estado!=='jugador'){delete e.neg[id];n=null}
 if(!n&&crear){n=e.neg[id]={s:c.season,r:0,rj:0,estado:'club',log:[]}}return n}
const IMP={clave:'Jugador clave del club',titular:'Titular',suplente:'Suplente'};
/* valor de la oferta para el vendedor y el monto que iguala un pedido con la misma forma de pago */
function valor(of,cx){return RG.valorOferta({...of,base:cx.valor},{b:cx.eco.b,valor:cx.valor})}
function montoPara(pide,of,cx){const v0=valor({...of,monto:0},cx),v1=valor({...of,monto:1},cx)-v0;return R2(Math.max(.05,(pide-v0)/Math.max(.01,v1)))}
function wageBudget(){const c=C();return c.wageBudget||Math.max(5,c.budget*.18)}
/* ---------- 1) oferta al club ---------- */
function validarOferta(of,cx){const c=C(),n=clamp(+of.cuotas||1,1,3),pp=RG.partes(+of.monto||0,n);
 if(!(+of.monto>0))return 'Ingresá un monto mayor que cero.';
 if(pp[0]>c.budget)return `La ${n>1?'primera cuota':'oferta'} (${money(pp[0])}) supera tu presupuesto (${money(c.budget)}).`;
 if(n>1){if(c.budget<0)return 'Con saldo negativo no podés comprar en cuotas.';const dif=R2(pp.slice(1).reduce((a,x)=>a+x,0));
  if(F.deuda()+dif>F.capacidad())return `Las cuotas pendientes superarían tu capacidad (${money(Math.max(0,F.capacidad()-F.deuda()))} disponibles).`}
 for(const b of of.bonos||[])if(!(+b.monto>0)||!(+b.meta>0))return 'Cada bono necesita objetivo y monto.';
 return null}
function ofertarClub(id,of){const c=C(),p=findP(id);if(!p)return{t:'error',motivo:'Jugador no encontrado'};
 if(c.players.some(x=>fold(x.name)===fold(p.name)))return{t:'error',motivo:'Ya está en tu plantel'};
 const n=NEG(id,true);if(n.estado==='rota')return{t:'rechaza',final:true,motivo:'El club cortó la negociación esta temporada'};
 if(n.estado!=='club')return{t:'error',motivo:'El club ya aceptó: falta el contrato con el jugador'};
 const cx=ctxClub(p);of={monto:R2(+of.monto||0),cuotas:clamp(+of.cuotas||1,1,3),bonos:(of.bonos||[]).filter(b=>b&&+b.monto>0).map(b=>({tipo:b.tipo,meta:+b.meta,monto:R2(b.monto)})),fv:clamp(+of.fv||0,0,50)};
 const err=validarOferta(of,cx);if(err)return{t:'error',motivo:err};
 if(!n.pide){n.pide=cx.ped.A;n.min=cx.ped.min}
 n.r++;const E=valor(of,cx),res=RG.responder(E,n.pide,n.min,n.r);res.r=n.r;res.E=E;n.ult=of;
 if(res.t==='acepta'){n.estado='jugador';n.acuerdo=of;n.contra=null}
 else if(res.t==='contra'){n.pide=res.pide;n.contra={...of,monto:montoPara(res.pide,of,cx)};res.contra=n.contra}
 else{n.contra=null;if(res.final){n.estado='rota'}else if(n.r>=RG.RONDAS){n.estado='rota';res.final=true}}
 n.log.push({r:n.r,of,res:res.t,pide:res.pide||null});
 const c2=C();c2.marketDeals=c2.marketDeals||[];
 if(res.t!=='contra')c2.marketDeals.push({player:p.name,kind:'Fichaje',status:res.t==='acepta'?'ACUERDO CON EL CLUB':'RECHAZADO',detail:res.t==='acepta'?`${money(of.monto)}${of.cuotas>1?' en '+of.cuotas+' cuotas':' al contado'} · falta el jugador`:(res.motivo||'')});
 save();return res}
function aceptarContra(id){const n=NEG(id);if(!n||!n.contra||n.estado!=='club')return{t:'error',motivo:'No hay contraoferta'};const cx=ctxClub(findP(id));
 const err=validarOferta(n.contra,cx);if(err)return{t:'error',motivo:err};n.acuerdo=n.contra;n.contra=null;n.estado='jugador';n.log.push({r:n.r,res:'acepta contraoferta'});save();return{t:'acepta'}}
/* cláusula de rescisión: al contado, el club no puede negarse */
function pagarClausula(id){const c=C(),p=findP(id);if(!p)return{t:'error',motivo:'Jugador no encontrado'};const n=NEG(id,true),cx=ctxClub(p);
 if(n.estado==='jugador')return{t:'error',motivo:'Ya hay acuerdo con el club'};
 if(cx.clausula>c.budget)return{t:'error',motivo:`La cláusula (${money(cx.clausula)}) supera tu presupuesto.`};
 n.estado='jugador';n.acuerdo={monto:cx.clausula,cuotas:1,bonos:[],fv:0,clausula:true};n.contra=null;n.log.push({res:'cláusula pagada'});save();return{t:'acepta',clausula:true}}
/* ---------- 2) contrato con el jugador ---------- */
function contratoBase(p){const pd=RG.pideJugador(p,ctxJugador(p));return{sueldo:R2(Math.max(.1,+p.wage||.3)),anos:clamp(3,pd.anos[0],pd.anos[1]),clausula:R2(Math.max(.5,+p.value||0)*2.5),comision:pd.comision}}
function comisionMonto(p,fee,pct){return R2(fee>0?fee*pct/100:Math.max(.02,(+p.wage||.3)*.5)*pct/Math.max(1,RG.comisionPct(p)))}
function proponerJugador(id,con){const c=C(),p=findP(id);if(!p)return{t:'error',motivo:'Jugador no encontrado'};const n=NEG(id);
 if(!n||n.estado!=='jugador'||!n.acuerdo)return{t:'error',motivo:'Primero hay que cerrar con el club'};
 con={sueldo:R2(+con.sueldo||0),anos:clamp(+con.anos||3,1,5),clausula:R2(Math.max(0,+con.clausula||0)),comision:clamp(+con.comision||0,0,20)};
 if(!(con.sueldo>0))return{t:'error',motivo:'Ingresá un sueldo.'};
 if(con.sueldo>wageBudget())return{t:'error',motivo:`El sueldo supera tu margen salarial (${money(wageBudget())}).`};
 const pp=RG.partes(n.acuerdo.monto,n.acuerdo.cuotas),com=comisionMonto(p,n.acuerdo.monto,con.comision);
 if(pp[0]+com>c.budget)return{t:'error',motivo:`Al firmar pagás ${money(pp[0])} + comisión ${money(com)}: no te alcanza el presupuesto.`};
 n.rj++;const res=RG.jugador(p,ctxJugador(p),con,n.rj);res.r=n.rj;n.ultCon=con;
 if(res.t==='acepta'){const P=firmar(p,n,con,pp,com);res.t='firmado';res.jugador=P;res.pagado=R2(pp[0]+com);res.comision=com}
 else if(res.t==='contra'){n.contraJ={sueldo:res.sueldo,anos:res.anos,clausula:con.clausula,comision:res.comision};res.contra=n.contraJ}
 else{const e=F.E5();delete e.neg[id];if(n.rid){const r=e.recompras.find(x=>x.id===n.rid);if(r)r.estado='vigente'}
  c.marketDeals.push({player:p.name,kind:'Fichaje',status:'RECHAZADO',detail:'El jugador: '+(res.motivo||'no aceptó')});c.inbox.unshift(`❌ ${p.name} rechazó tu propuesta de contrato: ${res.motivo||'no le conviene'}. El acuerdo con ${p.club} se cae.`)}
 save();return res}
function aceptarContraJugador(id){const n=NEG(id);if(!n||!n.contraJ)return{t:'error',motivo:'No hay contrapropuesta del jugador'};
 const con=n.contraJ;n.rj=Math.max(0,n.rj-1);   /* aceptar lo que pidió el jugador no gasta una ronda nueva */
 const r=proponerJugador(id,con);return r}
function nextNumber(){const u=new Set(C().players.map(p=>p.number));let n=1;while(u.has(n))n++;return n}
function firmar(p,n,con,pp,com){const c=C(),a=n.acuerdo,b=F.base(),r=p.rating;
 F.mover(-pp[0],`${a.clausula?'Cláusula de rescisión':a.recompra?'Recompra':'Fichaje'} de ${p.name} a ${p.club}${a.cuotas>1?' (cuota 1/'+a.cuotas+')':''}`);
 F.mover(-com,`Comisión del agente de ${p.name} (${con.comision} %)`);
 try{mcIAEcoAjustar(p.club,pp[0])}catch(e){}
 F.agendarCuotas(pp,-1,p.club,p.name,b);F.agendarBonos(a.bonos,p.club,p.name,b);
 const P={id:(c.players.reduce((m,x)=>Math.max(m,+x.id||0),0)+1),name:p.name,pos:p.pos,rating:r,potential:p.potential||r,age:p.age,nat:p.nat,value:p.value,fromClub:p.club,fitness:95,morale:78,goals:0,assists:0,apps:0,contract:con.anos,wage:con.sueldo,number:nextNumber(),
  pace:60+r%35,shooting:p.pos==='DEL'?r+2:55+r%20,passing:p.pos==='MED'?r+2:55+r%20,defending:p.pos==='DEF'?r+2:50+r%20,stamina:70+r%25,strength:60+r%30,injury:null,personality:'Nuevo fichaje',foot:'Derecho',weakFoot:3,transferListed:false,
  clausula:con.clausula||0,agente:{pct:con.comision,monto:com},e5:{s:c.season,monto:a.monto,cuotas:a.cuotas,club:p.club}};
 if(a.fv>0)P.futuraVenta={club:p.club,pct:a.fv};
 c.players.push(P);c.mkt=c.mkt||{gone:{},extra:[]};c.mkt.gone[p.id]=1;c.mkt.extra=(c.mkt.extra||[]).filter(x=>x.id!==p.id);
 const det=`${money(a.monto)}${a.cuotas>1?' en '+a.cuotas+' cuotas':' al contado'}${a.bonos&&a.bonos.length?' + '+a.bonos.length+' bono/s':''}${a.fv?' + '+a.fv+' % de futura venta':''} · ${money(con.sueldo)}/año × ${con.anos} · cláusula ${con.clausula?money(con.clausula):'no'} · comisión ${money(com)}`;
 c.inbox.unshift(`✅ Fichaje confirmado: ${p.name} (${p.club}). ${det}.`);
 c.transferHistory=c.transferHistory||[];c.transferHistory.push({name:p.name,detail:'ENTRADA · $'+a.monto+'M'});
 c.marketDeals=c.marketDeals||[];c.marketDeals.push({player:p.name,kind:'Fichaje',status:'ACEPTADO',detail:det});
 try{negotiationLog.unshift('✅ '+p.name+': '+det)}catch(e){}
 if(n.rid){const r2=F.E5().recompras.find(x=>x.id===n.rid);if(r2)r2.estado='ejecutada'}
 delete F.E5().neg[p.id];try{mcResetDB()}catch(e){}return P}
/* ---------- recompra (de un jugador que vendiste con esa opción): el club no puede negarse ---------- */
function recomprar(rid){const c=C(),e=F.E5(),r=e.recompras.find(x=>x.id===rid);if(!r||r.estado!=='vigente')return{t:'error',motivo:'La opción de recompra no está vigente'};
 const p=findByName(r.jug);if(!p||p.club!==r.club)return{t:'error',motivo:`${r.jug} ya no está en ${r.club}`};
 if(r.precio>c.budget)return{t:'error',motivo:`La recompra (${money(r.precio)}) supera tu presupuesto.`};
 const n=NEG(p.id,true);n.estado='jugador';n.acuerdo={monto:r.precio,cuotas:1,bonos:[],fv:0,recompra:true};n.rid=rid;r.estado='en curso';save();
 if(document.getElementById('sheet'))abrirCompra(p.id);return{t:'acepta',id:p.id}}
/* ---------- probabilidades para las barras de la pantalla de negociaciones ---------- */
function chance(p,fee,wage){try{const cx=ctxClub(p),E=valor({monto:fee,cuotas:1},cx),club=clamp((E/cx.ped.A-.55)/.45,0,1);
 const pd=RG.pideJugador(p,ctxJugador(p)),pl=clamp(.5+((+wage||0)/pd.sueldo-1)*2,0,1)*(RG.jugador(p,ctxJugador(p),{sueldo:pd.sueldo*1.5,anos:pd.anos[0],clausula:(+p.value||1)*2,comision:pd.comision},1).final?0:1);
 return{ch:Math.max(.04,Math.min(.96,club*pl)),club,pl}}catch(e){return{ch:.5,club:.5,pl:.5}}}
/* ---------- pantalla de compra ---------- */
const UI={};   /* lo que el usuario está escribiendo (por jugador) */
function form(id){if(!UI[id]){const p=findP(id),cx=ctxClub(p);UI[id]={monto:R2(Math.max(.05,cx.ped.A*.9)),cuotas:1,fv:0,bonos:{goles:{on:0,meta:p.pos==='DEL'?15:p.pos==='MED'?8:3,monto:R2(Math.max(.05,cx.valor*.08))},partidos:{on:0,meta:25,monto:R2(Math.max(.05,cx.valor*.06))},titulos:{on:0,meta:1,monto:R2(Math.max(.05,cx.valor*.1))}},con:contratoBase(p)}}return UI[id]}
function leerForm(id){const u=form(id),v=k=>{const e=$('e5_'+k);return e?e.value:null};
 if(v('monto')!=null)u.monto=+v('monto');if(v('cuotas')!=null)u.cuotas=+v('cuotas');if(v('fv')!=null)u.fv=+v('fv');
 ['goles','partidos','titulos'].forEach(t=>{const b=u.bonos[t],on=$('e5_b_'+t);if(on){b.on=on.checked?1:0;b.meta=+v('bm_'+t);b.monto=+v('bv_'+t)}});
 ['sueldo','anos','clausula','comision'].forEach(k=>{if(v('c_'+k)!=null)u.con[k]=+v('c_'+k)});return u}
const ofDe=u=>({monto:u.monto,cuotas:u.cuotas,fv:u.fv,bonos:Object.entries(u.bonos).filter(([,b])=>b.on).map(([t,b])=>({tipo:t,meta:b.meta,monto:b.monto}))});
let AV={};   /* último aviso por jugador */
function abrirCompra(id,pre){const c=C(),p=findP(id);if(!p||!c)return;ensureMarketData&&ensureMarketData();const u=form(id);
 if(pre){if(pre.monto>0)u.monto=R2(pre.monto);if(pre.sueldo>0)u.con.sueldo=R2(pre.sueldo);if(pre.anos>0)u.con.anos=pre.anos}
 const n=NEG(id),cx=ctxClub(p),est=n?n.estado:'club',r=n?n.r:0;const av=AV[id]||'';
 const cab=`<div class="eyebrow">NEGOCIACIÓN · ETAPA 5</div><h2>${esc(p.name)}</h2><p class="tiny">${esc(p.club)} · ${p.pos} · ${p.age} años · GRL ${p.rating} · valor ${money(cx.valor)}</p>
  <div class="statsrow"><span>Contrato con su club</span><b>${cx.anos} ${cx.anos===1?'temporada':'temporadas'}</b></div>
  <div class="statsrow"><span>Importancia en ${esc(p.club)}</span><b>${IMP[cx.imp]}</b></div>
  <div class="statsrow"><span>Economía de ${esc(p.club)} <span class="tiny muted">(estimada)</span></span><b>${RG.ecoTexto(cx.eco.b,cx.eco.sv)}</b></div>
  <div class="statsrow"><span>Cláusula de rescisión <span class="tiny muted">(estimada)</span></span><b>${money(cx.clausula)}</b></div>
  <p class="tiny muted">Tu presupuesto: ${money(c.budget)} · cuotas comprometidas ${money(F.deuda())} de ${money(F.capacidad())} posibles.</p>`;
 let body='';
 if(est==='rota')body=`<p class="em" style="color:#f0535f">${esc(p.club)} cortó la negociación esta temporada.</p>`;
 else if(est==='club'){const sel=(k,o,val)=>`<select id="e5_${k}">${o.map(x=>`<option value="${x[0]}"${+val===x[0]?' selected':''}>${x[1]}</option>`).join('')}</select>`;
  const bon=t=>{const b=u.bonos[t];return `<div class="statsrow"><label style="display:flex;gap:6px;align-items:center;margin:0"><input type="checkbox" id="e5_b_${t}" ${b.on?'checked':''} style="width:auto">Bono por ${t}</label><span style="display:flex;gap:4px"><input id="e5_bm_${t}" type="number" min="1" step="1" value="${b.meta}" style="width:58px" title="Objetivo"><input id="e5_bv_${t}" type="number" min="0.01" step="0.1" value="${b.monto}" style="width:72px" title="Monto (M)"></span></div>`};
  body=`<div class="eyebrow" style="margin-top:10px">1 · OFERTA AL CLUB · RONDA ${Math.min(r+1,3)} DE 3</div>
  <label>Monto total (M)</label><input id="e5_monto" type="number" min="0" step="0.1" value="${u.monto}">
  <label>Forma de pago</label>${sel('cuotas',[[1,'Contado'],[2,'2 cuotas (2 temporadas)'],[3,'3 cuotas (3 temporadas)']],u.cuotas)}
  <p class="tiny muted">La cuota 1 se paga al firmar; la 2 al cierre de ${temp(F.base())} y la 3 al cierre de ${temp(F.base()+1)}.</p>
  <label>Bonos por objetivos (se pagan solo si se cumplen, en ${temp(F.base())} o ${temp(F.base()+1)}) · objetivo por temporada y monto</label>${bon('goles')}${bon('partidos')}${bon('titulos')}
  <label>Porcentaje de futura venta para ${esc(p.club)}</label>${sel('fv',[[0,'Sin porcentaje'],[10,'10 %'],[20,'20 %'],[30,'30 %']],u.fv)}
  ${n&&n.contra?`<div class="card" style="margin-top:8px"><b>Contraoferta de ${esc(p.club)}</b><p class="tiny">Pide ${money(n.contra.monto)}${n.contra.cuotas>1?' en '+n.contra.cuotas+' cuotas':' al contado'}${n.contra.bonos.length?' con tus bonos':''}${n.contra.fv?' y '+n.contra.fv+' % de futura venta':''}.</p><button class="btn small" onclick="MCE5.uiAceptarContra(${q(id)})">ACEPTAR CONTRAOFERTA</button></div>`:''}
  <button class="btn" style="width:100%;margin-top:10px" onclick="MCE5.uiOfertar(${q(id)})">ENVIAR OFERTA (RONDA ${Math.min(r+1,3)}/3)</button>
  <button class="btn secondary" style="width:100%;margin-top:7px" onclick="MCE5.uiClausula(${q(id)})">PAGAR LA CLÁUSULA (${money(cx.clausula)} AL CONTADO)</button>`}
 else if(est==='jugador'){const a=n.acuerdo,cj=ctxJugador(p),pd=RG.pideJugador(p,cj),com=comisionMonto(p,a.monto,u.con.comision);
  body=`<div class="card" style="margin-top:8px"><b>✓ Acuerdo con ${esc(p.club)}</b><p class="tiny">${a.clausula?'Cláusula de rescisión pagada':a.recompra?'Recompra (el club no puede negarse)':'Oferta aceptada'}: ${money(a.monto)}${a.cuotas>1?' en '+a.cuotas+' cuotas':' al contado'}${a.bonos&&a.bonos.length?' + '+a.bonos.length+' bono/s':''}${a.fv?' + '+a.fv+' % de futura venta':''}.</p></div>
  <div class="eyebrow" style="margin-top:10px">2 · CONTRATO CON EL JUGADOR · RONDA ${Math.min(n.rj+1,3)} DE 3</div>
  <p class="tiny">Su agente pide un sueldo de alrededor de <b>${money(pd.sueldo)}</b>/año, ${pd.anos[0]}–${pd.anos[1]} temporadas y ${pd.comision} % de comisión. En tu plantel sería <b>${cj.rolDestino}</b>; nivel de tu club ${Math.round(cj.nivelDestino)} y del suyo ${Math.round(cj.nivelOrigen)}.</p>
  <label>Sueldo anual (M)</label><input id="e5_c_sueldo" type="number" min="0.1" step="0.1" value="${u.con.sueldo}">
  <label>Duración</label><select id="e5_c_anos">${[1,2,3,4,5].map(y=>`<option value="${y}"${+u.con.anos===y?' selected':''}>${y} ${y===1?'temporada':'temporadas'}</option>`).join('')}</select>
  <label>Cláusula de rescisión (M · 0 = sin cláusula)</label><input id="e5_c_clausula" type="number" min="0" step="0.5" value="${u.con.clausula}">
  <p class="tiny muted">Si otro club paga esta cláusula, tu club no puede negarse. Más baja = más le gusta al jugador.</p>
  <label>Comisión del agente (%)</label><input id="e5_c_comision" type="number" min="0" max="20" step="1" value="${u.con.comision}">
  <p class="tiny muted">Al firmar pagás ${money(RG.partes(a.monto,a.cuotas)[0])} + comisión ${money(com)}. Margen salarial ${money(wageBudget())}.</p>
  ${n.contraJ?`<div class="card" style="margin-top:8px"><b>Contrapropuesta del jugador</b><p class="tiny">Pide ${money(n.contraJ.sueldo)}/año, ${n.contraJ.anos} temporadas y ${n.contraJ.comision} % para su agente.</p><button class="btn small" onclick="MCE5.uiAceptarContraJ(${q(id)})">ACEPTAR LO QUE PIDE</button></div>`:''}
  <button class="btn" style="width:100%;margin-top:10px" onclick="MCE5.uiJugador(${q(id)})">PROPONER CONTRATO (RONDA ${Math.min(n.rj+1,3)}/3)</button>`}
 openModal(cab+(av?`<p class="em" id="e5Aviso" style="margin-top:8px">${av}</p>`:'')+body+`<button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CERRAR</button>`)}
const aviso=(id,t)=>{AV[id]=t};
function texto(res,p){if(res.t==='error')return '⚠ '+esc(res.motivo);if(res.t==='acepta')return res.clausula?`✓ Pagaste la cláusula: ${esc(p.club)} no puede negarse. Ahora negociá con el jugador.`:`✓ ${esc(p.club)} aceptó. Ahora negociá con el jugador.`;
 if(res.t==='contra')return `↔ ${esc(p.club)} contraoferta: pide ${money(res.contra.monto)} con esa forma de pago (ronda ${res.r} de 3).`;
 return `✕ ${esc(p.club)} rechazó la oferta: ${esc(res.motivo||'')}${res.final?'. Se cortó la negociación hasta la temporada que viene.':' (ronda '+res.r+' de 3).'}`}
function refrescar(){try{renderMarket()}catch(e){}try{if(document.querySelector('#negos.active')&&window.MC12&&MC12.negoRender)MC12.negoRender()}catch(e){}}
const ui={
 uiOfertar(id){const u=leerForm(id),p=findP(id),r=ofertarClub(id,ofDe(u));aviso(id,texto(r,p));if(r.t==='contra')u.monto=r.contra.monto;abrirCompra(id);refrescar()},
 uiAceptarContra(id){const p=findP(id),r=aceptarContra(id);aviso(id,texto(r,p));abrirCompra(id);refrescar()},
 uiClausula(id){const p=findP(id),r=pagarClausula(id);aviso(id,texto(r,p));abrirCompra(id);refrescar()},
 uiJugador(id){const u=leerForm(id),p=findP(id),r=proponerJugador(id,u.con);jugadorRes(id,p,r,u)},
 uiAceptarContraJ(id){const u=form(id),p=findP(id),r=aceptarContraJugador(id);jugadorRes(id,p,r,u)}};
function jugadorRes(id,p,r,u){
 if(r.t==='firmado'){delete UI[id];delete AV[id];openModal(`<div class="eyebrow">FICHAJE CONFIRMADO</div><h2>${esc(p.name)}</h2><p>Llega desde ${esc(p.club)}. Pagaste ${money(r.pagado)} (incluye la comisión del agente, ${money(r.comision)}).</p><p class="tiny">Las cuotas pendientes y los bonos quedaron en Finanzas → Compromisos del mercado.</p><button class="btn" style="width:100%" onclick="closeModal()">LISTO</button>`);toast(`¡${p.name} es nuevo jugador de tu club!`);try{renderSquad()}catch(e){}refrescar();return}
 if(r.t==='contra'){u.con.sueldo=r.contra.sueldo;u.con.anos=r.contra.anos;u.con.comision=r.contra.comision;aviso(id,`↔ El jugador pide ${money(r.contra.sueldo)}/año y ${r.contra.anos} temporadas (${esc(r.motivo)}). Ronda ${r.r} de 3.`);abrirCompra(id);return}
 if(r.t==='error'){aviso(id,'⚠ '+esc(r.motivo));abrirCompra(id);return}
 delete UI[id];delete AV[id];openModal(`<div class="eyebrow">NEGOCIACIÓN TERMINADA</div><h2>${esc(p.name)}</h2><p>✕ ${esc(r.motivo||'El jugador no aceptó')}.</p><p class="tiny">El acuerdo con ${esc(p.club)} se cayó y no pagaste nada.</p><button class="btn" style="width:100%" onclick="closeModal()">CERRAR</button>`);refrescar()}
/* ============ VENDER ============ */
function confDe(cn){try{return cn==='Argentina'?'CONMEBOL':MC10.confOf(cn)}catch(e){return null}}
function pedirOfertas(){const c=C(),e=F.E5();const list=c.players.filter(p=>p.transferListed&&!p.loan);
 if(!list.length){alert('Primero publicá al menos un jugador en la lista de transferibles.');return null}
 if(c.players.length<=16){alert('Tu plantel tiene el mínimo de jugadores (16). Fichá antes de vender.');return null}
 const p=list[Math.floor(Math.random()*list.length)],value=Math.max(.05,p.value!=null?+p.value:Math.max(1,Math.round(p.rating*p.rating/100)));
 e.ofertas=e.ofertas.filter(o=>o.estado==='abierta'&&o.s===c.season&&c.players.some(x=>x.id===o.jugId)&&o.jugId!==p.id).concat(e.ofertas.filter(o=>o.estado!=='abierta').slice(-20));
 let cl=Object.keys(CLUBS).flatMap(cn=>CLUBS[cn]).filter(k=>k!==c.club).map(k=>[k,nivelClub(k)]).filter(x=>x[1]>=p.rating-7&&x[1]<=p.rating+2);
 const mio=confDe(c.country);let pool=cl.filter(([k,s])=>{const cn=window.mcCountryOf?mcCountryOf(k):null;return confDe(cn)===mio||s>=70});if(!pool.length)pool=cl;
 pool=pool.sort(()=>Math.random()-.5).slice(0,8);const nuevas=[];
 for(const [k] of pool){if(nuevas.length>=3)break;const eco=ecoDe(k),h=hash(k+p.name+c.season);const max=R2(value*(1+(h%20)/100)*(.95+(h%11)/100));
  const cap=eco.b*.6;const n=max<=cap?1:max*.5<=cap?2:max*.34<=cap?3:0;if(!n)continue;
  const o={id:'o'+Date.now().toString(36)+nuevas.length,jugId:p.id,jug:p.name,club:k,monto:R2(Math.max(.05,max*(.78+(h%12)/100))),cuotas:n,max,r:1,s:c.season,estado:'abierta',valor:value};
  nuevas.push(o);e.ofertas.push(o);c.marketDeals.push({player:p.name,kind:'Oferta recibida',status:'PENDIENTE',detail:`${k} ofrece ${money(o.monto)}${n>1?' en '+n+' cuotas':' al contado'}`})}
 save();if($('sheet'))verOfertas(p.id);try{renderMarket()}catch(e){}return nuevas}
function costoExtras(o,ask){return(+ask.fv||0)/100*o.valor*.5+(ask.rec&&+ask.rec.precio>0?Math.max(0,o.valor*1.6-ask.rec.precio)*.3*(ask.rec.anos>=2?1.3:1):0)}
function contraofertar(oid,ask){const c=C(),e=F.E5(),o=e.ofertas.find(x=>x.id===oid);if(!o||o.estado!=='abierta')return{t:'error',motivo:'La oferta ya no está abierta'};
 ask={monto:R2(+ask.monto||0),fv:clamp(+ask.fv||0,0,50),rec:ask.rec&&+ask.rec.precio>0?{precio:R2(ask.rec.precio),anos:clamp(+ask.rec.anos||1,1,2)}:null};
 if(!(ask.monto>0))return{t:'error',motivo:'Ingresá el monto que pedís.'};
 const maxMonto=R2(o.max-costoExtras(o,ask));o.pedido=ask;
 if(ask.monto<=maxMonto+1e-9){o.monto=ask.monto;o.fv=ask.fv;o.rec=ask.rec;const v=vender(oid);return v.t==='error'?v:{t:'acepta',venta:v}}
 if(o.r>=RG.RONDAS||maxMonto<=o.monto*.5){o.estado='retirada';c.marketDeals.push({player:o.jug,kind:'Venta',status:'RECHAZADA',detail:`${o.club} se retiró de la negociación`});save();return{t:'rechaza',final:true,motivo:`${o.club} se retiró: no llega a lo que pedís`}}
 o.r++;o.monto=R2(Math.min(maxMonto,o.monto+(ask.monto-o.monto)*.4));o.fv=ask.fv;o.rec=ask.rec;save();return{t:'contra',monto:o.monto,r:o.r}}
function vender(oid){const c=C(),e=F.E5(),o=e.ofertas.find(x=>x.id===oid);if(!o||o.estado!=='abierta')return{t:'error',motivo:'La oferta ya no está abierta'};
 const p=c.players.find(x=>x.id===o.jugId);if(!p)return{t:'error',motivo:'El jugador ya no está en tu plantel'};
 if(c.players.length<=16)return{t:'error',motivo:'Plantel mínimo: 16 jugadores.'};
 const pp=RG.partes(o.monto,o.cuotas),b=F.base();try{mcIAEcoAjustar(o.club,-pp[0])}catch(x){}
 F.salida(p,o.club,o.monto,`Venta de ${p.name} a ${o.club}${o.cuotas>1?' (cuota 1/'+o.cuotas+')':''}`,pp);
 F.agendarCuotas(pp,1,o.club,p.name,b);
 if(o.fv>0)e.ventas.push({jug:p.name,club:o.club,pct:o.fv,s:c.season,monto:o.monto});
 if(o.rec)e.recompras.push({id:'r'+Date.now().toString(36),jug:p.name,club:o.club,precio:o.rec.precio,hasta:b+o.rec.anos-1,estado:'vigente'});
 o.estado='aceptada';e.ofertas.forEach(x=>{if(x!==o&&x.jugId===o.jugId&&x.estado==='abierta')x.estado='descartada'});
 (c.marketDeals||[]).forEach(d=>{if(d.player===p.name&&d.status==='PENDIENTE')d.status=d.detail.startsWith(o.club)?'ACEPTADA':'DESCARTADA'});
 const det=`${money(o.monto)}${o.cuotas>1?' en '+o.cuotas+' cuotas':' al contado'}${o.fv?' · '+o.fv+' % de futura venta para vos':''}${o.rec?' · recompra '+money(o.rec.precio)+' hasta '+temp(b+o.rec.anos-1):''}`;
 c.marketDeals.push({player:p.name,kind:'Venta',status:'ACEPTADA',detail:`${o.club} · ${det}`});c.inbox.unshift(`Venta confirmada: ${p.name} a ${o.club} por ${det}.`);
 save();return{t:'vendido',jug:p.name,club:o.club,cobrado:pp[0],det}}
function rechazarOferta(oid){const c=C(),e=F.E5(),o=e.ofertas.find(x=>x.id===oid);if(!o)return;o.estado='rechazada';c.marketDeals.push({player:o.jug,kind:'Venta',status:'RECHAZADA',detail:`Rechazaste la oferta de ${o.club}`});save()}
function verOfertas(jugId){const c=C(),e=F.E5(),p=c.players.find(x=>x.id===jugId);const L=e.ofertas.filter(o=>o.estado==='abierta'&&o.jugId===jugId);
 if(!p){closeModal();return}
 openModal(`<div class="eyebrow">OFERTAS POR TU JUGADOR · ETAPA 5</div><h2>${esc(p.name)}</h2><p class="tiny">Valor ${money(p.value)} · GRL ${p.rating}${p.futuraVenta?` · debés ${p.futuraVenta.pct} % de la futura venta a ${esc(p.futuraVenta.club)}`:''}${+p.clausula>0?` · cláusula ${money(p.clausula)}`:''}</p>${AV['v'+jugId]?`<p class="em">${AV['v'+jugId]}</p>`:''}
 ${L.length?L.map(o=>`<div class="card" style="margin-top:8px"><div class="statsrow"><span>${window.clubBadge?clubBadge(o.club,18):''} <b>${esc(o.club)}</b></span><b>${money(o.monto)}${o.cuotas>1?' · '+o.cuotas+' cuotas':' · contado'}</b></div>
  <p class="tiny muted">Ronda ${o.r} de 3${o.fv?` · aceptaría ${o.fv} % de futura venta`:''}${o.rec?` · y recompra a ${money(o.rec.precio)}`:''}</p>
  <div class="grid2" style="gap:6px"><button class="btn small" onclick="MCE5.uiVender(${q(o.id)})">ACEPTAR</button><button class="btn small secondary" onclick="MCE5.uiRechazarV(${q(o.id)})">RECHAZAR</button></div>
  <label>Contraoferta: monto que pedís (M)</label><input id="e5v_m_${o.id}" type="number" min="0" step="0.1" value="${R2(o.monto*1.15)}">
  <label>Porcentaje de futura venta para vos</label><select id="e5v_fv_${o.id}">${[0,10,20,30].map(x=>`<option value="${x}">${x?x+' %':'Sin porcentaje'}</option>`).join('')}</select>
  <label>Opción de recompra (M · 0 = sin opción) y plazo</label><div style="display:flex;gap:6px"><input id="e5v_rp_${o.id}" type="number" min="0" step="0.5" value="0"><select id="e5v_ra_${o.id}"><option value="1">1 temporada</option><option value="2">2 temporadas</option></select></div>
  <button class="btn secondary" style="width:100%;margin-top:6px" onclick="MCE5.uiContraV(${q(o.id)})">CONTRAOFERTAR</button></div>`).join(''):'<p class="em">No hay ofertas abiertas por este jugador.</p>'}
 <button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CERRAR</button>`)}
Object.assign(ui,{
 uiVender(oid){const e=F.E5(),o=e.ofertas.find(x=>x.id===oid),r=vender(oid);if(r.t==='vendido'){openModal(`<div class="eyebrow">VENTA CONFIRMADA</div><h2>${esc(r.jug)}</h2><p>${esc(r.club)} · ${esc(r.det)}. Cobraste ${money(r.cobrado)} ahora.</p><button class="btn" style="width:100%" onclick="closeModal()">LISTO</button>`);try{renderSquad()}catch(x){}refrescar()}else{AV['v'+(o&&o.jugId)]='⚠ '+esc(r.motivo);if(o)verOfertas(o.jugId)}},
 uiRechazarV(oid){const o=F.E5().ofertas.find(x=>x.id===oid);rechazarOferta(oid);if(o)verOfertas(o.jugId);refrescar()},
 uiContraV(oid){const o=F.E5().ofertas.find(x=>x.id===oid);if(!o)return;const v=k=>+(($(k)||{}).value||0);
  const r=contraofertar(oid,{monto:v('e5v_m_'+oid),fv:v('e5v_fv_'+oid),rec:{precio:v('e5v_rp_'+oid),anos:v('e5v_ra_'+oid)}});
  if(r.t==='acepta'){ui.uiVenderHecho(r.venta);return}
  AV['v'+o.jugId]=r.t==='contra'?`↔ ${esc(o.club)} sube su oferta a ${money(r.monto)} (ronda ${r.r} de 3).`:r.t==='error'?'⚠ '+esc(r.motivo):'✕ '+esc(r.motivo);verOfertas(o.jugId);refrescar()},
 uiVenderHecho(r){openModal(`<div class="eyebrow">VENTA CONFIRMADA</div><h2>${esc(r.jug)}</h2><p>${esc(r.club)} aceptó tus condiciones: ${esc(r.det)}. Cobraste ${money(r.cobrado)} ahora.</p><button class="btn" style="width:100%" onclick="closeModal()">LISTO</button>`);try{renderSquad()}catch(x){}refrescar()},
 uiOfertasRecibidas(){const e=F.E5(),c=C(),o=e.ofertas.find(x=>x.estado==='abierta'&&c.players.some(p=>p.id===x.jugId));if(o)verOfertas(o.jugId);else pedirOfertas()}});
/* ---------- enganches con las pantallas existentes ---------- */
window.submitTransferOffer=function(id){const g=k=>{const e=$(k);return e?+e.value:0};abrirCompra(id,{monto:g('transferFee'),sueldo:g('transferWage'),anos:g('transferYears')})};
window.generateClubBid=function(){const r=pedirOfertas();if(r&&!r.length){alert('Ningún club con presupuesto ofertó por ese jugador. Probá de nuevo o con otro transferible.')}else if(r){const p=r[0]&&r[0].jugId;if(p!=null)verOfertas(p)}};
Object.assign(window.MCE5,ui,{ctxClub,ctxJugador,nivelUsuario,ofertarClub,aceptarContra,pagarClausula,contratoBase,proponerJugador,aceptarContraJugador,recomprar,chance,abrirCompra,pedirOfertas,contraofertar,vender,rechazarOferta,verOfertas,comisionMonto,findP});
})();
