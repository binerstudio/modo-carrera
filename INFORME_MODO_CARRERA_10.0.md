# MODO CARRERA 10.0 — Informe de entrega

Actualización construida sobre MODO CARRERA 6.5 (Estadio). No se reconstruyó el juego: se agregó una capa nueva (`data/mundo.js`, `js/mc10-datos.js`, `js/mc10-liga.js`, `js/mc10-mundo.js`, `js/mc10-ui.js`) y se mantuvieron todas las funciones existentes (simulador minuto a minuto, tácticas, plantel, administrador de jugadores, copias de seguridad, migraciones, idioma, borrar carrera).

## 1. Totales

- **Ligas jugables:** 188 (una primera división por país).
- **Países:** 188.
- **Clubes:** 2.329.
- **Jugadores en la base global (y en el mercado):** 51.717.
- **Nacionalidades distintas:** 213.
- Jugadores extraídos de los PDF: 50.782; Liga Argentina conservada intacta; Portugal se mantiene con la base anterior (no llegó PDF).

## 2. Países, ligas y clubes por confederación

Formato: ✔ = formato real confirmado · ≈ = formato adaptado al simulador (ver nota de cada liga en el juego).

### UEFA (51 ligas · 708 clubes · 18.848 jugadores)

| País | Liga | Clubes | Jugadores | Fechas | Copa(s) | Formato |
|---|---|---|---|---|---|---|
| Albania | Kategoria Superiore | 10 | 274 | 36 | Copa de Albania | ✔ |
| Alemania | Bundesliga | 18 | 519 | 34 | DFB-Pokal | ✔ |
| Andorra | Primera Divisió | 10 | 244 | 24 | Copa Constitució | ≈ |
| Armenia | Premier League de Armenia | 12 | 319 | 33 | Copa de Armenia | ≈ |
| Austria | Bundesliga austríaca | 12 | 352 | 32 | ÖFB-Cup | ✔ |
| Azerbaiyán | Premyer Liqası | 12 | 303 | 33 | Copa de Azerbaiyán | ≈ |
| Bielorrusia | Vysheyshaya Liga | 16 | 397 | 30 | Copa de Bielorrusia | ✔ |
| Bosnia y Herzegovina | Premijer liga | 10 | 248 | 36 | Copa de Bosnia | ≈ |
| Bulgaria | efbet Liga | 14 | 381 | 32 | Copa de Bulgaria | ≈ |
| Bélgica | Jupiler Pro League | 18 | 532 | 44 | Copa de Bélgica | ≈ |
| Chequia | Chance Liga | 16 | 471 | 35 | Copa de Chequia | ≈ |
| Chipre | Cyprus League | 14 | 405 | 36 | Copa de Chipre | ✔ |
| Croacia | SuperSport HNL | 10 | 308 | 36 | Copa de Croacia | ✔ |
| Dinamarca | Superliga | 12 | 354 | 32 | Copa de Dinamarca | ✔ |
| Escocia | Scottish Premiership | 12 | 334 | 38 | Scottish Cup / League Cup | ✔ |
| Eslovaquia | Niké liga | 12 | 341 | 32 | Copa de Eslovaquia | ✔ |
| Eslovenia | PrvaLiga | 10 | 272 | 36 | Copa de Eslovenia | ✔ |
| España | LaLiga EA Sports | 20 | 502 | 38 | Copa del Rey | ✔ |
| Finlandia | Veikkausliiga | 12 | 333 | 32 | Copa de Finlandia | ≈ |
| Francia | Ligue 1 | 18 | 512 | 34 | Coupe de France | ✔ |
| Gales | Cymru Premier | 16 | 343 | 30 | Welsh Cup | ≈ |
| Georgia | Erovnuli Liga | 10 | 276 | 36 | Copa de Georgia | ✔ |
| Gibraltar | Gibraltar Football League | 11 | 293 | 22 | Rock Cup | ≈ |
| Grecia | Super League | 14 | 437 | 32 | Copa de Grecia | ≈ |
| Hungría | NB I | 12 | 339 | 33 | Copa de Hungría | ✔ |
| Inglaterra | Premier League | 20 | 572 | 38 | FA Cup / EFL Cup | ✔ |
| Irlanda | League of Ireland Premier Division | 12 | 356 | 33 | FAI Cup | ≈ |
| Irlanda del Norte | NIFL Premiership | 12 | 318 | 38 | Irish Cup | ✔ |
| Islandia | Besta deild | 12 | 360 | 27 | Copa de Islandia | ✔ |
| Islas Feroe | Betri deildin | 10 | 259 | 27 | Copa de las Islas Feroe | ✔ |
| Israel | Ligat Ha'Al | 14 | 420 | 36 | Copa del Estado | ✔ |
| Italia | Serie A | 20 | 566 | 38 | Coppa Italia | ✔ |
| Kazajistán | Premier League de Kazajistán | 16 | 459 | 30 | Copa de Kazajistán | ✔ |
| Kosovo | Superliga de Kosovo | 10 | 229 | 36 | Copa de Kosovo | ✔ |
| Letonia | Virslīga | 10 | 185 | 36 | Copa de Letonia | ✔ |
| Lituania | A Lyga | 9 | 229 | 36 | Copa de Lituania | ≈ |
| Luxemburgo | BGL Ligue | 16 | 292 | 30 | Copa de Luxemburgo | ✔ |
| Malta | Premier League de Malta | 12 | 254 | 27 | FA Trophy | ≈ |
| Montenegro | Prva CFL | 10 | 254 | 36 | Copa de Montenegro | ✔ |
| Noruega | Eliteserien | 16 | 431 | 30 | Copa de Noruega | ✔ |
| Países Bajos | Eredivisie | 18 | 463 | 34 | KNVB Beker | ✔ |
| Polonia | Ekstraklasa | 18 | 544 | 34 | Copa de Polonia | ✔ |
| Portugal | Liga Portugal | 18 | 68 | 34 | Taça de Portugal | ✔ |
| Rumanía | SuperLiga | 16 | 484 | 40 | Copa de Rumania | ✔ |
| Rusia | Premier Liga | 16 | 452 | 30 | Copa de Rusia | ✔ |
| San Marino | Campionato Sammarinese | 16 | 352 | 15 | Coppa Titano | ≈ |
| Serbia | Super liga | 14 | 445 | 33 | Copa de Serbia | ✔ |
| Suecia | Allsvenskan | 16 | 462 | 30 | Svenska Cupen | ✔ |
| Suiza | Super League | 12 | 353 | 38 | Copa de Suiza | ✔ |
| Turquía | Süper Lig | 18 | 483 | 34 | Copa de Turquía | ✔ |
| Ucrania | Premier Liha | 16 | 469 | 30 | Copa de Ucrania | ✔ |

### CONMEBOL (10 ligas · 169 clubes · 5.330 jugadores)

| País | Liga | Clubes | Jugadores | Fechas | Copa(s) | Formato |
|---|---|---|---|---|---|---|
| Argentina | Liga Profesional Argentina | 30 | 847 | 29 | Copa Argentina | ✔ |
| Bolivia | División Profesional | 13 | 428 | 26 | Copa de Bolivia | ≈ |
| Brasil | Brasileirão Série A | 20 | 699 | 38 | Copa do Brasil | ✔ |
| Chile | Liga de Primera | 14 | 469 | 26 | Copa Chile | ✔ |
| Colombia | Liga BetPlay | 20 | 625 | 38 | Copa BetPlay | ≈ |
| Ecuador | LigaPro Serie A | 16 | 524 | 40 | Copa Ecuador | ✔ |
| Paraguay | Primera División de Paraguay | 11 | 325 | 44 | Copa Paraguay | ✔ |
| Perú | Liga 1 | 15 | 498 | 30 | Copa Bicentenario | ≈ |
| Uruguay | Liga AUF Uruguaya | 16 | 485 | 30 | Copa AUF Uruguay | ≈ |
| Venezuela | Liga FUTVE | 14 | 430 | 26 | Copa Venezuela | ≈ |

### CONCACAF (34 ligas · 353 clubes · 6.465 jugadores)

| País | Liga | Clubes | Jugadores | Fechas | Copa(s) | Formato |
|---|---|---|---|---|---|---|
| Anguila | Primera división de Anguila | 6 | 97 | 10 | Copa de Anguila | ≈ |
| Antigua y Barbuda | Primera división de Antigua y Barbuda | 9 | 133 | 18 | Copa de Antigua y Barbuda | ≈ |
| Aruba | Primera división de Aruba | 9 | 133 | 18 | Copa de Aruba | ≈ |
| Bahamas | Primera división de Bahamas | 6 | 118 | 10 | Copa de Bahamas | ≈ |
| Barbados | Primera división de Barbados | 7 | 100 | 14 | Copa de Barbados | ≈ |
| Belice | Primera división de Belice | 9 | 133 | 18 | Copa de Belice | ≈ |
| Bermudas | Primera división de Bermudas | 10 | 112 | 18 | Copa de Bermudas | ≈ |
| Canadá | Canadian Premier League | 8 | 198 | 28 | Canadian Championship | ✔ |
| Costa Rica | Primera División de Costa Rica | 10 | 243 | 36 | Copa de Costa Rica | ✔ |
| Cuba | Primera división de Cuba | 15 | 231 | 30 | Copa de Cuba | ≈ |
| Curazao | Primera división de Curazao | 9 | 133 | 18 | Copa de Curazao | ≈ |
| Dominica | Primera división de Dominica | 9 | 133 | 18 | Copa de Dominica | ≈ |
| El Salvador | Liga Mayor de El Salvador | 12 | 288 | 44 | Copa El Salvador | ≈ |
| Estados Unidos | MLS | 30 | 727 | 29 | US Open Cup / Leagues Cup | ≈ |
| Granada | Primera división de Granada | 9 | 133 | 18 | Copa de Granada | ≈ |
| Guatemala | Liga Nacional de Guatemala | 9 | 120 | 36 | Copa de Guatemala | ≈ |
| Guyana | Primera división de Guyana | 10 | 150 | 18 | Copa de Guyana | ≈ |
| Haití | Ligue Haïtienne | 13 | 221 | 26 | Coupe d'Haïti | ≈ |
| Honduras | Liga Nacional de Honduras | 12 | 324 | 44 | Copa de Honduras | ≈ |
| Islas Caimán | Primera división de Islas Caimán | 11 | 152 | 22 | Copa de Islas Caimán | ≈ |
| Islas Turcas y Caicos | Primera división de Islas Turcas y Caicos | 7 | 100 | 14 | Copa de Islas Turcas y Caicos | ≈ |
| Islas Vírgenes Británicas | Primera división de Islas Vírgenes Británicas | 9 | 127 | 18 | Copa de Islas Vírgenes Británicas | ≈ |
| Islas Vírgenes Estadounidenses | Primera división de Islas Vírgenes Estadounidenses | 6 | 88 | 10 | Copa de Islas Vírgenes Estadounidenses | ≈ |
| Jamaica | Jamaica Premier League | 13 | 208 | 26 | JFF Champions Cup | ≈ |
| México | Liga MX | 18 | 530 | 34 | Campeón de Campeones | ✔ |
| Nicaragua | Liga Primera | 10 | 160 | 36 | Copa de Nicaragua | ≈ |
| Panamá | Liga Panameña de Fútbol | 12 | 382 | 44 | Copa de Panamá | ≈ |
| Puerto Rico | Primera división de Puerto Rico | 9 | 133 | 18 | Copa de Puerto Rico | ≈ |
| República Dominicana | Liga Dominicana de Fútbol | 8 | 128 | 14 | Copa Dominicana | ≈ |
| San Cristóbal y Nieves | Primera división de San Cristóbal y Nieves | 9 | 133 | 18 | Copa de San Cristóbal y Nieves | ≈ |
| San Vicente y las Granadinas | Primera división de San Vicente y las Granadinas | 8 | 120 | 14 | Copa de San Vicente y las Granadinas | ≈ |
| Santa Lucía | Primera división de Santa Lucía | 9 | 133 | 18 | Copa de Santa Lucía | ≈ |
| Surinam | Primera división de Surinam | 10 | 137 | 18 | Copa de Surinam | ≈ |
| Trinidad y Tobago | TT Premier Football League | 12 | 207 | 22 | FA Trophy | ≈ |

### AFC (36 ligas · 466 clubes · 10.639 jugadores)

| País | Liga | Clubes | Jugadores | Fechas | Copa(s) | Formato |
|---|---|---|---|---|---|---|
| Arabia Saudita | Saudi Pro League | 18 | 563 | 34 | King's Cup | ✔ |
| Australia | A-League Men | 12 | 334 | 22 | Australia Cup | ≈ |
| Bangladesh | Primera división de Bangladesh | 12 | 229 | 22 | Copa de Bangladesh | ≈ |
| Baréin | Primera división de Baréin | 11 | 174 | 22 | Copa de Baréin | ≈ |
| Brunéi | Primera división de Brunéi | 12 | 192 | 22 | Copa de Brunéi | ≈ |
| Bután | Primera división de Bután | 10 | 160 | 18 | Copa de Bután | ≈ |
| Camboya | Primera división de Camboya | 10 | 217 | 18 | Copa de Camboya | ≈ |
| China | Chinese Super League | 18 | 531 | 34 | Copa de China | ✔ |
| Corea del Norte | Primera división de Corea del Norte | 11 | 176 | 22 | Copa de Corea del Norte | ≈ |
| Emiratos Árabes Unidos | UAE Pro League | 14 | 413 | 26 | President's Cup | ✔ |
| Filipinas | Primera división de Filipinas | 10 | 227 | 18 | Copa de Filipinas | ≈ |
| Hong Kong | Primera división de Hong Kong | 11 | 211 | 22 | Copa de Hong Kong | ≈ |
| India | Indian Super League | 13 | 367 | 26 | Super Cup | ≈ |
| Indonesia | Primera división de Indonesia | 18 | 518 | 34 | Copa de Indonesia | ≈ |
| Irak | Iraq Stars League | 23 | 593 | 46 | Copa de Irak | ✔ |
| Irán | Persian Gulf Pro League | 16 | 438 | 30 | Hazfi Cup | ✔ |
| Japón | J1 League | 20 | 670 | 38 | Copa del Emperador / Copa J.League | ✔ |
| Kirguistán | Primera división de Kirguistán | 16 | 286 | 30 | Copa de Kirguistán | ≈ |
| Kuwait | Primera división de Kuwait | 12 | 215 | 22 | Copa de Kuwait | ≈ |
| Laos | Primera división de Laos | 13 | 208 | 26 | Copa de Laos | ≈ |
| Macao | Primera división de Macao | 11 | 176 | 22 | Copa de Macao | ≈ |
| Malasia | Primera división de Malasia | 12 | 335 | 22 | Copa de Malasia | ≈ |
| Maldivas | Primera división de Maldivas | 10 | 160 | 18 | Copa de Maldivas | ≈ |
| Mongolia | Primera división de Mongolia | 9 | 159 | 18 | Copa de Mongolia | ≈ |
| Myanmar | Primera división de Myanmar | 11 | 176 | 22 | Copa de Myanmar | ≈ |
| Nepal | Primera división de Nepal | 14 | 241 | 26 | Copa de Nepal | ≈ |
| Omán | Primera división de Omán | 14 | 254 | 26 | Copa de Omán | ≈ |
| Qatar | Qatar Stars League | 12 | 360 | 22 | Emir Cup | ✔ |
| Singapur | Primera división de Singapur | 8 | 163 | 14 | Copa de Singapur | ≈ |
| Tailandia | Primera división de Tailandia | 14 | 468 | 26 | Copa de Tailandia | ≈ |
| Taiwán | Primera división de Taiwán | 8 | 128 | 14 | Copa de Taiwán | ≈ |
| Tayikistán | Primera división de Tayikistán | 21 | 336 | 42 | Copa de Tayikistán | ≈ |
| Timor Oriental | Primera división de Timor Oriental | 10 | 160 | 18 | Copa de Timor Oriental | ≈ |
| Turkmenistán | Primera división de Turkmenistán | 8 | 109 | 14 | Copa de Turkmenistán | ≈ |
| Uzbekistán | Primera división de Uzbekistán | 10 | 287 | 18 | Copa de Uzbekistán | ≈ |
| Vietnam | Primera división de Vietnam | 14 | 405 | 26 | Copa de Vietnam | ≈ |

### CAF (46 ligas · 528 clubes · 9.245 jugadores)

| País | Liga | Clubes | Jugadores | Fechas | Copa(s) | Formato |
|---|---|---|---|---|---|---|
| Angola | Primera división de Angola | 30 | 514 | 58 | Copa de Angola | ≈ |
| Benín | Primera división de Benín | 14 | 239 | 26 | Copa de Benín | ≈ |
| Botsuana | Primera división de Botsuana | 4 | 61 | 6 | Copa de Botsuana | ≈ |
| Burkina Faso | Primera división de Burkina Faso | 8 | 144 | 14 | Copa de Burkina Faso | ≈ |
| Burundi | Primera división de Burundi | 10 | 159 | 18 | Copa de Burundi | ≈ |
| Cabo Verde | Primera división de Cabo Verde | 9 | 144 | 18 | Copa de Cabo Verde | ≈ |
| Camerún | Primera división de Camerún | 10 | 160 | 18 | Copa de Camerún | ≈ |
| Chad | Primera división de Chad | 11 | 175 | 22 | Copa de Chad | ≈ |
| Comoras | Primera división de Comoras | 3 | 48 | 6 | Copa de Comoras | ≈ |
| Costa de Marfil | Primera división de Costa de Marfil | 4 | 84 | 6 | Copa de Costa de Marfil | ≈ |
| Egipto | Primera división de Egipto | 16 | 614 | 30 | Copa de Egipto | ≈ |
| Eritrea | Primera división de Eritrea | 9 | 160 | 18 | Copa de Eritrea | ≈ |
| Esuatini | Primera división de Esuatini | 9 | 144 | 18 | Copa de Esuatini | ≈ |
| Etiopía | Primera división de Etiopía | 4 | 76 | 6 | Copa de Etiopía | ≈ |
| Gabón | Primera división de Gabón | 10 | 160 | 18 | Copa de Gabón | ≈ |
| Gambia | Primera división de Gambia | 10 | 160 | 18 | Copa de Gambia | ≈ |
| Ghana | Primera división de Ghana | 19 | 226 | 38 | Copa de Ghana | ≈ |
| Guinea | Primera división de Guinea | 10 | 175 | 18 | Copa de Guinea | ≈ |
| Guinea Ecuatorial | Primera división de Guinea Ecuatorial | 9 | 144 | 18 | Copa de Guinea Ecuatorial | ≈ |
| Guinea-Bisáu | Primera división de Guinea-Bisáu | 8 | 128 | 14 | Copa de Guinea-Bisáu | ≈ |
| Kenia | Primera división de Kenia | 18 | 280 | 34 | Copa de Kenia | ≈ |
| Lesoto | Primera división de Lesoto | 10 | 160 | 18 | Copa de Lesoto | ≈ |
| Madagascar | Primera división de Madagascar | 10 | 145 | 18 | Copa de Madagascar | ≈ |
| Malaui | Primera división de Malaui | 10 | 160 | 18 | Copa de Malaui | ≈ |
| Malí | Primera división de Malí | 12 | 216 | 22 | Copa de Malí | ≈ |
| Marruecos | Primera división de Marruecos | 13 | 454 | 26 | Copa de Marruecos | ≈ |
| Mauricio | Primera división de Mauricio | 8 | 160 | 14 | Copa de Mauricio | ≈ |
| Mauritania | Primera división de Mauritania | 9 | 160 | 18 | Copa de Mauritania | ≈ |
| Mozambique | Primera división de Mozambique | 13 | 211 | 26 | Copa de Mozambique | ≈ |
| Namibia | Primera división de Namibia | 10 | 159 | 18 | Copa de Namibia | ≈ |
| Nigeria | Primera división de Nigeria | 20 | 324 | 38 | Copa de Nigeria | ≈ |
| RD Congo | Primera división de RD Congo | 23 | 469 | 46 | Copa de RD Congo | ≈ |
| República Centroafricana | Primera división de República Centroafricana | 8 | 128 | 14 | Copa de República Centroafricana | ≈ |
| Ruanda | Primera división de Ruanda | 16 | 221 | 30 | Copa de Ruanda | ≈ |
| Santo Tomé y Príncipe | Primera división de Santo Tomé y Príncipe | 8 | 144 | 14 | Copa de Santo Tomé y Príncipe | ≈ |
| Seychelles | Primera división de Seychelles | 9 | 144 | 18 | Copa de Seychelles | ≈ |
| Sierra Leona | Primera división de Sierra Leona | 10 | 159 | 18 | Copa de Sierra Leona | ≈ |
| Somalia | Primera división de Somalia | 10 | 159 | 18 | Copa de Somalia | ≈ |
| Sudáfrica | Primera división de Sudáfrica | 15 | 533 | 30 | Copa de Sudáfrica | ≈ |
| Sudán | Primera división de Sudán | 2 | 32 | 2 | Copa de Sudán | ≈ |
| Sudán del Sur | Primera división de Sudán del Sur | 7 | 128 | 14 | Copa de Sudán del Sur | ≈ |
| Tanzania | Primera división de Tanzania | 16 | 74 | 30 | Copa de Tanzania | ≈ |
| Togo | Primera división de Togo | 10 | 160 | 18 | Copa de Togo | ≈ |
| Uganda | Primera división de Uganda | 17 | 218 | 34 | Copa de Uganda | ≈ |
| Zambia | Primera división de Zambia | 19 | 231 | 38 | Copa de Zambia | ≈ |
| Zimbabue | Primera división de Zimbabue | 18 | 301 | 34 | Copa de Zimbabue | ≈ |

### OFC (11 ligas · 105 clubes · 1.722 jugadores)

| País | Liga | Clubes | Jugadores | Fechas | Copa(s) | Formato |
|---|---|---|---|---|---|---|
| Fiyi | Primera división de Fiyi | 10 | 122 | 18 | Copa de Fiyi | ≈ |
| Islas Cook | Primera división de Islas Cook | 6 | 96 | 10 | Copa de Islas Cook | ≈ |
| Islas Salomón | Primera división de Islas Salomón | 10 | 160 | 18 | Copa de Islas Salomón | ≈ |
| Nueva Caledonia | Primera división de Nueva Caledonia | 10 | 160 | 18 | Copa de Nueva Caledonia | ≈ |
| Nueva Zelanda | National League | 11 | 271 | 11 | Chatham Cup | ≈ |
| Papúa Nueva Guinea | Primera división de Papúa Nueva Guinea | 11 | 176 | 22 | Copa de Papúa Nueva Guinea | ≈ |
| Samoa | Primera división de Samoa | 12 | 192 | 22 | Copa de Samoa | ≈ |
| Samoa Americana | Primera división de Samoa Americana | 10 | 160 | 18 | Copa de Samoa Americana | ≈ |
| Tahití | Primera división de Tahití | 7 | 97 | 14 | Copa de Tahití | ≈ |
| Tonga | Primera división de Tonga | 7 | 112 | 14 | Copa de Tonga | ≈ |
| Vanuatu | Primera división de Vanuatu | 11 | 176 | 22 | Copa de Vanuatu | ≈ |

## 3. Copas nacionales

Cada liga tiene su copa nacional (columna "Copa(s)" de las tablas). Se juegan a eliminación directa a partido único, con prórroga y penales, ronda previa cuando el número de equipos no es potencia de 2 y final en cancha neutral, intercaladas con la liga. Las supercopas nacionales (Campeón de Campeones, Supercopa, Leagues Cup) no se simulan todavía.

## 4. Competiciones internacionales de clubes

- UEFA: Champions League, Europa League y Conference League (fase liga de 36 equipos con 8 fechas, playoff 9º-24º, octavos, cuartos y semis a ida y vuelta, final única) y UEFA Super Cup.
- CONMEBOL: Copa Libertadores y Copa Sudamericana (32 equipos, 8 grupos, octavos en adelante a ida y vuelta, final única) y Recopa Sudamericana.
- AFC: Champions League Elite (fase liga de 24), Champions League Two (32, grupos) y Challenge League (16, grupos).
- CAF: Champions League y Confederation Cup (16 equipos, 4 grupos) y CAF Super Cup.
- CONCACAF: Champions Cup (16, eliminación directa), Central American Cup y Caribbean Cup.
- OFC: OFC Champions League (8 equipos, 2 grupos, semis y final). La OFC Pro League no se incorporó.

**Adaptaciones:** no hay rondas previas de clasificación; los cupos salen del ranking de países (UEFA, AFC, CAF) o de cupos fijos por país (CONMEBOL, CONCACAF, OFC). En la primera temporada los clasificados salen de una tabla simulada según la fuerza de los planteles (no hay resultados reales 2025/26 cargados). Desde la segunda temporada se usan las posiciones reales de tu liga y las tablas simuladas del resto del mundo. Los cupos UEFA/AFC/CAF cambian con los coeficientes.

## 5. Selecciones nacionales y torneos

- 213 selecciones a partir de la nacionalidad de cada jugador: convocatoria de 26 por posición y GRL, entrenador generado, formación y estilo, ranking tipo Elo por confederación.
- Fechas FIFA (4 por temporada) con amistosos o eliminatorias simulados; tus jugadores convocados pierden algo de forma, ganan moral y pueden lesionarse.
- Torneos: Copa Mundial (2030 y cada 4 años, 48 equipos), Eurocopa (2028), Copa América (2028), Copa Asiática (2027, a mitad de temporada), Copa Africana de Naciones (años impares desde 2027), Copa Oro (años impares) y Copa de Naciones de la OFC (2028). Grupos, eliminatorias, semifinales, final y campeón.
- **Adaptación:** las eliminatorias se resuelven con el ranking de cada confederación (más los anfitriones), no con partidos de eliminatorias completos.

## 6. Sistemas nuevos

- Buscador mundial al crear carrera: continente → país/liga → clubes con escudo y nivel → tu club, más búsqueda directa por liga, país o club.
- Motor de ligas con formatos por país: 1 a 4 ruedas, segunda fase por grupos (con puntos a la mitad en Austria, Rumania y Bélgica), Apertura/Clausura y playoffs (ida y vuelta o partido único, con penales). Las fechas libres de ligas con número impar de equipos se simulan solas (antes la carrera se trababa).
- Copas nacionales y torneos continentales intercalados con la liga; tu partido se juega con el simulador de siempre y el resto se simula por GRL.
- Base global por carrera: traspasos de la IA cada verano, tus compras, ventas y préstamos actualizan el club del jugador en planteles, mercado y selecciones; los jugadores cumplen años, evolucionan, cambian de valor y se retiran.
- Mercado mundial con todos los jugadores: filtros por continente, confederación, país/liga, club, nacionalidad, posición, edad, GRL y valor; préstamos con opción de compra; ofertas por tus jugadores de clubes reales con nombre.
- Entrenadores: uno por club (generado), con estilo, formación, reputación, nivel, contrato y salario; despidos por malos resultados, bolsa de entrenadores libres, tu despido si la directiva pierde la confianza y ofertas de otros clubes al terminar la temporada.
- Coeficientes: puntos por partido y por ronda en torneos continentales, ranking de clubes (5 años) y de países, que redefine los cupos.
- Estadísticas e historial: goleadores, asistidores y vallas invictas de tu liga, campeones de todas las ligas, copas, torneos continentales y de selecciones, tabla final de cada temporada.
- Sección Mundo (tablero, menú Más e inicio): Torneos, Selecciones, Rankings, Ligas del mundo, Historial, Entrenadores y Traspasos.
- Escudos: primero se busca assets/escudos/<nombre>.png (lista completa en LISTA_ESCUDOS.txt), después el banco de logos en línea y por último las iniciales.

## 7. Liga Argentina

No se tocaron clubes, planteles, fixture, formato ni resultados. Se corrigió la nacionalidad de 32 jugadores extranjeros verificados en notas periodísticas de 2026 (por ejemplo Santiago Arias → Colombia, Luciano Cabral → Chile, Alex Arce → Paraguay, Enner Valencia → Ecuador). Todos los jugadores argentinos ya tenían GRL; no se cambiaron.

## 8. Problemas encontrados en los PDF y cómo se resolvieron

- Planteles duplicados entre clubes: 1488 jugadores aparecían en dos clubes; se conservó un único registro (el primero que aparece en los PDF).
- Clubes repetidos o páginas duplicadas: 56 eliminados.
- Libia y Sudán (PDF África): los jugadores venían sin nombre de club y mezclados entre equipos; no se pudieron asignar y se dejaron afuera (eran planteles de relleno).
- Planteles "ficticios complementarios" de Asia que duplicaban clubes reales: eliminados.
- Costa Rica, Guatemala, Canadá y varios de México, Australia y China venían sin nombre de club: se identificaron con búsquedas web por sus jugadores (por ejemplo Saprissa, Alajuelense, Herediano, Municipal, Antigua GFC, Cavalry, Forge, Pacific, Guadalajara, Toluca, Puebla, Adelaide United, Melbourne Victory).
- Quedan 14 clubes "por identificar" (Bermudas, Haití, China, Cuba, Guatemala, Guyana): Club por identificar 1 (Bermudas), Club por identificar 2 (Bermudas), Club por identificar 3 (Bermudas), Club por identificar 1 (Haití), Club por identificar 2 (Haití), Club por identificar 1 (China), Club por identificar 2 (China), Club por identificar 1 (Cuba), Club por identificar 2 (Cuba), Club por identificar 3 (Cuba), Club por identificar 1 (Guatemala), Club por identificar 1 (Guyana), Club por identificar 2 (Guyana), Club por identificar 3 (Guyana).
- Barbados, Bahamas, Bermudas y Canadá traían solo nombre y dorsal: se completaron nacionalidad, edad, GRL y valor con estimaciones marcadas como tales.
- Ligas con jugadores ficticios según el propio PDF (se importaron igual y quedan marcadas internamente): Brunéi, Bután, Corea del Norte, Islas Cook, Islas Salomón, Laos, Macao, Maldivas, Myanmar, Nueva Caledonia, Papúa Nueva Guinea, Samoa, Samoa Americana, Taiwán, Tayikistán, Timor Oriental, Tonga, Vanuatu.
- Datos faltantes completados con estimaciones marcadas: 1.238 edades, 1.025 valores, 506 nacionalidades, 170 posiciones.
- Varias ligas del PDF tienen menos clubes que la liga real (por ejemplo Chile, Perú, Ucrania, Serbia, Bulgaria y Lituania) y en otras faltan clubes. Se usan tal como vinieron.

## 9. Errores del código encontrados y corregidos

- Las ligas con cantidad impar de equipos trababan la carrera en la fecha libre (heredado de la 6.3): ahora la fecha libre se simula sola.
- Los rivales salían con 3 o 4 arqueros en el once (se tomaban los primeros 11 del archivo): ahora cada club arma su XI 4-3-3 por posición.
- El tablero 6.3 regeneraba la liga cuando cambiaba la lista de clubes: se protegió para no tocar el calendario de partidas guardadas.
- Durante el desarrollo se corrigieron además: torneos que se simulaban enteros al crear la carrera, el plantel de tu club que se mezclaba con jugadores vendidos y páginas de los PDF de Norteamérica donde el encabezado correspondía al club siguiente.

## 10. Auditoría final (pruebas en Chrome, pantalla de iPhone 390×844)

- Carga inicial: ~1,5–2,2 s con 188 ligas y 51.717 jugadores. Sin errores de JavaScript en ninguna prueba.
- Temporadas completas jugadas con Celtic (Escocia, división en grupos), América (Apertura/Clausura + liguilla), Inter Miami (MLS + playoffs), River Plate (Argentina + Libertadores + Copa Argentina), Atlético Nacional (Colombia, Apertura/Clausura + playoffs), Auckland City (Nueva Zelanda + OFC); y 12 partidos con Al Ahly (CAF) y Vissel Kobe (AFC). En todas se cerró la temporada, se registró el historial y se arrancó la siguiente.
- Migración: tres carreras creadas en la 6.5 (River, Girona y América) abrieron en la 10.0 con los mismos resultados, rivales y planteles, y siguieron jugándose. Se generó la copia automática "Antes de actualizar a la versión 10.0".
- Mercado: compra (el jugador sale de su club y deja de figurar en el mercado), préstamo con opción, venta a un club real (el jugador aparece en el plantel del comprador), filtros por confederación y búsqueda por nombre.
- Guardado y recarga de la página: la carrera continúa igual. Cambio de idioma: funciona. Borrar carrera: funciona.
- Entrenadores: despido del usuario con ofertas, cambio de club a mitad de temporada y a fin de temporada.
- Todas las pestañas de Mundo y de Competición se muestran sin errores.

## 11. Pendiente

- Países sin PDF: Portugal (se mantiene la base anterior), Estonia, Moldavia, Macedonia del Norte, Corea del Sur, Jordania, Líbano, Siria, Palestina, Afganistán, Pakistán, Sri Lanka, Yemen, Guam, Marianas del Norte, Senegal, Túnez, Libia, Sudán, Níger, Liberia, Yibuti, Congo, Martinica, Guadalupe, Guayana Francesa, San Martín, Sint Maarten, Bonaire y Montserrat. Se pueden completar desde la web por bloques.
- Escudos: falta subir los de los clubes nuevos (ver assets/escudos/LISTA_ESCUDOS.txt).
- Segundas divisiones: no se inventaron. La zona de descenso se muestra, pero la liga mantiene sus clubes hasta que se cargue la segunda división de cada país.
- Los entrenadores de clubes y selecciones son generados (no son datos reales).