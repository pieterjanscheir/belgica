# API-referentie {#api-reference}

Alles wordt geëxporteerd vanuit de root van het package, en elke dataset heeft ook een eigen entry point:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Alleen wat je gebruikt: de rentevoeten alleen zijn maar enkele kilobytes
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | Inhoud                                                                     |
| ------------------------------ | -------------------------------------------------------------------------- |
| `belgica`                      | Alles hieronder, behalve de kantongrenzen                                  |
| `belgica/territory`            | Rechtsgebieden, arrondissementen, kantons, gemeenten, provincies, gewesten |
| `belgica/canton-boundaries`    | De geometrie van de kantons, en `findCantonsAt`                            |
| `belgica/courts`               | Hoven en rechtbanken, en de helpers voor contactgegevens                   |
| `belgica/prisons`              | Gevangenissen, en de helpers voor contactgegevens                          |
| `belgica/houses-of-justice`    | Justitiehuizen, en de helpers voor contactgegevens                         |
| `belgica/interest-rates`       | Rentevoeten                                                                |
| `belgica/postal-codes`         | Postcodes, met de gemeenten waartoe ze behoren                             |
| `belgica/data/*.json`          | De ruwe databestanden                                                      |
| `belgica/schema/*.schema.json` | [JSON Schemas](/nl/guide/schema)                                           |
| `belgica/datapackage.json`     | [Data package descriptor](/nl/guide/schema#datapackage-json)               |

Conventies:

- Opzoekingen op id geven `undefined` terug als niets overeenkomt; lijstfuncties geven een lege array terug.
- Functies gooien alleen een fout bij ongeldige invoer: een misvormde dag, of een dag vóór de
  dekking van de data (`RangeError`). Nooit voor ontbrekende data.
- Elke opzoeking neemt een optionele dag, `{ on: '2025-06-01' }` of een `Date`, en antwoordt voor
  vandaag als je er geen meegeeft. Een opzoeking op id vindt altijd een bekend record: de versie van vandaag, of de laatste
  versie van een record dat is beëindigd. Zie [tijd](#time).
- Geëxporteerde datasets zijn `readonly`: kopieer ze voor je sorteert of wijzigt (`[...courts].sort()`).
- Een opzoeking met een bekende id (een literal zoals `'gent-1'`, of een waarde met type `CantonId`) geeft het
  record zelf terug, nooit `undefined`. Elke andere string geeft `Record | undefined` terug.
  Zie [identifiers](/nl/guide/identifiers).

## Territorium {#territory}

### `getJudicialArea(id)` {#getjudicialarea-id}

```ts
function getJudicialArea(id: JudicialAreaId): JudicialArea
function getJudicialArea(id: string, options?: OnDay): JudicialArea | undefined
```

### `getArrondissement(id)` {#getarrondissement-id}

```ts
function getArrondissement(id: ArrondissementId): Arrondissement
function getArrondissement(id: string, options?: OnDay): Arrondissement | undefined
```

```ts
getArrondissement('oost-vlaanderen').name.fr // 'Flandre orientale'
```

### `getMunicipality(id)` {#getmunicipality-id}

```ts
function getMunicipality(id: MunicipalityId): Municipality
function getMunicipality(id: string, options?: OnDay): Municipality | undefined
```

```ts
getMunicipality('44021').name // { nl: 'Gent', fr: 'Gand' }
getMunicipality('44021').province // '40000'
getMunicipality('21004').province // '04000': Brussel heeft geen provincie, dit is de code van het gewest
```

### `getRegion(id)` {#getregion-id}

```ts
function getRegion(id: RegionId): Region
function getRegion(id: string, options?: OnDay): Region | undefined
```

```ts
getRegion('02000').name.fr // 'Région flamande'
```

### `getProvince(id)` {#getprovince-id}

```ts
function getProvince(id: ProvinceId): Province
function getProvince(id: string, options?: OnDay): Province | undefined
```

```ts
getProvince('40000').name.nl // 'Provincie Oost-Vlaanderen'
getProvince('40000').region // '02000'
getProvince('04000') // undefined: het Brussels Hoofdstedelijk Gewest is geen provincie
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // de versie van die dag
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: de data beschrijft 2025-01-01 en later
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

De kantons die een gemeente bestrijken op een dag, standaard vandaag. Eén kanton voor de meeste gemeenten; meerdere voor steden
die gesplitst zijn (Antwerpen, Gent, Brussel, …). Dan beslist het straatadres, en het
`territory` van elk kanton beschrijft zijn deel.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

Het gerechtelijk arrondissement waarin een gemeente ligt, op REFNIS-code. Elke gemeente ligt in
precies één arrondissement, ook een stad die over meerdere kantons gesplitst is.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

De provincie waarin een gemeente ligt, op REFNIS-code. `undefined` voor de 19 gemeenten van het
Brussels Hoofdstedelijk Gewest, dat geen provincie heeft, en voor een onbekende code.

```ts
getProvinceForMunicipality('44021')?.id // '40000'
getProvinceForMunicipality('21004') // undefined: Brussel
```

### `getRegionForMunicipality(id)` {#getregionformunicipality-id}

```ts
function getRegionForMunicipality(id: string, options?: OnDay): Region | undefined
```

```ts
getRegionForMunicipality('21004')?.name.nl // 'Brussels Hoofdstedelijk Gewest'
```

## Kantongrenzen {#canton-boundaries}

Alleen in `belgica/canton-boundaries`: de geometrie is ongeveer een miljoen posities, dus
de root van het package exporteert ze niet opnieuw (de types wel). Zie de
[datapagina](/nl/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

De kantons wiens grens een punt bevat, op een dag (standaard vandaag). Eerst de lengtegraad, dan
de breedtegraad, in decimale graden (WGS 84), zoals GeoJSON ze ordent. Eén kanton voor een punt
in België; geen buiten België; twee voor een punt op de lijn tussen twee kantons. Gooit een
`RangeError` voor coördinaten die geen eindige getallen zijn.

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']: Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []: Parijs
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## Hoven en rechtbanken {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Een rechtbank, afdeling of zetel. Ids zijn het `type` van de rechtbank gevolgd door de plaats:
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

Het vredegerecht van een kanton. Elk kanton heeft er één. Een vredegerecht dat op meerdere
plaatsen zitting houdt (Philippeville, in Couvin en Florennes) heeft geen eigen adres of
contactgegevens: zijn zetels hebben die, zie `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // het vredegerecht van Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

De afdelingen van een rechtbank, of de zetels van een vredegerecht dat op meerdere plaatsen zitting houdt, op een
dag (standaard vandaag); leeg voor een rechtbank zonder.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

De hoven en rechtbanken in wier gebied een kanton ligt op een dag (standaard vandaag): zijn vredegerecht en,
van elk ander type, de rechtbank die het bestrijkt (de rechtbank als geheel, niet haar afdelingen); in
Brussel beide taalrollen van een type. Leeg voor een onbekend kanton.

```ts
getCourtsForCanton('gent-1').map((c) => c.id)
// ['court-of-appeal-gent', 'court-of-assize-oost-vlaanderen', 'court-of-first-instance-oost-vlaanderen', …]
```

### `findCourts(filter)` {#findcourts-filter}

```ts
function findCourts(
    filter: {
        type?: CourtType
        kind?: 'court' | 'division' | 'seat'
        arrondissement?: string
        judicialArea?: string
    },
    options?: OnDay,
): Court[]
```

De hoven en rechtbanken die aan elk opgegeven filter voldoen en op een dag gelden (standaard vandaag); een leeg
filter geeft elke rechtbank van die dag terug.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // de afdelingen ervan daar
findCourts({ type: 'court-of-appeal' }) // de vijf hoven van beroep
```

### `formatCourtName(court, locale, options?)` {#formatcourtname-court-locale-options}

```ts
function formatCourtName(
    court: Court,
    locale: Locale,
    options?: { style?: 'official' | 'canton' },
): string
```

De naam van een rechtbank in één taal. `style: 'official'` (de standaard) geeft de naam zoals de
rechtbank ze publiceert, uit `name`. Een rechtbank die niet in `locale` publiceert, geeft haar
naam in een andere taal: voor Nederlands eerst Frans, dan Duits; voor Frans eerst Nederlands,
dan Duits; voor Duits eerst Frans, dan Nederlands. Elke rechtbank publiceert in haar eigen taal,
dus die krijg je.

`style: 'canton'` geeft een vredegerecht een label dat uit het nummer en de naam van zijn kanton
wordt opgebouwd, in elke taal op dezelfde manier. **Het is een label voor weergave, niet de
officiële naam van de rechtbank**: gebruik `'official'` waar de naam juridisch gewicht heeft.
Elke andere rechtbank, en een zetel van een vredegerecht, krijgt haar officiële naam, zodat een
lijst met verschillende rechtbanken één stijl kan gebruiken. Alleen de kantons Eupen-Sankt Vith
hebben een Duitse naam (uit een officiële Duitse tekst); voor de andere staat in het Duits de
naam van het kanton in de eigen taal van de rechtbank (Frans in Brussel).

```ts
const court = getCourt('justice-of-the-peace-gent-1')
formatCourtName(court, 'fr') // 'Vredegerecht Gent 1': de rechtbank publiceert alleen in het Nederlands
formatCourtName(court, 'nl', { style: 'canton' }) // 'Vredegerecht 1e kanton Gent'
formatCourtName(court, 'fr', { style: 'canton' }) // 'Justice de paix 1er canton Gand'
formatCourtName(court, 'de', { style: 'canton' }) // 'Friedensgericht 1. Kanton Gent'
formatCourtName(getCourt('justice-of-the-peace-deinze'), 'fr', { style: 'canton' }) // 'Justice de paix canton Deinze'
```

## Contactgegevens {#contacts}

In elk entry point met records die contactgegevens hebben: de root, `courts`, `prisons` en
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

De waarde van het eerste contactgegeven van dat type, optioneel met dat label (de griffie of
dienst, zoals de bron die benoemt).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Een Belgisch nummer in zijn nationale schrijfwijze. Gooit een `RangeError` voor alles wat geen
Belgisch nummer in E.164-vorm is.

```ts
formatPhoneNumber('+3292343210') // '09 234 32 10'
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatPhoneNumber('+32470123456') // '0470 12 34 56'
```

### `formatIban(iban)` {#formatiban-iban}

```ts
function formatIban(iban: string): string
```

```ts
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Gevangenissen {#prisons}

### `getPrison(id)` {#getprison-id}

```ts
function getPrison(id: PrisonId): Prison
function getPrison(id: string, options?: OnDay): Prison | undefined
```

```ts
getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
```

## Justitiehuizen {#houses-of-justice}

### `getHouseOfJustice(id)` {#gethouseofjustice-id}

```ts
function getHouseOfJustice(id: HouseOfJusticeId): HouseOfJustice
function getHouseOfJustice(id: string, options?: OnDay): HouseOfJustice | undefined
```

```ts
getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
```

## Postcodes {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Een record op id: de postcode en de REFNIS-code aan elkaar, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

De gemeenten waartoe een postcode behoort op een dag (standaard vandaag): één voor bijna elke
code; twee voor `1040`, `1050` en `1804`, waar de straat beslist. Dezelfde `Municipality`-records
als `getMunicipality` geeft. Leeg voor een onbekende code.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

De postcodes van een gemeente op een dag (standaard vandaag), op REFNIS-code, in volgorde. Leeg
voor een onbekende code.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Bevoegdheid {#jurisdiction}

Vragen die datasets combineren. Ze zitten alleen in de root van het package, omdat ze zowel het
territorium als de hoven en rechtbanken nodig hebben.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

De hoven of rechtbanken van een type die bevoegd zijn voor een gemeente op een dag (standaard vandaag), op REFNIS-code:
de rechtbanken in wier gebied, zoals de wet het vastlegt (`cantons`), een van de kantons van de gemeente ligt.
Eén rechtbank voor de meeste gemeenten; in Brussel de Nederlandstalige en de Franstalige rechtbank; voor een
stad die over kantons gesplitst is, elk vredegerecht dat een van die kantons bedient. Je krijgt de rechtbank
als geheel: welke van haar afdelingen een zaak behandelt, wordt bij koninklijk besluit bepaald en zit nog niet in de
data, dus kies zelf uit `getDivisions(court.id)`. Leeg voor een onbekende code.

```ts
findCourtsWithJurisdiction('23088', 'police-court').map((c) => c.id) // ['police-court-vilvoorde']
findCourtsWithJurisdiction('21004', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-brussel-fr', 'court-of-first-instance-brussel-nl']
findCourtsWithJurisdiction('44021', 'labour-court').map((c) => c.id) // ['labour-court-gent']
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // het kanton bestrijkt slechts een deel van de gemeente
}
```

De vredegerechten voor een gemeente op een dag (standaard vandaag): één voor de meeste gemeenten, meerdere voor een stad
die over kantons gesplitst is, waar het straatadres beslist en het `territory` van elk kanton zegt welk
deel het bestrijkt.

```ts
findJusticesOfThePeace('44088')
// [{ canton: { id: 'merelbeke-melle', … }, court: { id: 'justice-of-the-peace-merelbeke-melle', … }, partial: false }]

findJusticesOfThePeace('44021').map((c) => c.canton.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `findCourtsForPostalCode(postalCode, type)` {#findcourtsforpostalcode-postalcode-type}

```ts
function findCourtsForPostalCode(
    postalCode: string,
    type: CourtType,
    options?: OnDay,
): PostalCodeCourts[]

interface PostalCodeCourts {
    municipality: Municipality
    justicesOfThePeace: CantonCourt[] // findJusticesOfThePeace(municipality.id)
    courts: Court[] // findCourtsWithJurisdiction(municipality.id, type)
}
```

De gerechten voor een postcode op een dag (standaard vandaag), per gemeente: de postcode geeft
de gemeente ([postcodes](/nl/data/postal-codes)), de gemeente haar vredegerechten en haar
gerechten van het gevraagde type. Eén item voor bijna elke code; twee voor `1040`, `1050` en
`1804`, die bij twee gemeenten horen, zodat het antwoord nooit tot een van beide wordt herleid.
Leeg voor een onbekende code. In een stad die over kantons gesplitst is, beslist de straat nog
altijd tussen de vredegerechten, zoals bij `findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Rentevoeten {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // procent
    period: { from: string; to: string }
}
```

De rentevoet die op een dag geldt, of `null` als er voor die dag geen rentevoet bekend is. Een `Date` wordt gelezen als een
lokale kalenderdag; een string moet beginnen met een geldige `YYYY-MM-DD`-dag (een ISO-timestamp
mag, het tijdstip wordt genegeerd).

Gooit een `RangeError` voor al het andere: `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` of een
ongeldige `Date`. Een ontbrekende rentevoet is `null`; een misvormde dag is een fout, zodat je de twee niet
kunt verwarren.

`contractAfter20130316` is alleen van belang voor de interest bij handelstransacties tussen 2013 en 15 maart 2015; standaard
wordt de rentevoet voor oudere contracten gebruikt. Zie [rentevoeten](/nl/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

De laatste dag waarvoor een rentevoet bekend is, `YYYY-MM-DD`.

## Tijd {#time}

Elk record heeft een geldigheidsperiode, en elke opzoeking neemt een dag. De helpers worden
geëxporteerd voor je eigen records.

```ts
interface Validity {
    validFrom?: string // eerste dag, YYYY-MM-DD; geen: al van vóór de dekking
    validTo?: string // laatste dag; geen: geldt nog steeds
}

interface OnDay {
    on?: Date | string // standaard vandaag; een Date wordt gelezen als een lokale dag
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD', of een RangeError
```

Elke dataset zegt vanaf welke dag ze de situatie beschrijft; een opzoeking voor een vroegere dag
gooit een `RangeError` in plaats van te antwoorden met de kaart van vandaag. Het territorium en de lijst
van hoven en rechtbanken volgen uit de wet zoals gewijzigd voor 1 januari 2025; gevangenissen en
justitiehuizen zijn bekend vanaf de dag waarop hun sites voor het eerst gelezen zijn. Vroegere versies
zijn gepland ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

De geëxporteerde arrays (`courts`, `prisons`, …) bevatten elke versie van elk record. Een record dat de
bron niet langer vermeldt, wordt niet gewist: het behoudt zijn id en krijgt een `validTo`, de dag vóór de
controle die het miste. Een record dat de bron begint te vermelden, krijgt een `validFrom`.
Een opzoeking op id zonder dag geeft dus de versie van vandaag, of de laatste versie van een record dat is
beëindigd: controleer `validTo` voor je er iets neerlegt.

## Datasets {#datasets}

De volledige datasets, getypeerd:

| Export            | Type                                                 |
| ----------------- | ---------------------------------------------------- |
| `judicialAreas`   | `readonly JudicialArea[]`                            |
| `arrondissements` | `readonly Arrondissement[]`                          |
| `cantons`         | `readonly Canton[]`                                  |
| `regions`         | `readonly Region[]`                                  |
| `provinces`       | `readonly Province[]`                                |
| `municipalities`  | `readonly Municipality[]`                            |
| `courts`          | `readonly Court[]`                                   |
| `prisons`         | `readonly Prison[]`                                  |
| `housesOfJustice` | `readonly HouseOfJustice[]`                          |
| `postalCodes`     | `readonly PostalCode[]`                              |
| `interestRates`   | `Readonly<Record<InterestType, InterestRateSeries>>` |

## Types {#types}

| Type                                                                                                                                                                                                     | Beschreven op                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`: unions van de ids in de data, mee geregenereerd | [Identifiers](/nl/guide/identifiers#in-typescript)                              |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                        |                                                                                 |
| `SourceRef` = `{ url: string; retrieved: string }`: waar de data van een record vandaan komt                                                                                                             | [Datakwaliteit en actualiteit](/nl/guide/data-quality)                          |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                  |                                                                                 |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: namen zoals het Gerechtelijk Wetboek ze geeft                                                                                                              |                                                                                 |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                      | [Territorium en kantons](/nl/data/territory)                                    |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                  | [Hoven en rechtbanken](/nl/data/courts#shape)                                   |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                         | [Postcodes](/nl/data/postal-codes)                                              |
| `Prison`, `HouseOfJustice`                                                                                                                                                                               | [Gevangenissen](/nl/data/prisons), [Justitiehuizen](/nl/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                         | [Rentevoeten](/nl/data/interest-rates#shape)                                    |
