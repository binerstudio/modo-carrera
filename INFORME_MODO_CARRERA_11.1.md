# MODO CARRERA 11.1 — Paréntesis y jugadores duplicados

Fecha: 12/11/2026. Todo lo anterior se conserva.

## 1. Nombres sin paréntesis
- Cuando dos jugadores distintos se llaman igual, el juego los sigue guardando internamente como "Nombre (Club)" (así no se mezclan en el mercado ni en las partidas guardadas), pero ahora **en pantalla se muestra solo el nombre**. Archivo nuevo: `js/mc11-nombres.js`.
- "Manuel Luis Da Silva Cafumana (Show)" (Kocaelispor) pasa a llamarse "Show", como figura en la Süper Lig.

## 2. Duplicados entre ligas (verificados en la web)
| Jugador | Acción | Club que borré / cambio | Fuente |
|---|---|---|---|
| Matías Pérez (Cerro Porteño) | Borrado | Cerro Porteño | El Gráfico, 28/08/2026: Racing presentó a Matías Pérez, proveniente de Cerro Porteño |
| Lucas Beltrán (Fiorentina) | Borrado | Fiorentina | Les Nouvelles du Foot, 05/07/2026: transferencia a River Plate |
| Bautista Kociubinski (Montevideo City Torque) | Borrado | Montevideo City Torque | Soccerway/Tuttosport: vuelta del préstamo a Estudiantes (30/06/2026) |
| Matias Galarza | Borrado | Talleres | Inter Miami, 03/09/2026: llega a préstamo desde River |
| Matías Cóccaro (CF Montréal) | Borrado | CF Montréal | Wikipedia/ESPN: firmó con Newell's el 12/01/2026 |
| Renzo Malanca (Huachipato) | Borrado | Huachipato | Wikipedia/Al Aire Libre: Banfield, agosto 2026 |
| Dudu (Aris Salónica) | Borrado | Aris Salónica | Soccerway: préstamo de Aris a Akron (19/07/2026) |
| Ramon (Star City FC) | Borrado | Star City FC | UEFA/Wikipedia: Araz-Naxçıvan 2025/26 |
| Leonel González | Borrado | Universidad de Concepción | Diario Correo/RedGol: volvió a Melgar a mitad de 2026 |
| Fashion Sakala (Green Eagles) | Borrado | Green Eagles | Lusaka Times: renovó con Al-Fayha hasta 2029 |
| Fashion Sakala (Roan United) | Borrado | Roan United | Lusaka Times: renovó con Al-Fayha hasta 2029 |
| Sorriso (Santa Clara) | Borrado | Santa Clara | Soccerway/YSScores: Al-Fateh, agosto 2026 |
| Anjan Bista | Borrado | Bashundhara Kings | Wikipedia: New Road Team (2026–) |
| Anjan Bista (Church Boys United) | Borrado | Church Boys United | Wikipedia: New Road Team (2026–) |
| Anjan Bista (Manang Marshyangdi Club) | Borrado | Manang Marshyangdi Club | Wikipedia: New Road Team (2026–) |
| Anjan Bista (Shree Bhagawati Club) | Borrado | Shree Bhagawati Club | Wikipedia: New Road Team (2026–) |
| Anjan Bista (Sankata FC) | Borrado | Sankata FC | Wikipedia: New Road Team (2026–) |
| Anjan Bista (Friends Club) | Borrado | Friends Club | Wikipedia: New Road Team (2026–) |
| Mohamed Marhoon | Borrado | Al-Khaldiya SC | FotMob: Kuwait SC |
| Mohamed Marhoon (Al-Riffa SC) | Borrado | Al-Riffa SC | FotMob: Kuwait SC |
| Bakary Konaté (Usfas Bamako) | Borrado | Usfas Bamako | FotMob/Africa Soccer: Maccabi Netanya desde 02/2026 |
| Damjan Krajišnik | Borrado | Kyzylzhar | Cancha Llena: Radnički Niš 2026 |
| Miloš Drinčić (Hougang United FC) | Borrado | Hougang United FC | Soccerway: Budućnost (01/2026) |
| Taddeo Lwanga (Gor Mahia FC) | Borrado | Gor Mahia FC | Citizen Digital, 11/08/2026: fichaje de AFC Leopards |
| Taddeo Lwanga (Nairobi United) | Borrado | Nairobi United | Citizen Digital, 11/08/2026: fichaje de AFC Leopards |
| Taddeo Lwanga (Police FC) | Borrado | Police FC | Citizen Digital, 11/08/2026: fichaje de AFC Leopards |
| Geny Catamo | Borrado | União Desportiva do Songo | FotMob/Foot Mercato: Sporting CP 2026/27 |
| Toaster Nsabata (Trident FC) | Borrado | Trident FC | Zambian Football, 30/05/2026: volvió a Sekhukhune |
| Toaster Nsabata (Zanaco FC) | Borrado | Zanaco FC | Zambian Football, 30/05/2026: volvió a Sekhukhune |
| Bruce Kangwa | Borrado | Azam FC | The Herald: Caps United 2026 |
| Clatous Chama (Zanaco FC) | Borrado | Zanaco FC | FotMob/Wikipedia: Simba SC (2026–) |
| Gregorio Rodríguez (Melgar) | Borrado | Melgar | Wikipedia/TransferFeed: préstamo a Levadiakos (01/08/2026) |
| Nermin Mujkić (FK Sarajevo) | Borrado | FK Sarajevo | Wikipedia/FotMob: Al Jazira (07/2026) |
| Borja Martínez (Lee Man FC) | Borrado | Lee Man FC | Khel Now, 14/07/2026: Bengaluru FC |
| David Douděra (SK Slavia Praha) | Borrado | SK Slavia Praha | FC Cincinnati, 02/09/2026 |
| David Buchta | Borrado | FC Baník Ostrava | Wikipedia: Radnički 1923 (08/2026) |
| Václav Jurečka (Çaykur Ri̇zespor) | Borrado | Çaykur Ri̇zespor | Wikipedia: Baník Ostrava desde 02/01/2026 |
| Nathan Garrow (Auckland City) | Borrado | Auckland City | Stellenbosch FC, 14/07/2026 (Stellenbosch no está en la base; queda en Sudáfrica) |
| Boris Kopitović | Borrado | Sutjeska Nikšić | FotMob/Wikipedia: Bali United |
| Boris Kopitović | Movido | Tanjong Pagar United FC → Bali United FC | FotMob/Wikipedia: Bali United |
| Muhammad Shaban | Borrado | Ethiopia Bunna (Ethiopian Coffee) | Wikipedia: Nairobi United (08/2026) |
| Muhammad Shaban (Bul FC) | Borrado | Bul FC | Wikipedia: Nairobi United (08/2026) |
| Muhammad Shaban | Movido | Police FC → Nairobi United | Wikipedia: Nairobi United (08/2026) |
| Enock Morrison (Kataka FC) | Borrado | Kataka FC | The Star, 22/06/2026: firmó con Al-Merrikh hasta 2029 |
| Enock Morrison (Maroons FC) | Borrado | Maroons FC | The Star, 22/06/2026: firmó con Al-Merrikh hasta 2029 |
| Enock Morrison | Movido | Gor Mahia FC → Al Merrikh SC | The Star, 22/06/2026: firmó con Al-Merrikh hasta 2029 |
| Silvère Ganvoula | Borrado | Wydad Casablanca | Wikipedia/FotMob: Al-Fayha |
| Silvère Ganvoula | Movido | PAOK Salónica → Al-Fayha | Wikipedia/FotMob: Al-Fayha |
| Prince Dube | Borrado | Azam FC | The Citizen, 02/07/2026: Hardrock FC |
| Prince Dube | Movido | Manica Diamonds FC → Hardrock FC | The Citizen, 02/07/2026: Hardrock FC |
| Rohit Chand | Borrado | Bashundhara Kings | jugador de la liga de Nepal; club en Bangladesh no confirmado |
| Manish Dangi | Borrado | Bashundhara Kings | jugador de la liga de Nepal; club en Bangladesh no confirmado |

## 3. Homónimos que NO eran duplicados (verificados o con datos claramente distintos)
Tomás Silva, Tomás Pérez, Franco Torres, João Pedro, Mamadou Sangaré, Martín Fernández, João Victor, Marquinhos, Gustavo Silva, Denilson, Juan Castillo, Amadou Traoré, André Ferreira, Boubacar Traoré, Ewerton, Emmanuel Agyei, Mamadou Fofana, Janderson: son personas distintas; quedan los dos (sin paréntesis en pantalla).

## 4. Pendiente (decisión del usuario: dejar por ahora)
- Unas 700 copias dentro de ligas chicas (Bahréin, Ruanda, Zambia, Nepal, Omán, Mozambique, Uganda, Tahití, Angola…). Borrarlas deja 92 clubes con menos de 11 jugadores; se retoma junto con el punto 2 (completar planteles).
- Sin confirmar en la web: Rohit Chand y Manish Dangi (se quitó solo la copia de Bashundhara Kings), Andrew Phiri, Denis Iguma, Abdulrahman Al-Mushaifri.
- Nathan Garrow juega en Stellenbosch, que no está en la base: quedó en Sekhukhune United (Sudáfrica).

## Compatibilidad
- Versión 11.1: al abrir se crea la copia automática "Antes de actualizar a la versión 11.1".
- Partidas guardadas: el plantel propio no cambia. Si en una carrera la IA había transferido a alguna de las copias borradas, ese movimiento se pierde.
