# MODO CARRERA 12.6.0 · SIMULADOR 2D ANIMADO

**Rama:** `etapa-2b` (incluye las Etapas 1 a 3) · **Vista previa:** https://etapa-2b.carreramod0.pages.dev

## Cómo funciona (y por qué lo que se ve coincide con el resultado)

- **El motor sigue decidiendo todo** (v1 o v2, minuto a minuto). El visor no crea resultados ni es un simulador paralelo.
- **Cada evento real del motor se convierte en una jugada animada**, con los mismos jugadores que intervinieron.
  - **Eventos animados:** gol (según su tipo: cabeza, centro, pase filtrado, contra, de afuera, jugada individual, rebote, tiro libre o penal), remate desviado, atajada, penal, córner, falta, tarjeta, offside, VAR (incluido el gol anulado), error individual, error arbitral, lesión, comienzo, descanso y final.
  - **Ejemplo:** "gol de cabeza de Driussi con asistencia de Lanzini" se ve como Lanzini desbordando, el centro, el salto y el cabezazo de Driussi, el arquero estirándose y el festejo.
- **Mientras se anima una jugada, el reloj del motor espera.** El marcador y la lista de eventos solo muestran lo que ya se vio.
- **Entre jugadas**, los 22 se ubican según la formación y la táctica de cada equipo: profundidad, anchura, laterales que se proyectan, presión de 1 o 2 rivales a la pelota, bloque que se adelanta o repliega. La pelota circula con el equipo que tiene **la posesión que calcula el motor**.
- **Atributos:** la velocidad y la aceleración definen cuánto corre cada jugador (con el cansancio del motor v2), la visión influye en los pases hacia adelante y el regate en cuánto avanza con la pelota.
- El visor usa **su propio azar**: no toca el del juego, así que no altera ningún resultado (la huella del motor sigue idéntica).

## Lo que se ve

- **Figuras de cuerpo entero:** piernas, brazos, torso y cabeza que se mueven según la velocidad.
- **Acciones:** correr, frenar, girar, patear, cabecear con salto, barrerse, caerse, trastabillar, festejar, protestar, lamentarse, estiradas del arquero y el árbitro mostrando la tarjeta.
- **Camisetas por club:** diseño (liso, rayas, aros, banda, franja, mitades, mangas, V o cruz) y colores de camiseta, pantalón y medias.
  - Si dos equipos se parecen, el visitante usa una segunda camiseta.
  - Los arqueros tienen un color distinto de los cuatro uniformes.
- **Cámaras:**
  - **TV** (predeterminada): sigue la pelota con suavidad.
  - **Cenital:** cancha completa desde arriba.
  - **Seguimiento:** más cerca de la pelota.
  - **Táctica:** desde arriba, con números y las líneas de cada equipo.
  - La cámara elegida se recuerda.
- **Velocidades x1, x2 y x4** (se agregó x4). "Simular hasta el final" salta directo al resultado.
- La cancha es más alta (proporción 2,1:1). El resto de la pantalla no cambió.

## Pruebas (GitHub Actions, navegador real)

`tests/partido2d.mjs` juega un partido **en vivo** a x4 con el visor y controla:
- El visor se monta, con 22 jugadores y las 4 cámaras.
- El marcador visible **nunca se adelantó** al motor.
- El motor esperó durante las jugadas.
- Al final, el marcador y todos los eventos coinciden con el motor.
- No hubo errores de JavaScript.

**Resultado:** OK. Las capturas de cada cámara quedan en la rama `capturas-ci` del repositorio y las revisé. También siguen OK la huella del motor clásico, la validación masiva del motor v2, las 3 temporadas sin intervención y la actualización desde la 12.2.

## Limitaciones (con honestidad)

- **Las posiciones no las calcula el motor.** El motor es minuto a minuto y no simula dónde está cada jugador en cada segundo. Las posiciones del visor son una representación coherente con sus decisiones (eventos, protagonistas, posesión y táctica), pero no salen de un cálculo físico. Que el partido se decida por posiciones reales sería un motor nuevo.
- **Camisetas:**
  - **185 clubes** tienen sus colores y diseño tradicionales tomados de referencia general, **sin verificar con una fuente oficial** (marcados `origen:'referencia'`).
  - **El resto de los clubes** tiene un uniforme genérico propio y estable (`origen:'generico'`).
  - **La segunda y tercera camiseta reales no están cargadas:** la segunda se genera.
  - Todo se corrige editando `js/partido2d/camisetas.js`.
- **Rendimiento:** está pensado para 60 FPS (un solo canvas, resolución limitada a 2× y se pausa cuando no se ve), pero **no se midió en un iPhone o Android real**.
- **Lo que no se anima:** cambios de jugador (entran y salen caminando, sin una escena propia) y saques de banda o de arco detallados.

## Archivos

**Nuevos:**
- `js/partido2d/camisetas.js`, `js/partido2d/vista2d.js`
- `tests/partido2d.mjs`
- `INFORME_SIMULADOR_2D.md`

**Modificados:**
- `js/mc12-diseno.js`: la cancha usa el visor; marcador y eventos sincronizados; botón x4.
- `js/core/07-mc7-match.js`: el reloj espera la animación, velocidad x4, dato del remate en los eventos v2, y "simular hasta el final" salta el visor.
- `index.html`, `sw.js`, `05-mc9-datos.js` (versión 12.6.0) y CI.
