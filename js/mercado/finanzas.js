/* ===== MODO CARRERA 12.9 · ETAPA 5 · FINANZAS DEL MERCADO =====
   Lo que dejan tus operaciones para más adelante, guardado en career.e5 (se crea recién en tu primera operación;
   las carreras guardadas no cambian nada al abrirse):
   - pagos: cuotas a pagar o a cobrar. La cuota 1 se paga al firmar; la 2 al cierre de esa temporada y la 3 al cierre
     de la siguiente (si firmás con la temporada terminada, cuentan desde la que empieza).
   - bonos: objetivos por goles, partidos o títulos. Se evalúan al cierre de cada temporada de su período y se pagan
     solo la primera vez que se cumplen. Si no se cumplen en el período, vencen sin pagarse.
   - ventas con porcentaje de futura venta a tu favor y opciones de recompra.
   - historial de movimientos de dinero del mercado.
   Al cerrar la temporada (mcSeasonEnd) se pagan y cobran las cuotas que vencen, se evalúan los bonos y los clubes de la
   IA pueden pagar la cláusula de rescisión de tus jugadores (el club no puede negarse).
   Todo queda a la vista en Finanzas → "Compromisos del mercado". */
(function(){
'use strict';
const RG=window.MCReglas;if(!RG)return;
const R2=RG.R2,fold=RG.fold,hash=RG.hash;
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const money=v=>window.mcMoney?mcMoney(v):'$'+R2(v)+'M';
const C=()=>(typeof career!=='undefined'&&career)?career:null;
const temp=s=>s+'/'+String(s+1).slice(-2);
/* ---------- estado ---------- */
function E5(){const c=C();if(!c)return null;if(!c.e5||typeof c.e5!=='object')c.e5={v:1};const e=c.e5;
 ['pagos','bonos','ventas','recompras','hist','ofertas'].forEach(k=>{if(!Array.isArray(e[k]))e[k]=[]});if(!e.neg||typeof e.neg!=='object')e.neg={};return e}
const leer=()=>{const c=C();return c&&c.e5&&typeof c.e5==='object'?c.e5:null};
let NID=0;const nid=p=>p+Date.now().toString(36)+(NID++).toString(36);
/* temporada a la que pertenece una operación: si la temporada ya terminó, la que empieza */
function base(){const c=C();let over=false;try{over=!!(window.mcSeasonOver&&mcSeasonOver())}catch(e){}return c.season+(over?1:0)}
function mover(monto,txt){const c=C(),e=E5();c.budget=R2(c.budget+monto);e.hist.unshift({s:c.season,r:c.round||0,t:txt,m:R2(monto)});if(e.hist.length>60)e.hist.length=60}
/* cuotas: dir -1 = la pagás vos, +1 = la cobrás. montos[0] ya se movió al firmar */
function agendarCuotas(montos,dir,club,jug,b){const e=E5();montos.slice(1).forEach((m,i)=>e.pagos.push({id:nid('p'),d:b+i,m:R2(m),dir,t:'cuota',n:(i+2)+'/'+montos.length,club,jug,estado:'pendiente'}))}
function agendarBonos(bonos,club,jug,b){const e=E5();(bonos||[]).forEach(x=>{if(!(+x.monto>0)||!(+x.meta>0))return;e.bonos.push({id:nid('b'),jug,club,tipo:x.tipo,meta:+x.meta,m:R2(x.monto),desde:b,hasta:b+1,estado:'vigente'})})}
const pendientes=(dir)=>{const e=leer();return e?e.pagos.filter(p=>p.estado==='pendiente'&&(dir==null||p.dir===dir)):[]};
/* capacidad de endeudamiento: compromisos futuros (cuotas que pagás) que se permiten */
function capacidad(){const c=C();const val=(c.players||[]).reduce((a,p)=>a+(+p.value||0),0);return R2(Math.max(0,c.budget)+val*.35)}
function deuda(){return R2(pendientes(-1).reduce((a,p)=>a+p.m,0))}
/* ---------- cierre de temporada ---------- */
function titulos(c){const w=window.mcWorld?mcWorld():null,h=w&&w.hist&&w.hist[0];if(!h||h.season!==c.season)return 0;let n=0;
 if(String(h.league||'').split(' · ').some(x=>x===c.club||x.endsWith(': '+c.club)))n++;
 Object.values(h.cups||{}).forEach(v=>{if(v===c.club)n++});Object.values(h.cont||{}).forEach(v=>{if(v===c.club)n++});return n}
function cerrar(c,s,stats){const e=leer();if(!e||e.cerrada===s)return null;e.cerrada=s;const out={cuotasPagadas:0,cuotasCobradas:0,pagado:0,cobrado:0,bonosPagados:0,bonosVencidos:0};
 /* bonos de esta temporada (con las estadísticas de la temporada que termina) */
 const nt=titulos(c);
 e.bonos.forEach(b=>{if(b.estado!=='vigente'||b.desde>s)return;const st=stats.get(fold(b.jug));
  if(!st){b.estado='caducado';b.sp=s;return}
  const v=b.tipo==='goles'?st.g:b.tipo==='partidos'?st.a:nt;b.ult=v;
  if(v>=b.meta){mover(-b.m,`Bono por ${b.tipo} de ${b.jug} (${v}/${b.meta}) a ${b.club}`);try{mcIAEcoAjustar(b.club,b.m)}catch(x){}b.estado='pagado';b.sp=s;out.bonosPagados++;out.pagado+=b.m;
   e.pagos.push({id:nid('p'),d:s,m:b.m,dir:-1,t:'bono',n:b.tipo,club:b.club,jug:b.jug,estado:'pagado',sp:s});
   c.inbox.unshift(`💰 Bono cumplido: ${b.jug} llegó a ${v} ${b.tipo} (objetivo ${b.meta}). Pagaste ${money(b.m)} a ${b.club}.`)}
  else if(s>=b.hasta){b.estado='vencido';b.sp=s;out.bonosVencidos++}});
 /* cuotas que vencen en este cierre */
 e.pagos.forEach(p=>{if(p.estado!=='pendiente'||p.d>s)return;
  if(p.dir<0){mover(-p.m,`Cuota ${p.n} de ${p.jug} a ${p.club}`);try{mcIAEcoAjustar(p.club,p.m)}catch(x){}out.cuotasPagadas++;out.pagado+=p.m}
  else{mover(p.m,`Cuota ${p.n} de ${p.jug} (cobro a ${p.club})`);try{mcIAEcoAjustar(p.club,-p.m)}catch(x){}out.cuotasCobradas++;out.cobrado+=p.m}
  p.estado='pagado';p.sp=s});
 /* recompras vencidas */
 e.recompras.forEach(r=>{if(r.estado==='vigente'&&r.hasta<=s)r.estado='vencida'});
 /* limpieza: se guardan los últimos 80 pagos ya hechos y los bonos de las últimas 3 temporadas */
 const hechos=e.pagos.filter(p=>p.estado!=='pendiente');if(hechos.length>80){const fuera=new Set(hechos.slice(0,hechos.length-80));e.pagos=e.pagos.filter(p=>!fuera.has(p))}
 e.bonos=e.bonos.filter(b=>b.estado==='vigente'||(b.sp||s)>=s-2);
 out.pagado=R2(out.pagado);out.cobrado=R2(out.cobrado);
 if(out.cuotasPagadas||out.cuotasCobradas||out.bonosPagados||out.bonosVencidos)c.inbox.unshift(`📒 Cierre ${temp(s)} · mercado: ${out.cuotasPagadas} cuotas pagadas (${money(out.pagado)}), ${out.cuotasCobradas} cobradas (${money(out.cobrado)}), ${out.bonosPagados} bonos pagados, ${out.bonosVencidos} vencidos sin cumplirse.`);
 if(c.budget<0){c.board=Math.max(5,(c.board||50)-6);c.inbox.unshift(`⚠ El club cerró la temporada con saldo negativo (${money(c.budget)}) por los pagos del mercado. La directiva está preocupada: no podés comprar en cuotas hasta volver a tener saldo.`)}
 e.ultimoCierre={s,...out};return out}
/* la IA paga la cláusula de rescisión de tus jugadores (en el mercado de verano). Solo jugadores con cláusula pactada */
function clausulasIA(c,s){const out=[];if(!window.mcIAEco||!window.mcClubStrength)return out;
 const cands=(c.players||[]).filter(p=>+p.clausula>0&&!p.loan&&(+p.value||0)>0&&+p.clausula<=(+p.value)*1.6);
 for(const p of cands){if(c.players.length<=16)break;const R=hash('clIA'+fold(p.name)+s+c.id)%100;if(R>=35)continue;
  const clubs=Object.keys(CLUBS).flatMap(cn=>CLUBS[cn]).filter(k=>k!==c.club&&mcClubStrength(k)>=p.rating-3&&mcClubStrength(k)<=p.rating+6);
  clubs.sort((a,b)=>hash(a+p.name+s)-hash(b+p.name+s));
  for(const k of clubs.slice(0,12)){let e;try{e=mcIAEco(k)}catch(x){continue}if(!(e.b*.6>=p.clausula))continue;
   const r=pagarClausulaUsuario(p.id,k);if(r)out.push(r);break}}
 return out}
/* el club k paga la cláusula de tu jugador: la venta es obligatoria */
function pagarClausulaUsuario(id,k){const c=C();const i=c.players.findIndex(p=>p.id===id);if(i<0)return null;const p=c.players[i],m=R2(+p.clausula||0);if(!(m>0))return null;
 E5();try{mcIAEcoAjustar(k,-m)}catch(x){}
 salida(p,k,m,`Cláusula de rescisión de ${p.name} pagada por ${k}`);
 c.inbox.unshift(`🚨 ${k} pagó la cláusula de rescisión de ${p.name} (${money(m)}). La venta es obligatoria: tu club no puede negarse.`);
 c.marketDeals=c.marketDeals||[];c.marketDeals.push({player:p.name,kind:'Cláusula',status:'EJECUTADA',detail:`${k} pagó ${money(m)}`});
 return{jug:p.name,club:k,monto:m}}
/* salida de un jugador de tu plantel (venta, cláusula). Paga la futura venta que debías y registra todo */
function salida(p,club,monto,txt,montos){const c=C(),e=E5();const i=c.players.indexOf(p);if(i<0)return;
 mover(montos?montos[0]:monto,txt);
 if(p.futuraVenta&&+p.futuraVenta.pct>0){const fv=R2(monto*p.futuraVenta.pct/100);mover(-fv,`${p.futuraVenta.pct} % de futura venta de ${p.name} a ${p.futuraVenta.club}`);try{mcIAEcoAjustar(p.futuraVenta.club,fv)}catch(x){}
  c.inbox.unshift(`Pagaste ${money(fv)} a ${p.futuraVenta.club} por el ${p.futuraVenta.pct} % de la futura venta de ${p.name}.`)}
 c.players.splice(i,1);
 c.mkt=c.mkt||{gone:{},extra:[]};
 c.mkt.extra=(c.mkt.extra||[]).filter(x=>fold(x.name)!==fold(p.name)).concat([{id:'x-'+(window.mcKebab?mcKebab(p.name):fold(p.name).replace(/\W+/g,'-'))+'-'+Date.now().toString(36),name:p.name,pos:p.pos,rating:p.rating,age:p.age,nat:p.nat||'—',value:R2(Math.max(.01,+p.value||monto)),club,potential:p.potential,wage:p.wage,contract:p.contract,free:false}]);
 try{mcMovePlayer(p.name,club)}catch(x){}try{fitXI()}catch(x){}
 c.transferHistory=c.transferHistory||[];c.transferHistory.push({name:p.name,detail:'SALIDA a '+club+' · +'+money(monto)});
 e.recompras.forEach(r=>{if(r.estado==='vigente'&&fold(r.jug)===fold(p.name))r.estado='caducada'})}
/* el mercado de la IA vendió a un jugador que vos habías vendido con porcentaje de futura venta: cobrás tu parte */
window.mcE5TrasMercadoIA=function(moves,s,inv){const c=C(),e=leer();if(!c||!e)return;
 for(const m of moves){if(m[4]!=='traspaso'||!(m[3]>0))continue;const n=fold(m[0]);
  e.ventas.forEach(v=>{if(v.cobrada||fold(v.jug)!==n||v.club!==m[1])return;const parte=R2(m[3]*v.pct/100);
   mover(parte,`${v.pct} % de futura venta de ${v.jug} (${m[1]} → ${m[2]})`);try{mcIAEcoAjustar(m[1],-parte)}catch(x){}v.cobrada=s;v.cobro=parte;
   c.inbox.unshift(`💸 ${m[1]} vendió a ${v.jug} a ${m[2]} por ${money(m[3])}. Cobrás el ${v.pct} % de la futura venta: ${money(parte)}.`)});
  e.recompras.forEach(r=>{if(r.estado==='vigente'&&fold(r.jug)===n&&r.club===m[1])r.estado='caducada'})}};
/* ---------- enganche con el cierre de temporada ---------- */
(function(){const o=window.mcSeasonEnd;if(typeof o!=='function')return;
 window.mcSeasonEnd=function(c,L){const s=c&&c.season;const stats=new Map();(c&&c.players||[]).forEach(p=>stats.set(fold(p.name),{g:+p.goals||0,a:+p.apps||0}));
  const r=o.apply(this,arguments);
  try{if(leer())cerrar(c,s,stats)}catch(e){console.warn('MC E5 cierre',e)}
  try{const cl=clausulasIA(c,s);if(cl.length){const e=E5();e.ultimoCierre=Object.assign(e.ultimoCierre&&e.ultimoCierre.s===s?e.ultimoCierre:{s,cuotasPagadas:0,cuotasCobradas:0,pagado:0,cobrado:0,bonosPagados:0,bonosVencidos:0},{clausulas:cl})}}catch(e){console.warn('MC E5 cláusulas',e)}
  return r}})();
/* ---------- pantalla de economía: compromisos del mercado ---------- */
const TIPO={goles:'goles en una temporada',partidos:'partidos en una temporada',titulos:'título(s) en una temporada'};
function panelHTML(){const c=C(),e=leer();if(!c)return '';
 const pend=e?e.pagos.filter(p=>p.estado==='pendiente').sort((a,b)=>a.d-b.d):[];const porT=new Map();pend.forEach(p=>{const o=porT.get(p.d)||{pagar:0,cobrar:0,L:[]};if(p.dir<0)o.pagar+=p.m;else o.cobrar+=p.m;o.L.push(p);porT.set(p.d,o)});
 const bonos=e?e.bonos.filter(b=>b.estado==='vigente'):[],bonosH=e?e.bonos.filter(b=>b.estado!=='vigente').slice(-6):[];
 const conCl=(c.players||[]).filter(p=>+p.clausula>0),fvDebo=(c.players||[]).filter(p=>p.futuraVenta&&+p.futuraVenta.pct>0);
 const fvMia=e?e.ventas.filter(v=>!v.cobrada):[],rec=e?e.recompras.filter(r=>r.estado==='vigente'):[];
 const row=(k,v,cls)=>`<div class="statsrow"><span>${k}</span><b${cls?` class="${cls}"`:''}>${v}</b></div>`;
 const ult=e&&e.ultimoCierre;
 let h=`<div class="m12-ph"><i data-i="doc"></i>Compromisos del mercado<span class="sp"></span><small>ETAPA 5</small></div>
 <div class="m12-kv"><div><small>A pagar (cuotas)</small><b>${money(deuda())}</b></div><div><small>A cobrar (cuotas)</small><b>${money(pendientes(1).reduce((a,p)=>a+p.m,0))}</b></div><div><small>Bonos posibles</small><b>${money(bonos.reduce((a,b)=>a+b.m,0))}</b></div><div><small>Capacidad para cuotas</small><b>${money(Math.max(0,capacidad()-deuda()))}</b></div></div>`;
 h+=`<div class="m12-ph" style="margin-top:12px;font-size:14px"><i data-i="bars"></i>Pagos que vencen por temporada</div>`;
 h+=porT.size?[...porT.entries()].map(([d,o])=>`<div class="e5-t"><div class="statsrow"><span><b>Cierre ${temp(d)}</b></span><b>${o.pagar?'−'+money(o.pagar):''}${o.pagar&&o.cobrar?' · ':''}${o.cobrar?'+'+money(o.cobrar):''}</b></div>${o.L.map(p=>`<div class="statsrow tiny"><span>${p.dir<0?'Pagás':'Cobrás'} cuota ${esc(p.n)} · ${esc(p.jug)} · ${esc(p.club)}</span><b>${p.dir<0?'−':'+'}${money(p.m)}</b></div>`).join('')}</div>`).join(''):'<p class="tiny muted">No hay cuotas pendientes.</p>';
 h+=`<div class="m12-ph" style="margin-top:12px;font-size:14px"><i data-i="trophy"></i>Bonos por objetivos</div>`;
 h+=bonos.length?bonos.map(b=>{const p=(c.players||[]).find(x=>fold(x.name)===fold(b.jug));const act=b.tipo==='goles'?(p?p.goals:0):b.tipo==='partidos'?(p?p.apps:0):'—';
  return row(`${esc(b.jug)} · ${b.meta} ${TIPO[b.tipo]||b.tipo} · a ${esc(b.club)} · ${b.desde===b.hasta?temp(b.desde):temp(b.desde)+' y '+temp(b.hasta)}<span class="tiny muted" style="display:block">Esta temporada: ${act}${b.tipo!=='titulos'?' / '+b.meta:''} · se paga solo si se cumple</span>`,money(b.m))}).join(''):'<p class="tiny muted">No hay bonos vigentes.</p>';
 if(bonosH.length)h+=bonosH.map(b=>row(`<span class="tiny">${esc(b.jug)} · ${b.meta} ${esc(b.tipo)} · ${b.estado==='pagado'?'pagado en el cierre '+temp(b.sp):b.estado==='vencido'?'vencido sin cumplirse':'caducado (dejó el club)'}</span>`,b.estado==='pagado'?'−'+money(b.m):'—')).join('');
 h+=`<div class="m12-ph" style="margin-top:12px;font-size:14px"><i data-i="shield"></i>Cláusulas</div>`;
 h+=conCl.length?conCl.map(p=>row(`Cláusula de rescisión · ${esc(p.name)}<span class="tiny muted" style="display:block">Si un club la paga, tu club no puede negarse</span>`,money(p.clausula))).join(''):'<p class="tiny muted">Ningún jugador de tu plantel tiene cláusula pactada (se fija al firmar en esta versión).</p>';
 h+=fvDebo.map(p=>row(`Debés ${p.futuraVenta.pct} % de la futura venta de ${esc(p.name)} a ${esc(p.futuraVenta.club)}`,p.futuraVenta.pct+' %')).join('');
 h+=fvMia.map(v=>row(`Tenés ${v.pct} % de la futura venta de ${esc(v.jug)} (${esc(v.club)})`,v.pct+' %')).join('');
 h+=rec.map(r=>`<div class="statsrow"><span>Opción de recompra · ${esc(r.jug)} (${esc(r.club)}) hasta el cierre ${temp(r.hasta)}</span><button class="btn small" onclick="MCE5.recomprar(${JSON.stringify(r.id).replace(/"/g,'&quot;')})">${money(r.precio)}</button></div>`).join('');
 if(ult)h+=`<p class="tiny muted" style="margin-top:8px">Último cierre (${temp(ult.s)}): ${ult.cuotasPagadas} cuotas pagadas (${money(ult.pagado)}), ${ult.cuotasCobradas} cobradas (${money(ult.cobrado)}), ${ult.bonosPagados} bonos pagados, ${ult.bonosVencidos} vencidos.</p>`;
 const H=e?e.hist.slice(0,10):[];h+=`<div class="m12-ph" style="margin-top:12px;font-size:14px"><i data-i="coin"></i>Movimientos del mercado</div>`+(H.length?H.map(x=>row(`<span class="tiny">${temp(x.s)} · ${esc(x.t)}</span>`,(x.m>=0?'+':'−')+money(Math.abs(x.m)),x.m>=0?'gold':'')).join(''):'<p class="tiny muted">Todavía no hay movimientos.</p>');
 return h}
function pintar(){const b=document.getElementById('board');if(!b||!C())return;let d=document.getElementById('e5Fin');
 if(!d){d=document.createElement('div');d.id='e5Fin';d.className='card m12-panel';const fin=document.getElementById('m12Fin');if(fin&&fin.parentNode)fin.parentNode.insertBefore(d,fin.nextSibling);else b.appendChild(d)}
 d.innerHTML=panelHTML();try{window.MC12&&MC12.icons&&MC12.icons(d)}catch(e){}}
function enganchar(){const o=window.renderBoard;if(typeof o!=='function'||o.__e5)return;const f=function(){const r=o.apply(this,arguments);try{pintar()}catch(e){console.warn('MC E5 finanzas',e)}return r};f.__e5=1;window.renderBoard=f}
if(document.readyState==='complete')setTimeout(enganchar,0);else window.addEventListener('load',()=>setTimeout(enganchar,0));
window.MCE5=Object.assign(window.MCE5||{},{E5,leer,base,mover,agendarCuotas,agendarBonos,capacidad,deuda,pendientes,cerrar,clausulasIA,pagarClausulaUsuario,salida,panelHTML,pintar,temp,money,esc});
})();
