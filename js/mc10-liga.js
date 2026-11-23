/* ===== MODO CARRERA 10.0 · MOTOR DE COMPETICIONES =====
   Reemplaza (ampliando) el motor de liga 6.3:
   - Formato real de cada liga: ruedas, segunda fase por grupos (con puntos a la mitad cuando corresponde),
     Apertura/Clausura y playoffs (eliminación directa a ida y vuelta o partido único).
   - Fechas libres (ligas con cantidad impar de equipos) se simulan solas.
   - Copas nacionales y competiciones continentales se intercalan con la liga como "eventos": tu partido
     de copa se juega con el mismo simulador; los demás cruces se simulan según el GRL.
   - Las partidas guardadas de la 6.x se migran sin perder resultados.
*/
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* ---------- utilidades ---------- */
function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function poisson(l,R){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=R()}while(p>L);return k-1}
window.mcRng=rng;window.mcHash=hash;
/* fuerza de un club: GRL de sus mejores 11 + ajuste del entrenador (ver mc10-mundo) */
const GC=new Map();
function grl(club){
 if(typeof career!=='undefined'&&career&&club===career.club)return avgRating();
 if(GC.has(club))return GC.get(club);
 let v=0;try{const rr=(window.rosterFor?rosterFor(club):[]).map(r=>+r[2]||0).sort((a,b)=>b-a).slice(0,11);v=rr.length?rr.reduce((a,b)=>a+b,0)/rr.length:(window.mcClubStrength?mcClubStrength(club):60)}catch(e){v=60}
 GC.set(club,v);return v}
window.mcTeamGRL=function(c){return grl(c)+(window.mcCoachBonus?mcCoachBonus(c):0)};
window.mcClearGRL=function(){GC.clear()};
const TG=c=>window.mcTeamGRL(c);
/* resultado de un partido simulado (home, away) */
function simScore(h,a,R,neutral){R=R||Math.random;const d=TG(h)-TG(a)+(neutral?0:1.5);
 return[poisson(clamp(1.32*Math.exp(d*.055),.2,4.2),R),poisson(clamp(1.12*Math.exp(-d*.055),.2,3.8),R)]}
window.mcSimScore=simScore;
function pens(a,b,R){R=R||Math.random;const pa=.5+clamp((TG(a)-TG(b))*.006,-.12,.12);let x=0,y=0;for(let i=0;i<5;i++){if(R()<.76)x++;if(R()<.76)y++}
 while(x===y){if(R()<.76)x++;if(R()<.76)y++}if((x>y)!==(R()<pa)){const t=x;x=y;y=t}return[x,y]}
window.mcPens=pens;
/* fixture todos contra todos (método del círculo, igual que la 6.3 para no alterar partidas guardadas) */
function circle(teams,pivot){
 const T=teams.slice();if(T.length%2)T.push(null);
 const F=T.includes(pivot)?pivot:T[0],L=T.filter(x=>x!==F),m=L.length,first=[];
 for(let r=0;r<m;r++){const day=[],o=L[r];
  if(o!==null)day.push(r%2===0?[F,o]:[o,F]);
  for(let k=1;k<=(m-1)/2;k++){const a=L[(r+k)%m],b=L[(r-k+m)%m];if(a===null||b===null)continue;day.push(2*k<=(m-1)/2?[a,b]:[b,a])}
  first.push(day)}
 return first}
function rr(teams,pivot,legs,startLeg){const first=circle(teams,pivot),out=[];
 for(let l=0;l<legs;l++)first.forEach(d=>out.push(d.map(p=>(l+(startLeg||0))%2?[p[1],p[0]]:[p[0],p[1]])));return out}
window.mcRoundRobin=rr;
/* ---------- formato de la liga ---------- */
const HALF={'Austria':[0,1],'Rumanía':[0,1],'Bélgica':[0]};
const SINGLE_PO=['Estados Unidos','Australia','Nueva Zelanda','India','Albania','San Marino','Canadá','Jamaica','República Dominicana','Haití'];
function fmtOf(country){const lg=LEAGUES[country]||{},m=lg.mc10;
 if(m)return{legs:m.legs||2,grp:m.grp||null,po:m.po||0,apcl:!!m.apcl,rel:m.rel||0,half:HALF[country]||[],poLegs:SINGLE_PO.includes(country)?1:2,cups:m.cups||[lg.copa||'Copa nacional']};
 const n=(CLUBS[country]||[]).length,one=n%2?n:n-1;return{legs:Math.max(1,Math.round((lg.fecha||one*2)/one)),grp:null,po:0,apcl:false,rel:lg.desc||0,half:[],poLegs:2,cups:[lg.copa||'Copa nacional']}}
window.mcLeagueFmt=fmtOf;
/* ---------- liga de la temporada ---------- */
/* si tu club ya no figura en la liga (partidas viejas), se lo suma a tu liga para no romper la carrera */
function teamsFor(country,club){const t=(CLUBS[country]||[]).slice();if(club&&!t.includes(club))t.push(club);return t}
function addRounds(L,days,kind){const ix=new Map(L.teams.map((t,i)=>[t,i]));days.forEach(d=>{L.rounds.push(d.map(p=>[ix.get(p[0]),ix.get(p[1]),null,null]));L.kinds.push(kind)})}
function projected(L){const f=L.fmt,n=L.teams.length,one=n%2?n:n-1;let t=one*f.legs*(f.apcl?2:1);
 if(f.grp){t=one*f.legs+Math.max(...f.grp.map(g=>{const m=g[1]-g[0]+1;return(m%2?m:m-1)*g[2]}))}
 return Math.max(t,L.rounds.length)}
function newLeague(c){
 const country=c.country,teams=teamsFor(country,c.club),f=fmtOf(country);
 const L={v:1,mc10:1,season:c.season,country,teams,rounds:[],kinds:[],fmt:f,stage:f.apcl?'A':'R',po:null,champs:[],notes:[]};
 addRounds(L,rr(teams,c.club,f.legs,0),f.apcl?'A':'L');
 L.p1=L.rounds.length;L.total=projected(L);return L}
/* migración de ligas 6.3 (v:1): se conservan TODOS los resultados ya jugados */
function migrate(L,c){const f=fmtOf(L.country);L.mc10=1;L.fmt=f;L.kinds=L.rounds.map(()=>f.apcl?'A':'L');L.stage=f.apcl?'A':'R';L.po=null;L.champs=L.champs||[];L.notes=L.notes||[];L.p1=L.rounds.length;L.total=projected(L);return L}
function ensure(){
 if(typeof career==='undefined'||!career)return null;let L=career.league;
 if(L&&L.season===career.season&&L.country===career.country&&L.teams.includes(career.club)){
  if(!L.mc10)migrate(L,career);return L}
 L=newLeague(career);career.league=L;
 /* resultados de partidas anteriores (historial 6.x) */
 const ui=L.teams.indexOf(career.club),H=(career.history||[]).filter(h=>h.season==null||h.season===career.season),done=Math.min(career.round||0,L.rounds.length);
 for(let r=0;r<done;r++){const f=L.rounds[r].find(x=>x[0]===ui||x[1]===ui),h=H[r];
  if(f&&h&&h.h!=null){if((h.venue||'h')==='h'){if(f[0]!==ui){const t=f[0];f[0]=f[1];f[1]=t}f[2]=h.h;f[3]=h.a}else{if(f[1]!==ui){const t=f[0];f[0]=f[1];f[1]=t}f[2]=h.a;f[3]=h.h}}
  L.rounds[r].forEach(x=>{if(x[2]==null)simFx(L,x)})}
 career.round=done;
 if(window.mcSeasonStart)try{mcSeasonStart(career)}catch(e){console.error('mcSeasonStart',e)}
 sync();return L}
window.mcEnsureLeague=ensure;
function simFx(L,f){const s=(window.mcSimV2&&mcSimV2(L.teams[f[0]],L.teams[f[1]]))||simScore(L.teams[f[0]],L.teams[f[1]]);f[2]=s[0];f[3]=s[1];if(window.mcStatHook)try{mcStatHook(L.teams[f[0]],L.teams[f[1]],s[0],s[1],L.country)}catch(e){}if(f[4]&&f[4].ko&&f[4].single&&f[2]===f[3]){f[4].pen=pens(L.teams[f[0]],L.teams[f[1]])}}
/* ---------- tablas ---------- */
function table(L,opt){L=L||ensure();if(!L)return[];opt=opt||{};
 const kinds=opt.kinds||(L.fmt.apcl?[curHalf(L)]:['L']);
 const rows=L.teams.map((n,i)=>({i,name:n,pj:0,g:0,e:0,p:0,gf:0,gc:0,dg:0,pts:0,form:[]}));
 L.rounds.forEach((d,r)=>{if(!kinds.includes(L.kinds[r]))return;d.forEach(f=>{if(f[2]==null||(f[4]&&f[4].ko))return;const H=rows[f[0]],A=rows[f[1]];
  H.pj++;A.pj++;H.gf+=f[2];H.gc+=f[3];A.gf+=f[3];A.gc+=f[2];
  if(f[2]>f[3]){H.g++;A.p++;H.pts+=3;H.form.push('W');A.form.push('L')}else if(f[2]<f[3]){A.g++;H.p++;A.pts+=3;H.form.push('L');A.form.push('W')}else{H.e++;A.e++;H.pts++;A.pts++;H.form.push('D');A.form.push('D')}})});
 rows.forEach(r=>r.dg=r.gf-r.gc);
 const srt=(a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf||a.name.localeCompare(b.name);
 /* segunda fase por grupos: puntos de la 1ª fase (a la mitad si corresponde) + 2ª fase, ordenado por grupo */
 if(!L.fmt.apcl&&L.grp&&!opt.kinds){const g2=L.rounds.map((d,r)=>L.kinds[r]==='G'?r:-1).filter(r=>r>=0);
  const ph2=new Map(rows.map(r=>[r.i,{pts:0,g:0,e:0,p:0,gf:0,gc:0,pj:0}]));
  g2.forEach(r=>L.rounds[r].forEach(f=>{if(f[2]==null)return;const H=ph2.get(f[0]),A=ph2.get(f[1]);H.pj++;A.pj++;H.gf+=f[2];H.gc+=f[3];A.gf+=f[3];A.gc+=f[2];if(f[2]>f[3]){H.g++;A.p++;H.pts+=3}else if(f[2]<f[3]){A.g++;H.p++;A.pts+=3}else{H.e++;A.e++;H.pts++;A.pts++}}));
  const out=[],used=new Set();
  L.grp.forEach((g,gi)=>{const half=L.fmt.half.includes(gi);
   const grows=g.ids.map(i=>{const b=rows[i],x=ph2.get(i);const r={...b,form:b.form.slice()};r.pts=(half?Math.ceil(b.pts/2):b.pts)+x.pts;r.pj+=x.pj;r.g+=x.g;r.e+=x.e;r.p+=x.p;r.gf+=x.gf;r.gc+=x.gc;r.dg=r.gf-r.gc;r.grp=gi;return r}).sort(srt);
   grows.forEach(r=>{out.push(r);used.add(r.i)})});
  const p1=L.p1order||[];p1.forEach(i=>{if(!used.has(i)){const r={...rows[i]};out.splice(Math.min(out.length,L.p1order.indexOf(i)),0,r);used.add(i)}});
  rows.forEach(r=>{if(!used.has(r.i))out.push(r)});return out}
 return rows.sort(srt)}
window.mcTable=table;
function curHalf(L){return L.stage==='A'||L.stage==='PA'?'A':'C'}
function sync(){const L=career.league;if(!L)return;const r=table(L).find(x=>x.name===career.club);if(!r)return;
 career.played=r.pj;career.w=r.g;career.d=r.e;career.l=r.p;career.gf=r.gf;career.ga=r.gc;career.points=r.pts}
window.mcLeagueSync=sync;
/* ---------- fases: grupos, playoffs, Apertura/Clausura ---------- */
function buildGroups(L){const t=table(L,{kinds:['L']});L.p1order=t.map(r=>r.i);
 L.grp=L.fmt.grp.map(g=>({from:g[0],to:g[1],legs:g[2],ids:t.slice(g[0]-1,g[1]).map(r=>r.i)}));
 const days=[];L.grp.forEach(g=>{const names=g.ids.map(i=>L.teams[i]);const d=rr(names,names.includes(career.club)?career.club:names[0],g.legs,0);d.forEach((x,k)=>{days[k]=(days[k]||[]).concat(x)})});
 addRounds(L,days,'G');L.stage='G';L.total=Math.max(L.total,L.rounds.length);
 career.inbox.unshift(`${leagueName(L.country)}: terminó la primera fase. Se arman los grupos de la segunda fase${L.fmt.half.length?' (los puntos se dividen a la mitad)':''}.`)}
function seedsFrom(L,n,kinds){return table(L,kinds?{kinds}:undefined).slice(0,n).map(r=>r.i)}
function buildPO(L,tag,kinds){const n=Math.min(L.fmt.po,L.teams.length);if(n<2){const t=table(L,kinds?{kinds}:undefined);L.champs.push({tag,name:t[0].name,title:tag==='A'?'Apertura':tag==='C'?'Clausura':'Campeón'});if(L.fmt.apcl&&tag==='A'){L.stage='A';}return false}
 const seeds=seedsFrom(L,n,kinds);let P=1;while(P<n)P*=2;
 /* llave estándar: 1 vs P, 2 vs P-1...; los mejores sembrados pasan directo si faltan equipos */
 const order=bracketOrder(P),slots=order.map(s=>s<=n?seeds[s-1]:null);
 L.po={tag,slots,round:0,P,legs:L.fmt.poLegs,ties:[],hist:[]};
 nextPORound(L);return true}
function bracketOrder(P){let a=[1,2];while(a.length<P){const m=a.length*2+1,b=[];a.forEach(x=>{b.push(x);b.push(m-x)});a=b}return a}
const PONAME=n=>n===2?'Final':n===4?'Semifinal':n===8?'Cuartos de final':n===16?'Octavos de final':'Ronda de '+n;
function nextPORound(L){const po=L.po,s=po.slots,ties=[];
 for(let i=0;i<s.length;i+=2){const a=s[i],b=s[i+1];if(a==null&&b==null)ties.push({w:null});else if(a==null||b==null)ties.push({a:a==null?b:a,b:null,w:a==null?b:a,bye:true});else{
  /* el mejor sembrado define de local (vuelta) */ties.push({a,b,legs:[],w:null})}}
 po.ties=ties;po.name=PONAME(s.length);
 const legs=(s.length===2&&L.fmt.poLegs===1)?1:L.fmt.poLegs;po.curLegs=legs;
 const real=ties.filter(t=>!t.bye&&t.w==null&&t.a!=null);
 for(let l=0;l<legs;l++){const day=real.map(t=>{const [h,a]=legs===1||l===1?[t.a,t.b]:[t.b,t.a];return[h,a,null,null,{ko:true,tie:ties.indexOf(t),leg:l,single:legs===1}]});
  L.rounds.push(day);L.kinds.push('P')}
 L.stage=L.stage.startsWith('P')?L.stage:'P'+(L.po.tag||'');if(L.fmt.apcl)L.stage='P'+L.po.tag;
 L.total=Math.max(L.total,L.rounds.length)}
function resolvePORound(L,r0,r1){const po=L.po;
 for(let r=r0;r<=r1;r++)L.rounds[r].forEach(f=>{const t=po.ties[f[4].tie];t.legs[f[4].leg]=[f[0],f[1],f[2],f[3],f[4].pen||null]});
 po.ties.forEach(t=>{if(t.w!=null||t.bye||t.a==null)return;let ga=0,gb=0;t.legs.forEach(x=>{if(!x)return;if(x[0]===t.a){ga+=x[2];gb+=x[3]}else{gb+=x[2];ga+=x[3]}});
  if(ga!==gb)t.w=ga>gb?t.a:t.b;else{const last=t.legs[t.legs.length-1];let p=last&&last[4];if(!p){p=pens(L.teams[last[0]],L.teams[last[1]]);}const homeWon=p[0]>p[1];t.w=homeWon?last[0]:last[1];t.pen=p}
  t.agg=[ga,gb]});
 po.hist.push({name:po.name,ties:po.ties.map(t=>({a:t.a,b:t.b,w:t.w,agg:t.agg,pen:t.pen,bye:!!t.bye}))});
 po.slots=po.ties.map(t=>t.w);
 if(po.slots.length===1){const champ=L.teams[po.slots[0]];L.champs.push({tag:po.tag||'',name:champ,title:po.tag==='A'?'Apertura':po.tag==='C'?'Clausura':'Campeón'});
  career.inbox.unshift(`🏆 ${champ} es campeón${po.tag==='A'?' del Apertura':po.tag==='C'?' del Clausura':''} de ${leagueName(L.country)}.`);L.poHist=(L.poHist||[]).concat([po.hist]);L.po=null;return'done'}
 nextPORound(L);return'more'}
/* transición de fase cuando se completan todas las fechas cargadas */
function stageStep(L){const f=L.fmt;
 if(L.po){/* ronda de playoff recién completada */const n=L.po.curLegs,r1=L.rounds.length-1,r0=r1-n+1;const res=resolvePORound(L,r0,r1);
  if(res==='more')return true;
  if(f.apcl&&L.stage==='PA'){addRounds(L,rr(L.teams,career.club,f.legs,1),'C');L.stage='C';L.total=L.rounds.length+0;career.inbox.unshift(`Comienza el Clausura de ${leagueName(L.country)}.`);return true}
  L.stage='done';return false}
 if(f.apcl){
  if(L.stage==='A'){const t=table(L,{kinds:['A']});
   if(f.po>0){L.stage='PA';buildPO(L,'A',['A']);return true}
   L.champs.push({tag:'A',name:t[0].name,title:'Apertura'});career.inbox.unshift(`🏆 ${t[0].name} ganó el Apertura de ${leagueName(L.country)}.`);
   addRounds(L,rr(L.teams,career.club,f.legs,1),'C');L.stage='C';return true}
  if(L.stage==='C'){const t=table(L,{kinds:['C']});
   if(f.po>0){L.stage='PC';buildPO(L,'C',['C']);return true}
   L.champs.push({tag:'C',name:t[0].name,title:'Clausura'});career.inbox.unshift(`🏆 ${t[0].name} ganó el Clausura de ${leagueName(L.country)}.`);L.stage='done';return false}
  return false}
 if(L.stage==='R'){if(f.grp){buildGroups(L);return true}
  if(f.po>0){const t=table(L);L.champs.push({tag:'R',name:t[0].name,title:'Fase regular'});L.stage='P';buildPO(L,'',null);return true}
  L.stage='done';return false}
 if(L.stage==='G'){if(f.po>0){L.stage='P';buildPO(L,'',null);return true}L.stage='done';return false}
 return false}
/* ---------- eventos (copas y torneos continentales) ---------- */
window.MC_COMPS=window.MC_COMPS||[];   /* módulos que aportan partidos: {pending(c), record(c,ev,m), tick(c)} */
function pendingEv(){if(!career)return null;let best=null;
 const L0=career.league,ldone=!!(L0&&L0.stage==='done'&&career.round>=L0.rounds.length);
 (window.MC_COMPS||[]).forEach(mod=>{try{const e=mod.pending(career);if(e&&(e.at<=career.round||ldone)&&(!best||e.at<best.at||(e.at===best.at&&(e.prio||0)<(best.prio||0))))best={...e,mod}}catch(err){console.error(err)}});return best}
window.mcPendingEvent=pendingEv;
function tickComps(){(window.MC_COMPS||[]).forEach(m=>{try{m.tick&&m.tick(career)}catch(e){console.error(e)}})}
/* avanza solo lo que no te involucra: fechas libres, rondas de playoff sin tu club, etc. */
function autoAdvance(){const L=ensure();if(!L)return;let guard=0;
 while(guard++<400){tickComps();if(pendingEv())return;
  if(career.round<L.rounds.length){const u=L.teams.indexOf(career.club),d=L.rounds[career.round];
   if(d.some(f=>f[0]===u||f[1]===u))return;
   d.forEach(f=>{if(f[2]==null)simFx(L,f)});career.round++;afterRound(L);continue}
  if(L.stage!=='done'&&stageStep(L)){continue}
  return}}
window.mcAutoAdvance=autoAdvance;
function afterRound(L){sync();if(window.mcAfterRound)try{mcAfterRound(career,L)}catch(e){console.error(e)}}
function userFix(r){const L=ensure();if(!L||r>=L.rounds.length)return null;const u=L.teams.indexOf(career.club);return L.rounds[r].find(x=>x[0]===u||x[1]===u)||null}
function current(){if(!career)return null;autoAdvance();const ev=pendingEv();if(ev)return{type:'ev',ev,home:ev.home,away:ev.away,venue:ev.home===career.club?'h':'a',label:ev.label};
 const L=career.league,f=userFix(career.round);if(!f)return null;
 const kind=L.kinds[career.round],ko=f[4]&&f[4].ko;
 const label=ko?`${leagueName(L.country)} · ${L.po?L.po.name:'Playoff'}${L.po&&L.po.curLegs===2?(f[4].leg?' · vuelta':' · ida'):''}`:
  kind==='A'||kind==='C'?`${kind==='A'?'APERTURA':'CLAUSURA'} · FECHA ${L.rounds.slice(0,career.round+1).filter((_,i)=>L.kinds[i]===kind).length}`:
  kind==='G'?`2ª FASE · FECHA ${L.rounds.slice(0,career.round+1).filter((_,i)=>L.kinds[i]==='G').length}`:`LIGA · FECHA ${career.round+1}`;
 return{type:'league',f,home:L.teams[f[0]],away:L.teams[f[1]],venue:L.teams[f[0]]===career.club?'h':'a',label,ko}}
window.mcCurrent=current;
/* ---------- API que usan el simulador y las pantallas ---------- */
window.opponent=function(){const c=current();if(!c)return null;return c.home===career.club?c.away:c.home};
window.mcVenue=function(){const c=current();return c?c.venue:'h'};
window.mcTotalRounds=function(){const L=ensure();return L?Math.max(L.total||0,L.rounds.length):0};
window.mcSeasonOver=function(){const L=ensure();if(!L)return false;autoAdvance();return L.stage==='done'&&career.round>=L.rounds.length&&!pendingEv()};
window.rank=function(){const t=table();const i=t.findIndex(x=>x.name===career.club);return i>=0?i+1:'-'};
window.mcLeagueRecord=function(m){const L=ensure();if(!L)return false;const c=current();if(!c)return false;
 if(c.type==='ev'){c.ev.mod.record(career,c.ev,m);tickComps();autoAdvance();return true}
 const u=L.teams.indexOf(career.club),f=c.f;
 if(f[0]===u){f[2]=m.h;f[3]=m.a}else{f[2]=m.a;f[3]=m.h}
 if(window.mcStatHookUser)try{mcStatHookUser(m,L.country)}catch(e){}
 if(f[4]&&f[4].ko&&f[4].single&&f[2]===f[3]){f[4].pen=pens(L.teams[f[0]],L.teams[f[1]]);const me=f[0]===u?f[4].pen[0]:f[4].pen[1],th=f[0]===u?f[4].pen[1]:f[4].pen[0];
  m.events&&m.events.push({lbl:'120',min:120,title:'🥅 DEFINICIÓN POR PENALES',msg:`${career.club} ${me}-${th} ${m.away}. ${me>th?'¡Clasificado!':'Eliminado.'}`,key:true})}
 L.rounds[career.round].forEach(x=>{if(x!==f&&x[2]==null)simFx(L,x)});
 career.round++;afterRound(L);
 /* si era la vuelta de un cruce, avisar el resultado global */
 if(f[4]&&f[4].ko&&!f[4].single&&f[4].leg===1){}
 autoAdvance();
 if(window.mcSeasonOver()){const t=table(L),pos=t.findIndex(x=>x.name===career.club)+1;
  career.inbox.unshift(`Terminó la temporada ${career.season}/${String(career.season+1).slice(-2)} de ${leagueName(L.country)}. ${L.champs.length?L.champs.map(x=>x.title+': '+x.name).join(' · '):t[0].name+' es campeón.'} ${career.club} terminó ${pos}º.`)}
 return true};
window.fixtureHTML=function(){const L=ensure(),c=current();
 if(!c){const t=table(L),pos=t.findIndex(x=>x.name===career.club)+1;
  return `<div class="fixture"><div class="clubtitle" style="text-align:center">🏆 Temporada finalizada</div><p class="tiny" style="text-align:center;margin:6px 0">${L.champs.length?L.champs.map(x=>esc(x.title)+': <b class="gold">'+esc(x.name)+'</b>').join(' · '):'Campeón: <b class="gold">'+esc(t[0]?t[0].name:'-')+'</b>'} · ${esc(career.club)} terminó ${pos}º.</p><button class="btn secondary" style="width:100%" onclick="mcSeasonEndModal()">VER CIERRE DE TEMPORADA</button></div>`}
 const h=c.home,a=c.away;
 return `<div class="fixture"><div class="between"><div class="flex"><div>${clubBadge(h,36)}</div><div><div class="clubtitle">${esc(h)}</div><div class="tiny muted">LOCAL</div></div></div><b class="gold">VS</b><div class="flex"><div style="text-align:right"><div class="clubtitle">${esc(a)}</div><div class="tiny muted">VISITANTE</div></div><div>${clubBadge(a,36)}</div></div></div><div class="between tiny muted"><span>${esc(c.type==='ev'?c.label:c.label)}</span><span>${h===career.club?'DE LOCAL':'DE VISITANTE'}</span></div></div>`};
window.mcCompLabel=function(){const c=current();return c?c.label:''};
/* tablero: etiqueta de la fecha */
(function(){const o=window.renderDashboard;window.renderDashboard=function(){if(!career)return;ensure();
 /* el tablero 6.3 vuelve a validar la liga contra CLUBS: se le muestra la lista de esta temporada para que no la regenere */
 const cn=career.country,keep=CLUBS[cn];CLUBS[cn]=career.league.teams;try{o()}finally{CLUBS[cn]=keep}
 const L=career.league,c=current();
 const t=$('roundTag');if(t)t.textContent=!c?'TEMPORADA TERMINADA':c.type==='ev'?c.ev.short||'COPA':`FECHA ${career.round+1}/${Math.max(L.total||0,L.rounds.length)}`}})();
/* ---------- cierre de temporada ---------- */
window.mcSeasonEndModal=function(){const L=ensure(),t=table(L,L.fmt.apcl?{kinds:['A','C']}:undefined),pos=t.findIndex(x=>x.name===career.club)+1,me=t[pos-1]||{};
 const ch=L.champs.length?L.champs.map(x=>`<div class="statsrow"><span>${esc(x.title)}</span><b class="gold">${esc(x.name)}</b></div>`).join(''):`<div class="statsrow"><span>Campeón</span><b class="gold">${esc(t[0].name)}</b></div>`;
 const extra=window.mcSeasonSummaryHTML?mcSeasonSummaryHTML(career):'';
 openModal(`<div class="eyebrow">FIN DE TEMPORADA ${career.season}/${String(career.season+1).slice(-2)}</div><h2>🏆 ${esc(leagueName(L.country))}</h2>${ch}<div class="statsrow"><span>Posición final de ${esc(career.club)}${L.fmt.apcl?' (tabla anual)':''}</span><b>${pos}º</b></div><div class="statsrow"><span>Puntos</span><b>${me.pts}</b></div><div class="statsrow"><span>Récord</span><b>${me.g}G ${me.e}E ${me.p}P · ${me.gf}-${me.gc}</b></div>${extra}<p class="tiny">El plantel se mantiene; los jugadores cumplen un año y su GRL evoluciona según la edad.</p><button class="btn" style="width:100%" onclick="mcNewSeason()">INICIAR TEMPORADA ${career.season+1}/${String(career.season+2).slice(-2)} →</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">SEGUIR VIENDO LA TABLA</button>`)};
window.mcNewSeason=function(){if(!career)return;const L=ensure();
 if(window.mcSeasonEnd)try{mcSeasonEnd(career,L)}catch(e){console.error('mcSeasonEnd',e)}
 career.season++;career.round=0;career.league=null;
 career.played=career.w=career.d=career.l=career.gf=career.ga=career.points=0;match=null;GC.clear();ensure();
 career.inbox.unshift(`Comienza la temporada ${career.season}/${String(career.season+1).slice(-2)}. El nuevo calendario ya está disponible.`);
 save();closeModal();try{renderAll()}catch(e){}go('dashboard')};
/* ---------- pantalla de competición ---------- */
const formHTML=f=>f.slice(-5).map(x=>`<i class="mc-f ${x}">${x==='W'?'G':x==='D'?'E':'P'}</i>`).join('');
function zone(L,i,n){const f=L.fmt;if(f.rel&&i>=n-f.rel)return'rel';if(f.po&&i<f.po)return'po';return''}
function tblHTML(t,L,title,sub){const n=t.length;
 return `<div class="card"><h2>${esc(title)}</h2>${sub?`<p class="tiny">${sub}</p>`:''}<div class="mc-tw"><table class="table mc-tbl"><tr><th>#</th><th class="cl">Club</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr>${t.map((r,i)=>`<tr class="${r.name===career.club?'you':''} mc10-z-${zone(L,i,n)}"${r.grp!=null&&i&&t[i-1].grp!==r.grp?' style="border-top:2px solid var(--gold)"':''}><td>${i+1}</td><td class="cl"><span class="mc-cl">${clubBadge(r.name,18)}<span>${esc(r.name)}</span></span></td><td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.dg>0?'+':''}${r.dg}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table></div></div>`}
function poHTML(L){const blocks=[];const all=[];
 const push=(name,ties)=>blocks.push(`<div class="card"><div class="eyebrow">PLAYOFFS</div><h2>${esc(name)}</h2>${ties.filter(t=>!t.bye&&t.a!=null).map(t=>`<div class="mc-fx${(L.teams[t.a]===career.club||L.teams[t.b]===career.club)?' you':''}"><span class="mc-t h"><span>${esc(L.teams[t.a])}</span>${clubBadge(L.teams[t.a],18)}</span><b class="mc-s${t.w==null?' p':''}">${t.agg?t.agg[0]+' - '+t.agg[1]:'vs'}</b><span class="mc-t a">${clubBadge(L.teams[t.b],18)}<span>${esc(L.teams[t.b])}</span></span></div>${t.pen?`<div class="tiny muted" style="text-align:center">Penales ${t.pen[0]}-${t.pen[1]}</div>`:''}`).join('')||'<p class="tiny">Ronda sin partidos.</p>'}</div>`);
 if(L.poHist)L.poHist.forEach(h=>h.forEach(x=>push(x.name,x.ties)));
 if(L.po){L.po.hist.forEach(x=>push(x.name,x.ties));push(L.po.name+' (en juego)',L.po.ties)}
 return blocks.join('')}
function tableView(){const L=ensure(),f=L.fmt,lg=LEAGUES[L.country]||{},prog=`Fecha ${Math.min(career.round,L.rounds.length)} de ${Math.max(L.total||0,L.rounds.length)} · `;
 let html='';
 if(f.apcl){const h=curHalf(L);
  html+=tblHTML(table(L,{kinds:[h]}),L,`${lg.nombre} · ${h==='A'?'Apertura':'Clausura'}`,prog+esc(lg.formato||''));
  if(h==='C')html+=tblHTML(table(L,{kinds:['A']}),L,'Apertura (final)','');
  html+=tblHTML(table(L,{kinds:['A','C']}),L,'Tabla anual (acumulada)','Suma Apertura + Clausura. Se usa para descensos y clasificación internacional cuando corresponde.')}
 else html+=tblHTML(table(L),L,lg.nombre||leagueName(L.country),prog+esc(lg.formato||''));
 html+=poHTML(L);
 const me=table(L).find(x=>x.name===career.club);
 html+=`<div class="card"><p class="tiny">Puntos: 3 por victoria, 1 por empate. Desempate: diferencia de gol y goles a favor.${f.rel?` Zona de descenso: últimos ${f.rel} (los clubes de segunda división se incorporarán cuando estén cargados; mientras tanto la liga mantiene sus participantes).`:' Sin descensos.'}${lg.ok===0?' <b>Formato adaptado para el simulador.</b>':''}</p>${me?`<div class="statsrow"><span>Forma de ${esc(career.club)}</span><span>${formHTML(me.form)||'—'}</span></div>`:''}${L.champs.length?L.champs.map(x=>`<div class="statsrow"><span>🏆 ${esc(x.title)}</span><b class="gold">${esc(x.name)}</b></div>`).join(''):''}</div>`;
 return html}
function calView(){const L=ensure(),u=L.teams.indexOf(career.club),cur=career.round,n=L.rounds.length,sel=Math.min(cur,n-1);
 const lab=r=>{const k=L.kinds[r];return k==='P'?'Playoff':k==='G'?'2ª fase':k==='A'?'Apertura':k==='C'?'Clausura':'Fecha'};
 const row=f=>{const h=L.teams[f[0]],a=L.teams[f[1]],mine=f[0]===u||f[1]===u,pl=f[2]!=null;
  return `<div class="mc-fx${mine?' you':''}"><span class="mc-t h"><span>${esc(h)}</span>${clubBadge(h,18)}</span><b class="mc-s${pl?'':' p'}">${pl?f[2]+' - '+f[3]:'vs'}</b><span class="mc-t a">${clubBadge(a,18)}<span>${esc(a)}</span></span></div>`};
 return `<div class="card"><div class="between"><h2>Calendario</h2><span class="tag">${n} FECHAS</span></div><p class="tiny">${esc(leagueName(L.country))} · ${L.teams.length} equipos. Tu club aparece resaltado. Las fases siguientes (grupos, Clausura, playoffs) se agregan cuando termina la anterior.</p>
 <select id="mcRoundSel" onchange="mcGoRound(+this.value)">${L.rounds.map((_,r)=>`<option value="${r}"${r===sel?' selected':''}>${r+1} · ${lab(r)}${r<cur?' · jugada':r===cur?' · próxima':''}</option>`).join('')}</select></div>`+
 L.rounds.map((d,r)=>`<div class="card mc-round${r===cur?' cur':''}" id="mcR${r}"><div class="between"><h2>${lab(r)} · ${r+1}</h2><span class="tag">${r<cur?'JUGADA':r===cur?'PRÓXIMA':'PENDIENTE'}</span></div>${d.length?d.map(row).join(''):'<p class="tiny">Sin partidos.</p>'}</div>`).join('')}
window.mcGoRound=function(r){const el=$('mcR'+r);if(el)window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-74,behavior:'smooth'})};
window.renderLeague=function(){if(!career)return;const L=ensure();autoAdvance();
 const h1=document.querySelector('#league h1');if(h1)h1.textContent=`Temporada ${career.season}/${String(career.season+1).slice(-2)}`;
 const box=$('leagueContent');if(!box)return;
 if(leagueView==='table')box.innerHTML=tableView()+(mcSeasonOver()?`<button class="btn x-go" onclick="mcSeasonEndModal()">🏆 CIERRE DE TEMPORADA</button>`:'');
 else if(leagueView==='calendar'){box.innerHTML=calView();const r=Math.min(career.round,L.rounds.length-1);if(r>0)setTimeout(()=>{const el=$('mcR'+r);if(el&&$('league').classList.contains('active'))window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-74})},30)}
 else if(leagueView==='scorers')box.innerHTML=window.mcScorersHTML?mcScorersHTML():`<div class="card"><h2>Goleadores del equipo</h2>${[...career.players].sort((a,b)=>b.goals-a.goals).slice(0,10).map(p=>`<div class="statsrow"><span>${esc(p.name)}</span><b>${p.goals} goles</b></div>`).join('')}</div>`;
 else box.innerHTML=window.mcCupsHTML?mcCupsHTML():'';
};
/* ---------- abrir partido: si no te toca jugar (fecha libre), se avanza solo ---------- */
(function(){const o=window.openMatch;window.openMatch=function(){if(!career){go('newcareer');return}
 if(!match||match.finished){autoAdvance();save()}return o.apply(this,arguments)}})();
/* rótulo de competición en la pantalla del partido */
(function(){const o=window.createMatch;window.createMatch=function(){const r=o.apply(this,arguments);if(match){const c=current();match.compLabel=c?c.label:'';match.ko=c?(c.type==='ev'?!!c.ev.ko:!!c.ko):false}return r}})();
(function(){const o=window.renderMatch;if(!o)return;window.renderMatch=function(){const r=o.apply(this,arguments);try{if(match&&match.compLabel){let el=$('mc10CompLbl');const host=$('match');if(!el&&host){el=document.createElement('div');el.id='mc10CompLbl';el.className='tiny gold';el.style.cssText='text-align:center;letter-spacing:.08em;font-weight:800;margin:2px 0 6px';host.insertBefore(el,host.firstChild)}if(el)el.textContent=match.compLabel.toUpperCase()}}catch(e){}return r}})();
/* ---------- utilidades para otros módulos ---------- */
window.MC10L={rng,hash,poisson,simScore,pens,rr,circle,bracketOrder,PONAME,table,ensure,autoAdvance,current,grl:TG};
})();
