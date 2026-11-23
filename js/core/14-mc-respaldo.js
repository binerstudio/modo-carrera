/* ===== MODO CARRERA 12.3 · RESPALDO DEL GUARDADO =====
   Qué hace (solo AGREGA protección; no cambia cómo se guarda hoy):
   1) Cada vez que se guarda, la carrera recibe un número de guardado (career._guardado) y se
      copia también en IndexedDB (base "modo_carrera_carreras"), que tiene mucho más espacio
      que localStorage.
   2) Si localStorage no pudo guardar (almacenamiento lleno), se avisa con claridad y el
      progreso queda a salvo en IndexedDB.
   3) Al abrir la app, si la copia de IndexedDB de la carrera activa es MÁS NUEVA que la de
      localStorage, se recupera sola (si entra) o se avisa cómo liberar espacio.
   No borra ni renombra ninguna clave existente (mc_career_v7_<id>, mc_index_v7, etc.).
   Las copias de carreras eliminadas se quitan de IndexedDB al eliminarlas. */
(function(){
'use strict';
const PFX='mc_career_v7_',IDX='mc_index_v7',DBN='modo_carrera_carreras',ST='carreras';
const LS=window.localStorage;
let dbp=null;
function db(){
 if(dbp)return dbp;
 dbp=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('sin IndexedDB'));
  const r=indexedDB.open(DBN,1);
  r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(ST))d.createObjectStore(ST,{keyPath:'id'})};
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
 dbp.catch(()=>{dbp=null});
 return dbp;
}
function put(rec){return db().then(d=>new Promise((res,rej)=>{const t=d.transaction(ST,'readwrite');t.objectStore(ST).put(rec);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)}))}
function get(id){return db().then(d=>new Promise((res,rej)=>{const q=d.transaction(ST,'readonly').objectStore(ST).get(id);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)}))}
function del(id){return db().then(d=>new Promise(res=>{const t=d.transaction(ST,'readwrite');t.objectStore(ST).delete(id);t.oncomplete=()=>res(true);t.onerror=()=>res(false)})).catch(()=>false)}
function allIds(){return db().then(d=>new Promise(res=>{const q=d.transaction(ST,'readonly').objectStore(ST).getAllKeys();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([])})).catch(()=>[])}

/* ---------- copia en IndexedDB después de cada guardado ---------- */
let timer=null,pending=null,lastMirror=Promise.resolve(true);
function mirrorNow(){
 timer=null;const c=pending;pending=null;if(!c||!c.id)return lastMirror;
 /* put() clona el objeto en el momento de la llamada: queda la carrera tal como estaba */
 lastMirror=put({id:c.id,seq:c._guardado||0,ts:Date.now(),club:c.club,season:c.season,round:c.round,data:c})
  .catch(e=>{console.warn('MC respaldo: no se pudo copiar en IndexedDB',e);return false});
 return lastMirror;
}
function queueMirror(c){pending=c;if(!timer)timer=setTimeout(mirrorNow,600)}
/* antes de cerrar/ocultar la app se copia lo pendiente */
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&pending)mirrorNow()});
window.addEventListener('pagehide',()=>{if(pending)mirrorNow()});

/* ---------- aviso de almacenamiento lleno ---------- */
let warned=false;
function warnFull(){
 if(warned)return;warned=true;
 const html='<h2>⚠️ Sin espacio para guardar</h2><p>El navegador no tiene más lugar en su almacenamiento principal. '
  +'<b>Tu progreso no se perdió</b>: quedó en la copia interna de la app.</p>'
  +'<p>Para evitar problemas: entrá a <b>Copias de seguridad</b>, descargá una copia y eliminá las carreras que ya no uses.</p>'
  +'<button class="btn" style="width:100%" onclick="closeModal();go(\'backup\')">IR A COPIAS DE SEGURIDAD</button>'
  +'<button class="btn secondary" style="width:100%;margin-top:8px" onclick="closeModal()">Seguir jugando</button>';
 try{openModal(html)}catch(e){try{xToast('Sin espacio para guardar: descargá una copia de seguridad')}catch(_){}}
}
function savedOk(c){
 const s=LS.getItem(PFX+c.id);if(!s)return false;const k='"_guardado":'+c._guardado;
 return s.includes(k+',')||s.includes(k+'}');
}

/* ---------- envoltorio de save() ---------- */
const orig=window.save;
if(typeof orig==='function'){
 window.save=function(){
  const c=(typeof career!=='undefined')?career:null;
  if(!c)return orig.apply(this,arguments);
  c._guardado=(c._guardado||0)+1;
  const r=orig.apply(this,arguments);
  try{if(c.id){if(!savedOk(c))warnFull();queueMirror(c)}}catch(e){console.warn('MC respaldo',e)}
  return r;
 };
}

/* ---------- al eliminar una carrera, se elimina también su copia ---------- */
const origDel=window.mcDelete;
if(typeof origDel==='function')window.mcDelete=function(id){const r=origDel.apply(this,arguments);if(!LS.getItem(PFX+id))del(id);return r};

/* ---------- al abrir: recuperar si la copia interna es más nueva ---------- */
function idxIds(){try{const a=JSON.parse(LS.getItem(IDX));return Array.isArray(a)?a.map(x=>x&&x.id):[]}catch(e){return[]}}
function check(){
 const c=(typeof career!=='undefined')?career:null;
 const known=new Set(idxIds());
 /* copias huérfanas (carreras eliminadas antes de esta versión) */
 allIds().then(ids=>ids.forEach(id=>{if(!known.has(id)&&!LS.getItem(PFX+id))del(id)}));
 if(!c||!c.id)return Promise.resolve('sin-carrera');
 return get(c.id).then(rec=>{
  if(!rec||!rec.data)return queueMirror(c),'copiada';
  if((rec.seq||0)<=(c._guardado||0))return 'al-dia';
  let ok=false;try{LS.setItem(PFX+c.id,JSON.stringify(rec.data));ok=true}catch(e){}
  if(ok&&typeof mcActivate==='function'){mcActivate(c.id,false);try{renderAll()}catch(e){}
   try{xToast('Se recuperó tu último guardado')}catch(e){}return 'recuperada'}
  warnFull();return 'sin-espacio';
 }).catch(e=>{console.warn('MC respaldo',e);return 'error'});
}

/* ---------- uso del almacenamiento (para pantallas y pruebas) ---------- */
function usage(){
 let bytes=0;for(let i=0;i<LS.length;i++){const k=LS.key(i);if(/^(mc_|modo_carrera)/.test(k))bytes+=(k.length+(LS.getItem(k)||'').length)*2}
 const c=(typeof career!=='undefined'&&career)?JSON.stringify(career).length*2:0;
 const est=(navigator.storage&&navigator.storage.estimate)?navigator.storage.estimate():Promise.resolve(null);
 return est.then(e=>({localStorageBytes:bytes,careerBytes:c,estimate:e}));
}

window.MCRespaldo={check,usage,flush:()=>{if(timer){clearTimeout(timer)}return pending?mirrorNow():lastMirror},get,_warnFull:warnFull};
window.MCRespaldo.ready=check();
})();
