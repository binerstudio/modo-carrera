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
const VERSION='3.0.0-e2';
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
  umbralPresion:62-Pz*30,                        // presiona cuando la pelota pasa esta altura (coordenadas propias)
  bloque:D>.33?'alto':D<-.33?'bajo':'medio'};
}
/* ---------- partido ---------- */
function Partido(loc,vis,R,opt){
 this.R=R;this.opt=opt;this.t=0;this.parte=1;this.tParte=0;this.estado='parado';
 this.eventos=[];this.equipos=[loc,vis];this.goles=[0,0];
 const z=()=>[0,0];
 this.st={pases:z(),pasesOk:z(),pasesAltos:z(),remates:z(),alArco:z(),atajadas:z(),bloqueos:z(),palos:z(),corners:z(),laterales:z(),saquesArco:z(),
  quites:z(),intercepciones:z(),gambetas:z(),gambetasOk:z(),cabezazos:z(),xg:z(),posTicks:z(),ticksJuego:0,
  posesiones:z(),recuperaciones:z(),recupCampoRival:z(),alturaRecup:z(),pelotazos:z(),desmarques:z(),paredes:z(),cambiosFrente:z(),contras:z(),contrapresiones:z(),repliegues:z()};
 this.trans=[null,null];this.lin=[30,30];this.ctrlEq=-1;
 const mf=()=>({n:0,largo:0,ancho:0,dDM:0,dMA:0,linea:0,bloque:0,alin:0});this.md=[[mf(),mf()],[mf(),mf()]];
 this.J=[];this.eq=[[],[]];
 [loc,vis].forEach((T,e)=>{
  const lista=(T.players||[]).slice(0,11);
  if(lista.length<7)throw new Error('motor v3: '+(T.name||'equipo')+' tiene menos de 7 jugadores');
  let gk=lista.findIndex(p=>GRUPO((p.p||p).pos)==='POR');if(gk<0)gk=0;
  const orden=[lista[gk]].concat(lista.filter((_,i)=>i!==gk));
  const tac=tactica(T.tac);this.tac=this.tac||[];this.tac[e]=tac;
  const pl=plantilla(tac.formation,orden.length-1),nDef=pl.filter(q=>q[1]>=64).length,umax=MATH.max(...pl.map(q=>MATH.abs(q[0]-50)/50))||1;
  orden.forEach((raw,i)=>{
   const sl=i>0?pl[i-1]:[50,88],rol=i===0?'POR':rolDe(sl[0],sl[1],nDef),rel=i===0?0:clamp((73-sl[1])/58,0,1),uy=i===0?0:(sl[0]-50)/50/umax;
   const p0=raw.p||raw,info={name:p0.name,pos:p0.pos,grl:+(p0.rating||p0.grl||raw.r)||60,age:+p0.age||26,atributos:p0.atributos};
   const A=atributos(info),a=A.v;
   const j={id:this.J.length,eq:e,i,nombre:String(info.name||('Jugador '+(i+1))),pos:GRUPO(info.pos),rol,linea:i===0?'arq':LINEA_ROL[rol],rel,uy,grl:info.grl,a,origenAtributos:A.origen,
    gk:i===0,bx:i===0?3:30+rel*36,by:i===0?34:34+uy*23,apoyo:null,corrida:null,pared:null,
    vmax:6.6+(a.velocidad-50)*.05,acc:3+(a.aceleracion-50)*.04,energia:1,
    x:0,y:0,vx:0,vy:0,tx:0,ty:0,urg:.6,cdToque:0,cdEntrada:0,superado:0,ctrl:0,prox:0,accion:null,manos:false,conPelota:0,recibioDe:null,recibir:null,saque:null,tiroTarget:false,_marca:-1,
    s:{pases:0,pasesOk:0,remates:0,goles:0,asist:0,quites:0,intercepciones:0,gambetas:0,distancia:0}};
   if(j.gk){j.vmax=6.2+(a.velocidad-50)*.03;j.acc=3.2+(a.reflejos-50)*.02}
   this.J.push(j);this.eq[e].push(j);
  });
 });
 this.B={x:52.5,y:34,z:0,vx:0,vy:0,vz:0,dueno:null,ultimo:null,tipo:'muerta',desde:null,destino:null,tiro:null,ultTiro:null,enRed:false,sinDueno:0};
 const ad=[1+MATH.floor(R()*3),2+MATH.floor(R()*4)];
 this.duracion=[(45+ad[0])*60*TPS,(45+ad[1])*60*TPS];this.anadido=ad;
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
 if(j){o.jugador=j.nombre;o.jid=j.id}
 if(extra)for(const k in extra)o[k]=extra[k];
 o.x=+this.B.x.toFixed(1);o.y=+this.B.y.toFixed(1);
 this.eventos.push(o);return o};

/* ---------- utilidades de la cancha ---------- */
P.energiaVmax=function(j){return j.vmax*(.85+.15*j.energia)*(j.superado>0?.55:1)};
/* valor de tener la pelota en (ax,ay) para el equipo que ataca hacia x=105 */
function V(ax,ay){const dx=PW-ax,dy=ay-34,dg=hyp(dx,dy),r=ax/PW;return .01+.06*r*r+.2*MATH.exp(-dg/9)}
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
P.reanudar=function(tipo,e,x,y,espera){
 const B=this.B;B.x=x;B.y=y;B.z=0;B.vx=B.vy=B.vz=0;B.dueno=null;B.tiro=null;B.ultTiro=null;B.tipo='muerta';B.destino=null;B.enRed=false;
 for(const j of this.J){j.manos=false;j.accion=null;j.ctrl=0;j.superado=0}
 let ej;
 const eqJ=this.eq[e].filter(j=>!j.gk);
 if(tipo==='saque_arco')ej=this.eq[e][0];
 else if(tipo==='saque_centro'){ej=eqJ.filter(j=>j.pos==='DEL')[0]||eqJ[eqJ.length-1]}
 else{ej=eqJ.slice().sort((a,b)=>hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y)||a.id-b.id)[0]}
 this.estado='parado';this.rean={tipo,e,x,y,ej,timer:espera};
 if(tipo!=='saque_centro')this.ev(tipo,e,ej);
};
P.colocarSaqueCentro=function(e){
 for(const j of this.J){const mio=j.eq===e;let ax=j.gk?3:MATH.min(j.bx*.85,mio?50:42),ay=j.by;
  j.x=this.wx(j.eq,ax);j.y=this.wy(j.eq,ay);j.vx=j.vy=0}
 const ej=this.rean.ej;ej.x=52.5-this.dir(e)*.6;ej.y=34;
};
P.ejecutarReanudacion=function(){
 const r=this.rean,B=this.B;if(r.tipo==='saque_centro')this.colocarSaqueCentro(r.e);
 const ej=r.ej;
 if(r.tipo!=='saque_centro'){const d=this.dir(r.e);ej.x=clamp(r.x-d*.5,-.5,PW+.5);ej.y=r.y;ej.vx=ej.vy=0}
 this.cambioPosesion(r.e,r.x,false);
 B.x=r.x;B.y=r.y;B.dueno=ej;B.ultimo=ej;B.tipo='control';ej.ctrl=0;ej.prox=this.t;ej.conPelota=0;ej.saque=r.tipo;
 if(r.tipo==='saque_centro')this.ev('saque_centro',r.e,ej);
 this.estado='juego';this.rean=null;
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
  if(u&&u.eq===def){this.st.corners[1-def]++;this.reanudar('corner',1-def,lado===0?.3:PW-.3,B.y<34?.3:PH-.3,200)}
  else{this.st.saquesArco[def]++;this.reanudar('saque_arco',def,lado===0?5.5:PW-5.5,B.y<34?29:39,140)}
  return true}
 return false;
};
P.gol=function(e){
 const B=this.B,u=B.ultimo,tiro=B.tiro;this.goles[e]++;
 let autor=null,enContra=false,asist=null;
 const ut=B.ultTiro;
 if(u&&u.eq!==e&&ut&&ut.j.eq===e&&this.t-ut.t0<40&&!B.dueno){autor=ut.j;asist=autor.recibioDe&&autor.recibioDe.eq===e&&autor.recibioDe!==autor?autor.recibioDe:null}
 else if(u&&u.eq===e){autor=(tiro&&tiro.j.eq===e)?tiro.j:u;if(autor.recibioDe&&autor.recibioDe.eq===e&&autor.recibioDe!==autor)asist=autor.recibioDe}
 else if(u){autor=u;enContra=true}
 if(autor&&!enContra)autor.s.goles++;if(asist)asist.s.asist++;
 B.ultTiro=null;this.ev('gol',e,autor,{enContra,asistencia:asist?asist.nombre:null,aid:asist?asist.id:null,marcador:this.goles.slice(),xg:tiro?+tiro.xg.toFixed(3):null});
 B.enRed=true;
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
 if(!T.bloqueado&&B.z<1.7){for(const o of this.eq[1-e]){if(o.gk||T.vistos.has(o.id))continue;const d=hyp(o.x-B.x,o.y-B.y);
  if(d<.75){T.vistos.add(o.id);if(this.R()<.6){T.bloqueado=true;this.desviar(o,3,9,0,3);this.st.bloqueos[1-e]++;this.ev('bloqueo',1-e,o,{rematador:T.j.nombre});return false}}}}
 /* arquero: cuando la pelota llega a su altura */
 if(!T.gkVisto&&bax>=this.ax(e,gk.x)-.2){
  T.gkVisto=true;
  const lat=MATH.abs(B.y-gk.y),tv=(this.t-T.t0)*DT,a=gk.a,reac=.32-a.reflejos*.002;
  const alcance=1+clamp((tv-reac)*6,0,1.7+a.estirada*.013),sp=hyp(B.vx,B.vy);
  if(lat<=alcance&&B.z<=2.7&&!gk.superado){
   const p=lat<.5?.96:clamp(.95-.3*(lat/alcance)-MATH.max(0,sp-24)*.012+(a.reflejos-70)*.004,.05,.97);
   if(this.R()<p){
    this.st.atajadas[1-e]++;
    const pc=clamp(.25+a.manejo*.006-(sp-15)*.02,.05,.9);
    if(this.R()<pc&&this.enArea(gk)){this.ev('atajada',1-e,gk,{rematador:T.j.nombre,retenida:true});this.tomar(gk,true);return false}
    this.ev('atajada',1-e,gk,{rematador:T.j.nombre,retenida:false});
    const s=B.y>gk.y?1:-1;B.vx=-B.vx*(.15+this.R()*.25);B.vy=s*(3+this.R()*6);B.vz=1+this.R()*3;B.z=MATH.max(B.z,.2);B.ultimo=gk;B.tiro=null;gk.cdToque=6;
   }
  }
 }
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
 this.cambioPosesion(j.eq,j.x,this.estado==='juego');
 /* pared: devolución al que había pasado y picó */
 if(prev==='pase'&&desde&&desde.eq===j.eq&&desde.recibioDe===j&&j.pared&&this.t-j.pared.t0<45){this.st.paredes[j.eq]++;j.pared=null}
 if(prev==='pase'&&desde){
  if(desde.eq===j.eq){if(j!==desde){this.st.pasesOk[j.eq]++;desde.s.pasesOk++;j.recibioDe=desde}}
  else{this.st.intercepciones[j.eq]++;j.s.intercepciones++;this.ev('intercepcion',j.eq,j,{pasador:desde.nombre});j.recibioDe=null}
 }else if(!B.ultimo||B.ultimo.eq!==j.eq)j.recibioDe=null;
 B.dueno=j;B.ultimo=j;B.tipo='control';B.tiro=null;B.destino=null;B.desde=null;B.vx=B.vy=B.vz=0;B.z=0;
 j.manos=!!manos;j.conPelota=0;j.accion=null;
 j.ctrl=manos?18+MATH.floor(this.R()*15):clamp(MATH.round(3-(j.a.control-50)/25),1,4);j.prox=this.t+j.ctrl;
};
P.controles=function(){
 const B=this.B,R=this.R;if(B.enRed)return;
 const cand=[];
 for(const j of this.J){if(j.cdToque>0)continue;const d=hyp(j.x-B.x,j.y-B.y);if(d<1.5)cand.push([d,j])}
 if(!cand.length)return;
 cand.sort((a,b)=>a[0]-b[0]||a[1].id-b[1].id);
 for(const [d,j] of cand){
  const a=j.a,rel=hyp(B.vx-j.vx,B.vy-j.vy);
  const intercepta=B.tipo==='pase'&&B.desde&&B.desde.eq!==j.eq;
  if(j.gk&&this.enArea(j)&&d<1.4&&B.z<2.7){
   const p=clamp(.85+a.manejo*.0015-MATH.max(0,rel-15)*.03,.2,.98);
   if(R()<p){this.tomar(j,true);return}
   this.desviar(j,2,6,.3,2);return;
  }
  if(d<.9&&B.z<1.0){
   let p=.99-MATH.max(0,rel-10)*.03-(B.z>.3?.1:0)-(85-a.control)*.003;if(intercepta)p*=.8;
   if(R()<clamp(p,.05,.98)){this.tomar(j,false);return}
   j.cdToque=4;const k=.5+R()*.2,an=(R()-.5)*1.2,c=MATH.cos(an),s=MATH.sin(an),vx=B.vx*k,vy=B.vy*k;
   B.vx=vx*c-vy*s;B.vy=vx*s+vy*c;B.ultimo=j;if(B.tipo==='pase'&&intercepta){B.tipo='suelta'}continue;
  }
  if(d<.8&&B.z>=1.0&&B.z<1.95+a.salto*.008){this.cabezazo(j);return}
 }
};
P.cabezazo=function(j){
 const B=this.B,R=this.R,e=j.eq,a=j.a;this.st.cabezazos[e]++;
 j.cdToque=5;B.ultimo=j;B.tipo='suelta';B.destino=null;B.desde=null;
 const ax=this.ax(e,j.x),ay=this.ay(e,j.y);
 if(ax>PW-AREA_X&&ay>AREA_Y0&&ay<AREA_Y1&&R()<.8){this.remate(j,true);return}
 /* despeje o pase de cabeza: hacia adelante del propio equipo */
 const d=this.dir(e),an=(R()-.5)*1.6,sp=8+R()*5+(a.cabeceo-60)*.03;
 B.vx=d*MATH.cos(an)*sp;B.vy=MATH.sin(an)*sp*(d);B.vz=3+R()*2;B.z=MATH.max(B.z,1);B.tiro=null;
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
   const l=hyp(o.x-tx,o.y-ty),to=reac+MATH.max(0,l-1.2)/ve,tm=MATH.max(tLlega,tr);
   const p=1/(1+MATH.exp(-(tm-to-.1)*3))*.75;libre*=1-p;
   if(hyp(o.x-bx,o.y-by)<1.6)libre*=.8;
  }
 }
 /* por arriba cerca de una línea: se puede ir afuera con el pique */
 if(alto){const ax=this.ax(e,tx),ay=this.ay(e,ty);if(ax>PW-14)libre*=.55+.03*(PW-ax);if(ay<6||ay>PH-6)libre*=.75}
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
 const pesoPerder=1.25+(T.posesion?.6:0)+(1-T.directo)*.4,avance=contra?.03:T.directo*.012;
 const salida=(j.gk||j.linea==='def')&&ax<35;
 const opts=[];
 /* 1) remate */
 if(!saque&&!j.manos){const dg=hyp(PW-ax,34-ay);if(dg<34){
  let xg=xgDe(ax,ay)*(1+(a.definicion-65)*.006)*(1-.22*pr.p);
  /* rivales en el cono de tiro */
  let bloq=0;for(const o of this.eq[1-e]){if(o.gk)continue;const oax=this.ax(e,o.x),oay=this.ay(e,o.y);if(oax<=ax)continue;
   const tt=(oax-ax)/(PW-ax),yl=ay+(34-ay)*tt;if(MATH.abs(oay-yl)<1.2+3.66*tt)bloq++}
  xg*=MATH.pow(.8,bloq);
  opts.push({u:xg*(.95+.15*T.M),tipo:'tiro',xg})}}
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
  const qax=this.ax(e,q.x);if(qax>offs+.5&&!saque)continue;          // no se le pasa a quien está adelantado
  if(saque==='saque_centro'&&qax>52.5)continue;
  let rRaso=1;
  for(const alto of [false,true]){
   if(saque==='lateral'&&d0>28)continue;
   if(alto&&d0<18&&saque!=='lateral')continue;
   if(alto&&saque!=='lateral'&&saque!=='corner'&&rRaso<.35&&d0<32)continue;
   if(!alto&&saque==='lateral')continue;
   const vz=alto?1:0,vh=alto?clamp(d0/1.9,7,18):this.velPaseRaso(d0),vavg=alto?vh:vh*.85,tEst=d0/vavg;
   const ad=q.corrida&&q.corrida.hasta>this.t?1:.7;let tx=clamp(q.x+q.vx*tEst*ad,2,PW-2),ty=clamp(q.y+q.vy*tEst*ad,2.5,PH-2.5);
   const tax=this.ax(e,tx),tay=this.ay(e,ty);
   if(V(tax,tay)*(alto?.8:1)<cota-.01)continue;            // poda: ni sin riesgo superaría lo mejor
   const r=this.riesgoPase(j,tx,ty,vavg,alto,q),pq=this.presion(e,tx,ty);if(!alto)rRaso=r;
   const mx=this.ax(e,(j.x+tx)/2),my=this.ay(e,(j.y+ty)/2);
   const habil=alto?(a.paseLargo+(tax>PW-AREA_X?a.centros:a.paseLargo))/2:(d0<25?a.paseCorto:a.paseLargo);
   const fallo=clamp(.01+(100-habil)*.0012+(alto?.14:0)+d0*.001,0,.6);
   const exito=(1-r)*(1-fallo);
   let u=exito*V(tax,tay)*(1-.25*pq.p)*(alto?.72:1)-(1-exito)*V(PW-mx,PH-my)*pesoPerder;
   const prog=tax-ax;
   u+=avance*MATH.max(0,prog)/20*exito;
   if(T.posesion&&d0<22&&!alto)u+=.008*exito;                                       // posesión: pase corto seguro
   if(salida){if(pr.dmin>6&&T.directo<.6){if(!alto&&d0<30)u+=.006*exito;else if(alto)u-=.012}  // salida desde el fondo
    else if(alto&&prog>15)u+=.014*(.5+T.directo)}                                   // presionado o directo: pelotazo
   if(alto&&prog>20)u+=T.directo*.012;
   if(MATH.abs(ty-j.y)>28&&pr.p>.4&&pq.p<.3)u+=.006*(1+T.W*.5)*exito;                       // cambio de frente
   if(q.pared&&q.pared.hasta>this.t&&j.recibioDe===q)u+=.012*exito;                // pared: devolverla al que picó
   if(q.corrida&&q.corrida.hasta>this.t)u+=.006*exito;                             // pase al que pica al espacio
   opts.push({u,tipo:'pase',q,tx,ty,alto,vh,vz,d:d0,r});if(u>cota)cota=u
  }
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
 j.saque=null;
 const Q=this.tac[e].Q,reac=clamp(MATH.round(3-(j.a.reacciones-50)/30-Q),1,5);
 if(op.tipo==='conducir'){j.accion={tipo:'conducir',dx:op.dx,dy:op.dy,vel:op.vel};const pr=this.presion(e,j.x,j.y);j.prox=this.t+reac+(pr.dmin>5?3:pr.dmin>3?1:0);return}
 if(op.tipo==='gambeta'){
  this.st.gambetas[e]++;j.s.gambetas++;const D=op.D,ok=R()<op.ps;
  this.ev('gambeta',e,j,{rival:D.nombre,ok});
  if(ok){this.st.gambetasOk[e]++;D.superado=14;D.cdEntrada=16;
   const d=this.dir(e),c=MATH.cos(op.s*.7),s=MATH.sin(op.s*.7);j.accion={tipo:'gambeta',dx:d*c,dy:d*s,vel:this.energiaVmax(j)*.95};j.prox=this.t+8}
  else{this.st.quites[D.eq]++;D.s.quites++;this.ev('quite',D.eq,D,{a:j.nombre});
   if(R()<.55){this.tomar(D,false)}else{B.dueno=null;this.desviar(D,3,7,0,.5);D.cdToque=2;j.cdToque=6}
   j.cdEntrada=10}
  return}
 if(op.tipo==='tiro'){this.remate(j,false,op.xg);return}
 this.pasar(j,op);
};
P.pasar=function(j,op){
 const B=this.B,R=this.R,e=j.eq,a=j.a,pr=this.presion(e,j.x,j.y);
 const dx=op.tx-j.x,dy=op.ty-j.y,d=hyp(dx,dy)||1;
 const tax=this.ax(e,op.tx);
 const habil=j.saque==='lateral'?a.paseCorto:op.alto?(tax>PW-AREA_X?a.centros:a.paseLargo):(d<25?a.paseCorto:a.paseLargo);
 const sig=(.02+(100-habil)*.0012)*(1+pr.p*.8)*(op.alto?1.5:1);
 const an=MATH.atan2(dy,dx)+R.g()*sig,ld=d*(1+R.g()*(.04+(100-habil)*.0008));
 B.dueno=null;B.tipo='pase';B.desde=j;B.destino=op.q;B.ultimo=j;B.tiro=null;B.z=op.alto?.1:0;
 if(op.alto){const vh0=j.saque==='lateral'?clamp(ld/1.1,6,13):clamp(ld/1.9,7,18),T=ld/vh0,vh=vAire(ld,T);B.vx=MATH.cos(an)*vh;B.vy=MATH.sin(an)*vh;B.vz=G*T/2;
  if(j.saque==='lateral'){B.z=2;B.vz=MATH.max(0,(G*T*T/2-2)/T)}}
 else{const v0=this.velPaseRaso(ld);B.vx=MATH.cos(an)*v0;B.vy=MATH.sin(an)*v0;B.vz=0}
 B.x=j.x+MATH.cos(an)*.4;B.y=j.y+MATH.sin(an)*.4;
 j.cdToque=4;j.accion=null;j.manos=false;
 this.st.pases[e]++;j.s.pases++;if(op.alto)this.st.pasesAltos[e]++;
 const prog=this.ax(e,op.tx)-this.ax(e,j.x);
 if(op.alto&&d>30&&prog>15)this.st.pelotazos[e]++;
 if(MATH.abs(op.ty-j.y)>30&&MATH.abs(op.ty-j.y)>MATH.abs(prog))this.st.cambiosFrente[e]++;
 /* pared: después de un pase corto, el que pasó pica al espacio para recibirla de vuelta */
 if(op.q&&!op.alto&&d<18&&prog>-3&&pr.dmin<5&&!j.gk&&this.R()<.5){const g=this.dir(e);
  j.pared={x:clamp(j.x+g*10,1,PW-1),y:clamp(j.y+(op.ty-j.y)*.3,2,PH-2),hasta:this.t+25,t0:this.t}}
 if(op.q){op.q.recibir={x:op.tx,y:op.ty,hasta:this.t+40}}
 this.ev('pase',e,j,{receptor:op.q?op.q.nombre:null,rid:op.q?op.q.id:null,alto:!!op.alto,dist:+d.toFixed(1)});
};
P.remate=function(j,cabeza,xg0){
 const B=this.B,R=this.R,e=j.eq,a=j.a,gk=this.eq[1-e][0];
 const ax=this.ax(e,j.x),ay=this.ay(e,j.y),dg=hyp(PW-ax,34-ay),pr=this.presion(e,j.x,j.y);
 const xg=xgDe(ax,ay)*(cabeza?.55:1);
 /* apunta al palo más lejano del arquero */
 const gay=this.ay(e,gk.y),lado=gay>34?-1:1,y0=34+lado*(1.2+R()*2.1);
 const habil=cabeza?a.cabeceo:(dg<16?(a.definicion+a.tiro)/2:a.tiro);
 const sig=(.05+(100-habil)*.002)*(1+.7*pr.p)*(cabeza?1.4:1);
 const ang=MATH.atan2(y0-ay,PW-ax)+R.g()*sig;
 const vh=cabeza?10+R()*5+(a.cabeceo-60)*.05:(16+a.potencia*.13)*(dg<10?.85:1)*(1-R()*.15);
 const T=(PW-ax)/MATH.max(.2,MATH.cos(ang))/vh;
 const zt=clamp(.25+R()*1.5+R.g()*(.3+dg*.03)*(1.3-habil/100),-.5,6);
 const ex=this.dir(e);
 B.dueno=null;B.tipo='tiro';B.desde=null;B.destino=null;B.ultimo=j;
 B.vx=ex*MATH.cos(ang)*vh;B.vy=ex*MATH.sin(ang)*vh;B.vz=MATH.max(0,(zt+.5*G*T*T)/T)-(cabeza?2:0);B.z=cabeza?MATH.max(B.z,1.5):.1;
 /* ¿va al arco? (proyección sin desvíos) */
 const yg=ay+MATH.tan(ang)*(PW-ax),zg=B.z+B.vz*T-.5*G*T*T;
 const aPuerta=yg>GY0+BR&&yg<GY1-BR&&zg<GH-BR&&zg>-1;
 B.tiro={j,t0:this.t,xg,aPuerta,vistos:new Set(),gkVisto:false,bloqueado:false};B.ultTiro=B.tiro;
 this.st.remates[e]++;j.s.remates++;this.st.xg[e]+=xg;if(aPuerta)this.st.alArco[e]++;
 j.cdToque=5;j.accion=null;
 this.ev('remate',e,j,{aPuerta,cabeza:!!cabeza,xg:+xg.toFixed(3),dist:+dg.toFixed(1),arquero:gk.nombre});
};

/* ---------- entradas ---------- */
P.entradas=function(){
 const B=this.B,c=B.dueno,R=this.R;if(!c||c.manos)return;
 for(const o of this.eq[1-c.eq]){
  if(o.gk&&!this.enArea(o))continue;
  if(o.cdEntrada>0||o.superado>0)continue;
  const d=hyp(o.x-c.x,o.y-c.y);if(d>1.4)continue;
  if(R()>(d<1?.16:.07))continue;
  o.cdEntrada=8;
  const g=this.dir(c.eq),frente=(o.x-c.x)*g>0;
  const p=clamp(.36+(o.a.entradas-(c.a.regate+c.a.equilibrio)/2)*.008+(c.conPelota<4?.08:0)+(frente?.1:0)-(c.accion&&c.accion.tipo==='gambeta'?.1:0),.08,.85);
  if(R()<p){this.st.quites[o.eq]++;o.s.quites++;this.ev('quite',o.eq,o,{a:c.nombre});
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
  if(!c)this.pelotaSuelta();
 }
 /* arquero ante un remate: se tira hacia la trayectoria */
 if(B.tiro){const e=1-B.tiro.j.eq,gk=this.eq[e][0],sp=hyp(B.vx,B.vy);
  if(sp>1&&MATH.abs(B.vx)>.1){const t=(gk.x-B.x)/B.vx;if(t>0){gk.tx=gk.x;gk.ty=clamp(B.y+B.vy*t,GY0-1.5,GY1+1.5);gk.urg=1;gk.tiroTarget=true}}}
 /* en reanudaciones: el ejecutor va al lugar; en el saque del medio, cada uno en su campo */
 if(this.estado==='parado'&&this.rean){const r=this.rean;
  if(r.tipo==='saque_centro'){for(const j of this.J){const mio=j.eq===r.e;const ax=j.gk?3:MATH.min(j.bx*.85,mio?50:42);j.tx=this.wx(j.eq,ax);j.ty=this.wy(j.eq,j.by);j.urg=.5}}
  else if(r.tipo==='corner'){for(const j of this.eq[1-r.e])if(hyp(j.tx-r.x,j.ty-r.y)<9.15){const a=MATH.atan2(j.ty-r.y,j.tx-r.x);j.tx=r.x+MATH.cos(a)*9.2;j.ty=r.y+MATH.sin(a)*9.2}}
  r.ej.tx=r.x-this.dir(r.e)*.5;r.ej.ty=r.y;r.ej.urg=1}
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
   else if(con){ax=clamp(linea*.4,5,20);ay=34+(bay-34)*.1}                            // arquero adelantado, detrás de su línea
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
    ax=MATH.min(ax,offs-.7);
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
   if(rx<lin-1&&rx<AREA_X+8){ax=rx-1.5;ay=ry+(34-ry)*.15}}                                          // ya entró al área: lo toma
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
 for(const j of this.J){
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
  const r=sp/j.vmax;j.energia=clamp(j.energia-DT*(.00012+.0011*r*r*r)*(1.5-j.a.resistencia/100)+(sp<2?DT*.0003:0),.3,1);
  if(j.cdToque>0)j.cdToque--;if(j.cdEntrada>0)j.cdEntrada--;if(j.superado>0)j.superado--;
 }
 /* choques: nadie atraviesa a nadie */
 const J=this.J,n=J.length;
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
  if(!c.manos&&(c.x<.4||c.x>PW-.4||c.y<.4||c.y>PH-.4)){
   /* se le va por la línea: queda suelta y sale */
   if(B.x<-BR||B.x>PW+BR||B.y<-BR||B.y>PH+BR){B.dueno=null;B.tipo='suelta';this.salida()}
   else{c.x=clamp(c.x,.4,PW-.4);c.y=clamp(c.y,.4,PH-.4);if(c.accion){c.accion=null;c.prox=this.t}}
  }
 }
};

/* ---------- un tick ---------- */
P.tick=function(){
 const B=this.B;
 if(this.estado==='parado'){
  this.objetivos();this.mover();
  const r=this.rean;if(r){r.timer--;B.x=r.x;B.y=r.y;B.z=0;B.vx=B.vy=B.vz=0;
   const d=hyp(r.ej.x-r.x,r.ej.y-r.y);if(r.timer<=0&&(d<2||r.timer<-40))this.ejecutarReanudacion()}
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
 }
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
 for(const j of this.J){f.push(MATH.round(j.x*10),MATH.round(j.y*10))}
 this.cinta.t.push(this.t);for(const v of f)this.cinta.d.push(v);
};
P.jugar=function(){
 for(const parte of [1,2]){
  this.parte=parte;this.tParte=0;
  const e=parte===1?0:1;
  this.estado='parado';this.rean={tipo:'saque_centro',e,x:52.5,y:34,ej:null,timer:0};
  const eqJ=this.eq[e].filter(j=>!j.gk);this.rean.ej=eqJ.filter(j=>j.pos==='DEL')[0]||eqJ[eqJ.length-1];
  this.colocarSaqueCentro(e);
  for(const j of this.J){j.energia=MATH.min(1,j.energia+(parte===2?.08:0));j.accion=null;j.manos=false;j.superado=0;j.cdToque=0}
  this.ev(parte===1?'inicio':'segundo_tiempo',e,null);
  this.ejecutarReanudacion();
  const fin=this.duracion[parte-1];
  while(this.tParte<fin)this.tick();
  this.ev(parte===1?'entretiempo':'final',-1,null,{marcador:this.goles.slice()});
 }
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
   contras:st.contras,contrapresiones:st.contrapresiones,repliegues:st.repliegues},
  tactica:this.tac.map(T=>({estilo:T.style,formacion:T.formation,bloque:T.bloque,directo:r2(T.directo),contrapresion:T.contrapresion,umbralPresion:r2(T.umbralPresion)})),
  forma:this.md.map(f=>{const o=A=>{const k=A.n||1;return{muestras:A.n,largo:r2(A.largo/k),ancho:r2(A.ancho/k),entreLineas:[r2(A.dDM/k),r2(A.dMA/k)],alturaLinea:r2(A.linea/k),alturaBloque:r2(A.bloque/k),alineacionLinea:r2(A.alin/k)}};return{con:o(f[0]),sin:o(f[1])}}),
  jugadores:this.J.map(j=>({id:j.id,equipo:j.eq,nombre:j.nombre,pos:j.pos,rol:j.rol,linea:j.linea,grl:j.grl,origenAtributos:j.origenAtributos,
   vmax:r2(j.vmax),acc:r2(j.acc),energiaFinal:r2(j.energia),...j.s,distancia:MATH.round(j.s.distancia)})),
  eventos:this.eventos,cinta};
};

/* equipo = {name, players:[{name,pos,grl,age,role?}...] (11 titulares primero), tac?:{formation}}
   opt = {semilla (número o texto), cinta (false para no guardarla), cintaCada (ticks entre muestras, 5 por defecto)} */
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
root.MCMotorV3={VERSION,TPS,TAC_BASE,FORMACIONES:Object.keys(PLANTILLAS),LINEA_ROL,rolesDe,_tactica:tactica,CANCHA:{largo:PW,ancho:PH,arco:[GY0,GY1],alturaArco:GH},simular,cuadro,_xg:xgDe,_trayectoria:trayectoria,_vAire:vAire,_velPaseRaso:d=>P.velPaseRaso(d)};
})(typeof window!=='undefined'?window:globalThis);
