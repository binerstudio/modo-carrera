/* ===== MODO CARRERA · PARTIDOS ENTRE CLUBES DE LA IA CON EL MOTOR v2 =====
   Los partidos de TU liga entre clubes de la IA se juegan con el motor v2: con la alineación real de cada club
   (su mejor once 4-3-3 y suplentes), el nivel de su entrenador y la táctica según su estilo. Las demás ligas y
   copas siguen con el modelo rápido de resultados (miles de partidos por temporada en el teléfono).
   12.7: toda carrera queda con career.motor='v2' (el partido del usuario se juega con el v3). */
(function(){
'use strict';
if(!window.MCMotor)return;
const ROLES=['POR','LI','DFC','DFC','LD','MCD','MC','MC','EI','DC','ED'];
const TAC={Equilibrado:{mentality:50,width:50,depth:50,pressing:50,rhythm:50},Ofensivo:{mentality:68,width:60,depth:62,pressing:58,rhythm:62},
 Defensivo:{mentality:32,width:45,depth:35,pressing:42,rhythm:42},'Posesión':{mentality:56,width:55,depth:55,pressing:55,rhythm:40},
 Contraataque:{mentality:42,width:50,depth:38,pressing:45,rhythm:60},'Presión alta':{mentality:60,width:52,depth:66,pressing:82,rhythm:62}};
function equipo(club){
 let rows=(window.rosterFor?rosterFor(club):[])||[];if(rows.length<11)return null;
 /* 12.8: sin sus lesionados y con su cansancio de la fecha anterior (js/ia/estado-ia.js) */
 if(window.mcIAPlantel)rows=mcIAPlantel(club,rows);
 const co=window.mcCoachOf?mcCoachOf(club):null,style=co&&co.style==='Contragolpe'?'Contraataque':(co&&TAC[co.style]?co.style:'Equilibrado');
 return{name:club,dt:co&&co.lvl?co.lvl:70,
  tac:Object.assign({style,formation:'4-3-3'},TAC[style]),
  players:rows.slice(0,18).map((r,i)=>({name:r[0],pos:r[1],grl:+r[2]||60,age:+r[3]||26,fit:r.fit,role:i<11?ROLES[i]:null}))}}
window.mcSimV2=function(h,a){
 try{if(typeof career==='undefined'||!career||career.motor!=='v2')return null;
  if(h===career.club||a===career.club)return null;
  const H=equipo(h),A=equipo(a);if(!H||!A)return null;
  const r=MCMotor.simular(H,A);
  /* 12.8: el desgaste y las lesiones de este partido quedan para la fecha siguiente */
  try{if(window.mcIARegistrar&&r.jug){
   const dur=n=>1+(window.mcHash?mcHash('les|'+n+'|'+career.season+'|'+career.round):0)%4;
   for(const [sd,club] of [['o',h],['r',a]])mcIARegistrar(club,r.jug.filter(x=>x[0]===sd).map(x=>[x[1],x[2]]),(r.les||[]).filter(x=>x[0]===sd).map(x=>[x[1],dur(x[1])]))}}catch(e){console.warn('MC estado IA',e)}
  return[r.h,r.a]}catch(e){console.warn('MC partidos IA',e);return null}};
})();
