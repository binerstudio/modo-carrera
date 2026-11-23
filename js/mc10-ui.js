/* ===== MODO CARRERA 10.0 · PANTALLAS =====
   Buscador mundial (continente › país › liga › club + búsqueda directa), sección Mundo (torneos, selecciones,
   rankings, historial, entrenadores, traspasos, ligas del mundo), pestaña Copa, goleadores y mercado mundial.
   Respeta la identidad visual: fondo azul noche/negro, detalles dorados, tarjetas y navegación inferior.
*/
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const q=s=>"'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const M=window.MC10||{META:{},flag:()=>'🏳️',confOf:()=>'—',regOf:()=>'—'};
const flag=c=>M.flag(c);
const money=v=>window.mcMoney?mcMoney(v):'$'+v+'M';
const REGS=['Europa','Sudamérica','Norteamérica','Asia','África','Oceanía'];
const REG_ICON={Europa:'🇪🇺',Sudamérica:'🌎',Norteamérica:'🌎',Asia:'🌏',África:'🌍',Oceanía:'🌏'};
/* ---------- estilos de las nuevas secciones (misma paleta: azul noche, negro, dorado) ---------- */
const css=document.createElement('style');css.id='mc10-css';css.textContent=`
.mc10-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.mc10-chips::-webkit-scrollbar{display:none}
.mc10-chip{flex:0 0 auto;padding:8px 12px;border-radius:999px;border:1px solid #3a86ffaa;background:linear-gradient(180deg,#123068cc,#07173ecc);color:#fff;font:800 12px var(--f);letter-spacing:.03em}
.mc10-chip.on{background:linear-gradient(180deg,#ffe27a,#f0a800);color:#2a1a00;border-color:#fff3b0;box-shadow:0 0 12px #ffc83d55}
.mc10-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.mc10-cty{display:flex;align-items:center;gap:9px;padding:10px;border-radius:14px;border:1px solid #2f7bff66;background:linear-gradient(180deg,#0f2550,#08163a);color:#fff;text-align:left;font:700 13px/1.15 var(--f);min-height:58px}
.mc10-cty .fl{font-size:24px;line-height:1}.mc10-cty small{display:block;color:var(--muted);font-weight:600;font-size:11px;margin-top:2px}
.mc10-cty.on{border-color:var(--gold);box-shadow:0 0 14px #ffc83d55}
.mc10-clubs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.mc10-club{display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 4px;border-radius:14px;border:1px solid #2f7bff55;background:#0a1a3a;color:#fff;font:700 11px/1.1 var(--f);text-align:center;min-height:92px}
.mc10-club.on{border-color:var(--gold);background:linear-gradient(180deg,#2a2208,#0a1a3a);box-shadow:0 0 14px #ffc83d55}.mc10-club em{font-style:normal;color:var(--gold);font-size:10px}
.mc10-res{display:flex;align-items:center;gap:9px;padding:9px 6px;border-bottom:1px solid #ffffff12;color:#fff;background:none;border-left:0;border-right:0;border-top:0;width:100%;text-align:left;font:600 13px var(--f)}
.mc10-res small{color:var(--muted);display:block;font-size:11px}
.mc10-sel{display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;border:1px solid var(--gold);background:linear-gradient(180deg,#2a2208aa,#0a1a3a)}
.mc10-step{font:800 11px var(--f);letter-spacing:.12em;color:var(--gold);margin:12px 0 6px}
.mc10-z-rel td:first-child{box-shadow:inset 3px 0 0 #e5484d}.mc10-z-po td:first-child{box-shadow:inset 3px 0 0 #3ccf6e}
.mc10-tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;scrollbar-width:none}.mc10-tabs::-webkit-scrollbar{display:none}
.mc10-tabs button{flex:0 0 auto;padding:9px 12px;border-radius:14px;background:linear-gradient(180deg,#123068cc,#07173ecc);border:1px solid #3a86ffaa;color:#fff;font:700 12px var(--f)}
.mc10-tabs button.on{background:linear-gradient(180deg,#ffe27a,#f0a800);color:#2a1a00;border-color:#fff3b0}
.mc10-badge-est{font:700 9px var(--f);color:#ffb347;border:1px solid #ffb34766;border-radius:6px;padding:0 4px;margin-left:4px}.mc10-badge-gen{color:#ff6b6b;border-color:#ff6b6b66}
.mc10-world-btn{display:flex;align-items:center;justify-content:center;gap:8px}
`;document.head.appendChild(css);
/* =========================================================
   1) BUSCADOR MUNDIAL (nueva carrera)
   ========================================================= */
const F={reg:'',country:'',club:'',q:''};
const leagueCountries=()=>LEAGUE_ORDER.filter(c=>CLUBS[c]&&CLUBS[c].length);
function regOf(c){return c==='Argentina'?'Sudamérica':M.regOf(c)}
function stars(club){const s=window.mcClubStrength?mcClubStrength(club):60;const n=s>=80?5:s>=74?4:s>=68?3:s>=60?2:1;return '★'.repeat(n)+'☆'.repeat(5-n)}
function finderHTML(){const all=leagueCountries();const qq=fold(F.q);let h='';
 h+=`<div class="mc10-step">BUSCADOR MUNDIAL · ${all.length} LIGAS · ${all.reduce((a,c)=>a+CLUBS[c].length,0).toLocaleString('es')} CLUBES</div>
 <label class="sr" style="margin:0 0 8px;display:flex"><input id="mc10Q" placeholder="Buscar liga, país o club…" value="${esc(F.q)}" oninput="mc10FinderQ(this.value)" autocomplete="off" autocapitalize="off" style="width:100%"></label>`;
 if(qq.length>=2){const res=[];all.forEach(c=>{const L=LEAGUES[c];if(fold(c).includes(qq)||fold(L.nombre).includes(qq))res.push({t:'l',c});CLUBS[c].forEach(cl=>{if(fold(cl).includes(qq))res.push({t:'c',c,cl})})});
  h+=`<div class="card" style="padding:6px 10px">${res.slice(0,40).map(r=>r.t==='l'?`<button class="mc10-res" onclick="mc10Pick('country',${q(r.c)})"><span style="font-size:22px">${flag(r.c)}</span><span><b>${esc(LEAGUES[r.c].nombre)}</b><small>${esc(r.c)} · ${CLUBS[r.c].length} clubes · ${esc(M.confOf(r.c)||'')}</small></span></button>`:`<button class="mc10-res" onclick="mc10Pick('club',${q(r.cl)},${q(r.c)})">${clubBadge(r.cl,28)}<span><b>${esc(r.cl)}</b><small>${flag(r.c)} ${esc(LEAGUES[r.c].nombre)} · ${stars(r.cl)}</small></span></button>`).join('')||'<p class="tiny">Sin resultados.</p>'}${res.length>40?`<p class="tiny">${res.length-40} resultados más: refiná la búsqueda.</p>`:''}</div>`}
 h+=`<div class="mc10-step">1 · CONTINENTE</div><div class="mc10-chips">${['',...REGS].map(r=>`<button class="mc10-chip${F.reg===r?' on':''}" onclick="mc10Pick('reg',${q(r)})">${r?REG_ICON[r]+' '+r:'🌐 Todos'}</button>`).join('')}</div>`;
 const cs=all.filter(c=>!F.reg||regOf(c)===F.reg).sort((a,b)=>(a==='Argentina'?-1:b==='Argentina'?1:0)||a.localeCompare(b,'es'));
 h+=`<div class="mc10-step">2 · PAÍS Y LIGA (${cs.length})</div><div class="mc10-grid" style="max-height:${F.country?'150px':'420px'};overflow:auto">${cs.map(c=>`<button class="mc10-cty${F.country===c?' on':''}" onclick="mc10Pick('country',${q(c)})"><span class="fl">${flag(c)}</span><span>${esc(c)}<small>${esc(LEAGUES[c].nombre)} · ${CLUBS[c].length}</small></span></button>`).join('')}</div>`;
 if(F.country){const L=LEAGUES[F.country];const clubs=CLUBS[F.country].slice().sort((a,b)=>(mcClubStrength(b)||0)-(mcClubStrength(a)||0));
  h+=`<div class="mc10-step">3 · CLUBES DE ${esc(L.nombre.toUpperCase())}</div><p class="tiny" style="margin:0 0 6px">${flag(F.country)} ${esc(F.country)} · ${esc(M.confOf(F.country)||'')} · ${clubs.length} clubes · ${L.fecha} fechas. ${esc(L.formato||'')}</p>
  <div class="mc10-clubs">${clubs.map(c=>`<button class="mc10-club${F.club===c?' on':''}" onclick="mc10Pick('club',${q(c)},${q(F.country)})">${clubBadge(c,34)}<span>${esc(c)}</span><em>${stars(c)}</em></button>`).join('')}</div>`}
 if(F.club){h+=`<div class="mc10-step">4 · TU CLUB</div><div class="mc10-sel">${clubBadge(F.club,44)}<div><b style="font-size:16px">${esc(F.club)}</b><div class="tiny muted">${flag(F.country)} ${esc(LEAGUES[F.country].nombre)} · ${stars(F.club)} · plantel ${(window.rosterFor?rosterFor(F.club).length:0)} jugadores</div></div></div>`}
 return h}
function renderFinder(){const box=$('mc10Finder');if(!box)return;box.innerHTML=finderHTML();const i=$('mc10Q');if(i&&document.activeElement&&document.activeElement.id==='mc10Q'){}}
window.mc10FinderQ=function(v){F.q=v;clearTimeout(window._mc10fq);window._mc10fq=setTimeout(()=>{renderFinder();const i=$('mc10Q');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},140)};
window.mc10Pick=function(k,v,c){if(k==='reg'){F.reg=v;F.country='';F.club=''}else if(k==='country'){F.country=v;F.club='';F.q=''}else if(k==='club'){F.club=v;F.country=c;F.q=''}
 const sel=$('country');if(sel&&F.country){if(![...sel.options].some(o=>o.value===F.country)){const o=document.createElement('option');o.value=F.country;o.textContent=F.country;sel.appendChild(o)}sel.value=F.country;try{fillClubs()}catch(e){}}
 if(F.club&&$('clubChoice')){$('clubChoice').value=F.club;try{showClubBadge()}catch(e){}}
 renderFinder();if(k==='club'){const b=document.querySelector('#newcareer .mc10-go');if(b)b.scrollIntoView({behavior:'smooth',block:'center'})}};
function installFinder(){const sec=$('newcareer');if(!sec||$('mc10Finder'))return;const card=sec.querySelector('.card');if(!card)return;
 const sel=$('country');const hideUntil=$('manager');
 /* oculta los selectores viejos (se siguen usando internamente) */
 let n=sel?sel.previousElementSibling:null;const toHide=[];if(n&&n.tagName==='LABEL')toHide.push(n);
 let x=sel;while(x&&x!==hideUntil){if(x.tagName!=='LABEL'||x.nextElementSibling!==hideUntil)toHide.push(x);x=x.nextElementSibling;if(x&&x.tagName==='LABEL'&&x.nextElementSibling===hideUntil)break}
 toHide.forEach(e=>{e.style.display='none'});
 const box=document.createElement('div');box.id='mc10Finder';sel.parentNode.insertBefore(box,sel);
 const btn=card.querySelector('button.btn');if(btn){btn.classList.add('mc10-go');const o=btn.getAttribute('onclick');btn.setAttribute('onclick','mc10Create()')}
 const cur=sel&&sel.value;F.country=F.country||cur||'';renderFinder()}
window.mc10Create=function(){if(!F.club){F.club=$('clubChoice')&&$('clubChoice').value;F.country=$('country')&&$('country').value}
 if(!F.club){xToast&&xToast('Elegí un club en el buscador');return}
 $('country').value=F.country;try{fillClubs()}catch(e){}$('clubChoice').value=F.club;createCareer()};
/* inicio: solo las ligas destacadas + acceso al buscador (no una lista interminable) */
window.buildLeagueUI=function(){const sel=$('country');if(sel)sel.innerHTML=LEAGUE_ORDER.map(c=>`<option value="${esc(c)}">${esc(LEAGUES[c].nombre)} (${esc(c)})</option>`).join('');
 const box=document.querySelector('.x-leagues');if(!box)return;const feat=['Argentina','Inglaterra','España','Italia','Alemania','Francia','Brasil','Estados Unidos'];
 box.innerHTML=feat.filter(c=>LEAGUES[c]).map((c,i)=>`<button class="x-lg${i===0?' sel':''}" data-c="${esc(c)}" onclick="selectHomeLeague(${q(c)})"><i style="background:${LEAGUES[c].color}">${esc(LEAGUES[c].abrev)}</i>${esc(LEAGUES[c].nombre.toUpperCase()).replace(/ /,'<br>')}</button>`).join('')+
 `<button class="x-lg mc10-world-btn" style="grid-column:1/-1;flex-direction:row;min-height:48px;border-color:var(--gold)" onclick="mc10OpenFinder()">🌍 BUSCAR ENTRE ${leagueCountries().length} LIGAS DEL MUNDO</button>`};
window.selectHomeLeague=function(country){F.country=country;F.club='';F.reg='';go('newcareer');const s=$('country');if(s){s.value=country;try{fillClubs()}catch(e){}}renderFinder()};
window.mc10OpenFinder=function(){F.country='';F.club='';go('newcareer');renderFinder();setTimeout(()=>{const i=$('mc10Q');if(i)i.focus()},120)};
/* =========================================================
   2) SECCIÓN MUNDO
   ========================================================= */
let WT='comps',WSUB={};
function ensureWorldPage(){if($('world'))return;const s=document.createElement('section');s.id='world';s.className='page';
 s.innerHTML=`<div class="eyebrow">MODO CARRERA 11.0</div><h1>Mundo</h1><div class="mc10-tabs" id="mc10WTabs"></div><div id="mc10WBody"></div>`;
 const ref=$('more')||document.querySelector('.page:last-of-type');ref.parentNode.insertBefore(s,ref)}
const WTABS=[['comps','🏆 Torneos'],['nt','🌐 Selecciones'],['rank','📈 Rankings'],['leagues','🗺️ Ligas'],['hist','📜 Historial'],['coach','🧑‍💼 Entrenadores'],['moves','🔁 Traspasos']];
window.mc10World=function(tab){if(tab)WT=tab;go('world')};
function renderWorld(){ensureWorldPage();if(!career)return;$('mc10WTabs').innerHTML=WTABS.map(([k,l])=>`<button class="${WT===k?'on':''}" onclick="mc10World('${k}')">${l}</button>`).join('');
 const b=$('mc10WBody');try{b.innerHTML=({comps:compsView,nt:ntView,rank:rankView,leagues:leaguesView,hist:histView,coach:coachView,moves:movesView}[WT]||compsView)()}catch(e){console.error(e);b.innerHTML='<div class="card"><p>No se pudo mostrar esta sección.</p></div>'}}
window.mc10RenderWorld=renderWorld;
const tie=(t,show)=>{const mine=t.a===career.club||t.b===career.club;const r=t.agg?`${t.agg[0]} - ${t.agg[1]}`:(t.legs&&t.legs[0]?`${t.legs[0][0]===t.a?t.legs[0][2]:t.legs[0][3]} - ${t.legs[0][0]===t.a?t.legs[0][3]:t.legs[0][2]}`:'vs');
 return `<div class="mc-fx${mine?' you':''}"><span class="mc-t h"><span>${esc(t.a)}</span>${clubBadge(t.a,18)}</span><b class="mc-s${t.w==null?' p':''}">${t.b==null?'pasa':r}</b><span class="mc-t a">${t.b?clubBadge(t.b,18):''}<span>${esc(t.b||'')}</span></span></div>${t.pen?`<div class="tiny muted" style="text-align:center">Penales ${t.pen[0]}-${t.pen[1]} · pasa ${esc(t.w)}</div>`:t.w&&t.agg&&show?`<div class="tiny muted" style="text-align:center">Pasa ${esc(t.w)}</div>`:''}`};
function grpHTML(st){const T=window.MC10W;return st.groups.map((g,gi)=>{const t=T.grpTable(st,gi);return `<div class="mc-tw"><table class="table mc-tbl"><tr><th>#</th><th class="cl">${st.swiss?'Fase liga':'Grupo '+String.fromCharCode(65+gi)}</th><th>PJ</th><th>DG</th><th>PTS</th></tr>${t.map((r,i)=>`<tr class="${r.name===career.club?'you':''}"><td>${i+1}</td><td class="cl"><span class="mc-cl">${clubBadge(r.name,16)}<span>${esc(r.name)}</span></span></td><td>${r.pj}</td><td>${r.dg>0?'+':''}${r.dg}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table></div>`}).join('')}
function compHTML(c){const st=c.stages[c.si];let h=`<div class="card"><div class="between"><div><div class="eyebrow">${esc(c.kind==='cup'?'COPA NACIONAL':(c.conf||'')+' · INTERNACIONAL')}</div><h2>${esc(c.name)}</h2></div>${c.champ?`<span class="tag">🏆 ${esc(c.champ)}</span>`:`<span class="tag">${esc(st?st.name:'')}</span>`}</div><p class="tiny">${c.teams.length} equipos${c.teams.includes(career.club)?' · tu club participa':''}.${c.kind==='cont'?' Formato adaptado al simulador (sin rondas previas; los cupos salen del ranking de países).':''}</p>`;
 c.stages.slice().reverse().forEach(s=>{h+=`<div class="mc10-step">${esc(s.name.toUpperCase())}${s.type==='ko'&&s.legs===2?' · IDA Y VUELTA':''}</div>`;h+=s.type==='grp'?grpHTML(s):s.ties.map(t=>tie(t,true)).join('')});
 return h+'</div>'}
function compsView(){const w=mcWorld();window.mcEnsureComps&&mcEnsureComps();const list=(w.comps&&w.comps.list)||[];const sel=WSUB.comp||((list.find(c=>c.teams.includes(career.club))||list[0]||{}).id);
 const mine=list.filter(c=>c.teams.includes(career.club));
 let h=`<div class="card"><div class="eyebrow">TEMPORADA ${career.season}/${String(career.season+1).slice(-2)}</div><h2>Competiciones</h2><p class="tiny">${mine.length?'Tu club juega: '+mine.map(c=>esc(c.name)).join(', ')+'.':'Tu club no disputa torneos internacionales esta temporada.'}</p>
 <select onchange="WSUBset('comp',this.value)">${['UEFA','CONMEBOL','CONCACAF','AFC','CAF','OFC',null].map(cf=>{const cs=list.filter(c=>cf?c.conf===cf:c.kind==='cup');return cs.length?`<optgroup label="${cf||'Copas nacionales'}">${cs.map(c=>`<option value="${c.id}"${c.id===sel?' selected':''}>${esc(c.name)}${c.teams.includes(career.club)?' ★':''}</option>`).join('')}</optgroup>`:''}).join('')}</select></div>`;
 const c=list.find(x=>x.id===sel);if(c)h+=compHTML(c);return h}
window.WSUBset=function(k,v){WSUB[k]=v;renderWorld()};
function ntView(){const st=mcNTState(),T=window.MC10W;const cf=WSUB.ntc||'';const r=mcNTRanking(cf||null);const nat=WSUB.nat||(career.players.map(p=>p.nat).find(n=>n&&n!=='—'&&st.pts[n])||r[0]);
 const sq=T.ntSquad(nat),coach=mcNTCoach(nat);const mine=new Set(career.players.map(p=>fold(p.name)));const xi=mcOrderXI(sq.map(x=>[x.name,x.pos,x.rating,x])).slice(0,11).map(x=>x[3]);
 const next=[];for(let y=career.season+1;y<=career.season+4;y++)T.ntTournaments(y).forEach(t=>next.push(t.name));
 let h=`<div class="card"><div class="eyebrow">SELECCIONES NACIONALES</div><h2>${flag(nat)} ${esc(nat)}</h2><div class="statsrow"><span>Ranking ${esc(M.confOf(nat)||'')}</span><b>${mcNTRanking(M.confOf(nat)).indexOf(nat)+1}º · ${st.pts[nat]||'—'} pts</b></div><div class="statsrow"><span>Entrenador</span><b>${esc(coach.name)} <span class="mc10-badge-est">GENERADO</span></b></div><div class="statsrow"><span>Formación · estilo</span><b>${esc(coach.form)} · ${esc(coach.style)}</b></div><div class="statsrow"><span>GRL del once</span><b>${Math.round(T.ntStrength(nat))}</b></div>
 <select onchange="WSUBset('nat',this.value)">${Object.keys(st.pts).sort((a,b)=>a.localeCompare(b,'es')).map(n=>`<option${n===nat?' selected':''}>${esc(n)}</option>`).join('')}</select></div>`;
 h+=`<div class="card"><h2>Convocatoria (${sq.length})</h2><p class="tiny">Se convoca a los mejores por posición según GRL y nivel. ★ = titular · tus jugadores en dorado.</p>${sq.map(p=>`<div class="statsrow"><span>${xi.includes(p)?'★ ':''}<span class="pp ${p.pos}">${p.pos}</span> ${mine.has(fold(p.name))?'<b class="gold">'+esc(p.name)+'</b>':esc(p.name)} <span class="muted">· ${esc(p.club)}</span></span><b>${p.rating}</b></div>`).join('')||'<p class="tiny">Sin jugadores registrados de esta nacionalidad.</p>'}</div>`;
 h+=`<div class="card"><h2>Ranking mundial</h2><div class="mc10-chips">${['','UEFA','CONMEBOL','CONCACAF','AFC','CAF','OFC'].map(c=>`<button class="mc10-chip${cf===c?' on':''}" onclick="WSUBset('ntc','${c}')">${c||'Mundial'}</button>`).join('')}</div>${r.slice(0,30).map((n,i)=>`<div class="statsrow"><span>${i+1}. ${flag(n)} ${esc(n)}</span><b>${st.pts[n]}</b></div>`).join('')}</div>`;
 h+=`<div class="card"><h2>Próximos torneos</h2>${next.map(n=>`<div class="statsrow"><span>${esc(n)}</span></div>`).join('')}<p class="tiny">Fechas FIFA durante la temporada (amistosos y eliminatorias). La clasificación a los torneos se resuelve con el ranking de cada confederación (adaptación del simulador; la Copa Asiática se juega a mitad de temporada y el resto al terminarla).</p></div>`;
 const hist=mcWorld().ntHist||[];if(hist.length)h+=`<div class="card"><h2>Torneos disputados</h2>${hist.map(t=>`<div class="statsrow"><span>${esc(t.name)}</span><b class="gold">🏆 ${flag(t.champ)} ${esc(t.champ)}</b></div><div class="tiny muted" style="margin:-4px 0 6px">Final: ${esc(t.final[0])} ${t.final[2]}-${t.final[3]} ${esc(t.final[1])}${t.final[4]?' (pen. '+t.final[4][0]+'-'+t.final[4][1]+')':''}</div>`).join('')}</div>`;
 return h}
function rankView(){const w=mcWorld(),s=career.season;const clubs=Object.entries(w.coef||{}).map(([c,o])=>{let t=0;for(let y=s-4;y<=s;y++)t+=(o[y]||0);return[c,t]}).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
 const confs=['UEFA','AFC','CAF'];let h=`<div class="card"><div class="eyebrow">COEFICIENTES</div><h2>Ranking de clubes</h2><p class="tiny">Puntos de los últimos 5 años en torneos continentales: 2 por victoria, 1 por empate y 1 por cada ronda superada.</p>${clubs.slice(0,40).map((x,i)=>`<div class="statsrow"><span>${i+1}. ${clubBadge(x[0],16)} ${esc(x[0])} <span class="muted">${flag(mcCountryOf(x[0]))}</span></span><b>${x[1]}</b></div>`).join('')||'<p class="tiny">Todavía no se jugaron partidos internacionales esta carrera.</p>'}</div>`;
 confs.forEach(cf=>{const r=mcCountryRank(cf);h+=`<div class="card"><h2>Ranking de países · ${cf}</h2><p class="tiny">Define los cupos de la próxima temporada. Arranca con el ranking real aproximado y cambia con los resultados.</p>${r.slice(0,20).map((c,i)=>{const o=(w.ctry||{})[c]||{};let t=0;for(let y=s-5;y<s;y++)t+=(o[y]||0);return `<div class="statsrow"><span>${i+1}. ${flag(c)} ${esc(c)}</span><b>${t?t.toFixed(2):'—'}</b></div>`}).join('')}</div>`});
 return h}
function leaguesView(){const cs=leagueCountries();const c=WSUB.lg||career.country;const L=LEAGUES[c]||{};
 let h=`<div class="card"><div class="eyebrow">LIGAS DEL MUNDO</div><h2>${flag(c)} ${esc(L.nombre||c)}</h2><select onchange="WSUBset('lg',this.value)">${REGS.map(r=>`<optgroup label="${r}">${cs.filter(x=>regOf(x)===r).sort((a,b)=>a.localeCompare(b,'es')).map(x=>`<option value="${esc(x)}"${x===c?' selected':''}>${esc(x)} · ${esc(LEAGUES[x].nombre)}</option>`).join('')}</optgroup>`).join('')}</select><p class="tiny">${esc(L.formato||'')} Copa: ${esc(L.copa||'—')}.</p></div>`;
 if(c===career.country){h+=`<div class="card"><p class="tiny">Es tu liga: la tabla completa está en Competición.</p><button class="btn secondary" style="width:100%" onclick="go('league')">VER MI LIGA</button></div>`;return h}
 const Lm=career.league;const frac=Lm?Math.min(1,career.round/Math.max(1,Lm.total||Lm.rounds.length)):0;const t=MC10W.finalTable(c,career.season,Math.round(frac*20)/20);
 h+=`<div class="card"><h2>Tabla ${frac<1?'en curso':'final'}</h2><p class="tiny">Se juega en simultáneo con tu liga (resultados simulados según el GRL).</p><div class="mc-tw"><table class="table mc-tbl"><tr><th>#</th><th class="cl">Club</th><th>PJ</th><th>DG</th><th>PTS</th></tr>${t.map((r,i)=>`<tr><td>${i+1}</td><td class="cl"><span class="mc-cl">${clubBadge(r.name,16)}<span>${esc(r.name)}</span></span></td><td>${r.pj}</td><td>${r.dg>0?'+':''}${r.dg}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table></div></div>`;
 return h}
function histView(){const w=mcWorld();const H=w.hist||[];if(!H.length)return '<div class="card"><h2>Historial</h2><p>El historial se completa al terminar cada temporada: campeones de todas las ligas, copas, torneos continentales y de selecciones, goleadores y tu campaña.</p></div>';
 return H.map(x=>`<div class="card"><div class="eyebrow">TEMPORADA ${x.season}/${String(x.season+1).slice(-2)}</div><h2>${esc(x.club)} · ${x.pos}º</h2>
 <div class="statsrow"><span>${esc(leagueName(x.country))}</span><b class="gold">🏆 ${esc(x.league)}</b></div>${x.runner?`<div class="statsrow"><span>Subcampeón</span><b>${esc(x.runner)}</b></div>`:''}
 ${Object.entries(x.cups||{}).map(([n,c])=>`<div class="statsrow"><span>${esc(n)}</span><b>${esc(c||'—')}</b></div>`).join('')}
 ${Object.entries(x.cont||{}).filter(e=>e[1]).map(([id,c])=>`<div class="statsrow"><span>${esc(contName(id))}</span><b>${esc(c)}</b></div>`).join('')}
 ${(x.nt||[]).map(n=>`<div class="statsrow"><span>${esc(n.name)}</span><b>${flag(n.champ)} ${esc(n.champ)}</b></div>`).join('')}
 ${x.top&&x.top.g?`<div class="statsrow"><span>Goleador</span><b>${esc(x.top.g[0])} (${esc(x.top.g[1])}) · ${x.top.g[2]}</b></div>`:''}${x.top&&x.top.a?`<div class="statsrow"><span>Asistidor</span><b>${esc(x.top.a[0])} · ${x.top.a[2]}</b></div>`:''}${x.top&&x.top.cs?`<div class="statsrow"><span>Valla invicta</span><b>${esc(x.top.cs[0])} · ${x.top.cs[2]}</b></div>`:''}
 <details><summary class="tiny gold">Campeones de las demás ligas (${Object.keys(x.leagues||{}).length})</summary>${Object.entries(x.leagues||{}).sort((a,b)=>a[0].localeCompare(b[0],'es')).map(([c,n])=>`<div class="statsrow"><span>${flag(c)} ${esc(c)}</span><b>${esc(n)}</b></div>`).join('')}</details>
 <details><summary class="tiny gold">Tabla final</summary>${(x.table||[]).map((r,i)=>`<div class="statsrow"><span>${i+1}. ${esc(r[0])}</span><b>${r[1]} pts</b></div>`).join('')}</details></div>`).join('')}
const CN={ucl:'UEFA Champions League',uel:'UEFA Europa League',uecl:'UEFA Conference League',lib:'Copa Libertadores',sud:'Copa Sudamericana',acle:'AFC Champions League Elite',acl2:'AFC Champions League Two',aclc:'AFC Challenge League',cafcl:'CAF Champions League',cafcc:'CAF Confederation Cup',ccc:'CONCACAF Champions Cup',cacc:'Concacaf Central American Cup',cacb:'Concacaf Caribbean Cup',ofccl:'OFC Champions League','sup-ucl':'UEFA Super Cup','sup-lib':'Recopa Sudamericana','sup-cafcl':'CAF Super Cup'};
const contName=id=>CN[id]||id;
function coachView(){const w=mcWorld();let h='';
 if(career.firedPending){const off=mcJobOffers();h+=`<div class="card" style="border-color:#e5484d"><div class="eyebrow" style="color:#ff8a8a">⚠ FUISTE DESPEDIDO</div><h2>Ofertas disponibles</h2>${off.map(o=>`<div class="statsrow"><span>${clubBadge(o,18)} ${esc(o)} · ${esc(leagueName(mcCountryOf(o)))}</span><button class="btn small" onclick="mcChangeClub(${q(o)},true)">FIRMAR</button></div>`).join('')||'<p class="tiny">Por ahora no hay ofertas. Seguí al frente hasta fin de temporada.</p>'}</div>`}
 const L=career.league;const teams=L?L.teams:CLUBS[career.country]||[];
 h+=`<div class="card"><div class="eyebrow">ENTRENADORES · ${esc(leagueName(career.country))}</div><h2>Bancos de la liga</h2><p class="tiny">Los entrenadores de los demás clubes son generados por el simulador (no son datos reales). Cada uno tiene estilo, formación preferida, reputación, nivel, contrato y salario; su nivel influye en el rendimiento del equipo.</p>
 ${teams.map(c=>{const x=mcCoachOf(c);return `<div class="statsrow"><span>${clubBadge(c,16)} <b>${esc(x.name)}</b>${x.user?' <span class="tag">VOS</span>':''}<span class="tiny muted" style="display:block">${esc(c)} · ${esc(x.form)} · ${esc(x.style)}${x.user?'':' · rep. '+x.rep+' · contrato '+x.contract+' año/s · '+money(x.wage)}</span></span><b>${x.user?'—':x.lvl}</b></div>`}).join('')}</div>`;
 h+=`<div class="card"><h2>Cambios de entrenador</h2>${(w.coachLog||[]).slice(0,30).map(x=>`<div class="statsrow"><span>${x.season}/${String(x.season+1).slice(-2)} · ${esc(x.club)}<span class="tiny muted" style="display:block">Sale ${esc(x.out)} · llega ${esc(x.in)}</span></span><b class="tiny">${esc(x.why)}</b></div>`).join('')||'<p class="tiny">Sin cambios por ahora.</p>'}</div>`;
 const pool=(w.coachPool||[]).slice(0,10);if(pool.length)h+=`<div class="card"><h2>Entrenadores libres</h2>${pool.map(x=>`<div class="statsrow"><span>${esc(x.name)} <span class="muted">${flag(x.nat)}</span></span><b>${x.lvl}</b></div>`).join('')}</div>`;
 return h}
function movesView(){const w=mcWorld();const A=w.aiMoves||[];let h=`<div class="card"><div class="eyebrow">MERCADO MUNDIAL</div><h2>Traspasos</h2><p class="tiny">Al cerrar cada temporada los clubes del mundo hacen sus fichajes. El club del jugador se actualiza en toda la base: planteles, mercado y selecciones.</p>
 ${(career.transferHistory||[]).slice().reverse().slice(0,15).map(x=>`<div class="statsrow"><span>${esc(x.name)}</span><b>${esc(x.detail)}</b></div>`).join('')}</div>`;
 A.forEach(s=>{h+=`<div class="card"><h2>Verano ${s.season+1}</h2>${s.moves.map(m=>`<div class="statsrow"><span><b>${esc(m[0])}</b><span class="tiny muted" style="display:block">${esc(m[1])} → ${esc(m[2])}</span></span><b>${money(m[3])}</b></div>`).join('')}</div>`});
 if(!A.length)h+='<div class="card"><p class="tiny">Los traspasos de la IA aparecen después de la primera temporada.</p></div>';return h}
/* navegación: la página Mundo necesita una carrera activa */
(function(){const o=window.go;window.go=function(id){if(id==='world'&&!career)id='newcareer';const r=o.apply(this,arguments);if(id==='world'){ensureWorldPage();document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='world'));renderWorld();window.scrollTo(0,0)}if(id==='newcareer'){installFinder();renderFinder()}return r}})();
/* =========================================================
   3) COMPETICIÓN: pestaña Copa y goleadores
   ========================================================= */
window.mcCupsHTML=function(){const w=mcWorld();window.mcEnsureComps&&mcEnsureComps();const list=(w.comps&&w.comps.list||[]).filter(c=>c.kind==='cup'||c.teams.includes(career.club));
 return (list.map(compHTML).join('')||'<div class="card"><p>No hay copas cargadas para esta liga.</p></div>')+`<button class="btn secondary x-go" onclick="mc10World('comps')">🌍 VER TODOS LOS TORNEOS DEL MUNDO</button>`};
window.mcScorersHTML=function(){const w=mcWorld(),B=(w.stats[career.season]||{}).liga||{g:{},a:{},cs:{}};const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1][1]-a[1][1]).slice(0,n);
 const sec=(t,o,u)=>`<div class="card"><h2>${t}</h2>${top(o,15).map(([n,v],i)=>`<div class="statsrow"><span>${i+1}. ${v[0]===career.club?'<b class="gold">'+esc(n)+'</b>':esc(n)} <span class="muted">· ${esc(v[0])}</span></span><b>${v[1]} ${u}</b></div>`).join('')||'<p class="tiny">Se completa a medida que se juegan las fechas.</p>'}</div>`;
 return sec('Goleadores de la liga',B.g,'goles')+sec('Asistidores',B.a,'asist.')+sec('Vallas invictas',B.cs,'')+`<div class="card"><h2>Tu plantel</h2>${[...career.players].sort((a,b)=>b.goals-a.goals).slice(0,10).map(p=>`<div class="statsrow"><span>${esc(p.name)}</span><b>${p.goals} goles · ${p.assists||0} asist.</b></div>`).join('')}</div>`};
/* =========================================================
   4) MERCADO MUNDIAL
   ========================================================= */
function ensureConfFilter(){const f=$('mkFilters');if(!f||$('mkConf'))return;const s=document.createElement('select');s.id='mkConf';s.setAttribute('onchange','mc10ConfChanged()');
 s.innerHTML='<option value="">Continente (todos)</option>'+REGS.map(r=>`<option>${r}</option>`).join('')+'<optgroup label="Confederación">'+['UEFA','CONMEBOL','CONCACAF','AFC','CAF','OFC'].map(c=>`<option value="cf:${c}">${c}</option>`).join('')+'</optgroup>';
 f.insertBefore(s,f.firstChild);
 const p=document.createElement('select');p.id='mkCountry';p.setAttribute('onchange','mc10CountryChanged()');f.insertBefore(p,s.nextSibling);fillCountry()}
function fillCountry(){const p=$('mkCountry');if(!p)return;const cf=$('mkConf')?$('mkConf').value:'';const cs=leagueCountries().filter(c=>!cf||(cf.startsWith('cf:')?(c==='Argentina'?'CONMEBOL':M.confOf(c))===cf.slice(3):regOf(c)===cf)).sort((a,b)=>a.localeCompare(b,'es'));
 const cur=p.value;p.innerHTML='<option value="">País / liga (todos)</option>'+cs.map(c=>`<option value="${esc(c)}">${esc(c)} · ${esc(LEAGUES[c].nombre)}</option>`).join('');if(cs.includes(cur))p.value=cur}
window.mc10ConfChanged=function(){fillCountry();const l=$('mkLeague');if(l)l.value='';renderMarket()};
window.mc10CountryChanged=function(){const l=$('mkLeague');if(l){const v=$('mkCountry').value;if(v&&![...l.options].some(o=>o.value===v)){const o=document.createElement('option');o.value=v;o.textContent=LEAGUES[v].nombre;l.appendChild(o)}l.value=v;try{mcLeagueChanged()}catch(e){renderMarket()}}};
(function(){const o=window.mcFillFilters;window.mcFillFilters=function(){const r=o&&o.apply(this,arguments);ensureConfFilter();
 const l=$('mkLeague');if(l){l.innerHTML='<option value="">Liga (todas)</option>'+REGS.map(rg=>`<optgroup label="${rg}">${leagueCountries().filter(c=>regOf(c)===rg).sort((a,b)=>a.localeCompare(b,'es')).map(c=>`<option value="${esc(c)}">${esc(LEAGUES[c].nombre)} (${esc(c)})</option>`).join('')}</optgroup>`).join('')+'<option value="Otras ligas">Otras ligas</option>'}return r}})();
const V=id=>{const e=$(id);return e?e.value:''};
function filtersNow(){return{q:fold(V('searchPlayer')).replace(/\s+/g,' '),pos:V('filterPos'),league:V('mkLeague'),club:V('mkClub'),nat:V('mkNat'),conf:V('mkConf'),amin:parseFloat(V('mkAgeMin')),amax:parseFloat(V('mkAgeMax')),rmin:parseFloat(V('mkRatMin')),vmax:parseFloat(V('mkValMax')),aff:$('mkAff')&&$('mkAff').checked,sort:V('mkSort')||'rating'}}
let PN=40,SIG='';
function pool(){const d=mcDB(),sq=new Set(career.players.map(p=>fold(p.name))),gone=career.mkt.gone||{};
 const base=d.list.filter(p=>!gone[p.id]&&p.club!==career.club&&!sq.has(fold(p.name)));
 const ex=(career.mkt.extra||[]).filter(p=>!gone[p.id]&&!sq.has(fold(p.name))&&!base.some(b=>fold(b.name)===fold(p.name)));ex.forEach(p=>{if(!p._n)p._n=mcNorm(p.name);p.league=mcCountryOf(p.club)||'Otras ligas'});
 return base.concat(ex)}
function confMatch(p,cf){if(!cf)return true;const c=p.league==='Otras ligas'?null:p.league;if(!c)return false;if(cf.startsWith('cf:'))return(c==='Argentina'?'CONMEBOL':M.confOf(c))===cf.slice(3);return regOf(c)===cf}
window.mcBuyHTML=function(){const F=filtersNow(),s=JSON.stringify(F);if(s!==SIG){SIG=s;PN=40}
 const toks=F.q?F.q.split(' ').filter(Boolean):[];const P=pool();
 let L=P.filter(p=>{const n=p._n||fold(p.name);if(toks.length&&!toks.every(t=>n.includes(t)))return false;if(F.pos&&p.pos!==F.pos)return false;if(F.league&&p.league!==F.league)return false;if(F.club&&p.club!==F.club)return false;if(F.nat&&p.nat!==F.nat)return false;if(!confMatch(p,F.conf))return false;
  if(!isNaN(F.amin)&&p.age<F.amin)return false;if(!isNaN(F.amax)&&p.age>F.amax)return false;if(!isNaN(F.rmin)&&p.rating<F.rmin)return false;if(!isNaN(F.vmax)&&p.value>F.vmax)return false;if(F.aff&&p.value>career.budget)return false;return true});
 const S={rating:(a,b)=>b.rating-a.rating||b.value-a.value,value:(a,b)=>b.value-a.value,valueAsc:(a,b)=>a.value-b.value,age:(a,b)=>a.age-b.age,pot:(a,b)=>(b.potential||0)-(a.potential||0)||b.rating-a.rating,name:(a,b)=>a.name.localeCompare(b.name)};
 L.sort(S[F.sort]||S.rating);const shown=L.slice(0,PN),FL=window.MC10_FLAGS||{};
 const cards=shown.map(p=>{const fl=FL[fold(p.name)]||0;const gen=(fl&32)||((fl>>8)&9);const est=gen?'<span class="mc10-badge-est mc10-badge-gen" title="Jugador generado: no corresponde a una persona real verificada">GEN.</span>':(fl&31)?'<span class="mc10-badge-est" title="Dato estimado (edad, valor, nacionalidad, posición o GRL)">EST.</span>':'';const cn=p.league!=='Otras ligas'?p.league:null;
  return `<div class="x-pc"><div class="ph">${avatar(p.pos)}</div><div><b>${esc(p.name)}</b><div class="mt"><span class="pp ${p.pos}">${p.pos}</span>${p.age} años${p.nat&&p.nat!=='—'?' · '+flag(p.nat)+' '+esc(p.nat):''}${p.number?' · #'+p.number:''}</div><div class="mt">${esc(p.club)}${cn?' · '+flag(cn)+' '+esc(LEAGUES[cn]?LEAGUES[cn].nombre:cn):''}</div><div class="mt">${money(p.value)}${est} · contrato ${p.contract||'?'} año/s · salario ${money(p.wage||0)}/año</div></div><div class="rt"><span class="st">★ ${p.rating}</span><button class="nb" onclick="openTransferOffer(${q(p.id)})">Ofertar</button><button class="nb" style="margin-top:4px" onclick="mc10Loan(${q(p.id)})">Préstamo</button></div></div>`}).join('');
 const more=L.length>PN?`<button class="btn secondary x-go" onclick="mc10More()">VER MÁS (${(L.length-PN).toLocaleString('es')} restantes)</button>`:'';
 return `<div class="mk-count">${L.length.toLocaleString('es')} de ${P.length.toLocaleString('es')} jugadores de todo el mundo</div>`+(cards||'<div class="x-panel x-emp">No hay jugadores con esa combinación de búsqueda y filtros.</div>')+more};
window.mc10More=function(){PN+=40;renderMarket()};
(function(){const o=window.renderMarket;window.renderMarket=function(){ensureConfFilter();if($('mkLeague')&&$('mkLeague').options.length<20)try{mcFillFilters()}catch(e){}return o.apply(this,arguments)}})();
/* préstamos con opción de compra */
window.mc10Loan=function(id){const p=mcDB().byId.get(id)||(career.mkt.extra||[]).find(x=>x.id===id);if(!p)return;const fee=Math.max(.01,Math.round(p.value*.12*100)/100),opt=Math.max(.05,Math.round(p.value*1.15*100)/100);
 openModal(`<div class="eyebrow">PRÉSTAMO</div><h2>${esc(p.name)}</h2><p class="tiny">${esc(p.club)} · ${p.pos} · ${p.age} años · GRL ${p.rating} · valor ${money(p.value)}</p>
 <label>Cargo por el préstamo (M)</label><input id="mlFee" type="number" step="0.01" min="0" value="${fee}">
 <label>Porcentaje del salario que pagás</label><select id="mlWage"><option value="50">50%</option><option value="75" selected>75%</option><option value="100">100%</option></select>
 <label>Opción de compra al final (M)</label><input id="mlOpt" type="number" step="0.05" min="0" value="${opt}">
 <p class="tiny">El jugador vuelve a ${esc(p.club)} al terminar la temporada, salvo que ejecutes la opción de compra en el cierre de temporada.</p>
 <button class="btn" style="width:100%" onclick="mc10LoanSubmit(${q(id)})">ENVIAR PROPUESTA</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CANCELAR</button>`)};
window.mc10LoanSubmit=function(id){const p=mcDB().byId.get(id)||(career.mkt.extra||[]).find(x=>x.id===id);if(!p)return;const fee=+$('mlFee').value,share=+$('mlWage').value/100,opt=+$('mlOpt').value;
 if(!(fee>=0)||fee>career.budget){xToast&&xToast('Revisá el cargo: supera tu presupuesto');return}
 const str=window.mcClubStrength?mcClubStrength(p.club):65;const starter=p.rating>=str+2;
 const chance=clamp(.35+(fee/Math.max(.01,p.value*.12)-1)*.25+(share-.75)*.6+(opt/Math.max(.05,p.value)-1.1)*.5-(starter?.25:0)+(p.age<=21?.12:0),.05,.9);
 if(Math.random()<chance){career.budget=Math.round((career.budget-fee)*100)/100;const r=p.rating;const P={id:career.players.reduce((m,x)=>Math.max(m,x.id),0)+1,name:p.name,pos:p.pos,rating:r,potential:p.potential||r,age:p.age,nat:p.nat,value:p.value,fromClub:p.club,fitness:94,morale:78,goals:0,assists:0,apps:0,contract:1,wage:Math.round((p.wage||.3)*share*100)/100,number:(()=>{const u=new Set(career.players.map(x=>x.number));let n=1;while(u.has(n))n++;return n})(),
   pace:60+r%35,shooting:p.pos==='DEL'?r+2:55+r%20,passing:p.pos==='MED'?r+2:55+r%20,defending:p.pos==='DEF'?r+2:50+r%20,stamina:70+r%25,strength:60+r%30,injury:null,personality:'Cedido',foot:'Derecho',weakFoot:3,transferListed:false,loan:{from:p.club,until:career.season,option:opt}};
  career.players.push(P);career.mkt.gone[p.id]=1;const w=mcWorld();w.loans.push({name:p.name,from:p.club,until:career.season,option:opt,exercise:false});
  career.transferHistory.push({name:p.name,detail:'PRÉSTAMO · '+money(fee)});career.marketDeals.push({player:p.name,kind:'Préstamo',status:'ACEPTADO',detail:`Cargo ${money(fee)} · opción ${money(opt)}`});career.inbox.unshift(`Préstamo cerrado: ${p.name} llega cedido desde ${p.club} hasta fin de temporada (opción de compra ${money(opt)}).`);
  try{mcResetDB()}catch(e){}save();closeModal();renderMarket();xToast&&xToast(`${p.name} llega a préstamo`)}
 else{career.marketDeals.push({player:p.name,kind:'Préstamo',status:'RECHAZADO',detail:`${esc(p.club)} no aceptó la cesión`});save();closeModal();renderMarket();xToast&&xToast(`${p.club} rechazó el préstamo`)}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* ofertas por tus jugadores: clubes reales interesados (según nivel y presupuesto) */
window.generateClubBid=function(){const list=career.players.filter(p=>p.transferListed&&!p.loan);
 if(!list.length){alert('Primero publicá al menos un jugador en la lista de transferibles.');return}
 if(career.players.length<=16){alert('Tu plantel tiene el mínimo de jugadores (16). Fichá antes de vender.');return}
 const p=list[Math.floor(Math.random()*list.length)],value=p.value!=null?p.value:Math.max(1,Math.round(p.rating*p.rating/100));
 const clubs=Object.keys(CLUBS).flatMap(cn=>CLUBS[cn]).filter(c=>c!==career.club).map(c=>[c,mcClubStrength(c)]).filter(x=>x[1]>=p.rating-7&&x[1]<=p.rating+2);
 /* interesados realistas: clubes de tu confederación o de ligas fuertes que puedan pagarlo */
 const myConf=career.country==='Argentina'?'CONMEBOL':M.confOf(career.country);let pool=clubs.filter(([c,s])=>{const cn=mcCountryOf(c);const cf=cn==='Argentina'?'CONMEBOL':M.confOf(cn);return cf===myConf||s>=70});if(!pool.length)pool=clubs;
 const pick=pool.sort(()=>Math.random()-.5).slice(0,3);if(!pick.length)pick.push([(CLUBS[career.country]||[]).find(c=>c!==career.club),60]);
 const offers=pick.map(([c,s])=>[c,Math.max(.01,Math.round(value*(.8+Math.random()*.4)*100)/100)]);
 offers.forEach(o=>career.marketDeals.push({player:p.name,kind:'Oferta recibida',status:'PENDIENTE',detail:`${o[0]} ofrece ${money(o[1])}`}));
 openModal(`<div class="eyebrow">CLUBES INTERESADOS</div><h2>${esc(p.name)}</h2><p class="tiny">Valor estimado ${money(value)} · GRL ${p.rating}</p>${offers.map(o=>`<div class="statsrow"><span>${clubBadge(o[0],18)} ${esc(o[0])}<span class="tiny muted" style="display:block">${flag(mcCountryOf(o[0]))} ${esc(leagueName(mcCountryOf(o[0])))}</span></span><button class="btn small" onclick="mc10AcceptBid(${p.id},${o[1]},${q(o[0])})">${money(o[1])}</button></div>`).join('')}<button class="btn secondary" style="width:100%;margin-top:7px" onclick="rejectClubBid(${q(p.name)})">RECHAZAR TODAS</button>`);
 save();renderMarket()};
window.mc10AcceptBid=function(id,offer,club){const i=career.players.findIndex(p=>p.id===id);if(i<0)return;if(career.players.length<=16){alert('Plantel mínimo: 16 jugadores.');return}
 const p=career.players[i];career.budget=Math.round((career.budget+offer)*100)/100;career.players.splice(i,1);
 career.mkt.extra=(career.mkt.extra||[]).filter(x=>fold(x.name)!==fold(p.name)).concat([{id:'x-'+mcKebab(p.name)+'-'+Date.now().toString(36),name:p.name,pos:p.pos,rating:p.rating,age:p.age,nat:p.nat||'—',value:offer,club,potential:p.potential,wage:p.wage,contract:p.contract,free:false}]);
 try{mcMovePlayer(p.name,club)}catch(e){}try{fitXI()}catch(e){}
 career.marketDeals.forEach(d=>{if(d.player===p.name&&d.status==='PENDIENTE')d.status=d.detail.startsWith(club)?'ACEPTADA':'DESCARTADA'});
 career.transferHistory.push({name:p.name,detail:'SALIDA a '+club+' · +'+money(offer)});career.inbox.unshift(`Venta confirmada: ${p.name} a ${club} por ${money(offer)}.`);
 save();closeModal();renderMarket();try{renderSquad()}catch(e){}};
/* =========================================================
   5) ACCESOS: tablero, menú Más e inicio
   ========================================================= */
function addAccess(){const dash=$('dashboard');if(dash&&!$('mc10DashWorld')){const grids=dash.querySelectorAll('.card .grid2');const g=grids[grids.length-1];if(g){const b=document.createElement('button');b.id='mc10DashWorld';b.className='btn secondary';b.style.gridColumn='1/-1';b.innerHTML='🌍 MUNDO · TORNEOS, SELECCIONES Y RANKINGS';b.onclick=()=>mc10World('comps');g.appendChild(b)}}
 try{if(typeof SS!=='undefined'&&SS.Cuenta&&!SS.Cuenta[2].some(r=>/mc10World/.test(r[3])))SS.Cuenta[2].unshift(['a','globe','Mundo: torneos, selecciones y rankings','mc10World("comps")'],['a','flag','Buscador mundial de ligas','mc10OpenFinder()'])}catch(e){}
 try{buildLeagueUI()}catch(e){}}
document.addEventListener('DOMContentLoaded',()=>{ensureWorldPage();addAccess();installFinder()});
if(document.readyState!=='loading'){ensureWorldPage();addAccess();installFinder()}
})();
