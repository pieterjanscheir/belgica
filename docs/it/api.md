# Riferimento API {#api-reference}

Tutto viene esportato dalla root del package, e ogni dataset ha anche il proprio entry point:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Solo ciò che usi: i tassi d'interesse da soli pesano pochi kilobyte
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | Contenuto                                                                |
| ------------------------------ | ------------------------------------------------------------------------ |
| `belgica`                      | Tutto ciò che segue, tranne i confini dei cantoni                        |
| `belgica/territory`            | Distretti giudiziari, arrondissement, cantoni, comuni, province, regioni |
| `belgica/canton-boundaries`    | La geometria dei cantoni, e `findCantonsAt`                              |
| `belgica/courts`               | Corti e tribunali, e gli helper per i contatti                           |
| `belgica/prisons`              | Carceri, e gli helper per i contatti                                     |
| `belgica/houses-of-justice`    | Justitiehuizen / maisons de justice, e gli helper per i contatti         |
| `belgica/interest-rates`       | Tassi d'interesse                                                        |
| `belgica/postal-codes`         | Codici postali, con i comuni a cui appartengono                          |
| `belgica/data/*.json`          | I file di dati grezzi                                                    |
| `belgica/schema/*.schema.json` | [JSON Schema](/it/guide/schema)                                          |
| `belgica/datapackage.json`     | [Descrittore del data package](/it/guide/schema#datapackage-json)        |

Convenzioni:

- Le ricerche per id restituiscono `undefined` quando nulla corrisponde; le funzioni che
  restituiscono elenchi restituiscono un array vuoto.
- Le funzioni lanciano errori solo per input non valido: un giorno malformato, o un giorno
  precedente alla copertura dei dati (`RangeError`). Mai per dati mancanti.
- Ogni ricerca accetta un giorno facoltativo, `{ on: '2025-06-01' }` o un `Date`, e senza di esso
  risponde per oggi. Una ricerca per id trova sempre un record noto: la versione di oggi, o
  l'ultima di un record che è terminato. Vedi [tempo](#time).
- I dataset esportati sono `readonly`: copiali prima di ordinarli o modificarli
  (`[...courts].sort()`).
- Una ricerca con un id noto (un letterale come `'gent-1'`, o un valore di tipo `CantonId`)
  restituisce il record stesso, mai `undefined`. Qualsiasi altra stringa restituisce
  `Record | undefined`. Vedi [identificatori](/it/guide/identifiers).

## Territorio {#territory}

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
getMunicipality('21004').province // '04000': Bruxelles non ha province, è il codice della regione
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
getProvince('04000') // undefined: la Regione di Bruxelles-Capitale non è una provincia
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // la versione di quel giorno
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: i dati descrivono la situazione dal 2025-01-01
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

I cantoni che coprono un comune in un dato giorno, per impostazione predefinita oggi. Un solo
cantone per la maggior parte dei comuni; più cantoni per le città suddivise (Antwerpen, Gent,
Brussel, …). In quel caso decide l'indirizzo, e il `territory` di ogni cantone descrive la sua
parte.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

L'arrondissement giudiziario in cui si trova un comune, per codice REFNIS. Ogni comune si trova
in esattamente uno, anche una città suddivisa tra più cantoni.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

La provincia in cui si trova un comune, per codice REFNIS. `undefined` per i 19 comuni della
Regione di Bruxelles-Capitale, che non ha province, e per un codice sconosciuto.

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

## Confini dei cantoni {#canton-boundaries}

Solo in `belgica/canton-boundaries`: la geometria conta circa un milione di posizioni, quindi la
root del package non la riesporta (i tipi invece sì). Vedi la
[pagina sui dati](/it/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

I cantoni il cui confine contiene un punto, in un dato giorno (oggi per impostazione
predefinita). Prima la longitudine, poi la latitudine, in gradi decimali (WGS 84), nell'ordine
di GeoJSON. Un cantone per un punto in Belgio; nessuno al di fuori; due per un punto sulla linea
tra due cantoni. Lancia un `RangeError` per coordinate che non sono numeri finiti.

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']: Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []: Parigi
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## Corti e tribunali {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Un tribunale, una sezione o una sede. Gli id sono il `type` del tribunale seguito dal luogo:
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

Il vredegerecht / justice de paix (giudice di pace) di un cantone. Ogni cantone ne ha uno. Un
giudice di pace che ha sede in più luoghi (Philippeville, a Couvin e Florennes) non ha indirizzo
né contatti propri: li hanno le sue sedi, vedi `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // il giudice di pace di Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

Le sezioni di un tribunale, o le sedi di un giudice di pace che ha sede in più luoghi, in un dato
giorno (oggi per impostazione predefinita); vuoto per un tribunale che non ne ha.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

I tribunali la cui area comprende un cantone in un dato giorno (oggi per impostazione
predefinita): il suo giudice di pace e, per ciascun altro tipo, il tribunale che lo copre (il
tribunale nel suo insieme, non le sue sezioni); a Bruxelles entrambi i tribunali linguistici di
un tipo. Vuoto per un cantone sconosciuto.

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

I tribunali che soddisfano tutti i filtri indicati e sono validi in un dato giorno (oggi per
impostazione predefinita); un filtro vuoto restituisce tutti i tribunali di quel giorno.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // le sue sezioni lì
findCourts({ type: 'court-of-appeal' }) // le cinque corti d'appello
```

## Contatti {#contacts}

In ogni entry point che contiene record con contatti: la root, `courts`, `prisons` e
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

Il valore del primo contatto di quel tipo, facoltativamente con quell'etichetta (la cancelleria
o il servizio, come lo nomina la fonte).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Un numero belga nella sua forma scritta nazionale. Lancia un `RangeError` per qualsiasi cosa che
non sia un numero belga in forma E.164.

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

## Carceri {#prisons}

### `getPrison(id)` {#getprison-id}

```ts
function getPrison(id: PrisonId): Prison
function getPrison(id: string, options?: OnDay): Prison | undefined
```

```ts
getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
```

## Justitiehuizen / maisons de justice {#houses-of-justice}

### `getHouseOfJustice(id)` {#gethouseofjustice-id}

```ts
function getHouseOfJustice(id: HouseOfJusticeId): HouseOfJustice
function getHouseOfJustice(id: string, options?: OnDay): HouseOfJustice | undefined
```

```ts
getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
```

## Codici postali {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Un record per id: il codice postale e il codice REFNIS uniti, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

I comuni a cui appartiene un codice postale in un dato giorno (oggi per impostazione
predefinita): uno per quasi tutti i codici; due per `1040`, `1050` e `1804`, dove decide la via.
Gli stessi record `Municipality` restituiti da `getMunicipality`. Vuoto per un codice
sconosciuto.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

I codici postali di un comune in un dato giorno (oggi per impostazione predefinita), per codice
REFNIS, in ordine. Vuoto per un codice sconosciuto.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Competenza {#jurisdiction}

Domande che combinano più dataset. Si trovano solo nella root del package, perché richiedono sia
il territorio sia i tribunali.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

I tribunali di un tipo competenti per un comune in un dato giorno (oggi per impostazione
predefinita), per codice REFNIS: i tribunali la cui area, come la stabilisce la legge
(`cantons`), comprende uno dei cantoni del comune. Un solo tribunale per la maggior parte dei
comuni; a Bruxelles il tribunale di lingua neerlandese e quello di lingua francese; per una città
suddivisa tra cantoni, ogni giudice di pace che ne serve uno. Restituisce il tribunale nel suo
insieme: [`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type)
restituisce la sezione. Vuoto per un codice sconosciuto.

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
    matter?: Matter // il tipo di causa: 'civil' | 'criminal'
}
```

Dove depositare per un comune, per codice REFNIS: per ogni tribunale restituito da
[`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type), la sezione la
cui area comprende il comune, come la stabiliscono i regi decreti adottati in base all'art. 186
del Gerechtelijk Wetboek / Code judiciaire (vedi [sezioni](/it/data/courts#divisions)). Un comune
appartiene alla sezione che lo nomina in `municipalities`, altrimenti a quella che ha il suo
cantone in `cantons`. Un tribunale non suddiviso in sezioni restituisce se stesso. Una città
suddivisa tra cantoni che vanno a sezioni diverse le restituirebbe tutte, e decide l'indirizzo;
oggi nessuna città è suddivisa in questo modo. Vuoto per un codice sconosciuto.

Il rechtbank van eerste aanleg e il politierechtbank di Antwerpen hanno un'area per le cause
civili e un'altra per quelle penali (il
[`criminalArea`](/it/data/courts#civil-and-criminal-cases) di una sezione): Hulshout e Herenthout
vanno a Mechelen nelle prime e a Turnhout nelle seconde. `matter` dice quale. Senza, questi due
comuni ottengono entrambe le sezioni, prima quella civile; ogni altro comune ottiene la stessa
risposta qualunque sia il tipo di causa.

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']: Pont-à-Celles, anche se il resto del suo cantone va a Binche
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']: non suddiviso in sezioni
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']: Hulshout, che nelle cause civili va a Mechelen
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // il cantone copre solo una parte del comune
}
```

I giudici di pace per un comune in un dato giorno (oggi per impostazione predefinita): uno per la
maggior parte dei comuni, più d'uno per una città suddivisa tra cantoni, dove decide l'indirizzo
e il `territory` di ogni cantone dice quale parte copre.

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

I tribunali per un codice postale in un dato giorno (oggi per impostazione predefinita), per
comune: il codice postale dà il comune ([codici postali](/it/data/postal-codes)), il comune i suoi
giudici di pace e i suoi tribunali del tipo richiesto. Una voce per quasi tutti i codici; due per
`1040`, `1050` e `1804`, che appartengono a due comuni, così la risposta non viene mai ridotta a
uno solo di essi. Vuoto per un codice sconosciuto. In una città suddivisa tra cantoni è comunque
la via a decidere tra i giudici di pace, come con `findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Tassi d'interesse {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // percentuale
    period: { from: string; to: string }
}
```

Il tasso applicabile in un giorno, oppure `null` quando per quel giorno non c'è un tasso noto. Un
`Date` viene letto come giorno di calendario locale; una stringa deve iniziare con un giorno
`YYYY-MM-DD` valido (un timestamp ISO va bene, l'ora viene ignorata).

Lancia un `RangeError` per qualsiasi altra cosa: `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` o
un `Date` non valido. Un tasso mancante è `null`; un giorno malformato è un errore, così i due
casi non si possono confondere.

`contractAfter20130316` conta solo per l'interesse commerciale tra il 2013 e il 15 marzo 2015;
per impostazione predefinita si usa il tasso per i contratti più vecchi. Vedi
[tassi d'interesse](/it/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

L'ultimo giorno per cui è noto un tasso, `YYYY-MM-DD`.

## Tempo {#time}

Ogni record ha un periodo di validità, e ogni ricerca accetta un giorno. Gli helper sono esportati
per i tuoi record.

```ts
interface Validity {
    validFrom?: string // primo giorno, YYYY-MM-DD; assente: da prima della copertura
    validTo?: string // ultimo giorno; assente: ancora valido
}

interface OnDay {
    on?: Date | string // oggi per impostazione predefinita; un Date viene letto come giorno locale
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD', oppure un RangeError
```

Ogni dataset indica da quale giorno descrive la situazione; una ricerca per un giorno precedente
lancia un `RangeError` invece di rispondere con la mappa di oggi. Il territorio e l'elenco dei
tribunali derivano dalla legge come modificata per il 1° gennaio 2025; le carceri e le
justitiehuizen / maisons de justice sono note dal giorno in cui i loro siti sono stati letti per
la prima volta. Le versioni precedenti sono previste
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

Gli array esportati (`courts`, `prisons`, …) contengono ogni versione di ogni record. Un record
che la fonte smette di elencare non viene cancellato: mantiene il suo id e riceve un `validTo`, il
giorno prima del controllo settimanale che non l'ha trovato. Uno che la fonte inizia a elencare
riceve un `validFrom`. Così una ricerca per id senza giorno restituisce la versione di oggi, o
l'ultima versione di un record che è terminato: controlla `validTo` prima di depositare qualcosa
lì.

## Dataset {#datasets}

I dataset completi, tipizzati:

| Export            | Tipo                                                 |
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

## Tipi {#types}

| Tipo                                                                                                                                                                                                                 | Descritto in                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`: union degli id presenti nei dati, rigenerate insieme a essi | [Identificatori](/it/guide/identifiers#in-typescript)                     |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                                    |                                                                           |
| `SourceRef` = `{ url: string; retrieved: string }`: da dove provengono i dati di un record                                                                                                                           | [Qualità dei dati](/it/guide/data-quality)                                |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                              |                                                                           |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: nomi come li indica il Gerechtelijk Wetboek / Code judiciaire                                                                                                          |                                                                           |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                                  | [Territorio](/it/data/territory)                                          |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                              | [Corti e tribunali](/it/data/courts#shape)                                |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                                     | [Codici postali](/it/data/postal-codes)                                   |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                           | [Carceri](/it/data/prisons), [Justitiehuizen](/it/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                                     | [Tassi d'interesse](/it/data/interest-rates#shape)                        |
