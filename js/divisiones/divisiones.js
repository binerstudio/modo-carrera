/* ===== MODO CARRERA 12.10 · DIVISIONES INFERIORES (motor) =====
   1) Planteles GENERADOS (no son jugadores reales): 25 por club, posiciones equilibradas (3 ARQ, 8 DEF, 8 MED, 6 DEL),
      edades realistas y nivel según la división. Se generan siempre iguales (semilla = nombre del club), así las
      carreras guardadas encuentran a los mismos jugadores. Solo entran a la base del mercado los del país de tu
      carrera; los demás se arman al momento cuando hacen falta (para que la página no se ponga pesada).
   2) Pertenencia a cada división POR CARRERA: se guarda solo la diferencia con la base (career.world.dv).
   3) Fin de temporada: ascensos, descensos y playoffs de todas las divisiones, conectadas con las primeras de cada
      país. Las ligas que no son la tuya se simulan livianas (tabla final reproducible). Si tu club juega un playoff
      (de ascenso, de permanencia o de promoción entre divisiones), lo jugás vos como cualquier partido de copa.
   Los datos (clubes, formato, reglas y fuentes) están en data/divisiones.js. */
(function(){
'use strict';
const R=window.MC_DIVR,D=window.MC_DIVS;if(!R||!D){return}
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>{let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CAR=()=>window.__mcNoCareer?null:(typeof career!=='undefined'?career:null);
window.MC_DIV_VER=window.MC_DIV_VER|0;
try{R.camisetas()}catch(e){}
const setActivo=R.setActivo;
/* plantel de un club generado que no está en la base: se arma con el generador (ver js/divisiones/registro.js) */

/* plantel de un club generado que no está en la base: se arma con el generador (más los que hayan llegado por traspasos) */
const oRoster=window.rosterFor;
window.rosterFor=function(club){const r=oRoster?oRoster(club):[];const x=R.club.get(club);if(!x||x.top||r.length>=18)return r;
 const c=CAR();if(c&&club===c.club)return r;
 const seen=new Set(r.map(p=>fold(p[0])));const gone=c&&c.world&&c.world.moves||{};const mine=new Set(c?c.players.map(p=>fold(p.name)):[]);
 const add=R.generados(club).filter(g=>{const k=fold(g[0]);return!seen.has(k)&&!mine.has(k)&&!(gone[k]&&gone[k]!==club)}).map(g=>[g[0],g[1],g[2],g[3],g[4],g[5],g[7]]);
 const all=r.concat(add);return window.mcOrderXI?mcOrderXI(all):all};

/* =========================================================
   2) PERTENENCIA A CADA DIVISIÓN (por carrera, solo la diferencia)
   ========================================================= */
const BASE={};for(const c in R.code2key){BASE[c]=(c in R.tops)?(CLUBS[R.tops[c]]||[]).slice():R.divs[c].t.map(t=>t[0])}
R.base=BASE;
const GI=n=>{const x=R.club.get(n);return x?x.i:1e9};
const baseCode=n=>{const x=R.club.get(n);return x?x.code:null};
function dvOf(car){return car&&car.world&&car.world.dv||null}
function diffFor(car,season){const dv=dvOf(car);if(!dv)return null;return season>=dv.s?dv.cur:(dv.prev||dv.cur)}
const MEMO=new Map();
function membership(car,season){const df=diffFor(car,season)||{};const key=(car?car.id:'-')+'|'+JSON.stringify(df).length+'|'+Object.keys(df).length+'|'+(dvOf(car)?dvOf(car).s:0)+'|'+(season>=((dvOf(car)||{}).s||0)?'c':'p');
 if(MEMO.has(key))return MEMO.get(key);const m={};for(const c in BASE)m[c]=BASE[c].filter(n=>!df[n]);
 for(const n in df){const to=df[n];if(m[to])m[to].push(n)}
 for(const c in m)m[c].sort((a,b)=>GI(a)-GI(b));if(MEMO.size>40)MEMO.clear();MEMO.set(key,m);return m}
R.membership=(season)=>membership(CAR(),season==null?(CAR()?CAR().season:2026):season);
window.mcTeamsOf=function(key,season){const code=R.key2code[key];if(!code)return CLUBS[key]||[];const c=CAR();if(!c)return BASE[code];return membership(c,season==null?c.season:season)[code]||[]};
/* aplica la pertenencia de la temporada a CLUBS (lo que usan todas las pantallas) */
function apply(car,season){const m=car?membership(car,season==null?car.season:season):BASE;for(const c in m)CLUBS[R.code2key[c]]=m[c].slice();window.MC_DIV_VER++;MEMO.size>40&&MEMO.clear()}
R.apply=apply;
function codeOfClub(m,club){for(const c in m)if(m[c].includes(club))return c;return null}
/* copa nacional para clubes de las divisiones de abajo: participan la primera y las divisiones hasta la tuya */
window.mcCupTeams=function(key){const d=R.byKey[key];if(!d)return CLUBS[key]||[];const P=R.paises[d.p];const out=[];
 P.niveles.forEach((codes,i)=>{if(i+1<=d.lv)codes.forEach(c=>(CLUBS[R.code2key[c]]||[]).forEach(n=>out.push(n)))});return out};

/* =========================================================
   3) TABLAS, PLAYOFFS Y RESOLUCIÓN DE FIN DE TEMPORADA
   ========================================================= */
const MW=()=>window.MC10W;
function tablaDe(car,code,season,L){const key=R.code2key[code];
 if(car&&L&&key===car.country){const t=window.mcTable(L,L.fmt&&L.fmt.apcl?{kinds:['A','C']}:undefined);return t.map(r=>({name:r.name,pts:r.pts,dg:r.dg!=null?r.dg:r.gf-r.gc,gf:r.gf}))}
 return MW().finalTable(key,season).map(r=>({name:r.name,pts:r.pts,dg:r.gf-r.gc,gf:r.gf}))}
/* ¿puede ascender este club al nivel lv? (filiales: no pueden jugar en la división de su primer equipo ni arriba de ella) */
function puede(club,lv,lvOf){const x=R.club.get(club);if(!x)return true;if(x.u23)return false;if(x.max&&lv<x.max)return false;
 if(x.b){const pl=lvOf(x.b);if(pl!=null&&lv<=pl)return false}return true}
function sim2(a,b,legs,R0,neutral){/* cruce simulado: a = mejor ubicado (define de local) */
 const S=window.mcSimScore,P=window.mcPens;let ga=0,gb=0;
 if(legs===1){const s=S(a,b,R0,neutral);ga=s[0];gb=s[1];if(ga===gb){const p=P(a,b,R0);return p[0]>p[1]?a:b}return ga>gb?a:b}
 const s1=S(b,a,R0);gb+=s1[0];ga+=s1[1];const s2=S(a,b,R0);ga+=s2[0];gb+=s2[1];if(ga!==gb)return ga>gb?a:b;const p=P(a,b,R0);return p[0]>p[1]?a:b}
function simLlave(slots,legsR,R0,final2){let s=slots.slice(),ri=0;while(s.length>1){const nx=[];const isF=s.length===2;const legs=(legsR&&legsR[ri])||(isF?(final2?2:1):2);
  for(let i=0;i<s.length;i+=2){const a=s[i],b=s[i+1];if(a==null&&b==null)nx.push(null);else if(a==null)nx.push(b);else if(b==null)nx.push(a);else nx.push(sim2(a,b,legs,R0,isF&&legs===1))}
  s=nx;ri++}return s[0]}
/* "ESP3A:2" → club; "ITA3*:3" → mejor 3º entre los grupos; "LIG:3" → 3º de la liguilla */
function seed(ref,ctx){if(ref==null)return null;const [code,p]=String(ref).split(':');const pos=+p;
 if(code==='LIG')return ctx.lig?ctx.lig[pos-1]||null:null;
 if(code.endsWith('*')){const pre=code.slice(0,-1);const cand=Object.keys(ctx.T).filter(c=>c.startsWith(pre)&&c!==pre||c===pre).map(c=>ctx.elig(c)[pos-1]).filter(Boolean);
  cand.sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf);return cand[0]?cand[0].name:null}
 if(ctx.sup.includes(code))return(ctx.T[code][pos-1]||{}).name||null;
 const e=ctx.elig(code);return(e[pos-1]||{}).name||null}
function liguilla(teams,R0){const t=new Map(teams.map(n=>[n,{name:n,pts:0,dg:0,gf:0}]));
 for(let i=0;i<teams.length;i++)for(let j=0;j<teams.length;j++){if(i===j)continue;const s=window.mcSimScore(teams[i],teams[j],R0);const A=t.get(teams[i]),B=t.get(teams[j]);
  A.gf+=s[0];B.gf+=s[1];A.dg+=s[0]-s[1];B.dg+=s[1]-s[0];if(s[0]>s[1])A.pts+=3;else if(s[0]<s[1])B.pts+=3;else{A.pts++;B.pts++}}
 return[...t.values()].sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf||(window.mcTeamGRL(b.name)-window.mcTeamGRL(a.name)))}
/* resuelve un país entero. Devuelve {mem: pertenencia nueva, mov:[[club,de,a,motivo]], llaves:[...]} */
function resolverPais(pais,car,season,L,opts){opts=opts||{};const P=R.paises[pais];const reglas=(D.reglas||[]).filter(r=>r.pais===pais);
 const mem0=membership(car,season),mem={};for(const c in mem0)mem[c]=mem0[c].slice();
 const lvl={};P.niveles.forEach((cs,i)=>cs.forEach(c=>(mem0[c]||[]).forEach(n=>{lvl[n]=i+1})));
 const lvOf=n=>lvl[n]!=null?lvl[n]:null;const T={};P.niveles.flat().forEach(c=>{T[c]=tablaDe(car,c,season,L)});
 const R0=rng(hash('asc|'+pais+'|'+season+'|'+(car?car.id:'')));const mov=[],llaves=[];const userClub=car&&car.club;
 const mueve=(club,de,a,why)=>{mem[de]=mem[de].filter(n=>n!==club);mov.push([club,de,a,why])};
 reglas.forEach(rg=>{const sup=rg.sup,inf=rg.inf,lvSup=R.nivel(sup[0]);
  const ctx={T,sup,elig:c=>T[c].filter(r=>puede(r.name,lvSup,lvOf))};
  const up=[],down=[];
  /* bajan directo: los últimos de cada grupo de arriba */
  sup.forEach(c=>{const t=T[c];t.slice(t.length-(rg.bajan||0)).forEach(r=>down.push([r.name,c,'Descenso directo']))});
  /* liguilla (Liga 3 de Portugal): los 4 primeros de cada serie juegan una fase de ascenso */
  if(rg.liguilla){const teams=[];inf.forEach(c=>ctx.elig(c).slice(0,rg.liguilla).forEach(r=>teams.push(r.name)));ctx.lig=liguilla(teams,R0).map(r=>r.name);
   llaves.push({tipo:'liguilla',nombre:rg.nombreLig||'Fase de ascenso',orden:ctx.lig});
   ctx.lig.filter(n=>puede(n,lvSup,lvOf)).slice(0,rg.suben||0).forEach(n=>up.push([n,inf.find(c=>mem0[c].includes(n)),'Ascenso (fase de ascenso)']))}
  else inf.forEach(c=>ctx.elig(c).slice(0,rg.suben||0).forEach(r=>up.push([r.name,c,'Ascenso directo'])));
  /* playoffs: cada llave da un ganador que juega arriba; los de arriba que pierden bajan */
  (rg.po||[]).forEach((po,pi)=>{const sl=po.s.map(x=>seed(x,ctx));const parts=sl.filter(Boolean);if(parts.length<2)return;
   const id='asc-'+sup[0]+'-'+inf[0]+'-'+pi;let w=null,jugada=false;
   const comp=car&&car.world&&car.world.comps&&car.world.comps.season===season&&car.world.comps.list.find(x=>x.id===id);
   if(comp&&comp.champ){w=comp.champ;jugada=true}else if(!opts.preview||!parts.includes(userClub))w=simLlave(sl,po.legs,R0,po.final2);
   llaves.push({id,nombre:po.n,parts,ganador:w,jugada});if(!w)return;
   const supParts=parts.filter(n=>sup.some(c=>mem0[c].includes(n)));
   if(!supParts.includes(w))up.push([w,inf.find(c=>mem0[c].includes(w)),'Ascenso por playoff ('+po.n+')']);
   supParts.filter(n=>n!==w).forEach(n=>down.push([n,sup.find(c=>mem0[c].includes(n)),'Pierde el playoff ('+po.n+')']))});
  /* aplicar: los que bajan ocupan los lugares de los que suben (grupos: por vacantes) */
  down.forEach(([n,c,why])=>mueve(n,c,null,why));up.forEach(([n,c,why])=>mueve(n,c,null,why));
  const fill=(list,dests,why0)=>{list.forEach(([n,from,why])=>{const vac=dests.map(c=>({c,v:(R.base[c]||[]).length-mem[c].length}));
   /* preferencia: su grupo de origen en los datos, si está entre los destinos y tiene lugar */
   const bc=baseCode(n);let tgt=vac.find(x=>x.c===bc&&x.v>0)||vac.filter(x=>x.v>0).sort((a,b)=>b.v-a.v)[0]||vac[0];
   mem[tgt.c].push(n);const m=mov.find(x=>x[0]===n&&x[2]==null);if(m)m[2]=tgt.c})};
  fill(up,sup);fill(down,inf)});
 /* filiales: si el primer equipo quedó en la misma división (o abajo), la filial baja un escalón y sube el mejor de abajo */
 const lvNew={};P.niveles.forEach((cs,i)=>cs.forEach(c=>mem[c].forEach(n=>{lvNew[n]=i+1})));
 for(const n in lvNew){const x=R.club.get(n);if(!x||!x.b||lvNew[x.b]==null)continue;const lv=lvNew[n];if(lv>lvNew[x.b])continue;
  const below=P.niveles[lv];if(!below)continue;const here=P.niveles[lv-1];const from=here.find(c=>mem[c].includes(n));
  const cand=below.flatMap(c=>T[c]?T[c].map((r,i)=>({n:r.name,c,i,pts:r.pts})):[]).filter(o=>mem[o.c].includes(o.n)&&puede(o.n,lv,k=>lvNew[k])&&!mov.some(m=>m[0]===o.n)).sort((a,b)=>a.i-b.i||b.pts-a.pts)[0];
  if(!cand)continue;mem[from]=mem[from].filter(k=>k!==n);mem[cand.c]=mem[cand.c].filter(k=>k!==cand.n);mem[cand.c].push(n);mem[from].push(cand.n);
  mov.push([n,from,cand.c,'Filial: su primer equipo juega en la misma división']);mov.push([cand.n,cand.c,from,'Ascenso por la baja de una filial']);lvNew[n]=lv+1;lvNew[cand.n]=lv}
 const own={};P.niveles.flat().forEach(c=>{own[c]=mem[c].sort((a,b)=>GI(a)-GI(b))});
 return{mem:own,mov,llaves}}
R.resolverPais=resolverPais;
R.tabla=(code,season)=>{const c=CAR();return tablaDe(c,code,season==null?c.season:season,c&&c.league)};R.puede=puede;
/* fin de temporada: todas las divisiones de todos los países */
function resolverTodo(car,season,L,opts){const out={mem:{},mov:[],llaves:{}};for(const p in R.paises){const r=resolverPais(p,car,season,L,opts);Object.assign(out.mem,r.mem);out.mov.push(...r.mov);out.llaves[p]=r.llaves}return out}
R.resolverTodo=resolverTodo;
function guardar(car,season,mem){const w=car.world;const dv=w.dv||{s:0,cur:{}};const df={};mem=Object.assign({},membership(car,season),mem);
 for(const c in mem)mem[c].forEach(n=>{if(baseCode(n)!==c)df[n]=c});
 w.dv={s:season+1,cur:df,prev:dv.cur||{},ps:dv.s||0}}
const oEnd=window.mcSeasonEnd;
window.mcSeasonEnd=function(c,L){if(oEnd)oEnd.apply(this,arguments);
 try{const s=c.season;const res=resolverTodo(c,s,L);guardar(c,s,res.mem);
  const mine=res.mov.find(m=>m[0]===c.club);
  apply(c,s+1);
  const code=codeOfClub(res.mem,c.club);if(code){const key=R.code2key[code];if(key!==c.country){c.country=key;c.league=null}}
  const w=c.world;w.dvLog=w.dvLog||[];w.dvLog.unshift({s,n:res.mov.length,mine:mine?[mine[1],mine[2],mine[3]]:null});if(w.dvLog.length>6)w.dvLog.length=6;
  if(mine){const up=R.nivel(mine[2])<R.nivel(mine[1]);c.inbox.unshift(`${up?'⬆️ ¡ASCENSO!':'⬇️ Descenso.'} ${c.club} jugará la temporada ${s+1}/${String(s+2).slice(-2)} en ${leagueName(R.code2key[mine[2]])} (${mine[3]}).`);
   c.board=clamp((c.board||60)+(up?12:-10),5,99)}
  const pais=R.paisDe(c.country);const otros=res.mov.filter(m=>m[0]!==c.club&&R.divs[m[1]]&&R.divs[m[1]].p===pais||R.tops[m[1]]&&R.tops[m[1]]===pais&&m[0]!==c.club);
  if(otros.length)c.inbox.unshift(`📋 Ascensos y descensos en ${pais}: ${otros.slice(0,12).map(m=>`${m[0]} ${R.nivel(m[2])<R.nivel(m[1])?'⬆':'⬇'} ${R.divs[m[2]]?R.divs[m[2]].n:LEAGUES[R.code2key[m[2]]].nombre}`).join(' · ')}${otros.length>12?' …':''}.`);
  setActivo(pais)}catch(e){console.error('divisiones: fin de temporada',e)}};
/* resumen en el cierre de temporada (antes de pasar de año): qué te toca */
const oSum=window.mcSeasonSummaryHTML;
window.mcSeasonSummaryHTML=function(c){let h=oSum?oSum(c):'';try{const code=R.key2code[c.country];if(!code)return h;const pais=R.paisDe(c.country);if(!(D.reglas||[]).some(r=>r.pais===pais))return h;
 const r=resolverPais(pais,c,c.season,c.league,{preview:true});const m=r.mov.find(x=>x[0]===c.club);
 const lbl=m?(R.nivel(m[2])<R.nivel(m[1])?'⬆️ Ascendés a ':'⬇️ Descendés a ')+(R.divs[m[2]]?R.divs[m[2]].n+(R.divs[m[2]].g?' · '+R.divs[m[2]].g:''):LEAGUES[R.code2key[m[2]]].nombre):'Seguís en '+leagueName(c.country);
 h=`<div class="statsrow"><span>Próxima temporada</span><b class="gold">${lbl}</b></div>`+h}catch(e){console.error(e)}return h};

/* ---- playoffs que juega tu club (se crean al terminar la fase regular y se juegan como partidos de copa) ---- */
function crearPlayoffs(c){const L=c.league;if(!L||L.stage!=='done'||c.round<L.rounds.length)return;const w=c.world;if(!w||!w.comps||w.comps.season!==c.season)return;
 if(w.ascHecho===c.season)return;w.ascHecho=c.season;const pais=R.paisDe(c.country);if(!R.paises[pais])return;
 const reglas=(D.reglas||[]).filter(r=>r.pais===pais);if(!reglas.length)return;
 const mem0=membership(c,c.season);const P=R.paises[pais];const lvl={};P.niveles.forEach((cs,i)=>cs.forEach(k=>(mem0[k]||[]).forEach(n=>{lvl[n]=i+1})));
 const T={};P.niveles.flat().forEach(k=>{T[k]=tablaDe(c,k,c.season,L)});
 reglas.forEach(rg=>{if(rg.liguilla)return;const lvSup=R.nivel(rg.sup[0]);const ctx={T,sup:rg.sup,elig:k=>T[k].filter(r=>puede(r.name,lvSup,n=>lvl[n]!=null?lvl[n]:null))};
  (rg.po||[]).forEach((po,pi)=>{const sl=po.s.map(x=>seed(x,ctx));if(!sl.includes(c.club))return;
   const id='asc-'+rg.sup[0]+'-'+rg.inf[0]+'-'+pi;if(w.comps.list.some(x=>x.id===id))return;
   const at=L.rounds.length;const ties=[];for(let i=0;i<sl.length;i+=2){let a=sl[i],b=sl[i+1];if(a==null&&b!=null){a=b;b=null}ties.push({a,b,legs:[],w:null})}
   const legs0=(po.legs&&po.legs[0])||(sl.length===2?(po.final2?2:1):2);const nR=Math.log2(sl.length);
   const st={type:'ko',name:sl.length===2?'Final':sl.length===4?'Semifinales':sl.length===8?'Cuartos de final':'Ronda preliminar',legs:legs0,at:Array(legs0).fill(at),ties,neutral:sl.length===2&&legs0===1&&!!po.neutral};
   const legsR=(po.legs||[]).slice();if(!legsR.length)for(let i=0;i<nR;i++)legsR.push(i===nR-1?(po.final2?2:1):2);
   w.comps.list.push({id,kind:'asc',name:po.n,short:'PLAYOFF',conf:null,country:null,season:c.season,teams:sl.filter(Boolean),fmt:'asc',plan:Array(12).fill(at),pi:0,stages:[st],si:0,champ:null,runner:null,lvl:1,legsR,neutralF:!!po.neutral});
   c.inbox.unshift(`🔥 ${c.club} juega el ${po.n}. ¡Se define la temporada!`)})})}
window.MC_COMPS=window.MC_COMPS||[];
window.MC_COMPS.push({pending(){return null},record(){},tick(c){try{crearPlayoffs(c)}catch(e){console.error('divisiones: playoffs',e)}}});

/* ---- zonas de la tabla (ascenso / playoff / descenso) ---- */
window.mcDivZone=function(L,i,n){const code=R.key2code[L.country];if(!code)return null;const pais=R.paisDe(L.country);const reglas=(D.reglas||[]).filter(r=>r.pais===pais);if(!reglas.length)return null;
 if(L.fmt&&L.fmt.apcl)return null;let z='';const ref=(s,c)=>{if(!s)return-1;const [cc,p]=s.split(':');return(cc===c||(cc.endsWith('*')&&c.startsWith(cc.slice(0,-1))))?(+p)-1:-1};
 reglas.forEach(rg=>{if(rg.inf.includes(code)){if(i<(rg.liguilla||rg.suben||0))z='po';else if((rg.po||[]).some(po=>po.s.some(s=>ref(s,code)===i)))z='po'}
  if(rg.sup.includes(code)){if(i>=n-(rg.bajan||0))z='rel';else if((rg.po||[]).some(po=>po.s.some(s=>ref(s,code)===i)))z='rel'}});
 return z};

/* texto de ascensos y descensos para la tabla */
window.mcDivNota=function(key){const code=R.key2code[key];if(!code)return null;const pais=R.paisDe(key);const rs=(D.reglas||[]).filter(r=>r.pais===pais);if(!rs.length)return null;
 const t=[];const nm=c=>R.divs[c]?R.divs[c].n:(LEAGUES[R.code2key[c]]||{}).nombre;
 rs.forEach(rg=>{if(rg.inf.includes(code))t.push(`Ascenso a ${nm(rg.sup[0])}: ${rg.liguilla?'fase de ascenso entre los '+rg.liguilla+' primeros de cada serie, suben '+rg.suben:(rg.suben||0)+' directo'+(rg.inf.length>1?' por grupo':'')}${(rg.po||[]).length?' + '+rg.po.map(p=>p.n).join(' / '):''}.`);
  if(rg.sup.includes(code))t.push(`Descenso a ${nm(rg.inf[0])}: ${rg.bajan} directo${rg.sup.length>1?' por grupo':''}${(rg.po||[]).some(p=>p.s.some(s=>s&&s.split(':')[0]===code))?' + playoff':''}.`)});
 if(!rs.some(rg=>rg.sup.includes(code)))t.push('Sin descensos: la división de abajo no está cargada en el juego.');
 const d=R.divs[code];return t.join(' ')+(d&&d.formato?' Formato real: '+d.formato:'')+' Zona verde: ascenso o playoff de ascenso; roja: descenso o playoff de permanencia.'};

/* =========================================================
   4) CICLO DE LA CARRERA: abrir, crear, cambiar de club
   ========================================================= */
function sync(c){apply(c);setActivo(c?R.paisDe(c.country):'')}
const oAct=window.mcActivate;
function syncFix(c){sync(c);
 /* si al abrir se armó una liga con la lista base y esta carrera ya tenía ascensos/descensos, se rearma (solo en la fecha 0) */
 const L=c.league,want=CLUBS[c.country]||[];if(L&&L.season===c.season&&c.round===0&&L.teams.length&&(L.teams.length!==want.length||L.teams.some(t=>!want.includes(t)))){c.league=null;window.mcEnsureLeague&&mcEnsureLeague();try{save()}catch(e){}}}
if(oAct)window.mcActivate=function(id){const r=oAct.apply(this,arguments);try{const c=CAR();if(c)syncFix(c)}catch(e){console.error(e)}return r};
const oCreate=window.createCareer;
if(oCreate)window.createCareer=function(){try{apply(null);const k=document.getElementById('country');setActivo(R.paisDe(k?k.value:''))}catch(e){}
 const r=oCreate.apply(this,arguments);try{if(CAR())sync(CAR())}catch(e){}return r};
/* al cambiar de club (ofertas de trabajo) se cargan los planteles del país nuevo */
const oChange=window.mcChangeClub;
if(oChange)window.mcChangeClub=function(club,now){const r=oChange.apply(this,arguments);try{const c=CAR();if(c&&now)setActivo(R.paisDe(c.country))}catch(e){}return r};
/* carrera ya abierta al cargar la página */
try{if(CAR())syncFix(CAR())}catch(e){console.error(e)}
/* mientras elegís club en el buscador, el plantel del club se arma con el generador (rosterFor ya lo resuelve) */

/* =========================================================
   5) ESCUDOS: archivo chico (WebP 64 px) que se pide solo cuando se muestra; si no hay, uno genérico
   ========================================================= */
const ini=n=>String(n).replace(/\(.*\)/,'').split(/[\s\-]+/).filter(w=>w&&!/^(FC|CF|CD|SD|UD|AC|AS|SC|US|SS|FK|SV|VfL|VfB|TSV|1\.|de|del|la|el|of|the|y|e)$/i.test(w)).map(w=>w[0]).join('').slice(0,3).toUpperCase()||String(n).slice(0,2).toUpperCase();
function generico(n){const x=R.club.get(n)||{};const c=(x.col||'').split('/');const a='#'+(c[0]||'1b3a8a'),b='#'+(c[2]&&c[2]!==c[0]?c[2]:(c[1]||'ffffff'));
 const lum=h=>{const v=parseInt(h.slice(1),16);return((v>>16)*.3+((v>>8)&255)*.59+(v&255)*.11)/255};const tc=lum(a)>.6?'#10203a':'#ffffff';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 3 L58 11 V30 C58 46 46 56 32 61 C18 56 6 46 6 30 V11 Z" fill="${a}" stroke="${b}" stroke-width="4"/><path d="M32 8 V57" stroke="${b}" stroke-width="3" opacity=".35"/><text x="32" y="38" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${ini(n).length>2?15:19}" text-anchor="middle" fill="${tc}">${ini(n).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text></svg>`;
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
R.escudoGenerico=generico;
const slug=n=>fold(n).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
R.escudo=n=>{const x=R.club.get(n);if(!x||x.top)return null;return x.esc?'assets/escudos/div/'+slug(n)+'.webp':generico(n)};
const oBadge=window.clubBadge;
window.clubBadge=function(name,size){const src=R.escudo(String(name||''));if(!src)return oBadge.apply(this,arguments);size=size||34;const g=generico(String(name));
 return `<span class="badge-wrap" style="width:${size}px;height:${size}px"><img class="club-badge" src="${src}" alt="Escudo ${String(name).replace(/"/g,'&quot;')}" loading="lazy" decoding="async" width="${size}" height="${size}" onerror="this.onerror=null;this.src='${g}'"></span>`};
const oFile=window.mcBadgeFile;window.mcBadgeFile=n=>R.escudo(n)||(oFile?oFile(n):'');
R.logoLiga=key=>{const d=R.byKey[key];return d&&d.logo?'assets/ligas/'+d.logo+'.webp':null};
window.mcLeagueLogoHTML=(key,size)=>{const u=R.logoLiga(key);size=size||24;return u?`<img src="${u}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle" onerror="this.remove()">`:''};
})();
