/* ===== MODO CARRERA 12.4 · CONEXIÓN DEL MOTOR v2 CON EL JUEGO =====
   - Carreras NUEVAS: motor v2 (career.motor='v2').
   - Carreras EXISTENTES: siguen con el motor clásico (v1) para no cambiar cómo venían jugándose.
     Se puede cambiar en Configuración → General → Motor de partidos.
   - Cada partido v2 recibe su contexto: clima, césped, árbitro, importancia, química del equipo,
     entrenador rival, edad y moral de los rivales.
   - Partidos entre clubes de la IA: siguen con el modelo rápido (se pasan al v2 en la Etapa 3). */
(function(){
'use strict';
if(!window.MCMotor||!window.MCAtributos)return;
const motorDe=c=>c&&c.motor==='v2'?'v2':'v1';
window.mcMotorDe=motorDe;

/* carreras nuevas → v2 (las pruebas de regresión pueden forzar v1 con window.MC_MOTOR_NUEVAS) */
const oCreate=window.createCareer;
if(typeof oCreate==='function')window.createCareer=function(){
 const r=oCreate.apply(this,arguments);
 try{if(typeof career!=='undefined'&&career&&!career.motor){career.motor=window.MC_MOTOR_NUEVAS||'v2';save()}}catch(e){console.warn('MC motor',e)}
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
  if(match&&motorDe(career)==='v2'){
   /* edad de los rivales (para sus atributos) */
   const ages=new Map();try{(window.rosterFor?rosterFor(match.away):[]).forEach(x=>ages.set(x[0],x[3]))}catch(e){}
   match.riv.concat(match.rivBench||[]).forEach(e=>{if(e.age==null&&ages.has(e.name))e.age=ages.get(e.name)});
   let dtR=70;try{const co=window.mcCoachOf?mcCoachOf(match.away):null;if(co&&co.lvl)dtR=co.lvl}catch(e){}
   const V=MCMotor.preparar(match,{importancia:importancia(match),quimicaO:quimica(),dtR});
   const ar=V.arbitro.severidad>=1.1?'estricto':V.arbitro.severidad<=.9?'permisivo':'equilibrado';
   const imp=V.importancia>=1.4?' · Partido decisivo':V.importancia>=1.2?' · Eliminación directa':V.importancia>1?' · Recta final':'';
   if(window.mcMatchEv)mcMatchEv(match,'🏟 PREVIA',`Clima: ${V.clima} · Césped: ${V.cesped} · Árbitro ${ar}${imp}. Química del equipo: ${Math.round(V.quimica.o*100)}%.`,false,'');
  }
 }catch(e){console.warn('MC motor v2',e);if(match)delete match.v2}
 return r};

/* al terminar: guardar el once titular (química) y bajar el estado físico según la fatiga real del partido */
const oFinish=window.finishMatch;
if(typeof oFinish==='function')window.finishMatch=function(){
 const m=match,v2=m&&m.v2&&!m.done;
 const r=oFinish.apply(this,arguments);
 try{if(career&&m){career._xiPrev=(m.ownPlayers||career.players.slice(0,11)).map(p=>p.id)}
  if(v2&&m.own){m.own.forEach(e=>{if(!e.p)return;const en=MCMotor.energia(e);/* energía 0.2–1 → el estado físico no baja más que lo que el partido gastó */
   const gasto=Math.round(Math.max(0,(e.p.fitness==null?90:e.p.fitness)/100-en)*100);if(gasto>12)e.p.fitness=Math.max(40,(e.p.fitness||90)-Math.round(gasto*.25))})}
 }catch(e){console.warn('MC motor v2',e)}
 return r};

/* ---------- Configuración: elegir motor para la carrera activa ---------- */
try{
 if(typeof OP!=='undefined'&&typeof SS!=='undefined'){
  OP.motor=[['v1','Clásico (v1)'],['v2','Avanzado (v2)']];
  const rows=SS.General&&SS.General[2];if(rows&&!rows.some(x=>x[3]==='motor'))rows.splice(2,0,['s','ball','Motor de partidos','motor']);
  const oLoad=window.sLoad,oSave=window.sSave;
  if(typeof oLoad==='function')window.sLoad=function(){const r=oLoad.apply(this,arguments);try{draft.motor=(typeof career!=='undefined'&&career)?motorDe(career):(window.MC_MOTOR_NUEVAS||'v2')}catch(e){}return r};
  if(typeof oSave==='function')window.sSave=function(){const want=(typeof draft!=='undefined'&&draft)?draft.motor:null;
   const r=oSave.apply(this,arguments);
   try{if(want&&typeof career!=='undefined'&&career&&motorDe(career)!==want){career.motor=want;save();if(window.xToast)xToast(want==='v2'?'Motor avanzado (v2) activado desde el próximo partido':'Motor clásico (v1) activado desde el próximo partido')}}catch(e){}
   return r};
 }
}catch(e){console.warn('MC motor ajustes',e)}
})();
