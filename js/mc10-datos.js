/* ===== MODO CARRERA 10.0 · BASE MUNDIAL =====
   Integra data/mundo.js (ligas de todo el mundo extraídas de los PDF) en las estructuras existentes
   (CLUBS, LEAGUES, LEAGUE_ORDER, MC_PLAYERS) SIN tocar la Liga Argentina ni las partidas guardadas.
   - Argentina: se conserva tal cual (clubes, planteles, formato). Solo se corrigen GRL/nacionalidades vía MC_ARG_FIX.
   - Países que vienen en los PDF: la lista de clubes y los planteles salen de los PDF.
   - Jugadores de la base anterior que NO están en los PDF se conservan (no se borra nada que funcione).
*/
(function(){
'use strict';
const W=window.MC_WORLD;if(!W||!window.MC_PLAYERS){console.warn('MC10: falta data/mundo.js');return}
const P=window.MC_PLAYERS;
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const KEEP_COUNTRIES=['Argentina'];   /* 10.0.1: Portugal ya viene reconstruida en data/mundo.js (2026/27); Argentina se conserva intacta */
/* ---- metadatos de países ---- */
const META={};W.countries.forEach(([n,iso,conf,reg])=>{META[n]={iso,conf,reg}});
META.Argentina=META.Argentina||{iso:'AR',conf:'CONMEBOL',reg:'Sudamérica'};
function flag(country){const m=META[country];if(!m)return'🏳️';const iso=m.iso;
 if(iso==='GB-ENG')return'🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}';if(iso==='GB-SCT')return'🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}';if(iso==='GB-WLS')return'🏴\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}';if(iso==='GB-NIR')return'🇬🇧';if(iso==='XK')return'🇽🇰';
 return iso.replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0)))}
/* ---- clubes por país ---- */
const byCountry={};W.clubs.forEach((c,i)=>{const cn=W.countries[c[1]][0];(byCountry[cn]=byCountry[cn]||[]).push(i)});
const oldClubs={};for(const k in CLUBS)oldClubs[k]=CLUBS[k].slice();
const worldClubNames=new Set(W.clubs.map(c=>c[0]));
/* ---- jugadores: primero los del mundo, luego los de la base anterior que no estén repetidos ---- */
const nats=P.nats.slice(),clubs=P.clubs.slice(),nIdx=new Map(nats.map((n,i)=>[n,i])),cIdx=new Map(clubs.map((c,i)=>[c,i]));
/* 10.0.1: la base anterior usaba otros nombres para algunos países y las selecciones quedaban partidas en dos */
const NAT_ALIAS={'Rumania':'Rumanía','Rep. Checa':'Chequia','Bosnia':'Bosnia y Herzegovina','Rep. Centroafricana':'República Centroafricana'};
const ni=n0=>{const n=NAT_ALIAS[n0]||n0;if(!nIdx.has(n)){nIdx.set(n,nats.length);nats.push(n)}return nIdx.get(n)};
const ci=c=>{if(!cIdx.has(c)){cIdx.set(c,clubs.length);clubs.push(c)}return cIdx.get(c)};
const rows=[],flags={},seen=new Set();
/* 1) la Liga Argentina va primero y nunca se toca */
const argSet=new Set(oldClubs.Argentina||[]);
/* Liga Argentina: solo se corrige la nacionalidad de jugadores extranjeros verificados en fuentes periodísticas 2026
   (El Gráfico, Caracol, Emol, PrensaFútbol). No se tocan clubes, planteles, GRL ni el formato. */
const ARG_NAT_FIX={"Jaminton Campaz": "Colombia", "Diego Valoyes": "Colombia", "Duván Vergara": "Colombia", "Danilo Arboleda": "Colombia", "Jhon Renteria": "Colombia", "Yeison Murillo": "Colombia", "Harlen Castillo": "Colombia", "Juan Pérez": "Colombia", "Santiago Arias": "Colombia", "Enzo Martinez": "Uruguay", "Matias Abaldo": "Uruguay", "Santiago Mele": "Uruguay", "Fernando Muslera": "Uruguay", "Miguel Merentiel": "Uruguay", "Matias Coccaro": "Uruguay", "Ivan Morales": "Chile", "Carlos Palacios": "Chile", "Williams Alarcón": "Chile", "Gabriel Arias": "Chile", "Luciano Cabral": "Chile", "Lautaro Millan": "Chile", "Bruno Barticciotto": "Chile", "Matías Catalán": "Chile", "Ulises Ortegoza": "Chile", "Nicolas Guerra": "Chile", "Matias Sepulveda": "Chile", "Vicente Pizarro": "Chile", "Guillermo Soto": "Chile", "Diego Valdés": "Chile", "Matias Galarza": "Paraguay", "José Canale": "Paraguay", "Alex Arce": "Paraguay", "Blas Armoa": "Paraguay", "Juan Franco": "Paraguay", "Adam Bareiro": "Paraguay", "Enner Valencia": "Ecuador", "Hernán Galíndez": "Ecuador", "Lucas Blondel": "Suiza"};
let argFixed=0;
/* 11.0: homónimos dentro de la Liga Argentina (dos jugadores distintos con el mismo nombre): el segundo se distingue
   con el club, como en el resto del mundo; antes el mercado global unía a los dos en un solo registro. */
let argHomonyms=0;
P.rows.forEach(r=>{const club=P.clubs[r[6]];if(!argSet.has(club))return;let nm=r[0];if(seen.has(fold(nm))){nm=nm+' ('+club+')';argHomonyms++}seen.add(fold(nm));let nat=P.nats[r[4]];if(ARG_NAT_FIX[r[0]]&&ARG_NAT_FIX[r[0]]!==nat){nat=ARG_NAT_FIX[r[0]];argFixed++}rows.push([nm,r[1],r[2],r[3],ni(nat),r[5],ci(club),r[7]||null])});
const argN=rows.length;
/* 2) jugadores de los PDF */
W.rows.forEach(r=>{const club=W.clubs[r[6]][0],k=fold(r[0]);
 /* [nombre,pos,GRL,edad,nac,valor,club,dorsal] — mismo formato que data/jugadores.js */
 const row=[r[0],r[1],r[2],r[3],ni(W.nats[r[4]]),r[5],ci(club),r[7]||null];
 if(seen.has(k)){/* homónimo en otro club: se agrega con sufijo para no perderlo */row[0]=r[0]+' ('+club+')'}
 seen.add(fold(row[0]));rows.push(row);if(r[8]||W.clubs[r[6]][2])flags[fold(row[0])]=(r[8]||0)|((W.clubs[r[6]][2]||0)<<8)});
const replaced=new Set();for(const cn in byCountry)if(!KEEP_COUNTRIES.includes(cn))(oldClubs[cn]||[]).forEach(c=>replaced.add(c));
let kept=0,dropped=0;
/* 3) resto de la base anterior (Portugal y clubes que no vienen en los PDF) */
P.rows.forEach(r=>{const club=P.clubs[r[6]],k=fold(r[0]);if(argSet.has(club))return;
 if(seen.has(k)){dropped++;return}                       /* ya está en los PDF (dato más reciente) */
 if(replaced.has(club)&&worldClubNames.has(club)){dropped++;return} /* club reemplazado por el plantel del PDF */
 seen.add(k);rows.push([r[0],r[1],r[2],r[3],ni(P.nats[r[4]]),r[5],ci(club),r[7]||null]);kept++});
P.nats=nats;P.clubs=clubs;P.rows=rows;P.v=10;
P.fuente=(P.fuente||'')+' · MODO CARRERA 10.0: ligas mundiales desde los PDF del usuario.';
/* las plantillas embebidas antiguas (ROSTERS) solo se mantienen para clubes que NO vienen en los PDF */
for(const c in ROSTERS)if(worldClubNames.has(c))ROSTERS[c]=[];
window.MC10_FLAGS=flags;
/* ---- ligas ---- */
const strength=new Map();{const acc=new Map();rows.forEach(r=>{const c=clubs[r[6]];const a=acc.get(c)||[];a.push(r[2]);acc.set(c,a)});
 acc.forEach((a,c)=>{a.sort((x,y)=>y-x);const t=a.slice(0,14);strength.set(c,t.reduce((s,x)=>s+x,0)/t.length)})}
window.mcClubStrength=c=>strength.get(c)||60;
const COLORS={UEFA:'#2f6bff',CONMEBOL:'#1fa04a',CONCACAF:'#d9534f',AFC:'#e08a1e',CAF:'#2aa198',OFC:'#8e44ad'};
const roundsFor=(lg,n)=>{const one=n%2?n:n-1;let r=one*lg.legs;if(lg.apcl)r=one*lg.legs*2;
 (lg.grp||[]).forEach(g=>{const m=g[1]-g[0]+1,o=m%2?m:m-1;r=Math.max(r,one*lg.legs+o*g[2])});return r};
const abbrev=n=>n.split(/\s+/).filter(w=>/^[A-ZÁÉÍÓÚ0-9]/.test(w)).map(w=>w[0]).join('').slice(0,3).toUpperCase()||n.slice(0,2).toUpperCase();
const order=LEAGUE_ORDER.slice();
for(const cn in byCountry){if(KEEP_COUNTRIES.includes(cn))continue;
 const lg=W.leagues[cn],names=byCountry[cn].map(i=>W.clubs[i][0]);
 CLUBS[cn]=names;
 const old=LEAGUES[cn]||{};
 const fmt=[];
 fmt.push(`${names.length} equipos`);
 if(lg.apcl)fmt.push(`Apertura y Clausura (${lg.legs===1?'una rueda':'dos ruedas'} cada uno)`);else fmt.push(lg.legs===1?'una rueda':lg.legs===2?'ida y vuelta':lg.legs+' ruedas');
 if(lg.grp)fmt.push('segunda fase por grupos según la posición');
 if(lg.po)fmt.push(`playoffs de ${lg.po}`);
 LEAGUES[cn]={nombre:lg.n,abrev:old.abrev||abbrev(lg.n),color:old.color||COLORS[(META[cn]||{}).conf]||'#2f6bff',fecha:roundsFor(lg,names.length),
  formato:fmt.join(', ')+'.'+(lg.note?' '+lg.note:''),cont:old.cont||'',desc:lg.rel,copa:(lg.cups||[]).join(' / '),fuerza:old.fuerza||0,
  conf:(META[cn]||{}).conf,reg:(META[cn]||{}).reg,mc10:lg,ok:lg.ok};
 if(!order.includes(cn))order.push(cn);
 names.forEach(c=>{const s=strength.get(c)||60;CLUB_TIER[c]=s>=80?5:s>=74?4:s>=68?3:s>=60?2:1})}
['Argentina','Portugal'].forEach(cn=>{if(LEAGUES[cn]){LEAGUES[cn].conf=META[cn].conf;LEAGUES[cn].reg=META[cn].reg;
 LEAGUES[cn].mc10=LEAGUES[cn].mc10||{n:LEAGUES[cn].nombre,legs:cn==='Argentina'?1:2,grp:null,po:0,apcl:0,rel:LEAGUES[cn].desc,cups:[LEAGUES[cn].copa],ok:1,note:''}}});
LEAGUE_ORDER.length=0;order.forEach(x=>LEAGUE_ORDER.push(x));
window.MC10={META,flag,byCountry:Object.fromEntries(Object.entries(CLUBS).map(([k,v])=>[k,v.slice()])),fold,stats:{kept,dropped,world:W.rows.length,total:rows.length,argFixed,argHomonyms},
 confOf:cn=>(META[cn]||{}).conf||'—',regOf:cn=>(META[cn]||{}).reg||'—'};
/* ---- valor de mercado legible (los PDF traen valores de miles de euros) ---- */
window.mcMoney=function(v){v=+v||0;if(v>=1)return '€'+(Math.round(v*10)/10).toLocaleString('es')+' M';return '€'+Math.round(v*1000).toLocaleString('es')+' mil'};
})();
/* ===== Escudos: primero se busca el archivo local assets/escudos/<nombre>.png (así, cuando agregues los escudos,
   aparecen solos), después el banco de logos en línea y, si no hay ninguno, las iniciales del club. ===== */
(function(){
 const slugOf=n=>(typeof ARG_BADGES!=='undefined'&&ARG_BADGES[n])||(typeof SLUG_OVERRIDE!=='undefined'&&SLUG_OVERRIDE[n])||_kebab(n);
 window.mcBadgeFile=n=>'assets/escudos/'+slugOf(n)+'.png';
 window.clubBadge=function(name,size){size=size||34;name=String(name||'');
  const initials=name.replace(/\(.*\)/,'').split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,3).toUpperCase();
  const slug=slugOf(name),local='assets/escudos/'+slug+'.png',remote='https://www.footylogos.com/dls/logo/rgba-v1/'+slug+'.png';
  return `<span class="badge-wrap" style="width:${size}px;height:${size}px"><img class="club-badge" src="${local}" alt="Escudo ${name.replace(/"/g,'&quot;')}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.r){this.dataset.r=1;this.src='${remote}'}else{this.style.display='none';this.nextElementSibling.style.display='inline-flex'}"><span class="club-badge-fallback" style="width:${size}px;height:${size}px;display:none">${initials}</span></span>`};
})();
