# API reference

Every function and constant of the npm package, by dataset. Each entry gives the signature, what
it returns, when it throws, and an example. The [Python package](/guide/python) has the same
functions in snake case. To find the function for a question, start with
[which function?](/guide/common-tasks#which-function)

## Conventions

These hold for every function below, and the entries don't repeat them.

- **Days.** A day is a `Date`, read as a local calendar day, or a string that starts with
  `YYYY-MM-DD`. Anything else throws a `RangeError`. Days are returned as `YYYY-MM-DD`.
- **`on`.** Every lookup takes an optional last argument `{ on }`, the day to answer for, and
  answers for today without it. A day before the dataset's [coverage](#time) throws a
  `RangeError`.
- **Lookups by id.** A `get…` function returns `undefined` for an id that isn't in the data.
  With a known id (a literal like `'gent-1'`, or a value typed `CantonId`) it returns the record,
  and its type says so. Without `on` it always finds a known record: today's version, or the last
  version of one that has ended.
- **Lists.** A function that returns an array returns `[]` when nothing matches, never
  `undefined`, and only the records that apply on the day.
- **Errors.** Functions throw only for invalid input, never because data is missing.
- **Read-only.** Records and arrays are shared and typed `readonly`. Copy before you change
  them.

[Core concepts](/guide/concepts) explains the reasons.

## Entry points

The package root exports everything except the boundaries and the court locations. Each dataset
also has its own entry point, so an app loads only what it uses.
[Entry points and bundle size](/guide/entry-points) has the measured sizes.

| Entry point                         | Contents                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `belgica`                           | Everything below, except the boundaries and the court locations                 |
| `belgica/territory`                 | Judicial areas, arrondissements, cantons, municipalities, provinces, regions    |
| `belgica/cantons`                   | [The cantons without their `territory` texts](#cantons-without-their-territory) |
| `belgica/cantons/territory`         | `getCantonTerritory`: the texts alone                                           |
| `belgica/courts`                    | Courts, and the contact helpers                                                 |
| `belgica/courts/format`             | `formatCourtName` and the contact helpers, without any data                     |
| `belgica/courts/load`               | [Loading court files on demand](#loading-courts-on-demand)                      |
| `belgica/prisons`                   | Prisons, and the contact helpers                                                |
| `belgica/houses-of-justice`         | Houses of justice, and the contact helpers                                      |
| `belgica/postal-codes`              | Postal codes                                                                    |
| `belgica/police-zones`              | [Police zones](#police-zones), only here: not in the root                       |
| `belgica/interest-rates`            | Interest rates                                                                  |
| `belgica/calendar`                  | Public and judicial holidays                                                    |
| `belgica/canton-boundaries`         | The cantons' geometry, and `findCantonsAt`                                      |
| `belgica/arrondissement-boundaries` | The arrondissements' geometry, and `findArrondissementsAt`                      |
| `belgica/court-locations`           | The justices of the peace as points on a map                                    |
| `belgica/schemas`                   | [Zod schemas](/guide/schema#zod-schemas) for every record and data file         |
| `belgica/data/*`                    | The raw data files, including the [split ones](/guide/raw-json#files)           |
| `belgica/schema/*.schema.json`      | [JSON Schemas](/guide/schema)                                                   |
| `belgica/datapackage.json`          | The [data package descriptor](/guide/schema#datapackage-json)                   |

The jurisdiction functions (`findJusticesOfThePeace`, `findCourtsWithJurisdiction`,
`findCourtsForPostalCode`) combine the territory and the courts, and are only in the root.

## Territory

From `belgica/territory` and the root. See [territory and cantons](/data/territory) for the
records.

### `getJudicialArea` {#getjudicialarea}

```ts
function getJudicialArea(id: JudicialAreaId): JudicialArea
function getJudicialArea(id: string, options?: OnDay): JudicialArea | undefined
```

A judicial area, the area of one court of appeal, by id.

```ts
getJudicialArea('gent').name.fr // 'Gand'
```

### `getArrondissement` {#getarrondissement}

```ts
function getArrondissement(id: ArrondissementId): Arrondissement
function getArrondissement(id: string, options?: OnDay): Arrondissement | undefined
```

A judicial arrondissement by id.

```ts
getArrondissement('oost-vlaanderen').name.fr // 'Flandre orientale'
```

### `getCanton` {#getcanton}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

A judicial canton by id, with the law's description of its area in `territory`.

```ts
getCanton('oudergem').seat.nl // 'Etterbeek': the seat can differ from the name
getCanton('gent-1', { on: '2025-06-01' }) // the version of that day
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: the data describes 2025-01-01 onwards
```

### `getMunicipality` {#getmunicipality}

```ts
function getMunicipality(id: MunicipalityId): Municipality
function getMunicipality(id: string, options?: OnDay): Municipality | undefined
```

A municipality by its REFNIS code.

```ts
getMunicipality('44021').name // { nl: 'Gent', fr: 'Gand' }
getMunicipality('21004').province // '04000': Brussels has no province, this is the region's code
```

### `getProvince` {#getprovince}

```ts
function getProvince(id: ProvinceId): Province
function getProvince(id: string, options?: OnDay): Province | undefined
```

A province by its REFNIS code.

```ts
getProvince('40000').name.nl // 'Provincie Oost-Vlaanderen'
getProvince('04000') // undefined: the Brussels-Capital Region is not a province
```

### `getRegion` {#getregion}

```ts
function getRegion(id: RegionId): Region
function getRegion(id: string, options?: OnDay): Region | undefined
```

A region by its REFNIS code: `02000` Flemish, `03000` Walloon, `04000` Brussels-Capital.

```ts
getRegion('02000').name.fr // 'Région flamande'
```

### `getCantonsForMunicipality` {#getcantonsformunicipality}

```ts
function getCantonsForMunicipality(municipalityId: string, options?: OnDay): Canton[]
```

The cantons that cover a municipality, by REFNIS code. One canton for most municipalities.
Several for a city split over cantons (Antwerpen, Gent, Brussel, …), where the street decides
and each canton's `territory` describes its part. To get the courts as well, use
[`findJusticesOfThePeace`](#findjusticesofthepeace).

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
getCantonsForMunicipality('00000') // []
```

### `getArrondissementForMunicipality` {#getarrondissementformunicipality}

```ts
function getArrondissementForMunicipality(
    municipalityId: string,
    options?: OnDay,
): Arrondissement | undefined
```

The judicial arrondissement a municipality lies in, by REFNIS code. Every municipality lies in
exactly one, even a city split over several cantons. `undefined` for an unknown code.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality` {#getprovinceformunicipality}

```ts
function getProvinceForMunicipality(municipalityId: string, options?: OnDay): Province | undefined
```

The province a municipality lies in, by REFNIS code. `undefined` for the 19 municipalities of
the Brussels-Capital Region, which has no province, and for an unknown code.

```ts
getProvinceForMunicipality('44021')?.id // '40000'
getProvinceForMunicipality('21004') // undefined: Brussel
```

### `getRegionForMunicipality` {#getregionformunicipality}

```ts
function getRegionForMunicipality(municipalityId: string, options?: OnDay): Region | undefined
```

The region a municipality lies in, by REFNIS code. `undefined` for an unknown code.

```ts
getRegionForMunicipality('21004')?.name.nl // 'Brussels Hoofdstedelijk Gewest'
```

## Courts

From `belgica/courts` and the root. See [courts](/data/courts) for the records.

### `getCourt` {#getcourt}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

A court, division or seat by id. Ids are the court's `type` followed by its place:
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace` {#getjusticeofthepeace}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

The justice of the peace of a canton, by canton id. Every canton has one. A justice of the peace
that sits in several places (Philippeville, in Couvin and Florennes) has no address or contacts
of its own: its seats have them, see [`getDivisions`](#getdivisions).

```ts
getJusticeOfThePeace('gent-1').id // 'justice-of-the-peace-gent-1'
```

### `getDivisions` {#getdivisions}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

A court's divisions, or the seats of a justice of the peace that sits in several places. `[]`
for a court without, or an unknown id.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …, 'labour-court-gent-veurne']
```

### `getCourtsForCanton` {#getcourtsforcanton}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

The courts whose area holds a canton: its justice of the peace and, of each other type, the
court that covers it (the court as a whole, not its divisions). In Brussels, both language courts
of a type. `[]` for an unknown canton.

```ts
getCourtsForCanton('gent-1').map((c) => c.id)
// ['court-of-appeal-gent', 'court-of-assize-oost-vlaanderen', 'court-of-first-instance-oost-vlaanderen', …]
```

### `findCourts` {#findcourts}

```ts
function findCourts(filter: CourtFilter, options?: OnDay): Court[]

interface CourtFilter {
    type?: CourtType
    kind?: 'court' | 'division' | 'seat'
    arrondissement?: string
    judicialArea?: string
}
```

The courts that match every given filter. An empty filter returns every court. A court whose
area covers several arrondissements (a court of appeal, for one) has no `arrondissement`, so an
`arrondissement` filter leaves it out.

```ts
findCourts({ type: 'court-of-appeal' }) // the five courts of appeal
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // its five divisions there
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
```

### `formatCourtName` {#formatcourtname}

```ts
function formatCourtName(
    court: NamedCourt,
    locale: Locale,
    options?: { style?: 'official' | 'canton' },
): string

type NamedCourt = Pick<Court, 'id' | 'type' | 'kind' | 'name' | 'label'>
```

A court's name in one language. Takes a full record or a [summary](#loading-courts-on-demand).

- `style: 'official'`, the default, gives the name as the court publishes it, from `name`. A
  court that doesn't publish in `locale` gives its name in another language: for Dutch, French
  then German; for French, Dutch then German; for German, French then Dutch.
- `style: 'canton'` gives a justice of the peace a label built from its canton's number and name,
  in `locale`. **It is a display label, not the court's official name**: use `'official'` where
  the name has legal weight. Any other court, and a seat of a justice of the peace, gets its
  official name, so a list of mixed courts can use one style. Only the cantons of Eupen-Sankt
  Vith have a German name; for the others, German uses the canton's name in the court's own
  language (French in Brussels).

```ts
const court = getCourt('justice-of-the-peace-gent-1')
formatCourtName(court, 'fr') // 'Vredegerecht Gent 1': the court publishes in Dutch only
formatCourtName(court, 'nl', { style: 'canton' }) // 'Vredegerecht 1e kanton Gent'
formatCourtName(court, 'fr', { style: 'canton' }) // 'Justice de paix 1er canton Gand'
formatCourtName(court, 'de', { style: 'canton' }) // 'Friedensgericht 1. Kanton Gent'
formatCourtName(getCourt('justice-of-the-peace-deinze'), 'fr', { style: 'canton' }) // 'Justice de paix canton Deinze'
```

The label is stored on the record, as `label`, so the `formatCourtName` of
`belgica/courts/format` gives it without loading the cantons. For a record saved before 0.5.0,
which has no `label`, that version gives the official name, and the one in `belgica/courts` and
the root builds the label from the canton.

## Jurisdiction

Questions that combine the territory and the courts. Only in the package root.

### `findJusticesOfThePeace` {#findjusticesofthepeace}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // the canton covers only part of the municipality
}
```

The justices of the peace for a municipality, by REFNIS code, each with its canton. One for most
municipalities. Several for a city split over cantons, where the street decides and each
canton's `territory` says which part it covers. `[]` for an unknown code.

```ts
findJusticesOfThePeace('44088')
// [{ canton: { id: 'merelbeke-melle', … }, court: { id: 'justice-of-the-peace-merelbeke-melle', … }, partial: false }]
findJusticesOfThePeace('44021').map((r) => r.canton.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `findCourtsWithJurisdiction` {#findcourtswithjurisdiction}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

The courts of a type with jurisdiction over a municipality, by REFNIS code: the courts whose
area, as the law sets it (`cantons`), holds one of the municipality's cantons. One court for most
municipalities. In Brussels, the Dutch- and the French-speaking court. For a city split over
cantons and the type `justice-of-the-peace`, every justice of the peace that serves part of it.
`[]` for an unknown code.

It gives the court as a whole. Which of its divisions hears a case is set by royal decree and
isn't in the data yet, so choose among [`getDivisions(court.id)`](#getdivisions).

```ts
findCourtsWithJurisdiction('23088', 'police-court').map((c) => c.id) // ['police-court-vilvoorde']
findCourtsWithJurisdiction('21004', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-brussel-fr', 'court-of-first-instance-brussel-nl']
findCourtsWithJurisdiction('44021', 'labour-court').map((c) => c.id) // ['labour-court-gent']
```

### `findCourtsForPostalCode` {#findcourtsforpostalcode}

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

The courts for a postal code, per municipality: the postal code gives the municipality, the
municipality its justices of the peace and its courts of the type asked for. One entry for
almost every code. Two for `1040`, `1050` and `1804`, which belong to two municipalities, so the
answer is never collapsed to one of them. `[]` for an unknown code.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]
findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Postal codes

From `belgica/postal-codes` and the root. See [postal codes](/data/postal-codes).

### `getPostalCode` {#getpostalcode}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

A record by id: the postal code and the REFNIS code, joined. To look up by postal code alone,
use [`getMunicipalitiesForPostalCode`](#getmunicipalitiesforpostalcode).

```ts
getPostalCode('9000-44021') // { id: '9000-44021', postalCode: '9000', municipality: '44021' }
```

### `getMunicipalitiesForPostalCode` {#getmunicipalitiesforpostalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

The municipalities a postal code belongs to: one for almost every code, two for `1040`, `1050`
and `1804`, where the street decides. `[]` for an unknown code.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
```

### `getPostalCodes` {#getpostalcodes}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

The postal codes of a municipality, by REFNIS code, in order. `[]` for an unknown code.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Police zones

From `belgica/police-zones` only: they aren't in the root. See [police zones](/data/police-zones).

### `getPoliceZone` {#getpolicezone}

```ts
function getPoliceZone(id: PoliceZoneId): PoliceZone
function getPoliceZone(id: string, options?: OnDay): PoliceZone | undefined
```

A zone by its official number. `undefined` for an unknown number or one not in force that day.

```ts
getPoliceZone('5415').name // { nl: 'GENT', fr: 'GAND', de: 'GENT' }
getPoliceZone('5403').alias // 'RODE'
```

### `findPoliceZone` {#findpolicezone}

```ts
function findPoliceZone(municipalityId: string, options?: OnDay): PoliceZone | undefined
```

The zone of a municipality, by REFNIS code. Every municipality is in exactly one zone;
`undefined` for an unknown code.

```ts
findPoliceZone('44021')?.id // '5415': Gent
findPoliceZone('11001')?.name.nl // 'AARTSELAAR/EDEGEM/HOVE/KONTICH/LINT'
```

### `getPoliceZoneMunicipalities` {#getpolicezonemunicipalities}

```ts
function getPoliceZoneMunicipalities(id: string, options?: OnDay): Municipality[]
```

The municipalities a zone covers, in REFNIS order. `[]` for an unknown number.

```ts
getPoliceZoneMunicipalities('5349').map((m) => m.name.nl) // ['Aartselaar', 'Edegem', 'Hove', …]
```

## Contacts

In every entry point with records that have contacts: the root, `belgica/courts`,
`belgica/courts/format`, `belgica/prisons` and `belgica/houses-of-justice`.

### `getContact` {#getcontact}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

The value of the record's first contact of a type, or with a `label` the first with that label
(the registry or service, as the source names it). `undefined` when there is none.

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal') // 'liege.ca.greffepenal@just.fgov.be'
getContact(getCourt('justice-of-the-peace-gent-1'), 'phone') // '+3226820153'
```

### `formatPhoneNumber` {#formatphonenumber}

```ts
function formatPhoneNumber(e164: string): string
```

A Belgian phone number in E.164 form, written the national way. Throws a `RangeError` for
anything else.

```ts
formatPhoneNumber('+3292343210') // '09 234 32 10'
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatPhoneNumber('+32470123456') // '0470 12 34 56'
```

### `formatIban` {#formatiban}

```ts
function formatIban(iban: string): string
```

An IBAN in groups of four, as printed. It doesn't validate: the IBANs in the data are checked
when they're read.

```ts
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Prisons and houses of justice

### `getPrison` {#getprison}

```ts
function getPrison(id: PrisonId): Prison
function getPrison(id: string, options?: OnDay): Prison | undefined
```

A prison or detention house by id. From `belgica/prisons` and the root. See
[prisons](/data/prisons).

```ts
getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
```

### `getHouseOfJustice` {#gethouseofjustice}

```ts
function getHouseOfJustice(id: HouseOfJusticeId): HouseOfJustice
function getHouseOfJustice(id: string, options?: OnDay): HouseOfJustice | undefined
```

A house of justice by id. From `belgica/houses-of-justice` and the root. See
[houses of justice](/data/houses-of-justice).

```ts
getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
```

## Interest rates

From `belgica/interest-rates` and the root. See [interest rates](/data/interest-rates).

### `getInterestRate` {#getinterestrate}

```ts
function getInterestRate(
    date: Date | string,
    type: 'legal' | 'commercial',
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // percent
    period: { from: string; to: string } // the period the rate applies to, both days included
}
```

The rate that applies on a day, or `null` when no rate is on file for it: before the first
period, or a period not published or added yet. A missing rate is `null` and a malformed day is a
`RangeError`, so the two can't be confused.

`contractAfter20130316` only matters for commercial interest from 2013 to 15 March 2015, when the
rate depends on the contract date. By default the rate for older contracts is used. See
[the 2013–2015 contract rule](/data/interest-rates#the-2013-2015-contract-rule).

```ts
getInterestRate('2024-06-15', 'legal') // { rate: 5.75, period: { from: '2024-01-01', to: '2024-12-31' } }
getInterestRate('2014-06-15', 'commercial', { contractAfter20130316: true }) // { rate: 8.5, … }
getInterestRate('1960-01-01', 'legal') // null
getInterestRate('2024-6-15', 'legal') // RangeError
```

### `getLatestKnownRateDate` {#getlatestknownratedate}

```ts
function getLatestKnownRateDate(type: 'legal' | 'commercial'): string
```

The last day a rate is on file for, `YYYY-MM-DD`. Use it to say how far the data reaches when
`getInterestRate` returns `null`.

```ts
getLatestKnownRateDate('commercial') // '2026-12-31'
```

## Calendar

From `belgica/calendar` and the root. See [public holidays](/data/public-holidays) for the rules
and their legal basis. The rules are on file from 1975: a day or year before that, or after
9999, throws a `RangeError`, except in `isJudicialHoliday`, which needs no holidays.

### `getPublicHolidays` {#getpublicholidays}

```ts
function getPublicHolidays(year: number): PublicHoliday[]

interface PublicHoliday {
    id: PublicHolidayId // 'easter-monday', 'national-day', …
    day: string // YYYY-MM-DD
    name: Translated
}
```

The ten legal public holidays of a year, in order. A holiday moved by royal decree is on the day
it was moved to. Community and regional holidays aren't legal holidays and aren't included.
Throws a `RangeError` for a year that isn't an integer from 1975 to 9999.

```ts
getPublicHolidays(2026).map((h) => h.day) // ['2026-01-01', '2026-04-06', …, '2026-12-25']
getPublicHolidays(2008).find((h) => h.id === 'ascension')?.day // '2008-05-02': moved by royal decree
```

### `getPublicHoliday` and `isPublicHoliday` {#getpublicholiday}

```ts
function getPublicHoliday(date: Date | string): PublicHoliday | undefined
function isPublicHoliday(date: Date | string): boolean
```

The legal public holiday on a day, or `undefined`; and whether there is one.

```ts
getPublicHoliday('2026-07-21')?.name.fr // 'Fête nationale'
isPublicHoliday('2026-07-11') // false: a Flemish Community holiday, not a legal one
```

### `isWorkingDay` {#isworkingday}

```ts
function isWorkingDay(date: Date | string): boolean
```

Whether a day is a working day: not a Saturday, a Sunday or a legal public holiday.

```ts
isWorkingDay('2026-04-06') // false: Easter Monday
```

### `nextWorkingDay` {#nextworkingday}

```ts
function nextWorkingDay(date: Date | string): string
```

The last day of a deadline as art. 53 Ger.W. / C. jud. moves it: the day itself when it's a
working day, otherwise the first working day after it.

```ts
nextWorkingDay('2026-04-03') // '2026-04-03': a Friday
nextWorkingDay('2026-04-04') // '2026-04-07': Saturday, Sunday, then Easter Monday
```

### `isJudicialHoliday` {#isjudicialholiday}

```ts
function isJudicialHoliday(date: Date | string): boolean
```

Whether a day falls in the judicial holidays, 1 July to 31 August (art. 334). An appeal or
opposition deadline that starts and ends in them is extended to 15 September (art. 50). This
tells you whether a day is in them, not whether art. 50 applies.

```ts
isJudicialHoliday('2026-08-14') // true
```

### `getEasterSunday` {#geteastersunday}

```ts
function getEasterSunday(year: number): string
```

Easter Sunday in the Gregorian calendar, `YYYY-MM-DD`. Throws a `RangeError` for a year that
isn't an integer from 1975 to 9999.

```ts
getEasterSunday(2026) // '2026-04-05'
```

## Maps and geometry

The boundaries and the court locations have their own entry points, and the package root
doesn't load them: the canton boundaries alone are about a million positions. Their types
(`CantonBoundary`, `CourtLocation`, the GeoJSON types) are exported from those entry points too.
Coordinates are WGS 84 decimal degrees, longitude first, as in GeoJSON.

### `findCantonsAt` {#findcantonsat}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

From `belgica/canton-boundaries`. The cantons whose boundary holds a point: one for a point in
Belgium, none outside it, two for a point exactly on the line between two cantons. Throws a
`RangeError` for coordinates that aren't finite numbers.

The boundaries are the National Geographic Institute's reading of the law. For a point close to
a boundary line, the canton's `territory` text decides. See
[canton boundaries](/data/canton-boundaries).

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']: Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []: Paris
```

### `getCantonBoundary` {#getcantonboundary}

```ts
function getCantonBoundary(cantonId: CantonId): CantonBoundary
function getCantonBoundary(cantonId: string, options?: OnDay): CantonBoundary | undefined
```

From `belgica/canton-boundaries`. A canton's boundary, a GeoJSON `MultiPolygon`, by canton id.

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

### `findArrondissementsAt` {#findarrondissementsat}

```ts
function findArrondissementsAt(
    longitude: number,
    latitude: number,
    options?: OnDay,
): Arrondissement[]
```

From `belgica/arrondissement-boundaries`. The arrondissements whose boundary holds a point, as
`findCantonsAt` does for cantons.

```ts
findArrondissementsAt(4.2372, 50.7339).map((a) => a.id) // ['brussel']: Halle
```

### `getArrondissementBoundary` {#getarrondissementboundary}

```ts
function getArrondissementBoundary(arrondissementId: ArrondissementId): ArrondissementBoundary
function getArrondissementBoundary(
    arrondissementId: string,
    options?: OnDay,
): ArrondissementBoundary | undefined
```

From `belgica/arrondissement-boundaries`. An arrondissement's boundary, by arrondissement id.

```ts
getArrondissementBoundary('leuven').geometry.type // 'MultiPolygon'
```

### `getCourtLocation` {#getcourtlocation}

```ts
function getCourtLocation(courtId: string, options?: OnDay): CourtLocation | undefined
```

From `belgica/court-locations`. Where a justice of the peace, or one of its seats, is on the
map: a GeoJSON `Point`. `undefined` for a court the NGI's point doesn't match (see
[locations](/data/courts#locations)) and for every other kind of court.

```ts
getCourtLocation('justice-of-the-peace-aalst-1')?.geometry
// { type: 'Point', coordinates: [4.0409722, 50.941518] }
getCourtLocation('court-of-appeal-gent') // undefined
```

## Loading courts on demand

From `belgica/courts/load`. Each function loads only the
[court files](/data/courts#only-the-courts-you-need) it needs, with `import()`, so a bundler
makes a chunk of each file and a browser downloads only what it asks for. They return promises.
A `RangeError` for `on` rejects the promise.

The files hold summaries, `CourtSummary`: a court without `contacts`, `openingHours`,
`openingHoursText`, `website`, `ecli` and `sources`. Those are in `CourtDetails`.

### `loadCourts` {#loadcourts}

```ts
function loadCourts(
    filter: { type: CourtType; arrondissement?: string },
    options?: OnDay,
): Promise<CourtSummary[]>
```

The courts, divisions and seats of a type, or of a type in one arrondissement. Without an
arrondissement, the whole type, including the courts whose area covers several arrondissements.
`[]` for an unknown type or arrondissement.

```ts
await loadCourts({ type: 'justice-of-the-peace', arrondissement: 'west-vlaanderen' })
```

### `loadCourt` {#loadcourt}

```ts
function loadCourt(id: CourtId | string, options?: OnDay): Promise<CourtSummary | undefined>
```

A court's summary by id, for an id you stored. Loads `data/courts/index.json`, then the one file
the court is in.

```ts
await loadCourt('justice-of-the-peace-gent-1')
```

### `loadCourtDetails` {#loadcourtdetails}

```ts
function loadCourtDetails(id: CourtId | string, options?: OnDay): Promise<CourtDetails | undefined>
```

What the summaries leave out, for the one court you show, from
`data/courts/details/<id>.json`.

```ts
const details = await loadCourtDetails('justice-of-the-peace-gent-1')
if (details) getContact(details, 'phone') // '+3226820153'
```

## Cantons without their territory

`belgica/cantons` exports `cantons` and `getCanton` as `belgica/territory` does, without each
canton's `territory` (`CantonSummary`). The texts are most of the cantons data.
`belgica/cantons/territory` has them alone:

### `getCantonTerritory` {#getcantonterritory}

```ts
function getCantonTerritory(cantonId: CantonId): Bilingual
function getCantonTerritory(cantonId: string, options?: OnDay): Bilingual | undefined
```

The law's description of a canton's area, in Dutch and French: the same as
`getCanton(id).territory` from `belgica/territory`.

```ts
import { getCanton } from 'belgica/cantons'
import { getCantonTerritory } from 'belgica/cantons/territory'

getCanton('gent-1').seat.nl // 'Gent'
getCantonTerritory('gent-1').nl // 'Het gedeelte van het grondgebied van de stad Gent beginnend …'
```

## Time

Every record can carry a validity period, and every lookup takes a day. See
[core concepts](/guide/concepts#time). The helpers are exported for your own records.

```ts
interface Validity {
    validFrom?: string // first day, YYYY-MM-DD; none: since the coverage starts
    validTo?: string // last day; none: still applies
}

interface OnDay {
    on?: Date | string // today by default
}

interface Coverage {
    readonly from: string // the first day a dataset describes
}
```

### Coverage constants {#coverage}

| Constant                           | Value          | Entry point                             |
| ---------------------------------- | -------------- | --------------------------------------- |
| `territoryCoverage`                | `'2025-01-01'` | `belgica/territory`, `belgica/cantons`  |
| `courtsCoverage`                   | `'2025-01-01'` | `belgica/courts`, `belgica/courts/load` |
| `postalCodesCoverage`              | `'2025-01-01'` | `belgica/postal-codes`                  |
| `prisonsCoverage`                  | `'2026-10-20'` | `belgica/prisons`                       |
| `housesOfJusticeCoverage`          | `'2026-10-20'` | `belgica/houses-of-justice`             |
| `cantonBoundariesCoverage`         | `'2026-10-21'` | `belgica/canton-boundaries`             |
| `arrondissementBoundariesCoverage` | `'2026-10-21'` | `belgica/arrondissement-boundaries`     |
| `courtLocationsCoverage`           | `'2026-10-21'` | `belgica/court-locations`               |
| `policeZonesCoverage`              | `'2026-11-02'` | `belgica/police-zones`                  |

Each is a `Coverage`, `{ from }`. The first five are also in the root. A lookup for a day before
`from` throws a `RangeError`.

### `appliesOn` {#applieson}

```ts
function appliesOn(record: Validity, day: string): boolean
```

Whether a record applies on a day: `validFrom` and `validTo` both include their day. `day` must
already be `YYYY-MM-DD`; use `toDay` to get one.

```ts
courts.filter((court) => appliesOn(court, toDay(new Date())))
```

### `toDay` {#today}

```ts
function toDay(date: Date | string): string
```

A day as `YYYY-MM-DD`: a `Date` as its local calendar day, a string checked and cut to its first
ten characters. Throws a `RangeError` for anything that isn't a valid day.

```ts
toDay('2024-06-15T10:30:00Z') // '2024-06-15'
toDay('2024-02-30') // RangeError
```

## Datasets

The full datasets, typed. Each array holds every version of every record; filter with
`appliesOn`, or use the functions above, which do.

| Export                     | Type                                                 | Entry point                              |
| -------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `judicialAreas`            | `readonly JudicialArea[]`                            | `belgica/territory`                      |
| `arrondissements`          | `readonly Arrondissement[]`                          | `belgica/territory`                      |
| `cantons`                  | `readonly Canton[]`                                  | `belgica/territory`                      |
| `municipalities`           | `readonly Municipality[]`                            | `belgica/territory`                      |
| `provinces`                | `readonly Province[]`                                | `belgica/territory`                      |
| `regions`                  | `readonly Region[]`                                  | `belgica/territory`                      |
| `courts`                   | `readonly Court[]`                                   | `belgica/courts`                         |
| `prisons`                  | `readonly Prison[]`                                  | `belgica/prisons`                        |
| `housesOfJustice`          | `readonly HouseOfJustice[]`                          | `belgica/houses-of-justice`              |
| `postalCodes`              | `readonly PostalCode[]`                              | `belgica/postal-codes`                   |
| `interestRates`            | `Readonly<Record<InterestType, InterestRateSeries>>` | `belgica/interest-rates`                 |
| `publicHolidays`           | `Readonly<PublicHolidays>`                           | `belgica/calendar`                       |
| `cantonBoundaries`         | `readonly CantonBoundary[]`                          | `belgica/canton-boundaries` only         |
| `arrondissementBoundaries` | `readonly ArrondissementBoundary[]`                  | `belgica/arrondissement-boundaries` only |
| `courtLocations`           | `readonly CourtLocation[]`                           | `belgica/court-locations` only           |

Every dataset except the last three is also in the root. `belgica/cantons` exports `cantons` as
`readonly CantonSummary[]`.

## Types

Each type is exported from the entry points that use it, and all but the boundary, location,
geometry and loader types from the root too. Record types are inferred from the
[zod schemas](/guide/schema#zod-schemas).

| Types                                                                                                                                                                                                                          | Described on                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `MunicipalityId`, `ProvinceId`, `RegionId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`, `PublicHolidayId`: unions of the ids in the data, regenerated with it | [Identifiers](/guide/identifiers#in-typescript)                                          |
| `Locale` = `'nl' \| 'fr' \| 'de'`, `Translated` = `Record<Locale, string>`, `Bilingual` = `Record<'nl' \| 'fr', string>`                                                                                                       | [Core concepts](/guide/concepts#languages)                                               |
| `SourceRef` = `{ url: string; retrieved: string }`, `Url`                                                                                                                                                                      | [Data quality](/guide/data-quality)                                                      |
| `Validity`, `OnDay`, `Coverage`                                                                                                                                                                                                | [Time](#time)                                                                            |
| `JudicialArea`, `Arrondissement`, `Canton`, `Municipality`, `Province`, `Region`, `LegalBasis`                                                                                                                                 | [Territory](/data/territory)                                                             |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `NamedCourt`, `FormatCourtNameOptions`                                                                                                               | [Courts](/data/courts#shape)                                                             |
| `CantonCourt`, `PostalCodeCourts`                                                                                                                                                                                              | [Jurisdiction](#jurisdiction)                                                            |
| `CourtSummary`, `CourtDetails`, `LoadCourtsFilter`, `CantonSummary`, `CantonTerritory`                                                                                                                                         | [Only the courts you need](/data/courts#only-the-courts-you-need)                        |
| `PostalCode`                                                                                                                                                                                                                   | [Postal codes](/data/postal-codes)                                                       |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                                     | [Prisons](/data/prisons), [houses of justice](/data/houses-of-justice)                   |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                                               | [Interest rates](/data/interest-rates#shape)                                             |
| `PublicHoliday`, `PublicHolidays`, `PublicHolidayDefinition`, `PublicHolidayReplacement`, `PublicHolidayRule`                                                                                                                  | [Public holidays](/data/public-holidays#shape)                                           |
| `CantonBoundary`, `ArrondissementBoundary`, `CourtLocation`, `MultiPolygon`, `Point`, `Position`                                                                                                                               | [Canton boundaries](/data/canton-boundaries#fields), [locations](/data/courts#locations) |

## Deprecated

| Name                  | Use instead                                                 | Removed in |
| --------------------- | ----------------------------------------------------------- | ---------- |
| `findCompetentCourts` | [`findCourtsWithJurisdiction`](#findcourtswithjurisdiction) | 1.0        |
