# SIMULADOR 2D · ETAPA 1 — FUNDAMENTOS (motor como única fuente de verdad)

**Rama:** `etapa-2d` (incluye todo lo anterior) · **Vista previa:** https://etapa-2d.carreramod0.pages.dev

## Auditoría: cómo estaba

| Componente | Estado anterior |
|---|---|
| Motor (v2) | Real: decide los eventos, sus protagonistas y los resultados minuto a minuto |
| Cadena de cada jugada (pases, recuperación) | **La inventaba el visor** |
| Posesión entre jugadas | El visor la generaba al azar, solo respetando el % del motor |
| Pelota | Se "teletransportaba" al cambiar de dueño, en saques, penales y córners |
| Estados de los jugadores | Algunas poses sueltas, sin máquina de estados |
| Marcaje | No existía: los defensores solo seguían su zona |
| Eventos | Sin identificador. El partido terminaba con dos "FINAL", y el resumen y las bajas tenían el minuto fijo en 90 |

## Qué se hizo

1. **El motor escribe cada jugada completa** (`js/motor/motor-v2.js`).
   - Quién recupera y a quién, cada pase (corto, largo, filtrado o centro), conducciones, gambetas, el defensor que cierra y el remate o cabezazo con resultado (gol, atajada, afuera, palo o anulado) y zona (alto o bajo).
   - También las jugadas especiales: falta y penal, córner, tiro libre, error y rebote.
   - La **posesión de cada minuto** queda escrita: equipo, cadena de pases y quién la recupera.
   - Esa narración usa un azar propio y fijo por partido. La simulación masiva da **exactamente los mismos números** que antes (2,589 goles por partido), así que la calibración no se tocó.
2. **Identificador único en cada evento.** El resumen final y las bajas ahora tienen minuto real y ya no se repite "FINAL". La definición por penales también tiene identificador.
3. **El visor solo reproduce lo escrito** (`js/partido2d/vista2d.js`).
   - Cada acción del motor se ejecuta en cancha, con los jugadores que el motor nombró.
   - Entre jugadas reproduce la posesión del motor.
   - En los partidos del motor clásico (v1), que no traen la jugada escrita, se arma una mínima con los protagonistas del evento.
4. **La pelota nunca se teletransporta.**
   - Un jugador solo toma la pelota si está a menos de 2,6 m.
   - Si la tiene un compañero, hay pase; si la tiene un rival, hay disputa.
   - Las reposiciones (centro, punto penal, córner, tiro libre, saque de arco) se hacen con la pelota rodando.
5. **Máquina de estados por jugador:**
   - **Locomoción:** quieto, caminando, trotando, corriendo, esprintando, frenando o girando. Para girar frena primero.
   - **Acción:** conduciendo, controlando, pasando, rematando, cabeceando, saltando, entrada, barrida, cayendo, levantándose, desequilibrio, amague, celebrando, abrazo, protesta, lamento, pide, atajando, estirada, saque o tarjeta.
   - **Táctico:** atacando, desmarcándose, apoyo, presionando, marcando o defendiendo.
   - Cada jugador tiene su cadencia de zancada y su pie hábil.
6. **Marcaje y presión:** sin pelota, 1 o 2 jugadores presionan (2 si la táctica es de presión alta). El resto marca al rival de su zona, perfilado hacia su arco. Con pelota, los que están marcados se desmarcan.
7. **Reloj:** espera solo durante las jugadas de eventos, no durante la posesión. La posesión se corta en cuanto aparece un evento.

## Pruebas (GitHub Actions)

- **Auditoría de eventos** (`tests/eventos.mjs`): 30 partidos y 690 jugadas escritas, con unas 6 acciones por jugada.
  - **OK:** identificadores únicos, minutos coherentes, goles del relato = marcador, atajadas del relato = estadística, resultado de cada jugada = evento, cadena de pases continua, protagonistas del equipo correcto y nadie actúa después de salir.
  - Antes de corregir encontró **42 minutos incorrectos y 12 identificadores repetidos**, que ya están corregidos.
- **Partido en vivo con el visor** (`tests/partido2d.mjs`):
  - Resultado OK: 3-1, coincidió con el motor.
  - **0 teletransportes** de la pelota.
  - Se vieron todos los estados de locomoción y los tácticos (marcando, presionando, desmarcándose, apoyo) y 16 acciones distintas.
  - El marcador nunca se adelantó.
- Siguen OK: huella del motor clásico, validación masiva v2, 3 temporadas sin intervención y actualización desde la 12.2.

## Pendientes para las etapas siguientes

- **Etapa 2:** figuras con más detalle (botines, cuello, mangas), variantes de animación por tipo de jugador, altura y contextura, y tercera camiseta.
- **Etapa 3:** paredes, coberturas, laterales que eligen cuándo subir, bloque bajo/medio/alto según la táctica, saques laterales y de arco propios, y cambios con su escena.
- **Etapa 4:** la cámara TV todavía deja vacía la franja cercana de la cancha cuando el juego va por el lado de enfrente; hace falta seguimiento vertical, anticipación y zoom. Repetición de goles. Medición real de cuadros por segundo en el teléfono.
- **Duración:** a x1, un partido en vivo dura unos 8 minutos reales (a x4, unos 2). Se puede ajustar.
