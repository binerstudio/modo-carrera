/* =====================================================================
   MODO CARRERA 12.0 · CAPA DE DISEÑO
   ---------------------------------------------------------------------
   Este archivo SOLO cambia cómo se ve y se navega la aplicación.
   · No modifica data/jugadores.js ni data/mundo.js.
   · No cambia ningún registro de jugador, club, liga ni partida guardada.
   · No reemplaza la lógica: llama a las mismas funciones que ya existían
     (go, openMatch, mcPlayerMenu, upgrade, renewPlayer, setMarketTab...).
   · Todo lo que muestra sale de la partida real (career) y del motor (MC10L / mcWorld).
   Si algo de esta capa fallara, el juego sigue funcionando con la interfaz anterior.
   ===================================================================== */
(function(){
'use strict';
if(window.MC12)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const q=s=>"'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
const C=()=>{try{return typeof career!=='undefined'&&career?career:null}catch(e){return null}};
const nm=n=>{try{return window.mcShowName?mcShowName(n):n}catch(e){return n}};
const sur=n=>{n=String(nm(n)||'');const p=n.trim().split(/\s+/);return p.length>1?p.slice(1).join(' '):n};
const money=v=>{try{return window.mcMoney?mcMoney(v):'$'+v+'M'}catch(e){return '$'+v+'M'}};
const flag=c=>{try{return c&&c!=='—'&&window.MC10?MC10.flag(c):''}catch(e){return ''}};
const badge=(n,s)=>{try{return n?clubBadge(n,s):''}catch(e){return ''}};
const icons=r=>{try{ico(r||document)}catch(e){}};
const warn=(t,e)=>{try{console.warn('[MC12] '+t,e)}catch(_){}};
const after=(name,fn)=>{const o=window[name];if(typeof o!=='function')return false;window[name]=function(){const r=o.apply(this,arguments);try{fn.apply(this,arguments)}catch(e){warn(name,e)}return r};return true};
const world=()=>{try{return window.mcWorld?mcWorld():null}catch(e){return null}};
const lgName=c=>{try{return (LEAGUES[c]&&LEAGUES[c].nombre)||c}catch(e){return c}};
const tier=r=>r>=85?'t5':r>=75?'t4':r>=68?'t3':r>=60?'t2':'t1';
const grl=(r,cls)=>`<span class="m12-grl ${tier(r)} ${cls||''}">${r}</span>`;
const seasonTxt=c=>c?`${c.season}/${String(c.season+1).slice(-2)}`:'';

/* ---------- iconos nuevos (se suman al juego de iconos existente) ---------- */
try{Object.assign(I,{
 news:'M4 5h13v14H6a2 2 0 01-2-2zM17 9h3v8a2 2 0 01-2 2M8 9h5M8 13h5M8 16h3',
 cal:'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5M8 14h2M14 14h2',
 coin:'M12 3a9 9 0 100 18 9 9 0 000-18M12 7v10M15 9.500c-.6-1-1.600-1.500-3-1.500-1.700 0-3 .8-3 2s1.300 1.800 3 2 3 .8 3 2-1.300 2-3 2c-1.400 0-2.400-.5-3-1.500',
 stadium:'M3 9c0-2 4-3.500 9-3.500S21 7 21 9v7c0 2-4 3.500-9 3.500S3 18 3 16zM3 9c0 2 4 3.500 9 3.500S21 11 21 9M7 12.500V19M17 12.500V19M12 13v6.500',
 cap:'M2 9l10-5 10 5-10 5zM6 11.500V16c0 1.500 2.700 3 6 3s6-1.500 6-3v-4.500M22 9v6',
 chart:'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3M20 16V6',
 doc:'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7M9 8h3',
 heart:'M12 20s-7-4.500-7-10a4 4 0 017-2.600A4 4 0 0119 10c0 5.500-7 10-7 10z',
 crown:'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
 medal:'M12 13a4.500 4.500 0 100 9 4.500 4.500 0 000-9M8 3l4 7 4-7M6 3h12',
 arrow:'M5 12h14M13 6l6 6-6 6',
 back:'M19 12H5M11 6l-6 6 6 6',
 plus:'M12 5v14M5 12h14',
 bolt:'M13 2L4 14h7l-1 8 9-12h-7z',
 building:'M4 21V7l8-4 8 4v14M9 21v-6h6v6M8 10h2M14 10h2M8 13.500h2M14 13.500h2',
 cross:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
 gym:'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6'
})}catch(e){warn('iconos',e)}

/* ---------- retrato del jugador ----------
   No hay fotografías en la base de datos, así que se dibuja una silueta con la camiseta del color de su puesto y su dorsal.
   Si más adelante sumás fotos, alcanza con definir window.MC_FOTOS={"Nombre del jugador":"assets/jugadores/archivo.jpg"}
   (por ejemplo en un archivo assets/jugadores/fotos.js) y aparecen solas en todas las pantallas. */
const POSC={POR:['#f0b93a','#8a5a06'],DEF:['#3d8bff','#123e8f'],MED:['#34c873','#0f6032'],DEL:['#f0535f','#84151f']};
/* 12.2.2: foto exacta por jugador (nombre interno + club), sin confundir homónimos */
const fdn=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function fotoDe(p){const F=window.MC_FOTOS||{},CL=window.MC_FOTOS_CLUB||{},n=p&&p.name;if(!n)return '';
 if(!p.disp&&F[n]&&(!p.club||!CL[n]||CL[n]===p.club))return F[n];
 if(!window.__mcFD){const D={};for(const k in F){const c=CL[k];if(!c)continue;D[fdn(nm(k))+'|'+c]=F[k];D[fdn(k)+'|'+c]=F[k]}window.__mcFD=D}
 const c=p.club;if(c){const D=window.__mcFD;return D[fdn(n)+'|'+c]||D[fdn(nm(n))+'|'+c]||''}
 return ''}
function av(p,size,cls){p=p||{};const c=POSC[p.pos]||['#7f93bd','#33415f'];let ph='';
 try{ph=fotoDe(p);if(!ph&&!p.disp&&window.MC_FOTOS_AUTO&&p.name)ph='assets/jugadores/'+String(p.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.jpg'}catch(e){}
 return `<span class="m12-av ${cls||''}"${size?` style="--s:${size}px"`:''}><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="16.500" r="8" fill="#cfd9ee"/><path d="M6 48c0-11 6.500-17 13-18l5 4 5-4c6.500 1 13 7 13 18z" fill="${c[0]}"/><path d="M19 30l5 4 5-4 1.500 2.200L24 38l-6.500-5.800z" fill="${c[1]}"/>${p.number?`<text x="24" y="46.500" text-anchor="middle" font-size="8" font-weight="900" fill="#fff" font-family="Arial,sans-serif">${esc(p.number)}</text>`:''}</svg>${ph?`<img src="${esc(ph)}" alt="" loading="lazy" onload="this.parentNode.classList.add('hasph')" onerror="this.remove()">`:''}</span>`}

/* ---------- marca ---------- */
const CROWN='<svg viewBox="0 0 40 24"><path d="M2 8l8 7 10-13 10 13 8-7-3 14H5z" fill="currentColor"/><circle cx="20" cy="2.500" r="2.200" fill="currentColor"/><circle cx="2.500" cy="7.500" r="1.900" fill="currentColor"/><circle cx="37.500" cy="7.500" r="1.900" fill="currentColor"/></svg>';
const logo=sub=>`<a class="m12-logo" onclick="go('home')" role="button" title="MODO CARRERA · Inicio"><span class="cr">${CROWN}</span><b>MODO</b><b>CARRERA</b>${sub?'<small>MANAGER DE FÚTBOL</small>':''}</a>`;

/* ---------- utilidades de liga (solo lectura) ---------- */
function leagueInfo(){const c=C();if(!c||!c.league||!window.MC10L)return null;try{const L=c.league;const t=MC10L.table(L);const ui=L.teams.indexOf(c.club);const pos=t.findIndex(r=>r.name===c.club);return{L,t,ui,pos,row:t[pos]||null}}catch(e){return null}}
function userFixtures(){const li=leagueInfo();if(!li||li.ui<0)return[];const out=[];li.L.rounds.forEach((d,r)=>{d.forEach(f=>{if(f[0]===li.ui||f[1]===li.ui){const home=f[0]===li.ui;const played=f[2]!=null;const gf=home?f[2]:f[3],ga=home?f[3]:f[2];
 out.push({r,home,opp:li.L.teams[home?f[1]:f[0]],played,gf,ga,res:!played?'':gf>ga?'W':gf<ga?'L':'D',kind:(li.L.kinds||[])[r]||'L'})}})});return out}
function current(){try{return window.mcCurrent?mcCurrent():null}catch(e){return null}}
function userComps(){const c=C(),w=world();if(!c||!w)return[];try{window.mcEnsureComps&&mcEnsureComps()}catch(e){}return ((w.comps&&w.comps.list)||[]).filter(x=>x.teams&&x.teams.includes(c.club))}
function allComps(){const w=world();if(!w)return[];try{window.mcEnsureComps&&mcEnsureComps()}catch(e){}return (w.comps&&w.comps.list)||[]}
function leagueTab(tab){try{go('league');const b=[...document.querySelectorAll('#league .tabs button')].find(x=>(x.getAttribute('onclick')||'').indexOf("'"+tab+"'")>=0);if(b)b.click()}catch(e){warn('leagueTab',e)}}

/* ---------- cabecera de pantalla ---------- */
function heroize(id,icon,eyebrow){const s=$(id);if(!s||s.querySelector(':scope>.m12-hero'))return;const eb=s.querySelector(':scope>.eyebrow'),h=s.querySelector(':scope>h1');if(!h)return;
 const p=h.nextElementSibling&&h.nextElementSibling.tagName==='P'?h.nextElementSibling:null;
 const hero=document.createElement('div');hero.className='m12-hero';hero.innerHTML=`<i class="hi" data-i="${icon}"></i><div class="ht"></div>`;s.insertBefore(hero,s.firstChild);
 const ht=hero.querySelector('.ht');if(eb){if(eyebrow)eb.textContent=eyebrow;ht.appendChild(eb)}ht.appendChild(h);if(p)ht.appendChild(p);icons(hero)}

/* ---------- dos columnas en pantallas grandes (en el teléfono no cambia el orden) ---------- */
function cols(id,A,B,cls){const s=$(id);if(!s||s.querySelector(':scope>.m12-cols'))return null;
 const pick=l=>l.map(x=>typeof x==='string'?s.querySelector(x):x).filter(e=>e&&e.parentNode===s);
 const a=pick(A),b=pick(B);if(!a.length||!b.length)return null;const kids=[...s.children];
 const first=a.concat(b).sort((x,y)=>kids.indexOf(x)-kids.indexOf(y))[0];
 const w=document.createElement('div');w.className='m12-cols'+(cls?' '+cls:'');const ca=document.createElement('div');ca.className='m12-col a';const cb=document.createElement('div');cb.className='m12-col b';
 s.insertBefore(w,first);w.appendChild(ca);w.appendChild(cb);
 a.forEach(e=>{e.style.order=kids.indexOf(e);ca.appendChild(e)});b.forEach(e=>{e.style.order=kids.indexOf(e);cb.appendChild(e)});return w}
function mi(id,icon){const b=$(id),m=b&&b.closest('.metric');if(!m||m.dataset.ico)return;m.dataset.ico=icon;const i=document.createElement('i');i.className='m12-mi';i.dataset.i=icon;const sm=m.querySelector('small');if(sm)sm.insertBefore(i,sm.firstChild);else m.insertBefore(i,m.firstChild)}
function panel(id,cls){const d=document.createElement('div');d.id=id;d.className='m12-panel'+(cls?' '+cls:'');return d}

/* ---------- barra superior y navegación ---------- */
function chrome(){
 const h=document.querySelector('header');
 if(h&&!h.querySelector('.m12-logo')){h.insertAdjacentHTML('afterbegin',logo(false));
  const g=h.querySelector('.x-gear');const s=document.createElement('span');s.className='m12-season';s.id='m12Season';s.innerHTML='<i data-i="cal"></i><span></span>';if(g)h.insertBefore(s,g);else h.appendChild(s);
  const club=h.querySelector('.x-club');if(club)club.addEventListener('click',()=>{try{go(C()?'dashboard':'newcareer')}catch(e){}});icons(h)}
 const n=document.querySelector('nav.nav');
 if(n&&!n.querySelector('.m12-side-top')){
  const top=document.createElement('div');top.className='m12-side-top';top.innerHTML=logo(true);n.insertBefore(top,n.firstChild);
  const ord={home:1,dashboard:2,tactics:4,squad:5,market:6,more:99};n.querySelectorAll('button[data-go]').forEach(b=>{b.style.order=ord[b.dataset.go]||50});
  const extra=[['news','news','Noticiero',3],['league','trophy','Competición',7],['board','coin','Finanzas',8],['advanced','cap','Academia',9],['world','globe','Mundo',10]];
  extra.forEach(x=>{const a=document.createElement('a');a.className='m12-nl';a.dataset.go=x[0];a.setAttribute('role','button');a.tabIndex=0;a.style.order=x[3];a.innerHTML=`<i data-i="${x[1]}"></i>${x[2]}`;
   a.addEventListener('click',()=>{try{if(x[0]==='world'){C()?mc10World():go('newcareer')}else go(x[0])}catch(e){warn('nav',e)}});
   a.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();a.click()}});n.appendChild(a)});
  const sep=document.createElement('div');sep.className='m12-side-sep';sep.style.order=98;n.appendChild(sep);icons(n)}
 let tk=false;window.addEventListener('scroll',()=>{if(tk)return;tk=true;requestAnimationFrame(()=>{document.body.classList.toggle('m12-scrolled',window.scrollY>36);tk=false})},{passive:true});
}
function seasonChip(){const s=$('m12Season');if(!s)return;const c=C();const t=s.querySelector('span');if(!c){s.style.visibility='hidden';return}s.style.visibility='';
 const tot=(c.league&&(c.league.total||c.league.rounds.length))||0;t.textContent=`Temporada ${seasonTxt(c)}`+(tot?` · Fecha ${Math.min((c.round||0)+1,tot)}/${tot}`:'')}
function navState(id){document.querySelectorAll('.nav .m12-nl').forEach(a=>a.classList.toggle('active',a.dataset.go===id));
 if(id==='player'){const b=document.querySelector('.nav button[data-go=squad]');if(b)b.classList.add('active')}
 try{if(id)document.body.dataset.page=id}catch(e){}}

/* ---------- A. INICIO ---------- */
function homeBuild(){const s=$('home');if(!s)return;let box=$('m12Home');
 if(!box){box=document.createElement('div');box.id='m12Home';box.className='m12-home';const lg=s.querySelector('.x-leagues');s.insertBefore(box,lg||null);
  box.innerHTML=`<div class="m12-home-logo">${logo(true)}</div><div class="m12-home-top" id="m12HomeTop"></div><div class="m12-st">Ligas disponibles<a onclick="mc10OpenFinder()">Ver todas ›</a></div>`;
  const b=document.createElement('button');b.className='m12-intl';b.id='m12Intl';b.setAttribute('onclick',"career?mc10World('comps'):mc10OpenFinder()");
  b.innerHTML='<i data-i="trophy"></i><span><b>Competiciones internacionales</b><small>Copas continentales, selecciones, rankings y torneos de todo el mundo</small></span><span class="go">›</span>';
  if(lg&&lg.nextSibling)s.insertBefore(b,lg.nextSibling);else s.appendChild(b)}
 const c=C(),need="career?X:go('newcareer')";const T=(icon,t,sub,on,cls)=>`<button class="m12-tile ${cls||''}" onclick="${on}"><i data-i="${icon}"></i><span><b>${t}</b><small>${sub}</small></span></button>`;
 let cta;
 if(c){const cur=current();const li=leagueInfo();
  cta=`<div class="m12-cta"><div class="eyebrow">CONTINUAR CARRERA</div><div class="who">${badge(c.club,62)}<div><h2>${esc(c.club)}</h2><small>${esc(lgName(c.country))} · TEMPORADA ${seasonTxt(c)}${li&&li.pos>=0?' · '+(li.pos+1)+'º':''}</small></div></div><p>${cur&&cur.home?`Próximo partido: ${esc(cur.home)} vs ${esc(cur.away)}.`:'Tu club te espera en el centro de operaciones.'}</p><button class="btn" onclick="go('dashboard')"><i data-i="play"></i>CONTINUAR</button></div>`}
 else cta=`<div class="m12-cta"><div class="eyebrow">MANAGER DE FÚTBOL</div><h2>Iniciá tu carrera</h2><p>Tomá el control de un club y llevalo a la gloria.</p><button class="btn" onclick="go('newcareer')"><i data-i="play"></i>NUEVA PARTIDA</button></div>`;
 const tiles=[];
 if(c)tiles.push(T('plus','Nueva partida','Empezá otra carrera desde cero',"go('newcareer')"));
 tiles.push(T('folder','Cargar partida','Tus carreras guardadas',"go('saves')",'gold'));
 tiles.push(T('trophy','Torneos y copas','Liga, copas y cuadros',need.replace('X',"go('league')")));
 tiles.push(T('swap','Mercado de fichajes','Buscá, ofertá y vendé',need.replace('X',"go('market')")));
 tiles.push(T('chart','Estadísticas generales','Goleadores, asistencias y vallas',need.replace('X',"MC12.leagueTab('scorers')")));
 tiles.push(T('cap','Academia juvenil','Promesas, ojeadores y staff',need.replace('X',"go('advanced')")));
 tiles.push(T('news','Noticiero','Lo último de tu partida',need.replace('X',"go('news')")));
 tiles.push(T('list','Administrar jugadores','Base de datos del juego',"go('players')"));
 tiles.push(T('save','Copias de seguridad','Exportá e importá tus datos',"go('backup')"));
 tiles.push(T('gear','Configuración','Idioma, sonido y reglas',"go('more')"));
 if(tiles.length%2)tiles[tiles.length-1]=tiles[tiles.length-1].replace('m12-tile ','m12-tile wide ');
 const top=$('m12HomeTop');if(top){top.innerHTML=cta+`<div class="m12-tiles">${tiles.join('')}</div>`}icons(box);icons($('m12Intl'))}

/* ---------- C. CLUB ---------- */
function dashSetup(){const s=$('dashboard');if(!s||s.dataset.m12)return;s.dataset.m12='1';
 mi('dashPoints','medal');mi('dashRank','chart');mi('dashBudget','coin');
 const next=$('dashFixture')&&$('dashFixture').closest('.card');if(next)next.classList.add('m12-gold');
 const conf=$('boardValue')&&$('boardValue').closest('.grid2');const news=$('clubNews')&&$('clubNews').closest('.card');
 const qb=s.querySelector('button[onclick="go(\'tactics\')"]');const quick=qb&&qb.closest('.card');
 if(quick){const g=qb.closest('.grid2');if(g)g.classList.add('m12-old');const d=document.createElement('div');d.className='m12-quick';
  const B=(i,t,on)=>`<button onclick="${on}"><i data-i="${i}"></i>${t}</button>`;
  d.innerHTML=B('news','Noticiero',"go('news')")+B('cal','Calendario',"MC12.leagueTab('calendar')")+B('trophy','Torneos',"MC12.leagueTab('cup')")+B('people','Plantel',"go('squad')")+B('pitch','Tácticas',"go('tactics')")+B('swap','Mercado',"go('market')")+B('coin','Finanzas',"go('board')")+B('cap','Academia',"go('advanced')");
  quick.appendChild(d)}
 const tb=panel('m12DashTable');s.appendChild(tb);
 cols('dashboard',[next,conf,quick],[news,tb]);icons(s)}
function dashRender(){const c=C();if(!c)return;dashSetup();seasonChip();
 const li=leagueInfo(),tb=$('m12DashTable');
 if(tb){if(li&&li.t.length){const n=li.t.length,p=Math.max(0,li.pos);let from=Math.max(0,Math.min(p-2,n-5));const rows=li.t.slice(from,from+5);
   tb.innerHTML=`<div class="m12-ph"><i data-i="chart"></i>Tabla de posiciones<span class="sp"></span><small>${esc(lgName(c.country)).toUpperCase()}</small></div><div class="mc-tw"><table class="table mc-tbl"><tr><th>#</th><th class="cl" style="text-align:left">Club</th><th>PJ</th><th>DG</th><th>PTS</th></tr>${rows.map((r,i)=>`<tr class="${r.name===c.club?'you':''}"><td>${from+i+1}</td><td class="cl"><span class="mc-cl">${badge(r.name,18)}<span>${esc(r.name)}</span></span></td><td>${r.pj}</td><td>${r.dg>0?'+':''}${r.dg}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table></div><button class="btn secondary" style="width:100%;margin-top:11px" onclick="MC12.leagueTab('table')">VER TABLA COMPLETA</button>`}
  else tb.innerHTML=''}
 const cn=$('clubNews');if(cn&&MC12.news){try{const it=MC12.news().filter(x=>x.cat==='club').slice(0,4);if(it.length){cn.innerHTML=it.map(MC12.newsRow).join('')+`<button class="btn secondary" style="width:100%;margin-top:11px" onclick="go('news')">ABRIR EL NOTICIERO</button>`}}catch(e){warn('clubNews',e)}}
 icons($('dashboard'))}

window.MC12={$,esc,q,C,nm,sur,money,flag,badge,icons,warn,after,world,lgName,tier,grl,seasonTxt,av,logo,leagueInfo,userFixtures,current,userComps,allComps,leagueTab,heroize,cols,mi,panel,chrome,seasonChip,navState,homeBuild,dashSetup,dashRender,POSC,version:'12.0'};
})();

/* ===== MC12 · Noticiero, plantel y ficha del jugador (solo presentación) ===== */
(function(){
'use strict';
const M=window.MC12;if(!M)return;
const {$,esc,C,nm,money,flag,badge,icons,warn,world,lgName,tier,grl,av,seasonTxt}=M;

/* ---------- B. NOTICIERO: todo sale de lo que pasó en la partida ---------- */
const TONE={club:'#16306e',liga:'#0f5a3a',fichajes:'#4a1f7a',comp:'#6a4a08',mundo:'#0c4f6a'};
function news(){const c=C();if(!c)return[];const out=[],add=o=>out.push(o);const li=M.leagueInfo(),fx=M.userFixtures(),w=world()||{};
 const played=fx.filter(f=>f.played),last=played[played.length-1],cur=M.current();
 if(last){const t=last.res==='W'?`Triunfo de ${c.club} ante ${last.opp}`:last.res==='D'?`${c.club} igualó con ${last.opp}`:`${c.club} cayó frente a ${last.opp}`;
  add({cat:'club',kick:'Resultado',tone:last.res==='W'?'g':last.res==='L'?'r':'',title:t,text:`Fecha ${last.r+1} de liga, ${last.home?'de local':'de visitante'}. Marcador final: ${last.gf}-${last.ga}.`,club:c.club,icon:'flag',when:`FECHA ${last.r+1}`,go:"MC12.leagueTab('calendar')"})}
 if(cur&&cur.home){const opp=cur.home===c.club?cur.away:cur.home;
  add({cat:'club',kick:'Próximo partido',tone:'b',title:`Se viene ${opp}`,text:`${cur.home} vs ${cur.away}. ${cur.venue==='h'?'Se juega en casa.':'Toca salir de visitante.'}`,club:opp,icon:'cal',when:String(cur.label||'').toUpperCase(),go:'openMatch()'})}
 if(li&&li.row&&li.row.pj>0){const r=li.row;
  add({cat:'liga',kick:'Clasificación',tone:'g',title:`${c.club} marcha ${li.pos+1}º en ${lgName(c.country)}`,text:`${r.pts} puntos en ${r.pj} partidos (${r.g} ganados, ${r.e} empatados, ${r.p} perdidos). Diferencia de gol ${r.dg>0?'+':''}${r.dg}.`,club:c.club,icon:'chart',go:"MC12.leagueTab('table')"});
  const ld=li.t[0];if(ld&&ld.name!==c.club)add({cat:'liga',kick:'Líder',tone:'g',title:`${ld.name} lidera ${lgName(c.country)}`,text:`Suma ${ld.pts} puntos después de ${ld.pj} partidos.`,club:ld.name,icon:'crown',go:"MC12.leagueTab('table')"})}
 if(li){const L=li.L;let lr=-1;L.rounds.forEach((d,r)=>{if(d.some(f=>f[2]!=null))lr=r});
  if(lr>=0){L.rounds[lr].filter(f=>f[2]!=null&&f[0]!==li.ui&&f[1]!==li.ui).slice().sort((a,b)=>Math.abs(b[2]-b[3])-Math.abs(a[2]-a[3])||(b[2]+b[3])-(a[2]+a[3])).slice(0,3).forEach(f=>{
   const h=L.teams[f[0]],a=L.teams[f[1]],win=f[2]>f[3]?h:f[2]<f[3]?a:null,dif=Math.abs(f[2]-f[3]);
   add({cat:'liga',kick:'Fecha '+(lr+1),tone:'g',title:win?(dif>=3?`Goleada de ${win}`:`${win} se quedó con el triunfo`):`Reparto de puntos entre ${h} y ${a}`,text:`${h} ${f[2]}-${f[3]} ${a}.`,club:win||h,icon:'flag',when:'FECHA '+(lr+1),go:"MC12.leagueTab('calendar')"})})}}
 try{const B=((w.stats||{})[c.season]||{}).liga;if(B&&B.g){const top=Object.entries(B.g).sort((a,b)=>b[1][1]-a[1][1])[0];
  if(top&&top[1][1]>0)add({cat:'liga',kick:'Goleador',tone:'g',title:`${nm(top[0])} manda en la tabla de goleadores`,text:`Lleva ${top[1][1]} ${top[1][1]===1?'gol':'goles'} con la camiseta de ${top[1][0]}.`,club:top[1][0],icon:'star',go:"MC12.leagueTab('scorers')"})}}catch(e){}
 (c.transferHistory||[]).slice().reverse().slice(0,6).forEach(x=>{const d=String(x.detail||''),inn=/^ENTRADA/.test(d),loan=/^PR.STAMO/.test(d);
  add({cat:'fichajes',kick:inn?'Alta':loan?'Préstamo':'Baja',tone:inn||loan?'g':'r',title:inn?`${nm(x.name)} es nuevo jugador de ${c.club}`:loan?`${nm(x.name)} llega a préstamo`:`${nm(x.name)} deja ${c.club}`,text:d,club:c.club,icon:'swap',go:"setMarketTab('hist');go('market')"})});
 (c.marketDeals||[]).filter(d=>d.status==='PENDIENTE').slice(-4).reverse().forEach(d=>add({cat:'fichajes',kick:'Rumor',tone:'v',title:`Oferta sobre la mesa por ${nm(d.player)}`,text:String(d.detail||''),club:c.club,icon:'mail',go:"setMarketTab('deals');go('market')"}));
 (c.players||[]).filter(p=>p.transferListed).slice(0,3).forEach(p=>add({cat:'fichajes',kick:'Transferible',tone:'v',title:`${nm(p.name)} está en la lista de transferibles`,text:`${p.pos} · ${p.age} años · GRL ${p.rating} · valor ${money(p.value)}.`,club:c.club,icon:'tag',go:"setMarketTab('sell');go('market')"}));
 (w.aiMoves||[]).slice(-1).forEach(s=>(s.moves||[]).slice(0,5).forEach(m=>add({cat:'fichajes',kick:'Mercado mundial',tone:'v',title:`${nm(m[0])} pasa a ${m[2]}`,text:`Llega desde ${m[1]} por ${money(m[3])}.`,club:m[2],icon:'globe',go:"mc10World('moves')"})));
 M.userComps().forEach(k=>{const st=k.stages[k.si]||k.stages[k.stages.length-1];
  if(k.champ)add({cat:'comp',kick:k.name,title:`${k.champ} es campeón de ${k.name}`,text:k.champ===c.club?'¡El título es tuyo!':'El torneo ya tiene dueño.',club:k.champ,icon:'trophy',go:"MC12.leagueTab('cup')"});
  else add({cat:'comp',kick:k.kind==='cup'?'Copa nacional':'Internacional',title:`${c.club} compite en ${k.name}`,text:`Instancia actual: ${st?st.name:'—'}. Participan ${k.teams.length} equipos.`,club:c.club,icon:'trophy',go:"MC12.leagueTab('cup')"})});
 M.allComps().filter(k=>k.champ&&!k.teams.includes(c.club)).slice(0,4).forEach(k=>add({cat:'comp',kick:'Campeón',title:`${k.champ} ganó ${k.name}`,text:k.kind==='cup'?'Copa nacional definida.':'Torneo internacional definido.',club:k.champ,icon:'trophy',go:"mc10World('comps')"}));
 const inj=(c.players||[]).filter(p=>p.injury);if(inj.length)add({cat:'club',kick:'Parte médico',tone:'r',title:inj.length===1?`${nm(inj[0].name)} está lesionado`:`${inj.length} jugadores en la enfermería`,text:inj.slice(0,4).map(p=>`${nm(p.name)} (${p.injury})`).join(' · '),club:c.club,icon:'cross',go:"go('squad')"});
 const sus=(c.players||[]).filter(p=>p.suspended);if(sus.length)add({cat:'club',kick:'Sanciones',tone:'r',title:sus.length===1?`${nm(sus[0].name)} está suspendido`:`${sus.length} jugadores suspendidos`,text:sus.slice(0,4).map(p=>nm(p.name)).join(' · '),club:c.club,icon:'flag',go:"go('squad')"});
 add({cat:'club',kick:'Directiva',tone:'b',title:c.board>=70?'La directiva respalda el proyecto':c.board>=45?'La directiva sigue de cerca al equipo':'La directiva exige una reacción',text:`Confianza del ${c.board}% y un presupuesto de $${c.budget}M para la temporada ${seasonTxt(c)}.`,club:c.club,icon:'shield',go:"go('board')"});
 (c.inbox||[]).slice(0,8).forEach(x=>add({cat:'club',kick:'Mensaje',tone:'b',title:String(x),text:'',club:c.club,icon:'mail',plain:true,go:"go('board')"}));
 (w.ntHist||[]).slice(-3).reverse().forEach(t=>add({cat:'mundo',kick:'Selecciones',tone:'b',title:`${t.champ} ganó ${t.name}`,text:t.final?`Final: ${t.final[0]} ${t.final[2]}-${t.final[3]} ${t.final[1]}.`:'',icon:'globe',go:"mc10World('nt')"}));
 (w.coachLog||[]).slice(0,4).forEach(x=>add({cat:'mundo',kick:'Entrenadores',tone:'b',title:`${x.club} cambia de entrenador`,text:`Sale ${x.out} y llega ${x.in}.${x.why?' Motivo: '+x.why+'.':''}`,club:x.club,icon:'user',go:"mc10World('coach')"}));
 (w.hist||[]).slice(-1).forEach(x=>{if(x&&x.league)add({cat:'mundo',kick:`Temporada ${x.season}/${String(x.season+1).slice(-2)}`,tone:'b',title:`${x.league} fue el campeón de ${lgName(x.country)}`,text:x.runner?`Subcampeón: ${x.runner}.`:'',club:x.league,icon:'trophy',go:"mc10World('hist')"})});
 return out}
const kick=it=>`<span class="m12-kick ${it.tone||''}">${esc(it.kick)}</span>`;
const nbg=it=>`<div class="m12-nbg" style="--c1:${TONE[it.cat]||'#16306e'}"></div>`;
const ntp=it=>`<div class="m12-ntp">${kick(it)}<span class="wm">${it.club?badge(it.club,66):`<i data-i="${it.icon||'news'}"></i>`}</span></div>`;
const act=it=>it.go?` onclick="${esc(it.go)}" role="button" tabindex="0"`:'';
const newsLead=it=>`<article class="m12-lead"${act(it)}>${nbg(it)}${ntp(it)}<div><h2>${esc(it.title)}</h2>${it.text?`<p>${esc(it.text)}</p>`:''}${it.when?`<span class="m12-when">${esc(it.when)}</span>`:''}</div></article>`;
const newsCard=it=>`<article class="m12-ncard"${act(it)}>${nbg(it)}${ntp(it)}<div><b>${esc(it.title)}</b>${it.text?`<p>${esc(it.text)}</p>`:''}</div></article>`;
const newsRow=it=>`<div class="m12-nrow"${act(it)}><div class="ic"><i data-i="${it.icon||'news'}"></i></div><div><b>${esc(it.title)}</b>${it.text?`<span>${esc(it.text)}</span>`:''}</div><span class="tg">${esc(String(it.kick).toUpperCase())}</span></div>`;
let NT='all';
const NTABS=[['all','news','Últimas'],['club','shield','Mi club'],['liga','chart','Ligas'],['fichajes','swap','Fichajes'],['comp','trophy','Competencias'],['mundo','globe','Mundo']];
function ensureNews(){if($('news'))return;const s=document.createElement('section');s.id='news';s.className='page';
 s.innerHTML='<div class="m12-hero"><i class="hi" data-i="news"></i><div class="ht"><div class="eyebrow">LO ÚLTIMO DE TU PARTIDA</div><h1>Noticiero</h1></div></div><div class="m12-tabs" id="m12NTabs"></div><div id="m12NBody"></div>';
 const main=document.querySelector('main');main.insertBefore(s,$('more')||null)}
function renderNews(){ensureNews();const c=C(),body=$('m12NBody');if(!c||!body)return;
 $('m12NTabs').innerHTML=NTABS.map(t=>`<button class="${NT===t[0]?'on':''}" onclick="MC12.newsTab('${t[0]}')"><i data-i="${t[1]}"></i>${t[2]}</button>`).join('');
 const all=news(),sel=NT==='all'?all.filter(x=>!x.plain):all.filter(x=>x.cat===NT),main=sel.filter(x=>!x.plain),it=main.concat(sel.filter(x=>x.plain));
 if(!it.length){body.innerHTML='<div class="m12-panel m12-empty"><i data-i="news"></i>Todavía no hay novedades en esta sección. Se completa sola a medida que avanza la temporada.</div>';icons($('news'));return}
 const lead=it[0],nc=Math.min(4,Math.max(0,main.length-1)),cards=it.slice(1,1+nc),rest=it.slice(1+nc);
 body.innerHTML=`<div class="m12-news-top">${newsLead(lead)}${cards.length?`<div class="m12-ngrid">${cards.map(newsCard).join('')}</div>`:''}</div>${rest.length?`<div class="m12-panel"><div class="m12-ph"><i data-i="list"></i>Más noticias<span class="sp"></span><small>${rest.length}</small></div>${rest.map(newsRow).join('')}</div>`:''}`;
 icons($('news'))}
M.news=news;M.newsRow=newsRow;M.renderNews=renderNews;M.ensureNews=ensureNews;M.newsTab=function(t){NT=t;renderNews()};

/* ---------- D. PLANTEL ---------- */
const PART=/^(de|da|di|do|dos|del|la|las|le|lo|los|van|von|el|al|san|mac|mc|st)$/i;
function short(n){n=String(nm(n)||'').trim();const p=n.split(/\s+/);if(p.length<2)return n;if(p.length>2&&PART.test(p[p.length-2]))return p.slice(-2).join(' ');return p[p.length-1]}
function lineupDecor(){const c=C(),pitch=$('lineupPitchV6');if(!c||!pitch)return;let G=[];try{G=slotGroups(c.formation)}catch(e){}
 pitch.querySelectorAll('.lineup-player-v6').forEach((el,i)=>{const p=c.players[i];if(!p)return;const chips=[...el.querySelectorAll('em')].map(e=>e.outerHTML).join('');let r=p.rating,lab=p.pos;
  try{r=effRating(p,G[i]);lab=slotLabel(i)}catch(e){}
  el.innerHTML=`${chips}<span class="g ${tier(r)}">${r}</span>${av(p)}<span class="n">${esc(short(p.name))}</span><small>${esc(lab)}</small>`;el.title=nm(p.name)});
 if(!pitch.querySelector('.m12-pm'))pitch.insertAdjacentHTML('afterbegin','<i class="m12-pm c"></i><i class="m12-pm t"></i><i class="m12-pm b"></i>');
 ['lineupSubsV6','lineupResV6'].forEach(id=>{const b=$(id);if(!b)return;b.querySelectorAll('.sub-player-v6').forEach(el=>{const m=/mcPlayerMenu\((\d+)\)/.exec(el.getAttribute('onclick')||'');if(!m)return;const p=c.players[+m[1]];if(!p)return;
  el.innerHTML=`${av(p)}<span class="nm">${esc(nm(p.name))}<small>${p.pos} · ${p.age} años${p.injury?' · lesionado':''}${p.suspended?' · suspendido':''}</small></span>${grl(p.rating)}`})})}
function squadSetup(){const s=$('squad');if(!s||s.dataset.m12)return;s.dataset.m12='1';
 M.mi('squadCount','people');M.mi('squadAvg','star');M.mi('squadFit','heart');
 const mg=s.querySelector('.metric-grid');if(mg){const g=document.createElement('div');g.className='metric-grid';g.id='m12SquadSum';
  g.innerHTML='<div class="metric" data-ico="coin"><b id="m12SqVal">—</b><small><i class="m12-mi" data-i="coin"></i>VALOR DEL PLANTEL</small></div><div class="metric" data-ico="cal"><b id="m12SqAge">—</b><small><i class="m12-mi" data-i="cal"></i>EDAD PROMEDIO (AÑOS)</small></div><div class="metric" data-ico="doc"><b id="m12SqWage">—</b><small><i class="m12-mi" data-i="doc"></i>MASA SALARIAL / AÑO</small></div>';
  mg.parentNode.insertBefore(g,mg.nextSibling)}
 const lu=s.querySelector(':scope>.lineup-v6-card'),ls=$('squadList')&&$('squadList').closest('.card');if(ls)ls.classList.add('m12-s-list');
 M.cols('squad',[lu],[ls]);icons(s)}
function squadRender(){const c=C();if(!c)return;squadSetup();const P=c.players||[];if(!P.length)return;
 const v=P.reduce((a,p)=>a+(+p.value||0),0),w=P.reduce((a,p)=>a+(+p.wage||0),0),ag=P.reduce((a,p)=>a+(+p.age||0),0)/P.length;
 const tight=x=>String(money(x)).replace(/\s+/g,'');
 if($('m12SqVal'))$('m12SqVal').textContent=tight(v);if($('m12SqAge'))$('m12SqAge').textContent=ag.toFixed(1).replace('.',',');if($('m12SqWage'))$('m12SqWage').textContent=tight(w)}
M.lineupDecor=lineupDecor;M.squadRender=squadRender;M.short=short;

/* ---------- E. FICHA DEL JUGADOR (mismos datos y mismas acciones que la ficha anterior) ---------- */
const GROUPS=[['Técnica',[['shooting','Tiro',60],['passing','Pase',60]]],['Físico',[['pace','Ritmo',60],['stamina','Resistencia',70],['strength','Fuerza',65]]],['Defensa',[['defending','Defensa',60]]]];
const RAD=[['pace','RIT',60],['shooting','TIR',60],['passing','PAS',60],['defending','DEF',60],['strength','FUE',65],['stamina','RES',70]];
function radar(p){const cx=110,cy=100,R=64,pt=(i,v)=>{const a=-Math.PI/2+i*Math.PI/3;return[(cx+Math.cos(a)*R*v).toFixed(1),(cy+Math.sin(a)*R*v).toFixed(1)]};
 const ring=v=>RAD.map((k,i)=>pt(i,v).join(',')).join(' ');const val=k=>+p[k[0]]||k[2];
 return `<svg class="m12-radar" viewBox="0 0 220 200" role="img"><title>Gráfico de atributos</title>${[1,.75,.5,.25].map(v=>`<polygon points="${ring(v)}" fill="${v===1?'rgba(74,155,255,.07)':'none'}" stroke="rgba(112,152,232,.32)" stroke-width="1"/>`).join('')}${RAD.map((k,i)=>{const e=pt(i,1);return `<line x1="${cx}" y1="${cy}" x2="${e[0]}" y2="${e[1]}" stroke="rgba(112,152,232,.22)"/>`}).join('')}<polygon points="${RAD.map((k,i)=>pt(i,Math.max(.08,Math.min(1,val(k)/99))).join(',')).join(' ')}" fill="rgba(243,197,82,.28)" stroke="#f3c552" stroke-width="2" stroke-linejoin="round"/>${RAD.map((k,i)=>{const e=pt(i,1.26);return `<text x="${e[0]}" y="${(+e[1]+3).toFixed(1)}" text-anchor="middle">${k[1]} ${val(k)}</text>`}).join('')}</svg>`}
function openPlayer12(i){const c=C();if(!c)return;const p=c.players[i],box=$('playerProfile');if(!p||!box)return;
 let zone='';try{zone=MC_ZN[zoneOf(i)]||''}catch(e){}
 const lv=v=>v>=70?'':v>=45?'a':'r',bar=(v,cl)=>`<div class="m12-bar"><i class="${cl||''}" style="width:${Math.max(0,Math.min(100,+v||0))}%"></i></div>`;
 const val=p.value!=null?p.value:Math.round(p.rating*p.rating/100),wage=+p.wage||0;
 const row=(k,v)=>`<div class="statsrow"><span>${k}</span><b>${v}</b></div>`;
 box.innerHTML=`<div class="m12-pcard">${av(p)}<div><div class="num">${p.number?'#'+esc(p.number):''}${zone?(p.number?' · ':'')+esc(zone.toUpperCase()):''}</div><h1>${esc(nm(p.name))}</h1>
  <div class="meta"><span class="pp ${p.pos}">${p.pos}</span>${p.nat&&p.nat!=='—'?`<span>${flag(p.nat)} ${esc(p.nat)}</span>`:''}<span>${p.age} años</span></div>
  <div class="club">${badge(c.club,22)}<span>${esc(c.club)}</span></div></div>
  <div class="rs"><span class="m12-grl lg ${tier(p.rating)}"><small>GRL</small>${p.rating}</span><div class="m12-pot">POTENCIAL<b>${p.potential}</b></div></div></div>
 ${p.injury?`<div class="m12-alert"><i data-i="cross"></i>Lesionado: ${esc(p.injury)}</div>`:''}${p.suspended?'<div class="m12-alert"><i data-i="flag"></i>Suspendido para el próximo partido</div>':''}${p.transferListed?'<div class="m12-alert" style="background:rgba(243,197,82,.12);border-color:rgba(243,197,82,.5);color:#ffe9a6"><i data-i="tag"></i>En la lista de transferibles</div>':''}
 <div class="m12-kv"><div><small>Valor de mercado</small><b>${money(val)}</b></div><div><small>Salario anual</small><b>${money(wage)}</b></div><div><small>Contrato</small><b>${p.contract} ${p.contract===1?'temporada':'temporadas'}</b></div><div><small>Partidos jugados</small><b>${p.apps||0}</b></div></div>
 <div class="m12-cols eq"><div class="m12-col a">
  <div class="m12-panel m12-gold"><div class="m12-ph"><i data-i="chart"></i>Atributos</div><div class="m12-attr">${radar(p)}<div>${GROUPS.map(g=>`<div class="m12-ag"><h4>${g[0]}</h4>${g[1].map(a=>{const v=+p[a[0]]||a[2];return `<div class="m12-ar"><span>${a[1]}</span>${bar(v,lv(v))}<b>${v}</b></div>`}).join('')}</div>`).join('')}</div></div></div>
  <div class="m12-panel"><div class="m12-ph"><i data-i="bars"></i>Estadísticas de la temporada</div><div class="m12-lsum" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><b>${p.apps||0}</b><small>PARTIDOS</small></div><div class="hl"><b>${p.goals||0}</b><small>GOLES</small></div><div><b>${p.assists||0}</b><small>ASISTENCIAS</small></div></div></div>
 </div><div class="m12-col b">
  <div class="m12-panel"><div class="m12-ph"><i data-i="heart"></i>Estado físico y moral</div><div class="m12-ar"><span>Estado físico</span>${bar(p.fitness,lv(p.fitness))}<b>${p.fitness}</b></div><div class="m12-ar"><span>Moral</span>${bar(p.morale,lv(p.morale))}<b>${p.morale}</b></div>${row('Situación',p.injury?'Lesionado':p.suspended?'Suspendido':'Disponible')}</div>
  <div class="m12-panel"><div class="m12-ph"><i data-i="user"></i>Información personal</div>${row('Edad',p.age+' años')}${p.nat&&p.nat!=='—'?row('Nacionalidad',flag(p.nat)+' '+esc(p.nat)):''}${row('Posición',`<span class="pp ${p.pos}">${p.pos}</span>`)}${p.foot?row('Pie hábil',esc(p.foot)):''}${p.weakFoot?row('Pierna menos hábil','★'.repeat(Math.max(1,Math.min(5,+p.weakFoot||1)))):''}${p.personality?row('Personalidad',esc(p.personality)):''}${row('Club',esc(c.club))}</div>
 </div></div>
 <div class="m12-pacts"><button class="btn secondary" onclick="trainPlayer(${i})">Entrenar</button><button class="btn secondary" onclick="recoverPlayer(${i})">Recuperar</button><button class="btn secondary" onclick="renewPlayer(${i})">Renovar</button><button class="btn m12-warn" onclick="listPlayerSale(${i})">Transferible</button><button class="btn wide" onclick="go('squad')">Volver al plantel</button></div>`;
 icons(box);try{go('player')}catch(e){}}
M.openPlayer12=openPlayer12;
})();

/* ===== MC12 · Competiciones, cuadros, mercado, finanzas y arranque (solo presentación) ===== */
(function(){
'use strict';
const M=window.MC12;if(!M)return;
const {$,esc,C,nm,money,badge,icons,warn,after,world,lgName,tier,grl,av,seasonTxt}=M;

/* ---------- G. COMPETICIONES ---------- */
const MES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIA=['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
/* El motor trabaja por fechas (jornadas), no por días. Para el calendario mensual se ubica cada fecha de liga
   en domingos consecutivos desde agosto y las copas en el miércoles previo. Es solo una forma de mostrarlas. */
function roundDate(c,r,cup){const d=new Date(c.season,7,1);while(d.getDay()!==0)d.setDate(d.getDate()+1);d.setDate(d.getDate()+7*r-(cup?4:0));return d}
function events(){const c=C();if(!c)return[];const ev=[];
 M.userFixtures().forEach(f=>ev.push({d:roundDate(c,f.r,false),comp:'Liga · Fecha '+(f.r+1),cup:false,opp:f.opp,home:f.home,played:f.played,gf:f.gf,ga:f.ga,res:f.res}));
 M.userComps().forEach(k=>{(k.stages||[]).forEach(st=>{const at=st.at||[];
  if(st.type==='ko'){(st.ties||[]).forEach(t=>{if(t.a!==c.club&&t.b!==c.club)return;if(!t.b)return;const n=st.legs||1;
   for(let di=0;di<n;di++){if(at[di]==null)continue;const lg=t.legs&&t.legs[di];const home=lg?lg[0]:(n===1?t.a:(di===0?t.b:t.a));const isH=home===c.club;const opp=t.a===c.club?t.b:t.a;
    const o={d:roundDate(c,at[di],true),comp:k.name+' · '+st.name,cup:true,opp,home:isH,played:!!lg};
    if(lg){o.gf=isH?lg[2]:lg[3];o.ga=isH?lg[3]:lg[2];o.res=o.gf>o.ga?'W':o.gf<o.ga?'L':'D'}ev.push(o)}})}
  else (st.fx||[]).forEach(f=>{if(f.h!==c.club&&f.a!==c.club)return;if(at[f.md]==null)return;const isH=f.h===c.club,pl=f.gh!=null;
   const o={d:roundDate(c,at[f.md],true),comp:k.name+' · '+st.name,cup:true,opp:isH?f.a:f.h,home:isH,played:pl};
   if(pl){o.gf=isH?f.gh:f.ga;o.ga=isH?f.ga:f.gh;o.res=o.gf>o.ga?'W':o.gf<o.ga?'L':'D'}ev.push(o)})})});
 return ev.sort((a,b)=>a.d-b.d)}
let CALOFF=null;
function calendarHTML(){const c=C(),ev=events();if(!ev.length)return '';const nx=ev.find(e=>!e.played)||ev[ev.length-1];
 const base=new Date(nx.d.getFullYear(),nx.d.getMonth(),1);if(CALOFF==null)CALOFF=0;const m=new Date(base.getFullYear(),base.getMonth()+CALOFF,1);
 const y=m.getFullYear(),mo=m.getMonth(),days=new Date(y,mo+1,0).getDate(),lead=(m.getDay()+6)%7;
 const by={};ev.forEach(e=>{if(e.d.getFullYear()===y&&e.d.getMonth()===mo)by[e.d.getDate()]=e});
 let cells='';['L','M','M','J','V','S','D'].forEach(x=>cells+=`<div class="dn">${x}</div>`);
 for(let i=0;i<lead;i++)cells+='<div class="d o"></div>';
 for(let d=1;d<=days;d++){const e=by[d];if(!e){cells+=`<div class="d">${d}</div>`;continue}
  cells+=`<div class="d m${e.cup?' cup':''}${e===nx&&!e.played?' nx':''}" title="${esc(e.comp+' · '+(e.home?'vs ':'en ')+e.opp)}">${d}${badge(e.opp,22)}${e.played?`<em class="${e.res}">${e.gf}-${e.ga}</em>`:`<em>${e.home?'L':'V'}</em>`}</div>`}
 const list=ev.filter(e=>e.d.getFullYear()===y&&e.d.getMonth()===mo);
 const rows=list.map(e=>`<div class="m12-fxl${e===nx&&!e.played?' nx':''}"><div class="dt">${DIA[e.d.getDay()]}<b>${e.d.getDate()}</b></div><div class="op">${badge(e.opp,26)}<span>${esc(e.opp)}<small>${esc(e.comp)}</small></span></div><span class="lv">${e.home?'LOCAL':'VISITA'}</span><span class="rs ${e.played?e.res:''}">${e.played?e.gf+' - '+e.ga:'—'}</span></div>`).join('');
 return `<div class="m12-panel m12-gold" id="m12Cal"><div class="m12-calh"><button onclick="MC12.calMove(-1)" title="Mes anterior">‹</button><b>${MES[mo]} ${y}</b><button onclick="MC12.calMove(1)" title="Mes siguiente">›</button></div><div class="m12-cal">${cells}</div>
 <div class="m12-legend" style="grid-template-columns:repeat(3,auto);justify-content:start;gap:6px 16px;margin-top:11px;display:grid"><span><i style="background:#3d6fd8"></i>Liga</span><span><i style="background:#8a5cf0"></i>Copas</span><span><i style="background:var(--gold)"></i>Próximo</span></div></div>
 <div class="m12-panel"><div class="m12-ph"><i data-i="cal"></i>Tus partidos de ${MES[mo].toLowerCase()}<span class="sp"></span><small>${list.length}</small></div>${rows||'<p class="tiny" style="margin:0">No tenés partidos este mes.</p>'}</div>`}
M.calMove=function(n){CALOFF=(CALOFF||0)+n;try{renderLeague()}catch(e){}};
function leagueSetup(){const s=$('league');if(!s||s.dataset.m12)return;s.dataset.m12='1';M.heroize('league','trophy');
 const IC={table:'chart',calendar:'cal',scorers:'star',cup:'trophy'};
 s.querySelectorAll('.tabs button').forEach(b=>{const m=/leagueTab\('(\w+)'/.exec(b.getAttribute('onclick')||'');if(m&&IC[m[1]]&&!b.querySelector('i')){const i=document.createElement('i');i.dataset.i=IC[m[1]];b.insertBefore(i,b.firstChild)}});
 const side=M.panel('m12LeagueSide');s.appendChild(side);M.cols('league',['#leagueContent'],[side],'w');icons(s)}
function leagueSide(){const c=C(),side=$('m12LeagueSide');if(!c||!side)return;const li=M.leagueInfo();if(!li||!li.row){side.innerHTML='';side.classList.add('m12-hidden');return}side.classList.remove('m12-hidden');
 const r=li.row,cur=M.current();const form=(r.form||[]).slice(-5);
 side.innerHTML=`<div class="m12-ph">${badge(c.club,26)}<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.club)}</span><span class="sp"></span><small>${esc(lgName(c.country)).toUpperCase()}</small></div>
 <div class="m12-lsum"><div class="hl"><b>${li.pos+1}º</b><small>POSICIÓN</small></div><div class="hl"><b>${r.pts}</b><small>PUNTOS</small></div><div><b>${r.pj}</b><small>JUGADOS</small></div><div><b>${r.dg>0?'+':''}${r.dg}</b><small>DIF. GOL</small></div><div><b>${r.g}</b><small>GANADOS</small></div><div><b>${r.e}</b><small>EMPATES</small></div><div><b>${r.p}</b><small>PERDIDOS</small></div><div><b>${r.gf}:${r.gc}</b><small>GOLES</small></div></div>
 ${form.length?`<div class="statsrow" style="margin-top:8px"><span>Últimos partidos</span><span class="form" style="display:flex;gap:4px">${form.map(x=>`<span class="mc-f ${x}" style="width:22px;height:22px;display:grid;place-items:center">${x==='W'?'G':x==='D'?'E':'P'}</span>`).join('')}</span></div>`:''}
 ${cur&&cur.home?`<div class="statsrow"><span>Próximo partido</span><b style="text-align:right">${esc(cur.home===c.club?cur.away:cur.home)}<span class="tiny muted" style="display:block;font-weight:600">${esc(cur.label||'')} · ${cur.venue==='h'?'local':'visitante'}</span></b></div><button class="btn" style="width:100%;margin-top:11px" onclick="openMatch()">IR AL PARTIDO</button>`:''}
 <div class="m12-legend" style="margin-top:13px"><span><i style="background:#2bbd6a"></i>Puestos de clasificación</span><span><i style="background:#e9515d"></i>Zona de descenso</span><span><i style="background:rgba(58,210,124,.45);outline:1px solid #3ad27c"></i>Tu club</span></div>`;icons(side)}
function syncTabs(sel,fn,cur){if(!cur)return;document.querySelectorAll(sel).forEach(b=>{const m=new RegExp(fn+"\\('(\\w+)'").exec(b.getAttribute('onclick')||'');if(m)b.classList.toggle('active',m[1]===cur)})}
function leagueRender(){const c=C();if(!c)return;leagueSetup();leagueSide();let v='';try{v=leagueView}catch(e){}
 syncTabs('#league .tabs button','leagueTab',v);
 const box=$('leagueContent');if(!box)return;
 if(v==='calendar'){try{const h=calendarHTML();if(h&&!$('m12Cal')){box.insertAdjacentHTML('afterbegin',h)}}catch(e){warn('calendario',e)}}
 if(v==='cup')decorComps(box);
 icons(box)}

/* ---------- L. CUADROS ELIMINATORIOS ---------- */
function tieScore(t){if(t.agg)return[t.agg[0],t.agg[1]];const l=t.legs&&t.legs[0];if(l)return l[0]===t.a?[l[2],l[3]]:[l[3],l[2]];return['','']}
function tieHTML(t,club,fin){if(!t)return '<div class="m12-tie"><div class="t"><span></span><span class="tbd">Por definir</span><b></b></div><div class="t"><span></span><span class="tbd">Por definir</span><b></b></div></div>';
 const s=tieScore(t),mine=t.a===club||t.b===club;const row=(n,g,w)=>n?`<div class="t${w?' w':''}${n===club?' me':''}">${badge(n,20)}<span>${esc(n)}</span><b>${g}</b></div>`:'<div class="t"><span></span><span class="tbd">Pasa directo</span><b></b></div>';
 return `<div class="m12-tie${mine?' you':''}${fin?' fin':''}">${row(t.a,s[0],t.w&&t.w===t.a)}${row(t.b,s[1],t.w&&t.w===t.b)}${t.pen?`<div class="pn">Penales ${t.pen[0]}-${t.pen[1]}</div>`:''}</div>`}
function bracketHTML(k){const c=C(),club=c?c.club:'';const kos=(k.stages||[]).filter(s=>s.type==='ko'&&s.ties&&s.ties.length);if(!kos.length)return '';
 const ord=kos.map(s=>s.ties.slice());
 for(let i=kos.length-1;i>0;i--){const used=new Set(),o=[];ord[i].forEach(t=>[t.a,t.b].forEach(n=>{if(!n)return;const src=ord[i-1].find(x=>x.w===n&&!used.has(x));if(src){used.add(src);o.push(src)}}));ord[i-1].forEach(x=>{if(!used.has(x))o.push(x)});ord[i-1]=o}
 let colsH='';
 kos.forEach((st,i)=>{const ties=ord[i],big=ties.length>16;const isFinal=ties.length===1&&i===kos.length-1&&!(st.direct&&st.direct.length);
  let inner;if(big){const mine=ties.filter(t=>t.a===club||t.b===club);inner=mine.map(t=>tieHTML(t,club,false)).join('')+`<div class="m12-tie"><div class="pn" style="border:0;padding:9px 8px;text-align:center">${mine.length?'+ ':''}${ties.length-mine.length} cruces más · el detalle completo está abajo</div></div>`}
  else inner=ties.map(t=>tieHTML(t,club,isFinal)).join('');
  colsH+=`<div class="col"><h5>${esc(st.name)}${st.legs===2?' · ida y vuelta':''}</h5><div class="ties">${inner}</div></div>`});
 if(!k.champ){const last=kos[kos.length-1];let n=last.ties.length+((last.direct&&last.direct.length)||0);const pow=x=>x>0&&(x&(x-1))===0;
  if(k.stages[k.stages.length-1]===last&&n>1&&pow(n)&&n<=32){for(let t=n;t>=2;t/=2){let name='';try{name=MC10W.koName(t)}catch(e){name='Ronda de '+t}
   colsH+=`<div class="col"><h5>${esc(name)}</h5><div class="ties">${Array.from({length:t/2},()=>tieHTML(null,club,false)).join('')}</div></div>`}}}
 else colsH+=`<div class="m12-champ"><i data-i="trophy"></i><small>CAMPEÓN</small>${badge(k.champ,46)}<b>${esc(k.champ)}</b></div>`;
 return `<div class="m12-brk-wrap"><div class="m12-brk">${colsH}</div></div>`}
function stepsHTML(k){return `<div class="m12-steps">${(k.stages||[]).map((s,i)=>`<span class="${k.champ||i<k.si?'done':i===k.si?'on':''}">${esc(s.name)}</span>`).join('')}${k.champ?'<span class="on">Campeón</span>':''}</div>`}
function decorComps(root){if(!root)return;const list=M.allComps();if(!list.length)return;const sel=root.querySelector('select');const sid=sel?sel.value:null;
 root.querySelectorAll('.card').forEach(card=>{if(card.dataset.m12)return;const h=card.querySelector('h2');if(!h||!card.querySelector('.mc10-step'))return;const name=h.textContent.trim();
  const k=list.find(x=>x.id===sid&&x.name===name)||list.find(x=>x.name===name);if(!k)return;card.dataset.m12='1';card.classList.add('m12-gold','m12-span');
  const p=card.querySelector('p.tiny');const html=stepsHTML(k)+bracketHTML(k);if(p)p.insertAdjacentHTML('afterend',html);else h.insertAdjacentHTML('afterend',html)});icons(root)}
function worldDecor(){const s=$('world');if(!s)return;M.heroize('world','globe','MUNDO DEL FÚTBOL');const b=$('mc10WBody');if(!b)return;decorComps(b);b.classList.toggle('m12-one',!!b.querySelector('.mc10-step,.m12-brk-wrap'));icons(s)}
M.bracketHTML=bracketHTML;M.worldDecor=worldDecor;

/* ---------- H / O. MERCADO, NEGOCIACIONES Y CONTRATOS ---------- */
function cardFaces(root){if(!root)return;root.querySelectorAll('.x-pc .ph').forEach(ph=>{if(ph.dataset.m12)return;const card=ph.closest('.x-pc'),pp=card&&card.querySelector('.pp'),b=card&&card.querySelector('b');const pos=pp?(pp.textContent||'').trim():'';ph.dataset.m12='1';let club='';try{const CS=new Set(Object.values(window.MC_FOTOS_CLUB||{}));card.querySelectorAll('.mt').forEach(m=>{const t=(m.textContent||'').split(' · ')[0].trim();if(!club&&CS.has(t))club=t});if(!club){const k=C();club=k&&k.club||''}}catch(e){}ph.innerHTML=av({pos,name:b?b.textContent.trim():'',club,disp:true},null,'nb')})}
function marketSetup(){const s=$('market');if(!s||s.dataset.m12)return;s.dataset.m12='1';M.cols('market',['#mBar','#mBody'],['#mSum'],'w')}
const stt=s=>{s=String(s||'');const k=/ACEPT/.test(s)?'ok':/RECHAZ|CANCEL|FALL|DESCART/.test(s)?'no':'pe';return `<span class="m12-stt ${k}">${esc(s)}</span>`};
function marketRender(){const c=C();if(!c)return;marketSetup();let T='';try{T=marketTab}catch(e){}
 const tabs=$('mTabs'),body=$('mBody');if(!tabs||!body)return;
 if(!tabs.querySelector('[data-m12]')){tabs.insertAdjacentHTML('beforeend',`<button data-m12="1" class="${T==='contracts'?'on':''}" onclick="setMarketTab('contracts')"><i data-i="doc"></i>Contratos</button>`)}
 if(T==='deals'){const D=(c.marketDeals||[]).slice().reverse();
  body.innerHTML=(D.map(d=>`<div class="m12-deal"><div class="ic"><i data-i="${/Venta|recibida/i.test(d.kind)?'tag':/Pr.stamo/i.test(d.kind)?'swap':'hand'}"></i></div><div><b>${esc(nm(d.player))}</b><span>${esc(d.kind)} · ${esc(d.detail)}</span></div>${stt(d.status)}</div>`).join('')||'<div class="m12-panel m12-empty"><i data-i="mail"></i>Todavía no hay negociaciones. Las ofertas que hagas o recibas aparecen acá con su estado.</div>')+'<button class="btn secondary x-go" onclick="generateClubBid()">CONSULTAR OFERTAS DE CLUBES</button>'}
 else if(T==='hist'){const H=(c.transferHistory||[]).slice().reverse();
  body.innerHTML=H.map(x=>{const d=String(x.detail||''),inn=/^ENTRADA|^PR.STAMO/.test(d);return `<div class="m12-deal"><div class="ic"><i data-i="${inn?'plus':'arrow'}"></i></div><div><b>${esc(nm(x.name))}</b><span>${esc(d)}</span></div><span class="m12-stt ${inn?'ok':'pe'}">${inn?'ALTA':'BAJA'}</span></div>`}).join('')||'<div class="m12-panel m12-empty"><i data-i="clock"></i>No hay movimientos registrados todavía.</div>'}
 else if(T==='contracts'){const P=(c.players||[]).map((p,i)=>({p,i})).sort((a,b)=>(a.p.contract||0)-(b.p.contract||0)||b.p.rating-a.p.rating);const tot=P.reduce((a,x)=>a+(+x.p.wage||0),0),exp=P.filter(x=>(x.p.contract||0)<=1).length;
  body.innerHTML=`<div class="m12-kv"><div><small>Masa salarial / año</small><b>${money(tot)}</b></div><div><small>Vencen esta temporada</small><b>${exp} ${exp===1?'jugador':'jugadores'}</b></div></div><div class="m12-panel m12-gold"><div class="m12-ph"><i data-i="doc"></i>Contratos del plantel<span class="sp"></span><small>${P.length}</small></div>${P.map(({p,i})=>{const y=p.contract||0;return `<div class="m12-ct">${av(p)}<div><b>${esc(nm(p.name))}</b><span><span class="pp ${p.pos}">${p.pos}</span> ${p.age} años · GRL ${p.rating} · ${money(+p.wage||0)}/año</span></div><div style="display:flex;align-items:center;gap:8px"><span class="yr ${y<=1?'lo':y===2?'md':''}">${y} ${y===1?'año':'años'}</span><button class="btn small secondary" onclick="renewPlayer(${i})">Renovar</button></div></div>`}).join('')}</div>`}
 cardFaces(body);icons($('market'))}

/* ---------- M / N. ESTADIO, INFRAESTRUCTURA Y FINANZAS ---------- */
const FAC={stadium:['stadium','Estadio','Capacidad, comodidad e ingresos por partido'],academy:['cap','Academia juvenil','Calidad de los juveniles que surgen'],training:['gym','Centro de entrenamiento','Progreso y recuperación del plantel']};
function boardSetup(){const s=$('board');if(!s||s.dataset.m12)return;s.dataset.m12='1';M.heroize('board','coin');
 M.mi('financeBudget','coin');M.mi('financeWage','doc');M.mi('financeBoard','shield');
 const ob=$('objectives')&&$('objectives').closest('.card'),fa=$('facilities')&&$('facilities').closest('.card'),inb=$('inbox')&&$('inbox').closest('.card');
 if(fa)fa.classList.add('m12-gold');const fin=M.panel('m12Fin');s.appendChild(fin);M.cols('board',[fa,ob],[fin,inb]);icons(s)}
function donut(parts,total,label){const R=44,CI=2*Math.PI*R;let off=0;const segs=parts.filter(x=>x[1]>0).map(x=>{const len=total?x[1]/total*CI:0;const s=`<circle cx="60" cy="60" r="${R}" fill="none" stroke="${x[2]}" stroke-width="15" stroke-dasharray="${len.toFixed(2)} ${(CI-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 60 60)"/>`;off+=len;return s}).join('');
 return `<svg viewBox="0 0 120 120" role="img"><title>${esc(label)}</title><circle cx="60" cy="60" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="15"/>${segs}<text x="60" y="58" text-anchor="middle">${parts.reduce((a,x)=>a+x[3],0)}</text><text class="sm" x="60" y="72" text-anchor="middle">JUGADORES</text></svg>`}
function boardRender(){const c=C();if(!c)return;boardSetup();
 const fb=$('facilities');
 if(fb){fb.querySelectorAll('.statsrow').forEach(r=>{const btn=r.querySelector('button');const m=btn&&/upgrade\('(\w+)'\)/.exec(btn.getAttribute('onclick')||'');if(!m||!FAC[m[1]])return;const f=FAC[m[1]],lv=+c[m[1]]||1,max=Math.max(5,lv);
   const d=document.createElement('div');d.className='m12-fac';d.innerHTML=`<div class="ic"><i data-i="${f[0]}"></i></div><div><b>${f[1]}</b><small>NIVEL ${lv} · ${f[2].toUpperCase()}</small><div class="m12-pips">${Array.from({length:max},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div></div>`;d.appendChild(btn);r.replaceWith(d)});
  if(!fb.querySelector('.m12-std'))fb.insertAdjacentHTML('afterbegin',`<div class="m12-std">${badge(c.club,50)}<div><b>Estadio de ${esc(c.club)}</b><small>INFRAESTRUCTURA · NIVEL ${+c.stadium||1}</small></div></div>`)}
 const fin=$('m12Fin');
 if(fin){const P=c.players||[],val=P.reduce((a,p)=>a+(+p.value||0),0),wage=P.reduce((a,p)=>a+(+p.wage||0),0);
  const G=[['POR','Arqueros','#f0b93a'],['DEF','Defensores','#3d8bff'],['MED','Mediocampistas','#34c873'],['DEL','Delanteros','#f0535f']].map(g=>{const l=P.filter(p=>p.pos===g[0]);return[g[1],l.reduce((a,p)=>a+(+p.wage||0),0),g[2],l.length]});
  const TH=c.transferHistory||[],ins=TH.filter(x=>/^ENTRADA|^PR.STAMO/.test(String(x.detail||''))).length,outs=TH.length-ins;
  const num=v=>typeof v==='number'&&isFinite(v);
  fin.innerHTML=`<div class="m12-ph"><i data-i="coin"></i>Balance económico<span class="sp"></span><small>TEMPORADA ${seasonTxt(c)}</small></div>
  <div class="m12-kv"><div><small>Saldo disponible</small><b>$${esc(c.budget)}M</b></div><div><small>Valor del plantel</small><b>${money(val)}</b></div><div><small>Masa salarial / año</small><b>${money(wage)}</b></div><div><small>Reputación del club</small><b>${num(c.clubReputation)?c.clubReputation+'/100':'—'}</b></div></div>
  <div class="m12-ph" style="margin-top:14px;font-size:14px"><i data-i="bars"></i>Salarios por línea</div>
  <div class="m12-donut">${donut(G,wage,'Reparto de la masa salarial por línea')}<div class="m12-legend">${G.map(g=>`<span><i style="background:${g[2]}"></i><span style="flex:1">${g[0]} (${g[3]})</span><b style="color:#fff">${money(g[1])}</b></span>`).join('')}</div></div>
  ${row('Fichajes y préstamos realizados',ins)}${row('Ventas realizadas',outs)}${num(c.debts)?row('Deuda',c.debts?'$'+c.debts+'M':'Sin deuda'):''}${Array.isArray(c.sponsors)?c.sponsors.map(s=>s&&typeof s==='object'&&s.name?row(esc(s.name)+(s.level?' · nivel '+esc(s.level):''),num(s.income)?'+$'+s.income+'M / año':'—'):'').join(''):''}
  <button class="btn secondary" style="width:100%;margin-top:12px" onclick="setMarketTab('contracts');go('market')">VER CONTRATOS DEL PLANTEL</button>`}
 icons($('board'))}
function row(k,v){return `<div class="statsrow"><span>${k}</span><b>${v}</b></div>`}
/* K. Academia, instalaciones y staff: mismas filas y mismos botones, con nombre en español, icono y nivel */
const FACN={trainingPitches:['pitch','Campos de entrenamiento'],gym:['gym','Gimnasio'],medical:['cross','Centro médico'],analysis:['chart','Análisis de video'],residence:['building','Residencia juvenil']};
const STFN={coach:['user','Cuerpo técnico'],scout:['eye','Ojeadores'],medical:['cross','Cuerpo médico'],analyst:['chart','Analistas']};
function advDecor(){const c=C(),box=$('advancedContent');if(!c||!box)return;try{syncTabs('#advancedTabs button','advancedTab',advancedView)}catch(e){}
 box.querySelectorAll('.statsrow').forEach(r=>{const btn=r.querySelector('button'),on=(btn&&btn.getAttribute('onclick'))||'';let m=/upgradeFacility\('(\w+)'\)/.exec(on),src=c.facilities,N=FACN;if(!m){m=/upgradeStaff\('(\w+)'\)/.exec(on);src=c.staff;N=STFN}if(!m)return;
  const k=m[1],f=N[k]||['dot',k],lv=+((src||{})[k])||1,max=Math.max(5,lv);const d=document.createElement('div');d.className='m12-fac';
  d.innerHTML=`<div class="ic"><i data-i="${f[0]}"></i></div><div><b>${esc(f[1])}</b><small>NIVEL ${lv}</small><div class="m12-pips">${Array.from({length:max},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div></div>`;d.appendChild(btn);r.replaceWith(d)});icons($('advanced'))}

/* ---------- F / I. TÁCTICAS Y SIMULADOR: dos columnas en pantallas grandes ---------- */
function layoutSetup(){
 M.cols('tactics',[':scope>.x-tgrid',':scope>.x-hint',':scope>.x-actions',':scope>.btn'],[':scope>.x-two']);
 const st=$('matchStats')&&$('matchStats').closest('.x-panel'),rt=$('ratingsList')&&$('ratingsList').closest('.x-panel');
 M.cols('match',[':scope>.x-score',':scope>.x-comp',':scope>.mc-stadium',':scope>.x-ctl',':scope>#simEndBtn',':scope>.x-big',':scope>#matchAction'],[':scope>.mc-sim',st,rt]);
 const sc=document.querySelector('#match .x-score');if(sc)sc.classList.add('m12-gold')}

/* ---------- ARRANQUE ---------- */
function activeId(){const a=document.querySelector('.page.active');return a?a.id:''}
function afterGo(){const id=activeId();M.navState(id);M.seasonChip();if(id==='home')M.homeBuild();else if(id==='news')M.renderNews();else if(id==='world')worldDecor()}
function boot(){
 document.body.classList.add('m12-on');
 const step=(t,f)=>{try{f()}catch(e){warn(t,e)}};
 step('chrome',M.chrome);
 step('heroes',()=>{[['newcareer','globe'],['saves','folder'],['squad','people'],['players','list'],['backup','save']].forEach(x=>M.heroize(x[0],x[1]));M.heroize('advanced','cap','GESTIÓN DEL CLUB')});
 step('noticiero',()=>M.ensureNews());step('layout',layoutSetup);step('league',leagueSetup);step('board',boardSetup);step('market',marketSetup);step('dash',M.dashSetup);
 step('hooks',()=>{
  after('renderHome',()=>M.homeBuild());after('renderDashboard',M.dashRender);after('renderLineupV6',M.lineupDecor);after('renderSquad',M.squadRender);
  after('renderLeague',leagueRender);after('renderMarket',marketRender);after('renderBoard',boardRender);after('renderAdvanced',advDecor);after('renderPlayersAdmin',()=>cardFaces($('mcPlayersBody')));
  after('go',afterGo);after('WSUBset',worldDecor);
  if(typeof window.openPlayer==='function')window.openPlayer=M.openPlayer12});
 step('inicio',()=>{M.homeBuild();if(C()){try{renderAll()}catch(e){}}afterGo()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* ===== MC12.1 · Pantalla de inicio según la referencia del usuario (solo presentación) ===== */
(function(){
'use strict';
const M=window.MC12;if(!M)return;
const {$,esc,C,icons}=M;
const need=x=>`career?${x}:go('newcareer')`;
/* Banderas dibujadas (no se usan logos oficiales de ligas) */
const FLAG={
 Argentina:'<rect width="30" height="20" fill="#74acdf"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><circle cx="15" cy="10" r="2.2" fill="#f6b40e"/>',
 España:'<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>',
 Inglaterra:'<rect width="30" height="20" fill="#fff"/><rect x="12.5" width="5" height="20" fill="#ce1124"/><rect y="7.5" width="30" height="5" fill="#ce1124"/>',
 Italia:'<rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce2b37"/>',
 Alemania:'<rect width="30" height="6.67" fill="#000"/><rect y="6.67" width="30" height="6.67" fill="#dd0000"/><rect y="13.33" width="30" height="6.67" fill="#ffce00"/>',
 Francia:'<rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ed2939"/>',
 Brasil:'<rect width="30" height="20" fill="#009c3b"/><path d="M15 2.5L27 10 15 17.5 3 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.2" fill="#002776"/>'
};
const LG=[['Argentina','ARGENTINA','Liga Profesional','a'],['España','ESPAÑA','LaLiga EA Sports','b'],['Inglaterra','INGLATERRA','Premier League','c'],['Italia','ITALIA','Serie A','d'],['Alemania','ALEMANIA','Bundesliga','e'],['Francia','FRANCIA','Ligue 1','f'],['Brasil','BRASIL','Brasileirão','g']];
const CROWN='<svg viewBox="0 0 40 24"><path d="M2 8l8 7 10-13 10 13 8-7-3 14H5z" fill="currentColor"/><circle cx="20" cy="2.5" r="2.2" fill="currentColor"/><circle cx="2.5" cy="7.5" r="1.9" fill="currentColor"/><circle cx="37.5" cy="7.5" r="1.9" fill="currentColor"/></svg>';
const CUP='<svg viewBox="0 0 64 80"><defs><linearGradient id="m12cg" x1="0" x2="1"><stop offset="0" stop-color="#8d98ad"/><stop offset=".35" stop-color="#f4f7ff"/><stop offset=".6" stop-color="#b9c3d6"/><stop offset="1" stop-color="#5d6880"/></linearGradient></defs><path d="M16 6h32v18c0 11-7 19-16 19S16 35 16 24z" fill="url(#m12cg)"/><path d="M16 10H6c0 12 5 18 13 19M48 10h10c0 12-5 18-13 19" fill="none" stroke="url(#m12cg)" stroke-width="3.5"/><rect x="28" y="42" width="8" height="14" fill="url(#m12cg)"/><path d="M20 56h24l3 10H17z" fill="url(#m12cg)"/><rect x="14" y="66" width="36" height="9" rx="2" fill="#2a3550" stroke="#c9a23e"/></svg>';
const SLIDES=[
 ['COMPETICIONES<br>INTERNACIONALES','Jugá las copas continentales, los torneos de clubes y mucho más.',"career?mc10World('comps'):mc10OpenFinder()"],
 ['SELECCIONES<br>NACIONALES','Mundial, torneos continentales y las convocatorias de cada país.',"career?mc10World('nt'):mc10OpenFinder()"],
 ['RANKINGS<br>MUNDIALES','Los mejores clubes y jugadores de todo el mundo.',"career?mc10World('rank'):mc10OpenFinder()"]];
let slide=0;
const SOLID={"trophy": "<path d=\"M6 3h12v2h3v3a5 5 0 01-4.6 5A6 6 0 0113 16.9V19h3v2H8v-2h3v-2.1A6 6 0 017.6 13 5 5 0 013 8V5h3zM5 7v1a3 3 0 002.1 2.900A9 9 0 016 7zm14 0h-1a9 9 0 01-1.100 3.900A3 3 0 0019 8z\"/>", "swap": "<path d=\"M16 3l5 4.500-5 4.500V9H4V6h12zM8 12v3h12v3H8v3l-5-4.500z\"/>", "chart": "<path d=\"M4 15h4v6H4zM10 10h4v11h-4zM16 4h4v17h-4z\"/>", "cap": "<path d=\"M12 3L1 9l11 6 9-4.900V17h2V9zM5 13.200V17c0 1.700 3.100 3.500 7 3.500s7-1.800 7-3.500v-3.800l-7 3.800z\"/>"};
function build(){const s=$('home');if(!s)return;const c=C();let box=$('m12H');
 if(!box){box=document.createElement('div');box.id='m12H';s.insertBefore(box,s.firstChild)}
 const mgr=c&&c.manager?c.manager:'Mánager';
 const T=(i,a,b,on)=>`<button class="t" onclick="${on}">${SOLID[i]?`<svg class="f" viewBox="0 0 24 24">${SOLID[i]}</svg>`:`<i data-i="${i}"></i>`}<span>${a}<br>${b}</span></button>`;
 box.innerHTML=`<div class="w">
 <div class="hero"><div class="bg"></div>
  <div class="top"><button class="usr" onclick="${need("go('dashboard')")}"><span class="ua"><i data-i="user"></i></span><span><small>Bienvenido</small><b>${esc(mgr)}</b></span></button>
   <a class="lg" onclick="go('home')"><span class="arc"></span><span class="cr">${CROWN}</span><b>MODO</b><b>CARRERA</b><small>MANAGER DE FÚTBOL</small></a>
   <button class="gr" onclick="go('more')" title="Configuración"><svg viewBox="0 0 24 24"><path d="M19.4 13a7.7 7.7 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.7 7.7 0 000 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" transform="translate(-1 0)"/></svg></button></div>
  <div class="cp">${c?`<h1>CONTINÚA TU<br>CARRERA</h1><p>${esc(c.club)} te espera.<br>Temporada ${M.seasonTxt(c)}.</p><button class="ng" onclick="go('dashboard')"><span class="pl"></span>CONTINUAR</button><a class="sm" onclick="go('newcareer')">o empezá una nueva partida ›</a>`
   :`<h1>INICIA TU<br>CARRERA</h1><p>Elige un club, define tu proyecto<br>y conviértete en leyenda.</p><button class="ng" onclick="go('newcareer')"><span class="pl"></span>NUEVA PARTIDA</button>`}</div></div>
 <div class="tl">${T('folder','CARGAR','PARTIDA',"go('saves')")}${T('trophy','TORNEOS','PERSONALIZADOS',need("MC12.leagueTab('cup')"))}${T('swap','MERCADO','DE FICHAJES',need("go('market')"))}${T('chart','ESTADÍSTICAS','GENERALES',need("MC12.leagueTab('scorers')"))}${T('cap','ACADEMIA','JUVENIL',need("go('advanced')"))}</div>
 <div class="lp"><div class="lh"><i data-i="globe"></i><b>LIGAS DISPONIBLES</b><a onclick="mc10OpenFinder()">Ver todas <span>›</span></a></div>
  <div class="lr">${LG.map(l=>`<button class="lc ${l[3]}" onclick="selectHomeLeague('${l[0]}')"><span class="fl"><svg viewBox="0 0 30 20" preserveAspectRatio="none">${FLAG[l[0]]}</svg></span><b>${l[1]}</b><small>${l[2]}</small></button>`).join('')}</div></div>
 <div class="bn"><div class="sl">${SLIDES.map(x=>`<button class="sd" onclick="${x[2]}"><span class="sb"></span><span class="tx"><b>${x[0]}</b><small>${x[1]}</small></span><span class="cup">${CUP}</span><span class="nx">›</span></button>`).join('')}</div></div>
 <div class="dt">${SLIDES.map((x,i)=>`<i class="${i===slide?'on':''}" onclick="MC12.homeSlide(${i})"></i>`).join('')}</div>
 </div>`;
 const sl=box.querySelector('.sl');sl.addEventListener('scroll',()=>{const i=Math.round(sl.scrollLeft/Math.max(1,sl.clientWidth));if(i!==slide){slide=i;box.querySelectorAll('.dt i').forEach((d,k)=>d.classList.toggle('on',k===i))}},{passive:true});
 if(slide)sl.scrollLeft=slide*sl.clientWidth;
 icons(box)}
M.homeSlide=function(i){const sl=document.querySelector('#m12H .sl');if(sl)sl.scrollTo({left:i*sl.clientWidth,behavior:'smooth'})};
M.homeBuild=build;

/* Barra inferior como en la referencia: Inicio · Mi Carrera · Calendario · Plantel · Fichajes · Competiciones.
   Táctica sigue en "Mi Carrera" (accesos rápidos) y en el menú lateral; Configuración, en el engranaje. */
function navRef(){const n=document.querySelector('nav.nav');if(!n)return;
 const B=[['home','home','Inicio',"go('home')",1],['dashboard','shield','Mi Carrera',need("go('dashboard')"),2],['m12cal','cal','Calendario',need("MC12.leagueTab('calendar')"),3],['squad','people','Plantel',need("go('squad')"),5],['market','swap','Fichajes',need("go('market')"),6],['m12comp','trophy','Competiciones',need("MC12.leagueTab('cup')"),7]];
 const old={};n.querySelectorAll('button[data-go]').forEach(b=>old[b.dataset.go]=b);
 B.forEach(x=>{let b=old[x[0]];if(!b){b=document.createElement('button');b.dataset.go=x[0];n.appendChild(b)}b.setAttribute('onclick',x[3]);b.innerHTML=`<i data-i="${x[1]}"></i>${x[2]}`;b.style.order=x[4]});
 ['tactics','more'].forEach(k=>{const b=old[k];if(b)b.classList.add('m12-side')});
 if(old.tactics)old.tactics.style.order=4;
 n.querySelectorAll('.m12-nl[data-go=league]').forEach(a=>a.remove());
 icons(n)}
function navActive(){const id=(document.querySelector('.page.active')||{}).id;let v='';try{v=leagueView}catch(e){}
 const n=document.querySelector('nav.nav');if(!n)return;
 n.querySelector('[data-go=m12cal]')?.classList.toggle('active',id==='league'&&v==='calendar');
 n.querySelector('[data-go=m12comp]')?.classList.toggle('active',id==='league'&&v!=='calendar')}
M.navRef=navRef;M.navActive=navActive;
function boot2(){try{navRef();M.after('go',navActive);M.after('applyLanguage',()=>{navRef();navActive()});M.after('renderLeague',navActive);if(document.querySelector('#home.active'))build();navActive()}catch(e){M.warn('inicio',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot2);else setTimeout(boot2,0);
})();

/* ===== MC12.1 · Club, Simulador y Negociaciones según las referencias del usuario (solo presentación) =====
   Todas las acciones llaman a funciones que ya existían: openMatch, mcMainAction, mcSimEnd, toggleMatchPause, mcSpeed,
   openMatchSubs, submitTransferOffer, mc10Loan, renewPlayer, toggleTransferListing, generateClubBid. */
(function(){
'use strict';
const M=window.MC12;if(!M)return;
const {$,esc,C,nm,money,flag,badge,icons,warn,after,lgName,av,seasonTxt}=M;
const tier=M.tier;
const pct=(a,b)=>{const t=(+a||0)+(+b||0);return t?Math.round((+a||0)/t*100):50};
const curMatch=()=>{try{return typeof match!=='undefined'?match:null}catch(e){return null}};
const CROWN='<svg viewBox="0 0 40 24"><path d="M2 8l8 7 10-13 10 13 8-7-3 14H5z" fill="currentColor"/><circle cx="20" cy="2.5" r="2.2" fill="currentColor"/><circle cx="2.5" cy="7.5" r="1.9" fill="currentColor"/><circle cx="37.5" cy="7.5" r="1.9" fill="currentColor"/></svg>';
const LOGO=`<a class="m12-lg2" onclick="go('home')"><span class="cr">${CROWN}</span><b>MODO</b><b>CARRERA</b></a>`;
const S={ /* iconos rellenos al estilo de las referencias */
 trophy:'<path d="M6 3h12v2h3v3a5 5 0 01-4.6 5A6 6 0 0113 16.9V19h3v2H8v-2h3v-2.1A6 6 0 017.6 13 5 5 0 013 8V5h3zM5 7v1a3 3 0 002.1 2.9A9 9 0 016 7zm14 0h-1a9 9 0 01-1.1 3.9A3 3 0 0019 8z"/>',
 podium:'<path d="M9 8h6v13H9zM2 13h6v8H2zM16 11h6v10h-6z"/>',
 coins:'<ellipse cx="9" cy="6" rx="6" ry="2.6"/><path d="M3 6v3c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V6c0 1.4-2.7 2.6-6 2.6S3 7.4 3 6zM3 10.5v3c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-3c0 1.4-2.7 2.6-6 2.6s-6-1.2-6-2.6z"/><ellipse cx="15" cy="13.5" rx="6" ry="2.6"/><path d="M9 13.5v3c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-3c0 1.4-2.7 2.6-6 2.6s-6-1.2-6-2.6zM9 18v2c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-2c0 1.4-2.7 2.6-6 2.6S9 19.4 9 18z"/>',
 hand:'<path d="M1 11l5-5 4 2 3-2 3 1 3-2 4 5-3 3-1-1-5 5a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2z"/>',
 crowd:'<circle cx="7" cy="6" r="3"/><circle cx="17" cy="6" r="3"/><circle cx="12" cy="8" r="3.4"/><path d="M1 21v-4c0-3 2.5-5 6-5 1.3 0 2.4.3 3.3.8C8.2 14 7 15.8 7 18v3zM23 21v-4c0-3-2.5-5-6-5-1.3 0-2.4.3-3.3.8C15.8 14 17 15.8 17 18v3zM8 21v-3c0-3 1.8-5 4-5s4 2 4 5v3z"/>',
 cal:'<path d="M4 5h16v16H4zM4 9h16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 3h2v4H7zM15 3h2v4h-2zM7 12h2v2H7zM11 12h2v2h-2zM15 12h2v2h-2zM7 16h2v2H7zM11 16h2v2h-2z"/>',
 bars:'<path d="M3 14h4v7H3zM10 9h4v12h-4zM17 4h4v17h-4z"/>',
 pie:'<path d="M11 3a9 9 0 109 10h-9z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 1v10h10A10 10 0 0013 1z"/>',
 stadium:'<path d="M2 9c0-2.5 4.5-4 10-4s10 1.5 10 4v6c0 2.5-4.5 4-10 4S2 17.5 2 15zm2 0c0 1.2 3.5 2.6 8 2.6S20 10.2 20 9s-3.5-2.6-8-2.6S4 7.8 4 9z"/>',
 people:'<circle cx="9" cy="7" r="3.5"/><circle cx="17" cy="8" r="2.8"/><path d="M2 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5zM16 20c0-2.5-.8-4.4-2.2-5.6.9-.4 1.9-.6 3.2-.6 3 0 5 2 5 5.2v1z"/>',
 user:'<circle cx="12" cy="7" r="4"/><path d="M3 21c0-5 4-8 9-8s9 3 9 8z"/>',
 doc:'<path d="M5 2h10l5 5v15H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11h8v2H8zM8 15h8v2H8z"/>',
 target:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 12l8-8M17 3h4v4"/>',
 shirt:'<path d="M8 3L2 6l2 5 3-1v11h10V10l3 1 2-5-6-3c-.5 2-2 3-4 3s-3.5-1-4-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
 sliders:'<path d="M3 6h10M17 6h4M3 12h4M11 12h10M3 18h12M19 18h2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="15" cy="6" r="2.3"/><circle cx="9" cy="12" r="2.3"/><circle cx="17" cy="18" r="2.3"/>',
 swap:'<path d="M16 3l5 4.5-5 4.5V9H4V6h12zM8 12v3h12v3H8v3l-5-4.5z"/>',
 down:'<path d="M11 3h2v10l3.5-3.5L18 11l-6 6-6-6 1.5-1.5L11 13zM4 19h16v2H4z"/>',
 up:'<path d="M12 3l7 7-1.5 1.5L13 7v14h-2V7l-4.5 4.5L5 10z"/>',
 bino:'<circle cx="6.5" cy="15" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.5" cy="15" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 11l2.5-7h3l1 7M20 11l-2.5-7h-3l-1 7M10 14h4"/>',
 send:'<path d="M2 11L22 3l-6 18-4.5-7.5zM11.5 13.5L22 3"/>',
 pause:'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
 play:'<path d="M6 3l15 9-15 9z"/>',
 form:'<circle cx="12" cy="4.5" r="2.5"/><circle cx="5" cy="17" r="2.5"/><circle cx="19" cy="17" r="2.5"/><circle cx="12" cy="13" r="2.5"/><path d="M12 7v3.5M10.3 14.6l-3.8 1.4M13.7 14.6l3.8 1.4" stroke="currentColor" stroke-width="1.6"/>',
 clip:'<path d="M8 3h8v3H8z"/><path d="M5 5h14v17H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 13.5l2.3 2.3 4.7-4.8" fill="none" stroke="currentColor" stroke-width="2"/>',
 list:'<path d="M4 5h2v2H4zM4 11h2v2H4zM4 17h2v2H4zM9 5h11v2H9zM9 11h11v2H9zM9 17h11v2H9z"/>',
 chev:'<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 back:'<path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 star:'<path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/>',
 ball:'<circle cx="12" cy="12" r="10" fill="#fff"/><path d="M12 7l4 3-1.5 4.5h-5L8 10zM12 2.5V7M16 10l4.3-1.5M14.5 14.5l2.6 4M9.5 14.5l-2.6 4M8 10L3.7 8.5" stroke="#111" stroke-width="1.3" fill="none"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z" fill="#111"/>'
};
const sv=(k,c)=>`<svg class="${c||'si'}" viewBox="0 0 24 24" aria-hidden="true">${S[k]||''}</svg>`;
const DIAS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function roundDate(c,r,cup){const d=new Date(c.season,7,1);while(d.getDay()!==0)d.setDate(d.getDate()+1);d.setDate(d.getDate()+7*r-(cup?4:0));return d}
const ddate=d=>`${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;

/* =====================================================================
   1) CLUB · CENTRO DE OPERACIONES
   ===================================================================== */
function clubBuild(){const c=C(),s=$('dashboard');if(!c||!s)return;let box=$('m12Club');
 if(!box){box=document.createElement('div');box.id='m12Club';box.className='m12x';s.insertBefore(box,s.firstChild)}
 const li=M.leagueInfo(),cur=M.current(),L=c.league,tot=L?(L.total||L.rounds.length):0;
 const pos=li&&li.pos>=0?(li.pos+1)+'º':'—',pts=li&&li.row?li.row.pts:(c.points||0);
 let sq=0;try{sq=avgRating()}catch(e){sq=Math.round(c.players.slice(0,11).reduce((a,p)=>a+p.rating,0)/11)}
 const board=+c.board||0,btxt=board>=70?'La directiva respalda tu proyecto.':board>=45?'La directiva espera mejores resultados.':'Tu puesto está en riesgo.';
 let nx='';
 if(cur&&cur.home){const isL=/^LIGA/i.test(String(cur.label||''))||cur.type==='lg';const rr=c.round||0;const d=roundDate(c,isL?rr:rr,!isL);
  const fpill=isL&&tot?`FECHA ${Math.min(rr+1,tot)}/${tot}`:esc(String(cur.label||'').replace(/^.*·\s*/,'').toUpperCase()||'COPA');
  const ln=String(lgName(c.country));const comp=isL?`${esc(ln.length>16?'Liga':ln)} - Fecha ${Math.min(rr+1,tot)}`:esc(cur.label||'Copa');
  nx=`<div class="pn nx"><div class="ph"><b>Próximo desafío</b><span class="pill">${sv('cal')}${fpill}</span></div>
   <div class="vs"><div class="tm">${badge(cur.home,62)}<div><b>${esc(cur.home)}</b><small>LOCAL</small></div></div><em>VS</em><div class="tm r"><div><b>${esc(cur.away)}</b><small>VISITANTE</small></div>${badge(cur.away,62)}</div></div>
   <div class="inf"><span>${sv('trophy')}${comp}</span><span>${sv('cal')}${ddate(d)}</span><span>${sv('stadium')}Estadio de ${esc(cur.home)}</span></div>
   <button class="go" onclick="openMatch()">${sv('play')}IR A LA PREVIA DEL PARTIDO →</button></div>`}
 else nx=`<div class="pn nx"><div class="ph"><b>Próximo desafío</b></div><p class="em">No hay partidos pendientes. Revisá la tabla y el cierre de temporada.</p><button class="go" onclick="MC12.leagueTab('table')">VER CLASIFICACIÓN →</button></div>`;
 const news=(M.news?M.news().filter(x=>x.cat==='club'&&!x.plain):[]).slice(0,2);
 box.innerHTML=`<div class="w">
 <div class="hd"><div class="stb"></div><div class="eb">CENTRO DE OPERACIONES</div><h1>${esc(c.club)}</h1><p>Entrenador: ${esc(c.manager||'—')}</p></div>
 <div class="k3"><div class="k">${sv('trophy','ki')}<div><b>${pts}</b><small>PUNTOS</small></div></div><div class="k">${sv('podium','ki')}<div><b>${pos}</b><small>POSICIÓN</small></div></div><div class="k">${sv('coins','ki')}<div><b>$${esc(c.budget)}M</b><small>PRESUPUESTO</small></div></div></div>
 ${nx}
 <div class="q4"><button onclick="MC12.leagueTab('calendar')">${sv('cal','qi')}Calendario</button><button onclick="MC12.leagueTab('calendar');setTimeout(()=>{const e=document.querySelector('#m12Cal');e&&e.scrollIntoView({block:'start'})},60)">${sv('bars','qi')}Resultados</button><button onclick="MC12.leagueTab('table')">${sv('trophy','qi')}Clasificación</button><button onclick="MC12.leagueTab('scorers')">${sv('pie','qi')}Estadísticas</button></div>
 <div class="two"><div class="pn cf"><span class="wm">${sv('hand')}</span><small class="eb">CONFIANZA</small><b class="big">${board}%</b><div class="bar"><i style="width:${Math.max(0,Math.min(100,board))}%"></i></div><p>${btxt}</p></div>
  <div class="pn pl" onclick="go('squad')"><span class="wm">${sv('crowd')}</span><small class="eb">PLANTEL</small><b class="big">${sq}</b><p>Valoración media del equipo</p><span class="cnt">${sv('people')}${c.players.length} JUGADORES</span></div></div>
 <div class="pn nw"><div class="ph"><b>${sv('doc','hi')}Noticias del club</b><small>ACTUALIZADO HOY</small></div>${news.length?news.map(n=>`<div class="ni" onclick="${esc(n.go||"go('news')")}"><span class="th">${n.club?badge(n.club,44):''}</span><div><b>${esc(n.title)}</b><span>${esc(n.text||'')}</span></div><i>›</i></div>`).join(''):'<p class="em">Todavía no hay noticias.</p>'}
  <button class="all" onclick="go('news')">ABRIR EL NOTICIERO</button></div>
 <div class="q4 more"><button onclick="go('tactics')">${sv('form','qi')}Tácticas</button><button onclick="go('board')">${sv('coins','qi')}Finanzas</button><button onclick="go('advanced')">${sv('people','qi')}Academia</button><button onclick="MC12.nego()">${sv('hand','qi')}Negociaciones</button></div>
 </div>`}

/* =====================================================================
   2) SIMULADOR DE PARTIDOS
   ===================================================================== */
let MT='stats';
const PH={pre:'Previa',first:'1º Tiempo',ht:'Entretiempo',second:'2º Tiempo'};
function rows(m){const c=C();const own=m.venue!=='a';/* el local primero (cancha neutral: el propio) */const H=own?m.own.map(e=>({n:e.p.number,name:e.p.name,g:e.g})):m.riv.map(e=>({name:e.name,g:e.g}));const A=own?m.riv.map(e=>({name:e.name,g:e.g})):m.own.map(e=>({n:e.p.number,name:e.p.name,g:e.g}));return{H,A}}
/* Cancha en perspectiva dibujada en SVG (las posiciones salen de la formación real de cada equipo) */
const PJ=(u,v)=>{const y0=6,y1=128,wf=420,wn=700;const vv=v*.82+.18*v*v;return[300+(u-.5)*(wf+(wn-wf)*vv),y0+(y1-y0)*vv]};
const poly=pts=>pts.map(p=>PJ(p[0],p[1]).map(n=>n.toFixed(1)).join(',')).join(' ');
const rect=(u0,u1,v0,v1)=>poly([[u0,v0],[u1,v0],[u1,v1],[u0,v1]]);
function pitchSVG(m,fH,fA,R,hot){let g='';
 for(let k=0;k<10;k++)g+=`<polygon points="${rect(k/10,(k+1)/10,0,1)}" fill="${k%2?'#2a8a3c':'#33983f'}"/>`;
 const L='fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.3"';
 g+=`<polygon points="${rect(0,1,0,1)}" ${L}/><polyline points="${poly([[.5,0],[.5,1]])}" ${L}/>`;
 let cc=[];for(let a=0;a<=36;a++){const t=a/36*Math.PI*2;cc.push([.5+Math.cos(t)*.087,.5+Math.sin(t)*.135])}g+=`<polygon points="${poly(cc)}" ${L}/>`;
 g+=`<polygon points="${rect(0,.157,.2,.8)}" ${L}/><polygon points="${rect(.843,1,.2,.8)}" ${L}/><polygon points="${rect(0,.052,.37,.63)}" ${L}/><polygon points="${rect(.948,1,.37,.63)}" ${L}/>`;
 [[0,-1],[1,1]].forEach(([u,d])=>{const a=PJ(u,.445),b=PJ(u,.555),h=12;g+=`<g stroke="#fff" stroke-width="1.4" fill="rgba(255,255,255,.12)"><polygon points="${a[0]},${a[1]} ${a[0]},${a[1]-h} ${b[0]},${b[1]-h} ${b[0]},${b[1]}"/><line x1="${a[0]+d*6}" y1="${a[1]-h+2}" x2="${a[0]}" y2="${a[1]-h}"/></g>`});
 const shift=((m.pos||50)-50)/100*.14,t=m.tick||m.minute||0;const items=[];
 const team=(form,side,list)=>{let co=[];try{co=positions(form||'4-3-3')}catch(e){}list.slice(0,11).forEach((p,i)=>{const c=co[i]||[50,50];let u=.035+(100-c[1])/100*.47+shift;if(side==='a')u=1-u;let v=.08+c[0]/100*.84;
  if(i>0){u+=Math.sin(t*.9+i*1.7)*.012;v+=Math.cos(t*.7+i*2.3)*.03}items.push({u,v,side,gk:i===0,p})})};
 team(fH,'h',R.H);team(fA,'a',R.A);
 const bu=Math.max(.06,Math.min(.94,.5+((m.pos||50)-50)/100*.6+Math.sin(t*1.3)*.15)),bv=Math.max(.1,Math.min(.9,.5+Math.cos(t*1.1)*.3));
 items.sort((a,b)=>a.v-b.v).forEach(o=>{const[x,y]=PJ(o.u,o.v),s=1+.6*o.v;
  const shirt=o.gk?(o.side==='h'?'#2fd06a':'#ff8a1a'):(o.side==='h'?'#f4f4f4':'#1747b0'),band=o.gk?shirt:(o.side==='h'?'#d3212f':'#f1c62a'),shorts=o.side==='h'?'#111':(o.gk?'#111':'#123a8f'),skin=o.side==='h'?'#f0caa6':'#d9a87e';
  const isHot=hot&&o.p.name===hot;
  g+=`<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})">${isHot?'<ellipse cx="0" cy="0" rx="9" ry="3" fill="none" stroke="#f5e14a" stroke-width="1.6"/>':''}<ellipse cx="0" cy="0.5" rx="4.5" ry="1.4" fill="rgba(0,0,0,.35)"/><path d="M-1.8 0v-5M1.8 0v-5" stroke="${skin}" stroke-width="1.6"/><rect x="-2.6" y="-7.6" width="5.2" height="3" rx=".8" fill="${shorts}"/><path d="M-3 -13.2h6l.6 5.8h-7.2z" fill="${shirt}"/><rect x="-3.1" y="-10.8" width="6.2" height="1.2" fill="${band}"/><circle cx="0" cy="-15.2" r="2" fill="${skin}"/>${isHot?`<g transform="translate(0,-21)"><path d="M-3 -2h6l-3 4z" fill="#e02a2a"/><rect x="-24" y="-13" width="48" height="10" rx="2" fill="rgba(4,8,20,.92)"/><text x="0" y="-5.5" text-anchor="middle" font-size="6.5" font-weight="700" fill="#fff" font-family="Barlow Semi Condensed,Arial,sans-serif">${esc((o.p.n?o.p.n+'  ':'')+M.short(o.p.name))}</text></g>`:''}</g>`;
  if(Math.abs(o.v-bv)<.04&&false){}});
 const[bx,by]=PJ(bu,bv);g+=`<circle cx="${bx.toFixed(1)}" cy="${(by-1.5).toFixed(1)}" r="2" fill="#fff" stroke="#222" stroke-width=".4"/>`;
 return `<svg class="pitch" viewBox="0 0 600 130" preserveAspectRatio="xMidYMin slice">${g}</svg>`}
function lastEv(m){const E=m.events||[];for(let i=E.length-1;i>=0;i--){if(E[i].title)return E[i]}return null}
function evIcon(t){t=String(t||'');return /GOL/i.test(t)?sv('ball','ei'):/ROJA/i.test(t)?'<span class="cd r"></span>':/AMARILLA|TARJETA/i.test(t)?'<span class="cd"></span>':/CAMBIO/i.test(t)?sv('swap','ei y'):/LESI/i.test(t)?'<span class="ei x">+</span>':/(ARCO|REMATE|OCASI|ATAJ|PALO|TIRO)/i.test(t)?sv('target','ei'):/(⏱|⏸|FINAL|COMIENZA|DESCANSO)/.test(t)?'<span class="ei w">⏱</span>':'<span class="ei w">•</span>'}
const clean=t=>String(t||'').replace(/^[^A-Za-zÁÉÍÓÚÑ¡]+/,'').trim();
const first=s=>{s=String(s||'');const i=s.search(/[.!?](\s|$)/);return i>0?s.slice(0,i+1):s};
/* 12.5 · los goles muestran autor, asistencia y cómo fue (antes se veía solo "¡GOOOL de ...!") */
const isGoal=t=>/GOL (LOCAL|VISITANTE)/i.test(String(t||''));
const GTIPO={cabezazo:'de cabeza',corner:'de cabeza tras un córner',centro:'tras un centro',filtrado:'tras un pase filtrado',area:'dentro del área',contra:'de contraataque',afuera:'remate de afuera del área',individual:'jugada individual',rebote:'de rebote',tirolibre:'de tiro libre',pen:'de penal'};
function golTxt(e){const g=e.gol;let rest=String(e.msg||'').replace(/^¡GO+L de [^!]*!\s*/,'');
 if(!g)return rest;if(g.asist)rest=rest.replace(/\s*\(asistencia de [^)]*\)/,'');
 const head=`${g.autor}${g.asist?' (asistencia: '+g.asist+')':''}${GTIPO[g.tipo]?' · '+GTIPO[g.tipo]:''}`;return head+'. '+rest}
const evTxt=e=>isGoal(e.title)?golTxt(e):first(e.msg);
function matchBuild(){const s=$('match'),m=curMatch(),c=C();if(!s||!c)return;let box=$('m12M');
 if(!box){box=document.createElement('div');box.id='m12M';box.className='m12x';s.insertBefore(box,s.firstChild)}
 if(!m){box.innerHTML='<div class="w"><p class="em">No hay un partido en juego.</p></div>';return}
 /* el local siempre a la izquierda (como el relato y la gráfica de TV): nombres, escudos, formación, marcador y estadísticas */
 const own=m.venue!=='a',LN=own?m.home:m.away,VN=own?m.away:m.home,fH=own?(c.formation||'4-3-3'):(m.tacR&&m.tacR.formation)||'4-4-2',fA=own?(m.tacR&&m.tacR.formation)||'4-4-2':(c.formation||'4-3-3');
 const sH=own?(c.style||'Equilibrado'):(m.tacR&&m.tacR.style)||'Equilibrado',sA=own?(m.tacR&&m.tacR.style)||'Equilibrado':(c.style||'Equilibrado');
 const isL=/^LIGA/i.test(String(m.compLabel||''));const comp=isL?`${lgName(c.country)} - ${String(m.compLabel).replace(/^LIGA\s*·\s*/i,'').replace(/^FECHA/i,'Fecha')}`:(m.compLabel||'Partido');
 const ph=(window.MC2D&&MC2D.etiqueta&&MC2D.etiqueta(m))||(m.done?'Final':(PH[m.phase]||''));const mv=window.MC2D&&MC2D.minuto?MC2D.minuto(m):null,mn=m.phase==='pre'?"0'":(mv||m.lbl||m.minute||0)+"'";
 const R=rows(m),hot=(m.scorers||[]).slice(-1)[0];
 /* con el 2D (solo partidos con cinta del v3) se muestra solo lo que ya se vio en la cancha */
 const con2D=!!(window.MC2D&&(MC2D.tiene?MC2D.tiene(m):true));
 const CUT=window.MC2D?MC2D.corte(m):(m.events||[]).length,SC0=window.MC2D?MC2D.marcador(m):[m.h,m.a],SC=own?SC0:[SC0[1],SC0[0]];
 const le=lastEv({events:(m.events||[]).slice(0,CUT)});let leH='';if(le){const g=isGoal(le.title);const team=/LOCAL/i.test(le.title)?LN:/VISIT/i.test(le.title)?VN:'';
  leH=`<div class="le">${evIcon(le.title)}<b>${esc(le.lbl!=null?le.lbl+"'":'')}</b><strong>${g&&team?'¡GOL DE '+esc(team.toUpperCase())+'!':esc(clean(le.title))}</strong></div><p class="lm">${esc(evTxt(le))}</p>`}
 const prog=Math.max(0,Math.min(100,(mv?parseInt(mv,10):m.done?90:(m.minute||0))/90*100));
 const running=!m.done&&(m.phase==='first'||m.phase==='second');let paused=false;try{paused=matchPaused}catch(e){}
 let sp=2;try{sp=matchSpeed}catch(e){}
 const act=m.done?['mcMainAction()',(($('matchAction')||{}).textContent||'SIGUIENTE FECHA').replace(/→/,'').trim()]:m.phase==='pre'?[window.mcVerPartido?'mcVerPartido()':'mcMainAction()','COMENZAR PARTIDO']:m.phase==='ht'?['mcMainAction()','JUGAR EL 2º TIEMPO']:['mcSimEnd()','SIMULAR HASTA<br>EL FINAL'];
 const ST0=[['Posesión',Math.round(m.pos||50),100-Math.round(m.pos||50),'%'],['Tiros',m.shotsH,m.shotsA],['Tiros al arco',m.onH,m.onA],['Goles esperados (xG)',(m.xgH||0).toFixed(1),(m.xgA||0).toFixed(1)],['Saques de esquina',m.cornersH,m.cornersA]],ST=own?ST0:ST0.map(r=>[r[0],r[2],r[1],r[3]]);
 const stH=ST.map(r=>{const p=r[3]?r[1]:pct(r[1],r[2]);return `<div class="sr"><b>${r[1]}${r[3]||''}</b><div><span>${r[0]}</span><div class="sb"><i style="width:${p}%"></i></div></div><b>${r[2]}${r[3]||''}</b></div>`}).join('');
 const E=(m.events||[]).slice(0,CUT).reverse();const key=E.filter(e=>/GOL|TARJETA|AMARILLA|ROJA|ARCO|CAMBIO|LESI|OCASI/i.test(e.title||''));
 const evRow=(e,i)=>`<div class="er${i===0&&/GOL/i.test(e.title)?' hl':''}"><b>${esc(e.lbl!=null?e.lbl+"'":'')}</b>${evIcon(e.title)}<span><strong>${esc(clean(e.title))}</strong> · ${esc(evTxt(e))}</span></div>`;
 const evP=`<div class="pn ev"><h4>EVENTOS DEL PARTIDO</h4>${(key.length?key:E).slice(0,4).map(evRow).join('')||'<p class="em">Todavía no hubo eventos.</p>'}</div>`;
 let body='';
 if(MT==='stats')body=`<div class="g2"><div class="pn st">${stH}</div>${evP}</div>`;
 else if(MT==='form'){const L=(t,f,l)=>`<div class="pn fm"><h4>${esc(t)} · ${esc(f)}</h4>${l.map(p=>`<div class="fr"><b>${p.n||''}</b><span>${esc(nm(p.name))}</span><em>${esc(p.g||'')}</em></div>`).join('')}</div>`;body=`<div class="g2">${L(LN,fH,R.H)}${L(VN,fA,R.A)}</div>`}
 else if(MT==='tac')body=`<div class="g2"><div class="pn fm"><h4>TU PLANTEO</h4><div class="fr"><span>Formación</span><em>${esc(c.formation||'—')}</em></div><div class="fr"><span>Estilo</span><em>${esc(c.style||'—')}</em></div>${[['Mentalidad','mentality'],['Presión','pressing'],['Ritmo','rhythm'],['Anchura','width'],['Profundidad','depth']].map(x=>`<div class="fr"><span>${x[0]}</span><em>${c[x[1]]!=null?c[x[1]]:'—'}</em></div>`).join('')}</div>
  <div class="pn fm"><h4>DECISIONES</h4><p class="em" style="text-align:left">Cambios realizados: <b>${m.subsOwn||0}/5</b></p><button class="gb sm" onclick="openMatchSubs()">${sv('swap','bi')}HACER CAMBIOS</button><button class="gh" onclick="go('tactics')">${sv('sliders','bi')}CAMBIAR TÁCTICA</button><p class="em" style="text-align:left">Rival: ${esc(m.tacR?m.tacR.formation+' · '+m.tacR.style:'—')}</p></div></div>`;
 else body=`<div class="pn ev all"><h4>TODOS LOS EVENTOS</h4>${E.map(evRow).join('')||'<p class="em">Todavía no hubo eventos.</p>'}</div>`;
 box.innerHTML=`<div class="w">
 <div class="top"><div class="sbg"></div>${LOGO}
  <div class="cp">${sv('trophy','ci')}${esc(comp)}</div>
  <div class="sb2"><div class="cr l">${badge(LN,96)}</div><div class="np l"><b>${esc(LN)}</b><span>${esc(fH)} ${esc(sH)}</span></div>
   <div class="cl"><b class="mn">${esc(mn)}</b><small>${esc(ph)}</small><strong>${SC[0]} - ${SC[1]}</strong></div>
   <div class="np r"><b>${esc(VN)}</b><span>${esc(fA)} ${esc(sA)}</span></div><div class="cr r">${badge(VN,96)}</div></div>
  ${con2D?'<div class="pt pt2d" id="m2dHost"></div>':`<div class="pt">${pitchSVG(m,fH,fA,R,hot)}</div>`}
  ${leH?`<div class="lev">${leH}</div>`:''}</div>
 <div class="ctl"><button class="pz" onclick="${running?'toggleMatchPause()':act[0]}" title="${running&&!paused?'Pausar':'Jugar'}">${sv(running&&!paused?'pause':'play')}</button>
  <div class="spd"><button class="${sp===1?'on':''}" onclick="mcSpeed(1,this)">x1</button><button class="${sp===2?'on':''}" onclick="mcSpeed(2,this)">x2</button><button class="${sp===4?'on':''}" onclick="mcSpeed(4,this)">x4</button></div>
  <div class="pg"><div class="tr"><i style="width:${prog}%"></i><span class="bl" style="left:${prog}%">${sv('ball','bs')}</span></div><div class="lb"><span>1ºT</span><span>2ºT</span></div></div>
  <button class="sim" onclick="${act[0]}">${esc(act[1]).replace(/&lt;br&gt;/g,'<br>')} <em>»</em></button></div>
 <div class="tbs">${[['stats','bars','ESTADÍSTICAS'],['form','form','FORMACIONES'],['tac','clip','TÁCTICAS'],['ev','list','EVENTOS']].map(t=>`<button class="${MT===t[0]?'on':''}" onclick="MC12.mTab('${t[0]}')">${sv(t[1],'ti')}${t[2]}</button>`).join('')}</div>
 ${body}</div>`;
 if(con2D){const h2=$('m2dHost');if(h2)MC2D.montar(h2,m)}}
M.mTab=t=>{MT=t;matchBuild()};

/* =====================================================================
   3) NEGOCIACIONES Y CONTRATOS
   ===================================================================== */
const NG={tab:'fichajes',id:null,fee:null,wage:null,years:3,type:'def'};
const skey=()=>{const c=C();return 'mc12_seguimiento_'+(c?(c.saveName||c.club||'x'):'x')};
const segGet=()=>{try{return JSON.parse(localStorage.getItem(skey())||'[]')}catch(e){return[]}};
const segSet=a=>{try{localStorage.setItem(skey(),JSON.stringify(a.slice(0,30)))}catch(e){}};
const findP=id=>{try{const d=mcDB();return d.byId.get(id)||(C().mkt.extra||[]).find(x=>x.id===id)||null}catch(e){return null}};
let SUG=null,SUGK='';
function suggestions(){const c=C();const k=c.club+'|'+c.budget+'|'+c.players.length+'|'+Object.keys((c.mkt&&c.mkt.gone)||{}).length;if(SUG&&SUGK===k)return SUG;
 const sq=new Set(c.players.map(p=>p.name)),gone=(c.mkt&&c.mkt.gone)||{};let L=[];try{L=mcDB().list}catch(e){}
 SUG=L.filter(p=>p.club!==c.club&&!gone[p.id]&&!sq.has(p.name)&&p.value<=c.budget&&p.value>0).sort((a,b)=>b.rating-a.rating||a.value-b.value).slice(0,5);SUGK=k;return SUG}
function targets(){const c=C(),sq=new Set(c.players.map(p=>p.name));const seg=segGet().map(findP).filter(p=>p&&!sq.has(p.name));return{seg,list:seg.length?seg.slice(0,5):suggestions(),fromSeg:seg.length>0}}
function chance(p,fee,wage){if(window.MCE5&&MCE5.chance)return MCE5.chance(p,fee,wage);/* 12.9: reglas de la Etapa 5 */const c=C();const fr=fee/Math.max(.5,p.value),wr=wage/Math.max(.1,p.wage);
 const ch=Math.max(.04,Math.min(.96,.24+Math.max(0,fr-.8)*.45+Math.max(0,wr-.8)*.24+(c.board-50)/300-(p.age<21?.03:0)-(p.rating>=88?.12:0)));
 return{ch,club:Math.max(0,Math.min(1,(fr-.8)/.5)),pl:Math.max(0,Math.min(1,(wr-.8)/.6+(c.board-50)/200))}}
const sh=n=>{n=String(nm(n)||'').trim().split(/\s+/);return n.length>1?n[0][0]+'. '+n.slice(1).join(' '):n[0]};
const fmt=v=>'$'+(Math.round(v*10)/10).toLocaleString('es-AR',{minimumFractionDigits:1,maximumFractionDigits:1})+'M';
function negosEnsure(){if($('negos'))return;const s=document.createElement('section');s.id='negos';s.className='page';s.innerHTML='<div id="m12N"></div>';document.querySelector('main').insertBefore(s,$('more')||null)}
function negoHeader(c,active){const T=[['Resumen','bars',"go('dashboard')"],['Plantel','shirt',"go('squad')"],['Tácticas','sliders',"go('tactics')"],['Negociaciones','hand',"MC12.nego()"],['Fichajes','swap',"setMarketTab('buy');go('market')"],['Contratos','doc',"MC12.negoTab('renov')"]];
 return `<div class="hdr"><button class="bk" onclick="go('dashboard')" title="Volver">${sv('back')}</button><div class="clb">${badge(c.club,40)}<div><b>${esc(c.club)}</b><small>Mi Carrera</small></div></div>${LOGO}<button class="sea" onclick="MC12.leagueTab('table')">Temporada ${c.season}-${String(c.season+1).slice(-2)} ${sv('chev')}</button></div>
 <div class="tt">${T.map(t=>`<button class="${t[0]===active?'on':''}" onclick="${t[2]}">${sv(t[1],'ti')}${t[0]}</button>`).join('')}</div>`}
function negoRender(){negosEnsure();const c=C(),box=$('m12N');if(!c||!box)return;
 const ST=[['fichajes','down','Fichajes'],['renov','doc','Renovaciones'],['ventas','up','Ventas'],['cedidos','swap','Cedidos'],['seg','bino','Seguimiento']];
 let main='';
 if(NG.tab==='fichajes')main=negoFichajes(c);
 else if(NG.tab==='renov'){const P=c.players.map((p,i)=>({p,i})).sort((a,b)=>(a.p.contract||0)-(b.p.contract||0)||b.p.rating-a.p.rating);
  main=`<div class="pn lst"><div class="ph">${sv('doc','hi')}<b>Renovaciones y contratos</b><small>${P.length} JUGADORES</small></div>${P.map(({p,i})=>{const y=p.contract||0;return `<div class="li2">${av(p,46)}<div><b>${esc(nm(p.name))}</b><span>${p.pos} · ${p.age} años · GRL ${p.rating} · ${money(+p.wage||0)}/año · contrato hasta Jun ${c.season+y}</span></div><span class="yr ${y<=1?'lo':y===2?'md':''}">${y} ${y===1?'año':'años'}</span><button class="gb sm" onclick="renewPlayer(${i})">Renovar</button></div>`}).join('')}</div>`}
 else if(NG.tab==='ventas'){const L=c.players.map((p,i)=>({p,i})).sort((a,b)=>(b.p.transferListed?1:0)-(a.p.transferListed?1:0)||b.p.value-a.p.value);const pend=(c.marketDeals||[]).filter(d=>d.status==='PENDIENTE');
  main=`<div class="pn lst"><div class="ph">${sv('up','hi')}<b>Ventas</b><small>${c.players.filter(p=>p.transferListed).length} TRANSFERIBLES</small></div><button class="gb" onclick="generateClubBid()">CONSULTAR OFERTAS DE CLUBES</button>${pend.length?`<p class="em" style="text-align:left">Ofertas pendientes: ${pend.map(d=>esc(nm(d.player))+' ('+esc(d.detail)+')').join(' · ')}</p>`:''}${L.map(({p,i})=>`<div class="li2">${av(p,46)}<div><b>${esc(nm(p.name))}</b><span>${p.pos} · ${p.age} años · GRL ${p.rating} · valor ${money(p.value)}</span></div><span class="yr ${p.transferListed?'md':''}">${p.transferListed?'EN VENTA':'NO'}</span><button class="${p.transferListed?'gh':'gb'} sm" onclick="toggleTransferListing(${i});MC12.negoRender()">${p.transferListed?'Quitar':'Publicar'}</button></div>`).join('')}</div>`}
 else if(NG.tab==='cedidos'){const D=(c.marketDeals||[]).filter(d=>/Pr.stamo|Cesi/i.test(d.kind||'')).slice().reverse();const inn=c.players.filter(p=>p.loan||p.onLoan||p.loanFrom);
  main=`<div class="pn lst"><div class="ph">${sv('swap','hi')}<b>Cedidos y préstamos</b></div>${inn.map(p=>`<div class="li2">${av(p,46)}<div><b>${esc(nm(p.name))}</b><span>${p.pos} · GRL ${p.rating} · a préstamo${p.loanFrom?' desde '+esc(p.loanFrom):''}</span></div></div>`).join('')}${D.map(d=>`<div class="li2"><span class="ic">${sv('swap')}</span><div><b>${esc(nm(d.player))}</b><span>${esc(d.kind)} · ${esc(d.detail)}</span></div><span class="yr ${/ACEPT/.test(d.status)?'':/RECHAZ/.test(d.status)?'lo':'md'}">${esc(d.status)}</span></div>`).join('')||(inn.length?'':'<p class="em">Todavía no hay préstamos. Podés pedir uno desde el mercado, con el botón de préstamo de cada jugador, o eligiendo "Préstamo" en Realizar oferta.</p>')}</div>`}
 else{const t=targets();main=`<div class="pn lst"><div class="ph">${sv('bino','hi')}<b>Seguimiento</b><small>${t.seg.length} JUGADORES</small></div>${t.seg.length?t.seg.map(p=>`<div class="li2">${av(p,46)}<div><b>${esc(nm(p.name))}</b><span>${p.pos} · ${p.age} años · ${esc(p.club)} · valor ${money(p.value)}</span></div>${M.grl(p.rating)}<button class="gb sm" onclick="MC12.nego(${M.q(p.id)})">Negociar</button><button class="gh sm" onclick="MC12.seg(${M.q(p.id)})">Quitar</button></div>`).join(''):'<p class="em">No seguís a ningún jugador. Abrí una negociación y tocá la estrella para agregarlo.</p>'}</div>`}
 box.innerHTML=`<div class="w">${negoHeader(c,'Negociaciones')}
 <div class="ban"><span class="hb">${sv('hand')}</span><div><h1>Negociaciones y Contratos</h1><p>Gestiona fichajes, renovaciones y ventas de jugadores.</p></div><span class="bc">${badge(c.club,64)}</span></div>
 <div class="st">${ST.map(t=>`<button class="${NG.tab===t[0]?'on':''}" onclick="MC12.negoTab('${t[0]}')">${sv(t[1],'ti')}${t[2]}</button>`).join('')}</div>
 ${main}</div>`;
 negoLive()}
function negoFichajes(c){const t=targets();if(!NG.id||!findP(NG.id)||c.players.some(p=>p.name===(findP(NG.id)||{}).name))NG.id=t.list[0]?t.list[0].id:null;const p=NG.id?findP(NG.id):null;
 const lst=`<div class="pn ob"><div class="ph">${sv('target','hi')}<b>${t.fromSeg?'Objetivos de Fichaje':'Sugeridos por tus ojeadores'} (${t.list.length})</b></div>${t.list.map(x=>`<button class="oi${p&&x.id===p.id?' on':''}" onclick="MC12.nego(${M.q(x.id)})">${av(x)}<div><b>${esc(sh(x.name))}</b><span>${x.pos}</span></div>${badge(x.club,30)}<span class="gr"><small>GRL</small><b>${x.rating}</b></span></button>`).join('')||'<p class="em">No hay jugadores al alcance de tu presupuesto.</p>'}</div>`;
 if(!p)return `<div class="ng">${lst}<div></div></div>`;
 if(NG.fee==null||NG.pid!==p.id){NG.pid=p.id;NG.fee=Math.max(.5,Math.round(p.value*1.12*2)/2);NG.wage=p.wage;NG.years=3;NG.type='def'}
 const deal=(c.marketDeals||[]).filter(d=>d.player===p.name&&/Fichaje|Pr.stamo/i.test(d.kind||'')).slice(-1)[0];
 let step=1,bad=false;if(deal){if(/ACEPT/.test(deal.status))step=5;else if(/RECHAZ/.test(deal.status)){step=1;bad=true}else step=2}
 const STEPS=['Contacto','Oferta','Negociación','Acuerdo','Oficial'];
 const stepper=`<div class="pn es"><div class="ph">${sv('bars','hi')}<b>Estado de la Negociación</b></div><div class="sp">${STEPS.map((s,i)=>`<div class="sx ${i<step||step===5?'ok':i===step?(bad?'ko':'cu'):''}"><i>${i<step||step===5?'✓':i===step&&bad?'✕':''}</i><span>${s}</span></div>`).join('')}</div>${deal?`<p class="em dl ${bad?'ko':''}">${esc(deal.status)} · ${esc(deal.detail)}</p>`:''}</div>`;
 const segd=segGet().includes(p.id);const nmP=String(nm(p.name)).trim().split(/\s+/);const fn=nmP.length>1?nmP[0]:'',ln=nmP.length>1?nmP.slice(1).join(' '):nmP[0];
 const sit=p.free?'Libre':p.listed?'Transferible':'Negociable';
 const card=`<div class="pn pc"><button class="sg${segd?' on':''}" onclick="MC12.seg(${M.q(p.id)})" title="${segd?'Dejar de seguir':'Seguir'}">${sv('star')}</button><div class="pt2"><span class="ccr">${badge(p.club,72)}</span>${av(p,null,'nb')}</div>
  <div class="pi"><h2><span>${esc(fn)}</span>${esc(ln)}</h2><div class="nat">${flag(p.nat)} ${esc(p.nat&&p.nat!=='—'?p.nat:'')}</div><div class="ag">${p.age} años · ${esc(p.club)}</div><div class="ps">${esc(p.pos)}</div></div>
  <div class="gq"><div class="gbx"><small>GRL</small><b>${p.rating}</b></div><small class="pl">Potencial</small><div class="pbx">${p.potential}</div></div>
  <div class="k4"><div><small>Valor de mercado</small><b>${money(p.value)}</b></div><div><small>Contrato hasta</small><b>${p.contract?'Jun '+(c.season+(+p.contract)):'—'}</b></div><div><small>Salario actual</small><b>${money(p.wage)}</b></div><div><small>Situación</small><b class="gn">${sit}</b></div></div></div>`;
 const pm=(id,v)=>`<div class="pmx"><button onclick="MC12.nAdj('${id}',-1)">−</button><input id="m12n_${id}" type="text" inputmode="decimal" value="${fmt(v)}" onchange="MC12.nSet('${id}',this.value)"><button onclick="MC12.nAdj('${id}',1)">+</button></div>`;
 const form=`<div class="pn of"><div class="ph">${sv('hand','hi')}<b>Realizar Oferta</b></div><div class="fc"><div><label>Tipo de oferta</label><div class="sel"><select onchange="MC12.nType(this.value)"><option value="def"${NG.type==='def'?' selected':''}>Transferencia definitiva</option><option value="loan"${NG.type==='loan'?' selected':''}>Préstamo</option></select>${sv('chev')}</div>
   ${NG.type==='def'?`<label>Monto de la oferta</label>${pm('fee',NG.fee)}<p class="hint">Presupuesto disponible: $${esc(c.budget)}M</p>`:`<p class="hint">El préstamo tiene sus propias condiciones (cargo, porcentaje del salario y opción de compra).</p>`}</div>
  <div class="vr"></div><div><div class="sh">${sv('doc','hi')}<b>Contrato propuesto</b></div>${NG.type==='def'?`<div class="rw"><span>Duración</span><div class="sel"><select onchange="MC12.nYears(this.value)">${[2,3,4,5].map(y=>`<option value="${y}"${+NG.years===y?' selected':''}>${y} temporadas (${c.season+y})</option>`).join('')}</select>${sv('chev')}</div></div><div class="rw"><span>Salario anual</span>${pm('wage',NG.wage)}</div><p class="hint">Margen salarial: $${(c.wageBudget||Math.max(5,c.budget*.18)).toFixed(1)}M</p>`:''}</div></div>
  <button class="send" onclick="MC12.nSend()">${sv('send','bi')}${NG.type==='def'?'Enviar Oferta':'Armar propuesta de préstamo'}</button></div>`;
 const b3=`<div class="b3"><div class="pn ib">${sv('user','hi')}<b>Interés del Jugador</b><div class="bw"><div class="br"><i id="m12nPl" class="g"></i></div><em id="m12nPlT"></em></div></div><div class="pn ib">${badge(p.club,26)}<b>Interés del Club (${esc(p.club)})</b><div class="bw"><div class="br"><i id="m12nCl" class="y"></i></div><em id="m12nClT"></em></div></div><div class="pn ib">${sv('target','hi')}<b>Probabilidad de acuerdo</b><div class="bw"><div class="br"><i id="m12nCh" class="b"></i></div><em id="m12nChT"></em></div></div></div>`;
 return `<div class="ng"><div class="cl1">${lst}${stepper}</div><div class="cl2">${card}${form}</div></div>${b3}`}
function negoLive(){const p=NG.id&&findP(NG.id);if(!p||NG.tab!=='fichajes'||!$('m12nCh'))return;const r=chance(p,NG.type==='def'?NG.fee:p.value,NG.wage);
 [['m12nPl',r.pl],['m12nCl',r.club],['m12nCh',r.ch]].forEach(x=>{const e=$(x[0]);if(e){e.style.width=Math.round(x[1]*100)+'%';$(x[0]+'T').textContent=Math.round(x[1]*100)+'%'}})}
function parseM(v){v=String(v).replace(/[^0-9.,]/g,'');if(v.indexOf(',')>=0)v=v.replace(/\./g,'').replace(',','.');return parseFloat(v)}
M.nego=function(id){if(!C()){go('newcareer');return}if(id){NG.id=id;NG.fee=null;NG.tab='fichajes'}negosEnsure();negoRender();go('negos');window.scrollTo(0,0)};
M.negoTab=function(t){if(!C()){go('newcareer');return}NG.tab=t;negosEnsure();negoRender();go('negos')};
M.negoRender=negoRender;
M.seg=function(id){const a=segGet();const i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.unshift(id);segSet(a);negoRender()};
M.nAdj=function(k,d){const st=k==='fee'?.5:.1;NG[k]=Math.max(k==='fee'?0:.1,Math.round((NG[k]+d*st)*10)/10);const e=$('m12n_'+k);if(e)e.value=fmt(NG[k]);negoLive()};
M.nSet=function(k,v){const n=parseM(v);if(isFinite(n)&&n>=0)NG[k]=Math.round(n*10)/10;const e=$('m12n_'+k);if(e)e.value=fmt(NG[k]);negoLive()};
M.nYears=v=>{NG.years=+v};M.nType=v=>{NG.type=v;negoRender()};
M.nSend=function(){const p=NG.id&&findP(NG.id);if(!p)return;
 if(NG.type==='loan'){try{mc10Loan(p.id)}catch(e){warn('préstamo',e)}return}
 const box=document.createElement('div');box.style.display='none';box.innerHTML=`<input id="transferFee" value="${NG.fee}"><input id="transferWage" value="${NG.wage}"><select id="transferYears"><option value="${NG.years}" selected>${NG.years}</option></select>`;
 document.body.insertBefore(box,document.body.firstChild);try{submitTransferOffer(p.id)}finally{box.remove()}
 if(document.querySelector('#negos.active'))negoRender()};

/* ---------- arranque ---------- */
function boot3(){try{
 negosEnsure();
 after('renderDashboard',clubBuild);after('renderMatch',matchBuild);
 const oTO=window.openTransferOffer;if(typeof oTO==='function')window.openTransferOffer=function(id){M.nego(id)};
 after('go',()=>{const id=(document.querySelector('.page.active')||{}).id;if(id==='dashboard')clubBuild();else if(id==='match')matchBuild();else if(id==='negos')negoRender()});
 after('renderMarket',()=>{const t=$('mTabs');if(t&&!t.querySelector('[data-m12n]')){t.insertAdjacentHTML('beforeend',`<button data-m12n="1" onclick="MC12.nego()">${sv('hand','ti')}Negociaciones</button>`)}});
 if(C()){clubBuild()}
}catch(e){warn('tres pantallas',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot3);else setTimeout(boot3,0);
})();

/* ===== MC12.1 · Mercado de fichajes, Tabla de liga y Calendario según las referencias (solo presentación) =====
   Búsqueda sobre la base real (mcDB) con las mismas exclusiones que usa el mercado; tabla y calendario desde career.league
   y las copas del Mundo. Acciones: MC12.nego (negociación real), leagueTab, openMatch, mc10World. */
(function(){
'use strict';
const M=window.MC12;if(!M)return;
const {$,esc,C,nm,money,flag,badge,icons,warn,after,lgName,av}=M;
const SV={
 search:'<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
 star:'<path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.5L12 17.2l-5.8 3.2 1.4-6.5-4.9-4.4 6.5-.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
 doc:'<path d="M5 2h10l5 5v15H5z" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M8 11h8M8 15h8M8 7h4" stroke="currentColor" stroke-width="1.9"/>',
 hand:'<path d="M1 11l5-5 4 2 3-2 3 1 3-2 4 5-3 3-1-1-5 5a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
 handf:'<path d="M1 11l5-5 4 2 3-2 3 1 3-2 4 5-3 3-1-1-5 5a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2l-1 1a1.5 1.5 0 01-2-2z"/>',
 swap:'<path d="M16 3l5 4.5-5 4.5V9H4V6h12zM8 12v3h12v3H8v3l-5-4.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
 swapf:'<path d="M16 3l5 4.5-5 4.5V9H4V6h12zM8 12v3h12v3H8v3l-5-4.5z"/>',
 hist:'<path d="M3 12a9 9 0 103-6.7M3 4v4h4M12 7v5l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 filter:'<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
 back:'<path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 chev:'<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 left:'<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 right:'<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 coin:'<circle cx="12" cy="12" r="10" fill="#f0c24e"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="#a87410" stroke-width="1.4"/><text x="12" y="16.4" text-anchor="middle" font-size="12" font-weight="900" fill="#5a3a00" font-family="Arial">$</text>',
 home:'<path d="M3 11l9-7 9 7M6 9.5V20h12V9.5M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 list:'<path d="M4 6h2M4 12h2M4 18h2M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 cal:'<path d="M4 5h16v16H4zM4 9.5h16M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 12.5h2v2H7zM11 12.5h2v2h-2zM15 12.5h2v2h-2zM7 16.5h2v2H7zM11 16.5h2v2h-2z"/>',
 res:'<path d="M4 3h16v18H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 7h2v2H7zM11 7h6v2h-6zM7 11h2v2H7zM11 11h6v2h-6zM7 15h2v2H7zM11 15h6v2h-6z"/>',
 bars:'<path d="M3 14h4v7H3zM10 9h4v12h-4zM17 4h4v17h-4z"/>',
 trophy:'<path d="M6 3h12v2h3v3a5 5 0 01-4.6 5A6 6 0 0113 16.9V19h3v2H8v-2h3v-2.1A6 6 0 017.6 13 5 5 0 013 8V5h3zM5 7v1a3 3 0 002.1 2.9A9 9 0 016 7zm14 0h-1a9 9 0 01-1.1 3.9A3 3 0 0019 8z"/>',
 trophyo:'<path d="M7 3h10v6a5 5 0 01-10 0zM7 5H4v2a3 3 0 003 3M17 5h3v2a3 3 0 01-3 3M12 14v4M8 21h8M9 18h6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
 clock:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 stadium:'<path d="M2 9c0-2.5 4.5-4 10-4s10 1.5 10 4v6c0 2.5-4.5 4-10 4S2 17.5 2 15zm2 0c0 1.2 3.5 2.6 8 2.6S20 10.2 20 9s-3.5-2.6-8-2.6S4 7.8 4 9z"/>',
 plane:'<path d="M2 15l20-7-3 5-6 1-4 6-1-5z"/>',
 tactic:'<circle cx="6" cy="6" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 4l5 5M20 4l-5 5M5 15l4 4M9 15l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 8c4 2 6 5 7 9M15 17l1-3 2 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
};
const sv=(k,c)=>`<svg class="${c||'si'}" viewBox="0 0 24 24" aria-hidden="true">${SV[k]||''}</svg>`;
const CROWN='<svg viewBox="0 0 40 24"><path d="M2 8l8 7 10-13 10 13 8-7-3 14H5z" fill="currentColor"/><circle cx="20" cy="2.5" r="2.2" fill="currentColor"/><circle cx="2.5" cy="7.5" r="1.9" fill="currentColor"/><circle cx="37.5" cy="7.5" r="1.9" fill="currentColor"/></svg>';
const LOGO=`<a class="m12-lg2" onclick="go('home')"><span class="cr">${CROWN}</span><b>MODO</b><b>CARRERA</b></a>`;
const sh=n=>{n=String(nm(n)||'').trim().split(/\s+/);return n.length>1?n[0][0]+'. '+n.slice(1).join(' '):n[0]};
const fullM=v=>'$'+Math.round((+v||0)*1e6).toLocaleString('es-AR');
function keep(el,host,id){if(!el||!host)return;let k=$(id);if(!k){k=document.createElement('div');k.id=id;k.style.display='none';host.appendChild(k)}if(el.parentNode!==k)k.appendChild(el)}
const segKey=()=>{const c=C();return 'mc12_seguimiento_'+(c?(c.saveName||c.club||'x'):'x')};
const segGet=()=>{try{return JSON.parse(localStorage.getItem(segKey())||'[]')}catch(e){return[]}};

/* =====================================================================
   1) MERCADO DE FICHAJES
   ===================================================================== */
const F={name:'',pos:'',lg:'',a0:16,a1:40,g0:40,g1:99,val:'',tl:false,free:false,sort:'value',n:40,sel:null};
let RES=null;
function pool(){const c=C();let L=[];try{L=mcDB().list}catch(e){}const sq=new Set(c.players.map(p=>p.name)),gone=(c.mkt&&c.mkt.gone)||{};
 return L.filter(p=>p.club!==c.club&&!gone[p.id]&&!sq.has(p.name)).concat((c.mkt&&c.mkt.extra)||[])}
function fold(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function search(){const q=fold(F.name).trim(),VM={'1':[0,1],'5':[0,5],'20':[0,20],'50':[0,50],'51':[50,1e9]}[F.val];
 RES=pool().filter(p=>(!q||fold(p.name).includes(q)||fold(p.club).includes(q))&&(!F.pos||p.pos===F.pos)&&(!F.lg||p.league===F.lg)&&p.age>=F.a0&&p.age<=F.a1&&p.rating>=F.g0&&p.rating<=F.g1&&(!VM||(p.value>=VM[0]&&p.value<=VM[1]))&&(!F.tl||p.listed)&&(!F.free||p.free));
 const S={value:(a,b)=>b.value-a.value||b.rating-a.rating,rating:(a,b)=>b.rating-a.rating||b.value-a.value,age:(a,b)=>a.age-b.age||b.rating-a.rating,pot:(a,b)=>(b.potential||0)-(a.potential||0)||b.rating-a.rating}[F.sort];RES.sort(S);
 if(!F.sel||!RES.some(p=>p.id===F.sel))F.sel=RES[0]?RES[0].id:null}
const opt=(v,t,cur)=>`<option value="${esc(v)}"${String(cur)===String(v)?' selected':''}>${esc(t)}</option>`;
let LEAGS=null;function leagues(){if(LEAGS)return LEAGS;let L=[];try{L=mcDB().list}catch(e){}LEAGS=[...new Set(L.map(p=>p.league).filter(Boolean))].sort((a,b)=>String(lgName(a)).localeCompare(String(lgName(b)),'es'));return LEAGS}
function mktHeader(c,active){const pend=(c.marketDeals||[]).filter(d=>d.status==='PENDIENTE').length;const wage=c.players.reduce((a,p)=>a+(+p.wage||0),0);
 const T=[['buy','search','Buscar Jugadores',"MC12.mk('buy')"],['seg','star','Mis Objetivos',"MC12.negoTab('seg')"],['deals','doc','Ofertas',"MC12.mk('deals')",pend],['nego','hand','Negociaciones',"MC12.nego()"],['sell','swap','Ventas',"MC12.mk('sell')"],['hist','hist','Historial',"MC12.mk('hist')"]];
 return `<div class="hdr"><button class="bk" onclick="go('dashboard')" title="Volver">${sv('back')}</button><div class="clb">${badge(c.club,44)}<div><small>Mi Carrera</small><b>${esc(c.club)}</b></div></div>${LOGO}
  <div class="bud"><div class="bp">${sv('coin','co')}<b>${fullM(c.budget)}</b><button onclick="go('board')" title="Finanzas">+</button></div><small>Presupuesto de fichajes</small><div class="ms">Masa salarial: <b>${money(wage)}</b> / año</div></div></div>
 <div class="ban">${sv('swapf','hb')}<div><h1>Mercado de Fichajes</h1><p>Compra, vende y negocia jugadores para tu proyecto.</p></div></div>
 <div class="tt">${T.map(t=>`<button class="${t[0]===active?'on':''}" onclick="${t[2]==='search'?'':''}${t[3]}">${sv(t[1],'ti')}${t[2]}${t[4]?`<em>${t[4]}</em>`:''}</button>`).join('')}</div>`}
function mktBuild(){if(M.mkt2)return M.mkt2();const c=C(),s=$('market');if(!c||!s)return;let box=$('m12K');
 if(!box){box=document.createElement('div');box.id='m12K';box.className='m12x';s.insertBefore(box,s.firstChild)}
 keep($('mBody'),s,'m12KKeep');
 let T='buy';try{T=marketTab}catch(e){}
 if(T!=='buy'){const tab={deals:'deals',sell:'sell',hist:'hist',contracts:'contracts',loans:'loans'}[T]||T;
  box.innerHTML=`<div class="w">${mktHeader(c,tab)}<div id="m12KOther"></div></div>`;const mb=$('mBody');if(mb){$('m12KOther').appendChild(mb);mb.style.display=''}icons(box);return}
 if(!RES)search();const p=RES.find(x=>x.id===F.sel);const segd=p&&segGet().includes(p.id);
 const rows=RES.slice(0,F.n).map(x=>`<button class="rw${p&&x.id===p.id?' on':''}" onclick="MC12.mkSel(${M.q(x.id)})">${av(x)}${badge(x.club,26)}<b>${esc(sh(x.name))}</b><span>${x.age}</span><span>${x.pos}</span><span class="g ${M.tier(x.rating)}">${x.rating}</span><span class="v">${money(x.value)}</span></button>`).join('');
 const nmP=p?String(nm(p.name)).trim().split(/\s+/):[];
 const det=p?`<div class="pn dt"><div class="ph2"><div class="fo">${av(p,null,'nb')}</div><div class="nf"><h2><span>${esc(nmP.length>1?nmP[0]:'')}</span>${esc(nmP.length>1?nmP.slice(1).join(' '):nmP[0])}</h2><div class="nat">${flag(p.nat)} ${esc(p.nat&&p.nat!=='—'?p.nat:'')}</div><div class="ag">${p.age} años</div><div class="ps">${esc(p.pos)} · ${esc(p.club)}</div></div><span class="gb2 ${M.tier(p.rating)}"><small>GRL</small><b>${p.rating}</b></span></div>
  <div class="k2"><div><small>Valor de mercado</small><b>${money(p.value)}</b></div><div><small>Contrato hasta</small><b>${p.contract?'Jun '+(c.season+(+p.contract)):'—'}</b></div></div>
  <div class="at"><h4>Datos del jugador</h4>${[['Potencial',p.potential||p.rating,99],['GRL',p.rating,99],['Edad',p.age,40]].map(a=>`<div class="ar"><span>${a[0]}</span><div class="br"><i style="width:${Math.min(100,Math.round(a[1]/a[2]*100))}%"></i></div><b>${a[1]}</b></div>`).join('')}<div class="ar t"><span>Salario pedido</span><b>${money(p.wage)}/año</b></div><div class="ar t"><span>Liga</span><b>${esc(lgName(p.league)||'—')}</b></div></div>
  <button class="ng" onclick="MC12.nego(${M.q(p.id)})">${sv('handf','bi')}Negociar Fichaje</button><button class="ad${segd?' on':''}" onclick="MC12.mkSeg(${M.q(p.id)})">${sv('star','bi')}${segd?'En tus objetivos':'Añadir a Objetivos'}</button></div>`:`<div class="pn dt"><p class="em">Elegí un jugador de la lista.</p></div>`;
 box.innerHTML=`<div class="w">${mktHeader(c,'buy')}
 <div class="g3"><div class="pn fl"><details open><summary>${sv('filter','fi')}Filtros de Búsqueda</summary>
   <label>Nombre</label><div class="sr"><input id="m12kName" type="search" placeholder="Buscar jugador..." value="${esc(F.name)}" oninput="MC12.mkF('name',this.value,1)">${sv('search','si')}</div>
   <label>Posición</label><div class="sl"><select onchange="MC12.mkF('pos',this.value)">${opt('','Todas',F.pos)}${opt('POR','Arqueros',F.pos)}${opt('DEF','Defensores',F.pos)}${opt('MED','Mediocampistas',F.pos)}${opt('DEL','Delanteros',F.pos)}</select>${sv('chev')}</div>
   <label>Liga</label><div class="sl"><select onchange="MC12.mkF('lg',this.value)">${opt('','Todas las ligas',F.lg)}${leagues().map(l=>opt(l,lgName(l),F.lg)).join('')}</select>${sv('chev')}</div>
   <label>Edad</label><div class="rg"><div class="sl"><select onchange="MC12.mkF('a0',+this.value)">${Array.from({length:30},(_,i)=>opt(15+i,15+i,F.a0)).join('')}</select>${sv('chev')}</div><span>–</span><div class="sl"><select onchange="MC12.mkF('a1',+this.value)">${Array.from({length:30},(_,i)=>opt(16+i,16+i,F.a1)).join('')}</select>${sv('chev')}</div></div>
   <label>GRL</label><div class="rg"><div class="sl"><select onchange="MC12.mkF('g0',+this.value)">${Array.from({length:12},(_,i)=>opt(40+i*5,40+i*5,F.g0)).join('')}</select>${sv('chev')}</div><span>–</span><div class="sl"><select onchange="MC12.mkF('g1',+this.value)">${[50,60,65,70,75,80,85,90,95,99].map(v=>opt(v,v,F.g1)).join('')}</select>${sv('chev')}</div></div>
   <label>Valor de mercado</label><div class="sl"><select onchange="MC12.mkF('val',this.value)">${opt('','Cualquiera',F.val)}${opt('1','Hasta $1M',F.val)}${opt('5','Hasta $5M',F.val)}${opt('20','Hasta $20M',F.val)}${opt('50','Hasta $50M',F.val)}${opt('51','Más de $50M',F.val)}</select>${sv('chev')}</div>
   <label class="ck"><input type="checkbox" ${F.tl?'checked':''} onchange="MC12.mkF('tl',this.checked)">Solo transferibles</label>
   <label class="ck"><input type="checkbox" ${F.free?'checked':''} onchange="MC12.mkF('free',this.checked)">Agentes libres</label>
   <button class="bs" onclick="MC12.mkGo()">${sv('search','bi')}Buscar</button><button class="lk" onclick="MC12.mkReset()">Limpiar filtros</button></details></div>
  <div class="pn ls"><div class="lh"><b>Resultados: ${RES.length.toLocaleString('es-AR')} jugadores</b><div class="sl"><select onchange="MC12.mkF('sort',this.value)">${opt('value','Valor de mercado',F.sort)}${opt('rating','GRL',F.sort)}${opt('pot','Potencial',F.sort)}${opt('age','Más jóvenes',F.sort)}</select>${sv('chev')}</div></div>
   <div class="th"><span>Jugador</span><span>Edad</span><span>Pos.</span><span>GRL</span><span>Valor</span></div><div class="rs">${rows||'<p class="em">No hay jugadores con esos filtros.</p>'}</div>${RES.length>F.n?`<button class="mr" onclick="MC12.mkMore()">Mostrar más (${(RES.length-F.n).toLocaleString('es-AR')} restantes)</button>`:''}</div>
  ${det}</div></div>`;
 icons(box)}
let TM=null;
M.mk=function(t){try{setMarketTab(t)}catch(e){}go('market')};
M.mkF=function(k,v,deb){F[k]=v;F.n=40;clearTimeout(TM);const run=()=>{search();mktBuild();if(k==='name'){const e=$('m12kName');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length)}}};if(deb)TM=setTimeout(run,250);else run()};
M.mkGo=()=>{search();mktBuild()};M.mkMore=()=>{F.n+=40;mktBuild()};
M.mkReset=()=>{Object.assign(F,{name:'',pos:'',lg:'',a0:16,a1:40,g0:40,g1:99,val:'',tl:false,free:false,n:40});search();mktBuild()};
M.mkSel=id=>{F.sel=id;mktBuild();if(window.innerWidth<900){const d=document.querySelector('#m12K .dt');d&&d.scrollIntoView({behavior:'smooth',block:'start'})}};
M.mkSeg=id=>{const a=segGet();const i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.unshift(id);try{localStorage.setItem(segKey(),JSON.stringify(a.slice(0,30)))}catch(e){}mktBuild()};

/* =====================================================================
   2) LIGA: TABLA, RESULTADOS y CALENDARIO
   ===================================================================== */
const MES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIA=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],DIAL=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
function roundDate(c,r,cup){const d=new Date(c.season,7,1);while(d.getDay()!==0)d.setDate(d.getDate()+1);d.setDate(d.getDate()+7*r-(cup?4:0));return d}
const short=n=>{n=String(n||'');return n.length>14?n.split(' ').map((w,i)=>i?w[0]+'.':w).join(' '):n};
function events(){const c=C();if(!c)return[];const ev=[];const LN=lgName(c.country);
 M.userFixtures().forEach(f=>ev.push({d:roundDate(c,f.r,false),key:'liga',comp:LN,sub:'Fecha '+(f.r+1),opp:f.opp,home:f.home,played:f.played,gf:f.gf,ga:f.ga,res:f.res}));
 M.userComps().forEach(k=>{(k.stages||[]).forEach(st=>{const at=st.at||[];
  if(st.type==='ko'){(st.ties||[]).forEach(t=>{if(t.a!==c.club&&t.b!==c.club)return;if(!t.b)return;const n=st.legs||1;
   for(let di=0;di<n;di++){if(at[di]==null)continue;const lg=t.legs&&t.legs[di];const home=lg?lg[0]:(n===1?t.a:(di===0?t.b:t.a));const isH=home===c.club;const opp=t.a===c.club?t.b:t.a;
    const o={d:roundDate(c,at[di],true),key:k.id||k.name,comp:k.name,sub:st.name+(n>1?(di?' (vuelta)':' (ida)'):''),opp,home:isH,played:!!lg};if(lg){o.gf=isH?lg[2]:lg[3];o.ga=isH?lg[3]:lg[2];o.res=o.gf>o.ga?'W':o.gf<o.ga?'L':'D'}ev.push(o)}})}
  else (st.fx||[]).forEach(f=>{if(f.h!==c.club&&f.a!==c.club)return;if(at[f.md]==null)return;const isH=f.h===c.club,pl=f.gh!=null;
   const o={d:roundDate(c,at[f.md],true),key:k.id||k.name,comp:k.name,sub:st.name,opp:isH?f.a:f.h,home:isH,played:pl};if(pl){o.gf=isH?f.gh:f.ga;o.ga=isH?f.ga:f.gh;o.res=o.gf>o.ga?'W':o.gf<o.ga?'L':'D'}ev.push(o)})})});
 return ev.sort((a,b)=>a.d-b.d)}
const LS={res:false,round:null,mo:null,off:{}};
function lgView(){let v='table';try{v=leagueView}catch(e){}return LS.res&&v==='table'?'results':v}
M.lg=function(t){if(!C()){go('newcareer');return}LS.res=t==='results';if(t==='results')t='table';try{go('league');const el=[...document.querySelectorAll('#league .tabs button')].find(b=>(b.getAttribute('onclick')||'').includes("'"+t+"'"))||document.createElement('i');leagueTab(t,el)}catch(e){warn('lg',e)}};
M.leagueTab=M.lg;
function lgHeader(c,v){const LN=String(lgName(c.country)),sp=LN.split(' ');const a=sp.length>2?sp.slice(0,-1).join(' '):LN,b=sp.length>2?sp[sp.length-1]:'';
 const T=[['dash','home','Resumen',"go('dashboard')"],['table','list','Tabla de Liga',"MC12.lg('table')"],['results','res','Resultados',"MC12.lg('results')"],['calendar','cal','Calendario',"MC12.lg('calendar')"],['scorers','bars','Estadísticas',"MC12.lg('scorers')"],['cup','trophyo','Copas',"MC12.lg('cup')"]];
 return `<div class="hdr"><button class="bk" onclick="go('dashboard')" title="Volver">${sv('back')}</button><div class="clb"><span class="lgi">${sv('trophy')}</span><div><small>${esc(a)}</small><b>${esc(b||c.country)}</b></div></div>${LOGO}<button class="sea" onclick="mc10World('hist')">Temporada ${c.season}-${String(c.season+1).slice(-2)} ${sv('chev')}</button></div>
 <div class="tt">${T.map(t=>`<button class="${t[0]===v?'on':''}" onclick="${t[3]}">${sv(t[1],'ti')}${t[2]}</button>`).join('')}</div>`}
function zones(){const z={};document.querySelectorAll('#leagueContent table tr').forEach(tr=>{const n=tr.querySelector('td.cl');if(!n)return;const name=n.textContent.trim();if(/mc10-z-rel/.test(tr.className))z[name]='rel';else if(/mc10-z-po|mc10-z-cl/.test(tr.className))z[name]='po'});return z}
function nextCard(c,title,btn){const cur=M.current();if(!cur||!cur.home)return `<div class="pn nc"><h3>${title}</h3><p class="em">No hay partidos pendientes.</p></div>`;
 const ev=events().find(e=>!e.played);const d=ev?ev.d:null;
 return `<div class="pn nc"><h3>${title}</h3><div class="sub">${esc(cur.label?String(cur.label).replace(/^LIGA\s*·\s*/i,lgName(c.country).split(' ').map(w=>w[0]).join('').toUpperCase()+' – ').replace(/FECHA/i,'Fecha'):'')}</div>
  <div class="vs"><div>${badge(cur.home,74)}<b>${esc(short(cur.home))}</b></div><em>VS</em><div>${badge(cur.away,74)}<b>${esc(short(cur.away))}</b></div></div>
  <div class="inf">${d?`<span>${sv('cal')}${DIAL[d.getDay()]}, ${d.getDate()} de ${MES[d.getMonth()]}</span>`:''}<span>${sv('stadium')}Estadio de ${esc(cur.home)}</span></div>${btn?`<button class="pp" onclick="openMatch()">${sv('tactic','bi')}Preparar Partido</button>`:''}</div>`}
function tableHTML(c){const li=M.leagueInfo();if(!li)return '';const z=zones();const t=li.t;
 const rows=t.map((r,i)=>{const zz=z[r.name]||(i===0?'top':'');return `<tr class="${r.name===c.club?'you':''}"><td class="ps ${zz}">${i+1}</td><td class="cl"><span>${badge(r.name,24)}<b>${esc(r.name)}</b></span></td><td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td><td class="x">${r.gf}</td><td class="x">${r.gc}</td><td>${r.dg>0?'+':''}${r.dg}</td><td class="pt">${r.pts}</td></tr>`}).join('');
 const me=li.row;const hasPo=Object.values(z).includes('po'),hasRel=Object.values(z).includes('rel');
 return `<div class="g2"><div class="pn tb"><div class="th2"><span class="lgi">${(window.mcLeagueLogoHTML&&mcLeagueLogoHTML(c.country,22))||sv('trophy')}</span><b>${esc(lgName(c.country))}</b></div><div class="tw"><table><tr><th>#</th><th class="cl">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th class="x">GF</th><th class="x">GC</th><th>DG</th><th>Pts</th></tr>${rows}</table></div></div>
 <div class="sd">${me?`<div class="pn me"><div class="mh">${badge(c.club,70)}<div><b>${esc(c.club)}</b><span>${li.pos+1}º Posición</span></div></div><div class="g4">${[['PJ',me.pj],['G',me.g],['E',me.e],['P',me.p]].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div><div class="g4">${[['GF',me.gf],['GC',me.gc],['DG',(me.dg>0?'+':'')+me.dg]].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}<div class="hl"><small>Pts</small><b>${me.pts}</b></div></div></div>`:''}
 ${nextCard(c,'Próximo partido',false)}
 <div class="pn rf"><h3>Referencias</h3><span><i class="top"></i>Puntero</span>${hasPo?'<span><i class="po"></i>'+(window.mcDivNota&&mcDivNota(c.country)!=null?'Ascenso o playoff de ascenso':'Zona de clasificación')+'</span>':''}${hasRel?'<span><i class="rel"></i>'+(window.mcDivNota&&mcDivNota(c.country)!=null?'Descenso o playoff de permanencia':'Descenso')+'</span>':''}<span><i class="you"></i>Tu club</span></div></div></div>`}
function resultsHTML(c){const L=c.league;if(!L)return '';const n=L.rounds.length;let last=-1;L.rounds.forEach((d,r)=>{if(d.some(f=>f[2]!=null))last=r});
 if(LS.round==null)LS.round=Math.max(0,last);LS.round=Math.max(0,Math.min(n-1,LS.round));const r=LS.round,ui=L.teams.indexOf(c.club);
 const fx=L.rounds[r].map(f=>{const pl=f[2]!=null,mine=f[0]===ui||f[1]===ui;return `<div class="fx${mine?' you':''}"><span class="h">${esc(L.teams[f[0]])}${badge(L.teams[f[0]],26)}</span><span class="sc${pl?'':' p'}">${pl?f[2]+' - '+f[3]:'vs'}</span><span class="a">${badge(L.teams[f[1]],26)}${esc(L.teams[f[1]])}</span></div>`}).join('');
 return `<div class="g2"><div class="pn tb"><div class="nv"><button onclick="MC12.lgRound(-1)">${sv('left')}</button><b>Fecha ${r+1} de ${n}</b><button onclick="MC12.lgRound(1)">${sv('right')}</button></div><div class="fxs">${fx}</div><p class="em">${r>last?'Fecha por jugar.':'Resultados de la fecha.'}</p></div><div class="sd">${nextCard(c,'Próximo partido',true)}</div></div>`}
M.lgRound=d=>{LS.round=(LS.round||0)+d;leagueRender()};
function calHTML(c){const all=events();if(!all.length)return '';
 const keys=[...new Map(all.map(e=>[e.key,e.comp])).entries()];keys.forEach(([k])=>{if(LS.off[k]==null)LS.off[k]=false});
 const ev=all.filter(e=>!LS.off[e.key]);const nx=all.find(e=>!e.played);
 if(LS.mo==null){const b=(nx||all[all.length-1]).d;LS.mo=b.getFullYear()*12+b.getMonth()}
 const y=Math.floor(LS.mo/12),mo=LS.mo%12;const inM=ev.filter(e=>e.d.getFullYear()===y&&e.d.getMonth()===mo);const by={};inM.forEach(e=>{(by[e.d.getDate()]=by[e.d.getDate()]||[]).push(e)});
 const abbr=s=>String(s).split(' ').filter(w=>w.length>2||/^[A-Z]/.test(w)).map(w=>w[0]).join('').toUpperCase().slice(0,4);
 const list=inM.map(e=>`<div class="ci${e===nx?' nx':''}"><b class="dd">${DIA[e.d.getDay()]} ${String(e.d.getDate()).padStart(2,'0')}</b><span class="cp"><small>${esc(e.key==='liga'?abbr(e.comp):short(e.comp))}</small>${esc(e.sub)}</span>${badge(e.opp,34)}<b class="op">${esc(e.opp)}</b><span class="lv">${sv(e.home?'home':'plane')}${e.home?'L':'V'}</span><span class="rs ${e.played?e.res:''}">${e.played?e.gf+' - '+e.ga:'- - -'}</span>${e.played?sv('check','ok'):'<span class="ok"></span>'}</div>`).join('')||'<p class="em">No hay partidos este mes.</p>';
 const first=new Date(y,mo,1),lead=(first.getDay()+6)%7,days=new Date(y,mo+1,0).getDate(),prevDays=new Date(y,mo,0).getDate();let cells='';
 ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(d=>cells+=`<div class="dn">${d}</div>`);
 for(let i=lead;i>0;i--)cells+=`<div class="d o">${prevDays-i+1}</div>`;
 for(let d=1;d<=days;d++){const E=by[d];if(!E){cells+=`<div class="d">${d}</div>`;continue}const e=E[0];
  cells+=`<div class="d m ${e.played?e.res:''}${e===nx?' nx':''}${e.key!=='liga'?' cup':''}" title="${esc(E.map(x=>x.comp+' · '+x.sub+' · '+(x.home?'vs ':'en ')+x.opp).join(' | '))}"><span>${d}</span>${badge(e.opp,26)}</div>`}
 const tot=lead+days;for(let i=1;(tot+i-1)%7!==0||i===1;i++){if((tot+i-1)%7===0&&i>1)break;cells+=`<div class="d o">${i}</div>`;if(i>6)break}
 const comps=keys.map(([k,n])=>`<label class="cm"><input type="checkbox" ${LS.off[k]?'':'checked'} onchange="MC12.lgComp(${M.q(k)},!this.checked)"><span class="cbx">${sv('check')}</span><span class="ic">${sv(k==='liga'?'trophy':'trophyo')}</span>${esc(n)}</label>`).join('');
 return `<div class="g2 cal"><div class="cl1"><div class="pn ct"><div class="th2">${sv('cal','tc')}<b>Calendario de la Temporada</b></div><div class="mn"><button onclick="MC12.lgMo(-1)">${sv('left')}</button><b>${MES[mo]} ${y}</b><button onclick="MC12.lgMo(1)">${sv('right')}</button></div>${list}</div>
  <div class="pn gr"><div class="mn2"><button onclick="MC12.lgMo(-1)">${sv('left')}</button><b>${MES[mo]} ${y}</b><button onclick="MC12.lgMo(1)">${sv('right')}</button></div><div class="grid">${cells}</div></div></div>
  <div class="sd">${nextCard(c,'Próximo Partido',true)}<div class="pn cs"><h3>${sv('trophy','tc')}Competencias</h3>${comps}</div></div></div>`}
M.lgMo=d=>{LS.mo+=d;leagueRender()};M.lgComp=(k,off)=>{LS.off[k]=off;leagueRender()};
function leagueRender(){const c=C(),s=$('league');if(!c||!s)return;let box=$('m12L');
 if(!box){box=document.createElement('div');box.id='m12L';box.className='m12x';s.insertBefore(box,s.firstChild)}
 keep($('leagueContent'),s,'m12LKeep');
 const v=lgView();let body='';
 try{if(v==='table')body=tableHTML(c);else if(v==='results')body=resultsHTML(c);else if(v==='calendar')body=calHTML(c)}catch(e){warn('liga',e)}
 box.innerHTML=`<div class="w">${lgHeader(c,v==='calendar'?'calendar':v)}${body||'<div id="m12LOld"></div>'}</div>`;
 const lc=$('leagueContent');if(lc&&!body){$('m12LOld').appendChild(lc);lc.style.display=''}
 icons(box)}

/* ---------- arranque ---------- */
function boot4(){try{
 after('renderMarket',mktBuild);after('renderLeague',leagueRender);
 const oSet=window.setMarketTab;if(typeof oSet==='function')window.setMarketTab=function(t){const r=oSet.apply(this,arguments);try{mktBuild()}catch(e){}return r};
 after('submitTransferOffer',()=>{RES=null});after('mc10AcceptBid',()=>{RES=null});
 after('go',()=>{const id=(document.querySelector('.page.active')||{}).id;if(id==='market')mktBuild();else if(id==='league')leagueRender()});
}catch(e){warn('mercado/liga',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot4);else setTimeout(boot4,0);
})();

/* ===== MC12.1 · Equipo Titular, Tácticas y Copas según las referencias (solo presentación) =====
   Acciones reales: setFormation, autoLineup, mcPlayerMenu (cambios con advertencias), selectSpot, xStyle, xSlide,
   xApply, openPlayer, openMatch. Copas: datos de mcWorld().comps. */
(function(){
'use strict';
const M=window.MC12;if(!M)return;
const {$,esc,C,nm,money,badge,icons,warn,after,lgName,av,tier}=M;
const SV={
 back:'<path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 chev:'<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 left:'<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 right:'<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 home:'<path d="M3 11l9-7 9 7M6 9.5V20h12V9.5M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 people:'<circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="9" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 6 1.8 6 5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
 field:'<rect x="2" y="5" width="20" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 5v14M2 9h3v6H2M22 9h-3v6h3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/>',
 board:'<rect x="3" y="4" width="18" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 8l3 3M9 8l-3 3M15 14l3 3M18 14l-3 3M8 16c2-4 6-6 9-7M15 8h2v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
 tactic:'<circle cx="6" cy="6" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 4l5 5M20 4l-5 5M5 15l4 4M9 15l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 8c4 2 6 5 7 9M15 17l1-3 2 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 user:'<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5" fill="none" stroke="currentColor" stroke-width="1.9"/>',
 bars:'<path d="M3 14h4v7H3zM10 9h4v12h-4zM17 4h4v17h-4z"/>',
 bench:'<path d="M3 10h18v3H3zM5 13v6M19 13v6M5 7h14v3H5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
 form:'<circle cx="12" cy="5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="5" cy="18" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="19" cy="18" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M11 7l-5 9M13 7l5 9M7.5 18h9" stroke="currentColor" stroke-width="1.6"/>',
 magic:'<path d="M4 20L15 9M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 9l.7 1.3L21 11l-1.3.7L19 13l-.7-1.3L17 11l1.3-.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
 sliders:'<path d="M3 6h10M17 6h4M3 12h4M11 12h10M3 18h12M19 18h2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="15" cy="6" r="2.3"/><circle cx="9" cy="12" r="2.3"/><circle cx="17" cy="18" r="2.3"/>',
 gear:'<path d="M19.4 13a7.7 7.7 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.7 7.7 0 000 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" transform="translate(-1 0)"/>',
 clip:'<path d="M8 3h8v3H8z"/><path d="M5 5h14v17H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11h8M8 15h8M8 19h5" stroke="currentColor" stroke-width="1.8"/>',
 run:'<circle cx="15" cy="4" r="2.2"/><path d="M7 21l3-6 3 2v5M13 17l-2-5 4-3 2 3h4M11 12l-4 1-2 3M3 9h5M2 12h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 ball:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4z"/>',
 wing:'<path d="M3 18c6 0 12-3 18-12M3 13c5 0 9-2 12-6M3 8c3 0 5-1 7-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" fill="none" stroke="currentColor" stroke-width="2"/>',
 up:'<path d="M12 4l7 7h-4v8H9v-8H5z"/>',
 bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 trophy:'<path d="M6 3h12v2h3v3a5 5 0 01-4.6 5A6 6 0 0113 16.9V19h3v2H8v-2h3v-2.1A6 6 0 017.6 13 5 5 0 013 8V5h3zM5 7v1a3 3 0 002.1 2.9A9 9 0 016 7zm14 0h-1a9 9 0 01-1.1 3.9A3 3 0 0019 8z"/>',
 list:'<path d="M4 6h2M4 12h2M4 18h2M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 globe:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/>',
 hist:'<path d="M3 12a9 9 0 103-6.7M3 4v4h4M12 7v5l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 cal:'<path d="M4 5h16v16H4zM4 9.5h16M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 12.5h2v2H7zM11 12.5h2v2h-2zM15 12.5h2v2h-2zM7 16.5h2v2H7zM11 16.5h2v2h-2z"/>',
 play:'<path d="M6 3l15 9-15 9z"/>',
 stadium:'<path d="M2 9c0-2.5 4.5-4 10-4s10 1.5 10 4v6c0 2.5-4.5 4-10 4S2 17.5 2 15zm2 0c0 1.2 3.5 2.6 8 2.6S20 10.2 20 9s-3.5-2.6-8-2.6S4 7.8 4 9z"/>'
};
const sv=(k,c)=>`<svg class="${c||'si'}" viewBox="0 0 24 24" aria-hidden="true">${SV[k]||''}</svg>`;
const CROWN='<svg viewBox="0 0 40 24"><path d="M2 8l8 7 10-13 10 13 8-7-3 14H5z" fill="currentColor"/><circle cx="20" cy="2.5" r="2.2" fill="currentColor"/><circle cx="2.5" cy="7.5" r="1.9" fill="currentColor"/><circle cx="37.5" cy="7.5" r="1.9" fill="currentColor"/></svg>';
const LOGO=`<a class="m12-lg2" onclick="go('home')"><span class="cr">${CROWN}</span><b>MODO</b><b>CARRERA</b></a>`;
const FORMS=['4-3-3','4-2-3-1','4-4-2','4-1-4-1','3-5-2','3-4-3','5-3-2'];
const STY=[['Equilibrado','Equipo ordenado que alterna ataque y defensa según el momento del partido.','#2a4f9a'],['Ofensivo','Equipo agresivo, con muchos jugadores en ataque y búsqueda constante del gol.','#8a1c25'],['Defensivo','Bloque compacto que prioriza no recibir goles y salir con criterio.','#24527a'],['Posesión','Toque corto, paciencia y control del balón para desgastar al rival.','#1f6a45'],['Contraataque','Espera ordenado y lanza transiciones rápidas al recuperar la pelota.','#6b4a10'],['Presión alta','Asfixia al rival en su campo para recuperar la pelota cerca del arco.','#5a2a8a']];
const sur=n=>{n=String(nm(n)||'').trim();const p=n.split(/\s+/);if(p.length<2)return n;const pre=/^(de|da|del|di|van|von|la|le|dos|el)$/i;return p.length>2&&pre.test(p[p.length-2])?p.slice(-2).join(' '):p[p.length-1]};
const zone=i=>{try{return zoneOf(i)}catch(e){return i<11?'xi':'bench'}};
function hdr(c,tabs,active){return `<div class="hdr"><button class="bk" onclick="go('dashboard')" title="Volver">${sv('back')}</button><div class="clb">${badge(c.club,42)}<div><b>${esc(c.club)}</b><small>Mi Club</small></div></div>${LOGO}<button class="sea" onclick="mc10World('hist')">Temporada ${c.season}-${String(c.season+1).slice(-2)} ${sv('chev')}</button></div>
 <div class="tt" style="grid-template-columns:repeat(${tabs.length},minmax(0,1fr))">${tabs.map(t=>`<button class="${t[0]===active?'on':''}" onclick="${t[3]}">${sv(t[1],'ti')}${t[2]}</button>`).join('')}</div>`}
const TOP=[['dash','home','Resumen',"go('dashboard')"],['plantel','people','Plantel',"MC12.sqView('list')"],['xi','field','Equipo Titular',"MC12.sqView('xi')"],['tac','board','Tácticas',"go('tactics')"],['est','bars','Estadísticas',"MC12.lg('scorers')"]];

/* =====================================================================
   1) EQUIPO TITULAR / PLANTEL
   ===================================================================== */
let SQ='xi';
function lineupPitch(c){let co=[],G=[];try{co=positions(c.formation||'4-3-3');G=slotGroups(c.formation)}catch(e){}
 return c.players.slice(0,11).map((p,i)=>{const q=co[i]||[50,50];let r=p.rating,lab=p.pos;try{r=effRating(p,G[i]);lab=slotLabel(i)}catch(e){}
  const y=6+q[1]*.86,x=q[0];const fit=Math.max(0,Math.min(100,+p.fitness||0));
  return `<button class="pc" style="left:${x}%;top:${y}%" onclick="mcPlayerMenu(${i})" title="${esc(nm(p.name))}"><span class="gr ${tier(r)}"><b>${r}</b><small>${esc(lab)}</small></span>${av(p,null,'nb')}<span class="nm">${esc(sur(p.name))}</span><i class="ft"><em style="width:${fit}%" class="${fit<60?'lo':fit<80?'md':''}"></em></i>${p.injury?'<span class="inj">+</span>':''}${p.suspended?'<span class="sus"></span>':''}</button>`}).join('')}
function squadBuild(){if(M.sq2&&SQ==='xi')return M.sq2();const c=C(),s=$('squad');if(!c||!s)return;let box=$('m12Q');
 if(!box){box=document.createElement('div');box.id='m12Q';box.className='m12x';s.insertBefore(box,s.firstChild)}
 const P=c.players,val=P.reduce((a,p)=>a+(+p.value||0),0),wage=P.reduce((a,p)=>a+(+p.wage||0),0),age=P.reduce((a,p)=>a+(+p.age||0),0)/Math.max(1,P.length);
 let grl=0;try{grl=avgRating()}catch(e){}
 const bench=P.map((p,i)=>({p,i})).filter(x=>zone(x.i)==='bench');const res=P.map((p,i)=>({p,i})).filter(x=>zone(x.i)!=='bench'&&zone(x.i)!=='xi');
 const row=x=>`<button class="bn" onclick="mcPlayerMenu(${x.i})">${av(x.p)}<b>${esc(sur(x.p.name))}</b><span>${x.p.pos}</span><em class="${tier(x.p.rating)}">${x.p.rating}</em></button>`;
 const side=`<div class="sd"><div class="pn tm"><div class="th">${badge(c.club,64)}<div><b>${esc(c.club)}</b><span>GRL del Equipo <em class="${tier(grl)}">${grl}</em></span></div></div>
   <div class="kv"><span>Valor del Plantel</span><b>${money(val)}</b><span>Promedio de Edad</span><b>${age.toFixed(1).replace('.',',')} años</b><span>Salario Total</span><b>${money(wage)}</b></div></div>
  <div class="pn bc"><h3>${sv('bench','hi')}Suplentes</h3>${bench.map(row).join('')||'<p class="em">Sin suplentes.</p>'}${res.length?`<h4>Reservas (${res.length})</h4>${res.map(row).join('')}`:''}</div></div>`;
 let main;
 if(SQ==='list'){const L=P.map((p,i)=>({p,i}));main=`<div class="pn lst"><div class="ph">${sv('people','hi')}<b>Plantel Completo</b><small>${P.length} JUGADORES</small></div><div class="lh"><span>Jugador</span><span>Pos.</span><span>Edad</span><span>Físico</span><span>GRL</span><span>Valor</span></div>${L.map(({p,i})=>`<button class="lr" onclick="openPlayer(${i})">${av(p)}<b>${esc(nm(p.name))}<small>${esc((()=>{try{return MC_ZN[zone(i)]}catch(e){return''}})())}${p.injury?' · lesionado':''}${p.suspended?' · suspendido':''}</small></b><span class="pp ${p.pos}">${p.pos}</span><span>${p.age}</span><span>${p.fitness}%</span><em class="${tier(p.rating)}">${p.rating}</em><span>${money(p.value)}</span></button>`).join('')}</div>`}
 else main=`<div class="pn xi"><div class="ph">${sv('field','hi')}<b class="it">Equipo Titular</b><div class="fs"><select onchange="setFormation(this.value)">${FORMS.map(f=>`<option value="${f}"${f===c.formation?' selected':''}>${f} ${esc(c.style||'')}</option>`).join('')}</select>${sv('chev')}</div></div>
  <div class="pt"><div class="pb"><i class="l o"></i><i class="l h"></i><i class="l c"></i><i class="l a"></i><i class="l b"></i></div>${lineupPitch(c)}</div><p class="hint">Tocá un jugador para cambiarlo de lugar o reemplazarlo. Los cambios avisan si alguien juega fuera de su posición.</p></div>`;
 box.innerHTML=`<div class="w">${hdr(c,TOP,SQ==='list'?'plantel':'xi')}<div class="g2">${main}${side}</div>
 <div class="bt">${[['xi','field','Equipo Titular',"MC12.sqView('xi')"],['list','people','Plantel Completo',"MC12.sqView('list')"],['f','form','Formaciones',"go('tactics')"],['ins','tactic','Instrucciones',"go('tactics');setTimeout(()=>{const e=document.querySelector('#m12T .ins');e&&e.scrollIntoView({behavior:'smooth'})},80)"],['auto','magic','Alinear mejor once',"autoLineup();MC12.sqView('xi')"]].map(t=>`<button class="${t[0]===SQ?'on':''}" onclick="${t[3]}">${sv(t[1],'ti')}${t[2]}</button>`).join('')}</div></div>`;
 icons(box)}
M.sqView=v=>{if(!C()){go('newcareer');return}SQ=v||'xi';go('squad');squadBuild();window.scrollTo(0,0)};M.sqMode=()=>SQ;

/* =====================================================================
   2) TÁCTICAS
   ===================================================================== */
const TI=[['run','Presión Alta','pressing',80],['ball','Salida Jugada','rhythm',25],['wing','Juego por Bandas','width',80],['shield','Bloque Bajo','depth',25],['up','Línea Adelantada','depth',80],['bolt','Juego Rápido','rhythm',80]];
let PI=0;
const MENT=[[20,'Muy defensiva'],[35,'Defensiva'],[50,'Equilibrada'],[65,'Ofensiva'],[80,'Muy ofensiva']];
function tacBuild(){const c=C(),s=$('tactics');if(!c||!s)return;let box=$('m12T');
 if(!box){box=document.createElement('div');box.id='m12T';box.className='m12x';s.insertBefore(box,s.firstChild)}
 ['mentality','width','depth','pressing','rhythm'].forEach(k=>{if(c[k]==null)c[k]=50});
 let co=[];try{co=positions(c.formation||'4-3-3')}catch(e){}let sel=null;try{sel=selectedSpot}catch(e){}
 const shirt=(n,gk)=>`<svg viewBox="0 0 44 40"><path d="M14 2L2 8l5 10 6-3v23h18V15l6 3 5-10L30 2c-1 4-4 6-8 6s-7-2-8-6z" fill="${gk?'#2fbf5a':'#f6f6f6'}" stroke="${gk?'#14702e':'#b9b9b9'}" stroke-width="1.5"/>${gk?'':'<path d="M31 3l-17 34h5L35 5z" fill="#d3212f"/>'}<text x="22" y="29" text-anchor="middle" font-size="16" font-weight="900" fill="${gk?'#fff':'#111'}" stroke="${gk?'#0b4d1e':'#fff'}" stroke-width=".6" font-family="Arial">${n}</text></svg>`;
 const toks=c.players.slice(0,11).map((p,i)=>{const q=co[i]||[50,50];let lab=p.pos;try{lab=slotLabel(i)}catch(e){}const fit=+p.fitness||0;
  return `<button class="tk${sel===i?' sel':''}" style="left:${q[0]}%;top:${6+q[1]*.86}%" onclick="selectSpot(${i})">${shirt(p.number||i+1,p.pos==='POR')}<span class="nm">${esc(sur(p.name))}</span><i class="ft"><em style="width:${fit}%" class="${fit<60?'lo':fit<80?'md':''}"></em></i><small>${esc(lab)}</small></button>`}).join('');
 const si=Math.max(0,STY.findIndex(x=>x[0]===c.style));const st=STY[si];
 const m=MENT.reduce((a,b)=>Math.abs(b[0]-c.mentality)<Math.abs(a[0]-c.mentality)?b:a);
 const SLD=[['Presión','pressing'],['Anchura','width'],['Líneas','depth'],['Ritmo','rhythm']];
 PI=Math.max(0,Math.min(10,PI));const p=c.players[PI];let lab=p.pos,er=p.rating;try{lab=slotLabel(PI);er=effRating(p,slotGroups(c.formation)[PI])}catch(e){}
 box.innerHTML=`<div class="w">${hdr(c,TOP,'tac')}
 <div class="g2 t1"><div class="pn xi"><div class="ph">${sv('tactic','hi')}<b class="it">Tácticas</b><div class="fs"><select onchange="setFormation(this.value)">${FORMS.map(f=>`<option value="${f}"${f===c.formation?' selected':''}>${f} ${esc(c.style||'')}</option>`).join('')}</select>${sv('chev')}</div></div>
   <div class="pt tp"><div class="pb"><i class="l o"></i><i class="l h"></i><i class="l c"></i><i class="l a"></i><i class="l b"></i></div>${toks}</div><p class="hint">${sel!=null?'Ahora tocá otro jugador para intercambiar sus posiciones.':'Tocá dos jugadores para intercambiar sus posiciones.'}</p></div>
  <div class="sd"><div class="pn es"><h3>${sv('sliders','hi')}Estilo de Juego</h3><div class="sc" style="--sc:${st[2]}"><button onclick="MC12.tStyle(-1)">${sv('left')}</button><span class="rn">${sv('run')}</span><div><b>${esc(st[0])}</b><p>${esc(st[1])}</p></div><button onclick="MC12.tStyle(1)">${sv('right')}</button></div><div class="dots">${STY.map((x,i)=>`<i class="${i===si?'on':''}" onclick="xStyle('${x[0]}')"></i>`).join('')}</div></div>
   <div class="pn aj"><h3>${sv('gear','hi')}Ajustes Tácticos</h3><div class="mt"><span>Mentalidad</span><div class="fs"><select onchange="xSlide('mentality',this.value);MC12.tac()">${MENT.map(x=>`<option value="${x[0]}"${x===m?' selected':''}>${x[1]}</option>`).join('')}</select>${sv('chev')}</div></div>
    ${SLD.map(x=>`<div class="sl"><span>${x[0]}</span><input type="range" min="0" max="100" value="${c[x[1]]}" style="--v:${c[x[1]]}%" oninput="this.style.setProperty('--v',this.value+'%');this.nextElementSibling.textContent=this.value+'%'" onchange="xSlide('${x[1]}',this.value);MC12.tac()"><b>${c[x[1]]}%</b></div>`).join('')}</div></div></div>
 <div class="g2 t2"><div class="pn ins"><h3>${sv('clip','hi')}Instrucciones del Equipo</h3><div class="ig">${TI.map(t=>{const on=t[3]>50?c[t[2]]>=t[3]:c[t[2]]<=t[3];return `<button class="${on?'on':''}" onclick="MC12.tIns('${t[2]}',${t[3]})">${sv(t[0],'ii')}${t[1]}</button>`}).join('')}</div><p class="hint">Cada instrucción mueve el ajuste táctico correspondiente; el simulador lo usa en el próximo partido.</p></div>
  <div class="pn pj"><h3>${sv('user','hi')}Instrucciones por Jugador</h3><div class="pcar"><button onclick="MC12.tPl(-1)">${sv('left')}</button><div class="pcc">${av(p)}<div><b>${esc(nm(p.name))}</b><span>${esc(lab)} | GRL <em>${er}</em></span></div>${badge(c.club,40)}</div><button onclick="MC12.tPl(1)">${sv('right')}</button></div>
   <div class="kv2"><span>Posición asignada</span><b>${esc(lab)}</b><span>Posición natural</span><b>${p.pos}</b><span>Estado físico</span><b>${p.fitness}%</b><span>Moral</span><b>${p.morale}%</b></div>
   <div class="pb2"><button class="gh" onclick="mcPlayerMenu(${PI})">Cambiar jugador</button><button class="gh" onclick="openPlayer(${PI})">Ver ficha</button></div></div></div>
 <div class="ab"><button class="gh" onclick="autoLineup();MC12.tac()">${sv('magic','ti')}Alinear mejor once</button><button class="gb" onclick="xApply()">Aplicar cambios</button></div></div>`;
 icons(box)}
M.tac=()=>{try{renderTactics()}catch(e){tacBuild()}};
M.tStyle=d=>{const c=C();const i=Math.max(0,STY.findIndex(x=>x[0]===c.style));xStyle(STY[(i+d+STY.length)%STY.length][0])};
M.tIns=(k,v)=>{const c=C();const on=v>50?c[k]>=v:c[k]<=v;xSlide(k,on?50:v);M.tac()};
M.tPl=d=>{PI=(PI+d+11)%11;tacBuild()};

/* =====================================================================
   3) COPAS: cuadro eliminatorio simétrico
   ===================================================================== */
const CS={id:null,focus:null};
const ab=n=>{n=String(n||'').replace(/^(Club|CA|CD|FC|Atlético|Deportivo|Sport|Racing)\s+/i,m=>/Racing/i.test(m)?m:'');const w=n.trim().split(/\s+/)[0]||'';return w.normalize('NFD').replace(/[̀-ͯ]/g,'').slice(0,3).toUpperCase()};
function score(t){if(!t)return['',''];if(t.agg)return t.agg;const l=t.legs&&t.legs[0];if(l)return l[0]===t.a?[l[2],l[3]]:[l[3],l[2]];return['','']}
function tieBox(t,club){if(!t)return `<div class="tb"><div class="r"><span class="cb"></span><b class="tbd">—</b><em></em></div><div class="r"><span class="cb"></span><b class="tbd">—</b><em></em></div></div>`;const s=score(t);
 const r=(n,g,w)=>n?`<div class="r${w?' w':''}${n===club?' me':''}" title="${esc(n)}">${badge(n,22)}<b>${esc(ab(n))}</b><em>${g}</em></div>`:'<div class="r"><span class="cb"></span><b class="tbd">libre</b><em></em></div>';
 return `<div class="tb${t.a===club||t.b===club?' you':''}">${r(t.a,s[0],t.w===t.a)}${r(t.b,s[1],t.w===t.b)}${t.pen?`<i class="pe">pen. ${t.pen[0]}-${t.pen[1]}</i>`:''}</div>`}
function bracket(k,club){const kos=(k.stages||[]).filter(s=>s.type==='ko'&&s.ties&&s.ties.length);
 const ord=kos.map(s=>s.ties.slice());for(let i=ord.length-1;i>0;i--){const used=new Set(),o=[];ord[i].forEach(t=>[t.a,t.b].forEach(n=>{if(!n)return;const src=ord[i-1].find(x=>x.w===n&&!used.has(x));if(src){used.add(src);o.push(src)}}));ord[i-1].forEach(x=>{if(!used.has(x))o.push(x)});ord[i-1]=o}
 const rounds=kos.map((s,i)=>({name:s.name,ties:ord[i],n:ord[i].length+((s.direct&&s.direct.length)||0)/2}));
 const last=rounds[rounds.length-1];const pow=x=>x>0&&(x&(x-1))===0;
 if(last&&!k.champ){let n=Math.round(last.n);if(pow(n)&&n>1)for(let t=n/2;t>=1;t/=2){let name='';try{name=MC10W.koName(t*2)}catch(e){name=t===1?'Final':'Ronda'}rounds.push({name,ties:Array(t).fill(null),n:t,fut:true})}}
 const fi=rounds.findIndex(r=>r.ties.length===1&&pow(Math.round(r.n)));if(fi<0)return{rounds,win:null};
 const win=rounds.slice(Math.max(0,fi-3),fi+1);return{rounds,win}}
function cupBuild(){const c=C(),s=$('league');if(!c||!s)return null;const list=M.userComps();const all=M.allComps();
 let k=all.find(x=>(x.id||x.name)===CS.id)||list.find(x=>x.kind==='cup')||list[0]||all[0];if(!k)return null;CS.id=k.id||k.name;
 const club=c.club,b=bracket(k,club),W=b.win;
 const stTabs=b.rounds.map((r,i)=>`<button class="${(CS.focus==null?(!r.fut&&!(b.rounds[i+1]&&!b.rounds[i+1].fut)):CS.focus===i)?'on':''}" onclick="MC12.cupFocus(${i})">${esc(r.name)}</button>`).join('');
 let mid='';
 const showGrid=CS.focus!=null&&W&&!W.includes(b.rounds[CS.focus]);
 if(W&&W.length>=2&&!showGrid){const fin=W[W.length-1],pre=W.slice(0,-1);
  const col=(r,side)=>{const h=r.ties.length/2;const ts=side==='L'?r.ties.slice(0,h):r.ties.slice(h);return `<div class="bc ${side}"><h5>${esc(r.name)}</h5><div class="ts">${ts.map(t=>tieBox(t,club)).join('')}</div></div>`};
  const L=pre.map(r=>col(r,'L')).join(''),R=pre.slice().reverse().map(r=>col(r,'R')).join('');
  const ft=fin.ties[0];const cur=M.current();
  mid=`<div class="br" style="--n:${pre.length}">${L}<div class="ctr"><div class="cup">${sv('trophy')}<b>${esc(k.name)}</b></div></div>${R}</div>
  <div class="fn"><span class="fl">FINAL</span>${ft||k.champ?`<div class="fv"><div>${badge(ft?ft.a:k.champ,70)}<b>${esc(ft?ft.a:k.champ)}</b></div>${ft&&(ft.legs||[]).length?`<em>${score(ft).join(' - ')}</em>`:'<em>VS</em>'}<div>${ft&&ft.b?badge(ft.b,70):''}<b>${esc(ft&&ft.b?ft.b:'')}</b></div></div>`:`<div class="fv"><div><span class="ph0">?</span><b>Por definir</b></div><em>VS</em><div><span class="ph0">?</span><b>Por definir</b></div></div>`}
  ${k.champ?`<div class="ch">${sv('trophy')} Campeón: <b>${esc(k.champ)}</b></div>`:''}</div>`}
 else{const r=b.rounds[CS.focus!=null?CS.focus:Math.max(0,b.rounds.findIndex(x=>!x.fut)>=0?b.rounds.filter(x=>!x.fut).length-1:0)]||b.rounds[0];
  mid=r?`<h4 class="rn">${esc(r.name)} · ${r.ties.length} cruces</h4><div class="gridT">${r.ties.map(t=>tieBox(t,club)).join('')}</div>`:'<p class="em">Este torneo no tiene fase eliminatoria.</p>'}
 const grp=(k.stages||[]).filter(x=>x.type!=='ko');
 const cur=M.current();const isMine=cur&&/copa|cup/i.test(String(cur.label||''))&&String(cur.label||'').toLowerCase().includes(String(k.name).toLowerCase().split(' ')[0]);
 const others=all.filter(x=>x.teams&&x.teams.includes(club));
 return `<div class="cp2">
 <div class="cb2"><span class="cbi">${sv('trophy')}</span><div><h1>${esc(k.name)}</h1><p>${esc(k.kind==='cup'?'Torneo Nacional':'Torneo Internacional')} · ${esc(k.kind==='cup'?c.country:(k.conf||'Internacional'))}</p></div>${others.length>1?`<div class="fs"><select onchange="MC12.cupSel(this.value)">${others.map(x=>`<option value="${esc(x.id||x.name)}"${(x.id||x.name)===CS.id?' selected':''}>${esc(x.name)}</option>`).join('')}</select>${sv('chev')}</div>`:''}</div>
 ${grp.length?`<p class="em">Este torneo empieza con fase de grupos; abajo está el detalle completo de cada grupo.</p>`:''}
 <div class="stt">${stTabs}</div>${mid}
 <div class="acts"><button class="gb" onclick="openMatch()">${sv('play','ti')}${isMine?'JUGAR PARTIDO':'IR AL PRÓXIMO PARTIDO'}</button><button class="gh" onclick="MC12.lg('calendar')">${sv('cal','ti')}VER CALENDARIO</button><button class="gh" onclick="MC12.cupDetail()">${sv('list','ti')}DETALLE COMPLETO</button></div></div>`}
M.cupFocus=i=>{CS.focus=i;M.lg('cup')};M.cupSel=v=>{CS.id=v;CS.focus=null;M.lg('cup')};
M.cupDetail=()=>{const d=$('m12LOld');if(d){d.classList.toggle('m12-hidden');if(!d.classList.contains('m12-hidden'))d.scrollIntoView({behavior:'smooth'})}};

/* ---------- arranque ---------- */
function cupHook(){let v='';try{v=leagueView}catch(e){}const box=$('m12L');if(v!=='cup'||!box)return;const c=C();let h='';try{h=cupBuild()}catch(e){warn('copas',e)}if(!h)return;
 const w=box.querySelector('.w');const old=$('m12LOld');if(!w||!old)return;
 const wrap=document.createElement('div');wrap.innerHTML=h;w.insertBefore(wrap.firstElementChild,old);old.classList.add('m12-hidden');
 w.querySelectorAll('.tt button').forEach(b=>b.classList.toggle('on',/'cup'/.test(b.getAttribute('onclick')||'')));icons(w)}
function boot5(){try{
 after('renderSquad',squadBuild);after('renderLineupV6',()=>{if(document.querySelector('#squad.active'))squadBuild()});after('renderTactics',tacBuild);after('renderLeague',cupHook);
 after('go',()=>{const id=(document.querySelector('.page.active')||{}).id;if(id==='squad')squadBuild();else if(id==='tactics')tacBuild();else if(id==='league')cupHook()});
 if(C())squadBuild();
}catch(e){warn('equipo/copas',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot5);else setTimeout(boot5,0);
})();

/* ===== MC12.1 · Rehechas según las nuevas referencias: Mercado, Equipo Titular y Elegí tu equipo.
   También: escudos sin fondo blanco (copias en assets/escudos_sf; los originales no se tocan).
   Acciones reales: MC12.nego (negociación), mcPlayerMenu, setFormation, autoLineup, openPlayer, createCareer. ===== */
(function(){
'use strict';
const M=window.MC12;if(!M)return;
const {$,esc,C,nm,money,flag,badge,icons,warn,after,lgName,av,tier}=M;
const SV={
 back:'<path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
 chev:'<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 left:'<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 right:'<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
 star:'<path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.5L12 17.2l-5.8 3.2 1.4-6.5-4.9-4.4 6.5-.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
 starf:'<path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.5L12 17.2l-5.8 3.2 1.4-6.5-4.9-4.4 6.5-.7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
 swap:'<path d="M17 3l4 4-4 4M21 7H7M7 21l-4-4 4-4M3 17h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 hist:'<path d="M3 12a9 9 0 103-6.7M3 4v4h4M12 7v5l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 filter:'<path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
 up:'<path d="M12 4l7 7h-4v8H9v-8H5z"/>',
 down:'<path d="M12 5v13M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
 coins:'<ellipse cx="12" cy="6" rx="7" ry="2.8" fill="#f6d77d"/><path d="M5 6v3c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6c0 1.5-3.1 2.8-7 2.8S5 7.5 5 6z" fill="#e3b33c"/><path d="M5 10.5v3c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-3c0 1.5-3.1 2.8-7 2.8s-7-1.3-7-2.8z" fill="#d6a42e"/><path d="M5 15v3c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-3c0 1.5-3.1 2.8-7 2.8S5 16.5 5 15z" fill="#c4921e"/>',
 detail:'<path d="M4 20V10M10 20V4M16 20v-7M20 8l-4 4-6-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 globe:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/>',
 arrow:'<path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
 trophy:'<path d="M6 3h12v2h3v3a5 5 0 01-4.6 5A6 6 0 0113 16.9V19h3v2H8v-2h3v-2.1A6 6 0 017.6 13 5 5 0 013 8V5h3zM5 7v1a3 3 0 002.1 2.9A9 9 0 016 7zm14 0h-1a9 9 0 01-1.1 3.9A3 3 0 0019 8z"/>',
 sliders:'<path d="M3 6h10M17 6h4M3 12h4M11 12h10M3 18h12M19 18h2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="15" cy="6" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="12" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="18" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/>'
};
const sv=(k,c)=>`<svg class="${c||'si'}" viewBox="0 0 24 24" aria-hidden="true">${SV[k]||''}</svg>`;
const CROWN='<svg viewBox="0 0 40 24"><path d="M2 8l8 7 10-13 10 13 8-7-3 14H5z" fill="currentColor"/><circle cx="20" cy="2.5" r="2.2" fill="currentColor"/><circle cx="2.5" cy="7.5" r="1.9" fill="currentColor"/><circle cx="37.5" cy="7.5" r="1.9" fill="currentColor"/></svg>';
const LOGO1=`<a class="lg1" onclick="go('home')"><span class="cr">${CROWN}</span><b>MODO CARRERA</b></a>`;
const full=v=>'$'+Math.round((+v||0)*1e6).toLocaleString('es-AR');
const segKey=()=>{const c=C();return 'mc12_seguimiento_'+(c?(c.saveName||c.club||'x'):'x')};
const segGet=()=>{try{return JSON.parse(localStorage.getItem(segKey())||'[]')}catch(e){return[]}};
const segSet=a=>{try{localStorage.setItem(segKey(),JSON.stringify(a.slice(0,40)))}catch(e){}};
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const sur=n=>{n=String(nm(n)||'').trim();const p=n.split(/\s+/);if(p.length<2)return n;return /^(de|da|del|di|van|von|la|le|dos|el)$/i.test(p[p.length-2])&&p.length>2?p.slice(-2).join(' '):p[p.length-1]};
const POSL={POR:'Arquero',DEF:'Defensor',MED:'Mediocampista',DEL:'Delantero'};
function topBar(c,sub){return `<div class="tb1"><button class="bk" onclick="history.length>1&&document.querySelector('.page.active').id!=='dashboard'?go('dashboard'):go('home')" title="Volver">${sv('back')}</button>${LOGO1}<span class="ss">Temporada ${c.season}/${String(c.season+1).slice(-2)}</span></div>`}
const budget=c=>`<div class="bud1" onclick="go('board')" title="Finanzas">${sv('coins','cn')}<b>${full(c.budget)}</b></div>`;

/* ---------- escudos sin fondo blanco ---------- */
(function(){const o=window.clubBadge;if(typeof o!=='function')return;window.clubBadge=function(){return String(o.apply(this,arguments)).replace(/src="assets\/escudos\/([^"]+)"/,'src="assets/escudos_sf/$1" data-l="assets/escudos/$1"').replace('onerror="if(!this.dataset.r)','onerror="if(this.dataset.l){const l=this.dataset.l;this.removeAttribute(\'data-l\');this.src=l;return}if(!this.dataset.r)')}})();

/* =====================================================================
   MERCADO DE FICHAJES
   ===================================================================== */
const K={tab:'buy',q:'',pos:'',club:'',nat:'',lg:'',a0:15,a1:45,g0:40,val:'',tl:false,free:false,sort:'value',chip:'all',filters:false,n:30};
let RES=null,NATS=null,LGS=null;
function pool(){const c=C();let L=[];try{L=mcDB().list}catch(e){}const sq=new Set(c.players.map(p=>p.name)),gone=(c.mkt&&c.mkt.gone)||{};
 return L.filter(p=>p.club!==c.club&&!gone[p.id]&&!sq.has(p.name)).concat((c.mkt&&c.mkt.extra)||[])}
function run(){const q=fold(K.q).trim(),qc=fold(K.club).trim(),VM={'1':[0,1],'5':[0,5],'20':[0,20],'50':[0,50],'51':[50,1e9]}[K.val];
 RES=pool().filter(p=>(!q||fold(p.name).includes(q))&&(!qc||fold(p.club).includes(qc))&&(!K.pos||p.pos===K.pos)&&(!K.nat||p.nat===K.nat)&&(!K.lg||p.league===K.lg)&&p.age>=K.a0&&p.age<=K.a1&&p.rating>=K.g0&&(!VM||(p.value>=VM[0]&&p.value<=VM[1]))&&(!K.tl||p.listed)&&(!K.free||p.free));
 const S={value:(a,b)=>b.value-a.value||b.rating-a.rating,rating:(a,b)=>b.rating-a.rating||b.value-a.value,young:(a,b)=>a.age-b.age||b.rating-a.rating,pot:(a,b)=>(b.potential||0)-(a.potential||0)||b.rating-a.rating,cheap:(a,b)=>a.value-b.value||b.rating-a.rating}[K.sort];RES.sort(S)}
function nats(){if(NATS)return NATS;const m={};pool().forEach(p=>{if(p.nat&&p.nat!=='—')m[p.nat]=(m[p.nat]||0)+1});NATS=Object.keys(m).sort((a,b)=>a.localeCompare(b,'es'));return NATS}
function lgs(){if(LGS)return LGS;LGS=[...new Set(pool().map(p=>p.league).filter(Boolean))].sort((a,b)=>String(lgName(a)).localeCompare(String(lgName(b)),'es'));return LGS}
const opt=(v,t,cur)=>`<option value="${esc(v)}"${String(cur)===String(v)?' selected':''}>${esc(t)}</option>`;
function card(p,c){const seg=segGet().includes(p.id);const n=String(nm(p.name)).trim().split(/\s+/);const a=n.length>1?n[0]:'',b=n.length>1?n.slice(1).join(' '):n[0];
 return `<div class="mc"><button class="st${seg?' on':''}" onclick="MC12.k2Seg(${M.q(p.id)})" title="${seg?'Quitar de la lista':'Agregar a la lista de deseos'}">${sv(seg?'starf':'star')}</button><span class="ph">${av(p,null,'nb')}</span><span class="cb">${badge(p.club,40)}</span>
 <div class="nf"><b>${a?`<span>${esc(a)}</span>`:''}${esc(b)}</b><div class="mt"><span class="ps">${esc(p.pos)}</span>${flag(p.nat)?`<span class="fl">${flag(p.nat)}</span>`:''}<span class="sep">|</span><span>${p.age} años</span></div><small>${esc(p.club)}</small></div>
 <div class="gr"><small>GRL</small><b class="${tier(p.rating)}">${p.rating}</b></div><div class="vl"><small>Valor de mercado</small><b><span class="lf">${full(p.value)}</span><span class="ls">${money(p.value)}</span></b></div><button class="fc" onclick="MC12.nego(${M.q(p.id)})">Fichar</button></div>`}
function mkt2(){const c=C(),s=$('market');if(!c||!s)return;let box=$('m12K2');
 if(!box){box=document.createElement('div');box.id='m12K2';box.className='m12x';s.insertBefore(box,s.firstChild)}
 const keep=$('mBody');if(keep){let k=$('m12K2Keep');if(!k){k=document.createElement('div');k.id='m12K2Keep';k.style.display='none';s.appendChild(k)}if(keep.parentNode!==k)k.appendChild(keep)}
 let T='buy';try{T=marketTab}catch(e){}if(K.tab==='wish')T='wish';
 const pend=(c.marketDeals||[]).filter(d=>d.status==='PENDIENTE').length;
 const TABS=[['buy','search','Buscar',"MC12.k2Tab('buy')"],['wish','star','Lista de Deseos',"MC12.k2Tab('wish')"],['deals','swap','Ofertas',"MC12.k2Tab('deals')",pend],['sell','up','Ventas',"MC12.k2Tab('sell')"],['hist','hist','Historial',"MC12.k2Tab('hist')"]];
 let body='';
 if(T==='buy'||T==='wish'){if(T==='buy'&&!RES)run();const L=T==='wish'?segGet().map(id=>{try{return mcDB().byId.get(id)}catch(e){return null}}).filter(Boolean):RES;
  const CH=[['all','Todos'],['pos','Por Posición'],['club','Por Equipo'],['nat','Por Nacionalidad'],['more','Más '+(K.filters?'↑':'↓')]];
  let sub='';
  if(T==='buy'){if(K.chip==='pos')sub=`<div class="sb2"><div class="sl"><select onchange="MC12.k2F('pos',this.value)">${opt('','Todas las posiciones',K.pos)}${Object.entries(POSL).map(([k,v])=>opt(k,v+'s',K.pos)).join('')}</select>${sv('chev')}</div></div>`;
   else if(K.chip==='club')sub=`<div class="sb2"><input type="search" placeholder="Nombre del equipo…" value="${esc(K.club)}" oninput="MC12.k2F('club',this.value,1)"></div>`;
   else if(K.chip==='nat')sub=`<div class="sb2"><div class="sl"><select onchange="MC12.k2F('nat',this.value)">${opt('','Todas las nacionalidades',K.nat)}${nats().map(n=>opt(n,n,K.nat)).join('')}</select>${sv('chev')}</div></div>`}
  const fil=K.filters&&T==='buy'?`<div class="flt"><label>Liga<div class="sl"><select onchange="MC12.k2F('lg',this.value)">${opt('','Todas las ligas',K.lg)}${lgs().map(l=>opt(l,lgName(l),K.lg)).join('')}</select>${sv('chev')}</div></label>
   <label>Edad<div class="rg"><input type="number" min="15" max="45" value="${K.a0}" onchange="MC12.k2F('a0',+this.value)"><span>–</span><input type="number" min="15" max="45" value="${K.a1}" onchange="MC12.k2F('a1',+this.value)"></div></label>
   <label>GRL mínimo<input type="number" min="40" max="99" value="${K.g0}" onchange="MC12.k2F('g0',+this.value)"></label>
   <label>Valor<div class="sl"><select onchange="MC12.k2F('val',this.value)">${opt('','Cualquiera',K.val)}${opt('1','Hasta $1M',K.val)}${opt('5','Hasta $5M',K.val)}${opt('20','Hasta $20M',K.val)}${opt('50','Hasta $50M',K.val)}${opt('51','Más de $50M',K.val)}</select>${sv('chev')}</div></label>
   <label>Ordenar por<div class="sl"><select onchange="MC12.k2F('sort',this.value)">${opt('value','Valor de mercado',K.sort)}${opt('rating','GRL',K.sort)}${opt('pot','Potencial',K.sort)}${opt('young','Más jóvenes',K.sort)}${opt('cheap','Más baratos',K.sort)}</select>${sv('chev')}</div></label>
   <label class="ck"><input type="checkbox" ${K.tl?'checked':''} onchange="MC12.k2F('tl',this.checked)">Solo transferibles</label><label class="ck"><input type="checkbox" ${K.free?'checked':''} onchange="MC12.k2F('free',this.checked)">Agentes libres</label><button class="lk" onclick="MC12.k2Reset()">Limpiar filtros</button></div>`:'';
  body=`${T==='buy'?`<div class="srow"><div class="sr">${sv('search')}<input id="m12k2q" type="search" placeholder="Buscar jugador..." value="${esc(K.q)}" oninput="MC12.k2F('q',this.value,1)"></div><button class="fb${K.filters?' on':''}" onclick="MC12.k2Filt()">${sv('filter')}Filtros</button></div>
   <div class="chips">${CH.map(x=>`<button class="${(x[0]==='more'?K.filters:K.chip===x[0])?'on':''}" onclick="MC12.k2Chip('${x[0]}')">${x[1]}</button>`).join('')}</div>${sub}${fil}<div class="cnt">${RES.length.toLocaleString('es-AR')} jugadores</div>`:`<div class="cnt">${L.length} ${L.length===1?'jugador':'jugadores'} en tu lista de deseos</div>`}
   <div class="lst">${L.slice(0,T==='buy'?K.n:999).map(p=>card(p,c)).join('')||`<p class="em">${T==='wish'?'Tu lista está vacía. Tocá la estrella de un jugador para agregarlo.':'No hay jugadores con esos filtros.'}</p>`}</div>
   ${T==='buy'&&RES.length>K.n?`<button class="more" onclick="MC12.k2More()">Mostrar más (${(RES.length-K.n).toLocaleString('es-AR')} restantes)</button>`:''}`}
 else body='<div id="m12K2Other"></div>';
 box.innerHTML=`<div class="w">${topBar(c)}<div class="tl1">${sv('swap','ti2')}<h1>Mercado de Fichajes</h1>${budget(c)}</div>
 <div class="tabs1">${TABS.map(t=>`<button class="${t[0]===T?'on':''}" onclick="${t[3]}">${sv(t[1],'ti')}${t[2]}${t[4]?`<em>${t[4]}</em>`:''}</button>`).join('')}</div>${body}</div>`;
 if(T!=='buy'&&T!=='wish'){const mb=$('mBody');if(mb){$('m12K2Other').appendChild(mb);mb.style.display=''}}
 icons(box)}
let TM=null;
M.k2Tab=t=>{K.tab=t;if(t==='wish'){try{marketTab='buy'}catch(e){}go('market');mkt2();return}try{setMarketTab(t)}catch(e){}go('market')};
M.k2F=(k,v,deb)=>{K[k]=v;K.n=30;clearTimeout(TM);const go2=()=>{run();mkt2();if(k==='q'||k==='club'){const e=k==='q'?$('m12k2q'):document.querySelector('#m12K2 .sb2 input');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length)}}};if(deb)TM=setTimeout(go2,250);else go2()};
M.k2Chip=ch=>{if(ch==='more'){K.filters=!K.filters}else if(ch==='all'){Object.assign(K,{chip:'all',pos:'',club:'',nat:''});run()}else K.chip=K.chip===ch?'all':ch;mkt2()};
M.k2Filt=()=>{K.filters=!K.filters;mkt2()};M.k2More=()=>{K.n+=30;mkt2()};
M.k2Reset=()=>{Object.assign(K,{q:'',pos:'',club:'',nat:'',lg:'',a0:15,a1:45,g0:40,val:'',tl:false,free:false,sort:'value',chip:'all',n:30});run();mkt2()};
M.k2Seg=id=>{const a=segGet();const i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.unshift(id);segSet(a);mkt2()};
M.mkt2=mkt2;

/* =====================================================================
   EQUIPO TITULAR
   ===================================================================== */
let SEL=10,BT='bench';
const ATT=[['pace','Ritmo',60],['shooting','Tiro',60],['passing','Pase',60],['defending','Defensa',60],['stamina','Resistencia',70],['strength','Físico',65]];
const zone=i=>{try{return zoneOf(i)}catch(e){return i<11?'xi':'bench'}};
const FORMS=['4-3-3','4-2-3-1','4-4-2','4-1-4-1','3-5-2','3-4-3','5-3-2'];
function pcard(p,i,lab,r,sel){const fit=Math.max(0,Math.min(100,+p.fitness||0));
 return `<span class="gl"><b class="${tier(r)}">${r}</b><small>${esc(lab)}</small>${flag(p.nat)?`<span class="fg">${flag(p.nat)}</span>`:''}</span><span class="fo">${av(p,null,'nb')}</span><span class="nm">${esc(sur(p.name))}</span>${p.injury?'<span class="ij">+</span>':''}${p.suspended?'<span class="su"></span>':''}<i class="ft"><em class="${fit<60?'lo':fit<80?'md':''}" style="width:${fit}%"></em></i>`}
function sq2(){const c=C(),s=$('squad');if(!c||!s)return;let box=$('m12Q');
 if(!box){box=document.createElement('div');box.id='m12Q';box.className='m12x';s.insertBefore(box,s.firstChild)}
 const P=c.players;SEL=Math.max(0,Math.min(P.length-1,SEL));let co=[],G=[];try{co=positions(c.formation||'4-3-3');G=slotGroups(c.formation)}catch(e){}
 let grl=0;try{grl=avgRating()}catch(e){}const fitAvg=Math.round(P.slice(0,11).reduce((a,p)=>a+(+p.fitness||0),0)/Math.max(1,Math.min(11,P.length)));
 const xi=P.slice(0,11).map((p,i)=>{const q=co[i]||[50,50];let r=p.rating,lab=p.pos;try{r=effRating(p,G[i]);lab=slotLabel(i)}catch(e){}
  const y=q[1],x=50+(q[0]-50)*(.8+.25*(y/100));return `<button class="pcd${SEL===i?' on':''}" style="left:${x.toFixed(1)}%;top:${(2+y*.9).toFixed(1)}%" onclick="MC12.q2Sel(${i})" ondblclick="mcPlayerMenu(${i})">${pcard(p,i,lab,r)}</button>`}).join('');
 const pl=P[SEL];let lab=pl.pos,er=pl.rating;if(SEL<11){try{lab=slotLabel(SEL);er=effRating(pl,G[SEL])}catch(e){}}
 const col=v=>v>=75?'g':v>=60?'y':'r';
 const strip=P.map((p,i)=>({p,i})).filter(x=>BT==='bench'?zone(x.i)==='bench':(zone(x.i)!=='bench'&&zone(x.i)!=='xi'));
 box.innerHTML=`<div class="w">${topBar(c)}
 <div class="cr1">${badge(c.club,64)}<div><h1>${esc(c.club)}</h1><span>Plantel</span></div>${budget(c)}</div>
 <div class="tabs1 t3"><button onclick="MC12.sqView('list')">Plantel</button><button class="on" onclick="MC12.sqView('xi')">Equipo Titular</button><button onclick="go('tactics')">Tácticas</button><button onclick="MC12.lg('scorers')">Estadísticas</button></div>
 <div class="g2q"><div class="pnq pit"><div class="pth"><div class="sl fsel"><select onchange="setFormation(this.value)">${FORMS.map(f=>opt(f,f+' '+(c.style||''),c.formation)).join('')}</select>${sv('chev')}</div><span class="gt">GRL DEL EQUIPO <b class="${tier(grl)}">${grl}</b></span><span class="qm"><small>Forma física</small><i><em style="width:${fitAvg}%"></em></i><b>${fitAvg}</b></span></div>
  <div class="fld"><div class="grs"><i class="l o"></i><i class="l h"></i><i class="l c"></i><i class="l a"></i><i class="l b"></i></div>${xi}</div></div>
 <div class="pnq sel"><div class="sh">${av(pl,null,'nb')}<span class="sc">${badge(c.club,34)}</span><span class="sg"><small>GRL</small><b class="${tier(er)}">${er}</b></span><div class="sn"><b>${esc(sur(pl.name))}</b><span>${esc(lab)} ${flag(pl.nat)}</span></div></div>
  <div class="ats">${ATT.map(a=>{const v=+pl[a[0]]||a[2];return `<div class="at"><span>${a[1]}</span><i><em class="${col(v)}" style="width:${v}%"></em></i><b class="${col(v)}">${v}</b></div>`}).join('')}</div>
  <button class="ob" onclick="openPlayer(${SEL})">${sv('detail')}Detalles</button><button class="ob" onclick="mcPlayerMenu(${SEL})">${sv('swap')}Cambiar</button></div></div>
 <div class="pnq bns"><div class="bt2"><button class="${BT==='bench'?'on':''}" onclick="MC12.q2Bt('bench')">Suplentes</button><button class="${BT==='res'?'on':''}" onclick="MC12.q2Bt('res')">Reservas</button><button class="au" onclick="autoLineup();MC12.sqView('xi')">Alinear mejor once</button></div>
  <div class="strw"><div class="str" id="m12Str">${strip.map(({p,i})=>`<button class="pcd sm${SEL===i?' on':''}" onclick="MC12.q2Sel(${i})">${pcard(p,i,p.pos,p.rating)}</button>`).join('')||'<p class="em">No hay jugadores acá.</p>'}</div><button class="nx" onclick="document.getElementById('m12Str').scrollBy({left:260,behavior:'smooth'})">${sv('right')}</button></div></div>
 <p class="hint">Tocá un jugador para ver sus datos; con «Cambiar» lo movés o reemplazás (el juego avisa si queda fuera de posición).</p></div>`;
 icons(box)}
M.q2Sel=i=>{SEL=i;sq2()};M.q2Bt=b=>{BT=b;sq2()};M.sq2=sq2;

/* =====================================================================
   ELEGÍ TU EQUIPO (nueva partida)
   ===================================================================== */
const NC={reg:'',country:null,club:null,q:''};
const LGT=()=>{try{return LEAGUES}catch(e){return window.LEAGUES||{}}},CLT=()=>{try{return CLUBS}catch(e){return window.CLUBS||{}}};
const REGS=[['','Todas','globe'],['Europa','Europa'],['Sudamérica','Sudamérica'],['Norteamérica','Norteamérica'],['Asia','Asia'],['África','África'],['Oceanía','Oceanía']];
function countries(){const o=[...($('country')||{options:[]}).options].map(x=>x.value);return o.filter(c=>{if(!NC.reg)return true;const m=(window.MC10&&MC10.META[c])||LGT()[c];return m&&m.reg===NC.reg})}
function ncBuild(){const s=$('newcareer');if(!s)return;let box=$('m12NC');
 if(!box){box=document.createElement('div');box.id='m12NC';box.className='m12x';s.insertBefore(box,s.firstChild)}
 const CS=countries();if(!NC.country||!CS.includes(NC.country))NC.country=CS[0]||'Argentina';
 const clubsOf=c=>CLT()[c]||[];
 let clubs;const q=fold(NC.q).trim();
 if(q.length>=3){clubs=[];const all=[...($('country')||{options:[]}).options].map(x=>x.value);for(const c of all){for(const k of clubsOf(c))if(fold(k).includes(q))clubs.push([k,c]);if(clubs.length>60)break}}
 else clubs=clubsOf(NC.country).filter(k=>!q||fold(k).includes(q)).map(k=>[k,NC.country]);
 if(!NC.club||!clubs.some(x=>x[0]===NC.club))NC.club=clubs[0]?clubs[0][0]:null;
 const sc=clubs.find(x=>x[0]===NC.club);
 const leagueCard=c=>{const L=LGT()[c]||{};return `<button class="lc1${c===NC.country?' on':''}" onclick="MC12.ncC(${M.q(c)})"><span class="li">${(window.mcLeagueLogoHTML&&mcLeagueLogoHTML(c,34))||sv('trophy')}</span><b>${esc(L.nombre||c)}</b><small>${esc(window.MC_DIVR&&MC_DIVR.esDiv(c)?MC_DIVR.paisDe(c)+' · '+(MC_DIVR.byKey[c].lv)+'ª división':c)}</small><span class="fl">${flag(c)}</span></button>`};
 box.innerHTML=`<div class="w"><div class="hd1"><a class="lg2" onclick="go('home')"><span class="cr">${CROWN}</span><b>MODO</b><b>CARRERA</b></a><h1>ELIGE TU EQUIPO</h1><p>Comenzá tu carrera como DT y llevá a tu club a la gloria</p><span class="cup">${sv('trophy')}</span></div>
 <div class="stp"><h2><i>1</i>SELECCIONÁ UNA REGIÓN</h2><div class="rgs">${REGS.map(r=>`<button class="${NC.reg===r[0]?'on':''}" onclick="MC12.ncR(${M.q(r[0])})">${r[2]?sv('globe'):''}${r[1]}</button>`).join('')}</div></div>
 <div class="stp"><h2><i>2</i>ELEGÍ LA LIGA <small>${CS.length} ligas</small></h2><div class="car"><button class="ar l" onclick="document.getElementById('m12Lc').scrollBy({left:-300,behavior:'smooth'})">${sv('left')}</button><div class="lcs" id="m12Lc">${CS.map(leagueCard).join('')}</div><button class="ar r" onclick="document.getElementById('m12Lc').scrollBy({left:300,behavior:'smooth'})">${sv('right')}</button></div></div>
 <div class="stp"><h2><i>3</i>ELEGÍ TU EQUIPO</h2><div class="srow"><div class="sr">${sv('search')}<input id="m12ncq" type="search" placeholder="Buscar equipo... (3 letras busca en todas las ligas)" value="${esc(NC.q)}" oninput="MC12.ncQ(this.value)"></div></div>
  <div class="cgr">${clubs.map(([k,c])=>`<button class="cc${k===NC.club?' on':''}" onclick="MC12.ncK(${M.q(k)},${M.q(c)})">${badge(k,64)}<b>${esc(k)}</b>${q.length>=3?`<small>${esc(c)}</small>`:''}</button>`).join('')||'<p class="em">No se encontraron equipos.</p>'}</div></div>
 <div class="stp"><h2><i>4</i>TUS DATOS</h2><div class="dts"><label>Nombre del entrenador<input id="m12ncM" placeholder="Ej. Marcelo Gallardo" value="${esc(($('manager')||{}).value||'')}"></label><label>Nombre de la partida<input id="m12ncS" placeholder="Ej. ${esc(NC.club||'Mi carrera')} 2026" value="${esc(($('saveName')||{}).value||'')}"></label><label>Dificultad<div class="sl"><select id="m12ncD">${['Normal','Difícil','Experto'].map(d=>opt(d,d,($('difficulty')||{}).value||'Normal')).join('')}</select>${sv('chev')}</div></label></div></div>
 <button class="go1" onclick="MC12.ncGo()" ${NC.club?'':'disabled'}>COMENZAR CARRERA ${sv('arrow')}</button>${sc?`<p class="cho">Vas a dirigir a <b>${esc(sc[0])}</b> · ${esc((LGT()[sc[1]]||{}).nombre||sc[1])}</p>`:''}</div>`;
 icons(box);const on=box.querySelector('.lc1.on');if(on)on.scrollIntoView({block:'nearest',inline:'center'})}
let TQ=null;
M.ncR=r=>{NC.reg=r;NC.country=null;ncBuild()};M.ncC=c=>{NC.country=c;NC.club=null;NC.q='';ncBuild()};
M.ncK=(k,c)=>{NC.club=k;NC.country=c;if(!countries().includes(c))NC.reg='';ncBuild()};
M.ncQ=v=>{NC.q=v;clearTimeout(TQ);TQ=setTimeout(()=>{ncBuild();const e=$('m12ncq');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length)}},250)};
M.ncGo=()=>{if(!NC.club)return;try{const cs=$('country');cs.value=NC.country;fillClubs();$('clubChoice').value=NC.club;$('manager').value=($('m12ncM').value||'').trim();$('saveName').value=($('m12ncS').value||'').trim()||(NC.club+' '+new Date().getFullYear());$('difficulty').value=$('m12ncD').value;createCareer()}catch(e){warn('nueva partida',e)}};
M.ncBuild=ncBuild;

/* ---------- arranque ---------- */
function boot6(){try{
 after('go',()=>{const id=(document.querySelector('.page.active')||{}).id;if(id==='newcareer'){if(!NC.country){const v=($('country')||{}).value;if(v)NC.country=v}ncBuild()}});
 after('selectHomeLeague',c=>{NC.country=c;NC.club=null;NC.reg='';ncBuild()});
 after('createCareer',()=>{RES=null;NATS=null;LGS=null});
 if(document.querySelector('#newcareer.active'))ncBuild();
}catch(e){warn('rehechas',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot6);else setTimeout(boot6,0);
})();

