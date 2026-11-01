# Ontwerpkeuzes {#design-decisions}

Het package werd herontworpen vóór het zijn eerste gebruikers had, zodat elke keuze op haar
merites kon worden gemaakt in plaats van omwille van compatibiliteit. Deze pagina legt elke
beslissing vast, waarom ze genomen is en wat eruit volgt. Een nieuwe beslissing krijgt een nieuw
punt; een teruggedraaide wordt gemarkeerd, niet gewist.

## 1. De data is het product; de code is een gemak {#_1-the-data-is-the-product-the-code-is-a-convenience}

**Beslissing.** De officiële bronnen zijn de waarheid; de JSON-bestanden in `data/` worden
daaruit gebouwd en zijn het product. Ze zijn bruikbaar zonder enige TypeScript: vanuit Python,
een rekenblad (de releases bevatten CSV-tabellen) of `jq`. De structuur van elk bestand wordt één
keer gedefinieerd, door de TypeScript-types, en gepubliceerd als een daaruit gegenereerd JSON
Schema; CI faalt wanneer de types, de schema's en de data het oneens zijn. De bibliotheek voegt
types, indexen en helpers toe, en niets ervan is nodig om de data te begrijpen.

**Waarom.** Referentiedata overleeft de code eromheen, en de meeste gebruikers van Belgische
juridische data zijn geen JavaScript-projecten.

**Dus.** Elk bestand heeft een [JSON Schema](./schema) en een vermelding in `datapackage.json`
met zijn bronnen en licentie. Veldnamen en waarden worden uitgelegd in de documentatie, niet
alleen in code.

## 2. Juridische feiten zijn data, nooit berekend {#_2-legal-facts-are-data-never-computed}

**Beslissing.** Alles met juridische betekenis (de naam van een rechtbank, het grondgebied van
een kanton, een rentevoet) komt letterlijk uit een officiële bron en wordt opgeslagen. Code mag
opmaken of opzoeken; ze mag geen juridisch feit construeren.

**Waarom.** Code die een feit in elkaar zet, kan fout zijn op manieren die tests niet vangen: de
Franse namen van rechtbanken die een vroegere `formatCourtName` bouwde, waren fout
(`Tribunal de paix …`, terwijl de rechtbanken zichzelf `Justice de paix …` noemen;
[#10](https://github.com/pieterjanscheir/belgica/issues/10)). Een opgeslagen waarde kan
tegen haar bron worden gecontroleerd.

**Dus.** Namen van rechtbanken worden opgeslagen zoals elke rechtbank ze publiceert, in elke
taal waarin ze publiceert. `formatCourtName` zoekt een naam op (`style: 'official'`); de stijl
`'canton'` bouwt een label voor weergave uit het nummer en de naam van het kanton ('Vredegerecht
1e kanton Gent'), gedocumenteerd als label en nooit als de officiële naam. Het grondgebied van een kanton blijft
letterlijke wettekst, met zijn rechtsgrond als ELI-link. Waar een bron ontbreekt, ontbreekt het
veld: niets wordt op basis van giswerk ingevuld. Hetzelfde geldt voor het parsen: een tekst met
openingsuren waar een opmerking in staat, een telefoonnummer zonder zonenummer of een adres dat
als een zin is geschreven, wordt weggelaten, niet geraden.

## 3. Eén regel voor identifiers {#_3-one-identifier-rule}

**Beslissing.** Een officiële code wanneer er een is die elk record dekt, anders kebab-case in
kleine letters uit de naam in de lokale taal; rechtbanken zijn `type` + plaats. Officiële codes
die slechts sommige records dekken (ECLI, OVO) zijn velden. Zie [Identifiers](./identifiers).

## 4. Verwijzingen zijn velden {#_4-links-are-fields}

**Beslissing.** Records verwijzen naar elkaar uitsluitend via velden die het id van het andere
record bevatten, genoemd naar de dataset waarnaar ze wijzen (`arrondissement`, `canton`,
`municipality`). Geen enkel id wordt uit een ander opgebouwd.

**Waarom.** Een relatie die in een stringformaat verborgen zit, breekt geruisloos wanneer een van
beide kanten verandert. Een veld wordt gevalideerd door het schema (dat de geldige ids opsomt) en
door de tests.

**Dus.** Het adres van een gerecht, gevangenis of justitiehuis verwijst op dezelfde manier naar
zijn gemeente (`address.municipality`), via de postcode in de conversietabel van Statbel, nooit
via de plaatsnaam ([#28](https://github.com/pieterjanscheir/belgica/issues/28)); een
postcoderecord verwijst naar zijn gemeente in plaats van haar naam te kopiëren.

## 5. Canonieke waarden, presentatie in code {#_5-canonical-values-presentation-in-code}

**Beslissing.** Elke waarde wordt in één canonieke, standaardvorm opgeslagen, en opmaak voor
mensen is een functie:

| Waarde       | Opgeslagen als                  | Standaard                       |
| ------------ | ------------------------------- | ------------------------------- |
| Dag          | `2024-06-15`                    | ISO 8601                        |
| Telefoon     | `+3253820701`                   | E.164                           |
| IBAN         | `BE73679200844560`              | ISO 13616, elektronisch formaat |
| Openingsuren | `Mo-Fr 08:30-12:30,13:30-16:00` | OpenStreetMap `opening_hours`   |
| Taal         | sleutels `nl`, `fr`, `de`       | ISO 639-1                       |

**Waarom.** Eén vorm per waarde maakt waarden vergelijkbaar, valideerbaar (de IBAN-controlesom
wordt getest) en bruikbaar door andere software (`tel:`-links, betaalsystemen, parsers voor
openingsuren). Weergaveconventies verschillen per context; de data zou dat niet mogen doen.

## 6. Herkomst op elk record {#_6-provenance-on-every-record}

**Beslissing.** Elke dataset vermeldt haar bronnen, licentie en controledatum in
`datapackage.json`; elk gescrapet record vermeldt de pagina's waaruit het gelezen is en de dag
waarop hun inhoud voor het eerst gezien werd (`sources: [{ url, retrieved }]`).

**Waarom.** "Waar komt dit vandaan, en hoe oud is het?" is de eerste vraag bij juridische data.

## 7. De data wordt door machines gebouwd, uit bewaarde snapshots {#_7-the-data-is-built-by-machines-from-kept-snapshots}

**Beslissing.** Twee keer per week haalt een workflow de officiële bronnen op, bewaart de pagina's als
snapshots op de branch `sources`, bouwt de data daaruit opnieuw op met de parsers in
`scripts/parse`, test ze en opent een pull request wanneer ze veranderd is. Niets wordt met de
hand ingetypt. Een aparte wekelijkse job controleert op ontbrekende rentevoeten, achterstallige
controles en dode bronnen.

**Waarom.** Juridische data veroudert geruisloos; mensen vergeten, schema's niet. Handmatig
ingevoerde data kan niet gecontroleerd of opnieuw gedaan worden; een parser kan getest worden, en
de snapshots tonen precies wat de bron op die dag zei. De pull request houdt een mens in de lus:
de data in `main` verandert nooit zonder review.

**Dus.** Snapshots staan op hun eigen branch, zodat de geschiedenis van het package niet
verzwaard wordt met megabytes HTML. De parsers worden getest op ingekorte kopieën van echte
pagina's. Een pagina die de parser niet kan plaatsen, stopt de build in plaats van een half juist
record op te leveren. Twee bronnen weigeren de servers van GitHub (ejustice, police.be); die
worden vanaf een gewone machine opgehaald
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

## 8. Distributie: alleen ESM, Node 22.12+, gebouwd bij release {#_8-distribution-esm-only-node-22-12-built-on-release}

**Beslissing.** Het package is uitsluitend ESM, vereist Node 22.12 of later, en de build-output
wordt niet gecommit: ze wordt gebouwd en naar npm gepubliceerd door de release-workflow, met
provenance.

**Waarom.** Node 18 en 20 zijn end of life. Vanaf Node 22.12 laadt `require()` ESM, dus een
aparte CommonJS-build zou alleen een tweede kopie van de data toevoegen (de dual-package hazard)
en meer om te testen. Gecommitte build-output veroudert en brak geautomatiseerde
dependency-updates.

**Dus.** `import` en `require()` werken allebei, getest op Node 22.12, 22, 24 en 26. Elke
dataset heeft een eigen entry point, zodat een app die alleen de rentevoeten nodig heeft enkele
kilobytes laadt, niet de hoven en rechtbanken en de wettekst van elk kanton (de
[pagina Aan de slag](./getting-started#import-only-what-you-need) meet elk entry point uit de
build).

## 9. Types die de garanties van de data dragen {#_9-types-that-carry-the-data-s-guarantees}

**Beslissing.** Ids zijn gegenereerde union-types; datasets zijn `readonly`; opzoekingen met een
bekend id geven het record terug, niet `record | undefined`; gesloten vocabularia (types van
rechtbanken, soorten, contacttypes) zijn unions. Contactlabels zijn vrije tekst, zoals de
rechtbank ze publiceert: een gesloten lijst zou betekenen dat honderden namen van griffies op een
paar woorden worden afgebeeld, en dat is gissen.

**Waarom.** Fouten komen aan het licht tijdens het typen in plaats van in productie, en de types
documenteren de data.

## 10. Kwaliteitscontroles {#_10-quality-gates}

**Beslissing.** Elke wijziging doorstaat: strikte TypeScript (inclusief
`noUncheckedIndexedAccess` en `exactOptionalPropertyTypes`), ESLint met type-aware strikte
regels, Prettier, 100 % testdekking van `src/`, JSON Schema-validatie van alle data,
integriteitstests (ids, verwijzingen, aantallen, periodes), en `publint` + `arethetypeswrong` op
het ingepakte package.

**Waarom.** Een referentiepackage is het alleen waard om op te steunen als het betrouwbaarder is
dan de data met de hand overnemen.

## 11. Tijd is deel van het model {#_11-time-is-part-of-the-model}

**Beslissing.** Records dragen een geldigheidsperiode (`validFrom`, `validTo`, beide dagen
inbegrepen), elke dataset zegt vanaf welke dag ze de situatie beschrijft (`territoryCoverage`, en
`temporalCoverage` in `datapackage.json`), en opzoekingen nemen een optionele dag:
`getCanton(id, { on })`, `getCantonsForMunicipality(refnis, { on })`. Een dag vóór de dekking
gooit een `RangeError`.

**Waarom.** Juridische vragen gaan over een dag: welke rechtbank bevoegd was toen de dagvaarding
werd betekend, welke rentevoet gold toen de factuur vervallen was. Kantons, gemeenten en
rechtbanken veranderen; een model dat alleen "nu" kent, beantwoordt vragen over het verleden met
de kaart van vandaag, en ziet er daarbij juist uit. Tijd later toevoegen zou elk id en elke
opzoeking veranderen, dus zit ze in het model vóór de geschiedenis in de data zit
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

**Dus.** Rentevoeten hebben al periodes. Een opzoeking op id zonder dag geeft de versie van
vandaag, zodat bekende ids hun niet-`undefined` type behouden; met een dag kan ze niets vinden.
Elke dataset draagt de periode, niet alleen het territorium: een gescrapet record dat de bron niet
langer vermeldt, wordt beëindigd met een `validTo` in plaats van gewist (`scripts/parse/retire.ts`),
zodat een id, eenmaal gepubliceerd, blijft, en een gerecht dat sluit nog altijd het gerecht is dat
de dagvaarding van vorig jaar noemde.

## 12. Releases dragen de data, niet alleen het package {#_12-releases-carry-the-data-not-only-the-package}

**Beslissing.** Elke GitHub-release heeft de data als JSON en als CSV-tabellen, met de schema's
en `datapackage.json`, in één zip. npm is één manier om de data te krijgen, niet de enige.

**Waarom.** De mensen die Belgische juridische referentiedata het meest nodig hebben, werken in
rekenbladen en andere talen, niet in JavaScript.

## 13. Geometrie is een tweede bron, en de tekst wint {#_13-geometry-is-a-second-source-and-the-text-wins}

**Beslissing.** De kantongrenzen zijn de digitalisering door het Nationaal Geografisch Instituut
van de bijlage bij het Gerechtelijk Wetboek, genomen zoals gepubliceerd (punt voor punt, zonder
vereenvoudiging, coördinaten op een centimeter) en per naam in beide talen aan de kantons
gekoppeld, met een expliciete aliastabel voor de rest. De `territory`-tekst van het kanton blijft
de wet: waar de geometrie en de tekst van elkaar afwijken, wint de tekst. De geometrie heeft een
eigen entry point en de root van het package exporteert ze niet opnieuw.

**Waarom.** De polygonen van het NGI zijn een officiële lezing van dezelfde tekst, dus ze kunnen
worden geciteerd en herbouwd; een grens die hier uit straatdata werd afgeleid, zou een derde
lezing zijn die niemand kan controleren. Vereenvoudigen zou de lijn verschuiven, en de lijnen
tellen het meest waar kantons aan elkaar grenzen. Een miljoen posities zouden elke andere dataset
overschaduwen, dus niemand mag ze per ongeluk laden.

**Dus.** `findCantonsAt(lon, lat)` antwoordt uit de geometrie en de documentatie zegt dat; een
punt vlak bij een lijn is een geval voor de tekst. De build van de bronnen faalt wanneer een kanton
geen grens heeft of een feature bij geen enkel kanton past
([#29](https://github.com/pieterjanscheir/belgica/issues/29)).

## Nog niet beslist {#not-decided-yet}

| Vraag                                                           | Issue                                                                                   |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Geschiedenis van vóór 1 januari 2025                            | [#27](https://github.com/pieterjanscheir/belgica/issues/27)                             |
| Interestberekening over een periode (dagtelling, kapitalisatie) | Niet gepland tot de methode uit rechtspraak of officiële richtlijnen kan worden gehaald |
