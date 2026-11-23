/* ===== MODO CARRERA · CAMISETAS DE LOS CLUBES (simulador 2D) =====
   Formato: 'Club': [diseño, color1, color2, pantalón, medias]
   Diseños: liso · rayas (verticales) · aros (horizontales) · banda (diagonal) · franja (horizontal en el pecho)
            · franjaV (vertical central) · mitad (mitades) · mangas (cuerpo color1, mangas color2) · v (V en el pecho) · cruz
   ORIGEN: colores tradicionales de cada club tomados de referencia general, PENDIENTES DE VERIFICACIÓN con una
   fuente oficial (origen:'referencia'). Los clubes que no figuran reciben un uniforme GENÉRICO, distinto para
   cada club y estable (origen:'generico'). La segunda camiseta y la del arquero se generan (origen:'generada').
   Para corregir o agregar un club basta con editar esta tabla. */
(function(root){
'use strict';
const K={
/* Inglaterra */
'Arsenal':['mangas','#db0007','#ffffff','#ffffff','#db0007'],'Manchester City':['liso','#6cabdd','#ffffff','#ffffff','#6cabdd'],'Liverpool':['liso','#c8102e','#c8102e','#c8102e','#c8102e'],
'Chelsea':['liso','#034694','#034694','#034694','#ffffff'],'Manchester United':['liso','#da291c','#da291c','#ffffff','#000000'],'Tottenham':['liso','#ffffff','#132257','#132257','#ffffff'],
'Newcastle':['rayas','#000000','#ffffff','#000000','#000000'],'Aston Villa':['mangas','#670e36','#95bfe5','#ffffff','#670e36'],'Brighton':['rayas','#0057b8','#ffffff','#0057b8','#0057b8'],
'Crystal Palace':['rayas','#1b458f','#c4122e','#1b458f','#1b458f'],'West Ham':['mangas','#7a263a','#1bb1e7','#ffffff','#ffffff'],'Bournemouth':['rayas','#da291c','#000000','#000000','#000000'],
'Brentford':['rayas','#e30613','#ffffff','#000000','#e30613'],'Fulham':['liso','#ffffff','#000000','#000000','#ffffff'],'Everton':['liso','#003399','#003399','#ffffff','#ffffff'],
'Nottingham Forest':['liso','#dd0000','#dd0000','#ffffff','#dd0000'],'Wolverhampton':['liso','#fdb913','#231f20','#231f20','#fdb913'],'Leeds United':['liso','#ffffff','#1d428a','#ffffff','#ffffff'],
'Burnley':['mangas','#6c1d45','#99d6ea','#ffffff','#6c1d45'],'Sunderland':['rayas','#eb172b','#ffffff','#000000','#eb172b'],
/* España */
'Real Madrid':['liso','#ffffff','#febe10','#ffffff','#ffffff'],'Barcelona':['rayas','#a50044','#004d98','#004d98','#004d98'],'Atlético de Madrid':['rayas','#cb3524','#ffffff','#272e61','#cb3524'],
'Athletic Club':['rayas','#ee2523','#ffffff','#000000','#000000'],'Real Sociedad':['rayas','#0067b1','#ffffff','#ffffff','#0067b1'],'Villarreal':['liso','#ffe667','#005187','#ffe667','#ffe667'],
'Betis':['rayas','#0bb363','#ffffff','#ffffff','#0bb363'],'Sevilla':['liso','#ffffff','#d71920','#ffffff','#ffffff'],'Valencia':['liso','#ffffff','#000000','#000000','#000000'],
'Girona':['rayas','#cd2534','#ffffff','#cd2534','#cd2534'],'Celta':['liso','#8ac3ee','#ffffff','#ffffff','#8ac3ee'],'Osasuna':['liso','#d91a21','#0a346f','#0a346f','#0a346f'],
'Getafe':['liso','#005999','#005999','#005999','#005999'],'Rayo Vallecano':['banda','#ffffff','#e53027','#ffffff','#ffffff'],'Mallorca':['liso','#e20613','#000000','#000000','#000000'],
'Espanyol':['rayas','#007fc8','#ffffff','#007fc8','#007fc8'],'Alavés':['rayas','#0761af','#ffffff','#0761af','#0761af'],'Elche':['franja','#ffffff','#05642c','#ffffff','#ffffff'],
'Levante':['rayas','#004d98','#b4053f','#004d98','#004d98'],'Real Oviedo':['liso','#0047ab','#ffffff','#ffffff','#0047ab'],
/* Italia */
'Inter':['rayas','#0068a8','#000000','#000000','#000000'],'AC Milan':['rayas','#fb090b','#000000','#ffffff','#000000'],'Juventus':['rayas','#000000','#ffffff','#ffffff','#ffffff'],
'Napoli':['liso','#12a0d7','#ffffff','#ffffff','#12a0d7'],'Atalanta':['rayas','#1e71b8','#000000','#000000','#000000'],'Roma':['liso','#8e1f2f','#f0bc42','#8e1f2f','#8e1f2f'],
'Lazio':['liso','#87d8f7','#ffffff','#ffffff','#87d8f7'],'Fiorentina':['liso','#482e92','#ffffff','#482e92','#482e92'],'Bologna':['rayas','#a21c26','#1a2f48','#ffffff','#1a2f48'],
'Torino':['liso','#8a1e03','#ffffff','#ffffff','#8a1e03'],'Genoa':['mitad','#ad1919','#0e1e5b','#ffffff','#0e1e5b'],'Udinese':['rayas','#000000','#ffffff','#000000','#000000'],
'Como':['liso','#1b3a6b','#ffffff','#ffffff','#1b3a6b'],'Cagliari':['mitad','#a4041f','#002350','#002350','#002350'],'Parma':['cruz','#ffffff','#000000','#ffffff','#ffffff'],
'Lecce':['rayas','#f8e40b','#e30613','#000000','#e30613'],'Cremonese':['rayas','#9d9d9c','#c8102e','#ffffff','#c8102e'],'Sassuolo':['rayas','#00a752','#000000','#000000','#000000'],
'Pisa':['rayas','#000000','#1d4f91','#ffffff','#000000'],'Hellas Verona':['franja','#002f6c','#ffd200','#002f6c','#002f6c'],
/* Alemania */
'Bayern München':['liso','#dc052d','#ffffff','#dc052d','#dc052d'],'Borussia Dortmund':['liso','#fde100','#000000','#000000','#fde100'],'Bayer Leverkusen':['liso','#e32221','#000000','#000000','#e32221'],
'RB Leipzig':['liso','#ffffff','#dd0741','#ffffff','#ffffff'],'Eintracht Frankfurt':['liso','#000000','#e1000f','#000000','#000000'],'Stuttgart':['franja','#ffffff','#e32219','#ffffff','#ffffff'],
'Freiburg':['liso','#e2001a','#000000','#000000','#e2001a'],'Wolfsburg':['liso','#65b32e','#ffffff','#ffffff','#65b32e'],'Borussia Mönchengladbach':['liso','#ffffff','#000000','#ffffff','#ffffff'],
'Werder Bremen':['liso','#1d9053','#ffffff','#1d9053','#1d9053'],'Hoffenheim':['liso','#1961b5','#ffffff','#1961b5','#1961b5'],'Mainz 05':['liso','#c3141e','#ffffff','#ffffff','#c3141e'],
'Augsburg':['liso','#ffffff','#ba3733','#ffffff','#ffffff'],'Union Berlin':['liso','#eb1923','#ffffff','#ffffff','#eb1923'],'FC Köln':['liso','#ffffff','#ed1c24','#ffffff','#ffffff'],
'Hamburger SV':['liso','#ffffff','#0a3f86','#e2001a','#0a3f86'],'St. Pauli':['liso','#624839','#ffffff','#624839','#624839'],'Heidenheim':['liso','#e2001a','#003b79','#003b79','#e2001a'],
/* Francia */
'Paris Saint-Germain':['franjaV','#004170','#da291c','#004170','#004170'],'Marseille':['liso','#ffffff','#2faee0','#ffffff','#ffffff'],'Monaco':['mitad','#e51b22','#ffffff','#ffffff','#e51b22'],
'Lille':['liso','#e01e13','#24216a','#24216a','#e01e13'],'Lyon':['franja','#ffffff','#da0812','#ffffff','#ffffff'],'Nice':['rayas','#c8102e','#000000','#000000','#000000'],
'Lens':['liso','#ffd800','#e2001a','#e2001a','#e2001a'],'Rennes':['liso','#e2001a','#000000','#000000','#000000'],'Strasbourg':['liso','#009fe3','#ffffff','#ffffff','#009fe3'],
'Toulouse':['liso','#5c2d91','#ffffff','#ffffff','#5c2d91'],'Brest':['liso','#ed1c24','#ffffff','#ffffff','#ed1c24'],'Nantes':['liso','#fcd405','#00733c','#00733c','#fcd405'],
'Angers':['rayas','#000000','#ffffff','#000000','#000000'],'Auxerre':['liso','#ffffff','#0b4ea2','#0b4ea2','#ffffff'],'Le Havre':['mitad','#5fb1e0','#0e2240','#0e2240','#0e2240'],
'Lorient':['liso','#f58113','#000000','#000000','#f58113'],'Metz':['liso','#6e0f12','#ffffff','#6e0f12','#6e0f12'],'Paris FC':['liso','#1b2a4a','#ffffff','#1b2a4a','#1b2a4a'],
/* Portugal y Países Bajos */
'Benfica':['liso','#e83030','#ffffff','#ffffff','#e83030'],'Porto':['rayas','#00428c','#ffffff','#00428c','#00428c'],'Sporting CP':['aros','#008057','#ffffff','#000000','#008057'],
'Braga':['mangas','#d4001c','#ffffff','#ffffff','#d4001c'],'Vitória SC':['liso','#ffffff','#000000','#000000','#ffffff'],'Estoril':['rayas','#ffdd00','#0047ab','#0047ab','#ffdd00'],
'Santa Clara':['liso','#d6001c','#ffffff','#ffffff','#d6001c'],'PSV':['rayas','#ed1c24','#ffffff','#000000','#ed1c24'],'Ajax':['franjaV','#ffffff','#d2122e','#ffffff','#ffffff'],
'Feyenoord':['mitad','#e10014','#ffffff','#000000','#000000'],'AZ':['liso','#db0021','#ffffff','#ffffff','#db0021'],'Twente':['liso','#e2001a','#ffffff','#ffffff','#e2001a'],
'Utrecht':['liso','#ed1c24','#ffffff','#ffffff','#ed1c24'],'Heerenveen':['rayas','#0067b1','#ffffff','#0067b1','#0067b1'],'Sparta Rotterdam':['rayas','#e2001a','#ffffff','#000000','#000000'],
/* Argentina */
'River Plate':['banda','#ffffff','#e2001a','#000000','#ffffff'],'Boca Juniors':['franja','#003a8c','#fcbf00','#003a8c','#003a8c'],'Racing Club':['rayas','#6cb4e4','#ffffff','#000000','#ffffff'],
'Independiente':['liso','#e2001a','#0a2a6c','#0a2a6c','#e2001a'],'San Lorenzo':['rayas','#002c6b','#e2001a','#002c6b','#002c6b'],'Estudiantes de La Plata':['rayas','#e2001a','#ffffff','#000000','#e2001a'],
'Vélez Sarsfield':['v','#ffffff','#0b4ea2','#0b4ea2','#ffffff'],'Rosario Central':['rayas','#003d8f','#ffd200','#003d8f','#ffd200'],'Talleres':['rayas','#00205b','#ffffff','#00205b','#00205b'],
'Lanús':['liso','#7a1e33','#ffffff','#7a1e33','#7a1e33'],'Argentinos Juniors':['liso','#e2001a','#ffffff','#ffffff','#e2001a'],'Huracán':['liso','#ffffff','#e2001a','#ffffff','#ffffff'],
'Belgrano':['liso','#7ec8e3','#ffffff','#ffffff','#7ec8e3'],'Independiente Rivadavia':['liso','#001c6a','#ffffff','#ffffff','#001c6a'],'Banfield':['rayas','#009a44','#ffffff','#ffffff','#009a44'],
'Unión':['rayas','#e2001a','#ffffff','#000000','#ffffff'],'Defensa y Justicia':['rayas','#ffd400','#009a44','#009a44','#ffd400'],'Platense':['franja','#ffffff','#4b2e1a','#4b2e1a','#ffffff'],
"Newell's Old Boys":['mitad','#d71920','#000000','#000000','#000000'],'Gimnasia y Esgrima (La Plata)':['franja','#ffffff','#0c2240','#0c2240','#ffffff'],'Tigre':['franja','#0033a0','#e30613','#0033a0','#0033a0'],
'Atlético Tucumán':['rayas','#5fb3e4','#ffffff','#000000','#5fb3e4'],'Instituto':['rayas','#e2001a','#ffffff','#000000','#e2001a'],'Central Córdoba':['rayas','#000000','#ffffff','#000000','#000000'],
'Sarmiento':['liso','#006a3d','#ffffff','#ffffff','#006a3d'],'Aldosivi':['rayas','#0a7a3b','#ffd200','#0a7a3b','#0a7a3b'],
/* Brasil */
'Flamengo':['aros','#c4161c','#000000','#ffffff','#c4161c'],'Palmeiras':['liso','#006437','#ffffff','#ffffff','#006437'],'Botafogo':['rayas','#000000','#ffffff','#000000','#000000'],
'Fluminense':['rayas','#8a1538','#00613c','#ffffff','#ffffff'],'Cruzeiro':['liso','#003e92','#ffffff','#ffffff','#003e92'],'Atlético Mineiro':['rayas','#000000','#ffffff','#000000','#000000'],
'São Paulo':['franja','#ffffff','#e2001a','#ffffff','#ffffff'],'Corinthians':['liso','#ffffff','#000000','#000000','#000000'],'Grêmio':['rayas','#0d80bf','#000000','#000000','#ffffff'],
'Internacional':['liso','#e2001a','#ffffff','#ffffff','#e2001a'],'Bahia':['liso','#ffffff','#0b4ea2','#0b4ea2','#ffffff'],'Santos':['liso','#ffffff','#000000','#ffffff','#ffffff'],
'Vasco da Gama':['banda','#ffffff','#000000','#000000','#ffffff'],'Fortaleza':['rayas','#c8102e','#0033a0','#ffffff','#ffffff'],'Bragantino':['liso','#ffffff','#e2001a','#ffffff','#ffffff'],
'Mirassol':['liso','#ffd400','#00843d','#00843d','#ffd400'],
/* América del Norte */
'Inter Miami':['liso','#f7b5cd','#000000','#000000','#f7b5cd'],'LAFC':['liso','#000000','#c39e6d','#000000','#000000'],'LA Galaxy':['franja','#ffffff','#00245d','#ffffff','#ffffff'],
'Seattle Sounders':['liso','#5d9741','#005595','#005595','#5d9741'],'Columbus Crew':['liso','#fedd00','#000000','#000000','#fedd00'],'FC Cincinnati':['liso','#003087','#fe5000','#003087','#003087'],
'Philadelphia Union':['liso','#071b2c','#b18500','#071b2c','#071b2c'],'Vancouver Whitecaps':['liso','#ffffff','#00245e','#ffffff','#ffffff'],'Atlanta United':['rayas','#80000a','#000000','#000000','#80000a'],
'Orlando City':['liso','#633492','#ffffff','#633492','#633492'],'New York City FC':['liso','#6cace4','#041e42','#ffffff','#6cace4'],
'América':['liso','#ffe500','#001e62','#001e62','#ffe500'],'Monterrey':['rayas','#002b5c','#ffffff','#002b5c','#002b5c'],'Tigres UANL':['liso','#fdb913','#003a70','#003a70','#fdb913'],
'Toluca':['liso','#d6001c','#ffffff','#ffffff','#d6001c'],'Cruz Azul':['liso','#0047bb','#ffffff','#0047bb','#0047bb'],'Guadalajara':['rayas','#e2001a','#ffffff','#001e62','#e2001a'],
'Pumas UNAM':['liso','#ffffff','#001e62','#001e62','#ffffff'],'Pachuca':['rayas','#002b5c','#ffffff','#ffffff','#002b5c'],'León':['liso','#006341','#ffffff','#ffffff','#006341'],
/* Arabia Saudita, Turquía y otros */
'Al-Hilal':['liso','#1d4ea0','#ffffff','#1d4ea0','#1d4ea0'],'Al-Nassr':['liso','#ffd400','#0033a0','#0033a0','#ffd400'],'Al-Ahli':['liso','#00843d','#ffffff','#ffffff','#00843d'],
'Al-Ittihad':['rayas','#ffd400','#000000','#000000','#000000'],'Galatasaray':['mitad','#a90432','#fdb912','#ffffff','#a90432'],'Fenerbahçe':['rayas','#002d72','#ffed00','#ffffff','#002d72'],
'Celtic':['aros','#018749','#ffffff','#ffffff','#ffffff'],'Club Brugge':['rayas','#0062b8','#000000','#000000','#000000'],'Anderlecht':['liso','#4f2d7f','#ffffff','#4f2d7f','#4f2d7f'],
'Olympiacos':['rayas','#e2001a','#ffffff','#ffffff','#e2001a'],'Shakhtar Donetsk':['rayas','#f37021','#000000','#000000','#f37021'],'Red Bull Salzburg':['liso','#ffffff','#e2001a','#e2001a','#ffffff']
};
function hash(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const PAL=['#c8102e','#0033a0','#006a3d','#ffd400','#000000','#ffffff','#6cabdd','#7a1e33','#f37021','#5c2d91','#00a3e0','#0b6623','#e2001a','#1b2a4a','#8a1538','#fdb913'];
const DIS=['liso','liso','liso','rayas','rayas','franja','aros','banda','mangas','mitad'];
function rgb(h){h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function dist(a,b){const x=rgb(a),y=rgb(b);return Math.sqrt((x[0]-y[0])**2*.3+(x[1]-y[1])**2*.59+(x[2]-y[2])**2*.11)}
const luz=h=>{const c=rgb(h);return(c[0]*.3+c[1]*.59+c[2]*.11)/255};
function generico(club){const h=hash(club);let c1=PAL[h%PAL.length],c2=PAL[(h>>>5)%PAL.length];if(dist(c1,c2)<60)c2=luz(c1)>.5?'#1b2a4a':'#ffffff';
 return{d:DIS[(h>>>10)%DIS.length],c1,c2,sh:(h>>>14)%2?c1:(luz(c1)>.5?'#1b2a4a':'#ffffff'),me:c1,origen:'generico'}}
/* cuello y mangas: si no se indican, el cuello va en el color secundario y las mangas en el principal */
function completar(k){const cu=k.cu||(dist(k.c1,k.c2)>60?k.c2:(luz(k.c1)>.5?'#1b2a4a':'#ffffff'));return Object.assign({ma:k.d==='mangas'?k.c2:k.c1,cu,bo:null},k,{cu})}
const EXTRA={};/* acá se pueden cargar segundas y terceras camisetas reales: EXTRA['Club']={suplente:[...],tercera:[...]} con el mismo formato */
function desdeFila(f,origen){return{d:f[0],c1:f[1],c2:f[2],sh:f[3],me:f[4],origen}}
function titular(club){const k=K[club];return completar(k?desdeFila(k,'referencia'):generico(club))}
/* segunda camiseta: la real si está cargada; si no, se genera clara u oscura según la principal */
function suplente(club,t){t=t||titular(club);const x=EXTRA[club];if(x&&x.suplente)return completar(desdeFila(x.suplente,'referencia'));
 const dark=luz(t.c1)<.45;return completar({d:'liso',c1:dark?'#f4f4f4':'#14213d',c2:t.c1,sh:dark?'#f4f4f4':'#14213d',me:dark?'#f4f4f4':'#14213d',origen:'generada'})}
/* tercera camiseta: la real si está cargada; si no, se genera con el color secundario del club o un tono de contraste */
const TER=['#6a1b9a','#00897b','#ef6c00','#37474f','#c2185b','#1e88e5'];
function tercera(club,t){t=t||titular(club);const x=EXTRA[club];if(x&&x.tercera)return completar(desdeFila(x.tercera,'referencia'));
 let c=dist(t.c2,t.c1)>90&&luz(t.c2)>.12&&luz(t.c2)<.88?t.c2:TER[hash('3'+club)%TER.length];
 return completar({d:hash('d3'+club)%3?'liso':'franja',c1:c,c2:luz(c)>.5?'#111111':'#ffffff',sh:luz(c)>.5?'#111111':'#ffffff',me:c,origen:'generada'})}
const ARQ=['#2fd06a','#ff8a1a','#8e44ad','#f1c40f','#111111','#00b5d8','#e84393'];
function arquero(club,evitar){const h=hash('gk'+club);for(let i=0;i<ARQ.length;i++){const c=ARQ[(h+i)%ARQ.length];if(evitar.every(x=>dist(x,c)>90))return completar({d:'liso',c1:c,c2:luz(c)>.5?'#111111':'#ffffff',sh:c,me:c,origen:'generada',arquero:true})}
 return completar({d:'liso',c1:'#2fd06a',c2:'#111111',sh:'#2fd06a',me:'#2fd06a',origen:'generada',arquero:true})}
/* contraste entre dos uniformes (camiseta, segundo color y pantalón) */
function choque(a,b){return Math.min(dist(a.c1,b.c1),(dist(a.c1,b.c2)+dist(a.c2,b.c1))/2+30)+dist(a.sh,b.sh)*.15}
/* el local usa la titular; el visitante, la de las tres que más contraste con la del local */
function partido(local,visita){const L=titular(local),T=titular(visita),op=[T,suplente(visita,T),tercera(visita,T)];
 let V=op[0];if(choque(L,T)<110){V=op.slice().sort((a,b)=>choque(L,b)-choque(L,a))[0]}
 const ev=[L.c1,L.c2,V.c1,V.c2],aL=arquero(local,ev),aV=arquero(visita,ev.concat([aL.c1]));
 return{local:L,visita:V,arqL:aL,arqV:aV,usa:V===op[0]?'titular':V===op[1]?'suplente':'tercera'}}
root.MCCamisetas={titular,suplente,tercera,arquero,partido,tabla:K,extra:EXTRA,generico};
})(typeof window!=='undefined'?window:globalThis);
