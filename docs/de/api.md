# API-Referenz {#api-reference}

Alles wird aus dem Root des Package exportiert, und jeder Datensatz hat zusätzlich einen eigenen
Entry Point:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Nur, was Sie verwenden: Die Zinssätze allein sind nur einige Kilobyte
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry Point                    | Inhalt                                                                     |
| ------------------------------ | -------------------------------------------------------------------------- |
| `belgica`                      | Alles Folgende, außer den Kantonsgrenzen                                   |
| `belgica/territory`            | Gerichtsbereiche, Gerichtsbezirke, Kantone, Gemeinden, Provinzen, Regionen |
| `belgica/canton-boundaries`    | Die Geometrie der Kantone und `findCantonsAt`                              |
| `belgica/courts`               | Gerichte und die Kontakt-Hilfsfunktionen                                   |
| `belgica/prisons`              | Gefängnisse und die Kontakt-Hilfsfunktionen                                |
| `belgica/houses-of-justice`    | Justizhäuser und die Kontakt-Hilfsfunktionen                               |
| `belgica/interest-rates`       | Zinssätze                                                                  |
| `belgica/postal-codes`         | Postleitzahlen, mit den Gemeinden, zu denen sie gehören                    |
| `belgica/data/*.json`          | Die rohen Datendateien                                                     |
| `belgica/schema/*.schema.json` | [JSON Schemas](/de/guide/schema)                                           |
| `belgica/datapackage.json`     | [Data-Package-Deskriptor](/de/guide/schema#datapackage-json)               |

Konventionen:

- Nachschlagen per ID gibt `undefined` zurück, wenn nichts passt; Listenfunktionen geben ein leeres
  Array zurück.
- Funktionen werfen nur bei ungültiger Eingabe: einem fehlerhaften Tag oder einem Tag vor dem
  abgedeckten Zeitraum der Daten (`RangeError`). Nie bei fehlenden Daten.
- Jedes Nachschlagen nimmt einen optionalen Tag, `{ on: '2025-06-01' }` oder ein `Date`, und
  antwortet ohne ihn für heute. Nachschlagen per ID findet einen bekannten Eintrag immer: die
  heutige Version oder die letzte eines beendeten Eintrags. Siehe [Zeit](#time).
- Exportierte Datensätze sind `readonly`: Kopieren Sie sie, bevor Sie sortieren oder ändern
  (`[...courts].sort()`).
- Nachschlagen mit einer bekannten ID (einem Literal wie `'gent-1'` oder einem als `CantonId`
  typisierten Wert) gibt den Eintrag selbst zurück, nie `undefined`. Jeder andere String gibt
  `Record | undefined` zurück. Siehe [Identifikatoren](/de/guide/identifiers).

## Gebiet {#territory}

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
getMunicipality('21004').province // '04000': Brüssel hat keine Provinz, das ist der Code der Region
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
getProvince('04000') // undefined: Die Region Brüssel-Hauptstadt ist keine Provinz
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // die Version dieses Tages
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: Die Daten beschreiben die Lage ab 2025-01-01
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

Die Kantone, die eine Gemeinde an einem Tag abdecken, standardmäßig heute. Ein Kanton für die
meisten Gemeinden; mehrere für geteilte Städte (Antwerpen, Gent, Brüssel, …). Dann entscheidet die
Straßenadresse, und `territory` jedes Kantons beschreibt seinen Teil.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

Der Gerichtsbezirk, in dem eine Gemeinde liegt, per REFNIS-Code. Jede Gemeinde liegt in genau
einem, auch eine auf mehrere Kantone aufgeteilte Stadt.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

Die Provinz, in der eine Gemeinde liegt, per REFNIS-Code. `undefined` für die 19 Gemeinden der
Region Brüssel-Hauptstadt, die keine Provinz hat, und für einen unbekannten Code.

```ts
getProvinceForMunicipality('44021')?.id // '40000'
getProvinceForMunicipality('21004') // undefined: Brüssel
```

### `getRegionForMunicipality(id)` {#getregionformunicipality-id}

```ts
function getRegionForMunicipality(id: string, options?: OnDay): Region | undefined
```

```ts
getRegionForMunicipality('21004')?.name.nl // 'Brussels Hoofdstedelijk Gewest'
```

## Kantonsgrenzen {#canton-boundaries}

Nur in `belgica/canton-boundaries`: Die Geometrie umfasst etwa eine Million Positionen, deshalb
exportiert der Root des Package sie nicht erneut (die Typen schon). Siehe die
[Datenseite](/de/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

Die Kantone, deren Grenze einen Punkt enthält, an einem Tag (standardmäßig heute). Zuerst der
Längengrad, dann der Breitengrad, in Dezimalgrad (WGS 84), wie GeoJSON sie ordnet. Ein Kanton für
einen Punkt in Belgien; keiner außerhalb; zwei für einen Punkt auf der Linie zwischen zwei
Kantonen. Wirft einen `RangeError` für Koordinaten, die keine endlichen Zahlen sind.

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']: Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []: Paris
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## Gerichte {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Ein Gericht, eine Abteilung oder ein Sitz. IDs sind der `type` des Gerichts, gefolgt vom Ort:
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

Das Friedensgericht eines Kantons. Jeder Kanton hat eines. Ein Friedensgericht mit mehreren Sitzen
(Philippeville, in Couvin und Florennes) hat keine eigene Adresse und keine eigenen Kontakte: Seine
Sitze haben sie, siehe `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // das Friedensgericht Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

Die Abteilungen eines Gerichts oder die Sitze eines Friedensgerichts mit mehreren Sitzen, an einem
Tag (standardmäßig heute); leer für ein Gericht ohne.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

Die Gerichte, deren Gebiet einen Kanton an einem Tag (standardmäßig heute) enthält: sein
Friedensgericht und, von jedem anderen Typ, das Gericht, das ihn abdeckt (das Gericht als Ganzes,
nicht seine Abteilungen); in Brüssel beide Sprachgerichte eines Typs. Leer für einen unbekannten
Kanton.

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

Die Gerichte, die jedem angegebenen Filter entsprechen und an einem Tag (standardmäßig heute)
gelten; ein leerer Filter gibt jedes Gericht dieses Tages zurück.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // seine Abteilungen dort
findCourts({ type: 'court-of-appeal' }) // die fünf Appellationshöfe
```

## Kontaktdaten {#contacts}

In jedem Entry Point mit Einträgen, die Kontakte haben: dem Root, `courts`, `prisons` und
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

Der Wert des ersten Kontakts dieses Typs, optional mit dieser Bezeichnung (der Kanzlei oder dem
Dienst, wie die Quelle sie nennt).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Eine belgische Nummer in ihrer nationalen Schreibweise. Wirft einen `RangeError` für alles, was
keine belgische Nummer in E.164-Form ist.

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

## Gefängnisse {#prisons}

### `getPrison(id)` {#getprison-id}

```ts
function getPrison(id: PrisonId): Prison
function getPrison(id: string, options?: OnDay): Prison | undefined
```

```ts
getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
```

## Justizhäuser {#houses-of-justice}

### `getHouseOfJustice(id)` {#gethouseofjustice-id}

```ts
function getHouseOfJustice(id: HouseOfJusticeId): HouseOfJustice
function getHouseOfJustice(id: string, options?: OnDay): HouseOfJustice | undefined
```

```ts
getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
```

## Postleitzahlen {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Ein Eintrag per ID: Postleitzahl und REFNIS-Code verbunden, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

Die Gemeinden, zu denen eine Postleitzahl an einem Tag (standardmäßig heute) gehört: eine für fast
jeden Code; zwei für `1040`, `1050` und `1804`, wo die Straße entscheidet. Dieselben
`Municipality`-Einträge, die `getMunicipality` liefert. Leer für einen unbekannten Code.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

Die Postleitzahlen einer Gemeinde an einem Tag (standardmäßig heute), per REFNIS-Code, sortiert.
Leer für einen unbekannten Code.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Zuständigkeit {#jurisdiction}

Fragen, die Datensätze kombinieren. Sie stehen nur im Root des Package, da sie sowohl das Gebiet
als auch die Gerichte brauchen.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

Die Gerichte eines Typs, die an einem Tag (standardmäßig heute) für eine Gemeinde zuständig sind,
per REFNIS-Code: die Gerichte, deren Gebiet, wie das Gesetz es festlegt (`cantons`), einen der
Kantone der Gemeinde enthält. Ein Gericht für die meisten Gemeinden; in Brüssel das
niederländischsprachige und das französischsprachige Gericht; für eine auf Kantone aufgeteilte
Stadt jedes Friedensgericht, das einen davon bedient. Es liefert das Gericht als Ganzes:
[`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type) liefert die
Abteilung. Leer für einen unbekannten Code.

```ts
findCourtsWithJurisdiction('23088', 'police-court').map((c) => c.id) // ['police-court-vilvoorde']
findCourtsWithJurisdiction('21004', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-brussel-fr', 'court-of-first-instance-brussel-nl']
findCourtsWithJurisdiction('44021', 'labour-court').map((c) => c.id) // ['labour-court-gent']
```

### `findDivisionsWithJurisdiction(municipalityId, type, options?)` {#finddivisionswithjurisdiction-municipalityid-type}

```ts
function findDivisionsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: DivisionOptions,
): Court[]

interface DivisionOptions extends OnDay {
    matter?: Matter // die Art der Sache: 'civil' | 'criminal'
}
```

Wo für eine Gemeinde einzureichen ist, per REFNIS-Code: für jedes Gericht, das
[`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type) liefert, die Abteilung, deren Gebiet die Gemeinde enthält,
wie die Königlichen Erlasse aufgrund von Art. 186 des Gerichtsgesetzbuchs es festlegen (siehe
[Abteilungen](/de/data/courts#divisions)). Eine Gemeinde gehört zu der Abteilung, die sie in
`municipalities` nennt, andernfalls zu der, die ihren Kanton in `cantons` hat. Ein Gericht, das
nicht in Abteilungen aufgeteilt ist, liefert sich selbst. Eine Stadt, die auf Kantone aufgeteilt
ist, die an verschiedene Abteilungen gehen, würde jede davon liefern, und die Adresse entscheidet;
heute ist keine Stadt so aufgeteilt. Leer für einen unbekannten Code.

Das Gericht erster Instanz und das Polizeigericht Antwerpen haben ein Gebiet für Zivilsachen und
ein anderes für Strafsachen (das [`criminalArea`](/de/data/courts#civil-and-criminal-cases) einer
Abteilung): Hulshout und Herenthout gehen in Zivilsachen an Mecheln und in Strafsachen an Turnhout.
`matter` gibt an, um welche Art von Sache es geht. Ohne `matter` erhalten diese beiden Gemeinden
beide Abteilungen, die für Zivilsachen zuerst; jede andere Gemeinde erhält unabhängig von der Art
der Sache dieselbe Antwort.

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']: Pont-à-Celles, obwohl der Rest seines Kantons an Binche geht
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']: nicht in Abteilungen aufgeteilt
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']: Hulshout, das in Zivilsachen an Mecheln geht
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // der Kanton deckt nur einen Teil der Gemeinde ab
}
```

Die Friedensgerichte für eine Gemeinde an einem Tag (standardmäßig heute): eines für die meisten
Gemeinden, mehrere für eine auf Kantone aufgeteilte Stadt, wo die Straßenadresse entscheidet und
`territory` jedes Kantons sagt, welchen Teil er abdeckt.

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

Die Gerichte für eine Postleitzahl an einem Tag (standardmäßig heute), pro Gemeinde: Die
Postleitzahl liefert die Gemeinde ([Postleitzahlen](/de/data/postal-codes)), die Gemeinde ihre
Friedensgerichte und ihre Gerichte des angefragten Typs. Ein Eintrag für fast jeden Code; zwei für
`1040`, `1050` und `1804`, die zu zwei Gemeinden gehören, sodass die Antwort nie auf eine davon
reduziert wird. Leer für einen unbekannten Code. In einer auf Kantone aufgeteilten Stadt entscheidet
weiterhin die Straße zwischen den Friedensgerichten, wie bei `findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Zinssätze {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // Prozent
    period: { from: string; to: string }
}
```

Der Zinssatz, der an einem Tag gilt, oder `null`, wenn für diesen Tag kein Zinssatz hinterlegt ist.
Ein `Date` wird als lokaler Kalendertag gelesen; ein String muss mit einem gültigen Tag
`YYYY-MM-DD` beginnen (ein ISO-Zeitstempel ist in Ordnung, seine Uhrzeit wird ignoriert).

Wirft einen `RangeError` für alles andere: `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` oder ein
ungültiges `Date`. Ein fehlender Zinssatz ist `null`; ein fehlerhafter Tag ist ein Fehler, sodass
die beiden nicht verwechselt werden können.

`contractAfter20130316` spielt nur für Zinsen im Handelsverkehr zwischen 2013 und dem 15. März 2015
eine Rolle; standardmäßig wird der Zinssatz für ältere Verträge verwendet. Siehe
[Zinssätze](/de/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

Der letzte Tag, für den ein Zinssatz hinterlegt ist, `YYYY-MM-DD`.

## Zeit {#time}

Jeder Eintrag hat einen Gültigkeitszeitraum, und jedes Nachschlagen nimmt einen Tag. Die
Hilfsfunktionen werden für Ihre eigenen Einträge exportiert.

```ts
interface Validity {
    validFrom?: string // erster Tag, YYYY-MM-DD; fehlend: schon vor dem abgedeckten Zeitraum
    validTo?: string // letzter Tag; fehlend: gilt weiterhin
}

interface OnDay {
    on?: Date | string // standardmäßig heute; ein Date wird als lokaler Tag gelesen
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD' oder ein RangeError
```

Jeder Datensatz gibt an, ab welchem Tag er die Lage beschreibt; Nachschlagen für einen früheren Tag
wirft einen `RangeError`, statt mit der Karte von heute zu antworten. Das Gebiet und die Liste der
Gerichte folgen aus dem Gesetz in der zum 1. Januar 2025 geänderten Fassung; Gefängnisse und
Justizhäuser sind ab dem Tag bekannt, an dem ihre Websites zuerst gelesen wurden. Frühere Versionen
sind geplant ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

Die exportierten Arrays (`courts`, `prisons`, …) enthalten jede Version jedes Eintrags. Ein
Eintrag, den die Quelle nicht mehr aufführt, wird nicht gelöscht: Er behält seine ID und erhält ein
`validTo`, den Tag vor der wöchentlichen Prüfung, die ihn nicht mehr fand. Einer, den die Quelle
neu aufführt, erhält ein `validFrom`. Nachschlagen per ID ohne Tag gibt also die heutige Version
zurück oder die letzte Version eines beendeten Eintrags: Prüfen Sie `validTo`, bevor Sie dort etwas
einreichen.

## Datensätze {#datasets}

Die vollständigen Datensätze, typisiert:

| Export            | Typ                                                  |
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

## Typen {#types}

| Typ                                                                                                                                                                                                           | Beschrieben auf                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`: Unions der IDs in den Daten, mit ihnen neu generiert | [Identifikatoren](/de/guide/identifiers#in-typescript)                      |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                             |                                                                             |
| `SourceRef` = `{ url: string; retrieved: string }`: woher die Daten eines Eintrags stammen                                                                                                                    | [Datenqualität](/de/guide/data-quality)                                     |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                       |                                                                             |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: Namen, wie das Gerichtsgesetzbuch sie angibt                                                                                                                    |                                                                             |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                           | [Gebiet](/de/data/territory)                                                |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                       | [Gerichte](/de/data/courts#shape)                                           |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                              | [Postleitzahlen](/de/data/postal-codes)                                     |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                    | [Gefängnisse](/de/data/prisons), [Justizhäuser](/de/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                              | [Zinssätze](/de/data/interest-rates#shape)                                  |
