# MODO CARRERA 12.10.0 · Etapa de datos: ligas de ascenso

Rama: `datos-ligas` (creada desde `main`; no se pasó nada a `main`).
Vista previa: **https://datos-ligas.carreramod0.pages.dev** (la publica sola GitHub Actions → Cloudflare Pages en cada push a la rama).

## Parte 1 · Europa — explicación corta

Sumé **28 divisiones nuevas con 515 clubes reales** de las ligas de ascenso de Europa, todas conectadas con la primera división que ya tenía el juego. Ahora en cada cierre de temporada hay **ascensos y descensos de verdad** en todos esos países, con los playoffs de cada liga (playoff del Championship, promoción de la Bundesliga, barrage de Francia, playout de la Serie B, etc.). Si tu club termina en zona de playoff, **el playoff lo jugás vos** como un partido de copa; si descendés o ascendés, la carrera sigue sola en la división nueva. Podés empezar una carrera con **cualquiera de los 515 clubes**.

Los clubes, estadios y ciudades son reales (Wikipedia, temporada 2026/27, con la fuente anotada club por club más abajo). Los **planteles NO son reales**: son 25 jugadores generados por club, marcados "generado". Los escudos son los reales, chiquitos (WebP de 64 px) y se bajan solo cuando aparecen en pantalla; si no conseguí alguno, el juego dibuja uno genérico con los colores y las iniciales del club.

Las ligas que no son la tuya se simulan livianas (la tabla final sale de una simulación rápida y reproducible), así que la partida guardada casi no crece: lo único que se guarda es qué clubes cambiaron de división (2-3 KB por temporada).

### Una aclaración sobre la temporada
Pediste 2025/26 o 2026 calendario, pero hoy (26/11/2026) la temporada en curso en Europa es la **2026/27**, y las primeras divisiones que ya tenía el juego están cargadas con esa temporada. Si usaba las listas de 2025/26 iban a quedar clubes repetidos (por ejemplo West Ham, Wolves y Burnley, que bajaron de la Premier en mayo de 2026, aparecerían en la Premier y en el Championship a la vez). Por eso usé las listas **2026/27**, que son las que encajan con lo que ya hay en el juego.

### Qué quedó afuera o simplificado (todo anotado)
- **No quedó afuera ninguna liga de la Parte 1**: las 20 ligas pedidas (28 divisiones contando grupos) están completas.
- La ex **National** de Francia desde 2026/27 se llama **Ligue 3**; está cargada con ese nombre ("Ligue 3 (ex National)").
- La **Challenger Pro League** de Bélgica tiene **15** equipos en 2026/27 (así figura en la fuente).
- **Descensos de la última división cargada de cada país** (National League, Segunda Federación, Serie C, 3. Liga, Ligue 3, Liga 3, Eerste Divisie, Challenger Pro League, Scottish League One, TFF 1. Lig): no se simulan, porque la división de abajo no está en el juego. Esas ligas igual ascienden normalmente.
- **Formatos simplificados** (el resultado —cuántos suben y bajan— es el real; lo que cambia es el camino):
  - Serie C: el playoff real tiene 28 equipos en varias rondas; en el juego lo juegan los tres 2º y el mejor 3º (semis y final ida y vuelta).
  - Eerste Divisie: playoff con el 16º de la Eredivisie en una sola llave de 7 equipos, todo ida y vuelta.
  - Liga 3 de Portugal: la fase de ascenso (los 4 primeros de cada serie) se simula aunque estés vos; el 3º juega la promoción con el 16º de la Liga Portugal 2 (esa sí la jugás).
  - Grupos (Primera y Segunda Federación, Serie C, Liga 3): los clubes que entran a una división con grupos ocupan los lugares que quedaron libres; se prioriza su grupo original si tiene lugar (el reparto real es geográfico).
  - Serie B: el playout 16º-17º se juega siempre (en la realidad no se juega si hay más de 4 puntos de diferencia).
  - Copa nacional para clubes de divisiones inferiores: la juegan la primera y las divisiones hasta la tuya.
- **Filiales y equipos U23**: no pueden subir a la división de su primer equipo ni arriba (Real Sociedad B, Castilla, Atlético Madrileño, Benfica B, Juventus Next Gen, etc.); los segundos equipos alemanes (Hoffenheim II, Stuttgart II) no pueden subir a la 2. Bundesliga; los Jong neerlandeses y los U23 belgas no pueden subir. Si un primer equipo baja a la división de su filial, la filial baja un escalón y sube el mejor de abajo.
- **8 clubes ya tenían algunos jugadores en la base anterior del juego** (restos de la base 11.x): Burnley 3, Girona 5, Mallorca 1, Cremonese 2, Pisa 3, Hellas Verona 2, Nantes 1 y Metz 2. No los toqué (no agregué ni borré jugadores reales); esos clubes se completan con generados hasta 25.
- **Nombres repetidos con clubes que ya existían en otros países**: Zamora (España) → "Zamora CF", Guadalajara (España) → "CD Guadalajara", Académica (Portugal) → "Académica de Coimbra". Los filiales belgas de Gent y Genk se llaman "Jong KAA Gent" y "Jong Genk".
- **Escudos**: 507 reales y 8 genéricos (Yeclano, Cesena, AlbinoLeffe, Pergolettese, Altamura, Batman Petrolspor, Mardin 1969 y Muğlaspor: su ficha no tenía imagen o la imagen no se pudo bajar). Las filiales sin escudo propio en Wikipedia usan el escudo de su primer equipo (21 casos).
- La Süper Lig de Turquía baja **3** en 2026/27 (el juego tenía cargados 4); se corrigió con la fuente.

## Cómo funciona (para el que mire el código)

- `data/divisiones.js` (59 KB): las 28 divisiones con sus clubes (nombre, ciudad, estadio, capacidad, colores, si tiene escudo descargado, filial de quién), el formato en castellano y las **reglas de ascenso y descenso** de cada país (cuántos bajan, cuántos suben, y cada playoff con sus cruces, ida/vuelta y sede neutral).
- `js/divisiones/registro.js`: suma las divisiones como ligas nuevas con clave "País · Liga" (o "País · Liga · Grupo") sin tocar las que ya existían; genera los planteles (siempre iguales: la semilla es el nombre del club) y mete en la base del mercado solo los del país de tu carrera, antes de que se arme la base (así no se arma dos veces al abrir).
- `js/divisiones/divisiones.js`: pertenencia de cada club a cada división **por carrera** (en `career.world.dv` se guarda solo la diferencia con la lista base), resolución de fin de temporada para todos los países, playoffs que juega tu club (se crean al terminar la fase regular y usan el mismo motor de copas), zonas de colores de la tabla, escudos y logos.
- `js/divisiones/nombres.js`: nombres y apellidos frecuentes por idioma para los jugadores generados.
- Cambios chicos en archivos existentes: `mc10-liga.js` (zona de la tabla y texto de ascensos), `mc10-mundo.js` (tabla simulada con los equipos de esa temporada, copa con las divisiones de abajo, cruces de playoff a ida y vuelta, caché de país por club que se renueva al cambiar las divisiones), `08-mc7-market.js` (la misma caché), `mc10-ui.js` y `mc12-diseno.js` (logos de liga y textos de referencias). Versión 12.10.0 (copia automática al actualizar).
- Escudos: `assets/escudos/div/*.webp` (507 archivos, 2,1 MB en total, 1 a 6 KB cada uno; se piden solo cuando se muestran). Logos de liga: `assets/ligas/*.webp` (20).

## Niveles de los planteles generados

Promedio de los 14 mejores jugadores por club, por división (para comparar: los últimos de la Premier del juego andan en 75, los de LaLiga en 73, Serie A 68-72, Bundesliga 70-73):

| División | Nivel |
|---|---|
| ENG2 | 71.2 |
| ENG3 | 66.1 |
| ENG4 | 62 |
| ENG5 | 58.4 |
| ESP2 | 69.8 |
| ESP3A | 64 |
| ESP3B | 64.3 |
| ESP4A | 59 |
| ESP4B | 58.7 |
| ESP4C | 58.7 |
| ESP4D | 58.8 |
| ESP4E | 58.7 |
| ITA2 | 67.1 |
| ITA3A | 61.5 |
| ITA3B | 60.6 |
| ITA3C | 61.4 |
| GER2 | 68.9 |
| GER3 | 64.2 |
| FRA2 | 67 |
| FRA3 | 60.8 |
| POR2 | 60.1 |
| POR3A | 55 |
| POR3B | 55.2 |
| NED2 | 63.5 |
| BEL2 | 62 |
| SCO2 | 60.7 |
| SCO3 | 56.2 |
| TUR2 | 65.6 |

Cada club tiene 25 jugadores: 3 arqueros, 8 defensores, 8 mediocampistas y 6 delanteros; titulares de 22 a 32 años, suplentes de 20 a 34 y 4 o 5 juveniles de 17 a 20. El nivel de cada club sale del nivel de su división y del tamaño de su estadio (dato real de la fuente): los clubes grandes son un poco más fuertes. La nacionalidad es mayormente la del país, con una mezcla de extranjeros típica de cada liga.

## Pruebas (todas corridas a mano en esta máquina; el CI pesado no se tocó)

| Prueba | Resultado |
|---|---|
| **Divisiones** (`tests/divisiones.mjs`, nueva) · A) los 515 clubes: 25 jugadores generados, posiciones, edades, marca "generado", escudo, 25 por club también en la base del mercado de cada país, y una carrera nueva por división | **OK** · 12.856 jugadores generados, 507 escudos reales + 8 genéricos, 28/28 carreras |
| **Divisiones** · B) 3 temporadas SIN INTERVENCIÓN con Birmingham City (Championship), motor real | **OK** · cada cierre: ~120 ascensos/descensos en toda Europa, todas las divisiones con la misma cantidad de clubes, ningún club repetido ni perdido, bajan los últimos y suben los primeros habilitados de cada división, lo que entra y sale de cada nivel se compensa. Birmingham terminó 16º, después **24º y descendió solo a League One** (la carrera siguió ahí) y 8º |
| **Divisiones** · C) escenarios de tu club (tus resultados se cargan con la API del juego, el resto se juega normal) | **OK** · pierde todo en League One → League Two · gana todo en Primera Federación → Segunda · FC Köln último en la Bundesliga → 2. Bundesliga · Watford 5º en el Championship → **jugó el playoff como partido**, lo perdió y siguió en el Championship. En todos, la temporada siguiente arranca y se juega |
| Peso de la partida (3 temporadas, River, igual que `tests/temporadas.mjs`) | main: 478 / 709 / 920 KB · esta rama: 491 / 734 / 932 KB (+1 a 3 %). Lo que guardan las divisiones: 2,6 / 4,7 / 4,5 KB |
| **Carga en el celular** (`tests/carga-movil.mjs`, nueva: iPhone 13, CPU 4× más lenta) | sin carrera: main 3,0-3,4 s · rama 2,9-3,6 s (mismo rango); +102 KB al abrir (datos y código de divisiones, sin comprimir); 0 escudos bajados al abrir. Con una carrera abierta: Arsenal main 7,9 s · rama 8,1 s; Wrexham (Championship) 8,7 s |
| Tres temporadas sin intervención (`tests/temporadas.mjs`, River) | **OK** |
| Actualización desde la **12.2.2** (`tests/actualizacion.mjs`) | **OK** · campos distintos 0, pasa al v3, copia "Antes de actualizar a la versión 12.10.0 (venía de 12.2)" |
| Actualización desde la 12.6.0 (v1, v2 y v3) | **OK** |
| Motor v3 (300), v3 en el juego, ficha, rotación, mercado, auditoría de eventos | **OK** |
| Marcador y reloj del 2D (`tests/v3marcador.mjs`) | **OK** al repetirla con la máquina libre (rama y main). La primera vez, corriendo en paralelo con otras pruebas, marcó un salto de velocidad en una repetición del 2D de la copa; no la toca esta etapa (no cambié el 2D ni el motor) y repetida dio bien en las dos versiones: es la falla intermitente por carga de la máquina |

Las dos pruebas nuevas quedaron en el CI liviano (corren en cada push); las pesadas siguen solo a mano.

## Fuentes

- Lista de clubes, ciudad, estadio y capacidad de cada liga: la página de la temporada 2026/27 en Wikipedia en inglés (anotada en cada liga abajo), consultada el 26/11/2026.
- Formato, cupos de ascenso/descenso y playoffs: las mismas páginas (texto de formato y zonas de la tabla) y las páginas 2026/27 de cada primera división (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Primeira Liga, Eredivisie, Pro League, Premiership y Süper Lig).
- Escudo y colores de cada club: la ficha (infobox) de su artículo en Wikipedia; la imagen se bajó de Wikimedia (Special:FilePath) y se achicó a 64 px. Logos de liga: ficha del artículo de cada liga.
- Planteles: **generados** (no hay ningún jugador real nuevo).

## Clubes por liga

#### Inglaterra · EFL Championship (24 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_EFL_Championship  
24 equipos, ida y vuelta (46 fechas). Suben 1º y 2º; del 3º al 8º juegan el playoff (5º-8º y 6º-7º a partido único, semis ida y vuelta con 3º y 4º, final en Wembley): el ganador sube. Bajan los 3 últimos a League One.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Birmingham City | Birmingham (Bordesley) | St Andrew's | real | en.wikipedia.org/wiki/Birmingham_City_F.C. |
| Blackburn Rovers | Blackburn | Ewood Park | real | en.wikipedia.org/wiki/Blackburn_Rovers_F.C. |
| Bolton Wanderers | Horwich | Toughsheet Community Stadium | real | en.wikipedia.org/wiki/Bolton_Wanderers_F.C. |
| Bristol City | Bristol | Ashton Gate | real | en.wikipedia.org/wiki/Bristol_City_F.C. |
| Burnley | Burnley | Turf Moor | real | en.wikipedia.org/wiki/Burnley_F.C. |
| Cardiff City | Cardiff | Cardiff City Stadium | real | en.wikipedia.org/wiki/Cardiff_City_F.C. |
| Charlton Athletic | London (Charlton) | The Valley | real | en.wikipedia.org/wiki/Charlton_Athletic_F.C. |
| Derby County | Derby | Pride Park Stadium | real | en.wikipedia.org/wiki/Derby_County_F.C. |
| Lincoln City | Lincoln | Sincil Bank | real | en.wikipedia.org/wiki/Lincoln_City_F.C. |
| Middlesbrough | Middlesbrough | Riverside Stadium | real | en.wikipedia.org/wiki/Middlesbrough_F.C. |
| Millwall | London (Bermondsey) | The Den | real | en.wikipedia.org/wiki/Millwall_F.C. |
| Norwich City | Norwich | Carrow Road | real | en.wikipedia.org/wiki/Norwich_City_F.C. |
| Portsmouth | Portsmouth | Fratton Park | real | en.wikipedia.org/wiki/Portsmouth_F.C. |
| Preston North End | Preston | Deepdale | real | en.wikipedia.org/wiki/Preston_North_End_F.C. |
| Queens Park Rangers | London (Shepherd's Bush) | Loftus Road | real | en.wikipedia.org/wiki/Queens_Park_Rangers_F.C. |
| Sheffield United | Sheffield (Highfield) | Bramall Lane | real | en.wikipedia.org/wiki/Sheffield_United_F.C. |
| Southampton | Southampton | St Mary's Stadium | real | en.wikipedia.org/wiki/Southampton_F.C. |
| Stoke City | Stoke-on-Trent | bet365 Stadium | real | en.wikipedia.org/wiki/Stoke_City_F.C. |
| Swansea City | Swansea | Swansea.com Stadium | real | en.wikipedia.org/wiki/Swansea_City_A.F.C. |
| Watford | Watford | Vicarage Road | real | en.wikipedia.org/wiki/Watford_F.C. |
| West Bromwich Albion | West Bromwich | The Hawthorns | real | en.wikipedia.org/wiki/West_Bromwich_Albion_F.C. |
| West Ham United | London (Stratford) | London Stadium | real | en.wikipedia.org/wiki/West_Ham_United_F.C. |
| Wolverhampton Wanderers | Wolverhampton | Molineux Stadium | real | en.wikipedia.org/wiki/Wolverhampton_Wanderers_F.C. |
| Wrexham | Wrexham | Racecourse Ground | real | en.wikipedia.org/wiki/Wrexham_A.F.C. |

#### Inglaterra · EFL League One (24 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_EFL_League_One  
24 equipos, ida y vuelta. Suben 1º y 2º; playoff 3º-6º (semis ida y vuelta, final única). Bajan los 4 últimos a League Two.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| AFC Wimbledon | London (Wimbledon) | Plough Lane | real | en.wikipedia.org/wiki/AFC_Wimbledon |
| Barnsley | Barnsley | Oakwell | real | en.wikipedia.org/wiki/Barnsley_F.C. |
| Blackpool | Blackpool | Bloomfield Road | real | en.wikipedia.org/wiki/Blackpool_F.C. |
| Bradford City | Bradford | Valley Parade | real | en.wikipedia.org/wiki/Bradford_City_A.F.C. |
| Bromley | London (Bromley) | Hayes Lane | real | en.wikipedia.org/wiki/Bromley_F.C. |
| Burton Albion | Burton upon Trent | Pirelli Stadium | real | en.wikipedia.org/wiki/Burton_Albion_F.C. |
| Cambridge United | Cambridge | Abbey Stadium | real | en.wikipedia.org/wiki/Cambridge_United_F.C. |
| Doncaster Rovers | Doncaster | Eco-Power Stadium | real | en.wikipedia.org/wiki/Doncaster_Rovers_F.C. |
| Huddersfield Town | Huddersfield | Kirklees Stadium | real | en.wikipedia.org/wiki/Huddersfield_Town_A.F.C. |
| Leicester City | Leicester | King Power Stadium | real | en.wikipedia.org/wiki/Leicester_City_F.C. |
| Leyton Orient | London (Leyton) | Brisbane Road | real | en.wikipedia.org/wiki/Leyton_Orient_F.C. |
| Luton Town | Luton | Kenilworth Road | real | en.wikipedia.org/wiki/Luton_Town_F.C. |
| Mansfield Town | Mansfield | Field Mill | real | en.wikipedia.org/wiki/Mansfield_Town_F.C. |
| Milton Keynes Dons | Milton Keynes | Stadium MK | real | en.wikipedia.org/wiki/Milton_Keynes_Dons_F.C. |
| Notts County | Nottingham | Meadow Lane | real | en.wikipedia.org/wiki/Notts_County_F.C. |
| Oxford United | Oxford | Kassam Stadium | real | en.wikipedia.org/wiki/Oxford_United_F.C. |
| Peterborough United | Peterborough | London Road Stadium | real | en.wikipedia.org/wiki/Peterborough_United_F.C. |
| Plymouth Argyle | Plymouth | Home Park | real | en.wikipedia.org/wiki/Plymouth_Argyle_F.C. |
| Reading | Reading | Madejski Stadium | real | en.wikipedia.org/wiki/Reading_F.C. |
| Sheffield Wednesday | Sheffield (Hillsborough) | Hillsborough Stadium | real | en.wikipedia.org/wiki/Sheffield_Wednesday_F.C. |
| Stevenage | Stevenage | Broadhall Way | real | en.wikipedia.org/wiki/Stevenage_F.C. |
| Stockport County | Stockport (Edgeley) | Edgeley Park | real | en.wikipedia.org/wiki/Stockport_County_F.C. |
| Wigan Athletic | Wigan | Brick Community Stadium | real | en.wikipedia.org/wiki/Wigan_Athletic_F.C. |
| Wycombe Wanderers | High Wycombe | Adams Park | real | en.wikipedia.org/wiki/Wycombe_Wanderers_F.C. |

#### Inglaterra · EFL League Two (24 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_EFL_League_Two  
24 equipos, ida y vuelta. Suben 1º, 2º y 3º; playoff 4º-7º (semis ida y vuelta, final única). Bajan los 2 últimos a la National League.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Accrington Stanley | Accrington | Crown Ground | real | en.wikipedia.org/wiki/Accrington_Stanley_F.C. |
| Barnet | London (Canons Park) | The Hive Stadium | real | en.wikipedia.org/wiki/Barnet_F.C. |
| Bristol Rovers | Bristol (Horfield) | Memorial Stadium | real | en.wikipedia.org/wiki/Bristol_Rovers_F.C. |
| Cheltenham Town | Cheltenham | Whaddon Road | real | en.wikipedia.org/wiki/Cheltenham_Town_F.C. |
| Chesterfield | Chesterfield | SMH Group Stadium | real | en.wikipedia.org/wiki/Chesterfield_F.C. |
| Colchester United | Colchester | Colchester Community Stadium | real | en.wikipedia.org/wiki/Colchester_United_F.C. |
| Crawley Town | Crawley | Broadfield Stadium | real | en.wikipedia.org/wiki/Crawley_Town_F.C. |
| Crewe Alexandra | Crewe | Gresty Road | real | en.wikipedia.org/wiki/Crewe_Alexandra_F.C. |
| Exeter City | Exeter | St James Park | real | en.wikipedia.org/wiki/Exeter_City_F.C. |
| Fleetwood Town | Fleetwood | Highbury Stadium | real | en.wikipedia.org/wiki/Fleetwood_Town_F.C. |
| Gillingham | Gillingham | Priestfield Stadium | real | en.wikipedia.org/wiki/Gillingham_F.C. |
| Grimsby Town | Cleethorpes | Blundell Park | real | en.wikipedia.org/wiki/Grimsby_Town_F.C. |
| Newport County | Newport | Rodney Parade | real | en.wikipedia.org/wiki/Newport_County_A.F.C. |
| Northampton Town | Northampton (Sixfields) | Sixfields Stadium | real | en.wikipedia.org/wiki/Northampton_Town_F.C. |
| Oldham Athletic | Oldham | Boundary Park | real | en.wikipedia.org/wiki/Oldham_Athletic_A.F.C. |
| Port Vale | Stoke-on-Trent (Burslem) | Vale Park | real | en.wikipedia.org/wiki/Port_Vale_F.C. |
| Rochdale | Rochdale | Spotland Stadium | real | en.wikipedia.org/wiki/Rochdale_A.F.C. |
| Rotherham United | Rotherham | New York Stadium | real | en.wikipedia.org/wiki/Rotherham_United_F.C. |
| Salford City | Salford | Moor Lane | real | en.wikipedia.org/wiki/Salford_City_F.C. |
| Shrewsbury Town | Shrewsbury | New Meadow | real | en.wikipedia.org/wiki/Shrewsbury_Town_F.C. |
| Swindon Town | Swindon | County Ground | real | en.wikipedia.org/wiki/Swindon_Town_F.C. |
| Tranmere Rovers | Birkenhead (Prenton) | Prenton Park | real | en.wikipedia.org/wiki/Tranmere_Rovers_F.C. |
| Walsall | Walsall (Bescot) | Bescot Stadium | real | en.wikipedia.org/wiki/Walsall_F.C. |
| York City | York | York Community Stadium | real | en.wikipedia.org/wiki/York_City_F.C. |

#### Inglaterra · National League (24 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_National_League  
24 equipos, ida y vuelta. Sube el campeón; playoff 2º-7º (2º y 3º a semis; todo a partido único): el ganador sube a League Two. Los 4 últimos bajan a National League North/South (no cargadas en el juego: no se simula ese descenso).

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| AFC Fylde | Wesham | Mill Farm Sports Village | real | en.wikipedia.org/wiki/AFC_Fylde |
| Aldershot Town | Aldershot | The Recreation Ground | real | en.wikipedia.org/wiki/Aldershot_Town_F.C. |
| Altrincham | Altrincham | Moss Lane | real | en.wikipedia.org/wiki/Altrincham_F.C. |
| Barrow | Barrow-in-Furness | Holker Street | real | en.wikipedia.org/wiki/Barrow_A.F.C. |
| Boreham Wood | Borehamwood | Meadow Park | real | en.wikipedia.org/wiki/Boreham_Wood_F.C. |
| Boston United | Boston | Boston Community Stadium | real | en.wikipedia.org/wiki/Boston_United_F.C. |
| Carlisle United | Carlisle | Brunton Park | real | en.wikipedia.org/wiki/Carlisle_United_F.C. |
| Eastleigh | Eastleigh | Ten Acres | real | en.wikipedia.org/wiki/Eastleigh_F.C. |
| FC Halifax Town | Halifax | The Shay | real | en.wikipedia.org/wiki/FC_Halifax_Town |
| Forest Green Rovers | Nailsworth | The New Lawn | real | en.wikipedia.org/wiki/Forest_Green_Rovers_F.C. |
| Gateshead | Gateshead | Gateshead International Stadium | real | en.wikipedia.org/wiki/Gateshead_F.C. |
| Harrogate Town | Harrogate | Wetherby Road | real | en.wikipedia.org/wiki/Harrogate_Town_A.F.C. |
| Hartlepool United | Hartlepool | Victoria Park | real | en.wikipedia.org/wiki/Hartlepool_United_F.C. |
| Hornchurch | London (Upminster) | Hornchurch Stadium | real | en.wikipedia.org/wiki/Hornchurch_F.C. |
| Kidderminster Harriers | Kidderminster | Aggborough Stadium | real | en.wikipedia.org/wiki/Kidderminster_Harriers_F.C. |
| Scunthorpe United | Scunthorpe | Glanford Park | real | en.wikipedia.org/wiki/Scunthorpe_United_F.C. |
| Solihull Moors | Solihull | Damson Park | real | en.wikipedia.org/wiki/Solihull_Moors_F.C. |
| Southend United | Southend-on-Sea | Roots Hall | real | en.wikipedia.org/wiki/Southend_United_F.C. |
| Sutton United | London (Sutton) | Gander Green Lane | real | en.wikipedia.org/wiki/Sutton_United_F.C. |
| Tamworth | Tamworth | The Lamb Ground | real | en.wikipedia.org/wiki/Tamworth_F.C. |
| Wealdstone | London (Ruislip) | Grosvenor Vale | real | en.wikipedia.org/wiki/Wealdstone_F.C. |
| Woking | Woking | Kingfield Stadium | real | en.wikipedia.org/wiki/Woking_F.C. |
| Worthing | Worthing | Woodside Road | real | en.wikipedia.org/wiki/Worthing_F.C. |
| Yeovil Town | Yeovil | Huish Park | real | en.wikipedia.org/wiki/Yeovil_Town_F.C. |

#### España · Segunda División (LaLiga Hypermotion) (22 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Segunda_División  
22 equipos, ida y vuelta (42 fechas). Suben 1º y 2º; playoff 3º-6º (semis y final a ida y vuelta). Bajan los 4 últimos a Primera Federación. Las filiales no pueden subir a la división de su primer equipo.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Albacete | Albacete | Estadio Carlos Belmonte | real | en.wikipedia.org/wiki/Albacete_Balompié |
| Almería | Almería | UD Almería Stadium | real | en.wikipedia.org/wiki/UD_Almería |
| Andorra | Encamp | Nou Estadi Encamp | real | en.wikipedia.org/wiki/FC_Andorra |
| Burgos | Burgos | Estadio El Plantío | real | en.wikipedia.org/wiki/Burgos_CF |
| Cádiz | Cádiz | JP Financial Estadio | real | en.wikipedia.org/wiki/Cádiz_CF |
| Castellón | Castellón de la Plana | Estadio SkyFi Castàlia | real | en.wikipedia.org/wiki/CD_Castellón |
| Celta Fortuna (filial de Celta) | Vigo | Estadio ABANCA Balaídos | real | en.wikipedia.org/wiki/RC_Celta_Fortuna |
| Ceuta | Ceuta | Estadio Alfonso Murube | real | en.wikipedia.org/wiki/AD_Ceuta_FC |
| Córdoba | Córdoba | Estadio Bahrain Victorious Nuevo Arcángel de Córdoba | real | en.wikipedia.org/wiki/Córdoba_CF |
| Eibar | Eibar | Estadio Municipal de Ipurua | real | en.wikipedia.org/wiki/SD_Eibar |
| Eldense | Elda | Estadio Pepico Amat | real | en.wikipedia.org/wiki/CD_Eldense |
| Girona | Girona | Estadio Municipal de Montilivi | real | en.wikipedia.org/wiki/Girona_FC |
| Granada | Granada | Estadio Nuevo Los Cármenes | real | en.wikipedia.org/wiki/Granada_CF |
| Las Palmas | Las Palmas | Estadio Gran Canaria | real | en.wikipedia.org/wiki/UD_Las_Palmas |
| Leganés | Leganés | Estadio Ontime Butarque | real | en.wikipedia.org/wiki/CD_Leganés |
| Mallorca | Palma | Estadi Mallorca Son Moix | real | en.wikipedia.org/wiki/RCD_Mallorca |
| Oviedo | Oviedo | Estadio Carlos Tartiere | real | en.wikipedia.org/wiki/Real_Oviedo |
| Real Sociedad B (filial de Real Sociedad) | San Sebastián | Estadio Zubieta | real | en.wikipedia.org/wiki/Real_Sociedad_B |
| Sabadell | Sabadell | Nova Creu Alta | real | en.wikipedia.org/wiki/CE_Sabadell_FC |
| Sporting Gijón | Gijón | Estadio El Molinón-Enrique Castro "Quini" | real | en.wikipedia.org/wiki/Sporting_de_Gijón |
| Tenerife | Santa Cruz de Tenerife | Estadio Heliodoro Rodríguez López | real | en.wikipedia.org/wiki/CD_Tenerife |
| Valladolid | Valladolid | Estadio Municipal José Zorrilla | real | en.wikipedia.org/wiki/Real_Valladolid |

#### España · Primera Federación · Grupo 1 (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Primera_Federación  
2 grupos de 20, ida y vuelta. Sube el campeón de cada grupo; del 2º al 5º de cada grupo juegan dos llaves de playoff (ida y vuelta) y suben los 2 ganadores. Bajan los 5 últimos de cada grupo.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Arenas | Getxo | Gobela | real | en.wikipedia.org/wiki/Arenas_Club_de_Getxo |
| Avilés Industrial | Avilés | Román Suárez Puerta | real | en.wikipedia.org/wiki/Real_Avilés_Industrial_CF |
| Barakaldo | Barakaldo | Lasesarre | real | en.wikipedia.org/wiki/Barakaldo_CF |
| Bilbao Athletic (filial de Athletic Club) | Bilbao | Lezama | real | en.wikipedia.org/wiki/Athletic_Bilbao_B |
| Cacereño | Cáceres | Príncipe Felipe | real | en.wikipedia.org/wiki/CP_Cacereño |
| Coria | Coria | La Isla | real | en.wikipedia.org/wiki/CD_Coria |
| Cultural Leonesa | León | Estadio Reino de León | real | en.wikipedia.org/wiki/Cultural_y_Deportiva_Leonesa |
| Deportivo Fabril (filial de Deportivo La Coruña) | Abegondo | Cidade Deportiva de Abegondo | real | en.wikipedia.org/wiki/Deportivo_Fabril |
| Extremadura | Almendralejo | Francisco de la Hera | real | en.wikipedia.org/wiki/CD_Extremadura |
| UD Logroñés | Logroño | Las Gaunas | real | en.wikipedia.org/wiki/UD_Logroñés |
| Lugo | Lugo | Anxo Carro | real | en.wikipedia.org/wiki/CD_Lugo |
| Mérida | Mérida | Estadio Romano | real | en.wikipedia.org/wiki/Mérida_AD |
| Mirandés | Miranda de Ebro | Estadio Municipal de Anduva | real | en.wikipedia.org/wiki/CD_Mirandés |
| UD Ourense | Ourense | O Couto | real | en.wikipedia.org/wiki/UD_Ourense |
| Ponferradina | Ponferrada | El Toralín | real | en.wikipedia.org/wiki/SD_Ponferradina |
| Pontevedra | Pontevedra | Pasarón | real | en.wikipedia.org/wiki/Pontevedra_CF |
| Racing Ferrol | Ferrol | A Malata | real | en.wikipedia.org/wiki/Racing_de_Ferrol |
| Real Unión | Irun | Stadium Gal | real | en.wikipedia.org/wiki/Real_Unión |
| Unionistas | Salamanca | Reina Sofía | real | en.wikipedia.org/wiki/Unionistas_de_Salamanca_CF |
| Zamora CF | Zamora | Ruta de la Plata | real | en.wikipedia.org/wiki/Zamora_CF |

#### España · Primera Federación · Grupo 2 (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Primera_Federación  
2 grupos de 20, ida y vuelta. Sube el campeón de cada grupo; del 2º al 5º de cada grupo juegan dos llaves de playoff (ida y vuelta) y suben los 2 ganadores. Bajan los 5 últimos de cada grupo.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Águilas | Águilas | El Rubial | real | en.wikipedia.org/wiki/Águilas_FC |
| Alcorcón | Alcorcón | Santo Domingo | real | en.wikipedia.org/wiki/AD_Alcorcón |
| Algeciras | Algeciras | Nuevo Mirador | real | en.wikipedia.org/wiki/Algeciras_CF |
| Antequera | Antequera | El Maulí | real | en.wikipedia.org/wiki/Antequera_CF |
| Atlético Madrileño (filial de Atlético de Madrid) | Alcalá de Henares | Centro Deportivo Alcalá de Henares | real | en.wikipedia.org/wiki/Atlético_Madrileño |
| Cartagena | Cartagena | Cartagonova | real | en.wikipedia.org/wiki/FC_Cartagena |
| Europa | Barcelona | Can Dragó | real | en.wikipedia.org/wiki/CE_Europa |
| Gimnàstic | Tarragona | Nou Estadi | real | en.wikipedia.org/wiki/Gimnàstic_de_Tarragona |
| Hércules | Alicante | José Rico Pérez | real | en.wikipedia.org/wiki/Hércules_CF |
| Huesca | Huesca | Estadio El Alcoraz | real | en.wikipedia.org/wiki/SD_Huesca |
| Ibiza | Ibiza | Can Misses | real | en.wikipedia.org/wiki/UD_Ibiza |
| Jaén | Jaén | La Victoria | real | en.wikipedia.org/wiki/Real_Jaén |
| Juventud Torremolinos | Torremolinos | El Pozuelo | real | en.wikipedia.org/wiki/Juventud_de_Torremolinos_CF |
| Murcia | Murcia | Enrique Roca | real | en.wikipedia.org/wiki/Real_Murcia |
| Rayo Majadahonda | Majadahonda | Cerro del Espino | real | en.wikipedia.org/wiki/CF_Rayo_Majadahonda |
| Real Madrid Castilla (filial de Real Madrid) | Madrid | Alfredo di Stéfano | real | en.wikipedia.org/wiki/Real_Madrid_Castilla |
| Sant Andreu | Barcelona | Narcís Sala | real | en.wikipedia.org/wiki/UE_Sant_Andreu |
| Teruel | Teruel | Pinilla | real | en.wikipedia.org/wiki/CD_Teruel |
| Villarreal B (filial de Villarreal) | Villarreal | Estadio de la Cerámica | real | en.wikipedia.org/wiki/Villarreal_CF_B |
| Zaragoza | Zaragoza | Ibercaja Stadium | real | en.wikipedia.org/wiki/Real_Zaragoza |

#### España · Segunda Federación · Grupo 1 (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Segunda_Federación  
5 grupos de 18, ida y vuelta. Sube el campeón de cada grupo; del 2º al 5º juegan cinco llaves de playoff a partido único y suben los 5 ganadores. Los descensos a Tercera Federación no se simulan (esa división no está cargada).

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Alavés B (filial de Alavés) | Vitoria | José Luis Compañón | real | en.wikipedia.org/wiki/Deportivo_Alavés_B |
| Amorebieta | Amorebieta-Etxano | Urritxe | real | en.wikipedia.org/wiki/SD_Amorebieta |
| Arosa | Vilagarcía de Arousa | A Lomba | real | en.wikipedia.org/wiki/Arosa_SC |
| Atlético Astorga | Astorga | La Eragudina | real | en.wikipedia.org/wiki/Atlético_Astorga_FC |
| Basconia | Basauri | Artunduaga | real | en.wikipedia.org/wiki/CD_Basconia |
| Bergantiños | Carballo | As Eiroas | real | en.wikipedia.org/wiki/Bergantiños_FC |
| Compostela | Santiago de Compostela | Vero Boquete | real | en.wikipedia.org/wiki/SD_Compostela |
| Coruxo | Vigo | O Vao | real | en.wikipedia.org/wiki/Coruxo_FC |
| Eibar B (filial de Eibar) | Eibar | Unbe | real | en.wikipedia.org/wiki/SD_Eibar_B |
| Gernika | Gernika-Lumo | Urbieta | real | en.wikipedia.org/wiki/Gernika_Club |
| Gimnástica Torrelavega | Torrelavega | El Malecón | real | en.wikipedia.org/wiki/Gimnástica_de_Torrelavega |
| Llanera | Llanera | Pepe Quimarán | real | en.wikipedia.org/wiki/UD_Llanera |
| Marino Luanco | Luanco | Miramar | real | en.wikipedia.org/wiki/Marino_de_Luanco |
| Ourense CF | Ourense | O Couto | real | en.wikipedia.org/wiki/Ourense_CF |
| Oviedo Vetusta (filial de Oviedo) | Oviedo | El Requexón | real | en.wikipedia.org/wiki/Real_Oviedo_Vetusta |
| Portugalete | Portugalete | La Florida | real | en.wikipedia.org/wiki/Club_Portugalete |
| Rayo Cantabria (filial de Racing de Santander) | Santander | La Albericia | real | en.wikipedia.org/wiki/Rayo_Cantabria |
| Sestao River | Sestao | Las Llanas | real | en.wikipedia.org/wiki/Sestao_River_Club |

#### España · Segunda Federación · Grupo 2 (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Segunda_Federación  
5 grupos de 18, ida y vuelta. Sube el campeón de cada grupo; del 2º al 5º juegan cinco llaves de playoff a partido único y suben los 5 ganadores. Los descensos a Tercera Federación no se simulan (esa división no está cargada).

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Arnedo | Arnedo | Sendero | real | en.wikipedia.org/wiki/CD_Arnedo |
| Barbastro | Barbastro | Municipal de Deportes | real | en.wikipedia.org/wiki/UD_Barbastro |
| Barcelona Atlètic (filial de Barcelona) | Barcelona | Johan Cruyff | real | en.wikipedia.org/wiki/FC_Barcelona_Atlètic |
| Calamocha | Calamocha | Jumaya | real | en.wikipedia.org/wiki/CF_Calamocha |
| Ebro | Zaragoza | El Carmen | real | en.wikipedia.org/wiki/CD_Ebro |
| Espanyol B (filial de Espanyol) | Barcelona | Dani Jarque | real | en.wikipedia.org/wiki/RCD_Espanyol_B |
| Girona B (filial de Girona) | Girona | Torres de Palau | real | en.wikipedia.org/wiki/Girona_FC_B |
| SD Logroñés | Logroño | Las Gaunas | real | en.wikipedia.org/wiki/SD_Logroñés |
| UD Logroñés B (filial de UD Logroñés) | Logroño | Ciudad Deportiva UD Logroñés | real | en.wikipedia.org/wiki/UD_Logroñés_B |
| Manresa | Manresa | Nou Congost | real | en.wikipedia.org/wiki/CE_Manresa |
| Náxara | Nájera | La Salera | real | en.wikipedia.org/wiki/Náxara_CD |
| Olot | Olot | Municipal d'Olot | real | en.wikipedia.org/wiki/UE_Olot |
| Osasuna B (filial de Osasuna) | Pamplona | Tajonar | real | en.wikipedia.org/wiki/CA_Osasuna_B |
| Peña Sport | Tafalla | San Francisco | real | en.wikipedia.org/wiki/Peña_Sport_FC |
| Reus FCR | Reus | Municipal de Reus | real | en.wikipedia.org/wiki/Reus_FC_Reddis |
| Terrassa | Terrassa | Olímpic | real | en.wikipedia.org/wiki/Terrassa_FC |
| Tudelano | Tudela | Ciudad de Tudela | real | en.wikipedia.org/wiki/CD_Tudelano |
| Utebo | Utebo | Santa Ana | real | en.wikipedia.org/wiki/Utebo_FC |

#### España · Segunda Federación · Grupo 3 (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Segunda_Federación  
5 grupos de 18, ida y vuelta. Sube el campeón de cada grupo; del 2º al 5º juegan cinco llaves de playoff a partido único y suben los 5 ganadores. Los descensos a Tercera Federación no se simulan (esa división no está cargada).

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Alcoyano | Alcoy | El Collao | real | en.wikipedia.org/wiki/CD_Alcoyano |
| Atlético Baleares | Palma | Estadi Balear | real | en.wikipedia.org/wiki/CD_Atlético_Baleares |
| Castellón B (filial de Castellón) | Castellón | Gaetà Huguet | real | en.wikipedia.org/wiki/CD_Castellón_B |
| Castellonense | Castelló | Camp Municipal de L'Almenà | real | en.wikipedia.org/wiki/UD_Castellonense |
| Cieza | Cieza | La Arboleja | real | en.wikipedia.org/wiki/CD_Cieza |
| Elche Ilicitano (filial de Elche) | Elche | José Díaz Iborra | real | en.wikipedia.org/wiki/Elche_CF_Ilicitano |
| Intercity | Alicante | Antonio Solana | real | en.wikipedia.org/wiki/CF_Intercity |
| La Nucía | La Nucía | Camilo Cano | real | en.wikipedia.org/wiki/CF_La_Nucía |
| Lorca Deportiva | Lorca | Francisco Artés Carrasco | real | en.wikipedia.org/wiki/CF_Lorca_Deportiva |
| Mallorca B (filial de Mallorca) | Palma | Son Bibiloni | real | en.wikipedia.org/wiki/RCD_Mallorca_B |
| Minera | Llano del Beal | Ángel Cedrán | real | en.wikipedia.org/wiki/CD_Minera |
| Murcia Imperial | Murcia | Campus de Espinardo | real | en.wikipedia.org/wiki/Real_Murcia_Imperial |
| Orihuela | Orihuela | Los Arcos | real | en.wikipedia.org/wiki/Orihuela_CF |
| Peña Deportiva | Santa Eulària des Riu | Municipal de Santa Eulària | real | en.wikipedia.org/wiki/SCR_Peña_Deportiva |
| Poblense | Sa Pobla | Nou Camp | real | en.wikipedia.org/wiki/UD_Poblense |
| UCAM Murcia | Murcia | La Condomina | real | en.wikipedia.org/wiki/UCAM_Murcia_CF |
| Valencia Mestalla (filial de Valencia) | Paterna | Antonio Puchades | real | en.wikipedia.org/wiki/Valencia_CF_Mestalla |
| Yeclano | Yecla | La Constitución | genérico | en.wikipedia.org/wiki/Yeclano_Deportivo |

#### España · Segunda Federación · Grupo 4 (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Segunda_Federación  
5 grupos de 18, ida y vuelta. Sube el campeón de cada grupo; del 2º al 5º juegan cinco llaves de playoff a partido único y suben los 5 ganadores. Los descensos a Tercera Federación no se simulan (esa división no está cargada).

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Atlético Antoniano | Lebrija | Municipal de Lebrija | real | en.wikipedia.org/wiki/CA_Antoniano |
| Atlético Central | Seville | Centro Deportivo Vega de Triana | real | en.wikipedia.org/wiki/CA_Central |
| Atlético Sanluqueño | Sanlúcar de Barrameda | El Palmar | real | en.wikipedia.org/wiki/Atlético_Sanluqueño_CF |
| Badajoz | Badajoz | Nuevo Vivero | real | en.wikipedia.org/wiki/CD_Badajoz |
| Betis Deportivo (filial de Betis) | Seville | Luis del Sol | real | en.wikipedia.org/wiki/Betis_Deportivo |
| Ciudad de Lucena | Lucena | Ciudad de Lucena | real | en.wikipedia.org/wiki/CD_Ciudad_de_Lucena |
| Don Benito | Don Benito | Vicente Sanz | real | en.wikipedia.org/wiki/CD_Don_Benito |
| Estepona | Estepona | Francisco Muñoz Pérez | real | en.wikipedia.org/wiki/CD_Estepona_FS |
| Las Palmas Atlético (filial de Las Palmas) | Las Palmas | Anexo Gran Canaria | real | en.wikipedia.org/wiki/UD_Las_Palmas_Atlético |
| Linares | Linares | Linarejos | real | en.wikipedia.org/wiki/Linares_Deportivo |
| Marbella | Marbella | Municipal de Marbella | real | en.wikipedia.org/wiki/Marbella_FC |
| Mijas-Las Lagunas | , Mijas | Juan Gambero Culebra | real | en.wikipedia.org/wiki/CP_Mijas-Las_Lagunas |
| Puente Genil | Puente Genil | Manuel Polinario | real | en.wikipedia.org/wiki/Puente_Genil_FC |
| Recreativo | Huelva | Nuevo Colombino | real | en.wikipedia.org/wiki/Recreativo_de_Huelva |
| Sevilla Atlético (filial de Sevilla) | Seville | Jesús Navas | real | en.wikipedia.org/wiki/Sevilla_Atlético |
| Tamaraceite | Las Palmas | Juan Guedes | real | en.wikipedia.org/wiki/UD_Tamaraceite |
| Tenerife B (filial de Tenerife) | Santa Cruz de Tenerife | Centro Insular | real | en.wikipedia.org/wiki/CD_Tenerife_B |
| Xerez | Jerez de la Frontera | Chapín | real | en.wikipedia.org/wiki/Xerez_CD |

#### España · Segunda Federación · Grupo 5 (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Segunda_Federación  
5 grupos de 18, ida y vuelta. Sube el campeón de cada grupo; del 2º al 5º juegan cinco llaves de playoff a partido único y suben los 5 ganadores. Los descensos a Tercera Federación no se simulan (esa división no está cargada).

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Alcalá | Alcalá de Henares | Municipal del Val | real | en.wikipedia.org/wiki/RSD_Alcalá |
| Atlético Albacete (filial de Albacete) | Albacete | Ciudad Deportiva Andrés Iniesta | real | en.wikipedia.org/wiki/Atlético_Albacete |
| Atlético Madrid C (filial de Atlético de Madrid) | Majadahonda | Cerro del Espino | real | en.wikipedia.org/wiki/Atlético_Madrid_C |
| Atlético Paso | El Paso | Municipal El Paso | real | en.wikipedia.org/wiki/CD_Atlético_Paso |
| Atlético Tordesillas | Tordesillas | Las Salinas | real | en.wikipedia.org/wiki/Atlético_Tordesillas |
| Ávila | Ávila | Adolfo Suárez | real | en.wikipedia.org/wiki/Real_Ávila_CF |
| Calvo Sotelo | Puertollano | Ciudad de Puertollano | real | en.wikipedia.org/wiki/Calvo_Sotelo_Puertollano_CF |
| Conquense | Cuenca | La Fuensanta | real | en.wikipedia.org/wiki/UB_Conquense |
| Getafe B (filial de Getafe) | Getafe | Ciudad Deportiva | real | en.wikipedia.org/wiki/Getafe_CF_B |
| Gimnástica Segoviana | Segovia | La Albuera | real | en.wikipedia.org/wiki/Gimnástica_Segoviana_CF |
| CD Guadalajara | Guadalajara | Pedro Escartín | real | en.wikipedia.org/wiki/CD_Guadalajara_(Spain) |
| Navalcarnero | Navalcarnero | Mariano González | real | en.wikipedia.org/wiki/CDA_Navalcarnero |
| Numancia | Soria | Los Pajaritos | real | en.wikipedia.org/wiki/CD_Numancia |
| Real Madrid C (filial de Real Madrid) | Madrid | Ciudad Real Madrid | real | en.wikipedia.org/wiki/Real_Madrid_C |
| Salamanca | Salamanca | Helmántico | real | en.wikipedia.org/wiki/Salamanca_CF_UDS |
| San Sebastián de los Reyes | San Sebastián de los Reyes | Matapiñonera | real | en.wikipedia.org/wiki/UD_San_Sebastián_de_los_Reyes |
| Talavera de la Reina | Talavera de la Reina | El Prado | real | en.wikipedia.org/wiki/CF_Talavera_de_la_Reina |
| Valladolid Promesas (filial de Valladolid) | Valladolid | Anexos José Zorrilla | real | en.wikipedia.org/wiki/Real_Valladolid_Promesas |

#### Italia · Serie B (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Serie_B  
20 equipos, ida y vuelta. Suben 1º y 2º; playoff del 3º al 8º (preliminar a partido único, semis y final ida y vuelta). Bajan los 3 últimos y el perdedor del playout 16º-17º.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Arezzo | Arezzo | Stadio Città di Arezzo | real | en.wikipedia.org/wiki/SS_Arezzo |
| Ascoli | Ascoli Piceno | Stadio Cino e Lillo Del Duca | real | en.wikipedia.org/wiki/Ascoli_Calcio_1898_FC |
| Avellino | Avellino | Stadio Partenio-Adriano Lombardi | real | en.wikipedia.org/wiki/US_Avellino_1912 |
| Benevento | Benevento | Stadio Ciro Vigorito | real | en.wikipedia.org/wiki/Benevento_Calcio |
| Carrarese | Carrara | Stadio dei Marmi | real | en.wikipedia.org/wiki/Carrarese_Calcio_1908 |
| Catanzaro | Catanzaro | Stadio Nicola Ceravolo | real | en.wikipedia.org/wiki/US_Catanzaro_1929 |
| Cesena | Cesena | Stadio Dino Manuzzi | genérico | en.wikipedia.org/wiki/Cesena_FC |
| Cremonese | Cremona | Stadio Giovanni Zini | real | en.wikipedia.org/wiki/US_Cremonese |
| Empoli | Empoli | Stadio Carlo Castellani | real | en.wikipedia.org/wiki/Empoli_FC |
| Hellas Verona | Verona | Stadio Marcantonio Bentegodi | real | en.wikipedia.org/wiki/Hellas_Verona_FC |
| Juve Stabia | Castellammare di Stabia | Stadio Comunale Romeo Menti | real | en.wikipedia.org/wiki/SS_Juve_Stabia |
| Mantova | Mantua | Stadio Danilo Martelli | real | en.wikipedia.org/wiki/Mantova_1911 |
| Modena | Modena | Stadio Alberto Braglia | real | en.wikipedia.org/wiki/Modena_FC_2018 |
| Padova | Padua | Stadio Comunale Euganeo | real | en.wikipedia.org/wiki/Calcio_Padova |
| Palermo | Palermo | Stadio Renzo Barbera | real | en.wikipedia.org/wiki/Palermo_FC |
| Pisa | Pisa | Arena Garibaldi | real | en.wikipedia.org/wiki/Pisa_SC |
| Sampdoria | Genoa | Stadio Luigi Ferraris | real | en.wikipedia.org/wiki/Sampdoria |
| Südtirol | Bolzano | Stadio Marco Druso | real | en.wikipedia.org/wiki/FC_Südtirol |
| Vicenza | Vicenza | Stadio Romeo Menti | real | en.wikipedia.org/wiki/LR_Vicenza |
| Virtus Entella | Chiavari | Stadio Comunale | real | en.wikipedia.org/wiki/Virtus_Entella |

#### Italia · Serie C · Grupo A (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Serie_C  
3 grupos de 20, ida y vuelta. Sube el campeón de cada grupo y el ganador del playoff (en el juego: los tres 2º y el mejor 3º, semis y final ida y vuelta; el playoff real es más largo). Los descensos a Serie D no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| AlbinoLeffe | Albino and Leffe | AlbinoLeffe Stadium (Zanica) | genérico | en.wikipedia.org/wiki/UC_AlbinoLeffe |
| Alcione Milano | Milan | Ernesto Breda (Sesto San Giovanni) | real | en.wikipedia.org/wiki/Alcione_Milano |
| Arzignano Valchiampo | Arzignano | Tommaso Dal Molin | real | en.wikipedia.org/wiki/FC_Arzignano_Valchiampo |
| Carpi | Carpi | Sandro Cabassi | real | en.wikipedia.org/wiki/AC_Carpi |
| Cittadella | Cittadella | Piercesare Tombolato | real | en.wikipedia.org/wiki/AS_Cittadella |
| Desenzano | Desenzano del Garda | Comunale Gino Corioni (Ospitaletto) | real | en.wikipedia.org/wiki/Calcio_Desenzano_SSD |
| Dolomiti Bellunesi | Belluno, Feltre and Sedico | Zugni Tauro (Feltre) | real | en.wikipedia.org/wiki/Dolomiti_Bellunesi_(football_club) |
| Folgore Caratese | Carate Brianza | XXV Aprile | real | en.wikipedia.org/wiki/US_Folgore_Caratese_ASD |
| Giana Erminio | Gorgonzola | Città di Gorgonzola | real | en.wikipedia.org/wiki/AS_Giana_Erminio |
| Juventus Next Gen (filial de Juventus) | Turin | Giuseppe Moccagatta (Alessandria) | real | en.wikipedia.org/wiki/Juventus_Next_Gen |
| Lecco | Lecco | Rigamonti-Ceppi | real | en.wikipedia.org/wiki/Calcio_Lecco_1912 |
| Lumezzane | Lumezzane | Tullio Saleri | real | en.wikipedia.org/wiki/FC_Lumezzane |
| Novara | Novara | Silvio Piola (Novara) | real | en.wikipedia.org/wiki/Novara_FC |
| Ospitaletto | Ospitaletto | Comunale Gino Corioni | real | en.wikipedia.org/wiki/AC_Ospitaletto_Franciacorta |
| Pergolettese | Crema | Giuseppe Voltini | genérico | en.wikipedia.org/wiki/US_Pergolettese_1932 |
| Pro Vercelli | Vercelli | Silvio Piola (Vercelli) | real | en.wikipedia.org/wiki/FC_Pro_Vercelli_1892 |
| Renate | Renate | XXV Aprile (Carate Brianza) | real | en.wikipedia.org/wiki/AC_Renate |
| Trento | Trento | Briamasco | real | en.wikipedia.org/wiki/AC_Trento_1921 |
| Treviso | Treviso | Omobono Tenni | real | en.wikipedia.org/wiki/Treviso_FBC |
| Union Brescia | Brescia | Mario Rigamonti | real | en.wikipedia.org/wiki/Union_Brescia |

#### Italia · Serie C · Grupo B (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Serie_C  
3 grupos de 20, ida y vuelta. Sube el campeón de cada grupo y el ganador del playoff (en el juego: los tres 2º y el mejor 3º, semis y final ida y vuelta; el playoff real es más largo). Los descensos a Serie D no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Atalanta U23 (filial de Atalanta) | Bergamo | Comunale di Caravaggio (Caravaggio) | real | en.wikipedia.org/wiki/Atalanta_Under_23 |
| Campobasso | Campobasso | Antonio Molinari | real | en.wikipedia.org/wiki/Campobasso_FC |
| Forlì | Forlì | Tullo Morgagni | real | en.wikipedia.org/wiki/Forlì_FC |
| Grosseto | Grosseto | Carlo Zecchini | real | en.wikipedia.org/wiki/US_Grosseto_1912 |
| Gubbio | Gubbio | Pietro Barbetti | real | en.wikipedia.org/wiki/AS_Gubbio_1910 |
| Guidonia Montecelio | Guidonia Montecelio | Comunale di Guidonia Montecelio | real | en.wikipedia.org/wiki/Guidonia_Montecelio_1937_FC |
| Latina | Latina | Domenico Francioni | real | en.wikipedia.org/wiki/Latina_Calcio_1932 |
| Livorno | Livorno | Armando Picchi | real | en.wikipedia.org/wiki/US_Livorno_1915 |
| Ostia Mare | Ostia, Rome | Pasquale Giannattasio | real | en.wikipedia.org/wiki/AS_Ostia_Mare_Lido_Calcio |
| Pescara | Pescara | Stadio Adriatico – Giovanni Cornacchia | real | en.wikipedia.org/wiki/Delfino_Pescara_1936 |
| Perugia | Perugia | Renato Curi | real | en.wikipedia.org/wiki/AC_Perugia_Calcio |
| Pianese | Piancastagnaio | Comunale di Piancastagnaio | real | en.wikipedia.org/wiki/US_Pianese |
| Pineto | Pineto | Pavone-Mariani | real | en.wikipedia.org/wiki/AS_Pineto_Calcio |
| Ravenna | Ravenna | Bruno Benelli | real | en.wikipedia.org/wiki/Ravenna_FC |
| Reggiana | Reggio Emilia | MAPEI Stadium - Città del Tricolore | real | en.wikipedia.org/wiki/AC_Reggiana_1919 |
| Sambenedettese | San Benedetto del Tronto | Riviera delle Palme | real | en.wikipedia.org/wiki/US_Sambenedettese |
| Spezia | La Spezia | Stadio Alberto Picco | real | en.wikipedia.org/wiki/Spezia_Calcio |
| Torres | Sassari | Vanni Sanna | real | en.wikipedia.org/wiki/SEF_Torres_1903 |
| Vado | Vado Ligure | Giuseppe Sivori (Sestri Levante) | real | en.wikipedia.org/wiki/FC_Vado |
| Vis Pesaro | Pesaro | Tonino Benelli | real | en.wikipedia.org/wiki/Vis_Pesaro_dal_1898 |

#### Italia · Serie C · Grupo C (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Serie_C  
3 grupos de 20, ida y vuelta. Sube el campeón de cada grupo y el ganador del playoff (en el juego: los tres 2º y el mejor 3º, semis y final ida y vuelta; el playoff real es más largo). Los descensos a Serie D no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Altamura | Altamura | Antonio D'Angelo | genérico | en.wikipedia.org/wiki/ASD_Team_Altamura |
| Audace Cerignola | Cerignola | Domenico Monterisi | real | en.wikipedia.org/wiki/SS_Audace_Cerignola |
| Bari | Bari | San Nicola | real | en.wikipedia.org/wiki/SSC_Bari |
| Barletta | Barletta | Cosimo Puttilli | real | en.wikipedia.org/wiki/SSD_Barletta_1922 |
| Casarano | Casarano | Giuseppe Capozza | real | en.wikipedia.org/wiki/Casarano_Calcio |
| Casertana | Caserta | Alberto Pinto | real | en.wikipedia.org/wiki/Casertana_FC |
| Catania | Catania | Angelo Massimino | real | en.wikipedia.org/wiki/Catania_FC |
| Cavese | Cava de' Tirreni | Simonetta Lamberti | real | en.wikipedia.org/wiki/Cavese_1919 |
| Cosenza | Cosenza | San Vito-Gigi Marulla | real | en.wikipedia.org/wiki/Cosenza_Calcio |
| Crotone | Crotone | Ezio Scida | real | en.wikipedia.org/wiki/FC_Crotone |
| Foggia | Foggia | Pino Zaccheria | real | en.wikipedia.org/wiki/Calcio_Foggia_1920 |
| Giugliano | Giugliano in Campania | Alberto De Cristofaro | real | en.wikipedia.org/wiki/Giugliano_Calcio_1928 |
| Inter Milan U23 (filial de Inter) | Milan | Ernesto Breda (Sesto San Giovanni) | real | en.wikipedia.org/wiki/Inter_Milan_Under-23 |
| Monopoli | Monopoli | Vito Simone Veneziani | real | en.wikipedia.org/wiki/SS_Monopoli_1966 |
| Picerno | Picerno | Donato Curcio | real | en.wikipedia.org/wiki/AZ_Picerno |
| Potenza | Potenza | Alfredo Viviani | real | en.wikipedia.org/wiki/Potenza_Calcio |
| Salernitana | Salerno | Stadio Arechi | real | en.wikipedia.org/wiki/US_Salernitana_1919 |
| Savoia | Torre Annunziata | Alfredo Giraud | real | en.wikipedia.org/wiki/SSD_Savoia_1908_FC |
| Scafatese | Scafati | Giovanni Vitiello | real | en.wikipedia.org/wiki/Scafatese_Calcio_1922 |
| Sorrento | Sorrento | Italia | real | en.wikipedia.org/wiki/Sorrento_Calcio_1945 |

#### Alemania · 2. Bundesliga (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_2._Bundesliga  
18 equipos, ida y vuelta. Suben 1º y 2º; el 3º juega la promoción con el 16º de la Bundesliga. Bajan 17º y 18º; el 16º juega la promoción con el 3º de la 3. Liga.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Hertha BSC | Berlin | Olympiastadion | real | en.wikipedia.org/wiki/Hertha_BSC |
| Arminia Bielefeld | Bielefeld | Schüco-Arena | real | en.wikipedia.org/wiki/Arminia_Bielefeld |
| VfL Bochum | Bochum | Vonovia Ruhrstadion | real | en.wikipedia.org/wiki/VfL_Bochum |
| Eintracht Braunschweig | Braunschweig | Eintracht-Stadion | real | en.wikipedia.org/wiki/Eintracht_Braunschweig |
| Energie Cottbus | Cottbus | LEAG Energie Stadion | real | en.wikipedia.org/wiki/FC_Energie_Cottbus |
| Darmstadt 98 | Darmstadt | Merck-Stadion am Böllenfalltor | real | en.wikipedia.org/wiki/SV_Darmstadt_98 |
| Dynamo Dresden | Dresden | Rudolf-Harbig-Stadion | real | en.wikipedia.org/wiki/Dynamo_Dresden |
| Greuther Fürth | Fürth | Sportpark Ronhof Thomas Sommer | real | en.wikipedia.org/wiki/SpVgg_Greuther_Fürth |
| Hannover 96 | Hanover | Heinz von Heiden Arena | real | en.wikipedia.org/wiki/Hannover_96 |
| 1. FC Heidenheim | Heidenheim | Voith-Arena | real | en.wikipedia.org/wiki/1._FC_Heidenheim |
| 1. FC Kaiserslautern | Kaiserslautern | Fritz-Walter-Stadion | real | en.wikipedia.org/wiki/1._FC_Kaiserslautern |
| Karlsruher SC | Karlsruhe | BBBank Wildpark | real | en.wikipedia.org/wiki/Karlsruher_SC |
| Holstein Kiel | Kiel | Holstein-Stadion | real | en.wikipedia.org/wiki/Holstein_Kiel |
| 1. FC Magdeburg | Magdeburg | Avnet Arena | real | en.wikipedia.org/wiki/1._FC_Magdeburg |
| 1. FC Nürnberg | Nuremberg | Max-Morlock-Stadion | real | en.wikipedia.org/wiki/1._FC_Nürnberg |
| VfL Osnabrück | Osnabrück | Stadion an der Bremer Brücke | real | en.wikipedia.org/wiki/VfL_Osnabrück |
| FC St. Pauli | Hamburg | Millerntor-Stadion | real | en.wikipedia.org/wiki/FC_St._Pauli |
| VfL Wolfsburg | Wolfsburg | Volkswagen Arena | real | en.wikipedia.org/wiki/VfL_Wolfsburg |

#### Alemania · 3. Liga (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_3._Liga  
20 equipos, ida y vuelta. Suben 1º y 2º; el 3º juega la promoción con el 16º de la 2. Bundesliga. Los segundos equipos no pueden subir a la 2. Bundesliga. Los descensos a la Regionalliga no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Alemannia Aachen | Aachen | Tivoli | real | en.wikipedia.org/wiki/Alemannia_Aachen |
| MSV Duisburg | Duisburg | Schauinsland-Reisen-Arena | real | en.wikipedia.org/wiki/MSV_Duisburg |
| Fortuna Düsseldorf | Düsseldorf | Merkur Spiel-Arena | real | en.wikipedia.org/wiki/Fortuna_Düsseldorf |
| Rot-Weiss Essen | Essen | Stadion an der Hafenstraße | real | en.wikipedia.org/wiki/Rot-Weiss_Essen |
| Sonnenhof Großaspach | Aspach | WIRmachenDRUCK Arena | real | en.wikipedia.org/wiki/SG_Sonnenhof_Großaspach |
| TSV Havelse | Hanover | Eilenriedestadion Heinz von Heiden Arena 1 | real | en.wikipedia.org/wiki/TSV_Havelse |
| TSG Hoffenheim II | Sinsheim | Dietmar-Hopp-Stadion | real | en.wikipedia.org/wiki/TSG_1899_Hoffenheim_II |
| FC Ingolstadt | Ingolstadt | Audi Sportpark | real | en.wikipedia.org/wiki/FC_Ingolstadt_04 |
| Fortuna Köln | Cologne | Südstadion | real | en.wikipedia.org/wiki/SC_Fortuna_Köln |
| Viktoria Köln | Cologne | Sportpark Höhenberg | real | en.wikipedia.org/wiki/FC_Viktoria_Köln |
| Waldhof Mannheim | Mannheim | Carl-Benz-Stadion | real | en.wikipedia.org/wiki/SV_Waldhof_Mannheim |
| SV Meppen | Meppen | Hänsch-Arena | real | en.wikipedia.org/wiki/SV_Meppen |
| Preußen Münster | Münster | LVM-Preußenstadion | real | en.wikipedia.org/wiki/SC_Preußen_Münster |
| Jahn Regensburg | Regensburg | Jahnstadion Regensburg | real | en.wikipedia.org/wiki/SSV_Jahn_Regensburg |
| Hansa Rostock | Rostock | Ostseestadion | real | en.wikipedia.org/wiki/FC_Hansa_Rostock |
| 1. FC Saarbrücken | Saarbrücken | Ludwigsparkstadion | real | en.wikipedia.org/wiki/1._FC_Saarbrücken |
| VfB Stuttgart II | Aspach | WIRmachenDRUCK Arena 2 | real | en.wikipedia.org/wiki/VfB_Stuttgart_II |
| SC Verl | Verl | Sportclub Arena | real | en.wikipedia.org/wiki/SC_Verl |
| Wehen Wiesbaden | Wiesbaden | BRITA-Arena | real | en.wikipedia.org/wiki/SV_Wehen_Wiesbaden |
| Würzburger Kickers | Würzburg | Akon Arena | real | en.wikipedia.org/wiki/FC_Würzburger_Kickers |

#### Francia · Ligue 2 (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Ligue_2  
18 equipos, ida y vuelta. Suben 1º y 2º; playoff 4º-5º, el ganador contra el 3º y después la barrage (ida y vuelta) con el 16º de la Ligue 1. Bajan 17º y 18º; el 16º juega la barrage con el ganador del playoff de la Ligue 3.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Annecy | Annecy | Parc des Sports | real | en.wikipedia.org/wiki/FC_Annecy |
| Boulogne | Boulogne-sur-Mer | Stade de la Libération | real | en.wikipedia.org/wiki/US_Boulogne |
| Clermont | Clermont-Ferrand | Stade Gabriel-Montpied | real | en.wikipedia.org/wiki/Clermont_Foot |
| Dijon | Dijon | Stade Gaston Gérard | real | en.wikipedia.org/wiki/Dijon_FCO |
| Dunkerque | Dunkirk | Stade Marcel-Tribut | real | en.wikipedia.org/wiki/USL_Dunkerque |
| Grenoble | Grenoble | Stade des Alpes | real | en.wikipedia.org/wiki/Grenoble_Foot_38 |
| Guingamp | Guingamp | Stade de Roudourou | real | en.wikipedia.org/wiki/En_Avant_Guingamp |
| Laval | Laval | Stade Francis Le Basser | real | en.wikipedia.org/wiki/Stade_Lavallois |
| Metz | Longeville-lès-Metz | Stade Saint-Symphorien | real | en.wikipedia.org/wiki/FC_Metz |
| Montpellier | Montpellier | Stade de la Mosson | real | en.wikipedia.org/wiki/Montpellier_HSC |
| Nancy | Tomblaine | Stade Marcel Picot | real | en.wikipedia.org/wiki/AS_Nancy_Lorraine |
| Nantes | Nantes | Stade de la Beaujoire | real | en.wikipedia.org/wiki/FC_Nantes |
| Pau | Pau | Nouste Camp | real | en.wikipedia.org/wiki/Pau_FC |
| Red Star | Paris (Saint-Ouen) | Stade Bauer | real | en.wikipedia.org/wiki/Red_Star_FC |
| Reims | Reims | Stade Auguste-Delaune | real | en.wikipedia.org/wiki/Stade_de_Reims |
| Rodez | Rodez | Stade Paul-Lignon | real | en.wikipedia.org/wiki/Rodez_AF |
| Saint-Étienne | Saint-Étienne | Stade Geoffroy-Guichard | real | en.wikipedia.org/wiki/AS_Saint-Étienne |
| Sochaux | Montbéliard | Stade Auguste-Bonal | real | en.wikipedia.org/wiki/FC_Sochaux-Montbéliard |

#### Francia · Ligue 3 (ex National) (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Ligue_3  
18 equipos, ida y vuelta (la ex National, desde 2026/27 se llama Ligue 3). Suben 1º y 2º; playoff 3º-6º y el ganador juega la barrage con el 16º de la Ligue 2. Los descensos a National 2 no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Amiens | Amiens | Stade de la Licorne | real | en.wikipedia.org/wiki/Amiens_SC |
| Aubagne Air Bel | Aubagne | Stade de Lattre-de-Tassigny | real | en.wikipedia.org/wiki/SC_Aubagne_Air_Bel |
| Bastia | Bastia | Stade Armand-Cesari | real | en.wikipedia.org/wiki/SC_Bastia |
| Bourg-Péronnas | Bourg-en-Bresse | Stade Marcel-Verchère | real | en.wikipedia.org/wiki/Football_Bourg-en-Bresse_Péronnas_01 |
| Caen | Caen | Stade Michel d'Ornano | real | en.wikipedia.org/wiki/Stade_Malherbe_Caen |
| Cannes | Cannes | Stade Pierre de Coubertin | real | en.wikipedia.org/wiki/AS_Cannes |
| Concarneau | Concarneau | — | real | en.wikipedia.org/wiki/US_Concarneau |
| Fleury | Fleury-Mérogis | Stade Auguste Gentelet | real | en.wikipedia.org/wiki/FC_Fleury_91_(men) |
| La Roche | La Roche-sur-Yon | Stade Henri Desgranges | real | en.wikipedia.org/wiki/VFC_La_Roche-sur-Yon |
| Le Puy | Le Puy-en-Velay | Stade Charles Massot | real | en.wikipedia.org/wiki/Le_Puy_Foot_43_Auvergne |
| Orléans | Orléans | Stade de la Source | real | en.wikipedia.org/wiki/US_Orléans |
| Paris 13 Atletico | Paris (Paris 13) | Stade Sébastien Charléty | real | en.wikipedia.org/wiki/Paris_13_Atletico |
| Quevilly-Rouen | Le Petit-Quevilly | Stade Robert Diochon | real | en.wikipedia.org/wiki/US_Quevilly-Rouen_Métropole |
| Rouen | Le Petit-Quevilly | Stade Robert Diochon | real | en.wikipedia.org/wiki/Football_Club_de_Rouen_1899 |
| Thionville | Thionville | Stade de la Plaine | real | en.wikipedia.org/wiki/US_Thionville_Lusitanos |
| Valenciennes | Valenciennes | Stade du Hainaut | real | en.wikipedia.org/wiki/Valenciennes_FC |
| Versailles | Versailles | Stade de Montbauron | real | en.wikipedia.org/wiki/FC_Versailles_78 |
| Villefranche | Villefranche-sur-Saône | Stade Armand Chouffet | real | en.wikipedia.org/wiki/FC_Villefranche_Beaujolais |

#### Portugal · Liga Portugal 2 (18 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Liga_Portugal_2  
18 equipos, ida y vuelta. Suben 1º y 2º; el 3º juega la promoción con el 16º de la Liga Portugal. Bajan 17º y 18º; el 16º juega la promoción con el 3º de la fase de ascenso de la Liga 3. Las filiales no pueden subir a primera.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Académica de Coimbra | Coimbra | Estádio Cidade de Coimbra | real | en.wikipedia.org/wiki/Académica_de_Coimbra_(football) |
| AFS | Vila das Aves | Estádio do Clube Desportivo das Aves | real | en.wikipedia.org/wiki/AVS_Futebol_SAD |
| Amarante | Amarante | Estádio Municipal de Amarante | real | en.wikipedia.org/wiki/Amarante_F.C. |
| Benfica B (filial de Benfica) | Seixal | Benfica Campus - Campo n.° 1 | real | en.wikipedia.org/wiki/S.L._Benfica_B |
| Chaves | Chaves | Estádio Municipal Eng.° Manuel Branco Teixeira | real | en.wikipedia.org/wiki/G.D._Chaves |
| Farense | Faro | Estádio de São Luís | real | en.wikipedia.org/wiki/S.C._Farense |
| Feirense | Santa Maria da Feira | Estádio Marcolino Castro | real | en.wikipedia.org/wiki/C.D._Feirense |
| Felgueiras | Felgueiras | Estádio Dr. Machado de Matos | real | en.wikipedia.org/wiki/F.C._Felgueiras_(2006) |
| Leixões | Matosinhos | Estádio do Mar | real | en.wikipedia.org/wiki/Leixões_S.C. |
| Lusitânia Lourosa | Lourosa | Estádio do Lusitânia de Lourosa FC | real | en.wikipedia.org/wiki/Lusitânia_F.C. |
| Penafiel | Penafiel | Estádio Municipal 25 de Abril | real | en.wikipedia.org/wiki/F.C._Penafiel |
| Portimonense | Portimão | Estádio Municipal de Portimão | real | en.wikipedia.org/wiki/Portimonense_S.C. |
| Porto B (filial de Porto) | Vila Nova de Gaia | Estádio Luís Filipe Menezes | real | en.wikipedia.org/wiki/FC_Porto_B |
| Sporting CP B (filial de Sporting CP) | Alcochete | Estádio Aurélio Pereira | real | en.wikipedia.org/wiki/Sporting_CP_B |
| Tondela | Tondela | Estádio João Cardoso | real | en.wikipedia.org/wiki/C.D._Tondela |
| Torreense | Torres Vedras | Estádio Manuel Marques | real | en.wikipedia.org/wiki/S.C.U._Torreense |
| União de Leiria | Leiria | Estádio Dr. Magalhães Pessoa | real | en.wikipedia.org/wiki/U.D._Leiria |
| Vizela | Vizela | Estádio do Futebol Clube de Vizela | real | en.wikipedia.org/wiki/F.C._Vizela |

#### Portugal · Liga 3 · Serie A (10 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Liga_3_(Portugal)  
2 series de 10, ida y vuelta. Los 4 primeros de cada serie juegan la fase de ascenso (en el juego se simula): suben los 2 primeros y el 3º juega la promoción con el 16º de la Liga Portugal 2. Los descensos al Campeonato de Portugal no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Fafe | Fafe | Estádio Municipal de Fafe | real | en.wikipedia.org/wiki/AD_Fafe |
| Leça | Leça da Palmeira | Estádio do Leça FC | real | en.wikipedia.org/wiki/Leça_Futebol_Clube |
| Marco 09 | Marco de Canaveses | Estádio Municipal do Marco de Canaveses | real | en.wikipedia.org/wiki/A.D._Marco_09 |
| Paços de Ferreira | Paços de Ferreira | Estádio Capital do Móvel | real | en.wikipedia.org/wiki/F.C._Paços_de_Ferreira |
| Paredes | Paredes | Estádio Municipal das Laranjeiras | real | en.wikipedia.org/wiki/U.S.C._Paredes |
| São João de Ver | Santa Maria da Feira | Estádio Sporting Clube São João de Ver | real | en.wikipedia.org/wiki/SC_São_João_de_Ver |
| Trofense | Trofa | Estádio do Clube Desportivo Trofense | real | en.wikipedia.org/wiki/C.D._Trofense |
| Varzim | Póvoa de Varzim | Estádio do Varzim Sport Club | real | en.wikipedia.org/wiki/Varzim_S.C. |
| Vianense | Viana do Castelo | Estádio Dr. José de Matos | real | en.wikipedia.org/wiki/SC_Vianense |
| Vitória SC B (filial de Vitória SC) | Guimarães | Academia Vitória Sport Clube | real | en.wikipedia.org/wiki/Vitória_S.C._B |

#### Portugal · Liga 3 · Serie B (10 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Liga_3_(Portugal)  
2 series de 10, ida y vuelta. Los 4 primeros de cada serie juegan la fase de ascenso (en el juego se simula): suben los 2 primeros y el 3º juega la promoción con el 16º de la Liga Portugal 2. Los descensos al Campeonato de Portugal no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Atlético CP | Lisbon | Estádio da Tapadinha | real | en.wikipedia.org/wiki/Atlético_Clube_de_Portugal |
| Belenenses | Lisbon | Estádio do Restelo | real | en.wikipedia.org/wiki/C.F._Os_Belenenses |
| Caldas | Caldas da Rainha | Campo da Mata | real | en.wikipedia.org/wiki/Caldas_S.C. |
| Louletano | Loulé | Estádio Algarve | real | en.wikipedia.org/wiki/Louletano_Desportos_Clube |
| Lusitano Évora | Évora | Campo Estrela | real | en.wikipedia.org/wiki/Lusitano_G.C. |
| Mafra | Mafra | Estádio Municipal de Mafra | real | en.wikipedia.org/wiki/C.D._Mafra |
| Oliveirense | Oliveira de Azeméis | Estádio Carlos Osório | real | en.wikipedia.org/wiki/U.D._Oliveirense |
| Sp. Covilhã | Covilhã | Estádio Municipal José dos Santos Pinto | real | en.wikipedia.org/wiki/S.C._Covilhã |
| União de Santarém | Santarém | Campo Chã das Padeiras | real | en.wikipedia.org/wiki/União_de_Santarém |
| Vitória Sernache | Cernache do Bonjardim | Estádio Municipal D. Nuno Álvares Pereira | real | en.wikipedia.org/wiki/G.D._Vitória_de_Sernache |

#### Países Bajos · Eerste Divisie (Keuken Kampioen Divisie) (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Eerste_Divisie  
20 equipos, ida y vuelta. Suben 1º y 2º; del 3º al 8º juegan el playoff con el 16º de la Eredivisie (en el juego: una llave de 7, todo ida y vuelta) y el ganador juega en la Eredivisie. Los equipos Jong no pueden subir. No hay descensos.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Almere City | Almere | Yanmar Stadion | real | en.wikipedia.org/wiki/Almere_City_FC |
| De Graafschap | Doetinchem | Stadion De Vijverberg | real | en.wikipedia.org/wiki/De_Graafschap |
| Den Bosch | 's-Hertogenbosch | Stadion De Vliert | real | en.wikipedia.org/wiki/FC_Den_Bosch |
| Dordrecht | Dordrecht | M-Scores Stadion | real | en.wikipedia.org/wiki/FC_Dordrecht |
| Eindhoven | Eindhoven | Jan Louwers Stadion | real | en.wikipedia.org/wiki/FC_Eindhoven |
| Emmen | Emmen | De Oude Meerdijk | real | en.wikipedia.org/wiki/FC_Emmen |
| Helmond Sport | Helmond | GS Staalwerken Stadion | real | en.wikipedia.org/wiki/Helmond_Sport |
| Heracles Almelo | Almelo | Asito Stadion | real | en.wikipedia.org/wiki/Heracles_Almelo |
| Jong Ajax (U23) | Amsterdam | Sportpark De Toekomst | real | en.wikipedia.org/wiki/Jong_Ajax |
| Jong AZ (U23) | Alkmaar | AFAS Trainingscomplex | real | en.wikipedia.org/wiki/Jong_AZ |
| Jong PSV (U23) | Eindhoven | PSV Campus De Herdgang | real | en.wikipedia.org/wiki/Jong_PSV |
| Jong FC Utrecht (U23) | Utrecht | Sportcomplex Zoudenbalch | real | en.wikipedia.org/wiki/Jong_FC_Utrecht |
| MVV Maastricht | Maastricht | Stadion De Geusselt | real | en.wikipedia.org/wiki/MVV_Maastricht |
| NAC Breda | Breda | Rat Verlegh Stadion | real | en.wikipedia.org/wiki/NAC_Breda |
| RKC Waalwijk | Waalwijk | Mandemakers Stadion | real | en.wikipedia.org/wiki/RKC_Waalwijk |
| Roda JC Kerkrade | Kerkrade | Parkstad Limburg Stadion | real | en.wikipedia.org/wiki/Roda_JC_Kerkrade |
| TOP Oss | Oss | Frans Heesenstadion | real | en.wikipedia.org/wiki/TOP_Oss |
| Vitesse | Arnhem | GelreDome | real | en.wikipedia.org/wiki/SBV_Vitesse |
| Volendam | Volendam | Kras Stadion | real | en.wikipedia.org/wiki/FC_Volendam |
| VVV-Venlo | Venlo | Covebo Stadion - De Koel | real | en.wikipedia.org/wiki/VVV-Venlo |

#### Bélgica · Challenger Pro League (15 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Challenger_Pro_League  
15 equipos (2026/27), ida y vuelta. Sube el campeón; del 2º al 5º juegan el playoff (semis y final ida y vuelta) y el ganador sube. Los equipos U23 no pueden subir. Los descensos a la Division 1 no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| K Beerschot VA | — | Olympisch Stadion Antwerp | real | en.wikipedia.org/wiki/K_Beerschot_VA |
| FCV Dender EH | Denderleeuw | Florent Beeckmanstadion | real | en.wikipedia.org/wiki/FCV_Dender_EH |
| KAS Eupen | — | Kehrwegstadion | real | en.wikipedia.org/wiki/KAS_Eupen |
| Francs Borains | Boussu | Stade Robert Urbain | real | en.wikipedia.org/wiki/Francs_Borains |
| Patro Eisden Maasmechelen | Maasmechelen | Gemeentelijk Sportparkstadion | real | en.wikipedia.org/wiki/Patro_Eisden_Maasmechelen |
| Sporting Hasselt | Hasselt | Stedelijk Sportstadion Hasselt | real | en.wikipedia.org/wiki/Sporting_Hasselt |
| Jong KAA Gent (U23) | — | Planet Group Arena | real | en.wikipedia.org/wiki/KAA_Gent |
| Royal Excelsior Virton | Virton | Stade Yvan Georges | real | en.wikipedia.org/wiki/Royal_Excelsior_Virton |
| KSC Lokeren | Lokeren | Daknamstadion | real | en.wikipedia.org/wiki/KSC_Lokeren_(2025) |
| Lierse SK | Lier | Herman Vanderpoortenstadion | real | en.wikipedia.org/wiki/Lierse_SK_(2018) |
| Club NXT (U23) | — | Schiervelde Stadion | real | en.wikipedia.org/wiki/Club_NXT |
| Jong Genk (U23) | — | Cegeka Arena | real | en.wikipedia.org/wiki/KRC_Genk |
| RFC Seraing | Seraing | Stade du Pairay | real | en.wikipedia.org/wiki/RFC_Seraing_(1922) |
| RFC Liège | — | Liège | real | en.wikipedia.org/wiki/RFC_Liège |
| RSCA Futures (U23) | — | Constant Vanden Stock Stadium | real | en.wikipedia.org/wiki/RSCA_Futures |

#### Escocia · Scottish Championship (10 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Scottish_Championship  
10 equipos, 4 ruedas (36 fechas). Sube el campeón; 2º, 3º y 4º juegan el playoff con el 11º de la Premiership (todo ida y vuelta). Baja el último; el 9º juega el playoff con 2º, 3º y 4º de League One.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Partick Thistle | — | Firhill Stadium | real | en.wikipedia.org/wiki/Partick_Thistle_F.C. |
| Livingston | Livingston | Almondvale Stadium | real | en.wikipedia.org/wiki/Livingston_F.C. |
| Stenhousemuir | — | Ochilview Park | real | en.wikipedia.org/wiki/Stenhousemuir_F.C. |
| Dunfermline Athletic | — | East End Park | real | en.wikipedia.org/wiki/Dunfermline_Athletic_F.C. |
| Raith Rovers | Kirkcaldy | Stark's Park | real | en.wikipedia.org/wiki/Raith_Rovers_F.C. |
| Inverness Caledonian Thistle | — | Caledonian Stadium | real | en.wikipedia.org/wiki/Inverness_Caledonian_Thistle_F.C. |
| Ayr United | — | Somerset Park | real | en.wikipedia.org/wiki/Ayr_United_F.C. |
| Arbroath | Arbroath | Gayfield Park | real | en.wikipedia.org/wiki/Arbroath_F.C. |
| Greenock Morton | — | Cappielow Park | real | en.wikipedia.org/wiki/Greenock_Morton_F.C. |
| Queen's Park | Glasgow | Lesser Hampden | real | en.wikipedia.org/wiki/Queen's_Park_F.C. |

#### Escocia · Scottish League One (10 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_Scottish_League_One  
10 equipos, 4 ruedas (36 fechas). Sube el campeón; 2º, 3º y 4º juegan el playoff con el 9º del Championship. Los descensos a League Two no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Ross County | Dingwall | Victoria Park | real | en.wikipedia.org/wiki/Ross_County_F.C. |
| Hamilton Academical | — | New Douglas Park | real | en.wikipedia.org/wiki/Hamilton_Academical_F.C. |
| East Kilbride | East Kilbride | K-Park Training Academy | real | en.wikipedia.org/wiki/East_Kilbride_F.C. |
| Airdrieonians | Airdrie | Excelsior Stadium | real | en.wikipedia.org/wiki/Airdrieonians_F.C. |
| Montrose | Montrose | Links Park | real | en.wikipedia.org/wiki/Montrose_F.C. |
| East Fife | Methil | Bayview Stadium | real | en.wikipedia.org/wiki/East_Fife_F.C. |
| Peterhead | Peterhead | Balmoor | real | en.wikipedia.org/wiki/Peterhead_F.C. |
| Cove Rangers | Aberdeen | Balmoral Stadium | real | en.wikipedia.org/wiki/Cove_Rangers_F.C. |
| Alloa Athletic | Alloa | Recreation Park | real | en.wikipedia.org/wiki/Alloa_Athletic_F.C. |
| Queen of the South | Dumfries | Palmerston Park | real | en.wikipedia.org/wiki/Queen_of_the_South_F.C. |

#### Turquía · TFF 1. Lig (20 clubes)

Fuente de la lista, estadios y ciudades: https://en.wikipedia.org/wiki/2026–27_TFF_1._Lig  
20 equipos, ida y vuelta. Suben 1º y 2º; playoff del 3º al 7º a partido único (el 3º espera en la final). Los descensos a la 2. Lig no se simulan.

| Club | Ciudad | Estadio | Escudo | Ficha del club (fuente) |
|---|---|---|---|---|
| Antalyaspor | Antalya | Antalya Stadium | real | en.wikipedia.org/wiki/Antalyaspor |
| Bandırmaspor | Bandırma | 17 Eylül Stadium | real | en.wikipedia.org/wiki/Bandırmaspor |
| Batman Petrolspor | Batman | Batman Stadium | genérico | en.wikipedia.org/wiki/Batman_Petrolspor |
| Bodrum | Bodrum | Bodrum District Stadium | real | en.wikipedia.org/wiki/Bodrum_F.K. |
| Boluspor | Bolu | Bolu Atatürk Stadium | real | en.wikipedia.org/wiki/Boluspor |
| Bursaspor | Bursa | Bursa Metropolitan Stadium | real | en.wikipedia.org/wiki/Bursaspor |
| Esenler Erokspor | Esenler | Esenler Stadium | real | en.wikipedia.org/wiki/Esenler_Erokspor |
| Fatih Karagümrük | Fatih | Atatürk Olympic Stadium | real | en.wikipedia.org/wiki/Fatih_Karagümrük_S.K. |
| Iğdır | Iğdır | Iğdır City Stadium | real | en.wikipedia.org/wiki/Iğdır_F.K. |
| İstanbulspor | Büyükçekmece | Esenyurt Necmi Kadıoğlu Stadium | real | en.wikipedia.org/wiki/İstanbulspor |
| Kayserispor | Kayseri | Kadir Has Stadium | real | en.wikipedia.org/wiki/Kayserispor |
| Keçiörengücü | Keçiören | Ankara Aktepe Stadium | real | en.wikipedia.org/wiki/Ankara_Keçiörengücü_SK |
| Manisa | Manisa | Manisa 19 Mayıs Stadium | real | en.wikipedia.org/wiki/Manisa_F.K. |
| Mardin 1969 | Mardin | 21 Kasım Stadium | genérico | en.wikipedia.org/wiki/Mardin_1969_S.K. |
| Muğlaspor | Muğla | Muğla Atatürk Stadium | genérico | en.wikipedia.org/wiki/Muğlaspor |
| Pendikspor | Pendik | Pendik Stadium | real | en.wikipedia.org/wiki/Pendikspor |
| Sarıyer | Sarıyer | Yusuf Ziya Öniş Stadium | real | en.wikipedia.org/wiki/Sarıyer_S.K. |
| Sivasspor | Sivas | New Sivas 4 Eylül Stadium | real | en.wikipedia.org/wiki/Sivasspor |
| Ümraniyespor | Ümraniye | Ümraniye Municipality City Stadium | real | en.wikipedia.org/wiki/Ümraniyespor |
| Vanspor | Van | Van Atatürk Stadium | real | en.wikipedia.org/wiki/Vanspor_F.K. |


## Parte 2 · América

Pendiente.
