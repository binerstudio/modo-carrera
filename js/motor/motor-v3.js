/* ===== MODO CARRERA · MOTOR DE PARTIDOS v3 · ETAPA 1 (base de simulación) =====
   El partido se juega de verdad en una cancha de 105 × 68 m: 22 jugadores y una pelota con física,
   10 pasos (ticks) por segundo de juego. El resultado es lo que pasa en la cancha; no hay
   probabilidades de gol "por minuto".
   · Determinista: todo el azar sale de un generador propio con semilla (nunca Math.random ni la hora).
   · Corre en Node sin navegador (no usa window ni document; si existe MCAtributos lo usa).
   · Pelota: pases rasos (rozamiento con el césped) y por arriba (gravedad, piques), remates,
     rebotes en jugadores, palos y travesaño, salidas por lateral y por línea de fondo.
   · Jugadores: velocidad máxima y aceleración según sus atributos (aceleración, velocidad),
     desgaste físico según resistencia.
   · El que tiene la pelota decide en cada momento entre pasar (raso o por arriba), conducir,
     gambetear o patear, mirando las líneas de pase libres, la presión rival, la distancia al arco
     y sus atributos. Los demás se ubican según su posición en la formación y la pelota.
   · Salida: eventos (minuto, jugadores, tipo), estadísticas y una "cinta" de posiciones muestreadas.
   ETAPA 1: no hay faltas, tarjetas, offside sancionado, cambios ni táctica fina (etapas 2 y 3).
   No está conectado al juego todavía (etapa 5): el motor v1/v2 sigue siendo el que juega. */
(function(root){
'use strict';
/* referencia local: dentro de un contexto vm el acceso a globales es lento */
const MATH=Math;
const VERSION='3.0.0-e5';
const PW=105,PH=68,TPS=10,DT=1/TPS,G=9.81,SUB=4,H=DT/SUB;
const GY0=34-3.66,GY1=34+3.66,GH=2.44,BR=0.11;            // arco y radio de la pelota
const AREA_X=16.5,AREA_Y0=34-20.16,AREA_Y1=34+20.16;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const sqrt=MATH.sqrt,hyp=(x,y)=>sqrt(x*x+y*y);

/* ---------- azar propio con semilla ---------- */
function hash(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=MATH.imul(h,16777619)}return h>>>0}
function mkRng(seed){let a=seed>>>0;const f=function(){a=a+0x6D2B79F5|0;let t=MATH.imul(a^a>>>15,1|a);t=t+MATH.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 /* normal aproximada (suma de 4 uniformes, desvío 1): evita log/cos */
 f.g=()=>(f()+f()+f()+f()-2)*1.7320508;return f}

/* ---------- atributos ---------- */
const CLAVES=['aceleracion','velocidad','tiro','definicion','potencia','paseCorto','paseLargo','vision','centros','regate','control','agilidad','equilibrio','fuerza','resistencia','salto','cabeceo','marcaje','entradas','intercepciones','posicionamiento','reacciones','anticipacion','inteligencia','estirada','manejo','saque','reflejos','colocacion'];
const GRUPO=p=>({POR:'POR',DEF:'DEF',MED:'MED',DEL:'DEL'}[p]||'MED');
function atributos(info){
 const MA=root.MCAtributos;
 if(MA&&MA.de){const r=MA.de(info);return{v:r.v,origen:r.origen,perfil:r.perfil}}
 const v={};for(const k of CLAVES)v[k]=clamp(+info.grl||60,15,99);return{v,origen:'grl',perfil:''};
}

/* ---------- calibración (etapa 4): perillas del motor, todas en un solo lugar ---------- */
const CAL={
 nivel:70,atributos:.70,   // atributos comprimidos alrededor de 70 (1 = sin comprimir)
 satura:16,                // y saturados: las diferencias enormes pesan menos que en línea recta (tanh)
 punteria:.11,            // error base de los remates (radianes)
 alcanceArquero:1.7,      // alcance del arquero parado (m)
 remate:.6,               // ganas de patear (multiplica el xG al decidir)
 cuidado:2.1,              // cuánto pesa perder la pelota al elegir un pase o una conducción
 faltaArea:.026,            // el defensor se cuida en su área (multiplica la chance de falta)
 desfase:3.4,              // cuánto se pasa de la línea el delantero que espera (offsides)
 rebotaAfuera:.85,          // atajadas que se van por el costado del arco (córners)
 despejeCorner:.7,
 controlAlFondo:.6,         // control fallido de un defensor en su área que se va al fondo
 centro:1.3,               // ganas de tirar centros desde la banda
 bloqueaCentro:.25,        // centros que tapa el que marca al centrador (muchos se van al córner)        // despejes de cabeza apurados en el área propia que terminan en córner
 dia:1.2,                  // forma del día de cada equipo: desvío (en puntos de atributo) sorteado con la semilla
 toque:1,                  // ticks de más que se toma el que recibe antes de decidir (ritmo de pases)
 costoPase:.0015,          // costo fijo de cada pase frente a seguir con la pelota (ritmo de pases)
 local:.115                // local: algo más de confianza (menos error al ejecutar) e intensidad (se cansa menos)
};
/* ---------- táctica y formación ---------- */
/* mismos valores que usa el juego (js/core/07-mc7-match.js: ownTac / rivalTac) */
const TAC_BASE={style:'Equilibrado',mentality:50,width:50,depth:50,pressing:50,rhythm:50,formation:'4-3-3'};
/* pizarra del juego (js/core/01-base-v4.js: positions): x 0-100 de izquierda a derecha, y 0-100 con el arco propio abajo (88) */
const PLANTILLAS={'4-3-3':[[17,68],[39,73],[61,73],[83,68],[34,49],[50,55],[66,49],[18,25],[50,15],[82,25]],
 '4-2-3-1':[[17,68],[39,73],[61,73],[83,68],[39,57],[61,57],[20,35],[50,38],[80,35],[50,15]],
 '4-4-2':[[17,68],[39,73],[61,73],[83,68],[18,48],[39,51],[61,51],[82,48],[38,19],[62,19]],
 '3-5-2':[[27,72],[50,75],[73,72],[12,49],[32,51],[50,55],[68,51],[88,49],[38,20],[62,20]],
 '5-3-2':[[12,68],[31,72],[50,74],[69,72],[88,68],[32,49],[50,54],[68,49],[38,20],[62,20]],
 '4-1-4-1':[[17,68],[39,73],[61,73],[83,68],[50,61],[18,43],[39,46],[61,46],[82,43],[50,17]],
 '3-4-3':[[27,72],[50,75],[73,72],[15,48],[39,52],[61,52],[85,48],[18,22],[50,17],[82,22]]};
const LINEA_ROL={LI:'def',LD:'def',DFC:'def',MCD:'med',MC:'med',MI:'med',MD:'med',MCO:'med',EI:'atq',ED:'atq',DC:'atq'};
function plantilla(formacion,n){
 let P=PLANTILLAS[formacion];
 if(!P||P.length!==n){ /* formación desconocida o equipo incompleto: líneas parejas */
  let f=String(formacion||'4-3-3').split('-').map(Number).filter(x=>x>0);
  if(f.reduce((a,b)=>a+b,0)!==n){f=n>=10?[4,3,3]:[MATH.ceil(n*.4),MATH.ceil(n*.3),0];f[2]=n-f[0]-f[1];f=f.filter(x=>x>0)}
  P=[];f.forEach((k,l)=>{const y=f.length===1?50:73-l*(58/(f.length-1));for(let j=0;j<k;j++)P.push([k===1?50:15+j*(70/(k-1)),y])});
 }
 return P;
}
function rolDe(x,y,nDef){
 if(y>=64)return nDef===3?'DFC':(x<25?'LI':x>75?'LD':'DFC');
 const central=x>=30&&x<=70;
 if(y>=52)return central?'MCD':(x<50?'MI':'MD');
 if(y>=40)return central?'MC':(x<50?'MI':'MD');
 if(y>=30)return central?'MCO':(x<50?'EI':'ED');
 return central?'DC':(x<50?'EI':'ED');
}
/* táctica → parámetros de la cancha. M mentalidad, W ancho, D profundidad (línea), Pz presión, Q ritmo, en -1..1 */
function tactica(t0){
 const t=Object.assign({},TAC_BASE,t0||{}),n=v=>clamp(((v==null||isNaN(+v)?50:+v)-50)/50,-1,1);
 let M=n(t.mentality),W=n(t.width),D=n(t.depth),Pz=n(t.pressing),Q=n(t.rhythm),dir=.45+Q*.2,contra=false,posesion=false;
 switch(t.style){
  case 'Ofensivo':M+=.25;break;
  case 'Defensivo':M-=.35;D-=.3;break;
  case 'Posesión':dir-=.32;posesion=true;break;
  case 'Contraataque':dir+=.35;contra=true;D-=.25;break;
  case 'Presión alta':Pz+=.45;D+=.25;break;
 }
 M=clamp(M,-1,1);D=clamp(D,-1,1);Pz=clamp(Pz,-1,1);
 return{style:t.style,formation:t.formation,M,W,D,Pz,Q,directo:clamp(dir,0,1),contra,posesion,
  contrapresion:Pz+M*.5>.25,                     // al perder: presión inmediata (si no, repliegue)
  umbralPresion:62-Pz*36,                        // presiona cuando la pelota pasa esta altura (coordenadas propias)
  bloque:D>.33?'alto':D<-.33?'bajo':'medio'};
}
/* ---------- partido ---------- */
function Partido(loc,vis,R,opt){
 this.R=R;this.opt=opt;this.t=0;this.parte=1;this.tParte=0;this.estado='parado';
 this.eventos=[];this.equipos=[loc,vis];this.goles=[0,0];
 const z=()=>[0,0];
 this.st={pases:z(),pasesOk:z(),pasesAltos:z(),remates:z(),alArco:z(),atajadas:z(),bloqueos:z(),palos:z(),corners:z(),laterales:z(),saquesArco:z(),
  quites:z(),intercepciones:z(),gambetas:z(),gambetasOk:z(),cabezazos:z(),xg:z(),posTicks:z(),ticksJuego:0,
  posesiones:z(),recuperaciones:z(),recupCampoRival:z(),alturaRecup:z(),pelotazos:z(),desmarques:z(),paredes:z(),cambiosFrente:z(),contras:z(),contrapresiones:z(),repliegues:z(),
  faltas:z(),amarillas:z(),rojas:z(),penales:z(),penalesPateados:z(),penalesGol:z(),offsides:z(),tirosLibres:z(),tirosLibresDirectos:z(),lesiones:z(),cambios:z(),ventajas:z(),despejes:z(),centros:z(),origenGoles:{}};
 this.trans=[null,null];this.lin=[30,30];this.ctrlEq=-1;
 const mf=()=>({n:0,largo:0,ancho:0,dDM:0,dMA:0,linea:0,bloque:0,alin:0});this.md=[[mf(),mf()],[mf(),mf()]];
 /* local (equipo 0): confianza e intensidad; el neutral se pide con opt.neutral */
 this.conf=opt.neutral?[1,1]:[1-CAL.local,1];this.tacBase=[null,null];this.dia=[0,0];
 this.ultRemate=[null,null];this.ultCorner=null;
 this.J=[];this.eq=[[],[]];this.banco=[[],[]];this.cambios=[null,null];this.salidos=[];this.interr=[0,0];this.fin=false;this.suspendido=false;this.ventaja=null;this.paraLesion=null;this.enEntretiempo=false;
 [loc,vis].forEach((T,e)=>{
  const lista=(T.players||[]).slice(0,11);
  if(lista.length<7)throw new Error('motor v3: '+(T.name||'equipo')+' tiene menos de 7 jugadores');
  let gk=lista.findIndex(p=>GRUPO((p.p||p).pos)==='POR');if(gk<0)gk=0;
  const orden=[lista[gk]].concat(lista.filter((_,i)=>i!==gk));
  this.tacBase[e]=T.tac;this.dia[e]=R.g()*CAL.dia;
  const tac=tactica(T.tac);this.tac=this.tac||[];this.tac[e]=tac;
  const pl=plantilla(tac.formation,orden.length-1),nDef=pl.filter(q=>q[1]>=64).length,umax=MATH.max(...pl.map(q=>MATH.abs(q[0]-50)/50))||1;
  orden.forEach((raw,i)=>{
   const sl=i>0?pl[i-1]:[50,88],rol=i===0?'POR':rolDe(sl[0],sl[1],nDef),rel=i===0?0:clamp((73-sl[1])/58,0,1),uy=i===0?0:(sl[0]-50)/50/umax;
   const j=this.crearJugador(raw,e,this.J.length,{i,rol,linea:i===0?'arq':LINEA_ROL[rol],rel,uy,gk:i===0});
   this.J.push(j);this.eq[e].push(j);
  });
  /* banco de suplentes (hasta 9) y plan de cambios del DT: tres ventanas alrededor de los 60, 70 y 80 minutos */
  this.banco[e]=(T.players||[]).slice(11,20);
  this.cambios[e]={n:0,ventanas:0,rean:null,plan:[58+R()*6,69+R()*6,79+R()*5]};
 });
 this.activos();this.minimoEnCancha=[this.eq[0].length,this.eq[1].length];
 /* árbitro: si el juego manda uno (mismo formato que el motor v2: severidad 0,8-1,25 y precisión 0,86-0,97) se usa; si no, se sortea */
 const ar=opt.arbitro||{};
 this.arb={severidad:ar.severidad!=null?+ar.severidad:+(0.8+R()*0.45).toFixed(2),precision:ar.precision!=null?+ar.precision:+(0.86+R()*0.11).toFixed(3)};
 this.B={x:52.5,y:34,z:0,vx:0,vy:0,vz:0,dueno:null,ultimo:null,tipo:'muerta',desde:null,destino:null,tiro:null,ultTiro:null,enRed:false,sinDueno:0,off:null};
 this.anadido=[0,0];   // el descuento se calcula al minuto 45 de cada tiempo, según las interrupciones
 this.cada=MATH.max(1,opt.cintaCada|0||5);
 this.cinta=opt.cinta===false?null:{t:[],d:[]};
}
const P=Partido.prototype;

/* coordenadas de ataque del equipo e (siempre ataca hacia x=105) */
P.dir=function(e){return (e===0)===(this.parte===1)?1:-1};
P.ax=function(e,x){return this.dir(e)>0?x:PW-x};
P.ay=function(e,y){return this.dir(e)>0?y:PH-y};
P.wx=P.ax;P.wy=P.ay; // la transformación es su propia inversa

/* reloj */
P.minuto=function(){const s=MATH.floor(this.tParte/TPS),m=MATH.floor(s/60),base=this.parte===1?0:45;
 return m>=45?{min:base+45,anadido:m-44,seg:s}:{min:base+m+1,anadido:0,seg:s}};
P.ev=function(tipo,e,j,extra){const m=this.minuto();
 const o={t:this.t,parte:this.parte,min:m.min,seg:m.seg,tipo,equipo:e};if(m.anadido)o.anadido=m.anadido;
 if(j){o.jugador=j.nombre;o.jid=j.id;if(j.clave!=null)o.clave=j.clave}
 if(extra)for(const k in extra)o[k]=extra[k];
 o.x=+this.B.x.toFixed(1);o.y=+this.B.y.toFixed(1);
 this.eventos.push(o);return o};

/* ---------- utilidades de la cancha ---------- */
P.energiaVmax=function(j){return j.vmax*(.85+.15*j.energia)*(j.superado>0?.55:1)};
/* valor de tener la pelota en (ax,ay) para el equipo que ataca hacia x=105 */
function V(ax,ay){const dx=PW-ax,dy=ay-34,dg=hyp(dx,dy),r=ax/PW;return .01+.06*r*r+.12*MATH.exp(-dg/9)}   // calibrado: tener la pelota cerca del arco vale menos que patear con algo de ángulo
function xgDe(ax,ay){const dx=MATH.max(.5,PW-ax),a1=MATH.atan2(GY1-ay,dx),a0=MATH.atan2(GY0-ay,dx),ang=MATH.abs(a1-a0),d=hyp(dx,ay-34);
 return 1/(1+MATH.exp(-(-1.1+1.4*ang-.11*d)))}
P.rivales=function(e){return this.eq[1-e]};
P.presion=function(e,x,y){let p=0,dmin=99;for(const o of this.eq[1-e]){const d=hyp(o.x-x,o.y-y);if(d<dmin)dmin=d;if(d<6)p+=1-d/6}return{p:MATH.min(2,p),dmin}};
/* línea de offside del equipo e (en sus coordenadas de ataque): anteúltimo rival, pelota o mitad de cancha */
P.lineaOffside=function(e){const c=this._offs;if(c&&c.t===this.t&&c[e]!=null)return c[e];
 let m1=-1,m2=-1;for(const o of this.eq[1-e]){const x=this.ax(e,o.x);if(x>m1){m2=m1;m1=x}else if(x>m2)m2=x}
 const v=MATH.max(m2>=0?m2:PW,this.ax(e,this.B.x),52.5);
 if(!c||c.t!==this.t)this._offs={t:this.t};this._offs[e]=v;return v};

/* ---------- reanudaciones ---------- */
P.reanudar=function(tipo,e,x,y,espera,extra){
 if(this.fin)return;
 const B=this.B;B.x=x;B.y=y;B.z=0;B.vx=B.vy=B.vz=0;B.dueno=null;B.tiro=null;B.ultTiro=null;B.tipo='muerta';B.destino=null;B.enRed=false;B.off=null;
 for(const j of this.A){j.manos=false;j.accion=null;j.ctrl=0;j.superado=0;j.orden=null;j.enBarrera=false;j.corrida=null;j.pared=null}
 this.ventaja=null;this.paraLesion=null;
 this.estado='parado';this.rean={tipo,e,x,y,ej:null,timer:espera,plan:null,datos:null};
 /* el DT puede hacer cambios en cualquier interrupción */
 if(tipo!=='penal')for(const k of [0,1])this.dt(k);
 if(this.fin)return;
 const A=this.armar(tipo,e,x,y,extra);this.rean.ej=A.ej;this.rean.plan=A.plan;this.rean.datos=A.datos;
 const d=A.datos;
 if(tipo==='tiro_libre'){this.st.tirosLibres[e]++;if(d.modo==='directo'||d.modo==='ensayada')this.st.tirosLibresDirectos[e]++;
  this.ev('tiro_libre',e,A.ej,{indirecto:!!d.indirecto,modo:d.modo,barrera:d.barrera||0})}
 else if(tipo==='penal'){this.st.penales[e]++;this.interrumpir(50);this.ev('penal',e,A.ej)}
 else if(tipo==='saque_arco')this.ev(tipo,e,A.ej,{largo:!!d.largo});
 else if(tipo==='corner')this.ev(tipo,e,A.ej,{marca:d.marca});
 else if(tipo==='bote')this.ev('bote',e,A.ej);
 else if(tipo!=='saque_centro')this.ev(tipo,e,A.ej);
};
P.colocarSaqueCentro=function(e){
 for(const j of this.A){const mio=j.eq===e;let ax=j.gk?3:MATH.min(j.bx*.85,mio?50:42),ay=j.by;
  j.x=this.wx(j.eq,ax);j.y=this.wy(j.eq,ay);j.vx=j.vy=0}
 const ej=this.rean.ej;ej.x=52.5-this.dir(e)*.6;ej.y=34;
};
P.ejecutarReanudacion=function(){
 const r=this.rean,B=this.B;if(r.tipo==='saque_centro')this.colocarSaqueCentro(r.e);
 const ej=r.ej;
 if(r.tipo!=='saque_centro'){const d=this.dir(r.e);ej.x=clamp(r.x-d*.5,-.5,PW+.5);ej.y=r.y;ej.vx=ej.vy=0;this.posicionesParado(true)}
 this.cambioPosesion(r.e,r.x,false);
 B.x=r.x;B.y=r.y;B.dueno=ej;B.ultimo=ej;B.tipo='control';ej.ctrl=0;ej.prox=this.t;ej.conPelota=0;ej.saque=r.tipo;
 if(r.tipo==='saque_centro')this.ev('saque_centro',r.e,ej);
 this.estado='juego';this.rean=null;
 /* pelotas paradas con ejecución propia */
 if(r.tipo==='penal'){B.dueno=null;ej.saque=null;this.patearPenal(ej);return}
 if(r.tipo==='corner')this.ultCorner={e:r.e,t:this.t};
 if(r.tipo==='corner'){B.dueno=null;if(!this.sacarCorner(ej,r)){B.dueno=ej}else ej.saque=null;return}
 if(r.tipo==='tiro_libre'){B.dueno=null;if(!this.tiroLibre(ej,r)){B.dueno=ej}else ej.saque=null;return}
 if(r.tipo==='saque_arco')ej.saque=r.datos.largo?'saque_arco_largo':'saque_arco_corto';
 if(r.tipo==='bote')ej.saque=null;
};
P.salida=function(){
 /* la pelota cruzó una línea (sin dueño). Devuelve true si se detuvo el juego */
 const B=this.B;
 if(B.y<-BR||B.y>PH+BR){const u=B.ultimo,e=u?1-u.eq:0;this.st.laterales[e]++;this.reanudar('lateral',e,clamp(B.x,.5,PW-.5),B.y<0?0:PH,80);return true}
 if(B.x<-BR||B.x>PW+BR){
  const lado=B.x<0?0:1;                                   // 0: arco de x=0
  const def=this.dir(0)>0?(lado===0?0:1):(lado===0?1:0);   // equipo que defiende ese arco
  const u=B.ultimo;
  if(B.y>GY0&&B.y<GY1&&B.z<GH){this.gol(1-def);return true}
  if(u&&u.eq===def){this.st.corners[1-def]++;this.reanudar('corner',1-def,lado===0?.3:PW-.3,B.y<34?.3:PH-.3,220)}
  else{this.st.saquesArco[def]++;this.reanudar('saque_arco',def,lado===0?5.5:PW-5.5,B.y<34?29:39,150)}
  return true}
 return false;
};
/* manejo del resultado: el que gana por 2 o más se cuida (baja mentalidad, presión y línea); el que pierde arriesga */
P.ajustarPorResultado=function(){
 for(const e of [0,1]){
  const dif=this.goles[e]-this.goles[1-e],min=this.minAbs();let dM=0,dP=0,dD=0;
  if(dif>=3){dM=-.85;dP=-.7;dD=-.5}else if(dif===2){dM=-.35;dP=-.3;dD=-.2}else if(dif===1&&min>70){dM=-.2;dP=-.1;dD=-.1}
  else if(dif<=-3){dM=0;dP=0}   // perdiendo por 3 o más ya no se regala atrás
  else if(dif<=-2){dM=.3;dP=.15}else if(dif===-1&&min>70){dM=.3;dP=.2;dD=.1}
  else if(dif===0&&min>75&&e===1&&!this.opt.neutral){dM=-.2;dP=-.1}   // de visitante, empatando al final, se conforma
  const T=tactica(this.tacBase[e]);T.M=clamp(T.M+dM,-1,1);T.Pz=clamp(T.Pz+dP,-1,1);T.D=clamp(T.D+dD,-1,1);
  T.contrapresion=T.Pz+T.M*.5>.25;T.umbralPresion=62-T.Pz*36;T.bloque=T.D>.33?'alto':T.D<-.33?'bajo':'medio';
  this.tac[e]=T;
 }
};
P.gol=function(e){
 const B=this.B,u=B.ultimo,tiro=B.tiro;this.goles[e]++;
 let autor=null,enContra=false,asist=null;
 const ut=B.ultTiro;
 if(u&&u.eq!==e&&ut&&ut.j.eq===e&&this.t-ut.t0<40&&!B.dueno){autor=ut.j;asist=autor.recibioDe&&autor.recibioDe.eq===e&&autor.recibioDe!==autor?autor.recibioDe:null}
 else if(u&&u.eq===e){autor=(tiro&&tiro.j.eq===e)?tiro.j:u;if(autor.recibioDe&&autor.recibioDe.eq===e&&autor.recibioDe!==autor)asist=autor.recibioDe}
 else if(u){autor=u;enContra=true}
 if(autor&&!enContra)autor.s.goles++;if(asist)asist.s.asist++;
 const origen=enContra?'en_contra':(ut&&ut.j===autor&&ut.ctx?ut.ctx.origen:'area');this.st.origenGoles[origen]=(this.st.origenGoles[origen]||0)+1;
 B.ultTiro=null;this.ev('gol',e,autor,{origen,clave:autor?autor.clave:null,asistClave:asist?asist.clave:null,enContra,asistencia:asist?asist.nombre:null,aid:asist?asist.id:null,marcador:this.goles.slice(),xg:tiro?+tiro.xg.toFixed(3):null});
 B.enRed=true;this.interrumpir(35);this.ajustarPorResultado();
 if(tiro&&tiro.penal)this.st.penalesGol[tiro.j.eq]++;
 this.reanudar('saque_centro',1-e,52.5,34,420);
};

/* ---------- física de la pelota ---------- */
/* un subpaso de la pelota: en el aire gravedad y algo de aire; en el piso rozamiento; piques que pierden energía */
function integrar(B){
 if(B.z>0||B.vz>0){
  B.vz-=G*H;const sp=hyp(B.vx,B.vy),k=1-.012*sp*H;B.vx*=k;B.vy*=k;
  B.x+=B.vx*H;B.y+=B.vy*H;B.z+=B.vz*H;
  if(B.z<=0){B.z=0;if(B.vz<-1.2){B.vz=-B.vz*.45;B.vx*=.6;B.vy*=.6;return 'pique'}else B.vz=0}
 }else{
  const sp=hyp(B.vx,B.vy);
  if(sp>0){const ns=MATH.max(0,sp-(1+.06*sp)*H);B.vx*=ns/sp;B.vy*=ns/sp;B.x+=B.vx*H;B.y+=B.vy*H}
 }
 return null;
}
/* trayectoria libre (sin jugadores ni líneas) para pruebas: devuelve puntos cada tick */
function trayectoria(b,seg){const B={x:b.x||0,y:b.y||0,z:b.z||0,vx:b.vx||0,vy:b.vy||0,vz:b.vz||0},out=[],piques=[],alturas=[];let zm=0;
 for(let t=0;t<seg*TPS;t++){for(let s=0;s<SUB;s++){if(B.z>zm)zm=B.z;if(integrar(B)){piques.push(+B.x.toFixed(2));alturas.push(+zm.toFixed(2));zm=0}}out.push([B.x,B.y,B.z,hyp(B.vx,B.vy)])}return{puntos:out,piques,alturas}}
/* velocidad horizontal para que un pase por arriba recorra d metros en T segundos con el rozamiento del aire */
const vAire=(d,T)=>(MATH.exp(.012*d)-1)/(.012*T);
P.fisica=function(){
 const B=this.B;
 for(let s=0;s<SUB;s++){
  integrar(B);
  if(this.marcos())return true;
  if(B.tiro&&this.chequeoTiro())return true;
  if(B.x<-BR||B.x>PW+BR||B.y<-BR||B.y>PH+BR)return this.salida();
 }
 return false;
};
/* palos y travesaño */
P.marcos=function(){
 const B=this.B;
 for(const gx of [0,PW]){
  if(MATH.abs(B.x-gx)>.35)continue;
  for(const py of [GY0,GY1]){const d=hyp(B.x-gx,B.y-py);
   if(d<BR+.06&&B.z<GH){const nx=(B.x-gx)/(d||1),ny=(B.y-py)/(d||1),vn=B.vx*nx+B.vy*ny;
    if(vn<0){B.vx-=1.6*vn*nx;B.vy-=1.6*vn*ny;B.x=gx+nx*(BR+.07);B.y=py+ny*(BR+.07);this.toquePalo()}}}
  if(B.y>GY0&&B.y<GY1&&MATH.abs(B.z-GH)<BR+.06&&MATH.abs(B.x-gx)<BR+.06){
   const haciaAfuera=(gx===0?B.vx<0:B.vx>0);if(haciaAfuera){B.vz=-MATH.abs(B.vz)*.6-.5;B.vx*=-.5;B.x=gx+(gx===0?1:-1)*(BR+.08);this.toquePalo()}}
 }
 return false;
};
P.toquePalo=function(){const t=this.B.tiro;if(t&&!t.palo){t.palo=true;this.st.palos[t.j.eq]++;this.ev('palo',t.j.eq,t.j)}};
/* durante un remate: arquero y bloqueos */
P.chequeoTiro=function(){
 const B=this.B,T=B.tiro,e=T.j.eq,gk=this.eq[1-e][0];
 if(hyp(B.vx,B.vy)<5){B.tiro=null;return false}
 const bax=this.ax(e,B.x);
 /* bloqueo de un jugador de campo */
 if(!T.bloqueado&&B.z<(T.libre?2.15:1.7)){for(const o of this.eq[1-e]){if(o.gk||T.vistos.has(o.id))continue;const d=hyp(o.x-B.x,o.y-B.y);
  if(d<.75){T.vistos.add(o.id);if(this.R()<.6){T.bloqueado=true;
   if(this.enArea(o)&&this.R()<.09*this.arb.severidad&&this.R()<this.arb.precision){this.mano(o,T.j);return true}
   const vx0=B.vx,vy0=B.vy;this.desviar(o,3,9,0,3);
   if(this.R()<.7){const sp=hyp(B.vx,B.vy),k=sp/(hyp(vx0,vy0)||1);B.vx=vx0*k*(.8+this.R()*.4);B.vy=vy0*k+(this.R()-.5)*8}this.st.bloqueos[1-e]++;this.ev('bloqueo',1-e,o,{rematador:T.j.nombre});return false}}}}
 /* arquero: cuando la pelota llega a su altura */
 if(!T.gkVisto&&bax>=this.ax(e,gk.x)-.2){
  T.gkVisto=true;
  if(T.penal)return this.atajadaPenal(T,gk,e);
  const lat=MATH.abs(B.y-gk.y),tv=(this.t-T.t0)*DT,a=gk.a,reac=.32-a.reflejos*.002+(T.libre?.12:0);
  const alcance=CAL.alcanceArquero+clamp((tv-reac)*6.5,0,1.8+a.estirada*.013),sp=hyp(B.vx,B.vy);
  if(lat<=alcance&&B.z<=2.7&&!gk.superado){
   const p=lat<.5?.96:clamp(.95-.3*(lat/alcance)-MATH.max(0,sp-24)*.012+(a.reflejos-70)*.004,.05,.97);
   if(this.R()<p){
    this.st.atajadas[1-e]++;
    const pc=clamp(.25+a.manejo*.006-(sp-15)*.02,.05,.9);
    if(this.R()<pc&&this.enArea(gk)){this.ev('atajada',1-e,gk,{rematador:T.j.nombre,retenida:true});this.tomar(gk,true);return false}
    this.ev('atajada',1-e,gk,{rematador:T.j.nombre,retenida:false});
    const s=B.y>gk.y?1:-1;
    if(this.R()<CAL.rebotaAfuera){B.vx=B.vx*(.25+this.R()*.25);B.vy=s*(5+this.R()*6)}          // la manda afuera, por el costado del arco
    else{B.vx=-B.vx*(.15+this.R()*.25);B.vy=s*(3+this.R()*6)}
    B.vz=1+this.R()*3;B.z=MATH.max(B.z,.2);B.ultimo=gk;B.tiro=null;gk.cdToque=6;
   }
  }
 }
 return false;
};
/* penal: si el arquero se tiró al lado correcto puede llegar; si no, solo con los pies al medio */
P.atajadaPenal=function(T,gk,e){
 const B=this.B,R=this.R,a=gk.a,pe=T.penal,yb=this.ay(e,B.y)-34,ladoB=MATH.abs(yb)<1?0:(yb>0?1:-1);
 let p=0;
 if(pe.gLado===0)p=MATH.abs(yb)<1.1&&B.z<1.8?.85:.02;
 else if(pe.gLado===ladoB){const dist=MATH.abs(MATH.abs(yb)-2.3);p=clamp(.5-dist*.3-(B.z>1.6?.2:0)+(a.estirada+a.reflejos-140)*.004,.05,.8)}
 else p=MATH.abs(yb)<.6?.25:.01;
 if(!T.aPuerta)p=0;
 if(R()<p){this.st.atajadas[1-e]++;this.ev('atajada',1-e,gk,{rematador:T.j.nombre,retenida:false,penal:true});
  B.vx=-B.vx*(.2+R()*.3);B.vy=(yb>0?1:-1)*this.dir(e)*(2+R()*5);B.vz=.5+R()*2;B.z=MATH.max(B.z,.2);B.ultimo=gk;B.tiro=null;gk.cdToque=8}
 return false;
};
P.enArea=function(j){const ax=this.ax(j.eq,j.x),ay=this.ay(j.eq,j.y);return ax<AREA_X+.3&&ay>AREA_Y0&&ay<AREA_Y1};
P.desviar=function(j,v0,v1,z0,z1){const B=this.B,R=this.R,ang=R()*MATH.PI*2,sp=v0+R()*(v1-v0);
 B.vx=MATH.cos(ang)*sp;B.vy=MATH.sin(ang)*sp;B.vz=z0+R()*(z1-z0);if(B.vz>0)B.z=MATH.max(B.z,.05);B.ultimo=j;B.tiro=null;B.tipo='suelta';B.destino=null;j.cdToque=5};

/* ---------- control de la pelota suelta ---------- */
/* cambia el equipo que controla la pelota: posesiones, recuperaciones y transiciones */
P.cambioPosesion=function(e,x,enJuego){
 const prev=this.ctrlEq;if(prev===e)return;this.ctrlEq=e;this.st.posesiones[e]++;
 if(prev<0||!enJuego)return;
 const ax=this.ax(e,x);this.st.recuperaciones[e]++;this.st.alturaRecup[e]+=ax;if(ax>52.5)this.st.recupCampoRival[e]++;
 const Tp=this.tac[prev];
 this.trans[prev]={tipo:Tp.contrapresion?'presion':'repliegue',hasta:this.t+50};
 if(Tp.contrapresion)this.st.contrapresiones[prev]++;else this.st.repliegues[prev]++;
 /* al recuperar: contraataque si hay espacio (pocos rivales entre la pelota y el arco) */
 const T=this.tac[e];let detras=0;for(const o of this.eq[prev])if(!o.gk&&this.ax(e,o.x)>ax)detras++;
 if(ax<80&&(detras<=4||(T.contra&&detras<=6)||(T.directo>.6&&detras<=5))){this.trans[e]={tipo:'contra',hasta:this.t+60};this.st.contras[e]++}
 else this.trans[e]=null;
};
P.tomar=function(j,manos){
 const B=this.B,prev=B.tipo,desde=B.desde;
 if(B.off&&(B.off.e!==j.eq||!B.off.set.has(j.id)))B.off=null;
 this.cambioPosesion(j.eq,j.x,this.estado==='juego');
 /* pared: devolución al que había pasado y picó */
 if(prev==='pase'&&desde&&desde.eq===j.eq&&desde.recibioDe===j&&j.pared&&this.t-j.pared.t0<45){this.st.paredes[j.eq]++;j.pared=null}
 if(prev==='pase'&&desde&&desde.eq===j.eq&&j!==desde)j.ultRecibo={t:this.t,centro:!!B.centro,filtrado:!!(j.corrida&&j.corrida.hasta>this.t)};
 if(prev==='pase'&&desde){
  if(desde.eq===j.eq){if(j!==desde){if(!B.despeje){this.st.pasesOk[j.eq]++;desde.s.pasesOk++}j.recibioDe=desde}}
  else{this.st.intercepciones[j.eq]++;j.s.intercepciones++;this.ev('intercepcion',j.eq,j,{pasador:desde.nombre});j.recibioDe=null}
 }else if(!B.ultimo||B.ultimo.eq!==j.eq)j.recibioDe=null;
 B.dueno=j;B.ultimo=j;B.tipo='control';B.tiro=null;B.destino=null;B.desde=null;B.vx=B.vy=B.vz=0;B.z=0;
 j.manos=!!manos;j.conPelota=0;j.accion=null;
 j.ctrl=manos?18+MATH.floor(this.R()*15):clamp(MATH.round(3-(j.a.control-50)/25),1,4)+CAL.toque;j.prox=this.t+j.ctrl;
};
P.controles=function(){
 const B=this.B,R=this.R;if(B.enRed)return;
 /* una pelota recién pateada por arriba sube enseguida: el que está encima solo la tapa a veces, con el cuerpo */
 if(B.altoSale&&B.tipo==='pase'&&B.desde&&this.t-B.tPateo<4&&B.vz>0){
  if(this.t-B.tPateo===1){for(const j of this.A){if(j.eq===B.desde.eq||j.cdToque>0)continue;if(hyp(j.x-B.x,j.y-B.y)<1.2&&R()<(B.centro?CAL.bloqueaCentro:.12)){this.desviar(j,3,8,.2,2);if(B.centro&&R()<.6){const g=this.dir(j.eq);B.vx=-g*(4+R()*4);B.vy=(B.y<34?-1:1)*(2+R()*4)}B.altoSale=false;return}}}
  return;
 }
 const cand=[];
 for(const j of this.A){if(j.cdToque>0)continue;const d=hyp(j.x-B.x,j.y-B.y);if(d<1.5)cand.push([d,j])}
 if(!cand.length)return;
 cand.sort((a,b)=>a[0]-b[0]||a[1].id-b[1].id);
 /* el que estaba adelantado y va a jugar una pelota que le llega cerca, participa: offside */
 if(B.off&&B.z<2.4){for(const [d,j] of cand){if(B.off&&j.eq===B.off.e&&B.off.set.has(j.id)&&d<1.3){if(this.chequearOffside(j))return;break}}}
 for(const [d,j] of cand){
  const a=j.a,rel=hyp(B.vx-j.vx,B.vy-j.vy);
  const intercepta=B.tipo==='pase'&&B.desde&&B.desde.eq!==j.eq;
  if(j.gk&&this.enArea(j)&&d<1.4&&B.z<2.7){
   if(this.chequearOffside(j))return;
   const p=clamp(.85+a.manejo*.0015-MATH.max(0,rel-15)*.03,.2,.98);
   if(R()<p){this.tomar(j,true);return}
   this.desviar(j,2,6,.3,2);return;
  }
  if(d<.9&&B.z<1.0){
   if(this.chequearOffside(j))return;
   let p=.99-MATH.max(0,rel-10)*.03-(B.z>.3?.1:0)-(85-a.control)*.003;if(intercepta)p*=.8;
   p=1-(1-p)*this.conf[j.eq];
   if(R()<clamp(p,.05,.98)){this.tomar(j,false);return}
   if(B.tipo==='pase'&&B.z>.6&&intercepta&&this.enArea(j)&&!j.gk&&R()<.012*this.arb.severidad){this.mano(j,B.desde);return}
   j.cdToque=4;
   /* el defensor que no la puede controlar en su área a veces la manda al fondo */
   if(intercepta&&this.enArea(j)&&R()<CAL.controlAlFondo){const g=this.dir(j.eq),lado=B.y<34?-1:1;B.vx=-g*(4+R()*5);B.vy=lado*(3+R()*5);B.vz=R()*2;B.ultimo=j;B.tipo='suelta';continue}
   const k=.5+R()*.2,an=(R()-.5)*1.2,c=MATH.cos(an),s=MATH.sin(an),vx=B.vx*k,vy=B.vy*k;
   B.vx=vx*c-vy*s;B.vy=vx*s+vy*c;B.ultimo=j;if(B.tipo==='pase'&&intercepta){B.tipo='suelta'}continue;
  }
  if(d<1.1&&B.z>=1.0&&B.z<1.95+a.salto*.008){
   /* duelo aéreo: si hay un rival también en el salto, gana el mejor de cabeza (con algo de suerte y cercanía) */
   let gan=j;const riv=cand.filter(([dd,o])=>o.eq!==j.eq&&dd<1.3&&!o.gk);
   if(riv.length){const [dd,o]=riv[0],vj=cabeceador(j)+R.g()*9-d*8,vo=cabeceador(o)+R.g()*9-dd*8;if(vo>vj)gan=o;
    if(R()<.06){const fo=gan===j?o:j,vic=gan;if(this.contacto(fo,vic,{porDetras:true,vel:3,exito:false}))return}}
   if(gan.eq===(B.off&&B.off.e)&&this.chequearOffside(gan))return;
   if(B.off&&gan.eq!==B.off.e)B.off=null;
   this.cabezazo(gan);return}
 }
};
P.cabezazo=function(j){
 const B=this.B,R=this.R,e=j.eq,a=j.a;this.st.cabezazos[e]++;
 j.cdToque=5;B.ultimo=j;B.tipo='suelta';B.destino=null;B.desde=null;
 const ax=this.ax(e,j.x),ay=this.ay(e,j.y);
 if(ax>PW-AREA_X&&ay>AREA_Y0&&ay<AREA_Y1&&R()<.8){this.remate(j,true);return}
 /* despeje apurado en el área propia: muchas veces se va al córner */
 if(ax<AREA_X+2&&ay>AREA_Y0-2&&ay<AREA_Y1+2&&R()<CAL.despejeCorner){const d=this.dir(e),lado=ay<34?-1:1;
  B.vx=-d*(6+R()*5);B.vy=lado*d*(3+R()*5);B.vz=2+R()*3;B.z=MATH.max(B.z,1);B.tiro=null;this.marcarOffside(j,null);return}
 /* despeje o pase de cabeza: hacia adelante del propio equipo */
 const d=this.dir(e),an=(R()-.5)*1.6,sp=8+R()*5+(a.cabeceo-60)*.03;
 B.vx=d*MATH.cos(an)*sp;B.vy=MATH.sin(an)*sp*(d);B.vz=3+R()*2;B.z=MATH.max(B.z,1);B.tiro=null;
 this.marcarOffside(j,null);
};

/* ---------- decisiones del que tiene la pelota ---------- */
P.riesgoPase=function(j,tx,ty,vavg,alto,q){
 const e=j.eq,bx=j.x,by=j.y,dx=tx-bx,dy=ty-by,L2=dx*dx+dy*dy,L=MATH.sqrt(L2)||1;
 const tr=.15+MATH.max(0,hyp(q.x-tx,q.y-ty)-.6)/this.energiaVmax(q);
 const tLlega=L/vavg;let libre=1;
 for(const o of this.eq[1-e]){
  const ve=this.energiaVmax(o)*.9,reac=.32-o.a.anticipacion*.0015;
  if(!alto){
   let s=((o.x-bx)*dx+(o.y-by)*dy)/L2;s=clamp(s,0,1);
   const cx=bx+s*dx,cy=by+s*dy,l=hyp(o.x-cx,o.y-cy),tb=s*L/vavg,to=reac+MATH.max(0,l-1)/ve;
   const p=1/(1+MATH.exp(-(tb-to-.15)*6))*.9;libre*=1-p;
  }else{
   /* por arriba: solo se disputa donde cae */
   /* por arriba: la disputa es entre el receptor y el rival en el lugar donde cae (gana el que llega primero) */
   const l=hyp(o.x-tx,o.y-ty),to=reac+MATH.max(0,l-1.2)/ve;
   const p=1/(1+MATH.exp(-(MATH.max(tr,tLlega*.6)-MATH.max(to,tLlega*.6)+.1)*2.5))*.7;libre*=1-p;
   if(hyp(o.x-bx,o.y-by)<1.6)libre*=.8;
  }
 }
 /* por arriba cerca de una línea: se puede ir afuera con el pique */
 if(alto){const ax=this.ax(e,tx),ay=this.ay(e,ty);if(ax>PW-14)libre*=.55+.03*(PW-ax);if(ay<10||ay>PH-10)libre*=.6+.04*MATH.min(ay,PH-ay)}   // cerca de la raya: el pique la puede sacar
 /* el receptor también tiene que llegar */
 const llega=tr<=tLlega+.4?1:MATH.max(.2,1-(tr-tLlega-.4)*.5);
 return 1-libre*llega;
};
P.velPaseRaso=function(d){const va=8+d*.15;return MATH.min(28,MATH.sqrt(va*va+3*d))};
P.decidir=function(j){
 const e=j.eq,R=this.R,a=j.a,B=this.B;
 const ax=this.ax(e,j.x),ay=this.ay(e,j.y),pr=this.presion(e,j.x,j.y);
 const vOpp=V(PW-ax,PH-ay);
 const ruido=.006+(100-a.vision)*.0002,saque=j.saque;
 const T=this.tac[e],tr=this.trans[e],contra=tr&&tr.tipo==='contra'&&tr.hasta>this.t;
 /* posesión: perder la pelota pesa más; directo: avanzar pesa más */
 /* perder la pelota cerca del arco propio pesa mucho más */
 const dif=this.goles[e]-this.goles[1-e],relajo=dif>=5?.04:dif>=4?.12:dif>=3?.25:dif===2?.75:1;
 const pesoPerder=(CAL.cuidado+(T.posesion?.6:0)+(1-T.directo)*.4)*(1+.5*MATH.max(0,(40-ax)/40)),avance=contra?.03:T.directo*.012;
 const salida=(j.gk||j.linea==='def')&&ax<35;
 const opts=[];
 /* jugada ensayada: el que recibe el toque corto patea */
 if(j.ensayada&&j.ensayada>this.t){j.ensayada=0;const dg=hyp(PW-ax,34-ay);if(dg<34)return{tipo:'tiro',xg:xgDe(ax,ay),u:1,libre:true}}
 /* 1) remate */
 if(!saque&&!j.manos){const dg=hyp(PW-ax,34-ay);if(dg<34){
  let xg=xgDe(ax,ay)*(1+(a.definicion-65)*.006)*(1-.22*pr.p);
  /* rivales en el cono de tiro */
  let bloq=0;for(const o of this.eq[1-e]){if(o.gk)continue;const oax=this.ax(e,o.x),oay=this.ay(e,o.y);if(oax<=ax)continue;
   const tt=(oax-ax)/(PW-ax),yl=ay+(34-ay)*tt;if(MATH.abs(oay-yl)<1.2+3.66*tt)bloq++}
  xg*=MATH.pow(.8,bloq);
  opts.push({u:xg*(CAL.remate+.15*T.M)*relajo,tipo:'tiro',xg})}}
 /* 3) conducir */
 if(!saque&&!j.manos){
  const vel=this.energiaVmax(j);
  for(const an of [0,.5,-.5,1.05,-1.05,1.7,-1.7,3.14]){
   const dxA=MATH.cos(an)*5,dyA=MATH.sin(an)*5,pax=ax+dxA,pay=ay+dyA;
   if(pax<1||pax>PW-1||pay<1||pay>PH-1)continue;
   const px=this.wx(e,pax),py=this.wy(e,pay);
   /* cada rival que llega antes al punto puede quitarla */
   const vc=vel*(pr.dmin<2?.5:pr.dmin<3.5?.65:.82),tc=5/vc;let libre=1;
   for(const o of this.eq[1-e]){const d=hyp(o.x-px,o.y-py);if(d>12)continue;const to=.25+MATH.max(0,d-1)/this.energiaVmax(o);
    libre*=1-.5/(1+MATH.exp(-(tc-to)*3))}
   const rt=clamp((1-libre)*(1.3-a.regate/100)*(1.2-a.control/200),.02,.9);
   const u=(1-rt)*V(pax,pay)*(1+(a.regate-60)*.002)*.98-rt*vOpp*pesoPerder+avance*MATH.max(0,dxA)/5*(1-rt);
   opts.push({u,tipo:'conducir',dx:this.dir(e)*MATH.cos(an),dy:this.dir(e)*MATH.sin(an),vel:vel*(pr.dmin<2?.5:pr.dmin<3.5?.65:.82)})
  }
 }
 /* 4) gambeta: un rival encima y adelante */
 if(!saque&&!j.manos&&pr.dmin<2.2){
  let D=null,dd=99;for(const o of this.eq[1-e]){const d=hyp(o.x-j.x,o.y-j.y);if(d<dd&&o.superado<=0){dd=d;D=o}}
  if(D&&this.ax(e,D.x)>=ax-.5){
   const ps=clamp(.38+((a.regate+a.agilidad)/2-(D.a.entradas+D.a.marcaje)/2)*.008,.1,.75);
   const s=this.ay(e,D.y)>ay?-1:1,pax=MATH.min(PW-1,ax+4),pay=clamp(ay+s*2.5,1,PH-1);
   opts.push({u:ps*V(pax,pay)*.97-(1-ps)*vOpp,tipo:'gambeta',D,ps,s})
  }
 }
 let cota=-1e9;for(const o of opts)if(o.u>cota)cota=o.u;
 /* 2) pases */
 const offs=this.lineaOffside(e);
 for(const q of this.eq[e]){
  if(q===j)continue;const d0=hyp(q.x-j.x,q.y-j.y);if(d0<4||d0>62)continue;
  /* el pasador evita al que ve adelantado (con error según su visión); en laterales, córners y saques de arco no hay offside */
  const qax=this.ax(e,q.x),sinOff=saque==='lateral'||saque==='corner'||saque==='saque_arco_corto'||saque==='saque_arco_largo';
  const qaxV=this.ax(e,q.x-q.vx*.7);
  if(!sinOff&&qaxV>offs+.5+R.g()*(.9+(100-a.vision)*.02))continue;
  if(saque==='saque_arco_corto'&&d0>32)continue;
  if(saque==='saque_arco_largo'&&(d0<28||qax<45))continue;
  if(saque==='saque_centro'&&qax>52.5)continue;
  let rRaso=1;
  for(const alto of [false,true]){
   if(saque==='lateral'&&d0>28)continue;
   if(alto&&d0<18&&saque!=='lateral')continue;
   if(alto&&saque==='saque_arco_corto')continue;
   if(!alto&&saque==='saque_arco_largo')continue;
   if(alto&&saque!=='lateral'&&saque!=='corner'&&rRaso<.35&&d0<32)continue;
   if(!alto&&saque==='lateral')continue;
   const vz=alto?1:0,vh=alto?clamp(d0/1.9,7,18):this.velPaseRaso(d0),vavg=alto?vh:vh*.85,tEst=d0/vavg;
   const corre=q.corrida&&q.corrida.hasta>this.t,ad=corre?.9:.7;let tx=clamp(q.x+q.vx*tEst*ad,2,PW-2),ty=clamp(q.y+q.vy*tEst*ad,2.5,PH-2.5);
   if(corre){/* pase al espacio: al lugar adonde corre, sin meterse donde llega primero el arquero */
    const lim=MATH.min(this.ax(e,q.corrida.x),PW-15);if(this.ax(e,tx)>lim){const k=(lim-this.ax(e,q.x))/MATH.max(.1,this.ax(e,tx)-this.ax(e,q.x));tx=q.x+(tx-q.x)*clamp(k,0,1);ty=q.y+(ty-q.y)*clamp(k,0,1)}}
   const tax=this.ax(e,tx),tay=this.ay(e,ty);
   if(V(tax,tay)*(alto?.8:1)<cota-.01)continue;            // poda: ni sin riesgo superaría lo mejor
   const r=this.riesgoPase(j,tx,ty,vavg,alto,q),pq=this.presion(e,tx,ty);if(!alto)rRaso=r;
   const mx=this.ax(e,(j.x+tx)/2),my=this.ay(e,(j.y+ty)/2);
   const habil=alto?(a.paseLargo+(tax>PW-AREA_X?a.centros:a.paseLargo))/2:(d0<25?a.paseCorto:a.paseLargo);
   const fallo=clamp(.01+(100-habil)*.0012+(alto?.2+d0*.002:0)+d0*.001,0,.6);
   const exito=(1-r)*(1-fallo);
   let u=exito*V(tax,tay)*(1-.25*pq.p)*(alto?.62:1)-(1-exito)*V(PW-mx,PH-my)*pesoPerder;
   const prog=tax-ax;
   u+=avance*MATH.max(0,prog)/20*exito;
   if(T.posesion&&d0<22&&!alto)u+=.008*exito;                                       // posesión: pase corto seguro
   if(salida){if(pr.dmin>6&&T.directo<.6){if(!alto&&d0<30)u+=.006*exito;else if(alto)u-=.012}  // salida desde el fondo
    else if(alto&&prog>15)u+=.014*(.5+T.directo)}                                   // presionado o directo: pelotazo
   if(alto&&prog>20)u+=T.directo*.012;
   if(MATH.abs(ty-j.y)>28&&pr.p>.4&&pq.p<.3)u+=.006*(1+T.W*.5)*exito;                       // cambio de frente
   if(q.pared&&q.pared.hasta>this.t&&j.recibioDe===q)u+=.012*exito;                // pared: devolverla al que picó
   if(q.corrida&&q.corrida.hasta>this.t)u+=(tax>offs?.022:.008)*exito;             // pase al que pica al espacio (a la espalda de la defensa vale más)
   u-=CAL.costoPase;
   opts.push({u,tipo:'pase',q,tx,ty,alto,vh,vz,d:d0,r});if(u>cota)cota=u
  }
 }
 /* centro: desde la banda en el último cuarto, a la cabeza de un compañero que está en el área */
 if(!saque&&!j.manos&&ax>70&&MATH.abs(ay-34)>13){
  let mejor=null,mv=-1e9;
  for(const q of this.eq[e]){if(q===j||q.gk)continue;const qax=this.ax(e,q.x),qay=this.ay(e,q.y);if(qax<PW-AREA_X||MATH.abs(qay-34)>11)continue;
   let marca=99;for(const o of this.eq[1-e]){const d=hyp(o.x-q.x,o.y-q.y);if(d<marca)marca=d}
   const v=cabeceador(q)/70*(.6+.1*MATH.min(marca,4))-MATH.abs(qay-34)*.01;if(v>mv){mv=v;mejor=q}}
  if(mejor){const pc=clamp(.22*mv*(a.centros/70),.05,.45);const u=pc*.13*CAL.centro-(1-pc)*.012;
   const qx=this.wx(e,clamp(this.ax(e,mejor.x)+1,PW-15,PW-4)),qy=mejor.y;opts.push({u,tipo:'centro',q:mejor,tx:qx,ty:qy})}
 }
 /* despeje: en campo propio y apretado, la revienta lejos (hacia adelante y a un costado) */
 if(!saque&&!j.manos&&ax<30&&pr.dmin<4){
  const lado=ay<34?-1:1,dax=MATH.min(PW-25,ax+45),day=clamp(ay+lado*14,6,PH-6);
  const u=.4*V(dax,day)-.5*V(PW-dax,PH-day)-.004*(pr.dmin)+ .02*MATH.max(0,(30-ax)/30)*(1+pr.p);
  opts.push({u,tipo:'despeje',tx:this.wx(e,dax),ty:this.wy(e,day)});
 }
 if(!opts.length)return null;
 let best=null,bu=-1e9;
 for(const o of opts){const u=o.u+R.g()*ruido;if(u>bu){bu=u;best=o}}
 return best;
};
P.actuar=function(j){
 const B=this.B,R=this.R,e=j.eq;
 /* forzar a soltarla si la tiene demasiado tiempo */
 const forzar=j.conPelota>150;
 if(this.t<j.prox&&!forzar)return;
 let op=this.decidir(j);
 if(forzar&&op&&op.tipo!=='pase'&&op.tipo!=='tiro'){op=null}
 if(!op){ // nada razonable: pelotazo hacia adelante
  const d=this.dir(e);op={tipo:'pase',q:null,tx:clamp(j.x+d*35,1,PW-1),ty:clamp(j.y+(R()-.5)*20,1,PH-1),alto:true,vh:20,d:35}}
 this.saqueAnterior=j.saque;j.saque=null;
 const Q=this.tac[e].Q,reac=clamp(MATH.round(3-(j.a.reacciones-50)/30-Q),1,5);
 if(op.tipo==='conducir'){j.accion={tipo:'conducir',dx:op.dx,dy:op.dy,vel:op.vel};const pr=this.presion(e,j.x,j.y);j.prox=this.t+reac+(pr.dmin>5?3:pr.dmin>3?1:0);return}
 if(op.tipo==='gambeta'){
  this.st.gambetas[e]++;j.s.gambetas++;const D=op.D,ok=R()<op.ps;
  this.ev('gambeta',e,j,{rival:D.nombre,ok});
  if(ok){this.st.gambetasOk[e]++;D.superado=14;D.cdEntrada=16;j.ultGambeta=this.t;
   const d=this.dir(e),c=MATH.cos(op.s*.7),s=MATH.sin(op.s*.7);j.accion={tipo:'gambeta',dx:d*c,dy:d*s,vel:this.energiaVmax(j)*.95};j.prox=this.t+8;
   /* falta táctica: lo agarra para cortar el ataque (más si era un contraataque o se iba al arco) */
   const tr=this.trans[e],contra=tr&&tr.tipo==='contra'&&tr.hasta>this.t,peligro=this.ax(e,j.x)>55;
   if(!this.enAreaRival(e,j.x,j.y)&&R()<(contra?.26:peligro?.1:.03)*(.6+D.a.inteligencia/150))this.contacto(D,j,{tactica:true,vel:2,exito:false})}   // en el área no: sería penal
  else{
   const rel=hyp(D.vx-j.vx,D.vy-j.vy);
   if(this.contacto(D,j,{porDetras:false,vel:rel,exito:true}))return;
   this.st.quites[D.eq]++;D.s.quites++;this.ev('quite',D.eq,D,{a:j.nombre});
   if(R()<.55){this.tomar(D,false)}else{B.dueno=null;this.desviar(D,3,7,0,.5);D.cdToque=2;j.cdToque=6}
   j.cdEntrada=10}
  return}
 if(op.tipo==='tiro'){this.remate(j,false,op.xg);return}
 if(op.tipo==='centro'){this.st.centros[e]++;this.centroA(j,op.tx,op.ty,op.q);this.marcarOffside(j,null);return}
 if(op.tipo==='despeje'){this.st.despejes[e]++;this.pasar(j,{tipo:'pase',q:null,tx:op.tx,ty:op.ty,alto:true,d:hyp(op.tx-j.x,op.ty-j.y),despeje:true});return}
 this.pasar(j,op);
};
P.pasar=function(j,op){
 const B=this.B,R=this.R,e=j.eq,a=j.a,pr=this.presion(e,j.x,j.y);
 const dx=op.tx-j.x,dy=op.ty-j.y,d=hyp(dx,dy)||1;
 const tax=this.ax(e,op.tx);
 const habil=j.saque==='lateral'?a.paseCorto:op.alto?(tax>PW-AREA_X?a.centros:a.paseLargo):(d<25?a.paseCorto:a.paseLargo);
 const sig=(.02+(100-habil)*.0012)*(1+pr.p*1.2)*(op.alto?1.3:1)*this.conf[e];
 const an=MATH.atan2(dy,dx)+R.g()*sig,ld=d*(1+R.g()*(.04+(100-habil)*.0008));
 B.dueno=null;B.tipo='pase';B.desde=j;B.destino=op.q;B.ultimo=j;B.tiro=null;B.z=op.alto?.1:0;B.tPateo=this.t;B.altoSale=!!op.alto;B.despeje=!!op.despeje;B.centro=false;
 /* por arriba se apunta un poco antes: el pique la lleva al receptor */
 if(op.alto){const la=j.saque==='lateral'?ld:ld*.92,vh0=j.saque==='lateral'?clamp(la/1.1,6,13):clamp(la/1.9,7,18),T=la/vh0,vh=vAire(la,T);B.vx=MATH.cos(an)*vh;B.vy=MATH.sin(an)*vh;B.vz=G*T/2;
  if(j.saque==='lateral'){B.z=2;B.vz=MATH.max(0,(G*T*T/2-2)/T)}}
 else{const v0=this.velPaseRaso(ld);B.vx=MATH.cos(an)*v0;B.vy=MATH.sin(an)*v0;B.vz=0}
 B.x=j.x+MATH.cos(an)*.4;B.y=j.y+MATH.sin(an)*.4;
 j.cdToque=4;j.accion=null;j.manos=false;
 if(!op.despeje){this.st.pases[e]++;j.s.pases++;if(op.alto)this.st.pasesAltos[e]++}
 const prog=this.ax(e,op.tx)-this.ax(e,j.x);
 if(op.alto&&!op.despeje&&d>30&&prog>15)this.st.pelotazos[e]++;   // un despeje no es un pelotazo
 if(MATH.abs(op.ty-j.y)>30&&MATH.abs(op.ty-j.y)>MATH.abs(prog))this.st.cambiosFrente[e]++;
 /* pared: después de un pase corto, el que pasó pica al espacio para recibirla de vuelta */
 if(op.q&&!op.alto&&d<18&&prog>-3&&pr.dmin<5&&!j.gk&&this.R()<.5){const g=this.dir(e);
  j.pared={x:clamp(j.x+g*10,1,PW-1),y:clamp(j.y+(op.ty-j.y)*.3,2,PH-2),hasta:this.t+25,t0:this.t}}
 if(op.q){op.q.recibir={x:op.tx,y:op.ty,hasta:this.t+40}}
 this.marcarOffside(j,this.saqueAnterior);this.saqueAnterior=null;
 const evp=this.ev('pase',e,j,{receptor:op.q?op.q.nombre:null,rid:op.q?op.q.id:null,alto:!!op.alto,dist:+d.toFixed(1)});
 /* el que venía a presionar llega tarde y se lo lleva puesto */
 for(const o of this.eq[1-e]){if(o.gk||o.urg<.9)continue;const dd=hyp(o.x-j.x,o.y-j.y);if(dd>1.2)continue;
  const rel=hyp(o.vx-j.vx,o.vy-j.vy);if(this.R()<.045+MATH.max(0,rel-4)*.02){this.contacto(o,j,{tarde:true,vel:rel,exito:false});break}}
};
/* de dónde sale el remate (para saber el origen de cada gol) */
P.contextoRemate=function(j,cabeza,libre,dg){
 const e=j.eq,t=this.t,tr=this.trans[e],r=j.ultRecibo&&t-j.ultRecibo.t<35?j.ultRecibo:null,prevRem=this.ultRemate[e];
 this.ultRemate[e]=t;
 let o='area';
 if(libre)o='tirolibre';
 else if(this.ultCorner&&this.ultCorner.e===e&&t-this.ultCorner.t<100)o='corner';
 else if(prevRem!=null&&t-prevRem<45)o='rebote';
 else if(cabeza)o=r&&r.centro?'centro':'cabezazo';
 else if(r&&r.centro)o='centro';
 else if(tr&&tr.tipo==='contra'&&tr.hasta>t)o='contra';
 else if(r&&r.filtrado)o='filtrado';
 else if(j.ultGambeta&&t-j.ultGambeta<40)o='individual';
 else if(dg>=16.5)o='afuera';
 return{origen:o};
};
P.remate=function(j,cabeza,xg0,ext){
 ext=ext||{};
 const B=this.B,R=this.R,e=j.eq,a=j.a,gk=this.eq[1-e][0];
 const ax=this.ax(e,j.x),ay=this.ay(e,j.y),dg=hyp(PW-ax,34-ay),pr=this.presion(e,j.x,j.y);
 const xg=xgDe(ax,ay)*(cabeza?.55:1);
 /* apunta al palo más lejano del arquero */
 const gay=this.ay(e,gk.y),lado=gay>34?-1:1,y0=34+lado*(1.2+R()*2.1);
 const habil=cabeza?a.cabeceo:(dg<16?(a.definicion+a.tiro)/2:a.tiro);
 const sig=(CAL.punteria+(100-habil)*.0025)*(1+.6*pr.p)*(cabeza?1.6:1)*this.conf[e];   // calibrado: ~35-40 % de los remates van al arco
 const ang=MATH.atan2(y0-ay,PW-ax)+R.g()*sig;
 const vh=cabeza?10+R()*5+(a.cabeceo-60)*.05:ext.libre?20+a.potencia*.06+R()*3:(16+a.potencia*.13)*(dg<10?.85:1)*(1-R()*.15);
 const T=(PW-ax)/MATH.max(.2,MATH.cos(ang))/vh;
 let zt=clamp(.25+R()*1.5+R.g()*(.3+dg*.03)*(1.3-habil/100),-.5,6);
 if(ext.libre){zt=clamp(1.5+R()*.8+R.g()*(.25+(100-a.tiro)*.008),.3,4)}   // por arriba de la barrera, abajo del travesaño
 const ex=this.dir(e);
 B.dueno=null;B.tipo='tiro';B.desde=null;B.destino=null;B.ultimo=j;
 B.vx=ex*MATH.cos(ang)*vh;B.vy=ex*MATH.sin(ang)*vh;B.vz=MATH.max(0,(zt+.5*G*T*T)/T)-(cabeza?2:0);B.z=cabeza?MATH.max(B.z,1.5):.1;
 /* ¿va al arco? (proyección sin desvíos) */
 const yg=ay+MATH.tan(ang)*(PW-ax),zg=B.z+B.vz*T-.5*G*T*T;
 const aPuerta=yg>GY0+BR&&yg<GY1-BR&&zg<GH-BR&&zg>-1;
 B.tiro={j,t0:this.t,xg,aPuerta,vistos:new Set(),gkVisto:false,bloqueado:false,libre:!!ext.libre,ctx:this.contextoRemate(j,!!cabeza,!!ext.libre,dg)};B.ultTiro=B.tiro;
 this.marcarOffside(j,null);
 this.st.remates[e]++;j.s.remates++;this.st.xg[e]+=xg;if(aPuerta)this.st.alArco[e]++;
 j.cdToque=5;j.accion=null;
 this.ev('remate',e,j,{aPuerta,cabeza:!!cabeza,xg:+xg.toFixed(3),dist:+dg.toFixed(1),arquero:gk.nombre,tiroLibre:!!ext.libre});
};

/* ---------- entradas ---------- */
P.entradas=function(){
 const B=this.B,c=B.dueno,R=this.R;if(!c||c.manos)return;
 for(const o of this.eq[1-c.eq]){
  if(o.gk&&!this.enArea(o))continue;
  if(o.cdEntrada>0||o.superado>0)continue;
  const d=hyp(o.x-c.x,o.y-c.y);if(d>1.4)continue;
  const Pz=this.tac[o.eq].Pz;if(R()>(d<1?.16:.07)*(1+.6*Pz))continue;   // con presión alta van más a quitar
  o.cdEntrada=8;
  const g=this.dir(c.eq),frente=(o.x-c.x)*g>0;
  const sp=hyp(c.vx,c.vy),porDetras=sp>2&&((o.x-c.x)*c.vx+(o.y-c.y)*c.vy)<0,rel=hyp(o.vx-c.vx,o.vy-c.vy);
  const p=clamp(.36+(o.a.entradas-(c.a.regate+c.a.equilibrio)/2)*.008+(c.conPelota<4?.08:0)+(frente?.1:0)-(c.accion&&c.accion.tipo==='gambeta'?.1:0),.08,.85);
  const gana=R()<p;
  if(this.contacto(o,c,{porDetras,vel:rel,exito:gana&&!porDetras}))return;
  if(gana){this.st.quites[o.eq]++;o.s.quites++;this.ev('quite',o.eq,o,{a:c.nombre});
   if(R()<.6)this.tomar(o,o.gk);else{B.dueno=null;this.desviar(o,3,7,0,.5);o.cdToque=2;c.cdToque=6}
   c.cdEntrada=10;return}
  o.cdEntrada=o.gk?6:14;return;
 }
};

/* ---------- movimiento sin pelota: forma de equipo, roles, presión y transiciones ---------- */
/* equipo con la pelota (o que la jugó último con un pase); -1 si nadie la controla */
P.posEqActual=function(){const B=this.B;if(B.dueno)return B.dueno.eq;if(this.estado==='parado'&&this.rean)return this.rean.e;
 if(B.tipo==='pase'&&B.desde)return B.desde.eq;return -1};
/* los dos rivales más retrasados (los centrales que tiene que fijar el 9), en coordenadas de e */
P.centralesRivales=function(e){let a=null,b=null,xa=1e9,xb=1e9;
 for(const o of this.eq[1-e]){if(o.gk)continue;const x=this.ax(e,o.x),d=PW-x;if(d<xa){b=a;xb=xa;a=o;xa=d}else if(d<xb){b=o;xb=d}}
 return a&&b?(this.ay(e,a.y)+this.ay(e,b.y))/2:34};
P.objetivos=function(){
 const B=this.B,c=B.dueno,pe=this.posEqActual();
 for(let e=0;e<2;e++)this.forma(e,pe);
 if(this.estado==='juego'){
  for(let e=0;e<2;e++){if(c&&c.eq!==e)this.defensa(e,c);else if(c&&c.eq===e)this.ataque(e,c)}
  this.aplicarOrdenes();
  if(!c)this.pelotaSuelta();
 }
 /* arquero ante un remate: se tira hacia la trayectoria */
 if(B.tiro){const e=1-B.tiro.j.eq,gk=this.eq[e][0],sp=hyp(B.vx,B.vy);
  if(sp>1&&MATH.abs(B.vx)>.1){const t=(gk.x-B.x)/B.vx;if(t>0){gk.tx=gk.x;gk.ty=clamp(B.y+B.vy*t,GY0-1.5,GY1+1.5);gk.urg=1;gk.tiroTarget=true}}}
 /* en reanudaciones: el ejecutor va al lugar; en el saque del medio, cada uno en su campo */
 if(this.estado==='parado'&&this.rean){const r=this.rean;
  if(r.tipo==='saque_centro'){for(const j of this.A){const mio=j.eq===r.e;const ax=j.gk?3:MATH.min(j.bx*.85,mio?50:42);j.tx=this.wx(j.eq,ax);j.ty=this.wy(j.eq,j.by);j.urg=.5}
   r.ej.tx=r.x-this.dir(r.e)*.5;r.ej.ty=r.y;r.ej.urg=1}
  else this.posicionesParado(false)}
};
/* forma del equipo: tres líneas a distancia real, corta y angosta sin pelota, larga y ancha con pelota,
   corrida hacia el lado de la pelota sin abandonar el otro */
P.forma=function(e,pe){
 const B=this.B,T=this.tac[e],L=this.eq[e],c=B.dueno,con=pe===e,sin=pe===1-e;
 let bax=this.ax(e,B.x),bay=this.ay(e,B.y);
 /* pelota en una esquina o contra la raya (córner, lateral): la forma toma un punto más adentro (las pelotas paradas son de la etapa 3) */
 if(this.estado==='parado'&&this.rean&&this.rean.tipo!=='saque_centro'){bax=clamp(bax,12,88);bay=34+(bay-34)*.45}
 const tr=this.trans[e],enTrans=tr&&tr.hasta>this.t?tr.tipo:null,offs=this.lineaOffside(e);
 let linea,largo,ancho,s;
 if(con){linea=clamp(bax-30+T.M*4,17+T.D*3,50+T.M*8);largo=42+T.M*5;ancho=52+T.W*8;s=.2}
 else{
  linea=clamp(bax-(24-T.D*4),16+T.D*6,42+T.D*12);largo=27+T.D*3;ancho=38+T.W*3;s=.38;
  /* si el rival tiene la pelota libre y de frente, la línea retrocede unos metros */
  if(sin&&c){const pr=this.presion(c.eq,c.x,c.y);if(pr.dmin>4&&this.ax(c.eq,c.x)>35)linea-=4}
  linea=MATH.max(3,MATH.min(linea,bax-1.5));                 // nunca delante de la pelota
 }
 this.lin[e]=linea;
 /* laterales que pasan al ataque: el del lado de la pelota (los dos si la mentalidad es alta) */
 const lado=bay>34?1:-1,sube={'-1':false,'1':false};
 if(con&&T.M>-.4&&T.style!=='Defensivo'&&bax>30)for(const j of L)if(j.rol==='LI'||j.rol==='LD'){const sd=j.uy<0?-1:1;if(sd===lado||T.M>.4)sube[sd]=true}
 const subio=sube['-1']?-1:sube['1']?1:0,ambos=sube['-1']&&sube['1'];
 const yc=con?this.centralesRivales(e):34;
 for(const j of L){
  if(j===c)continue;
  let ax,ay,urg=.42;
  if(j.gk){
   if(con&&bax<45){ax=clamp(bax*.22,4,11);ay=34+(bay-34)*.15}                       // arquero que juega con los pies: se ofrece atrás
   else if(con){ax=clamp(linea*.3,5,15);ay=34+(bay-34)*.1}                            // arquero adelantado, detrás de su línea (hasta el borde del área)
   else{const dgo=hyp(bax,bay-34)||1,dd=clamp(dgo*.1,.8,5.5);ax=bax/dgo*dd;ay=clamp(34+(bay-34)/dgo*dd,GY0-.3,GY1+.3)}
  }else{
   const sd=j.uy<0?-1:1;
   ax=linea+(con&&j.rel<.5?j.rel*(j.rol==='MCD'?1.15:1.4):j.rel)*largo;ay=34+j.uy*(ancho/2)+(bay-34)*s;   // con pelota los volantes se adelantan
   if(con){
    switch(j.rol){
     case 'LI':case 'LD':
      if(sube[sd]){ax=linea+largo*(.55+.15*T.M);ay=34+sd*(ancho/2+2)}
      else if(subio){ay=34+j.uy*(ancho/2)*.55+(bay-34)*s;ax=linea}                   // el otro lateral se cierra
      break;
     case 'MCD':
      if(subio&&!ambos){ax=linea+3;ay=34+subio*9}                                     // cubre la espalda del lateral
      else if(ambos){ax=linea+1;ay=34}                                                // baja entre los centrales
      else{ax=MATH.min(linea+largo*.22,bax-5);ay=34+(bay-34)*.25}
      break;
     case 'EI':case 'ED':
      if(T.W>=-.2&&!sube[sd])ay=34+sd*(ancho/2);else ay=34+sd*ancho*.26;            // abierto o por dentro
      if(bax>40)ax=offs-2;
      break;
     case 'DC':ax=offs-.8;ay=yc+(bay-34)*.1;break;                                   // el 9 fija a los centrales
     case 'MCO':{ax=offs-9;let mejor=34,md=-1;                                       // enganche entre líneas, donde hay espacio
      for(const dy of [-9,0,9]){const y=34+dy+(bay-34)*.3,wx=this.wx(e,ax),wy=this.wy(e,y);const d=this.presion(e,wx,wy).dmin;if(d>md){md=d;mejor=y}}
      ay=mejor;break}
    }
    if((this.t+j.id*7)%40===0)j.desfase=this.R.g()*CAL.desfase*(1.35-j.a.anticipacion/100);
    ax=MATH.min(ax,offs-.7+j.desfase);
    if(enTrans==='contra'&&j.linea==='atq'){ax=offs-.7;urg=.95}
   }else if(sin){
    if(j.rol==='MCD'){ax=linea+7;ay=34+(bay-34)*.5}                                   // el volante central protege a la defensa
    if(enTrans==='repliegue')urg=.9;
   }
   ax=clamp(ax,3,PW-2);ay=clamp(ay,2,PH-2);
  }
  if(j.corrida&&j.corrida.hasta>this.t&&con){j.tx=j.corrida.x;j.ty=j.corrida.y;j.urg=.95;continue}
  if(j.pared&&j.pared.hasta>this.t&&con){j.tx=j.pared.x;j.ty=j.pared.y;j.urg=.9;continue}
  j.tx=this.wx(e,ax);j.ty=this.wy(e,ay);
  const dd=hyp(j.tx-j.x,j.ty-j.y);j.urg=MATH.max(urg,dd>10?.7:urg);
  if(j.gk&&!con&&dd>2.5)j.urg=1;   // el arquero fuera de lugar vuelve corriendo
 }
};
/* con la pelota: apoyos cerca del que la tiene y desmarques al espacio */
P.ataque=function(e,c){
 const T=this.tac[e],L=this.eq[e],offs=this.lineaOffside(e),cax=this.ax(e,c.x),pr=this.presion(e,c.x,c.y),tr=this.trans[e];
 const contra=tr&&tr.tipo==='contra'&&tr.hasta>this.t;
 /* apoyos: los dos compañeros más cercanos se ofrecen en un ángulo libre a 9-13 m */
 const cerca=L.filter(j=>!j.gk&&j!==c&&!(j.corrida&&j.corrida.hasta>this.t)&&j.rol!=='DC').map(j=>[hyp(j.x-c.x,j.y-c.y),j]).sort((a,b)=>a[0]-b[0]||a[1].id-b[1].id);
 for(let k=0;k<2&&k<cerca.length;k++){
  const j=cerca[k][1];
  if(!j.apoyo||j.apoyo.c!==c||this.t-j.apoyo.t>=5){
   let best=null,bv=-1e9;
   for(const an of [0,.7,-.7,1.4,-1.4,2.3,-2.3]){
    const r=k===0?9:13,pax=cax+MATH.cos(an)*r,pay=this.ay(e,c.y)+MATH.sin(an)*r;
    if(pax<3||pax>MATH.min(PW-3,offs-.5)||pay<2||pay>PH-2)continue;
    const wx=this.wx(e,pax),wy=this.wy(e,pay);let dmin=99,lin=99;
    for(const o of this.eq[1-e]){const d=hyp(o.x-wx,o.y-wy);if(d<dmin)dmin=d;
     const dx=wx-c.x,dy=wy-c.y,L2=dx*dx+dy*dy,s=clamp(((o.x-c.x)*dx+(o.y-c.y)*dy)/L2,0,1),l=hyp(o.x-(c.x+s*dx),o.y-(c.y+s*dy));if(l<lin)lin=l}
    const v=MATH.min(dmin,8)+MATH.min(lin,4)*1.5+MATH.cos(an)*1.2-hyp(wx-j.x,wy-j.y)*.08;
    if(v>bv){bv=v;best=[wx,wy]}
   }
   j.apoyo=best?{c,t:this.t,x:best[0],y:best[1]}:null;
  }
  if(j.apoyo){j.tx=j.apoyo.x;j.ty=j.apoyo.y;j.urg=.7}
 }
 /* desmarque al espacio: si el que la tiene está libre, un atacante pica a la espalda de la defensa */
 if(pr.dmin>3&&cax>28&&!c.manos){
  let activo=false;for(const j of L)if(j.corrida&&j.corrida.hasta>this.t)activo=true;
  if(!activo){
   const pp=.012*(1+T.M*.5)*(contra?2.5:1)*(1+T.directo*.5);
   for(const j of L){
    if(j.gk||j===c||!(j.linea==='atq'||j.rol==='MCO'||j.rol==='MC'))continue;
    const jax=this.ax(e,j.x);if(jax<cax||offs-jax>5||offs>PW-8)continue;
    if(this.R()<pp){const tax=MATH.min(PW-6,offs+10+this.R()*6),tay=34+(this.ay(e,j.y)-34)*.6;
     j.corrida={x:this.wx(e,tax),y:this.wy(e,tay),hasta:this.t+30};this.st.desmarques[e]++;break}
   }
  }
 }
};
/* sin la pelota: uno presiona, otro cubre, el resto cierra líneas de pase; la línea queda alineada */
P.defensa=function(e,c){
 const T=this.tac[e],L=this.eq[e],g=this.dir(e),gx=g>0?0:PW,cax=this.ax(e,c.x),tr=this.trans[e];
 const contrap=tr&&tr.tipo==='presion'&&tr.hasta>this.t,repl=tr&&tr.tipo==='repliegue'&&tr.hasta>this.t;
 const presiona=contrap||cax>T.umbralPresion||cax<33;
 const o=L.filter(j=>!j.gk).map(j=>[hyp(j.x-c.x,j.y-c.y)/this.energiaVmax(j),j]).sort((a,b)=>a[0]-b[0]||a[1].id-b[1].id);
 const usados=new Set();
 const p1=o[0]&&o[0][1],p2=o[1]&&o[1][1];
 const hacia=(j,k,d)=>{const dx=gx-c.x,dy=34-c.y,n=hyp(dx,dy)||1;j.tx=c.x+dx/n*d;j.ty=c.y+dy/n*d+(34-c.y)*k};
 if(p1){usados.add(p1);if(presiona){hacia(p1,0,.7);p1.urg=.9+.1*MATH.max(0,T.Pz)}else{hacia(p1,0,4);p1.urg=.75}}
 if(p2){usados.add(p2);if(contrap){p2.tx=c.x+(c.y<34?1:-1)*.0;p2.ty=c.y+(c.y<34?1.5:-1.5);p2.urg=1}else{hacia(p2,.15,5);p2.urg=.85}}
 if(contrap&&o[2]){const j=o[2][1];usados.add(j);hacia(j,.1,5);j.urg=.95}
 /* cerca del área, un tercero cierra el camino al arco */
 if(this.ax(c.eq,c.x)>68){const j=o.find(x=>!usados.has(x[1]));if(j){usados.add(j[1]);hacia(j[1],0,2.5);j[1].urg=.95}}
 /* cerrar líneas de pase hacia los receptores más cercanos */
 if(presiona){
  const recep=this.eq[1-e].filter(r=>!r.gk&&r!==c).map(r=>[hyp(r.x-c.x,r.y-c.y),r]).filter(x=>x[0]<28).sort((a,b)=>a[0]-b[0]||a[1].id-b[1].id).slice(0,3);
  for(const [,r] of recep){
   const lx=r.x+(c.x-r.x)*.3,ly=r.y+(c.y-r.y)*.3;let best=null,bd=14;
   for(const j of L){if(j.gk||usados.has(j)||j.linea==='def')continue;const d=hyp(j.tx-lx,j.ty-ly);if(d<bd){bd=d;best=j}}
   if(best){usados.add(best);best.tx=lx;best.ty=ly;best.urg=.8}
  }
 }
 /* defensores: línea alineada (trampa de offside), corridos hacia el rival de su zona */
 const lin=this.lin[e];
 for(const j of L){
  if(j.gk||usados.has(j)||j.linea!=='def')continue;
  let ax=lin-(j.rol==='DFC'?0:.5),ay=this.ay(e,j.ty);
  let near=null,nd=11;for(const r of this.eq[1-e]){if(r.gk)continue;const ry=this.ay(e,r.y),rx=this.ax(e,r.x);const d=MATH.abs(ry-ay);if(d<nd&&rx<lin+18){nd=d;near=r}}
  if(near){const rx=this.ax(e,near.x),ry=this.ay(e,near.y);ay=ay+(ry-ay)*.5;
   if(rx<AREA_X+9&&(rx<lin+2||this.ax(e,c.x)<36)){ax=rx-1.2;ay=ry+(34-ry)*.15}}                     // cerca del área: lo toma del lado del arco
  j.tx=this.wx(e,clamp(ax,2,PW-2));j.ty=this.wy(e,clamp(ay,2,PH-2));if(repl)j.urg=.9;
 }
 /* volantes libres: marcan al rival que entra en su zona */
 for(const r of this.eq[1-e]){
  if(r.gk||r===c)continue;const rax=this.ax(e,r.x);if(rax>lin+22||rax<lin)continue;
  let best=null,bd=10;for(const j of L){if(j.gk||usados.has(j)||j.linea==='def'||j._marca===this.t)continue;const d=hyp(j.tx-r.x,j.ty-r.y);if(d<bd){bd=d;best=j}}
  if(!best)continue;best._marca=this.t;const dx=gx-r.x,dy=34-r.y,d=hyp(dx,dy)||1;best.tx=r.x+dx/d*1.8;best.ty=r.y+dy/d*1.8;best.urg=MATH.max(best.urg,.75);
 }
 /* el arquero achica si el rival entra al área de frente */
 const gk=L[0],cax2=this.ax(c.eq,c.x),cay=this.ay(c.eq,c.y),dg=hyp(PW-cax2,34-cay);
 if(dg<14&&cay>AREA_Y0+4&&cay<AREA_Y1-4){const dx=c.x-gx,dy=c.y-34,d=hyp(dx,dy)||1,k=MATH.max(1,d-2.2);gk.tx=gx+dx/d*k;gk.ty=34+dy/d*k;gk.urg=1}
};
/* pelota suelta: el más cercano de cada equipo va a buscarla; el destinatario del pase, al punto */
P.pelotaSuelta=function(){
 const B=this.B,px=B.x+B.vx*.6,py=B.y+B.vy*.6;
 for(let e=0;e<2;e++){
  const L=this.eq[e];let best=null,bt=1e9;
  for(const j of L){if(j.gk&&!(this.enArea(j)&&hyp(j.x-B.x,j.y-B.y)<12))continue;const t=hyp(j.x-px,j.y-py)/this.energiaVmax(j);if(t<bt){bt=t;best=j}}
  const dest=B.tipo==='pase'&&B.destino&&B.destino.eq===e?B.destino:null;
  if(dest&&dest.recibir&&dest.recibir.hasta>this.t){
   const sp=hyp(B.vx,B.vy);if(sp>1){const ux=B.vx/sp,uy=B.vy/sp,s=MATH.max(0,(dest.x-B.x)*ux+(dest.y-B.y)*uy);dest.tx=B.x+ux*s;dest.ty=B.y+uy*s;
    if(B.z>1.2){dest.tx=dest.recibir.x;dest.ty=dest.recibir.y}}
   else{dest.tx=B.x;dest.ty=B.y}
   dest.urg=1;
   if(best&&best!==dest&&bt<=.6){best.tx=px;best.ty=py;best.urg=1}
  }else if(best){best.tx=px;best.ty=py;best.urg=1}
 }
};
P.mover=function(){
 const B=this.B,c=B.dueno;
 for(const j of this.A){
  let dvx,dvy;const vm=this.energiaVmax(j);
  if(j===c){
   if(j.manos){dvx=0;dvy=0}
   else if(j.accion){dvx=j.accion.dx*j.accion.vel;dvy=j.accion.dy*j.accion.vel}
   else{dvx=0;dvy=0}
  }else{
   const dx=j.tx-j.x,dy=j.ty-j.y,d=hyp(dx,dy);
   if(d<.25){dvx=0;dvy=0}else{const sp=j.urg>=.9?MATH.min(vm*j.urg,d*1.4):MATH.min(vm*j.urg,MATH.max(0,d-.8)*.7);dvx=dx/d*sp;dvy=dy/d*sp}
  }
  let ac=j.acc*DT*(j.gk&&j.tiroTarget?2.5:1);
  let ax=dvx-j.vx,ay=dvy-j.vy;const m=hyp(ax,ay);if(m>ac){ax*=ac/m;ay*=ac/m}
  j.vx+=ax;j.vy+=ay;
  let sp=hyp(j.vx,j.vy);const lim=vm*(j.gk&&j.tiroTarget?1.25:1);if(sp>lim){j.vx*=lim/sp;j.vy*=lim/sp;sp=lim}
  j.x+=j.vx*DT;j.y+=j.vy*DT;j.tiroTarget=false;
  j.x=clamp(j.x,-3,PW+3);j.y=clamp(j.y,-3,PH+3);
  j.s.distancia+=sp*DT;
  const r=sp/j.vmax;j.energia=clamp(j.energia-DT*(.00012+.0011*r*r*r)*(1.5-j.a.resistencia/100)*this.conf[j.eq]+(sp<2?DT*.0003:0),.3,1);
  if(j.cdToque>0)j.cdToque--;if(j.cdEntrada>0)j.cdEntrada--;if(j.superado>0)j.superado--;
 }
 /* choques: nadie atraviesa a nadie */
 const J=this.A,n=J.length;
 for(let i=0;i<n;i++){const a=J[i];for(let k=i+1;k<n;k++){const b=J[k];const dx=b.x-a.x,dy=b.y-a.y;if(dx>.8||dx<-.8||dy>.8||dy<-.8)continue;
  const d=hyp(dx,dy);if(d>=.8||d===0)continue;const nx=dx/d,ny=dy/d,o=(.8-d)/2;
  /* el más fuerte empuja más */
  const fa=a.a.fuerza+a.a.equilibrio,fb=b.a.fuerza+b.a.equilibrio,wa=fb/(fa+fb),wb=1-wa;
  a.x-=nx*o*2*wa;a.y-=ny*o*2*wa;b.x+=nx*o*2*wb;b.y+=ny*o*2*wb;
  const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){a.vx+=nx*rv*wa;a.vy+=ny*rv*wa;b.vx-=nx*rv*wb;b.vy-=ny*rv*wb}}}
 if(c){
  /* la pelota va pegada al pie, medio metro adelante */
  c.conPelota++;
  const sp=hyp(c.vx,c.vy);let ux,uy;if(sp>.3){ux=c.vx/sp;uy=c.vy/sp}else{ux=this.dir(c.eq);uy=0}
  if(c.manos){B.x=c.x;B.y=c.y;B.z=1}else{B.x=c.x+ux*.5;B.y=c.y+uy*.5;B.z=0}
  B.vx=c.vx;B.vy=c.vy;B.vz=0;
  /* cerca de la raya el que la lleva frena y vuelve a decidir: no se la lleva afuera */
  if(!c.manos){const m=1.1;let toco=false;
   if(c.x<m&&c.vx<0||c.x>PW-m&&c.vx>0){c.vx=0;toco=true}if(c.y<m&&c.vy<0||c.y>PH-m&&c.vy>0){c.vy=0;toco=true}
   if(c.x<.6||c.x>PW-.6||c.y<.6||c.y>PH-.6){c.x=clamp(c.x,.6,PW-.6);c.y=clamp(c.y,.6,PH-.6);toco=true}
   if(toco){if(c.accion){c.accion=null;c.prox=MATH.min(c.prox,this.t+1)}
    const sp2=hyp(c.vx,c.vy);let ux2=-this.dir(c.eq)*0,uy2=0;if(sp2>.3){ux2=c.vx/sp2;uy2=c.vy/sp2}
    B.x=clamp(c.x+ux2*.5,.2,PW-.2);B.y=clamp(c.y+uy2*.5,.2,PH-.2);B.vx=c.vx;B.vy=c.vy}
  }
 }
};

/* =================== ETAPA 3 · REGLAS Y PELOTA PARADA =================== */
P.activos=function(){this.A=this.eq[0].concat(this.eq[1])};
P.minAbs=function(){return(this.parte===1?0:45)+this.tParte/TPS/60};
P.toW=function(e,ax,ay){return[this.wx(e,ax),this.wy(e,ay)]};
P.interrumpir=function(seg){this.interr[this.parte-1]+=seg};
/* jugador en cancha: devuelve el jugador de ese equipo en el área rival (coordenadas de e) */
P.enAreaRival=function(e,x,y){const ax=this.ax(e,x),ay=this.ay(e,y);return ax>PW-AREA_X&&ay>AREA_Y0&&ay<AREA_Y1};

/* ---------- árbitro: faltas por contacto, ventaja y tarjetas ---------- */
/* o: el que entra; c: el que la tenía (o la acababa de soltar). k: {porDetras, tarde, vel, exito, tactica} */
P.contacto=function(o,c,k){
 const R=this.R,arb=this.arb,a=o.a,T=this.tac[o.eq];
 /* agresividad: no hay un atributo propio; se estima con fuerza, poca lectura del juego y poco equilibrio */
 const agres=clamp((a.fuerza*.35+(100-a.inteligencia)*.35+(100-a.equilibrio)*.15+a.marcaje*.15)/100,0,1);
 let pf=.03+(k.porDetras?.14:0)+(k.tarde?.26:0)+MATH.max(0,k.vel-3)*.025+agres*.05+MATH.max(0,T.Pz)*.02-(a.entradas-60)*.002+(k.exito?0:.04)+(k.tactica?.85:0);
 /* dentro del área propia el defensor se cuida mucho más */
 if(!k.tactica&&this.enAreaRival(c.eq,c.x,c.y))pf*=CAL.faltaArea;
 /* el amonestado se cuida */
 if(o.amarilla)pf*=.5;
 pf=clamp(pf,.004,.95);
 const real=R()<pf;
 /* el árbitro ve la falta según su precisión; la severidad decide si cobra el contacto dudoso */
 const enAreaC=this.enAreaRival(c.eq,c.x,c.y);
 const cobra=real?R()<arb.precision*(.8+.2*arb.severidad):R()<(1-arb.precision)*.2*arb.severidad*(enAreaC?.08:1);
 if(!cobra)return false;
 const e=c.eq,x=c.x,y=c.y,enArea=this.enAreaRival(e,x,y);
 const brusco=!k.tactica&&k.vel>6&&(k.porDetras||k.tarde)&&R()<.08+agres*.12;
 const imprudente=!k.tactica&&((k.porDetras&&k.vel>3.5)||k.tarde||k.vel>7);
 /* último hombre: el atacante iba hacia el arco y no quedaba ningún defensor (sin el arquero) entre él y el arco */
 const cax=this.ax(e,x);let delante=0;
 for(const d of this.eq[o.eq])if(!d.gk&&d!==o&&this.ax(e,d.x)>cax)delante++;
 /* (solo si la llevaba de frente al arco: ocasión manifiesta de gol) */
 const llevaba=this.B.dueno===c&&((this.ax(e,c.x+c.vx)-cax)>1),gkO=this.eq[o.eq][0],gkLejos=!gkO||hyp(gkO.x-c.x,gkO.y-c.y)>9;
 const ultimo=!enArea&&!k.tarde&&llevaba&&gkLejos&&cax>66&&MATH.abs(this.ay(e,y)-34)<18&&delante===0&&hyp(PW-cax,34-this.ay(e,y))<30;
 this.st.faltas[o.eq]++;o.s.faltas++;c.s.faltasRecibidas++;
 const grav=brusco?'brusca':ultimo?'último hombre':k.tactica?'táctica':imprudente?'imprudente':'normal';
 /* ventaja: si el equipo que sufrió la falta sigue con la pelota en campo rival y no fue penal */
 const B=this.B,sigue=(B.dueno&&B.dueno.eq===e)||(!B.dueno&&B.tipo==='pase'&&B.desde&&B.desde.eq===e);
 const ventaja=!enArea&&sigue&&!brusco&&!ultimo&&cax>40;
 this.ev('falta',o.eq,o,{sobre:c.nombre,sid:c.id,gravedad:grav,ventaja});
 /* lesión por el golpe */
 if(k.vel>3.5&&R()<(.03+(brusco?.15:0)+MATH.max(0,k.vel-5)*.015)*(1.25-c.a.resistencia/100)*(c.energia<.6?1.3:1))this.lesionar(c,'golpe',brusco||R()<.35);
 /* tarjetas */
 let col=null,mot='';
 if(brusco&&R()<clamp(.7*arb.severidad,0,.95)){col='roja';mot='juego brusco'}
 else if(ultimo&&R()<arb.precision*.8){col='roja';mot='último hombre'}
 else if(k.tactica&&R()<clamp(.75*arb.severidad*(o.amarilla?.6:1),0,.95)){col='amarilla';mot='falta táctica'}
 else if(imprudente&&R()<clamp(.5*arb.severidad*(o.amarilla?.55:1),0,.9)){col='amarilla';mot='imprudente'}
 else if(o.s.faltas>=3&&!o.amarilla&&R()<.25*arb.severidad){col='amarilla';mot='reiteración'}
 else if(R()<.03*arb.severidad*(o.amarilla?.4:1)){col='amarilla';mot='conducta'}
 if(ventaja){this.ventaja={e,x,y,hasta:this.t+30,o};if(col)this.tarjeta(o,col,mot);return true}
 if(col)this.tarjeta(o,col,mot);
 if(this.fin)return true;
 if(enArea)this.reanudar('penal',e,this.wx(e,PW-11),34,180);
 else this.reanudar('tiro_libre',e,x,y,col?160:70,{indirecto:false});
 return true;
};
/* se termina la ventaja: si el equipo perdió la pelota enseguida, se vuelve a cobrar la falta */
/* mano de un defensor en su área: penal (y amarilla si cortó un remate) */
P.mano=function(o,c){
 const e=1-o.eq;this.st.faltas[o.eq]++;o.s.faltas++;
 this.ev('falta',o.eq,o,{sobre:c?c.nombre:null,gravedad:'mano',ventaja:false});
 if(this.R()<.35*this.arb.severidad)this.tarjeta(o,'amarilla','mano');
 if(this.fin)return;
 this.reanudar('penal',e,this.wx(e,PW-11),34,180);
};
P.revisarVentaja=function(){
 const v=this.ventaja;if(!v)return;
 if(this.ctrlEq!==v.e&&this.ctrlEq>=0&&this.estado==='juego'){this.ventaja=null;this.ev('ventaja_anulada',v.e,null);this.reanudar('tiro_libre',v.e,v.x,v.y,70,{indirecto:false});return}
 if(this.t>=v.hasta){this.ventaja=null;this.st.ventajas[v.e]++;this.ev('ventaja',v.e,null)}
};
P.tarjeta=function(j,col,mot){
 if(j.fuera)return;
 if(col==='amarilla'){
  if(j.amarilla){this.st.amarillas[j.eq]++;this.ev('amarilla',j.eq,j,{motivo:mot,segunda:true});this.st.rojas[j.eq]++;this.ev('roja',j.eq,j,{motivo:'segunda amarilla'});this.expulsar(j);return}
  j.amarilla=true;this.st.amarillas[j.eq]++;this.ev('amarilla',j.eq,j,{motivo:mot});this.interrumpir(10);return;
 }
 this.st.rojas[j.eq]++;this.ev('roja',j.eq,j,{motivo:mot});this.expulsar(j);
};
/* un jugador deja la cancha sin reemplazo (expulsión o lesión sin cambios): el equipo se reacomoda */
P.retirar=function(j){
 const e=j.eq,L=this.eq[e],B=this.B;
 if(L.length<=7){this.suspender(e);return}
 j.fuera=true;j.s.salio=+this.minAbs().toFixed(1);
 const k=L.indexOf(j);if(k>=0)L.splice(k,1);
 if(B.dueno===j){B.dueno=null;B.tipo='suelta'}
 j.x=52.5+(e?4:-4)+(j.i%5)*.8;j.y=-3;j.vx=j.vy=0;
 this.activos();this.interrumpir(30);this.minimoEnCancha[e]=MATH.min(this.minimoEnCancha[e],L.length);
 if(j.gk){ /* sin arquero: entra uno del banco si se puede; si no, ataja un jugador de campo */
  const C=this.cambios[e],gkB=this.banco[e].findIndex(r=>GRUPO((r.p||r).pos)==='POR');
  if(gkB>=0&&C.n<5&&(C.ventanas<3||C.rean===this.rean)){
   const sac=L.filter(x=>x.linea==='atq').sort((a,b)=>a.energia-b.energia)[0]||L[L.length-1];
   const raw=this.banco[e].splice(gkB,1)[0];this.cambio(e,sac,raw,'arquero expulsado',{gk:true});
  }else{const nuevo=L.slice().sort((a,b)=>(b.a.reflejos+b.a.manejo)-(a.a.reflejos+a.a.manejo))[0];
   L.splice(L.indexOf(nuevo),1);L.unshift(nuevo);Object.assign(nuevo,{gk:true,rol:'POR',linea:'arq',rel:0,uy:0});}
  return;
 }
 /* defensor o volante menos: baja un delantero (el que mejor marca) a su puesto */
 if(j.linea==='def'||j.linea==='med'){
  const atq=L.filter(x=>x.linea==='atq').sort((a,b)=>(b.a.marcaje+b.a.entradas)-(a.a.marcaje+a.a.entradas));
  if(atq.length>1){const y=atq[0];Object.assign(y,{rol:j.rol,linea:j.linea,rel:j.rel,uy:j.uy,convertido:true})}
 }
};
P.expulsar=function(j){j.expulsado=true;this.retirar(j)};
P.suspender=function(e){if(this.fin)return;this.fin=true;this.suspendido=true;this.ev('suspendido',e,null,{motivo:'un equipo quedó con menos de 7 jugadores'})};

/* ---------- lesiones ---------- */
P.lesionar=function(j,motivo,grave){
 if(j.lesion||j.fuera)return;
 j.lesion={grave:!!grave,t:this.t,motivo};j.vmax*=grave?.45:.7;
 this.st.lesiones[j.eq]++;this.ev('lesion',j.eq,j,{motivo,grave:!!grave});this.interrumpir(grave?75:40);
 if(grave&&!this.paraLesion)this.paraLesion={t:this.t+25,j};
};

/* ---------- banco y cambios (DT de la IA: hasta 5 cambios en 3 ventanas; el entretiempo no cuenta) ---------- */
P.crearJugador=function(raw,e,id,sl){
 const p0=raw.p||raw,info={name:p0.name,pos:p0.pos,grl:+(p0.rating||p0.grl||raw.r)||60,age:+p0.age||26,atributos:p0.atributos};
 const A=atributos(info),fit=raw.fit!=null?+raw.fit:p0.fitness!=null?+p0.fitness:95;
 /* calibración: en la cancha los atributos pesan comprimidos alrededor de un nivel medio (mismo orden, menos distancia),
    para que el mejor gane más pero no siempre. Los atributos originales no se tocan. */
 const a={},dia=this.dia?this.dia[e]:0;for(const k in A.v)a[k]=typeof A.v[k]==='number'?CAL.nivel+CAL.satura*MATH.tanh((A.v[k]-CAL.nivel)*CAL.atributos/CAL.satura)+dia:A.v[k];
 const j={raw,clave:raw.clave!=null?raw.clave:null,id,eq:e,i:sl.i,nombre:String(info.name||('Jugador '+(sl.i+1))),pos:GRUPO(info.pos),rol:sl.rol,rolInicial:sl.rol,linea:sl.linea,rel:sl.rel,uy:sl.uy,grl:info.grl,a,origenAtributos:A.origen,
  gk:!!sl.gk,bx:sl.gk?3:30+sl.rel*36,by:sl.gk?34:34+sl.uy*23,apoyo:null,corrida:null,pared:null,orden:null,desfase:0,
  vmax:6.6+(a.velocidad-50)*.05,acc:3+(a.aceleracion-50)*.04,energia:clamp(fit/100,.55,1),fit,
  x:0,y:0,vx:0,vy:0,tx:0,ty:0,urg:.6,cdToque:0,cdEntrada:0,superado:0,ctrl:0,prox:0,accion:null,manos:false,conPelota:0,recibioDe:null,recibir:null,saque:null,tiroTarget:false,_marca:-1,
  amarilla:false,expulsado:false,fuera:false,lesion:null,enBarrera:false,ultRecibo:null,ultGambeta:-1e9,penalLado:0,ensayada:0,convertido:false,
  s:{pases:0,pasesOk:0,remates:0,goles:0,asist:0,quites:0,intercepciones:0,gambetas:0,distancia:0,faltas:0,faltasRecibidas:0,offsides:0,entro:sl.entro==null?0:sl.entro,salio:null}};
 if(j.gk){j.vmax=6.2+(a.velocidad-50)*.03;j.acc=3.2+(a.reflejos-50)*.02}
 return j;
};
P.cambio=function(e,sale,raw,motivo,extra){
 const C=this.cambios[e];
 if(C.rean!==this.rean||!this.rean){if(!this.enEntretiempo){C.ventanas++}C.rean=this.rean}
 C.n++;this.st.cambios[e]++;this.interrumpir(25);
 const gk=extra&&extra.gk;
 const nuevo=this.crearJugador(raw,e,sale.id,{i:sale.i,rol:gk?'POR':sale.rol,linea:gk?'arq':sale.linea,rel:gk?0:sale.rel,uy:gk?0:sale.uy,gk:gk||sale.gk,entro:+this.minAbs().toFixed(1)});
 nuevo.x=52.5;nuevo.y=sale.y<34?-.5:PH+.5;  // entra por la mitad de cancha
 const L=this.eq[e],k=L.indexOf(sale);
 if(gk){if(k>=0)L.splice(k,1);L.unshift(nuevo)}else if(k>=0)L[k]=nuevo;
 sale.fuera=true;sale.s.salio=+this.minAbs().toFixed(1);this.salidos.push(sale);this.J[sale.id]=nuevo;
 this.activos();
 this.ev('cambio',e,nuevo,{sale:sale.nombre,entra:nuevo.nombre,sid:sale.id,motivo});
};
/* el DT decide en cada interrupción */
P.dt=function(e){
 if(this.opt.dtExterno&&this.opt.dtExterno[e])return;   // los cambios los decide el juego (el usuario o el DT de la carrera)
 const C=this.cambios[e],L=this.eq[e],ban=this.banco[e];
 if(this.fin||C.n>=5||!ban.length)return;
 const puede=this.enEntretiempo||C.ventanas<3||C.rean===this.rean;if(!puede)return;
 const min=this.minAbs(),dif=this.goles[e]-this.goles[1-e],lista=[];
 for(const j of L)if(j.lesion)lista.push([j,'lesión']);
 const planeado=C.plan.findIndex(m=>min>=m);
 if(!this.enEntretiempo&&planeado>=0&&min>=55){
  C.plan.splice(planeado,1);
  const campo=L.filter(j=>!j.gk&&!j.lesion&&!lista.some(x=>x[0]===j));
  if(min>=64&&dif<0){const s=campo.filter(j=>j.linea!=='atq').sort((a,b)=>a.energia-b.energia)[0];if(s)lista.push([s,'resultado','DEL'])}
  else if(min>=74&&dif>0){const s=campo.filter(j=>j.linea==='atq').sort((a,b)=>a.energia-b.energia)[0];if(s)lista.push([s,'resultado','DEF'])}
  const conv=campo.find(j=>j.convertido&&!lista.some(x=>x[0]===j));if(conv)lista.push([conv,'tarjeta','DEF']);
  const amon=campo.find(j=>j.amarilla&&j.s.faltas>=2&&j.linea!=='atq'&&!lista.some(x=>x[0]===j));if(amon)lista.push([amon,'tarjeta']);
  for(const j of campo.slice().sort((a,b)=>a.energia-b.energia)){if(lista.length>=2)break;if(j.energia<.72&&!lista.some(x=>x[0]===j))lista.push([j,'cansancio'])}
 }else if(this.enEntretiempo){for(const j of L)if(!j.gk&&j.energia<.5&&!lista.some(x=>x[0]===j)&&lista.length<1)lista.push([j,'cansancio'])}
 for(const [sale,mot,grupo] of lista.slice(0,3)){
  if(C.n>=5||!ban.length)break;if(!(this.enEntretiempo||C.ventanas<3||C.rean===this.rean))break;
  const g=sale.gk?'POR':grupo||sale.pos;
  let k=ban.findIndex(r=>GRUPO((r.p||r).pos)===g);
  if(k<0&&!sale.gk)k=ban.findIndex(r=>GRUPO((r.p||r).pos)!=='POR');
  if(k<0)continue;
  const raw=ban.splice(k,1)[0];this.cambio(e,sale,raw,mot);
  if(grupo&&mot==='resultado'){const n=this.J[sale.id];if(grupo==='DEL'){Object.assign(n,{rol:'DC',linea:'atq',rel:.95,uy:0})}}
 }
 /* lesionado grave sin cambio posible: deja la cancha */
 for(const j of L.slice())if(j.lesion&&j.lesion.grave&&!j.fuera&&this.eq[e].includes(j))this.retirar(j);
};

/* ---------- offside (en el momento del pase) ---------- */
P.marcarOffside=function(j,saque){
 const B=this.B,e=j.eq;
 if(saque==='lateral'||saque==='corner'||(saque&&saque.startsWith('saque_arco'))||saque==='penal'){B.off=null;return}
 let m1=-1,m2=-1;for(const o of this.eq[1-e]){const x=this.ax(e,o.x);if(x>m1){m2=m1;m1=x}else if(x>m2)m2=x}
 const lin=MATH.max(m2,this.ax(e,j.x),52.5),set=new Map();
 for(const q of this.eq[e]){if(q===j||q.gk)continue;const qx=this.ax(e,q.x);if(qx>lin+.05)set.set(q.id,qx-lin)}
 B.off=set.size?{e,set,t:this.t}:null;
};
/* j intenta jugar la pelota: si estaba adelantado en el pase, se cobra (si el asistente lo ve) */
P.chequearOffside=function(j){
 const B=this.B,o=B.off;if(!o)return false;
 if(o.e!==j.eq){B.off=null;return false}               // la jugó un rival: termina la jugada
 if(!o.set.has(j.id)){B.off=null;return false}         // la juega un compañero habilitado
 const margen=o.set.get(j.id);B.off=null;
 if(margen<.3&&this.R()<(1-this.arb.precision)*2)return false;   // el asistente no lo ve
 this.st.offsides[j.eq]++;j.s.offsides++;this.ev('offside',j.eq,j,{margen:+margen.toFixed(2)});
 this.reanudar('tiro_libre',1-j.eq,j.x,j.y,60,{indirecto:true});
 return true;
};

/* ---------- pelota parada: armado de cada reanudación ---------- */
const pateador=j=>j.a.tiro*.45+j.a.potencia*.15+j.a.centros*.2+j.a.vision*.2;
const penalero=j=>j.a.definicion*.5+j.a.tiro*.3+j.a.potencia*.2;
const cabeceador=j=>j.a.cabeceo*.6+j.a.salto*.3+j.a.fuerza*.1;
/* devuelve {ej, plan:Map(id→[x,y]), datos} en coordenadas de la cancha */
P.armar=function(tipo,e,x,y,extra){
 const R=this.R,L=this.eq[e],O=this.eq[1-e],plan=new Map(),datos=Object.assign({},extra||{}),campo=L.filter(j=>!j.gk);
 const ax=this.ax(e,x),ay=this.ay(e,y),pon=(j,pax,pay)=>plan.set(j.id,this.toW(e,clamp(pax,.5,PW-.5),clamp(pay,.5,PH-.5)));
 const ponD=(j,dax,day)=>plan.set(j.id,this.toW(1-e,clamp(dax,.5,PW-.5),clamp(day,.5,PH-.5)));   // en coordenadas del defensor
 const masCerca=lista=>lista.slice().sort((a,b)=>hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y)||a.id-b.id)[0];
 let ej;
 if(tipo==='saque_arco'){
  ej=L[0];
  const presionAlta=O.filter(o=>!o.gk&&this.ax(e,o.x)<35).length>=3;
  datos.largo=this.tac[e].directo>.55||(presionAlta&&R()<.7)||R()<.15;
  if(!datos.largo){const cs=campo.filter(j=>j.rol==='DFC').slice(0,2);cs.forEach((j,i)=>pon(j,11,34+(i?1:-1)*13));
   const mcd=campo.find(j=>j.rol==='MCD');if(mcd)pon(mcd,22,34)}
  /* los rivales, fuera del área hasta que se patee */
  datos.radio=0;datos.fueraArea=true;
 }else if(tipo==='saque_centro'){
  ej=campo.filter(j=>j.linea==='atq'&&j.rol==='DC')[0]||campo.filter(j=>j.pos==='DEL')[0]||campo[campo.length-1];
 }else if(tipo==='lateral'){
  const lado=ay<34?-1:1;
  const cands=campo.filter(j=>['LI','LD','MI','MD','EI','ED'].includes(j.rol)&&(this.ay(e,j.y)-34)*lado>0);
  ej=masCerca(cands.length?cands:campo);datos.radio=2;
 }else if(tipo==='corner'){
  const cs=ay<34?-1:1;   // lado del córner
  ej=campo.slice().sort((a,b)=>(b.a.centros+b.a.paseLargo*.3)-(a.a.centros+a.a.paseLargo*.3)||a.id-b.id)[0];
  const resto=campo.filter(j=>j!==ej),cab=resto.slice().sort((a,b)=>cabeceador(b)-cabeceador(a)||a.id-b.id);
  const puntos=[['primer palo',99.6,34+cs*2.8],['segundo palo',99.2,34-cs*3.2],['punto penal',94,34+cs*.5],['centro del área',96.5,34-cs*.5]];
  const zona=[];
  cab.slice(0,4).forEach((j,i)=>{pon(j,puntos[i][1]-4.5,puntos[i][2]+(i%2?2:-2));zona.push([j,puntos[i]])});   // arrancan más atrás y entran al patear
  const rebote=cab[4];if(rebote)pon(rebote,PW-19,34-cs*4);
  const corto=cab[5];datos.corto=corto&&R()<.5?corto:null;if(datos.corto)pon(datos.corto,PW-5,ay-cs*9);
  /* los demás: dos en el fondo y el resto en tres cuartos */
  cab.slice(datos.corto?6:5).forEach((j,i)=>pon(j,i<2?48+i*6:70,34+(i%2?14:-14)));
  datos.puntos=zona;datos.lado=cs;
  /* defensa: zona o al hombre según la táctica */
  const Td=this.tac[1-e],hombre=Td.Pz>.3||Td.style==='Presión alta'||Td.style==='Ofensivo';
  datos.marca=hombre?'hombre':'zona';
  const def=O.filter(o=>!o.gk).sort((a,b)=>cabeceador(b)-cabeceador(a)||a.id-b.id);
  const usados=new Set();
  const palo=def.find(d=>d.linea!=='atq')||def[0];if(palo){ponD(palo,.6,34-cs*3.4);usados.add(palo)}   // en el primer palo (en coordenadas del defensor el lado del córner es el opuesto)
  if(hombre){
   for(const [a,pt] of zona){const d=def.find(z=>!usados.has(z));if(!d)break;usados.add(d);
    const [wx,wy]=this.toW(e,pt[1]-4.5,pt[2]);ponD(d,this.ax(1-e,wx)-1,this.ay(1-e,wy));d.orden={tipo:'marca',o:a,hasta:0}}
  }else{
   const ys=[-7,-3.5,0,3.5,7];let k=0;for(const d of def){if(usados.has(d)||k>=5)continue;usados.add(d);ponD(d,6,34+ys[k++])}
  }
  const libres=def.filter(d=>!usados.has(d));libres.forEach((d,i)=>ponD(d,i===0?17:i===1?40:30,34+(i%2?10:-10)));
  datos.radio=9.15;
 }else if(tipo==='penal'){
  ej=campo.slice().sort((a,b)=>penalero(b)-penalero(a)||a.id-b.id)[0];
  datos.radio=9.15;datos.fueraArea=true;
  /* todos afuera del área, en la medialuna no */
  const otros=this.A.filter(j=>j!==ej&&!(j.gk&&j.eq===1-e));let k=0;
  for(const j of otros){if(j.gk){pon(j,10,34);continue}const yy=34+((k%8)-3.5)*4.2+(k%8>=4?0:0);k++;
   const [wx,wy]=this.toW(e,PW-AREA_X-1-(k%3)*1.5,yy<26||yy>42?yy:(yy<34?24:44));plan.set(j.id,[wx,wy])}
  const gkD=O[0];if(gkD)ponD(gkD,.3,34);
 }else if(tipo==='tiro_libre'){
  const dg=hyp(PW-ax,34-ay);
  ej=campo.slice().sort((a,b)=>hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y)||a.id-b.id)[0];
  datos.radio=9.15;datos.barrera=0;datos.modo='pase';
  if(!datos.indirecto&&ax>68&&dg<36){
   const pt=campo.slice().sort((a,b)=>pateador(b)-pateador(a)||a.id-b.id)[0];ej=pt;
   const ang=MATH.abs(ay-34);
   let n=dg<18?5:dg<22?4:dg<26?3:dg<31?2:1;if(ang>16)n=MATH.max(1,n-2);else if(ang>10)n=MATH.max(1,n-1);
   const directo=dg<31&&ang<17&&R()<clamp((ej.a.tiro-50)/40,.25,.9)*(dg<26?1:.7);
   datos.modo=directo?'directo':(ax>74?'centro':'pase');
   if(directo&&R()<.18)datos.modo='ensayada';
   datos.barrera=datos.modo==='pase'||ax>97?0:n;   // pegado a la línea de fondo: centro sin barrera
   /* barrera a 9,15 m sobre la línea pelota-arco, corrida hacia el palo cercano */
   const ux=(PW-ax)/dg,uy=(34-ay)/dg,bx0=ax+ux*9.15,by0=ay+uy*9.15,px=-uy,py=ux,palo=ay<34?-1:1;
   const muro=O.filter(o=>!o.gk).sort((a,b)=>(a.linea==='def')-(b.linea==='def')||hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y)||a.id-b.id).slice(0,datos.barrera);
   datos.muro=muro;
   muro.forEach((m,i)=>{const off=(i-(muro.length-1)/2)*.6+palo*.35*(datos.barrera>1?1:0);pon(m,bx0+px*off,by0+py*off);m.enBarrera=true});
   /* el arquero se para del otro lado de la barrera, sobre su línea */
   if(O[0]&&datos.barrera)pon(O[0],PW-.4,clamp(34-palo*1.2,GY0+.6,GY1-.6));
   if(datos.modo==='ensayada'){const ay2=campo.filter(j=>j!==ej).sort((a,b)=>(b.a.tiro)-(a.a.tiro)||a.id-b.id)[0];datos.ayudante=ay2;if(ay2)pon(ay2,ax-.5,ay+(ay<34?3:-3))}
   if(datos.modo!=='pase'){
    /* atacantes al área (los mejores de cabeza), en la línea del último defensor */
    const cab=campo.filter(j=>j!==ej&&j!==datos.ayudante).sort((a,b)=>cabeceador(b)-cabeceador(a)||a.id-b.id);
    const puntos=[['primer palo',99,34-3],['segundo palo',99,34+3.5],['punto penal',93.5,34],['borde',89,34+6]];datos.puntos=[];
    cab.slice(0,4).forEach((j,i)=>{pon(j,MATH.min(87,ax+6),34+(i-1.5)*5);datos.puntos.push([j,puntos[i]])});
    cab.slice(4).forEach((j,i)=>pon(j,i<2?50+i*5:68,34+(i%2?12:-12)));
    /* los defensores no usados en la barrera marcan en la línea */
    const libres=O.filter(o=>!o.gk&&!muro.includes(o));libres.forEach((d,i)=>{const t=cab[i];if(t){const tx=MATH.min(86,ax+6)+1;pon(d,tx+.8,34+(i-1.5)*5)}else pon(d,60,34)});
   }
  }
 }else{ // bote (pelota al piso tras una lesión)
  ej=masCerca(campo);datos.radio=4;
 }
 return{ej,plan,datos};
};
/* durante la interrupción: cada uno a su lugar del plan, y los rivales a la distancia reglamentaria */
P.posicionesParado=function(forzar){
 const r=this.rean;if(!r)return;
 const d=r.datos||{},e=r.e;
 for(const j of this.A){const p=r.plan&&r.plan.get(j.id);if(p){j.tx=p[0];j.ty=p[1];j.urg=.9}}   // a su lugar exacto
 r.ej.tx=r.x-this.dir(e)*.5;r.ej.ty=r.y;r.ej.urg=1;
 const rad=d.radio||0;
 for(const j of this.eq[1-e]){
  if(j.enBarrera)continue;
  let tx=j.tx,ty=j.ty;
  if(rad>0){const dx=tx-r.x,dy=ty-r.y,dd=hyp(dx,dy);if(dd<rad+.2){const k=(rad+.3)/(dd||1);tx=r.x+(dd?dx:-this.dir(e))*k;ty=r.y+(dd?dy:0)*k}}
  if(d.fueraArea&&!(j.gk&&r.tipo==='penal')){
   /* afuera del área donde se patea (para el saque de arco es el área propia del que saca) */
   const ae=r.tipo==='saque_arco'?e:1-e;const ax=this.ax(ae,tx),ay=this.ay(ae,ty);
   if(ax<AREA_X+1&&ay>AREA_Y0-1&&ay<AREA_Y1+1){const n=this.toW(ae,AREA_X+1.5,ay);tx=n[0]}
  }
  if(tx!==j.tx||ty!==j.ty)j.urg=.9;
  j.tx=clamp(tx,.5,PW-.5);j.ty=clamp(ty,.5,PH-.5);
  if(forzar){const dx=j.x-r.x,dy=j.y-r.y;if(hyp(dx,dy)<rad||d.fueraArea){j.x=j.tx;j.y=j.ty}}
 }
 if(r.tipo==='penal'){for(const j of this.eq[e])if(j!==r.ej&&(forzar)){const p=r.plan.get(j.id);if(p){j.x=p[0];j.y=p[1]}}}
 if(forzar&&r.plan)for(const j of this.A){const p=r.plan.get(j.id);if(p&&(j.enBarrera||(r.tipo==='penal'&&j.gk))){j.x=p[0];j.y=p[1];j.vx=j.vy=0}}
};
/* después de patear un córner o un tiro libre al área: cada atacante entra a su punto, los marcadores siguen a su hombre */
P.ordenesPelotaParada=function(r){
 const d=r.datos||{},e=r.e,h=this.t+22;
 for(const [j,pt] of d.puntos||[]){if(!j.fuera){const w=this.toW(e,pt[1],pt[2]);j.orden={tipo:'punto',x:w[0],y:w[1],hasta:h}}}
 for(const j of this.eq[1-e]){if(j.orden&&j.orden.tipo==='marca')j.orden.hasta=h;j.enBarrera=false}
 /* el arquero sale si el centro cae en el área chica */
};
P.aplicarOrdenes=function(){
 for(const j of this.A){const o=j.orden;if(!o||o.hasta<=this.t)continue;
  if(o.tipo==='punto'){j.tx=o.x;j.ty=o.y;j.urg=1}
  else if(o.tipo==='marca'&&!o.o.fuera){const g=this.dir(j.eq)>0?0:PW,dx=g-o.o.x,dy=34-o.o.y,n=hyp(dx,dy)||1;j.tx=o.o.x+dx/n*.8;j.ty=o.o.y+dy/n*.8;j.urg=1}}
};
/* centro a la cabeza: la pelota pasa por (tx,ty) a ~1,9 m de altura y cae un poco más allá */
P.centroA=function(j,tx,ty,q){
 const B=this.B,R=this.R,a=j.a,e=j.eq;
 const sig=.02+(100-a.centros)*.0011;
 const dx=tx-j.x,dy=ty-j.y,d=hyp(dx,dy)||1,an=MATH.atan2(dy,dx)+R.g()*sig,dl=d/.86*(1+R.g()*(.03+(100-a.centros)*.0006));
 const Tt=clamp(dl/19,1.05,1.8),vh=vAire(dl,Tt);
 B.dueno=null;B.tipo='pase';B.desde=j;B.destino=q||null;B.ultimo=j;B.tiro=null;B.z=.1;B.tPateo=this.t;B.altoSale=true;B.centro=true;B.despeje=false;
 B.vx=MATH.cos(an)*vh;B.vy=MATH.sin(an)*vh;B.vz=G*Tt/2;B.x=j.x+MATH.cos(an)*.4;B.y=j.y+MATH.sin(an)*.4;
 j.cdToque=5;j.accion=null;this.st.pases[e]++;j.s.pases++;this.st.pasesAltos[e]++;
 if(q)q.recibir={x:tx,y:ty,hasta:this.t+30};
 this.ev('pase',e,j,{receptor:q?q.nombre:null,rid:q?q.id:null,alto:true,centro:true,dist:+d.toFixed(1)});
};
P.sacarCorner=function(j,r){
 const d=r.datos,e=j.eq,R=this.R;
 this.ordenesPelotaParada(r);
 if(d.corto&&!d.corto.fuera&&R()<.5){j.saque='corner';d.corto=null;return false}       // corto: lo juega con el compañero (decisión normal)
 /* elige primer palo, segundo palo o el punto penal según quién cabecea mejor */
 const op=d.puntos.filter(([q])=>!q.fuera);if(!op.length){j.saque='corner';return false}
 let tot=0;const w=op.map(([q],i)=>{const v=MATH.pow(cabeceador(q)/60,3)*(i===0?1.2:1);tot+=v;return v});
 let x=R()*tot,k=0;for(;k<w.length-1;k++){x-=w[k];if(x<=0)break}
 const [q,pt]=op[k],wpt=this.toW(e,pt[1],pt[2]);
 this.ev('corner_ejecutado',e,j,{a:pt[0],cabeceador:q.nombre});
 this.centroA(j,wpt[0],wpt[1],q);return true;
};
P.tiroLibre=function(j,r){
 const d=r.datos,e=j.eq,R=this.R;
 if(d.modo==='directo'){this.remate(j,false,null,{libre:true,barrera:d.muro||[]});this.ordenesPelotaParada(r);return true}
 if(d.modo==='ensayada'&&d.ayudante&&!d.ayudante.fuera){const q=d.ayudante;this.pasar(j,{tipo:'pase',q,tx:q.x+this.dir(e)*1.5,ty:q.y,alto:false,d:3});q.ensayada=this.t+30;this.ordenesPelotaParada(r);this.ev('jugada_ensayada',e,j,{con:q.nombre});return true}
 if(d.modo==='centro'&&d.puntos&&d.puntos.length){this.ordenesPelotaParada(r);const op=d.puntos.filter(([q])=>!q.fuera);const [q,pt]=op[MATH.floor(R()*op.length)];const w=this.toW(e,pt[1],pt[2]);this.centroA(j,w[0],w[1],q);return true}
 for(const m of d.muro||[])m.enBarrera=false;
 j.saque=d.indirecto?'tiro_libre_ind':'tiro_libre';return false;
};
/* penal: el pateador elige lado, altura y potencia; el arquero adivina o no */
P.patearPenal=function(j){
 const B=this.B,R=this.R,e=j.eq,a=j.a,gk=this.eq[1-e][0];
 const pref=hash(j.nombre)%2?1:-1,u=R(),lado=u<.62?pref:u<.92?-pref:0;
 const margen=lado?.25+R()*.9:0,y0=34+lado*(3.66-margen)*(1);
 const zt=lado?clamp(.2+R()*1.7,.1,2.2):.3+R()*1.2;
 /* nervios y técnica: el error crece si el pateador es flojo */
 const sig=.018+(100-a.definicion)*.0008,ang=R.g()*sig;
 const ax=PW-11,vh=19+a.potencia*.1+R()*3,T=11/vh;
 const yt=y0+MATH.tan(ang)*11*(1)+R.g()*(.08+(100-a.definicion)*.004);
 const zg=zt+R.g()*(.15+(100-a.tiro)*.006);
 const [wx,wy]=this.toW(e,ax,34),[gx,gy]=this.toW(e,PW,yt);
 const dx=gx-wx,dy=gy-wy,dd=hyp(dx,dy);
 B.x=wx;B.y=wy;B.z=.05;B.dueno=null;B.tipo='tiro';B.ultimo=j;B.desde=null;B.destino=null;
 B.vx=dx/dd*vh;B.vy=dy/dd*vh;B.vz=MATH.max(0,(zg+.5*G*T*T)/T);
 /* el arquero: se tira a un lado antes de ver la pelota (lee al pateador un poco si es bueno) */
 const lee=R()<(gk.a.anticipacion+gk.a.reflejos-100)/400;
 const v=R(),gLado=lee?lado:(v<.45?1:v<.9?-1:0);
 const yg=34+gLado*2.3,[,gwy]=this.toW(e,PW-.3,yg);
 gk.tx=gk.x;gk.ty=gwy;gk.urg=1;gk.tiroTarget=true;gk.penalLado=gLado;
 const aPuerta=MATH.abs(yt-34)<3.66-BR&&zg<GH-BR&&zg>-.5;
 B.tiro={j,t0:this.t,xg:.76,ctx:{origen:'penal'},aPuerta,vistos:new Set(),gkVisto:false,bloqueado:true,penal:{lado,gLado,yt}};B.ultTiro=B.tiro;B.off=null;
 this.st.remates[e]++;j.s.remates++;this.st.xg[e]+=.76;if(aPuerta)this.st.alArco[e]++;this.st.penalesPateados[e]++;
 j.cdToque=8;j.accion=null;
 this.ev('remate',e,j,{aPuerta,penal:true,lado:lado<0?'izquierda':lado>0?'derecha':'centro',arqueroSeTira:gLado<0?'izquierda':gLado>0?'derecha':'se queda',xg:.76,dist:11,arquero:gk.nombre});
 /* todos entran al área a buscar el rebote */
 for(const p of this.A){if(p===j||p.gk)continue;const w=this.toW(e,PW-9,34+(p.id%5-2)*4);p.orden={tipo:'punto',x:w[0],y:w[1],hasta:this.t+20}}
};

/* tiros libres y córners: no se patea con un rival todavía a menos de 9,15 m ni con la barrera sin armar; a los 8 s se patea igual */
P.rivalCerca=function(r){
 const rad=r.datos&&r.datos.radio||0;if(rad<9||(r.tipo!=='tiro_libre'&&r.tipo!=='corner'))return false;
 for(const j of this.eq[1-r.e]){if(j.fuera||j.expulsado)continue;
  if(j.enBarrera){const p=r.plan&&r.plan.get(j.id);if(p&&hyp(j.x-p[0],j.y-p[1])>1)return true}   // la barrera todavía no se armó
  else if(hyp(j.x-r.x,j.y-r.y)<rad)return true}
 return false;
};
/* ---------- un tick ---------- */
P.tick=function(){
 const B=this.B;
 if(this.estado==='parado'){
  this.objetivos();this.mover();
  const r=this.rean;if(r){r.timer--;B.x=r.x;B.y=r.y;B.z=0;B.vx=B.vy=B.vz=0;if(B.dueno&&B.dueno.eq!==r.e)B.dueno=null;   // el rival suelta la pelota y se aleja
  
   const d=hyp(r.ej.x-r.x,r.ej.y-r.y);const listo=r.timer<=0&&d<2&&!this.rivalCerca(r);r.listo=listo?(r.listo||0)+1:0;
   if(r.listo>=(r.tipo==='tiro_libre'||r.tipo==='corner'?5:1)||r.timer<-80)this.ejecutarReanudacion()}
 }else{
  this.st.ticksJuego++;
  if(B.dueno)this.actuar(B.dueno);
  let paro=false;
  if(!B.dueno){paro=this.fisica();if(!paro)this.controles()}
  if(this.estado==='juego'){
   if(B.dueno)this.entradas();
   this.objetivos();this.mover();
   const pe=B.dueno?B.dueno.eq:(B.ultimo?B.ultimo.eq:-1);if(pe>=0)this.st.posTicks[pe]++;
  }
  if(this.estado==='juego'){
   this.revisarVentaja();
   /* lesión grave: el árbitro para el juego y después se reanuda con pelota al piso para el que la tenía */
   const pl=this.paraLesion;
   if(pl&&this.estado==='juego'&&this.t>=pl.t){this.paraLesion=null;const pe=this.ctrlEq>=0?this.ctrlEq:pl.j.eq;this.reanudar('bote',pe,clamp(B.x,1,PW-1),clamp(B.y,1,PH-1),90)}
  }
 }
 /* cada minuto: lesiones por cansancio (poco probable; más con poca resistencia, poco físico y piernas cansadas) */
 if(this.tParte%600===300&&!this.fin){
  for(const j of this.A){if(j.lesion)continue;const p=.0002*(1+(1-j.energia)*5)*(1.45-j.a.resistencia/100)*(1+(100-j.fit)/40);if(this.R()<p)this.lesionar(j,'cansancio',this.R()<.3)}
 }
 if(this.parte===2&&(this.tParte===25*60*TPS||this.tParte===31*60*TPS))this.ajustarPorResultado();   // minuto 70: el que gana por uno se cuida, el que pierde va
 /* gancho de prueba: expulsión forzada en un minuto (solo la usan las pruebas automáticas) */
 const fr=this.opt.forzarRoja;
 if(fr&&!this._roja&&this.estado==='juego'&&this.minAbs()>=fr.minuto){this._roja=true;
  const v=this.eq[fr.equipo].filter(j=>j.linea==='med').sort((a,b)=>b.grl-a.grl)[0];if(v){this.st.rojas[v.eq]++;this.ev('roja',v.eq,v,{motivo:'forzada (prueba)'});this.expulsar(v)}}
 if(this.estado==='juego'&&this.t%5===0)this.medir();
 if(this.cinta&&this.t%this.cada===0)this.muestrear();
 this.t++;this.tParte++;
};
/* forma de cada equipo con y sin pelota (largo, ancho, distancia entre líneas, altura y alineación de la línea) */
P.medir=function(){
 const pe=this.posEqActual();if(pe<0)return;
 for(let e=0;e<2;e++){
  const A=this.md[e][pe===e?0:1];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;const sum={def:0,med:0,atq:0},n={def:0,med:0,atq:0},xd=[];
  for(const j of this.eq[e]){if(j.gk)continue;const x=this.ax(e,j.x),y=this.ay(e,j.y);
   if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;sum[j.linea]+=x;n[j.linea]++;if(j.linea==='def')xd.push(x)}
  if(!n.def||!n.med||!n.atq)continue;
  const md=sum.def/n.def,mm=sum.med/n.med,ma=sum.atq/n.atq;
  let v=0;for(const x of xd)v+=(x-md)*(x-md);
  A.n++;A.largo+=x1-x0;A.ancho+=y1-y0;A.dDM+=mm-md;A.dMA+=ma-mm;A.linea+=md;A.bloque+=(sum.def+sum.med+sum.atq)/(n.def+n.med+n.atq);A.alin+=sqrt(v/xd.length);
 }
};
P.muestrear=function(){
 const B=this.B,f=[MATH.round(B.x*10),MATH.round(B.y*10),MATH.round(B.z*10),B.dueno?B.dueno.id:-1,this.estado==='juego'?1:0];
 for(const j of this.J){f.push(MATH.round(j.x*10),MATH.round(j.y*10))}   // por puesto (id): el que está en cancha, o el expulsado parado al costado
 this.cinta.t.push(this.t);for(const v of f)this.cinta.d.push(v);
};
/* el partido se juega en pasos (así también puede avanzar en vivo, de a un minuto, dentro del juego) */
P.iniciarParte=function(parte){
 if(this.fin)return false;
 this.parte=parte;this.tParte=0;
 const e=parte===1?0:1;
 if(parte===2){this.enEntretiempo=true;this.rean=null;for(const k of [0,1])this.dt(k);this.enEntretiempo=false;if(this.fin)return false}
 this.estado='parado';this.rean={tipo:'saque_centro',e,x:52.5,y:34,ej:null,timer:0,plan:null,datos:{}};
 const eqJ=this.eq[e].filter(j=>!j.gk);this.rean.ej=eqJ.filter(j=>j.linea==='atq')[0]||eqJ[eqJ.length-1];
 this.colocarSaqueCentro(e);
 for(const j of this.A){j.energia=MATH.min(1,j.energia+(parte===2?.08:0));j.accion=null;j.manos=false;j.superado=0;j.cdToque=0;j.orden=null}
 this.ev(parte===1?'inicio':'segundo_tiempo',e,null);
 this.ejecutarReanudacion();
 /* 45 minutos y el descuento que dé el árbitro según lo que se perdió (goles, cambios, lesiones, tarjetas, penales) */
 this._limite=45*60*TPS;this._dado=false;
 return true;
};
/* un tick; devuelve true cuando terminó el tiempo */
P.paso=function(){
 if(this.fin)return true;
 const parte=this.parte;
 if(!this._dado&&this.tParte>=45*60*TPS){this._dado=true;
  const base=parte===1?.5:1.5,m=clamp(MATH.round(base+this.interr[parte-1]/60+this.R()*.8),parte===1?0:1,parte===1?6:12);
  this.anadido[parte-1]=m;this._limite=(45+m)*60*TPS;this.ev('descuento',-1,null,{minutos:m})}
 if(this._dado&&this.tParte>=this._limite){
  /* no termina con un penal por patear ni con un remate en el aire */
  const pend=(this.estado==='parado'&&this.rean&&this.rean.tipo==='penal')||this.B.tiro;
  if(!pend||this.tParte>=this._limite+600)return true;
 }
 this.tick();
 return false;
};
P.cerrarParte=function(parte){
 this.ventaja=null;
 this.ev(parte===1?'entretiempo':'final',-1,null,{marcador:this.goles.slice()});
};
P.jugar=function(){
 for(const parte of [1,2]){
  if(!this.iniciarParte(parte))break;
  while(!this.paso()){}
  this.cerrarParte(parte);
 }
 if(this.suspendido&&!this.eventos.some(e=>e.tipo==='final'))this.ev('final',-1,null,{marcador:this.goles.slice(),suspendido:true});
};
/* cambio de táctica durante el partido (si cambia la formación, cada jugador toma el puesto que le toca en el orden) */
P.cambiarTactica=function(e,tac){
 const prev=this.tacBase[e]||{},f=(tac&&tac.formation)||'4-3-3';
 this.tacBase[e]=tac;
 if(f!==(prev.formation||'4-3-3')){
  const L=this.eq[e].filter(j=>!j.gk);
  if(L.length===10){const pl=plantilla(f,10),nDef=pl.filter(q=>q[1]>=64).length,umax=MATH.max(...pl.map(q=>MATH.abs(q[0]-50)/50))||1;
   L.forEach((j,i)=>{const sl=pl[i],rol=rolDe(sl[0],sl[1],nDef);Object.assign(j,{rol,linea:LINEA_ROL[rol],rel:clamp((73-sl[1])/58,0,1),uy:(sl[0]-50)/50/umax,convertido:false})})}
 }
 this.ajustarPorResultado();
};
P.resultado=function(){
 const st=this.st,tp=st.posTicks[0]+st.posTicks[1]||1,r2=x=>+x.toFixed(2);
 const cinta=this.cinta?{hz:TPS/this.cada,cada:this.cada,frames:this.cinta.t.length,
  formato:'por cuadro: pelota x,y,z (decímetros), id del dueño (-1 suelta), en juego (1/0), y luego x,y de los 22 jugadores por id (decímetros)',
  porCuadro:5+this.J.length*2,t:Int32Array.from(this.cinta.t),datos:Int16Array.from(this.cinta.d)}:null;
 return{version:VERSION,semilla:this.opt.semilla,local:this.equipos[0].name,visitante:this.equipos[1].name,
  h:this.goles[0],a:this.goles[1],anadido:this.anadido,ticks:this.t,
  stats:{posesion:[MATH.round(100*st.posTicks[0]/tp),100-MATH.round(100*st.posTicks[0]/tp)],pases:st.pases,pasesOk:st.pasesOk,pasesAltos:st.pasesAltos,
   remates:st.remates,alArco:st.alArco,atajadas:st.atajadas,bloqueos:st.bloqueos,palos:st.palos,corners:st.corners,laterales:st.laterales,saquesArco:st.saquesArco,
   quites:st.quites,intercepciones:st.intercepciones,gambetas:st.gambetas,gambetasOk:st.gambetasOk,cabezazos:st.cabezazos,xg:st.xg.map(r2),
   minutosEnJuego:+(st.ticksJuego/TPS/60).toFixed(1),
   posesiones:st.posesiones,pasesPorPosesion:st.pases.map((p,e)=>r2(p/(st.posesiones[e]||1))),recuperaciones:st.recuperaciones,recupCampoRival:st.recupCampoRival,
   alturaRecuperacion:st.alturaRecup.map((h,e)=>r2(h/(st.recuperaciones[e]||1))),pelotazos:st.pelotazos,desmarques:st.desmarques,paredes:st.paredes,cambiosFrente:st.cambiosFrente,
   contras:st.contras,contrapresiones:st.contrapresiones,repliegues:st.repliegues,
   faltas:st.faltas,amarillas:st.amarillas,rojas:st.rojas,penales:st.penales,penalesGol:st.penalesGol,offsides:st.offsides,tirosLibres:st.tirosLibres,tirosLibresDirectos:st.tirosLibresDirectos,
   lesiones:st.lesiones,cambios:st.cambios,despejes:st.despejes,centros:st.centros,origenGoles:st.origenGoles,ventanas:this.cambios.map(c=>c.ventanas),ventajas:st.ventajas,enCancha:this.eq.map(L=>L.length),minimoEnCancha:this.minimoEnCancha.slice(),descuento:this.anadido.slice()},
  arbitro:this.arb,suspendido:this.suspendido,
  tactica:this.tac.map(T=>({estilo:T.style,formacion:T.formation,bloque:T.bloque,directo:r2(T.directo),contrapresion:T.contrapresion,umbralPresion:r2(T.umbralPresion)})),
  forma:this.md.map(f=>{const o=A=>{const k=A.n||1;return{muestras:A.n,largo:r2(A.largo/k),ancho:r2(A.ancho/k),entreLineas:[r2(A.dDM/k),r2(A.dMA/k)],alturaLinea:r2(A.linea/k),alturaBloque:r2(A.bloque/k),alineacionLinea:r2(A.alin/k)}};return{con:o(f[0]),sin:o(f[1])}}),
  jugadores:this.J.concat(this.salidos).map(j=>({id:j.id,equipo:j.eq,nombre:j.nombre,pos:j.pos,rol:j.rol,rolInicial:j.rolInicial,linea:j.linea,grl:j.grl,origenAtributos:j.origenAtributos,
   vmax:r2(j.vmax),acc:r2(j.acc),energiaFinal:r2(j.energia),...j.s,distancia:MATH.round(j.s.distancia),
   amarilla:j.amarilla,expulsado:j.expulsado,lesion:j.lesion?{grave:j.lesion.grave,motivo:j.lesion.motivo}:null,enCanchaAlFinal:!j.fuera})),
  eventos:this.eventos,cinta};
};

/* equipo = {name, players:[{name,pos,grl,age,role?}...] (11 titulares primero), tac?:{formation}}
   opt = {semilla (número o texto), cinta (false para no guardarla), cintaCada (ticks entre muestras, 5 por defecto),
          arbitro ({severidad, precision}, como en el motor v2), forzarRoja ({equipo, minuto}: solo para pruebas)}
   Los jugadores 12 a 20 de players son el banco de suplentes. */
/* partido en vivo: se crea y avanza de a un minuto (lo usa js/motor/conexion-v3.js para el partido del usuario) */
function enVivo(loc,vis,opt){
 opt=Object.assign({},opt||{});if(opt.semilla==null)opt.semilla=1;
 const R=mkRng(typeof opt.semilla==='number'?opt.semilla>>>0:hash(opt.semilla));
 const p=new Partido(loc,vis,R,opt);let leidos=0,enCurso=false,terminado=false;
 const porClave=(e,clave)=>p.eq[e].find(j=>j.clave===clave)||null;
 return{
  partido:p,
  get parte(){return p.parte},get terminado(){return terminado},
  /* arranca un tiempo (1 o 2); false si el partido se suspendió */
  empezar(parte){if(terminado)return false;const ok=p.iniciarParte(parte);enCurso=ok;if(!ok){terminado=true;if(p.suspendido&&!p.eventos.some(e=>e.tipo==='final'))p.ev('final',-1,null,{marcador:p.goles.slice(),suspendido:true})}return ok},
  /* avanza hasta el próximo minuto de juego; devuelve true cuando terminó el tiempo en curso */
  minuto(){if(!enCurso)return true;const obj=(MATH.floor(p.tParte/600)+1)*600;let fin=false;
   while(p.tParte<obj){if(p.paso()){fin=true;break}}
   if(fin){p.cerrarParte(p.parte);enCurso=false;if(p.parte===2||p.fin){terminado=true;if(p.suspendido&&!p.eventos.some(e=>e.tipo==='final'))p.ev('final',-1,null,{marcador:p.goles.slice(),suspendido:true})}}
   return fin},
  /* minuto de juego en curso (como el reloj: 1-45 y descuento) */
  reloj(){const k=MATH.floor(p.tParte/600);return{parte:p.parte,base:(p.parte===1?0:45)+MATH.min(k,45),extra:MATH.max(0,k-45),descuento:p.anadido[p.parte-1]}},
  eventosNuevos(){const n=p.eventos.slice(leidos);leidos=p.eventos.length;return n},
  jugador:(e,clave)=>porClave(e,clave),
  jugadorPorId:id=>p.J[id],
  enCancha:e=>p.eq[e].map(j=>j.clave),
  cambio(e,claveSale,rawEntra,motivo){const j=porClave(e,claveSale);if(!j)return false;p.cambio(e,j,rawEntra,motivo||'cambio');return true},
  retirar(e,clave){const j=porClave(e,clave);if(!j)return false;p.retirar(j);return true},
  tactica(e,tac){p.cambiarTactica(e,tac)},
  st:()=>p.st,goles:()=>p.goles.slice(),posesion(){const t=p.st.posTicks[0]+p.st.posTicks[1]||1;return MATH.round(100*p.st.posTicks[0]/t)},
  resultado(){return p.resultado()}
 };
}
function simular(loc,vis,opt){
 opt=Object.assign({},opt||{});if(opt.semilla==null)opt.semilla=1;
 const R=mkRng(typeof opt.semilla==='number'?opt.semilla>>>0:hash(opt.semilla));
 const p=new Partido(loc,vis,R,opt);p.jugar();return p.resultado();
}
/* leer un cuadro de la cinta: devuelve {t, pelota:{x,y,z,dueno,enJuego}, jugadores:[[x,y]...]} en metros */
function cuadro(cinta,k){const n=cinta.porCuadro,o=k*n,d=cinta.datos,J=[];
 for(let i=5;i<n;i+=2)J.push([d[o+i]/10,d[o+i+1]/10]);
 return{t:cinta.t[k],pelota:{x:d[o]/10,y:d[o+1]/10,z:d[o+2]/10,dueno:d[o+3],enJuego:d[o+4]===1},jugadores:J}}

/* roles de cada puesto de una formación (el 0 es el arquero), y la línea de cada rol */
function rolesDe(f){const pl=plantilla(f,10),nDef=pl.filter(q=>q[1]>=64).length;return['POR'].concat(pl.map(q=>rolDe(q[0],q[1],nDef)))}
root.MCMotorV3={VERSION,TPS,enVivo,TAC_BASE,FORMACIONES:Object.keys(PLANTILLAS),LINEA_ROL,rolesDe,_tactica:tactica,CANCHA:{largo:PW,ancho:PH,arco:[GY0,GY1],alturaArco:GH},simular,cuadro,_xg:xgDe,_trayectoria:trayectoria,_vAire:vAire,_velPaseRaso:d=>P.velPaseRaso(d)};
})(typeof window!=='undefined'?window:globalThis);
