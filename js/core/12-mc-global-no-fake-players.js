
/* Limpieza global: nunca completar planteles con futbolistas ficticios. */
(function(){
 'use strict';
 const fold=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const role=/^(?:portero|arquero|goalkeeper|defensor|defensa|defender|lateral|central|volante|mediocampista|mediocentro|mediapunta|extremo|delantero|forward|striker|winger|midfielder)\s+(?:suplente|reserva|substitute|reserve|backup)(?:\s+\d+)?$/;
 const generic=/^(?:portero titular|arquero titular|lateral derecho|central derecho|central izquierdo|lateral izquierdo|mediocentro defensivo|mediocentro|mediapunta|extremo derecho|delantero centro|extremo izquierdo)$/;
 const numbered=/^(?:jugador|futbolista|player|regen|rookie)(?:\s+(?:ficticio|generico|generico))?\s*#?\s*\d+$/;
 const prospect=/^prospecto\s+.+\s+\d+$/;
 const youthBases=['benjamin sosa','thiago benitez','mateo acuna','franco medina','lautaro rojas','bautista diaz','valentino ruiz','joaquin vera'];
 function isFakeName(v){const n=fold(v);if(!n)return true;return role.test(n)||generic.test(n)||numbered.test(n)||prospect.test(n)||/^(?:sin nombre|jugador desconocido|unknown player|new player)$/.test(n)||youthBases.some(b=>new RegExp('^'+b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+\\d+$').test(n));}
 window.mcIsFakePlayerName=isFakeName;
 const cleanRows=a=>(Array.isArray(a)?a:[]).filter(x=>!isFakeName(Array.isArray(x)?x[0]:x&&x.name));
 /* Roster API: mantener únicamente los futbolistas procedentes de las bases reales. */
 if(typeof window.rosterFor==='function'){
  const originalRosterFor=window.rosterFor;
  window.rosterFor=function(club){return cleanRows(originalRosterFor(club))};
 }
 window.genericRoster=function(){return[]};
 window.padRoster=function(raw){return cleanRows(raw).map(x=>Array.isArray(x)?x.slice():x)};
 /* Nuevas carreras usan el plantel disponible tal cual, sin completar posiciones ni cupos. */
 window.defaultPlayers=function(club){
  const raw=cleanRows(window.rosterFor?window.rosterFor(club):[]);
  return raw.map((p,i)=>{
   const age=p[3]!=null?p[3]:25, rating=Number(p[2])||0, pos=p[1]||'MED';
   return {id:i+1,name:p[0],pos,rating,potential:Math.min(95,rating+(age<=22?Math.max(2,Math.round((24-age)*1.6)):age<=27?1:0)),age,nat:p[4]||'—',value:p[5]!=null?p[5]:undefined,
    fitness:90+((i*7)%10),morale:72+((i*3)%20),goals:0,assists:0,apps:0,contract:1+((i*3)%4),wage:Math.max(.3,Math.round((rating-55)*.12*10)/10),number:(p[6]&&p[6]>0?p[6]:i+1),
    pace:55+((i*7+rating)%35),shooting:pos==='DEL'?rating-3:50+((i*3+rating)%25),passing:pos==='MED'?rating-3:50+((i*5+rating)%25),defending:pos==='DEF'?rating-3:40+((i*5)%25),stamina:65+((i*4)%25),strength:60+((i*6)%25),injury:null,personality:'Profesional',foot:'Derecho',weakFoot:3,transferListed:false};
  });
 };
 /* La base del mercado también debe omitir cualquier etiqueta ficticia heredada. */
 if(typeof window.mcDB==='function'){
  const originalDB=window.mcDB;
  window.mcDB=function(){
   const d=originalDB();if(!d||!Array.isArray(d.list))return d;
   d.list=d.list.filter(p=>!isFakeName(p&&p.name));
   if(Array.isArray(d.base))d.base=d.base.filter(p=>!isFakeName(p&&p.name));
   d.byId=new Map(d.list.map(p=>[p.id,p]));
   d.keyByNorm=new Map(d.list.map(p=>[fold(p.name),p.id]));
   d.clubs=[...new Set(d.list.map(p=>p.club))].sort((a,b)=>a.localeCompare(b));
   d.nats=[...new Set(d.list.map(p=>p.nat).filter(x=>x&&x!=='—'))].sort((a,b)=>a.localeCompare(b,'es'));
   return d;
  };
 }
 function cleanCareer(c){
  if(!c||typeof c!=='object')return false;let changed=false;
  const filter=(key)=>{if(Array.isArray(c[key])){const n=cleanRows(c[key]);if(n.length!==c[key].length){c[key]=n;changed=true}}};
  filter('players');filter('academyPlayers');
  if(c.mkt&&Array.isArray(c.mkt.extra)){const n=cleanRows(c.mkt.extra);if(n.length!==c.mkt.extra.length){c.mkt.extra=n;changed=true}}
  if(Array.isArray(c.marketPool)){const n=cleanRows(c.marketPool);if(n.length!==c.marketPool.length){c.marketPool=n;changed=true}}
  return changed;
 }
 window.mcCleanCareerFakePlayers=cleanCareer;
 /* Limpiar las carreras guardadas (activas e inactivas) al abrir esta versión. */
 try{
  const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(k.startsWith('mc_career_v7_')||k==='modo_carrera_41'))keys.push(k)}
  keys.forEach(k=>{try{const c=JSON.parse(localStorage.getItem(k));if(cleanCareer(c))localStorage.setItem(k,JSON.stringify(c))}catch(e){}});
 }catch(e){}
 if(typeof career!=='undefined'&&career){
  if(cleanCareer(career)){try{if(typeof save==='function')save()}catch(e){}}
 }
 /* No inventar juveniles ni prospectos aleatorios: se mantiene la sección, pero solo con jugadores reales cargados. */
 window.youthIntake=function(){if(window.xToast)xToast('No se generan juveniles ficticios. Incorporá jugadores reales desde el administrador.');else alert('No se generan juveniles ficticios. Incorporá jugadores reales desde el administrador.')};
 window.scoutReport=function(){if(window.xToast)xToast('El scouting no agrega jugadores inventados. Usá la base de futbolistas reales.');else alert('El scouting no agrega jugadores inventados. Usá la base de futbolistas reales.')};
 /* GRL de clubes: promedio de los jugadores reales disponibles, sin rellenar un once falso. */
 if(typeof window.mcTeamGRL==='function')window.mcTeamGRL=function(club){
  const rows=cleanRows(window.rosterFor?window.rosterFor(club):[]).slice(0,11);
  return rows.length?Math.round(rows.reduce((s,p)=>s+(Number(p[2])||0),0)/rows.length):0;
 };
 /* Al reabrir una partida, volver a limpiar y guardar antes de mostrar el plantel. */
 if(typeof window.mcActivate==='function'){
  const activate=window.mcActivate;
  window.mcActivate=function(id,goTo){const ok=activate(id,goTo);if(ok&&typeof career!=='undefined'&&career&&cleanCareer(career)){try{save();renderAll()}catch(e){}}return ok};
 }
 if(typeof career!=='undefined'&&career){try{renderSquad&&renderSquad()}catch(e){}}
})();
