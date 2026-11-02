# Hoja de ruta {#roadmap}

Conjuntos de datos previstos, con el issue que especifica cada uno. Cada issue enumera las
fuentes oficiales, los campos propuestos y qué significa "terminado". Toda ayuda es bienvenida:
elige uno y sigue las [convenciones](/es/guide/contributing#adding-a-dataset).

## Tribunales, oficinas y personas {#courts-offices-and-people}

| Conjunto de datos                                                                                                                                                       | Para qué sirve                                                                                           | Issue                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Los demás tribunales**: Cour de cassation / Hof van Cassatie, Cour constitutionnelle / Grondwettelijk Hof, Conseil d'État / Raad van State, tribunales disciplinarios | Los tribunales superiores no están en el portal de los tribunales, así que necesitan sus propias fuentes | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **La maison de justice / Justizhaus de Eupen** (Comunidad germanófona)                                                                                                  | La única maison de justice que los datos aún no tienen                                                   | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Competencia por división de tribunal** (afdelingen / divisions)                                                                                                       | Dónde presentar dentro de un tribunal, y la mención RPR / RPM en los documentos de las empresas          | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Fiscalías** (parketten, arbeidsauditoraten, parketten-generaal, fiscalía federal)                                                                                     | Dónde presentar una denuncia penal, y el auditor laboral en los asuntos de derecho social                | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Oficinas de huissiers de justice** (gerechtsdeurwaarders, los agentes judiciales de notificación y ejecución)                                                         | Encontrar un huissier de justice en un distrito judicial para una notificación o una ejecución           | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Oficinas del catastro y de seguridad jurídica** (kadaster, antiguos hypotheekkantoren)                                                                                | Pedir certificados hipotecarios y extractos catastrales a la oficina competente                          | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Notarios y cámaras de notarios**                                                                                                                                      | Encontrar un notario, y la cámara competente para una queja                                              | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Colegios de abogados** (balies / barreaux) y sus oficinas de asistencia jurídica                                                                                      | La oficina de asistencia jurídica de una dirección, y el bâtonnier para las cuestiones deontológicas     | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Territorio {#territory}

| Conjunto de datos                                                                                         | Para qué sirve                                                                                                                      | Issue                                                       |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Historia**: cuándo cambiaron los cantones, los municipios y los tribunales                              | El modelo tiene periodos de validez y búsquedas por día; a las versiones anteriores aún les faltan los datos                        | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Antiguos municipios** y las fusiones de 2019 y 2025                                                     | Relacionar un código REFNIS o un nombre antiguo con el municipio actual                                                             | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Secciones de municipio** (deelgemeenten / sections de commune) por código postal                        | Los [códigos postales](./postal-codes) se detienen en el municipio; las direcciones nombran la localidad                            | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Dirección → cantón** con BeST Address                                                                   | Los [límites de los cantones](./canton-boundaries) encuentran el cantón de un punto; geocodificar la dirección es el paso que falta | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Regiones lingüísticas y facilidades lingüísticas** por municipio (taalgebieden / faciliteitengemeenten) | La lengua del procedimiento y de los documentos que se notifican allí                                                               | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Importes, tipos y calendarios {#amounts-rates-and-calendars}

| Conjunto de datos                                                                                              | Para qué sirve                                                                                  | Issue                                                       |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Tasas judiciales** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe)                  | Estimaciones de costes y presentación electrónica; la tasa depende de la fecha de presentación  | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Indemnización procesal** (rechtsplegingsvergoeding / indemnité de procédure)                                 | Los tramos y su indexación, para cada estimación de costes y cada sentencia                     | [#60](https://github.com/pieterjanscheir/belgica/issues/60) |
| **Umbrales de cuantía para la competencia y la apelación** (art. 590, 617 Ger.W.)                              | Qué tribunal conoce de una demanda, y si su sentencia es apelable                               | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Vacaciones judiciales y días festivos**                                                                      | Calcular los plazos procesales                                                                  | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **Índice de salud** (gezondheidsindex / indice santé) por mes                                                  | La indexación de los alquileres y de las pensiones alimenticias                                 | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Límites de daños e intereses para las deudas de consumidores** (Libro XIX WER / CDE)                         | Qué se puede cobrar a un consumidor que paga con retraso                                        | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Límites de embargo** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.)                         | Cuánto de un salario o de una prestación se puede embargar, indexado cada año                   | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Tipos de interés fiscales**: intereses de demora del contribuyente e intereses moratorios a cargo del Estado | Los intereses en los litigios fiscales, junto a los [tipos legal y comercial](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Por qué algunos conjuntos de datos aún no están aquí {#why-some-datasets-aren-t-here-yet}

Un conjunto de datos jurídico solo es útil si cada valor procede de una fuente oficial, así que
nada se añade a mano de memoria. Cada conjunto de datos lo construye un script a partir de
capturas de su fuente, y la mayoría de las fuentes las descarga cada semana GitHub Actions. Dos no
pueden, por ahora: el sitio del Moniteur belge / Belgisch Staatsblad (ejustice), de donde
proceden los cantones, y police.be rechazan ambos las conexiones desde los servidores de GitHub;
se descargan en cambio desde una máquina normal
([#52](https://github.com/pieterjanscheir/belgica/issues/52)). El directorio de los huissiers de
justice se construye en el navegador, así que hace falta un navegador para leerlo, o los datos de
la Chambre nationale des huissiers de justice
([#6](https://github.com/pieterjanscheir/belgica/issues/6)).
