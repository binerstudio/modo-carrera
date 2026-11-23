/* ===== MODO CARRERA · ATRIBUTOS INDIVIDUALES (motor v2) =====
   No hay una fuente con atributos reales para estos jugadores, así que se ESTIMAN de forma
   determinista (el mismo jugador siempre da los mismos valores) a partir de:
     posición + GRL (dato de la base) + edad + un perfil de juego elegido por su nombre.
   Todo atributo calculado acá lleva origen:'estimado'. Nunca se presenta como dato real.
   Normalización: el compuesto principal de su puesto (arquero, defensa, mediocampo o ataque)
   queda igual a su GRL, así el GRL sigue siendo la referencia y los atributos solo reparten
   sus virtudes y defectos.
   Si en el futuro un jugador trae atributos verificados (p.atributos con origen:'verificado'),
   se usan esos y no se estima nada. */
(function(root){
'use strict';
const CAMPO=['aceleracion','velocidad','tiro','definicion','potencia','paseCorto','paseLargo','vision','centros','regate','control','agilidad','equilibrio','fuerza','resistencia','salto','cabeceo','marcaje','entradas','intercepciones','posicionamiento','reacciones','anticipacion','inteligencia'];
const ARQ=['estirada','manejo','saque','reflejos','colocacion'];
const TODOS=CAMPO.concat(ARQ);
/* nombres para mostrar (ritmo = promedio de aceleración y velocidad) */
const NOMBRES={ritmo:'Ritmo',aceleracion:'Aceleración',velocidad:'Velocidad',tiro:'Tiro',definicion:'Definición',potencia:'Potencia',paseCorto:'Pase corto',paseLargo:'Pase largo',vision:'Visión',centros:'Centros',regate:'Regate',control:'Control',agilidad:'Agilidad',equilibrio:'Equilibrio',fuerza:'Fuerza',resistencia:'Resistencia',salto:'Salto',cabeceo:'Cabeceo',marcaje:'Marcaje',entradas:'Entradas',intercepciones:'Intercepciones',posicionamiento:'Posicionamiento',reacciones:'Reacciones',anticipacion:'Anticipación',inteligencia:'Inteligencia táctica',estirada:'Estirada',manejo:'Manejo',saque:'Saque',reflejos:'Reflejos',colocacion:'Colocación'};

/* compuestos por línea (todos en la escala del GRL) */
const W={
 ataque:{definicion:.28,regate:.17,aceleracion:.08,velocidad:.08,posicionamiento:.15,control:.1,potencia:.07,tiro:.07},
 medio:{paseCorto:.24,vision:.18,control:.15,inteligencia:.15,paseLargo:.1,resistencia:.08,regate:.05,intercepciones:.05},
 defensa:{marcaje:.24,entradas:.2,intercepciones:.18,posicionamiento:.13,fuerza:.08,salto:.07,anticipacion:.1},
 arquero:{reflejos:.28,estirada:.24,colocacion:.2,manejo:.16,reacciones:.07,saque:.05}
};
const LINEA={POR:'arquero',DEF:'defensa',MED:'medio',DEL:'ataque'};
function comp(a,k){const w=W[k];let s=0;for(const x in w)s+=a[x]*w[x];return s}

/* desvíos de cada puesto respecto del GRL (antes de normalizar) */
const BASE={
 POR:{_campo:-32,reacciones:4,anticipacion:-8,salto:-6,fuerza:-12,inteligencia:-16,estirada:0,manejo:0,saque:-4,reflejos:2,colocacion:0},
 DEF:{_arq:-55,marcaje:4,entradas:4,intercepciones:3,posicionamiento:2,fuerza:2,salto:2,cabeceo:2,anticipacion:1,definicion:-24,tiro:-18,potencia:-8,regate:-14,vision:-10,paseCorto:-6,paseLargo:-6,centros:-10,aceleracion:-6,velocidad:-5,agilidad:-8,control:-8},
 MED:{_arq:-55,paseCorto:4,paseLargo:2,vision:3,control:2,inteligencia:3,resistencia:3,marcaje:-12,entradas:-9,intercepciones:-4,definicion:-10,tiro:-6,cabeceo:-12,fuerza:-6,salto:-10},
 DEL:{_arq:-55,definicion:4,tiro:1,potencia:1,posicionamiento:3,marcaje:-40,entradas:-38,intercepciones:-34,paseLargo:-12,vision:-8,resistencia:-3,inteligencia:-6,salto:-6,cabeceo:-5,fuerza:-4,centros:-4}
};
/* perfiles de juego dentro de cada puesto (se elige uno por jugador, según su nombre) */
const PERFIL={
 POR:[['clasico',{}],['atajador',{reflejos:4,estirada:3,saque:-4}],['libero',{saque:6,paseCorto:8,colocacion:2,manejo:-3}]],
 DEF:[['central',{fuerza:5,salto:5,cabeceo:6,aceleracion:-6,velocidad:-5,centros:-8,regate:-4}],['lateral',{aceleracion:7,velocidad:7,centros:12,resistencia:4,fuerza:-6,cabeceo:-6,salto:-5,regate:5}],['marcador',{marcaje:3,entradas:3,anticipacion:3,paseCorto:-3,vision:-3}],['salida',{paseCorto:6,paseLargo:7,vision:5,control:4,marcaje:-3,entradas:-2}]],
 MED:[['contencion',{marcaje:10,entradas:10,intercepciones:8,fuerza:5,definicion:-6,regate:-6,vision:-3}],['creador',{vision:6,paseLargo:5,paseCorto:3,control:3,fuerza:-6,entradas:-6}],['llegador',{definicion:7,tiro:7,resistencia:4,aceleracion:3,paseLargo:-3,marcaje:-3}],['volante',{aceleracion:6,velocidad:6,regate:6,centros:8,agilidad:4,marcaje:-4,fuerza:-4}]],
 DEL:[['area',{cabeceo:10,salto:7,fuerza:8,definicion:3,aceleracion:-6,velocidad:-5,regate:-6,agilidad:-6}],['rapido',{aceleracion:9,velocidad:9,regate:5,agilidad:6,fuerza:-6,cabeceo:-6}],['tecnico',{regate:8,control:7,vision:6,agilidad:5,fuerza:-4,cabeceo:-5}],['completo',{tiro:3,potencia:3,paseCorto:3,resistencia:3}]]
};

function hash(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rnd(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const grupo=p=>({POR:'POR',DEF:'DEF',MED:'MED',DEL:'DEL'}[p]||'MED');

const CACHE=new Map();
/* info: {name, pos, grl, age} → {valores..., ritmo, perfil, origen, compuestos} */
function estimar(info){
 const pos=grupo(info.pos),grl=clamp(Math.round(+info.grl||60),30,99),age=+info.age||26,name=String(info.name||'?');
 const key=name+'|'+pos+'|'+grl+'|'+age;
 if(CACHE.has(key))return CACHE.get(key);
 const R=rnd(hash(name+'#'+pos));
 const perfiles=PERFIL[pos],perf=perfiles[Math.floor(R()*perfiles.length)];
 const B=BASE[pos],a={};
 for(const k of TODOS){
  let v=grl;
  if(ARQ.includes(k))v+=(B._arq||0);else v+=(B._campo||0);
  v+=(B[k]||0)+(perf[1][k]||0)+Math.round((R()*2-1)*4);
  a[k]=v;
 }
 /* edad: los jóvenes son más rápidos y menos leídos; los veteranos al revés */
 if(age<=21){const j=22-age;a.aceleracion+=2+j;a.velocidad+=2+j;a.anticipacion-=2+j;a.inteligencia-=2+j;a.vision-=1+j}
 if(age>=30){const v=age-29;a.aceleracion-=1.5*v;a.velocidad-=1.5*v;a.agilidad-=v;a.resistencia-=v;a.inteligencia+=Math.min(6,v+1);a.anticipacion+=Math.min(6,v+1);a.vision+=Math.min(4,v)}
 /* normalizar: el compuesto principal del puesto = GRL */
 const lin=LINEA[pos],off=grl-comp(a,lin);
 for(const k of TODOS)a[k]=clamp(Math.round(a[k]+off),15,99);
 /* ajuste fino por redondeo/topes (hasta 3 pasadas) */
 for(let i=0;i<3;i++){const d=Math.round(grl-comp(a,lin));if(!d)break;for(const k in W[lin])a[k]=clamp(a[k]+d,15,99)}
 a.ritmo=Math.round((a.aceleracion+a.velocidad)/2);
 const out={v:a,perfil:perf[0],origen:'estimado',pos,grl,
  c:{ataque:comp(a,'ataque'),medio:comp(a,'medio'),defensa:comp(a,'defensa'),arquero:comp(a,'arquero')}};
 CACHE.set(key,out);
 if(CACHE.size>60000)CACHE.clear();
 return out;
}
function de(info){
 if(info&&info.atributos&&info.atributos.origen==='verificado'){const a=info.atributos.v;return{v:a,perfil:info.atributos.perfil||'',origen:'verificado',pos:grupo(info.pos),grl:+info.grl,
  c:{ataque:comp(a,'ataque'),medio:comp(a,'medio'),defensa:comp(a,'defensa'),arquero:comp(a,'arquero')}}}
 return estimar(info);
}
root.MCAtributos={de,estimar,comp,LINEA,CAMPO,ARQ,TODOS,NOMBRES,PERFILES:Object.fromEntries(Object.entries(PERFIL).map(([k,v])=>[k,v.map(x=>x[0])]))};
})(typeof window!=='undefined'?window:globalThis);
