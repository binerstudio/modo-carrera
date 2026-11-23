
/* ===== MODO CARRERA 6.2 · MERCADO: base completa + búsqueda y filtros combinados ===== */
(function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
let DB=null,pageN=40,sig='';
window.MC_ADD_PLAYERS=function(rows){(window.MC_EXTRA=window.MC_EXTRA||[]).push(...rows);DB=null};
window.mcResetDB=function(){DB=null};
const clubLeague=(()=>{let m=null;return c=>{if(!m){m=new Map();for(const k in CLUBS)CLUBS[k].forEach(x=>m.set(x,k))}return m.get(c)||'Otras ligas'}})();
function hashN(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
function estVal(r,a){const b=Math.pow(Math.max(0,r-60)/30,3.2)*160;return Math.max(.5,Math.round(b*(a<=21?1.35:a<=24?1.12:a>=33?.4:a>=30?.7:1)))}
function decorate(o){o._n=mcNorm(o.name);o.league=clubLeague(o.club);
 const y=o.age<=23,h=hashN(o.name);o.potential=Math.min(95,o.rating+(y?Math.max(2,Math.round((24-o.age)*1.5)+h%3):o.age<=27?(h%2):0));
 o.wage=Math.max(.3,Math.round((o.rating-55)*.12*10)/10);o.contract=1+h%4;o.free=false;return o}
function buildDB(){
 if(DB)return DB;const D=window.MC_PLAYERS,base=[],keys=new Set(),names=new Set(),keyByNorm=new Map();
 const push=o=>{const k=mcNorm(o.name);if(names.has(k))return;names.add(k);let id=mcKebab(o.name),n=1;while(keys.has(id))id=mcKebab(o.name)+'-'+(++n);keys.add(id);o.id=id;keyByNorm.set(k,id);base.push(o)};
 if(D)D.rows.forEach(r=>push({name:r[0],pos:r[1],rating:r[2],age:r[3],nat:D.nats[r[4]],value:r[5],club:D.clubs[r[6]],number:r[7]||null}));
 for(const club in ROSTERS)ROSTERS[club].forEach(p=>push({name:p[0],pos:p[1],rating:p[2],age:p[3]||(23+hashN(p[0])%9),nat:'—',value:estVal(p[2],p[3]||26),club}));
 (window.MC_EXTRA||[]).forEach(r=>push({name:r[0],pos:r[1],rating:r[2],age:r[3],nat:r[4],value:r[5],club:r[6]}));
 /* cambios hechos desde el Administrador de jugadores (se guardan aparte, nunca en este archivo) */
 const eff=window.mcPlayerOverlay?mcPlayerOverlay(base):base;
 const list=[],byId=new Map();eff.forEach(o=>{if(byId.has(o.id))return;decorate(o);list.push(o);byId.set(o.id,o)});
 const clubs=[...new Set(list.map(x=>x.club))].sort((a,b)=>a.localeCompare(b)),nats=[...new Set(list.map(x=>x.nat).filter(x=>x&&x!=='—'))].sort((a,b)=>a.localeCompare(b,'es'));
 DB={list,byId,clubs,nats,base,keyByNorm};return DB}
window.mcDB=buildDB;
function getP(id){const d=buildDB();if(d.byId.has(id))return d.byId.get(id);return (career.mkt.extra||[]).find(x=>x.id===id)||null}
function pool(){
 const d=buildDB(),sq=new Set(career.players.map(p=>mcNorm(p.name))),gone=career.mkt.gone;
 const base=d.list.filter(p=>!gone[p.id]&&p.club!==career.club&&!sq.has(p._n));
 const ex=(career.mkt.extra||[]).filter(p=>!gone[p.id]&&!sq.has(mcNorm(p.name)));ex.forEach(p=>{if(!p._n)p._n=mcNorm(p.name);if(!p.league)p.league=clubLeague(p.club)});
 return base.concat(ex)}
window.ensureMarketData=function(){if(!career)return;if(!career.mkt)career.mkt={gone:{},extra:[]};if(!Array.isArray(career.marketDeals))career.marketDeals=[];if(!Array.isArray(career.transferHistory))career.transferHistory=[];career.players.forEach(p=>{if(typeof p.transferListed!=='boolean')p.transferListed=false})};
/* ---- filtros ---- */
const v=id=>{const e=$(id);return e?e.value:''};
function filters(){return{q:mcNorm(v('searchPlayer')).trim(),pos:v('filterPos'),league:v('mkLeague'),club:v('mkClub'),nat:v('mkNat'),amin:parseFloat(v('mkAgeMin')),amax:parseFloat(v('mkAgeMax')),rmin:parseFloat(v('mkRatMin')),vmax:parseFloat(v('mkValMax')),aff:$('mkAff')&&$('mkAff').checked,sort:v('mkSort')||'rating'}}
function apply(F){
 const toks=F.q?F.q.split(/\s+/).filter(Boolean):[];
 let L=pool().filter(p=>{
  if(toks.length&&!toks.every(t=>p._n.includes(t)))return false;
  if(F.pos&&p.pos!==F.pos)return false;if(F.league&&p.league!==F.league)return false;if(F.club&&p.club!==F.club)return false;if(F.nat&&p.nat!==F.nat)return false;
  if(!isNaN(F.amin)&&p.age<F.amin)return false;if(!isNaN(F.amax)&&p.age>F.amax)return false;if(!isNaN(F.rmin)&&p.rating<F.rmin)return false;if(!isNaN(F.vmax)&&p.value>F.vmax)return false;
  if(F.aff&&p.value>career.budget)return false;return true});
 const S={rating:(a,b)=>b.rating-a.rating||b.value-a.value,value:(a,b)=>b.value-a.value,valueAsc:(a,b)=>a.value-b.value,age:(a,b)=>a.age-b.age,pot:(a,b)=>b.potential-a.potential||b.rating-a.rating,name:(a,b)=>a.name.localeCompare(b.name)};
 return L.sort(S[F.sort]||S.rating)}
window.mcBuyHTML=function(){
 const F=filters(),s=JSON.stringify(F);if(s!==sig){sig=s;pageN=40}
 const L=apply(F),shown=L.slice(0,pageN);
 const cards=shown.map(p=>`<div class="x-pc"><div class="ph">${avatar(p.pos)}</div><div><b>${esc(p.name)}</b><div class="mt"><span class="pp ${p.pos}">${p.pos}</span>${p.age} años${p.nat&&p.nat!=='—'?' · '+esc(p.nat):''}</div><div class="mt">${esc(p.club)}${p.league!=='Otras ligas'?' · '+esc((LEAGUES[p.league]||{}).abrev||''):''} · POT ${p.potential}</div></div><div class="rt"><span class="st">★ ${p.rating}</span><span>Valor: <b style="display:inline">$${p.value}M</b></span><button class="nb" onclick="openTransferOffer('${p.id}')">Negociar »</button></div></div>`).join('');
 const more=L.length>pageN?`<button class="btn secondary x-go" onclick="mcMore()">VER MÁS (${L.length-pageN} restantes)</button>`:'';
 return `<div class="mk-count">${L.length.toLocaleString('es')} de ${pool().length.toLocaleString('es')} jugadores</div>`+(cards||'<div class="x-panel x-emp">No hay jugadores con esa combinación de búsqueda y filtros.</div>')+more};
window.mcMore=function(){pageN+=40;renderMarket()};
let deb=null;window.mcSearch=function(){clearTimeout(deb);deb=setTimeout(()=>renderMarket(),160)};
window.mcToggleFilters=function(){const f=$('mkFilters'),o=f.style.display==='none';f.style.display=o?'grid':'none';$('mkToggle').textContent=o?'FILTROS ▴':'FILTROS ▾'};
window.mcLeagueChanged=function(){fillClubOptions();renderMarket()};
function fillClubOptions(){const d=buildDB(),lg=v('mkLeague'),cur=v('mkClub');const cl=[...new Set(d.list.filter(p=>!lg||p.league===lg).map(p=>p.club))].sort((a,b)=>a.localeCompare(b));
 $('mkClub').innerHTML='<option value="">Club (todos)</option>'+cl.map(c=>`<option>${esc(c)}</option>`).join('');if(cl.includes(cur))$('mkClub').value=cur}
window.mcFillFilters=function(){if(!$('mkLeague'))return;const d=buildDB();
 $('mkLeague').innerHTML='<option value="">Liga (todas)</option>'+LEAGUE_ORDER.map(l=>`<option value="${l}">${LEAGUES[l].nombre}</option>`).join('')+'<option value="Otras ligas">Otras ligas</option>';
 $('mkNat').innerHTML='<option value="">Nacionalidad (todas)</option>'+d.nats.map(n=>`<option>${esc(n)}</option>`).join('');fillClubOptions()};
window.mcClearFilters=function(){['searchPlayer','filterPos','mkLeague','mkClub','mkNat','mkAgeMin','mkAgeMax','mkRatMin','mkValMax'].forEach(i=>{const e=$(i);if(e)e.value=''});$('mkAff').checked=false;$('mkSort').value='rating';fillClubOptions();renderMarket()};
/* ---- negociación ---- */
function nextNumber(){const u=new Set(career.players.map(p=>p.number));let n=1;while(u.has(n))n++;return n}
window.openTransferOffer=function(id){
 ensureMarketData();const p=getP(id);if(!p)return;
 const ask=Math.max(.5,Math.round(p.value*1.12*2)/2),wb=(career.wageBudget||Math.max(5,career.budget*.18));
 openModal(`<div class="eyebrow">NEGOCIACIÓN DE FICHAJE</div><h2>${esc(p.name)}</h2><div class="market-player-card"><div class="rating">${p.rating}</div><div class="market-player-main"><b>${p.pos} · ${p.age} años${p.nat&&p.nat!=='—'?' · '+esc(p.nat):''}</b><div class="market-meta">${esc(p.club)} · POT ${p.potential}</div><div class="market-value">Valor $${p.value}M · Salario pedido $${p.wage}M/año</div></div></div><label>Oferta al club ($M)</label><input id="transferFee" type="number" min="0" step="0.5" value="${ask}"><label>Salario anual ($M)</label><input id="transferWage" type="number" min="0.1" step="0.1" value="${p.wage}"><label>Duración del contrato</label><select id="transferYears"><option value="3">3 temporadas</option><option value="2">2 temporadas</option><option value="4">4 temporadas</option><option value="5">5 temporadas</option></select><p class="market-budget-note">Presupuesto disponible: $${career.budget}M · Margen salarial: $${wb.toFixed(1)}M. El jugador llegará al plantel y podés acomodarlo desde Plantel.</p><button class="btn" style="width:100%;margin-top:10px" onclick="submitTransferOffer('${p.id}')">ENVIAR PROPUESTA</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CANCELAR</button>`);
};
window.submitTransferOffer=function(id){
 const p=getP(id);if(!p)return;const fee=+$('transferFee').value,wage=+$('transferWage').value,years=+$('transferYears').value;
 if(!Number.isFinite(fee)||!Number.isFinite(wage)||fee<0||wage<=0){alert('Revisá los importes de la oferta.');return}
 if(fee>career.budget){alert('La oferta supera tu presupuesto.');return}
 const wb=(career.wageBudget||Math.max(5,career.budget*.18));if(wage>wb){alert('La oferta salarial supera el margen salarial disponible.');return}
 const feeRatio=fee/Math.max(.5,p.value),wageRatio=wage/Math.max(.1,p.wage);
 const chance=Math.max(.04,Math.min(.96,.24+Math.max(0,feeRatio-.8)*.45+Math.max(0,wageRatio-.8)*.24+(career.board-50)/300-(p.age<21?.03:0)-(p.rating>=88?.12:0)));
 if(Math.random()<chance){
  career.budget=Math.round((career.budget-fee)*10)/10;
  const r=p.rating,P={id:(career.players.reduce((m,x)=>Math.max(m,x.id),0)+1),name:p.name,pos:p.pos,rating:r,potential:p.potential,age:p.age,nat:p.nat,value:p.value,fromClub:p.club,fitness:95,morale:78,goals:0,assists:0,apps:0,contract:years,wage,number:nextNumber(),
   pace:60+r%35,shooting:p.pos==='DEL'?r+2:55+r%20,passing:p.pos==='MED'?r+2:55+r%20,defending:p.pos==='DEF'?r+2:50+r%20,stamina:70+r%25,strength:60+r%30,injury:null,personality:'Nuevo fichaje',foot:'Derecho',weakFoot:3,transferListed:false};
  career.players.push(P);career.mkt.gone[p.id]=1;career.mkt.extra=(career.mkt.extra||[]).filter(x=>x.id!==p.id);
  const msg=`${p.name} (${p.club}) fichó por $${fee}M, con salario de $${wage}M/año.`;
  career.inbox.unshift('Fichaje confirmado: '+msg);career.transferHistory.push({name:p.name,detail:'ENTRADA · $'+fee+'M'});career.marketDeals.push({player:p.name,kind:'Fichaje',status:'ACEPTADO',detail:`$${fee}M · $${wage}M/año`});negotiationLog.unshift('✅ '+msg);
  save();closeModal();renderMarket();try{renderSquad()}catch(e){}xToast&&xToast(`¡${p.name} es nuevo jugador de tu club!`);
 }else{
  const ask=Math.ceil(p.value*1.05),status=feeRatio<.85?`Oferta económica insuficiente (piden cerca de $${ask}M)`:'El jugador no aceptó las condiciones';
  career.marketDeals.push({player:p.name,kind:'Fichaje',status:'RECHAZADO',detail:status});negotiationLog.unshift('❌ '+p.name+': '+status.toLowerCase()+'.');career.inbox.unshift('Negociación fallida por '+p.name+'.');
  save();closeModal();renderMarket();xToast&&xToast('Oferta rechazada: '+status);
 }
};
window.generateClubBid=function(){
 const list=career.players.filter(p=>p.transferListed);
 if(!list.length){alert('Primero publicá al menos un jugador en la lista de transferibles.');return}
 if(career.players.length<=16){alert('Tu plantel tiene el mínimo de jugadores (16). Fichá antes de vender.');return}
 const p=list[Math.floor(Math.random()*list.length)],value=p.value!=null?p.value:Math.max(1,Math.round(p.rating*p.rating/100)),offer=Math.max(1,Math.round(value*(.82+Math.random()*.38)));
 career.marketDeals.push({player:p.name,kind:'Oferta recibida',status:'PENDIENTE',detail:`Club interesado ofrece $${offer}M`});
 openModal(`<div class="eyebrow">OFERTA DE OTRO CLUB</div><h2>${esc(p.name)}</h2><p>Un club presentó una oferta de <b>$${offer}M</b> por tu jugador.</p><p>Valor estimado: $${value}M · GRL ${p.rating}</p><button class="btn" style="width:100%" onclick="acceptClubBid(${p.id},${offer})">ACEPTAR OFERTA</button><button class="btn secondary" style="width:100%;margin-top:7px" onclick="rejectClubBid('${esc(p.name).replace(/'/g,"\\'")}')">RECHAZAR</button>`);
 save();renderMarket();
};
window.acceptClubBid=function(id,offer){
 const i=career.players.findIndex(p=>p.id===id);if(i<0)return;if(career.players.length<=16){alert('Plantel mínimo: 16 jugadores.');return}
 const p=career.players[i];career.budget=Math.round((career.budget+offer)*10)/10;career.players.splice(i,1);
 const others=(CLUBS[career.country]||[]).filter(c=>c!==career.club);
 career.mkt.extra=(career.mkt.extra||[]).concat([{id:'x-'+mcKebab(p.name)+'-'+Date.now().toString(36),name:p.name,pos:p.pos,rating:p.rating,age:p.age,nat:p.nat||'—',value:Math.max(1,Math.round(offer)),club:others[Math.floor(Math.random()*others.length)]||'Otro club',potential:p.potential,wage:p.wage,contract:p.contract,free:false}]);
 fitXI();
 career.transferHistory.push({name:p.name,detail:'SALIDA · +$'+offer+'M'});career.marketDeals.push({player:p.name,kind:'Venta',status:'ACEPTADA',detail:`Venta por $${offer}M`});career.inbox.unshift('Venta confirmada: '+p.name+' por $'+offer+'M.');
 save();closeModal();renderMarket();try{renderSquad()}catch(e){}
};
})();

