# MODO CARRERA 11.0 — Informe de la versión

Fecha de referencia de los datos: **12 de noviembre de 2026**. Temporadas de referencia: **2026/27** (Europa, África, Asia) y **2026** (Sudamérica y ligas de calendario anual).

La 11.0 incluye todo lo de la 10.0.1 (ver `INFORME_AUDITORIA_10.0.1.md`) y suma las correcciones de abajo. Lo que sigue sin resolver está en la sección 3, con la razón de cada caso.

## 1. Qué se corrigió en la 11.0

### 1.1 Ligas con clubes faltantes o mal asignados

| Liga | Antes | Ahora | Qué pasaba y qué se hizo |
|---|---|---|---|
| Chile (Liga de Primera 2026) | 14 | **16** | Faltaban **Coquimbo Unido** (campeón 2025) y **Deportes Limache**. Se agregaron con sus planteles de Wikipedia (Coquimbo, plantel oficial de la ANFP al 7/8/2026). El plantel de Limache **estaba pegado dentro de Ñublense** (19 jugadores), se sacó de ahí. Además, el plantel de **Palestino** (6 jugadores) estaba mezclado con el de **Audax Italiano**: se separó por dorsales y Palestino quedó con 28 |
| Perú (Liga 1 2026) | 15 | **16** de 18 | Se agregaron **Universitario** (plantel de noviembre de 2026) y **Melgar**. El plantel de Melgar estaba mezclado dentro de **Alianza Atlético** (18 jugadores). La página de Melgar en la fuente es de 2025, así que su plantel queda marcado como no verificado. "**2 de Mayo**" no es peruano: es el club paraguayo de Pedro Juan Caballero, y pasó a Paraguay. Faltan **Sport Huancayo** y **UTC** |
| Paraguay (2026) | 11 | **12** | Completo con 2 de Mayo |
| Bolivia (2026) | 13 | 13 de 16 | El plantel de **Real Potosí** (2 jugadores) estaba mezclado dentro de **Blooming** (66). Se separó y Real Potosí quedó con 33. Faltan **ABB, Always Ready y Guabirá** |
| Serbia y Bulgaria | 14 | **14 (correcto)** | El informe 10.0 y mi informe 10.0.1 decían que tenían 16 clubes. **Era un error**: las dos ligas se redujeron a 14 en 2026/27, y la lista de clubes de la base coincide exactamente con la real. Se cargó el formato real: en Serbia, grupo campeonato del 1.º al 6.º, grupo descenso del 7.º al 14.º y 4 descensos (la liga pasa a 12 equipos). En Bulgaria, grupos 1.º–4.º, 5.º–8.º y 9.º–14.º |
| Lituania (Toplyga 2026) | 9 | **9 (correcto)** | Empezó con 10 clubes, pero FK Riteriai se retiró |

**Se encontró un error del PDF que no conocíamos:** algunos clubes traían **los planteles de dos o tres equipos intercalados** por puesto. Se nota porque los dorsales vuelven a empezar dentro del mismo puesto (dos arqueros con el número 1, por ejemplo). Corregí los casos de Ñublense, Audax Italiano, Alianza Atlético y Blooming. Quedan **33 clubes con más de 40 jugadores** que probablemente tienen el mismo problema. La lista está en la sección 3.

### 1.2 Homónimos de la Liga Argentina

Los 6 pares de jugadores con el mismo nombre (Franco Vázquez, Damián Fernández, Julián Fernández, Tomás Fernández, David Martínez y Tomás González) ahora aparecen los dos en el mercado y en las selecciones. Al segundo de cada par se le agregó el club al nombre, por ejemplo "Franco Vázquez (Belgrano)". **Es lo único que cambió en Argentina**: no se tocaron clubes, calendario, GRL ni nacionalidades.

### 1.3 Partidas guardadas

- Antes, si la base cambiaba la cantidad de clubes de una liga, la temporada en curso **rehacía el calendario**. Lo comprobé con una carrera de Chile creada en la 10.0. Ahora **una temporada ya empezada conserva su calendario y sus resultados**, y los clubes nuevos entran desde la temporada siguiente. También lo comprobé: la temporada siguiente arranca con los 16 clubes.
- Versión de la app: **11.0**. Al abrirla se crea la copia automática "Antes de actualizar a la versión 11.0". No cambió la estructura de las partidas ni ninguna clave de almacenamiento.

### 1.4 Cifras

- **4 clubes agregados** (Coquimbo Unido, Deportes Limache, Universitario y Melgar) y **2 planteles recuperados** (Palestino y Real Potosí).
- **Jugadores agregados:** 85 nuevos en los 4 clubes. Además, **92 jugadores que estaban en el club equivocado** pasaron a su club: 39 a los clubes nuevos y 53 a Palestino y Real Potosí.
- **Total:** 2.327 clubes en 189 ligas.

## 2. Pruebas de funcionamiento (11.0)

Se hicieron en Chrome sin interfaz, con pantalla de 390×844:

- **Partidas anteriores:** tres carreras creadas con la 10.0 original (Benfica, Čukarički y O’Higgins) cargaron con sus resultados y su calendario, y siguieron jugándose.
- **Carreras nuevas en 22 clubes:** Coquimbo Unido, Palestino, Universitario, 2 de Mayo, Real Potosí, Čukarički, Levski Sofia, Belgrano, Marítimo, Sporting CP, MC Alger, Tianjin, Cobán Imperial, ENPPI, FC Tokyo, Palmeiras, América, 3K FC, Manchester City, Auckland City, Primeiro de Agosto y Aduana Stars. Se jugaron 4 partidos con cada una, incluidos partidos de Libertadores, Champions y Conference, sin errores de JavaScript.
- **Temporada completa:** con Sporting CP (44 partidos), con cierre de temporada y arranque de la 2027/28.
- **Mercado, guardado y selecciones:** el fichaje de Samu Aghehowa actualizó los planteles, la carrera siguió igual después de recargar y la selección de Portugal convocó 26 jugadores.
- **Jugadores retirados:** al pasar a la temporada 2027/28, los jugadores que cumplen 39 años se retiran (Messi, Cristiano Ronaldo y Di María, entre otros). Es el comportamiento normal del juego; no se pierden datos.

## 3. Lo que todavía falta, y por qué

1. **Escudos: ninguno nuevo.** Desde esta sesión no se pueden descargar imágenes. Los 2.297 escudos pendientes figuran en `assets/escudos/LISTA_ESCUDOS.txt` con el nombre exacto de archivo. Si me pasás los PNG, los cargo y reviso que cada uno corresponda a su club.
2. **Clubes faltantes sin plantel conseguido:**
   - Perú: Sport Huancayo y UTC.
   - Bolivia: ABB, Always Ready y Guabirá.
   - Argelia: CS Constantine, CR Témouchent y USM Khenchela.
   - Guatemala: 3 clubes.
   - Egipto: hasta 4 clubes.

   Algunos probablemente estén **mezclados dentro de clubes sobredimensionados**: Juan Pablo II College y ADT Tarma tienen más de 50 jugadores; Modern Sport, con 84, e Ittihad Alexandria, con 78, en Egipto.
3. **Clubes con más de 40 jugadores** (posibles planteles mezclados): Aucas (72), Emelec (64) y Delfín (63) en Ecuador; Modern Sport e Ittihad Alexandria en Egipto; RS Berkane y Wydad en Marruecos; Sekhukhune y Mamelodi Sundowns en Sudáfrica; Chonburi y Ayutthaya en Tailandia; Academia Puerto Cabello y Monagas en Venezuela, y otros. Separarlos sin confundir jugadores requiere identificar cada bloque con una fuente, como hice con Palestino y Real Potosí.
4. **30 países sin liga:** Estonia, Moldavia, Macedonia del Norte, Corea del Sur, Túnez, Senegal y los demás de la lista anterior.
5. **Planteles de relleno o generados en unas 100 ligas pequeñas** (3.463 jugadores con la marca GEN.). También quedan sin identificar 11 clubes de Bermudas, Haití, Cuba y Guyana, y el club "A" de Argelia.
6. **Datos estimados:** los GRL y los valores de mercado de los clubes agregados en esta auditoría son estimaciones (Transfermarkt no se pudo consultar). Las edades sin dato en la fuente también son estimadas. Todo está marcado con **EST.**

## 4. Tabla por país (11.0)

"s/d" significa que la cantidad real de clubes no se verificó. **COMPLETA** quiere decir clubes correctos y planteles verificados con fuentes. **INCOMPLETA**, que faltan clubes conocidos. **SIN DATOS SUFICIENTES**, que la mitad o más de los clubes tienen relleno, o que el promedio es de menos de 14 jugadores por club. **PENDIENTE DE INVESTIGACIÓN**, que la cantidad de clubes está bien o no se verificó y los planteles vienen del PDF sin volver a verificarlos.

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
| Bolivia | División Profesional | 16 | 13 | 428 | 0 | 0 | INCOMPLETA |
| Bosnia y Herzegovina | Premijer liga | s/d | 10 | 247 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Botsuana | Primera división de Botsuana | s/d | 4 | 61 | 2 | 0 | SIN DATOS SUFICIENTES |
| Brasil | Brasileirão Série A | s/d | 20 | 698 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Brunéi | Primera división de Brunéi | s/d | 12 | 192 | 0 | 192 | SIN DATOS SUFICIENTES |
| Bulgaria | efbet Liga | 14 | 14 | 381 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Burkina Faso | Primera división de Burkina Faso | s/d | 8 | 144 | 0 | 0 | SIN DATOS SUFICIENTES |
| Burundi | Primera división de Burundi | s/d | 10 | 159 | 1 | 0 | SIN DATOS SUFICIENTES |
| Bután | Primera división de Bután | s/d | 10 | 160 | 0 | 160 | SIN DATOS SUFICIENTES |
| Cabo Verde | Primera división de Cabo Verde | s/d | 9 | 144 | 0 | 0 | SIN DATOS SUFICIENTES |
| Camboya | Primera división de Camboya | s/d | 10 | 217 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Camerún | Primera división de Camerún | s/d | 10 | 160 | 0 | 0 | SIN DATOS SUFICIENTES |
| Canadá | Canadian Premier League | s/d | 8 | 198 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Chad | Primera división de Chad | s/d | 11 | 175 | 1 | 0 | SIN DATOS SUFICIENTES |
| Chequia | Chance Liga | s/d | 16 | 471 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Chile | Liga de Primera | 16 | 16 | 461 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
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
| Lituania | A Lyga | 9 | 9 | 229 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
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
| Paraguay | Primera División de Paraguay | 12 | 12 | 340 | 1 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Perú | Liga 1 | 18 | 16 | 520 | 0 | 0 | INCOMPLETA |
| Polonia | Ekstraklasa | s/d | 18 | 544 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
| Portugal | Liga Portugal Betclic | 18 | 18 | 526 | 0 | 0 | COMPLETA (GRL y valores estimados) |
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
| Serbia | Super liga | 14 | 14 | 445 | 0 | 0 | PENDIENTE DE INVESTIGACIÓN |
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
