
let marketTab='buy';
function ensureMarketData(){
 if(!career)return;
 if(!Array.isArray(career.marketPool)){
  career.marketPool=MARKET.map((p,i)=>({id:'m'+i,name:p[0],pos:p[1],rating:p[2],value:p[3],age:19+((i*7+3)%16),potential:Math.min(99,p[2]+5+(i%8)),club:['Real Sociedad','Benfica','Brighton','River Plate','Porto','Fiorentina','Ajax','PSV'][i%8],wage:Math.max(.3,Math.round(p[2]*.045*10)/10),contract:1+(i%4),listed:true,free:false}));
 }
 if(!Array.isArray(career.marketDeals))career.marketDeals=[];
 if(!Array.isArray(career.transferHistory))career.transferHistory=[];
 career.players.forEach(p=>{if(typeof p.transferListed!=='boolean')p.transferListed=false});
}
function setMarketTab(tab){
 marketTab=tab;
 ['buy','sell','deals'].forEach(t=>{
  let b=$('marketTab'+(t==='buy'?'Buy':t==='sell'?'Sell':'Deals'));
  if(b)b.classList.toggle('active',t===tab);
  let panel=$('market'+(t==='buy'?'Buy':t==='sell'?'Sell':'Deals')+'Panel');
  if(panel)panel.style.display=t===tab?'block':'none';
 });
 renderMarket();
}
function renderMarket(){
 if(!career)return;
 ensureMarketData();
 $('marketBudget').textContent=`$${career.budget}M`;
 $('marketWindow').textContent='ABIERTA';
 $('marketCount').textContent=career.marketPool.filter(p=>p.listed).length;
 let buy=$('marketBuyPanel'),sell=$('marketSellPanel'),deals=$('marketDealsPanel');
 if(buy)buy.style.display=marketTab==='buy'?'block':'none';
 if(sell)sell.style.display=marketTab==='sell'?'block':'none';
 if(deals)deals.style.display=marketTab==='deals'?'block':'none';
 if(marketTab==='buy'){
  let q=($('searchPlayer')?.value||'').toLowerCase(),pos=$('filterPos')?.value||'',min=+$('filterRating')?.value||0,max=+$('filterValue')?.value||999,age=+$('filterAge')?.value||40,sort=$('marketSort')?.value||'rating';
  let list=career.marketPool.filter(p=>p.listed&&(!q||p.name.toLowerCase().includes(q)||p.club.toLowerCase().includes(q))&&(!pos||p.pos===pos)&&p.rating>=min&&p.value<=max&&p.age<=age);
  list.sort((a,b)=>sort==='value'?a.value-b.value:sort==='age'?a.age-b.age:sort==='potential'?b.potential-a.potential:b.rating-a.rating);
  $('marketResultCount').textContent=`${list.length} jugadores encontrados`;
  $('marketList').innerHTML=list.map(p=>`<div class="market-player-card"><div class="rating">${p.rating}</div><div class="market-player-main"><b>${p.name}${p.free?'<span class="market-badge">LIBRE</span>':''}</b><div class="market-meta">${p.pos} · ${p.age} años · POT ${p.potential}</div><div class="market-meta">${p.club} · Contrato ${p.contract} años</div><div class="market-value">Valor $${p.value}M · Salario $${p.wage}M/año</div></div><button class="btn small" onclick="openTransferOffer('${p.id}')">OFERTAR</button></div>`).join('')||'<div class="market-empty">No hay jugadores que coincidan con esos filtros.</div>';
 }else if(marketTab==='sell'){
  let listed=career.players.filter(p=>p.transferListed);
  sell.innerHTML=`<div class="card"><div class="between"><h2>Lista de transferibles</h2><span class="tag">${listed.length} publicados</span></div><p>Publicá jugadores para recibir propuestas de otros clubes.</p>${career.players.map((p,i)=>{let v=Math.max(1,Math.round(p.rating*p.rating/100));return `<div class="market-player-card"><div class="rating">${p.rating}</div><div class="market-player-main"><b>${p.name}</b><div class="market-meta">${p.pos} · ${p.age} años · POT ${p.potential}</div><div class="market-value">Valor estimado $${v}M · Salario $${p.wage}M/año</div><div class="market-meta">${p.transferListed?'EN VENTA':'En plantilla'}</div></div><button class="btn small ${p.transferListed?'secondary':''}" onclick="toggleTransferListing(${i})">${p.transferListed?'QUITAR':'PUBLICAR'}</button></div>`}).join('')}</div><button class="btn secondary" style="width:100%;margin-top:8px" onclick="generateClubBid()">📩 CONSULTAR OFERTAS DE CLUBES</button>`;
 }else{
  let deals=career.marketDeals||[];
  deals.innerHTML=`<div class="card"><h2>Negociaciones y ofertas</h2><p>Seguí el estado de tus operaciones.</p>${deals.length?deals.slice().reverse().map((d,i)=>`<div class="market-deal"><b>${d.player}</b><small>${d.kind} · ${d.status} · ${d.detail}</small></div>`).join(''):'<div class="market-empty">Todavía no hay negociaciones. Buscá un refuerzo o publicá un jugador.</div>'}</div><div class="card"><h2>Historial de fichajes</h2>${(career.transferHistory||[]).slice().reverse().map(x=>`<div class="statsrow"><span>${x.name}</span><b>${x.detail}</b></div>`).join('')||'<p class="muted">No hay movimientos registrados.</p>'}</div>`;
 }
 let n=$('negotiations');if(n)n.innerHTML=(negotiationLog||[]).slice(0,5).map(x=>`<div class="statsrow">${x}</div>`).join('')||'<p>Todavía no hay ofertas.</p>';
}
function openTransferOffer(id){
 ensureMarketData();let p=career.marketPool.find(x=>x.id===id);if(!p)return;
 let ask=Math.max(1,Math.round(p.value*(p.free?0:1.12)));
 openModal(`<div class="eyebrow">NEGOCIACIÓN DE FICHAJE</div><h2>${p.name}</h2><div class="market-player-card"><div class="rating">${p.rating}</div><div class="market-player-main"><b>${p.pos} · ${p.age} años</b><div class="market-meta">${p.club} · POT ${p.potential}</div><div class="market-value">Valor ${p.free?'Jugador libre':'$'+p.value+'M'} · Salario pedido $${p.wage}M/año</div></div></div><label>Oferta al club ($M)</label><input id="transferFee" type="number" min="0" step="0.5" value="${ask}" ${p.free?'disabled':''}><label>Salario anual ($M)</label><input id="transferWage" type="number" min="0.1" step="0.1" value="${p.wage}"><label>Duración del contrato</label><select id="transferYears"><option value="3">3 temporadas</option><option value="2">2 temporadas</option><option value="4">4 temporadas</option><option value="5">5 temporadas</option></select><p class="market-budget-note">Presupuesto disponible: $${career.budget}M. El fichaje depende de la oferta y de las condiciones del jugador.</p><button class="btn" style="width:100%;margin-top:10px" onclick="submitTransferOffer('${p.id}')">ENVIAR PROPUESTA</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CANCELAR</button>`);
}
function submitTransferOffer(id){
 let p=career.marketPool.find(x=>x.id===id);if(!p)return;
 let fee=p.free?0:+$('transferFee').value,wage=+$('transferWage').value,years=+$('transferYears').value;
 if(!Number.isFinite(fee)||!Number.isFinite(wage)||fee<0||wage<=0){alert('Revisá los importes de la oferta.');return}
 if(fee>career.budget){alert('La oferta supera tu presupuesto.');return}
 let wageBudget=(career.wageBudget||Math.max(5,career.budget*.18));
 if(wage>wageBudget){alert('La oferta salarial supera el margen salarial disponible.');return}
 let feeRatio=p.free?1:fee/Math.max(1,p.value);
 let wageRatio=wage/Math.max(.1,p.wage);
 let chance=Math.max(.04,Math.min(.96,.24+Math.max(0,feeRatio-0.8)*.45+Math.max(0,wageRatio-0.8)*.24+(career.board-50)/300-(p.age<21?.03:0)));
 if(Math.random()<chance){
  career.budget-=fee;
  let player={id:Date.now()+Math.floor(Math.random()*1000),name:p.name,pos:p.pos,rating:p.rating,potential:p.potential,age:p.age,fitness:95,morale:78,goals:0,assists:0,apps:0,contract:years,wage,number:career.players.length+1,pace:60+p.rating%35,shooting:p.pos==='DEL'?p.rating+2:55+p.rating%20,passing:p.pos==='MED'?p.rating+2:55+p.rating%20,defending:p.pos==='DEF'?p.rating+2:50+p.rating%20,stamina:70+p.rating%25,strength:60+p.rating%30,injury:null,personality:'Nuevo fichaje',foot:'Derecho',weakFoot:3};
  career.players.push(player);p.listed=false;
  let msg=`${p.name} fichó por $${fee}M, con salario de $${wage}M/año.`;
  career.inbox.unshift('Fichaje confirmado: '+msg);career.transferHistory.push({name:p.name,detail:'ENTRADA · $'+fee+'M'});career.marketDeals.push({player:p.name,kind:'Fichaje',status:'ACEPTADO',detail:`$${fee}M · $${wage}M/año`});negotiationLog.unshift('✅ '+msg);
 }else{
  let status=feeRatio<.85?'Oferta económica insuficiente':'El jugador no aceptó las condiciones';
  career.marketDeals.push({player:p.name,kind:'Fichaje',status:'RECHAZADO',detail:status});negotiationLog.unshift('❌ '+p.name+': '+status.toLowerCase()+'.');career.inbox.unshift('Negociación fallida por '+p.name+'.');
 }
 save();closeModal();renderMarket();renderSquad();
}
function toggleTransferListing(i){
 let p=career.players[i];p.transferListed=!p.transferListed;
 career.inbox.unshift(p.name+(p.transferListed?' fue puesto en la lista de transferibles.':' ya no está en venta.'));
 save();renderMarket();
}
function generateClubBid(){
 let pool=career.players.filter(p=>p.transferListed);
 if(!pool.length){alert('Primero publicá al menos un jugador en la lista de transferibles.');return}
 let p=pool[Math.floor(Math.random()*pool.length)],value=Math.max(1,Math.round(p.rating*p.rating/100)),offer=Math.max(1,Math.round(value*(.82+Math.random()*.38)));
 career.marketDeals.push({player:p.name,kind:'Oferta recibida',status:'PENDIENTE',detail:`Club interesado ofrece $${offer}M`});
 openModal(`<div class="eyebrow">OFERTA DE OTRO CLUB</div><h2>${p.name}</h2><p>Un club presentó una oferta de <b>$${offer}M</b> por tu jugador.</p><p>Valor estimado: $${value}M · GRL ${p.rating}</p><button class="btn" style="width:100%" onclick="acceptClubBid(${p.id},${offer})">ACEPTAR OFERTA</button><button class="btn secondary" style="width:100%;margin-top:7px" onclick="rejectClubBid('${p.name}')">RECHAZAR</button>`);
 save();renderMarket();
}
function acceptClubBid(id,offer){
 let i=career.players.findIndex(p=>p.id===id);if(i<0)return;
 let p=career.players[i];career.budget+=offer;career.players.splice(i,1);
 career.transferHistory.push({name:p.name,detail:'SALIDA · +$'+offer+'M'});career.marketDeals.push({player:p.name,kind:'Venta',status:'ACEPTADA',detail:`Venta por $${offer}M`});career.inbox.unshift('Venta confirmada: '+p.name+' por $'+offer+'M.');
 save();closeModal();renderMarket();renderSquad();
}
function rejectClubBid(name){career.marketDeals.push({player:name,kind:'Venta',status:'RECHAZADA',detail:'Oferta declinada por el club'});save();closeModal();renderMarket()}
