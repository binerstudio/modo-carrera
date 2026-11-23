# Motor v3 · Etapa 1 · Base de simulación

Rama: `motor-v3-e1` (creada desde `etapa-2d-e4`) · Vista previa: https://motor-v3-e1.carreramod0.pages.dev · `main` sin cambios.

## Qué es
Un motor de partido nuevo (`js/motor/motor-v3.js`, objeto global `MCMotorV3`) en el que el partido **se juega en la cancha**: 22 jugadores y una pelota con física, en una cancha de 105 × 68 m, a **10 ticks por segundo de juego**. El resultado sale de lo que pasa ahí: no hay probabilidades de gol "por minuto".

Todavía **no está conectado al juego** (eso es la etapa 5): `index.html` no lo carga, y los motores v1 y v2 siguen igual (no se tocaron).

## Qué se hizo
- **Determinista y sin navegador**: tiene su propio generador de azar con semilla (un número o un texto). No usa `Math.random`, la hora, `window` ni `document`. Corre en Node.
- **Pelota con física**:
  - pase raso con rozamiento del césped;
  - pase por arriba con gravedad, rozamiento del aire y piques que pierden altura;
  - remates;
  - rebotes en jugadores (bloqueos, controles fallados, despejes y pases de cabeza), en los palos y en el travesaño;
  - salidas por lateral y por línea de fondo (córner o saque de arco según quién la tocó último), y gol cuando cruza entera la línea entre los palos y debajo del travesaño.
- **Jugadores**: la velocidad máxima y la aceleración salen de los atributos `velocidad` y `aceleracion` de `MCAtributos`, que son estimados y llevan `origen:'estimado'` (si `MCAtributos` no está, se usa el GRL). Se cansan según su `resistencia`. Se chocan: nadie atraviesa a nadie, y el más fuerte empuja más.
- **Decisiones del que tiene la pelota**, en cada momento: pasar (raso o por arriba), conducir (prueba 8 direcciones), gambetear al rival que tiene encima, o patear. Para elegir mira:
  - las líneas de pase libres (quién llega antes a la trayectoria);
  - la presión rival;
  - la distancia y el ángulo al arco (xG estimado y rivales en la línea de tiro);
  - sus atributos (pase corto y largo, centros, visión, regate, control, definición, tiro, potencia, cabeceo).
- **Sin pelota, de forma básica**:
  - cada uno va a su posición en la formación, corrida según la pelota y según quién la tiene;
  - el más cercano presiona, el segundo cubre, y cerca del área un tercero cierra el camino al arco;
  - defensores y volantes marcan al rival que entra en su zona;
  - el más cercano busca la pelota suelta y el que recibe va a la línea del pase;
  - los delanteros no se adelantan a la línea del último defensor;
  - el arquero se ubica entre la pelota y el arco, achica, se tira y ataja (puede retenerla o dar rebote).
- **Salida de `MCMotorV3.simular(local, visitante, {semilla})`**:
  - marcador y estadísticas: posesión, pases y pases completos, pases por arriba, remates, al arco, atajadas, bloqueos, palos, córners, laterales, saques de arco, quites, intercepciones, gambetas, cabezazos, xG y minutos con la pelota en juego;
  - datos por jugador (incluye los km recorridos);
  - **eventos** con tick, parte, minuto (con el añadido), jugadores y tipo: inicio, saque del medio, pase, intercepción, quite, gambeta, remate, bloqueo, atajada, palo, gol (con asistencia y gol en contra), lateral, córner, saque de arco, entretiempo y final;
  - la **cinta**: la posición de la pelota (x, y, altura, dueño) y de los 22 jugadores, en decímetros, 2 veces por segundo por defecto. Con `cintaCada:1` guarda los 10 cuadros por segundo. `MCMotorV3.cuadro(cinta, k)` la lee.

## Pruebas
`tests/motor-v3.mjs`, agregada a `.github/workflows/pruebas.yml` justo después de la prueba del motor v2:
- **1000 partidos** entre planteles de la base, sin errores. En cada uno revisa:
  - que el marcador coincida con los eventos de gol;
  - que la posesión sume 100;
  - que no haya más pases completos que intentados;
  - que la cinta tenga el tamaño justo y que la pelota y los jugadores estén dentro de la cancha;
  - que no haya valores NaN.
- **Determinismo**: la misma semilla da el mismo partido (eventos, estadísticas y cinta completa a 10 cuadros por segundo), y semillas distintas dan partidos distintos.
- **Sin `Math.random`**: dentro de la prueba, `Math.random` está reemplazado por una trampa que hace fallar todo si alguien lo llama.
- **Física**:
  - un raso a 15 m/s frena siempre y se detiene (recorre 71,5 m);
  - un pase por arriba calculado para 30 m pica a 29,6 m;
  - los piques bajan de altura (4,78 m, 0,89 m, 0,17 m).
- **Atributos**: se usan los de `MCAtributos` (velocidad máxima entre 6,15 y 7,45 m/s según el jugador). Sin `MCAtributos`, el motor funciona igual con el GRL.
- **Tiempo por partido**: se informa.

### Resultados (1000 partidos, corrida local)
- Todo OK: 0 errores y determinismo OK.
- Tiempo por partido: 337 ms de promedio y 526 ms como máximo. Los 1000 partidos tardan unos 6 minutos.

### Estadísticas iniciales (solo informadas, **sin calibrar**)
| | v3 etapa 1 | referencia aproximada |
|---|---|---|
| Goles por partido | 4,70 | 2,2 – 3,0 |
| Remates por equipo | 17,3 | 9 – 15 |
| Al arco | 49 % | 28 – 42 % |
| Conversión | 14 % | 8 – 14 % |
| Pases por equipo | 434 | 350 – 550 |
| Precisión de pases | 65 % | 75 – 85 % |
| Posesión local promedio | 50,1 % (desvío 5,2) | — |
| Córners por equipo | 7,8 | 3,5 – 6,5 |
| Laterales por equipo | 48 | ~20 – 25 |
| Km por jugador de campo | 12,4 | ~10 – 11 |
| Minutos con la pelota en juego | 70 | ~55 – 60 |
| Local / empate / visitante | 41 / 13 / 46 % | — |

Los partidos de la prueba cruzan clubes de todo el mundo, de niveles muy distintos, así que hay goleadas (como máximo hubo 22 goles en un partido). Los números grandes están en la cancha que se esperaba para una primera base. Sobran laterales, quites y gambetas, y faltan precisión de pase y tiempo muerto. Ajustar eso es la **etapa 4 (calibración)**, y ninguna de estas cifras hace fallar la prueba.

### Resultados en CI (run 37, commit `32ef3b0`)
- Motor v2, validación masiva: OK.
- **Motor v3, etapa 1: OK.** 1000 partidos sin errores y determinismo OK, en 6 min. Mismas estadísticas que en la corrida local.
- Temporadas con semilla fija: **HUELLA `b6e76d8864c3a1f4` · OK**, 0 errores, guardado y recarga OK.
- Auditoría de eventos: OK · Simulador 2D: OK · Tres temporadas sin intervención: OK.
- Carrera guardada en `main` que se abre con esta versión: **FALLÓ**, pero **no por esta rama**:
  - falla exactamente igual en el CI de `main` (run 36, commit `ff72d96`);
  - `main` ya es la misma versión 12.6 que esta rama, y la prueba da por hecho que `main` es una versión anterior. Por eso espera una copia automática "Antes de actualizar" y el motor v1;
  - los datos de la carrera quedan idénticos y no hay errores;
  - no se modificó la prueba, para no falsearla. Hay que adaptarla a la nueva situación de `main`, aparte.

## Lo que falta (a propósito, para las etapas siguientes)
- Faltas, tarjetas, offside sancionado, penales, tiros libres y cambios (etapa 3).
- Táctica (mentalidad, presión, ancho, profundidad, estilos) y un orden de juego más fino (etapa 2).
- Conexión con el juego: solo para el partido del usuario, mientras el resto de la fecha sigue con v2 (etapa 5).
- Que el 2D dibuje la cinta (etapa 6).

## Compatibilidad
- No se modificaron v1, v2, `vista2d.js`, `index.html` ni nada del juego. Las partidas guardadas no se tocan.
- El motor v3 no se carga en la página, así que la huella de regresión no puede cambiar: tiene que seguir siendo `b6e76d8864c3a1f4` (ver CI).
- Los datos de jugadores no se inventan: los atributos son los estimados de `MCAtributos`, marcados como estimados.
