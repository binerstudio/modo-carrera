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
/* posición objetivo según la pelota, la posesión y la táctica (en metros de cancha) */
function formPos(s){const dir=dirOf(s.team),b=S.ball||{x:52.5,y:34};
 const A=x=>dir>0?x:PW-x,ballA=A(b.x),poss=S.posTeam===s.team&&S.phase!=='pre';
 const t=tacOf(s.team),D=((t.depth??50)-50)/50,Wd=((t.width??50)-50)/50;
 const sl=slot(s);
 if(S.phase==='pre'||S.phase==='ht'||S.reset){const a=s.gk?4:clamp(8+sl.d*40,6,50);return[A(a),clamp(34+(sl.l-.5)*54,4,64)]}
 if(s.gk){const a=clamp(4+Math.max(0,ballA-50)*.12,3,17);return[A(a),clamp(34+(b.y-34)*.22,26,42)]}
 const line=clamp(ballA-(poss?30:19)+D*6,poss?16:9,poss?64:52),span=poss?44+D*4:31;
 let a=line+clamp((sl.d-.18)/.72,0,1)*span,y=34+(sl.l-.5)*(poss?54+Wd*8:38+Wd*4)+(b.y-34)*(poss?.12:.3);
 if(poss&&/^(LI|LD)$/.test(s.role||'')&&Wd>-.2)a+=8+Wd*6;
 if(!poss&&sl.d>.75)a=Math.max(a,ballA-6);
 a+=Math.sin(S.t*.6+s.ph)*1.4;y+=Math.cos(S.t*.5+s.ph*1.3)*1.6;
 return[A(clamp(a,2,103)),clamp(y,2,66)]}

/* ---------- máquina de estados de cada jugador ----------
   estado (locomoción): quieto · caminando · trotando · corriendo · esprintando · frenando · girando
   acción (pose):       conduciendo · controlando · pasando · rematando · cabeceando · saltando · entrada · barrida
                        cayendo · levantandose · desequilibrio · amague · celebrando · abrazo · protesta · lamento
                        pide · atajando · estirada · saque · tarjeta
   táctico:             atacando · defendiendo · presionando · marcando · desmarcandose · apoyo                  */
const ACC_D={pasando:.32,rematando:.38,cabeceando:.55,saltando:.5,controlando:.3,entrada:.55,barrida:.75,cayendo:.9,levantandose:.6,
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
 s.x+=s.vx*dt;s.y+=s.vy*dt;const sp=Math.hypot(s.vx,s.vy);s.ph+=dt*(1.6+sp*1.75)*s.cad;
 s.estado=turn?'girando':(sp<sp0-s.acc*dt*.6&&sp>1)?'frenando':sp<.3?'quieto':sp<1.8?'caminando':sp<3.8?'trotando':sp<6.2?'corriendo':'esprintando';
 if(sp>.25)s.face=s.vx>=0?1:-1;else if(S.ball&&s.pose==='run')s.face=S.ball.x>=s.x?1:-1;
 s.dBall=S.ball?Math.hypot(S.ball.x-s.x,S.ball.y-s.y):99;
 if(s.out&&s.y>PH+1.5)s.alpha=Math.max(0,s.alpha-dt)}

/* ---------- inteligencia de ubicación entre jugadas ----------
   con pelota: amplitud de extremos, apoyos de volantes, desmarques de delanteros, laterales que se proyectan
   sin pelota: 1 o 2 presionan, el resto marca a un rival de su zona o cierra espacios manteniendo la línea */
let marcasT=0;
function asignarMarcas(){S.sp.forEach(s=>s.marca=null);[0,1].forEach(t=>{if(S.posTeam===t)return;
 const def=S.sp.filter(s=>s.team===t&&!s.out&&!s.gk&&!(S.pressers||[]).includes(s)),att=S.sp.filter(s=>s.team!==t&&!s.out&&!s.gk&&s!==S.owner);
 const libres=new Set(att);def.forEach(d=>{const z=formPos(d);let best=null,bd=15;libres.forEach(a=>{const k=Math.hypot(a.x-z[0],a.y-z[1]);if(k<bd){bd=k;best=a}});if(best){d.marca=best;libres.delete(best)}})})}
function objetivo(s){const z=formPos(s);let x=z[0],y=z[1],mul=.7;const dir=dirOf(s.team);
 if(S.phase==='pre'||S.phase==='ht'||S.phase==='done'||S.reset){s.tactico='quieto';return[x,y,.6]}
 if(s.gk){s.tactico='arco';return[x,y,.7]}
 if(S.owner===s)return[s.x+dir*2,s.y,.55];
 const enPos=S.posTeam===s.team;
 if(enPos){s.tactico='atacando';
  /* desmarque: alejarse del marcador más cercano hacia el espacio */
  const near=S.sp.filter(o=>o.team!==s.team&&!o.out).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
  if(near&&Math.hypot(near.x-s.x,near.y-s.y)<5){x+=(s.x-near.x)*.6+dir*2;y+=(s.y-near.y)*.6;s.tactico='desmarcandose';mul=.85}
  if(S.owner&&S.owner.team===s.team&&Math.hypot(S.owner.x-s.x,S.owner.y-s.y)<16&&s.g==='MED'){s.tactico='apoyo'}
  return[clamp(x,2,103),clamp(y,2,66),mul]}
 if((S.pressers||[]).includes(s)){s.tactico='presionando';return[S.ball.x-dir*1.1,S.ball.y,.95]}
 if(s.marca){const a=s.marca;s.tactico='marcando';const gx=dir>0?0:PW;const k=Math.hypot(a.x-gx,a.y-34)||1;
  const mx=a.x+(gx-a.x)/k*1.8,my=a.y+(34-a.y)/k*1.8;return[lerp(x,mx,.6),lerp(y,my,.6),.8]}
 s.tactico='defendiendo';return[x,y,.72]}

/* ---------- pelota: nunca se teletransporta ---------- */
function newBall(){return{x:52.5,y:34,z:0,vx:0,vy:0,fly:null}}
function ballStep(dt){const b=S.ball,px=b.x,py=b.y;
 if(b.fly){const f=b.fly;f.t+=dt;const k=clamp(f.t/f.d,0,1),e=f.ease?1-Math.pow(1-k,1.6):k;b.x=lerp(f.x0,f.x1,e);b.y=lerp(f.y0,f.y1,e);b.z=f.h*4*k*(1-k)+(f.z1||0)*k;
  if(k>=1){b.fly=null;b.z=f.z1&&f.keep?f.z1:0;const cb=f.cb;f.cb=null;if(cb)cb()}}
 else if(S.owner){const o=S.owner;b.x+=(o.x+(o.face||1)*.55-b.x)*Math.min(1,dt*14);b.y+=(o.y+.25-b.y)*Math.min(1,dt*14);b.z=0}
 else{b.vx*=Math.pow(.4,dt);b.vy*=Math.pow(.4,dt);b.x+=b.vx*dt;b.y+=b.vy*dt}
 const jump=Math.hypot(b.x-px,b.y-py);if(jump>4.5&&!b.fly)S.tele++}
function patear(x,y,o){o=o||{};const b=S.ball;S.owner=null;const d=Math.hypot(x-b.x,y-b.y);const v=o.v||(o.h>2?17:19);
 b.fly={x0:b.x,y0:b.y,x1:x,y1:y,h:o.h||0,z1:o.z1||0,keep:o.keep,t:0,d:Math.max(.2,d/v),ease:!o.lin,cb:o.cb}}
/* tomar la pelota solo si está cerca (si no, no se puede: evita teletransportes) */
function tomar(s){if(!s)return false;const d=Math.hypot(S.ball.x-s.x,S.ball.y-s.y);if(d>2.6||S.ball.fly)return false;S.owner=s;S.posTeam=s.team;accion(s,'controlando');return true}
/* rodar la pelota hasta un punto (reposiciones: saques, penal, córner, mitad de cancha) */
function rodar(x,y,cb){patear(x,y,{v:15,cb})}

/* ---------- pasos de una jugada ----------
   cada paso: {d: duración máxima, f: al empezar, u: condición para terminar antes} */
function P(d,f,u){return{d,f,u}}
function seq(steps,ev){return{steps,i:-1,t:0,ev,label:ev?(ev.title||''):''}}
function runPlay(dt){const p=S.play;if(!p)return;p.t-=dt;const st=p.steps[p.i];
 if(p.i<0||p.t<=0||(st&&st.u&&st.u())){p.i++;if(p.i>=p.steps.length){finish(p);return}const n=p.steps[p.i];p.t=n.d;try{n.f&&n.f()}catch(e){console.warn('MC2D',e)}}}
function finish(p){S.play=null;S.reset=false;S.sp.forEach(s=>{if(!s.out)s.ov=null});if(p.reveal)reveal(p.reveal);next()}
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
function asegurar(s){const W=[];if(!s)return W;
 W.push(P(2.6,()=>{const o=S.owner;
  if(o===s)return;
  if(o&&o.team===s.team){accion(o,'pasando');s.ov={x:s.x,y:s.y,run:.4};patear(s.x+(s.face||1)*.4,s.y,{v:20,cb:()=>tomar(s)})}
  else if(o){s.ov={x:o.x,y:o.y,run:1};s._robar=o}
  else s.ov={x:S.ball.x,y:S.ball.y,run:1}},
  ()=>{if(S.owner===s)return true;const o=S.owner;if(s._robar&&o===s._robar){s.ov={x:o.x,y:o.y,run:1};if(cerca(s,o,1.5)){accion(s,'entrada');accion(o,'desequilibrio');S.owner=null;s._robar=null;return tomar(s)}return false}
   if(!S.owner&&!S.ball.fly){s.ov={x:S.ball.x,y:S.ball.y,run:1};return tomar(s)}return false}));
 W.push(P(.01,()=>{if(S.owner!==s&&!S.ball.fly&&Math.hypot(S.ball.x-s.x,S.ball.y-s.y)<6){s.x=lerp(s.x,S.ball.x,.5);s.y=lerp(s.y,S.ball.y,.5);tomar(s)}s._robar=null}));
 return W}

/* ---------- reproducir las acciones que escribió el motor ---------- */
function reflejos(gk){const a=atr(gk.e)||{};return a.reflejos||60}
function remateSteps(team,a,ev){const opp=1-team,dir=dirOf(team),gx=goalX(team);const sh=quien(team,a.j,'att'),gk=quien(opp,a.arq,'gk');if(!sh)return[];
 const res=a.res||'afuera',head=a.t==='cabezazo',alto=a.zona==='alto';const W=[];
 W.push(P(.05,()=>{accion(sh,head?'cabeceando':'rematando')}));
 W.push(P(1.2,()=>{
  const gy=res==='gol'||res==='anulado'?(rnd()<.5?rr(30.9,32.6):rr(35.4,37.1)):res==='palo'?(rnd()<.5?30.4:37.6):res==='afuera'?(rnd()<.5?rr(26,29.8):rr(38.2,42)):rr(31.6,36.4);
  const gxx=res==='gol'||res==='anulado'?gx+dir*1.4:res==='afuera'?gx+dir*3.5:res==='palo'?gx:gx-dir*.9;
  const z1=res==='afuera'&&rnd()<.4?3.2:alto?1.9:.4;
  patear(gxx,gy,{v:head?18:27,h:head?.6:(alto?1.2:.3),z1,keep:res==='gol',lin:true,cb:()=>{
   if(res==='atajada'&&gk){S.ball.z=0;if(cerca(gk,S.ball,2.6))tomar(gk);else{gk.x=lerp(gk.x,S.ball.x,.6);gk.y=lerp(gk.y,S.ball.y,.6);tomar(gk)}}
   if(res==='palo'){patear(gx-dir*rr(4,9),gy<34?gy-rr(3,7):gy+rr(3,7),{v:14})}}});
  /* el arquero reacciona antes o después según sus reflejos */
  if(gk){const delay=clamp((100-reflejos(gk))/220,.05,.35);setTimeout(()=>{if(!S.play)return;const tgt=clamp(gy,30.6,37.4);
   if(Math.abs(tgt-gk.y)>1.2||res==='atajada'){accion(gk,Math.abs(tgt-gk.y)>1.2?'estirada':'atajando');gk.vy=(tgt-gk.y)*2.4;gk.ov=null}},delay*1000/Math.max(1,speed()))}},
  ()=>!S.ball.fly&&(res!=='atajada'||S.owner===gk)));
 if(res==='gol'||res==='anulado')W.push(P(2,()=>{bigTxt('¡GOL!','#e2bd70',1.6);banner(`⚽ ${corto(sh.name)}`,'#e2bd70',2.6);
   sh.ov={x:gx-dir*rr(8,13),y:rnd()<.5?7:61,run:1};accion(sh,'celebrando');
   S.sp.filter(s=>s.team===team&&s!==sh&&!s.gk&&!s.out).slice(0,4).forEach((s,i)=>{s.ov={x:sh.ov.x-dir*(1+i*.6),y:sh.ov.y+(i%2?1.2:-1.2),run:.95};setTimeout(()=>accion(s,'abrazo'),900)});
   S.sp.filter(s=>s.team===opp&&!s.out).slice(0,4).forEach(s=>accion(s,'lamento'));if(gk)accion(gk,'lamento')}));
 else if(res==='atajada')W.push(P(.9,()=>{accion(sh,'lamento',1);banner(`🧤 ${corto(gk?gk.name:'')}`,'#ffffff',1.6)}),
   P(.8,()=>{if(gk&&S.owner===gk){accion(gk,'saque');const to=quien(opp,null,'def');if(to)patear(to.x,to.y,{h:5,v:18,cb:()=>tomar(to)})}}));
 else W.push(P(1,()=>{accion(sh,'lamento',1.2);banner(res==='palo'?'¡Al palo!':'Afuera','#ffffff',1.4)}),
   P(1.6,()=>{if(gk){rodar(gx-dir*5.5,rr(28,40))}},()=>!S.ball.fly),P(1.4,()=>{if(gk)gk.ov={x:S.ball.x,y:S.ball.y,run:.8}},()=>gk&&tomar(gk)),
   P(.6,()=>{if(gk&&S.owner===gk){accion(gk,'saque');const to=quien(opp,null,'def');if(to)patear(to.x,to.y,{h:6,v:20,cb:()=>tomar(to)})}}));
 return W}
function accionesSteps(team,acc,ev){const opp=1-team,dir=dirOf(team),gx=goalX(team);let W=[];
 for(const a of acc){
  if(a.t==='recupera'){const j=quien(team,a.j,'def');W=W.concat(asegurar(j))}
  else if(a.t==='pase'){const de=quien(team,a.de,'mid'),to=quien(team,a.a,'att');if(!de||!to)continue;W=W.concat(asegurar(de));
   W.push(P(2.4,()=>{let tx,ty,h=0,v=19,z1=0;
    if(a.tipo==='filtrado'){tx=clamp(to.x+dir*rr(8,12),2,103);ty=clamp(lerp(to.y,34,.3),8,60);v=21}
    else if(a.tipo==='centro'){tx=gx-dir*rr(6.5,9.5);ty=rr(30,38);h=5.2;z1=1.7;v=18}
    else if(a.tipo==='largo'){tx=clamp(to.x+dir*rr(3,6),2,103);ty=to.y+rr(-3,3);h=6;v=20}
    else{tx=clamp(to.x+dir*rr(1,3),2,103);ty=to.y+rr(-1.5,1.5)}
    to.ov={x:tx,y:ty,run:a.tipo==='corto'?.8:1};accion(de,'pasando');accion(to,'pide');
    patear(tx,ty,{h,z1,v,cb:()=>{to.ov=null;if(!tomar(to)){to.x=lerp(to.x,tx,.7);to.y=lerp(to.y,ty,.7);tomar(to)}}})},()=>S.owner===to&&!S.ball.fly))}
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
   if(sh&&a.t==='cabezazo')W.push(P(.15,()=>{accion(sh,'saltando')}));
   W=W.concat(remateSteps(team,a,ev))}
  else if(a.t==='corner'){const tk=quien(team,a.j,'mid');const wy=rnd()<.5?.6:67.4;
   W.push(P(2.2,()=>{S.owner=null;rodar(gx-dir*.4,wy);if(tk)tk.ov={x:gx-dir*1.4,y:wy,run:1};banner('Tiro de esquina','#e2bd70');
     S.sp.filter(s=>!s.gk&&s!==tk&&!s.out).forEach(s=>{s.ov={x:gx-dir*rr(4,15),y:rr(25,43),run:.9}})},()=>!S.ball.fly&&tk&&cerca(tk,S.ball,1.6)),
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

/* ---------- posesión entre jugadas: la escribe el motor minuto a minuto ---------- */
function posesionPlay(){const V=S.m.v2;if(!V||!V.posesion||!V.posesion.length)return null;
 const L=V.posesion.filter(r=>r.id>S.posId);if(!L.length)return null;const r=L[L.length-1];S.posId=r.id;
 const team=teamOfSide(r.eq),W=[];let prev=null;
 r.pases.forEach((n,i)=>{const s=quien(team,n,'mid');if(!s)return;
  if(i===0){W.push(...asegurar(s));prev=s;return}
  const de=prev;W.push(P(2.4,()=>{if(S.owner!==de)return;const tx=clamp(s.x+dirOf(team)*rr(1,3),2,103),ty=s.y+rr(-1.5,1.5);s.ov={x:tx,y:ty,run:.8};accion(de,'pasando');
    const last=i===r.pases.length-1&&r.recupera;const th=last?quien(1-team,r.recupera,'def'):null;
    if(th){const mx=lerp(de.x,tx,.55),my=lerp(de.y,ty,.55);th.ov={x:mx,y:my,run:1};patear(mx,my,{v:16,cb:()=>{th.x=lerp(th.x,mx,.6);th.y=lerp(th.y,my,.6);if(!tomar(th))tomar(s)}})}
    else patear(tx,ty,{v:18,cb:()=>{s.ov=null;if(!tomar(s)){s.x=lerp(s.x,tx,.7);s.y=lerp(s.y,ty,.7);tomar(s)}}})},()=>!S.ball.fly&&S.owner&&S.owner!==de));
  W.push(P(rr(.4,1),()=>{if(S.owner)S.owner.ov={x:clamp(S.owner.x+dirOf(S.owner.team)*3,3,102),y:S.owner.y,run:.6}}));prev=s});
 if(!W.length)return null;return{steps:W,i:-1,t:0,label:'posesión',filler:true}}

/* cola: eventos del motor primero; si no hay, la posesión del minuto */
function next(){const m=S.m;if(!m||S.play)return;const E=m.events||[];
 while(S.shown<E.length&&!S.play){const idx=S.shown,ev=E[idx];let p=null;try{p=jugada(ev,idx)}catch(e){console.warn('MC2D jugada',e)}
  if(p){S.play=p;S.play.reveal=idx+(p.skip||1);return}S.shown=idx+1;contar()}
 if(!S.play&&S.phase!=='pre'&&S.phase!=='ht'&&S.phase!=='done'){const p=posesionPlay();if(p)S.play=p;else circularLegado()}}
/* motor clásico (sin posesión escrita): el que tiene la pelota toca con un compañero cercano */
let legT=0;function circularLegado(){if(S.m.v2||S.ball.fly)return;legT-=.016;if(legT>0)return;legT=1.2;const o=S.owner;
 if(!o){const L=S.sp.filter(s=>!s.out&&!s.gk).sort((a,b)=>Math.hypot(a.x-S.ball.x,a.y-S.ball.y)-Math.hypot(b.x-S.ball.x,b.y-S.ball.y));if(L[0]){L[0].ov={x:S.ball.x,y:S.ball.y,run:1};tomar(L[0])}return}
 const mates=S.sp.filter(s=>s.team===o.team&&s!==o&&!s.out&&Math.hypot(s.x-o.x,s.y-o.y)<25);const to=pick(mates);if(to){accion(o,'pasando');patear(to.x,to.y,{v:18,cb:()=>{if(!tomar(to)){to.x=lerp(to.x,S.ball.x,.7);to.y=lerp(to.y,S.ball.y,.7);tomar(to)}}})}}

/* ---------- dibujo ---------- */
function resize(){const r=S.host.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 const w=Math.max(200,Math.round(r.width)),h=Math.max(100,Math.round(r.height));if(w===S.w&&h===S.h&&dpr===S.dpr)return;
 S.w=w;S.h=h;S.dpr=dpr;S.cv.width=w*dpr;S.cv.height=h*dpr;S.cv.style.width=w+'px';S.cv.style.height=h+'px'}
/* proyección: TV/Seguimiento = cámara de transmisión desde la tribuna; Cenital/Táctica = vista desde arriba */
function proj(x,y,z){const c=S.cam,w=S.w,h=S.h;
 if(c==='cen'||c==='tac'){const s=Math.min((w-16)/PW,(h-14)/PH);return[w/2+(x-52.5)*s,h/2+(y-34)*s-(z||0)*s*.6,s]}
 const viewW=c==='seg'?28:42,dc=70,hc=30,top=-6,bot=h+4;
 const k1=1/dc,k0=1/(dc+PH),F=(bot-top)/(hc*(k1-k0)),hz=top-hc*F*k0;
 const d=dc+(PH-y),s=F/d,sx=w/(viewW*(F/dc))*s;
 return[w/2+(x-S.camX)*sx,hz+(hc-(z||0))*s,sx]}
function drawPitch(ctx){const w=S.w,h=S.h;ctx.fillStyle='#0b1a10';ctx.fillRect(0,0,w,h);
 const strips=14;for(let i=0;i<strips;i++){const x0=i*PW/strips,x1=(i+1)*PW/strips;const a=proj(x0,0),b=proj(x1,0),c=proj(x1,PH),d=proj(x0,PH);
  ctx.fillStyle=i%2?'#2e8a3c':'#349544';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.closePath();ctx.fill()}
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
 const home=S.m.venue==='a'?1:0;/* local real del partido */const isHome=s.team===home;
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
function figura(ctx,s,P,isRef){const k=isRef?{d:'liso',c1:'#ffd400',c2:'#111',sh:'#111',me:'#111'}:kitOf(s);const sc=P[2],H=1.85*sc*FIG;if(H<3)return;
 const sp=Math.hypot(s.vx,s.vy),sw=Math.sin(s.ph)*clamp(sp/6,0,1)*.9,f=s.face||1;let x=P[0],y=P[1],rot=0,lift=0;
 const pz=s.pose,pt=s.poseD?clamp(s.poseT/s.poseD,0,1):0;
 if(pz==='cabeceando'||pz==='saltando'||pz==='celebrando'&&pt<.3)lift=Math.sin(pt*Math.PI)*H*.35;
 if(pz==='estirada'){rot=f*(s.vy>0?1:-1)*1.25*Math.min(1,pt*3);lift=Math.sin(Math.min(1,pt*1.6)*Math.PI)*H*.3}
 if(pz==='barrida')rot=-f*1.2;if(pz==='entrada')rot=-f*.45*Math.sin(pt*Math.PI);if(pz==='cayendo')rot=f*1.45*Math.min(1,pt*4);if(pz==='levantandose')rot=f*1.45*(1-pt);
 if(pz==='desequilibrio')rot=f*.35*Math.sin(pt*Math.PI);if(pz==='amague')rot=f*.18*Math.sin(pt*Math.PI*2);if(pz==='controlando')lift=-H*.03;
 ctx.globalAlpha=s.alpha;
 ctx.fillStyle='rgba(0,0,0,.33)';ctx.beginPath();ctx.ellipse(x,y,H*.28,H*.08,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(x,y-lift);ctx.rotate(rot);
 const hip=-H*.48,sh=-H*.8,lw=Math.max(1,H*.11),aw=Math.max(1,H*.085);
 let la=sw*.8,ra=-sw*.8,lArm=-sw*.9,rArm=sw*.9;
 if(pz==='pasando'||pz==='rematando'){const k=f*((pz==='rematando'?1.35:1)-pt*1.7);if(s.pie==='izq'){ra=f*-.2;la=k}else{la=f*-.2;ra=k}lArm=-f*.9;rArm=f*.7}
 if(pz==='cabeceando'||pz==='saltando'||pz==='celebrando'){lArm=-2.6*f;rArm=2.6*f}if(pz==='abrazo'){lArm=f*1.4;rArm=f*1.2}if(pz==='pide'){rArm=-f*2.8}if(pz==='saque'){lArm=rArm=-f*3}
 if(pz==='atajando'){lArm=f*1.6;rArm=f*1.5}if(pz==='barrida'||pz==='entrada'){ra=f*1.3;la=f*.4}
 if(pz==='protesta'){lArm=-1.7;rArm=1.7}if(pz==='lamento'){lArm=-2.9;rArm=2.9;la=ra=0}if(pz==='tarjeta'){rArm=-f*2.9}
 if(pz==='estirada'){lArm=-f*2.8;rArm=-f*2.4}
 const leg=(a,c)=>{const kx=Math.sin(a)*H*.24,ky=hip+Math.cos(a)*H*.24,fx=kx+Math.sin(a*1.3)*H*.22,fy=ky+H*.24;seg(ctx,0,hip,kx,ky,k.sh,lw*1.15);seg(ctx,kx,ky,fx,fy,k.me,lw);ctx.fillStyle='#111';ctx.fillRect(fx-lw*.6+(f>0?0:-lw*.4),fy-lw*.3,lw*1.6,lw*.7)};
 leg(la,k);leg(ra,k);
 const tw=H*.3,th=H*.36;
 const sleeve=k.d==='mangas'?k.c2:k.c1;
 const arm=a=>{const ex=Math.sin(a)*H*.2,ey=sh+H*.03+Math.cos(a)*H*.2;seg(ctx,0,sh+H*.03,ex,ey,sleeve,aw*1.1);seg(ctx,ex,ey,ex+Math.sin(a)*H*.13,ey+Math.cos(a)*H*.13,s.skin||'#e0ac83',aw)};
 arm(lArm);
 ctx.fillStyle=k.sh;ctx.fillRect(-tw*.5,hip-H*.02,tw,H*.13);
 torso(ctx,k,-tw/2,sh,tw,th);
 arm(rArm);
 if(pz==='tarjeta'&&s.cardC){}
 ctx.fillStyle=s.skin||'#e0ac83';ctx.beginPath();ctx.arc(0,sh-H*.1,H*.095,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#2b1d14';ctx.beginPath();ctx.arc(0,sh-H*.12,H*.095,Math.PI,0);ctx.fill();
 ctx.restore();ctx.globalAlpha=1;
 if(s.card&&s.cardT>0){ctx.fillStyle=s.card==='red'?'#e02a2a':'#ffd400';ctx.fillRect(x-H*.08,y-H*1.55,H*.16,H*.22)}}
function marca(ctx,s,P){/* vistas desde arriba */const k=kitOf(s),r=Math.max(4,P[2]*.95);ctx.globalAlpha=s.alpha;
 ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(P[0]+1,P[1]+1.5,r,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.beginPath();ctx.arc(P[0],P[1],r,0,Math.PI*2);ctx.clip();torso(ctx,k,P[0]-r,P[1]-r,r*2,r*2);ctx.restore();
 ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(P[0],P[1],r,0,Math.PI*2);ctx.stroke();
 if(S.cam==='tac'){ctx.fillStyle=(k.c1==='#ffffff'||k.c1==='#f4f4f4'||k.c1==='#ffd400'||k.c1==='#ffe500'||k.c1==='#fde100')?'#111':'#fff';ctx.font=`700 ${Math.round(r*1.1)}px "Barlow Semi Condensed",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.num),P[0],P[1]+.5)}
 ctx.globalAlpha=1}
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
 /* textos */
 if(S.banner){ctx.font='800 italic 12px "Barlow Semi Condensed",Arial';const t=S.banner.txt,tw=ctx.measureText(t).width+18;ctx.fillStyle='rgba(4,8,20,.85)';ctx.fillRect(8,8,tw,20);ctx.fillStyle=S.banner.col;ctx.fillRect(8,8,3,20);ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(t,16,18.5)}
 if(S.big){const k=1-S.big.t/S.big.d,sc=1+Math.min(.25,k*.6);ctx.save();ctx.translate(S.w/2,S.h*.42);ctx.scale(sc,sc);ctx.font=`900 italic ${Math.round(S.h*.2)}px "Barlow Semi Condensed",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.globalAlpha=Math.min(1,S.big.t*2);ctx.lineWidth=5;ctx.strokeStyle='rgba(4,8,20,.85)';ctx.strokeText(S.big.txt,0,0);ctx.fillStyle=S.big.col;ctx.fillText(S.big.txt,0,0);ctx.restore();ctx.globalAlpha=1}}

/* ---------- bucle ---------- */
function speed(){let v=1;try{v=matchSpeed||1}catch(e){}return v}
function frame(ts){S.raf=0;if(!S.cv||!S.cv.isConnected){return}
 const now=ts/1000,real=Math.min(.05,S.last?now-S.last:.016);S.last=now;const dt=real*speed();S.t+=dt;
 resize();const m=S.m;
 if(m){syncPlayers();if(!S.play)next();runPlay(dt);
  marcasT-=dt;if(marcasT<=0){marcasT=.4;const o=S.owner;S.pressers=[];if(o&&!S.reset){const pr=((tacOf(1-o.team).pressing??50)>62)?2:1;S.pressers=S.sp.filter(s=>s.team!==o.team&&!s.out&&!s.gk).sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y)).slice(0,pr)}asignarMarcas()}
  ballStep(dt);S.sp.forEach(s=>{step(s,dt);if(s.cardT>0)s.cardT-=dt;else s.card=null});
  if(S.ref){const r=S.ref;r.ov={x:clamp(S.ball.x-dirOf(0)*8,8,97),y:clamp(S.ball.y+12,6,62),run:.7};step(r,dt)}
  /* cámara: sigue la pelota con suavidad (más cerca en Seguimiento) */
  const half=(S.cam==='seg'?28:42)/2,tx=clamp(S.ball.x,half-4,PW-half+4);S.camX+=(tx-S.camX)*Math.min(1,real*(S.cam==='seg'?3.2:1.8));
  if(S.banner){S.banner.t-=real;if(S.banner.t<=0)S.banner=null}if(S.big){S.big.t-=real;if(S.big.t<=0)S.big=null}}
 draw();S.raf=requestAnimationFrame(frame)}

function init(m){S.m=m;S.sp=[];S.byKey=new Map();S.queue=[];S.play=null;S.owner=null;S.ball=newBall();S.half=(m.clock&&m.clock.half)||1;
 S.phase=m.phase||'pre';S.goles=[0,0];S.banner=null;S.big=null;S.reset=false;
 try{const loc=m.venue==='a'?m.away:m.home,vis=m.venue==='a'?m.home:m.away;const k=window.MCCamisetas?MCCamisetas.partido(loc,vis):null;S.kits=k}catch(e){S.kits=null}
 S.ref={key:'ref',team:-1,name:'Árbitro',num:'',x:50,y:44,vx:0,vy:0,vmax:6.5,acc:4,ph:0,pose:'run',poseT:0,poseD:0,alpha:1,face:1,skin:'#d9a87e',reg:50,vis:50,cad:1,estado:'quieto'};
 /* lo que ya pasó antes de montar el visor se muestra sin animar */
 const E=m.events||[];S.shown=E.length;contar();S.tele=0;S.posId=m.v2&&m.v2.posesion&&m.v2.posesion.length?m.v2.posesion[m.v2.posesion.length-1].id:0;
 syncPlayers();S.sp.forEach(s=>{const p=formPos(s);s.x=p[0];s.y=p[1]});
 }

/* ---------- API para el juego ---------- */
function visible(){return!!(S.cv&&S.cv.isConnected&&document.visibilityState==='visible'&&S.cv.getBoundingClientRect().width>0)}
const API={
 montar(host,m){if(!host||!m)return;if(S.m!==m)init(m);S.host=host;
  if(!S.cv||!S.cv.isConnected){const n=(m.events||[]).length;if(n-S.shown>4){S.play=null;S.shown=n;contar()}}
  if(!S.cv){S.cv=document.createElement('canvas');S.cv.className='m2d';S.cx=S.cv.getContext('2d')}
  host.innerHTML='';host.appendChild(S.cv);
  const bar=document.createElement('div');bar.className='m2d-cams';bar.innerHTML=CAMS.map(([k,t])=>`<button class="${(S.cam||camPref)===k?'on':''}" data-c="${k}">${t}</button>`).join('');
  bar.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;S.cam=b.dataset.c;camPref=S.cam;try{localStorage.setItem('mc_cam',S.cam)}catch(e){}bar.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
  host.appendChild(bar);S.cam=S.cam||camPref;S.w=0;resize();if(!S.raf)S.raf=requestAnimationFrame(frame)},
 /* el reloj del motor espera mientras se muestra una jugada (o hay eventos sin mostrar) */
 retener(m){if(!m||m!==S.m||m.done||!visible())return false;return!!S.play||S.shown<(m.events||[]).length},
 corte(m){if(!m||m!==S.m||!visible()||m.done)return(m&&m.events||[]).length;return Math.min(S.shown,(m.events||[]).length)},
 marcador(m){if(!m||m!==S.m||!visible()||m.done)return[m.h,m.a];return S.goles},
 saltar(){if(!S.m)return;S.play=null;S.queue=[];S.shown=(S.m.events||[]).length;contar();S.owner=null;S.phase=S.m.done?'done':S.phase},
 estado(){const est={},tac={},acc={};S.sp.forEach(s=>{if(s.out)return;est[s.estado]=(est[s.estado]||0)+1;if(s.tactico)tac[s.tactico]=(tac[s.tactico]||0)+1;if(s.pose&&s.pose!=='run')acc[s.pose]=(acc[s.pose]||0)+1});
  return{jugada:S.play?S.play.label:null,mostrados:S.shown,eventos:S.m?(S.m.events||[]).length:0,camara:S.cam,jugadores:S.sp.filter(s=>!s.out).length,goles:S.goles.slice(),cuadros:S.t,teletransportes:S.tele,estados:est,tacticos:tac,acciones:acc,posesionId:S.posId}}
};
window.MC2D=API;
/* estilos del visor (la cancha más alta, cámaras arriba a la derecha) */
const st=document.createElement('style');st.textContent=`#m12M .pt.pt2d{position:relative;aspect-ratio:2.1/1;height:auto;min-height:160px;overflow:hidden;border-radius:14px}
#m12M .pt.pt2d canvas.m2d{display:block;width:100%;height:100%}
.m2d-cams{position:absolute;top:6px;right:6px;display:flex;gap:4px}
.m2d-cams button{font:700 10px "Barlow Semi Condensed",Arial;letter-spacing:.02em;color:#fff;background:rgba(4,8,20,.55);border:1px solid rgba(226,189,112,.35);border-radius:7px;padding:3px 6px}
.m2d-cams button.on{background:rgba(226,189,112,.95);color:#0b1222;border-color:#e2bd70}`;
document.head.appendChild(st);
})();
