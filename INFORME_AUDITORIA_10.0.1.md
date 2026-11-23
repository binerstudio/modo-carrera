# MODO CARRERA 10.0.1 — Auditoría y reparación de la base mundial

Fecha de referencia de los datos: **12 de noviembre de 2026**. Temporada de referencia: **2026/27** para las ligas europeas, africanas y asiáticas de calendario cruzado, y **2026** para las ligas de calendario anual (Sudamérica, MLS, Japón, China, etc.).

Este informe no se basa en el informe anterior. Todo lo que dice salió de revisar `data/mundo.js`, `data/jugadores.js` y el código, o de fuentes consultadas en esta sesión. Cuando algo no se pudo comprobar, lo digo.

## 0. Resumen en pocas líneas

- **Portugal está reconstruida**: los 18 clubes reales de la Liga Portugal Betclic 2026/27 y **526 jugadores** con nombre real, dorsal, posición, nacionalidad y club correctos. Antes tenía 68 jugadores (el Benfica arrancaba con 11).
- **De los 14 clubes "por identificar", identifiqué 3.** Los otros 11 no se pueden identificar porque sus jugadores son **generados**: los nombres se repiten combinados entre clubes y la secuencia de edades es idéntica en clubes distintos. Quedan como pendientes y sus jugadores están marcados como generados.
- Encontré y corregí **errores graves que el informe anterior no mencionaba**: la liga de **Argelia** estaba cargada dentro de **Angola**, había **clubes del mismo nombre en dos países que compartían el plantel** (por ejemplo, el Everton inglés y el chileno), un club egipcio con el nombre ilegible (era el **ENPPI**), dos clubes chinos con planteles de relleno, un club de Ghana duplicado y 18 nombres de jugadores con caracteres rotos.
- Escudos: **no pude descargar ninguna imagen**. Desde esta sesión no había acceso de red para bajar archivos. La lista de escudos se regeneró con los 2.323 clubes y marca cuáles faltan.
- **Lo que no pude hacer**: agregar los 30 países que faltan, completar los clubes que faltan en Chile, Perú, Serbia, Bulgaria, Lituania y otras ligas, y reemplazar los planteles de relleno de unas 100 ligas pequeñas. No inventé datos para tapar esos huecos. Están en la sección 10.

## 1. Países y ligas revisados

Revisé por script las **189 ligas** del juego: las 188 de `mundo.js` (incluida Argelia, que ahora tiene liga propia) más Argentina, que viene de la base anterior. Para cada liga conté clubes, jugadores, campos faltantes, datos estimados, duplicados, nombres de club repetidos entre países, caracteres dañados y planteles generados. La tabla completa por país está al final (sección 14).

Investigué en la web estos casos: Portugal (los 18 clubes), los 14 clubes por identificar, el club egipcio sin nombre y la liga de Argelia.

## 2. Ligas que estaban incompletas o mal armadas

| Liga | Problema encontrado | Qué se hizo |
|---|---|---|
| Portugal | 18 clubes de 2025/26 (con AVS y Tondela, que descendieron) y 68 jugadores | Reconstruida para 2026/27: suben Marítimo y Académico de Viseu, bajan AVS y Tondela. 526 jugadores |
| Angola (Girabola) | 30 "clubes": 16 angoleños y 14 de la liga de **Argelia**, con nombres como "MC Alger — 2026/27", "A" y "Ar" | Angola quedó con sus 16 clubes. El "º de Agosto" se renombró **Primeiro de Agosto** |
| Argelia (Ligue 1 Mobilis) | No existía como liga | Creada con 13 clubes verificados de los 16 de 2026/27. Faltan CS Constantine, CR Témouchent y USM Khenchela |
| Ghana | 19 clubes. "FC Ashantigold ’04" era el mismo plantel que "FC Ashantigold" (página duplicada) | Quedaron 18 |
| Irak | Tenía una copia del "Sporting Club Delhi" de India | Copia eliminada: 6 jugadores repetidos y 1 que se pasó al club de India |
| Nueva Zelanda | Tenía un "Auckland FC" con 2 jugadores del Auckland FC de la A-League australiana | Fusionado con el club australiano |
| China | Tianjin Jinmen Tiger y Dalian Yingbo tenían planteles de relleno ("Zhang Wei", "Li Jun"…). Sus planteles reales estaban en los "Club por identificar 1 y 2" | Se reemplazó el relleno por el plantel real |
| Chile, Perú, Serbia, Bulgaria, Lituania | Tienen menos clubes que la liga real | **Sin corregir**: no conseguí los planteles de los clubes que faltan (ver sección 10) |

## 3. Clubes que faltaban

- **Portugal:** Marítimo y Académico de Viseu (ascendidos en 2026/27).
- **Argelia:** se recuperaron 13 clubes que estaban escondidos en Angola. Faltan **CS Constantine, CR Témouchent y USM Khenchela**.
- **Pendientes sin corregir:** Chile (14 de 16), Lituania (9 de 10), Serbia (14 de 16), Bulgaria (14 de 16), Perú (15 de 18 o 19), Guatemala (9 de 12), Egipto (17 en el juego; la liga 2025/26 tuvo 21), Paraguay (11) y Bolivia (13). Estas cantidades reales salen del formato conocido de la temporada anterior y no las volví a verificar para 2026/27.

## 4. Los 14 clubes "por identificar"

| Provisorio | Resultado | Cómo se identificó |
|---|---|---|
| Club por identificar 1 (China) | **Tianjin Jinmen Tiger** | FotMob lista a Xadas en Tianjin junto con Aitor Córdoba, Guilherme Schettine, Alberto Quiles, Cristian Salvador, Wang Zhenghao, Yang Fan y otros, todos de este plantel |
| Club por identificar 2 (China) | **Dalian Yingbo** | FotMob: Nicolae Stanciu (en Dalian desde enero de 2026) aparece con Cephas Malele, Isnik Alimi, Mamadou Traoré, Frank Acheampong, Ge Peng y el resto del plantel |
| Club por identificar 1 (Guatemala) | **Cobán Imperial** | Formación de Cobán en Antorcha Deportiva (febrero de 2026) con Casas, Acosta, De León, Soto, Estrada, Janderson Pereira y Lemus; Soccerway ubica a V. Ayala y L. Pereira en Cobán |
| Club por identificar 1, 2 y 3 (Bermudas) | **Pendiente: plantel generado** | Los nombres son combinaciones repetidas entre clubes (Rashaun DeSilva / Micah DeSilva, Keston Fox / Keston Burgess…). Un club tiene solo 4 jugadores |
| Club por identificar 1 y 2 (Haití) | **Pendiente: plantel generado** | Los dos clubes tienen exactamente la misma secuencia de edades (27, 20, 25, 28, 23, 21, 26…) y apellidos intercambiados |
| Club por identificar 1, 2 y 3 (Cuba) | **Pendiente: plantel generado** | Mismo patrón de edades y nombres combinados |
| Club por identificar 1, 2 y 3 (Guyana) | **Pendiente: plantel generado** | Mismo patrón |

En los 11 pendientes no hay nada que identificar: los jugadores no son personas reales. Para poder asignarlos a un club real hace falta el plantel real de las ligas de Bermudas, Haití, Cuba y Guyana. Esos 11 clubes quedan con su nombre provisorio, marcados como "plantel generado", y en el mercado cada jugador muestra la etiqueta **GEN.**

Además, en Argelia apareció un club de 9 jugadores bajo el nombre "A". Tampoco pude identificarlo: podría ser uno de los tres clubes argelinos que faltan, pero no lo pude confirmar. No lo asigné a ningún club. Sus jugadores quedaron registrados en `MC_WORLD.pendientes`.

## 5. Cantidad de clubes agregados

- **2 clubes nuevos** en Portugal (Marítimo y Académico de Viseu). Además, los otros 16 clubes portugueses ahora tienen plantel completo.
- **1 liga nueva** (Argelia) con 13 clubes recuperados de Angola.
- **3 clubes identificados** (Tianjin Jinmen Tiger, Dalian Yingbo y Cobán Imperial) y **1 club con nombre recuperado** (ENPPI).
- Se eliminaron **3 entradas de club falsas o duplicadas** (FC Ashantigold ’04, Sporting Club Delhi en Irak y Auckland FC en Nueva Zelanda) y 2 clubes provisorios absorbidos (los de China).
- Total: 2.293 clubes en `mundo.js` más 30 de Argentina, es decir, **2.323 clubes en 189 ligas**.

## 6. Cantidad de jugadores agregados

- **526 jugadores** en Portugal. 519 entraron nuevos y 7 se trasladaron desde el club donde figuraban antes (ver sección 7).
- Base total: 51.238 jugadores en `mundo.js`, más la base argentina y los jugadores anteriores que se conservan: **52.140 registros** y **52.133 jugadores en el mercado global**, cada uno con un identificador único.

## 7. Cantidad de jugadores corregidos

- **18 nombres con caracteres dañados**, por ejemplo Sergej Milinković-Savić, Marcin Bułka, Jiří Staněk, Nemanja Anđelković y Alexandru Mitriță.
- **7 jugadores que figuraban en el club equivocado** y hoy juegan en Portugal: Geny Catamo (estaba en Black Bulls de Mozambique y es del Sporting CP), Arnel Jakupovic (de Osijek a Vitória SC), Gabriel Mec (de Grêmio a Porto), Gabriel Rukavina (de Rijeka a Arouca), Axel Camblan (de Brest a Estoril), Radek Šiler (de Podbrezová a Rio Ave) y Andro Babić (de Velež a Académico de Viseu). Se conservó su GRL y se borró el registro viejo, así que no quedan en dos clubes.
- Con nombres muy comunes (Ewerton, Fernando, Sorriso, Tomás Silva, Juan Castillo y otros) **no se fusionaron registros automáticamente**, porque podían ser personas distintas.
- **3.463 jugadores** marcados como **generados** (etiqueta GEN.): los de los 18 países que el propio PDF declaraba ficticios, los 11 clubes pendientes, 14 clubes con patrón de generación detectado (República Dominicana, Haití, Trinidad y Tobago, Angola y Cuba) y 3 jugadores con nombre genérico ("Portero titular", "Goalkeeper squad member" y "Forward squad member").
- Nacionalidades: la base anterior usaba "Rumania", "Rep. Checa", "Bosnia" y "Rep. Centroafricana", y eso partía las selecciones en dos. Ahora se unifican como Rumanía, Chequia, Bosnia y Herzegovina y República Centroafricana. Ningún jugador de la Liga Argentina tenía esas nacionalidades.

## 8. Jugadores duplicados

- Nombres repetidos entre clubes distintos: **6.637 pares**. De esos, **2.731** tienen además la misma edad y la misma nacionalidad. Casi todos están en ligas de relleno (Jamaica, Trinidad y Tobago, Granada, San Vicente…), donde el generador del PDF combinó nombres. No son duplicados reales de una misma persona sino nombres generados que coinciden. El resto son homónimos reales (João Pedro, Gabriel, Allan…).
- El juego distingue a los homónimos agregando el club al nombre, por ejemplo "Nuno Santos (Sporting CP)". **Ningún jugador real se perdió**: de los 52.140 registros, 52.133 están en el mercado y no hay identificadores repetidos. Los 7 que faltan son 6 homónimos de la Liga Argentina (ver el punto siguiente) y 1 registro de relleno ("Portero titular", en Nigeria).
- Excepción para consultarte: en la Liga Argentina hay **6 pares de homónimos** (Franco Vázquez, Damián Fernández, Julián Fernández, Tomás Fernández, David Martínez y Tomás González). Desde la versión 10.0, el mercado global une cada par en un solo registro, así que uno de los dos no aparece en el mercado ni en las selecciones. No lo toqué porque pediste no modificar Argentina. Si querés, lo corrijo diferenciándolos por club, igual que en el resto del mundo.

## 9. Escudos incorporados

**Ninguno.** Desde esta sesión no había acceso de red para descargar imágenes, así que no pude bajar ni comprobar escudos oficiales. No puse imágenes de otros clubes ni iniciales en lugar de los escudos.

- `assets/escudos/LISTA_ESCUDOS.txt` se regeneró con los 2.323 clubes y el nombre de archivo exacto de cada escudo: **30 [OK]** (Argentina) y **2.293 [FALTA]**.
- El juego sigue igual que antes: primero busca el archivo local, después el banco de logos en línea y, si no encuentra nada, muestra las iniciales.

## 10. Ligas que no pudieron completarse y por qué

1. **Países que faltan** (Estonia, Moldavia, Macedonia del Norte, Corea del Sur, Jordania, Líbano, Siria, Palestina, Afganistán, Pakistán, Sri Lanka, Yemen, Guam, Islas Marianas del Norte, Senegal, Túnez, Libia, Sudán, Níger, Liberia, Yibuti, Congo, Martinica, Guadalupe, Guayana Francesa, San Martín, Sint Maarten, Bonaire y Montserrat). **No se agregaron.** Cada club necesita su plantel desde una fuente que dé nombre, dorsal, posición y edad, y eso son entre 8 y 16 consultas por país. Con los planteles de Portugal se usó todo el margen de esta sesión. Algunas observaciones para la próxima tanda: Martinica, Guadalupe, Guayana Francesa y San Martín tienen ligas propias pero dependen de la federación francesa. Sint Maarten y Bonaire tienen ligas muy pequeñas. Guam y las Marianas del Norte son miembros de la AFC con ligas amateurs.
2. **Clubes que faltan en ligas existentes** (sección 3). No agregué clubes sin plantel, para no crear equipos vacíos ni inventados.
3. **Libia y Sudán.** Los jugadores de los PDF siguen sin club identificable. En el juego Sudán tiene 2 clubes con relleno y Libia no tiene liga. Queda pendiente.
4. **Botsuana (4 clubes), Comoras (3), Costa de Marfil (4), Etiopía (4), Sudán (2) y Tanzania (16 clubes con 74 jugadores).** Son ligas de 16 a 18 clubes que llegaron casi vacías en los PDF. Están marcadas como SIN DATOS SUFICIENTES. No las completé con equipos inventados.
5. **Ligas con planteles de relleno según el PDF** (unas 100, sobre todo en África, el Caribe y Asia): sus jugadores no están verificados. La tabla final las muestra como SIN DATOS SUFICIENTES.
6. **Clubes con menos de 16 jugadores:** quedan 270 en todo el mundo, casi todos en ligas pequeñas.

## 11. Datos estimados y datos verificados

| Dato | Verificado | Estimado (etiqueta EST.) |
|---|---|---|
| Portugal: clubes, nombres, dorsales, posiciones y nacionalidades | 526 de 526 (2 jugadores sin dorsal en la fuente) | — |
| Portugal: edad | 450 | 76 |
| Portugal: GRL y valor de mercado | 7 (tomados de su registro anterior) | 519: GRL según el nivel del club, la edad y el rol; valor calculado con la fórmula del juego |
| Base mundial: edad / valor / nacionalidad / posición / GRL | resto | 1.314 / 1.544 / 506 / 170 / 1.001 |
| Jugadores generados (no reales) | — | 3.463 (etiqueta GEN.) |

Los valores de mercado de Portugal son **estimaciones**, no datos de Transfermarkt. Transfermarkt no se pudo consultar desde esta sesión.

Fuentes de los planteles de Portugal: la sección "Current squad" de la página de cada club en Wikipedia en inglés (revisadas entre octubre y noviembre de 2026) y starting11.com (actualizado entre el 6 y el 8 de noviembre de 2026) para las edades. Cuando las dos fuentes no coincidían, se tomó la más reciente. Por ejemplo, la página de Wikipedia del Vitória SC todavía tenía a Abascal, Nélson Oliveira, Charles y Nóbrega, que ya se fueron (Record lo confirma), así que se usó starting11 junto con aksam.com.tr. La fuente de cada club quedó en `MC_WORLD.auditoria.portugalFuentes`.

Formato de la Liga Portugal 2026/27: 18 clubes, dos ruedas, 34 fechas, del 7 de agosto de 2026 al 16 de mayo de 2027. Descienden el 17.º y el 18.º; el 16.º juega el repechaje con el 3.º de Liga Portugal 2. El juego simula el descenso directo de 2, igual que antes. Copas: Taça de Portugal y Taça da Liga. El 1.º clasifica a la fase liga de la Champions, y hay plazas de previa de Champions, Europa League y Conference según el ranking UEFA. En el juego queda "Champions (2) · Europa League (1) · Conference (1)".

## 12. Pruebas de funcionamiento realizadas

Se hicieron en Chrome sin interfaz (Playwright), con pantalla de 390×844, contra el proyecto corregido:

- **Carga:** 189 ligas, 2.323 clubes, 52.140 registros de jugadores y 52.133 jugadores en el mercado (la diferencia se explica en la sección 8). Carga en unos 3 segundos y sin errores de JavaScript.
- **Partidas anteriores:** creé tres carreras con la versión 10.0 original (Benfica, Čukarički y O’Higgins), jugué 3 fechas en cada una y las abrí con la 10.0.1. Las tres cargaron con sus resultados y sus planteles, los nombres de clubes se actualizaron (Čukarički, O’Higgins, CD Nacional, Everton de Viña del Mar) y siguieron jugándose.
- **Carreras nuevas en 14 ligas:** Portugal (Marítimo y Sporting CP), Argelia (MC Alger), China (Tianjin), Guatemala (Cobán Imperial), Egipto (ENPPI), Japón, Brasil, México, Kenia, Inglaterra, Nueva Zelanda, Angola (Primeiro de Agosto) y Ghana. Se jugaron 4 partidos con cada una, incluidos partidos de Libertadores, Champions, CAF y Concacaf, sin errores.
- **Temporada completa:** con Sporting CP jugué las 34 fechas, la Taça y la Europa/Champions (43 partidos). Hubo cierre de temporada con campeones e historial, comenzó la temporada 2027/28 y se jugaron 3 fechas más.
- **Mercado y transferencias:** compré a Samu Aghehowa del Porto. Salió del plantel del Porto, entró al mío y dejó de aparecer en el mercado. La selección de Portugal (26 convocados) incluye jugadores de la base nueva.
- **Guardado y recarga:** recargué la página y la carrera siguió en la misma fecha, con el fichaje incluido.
- **Cambio de idioma, borrar carrera, entrenadores y coeficientes:** no se modificó su código. Funcionaron dentro de las temporadas simuladas sin errores, pero no los probé uno por uno.

## 13. Errores encontrados y corregidos

1. Clubes del mismo nombre en dos países **compartían el plantel**, porque el juego une jugadores por nombre de club. Pasaba con Everton (Inglaterra y Chile), Universidad Católica (Chile y Ecuador), Alianza FC (Colombia, Panamá y El Salvador), CD Platense (Honduras y El Salvador), Dynamos FC (Bahamas y Zimbabue), United FC (Bahamas y Emiratos), Police FC (Uganda y Trinidad y Tobago), Al-Nasr SC y Al-Shabab SC (Kuwait y Omán), Auckland FC (Australia y Nueva Zelanda) y Sporting Club Delhi (India e Irak). Cada uno tiene ahora nombre propio. El Nacional portugués pasó a llamarse "CD Nacional" porque el de Uruguay ya era "Nacional".
2. La liga de Argelia estaba dentro de Angola (sección 2).
3. El club egipcio con nombre ilegible era el **ENPPI**, según el plantel en FotMob.
4. 34 nombres de clubes con mayúsculas o caracteres mal convertidos: "čukarički" → Čukarički, "Widzew łódź" → Widzew Łódź, "O’higgins" → O’Higgins, "Hearts Of Oak" → Hearts of Oak, "Stade D’abidjan" → Stade d’Abidjan y otros.
5. 18 nombres de jugadores con caracteres rotos (sección 7).
6. Las etiquetas de datos estimados del mercado se mezclaban con las de club porque los bits de los dos tipos de marca se pisaban. Ahora están separados. **EST.** indica un dato estimado y **GEN.** un jugador generado.
7. Nacionalidades duplicadas que partían selecciones (sección 7).

**Compatibilidad:** no cambió la estructura de las partidas guardadas. Se agregó una **migración de carrera nueva (v2)** que solo reemplaza los nombres viejos de clubes por los nuevos dentro de cada carrera. Las carreras de Portugal conservan su calendario original (con AVS y Tondela) y el plantel guardado del usuario; los rivales toman los planteles nuevos. Al abrir la 10.0.1 se crea automáticamente la copia "Antes de actualizar a la versión 10.0.1". No se renombró ni se borró ninguna clave de almacenamiento.

**Liga Argentina:** no se tocó nada (clubes, jugadores, calendario, formato, GRL ni nacionalidades). Los 6 homónimos argentinos (sección 8) quedan a tu decisión.

## 14. Tabla por país

"s/d" quiere decir que la cantidad real de clubes no se verificó en esta auditoría. Criterios de estado: **COMPLETA** significa clubes correctos y planteles verificados con fuentes. **INCOMPLETA** significa que faltan clubes conocidos. **SIN DATOS SUFICIENTES** significa que la mitad o más de los clubes tienen planteles de relleno o generados, o que el promedio es de menos de 14 jugadores por club. **PENDIENTE DE INVESTIGACIÓN** significa que los planteles vienen del PDF y no se volvieron a verificar en esta auditoría.

| País | Liga | Clubes reales | Clubes en el juego | Jugadores | Clubes con <16 jugadores | Jugadores generados | Estado |
|---|---|---|---|---|---|---|---|
| Albania | Kategoria Superiore | s/d | 10 | 274 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Alemania | Bundesliga | s/d | 18 | 519 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Andorra | Primera Divisió | s/d | 10 | 244 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Angola | Primera división de Angola | 16 | 16 | 167 | 15 | 24 | SIN DATOS SUFICIENTES |
| Anguila | Primera división de Anguila | s/d | 6 | 97 | 1 | 0 | SIN DATOS SUFICIENTES |
| Antigua y Barbuda | Primera división de Antigua y Barbuda | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| Arabia Saudita | Saudi Pro League | s/d | 18 | 563 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Argelia | Ligue 1 Mobilis | 16 | 13 | 338 | 0 | 0 | INCOMPLETA |
| Argentina | Liga Profesional Argentina | 30 | 30 | 847 (base anterior) | 0 | 0 | PENDIENTE DE INVESTIGACIÓN (sin cambios por instrucción) |
| Armenia | Premier League de Armenia | s/d | 12 | 319 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Aruba | Primera división de Aruba | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| Australia | A-League Men | s/d | 12 | 332 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Austria | Bundesliga austríaca | s/d | 12 | 352 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Azerbaiyán | Premyer Liqası | s/d | 12 | 303 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Bahamas | Primera división de Bahamas | s/d | 6 | 72 | 4 | 0 | SIN DATOS SUFICIENTES |
| Bangladesh | Primera división de Bangladesh | s/d | 12 | 229 | 2 | 0 | SIN DATOS SUFICIENTES |
| Barbados | Primera división de Barbados | s/d | 7 | 100 | 4 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Baréin | Primera división de Baréin | s/d | 11 | 174 | 1 | 0 | SIN DATOS SUFICIENTES |
| Bélgica | Jupiler Pro League | s/d | 18 | 531 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Belice | Primera división de Belice | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| Benín | Primera división de Benín | s/d | 14 | 239 | 1 | 0 | SIN DATOS SUFICIENTES |
| Bermudas | Primera división de Bermudas | s/d | 10 | 112 | 8 | 26 | SIN DATOS SUFICIENTES |
| Bielorrusia | Vysheyshaya Liga | s/d | 16 | 397 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Bolivia | División Profesional | s/d | 13 | 428 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Bosnia y Herzegovina | Premijer liga | s/d | 10 | 247 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Botsuana | Primera división de Botsuana | s/d | 4 | 61 | 2 | 0 | SIN DATOS SUFICIENTES |
| Brasil | Brasileirão Série A | s/d | 20 | 698 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Brunéi | Primera división de Brunéi | s/d | 12 | 192 | 0 | 192 | SIN DATOS SUFICIENTES |
| Bulgaria | efbet Liga | 16 | 14 | 381 | 0 | 0 | INCOMPLETA |
| Burkina Faso | Primera división de Burkina Faso | s/d | 8 | 144 | 0 | 0 | SIN DATOS SUFICIENTES |
| Burundi | Primera división de Burundi | s/d | 10 | 159 | 1 | 0 | SIN DATOS SUFICIENTES |
| Bután | Primera división de Bután | s/d | 10 | 160 | 0 | 160 | SIN DATOS SUFICIENTES |
| Cabo Verde | Primera división de Cabo Verde | s/d | 9 | 144 | 0 | 0 | SIN DATOS SUFICIENTES |
| Camboya | Primera división de Camboya | s/d | 10 | 217 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Camerún | Primera división de Camerún | s/d | 10 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Canadá | Canadian Premier League | s/d | 8 | 198 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Chad | Primera división de Chad | s/d | 11 | 175 | 1 | 0 | SIN DATOS SUFICIENTES |
| Chequia | Chance Liga | s/d | 16 | 471 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Chile | Liga de Primera | 16 | 14 | 419 | 1 | 0 | INCOMPLETA |
| China | Chinese Super League | 16 | 16 | 499 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Chipre | Cyprus League | s/d | 14 | 405 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Colombia | Liga BetPlay | s/d | 20 | 577 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Comoras | Primera división de Comoras | s/d | 3 | 48 | 0 | 0 | SIN DATOS SUFICIENTES |
| Corea del Norte | Primera división de Corea del Norte | s/d | 11 | 176 | 0 | 176 | SIN DATOS SUFICIENTES |
| Costa de Marfil | Primera división de Costa de Marfil | s/d | 4 | 84 | 1 | 0 | SIN DATOS SUFICIENTES |
| Costa Rica | Primera División de Costa Rica | s/d | 10 | 243 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Croacia | SuperSport HNL | s/d | 10 | 306 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Cuba | Primera división de Cuba | s/d | 15 | 231 | 7 | 71 | SIN DATOS SUFICIENTES |
| Curazao | Primera división de Curazao | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| Dinamarca | Superliga | s/d | 12 | 354 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Dominica | Primera división de Dominica | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| Ecuador | LigaPro Serie A | s/d | 16 | 497 | 3 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Egipto | Primera división de Egipto | s/d | 16 | 614 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| El Salvador | Liga Mayor de El Salvador | s/d | 12 | 206 | 5 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Emiratos Árabes Unidos | UAE Pro League | s/d | 14 | 405 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Eritrea | Primera división de Eritrea | s/d | 9 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Escocia | Scottish Premiership | s/d | 12 | 331 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Eslovaquia | Niké liga | s/d | 12 | 340 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Eslovenia | PrvaLiga | s/d | 10 | 272 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| España | LaLiga EA Sports | s/d | 20 | 502 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Estados Unidos | MLS | s/d | 30 | 727 | 2 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Esuatini | Primera división de Esuatini | s/d | 9 | 144 | 0 | 0 | SIN DATOS SUFICIENTES |
| Etiopía | Primera división de Etiopía | s/d | 4 | 76 | 0 | 0 | SIN DATOS SUFICIENTES |
| Filipinas | Primera división de Filipinas | s/d | 10 | 227 | 2 | 0 | SIN DATOS SUFICIENTES |
| Finlandia | Veikkausliiga | s/d | 12 | 333 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Fiyi | Primera división de Fiyi | s/d | 10 | 122 | 9 | 0 | SIN DATOS SUFICIENTES |
| Francia | Ligue 1 | s/d | 18 | 511 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Gabón | Primera división de Gabón | s/d | 10 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Gales | Cymru Premier | s/d | 16 | 343 | 3 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Gambia | Primera división de Gambia | s/d | 10 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Georgia | Erovnuli Liga | s/d | 10 | 276 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Ghana | Primera división de Ghana | 18 | 18 | 212 | 17 | 0 | SIN DATOS SUFICIENTES |
| Gibraltar | Gibraltar Football League | s/d | 11 | 293 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Granada | Primera división de Granada | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| Grecia | Super League | s/d | 14 | 437 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Guatemala | Liga Nacional de Guatemala | 12 | 9 | 120 | 6 | 0 | SIN DATOS SUFICIENTES |
| Guinea | Primera división de Guinea | s/d | 10 | 175 | 0 | 0 | SIN DATOS SUFICIENTES |
| Guinea Ecuatorial | Primera división de Guinea Ecuatorial | s/d | 9 | 144 | 0 | 0 | SIN DATOS SUFICIENTES |
| Guinea-Bisáu | Primera división de Guinea-Bisáu | s/d | 8 | 128 | 0 | 0 | SIN DATOS SUFICIENTES |
| Guyana | Primera división de Guyana | s/d | 10 | 150 | 4 | 43 | SIN DATOS SUFICIENTES |
| Haití | Ligue Haïtienne | s/d | 13 | 221 | 0 | 80 | SIN DATOS SUFICIENTES |
| Honduras | Liga Nacional de Honduras | s/d | 12 | 300 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Hong Kong | Primera división de Hong Kong | s/d | 11 | 211 | 2 | 2 | SIN DATOS SUFICIENTES |
| Hungría | NB I | s/d | 12 | 339 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| India | Indian Super League | s/d | 13 | 361 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Indonesia | Primera división de Indonesia | s/d | 18 | 518 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Inglaterra | Premier League | s/d | 20 | 545 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Irak | Iraq Stars League | s/d | 22 | 558 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Irán | Persian Gulf Pro League | s/d | 16 | 438 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Irlanda | League of Ireland Premier Division | s/d | 12 | 356 | 0 | 0 | INCOMPLETA |
| Irlanda del Norte | NIFL Premiership | s/d | 12 | 318 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Islandia | Besta deild | s/d | 12 | 360 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Islas Caimán | Primera división de Islas Caimán | s/d | 11 | 152 | 6 | 0 | SIN DATOS SUFICIENTES |
| Islas Cook | Primera división de Islas Cook | s/d | 6 | 96 | 0 | 96 | SIN DATOS SUFICIENTES |
| Islas Feroe | Betri deildin | s/d | 10 | 259 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Islas Salomón | Primera división de Islas Salomón | s/d | 10 | 160 | 0 | 160 | SIN DATOS SUFICIENTES |
| Islas Turcas y Caicos | Primera división de Islas Turcas y Caicos | s/d | 7 | 100 | 4 | 0 | SIN DATOS SUFICIENTES |
| Islas Vírgenes Británicas | Primera división de Islas Vírgenes Británicas | s/d | 9 | 127 | 3 | 0 | SIN DATOS SUFICIENTES |
| Islas Vírgenes Estadounidenses | Primera división de Islas Vírgenes Estadounidenses | s/d | 6 | 88 | 2 | 0 | SIN DATOS SUFICIENTES |
| Israel | Ligat Ha'Al | s/d | 14 | 420 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Italia | Serie A | s/d | 20 | 566 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Jamaica | Jamaica Premier League | s/d | 13 | 208 | 0 | 0 | SIN DATOS SUFICIENTES |
| Japón | J1 League | s/d | 20 | 670 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Kazajistán | Premier League de Kazajistán | s/d | 16 | 459 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Kenia | Primera división de Kenia | s/d | 18 | 280 | 5 | 0 | SIN DATOS SUFICIENTES |
| Kirguistán | Primera división de Kirguistán | s/d | 16 | 286 | 0 | 0 | SIN DATOS SUFICIENTES |
| Kosovo | Superliga de Kosovo | s/d | 10 | 229 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Kuwait | Primera división de Kuwait | s/d | 12 | 183 | 4 | 0 | SIN DATOS SUFICIENTES |
| Laos | Primera división de Laos | s/d | 13 | 208 | 0 | 208 | SIN DATOS SUFICIENTES |
| Lesoto | Primera división de Lesoto | s/d | 10 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Letonia | Virslīga | s/d | 10 | 185 | 4 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Lituania | A Lyga | 10 | 9 | 229 | 0 | 0 | INCOMPLETA |
| Luxemburgo | BGL Ligue | s/d | 16 | 292 | 2 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Macao | Primera división de Macao | s/d | 11 | 176 | 0 | 176 | SIN DATOS SUFICIENTES |
| Madagascar | Primera división de Madagascar | s/d | 10 | 145 | 3 | 0 | SIN DATOS SUFICIENTES |
| Malasia | Primera división de Malasia | s/d | 12 | 335 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Malaui | Primera división de Malaui | s/d | 10 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Maldivas | Primera división de Maldivas | s/d | 10 | 160 | 0 | 160 | SIN DATOS SUFICIENTES |
| Malí | Primera división de Malí | s/d | 12 | 216 | 3 | 0 | SIN DATOS SUFICIENTES |
| Malta | Premier League de Malta | s/d | 12 | 254 | 3 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Marruecos | Primera división de Marruecos | s/d | 13 | 454 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Mauricio | Primera división de Mauricio | s/d | 8 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Mauritania | Primera división de Mauritania | s/d | 9 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| México | Liga MX | s/d | 18 | 530 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Mongolia | Primera división de Mongolia | s/d | 9 | 159 | 0 | 0 | SIN DATOS SUFICIENTES |
| Montenegro | Prva CFL | s/d | 10 | 254 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Mozambique | Primera división de Mozambique | s/d | 13 | 210 | 2 | 0 | SIN DATOS SUFICIENTES |
| Myanmar | Primera división de Myanmar | s/d | 11 | 176 | 0 | 176 | SIN DATOS SUFICIENTES |
| Namibia | Primera división de Namibia | s/d | 10 | 159 | 1 | 0 | SIN DATOS SUFICIENTES |
| Nepal | Primera división de Nepal | s/d | 14 | 241 | 0 | 0 | SIN DATOS SUFICIENTES |
| Nicaragua | Liga Primera | s/d | 10 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Nigeria | Primera división de Nigeria | s/d | 20 | 325 | 9 | 1 | SIN DATOS SUFICIENTES |
| Noruega | Eliteserien | s/d | 16 | 431 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Nueva Caledonia | Primera división de Nueva Caledonia | s/d | 10 | 160 | 0 | 160 | SIN DATOS SUFICIENTES |
| Nueva Zelanda | National League | s/d | 10 | 248 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Omán | Primera división de Omán | s/d | 14 | 222 | 2 | 0 | SIN DATOS SUFICIENTES |
| Países Bajos | Eredivisie | s/d | 18 | 463 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Panamá | Liga Panameña de Fútbol | s/d | 12 | 316 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Papúa Nueva Guinea | Primera división de Papúa Nueva Guinea | s/d | 11 | 176 | 0 | 176 | SIN DATOS SUFICIENTES |
| Paraguay | Primera División de Paraguay | s/d | 11 | 325 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Perú | Liga 1 | s/d | 15 | 498 | 1 | 0 | INCOMPLETA |
| Polonia | Ekstraklasa | s/d | 18 | 544 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Portugal | Liga Portugal Betclic | 18 | 18 | 526 | 0 | 0 | COMPLETA (clubes, planteles, dorsales, posiciones y nacionalidades verificados; GRL y valores estimados) |
| Puerto Rico | Primera división de Puerto Rico | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| Qatar | Qatar Stars League | s/d | 12 | 360 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| RD Congo | Primera división de RD Congo | s/d | 23 | 469 | 2 | 0 | SIN DATOS SUFICIENTES |
| República Centroafricana | Primera división de República Centroafricana | s/d | 8 | 128 | 0 | 0 | SIN DATOS SUFICIENTES |
| República Dominicana | Liga Dominicana de Fútbol | s/d | 8 | 128 | 0 | 80 | SIN DATOS SUFICIENTES |
| Ruanda | Primera división de Ruanda | s/d | 16 | 221 | 10 | 0 | SIN DATOS SUFICIENTES |
| Rumanía | SuperLiga | s/d | 16 | 484 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Rusia | Premier Liga | s/d | 16 | 452 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Samoa | Primera división de Samoa | s/d | 12 | 192 | 0 | 192 | SIN DATOS SUFICIENTES |
| Samoa Americana | Primera división de Samoa Americana | s/d | 10 | 160 | 0 | 160 | SIN DATOS SUFICIENTES |
| San Cristóbal y Nieves | Primera división de San Cristóbal y Nieves | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| San Marino | Campionato Sammarinese | s/d | 16 | 352 | 2 | 0 | PENDIENTE DE INVESTIGACIÓN |
| San Vicente y las Granadinas | Primera división de San Vicente y las Granadinas | s/d | 8 | 120 | 2 | 0 | SIN DATOS SUFICIENTES |
| Santa Lucía | Primera división de Santa Lucía | s/d | 9 | 133 | 3 | 0 | SIN DATOS SUFICIENTES |
| Santo Tomé y Príncipe | Primera división de Santo Tomé y Príncipe | s/d | 8 | 144 | 0 | 0 | SIN DATOS SUFICIENTES |
| Serbia | Super liga | 16 | 14 | 445 | 0 | 0 | INCOMPLETA |
| Seychelles | Primera división de Seychelles | s/d | 9 | 144 | 0 | 0 | SIN DATOS SUFICIENTES |
| Sierra Leona | Primera división de Sierra Leona | s/d | 10 | 159 | 1 | 0 | SIN DATOS SUFICIENTES |
| Singapur | Primera división de Singapur | s/d | 8 | 163 | 0 | 0 | SIN DATOS SUFICIENTES |
| Somalia | Primera división de Somalia | s/d | 10 | 159 | 1 | 0 | SIN DATOS SUFICIENTES |
| Sudáfrica | Primera división de Sudáfrica | s/d | 15 | 533 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Sudán | Primera división de Sudán | s/d | 2 | 32 | 0 | 0 | SIN DATOS SUFICIENTES |
| Sudán del Sur | Primera división de Sudán del Sur | s/d | 7 | 128 | 0 | 0 | SIN DATOS SUFICIENTES |
| Suecia | Allsvenskan | s/d | 16 | 462 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Suiza | Super League | s/d | 12 | 353 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Surinam | Primera división de Surinam | s/d | 10 | 137 | 4 | 0 | SIN DATOS SUFICIENTES |
| Tahití | Primera división de Tahití | s/d | 7 | 97 | 7 | 0 | SIN DATOS SUFICIENTES |
| Tailandia | Primera división de Tailandia | s/d | 14 | 468 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Taiwán | Primera división de Taiwán | s/d | 8 | 128 | 0 | 128 | SIN DATOS SUFICIENTES |
| Tanzania | Primera división de Tanzania | s/d | 16 | 74 | 16 | 0 | SIN DATOS SUFICIENTES |
| Tayikistán | Primera división de Tayikistán | s/d | 21 | 336 | 0 | 336 | SIN DATOS SUFICIENTES |
| Timor Oriental | Primera división de Timor Oriental | s/d | 10 | 160 | 0 | 160 | SIN DATOS SUFICIENTES |
| Togo | Primera división de Togo | s/d | 10 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Tonga | Primera división de Tonga | s/d | 7 | 112 | 0 | 112 | SIN DATOS SUFICIENTES |
| Trinidad y Tobago | TT Premier Football League | s/d | 12 | 192 | 0 | 32 | SIN DATOS SUFICIENTES |
| Turkmenistán | Primera división de Turkmenistán | s/d | 8 | 109 | 5 | 0 | SIN DATOS SUFICIENTES |
| Turquía | Süper Lig | s/d | 18 | 482 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Ucrania | Premier Liha | s/d | 16 | 468 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Uganda | Primera división de Uganda | s/d | 17 | 202 | 10 | 0 | SIN DATOS SUFICIENTES |
| Uruguay | Liga AUF Uruguaya | s/d | 16 | 485 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Uzbekistán | Primera división de Uzbekistán | s/d | 10 | 287 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Vanuatu | Primera división de Vanuatu | s/d | 11 | 176 | 0 | 176 | SIN DATOS SUFICIENTES |
| Venezuela | Liga FUTVE | s/d | 14 | 430 | 2 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Vietnam | Primera división de Vietnam | s/d | 14 | 405 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Zambia | Primera división de Zambia | s/d | 19 | 231 | 9 | 0 | SIN DATOS SUFICIENTES |
| Zimbabue | Primera división de Zimbabue | s/d | 18 | 285 | 3 | 0 | SIN DATOS SUFICIENTES |
