# MODO CARRERA 12.0 · Rediseño visual completo

Versión de diseño. **No cambia ningún dato ni ninguna regla del juego**: toma la versión 11.2 tal cual y le agrega una capa de presentación encima.

## 1. Qué archivos cambiaron

| Archivo | Estado | Para qué |
|---|---|---|
| `css/mc12-diseno.css` | **nuevo** | Toda la identidad visual: colores, paneles, botones, tipografía, distribución para iPhone, iPad y pantallas grandes. |
| `js/mc12-diseno.js` | **nuevo** | Solo presentación: arma el inicio, el Noticiero, la ficha del jugador, el calendario mensual, los cuadros eliminatorios, el panel de finanzas y el menú lateral. Llama a las mismas funciones que ya existían. |
| `assets/jugadores/fotos.js` | **nuevo** | Archivo opcional (vacío) para asociar fotos a jugadores. Ver punto 5. |
| `index.html` | 4 cambios mínimos | Título `12.0`, `APP_VERSION='12.0'`, y las líneas que cargan la hoja de estilo y el script nuevos. Nada más. |
| `LEEME.txt` | nota agregada arriba | Resumen de esta versión. |
| `data/jugadores.js`, `data/mundo.js` | **sin tocar** | Idénticos byte por byte. |
| `js/mc10-*.js`, `js/mc11-nombres.js` | **sin tocar** | Motor de ligas, mundo, mercado y nombres: idénticos. |
| `assets/escudos/*`, `assets/estadio/*` | **sin tocar** | Idénticos. |

## 2. Protección de las plantillas (verificado)

Antes de empezar se guardó una copia del ZIP original y la huella SHA-256 de cada archivo. Al terminar se comparó de dos maneras:

1. **Por archivo**: `data/jugadores.js` y `data/mundo.js` tienen exactamente la misma huella que en 11.2.
   - `data/jugadores.js` → `49e5a1927eec8e60f25a9b037a1bc08c0949531fbdf1b132ecc20664da589c29`
   - `data/mundo.js` → `b7c526138d2118daf0e476546378cf08993231aab6da0283f31cafda63133ea9`
2. **Por registro, con el juego abierto**: se cargaron la 11.2 y la 12.0 y se comparó lo que el juego realmente usa.

| | 11.2 original | 12.0 final |
|---|---|---|
| Jugadores en la base | 51.893 | 51.893 |
| Países / ligas | 189 / 189 | 189 / 189 |
| Clubes | 2.327 | 2.327 |
| Jugadores repartidos en plantillas | 51.850 | 51.850 |
| Base idéntica registro por registro (nombre, club, posición, GRL, potencial, edad, nacionalidad, valor, dorsal, salario, contrato) | — | **sí** |
| Plantilla de cada uno de los 2.327 clubes idéntica | — | **sí** |

Además, una partida guardada con la 11.2 (club, fecha, puntos, presupuesto, formación y todos sus jugadores) se abre **idéntica** en la 12.0 y se puede seguir jugando. Al abrir la 12.0 por primera vez la app hace sola una copia automática "antes de actualizar", como en las versiones anteriores.

## 3. Identidad visual

- Azul muy oscuro y negro de base, dorado para lo importante (botón principal, pestaña activa, selección), detalles luminosos azules.
- Fondo de estadio con reflectores, bandas de tribuna en el encabezado de cada pantalla.
- Paneles con profundidad, borde fino y línea de luz superior; los destacados llevan borde dorado.
- Tipografía deportiva en cursiva para títulos; números grandes para lo que importa.
- Logo nuevo de MODO CARRERA (corona, texto metálico, línea dorada).
- Una sola familia de componentes para toda la app: pestañas, tarjetas, insignias de GRL, píldoras de posición, barras, tablas.
- Animaciones cortas y suaves; se desactivan solas si el dispositivo pide "reducir movimiento".

## 4. Pantalla por pantalla

| Pantalla | Qué tiene ahora |
|---|---|
| **A. Inicio** | Logo, bloque principal (Nueva partida, o Continuar con el escudo y el próximo partido), accesos (Cargar, Torneos, Mercado, Estadísticas, Academia, Noticiero, Jugadores, Copias, Configuración), ligas disponibles, competiciones internacionales. Conserva todas las entradas del menú anterior. |
| **B. Noticiero** *(nuevo)* | Noticia principal, tarjetas secundarias y lista. Pestañas: Últimas, Mi club, Ligas, Fichajes, Competencias, Mundo. Todo se genera con lo que pasó en la partida: último resultado, próximo rival, posición, líder, goleadas de la fecha, goleador, altas y bajas, ofertas pendientes, transferibles, copas, lesiones, sanciones, directiva, mensajes, selecciones y cambios de entrenador. |
| **C. Club** | Encabezado con escudo, puntos / posición / presupuesto, próximo partido, confianza, GRL del plantel con racha, noticias del club, accesos rápidos y mini tabla de posiciones. |
| **D. Plantel** | Cancha con tarjetas (retrato, GRL, posición, apellido), suplentes y reservas, y los indicadores GRL del equipo, valor del plantel, edad promedio y masa salarial. Los cambios funcionan igual que antes (tocar un jugador). |
| **E. Ficha del jugador** | Retrato, dorsal, posición, nacionalidad, edad, club, GRL y potencial; valor, salario, contrato; gráfico de radar y barras de atributos por grupo; estado físico y moral; estadísticas; información personal. Mismas acciones: Entrenar, Recuperar, Renovar, Transferible. |
| **F. Tácticas** | Formaciones, cancha, estilos de juego y ajustes (mentalidad, anchura, profundidad, presión, ritmo) con el estilo nuevo. |
| **G. Competiciones** | Pestañas con icono, tabla con zonas marcadas, **calendario mensual** con tus partidos de liga y copa, lista del mes, goleadores, y un panel con tu campaña y el próximo partido. |
| **H. Mercado** | Buscador, filtros, tarjetas de jugador, vender, y resumen. |
| **I. Simulador** | Marcador grande con escudos, estadio, eventos, estadísticas y controles con el estilo nuevo. |
| **J. Configuración** | Categorías a la izquierda y paneles con borde dorado. |
| **K. Academia** | Cantera, instalaciones y staff con icono, nombre en español y nivel en barras. Mismos botones de mejora. |
| **L. Torneos** | **Cuadro eliminatorio** por rondas con escudos, resultados, penales, tu cruce resaltado, rondas futuras "por definir", final destacada y campeón. Se arma solo para cada copa (nacional o internacional); debajo sigue el detalle completo. |
| **M. Estadio e infraestructura** | Imagen de estadio, estadio / academia / centro de entrenamiento con nivel y botón de mejora (mismos costos). |
| **N. Finanzas** | Saldo, valor del plantel, masa salarial, reputación, gráfico de salarios por línea, movimientos, deuda y patrocinador. |
| **O. Negociaciones y contratos** | Ofertas con estado (Aceptada / Pendiente / Rechazada / Descartada), historial con altas y bajas, y pestaña nueva **Contratos** con años restantes, salario y botón Renovar (usa la renovación que ya existía). |

En pantallas grandes hay menú lateral, barra superior con la temporada y la fecha, y las pantallas se reparten en dos columnas. En iPhone se mantiene la navegación inferior.

## 5. Tres cosas que conviene saber

**Fotografías de jugadores.** El proyecto no trae ninguna foto de jugador, y no se agregaron fotos de personas reales. En su lugar se dibuja un retrato con la camiseta del color del puesto y el dorsal. La app ya está preparada: si guardás imágenes en `assets/jugadores/` y las anotás en `assets/jugadores/fotos.js` (el archivo explica cómo), aparecen solas en el once, los suplentes, la ficha, el mercado y los contratos.

**Escudos.** Los 30 escudos de `assets/escudos/` son PNG con fondo blanco (no transparente). No se modificaron; se presentan sobre una chapa blanca redondeada para que no se vean como un cuadrado. Si algún día los reemplazás por PNG transparentes, se seguirán mostrando sobre esa misma chapa.

**Calendario mensual.** El motor del juego trabaja por fechas (jornadas), no por días. Para poder mostrar un calendario por mes, cada fecha de liga se ubica en domingos consecutivos desde agosto y las copas en el miércoles anterior. Es solo una forma de mostrarlas: no cambia el orden ni los resultados.

## 6. Lo que aparece en las referencias y la base no tiene

Las imágenes de referencia muestran datos que hoy no existen en la partida. No se inventaron:

- Atributos mentales, PlayStyles, altura y peso (la base tiene seis atributos: ritmo, tiro, pase, defensa, resistencia y fuerza).
- Evolución histórica del GRL e historial de clubes de cada jugador.
- Capacidad, comodidad y seguridad del estadio en números (hoy existe el nivel).
- Bonificaciones y cláusulas de contrato.
- Fotografías de jugadores, estadios reales y logos oficiales de ligas.

Si querés alguno, se puede sumar como dato nuevo en una versión siguiente, sin tocar las plantillas.

## 7. Pruebas realizadas

Con la versión final, en un navegador automatizado:

- **Funciones**: crear carrera; cambio titular–suplente (con aviso de posición); cambiar formación y estilo; fichar (sube el plantel, baja el presupuesto, aparece en historial y contratos); publicar y vender (sale del plantel, sube el presupuesto, ofertas con estado); entrenar, recuperar y marcar transferible desde la ficha; mejorar infraestructura y staff; guardar configuración; partido completo con pausa, eventos, estadísticas y calificaciones; **temporada entera** (entre 40 y 46 partidos, según cuánto se avance en las copas) con cierre e inicio de la siguiente; recargar la página y continuar. Resultado: todo igual que en 11.2, **0 errores**.
- **Pantallas**: 26 vistas en 320, 375, 390, 430, 768, 820, 1024, 1440 y 1920 px. Ningún elemento cortado ni fuera de pantalla.
- **Idiomas**: inglés y hebreo siguen funcionando (hebreo de derecha a izquierda). Los textos nuevos de esta versión (Noticiero, calendario, contratos) están en español.

No se probó en un iPhone físico ni con conexión a internet: la tipografía Barlow y los escudos en línea de clubes extranjeros dependen de la red; sin ella se usan una tipografía del sistema y las iniciales del club.

## 8. Cómo publicar

Igual que siempre: subí el contenido del ZIP al mismo proyecto de Cloudflare Pages y abrí la app desde la misma dirección. Las partidas guardadas se conservan.

Para volver a la interfaz anterior sin perder nada, alcanza con borrar en `index.html` las líneas que cargan `css/mc12-diseno.css` y `js/mc12-diseno.js`.
