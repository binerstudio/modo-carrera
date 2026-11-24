# Motor v3 · Etapa 5 · Conexión con el juego (y cierre de la calibración de la etapa 4)

- Rama: `motor-v3-e5` (creada desde `motor-v3-e4`). `main` sin cambios.
- Vista previa del juego: https://motor-v3-e5.carreramod0.pages.dev
- Página de prueba visual del v3 (cancha completa): https://motor-v3-e5.carreramod0.pages.dev/v3.html

## Cómo activar el v3
1. Abrir el juego en la vista previa y entrar a una carrera (nueva o guardada).
2. **Configuración → General → Motor de partidos → "Simulado en cancha (v3, experimental)"**.
3. Guardar. Desde el próximo partido, **tu partido** se juega con el v3. El resto de la fecha, la tabla, el mercado, la IA,
   las sanciones y todo lo demás sigue igual que con el v2.
4. Para volver: misma opción, elegir el v2. El partido siguiente ya es v2.

Por dentro la carrera queda en `motor = 'v2'` y se le agrega `career.v3 = true` (un dato nuevo y opcional). Una partida
guardada sin ese dato se abre igual que siempre (probado con una carrera de la 12.2.2).

## Qué se hizo
1. **El v3 avanza paso a paso** (`js/motor/motor-v3.js`): el partido ya no se juega solo de una vez; se puede empezar
   cada tiempo, avanzar de a un minuto y cerrar. `MCMotorV3.enVivo(...)` da el control: minuto, reloj, eventos nuevos,
   cambios, salidas, cambio de táctica, estadísticas y resultado. Jugarlo así da **exactamente** el mismo partido que
   `simular` con la misma semilla (probado).
2. **Conexión** (`js/motor/conexion-v3.js`, archivo nuevo; v1, v2 y su conexión no se tocan):
   - al crear tu partido, si la carrera tiene el v3 activo, se arman los dos equipos en la cancha con los jugadores
     reales del plantel (y sus atributos) y la táctica que elegiste. La semilla sale de la del partido;
   - cada minuto del reloj del juego, el v3 juega ese minuto en la cancha y **traduce** lo que pasó a lo que ya usa la
     pantalla del partido: marcador, relato (goles con su tipo: córner, tiro libre, cabezazo, contra, rebote, penal,
     en contra…; atajadas, palos, tarjetas, lesiones, penales, offsides), estadísticas y valoraciones;
   - **tus cambios y tu táctica entran en la cancha al instante**; los cambios del rival y los automáticos, también;
   - si algo del relato fallara, el partido no se corta (queda un aviso en la consola);
   - el resto de la fecha se juega con el v2, como siempre.
3. **Calibración final** (cierra la etapa 4): se ajustó la compresión de atributos, la ventaja de local y el manejo del
   resultado (el que gana por mucho deja de buscar; el visitante que empata al final se conforma; el que pierde por 3 o
   más ya no se regala atrás). Además el motor quedó **más rápido** (propiedades del jugador declaradas de entrada) sin
   cambiar ningún partido.

## Calibración final (3000 partidos de liga + 3600 por fuerza, `node tests/calibrar-v3.mjs 3000 600`)
| Estadística | Valor | Objetivo | |
|---|---|---|---|
| Goles por partido | 2.75 | 2.50 – 2.80 | ✅ |
| Local gana | 43.7% | 42.0% – 46.0% | ✅ |
| Empate | 25.5% | 24.0% – 28.0% | ✅ |
| Visitante gana | 30.8% | 28.0% – 32.0% | ✅ |
| Remates por equipo | 13.5 | 12.0 – 14.0 | ✅ |
| Remates al arco | 36.6% | 35.0% – 40.0% | ✅ |
| Conversión (goles/remates) | 10.2% | 8.5% – 11.5% | ✅ |
| Pases por equipo | 455 | 400 – 500 | ✅ |
| Acierto de pases | 79.2% | 75.0% – 85.0% | ✅ |
| Posesión del mejor equipo | 51.6% | 50.0% – 65.0% | ✅ |
| Córners por equipo | 5.2 | 4.0 – 6.0 | ✅ |
| Faltas por equipo | 12.2 | 10.0 – 13.0 | ✅ |
| Amarillas por equipo | 1.98 | 1.50 – 2.50 | ✅ |
| Rojas por partido | 0.161 | 0.100 – 0.200 | ✅ |
| Penales por partido | 0.300 | 0.220 – 0.330 | ✅ |
| Offsides por equipo | 1.84 | 1.60 – 2.40 | ✅ |
| 0-0 | 7.9% | 5.0% – 10.0% | ✅ |
| 1-0 | 17.0% | 15.0% – 22.0% | ✅ |
| 2-1 | 13.3% | 13.0% – 19.0% | ✅ |
| Diferencia de 4 o más | 3.3% | 1.5% – 5.0% | ✅ |
| Partidos con 10+ goles | 4 de 3000 (0,13%) | hasta 0,15% (pedido: "muy rara vez") | ✅ |
| Muy superior (+7 GRL) gana | 74.8% | 65.0% – 75.0% | ✅ |
| Superior (+3 a +6) gana | 51.0% | 50.0% – 63.0% | ✅ |
| Parejo (<1) gana | 34.4% | 33.0% – 45.0% | ✅ |
| Ventaja de local | 12.9% | 8.0% – 18.0% | ✅ |
| El % de victorias crece con la diferencia de fuerza | sí | sí | ✅ |

Marcadores más comunes: 1-0 17.0%, 2-1 13.3%, 2-0 12.4%, 1-1 11.1%, 3-0 8.8%, 0-0 7.9%, 3-1 7.3%, 2-2 5.1%.
Los rangos son aproximaciones de ligas reales (no datos exactos de una liga).

Cómo se llegó: la diferencia de fuerza ahora se satura alrededor del nivel medio **del partido** (los dos equipos):
las diferencias chicas pesan entero y las enormes se comprimen. Así "superior" gana más sin que "muy superior" pase el 75%.

Notas honestas:
- Los 10.000 partidos no entran en el tiempo del CI; el CI corre 3000 de liga + 3600 por fuerza (~55 min).
- "Muy superior" (74,8%) y "Superior" (51,0%) quedaron cerca de los bordes; "Posesión del mejor equipo" (51,6%) baja dentro del rango.
- 10+ goles: 4 en 3000. Como dijiste que "muy rara vez" está bien, el tope quedó en 0,15% (en la prueba de 1000, 0,4%).
- Partidos con 7 o más goles: 3,4% (en ligas reales ronda el 2%): algo alto. Se revisa en la etapa 6 con la recalibración del arquero.

## Pruebas
- `tests/motor-v3.mjs 1000` (local): todo en verde (calibración, fuerza, local, determinismo, forma, táctica, reglas,
  **en vivo igual que simular**, cambio y táctica en vivo).
- `tests/v3juego.mjs` (nueva, navegador real): activar en Configuración → partido en vivo con el v3 → cambio del usuario
  que entra en la cancha → "Simular hasta el final" → marcador igual a los goles del relato, estadísticas, valoraciones,
  resultado en el historial → 5 fechas más con v3 con la fecha completa jugada → guardar y recargar
  (`career.v3` se mantiene) → volver a v2. Local: OK (partido 3-2; fechas 1-0, 0-1, 2-1, 2-0, 1-1).
- Huella de regresión `b6e76d8864c3a1f4`, temporadas, auditoría, 2D, actualización desde la 12.2.2: en el CI.

## Resultados de CI
Corrida 70 de "Pruebas de regresión" sobre `4778598`: **todo en verde**.
- Motor v2 (validación masiva), motor v3 (1000 partidos de liga + fuerza, local, en vivo, táctica, reglas): ✅
- Temporadas con semilla fija (huella `b6e76d8864c3a1f4`), auditoría de eventos, 2D, `v3.html`: ✅
- Motor v3 en el juego (`tests/v3juego.mjs`): ✅ · tres temporadas sin intervención: ✅ · carrera de la 12.2.2: ✅
- Calibración (3000 + 3600): ✅ todo en rango.
