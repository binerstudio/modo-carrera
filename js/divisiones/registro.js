/* ===== MODO CARRERA 12.10 · DIVISIONES INFERIORES (registro) =====
   Suma las ligas de data/divisiones.js al juego como ligas nuevas (CLUBS / LEAGUES / LEAGUE_ORDER) con clave
   "País · Liga" (o "País · Liga · Grupo"). No toca ninguna liga que ya existía: solo agrega claves nuevas.
   - Bandera, confederación y continente de una división = los de su país.
   - Fuerza de cada club (para el simulador liviano y las estrellas): nivel de la división ± tamaño del estadio.
   El motor (ascensos, descensos, playoffs y planteles generados) está en js/divisiones/divisiones.js. */
(function(){
'use strict';
const D=window.MC_DIVS;if(!D||typeof CLUBS==='undefined'||typeof LEAGUES==='undefined'){console.warn('MC divisiones: faltan datos');return}
const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const R={divs:{},byKey:{},code2key:{},key2code:{},club:new Map(),order:[],paises:{},tops:D.tops||{}};
/* códigos de primera división: la clave del juego es el nombre del país */
for(const c in R.tops){R.code2key[c]=R.tops[c];R.key2code[R.tops[c]]=c}
let gi=0;
/* primero las primeras divisiones (orden global estable para los clubes) */
for(const c in R.tops){(CLUBS[R.tops[c]]||[]).forEach(n=>{if(!R.club.has(n))R.club.set(n,{code:c,i:gi++,top:1})})}
D.divs.forEach(d=>{R.divs[d.c]=d;R.byKey[d.k]=d;R.code2key[d.c]=d.k;R.key2code[d.k]=d.c;
 d.t.forEach(t=>{const x=t[6]||{};R.club.set(t[0],{code:d.c,i:gi++,ciudad:t[1]||'',estadio:t[2]||'',cap:+t[3]||0,col:t[4]||'',esc:t[5]||0,b:x.b||null,max:x.max||0,u23:!!x.u23,f:d.f})})});
/* niveles por país: [[códigos nivel 1],[nivel 2]...] */
for(const c in R.tops){const p=R.tops[c];R.paises[p]={top:c,niveles:[[c]]}}
D.divs.forEach(d=>{const P=R.paises[d.p];if(!P)return;(P.niveles[d.lv-1]=P.niveles[d.lv-1]||[]).push(d.c)});
R.nivel=code=>{const d=R.divs[code];return d?d.lv:1};
R.paisDe=key=>{const code=R.key2code[key];if(!code)return key;const d=R.divs[code];return d?d.p:R.tops[code]};
R.esDiv=key=>!!R.byKey[key];
/* fuerza: nivel de la división + tamaño del club (capacidad del estadio, dato real de la fuente) */
const capMed={};D.divs.forEach(d=>{const a=d.t.map(t=>+t[3]||0).filter(Boolean).sort((x,y)=>x-y);capMed[d.c]=a.length?a[a.length>>1]:5000});
R.fuerza=name=>{const x=R.club.get(name);if(!x||x.top)return null;const d=R.divs[x.code];
 const cap=x.cap||capMed[x.code];const t=clamp(Math.log(cap/capMed[x.code])*1.4,-2.2,2.6);const r=((hash('f|'+name)%100)/100-.5)*1.6;
 return Math.round((d.f+t+r-(x.u23?1.2:0))*10)/10};
window.MC_DIVR=R;
/* ---- ligas nuevas ---- */
const M=window.MC10||{META:{}};
const meta=p=>(M.META&&M.META[p])||{};
const COLORS={UEFA:'#2f6bff',CONMEBOL:'#1fa04a',CONCACAF:'#d9534f'};
const abbrev=n=>n.replace(/\(.*?\)/g,'').split(/\s+/).filter(w=>/^[A-ZÁÉÍÓÚ0-9]/.test(w)).map(w=>w[0]).join('').slice(0,3).toUpperCase()||n.slice(0,2).toUpperCase();
const order=LEAGUE_ORDER.slice();
D.divs.forEach(d=>{const names=d.t.map(t=>t[0]);CLUBS[d.k]=names;const n=names.length,one=n%2?n:n-1;
 const cups=(((LEAGUES[d.p]||{}).mc10||{}).cups||[]).filter(c=>!/Supercopa|Super Cup|Liga/i.test(c)).slice(0,2);
 LEAGUES[d.k]={nombre:d.n+(d.g?' · '+d.g:''),abrev:abbrev(d.n),color:COLORS[meta(d.p).conf]||'#2f6bff',fecha:one*d.legs,
  formato:d.formato||(n+' equipos, '+(d.legs===2?'ida y vuelta':d.legs+' ruedas')+'.'),cont:'',desc:0,copa:cups.join(' / '),fuerza:0,
  conf:meta(d.p).conf,reg:meta(d.p).reg,ok:1,div:d.c,logo:d.logo||'',
  mc10:{n:d.n,legs:d.legs,grp:null,po:0,apcl:0,rel:0,cups,ok:1,note:d.nota||''}};
 /* en el orden de ligas va después de su país (y de las divisiones anteriores del mismo país) */
 let at=order.indexOf(d.p);if(at<0){order.push(d.k);return}
 while(at+1<order.length&&R.paisDe(order[at+1])===d.p)at++;order.splice(at+1,0,d.k);
 names.forEach(c=>{const s=R.fuerza(c)||60;CLUB_TIER[c]=s>=80?5:s>=74?4:s>=68?3:s>=60?2:1})});
LEAGUE_ORDER.length=0;order.forEach(x=>LEAGUE_ORDER.push(x));
/* primeras divisiones conectadas: se sacan los avisos de "promoción no simulada" y se pone la cantidad real de descensos */
for(const c in R.tops){const p=R.tops[c],L=LEAGUES[p];if(!L)continue;const rg=(D.reglas||[]).find(r=>r.sup.includes(c));if(!rg)continue;
 const fix=t=>String(t||'').replace(/\s*El 16º juega promoción \(no simulada[^)]*\)\.?/g,'').replace(/ \(el juego lo simula como descenso directo de 2\)/g,'');
 L.formato=fix(L.formato);if(L.mc10){L.mc10.note=fix(L.mc10.note);L.mc10.rel=rg.bajan}L.desc=rg.bajan}
/* bandera, confederación y continente de las divisiones = los del país */
if(window.MC10){const f=MC10.flag,co=MC10.confOf,re=MC10.regOf;
 MC10.flag=c=>f(R.paisDe(c));MC10.confOf=c=>co(R.paisDe(c));MC10.regOf=c=>re(R.paisDe(c));
 if(MC10.byCountry)D.divs.forEach(d=>{MC10.byCountry[d.k]=CLUBS[d.k].slice()})}
/* fuerza de los clubes nuevos */
const oS=window.mcClubStrength;window.mcClubStrength=c=>{const f=R.fuerza(c);return f!=null?f:(oS?oS(c):60)};
/* camisetas: colores del club según su ficha de Wikipedia (si no hay, el simulador usa uno genérico) */
R.camisetas=function(){const T=window.MCCamisetas&&MCCamisetas.tabla;if(!T)return;R.club.forEach((x,n)=>{if(x.top||!x.col||T[n])return;const c=x.col.split('/');if(c.length>=2)T[n]=['liso','#'+c[0],'#'+(c[2]||c[1]),'#'+c[1],'#'+(c[3]||c[0])]})};
})();

/* =========================================================
   PLANTELES GENERADOS (no son jugadores reales): 25 por club, 3 ARQ, 8 DEF, 8 MED, 6 DEL, edades realistas y nivel según
   la división. Siempre iguales (semilla = nombre del club). Solo entran a la base del mercado los del país de tu
   carrera; se cargan acá (antes de que se arme la base) para no armarla dos veces al abrir.
   ========================================================= */
(function(){
const R=window.MC_DIVR,D=window.MC_DIVS;if(!R)return;
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>{let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const N=window.MC_DIV_NOMBRES||{};
const POOL_DE={Inglaterra:'en',Escocia:'en',Gales:'en',Irlanda:'en','Irlanda del Norte':'en','Estados Unidos':'en',Jamaica:'en',Australia:'en',
 Nigeria:'afe',Ghana:'afe',Gambia:'afe','Sierra Leona':'afe',Senegal:'af','Malí':'af','Costa de Marfil':'af','Camerún':'af',Guinea:'af','RD Congo':'af','Burkina Faso':'af',
 Argelia:'ar',Marruecos:'ar','Túnez':'ar',Brasil:'br',Portugal:'pt','Cabo Verde':'pt',Angola:'pt','Guinea-Bisáu':'pt',
 'España':'es',Argentina:'es',Uruguay:'es',Colombia:'es',Venezuela:'es',Paraguay:'es','Chile':'es','Perú':'es','México':'es','Ecuador':'es',
 Italia:'it',Albania:'ba',Croacia:'ba',Serbia:'ba','Bosnia y Herzegovina':'ba',Montenegro:'ba','Macedonia del Norte':'ba',Kosovo:'ba',Georgia:'ba',
 Alemania:'de',Austria:'de',Suiza:'de',Polonia:'pl',Francia:'fr','Bélgica':'nl','Países Bajos':'nl',Surinam:'nl',Curazao:'nl','Turquía':'tr',
 Dinamarca:'sc',Suecia:'sc',Noruega:'sc',Islandia:'sc',Finlandia:'sc'};
const pool=nat=>N[POOL_DE[nat]]||N.en||{f:['Alex'],l:['Smith']};
const GENP={},GENBY=new Map();let RES=null,HAVE=null;
function reservedNames(){const s=new Set();const P=window.MC_PLAYERS;if(P&&P.rows)P.rows.forEach(r=>s.add(fold(r[0])));
 if(typeof ROSTERS!=='undefined')for(const c in ROSTERS)(ROSTERS[c]||[]).forEach(p=>p&&p[0]&&s.add(fold(p[0])));return s}
function existingAt(){/* jugadores que la base ya tenía en esos clubes (restos de la base anterior): se respetan y se completa hasta 25 */
 const m=new Map();const P=window.MC_PLAYERS;if(!P||!P.rows)return m;P.rows.forEach(r=>{const c=P.clubs[r[6]];const x=R.club.get(c);if(!x||x.top)return;const a=m.get(c)||[];a.push(r[1]);m.set(c,a)});return m}
const PLAN=[['POR',1,'T'],['POR',1,'S'],['POR',1,'J'],['DEF',4,'T'],['DEF',2,'S'],['DEF',2,'J'],['MED',4,'T'],['MED',2,'S'],['MED',2,'J'],['DEL',3,'T'],['DEL',2,'S'],['DEL',1,'J']];
function slots(have){const need={POR:3,DEF:8,MED:8,DEL:6};(have||[]).forEach(p=>{if(need[p]>0)need[p]--});const out=[];
 PLAN.forEach(([pos,n,rol])=>{for(let i=0;i<n;i++)if(need[pos]>0){need[pos]--;out.push([pos,rol])}});return out}
/* se genera por país (y siempre en el mismo orden): nombres únicos dentro del país y distintos de la base real */
function genPais(pais){if(GENP[pais])return GENP[pais];const t0=Date.now();const GEN=GENP[pais]=[];if(!RES){RES=reservedNames();HAVE=existingAt()}const used=RES,have=HAVE;
 const FL=window.MC10_FLAGS=window.MC10_FLAGS||{};
 D.divs.forEach(d=>{if(d.p!==pais)return;const mix=(D.nacs&&D.nacs[d.p])||[[d.p,1]];
  d.t.forEach(t=>{const club=t[0],x=R.club.get(club),R0=rng(hash('gen1|'+club)),T=R.fuerza(club)||d.f,rows=[];
   const pickNat=()=>{let u=R0(),acc=0;for(const [n,w] of mix){acc+=w;if(u<=acc)return n}return mix[0][0]};
   const used_n=new Set();
   slots(have.get(club)).forEach(([pos,rol],k)=>{
    const nat=k<3&&pos!=='POR'?d.p:pickNat();const P=pool(nat);
    let name='',tries=0;do{const f=P.f[Math.floor(R0()*P.f.length)],l=P.l[Math.floor(R0()*P.l.length)];name=tries>6?f+' '+l+' '+P.l[Math.floor(R0()*P.l.length)]:f+' '+l;tries++}while((used.has(fold(name))||used_n.has(name))&&tries<20);
    used.add(fold(name));used_n.add(name);
    let age,off;if(rol==='T'){age=22+Math.floor(R0()*11);off=.5+R0()*3}else if(rol==='S'){age=20+Math.floor(R0()*15);off=-2.5+R0()*3}else{age=17+Math.floor(R0()*4);off=-11+R0()*5}
    if(age>=33)off-=1;const rating=clamp(Math.round(T+off-.6),40,88);
    const value=Math.max(.01,Math.round(.06*Math.pow(1.17,rating-55)*(age<=21?1.4:age<=24?1.15:age>=33?.4:age>=30?.7:1)*1000)/1000);
    rows.push([name,pos,rating,age,nat,value,club,null]);FL[fold(name)]=32});
   rows.forEach((r,i)=>{r[7]=i+1});
   const ex=rows;ex.__gen=1;GENBY.set(club,rows);rows.forEach(r=>GEN.push(r))})});
 R.genMs=(R.genMs||0)+Date.now()-t0;return GEN}
const paisClub=club=>{const x=R.club.get(club);return x&&R.divs[x.code]?R.divs[x.code].p:null};
R.generados=club=>{const p=paisClub(club);if(p)genPais(p);return(GENBY.get(club)||[]).map(r=>r.slice())};
R.totalGenerados=()=>Object.keys(R.paises).reduce((a,p)=>a+genPais(p).length,0);
/* solo los del país de tu carrera (o del club que estás eligiendo) entran a la base del mercado */
let ACTIVO='';
function setActivo(pais){pais=pais||'';if(pais===ACTIVO)return;ACTIVO=pais;try{localStorage.setItem('mc_div_pais',pais)}catch(e){}
 const keep=(window.MC_EXTRA||[]).filter(r=>!(r&&r.__gdiv));let add=[];
 if(pais&&R.paises[pais]){add=genPais(pais).map(r=>{const o=r.slice(0,7);o.__gdiv=1;return o})}
 window.MC_EXTRA=keep.concat(add);try{window.mcResetDB&&mcResetDB()}catch(e){}try{window.mcClearGRL&&mcClearGRL()}catch(e){}}
R.setActivo=setActivo;R.activo=()=>ACTIVO;
/* país de la carrera abierta la última vez (se guarda al abrir/crear): así la base se arma una sola vez */
try{const p=localStorage.getItem('mc_div_pais');if(p&&R.paises[p])setActivo(p)}catch(e){}
})();
