/* ===== MODO CARRERA 12.8 · ETAPA 4 · ROTACIÓN AUTOMÁTICA DEL PLANTEL =====
   Opción en Configuración → Partido → "Rotación automática" (por carrera, APAGADA por defecto: career.rotacion).
   Antes de cada partido tuyo, el asistente revisa el once:
   - Saca a los lesionados o suspendidos y a los cansados (físico por debajo de 68 %), y pone al mejor reemplazo
     sano y con físico de 68 % o más, si rinde más que el cansado.
   - Para comparar, al que tiene menos de 80 % de físico se le resta medio punto por cada punto que le falta (no
     cambia su GRL). Con valores más agresivos (75 %) rotaba más y en 6 temporadas de prueba no sumó más puntos.
   - Vuelve a poner a un titular que ya se recuperó si rinde más que el que lo reemplazó.
   - Nunca toca a los jugadores que marcaste como FIJOS (p.fijo, en la ficha del jugador). Si un fijo está lesionado
     o suspendido, igual no puede jugar: lo reemplaza la regla de siempre del juego (mcReplaceUnavailable).
   - El arco solo se cambia por otro arquero, y un arquero nunca entra en un puesto de campo, así que el equipo
     nunca se queda sin arquero. Cada cambio es un intercambio titular ⇄ suplente: el once sigue teniendo 11.
   Lo que hizo queda en el buzón ("🔄 Rotación automática: ..."). */
(function(){
'use strict';
const CAR=()=>(typeof career!=='undefined'&&career)?career:null;
/* parámetros (se pueden ajustar en pruebas con window.MC_ROT_CFG) */
const CFG=()=>Object.assign({umbral:68,margen:3,ref:80,pen:.5},window.MC_ROT_CFG||{});
const ok=p=>!(window.mcUnavailable?mcUnavailable(p):(p.injury||p.suspended));
const fit=p=>p.fitness==null?90:+p.fitness;
/* valor para decidir el once: GRL en ese puesto menos el cansancio */
function valor(p,g){if(!ok(p))return -1e9;const e=window.effRating?effRating(p,g):p.rating,k=CFG();return e-Math.max(0,k.ref-fit(p))*k.pen}
window.mcRotacionActiva=c=>!!(c&&c.rotacion);
/* aplica la rotación sobre career.players (índices 0-10 titulares). Devuelve la lista de cambios. */
window.mcRotar=function(opt){
 const c=CAR();if(!c||!Array.isArray(c.players)||c.players.length<12)return[];
 opt=opt||{};const G=slotGroups(c.formation),cambios=[],{umbral:UMBRAL,margen:MARGEN}=CFG();
 /* 0) un fijo disponible que quedó afuera (por ejemplo, volvió de una lesión) vuelve al once, en un puesto de su línea */
 for(let j=11;j<c.players.length;j++){const f=c.players[j];if(!f||!f.fijo||!ok(f))continue;
  let mejor=-1,mv=1e9;
  for(let i=0;i<11&&i<G.length;i++){const p=c.players[i];if(!p||p.fijo)continue;if((G[i]==='POR')!==(f.pos==='POR'))continue;
   const v=(ok(p)?valor(p,G[i]):-1e9)+(G[i]===f.pos?0:20);if(v<mv){mv=v;mejor=i}}
  if(mejor<0)continue;const p=c.players[mejor];if(lineupSwap(mejor,j))cambios.push({entra:f.name,sale:p.name,porque:'vuelve el fijo'})}
 for(let pase=0;pase<2;pase++){
  for(let i=0;i<11&&i<G.length;i++){const p=c.players[i],g=G[i];if(!p||p.fijo)continue;
   const actual=valor(p,g),necesita=!ok(p)||fit(p)<UMBRAL;
   let mejor=null,mv=actual+(necesita?0:MARGEN);
   for(let j=11;j<c.players.length;j++){const q=c.players[j];if(!q||q.fijo||!ok(q)||fit(q)<UMBRAL)continue;
    if((g==='POR')!==(q.pos==='POR'))continue;                 /* el arco, solo para arqueros */
    const v=valor(q,g);if(v>mv){mv=v;mejor=j}}
   if(mejor==null)continue;
   const q=c.players[mejor];
   if(!lineupSwap(i,mejor))continue;
   cambios.push({entra:q.name,sale:p.name,porque:!ok(p)?(p.injury?'lesionado':'suspendido'):fit(p)<UMBRAL?`cansado, ${fit(p)} %`:'rinde más'})}
 }
 if(cambios.length&&!opt.silencio){
  c.inbox.unshift('🔄 Rotación automática: '+cambios.map(x=>`entra ${x.entra} por ${x.sale} (${x.porque})`).join('; ')+'.');
  try{save()}catch(e){}}
 return cambios};
/* antes de cada partido tuyo */
const oMatch=window.createMatch;
if(typeof oMatch==='function')window.createMatch=function(){
 try{const c=CAR();if(c&&c.rotacion){const r=mcRotar();if(r.length&&window.xToast)xToast(`Rotación automática: ${r.length} ${r.length===1?'cambio':'cambios'}`)}}catch(e){console.warn('MC rotación',e)}
 const r=oMatch.apply(this,arguments);
 try{if(typeof match!=='undefined'&&match&&CAR()&&CAR().rotacion)match.rotacion=true}catch(e){}
 return r};
/* marcar o desmarcar un jugador como fijo (no lo toca la rotación) */
window.mcToggleFijo=function(i){const c=CAR();const p=c&&c.players[i];if(!p)return;p.fijo=!p.fijo;if(!p.fijo)delete p.fijo;
 try{save()}catch(e){}if(window.xToast)xToast(p.fijo?`${p.name}: fijo (la rotación no lo toca)`:`${p.name}: ya no es fijo`);
 try{openPlayer(i)}catch(e){}};
/* ---------- Configuración → Partido → Rotación automática ---------- */
try{
 if(typeof SS!=='undefined'&&SS.Partido&&SS.Partido[2]&&!SS.Partido[2].some(r=>r[3]==='rotacion'))SS.Partido[2].splice(1,0,['g','people','Rotación automática','rotacion']);
 const oLoad=window.sLoad,oSave=window.sSave;
 if(typeof oLoad==='function')window.sLoad=function(){const r=oLoad.apply(this,arguments);try{draft.rotacion=CAR()&&CAR().rotacion?1:0}catch(e){}return r};
 if(typeof oSave==='function')window.sSave=function(){const want=(typeof draft!=='undefined'&&draft)?!!draft.rotacion:null;const r=oSave.apply(this,arguments);
  try{const c=CAR();if(c&&want!==null&&!!c.rotacion!==want){if(want)c.rotacion=true;else delete c.rotacion;save();
   if(window.xToast)xToast(want?'Rotación automática activada: se aplica antes de cada partido':'Rotación automática desactivada')}}catch(e){}return r};
}catch(e){console.warn('MC rotación ajustes',e)}
})();
