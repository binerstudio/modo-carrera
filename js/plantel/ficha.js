/* ===== MODO CARRERA 12.8 · ETAPA 4 · FICHA DEL JUGADOR Y FICHA DEL CLUB =====
   FICHA DEL JUGADOR
   - Los 25 atributos de campo del motor (MCAtributos, js/motor/atributos.js) agrupados en técnicos (12), mentales (5)
     y físicos (8), más los 5 de arquero. Son los MISMOS valores que usan los motores v2 y v3 en el partido.
   - Son ESTIMADOS (salen de la posición, el GRL y la edad; no hay una fuente con atributos reales) y se marcan así en
     pantalla. Si un jugador trae atributos verificados (origen:'verificado'), se muestran sin la marca.
   - PlayStyles (estilos de juego): rasgos que se deducen de esos atributos, con ícono y explicación corta. Como salen de
     atributos estimados, también se marcan como estimados. "+" = nivel de élite en ese rasgo. Son informativos.
   - Abre para cualquier jugador: los de tu plantel (pantalla de la ficha, con el botón "Fijo" para la rotación) y los de
     cualquier otro club (ventana con la misma información, mcFichaJugador).
   FICHA DEL CLUB (clubes de la IA)
   - Presupuesto (mcIAEco, js/ia/mercado-ia.js; estimado), valor del plantel, entrenador, lesionados y cansados
     (js/ia/estado-ia.js), plantel completo (cada jugador abre su ficha) y últimos movimientos del mercado.
   - Se abre desde Mundo → Clubes o tocando un club en la tabla de posiciones. */
(function(){
'use strict';
const A=window.MCAtributos;if(!A)return;
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const q=s=>"'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const CAR=()=>(typeof career!=='undefined'&&career)?career:null;
const CL=()=>{try{return typeof CLUBS!=='undefined'?CLUBS:(window.CLUBS||{})}catch(e){return{}}};
const nm=n=>{try{return window.mcShowName?mcShowName(n):n}catch(e){return n}};
const money=v=>{try{return window.mcMoney?mcMoney(v):'$'+v+'M'}catch(e){return '$'+v+'M'}};
const badge=(n,s)=>{try{return n&&window.clubBadge?clubBadge(n,s):''}catch(e){return ''}};
const flag=c=>{try{return c&&c!=='—'&&window.MC10?MC10.flag(c):''}catch(e){return ''}};
const tier=r=>r>=85?'t5':r>=75?'t4':r>=68?'t3':r>=60?'t2':'t1';

/* ---------- grupos (25 de campo + 5 de arquero) ---------- */
const GRUPOS=[
 ['tec','Técnicos',['tiro','definicion','potencia','paseCorto','paseLargo','centros','regate','control','cabeceo','marcaje','entradas','intercepciones']],
 ['men','Mentales',['vision','posicionamiento','reacciones','anticipacion','inteligencia']],
 ['fis','Físicos',['ritmo','aceleracion','velocidad','agilidad','equilibrio','fuerza','resistencia','salto']],
 ['arq','De arquero',['estirada','manejo','saque','reflejos','colocacion']]];
const NOM=A.NOMBRES;

/* ---------- PlayStyles: [id, ícono, nombre, explicación, valor del rasgo, umbral, umbral de élite (+), solo arquero] ---------- */
const ES=[
 ['explosivo','⚡','Explosivo','Arranca muy rápido: gana los primeros metros.',v=>v.aceleracion,84,90],
 ['veloz','🏃','Veloz','Velocidad punta alta en carreras largas.',v=>v.velocidad,84,90],
 ['definidor','🎯','Definidor','Convierte las ocasiones claras con frialdad.',v=>v.definicion,80,88],
 ['canonero','💥','Cañonero','Remate potente desde lejos.',v=>(v.potencia+v.tiro)/2,79,87],
 ['gambeta','🪄','Gambeta','Supera rivales en el uno contra uno.',v=>(v.regate+v.agilidad)/2,80,88],
 ['control','🧲','Primer control','Recibe y acomoda la pelota en un toque.',v=>v.control,81,89],
 ['visionario','🔭','Visionario','Ve y mete el pase que rompe líneas.',v=>(v.vision+v.paseCorto)/2,79,87],
 ['pasador','🎼','Pase preciso','Pase corto seguro: casi no pierde la pelota.',v=>v.paseCorto,82,89],
 ['largo','📐','Pase largo','Cambios de frente y pelotas largas precisas.',v=>v.paseLargo,80,88],
 ['centrador','🎯','Centrador','Centros precisos al área.',v=>v.centros,79,87],
 ['aereo','🗼','Juego aéreo','Gana de arriba: salto y cabezazo.',v=>(v.cabeceo+v.salto)/2,79,87],
 ['marcador','🧱','Marcador','Sigue a su delantero y no lo deja girar.',v=>v.marcaje,80,88],
 ['quite','🦶','Quite limpio','Entradas firmes y sin falta.',v=>v.entradas,80,88],
 ['lector','🕵️','Lector del juego','Anticipa e intercepta los pases.',v=>(v.intercepciones+v.anticipacion)/2,79,87],
 ['pulmon','🫁','Pulmón','Llega entero al final del partido.',v=>v.resistencia,84,91],
 ['fuerte','💪','Fuerte','Gana los choques y protege la pelota.',v=>(v.fuerza+v.equilibrio)/2,80,88],
 ['tactico','🧠','Inteligencia táctica','Siempre bien ubicado y ordenado.',v=>(v.inteligencia+v.posicionamiento)/2,80,88],
 ['reflejos','🧤','Reflejos','Ataja remates a quemarropa.',v=>v.reflejos,79,87,1],
 ['estirada','🦘','Estirada larga','Llega a las pelotas junto al palo.',v=>v.estirada,79,87,1],
 ['manos','🤲','Manos seguras','Retiene la pelota: no da rebotes.',v=>v.manejo,79,87,1],
 ['pies','🦵','Arquero con pies','Juega con los pies y saca largo y preciso.',v=>v.saque,76,85,1],
 ['ubicacion','📍','Bien ubicado','Achica bien y cubre los ángulos.',v=>v.colocacion,79,87,1]];
function estilos(at){const v=at.v,gk=at.pos==='POR',out=[],ks=gk?A.ARQ:A.CAMPO,media=ks.reduce((s,k)=>s+v[k],0)/ks.length;
 for(const [id,ic,n,t,f,u,el,arq] of ES){if(!!arq!==gk)continue;
  /* lo tiene si llega al umbral, o si ese rasgo se destaca (9 o más sobre el promedio de sus atributos, 4 en los arqueros, y no menos que su GRL − 2) */
  const x=f(v),rel=x-media,R=gk?4:9;if(x>=u||(rel>=R&&x>=Math.max(50,at.grl-2)))out.push({id,ic,n,t,plus:x>=el,s:Math.max(x-u,rel-R)})}
 return out.sort((a,b)=>b.plus-a.plus||b.s-a.s).slice(0,4)}

/* ---------- atributos de un jugador cualquiera ---------- */
function info(p){return{name:p.name,pos:p.pos,grl:+p.rating||+p.grl||60,age:+p.age||26,atributos:p.atributos}}
function atributos(p){return A.de(info(p))}
window.mcAtributosJugador=atributos;
window.mcEstilosJugador=p=>estilos(atributos(p));

const lv=v=>v>=75?'':v>=55?'a':'r';
const bar=v=>`<div class="m12-bar"><i class="${lv(v)}" style="width:${Math.max(0,Math.min(100,v))}%"></i></div>`;
const EST='<span class="mc4-est" title="Valor estimado a partir de la posición, el GRL y la edad (no es un dato real)">estimado</span>';
function radar(at){const v=at.v,gk=at.pos==='POR';
 const K=gk?[['EST',v.estirada],['REF',v.reflejos],['MAN',v.manejo],['COL',v.colocacion],['SAQ',v.saque],['REA',v.reacciones]]
  :[['RIT',v.ritmo],['TIR',Math.round((v.tiro+v.definicion)/2)],['PAS',Math.round((v.paseCorto+v.vision)/2)],['REG',Math.round((v.regate+v.control)/2)],['DEF',Math.round((v.marcaje+v.entradas+v.intercepciones)/3)],['FIS',Math.round((v.fuerza+v.resistencia+v.salto)/3)]];
 const cx=110,cy=100,R=64,pt=(i,s)=>{const a=-Math.PI/2+i*Math.PI/3;return[(cx+Math.cos(a)*R*s).toFixed(1),(cy+Math.sin(a)*R*s).toFixed(1)]};
 const ring=s=>K.map((k,i)=>pt(i,s).join(',')).join(' ');
 return `<svg class="m12-radar" viewBox="0 0 220 200" role="img"><title>Gráfico de atributos (estimados)</title>${[1,.75,.5,.25].map(s=>`<polygon points="${ring(s)}" fill="${s===1?'rgba(74,155,255,.07)':'none'}" stroke="rgba(112,152,232,.32)" stroke-width="1"/>`).join('')}${K.map((k,i)=>{const e=pt(i,1);return `<line x1="${cx}" y1="${cy}" x2="${e[0]}" y2="${e[1]}" stroke="rgba(112,152,232,.22)"/>`}).join('')}<polygon points="${K.map((k,i)=>pt(i,Math.max(.08,Math.min(1,k[1]/99))).join(',')).join(' ')}" fill="rgba(243,197,82,.28)" stroke="#f3c552" stroke-width="2" stroke-linejoin="round"/>${K.map((k,i)=>{const e=pt(i,1.26);return `<text x="${e[0]}" y="${(+e[1]+3).toFixed(1)}" text-anchor="middle">${k[0]} ${k[1]}</text>`}).join('')}</svg>`}
function panelAtributos(p){const at=atributos(p),est=at.origen!=='verificado',gk=at.pos==='POR';
 const orden=gk?[GRUPOS[3],GRUPOS[0],GRUPOS[1],GRUPOS[2]]:GRUPOS;
 const grupo=([id,t,ks])=>`<div class="m12-ag mc4-g-${id}${!gk&&id==='arq'?' mc4-sec':''}"><h4>${t} <small>(${ks.length})</small>${est?EST:''}</h4>${ks.map(k=>{const v=at.v[k];return `<div class="m12-ar" data-attr="${k}"><span>${esc(NOM[k]||k)}</span>${bar(v)}<b>${v}</b></div>`}).join('')}</div>`;
 return `<div class="m12-panel m12-gold mc4-atr" data-origen="${at.origen}"><div class="m12-ph"><i data-i="chart"></i>Atributos${est?' <span class="mc4-est big">estimados</span>':''}</div>
  ${est?`<p class="mc4-nota">No hay una fuente con atributos reales para este jugador: estos valores se estiman a partir de su posición, su GRL y su edad (perfil: ${esc(at.perfil)}). Son los que usa el motor en los partidos.</p>`:''}
  <div class="m12-attr">${radar(at)}<div>${orden.map(grupo).join('')}</div></div></div>`}
function panelEstilos(p){const at=atributos(p),L=estilos(at),est=at.origen!=='verificado';
 return `<div class="m12-panel mc4-ps"><div class="m12-ph"><i data-i="star"></i>PlayStyles${est?' <span class="mc4-est big">estimados</span>':''}</div>
  ${L.length?L.map(x=>`<div class="mc4-st" data-ps="${x.id}"><span class="ic">${x.ic}</span><div><b>${esc(x.n)}${x.plus?' <em title="Nivel de élite">+</em>':''}</b><small>${esc(x.t)}</small></div></div>`).join(''):'<p class="mc4-nota">Sin un estilo de juego destacado: sus atributos están parejos.</p>'}
  <p class="mc4-nota">Se deducen de sus atributos${est?' estimados':''}: lo que tiene muy alto o lo que más se destaca para su nivel. “+” = nivel de élite. Son informativos.</p></div>`}
window.mcFichaAtributosHTML=panelAtributos;window.mcFichaEstilosHTML=panelEstilos;

/* ---------- estilos de la ficha ---------- */
function css(){if(document.getElementById('mc4css'))return;const s=document.createElement('style');s.id='mc4css';s.textContent=`
.mc4-est{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:8px;border:1px solid rgba(243,197,82,.55);color:#ffe9a6;font:700 9px var(--f,sans-serif);letter-spacing:.6px;text-transform:uppercase;vertical-align:middle}
.mc4-est.big{font-size:10px}.m12-ag h4 small{color:#9fb3d9;font-weight:700;letter-spacing:0}
.mc4-nota{margin:4px 0 10px;color:#9fb3d9;font:500 12px var(--f,sans-serif);line-height:1.35}
.mc4-sec{opacity:.62}
.mc4-st{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(112,152,232,.18)}
.mc4-st:last-of-type{border-bottom:0}.mc4-st .ic{flex:0 0 34px;height:34px;display:grid;place-items:center;border-radius:10px;background:rgba(243,197,82,.14);border:1px solid rgba(243,197,82,.45);font-size:18px}
.mc4-st b{display:block;font:800 13px var(--f,sans-serif)}.mc4-st b em{color:#f3c552;font-style:normal}.mc4-st small{display:block;color:#b9c8e6;font:500 12px var(--f,sans-serif)}
.mc4-fijo{background:rgba(74,155,255,.14)!important;border-color:rgba(74,155,255,.55)!important;color:#cfe3ff!important}
.mc4-modal .m12-panel{margin-top:10px}.mc4-modal .m12-attr{grid-template-columns:minmax(0,1fr)!important}
.mc4-row{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(112,152,232,.15);font:600 13px var(--f,sans-serif)}
.mc4-pl{display:grid;grid-template-columns:34px minmax(0,1fr) 44px 36px;gap:6px;align-items:center;width:100%;padding:7px 4px;background:none;border:0;border-bottom:1px solid rgba(112,152,232,.15);color:inherit;text-align:left;font:600 13px var(--f,sans-serif);cursor:pointer}
.mc4-pl small{display:block;color:#9fb3d9;font-weight:500}.mc4-pl .pp{font-size:11px}
.mc4-tag{display:inline-block;padding:1px 6px;border-radius:8px;font:700 10px var(--f,sans-serif);margin-left:4px}.mc4-tag.les{background:rgba(239,80,96,.2);color:#ffb3ba}.mc4-tag.can{background:rgba(243,197,82,.18);color:#ffe9a6}
`;document.head.appendChild(s)}

/* ---------- ficha de un jugador de tu plantel (se completa la pantalla que ya existía) ---------- */
function completarPropia(i){const c=CAR(),p=c&&c.players[i],box=document.getElementById('playerProfile');if(!p||!box)return;css();
 const old=box.querySelector('.m12-panel.m12-gold');const tmp=document.createElement('div');tmp.innerHTML=panelAtributos(p)+panelEstilos(p);
 if(old){old.replaceWith(tmp.children[0]);const at=box.querySelector('.mc4-atr');at.insertAdjacentElement('afterend',tmp.children[0])}
 else{const col=box.querySelector('.m12-col.a')||box;col.prepend(...tmp.children)}
 const acts=box.querySelector('.m12-pacts');
 if(acts&&!acts.querySelector('.mc4-fijob')){const b=document.createElement('button');b.className='btn secondary mc4-fijob'+(p.fijo?' mc4-fijo':'');b.setAttribute('onclick',`mcToggleFijo(${i})`);
  b.textContent=p.fijo?'📌 Fijo (quitar)':'📌 Marcar fijo';b.title='Los fijos no los cambia la rotación automática';acts.prepend(b)}
 if(p.fijo&&!box.querySelector('.mc4-fijoal')){const d=document.createElement('div');d.className='m12-alert mc4-fijo mc4-fijoal';d.textContent=`📌 Fijo: la rotación automática no lo saca del once${c.rotacion?'':' (la rotación está apagada en Configuración)'}.`;const kv=box.querySelector('.m12-kv');if(kv)kv.before(d);else box.prepend(d)}
 try{ico(box)}catch(e){}}
function instalar(){const M=window.MC12;
 if(M&&typeof M.openPlayer12==='function'&&!M.openPlayer12._mc4){const o=M.openPlayer12;M.openPlayer12=function(i){const r=o.apply(this,arguments);try{completarPropia(i)}catch(e){console.warn('MC ficha',e)}return r};M.openPlayer12._mc4=1}
 if(typeof window.openPlayer==='function'&&!window.openPlayer._mc4){const o=window.openPlayer;
  window.openPlayer=function(i){const r=o.apply(this,arguments);try{const box=document.getElementById('playerProfile');if(box&&!box.querySelector('.mc4-atr'))completarPropia(i)}catch(e){console.warn('MC ficha',e)}return r};window.openPlayer._mc4=1}}
instalar();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0));else setTimeout(instalar,0);

/* ---------- ficha de cualquier jugador (otro club, mercado, selección) ----------
   o: {name,pos,rating,age,club?,nat?,value?} o el nombre de un jugador de la base */
function buscar(n){try{const d=mcDB(),k=fold(n);return d.list.find(o=>(o._n||fold(o.name))===k)||null}catch(e){return null}}
window.mcFichaJugador=function(o){
 try{css();if(typeof o==='string')o=buscar(o)||{name:o};if(!o||!o.name)return false;
  const c=CAR();if(c){const i=c.players.findIndex(p=>fold(p.name)===fold(o.name));if(i>=0){closeModal&&closeModal();openPlayer(i);return true}}
  const p={name:o.name,pos:o.pos||'MED',rating:+o.rating||+o.grl||60,age:+o.age||26,atributos:o.atributos};
  const est=window.mcIAEstado&&o.club?mcIAEstado(o.club)[fold(o.name)]:null;
  const html=`<div class="mc4-modal"><div class="eyebrow">FICHA DEL JUGADOR</div><h2>${esc(nm(p.name))}</h2>
   <div class="mc4-row"><span><span class="pp ${esc(p.pos)}">${esc(p.pos)}</span> · ${p.age} años${o.nat&&o.nat!=='—'?' · '+flag(o.nat)+' '+esc(o.nat):''}</span><b class="m12-grl ${tier(p.rating)}">${p.rating}</b></div>
   ${o.club?`<div class="mc4-row"><span>Club</span><b>${badge(o.club,16)} ${esc(o.club)}</b></div>`:''}${o.value!=null?`<div class="mc4-row"><span>Valor de mercado</span><b>${money(o.value)}</b></div>`:''}
   ${est&&(est.l>0||est.f<99)?`<div class="mc4-row"><span>Estado</span><b>${est.l>0?`Lesionado · ${est.l} ${est.l===1?'fecha':'fechas'}`:`Físico ${Math.round(est.f)}%`}</b></div>`:''}
   ${panelAtributos(p)}${panelEstilos(p)}
   <button class="btn" style="width:100%;margin-top:10px" onclick="closeModal()">CERRAR</button></div>`;
  openModal(html);try{ico(document.getElementById('sheet')||document)}catch(e){}return true}
 catch(e){console.warn('MC ficha',e);return false}};

/* ---------- ficha del club (IA) ---------- */
function coach(club){try{return window.mcCoachOf?mcCoachOf(club):null}catch(e){return null}}
window.mcFichaClubHTML=function(club){const c=CAR();if(!c||!club)return '';css();
 const rows=(window.rosterFor?rosterFor(club):[])||[],mine=club===c.club;
 const st=!mine&&window.mcIAEstado?mcIAEstado(club):{};
 const eco=!mine&&window.mcIAEco&&window.mcIADe&&mcIADe(c)==='v2'?(()=>{try{return mcIAEco(club)}catch(e){return null}})():null;
 const valor=rows.reduce((a,r)=>a+(+r[5]||0),0),co=coach(club);
 const grl=(()=>{try{return Math.round(mcTeamGRL(club))}catch(e){return '—'}})();
 const les=rows.filter(r=>st[fold(r[0])]&&st[fold(r[0])].l>0),can=rows.filter(r=>{const x=st[fold(r[0])];return x&&!(x.l>0)&&x.f<80});
 const mov=[];(mcWorld().aiMoves||[]).forEach(s=>(s.moves||[]).forEach(m=>{if(m[1]===club||m[2]===club)mov.push([s,m])}));
 const tag=r=>{const x=st[fold(r[0])];if(!x)return '';return x.l>0?`<span class="mc4-tag les">lesionado ${x.l}f</span>`:x.f<80?`<span class="mc4-tag can">${Math.round(x.f)}%</span>`:''};
 return `<div class="card mc4-club"><div class="between"><div><div class="eyebrow">FICHA DEL CLUB</div><h2>${badge(club,28)} ${esc(club)}</h2></div><b class="m12-grl ${tier(+grl||60)}">${grl}</b></div>
  <div class="mc4-row"><span>Liga</span><b>${esc((()=>{try{return leagueName(mcCountryOf(club))}catch(e){return '—'}})())}</b></div>
  ${co?`<div class="mc4-row"><span>Entrenador</span><b>${esc(co.name||'—')}${co.user?' (vos)':` · ${esc(co.style||'')} · nivel ${co.lvl||'—'}`}</b></div>`:''}
  ${mine?`<div class="mc4-row"><span>Presupuesto de fichajes</span><b>${money(c.budget)}</b></div>`:
   eco?`<div class="mc4-row"><span>Presupuesto ${EST}</span><b class="mc4-pres" data-b="${eco.b}">${eco.b<0?'−'+money(Math.abs(eco.b))+' (deuda)':money(eco.b)}</b></div>`:
   `<div class="mc4-row"><span>Presupuesto</span><b class="tiny">Se ve con el mercado avanzado (Configuración → Mercado e IA)</b></div>`}
  <div class="mc4-row"><span>Valor del plantel</span><b>${money(+valor.toFixed(1))}</b></div>
  <div class="mc4-row"><span>Jugadores</span><b>${rows.length}</b></div>
  ${mine?'':`<div class="mc4-row"><span>Lesionados / cansados (menos de 80 %)</span><b>${les.length} / ${can.length}</b></div>`}
  ${eco?'<p class="mc4-nota">El presupuesto de los clubes de la IA se estima con el valor de su plantel y su fuerza, y se mueve con sus compras y ventas. No es un dato real del club.</p>':''}</div>
  <div class="card"><h2>Plantel</h2>${rows.map(r=>`<button class="mc4-pl" onclick="mcFichaJugador({name:${q(r[0])},pos:${q(r[1])},rating:${+r[2]||60},age:${+r[3]||26},nat:${q(r[4]||'—')},value:${r[5]==null?'null':+r[5]},club:${q(club)}})"><span class="pp ${esc(r[1])}">${esc(r[1])}</span><span>${esc(nm(r[0]))}${tag(r)}<small>${r[3]?r[3]+' años':''}${r[5]!=null?' · '+money(r[5]):''}</small></span><b class="m12-grl ${tier(+r[2]||60)}">${r[2]}</b><span>›</span></button>`).join('')||'<p class="tiny">Sin jugadores cargados.</p>'}</div>
  ${mov.length?`<div class="card"><h2>Últimos movimientos</h2>${mov.slice(0,12).map(([s,m])=>`<div class="mc4-row"><span>${esc(nm(m[0]))}<small class="tiny muted" style="display:block">${esc(m[1])} → ${esc(m[2])} · ${s.ventana==='invierno'?'invierno':'verano'} ${s.season+(s.ventana==='invierno'?0:1)}</small></span><b>${m[4]&&m[4]!=='traspaso'?esc(m[4]):money(m[3])}</b></div>`).join('')}</div>`:''}`};
window.mcFichaClub=function(club){try{if(window.mc10World){window.MC4_CLUB=club;mc10World('clubs')}}catch(e){console.warn('MC ficha club',e)}};
/* Mundo → Clubes: elegir liga y club */
window.mcClubesHTML=function(){const c=CAR();if(!c)return '';
 const paises=Object.keys(CL()).filter(p=>(CL()[p]||[]).length).sort((a,b)=>a===c.country?-1:b===c.country?1:a.localeCompare(b));
 let club=window.MC4_CLUB;let pais=window.MC4_PAIS||c.country;
 if(club){try{const p=mcCountryOf(club);if(p)pais=p}catch(e){}}
 const lista=pais===c.country&&c.league?c.league.teams:(CL()[pais]||[]);
 if(!club||!lista.includes(club))club=lista.find(x=>x!==c.club)||lista[0];
 return `<div class="card"><div class="eyebrow">CLUBES</div><h2>Ficha del club</h2><p class="tiny">Presupuesto, plantel, lesionados y movimientos de cualquier club. Tocá un jugador para ver su ficha.</p>
  <select onchange="MC4_PAIS=this.value;MC4_CLUB=null;mc10RenderWorld()">${paises.map(p=>`<option value="${esc(p)}"${p===pais?' selected':''}>${esc((()=>{try{return leagueName(p)}catch(e){return p}})())} · ${esc(p)}</option>`).join('')}</select>
  <select style="margin-top:6px" onchange="MC4_CLUB=this.value;mc10RenderWorld()">${lista.map(x=>`<option value="${esc(x)}"${x===club?' selected':''}>${esc(x)}${x===c.club?' (tu club)':''}</option>`).join('')}</select></div>${window.mcFichaClubHTML(club)}`};
/* tocar un club en las tablas de posiciones abre su ficha */
document.addEventListener('click',ev=>{try{const c=CAR();if(!c)return;const td=ev.target.closest&&ev.target.closest('td.cl,.mc-cl');if(!td||!td.closest('#league,#m12L,#dashboard'))return;
 const t=(td.querySelector('b')||td.querySelector('span:last-child')||td).textContent.trim();if(!t||t===c.club)return;
 const ok=Object.values(CL()).some(a=>a.includes(t));if(ok)mcFichaClub(t)}catch(e){}},true);
})();
