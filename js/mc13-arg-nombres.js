/* ===== MODO CARRERA 13 · NOMBRES DEL FÚTBOL ARGENTINO =====
   Corrige cómo SE VEN los nombres con restos de escaneo ("Vg", "BJ", "ae"...) o letras mal leídas ("Mufioz" -> "Muñoz").
   No cambia la base de datos ni las claves internas: las partidas guardadas siguen funcionando igual.
   También ajusta, una sola vez por partida, el GRL de los jugadores de TU plantel que vinieron de la base argentina
   (solo si nunca cambiaron de GRL), y guarda el valor anterior en career.mc13prev para poder deshacerlo. */
(function(){'use strict';
const FIX={"Gastén Lodico":"Gastón Lodico","Ulises Ciccioli ee":"Ulises Ciccioli","Fabricio lacovich":"Fabricio Iacovich","Ramén Arias":"Ramón Arias","Simén Rivero":"Simón Rivero","Jerénimo Démina":"Jerónimo Dómina","Teo Rodriguez pene":"Teo Rodriguez","Timoteo Chamorro By":"Timoteo Chamorro","Matias Gémez GJ":"Matias Gómez","Felipe Pefia Biafore":"Felipe Peña Biafore","Ratil Loaiza":"Raúl Loaiza","Claudio Bravo ap":"Claudio Bravo","Alan Nufiez":"Alan Núñez","Hernan Lopez Mufioz":"Hernán López Muñoz","Gaston Verén":"Gaston Verón","Valentino Acufia":"Valentino Acuña","Lucas Gémez":"Lucas Gómez","Jerénimo Gomez Mattar ofensiva":"Jerónimo Gómez Mattar","Alan Sofiora":"Alan Soñora","Walter Nufiez":"Walter Núñez","'gnacio Ramirez":"Ignacio Ramirez","Santiago Quirés":"Santiago Quirós","Celias Ingenthron":"Elías Ingenthron","Gastén Togni":"Gastón Togni","Juan Miguel oe":"Juan Miguel","Franco Calderén":"Franco Calderón","Jonathan De lrastorza":"Jonathan De Irastorza","Joel Medina EJ":"Joel Medina","Aarén Molinas":"Aarón Molinas","Juan Cortazzo Ee":"Juan Cortazzo","Bautista Barros an Schelotto":"Bautista Barros Schelotto","Ignacio Miramén":"Ignacio Miramón","Adrian Spérle":"Adrian Spörle","Francisco Gonzalez Metilli ofensiva":"Francisco González Metilli","Ramiro Hernandes":"Ramiro Hernández","Daniel Zabala oe":"Daniel Zabala","My Ignacio Pussetto fo ig":"Ignacio Pussetto","Ezequiel Mufioz":"Ezequiel Muñoz","Py Luciano Paredes":"Luciano Paredes","Ismael Cortéz":"Ismael Cortez","Luciano Cingolani Wy":"Luciano Cingolani","MM ignacio Sabatini":"Ignacio Sabatini","Nicolds Romano":"Nicolás Romano","FI Fernando Tobio":"Fernando Tobio","Rodrigo Insta":"Rodrigo Insúa","Gustavo Abregd":"Gustavo Abregú","Luca Rafaelli io":"Luca Rafaelli","Jhon Cérdoba":"Jhon Córdoba","Juan Pablo Luduefia":"Juan Pablo Ludueña","Bruno Pittén":"Bruno Pittón","Gaston Suso io":"Gaston Suso","Kevin Ortiz io":"Kevin Ortiz","Lisandro Pifiero":"Lisandro Piñero","MN Braian Sanchez fe . . mya":"Braian Sánchez","Gonzalo Bravo Ye":"Gonzalo Bravo","Marco lacobellis":"Marco Iacobellis","Michael Santos gq":"Michael Santos","Martin Cuitifio":"Martin Cuitiño","Nicolas Linares ae":"Nicolas Linares","wa Francisco Perruzzi":"Francisco Perruzzi","Matias Godoy Vg":"Matias Godoy","Alan Sosa BJ":"Alan Sosa","Lucas Bafios Sd":"Lucas Baños","Nicolas Talpone YW":"Nicolas Talpone","Fm Lucas Gonzalez":"Lucas González"};
const VAR={"Ciccioli ee":"Ciccioli","Rodriguez pene":"Rodriguez","Chamorro By":"Chamorro","Gémez GJ":"Gómez","Pefia Biafore":"Peña Biafore","Bravo ap":"Bravo","Miguel oe":"Miguel","De lrastorza":"De Irastorza","Medina EJ":"Medina","Cortazzo Ee":"Cortazzo","Barros an Schelotto":"Barros Schelotto","Gonzalez Metilli ofensiva":"González Metilli","Zabala oe":"Zabala","Cingolani Wy":"Cingolani","Rafaelli io":"Rafaelli","Pablo Luduefia":"Pablo Ludueña","Suso io":"Suso","Ortiz io":"Ortiz","Bravo Ye":"Bravo","Santos gq":"Santos","Linares ae":"Linares","Godoy Vg":"Godoy","Sosa BJ":"Sosa","Bafios Sd":"Baños","Talpone YW":"Talpone"};
const PAL={"Gastén":"Gastón","Ramén":"Ramón","Jerénimo":"Jerónimo","Simén":"Simón","Pefia":"Peña","Nufiez":"Núñez","Acufia":"Acuña","Mufioz":"Muñoz","lacovich":"Iacovich","Ratil":"Raúl","Sofiora":"Soñora","Calderén":"Calderón","lrastorza":"Irastorza","Quirés":"Quirós","Démina":"Dómina","Verén":"Verón","Gémez":"Gómez","Miramén":"Miramón","Spérle":"Spörle","Pittén":"Pittón","Luduefia":"Ludueña","Pifiero":"Piñero","Cuitifio":"Cuitiño","Bafios":"Baños","Abregd":"Abregú","Cérdoba":"Córdoba","Nicolds":"Nicolás","lacobellis":"Iacobellis","Aarén":"Aarón"};
const ALL=Object.assign({},PAL,VAR,FIX);
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const keys=Object.keys(ALL).sort((a,b)=>b.length-a.length);
const RX=new RegExp('(^|[^\\p{L}\\p{N}])('+keys.map(esc).join('|')+')(?![\\p{L}\\p{N}])','gu');
const fix=t=>{if(!t||typeof t!=='string')return t;RX.lastIndex=0;return t.replace(RX,(m,a,b)=>a+ALL[b])};
window.mcFixArgName=fix;
const base=window.mcShowName||(n=>n);
window.mcShowName=n=>fix(base(n));
const ATTR=['title','alt','placeholder','aria-label'];
function fixNode(n){if(n.nodeType===3){const v=n.nodeValue,c=fix(v);if(c!==v)n.nodeValue=c;return}
 if(n.nodeType!==1||n.tagName==='SCRIPT'||n.tagName==='STYLE')return;
 const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let x;while((x=w.nextNode())){const v=x.nodeValue,c=fix(v);if(c!==v)x.nodeValue=c}
 [n].concat(n.querySelectorAll?[...n.querySelectorAll('[title],[alt],[aria-label]')]:[]).forEach(el=>ATTR.forEach(a=>{const v=el.getAttribute&&el.getAttribute(a);if(v){const c=fix(v);if(c!==v)el.setAttribute(a,c)}}))}
function start(){fixNode(document.body);new MutationObserver(ms=>ms.forEach(m=>{if(m.type==='characterData')fixNode(m.target);else m.addedNodes.forEach(fixNode)})).observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
/* GRL nuevo para el plantel propio de partidas ya empezadas */
function syncCareer(){try{const G=window.MC13_GRL,c=typeof career!=='undefined'?career:null;if(!G||!c||!Array.isArray(c.players)||c.mc13grl)return;
 const prev={};let k=0;c.players.forEach(p=>{const o=G.original[p.name],nw=G.nuevo[p.name];if(o==null||nw==null||p.rating!==o)return;
  prev[p.id]=[p.rating,p.potential];const d=nw-o;p.rating=nw;if(typeof p.potential==='number')p.potential=Math.max(nw,Math.min(99,p.potential+d));k++});
 c.mc13grl=true;c.mc13prev=prev;if(k&&typeof save==='function')save()}catch(e){}}
window.mc13SyncCareer=syncCareer;
setInterval(syncCareer,1500);
})();
