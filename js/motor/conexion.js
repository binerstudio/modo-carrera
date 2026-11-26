/* ===== MODO CARRERA · CONEXIÓN DEL MOTOR v2 CON EL JUEGO =====
   12.7 (limpieza de motores): el motor v1 ya no existe y no hay que elegir motor en Configuración.
   - El partido del usuario se juega SIEMPRE con el v3 (js/motor/conexion-v3.js). El v2 arma el contexto de cada
     partido (clima, césped, árbitro, importancia, química, entrenador rival) que el v3 también usa, y queda de reserva:
     si un partido del usuario no se puede armar en la cancha (v3), se juega con el v2 y se avisa.
   - El v2 simula además los partidos entre clubes de la IA de tu liga (js/ia/partidos-ia.js).
   - Toda carrera queda con career.motor='v2' y career.v3=true (las guardadas con v1 o v2 pasan solas: migración de
     carrera v3 en js/core/05-mc9-datos.js). No se borra ningún dato de la carrera. */
(function(){
'use strict';
if(!window.MCMotor||!window.MCAtributos)return;

/* carreras nuevas: v3 para el partido del usuario (por dentro motor='v2': el resto de la fecha y el contexto) */
const oCreate=window.createCareer;
if(typeof oCreate==='function')window.createCareer=function(){
 const r=oCreate.apply(this,arguments);
 try{if(typeof career!=='undefined'&&career&&(career.motor!=='v2'||career.v3!==true)){career.motor='v2';career.v3=true;save()}}catch(e){console.warn('MC motor',e)}
 return r};

/* química: cuántos titulares repiten respecto del partido anterior */
function quimica(){const prev=career._xiPrev;if(!Array.isArray(prev)||!prev.length)return .7;
 const now=career.players.slice(0,11).map(p=>p.id),same=now.filter(id=>prev.includes(id)).length;return +(.35+.65*same/11).toFixed(3)}
function importancia(m){
 const lbl=String(m.compLabel||'');
 if(/final/i.test(lbl)&&!/semi|cuartos|octavos|16avos|dieciseisavos/i.test(lbl))return 1.4;
 if(m.ko)return 1.2;
 try{const L=career.league;if(L&&L.rounds&&career.round>=L.rounds.length-4)return 1.1}catch(e){}
 return 1}

const oMatch=window.createMatch;
if(typeof oMatch==='function')window.createMatch=function(){
 const r=oMatch.apply(this,arguments);
 try{
  if(match){
   /* edad de los rivales (para sus atributos) */
   const ages=new Map();try{(window.rosterFor?rosterFor(match.away):[]).forEach(x=>ages.set(x[0],x[3]))}catch(e){}
   match.riv.concat(match.rivBench||[]).forEach(e=>{if(e.age==null&&ages.has(e.name))e.age=ages.get(e.name)});
   let dtR=70;try{const co=window.mcCoachOf?mcCoachOf(match.away):null;if(co&&co.lvl)dtR=co.lvl}catch(e){}
   const V=MCMotor.preparar(match,{importancia:importancia(match),quimicaO:quimica(),dtR,semilla:career.id+'|'+career.season+'|'+career.round});
   const ar=V.arbitro.severidad>=1.1?'estricto':V.arbitro.severidad<=.9?'permisivo':'equilibrado';
   const imp=V.importancia>=1.4?' · Partido decisivo':V.importancia>=1.2?' · Eliminación directa':V.importancia>1?' · Recta final':'';
   if(window.mcMatchEv)mcMatchEv(match,'🏟 PREVIA',`Clima: ${V.clima} · Césped: ${V.cesped} · Árbitro ${ar}${imp}. Química del equipo: ${Math.round(V.quimica.o*100)}%.`,false,'');
  }
 }catch(e){console.warn('MC motor v2',e);
  /* sin contexto (no debería pasar): el partido igual se juega, con el contexto por defecto */
  try{if(match)MCMotor.preparar(match,{semilla:career.id+'|'+career.season+'|'+career.round})}catch(e2){if(match)delete match.v2}}
 return r};

/* al terminar: guardar el once titular (química). El estado físico posterior lo sigue calculando finishMatch. */
const oFinish=window.finishMatch;
if(typeof oFinish==='function')window.finishMatch=function(){
 const m=match;
 const r=oFinish.apply(this,arguments);
 try{if(career&&m){career._xiPrev=(m.ownPlayers||career.players.slice(0,11)).map(p=>p.id)}
 }catch(e){console.warn('MC motor v2',e)}
 return r};

})();
