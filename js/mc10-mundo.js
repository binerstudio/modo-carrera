/* ===== MODO CARRERA 10.0 · MUNDO =====
   Base global por carrera (traspasos, paso del tiempo), copas nacionales, competiciones continentales,
   selecciones nacionales, entrenadores, coeficientes/rankings, estadísticas e historial.
   Todo se guarda dentro de la carrera (career.world), así cada partida tiene su propio mundo.
*/
(function(){
'use strict';
const L10=window.MC10L;if(!L10){console.warn('MC10: falta mc10-liga.js');return}
const {rng,hash,simScore,pens,rr,bracketOrder}=L10;
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BASE_SEASON=2026;
const W=()=>{if(!career.world)career.world={};const w=career.world;
 w.moves=w.moves||{};w.retired=w.retired||{};w.coaches=w.coaches||{};w.coachPool=w.coachPool||null;w.coachLog=w.coachLog||[];
 w.coef=w.coef||{};w.ctry=w.ctry||null;w.hist=w.hist||[];w.nt=w.nt||null;w.ntHist=w.ntHist||[];w.stats=w.stats||{};w.finals=w.finals||{};w.comps=w.comps||null;w.loans=w.loans||[];w.v=1;return w};
window.mcWorld=()=>career?W():null;
const countryOfClub=(()=>{let m=null;return c=>{if(!m){m=new Map();for(const k in CLUBS)CLUBS[k].forEach(x=>{if(!m.has(x))m.set(x,k)})}return m.get(c)||null}})();
window.mcCountryOf=countryOfClub;
/* =========================================================
   1) BASE GLOBAL POR CARRERA: traspasos, edad, evolución y retiros
   ========================================================= */
function yearsIn(){return career?Math.max(0,(career.season||BASE_SEASON)-BASE_SEASON):0}
/* evolución determinística del GRL con la edad (sin azar para que sea estable entre recargas) */
function evolve(base,age0,years,seed){let r=base;for(let y=1;y<=years;y++){const a=age0+y,h=(hash(seed+':'+y)%100)/100;
  const d=a<=20?2+Math.round(h*3):a<=23?1+Math.round(h*2):a<=27?Math.round(h*2-0.6):a<=30?Math.round(h*2-1.2):a<=33?-1-Math.round(h*2):-2-Math.round(h*3);r=clamp(r+d,35,94)}return r}
window.mcEvolve=evolve;
function valFor(r,a,v0,r0){const k=Math.pow(1.17,r-r0)*(a<=21?1.15:a<=24?1.05:a>=34?.45:a>=31?.7:1);return Math.max(.005,Math.round((v0||.05)*k*1000)/1000)}
let OV=null;
const origDB=window.mcDB;let MYD=null,MYK='';
const CAR=()=>window.__mcNoCareer?null:(typeof career!=='undefined'?career:null);
(function(){const o=window.mcResetDB;window.mcResetDB=function(){MYD=null;MYK='';IDX=null;NT=null;if(o)return o.apply(this,arguments)}})();
window.mcDB=function(){const car=CAR();const pre=car?car.id+'|'+car.season+'|'+((car.world&&car.world.mv)||0):'-';if(MYD&&MYK===pre)return MYD;
 const d=origDB();if(!d||!Array.isArray(d.list))return d;MYK=pre;MYD=d;
 if(!car){if(d._ov){d.list.forEach(o=>{if(o._b){Object.assign(o,o._b)}});d._ov=null;d.list=d.all||d.list;d.byId=new Map(d.list.map(p=>[p.id,p]))}return d}
 const career=car;const w=W(),key=pre;if(d._ov===key)return d;
 if(!d.all)d.all=d.list.slice();
 const yrs=yearsIn(),keep=[];
 d.all.forEach(o=>{if(!o._b)o._b={club:o.club,age:o.age,rating:o.rating,value:o.value,league:o.league};Object.assign(o,o._b);
  const k=o._n||fold(o.name);
  if(w.retired[k])return;
  if(w.moves[k])o.club=w.moves[k];
  if(yrs){o.age=o._b.age+yrs;o.rating=evolve(o._b.rating,o._b.age,yrs,o.name);o.value=valFor(o.rating,o.age,o._b.value,o._b.rating);if(o.age>=39)return}
  o.league=countryOfClub(o.club)||'Otras ligas';keep.push(o)});
 d.list=keep;d.byId=new Map(keep.map(p=>[p.id,p]));d._ov=key;IDX=null;return d};
function bump(){const w=W();w.mv=(w.mv||0)+1;IDX=null;try{mcClearGRL()}catch(e){}}
window.mcMovePlayer=function(name,club){const w=W();w.moves[fold(name)]=club;bump()};
/* plantel de un club: base + traspasos de la carrera, sin los que están en tu plantel, ordenado (XI 4-3-3, banco, reservas) */
let IDX=null,IDXK='';
function index(){const career=CAR();const k=(career?career.id+'|'+career.season+'|'+((career.world&&career.world.mv)||0)+'|'+(career.mkt&&career.mkt.extra?career.mkt.extra.length:0)+'|'+career.players.length+'|'+Object.keys(career.mkt&&career.mkt.gone||{}).length:'-');
 if(IDX&&IDXK===k)return IDX;const d=window.mcDB();IDXK=k;IDX=new Map();
 const mine=new Set(career?career.players.map(p=>fold(p.name)):[]),gone=career&&career.mkt?career.mkt.gone||{}:{};
 d.list.forEach(o=>{if(mine.has(o._n||fold(o.name)))return;if(gone[o.id]&&!(career&&career.world&&career.world.moves[o._n||fold(o.name)]))return;
  const mv=career&&career.world&&career.world.moves[o._n||fold(o.name)];const club=mv||o.club;
  let a=IDX.get(club);if(!a)IDX.set(club,a=[]);a.push([o.name,o.pos,o.rating,o.age,o.nat==='—'?null:o.nat,o.value,o.number])});
 if(career&&career.mkt)(career.mkt.extra||[]).forEach(x=>{if(!x||!x.club||mine.has(fold(x.name)))return;let a=IDX.get(x.club);if(!a)IDX.set(x.club,a=[]);if(!a.some(r=>fold(r[0])===fold(x.name)))a.push([x.name,x.pos,x.rating,x.age,x.nat,x.value,null])});
 IDX.forEach((a,c)=>IDX.set(c,orderXI(a)));return IDX}
function orderXI(all){const g=p=>all.filter(x=>x[1]===p).sort((a,c)=>c[2]-a[2]);const need={POR:1,DEF:4,MED:3,DEL:3},xi=[],used=new Set();
 ['POR','DEF','MED','DEL'].forEach(k=>g(k).slice(0,need[k]).forEach(x=>{xi.push(x);used.add(x)}));
 const rest=all.filter(x=>!used.has(x)).sort((a,c)=>c[2]-a[2]);
 while(xi.length<11&&rest.length){const x=rest.shift();xi.push(x);used.add(x)}
 const bench=[];const gk=rest.find(x=>x[1]==='POR');if(gk)bench.push(gk);rest.forEach(x=>{if(bench.length<7&&!bench.includes(x))bench.push(x)});
 return[...xi,...bench,...rest.filter(x=>!bench.includes(x))]}
window.mcOrderXI=orderXI;
const origRoster=window.rosterFor;
window.rosterFor=function(club){try{const a=index().get(club);if(a)return a.map(r=>r.slice());const c=CAR();if(c&&club===c.club)return[]}catch(e){console.error(e)}
 return orderXI((origRoster?origRoster(club):[]).slice())};
/* el plantel inicial de una carrera nueva también sale ordenado */
(function(){const o=window.defaultPlayers;window.defaultPlayers=function(club){const p=o(club);try{const rows=orderXI(p.map(x=>[x.name,x.pos,x.rating,x]));const out=rows.map(r=>r[3]);out.forEach((x,i)=>{x.id=i+1});return out}catch(e){return p}}})();
/* =========================================================
   2) TABLAS FINALES DE LAS DEMÁS LIGAS (simuladas, reproducibles)
   ========================================================= */
const FT={};
function finalTable(country,season,frac){const key=(career?career.id:'')+'|'+country+'|'+season+'|'+(frac||1);if(FT[key])return FT[key];
 const teams=(CLUBS[country]||[]).slice();if(teams.length<2)return[];
 const R=rng(hash(country+season+(career?career.id:'')));const f=window.mcLeagueFmt(country);const days=rr(teams,teams[0],f.apcl?f.legs*2:f.legs,0);
 const lim=Math.round(days.length*(frac==null?1:frac));
 const T=new Map(teams.map(t=>[t,{name:t,pj:0,pts:0,gf:0,gc:0,g:0,e:0,p:0}]));
 days.slice(0,lim).forEach(d=>d.forEach(([h,a])=>{const s=simScore(h,a,R);const H=T.get(h),A=T.get(a);H.pj++;A.pj++;H.gf+=s[0];H.gc+=s[1];A.gf+=s[1];A.gc+=s[0];
  if(s[0]>s[1]){H.pts+=3;H.g++;A.p++}else if(s[0]<s[1]){A.pts+=3;A.g++;H.p++}else{H.pts++;A.pts++;H.e++;A.e++}}));
 const out=[...T.values()].map(r=>({...r,dg:r.gf-r.gc})).sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf);FT[key]=out;return out}
window.mcFinalTable=finalTable;
/* tabla final real de la temporada anterior (tu liga) o simulada (las demás). Primera temporada: simulación por fuerza (adaptación). */
function standings(country,season){const w=W();const fin=w.finals[season]&&w.finals[season][country];if(fin)return fin.map(n=>({name:n}));return finalTable(country,season)}
/* =========================================================
   3) MOTOR GENÉRICO DE TORNEOS (copas y continentales)
   ========================================================= */
const KO_NAMES={2:'Final',4:'Semifinales',8:'Cuartos de final',16:'Octavos de final',32:'Dieciseisavos de final',64:'Treintaidosavos de final',128:'Ronda de 128'};
function koName(n){return KO_NAMES[n]||('Ronda de '+n)}
function shuffle(a,R){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* planificación de fechas: reparte las fechas del torneo entre las fechas de liga del usuario */
function planDates(n,start,end){const out=[];for(let i=0;i<n;i++)out.push(Math.round(start+(end-start)*(n===1?0.5:i/(n-1))));return out}
function leagueSpan(){const L=career.league;return Math.max(6,(L&&L.total)||38)}
/* stage KO: equipos (en orden de siembra) → cruces; con número no potencia de 2 hay ronda previa para los peor sembrados */
function koStage(name,teams,legs,at,opts){opts=opts||{};let P=1;while(P*2<=teams.length)P*=2;
 if(P===teams.length||opts.noPrelim){const pairs=[];const seeded=opts.draw?shuffle(teams,opts.R||Math.random):teams;
  if(opts.seedPairs){const ord=bracketOrder(P);for(let i=0;i<P;i+=2)pairs.push({a:seeded[ord[i]-1],b:seeded[ord[i+1]-1],legs:[],w:null})}
  else for(let i=0;i<seeded.length;i+=2)pairs.push({a:seeded[i],b:seeded[i+1],legs:[],w:null});
  return{type:'ko',name:name||koName(teams.length),legs,at,ties:pairs,neutral:!!opts.neutral}}
 /* ronda previa */const extra=teams.length-P,direct=teams.slice(0,teams.length-extra*2),pre=teams.slice(teams.length-extra*2);
 const ties=[];for(let i=0;i<pre.length/2;i++)ties.push({a:pre[i],b:pre[pre.length-1-i],legs:[],w:null});
 return{type:'ko',name:'Ronda previa',legs,at,ties,direct,neutral:false}}
function grpStage(name,groups,legs,at,adv){const fx=[];groups.forEach((g,gi)=>{const days=rr(g,g[0],legs,0);days.forEach((d,md)=>d.forEach(([h,a])=>fx.push({g:gi,md,h,a,gh:null,ga:null})))});
 return{type:'grp',name,groups,legs,at,fx,adv:adv||2,mds:Math.max(...groups.map(g=>(g.length%2?g.length:g.length-1)*legs))}}
function swissStage(name,teams,mds,at,R){/* fase liga tipo Champions: cada equipo juega mds partidos contra rivales distintos */
 const fx=[],met=new Set(),cnt=new Map(teams.map(t=>[t,{h:0,a:0}]));
 for(let md=0;md<mds;md++){let ok=false;for(let tries=0;tries<60&&!ok;tries++){const pool=shuffle(teams,R),pairs=[];const used=new Set();ok=true;
   for(const t of pool){if(used.has(t))continue;const o=pool.find(x=>x!==t&&!used.has(x)&&!met.has(t+'|'+x));if(!o){ok=false;break}used.add(t);used.add(o);pairs.push(cnt.get(t).h<=cnt.get(o).h?[t,o]:[o,t])}
   if(ok){pairs.forEach(([h,a])=>{met.add(h+'|'+a);met.add(a+'|'+h);cnt.get(h).h++;cnt.get(a).a++;fx.push({g:0,md,h,a,gh:null,ga:null})})}}
  if(!ok){const pool=shuffle(teams,R);for(let i=0;i+1<pool.length;i+=2)fx.push({g:0,md,h:pool[i],a:pool[i+1],gh:null,ga:null})}}
 return{type:'grp',swiss:true,name,groups:[teams],legs:1,at,fx,mds,adv:0}}
function grpTable(st,gi){const T=new Map(st.groups[gi].map(t=>[t,{name:t,pj:0,pts:0,gf:0,gc:0,g:0,e:0,p:0}]));
 st.fx.forEach(f=>{if(f.g!==gi||f.gh==null)return;const H=T.get(f.h),A=T.get(f.a);H.pj++;A.pj++;H.gf+=f.gh;H.gc+=f.ga;A.gf+=f.ga;A.gc+=f.gh;
  if(f.gh>f.ga){H.pts+=3;H.g++;A.p++}else if(f.gh<f.ga){A.pts+=3;A.g++;H.p++}else{H.pts++;A.pts++;H.e++;A.e++}});
 return[...T.values()].map(r=>({...r,dg:r.gf-r.gc})).sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf||(window.mcTeamGRL(b.name)-window.mcTeamGRL(a.name)))}
window.mcGrpTable=grpTable;
/* fechas (índices de plan) de un stage */
function stageDates(st){return st.type==='ko'?st.legs:st.mds}
function userIn(st,club){if(st.type==='ko')return st.ties.some(t=>t.a===club||t.b===club);return st.groups.some(g=>g.includes(club))}
/* fixtures pendientes de una fecha de un stage: devuelve lista de objetos con referencias */
function dateFixtures(st,di){if(st.type==='ko'){return st.ties.filter(t=>t.w==null&&t.b!=null).map(t=>{const home=st.legs===1?t.a:(di===0?t.b:t.a),away=home===t.a?t.b:t.a;return{t,di,home,away,done:!!t.legs[di]}})}
 return st.fx.filter(f=>f.md===di).map(f=>({f,home:f.h,away:f.a,done:f.gh!=null}))}
function setResult(st,fx,gh,ga,pen){if(fx.t){fx.t.legs[fx.di]=[fx.home,fx.away,gh,ga,pen||null]}else{fx.f.gh=gh;fx.f.ga=ga}}
function simFixture(comp,st,fx){const s=simScore(fx.home,fx.away,null,st.neutral&&st.legs===1);let pen=null;
 if(fx.t&&(st.legs===1||fx.di===1)){const agg=aggOf(fx.t,s,fx);if(agg[0]===agg[1])pen=pens(fx.home,fx.away)}
 setResult(st,fx,s[0],s[1],pen);stat(comp,fx.home,fx.away,s[0],s[1])}
function aggOf(t,s,fx){let a=0,b=0;t.legs.forEach((x,i)=>{if(!x||i===fx.di)return;if(x[0]===t.a){a+=x[2];b+=x[3]}else{b+=x[2];a+=x[3]}});if(fx.home===t.a){a+=s[0];b+=s[1]}else{b+=s[0];a+=s[1]}return[a,b]}
function resolveKO(st){st.ties.forEach(t=>{if(t.w!=null)return;if(t.b==null){t.w=t.a;return}let a=0,b=0;t.legs.forEach(x=>{if(!x)return;if(x[0]===t.a){a+=x[2];b+=x[3]}else{b+=x[2];a+=x[3]}});t.agg=[a,b];
 if(a!==b)t.w=a>b?t.a:t.b;else{const last=t.legs[t.legs.length-1];const p=last[4]||pens(last[0],last[1]);t.pen=p;t.w=p[0]>p[1]?last[0]:last[1]}})}
/* coeficientes: 2 por victoria, 1 por empate, +1 por cada ronda superada */
function stat(comp,h,a,gh,ga){if(comp.kind!=='cont')return;const w=W(),s=career.season;const add=(c,p)=>{const o=w.coef[c]=w.coef[c]||{};o[s]=(o[s]||0)+p};
 if(gh>ga)add(h,2);else if(gh<ga)add(a,2);else{add(h,1);add(a,1)}}
/* =========================================================
   4) DEFINICIÓN DE TORNEOS
   ========================================================= */
const UEFA_RANK=['Inglaterra','Italia','España','Alemania','Francia','Países Bajos','Portugal','Bélgica','Chequia','Turquía','Grecia','Polonia','Dinamarca','Noruega','Suiza','Austria','Israel','Escocia','Chipre','Suecia','Croacia','Serbia','Ucrania','Hungría','Eslovenia','Rumanía','Bulgaria','Eslovaquia','Azerbaiyán','Kazajistán','Moldavia','Bosnia y Herzegovina','Irlanda','Armenia','Kosovo','Islandia','Finlandia','Letonia','Lituania','Albania','Georgia','Malta','Islas Feroe','Luxemburgo','Bielorrusia','Macedonia del Norte','Montenegro','Estonia','Gibraltar','Gales','Irlanda del Norte','Andorra','San Marino','Liechtenstein'];
const AFC_RANK=['Japón','Arabia Saudita','Corea del Sur','Qatar','Emiratos Árabes Unidos','Irán','China','Australia','Uzbekistán','Tailandia','Irak','Malasia','Jordania','Indonesia','Vietnam','India','Kuwait','Baréin','Omán','Singapur','Siria','Tayikistán','Hong Kong','Kirguistán','Turkmenistán','Filipinas','Camboya','Myanmar','Líbano','Palestina','Bangladesh','Nepal','Maldivas','Laos','Mongolia','Brunéi','Bután','Macao','Taiwán','Timor Oriental','Corea del Norte','Afganistán','Pakistán','Sri Lanka','Yemen','Guam','Islas Marianas del Norte'];
const CAF_RANK=['Egipto','Marruecos','Argelia','Sudáfrica','Túnez','RD Congo','Tanzania','Costa de Marfil','Angola','Nigeria','Libia','Sudán','Guinea','Ghana','Senegal','Mali','Malí','Zambia','Camerún','Burkina Faso','Kenia','Uganda','Zimbabue','Ruanda','Benín','Botsuana','Mozambique','Malaui','Gabón','Congo','Etiopía','Namibia','Togo','Níger','Gambia','Sierra Leona','Liberia','Mauritania','Lesoto','Esuatini','Burundi','Madagascar','Guinea Ecuatorial','Cabo Verde','Comoras','Guinea-Bisáu','Somalia','República Centroafricana','Chad','Sudán del Sur','Eritrea','Seychelles','Mauricio','Santo Tomé y Príncipe','Yibuti'];
/* ranking de países dinámico: coeficiente de los últimos 5 años; se ordena por puntos y, a igualdad, por el ranking inicial */
function countryRank(list){const w=W();const s=career.season;const pts=c=>{let t=0;for(let y=s-5;y<s;y++){const v=w.ctry&&w.ctry[c]&&w.ctry[c][y];if(v)t+=v}return t};
 return list.filter(c=>CLUBS[c]&&CLUBS[c].length>=4).map((c,i)=>({c,i,p:pts(c)})).sort((a,b)=>b.p-a.p||a.i-b.i).map(x=>x.c)}
window.mcCountryRank=conf=>countryRank(conf==='UEFA'?UEFA_RANK:conf==='AFC'?AFC_RANK:conf==='CAF'?CAF_RANK:[]);
/* toma n clubes de un país a partir de cierta posición, salteando los ya clasificados */
function take(country,season,n,used,from){const t=standings(country,season-1).map(r=>r.name);const out=[];for(let i=(from||0);i<t.length&&out.length<n;i++){if(!used.has(t[i])&&CLUBS[country].includes(t[i])){out.push(t[i]);used.add(t[i])}}return out}
function contDefs(season){const used=new Set(),defs=[];const S=season;
 /* --- UEFA (adaptado: sin rondas previas; los cupos salen del ranking de países) --- */
 const ur=countryRank(UEFA_RANK).filter(c=>c!=='Rusia');
 const ucl=[],uel=[],uecl=[];const ucS=[5,5,4,4,3,2,2,1,1,1,1,1,1,1];
 ur.forEach((c,i)=>{ucl.push(...take(c,S,ucS[i]||0,used))});ur.slice(14).forEach(c=>{if(ucl.length<36)ucl.push(...take(c,S,1,used))});
 ur.forEach((c,i)=>{const n=i<5?2:i<15?1:0;uel.push(...take(c,S,n,used))});ur.forEach(c=>{if(uel.length<36)uel.push(...take(c,S,1,used))});
 ur.forEach(c=>{if(uecl.length<36)uecl.push(...take(c,S,1,used))});ur.forEach(c=>{if(uecl.length<36)uecl.push(...take(c,S,1,used))});
 defs.push({id:'ucl',name:'UEFA Champions League',short:'CHAMPIONS',conf:'UEFA',teams:ucl.slice(0,36),fmt:'swiss',lvl:3},
  {id:'uel',name:'UEFA Europa League',short:'EUROPA LEAGUE',conf:'UEFA',teams:uel.slice(0,36),fmt:'swiss',lvl:2},
  {id:'uecl',name:'UEFA Conference League',short:'CONFERENCE',conf:'UEFA',teams:uecl.slice(0,36),fmt:'swiss',lvl:1});
 /* --- CONMEBOL (cupos por país; Argentina sin tocar su liga) --- */
 const LIB={Brasil:7,Argentina:6,Uruguay:3,Paraguay:3,Colombia:3,Ecuador:3,Chile:2,'Perú':2,Bolivia:2,Venezuela:1},SUD={Brasil:6,Argentina:6,Colombia:3,Ecuador:3,Uruguay:3,Paraguay:3,Chile:2,'Perú':2,Bolivia:2,Venezuela:2};
 const lib=[],sud=[];Object.keys(LIB).forEach(c=>{if(CLUBS[c])lib.push(...take(c,S,LIB[c],used))});Object.keys(SUD).forEach(c=>{if(CLUBS[c])sud.push(...take(c,S,SUD[c],used))});
 defs.push({id:'lib',name:'Copa Libertadores',short:'LIBERTADORES',conf:'CONMEBOL',teams:lib.slice(0,32),fmt:'g32',lvl:3},{id:'sud',name:'Copa Sudamericana',short:'SUDAMERICANA',conf:'CONMEBOL',teams:sud.slice(0,32),fmt:'g32',lvl:2});
 /* --- AFC --- */
 const ar=countryRank(AFC_RANK);const ae=[],a2=[],ac=[];const aeS=[3,3,3,3,2,2,2,1,1,1,1,1,1];
 ar.forEach((c,i)=>ae.push(...take(c,S,aeS[i]||0,used)));ar.forEach(c=>{if(ae.length<24)ae.push(...take(c,S,1,used))});
 ar.slice(0,16).forEach(c=>{a2.push(...take(c,S,1,used))});ar.forEach(c=>{if(a2.length<32)a2.push(...take(c,S,1,used))});
 ar.slice(16).forEach(c=>{if(ac.length<16)ac.push(...take(c,S,1,used))});
 defs.push({id:'acle',name:'AFC Champions League Elite',short:'ACL ELITE',conf:'AFC',teams:ae.slice(0,24),fmt:'swiss8',lvl:3},{id:'acl2',name:'AFC Champions League Two',short:'ACL TWO',conf:'AFC',teams:a2.slice(0,32),fmt:'g32',lvl:2},{id:'aclc',name:'AFC Challenge League',short:'AFC CHALLENGE',conf:'AFC',teams:ac.slice(0,16),fmt:'g16',lvl:1});
 /* --- CAF --- */
 const cr=countryRank(CAF_RANK);const ccl=[],ccc=[];cr.forEach(c=>{if(ccl.length<16)ccl.push(...take(c,S,1,used))});cr.slice(0,12).forEach(c=>{if(ccl.length<16)ccl.push(...take(c,S,1,used))});
 cr.forEach(c=>{if(ccc.length<16)ccc.push(...take(c,S,1,used))});
 defs.push({id:'cafcl',name:'CAF Champions League',short:'CAF CHAMPIONS',conf:'CAF',teams:ccl.slice(0,16),fmt:'g16',lvl:3},{id:'cafcc',name:'CAF Confederation Cup',short:'CAF CONFED.',conf:'CAF',teams:ccc.slice(0,16),fmt:'g16',lvl:2});
 /* --- CONCACAF --- */
 const ccu=[];[['México',5],['Estados Unidos',5],['Canadá',1],['Costa Rica',1],['Honduras',1],['Guatemala',1],['Panamá',1],['El Salvador',1],['Jamaica',1]].forEach(([c,n])=>{if(CLUBS[c])ccu.push(...take(c,S,n,used))});
 [['Estados Unidos',1],['México',1]].forEach(([c,n])=>{if(ccu.length<16)ccu.push(...take(c,S,n,used))});
 const cac=[];[['Costa Rica',3],['Honduras',3],['Guatemala',3],['Panamá',3],['El Salvador',2],['Nicaragua',1],['Belice',1]].forEach(([c,n])=>{if(CLUBS[c])cac.push(...take(c,S,n,used))});
 const car=[];[['Jamaica',2],['Haití',2],['República Dominicana',2],['Surinam',1],['Trinidad y Tobago',1],['Puerto Rico',1],['Curazao',1]].forEach(([c,n])=>{if(CLUBS[c])car.push(...take(c,S,n,used))});
 defs.push({id:'ccc',name:'CONCACAF Champions Cup',short:'CONCACAF CHAMPIONS',conf:'CONCACAF',teams:ccu.slice(0,16),fmt:'ko2',lvl:3},{id:'cacc',name:'Concacaf Central American Cup',short:'COPA CENTROAMERICANA',conf:'CONCACAF',teams:cac.slice(0,16),fmt:'ko2',lvl:2},{id:'cacb',name:'Concacaf Caribbean Cup',short:'COPA DEL CARIBE',conf:'CONCACAF',teams:car,fmt:'ko2',lvl:2});
 /* --- OFC --- */
 const ofc=[];[['Nueva Zelanda',2],['Tahití',1],['Fiyi',1],['Nueva Caledonia',1],['Islas Salomón',1],['Vanuatu',1],['Papúa Nueva Guinea',1]].forEach(([c,n])=>{if(CLUBS[c])ofc.push(...take(c,S,n,used))});
 defs.push({id:'ofccl',name:'OFC Champions League',short:'OFC CHAMPIONS',conf:'OFC',teams:ofc.slice(0,8),fmt:'g8',lvl:3});
 return defs.filter(d=>d.teams.length>=4)}
/* construye la primera fase de un torneo continental */
function firstStage(d,R,dates){const t=d.teams;
 if(d.fmt==='swiss'||d.fmt==='swiss8'){const n=t.length,mds=d.fmt==='swiss'?8:Math.min(8,n-1);return swissStage('Fase liga',t,mds,dates.slice(0,mds),R)}
 if(d.fmt==='g32'||d.fmt==='g16'||d.fmt==='g8'){const ng=Math.max(2,Math.floor(t.length/4));const sh=t.slice(0,ng*4);const pots=[0,1,2,3].map(p=>shuffle(sh.slice(p*ng,(p+1)*ng),R));
  const groups=[...Array(ng)].map((_,g)=>pots.map(p=>p[g]));return grpStage('Fase de grupos',groups,2,dates.slice(0,6),2)}
 return koStage(null,t,2,dates.slice(0,2),{seedPairs:true})}
function compSchedule(d){/* fechas planificadas totales para todo el torneo */
 const n=d.fmt==='swiss'?8+2+2+2+2+1:d.fmt==='swiss8'?8+2+2+2+1:d.fmt.startsWith('g')?6+2+2+2+1:2*Math.ceil(Math.log2(Math.max(2,d.teams.length)))+1;return n}
function makeComp(d,kind,season){const R=rng(hash(d.id+season+(career?career.id:'')));const span=leagueSpan(),start=Math.max(career.round||0,Math.round(span*.08)),end=Math.max(start+2,Math.round(span*.94));
 const plan=planDates(compSchedule(d),start,end);
 const c={id:d.id,kind,name:d.name,short:d.short,conf:d.conf||null,country:d.country||null,season,teams:d.teams.slice(),fmt:d.fmt,plan,pi:0,stages:[],si:0,champ:null,runner:null,lvl:d.lvl||1};
 const st=firstStage(d,R,plan);c.pi=st.type==='ko'?st.legs:st.mds;c.stages.push(st);return c}
/* copa nacional: eliminación directa a partido único (final en cancha neutral) */
function makeCup(country,season,name,idx){const teams=(CLUBS[country]||[]).slice();if(career.country===country&&!teams.includes(career.club))teams.push(career.club);
 const R=rng(hash(country+name+season+career.id));const ord=teams.slice().sort((a,b)=>window.mcTeamGRL(b)-window.mcTeamGRL(a));
 let P=1;while(P*2<=ord.length)P*=2;const rounds=Math.log2(P)+(P<ord.length?1:0);
 const span=leagueSpan(),start=Math.max(career.round||0,Math.round(span*(.12+idx*.03))),end=Math.max(start+1,Math.round(span*(.9-idx*.03)));
 const plan=planDates(rounds,start,end);
 const c={id:'cup'+idx,kind:'cup',name,short:name.toUpperCase(),country,season,teams:ord,fmt:'cup',plan,pi:0,stages:[],si:0,champ:null,runner:null};
 const st=koStage(null,shuffle(ord,R),1,[plan[0]],{});c.pi=1;c.stages.push(st);return c}
/* avanza al siguiente stage cuando el actual terminó */
function nextStage(c){const st=c.stages[c.si];const R=rng(hash(c.id+c.season+c.si));
 const at=n=>{const a=c.plan.slice(c.pi,c.pi+n);while(a.length<n)a.push((a[a.length-1]||c.plan[c.plan.length-1]||0)+1);c.pi+=n;return a};
 let q=[];
 if(st.type==='grp'&&st.swiss){const t=grpTable(st,0).map(r=>r.name);
  if(c.fmt==='swiss'){const top=t.slice(0,8),po=t.slice(8,24);c.stages.push(koStage('Playoffs de eliminación',po,2,at(2),{seedPairs:true,noPrelim:true}));c.waitTop=top;c.si++;return true}
  q=t.slice(0,c.fmt==='swiss8'?8:16)}
 else if(st.type==='grp'){const firsts=[],seconds=[];st.groups.forEach((g,gi)=>{const t=grpTable(st,gi);firsts.push(t[0].name);seconds.push(t[1].name)});q=[];firsts.forEach((f,i)=>{q.push(f)});seconds.reverse().forEach(s=>q.push(s));
  const pairs=[];for(let i=0;i<firsts.length;i++)pairs.push(firsts[i],seconds[i]);q=pairs;
  c.stages.push({type:'ko',name:koName(q.length),legs:2,at:at(2),ties:chunk(q).map(([a,b])=>({a,b,legs:[],w:null}))});c.si++;return true}
 else if(st.type==='ko'){resolveKO(st);let w=st.ties.map(t=>t.w);
  if(st.direct){w=st.direct.concat(w)}
  if(c.waitTop){const top=c.waitTop;c.waitTop=null;const ties=top.map((t,i)=>({a:t,b:w[i]||w[0],legs:[],w:null}));c.stages.push({type:'ko',name:'Octavos de final',legs:2,at:at(2),ties});c.si++;return true}
  if(w.length===1){c.champ=w[0];const last=st.ties[0];c.runner=last.a===c.champ?last.b:last.a;return false}
  q=w;const isFinal=q.length===2,legs=c.kind==='cup'||isFinal?1:2;
  c.stages.push({type:'ko',name:koName(q.length),legs,at:at(legs),ties:chunk(c.kind==='cup'?shuffle(q,R):q).map(([a,b])=>({a,b,legs:[],w:null})),neutral:isFinal});c.si++;return true}
 if(q.length){c.stages.push({type:'ko',name:koName(q.length),legs:2,at:at(2),ties:chunk(q,true).map(([a,b])=>({a,b,legs:[],w:null}))});c.si++;return true}
 return false}
function chunk(a,cross){const out=[];if(cross){for(let i=0;i<a.length/2;i++)out.push([a[i],a[a.length-1-i]])}else for(let i=0;i<a.length;i+=2)out.push([a[i],a[i+1]]);return out}
/* procesa un torneo: simula todo lo que ya pasó y no involucra a tu club */
function tickComp(c,force){let guard=0;while(guard++<40&&!c.champ){const st=c.stages[c.si];if(!st)return;const n=stageDates(st);let blocked=false;
  for(let di=0;di<n;di++){if(!force&&st.at[di]>career.round){blocked=true;break}
   const fx=dateFixtures(st,di);let userPending=false;
   fx.forEach(x=>{if(x.done)return;if(!force&&(x.home===career.club||x.away===career.club)){userPending=true;return}simFixture(c,st,x)});
   if(userPending){blocked=true;break}}
  if(blocked)return;
  if(st.type==='ko')resolveKO(st);
  /* +1 de coeficiente por pasar de ronda */
  if(c.kind==='cont'&&st.type==='ko')st.ties.forEach(t=>{if(t.w){const o=W().coef[t.w]=W().coef[t.w]||{};o[career.season]=(o[career.season]||0)+1}});
  const more=nextStage(c);
  if(!more){if(c.champ){const user=c.champ===career.club;career.inbox.unshift(`🏆 ${c.champ} ganó la ${c.name} ${career.season}/${String(career.season+1).slice(-2)}.${user?' ¡Título para tu club!':''}`);if(user){career.board=Math.min(99,career.board+10);career.budget+=c.kind==='cont'?(c.lvl>=3?25:10):5}}return}}}
function userFxOf(c){if(c.champ)return null;const st=c.stages[c.si];if(!st)return null;const n=stageDates(st);
 for(let di=0;di<n;di++){const fx=dateFixtures(st,di).find(x=>!x.done&&(x.home===career.club||x.away===career.club));if(fx)return{st,fx,di,at:st.at[di]}}return null}
const compMod={
 pending(car){const w=W();if(!w.comps||w.comps.season!==car.season)return null;let best=null;
  w.comps.list.forEach((c,i)=>{const u=userFxOf(c);if(!u)return;if(!best||u.at<best.at)best={at:u.at,prio:i,home:u.fx.home,away:u.fx.away,ko:u.st.type==='ko',compId:c.id,
   label:`${c.name} · ${u.st.name}${u.st.type==='ko'&&u.st.legs===2?(u.di?' · vuelta':' · ida'):u.st.type==='grp'?' · fecha '+(u.di+1):''}`,short:c.short}});return best},
 record(car,ev,m){const c=W().comps.list.find(x=>x.id===ev.compId);if(!c)return;const u=userFxOf(c);if(!u)return;
  const gh=u.fx.home===car.club?m.h:m.a,ga=u.fx.home===car.club?m.a:m.h;let pen=null;
  if(u.fx.t&&(u.st.legs===1||u.di===1)){const agg=aggOf(u.fx.t,[gh,ga],u.fx);if(agg[0]===agg[1]){pen=pens(u.fx.home,u.fx.away);const mine=u.fx.home===car.club?pen[0]:pen[1],th=u.fx.home===car.club?pen[1]:pen[0];
   m.events&&m.events.push({lbl:'120',min:120,title:'🥅 DEFINICIÓN POR PENALES',msg:`${car.club} ${mine}-${th}. ${mine>th?'¡Pasa de ronda!':'Eliminado.'}`,key:true})}}
  setResult(u.st,u.fx,gh,ga,pen);stat(c,u.fx.home,u.fx.away,gh,ga);
  if(window.mcStatHookUser)try{mcStatHookUser(m,c.id)}catch(e){}
  if(u.fx.t&&(u.st.legs===1||u.di===1)){const t=u.fx.t;resolveKOone(t);if(t.w)car.inbox.unshift(`${c.name} · ${u.st.name}: ${t.w===car.club?'¡'+car.club+' avanza!':car.club+' quedó eliminado ante '+t.w+'.'}${t.agg&&u.st.legs===2?' Global '+t.agg[0]+'-'+t.agg[1]+'.':''}`)}},
 tick(car){ensureComps();W().comps.list.forEach(c=>tickComp(c,false))}};
function resolveKOone(t){let a=0,b=0;t.legs.forEach(x=>{if(!x)return;if(x[0]===t.a){a+=x[2];b+=x[3]}else{b+=x[2];a+=x[3]}});t.agg=[a,b];if(a!==b){t.w=a>b?t.a:t.b;return}const last=t.legs[t.legs.length-1];const p=last[4]||pens(last[0],last[1]);t.pen=p;t.w=p[0]>p[1]?last[0]:last[1]}
window.MC_COMPS.push(compMod);
/* crea las copas y torneos de la temporada (también para carreras guardadas de la 6.x) */
function ensureComps(){const w=W();if(w.comps&&w.comps.season===career.season)return w.comps;
 const list=[];const fmt=window.mcLeagueFmt(career.country);
 (fmt.cups||[]).slice(0,2).forEach((name,i)=>{if(!name||/Campe[oó]n de Campeones|Supercopa|Leagues Cup|Super Cup/i.test(name))return;list.push(makeCup(career.country,career.season,name,i))});
 try{contDefs(career.season).forEach(d=>{const c=makeComp(d,'cont',career.season);list.push(c)})}catch(e){console.error('contDefs',e)}
 /* supercopas continentales: campeones de la temporada anterior */
 const prev=w.hist.find(h=>h.season===career.season-1);
 if(prev&&prev.cont){const sup=[['ucl','uel','UEFA Super Cup','SUPERCOPA UEFA'],['lib','sud','Recopa Sudamericana','RECOPA'],['cafcl','cafcc','CAF Super Cup','SUPERCOPA CAF']];
  sup.forEach(([a,b,n,s])=>{const A=prev.cont[a],B=prev.cont[b];if(A&&B&&A!==B){const span=leagueSpan(),d=Math.max(career.round||0,Math.round(span*.05));list.push({id:'sup-'+a,kind:'cont',name:n,short:s,season:career.season,teams:[A,B],fmt:'final',plan:[d],pi:1,stages:[{type:'ko',name:'Final',legs:1,at:[d],ties:[{a:A,b:B,legs:[],w:null}],neutral:true}],si:0,champ:null,lvl:2})}})}
 w.comps={season:career.season,list};
 const mine=list.filter(c=>c.teams.includes(career.club));
 if(mine.length)career.inbox.unshift(`Esta temporada ${career.club} juega: ${mine.map(c=>c.name).join(', ')}.`);
 return w.comps}
window.mcEnsureComps=()=>career?ensureComps():null;
/* =========================================================
   5) ESTADÍSTICAS (goleadores, asistencias, vallas invictas)
   ========================================================= */
function statBox(comp){const w=W(),s=career.season;const b=w.stats[s]=w.stats[s]||{};return b[comp]=b[comp]||{g:{},a:{},cs:{}}}
function pickScorer(club,R){const r=window.rosterFor(club).slice(0,11);if(!r.length)return null;const wts=r.map(x=>x[1]==='DEL'?5:x[1]==='MED'?2.4:x[1]==='DEF'?.7:0.02);let t=wts.reduce((a,b)=>a+b,0)*R(),i=0;while(i<wts.length-1&&(t-=wts[i])>0)i++;return r[i]}
function pickAssist(club,R,not){const r=window.rosterFor(club).slice(0,11).filter(x=>x[0]!==not);if(!r.length)return null;const wts=r.map(x=>x[1]==='MED'?4:x[1]==='DEL'?3:x[1]==='DEF'?1.2:0.05);let t=wts.reduce((a,b)=>a+b,0)*R(),i=0;while(i<wts.length-1&&(t-=wts[i])>0)i++;return r[i]}
window.mcStatHook=function(h,a,gh,ga,comp){if(!career||comp!==career.country)return;const B=statBox('liga'),R=Math.random;
 const goal=(club,n)=>{for(let k=0;k<n;k++){const s=pickScorer(club,R);if(!s)continue;const e=B.g[s[0]]=B.g[s[0]]||[club,0];e[1]++;if(R()<.72){const as=pickAssist(club,R,s[0]);if(as){const x=B.a[as[0]]=B.a[as[0]]||[club,0];x[1]++}}}};
 goal(h,gh);goal(a,ga);
 const cs=(club,conc)=>{if(conc)return;const gk=window.rosterFor(club).find(x=>x[1]==='POR');if(gk){const e=B.cs[gk[0]]=B.cs[gk[0]]||[club,0];e[1]++}};cs(h,ga);cs(a,gh)};
window.mcStatHookUser=function(m,comp){const B=statBox(comp===career.country?'liga':'otras');
 Object.values(m.pst||{}).forEach(s=>{const club=s.side==='o'?career.club:m.away;if(s.gl){const e=B.g[s.name]=B.g[s.name]||[club,0];e[1]+=s.gl}if(s.a){const e=B.a[s.name]=B.a[s.name]||[club,0];e[1]+=s.a}});
 const gk=(side,conc)=>{if(conc)return;const s=Object.values(m.pst||{}).find(x=>x.side===side&&x.pos==='POR'&&x.on);if(s){const club=side==='o'?career.club:m.away;const e=B.cs[s.name]=B.cs[s.name]||[club,0];e[1]++}};gk('o',m.a);gk('r',m.h)};
/* =========================================================
   6) ENTRENADORES
   ========================================================= */
const STYLES=['Ofensivo','Equilibrado','Defensivo','Posesión','Contragolpe','Presión alta'],FORMS=['4-3-3','4-4-2','4-2-3-1','3-5-2','4-1-4-1','5-3-2','3-4-3'];
const NAMEPOOL={};
function namePool(country){if(NAMEPOOL[country])return NAMEPOOL[country];const d=window.mcDB();const fn=[],ln=[];
 d.list.forEach(o=>{if(o.nat!==country)return;const p=String(o.name).replace(/\s*\(.*\)$/,'').split(' ');if(p.length>=2&&p[0].length>2&&!/\./.test(p[0])){fn.push(p[0]);ln.push(p[p.length-1])}});
 return NAMEPOOL[country]={fn,ln}}
function genCoach(club,seed){const country=countryOfClub(club)||'Argentina';const pool=namePool(country),h=hash(seed||club);
 const fn=pool.fn.length?pool.fn[h%pool.fn.length]:'Carlos',ln=pool.ln.length?pool.ln[(h>>>8)%pool.ln.length]:'Gómez';
 const str=window.mcClubStrength?mcClubStrength(club):65;const lvl=clamp(Math.round(str-8+(h%17)),40,92);
 return{name:fn+' '+ln,nat:country,club,style:STYLES[h%STYLES.length],form:FORMS[(h>>>4)%FORMS.length],rep:clamp(Math.round(lvl+((h>>>12)%9)-4),30,95),lvl,contract:1+((h>>>16)%3),wage:Math.max(.05,Math.round(Math.pow(1.08,lvl-50)*.4*100)/100),since:career?career.season:BASE_SEASON,gen:true}}
function coachOf(club){const w=W();if(club===career.club)return{name:career.manager||'Vos',nat:'—',club,style:career.style||'Equilibrado',form:career.formation,rep:career.clubReputation||50,lvl:70,contract:3,wage:0,user:true};
 return w.coaches[club]||(w.coaches[club]=genCoach(club))}
window.mcCoachOf=c=>career?coachOf(c):null;
window.mcCoachBonus=function(club){if(!career||club===career.club)return 0;const w=career.world;const c=w&&w.coaches&&w.coaches[club];const lvl=c?c.lvl:null;if(lvl==null)return 0;return clamp((lvl-60)/20,-1,1.2)};
function coachPool(){const w=W();if(w.coachPool&&w.coachPool.length>=10)return w.coachPool;const pool=[];const cs=Object.keys(CLUBS).slice(0,80);
 for(let i=0;pool.length<30&&i<300;i++){const cn=cs[i%cs.length];const club=(CLUBS[cn]||[])[0];if(!club)continue;const c=genCoach(club,'libre'+i+career.id);c.club=null;c.lvl=clamp(c.lvl-3+(i%7),40,90);pool.push(c)}
 return w.coachPool=pool}
function fire(club,why){const w=W();const old=coachOf(club);const pool=coachPool();const str=window.mcClubStrength?mcClubStrength(club):65;
 const cand=pool.filter(c=>c.rep<=str+12).sort((a,b)=>b.lvl-a.lvl)[0]||pool[0];if(!cand)return;
 pool.splice(pool.indexOf(cand),1);old.club=null;pool.push(old);cand.club=club;cand.since=career.season;cand.contract=2;w.coaches[club]=cand;
 w.coachLog.unshift({season:career.season,round:career.round,club,out:old.name,in:cand.name,why});if(w.coachLog.length>200)w.coachLog.length=200;
 try{mcClearGRL()}catch(e){}return cand}
window.mcFireCoach=fire;
/* =========================================================
   7) SELECCIONES NACIONALES
   ========================================================= */
let NT=null,NTK='';
function ntPools(){const d=window.mcDB();const k=(career?career.id+'|'+career.season+'|'+(W().mv||0):'')+'|'+d.list.length;if(NT&&NTK===k)return NT;NTK=k;NT={};
 const mineByName=new Map((career?career.players:[]).map(p=>[fold(p.name),p]));
 const all=d.list.map(o=>({name:o.name,pos:o.pos,rating:o.rating,age:o.age,club:o.club,nat:o.nat})).concat((career?career.players:[]).map(p=>({name:p.name,pos:p.pos,rating:p.rating,age:p.age,club:career.club,nat:p.nat,mine:true})));
 const seen=new Set();all.forEach(o=>{const k=fold(o.name);if(seen.has(k)||!o.nat||o.nat==='—')return;seen.add(k);(NT[o.nat]=NT[o.nat]||[]).push(o)});
 for(const n in NT)NT[n].sort((a,b)=>b.rating-a.rating);return NT}
function ntSquad(nat){const p=(ntPools()[nat]||[]);const need={POR:3,DEF:9,MED:8,DEL:6},out=[];['POR','DEF','MED','DEL'].forEach(k=>p.filter(x=>x.pos===k).slice(0,need[k]).forEach(x=>out.push(x)));
 p.forEach(x=>{if(out.length<26&&!out.includes(x))out.push(x)});return out}
window.mcNTSquad=ntSquad;
function ntStrength(nat){const s=ntSquad(nat);const xi=orderXI(s.map(x=>[x.name,x.pos,x.rating])).slice(0,11);const n=xi.length;const base=n?xi.reduce((a,x)=>a+x[2],0)/n:45;return base-(11-n)*1.8}
function ntState(){const w=W();if(w.nt&&w.nt.v===1)return w.nt;const st={v:1,pts:{},coach:{},hist:[]};
 Object.keys(window.MC10?MC10.META:{}).forEach(c=>{st.pts[c]=Math.round(1000+(ntStrength(c)-55)*25)});w.nt=st;return st}
window.mcNTState=()=>career?ntState():null;
function ntCoach(nat){const st=ntState();if(!st.coach[nat]){const pool=namePool(nat),h=hash('nt'+nat+career.id);st.coach[nat]={name:(pool.fn.length?pool.fn[h%pool.fn.length]:'Luis')+' '+(pool.ln.length?pool.ln[(h>>>7)%pool.ln.length]:'Martínez'),form:FORMS[h%FORMS.length],style:STYLES[(h>>>5)%STYLES.length],gen:true}}return st.coach[nat]}
window.mcNTCoach=n=>career?ntCoach(n):null;
function ntSim(a,b,R,ko){const st=ntState();const sa=ntStrength(a)+(st.pts[a]-1000)/200,sb=ntStrength(b)+(st.pts[b]-1000)/200,d=sa-sb;R=R||Math.random;
 const p=l=>{const L=Math.exp(-l);let k=0,q=1;do{k++;q*=R()}while(q>L);return k-1};
 const g=[p(clamp(1.25*Math.exp(d*.06),.15,4)),p(clamp(1.25*Math.exp(-d*.06),.15,4))];let pen=null;
 if(ko&&g[0]===g[1]){pen=[3+Math.round(R()*2),3+Math.round(R()*2)];if(pen[0]===pen[1])pen[R()<.5?0:1]++}
 const ea=1/(1+Math.pow(10,(st.pts[b]-st.pts[a])/400)),res=g[0]>g[1]?1:g[0]<g[1]?0:pen?(pen[0]>pen[1]?.75:.25):.5,K=ko?40:30;
 st.pts[a]=Math.round(st.pts[a]+K*(res-ea));st.pts[b]=Math.round(st.pts[b]-K*(res-ea));return{g,pen}}
function ntRanking(conf){const st=ntState();return Object.keys(st.pts).filter(c=>!conf||MC10.confOf(c)===conf).sort((a,b)=>st.pts[b]-st.pts[a])}
window.mcNTRanking=c=>career?ntRanking(c):[];
/* torneos de selecciones según el año en que termina la temporada (adaptado: la clasificación sale del ranking) */
function ntTournaments(year){const T=[];
 if(year%4===2)T.push({id:'wc',name:'Copa Mundial de la FIFA '+year,n:48,confs:{UEFA:16,CAF:9,AFC:8,CONMEBOL:6,CONCACAF:6,OFC:1},host:year===2030?['España','Portugal','Marruecos']:[]});
 if(year%4===0)T.push({id:'euro',name:'Eurocopa '+year,n:24,confs:{UEFA:24},host:year===2028?['Inglaterra','Irlanda']:[]});
 if(year%4===0)T.push({id:'ca',name:'Copa América '+year,n:16,confs:{CONMEBOL:10,CONCACAF:6},host:[]});
 if(year%4===3)T.push({id:'asia',name:'Copa Asiática '+year,n:24,confs:{AFC:24},host:year===2027?['Arabia Saudita']:[]});
 if(year%2===1)T.push({id:'afcon',name:'Copa Africana de Naciones '+year,n:24,confs:{CAF:24},host:year===2027?['Kenia','Uganda','Tanzania']:[]});
 if(year%2===1)T.push({id:'gold',name:'Copa Oro de CONCACAF '+year,n:16,confs:{CONCACAF:16},host:[]});
 if(year%4===0)T.push({id:'ofc',name:'Copa de Naciones de la OFC '+year,n:8,confs:{OFC:8},host:[]});
 return T}
function playNT(t,R){const qual=[];t.host.forEach(h=>{if(!qual.includes(h))qual.push(h)});
 for(const conf in t.confs){const r=ntRanking(conf).filter(c=>!qual.includes(c)&&(ntPools()[c]||[]).length>=11);qual.push(...r.slice(0,t.confs[conf]-t.host.filter(h=>MC10.confOf(h)===conf).length))}
 const teams=qual.slice(0,t.n);if(teams.length<4)return null;
 const ng=teams.length>=32?Math.floor(teams.length/4):teams.length>=16?Math.floor(teams.length/4):2;
 const seeded=teams.slice().sort((a,b)=>ntState().pts[b]-ntState().pts[a]);const pots=[0,1,2,3].map(p=>shuffle(seeded.slice(p*ng,(p+1)*ng),R));
 const groups=[...Array(ng)].map((_,g)=>pots.map(p=>p[g]).filter(Boolean));const gres=[];
 const adv=[],thirds=[];groups.forEach((g,gi)=>{const T=new Map(g.map(x=>[x,{n:x,p:0,gd:0,gf:0}]));
  for(let i=0;i<g.length;i++)for(let j=i+1;j<g.length;j++){const r=ntSim(g[i],g[j],R,false);const A=T.get(g[i]),B=T.get(g[j]);A.gf+=r.g[0];B.gf+=r.g[1];A.gd+=r.g[0]-r.g[1];B.gd+=r.g[1]-r.g[0];if(r.g[0]>r.g[1])A.p+=3;else if(r.g[0]<r.g[1])B.p+=3;else{A.p++;B.p++}gres.push([g[i],g[j],r.g[0],r.g[1]])}
  const tb=[...T.values()].sort((a,b)=>b.p-a.p||b.gd-a.gd||b.gf-a.gf);adv.push(tb[0].n,tb[1].n);if(tb[2])thirds.push(tb[2])});
 let P=2;while(P*2<=adv.length+thirds.length)P*=2;thirds.sort((a,b)=>b.p-a.p||b.gd-a.gd);let ko=adv.concat(thirds.slice(0,Math.max(0,P-adv.length)).map(x=>x.n)).slice(0,P);
 const rounds=[];while(ko.length>1){const nx=[],ties=[];ko=shuffle(ko,R);for(let i=0;i<ko.length;i+=2){const r=ntSim(ko[i],ko[i+1],R,true);const w=r.g[0]>r.g[1]||(r.g[0]===r.g[1]&&r.pen[0]>r.pen[1])?ko[i]:ko[i+1];nx.push(w);ties.push([ko[i],ko[i+1],r.g[0],r.g[1],r.pen])}rounds.push({name:koName(ko.length),ties});ko=nx}
 const fin=rounds[rounds.length-1].ties[0];const champ=ko[0];
 return{id:t.id,name:t.name,teams,groups,champ,runner:fin[0]===champ?fin[1]:fin[0],final:fin,rounds,year:t.year}}
/* fechas FIFA: convocatorias de tus jugadores y partidos de selecciones (amistosos o eliminatorias) */
const FIFA_DATES=[.12,.3,.46,.72];
function fifaWindow(i){const st=ntState(),R=Math.random,year=career.season+(i>=3?1:0);
 const label=ntTournaments(year+1).length||ntTournaments(year+2).some(t=>t.id==='wc')?'Eliminatorias':'Amistosos internacionales';
 const confs=['UEFA','CONMEBOL','CONCACAF','AFC','CAF','OFC'];confs.forEach(cf=>{const r=shuffle(ntRanking(cf),R);for(let k=0;k+1<r.length;k+=2)ntSim(r[k],r[k+1],R,false)});
 /* convocatorias */const called=[];career.players.forEach(p=>{if(!p.nat||p.nat==='—')return;const sq=ntSquad(p.nat);if(sq.some(x=>fold(x.name)===fold(p.name))){called.push(p);p.caps=(p.caps||0)+1+(R()<.5?1:0);p.fitness=Math.max(55,p.fitness-6);p.morale=Math.min(99,p.morale+4);
  if(!p.injury&&R()<.025){p.injury='Lesión con la selección · 1 semana';p.injWeeks=1}}});
 if(called.length)career.inbox.unshift(`📣 Fecha FIFA (${label}): convocados ${called.map(p=>p.name+' ('+p.nat+')').join(', ')}.`);
 else career.inbox.unshift(`Fecha FIFA (${label}): ningún jugador de tu plantel fue convocado.`);
 st.hist.unshift({season:career.season,w:i,label,called:called.map(p=>p.name)});if(st.hist.length>40)st.hist.length=40}
/* =========================================================
   8) CICLO DE LA TEMPORADA
   ========================================================= */
window.mcSeasonStart=function(c){const w=W();w.comps=null;ensureComps();w.fifa={season:c.season,done:[]};NT=null;
 if(!w.coachInit){Object.keys(CLUBS).forEach(cn=>{});w.coachInit=1}};
window.mcAfterRound=function(c,L){const w=W();const tot=Math.max(L.total||0,L.rounds.length),frac=c.round/tot;
 if(!w.fifa||w.fifa.season!==c.season)w.fifa={season:c.season,done:[]};
 FIFA_DATES.forEach((f,i)=>{if(frac>=f&&!w.fifa.done.includes(i)){w.fifa.done.push(i);try{fifaWindow(i)}catch(e){console.error(e)}}});
 /* Copa Asiática (enero): se juega a mitad de temporada */
 if(frac>=.5&&!w.fifa.mid){w.fifa.mid=1;const y=c.season+1;ntTournaments(y).filter(t=>t.id==='asia').forEach(t=>{const r=playNT({...t,year:y},rng(hash(t.name+c.id)));if(r){w.ntHist.unshift(r);c.inbox.unshift(`🌏 ${r.name}: campeón ${r.champ}.`)}})}
 /* despidos de entrenadores en tu liga */
 if(frac>.3&&c.round%4===0){const t=window.mcTable(L);t.slice(-3).forEach(r=>{if(r.name!==c.club&&Math.random()<.18){const n=fire(r.name,'Malos resultados');if(n)c.inbox.unshift(`📰 ${r.name} despidió a su entrenador. Asume ${n.name}.`)}})}
 /* tu continuidad: la directiva pierde la paciencia */
 if(c.board<=15&&frac>.25&&!c.firedPending){c.firedPending=true;c.inbox.unshift('⚠ La directiva decidió prescindir de tus servicios. Revisá las ofertas en Mundo › Entrenadores.')}
 /* ventas de jugadores a clubes reales (no inventados) cuando publicaste transferibles */
};
window.mcSeasonEnd=function(c,L){const w=W(),s=c.season;
 /* historial: campeones de todas las ligas, copas y torneos */
 const t=window.mcTable(L,L.fmt.apcl?{kinds:['A','C']}:undefined);
 w.finals[s]=w.finals[s]||{};w.finals[s][c.country]=t.map(r=>r.name);
 const leagues={};Object.keys(CLUBS).forEach(cn=>{if(cn===c.country){leagues[cn]=L.champs.length?L.champs.map(x=>x.title+': '+x.name).join(' · '):t[0].name;return}const ft=finalTable(cn,s);if(ft[0])leagues[cn]=ft[0].name});
 const cups={},cont={};(w.comps&&w.comps.list||[]).forEach(cp=>{let g=0;while(!cp.champ&&g++<30){const st=cp.stages[cp.si];if(!st)break;tickComp(cp,true)}if(cp.kind==='cup')cups[cp.name]=cp.champ;else cont[cp.id]=cp.champ});
 /* torneos de selecciones al terminar la temporada */
 const y=s+1;const nts=[];ntTournaments(y).filter(t=>t.id!=='asia').forEach(t=>{const r=playNT({...t,year:y},rng(hash(t.name+c.id)));if(r){w.ntHist.unshift(r);nts.push(r)}});
 const mineCalled=nts.map(r=>{const pl=c.players.filter(p=>r.teams.includes(p.nat)&&ntSquad(p.nat).some(x=>fold(x.name)===fold(p.name)));return pl.length?`${r.name}: ${pl.map(p=>p.name).join(', ')}`:''}).filter(Boolean);
 if(mineCalled.length)c.inbox.unshift('🌍 Tus jugadores en torneos de selecciones — '+mineCalled.join(' · '));
 nts.forEach(r=>c.inbox.unshift(`🏆 ${r.name}: campeón ${r.champ} (final ${r.final[2]}-${r.final[3]}${r.final[4]?' pen. '+r.final[4][0]+'-'+r.final[4][1]:''} ante ${r.runner}).`));
 /* estadísticas: goleador de tu liga */
 const B=(w.stats[s]||{}).liga||{g:{},a:{},cs:{}};const top=o=>Object.entries(o).sort((a,b)=>b[1][1]-a[1][1])[0];
 const tg=top(B.g),ta=top(B.a),tc=top(B.cs);
 w.hist.unshift({season:s,country:c.country,club:c.club,pos:t.findIndex(r=>r.name===c.club)+1,league:L.champs.length?L.champs.map(x=>x.title+': '+x.name).join(' · '):t[0].name,runner:t[1]&&t[1].name,
  table:t.map(r=>[r.name,r.pts,r.pj,r.gf,r.gc]),leagues,cups,cont,nt:nts.map(r=>({name:r.name,champ:r.champ,runner:r.runner})),
  top:{g:tg&&[tg[0],tg[1][0],tg[1][1]],a:ta&&[ta[0],ta[1][0],ta[1][1]],cs:tc&&[tc[0],tc[1][0],tc[1][1]]}});
 if(w.hist.length>60)w.hist.length=60;
 /* coeficiente de países = promedio de puntos de sus clubes en torneos continentales */
 w.ctry=w.ctry||{};const byC={};(w.comps&&w.comps.list||[]).filter(x=>x.kind==='cont').forEach(cp=>cp.teams.forEach(cl=>{const cn=countryOfClub(cl);if(!cn)return;const o=byC[cn]=byC[cn]||{p:0,n:0};o.n++;o.p+=((w.coef[cl]||{})[s]||0)}));
 for(const cn in byC){w.ctry[cn]=w.ctry[cn]||{};w.ctry[cn][s]=Math.round(byC[cn].p/byC[cn].n*100)/100}
 /* entrenadores: cambios en el resto del mundo */
 Object.keys(CLUBS).forEach(cn=>{if(cn===c.country)return;const ft=finalTable(cn,s);ft.slice(-2).forEach(r=>{if(hash(r.name+s)%2===0&&w.coaches[r.name])fire(r.name,'Fin de ciclo')})});
 /* paso del tiempo en tu plantel: cumplen años, evolucionan, contratos y retiros */
 const retired=[];c.players=c.players.filter(p=>{p.age=(p.age||25)+1;const h=hash(p.name+s)%100/100;const a=p.age;
  const d=a<=20?2+Math.round(h*3):a<=23?1+Math.round(h*2):a<=27?Math.round(h*2-0.6):a<=30?Math.round(h*2-1.2):a<=33?-1-Math.round(h*2):-2-Math.round(h*3);
  const pot=p.potential||p.rating;p.rating=clamp(Math.min(Math.max(p.rating+d,a<=27?Math.min(pot,p.rating+d):0),99),35,99);
  if(p.value!=null)p.value=Math.max(.01,Math.round(p.value*Math.pow(1.17,d)*(a>=33?.8:1)*100)/100);
  p.contract=(p.contract||1)-1;p.goals=0;p.assists=0;p.apps=0;p.yc=0;
  if(a>=38||(a>=35&&p.rating<70&&h<.5)){retired.push(p.name);return false}
  if(p.contract<=0){p.contract=1+Math.round(h*2);c.inbox.unshift(`${p.name} renovó su contrato automáticamente (${p.contract} año/s).`)}
  return true});
 if(retired.length)c.inbox.unshift('👋 Se retiraron: '+retired.join(', ')+'.');
 /* préstamos que vuelven */
 (w.loans||[]).filter(l=>l.until<=s).forEach(l=>{const i=c.players.findIndex(p=>p.loan&&fold(p.name)===fold(l.name));if(i<0)return;const p=c.players[i];
  if(l.exercise&&c.budget>=l.option){c.budget=Math.round((c.budget-l.option)*10)/10;delete p.loan;c.inbox.unshift(`Opción de compra ejecutada: ${p.name} queda en el club por ${mcMoney(l.option)}.`)}
  else{c.players.splice(i,1);w.moves[fold(p.name)]=l.from;c.inbox.unshift(`${p.name} terminó su préstamo y volvió a ${l.from}.`)}});
 w.loans=(w.loans||[]).filter(l=>l.until>s);
 /* traspasos entre clubes de la IA (mercado de verano) */
 if(!(window.mcIAMercado&&mcIAMercado(s)))aiTransfers(s);
 /* mudanza de club elegida en las ofertas */
 if(c.pendingMove){changeClub(c.pendingMove);c.pendingMove=null}
 c.firedPending=false;bump();try{fitXI()}catch(e){}};
/* traspasos de la IA: jugadores destacados de clubes chicos pasan a clubes más fuertes (con nombre y club reales) */
function aiTransfers(s){const w=W(),d=window.mcDB(),R=rng(hash('mkt'+s+career.id));const moves=[];
 const cand=d.list.filter(o=>o.age<=29&&o.rating>=70&&o.club!==career.club).sort(()=>R()-.5).slice(0,500);
 const byStr=Object.keys(CLUBS).flatMap(cn=>CLUBS[cn]).map(c=>[c,window.mcClubStrength?mcClubStrength(c):60]).sort((a,b)=>b[1]-a[1]);
 cand.forEach(o=>{if(moves.length>=60)return;const cs=window.mcClubStrength?mcClubStrength(o.club):60;if(o.rating<cs+4)return;
  const pool=byStr.filter(x=>x[1]>cs+2&&x[1]<o.rating+3&&x[0]!==o.club&&x[0]!==career.club);if(!pool.length)return;const to=pool[Math.floor(R()*Math.min(pool.length,25))][0];
  w.moves[fold(o.name)]=to;moves.push([o.name,o.club,to,o.value])});
 w.aiMoves=w.aiMoves||[];w.aiMoves.unshift({season:s,moves});if(w.aiMoves.length>8)w.aiMoves.length=8;
 if(moves.length)career.inbox.unshift(`🔁 Mercado de pases: ${moves.length} traspasos entre clubes del mundo (ver Mundo › Traspasos).`)}
/* cambio de club del entrenador (usuario) */
function changeClub(club){const w=W();const old=career.club;
 career.players.forEach(p=>{if(!p.loan)w.moves[fold(p.name)]=old;if(career.mkt&&career.mkt.gone){/* vuelve a estar disponible en el mercado desde su nuevo club */}});
 career.mkt=career.mkt||{gone:{},extra:[]};career.mkt.gone={};
 const cn=countryOfClub(club)||career.country;bump();const np=defaultPlayers(club);career.club=club;career.country=cn;bump();
 career.players=np;const t=CLUB_TIER[club]||2,f=career.difficulty==='Experto'?.5:career.difficulty==='Difícil'?.75:1;
 career.budget=Math.round([8,18,40,70,120][clamp(t-1,0,4)]*f);career.board=72;career.league=null;
 const prevCoach=w.coaches[club];if(prevCoach){prevCoach.club=null;coachPool().push(prevCoach);delete w.coaches[club]}
 w.coachLog.unshift({season:career.season,round:career.round,club,out:prevCoach?prevCoach.name:'—',in:career.manager,why:'Llega el usuario'});
 w.coachLog.unshift({season:career.season,round:career.round,club:old,out:career.manager,in:(w.coaches[old]=genCoach(old,'post'+career.season)).name,why:'El usuario se fue'});
 career.inbox.unshift(`✍️ Firmaste con ${club} (${leagueName(cn)}). Nuevo presupuesto: $${career.budget}M.`)}
window.mcChangeClub=function(club,now){if(!career)return;if(now){const sameCountry=countryOfClub(club)===career.country;changeClub(club);if(!sameCountry){career.round=0}career.firedPending=false;save();try{renderAll()}catch(e){}go('dashboard')}else{career.pendingMove=club;save()}};
/* ofertas de trabajo según tu rendimiento */
window.mcJobOffers=function(){if(!career)return[];const L=career.league;const t=L?window.mcTable(L):[];const pos=t.findIndex(r=>r.name===career.club)+1;
 const myStr=window.mcClubStrength?mcClubStrength(career.club):65;const ranked=t.map(r=>r.name).sort((a,b)=>(mcClubStrength(b)||0)-(mcClubStrength(a)||0));const expected=ranked.indexOf(career.club)+1;
 const over=expected-pos;const R=rng(hash('offers'+career.season+career.id+(career.firedPending?'f':'')));
 let lo,hi;if(career.firedPending){lo=myStr-12;hi=myStr-2}else if(over>=3||pos===1){lo=myStr+1;hi=myStr+9}else if(over>=0){lo=myStr-3;hi=myStr+3}else return[];
 let all=Object.keys(CLUBS).flatMap(cn=>CLUBS[cn]).filter(c=>c!==career.club).map(c=>[c,mcClubStrength(c)]).filter(x=>x[1]>=lo&&x[1]<=hi);
 /* despedido a mitad de temporada: primero ofertas de tu mismo país (así la temporada sigue sin cortes) */
 if(career.firedPending){const same=all.filter(x=>countryOfClub(x[0])===career.country);if(same.length)all=same}
 return shuffle(all,R).slice(0,3).map(x=>x[0])};
window.mcSeasonSummaryHTML=function(c){const offers=window.mcJobOffers();const w=W();
 const comps=(w.comps&&w.comps.list||[]).filter(x=>x.teams.includes(c.club)).map(x=>`<div class="statsrow"><span>${esc(x.name)}</span><b>${x.champ===c.club?'🏆 CAMPEÓN':x.champ?'Campeón: '+esc(x.champ):'En juego'}</b></div>`).join('');
 const loans=(w.loans||[]).filter(l=>l.until<=c.season).map(l=>`<div class="statsrow"><span>Préstamo: ${esc(l.name)} (opción ${mcMoney(l.option)})</span><button class="btn small ${l.exercise?'':'secondary'}" onclick="mcToggleOption('${esc(l.name).replace(/'/g,"\\'")}')">${l.exercise?'✓ COMPRAR':'DEVOLVER'}</button></div>`).join('');
 return comps+loans+(offers.length?`<div class="card" style="margin-top:8px"><div class="eyebrow">OFERTAS DE TRABAJO</div>${offers.map(o=>`<div class="statsrow"><span>${clubBadge(o,18)} ${esc(o)} · ${esc(leagueName(countryOfClub(o)))}</span><button class="btn small${c.pendingMove===o?'':' secondary'}" onclick="mcChangeClub('${esc(o).replace(/'/g,"\\'")}');mcSeasonEndModal()">${c.pendingMove===o?'✓ ACEPTADA':'ACEPTAR'}</button></div>`).join('')}<p class="tiny">Si aceptás, la próxima temporada dirigís a ese club (tu plantel actual queda en ${esc(c.club)}).</p></div>`:'')};
window.mcToggleOption=function(name){const l=(W().loans||[]).find(x=>fold(x.name)===fold(name));if(l){l.exercise=!l.exercise;save();mcSeasonEndModal()}};
/* inicializa el mundo de carreras ya abiertas (6.x) sin tocar sus datos */
(function(){const o=window.mcActivate;if(o)window.mcActivate=function(id,goTo){const r=o.apply(this,arguments);try{if(career){W();bump();window.mcEnsureLeague&&mcEnsureLeague();ensureComps();save()}}catch(e){console.error(e)}return r}})();
(function(){const o=window.createCareer;window.createCareer=function(){window.__mcNoCareer=true;MYD=null;IDX=null;let r;try{r=o.apply(this,arguments)}finally{window.__mcNoCareer=false;MYD=null;IDX=null}try{if(career){W();bump();mcEnsureLeague();ensureComps();save();renderAll()}}catch(e){console.error(e)}return r}})();
window.MC10W={finalTable,ntStrength,ntSquad,ntTournaments,coachOf,grpTable,countryOfClub,koName,ensureComps};
})();
