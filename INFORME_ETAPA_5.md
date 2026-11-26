# MODO CARRERA 12.9.0 · ETAPA 5 — MERCADO DEL USUARIO

**Fecha:** 26/11/2026 · **Rama:** `etapa-5` (creada desde `etapa-4`; `main` no se tocó) · **Vista previa:** https://etapa-5.carreramod0.pages.dev

## 1. Qué cambia para vos

### Comprar: negociación en dos partes

**Parte 1 · Oferta al club** (`js/mercado/negociacion.js`). Se abre con "Ofertar" o "Negociar fichaje", igual que antes.

La pantalla muestra:
- el contrato que le queda al jugador con su club,
- su importancia en el plantel (clave, titular o suplente),
- la economía del club (necesita vender, estable u holgada; **estimada**),
- su cláusula de rescisión (**estimada**).

Tu oferta tiene:
- **Monto**.
- **Forma de pago:** contado, 2 cuotas o 3 cuotas.
- **Bonos por objetivos:** por goles, por partidos o por títulos en una temporada. Cada uno lleva meta y monto, y se paga solo si se cumple.
- **Porcentaje de futura venta para el vendedor:** 0, 10, 20 o 30 %.

**Cómo responde el club.** Responde según lo que pide (`js/mercado/reglas.js`):

| Factor | Efecto sobre el precio que pide |
|---|---|
| Valor de mercado | base |
| Contrato restante | 1 temporada ×0,7 · 2 ×0,9 · 3 ×1 · 4 o más ×1,08 |
| Importancia | clave ×1,3 · titular ×1,12 · suplente ×0,92 |
| Economía del club | con deuda ×0,85 (necesita vender) · caja holgada ×1,08 |

- **Cuotas:** valen menos para el vendedor (cada temporada de espera descuenta 6 %, o 12 % si el club está con deuda).
- **Bonos:** el vendedor los cuenta al 45 %.
- **Porcentaje de futura venta:** suma algo de valor para el vendedor.
- **Respuestas posibles:**
  - **Acepta.**
  - **Contraoferta:** baja su pedido hacia tu oferta, sin pasar de su mínimo. Podés aceptarla con un botón.
  - **Rechaza:** si la oferta está a menos del 55 % de lo que pide.
- **Máximo 3 rondas.** En la tercera acepta o rechaza para siempre. Si corta, no vuelve a negociar hasta la temporada que viene.
- **Pagar la cláusula** (al contado): el club **no puede negarse** y se pasa directo a la parte 2.

**Parte 2 · Contrato con el jugador**, aparte del acuerdo con el club. Se negocian sueldo, años, cláusula de rescisión y comisión del agente, también en 3 rondas como máximo.

Su agente dice qué pide: sueldo aproximado, años según la edad y comisión (5 a 10 %, **estimada**).

**El jugador puede rechazar:**
- **Club chico:** si tu club tiene 14 puntos menos de nivel que el suyo y él es GRL 76 o más, o 9 puntos menos y él es GRL 84 o más. En la prueba, Mbappé rechazó a River.
- **Poca titularidad:** un GRL 80 o más que sería suplente no acepta. Con menos nivel pide más sueldo.
- **Sueldo bajo:** contrapropone. Si en la tercera ronda no le conviene, se cae el acuerdo con el club y **no se paga nada**.

**Otras preferencias del jugador:**
- **Cláusula:** baja le gusta más; muy alta le molesta.
- **Comisión:** si le das a su agente menos de lo que pide, le resta.

**Firma:**
- Se pagan la cuota 1 y la comisión del agente.
- Las demás cuotas y los bonos quedan agendados.
- El jugador llega con su cláusula, su comisión y, si cediste porcentaje, la futura venta que le debés al club de origen.

### Vender

"Consultar ofertas de clubes" ahora abre una negociación:
- Ofertan **clubes reales** con presupuesto. Si no les alcanza para el contado, ofrecen en cuotas.
- Podés **aceptar**, **rechazar** o **contraofertar**, hasta 3 rondas. En la contraoferta pedís:
  - un monto,
  - un **porcentaje de futura venta** para vos,
  - una **opción de recompra** (precio y plazo de 1 o 2 temporadas).
- El comprador sube su oferta si puede, o se retira.
- **Si después la IA revende a ese jugador**, cobrás tu porcentaje.
- **La recompra se ejecuta desde Finanzas:** el club no puede negarse y negociás de nuevo con el jugador.
- **Si vendés a alguien por quien debías futura venta**, se le paga su parte a su club de origen.

### Cláusula de rescisión: obliga a vender

- **Vos pagás la de un jugador de la IA:** el club no puede negarse.
- **La IA paga la de tus jugadores:** en el cierre de temporada, un club de la IA que pueda pagarla puede comprar a tu jugador.
  - Solo pasa si la cláusula es menor que 1,6 veces su valor, con un 35 % de probabilidad por temporada.
  - La venta es obligatoria y te avisa el buzón.
  - Solo pasa con cláusulas pactadas en esta versión. Los jugadores que ya tenías no tienen cláusula, así que nada cambia en las carreras guardadas.

### Finanzas → "Compromisos del mercado" (`js/mercado/finanzas.js`)

Panel nuevo en la pantalla de economía con:
- Resumen: cuotas a pagar, cuotas a cobrar, bonos posibles y capacidad para comprar en cuotas.
- **Pagos que vencen en cada cierre de temporada**, uno por uno.
- Bonos vigentes con su progreso, y los ya pagados o vencidos.
- Cláusulas de tu plantel, futuras ventas (a favor y en contra) y recompras con su botón.
- Últimos movimientos de dinero del mercado.

**Cuándo vence cada cosa:**
- **Cuotas:** la 1 al firmar, la 2 en el cierre de esa temporada y la 3 en el cierre de la siguiente. Si firmás con la temporada ya terminada, cuentan desde la que empieza.
- **Bonos:** se evalúan al cierre de cada una de sus 2 temporadas, con los goles y partidos de esa temporada en tu club o los títulos ganados. Se pagan la primera vez que se cumplen; si no, vencen.

**Tope de endeudamiento:**
- Las cuotas que debés no pueden superar tu saldo más el 35 % del valor de tu plantel.
- Con saldo negativo no podés comprar en cuotas.
- Si un cierre te deja en negativo, la directiva lo nota (−6 de confianza).

## 2. La IA usa lo mismo (`js/ia/mercado-ia.js`)

Cada compra de la IA (verano e invierno):
- **Negocia** con las mismas reglas, hasta 3 rondas: lo que pide el vendedor según contrato, importancia y economía, contra el tope del comprador.
- **Cláusula:** si el vendedor no quiere soltar a un titular, el comprador puede pagarla, solo al contado.
- **Comisión de agente:** la paga el comprador.
- **Cuotas:** si no le alcanza para el contado, paga en 2 o 3 cuotas, con un tope de deuda según su caja y lo que gana por temporada. Las cuotas (`world.cuotasIA`) se pagan en el mercado de verano de la temporada que corresponde.
- **Bono por partidos** (`world.bonosIA`): se paga solo si el jugador es titular en su club nuevo.
- **Tus operaciones** con un club de la IA mueven su presupuesto: lo que le pagás o te paga.

## 3. Pruebas (corridas de verdad en esta máquina)

### Mercado del usuario (`tests/mercado.mjs`, nueva): **OK**

| Qué se probó | Resultado |
|---|---|
| Precio: contrato corto y club con deuda piden menos; cuotas valen menos que contado | ✔ (6,2 vs 14,6; 9,1 vs 10,8) |
| Rondas con el club | contraoferta → contraoferta → rechazo final en la 3ª (jugador clave: no baja de su mínimo) |
| Oferta ridícula | rechazo en las 3 rondas; después queda cortada |
| Compra en 3 cuotas + 2 bonos (Cannavo, Racing) | 2,42M = 0,82 + 0,80 + 0,80; al firmar se pagó 1,06 = cuota 1 + comisión 0,24 |
| Cierre 2026/27 | cuota 2/3 (0,80); ningún bono (no se cumplieron) |
| Cierre 2027/28 | cuota 3/3 (0,80) + bono de goles 0,70 (se cumplió esa temporada); bono de partidos vencido sin pagar |
| Cierre 2028/29 | nada más que pagar |
| Club chico | Mbappé (Real Madrid → River): "No quiere jugar en un club de ese nivel" |
| Poca titularidad | GRL 81 que sería suplente: "Quiere ser titular" |
| Sueldo bajo | contrapropuesta → contrapropuesta → rechazo; no se fichó ni se pagó |
| Pagás la cláusula (8,55M) | el club no puede negarse; firmó |
| La IA paga la cláusula de tu jugador | venta obligatoria a Platense, +1,5M, sale del plantel |
| Venta con 20 % de futura venta + recompra | el comprador subió su oferta y se cerró en la ronda 2; cuando la IA lo revendió por 20M cobraste 4M |
| Pantallas | panel de Finanzas con las 4 secciones; negociación abierta con clics reales desde Negociaciones |
| Errores de JavaScript | 0 |

En las primeras corridas apareció un caso real: el jugador comprado con una cláusula barata (1,2 veces su valor) se lo llevó un club de la IA en el primer cierre. Es la regla funcionando; en la prueba se le puso una cláusula normal para poder seguir sus cuotas y bonos.

### Temporadas sin intervención (`tests/temporadas.mjs`, ampliada)

Corrí 4 temporadas con River (en el CI corren 3).

| | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| Comisiones de agentes pagadas por la IA | 55,5M | 23,3M | 37,7M | 28,4M |
| Compras de la IA en cuotas | 15 | 5 | 8 | 5 |
| Cuotas de la IA pagadas en el cierre | 1 (11,4M) | 17 (80,8M) | 5 (28,8M) | 8 (48,2M) |
| Bonos de la IA pagados / caídos | 6 / 1 | 12 / 3 | 7 / 1 | 10 / 0 |
| Cuotas o bonos atrasados | 0 | 0 | 0 | 0 |
| Clubes con saldo negativo | 0 / 376 | 0 / 669 | 0 / 876 | 0 / 1.030 |
| **Clubes en bancarrota absurda** (deuda > 30 % de su plantel) | **0** | **0** | **0** | **0** |
| Traspasos de la IA (dinero movido) | 241 (718M) | 240 (329M) | 241 (531M) | 242 (365M) |
| Goles por partido en la liga | 2,50 | 2,56 | 2,52 | 2,57 |
| ¿La IA tocó tu plantel? / errores de JavaScript | no / 0 | no / 0 | no / 0 | no / 0 |
| Peso de la partida | 476 KB | 709 KB | 908 KB | 1.114 KB |

- **Cláusulas entre clubes de la IA: 0 en las 4 temporadas.** Las cláusulas estimadas (2 a 3,6 veces el valor) casi nunca entran en lo que un club de la IA puede pagar. La regla existe, pero en la práctica la IA no la usa.
- **Peso de la partida en la T4:** pasa el tope de la prueba (1.100 KB). No es nuevo: la Etapa 4 sola, con la misma semilla y 4 temporadas, pesa 1.120 KB. La Etapa 5 no agrega peso (en T3: 908 KB contra 921 KB de la Etapa 4). En el CI se corren 3 temporadas, que quedan debajo del tope.

### Actualización (`tests/actualizacion.mjs`, ampliada): **OK desde la 12.2.2 y desde la 12.6.0 (v1, v2 y v3)**

- Copia automática "Antes de actualizar a la versión 12.9.0".
- 0 campos guardados cambiados.
- Pasa al v3 y el partido siguiente se juega bien.
- Nuevo: al abrirla **no se crea nada del mercado nuevo** (`career.e5` aparece recién con tu primera operación), el panel de Finanzas se ve y la carrera vieja puede negociar y firmar con las reglas nuevas.

### Resto del CI liviano, corrido acá

Motor v3 en el juego: OK. Marcador, ficha, rotación, auditoría de eventos y motor v3: RESULTADOS_RESTO. Las pruebas pesadas no se corrieron: quedan para correr a mano.

## 4. Archivos

**Nuevos:**
- `js/mercado/reglas.js`, `js/mercado/finanzas.js`, `js/mercado/negociacion.js`
- `tests/mercado.mjs`
- `INFORME_ETAPA_5.md`

**Modificados:**
- `js/ia/mercado-ia.js`: negociación, cláusula, comisión, cuotas y bonos de la IA. También expone `mcIAEcoAjustar`, `mcIAContratoFin`, `mcIAPlantel` y `mcIAEcoResumen`.
- `js/mc12-diseno.js`: una línea, para que las barras de probabilidad de la pantalla de Negociaciones usen las reglas nuevas.
- `index.html`, `sw.js`, `js/core/05-mc9-datos.js`: versión 12.9.0.
- `tests/temporadas.mjs`, `tests/actualizacion.mjs`, CI (`tests/mercado.mjs` en las livianas), `LEEME.txt`, `.gitignore`.

**Datos:** `data/` no se tocó. No se inventaron datos reales:
- las cláusulas de la IA, la economía de los clubes y las comisiones están marcadas como **estimadas**,
- los agentes no tienen nombre.

## 5. Pendientes

- **Renovaciones:** siguen con el aviso de antes (años y +10 % de sueldo). Todavía no permiten pactar cláusula ni negociar con el agente.
- **Bonos en las ventas:** no hay, porque no se registran los goles de los jugadores en clubes de la IA.
- **Cláusulas entre clubes de la IA:** casi no se usan (ver arriba).
- **Sueldos:** no salen del presupuesto, igual que antes. El juego no cobra masa salarial, y cambiarlo alteraría la economía de las carreras guardadas.
- **Peso de la partida:** sigue creciendo unos 200 KB por temporada (pendiente de la Etapa 8).

## 6. Publicación

La 12.9.0 está solo en **etapa-5.carreramod0.pages.dev** (se publica con el push a la rama). `main` no se tocó. Paso todo a `main` cuando lo autorices.
