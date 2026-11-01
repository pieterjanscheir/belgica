# Bijdragen {#contributing}

## Data bijwerken {#updating-data}

De hoven en rechtbanken, gevangenissen, justitiehuizen en kantongrenzen worden twee keer per week uit de
officiële bronnen gebouwd ([hoe](./data-quality#how-the-data-is-built)): bewerk ze niet met de hand.
Verbeter de parser in `scripts/parse`, of, als de bron zelf fout is, meld het aan het gerecht.
De data-pull-request wordt nagekeken als elke andere: vergelijk de diff met de bronnen
voor je merget.

Voor de datasets die met de hand worden bijgehouden (rechtsgebieden, arrondissementen,
rentevoeten):

1. Bewerk de JSON in `data/`. Behoud de bestaande ids: projecten slaan ze op.
2. Werk `lastReviewed` van de dataset in `datapackage.json` bij als je ze tegen haar bronnen
   hebt gecontroleerd.
3. `pnpm check`: genereert de id-types en schema's opnieuw, typecheckt, lint en controleert de
   opmaak, bouwt, draait de tests met coverage en lint het package. Het faalt als de
   gegenereerde bestanden niet gecommit zijn.
4. Voeg een regel toe aan `CHANGELOG.md` onder Unreleased, en commit (inclusief `schema/`,
   `src/ids.generated.ts` en `ids.lock.json`). De build-output (`dist/`) wordt niet gecommit: die
   wordt voor elke release gebouwd en naar npm gepubliceerd.

Een id dat gepubliceerd is, blijft: `ids.lock.json` somt ze allemaal op en de tests falen wanneer
er een in de data ontbreekt. Heeft een bron een record hernoemd, map dan de nieuwe naam in de parser
op het bestaande id; is het record beëindigd, behoud het dan met een `validTo`. Zie
[identifiers](./identifiers#stability).

### Kantons en gemeenten {#cantons-and-municipalities}

`data/cantons.json` en `data/municipalities.json` zijn gegenereerd; bewerk ze niet met de hand.
Draai `pnpm build:cantons` (heeft netwerktoegang en `unzip` nodig). Het leest:

- de bijlage bij het Gerechtelijk Wetboek, "Gebiedsomschrijving en zetel van hoven en rechtbanken"
  ([ELI, numac 1967101058](https://www.ejustice.just.fgov.be/eli/wet/1967/10/10/1967101058/justel)),
  in het Nederlands en het Frans;
- het bestand met de bevolking per gemeente van Statbel voor de huidige gemeenten en
  REFNIS-codes.

Het parst de Nederlandse en de Franse tekst afzonderlijk en weigert iets te schrijven tenzij ze
overeenstemmen en elke gemeente precies één keer gedekt is (of over meerdere kantons gesplitst).
Exoniemen die de bijlage gebruikt maar Statbel niet (`Gembloers`, `Saint-Nicolas`, …), tikfouten
in de bijlage en grensvermeldingen die het niet uit elkaar kan houden, staan bovenaan het script
opgesomd.

Draai het opnieuw nadat een wet de bijlage wijzigt of gemeenten fuseren. Kanton-ids volgen de
plaatselijke taal (Nederlands in Vlaanderen en Brussel, Frans in Wallonië, Duits rond Eupen); het
vredegerecht van kanton `x` heeft id `justice-of-the-peace-x` en verwijst ernaar via zijn veld
`canton`.

### Gescrapete datasets {#scraped-datasets}

```bash
pnpm fetch:sources            # elke bron naar .sources/ (ongeveer 20 minuten, beleefd)
pnpm fetch:sources courts     # of één bron
pnpm build:data               # herbouw de hoven en rechtbanken, gevangenissen, justitiehuizen, postcodes, gewesten en provincies uit .sources/
```

De kantongrenzen komen uit de GeoPackage van het NGI (bron `ngi`), gelezen met de eigen SQLite
van Node; als het NGI een kanton hernoemt, koppel je zijn code aan het id in `CANTON_ALIASES` in
`scripts/parse/boundaries.ts`.

Of check de laatste snapshots uit in plaats van ze op te halen:
`git worktree add .sources origin/sources`.

Een bron is een walk in `scripts/sources/catalog.ts`; een parser leest haar snapshots in
`scripts/parse`. Als een site haar opmaak wijzigt, tonen de parsertests in `test/parse` (op
ingekorte kopieën van echte pagina's in `test/fixtures/sources`) wat er brak.

### Nieuwe rentevoeten {#new-interest-rates}

- **Handelstransacties**: FOD Financiën publiceert de rentevoet per semester. Voeg een periode
  toe met `from`, `to`, `rate`, en de datum van het Staatsblad in `note`.
- **Wettelijke interest**: gepubliceerd per kalenderjaar. Voeg een periode toe voor het jaar.

## Een dataset toevoegen {#adding-a-dataset}

Elke dataset krijgt dezelfde behandeling, zodat gebruikers erop kunnen rekenen:

1. **Data**: `data/<name>.json`, een array van records. Elke waarde uit een officiële bron.
2. **Ids**: volg de [identifier-regels](./identifiers): een officiële code als die bestaat,
   anders kebab-case in kleine letters uit de naam in de plaatselijke taal (`scripts/id.ts`).
3. **Links, geen kopieën**: verwijs naar arrondissementen, kantons en gemeenten via hun id, en
   hergebruik de gedeelde types (`Translated`, `Address`, `Contact`, `SourceRef`).
4. **Bronnen**: een `sources: [{ url, retrieved }]` op elk record, en een entry in
   `datapackage.json` met de bronnen van de dataset, de licentie, `lastReviewed` en
   `reviewEveryMonths`.
5. **Types en helpers**: `src/<name>.ts`, met een eigen entry point
   in `tsup.config.ts` en in de `exports` van `package.json`. Exporteer hem alleen opnieuw uit
   `src/index.ts` als hij heel klein is ([hieronder](#keeping-the-package-light)).
6. **Schema**: voeg het bestandstype toe aan `scripts/schema-types.ts` en
   `scripts/build-schemas.ts`.
7. **Bron en parser**: een walk in `scripts/sources/catalog.ts` die de officiële pagina's
   ophaalt, en een parser in `scripts/parse` die het bestand uit de snapshots bouwt, met
   fixtures en tests. Hij leest alleen wat hij met zekerheid kan lezen en rapporteert de rest.
8. **Tests**: unieke ids, verwijzingen die oplossen, en het aantal dat de officiële bron geeft.
9. **Docs**: een pagina onder `docs/data/` met waarvoor het dient, bron en updates, en een
   veldentabel.

### Het package licht houden {#keeping-the-package-light}

Elke dataset gaat naar elke gebruiker, wat die ook importeert, dus een nieuwe dataset mag het
package niet voor iedereen groter maken:

1. **Eén dataset, één entry point.** Een eigen subpath in `tsup.config.ts` en in de `exports`
   van `package.json`. Exporteer hem alleen opnieuw uit `src/index.ts` als hij heel klein is.
2. **Grote data wordt op vraag geladen.** Boven ongeveer 500 KB splits je hem in een kleine index
   en bestanden die pas geladen worden als ze gevraagd worden, zoals `data/courts/` en
   `belgica/courts/load` (`scripts/build-data-files.ts`).
3. **Eén kopie.** Het canonieke bestand staat in `data/`; zet het niet nog eens in `dist/`.
4. **Geometrie is opt-in.** Punten en grenzen krijgen hun eigen entry point, nooit naast de
   tabeldata.
5. **Controleer de grootte.** `pnpm test:package` toont de grootte van het package en faalt boven
   de limieten in `test/smoke/package-size.mjs` (het hele package, het package zonder de grenzen,
   en elk afzonderlijk bestand buiten de grenzen), en `test/smoke/bundle-size.mjs` doet hetzelfde voor wat een
   browserapp meelevert. CI zet de cijfers in de samenvatting van de job. Verhoog een limiet
   bewust, met de reden in de changelog.

Persoonsgegevens blijven erbuiten. Een register van natuurlijke personen (individuele
gerechtsdeurwaarders, notarissen, deskundigen, bemiddelaars) verandert voortdurend en elk record
is een persoonsgegeven: link naar de officiële zoekfunctie, en houd de kantoren, de kamers en het
gebied dat ze dekken.

## Controles {#checks}

| Commando                    | Wat het doet                                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                | Alles wat CI draait: `generate`, `typecheck`, `lint`, `build`, `test:coverage`, `test:package`, `lint:package`, en een controle dat de gegenereerde bestanden gecommit zijn |
| `pnpm test`                 | Unit-, integriteits-, schema- en typetests op de broncode (geen build nodig)                                                                                                |
| `pnpm test:package`         | Smoketests van het gebouwde package met `import` en `require()`: draai eerst `pnpm build`                                                                                   |
| `pnpm test:coverage`        | Hetzelfde, maar faalt onder 100 % dekking van `src/`                                                                                                                        |
| `pnpm lint` / `pnpm format` | ESLint en Prettier: controleren / herstellen. ESLint eist ook een doc-commentaar bij elke export in `src/`                                                                  |
| `pnpm generate`             | Genereert `src/ids.generated.ts` (id-types) en `schema/` opnieuw uit de data en de types, en voegt nieuwe ids toe aan `ids.lock.json`                                       |
| `pnpm lint:package`         | `publint` en `arethetypeswrong` op het gepackte package                                                                                                                     |
| `pnpm test:freshness`       | Datumgebonden controles: ontbrekende rentevoeten, achterstallig nazicht. Geen deel van `check`; `FRESHNESS_ONLINE=1` controleert ook de bron-URL's                          |
| `pnpm fetch:sources`        | Haalt de officiële bronnen op naar `.sources/`                                                                                                                              |
| `pnpm build:data`           | Herbouwt de hoven en rechtbanken, gevangenissen, justitiehuizen, postcodes, gewesten, provincies en kantongrenzen uit `.sources/`                                           |
| `pnpm build:csv`            | Schrijft de data als CSV-tabellen naar `csv/`                                                                                                                               |

## Een release maken {#releasing}

1. Verplaats de entries onder Unreleased in `CHANGELOG.md` naar de nieuwe versie.
2. Verhoog `version` in `package.json` en commit.
3. Tag en push: `git tag v0.3.0 && git push && git push --tags`.

De release-workflow draait `pnpm check`, publiceert de tag naar npm met provenance, en maakt een
GitHub-release met de data, de schema's en de CSV-tabellen als bijlage. De tag moet overeenkomen
met `version`.

## Deze website {#this-website}

De site staat in `docs/` en wordt gebouwd met [VitePress](https://vitepress.dev). De
interactieve tabellen importeren de eigen `src/` en `data/` van het package, zodat ze altijd de
data in de repository tonen.

```bash
pnpm docs:dev      # lokale server met hot reload
pnpm docs:build    # statische site in docs/.vitepress/dist
pnpm docs:preview  # serveer de gebouwde site
```

Elke push naar `main` deployt hem naar GitHub Pages. CI bouwt hem bij elke pull request, zodat
een kapotte pagina vóór het mergen opvalt.

### Vertalingen {#translations}

De Engelse pagina's in `docs/` zijn de bron. Elke andere taal heeft dezelfde boom in een eigen
map: Nederlands (`docs/nl/`) en Frans (`docs/fr/`), en Duits, Spaans, Italiaans, Portugees,
Pools, Turks, Arabisch, Oekraïens, Chinees en Japans (`docs/de/`, `docs/es/`, enzovoort). Ze
zijn vertalingen van de Engelse pagina en worden bijgewerkt nadat die verandert. Wijzig je een
Engelse pagina, wijzig dan ook dezelfde pagina in `docs/nl/` en `docs/fr/`, of zeg in de pull
request dat de vertalingen achterlopen; de andere talen mogen een release achterlopen. De
woorden van het thema en van de interactieve componenten in die andere talen staan in
`docs/.vitepress/locales/`.

Code, ids, veldnamen en officiële namen blijven in elke taal zoals ze zijn, en elke kop behoudt
het Engelse anker (`## Kop {#english-anchor}`), zodat links tussen pagina's en de taalkeuze
blijven werken. Een Belgische instelling of juridische term houdt haar officiële Nederlandse of
Franse naam (of de Duitse, waar België er een publiceert) in plaats van een verzonnen
vertaling: een Chinese pagina zegt vredegerecht / justice de paix, geen bedacht woord ervoor.
Het changelog wordt alleen in het Engels bijgehouden.
