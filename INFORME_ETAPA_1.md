# MODO CARRERA 12.3.0 · ETAPA 1 — FUNDACIÓN TÉCNICA

**Fecha:** 23/11/2026 · **Rama:** `etapa-1` (sin pasar a `main`) · **Vista previa:** https://etapa-1.carreramod0.pages.dev
**Regla cumplida:** no cambió ningún resultado, jugador, club ni partida guardada. Está demostrado por la huella de regresión, que es idéntica antes y después.

## 1. Infraestructura conectada

| Servicio | Estado |
|---|---|
| GitHub | Repositorio privado `binerstudio/modo-carrera`. `main` = 12.2.2 original sin cambios |
| Cloudflare Pages | Proyecto `carreramod0` (la misma dirección de siempre). Push a `main` → producción. Push a otra rama → vista previa `<rama>.carreramod0.pages.dev` |
| Supabase | Proyecto `modo-carrera` (ID `jeccovucmdjnyokhhpzb`, São Paulo, plan gratis). Vacío a propósito hasta la Etapa 7 |
| Secretos | `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` cargados en GitHub. Ninguna clave está en el código |

## 2. Qué se hizo

1. **Banco de pruebas automático** (`tests/regresion.mjs`, se ejecuta en GitHub Actions con cada push):
   - Juega temporadas completas en un navegador real (Chromium) con **azar y reloj fijos**: River ×2 temporadas, Real Madrid y Arsenal.
   - Mide goles por partido, % de victorias locales, empates, goleadas, puestos, presupuesto, guardado y recarga.
   - Calcula una **huella** de todos los resultados. Si cambia, cambió el juego.
   - Prueba **almacenamiento lleno** y **app instalable**.
2. **Prueba de actualización** (`tests/actualizacion.mjs`): crea una carrera con la versión publicada (`main`), cambia a la nueva en la misma dirección y comprueba que la carrera llega idéntica.
3. **Separación del código:** los 13 bloques que estaban dentro de `index.html` pasaron a `js/core/01…13-*.js`, en el **mismo orden** y con el **mismo contenido byte por byte** (verificado). `index.html` bajó de 321 KB a 65 KB.
4. **Respaldo del guardado** (`js/core/14-mc-respaldo.js`):
   - Cada guardado queda numerado (`career._guardado`) y se copia también en IndexedDB.
   - Si el navegador se queda sin espacio, avisa con claridad y el progreso no se pierde.
   - Al abrir la app, si la copia interna es más nueva, se recupera sola.
   - Al eliminar una carrera, se elimina también su copia.
   - **No se tocó ninguna clave existente.**
5. **App instalable (PWA):**
   - `manifest.webmanifest`, íconos (`assets/icons/`) y `sw.js`.
   - Con conexión siempre carga la versión nueva; sin conexión abre la copia guardada.
   - El service worker **no toca las partidas**.
   - Orientación libre, vertical u horizontal.
6. **Ajustes sin efecto ocultos** (`js/core/15-mc-ajustes.js`):
   - Clima, desgaste, sanciones, sonido, gráficos, notificaciones, vibración y otros se guardaban pero ningún código los usaba. Ya no se muestran.
   - Sus valores siguen guardados para reactivarlos cuando tengan una función real.
   - Quedan visibles: nombre, dificultad, duración del partido, moneda, frecuencia de lesiones, guardado, idioma y cuenta.
7. **Versión unificada 12.3.0:**
   - El título y `APP_VERSION` coinciden, y todos los archivos llevan `?v=12.3.0`, así el navegador no usa archivos viejos.
   - Se quitaron los rótulos viejos "10.0", "6.2" y "5.0".
   - Al abrir la nueva versión se hace la copia automática "Antes de actualizar a la versión 12.3.0".

## 3. Archivos

**Nuevos:**
- `js/core/01-base-v4.js` … `13-mc10-boot.js` (el código que antes estaba en línea)
- `js/core/14-mc-respaldo.js`, `js/core/15-mc-ajustes.js`
- `sw.js`, `manifest.webmanifest`, `assets/icons/` (4 PNG)
- `tests/regresion.mjs`, `tests/actualizacion.mjs`
- `.github/workflows/publicar.yml`, `.github/workflows/pruebas.yml`
- `INFORME_ETAPA_1.md`

**Modificados:**
- `index.html` (scripts externos, manifiesto, versión y rótulos)
- `js/core/05-mc9-datos.js` (solo `APP_VERSION='12.3.0'`)
- `LEEME.txt` (sección 12.3)

**Sin cambios:** `data/jugadores.js`, `data/mundo.js`, el motor, ligas, mercado, diseño, escudos y fotos.

## 4. Pruebas realizadas (ejecutadas de verdad, en GitHub Actions)

| Prueba | Base 12.2.2 | 12.3.0 |
|---|---|---|
| Huella de resultados (4 temporadas, semilla fija) | `b6e76d8864c3a1f4` | `b6e76d8864c3a1f4` (idéntica) |
| Errores de JavaScript | 0 | 0 |
| Guardar → recargar → misma carrera (3 clubes) | OK | OK |
| Carrera guardada con 12.2 se abre con 12.3 | — | OK, datos idénticos y copia automática creada |
| Almacenamiento lleno: aviso + recuperación al reabrir | No existía | OK (fecha 4 y 4 puntos recuperados) |
| Manifiesto + service worker registrados | No existía | OK |

**Línea base del motor actual** (sirve de referencia para la Etapa 2):
- Liga Argentina: 2,41–2,43 goles por partido, 44–47 % de victorias locales, 23–24 % de empates.
- LaLiga: 2,59 goles por partido. Premier: 2,50.
- Goleadas por 5 o más goles: entre 2 y 8 por temporada.

**Peso de una carrera:** unos 480 KB después de 2 temporadas, contra un límite de unos 5 MB por sitio.

## 5. Corrección a la auditoría (Etapa 0)

Dije que no había ningún control de almacenamiento lleno. En realidad `save()` ya tenía un `catch` que mostraba un aviso breve. Lo que faltaba era resguardar el progreso y recuperarlo, y eso es lo que se agregó.

## 6. Pendientes y decisiones

- **IDs estables de jugadores: se pasan al comienzo de la Etapa 2.** En la Etapa 2 cambia el formato de los datos (atributos individuales). Crear ahora una tabla de IDs obligaría a rehacerla. Se hará en el mismo cambio, con su migración.
- **Las 71 funciones redefinidas** siguen como estaban. Ahora están en archivos separados y protegidas por la huella, así que se pueden ir limpiando de a una sin riesgo.
- **No probado en un iPhone o Android físico.** Las pruebas usan Chromium en tamaño de iPhone. Instalar desde Safari: botón Compartir → "Agregar a pantalla de inicio".
- **Escudos faltantes:** la prueba registra los que se piden y no existen (por ejemplo `real-madrid.png` y `arsenal.png`). Es un tema de datos de etapas posteriores.
- Para probar con **partidas reales tuyas**, mandame un archivo exportado (.json) de Copias de seguridad.

## 7. Publicación

Hoy la 12.3.0 está **solo en la vista previa**. Para pasarla a carreramod0.pages.dev se une `etapa-1` con `main` (lo hago cuando lo autorices). Cloudflare la publica sola en menos de un minuto. Al abrirla, cada jugador recibe la copia automática "Antes de actualizar".
