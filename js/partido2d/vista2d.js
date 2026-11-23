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
 owner:null,posTeam:0,timer:0,queue:[],play:null,shown:0,goles:[0,0],t:0,last:0,camX:52.5,camY:34,banner:null,big:null,raf:0,kits:null,half:1,phase:''};

/* ---------- jugadores ---------- */
function atr(e){try{const p=e.p||e;return window.MCAtributos?MCAtributos.de({name:p.name,pos:p.pos,grl:p.rating||e.r||p.grl||60,age:p.age||e.age||26}).v:null}catch(x){return null}}
function nombre(e){return e.p?e.p.name:e.name}
function corto(n){n=String(n||'');const a=n.split(' ');return a.length>1?a[a.length-1]:n}
function skinOf(n){let h=0;for(const c of String(n))h=(h*31+c.charCodeAt(0))|0;return['#f1c9a5','#e0ac83','#c68a5e','#9c6644','#6f4a2f','#f3d2b3'][Math.abs(h)%6]}
function mkSprite(e,team,i){const a=atr(e)||{};const vel=a.velocidad||65,ac=a.aceleracion||65;
 return{key:e.key,e,team,i,name:nombre(e),num:e.p?(e.p.number||i+1):i+1,g:e.g,role:e.role,gk:e.g==='POR',
  x:52.5,y:34,vx:0,vy:0,tx:52.5,ty:34,ov:null,face:team===0?1:-1,ph:rnd()*6,
  vmax:5.6+(vel-50)*.05,acc:3.2+(ac-50)*.05,reg:a.regate||60,vis:a.vision||60,pose:'run',poseT:0,poseD:0,alpha:1,out:false,skin:skinOf(nombre(e)),card:null}}
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

/* ---------- movimiento ---------- */
function step(s,dt){if(s.pose==='fall'||s.pose==='dive'||s.pose==='slide'){s.poseT+=dt;if(s.poseT<s.poseD){s.vx*=.9;s.vy*=.9;s.x+=s.vx*dt;s.y+=s.vy*dt;return}s.pose='run'}
 if(s.pose!=='run'&&s.pose!=='kick'&&s.pose!=='head'){s.poseT+=dt;if(s.poseT>=s.poseD)s.pose='run'}
 if((s.pose==='kick'||s.pose==='head')){s.poseT+=dt;if(s.poseT>=s.poseD)s.pose='run'}
 let tx,ty,mul=1;
 if(s.ov){tx=s.ov.x;ty=s.ov.y;mul=s.ov.run||1}else{const p=formPos(s);tx=p[0];ty=p[1];mul=.72}
 if(!s.ov&&S.owner&&S.owner!==s&&S.posTeam!==s.team&&S.pressers&&S.pressers.includes(s)){tx=S.ball.x-dirOf(s.team)*1.2;ty=S.ball.y;mul=.92}
 const dx=tx-s.x,dy=ty-s.y,dd=Math.hypot(dx,dy);const vm=s.vmax*mul*(window.MCMotor&&MCMotor.energia&&s.e?(.85+.15*MCMotor.energia(s.e)):1);
 const want=dd<.4?0:Math.min(vm,dd*1.6),wx=dd?dx/dd*want:0,wy=dd?dy/dd*want:0;
 const ax=wx-s.vx,ay=wy-s.vy,al=Math.hypot(ax,ay),amax=s.acc*dt;
 if(al>amax){s.vx+=ax/al*amax;s.vy+=ay/al*amax}else{s.vx=wx;s.vy=wy}
 s.x+=s.vx*dt;s.y+=s.vy*dt;const sp=Math.hypot(s.vx,s.vy);s.ph+=dt*(2+sp*1.9);
 if(Math.abs(s.vx)>.25)s.face=s.vx>0?1:-1;else if(S.ball&&s.pose==='run')s.face=S.ball.x>=s.x?1:-1;
 if(s.out&&s.y>PH+2)s.alpha=Math.max(0,s.alpha-dt)}
function pose(s,p,d){s.pose=p;s.poseT=0;s.poseD=d||.45;if(p==='fall'||p==='slide'||p==='dive'){}}

/* ---------- pelota ---------- */
function newBall(){return{x:52.5,y:34,z:0,vx:0,vy:0,vz:0,fly:null}}
function ballStep(dt){const b=S.ball;
 if(b.fly){const f=b.fly;f.t+=dt;const k=clamp(f.t/f.d,0,1),e=f.ease?1-Math.pow(1-k,2):k;b.x=lerp(f.x0,f.x1,e);b.y=lerp(f.y0,f.y1,e);b.z=f.h*4*k*(1-k)+(f.z1||0)*k;
  if(k>=1){b.fly=null;b.z=f.z1||0;const cb=f.cb;f.cb=null;if(cb)cb()}return}
 if(S.owner){const o=S.owner;const d=o.face||1;b.x=o.x+d*.55;b.y=o.y+.25;b.z=0;return}
 b.vx*=Math.pow(.35,dt);b.vy*=Math.pow(.35,dt);b.x+=b.vx*dt;b.y+=b.vy*dt}
function kickTo(x,y,opt){opt=opt||{};const b=S.ball;S.owner=null;const dist=Math.hypot(x-b.x,y-b.y);
 const v=opt.v||(opt.h>2?17:20);b.fly={x0:b.x,y0:b.y,x1:x,y1:y,h:opt.h||0,z1:opt.z1||0,t:0,d:Math.max(.25,dist/v),ease:!opt.lin,cb:opt.cb}}
function giveTo(s){S.owner=s;if(s)S.posTeam=s.team}

/* ---------- circulación entre jugadas (posesión del motor) ---------- */
function circular(dt){if(S.play||S.phase==='pre'||S.phase==='ht'||S.phase==='done'||S.ball.fly)return;
 const m=S.m;S.timer-=dt;
 if(!S.owner){const L=S.sp.filter(s=>!s.out&&!s.gk);let best=null,bd=1e9;for(const s of L){const d=Math.hypot(s.x-S.ball.x,s.y-S.ball.y);if(d<bd){bd=d;best=s}}
  if(best){best.ov={x:S.ball.x,y:S.ball.y,run:1};if(bd<1.2){best.ov=null;giveTo(best);S.timer=rr(.7,1.6)}}return}
 const o=S.owner,dir=dirOf(o.team);
 /* el que tiene la pelota avanza un poco (más si gambetea bien) */
 o.ov={x:clamp(o.x+dir*(2+o.reg/40),3,102),y:o.y+rr(-1,1),run:.6};
 /* presión: 1 o 2 rivales van a la pelota */
 const riv=S.sp.filter(s=>s.team!==o.team&&!s.out&&!s.gk).sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y));
 const pr=((tacOf(1-o.team).pressing??50)>62)?2:1;S.pressers=riv.slice(0,pr);
 if(S.timer>0)return;
 /* posesión objetivo = la del motor */
 const share=o.team===0?(m.pos||50)/100:1-(m.pos||50)/100;
 if(rnd()>share*1.18&&riv.length){const thief=riv[0];o.ov=null;thief.ov=null;pose(o,'stumble',.35);giveTo(thief);S.timer=rr(.8,1.6);return}
 const mates=S.sp.filter(s=>s.team===o.team&&s!==o&&!s.out);
 if(!mates.length){S.timer=1;return}
 const w=mates.map(s=>{const fw=(s.x-o.x)*dir,d=Math.hypot(s.x-o.x,s.y-o.y);if(d<5||d>38)return .05;return Math.max(.05,1+fw/20*(o.vis/70))*(s.gk?.25:1)});
 let tot=w.reduce((a,b)=>a+b,0),r=rnd()*tot,to=mates[0];for(let i=0;i<mates.length;i++){r-=w[i];if(r<=0){to=mates[i];break}}
 o.ov=null;pose(o,'kick',.3);const tx=to.x+(to.vx||0)*.5,ty=to.y+(to.vy||0)*.5;to.ov={x:tx,y:ty,run:.8};
 kickTo(tx,ty,{h:Math.hypot(tx-o.x,ty-o.y)>28?3.5:0,cb:()=>{to.ov=null;giveTo(to);S.timer=rr(.8,2.2)}});S.timer=99}

/* ---------- jugadas de los eventos ---------- */
function teamOfSide(side){return side==='r'?1:0}
function quien(team,name,pref){const L=S.sp.filter(s=>s.team===team&&!s.out);if(!L.length)return null;
 if(name){const f=fold(name);let s=L.find(x=>fold(x.name)===f)||L.find(x=>f&&fold(x.name).includes(f.split(' ').pop()));if(s)return s}
 if(pref==='gk')return L.find(s=>s.gk)||L[0];if(pref==='def')return pick(L.filter(s=>s.g==='DEF').concat(L.filter(s=>s.g==='MED')))||L[0];
 if(pref==='mid')return pick(L.filter(s=>s.g==='MED'))||L[0];return pick(L.filter(s=>s.g==='DEL').concat(L.filter(s=>s.g==='MED')))||L[0]}
function nombresEn(team,msg){const f=fold(msg);return S.sp.filter(s=>s.team===team&&!s.out&&f.includes(fold(corto(s.name)))).sort((a,b)=>f.indexOf(fold(corto(a.name)))-f.indexOf(fold(corto(b.name))))}
function goalX(team){return dirOf(team)>0?PW:0}
/* secuencia: lista de pasos {d: duración, f: acción al empezar} */
function seq(steps,ev,big){return{steps,i:-1,t:0,ev,big,label:ev?(ev.title||''):''}}
function runPlay(dt){const p=S.play;if(!p)return;p.t-=dt;
 if(p.t<=0){p.i++;if(p.i>=p.steps.length){finish(p);return}const st=p.steps[p.i];p.t=st.d;try{st.f&&st.f()}catch(e){console.warn('MC2D',e)}}}
function finish(p){S.play=null;S.reset=false;S.sp.forEach(s=>{if(!s.out)s.ov=null});if(p.reveal)reveal(p.reveal);next()}
function reveal(n){if(n>S.shown){S.shown=n;contar();try{window.renderMatch&&renderMatch()}catch(e){}}}
function contar(){const E=(S.m.events||[]).slice(0,S.shown);let o=0,r=0;E.forEach(e=>{if(/GOL (LOCAL|VISITANTE)/.test(e.title||'')){if(e.side==='r')r++;else o++}});S.goles=[o,r]}
function banner(txt,col,d){S.banner={txt,col:col||'#e2bd70',t:d||2.4}}
function bigTxt(txt,col,d){S.big={txt,col:col||'#e2bd70',t:d||1.6,d:d||1.6}}

/* construye una jugada de ataque que termina en remate */
function ataque(team,shooterName,assistName,tipo,final,ev,extra){const dir=dirOf(team),gx=goalX(team),opp=1-team;
 const sh=quien(team,shooterName,'att'),as=assistName?quien(team,assistName,'mid'):null,gk=quien(opp,null,'gk'),df=quien(opp,(extra&&extra.def)||null,'def');
 if(!sh)return null;const W=[];const ax=gx-dir*rr(16,24);
 const centro=/cabezazo|centro|corner/.test(tipo),lejos=/afuera|tirolibre/.test(tipo),filt=/filtrado|contra/.test(tipo);
 const wing=rnd()<.5?7:61;
 const giv=as||quien(team,null,'mid');
 W.push({d:.25,f(){S.reset=false;giveTo(giv);giv.ov={x:gx-dir*(centro?22:30),y:centro?wing:clamp(giv.y,18,50),run:1}}});
 if(filt){W.push({d:.9,f(){sh.ov={x:gx-dir*rr(13,17),y:rr(26,42),run:1};if(df)df.ov={x:gx-dir*15,y:sh.y,run:1}}});
  W.push({d:.75,f(){pose(giv,'kick',.3);const tx=gx-dir*rr(10,13),ty=rr(28,40);sh.ov={x:tx,y:ty,run:1};kickTo(tx,ty,{v:22,cb:()=>{giveTo(sh)}})}})}
 else if(centro){W.push({d:1.1,f(){giv.ov={x:gx-dir*6,y:wing,run:1};sh.ov={x:gx-dir*9,y:rr(30,38),run:.9};if(df)df.ov={x:gx-dir*8,y:34,run:.9}}});
  W.push({d:.95,f(){pose(giv,'kick',.35);const tx=gx-dir*rr(6.5,9),ty=rr(30,38);sh.ov={x:tx,y:ty,run:1};kickTo(tx,ty,{h:5,z1:1.8,v:19})}});
  W.push({d:.12,f(){pose(sh,'head',.55);if(df)pose(df,'head',.5)}})}
 else if(lejos){W.push({d:.8,f(){if(giv!==sh){pose(giv,'kick',.3);kickTo(gx-dir*24,rr(24,44),{cb:()=>giveTo(sh)});sh.ov={x:gx-dir*24,y:rr(26,42),run:1}}else sh.ov={x:gx-dir*23,y:rr(24,44),run:.8}}}) ;W.push({d:.6,f(){if(S.owner!==sh)giveTo(sh)}})}
 else{W.push({d:.8,f(){sh.ov={x:gx-dir*15,y:rr(27,41),run:1};if(giv!==sh){pose(giv,'kick',.3);kickTo(sh.ov.x,sh.ov.y,{cb:()=>giveTo(sh)})}}});
  if(tipo==='individual'&&df)W.push({d:.7,f(){df.ov={x:sh.x+dir*2,y:sh.y,run:1};pose(sh,'run');sh.ov={x:gx-dir*11,y:sh.y+(rnd()<.5?-5:5),run:1}}});
  W.push({d:.45,f(){if(S.owner!==sh)giveTo(sh);sh.ov={x:gx-dir*12,y:sh.y,run:.8}}})}
 /* remate */
 const gy=final==='gol'?rr(31,37):final==='afuera'?(rnd()<.5?rr(26,29.6):rr(38.4,42)):rr(31.5,36.5);
 W.push({d:.05,f(){if(!centro)pose(sh,'kick',.35);if(df&&!centro&&rnd()<.5)pose(df,'slide',.6)}});
 W.push({d:.75,f(){const gxx=final==='gol'?gx+dir*1.2:final==='afuera'?gx+dir*3:gx-dir*.8;
  kickTo(gxx,gy,{v:28,h:lejos?1.6:centro?0:.6,lin:true});
  if(gk){gk.ov={x:gx-dir*1.2,y:clamp(gy,30,38),run:1};pose(gk,'dive',.95);gk.vy=(gy-gk.y)*2.2}}});
 if(final==='gol')W.push({d:1.6,f(){bigTxt('¡GOL!','#e2bd70',1.6);sh.ov={x:gx-dir*rr(8,14),y:rnd()<.5?6:62,run:1};pose(sh,'celebra',2.4);
   S.sp.filter(s=>s.team===team&&s!==sh&&!s.gk).slice(0,4).forEach(s=>{s.ov={x:sh.ov.x-dir*2+rr(-2,2),y:sh.ov.y+rr(-3,3),run:.9}});
   S.sp.filter(s=>s.team===opp&&!s.gk).slice(0,3).forEach(s=>pose(s,'lamento',2.2))}});
 else if(final==='atajada')W.push({d:1.1,f(){if(gk){S.owner=null;S.ball.fly=null;giveTo(gk);gk.ov=null}}},{d:.7,f(){if(gk){pose(gk,'kick',.3);kickTo(gx-dir*rr(30,45),rr(15,53),{h:6})}}});
 else W.push({d:1.1,f(){pose(sh,'lamento',1.2);S.owner=null}},{d:.4,f(){if(gk){S.ball.x=gx-dir*5;S.ball.y=rr(28,40);S.ball.fly=null;giveTo(gk)}}});
 return W}

function kickoff(team){return[{d:.9,f(){S.reset=true;S.owner=null;S.ball.fly=null;S.ball.x=52.5;S.ball.y=34;S.ball.z=0;S.sp.forEach(s=>{if(!s.out){const p=formPos(s);s.ov={x:p[0],y:p[1],run:.9}}})}},
 {d:.5,f(){S.reset=false;const k=quien(team,null,'att');if(k){k.x=52.5-dirOf(team)*.6;k.y=34;giveTo(k)}S.timer=.6}}]}

/* evento → jugada */
function jugada(ev,idx){const T=ev.title||'',msg=ev.msg||'',side=ev.side||'o',team=teamOfSide(side),opp=1-team,E=S.m.events;
 const nx=E[idx+1]||{};
 if(/GOL (LOCAL|VISITANTE)/.test(T)){const g=ev.gol||{};const nm=nombresEn(team,msg);
  const W=g.tipo==='pen'?penal(team,g.autor||(nm[0]&&nm[0].name),'gol'):ataque(team,g.autor||(nm[0]&&nm[0].name),g.asist||(nm[1]&&nm[1].name),g.tipo||'area','gol',ev);if(!W)return null;
  W.push({d:.01,f(){reveal(idx+1)}});return seq(W.concat(kickoff(opp)),ev)}
 if(/⚠ PENAL/.test(T)){let j=idx+1,res='afuera';for(;j<Math.min(E.length,idx+4);j++){const t2=E[j].title||'';if(/GOL (LOCAL|VISITANTE)/.test(t2)){res='gol';break}if(/PENAL FALLADO/.test(t2)){res=/ataja/i.test(E[j].msg||'')?'atajada':'afuera';break}}if(j>=Math.min(E.length,idx+4))j=idx;
  const nm=nombresEn(team,msg),vic=nm[0],tk=nm[nm.length-1];const df=nombresEn(opp,msg)[0]||quien(opp,null,'def');
  const W=[{d:.9,f(){if(vic&&df){giveTo(vic);df.ov={x:vic.x,y:vic.y,run:1};pose(df,'slide',.7)}}},{d:1,f(){if(vic)pose(vic,'fall',1.2);S.owner=null;bigTxt('¡PENAL!','#ff6b5b',1.2)}}].concat(penal(team,tk&&tk.name,res));
  const skip=j-idx+1;
  W.push({d:.01,f(){reveal(idx+skip)}});const pl=seq(res==='gol'?W.concat(kickoff(opp)):W,ev);pl.skip=skip;return pl}
 if(/OCASI|ATAJADA/.test(T)){const nm=nombresEn(team,msg),j=ev.j||{};const W=ataque(team,j.tirador||(nm[0]&&nm[0].name),null,j.tipo||guessTipo(msg),/ATAJADA/.test(T)?'atajada':'afuera',ev,{def:j.def});
  if(!W)return null;W.push({d:.01,f(){reveal(idx+1)}});return seq(W,ev)}
 if(/ESQUINA/.test(T)){const dir=dirOf(team),gx=goalX(team),wing=rnd()<.5?.6:67.4;const tk=quien(team,null,'mid'),df=nombresEn(opp,msg)[0]||quien(opp,null,'def');
  return seq([{d:1.2,f(){S.reset=false;S.owner=null;S.ball.fly=null;S.ball.x=gx-dir*.5;S.ball.y=wing;if(tk){tk.ov={x:gx-dir*1.2,y:wing,run:1}}S.sp.filter(s=>!s.gk&&s!==tk&&!s.out).forEach(s=>{s.ov={x:gx-dir*rr(5,15),y:rr(25,43),run:.9}});banner('Tiro de esquina','#e2bd70')}},
   {d:1,f(){if(tk)pose(tk,'kick',.35);kickTo(gx-dir*7,rr(30,38),{h:6,z1:1.8})}},{d:.6,f(){if(df){df.ov={x:S.ball.x,y:S.ball.y,run:1};pose(df,'head',.5)}}},
   {d:.8,f(){kickTo(gx-dir*rr(28,36),rr(15,53),{h:5});reveal(idx+1)}}],ev)}
 if(/AMARILLA|EXPULSI|FALTA/.test(T)){const nm=nombresEn(team,msg),inf=nm[0]||quien(team,null,'def'),vic=nombresEn(opp,msg)[0]||quien(opp,null,'att');const col=/EXPULSI/.test(T)?'red':/AMARILLA/.test(T)?'yellow':null;
  return seq([{d:.8,f(){if(vic)giveTo(vic);if(inf&&vic)inf.ov={x:vic.x,y:vic.y,run:1}}},{d:.9,f(){if(inf)pose(inf,'slide',.7);if(vic){pose(vic,'fall',1.4);S.owner=null}}},
   {d:1.3,f(){if(col&&inf){inf.card=col;inf.cardT=1.8;S.ref.ov={x:inf.x-1.5,y:inf.y+1,run:1};pose(S.ref,'tarjeta',1.4)}S.sp.filter(s=>s.team===team&&s!==inf&&!s.out&&Math.hypot(s.x-(inf?inf.x:50),s.y-(inf?inf.y:34))<14).slice(0,2).forEach(s=>pose(s,'protesta',1.2));
    banner(col==='red'?'Roja directa':col?'Tarjeta amarilla':'Falta',col==='red'?'#ff4d4d':col?'#ffd400':'#ffffff');reveal(idx+1)}},{d:.6,f(){if(vic)giveTo(vic)}}],ev)}
 if(/OFFSIDE/.test(T)){const dir=dirOf(team),gx=goalX(team),at=nombresEn(team,msg)[0]||quien(team,null,'att'),pa=quien(team,null,'mid');
  return seq([{d:.6,f(){if(pa)giveTo(pa);if(at)at.ov={x:gx-dir*12,y:at.y,run:1}}},{d:.8,f(){if(pa)pose(pa,'kick',.3);if(at)kickTo(gx-dir*13,at.y,{v:20})}},{d:1.2,f(){bigTxt('OFFSIDE','#ffffff',1.1);reveal(idx+1);const g=quien(1-team,null,'gk');S.ball.fly=null;if(g)giveTo(g)}}],ev)}
 if(/GOL ANULADO/.test(T)){const W=ataque(team,null,null,'area','gol',ev);if(W){W.push({d:1.8,f(){S.owner=null;bigTxt('VAR · ANULADO','#7fd3ff',1.8);reveal(idx+1)}});return seq(W.concat(kickoff(1-team)),ev)}}
 if(/VAR|ERROR ARBITRAL/.test(T)){return seq([{d:.1,f(){S.owner=null}},{d:2,f(){bigTxt(/ANULADO/.test(T)?'VAR · GOL ANULADO':/ERROR ARBITRAL/.test(T)?'ERROR ARBITRAL':'VAR','#7fd3ff',1.8);reveal(idx+1)}}],ev)}
 if(/ERROR INDIVIDUAL/.test(T)){const loser=nombresEn(opp,msg)[0]||quien(1-team,null,'def');const thief=quien(team,null,'att');
  return seq([{d:.5,f(){if(loser)giveTo(loser)}},{d:.7,f(){if(loser)pose(loser,'stumble',.5);if(thief){thief.ov={x:loser?loser.x:50,y:loser?loser.y:34,run:1}}}},{d:.4,f(){if(thief)giveTo(thief);banner('¡Error!','#ff9d3b');reveal(idx+1)}}],ev)}
 if(/LESI/.test(T)&&!/SIN CAMBIOS/.test(T)){const v=nombresEn(team,msg)[0];return seq([{d:.2,f(){S.owner=null}},{d:2.2,f(){if(v)pose(v,'fall',2.2);banner('Lesión','#ff6b5b');reveal(idx+1)}}],ev)}
 if(/COMIENZA EL 2/.test(T)){return seq([{d:.01,f(){S.half=2;S.phase='second'}}].concat(kickoff(1)).concat([{d:.01,f(){reveal(idx+1)}}]),ev)}
 if(/COMIENZA EL PARTIDO/.test(T)){return seq([{d:.01,f(){S.phase='first'}}].concat(kickoff(0)).concat([{d:.01,f(){reveal(idx+1)}}]),ev)}
 if(/DESCANSO/.test(T)){return seq([{d:1.5,f(){S.owner=null;S.phase='ht';bigTxt('ENTRETIEMPO','#e2bd70',1.4);reveal(idx+1)}}],ev)}
 if(/FINAL DEL PARTIDO/.test(T)){return seq([{d:1.6,f(){S.owner=null;S.phase='done';bigTxt('FINAL','#e2bd70',1.6);reveal(idx+1)}}],ev)}
 return null}
function guessTipo(msg){const f=fold(msg);return /cabez/.test(f)?'cabezazo':/afuera|lejos|distancia/.test(f)?'afuera':/mano a mano|filtr/.test(f)?'filtrado':/rebote/.test(f)?'rebote':/libre/.test(f)?'tirolibre':'area'}
function penal(team,taker,res){const dir=dirOf(team),gx=goalX(team),opp=1-team;const tk=quien(team,taker,'att'),gk=quien(opp,null,'gk');
 return[{d:1.4,f(){S.reset=false;S.owner=null;S.ball.fly=null;S.ball.x=gx-dir*11;S.ball.y=34;S.ball.z=0;
   S.sp.filter(s=>!s.out&&s!==tk&&s!==gk).forEach(s=>{s.ov={x:gx-dir*rr(18,24),y:rr(14,54),run:.8}});if(tk)tk.ov={x:gx-dir*13.5,y:34,run:.6};if(gk)gk.ov={x:gx-dir*.4,y:34,run:.6}}},
  {d:.7,f(){if(tk){tk.ov={x:gx-dir*11.4,y:34,run:.9}}}},
  {d:.9,f(){if(tk)pose(tk,'kick',.35);const gy=res==='afuera'?(rnd()<.5?30:38.6):rr(31.5,36.5),gxx=res==='gol'?gx+dir*1.2:res==='afuera'?gx+dir*2:gx-dir*.6;
   kickTo(gxx,gy,{v:30,h:res==='afuera'?2.8:.4,lin:true});if(gk){pose(gk,'dive',.9);gk.vy=(res==='atajada'?(gy-34):(34-gy))*3}}},
  {d:1.2,f(){if(res==='gol'){bigTxt('¡GOL!','#e2bd70',1.4);if(tk){pose(tk,'celebra',2);tk.ov={x:gx-dir*12,y:rnd()<.5?8:60,run:1}}}else{bigTxt(res==='atajada'?'¡ATAJÓ!':'¡AFUERA!','#ffffff',1.2);if(gk&&res==='atajada'){S.ball.fly=null;giveTo(gk)}}}}]}

/* cola de eventos → jugadas */
function next(){const m=S.m;if(!m)return;const E=m.events||[];
 while(S.shown<E.length&&!S.play){const idx=S.shown,ev=E[idx];let p=null;try{p=jugada(ev,idx)}catch(e){console.warn('MC2D jugada',e)}
  if(p){S.play=p;S.play.reveal=idx+(p.skip||1);if(S.cam==='seg'){}return}
  S.shown=idx+1;contar()}}

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
 if(pz==='head'||pz==='celebra'&&pt<.3)lift=Math.sin(pt*Math.PI)*H*.35;
 if(pz==='dive'){rot=f*(s.vy>0?1:-1)*1.25*Math.min(1,pt*3);lift=Math.sin(Math.min(1,pt*1.6)*Math.PI)*H*.3}
 if(pz==='slide')rot=-f*1.2;if(pz==='fall')rot=f*1.45*Math.min(1,pt*4);if(pz==='stumble')rot=f*.35*Math.sin(pt*Math.PI);
 ctx.globalAlpha=s.alpha;
 ctx.fillStyle='rgba(0,0,0,.33)';ctx.beginPath();ctx.ellipse(x,y,H*.28,H*.08,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(x,y-lift);ctx.rotate(rot);
 const hip=-H*.48,sh=-H*.8,lw=Math.max(1,H*.11),aw=Math.max(1,H*.085);
 let la=sw*.8,ra=-sw*.8,lArm=-sw*.9,rArm=sw*.9;
 if(pz==='kick'){la=f*-.2;ra=f*(1.1-pt*1.6)}if(pz==='head'||pz==='celebra'){lArm=-2.6*f;rArm=2.6*f}
 if(pz==='protesta'){lArm=-1.7;rArm=1.7}if(pz==='lamento'){lArm=-2.9;rArm=2.9;la=ra=0}if(pz==='tarjeta'){rArm=-f*2.9}
 if(pz==='dive'){lArm=-f*2.8;rArm=-f*2.4}
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
 if(m){syncPlayers();if(!S.play)next();runPlay(dt);circular(dt);ballStep(dt);S.sp.forEach(s=>{step(s,dt);if(s.cardT>0)s.cardT-=dt;else s.card=null});
  if(S.ref){const r=S.ref;r.ov={x:clamp(S.ball.x-dirOf(0)*8,8,97),y:clamp(S.ball.y+12,6,62),run:.7};step(r,dt)}
  /* cámara: sigue la pelota con suavidad (más cerca en Seguimiento) */
  const half=(S.cam==='seg'?28:42)/2,tx=clamp(S.ball.x,half-4,PW-half+4);S.camX+=(tx-S.camX)*Math.min(1,real*(S.cam==='seg'?3.2:1.8));
  if(S.banner){S.banner.t-=real;if(S.banner.t<=0)S.banner=null}if(S.big){S.big.t-=real;if(S.big.t<=0)S.big=null}}
 draw();S.raf=requestAnimationFrame(frame)}

function init(m){S.m=m;S.sp=[];S.byKey=new Map();S.queue=[];S.play=null;S.owner=null;S.ball=newBall();S.half=(m.clock&&m.clock.half)||1;
 S.phase=m.phase||'pre';S.goles=[0,0];S.banner=null;S.big=null;S.reset=false;
 try{const loc=m.venue==='a'?m.away:m.home,vis=m.venue==='a'?m.home:m.away;const k=window.MCCamisetas?MCCamisetas.partido(loc,vis):null;S.kits=k}catch(e){S.kits=null}
 S.ref={key:'ref',team:-1,name:'Árbitro',num:'',x:50,y:44,vx:0,vy:0,vmax:6.5,acc:4,ph:0,pose:'run',poseT:0,poseD:0,alpha:1,face:1,skin:'#d9a87e',reg:50,vis:50};
 /* lo que ya pasó antes de montar el visor se muestra sin animar */
 const E=m.events||[];S.shown=m.phase==='pre'?E.length:E.length;contar();
 syncPlayers();S.sp.forEach(s=>{const p=formPos(s);s.x=p[0];s.y=p[1]});
 if(m.phase&&m.phase!=='pre'){const k=S.sp.find(s=>s.team===0&&s.g==='MED');if(k)giveTo(k)}}

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
 estado(){return{jugada:S.play?S.play.label:null,mostrados:S.shown,eventos:S.m?(S.m.events||[]).length:0,camara:S.cam,jugadores:S.sp.filter(s=>!s.out).length,goles:S.goles.slice(),cuadros:S.t}}
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
