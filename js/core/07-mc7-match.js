
/* ===== MODO CARRERA 6.2 · SIMULADOR DE PARTIDOS (minuto a minuto) ===== */
(function(){
const $=id=>document.getElementById(id);
const R=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a[Math.floor(R()*a.length)];
const pad=n=>String(n).padStart(2,'0');
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)};
let tmr=null;
function stopTimer(){if(tmr){clearInterval(tmr);tmr=null}}
window.mcStopMatchTimer=stopTimer;
const label=m=>m.clock.x>0?`${m.clock.limit}+${m.clock.x}`:`${m.clock.base}`;
function ev(m,title,msg,key,side){m.evSeq=(m.evSeq||0)+1;m.events.push({id:m.evSeq,lbl:label(m),min:m.clock.base+m.clock.x,title,msg,key:!!key,side:side||''})}
function ps(m,key,name,pos,g,side){return m.pst[key]||(m.pst[key]={key,name,pos,g,side,a:0,gl:0,y:0,r:0,sv:0,on:0})}
window.createMatch=function(){
 matchPaused=false;mcReplaceUnavailable();
 const opp=opponent();if(!opp){match=null;return false}
 const groups=slotGroups(career.formation),co=positions(career.formation),rc=positions('4-3-3');
 const venue=window.mcVenue?mcVenue():'h';
 let rr=padRoster(rosterFor(opp).map(r=>[r[0],r[1],r[2],r[3],r[4],r[5]]),opp);
 const mk=(r,i)=>({name:r[0],pos:r[1],r:r[2],g:r[1],key:'r'+r[0],role:i<11?slotPos({pos:r[1]},rc[i]||[50,50]):null});
 const riv=rr.slice(0,11).map(mk),rivBench=rr.slice(11,11+7).map((r,i)=>mk(r,11+i));
 /* 6.3: un lesionado o suspendido nunca sale a la cancha */
 const own=career.players.slice(0,11).map((p,i)=>({p,g:groups[i],key:'o'+p.id,role:slotPos({pos:groups[i]},co[i]||[50,50])})).filter(e=>!mcUnavailable(e.p));
 const ownBench=career.players.slice(11,11+7).filter(p=>!mcUnavailable(p));
 const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,grlO=avg(own.map(e=>effRating(e.p,e.g))),grlR=avg(riv.map(e=>e.r));
 const tacR=rivalTac(grlR-grlO+(venue==='a'?3:-3));
 match={home:career.club,away:opp,venue,tacR,grlO:Math.round(grlO),grlR:Math.round(grlR),
  suspIds:career.players.filter(p=>p.suspended>0).map(p=>p.id),injIds:career.players.filter(p=>p.injury).map(p=>p.id),injNew:[],
  phase:'pre',clock:{half:1,limit:45,base:0,x:0},extra:{},minute:0,lbl:'0',h:0,a:0,
  shotsH:0,shotsA:0,onH:0,onA:0,pos:50,cornersH:0,cornersA:0,foulsH:0,foulsA:0,yH:0,yA:0,rH:0,rA:0,offH:0,offA:0,xgH:0,xgA:0,savesH:0,savesA:0,
  events:[],done:false,moments:0,own,ownBench,riv,rivBench,ownPlayers:own.map(e=>e.p),rivalPlayers:riv,pst:{},subsOwn:0,subsRiv:0,autoSubs:false,
  rivSubPlan:[58+Math.floor(R()*5),68+Math.floor(R()*6),77+Math.floor(R()*6)],ownAutoPlan:[60,70,80],ownAutoDone:0,scorers:[],tick:0,ratings:null};
 own.forEach(e=>{ps(match,e.key,e.p.name,e.p.pos,e.g,'o')});riv.forEach(e=>{ps(match,e.key,e.name,e.pos,e.g,'r')});
 match.fxO=tacFx(ownTac(),tacR);match.fxR=tacFx(tacR,ownTac());
 return true;
};
/* ===== 6.3 · TÁCTICAS QUE INFLUYEN EN EL PARTIDO ===== */
function ownTac(){const c=career;return{style:c.style||'Equilibrado',mentality:c.mentality??50,width:c.width??50,
 depth:c.depth??({Baja:20,Media:50,Alta:80}[c.line]||50),pressing:c.pressing??(c.style==='Presión alta'?80:50),
 rhythm:c.rhythm??({Bajo:20,Normal:50,Alto:80}[c.tempo]||50),formation:c.formation||'4-3-3'}}
window.mcOwnTac=ownTac;
/* el rival elige su planteo según la diferencia de GRL (d = GRL rival - GRL propio, con localía) */
function rivalTac(d){const t={style:'Equilibrado',mentality:50,width:50,depth:50,pressing:50,rhythm:50,formation:'4-3-3'};
 if(d<=-6){t.style=R()<.6?'Defensivo':'Contraataque';t.mentality=30;t.depth=30}
 else if(d<=-2){t.style=R()<.5?'Contraataque':'Equilibrado';t.mentality=42;t.depth=42}
 else if(d>=6){t.style=R()<.55?'Ofensivo':'Presión alta';t.mentality=68;t.depth=64;t.pressing=t.style==='Presión alta'?80:58}
 else if(d>=2){t.style=R()<.5?'Posesión':'Equilibrado';t.mentality=56}
 return t}
const STYLE_FX={Equilibrado:{cr:0,ex:0,cv:0,ocv:0,pos:0,foul:0,fat:0},
 Ofensivo:{cr:.16,ex:.10,cv:0,ocv:.02,pos:2,foul:0,fat:.1},
 Defensivo:{cr:-.30,ex:-.26,cv:0,ocv:-.05,pos:-6,foul:.1,fat:0},
 'Posesión':{cr:.04,ex:-.12,cv:.02,ocv:0,pos:8,foul:-.1,fat:0},
 Contraataque:{cr:-.10,ex:-.06,cv:.05,ocv:-.01,pos:-6,foul:0,fat:.1},
 'Presión alta':{cr:.12,ex:.05,cv:0,ocv:.01,pos:3,foul:.3,fat:.5}};
/* cr: llegadas propias · ex: llegadas que concede · cv: calidad de sus ocasiones · ocv: facilidad que le da al rival para convertir */
function tacFx(t,opp){
 const M=(t.mentality-50)/50,W=(t.width-50)/50,D=(t.depth-50)/50,P=(t.pressing-50)/50,Q=(t.rhythm-50)/50;
 const S=STYLE_FX[t.style]||STYLE_FX.Equilibrado,f=String(t.formation||'4-3-3').split('-').map(Number),nD=f[0],nF=f[f.length-1],nM=10-nD-nF;
 const oM=opp?(opp.mentality-50)/50:0,oD=opp?(opp.depth-50)/50:0;
 let cr=S.cr+M*.22+W*.05+D*.07+P*.10+Q*.12+(nF-2)*.07+(nM-4)*.02;
 let ex=S.ex+M*.15+W*.03+D*.04-P*.03+Q*.10-(nD-4)*.10;
 let cv=S.cv,ocv=S.ocv+(M<0?M*.06:M*.02)+D*.04+(W<0?W*.02:0);
 if(t.style==='Contraataque'){cr+=Math.max(0,oM)*.25+Math.max(0,oD)*.18;cv+=Math.max(0,oD)*.03}
 return{cr,ex,cv,ocv:Math.max(-.11,ocv),pos:S.pos+P*3+D*2-Q*2+(nM-3)*2+M*2,foul:Math.max(.5,1+S.foul+P*.35),
  fat:Math.max(-.4,S.fat+P*.5+Q*.4),corner:Math.max(.5,1+W*.45+M*.15),offOpp:Math.max(.4,1+D*.8),W}}
window.mcTacFx=tacFx;
function weightedPick(L,wf){const w=L.map(wf),t=w.reduce((a,b)=>a+b,0);if(t<=0)return L[0];let r=R()*t;for(let i=0;i<L.length;i++){r-=w[i];if(r<=0)return L[i]}return L[L.length-1]}
const nm=(m,e,side)=>side==='o'?e.p.name:e.name;
const clubOf=(m,side)=>side==='o'?m.home:m.away;
/* marcador escrito como local - visitante */
function scoreTxt(m){return m.venue==='a'?`${m.away} ${m.a}-${m.h} ${m.home}`:`${m.home} ${m.h}-${m.a} ${m.away}`}
window.mcScoreTxt=scoreTxt;
/* ---- 6.3 · relato ---- */
const P_=a=>a[Math.floor(R()*a.length)];
function goalText(type,s,a,d,k){
 const T={
  cabezazo:[`${a} desborda por la banda y tira el centro; ${s} le gana en el salto a ${d} y la clava de cabeza junto al palo.`,`Centro preciso de ${a} desde la derecha y ${s} conecta un cabezazo inatajable para ${k}.`],
  centro:[`${a} llega al fondo y envía un centro rasante: ${s} aparece en el segundo palo y empuja la pelota a la red.`,`Centro atrás de ${a} y ${s} saca una volea que se mete en el ángulo.`],
  filtrado:[`${a} filtra un pase entre los centrales, ${s} queda mano a mano con ${k} y define cruzado.`,`Pase en profundidad de ${a}; ${s} le gana la espalda a ${d}, amaga y la pica por encima de ${k}.`],
  area:[`Paredes en la puerta del área: ${a} toca para ${s}, que acomoda el cuerpo y la cruza abajo.`,`${a} combina con ${s} dentro del área y el remate a quemarropa no le da chances a ${k}.`],
  contra:[`Contraataque letal: ${a} recupera, lanza a ${s} en velocidad y este define ante la salida de ${k}.`,`Robo en mitad de cancha, ${a} abre a la carrera para ${s}, que deja atrás a ${d} y la manda a guardar.`],
  afuera:[`${s} recibe a 25 metros, se perfila y saca un remate seco que se clava en el ángulo de ${k}.`,`Rechazo corto de ${d} y ${s} le pega de primera desde afuera del área: golazo.`],
  individual:[`${s} encara, deja en el camino a ${d} con un enganche y define con un toque suave ante ${k}.`,`Jugada individual de ${s}, que arranca desde la mitad de cancha, gambetea a dos y la cruza.`],
  rebote:[`${k} ataja el primer remate pero no puede retenerla y ${s} aprovecha el rebote para empujarla.`,`Pelota que queda boyando en el área tras un rechazo de ${d}; ${s} es el más rápido y define.`],
  corner:[`Córner ejecutado por ${a}; ${s} anticipa a ${d} en el primer palo y la peina al gol.`,`Tiro de esquina de ${a} al corazón del área y ${s} cabecea con fuerza contra el piso: imposible para ${k}.`],
  tirolibre:[`Tiro libre al borde del área: ${s} le pega por encima de la barrera y la mete junto al palo de ${k}.`,`${s} se hace cargo del tiro libre y la clava en el ángulo; ${k} solo mira.`]};
 const x=P_(T[type]||T.area);return x}
function missText(type,s,d,k,onT){
 if(onT)return P_([`${s} remata con intención y ${k} vuela para sacarla al córner.`,`Mano a mano de ${s}, pero ${k} achica bien y tapa con el cuerpo.`,`${k} responde con una atajada enorme a mano cambiada ante el disparo de ${s}.`,`${s} saca un remate potente al primer palo y ${k} la desvía con lo justo.`]);
 if(type==='cabezazo'||type==='corner')return P_([`${s} cabecea solo en el área, pero la pelota se va apenas por arriba del travesaño.`,`${s} conecta de cabeza y la pelota se estrella en el palo.`]);
 if(type==='afuera'||type==='tirolibre')return P_([`${s} prueba desde lejos y el remate se va por encima del travesaño.`,`El disparo de ${s} desde afuera del área se va desviado por poco.`,`${s} le pega fuerte y la pelota da en el travesaño.`]);
 return P_([`${s} queda de frente al arco pero ${d} se cruza justo y bloquea el remate.`,`${s} define cruzado y la pelota pasa rozando el palo.`,`${s} le pega mordido y se va desviado.`,`${d} salva sobre la línea el remate de ${s}.`,`${s} entra al área y su remate pega en el palo.`])}
const YEL=[(n,v)=>`${n} llega tarde al cruce y se lleva puesto a ${v}.`,(n,v)=>`${n} corta un contraataque con una falta táctica sobre ${v}.`,(n,v)=>`${n} agarra de la camiseta a ${v}, que se escapaba.`,n=>`${n} protesta airadamente un fallo del árbitro.`,(n,v)=>`${n} mete la mano para frenar el avance de ${v}.`,n=>`${n} demora la reanudación y el árbitro pierde la paciencia.`,(n,v)=>`${n} va con la plancha sobre ${v} en mitad de cancha.`];
const RED=[(n,v)=>`${n} entra con los tapones de punta a la altura de la rodilla de ${v}.`,(n,v)=>`${n} derriba a ${v} cuando se iba solo al arco: era el último hombre.`,(n,v)=>`${n} lanza un codazo a ${v} en un salto y el árbitro no duda.`];
const FOULS=[(n,v)=>`${n} frena a ${v} con una falta en mitad de cancha.`,(n,v)=>`${n} empuja a ${v} en la disputa y el árbitro cobra falta.`,(n,v)=>`${n} le traba el pie a ${v} cerca del área.`];
const INJ=[['Sobrecarga muscular',1,1,4,'siente una molestia en el muslo tras un pique'],['Contractura en el gemelo',1,2,4,'se toma el gemelo después de un cambio de ritmo'],['Golpe en la rodilla',1,2,3,'choca rodilla con rodilla con {v} y queda tendido'],['Esguince de tobillo',2,3,3,'pisa mal al caer de un salto y se dobla el tobillo'],['Desgarro en el isquiotibial',3,5,2,'se frena en seco en plena carrera y se toma la parte posterior del muslo'],['Lesión de ligamentos de rodilla',6,10,1,'apoya mal en un giro y sale en camilla con gestos de dolor']];
const STYLE_TXT={Equilibrado:'equilibrado',Ofensivo:'ofensivo, con mucha gente en ataque',Defensivo:'defensivo, con un bloque bajo y las líneas juntas','Posesión':'de posesión, buscando tener la pelota','Contraataque':'de contraataque, esperando para salir rápido','Presión alta':'de presión alta, asfixiando la salida'};
window.mcStyleTxt=STYLE_TXT;
function goal(m,side,scorer,assist,kind,type,defN,gkN){
 const home=side==='o';if(home)m.h++;else m.a++;
 const sn=nm(m,scorer,side);ps(m,scorer.key,sn,scorer.p?scorer.p.pos:scorer.pos,scorer.g,side).gl++;
 let an=null;if(assist){an=nm(m,assist,side);ps(m,assist.key,an,assist.p?assist.p.pos:assist.pos,assist.g,side).a++}
 if(home){m.scorers.push(sn)}
 const club=clubOf(m,side),local=(m.venue==='a')!==home;
 const body=kind==='pen'?`${sn} cambia el penal por gol: ${P_(['remate fuerte a un costado','la pica suave al medio','abre el pie y la pone junto al palo'])}, sin chances para ${gkN}.`:goalText(type,sn,an||'un compañero',defN,gkN);
 ev(m,local?'⚽ GOL LOCAL':'⚽ GOL VISITANTE',`¡GOOOL de ${club}! ${body}${an&&!body.includes(an)?` (asistencia de ${an})`:''} ${scoreTxt(m)}.`,true,side);
 const GE=m.events[m.events.length-1];if(GE)GE.gol={autor:sn,asist:an||null,tipo:kind==='pen'?'pen':type};
}
function doSubRival(m,forced,outE){
 if(m.subsRiv>=5||!m.rivBench.length)return false;
 const cand=outE?[outE]:m.riv.filter(e=>e.g!=='POR');const out=pick(cand);
 const bi=m.rivBench.findIndex(b=>b.pos===out.pos);const ib=bi>=0?m.rivBench.splice(bi,1)[0]:m.rivBench.shift();
 const idx=m.riv.indexOf(out);if(idx<0)return false;ib.g=out.g;ib.role=out.role;m.riv[idx]=ib;m.subsRiv++;ps(m,ib.key,ib.name,ib.pos,ib.g,'r');
 ev(m,'🔁 CAMBIO',`${m.away}: sale ${out.name}, ingresa ${ib.name}.`,true,'r');return true}
function doSubOwn(m,outIdx,inP,why){
 const e=m.own[outIdx];if(!e||m.subsOwn>=5||!inP||mcUnavailable(inP))return false;const old=e.p;
 m.own[outIdx]={p:inP,g:e.g,key:'o'+inP.id,role:e.role};m.ownBench=m.ownBench.filter(x=>x!==inP);m.subsOwn++;
 m.ownPlayers=m.own.map(x=>x.p);ps(m,'o'+inP.id,inP.name,inP.pos,e.g,'o');
 ev(m,'🔁 CAMBIO',`${m.home}: sale ${old.name}, ingresa ${inP.name}${why?' ('+why+')':''}.`,true,'o');return true}
window.mcDoSubOwn=doSubOwn;
function bestBenchFor(m,g){return m.ownBench.filter(p=>!mcUnavailable(p)).sort((a,b)=>(b.rating-posPenalty(b.pos,g))-(a.rating-posPenalty(a.pos,g)))[0]}
function autoSubOwn(m,reason){
 if(m.subsOwn>=5)return;
 const cand=m.own.map((e,i)=>({e,i})).filter(o=>o.e.g!=='POR').sort((a,b)=>(a.e.p.fitness*.6+effRating(a.e.p,a.e.g)*.4)-(b.e.p.fitness*.6+effRating(b.e.p,b.e.g)*.4));
 for(const c of cand){const p=bestBenchFor(m,c.e.g);if(p&&(p.rating-posPenalty(p.pos,c.e.g))>=effRating(c.e.p,c.e.g)-6){doSubOwn(m,c.i,p,reason||'cambio táctico');return}}
}
function injure(m,side,pre){
 const L=side==='o'?m.own:m.riv;if(!L.length)return;
 const e=pre&&L.includes(pre)?pre:weightedPick(L,x=>x.g==='POR'?.25:1),i=L.indexOf(e),n=nm(m,e,side),club=clubOf(m,side);
 const opp=side==='o'?m.riv:m.own,vE=opp.length?pick(opp):null,vN=vE?nm(m,vE,side==='o'?'r':'o'):'un rival';
 const t=weightedPick(INJ,x=>x[3]),w=t[1]+Math.floor(R()*(t[2]-t[1]+1));
 const how=t[4].replace('{v}',vN);
 if(side==='o'){const pl=e.p;pl.injury=`${t[0]} · ${w} ${w===1?'semana':'semanas'}`;pl.injWeeks=w;(m.injNew=m.injNew||[]).push(pl.id);
  ev(m,'🩹 LESIÓN',`${n} ${how}. Diagnóstico: ${t[0].toLowerCase()}; estará ${w} ${w===1?'partido':'partidos'} afuera.`,true,'o');
  const sub=bestBenchFor(m,e.g);
  if(sub&&m.subsOwn<5)doSubOwn(m,i,sub,'lesión');
  else{L.splice(i,1);m.ownPlayers=m.own.map(x=>x.p);ev(m,'🩹 SIN CAMBIOS',`${club} ya no tiene cambios disponibles y queda con ${L.length} jugadores.`,true,'o')}}
 else{ev(m,'🩹 LESIÓN',`${n} (${club}) ${how}: no puede continuar.`,true,'r');if(!doSubRival(m,true,e)){L.splice(i,1);ev(m,'🩹 SIN CAMBIOS',`${club} queda con ${L.length} jugadores.`,true,'r')}}
}
/* ===== MOTOR DE PARTIDOS (js/motor/motor-v2.js y, para el partido del usuario, js/motor/conexion-v3.js) =====
   Cada minuto lo calcula MCMotor.minuto con estas funciones de relato y registro de este archivo. */
const OTRO=s=>s==='o'?'r':'o';
const API2={
 ev:(m,t,msg,key,side)=>ev(m,t,msg,key,side),
 club:(m,side)=>clubOf(m,side),
 tacO:()=>ownTac(),
 label:m=>label(m),
 injMult:()=>({Baja:.5,Normal:1,Alta:1.8}[$('injuries')?$('injuries').value:'Normal']||1),
 relato:(m,side,e)=>{const n=nm(m,e,side),cl=clubOf(m,side);ev(m,'JUEGO EN DESARROLLO',P_([`${n} maneja los tiempos de ${cl} en mitad de cancha.`,`${cl} hace circular la pelota con paciencia; ${n} busca el hueco entre líneas.`,`${n} recupera en campo propio y ${cl} intenta salir rápido.`,`${cl} adelanta líneas y empuja al rival contra su área.`]),false,side)},
 ps:(m,e,side)=>ps(m,e.key,nm(m,e,side),e.p?e.p.pos:e.pos,e.g,side),
 goal:(m,side,sc,as,kind,type,defN,gkN)=>goal(m,side,sc,as,kind,type==='error'?'area':type,defN,gkN),
 miss:(m,side,type,sh,defE,gkE,onT)=>{const o=OTRO(side);ev(m,onT?'ATAJADA':'OCASIÓN DE GOL',missText(type==='error'?'area':type,nm(m,sh,side),nm(m,defE,o),nm(m,gkE,o),onT),false,side);const E=m.events[m.events.length-1];if(E)E.j={tipo:type,tirador:nm(m,sh,side),def:nm(m,defE,o),arq:nm(m,gkE,o)}},
 foul:(m,v,side,vic)=>ev(m,'FALTA',P_(FOULS)(nm(m,v,side),vic),false,side),
 yellow:(m,v,side,why,vic)=>{const L=side==='o'?m.own:m.riv,n=nm(m,v,side),st=ps(m,v.key,n,v.p?v.p.pos:v.pos,v.g,side);st.y++;if(side==='o')m.yH++;else m.yA++;
  if(st.y>=2){st.rk='double';card(m,L,v,side,n,true,'doble amarilla',`${n} ya tenía amarilla y ve la segunda.`)}
  else ev(m,'🟨 TARJETA AMARILLA',why?`Amarilla para ${n} (${clubOf(m,side)}) ${why}.`:`${P_(YEL)(n,vic||'un rival')} Amarilla para ${n} (${clubOf(m,side)}).`,true,side)},
 red:(m,v,side,why,vic)=>{const L=side==='o'?m.own:m.riv,n=nm(m,v,side),st=ps(m,v.key,n,v.p?v.p.pos:v.pos,v.g,side);st.r=1;st.rk='direct';card(m,L,v,side,n,true,'roja directa',P_(RED)(n,vic||'un rival'))},
 injure:(m,side,e)=>injure(m,side,e),
 subR:m=>doSubRival(m),
 subO:m=>autoSubOwn(m)
};
window.mcMatchEv=ev;
function minuteStep(m){
 /* 12.7: el motor v1 ya no existe. Cada minuto lo calcula el v2 (y, si el partido es v3, la conexión del v3 le pasa la posta) */
 if(!m.v2)MCMotor.preparar(m,{});   // un partido sin contexto (no debería pasar) se juega igual, con el contexto por defecto
 return MCMotor.minuto(m,API2);
}
function card(m,L,v,side,n,red,why,txt){const o=side==='o';if(o){m.rH++;m.rO=(m.rO||0)+1}else{m.rA++;m.rR=(m.rR||0)+1}
 const st=ps(m,v.key,n,v.p?v.p.pos:v.pos,v.g,side);st.r=1;if(!st.rk)st.rk=why==='roja directa'?'direct':'double';const i=L.indexOf(v);if(i>=0)L.splice(i,1);
 if(o)m.ownPlayers=m.own.map(x=>x.p);
 ev(m,'🟥 EXPULSIÓN',`${txt?txt+' ':''}${n} (${clubOf(m,side)}) es expulsado (${why}) y ${clubOf(m,side)} queda con ${L.length}.`,true,side)}
/* ---- control de tiempo ---- */
function msPerMinute(){if(window.MCMsPorMinuto){const x=window.MCMsPorMinuto(match);if(x)return x}   /* motor v3: el ritmo lo marca el 2D con la cinta */
 const base={1:520,2:260,4:130}[matchSpeed]||520,len=$('matchLength')?$('matchLength').value:'normal';return base*({quick:.5,normal:1,long:1.6}[len]||1)}
function kickoffTxt(m){const t=m.tacR||{},A=m.venue==='a',L=A?m.away:m.home,V=A?m.home:m.away,TO=ownTac();
 return `Rueda el balón: ${L} (local) recibe a ${V}. GRL ${m.home} ${m.grlO??'-'} · ${m.away} ${m.grlR??'-'}. ${m.home} sale con un planteo ${(STYLE_TXT[TO.style]||TO.style).split(',')[0]} y ${m.away} con uno ${STYLE_TXT[t.style]||'equilibrado'}.`}
function startHalf(h){
 const m=match;if(!m||m.done)return;
 m.phase=h===1?'first':'second';m.clock={half:h,limit:h===1?45:90,base:h===1?0:45,x:0};
 m.extra[h]=h===1?1+Math.floor(R()*3):2+Math.floor(R()*4);
 ev(m,h===1?'⏱ COMIENZA EL PARTIDO':'⏱ COMIENZA EL 2º TIEMPO',h===1?kickoffTxt(m):`Se reanuda el juego. ${scoreTxt(m)}.`,true);
 matchPaused=false;renderMatch();run();
}
function run(){stopTimer();const m=match;if(!m)return;
 tmr=setInterval(()=>{if(match!==m){stopTimer();return}if(matchPaused)return;if(window.MC2D&&MC2D.retener(m))return;/* 12.6: espera a que termine la jugada animada */
  const end=minuteStep(m);renderMatch();if(end){stopTimer();endHalf(m)}},msPerMinute())}
function endHalf(m){
 if(m.clock.half===1){m.phase='ht';ev(m,'⏸ DESCANSO',`Final del primer tiempo: ${scoreTxt(m)}.`,true);renderMatch()}
 else{ev(m,'⏱ FINAL DEL PARTIDO',`Suena el pitazo final. ${scoreTxt(m)}.`,true);finishMatch()}
}
window.mcSimEnd=function(){
 if(!career||!match||match.done)return;if(window.MC2D)try{MC2D.saltar()}catch(e){}
 const m=match;stopTimer();matchPaused=false;m.autoSubs=true;
 if(m.phase==='pre'){m.phase='first';m.clock={half:1,limit:45,base:0,x:0};m.extra[1]=1+Math.floor(R()*3);ev(m,'⏱ COMIENZA EL PARTIDO',kickoffTxt(m),true)}
 if(m.phase==='first'){while(!minuteStep(m)){}ev(m,'⏸ DESCANSO',`Final del primer tiempo: ${scoreTxt(m)}.`,true);m.phase='ht'}
 if(m.phase==='ht'){m.phase='second';m.clock={half:2,limit:90,base:45,x:0};m.extra[2]=2+Math.floor(R()*4);ev(m,'⏱ COMIENZA EL 2º TIEMPO',`Se reanuda el juego. ${scoreTxt(m)}.`,true)}
 if(m.phase==='second'){while(!minuteStep(m)){}ev(m,'⏱ FINAL DEL PARTIDO',`Suena el pitazo final. ${scoreTxt(m)}.`,true)}
 finishMatch();
};
window.mcSpeed=function(n,el){
 matchSpeed=n;document.querySelectorAll('.x-spd button').forEach(b=>b.classList.toggle('on',+b.dataset.s===n));
 if(!match||match.done)return;
 if(match.phase==='pre')startHalf(1);else if(match.phase==='ht')startHalf(2);else if(tmr){run()}
};
window.setMatchSpeed=window.mcSpeed;
window.mcMainAction=function(){
 if(!match)return;const p=match.phase;
 if(match.done){nextFixture();return}
 if(p==='pre')startHalf(1);else if(p==='ht')startHalf(2);else if(matchPaused)toggleMatchPause();
};
window.toggleMatchPause=function(){
 if(!match||match.done||match.phase==='pre'||match.phase==='ht')return;
 matchPaused=!matchPaused;const b=$('pauseMatchBtn');if(b){b.querySelector('b').textContent=matchPaused?'REANUDAR':'PAUSAR';const i=b.querySelector('i');if(i){i.dataset.i=matchPaused?'play':'pause';if(window.ico)ico(b)}}
 renderMatch();
};
window.openMatch=function(){if(!career){go('newcareer');return}
 /* 6.3: si ya se jugaron todas las fechas, se muestra el cierre de temporada */
 if((!match||match.finished)&&window.mcSeasonOver&&mcSeasonOver()){match=null;go('league');if(window.mcSeasonEndModal)mcSeasonEndModal();return}
 if(!match||match.finished){if(createMatch()===false){go('league');return}}go('match');renderMatch()};
/* ---- cambios manuales ---- */
window.openMatchSubs=function(){
 if(!career||!match)return;const m=match;
 if(m.done){xToast('El partido terminó');return}
 const wasRun=!!tmr&&!matchPaused;if(wasRun){matchPaused=true}
 window._mcResume=()=>{if(wasRun){matchPaused=false}};
 const on=m.own.map((e,i)=>`<div class="statsrow"><span>${e.p.number}. ${e.p.name} · ${e.g} · ${effRating(e.p,e.g)} · ⚡${e.p.fitness}%</span><button class="btn small" onclick="mcPickSubIn(${i})" ${m.subsOwn>=5?'disabled':''}>SACAR</button></div>`).join('');
 openModal(`<div class="between"><h2>Cambios</h2><button class="btn small secondary" onclick="closeModal();_mcResume()">CERRAR</button></div><p>Elegí quién sale. Cambios: ${m.subsOwn}/5.</p>${on}`);
};
window.mcPickSubIn=function(i){
 const m=match,e=m.own[i],list=m.ownBench.filter(p=>!mcUnavailable(p));
 openModal(`<div class="between"><h2>Entra por ${e.p.name}</h2><button class="btn small secondary" onclick="openMatchSubs()">VOLVER</button></div>${list.map(p=>{const pen=posPenalty(p.pos,e.g);return `<div class="statsrow"><span>${p.number}. ${p.name} · ${p.pos} · ${p.rating}${pen?` <b style="color:#ffb347">⚠ −${pen} fuera de posición</b>`:''}</span><button class="btn small" onclick="mcConfirmSub(${i},${p.id})">INGRESAR</button></div>`}).join('')||'<p>No hay suplentes disponibles.</p>'}`);
};
window.mcConfirmSub=function(i,pid){const m=match,p=career.players.find(x=>x.id===pid);if(!p||!doSubOwn(m,i,p)){xToast('Cambio no permitido');return}closeModal();if(window._mcResume)_mcResume();renderMatch()};
/* ---- render ---- */
window.renderMatch=function(){
 if(!match||!career)return;const m=match,ph=m.phase,A=m.venue==='a';
 /* 6.3: el equipo local siempre a la izquierda (si jugás de visitante, tu club aparece a la derecha) */
 const LN=A?m.away:m.home,VN=A?m.home:m.away,LG=A?m.a:m.h,VG=A?m.h:m.a;
 $('homeCrest').innerHTML=clubBadge(LN,44);$('awayCrest').innerHTML=clubBadge(VN,44);
 $('homeTeam').textContent=LN;$('awayTeam').textContent=VN;$('score').textContent=`${LG} - ${VG}`;
 const running=ph==='first'||ph==='second';
 $('matchMinute').textContent=ph==='pre'?'PREVIA':ph==='ht'?'DESCANSO':ph==='done'?'90’ · FINAL':m.lbl+'’';
 $('matchClock').textContent=ph==='pre'?'00:00':ph==='ht'?'45:00':`${pad(Math.min(m.minute,99))}:00`;
 $('matchState').textContent=ph==='done'?'FINALIZADO':ph==='ht'?'DESCANSO':running?(matchPaused?'EN PAUSA':'EN JUEGO'):'EN VESTUARIOS';
 $('matchPhase').textContent=ph==='pre'?'PREPARADOS':ph==='first'?'PRIMER TIEMPO':ph==='ht'?'ENTRETIEMPO':ph==='second'?'SEGUNDO TIEMPO':'FINAL';
 const tot=window.mcTotalRounds?mcTotalRounds():0;
 $('matchComp').textContent=`${(career.country||'').toUpperCase()} · FECHA ${career.round+(m.done?0:1)}${tot?'/'+tot:''} · ${A?'VISITANTE':'LOCAL'}`;
 const btn=$('matchAction'),over=m.done&&window.mcSeasonOver&&mcSeasonOver();
 btn.textContent=ph==='pre'?'COMENZAR PARTIDO →':ph==='ht'?'CONTINUAR 2º TIEMPO →':ph==='done'?(over?'VER FINAL DE TEMPORADA →':'JUGAR SIGUIENTE FECHA →'):matchPaused?'▶ REANUDAR':'EN JUEGO · x'+matchSpeed;
 btn.disabled=running&&!matchPaused;btn.style.opacity=btn.disabled?.55:1;btn.onclick=mcMainAction;
 const sim=$('simEndBtn');if(sim){sim.disabled=ph==='done';sim.style.opacity=ph==='done'?.4:1}
 document.querySelectorAll('.x-spd button').forEach(b=>b.classList.toggle('on',+b.dataset.s===matchSpeed));
 const pO=Math.round(m.pos),pp=A?100-pO:pO,r=(a,b,l)=>`<div class="x-sr"><b>${a}</b><s>${l}</s><b>${b}</b></div>`,rr=(o,v,l)=>A?r(v,o,l):r(o,v,l);
 const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):'-',gO=avg(m.own.map(e=>effRating(e.p,e.g))),gR=avg(m.riv.map(e=>e.r));
 $('matchStats').innerHTML=`<div style="text-align:center;font-size:14px">Posesión</div><div class="x-pos"><span>${pp}%</span><div><i style="width:${pp}%"></i></div><span>${100-pp}%</span></div>`+rr(gO,gR,'GRL en cancha')+rr(m.shotsH,m.shotsA,'Remates')+rr(m.onH,m.onA,'Al arco')+rr(m.xgH.toFixed(2),m.xgA.toFixed(2),'xG')+rr(m.cornersH,m.cornersA,'Córners')+rr(m.foulsH,m.foulsA,'Faltas')+rr(m.offH,m.offA,'Offsides')+rr(m.yH,m.yA,'<span style="color:#ffe000">■</span> Amarillas')+rr(m.rH,m.rA,'<span style="color:#e5252d">■</span> Rojas');
 const evs=m.events.slice().reverse();const last=evs[0];
 $('commentTitle').textContent=last?last.title:'TODO LISTO';$('commentText').textContent=last?last.msg:'El equipo está preparado. Es momento de salir a la cancha.';
 $('matchEvents').innerHTML=evs.slice(0,80).map(e=>`<div class="x-ev${e.key?' k':''}"><b>${e.lbl}'</b><div><em>${e.title}</em><span>${e.msg}</span></div></div>`).join('')||'<div class="x-ev"><b>00\'</b><div><em>A la espera del inicio.</em><span>Tocá X1, X2 o SIMULAR HASTA EL FINAL.</span></div></div>';
 const hc=positions(career.formation||'4-3-3'),ac=positions('4-3-3');let h='<span class="bx l"></span><span class="bx r"></span>';
 const LX=c=>(100-c[1])*.46+3,RX=c=>c[1]*.46+51;
 hc.forEach((c,i)=>{const e=m.own[i];if(e)h+=`<span class="x-dot" style="left:${A?RX(c):LX(c)}%;top:${c[0]}%">${e.p.number}</span>`});
 ac.forEach((c,i)=>{if(m.riv[i])h+=`<span class="x-dot a" style="left:${A?LX(c):RX(c)}%;top:${c[0]}%">${i+1}</span>`});
 h+=`<span class="x-ball" style="left:${A?70-m.pos*.4:30+m.pos*.4}%;top:${46+(m.tick%3)*4}%">${BALL}</span>`;$('xMPitch').innerHTML=h;
};
/* ---- final del partido ---- */
function rateAll(m,res){
 const out={o:[],r:[]};
 Object.values(m.pst).forEach(s=>{if(!s.on&&!(s.side==='o'&&m.own.some(e=>e.key===s.key)))return;
  let n=6.1+s.gl*1.05+s.a*.65-s.y*.25-s.r*1.4+(s.pos==='POR'?s.sv*.14:0);
  const mine=s.side==='o'?(m.h-m.a):(m.a-m.h);n+=clamp(mine*.18,-.6,.6);
  if(s.pos==='POR'||s.pos==='DEF'){const conc=s.side==='o'?m.a:m.h;n+=conc===0?.45:-Math.min(.5,conc*.12)}
  n+=((hash(s.name)%90)/100-.45)*.6;s.rating=clamp(Math.round(n*10)/10,3.5,10);out[s.side].push(s)});
 out.o.sort((a,b)=>b.rating-a.rating);out.r.sort((a,b)=>b.rating-a.rating);return out}
window.finishMatch=function(){
 const m=match;if(!m||m.done)return;stopTimer();m.done=true;m.finished=true;m.phase='done';
 const res=m.h>m.a?'W':m.h===m.a?'D':'L';
 /* 6.3: el resultado se carga en el calendario y la tabla se recalcula con todos los partidos de la fecha */
 const rec=window.mcLeagueRecord?mcLeagueRecord(m):false;
 if(!rec){career.played++;career.round++;career.gf+=m.h;career.ga+=m.a;career.w+=res==='W';career.d+=res==='D';career.l+=res==='L';career.points+=res==='W'?3:res==='D'?1:0}
 career.history.push({result:res,h:m.h,a:m.a,opp:m.away,venue:m.venue||'h',season:career.season,round:career.round,shots:[m.shotsH,m.shotsA],pos:Math.round(m.pos)});
 career.budget+=res==='W'?2:res==='D'?1:0;career.board=Math.max(5,Math.min(99,career.board+(res==='W'?4:res==='D'?1:-5)));
 const rat=rateAll(m,res);m.ratings=rat;
 /* sanciones y lesiones: el partido cuenta como cumplido solo para quienes ya estaban afuera al empezar */
 const susp=new Set(m.suspIds||[]),inj=new Set(m.injIds||[]);
 career.players.forEach(p=>{
  if(susp.has(p.id)&&p.suspended>0){p.suspended--;if(!p.suspended)career.inbox.unshift(p.name+' cumplió su sanción y vuelve a estar disponible.')}
  if(inj.has(p.id)&&p.injury){p.injWeeks=(p.injWeeks||1)-1;if(p.injWeeks<=0){p.injury=null;p.injWeeks=0;p.fitness=Math.min(75,p.fitness);career.inbox.unshift(p.name+' se recuperó de su lesión y vuelve a estar disponible.')}}});
 const fat=Math.max(0,((m.fxO&&m.fxO.fat)||0));
 career.players.forEach(p=>{const s=m.pst['o'+p.id];const played=!!(s&&(s.on||m.own.some(e=>e.p===p)));
  if(played){p.apps++;p.goals+=s.gl;p.assists+=s.a;const mins=s.on||0;p.fitness=Math.max(42,p.fitness-Math.round((4+mins/90*9)*(1+.4*fat))-Math.floor(R()*4));
   if(s.y&&!s.r){p.yc=(p.yc||0)+s.y;if(p.yc>=4){p.suspended=Math.max(p.suspended||0,1);p.yc=0;career.inbox.unshift(p.name+' llegó a 4 amarillas y se pierde el próximo partido.')}}
   if(s.r){const n=s.rk==='direct'?2:1;p.suspended=Math.max(p.suspended||0,n);career.inbox.unshift(`${p.name} fue expulsado (${s.rk==='direct'?'roja directa':'doble amarilla'}) y se pierde ${n===1?'el próximo partido':'los próximos '+n+' partidos'}.`)}
   if(!p.injury&&p.fitness<55&&R()<.018){p.injury='Lesión muscular · 2 semanas';p.injWeeks=2;career.inbox.unshift(p.name+' sufrió una lesión muscular.')}}
  else p.fitness=Math.min(100,p.fitness+3);
  p.morale=Math.max(35,Math.min(99,p.morale+(res==='W'?4:res==='L'?-5:1)))});
 (m.injNew||[]).forEach(id=>{const p=career.players.find(x=>x.id===id);if(p&&p.injury)career.inbox.unshift(`${p.name}: ${p.injury}. Estará ${p.injWeeks} ${p.injWeeks===1?'partido':'partidos'} afuera.`)});
 /* un lesionado o suspendido no puede seguir figurando como titular */
 const out=career.players.slice(0,11).filter(p=>mcUnavailable(p)).map(p=>p.name);
 mcReplaceUnavailable();
 career.lastResult=scoreTxt(m);
 const baja=career.players.filter(p=>mcUnavailable(p)).map(p=>`${p.name} (${p.injury?p.injury.split(' · ')[0].toLowerCase():'suspendido'})`);
 /* 12.7: resumen con identificador y minuto real (antes repetía "FINAL" con minuto 90 fijo) */
 const EVX=o=>{m.evSeq=(m.evSeq||0)+1;const L=m.events[m.events.length-1],mn=Math.max(m.clock.base+m.clock.x,L&&L.min||0);m.events.push(Object.assign({id:m.evSeq,lbl:L&&L.min>m.clock.base+m.clock.x?L.lbl:label(m),min:mn},o))};
 EVX({title:'📊 RESUMEN DEL PARTIDO',msg:`${scoreTxt(m)}. ${res==='W'?'Gran victoria.':res==='D'?'Reparto de puntos.':'Derrota. A trabajar.'}`,key:true});
 if(baja.length)EVX({title:'📋 BAJAS PARA LA PRÓXIMA FECHA',msg:`No disponibles: ${baja.join(', ')}.${out.length?' Salieron del once titular: '+out.join(', ')+'.':''}`,key:true});
 const row=s=>`<div class="statsrow"><span>${s.name} <span class="muted">${s.pos}${s.gl?' · '+'⚽'.repeat(s.gl):''}${s.a?' · 🅰'+s.a:''}${s.y?' · 🟨':''}${s.r?' · 🟥':''}</span></span><b>${s.rating.toFixed(1)}</b></div>`;
 $('ratingsList').innerHTML=`<div class="tiny gold" style="margin:4px 0">${m.home.toUpperCase()}</div>`+rat.o.map(row).join('')+`<div class="tiny gold" style="margin:10px 0 4px">${m.away.toUpperCase()}</div>`+rat.r.slice(0,8).map(row).join('');
 save();renderMatch();try{renderHome();renderDashboard()}catch(e){}
 const mt=document.getElementById('matchStats');if(mt)mt.scrollIntoView({block:'nearest'});
};
window.nextFixture=function(){
 stopTimer();match=null;
 /* 6.3: la recuperación de lesiones se descuenta al terminar cada partido (ver finishMatch) */
 career.players.forEach(p=>{p.fitness=Math.min(100,p.fitness+12)});
 save();openMatch();
};
})();

