# Motor v3 · Etapa 2 · Táctica y orden

Rama: `motor-v3-e2` (creada desde `motor-v3-e1`) · `main` sin cambios.
- Vista previa del juego: https://motor-v3-e2.carreramod0.pages.dev
- **Página de prueba visual: https://motor-v3-e2.carreramod0.pages.dev/v3.html** (no está enlazada desde el juego).

El motor v3 sigue **sin conectarse al juego** (eso es la etapa 5). v1, v2, el 2D, `index.html` y las partidas guardadas no se tocaron.

## Qué se hizo (todo en `js/motor/motor-v3.js`)
La táctica usa **los mismos valores que ya maneja el juego**: `style`, `mentality`, `width`, `depth` (línea), `pressing`, `rhythm` y `formation`, como en `ownTac` y `rivalTac` de `07-mc7-match.js`. Las formaciones son las 7 de la pizarra del juego, con las mismas posiciones de `positions()`.

1. **Forma de equipo**
   - Tres líneas (defensa, medio y ataque) a distancias reales.
   - Con pelota, el equipo se estira y se abre: en promedio 46 m de largo y 50 de ancho.
   - Sin pelota, se junta: 36 m de largo y 40 de ancho.
   - El bloque se corre hacia el lado de la pelota sin abandonar el otro: el ancho total se mantiene.
2. **Bloque y presión**
   - La línea defensiva sin pelota va entre 16 y 42 m del arco propio con línea media; un bloque alto la sube y uno bajo la baja.
   - La presión decide desde qué altura de la cancha se va a buscar al rival.
   - La presión es coordinada:
     - uno presiona encima;
     - otro cubre a 5 m, del lado del arco;
     - los volantes y delanteros libres cierran las líneas de pase a los tres receptores más cercanos.
   - Si el rival tiene la pelota libre y de frente, la línea retrocede unos metros.
   - **Trampa de offside**: los defensores comparten la misma línea (desvío medio de 2,3 m sin pelota). Solo salen de ella para tomar a un rival que ya entró al área.
3. **Roles** (salen de la formación)
   - **Laterales**: pasa al ataque el del lado de la pelota, o los dos si la mentalidad es alta.
   - **Volante central (MCD)**: cubre la espalda del lateral que subió; si suben los dos, baja entre los centrales.
   - **Extremos**: abiertos, o por dentro con ancho bajo o cuando sube el lateral de su lado.
   - **El 9**: se para entre los dos centrales rivales, en la línea del offside.
   - **Enganche**: se ubica entre líneas, donde hay espacio.
   - **Arquero con los pies**: se ofrece atrás en la salida y se adelanta detrás de su línea.
4. **Construcción**
   - **Salida desde el fondo** con pases cortos si no hay presión y la táctica no es directa. **Pelotazo** si hay presión o la táctica es directa.
   - **Apoyos**: los dos compañeros más cercanos se ofrecen a 9–13 m, en el ángulo más libre.
   - **Desmarques al espacio**: uno pica a la espalda de la defensa saliendo en posición válida, y el pase va adelantado.
   - **Paredes**: el que toca corto pica para recibirla de vuelta.
   - **Cambios de frente** cuando un costado está cargado y el otro libre.
   - Pesan la táctica:
     - con estilo posesión, perder la pelota pesa más y se prefiere el pase corto seguro;
     - con estilo directo, avanzar pesa más;
     - el ritmo cambia cuánto tarda en decidir el que tiene la pelota;
     - la mentalidad cambia las ganas de patear.
5. **Transiciones**
   - **Al perder**: presión inmediata durante 5 s (dos o tres encima) con presión alta o mentalidad ofensiva. Si no, repliegue rápido al bloque.
   - **Al recuperar**: contraataque durante 6 s si hay espacio (pocos rivales entre la pelota y el arco). Los delanteros pican y se premia avanzar.
6. **Mediciones nuevas en el resultado**:
   - `forma`: largo, ancho, distancia entre líneas, altura de la línea y del bloque, y alineación de la línea, con y sin pelota;
   - `stats`: posesiones, pases por posesión, recuperaciones (y cuántas en campo rival, y a qué altura), pelotazos, desmarques, paredes, cambios de frente, contraataques, contrapresiones y repliegues.
7. **Arreglo menor**: en córners y laterales la forma toma un punto más adentro de la cancha. Antes se amontonaban todos contra el banderín. Las pelotas paradas de verdad son de la etapa 3.

## Página de prueba visual (`v3.html`)
- Se eligen los dos clubes (los que tienen plantel completo en la base) y la táctica de cada uno: formación, estilo, línea, presión, ancho y ritmo. También la semilla.
- Simula con el v3 (`cintaCada:1`) y dibuja desde arriba **exactamente las posiciones de la cinta**: 10 por segundo, interpoladas para que se vea fluido.
- Tiene play/pausa, velocidades x1, x4 y x16, barra de tiempo, nombres, marcador, reloj, últimas jugadas y estadísticas con la forma de cada equipo.
- Usa los uniformes de `camisetas.js`. No guarda nada.

## Pruebas
`tests/motor-v3.mjs` (en CI):
- **1000 partidos sin errores y determinismo OK**, igual que en la etapa 1.
- **Forma, dentro de rangos reales aproximados** (promedio de los 2000 equipos):

  | | con pelota | rango | sin pelota | rango |
  |---|---|---|---|---|
  | Largo (m) | 46,4 | 35–55 | 36,5 | 25–40 |
  | Ancho (m) | 50,1 | 40–62 | 39,7 | 28–45 |
  | Defensa → medio (m) | 12,0 | 6–24 | 9,8 | 6–20 |
  | Medio → ataque (m) | 22,4 | 6–24 | 18,0 | 6–20 |

  También tiene que estirarse y abrirse con la pelota (más de 5 m), y la línea sin pelota tiene que estar alineada (menos de 4 m de desvío; dio 2,3).
- **La táctica cambia lo que pasa en la cancha**: Arsenal contra Chelsea, 24 partidos por serie, con una sola cosa distinta.

  | Prueba | Resultado | Criterio |
  |---|---|---|
  | Bloque alto vs bajo: altura de la línea sin pelota | 37,2 vs 26,3 m | ≥ 4 m más |
  | Bloque alto vs bajo: altura del bloque | 47,7 vs 36,9 m | ≥ 4 m más |
  | Presión alta vs baja: recuperaciones en campo rival | 30,8 vs 21,2 | ≥ 15 % más |
  | Presión alta vs baja: altura media de recuperación | 40,0 vs 34,3 m | ≥ 2 m más |
  | Posesión vs directo: pases por posesión | 6,29 vs 2,23 | ≥ 30 % más |
  | Directo vs posesión: pelotazos | 27,5 vs 2,9 | ≥ 50 % más |
  | Ancho alto vs bajo: ancho con pelota | 54,6 vs 40,8 m | ≥ 4 m más |
  | Presión alta vs defensivo: contrapresión al perder | 76,9 vs 0 | solo con presión alta |

- Las **7 formaciones** del juego juegan sin errores, y cada una con la cantidad de defensores que corresponde.
- Siguen las pruebas de física y de atributos de la etapa 1.
- Corrida local: OK en 9:45 (457 ms por partido; antes eran 337 ms, porque ahora hay más cosas que calcular).

`tests/v3html.mjs` (en CI, con navegador):
- abre `v3.html`, simula River vs Boca y reproduce en x16;
- revisa que avance a la velocidad pedida, que no haya errores de la página y que el marcador dibujado al final sea el del motor;
- guarda capturas `v3-*.png` (en CI van a la rama `capturas-ci`).

### Resultados de CI
(se completa con la corrida de la rama)

### Estadísticas generales (solo informadas, **sin calibrar**: etapa 4)
| | v3 etapa 2 | v3 etapa 1 | referencia aproximada |
|---|---|---|---|
| Goles por partido | 4,01 | 4,70 | 2,2 – 3,0 |
| Remates por equipo | 15,6 | 17,3 | 9 – 15 |
| Pases por equipo | 560 | 434 | 350 – 550 |
| Precisión de pases | 73 % | 65 % | 75 – 85 % |
| Pases por arriba | 19 % | 27 % | ~10 – 15 % |
| Quites por equipo | 24 | 79 | ~15 – 20 |
| Laterales por equipo | 50 | 48 | ~20 – 25 |

Estos números cruzan clubes de todo el mundo, de niveles muy distintos. Siguen sobrando laterales y goles: eso es calibración (etapa 4).

## Lo que falta (a propósito, para las etapas siguientes)
- **Etapa 3**: faltas, tarjetas, offside sancionado, penales, tiros libres, córners y laterales armados, y cambios. Hoy el offside solo se respeta porque los atacantes no se adelantan y no se les pasa la pelota adelantados.
- **Etapa 4**: calibración de goles, laterales, precisión y demás.
- **Etapa 5**: conexión con el juego.
- **Etapa 6**: el 2D de TV dibujando la cinta.
