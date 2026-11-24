# Motor v3 · Etapa 6 · Imagen de TV y correcciones

- Rama: `motor-v3-e6` (creada desde `motor-v3-e5`). `main` sin cambios.
- **Vista previa: https://motor-v3-e6.carreramod0.pages.dev**
- Página de prueba del motor (sin el juego): https://motor-v3-e6.carreramod0.pages.dev/v3.html

## Cómo ver el v3
1. Abrir la vista previa, entrar a una carrera (nueva o guardada).
2. **Configuración → General → Motor de partidos → "En cancha (v3)"** y guardar.
3. (Opcional) **Configuración → General → Duración del partido**: Corto (~3 min, viene por defecto), Normal (~5) o Largo (~10).
4. Jugar el próximo partido. Arriba a la derecha del 2D están las cámaras (TV, Cenital, Seguimiento, Táctica) y el
   botón **⛶ de pantalla completa**. Para salir: **✕ Salir**.

## Antes de empezar
El CI de `motor-v3-e5` quedó en verde (corrida 70: todas las pruebas + calibración). También se cerró el informe de la
etapa 5 con la calibración final.

## Prioridad 1 · El 2D dibuja la simulación real
- El partido en vivo ahora trae la **cinta**: 10 cuadros por segundo con la posición de los 22, la pelota (con altura),
  el **árbitro** y los que salen de la cancha. Queda solo en memoria (los últimos minutos); **no se guarda en la partida**.
- Con v3, el 2D **dibuja solo esa cinta**, interpolada entre cuadros, con las figuras, camisetas y animaciones de siempre:
  - posiciones y velocidades salen de la cinta; caminar/trotar/correr según la velocidad real;
  - las acciones salen de los eventos de la cancha: pase, remate, volea, cabezazo, atajada/estirada, entrada, barrida,
    falta (el que la recibe cae), tarjeta (el árbitro la muestra), lesión, saque lateral, festejo, abrazo, lamento;
  - pelota con altura y sombra; árbitro simulado en el motor (no se inventa: se mueve en diagonal acompañando la jugada).
  - **No se usa nada del modo "actuar el relato" del v2.** Si algo no está en la simulación, no se dibuja.
- **Repetición** de cada gol: los mismos cuadros de la cinta, en cámara lenta, después del festejo.
- Con v1/v2 el 2D sigue igual que antes (mismo modo de jugadas), solo que también tiene pantalla completa y la duración nueva.

## Correcciones que pidió el usuario
1. **Arqueros**: dos problemas reales en el motor:
   - la atajada fallaba demasiado en remates "al cuerpo" (bajaba en línea recta con la distancia): ahora es casi segura
     cerca del cuerpo y se complica recién en el borde de su alcance;
   - **el rechazo podía meterse en el propio arco** (la pelota tocaba al arquero y seguía para adentro): ahora el rechazo
     al córner apunta afuera del palo y, si no da, la rechaza hacia adelante.
   - Se mide el **origen de cada gol** y si fue **error del arquero** (remate con 80% o más de chance de atajarlo, arquero
     muy adelantado ante un remate de lejos, o en contra del arquero). Antes: ~20% de los goles. **Ahora: 4,8%** (< 10%).
2. **Festejos**: después de cada gol (no en contra) el goleador corre al córner/tribuna, los compañeros lo alcanzan y se
   abrazan, los rivales se lamentan; después todos **vuelven caminando** a su campo y recién ahí se saca del medio.
   Es parte de la simulación (unos 45 s de juego entre el gol y el saque), no un salto. La cámara sigue al goleador.
3. La opción de Configuración se llama ahora **"En cancha (v3)"**.

### Sin saltos en el motor
Para que el 2D no muestre a nadie "teletransportado", el motor dejó de acomodar jugadores de golpe:
- la pelota **vuelve rodando** al lugar del saque (lateral, córner, tiro libre, saque del medio);
- el que patea, la barrera y los rivales **esperan** a estar en su lugar (rivales a 9,15 m, barrera armada, todos en su
  campo para el saque del medio, todos afuera del área en el penal) en vez de aparecer ahí;
- en los cambios, el que sale **se va caminando** por la línea más cercana y el que entra lo hace desde la línea;
  expulsados y lesionados también salen caminando;
- un compañero ya no puede "tapar" el lugar del saque, y un quite desde lejos no "chupa" la pelota.
En 20 partidos medidos cuadro a cuadro (≈1,2 millones de cuadros): **0 saltos de jugadores, 0 de la pelota, 0 esperas forzadas**.

## Imagen de TV
4. Cámara **TV** con anticipación (mira hacia donde va la pelota, usando la cinta que viene) y zoom (abre en pelotas
   largas, cierra en jugadas de peligro cerca del arco y en la repetición). También **Seguimiento**, **Cenital** y **Táctica**.
   **Marcador estilo TV** (equipos con sus colores, resultado, minuto y descuento en rojo) y **carteles** de falta, tarjeta,
   córner, tiro libre, penal, offside, lesión, cambio (entra/sale) y descuento.
5. **Estadio**: tribunas con público (con los colores de los dos equipos), carteles de publicidad genéricos alrededor
   (sin marcas reales), pasto alrededor de la cancha y corte del pasto en damero. Afuera de la cancha ya no queda negro.

## Pedidos del usuario
6. **Pantalla completa**: botón ⛶ en el partido. Usa la Fullscreen API cuando existe; en iPhone (Safari no la permite)
   es una capa fija que ocupa toda la pantalla y se puede poner en horizontal (si está vertical aparece "Girá el teléfono").
   Abajo quedan los controles: pausa, x1/x2/x4, **Cambios**, **Táctica**, **Simular** y **✕ Salir**; el marcador está en la imagen.
7. **Duración**: el ajuste que ya existía ahora es **Corto (~3 min, por defecto), Normal (~5) y Largo (~10)** a x1; x2 y x4
   van encima. Con v3 el ritmo se ajusta solo: la calma va 10 veces más rápido que las jugadas de peligro (remates, goles,
   penales, córners y tiros libres peligrosos, tarjetas), que se ven lentas; el reloj avanza en proporción.
   "Simular hasta el final" sigue funcionando. Las carreras guardadas conservan la duración que tenían elegida.
8. Con v1/v2 también funcionan la pantalla completa y la duración nueva (el 2D avanza en sub-pasos chicos para que nada salte).

## Calibración (3000 partidos de liga + 3600 por fuerza)
| Estadística | Valor | Objetivo | |
|---|---|---|---|
| Goles por partido | 2.72 | 2.50 – 2.80 | ✅ |
| Local gana | 45.3% | 42.0% – 46.0% | ✅ |
| Empate | 24.4% | 24.0% – 28.0% | ✅ |
| Visitante gana | 30.3% | 28.0% – 32.0% | ✅ |
| Remates por equipo | 13.7 | 12.0 – 14.0 | ✅ |
| Remates al arco | 37.4% | 35.0% – 40.0% | ✅ |
| Conversión (goles/remates) | 9.9% | 8.5% – 11.5% | ✅ |
| Pases por equipo | 451 | 400 – 500 | ✅ |
| Acierto de pases | 79.2% | 75.0% – 85.0% | ✅ |
| Posesión del mejor equipo | 51.6% | 50.0% – 65.0% | ✅ |
| Córners por equipo | 5.1 | 4.0 – 6.0 | ✅ |
| Faltas por equipo | 12.3 | 10.0 – 13.0 | ✅ |
| Amarillas por equipo | 1.98 | 1.50 – 2.50 | ✅ |
| Rojas por partido | 0.156 | 0.100 – 0.200 | ✅ |
| Penales por partido | 0.333 | 0.220 – 0.330 | ≈ casi en rango |
| Offsides por equipo | 1.86 | 1.60 – 2.40 | ✅ |
| 0-0 | 8.4% | 5.0% – 10.0% | ✅ |
| 1-0 | 18.2% | 15.0% – 22.0% | ✅ |
| 2-1 | 12.3% | 13.0% – 19.0% | ≈ casi en rango |
| Diferencia de 4 o más | 3.6% | 1.5% – 5.0% | ✅ |
| Partidos con 10+ goles | 0.1% | hasta 0,15% | ✅ |
| Muy superior (+7 GRL) gana | 76.3% | 65.0% – 75.0% | ≈ casi en rango |
| Superior (+3 a +6) gana | 51.4% | 50.0% – 63.0% | ✅ |
| Parejo (<1) gana | 34.2% | 33.0% – 45.0% | ✅ |
| Ventaja de local | 15.0% | 8.0% – 18.0% | ✅ |
| **Goles por error del arquero** | **4.8%** | **menos de 10%** | ✅ |
| El % de victorias crece con la diferencia de fuerza | sí | sí | ✅ |

Los tres "casi en rango" los aceptaste como están; en la prueba sus rangos quedaron un poco más amplios
(penales hasta 0,34; 2-1 desde 12%; muy superior hasta 78%). Partidos con 7+ goles: 2,8%.

**Origen de los goles**: jugada en el área 62%, córner 10%, penal 8%, rebote 7%, en contra 5%, jugada individual 2%,
centro 2%, cabezazo 1%, contra 1%, de afuera 0,5%. (La etiqueta "jugada en el área" agrupa todo lo que no es una de las otras.)

## Pruebas
- `tests/v3tv.mjs` (nueva, navegador real): partido v3 completo a x1 con duración Corto. Local: **190,6 s reales**
  (objetivo 180 ±20%), **0 saltos** en la cinta (jugadores y pelota) y **0 en lo dibujado**, lo dibujado **igual a la cinta**
  (diferencia 0 en todas las muestras), festejos con abrazos y repetición del gol; pantalla completa con los controles;
  después un partido v2 con la duración nueva y pantalla completa. Capturas: TV, estadio, festejo, repetición, pantalla completa.
- `tests/motor-v3.mjs` (agregados de la etapa 6): saltos en la cinta, esperas forzadas, festejos con abrazo, árbitro,
  goles de córner con 5 o más jugadores en el área en la repetición, error del arquero < 10%.
- `tests/partido2d.mjs` (2D v2): sigue OK con la duración Corto (47 s a x4).
- `tests/v3juego.mjs`, `tests/v3html.mjs`: OK.

## Resultados de CI
**El CI de GitHub no pudo correr en esta rama.** Desde las 21:40 (UTC) todas las corridas de `motor-v3-e6` —incluida la
publicación en Cloudflare Pages— terminan en 3 segundos sin que GitHub les asigne una máquina (`runner_id: 0`, sin
registro ni mensaje). Es el comportamiento típico de cuando la cuenta se queda sin minutos de GitHub Actions o llega al
límite de gasto (hoy se corrieron muchas calibraciones de ~55 min). No es un error del código: no llegó a ejecutarse
ningún paso. **Por lo mismo, la vista previa de esta rama todavía no se publicó.**

Mientras tanto, corrí **localmente las mismas pruebas del CI** (las de navegador con `file://`, porque acá no se puede
levantar un servidor):
| Prueba | Resultado |
|---|---|
| Motor v2 · validación masiva (`tests/motor.mjs 1000`) | ✅ |
| Motor v3 · etapas 1-6 (`tests/motor-v3.mjs 1000`: 1150 partidos) | ✅ · etapa 6: 0 saltos de jugadores y pelota, 0 esperas forzadas, festejos 54/56 con abrazo 53, goles de córner con 11-13 jugadores en el área en la repetición, error del arquero 5,5% |
| Calibración (3000 + 3600) | ✅ con los rangos ampliados de los tres "casi" (corrida aceptada) |
| 2D del motor v3 (`tests/v3tv.mjs`) | ✅ · 190,6 s a x1 en Corto, 0 saltos, dibujo = cinta, festejo y repetición |
| 2D v2 (`tests/partido2d.mjs`) | ✅ |
| `v3.html` · v3 en el juego · auditoría de eventos · temporadas | ✅ |
| Huella de regresión | con `file://` da `216af7bd954ec391` **igual en e5 y en e6**: e6 no la cambió. La `b6e76d8864c3a1f4` se mide con el servidor del CI (en e5 dio OK en la corrida 70); hay que confirmarla cuando vuelva el CI. |
| Actualización desde la 12.2.2 | no se pudo correr localmente (necesita dos servidores) |

Cuando GitHub vuelva a dar minutos, un push cualquiera a la rama dispara todo (pruebas, calibración y la vista previa).
Nota: el árbitro recorre ~22 km por partido (uno real hace ~11-12): se mueve bien, pero algo de más.
