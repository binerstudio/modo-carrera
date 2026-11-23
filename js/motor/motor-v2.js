/* ===== MODO CARRERA · MOTOR DE PARTIDOS v2 =====
   Simulación minuto a minuto. Las reglas son fijas (deterministas); el azar está controlado y sale
   de un único generador (Math.random, o el que se pase en las pruebas).
   El MISMO código se usa en:
     · el partido en vivo (js/core/07-mc7-match.js llama a MCMotor.minuto cuando match.v2)
     · la simulación masiva de pruebas (MCMotor.simular, sin interfaz)
   Factores: atributos de cada jugador (estimados o verificados), GRL, adaptación al puesto,
   formación y tácticas (mismo sistema y topes que v1), estado físico previo, fatiga individual
   durante el partido, moral, química, entrenador, localía, clima, césped, importancia del
   partido y árbitro (severidad y precisión, con VAR).
   Eventos: posesión, ataques, contraataques, centros, remates, atajadas, rebotes, córners,
   tiros libres, penales, fuera de juego, VAR, tarjetas, lesiones, sustituciones, errores
   individuales y errores arbitrales. */
(function(root){
'use strict';
const VERSION='2.0.0';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let R=Math.random;
const pick=a=>a[Math.floor(R()*a.length)];
function wpick(L,wf){const w=L.map(wf);let t=0;for(const x of w)t+=x;if(t<=0)return L[0];let r=R()*t;for(let i=0;i<L.length;i++){r-=w[i];if(r<=0)return L[i]}return L[L.length-1]}
const A=()=>root.MCAtributos;

/* ---------- tácticas: copia exacta del sistema v1 (mismos topes) ---------- */
const STYLE_FX={Equilibrado:{cr:0,ex:0,cv:0,ocv:0,pos:0,foul:0,fat:0},Ofensivo:{cr:.16,ex:.10,cv:0,ocv:.02,pos:2,foul:0,fat:.1},Defensivo:{cr:-.30,ex:-.26,cv:0,ocv:-.05,pos:-6,foul:.1,fat:0},'Posesión':{cr:.04,ex:-.12,cv:.02,ocv:0,pos:8,foul:-.1,fat:0},Contraataque:{cr:-.10,ex:-.06,cv:.05,ocv:-.01,pos:-6,foul:0,fat:.1},'Presión alta':{cr:.12,ex:.05,cv:0,ocv:.01,pos:3,foul:.3,fat:.5}};
function tacFx(t,opp){
 const M=(t.mentality-50)/50,W=(t.width-50)/50,D=(t.depth-50)/50,P=(t.pressing-50)/50,Q=(t.rhythm-50)/50;
 const S=STYLE_FX[t.style]||STYLE_FX.Equilibrado,f=String(t.formation||'4-3-3').split('-').map(Number),nD=f[0],nF=f[f.length-1],nM=10-nD-nF;
 const oM=opp?(opp.mentality-50)/50:0,oD=opp?(opp.depth-50)/50:0;
 let cr=S.cr+M*.22+W*.05+D*.07+P*.10+Q*.12+(nF-2)*.07+(nM-4)*.02;
 let ex=S.ex+M*.15+W*.03+D*.04-P*.03+Q*.10-(nD-4)*.10;
 let cv=S.cv,ocv=S.ocv+(M<0?M*.06:M*.02)+D*.04+(W<0?W*.02:0);
 if(t.style==='Contraataque'){cr+=Math.max(0,oM)*.25+Math.max(0,oD)*.18;cv+=Math.max(0,oD)*.03}
 return{cr,ex,cv,ocv:Math.max(-.11,ocv),pos:S.pos+P*3+D*2-Q*2+(nM-3)*2+M*2,foul:Math.max(.5,1+S.foul+P*.35),fat:Math.max(-.4,S.fat+P*.5+Q*.4),corner:Math.max(.5,1+W*.45+M*.15),offOpp:Math.max(.4,1+D*.8),W,P,Q}}
const TAC_BASE={style:'Equilibrado',mentality:50,width:50,depth:50,pressing:50,rhythm:50,formation:'4-3-3'};

/* ---------- contexto del partido ---------- */
const CLIMAS=[['Despejado',52,{}],['Nublado',22,{}],['Lluvia',14,{pase:-1.2,remate:-.02,error:1.35,fatiga:1.05,pesado:1}],['Calor',8,{fatiga:1.3,ritmo:-.06}],['Viento',4,{remate:-.025,lejos:-.04}]];
const CESPED=[['Perfecto',30,{}],['Bueno',55,{}],['Irregular',15,{pase:-1,error:1.2}]];
function wsel(L){let t=0;for(const x of L)t+=x[1];let r=R()*t;for(const x of L){r-=x[1];if(r<=0)return x}return L[0]}
function preparar(m,ctx){
 ctx=ctx||{};
 const cl=ctx.clima?CLIMAS.find(x=>x[0]===ctx.clima)||CLIMAS[0]:wsel(CLIMAS);
 let ce=ctx.cesped?CESPED.find(x=>x[0]===ctx.cesped)||CESPED[1]:wsel(CESPED);
 if(cl[2].pesado&&ce[0]!=='Irregular'&&R()<.4)ce=CESPED[2];
 const imp=ctx.importancia!=null?ctx.importancia:1;
 m.v2={version:VERSION,clima:cl[0],cesped:ce[0],fx:Object.assign({pase:0,remate:0,error:1,fatiga:1,ritmo:0,lejos:0},cl[2],{pase:(cl[2].pase||0)+(ce[2].pase||0),error:(cl[2].error||1)*(ce[2].error||1)}),
  importancia:imp,arbitro:ctx.arbitro||{severidad:+(0.8+R()*0.45).toFixed(2),precision:+(0.86+R()*0.11).toFixed(3)},
  quimica:{o:ctx.quimicaO!=null?ctx.quimicaO:.7,r:ctx.quimicaR!=null?ctx.quimicaR:.7},
  dt:{o:ctx.dtO!=null?ctx.dtO:70,r:ctx.dtR!=null?ctx.dtR:70},
  var:{revisiones:0,anulados:0,penales:0},errores:{o:0,r:0},arbitrales:0,rebotes:0};
 return m.v2;
}

/* ---------- jugadores ---------- */
/* devuelve datos normalizados de una entrada (en vivo: e.p es el jugador de la carrera) */
function info(e){
 if(e.p){const p=e.p,g=(root.effRating&&e.g)?root.effRating(p,e.g):(+p.rating||+p.grl||60);
  return{name:p.name,pos:p.pos,grl:+p.rating||+p.grl||g,ef:g,age:p.age,fit:p.fitness==null?90:p.fitness,mor:p.morale==null?70:p.morale,atributos:p.atributos}}
 return{name:e.name,pos:e.pos,grl:+e.r||60,ef:+e.r||60,age:e.age,fit:e.fit==null?92:e.fit,mor:e.mor==null?70:e.mor,atributos:e.atributos}}
function at(e){if(!e._at){const i=info(e);e._at=A().de(i);e._inf=i}return e._at}
/* energía 0..1: estado físico previo menos el desgaste del partido */
function energia(e){const i=e._inf||(at(e),e._inf);return clamp(i.fit/100-(e._fat||0),.2,1)}
function cond(e){return .86+.14*energia(e)}
function moral(e){const i=e._inf||(at(e),e._inf);return 1+(clamp(i.mor,30,99)-70)*.0007}
/* valor del jugador en la línea en que juega (castiga jugar fuera de puesto, con un tope) */
const LINEA={POR:'arquero',DEF:'defensa',MED:'medio',DEL:'ataque'};
function valor(e,linea){const a=at(e),i=e._inf;let v=a.c[linea||LINEA[e.g]||'medio'];
 /* ajuste por el GRL efectivo de v1 (incluye penalización de puesto de la carrera) */
 v+=(i.ef-i.grl);
 return Math.max(v,i.grl-18)}
function fuerzas(m,side){
 const L=side==='o'?m.own:m.riv,V=m.v2,sideKey=side==='o'?'o':'r';
 const extra=(V.dt[sideKey]-70)*.04+(V.quimica[sideKey]-.5)*2.4;
 const lin=(g,k)=>{const a=L.filter(e=>e.g===g);if(!a.length)return null;let s=0;for(const e of a)s+=valor(e,k)*cond(e)*moral(e);return s/a.length+extra};
 const mid=lin('MED','medio'),att=lin('DEL','ataque'),def=lin('DEF','defensa'),gk=lin('POR','arquero');
 let s=0;for(const e of L)s+=valor(e)*cond(e)*moral(e);const grl=L.length?s/L.length+extra:45;
 return{att:att??((mid??60)-6),mid:(mid??60)+V.fx.pase,def:def??60,gk:gk??45,grl,n:L.length}}

/* ---------- fatiga individual por minuto ---------- */
function fatigar(m){const V=m.v2;
 for(const side of ['o','r']){const F=side==='o'?m.fxO:m.fxR,L=side==='o'?m.own:m.riv;
  const ritmo=1+.5*Math.max(0,F.P||0)+.3*Math.max(0,F.Q||0);
  for(const e of L){const a=at(e).v,res=e.g==='POR'?80:a.resistencia;
   e._fat=(e._fat||0)+.0021*ritmo*V.fx.fatiga*(1.55-res/100)*(e.g==='POR'?.35:1)}}}

/* ---------- eventos ---------- */
const nm=e=>e.p?e.p.name:e.name;
const roleOf=e=>e.role||({POR:'POR',DEF:'DFC',MED:'MC',DEL:'DC'}[e.g]||'MC');
const WIDE=/^(EI|ED|MI|MD|LI|LD)$/;
const SHW={DC:1,EI:.78,ED:.78,MI:.5,MD:.5,MC:.42,MCD:.2,LI:.13,LD:.13,DFC:.11,POR:0};
const HEADW={DC:1,DFC:.75,EI:.3,ED:.3,MC:.3,MI:.2,MD:.2,MCD:.35,LI:.15,LD:.15,POR:0};
const ASW={MC:.9,MCD:.45,MI:.85,MD:.85,EI:.75,ED:.75,DC:.45,LI:.5,LD:.5,DFC:.12,POR:.03};
const q=v=>Math.pow(Math.max(5,v-40)/40,1.5);
function tirador(m,side,mine,kind,F){const L=mine.filter(e=>e.g!=='POR');if(!L.length)return mine[0];const W=(F&&F.W)||0;
 return wpick(L,e=>{const ro=roleOf(e),st=m.pst[e.key],a=at(e).v,s=kind==='corner'?(a.cabeceo+a.salto)/2:(a.definicion+a.tiro+a.posicionamiento)/3;
  return((kind==='corner'?HEADW:SHW)[ro]??.3)*q(s)*(WIDE.test(ro)?1+.35*W:1)/(1+.4*(st?st.gl:0))*energia(e)})}
function asistente(m,side,mine,sh,F,setPiece){const L=mine.filter(e=>e!==sh&&(setPiece?e.g!=='POR':true));if(!L.length)return null;const W=(F&&F.W)||0;
 return wpick(L,e=>{const ro=roleOf(e),st=m.pst[e.key],a=at(e).v,s=WIDE.test(ro)?(a.centros+a.paseCorto)/2:(a.paseCorto+a.vision)/2;
  return(ASW[ro]??.4)*(setPiece&&/^(DFC|POR)$/.test(ro)?.1:1)*q(s)*(WIDE.test(ro)?1+.35*W:1)/(1+.3*(st?st.a:0))})}
function defensor(theirs,gkE){const dl=theirs.filter(e=>e.g!=='POR');return dl.length?wpick(dl,e=>e.g==='DEF'?3:e.g==='MED'?1.5:.5):gkE}
/* calidad del remate según el tipo de jugada */
function remate(sh,type){const a=at(sh).v;
 if(type==='cabezazo'||type==='corner')return(a.cabeceo*.55+a.salto*.25+a.posicionamiento*.2);
 if(type==='afuera'||type==='tirolibre')return(a.tiro*.5+a.potencia*.35+a.equilibrio*.15);
 if(type==='individual')return(a.regate*.4+a.definicion*.4+a.agilidad*.2);
 if(type==='pen')return(a.definicion*.5+a.tiro*.3+a.reacciones*.2);
 return(a.definicion*.6+a.reacciones*.15+a.control*.15+a.potencia*.1)}
function atajada(gk){const a=at(gk);return a.c.arquero*cond(gk)}
function marca(d){const a=at(d).v;return(a.marcaje*.4+a.entradas*.3+a.posicionamiento*.3)*cond(d)}

/* VAR sobre un gol: puede anularlo (fuera de juego milimétrico, falta previa o mano) */
function revisaGol(m,side,API,type){const V=m.v2;
 const p=type==='corner'?.05:type==='contra'||type==='filtrado'?.055:.035;
 if(R()<p){V.var.revisiones++;V.var.anulados++;
  const why=pick(type==='corner'?['falta en el área','mano en la jugada']:['posición adelantada milimétrica','falta en el inicio de la jugada','mano antes de definir']);
  API.ev(m,'📺 VAR · GOL ANULADO',`El VAR revisa la jugada y anula el gol de ${API.club(m,side)}: ${why}.`,true,side);return false}
 if(R()<.12){V.var.revisiones++;API.ev(m,'📺 VAR',`Revisión del VAR... el gol es válido.`,false,side)}
 return true}

function ataque(m,side,API,kind){
 const V=m.v2,home=side==='o',mine=home?m.own:m.riv,theirs=home?m.riv:m.own,other=home?'r':'o';
 if(!mine.length||!theirs.length)return;
 const gkE=theirs.find(e=>e.g==='POR')||theirs[0],club=API.club(m,side);
 const F=(home?m.fxO:m.fxR)||{},FD=(home?m.fxR:m.fxO)||{};
 const SA=fuerzas(m,side),SD=fuerzas(m,other),d=SA.grl-SD.grl,defE=defensor(theirs,gkE);
 /* penal: el desborde del atacante contra la marca del defensor */
 if(kind!=='corner'&&kind!=='error'&&kind!=='rebote'){
  const vic=tirador(m,side,mine,'play',F),va=at(vic).v,dm=marca(defE);
  const pp=clamp(.016*(1+(((va.regate+va.agilidad)/2)-dm)*.012)*(1+(V.importancia-1)*.3),.006,.032);
  if(R()<pp){
   if(R()>V.arbitro.precision*1.02){ /* el árbitro no lo ve */
    if(R()<.55){V.var.revisiones++;V.var.penales++;API.ev(m,'📺 VAR',`El VAR llama al árbitro: revisa en el monitor la caída de ${nm(vic)} y cobra penal para ${club}.`,true,side)}
    else{V.arbitrales++;API.ev(m,'⚠ ERROR ARBITRAL',`¡Era penal! ${nm(defE)} derriba a ${nm(vic)} en el área, pero el árbitro sigue y el VAR no interviene.`,true,side);return}}
   return penal(m,side,API,vic,defE,gkE)}}
 const sh=kind==='error'||kind==='rebote'?tirador(m,side,mine,'play',F):tirador(m,side,mine,kind,F),sn=nm(sh);
 let as=null,type;
 if(kind==='corner'){as=asistente(m,side,mine,sh,F,true);type='corner'}
 else if(kind==='error'){type='error';as=R()<.4?asistente(m,side,mine,sh,F):null}
 else if(kind==='rebote'){type='rebote'}
 else{const r=R();
  if(r<.06)type='tirolibre';
  else if(r<.74){as=asistente(m,side,mine,sh,F);const ar=roleOf(as||{}),sr=roleOf(sh);
   const ct=((home?API.tacO(m):m.tacR).style==='Contraataque')?.32:.12;
   if(R()<ct)type='contra';else if(WIDE.test(ar))type=(/^(DC|DFC)$/.test(sr)||R()<.35)?'cabezazo':'centro';else type=R()<.45?'filtrado':'area'}
  else type=pick(['afuera','afuera','individual','individual','rebote'])}
 if(home)m.shotsH++;else m.shotsA++;
 const tOn={filtrado:.15,contra:.1,area:.05,cabezazo:-.06,corner:-.08,afuera:-.12,tirolibre:-.1,individual:0,rebote:.12,centro:0,error:.18}[type]||0;
 const tCv={filtrado:.12,contra:.08,area:.03,cabezazo:-.02,corner:-.03,afuera:-.09,tirolibre:-.06,individual:0,rebote:.1,centro:.02,error:.16}[type]||0;
 const rq=remate(sh,type)*cond(sh),dq=marca(defE),gq=atajada(gkE);
 const lejos=(type==='afuera'||type==='tirolibre')?V.fx.lejos:0;
 const pOn=clamp(.36+d*.002+tOn+(rq-SA.grl)*.003-(dq-SD.grl)*.0015+V.fx.remate+lejos,.2,.75);
 const gp=clamp(.215+(rq-gq)*.0022+d*.003+clamp((F.cv||0)+(FD.ocv||0),-.06,.06)+tCv,.05,.55);
 if(home)m.xgH+=pOn*gp;else m.xgA+=pOn*gp;
 if(R()>pOn){API.miss(m,side,type,sh,defE,gkE,false);return}
 if(home)m.onH++;else m.onA++;
 if(R()<gp){if(revisaGol(m,side,API,type))API.goal(m,side,sh,type==='afuera'||type==='individual'||type==='rebote'||type==='tirolibre'?null:as,'play',type,nm(defE),nm(gkE));return}
 if(home)m.savesA++;else m.savesH++;API.ps(m,gkE,other).sv++;API.miss(m,side,type,sh,defE,gkE,true);
 /* rebote: la pelota queda viva tras la atajada */
 if(kind!=='rebote'){const ga=at(gkE).v,pr=clamp(.13+(at(sh).v.reacciones-ga.manejo)*.003,.05,.25);if(R()<pr){V.rebotes++;ataque(m,side,API,'rebote')}}
}
function penal(m,side,API,vic,defE,gkE){const V=m.v2,home=side==='o',mine=home?m.own:m.riv,other=home?'r':'o';V.penalesTotal=(V.penalesTotal||0)+1;
 const tk=mine.filter(e=>e.g!=='POR');const sh=R()<.7?tk.slice().sort((a,b)=>remate(b,'pen')-remate(a,'pen'))[0]:wpick(tk,e=>q(remate(e,'pen')));
 if(home){m.shotsH++;m.onH++}else{m.shotsA++;m.onA++}
 API.ev(m,'⚠ PENAL',`${nm(defE)} derriba a ${nm(vic)} dentro del área: penal para ${API.club(m,side)}. ${nm(sh)} toma la pelota.`,true,side);
 if(R()<.3*V.arbitro.severidad)API.yellow(m,defE,other,'por el penal cometido');
 const gp=clamp(.76+(remate(sh,'pen')-atajada(gkE))*.004,.6,.9);
 if(home)m.xgH+=.76;else m.xgA+=.76;
 if(R()<gp)API.goal(m,side,sh,null,'pen','pen',nm(defE),nm(gkE));
 else{const sv=R()<.6;if(sv){if(home)m.savesA++;else m.savesH++;API.ps(m,gkE,other).sv++}
  API.ev(m,'PENAL FALLADO',sv?`${nm(gkE)} adivina la intención de ${nm(sh)} y ataja el penal.`:`${nm(sh)} le pega muy fuerte y la pelota ${pick(['se va por arriba del travesaño','pega en el palo y sale'])}.`,true,side)}}

/* ---------- un minuto de juego ---------- */
function minuto(m,API){
 const c=m.clock;if(c.base<c.limit){c.base++;c.x=0}else c.x++;
 m.minute=c.base+c.x;m.moments++;m.tick++;if(API.label)m.lbl=API.label(m);
 const V=m.v2,TO=API.tacO(m),TR=m.tacR||TAC_BASE;
 m.fxO=tacFx(TO,TR);m.fxR=tacFx(TR,TO);
 fatigar(m);
 const SO=fuerzas(m,'o'),SR=fuerzas(m,'r'),FO=m.fxO,FR=m.fxR,hb=m.venue==='a'?-1:m.venue==='n'?0:1,d=SO.grl-SR.grl;
 const tgt=clamp(50+(SO.mid-SR.mid)*.35+d*.25+FO.pos-FR.pos+hb*1.5+(SO.n-SR.n)*4,26,76);m.pos=clamp(m.pos+(tgt-m.pos)*.12+(R()*5-2.5),24,76);
 const pO=m.pos/100,manO=11-SO.n,manR=11-SR.n;
 const tcap=t=>0.22*Math.tanh(t/0.22),lead=m.h-m.a,ease=L=>L>=2?Math.exp(-0.38*(L-1)):1;
 const tension=1-(V.importancia-1)*.12,amb=(1+V.fx.ritmo)*tension;
 const aO=clamp(.106*amb*Math.exp(d*0.03+(SO.att-SR.def)*.005+(m.pos-50)*.004+tcap(FO.cr+FR.ex)+hb*.1-manO*.3+manR*.2)*ease(lead),.02,.22);
 const aR=clamp(.106*amb*Math.exp(-d*0.03+(SR.att-SO.def)*.005-(m.pos-50)*.004+tcap(FR.cr+FO.ex)-hb*.1-manR*.3+manO*.2)*ease(-lead),.02,.22);
 if(R()<aO)ataque(m,'o',API);
 if(R()<aR)ataque(m,'r',API);
 /* error individual (defensor o arquero), más probable con cansancio, lluvia y césped malo */
 for(const side of ['o','r']){const L=side==='o'?m.own:m.riv;if(!L.length)continue;
  let fa=0,re=0;for(const e of L){fa+=1-energia(e);re+=at(e).v.reacciones}fa/=L.length;re/=L.length;
  const pe=.0011*V.fx.error*(1+fa*2.2)*(1+(70-re)*.012);
  if(R()<pe){const back=L.filter(e=>e.g==='DEF'||e.g==='POR');if(!back.length)continue;
   const who=wpick(back,e=>(1.2-energia(e))*(110-at(e).v.reacciones)),opp=side==='o'?'r':'o';V.errores[side]++;
   API.ev(m,'❗ ERROR INDIVIDUAL',`${nm(who)} (${API.club(m,side)}) ${pick(['falla en el control','entrega mal en salida','calcula mal el rebote','se resbala'])} y le deja la pelota servida a ${API.club(m,opp)}.`,true,opp);
   ataque(m,opp,API,'error')}}
 /* córners */
 if(R()<.1*(FO.corner+FR.corner)/2){const wo=pO*FO.corner,o=R()<wo/(wo+(1-pO)*FR.corner),side=o?'o':'r';if(o)m.cornersH++;else m.cornersA++;
  if(R()<.32)ataque(m,side,API,'corner');else if(R()<.35){const dl=(o?m.riv:m.own).filter(e=>e.g==='DEF');API.ev(m,'TIRO DE ESQUINA',`Córner para ${API.club(m,side)}; ${dl.length?nm(pick(dl)):'la defensa'} despeja de cabeza.`,false,side)}}
 /* fuera de juego: línea alta del rival y anticipación de los delanteros; el árbitro puede equivocarse */
 if(R()<.03){const o=R()<FR.offOpp/(FR.offOpp+FO.offOpp),side=o?'o':'r';if(o)m.offH++;else m.offA++;
  const L=(o?m.own:m.riv).filter(e=>e.g==='DEL');
  if(L.length){const who=pick(L);
   if(R()<(1-V.arbitro.precision)*.6){V.arbitrales++;API.ev(m,'⚠ ERROR ARBITRAL',`Bandera de offside a ${nm(who)}... la repetición muestra que estaba habilitado: se le escapa una ocasión clara a ${API.club(m,side)}.`,true,side)}
   else if(R()<.25)API.ev(m,'OFFSIDE',`${nm(who)} picó al vacío pero el asistente levanta la bandera: posición adelantada.`,false,side)}}
 /* faltas y tarjetas: presión, importancia, severidad del árbitro y técnica de quita */
 const fk=V.importancia*V.arbitro.severidad;
 if(R()<.22*(FO.foul+FR.foul)/2*(.85+.15*V.importancia)){const wo=FO.foul*(1-pO+.2),o=R()<wo/(wo+FR.foul*(pO+.2)),L=o?m.own:m.riv,side=o?'o':'r',os=o?'r':'o';const cand=L.filter(e=>e.g!=='POR');
  if(cand.length){const v=wpick(cand,e=>(e.g==='DEF'?3:e.g==='MED'?2.5:1.2)*(1.4-at(e).v.entradas/140)*(1.3-energia(e)*.3));
   if(o)m.foulsH++;else m.foulsA++;
   const OL=o?m.riv:m.own,vic=OL.length?nm(wpick(OL,e=>e.g==='DEL'?3:e.g==='MED'?2:1)):'un rival';
   const cr=R();
   if(cr<.0015*fk)API.red(m,v,side,'roja directa',vic);
   else if(cr<.135*fk)API.yellow(m,v,side,null,vic);
   else if(R()<.3)API.foul(m,v,side,vic);
   /* tiro libre directo cerca del área */
   if(R()<.03)ataque(m,os,API,'tirolibre')}}
 /* lesión: más riesgo con cansancio, césped irregular y calor */
 let rk=0;const all=m.own.concat(m.riv);for(const e of all)rk+=1.6-energia(e);rk/=Math.max(1,all.length);
 if(R()<.0032*API.injMult()*rk*(m.v2.cesped==='Irregular'?1.25:1)){const side=R()<.5?'o':'r',L=side==='o'?m.own:m.riv;if(L.length){const e=wpick(L,x=>(x.g==='POR'?.25:1)*(1.6-energia(x)));API.injure(m,side,e)}}
 /* juego en desarrollo (relato) */
 if(R()<.045&&API.relato){const o=R()<pO,side=o?'o':'r',L=o?m.own:m.riv,mids=L.filter(x=>x.g==='MED'),e=mids.length?pick(mids):L[0];if(e)API.relato(m,side,e)}
 /* cambios: el rival cambia a los más cansados */
 if(c.half===2&&c.x===0){
  if(m.rivSubPlan&&m.rivSubPlan.length&&c.base>=m.rivSubPlan[0]){m.rivSubPlan.shift();API.subR(m)}
  if(m.autoSubs&&m.ownAutoDone<3&&c.base>=m.ownAutoPlan[m.ownAutoDone]){m.ownAutoDone++;API.subO(m)}
 }
 m.own.forEach(e=>{const s=m.pst[e.key];if(s)s.on++});m.riv.forEach(e=>{const s=m.pst[e.key];if(s)s.on++});
 return c.base>=c.limit&&c.x>=m.extra[c.half];
}

/* ===================== simulación sin interfaz (pruebas y, más adelante, IA) ===================== */
function mkEntry(p,i,side,g){return{name:p.name,pos:p.pos,r:p.grl,age:p.age,g:g||p.pos,key:side+i+':'+p.name,role:p.role||null,fit:p.fit,mor:p.mor}}
const HL={
 ev(){},club:(m,s)=>s==='o'?m.home:m.away,tacO:m=>m.tacO||TAC_BASE,injMult:()=>1,label:null,relato:null,
 ps(m,e,side){const k=e.key;return m.pst[k]||(m.pst[k]={gl:0,a:0,sv:0,y:0,r:0,on:0,side,name:nm(e)})},
 goal(m,side,sc,as){if(side==='o')m.h++;else m.a++;HL.ps(m,sc,side).gl++;if(as)HL.ps(m,as,side).a++},
 miss(){},
 foul(){},
 yellow(m,v,side){const st=HL.ps(m,v,side);st.y++;if(side==='o')m.yH++;else m.yA++;if(st.y>=2)HL.red(m,v,side,'doble amarilla')},
 red(m,v,side){const L=side==='o'?m.own:m.riv,i=L.indexOf(v);HL.ps(m,v,side).r=1;if(side==='o')m.rH++;else m.rA++;if(i>=0)L.splice(i,1)},
 injure(m,side,e){m.v2.lesiones=(m.v2.lesiones||0)+1;HL.sub(m,side,e,true)},
 sub(m,side,outE,forced){const L=side==='o'?m.own:m.riv,B=side==='o'?m.ownBench:m.rivBench,n=side==='o'?'subsO':'subsR';
  const out=outE||L.filter(e=>e.g!=='POR').sort((a,b)=>energia(a)-energia(b))[0];if(!out)return;
  const i=L.indexOf(out);if(i<0)return;
  if((m[n]||0)>=5||!B.length){if(forced)L.splice(i,1);return}
  let j=B.findIndex(b=>b.pos===out.g);if(j<0)j=0;const inE=B.splice(j,1)[0];inE.g=out.g;inE.role=out.role;inE.key=inE.key+'*';L[i]=inE;m[n]=(m[n]||0)+1},
 subR(m){HL.sub(m,'r')},subO(m){HL.sub(m,'o')}
};
/* equipo = {name, players:[{name,pos,grl,age,role?}...] (11 titulares + suplentes), tac?, dt?, quimica?} */
function simular(loc,vis,opt){
 opt=opt||{};const prevR=R;if(opt.rng)R=opt.rng;
 try{
  const m={home:loc.name,away:vis.name,venue:opt.neutral?'n':'h',clock:{half:1,limit:45,base:0,x:0},extra:{1:Math.floor(R()*4),2:2+Math.floor(R()*5)},
   minute:0,h:0,a:0,shotsH:0,shotsA:0,onH:0,onA:0,pos:50,cornersH:0,cornersA:0,foulsH:0,foulsA:0,yH:0,yA:0,rH:0,rA:0,offH:0,offA:0,xgH:0,xgA:0,savesH:0,savesA:0,
   moments:0,tick:0,pst:{},subsO:0,subsR:0,autoSubs:true,ownAutoDone:0,ownAutoPlan:[60,70,80],rivSubPlan:[58+Math.floor(R()*5),68+Math.floor(R()*6),77+Math.floor(R()*6)],
   own:loc.players.slice(0,11).map((p,i)=>mkEntry(p,i,'o')),riv:vis.players.slice(0,11).map((p,i)=>mkEntry(p,i,'r')),
   ownBench:loc.players.slice(11,18).map((p,i)=>mkEntry(p,i+11,'o')),rivBench:vis.players.slice(11,18).map((p,i)=>mkEntry(p,i+11,'r')),
   tacO:loc.tac||TAC_BASE,tacR:vis.tac||TAC_BASE};
  preparar(m,{clima:opt.clima,cesped:opt.cesped,importancia:opt.importancia,dtO:loc.dt,dtR:vis.dt,quimicaO:loc.quimica,quimicaR:vis.quimica,arbitro:opt.arbitro});
  for(const h of [1,2]){m.clock={half:h,limit:h===1?45:90,base:h===1?0:45,x:0};let g=0;while(!minuto(m,HL)&&g++<200);}
  return{h:m.h,a:m.a,shots:[m.shotsH,m.shotsA],on:[m.onH,m.onA],corners:[m.cornersH,m.cornersA],fouls:[m.foulsH,m.foulsA],yellows:[m.yH,m.yA],reds:[m.rH,m.rA],
   offsides:[m.offH,m.offA],xg:[+m.xgH.toFixed(2),+m.xgA.toFixed(2)],pos:Math.round(m.pos),
   v2:{clima:m.v2.clima,cesped:m.v2.cesped,var:m.v2.var,errores:m.v2.errores,arbitrales:m.v2.arbitrales,rebotes:m.v2.rebotes,lesiones:m.v2.lesiones||0,penales:m.v2.penalesTotal||0}};
 }finally{R=prevR}
}

root.MCMotor={VERSION,preparar,minuto,fuerzas,simular,tacFx,energia,
 _setRng(f){R=f||Math.random}};
})(typeof window!=='undefined'?window:globalThis);
