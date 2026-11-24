# Motor v3 · Etapa 3 · Reglas y pelota parada

- Rama: `motor-v3-e3` (creada desde `motor-v3-e2`). `main` sin cambios.
- Vista previa: https://motor-v3-e3.carreramod0.pages.dev
- **Página de prueba visual: https://motor-v3-e3.carreramod0.pages.dev/v3.html** (no está enlazada desde el juego).

El motor v3 sigue **sin conectarse al juego** (eso es la etapa 5). v1, v2, el 2D, `index.html` y las partidas guardadas no se tocaron.

## Antes de empezar
El CI de `motor-v3-e2` estaba en verde (run 42): huella `b6e76d8864c3a1f4` OK, `v3.html` OK y actualización OK. No hubo nada que arreglar.

## Qué se hizo (todo en `js/motor/motor-v3.js`)
1. **Faltas que salen del contacto real.** Cada entrada, gambeta cortada, choque aéreo o llegada tarde sobre el que acaba de pasar la pelota tiene en cuenta:
   - si se entra por detrás y si se llega tarde;
   - la velocidad del choque;
   - una agresividad estimada (no hay un atributo propio en la base: se calcula con fuerza, poca lectura del juego y poco equilibrio, y se nota como estimación);
   - el atributo de entradas del defensor;
   - la presión de la táctica;
   - si el defensor ganó la pelota o no.

   **El árbitro decide con su severidad y su precisión.** Usa el mismo formato que el motor v2 (`{severidad 0,8-1,25, precision 0,86-0,97}`); si el juego no manda uno, se sortea con la semilla. Puede no ver una falta o cobrar una que no fue. Dentro del área el defensor se cuida mucho más y el árbitro casi no se equivoca a favor del atacante.

   **Ventaja**: si el equipo que sufrió la falta sigue con la pelota en campo rival y no es penal, se juega. Si la pierde en 3 s, se vuelve a cobrar la falta.
2. **Tarjetas**:
   - **amarilla** por falta táctica (agarrar al que te gambeteó, sobre todo en un contraataque), imprudente (por detrás, tarde o muy fuerte) o reiterada, y alguna por conducta;
   - **roja** por juego brusco, por último hombre (ocasión manifiesta: la llevaba de frente al arco, sin defensores delante y con el arquero lejos) o por segunda amarilla;
   - el amonestado se cuida.

   **El expulsado sale y el equipo se reacomoda**: si era defensor o volante, baja a su puesto el delantero que mejor marca. Si era el arquero, entra el suplente o ataja uno de campo. Nunca se juega con menos de 7: antes de eso el partido se suspende (no pasó en ninguno de los 1000).
3. **Penales**:
   - falta o **mano** en el área (un remate o un centro que pega en el brazo de un defensor) → penal;
   - el pateador se elige por atributos (definición, tiro y potencia) y elige lado, altura y potencia;
   - el arquero se tira antes de ver la pelota y adivina o no (lee al pateador un poco si es bueno);
   - el penal puede atajarse, irse afuera o pegar en el palo (con la misma física del palo), y el rebote queda en juego.
4. **Tiros libres**:
   - **barrera a 9,15 m** sobre la línea pelota-arco, corrida al palo cercano, con 5 a 1 jugadores según la distancia y el ángulo;
   - el arquero se para del otro lado, sobre su línea;
   - según la distancia y el pateador (el mejor del equipo para eso): **remate directo** por arriba de la barrera (la barrera salta y puede rechazar), **centro** al área o **pase**;
   - **jugada ensayada** simple: toque corto al costado y remata un compañero;
   - por offside, el tiro libre es **indirecto**;
   - pegado a la línea de fondo, centro sin barrera.
5. **Córners**:
   - lo patea el mejor centrador;
   - los mejores cabeceadores (por cabeceo, salto y fuerza) entran al primer palo, al segundo palo y al punto penal; uno queda para el rebote y otro se ofrece para jugarlo corto;
   - la defensa marca **en zona** (sobre el área chica, más uno en el primer palo) o **al hombre**, según la táctica (presión alta u ofensiva → al hombre);
   - el centro llega a la altura de la cabeza, hay **duelo aéreo** (gana el mejor de cabeza, con algo de suerte) y **rebotes**.
6. **Laterales y saques de arco**:
   - el lateral lo hace el lateral o el volante o extremo de ese costado, con los rivales a 2 m;
   - el saque de arco lo hace el arquero, con los rivales fuera del área: **salida corta** a los centrales abiertos si la táctica no es directa y no hay presión alta; si no, **largo**;
   - en laterales, córners y saques de arco no hay offside.
7. **Offside real en el momento del pase**:
   - se marca quién está adelantado cada vez que alguien pasa, remata o cabecea (anteúltimo rival, pelota o mitad de cancha);
   - **solo se cobra si el adelantado participa**: juega la pelota o va a jugar una que le llega cerca. El que no participa no se cobra;
   - si la juega un rival, la jugada termina;
   - el asistente puede no ver los offsides por poco;
   - se reanuda con **tiro libre indirecto**;
   - los delanteros a veces se pasan de la línea, y el pasador ve a sus compañeros con un poco de demora, así que a veces los habilita mal.
8. **Lesiones y cambios**:
   - lesiones por golpes fuertes (más con poca resistencia y piernas cansadas) y por cansancio, con probabilidad baja según la resistencia y el estado físico previo (`fit` del jugador);
   - si la lesión es grave, el árbitro para el juego y se reanuda con pelota al piso;
   - **el DT de la IA hace hasta 5 cambios en 3 ventanas** (el entretiempo no cuenta como ventana), por lesión, cansancio, tarjeta (un amonestado con faltas, o un delantero que quedó de defensor tras una roja) o resultado (perdiendo, entra un delantero; ganando por poco, un defensor);
   - los suplentes son los jugadores 12 a 20 de `players`.
9. **Tiempo**:
   - entretiempo y final;
   - el **descuento se calcula al minuto 45 de cada tiempo** según lo que se perdió en goles, cambios, lesiones, tarjetas y penales;
   - no se termina con un penal por patear ni con un remate en el aire.

## Página de prueba visual (`v3.html`)
- Muestra la pelota parada con un cartel ("TIRO LIBRE DIRECTO · barrera de 4", "CÓRNER · marca en zona", "PENAL") y el círculo de 9,15 m.
- Dibuja las tarjetas sobre los jugadores, la marca de lesionado, y saca de la cancha al expulsado.
- Los nombres cambian con cada cambio.
- La lista de jugadas incluye faltas, tarjetas, offsides, penales (lado del pateador y del arquero), tiros libres, cambios y descuento.
- Las estadísticas agregan faltas, tarjetas, offsides, córners, penales, tiros libres, cambios, lesiones y descuento.

## Pruebas
**`tests/motor-v3.mjs`** (en CI):
- **1000 partidos sin errores y determinismo OK**.
- Coherencia: los cambios, las rojas y los penales de los eventos coinciden con las estadísticas; todo penal cobrado se patea; los jugadores en cancha cuadran.
- **Límites**: nunca más de 5 cambios por equipo (máximo 5), nunca más de 3 ventanas (máximo 3), nunca menos de 7 en cancha (mínimo visto: 9), sin partidos suspendidos.
- **Por partido, en rangos reales aproximados** (1000 partidos):

  | | v3 | rango de la prueba |
  |---|---|---|
  | Faltas | 18,8 | 18 – 30 |
  | Amarillas | 2,97 | 2,5 – 5,5 |
  | Rojas | 0,083 | 0,05 – 0,4 |
  | Penales | 0,278 (convertidos 67 %) | 0,12 – 0,5 |
  | Offsides | 1,80 | 1,5 – 6 |
  | Córners | 8,6 | 6 – 13 |
  | Lesiones | 0,87 | 0,1 – 1 |
  | Cambios | 9,4 | 5 – 10 |
  | Descuento (1.º / 2.º tiempo) | 2,8' / 7,4' | (solo informado) |

- **La expulsión baja el rendimiento**: Arsenal contra Chelsea, 24 partidos, con y sin una roja forzada al minuto 20 (un gancho `forzarRoja` que solo usan las pruebas).

  | | con roja | sin roja |
  |---|---|---|
  | Puntos | 1,54 | 2,58 |
  | Diferencia de gol | −0,04 | +4,38 |
  | Proporción de xG | 52 % | 61 % |

- Siguen las pruebas de las etapas 1 y 2: forma, las 8 tácticas (presión alta vs baja: 49,1 vs 36,4 recuperaciones en campo rival), las 7 formaciones, física y atributos.
- Corrida local: OK en 16 min (552 ms por partido).

**`tests/v3html.mjs`** (en CI, con navegador): busca un partido River-Boca con penal, tiro libre con barrera y córner, se para justo antes de cada ejecución y revisa:
- **barrera**: al menos tantos rivales a 9,15 m como dice la barrera, y ningún rival más cerca (salvo el arquero sobre su línea);
- **córner**: 3 o más atacantes en el área;
- **penal**: en el área solo el pateador y el arquero.

Guarda las capturas `v3-barrera.png`, `v3-corner.png` y `v3-penal.png`, que en CI se suben a la rama `capturas-ci`.

### Resultados de CI (run 47, commit `7a2b710`): todo en verde
- Motor v2: OK.
- **Motor v3, etapas 1-3: OK** (1000 partidos, determinismo, forma, táctica, reglas y pelota parada).
- Temporadas con semilla fija: **HUELLA `b6e76d8864c3a1f4` · OK**.
- Auditoría de eventos: OK · Simulador 2D: OK · Tres temporadas: OK · Actualización desde la 12.2.2: OK.
- **`v3.html`: OK.** Tiro libre directo con barrera de 4 (8 rivales a 9,15 m, ninguno más cerca), córner con 4 atacantes en el área, penal con 2 jugadores en el área.
- El run 46 (primer commit) falló en una prueba de la etapa 2: con las faltas nuevas, la presión alta daba +14,8 % de recuperaciones en campo rival y se pedía +15 %. No se aflojó la prueba: se hizo que la presión alta presione desde antes y vaya más a quitar (+35 % ahora).

## Notas
- **Determinismo**: misma semilla, mismo partido, dentro del mismo motor de JavaScript. Entre Node y el navegador (versiones distintas de V8) los partidos pueden diferir, por diferencias mínimas en funciones como `Math.exp`.
- **Sin calibrar todavía (etapa 4)**:
  - goles (4,1 por partido; más entre clubes grandes);
  - precisión de pases (60 %);
  - laterales (71 por equipo);
  - km recorridos (9,4).

  Las reglas quedan en rango, pero varias cifras están cerca del borde inferior (faltas, amarillas, offsides): conviene ajustarlas junto con el resto en la calibración.
- Lo que no se modeló: VAR y manos fuera de los remates y centros que pegan en el brazo.

## Siguiente (no hecho)
Etapa 4: calibración. Etapa 5: conexión con el juego. Etapa 6: el 2D de TV dibujando la cinta.
