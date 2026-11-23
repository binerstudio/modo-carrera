
/* ===== MODO CARRERA 6.3 · LIGA: calendario completo (todos los partidos de todos los equipos) y
   clasificación calculada SOLO con los resultados jugados (PJ, G, E, P, GF, GC, DG, PTS) ===== */
(function(){
const $=id=>document.getElementById(id);
const R=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
/* ---- fuerza de cada club = GRL de sus 11 titulares ---- */
const GRLC=new Map();
function teamGRL(club){
 if(career&&club===career.club)return avgRating();
 if(GRLC.has(club))return GRLC.get(club);
 let v=0;try{const rr=padRoster(rosterFor(club).map(r=>[r[0],r[1],r[2],r[3],r[4],r[5]]),club).slice(0,11);v=rr.length?rr.reduce((a,x)=>a+(Number(x[2])||0),0)/rr.length:0}catch(e){}
 GRLC.set(club,v);return v}
window.mcTeamGRL=teamGRL;window.mcClearGRL=function(){GRLC.clear()};
/* ---- cantidad de fechas: Argentina 30 equipos → 29 (una rueda); 20 equipos → 38; 18 → 34 (ida y vuelta) ---- */
function totalFor(country,n){const f=(LEAGUES[country]||{}).fecha;const one=n%2?n:n-1;return f||one*2}
/* ---- fixture por método del círculo: todos contra todos, nadie repite rival en la misma rueda.
   El club del usuario es el pivote, así sus rivales salen en el mismo orden que antes (compatibilidad con partidas guardadas) ---- */
function buildSchedule(teams,user,rounds){
 const T=teams.slice();if(T.length%2)T.push(null);
 const F=T.includes(user)?user:T[0],L=T.filter(x=>x!==F),m=L.length,first=[];
 for(let r=0;r<m;r++){const day=[],o=L[r];
  if(o!==null)day.push(r%2===0?[F,o]:[o,F]);
  /* localía equilibrada: cada club es local en la mitad de sus partidos de cada rueda */
  for(let k=1;k<=(m-1)/2;k++){const a=L[(r+k)%m],b=L[(r-k+m)%m];if(a===null||b===null)continue;day.push(2*k<=(m-1)/2?[a,b]:[b,a])}
  first.push(day)}
 const out=[];let leg=0;while(out.length<rounds&&first.length){for(const d of first){if(out.length>=rounds)break;out.push(d.map(p=>leg%2?[p[1],p[0]]:[p[0],p[1]]))}leg++}
 return out}
function poisson(l){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=R()}while(p>L);return k-1}
/* partido entre otros dos clubes: el GRL define las expectativas de gol (+ localía) */
function simFix(L,f){const d=teamGRL(L.teams[f[0]])-teamGRL(L.teams[f[1]]);
 f[2]=poisson(clamp(1.38*Math.exp(d*.055),.25,4.2));f[3]=poisson(clamp(1.08*Math.exp(-d*.055),.2,3.8))}
function seasonHistory(){return(career.history||[]).filter(h=>h.season==null||h.season===career.season)}
/* ---- crea (o migra) la liga de la temporada ---- */
function ensureLeague(){
 if(!career)return null;const teams=CLUBS[career.country]||[];let L=career.league;
 if(L&&L.v===1&&L.season===career.season&&L.country===career.country&&L.teams.length===teams.length&&L.teams.includes(career.club))return L;
 /* 11.0: una temporada ya empezada con el motor mundial conserva su calendario aunque la base agregue o quite clubes;
    los cambios de la base se aplican desde la temporada siguiente */
 if(L&&L.mc10&&L.season===career.season&&L.country===career.country&&L.teams.includes(career.club))return L;
 const total=totalFor(career.country,teams.length),ix=new Map(teams.map((t,i)=>[t,i]));
 L={v:1,season:career.season,country:career.country,teams:teams.slice(),
  rounds:buildSchedule(teams,career.club,total).map(d=>d.map(p=>[ix.get(p[0]),ix.get(p[1]),null,null]))};
 career.league=L;
 /* partidas anteriores: se respetan los resultados ya jugados por tu club y se completan las demás fechas */
 const ui=ix.get(career.club),H=seasonHistory(),done=Math.min(career.round||0,L.rounds.length);
 for(let r=0;r<done;r++){const f=L.rounds[r].find(x=>x[0]===ui||x[1]===ui),h=H[r];
  if(f&&h&&h.h!=null){if((h.venue||'h')==='h'){if(f[0]!==ui){const t=f[0];f[0]=f[1];f[1]=t}f[2]=h.h;f[3]=h.a}else{if(f[1]!==ui){const t=f[0];f[0]=f[1];f[1]=t}f[2]=h.a;f[3]=h.h}}
  L.rounds[r].forEach(x=>{if(x[2]==null)simFix(L,x)})}
 career.round=done;sync();return L}
window.mcEnsureLeague=ensureLeague;
/* ---- tabla de posiciones calculada con los partidos jugados ---- */
function table(L){L=L||ensureLeague();if(!L)return[];
 const rows=L.teams.map((n,i)=>({i,name:n,pj:0,g:0,e:0,p:0,gf:0,gc:0,dg:0,pts:0,form:[]}));
 L.rounds.forEach(d=>d.forEach(f=>{if(f[2]==null)return;const H=rows[f[0]],A=rows[f[1]];
  H.pj++;A.pj++;H.gf+=f[2];H.gc+=f[3];A.gf+=f[3];A.gc+=f[2];
  if(f[2]>f[3]){H.g++;A.p++;H.pts+=3;H.form.push('W');A.form.push('L')}
  else if(f[2]<f[3]){A.g++;H.p++;A.pts+=3;H.form.push('L');A.form.push('W')}
  else{H.e++;A.e++;H.pts++;A.pts++;H.form.push('D');A.form.push('D')}}));
 rows.forEach(r=>r.dg=r.gf-r.gc);
 rows.sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf||a.name.localeCompare(b.name));return rows}
window.mcTable=table;
/* los números de tu club (puntos, PJ, goles…) salen siempre de la tabla: nunca pueden quedar desfasados */
function sync(){const L=career.league;if(!L)return;const r=table(L).find(x=>x.name===career.club);if(!r)return;
 career.played=r.pj;career.w=r.g;career.d=r.e;career.l=r.p;career.gf=r.gf;career.ga=r.gc;career.points=r.pts}
window.mcLeagueSync=sync;
const uIdx=L=>L.teams.indexOf(career.club);
function userFix(r){const L=ensureLeague();if(!L||r>=L.rounds.length)return null;const u=uIdx(L);return L.rounds[r].find(x=>x[0]===u||x[1]===u)||null}
window.mcTotalRounds=function(){const L=ensureLeague();return L?L.rounds.length:0};
window.mcSeasonOver=function(){const L=ensureLeague();return !!L&&career.round>=L.rounds.length};
window.mcVenue=function(){const f=userFix(career.round);return f&&f[1]===uIdx(career.league)?'a':'h'};
/* rival de la fecha actual según el calendario */
window.opponent=function(){const L=ensureLeague(),f=userFix(career.round);if(!f)return null;return L.teams[f[0]===uIdx(L)?f[1]:f[0]]};
window.rank=function(){const t=table();const i=t.findIndex(x=>x.name===career.club);return i>=0?i+1:'-'};
/* registra tu partido y simula el resto de la fecha */
window.mcLeagueRecord=function(m){const L=ensureLeague();if(!L)return false;const r=career.round;if(r>=L.rounds.length)return false;
 const u=uIdx(L),f=L.rounds[r].find(x=>x[0]===u||x[1]===u);
 if(f){if(f[0]===u){f[2]=m.h;f[3]=m.a}else{f[2]=m.a;f[3]=m.h}}
 L.rounds[r].forEach(x=>{if(x!==f&&x[2]==null)simFix(L,x)});
 career.round=r+1;sync();
 if(career.round>=L.rounds.length){const t=table(L),pos=t.findIndex(x=>x.name===career.club)+1;
  career.inbox.unshift(`Terminó la temporada ${career.season}/${String(career.season+1).slice(-2)}: ${t[0].name} es campeón. ${career.club} terminó ${pos}º con ${t[pos-1].pts} puntos.`)}
 return true};
/* ---- próximo desafío (panel del club) ---- */
window.fixtureHTML=function(){
 const L=ensureLeague(),f=userFix(career.round);
 if(!f){const t=table(L),pos=t.findIndex(x=>x.name===career.club)+1;
  return `<div class="fixture"><div class="clubtitle" style="text-align:center">🏆 Temporada finalizada</div><p class="tiny" style="text-align:center;margin:6px 0">Campeón: <b class="gold">${esc(t[0]?t[0].name:'-')}</b> · ${esc(career.club)} terminó ${pos}º con ${t[pos-1]?t[pos-1].pts:0} pts.</p><button class="btn secondary" style="width:100%" onclick="mcSeasonEndModal()">VER CIERRE DE TEMPORADA</button></div>`}
 const h=L.teams[f[0]],a=L.teams[f[1]];
 return `<div class="fixture"><div class="between"><div class="flex"><div>${clubBadge(h,36)}</div><div><div class="clubtitle">${esc(h)}</div><div class="tiny muted">LOCAL</div></div></div><b class="gold">VS</b><div class="flex"><div style="text-align:right"><div class="clubtitle">${esc(a)}</div><div class="tiny muted">VISITANTE</div></div><div>${clubBadge(a,36)}</div></div></div><div class="between tiny muted"><span>LIGA · FECHA ${career.round+1} DE ${L.rounds.length}</span><span>${h===career.club?'DE LOCAL':'DE VISITANTE'}</span></div></div>`};
(function(){const o=window.renderDashboard;window.renderDashboard=function(){if(!career)return;ensureLeague();o();
 const L=career.league;$('roundTag').textContent=career.round>=L.rounds.length?'TEMPORADA TERMINADA':`FECHA ${career.round+1}/${L.rounds.length}`}})();
/* ---- cierre de temporada ---- */
window.mcSeasonEndModal=function(){const L=ensureLeague(),t=table(L),pos=t.findIndex(x=>x.name===career.club)+1,me=t[pos-1]||{};
 openModal(`<div class="eyebrow">FIN DE TEMPORADA ${career.season}/${String(career.season+1).slice(-2)}</div><h2>🏆 ${esc(t[0].name)} campeón</h2><div class="statsrow"><span>Posición final de ${esc(career.club)}</span><b>${pos}º</b></div><div class="statsrow"><span>Puntos</span><b>${me.pts}</b></div><div class="statsrow"><span>Récord</span><b>${me.g}G ${me.e}E ${me.p}P · ${me.gf}-${me.gc}</b></div><p class="tiny">Ya se jugaron las ${L.rounds.length} fechas. Podés revisar la tabla y el calendario o arrancar la próxima temporada (el plantel se mantiene).</p><button class="btn" style="width:100%" onclick="mcNewSeason()">INICIAR TEMPORADA ${career.season+1}/${String(career.season+2).slice(-2)} →</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">SEGUIR VIENDO LA TABLA</button>`)};
window.mcNewSeason=function(){if(!career)return;career.season++;career.round=0;career.league=null;
 career.played=career.w=career.d=career.l=career.gf=career.ga=career.points=0;match=null;ensureLeague();
 career.inbox.unshift(`Comienza la temporada ${career.season}/${String(career.season+1).slice(-2)}. El nuevo calendario ya está disponible.`);
 save();closeModal();try{renderAll()}catch(e){}go('dashboard')};
/* ---- pantalla de competiciones: Clasificación · Calendario · Goleadores · Copa ---- */
const formHTML=f=>f.slice(-5).map(x=>`<i class="mc-f ${x}">${x==='W'?'G':x==='D'?'E':'P'}</i>`).join('');
function tableHTML(){const L=ensureLeague(),t=table(L),lg=LEAGUES[career.country]||{},played=Math.min(career.round,L.rounds.length);
 return `<div class="card"><h2>${esc(leagueName(career.country))}</h2><p class="tiny">${esc(lg.formato||'')} · Fecha ${played} de ${L.rounds.length} jugada${played===1?'':'s'}.</p>
 <div class="mc-tw"><table class="table mc-tbl"><tr><th>#</th><th class="cl">Club</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr>${t.map((r,i)=>`<tr class="${r.name===career.club?'you':''}"><td>${i+1}</td><td class="cl"><span class="mc-cl">${clubBadge(r.name,18)}<span>${esc(r.name)}</span></span></td><td>${r.pj}</td><td>${r.g}</td><td>${r.e}</td><td>${r.p}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.dg>0?'+':''}${r.dg}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table></div>
 <p class="tiny">Tabla calculada con los resultados del calendario: cada partido jugado suma PJ, goles y puntos (3 por victoria, 1 por empate). Desempate: diferencia de gol y goles a favor.</p>
 ${t.find(x=>x.name===career.club)?`<div class="statsrow"><span>Forma de ${esc(career.club)}</span><span>${formHTML(t.find(x=>x.name===career.club).form)||'—'}</span></div>`:''}</div>`}
function calHTML(){const L=ensureLeague(),u=uIdx(L),cur=career.round,n=L.rounds.length,sel=Math.min(cur,n-1);
 const row=f=>{const h=L.teams[f[0]],a=L.teams[f[1]],mine=f[0]===u||f[1]===u,pl=f[2]!=null;
  return `<div class="mc-fx${mine?' you':''}"><span class="mc-t h"><span>${esc(h)}</span>${clubBadge(h,18)}</span><b class="mc-s${pl?'':' p'}">${pl?f[2]+' - '+f[3]:'vs'}</b><span class="mc-t a">${clubBadge(a,18)}<span>${esc(a)}</span></span></div>`};
 return `<div class="card"><div class="between"><h2>Calendario</h2><span class="tag">${n} FECHAS</span></div><p class="tiny">${esc(leagueName(career.country))} · ${L.teams.length} equipos · ${n*Math.floor(L.teams.length/2)} partidos. Tu club aparece resaltado.</p>
 <select id="mcRoundSel" onchange="mcGoRound(+this.value)">${L.rounds.map((_,r)=>`<option value="${r}"${r===sel?' selected':''}>Fecha ${r+1}${r<cur?' · jugada':r===cur?' · próxima':''}</option>`).join('')}</select></div>`+
 L.rounds.map((d,r)=>`<div class="card mc-round${r===cur?' cur':''}" id="mcR${r}"><div class="between"><h2>Fecha ${r+1}</h2><span class="tag">${r<cur?'JUGADA':r===cur?'PRÓXIMA':'PENDIENTE'}</span></div>${d.map(row).join('')}</div>`).join('')}
window.mcGoRound=function(r){const el=$('mcR'+r);if(el)window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-74,behavior:'smooth'})};
window.renderLeague=function(){if(!career)return;const L=ensureLeague();
 const h1=document.querySelector('#league h1');if(h1)h1.textContent=`Temporada ${career.season}/${String(career.season+1).slice(-2)}`;
 const box=$('leagueContent');if(!box)return;
 if(leagueView==='table')box.innerHTML=tableHTML()+(mcSeasonOver()?`<button class="btn x-go" onclick="mcSeasonEndModal()">🏆 CIERRE DE TEMPORADA</button>`:'');
 else if(leagueView==='calendar'){box.innerHTML=calHTML();const r=Math.min(career.round,L.rounds.length-1);if(r>0)setTimeout(()=>{const el=$('mcR'+r);if(el&&document.getElementById('league').classList.contains('active'))window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-74})},30)}
 else if(leagueView==='scorers')box.innerHTML=`<div class="card"><h2>Goleadores del equipo</h2>${[...career.players].sort((a,b)=>b.goals-a.goals).slice(0,10).map(p=>`<div class="statsrow"><span>${p.name}</span><b>${p.goals} goles</b></div>`).join('')}</div>`;
 else box.innerHTML=`<div class="card"><div class="eyebrow">COPA NACIONAL</div><h2>Camino a la final</h2><p>${(LEAGUES[career.country]||{}).copa||'Copa nacional'}: la copa se habilitará como competición eliminatoria en una próxima etapa. Por ahora podés seguir la liga y sus estadísticas.</p><p class="tiny">Clasificación continental: ${(LEAGUES[career.country]||{}).cont||''}</p><span class="pill">FORMATO · ELIMINACIÓN DIRECTA</span><span class="pill">8 EQUIPOS</span></div>`;
};
/* las partidas que se abren o se crean quedan con su calendario listo */
(function(){const o=window.mcActivate;window.mcActivate=function(id,goTo){const ok=o(id,false);if(ok){try{const b=career.league;ensureLeague();let ch=career.league!==b;if(career.players.slice(0,11).some(p=>mcUnavailable(p))){mcReplaceUnavailable();ch=true}if(ch)save();renderAll()}catch(e){console.error(e)}if(goTo!==false)go('dashboard')}return ok}})();
(function(){const o=window.createCareer;window.createCareer=function(){o();try{if(career){ensureLeague();save();renderDashboard()}}catch(e){console.error(e)}}})();
})();
