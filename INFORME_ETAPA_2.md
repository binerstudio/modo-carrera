# MODO CARRERA 12.4.0 · ETAPA 2 — MOTOR DE PARTIDOS

**Fecha:** 23/11/2026 · **Rama:** `etapa-2` (parte de `etapa-1`; nada pasó todavía a `main`) · **Vista previa:** https://etapa-2.carreramod0.pages.dev

## 1. Análisis del sistema anterior

El motor v1 (`js/core/07-mc7-match.js`) ya simulaba minuto a minuto, con tácticas con tope, penales, tarjetas, lesiones y cambios. Pero casi todo se decidía con el **GRL**:

- Los atributos de cada jugador eran iguales para todos (60/60/60/60/70/65).
- No influían el clima, el césped, el árbitro, el VAR, la química, el entrenador, la moral ni la importancia del partido.
- No había errores individuales, errores arbitrales ni rebotes.

## 2. Qué se hizo

### Atributos individuales (`js/motor/atributos.js`)

- **25 atributos de campo:** ritmo, aceleración, velocidad, tiro, definición, potencia, pase corto, pase largo, visión, centros, regate, control, agilidad, equilibrio, fuerza, resistencia, salto, cabeceo, marcaje, entradas, intercepciones, posicionamiento, reacciones, anticipación e inteligencia táctica.
- **5 de arquero:** estirada, manejo, saque, reflejos y colocación.
- **Son estimados** (marca `origen:'estimado'`), porque no hay una fuente con atributos reales. Salen de la posición, el GRL y la edad, más un **perfil de juego** elegido de forma fija por el nombre. Algunos ejemplos de perfil: lateral, central, creador, contención, delantero de área, rápido, técnico, atajador, arquero con juego de pies.
- **Deterministas:** el mismo jugador siempre tiene los mismos valores.
- **Normalizados:** el compuesto principal de su puesto es igual a su GRL. El GRL sigue siendo la referencia y los atributos reparten virtudes y defectos.
- Si en el futuro un jugador trae atributos verificados, se usan esos y no se estima nada.

### Motor v2 (`js/motor/motor-v2.js`)

**De qué depende cada partido:**
- Los atributos de cada jugador según el tipo de jugada. Por ejemplo, un cabezazo usa cabeceo y salto; un remate de afuera usa tiro y potencia; un penal, definición contra arquero.
- El GRL y la adaptación al puesto, con penalización al jugar fuera de su posición.
- La formación y las tácticas: el mismo sistema y los mismos topes que v1, con controles en vivo.
- El estado físico previo y la **fatiga individual minuto a minuto**, según la resistencia, la presión, el ritmo y el clima.
- La **moral** de cada jugador, la **química** (cuántos titulares repiten), el **entrenador** (nivel del DT rival), la localía, el **clima** (despejado, nublado, lluvia, calor o viento) y el **césped** (perfecto, bueno o irregular).
- La **importancia** del partido: recta final del torneo, eliminación directa o final.
- El **árbitro**, con severidad y precisión propias.

**Eventos nuevos:**
- **VAR:** anula goles (fuera de juego, falta o mano), revisa goles válidos y cobra penales que el árbitro no vio.
- **Errores arbitrales:** penal no cobrado y offside mal señalado.
- **Errores individuales:** de defensores y arqueros, más frecuentes con cansancio, lluvia y césped malo.
- **Rebotes** después de una atajada y **tiros libres directos** después de faltas cerca del área.
- **Lesiones** con más riesgo según el cansancio y el césped.
- **Previa del partido** con clima, césped, árbitro, importancia y química.

El **mismo código** calcula el partido en vivo y la simulación masiva de las pruebas.

### Conexión (`js/motor/conexion.js` y un gancho en `07-mc7-match.js`)

- **Carreras nuevas → motor v2. Carreras existentes → siguen con v1**, para no cambiar cómo venían jugándose.
- Se cambia en **Configuración → General → Motor de partidos**, y aplica desde el próximo partido.
- El gancho en `07-mc7-match.js` solo actúa si el partido es v2. Si no, el código v1 corre igual que antes (está demostrado con la huella).

## 3. Archivos

**Nuevos:**
- `js/motor/atributos.js`, `js/motor/motor-v2.js`, `js/motor/conexion.js`
- `tests/motor.mjs`
- `INFORME_ETAPA_2.md`

**Modificados:**
- `js/core/07-mc7-match.js`: gancho v2, funciones de relato para v2, y `injure` acepta un jugador ya elegido (sin cambio para v1).
- `index.html`: 3 scripts nuevos y versión 12.4.
- `js/core/05-mc9-datos.js`: `APP_VERSION`.
- `sw.js`, `tests/regresion.mjs`, `tests/actualizacion.mjs`, `.github/workflows/pruebas.yml` y `LEEME.txt`.

## 4. Validación (ejecutada de verdad en GitHub Actions)

### Simulación masiva (`tests/motor.mjs`, sin navegador)

Se jugaron 7 ligas completas, de ida y vuelta, con planteles reales de la base: España, Inglaterra, Italia, Alemania, Francia, Argentina y Brasil. En total fueron **1.898 partidos**.

| Medida (por partido) | Motor v2 | Rango de referencia aproximado* |
|---|---|---|
| Goles | 2,59 | 2,2 – 3,0 |
| Local / empate / visitante | 41,5 % / 24,9 % / 33,6 % | 38–52 / 20–32 / 24–38 % |
| Remates por equipo | 13,0 | 9 – 15 |
| % de remates al arco | 38 % | 28 – 42 % |
| Conversión | 10 % | 8 – 14 % |
| Córners por equipo | 4,75 | 3,5 – 6,5 |
| Faltas por equipo | 10,6 | 9 – 15 |
| Amarillas por equipo | 1,49 | 1,3 – 2,8 |
| Expulsiones | 0,23 | 0,04 – 0,3 |
| Penales | 0,34 | 0,15 – 0,45 |
| Goleadas por 5 o más goles | 0,4 % | < 3 % |
| Marcadores más comunes | 1-1, 2-1, 1-0, 1-2, 0-1, 2-0 | — |

\* Son rangos orientativos del fútbol profesional para detectar resultados absurdos. No son estadísticas oficiales.

**La tabla sigue a la calidad.** La correlación entre el GRL del once y los puntos va de 0,73 a 0,95 según la liga. Los campeones salen lógicos: Real Madrid, Arsenal, Inter, Bayern, PSG, River y Flamengo.

**Causa y efecto.** Cada prueba enfrenta dos equipos que se diferencian en un solo factor:

| Factor | Con | Sin |
|---|---|---|
| Estado físico 95 contra 60 | 1,34 pts/partido | 1,04 |
| Moral 95 contra 40 | 1,53 | 1,28 |
| Entrenador 88 contra 52 | 1,47 | 1,36 |
| Química 1 contra 0,2 | 1,47 | 1,32 |
| Táctica ofensiva (remates) | 14,9 | 12,6 |
| Táctica defensiva (goles en contra) | 0,76 | 1,15 |
| Lluvia y césped irregular (errores individuales) | 0,50 | 0,31 |
| Partido decisivo (tarjetas) | 4,8 | 3,2 |
| Equipo superior (pts/partido) | 2,60 | 1,38 |
| Localía (pts/partido) | 1,48 | 1,25 |

**Determinismo:** con la misma semilla, el resultado es idéntico.

### En el juego real (navegador, `tests/regresion.mjs`)

- **El motor v1 no cambió:** la huella sigue en `b6e76d8864c3a1f4` (River 2 temporadas, Real Madrid y Arsenal).
- **Temporada completa con v2** (Boca, 36 partidos): 0 errores de JavaScript y previa en todos los partidos. Hubo 18 revisiones del VAR, 15 errores individuales, 7 errores arbitrales y varios climas.
- **Una carrera de la 12.2** se abre con la 12.4: datos idénticos, **sigue con v1** y se crea la copia automática "Antes de actualizar".
- El selector de motor aparece en Configuración. Siguen pasando la prueba de almacenamiento lleno y la de la pantalla de carga.

## 5. Hallazgo importante (ya existía antes)

La prueba automática juega todos los partidos **sin rotar nunca el equipo**. Con los dos motores, el once termina la temporada con **estado físico 42**, que es el mínimo del juego. Por eso Boca terminó 24.º, tanto con v1 (36 pts) como con v2 (28 pts, una sola temporada, con mucha variación).

No es un error del motor: un DT real rota. Pero un jugador que simula rápido sin tocar el equipo sufre lo mismo. El v2 usa el mismo peso del estado físico previo que el v1, para no empeorarlo.

**Propuesta:** una opción de "rotación automática" del asistente en la Etapa 3 o la Etapa 4.

## 6. Pendientes (no hechos en esta etapa)

- **Visualización 2D avanzada** (punto 8 del proyecto): cámaras, jugadores en movimiento y trayectoria del balón. Hoy el v2 se ve con el mismo marcador, relato y estadísticas de siempre. Propongo hacerla como **Etapa 2B**, ya con el motor validado.
- **Partidos entre clubes de la IA:** siguen con el modelo rápido. Pasan al v2 en la Etapa 3, junto con alineaciones y entrenadores autónomos.
- **Ficha del jugador:** todavía muestra los 6 atributos viejos. La ficha con los 25 atributos (marcados "estimado") y los PlayStyles va en la Etapa 4.
- **IDs estables de jugadores:** no se hicieron. Los atributos se calculan a partir del jugador sin cambiar el formato de los datos, así que no hicieron falta. Quedan para cuando se agreguen fichas e historial (Etapa 4).
- **Rivalidades y clásicos** como factor de importancia: no hay datos de rivalidades todavía (Etapa 6).
- Las cifras de referencia de la tabla son orientativas. Si querés, en una próxima etapa se calibra liga por liga contra estadísticas reales con fuente.

## 7. Publicación

Hoy la 12.4 está solo en la vista previa **etapa-2.carreramod0.pages.dev**. La principal sigue con la 12.2.2. Cuando lo autorices, paso `etapa-2` a `main` (incluye la Etapa 1) y se publica sola.
