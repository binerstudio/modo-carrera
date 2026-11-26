/* ===== MODO CARRERA · SERVICE WORKER =====
   Permite instalar la app y abrirla sin conexión.
   - Código y datos (HTML, JS, CSS): primero la red (siempre la versión nueva); sin red, la copia guardada.
   - Imágenes: primero la copia guardada (rápido); si no está, la red.
   NO toca las partidas: viven en localStorage/IndexedDB, no en esta caché.
   Al publicar una versión nueva, cambiar VERSION para renovar la caché. */
const VERSION='mc-12.10.0';
const CORE=[
  './',
  'index.html',
  'manifest.webmanifest',
  'css/mc12-diseno.css',
  'data/jugadores.js',
  'data/mundo.js',
  'data/divisiones.js',
  'js/divisiones/registro.js',
  'js/divisiones/nombres.js',
  'js/divisiones/divisiones.js',
  'assets/jugadores/fotos.js',
  'assets/inicio/portada.jpg',
  'assets/inicio/estadio_banda.jpg',
  'assets/estadio/tribuna.jpg',
  'assets/icons/icono-192.png',
  'js/core/01-base-v4.js',
  'js/core/02-modo-51-page-mode-sync.js',
  'js/core/03-market-engine-51.js',
  'js/core/04-mc6-ui-js.js',
  'js/core/05-mc9-datos.js',
  'js/core/06-mc7-core.js',
  'js/core/07-mc7-match.js',
  'js/core/08-mc7-market.js',
  'js/core/09-mc7-ui.js',
  'js/core/10-mc8-liga.js',
  'js/core/11-mc7-boot.js',
  'js/core/12-mc-global-no-fake-players.js',
  'js/core/13-mc10-boot.js',
  'js/core/14-mc-respaldo.js',
  'js/core/15-mc-ajustes.js',
  'js/core/16-mc-mostrar.js',
  'js/motor/atributos.js',
  'js/motor/motor-v2.js',
  'js/motor/conexion.js',
  'js/motor/motor-v3.js',
  'js/motor/conexion-v3.js',
  'js/mercado/reglas.js',
  'js/ia/mercado-ia.js',
  'js/ia/partidos-ia.js',
  'js/ia/estado-ia.js',
  'js/plantel/rotacion.js',
  'js/plantel/ficha.js',
  'js/mercado/finanzas.js',
  'js/mercado/negociacion.js',
  'js/partido2d/camisetas.js',
  'js/partido2d/vista2d.js',
  'js/partido2d/ver-partido.js',
  'js/mc10-datos.js',
  'js/mc10-liga.js',
  'js/mc10-mundo.js',
  'js/mc10-ui.js',
  'js/mc11-nombres.js',
  'js/mc12-diseno.js',
  'js/mc13-arg-grl.js',
  'js/mc13-arg-nombres.js'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mc-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
const isImg=u=>/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(u.pathname);
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  if(isImg(u)){
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp))}return res})));
    return;
  }
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(hit=>hit||(r.mode==='navigate'?caches.match('index.html',{ignoreSearch:true}):Response.error()))));
});
