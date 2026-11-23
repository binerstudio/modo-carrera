
/* ===== MODO CARRERA 6.2 · INTERFAZ: plantel y administrador de carreras ===== */
(function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
let sel=null;
/* ---------- PLANTEL ---------- */
function chip(p,i){const g=slotGroups(career.formation)[i];const w=i<11&&p.pos!==g;const bad=p.injury||p.suspended;return (w?'<em class="oop">⚠</em>':'')+(bad?'<em class="inj">'+(p.suspended?'■':'+')+'</em>':'')}
window.renderLineupV6=function(){
 const pitch=$('lineupPitchV6'),subs=$('lineupSubsV6'),res=$('lineupResV6');if(!pitch||!subs||!career)return;
 const coords=positions(career.formation||'4-3-3');pitch.innerHTML='';
 career.players.slice(0,11).forEach((p,i)=>{const c=coords[i]||[50,90-i*5];const el=document.createElement('button');el.className='lineup-player-v6'+(sel===i?' sel':'');
  el.style.left=c[0]+'%';el.style.top=c[1]+'%';el.innerHTML=`${chip(p,i)}<b>${p.number||i+1}</b><span>${esc(p.name)}</span><small>${slotLabel(i)} · ${effRating(p,slotGroups(career.formation)[i])}</small>`;el.onclick=()=>mcPlayerMenu(i);pitch.appendChild(el)});
 const sb=(p,j)=>`<button class="sub-player-v6${sel===j?' sel':''}" onclick="mcPlayerMenu(${j})"><b>${p.number||j+1}</b><span>${esc(p.name)}</span><small>${p.pos} · ${p.rating}${p.injury?' · +':''}${p.suspended?' · ■':''}</small></button>`;
 const B=MC_BENCH_N;
 subs.innerHTML=career.players.slice(11,11+B).map((p,j)=>sb(p,j+11)).join('')||'<span class="muted tiny">Todavía no hay suplentes disponibles.</span>';
 if(res)res.innerHTML=career.players.slice(11+B).map((p,j)=>sb(p,j+11+B)).join('')||'<span class="muted tiny">No hay jugadores en reserva. Los fichajes nuevos se suman acá.</span>';
};
window.renderSquad=function(){
 if(!career)return;$('squadCount').textContent=career.players.length;$('squadAvg').textContent=avgRating();
 $('squadFit').textContent=Math.round(career.players.reduce((a,p)=>a+p.fitness,0)/career.players.length)+'%';
 const tag=$('lineupFormTag');if(tag)tag.textContent=career.formation+' · GRL '+avgRating();
 $('squadList').innerHTML=career.players.map((p,i)=>`<div class="playerrow"><div class="rating">${p.rating}</div><div onclick="mcPlayerMenu(${i})"><div class="playername">${esc(p.name)}</div><div class="pos">${p.pos} · ${p.age} años · POT ${p.potential} · <b class="gold">${MC_ZN[zoneOf(i)].toUpperCase()}</b></div><div class="tiny muted">Físico ${p.fitness}% · Moral ${p.morale}%${p.injury?' · 🩹 '+p.injury:''}${p.suspended?' · ■ Suspendido':''}</div></div><button class="btn secondary small" onclick="mcPlayerMenu(${i})">MOVER</button></div>`).join('');
 renderLineupV6();
};
window.mcPlayerMenu=function(i){
 const p=career.players[i];if(!p)return;sel=i;const z=zoneOf(i),g=slotGroups(career.formation)[i];renderLineupV6();
 const b=(t,fn,cls)=>`<button class="btn ${cls||'secondary'}" style="width:100%;margin-top:7px" onclick="${fn}">${t}</button>`;
 let acts='';
 if(z==='xi')acts=b('MANDAR AL BANCO',`mcPicker(${i},'bench')`,'')+b('INTERCAMBIAR CON OTRO TITULAR',`mcPicker(${i},'xi')`)+b('MANDAR A RESERVAS',`mcPicker(${i},'res')`);
 else if(z==='bench')acts=b('PASAR A TITULAR (ELEGIR LUGAR)',`mcSlotPicker(${i})`,'')+b('MANDAR A RESERVAS',`mcPicker(${i},'res')`)+b('INTERCAMBIAR CON OTRO SUPLENTE',`mcPicker(${i},'bench')`);
 else acts=b('PASAR A TITULAR (ELEGIR LUGAR)',`mcSlotPicker(${i})`,'')+b('PASAR AL BANCO',`mcPicker(${i},'bench')`);
 openModal(`<div class="between"><div><div class="eyebrow">${MC_ZN[z].toUpperCase()}${z==='xi'?' · '+slotLabel(i):''}</div><h2>${esc(p.name)}</h2><p class="tiny">${p.pos} · ${p.age} años · Valoración ${p.rating}${z==='xi'&&p.pos!==g?` · <b style="color:#ffb347">jugando de ${g}: ${effRating(p,g)}</b>`:''}</p></div><div class="rating" style="font-size:22px;padding:10px">${p.rating}</div></div>${p.injury?`<p class="tiny" style="color:#ff8a8a">🩹 ${p.injury}</p>`:''}${acts}<button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal();openPlayer(${i});go('player')">VER FICHA COMPLETA</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal();mcClearSel()">CERRAR</button>`);
};
window.mcClearSel=function(){sel=null;renderLineupV6()};
window.mcPicker=function(i,zone){
 const p=career.players[i];const cands=career.players.map((q,j)=>[q,j]).filter(([q,j])=>j!==i&&zoneOf(j)===zone);
 const sg=slotGroups(career.formation);
 if(!cands.length){openModal(`<div class="between"><h2>${esc(p.name)}</h2><button class="btn small secondary" onclick="mcPlayerMenu(${i})">VOLVER</button></div><p>No hay jugadores en ${MC_ZN[zone].toLowerCase()} para intercambiar. Ficha más jugadores para tener reservas.</p>`);return}
 // orden: mejor encaje primero (para cubrir el hueco que deja p)
 const slotG=zoneOf(i)==='xi'?sg[i]:null;
 cands.sort((a,b)=>slotG?((b[0].pos===slotG)-(a[0].pos===slotG))||(b[0].rating-a[0].rating):b[0].rating-a[0].rating);
 const rows=cands.map(([q,j])=>{let hint='';if(zone!=='xi'&&zoneOf(i)==='xi'){const pen=posPenalty(q.pos,sg[i]);hint=pen?` <b style="color:#ffb347">⚠ −${pen}</b>`:' <b style="color:#7be29a">✓ posición</b>'}
  else if(zone==='xi'&&zoneOf(i)!=='xi'){const pen=posPenalty(p.pos,sg[j]);hint=pen?` <b style="color:#ffb347">⚠ −${pen} en ${slotLabel(j)}</b>`:` <b style="color:#7be29a">✓ ${slotLabel(j)}</b>`}
  return `<div class="statsrow"><span>${q.number}. ${esc(q.name)} · ${q.pos} · ${q.rating}${q.injury?' 🩹':''}${hint}</span><button class="btn small" onclick="mcTrySwap(${i},${j})">ELEGIR</button></div>`}).join('');
 openModal(`<div class="between"><div><div class="eyebrow">CAMBIAR A ${esc(p.name).toUpperCase()}</div><h2>${MC_ZN[zone]}</h2></div><button class="btn small secondary" onclick="mcPlayerMenu(${i})">VOLVER</button></div><p class="tiny">Tocá con quién intercambia lugar. Si queda fuera de posición vas a ver una advertencia.</p>${rows}`);
};
window.mcSlotPicker=function(i){
 const p=career.players[i],sg=slotGroups(career.formation);
 const rows=career.players.slice(0,11).map((q,j)=>[q,j]).sort((a,b)=>(posPenalty(p.pos,sg[a[1]])-posPenalty(p.pos,sg[b[1]]))||(a[0].rating-b[0].rating)).map(([q,j])=>{const pen=posPenalty(p.pos,sg[j]);
  return `<div class="statsrow"><span>${slotLabel(j)} · reemplaza a ${esc(q.name)} (${q.rating})${pen?` <b style="color:#ffb347">⚠ −${pen}</b>`:' <b style="color:#7be29a">✓</b>'}</span><button class="btn small" onclick="mcTrySwap(${i},${j})">ELEGIR</button></div>`}).join('');
 openModal(`<div class="between"><div><div class="eyebrow">DÓNDE JUEGA ${esc(p.name).toUpperCase()}</div><h2>Elegí el lugar</h2></div><button class="btn small secondary" onclick="mcPlayerMenu(${i})">VOLVER</button></div>${rows}`);
};
/* ---------- CARGAR PARTIDA ---------- */
function ago(t){const d=Date.now()-t;if(d<6e4)return'hace instantes';if(d<36e5)return'hace '+Math.round(d/6e4)+' min';if(d<864e5)return'hace '+Math.round(d/36e5)+' h';return'hace '+Math.round(d/864e5)+' días'}
window.renderSaves=function(){
 const a=mcSlots().slice().sort((x,y)=>y.updated-x.updated),box=$('savesList');if(!box)return;
 const act=career&&career.id;$('savesCount').textContent=a.length+(a.length===1?' carrera guardada':' carreras guardadas');
 box.innerHTML=a.length?a.map(m=>{const L=LEAGUES[m.country]||{},tot=L.fecha||38;
  return `<div class="card save-card${m.id===act?' act':''}"><div class="flex" style="gap:11px"><div>${clubBadge(m.club,46)}</div><div class="grow"><div class="save-name">${esc(m.name)}${m.id===act?' <span class="tag">ACTIVA</span>':''}</div><div class="tiny muted">${esc(m.club)} · ${esc(L.nombre||m.country)}</div></div><button class="btn ghost small" title="Renombrar" onclick="mcRename('${m.id}')">✎</button></div>
  <div class="metric-grid" style="margin-top:9px"><div class="metric"><b>${m.season}/${String(m.season+1).slice(-2)}</b><small>TEMPORADA</small></div><div class="metric"><b>${Math.min(m.round,tot)}/${tot}</b><small>FECHAS</small></div><div class="metric"><b>$${m.budget}M</b><small>PRESUPUESTO</small></div></div>
  <div class="tiny muted" style="margin:6px 0">Última partida: ${ago(m.updated)}</div>
  <div class="grid2"><button class="btn" onclick="mcContinue('${m.id}')">CONTINUAR</button><button class="btn danger" onclick="mcAskDelete('${m.id}')">ELIMINAR</button></div></div>`}).join(''):'<div class="card"><p>Todavía no tenés carreras guardadas. Creá la primera con el botón de abajo.</p></div>';
};
window.mcContinue=function(id){mcActivate(id,true)};
window.mcNewCareer=function(){const f=$('saveName');if(f)f.value='';$('manager')&&career&&!$('manager').value&&($('manager').value=career.manager||'');go('newcareer')};
window.mcRename=function(id){const a=mcSlots(),m=a.find(x=>x.id===id);if(!m)return;const n=prompt('Nombre de la carrera',m.name);if(n===null)return;const nn=n.trim().slice(0,40)||m.name;
 try{const c=JSON.parse(localStorage.getItem('mc_career_v7_'+id));c.saveName=nn;localStorage.setItem('mc_career_v7_'+id,JSON.stringify(c));m.name=nn;localStorage.setItem('mc_index_v7',JSON.stringify(a));if(career&&career.id===id)career.saveName=nn}catch(e){}renderSaves()};
window.mcAskDelete=function(id){const m=mcSlots().find(x=>x.id===id);if(!m)return;
 openModal(`<div class="eyebrow">⚠ ELIMINAR CARRERA</div><h2>${esc(m.name)}</h2><p>Vas a borrar <b>${esc(m.club)}</b> (temporada ${m.season}/${String(m.season+1).slice(-2)}). Esta acción no se puede deshacer.</p><button class="btn danger" style="width:100%" onclick="mcDoDelete('${id}')">SÍ, ELIMINAR</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CANCELAR</button>`)};
window.mcDoDelete=function(id){mcDelete(id);closeModal();renderSaves();try{renderHome()}catch(e){}xToast&&xToast('Carrera eliminada')};
window.resetGame=function(){if(!career){go('saves');return}mcAskDelete(career.id)};
const _go=window.go;
window.go=function(id){
 if(typeof mcStopMatchTimer==='function'&&id!=='match'&&typeof match!=='undefined'&&match&&(match.phase==='first'||match.phase==='second')&&!matchPaused){matchPaused=true}
 const r=_go(id);if(id==='saves')renderSaves();return r};
})();

