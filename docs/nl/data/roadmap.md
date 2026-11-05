# Roadmap {#roadmap}

Geplande datasets, met de issue die elke dataset specificeert. Elke issue somt de officiële
bronnen, de voorgestelde velden en de definitie van "klaar" op. Hulp is welkom: kies er een en
volg de [conventies](/nl/guide/contributing#adding-a-dataset).

## Rechtscolleges, diensten en personen {#courts-offices-and-people}

| Dataset                                                                                              | Waarvoor het dient                                                                                                 | Issue                                                       |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **De andere rechtscolleges**: Hof van Cassatie, Grondwettelijk Hof, Raad van State, tuchtrechtbanken | De hoogste rechtscolleges staan niet op het portaal van de hoven en rechtbanken, dus ze hebben eigen bronnen nodig | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **Het justitiehuis in Eupen** (Duitstalige Gemeenschap)                                              | Het ene justitiehuis dat de data nog niet heeft                                                                    | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Bevoegdheid per afdeling van een rechtbank**                                                       | Waar binnen een rechtbank neerleggen, en de RPR-vermelding op vennootschapsdocumenten                              | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Parketten** (parketten, arbeidsauditoraten, parketten-generaal, federaal parket)                   | Waar een strafklacht indienen, en de arbeidsauditeur in sociaalrechtelijke zaken                                   | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Kamers van gerechtsdeurwaarders** (gerechtsdeurwaarders / huissiers de justice) en hun gebied      | Welke kamer een arrondissement dekt, en een link naar haar zoekfunctie voor een gerechtsdeurwaarder                | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Kantoren van het kadaster en van de rechtszekerheid** (kadaster, vroegere hypotheekkantoren)       | Hypothecaire getuigschriften en kadastrale uittreksels aanvragen bij het bevoegde kantoor                          | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Kamers van notarissen** en hun gebied                                                              | De kamer die bevoegd is voor een onroerend goed of een klacht, en een link naar de zoekfunctie van Fednot          | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Balies** (balies / barreaux) en hun bureaus voor juridische bijstand                               | Het bureau voor juridische bijstand voor een adres, en de stafhouder voor deontologische vragen                    | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Grondgebied {#territory}

| Dataset                                                                                  | Waarvoor het dient                                                                                       | Issue                                                       |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Historiek**: wanneer kantons, gemeenten en gerechten veranderden                       | Het model heeft geldigheidsperiodes en opzoekingen per dag; de vroegere versies hebben nog de data nodig | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Vroegere gemeenten** en de fusies van 2019 en 2025                                     | Een oude REFNIS-code of naam koppelen aan de gemeente van vandaag                                        | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Deelgemeenten** (deelgemeenten / sections de commune) per postcode                     | De [postcodes](./postal-codes) stoppen bij de gemeente; adressen noemen de deelgemeente                  | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Adres → kanton** in het package zelf                                                   | De docs en de explorer geocoderen een adres al; het package nog niet                                     | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Taalgebieden en taalfaciliteiten** per gemeente (taalgebieden / faciliteitengemeenten) | De taal van de rechtspleging en van de stukken die er betekend worden                                    | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Bedragen, tarieven en kalenders {#amounts-rates-and-calendars}

| Dataset                                                                                 | Waarvoor het dient                                                                              | Issue                                                       |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Rolrechten** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe) | Kostenramingen en elektronische neerlegging; het recht hangt af van de datum van neerlegging    | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Bedragsdrempels voor bevoegdheid en hoger beroep** (art. 590, 617 Ger.W.)             | Welke rechter een vordering behandelt, en of tegen zijn vonnis hoger beroep openstaat           | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Gerechtelijk verlof en feestdagen**                                                   | Proceduretermijnen berekenen                                                                    | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **Gezondheidsindex** (gezondheidsindex / indice santé) per maand                        | Indexering van huurprijzen en onderhoudsgelden                                                  | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Schadebedingen en interestplafonds voor consumentenschulden** (Boek XIX WER / CDE)    | Wat aangerekend mag worden aan een consument die te laat betaalt                                | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Beslagbare bedragen** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.) | Hoeveel van een loon of uitkering in beslag genomen kan worden, elk jaar geïndexeerd            | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Fiscale rentevoeten**: nalatigheids- en moratoriuminteresten                          | Interesten in fiscale geschillen, naast de [wettelijke en handelsrentevoeten](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Waarom sommige datasets er nog niet zijn {#why-some-datasets-aren-t-here-yet}

Een juridische dataset is alleen nuttig als elke waarde uit een officiële bron komt, dus wordt
niets uit het hoofd met de hand toegevoegd. Elke dataset wordt door een script gebouwd uit
snapshots van zijn bron, en de meeste bronnen worden twee keer per week door GitHub Actions opgehaald.
Twee kunnen dat voorlopig niet: de site van het Belgisch Staatsblad (ejustice), waar de kantons
uit komen, en police.be weigeren allebei verbindingen van de servers van GitHub; ze worden in
de plaats daarvan vanaf een gewone machine opgehaald
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

Registers van individuele personen (gerechtsdeurwaarders, notarissen, gerechtsdeskundigen,
bemiddelaars) zijn niet gepland: ze veranderen voortdurend en elk record is een persoonsgegeven.
De docs linken daarom naar de officiële zoekfunctie, en de data houdt de kamers en het gebied dat
ze dekken.
