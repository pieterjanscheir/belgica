# Roadmap {#roadmap}

Dataset previsti, con la issue che specifica ciascuno di essi. Ogni issue elenca le fonti
ufficiali, i campi proposti e che cosa significa "fatto". L'aiuto è benvenuto: scegline uno e
segui le [convenzioni](/it/guide/contributing#adding-a-dataset).

## Tribunali, uffici e persone {#courts-offices-and-people}

| Dataset                                                                                                                                                                | Perché è utile                                                                                   | Issue                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Le altre giurisdizioni**: Hof van Cassatie / Cour de cassation, Grondwettelijk Hof / Cour constitutionnelle, Raad van State / Conseil d'État, tribunali disciplinari | Le giurisdizioni supreme non sono sul portale dei tribunali, quindi servono fonti proprie        | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **La justitiehuis / maison de justice di Eupen** (Comunità germanofona)                                                                                                | L'unica sede che i dati non hanno ancora                                                         | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Competenza per sezione di tribunale** (afdelingen / divisions)                                                                                                       | Dove depositare all'interno di un tribunale, e la menzione RPR / RPM sui documenti delle imprese | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Procure** (parketten, arbeidsauditoraten, parketten-generaal, procura federale)                                                                                      | Dove presentare una denuncia penale, e l'auditorato del lavoro nelle cause di diritto sociale    | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Uffici degli ufficiali giudiziari** (gerechtsdeurwaarders / huissiers de justice)                                                                                    | Trovare un ufficiale giudiziario in un arrondissement per notifiche o esecuzioni                 | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Uffici del catasto e della sicurezza giuridica** (kadaster, ex hypotheekkantoren)                                                                                    | Richiedere certificati ipotecari ed estratti catastali all'ufficio competente                    | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Notai e camere notarili**                                                                                                                                            | Trovare un notaio, e la camera competente per un reclamo                                         | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Ordini degli avvocati** (balies / barreaux) e i loro uffici di assistenza legale                                                                                     | L'ufficio di assistenza legale per un indirizzo, e il bâtonnier per le questioni deontologiche   | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Territorio {#territory}

| Dataset                                                                                                 | Perché è utile                                                                                                                     | Issue                                                       |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Storia**: quando sono cambiati cantoni, comuni e tribunali                                            | Il modello ha periodi di validità e ricerche per giorno; mancano ancora i dati delle versioni precedenti                           | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Ex comuni** e le fusioni del 2019 e del 2025                                                          | Ricondurre un vecchio codice REFNIS o nome al comune di oggi                                                                       | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Frazioni** (deelgemeenten / sections de commune) per codice postale                                   | I [codici postali](./postal-codes) si fermano al comune; gli indirizzi nominano la località                                        | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Indirizzo → cantone** con BeST Address                                                                | I [confini dei cantoni](./canton-boundaries) trovano il cantone di un punto; la geocodifica dell'indirizzo è il passaggio mancante | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Regioni linguistiche e facilitazioni linguistiche** per comune (taalgebieden / faciliteitengemeenten) | La lingua del procedimento e degli atti notificati lì                                                                              | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Importi, tassi e calendari {#amounts-rates-and-calendars}

| Dataset                                                                                                   | Perché è utile                                                                                         | Issue                                                       |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Diritti di cancelleria** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe)       | Stime dei costi e deposito telematico; il diritto dipende dalla data di deposito                       | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Soglie di valore per la competenza e l'appello** (art. 590, 617 Ger.W.)                                 | Quale tribunale è competente per una domanda, e se la sua sentenza è appellabile                       | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Ferie giudiziarie e giorni festivi**                                                                    | Calcolare i termini processuali                                                                        | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **Indice sanitario** (gezondheidsindex / indice santé) per mese                                           | L'indicizzazione degli affitti e degli assegni di mantenimento                                         | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Limiti a risarcimenti e interessi per i debiti dei consumatori** (Libro XIX WER / CDE)                  | Che cosa si può addebitare a un consumatore che paga in ritardo                                        | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Limiti di pignorabilità** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.)               | Quanto di uno stipendio o di una prestazione può essere pignorato, indicizzato ogni anno               | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Tassi d'interesse fiscali**: interessi di mora del contribuente e interessi moratori dovuti dallo Stato | Gli interessi nelle controversie tributarie, accanto ai [tassi legale e commerciale](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Perché alcuni dataset non ci sono ancora {#why-some-datasets-aren-t-here-yet}

Un dataset giuridico è utile solo se ogni valore proviene da una fonte ufficiale, quindi nulla
viene aggiunto a mano a memoria. Ogni dataset è costruito da uno script a partire dagli snapshot
della sua fonte, e la maggior parte delle fonti viene scaricata ogni settimana da GitHub Actions.
Due, per ora, non possono esserlo: il sito del Belgisch Staatsblad / Moniteur belge (ejustice),
da cui provengono i cantoni, e police.be rifiutano entrambi le connessioni dai server di GitHub;
vengono invece scaricati da una macchina normale
([#52](https://github.com/pieterjanscheir/belgica/issues/52)). L'elenco degli ufficiali
giudiziari è costruito nel browser, quindi per leggerlo serve un browser, oppure i dati della
Nationale Kamer van Gerechtsdeurwaarders / Chambre nationale des huissiers de justice
([#6](https://github.com/pieterjanscheir/belgica/issues/6)).
