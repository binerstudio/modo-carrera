# Motor v3 · Etapa 6 · Cierre (pruebas en el celular)

- Rama: `motor-v3-e6`. `main` sin cambios. v1 y v2 siguen igual (su 2D no se tocó, como se acordó).
- **Para probar: https://motor-v3-e6.carreramod0.pages.dev** → Configuración → General → Motor de partidos →
  **"En cancha (v3)"** → jugar el partido → COMENZAR PARTIDO.
- **Cómo saber que es v3:** la gráfica de TV dice **MOTOR v3** debajo del marcador. Si un partido no se puede armar en
  la cancha, aparece un aviso y un evento "⚠ MOTOR v2" (se juega con v2). Lo que se vio en el celular (arqueros clavados,
  "Tiro de esquina" con la pelota en la mitad, todos en el círculo central) es del 2D de v1/v2.

## Los 6 puntos
1. **Movimiento imposible.** Todo cambio de posiciones que no es juego (corte de fase, entrar y salir de la repetición,
   paso al 2º tiempo, cada recorte de "Mejores jugadas") pasa con la pantalla en negro (fundido). Prueba nueva: la
   velocidad que se ve de cada jugador, cuadro a cuadro y fuera de los fundidos, **≤ 10 m/s** (medido: 7,1-8,5 m/s).
2. **Arqueros.** En el v3 se acomodan según la pelota. Prueba nueva en el motor (20 partidos): su posición de costado
   sigue a la pelota (correlación media > 0,6, se corren > 1,5 m) y se paran más adelante con la pelota lejos que cerca
   (medido: 3,4 m de la línea con la pelota cerca, 8,7 m con la pelota lejos).
3. **Reanudaciones.** Prueba nueva en el motor, en el instante en que se ejecuta cada una: saque del medio con cada
   equipo en su mitad y los rivales fuera del círculo, córner y tiro libre con los rivales a 9,15 m, saque de arco con
   los rivales fuera del área, lateral con los rivales a 2 m. 0 fallas. Arreglo: en el penal cada jugador tiene su
   propio lugar fuera del área (antes dos compartían lugar y había que acomodarlos de golpe).
4. **Carteles.** El de córner sale cuando la pelota está en el banderín, el de penal con la pelota en el punto y el de
   tiro libre con la pelota quieta (prueba: a ≤ 3 m del banderín, ≤ 1,5 m del punto).
5. **Marcador, local/visitante y reloj.** Una sola fuente: los goles del relato que ya se vieron en la cancha
   (encabezado, gráfica de TV y eventos). La pantalla del partido pone siempre al local a la izquierda (nombre, escudo,
   marcador, formaciones, estadísticas); antes ponía siempre a tu club (eso también se corrige con v1/v2). El reloj, las
   estadísticas, el descanso y el final esperan al 2D; "Simular hasta el final" termina de una. Prueba nueva
   (`tests/v3marcador.mjs`): liga de local, de visitante, copa y cancha neutral, cada 0,3 s: los tres marcadores iguales,
   el local del mismo lado (también en el relato), el reloj nunca más de 1' adelante del 2D.
6. **Pantalla completa en iPhone.** Capa fija del tamaño visible (100dvh/100dvw); con el teléfono vertical el visor se
   gira a horizontal y ocupa toda la pantalla, sin franjas. Prueba nueva (`tests/v3pantalla.mjs`, iPhone 13 emulado).
   En iPhone, Safari no deja ocultar sus barras desde una página: la capa ocupa todo lo visible.

## Lo anterior (cierre del simulador)
- **Repetición** de cada gol: de la cinta, en cámara lenta (0,6x), desde 6,5 s antes del gol; nunca se pierde.
- **Escena final**: al pitazo frenan y caminan (≤ 1,8 m/s medido en 1 s); festejo, piso, saludo, aplauso, abrazo.
- **Festejo de gol**: el goleador va al banderín (o a la tribuna) y los compañeros lo alcanzan ahí; nadie amontonado en
  el área chica (a los 8 s: nadie).
- **Partido completo**: el tiempo es de las jugadas (peligro, goles y festejos, pelota parada con remate); la calma solo
  como transición corta (medido: 72-98 s de jugadas y 2-20 s de calma en 3 minutos).
- **Mejores jugadas**: por importancia (goles > ocasiones claras > penales > tiros libres con remate > córners con remate),
  máximo 12, en orden de minuto.
- **Movimiento**: pelota pegada al pie en conducción (0,58 m como máximo), largo de paso 0,6-1,8 m, sin patinaje ni
  saltos de pose (medidos en la prueba).

## Capturas (rama `capturas-ci`)
`v3tv-repeticion.png`, `v3tv-festejo.png`, `v3tv-mejores-jugadas.png`, `v3tv-corte.png`,
`v3marcador-liga-de-local.png`, `v3marcador-liga-de-visitante.png`, `v3marcador-copa-de-visitante-.png`,
`v3marcador-cancha-neutral.png`, `v3pantalla-vertical.png`, `v3pantalla-horizontal.png`.

## CI
**Liviano, corrida 122 (sobre `b2c7197`): todo en verde.**
- Motor v2 (300) ✅ · Motor v3 (300 + etapa 6) ✅: arqueros (correlación 0,74; 3,5 m de la línea con la pelota cerca y
  8,6 m lejos), reanudaciones 0 fallas (99 saques del medio, 250 tiros libres, 322 saques de arco, 1465 laterales, 202
  córners), cierre a 1,49 m/s como máximo, festejo con nadie en el área chica a los 8 s.
- Huella, temporadas, 2D v2, `v3.html`, v3 en el juego, actualización desde 12.2.2 ✅
- Ver el partido (v3) ✅: 3 min = 184 s reales; 89 s de jugadas y 12 s de calma; 3 goles con 3 repeticiones (6,5 s antes,
  0,6x); velocidad vista máxima 8,6 m/s; escena final 0 corriendo; pelota-pie 0,58 m; sin patinaje ni saltos de pose.
- Marcador, localía y reloj ✅: liga de local, de visitante, copa y neutral: 0 diferencias entre encabezado, gráfica y
  eventos, el reloj nunca adelante del 2D, velocidad vista 7,5-8,1 m/s; "Simular hasta el final" en 0,6 s.
- Pantalla completa en iPhone ✅: vertical 390x664 con el dibujo girado 664x390, horizontal sin girar.

Nota: en esta corrida no salieron las capturas `v3tv-escena-final.png` ni `v3tv-estadio.png` (dependen del momento en
que la prueba saca la foto); sí están repetición, festejo, mejores jugadas, corte y las de marcador y pantalla completa.
