/* ===== MODO CARRERA · CONEXIÓN DEL MOTOR v3 CON EL JUEGO (etapa 5) =====
   - Opcional: Configuración → General → Motor de partidos → "Simulado en cancha (v3)".
   - Solo el partido del usuario se juega con el v3; el resto de la fecha y todo lo demás sigue igual que con el v2
     (por eso la carrera queda internamente en v2 y se marca career.v3 = true).
   - El partido avanza de a un minuto, en la cancha (MCMotorV3.enVivo), al ritmo del reloj del juego: los cambios y la
     táctica que elige el usuario durante el partido entran en la cancha al instante.
   - Lo que pasa en la cancha se traduce a lo que ya usa la pantalla del partido: marcador, relato (goles con su tipo,
     atajadas, tarjetas, lesiones, penales, offsides), estadísticas, jugadores y valoraciones. Las sanciones, lesiones
     y el estado físico después del partido los sigue calculando el juego como siempre.
   - No toca el motor v1, el v2 ni su conexión, ni las partidas guardadas (career.v3 es un dato nuevo y opcional). */
(function(){
'use strict';
if(!window.MCMotor||!window.MCMotorV3||!window.MCAtributos)return;
const V3=window.MCMotorV3;
const ESTADO=new WeakMap();          // match → estado del partido v3 (no se guarda: vive mientras dura el partido)
const esV3=c=>!!(c&&c.v3&&c.motor==='v2');
window.mcEsV3=esV3;

/* ---------- armado de los equipos para la cancha ---------- */
const crudoPropio=p=>({name:p.name,pos:p.pos,grl:+p.rating||+p.grl||60,age:p.age,fit:p.fitness==null?90:p.fitness,atributos:p.atributos,clave:'o'+p.id});
const crudoRival=e=>({name:e.name,pos:e.pos,grl:+e.r||60,age:e.age,clave:e.key});
const crudoDe=(e,side)=>side==='o'?crudoPropio(e.p):crudoRival(e);
function preparar(m){
 const eOwn=m.venue==='a'?1:0,tacO=window.mcOwnTac?mcOwnTac():{};
 const own={name:m.home,tac:tacO,players:m.own.map(e=>crudoPropio(e.p)).concat((m.ownBench||[]).map(crudoPropio))};
 const riv={name:m.away,tac:m.tacR,players:m.riv.map(crudoRival).concat((m.rivBench||[]).map(crudoRival))};
 const arb=m.v2&&m.v2.arbitro;
 const vivo=V3.enVivo(eOwn===0?own:riv,eOwn===0?riv:own,{semilla:(m.v2&&m.v2.semilla?m.v2.semilla:'mc')+'|v3',cinta:false,neutral:m.venue==='n',
  arbitro:arb?{severidad:arb.severidad,precision:arb.precision}:undefined,dtExterno:[true,true]});
 const S={vivo,eOwn,parte:0,finParte1:false,tac:JSON.stringify(tacO)};
 ESTADO.set(m,S);m.v3={version:V3.VERSION,local:eOwn===0?'propio':'rival'};
 return S;
}

/* al crear el partido del usuario: si la carrera usa el v3, se arma la cancha */
const oMatch=window.createMatch;
if(typeof oMatch==='function')window.createMatch=function(){
 const r=oMatch.apply(this,arguments);
 try{if(typeof career!=='undefined'&&esV3(career)&&match&&match.v2){preparar(match);
  if(window.mcMatchEv)mcMatchEv(match,'🏟 MOTOR v3','Este partido se juega simulado en la cancha: 22 jugadores y la pelota, minuto a minuto.',false,'')}
 }catch(e){console.warn('MC motor v3',e);if(match){delete match.v3;ESTADO.delete(match)}}
 return r};

/* ---------- cada minuto: el v2 le pasa la posta al v3 si el partido es v3 ---------- */
const oMinuto=window.MCMotor.minuto;
window.MCMotor.minuto=function(m,API){
 const S=m&&m.v3?ESTADO.get(m):null;
 if(!S)return oMinuto.apply(this,arguments);
 try{return minuto(m,API,S)}catch(e){console.warn('MC motor v3',e);return S.vivo.terminado}   // un error del relato no corta el partido
};
const ladoDe=(S,e)=>e===S.eOwn?'o':'r';
const listaDe=(m,side)=>side==='o'?m.own:m.riv;
function entrada(m,side,clave,nombre){
 const L=listaDe(m,side);let e=L.find(x=>x.key===clave);
 if(!e)e=(side==='o'?(m.ownBench||[]).map(p=>({p,key:'o'+p.id,g:p.pos})):(m.rivBench||[])).find(x=>x.key===clave);
 if(e)return e;const nom=nombre||'un jugador';
 return side==='o'?{key:clave||('x'+nom),p:{name:nom,pos:'MED'},g:'MED'}:{key:clave||('x'+nom),name:nom,pos:'MED',g:'MED'};
}
const nombreDe=e=>e?(e.p?e.p.name:e.name):'';
const arqueroDe=(m,side)=>listaDe(m,side).find(e=>e.g==='POR')||listaDe(m,side)[0];
function defensorDe(m,side){const L=listaDe(m,side).filter(e=>e.g==='DEF');return L.length?L[(m.minute||0)%L.length]:listaDe(m,side)[0]}   // sin azar: no mueve el azar del juego
const TIPO={penal:'pen',tirolibre:'tirolibre',corner:'corner',cabezazo:'cabezazo',centro:'centro',filtrado:'filtrado',contra:'contra',afuera:'afuera',individual:'individual',rebote:'rebote',area:'area'};

/* los cambios y salidas que decidió el juego (usuario, DT, lesiones, expulsiones) se reflejan en la cancha */
function sincronizar(m,S){
 for(const side of ['o','r']){
  const e=side==='o'?S.eOwn:1-S.eOwn,L=listaDe(m,side),enJuego=new Set(L.map(x=>x.key)),enCancha=S.vivo.enCancha(e);
  const salen=enCancha.filter(k=>!enJuego.has(k)),entran=L.filter(x=>!enCancha.includes(x.key));
  for(const k of salen){const n=entran.shift();if(n)S.vivo.cambio(e,k,crudoDe(n,side),'cambio');else S.vivo.retirar(e,k)}
 }
 /* táctica propia */
 const t=window.mcOwnTac?mcOwnTac():null,js=t?JSON.stringify(t):'';
 if(t&&js!==S.tac){S.tac=js;S.vivo.tactica(S.eOwn,t)}
}

function minuto(m,API,S){
 const c=m.clock,half=c.half,V=S.vivo;
 if(V.terminado)return true;
 if(S.parte!==half){
  if(half===1&&S.parte===0){V.empezar(1);S.parte=1}
  else if(half===2&&S.parte===1){if(!V.empezar(2)){traducir(m,API,S,V.eventosNuevos());return true}S.parte=2}
 }
 sincronizar(m,S);
 const fin=V.minuto();
 const rj=V.reloj();c.base=rj.base;c.x=rj.extra;m.minute=c.base+c.x;m.moments++;m.tick++;if(API.label)m.lbl=API.label(m);
 if(rj.descuento!=null)m.extra[half]=rj.descuento;
 traducir(m,API,S,V.eventosNuevos());
 actualizarStats(m,S);
 /* minutos jugados */
 for(const side of ['o','r'])for(const e of listaDe(m,side)){const st=API.ps(m,e,side);if(st)st.on++}
 /* cambios planeados del rival y automáticos propios (igual que en v1/v2) */
 if(half===2&&!fin){
  if(m.rivSubPlan&&m.rivSubPlan.length&&c.base>=m.rivSubPlan[0]){m.rivSubPlan.shift();API.subR(m)}
  if(m.autoSubs&&m.ownAutoDone<3&&c.base>=m.ownAutoPlan[m.ownAutoDone]){m.ownAutoDone++;API.subO(m)}
  sincronizar(m,S);
 }
 if(fin&&half===1)S.finParte1=true;
 return fin||V.terminado;
}

function actualizarStats(m,S){
 const st=S.vivo.st(),o=S.eOwn,r=1-o;
 m.shotsH=st.remates[o];m.shotsA=st.remates[r];m.onH=st.alArco[o];m.onA=st.alArco[r];
 m.cornersH=st.corners[o];m.cornersA=st.corners[r];m.foulsH=st.faltas[o];m.foulsA=st.faltas[r];
 m.offH=st.offsides[o];m.offA=st.offsides[r];m.xgH=st.xg[o];m.xgA=st.xg[r];m.savesH=st.atajadas[o];m.savesA=st.atajadas[r];
 const p0=S.vivo.posesion();m.pos=o===0?p0:100-p0;
}

function traducir(m,API,S,evs){
 for(const x of evs){
  if(x.equipo==null)continue;
  const side=x.equipo>=0?ladoDe(S,x.equipo):'',otro=side==='o'?'r':'o';
  switch(x.tipo){
   case 'gol':{
    if(x.enContra){const quien=x.jugador||'un defensor',club=API.club(m,side);if(side==='o')m.h++;else m.a++;
     API.ev(m,(m.venue==='a')!==(side==='o')?'⚽ GOL LOCAL':'⚽ GOL VISITANTE',`¡GOOOL de ${club}! ${quien} la desvía y la mete en su propio arco. ${window.mcScoreTxt?mcScoreTxt(m):''}`,true,side);
     const GE=m.events[m.events.length-1];if(GE)GE.gol={autor:quien+' (en contra)',asist:null,tipo:'en_contra'};break}
    const sc=entrada(m,side,x.clave,x.jugador),as=x.asistClave?entrada(m,side,x.asistClave,x.asistencia):null;
    API.goal(m,side,sc,as,x.origen==='penal'?'pen':'jugada',TIPO[x.origen]||'area',nombreDe(defensorDe(m,otro)),nombreDe(arqueroDe(m,otro)));
    const GE=m.events[m.events.length-1];if(GE&&GE.gol)GE.gol.origen=x.origen;
    sincronizar(m,S);break}
   case 'atajada':{const sh=entrada(m,otro,null,x.rematador);const gk=entrada(m,side,x.clave,x.jugador);
    const st=API.ps(m,gk,side);if(st)st.sv++;
    if(!x.penal)API.miss(m,otro,'area',sh,defensorDe(m,side),gk,true);
    else API.ev(m,'🧤 PENAL ATAJADO',`¡${x.jugador} le ataja el penal a ${x.rematador}!`,true,side);break}
   case 'remate':if(!x.aPuerta&&x.xg>=.12){const sh=entrada(m,side,x.clave,x.jugador);API.miss(m,side,x.cabeza?'cabezazo':x.dist>=16.5?'afuera':'area',sh,defensorDe(m,otro),arqueroDe(m,otro),false)}break;
   case 'palo':API.ev(m,'🥅 PALO',`¡${x.jugador} la estrella en el palo!`,false,side);break;
   case 'falta':if(x.gravedad&&x.gravedad!=='normal')API.ev(m,'FALTA',`${x.jugador} comete una falta ${x.gravedad==='mano'?'con la mano en el área':x.gravedad}${x.sobre?' sobre '+x.sobre:''}.`,false,side);break;
   case 'amarilla':{const e=entrada(m,side,x.clave,x.jugador);API.yellow(m,e,side,x.motivo?`(${x.motivo})`:'',null);sincronizar(m,S);break}
   case 'roja':{if(x.motivo==='segunda amarilla')break;   // ya la cuenta la segunda amarilla
    const e=entrada(m,side,x.clave,x.jugador);API.red(m,e,side,x.motivo,null);sincronizar(m,S);break}
   case 'lesion':{const e=listaDe(m,side).find(y=>y.key===x.clave);if(e){API.injure(m,side,e);sincronizar(m,S)}break}
   case 'penal':API.ev(m,'⚠ PENAL',`Penal para ${API.club(m,side)}. ${x.jugador} toma la pelota.`,true,side);break;
   case 'offside':API.ev(m,'OFFSIDE',`${x.jugador} queda en posición adelantada: tiro libre indirecto.`,false,side);break;
   case 'tiro_libre':if(x.modo==='directo'||x.modo==='ensayada')API.ev(m,'TIRO LIBRE',`Tiro libre peligroso para ${API.club(m,side)}${x.barrera?' (barrera de '+x.barrera+')':''}. ${x.jugador} se prepara.`,false,side);break;
   case 'descuento':API.ev(m,'⏱ DESCUENTO',`El cuarto árbitro muestra ${x.minutos} ${x.minutos===1?'minuto':'minutos'} de descuento.`,false,'');break;
   case 'suspendido':API.ev(m,'⛔ PARTIDO SUSPENDIDO','Un equipo quedó con menos de 7 jugadores y el árbitro da por terminado el partido.',true,'');break;
  }
 }
}

/* ---------- Configuración: agregar el v3 a "Motor de partidos" ---------- */
try{
 if(typeof OP!=='undefined'&&Array.isArray(OP.motor)&&!OP.motor.some(x=>x[0]==='v3')){
  OP.motor.push(['v3','Simulado en cancha (v3, experimental)']);
  const oLoad=window.sLoad,oSave=window.sSave;
  if(typeof oLoad==='function')window.sLoad=function(){const r=oLoad.apply(this,arguments);try{if(typeof career!=='undefined'&&esV3(career))draft.motor='v3'}catch(e){}return r};
  if(typeof oSave==='function')window.sSave=function(){
   const want=(typeof draft!=='undefined'&&draft)?draft.motor:null,antes=typeof career!=='undefined'&&esV3(career);
   if(want==='v3')draft.motor='v2';             // por dentro la carrera sigue en v2 (el resto de la fecha no cambia)
   const r=oSave.apply(this,arguments);
   try{if(typeof career!=='undefined'&&career&&want){const ahora=want==='v3';if(ahora!==antes){career.v3=ahora;save();
     if(ahora&&window.xToast)xToast('Motor v3 (simulado en cancha) activado desde el próximo partido')}}
    if(want==='v3')draft.motor='v3'}catch(e){}
   return r};
 }
}catch(e){console.warn('MC motor v3 ajustes',e)}
})();
