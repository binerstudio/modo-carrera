# MODO CARRERA 12.8.0 · ETAPA 4 — FICHA, ROTACIÓN E IA

**Fecha:** 26/11/2026 · **Rama:** `etapa-4` (creada desde `main`, que no se tocó) · **Vista previa:** https://etapa-4.carreramod0.pages.dev

## 1. Ficha del jugador (`js/plantel/ficha.js`)

**Atributos.** La ficha muestra los mismos atributos que usan los motores v2 y v3 en el partido (`MCAtributos`):

| Grupo | Cantidad | Atributos |
|---|---|---|
| Técnicos | 12 | tiro, definición, potencia, pase corto, pase largo, centros, regate, control, cabeceo, marcaje, entradas, intercepciones |
| Mentales | 5 | visión, posicionamiento, reacciones, anticipación, inteligencia táctica |
| Físicos | 8 | ritmo, aceleración, velocidad, agilidad, equilibrio, fuerza, resistencia, salto |
| De arquero | 5 | estirada, manejo, saque, reflejos, colocación |

- Son 25 de campo más 5 de arquero. En los arqueros el grupo de arquero va primero; en los jugadores de campo va al final y atenuado.
- Todos son **estimados**: salen de la posición, el GRL y la edad, porque no hay una fuente con atributos reales.
  - Cada grupo lleva la marca "estimado" y hay un texto que lo explica.
  - Si algún día un jugador trae atributos verificados, se muestran sin la marca.
- El gráfico de seis ejes ahora sale de estos atributos y ya no de los 6 valores viejos.

**PlayStyles.** Son 22 estilos, cada uno con ícono y una explicación corta (17 de campo y 5 de arquero). Algunos ejemplos: ⚡ Explosivo, 🎯 Definidor, 🪄 Gambeta, 🔭 Visionario, 🗼 Juego aéreo, 🧱 Marcador, 🧤 Reflejos y 🦵 Arquero con pies.
- Se deducen de los atributos estimados, por eso también se marcan "estimados".
- Un jugador tiene un estilo cuando ese rasgo es muy alto, o cuando se destaca respecto de su propio nivel: 9 puntos o más sobre el promedio de sus atributos (4 en los arqueros) y no menos que su GRL − 2.
- "+" indica nivel de élite. Se muestran como máximo 4 por jugador.
- Son informativos: el motor usa los atributos, no los estilos.
- El 27 % de la base queda "sin estilo destacado": son jugadores con atributos parejos.

**Para cualquier jugador:**
- **Tu plantel:** se completa la pantalla de la ficha que ya existía; todo lo demás queda igual. Se suma el botón **📌 Marcar fijo**, que se usa en la rotación.
- **Cualquier otro jugador:** se abre una ventana con la misma información (`mcFichaJugador`) desde la ficha del club.

## 2. Rotación automática (`js/plantel/rotacion.js`)

**Dónde se activa:** Configuración → Partido → **Rotación automática**. Se guarda por carrera y viene **apagada**, también en las carreras existentes.

**Qué hace antes de cada partido tuyo:**
- Saca del once a los lesionados, a los suspendidos y a los cansados (físico menor a 68 %).
- Pone al mejor suplente sano con 68 % o más de físico, siempre que rinda más.
  - Para comparar se usa el GRL en ese puesto menos medio punto por cada punto de físico por debajo de 80.
- Vuelve a poner al titular recuperado si rinde 3 puntos más que su reemplazo.

**Fijos:**
- La rotación nunca saca a un fijo del once ni lo usa como reemplazo.
- Si un fijo quedó afuera, por ejemplo porque volvió de una lesión, el asistente lo devuelve al once.
- Si un fijo está lesionado o suspendido igual no puede jugar: lo cambia la regla de siempre del juego.

**Garantías:**
- El arco solo se cambia por otro arquero y un arquero nunca entra en un puesto de campo.
- Cada cambio es un intercambio titular ⇄ suplente, así que el once nunca baja de 11.
- Lo que hizo queda en el buzón, por ejemplo: "🔄 Rotación automática: entra X por Y (cansado, 62 %)".

**Calibración:** probé dos niveles en 6 temporadas por lado, con Boca y Racing y 3 semillas.

| | Puntos promedio | Físico medio del once |
|---|---|---|
| Sin rotación | 45,0 | ~79 |
| Rotación con umbral 75 % | 46,0 | ~87 |
| **Rotación con umbral 68 % (la que quedó)** | **49,0** | **~85** |

Las diferencias de puntos entran en la variación normal de una temporada, así que **no se puede afirmar que sume puntos**. Lo que sí se mide es que el once llega bastante más descansado. Elegí 68 % porque rota menos y no castiga tanto la química del v2 (cuántos titulares repiten).

## 3. Pendientes de la IA

### Lesiones y cansancio persistentes (`js/ia/estado-ia.js`)

**Dónde se guarda:** en `career.world.estIA`. Solo se guardan los lesionados y los que tienen menos de 88 % de físico. Los que tienen 88 % o más se recuperan del todo en una fecha y se toman como descansados.

**Cómo funciona:**
- **Recuperación:** +12 de físico por fecha de liga y una fecha menos de baja, igual que en tu plantel.
- **Desgaste:** el mismo que tus jugadores (4 + 9 por cada 90 minutos, más 0 a 3), con piso de 42.
- **Lesiones:** las que pasan en el partido.
- **Pretemporada:** todos arrancan descansados.

**El club de la IA también rota:**
- Deja afuera a sus lesionados y al cansado le resta valor para elegir el once.
- Nunca queda sin arquero ni con menos de 11. Si no le alcanzan los sanos, completa con el de baja más corta.

**Dónde se aplica:**
- En los partidos de la IA de tu liga (motor v2).
- En tus rivales, en liga y copa: llegan con su físico real al v3 o al v2.
  - Antes, el v3 usaba 95 fijo para todo rival.

**Dónde no se aplica:** las demás ligas y los cruces de copa entre clubes de la IA siguen con el modelo rápido de resultados, que no usa jugadores.

**Cambios mínimos en el código existente:**
- `07-mc7-match.js`: el rival se arma con su estado y se anotan sus lesionados.
- `conexion-v3.js`: el rival pasa su físico al v3.
- `motor-v2.js`: el resultado de `simular` informa los minutos jugados y los lesionados. No usa azar extra, así que el v2 da los mismos resultados con los mismos datos.

### Mercado de invierno de la IA (`js/ia/mercado-ia.js`)

**Cuándo:** una vez por temporada, cuando tu liga pasa la mitad de sus fechas. Solo con el mercado avanzado (IA v2).

**Diferencias con el de verano:**
- No hay libres ni vuelven los préstamos.
- Cada club hace como máximo 1 compra y 1 venta; hay hasta 60 traspasos y 15 préstamos.
- Los préstamos de invierno vuelven en el mercado de verano de esa misma temporada.
- Sigue la red de seguridad de siempre: ningún club queda sin lo necesario para su once.

Aparece en Mundo → Traspasos como "Mercado de invierno 2026/27" y en el buzón.

### Presupuesto de la IA visible: ficha del club

Se abre desde **Mundo → Clubes** (con selector de liga y club) o tocando un club en la tabla de posiciones.

**Qué muestra:**
- Liga, entrenador, GRL y valor del plantel.
- **Presupuesto** (`mcIAEco`), marcado "estimado".
- Lesionados y cansados.
- El plantel completo: cada jugador abre su ficha.
- Los últimos movimientos del club en el mercado.

## 4. Pruebas

Todas las corrí de verdad en esta máquina. El CI liviano de GitHub corre con cada push; el resultado está en la sección 6. Las pruebas pesadas no se corrieron (quedan "solo a mano", como siempre).

**Ficha** (`tests/ficha.mjs`, nueva): **OK**

| Qué se probó | Resultado |
|---|---|
| Fichas armadas de la base | **51.893 / 51.893**, todas con 25 + 5 atributos, enteros entre 15 y 99 y marcados "estimado" |
| Pantalla de ficha de tu plantel | 25 / 25: 30 valores, marca "estimado", PlayStyles y botón Fijo |
| Ventana de ficha de otros clubes | 407 / 407: muestra de todas las posiciones, el más joven, el más viejo, el peor, el mejor, uno sin datos, uno sin edad y uno con posición desconocida |
| Ficha por nombre | OK |
| Fichas de club | 54 / 54 (tu liga y una muestra del mundo), presupuesto numérico |
| Errores de JavaScript | 0 |

**Rotación** (`tests/rotacion.mjs`, nueva): **OK**

- **Configuración:** viene apagada; se prende y se apaga.
- **11 casos forzados**, todos ✔: todos cansados; arquero titular lesionado; arquero titular cansado; un solo arquero sano en reservas; un solo arquero y cansado; ningún arquero sano; justo 11 disponibles (dos variantes); fijos cansados; arquero fijo cansado; suspendidos y lesionados en el once.
  - En todos salen 11 a la cancha, con 1 arquero que es arquero, ningún arquero de campo, nadie lesionado o suspendido, sin repetidos y los fijos en su lugar.
- **200 planteles al azar** (físico, lesiones, suspensiones, fijos y formaciones al azar): **200 / 200** bien armados.
- **Temporada completa** (Boca, con la recuperación normal entre fechas):

| | Físico medio del once | Físico mínimo | Rotaciones | Partidos con el once mal armado |
|---|---|---|---|---|
| Sin rotación | 78,9 % | 68,5 % | — | 0 |
| Con rotación | 85,1 % | 79,6 % | 40 | 0 |

**Temporadas sin intervención** (`tests/temporadas.mjs`, ampliada; River, 3 temporadas): **OK**

| | T1 | T2 | T3 |
|---|---|---|---|
| Goles por partido en la liga | 2,49 | 2,63 | 2,47 |
| Goles con autor y asistencia | 78/78 | 69/69 | 70/70 |
| Mercado de invierno de la IA (traspasos + préstamos) | 75 (60 + 15) | 75 (60 + 15) | 75 (60 + 15) |
| Rivales que llegan con su físico | 40/40 | 38/38 | 40/40 |
| Lesionados de la IA a la vez (máximo) | 20 | 22 | 16 |
| Físico mínimo en la IA | 48 | 42 | 42 |
| Onces de la IA sin arquero o con menos de 11 (406 partidos por temporada) | 0 | 0 | 0 |
| Lesionados de la IA que jugaron | 0 | 0 | 0 |
| Jugadores en dos clubes / ¿la IA tocó tu plantel? | 0 / no | 0 / no | 0 / no |
| Peso de la partida | 487 KB | 717 KB | 927 KB |
| Errores de JavaScript | 0 | 0 | 0 |

- **Peso de la partida:** con `main` (12.7.0) y la misma semilla, la partida pesa 457 / 669 / 869 KB. La Etapa 4 suma unos 30 a 60 KB, sobre todo por el historial y los traspasos del mercado de invierno.
  - Para contenerlo, el estado de la IA se borra en cada pretemporada, del invierno se guardan los 80 movimientos más importantes y solo los 2 últimos inviernos.
- **Actualización** (`tests/actualizacion.mjs`, ampliada): además de lo de siempre (datos idénticos, copia automática, pasa al v3 y sigue jugando), ahora comprueba que la rotación arranca apagada, sin fijos, que la ficha nueva abre con 30 valores marcados "estimado" y que la ficha del club abre. Se corre desde la 12.2.2 y desde la 12.6.0.
- **Ya existentes:** motor v3 (300 partidos), v3 en el juego, marcador y auditoría de eventos. Corren en el CI liviano.

## 5. Archivos

**Nuevos:**
- `js/plantel/ficha.js`, `js/plantel/rotacion.js`, `js/ia/estado-ia.js`
- `tests/ficha.mjs`, `tests/rotacion.mjs`
- `INFORME_ETAPA_4.md`

**Modificados:**
- `js/ia/mercado-ia.js`: mercado de invierno.
- `js/ia/partidos-ia.js`: estado de la IA.
- `js/motor/motor-v2.js`: minutos y lesionados en el resultado.
- `js/motor/conexion-v3.js`: físico del rival.
- `js/core/07-mc7-match.js`: rival con su estado y sus lesionados anotados.
- `js/mc10-ui.js`: pestaña Mundo → Clubes y rótulo del invierno.
- `index.html`, `sw.js`, `js/core/05-mc9-datos.js`: versión 12.8.0, con copia automática "Antes de actualizar a la versión 12.8.0".
- `tests/temporadas.mjs`, `tests/actualizacion.mjs`, CI y `LEEME.txt`.

**Datos de jugadores y clubes:** no se tocaron (`data/` idéntico). No se inventó ningún dato real: todo lo calculado está marcado como estimado.

## 6. CI en GitHub

RESULTADOS_CI

## 7. Pendientes

- Los atributos y los PlayStyles siguen siendo estimados: falta una fuente con atributos reales.
- El cansancio y las lesiones de la IA no alcanzan a las otras ligas ni a los cruces de copa entre clubes de la IA, que usan el modelo rápido.
- La rotación no mira el calendario: no guarda titulares para un partido importante ni hace rotaciones "de copa".
- El mercado de invierno es solo de la IA. Tu mercado sigue igual que antes.
- **Peso de la partida:** sigue creciendo unos 210 KB por temporada. Conviene compactar los datos viejos (Etapa 8, nube).

## 8. Publicación

La 12.8.0 está solo en **etapa-4.carreramod0.pages.dev**. `main` no se tocó; paso todo a `main` cuando lo autorices.
