# Cambios en el fútbol argentino · MODO CARRERA 12.2

Autorizado por el usuario: corregir nombres y rehacer los GRL de la Liga Profesional Argentina (30 clubes, 852 jugadores).

## Cómo se hizo (y cómo deshacerlo)

- `data/jugadores.js` y `data/mundo.js` **no se tocaron** (mismo SHA-256 que el 11.2 original).
- **GRL:** `js/mc13-arg-grl.js` corrige el GRL en memoria al cargar el juego. Para volver a los originales, borrá su línea en `index.html`.
- **Nombres:** `js/mc13-arg-nombres.js` solo cambia cómo se ven en pantalla; las claves internas siguen iguales, así que las partidas guardadas funcionan igual.
- **Partidas ya empezadas:** al abrirlas, los jugadores de tu plantel que vienen de la base argentina y nunca cambiaron de GRL reciben el nuevo GRL una sola vez. El valor anterior queda guardado en `career.mc13prev`.
- Ningún jugador fue agregado, borrado ni cambiado de club. Ningún plantel cambió de integrantes (verificado club por club).

## Criterio de GRL
- Techo de la liga en ~80–81: Almada 81, Paredes 80, Di María 80, Correa 79.
- Se subieron las figuras subvaloradas, por ejemplo Otamendi 71→78, Kranevitter 68→71, Lanzini 68→72 y Rojo 64→70.
- Se bajaron los juveniles inflados, por ejemplo Aranda Mize 82→72, Andrada 82→68 y Leonel Flores 80→67.
- Para los que no ajusté uno por uno se aplicó una regla general: los de 76 o más bajan 3, los de 74–75 bajan 1, y los juveniles con GRL alto se acercan a su nivel real.

## Nombres corregidos (65)

| Antes | Ahora |
|---|---|
| Gastén Lodico | Gastón Lodico |
| Ulises Ciccioli ee | Ulises Ciccioli |
| Fabricio lacovich | Fabricio Iacovich |
| Ramén Arias | Ramón Arias |
| Simén Rivero | Simón Rivero |
| Jerénimo Démina | Jerónimo Dómina |
| Teo Rodriguez pene | Teo Rodriguez |
| Timoteo Chamorro By | Timoteo Chamorro |
| Matias Gémez GJ | Matias Gómez |
| Felipe Pefia Biafore | Felipe Peña Biafore |
| Ratil Loaiza | Raúl Loaiza |
| Claudio Bravo ap | Claudio Bravo |
| Alan Nufiez | Alan Núñez |
| Hernan Lopez Mufioz | Hernán López Muñoz |
| Gaston Verén | Gaston Verón |
| Valentino Acufia | Valentino Acuña |
| Lucas Gémez | Lucas Gómez |
| Jerénimo Gomez Mattar ofensiva | Jerónimo Gómez Mattar |
| Alan Sofiora | Alan Soñora |
| Walter Nufiez | Walter Núñez |
| 'gnacio Ramirez | Ignacio Ramirez |
| Santiago Quirés | Santiago Quirós |
| Celias Ingenthron | Elías Ingenthron |
| Gastén Togni | Gastón Togni |
| Juan Miguel oe | Juan Miguel |
| Franco Calderén | Franco Calderón |
| Jonathan De lrastorza | Jonathan De Irastorza |
| Joel Medina EJ | Joel Medina |
| Aarén Molinas | Aarón Molinas |
| Juan Cortazzo Ee | Juan Cortazzo |
| Bautista Barros an Schelotto | Bautista Barros Schelotto |
| Ignacio Miramén | Ignacio Miramón |
| Adrian Spérle | Adrian Spörle |
| Francisco Gonzalez Metilli ofensiva | Francisco González Metilli |
| Ramiro Hernandes | Ramiro Hernández |
| Daniel Zabala oe | Daniel Zabala |
| My Ignacio Pussetto fo ig | Ignacio Pussetto |
| Ezequiel Mufioz | Ezequiel Muñoz |
| Py Luciano Paredes | Luciano Paredes |
| Ismael Cortéz | Ismael Cortez |
| Luciano Cingolani Wy | Luciano Cingolani |
| MM ignacio Sabatini | Ignacio Sabatini |
| Nicolds Romano | Nicolás Romano |
| FI Fernando Tobio | Fernando Tobio |
| Rodrigo Insta | Rodrigo Insúa |
| Gustavo Abregd | Gustavo Abregú |
| Luca Rafaelli io | Luca Rafaelli |
| Jhon Cérdoba | Jhon Córdoba |
| Juan Pablo Luduefia | Juan Pablo Ludueña |
| Bruno Pittén | Bruno Pittón |
| Gaston Suso io | Gaston Suso |
| Kevin Ortiz io | Kevin Ortiz |
| Lisandro Pifiero | Lisandro Piñero |
| MN Braian Sanchez fe . . mya | Braian Sánchez |
| Gonzalo Bravo Ye | Gonzalo Bravo |
| Marco lacobellis | Marco Iacobellis |
| Michael Santos gq | Michael Santos |
| Martin Cuitifio | Martin Cuitiño |
| Nicolas Linares ae | Nicolas Linares |
| wa Francisco Perruzzi | Francisco Perruzzi |
| Matias Godoy Vg | Matias Godoy |
| Alan Sosa BJ | Alan Sosa |
| Lucas Bafios Sd | Lucas Baños |
| Nicolas Talpone YW | Nicolas Talpone |
| Fm Lucas Gonzalez | Lucas González |

## GRL cambiados (283)

| Club | Jugador | Pos | Edad | Antes | Ahora |
|---|---|---|---|---|---|
| Racing Club | Matias Tagliamonte | POR | 28 | 73 | 70 |
| Racing Club | Marco Di Césare | DEF | 24 | 75 | 73 |
| Racing Club | Nazareno Colombo | DEF | 27 | 75 | 71 |
| Racing Club | Matías Pérez | DEF | 27 | 75 | 71 |
| Racing Club | Mateo Martínez | DEF | 18 | 69 | 64 |
| Racing Club | Gonzalo Escudero | DEF | 19 | 65 | 64 |
| Racing Club | Alfonso Espino | DEF | 34 | 68 | 70 |
| Racing Club | Ezequiel Cannavo | DEF | 24 | 77 | 70 |
| Racing Club | Juan Barinaga | DEF | 26 | 75 | 71 |
| Racing Club | Leonel Pérez | MED | 22 | 78 | 70 |
| Racing Club | Ulises Ortegoza | MED | 29 | 73 | 71 |
| Racing Club | Matías Kranevitter | MED | 33 | 68 | 71 |
| Racing Club | Alan Forneris | MED | 21 | 70 | 67 |
| Racing Club | Gastón Lodico | MED | 28 | 77 | 72 |
| Racing Club | Ignacio Rodríguez | MED | 24 | 73 | 72 |
| Racing Club | Valentín Carboni | MED | 21 | 80 | 76 |
| Racing Club | Matko Miljevic | MED | 25 | 77 | 73 |
| Racing Club | Matías Zaracho | MED | 28 | 77 | 74 |
| Racing Club | Alejandro Tello | MED | 18 | 67 | 62 |
| Racing Club | Tomás Conechny | DEL | 28 | 75 | 72 |
| Racing Club | Adrián Martínez | DEL | 34 | 77 | 75 |
| Racing Club | Lautaro Díaz | DEL | 28 | 73 | 70 |
| Racing Club | Leandro Córdoba | DEL | 21 | 68 | 66 |
| Racing Club | Elías Torres | DEL | 25 | 69 | 68 |
| River Plate | Ezequiel Centurión | POR | 29 | 74 | 73 |
| River Plate | Lautaro Rivero | DEF | 23 | 80 | 72 |
| River Plate | Lucas Martínez Quarta | DEF | 30 | 79 | 78 |
| River Plate | Tobías Ramírez | DEF | 19 | 76 | 67 |
| River Plate | Juan Carlos Portillo | DEF | 26 | 78 | 73 |
| River Plate | Nicolás Otamendi | DEF | 38 | 71 | 78 |
| River Plate | Facundo González | DEF | 20 | 69 | 68 |
| River Plate | Francisco Ortega | DEF | 27 | 82 | 74 |
| River Plate | Marcos Acuña | DEF | 35 | 80 | 77 |
| River Plate | Gonzalo Montiel | DEF | 29 | 80 | 77 |
| River Plate | Giovanni González | DEF | 32 | 74 | 71 |
| River Plate | Aníbal Moreno | MED | 27 | 82 | 77 |
| River Plate | Fausto Vera | MED | 26 | 78 | 73 |
| River Plate | Lucas Silva | MED | 19 | 68 | 64 |
| River Plate | Tobías Andrada | MED | 19 | 82 | 68 |
| River Plate | Mauro Arambarri | MED | 31 | 78 | 75 |
| River Plate | Lautaro Pereyra | MED | 18 | 70 | 64 |
| River Plate | Thiago Almada | MED | 25 | 88 | 81 |
| River Plate | Tomás Galván | MED | 26 | 78 | 72 |
| River Plate | Juan Cruz Meza | MED | 18 | 72 | 65 |
| River Plate | Ángel Correa | DEL | 31 | 80 | 79 |
| River Plate | Lucas Beltrán | DEL | 25 | 82 | 75 |
| River Plate | Sebastián Driussi | DEL | 30 | 80 | 77 |
| River Plate | Rafael Santos Borré | DEL | 31 | 76 | 75 |
| River Plate | Santiago Beltrán | POR | 22 | 72 | 70 |
| Boca Juniors | Leandro Brey | POR | 24 | 73 | 70 |
| Boca Juniors | Agustín Marchesín | POR | 38 | 79 | 75 |
| Boca Juniors | Javier García | POR | 39 | 65 | 64 |
| Boca Juniors | Lautaro Di Lollo | DEF | 22 | 74 | 71 |
| Boca Juniors | Ayrton Costa | DEF | 27 | 75 | 73 |
| Boca Juniors | Facundo Herrera | DEF | 20 | 79 | 70 |
| Boca Juniors | Marco Pellegrino | DEF | 24 | 78 | 73 |
| Boca Juniors | Matías Satas | DEF | 18 | 72 | 63 |
| Boca Juniors | Nicolás Figal | DEF | 32 | 76 | 72 |
| Boca Juniors | Lautaro Blanco | DEF | 27 | 77 | 74 |
| Boca Juniors | Malcom Braida | DEF | 29 | 76 | 72 |
| Boca Juniors | Leandro Lozano | DEF | 27 | 78 | 70 |
| Boca Juniors | Dylan Gorosito | DEF | 20 | 77 | 67 |
| Boca Juniors | Milton Delgado | MED | 21 | 74 | 70 |
| Boca Juniors | Santiago Ascacíbar | MED | 29 | 80 | 76 |
| Boca Juniors | Leandro Paredes | MED | 32 | 82 | 80 |
| Boca Juniors | Tomás Belmonte | MED | 28 | 78 | 73 |
| Boca Juniors | Camilo Rey Domenech | MED | 20 | 73 | 66 |
| Boca Juniors | Rodrigo Battaglia | MED | 35 | 75 | 73 |
| Boca Juniors | Williams Alarcón | MED | 25 | 76 | 72 |
| Boca Juniors | Juan Ramírez | MED | 33 | 65 | 66 |
| Boca Juniors | Tomas Aranda Mize | MED | 19 | 82 | 72 |
| Boca Juniors | Carlos Palacios | MED | 26 | 74 | 73 |
| Boca Juniors | Sebastián Villa | DEL | 30 | 78 | 75 |
| Boca Juniors | Alan Velasco | DEL | 24 | 76 | 73 |
| Boca Juniors | Leonel Flores | DEL | 19 | 80 | 67 |
| Boca Juniors | Ángel Romero | DEL | 34 | 67 | 68 |
| Boca Juniors | Miguel Merentiel | DEL | 30 | 79 | 76 |
| Boca Juniors | Adam Bareiro | DEL | 30 | 76 | 73 |
| Boca Juniors | Milton Giménez | DEL | 30 | 74 | 72 |
| Boca Juniors | Enner Valencia | DEL | 37 | 71 | 72 |
| Rosario Central | Conan Ledesma | POR | 33 | 70 | 71 |
| Rosario Central | Ignacio Ovando | DEF | 19 | 79 | 67 |
| Rosario Central | Gaston Avila | DEF | 25 | 77 | 73 |
| Rosario Central | Juan Giménez | DEF | 20 | 74 | 66 |
| Rosario Central | Facundo Mallo | DEF | 31 | 75 | 71 |
| Rosario Central | Juan Cruz Komar | DEF | 30 | 69 | 70 |
| Rosario Central | Luca Raffin | DEF | 20 | 66 | 63 |
| Rosario Central | Emanuel Coronel | DEF | 29 | 75 | 71 |
| Rosario Central | Ulises Ciccioli | DEF | 23 | 69 | 66 |
| Rosario Central | Elias Veron | DEF | 19 | 65 | 62 |
| Rosario Central | Franco Ibarra | MED | 25 | 79 | 73 |
| Rosario Central | Vicente Pizarro | MED | 24 | 77 | 72 |
| Rosario Central | Federico Navarro | MED | 26 | 75 | 71 |
| Rosario Central | Alan Rodriguez | MED | 26 | 75 | 70 |
| Rosario Central | Pol Fernandez | MED | 35 | 66 | 68 |
| Rosario Central | Santiago Segovia | MED | 19 | 67 | 63 |
| Rosario Central | Jaminton Campaz | DEL | 26 | 76 | 75 |
| Rosario Central | Giovanni Cantizano | DEL | 19 | 75 | 66 |
| Rosario Central | Franco Cervi | DEL | 32 | 69 | 70 |
| Rosario Central | Julian Fernandez | DEL | 22 | 76 | 71 |
| Rosario Central | Ángel Di María | DEL | 38 | 79 | 80 |
| Rosario Central | Gaspar Duarte | DEL | 23 | 71 | 67 |
| Rosario Central | Tomas Badaloni | DEL | 26 | 77 | 71 |
| Rosario Central | Enzo Copetti | DEL | 30 | 75 | 72 |
| Estudiantes de La Plata | Fernando Muslera | POR | 40 | 79 | 76 |
| Estudiantes de La Plata | Fabricio Iacovich | POR | 24 | 71 | 68 |
| Estudiantes de La Plata | Tomas Palacios | DEF | 23 | 67 | 70 |
| Estudiantes de La Plata | Leandro Gonzalez Pirez | DEF | 34 | 66 | 70 |
| Estudiantes de La Plata | Valente Pierani | DEF | 20 | 68 | 66 |
| Estudiantes de La Plata | Marcos Rojo | DEF | 36 | 64 | 70 |
| Estudiantes de La Plata | Ramiro Funes Mori | DEF | 35 | 64 | 69 |
| Estudiantes de La Plata | Santiago Arzamendia | DEF | 28 | 75 | 72 |
| Estudiantes de La Plata | Gaston Benedetti | DEF | 25 | 75 | 71 |
| Estudiantes de La Plata | Joaquin Pereyra | DEF | 21 | 66 | 63 |
| Estudiantes de La Plata | Eros Mancuso | DEF | 27 | 75 | 73 |
| Estudiantes de La Plata | Eric Meza | DEF | 27 | 75 | 72 |
| Estudiantes de La Plata | Gabriel Neves | MED | 29 | 73 | 72 |
| Estudiantes de La Plata | Ezequiel Piovi | MED | 34 | 68 | 69 |
| Estudiantes de La Plata | Alexis Castro | MED | 32 | 74 | 71 |
| Estudiantes de La Plata | Baltasar Rodriguez | MED | 23 | 77 | 71 |
| Estudiantes de La Plata | Miguel Monsalve | MED | 22 | 76 | 72 |
| Estudiantes de La Plata | José Sosa | MED | 41 | 64 | 69 |
| Estudiantes de La Plata | Joaquin Tobio | DEL | 21 | 76 | 67 |
| Estudiantes de La Plata | Edwin Cetré | DEL | 28 | 75 | 74 |
| Estudiantes de La Plata | Brian Aguirre | DEL | 23 | 77 | 73 |
| Estudiantes de La Plata | Tiago Palacios | DEL | 25 | 77 | 72 |
| Estudiantes de La Plata | Fabricio Pérez | DEL | 20 | 76 | 66 |
| Estudiantes de La Plata | Joaquin Correa | MED | 32 | 71 | 74 |
| Estudiantes de La Plata | Adolfo Gaich | DEL | 27 | 73 | 70 |
| Estudiantes de La Plata | Guido Carrillo | DEL | 35 | 75 | 72 |
| Independiente Rivadavia | Nicolas Bolcato | POR | 22 | 75 | 70 |
| Independiente Rivadavia | Sheyko Studer | DEF | 23 | 78 | 70 |
| Independiente Rivadavia | José Florentin | MED | 30 | 72 | 71 |
| Independiente Rivadavia | Matias Fernandez | MED | 25 | 78 | 72 |
| Independiente Rivadavia | Gonzalo Rios | MED | 27 | 74 | 73 |
| Independiente Rivadavia | Rodrigo Atencio | DEL | 24 | 74 | 73 |
| Independiente Rivadavia | Maximiliano Salas | DEL | 28 | 76 | 73 |
| Independiente Rivadavia | Alex Arce | DEL | 31 | 74 | 73 |
| Independiente Rivadavia | Fabrizio Sartori | DEL | 24 | 76 | 72 |
| Vélez Sarsfield | Facundo Sanguinetti | POR | 25 | 75 | 70 |
| Vélez Sarsfield | Thiago Silvero | DEF | 20 | 78 | 68 |
| Vélez Sarsfield | Emanuel Mammana | DEF | 30 | 73 | 72 |
| Vélez Sarsfield | Leo Cristaldo | DEF | 17 | 65 | 58 |
| Vélez Sarsfield | Simon Escobar | DEF | 17 | 75 | 61 |
| Vélez Sarsfield | Elías Gómez | DEF | 32 | 75 | 73 |
| Vélez Sarsfield | Joaquin Garcia | DEF | 25 | 77 | 71 |
| Vélez Sarsfield | Jano Gordon | DEF | 22 | 72 | 69 |
| Vélez Sarsfield | Claudio Baeza | MED | 32 | 71 | 72 |
| Vélez Sarsfield | Lucas Robertone | MED | 29 | 75 | 73 |
| Vélez Sarsfield | Rodrigo Aliendro | MED | 35 | 66 | 70 |
| Vélez Sarsfield | Manuel Lanzini | MED | 33 | 68 | 72 |
| Vélez Sarsfield | Luca Feler | MED | 18 | 69 | 63 |
| Vélez Sarsfield | Matias Arias | MED | 19 | 65 | 62 |
| Vélez Sarsfield | Juan Cruz Policella | DEL | 17 | 69 | 60 |
| Vélez Sarsfield | Matías Pellegrini | DEL | 26 | 74 | 72 |
| Vélez Sarsfield | Alex Veron | DEL | 18 | 71 | 64 |
| Vélez Sarsfield | Ronaldo Martinez | DEL | 30 | 75 | 72 |
| Vélez Sarsfield | Thiago Aguirre | DEL | 17 | 71 | 62 |
| Tigre | Bruno Leyes | MED | 25 | 74 | 73 |
| Tigre | Jabes Saralegui | MED | 23 | 76 | 71 |
| Tigre | Santiago Gonzalez | MED | 23 | 74 | 73 |
| Tigre | Nicolas Dubersarsky | MED | 21 | 71 | 68 |
| Tigre | Santiago Lopez | DEL | 20 | 75 | 70 |
| Tigre | Ian Subiabre | DEL | 19 | 74 | 67 |
| Tigre | Ignacio Russo | DEL | 25 | 76 | 73 |
| Tigre | Mauro Méndez | DEL | 27 | 74 | 72 |
| Tigre | Jerónimo Dómina | DEL | 21 | 71 | 68 |
| San Lorenzo | Teo Rodriguez | DEF | 21 | 72 | 69 |
| San Lorenzo | Ezequiel Herrera | DEF | 23 | 75 | 74 |
| San Lorenzo | Nahuel Barrios | DEF | 21 | 75 | 70 |
| San Lorenzo | Ignacio Perruzzi | MED | 25 | 75 | 74 |
| San Lorenzo | Nicolás Tripichio | MED | 30 | 75 | 74 |
| San Lorenzo | Facundo Gulli | MED | 25 | 75 | 74 |
| San Lorenzo | Facundo Farias | MED | 24 | 75 | 73 |
| San Lorenzo | Ezequiel Cerutti | DEL | 34 | 64 | 67 |
| San Lorenzo | Alexis Cuello | DEL | 26 | 74 | 72 |
| San Lorenzo | Rodrigo Auzmendi | DEL | 25 | 77 | 72 |
| San Lorenzo | Branco Salinardi | DEL | 19 | 67 | 64 |
| Talleres | Santiago Fernandez | DEF | 21 | 76 | 70 |
| Talleres | Matías Catalán | DEF | 34 | 74 | 71 |
| Talleres | Alexandro Maidana | DEF | 21 | 74 | 70 |
| Talleres | Franco Cristaldo | MED | 30 | 75 | 74 |
| Talleres | Giovanni Baroni | MED | 25 | 75 | 74 |
| Talleres | Valentín Depietri | DEL | 26 | 75 | 71 |
| Talleres | Agustin Alvarez | DEL | 25 | 75 | 72 |
| Lanús | Nahuel Losada | POR | 33 | 76 | 74 |
| Lanús | José Canale | DEF | 30 | 73 | 71 |
| Lanús | Carlos Izquierdoz | DEF | 38 | 75 | 72 |
| Lanús | Sasha Marcich | DEF | 28 | 77 | 72 |
| Lanús | Tomas Guidara | DEF | 30 | 71 | 70 |
| Lanús | Agustín Medina | MED | 20 | 75 | 70 |
| Lanús | Agustin Cardozo | MED | 29 | 75 | 72 |
| Lanús | Felipe Peña Biafore | MED | 25 | 75 | 70 |
| Lanús | Raúl Loaiza | MED | 32 | 67 | 68 |
| Lanús | Matias Sepulveda | MED | 27 | 73 | 70 |
| Lanús | Marcelino Moreno | MED | 31 | 77 | 73 |
| Lanús | Eduardo Salvio | DEL | 36 | 76 | 72 |
| Lanús | Yoshan Valois | DEL | 22 | 76 | 70 |
| Lanús | Allan Wik | DEL | 23 | 75 | 69 |
| Argentinos Juniors | Brayan Cortés | POR | 31 | 73 | 72 |
| Argentinos Juniors | Francisco Alvarez | DEF | 26 | 79 | 71 |
| Argentinos Juniors | Mateo Mendoza | DEF | 21 | 74 | 70 |
| Argentinos Juniors | Franco Vazquez | DEF | 21 | 72 | 73 |
| Argentinos Juniors | Erik Godoy | DEF | 33 | 66 | 69 |
| Argentinos Juniors | Luciano Sánchez | DEF | 32 | 74 | 73 |
| Argentinos Juniors | Kevin Gutiérrez | MED | 29 | 75 | 74 |
| Argentinos Juniors | Hernán López Muñoz | MED | 26 | 79 | 74 |
| Argentinos Juniors | Nicolás Oroz | MED | 32 | 74 | 72 |
| Argentinos Juniors | Facundo Jainikoski | DEL | 18 | 73 | 67 |
| Argentinos Juniors | Alan Alcaraz | DEL | 17 | 67 | 64 |
| Newell's Old Boys | Josué Reinatti | POR | 23 | 75 | 70 |
| Newell's Old Boys | Jeronimo Russo | DEF | 21 | 72 | 69 |
| Newell's Old Boys | Luca Regiardo | MED | 20 | 76 | 70 |
| Newell's Old Boys | Valentino Acuña | MED | 20 | 72 | 69 |
| Newell's Old Boys | Facundo Guch | MED | 19 | 75 | 65 |
| Newell's Old Boys | Jerónimo Gómez Mattar | MED | 18 | 73 | 67 |
| Newell's Old Boys | Santiago Solari | DEL | 28 | 75 | 74 |
| Newell's Old Boys | Matias Coccaro | DEL | 28 | 75 | 74 |
| Platense | Ignacio Vazquez | DEF | 29 | 74 | 73 |
| Platense | Tomas Silva | DEF | 23 | 74 | 73 |
| Platense | Maximiliano Amarfil | MED | 25 | 74 | 73 |
| Platense | Franco Zapiola | MED | 25 | 74 | 73 |
| Independiente | Santiago Mele | POR | 29 | 75 | 73 |
| Independiente | Rodrigo Rey | POR | 35 | 64 | 68 |
| Independiente | Franco Calderón | DEF | 28 | 73 | 71 |
| Independiente | Facundo Zabala | DEF | 27 | 73 | 72 |
| Independiente | Iván Marcone | MED | 36 | 76 | 72 |
| Independiente | Lautaro Millan | MED | 21 | 74 | 70 |
| Independiente | Mateo Pérez Curci | MED | 20 | 74 | 68 |
| Independiente | Luciano Cabral | MED | 31 | 69 | 72 |
| Independiente | Santiago Montiel | DEL | 25 | 75 | 73 |
| Independiente | Maximiliano Meza | DEL | 33 | 68 | 70 |
| Independiente | Ivan Morales | DEL | 27 | 73 | 71 |
| Independiente | Chimy Avila | DEL | 32 | 71 | 72 |
| Defensa y Justicia | Matias Borgogno | POR | 28 | 74 | 73 |
| Defensa y Justicia | Santiago Sosa | MED | 21 | 75 | 72 |
| Defensa y Justicia | César Pérez | MED | 23 | 76 | 72 |
| Defensa y Justicia | Ever Banega | MED | 38 | 65 | 71 |
| Defensa y Justicia | Aarón Molinas | MED | 26 | 76 | 72 |
| Defensa y Justicia | Juan Gutiérrez | DEL | 24 | 74 | 73 |
| Defensa y Justicia | Tiziano Perrotta | DEL | 19 | 74 | 67 |
| Gimnasia y Esgrima (La Plata) | Nelson Insfrán | POR | 31 | 73 | 72 |
| Gimnasia y Esgrima (La Plata) | Alexis Steimbach | DEF | 24 | 74 | 73 |
| Gimnasia y Esgrima (La Plata) | Ignacio Miramón | MED | 23 | 74 | 73 |
| Gimnasia y Esgrima (La Plata) | Marcelo Torres | DEL | 29 | 74 | 72 |
| Belgrano | Santiago Longo | MED | 28 | 74 | 72 |
| Belgrano | Adrian Sanchez | MED | 27 | 76 | 71 |
| Belgrano | Juan Velazquez | MED | 21 | 71 | 68 |
| Belgrano | Lucas Zelarayán | MED | 34 | 77 | 75 |
| Belgrano | Francisco González Metilli | MED | 29 | 74 | 73 |
| Belgrano | Ramiro Hernández | MED | 21 | 73 | 70 |
| Belgrano | Franco Vázquez | MED | 37 | 75 | 73 |
| Belgrano | Emiliano Rigoni | DEL | 33 | 69 | 70 |
| Belgrano | Nicolas Fernandez | DEL | 30 | 74 | 73 |
| Belgrano | Lucas Passerini | DEL | 32 | 70 | 71 |
| Huracán | Hernán Galíndez | POR | 39 | 75 | 72 |
| Huracán | Maximo Palazzo | DEF | 21 | 73 | 70 |
| Huracán | Leonardo Gil | MED | 35 | 75 | 70 |
| Huracán | Facundo Kalinger | MED | 21 | 71 | 68 |
| Huracán | Thaiel Peralta | MED | 18 | 70 | 66 |
| Huracán | Oscar Cortés | DEL | 22 | 75 | 70 |
| Huracán | Jordy Caicedo | DEL | 28 | 74 | 71 |
| Huracán | Ignacio Pussetto | DEL | 30 | 70 | 71 |
| Gimnasia y Esgrima (Mendoza) | Matias Vargas | DEL | 29 | 76 | 71 |
| Gimnasia y Esgrima (Mendoza) | Facundo Lencioni | DEL | 25 | 76 | 70 |
| Gimnasia y Esgrima (Mendoza) | Agustin Médica | DEL | 23 | 78 | 71 |
| Barracas Central | Juan Espinola | POR | 32 | 68 | 69 |
| Barracas Central | Kevin Jappert | DEF | 22 | 75 | 70 |
| Barracas Central | Rodrigo Insúa | DEF | 28 | 74 | 73 |
| Barracas Central | Gonzalo Maroni | MED | 27 | 74 | 72 |
| Instituto | Alex Luna | MED | 22 | 77 | 70 |
| Sarmiento | Osmar Giménez | MED | 19 | 68 | 65 |
| Sarmiento | Junior Marabel | DEL | 28 | 76 | 71 |
| Unión | Juan Pablo Ludueña | DEF | 23 | 74 | 73 |
| Unión | Lucas Ayala | DEF | 19 | 68 | 65 |
| Unión | Lautaro Vargas | DEF | 21 | 75 | 70 |
| Unión | Julian Palacios | MED | 27 | 74 | 73 |
| Unión | Mauro Luna Diale | MED | 27 | 74 | 73 |
| Unión | Ignacio Malcorra | MED | 39 | 65 | 68 |
| Unión | Franco Fragapane | DEL | 33 | 76 | 71 |
| Atlético Tucumán | Clever Ferreira | DEF | 23 | 74 | 73 |
| Atlético Tucumán | Leandro Díaz | DEL | 34 | 73 | 72 |
| Aldosivi | Nico Gaitan | MED | 38 | 63 | 67 |
