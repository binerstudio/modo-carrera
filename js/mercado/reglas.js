/* ===== MODO CARRERA 12.9 · ETAPA 5 · REGLAS DEL MERCADO =====
   Funciones puras que usan tu mercado (js/mercado/negociacion.js) y el de la IA (js/ia/mercado-ia.js),
   así las dos partes negocian con las mismas reglas.
   - pedido(): lo que pide el club vendedor según el valor del jugador, el contrato que le queda, su importancia
     en el plantel (clave / titular / suplente) y la economía del club.
   - valorOferta(): cuánto vale una oferta para el vendedor (las cuotas valen menos que el contado, los bonos se
     cuentan a medias y el porcentaje de futura venta suma algo).
   - responder(): acepta, rechaza o contraoferta. Máximo 3 rondas: en la tercera acepta o rechaza.
   - clausula(): cláusula de rescisión ESTIMADA de un jugador de la IA (no hay datos reales de cláusulas).
   - comision(): comisión del agente (porcentaje estimado del traspaso).
   - jugador(): (rechazo seguro: club 14 puntos más débil para un GRL 76+, o 9 puntos para un GRL 84+)
     el jugador negocia sueldo, años, cláusula y comisión aparte; puede rechazar por club chico,
     poca titularidad o sueldo bajo.
   No usan Math.random: el azar viene de una semilla (mismo resultado con los mismos datos). */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const R2=x=>Math.round((+x||0)*100)/100;
const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const XI={POR:1,DEF:4,MED:3,DEL:3};
const RONDAS=3;
/* importancia del jugador en su plantel: los 3 mejores del club son "clave"; los del once ideal, "titular" */
function importancia(o,plantel){const n=fold(o.name),P=(plantel||[]).slice();if(!P.some(x=>fold(x.name)===n))P.push(o);
 const top=P.slice().sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,3);if(top.some(x=>fold(x.name)===n))return 'clave';
 const L=P.filter(x=>x.pos===o.pos).sort((a,b)=>(b.rating||0)-(a.rating||0));const i=L.findIndex(x=>fold(x.name)===n);
 return i>=0&&i<(XI[o.pos]||1)?'titular':'suplente'}
const F_IMP={clave:1.3,titular:1.12,suplente:.92};
const fContrato=a=>a<=1?.7:a===2?.9:a>=4?1.08:1;
/* economía del vendedor: con deuda necesita vender (pide menos); con mucha caja no tiene apuro (pide más) */
const fEco=(b,sv)=>b<0?.85:b>Math.max(1,sv)*.4?1.08:1;
function ecoTexto(b,sv){return b<0?'necesita vender':b>Math.max(1,sv)*.4?'holgada (no tiene apuro)':'estable'}
function pedido(o){const v=Math.max(.05,+o.valor||0),n=.96+(hash(o.semilla||'')%9)/100;
 const A=v*fContrato(+o.anos||3)*(F_IMP[o.imp]||1)*fEco(+o.b||0,+o.sv||0)*n;
 return{A:R2(Math.max(.05,A)),min:R2(Math.max(.05,A*(o.imp==='clave'?.97:.9)))}}
/* reparto de un monto en cuotas: la primera se paga al firmar */
function partes(monto,n){n=clamp(+n||1,1,3);if(n===1)return[R2(monto)];const p=n===2?[.5,.5]:[.34,.33,.33];const a=p.map(x=>R2(monto*x));a[0]=R2(monto-a.slice(1).reduce((s,x)=>s+x,0));return a}
function valorOferta(of,o){const n=clamp(+of.cuotas||1,1,3),d=(+o.b||0)<0?.88:.94;let v=0;partes(+of.monto||0,n).forEach((x,k)=>{v+=x*Math.pow(d,k)});
 (of.bonos||[]).forEach(x=>{v+=(+x.monto||0)*.45});
 v+=clamp(+of.fv||0,0,50)/100*Math.max(0,+o.valor||0)*.5;
 return R2(v)}
/* respuesta del vendedor en la ronda r (1..3) a una oferta que para él vale E */
function responder(E,pide,min,r){
 if(E>=pide-1e-9)return{t:'acepta'};
 if(r>=RONDAS)return E>=min-1e-9?{t:'acepta'}:{t:'rechaza',final:true,motivo:'Última ronda: la oferta no llega a lo mínimo que acepta'};
 if(E<pide*.55)return{t:'rechaza',final:false,motivo:'La oferta está muy lejos de lo que pide'};
 return{t:'contra',pide:R2(Math.max(min,pide-(pide-E)*.35))}}
/* cláusula de rescisión estimada (entre 2 y 3 veces el valor; más alta en los jóvenes) */
function clausula(o){const v=Math.max(.5,+o.value||0),h=hash('cl'+fold(o.name));return R2(v*(2+(h%5)*.25)*((+o.age||26)<=23?1.2:1))}
/* comisión del agente: entre 5 % y 10 % del traspaso (en un libre, media temporada de sueldo) */
function comisionPct(o){return 5+hash('ag'+fold(o.name))%6}
function comision(o,fee){return R2(fee>0?fee*comisionPct(o)/100:Math.max(.02,(+o.wage||.3)*.5))}
/* ---------- el jugador ---------- */
function anosPreferidos(age){age=+age||26;return age<=23?[4,5]:age<=29?[3,5]:age<=32?[2,3]:[1,2]}
/* rol que tendría en el club que lo compra: según cuántos mejores hay en su puesto */
function rol(o,plantelDestino){const mejores=(plantelDestino||[]).filter(x=>x.pos===o.pos&&fold(x.name)!==fold(o.name)&&(+x.rating||0)>(+o.rating||0)).length;
 const t=XI[o.pos]||1;return mejores<t?'titular':mejores<t+1?'rotación':'suplente'}
/* lo que pide el jugador. nivel = fuerza de su club actual y del club que lo quiere (misma escala) */
function pideJugador(o,{nivelOrigen,nivelDestino,rolDestino}){const W=Math.max(.1,+o.wage||.3),diff=(+nivelDestino||60)-(+nivelOrigen||60);
 const f=1.1+(diff<0?-diff*.03:0)+(rolDestino==='suplente'?.15:rolDestino==='rotación'?.05:0);
 return{sueldo:R2(Math.max(.1,W*f)),anos:anosPreferidos(o.age),comision:comisionPct(o)}}
/* decisión del jugador en la ronda r. ctx: {nivelOrigen,nivelDestino,rolDestino}; of: {sueldo,anos,clausula,comision(%)} */
function jugador(o,ctx,of,r){const diff=(+ctx.nivelDestino||60)-(+ctx.nivelOrigen||60),rt=+o.rating||60,pd=pideJugador(o,ctx);
 if((diff<=-14&&rt>=76)||(diff<=-9&&rt>=84))return{t:'rechaza',final:true,motivo:'No quiere jugar en un club de ese nivel (club chico para él)'};
 if(ctx.rolDestino==='suplente'&&rt>=80)return{t:'rechaza',final:true,motivo:'Quiere ser titular y en tu plantel sería suplente'};
 const S=(+of.sueldo||0)/pd.sueldo,a=+of.anos||3,v=Math.max(.5,+o.value||0),cr=(+of.clausula||0)/v;
 const motivos=[];let sc=(S-1)*2;
 if(S<.9)motivos.push('el sueldo es bajo');
 if(a<pd.anos[0]||a>pd.anos[1]){sc-=.08;motivos.push(`prefiere ${pd.anos[0]===pd.anos[1]?pd.anos[0]:pd.anos[0]+' a '+pd.anos[1]} temporadas`)}
 if(!of.clausula){sc-=.05}else if(cr<1.5)sc+=.06;else if(cr>5){sc-=.12;motivos.push('la cláusula es muy alta')}else if(cr>3){sc-=.06;motivos.push('la cláusula es alta')}
 const dc=pd.comision-(+of.comision||0);if(dc>0){sc-=dc*.03;if(dc>=2)motivos.push(`su agente pide ${pd.comision} % de comisión`)}
 if(ctx.rolDestino==='titular')sc+=.05;else if(ctx.rolDestino==='suplente'){sc-=.1;motivos.push('tendría poca titularidad')}
 if(diff<-6)motivos.push('tu club es de menor nivel que el suyo');
 if(sc>=0&&S>=.9)return{t:'acepta'};
 if(r>=RONDAS)return{t:'rechaza',final:true,motivo:'No le convienen las condiciones'+(motivos.length?': '+motivos.join(', '):'')};
 /* contrapropuesta: el sueldo que compensa lo que no le gusta */
 const falta=Math.max(0,-(sc-(S-1)*2));const sueldo=R2(Math.max(pd.sueldo,pd.sueldo*(1+falta/2)));
 return{t:'contra',sueldo,anos:clamp(a,pd.anos[0],pd.anos[1]),comision:pd.comision,motivo:motivos.join(', ')||'quiere mejores condiciones'}}
window.MCReglas={RONDAS,XI,importancia,pedido,partes,valorOferta,responder,clausula,comision,comisionPct,anosPreferidos,rol,pideJugador,jugador,ecoTexto,fold,hash,R2};
})();
