# Simulador 2D · Etapa 4 · Cámara de TV, repeticiones y rendimiento

Rama: `etapa-2d-e4` · Vista previa: https://etapa-2d-e4.carreramod0.pages.dev · Producción (main) sin cambios.

## Qué se hizo
- **Cámara de TV**: anticipa la jugada (mira hacia el destino del pase o remate, o un poco adelante del que conduce), sigue la pelota también en vertical y hace zoom. Se abre en las pelotas largas, se cierra cerca del arco durante las jugadas y nunca muestra fuera del estadio. Se aplica a TV y Seguimiento. Cenital y Táctica no cambian.
- **Repetición de goles**: se graban las posiciones reales del partido (20 por segundo, últimos 10 s) y, después de cada gol, se repite la jugada en cámara lenta con zoom y el cartel "REPETICIÓN". No es una animación inventada: es lo mismo que pasó. Mientras dura, el reloj del motor espera. Tocar la cancha la saltea, y "Simular hasta el final" también la corta. A x4 la repetición es más corta.
- **Gráfica de TV**: marcador con siglas, colores de camiseta y minuto, arriba a la izquierda. Los carteles (falta, saque lateral, etc.) van debajo.
- **Rendimiento**: no se dibuja cuando la cancha no está visible, y se mide el tiempo de cada cuadro.

## Pruebas (CI, todas en verde)
- Motor v2 OK · huella v1 `b6e76d8864c3a1f4` OK · auditoría de eventos 30 partidos OK · temporadas sin intervención OK · guardado OK.
- Simulador 2D (partido completo en x4, terminó 0-1):
  - 1 gol → 1 repetición (la prueba falla si hay goles sin repetición); captura `2d-repeticion.png`.
  - Zoom de la cámara entre 1,01 y 1,5 (la prueba falla si nunca cambia).
  - Dibujo: 0,81 ms por cuadro de promedio; cuadro completo (simulación + dibujo) 0,89 ms. La prueba falla si el dibujo supera 16 ms de promedio.
  - Siguen en 0 los saltos de jugadores y los teletransportes de pelota. La pelota suelta estuvo libre el 1,7 % del tiempo y 1,5 s como máximo.
- El tiempo máximo de la prueba del partido pasó de 240 a 420 s reales. Los partidos con muchas jugadas tardan más porque el reloj espera a que cada jugada se vea entera.

## Compatibilidad
No se tocaron el motor ni las partidas guardadas. La repetición usa solo datos ya simulados.
