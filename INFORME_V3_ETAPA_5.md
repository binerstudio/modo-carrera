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

## Calibración (3000 partidos de liga + 1800 por fuerza, `node tests/calibrar-v3.mjs 3000 300`)
| Estadística | Valor | Objetivo | |
|---|---|---|---|
| Goles por partido | 2.70 | 2.50 – 2.80 | ✅ |
| Local gana | 44.9% | 42.0% – 46.0% | ✅ |
| Empate | 24.3% | 24.0% – 28.0% | ✅ |
| Visitante gana | 30.8% | 28.0% – 32.0% | ✅ |
| Remates por equipo | 13.5 | 12.0 – 14.0 | ✅ |
| Remates al arco | 36.5% | 35.0% – 40.0% | ✅ |
| Conversión (goles/remates) | 10.0% | 8.5% – 11.5% | ✅ |
| Pases por equipo | 467 | 400 – 500 | ✅ |
| Acierto de pases | 79.0% | 75.0% – 85.0% | ✅ |
| Posesión del mejor equipo | 51.9% | 50.0% – 65.0% | ✅ |
| Córners por equipo | 5.1 | 4.0 – 6.0 | ✅ |
| Faltas por equipo | 12.4 | 10.0 – 13.0 | ✅ |
| Amarillas por equipo | 2.11 | 1.50 – 2.50 | ✅ |
| Rojas por partido | 0.181 | 0.100 – 0.200 | ✅ |
| Penales por partido | 0.303 | 0.220 – 0.330 | ✅ |
| Offsides por equipo | 1.83 | 1.60 – 2.40 | ✅ |
| 0-0 | 8.0% | 5.0% – 10.0% | ✅ |
| 1-0 | 16.3% | 15.0% – 22.0% | ✅ |
| 2-1 | 14.5% | 13.0% – 19.0% | ✅ |
| Diferencia de 4 o más | 3.1% | 1.5% – 5.0% | ✅ |
| Partidos con 10+ goles | 0.0% | 0.0% – 0.1% | ✅ |
| Muy superior (+7 GRL) gana | 70.5% | 65.0% – 75.0% | ✅ |
| Superior (+3 a +6) gana | 51.2% | 50.0% – 63.0% | ✅ |
| Parejo (<1) gana | 37.2% | 33.0% – 45.0% | ✅ |
| Ventaja de local | 14.0% | 8.0% – 18.0% | ✅ |
| El % de victorias crece con la diferencia de fuerza | sí | sí | ✅ |

Marcadores más comunes: 1-0 16.3%, 2-1 14.5%, 2-0 13.3%, 1-1 10.3%, 3-0 9.6%, 0-0 8.0%, 3-1 7.3%, 2-2 5.1%.
Partidos con 7 o más goles: 1.9%. Los rangos son aproximaciones de ligas reales (no datos exactos de una liga).

Notas honestas:
- Los 10.000 partidos no entran en el tiempo del CI (se cortó a los 90 min); el CI corre 3000 + 1800, como se acordó.
- "Superior gana" (51%) y "Empate" (24%) quedaron cerca del borde de abajo: con otra semilla pueden salir unas décimas
  afuera. La posesión del mejor equipo (52%) también está baja dentro del rango.
- Partidos de 10+ goles: muy raros (0 en estos 3000; en la prueba de 1000 partidos de `tests/motor-v3.mjs` salieron 2-3,
  partidos abiertos tipo 5-7). Como pediste, se acepta "muy rara vez": en esa prueba el tope pasó de 0,2% a 0,4%.

## Pruebas
- `tests/motor-v3.mjs 1000` (local): todo en verde (calibración, fuerza, local, determinismo, forma, táctica, reglas,
  **en vivo igual que simular**, cambio y táctica en vivo).
- `tests/v3juego.mjs` (nueva, navegador real): activar en Configuración → partido en vivo con el v3 → cambio del usuario
  que entra en la cancha → "Simular hasta el final" → marcador igual a los goles del relato, estadísticas, valoraciones,
  resultado en el historial → 5 fechas más con v3 con la fecha completa jugada → guardar y recargar
  (`career.v3` se mantiene) → volver a v2. Local: OK (partido 3-2; fechas 1-0, 0-1, 2-1, 2-0, 1-1).
- Huella de regresión `b6e76d8864c3a1f4`, temporadas, auditoría, 2D, actualización desde la 12.2.2: en el CI.

## Resultados de CI
(ver la sección final, se completa con la corrida de esta rama)
