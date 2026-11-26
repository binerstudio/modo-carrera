# Limpieza de motores (12.7.0)

- Rama: `limpieza-motores` (creada desde `main`). **`main` no se tocó.**
- Vista previa: https://limpieza-motores.carreramod0.pages.dev

## Qué cambió
1. **Tu partido se juega siempre con el v3.** Se sacó "Motor de partidos" de Configuración. Por dentro la carrera queda
   con `motor='v2'` y `v3=true` (el v2 arma el contexto del partido: clima, césped, árbitro, química).
2. **Motor v1 borrado**: el `else` de `minuteStep` (js/core/07-mc7-match.js) y todo lo que solo usaba él
   (`resolveAttack`, `strengths`, `pickShooter`, `pickAssist`, `quality`, pesos por puesto, `fitF`…), la opción
   "Clásico (v1)" y la prueba de huella `b6e76d8864c3a1f4` (tests/regresion.mjs ya no calcula huella).
3. **2D**: se borró de js/partido2d/vista2d.js el modo que "actuaba" el relato de v1/v2 (unas 330 líneas: jugadas
   armadas desde el relato, posesión, física propia, repetición grabada). El 2D solo dibuja la cinta del v3; si un
   partido no tiene cinta, no se monta y la pantalla muestra la formación. Se borró tests/partido2d.mjs (era solo de
   ese modo).
4. **v2 solo por dentro**: simula los partidos de la IA de tu liga y es la reserva: si un partido tuyo no se puede
   armar en la cancha, se juega con el v2 con el aviso que ya existía ("⚠ MOTOR v2" y un cartel). No aparece en la
   interfaz. Las demás ligas y las copas siguen con el modelo rápido de resultados de siempre (no es el v1).
5. **Carreras guardadas**: migración de carrera v3 (js/core/05-mc9-datos.js): al abrirlas pasan solas al v3; no se
   borra nada y el motor que tenían queda anotado en `motorAnterior`. Versión 12.7.0: al abrir se hace la copia
   automática "Antes de actualizar a la versión 12.7.0".

## Pruebas (CI liviano en cada push; lo pesado, solo a mano)
**CI liviano: corridas 125 (`8e17e94`) y 126 (`f9c09af`), las dos en verde.** Publicación de la vista previa: OK.
- Motor v3 (300 partidos, etapas 1-6) ✅
- v3 en el juego ✅: carrera nueva en v3 sin elegir nada, Configuración sin "Motor de partidos", partido en vivo con
  cambio, 5 fechas más con v3, guardado y recarga. Forzando que el v3 no se pueda armar: se juega con el v2, sale el
  aviso, no se muestra el 2D y el partido siguiente vuelve al v3.
- Marcador, localía y reloj ✅ (liga de local, de visitante, copa y neutral).
- Tres temporadas sin intervención ✅: 107/107 partidos del usuario con el v3, liga 2,48-2,68 goles por partido.
- Auditoría de eventos ✅: 10 partidos con el v3 (ids, minutos, marcador = goles del relato, goleadores del equipo
  correcto) y 30 con el v2 de reserva (auditoría completa de las jugadas escritas, 716 jugadas, aviso en todos).
- Actualización ✅, comparando campo por campo lo guardado (solo se permiten datos agregados y dos contadores que
  suben solos al abrir, igual que en la 12.6.0):
  - 12.2.2 (v1): se abre, 0 datos distintos, pasa a v3 (`motorAnterior: 'v1'`) y el partido siguiente es v3.
  - 12.6.0, una carrera con cada motor (v1, v2 y v3): las tres se abren, 0 datos distintos, las tres en v3.
  - Copia automática "Antes de actualizar a la versión 12.7.0" en los dos casos.
- A mano (acá, fuera del CI): el 2D completo (v3tv: 3 min a x1, 0 saltos de cámara, escena final sin nadie corriendo,
  mejores jugadas, simular) ✅ y la pantalla completa en iPhone ✅.

## Lo que quedó igual a propósito
- Las otras ligas y las copas se simulan con el modelo rápido de resultados de siempre: no es el v1. El v2 solo
  simula los partidos de la IA de tu liga. Pasar ligas y copas al v2 cambiaría la calibración y el tiempo de cada
  fecha en el teléfono; si lo querés, es otro paso.
- La IA del mercado (Clásica/Avanzada) sigue en Configuración: no es un motor de partidos.
