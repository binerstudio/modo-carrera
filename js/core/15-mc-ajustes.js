/* ===== MODO CARRERA 12.3 · AJUSTES SIN EFECTO OCULTOS =====
   La pantalla Configuración mostraba interruptores que ningún código usaba (clima, desgaste,
   sanciones, sonido, gráficos, notificaciones, etc.). Se ocultan hasta que tengan una función real.
   Los valores guardados NO se borran (siguen en mc_settings_ui) para poder reactivarlos después. */
(function(){
'use strict';
const SIN_EFECTO=new Set(['speed','seasons','sanc','clima','desg','real','ofert','dura','inv','vib','ayuda','fx','sombras','fps','mus','sfx','comm','notif','notipart','notimerc','auto']);
try{
 if(typeof SS==='undefined'||typeof CAT==='undefined')return;
 Object.keys(SS).forEach(n=>{const rows=SS[n][2];for(let i=rows.length-1;i>=0;i--){if(rows[i][0]==='g'||rows[i][0]==='s'||rows[i][0]==='t'){if(SIN_EFECTO.has(rows[i][3]))rows.splice(i,1)}}});
 Object.keys(CAT).forEach(k=>{CAT[k]=CAT[k].filter(n=>SS[n]&&SS[n][2].length);if(!CAT[k].length)delete CAT[k]});
}catch(e){console.warn('MC ajustes',e)}
})();
/* registro de la app instalable (PWA) */
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(e=>console.warn('MC sw',e))})}
