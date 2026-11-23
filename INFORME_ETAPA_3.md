# MODO CARRERA 12.5.0 · ETAPA 3 — IA DE LOS CLUBES Y MERCADO

**Fecha:** 23/11/2026 · **Rama:** `etapa-3` (incluye las Etapas 1 y 2; nada pasó todavía a `main`) · **Vista previa:** https://etapa-3.carreramod0.pages.dev

## 0. Corrección pedida: relato de los goles

**Antes:** la pantalla del partido mostraba solo la primera oración de cada evento. En los goles se veía "¡GOOOL de River Plate!" y nada más.

**Ahora:** cada gol muestra **autor, asistencia y cómo fue** (de cabeza, de contraataque, de tiro libre, de penal, etc.) y debajo la descripción completa. El dato queda guardado en cada evento de gol (`gol: {autor, asist, tipo}`).

**Comprobado:** en 3 temporadas automáticas, 260 de 260 goles mostraron el detalle.

## 1. Análisis del sistema anterior

Al cerrar cada temporada, `aiTransfers` movía hasta 60 jugadores destacados a clubes más fuertes:
- Sin dinero, sin ventas compensatorias ni reposición.
- Sin préstamos, sin contratos y sin libres.

Los partidos entre clubes de la IA usaban un modelo rápido (Poisson según el GRL). Los entrenadores de la IA ya tenían estilo, nivel, despidos y contrataciones, y eso se conserva.

## 2. Qué se hizo

### Economía y mercado de la IA (`js/ia/mercado-ia.js`)

- **Presupuesto de cada club:** sale del valor de su plantel y de su fuerza, más un resultado neto por temporada, con tope de deuda y tope de acumulación.
  - Se calcula siempre igual y **solo se guarda cuando el club compra o vende**, para que la partida no crezca de más.
- **Contratos estimados:** cada jugador tiene un vencimiento inicial y después renueva en ciclos de 2 a 4 años.
  - Al vencer, el club renueva a sus titulares de hasta 32 años.
  - Los demás pueden quedar **libres** y firmar gratis con un club de su nivel que los necesite.
  - Los de 34 años o más sin club se retiran.
- **Traspasos con dinero:**
  - **Comprador:** cada club detecta sus necesidades por puesto (le faltan jugadores o su titular está por debajo del nivel del equipo) y busca refuerzos que pueda pagar.
  - **Vendedor:** solo vende si conserva el mínimo en ese puesto y vende como máximo 3 jugadores.
  - **Jugador:** un titular solo se va a un club de igual o mejor nivel.
  - **Precio:** el contrato corto lo abarata.
  - El comprador paga y el vendedor cobra.
- **Préstamos:** los juveniles sin lugar en clubes grandes van una temporada a clubes de su nivel y vuelven al terminarla.
- **Seguridad:** si el mercado deja a un club sin lo necesario para formar su once (arquero incluido), se le repone a préstamo. Tu plantel nunca se toca.
- **Topes por verano:** 240 traspasos, 140 libres y unos 50 préstamos. El historial guarda los 220 movimientos más importantes de las últimas 4 temporadas.

### Partidos entre clubes de la IA con el motor v2 (`js/ia/partidos-ia.js`)

En las carreras con motor v2, los partidos de **tu liga** entre clubes de la IA se juegan con el mismo motor que los tuyos: el mejor once 4-3-3 de cada club, sus suplentes, el nivel de su entrenador y una táctica según su estilo.

Las demás ligas y copas siguen con el modelo rápido, porque son miles de partidos por temporada en el teléfono.

### Activación

- **Carreras nuevas:** motor v2 + IA v2.
- **Carreras existentes:** siguen con lo clásico. Se puede activar en Configuración → General → "Mercado e IA" (y "Motor de partidos").
- La pantalla Mundo → Traspasos muestra el tipo de cada movimiento: traspaso con su monto, libre, préstamo, vuelve de préstamo o retiro.

## 3. Archivos

**Nuevos:**
- `js/ia/mercado-ia.js`, `js/ia/partidos-ia.js`
- `tests/temporadas.mjs`
- `INFORME_ETAPA_3.md`

**Modificados:**
- `js/mc10-mundo.js`: usa el mercado v2 si está activo; si no, `aiTransfers` igual que antes.
- `js/mc10-liga.js`: los partidos de la IA usan v2 si está activo; si no, el modelo rápido igual que antes.
- `js/mc10-ui.js`: tipo de movimiento en Traspasos.
- `js/mc12-diseno.js`: relato de goles.
- `js/core/07-mc7-match.js`: dato del gol en el evento.
- `index.html`, `sw.js`, `05-mc9-datos.js` (versión 12.5.0), `tests/temporadas.mjs`, CI y `LEEME.txt`.

## 4. Pruebas (ejecutadas de verdad en GitHub Actions)

**Tres temporadas seguidas sin intervención del usuario** (`tests/temporadas.mjs`, River Plate, motor v2 + IA v2):

| | T1 (2026) | T2 (2027) | T3 (2028) |
|---|---|---|---|
| Goles por partido en la liga (IA v2) | 2,54 | 2,57 | 2,55 |
| Goles con autor y asistencia en el relato | 98/98 | 66/66 | 97/97 |
| Traspasos / libres / préstamos / retiros | 240 / 0 / 50 / 0 | 241 / 140 / 51 / 34 | 241 / 140 / 51 / 18 |
| Dinero movido en traspasos | 695M | 441M | 663M |
| Presupuesto de clubes (mediana / máximo) | 7,0M / 265M | 4,8M / 322M | 4,1M / 556M |
| Plantel mínimo de un club de tu liga | 24 (1 arquero*) | 23 (2) | 23 (2) |
| Jugadores en dos clubes | 0 | 0 | 0 |
| ¿La IA tocó tu plantel? | No | No | No |
| Peso de la partida | 446 KB | 630 KB | 812 KB |
| Errores de JavaScript | 0 | 0 | 0 |

\* Ese club ya tenía 1 solo arquero en la base de datos; no es un efecto del mercado.

En la primera temporada no hubo libres ni retiros porque ningún contrato vencía todavía; empiezan desde la segunda.

**Ejemplos de traspasos:**
- Julián Álvarez: Atlético → Bayern (116M)
- Robin Risser: Lens → Real Madrid (72M)
- Lisandro Martínez: Manchester United → Liverpool (38M)
- Dušan Vlahović: Beşiktaş → Arsenal (36M)

**Regresión:**
- La huella del motor clásico sigue en `b6e76d8864c3a1f4`: las carreras existentes juegan igual.
- La validación masiva del motor v2 sigue OK.
- Una carrera de la 12.2 se abre con la 12.5 con datos idénticos y sigue en modo clásico.

## 5. Pendientes (no hechos en esta etapa)

- **Tu mercado:** pagos en cuotas, cláusulas, bonificaciones, comisiones y agentes no se implementaron. Las compras, ventas, préstamos y contratos que ya existían siguen igual. Propuesta: una etapa propia del mercado del usuario, o sumarlo a la Etapa 5.
- **Mercado de invierno de la IA:** solo opera el de verano.
- **Lesiones y cansancio de los clubes de la IA:** no persisten entre partidos. Cada partido de la IA arranca con su mejor once.
- **Finanzas de la IA en pantalla:** el presupuesto existe y se usa, pero no se muestra. Hay una función lista para mostrarlo (`mcIAEco(club)`).
- **Peso de la partida:** crece unos 180 KB por temporada. Con el respaldo de la Etapa 1 no se pierde progreso, pero conviene compactar datos antiguos más adelante (Etapa 8, nube).
- **Rotación automática** del equipo del usuario: sigue pendiente (hallazgo de la Etapa 2).
- **Partido animado en 2D:** sigue pendiente.

## 6. Publicación

Hoy la 12.5 está solo en **etapa-3.carreramod0.pages.dev**. La dirección principal sigue con la 12.2.2. Cuando lo autorices, paso todo a `main`.
