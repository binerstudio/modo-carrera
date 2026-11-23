# Simulador 2D · Etapa 3 · IA colectiva, física de pelota, arqueros y pelota parada

Rama: `etapa-2d-e3` · Vista previa: https://etapa-2d-e3.carreramod0.pages.dev · Producción (main) sin cambios.

## Problemas del video y qué se hizo
| Problema | Solución |
|---|---|
| Jugadores que "spawnean" / se mueven de golpe | Se eliminaron todos los reposicionamientos instantáneos. Los pases usan física: la velocidad de la pelota se ajusta para que el receptor llegue corriendo. Si un rival tiene que recuperar lejos, se ve un pase cortado en la trayectoria; si la pelota está suelta lejos, la toma el compañero más cercano y la pasa. Hay un contador de saltos en la prueba: **0**. |
| Posiciones irreales / amontonamiento | Equipo como bloque: línea alta/media/baja según táctica y pelota, desplazamiento lateral limitado, laterales que pasan al ataque, delanteros que respetan la línea de offside, marcas solo en zona y apoyos cerca del que tiene la pelota. Presión: 1 jugador, 2 con presión alta en campo rival. |
| Arqueros fuera de lugar | El arquero se ubica en la bisectriz pelota–arco, sale más cuando la pelota está cerca y se estira sobre su línea (no hacia adelante). En las atajadas el remate va a su zona y, si no la retiene, rebota al frente. |
| Jugadas que empezaban lejos de los jugadores | El rematador se desmarca hacia la zona de remate desde el inicio; el último pase va a esa zona; si está lejos, conduce antes de patear. |
| Pelota suelta que nadie iba a buscar | El más cercano (el arquero solo dentro de su área) sale a buscarla durante el juego. |
| Pelota parada | Laterales y saques de arco ahora los decide el motor (campo `inicio` en la posesión) y se dibujan. Córners con 5 atacantes en el área, 2 en la puerta del área, defensores marcando en el área y 1–2 arriba. |

## Pruebas (CI, todas en verde)
- Motor v2 (1898 partidos + pruebas de 1000): OK · huella v1 `b6e76d8864c3a1f4` OK · auditoría de eventos 30 partidos OK · temporadas sin intervención OK · actualización/guardado OK.
- Simulador 2D (partido completo en x4) — mediciones nuevas:
  - Saltos de jugadores: 0 · teletransportes de pelota: 0
  - Jugadores a menos de 8 m de la pelota (promedio): 2,0 (máx. 6)
  - Largo de los equipos: 48,7 / 36,2 m · ancho: 35 / 32,6 m
  - Distancia media del arquero a su arco: 8,5 / 7,2 m
  - Pelota suelta en juego: 3,2 % del tiempo, la más larga 2,5 s
- La prueba falla si vuelven: saltos de jugadores, amontonamiento (>5 cerca), equipos de largo irreal, arqueros a más de 12 m, o pelota suelta >15 % / >6 s.

## Compatibilidad
Las carreras guardadas siguen funcionando. La narración del motor usa su propio generador aleatorio, así que la calibración de resultados no cambia.

## Pendiente (Etapa 4)
Cámara TV con seguimiento vertical y anticipación, repeticiones, rendimiento.
