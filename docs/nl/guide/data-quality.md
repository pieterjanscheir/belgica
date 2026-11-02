# Datakwaliteit en actualiteit {#data-quality-freshness}

Juridische referentiedata veroudert geruisloos: een nieuwe rentevoet wordt gepubliceerd, een
rechtbank verhuist, een wet voegt twee kantons samen. Deze pagina legt uit hoe het package
bijblijft, en hoe ver je elke dataset kunt vertrouwen.

## Waar elke dataset vandaan komt {#where-each-dataset-comes-from}

| Dataset                          | Bron                                           | Hoe gebouwd                                       | Verandert bij                                                     | Gecontroleerd    |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- | ---------------- |
| Rechtsgebieden, arrondissementen | Gerechtelijk Wetboek, bijlage art. 4–5         | Met de hand                                       | Een wet hertekent de gerechtelijke kaart (zelden; laatst in 2014) | Om de 24 maanden |
| Kantons                          | Gerechtelijk Wetboek, bijlage art. 1 (nl + fr) | Gegenereerd: `pnpm build:cantons`                 | Een wet wijzigt de bijlage; gemeenten fuseren                     | Om de 12 maanden |
| Kantongrenzen                    | NGI (geo.be)                                   | Twee keer per week: snapshots + `pnpm build:data` | Het NGI publiceert een nieuwe versie                              | Wekelijks        |
| Gemeenten                        | Open data van Statbel                          | Gegenereerd: `pnpm build:cantons`                 | Gemeenten fuseren (2019, 2025)                                    | Om de 12 maanden |
| Gewesten, provincies             | REFNIS-codelijst van Statbel                   | Twee keer per week: snapshots + `pnpm build:data` | Statbel wijzigt zijn register (laatst in 1995)                    | Wekelijks        |
| Hoven en rechtbanken             | tribunaux-rechtbanken.be                       | Twee keer per week: snapshots + `pnpm build:data` | Een gerecht verhuist of wijzigt zijn contactgegevens of uren      | Wekelijks        |
| Gevangenissen                    | justitie.belgium.be                            | Twee keer per week: snapshots + `pnpm build:data` | Een gevangenis opent, sluit of wijzigt haar contactgegevens       | Wekelijks        |
| Justitiehuizen                   | vlaanderen.be, maisonsdejustice.be             | Twee keer per week: snapshots + `pnpm build:data` | Een justitiehuis verhuist of wijzigt zijn contactgegevens         | Wekelijks        |
| Postcodes                        | Conversietabel van Statbel                     | Twee keer per week: snapshots + `pnpm build:data` | Statbel publiceert een nieuwe tabel (fusies, nieuwe codes)        | Wekelijks        |
| Rentevoeten                      | FOD Financiën, Belgisch Staatsblad             | Met de hand                                       | Elk jaar (wettelijk) en elk semester (handelstransacties)         | Om de 6 maanden  |

Gegenereerde datasets worden nooit met de hand bewerkt. `pnpm build:cantons` parst de officiële
tekst en weigert iets te schrijven tenzij de Nederlandse en de Franse versie overeenstemmen en
elke gemeente gedekt is; `pnpm build:data` weigert wanneer een pagina niet te plaatsen is, een
kanton geen gerecht heeft of een kanton geen grens heeft in het bestand van het NGI.

## Hoe de data wordt gebouwd {#how-the-data-is-built}

```
official site ──fetch──> snapshots (sources branch) ──parse──> data/*.json ──> pull request
```

1. **Ophalen.** Elke maandag en donderdag haalt de [sources-workflow](https://github.com/pieterjanscheir/belgica/actions/workflows/sources.yml)
   elke pagina van de bronnen op (`scripts/sources`), beleefd: één verzoek per seconde per
   site, met een user agent die het project noemt. Elke pagina wordt bewaard op de branch
   `sources`, met een index van wat is opgehaald, wanneer, en een hash van de inhoud. Een pagina
   wordt pas opnieuw opgeslagen als haar inhoud verandert, zodat de geschiedenis van de branch
   toont wat op welke dag veranderde. Een pagina die mislukt (een serverfout, een 404) behoudt
   haar laatste goede snapshot, en een walk die afbreekt (een lijstpagina die niets meer
   opsomt) laat de snapshots van zijn bron zoals ze waren. De run gaat verder met de andere
   bronnen, zodat één kapotte site niet elke update tegenhoudt: de records van de mislukte bron
   blijven zoals ze waren en worden nooit beëindigd op basis van een onvolledig beeld. De
   data-pull-request somt de mislukte bronnen op, en de run faalt zodat ook een issue het meldt.
   Een deel van een bron waarvan bekend is dat het voorlopig niet leesbaar is (de justitiehuizen
   van de Franse Gemeenschap sinds de nieuwe site van maisonsdejustice.be, [#125](https://github.com/pieterjanscheir/belgica/issues/125))
   behoudt zijn laatste snapshots zonder de run te laten falen: het staat als waarschuwing bij
   de run en in de data-pull-request. De sites worden naast elkaar opgehaald, elk nog steeds
   met één verzoek per seconde. Een pagina waar de bron niet langer naar linkt, valt weg uit
   de snapshots; haar record blijft in de data, beëindigd met een `validTo` (de dag vóór de
   controle die ze miste), zodat haar id blijft werken en een opzoeking voor een vroegere dag ze
   nog vindt. Een pagina die verschijnt, krijgt een record met een `validFrom`.
2. **Parsen.** `pnpm build:data` leest de snapshots (`scripts/parse`) en schrijft de hoven en
   rechtbanken, gevangenissen, justitiehuizen en kantongrenzen. Het rapporteert wat het niet kan
   lezen, en faalt wanneer een pagina niet te plaatsen is.
3. **Testen.** De workflow typecheckt en draait de tests op de nieuwe data.
4. **Nazicht.** Als de data veranderd is, opent of actualiseert hij één pull request met de diff
   en de lijst van onleesbare waarden. Iemand controleert die tegen de bronnen en merget ze.

Om het zelf te draaien: `pnpm fetch:sources` (schrijft `.sources/`), daarna `pnpm build:data`.

De kantons en gemeenten worden met de hand herbouwd met `pnpm build:cantons`: de site van het
Belgisch Staatsblad weigert de servers van GitHub
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

## Automatische controles {#automatic-checks}

### Bij elke wijziging (CI) {#on-every-change-ci}

- **Schemavalidatie**: elk databestand voldoet aan zijn [JSON Schema](./schema).
- **Integriteit**: ids zijn uniek en goed gevormd; elke verwijzing (arrondissement, kanton,
  gemeente, gerecht, grens) wijst naar een record dat bestaat; elk kanton heeft één grens,
  geldige GeoJSON binnen België die optelt tot de oppervlakte van het land zonder overlappingen;
  elke gemeente ligt in precies één
  kanton of is over meerdere gesplitst; elk kanton blijft binnen de provincies van zijn
  arrondissement; elk kanton heeft precies één vredegerecht; elke afdeling heeft het type en
  het gebied van haar gerecht; elke soort gerecht telt het aantal gerechten dat de wet bepaalt;
  elk kanton valt onder één gerecht van elk type (één per taal in Brussel), en de kantons van een
  gerecht liggen in zijn arrondissement en rechtsgebied.
- **Parsers**: end-to-end getest op ingekorte kopieën van echte pagina's
  (`test/fixtures/sources`), en elke lezer (telefoonnummers, IBAN's, adressen, openingsuren) op
  de vormen die in de bronnen voorkomen en op wat hij moet weigeren.
- **Rentevoeten**: periodes zijn gesorteerd, overlappen nooit en laten geen gaten; de
  wettelijke rentevoet loopt per kalenderjaar en die voor handelstransacties per semester; de
  rentevoet naar contractdatum van 2013–2015 komt alleen in dat venster voor.
- **Contactgegevens**: elk IBAN doorstaat zijn ISO 13616-checksum, telefoonnummers zijn
  Belgische E.164-nummers, e-mailadressen staan in kleine letters, en openingsuren volgen de
  `opening_hours`-syntaxis.
- **Code**: strikte TypeScript (inclusief unchecked index access en exact optional
  properties), ESLint met type-aware regels, Prettier, en 100 % testdekking van `src/`.
- **Packaging**: het gebouwde package laadt met `import` en met `require()`, vanuit elk entry
  point, op Node 22.12, 22, 24 en 26; `publint` en `arethetypeswrong` controleren de `exports`
  en de typedeclaraties.

### Elke week (gepland) {#every-week-scheduled}

De [freshness-workflow](https://github.com/pieterjanscheir/belgica/actions/workflows/freshness.yml)
draait elke maandag en opent een issue met het label
[`data-freshness`](https://github.com/pieterjanscheir/belgica/issues?q=label%3Adata-freshness)
wanneer hij iets vindt:

- **Ontbrekende rentevoeten**: geen wettelijke rentevoet of rentevoet voor handelstransacties
  voor vandaag, of geen rentevoet voor handelstransacties voor de komende twee weken (FOD
  Financiën publiceert hem vóór het semester begint).
- **Achterstallig nazicht**: de `lastReviewed`-datum van een dataset in `datapackage.json` is
  ouder dan haar `reviewEveryMonths`.
- **Dode bronnen**: een officiële bron-URL in `datapackage.json` antwoordt niet meer.

Draai ze zelf met `pnpm test:freshness` (voeg `FRESHNESS_ONLINE=1` toe om ook de URL's te
controleren).

## Hoe je een waarde leest {#how-to-read-a-value}

- **Afwezig is niet nul.** `getInterestRate` geeft `null` terug voor een dag zonder bekende
  rentevoet, in plaats van te gissen; een veld dat de bron niet geeft (het adres van een
  gerecht, machineleesbare openingsuren) ontbreekt in plaats van ingevuld te worden. Vang
  beide op.
- **Te vroeg is een fout.** Een opzoeking voor een dag vóór de dekking van een dataset gooit
  een `RangeError`: de data kan het niet zeggen, en het antwoord van vandaag zou op het juiste
  lijken.
- **Contactgegevens zijn het minst stabiel.** Telefoonnummers, e-mailadressen en openingsuren
  veranderen zonder aankondiging. Elk record zegt van welke pagina's het is gelezen en wanneer
  (`sources`); controleer de pagina van het gerecht (`website`) als het ertoe doet.
- **De wettekst wint.** Bij gesplitste gemeenten is de `territory` van het kanton de eigen
  tekst van de wet, letterlijk. Als een samenvatting, of de [grens](/nl/data/canton-boundaries) van het NGI, en de tekst van
  elkaar afwijken, heeft de tekst gelijk.

## Een fout melden {#reporting-a-mistake}

[Open een datacorrectie](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
met de id van het record en een link naar de officiële bron. Correcties verschijnen als
patch-versies.
