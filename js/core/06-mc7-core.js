
/* ===== MODO CARRERA 6.2 · NÚCLEO: carreras múltiples + plantel ===== */
(function(){
const $=id=>document.getElementById(id);
const MC_IDX='mc_index_v7',MC_ACT='mc_active_v7',MC_PFX='mc_career_v7_';
const kebab=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
window.mcNorm=norm;window.mcKebab=kebab;
function idx(){try{const a=JSON.parse(localStorage.getItem(MC_IDX));return Array.isArray(a)?a:[]}catch(e){return[]}}
function setIdx(a){localStorage.setItem(MC_IDX,JSON.stringify(a))}
function newId(){return 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function meta(c){return{id:c.id,name:c.saveName||(c.club+' · Carrera'),club:c.club,country:c.country,season:c.season,round:c.round,budget:c.budget,played:c.played,updated:Date.now()}}
function readSlot(id){try{return JSON.parse(localStorage.getItem(MC_PFX+id))}catch(e){return null}}
window.mcSlots=idx;
window.save=function(){
 if(!career)return;if(!career.id)career.id=newId();
 try{localStorage.setItem(MC_PFX+career.id,JSON.stringify(career));
  const a=idx(),m=meta(career),i=a.findIndex(x=>x.id===career.id);if(i>=0)a[i]=m;else a.push(m);setIdx(a);localStorage.setItem(MC_ACT,career.id)}
 catch(e){if(window.xToast)xToast('No se pudo guardar: almacenamiento lleno')}
};
/* ---- normalización de carreras (nuevas y antiguas) ---- */
function normalize(c){
 c.players=c.players||[];c.inbox=c.inbox||[];c.history=c.history||[];
 const ids=new Set();let max=0;c.players.forEach(p=>{if(typeof p.id==='number')max=Math.max(max,p.id)});
 c.players.forEach(p=>{if(p.id==null||ids.has(p.id)){p.id=++max}ids.add(p.id)});
 const nums=new Set();c.players.forEach((p,i)=>{if(!p.number||nums.has(p.number)){let n=1;while(nums.has(n))n++;p.number=n}nums.add(p.number)});
 c.formation=c.formation||'4-3-3';
 if(!c.mkt)c.mkt={gone:{},extra:[]};
 if(Array.isArray(c.marketPool)){c.marketPool.forEach(p=>{if(p.listed===false)c.mkt.gone[kebab(p.name)]=1});delete c.marketPool}
 c.marketDeals=c.marketDeals||[];c.transferHistory=c.transferHistory||[];
 c.settings=c.settings||null;
 if(window.mcMigrateCareer)mcMigrateCareer(c);
 return c;
}
window.mcNormalize=normalize;
function applySettings(c){
 try{
  if(!c.settings){c.settings={matchLength:$('matchLength').value,currency:$('currency').value,injuries:$('injuries').value,ui:JSON.parse(localStorage.getItem('mc_settings_ui')||'{}')}}
  const s=c.settings;if(s.matchLength)$('matchLength').value=s.matchLength;if(s.currency)$('currency').value=s.currency;if(s.injuries)$('injuries').value=s.injuries;
  localStorage.setItem('mc_settings_ui',JSON.stringify(s.ui||{}));
 }catch(e){}
}
window.mcActivate=function(id,goTo){
 const c=readSlot(id);if(!c){if(window.xToast)xToast('No se pudo abrir esa carrera');return false}
 career=normalize(c);career.id=id;match=null;selectedSpot=null;negotiationLog=[];
 localStorage.setItem(MC_ACT,id);applySettings(career);
 try{renderAll()}catch(e){console.error(e)}
 $('seasonText')&&($('seasonText').textContent=`TEMPORADA ${career.season}/${String(career.season+1).slice(-2)} · ${career.played?'EN CURSO':'PRETEMPORADA'}`);
 if(goTo!==false)go('dashboard');return true;
};
window.mcDelete=function(id){
 localStorage.removeItem(MC_PFX+id);setIdx(idx().filter(x=>x.id!==id));
 if(localStorage.getItem(MC_ACT)===id){localStorage.removeItem(MC_ACT);if(career&&career.id===id){career=null;match=null}}
};
/* migración de la partida antigua (se conserva la clave original como respaldo) */
function migrate(){
 if(idx().length||localStorage.getItem('mc_migrated_v7'))return;
 try{const old=JSON.parse(localStorage.getItem('modo_carrera_41'));
  if(old&&old.club){old.id=newId();old.saveName=old.saveName||(old.club+' · Carrera');career=normalize(old);save()}}catch(e){}
 localStorage.setItem('mc_migrated_v7','1');
}
window.createCareer=function(){
 const club=$('clubChoice').value,country=$('country').value,diff=$('difficulty').value;
 const nm=($('saveName')&&$('saveName').value.trim())||(club+' · Carrera '+(idx().length+1));
 const c={id:newId(),saveName:nm,club,country,manager:$('manager').value.trim()||'Entrenador',difficulty:diff,season:2026,round:0,played:0,w:0,d:0,l:0,gf:0,ga:0,points:0,budget:diff==='Experto'?32:diff==='Difícil'?48:65,board:78,stadium:2,academy:1,training:1,formation:'4-3-3',style:'Equilibrado',tempo:'Normal',line:'Media',players:defaultPlayers(club),history:[],academyPlayers:[],scouting:[],staff:{coach:2,scout:1,medical:1,analyst:1},facilities:{trainingPitches:1,gym:1,medical:1,analysis:1,residence:1},sponsors:[{name:'Patrocinador principal',income:3,level:1}],pressReputation:50,clubReputation:50,youthIntake:0,debts:0,inbox:['La directiva te da la bienvenida. El objetivo es clasificar a una copa continental.','El área de scouting está lista para recibir tus indicaciones.'],scorers:[],next:CLUBS[country].find(x=>x!==club)||'Rival FC',lastResult:null,mkt:{gone:{},extra:[]},marketDeals:[],transferHistory:[],savedTactics:[]};
 career=normalize(c);match=null;selectedSpot=null;negotiationLog=[];
 try{career.settings={matchLength:$('matchLength').value,currency:$('currency').value,injuries:$('injuries').value,ui:JSON.parse(localStorage.getItem('mc_settings_ui')||'{}')}}catch(e){}
 save();renderAll();go('dashboard');
};
/* ---- plantilla real = ROSTERS ∪ base de jugadores ---- */
window.rosterFor=function(club){
 const out=[],seen=new Set();
 let db=null,O=null;try{db=window.mcDB?mcDB():null;O=window.mcPlayersData?mcPlayersData():null}catch(e){db=null}
 const pick=(p,f,d)=>p[f]!==undefined?p[f]:d;
 const add=(n,pos,r,age,nat,val,number)=>{const k=norm(n);if(seen.has(k))return;seen.add(k);
  if(db&&O){const id=db.keyByNorm.get(k);if(id){if(O.deleted[id])return;const p=O.edited[id];if(p){if(p.club!==undefined&&p.club!==club)return;n=pick(p,'name',n);pos=pick(p,'pos',pos);r=pick(p,'rating',r);age=pick(p,'age',age);nat=pick(p,'nat',nat);val=pick(p,'value',val);number=pick(p,'number',number)}}}
  out.push([n,pos,r,age,nat,val,number])};
 const D=window.MC_PLAYERS;
 if(D){D.rows.forEach(r=>{if(D.clubs[r[6]]===club)add(r[0],r[1],r[2],r[3],D.nats[r[4]],r[5],r[7])})}
 (ROSTERS[club]||[]).forEach(p=>add(p[0],p[1],p[2],p[3]||null,null,null));
 /* jugadores agregados por el usuario o movidos a este club desde el administrador */
 if(db)db.list.forEach(o=>{if(o.club!==club||!(o._src==='user'||(o._edited&&o._origClub!==club)))return;const k=norm(o.name);if(seen.has(k))return;seen.add(k);out.push([o.name,o.pos,o.rating,o.age,o.nat==='—'?null:o.nat,o.value,o.number])});
 return out;
};
window.defaultPlayers=function(club){
 let raw=rosterFor(club);
 /* No inventar jugadores para completar el plantel: se usa solo la base real. */
 const rows=padRoster(raw.map(r=>[r[0],r[1],r[2],r[3],r[4],r[5]]),club,22);
 return rows.map((p,i)=>{const age=p[3]||(19+((i*5+3)%16));const young=age<=22;
  return{id:i+1,name:p[0],pos:p[1],rating:p[2],potential:Math.min(95,p[2]+(young?Math.max(2,Math.round((24-age)*1.6)):age<=27?1:0)),age,nat:p[4]||'—',value:p[5]!=null?p[5]:undefined,
  fitness:90+((i*7)%10),morale:72+((i*3)%20),goals:0,assists:0,apps:0,contract:1+((i*3)%4),wage:Math.max(.3,Math.round((p[2]-55)*.12*10)/10),number:(p[6]&&p[6]>0?p[6]:i+1),
  pace:55+((i*7+p[2])%35),shooting:p[1]==='DEL'?p[2]-3:50+((i*3+p[2])%25),passing:p[1]==='MED'?p[2]-3:50+((i*5+p[2])%25),defending:p[1]==='DEF'?p[2]-3:40+((i*5)%25),stamina:65+((i*4)%25),strength:60+((i*6)%25),injury:null,personality:'Profesional',foot:'Derecho',weakFoot:3,transferListed:false}});
};
window.padRoster=function(raw,club,target){
 return (Array.isArray(raw)?raw:[]).filter(x=>x&&x[0]).map(x=>x.slice());
};
/* ordena filas [nombre,pos,rating,...]: XI de la formación, banco (con 2º arquero) y reservas */
function orderRows(all,form){
 const g=p=>all.filter(x=>x[1]===p).sort((a,c)=>c[2]-a[2]);
 const need=slotGroups(form),cnt={POR:0,DEF:0,MED:0,DEL:0};need.forEach(x=>cnt[x]++);
 const G={POR:g('POR'),DEF:g('DEF'),MED:g('MED'),DEL:g('DEL')},xi=[],used=new Set();
 ['POR','DEF','MED','DEL'].forEach(k=>{G[k].slice(0,cnt[k]).forEach(x=>{xi.push(x);used.add(x)})});
 const rest=all.filter(x=>!used.has(x)).sort((a,c)=>c[2]-a[2]);
 const bench=[];const gk=rest.find(x=>x[1]==='POR');if(gk)bench.push(gk);
 rest.forEach(x=>{if(bench.length<7&&!bench.includes(x))bench.push(x)});
 return [...xi,...bench,...rest.filter(x=>!bench.includes(x))];
}
/* ---- modelo de plantel: índices 0-10 titulares, 11-17 suplentes, 18+ reservas ---- */
const BENCH_N=7;window.MC_BENCH_N=BENCH_N;
window.slotGroups=function(f){const p=(f||'4-3-3').split('-').map(Number),d=p[0],fw=p[p.length-1],m=10-d-fw;return['POR',...Array(d).fill('DEF'),...Array(m).fill('MED'),...Array(fw).fill('DEL')]};
window.zoneOf=i=>i<11?'xi':i<11+BENCH_N?'bench':'res';
const ZN={xi:'Titulares',bench:'Suplentes',res:'Reservas'};window.MC_ZN=ZN;
window.posPenalty=function(pp,sp){if(pp===sp)return 0;if(pp==='POR'||sp==='POR')return 35;const o={DEF:0,MED:1,DEL:2};return Math.abs(o[pp]-o[sp])===1?8:16};
window.effRating=(p,slot)=>Math.max(30,p.rating-posPenalty(p.pos,slot));
window.xiEff=function(){const g=slotGroups(career.formation);return career.players.slice(0,11).map((p,i)=>effRating(p,g[i]))};
window.avgRating=function(){if(!career||!career.players.length)return 0;const e=xiEff();return Math.round(e.reduce((a,b)=>a+b,0)/e.length)};
window.slotLabel=function(i){const c=positions(career.formation)[i]||[50,50],g=slotGroups(career.formation)[i];return slotPos({pos:g},c)};
const unavailable=p=>!!(p.injury||p.suspended);window.mcUnavailable=unavailable;
function check(){const n=career.players.length,s=new Set(career.players.map(p=>p.id));return s.size===n}
function rebuild(arr){if(arr.length!==career.players.length||new Set(arr.map(p=>p.id)).size!==arr.length)return false;career.players=arr;return true}
window.lineupSwap=function(i,j){const a=career.players;if(i===j||!a[i]||!a[j])return false;const b=a.slice();[b[i],b[j]]=[b[j],b[i]];if(!rebuild(b))return false;save();return true};
/* advertencias al colocar jugadores */
function warnFor(p,slotIdx,zone){const w=[];if(zone!=='xi')return w;const sg=slotGroups(career.formation)[slotIdx];
 if(p.pos!==sg){const pen=posPenalty(p.pos,sg);w.push(`${p.name} es ${p.pos} y jugará de ${sg} (${slotLabel(slotIdx)}): pierde ${pen} puntos de valoración.`)}
 if(p.injury)w.push(`${p.name} está lesionado (${p.injury}).`);if(p.suspended)w.push(`${p.name} está suspendido.`);return w}
window.mcTrySwap=function(i,j,fromModal){
 const a=career.players,p=a[i],q=a[j];if(!p||!q||i===j)return;
 /* 6.3: un lesionado o suspendido NO puede entrar al once titular */
 const blk=[];if(zoneOf(j)==='xi'&&zoneOf(i)!=='xi'&&unavailable(p))blk.push(p);if(zoneOf(i)==='xi'&&zoneOf(j)!=='xi'&&unavailable(q))blk.push(q);
 if(blk.length){selectedSpot=null;openModal(`<div class="eyebrow">⚠ JUGADOR NO DISPONIBLE</div><h2>No puede ser titular</h2>${blk.map(x=>`<div class="statsrow" style="display:block"><b>${x.name}</b> ${x.injury?`está lesionado (${x.injury}${x.injWeeks?' · faltan '+x.injWeeks+(x.injWeeks===1?' partido':' partidos'):''})`:`está suspendido${x.suspended>1?' ('+x.suspended+' partidos)':''}`}. No puede formar parte del once titular hasta que esté disponible.</div>`).join('')}<p class="tiny">Elegí otro jugador para ese puesto.</p><button class="btn" style="width:100%" onclick="closeModal();refreshSquadViews()">ENTENDIDO</button>`);return}
 const w=[...warnFor(p,j,zoneOf(j)),...warnFor(q,i,zoneOf(i))];
 const doIt=()=>{if(lineupSwap(i,j)){closeModal();selectedSpot=null;refreshSquadViews();xToast&&xToast(`${p.name} ⇄ ${q.name}`)}else xToast('No se pudo realizar el cambio')};
 if(!w.length){doIt();return}
 window._mcPending=doIt;
 openModal(`<div class="eyebrow">⚠ ADVERTENCIA DE POSICIÓN</div><h2>${p.name} ⇄ ${q.name}</h2>${w.map(x=>`<div class="statsrow" style="display:block">${x}</div>`).join('')}<p class="tiny">Podés confirmar igual: el equipo recalcula su valoración con esa penalización.</p><button class="btn" style="width:100%" onclick="_mcPending()">CONFIRMAR CAMBIO</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CANCELAR</button>`);
};
window.refreshSquadViews=function(){try{renderSquad()}catch(e){console.error(e)}try{renderTactics()}catch(e){}try{renderDashboard()}catch(e){}try{renderHome()}catch(e){}};
/* acomoda el once a la formación sin perder ni duplicar jugadores */
window.fitXI=function(){
 const pl=career.players;if(pl.length<11)return;const need=slotGroups(career.formation),cnt={POR:0,DEF:0,MED:0,DEL:0};need.forEach(x=>cnt[x]++);
 const xi=pl.slice(0,11),rest=pl.slice(11),chosen=[],used=new Set(),surplus=[];
 const ok=p=>!unavailable(p);
 ['POR','DEF','MED','DEL'].forEach(k=>{
  const cur=xi.filter(p=>p.pos===k&&ok(p));let keep=cur.slice();
  if(keep.length>cnt[k]){const sorted=keep.slice().sort((a,b)=>b.rating-a.rating).slice(0,cnt[k]);const set=new Set(sorted);keep.forEach(p=>{if(!set.has(p))surplus.push(p)});keep=keep.filter(p=>set.has(p))}
  while(keep.length<cnt[k]){
   let c=rest.filter(p=>!used.has(p)&&p.pos===k&&ok(p)&&!keep.includes(p)).sort((a,b)=>b.rating-a.rating)[0];
   if(!c)c=surplus.filter(p=>p.pos===k&&ok(p)).sort((a,b)=>b.rating-a.rating)[0];
   if(!c)c=xi.filter(p=>!keep.includes(p)&&p.pos===k).sort((a,b)=>b.rating-a.rating)[0];
   if(!c){const order=k==='POR'?[]:k==='DEF'?['MED','DEL']:k==='MED'?['DEF','DEL']:['MED','DEF'];
    for(const o of order){c=[...rest,...surplus,...xi].filter(p=>p.pos===o&&ok(p)&&!keep.includes(p)&&!chosen.includes(p)).sort((a,b)=>b.rating-a.rating)[0];if(c)break}}
   if(!c)c=[...rest,...surplus,...xi].filter(p=>!keep.includes(p)&&!chosen.includes(p)).sort((a,b)=>b.rating-a.rating)[0];
   if(!c)break;
   const si=surplus.indexOf(c);if(si>=0)surplus.splice(si,1);keep.push(c);used.add(c)}
  keep.forEach(p=>chosen.push(p));
 });
 // orden por slot
 const byG={POR:[],DEF:[],MED:[],DEL:[]};const placed=[];
 const take=g=>{const i=chosen.findIndex(p=>p.pos===g&&!placed.includes(p));return i>=0?chosen[i]:null};
 need.forEach(g=>{let p=take(g);if(!p)p=chosen.find(x=>!placed.includes(x));if(p){placed.push(p)}});
 const set=new Set(placed);const remainder=[...surplus.filter(p=>!set.has(p)),...xi.filter(p=>!set.has(p)&&!surplus.includes(p)),...rest.filter(p=>!set.has(p))];
 const out=[...placed,...remainder];
 if(out.length===pl.length&&new Set(out.map(p=>p.id)).size===out.length)career.players=out;
};
window.mcReplaceUnavailable=function(){
 let n=0;for(let i=0;i<11;i++){const p=career.players[i];if(!p||!unavailable(p))continue;const g=slotGroups(career.formation)[i];
  const cand=career.players.map((x,j)=>[x,j]).filter(([x,j])=>j>=11&&!unavailable(x)).sort((a,b)=>(b[0].pos===g)-(a[0].pos===g)||(b[0].rating-posPenalty(b[0].pos,g))-(a[0].rating-posPenalty(a[0].pos,g)))[0];
  if(cand){lineupSwap(i,cand[1]);n++;career.inbox.unshift(`${career.players[i].name} reemplaza a ${career.players[cand[1]].name} en el once (no disponible).`)}}
 return n};
window.setFormation=function(v){career.formation=v;fitXI();save();renderTactics();try{renderSquad()}catch(e){}};
window.autoLineup=function(){
 const rows=career.players.map(p=>[p,p.pos,unavailable(p)?p.rating-1000:p.rating]);const need=slotGroups(career.formation),cnt={POR:0,DEF:0,MED:0,DEL:0};need.forEach(x=>cnt[x]++);
 const xi=[],used=new Set();['POR','DEF','MED','DEL'].forEach(k=>{rows.filter(r=>r[1]===k).sort((a,b)=>b[2]-a[2]).slice(0,cnt[k]).forEach(r=>{xi.push(r[0]);used.add(r[0])})});
 const rest=rows.filter(r=>!used.has(r[0])).sort((a,b)=>b[2]-a[2]).map(r=>r[0]);const bench=[];const gk=rest.find(p=>p.pos==='POR');if(gk)bench.push(gk);rest.forEach(p=>{if(bench.length<BENCH_N&&!bench.includes(p))bench.push(p)});
 const out=[...xi,...bench,...rest.filter(p=>!bench.includes(p))];
 if(out.length===career.players.length&&new Set(out.map(p=>p.id)).size===out.length){career.players=out;mcReplaceUnavailable();save();selectedSpot=null;refreshSquadViews();xToast&&xToast('Alineación recomendada aplicada')}
};
/* tácticas: tocar dos titulares los intercambia (con advertencias) */
window.selectSpot=function(i){if(selectedSpot===null){selectedSpot=i}else if(selectedSpot===i){selectedSpot=null}else{const a=selectedSpot;selectedSpot=null;mcTrySwap(a,i);return}renderTactics()};
/* ---- arranque ---- */
window.mcBoot=function(){
 migrate();
 const act=localStorage.getItem(MC_ACT),a=idx();
 career=null;match=null;
 if(act&&a.find(x=>x.id===act))mcActivate(act,false);
 else if(a.length)mcActivate(a.sort((x,y)=>y.updated-x.updated)[0].id,false);
 else renderAll&&0;
};
})();

