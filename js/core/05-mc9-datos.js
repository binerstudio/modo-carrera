
/* ===== MODO CARRERA 6.4 · DATOS: almacenamiento con migraciones, copias de seguridad y administrador de jugadores =====
   REGLAS PARA FUTURAS VERSIONES (para no perder datos nunca):
   1) NO cambiar ni borrar las claves existentes: mc_career_v7_<id>, mc_index_v7, mc_active_v7, mc_players_v1, mc_settings*, modo_carrera_41.
   2) Si el formato cambia, sumar una migración NUEVA al final de GLOBAL_MIGRATIONS (datos generales) o de
      CAREER_MIGRATIONS (cada carrera) y subir el número de versión. Nunca editar ni quitar migraciones viejas.
   3) Las migraciones solo agregan o transforman; no borran datos del usuario.
   4) Antes de migrar, al cambiar de versión de la app, una vez por día, antes de importar y antes de eliminar
      una carrera se guarda una copia automática completa (IndexedDB, se conservan las últimas 15). */
(function(){
'use strict';
const APP_VERSION='12.4.0';
const LS=window.localStorage;
const K={schema:'mc_schema_version',app:'mc_app_version',players:'mc_players_v1',lastExport:'mc_last_export',lastSnap:'mc_last_snapshot'};
const DATA_RE=/^(mc_|modo_carrera)/;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const toast=m=>{try{window.xToast?xToast(m):alert(m)}catch(e){}};
const jparse=(s,d)=>{try{const v=JSON.parse(s);return v==null?d:v}catch(e){return d}};

/* ---------------- lectura/escritura de todo lo que pertenece a la app ---------------- */
function appKeys(){const a=[];for(let i=0;i<LS.length;i++){const k=LS.key(i);if(k&&DATA_RE.test(k))a.push(k)}return a.sort()}
function captureAll(){const d={};appKeys().forEach(k=>{d[k]=LS.getItem(k)});return d}
function careerIdsIn(d){return Object.keys(d).filter(k=>k.indexOf('mc_career_v7_')===0).map(k=>k.slice(13))}
function summarize(d){
 const ids=careerIdsIn(d),P=jparse(d[K.players],null)||{};
 return{careers:ids.length+(d.modo_carrera_41&&!ids.length?1:0),added:(P.added||[]).length,edited:Object.keys(P.edited||{}).length,deleted:Object.keys(P.deleted||{}).length,
  names:(jparse(d.mc_index_v7,[])||[]).map(m=>m&&m.name).filter(Boolean)};
}

/* ---------------- copias automáticas (IndexedDB) ---------------- */
const DBN='modo_carrera_backups',ST='snapshots',KEEP=15;
function idb(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('IndexedDB no disponible'));const r=indexedDB.open(DBN,1);
 r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(ST))db.createObjectStore(ST,{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function tx(mode,fn){return idb().then(db=>new Promise((res,rej)=>{const t=db.transaction(ST,mode),s=t.objectStore(ST);let out;Promise.resolve(fn(s,v=>{out=v})).catch(rej);t.oncomplete=()=>{db.close();res(out)};t.onerror=()=>{db.close();rej(t.error)};t.onabort=()=>{db.close();rej(t.error)}}))}
function listSnapshots(){return tx('readonly',(s,set)=>{const r=s.getAll();r.onsuccess=()=>set((r.result||[]).sort((a,b)=>b.ts-a.ts))}).catch(()=>[])}
function getSnapshot(id){return tx('readonly',(s,set)=>{const r=s.get(id);r.onsuccess=()=>set(r.result)})}
function snapshot(reason,data){
 data=data||captureAll();if(!Object.keys(data).length)return Promise.resolve(null);
 const snap={id:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),ts:Date.now(),reason,appVersion:APP_VERSION,schema:+LS.getItem(K.schema)||0,summary:summarize(data),data};
 return tx('readwrite',s=>{s.put(snap)}).then(()=>{try{LS.setItem(K.lastSnap,String(snap.ts))}catch(e){}return prune()}).then(()=>snap).catch(e=>{console.warn('Copia automática no guardada',e);return null});
}
function prune(){return listSnapshots().then(a=>{const del=a.slice(KEEP);if(!del.length)return;return tx('readwrite',s=>{del.forEach(x=>s.delete(x.id))})})}

/* ---------------- migraciones ---------------- */
function emptyPlayers(){return{v:1,added:[],edited:{},deleted:{},updated:0}}
const GLOBAL_MIGRATIONS=[
 {v:1,name:'Base de jugadores editable e índice de carreras verificado',run(){
  // a) estructura del administrador de jugadores
  const P=jparse(LS.getItem(K.players),null);
  if(!P||typeof P!=='object'){LS.setItem(K.players,JSON.stringify(emptyPlayers()))}
  else{const n={...emptyPlayers(),...P};if(!Array.isArray(n.added))n.added=[];if(typeof n.edited!=='object'||!n.edited)n.edited={};if(typeof n.deleted!=='object'||!n.deleted)n.deleted={};LS.setItem(K.players,JSON.stringify(n))}
  // b) recuperar carreras guardadas que no figuren en el índice (no se modifica ninguna carrera)
  const ix=jparse(LS.getItem('mc_index_v7'),[]);const list=Array.isArray(ix)?ix:[];const have=new Set(list.map(m=>m&&m.id));let changed=!Array.isArray(ix);
  appKeys().filter(k=>k.indexOf('mc_career_v7_')===0).forEach(k=>{const id=k.slice(13);if(have.has(id))return;const c=jparse(LS.getItem(k),null);if(!c||!c.club)return;
   list.push({id,name:c.saveName||(c.club+' · Carrera'),club:c.club,country:c.country,season:c.season,round:c.round,budget:c.budget,played:c.played,updated:0});changed=true});
  if(changed)LS.setItem('mc_index_v7',JSON.stringify(list));
 }}
 /* Próximas versiones: {v:2,name:'...',run(){...}} — nunca borrar datos del usuario. */
];
const SCHEMA=GLOBAL_MIGRATIONS[GLOBAL_MIGRATIONS.length-1].v;
const CAREER_MIGRATIONS=[
 {v:1,run(c){/* 6.4: se registra la versión de formato de la carrera; no cambia nada más */}},
 {v:2,run(c){/* 10.0.1: nombres de clubes corregidos en la base mundial (mayúsculas, caracteres dañados y clubes identificados).
   Solo reemplaza textos que son EXACTAMENTE el nombre viejo de un club; no borra ni agrega nada. */
  const R={"SV la Fama": "SV La Fama", "Pride Of Gall Hill": "Pride of Gall Hill", "O’higgins": "O’Higgins", "Unión la Calera": "Unión La Calera", "Deportes la Serena": "Deportes La Serena", "Deportivo la Guaira": "Deportivo La Guaira", "Widzew łódź": "Widzew Łódź", "FK Kauno žalgiris": "FK Kauno Žalgiris", "FK žalgiris Vilnius": "FK Žalgiris Vilnius", "FA šiauliai": "FA Šiauliai", "º de Agosto": "Primeiro de Agosto", "Stade D’abidjan": "Stade d’Abidjan", "■■;■ ■ ■■■■■■@■d )": "ENPPI", "National Bank Of Egypt": "National Bank of Egypt", "Heart Of Lions": "Heart of Lions", "Hearts Of Oak": "Hearts of Oak", "şagadam": "Şagadam", "CAI la Chorrera": "CAI La Chorrera", "AC Port Of Spain": "AC Port of Spain", "Heart Of Midlothian": "Heart of Midlothian", "RAAL la Louvière": "RAAL La Louvière", "şafa": "Şafa", "NK široki Brijeg": "NK Široki Brijeg", "FK željezničar Sarajevo": "FK Željezničar Sarajevo", "NK čelik Zenica": "NK Čelik Zenica", "železničar Pančevo": "Železničar Pančevo", "čukarički": "Čukarički", "Mačva šabac": "Mačva Šabac", "Inter Club D’escaldes": "Inter Club d’Escaldes", "Atlètic Club D’escaldes": "Atlètic Club d’Escaldes", "CF Esperança D’andorra": "CF Esperança d’Andorra", "Penya Encarnada D’andorra": "Penya Encarnada d’Andorra", "Sporting Club D’escaldes": "Sporting Club d’Escaldes", "Club por identificar 1 (Guatemala)": "Cobán Imperial", "MŠK žilina": "MŠK Žilina", "FK železiarne Podbrezová": "FK Železiarne Podbrezová", "Deportivo la Coruña": "Deportivo La Coruña", "Club por identificar 1 (China)": "Tianjin Jinmen Tiger", "Club por identificar 2 (China)": "Dalian Yingbo", "ASO Chlef — 2026/27": "ASO Chlef", "CR Belouizdad — 2026/27": "CR Belouizdad", "ES Ben Aknoun — 2026/27": "ES Ben Aknoun", "ES Sétif — 2026/27": "ES Sétif", "JS el Biar — 2026/27": "JS El Biar", "JS Kabylie — 2026/27": "JS Kabylie", "JS Saoura — 2026/27": "JS Saoura", "MB Rouissat — 2026/27": "MB Rouissat", "MC Alger — 2026/27": "MC Alger", "MC Oran — 2026/27": "MC Oran", "US Biskra — 2026/27": "US Biskra", "USM Alger — 2026/27": "USM Alger", "FC Ashantigold ’04": "FC Ashantigold"};
  const walk=o=>{if(Array.isArray(o)){for(let i=0;i<o.length;i++){const v=o[i];if(typeof v==='string'){if(R[v])o[i]=R[v]}else if(v&&typeof v==='object')walk(v)}return}
   for(const k of Object.keys(o)){const v=o[k];let nk=k;if(R[k]&&!(R[k] in o)){o[R[k]]=v;delete o[k];nk=R[k]}
    if(typeof v==='string'){if(R[v])o[nk]=R[v]}else if(v&&typeof v==='object')walk(v)}};
  walk(c);
  /* clubes homónimos de otro país: solo dentro de la liga de esta carrera (no toca torneos internacionales) */
  const H={"Portugal": {"Nacional": "CD Nacional"}, "Chile": {"Everton": "Everton de Viña del Mar"}, "Ecuador": {"Universidad Católica": "Universidad Católica (Ecuador)"}, "Colombia": {"Alianza FC": "Alianza FC (Colombia)"}, "Panamá": {"Alianza FC": "Alianza FC (Panamá)"}, "El Salvador": {"CD Platense": "Platense Zacatecoluca"}, "Bahamas": {"Dynamos FC": "Dynamos FC (Bahamas)", "United FC": "United FC (Bahamas)"}, "Trinidad y Tobago": {"Police FC": "Police FC (Trinidad y Tobago)"}, "Omán": {"Al-Nasr SC": "Al-Nasr (Omán)", "Al-Shabab SC": "Al-Shabab (Omán)"}}[c.country];if(H){const R2=H;const w2=o=>{if(Array.isArray(o)){for(let i=0;i<o.length;i++){const v=o[i];if(typeof v==='string'){if(R2[v])o[i]=R2[v]}else if(v&&typeof v==='object')w2(v)}return}
    for(const k of Object.keys(o)){const v=o[k];if(typeof v==='string'){if(R2[v])o[k]=R2[v]}else if(v&&typeof v==='object')w2(v)}};
   if(R2[c.club])c.club=R2[c.club];if(c.league&&typeof c.league==='object')w2(c.league);}
 }}
 /* Próximas versiones: {v:3,run(c){...}} */
];
const CAREER_SCHEMA=CAREER_MIGRATIONS[CAREER_MIGRATIONS.length-1].v;
function migrateCareer(c){
 if(!c||typeof c!=='object')return c;const cur=+c.schema||0;
 CAREER_MIGRATIONS.forEach(m=>{if(cur<m.v){try{m.run(c)}catch(e){console.error('Migración de carrera v'+m.v,e)}}});
 if(cur<CAREER_SCHEMA)c.schema=CAREER_SCHEMA;return c;
}
let lastMigration={from:0,to:0,ok:true,error:null};
function runMigrations(reasonPrefix){
 const from=+LS.getItem(K.schema)||0;lastMigration={from,to:from,ok:true,error:null};
 if(from>SCHEMA){lastMigration.ok=false;lastMigration.error='Los datos son de una versión más nueva ('+from+') que esta app ('+SCHEMA+'). No se tocaron.';return lastMigration}
 if(from===SCHEMA)return lastMigration;
 const before=captureAll();snapshot((reasonPrefix||'Antes de migrar')+' (datos v'+from+' → v'+SCHEMA+')',before);
 try{GLOBAL_MIGRATIONS.forEach(m=>{if(from<m.v){m.run();LS.setItem(K.schema,String(m.v));lastMigration.to=m.v}})}
 catch(e){
  // si algo falla se deja todo exactamente como estaba
  console.error('Migración fallida',e);appKeys().forEach(k=>{if(!(k in before))LS.removeItem(k)});Object.keys(before).forEach(k=>{try{LS.setItem(k,before[k])}catch(_){}});
  lastMigration.ok=false;lastMigration.error=String(e&&e.message||e);
 }
 return lastMigration;
}

/* ---------------- arranque del almacenamiento (antes de cargar las carreras) ---------------- */
function bootStorage(){
 try{
  const prevApp=LS.getItem(K.app),hasData=appKeys().some(k=>k!==K.app);
  if(hasData&&prevApp!==APP_VERSION){snapshot('Antes de actualizar a la versión '+APP_VERSION+(prevApp?' (venía de '+prevApp+')':''));}
  else if(hasData&&Date.now()-(+LS.getItem(K.lastSnap)||0)>864e5){snapshot('Copia diaria automática')}
  runMigrations();
  LS.setItem(K.app,APP_VERSION);
 }catch(e){console.error('Almacenamiento',e)}
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(p=>{if(!p)navigator.storage.persist()})}catch(e){}
}

/* ---------------- administrador de jugadores: capa de cambios sobre la base ---------------- */
const FIELDS=['name','pos','rating','age','nat','value','club','number'];
let PCACHE=null;
function playersData(){if(PCACHE)return PCACHE;const P=jparse(LS.getItem(K.players),null);PCACHE=P&&typeof P==='object'?{...emptyPlayers(),...P}:emptyPlayers();
 if(!Array.isArray(PCACHE.added))PCACHE.added=[];PCACHE.edited=PCACHE.edited||{};PCACHE.deleted=PCACHE.deleted||{};return PCACHE}
function savePlayers(P){P.updated=Date.now();try{LS.setItem(K.players,JSON.stringify(P));PCACHE=P;refreshDB();return true}catch(e){toast('No se pudo guardar: almacenamiento lleno');PCACHE=null;return false}}
function refreshDB(){try{window.mcResetDB&&mcResetDB()}catch(e){}try{window.mcClearGRL&&mcClearGRL()}catch(e){}try{window.mcFillFilters&&mcFillFilters()}catch(e){}}
window.mcPlayersData=playersData;
/* recibe la base (archivo + plantillas internas) y devuelve la base efectiva con los cambios del usuario */
window.mcPlayerOverlay=function(base){
 const P=playersData(),out=[];
 base.forEach(o=>{o._src='base';if(P.deleted[o.id])return;const p=P.edited[o.id];
  if(p){const n={...o};FIELDS.forEach(f=>{if(p[f]!==undefined)n[f]=p[f]});n._edited=true;n._orig=o;n._origClub=o.club;out.push(n)}else out.push(o)});
 P.added.forEach(a=>{if(!a||!a.name)return;out.push({id:'u-'+a.uid,name:a.name,pos:a.pos,rating:+a.rating,age:+a.age,nat:a.nat||'—',value:+a.value,club:a.club,number:a.number||null,_src:'user'})});
 return out;
};

/* ---------------- exportar / importar ---------------- */
const stamp=d=>{const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())};
function backupObject(data,label){data=data||captureAll();return{format:'modo-carrera-backup',formatVersion:1,appVersion:APP_VERSION,schema:+data[K.schema]||+LS.getItem(K.schema)||0,exportedAt:new Date().toISOString(),label:label||'Copia manual',summary:summarize(data),data}}
function downloadJSON(obj,name){
 const blob=new Blob([JSON.stringify(obj)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},4000);
}
window.mcExportBackup=function(share){
 try{typeof career!=='undefined'&&career&&save()}catch(e){}
 const obj=backupObject(),name='modo-carrera-copia_'+stamp(new Date())+'.json';
 if(share&&navigator.canShare){try{const f=new File([JSON.stringify(obj)],name,{type:'application/json'});if(navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Copia de Modo Carrera'}).then(()=>{LS.setItem(K.lastExport,String(Date.now()));renderBackup()}).catch(()=>{});return}}catch(e){}}
 downloadJSON(obj,name);LS.setItem(K.lastExport,String(Date.now()));toast('Copia descargada: '+name);renderBackup();
};
function validBackup(o){
 if(!o||typeof o!=='object')return'El archivo no es una copia de Modo Carrera.';
 if(o.format!=='modo-carrera-backup'||!o.data||typeof o.data!=='object')return'El archivo no es una copia de Modo Carrera.';
 for(const k in o.data){if(!DATA_RE.test(k)||typeof o.data[k]!=='string')return'La copia tiene datos inválidos ('+k+').'}
 if((+o.schema||0)>SCHEMA)return'Esta copia viene de una versión más nueva de la app. Actualizá la app y volvé a importarla.';
 return null;
}
let pendingImport=null;
window.mcPickImport=function(){const f=$('mcImportFile');if(f){f.value='';f.click()}};
window.mcImportFile=function(input){
 const file=input.files&&input.files[0];if(!file)return;const r=new FileReader();
 r.onload=()=>{let o=null;try{o=JSON.parse(r.result)}catch(e){}const err=validBackup(o);if(err){openModal(`<div class="eyebrow">IMPORTAR COPIA</div><h2>No se puede importar</h2><p>${esc(err)}</p><button class="btn ghost" style="width:100%" onclick="closeModal()">CERRAR</button>`);return}
  pendingImport=o;askImport(o,file.name)};
 r.readAsText(file);
};
function askImport(o,label){
 const s=summarize(o.data),cur=summarize(captureAll());
 openModal(`<div class="eyebrow">IMPORTAR COPIA DE SEGURIDAD</div><h2>${esc(label||o.label||'Copia')}</h2>
 <p class="tiny">Creada ${o.exportedAt?esc(new Date(o.exportedAt).toLocaleString('es')):'—'} · versión ${esc(o.appVersion||'?')}</p>
 <div class="statsrow"><span>Carreras en la copia</span><b>${s.careers}</b></div><div class="statsrow"><span>Jugadores agregados / editados / eliminados</span><b>${s.added} / ${s.edited} / ${s.deleted}</b></div>
 ${s.names.length?`<p class="tiny muted">${s.names.slice(0,8).map(esc).join(' · ')}${s.names.length>8?' …':''}</p>`:''}
 <p class="tiny">Ahora tenés <b>${cur.careers}</b> carrera(s). Antes de importar se guarda una copia automática de todo lo actual, así que podés volver atrás.</p>
 <button class="btn" style="width:100%" onclick="mcDoImport('merge')">COMBINAR (RECOMENDADO)</button>
 <p class="tiny muted" style="margin:4px 0 8px">Suma las carreras de la copia y conserva las tuyas. Si una carrera está en los dos lados, queda la versión jugada más recientemente. Los jugadores se combinan.</p>
 <button class="btn secondary" style="width:100%" onclick="mcDoImport('replace')">RESTAURAR EXACTAMENTE ESTA COPIA</button>
 <p class="tiny muted" style="margin:4px 0 8px">Deja todo igual que en la copia (las carreras que no estén en ella se quitan, pero quedan en la copia automática).</p>
 <button class="btn ghost" style="width:100%" onclick="closeModal()">CANCELAR</button>`);
}
function mergeData(cur,inc){
 const out={...cur};
 // carreras: gana la más reciente
 const ci=jparse(cur.mc_index_v7,[])||[],ii=jparse(inc.mc_index_v7,[])||[];const idx=new Map();ci.forEach(m=>m&&idx.set(m.id,m));
 careerIdsIn(inc).forEach(id=>{const k='mc_career_v7_'+id,im=ii.find(m=>m&&m.id===id),cm=idx.get(id);
  if(!(k in cur)||((im&&im.updated)||0)>((cm&&cm.updated)||0)){out[k]=inc[k];const c=jparse(inc[k],{})||{};idx.set(id,im||{id,name:c.saveName||(c.club+' · Carrera'),club:c.club,country:c.country,season:c.season,round:c.round,budget:c.budget,played:c.played,updated:0})}});
 out.mc_index_v7=JSON.stringify([...idx.values()]);
 // claves que faltan (partida antigua, ajustes, etc.)
 Object.keys(inc).forEach(k=>{if(!(k in out))out[k]=inc[k]});
 // jugadores: se combinan (en conflicto gana lo actual)
 const P=jparse(cur[K.players],null)||emptyPlayers(),Q=jparse(inc[K.players],null)||emptyPlayers(),R={...emptyPlayers(),...P};
 R.added=(P.added||[]).slice();const u=new Set(R.added.map(a=>a.uid));(Q.added||[]).forEach(a=>{if(a&&!u.has(a.uid))R.added.push(a)});
 R.edited={...(Q.edited||{}),...(P.edited||{})};R.deleted={...(P.deleted||{})};Object.keys(Q.deleted||{}).forEach(k=>{if(!(P.edited||{})[k])R.deleted[k]=Q.deleted[k]});
 out[K.players]=JSON.stringify(R);
 return out;
}
function writeAll(data){
 // escribe primero lo nuevo y recién después quita lo que sobra: si se llena el almacenamiento, no se pierde nada
 const keys=Object.keys(data);for(const k of keys){LS.setItem(k,data[k])}
 appKeys().forEach(k=>{if(!(k in data))LS.removeItem(k)});
}
window.mcDoImport=function(mode){
 const o=pendingImport;if(!o)return;const cur=captureAll();
 const btns=document.querySelectorAll('#sheet button');btns.forEach(b=>b.disabled=true);
 snapshot('Antes de importar una copia ('+(mode==='merge'?'combinar':'restaurar')+')',cur).then(()=>{
  const next=mode==='merge'?mergeData(cur,o.data):{...o.data};
  next[K.schema]=String(Math.min(+cur[K.schema]||0,+o.data[K.schema]||0));next[K.app]=APP_VERSION;
  try{writeAll(next)}catch(e){try{writeAll(cur)}catch(_){}openModal(`<h2>No se pudo importar</h2><p>El almacenamiento del navegador está lleno. No se cambió nada.</p><button class="btn ghost" style="width:100%" onclick="closeModal()">CERRAR</button>`);return}
  const m=runMigrations('Después de importar');PCACHE=null;
  if(!m.ok){toast(m.error)}
  LS.setItem('mc_import_done',String(Date.now()));location.reload();
 });
};
window.mcRestoreSnapshot=function(id){getSnapshot(id).then(s=>{if(!s)return toast('No se encontró esa copia');pendingImport={format:'modo-carrera-backup',appVersion:s.appVersion,schema:s.schema,exportedAt:new Date(s.ts).toISOString(),label:s.reason,data:s.data};askImport(pendingImport,'Copia automática · '+new Date(s.ts).toLocaleString('es'))})};
window.mcDownloadSnapshot=function(id){getSnapshot(id).then(s=>{if(!s)return;const o=backupObject(s.data,s.reason);o.exportedAt=new Date(s.ts).toISOString();downloadJSON(o,'modo-carrera-copia-auto_'+stamp(new Date(s.ts))+'.json')})};
window.mcSnapshotNow=function(){try{typeof career!=='undefined'&&career&&save()}catch(e){}snapshot('Copia manual dentro de la app').then(s=>{toast(s?'Copia automática creada':'No se pudo crear la copia en este navegador');renderBackup()})};
window.mcAskPersist=function(){if(!(navigator.storage&&navigator.storage.persist))return toast('Este navegador no permite fijar el almacenamiento');navigator.storage.persist().then(ok=>{toast(ok?'Almacenamiento protegido':'El navegador no lo permitió todavía (probá instalar la app en la pantalla de inicio)');renderBackup()})};

/* copia automática antes de borrar una carrera */
function hookDelete(){const d=window.mcDelete;if(!d||d._mc9)return;const w=function(id){const data=captureAll();let nm=id;try{const m=(jparse(LS.getItem('mc_index_v7'),[])||[]).find(x=>x.id===id);if(m)nm=m.name}catch(e){}snapshot('Antes de eliminar la carrera «'+nm+'»',data);return d.apply(this,arguments)};w._mc9=1;window.mcDelete=w}

/* ================= INTERFAZ ================= */
const ago=t=>{if(!t)return'nunca';const d=Date.now()-t;if(d<6e4)return'hace instantes';if(d<36e5)return'hace '+Math.round(d/6e4)+' min';if(d<864e5)return'hace '+Math.round(d/36e5)+' h';return'hace '+Math.round(d/864e5)+' días'};
const kb=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(1)+' MB';
function renderBackup(){
 const box=$('mcBackupBody');if(!box)return;
 const d=captureAll(),s=summarize(d),size=Object.keys(d).reduce((a,k)=>a+(k.length+d[k].length)*2,0),le=+LS.getItem(K.lastExport)||0;
 const pers=$('mcPersist');
 box.innerHTML=`<div class="card"><div class="eyebrow">ESTADO DE TUS DATOS</div>
 <div class="statsrow"><span>Carreras guardadas</span><b>${s.careers}</b></div>
 <div class="statsrow"><span>Jugadores agregados / editados / eliminados</span><b>${s.added} / ${s.edited} / ${s.deleted}</b></div>
 <div class="statsrow"><span>Espacio usado</span><b>${kb(size)}</b></div>
 <div class="statsrow"><span>Versión de la app / de los datos</span><b>${APP_VERSION} / v${+LS.getItem(K.schema)||0}</b></div>
 <div class="statsrow"><span>Almacenamiento protegido</span><b id="mcPersist">…</b></div>
 <div class="statsrow"><span>Última copia exportada</span><b style="${!le||Date.now()-le>7*864e5?'color:#ffb347':''}">${ago(le)}</b></div></div>
 <button class="btn x-go" onclick="mcExportBackup(false)">⬇ EXPORTAR COPIA DE SEGURIDAD</button>
 ${navigator.canShare?'<button class="btn secondary x-go" onclick="mcExportBackup(true)">COMPARTIR / GUARDAR EN LA NUBE</button>':''}
 <button class="btn secondary x-go" onclick="mcPickImport()">⬆ IMPORTAR COPIA DE SEGURIDAD</button>
 <div class="card"><div class="between"><div class="eyebrow">COPIAS AUTOMÁTICAS</div><button class="btn small secondary" onclick="mcSnapshotNow()">CREAR AHORA</button></div>
 <p class="tiny muted">Se guardan solas antes de cada actualización de la app, antes de migrar datos, antes de importar, antes de eliminar una carrera y una vez por día. Quedan las últimas ${KEEP}.</p><div id="mcSnapList"><p class="tiny muted">Cargando…</p></div></div>
 <div class="card"><div class="eyebrow">IMPORTANTE</div><p class="tiny">Tus datos viven en este navegador y en esta dirección web. Al publicar un ZIP nuevo, abrí la app siempre desde la <b>misma dirección</b> (la principal de Cloudflare Pages, no las de vista previa con números) y no se pierde nada. Si cambiás de dispositivo o de navegador, o vas a borrar los datos del navegador, exportá una copia primero e importala después.</p></div>`;
 if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(p=>{const e=$('mcPersist');if(e)e.innerHTML=p?'<span style="color:#7be29a">Sí</span>':'<span style="color:#ffb347">No</span> <button class="btn small secondary" onclick="mcAskPersist()">PROTEGER</button>'});else if($('mcPersist'))$('mcPersist').textContent='No disponible';
 listSnapshots().then(a=>{const L=$('mcSnapList');if(!L)return;L.innerHTML=a.length?a.map(x=>`<div class="x-panel" style="margin-bottom:7px"><b style="font-size:13px">${esc(x.reason)}</b><div class="tiny muted">${new Date(x.ts).toLocaleString('es')} · ${x.summary?x.summary.careers:'?'} carrera(s) · ${x.summary?x.summary.added:0} jugador(es) agregados</div><div class="grid2" style="margin-top:6px"><button class="btn small secondary" onclick="mcRestoreSnapshot('${x.id}')">RESTAURAR</button><button class="btn small ghost" onclick="mcDownloadSnapshot('${x.id}')">DESCARGAR</button></div></div>`).join(''):'<p class="tiny muted">Todavía no hay copias automáticas'+(window.indexedDB?'':' (este navegador no las permite: exportá copias manuales)')+'.</p>'});
}
window.renderBackup=renderBackup;

/* ---- administrador de jugadores ---- */
let pv={q:'',club:'',pos:'',show:'all',n:40};
function estValue(r,a){const b=Math.pow(Math.max(0,r-60)/30,3.2)*160;return Math.max(.5,Math.round(b*(a<=21?1.35:a<=24?1.12:a>=33?.4:a>=30?.7:1)))}
function allClubs(){const s=new Set();try{for(const k in CLUBS)CLUBS[k].forEach(c=>s.add(c))}catch(e){}try{mcDB().list.forEach(p=>p.club&&s.add(p.club))}catch(e){}return[...s].sort((a,b)=>a.localeCompare(b,'es'))}
function allNats(){const s=new Set();try{(window.MC_PLAYERS.nats||[]).forEach(n=>s.add(n))}catch(e){}try{mcDB().nats.forEach(n=>s.add(n))}catch(e){}return[...s].sort((a,b)=>a.localeCompare(b,'es'))}
function pList(){
 const db=mcDB(),P=playersData(),tok=mcNorm(pv.q).trim().split(/\s+/).filter(Boolean);
 let L=pv.show==='deleted'?db.base.filter(o=>P.deleted[o.id]).map(o=>({...o,_deleted:true})):db.list.slice();
 if(pv.show==='user')L=L.filter(o=>o._src==='user');if(pv.show==='edited')L=L.filter(o=>o._edited);
 return L.filter(o=>{const n=mcNorm(o.name);if(tok.length&&!tok.every(t=>n.includes(t)))return false;if(pv.club&&o.club!==pv.club)return false;if(pv.pos&&o.pos!==pv.pos)return false;return true})
  .sort((a,b)=>(b._src==='user')-(a._src==='user')||(!!b._edited)-(!!a._edited)||b.rating-a.rating||a.name.localeCompare(b.name))}
function renderPlayersAdmin(keepFilters){
 const box=$('mcPlayersBody');if(!box)return;const P=playersData(),db=mcDB();
 const opts=(arr,cur,all)=>`<option value="">${all}</option>`+arr.map(x=>`<option${x===cur?' selected':''}>${esc(x)}</option>`).join('');
 if(!keepFilters||!$('mcPlBar')){
  box.innerHTML=`<p class="tiny muted">${db.list.length.toLocaleString('es')} jugadores en la base · <b>${P.added.length}</b> agregados · <b>${Object.keys(P.edited).length}</b> editados · <b>${Object.keys(P.deleted).length}</b> eliminados</p>
  <button class="btn x-go" onclick="mcEditPlayer('')">＋ AGREGAR JUGADOR</button>
  <div id="mcPlBar" class="card" style="padding:10px"><input id="mcPlQ" placeholder="Buscar por nombre…" value="${esc(pv.q)}" oninput="mcPlSet('q',this.value)">
  <div class="grid2" style="margin-top:6px"><select onchange="mcPlSet('club',this.value)">${opts(allClubs(),pv.club,'Club (todos)')}</select><select onchange="mcPlSet('pos',this.value)">${opts(['POR','DEF','MED','DEL'],pv.pos,'Posición (todas)')}</select></div>
  <select style="margin-top:6px" onchange="mcPlSet('show',this.value)">${[['all','Mostrar: todos'],['user','Solo agregados por mí'],['edited','Solo editados'],['deleted','Eliminados (para restaurar)']].map(o=>`<option value="${o[0]}"${pv.show===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select></div>
  <p class="tiny muted">Los cambios se guardan al instante y se aplican al mercado de fichajes, a la fuerza de los rivales y a los planteles de las carreras nuevas. Las carreras que ya tenés guardadas conservan su plantel tal cual.</p>
  <div id="mcPlList"></div>`;
 }
 const L=pList(),shown=L.slice(0,pv.n);
 $('mcPlList').innerHTML=`<div class="mk-count">${L.length.toLocaleString('es')} jugador(es)</div>`+(shown.map(o=>{
  const tag=o._deleted?'<span class="tag" style="color:#ff8a8a">ELIMINADO</span>':o._src==='user'?'<span class="tag" style="color:#7be29a">AGREGADO</span>':o._edited?'<span class="tag" style="color:#ffd35a">EDITADO</span>':'';
  const btns=o._deleted?`<button class="nb" onclick="mcRestorePlayer('${esc(o.id)}')">Restaurar</button>`:`<button class="nb" onclick="mcEditPlayer('${esc(o.id)}')">Editar</button><button class="nb" style="background:#5a1d24;color:#fff;margin-top:4px" onclick="mcAskDeletePlayer('${esc(o.id)}')">Eliminar</button>`;
  return `<div class="x-pc"><div class="ph">${typeof avatar==='function'?avatar(o.pos):''}</div><div><b>${esc(o.name)}</b> ${tag}<div class="mt"><span class="pp ${esc(o.pos)}">${esc(o.pos)}</span>${o.age||'?'} años${o.nat&&o.nat!=='—'?' · '+esc(o.nat):''}${o.number?' · #'+o.number:''}</div><div class="mt">${esc(o.club)} · $${o.value}M</div></div><div class="rt"><span class="st">★ ${o.rating}</span>${btns}</div></div>`}).join('')||'<div class="x-panel x-emp">No hay jugadores con esos filtros.</div>')
  +(L.length>pv.n?`<button class="btn secondary x-go" onclick="mcPlMore()">VER MÁS (${L.length-pv.n} restantes)</button>`:'');
}
window.renderPlayersAdmin=renderPlayersAdmin;
let plDeb=null;
window.mcPlSet=function(k,v){pv[k]=v;pv.n=40;if(k==='q'){clearTimeout(plDeb);plDeb=setTimeout(()=>renderPlayersAdmin(true),150)}else renderPlayersAdmin(true)};
window.mcPlMore=function(){pv.n+=40;renderPlayersAdmin(true)};
function findPlayer(id){const db=mcDB();return db.byId.get(id)||db.base.find(o=>o.id===id)||null}
window.mcEditPlayer=function(id){
 const o=id?findPlayer(id):null;const isNew=!o;const v=o||{name:'',pos:'MED',rating:70,age:24,nat:'Argentina',value:'',club:(typeof career!=='undefined'&&career&&career.club)||'',number:''};
 const field=(lab,html)=>`<label>${lab}</label>${html}`;
 openModal(`<div class="eyebrow">${isNew?'AGREGAR JUGADOR':'EDITAR JUGADOR'}${o&&o._src==='base'?(o._edited?' · EDITADO':' · ORIGINAL DE LA BASE'):''}</div><h2>${isNew?'Nuevo futbolista':esc(o.name)}</h2>
 ${field('Nombre y apellido',`<input id="mpName" maxlength="40" value="${esc(v.name)}" placeholder="Ej. Juan Pérez">`)}
 <div class="grid2"><div>${field('Posición',`<select id="mpPos">${[['POR','Portero'],['DEF','Defensor'],['MED','Mediocampista'],['DEL','Delantero']].map(p=>`<option value="${p[0]}"${v.pos===p[0]?' selected':''}>${p[1]}</option>`).join('')}</select>`)}</div><div>${field('Valoración (GRL 40-99)',`<input id="mpRat" type="number" min="40" max="99" value="${esc(v.rating)}">`)}</div></div>
 <div class="grid2"><div>${field('Edad',`<input id="mpAge" type="number" min="15" max="45" value="${esc(v.age)}">`)}</div><div>${field('Número de camiseta',`<input id="mpNum" type="number" min="1" max="99" value="${esc(v.number||'')}" placeholder="Opcional">`)}</div></div>
 ${field('Club',`<input id="mpClub" list="mpClubs" value="${esc(v.club)}" placeholder="Elegí o escribí un club"><datalist id="mpClubs">${allClubs().map(c=>`<option value="${esc(c)}">`).join('')}</datalist>`)}
 ${field('Nacionalidad',`<input id="mpNat" list="mpNats" value="${esc(v.nat==='—'?'':v.nat)}" placeholder="Ej. Argentina"><datalist id="mpNats">${allNats().map(c=>`<option value="${esc(c)}">`).join('')}</datalist>`)}
 ${field('Valor de mercado (M)',`<input id="mpVal" type="number" min="0" step="0.05" value="${esc(v.value)}" placeholder="Vacío = se calcula solo">`)}
 <p id="mpErr" class="tiny" style="color:#ff8a8a;min-height:14px"></p>
 <button class="btn" style="width:100%" onclick="mcSavePlayer('${isNew?'':esc(o.id)}')">GUARDAR</button>
 ${o&&o._edited?`<button class="btn secondary" style="width:100%;margin-top:7px" onclick="mcRestorePlayer('${esc(o.id)}')">VOLVER A LOS DATOS ORIGINALES</button>`:''}
 <button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CANCELAR</button>`);
};
window.mcSavePlayer=function(id){
 const g=x=>($(x)&&$(x).value||'').trim(),err=m=>{$('mpErr').textContent=m};
 const name=g('mpName').replace(/\s+/g,' '),pos=g('mpPos'),rating=Math.round(+g('mpRat')),age=Math.round(+g('mpAge')),club=g('mpClub'),nat=g('mpNat')||'—',num=g('mpNum'),val=g('mpVal');
 if(name.length<2)return err('Escribí el nombre del jugador.');
 if(!['POR','DEF','MED','DEL'].includes(pos))return err('Elegí una posición.');
 if(!(rating>=40&&rating<=99))return err('La valoración tiene que estar entre 40 y 99.');
 if(!(age>=15&&age<=45))return err('La edad tiene que estar entre 15 y 45.');
 if(!club)return err('Indicá el club.');
 const number=num?Math.round(+num):null;if(num&&!(number>=1&&number<=99))return err('El número de camiseta va de 1 a 99.');
 const value=val!==''?Math.max(0,Math.round(+val*100)/100):estValue(rating,age);if(!isFinite(value))return err('Revisá el valor de mercado.');
 const P=JSON.parse(JSON.stringify(playersData())),rec={name,pos,rating,age,nat,value,club,number};
 const dup=mcDB().list.find(o=>o.id!==id&&mcNorm(o.name)===mcNorm(name));
 if(dup&&!$('mpErr').dataset.ok){$('mpErr').dataset.ok='1';return err('Ya existe «'+dup.name+'» ('+dup.club+'). Tocá GUARDAR otra vez para guardarlo igual.')}
 if(!id){P.added.push({uid:Date.now().toString(36)+Math.random().toString(36).slice(2,6),...rec,created:Date.now()})}
 else if(id.indexOf('u-')===0){const a=P.added.find(x=>'u-'+x.uid===id);if(!a)return err('No se encontró el jugador.');Object.assign(a,rec,{updated:Date.now()})}
 else{const o=findPlayer(id),orig=(o&&o._orig)||o;if(!orig)return err('No se encontró el jugador.');const patch={};
  FIELDS.forEach(f=>{const a=orig[f]==null?null:orig[f],b=rec[f]==null?null:rec[f];if(f==='nat'&&(a==='—'||a==null)&&b==='—')return;if(String(a)!==String(b))patch[f]=rec[f]});
  if(Object.keys(patch).length){patch.updated=Date.now();P.edited[id]=patch}else delete P.edited[id]}
 if(savePlayers(P)){closeModal();renderPlayersAdmin(true);toast(id?'Jugador actualizado':'Jugador agregado')}
};
window.mcAskDeletePlayer=function(id){const o=findPlayer(id);if(!o)return;
 openModal(`<div class="eyebrow">⚠ ELIMINAR JUGADOR</div><h2>${esc(o.name)}</h2><p>${o._src==='user'?'Se quita de la base el jugador que agregaste.':'Deja de aparecer en el mercado y en los planteles de carreras nuevas. Podés restaurarlo cuando quieras desde «Eliminados».'} Las carreras guardadas no cambian.</p><button class="btn danger" style="width:100%" onclick="mcDeletePlayer('${esc(id)}')">SÍ, ELIMINAR</button><button class="btn ghost" style="width:100%;margin-top:7px" onclick="closeModal()">CANCELAR</button>`)};
window.mcDeletePlayer=function(id){const P=JSON.parse(JSON.stringify(playersData()));
 if(id.indexOf('u-')===0)P.added=P.added.filter(x=>'u-'+x.uid!==id);else{P.deleted[id]=Date.now()}
 if(savePlayers(P)){closeModal();renderPlayersAdmin(true);toast('Jugador eliminado')}};
window.mcRestorePlayer=function(id){const P=JSON.parse(JSON.stringify(playersData()));delete P.deleted[id];delete P.edited[id];if(savePlayers(P)){closeModal();renderPlayersAdmin(true);toast('Jugador restaurado con sus datos originales')}};

/* ---- enganches con la interfaz existente ---- */
function hookUI(){
 hookDelete();
 const og=window.go;if(og&&!og._mc9){const w=function(id){const r=og.apply(this,arguments);if(id==='players')renderPlayersAdmin();if(id==='backup')renderBackup();if(id==='saves')savesNote();return r};w._mc9=1;window.go=w}
 try{if(typeof SS!=='undefined'&&SS.Guardado&&!SS.Guardado[2].some(r=>r[3]==='go("backup")')){SS.Guardado[2].splice(2,0,['a','folder','Copias de seguridad (exportar / importar)','go("backup")'],['a','people','Administrar jugadores','go("players")'])}
  if(typeof SS!=='undefined'&&SS.Cuenta){SS.Cuenta[2].forEach(r=>{if(r[3]==="go('advanced')")r[3]='go("advanced")'});if(!SS.Cuenta[2].some(r=>/players/.test(r[3])))SS.Cuenta[2].push(['a','people','Administrar jugadores','go("players")'])}}catch(e){}
}
function savesNote(){const box=$('savesList');if(!box||$('mcSavesNote'))return;const le=+LS.getItem(K.lastExport)||0;const d=document.createElement('div');d.id='mcSavesNote';d.className='card';
 d.innerHTML=`<div class="between"><div><div class="eyebrow">COPIAS DE SEGURIDAD</div><div class="tiny muted">Última copia exportada: ${ago(le)}</div></div><button class="btn small" onclick='go("backup")'>ABRIR</button></div>`;box.parentNode.insertBefore(d,box)}

window.MCStore={APP_VERSION,SCHEMA,CAREER_SCHEMA,captureAll,snapshot,listSnapshots,runMigrations,migrateCareer,exportBackup:()=>backupObject(),lastMigration:()=>lastMigration,validBackup,mergeData};
window.mcMigrateCareer=migrateCareer;
bootStorage();
document.addEventListener('DOMContentLoaded',hookUI);
window.mcHookStoreUI=hookUI;
if(LS.getItem('mc_import_done')){LS.removeItem('mc_import_done');setTimeout(()=>toast('Copia importada correctamente'),600)}
})();
