
/* MODO CARRERA 10.0: vuelve a abrir la carrera activa con el motor mundial (no modifica resultados ni planteles guardados) */
try{buildLeagueUI()}catch(e){}
try{if(typeof career!=="undefined"&&career&&career.id)mcActivate(career.id,false)}catch(e){console.error(e)}
try{renderAll()}catch(e){}
