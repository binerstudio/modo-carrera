/* ===== MODO CARRERA · CÓMO VER TU PARTIDO (menú al tocar "Comenzar partido") =====
   1) Partido completo: de 3 a 15 minutos reales (5 por defecto). Todo a velocidad real; la calma se saltea con cortes.
   2) Mejores jugadas (motor v3): se simula entero y se muestran solo los tipos de jugada marcados, una tras otra.
   3) Simular partido: se simula entero sin mostrar nada y va directo al resultado con las estadísticas.
   Lo elegido se recuerda para el próximo partido. Si el partido se juega con el v2 (no se pudo armar en la cancha),
   la opción 2 no aparece (el v2 no simula la cancha). */
(function(){
'use strict';
const CLAVE='mc_ver_partido';
const TIPOS=[['goles','Goles'],['penales','Penales'],['tirosLibres','Tiros libres'],['corners','Córners'],['peligro','Jugadas peligrosas'],['atajadas','Atajadas'],['faltas','Faltas y tarjetas'],['cambios','Lesiones y cambios']];
const DEF={modo:'completo',min:5,tipos:['goles','penales','peligro','atajadas']};
function leer(){let v={};try{v=JSON.parse(localStorage.getItem(CLAVE))||{}}catch(e){}return Object.assign({},DEF,v)}
function guardar(v){try{localStorage.setItem(CLAVE,JSON.stringify(v))}catch(e){}}
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let sel=null;
function html(v3){const v=sel;const tarjeta=(k,tit,sub,extra)=>`<label class="vp-op${v.modo===k?' on':''}" data-m="${k}"><input type="radio" name="vpModo" value="${k}" ${v.modo===k?'checked':''}><b>${tit}</b><span>${sub}</span>${extra||''}</label>`;
 const dur=`<div class="vp-ext" data-para="completo"><div class="vp-dur"><span>Duración</span><b id="vpMin">${v.min} min</b></div><input id="vpRango" type="range" min="3" max="15" step="1" value="${v.min}" aria-label="Duración en minutos reales"><small>Cuantos más minutos, más jugadas se ven. Todo a velocidad real.</small></div>`;
 const tip=`<div class="vp-ext" data-para="mejores">${TIPOS.map(([k,t])=>`<label class="vp-ck"><input type="checkbox" value="${k}" ${v.tipos.includes(k)?'checked':''}>${esc(t)}</label>`).join('')}</div>`;
 return `<div class="vp"><h2>¿Cómo querés ver el partido?</h2>
 ${tarjeta('completo','▶ Partido completo','Se ve en vivo, a velocidad real; lo que no tiene peligro se saltea.',dur)}
 ${v3?tarjeta('mejores','⭐ Mejores jugadas','Se simula entero y ves solo lo que marcás.',tip):''}
 ${tarjeta('simular','⏭ Simular partido','Directo al resultado con todas las estadísticas.')}
 <div class="vp-bt"><button class="btn small secondary" id="vpCancelar">CANCELAR</button><button class="btn" id="vpJugar">JUGAR</button></div></div>`}
function pintar(v3){const sh=document.getElementById('sheet');if(!sh)return;sh.innerHTML=html(v3);
 sh.querySelectorAll('.vp-op').forEach(l=>l.addEventListener('click',ev=>{if(ev.target.closest('.vp-ext'))return;sel.modo=l.dataset.m;pintar(v3)}));
 const r=document.getElementById('vpRango');if(r)r.addEventListener('input',()=>{sel.min=+r.value;document.getElementById('vpMin').textContent=r.value+' min'});
 sh.querySelectorAll('.vp-ck input').forEach(c=>c.addEventListener('change',()=>{sel.tipos=[...sh.querySelectorAll('.vp-ck input:checked')].map(x=>x.value)}));
 document.getElementById('vpCancelar').onclick=()=>{closeModal()};
 document.getElementById('vpJugar').onclick=()=>jugar(sel)}
/* abre el menú (solo antes de empezar; si el partido ya arrancó, el botón hace lo de siempre) */
window.mcVerPartido=function(){
 if(typeof match==='undefined'||!match||match.done||match.phase!=='pre'){window.mcMainAction&&mcMainAction();return}
 const v3=!!match.v3;sel=leer();if(!v3&&sel.modo==='mejores')sel.modo='completo';
 openModal('<div></div>');pintar(v3)};
/* juega con lo elegido (también lo usan las pruebas automáticas) */
function jugar(v){const m=match;if(!m||m.phase!=='pre')return;v=Object.assign({},DEF,v);v.min=Math.max(3,Math.min(15,Math.round(+v.min||5)));
 if(!m.v3&&v.modo==='mejores')v.modo='completo';if(v.modo==='mejores'&&!(v.tipos&&v.tipos.length))v.tipos=DEF.tipos.slice();
 guardar(v);try{closeModal()}catch(e){}
 m.ver={modo:v.modo,min:v.min,tipos:(v.tipos||[]).slice()};
 if(v.modo==='completo'){window.mcSpeed?mcSpeed(1):mcMainAction();return}
 if(v.modo==='mejores'){if(window.MCV3TV&&MCV3TV.mejores)MCV3TV.mejores(m,v.tipos);mcSimEnd();try{go('match')}catch(e){}if(window.MC2D&&MC2D.mejores)MC2D.mejores(m);try{renderMatch()}catch(e){}return}
 mcSimEnd();try{go('match')}catch(e){}try{if(window.MC12&&MC12.mTab)MC12.mTab('stats');else renderMatch()}catch(e){}}
window.mcJugarPartido=jugar;
const st=document.createElement('style');st.textContent=`.vp h2{margin:0 0 10px;font-size:18px}
.vp-op{display:block;border:1px solid rgba(226,189,112,.35);border-radius:12px;padding:10px 12px;margin:8px 0;cursor:pointer;background:rgba(255,255,255,.03)}
.vp-op.on{border-color:#e2bd70;background:rgba(226,189,112,.12)}
.vp-op input[type=radio]{display:none}.vp-op b{display:block;font-size:15px}.vp-op span{display:block;font-size:12px;opacity:.8}
.vp-ext{display:none;margin-top:8px}.vp-op.on .vp-ext{display:block}
.vp-dur{display:flex;justify-content:space-between;font-size:13px}.vp-ext input[type=range]{width:100%;accent-color:#e2bd70}.vp-ext small{font-size:11px;opacity:.75}
.vp-ck{display:inline-flex;align-items:center;gap:5px;width:48%;font-size:13px;margin:3px 0}
.vp-bt{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}`;document.head.appendChild(st);
})();
