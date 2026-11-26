/* ===== MODO CARRERA 12.5 · IA DE LOS CLUBES: ECONOMÍA Y MERCADO =====
   Activo solo en carreras con career.ia==='v2' (carreras nuevas). Las existentes siguen con el
   mercado clásico salvo que se active en Configuración → Mercado e IA.
   Qué hace al cerrar cada temporada (reemplaza aiTransfers solo en v2):
   1) ECONOMÍA: cada club tiene presupuesto (career.world.eco). Se crea a partir del valor de su
      plantel y su fuerza; cada temporada suma un resultado neto (ingresos − salarios) acorde a su
      tamaño. Los traspasos mueven dinero: el comprador paga y el vendedor cobra.
   2) CONTRATOS (estimados): cada jugador tiene un año de vencimiento (career.world.ctr, solo se
      guardan los que cambian). Al vencer: el club renueva a sus titulares jóvenes; el resto queda
      LIBRE y puede firmar gratis con otro club. Si nadie lo ficha: a los 33+ se retira, si no renueva 1 año.
   3) MERCADO: cada club detecta sus necesidades por puesto (faltan jugadores o el titular está por
      debajo del nivel del equipo) y busca refuerzos que pueda pagar. El vendedor solo vende si
      conserva un plantel mínimo en ese puesto; el jugador solo acepta si el club es de un nivel
      similar o mejor. Contrato corto = precio más bajo.
   4) PRÉSTAMOS: los juveniles sin lugar en clubes grandes se prestan a clubes de su nivel por una
      temporada y vuelven al terminarla.
   Todo con azar reproducible por temporada y carrera. Los jugadores de tu plantel nunca se tocan. */
(function(){
'use strict';
if(typeof window.mcDB!=='function'||typeof window.mcWorld!=='function')return;
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=window.mcHash||(s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0});
const rng=window.mcRng||(seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
const BASE=2026;
const MIN={POR:2,DEF:6,MED:6,DEL:4},XI={POR:1,DEF:4,MED:3,DEL:3};
const iaDe=c=>c&&c.ia==='v2'?'v2':'v1';
window.mcIADe=iaDe;

/* ---------- carreras nuevas → IA v2 ---------- */
const oCreate=window.createCareer;
if(typeof oCreate==='function')window.createCareer=function(){
 const r=oCreate.apply(this,arguments);
 try{if(typeof career!=='undefined'&&career&&!career.ia){career.ia=window.MC_IA_NUEVAS||'v2';save()}}catch(e){console.warn('MC IA',e)}
 return r};

/* ---------- planteles actuales (con traspasos, evolución y retiros de la carrera) ---------- */
function plantel(){
 const d=window.mcDB(),mine=new Set(career.players.map(p=>fold(p.name))),by=new Map();
 for(const o of d.list){const n=o._n||fold(o.name);if(mine.has(n)||!o.club||o.club===career.club)continue;
  let a=by.get(o.club);if(!a)by.set(o.club,a=[]);a.push(o)}
 return by}
function nivel(a){/* promedio del once ideal 4-3-3 */let s=0,n=0;for(const g in XI){const L=a.filter(o=>o.pos===g).sort((x,y)=>y.rating-x.rating).slice(0,XI[g]);for(const o of L){s+=o.rating;n++}}return n?s/n:50}
/* jugadores de un puesto que siguen la temporada que viene (los de 38 o más se retiran por edad) */
function sigue(a,g){let n=0;for(const o of a)if(o.pos===g&&(+o.age||0)<38)n++;return n}
function titular(a,o){const L=a.filter(x=>x.pos===o.pos).sort((x,y)=>y.rating-x.rating);return L.indexOf(o)<XI[o.pos]}

/* ---------- economía ---------- */
function W(){const w=window.mcWorld();w.eco=w.eco||{};w.ctr=w.ctr||{};w.loansIA=w.loansIA||[];return w}
function valorPlantel(a){return a.slice().sort((x,y)=>(y.value||0)-(x.value||0)).slice(0,20).reduce((s,o)=>s+(+o.value||0),0)}
/* presupuesto del club a la temporada s. Se calcula sin guardar nada (mismo resultado siempre) y solo
   se guarda en w.eco cuando el club compra o vende, para que la partida no crezca de más. */
function eco(club,a,s){const w=W(),sv=valorPlantel(a||[]),lv=nivel(a||[]);
 let e=w.eco[club];
 const base=e?{b:e.b,s:e.s}:{b:+(sv*.18+Math.max(0,lv-55)*.15).toFixed(2),s:BASE-1};
 while(base.s<s){base.s++;base.b=+(clamp(base.b+sv*.03*(1+(lv-65)/40),-sv*.25,sv*.8)).toFixed(2)}
 return{b:base.b,s:base.s,club,guardar(){w.eco[club]={b:+this.b.toFixed(2),s:this.s}}}}
/* ---------- contratos (estimados) ----------
   Vencimiento inicial estimado por jugador; después se renueva en ciclos de 2 a 4 años salvo que
   el club lo deje libre o lo venda (en ese caso se guarda el nuevo vencimiento en w.ctr). */
function fin(o,s){const w=W(),n=o._n||fold(o.name),h=hash('ctr'+n),a=+o.age||26;
 const e0=w.ctr[n]!=null?w.ctr[n]:BASE+1+(a>=31?h%2:h%4),p=2+(h%3);
 if(s<=e0)return e0;return e0+Math.ceil((s-e0)/p)*p}
/* ---------- mercado de una temporada ---------- */
function mercado(s){
 const c=career,w=W(),R=rng(hash('ia'+s+c.id)),moves=[],by=plantel();
 const clubs=[...by.keys()],lvl=new Map(clubs.map(k=>[k,nivel(by.get(k))]));
 const where=new Map();by.forEach((a,k)=>a.forEach(o=>where.set(o._n||fold(o.name),k)));
 const mover=(o,from,to,fee,tipo)=>{const n=o._n||fold(o.name);w.moves[n]=to;
  const A=by.get(from);if(A){const i=A.indexOf(o);if(i>=0)A.splice(i,1)}let B=by.get(to);if(!B)by.set(to,B=[]);B.push(o);where.set(n,to);
  moves.push([o.name,from,to,+fee.toFixed(2),tipo])};
 /* 0) préstamos que vuelven */
 w.loansIA=w.loansIA.filter(l=>{if(l.until>s)return true;const n=fold(l.name);const now=where.get(n);
  if(now&&now===l.to&&by.has(l.from)){const o=by.get(now).find(x=>(x._n||fold(x.name))===n);if(o)mover(o,now,l.from,0,'vuelve de préstamo')}return false});
 const inicio=new Map();by.forEach((a,k)=>{const o={};for(const g in XI)o[g]=sigue(a,g);inicio.set(k,o)});
 /* 1) contratos que vencen esta temporada: los titulares jóvenes renuevan (el ciclo sigue solo);
       los demás pueden quedar libres (se evalúan los de mejor nivel, con tope) */
 const libres=[];
 by.forEach((a,k)=>a.forEach(o=>{if(fin(o,s)!==s)return;if(titular(a,o)&&o.age<=32)return;if(o.rating>=58)libres.push([o,k])}));
 libres.sort((x,y)=>y[0].rating-x[0].rating);libres.length=Math.min(libres.length,400);
 /* 2) necesidades por puesto */
 const necesidad=(k)=>{const a=by.get(k)||[],L=lvl.get(k),out=[];
  for(const g in MIN){const P=a.filter(o=>o.pos===g).sort((x,y)=>y.rating-x.rating),cnt=P.length;
   if(cnt<MIN[g])out.push([g,3,L-4]);
   else{const weak=P[XI[g]-1];if(weak&&weak.rating<L-5)out.push([g,2,weak.rating+2])}}
  return out.sort((x,y)=>y[1]-x[1])};
 const compras=new Map(),ventas=new Map(),LIM=320,TOPE={libre:140,traspaso:240};let nLib=0,nTr=0;
 /* índice de jugadores por puesto, ordenado por GRL */
 const pool={POR:[],DEF:[],MED:[],DEL:[]};by.forEach((a,k)=>a.forEach(o=>{if(pool[o.pos])pool[o.pos].push(o)}));for(const g in pool)pool[g].sort((x,y)=>x.rating-y.rating);
 const banda=(g,lo,hi)=>{const P=pool[g];let i=0,j=P.length;while(i<j){const m=(i+j)>>1;if(P[m].rating<lo)i=m+1;else j=m}const out=[];for(let k=i;k<P.length&&P[k].rating<=hi;k++)out.push(P[k]);return out};
 /* 2a) libres: firman sin costo con un club de su nivel que necesite ese puesto */
 const nec=new Map(clubs.map(k=>[k,new Set(necesidad(k).map(x=>x[0]))]));
 libres.forEach(([o,from])=>{if(nLib>=TOPE.libre)return;const n=o._n||fold(o.name);
  if(R()<.45){return}                                   /* muchos renuevan igual con su club */
  const dest=clubs.filter(k=>k!==from&&nec.get(k).has(o.pos)&&Math.abs((lvl.get(k)||0)-o.rating)<=5);
  if(dest.length&&o.age<=34){const to=dest[Math.floor(R()*Math.min(dest.length,12))];w.ctr[n]=s+1+hash('lib'+n)%3;mover(o,from,to,0,'libre');nLib++;compras.set(to,(compras.get(to)||0)+1);nec.set(to,new Set(necesidad(to).map(x=>x[0])))}
  else if(o.age>=34){w.retired[n]=s;const A=by.get(from);const i=A?A.indexOf(o):-1;if(i>=0)A.splice(i,1);where.delete(n);moves.push([o.name,from,'Retiro',0,'retiro'])}});
 /* 2b) compras: los clubes con más presupuesto eligen primero */
 const orden=clubs.map(k=>[k,eco(k,by.get(k),s).b]).sort((x,y)=>y[1]-x[1]);
 for(const [k] of orden){if(nTr>=TOPE.traspaso)break;const E=eco(k,by.get(k),s),L=lvl.get(k);
  for(const [g,pri,lo] of necesidad(k)){if((compras.get(k)||0)>=3||E.b<=0.05)break;
   const C=banda(g,Math.max(lo,L-6),L+6).filter(o=>{const from=where.get(o._n||fold(o.name));return from&&from!==k&&o.age<=32&&(lvl.get(from)||0)<=L+3});
   for(let t=0;t<14&&C.length;t++){const o=C.splice(Math.floor(R()*C.length),1)[0],n=o._n||fold(o.name),from=where.get(n),A=by.get(from)||[];
    if((ventas.get(from)||0)>=3)continue;
    if(sigue(A,g)<=MIN[g])continue;                                 /* el vendedor necesita a su jugador */
    const left=fin(o,s)-s,f=(left<=1?.65:left===2?.9:1)*(1+(L-(lvl.get(from)||L))*.01)*(.9+R()*.3);
    const fee=Math.max(0,(+o.value||0)*f);if(fee>E.b*.6)continue;   /* no puede pagarlo */
    if(titular(A,o)&&L<(lvl.get(from)||0)+1&&R()<.6)continue;      /* un titular solo se va a un club mejor */
    E.b=+(E.b-fee).toFixed(2);E.guardar();const S=eco(from,A,s);S.b=+(S.b+fee).toFixed(2);S.guardar();
    w.ctr[n]=s+2+hash('fir'+n+s)%3;mover(o,from,k,fee,'traspaso');nTr++;
    compras.set(k,(compras.get(k)||0)+1);ventas.set(from,(ventas.get(from)||0)+1);break}}}
 /* 3) préstamos de juveniles sin lugar */
 let nPr=0;
 for(const k of clubs){if(nPr>=50)break;const a=by.get(k),L=lvl.get(k);if(L<72)continue;
  const jov=a.filter(o=>o.age<=21&&!titular(a,o)&&o.rating<=L-8).sort((x,y)=>y.rating-x.rating).slice(0,2);
  for(const o of jov){if(sigue(a,o.pos)<=MIN[o.pos])continue;const dest=clubs.filter(x=>x!==k&&Math.abs((lvl.get(x)||0)-o.rating)<=3&&(by.get(x)||[]).filter(y=>y.pos===o.pos).length<MIN[o.pos]+2);
   if(!dest.length)continue;const to=dest[Math.floor(R()*Math.min(dest.length,10))];w.loansIA.push({name:o.name,from:k,to,until:s+1});mover(o,k,to,0,'préstamo');nPr++}}
 /* 4) emergencia: si este mercado dejó a un club sin lo necesario para su once (arquero incluido), se lo repone a préstamo */
 for(const k of clubs){const a=by.get(k);if(!a)continue;
  const ini=inicio.get(k)||{};
  for(const g in XI){let falta=Math.min(XI[g],ini[g]??XI[g])-sigue(a,g);let guard=0;   /* solo lo que este mercado dejó por debajo */
   while(falta>0&&guard++<4){const L=lvl.get(k)||60;
    const don=clubs.filter(x=>x!==k&&sigue(by.get(x)||[],g)>MIN[g]).map(x=>[x,(by.get(x)||[]).filter(o=>o.pos===g&&(+o.age||0)<36&&!titular(by.get(x),o)).sort((p,q)=>Math.abs(p.rating-L)-Math.abs(q.rating-L))[0]]).filter(x=>x[1]);
    if(!don.length)break;don.sort((p,q)=>Math.abs(p[1].rating-L)-Math.abs(q[1].rating-L));const [from,o]=don[0];
    w.loansIA.push({name:o.name,from,to:k,until:s+1});mover(o,from,k,0,'préstamo');falta--}}}
 /* registro */
 const rel=moves.slice().sort((x,y)=>(y[4]==='traspaso')-(x[4]==='traspaso')||y[3]-x[3]).slice(0,220);
 const tipos={};moves.forEach(m=>{tipos[m[4]]=(tipos[m[4]]||0)+1});
 w.aiMoves=w.aiMoves||[];w.aiMoves.unshift({season:s,moves:rel,total:moves.length,tipos,ia:'v2'});if(w.aiMoves.length>4)w.aiMoves.length=4;
 w.mv=(w.mv||0)+1;try{if(window.mcMovePlayer&&moves.length){const m=moves.find(x=>x[2]!=='Retiro');if(m)mcMovePlayer(m[0],m[2])}}catch(e){}
 try{window.mcClearGRL&&mcClearGRL()}catch(e){}
 const cnt=t=>moves.filter(m=>m[4]===t).length,dinero=moves.reduce((x,m)=>x+m[3],0);
 c.inbox.unshift(`🔁 Mercado de pases: ${cnt('traspaso')} traspasos (${window.mcMoney?mcMoney(dinero):dinero.toFixed(1)+'M'}), ${cnt('libre')} libres, ${cnt('préstamo')} préstamos, ${cnt('retiro')} retiros. Ver Mundo › Traspasos.`);
 return moves}
window.mcIAMercado=function(s){if(typeof career==='undefined'||!career||iaDe(career)!=='v2')return null;try{return mercado(s)}catch(e){console.warn('MC IA mercado',e);return null}};
window.mcIAEco=function(club){const by=plantel(),e=eco(club,by.get(club)||[],career.season);return{b:e.b,s:e.s}};

/* ---------- Configuración: Mercado e IA ---------- */
try{
 if(typeof OP!=='undefined'&&typeof SS!=='undefined'){
  OP.ia=[['v1','Clásico'],['v2','Avanzado (economía)']];
  const rows=SS.General&&SS.General[2];if(rows&&!rows.some(x=>x[3]==='ia')){const i=rows.findIndex(x=>x[3]==='motor');rows.splice(i>=0?i+1:2,0,['s','swap','Mercado e IA','ia'])}
  const oLoad=window.sLoad,oSave=window.sSave;
  if(typeof oLoad==='function')window.sLoad=function(){const r=oLoad.apply(this,arguments);try{draft.ia=(typeof career!=='undefined'&&career)?iaDe(career):'v2'}catch(e){}return r};
  if(typeof oSave==='function')window.sSave=function(){const want=(typeof draft!=='undefined'&&draft)?draft.ia:null;const r=oSave.apply(this,arguments);
   try{if(want&&typeof career!=='undefined'&&career&&iaDe(career)!==want){career.ia=want;save();if(window.xToast)xToast(want==='v2'?'Mercado avanzado: se aplica al cerrar la temporada':'Mercado clásico activado')}}catch(e){}return r};
 }
}catch(e){console.warn('MC IA ajustes',e)}
})();
