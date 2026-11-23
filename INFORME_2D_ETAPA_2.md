# SIMULADOR 2D · ETAPA 2 — FUTBOLISTAS, EQUIPACIONES Y ANIMACIONES

**Rama:** `etapa-2d-e2` · **Vista previa:** https://etapa-2d-e2.carreramod0.pages.dev

## Problemas encontrados

- Las figuras eran palitos rígidos: piernas sin rodilla, brazos sin codo, sin botines, cuello ni mangas, y todas iguales.
- Solo había camiseta titular y una suplente genérica; no existía la tercera.
- La marcha no cambiaba entre caminar, trotar, correr o esprintar, y nadie retrocedía ni se desplazaba de costado.

## Qué se hizo

**Esqueleto 2D** (`js/partido2d/vista2d.js`). Cada futbolista se arma con articulaciones: cadera, rodilla, tobillo y botín; hombro, codo y mano; torso con inclinación; cuello y cabeza.
- **Ropa:** camiseta con su diseño, cuello y mangas, pantalón, medias y botines.
- **Rasgos:** 7 peinados, 7 colores de pelo, 6 tonos de piel y 7 colores de botines.
- Sombra debajo del cuerpo.

**Marcha según la velocidad:**
- Caminar, trotar, correr y esprintar tienen distinta amplitud y flexión de rodilla; al esprintar el cuerpo se inclina hacia adelante.
- Al frenar, el cuerpo se va hacia atrás. Para girar, el jugador primero frena.
- Los que defienden miran la pelota, así que **retroceden de frente a la jugada**.
- Desplazamiento lateral.

**Acciones técnicas:**
- Pase con el pie hábil (cada jugador es diestro o zurdo).
- Remate, y volea si la pelota viene alta.
- Control: rápido o torpe según el atributo de control.
- Cabezazo con salto, entrada, barrida y amague. Los que tienen regate de 78 o más hacen bicicleta.
- Protección de la pelota: la hace el jugador fuerte cuando un rival lo aprieta.

**Reacciones:**
- Caerse y levantarse, perder el equilibrio, protestar, pedir la pelota y abrazarse.
- Lamento, con 2 variantes.
- Festejos con 4 variantes que dependen del jugador: brazos arriba, avión, de rodillas y puño.

**Arqueros:** posición de guardia cuando la pelota se acerca, atajada, estirada y saque. Llevan guantes.

**Diferencias individuales:**
- Velocidad y aceleración según los atributos.
- Cadencia de la zancada.
- Pie hábil.
- Contextura **estimada** a partir del salto, el cabezazo, la fuerza y el puesto. La base de datos no tiene alturas reales.
- Postura.
- Amplitud de los brazos.

**Vista cenital:** ahora se ve una figura desde arriba (hombros con la camiseta, cabeza y piernas que se alternan) en lugar de un círculo. La vista Táctica sigue con fichas numeradas.

**Equipaciones** (`js/partido2d/camisetas.js`):
- Titular, suplente y **tercera**, más la de arquero; cuello y mangas.
- El visitante usa, de sus tres camisetas, la que más contrasta con la del local. Por ejemplo, Platense usa la marrón contra River y Newcastle la tercera contra Juventus.
- Hay una tabla `EXTRA` para cargar las segundas y terceras camisetas reales de cada club.

## Pruebas (GitHub Actions)

- **Hoja de poses:** 31 poses dibujadas con las camisetas de River–Boca y de Barcelona–Real Madrid. Revisé las capturas.
- **Partido en vivo:** OK, con 0 teletransportes y marcador sincronizado.
  - **Estados vistos:** quieto, caminando, trotando, corriendo, esprintando, girando, retrocediendo y lateral.
  - **Acciones vistas:** protección, pase, pide, lamento, festejo, abrazo, estirada, control, se levanta, barrida, cae, protesta, saque, cabezazo, desequilibrio y entrada.
- **Corrección:** el contador de teletransportes daba un falso positivo en el último tramo de los remates rápidos a x4.
- Siguen OK: huella del motor clásico, validación masiva v2, auditoría de 30 partidos, 3 temporadas sin intervención y actualización desde la 12.2.

## Pendientes

- **Sprites dibujados a mano:** no hay ilustraciones de futbolistas en el proyecto. El esqueleto es la infraestructura y permite reemplazar partes (cabeza, torso) por imágenes cuando existan.
- **Camisetas reales:** las segundas y terceras reales no están cargadas (se generan). Los colores titulares de 185 clubes siguen marcados como "referencia, a verificar".
- **Etapa 3:** paredes, coberturas, bloque bajo/medio/alto según la táctica, saques laterales y de arco propios, y cambios con su escena.
- **Etapa 4:** cámara TV con seguimiento vertical y zoom, repetición de goles y medición real de cuadros por segundo en el teléfono.
