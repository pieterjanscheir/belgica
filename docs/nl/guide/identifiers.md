# Identifiers {#identifiers}

Elk record heeft een `id`. Andere records, je database en je URL's verwijzen ernaar, dus een id
moet één keer juist zijn en daarna nooit meer veranderen. Deze pagina zet de regels uiteen,
waarom elke regel bestaat, en wat er gebeurt wanneer de wet verandert wat een id benoemt.

## De regels {#the-rules}

1. **Elk record heeft een veld `id`**, en dat is uniek binnen zijn dataset. Generieke code (een
   index, een cache, een formulier) behandelt elke dataset op dezelfde manier.
2. **Een officiële code wint, als ze elk record dekt.** Waar de overheid aan elk record van een
   dataset een code toekent, _is_ het id die code: gemeenten gebruiken hun REFNIS-code van
   Statbel (`44021` voor Gent). Een code die slechts sommige records dekt, wordt als veld
   bewaard: rechtbanken hebben hun ECLI-codes in `ecli`, Vlaamse justitiehuizen hun OVO-nummer in
   `ovo` (zie [waarom](#why-not-the-official-court-codes)).
3. **Anders kebab-case in kleine letters, ASCII**: `^[a-z0-9]+(-[a-z0-9]+)*$`, gebouwd door
   [`scripts/id.ts`](https://github.com/pieterjanscheir/belgica/blob/main/scripts/id.ts):
   accenten weggelaten, al het andere dat geen letter of cijfer is, wordt één koppelteken.
   `Merelbeke-Melle` → `merelbeke-melle`, `Braine-l'Alleud` → `braine-l-alleud`,
   `Liège` → `liege`.
4. **Uit de officiële naam in de lokale taal**: Nederlands in Vlaanderen, Frans in Wallonië,
   Duits rond Eupen. Brussel is officieel tweetalig en vraagt één vaste keuze: Nederlands.
5. **Een nummer is een achtervoegsel**: plaatsen met meerdere kantons krijgen `gent-1` …
   `gent-5`.
6. **Rechtbanken zijn `type` + plaats**: `justice-of-the-peace-gent-1`, `court-of-appeal-liege`.
   Een vredegerecht neemt het id van zijn kanton over. De twee rechtbanken van één type in
   Brussel, één per taal, voegen `-nl` of `-fr` toe (`police-court-brussel-fr`). Een afdeling of
   zetel voegt haar eigen plaats toe aan het id van haar rechtbank (`enterprise-court-gent-brugge`).
   Het voorvoegsel houdt ids uniek wanneer Gent een vredegerecht, een ondernemingsrechtbank en
   een arbeidsrechtbank heeft, en het is precies het `type` van het record, zodat er nooit een
   tweede vocabularium nodig is.
7. **Gevangenissen en justitiehuizen zijn hun naam** in de lokale taal, zonder lidwoorden:
   `gevangenis-gent`, `prison-lantin`, `justitiehuis-gent`, `maison-justice-arlon`. Hun naam
   zegt al wat ze zijn, en twee instellingen in één stad (de centrale en de hulpgevangenis van
   Leuven) verschillen door hun naam.
8. **Verwijzingen zijn velden, nooit afgeleide strings.** Een vredegerecht heeft een veld
   `canton`; een kanton somt `{ municipality }` op; een arrondissement heeft een `judicialArea`.
   Elk bevat het id van het record waarnaar het wijst, en het veld is genoemd naar de dataset
   waarin het wijst.

Dit alles wordt afgedwongen door tests (`test/ids.test.ts`) en door de
[JSON Schema's](./schema), die de geldige ids opsommen, zodat een losse verwijzing de validatie
doet falen.

## De ids {#the-ids}

| Dataset          | Voorbeelden                                                                                                               | Regel                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Rechtsgebieden   | `antwerpen`, `brussel`, `gent`, `liege`, `mons`                                                                           | Lokale naam            |
| Arrondissementen | `oost-vlaanderen`, `brabant-wallon`, `eupen`                                                                              | Lokale naam            |
| Kantons          | `gent-1`, `merelbeke-melle`, `wavre-1`, `oudergem`, `eupen-sankt-vith-1`                                                  | Lokale naam + nummer   |
| Kantongrenzen    | `gent-1`: één grens per kanton, met het id van het kanton, en `canton` als verwijzing                                     | Het id van het kanton  |
| Gemeenten        | `44021`, `21004`                                                                                                          | REFNIS-code            |
| Provincies       | `10000`, `40000`                                                                                                          | REFNIS-code            |
| Gewesten         | `02000`, `03000`, `04000`                                                                                                 | REFNIS-code            |
| Postcodes        | `9000-44021`, `1040-21005`                                                                                                | Postcode + REFNIS-code |
| Rechtbanken      | `justice-of-the-peace-gent-1`, `enterprise-court-gent-brugge`, `police-court-brussel-fr`, `police-court-eupen-sankt-vith` | Type + plaats          |
| Gevangenissen    | `gevangenis-gent`, `prison-lantin`, `detentiehuis-kortrijk`                                                               | Lokale naam            |
| Justitiehuizen   | `justitiehuis-gent`, `maison-justice-arlon`                                                                               | Lokale naam            |
| Rentevoeten      | `legal`, `commercial`                                                                                                     | Vaste sleutels         |

## Waarom deze keuzes {#why-these-choices}

**Waarom kebab-case?** Ids belanden in URL's (`/cantons/gent-1`), bestandsnamen, CSS-klassen,
databasesleutels en logregels. Kleine letters vermijden botsingen op hoofdletterongevoelige
systemen (de bestandssystemen van macOS en Windows, veel database-collaties): `Gent1` en `gent1`
zouden twee ids in de data zijn en één bestand op schijf. Koppeltekens houden woordgrenzen
leesbaar zonder hoofdletters, en de tekenset hoeft nergens geëscapet te worden.

**Waarom leesbare ids in plaats van nummers of UUID's?** Een referentiedataset wordt door mensen
gelezen: `justice-of-the-peace-gent-1` in een databaserij of een foutmelding zegt je wat het is.
De ids zijn even stabiel als nummers zouden zijn, want ze veranderen alleen wanneer de wet
verandert wat ze benoemen (zie hieronder), en dan is een nieuw id de juiste uitkomst.

**Waarom de lokale taal, niet het Engels?** Engelse namen bestaan voor een handvol plaatsen
(Ghent, Antwerp, Liege) en niet voor de 162 kantons, dus Engelse ids zouden twee regels
betekenen. De lokale naam is ook de naam die de instelling zelf gebruikt, en ze staat in de
officiële teksten.

**Waarom officiële codes?** REFNIS is wat Statbel, de gewesten en bijna elke Belgische dataset
gebruiken. Met de code als id heeft het koppelen van om het even welke daarvan aan kantons en
rechtbanken geen mappingtabel nodig.

**Waarom twee codes voor een postcode?** Een postcode alleen benoemt geen record: `1040` hoort
bij Brussel én bij Etterbeek, en elk paar is een eigen record met een eigen geldigheid. Het paar
officiële codes, `1040-21005`, is uniek en blijft wat het is tot de tabel van Statbel het paar
verandert, en dan is een nieuw record precies juist. De gemeente is ook een veld
(`municipality`), zoals regel 8 vraagt: de id is een sleutel, niet iets om te splitsen.

**Waarom `type` in de ids van rechtbanken?** Binnen één plaats zijn er meerdere rechtbanken, en
het aantal types zal groeien (politierechtbanken, arbeidsrechtbanken, rechtbanken van eerste
aanleg …). De eigen velden van een rechtbank zeggen wat ze is; het id hoeft alleen uniek en
herkenbaar te zijn, en het type doet beide.

**Waarom niet de officiële codes van de rechtbanken?** Rechtbanken hebben twee officiële codes,
en geen van beide dekt elke rechtbank. ECLI-codes (`HBGNT` voor het hof van beroep te Gent)
bestaan per rechtbank en per taal, niet per afdeling, en geen enkele komt voor in gepubliceerde
beslissingen van de vrederechters. Ondernemingsnummers (KBO) behoren toe aan de FOD Justitie; zijn
vestigingseenheden volgen gebouwen, niet rechtbanken, en veranderen wanneer een rechtbank
verhuist. Een regel die voor elk record opgaat, verslaat twee regels, dus de ECLI-codes zijn een
veld (`ecli`), en het id volgt regel 6.

**Waarom expliciete verwijzingen?** Het oude schema bouwde een rechtbank-id door `Vredegerecht`
en het id van het kanton aan elkaar te plakken. Dat verbergt een relatie in een stringformaat,
dat breekt zodra één rechtbank twee kantons bedient of een naam verandert. Een veld `canton`
wordt door het schema en de tests gecontroleerd, en kan in beide richtingen gevolgd worden.

## In TypeScript {#in-typescript}

Elke dataset heeft een gegenereerd id-type (`CantonId`, `CourtId`, `MunicipalityId`,
`ProvinceId`, `RegionId`, `ArrondissementId`, `JudicialAreaId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`),
opnieuw gegenereerd uit de data door `pnpm build:ids`:

```ts
import { getCanton, type CantonId } from 'belgica'

getCanton('gent-1') // Canton: een bekend id vindt altijd zijn record
getCanton(userInput) // Canton | undefined: elke andere string misschien niet

const id: CantonId = 'gent1' // compileerfout: geen kanton-id
```

Gebruik de id-types voor waarden die je opslaat, zodat een typfout of een verwijderd id gevangen
wordt wanneer je upgradet.

## Wanneer de wet een id verandert {#when-the-law-changes-an-id}

Kantons en gemeenten veranderen wel degelijk: gemeenten fuseerden in 2019 en 2025, en wetten
hertekenen kantons. Records dragen een geldigheidsperiode (`validFrom`, `validTo`), dus een
wijziging voegt geschiedenis toe in plaats van ze te wissen:

1. Het oude record blijft, met een `validTo`; het nieuwe krijgt een nieuw id en een `validFrom`.
   Een id wordt nooit hergebruikt voor iets anders, dus een id dat jaren geleden is opgeslagen,
   vindt nog steeds wat het bedoelde.
2. Zonder dag antwoorden opzoekingen voor vandaag: een opzoeking op id geeft de versie die
   vandaag geldt (de laatste, voor een record dat beëindigd is), en lijsten zoals
   `getCantonsForMunicipality` alleen wat vandaag geldt. Met `{ on }` antwoorden beide voor die
   dag.
3. Het changelog vermeldt elk nieuw id en de ids die het vervangt.

Een naamswijziging alleen, zoals een spellingcorrectie, verandert het id niet. De geschiedenis
van vóór 1 januari 2025 zit nog niet in de data
([#27](https://github.com/pieterjanscheir/belgica/issues/27)): een opzoeking voor een
eerdere dag gooit een `RangeError` in plaats van te antwoorden met de kaart van vandaag.

## Ids zijn ondoorzichtig {#ids-are-opaque}

Een id is een sleutel, geen formaat. `court-of-first-instance-luxembourg-marche-en-famenne` is
niet terug te splitsen in type, plaats en afdeling, omdat het type, de plaats en het
taalachtervoegsel allemaal hetzelfde koppelteken gebruiken. Parse ids niet: elk deel ervan is ook
een veld (`type`, `court`, `canton`, `arrondissement`), en de velden zijn wat de schema's en de
tests controleren.

## Stabiliteit {#stability}

Ids zijn publieke API. Records toevoegen is een minor-versie, een waarde corrigeren een patch, en
een id verwijderen of hernoemen een major-versie. Versie 0.3.0 vervangt de vroegere
PascalCase-ids (`VredegerechtGent1`, `EastFlanders`) door dit schema vóór het package gebruikers
had; het [changelog](./changelog) vermeldt de mapping.

De belofte wordt gecontroleerd, niet alleen gedaan. `ids.lock.json` somt elk id op dat het package
gepubliceerd heeft, per dataset; `pnpm generate` voegt er nieuwe ids aan toe en verwijdert er nooit
een, en `test/ids.test.ts` faalt wanneer een vergrendeld id in de data ontbreekt. Zo kan een scraper
die een hernoemde pagina leest, een opnieuw gegenereerde kantonlijst of een handmatige bewerking geen
id ongemerkt laten vallen of hernoemen: de data-pull-request faalt, en iemand mapt de
nieuwe naam in de parser op het bestaande id, of beëindigt het record met een `validTo`. Een id uit
de lock halen is een bewuste daad, voor een major-versie, met het id en zijn vervanger in het
changelog.
