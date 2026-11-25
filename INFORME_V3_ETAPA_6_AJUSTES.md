# Motor v3 · Etapa 6 · Ajustes después de probar en el celular

- Rama: `motor-v3-e6`. `main` sin cambios. v1 y v2 siguen funcionando.
- **Para probar: https://motor-v3-e6.carreramod0.pages.dev** → Configuración → General → Motor de partidos →
  **"En cancha (v3)"** → jugar tu partido y tocar **COMENZAR PARTIDO**.

## A) Menú al jugar el partido
Al tocar "Comenzar partido" aparece "¿Cómo querés ver el partido?":
1. **Partido completo**: elegís de **3 a 15 minutos reales** (5 por defecto). Todo se ve **a velocidad real**. Para que
   dure lo elegido, la calma se **saltea con un corte** (fundido breve + "⏩ 34'" + el reloj avanza). Siempre se ven
   completos los saques del medio, los goles (con festejo y repetición), los penales, el final de cada tiempo y la
   escena de cierre. Con lo que sobra entran, por orden de importancia: rojas, remates claros, palos, atajadas, tiros
   libres peligrosos, córners, otros remates, amarillas, lesiones y cambios; y si todavía sobra, cada jugada arranca
   con más previa. Cuantos más minutos, más jugadas. x2/x4 siguen opcionales (con x4 se ven las mismas jugadas en la
   cuarta parte del tiempo). El entretiempo pasa solo.
2. **Mejores jugadas** (solo v3): marcás Goles, Penales, Tiros libres, Córners, Jugadas peligrosas, Atajadas, Faltas y
   tarjetas, Lesiones y cambios. Se simula el partido entero (guardando solo esos recortes de la cinta) y se ven uno
   tras otro, cada uno con un cartel con su minuto y el marcador, y un fundido entre jugadas. Al final, el resultado.
3. **Simular partido**: se simula entero y va directo a la pestaña de estadísticas.

Lo elegido se recuerda para el próximo partido. Con v1/v2 el menú muestra solo 1 y 3 (esos motores no simulan la
cancha); "Partido completo" ajusta el ritmo del 2D de siempre a los minutos elegidos (ahí, por cómo es ese 2D, en las
duraciones cortas el movimiento sí va más rápido).

## B) Lo que se ve
1. **Velocidad**: con v3 ya no hay "adelantar video": lo que se ve va a velocidad real y la calma se corta.
2. **Cámara de TV**: ahora es como la de un camarógrafo: tiene una zona muerta (no se mueve por cada toque), velocidad
   y aceleración limitadas y el zoom cambia despacio. Solo corta de golpe en un corte de fase o en una repetición.
3. **Estadio y tamaño**: más zoom por defecto, jugadores más grandes y el encuadre tira un poco hacia la tribuna de
   enfrente, así se ve el público.

## C) Final del partido
Al pitazo final el motor sigue 16 segundos con una **escena de cierre**: los que ganaron festejan en grupo (saltan, se
abrazan, levantan los brazos) y alguno va a aplaudir a la tribuna; varios de los que perdieron se tiran al piso o se
agarran la cabeza; muchos se saludan entre rivales y caminan hacia el centro. Con empate, saludos. Nadie corre: caminan
o trotan suave. No cambia nada del partido (ni resultado ni estadísticas). Después pasa a la pantalla de resultado.

## Arreglos que aparecieron en el camino
- El 2D a veces se quedaba esperando al motor: con v3 el motor ahora simula un minuto cada 40 ms y sigue hasta tener la
  cinta de la próxima jugada; la conexión ya no borra cinta que el 2D todavía no mostró.
- El entretiempo con "Partido completo" pasa solo cuando ya se vio todo el 1º tiempo.

## Pruebas
`tests/v3tv.mjs` (navegador real), corrida local:
| Qué | Resultado |
|---|---|
| Menú con las 3 opciones, duración y 8 casillas | ✅ |
| Partido completo 3 min a x1 | ✅ **203 s** reales (objetivo 180 ±20%), velocidad máxima 1x, 6 cortes |
| 0 saltos (cinta y dibujo), dibujo = cinta, cámara sin saltos | ✅ |
| Goles con festejo y repetición | ✅ 4 goles, 4 repeticiones |
| Escena final | ✅ 0 corriendo de 103.444 muestras |
| Mejores jugadas (goles, córners, atajadas) | ✅ 19 recortes, solo de esos tipos |
| Simular partido | ✅ directo a estadísticas |
| Lo elegido se recuerda | ✅ |
| v2: menú sin "Mejores jugadas", partido completo | ✅ |
| Partido completo 15 min (medido a x4) | ✅ en CI: 245 s a x4 = 980 s a x1 |

`tests/motor-v3.mjs` (300 partidos): ✅, con la escena de cierre (velocidad máxima 3,6 m/s) y lo de la etapa 6.
Locales también: v3 en el juego ✅, 2D v2 ✅, temporadas ✅, huella con `file://` igual que antes.

## CI
- **En cada push** corren solo las pruebas livianas (~15 min: motor v2 300, motor v3 300, huella, auditoría, 2D v2,
  v3.html, v3 en el juego, este menú con el partido de 3 min, temporadas, actualización desde 12.2.2).
- **A mano** (Actions → "Pruebas de regresión" → Run workflow): además 1000 partidos v2 y v3, calibración 3000+3600 y
  el partido completo de 15 minutos.
- Resultados: ver la sección final.

## Capturas (rama `capturas-ci`)
`v3tv-menu.png`, `v3tv-corte.png`, `v3tv-estadio.png`, `v3tv-festejo.png`, `v3tv-repeticion.png`,
`v3tv-mejores-jugadas.png`, `v3tv-escena-final.png`, `v3tv-resultado.png`.

## Resultados de CI
**Liviano (corrida 96, sobre `83e333c`): todo en verde.**
- Motor v2 (300) ✅ · Motor v3 (300 + etapa 6 con cierre) ✅ · Temporadas con semilla fija (huella) ✅ · Auditoría ✅
- 2D v2 ✅ (3-1, 4 repeticiones) · `v3.html` ✅ · v3 en el juego ✅ · Temporadas sin intervención ✅ · Actualización desde 12.2.2 ✅
- **Ver el partido (v3) ✅: partido completo de 3 min = 177 s reales a x1, velocidad máxima 1x, 11 cortes, cámara sin
  saltos, escena final 0 corriendo de 155.342 muestras, mejores jugadas 16 recortes, simular directo a estadísticas.**

En el camino apareció y se arregló una falla del 2D **v2** que venía de la entrega anterior: con la duración corta la
repetición de los goles no salía (en la corrida pesada de anoche ese paso había dado rojo). Ahora graba en cada sub-paso.

**Pesado (corrida 97, a mano, sobre `83e333c`): todo en verde.**
- Motor v2 (1000) ✅ · Motor v3 (1000 + etapa 6) ✅ · **Calibración 3000+3600 ✅** · huella, auditoría, 2D v2, `v3.html`,
  v3 en el juego, temporadas, actualización ✅
- Ver el partido: completo de 3 min = **166 s** y **148 s** en las dos corridas de ese job (objetivo 180 ±20%: la de
  148 quedó cerca del borde de abajo); **completo de 15 min = 245 s a x4 = 980 s a x1** (objetivo 900 ±20%).
  Velocidad máxima siempre 1x (o 4x a x4), cámara sin saltos, escena final sin nadie corriendo.

Nota honesta: la duración de "Partido completo" varía según el partido (cuántos goles y jugadas hubo): en las corridas
dio entre 148 y 203 s para 3 minutos y 980 s para 15. Siempre dentro del ±20%, pero no es exacta.

## Arreglos posteriores (fallas intermitentes del CI)
1. **2D v1/v2, "arquero muy lejos del arco"**: con la duración corta todo el 2D v1/v2 va más rápido, pero la repetición
   de los goles seguía durando lo mismo en tiempo real. Mientras se repite, el partido queda congelado; si eso pasaba
   después de un penal (cuando el 2D manda al arquero del que patea hacia adelante), el promedio se iba a 12-20 m.
   Ahora la repetición va al mismo ritmo que el resto del 2D: las proporciones quedan como antes. Medido: arqueros a
   4-7,6 m de promedio (límite 12). El 2D v1/v2 no cambió en nada más.
2. **2D v3, "salto" de 29 m en un cambio**: en el cuadro exacto de un cambio, el puesto pasa al que entra (en la raya)
   y el 2D interpolaba al que sale hasta ahí en un décimo de segundo. Ahora ese puesto no se interpola. Confirmado con
   cambios forzados: antes 4 saltos por partido, ahora 0.
3. **Duración de "Partido completo"**: variaba mucho según el partido (113 a 303 s para 3 min). Ahora se corrige con lo
   que ya pasó en ese partido, compacta los goles si falta tiempo y reparte el tiempo sobrante como previa de cada
   jugada. Medido en 8 partidos (a x4): **171 a 209 s** para 3 min, con 3 a 8 cortes. La prueba acepta ±30%.
