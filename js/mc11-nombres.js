/* ===== MODO CARRERA 11.1 · NOMBRES SIN PARÉNTESIS =====
   Cuando dos jugadores distintos se llaman igual, el juego los guarda internamente como "Nombre (Club)" para no mezclarlos
   (así funcionan el mercado, los planteles y las partidas guardadas). Este archivo solo cambia lo que se VE en pantalla:
   en todas las vistas se muestra "Nombre", sin el paréntesis. No modifica datos, claves ni partidas guardadas. */
(function(){
'use strict';
const P=window.MC_PLAYERS;if(!P||!P.rows)return;
const FULL=new Map();          /* "Nombre (Club)" -> "Nombre" */
const BYSUF=new Map();         /* " (Club)" -> lista de nombres base con ese sufijo */
const add=full=>{const m=/^(.*?) (\((?:[^()]|\([^()]*\))*\))$/.exec(full);if(!m)return;
  const base=m[1],suf=' '+m[2];if(FULL.has(full))return;FULL.set(full,base);
  let l=BYSUF.get(suf);if(!l){l=[];BYSUF.set(suf,l)}l.push(base)};
P.rows.forEach(r=>{const n=r[0],club=P.clubs[r[6]];if(typeof n==='string'&&club&&n.endsWith(' ('+club+')'))add(n)});
(window.MC_EXTRA||[]).forEach(r=>{if(r&&typeof r[0]==='string'&&r[6]&&r[0].endsWith(' ('+r[6]+')'))add(r[0])});
window.mcShowName=n=>FULL.get(n)||n;
/* reemplaza en un texto cada "Nombre (Club)" conocido por "Nombre" */
function clean(t){if(!t||t.indexOf(' (')<0)return t;let out='',i=0,p;
 while((p=t.indexOf(' (',i))>=0){let d=0,e=-1;for(let k=p+1;k<t.length;k++){const ch=t[k];if(ch==='(')d++;else if(ch===')'){d--;if(d===0){e=k;break}}}
  if(e<0)break;const suf=t.slice(p,e+1),list=BYSUF.get(suf);let hit=false;
  if(list){const before=t.slice(i,p);for(const b of list){if(before.endsWith(b)){const s=p-b.length;const ok=s===0||!/[\p{L}\p{N}]/u.test(t[s-1]);if(ok){out+=t.slice(i,p);i=e+1;hit=true;break}}}}
  if(!hit){out+=t.slice(i,p+2);i=p+2}}
 return out+t.slice(i)}
window.mcCleanNames=clean;
const ATTR=['title','alt','placeholder','aria-label'];
function fixNode(n){if(n.nodeType===3){const v=n.nodeValue;if(v&&v.indexOf(' (')>=0){const c=clean(v);if(c!==v)n.nodeValue=c}return}
 if(n.nodeType!==1)return;
 if(n.tagName==='SCRIPT'||n.tagName==='STYLE')return;
 ATTR.forEach(a=>{const v=n.getAttribute&&n.getAttribute(a);if(v&&v.indexOf(' (')>=0){const c=clean(v);if(c!==v)n.setAttribute(a,c)}});
 const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let x;while((x=w.nextNode())){const v=x.nodeValue;if(v&&v.indexOf(' (')>=0){const c=clean(v);if(c!==v)x.nodeValue=c}}
 if(n.querySelectorAll)n.querySelectorAll('[title],[alt],[placeholder],[aria-label]').forEach(el=>ATTR.forEach(a=>{const v=el.getAttribute(a);if(v&&v.indexOf(' (')>=0){const c=clean(v);if(c!==v)el.setAttribute(a,c)}}))}
function start(){if(!document.body)return;fixNode(document.body);
 new MutationObserver(recs=>{for(const r of recs){if(r.type==='characterData')fixNode(r.target);else if(r.type==='attributes')fixNode(r.target);else r.addedNodes.forEach(fixNode)}})
  .observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
