/* ===== MODO CARRERA 12.8 · ETAPA 4 · ESTADO FÍSICO Y LESIONES DE LOS CLUBES DE LA IA =====
   Antes, cada partido de un club de la IA arrancaba con su mejor once descansado. Ahora el cansancio y las lesiones
   persisten entre partidos:
   - Se guardan en career.world.estIA = {s: temporada, t: fecha, c: {club: {jugador: [físico, fechas de baja, fecha]}}}.
     Solo se guardan los lesionados y los que tienen menos de 88 % (con 88 % o más se recuperan del todo en una
     fecha, así que se los toma como descansados y no ocupan lugar en la partida).
   - Recuperación: +12 de físico por fecha de liga (igual que tu plantel) y una fecha menos de baja por fecha.
   - Desgaste: el que juega pierde lo mismo que un jugador tuyo (4 + 9 por cada 90 minutos, más 0 a 3), con piso 42.
   - Lesiones: las que pasan en el partido (motor v2 en los partidos de la IA de tu liga; v3 o v2 en los tuyos).
   - Al armar el equipo, el club de la IA ROTA: deja afuera a los lesionados y le resta valor al cansado, así que un
     suplente fresco puede ganarle el lugar a un titular agotado. Nunca queda sin arquero ni con menos de 11 si tiene
     jugadores sanos; si no le alcanza, completa con el menos lesionado (no juega con 10 por falta de datos).
   - Al empezar cada temporada todos arrancan descansados (pretemporada).
   Alcance: los clubes de tu liga (sus partidos se juegan con el v2) y tus rivales de copa. Las demás ligas y los cruces
   de copa entre clubes de la IA siguen con el modelo rápido de resultados, que no usa jugadores. */
(function(){
'use strict';
if(typeof window.mcWorld!=='function')return;
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const hash=window.mcHash||(s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0});
const CAR=()=>(typeof career!=='undefined'&&career)?career:null;
const RECUPERA=12,PISO=42,FRESCO=95,GUARDA=88;   /* con 88 % o más se recupera del todo en una fecha: no se guarda */
function E(){const c=CAR(),w=mcWorld();let e=w.estIA;
 if(!e||typeof e!=='object'||e.s!==c.season||!e.c){e=w.estIA={s:c.season,t:0,c:{}}}
 return e}
/* estado actual de un club (con la recuperación de las fechas que pasaron desde el último partido) */
function leer(club){const e=E(),C=e.c[club],out={};if(!C)return out;
 for(const n in C){const x=C[n];if(!Array.isArray(x))continue;const d=Math.max(0,e.t-(+x[2]||0));
  out[n]={f:Math.min(100,(+x[0]||100)+RECUPERA*d),l:Math.max(0,(+x[1]||0)-d)}}
 return out}
function escribir(club,st){const e=E(),C={};
 for(const n in st){const x=st[n];if(x.l>0||x.f<GUARDA)C[n]=[Math.round(x.f),x.l|0,e.t]}
 if(Object.keys(C).length)e.c[club]=C;else delete e.c[club]}
window.mcIAEstado=function(club){const c=CAR();if(!c||club===c.club)return{};try{return leer(club)}catch(e){return{}}};

/* plantel de un club de la IA listo para un partido: filas de rosterFor reordenadas (once 4-3-3, banco, reservas)
   con r.fit (físico para el motor) y r.les (fechas de baja). Los lesionados quedan al final. */
window.mcIAPlantel=function(club,rows){
 const c=CAR();if(!c||!Array.isArray(rows)||club===c.club||rows.length<11)return rows;
 try{
  const st=leer(club),sano=[],baja=[];
  rows.forEach(r=>{const x=st[fold(r[0])],o=r.slice();o.fit=x?Math.min(FRESCO,x.f):FRESCO;o.les=x?x.l:0;(o.les>0?baja:sano).push(o)});
  baja.sort((a,b)=>a.les-b.les||b[2]-a[2]);
  /* nunca sin arquero ni con menos de 11: si faltan sanos, se completa con el de baja más corta */
  if(!sano.some(o=>o[1]==='POR')){const i=baja.findIndex(o=>o[1]==='POR');if(i>=0)sano.push(baja.splice(i,1)[0])}
  while(sano.length<11&&baja.length)sano.push(baja.shift());
  /* rotación de la IA: el cansado vale menos para elegir el once (no cambia su GRL) */
  const val=o=>o[2]-Math.max(0,80-o.fit)*.5;
  const tmp=sano.map(o=>{const t=[o[0],o[1],val(o)];t.ref=o;return t});
  const ord=(window.mcOrderXI?mcOrderXI(tmp):tmp.sort((a,b)=>b[2]-a[2])).map(t=>t.ref);
  return ord.concat(baja)}
 catch(e){console.warn('MC estado IA',e);return rows}};

/* después de un partido: desgaste de los que jugaron y lesiones nuevas.
   jug: [[nombre, minutos]...]  les: [[nombre, fechas]...] */
window.mcIARegistrar=function(club,jug,les,fecha){
 const c=CAR();if(!c||!club||club===c.club)return;
 const e=E(),ahora=e.t;if(fecha!=null&&fecha>=0&&fecha<=ahora)e.t=fecha;   /* se registra en la fecha en que se jugó */
 try{const st=leer(club);
  (jug||[]).forEach(([n,min])=>{if(!(min>0))return;const k=fold(n),x=st[k]||(st[k]={f:100,l:0});
   x.f=Math.max(PISO,x.f-Math.round(4+min/90*9)-(hash(k+'|'+e.t+'|'+c.season)%4))});
  (les||[]).forEach(([n,fechas])=>{const k=fold(n),x=st[k]||(st[k]={f:100,l:0});x.l=Math.max(x.l,Math.max(1,fechas|0));x.f=Math.min(x.f,75)});
  escribir(club,st)}
 catch(err){console.warn('MC estado IA',err)}
 finally{e.t=ahora}};

/* pretemporada: al empezar la temporada todos descansados (se borra el estado anterior) */
const oStart=window.mcSeasonStart;
window.mcSeasonStart=function(c){try{const w=mcWorld();w.estIA={s:c.season,t:0,c:{}}}catch(e){}
 return typeof oStart==='function'?oStart.apply(this,arguments):undefined};
/* cada fecha de liga cuenta para la recuperación */
const oAfter=window.mcAfterRound;
window.mcAfterRound=function(c,L){
 try{if(CAR())E().t++}catch(e){}
 return typeof oAfter==='function'?oAfter.apply(this,arguments):undefined};

/* tu partido: el rival se lleva su desgaste y sus lesiones */
const oFinish=window.finishMatch;
if(typeof oFinish==='function')window.finishMatch=function(){
 const m=typeof match!=='undefined'?match:null,ya=!!(m&&m.done);let t0=null;try{if(CAR())t0=E().t}catch(e){}
 const r=oFinish.apply(this,arguments);
 try{if(m&&!ya&&m.done&&m.away){
  const jug=Object.values(m.pst||{}).filter(s=>s.side==='r').map(s=>[s.name,s.on||0]);
  const les=(m.injRiv||[]).map(([n,w])=>[n,w]);
  mcIARegistrar(m.away,jug,les,t0)}}
 catch(e){console.warn('MC estado IA',e)}
 return r};
})();
