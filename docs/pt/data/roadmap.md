# Roadmap {#roadmap}

Os conjuntos de dados previstos, com a issue que especifica cada um. Cada issue lista as fontes
oficiais, os campos propostos e o que significa "concluído". A ajuda é bem-vinda: escolha um e
siga as [convenções](/pt/guide/contributing#adding-a-dataset).

## Tribunais, repartições e pessoas {#courts-offices-and-people}

| Conjunto de dados                                                                                                                                                    | Para que serve                                                                                        | Issue                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Os outros tribunais**: Hof van Cassatie / Cour de cassation, Grondwettelijk Hof / Cour constitutionnelle, Raad van State / Conseil d'État, tribunais disciplinares | Os tribunais superiores não estão no portal dos tribunais, por isso precisam das suas próprias fontes | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **A maison de justice / Justizhaus de Eupen** (Comunidade germanófona)                                                                                               | A única maison de justice que os dados ainda não têm                                                  | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Competência por divisão de tribunal** (afdelingen / divisions)                                                                                                     | Onde apresentar dentro de um tribunal, e a menção RPR / RPM nos documentos das empresas               | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Ministério público** (parketten / parquets, arbeidsauditoraten / auditorats du travail, parketten-generaal, procurador federal)                                    | Onde apresentar uma queixa-crime, e o auditor do trabalho nos processos de direito social             | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Escritórios de oficiais de justiça** (gerechtsdeurwaarders / huissiers de justice)                                                                                 | Encontrar um oficial de justiça num arrondissement para citações ou execuções                         | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Zonas de polícia** (politiezones / zones de police)                                                                                                                | Que zona trata de um município: queixas, cópias de autos                                              | [#7](https://github.com/pieterjanscheir/belgica/issues/7)   |
| **Repartições do cadastro e da segurança jurídica** (kadaster, antigos hypotheekkantoren)                                                                            | Pedir certidões hipotecárias e extratos cadastrais à repartição competente                            | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Notários e câmaras notariais**                                                                                                                                     | Encontrar um notário, e a câmara competente para uma reclamação                                       | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Ordens de advogados** (balies / barreaux) e os seus gabinetes de apoio judiciário                                                                                  | O gabinete de apoio judiciário de uma morada, e o bâtonnier para questões deontológicas               | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Território {#territory}

| Conjunto de dados                                                                                        | Para que serve                                                                                                              | Issue                                                       |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Histórico**: quando mudaram cantões, municípios e tribunais                                            | O modelo tem períodos de validade e pesquisas por dia; as versões anteriores ainda precisam dos dados                       | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Antigos municípios** e as fusões de 2019 e 2025                                                        | Converter um código REFNIS ou nome antigo no município atual                                                                | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Subdivisões dos municípios** (deelgemeenten / sections de commune) por código postal                   | Os [códigos postais](./postal-codes) param no município; as moradas indicam a localidade                                    | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Morada → cantão** com BeST Address                                                                     | Os [limites dos cantões](./canton-boundaries) encontram o cantão de um ponto; a geocodificação da morada é o passo em falta | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Regiões linguísticas e facilidades linguísticas** por município (taalgebieden / faciliteitengemeenten) | A língua do processo e dos atos aí notificados                                                                              | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Montantes, taxas e calendários {#amounts-rates-and-calendars}

| Conjunto de dados                                                                             | Para que serve                                                                         | Issue                                                       |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Custas judiciais** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe) | Estimativas de custos e entrega eletrónica; a taxa depende da data de entrada          | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Indemnização processual** (rechtsplegingsvergoeding / indemnité de procédure)               | Os escalões e a sua indexação, para cada estimativa de custos e cada sentença          | [#60](https://github.com/pieterjanscheir/belgica/issues/60) |
| **Limiares de valor para a competência e o recurso** (art. 590, 617 Ger.W.)                   | Que tribunal julga uma ação, e se a sua sentença admite recurso                        | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Férias judiciais e feriados**                                                               | Calcular prazos processuais                                                            | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **Índice de saúde** (gezondheidsindex / indice santé) por mês                                 | A indexação das rendas e das pensões de alimentos                                      | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Limites de indemnizações e juros para dívidas de consumidores** (Livro XIX WER / CDE)       | O que se pode cobrar a um consumidor que paga com atraso                               | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Limites de penhora** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.)        | Quanto de um salário ou de uma prestação pode ser penhorado, indexado todos os anos    | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Taxas de juro fiscais**: juros de mora do contribuinte e juros moratórios a cargo do Estado | Os juros nos litígios fiscais, ao lado das [taxas legal e comercial](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Porque é que alguns conjuntos de dados ainda não estão aqui {#why-some-datasets-aren-t-here-yet}

Um conjunto de dados jurídicos só é útil se cada valor vier de uma fonte oficial, por isso nada
é acrescentado à mão de memória. Cada conjunto de dados é construído por um script a partir de
snapshots da sua fonte, e a maioria das fontes é obtida todas as semanas pelo GitHub Actions.
Duas não podem sê-lo, por agora: o site do Belgisch Staatsblad / Moniteur belge (ejustice), de
onde vêm os cantões, e o police.be recusam ambos ligações dos servidores do GitHub; são obtidos a
partir de uma máquina normal ([#52](https://github.com/pieterjanscheir/belgica/issues/52)). O
diretório dos oficiais de justiça é construído no browser, por isso precisa de um browser para
ser lido, ou dos dados da Nationale Kamer van Gerechtsdeurwaarders / Chambre nationale des
huissiers de justice ([#6](https://github.com/pieterjanscheir/belgica/issues/6)).
