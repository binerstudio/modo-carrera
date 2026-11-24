/* ===== MODO CARRERA · SIMULADOR 2D ANIMADO (12.6) =====
   Dibuja el partido EN VIVO a partir de lo que calcula el motor (v1 o v2). No decide nada:
   - Cada evento real del motor (gol, remate, atajada, penal, córner, falta, tarjeta, offside, VAR,
     error, lesión, cambio, descanso, final) se convierte en una jugada animada con los MISMOS
     jugadores que intervinieron (autor, asistente, defensor, arquero).
   - Mientras se muestra una jugada importante, el reloj del motor espera (MC2D.retener), y el
     marcador y la lista de eventos solo muestran lo que ya se vio (MC2D.marcador / MC2D.corte).
   - Entre jugada y jugada, los 22 se ubican según formación, táctica y posesión del motor, y la
     pelota circula con el equipo que tiene la posesión que calcula el motor.
   - Velocidad, aceleración, regate y visión de cada jugador (atributos) cambian cómo se mueve.
   - Usa su PROPIO generador de azar: nunca toca Math.random, así no altera ningún resultado.
   Cámaras: TV (predeterminada, sigue la pelota), Cenital, Seguimiento y Táctica. */
(function(){
'use strict';
const PW=105,PH=68,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
let seed=987654321;const rnd=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+rnd()*(b-a),pick=a=>a[Math.floor(rnd()*a.length)];
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const CAMS=[['tv','TV'],['cen','Cenital'],['seg','Seguimiento'],['tac','Táctica']];
let camPref='tv';try{camPref=localStorage.getItem('mc_cam')||'tv'}catch(e){}

const S={m:null,cv:null,cx:null,host:null,w:0,h:0,dpr:1,sp:[],byKey:new Map(),ref:null,ball:null,
 owner:null,posTeam:0,timer:0,queue:[],play:null,posId:0,tele:0,pressers:[],shown:0,goles:[0,0],t:0,last:0,camX:52.5,camY:34,banner:null,big:null,raf:0,kits:null,half:1,phase:''};

/* ---------- jugadores ---------- */
function atr(e){try{const p=e.p||e;return window.MCAtributos?MCAtributos.de({name:p.name,pos:p.pos,grl:p.rating||e.r||p.grl||60,age:p.age||e.age||26}).v:null}catch(x){return null}}
function nombre(e){return e.p?e.p.name:e.name}
function corto(n){n=String(n||'');const a=n.split(' ');return a.length>1?a[a.length-1]:n}
function skinOf(n){let h=0;for(const c of String(n))h=(h*31+c.charCodeAt(0))|0;return['#f1c9a5','#e0ac83','#c68a5e','#9c6644','#6f4a2f','#f3d2b3'][Math.abs(h)%6]}
function mkSprite(e,team,i){const a=atr(e)||{};const vel=a.velocidad||65,ac=a.aceleracion||65;
 return{key:e.key,e,team,i,name:nombre(e),num:e.p?(e.p.number||i+1):i+1,g:e.g,role:e.role,gk:e.g==='POR',
  x:52.5,y:34,vx:0,vy:0,tx:52.5,ty:34,ov:null,face:team===0?1:-1,ph:rnd()*6,
  vmax:5.6+(vel-50)*.05,acc:3.2+(ac-50)*.05,reg:a.regate||60,vis:a.vision||60,pose:'run',poseT:0,poseD:0,alpha:1,out:false,skin:skinOf(nombre(e)),card:null,
  cad:.88+((a.agilidad||60)-40)/220+(skinOf(nombre(e)).charCodeAt(2)%7)*.01,pie:(String(nombre(e)).length%4===0)?'izq':'der',estado:'quieto',tactico:'',marca:null,dBall:99}}
function dirOf(team){/* +1 ataca hacia x=105 */const flip=S.half===2?-1:1;return team===0?flip:-flip}
function syncPlayers(){const m=S.m;const lists=[m.own||[],m.riv||[]];const seen=new Set();
 lists.forEach((L,team)=>L.forEach((e,i)=>{seen.add(e.key);let s=S.byKey.get(e.key);
  if(!s){s=mkSprite(e,team,i);S.byKey.set(e.key,s);S.sp.push(s);
   if(S.sp.length>22&&S.phase!=='pre'){s.x=52.5;s.y=PH+1.5;s.tx=52.5;s.ty=PH-4}else{const p=formPos(s);s.x=p[0];s.y=p[1]}}
  s.e=e;s.i=i;s.g=e.g;s.role=e.role;s.gk=e.g==='POR';s.out=false}));
 S.sp.forEach(s=>{if(!seen.has(s.key)&&!s.out){s.out=true;s.ov={x:52.5,y:PH+3,run:.55}}});}

/* ---------- formación y táctica ---------- */
function tacOf(team){try{if(team===0&&window.mcOwnTac)return mcOwnTac();return S.m.tacR||{}}catch(e){return{}}}
function formOf(team){try{return team===0?(career.formation||'4-3-3'):((S.m.tacR&&S.m.tacR.formation)||'4-3-3')}catch(e){return'4-3-3'}}
function slot(s){let co=[];try{co=positions(formOf(s.team))}catch(e){}const c=co[s.i]||[50,50];return{d:clamp((88-c[1])/73,0,1),l:c[0]/100}}
/* ---------- forma del equipo (12.9) ----------
   El equipo se mueve como un bloque: la línea defensiva se ubica según la táctica (bloque bajo, medio o
   alto) y solo se corre un poco con la pelota; las líneas mantienen su distancia y el equipo cubre el ancho.
   Con la pelota se estira (más largo y más ancho) y los delanteros no pasan la línea del último defensor. */
function bloque(team){const t=tacOf(team),D=((t.depth??50)-50)/50;return D<-.35?'bajo':D>.35?'alto':'medio'}
function formPos(s){const dir=dirOf(s.team),b=S.ball||{x:52.5,y:34};
 const A=x=>dir>0?x:PW-x,ballA=A(b.x),poss=S.posTeam===s.team&&S.phase!=='pre';
 const t=tacOf(s.team),D=((t.depth??50)-50)/50,Wd=((t.width??50)-50)/50;
 const sl=slot(s);
 if(S.phase==='pre'||S.phase==='ht'||S.reset){const a=s.gk?4:clamp(8+sl.d*40,6,50);return[A(a),clamp(34+(sl.l-.5)*54,4,64)]}
 if(s.gk)return portero(s);
 let line,span,width;
 if(poss){line=clamp(ballA-30+D*4,16+D*6,50+D*6);span=38+D*3;width=58+Wd*6}
 else{const base=24+D*11;line=clamp(base+(ballA-52)*.32,8,46+D*4);span=28+D*3;width=44+Wd*4}
 let a=line+clamp((sl.d-.18)/.72,0,1)*span;
 let y=34+(sl.l-.5)*width+clamp((b.y-34)*(poss?.12:.3),-9,9);
 if(poss&&/^(LI|LD)$/.test(s.role||'')&&Wd>-.3&&ballA>42)a=Math.min(a+9+Wd*4,line+span);
 if(poss&&S.offside){a=Math.min(a,S.offside[s.team]-.6)}
 a+=Math.sin(S.t*.5+s.ph)*.8;y+=Math.cos(S.t*.45+s.ph*1.3)*.9;
 return[A(clamp(a,2,103)),clamp(y,2.5,65.5)]}
/* arquero: sobre la línea, alineado entre la pelota y el centro del arco; achica más cuanto más cerca está la pelota */
function portero(s){const own=dirOf(s.team)>0?0:PW,dir=dirOf(s.team),b=S.ball||{x:52.5,y:34};
 const dx=b.x-own,dy=b.y-34,d=Math.hypot(dx,dy)||1;
 let off=d>55?clamp(4+(dir>0?b.x-52.5:52.5-b.x)*.08,4,9):d>28?2.2:clamp(1.2+(28-d)*.12,1.2,4.6);
 const x=own+dir*Math.abs(dx/d)*off,y=34+dy/d*off;
 return[clamp(x,.5,104.5),clamp(y,29.8,38.2)]}
/* ---------- máquina de estados de cada jugador ----------
   estado (locomoción): quieto · caminando · trotando · corriendo · esprintando · frenando · girando
   acción (pose):       conduciendo · controlando · pasando · rematando · cabeceando · saltando · entrada · barrida
                        cayendo · levantandose · desequilibrio · amague · celebrando · abrazo · protesta · lamento
                        pide · atajando · estirada · saque · tarjeta
   táctico:             atacando · defendiendo · presionando · marcando · desmarcandose · apoyo                  */
const ACC_D={volea:.42,proteccion:.6,pasando:.32,rematando:.38,cabeceando:.55,saltando:.5,controlando:.3,entrada:.55,barrida:.75,cayendo:.9,levantandose:.6,
 desequilibrio:.45,amague:.4,celebrando:2.4,abrazo:1.6,protesta:1.3,lamento:2,pide:.8,atajando:.6,estirada:.95,saque:.45,tarjeta:1.4};
function accion(s,a,d){if(!s)return;s.pose=a;s.poseT=0;s.poseD=d||ACC_D[a]||.5}
const BLOQUEA=a=>a==='cayendo'||a==='estirada'||a==='barrida'||a==='levantandose';
function step(s,dt){
 if(s.pose&&s.pose!=='run'){s.poseT+=dt;if(s.poseT>=s.poseD){const prev=s.pose;s.pose='run';if(prev==='cayendo')accion(s,'levantandose')}}
 if(BLOQUEA(s.pose)){s.vx*=Math.pow(.15,dt);s.vy*=Math.pow(.15,dt);s.x+=s.vx*dt;s.y+=s.vy*dt;s.estado='quieto';return}
 let tx,ty,mul=1;
 if(s.ov){tx=s.ov.x;ty=s.ov.y;mul=s.ov.run||1}
 else{const p=objetivo(s);tx=p[0];ty=p[1];mul=p[2]}
 const dx=tx-s.x,dy=ty-s.y,dd=Math.hypot(dx,dy);
 const en=(window.MCMotor&&MCMotor.energia&&s.e)?(.85+.15*MCMotor.energia(s.e)):1,vm=s.vmax*mul*en;
 const want=dd<.35?0:Math.min(vm,dd*1.5),wx=dd?dx/dd*want:0,wy=dd?dy/dd*want:0;
 const sp0=Math.hypot(s.vx,s.vy);
 /* giro: si el objetivo queda a más de 70°, el jugador frena y gira antes de acelerar */
 let turn=false;if(sp0>2&&want>1){const c=(s.vx*wx+s.vy*wy)/(sp0*want);if(c<.34)turn=true}
 const amax=(turn?s.acc*1.6:s.acc)*dt;const ax=wx-s.vx,ay=wy-s.vy,al=Math.hypot(ax,ay);
 if(al>amax){s.vx+=ax/al*amax;s.vy+=ay/al*amax}else{s.vx=wx;s.vy=wy}
 const ox=s.x,oy=s.y;
 s.x+=s.vx*dt;s.y+=s.vy*dt;const sp=Math.hypot(s.vx,s.vy);s.ph+=dt*(1.6+sp*1.75)*s.cad;
 if(Math.hypot(s.x-ox,s.y-oy)>s.vmax*1.7*dt+.35){S.ptele=(S.ptele||0)+1;S.pteleLog={jugador:s.name,salto:+Math.hypot(s.x-ox,s.y-oy).toFixed(2)}}
 s.estado=turn?'girando':(sp<sp0-s.acc*dt*.6&&sp>1)?'frenando':sp<.3?'quieto':sp<1.8?'caminando':sp<3.8?'trotando':sp<6.2?'corriendo':'esprintando';
 const mira=(s.tactico==='marcando'||s.tactico==='defendiendo'||s.tactico==='presionando'||s.gk)&&S.ball&&S.owner!==s;
 if(mira&&sp<6.5)s.face=S.ball.x>=s.x?1:-1;else if(sp>.25)s.face=s.vx>=0?1:-1;else if(S.ball&&s.pose==='run')s.face=S.ball.x>=s.x?1:-1;
 s.back=sp>.6&&s.vx*s.face<-.4;s.lat=sp>.8&&Math.abs(s.vy)>1.8*Math.abs(s.vx);
 if(s.back&&s.estado!=='girando')s.estado='retrocediendo';else if(s.lat&&s.estado==='trotando')s.estado='lateral';
 s.espera=!!(s.gk&&S.ball&&S.owner!==s&&Math.abs(S.ball.x-(dirOf(s.team)>0?0:PW))<35);
 s.dBall=S.ball?Math.hypot(S.ball.x-s.x,S.ball.y-s.y):99;
 if(s.out&&s.y>PH+1.5)s.alpha=Math.max(0,s.alpha-dt)}

/* ---------- inteligencia de ubicación entre jugadas ----------
   con pelota: cada uno en su lugar del bloque; 2 compañeros cercanos ofrecen apoyo; los marcados se corren 2-3 m
   sin pelota: va a presionar 1 (2 con presión alta y la pelota en su mitad); defensores y volantes marcan solo
   al rival que entra en su zona (hasta 10 m), siempre entre el rival y su arco; el resto cierra espacios */
let marcasT=0;
function asignarMarcas(){S.sp.forEach(s=>{s.marca=null;s.apoyo=null});const o=S.owner;
 [0,1].forEach(t=>{if(S.posTeam===t)return;
  const def=S.sp.filter(s=>s.team===t&&!s.out&&!s.gk&&s.g!=='DEL'&&!(S.pressers||[]).includes(s)),att=S.sp.filter(s=>s.team!==t&&!s.out&&!s.gk&&s!==o);
  const libres=new Set(att);def.forEach(d=>{const z=formPos(d);let best=null,bd=10;libres.forEach(a=>{const k=Math.hypot(a.x-z[0],a.y-z[1]);if(k<bd){bd=k;best=a}});if(best){d.marca=best;libres.delete(best)}})});
 /* apoyos: los 2 compañeros más cercanos al que tiene la pelota se ofrecen para el pase corto */
 if(o&&!S.reset){const dir=dirOf(o.team);S.sp.filter(x=>x.team===o.team&&x!==o&&!x.out&&!x.gk).sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y)).slice(0,2)
  .forEach((x,i)=>{x.apoyo=[clamp(o.x-dir*rr(2,7)+dir*(i?6:0),3,102),clamp(o.y+(i?-1:1)*rr(9,13),4,64)]})}}
function objetivo(s){const z=formPos(s);let x=z[0],y=z[1],mul=.6;const dir=dirOf(s.team);
 if(S.phase==='pre'||S.phase==='ht'||S.phase==='done'||S.reset){s.tactico='quieto';return[x,y,.5]}
 if(S.chaser===s){s.tactico='buscando';return[S.ball.x,S.ball.y,1]}
 if(s.gk){s.tactico='arco';return[x,y,.75]}
 if(S.owner===s)return[s.x+dir*2,s.y,.55];
 const cercaPelota=Math.hypot(S.ball.x-s.x,S.ball.y-s.y)<25;mul=cercaPelota?.75:.55;
 if(S.posTeam===s.team){s.tactico='atacando';
  if(s.apoyo){s.tactico='apoyo';x=lerp(x,s.apoyo[0],.6);y=lerp(y,s.apoyo[1],.6)}
  const near=S.sp.find(o=>o.team!==s.team&&!o.out&&Math.hypot(o.x-s.x,o.y-s.y)<3);
  if(near){y+=s.y>=near.y?2.5:-2.5;s.tactico='desmarcandose';mul=.8}
  return[clamp(x,2,103),clamp(y,2.5,65.5),mul]}
 if((S.pressers||[]).includes(s)){s.tactico='presionando';return[S.ball.x-dir*1.1,S.ball.y,.95]}
 if(s.marca){const a=s.marca;s.tactico='marcando';const gx=dir>0?0:PW;const k=Math.hypot(a.x-gx,a.y-34)||1;
  const mx=a.x+(gx-a.x)/k*1.8,my=a.y+(34-a.y)/k*1.8;return[lerp(x,mx,.45),lerp(y,my,.45),.8]}
 s.tactico='defendiendo';return[x,y,mul]}
/* pelota suelta: la va a buscar el más cercano (el arquero si está en su área) */
function buscarSuelta(){S.chaser=null;if(S.owner||S.ball.fly||S.reset||S.phase==='pre'||S.phase==='ht'||S.phase==='done')return;
 if(S.play&&!S.play.filler&&!S.play.libre)return;
 const b=S.ball;let best=null,bd=1e9;for(const s of S.sp){if(s.out||BLOQUEA(s.pose))continue;const enArea=s.gk&&Math.abs(b.x-(dirOf(s.team)>0?0:PW))<16&&b.y>13.8&&b.y<54.2;if(s.gk&&!enArea)continue;
  const d=Math.hypot(s.x-b.x,s.y-b.y);if(d<bd){bd=d;best=s}}
 S.chaser=best;if(best&&bd<1.3)tomar(best)}
/* ---------- pelota: nunca se teletransporta ---------- */
function newBall(){return{x:52.5,y:34,z:0,vx:0,vy:0,fly:null}}
function ballStep(dt){const b=S.ball,px=b.x,py=b.y,enVuelo=!!b.fly;
 if(b.fly){const f=b.fly;f.t+=dt;const k=clamp(f.t/f.d,0,1),e=f.ease?1-Math.pow(1-k,1.6):k;b.x=lerp(f.x0,f.x1,e);b.y=lerp(f.y0,f.y1,e);b.z=f.h*4*k*(1-k)+(f.z1||0)*k;
  if(k>=1){b.fly=null;b.z=f.z1&&f.keep?f.z1:0;const cb=f.cb;f.cb=null;if(cb)cb()}}
 else if(S.owner){const o=S.owner;b.x+=(o.x+(o.face||1)*.55-b.x)*Math.min(1,dt*14);b.y+=(o.y+.25-b.y)*Math.min(1,dt*14);b.z=0}
 else{b.vx*=Math.pow(.4,dt);b.vy*=Math.pow(.4,dt);b.x+=b.vx*dt;b.y+=b.vy*dt}
 const jump=Math.hypot(b.x-px,b.y-py);if(jump>4.5&&!b.fly&&!enVuelo){S.tele++;S.teleLog={jugada:S.play?S.play.label:null,paso:S.play?S.play.i:null,salto:+jump.toFixed(1),dueno:S.owner?S.owner.name:null,de:[+px.toFixed(1),+py.toFixed(1)],a:[+b.x.toFixed(1),+b.y.toFixed(1)]}}}
function patear(x,y,o){o=o||{};const b=S.ball;S.owner=null;const d=Math.hypot(x-b.x,y-b.y);const v=o.v||(o.h>2?17:19);
 b.fly={x0:b.x,y0:b.y,x1:x,y1:y,h:o.h||0,z1:o.z1||0,keep:o.keep,t:0,d:Math.max(.2,d/v),ease:!o.lin,cb:o.cb}}
/* tomar la pelota solo si está cerca (si no, no se puede: evita teletransportes) */
function tomar(s){if(!s)return false;const d=Math.hypot(S.ball.x-s.x,S.ball.y-s.y);if(d>2.6||S.ball.fly)return false;S.owner=s;S.posTeam=s.team;
 const c=rasgos(s).control;accion(s,'controlando',c>=78?.2:c<55?.5:.32);return true}
/* rodar la pelota hasta un punto (reposiciones: saques, penal, córner, mitad de cancha) */
function rodar(x,y,cb){patear(x,y,{v:15,cb})}

/* ---------- pasos de una jugada ----------
   cada paso: {d: duración máxima, f: al empezar, u: condición para terminar antes} */
function P(d,f,u){return{d,f,u}}
function seq(steps,ev){return{steps,i:-1,t:0,ev,label:ev?(ev.title||''):''}}
function runPlay(dt){const p=S.play;if(!p)return;p.t-=dt;const st=p.steps[p.i];
 if(p.i<0||p.t<=0||(st&&st.u&&st.u())){p.i++;if(p.i>=p.steps.length){finish(p);return}const n=p.steps[p.i];p.t=n.d;try{n.f&&n.f()}catch(e){console.warn('MC2D',e)}}}
function finish(p){S.play=null;S.reset=false;S.sp.forEach(s=>{if(!s.out)s.ov=null});if(p.reveal)reveal(p.reveal);if(S.golT&&iniciarRepeticion())return;next()}
function reveal(n){if(n>S.shown){S.shown=n;contar();try{window.renderMatch&&renderMatch()}catch(e){}}}
function contar(){const E=(S.m.events||[]).slice(0,S.shown);let o=0,r=0;E.forEach(e=>{if(/GOL (LOCAL|VISITANTE)/.test(e.title||'')){if(e.side==='r')r++;else o++}});S.goles=[o,r]}
function banner(txt,col,d){S.banner={txt,col:col||'#e2bd70',t:d||2.4}}
function bigTxt(txt,col,d){S.big={txt,col:col||'#e2bd70',t:d||1.6,d:d||1.6}}
function teamOfSide(side){return side==='r'?1:0}
function quien(team,name,pref){const L=S.sp.filter(s=>s.team===team&&!s.out);if(!L.length)return null;
 if(name){const f=fold(name);const s=L.find(x=>fold(x.name)===f)||L.find(x=>f&&fold(x.name).split(' ').pop()===f.split(' ').pop());if(s)return s}
 if(pref==='gk')return L.find(s=>s.gk)||L[0];const by=g=>L.filter(s=>s.g===g);
 if(pref==='def')return pick(by('DEF').concat(by('MED')))||L[0];if(pref==='mid')return pick(by('MED'))||L[0];return pick(by('DEL').concat(by('MED')))||L[0]}
function nombresEn(team,msg){const f=fold(msg);return S.sp.filter(s=>s.team===team&&!s.out&&f.includes(fold(corto(s.name)))).sort((a,b)=>f.indexOf(fold(corto(a.name)))-f.indexOf(fold(corto(b.name))))}
function goalX(team){return dirOf(team)>0?PW:0}
function cerca(a,b,k){return a&&b&&Math.hypot(a.x-b.x,a.y-b.y)<(k||1.4)}

/* conseguir que 's' tenga la pelota sin teletransportarla:
   - si la tiene un compañero: pase del compañero a 's'
   - si la tiene un rival: 's' va, la disputa y se la quita (entrada)
   - si está suelta: 's' va a buscarla */
/* pase con física: la pelota sale hacia un punto y su velocidad se ajusta para que el receptor llegue corriendo
   (nunca se mueve al jugador de golpe). Si no llega, la pelota queda suelta y la busca el más cercano. */
function pasar(de,to,tx,ty,o){o=o||{};if(!to)return;const b=S.ball,d=Math.hypot(tx-b.x,ty-b.y);
 const tr=Math.hypot(tx-to.x,ty-to.y)/Math.max(3,to.vmax*.92)+.2;let v=o.v||19;if(d/v<tr)v=Math.max(8,d/tr);
 to.ov={x:tx,y:ty,run:1};if(de)accion(de,'pasando');S.lastTouch=de?de.team:S.lastTouch;
 patear(tx,ty,{h:o.h||0,z1:o.z1||0,v,cb:()=>{to.ov=null;tomar(to);if(o.cb)o.cb()}})}
/* conseguir que 's' tenga la pelota sin teletransportar a nadie:
   - si la tiene un compañero: le pasa la pelota
   - si la tiene un rival cerca (menos de 14 m): va, la disputa y se la quita
   - si la tiene un rival lejos: el rival juega un pase hacia la zona de 's' y 's' lo corta
   - si está suelta y 's' está lejos: la toma el compañero más cercano y se la pasa */
function asegurar(s){const W=[];if(!s)return W;
 W.push(P(3.2,()=>{s._robar=null;const o=S.owner;
  if(o===s)return;
  if(o&&o.team===s.team){pasar(o,s,clamp(s.x+(s.face||1)*.6,2,103),s.y)}
  else if(o&&Math.hypot(o.x-s.x,o.y-s.y)<14){s.ov={x:o.x,y:o.y,run:1};s._robar=o}
  else if(o){const mates=S.sp.filter(x=>x.team===o.team&&x!==o&&!x.out&&!x.gk).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
   const r=mates[0];const mx=lerp(s.x,r?r.x:o.x,.35),my=lerp(s.y,r?r.y:o.y,.35);s.ov={x:mx,y:my,run:1};accion(o,'pasando');S.lastTouch=o.team;
   const tr=Math.hypot(mx-s.x,my-s.y)/Math.max(3,s.vmax*.92)+.25,dd=Math.hypot(mx-S.ball.x,my-S.ball.y);patear(mx,my,{v:Math.max(9,Math.min(20,dd/tr)),cb:()=>{tomar(s)}})}
  else{const m=S.sp.filter(x=>x.team===s.team&&!x.out&&!x.gk).sort((a,b)=>Math.hypot(a.x-S.ball.x,a.y-S.ball.y)-Math.hypot(b.x-S.ball.x,b.y-S.ball.y))[0];
   if(m&&m!==s&&Math.hypot(s.x-S.ball.x,s.y-S.ball.y)>15){m.ov={x:S.ball.x,y:S.ball.y,run:1};s._via=m}else s.ov={x:S.ball.x,y:S.ball.y,run:1}}},
  ()=>{if(S.owner===s)return true;const o=S.owner;
   if(s._robar&&o===s._robar){s.ov={x:o.x,y:o.y,run:1};if(cerca(s,o,1.5)){accion(s,'entrada');accion(o,'desequilibrio');S.owner=null;s._robar=null;return tomar(s)}return false}
   if(s._via){const m=s._via;if(!S.owner&&!S.ball.fly){m.ov={x:S.ball.x,y:S.ball.y,run:1};tomar(m)}if(S.owner===m){s._via=null;m.ov=null;pasar(m,s,clamp(s.x+(s.face||1)*.6,2,103),s.y)}return false}
   if(!S.owner&&!S.ball.fly){s.ov={x:S.ball.x,y:S.ball.y,run:1};return tomar(s)}return false}));
 W.push(P(.01,()=>{s._robar=null;s._via=null}));
 return W}

/* ---------- reproducir las acciones que escribió el motor ---------- */
function reflejos(gk){const a=atr(gk.e)||{};return a.reflejos||60}
function remateSteps(team,a,ev){const opp=1-team,dir=dirOf(team),gx=goalX(team);const sh=quien(team,a.j,'att'),gk=quien(opp,a.arq,'gk');if(!sh)return[];
 const res=a.res||'afuera',head=a.t==='cabezazo',alto=a.zona==='alto';const W=[];
 W.push(P(.05,()=>{accion(sh,head?'cabeceando':(S.ball.z>.8?'volea':'rematando'))}));
 W.push(P(1.2,()=>{
  const gy=res==='gol'||res==='anulado'?(rnd()<.5?rr(30.9,32.6):rr(35.4,37.1)):res==='palo'?(rnd()<.5?30.4:37.6):res==='afuera'?(rnd()<.5?rr(26,29.8):rr(38.2,42)):(gk?clamp(gk.y+rr(-1.6,1.6),30.8,37.2):rr(31.6,36.4));
  const gxx=res==='gol'||res==='anulado'?gx+dir*1.4:res==='afuera'?gx+dir*3.5:res==='palo'?gx:(gk?gk.x:gx-dir*.9);
  const z1=res==='afuera'&&rnd()<.4?3.2:alto?1.9:.4;
  patear(gxx,gy,{v:head?18:27,h:head?.6:(alto?1.2:.3),z1,keep:res==='gol',lin:true,cb:()=>{
   if(res==='atajada'&&gk){S.ball.z=0;if(!tomar(gk)){/* rechazo: la pelota rebota al frente */patear(S.ball.x-dir*rr(3,6),S.ball.y+rr(-5,5),{v:12})}}
   if(res==='palo'){patear(gx-dir*rr(4,9),gy<34?gy-rr(3,7):gy+rr(3,7),{v:14})}}});
  /* el arquero reacciona antes o después según sus reflejos */
  if(gk){const delay=clamp((100-reflejos(gk))/220,.05,.35);setTimeout(()=>{if(!S.play)return;const tgt=clamp(gy,30.6,37.4);
   if(Math.abs(tgt-gk.y)>1.2||res==='atajada'){accion(gk,Math.abs(tgt-gk.y)>1.2?'estirada':'atajando');gk.vy=(tgt-gk.y)*2.4;gk.vx=0;gk.ov=null}},delay*1000/Math.max(1,speed()))}},
  ()=>!S.ball.fly&&(res!=='atajada'||S.owner===gk)));
 if(res==='gol'||res==='anulado')W.push(P(2,()=>{bigTxt('¡GOL!','#e2bd70',1.6);if(res==='gol')S.golT=S.t;banner(`⚽ ${corto(sh.name)}`,'#e2bd70',2.6);
   sh.ov={x:gx-dir*rr(8,13),y:rnd()<.5?7:61,run:1};sh.celeb=(rasgos(sh).var+S.goles[0]+S.goles[1])%4;accion(sh,'celebrando');
   S.sp.filter(s=>s.team===team&&s!==sh&&!s.gk&&!s.out).slice(0,4).forEach((s,i)=>{s.ov={x:sh.ov.x-dir*(1+i*.6),y:sh.ov.y+(i%2?1.2:-1.2),run:.95};setTimeout(()=>accion(s,'abrazo'),900)});
   S.sp.filter(s=>s.team===opp&&!s.out).slice(0,4).forEach(s=>accion(s,'lamento'));if(gk)accion(gk,'lamento')}));
 else if(res==='atajada')W.push(P(.9,()=>{accion(sh,'lamento',1);banner(`🧤 ${corto(gk?gk.name:'')}`,'#ffffff',1.6)}),
   P(.8,()=>{if(gk&&S.owner===gk){accion(gk,'saque');const to=quien(opp,null,'def');if(to)patear(to.x,to.y,{h:5,v:18,cb:()=>tomar(to)})}}));
 else W.push(P(1,()=>{accion(sh,'lamento',1.2);banner(res==='palo'?'¡Al palo!':'Afuera','#ffffff',1.4)}),
   P(1.6,()=>{if(gk){rodar(gx-dir*5.5,rr(28,40))}},()=>!S.ball.fly),P(1.4,()=>{if(gk)gk.ov={x:S.ball.x,y:S.ball.y,run:.8}},()=>gk&&tomar(gk)),
   P(.6,()=>{if(gk&&S.owner===gk){accion(gk,'saque');const to=quien(opp,null,'def');if(to)patear(to.x,to.y,{h:6,v:20,cb:()=>tomar(to)})}}));
 return W}
function zonaRemate(team,tipo){const dir=dirOf(team),gx=goalX(team);const lejos=/afuera|tirolibre/.test(tipo||'');return{x:gx-dir*(lejos?rr(20,25):rr(10,16)),y:rr(lejos?22:27,lejos?46:41)}}
function accionesSteps(team,acc,ev){const opp=1-team,dir=dirOf(team),gx=goalX(team);let W=[];
 const fin=acc[acc.length-1]||{},shN=(fin.t==='remate'||fin.t==='cabezazo')?fin.j:null,zona=zonaRemate(team,fin.tipo);
 if(shN&&!acc.some(a=>a.t==='corner'||a.t==='tirolibre'||a.t==='rebote')){W.push(P(.01,()=>{const sh=quien(team,shN,'att');if(sh&&S.owner!==sh)sh.ov={x:zona.x,y:zona.y,run:.85}}))}
 for(const a of acc){
  if(a.t==='recupera'){const j=quien(team,a.j,'def');W=W.concat(asegurar(j))}
  else if(a.t==='pase'){const de=quien(team,a.de,'mid'),to=quien(team,a.a,'att');if(!de||!to)continue;W=W.concat(asegurar(de));
   W.push(P(2.4,()=>{let tx,ty,h=0,v=19,z1=0;
    if(a.tipo==='filtrado'){tx=clamp(to.x+dir*rr(8,12),2,103);ty=clamp(lerp(to.y,34,.3),8,60);v=21}
    else if(a.tipo==='centro'){tx=gx-dir*rr(6.5,9.5);ty=rr(30,38);h=5.2;z1=1.7;v=18}
    else if(a.tipo==='largo'){tx=clamp(to.x+dir*rr(3,6),2,103);ty=to.y+rr(-3,3);h=6;v=20}
    else if(a.a===shN){tx=zona.x;ty=zona.y}
    else{tx=clamp(to.x+dir*rr(1,3),2,103);ty=to.y+rr(-1.5,1.5)}
    if(S.owner!==de)return;accion(to,'pide');pasar(de,to,tx,ty,{h,z1,v})},()=>S.owner===to&&!S.ball.fly))}
  else if(a.t==='conduce'){const j=quien(team,a.j,'mid');if(!j)continue;W=W.concat(asegurar(j));
   W.push(P(1.4,()=>{accion(j,'run');j.ov=a.banda?{x:gx-dir*rr(7,10),y:j.y<34?rr(5,8):rr(60,63),run:.9}:{x:clamp(j.x+dir*rr(7,11),3,102),y:clamp(j.y+rr(-4,4),6,62),run:.85}},()=>cerca(j,j.ov,1.2)))}
  else if(a.t==='gambeta'){const j=quien(team,a.j,'att'),r=quien(opp,a.rival,'def');if(!j)continue;W=W.concat(asegurar(j));
   W.push(P(1.1,()=>{if(r)r.ov={x:j.x+dir*2.5,y:j.y,run:1}},()=>r&&cerca(r,j,2.2)),
    P(.6,()=>{accion(j,'amague');if(r){accion(r,'entrada');r.ov=null}j.ov={x:j.x+dir*4,y:clamp(j.y+(j.y<34?3.5:-3.5),6,62),run:1}}),
    P(.5,()=>{if(r)accion(r,'desequilibrio')}))}
  else if(a.t==='cierre'){const d=quien(opp,a.j,'def'),j=quien(team,a.a,'att');if(!d||!j)continue;
   W.push(P(.7,()=>{d.ov={x:lerp(j.x,gx,.15),y:lerp(j.y,34,.15),run:1}},()=>cerca(d,d.ov,1.2)),P(.05,()=>{accion(d,rnd()<.45?'barrida':'entrada')}))}
  else if(a.t==='remate'||a.t==='cabezazo'){const sh=quien(team,a.j,'att');
   if(sh&&a.t==='remate'&&S.owner!==sh&&!S.ball.fly){W=W.concat(asegurar(sh))}
   if(sh&&a.t==='remate'&&!/rebote/.test(a.tipo||'')){W.push(P(2.2,()=>{const d=Math.abs((sh.x)-gx);if(d>(/afuera|tirolibre/.test(a.tipo||'')?28:20))sh.ov={x:zona.x,y:zona.y,run:.9}},()=>!sh.ov||cerca(sh,sh.ov,1.5)||Math.abs(sh.x-gx)<=(/afuera|tirolibre/.test(a.tipo||'')?28:20)))}
   if(sh&&a.t==='cabezazo')W.push(P(.15,()=>{accion(sh,'saltando')}));
   W=W.concat(remateSteps(team,a,ev))}
  else if(a.t==='corner'){const tk=quien(team,a.j,'mid');const wy=rnd()<.5?.6:67.4;
   W.push(P(2.2,()=>{S.owner=null;rodar(gx-dir*.4,wy);if(tk)tk.ov={x:gx-dir*1.4,y:wy,run:1};banner('Tiro de esquina','#e2bd70');
     /* atacantes: 5 al área (los mejores cabeceadores), 2 a la puerta del área, el resto atrás; defensores: 7 en el área, 1-2 arriba */
     const at=S.sp.filter(s=>s.team===team&&!s.gk&&s!==tk&&!s.out).sort((a,b)=>(rasgos(b).alto-rasgos(a).alto)),de=S.sp.filter(s=>s.team===opp&&!s.gk&&!s.out).sort((a,b)=>(a.g==='DEL')-(b.g==='DEL'));
     at.forEach((s,i)=>{s.ov=i<5?{x:gx-dir*rr(5,11),y:rr(28,40),run:.8}:i<7?{x:gx-dir*rr(18,21),y:rr(22,46),run:.7}:{x:52.5+dir*rr(-8,6),y:rr(15,53),run:.6}});
     de.forEach((s,i)=>{s.ov=i<7?{x:gx-dir*rr(3,10),y:rr(27,41),run:.8}:{x:gx-dir*rr(34,42),y:rr(24,44),run:.6}})},()=>!S.ball.fly&&tk&&cerca(tk,S.ball,1.6)),
    P(.4,()=>{if(tk)tomar(tk)}))}
  else if(a.t==='falta'){const inf=quien(opp,a.de,'def'),vic=quien(team,a.a,'att');if(!inf||!vic)continue;W=W.concat(asegurar(vic));
   W.push(P(1.2,()=>{inf.ov={x:vic.x,y:vic.y,run:1}},()=>cerca(inf,vic,1.6)),P(1.1,()=>{accion(inf,'barrida');accion(vic,'cayendo');S.owner=null;banner(a.area?'¡Penal!':'Falta',a.area?'#ff6b5b':'#ffffff',1.6);if(a.area)bigTxt('¡PENAL!','#ff6b5b',1.2)}))}
  else if(a.t==='tirolibre'){const j=quien(team,a.j,'att');const sx=gx-dir*rr(20,26),sy=rr(24,44);
   W.push(P(2.2,()=>{rodar(sx,sy);if(j)j.ov={x:sx-dir*2,y:sy,run:.8};const wall=S.sp.filter(s=>s.team===opp&&!s.gk&&!s.out).slice(0,3);
     wall.forEach((s,i)=>{s.ov={x:sx+dir*9.15,y:sy+(i-1)*.9+(34-sy)*.15,run:.8}});banner('Tiro libre','#e2bd70')},()=>!S.ball.fly&&j&&cerca(j,S.ball,2.4)),P(.3,()=>{if(j)tomar(j)}))}
  else if(a.t==='penal'){const tk=quien(team,a.j,'att'),gk=quien(opp,a.arq,'gk');
   W.push(P(2.4,()=>{S.owner=null;rodar(gx-dir*11,34);S.sp.filter(s=>!s.out&&s!==tk&&s!==gk).forEach(s=>{s.ov={x:gx-dir*rr(18,23),y:rr(14,54),run:.8}});
     if(tk)tk.ov={x:gx-dir*13.5,y:34,run:.7};if(gk)gk.ov={x:gx-dir*.4,y:34,run:.6}},()=>!S.ball.fly&&tk&&cerca(tk,tk.ov,1)),
    P(.8,()=>{if(tk)tk.ov={x:gx-dir*11.6,y:34,run:.9}},()=>tk&&cerca(tk,S.ball,1.6)),P(.2,()=>{if(tk)tomar(tk)}));
   W=W.concat(remateSteps(team,{t:'remate',j:a.j,arq:a.arq,res:a.res,zona:'bajo'},ev))}
  else if(a.t==='rebote'){const j=quien(team,a.j,'att');W.push(P(1.6,()=>{if(S.owner&&S.owner.gk){const g=S.owner;S.owner=null;patear(g.x+dirOf(g.team)*rr(3,6),g.y+rr(-4,4),{v:12})}if(j)j.ov={x:S.ball.x,y:S.ball.y,run:1}},()=>j&&!S.ball.fly&&(j.ov={x:S.ball.x,y:S.ball.y,run:1})&&tomar(j)))}
  else if(a.t==='error'){const lo=quien(opp,a.j,'def'),th=quien(team,a.a,'att');W=W.concat(asegurar(lo));
   W.push(P(.6,()=>{if(lo){accion(lo,'desequilibrio');S.owner=null;patear(lo.x-dirOf(lo.team)*-1+dir*2,lo.y+rr(-2,2),{v:8})}if(th)th.ov={x:S.ball.x,y:S.ball.y,run:1};banner('¡Error!','#ff9d3b',1.4)}),
    P(1.6,()=>{if(th)th.ov={x:S.ball.x,y:S.ball.y,run:1}},()=>th&&!S.ball.fly&&tomar(th)))}
 }
 return W}

/* saque del medio: la pelota rueda al centro y los equipos vuelven a sus posiciones */
function kickoff(team){return[P(2.2,()=>{S.reset=true;S.owner=null;rodar(52.5,34)},()=>!S.ball.fly&&S.sp.every(s=>s.out||Math.hypot(formPos(s)[0]-s.x,formPos(s)[1]-s.y)<3)),
 P(.6,()=>{S.reset=false;const k=quien(team,null,'att');if(k){k.ov={x:52.5-dirOf(team)*.6,y:34,run:.6}}},()=>{const k=S.sp.find(s=>s.ov&&s.team===team);return k&&tomar(k)})]}

/* ---------- evento del motor → jugada ---------- */
function jugada(ev,idx){const T=ev.title||'',msg=ev.msg||'',side=ev.side||'o',team=teamOfSide(side),opp=1-team,E=S.m.events;
 const acc=Array.isArray(ev.acc)?ev.acc:null;
 const fin=(W,n,ko)=>{W.push(P(.01,()=>reveal(idx+n)));const p=seq(ko?W.concat(kickoff(ko.t)):W,ev);p.skip=n;return p};
 if(/GOL (LOCAL|VISITANTE)/.test(T)){const g=ev.gol||{};
  if(acc)return fin(accionesSteps(team,acc,ev),1,{t:opp});
  const nm=nombresEn(team,msg);return fin(accionesSteps(team,legado(team,g.autor||(nm[0]&&nm[0].name),g.asist||(nm[1]&&nm[1].name),g.tipo||'area','gol'),ev),1,{t:opp})}
 if(/⚠ PENAL/.test(T)){let j=idx+1;for(;j<Math.min(E.length,idx+4);j++){if(/GOL (LOCAL|VISITANTE)|PENAL FALLADO/.test(E[j].title||''))break}if(j>=Math.min(E.length,idx+4))j=idx;
  let A=acc;if(!A){const nm=nombresEn(team,msg),df=nombresEn(opp,msg)[0];const r2=E[j]||{};const res=/GOL/.test(r2.title||'')?'gol':/ataja/i.test(r2.msg||'')?'atajada':'afuera';
   A=[{t:'falta',de:df&&df.name,a:nm[0]&&nm[0].name,area:true},{t:'penal',j:nm[nm.length-1]&&nm[nm.length-1].name,res}]}
  const res=(A[1]||{}).res;return fin(accionesSteps(team,A,ev),j-idx+1,res==='gol'?{t:opp}:null)}
 if(/OCASI|ATAJADA/.test(T)){const j=ev.j||{};const A=acc||legado(team,j.tirador||(nombresEn(team,msg)[0]||{}).name,null,j.tipo||guessTipo(msg),/ATAJADA/.test(T)?'atajada':'afuera');return fin(accionesSteps(team,A,ev),1)}
 if(/GOL ANULADO/.test(T)){const A=acc||legado(team,null,null,'area','anulado');const W=accionesSteps(team,A,ev);W.push(P(2,()=>{S.owner=null;bigTxt('VAR · ANULADO','#7fd3ff',1.8)}));return fin(W,1,{t:opp})}
 if(/ESQUINA/.test(T)){const tk=quien(team,null,'mid'),df=nombresEn(opp,msg)[0]||quien(opp,null,'def');
  const W=accionesSteps(team,[{t:'corner',j:tk&&tk.name}],ev);
  W.push(P(1.4,()=>{if(tk&&S.owner===tk){accion(tk,'pasando');patear(goalX(team)-dirOf(team)*7,rr(30,38),{h:6,z1:1.8,cb:()=>{}})}if(df)df.ov={x:goalX(team)-dirOf(team)*7,y:34,run:1}},()=>!S.ball.fly),
   P(.9,()=>{if(df){accion(df,'cabeceando');patear(goalX(team)-dirOf(team)*rr(26,34),rr(15,53),{h:5,cb:()=>{}})}}),P(1.6,()=>{},()=>!S.ball.fly));
  return fin(W,1)}
 if(/AMARILLA|EXPULSI|FALTA/.test(T)){const inf=nombresEn(team,msg)[0]||quien(team,null,'def'),vic=nombresEn(opp,msg)[0]||quien(opp,null,'att');const col=/EXPULSI/.test(T)?'red':/AMARILLA/.test(T)?'yellow':null;
  const W=accionesSteps(opp,[{t:'falta',de:inf&&inf.name,a:vic&&vic.name}],ev);
  W.push(P(1.5,()=>{if(col&&inf){inf.card=col;inf.cardT=1.8;S.ref.ov={x:inf.x-1.5,y:inf.y+1,run:1};accion(S.ref,'tarjeta')}
    S.sp.filter(s=>s.team===team&&s!==inf&&!s.out&&inf&&Math.hypot(s.x-inf.x,s.y-inf.y)<14).slice(0,2).forEach(s=>accion(s,'protesta'));
    banner(col==='red'?'Roja directa':col?'Tarjeta amarilla':'Falta',col==='red'?'#ff4d4d':col?'#ffd400':'#ffffff')}),
   P(1.2,()=>{},()=>vic&&vic.pose!=='cayendo'&&vic.pose!=='levantandose'),P(.6,()=>{if(vic&&cerca(vic,S.ball,2.6))tomar(vic)}));
  return fin(W,1)}
 if(/OFFSIDE/.test(T)){const at=nombresEn(team,msg)[0]||quien(team,null,'att'),pa=quien(team,null,'mid'),gx=goalX(team),dir=dirOf(team);
  const W=asegurar(pa);W.push(P(.8,()=>{if(at)at.ov={x:gx-dir*12,y:at.y,run:1}}),P(1,()=>{if(pa&&S.owner===pa){accion(pa,'pasando');patear(gx-dir*13,at?at.y:34,{v:20,cb:()=>{}})}},()=>!S.ball.fly),
   P(1.6,()=>{bigTxt('OFFSIDE','#ffffff',1.1);const g=quien(opp,null,'gk');if(g)g.ov={x:S.ball.x,y:S.ball.y,run:.9}},()=>{const g=quien(opp,null,'gk');return g&&tomar(g)}));
  return fin(W,1)}
 if(/VAR|ERROR ARBITRAL/.test(T)){return fin([P(2,()=>{bigTxt(/ERROR ARBITRAL/.test(T)?'ERROR ARBITRAL':'VAR','#7fd3ff',1.8)})],1)}
 if(/ERROR INDIVIDUAL/.test(T)){return fin([P(.4,()=>banner('¡Error!','#ff9d3b',1.4))],1)}/* la jugada completa la muestra el remate que sigue */
 if(/LESI/.test(T)&&!/SIN CAMBIOS/.test(T)){const v=nombresEn(team,msg)[0];return fin([P(.2,()=>{}),P(2.4,()=>{if(v){accion(v,'cayendo',2.2);if(S.owner===v)S.owner=null}banner('Lesión','#ff6b5b')})],1)}
 if(/CAMBIO/.test(T)){return fin([P(1.4,()=>banner('🔁 Cambio','#7fd3ff',1.6))],1)}
 if(/COMIENZA EL 2/.test(T)){return fin([P(.01,()=>{S.half=2;S.phase='second'})].concat(kickoff(1)),1)}
 if(/COMIENZA EL PARTIDO/.test(T)){return fin([P(.01,()=>{S.phase='first'})].concat(kickoff(0)),1)}
 if(/DESCANSO/.test(T)){return fin([P(1.6,()=>{S.owner=null;S.phase='ht';bigTxt('ENTRETIEMPO','#e2bd70',1.4)})],1)}
 if(/FINAL DEL PARTIDO/.test(T)){return fin([P(1.6,()=>{S.owner=null;S.phase='done';bigTxt('FINAL','#e2bd70',1.6)})],1)}
 return null}
/* partidos del motor clásico (v1): no traen la jugada escrita; se arma una mínima con los protagonistas del evento */
function legado(team,autor,asist,tipo,res){const A=[];if(asist)A.push({t:'pase',de:asist,a:autor,tipo:/cabez|centro|corner/.test(tipo)?'centro':/filtr|contra/.test(tipo)?'filtrado':'corto'});
 A.push({t:/cabez|corner/.test(tipo)?'cabezazo':'remate',j:autor,res,zona:'bajo'});return A}
function guessTipo(msg){const f=fold(msg);return /cabez/.test(f)?'cabezazo':/afuera|lejos|distancia/.test(f)?'afuera':/mano a mano|filtr/.test(f)?'filtrado':/rebote/.test(f)?'rebote':/libre/.test(f)?'tirolibre':'area'}

/* ---------- posesión entre jugadas: la escribe el motor minuto a minuto ----------
   inicio (también del motor): saque lateral o saque de arco; luego la cadena de pases; si el motor dice que la
   pierde, el último pase lo corta el rival indicado, en el punto de la trayectoria al que llega corriendo. */
function cortar(de,th,tx,ty){const b=S.ball,vx=tx-b.x,vy=ty-b.y,L2=vx*vx+vy*vy||1;let t=((th.x-b.x)*vx+(th.y-b.y)*vy)/L2;t=clamp(t,.3,.9);
 const px=b.x+vx*t,py=b.y+vy*t,tr=Math.hypot(px-th.x,py-th.y)/Math.max(3,th.vmax*.95)+.2,d=Math.hypot(px-b.x,py-b.y);
 th.ov={x:px,y:py,run:1};accion(de,'pasando');S.lastTouch=de.team;patear(px,py,{v:Math.max(8,Math.min(19,d/tr)),cb:()=>{th.ov=null;if(tomar(th))accion(th,'entrada',.35)}})}
function posesionPlay(){const V=S.m.v2;if(!V||!V.posesion||!V.posesion.length)return null;
 const L=V.posesion.filter(r=>r.id>S.posId);if(!L.length)return null;const r=L[L.length-1];S.posId=r.id;
 const team=teamOfSide(r.eq),dir=dirOf(team),W=[];let prev=null;
 const first=quien(team,r.pases[0],'mid');if(!first)return null;
 if(r.inicio==='lateral'){const ty=S.ball.y<34?.2:67.8,tx=clamp(S.ball.x,8,97);
  W.push(P(2.6,()=>{S.owner=null;rodar(tx,ty);first.ov={x:tx,y:ty,run:.9};banner('Saque lateral','#ffffff',1.6)},()=>!S.ball.fly&&cerca(first,S.ball,1.5)),P(.5,()=>{tomar(first);accion(first,'saque')}))}
 else if(r.inicio==='arco'&&first.gk){const own=dir>0?0:PW,sx=own+dir*5.5,sy=rnd()<.5?29:39;
  W.push(P(2.8,()=>{S.owner=null;rodar(sx,sy);first.ov={x:sx-dir*.8,y:sy,run:.8};banner('Saque de arco','#ffffff',1.6)},()=>!S.ball.fly&&cerca(first,S.ball,1.5)),P(.4,()=>{tomar(first)}))}
 else W.push(...asegurar(first));
 prev=first;
 r.pases.slice(1).forEach((n,k)=>{const i=k+1,s=quien(team,n,'mid');if(!s||s===prev)return;const de=prev;
  W.push(P(3,()=>{if(S.owner!==de)return;const largo=de.gk||Math.hypot(s.x-de.x,s.y-de.y)>28;
    const tx=clamp(s.x+dir*rr(1,3),2,103),ty=clamp(s.y+rr(-1.5,1.5),2,66);
    const last=i===r.pases.length-1&&r.recupera,th=last?quien(1-team,r.recupera,'def'):null;
    if(th)cortar(de,th,tx,ty);else{accion(s,'pide');pasar(de,s,tx,ty,{h:largo?7:0,v:largo?21:18})}},()=>!S.ball.fly&&S.owner!==de));
  W.push(P(rr(.5,1.1),()=>{const o=S.owner;if(o&&!o.gk)o.ov={x:clamp(o.x+dirOf(o.team)*rr(2,5),3,102),y:clamp(o.y+rr(-2,2),3,65),run:.55}}));prev=s});
 const p={steps:W,i:-1,t:0,label:'posesión',filler:true,libre:true};return p}

/* cola: eventos del motor primero; si no hay, la posesión del minuto */
function next(){const m=S.m;if(!m||S.play)return;const E=m.events||[];
 while(S.shown<E.length&&!S.play){const idx=S.shown,ev=E[idx];let p=null;try{p=jugada(ev,idx)}catch(e){console.warn('MC2D jugada',e)}
  if(p){S.play=p;S.play.reveal=idx+(p.skip||1);return}S.shown=idx+1;contar()}
 if(!S.play&&S.phase!=='pre'&&S.phase!=='ht'&&S.phase!=='done'){const p=posesionPlay();if(p)S.play=p;else circularLegado()}}
/* motor clásico (sin posesión escrita): el que tiene la pelota toca con un compañero cercano */
let legT=0;function circularLegado(){if(S.m.v2||S.ball.fly)return;legT-=.016;if(legT>0)return;legT=1.2;const o=S.owner;if(!o)return;
 const mates=S.sp.filter(s=>s.team===o.team&&s!==o&&!s.out&&Math.hypot(s.x-o.x,s.y-o.y)<25);const to=pick(mates);if(to)pasar(o,to,clamp(to.x+dirOf(o.team)*1.5,2,103),to.y)}

/* ---------- dibujo ---------- */
function resize(){const r=(S.wrap||S.host).getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 const w=Math.max(200,Math.round(r.width)),h=Math.max(100,Math.round(r.height));if(w===S.w&&h===S.h&&dpr===S.dpr)return;
 S.w=w;S.h=h;S.dpr=dpr;S.cv.width=w*dpr;S.cv.height=h*dpr;S.cv.style.width=w+'px';S.cv.style.height=h+'px'}
/* proyección: TV/Seguimiento = cámara de transmisión desde la tribuna; Cenital/Táctica = vista desde arriba */
function proj(x,y,z){const r=projBase(x,y,z),T=S.camT;if(!T)return r;
 return[S.w/2+(r[0]-S.w/2)*T.Z,S.h/2+(r[1]-T.Yf)*T.Z,r[2]*T.Z]}
/* cámara de TV: zoom y centro vertical, sin mostrar nunca fuera del estadio */
function camara(real){const c=S.cam;if(c==='cen'||c==='tac'){S.camT=null;return}
 const b=S.rep&&S.rep.b?S.rep.b:(Q.on&&Q.rep?Q.rep.R.ball:S.ball),o=(S.rep||(Q.on&&Q.rep))?null:S.owner,f=b.fly;
 /* anticipación: hacia donde va la pelota (destino del pase/remate o un poco adelante del que conduce) */
 let ax=b.x,ay=b.y;if(Q.on){if(!Q.rep&&Q.fut){ax=lerp(b.x,Q.fut[0],.6);ay=lerp(b.y,Q.fut[1],.6)}}else if(f){ax=lerp(b.x,f.x1,.55);ay=lerp(b.y,f.y1,.55)}else if(o){ax=o.x+dirOf(o.team)*4+o.vx*.4;ay=o.y+o.vy*.4}
 const half=(c==='seg'?28:(Q.on?50:42))/2/(S.zoom||1);S.camX+=(clamp(ax,half-4,PW-half+4)-S.camX)*Math.min(1,real*(c==='seg'?2.6:1.5));
 S.camY+=(clamp(ay,4,64)-S.camY)*Math.min(1,real*1.3);
 /* zoom: abre en pelotas largas, cierra cerca del arco en jugadas y en la repetición */
 const cercaArco=Math.min(b.x,PW-b.x)<24,jug=Q.on?(Q.live&&enPeligro(Q.live.tp)):(S.play&&!S.play.filler);
 let Zt=(S.rep||(Q.on&&Q.rep))?1.5:(Q.on&&Q.fut&&Math.hypot(Q.fut[0]-b.x,Q.fut[1]-b.y)>14)?1:(f&&Math.hypot(f.x1-f.x0,f.y1-f.y0)>30)?1:(cercaArco&&jug)?(c==='seg'?1.15:1.28):(c==='seg'?1.05:1.1);
 S.zoom=(S.zoom||1)+(Zt-(S.zoom||1))*Math.min(1,real*1.1);const Z=S.zoom,h=S.h;
 const yT=Q.on?projBase(S.camX,-17,9)[1]:projBase(S.camX,0,0)[1]-10,yB=projBase(S.camX,PH,0)[1]+6,lo=yT+h/(2*Z),hi=yB-h/(2*Z);
 const want=projBase(S.camX,S.camY,0)[1];S.camT={Z,Yf:lo<hi?clamp(want,lo,hi):(lo+hi)/2}}
function projBase(x,y,z){const c=S.cam,w=S.w,h=S.h;
 if(c==='cen'||c==='tac'){const s=Math.min((w-16)/PW,(h-14)/PH);return[w/2+(x-52.5)*s,h/2+(y-34)*s-(z||0)*s*.6,s]}
 const viewW=c==='seg'?28:(Q.on?50:42),dc=70,hc=30,top=-6,bot=h+4;
 const k1=1/dc,k0=1/(dc+PH),F=(bot-top)/(hc*(k1-k0)),hz=top-hc*F*k0;
 const d=dc+(PH-y),s=F/d,sx=w/(viewW*(F/dc))*s;
 return[w/2+(x-S.camX)*sx,hz+(hc-(z||0))*s,sx]}
function drawPitch(ctx){const w=S.w,h=S.h;if(Q.on)drawStadium(ctx);else{ctx.fillStyle='#0b1a10';ctx.fillRect(0,0,w,h)}
 const strips=14;for(let i=0;i<strips;i++){const x0=i*PW/strips,x1=(i+1)*PW/strips;const a=proj(x0,0),b=proj(x1,0),c=proj(x1,PH),d=proj(x0,PH);
  ctx.fillStyle=i%2?'#2e8a3c':'#349544';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.closePath();ctx.fill()}
 /* corte del pasto en damero (v3): franjas a lo ancho más claras */
 if(Q.on)for(let i=0;i<8;i++){if(i%2)continue;const y0=i*PH/8,y1=(i+1)*PH/8;const a=proj(0,y0),b=proj(PW,y0),c=proj(PW,y1),d=proj(0,y1);ctx.fillStyle='rgba(255,255,255,.045)';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.closePath();ctx.fill()}
 ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.3;
 const L=pts=>{ctx.beginPath();pts.forEach((p,i)=>{const q=proj(p[0],p[1]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.stroke()};
 L([[0,0],[PW,0],[PW,PH],[0,PH],[0,0]]);L([[52.5,0],[52.5,PH]]);
 const circ=[];for(let a=0;a<=40;a++){const t=a/40*Math.PI*2;circ.push([52.5+Math.cos(t)*9.15,34+Math.sin(t)*9.15])}L(circ);
 [[0,1],[PW,-1]].forEach(([x,d])=>{L([[x,13.85],[x+d*16.5,13.85],[x+d*16.5,54.15],[x,54.15]]);L([[x,24.85],[x+d*5.5,24.85],[x+d*5.5,43.15],[x,43.15]]);
  const arc=[];for(let a=-53;a<=53;a+=4){const t=a*Math.PI/180;arc.push([x+d*(11+Math.cos(t)*9.15),34+Math.sin(t)*9.15])}L(arc.filter(p=>d>0?p[0]>=x+16.5:p[0]<=x-16.5));
  /* arco */
  const g1=proj(x,30.34),g2=proj(x,37.66),gt1=proj(x,30.34,2.44),gt2=proj(x,37.66,2.44),b1=proj(x-d*1.8,30.34),b2=proj(x-d*1.8,37.66);
  ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(g1[0],g1[1]);ctx.lineTo(b1[0],b1[1]);ctx.lineTo(b2[0],b2[1]);ctx.lineTo(g2[0],g2[1]);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(g1[0],g1[1]);ctx.lineTo(gt1[0],gt1[1]);ctx.lineTo(gt2[0],gt2[1]);ctx.lineTo(g2[0],g2[1]);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.3})}
function kitOf(s){const K=S.kits;if(!K)return{d:'liso',c1:s.team?'#1747b0':'#f4f4f4',c2:'#d3212f',sh:'#111',me:'#111'};
 const home=S.m&&S.m.venue==='a'?1:0;/* local real del partido */const isHome=s.team===home;
 if(s.gk)return isHome?K.arqL:K.arqV;return isHome?K.local:K.visita}
function torso(ctx,k,x,y,w,h){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle=k.c1;ctx.fillRect(x,y,w,h);ctx.fillStyle=k.c2;
 const n=Math.max(3,Math.round(w/1.6));
 if(k.d==='rayas'){for(let i=1;i<n;i+=2)ctx.fillRect(x+i*w/n,y,w/n,h)}
 else if(k.d==='aros'){for(let i=1;i<5;i+=2)ctx.fillRect(x,y+i*h/5,w,h/5)}
 else if(k.d==='franja')ctx.fillRect(x,y+h*.32,w,h*.3);
 else if(k.d==='franjaV')ctx.fillRect(x+w*.36,y,w*.28,h);
 else if(k.d==='mitad')ctx.fillRect(x+w/2,y,w/2,h);
 else if(k.d==='banda'){ctx.beginPath();ctx.moveTo(x,y+h*.05);ctx.lineTo(x+w*.35,y);ctx.lineTo(x+w,y+h*.75);ctx.lineTo(x+w,y+h);ctx.lineTo(x+w*.7,y+h);ctx.closePath();ctx.fill()}
 else if(k.d==='v'){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w/2,y+h*.55);ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h*.2);ctx.lineTo(x+w/2,y+h*.75);ctx.lineTo(x,y+h*.2);ctx.closePath();ctx.fill()}
 else if(k.d==='cruz'){ctx.fillRect(x+w*.42,y,w*.16,h);ctx.fillRect(x,y+h*.3,w,h*.16)}
 ctx.restore()}
function seg(ctx,x0,y0,x1,y1,c,wd){ctx.strokeStyle=c;ctx.lineWidth=wd;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke()}
/* figura de cuerpo entero: piernas, brazos, torso y cabeza animados según la acción */
const FIG=2.1;/* las figuras se dibujan más grandes que la escala real, como en las transmisiones de juegos */
/* ---------- esqueleto 2D ----------
   Cada futbolista se arma con articulaciones: pelvis, torso (con inclinación), cuello y cabeza; hombro → codo → mano;
   cadera → rodilla → tobillo → botín. Los ángulos salen de la marcha (según velocidad y estado) o de la acción.
   Ángulos en radianes desde la vertical; positivo = hacia donde mira el jugador. */
const PEINADOS=['corto','rapado','largo','rulos','pelado','corto','rodete'];
const PELOS=['#1b120c','#2b1d14','#3b2618','#6b4423','#a0743b','#d8b26a','#111111'];
const BOTINES=['#111111','#f4f4f4','#ff3b30','#2f80ed','#f5c400','#00c389','#ff7a00','#111111'];
function hsh(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
/* rasgos de cada jugador: contextura ESTIMADA desde sus atributos (no hay altura real en la base), peinado y botines */
function rasgos(s){if(s._r)return s._r;const a=(s.e&&atr(s.e))||{},h=hsh(s.name||'x');
 const alto=clamp(.96+((a.salto||60)-60)/400+((a.cabeceo||60)-60)/500+(s.gk?.04:s.g==='DEF'?.02:s.g==='DEL'?0:-.01)+((h%7)-3)*.006,.92,1.08);
 const ancho=clamp(.95+((a.fuerza||60)-60)/300+((h>>3)%5-2)*.01,.9,1.1);
 return s._r={alto,ancho,pelo:PEINADOS[(h>>5)%PEINADOS.length],cpelo:PELOS[(h>>9)%PELOS.length],bot:BOTINES[(h>>13)%BOTINES.length],
  lean:((h>>17)%5-2)*.015,brazos:.85+((h>>20)%5)*.06,fuerza:a.fuerza||60,control:a.control||60,regate:a.regate||60,var:(h>>22)%4}}
function marcha(s,sp){/* ciclo de marcha: amplitud y flexión según velocidad; retroceso y desplazamiento lateral */
 const r=rasgos(s),A=clamp(sp/7.2,0,1),sprint=sp>6.2,ph=s.ph;const back=s.back?-1:1;
 let th=(sprint?.95:.8)*A,kn=(sprint?1.5:1.15)*A;if(s.lat){th*=.35;kn*=.5}
 const L=Math.sin(ph)*th*back,R=Math.sin(ph+Math.PI)*th*back;
 const LK=kn*Math.max(0,Math.sin(ph+1.3)),RK=kn*Math.max(0,Math.sin(ph+Math.PI+1.3));
 let lean=r.lean+(sprint?.2:.06*A);if(s.estado==='frenando')lean=-.16;if(s.back)lean=-.05;
 const arm=.85*A*r.brazos;return{la:L,ra:R,lk:LK,rk:RK,lu:-L*arm/th||0,ru:-R*arm/th||0,le:.5+.7*A,re:.5+.7*A,lean,bob:Math.abs(Math.sin(ph))*.025*A,rot:0,lift:0,splay:s.lat?.22:0}}
function postura(s,sp){const g=marcha(s,sp),pz=s.pose,pt=s.poseD?clamp(s.poseT/s.poseD,0,1):0,f=1,r=rasgos(s),S2=Math.sin(pt*Math.PI);
 const pieI=s.pie==='izq';const kick=(amp)=>{const k=amp*(1-Math.pow(pt*2-1,2));if(pieI){g.la=k;g.lk=.2;g.ra=-.15}else{g.ra=k;g.rk=.2;g.la=-.15}g.lu=-.7;g.ru=.6;g.lean=-.05};
 switch(pz){
  case'pasando':kick(.9);break;
  case'rematando':kick(1.35);g.lean=-.12;break;
  case'volea':kick(1.5);g.rot=-.35*S2;g.lift=.1*S2;break;
  case'controlando':if(pieI){g.la=.5*S2;g.lk=.6}else{g.ra=.5*S2;g.rk=.6}g.lean=.04;break;
  case'cabeceando':case'saltando':g.lift=.38*S2;g.la=-.2;g.ra=.25;g.lk=g.rk=.7;g.lu=g.ru=-2.4;g.le=g.re=.3;g.lean=pz==='cabeceando'?.22*S2:0;break;
  case'entrada':g.ra=1.2;g.rk=0;g.la=-.4;g.lk=.9;g.lean=-.35;g.rot=-.4*S2;break;
  case'barrida':g.rot=-1.15;g.ra=1.1;g.la=.3;g.lk=.8;g.rk=0;g.lu=-1.4;g.ru=.8;break;
  case'cayendo':g.rot=1.45*Math.min(1,pt*3);g.lu=-2;g.ru=-1.5;g.lk=g.rk=.4;break;
  case'levantandose':g.rot=1.45*(1-pt);g.lk=g.rk=1.4*(1-pt);break;
  case'desequilibrio':g.rot=.35*S2;g.lu=-2.2;g.ru=1.8;g.le=g.re=.2;break;
  case'amague':if(r.regate>=78){/* bicicleta: la pierna pasa por encima de la pelota */g.la=.7*Math.sin(pt*Math.PI*2);g.ra=-.5*Math.sin(pt*Math.PI*2);g.lk=g.rk=.5}g.rot=.2*Math.sin(pt*Math.PI*2);break;
  case'proteccion':g.lean=-.12;g.lu=1.2;g.le=.2;g.ru=-.4;g.la=-.25;g.ra=.25;g.lk=g.rk=.5;break;
  case'celebrando':{const v=s.celeb||0;if(v===0){g.lu=g.ru=-2.7;g.le=g.re=.1}else if(v===1){g.lu=-1.6;g.ru=1.6;g.le=g.re=0}/* avión */
   else if(v===2){g.rot=-.25;g.la=1.4;g.lk=1.6;g.ra=-.6;g.rk=1.4;g.lu=g.ru=-2.5}/* de rodillas */else{g.ru=-2.9;g.re=.9;g.lu=.5}g.lift=pt<.25?.25*S2:0;break}
  case'abrazo':g.lu=1.3;g.ru=1.1;g.le=g.re=1.2;g.lean=.12;break;
  case'protesta':g.lu=-1.8;g.ru=1.8;g.le=g.re=.6;break;
  case'lamento':if((r.var%2)===0){g.lu=g.ru=-2.9;g.le=g.re=2.3;g.la=g.ra=0;g.lk=g.rk=0}else{g.lean=.6;g.lk=g.rk=1.4;g.la=g.ra=.6;g.lu=g.ru=.8}break;
  case'pide':g.ru=-2.8;g.re=.2;break;
  case'atajando':g.lu=g.ru=1.6;g.le=g.re=.3;g.lk=g.rk=.6;break;
  case'estirada':g.rot=(s.vy>0?1:-1)*1.25*Math.min(1,pt*3);g.lift=.3*Math.sin(Math.min(1,pt*1.6)*Math.PI);g.lu=g.ru=-2.9;g.le=g.re=0;g.la=.1;g.ra=-.3;break;
  case'saque':g.lu=g.ru=-3;g.le=g.re=.4;g.lean=-.15;break;
  case'tarjeta':g.ru=-3;g.re=0;break;
  case'pasando-primera':kick(.7);break;
 }
 if(!pz||pz==='run'){if(s.gk&&s.espera){g.lk=g.rk=.6;g.lu=.9;g.ru=.9;g.le=g.re=.5;g.lean=.15;g.splay=.25}}
 return g}
function figura(ctx,s,P,isRef){const kit=isRef?{d:'liso',c1:'#111111',c2:'#ffd400',sh:'#111111',me:'#111111',cu:'#ffd400',ma:'#111111'}:kitOf(s);const r=isRef?{alto:1,ancho:1,pelo:'corto',cpelo:'#2b1d14',bot:'#111',lean:0,brazos:1}:rasgos(s);
 const sc=P[2],H=1.85*sc*FIG*r.alto;if(H<3)return;const sp=Math.hypot(s.vx,s.vy),f=s.face||1;const g=postura(s,sp);
 const x=P[0],y=P[1];ctx.globalAlpha=s.alpha;
 /* sombra */
 ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(x+H*.05,y,H*.27*r.ancho,H*.07,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(x,y-H*(g.lift+g.bob));ctx.rotate(g.rot*f);ctx.scale(f,1);
 const hipY=-H*.5,shY=-H*.8,thL=H*.255,shL=H*.245,uaL=H*.165,faL=H*.15,lw=Math.max(1.2,H*.085*r.ancho),aw=Math.max(1,H*.062*r.ancho);
 const skin=s.skin||'#e0ac83';
 const pierna=(a,k,lado)=>{const hx=lado*H*.035+(lado*g.splay*H*.08),kx=hx+Math.sin(a)*thL,ky=hipY+Math.cos(a)*thL,sa=a-k,fx=kx+Math.sin(sa)*shL,fy=ky+Math.cos(sa)*shL;
  seg(ctx,hx,hipY,kx,ky,kit.sh,lw*1.18);/* muslo con pantalón */
  seg(ctx,(hx+kx)/2,(hipY+ky)/2,kx,ky,skin,lw*.95);/* rodilla */
  seg(ctx,kx,ky,fx,fy,kit.me,lw*.95);/* media */
  ctx.save();ctx.translate(fx,fy);ctx.rotate(sa*.6);ctx.fillStyle=r.bot;ctx.beginPath();ctx.ellipse(lw*.45,0,lw*.95,lw*.48,0,0,Math.PI*2);ctx.fill();ctx.restore()};
 const brazo=(u,e,lado)=>{const sx=lado*H*.02,sy=shY+H*.035,ex=sx+Math.sin(u)*uaL,ey=sy+Math.cos(u)*uaL,fa=u+e*(u<0?-1:1)*.9,hx=ex+Math.sin(fa)*faL,hy=ey+Math.cos(fa)*faL;
  seg(ctx,sx,sy,ex,ey,kit.ma||kit.c1,aw*1.25);seg(ctx,sx+(ex-sx)*.55,sy+(ey-sy)*.55,ex,ey,(s.gk&&!isRef)?(kit.ma||kit.c1):skin,aw);seg(ctx,ex,ey,hx,hy,(s.gk&&!isRef)?'#f4f4f4':skin,aw*.95)};
 /* lado lejano primero */
 brazo(g.lu,g.le,-1);pierna(g.la,g.lk,-1);
 /* torso con inclinación */
 ctx.save();ctx.translate(0,hipY);ctx.rotate(g.lean);
 const tw=H*.2*r.ancho,ww=H*.155*r.ancho,th=hipY-shY;
 ctx.fillStyle=kit.sh;ctx.beginPath();ctx.moveTo(-ww*.55,-H*.02);ctx.lineTo(ww*.55,-H*.02);ctx.lineTo(ww*.6,H*.09);ctx.lineTo(-ww*.6,H*.09);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.moveTo(-ww/2,0);ctx.lineTo(ww/2,0);ctx.lineTo(tw/2,-th);ctx.lineTo(-tw/2,-th);ctx.closePath();ctx.save();ctx.clip();torso(ctx,kit,-tw/2,-th,tw,th);ctx.restore();
 ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=.6;ctx.stroke();
 /* cuello de la camiseta */
 ctx.fillStyle=kit.cu||kit.c2;ctx.beginPath();ctx.moveTo(-tw*.18,-th);ctx.lineTo(tw*.18,-th);ctx.lineTo(0,-th+H*.035);ctx.closePath();ctx.fill();
 /* cabeza */
 const hr=H*.066,hy=-th-H*.095;ctx.fillStyle=skin;ctx.fillRect(-H*.018,-th-H*.035,H*.036,H*.04);
 ctx.beginPath();ctx.arc(H*.008,hy,hr,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=r.cpelo;const pe=r.pelo;
 if(pe==='corto'){ctx.beginPath();ctx.arc(H*.004,hy-hr*.15,hr*1.02,Math.PI*1.05,Math.PI*2.02);ctx.fill()}
 else if(pe==='rapado'){ctx.globalAlpha=s.alpha*.55;ctx.beginPath();ctx.arc(H*.006,hy-hr*.1,hr*.98,Math.PI,Math.PI*2);ctx.fill();ctx.globalAlpha=s.alpha}
 else if(pe==='largo'){ctx.beginPath();ctx.arc(H*.0,hy-hr*.1,hr*1.08,Math.PI*.9,Math.PI*2.05);ctx.fill();ctx.fillRect(-hr*1.05,hy-hr*.2,hr*.75,hr*1.45)}
 else if(pe==='rulos'){for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-hr*.7+i*hr*.35,hy-hr*.75+Math.abs(i-2)*hr*.12,hr*.36,0,Math.PI*2);ctx.fill()}}
 else if(pe==='rodete'){ctx.beginPath();ctx.arc(H*.004,hy-hr*.15,hr*1.02,Math.PI*1.05,Math.PI*2.02);ctx.fill();ctx.beginPath();ctx.arc(-hr*.9,hy-hr*.55,hr*.38,0,Math.PI*2);ctx.fill()}
 ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.arc(hr*.55,hy+hr*.15,hr*.18,0,Math.PI*2);ctx.fill();/* nariz hacia donde mira */
 ctx.restore();
 /* lado cercano */
 pierna(g.ra,g.rk,1);brazo(g.ru,g.re,1);
 ctx.restore();ctx.globalAlpha=1;
 if(s.card&&s.cardT>0){ctx.fillStyle=s.card==='red'?'#e02a2a':'#ffd400';ctx.fillRect(x-H*.06+f*H*.12,y-H*1.25,H*.13,H*.18)}}
/* vista desde arriba (Cenital): hombros con la camiseta, cabeza y piernas que se alternan; Táctica: fichas con número */
function marca(ctx,s,P){const k=kitOf(s),r=Math.max(4,P[2]*.95);ctx.globalAlpha=s.alpha;
 if(S.cam==='cen'){const sp=Math.hypot(s.vx,s.vy),ang=sp>.3?Math.atan2(s.vy,s.vx):((s.face||1)>0?0:Math.PI),A=clamp(sp/7,0,1),sw=Math.sin(s.ph)*r*.55*A,ra=rasgos(s);
  ctx.save();ctx.translate(P[0],P[1]);ctx.rotate(ang);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(1.2,1.2,r*.75,r*1.05,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=k.me;ctx.beginPath();ctx.ellipse(sw,-r*.35,r*.3,r*.2,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(-sw,r*.35,r*.3,r*.2,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(0,0,r*.5,r*.95,0,0,Math.PI*2);ctx.save();ctx.clip();torso(ctx,k,-r,-r,r*2,r*2);ctx.restore();
  ctx.fillStyle=k.ma||k.c1;ctx.beginPath();ctx.arc(-sw*.6,-r*.95,r*.22,0,Math.PI*2);ctx.arc(sw*.6,r*.95,r*.22,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ra.cpelo;ctx.beginPath();ctx.arc(r*.05,0,r*.38,0,Math.PI*2);ctx.fill();ctx.restore();ctx.globalAlpha=1;return}
 ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(P[0]+1,P[1]+1.5,r,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.beginPath();ctx.arc(P[0],P[1],r,0,Math.PI*2);ctx.clip();torso(ctx,k,P[0]-r,P[1]-r,r*2,r*2);ctx.restore();
 ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(P[0],P[1],r,0,Math.PI*2);ctx.stroke();
 const clara=luzK(k.c1);ctx.fillStyle=clara?'#111':'#fff';ctx.font=`700 ${Math.round(r*1.1)}px "Barlow Semi Condensed",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.num),P[0],P[1]+.5);
 ctx.globalAlpha=1}
function luzK(h){h=String(h||'#000').replace('#','');const c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return(c[0]*.3+c[1]*.59+c[2]*.11)/255>.6}
function draw(){const ctx=S.cx,dpr=S.dpr;ctx.setTransform(dpr,0,0,dpr,0,0);drawPitch(ctx);
 const top=S.cam==='cen'||S.cam==='tac';
 if(S.cam==='tac'){/* líneas de cada equipo */[0,1].forEach(t=>{const L=S.sp.filter(s=>s.team===t&&!s.out&&!s.gk);['DEF','MED','DEL'].forEach(g=>{const A=L.filter(s=>s.g===g).sort((a,b)=>slot(a).l-slot(b).l);if(A.length<2)return;ctx.strokeStyle=t?'rgba(120,170,255,.35)':'rgba(255,210,120,.35)';ctx.lineWidth=1;ctx.beginPath();A.forEach((s,i)=>{const p=proj(s.x,s.y);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])});ctx.stroke()})})}
 const all=S.sp.filter(s=>s.alpha>0).concat(S.ref?[S.ref]:[]);all.sort((a,b)=>a.y-b.y);
 const b=S.ball,bp=proj(b.x,b.y,b.z),bs=proj(b.x,b.y,0);
 let ballDrawn=false;const drawBall=()=>{ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(bs[0],bs[1],Math.max(1.5,bs[2]*.18),Math.max(.8,bs[2]*.08),0,0,Math.PI*2);ctx.fill();
  const r=Math.max(2,bp[2]*(top?.32:.14*FIG));ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bp[0],bp[1]-(top?0:r),r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=.6;ctx.stroke();ballDrawn=true};
 for(const s of all){if(!ballDrawn&&s.y>b.y)drawBall();const P=proj(s.x,s.y,0);if(top){if(s===S.ref)continue;marca(ctx,s,P)}else figura(ctx,s,P,s===S.ref)}
 if(!ballDrawn)drawBall();
 /* jugador con la pelota */
 const o=S.owner;if(o&&!top){const P=proj(o.x,o.y,0),H=1.85*P[2]*FIG;ctx.strokeStyle='#f5e14a';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(P[0],P[1],H*.34,H*.1,0,0,Math.PI*2);ctx.stroke();
  const t=`${o.num} ${corto(o.name)}`;ctx.font='700 11px "Barlow Semi Condensed",Arial';const tw=ctx.measureText(t).width+10,ty=P[1]-H*1.25-14;
  ctx.fillStyle='rgba(4,8,20,.9)';ctx.fillRect(P[0]-tw/2,ty,tw,14);ctx.fillStyle='#e02a2a';ctx.beginPath();ctx.moveTo(P[0]-4,ty+14);ctx.lineTo(P[0]+4,ty+14);ctx.lineTo(P[0],ty+19);ctx.fill();
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,P[0],ty+7.5)}
 /* textos: gráfica de TV (marcador y minuto) y carteles debajo */
 let bY=8;if(Q.on){bY=marcadorTV(ctx)}else if(!top&&S.m){const ab=n=>String(n||'').replace(/^(Club |CA |CD |FC |AC |SS |RC |Real |Atlético |Deportivo )/i,'').slice(0,3).toUpperCase();
  const m=S.m,loc=m.venue==='a'?m.away:m.home,vis=m.venue==='a'?m.home:m.away,g=m.venue==='a'?[S.goles[1],S.goles[0]]:S.goles;
  const t1=ab(loc),t2=ab(vis),mn=(m.minute||0)+"'";ctx.save();ctx.font='800 11px "Barlow Semi Condensed",Arial';ctx.textBaseline='middle';
  const k=S.kits,c1=k&&k.local&&k.local.c1||'#c33',c2=k&&k.visita&&k.visita.c1||'#33c';
  ctx.fillStyle='rgba(4,8,20,.88)';ctx.fillRect(8,8,118,18);ctx.fillStyle=c1;ctx.fillRect(8,8,3,18);ctx.fillStyle=c2;ctx.fillRect(83,8,3,18);
  ctx.fillStyle='#fff';ctx.textAlign='left';ctx.fillText(t1,14,17.5);ctx.fillText(t2,57,17.5);ctx.fillStyle='#e2bd70';ctx.textAlign='center';ctx.fillText(g[0]+'-'+g[1],45,17.5);
  ctx.fillStyle='#fff';ctx.fillText(mn,105,17.5);ctx.restore();bY=30}
 if(S.banner){ctx.font='800 italic 12px "Barlow Semi Condensed",Arial';const t=S.banner.txt,tw=ctx.measureText(t).width+18;ctx.fillStyle='rgba(4,8,20,.85)';ctx.fillRect(8,bY,tw,20);ctx.fillStyle=S.banner.col;ctx.fillRect(8,bY,3,20);ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(t,16,bY+10.5)}
 if(S.big){const k=1-S.big.t/S.big.d,sc=1+Math.min(.25,k*.6);ctx.save();ctx.translate(S.w/2,S.h*.42);ctx.scale(sc,sc);ctx.font=`900 italic ${Math.round(S.h*.2)}px "Barlow Semi Condensed",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.globalAlpha=Math.min(1,S.big.t*2);ctx.lineWidth=5;ctx.strokeStyle='rgba(4,8,20,.85)';ctx.strokeText(S.big.txt,0,0);ctx.fillStyle=S.big.col;ctx.fillText(S.big.txt,0,0);ctx.restore();ctx.globalAlpha=1}}

/* ---------- bucle ---------- */
function speed(){let v=1;try{v=matchSpeed||1}catch(e){}return v}
function frame(ts){S.raf=0;if(!S.cv||!S.cv.isConnected){return}
 const now=ts/1000,crudo=S.last?now-S.last:.016,real=Math.min(.05,crudo);S.last=now;const tf0=performance.now();if(S.perf){S.perf.real+=crudo;if(crudo>.05)S.perf.lentos++}const dt=real*speed()*(Q.on?1:ritmoV2());S.t+=dt;
 resize();const m=S.m;
 if(m&&Q.on){try{frameV3(real,crudo)}catch(e){console.warn('MC2D v3',e)}if(S.banner){S.banner.t-=real;if(S.banner.t<=0)S.banner=null}if(S.big){S.big.t-=real;if(S.big.t<=0)S.big=null}
  const R=Q.live,Z=R?cuadroEn(Q.tv.cuadros,R.tp+12):null;Q.fut=Z?[Z.A.d[0]/10,Z.A.d[1]/10]:null}
 else if(m&&!S.rep){syncPlayers();
  /* la circulación de posesión se corta en cuanto el motor produce un evento */
  if(S.play&&S.play.filler&&S.shown<(m.events||[]).length&&!S.ball.fly){S.play=null;S.sp.forEach(s=>{if(!s.out)s.ov=null})}
  if(!S.play)next();runPlay(dt);
  marcasT-=dt;if(marcasT<=0){marcasT=.4;const o=S.owner;S.pressers=[];
   /* presión: 1 jugador; 2 si la táctica es de presión alta y la pelota está en la mitad del rival (o en la propia con bloque alto) */
   if(o&&!S.reset&&!o.gk){const t=1-o.team,P=(tacOf(t).pressing??50),enSuMitad=(dirOf(t)>0?S.ball.x>52.5:S.ball.x<52.5);const pr=P>62&&(enSuMitad||bloque(t)==='alto')?2:1;
    S.pressers=S.sp.filter(s=>s.team===t&&!s.out&&!s.gk&&Math.hypot(s.x-o.x,s.y-o.y)<(P>62?22:16)).sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y)).slice(0,pr)}
   /* línea de offside de cada equipo (en sus coordenadas de ataque): el último defensor rival de campo */
   S.offside=[0,1].map(t=>{const A=x=>dirOf(t)>0?x:PW-x;const d=S.sp.filter(s=>s.team!==t&&!s.out&&!s.gk).map(s=>A(s.x));return d.length?Math.max(Math.max(...d),Math.min(52.5,A(S.ball.x))):60});
   asignarMarcas()}
  buscarSuelta();if(S.chaser){S.sueltaT=(S.sueltaT||0)+dt;S.sueltaMax=Math.max(S.sueltaMax||0,S.sueltaT)}else S.sueltaT=0;
  {const o=S.owner;if(o&&o.pose==='run'&&!S.reset){const pr=S.sp.find(x=>x.team!==o.team&&!x.out&&Math.hypot(x.x-o.x,x.y-o.y)<2);if(pr&&rasgos(o).fuerza>=66)accion(o,'proteccion')}}
  ballStep(dt);S.sp.forEach(s=>{step(s,dt);if(s.cardT>0)s.cardT-=dt;else s.card=null});
  if(S.ref){const r=S.ref;r.ov={x:clamp(S.ball.x-dirOf(0)*8,8,97),y:clamp(S.ball.y+12,6,62),run:.7};step(r,dt)}
  if(S.banner){S.banner.t-=real;if(S.banner.t<=0)S.banner=null}if(S.big){S.big.t-=real;if(S.big.t<=0)S.big=null}}
 if(m&&!S.rep&&!Q.on)grabar();
 if(S.rep&&!Q.on){S.rep.t+=real*S.rep.v;if(S.rep.t>=S.rep.fin){S.rep=null;S.zoom=1.1;if(!S.play)next()}else{const L=S.rep.L;let i=0;while(i<L.length-2&&L[i+1].t<S.rep.t)i++;const A=L[i].b,B=(L[i+1]||L[i]).b;S.rep.b={x:(A.x+B.x)/2,y:(A.y+B.y)/2,fly:null}}}
 camara(real);
 if(visible()){const t0=performance.now();if(Q.on&&Q.rep)dibujarRepV3();else if(S.rep)dibujarRepeticion();else draw();const ms=performance.now()-t0;S.perf.n++;S.perf.tot+=ms;if(ms>S.perf.max&&S.perf.n>30)S.perf.max=ms}
 if(S.perf)S.perf.frame+=performance.now()-tf0;S.raf=requestAnimationFrame(frame)}
/* ---------- repetición: se graban posiciones reales (20 por segundo) y se vuelven a dibujar en cámara lenta ---------- */
function prims(o){const r={};for(const k in o){const v=o[k];if(v===null||typeof v!=='object'&&typeof v!=='function')r[k]=v}return r}
let recT=0;function grabar(){if(S.t-recT<.05)return;recT=S.t;S.rec.push({t:S.t,sp:S.sp.map(prims),ref:S.ref?prims(S.ref):null,b:prims(S.ball),cx:S.camX,cy:S.camY});
 while(S.rec.length&&S.t-S.rec[0].t>10)S.rec.shift()}
function iniciarRepeticion(){const fin=S.golT||S.t;const largo=speed()>=4?3.2:4.8;const L=S.rec.filter(r=>r.t>=fin-largo&&r.t<=fin+.8);
 if(L.length<10){S.golT=null;return false}S.rep={L,t:L[0].t,fin:L[L.length-1].t,v:.55};S.golT=null;S.repN=(S.repN||0)+1;return true}
function dibujarRepeticion(){const R=S.rep,L=R.L;let i=0;while(i<L.length-2&&L[i+1].t<R.t)i++;const A=L[i],B=L[i+1]||A,k=B.t>A.t?clamp((R.t-A.t)/(B.t-A.t),0,1):0;
 const guard=S.sp.map(prims),gref=S.ref?prims(S.ref):null,gb=prims(S.ball),go=S.owner,gcx=S.camX,gcy=S.camY,gbn=S.banner,gbig=S.big;
 S.sp.forEach((s,j)=>{const a=A.sp[j],c=B.sp[j];if(!a)return;Object.assign(s,a);if(c){s.x=lerp(a.x,c.x,k);s.y=lerp(a.y,c.y,k)}});
 if(S.ref&&A.ref)Object.assign(S.ref,A.ref);Object.assign(S.ball,A.b);S.ball.x=lerp(A.b.x,B.b.x,k);S.ball.y=lerp(A.b.y,B.b.y,k);S.ball.z=lerp(A.b.z||0,B.b.z||0,k);
 S.owner=null;S.banner=null;S.big=null;
 try{draw();const ctx=S.cx;ctx.save();ctx.font='900 italic 13px "Barlow Semi Condensed",Arial';const t='REPETICIÓN',tw=ctx.measureText(t).width+22,x=(S.w-tw)/2,y=S.h-34;
  ctx.fillStyle='rgba(4,8,20,.88)';ctx.fillRect(x,y,tw,22);ctx.fillStyle='#e2bd70';ctx.fillRect(x,y,4,22);ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(t,x+12,y+11.5);
  ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillRect(x,y+23,tw*clamp((R.t-L[0].t)/(R.fin-L[0].t),0,1),2);ctx.restore()}
 finally{S.sp.forEach((s,j)=>Object.assign(s,guard[j]));if(gref)Object.assign(S.ref,gref);Object.assign(S.ball,gb);S.owner=go;S.camX=gcx;S.camY=gcy;S.banner=gbn;S.big=gbig}}

function ritmoV2(){return{quick:4,normal:2.4,long:1.2}[largoPartido()]||2.4}
function dibujarRepV3(){const R=Q.rep.R,g={sp:S.sp,ball:S.ball,ref:S.ref,owner:S.owner,banner:S.banner,big:S.big};
 S.sp=R.list;S.ball=R.ball;S.ref=R.ref;S.owner=null;S.banner=null;S.big=null;
 try{draw();const ctx=S.cx;ctx.save();ctx.font='900 italic 13px "Barlow Semi Condensed",Arial';const t='REPETICIÓN',tw=ctx.measureText(t).width+22,x=(S.w-tw)/2,y=S.h-34;
  ctx.fillStyle='rgba(4,8,20,.88)';ctx.fillRect(x,y,tw,22);ctx.fillStyle='#e2bd70';ctx.fillRect(x,y,4,22);ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(t,x+12,y+11.5);
  const c=R.c,k=c.length?clamp((R.tp-c[0].t)/Math.max(1,Q.rep.fin-c[0].t),0,1):0;ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillRect(x,y+23,tw*k,2);ctx.restore()}
 finally{S.sp=g.sp;S.ball=g.ball;S.ref=g.ref;S.owner=g.owner;S.banner=g.banner;S.big=g.big}}
function saltarV3(t){const R=Q.live;if(!R)return;R.tp=t;for(;R.evi<R.ev.length&&R.ev[R.evi].t<=t;R.evi++){const e=R.ev[R.evi];if(e.tipo==='cambio'){if(e.salienteSlot>=0)R.sal[e.salienteSlot]=e.saleClave;R.slot[e.sid]=e.clave}if(e.tipo==='descuento')Q.desc[e.parte]=e.minutos}Q.rep=null;Q.repPend=null}
function init(m){S.m=m;S.sp=[];S.byKey=new Map();S.queue=[];S.play=null;S.owner=null;S.ball=newBall();S.half=(m.clock&&m.clock.half)||1;
 S.phase=m.phase||'pre';S.goles=[0,0];S.banner=null;S.big=null;S.reset=false;S.rec=[];S.rep=null;S.golT=null;S.repN=0;S.zoom=1.1;S.camY=34;S.camT=null;S.perf={n:0,tot:0,max:0,real:0,lentos:0,frame:0};
 try{const loc=m.venue==='a'?m.away:m.home,vis=m.venue==='a'?m.home:m.away;const k=window.MCCamisetas?MCCamisetas.partido(loc,vis):null;S.kits=k}catch(e){S.kits=null}
 S.ref={key:'ref',team:-1,name:'Árbitro',num:'',x:50,y:44,vx:0,vy:0,vmax:6.5,acc:4,ph:0,pose:'run',poseT:0,poseD:0,alpha:1,face:1,skin:'#d9a87e',reg:50,vis:50,cad:1,estado:'quieto'};
 /* lo que ya pasó antes de montar el visor se muestra sin animar */
 const E=m.events||[];S.shown=E.length;contar();S.tele=0;S.posId=m.v2&&m.v2.posesion&&m.v2.posesion.length?m.v2.posesion[m.v2.posesion.length-1].id:0;
 syncPlayers();S.sp.forEach(s=>{const p=formPos(s);s.x=p[0];s.y=p[1]});
 Q.on=false;const tv=v3de(m);if(tv&&tv.formato)initV3(m,tv);
 }

/* ======================= MODO v3: SE DIBUJA LA CINTA REAL DEL MOTOR v3 =======================
   Con un partido v3, el 2D NO actúa el relato: dibuja solo lo que pasó en la cancha simulada.
   - Posiciones de los 22, la pelota (con altura y sombra), el árbitro y los que salen caminando: de la cinta
     (10 cuadros por segundo), interpoladas entre cuadro y cuadro.
   - Poses: de los eventos de la cancha (pase, remate, cabezazo, atajada, entrada, falta, tarjeta, festejo...)
     y de la velocidad de cada uno (caminar, trotar, correr). Si algo no está en la simulación, no se dibuja.
   - Repetición de los goles: los mismos cuadros de la cinta, en cámara lenta.
   - Ritmo: el partido dura lo que dice "Duración del partido" (Corto ~3 min, Normal ~5, Largo ~10 a x1); las fases
     sin peligro se aceleran solas y las jugadas de peligro, los goles y la pelota parada van más lentas.        */
const Q={on:false,tv:null,tp:0,rep:null,win:[],wi:0,evw:0,pendTL:null,pendPen:null,realT:0,dObs:0,tObs:0,rate:200,desc:{},hist:[],
 live:null,ent:new Map(),rend:0,ultMin:'',ultCorte:-1,saltos:{cinta:0,pelota:0,dibujo:0,log:null},difMax:0,difN:0,festVisto:0,abrazoVisto:0,lamentoVisto:0,repStats:[],
 mitad:false,esperaReal:0,peligroReal:0,calmaReal:0,repReal:0,listo:false};
const DUR={quick:180,normal:300,long:600};
function largoPartido(){let v='quick';try{v=(document.getElementById('matchLength')||{}).value||'quick'}catch(e){}return DUR[v]?v:'normal'}
function v3de(m){try{return m&&m.v3&&window.MCV3TV?MCV3TV.de(m):null}catch(e){return null}}
/* entradas del juego (para nombre, número y camiseta) por clave */
function refrescarEntradas(m){const add=(e,side)=>{if(e&&e.key!=null)Q.ent.set(e.key,{e,side})};
 (m.own||[]).forEach(e=>add(e,'o'));(m.riv||[]).forEach(e=>add(e,'r'));(m.ownBench||[]).forEach(p=>add({p,key:'o'+p.id,g:p.pos},'o'));(m.rivBench||[]).forEach(e=>add(e,'r'))}
function puestoDe(clave){const L=Q.tv&&Q.tv.puestos||[];return L.find(p=>p.clave===clave)||null}
/* reproductor: un estado de dibujo que sigue una cinta (el partido en vivo o el recorte de una repetición) */
function nuevoRep(o){return{c:o.cuadros,fmt:o.fmt,ev:o.eventos,evi:0,slot:o.slot.slice(),sal:o.sal.slice(),tp:o.t0,sp:new Map(),list:[],ball:newBall(),
 ref:{key:'ref',team:-1,name:'Árbitro',num:'',x:52.5,y:40,vx:0,vy:0,vmax:7,acc:3,ph:0,pose:'run',poseT:0,poseD:0,alpha:1,face:1,skin:'#d9a87e',reg:50,vis:50,cad:1,estado:'quieto'},
 owner:null,ownerId:-1,fest:null,vivo:!!o.vivo,prev:new Map()}}
function spriteDe(R,clave,j){let s=R.sp.get(clave);if(s)return s;
 let x=Q.ent.get(clave),team,e;
 if(x){e=x.e;team=x.side==='o'?0:1}
 else{const p=puestoDe(clave)||{nombre:'Jugador',eq:0,gk:false,pos:'MED'};team=p.eq===Q.tv.eOwn?0:1;e={key:clave,name:p.nombre,pos:p.pos,g:p.gk?'POR':(p.pos||'MED'),r:60}}
 s=mkSprite(e,team,j);s.gk=e.g==='POR'||!!(puestoDe(clave)||{}).gk;s.alpha=0;R.sp.set(clave,s);R.list.push(s);return s}
function cuadroEn(c,t){if(!c.length)return null;const ft=Math.floor(t),base=c[0].t;let k=clamp(ft-base,0,c.length-1);
 while(k>0&&c[k].t>ft)k--;while(k<c.length-1&&c[k+1].t<=ft)k++;
 const A=c[k],B=c[Math.min(k+1,c.length-1)];return{A,B,f:B.t>A.t?clamp((t-A.t)/(B.t-A.t),0,1):0,k}}
const AREA=(x,y,der)=>(der?x>105-16.5:x<16.5)&&y>13.84&&y<54.16;
/* eventos de la cancha → poses, carteles, cambios de quién ocupa cada puesto */
function aplicarEvento(R,ev){
 const sj=id=>{if(id==null||id<0)return null;const k=R.slot[id];return k!=null?spriteDe(R,k,id):null};
 const j=sj(ev.jid),vivo=R.vivo,nom=ev.jugador?corto(ev.jugador):'';
 switch(ev.tipo){
  case 'cambio':{if(ev.salienteSlot!=null&&ev.salienteSlot>=0)R.sal[ev.salienteSlot]=ev.saleClave;R.slot[ev.sid]=ev.clave;
   if(vivo){Q.hist.push({t:ev.t,slot:R.slot.slice(),sal:R.sal.slice()});banner(`🔁 Cambio · entra ${corto(ev.entra)}, sale ${corto(ev.sale)}`,'#7fd3ff',2.6)}break}
  case 'pase':if(j)accion(j,'pasando');break;
  case 'remate':if(j)accion(j,ev.cabeza?'cabeceando':(R.ball.z>.8?'volea':'rematando'));break;
  case 'atajada':if(j)accion(j,ev.retenida?'atajando':'estirada');if(vivo&&!ev.penal)banner(`🧤 ${nom}`,'#ffffff',1.6);if(vivo&&ev.penal)bigTxt('¡ATAJÓ!','#e2bd70',1.4);break;
  case 'quite':if(j)accion(j,'entrada');break;
  case 'intercepcion':if(j)accion(j,'controlando');break;
  case 'gambeta':if(j&&ev.ok)accion(j,'amague');break;
  case 'falta':{if(j)accion(j,ev.gravedad&&ev.gravedad!=='normal'&&ev.gravedad!=='mano'?'barrida':'entrada');const v=sj(ev.sid);if(v)accion(v,'cayendo');
   if(vivo)banner(ev.gravedad==='mano'?`✋ Mano · ${nom}`:`Falta de ${nom}`,'#ffffff',1.8);break}
  case 'amarilla':case 'roja':{if(j){j.card=ev.tipo==='roja'?'red':'yellow';j.cardT=2.2}accion(R.ref,'tarjeta');
   if(vivo)banner(`${ev.tipo==='roja'?'🟥 Roja':'🟨 Amarilla'} · ${nom}`,ev.tipo==='roja'?'#ff4d4d':'#ffd400',2.6);break}
  case 'lesion':if(j)accion(j,'cayendo',2.6);if(vivo)banner(`✚ Lesión · ${nom}`,'#ff6b5b',2.2);break;
  case 'corner':if(vivo)banner('🚩 Córner','#e2bd70',2);break;
  case 'penal':if(vivo){bigTxt('¡PENAL!','#ff6b5b',1.3);banner(`⚠ Penal · patea ${nom}`,'#ff6b5b',2.4)}break;
  case 'tiro_libre':if(vivo)banner(ev.modo==='directo'||ev.modo==='ensayada'?`Tiro libre peligroso${ev.barrera?' · barrera de '+ev.barrera:''}`:'Tiro libre','#e2bd70',2);break;
  case 'offside':if(vivo)banner(`🚩 Offside · ${nom}`,'#ffffff',1.8);break;
  case 'lateral':if(j)accion(j,'saque');break;
  case 'palo':if(vivo)banner('¡Al palo!','#ffffff',1.6);break;
  case 'descuento':if(vivo){Q.desc[ev.parte]=ev.minutos;banner(`⏱ +${ev.minutos} de descuento`,'#e2bd70',2.2)}break;
  case 'gol':{R.fest=ev.festejo?{t0:ev.t,hasta:ev.t+ev.festejo,clave:R.slot[ev.jid],eq:ev.equipo,team:j?j.team:null}:null;
   if(vivo){bigTxt('¡GOL!','#e2bd70',1.8);banner(`⚽ ${nom}${ev.enContra?' (en contra)':''}`,'#e2bd70',3);
    if(!Q.repPend)Q.repPend={tg:ev.t,at:ev.t+(ev.festejo?70:25),origen:ev.origen||'',der:ev.x>52.5}}break}
  case 'entretiempo':if(vivo)bigTxt('ENTRETIEMPO','#e2bd70',1.8);break;
  case 'final':if(vivo)bigTxt('FINAL','#e2bd70',2);break;
 }
}
/* actualiza el reproductor al instante R.tp (ticks): posiciones interpoladas y animación */
function actualizarRep(R,dtGame){
 while(R.evi<R.ev.length&&R.ev[R.evi].t<=R.tp){try{aplicarEvento(R,R.ev[R.evi])}catch(e){console.warn('MC2D v3',e)}R.evi++}
 const Z=cuadroEn(R.c,R.tp);if(!Z)return false;const {A,B,f}=Z,F=R.fmt,nJ=F.jugadores,vt=B.t>A.t?10/(B.t-A.t):0;
 const usados=new Set();
 const pon=(s,ia)=>{const ax=A.d[ia],ay=A.d[ia+1],bx=B.d[ia],by=B.d[ia+1];if(ax===-32768||bx===-32768)return;
  const x=lerp(ax,bx,f)/10,y=lerp(ay,by,f)/10;s.vx=(bx-ax)/10*vt;s.vy=(by-ay)/10*vt;s.x=x;s.y=y;usados.add(s)};
 for(let j=0;j<nJ;j++){const k=R.slot[j];if(k==null)continue;pon(spriteDe(R,k,j),5+j*2)}
 for(let q=0;q<(F.nSalientes||0);q++){const k=R.sal[q];if(k==null)continue;const s=spriteDe(R,k,q);if(usados.has(s))continue;pon(s,F.salientes+q*2)}
 /* pelota y árbitro */
 const b=R.ball;b.x=lerp(A.d[0],B.d[0],f)/10;b.y=lerp(A.d[1],B.d[1],f)/10;b.z=Math.max(0,lerp(A.d[2],B.d[2],f)/10);b.fly=null;
 {const r=R.ref,ia=F.arbitro;r.vx=(B.d[ia]-A.d[ia])/10*vt;r.vy=(B.d[ia+1]-A.d[ia+1])/10*vt;r.x=lerp(A.d[ia],B.d[ia],f)/10;r.y=lerp(A.d[ia+1],B.d[ia+1],f)/10;animar(r,dtGame)}
 const oid=A.d[3];if(oid!==R.ownerId){R.ownerId=oid;const s=oid>=0&&R.slot[oid]!=null?spriteDe(R,R.slot[oid],oid):null;if(s&&(!s.pose||s.pose==='run'))accion(s,'controlando',.3);R.owner=s}
 /* festejo: el goleador festeja al llegar al córner, los compañeros lo abrazan, los rivales se lamentan */
 const Fe=R.fest&&R.tp>=R.fest.t0&&R.tp<=R.fest.hasta?R.fest:null;
 for(const s of R.list){
  if(!usados.has(s)){s.alpha=0;continue}
  const fuera=s.y<-1.2||s.y>PH+1.2||s.x<-1.2||s.x>PW+1.2,sp=Math.hypot(s.vx,s.vy);
  if(fuera&&sp<.2){s.quietoT=(s.quietoT||0)+dtGame;s.alpha=clamp(1-(s.quietoT-1.5),0,1)}else{s.quietoT=0;s.alpha=1}
  if(Fe&&s.alpha>0){const aut=R.sp.get(Fe.clave);
   if(s===aut){if(sp<1.4&&s.pose!=='celebrando'){s.celeb=(rasgos(s).var+Math.floor(Fe.t0/7))%4;accion(s,'celebrando',1.6);if(R.vivo)Q.festVisto++}}
   else if(aut&&s.team===aut.team&&!s.gk&&Math.hypot(s.x-aut.x,s.y-aut.y)<1.9&&s.pose!=='abrazo'){accion(s,'abrazo',1.2);if(R.vivo)Q.abrazoVisto++}
   else if(aut&&s.team!==aut.team&&sp<1&&R.tp<Fe.t0+90&&s.pose==='run'&&(s.lamT||0)<Fe.t0){s.lamT=Fe.t0;accion(s,'lamento',2);if(R.vivo)Q.lamentoVisto++}}
  animar(s,dtGame)}
 S.half=Q.tv&&Q.tv.partes[2]!=null&&R.tp>=Q.tv.partes[2]?2:1;
 return true}
/* animación de un sprite según su velocidad real (de la cinta) y su pose */
function animar(s,dt){
 if(s.pose&&s.pose!=='run'){s.poseT+=dt;if(s.poseT>=s.poseD){const prev=s.pose;s.pose='run';if(prev==='cayendo')accion(s,'levantandose')}}
 const sp=Math.hypot(s.vx,s.vy),sp0=s._sp||0;s._sp=sp;s.ph+=dt*(1.6+sp*1.75)*(s.cad||1);
 s.estado=(sp<sp0-1.2&&sp>1)?'frenando':sp<.3?'quieto':sp<1.8?'caminando':sp<3.8?'trotando':sp<6.2?'corriendo':'esprintando';
 const b=S.ball;if(sp>.35)s.face=s.vx>=0?1:-1;else if(b&&s.pose==='run')s.face=b.x>=s.x?1:-1;
 s.back=false;s.lat=sp>.8&&Math.abs(s.vy)>1.8*Math.abs(s.vx);if(s.lat&&s.estado==='trotando')s.estado='lateral';
 s.espera=!!(s.gk&&b&&Math.min(Math.abs(b.x),Math.abs(PW-b.x))<35&&Math.abs(b.x-s.x)<40);
 if(s.cardT>0)s.cardT-=dt;else s.card=null}
/* ventanas de peligro (en ticks): remates, goles, penales, córners, tiros libres peligrosos y tarjetas */
function ventanas(){const E=Q.tv.eventos,W=Q.win;
 const add=(a,b)=>{const L=W[W.length-1];if(L&&a<=L[1])L[1]=Math.max(L[1],b);else W.push([a,b])};
 for(;Q.evw<E.length;Q.evw++){const e=E[Q.evw];
  if(Q.pendTL&&e.equipo===Q.pendTL.e&&(e.tipo==='pase'||e.tipo==='remate'||e.tipo==='jugada_ensayada')){add(e.t-30,e.t+50);Q.pendTL=null}
  switch(e.tipo){
   case 'remate':if(e.penal&&Q.pendPen!=null){add(Q.pendPen,e.t+30);Q.pendPen=null}else add(e.t-50,e.t+20);break;
   case 'gol':add(e.t-80,e.t+(e.festejo||40));break;
   case 'penal':Q.pendPen=e.t;break;
   case 'corner':Q.pendTL={e:e.equipo,t:e.t};break;
   case 'tiro_libre':if(e.modo&&e.modo!=='pase')Q.pendTL={e:e.equipo,t:e.t};break;
   case 'amarilla':case 'roja':add(e.t-15,e.t+25);break;
  }}}
function enPeligroEntre(a,b){const W=Q.win;for(let i=Q.wi;i<W.length&&W[i][0]<=b;i++)if(W[i][1]>=a)return true;return false}
function enPeligro(t){const W=Q.win;while(Q.wi<W.length&&W[Q.wi][1]<t)Q.wi++;const w=W[Q.wi];return !!(w&&w[0]<=t&&t<=w[1])}
/* ticks que faltan jugar (estimado con el descuento cuando ya se conoce) */
function restoTicks(){const tv=Q.tv,t=Q.live?Q.live.tp:0,h=tv.partes[2]!=null&&t>=tv.partes[2]?2:1,t0=tv.partes[h]!=null?tv.partes[h]:t;
 const des=Q.desc[h]!=null?Q.desc[h]:(h===1?2:4);let r=Math.max(200,t0+(45+des)*600+200-t);if(h===1)r+=(45+4)*600+200;return r}
/* velocidad de reproducción (ticks por segundo real) para terminar en la duración elegida */
function ritmoV3(peligro){const T=DUR[largoPartido()],Trem=Math.max(8,T-Q.realT),G=restoTicks();
 /* la calma va K veces más rápido que el peligro; con lo que falta (en tiempo real y de partido) sale la velocidad base */
 const K=10,fD=(Q.dObs+.045*6000)/(Q.tObs+6000),D=G*fD,C=G-D,rd=clamp((D+C/K)/Trem,8,120);Q.pred={Trem:+Trem.toFixed(1),G:Math.round(G),fD:+fD.toFixed(3),rd:+rd.toFixed(1)};return peligro?rd:Math.min(2500,rd*K)}
function ultimoT(){const c=Q.tv.cuadros;return c.length?c[c.length-1].t:-1}
/* repetición: recorte de la cinta alrededor del gol, en cámara lenta */
function armarRepeticion(P){const c=Q.tv.cuadros,L={quick:45,normal:60,long:80}[largoPartido()],t0=P.tg-L,t1=P.tg+15;
 const clip=c.filter(q=>q.t>=t0&&q.t<=t1);if(clip.length<20)return false;
 let snap=Q.hist[0];for(const h of Q.hist)if(h.t<=t0)snap=h;
 const evs=Q.tv.eventos.filter(e=>e.t>=t0&&e.t<=t1&&e.tipo!=='gol'&&e.tipo!=='cambio');
 const R=nuevoRep({cuadros:clip,fmt:Q.tv.formato,eventos:evs,slot:snap.slot,sal:snap.sal,t0:clip[0].t});
 /* control: cuántos jugadores hay en el área del arco del gol durante la repetición */
 let maxA=0;const nJ=Q.tv.formato.jugadores;for(const q of clip){let n=0;for(let j=0;j<nJ;j++){const x=q.d[5+j*2]/10,y=q.d[6+j*2]/10;if(AREA(x,y,P.der))n++}if(n>maxA)maxA=n}
 Q.repStats.push({origen:P.origen,maxEnArea:maxA,cuadros:clip.length});
 actualizarRep(R,0);Q.rep={R,fin:clip[clip.length-1].t,v:{quick:5.5,normal:4.5,long:4}[largoPartido()]};S.repN=(S.repN||0)+1;S.zoom=1.5;return true}
/* un cuadro del modo v3 */
function frameV3(real,crudo){real=Math.min(.3,crudo||real);
 const m=S.m,tv=Q.tv,R=Q.live;refrescarEntradas(m);ventanas();
 if(Q.rep){const P=Q.rep;P.R.tp+=real*P.v*speed();if(P.R.tp>=P.fin){Q.rep=null;S.zoom=1.1}else actualizarRep(P.R,real*P.v*speed()/10);Q.repReal+=real;Q.realT+=real;return}
 let pausa=false;try{pausa=!!matchPaused}catch(e){}
 if(R.c.length&&R.tp<R.c[0].t)saltarV3(R.c[0].t);
 revisarCinta();
 const tMax=ultimoT();let dtG=0;
 if(!pausa&&tMax>=0){
  /* mira un poco adelante: frena ANTES de que empiece la jugada (si no, a velocidad alta se la pasaría de largo) */
  const pel=enPeligro(R.tp)||enPeligroEntre(R.tp,R.tp+Q.rate*.3),objetivo=ritmoV3(pel);if(objetivo<Q.rate)Q.rate=objetivo;else Q.rate+=(objetivo-Q.rate)*Math.min(1,real*2);
  let nt=R.tp+real*Q.rate*speed();
  /* entretiempo: se espera a que el 2º tiempo exista; nunca se pasa de lo que ya simuló el motor */
  const f1=tv.fin[1],p2=tv.partes[2];
  if(f1!=null&&!Q.cruzo&&nt>f1-1){if(p2==null||tMax<p2+2)nt=f1-1;   // fin del 1º tiempo: se espera el 2º
   else{/* entretiempo: se pasa al saque del 2º tiempo sin interpolar (no es un salto) */R.tp=p2;Q.cruzo=true;Q.mitad=true;nt=p2}}
  const lim=tv.terminado?tMax:tMax-1;if(nt>lim)nt=Math.max(R.tp,lim);
  if(Q.mitad){dtG=0}
  else{dtG=(nt-R.tp)/10;if(nt>R.tp){Q.realT+=real;Q.tObs+=nt-R.tp;if(pel){Q.dObs+=nt-R.tp;Q.peligroReal+=real}else Q.calmaReal+=real}else Q.esperaReal+=real;R.tp=nt}}
 const prev=new Map(R.list.map(s=>[s,[s.x,s.y,s.alpha]])),pb=[R.ball.x,R.ball.y];
 actualizarRep(R,dtG);
 /* control de calidad: lo dibujado no salta (más rápido que lo que permite la cinta) y coincide con la cinta */
 if(dtG>0&&!Q.mitad){const lim=dtG*11+.6;for(const s of R.list){const p=prev.get(s);if(!p||p[2]<=0||s.alpha<=0)continue;const d=Math.hypot(s.x-p[0],s.y-p[1]);if(d>lim){Q.saltos.dibujo++;Q.saltos.log={jugador:s.name,d:+d.toFixed(2),lim:+lim.toFixed(2),t:R.tp}}}
  const db=Math.hypot(R.ball.x-pb[0],R.ball.y-pb[1]);if(db>dtG*48+.6){Q.saltos.dibujo++;Q.saltos.log={pelota:true,d:+db.toFixed(2),t:R.tp}}}
 Q.mitad=false;
 if(Q.repPend&&R.tp>=Q.repPend.at){const P=Q.repPend;Q.repPend=null;if(visible())armarRepeticion(P)}
 /* recorte de memoria: se guardan los últimos 30 s ya vistos */
 const c=tv.cuadros;if(c.length&&c[0].t<R.tp-300){let k=0;while(k<c.length&&c[k].t<R.tp-300)k++;c.splice(0,k)}
 S.ball=R.ball;S.ref=R.ref;S.owner=R.owner;S.sp=R.list;
 /* relato, marcador y reloj: lo que ya se vio en la cancha */
 const n=corteV3(m);if(n!==Q.ultCorte){Q.ultCorte=n;S.shown=n;contar();pedirRender()}
 const mn=minutoV3();if(mn.txt!==Q.ultMin){Q.ultMin=mn.txt;pedirRender()}}
let renderT=0;function pedirRender(){const now=performance.now();if(now-renderT<350){clearTimeout(pedirRender.t);pedirRender.t=setTimeout(pedirRender,360);return}renderT=now;try{window.renderMatch&&renderMatch()}catch(e){}}
function corteV3(m){const E=m.events||[],tp=Q.live?Q.live.tp:0;let n=0;for(;n<E.length;n++){const e=E[n];if(e.t3==null)e.t3=Q.tv.tMotor;if(e.t3>tp)break}return n}
function minutoV3(){const tv=Q.tv,t=Q.live?Q.live.tp:0,h=tv.partes[2]!=null&&t>=tv.partes[2]?2:1,t0=tv.partes[h];
 if(t0==null)return{txt:'0',min:0};const k=Math.floor((t-t0)/600),base=h===1?0:45;
 return k<45?{txt:String(base+k+1),min:base+k+1}:{txt:(base+45)+'+'+(k-44),min:base+45}}
/* prueba de la cinta en sí (lo que llega del motor): saltos cuadro a cuadro por jugador */
function revisarCinta(){const c=Q.tv.cuadros,F=Q.tv.formato;if(!F)return;Q.rc=Q.rc||{t:-1,slot:null,salT:new Map()};const st=Q.rc;
 for(const q of c){if(q.t<=st.t)continue;const p=st.prev;
  st.cambio=new Set(Q.tv.eventos.filter(e=>e.tipo==='cambio'&&Math.abs(e.t-q.t)<=1).map(e=>e.sid));
  if(p&&q.t===p.t+1&&!(Q.tv.partes[2]!=null&&q.t===Q.tv.partes[2])){
   for(let j=0;j<F.jugadores;j++){if(st.cambio&&st.cambio.has(j))continue;const d=Math.hypot(q.d[5+j*2]-p.d[5+j*2],q.d[6+j*2]-p.d[6+j*2])/10;if(d>1.5){Q.saltos.cinta++;Q.saltos.log={slot:j,d:+d.toFixed(2),t:q.t}}}
   const db=Math.hypot(q.d[0]-p.d[0],q.d[1]-p.d[1])/10;if(db>5){Q.saltos.pelota++;Q.saltos.log={pelota:true,d:+db.toFixed(2),t:q.t}}}
  st.prev=q;st.t=q.t}}
function initV3(m,tv){Q.on=true;Q.saltado=false;Q.tv=tv;Q.ent=new Map();refrescarEntradas(m);Q.win=[];Q.wi=0;Q.evw=0;Q.pendTL=null;Q.pendPen=null;Q.desc={};Q.repPend=null;Q.rep=null;
 Q.saltos={cinta:0,pelota:0,dibujo:0,log:null};Q.festVisto=0;Q.abrazoVisto=0;Q.lamentoVisto=0;Q.repStats=[];Q.esperaReal=0;Q.peligroReal=0;Q.calmaReal=0;Q.repReal=0;Q.rc=null;
 const slot=tv.puestos.map(p=>p.clave),sal=[null,null,null];Q.hist=[{t:-1,slot:slot.slice(),sal:sal.slice()}];
 const t0=tv.cuadros.length?Math.max(tv.cuadros[0].t,(tv.partes[1]!=null?tv.partes[1]:0)):0;
 Q.live=nuevoRep({cuadros:tv.cuadros,fmt:tv.formato,eventos:tv.eventos,slot,sal,t0,vivo:true});
 /* si se monta con el partido empezado, se sigue desde lo último (sin repetir carteles viejos) */
 const ya=tv.tMotor-(tv.partes[1]||0);if(ya>1200&&tv.cuadros.length){const R=Q.live;R.tp=Math.max(tv.cuadros[0].t,tv.tMotor-100);
  for(;R.evi<R.ev.length&&R.ev[R.evi].t<=R.tp;R.evi++){const e=R.ev[R.evi];if(e.tipo==='cambio'){if(e.salienteSlot>=0)R.sal[e.salienteSlot]=e.saleClave;R.slot[e.sid]=e.clave}if(e.tipo==='descuento')Q.desc[e.parte]=e.minutos}
  Q.realT=DUR[largoPartido()]*clamp(ya/57000,0,.95)}else Q.realT=0;
 Q.dObs=0;Q.tObs=0;Q.rate=200;Q.ultCorte=-1;Q.ultMin='';Q.cruzo=tv.partes[2]!=null&&Q.live.tp>=tv.partes[2];
 S.sp=Q.live.list;S.ball=Q.live.ball;S.ref=Q.live.ref;S.repN=0;S.zoom=1.1}
/* ---------- estadio (solo v3): tribunas con público, carteles y el pasto alrededor ---------- */
const PUB=['#f4f4f4','#e2bd70','#1747b0','#d3212f','#2b2b2b','#7fd3ff','#ffd400','#3cb371','#ff7a00','#8b5cf6'];
function cTeam(t){const K=S.kits;if(!K)return t?'#1747b0':'#d3212f';const home=S.m&&S.m.venue==='a'?1:0;return(t===home?K.local:K.visita).c1}
function poly(ctx,pts,fill){ctx.fillStyle=fill;ctx.beginPath();pts.forEach((p,i)=>{const q=proj(p[0],p[1],p[2]||0);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.closePath();ctx.fill()}
function drawStadium(ctx){const w=S.w,h=S.h,top=S.cam==='cen'||S.cam==='tac';
 const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#16263a');g.addColorStop(1,'#24384d');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 const c0=cTeam(0),c1=cTeam(1);
 /* tribunas: filas que suben (z) alrededor de la cancha, con hinchas de los dos equipos */
 const fila=(x0,x1,y0,y1,z,horiz)=>{poly(ctx,horiz?[[x0,y0,z],[x1,y0,z],[x1,y1,z+.5],[x0,y1,z+.5]]:[[x0,y0,z],[x0,y1,z],[x1,y1,z+.5],[x1,y0,z+.5]],'#3a4a5c')};
 const hinchas=(x0,x1,y,z,horiz,k)=>{const P0=proj(horiz?x0:y,horiz?y:x0,z);const s=Math.max(1.2,P0[2]*.42);if(s<1.2)return;
  const n=Math.min(150,Math.round(Math.abs(x1-x0)/.85));for(let i=0;i<n;i++){const u=x0+(x1-x0)*(i+.5)/n,P=horiz?proj(u,y,z):proj(y,u,z);
   if(P[0]<-6||P[0]>w+6||P[1]<-6||P[1]>h+6)continue;const hsh2=(i*73+k*151)%97;
   ctx.fillStyle=hsh2%9===0?PUB[hsh2%PUB.length]:(u<52.5?c0:c1);const bob=S.big&&/GOL/.test(S.big.txt)?Math.sin(S.t*14+i)*s*.5:0;
   ctx.fillRect(P[0]-s*.45,P[1]-s*1.6+bob,s*.9,s*1.1);ctx.fillStyle='#e0ac83';ctx.fillRect(P[0]-s*.28,P[1]-s*2.1+bob,s*.56,s*.5)}};
 if(!top){for(let k=13;k>=0;k--){const y=-6.5-k*1.05,z=1.1+k*.62;fila(-14,119,y,y-1.05,z,true);hinchas(-13,118,y-.4,z+.2,true,k)}
  /* cabeceras (detrás de los arcos) */
  for(let k=8;k>=0;k--){const z=1.1+k*.62;fila(-6-k*1.05,-7-k*1.05,-6,PH+6,z,false);fila(PW+6+k*1.05,PW+7+k*1.05,-6,PH+6,z,false)}}
 else{ctx.fillStyle='#3a4a5c';const a=proj(-12,-12),b=proj(PW+12,PH+12);ctx.fillRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);
  for(let k=0;k<8;k++){hinchas(-10,PW+10,-6.5-k*.8,0,true,k);hinchas(-10,PW+10,PH+6.5+k*.8,0,true,k+20)}}
 /* césped alrededor de la cancha (hasta los carteles) */
 poly(ctx,[[-5.5,-4.5],[PW+5.5,-4.5],[PW+5.5,PH+4.5],[-5.5,PH+4.5]],'#2b7d37');
 /* carteles de publicidad (genéricos, sin marcas reales) */
 const TX=['MODO CARRERA','FÚTBOL','TEMPORADA 2026','MODO CARRERA','EL CLÁSICO','HINCHADA'];
 const cartel=(x0,x1,y,z0,z1,horiz,i)=>{const A=horiz?proj(x0,y,z1):proj(y,x0,z1),B=horiz?proj(x1,y,z0):proj(y,x1,z0);
  poly(ctx,horiz?[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]]:[[y,x0,z0],[y,x1,z0],[y,x1,z1],[y,x0,z1]],i%2?'#0d2b55':'#13324f');
  const hh=Math.abs(B[1]-A[1]);if(hh>5&&!top){ctx.save();ctx.fillStyle=i%3?'#e2bd70':'#ffffff';ctx.font=`800 ${Math.round(hh*.62)}px "Barlow Semi Condensed",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(TX[i%TX.length],(A[0]+B[0])/2,(A[1]+B[1])/2);ctx.restore()}};
 for(let i=0;i<10;i++){const x0=-4+i*11.3;cartel(x0,x0+11,-3.6,0,.95,true,i)}
 if(top)for(let i=0;i<10;i++){const x0=-4+i*11.3;cartel(x0,x0+11,PH+3.6,0,.95,true,i+3)}}
/* marcador de TV (v3): equipos con sus colores, resultado y reloj del partido (con el descuento) */
function marcadorTV(ctx){const m=S.m;if(!m)return 8;const ab=n=>String(n||'').replace(/^(Club |CA |CD |FC |AC |SS |RC |Real |Atlético |Deportivo )/i,'').slice(0,3).toUpperCase();
 const loc=m.venue==='a'?m.away:m.home,vis=m.venue==='a'?m.home:m.away,g=m.venue==='a'?[S.goles[1],S.goles[0]]:S.goles,mn=minutoV3();
 const K=S.kits,c1=K&&K.local&&K.local.c1||'#c33',c2=K&&K.visita&&K.visita.c1||'#33c';ctx.save();
 const x=10,y=10,hgt=24;ctx.font='800 13px "Barlow Semi Condensed",Arial';ctx.textBaseline='middle';
 ctx.fillStyle='rgba(6,12,28,.92)';ctx.fillRect(x,y,176,hgt);ctx.fillStyle=c1;ctx.fillRect(x,y,5,hgt);ctx.fillStyle=c2;ctx.fillRect(x+97,y,5,hgt);
 ctx.fillStyle='#fff';ctx.textAlign='left';ctx.fillText(ab(loc),x+10,y+hgt/2+1);ctx.fillText(ab(vis),x+107,y+hgt/2+1);
 ctx.fillStyle='#e2bd70';ctx.fillRect(x+48,y,44,hgt);ctx.fillStyle='#0b1222';ctx.textAlign='center';ctx.fillText(g[0]+' - '+g[1],x+70,y+hgt/2+1);
 ctx.fillStyle='rgba(255,255,255,.95)';ctx.fillRect(x+142,y,34,hgt);ctx.fillStyle='#0b1222';const ex=mn.txt.split('+');ctx.fillText(ex[0]+"'",x+159,y+hgt/2+1);
 if(ex[1]){ctx.fillStyle='#d3212f';ctx.fillRect(x+176,y,26,hgt);ctx.fillStyle='#fff';ctx.fillText('+'+ex[1],x+189,y+hgt/2+1)}
 ctx.restore();return y+hgt+6}

/* ---------- API para el juego ---------- */
function visible(){return!!(S.cv&&S.cv.isConnected&&document.visibilityState==='visible'&&S.cv.getBoundingClientRect().width>0)}
const API={
 montar(host,m){if(!host||!m)return;if(S.m!==m)init(m);S.host=host;
  if(!S.cv||!S.cv.isConnected){const n=(m.events||[]).length;if(n-S.shown>4){S.play=null;S.shown=n;contar()}}
  if(!S.cv){S.cv=document.createElement('canvas');S.cv.className='m2d';S.cx=S.cv.getContext('2d');S.cv.addEventListener('click',()=>{if(S.rep){S.rep=null;S.zoom=1.1;if(!S.play)next()}if(Q.rep){Q.rep=null;S.zoom=1.1}})}
  if(!S.wrap){S.wrap=document.createElement('div');S.wrap.className='m2d-wrap';S.wrap.appendChild(S.cv);
   const bar=document.createElement('div');bar.className='m2d-cams';
   bar.innerHTML=CAMS.map(([k,t])=>`<button class="${(S.cam||camPref)===k?'on':''}" data-c="${k}">${t}</button>`).join('')+'<button class="fs" data-fs="1" title="Pantalla completa" aria-label="Pantalla completa">⛶</button>';
   bar.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.fs){pantallaCompleta(!document.body.classList.contains('m2d-full'));return}
    S.cam=b.dataset.c;camPref=S.cam;try{localStorage.setItem('mc_cam',S.cam)}catch(e){}bar.querySelectorAll('button[data-c]').forEach(x=>x.classList.toggle('on',x===b))});
   S.wrap.appendChild(bar);
   /* controles en pantalla completa: el partido se sigue manejando sin salir */
   const ctl=document.createElement('div');ctl.className='m2d-ctl';
   ctl.innerHTML='<button data-a="pausa">⏯</button><button data-a="v1">x1</button><button data-a="v2">x2</button><button data-a="v4">x4</button><button data-a="cambios">🔁 Cambios</button><button data-a="tactica">📋 Táctica</button><button data-a="simular">⏭ Simular</button><button data-a="salir" class="sal">✕ Salir</button>';
   ctl.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const a=b.dataset.a;try{
    if(a==='pausa'){if(typeof match!=='undefined'&&match&&(match.phase==='pre'||match.phase==='ht'))window.mcMainAction&&mcMainAction();else window.toggleMatchPause&&toggleMatchPause()}
    else if(a[0]==='v')window.mcSpeed&&mcSpeed(+a.slice(1));
    else if(a==='cambios')window.openMatchSubs&&openMatchSubs();
    else if(a==='tactica'){pantallaCompleta(false);window.go&&go('tactics')}
    else if(a==='simular')window.mcSimEnd&&mcSimEnd();
    else if(a==='salir')pantallaCompleta(false)}catch(e){console.warn('MC2D',e)}});
   S.wrap.appendChild(ctl);
   const gir=document.createElement('div');gir.className='m2d-girar';gir.textContent='Girá el teléfono para verlo más grande';S.wrap.appendChild(gir)}
  host.innerHTML='';host.appendChild(S.wrap);S.cam=S.cam||camPref;S.w=0;resize();if(!S.raf)S.raf=requestAnimationFrame(frame)},
 /* el reloj del motor espera mientras se muestra una jugada (o hay eventos sin mostrar) */
 retener(m){if(!m||m!==S.m||m.done||!visible())return false;
  if(Q.on)return Q.tv.tMotor-Q.live.tp>900;   // v3: el motor va hasta 90 s adelante de lo que se ve
  return!!S.rep||!!(S.play&&!S.play.filler)||S.shown<(m.events||[]).length},
 corte(m){if(Q.on&&m===S.m&&visible()&&Q.live&&!Q.saltado)return Math.min(corteV3(m),(m.events||[]).length);
  if(!m||m!==S.m||!visible()||m.done)return(m&&m.events||[]).length;return Math.min(S.shown,(m.events||[]).length)},
 marcador(m){if(Q.on&&m===S.m&&visible()&&!Q.saltado)return S.goles;if(!m||m!==S.m||!visible()||m.done)return[m.h,m.a];return S.goles},
 /* control de calidad (v3): lo dibujado es exactamente la cinta interpolada en el instante que se ve */
 verificarV3(){if(!Q.on||!Q.live)return null;const R=Q.live,Z=cuadroEn(R.c,R.tp);if(!Z)return null;const {A,B,f}=Z;let max=0,n=0;
  for(let j=0;j<Q.tv.formato.jugadores;j++){const k=R.slot[j],s=k!=null?R.sp.get(k):null;if(!s||A.d[5+j*2]===-32768)continue;const x=lerp(A.d[5+j*2],B.d[5+j*2],f)/10,y=lerp(A.d[6+j*2],B.d[6+j*2],f)/10;max=Math.max(max,Math.hypot(s.x-x,s.y-y));n++}
  const bx=lerp(A.d[0],B.d[0],f)/10,by=lerp(A.d[1],B.d[1],f)/10;max=Math.max(max,Math.hypot(S.ball.x-bx,S.ball.y-by));
  const ia=Q.tv.formato.arbitro,rx=lerp(A.d[ia],B.d[ia],f)/10;return{difMax:+max.toFixed(4),jugadores:n,arbitroDif:+Math.abs(S.ref.x-rx).toFixed(4),dibujados:S.sp.filter(s=>s.alpha>0).length}},
 /* minuto que se está viendo (v3); null = el del motor */
 minuto(m){if(Q.on&&m===S.m&&visible()&&Q.live&&!Q.saltado)return minutoV3().txt;return null},
 saltar(){if(!S.m)return;if(Q.on){Q.saltado=true;saltarV3(ultimoT());return}S.rep=null;S.golT=null;S.play=null;S.queue=[];S.shown=(S.m.events||[]).length;contar();S.owner=null;S.phase=S.m.done?'done':S.phase},
 /* control de calidad: dibuja todas las poses con las camisetas de dos clubes (no participa del partido) */
 hojaPoses(cv,local,visita){local=local||'River Plate';visita=visita||'Boca Juniors';const ctx=cv.getContext('2d'),pk=S.kits,pm=S.m,pc=S.cam,pT=S.camT;
  try{S.kits=window.MCCamisetas?MCCamisetas.partido(local,visita):null;S.m={venue:'h'};S.cam='tv';S.camT=null;
   const L=[['caminando',{v:1.4}],['trotando',{v:3.2}],['corriendo',{v:5.5}],['esprintando',{v:7.8}],['retrocede',{v:2.5,back:1}],['lateral',{v:2.5,lat:1}],['frenando',{v:3,estado:'frenando'}],
    ['pasando',{pose:'pasando',pt:.5}],['remate',{pose:'rematando',pt:.5}],['volea',{pose:'volea',pt:.5}],['control',{pose:'controlando',pt:.5}],['cabezazo',{pose:'cabeceando',pt:.5}],
    ['entrada',{pose:'entrada',pt:.5}],['barrida',{pose:'barrida',pt:.5}],['cae',{pose:'cayendo',pt:.8}],['se levanta',{pose:'levantandose',pt:.5}],['desequilibrio',{pose:'desequilibrio',pt:.5}],
    ['amague',{pose:'amague',pt:.25,reg:85}],['protege',{pose:'proteccion',pt:.5}],['festejo 1',{pose:'celebrando',pt:.6,celeb:0}],['festejo 2',{pose:'celebrando',pt:.6,celeb:1}],['festejo 3',{pose:'celebrando',pt:.6,celeb:2}],
    ['abrazo',{pose:'abrazo',pt:.5}],['protesta',{pose:'protesta',pt:.5}],['lamento',{pose:'lamento',pt:.5}],['pide',{pose:'pide',pt:.5}],
    ['arq. guardia',{gk:1,espera:1}],['arq. ataja',{gk:1,pose:'atajando',pt:.5}],['arq. estirada',{gk:1,pose:'estirada',pt:.45,vy:3}],['arq. saque',{gk:1,pose:'saque',pt:.5}],['árbitro',{ref:1,pose:'tarjeta',pt:.5}]];
   const cols=8,cw=cv.width/cols,rh=cv.height/Math.ceil(L.length*2/cols);ctx.fillStyle='#2e8a3c';ctx.fillRect(0,0,cv.width,cv.height);
   const NOM=['Lionel Gómez','Juan Pérez','Marcos Díaz','Lucas Silva','Ángel Romero','Diego Sosa','Pablo Ríos','Nico Paz'];let i=0;
   for(const team of [0,1])for(const [lab,o] of L){const c=i%cols,rw=Math.floor(i/cols);i++;const nm=NOM[(i*3+team)%NOM.length]+' '+i;
    const sp={name:nm,team,g:o.gk?'POR':'MED',gk:!!o.gk,e:null,pie:i%3?'der':'izq',skin:skinOf(nm),face:1,vx:o.v||0,vy:o.vy||0,ph:1.1,pose:o.pose||'run',poseT:(o.pt||0)*((ACC_D[o.pose]||1)),poseD:ACC_D[o.pose]||1,alpha:1,cad:1,
     estado:o.estado||'',back:!!o.back,lat:!!o.lat,espera:!!o.espera,celeb:o.celeb||0};
    if(o.reg)sp._r=Object.assign({},rasgos(sp),{regate:o.reg});
    const x=c*cw+cw/2,y=rw*rh+rh*.82;figura(ctx,sp,[x,y,rh*.36/(1.85*FIG)],!!o.ref);
    ctx.fillStyle='#fff';ctx.font='600 11px Arial';ctx.textAlign='center';ctx.fillText(lab,x,rw*rh+rh*.97)}
  }finally{S.kits=pk;S.m=pm;S.cam=pc;S.camT=pT}},
 estado(){const est={},tac={},acc={};S.sp.forEach(s=>{if(s.out)return;est[s.estado]=(est[s.estado]||0)+1;if(s.tactico)tac[s.tactico]=(tac[s.tactico]||0)+1;if(s.pose&&s.pose!=='run')acc[s.pose]=(acc[s.pose]||0)+1});
  const med={};{const b=S.ball;med.cerca=S.sp.filter(s=>!s.out&&Math.hypot(s.x-b.x,s.y-b.y)<8).length;
   [0,1].forEach(t=>{const L=S.sp.filter(s=>s.team===t&&!s.out&&!s.gk);if(!L.length)return;const xs=L.map(s=>s.x),ys=L.map(s=>s.y);med['largo'+t]=+(Math.max(...xs)-Math.min(...xs)).toFixed(1);med['ancho'+t]=+(Math.max(...ys)-Math.min(...ys)).toFixed(1);
    const g=S.sp.find(s=>s.team===t&&s.gk&&!s.out);if(g)med['arq'+t]=+Math.abs(g.x-(dirOf(t)>0?0:PW)).toFixed(1)});med.suelta=!!S.chaser;med.sueltaMax=+(S.sueltaMax||0).toFixed(1);med.enJugada=!!(S.play&&!S.play.filler)}
  const rend=S.perf&&S.perf.n?{msPromedio:+(S.perf.tot/S.perf.n).toFixed(2),msMax:+S.perf.max.toFixed(1),cuadros:S.perf.n,msCuadroTotal:+(S.perf.frame/S.perf.n).toFixed(2),fps:+(S.perf.n/Math.max(1,S.perf.real)).toFixed(0),cuadrosLentos:S.perf.lentos,tiempoJuego:+S.t.toFixed(0),tiempoReal:+S.perf.real.toFixed(0)}:null;
  const v3=Q.on?{tp:Q.live?+Q.live.tp.toFixed(1):null,tMotor:Q.tv.tMotor,ritmo:+Q.rate.toFixed(1),saltosCinta:Q.saltos.cinta,saltosPelota:Q.saltos.pelota,saltosDibujo:Q.saltos.dibujo,saltoLog:Q.saltos.log,
   festejos:Q.festVisto,abrazos:Q.abrazoVisto,lamentos:Q.lamentoVisto,repeticiones:Q.repStats,enRepeticion:!!Q.rep,tiempoReal:{viendo:+Q.realT.toFixed(1),peligro:+Q.peligroReal.toFixed(1),calma:+Q.calmaReal.toFixed(1),repeticion:+Q.repReal.toFixed(1),esperando:+Q.esperaReal.toFixed(1)},
   minuto:minutoV3().txt,duracion:largoPartido(),pred:Q.pred,cuadrosEnMemoria:Q.tv.cuadros.length,arbitro:S.ref?[+S.ref.x.toFixed(1),+S.ref.y.toFixed(1)]:null}:null;
  return{v3,rend,repeticiones:S.repN||0,enRepeticion:!!S.rep,zoom:+(S.zoom||1).toFixed(2),med,saltosJugadores:S.ptele||0,saltoLog:S.pteleLog||null,jugada:S.play?S.play.label:null,mostrados:S.shown,eventos:S.m?(S.m.events||[]).length:0,camara:S.cam,jugadores:S.sp.filter(s=>!s.out).length,goles:S.goles.slice(),cuadros:S.t,teletransportes:S.tele,teleLog:S.teleLog||null,estados:est,tacticos:tac,acciones:acc,posesionId:S.posId}}
};
/* pantalla completa: Fullscreen API cuando existe; en iPhone (Safari no la permite para esto) una capa fija que ocupa toda la pantalla */
function pantallaCompleta(on){const b=document.body;b.classList.toggle('m2d-full',!!on);
 try{const d=document,el=d.documentElement;
  if(on){const f=el.requestFullscreen||el.webkitRequestFullscreen;if(f&&!(d.fullscreenElement||d.webkitFullscreenElement)){const p=f.call(el);if(p&&p.then)p.then(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{})}}
  else{const x=d.exitFullscreen||d.webkitExitFullscreen;if(x&&(d.fullscreenElement||d.webkitFullscreenElement))x.call(d)}}catch(e){}
 S.w=0;setTimeout(()=>{S.w=0},250)}
['fullscreenchange','webkitfullscreenchange'].forEach(n=>document.addEventListener(n,()=>{const d=document;if(!(d.fullscreenElement||d.webkitFullscreenElement)&&document.body.classList.contains('m2d-full')&&API._fsApi)pantallaCompleta(false);API._fsApi=!!(d.fullscreenElement||d.webkitFullscreenElement)}));
API.pantallaCompleta=pantallaCompleta;
window.MC2D=API;
/* estilos del visor (la cancha más alta, cámaras arriba a la derecha) */
const st=document.createElement('style');st.textContent=`#m12M .pt.pt2d{position:relative;aspect-ratio:2.1/1;height:auto;min-height:160px;overflow:hidden;border-radius:14px}
#m12M .pt.pt2d canvas.m2d{display:block;width:100%;height:100%}
.m2d-wrap{position:absolute;inset:0}
.m2d-wrap canvas.m2d{display:block;width:100%;height:100%}
.m2d-cams button.fs{font-size:12px;padding:2px 7px}
.m2d-ctl,.m2d-girar{display:none}
body.m2d-full{overflow:hidden}
body.m2d-full .m2d-wrap{position:fixed;inset:0;z-index:2000;background:#16263a;border-radius:0}
body.m2d-full .modal{z-index:2100!important}
body.m2d-full .m2d-cams{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right))}
body.m2d-full .m2d-ctl{display:flex;position:absolute;left:0;right:0;bottom:max(6px,env(safe-area-inset-bottom));justify-content:center;gap:5px;flex-wrap:wrap;padding:0 8px}
.m2d-ctl button{font:800 12px "Barlow Semi Condensed",Arial;color:#fff;background:rgba(4,8,20,.7);border:1px solid rgba(226,189,112,.45);border-radius:8px;padding:6px 9px}
.m2d-ctl button.sal{background:rgba(211,33,47,.85);border-color:#ff8a8a}
@media (orientation:portrait){body.m2d-full .m2d-girar{display:block;position:absolute;left:50%;top:48px;transform:translateX(-50%);font:700 12px Arial;color:#e2bd70;background:rgba(4,8,20,.75);padding:5px 10px;border-radius:8px;pointer-events:none}}
.m2d-cams{position:absolute;top:6px;right:6px;display:flex;gap:4px}
.m2d-cams button{font:700 10px "Barlow Semi Condensed",Arial;letter-spacing:.02em;color:#fff;background:rgba(4,8,20,.55);border:1px solid rgba(226,189,112,.35);border-radius:7px;padding:3px 6px}
.m2d-cams button.on{background:rgba(226,189,112,.95);color:#0b1222;border-color:#e2bd70}`;
document.head.appendChild(st);
})();
