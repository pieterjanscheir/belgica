# Довідник API {#api-reference}

Усе експортується з кореня пакета, а кожен набір даних також має власний entry point:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Лише те, чим ви користуєтеся: самі процентні ставки — це кілька кілобайтів
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | Вміст                                                                  |
| ------------------------------ | ---------------------------------------------------------------------- |
| `belgica`                      | Усе, що нижче, крім меж кантонів                                       |
| `belgica/territory`            | Апеляційні округи, судові округи, кантони, громади, провінції, регіони |
| `belgica/canton-boundaries`    | Геометрія кантонів і `findCantonsAt`                                   |
| `belgica/courts`               | Суди і допоміжні функції для контактів                                 |
| `belgica/prisons`              | В'язниці і допоміжні функції для контактів                             |
| `belgica/houses-of-justice`    | Justitiehuizen / maisons de justice і допоміжні функції для контактів  |
| `belgica/interest-rates`       | Процентні ставки                                                       |
| `belgica/postal-codes`         | Поштові індекси з громадами, до яких вони належать                     |
| `belgica/data/*.json`          | Сирі файли даних                                                       |
| `belgica/schema/*.schema.json` | [JSON Schemas](/uk/guide/schema)                                       |
| `belgica/datapackage.json`     | [Дескриптор data package](/uk/guide/schema#datapackage-json)           |

Домовленості:

- Пошук за id повертає `undefined`, коли нічого не знайдено; функції-списки повертають
  порожній масив.
- Функції викидають помилку лише для неправильних вхідних даних: неправильно записаного дня або
  дня до початку охоплення даних (`RangeError`). Ніколи — через відсутні дані.
- Кожна функція пошуку приймає необов'язковий день, `{ on: '2025-06-01' }` або `Date`, а без
  нього відповідає на сьогодні. Пошук за id завжди знаходить відомий запис: сьогоднішню версію
  або останню версію запису, що припинився. Див. [час](#time).
- Експортовані набори даних — `readonly`: копіюйте їх перед сортуванням чи зміною
  (`[...courts].sort()`).
- Пошук за відомим id (літерал, як-от `'gent-1'`, або значення типу `CantonId`) повертає сам
  запис, ніколи `undefined`. Будь-який інший рядок повертає `Record | undefined`.
  Див. [Ідентифікатори](/uk/guide/identifiers).

## Територія {#territory}

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
getMunicipality('21004').province // '04000': у Брюсселі немає провінції, це код регіону
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
getProvince('04000') // undefined: Брюссельський столичний регіон — не провінція
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // версія на той день
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: дані описують стан із 2025-01-01
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

Кантони, що охоплюють громаду на певний день, за замовчуванням на сьогодні. Для більшості
громад — один кантон; кілька — для поділених міст (Antwerpen, Gent, Brussel, …). Тоді вирішує
вулична адреса, а `territory` кожного кантону описує його частину.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

Судовий округ (arrondissement), у якому лежить громада, за кодом REFNIS. Кожна громада лежить
рівно в одному, навіть місто, поділене між кількома кантонами.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

Провінція, у якій лежить громада, за кодом REFNIS. `undefined` для 19 громад Брюссельського
столичного регіону, який не має провінції, і для невідомого коду.

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

## Межі кантонів {#canton-boundaries}

Лише в `belgica/canton-boundaries`: геометрія — це близько мільйона позицій, тож корінь пакета
її не реекспортує (а її типи — так). Див. [сторінку даних](/uk/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

Кантони, межа яких містить точку, на певний день (за замовчуванням на сьогодні). Спершу
довгота, потім широта, у десяткових градусах (WGS 84), як їх упорядковує GeoJSON. Один кантон
для точки в Бельгії; жодного — поза нею; два — для точки на лінії між двома кантонами. Викидає
`RangeError` для координат, які не є скінченними числами.

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']: Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []: Париж
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## Суди {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Суд, відділення чи місце засідань. Id — це `type` суду, за яким іде місце:
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

Vredegerecht / justice de paix (мировий суд) кантону. Кожен кантон має такий суд.
Vredegerecht / justice de paix, що засідає в кількох місцях (Philippeville — у Couvin і
Florennes), не має власної адреси чи контактів: їх мають його місця засідань, див.
`getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // vredegerecht Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

Відділення суду або місця засідань vredegerecht / justice de paix, що засідає в кількох
місцях, на певний день (за замовчуванням на сьогодні); порожньо для суду без них.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

Суди, територія яких містить кантон на певний день (за замовчуванням на сьогодні): його
vredegerecht / justice de paix і, для кожного іншого типу, суд, що його охоплює (суд у цілому,
а не його відділення); у Брюсселі — обидва мовні суди одного типу. Порожньо для невідомого
кантону.

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

Суди, що відповідають кожному заданому фільтру і чинні на певний день (за замовчуванням на
сьогодні); порожній фільтр повертає всі суди на той день.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // його відділення там
findCourts({ type: 'court-of-appeal' }) // п'ять hoven van beroep / cours d'appel
```

## Контакти {#contacts}

У кожному entry point, що має записи з контактами: корінь, `courts`, `prisons` і
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

Значення першого контакту цього типу, за потреби з цією міткою (канцелярія чи служба, як її
називає джерело).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Бельгійський номер у національній письмовій формі. Викидає `RangeError` для всього, що не є
бельгійським номером у формі E.164.

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

## В'язниці {#prisons}

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

## Поштові індекси {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Запис за id: поштовий індекс і код REFNIS, з'єднані, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

Громади, до яких належить поштовий індекс на певний день (за замовчуванням на сьогодні): одна
майже для кожного індексу; дві для `1040`, `1050` і `1804`, де вирішує вулиця. Ті самі записи
`Municipality`, що їх дає `getMunicipality`. Порожньо для невідомого індексу.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

Поштові індекси громади на певний день (за замовчуванням на сьогодні), за кодом REFNIS, за
порядком. Порожньо для невідомого коду.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Компетенція {#jurisdiction}

Питання, що поєднують кілька наборів даних. Вони є лише в корені пакета, бо потребують і
території, і судів.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

Суди певного типу, компетентні щодо громади на певний день (за замовчуванням на сьогодні), за
кодом REFNIS: суди, територія яких, як її визначає закон (`cantons`), містить один із кантонів
громади. Для більшості громад — один суд; у Брюсселі — нідерландськомовний і франкомовний суд;
для міста, поділеного між кантонами, — кожен vredegerecht / justice de paix, що обслуговує один
із них. Функція дає суд у цілому: відділення дає
[`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type). Порожньо
для невідомого коду.

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
    matter?: Matter // вид справи: 'civil' | 'criminal'
}
```

Куди подавати для громади, за кодом REFNIS: для кожного суду, який дає
[`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type), — відділення,
територія якого містить громаду, як її визначають королівські укази, видані на підставі ст. 186
Gerechtelijk Wetboek / Code judiciaire (див. [Відділення](/uk/data/courts#divisions)). Громада
належить до відділення, яке називає її в `municipalities`, а інакше — до того, що має її кантон
у `cantons`. Суд, не поділений на відділення, дає сам себе. Місто, поділене між кантонами, що
відходять до різних відділень, дало б кожне з них, і вирішувала б вулична адреса; сьогодні жодне
місто так не поділене. Порожньо для невідомого коду.

Rechtbank van eerste aanleg Antwerpen і politierechtbank Antwerpen мають одну територію для
цивільних справ і іншу — для кримінальних
([`criminalArea`](/uk/data/courts#civil-and-criminal-cases) відділення): Hulshout і Herenthout у
перших відходять до Mechelen, а в других — до Turnhout. `matter` каже, про які йдеться. Без нього
ці дві громади отримують обидва відділення, цивільне першим; кожна інша громада отримує ту саму
відповідь, хоч би яким був вид справи.

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']: Pont-à-Celles, хоча решта його кантону відходить до Binche
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']: не поділений
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']: Hulshout, який у цивільних справах відходить до Mechelen
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // кантон охоплює лише частину громади
}
```

Vredegerechten / justices de paix для громади на певний день (за замовчуванням на сьогодні):
один для більшості громад, кілька — для міста, поділеного між кантонами, де вирішує вулична
адреса, а `territory` кожного кантону каже, яку частину він охоплює.

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

Суди для поштового індексу на певний день (за замовчуванням на сьогодні), для кожної громади
окремо: поштовий індекс дає громаду ([поштові індекси](/uk/data/postal-codes)), громада — свої
vredegerechten / justices de paix і свої суди запитаного типу. Один елемент майже для кожного
індексу; два для `1040`, `1050` і `1804`, які належать двом громадам, тож відповідь ніколи не
зводиться до однієї з них. Порожньо для невідомого індексу. У місті, поділеному між кантонами,
між vredegerechten / justices de paix і далі вирішує вулиця, як і з `findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Процентні ставки {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // відсотки
    period: { from: string; to: string }
}
```

Ставка, що діє в певний день, або `null`, коли для нього ставка невідома. `Date` читається як
локальний календарний день; рядок має починатися з дійсного дня `YYYY-MM-DD` (часова мітка ISO
теж підходить, час ігнорується).

Для всього іншого викидає `RangeError`: `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` чи
недійсна `Date`. Відсутня ставка — це `null`; неправильно записаний день — помилка, тож ці два
випадки не можна сплутати.

`contractAfter20130316` має значення лише для комерційних процентів між 2013 роком і 15 березня
2015 року; за замовчуванням використовується ставка для старіших договорів. Див.
[процентні ставки](/uk/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

Останній день, для якого відома ставка, `YYYY-MM-DD`.

## Час {#time}

Кожен запис має період чинності, а кожна функція пошуку приймає день. Допоміжні функції
експортуються для ваших власних записів.

```ts
interface Validity {
    validFrom?: string // перший день, YYYY-MM-DD; немає: ще до початку охоплення
    validTo?: string // останній день; немає: досі чинний
}

interface OnDay {
    on?: Date | string // за замовчуванням сьогодні; Date читається як локальний день
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD' або RangeError
```

Кожен набір даних указує, з якого дня він описує ситуацію; пошук на раніший день викидає
`RangeError`, а не відповідає сьогоднішньою картою. Територія і перелік судів випливають із
закону в редакції на 1 січня 2025 року; в'язниці та justitiehuizen / maisons de justice відомі
з дня, коли їхні сайти вперше прочитали. Попередні версії заплановано
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

Експортовані масиви (`courts`, `prisons`, …) містять усі версії кожного запису. Запис, який
джерело перестає наводити, не видаляється: він зберігає свій id і отримує `validTo` — день
перед щотижневою перевіркою, яка його не знайшла. Запис, який джерело починає наводити,
отримує `validFrom`. Тож пошук за id без дня повертає сьогоднішню версію або останню версію
запису, що припинився: перевіряйте `validTo`, перш ніж щось туди подавати.

## Набори даних {#datasets}

Повні набори даних, типізовані:

| Експорт           | Тип                                                  |
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

## Типи {#types}

| Тип                                                                                                                                                                                                             | Описано на сторінці                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`: union-типи id з даних, перегенеровуються разом із ними | [Ідентифікатори](/uk/guide/identifiers#in-typescript)                                           |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                               |                                                                                                 |
| `SourceRef` = `{ url: string; retrieved: string }`: звідки походять дані запису                                                                                                                                 | [Якість даних](/uk/guide/data-quality)                                                          |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                         |                                                                                                 |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: назви, як їх наводить Gerechtelijk Wetboek / Code judiciaire                                                                                                      |                                                                                                 |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                             | [Територія](/uk/data/territory)                                                                 |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                         | [Суди](/uk/data/courts#shape)                                                                   |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                                | [Поштові індекси](/uk/data/postal-codes)                                                        |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                      | [В'язниці](/uk/data/prisons), [Justitiehuizen / maisons de justice](/uk/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                                | [Процентні ставки](/uk/data/interest-rates#shape)                                               |
