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
RESULTADOS_CI
