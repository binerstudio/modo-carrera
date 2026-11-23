/* ===== MODO CARRERA 12.3 · MOSTRAR RECIÉN CON EL DISEÑO LISTO =====
   index.html arranca con la clase "mc-cargando" (pantalla de carga azul y dorada) para que no se vea
   un instante el menú viejo antes de que el diseño 12.x se aplique. Este archivo se carga ÚLTIMO
   (después de mc12-diseno.js) y quita la pantalla de carga cuando el diseño ya está aplicado.
   Seguridad: index.html también la quita sola a los 10 s pase lo que pase. */
(function(){
 function show(){requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('mc-cargando')})})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(show,0)});else setTimeout(show,0);
})();
