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
 /* la cinta de la cancha (10 cuadros por segundo) queda solo en memoria para que el 2D la dibuje: no se guarda en la partida */
 const TV={cuadros:[],eventos:[],puestos:null,formato:null,partes:{},fin:{},tMotor:0,eOwn,terminado:false};
 const vivo=V3.enVivo(eOwn===0?own:riv,eOwn===0?riv:own,{semilla:(m.v2&&m.v2.semilla?m.v2.semilla:'mc')+'|v3',cinta:false,cintaCada:1,neutral:m.venue==='n',
  arbitro:arb?{severidad:arb.severidad,precision:arb.precision}:undefined,dtExterno:[true,true],alCuadro:(t,f)=>{TV.cuadros.push({t,d:Int16Array.from(f)})}});
 TV.puestos=vivo.puestos();TV.formato=vivo.formato();
 const S={vivo,eOwn,parte:0,finParte1:false,finH:0,hist:[],tac:JSON.stringify(tacO),tv:TV};
 if(m.ver&&m.ver.modo==='mejores')prepararClips(S,m.ver.tipos);
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

/* con el v3 el reloj del juego no marca el ritmo (lo marca el 2D con la cinta): el motor simula un minuto cada 40 ms
   para estar siempre adelante de lo que se ve (el 2D lo frena cuando ya tiene 15 minutos de ventaja) */
window.MCMsPorMinuto=m=>m&&m.v3&&ESTADO.get(m)?40:0;
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

/* con el 2D mirando, el juego muestra lo que el 2D ya mostró: el motor va adelante (para tener la cinta), pero el reloj,
   las estadísticas y el fin de cada tiempo esperan a que el 2D llegue (el marcador y el relato los filtra el 2D por t3).
   Sin 2D (o con "Simular hasta el final") no se espera. */
function vistoDe(m){try{return window.MC2D&&MC2D.vistoV3?MC2D.vistoV3(m):null}catch(e){return null}}
function publicar(m,S,todo){const v=todo?1e15:vistoDe(m);if(v==null||!S.hist.length)return;let h=S.hist[0];for(const x of S.hist){if(x.t>v)break;h=x}
 m.minute=h.minute;m.lbl=h.lbl;Object.assign(m,h.st)}
function finVisto(m,S,half){const v=vistoDe(m),ok=v==null||S.tv.fin[half]==null||v>=S.tv.fin[half]-3;if(ok)publicar(m,S,true);return ok}
function minuto(m,API,S){
 const c=m.clock,half=c.half,V=S.vivo;
 if(V.terminado){publicar(m,S);return finVisto(m,S,2)}
 if(S.finH===half){publicar(m,S);return finVisto(m,S,half)}   // el motor ya terminó este tiempo: se espera al 2D
 if(S.parte!==half){
  if(half===1&&S.parte===0){V.empezar(1);S.parte=1;S.tv.partes[1]=V.t()}
  else if(half===2&&S.parte===1){if(!V.empezar(2)){traducir(m,API,S,V.eventosNuevos());S.tv.terminado=true;return true}S.parte=2;S.tv.partes[2]=V.t()}
 }
 sincronizar(m,S);
 const fin=V.minuto();
 const rj=V.reloj();c.base=rj.base;c.x=rj.extra;m.minute=c.base+c.x;m.moments++;m.tick++;if(API.label)m.lbl=API.label(m);
 if(rj.descuento!=null)m.extra[half]=rj.descuento;
 traducir(m,API,S,V.eventosNuevos());
 S.tv.tMotor=V.t();if(fin){S.tv.fin[half]=V.t();if(V.terminado){S.tv.terminado=true;if(S.tv.clipsPend)armarClips(S,true)}}
 if(S.tv.clipsPend)armarClips(S,false);
 /* en memoria solo lo que el 2D todavía no vio (si el 2D no está mirando, los últimos 20 minutos); tope de memoria: 60 minutos */
 {const C=S.tv.cuadros;if(C.length>12000){const mira=S.tv.vistoT&&Date.now()-S.tv.vistoT<5000,lim=mira?S.tv.visto-300:C[C.length-1].t-12000;let k=0;while(k<C.length&&C[k].t<lim)k++;if(C.length-k>36000)k=C.length-36000;if(k)C.splice(0,k)}}
 actualizarStats(m,S);
 S.hist.push({t:V.t(),minute:m.minute,lbl:m.lbl,st:{shotsH:m.shotsH,shotsA:m.shotsA,onH:m.onH,onA:m.onA,cornersH:m.cornersH,cornersA:m.cornersA,foulsH:m.foulsH,foulsA:m.foulsA,offH:m.offH,offA:m.offA,xgH:m.xgH,xgA:m.xgA,savesH:m.savesH,savesA:m.savesA,pos:m.pos}});
 /* minutos jugados */
 for(const side of ['o','r'])for(const e of listaDe(m,side)){const st=API.ps(m,e,side);if(st)st.on++}
 /* cambios planeados del rival y automáticos propios (igual que en v1/v2) */
 if(half===2&&!fin){
  if(m.rivSubPlan&&m.rivSubPlan.length&&c.base>=m.rivSubPlan[0]){m.rivSubPlan.shift();API.subR(m)}
  if(m.autoSubs&&m.ownAutoDone<3&&c.base>=m.ownAutoPlan[m.ownAutoDone]){m.ownAutoDone++;API.subO(m)}
  sincronizar(m,S);
 }
 if(fin&&half===1)S.finParte1=true;
 if(fin||V.terminado)S.finH=half;
 publicar(m,S);
 return(fin||V.terminado)&&finVisto(m,S,V.terminado?2:half);
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
  S.tv.eventos.push(x);if(S.tv.clipsPend)marcarClip(S,x);
  const n0=m.events.length;try{traducir1(m,API,S,x)}finally{for(let k=n0;k<m.events.length;k++)if(m.events[k].t3==null)m.events[k].t3=x.t}   // t3: cuándo pasó en la cancha (el 2D lo muestra recién ahí)
 }
}
function traducir1(m,API,S,x){
 {
  if(x.equipo==null)return;
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
/* ---------- "Mejores jugadas": mientras se simula, se guardan solo los recortes de la cinta de las jugadas candidatas ----------
   Se eligen por importancia (como máximo MAX_CLIPS, después ordenados por minuto), siempre dentro de los tipos marcados:
   goles > ocasiones claras (remate con xG alto, palo, atajada difícil) > penales > tiros libres con remate > córners SOLO si
   terminan en remate > faltas y tarjetas > lesiones y cambios > atajadas fáciles.
   Cada recorte lleva sus cuadros, sus eventos y quién ocupaba cada puesto. */
const MAX_CLIPS=12,PRI={goles:6,ocasion:5,penales:4,tirosLibres:3,corners:2,faltas:1.5,cambios:1,atajadas:.8};
function prepararClips(S,tipos){const T=S.tv;T.clips=[];T.cand=[];T.clipsPend=[];T.tipos=new Set(tipos||[]);T.pend={};T.slots={slot:T.puestos.map(p=>p.clave),sal:[null,null,null],hist:[]}}
function marcarClip(S,x){const T=S.tv,ty=T.tipos,P=T.pend,add=(a,b,tipo,pri)=>{const L=T.clipsPend[T.clipsPend.length-1];
  if(L&&a<=L.b+20){L.b=Math.max(L.b,b);L.a=Math.min(L.a,a);if(pri>L.pri){L.tipo=tipo;L.t=x.t;L.pri=pri}return}
  T.clipsPend.push({a,b,tipo,pri,t:x.t,slot:T.slots.slot.slice(),sal:T.slots.sal.slice()})};
 /* córner o tiro libre: entra solo si ese equipo remata en los 15 s siguientes */
 if(P.libre&&x.t-P.libre.t>150)P.libre=null;
 if(P.libre&&x.tipo==='remate'&&!x.penal&&x.equipo===P.libre.e){add(P.libre.t-30,x.t+30,P.libre.tipo,PRI[P.libre.tipo]+Math.min(.5,x.xg||0));P.libre=null}
 switch(x.tipo){
  case 'gol':if(ty.has('goles'))add(x.t-120,x.t+(x.festejo||40)+10,'goles',PRI.goles);break;
  case 'penal':P.penal=x.t;break;
  case 'remate':if(x.penal&&P.penal!=null){if(ty.has('penales'))add(P.penal-10,x.t+40,'penales',PRI.penales);P.penal=null}
   else{P.ultRem={t:x.t,xg:x.xg||0};if(x.xg>=.25&&ty.has('peligro'))add(x.t-80,x.t+25,'peligro',PRI.ocasion+x.xg)}break;
  case 'palo':if(ty.has('peligro'))add(x.t-80,x.t+30,'peligro',PRI.ocasion+.4);break;
  case 'atajada':if(!x.penal&&ty.has('atajadas')){const r=P.ultRem&&x.t-P.ultRem.t<30?P.ultRem.xg:0,dif=(x.p!=null&&x.p<.85)||r>=.2;
   add(x.t-60,x.t+25,'atajadas',dif?PRI.ocasion+Math.max(r,x.p!=null?1-x.p:0):PRI.atajadas)}break;
  case 'tiro_libre':if(x.modo&&x.modo!=='pase'&&ty.has('tirosLibres'))P.libre={e:x.equipo,t:x.t,tipo:'tirosLibres'};break;
  case 'corner':if(ty.has('corners'))P.libre={e:x.equipo,t:x.t,tipo:'corners'};break;
  case 'amarilla':case 'roja':if(ty.has('faltas'))add(x.t-60,x.t+40,'faltas',PRI.faltas+(x.tipo==='roja'?.3:0));break;
  case 'falta':if(x.gravedad&&x.gravedad!=='normal'&&ty.has('faltas'))add(x.t-30,x.t+30,'faltas',PRI.faltas);break;
  case 'lesion':if(ty.has('cambios'))add(x.t-30,x.t+70,'cambios',PRI.cambios);break;
  case 'cambio':if(ty.has('cambios'))add(x.t-10,x.t+90,'cambios',PRI.cambios);break;
 }
 if(x.tipo==='cambio'){if(x.salienteSlot>=0)T.slots.sal[x.salienteSlot]=x.saleClave;T.slots.slot[x.sid]=x.clave}   // después: el recorte arranca con el que sale
}
function armarClips(S,todo){const T=S.tv,c=T.cuadros,lim=todo?1e12:T.tMotor;
 while(T.clipsPend.length&&(T.clipsPend[0].b<=lim||todo)){const P=T.clipsPend.shift();
  const cu=c.filter(q=>q.t>=P.a&&q.t<=P.b);if(cu.length<10)continue;
  const ev=T.eventos.filter(e=>e.t>=P.a&&e.t<=P.b);
  const h=T.partes[2]!=null&&P.t>=T.partes[2]?2:1,k=Math.floor((P.t-(T.partes[h]||0))/600),min=k<45?String((h===1?0:45)+k+1):((h===1?45:90)+'+'+(k-44));
  T.cand.push({a:cu[0].t,b:cu[cu.length-1].t,tipo:P.tipo,pri:P.pri,min,cuadros:cu,eventos:ev,slot:P.slot,sal:P.sal})}
 /* los más importantes (a igual importancia, el primero), mostrados en orden de minuto */
 const el=T.cand.slice().sort((p,q)=>q.pri-p.pri||p.a-q.a).slice(0,MAX_CLIPS);T.clips=el.sort((p,q)=>p.a-q.a);
 T.candidatos=T.cand.map(q=>({tipo:q.tipo,pri:+q.pri.toFixed(2),a:q.a,elegido:el.includes(q)}))}
/* para el 2D: la cinta en vivo del partido v3 (o null si el partido no es v3) */
window.MCV3TV={de:m=>{const S=m&&m.v3?ESTADO.get(m):null;return S?S.tv:null},
 publicar:m=>{const S=m&&m.v3?ESTADO.get(m):null;if(S&&!m.done)publicar(m,S)},
 /* el menú elige "Mejores jugadas" antes de simular: desde ahí se guardan los recortes */
 mejores:(m,tipos)=>{const S=m&&m.v3?ESTADO.get(m):null;if(!S)return false;prepararClips(S,tipos);return true}};

/* ---------- Configuración: agregar el v3 a "Motor de partidos" ---------- */
try{
 if(typeof OP!=='undefined'&&Array.isArray(OP.motor)&&!OP.motor.some(x=>x[0]==='v3')){
  OP.motor.push(['v3','En cancha (v3)']);
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
