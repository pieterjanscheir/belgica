# Roadmap {#roadmap}

Geplante Datensätze, jeweils mit dem Issue, das sie beschreibt. Jedes Issue nennt die amtlichen
Quellen, die vorgeschlagenen Felder und was „fertig“ bedeutet. Hilfe ist willkommen: Wählen Sie
eines aus und folgen Sie den [Konventionen](/de/guide/contributing#adding-a-dataset).

## Gerichte, Dienststellen und Personen {#courts-offices-and-people}

| Datensatz                                                                                                 | Wozu er dient                                                                                                                        | Issue                                                       |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Die übrigen Gerichte**: Kassationshof, Verfassungsgerichtshof, Staatsrat, Disziplinargerichte           | Die höchsten Gerichte stehen nicht auf dem Portal der Gerichte und brauchen daher eigene Quellen                                     | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **Das Justizhaus in Eupen** (Deutschsprachige Gemeinschaft)                                               | Das einzige Justizhaus, das noch nicht in den Daten ist                                                                              | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Zuständigkeit pro Abteilung eines Gerichts** (afdelingen / divisions)                                   | Wo innerhalb eines Gerichts einzureichen ist, und die Angabe des RJP (RPR / RPM) auf Gesellschaftsdokumenten                         | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Staatsanwaltschaften** (parketten, arbeidsauditoraten, parketten-generaal, Föderale Staatsanwaltschaft) | Wo eine Strafanzeige zu erstatten ist, und der Arbeitsauditor in sozialrechtlichen Sachen                                            | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Gerichtsvollzieher-Kanzleien** (gerechtsdeurwaarders / huissiers de justice)                            | Einen Gerichtsvollzieher in einem Gerichtsbezirk für Zustellung oder Vollstreckung finden                                            | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Kataster- und Rechtssicherheitsämter** (kadaster, ehemalige hypotheekkantoren)                          | Hypothekenbescheinigungen und Katasterauszüge beim zuständigen Amt anfordern                                                         | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Notare und Notarkammern**                                                                               | Einen Notar finden, und die für eine Beschwerde zuständige Kammer                                                                    | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Rechtsanwaltskammern** (balies / barreaux) und ihre Büros für juristischen Beistand                     | Das Büro für juristischen Beistand für eine Adresse, und der Präsident der Rechtsanwaltskammer (bâtonnier) für deontologische Fragen | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Gebiet {#territory}

| Datensatz                                                                                       | Wozu er dient                                                                                                                   | Issue                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Historie**: wann sich Kantone, Gemeinden und Gerichte geändert haben                          | Das Modell hat Gültigkeitszeiträume und Nachschlagen pro Tag; für die früheren Versionen fehlen noch die Daten                  | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Ehemalige Gemeinden** und die Fusionen von 2019 und 2025                                      | Einen alten REFNIS-Code oder Namen der heutigen Gemeinde zuordnen                                                               | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Teilgemeinden** (deelgemeenten / sections de commune) pro Postleitzahl                        | Die [Postleitzahlen](./postal-codes) enden bei der Gemeinde; Adressen nennen die Ortschaft                                      | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Adresse → Kanton** mit BeST Address                                                           | Die [Kantonsgrenzen](./canton-boundaries) finden den Kanton eines Punktes; das Geocodieren der Adresse ist der fehlende Schritt | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Sprachgebiete und Spracherleichterungen** pro Gemeinde (taalgebieden / faciliteitengemeenten) | Die Sprache des Verfahrens und der dort zugestellten Schriftstücke                                                              | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Beträge, Sätze und Kalender {#amounts-rates-and-calendars}

| Datensatz                                                                                     | Wozu er dient                                                                                                | Issue                                                       |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Gerichtsgebühren** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe) | Kostenschätzungen und elektronische Einreichung; die Gebühr hängt vom Einreichungsdatum ab                   | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Betragsschwellen für Zuständigkeit und Berufung** (art. 590, 617 Ger.W.)                    | Welches Gericht über eine Forderung entscheidet, und ob gegen sein Urteil Berufung möglich ist               | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Gerichtsferien und gesetzliche Feiertage**                                                  | Berechnung von Verfahrensfristen                                                                             | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **Gesundheitsindex** (gezondheidsindex / indice santé) pro Monat                              | Indexierung von Mieten und Unterhaltszahlungen                                                               | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Schadensersatz- und Zinsobergrenzen für Verbraucherschulden** (Buch XIX WER / CDE)          | Was einem Verbraucher, der zu spät zahlt, berechnet werden darf                                              | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Pfändungsgrenzen** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.)          | Wie viel von einem Lohn oder einer Leistung gepfändet werden kann, jährlich indexiert                        | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Steuerliche Zinssätze**: Verzugs- und Vergütungszinsen                                      | Zinsen in Steuerstreitigkeiten, neben den [gesetzlichen und handelsrechtlichen Zinssätzen](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Warum manche Datensätze noch fehlen {#why-some-datasets-aren-t-here-yet}

Ein juristischer Datensatz ist nur nützlich, wenn jeder Wert aus einer amtlichen Quelle stammt;
deshalb wird nichts aus dem Gedächtnis von Hand hinzugefügt. Jeder Datensatz wird von einem Skript
aus Snapshots seiner Quelle gebaut, und die meisten Quellen werden jede Woche von GitHub Actions
abgerufen. Zwei können das vorerst nicht: Die Website des Belgischen Staatsblatts (ejustice), aus
der die Kantone stammen, und police.be verweigern beide Verbindungen von den Servern von GitHub;
sie werden stattdessen von einem gewöhnlichen Rechner abgerufen
([#52](https://github.com/pieterjanscheir/belgica/issues/52)). Das Verzeichnis der
Gerichtsvollzieher wird im Browser aufgebaut; zum Lesen braucht es also einen Browser oder die
Daten der Nationalen Kammer der Gerichtsvollzieher
([#6](https://github.com/pieterjanscheir/belgica/issues/6)).
