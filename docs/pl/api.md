# Dokumentacja API {#api-reference}

Wszystko jest eksportowane z głównego punktu pakietu, a każdy zbiór danych ma też własny entry
point:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Tylko to, czego używasz: same stopy procentowe to kilka kilobajtów
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | Zawartość                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `belgica`                      | Wszystko poniżej, z wyjątkiem granic kantonów                                       |
| `belgica/territory`            | Obszary sądowe, okręgi sądowe (arrondissements), kantony, gminy, prowincje, regiony |
| `belgica/canton-boundaries`    | Geometria kantonów i `findCantonsAt`                                                |
| `belgica/courts`               | Sądy i funkcje pomocnicze do kontaktów                                              |
| `belgica/prisons`              | Więzienia i funkcje pomocnicze do kontaktów                                         |
| `belgica/houses-of-justice`    | Justitiehuizen / maisons de justice i funkcje pomocnicze do kontaktów               |
| `belgica/interest-rates`       | Stopy procentowe                                                                    |
| `belgica/postal-codes`         | Kody pocztowe, z gminami, do których należą                                         |
| `belgica/data/*.json`          | Surowe pliki z danymi                                                               |
| `belgica/schema/*.schema.json` | [JSON Schema](/pl/guide/schema)                                                     |
| `belgica/datapackage.json`     | [Deskryptor data package](/pl/guide/schema#datapackage-json)                        |

Konwencje:

- Wyszukiwania po id zwracają `undefined`, gdy nic nie pasuje; funkcje zwracające listy zwracają
  pustą tablicę.
- Funkcje rzucają wyjątek tylko przy niepoprawnych danych wejściowych: błędnie zapisany dzień
  albo dzień sprzed zakresu danych (`RangeError`). Nigdy z powodu brakujących danych.
- Każde wyszukiwanie przyjmuje opcjonalny dzień, `{ on: '2025-06-01' }` albo `Date`, a bez niego
  odpowiada dla dnia dzisiejszego. Wyszukiwanie po id zawsze znajduje znany rekord: dzisiejszą
  wersję albo ostatnią wersję rekordu, który wygasł. Zobacz [czas](#time).
- Eksportowane zbiory danych są `readonly`: skopiuj je przed sortowaniem lub zmianą
  (`[...courts].sort()`).
- Wyszukiwanie ze znanym id (literał taki jak `'gent-1'` albo wartość typu `CantonId`) zwraca
  sam rekord, nigdy `undefined`. Każdy inny napis zwraca `Record | undefined`.
  Zobacz [identyfikatory](/pl/guide/identifiers).

## Terytorium {#territory}

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
getMunicipality('21004').province // '04000': Bruksela nie ma prowincji, to kod regionu
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
getProvince('04000') // undefined: Region Stołeczny Brukseli nie jest prowincją
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // wersja z tego dnia
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: dane opisują stan od 2025-01-01
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

Kantony obejmujące gminę w danym dniu, domyślnie dziś. Jeden kanton dla większości gmin; kilka
dla miast podzielonych (Antwerpen, Gent, Brussel, …). Wtedy rozstrzyga adres z ulicą, a
`territory` każdego kantonu opisuje jego część.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

Okręg sądowy (arrondissement), w którym leży gmina, po kodzie REFNIS. Każda gmina leży w
dokładnie jednym, nawet miasto podzielone między kilka kantonów.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

Prowincja, w której leży gmina, po kodzie REFNIS. `undefined` dla 19 gmin Regionu Stołecznego
Brukseli, który nie ma prowincji, oraz dla nieznanego kodu.

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

## Granice kantonów {#canton-boundaries}

Tylko w `belgica/canton-boundaries`: geometria to około miliona pozycji, więc główny punkt
pakietu jej nie reeksportuje (jej typy owszem). Zobacz
[stronę z danymi](/pl/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

Kantony, których granica obejmuje punkt, w danym dniu (domyślnie dziś). Najpierw długość, potem
szerokość geograficzna, w stopniach dziesiętnych (WGS 84), w kolejności GeoJSON. Jeden kanton
dla punktu w Belgii; żaden poza nią; dwa dla punktu na linii między dwoma kantonami. Rzuca
`RangeError` dla współrzędnych, które nie są skończonymi liczbami.

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']: Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []: Paryż
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## Sądy {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Sąd, wydział lub siedziba. Id to `type` sądu, a po nim miejscowość:
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

Vredegerecht / justice de paix (sąd pokoju) kantonu. Każdy kanton ma jeden. Vredegerecht /
justice de paix, który zasiada w kilku miejscach (Philippeville, w Couvin i Florennes), nie ma
własnego adresu ani kontaktów: mają je jego siedziby, zobacz `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // vredegerecht w Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

Wydziały sądu albo siedziby vredegerecht / justice de paix, który zasiada w kilku miejscach, w
danym dniu (domyślnie dziś); pusta tablica dla sądu, który ich nie ma.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

Sądy, których obszar obejmuje kanton w danym dniu (domyślnie dziś): jego vredegerecht / justice
de paix i, dla każdego innego typu, sąd, który go obejmuje (sąd jako całość, nie jego wydziały);
w Brukseli oba sądy językowe danego typu. Pusta tablica dla nieznanego kantonu.

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

Sądy, które spełniają każdy podany filtr i obowiązują w danym dniu (domyślnie dziś); pusty filtr
zwraca wszystkie sądy z tego dnia.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // jego wydziały w tym okręgu
findCourts({ type: 'court-of-appeal' }) // pięć hoven van beroep / cours d'appel
```

## Dane kontaktowe {#contacts}

W każdym entry poincie, który ma rekordy z kontaktami: w głównym, `courts`, `prisons` i
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

Wartość pierwszego kontaktu danego typu, opcjonalnie z daną etykietą (sekretariat lub służba,
tak jak nazywa je źródło).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Belgijski numer w krajowej formie zapisu. Rzuca `RangeError` dla wszystkiego, co nie jest
belgijskim numerem w formacie E.164.

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

## Więzienia {#prisons}

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

## Kody pocztowe {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Rekord po id: kod pocztowy i kod REFNIS połączone, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

Gminy, do których należy kod pocztowy w danym dniu (domyślnie dziś): jedna dla niemal każdego
kodu; dwie dla `1040`, `1050` i `1804`, gdzie rozstrzyga ulica. Te same rekordy `Municipality`,
które zwraca `getMunicipality`. Pusta tablica dla nieznanego kodu.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

Kody pocztowe gminy w danym dniu (domyślnie dziś), po kodzie REFNIS, w kolejności. Pusta
tablica dla nieznanego kodu.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Właściwość {#jurisdiction}

Pytania łączące kilka zbiorów danych. Są tylko w głównym punkcie pakietu, bo potrzebują
zarówno terytorium, jak i sądów.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

Sądy danego typu właściwe dla gminy w danym dniu (domyślnie dziś), po kodzie REFNIS: sądy,
których obszar, tak jak określa go ustawa (`cantons`), obejmuje jeden z kantonów gminy. Jeden sąd
dla większości gmin; w Brukseli sąd niderlandzkojęzyczny i francuskojęzyczny; dla miasta
podzielonego między kantony każdy vredegerecht / justice de paix, który obsługuje jeden z nich.
Zwraca sąd jako całość: wydział podaje
[`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type). Pusta
tablica dla nieznanego kodu.

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
    matter?: Matter // rodzaj sprawy: 'civil' | 'criminal'
}
```

Gdzie składać pisma dla gminy, po kodzie REFNIS: dla każdego sądu, który zwraca
[`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type), wydział, którego
obszar obejmuje gminę, tak jak określają go dekrety królewskie wydane na podstawie art. 186
Gerechtelijk Wetboek / Code judiciaire (zobacz [wydziały](/pl/data/courts#divisions)). Gmina
należy do wydziału, który wymienia ją w `municipalities`, a w przeciwnym razie do tego, który ma
jej kanton w `cantons`. Dla sądu, który nie jest podzielony, wynikiem jest sam sąd. Miasto
podzielone między kantony, które trafiają do różnych wydziałów, dałoby każdy z nich, a
rozstrzygałby adres z ulicą; dziś żadne miasto nie jest tak podzielone. Pusta tablica dla
nieznanego kodu.

Rechtbank van eerste aanleg Antwerpen i politierechtbank Antwerpen mają jeden obszar dla spraw
cywilnych, a inny dla karnych ([`criminalArea`](/pl/data/courts#civil-and-criminal-cases)
wydziału): Hulshout i Herenthout trafiają w pierwszych do Mechelen, a w drugich do Turnhout.
`matter` mówi, o które chodzi. Bez niego te dwie gminy dostają oba wydziały, najpierw cywilny;
każda inna gmina dostaje tę samą odpowiedź niezależnie od rodzaju sprawy.

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']: Pont-à-Celles, choć reszta jego kantonu trafia do Binche
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']: niepodzielony
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']: Hulshout, które w sprawach cywilnych trafia do Mechelen
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // kanton obejmuje tylko część gminy
}
```

Vredegerechten / justices de paix dla gminy w danym dniu (domyślnie dziś): jeden dla większości
gmin, kilka dla miasta podzielonego między kantony, gdzie rozstrzyga adres z ulicą, a
`territory` każdego kantonu mówi, którą część obejmuje.

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

Sądy dla kodu pocztowego w danym dniu (domyślnie dziś), osobno dla każdej gminy: kod pocztowy
wskazuje gminę ([kody pocztowe](/pl/data/postal-codes)), a gmina jej vredegerechten / justices
de paix i jej sądy żądanego typu. Jeden wpis dla niemal każdego kodu; dwa dla `1040`, `1050` i
`1804`, które należą do dwóch gmin, więc odpowiedź nigdy nie jest sprowadzana do jednej z nich.
Pusta tablica dla nieznanego kodu. W mieście podzielonym między kantony między vredegerechten
nadal rozstrzyga ulica, tak jak w `findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Stopy procentowe {#interest-rates}

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

Stopa obowiązująca w danym dniu albo `null`, gdy w danych nie ma dla niego stopy. `Date` jest
odczytywane jako lokalny dzień kalendarzowy; napis musi zaczynać się od poprawnego dnia
`YYYY-MM-DD` (znacznik czasu ISO jest w porządku, jego godzina jest ignorowana).

Rzuca `RangeError` dla wszystkiego innego: `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` albo
niepoprawnej `Date`. Brakująca stopa to `null`; błędnie zapisany dzień to błąd, więc tych dwóch
przypadków nie da się pomylić.

`contractAfter20130316` ma znaczenie tylko dla odsetek handlowych od 2013 roku do 15 marca 2015;
domyślnie używana jest stopa dla starszych umów. Zobacz
[stopy procentowe](/pl/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

Ostatni dzień, dla którego w danych jest stopa, `YYYY-MM-DD`.

## Czas {#time}

Każdy rekord ma okres obowiązywania, a każde wyszukiwanie przyjmuje dzień. Funkcje pomocnicze
są eksportowane na potrzeby twoich własnych rekordów.

```ts
interface Validity {
    validFrom?: string // pierwszy dzień, YYYY-MM-DD; brak: od czasu sprzed zakresu
    validTo?: string // ostatni dzień; brak: nadal obowiązuje
}

interface OnDay {
    on?: Date | string // domyślnie dziś; Date jest odczytywane jako lokalny dzień
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD' albo RangeError
```

Każdy zbiór danych podaje, od którego dnia opisuje stan rzeczy; wyszukiwanie dla
wcześniejszego dnia rzuca `RangeError`, zamiast odpowiadać dzisiejszą mapą. Terytorium i lista
sądów wynikają z ustawy w brzmieniu obowiązującym 1 stycznia 2025; więzienia i justitiehuizen /
maisons de justice są znane od dnia, w którym ich strony zostały odczytane po raz pierwszy.
Wcześniejsze wersje są planowane ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

Eksportowane tablice (`courts`, `prisons`, …) zawierają każdą wersję każdego rekordu. Rekord,
którego źródło przestaje wymieniać, nie jest usuwany: zachowuje swoje id i dostaje `validTo`,
dzień przed cotygodniową kontrolą, która go nie znalazła. Rekord, który źródło zaczyna
wymieniać, dostaje `validFrom`. Dlatego wyszukiwanie po id bez dnia zwraca dzisiejszą wersję
albo ostatnią wersję rekordu, który wygasł: sprawdź `validTo`, zanim coś tam złożysz.

## Zbiory danych {#datasets}

Pełne zbiory danych, z typami:

| Eksport           | Typ                                                  |
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

## Typy {#types}

| Typ                                                                                                                                                                                                              | Opisane na stronie                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`: unie id występujących w danych, generowane razem z nimi | [Identyfikatory](/pl/guide/identifiers#in-typescript)                                            |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                                |                                                                                                  |
| `SourceRef` = `{ url: string; retrieved: string }`: skąd pochodzą dane rekordu                                                                                                                                   | [Jakość danych](/pl/guide/data-quality)                                                          |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                          |                                                                                                  |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: nazwy w brzmieniu z Gerechtelijk Wetboek / Code judiciaire                                                                                                         |                                                                                                  |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                              | [Terytorium](/pl/data/territory)                                                                 |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                          | [Sądy](/pl/data/courts#shape)                                                                    |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                                 | [Kody pocztowe](/pl/data/postal-codes)                                                           |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                       | [Więzienia](/pl/data/prisons), [Justitiehuizen / maisons de justice](/pl/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                                 | [Stopy procentowe](/pl/data/interest-rates#shape)                                                |
