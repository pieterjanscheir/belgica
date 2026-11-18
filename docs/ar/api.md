# مرجع API {#api-reference}

كل شيء مُصدَّر من جذر الحزمة، ولكل مجموعة بيانات أيضًا entry point خاص بها:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// ما تستخدمه فقط: أسعار الفائدة وحدها بضعة كيلوبايتات
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | المحتوى                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `belgica`                      | كل ما يلي، باستثناء حدود الكانتونات                                                |
| `belgica/territory`            | المناطق القضائية، والدوائر القضائية، والكانتونات، والبلديات، والمقاطعات، والأقاليم |
| `belgica/canton-boundaries`    | هندسة الكانتونات، و`findCantonsAt`                                                 |
| `belgica/courts`               | المحاكم، ودوال الاتصال المساعدة                                                    |
| `belgica/prisons`              | السجون، ودوال الاتصال المساعدة                                                     |
| `belgica/houses-of-justice`    | الـjustitiehuizen / maisons de justice، ودوال الاتصال المساعدة                     |
| `belgica/interest-rates`       | أسعار الفائدة                                                                      |
| `belgica/postal-codes`         | الرموز البريدية، مع البلديات التي تنتمي إليها                                      |
| `belgica/data/*.json`          | ملفات البيانات الخام                                                               |
| `belgica/schema/*.schema.json` | [مخططات JSON Schema](/ar/guide/schema)                                             |
| `belgica/datapackage.json`     | [واصف حزمة البيانات](/ar/guide/schema#datapackage-json)                            |

الأعراف:

- البحث بالمعرّف يُرجع `undefined` حين لا يطابق شيء؛ ودوال القوائم تُرجع مصفوفة فارغة.
- لا ترمي الدوال أخطاء إلا للمدخلات غير الصالحة: يوم مكتوب بصيغة خاطئة، أو يوم يسبق تغطية البيانات
  (`RangeError`). ولا ترمي أبدًا بسبب بيانات ناقصة.
- كل دالة بحث تقبل يومًا اختياريًا، `{ on: '2025-06-01' }` أو `Date`، وتجيب عن اليوم الحالي دونه.
  البحث بالمعرّف يجد دائمًا السجل المعروف: نسخة اليوم، أو النسخة الأخيرة لسجل انتهى. انظر
  [الزمن](#time).
- مجموعات البيانات المُصدَّرة `readonly`: انسخها قبل الفرز أو التعديل (`[...courts].sort()`).
- البحث بمعرّف معروف (قيمة حرفية مثل `'gent-1'`، أو قيمة من النوع `CantonId`) يُرجع السجل نفسه،
  ولا يُرجع `undefined` أبدًا. وأي سلسلة أخرى تُرجع `Record | undefined`.
  انظر [المعرّفات](/ar/guide/identifiers).

## الإقليم {#territory}

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
getMunicipality('21004').province // '04000': لا مقاطعة لـBrussel، هذا رمز الإقليم
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
getProvince('04000') // undefined: إقليم Brussel العاصمة ليس مقاطعة
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // نسخة ذلك اليوم
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: البيانات تصف الوضع من 2025-01-01 فصاعدًا
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

الكانتونات التي تغطي بلدية في يوم ما، اليوم الحالي افتراضيًا. كانتون واحد لمعظم البلديات؛ وعدة
كانتونات للمدن المقسّمة (Antwerpen وGent وBrussel، …). وعندها يكون عنوان الشارع هو الفيصل، ويصف
`territory` كل كانتون جزأه.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

الدائرة القضائية التي تقع فيها بلدية، برمز REFNIS. كل بلدية تقع في دائرة واحدة بالضبط، حتى المدينة
المقسّمة على عدة كانتونات.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

المقاطعة التي تقع فيها بلدية، برمز REFNIS. وتُرجع `undefined` للبلديات الـ19 في إقليم Brussel
العاصمة، الذي لا مقاطعة له، ولرمز مجهول.

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

## حدود الكانتونات {#canton-boundaries}

موجودة فقط في `belgica/canton-boundaries`: الهندسة نحو مليون موضع، لذا لا يعيد جذر الحزمة
تصديرها (لكنه يصدّر أنواعها). انظر [صفحة البيانات](/ar/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

الكانتونات التي يحوي حدُّها نقطةً ما، في يوم ما (اليوم الحالي افتراضيًا). خط الطول أولًا، ثم خط
العرض، بالدرجات العشرية (WGS 84)، كما يرتبهما GeoJSON. كانتون واحد لنقطة في بلجيكا؛ ولا شيء لنقطة
خارجها؛ واثنان لنقطة على الخط الفاصل بين كانتونين. ترمي `RangeError` لإحداثيات ليست أعدادًا منتهية.

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

## المحاكم {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

محكمة أو قسم أو مقر. المعرّفات هي `type` المحكمة متبوعًا بالمكان:
`justice-of-the-peace-gent-1`، `police-court-brussel-fr`، `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

الـvredegerecht / justice de paix (محكمة الصلح) لكانتون ما. لكل كانتون واحد. والـvredegerecht الذي
يجلس في عدة أماكن (Philippeville، في Couvin وFlorennes) ليس له عنوان ولا بيانات اتصال خاصة به:
فهي لمقاره، انظر `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // محكمة Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

أقسام محكمة، أو مقار vredegerecht / justice de paix يجلس في عدة أماكن، في يوم ما (اليوم الحالي
افتراضيًا)؛ وفارغة لمحكمة بلا أقسام.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

المحاكم التي يحوي نطاقُها كانتونًا في يوم ما (اليوم الحالي افتراضيًا): الـvredegerecht / justice de
paix الخاص به، ومن كل نوع آخر، المحكمة التي تغطيه (المحكمة ككل، لا أقسامها)؛ وفي Brussel محكمتا
اللغتين من النوع الواحد. وفارغة لكانتون مجهول.

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

المحاكم التي تطابق كل المرشِّحات المعطاة وتسري في يوم ما (اليوم الحالي افتراضيًا)؛ والمرشِّح الفارغ
يُرجع كل محاكم ذلك اليوم.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // أقسامها هناك
findCourts({ type: 'court-of-appeal' }) // محاكم الاستئناف الخمس
```

## بيانات الاتصال {#contacts}

في كل entry point يتضمن سجلات بها بيانات اتصال: الجذر، و`courts`، و`prisons`،
و`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

قيمة أول جهة اتصال من ذلك النوع، واختياريًا بتلك التسمية (القلم أو المصلحة، كما يسمّيها المصدر).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

رقم بلجيكي بصيغته الوطنية المكتوبة. ترمي `RangeError` لأي شيء ليس رقمًا بلجيكيًا بصيغة E.164.

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

## السجون {#prisons}

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

## الرموز البريدية {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

سجل بالمعرّف: الرمز البريدي ورمز REFNIS موصولين، `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

البلديات التي ينتمي إليها رمز بريدي في يوم ما (اليوم الحالي افتراضيًا): واحدة لكل رمز تقريبًا؛
واثنتان لـ`1040` و`1050` و`1804`، حيث يكون الشارع هو الفيصل. وهي سجلات `Municipality` نفسها التي
تعطيها `getMunicipality`. وفارغة لرمز مجهول.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

الرموز البريدية لبلدية في يوم ما (اليوم الحالي افتراضيًا)، برمز REFNIS، مرتبة. وفارغة لرمز مجهول.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## الاختصاص {#jurisdiction}

أسئلة تجمع بين مجموعات بيانات. وهي في جذر الحزمة فقط، لأنها تحتاج إلى الإقليم والمحاكم معًا.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

محاكم نوعٍ ما المختصة ببلدية في يوم ما (اليوم الحالي افتراضيًا)، برمز REFNIS: المحاكم التي يحوي
نطاقها، كما يحدده القانون (`cantons`)، أحد كانتونات البلدية. محكمة واحدة لمعظم البلديات؛ وفي Brussel
المحكمة الناطقة بالهولندية والمحكمة الناطقة بالفرنسية؛ ولمدينة مقسّمة على كانتونات، كل
vredegerecht / justice de paix يخدم أحدها. وهي تعطي المحكمة ككل: أي أقسامها ينظر في القضية يحدده
مرسوم ملكي وليس في البيانات بعد، فاختر من بين `getDivisions(court.id)`. وفارغة لرمز مجهول.

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
    partial: boolean // الكانتون لا يغطي إلا جزءًا من البلدية
}
```

محاكم الـvredegerecht / justice de paix لبلدية في يوم ما (اليوم الحالي افتراضيًا): واحدة لمعظم
البلديات، وعدة محاكم لمدينة مقسّمة على كانتونات، حيث يكون عنوان الشارع هو الفيصل ويقول `territory`
كل كانتون أي جزء يغطيه.

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

المحاكم لرمز بريدي في يوم ما (اليوم الحالي افتراضيًا)، لكل بلدية على حدة: الرمز البريدي يعطي
البلدية ([الرموز البريدية](/ar/data/postal-codes))، والبلدية تعطي محاكم الـvredegerecht / justice de
paix الخاصة بها ومحاكمها من النوع المطلوب. مدخل واحد لكل رمز تقريبًا؛ ومدخلان لـ`1040` و`1050`
و`1804`، التي تنتمي إلى بلديتين، فلا تُختزل الإجابة أبدًا إلى إحداهما. وفارغة لرمز مجهول. وفي مدينة
مقسّمة على كانتونات، لا يزال الشارع هو الفيصل بين محاكم الـvredegerecht، كما في
`findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## أسعار الفائدة {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // نسبة مئوية
    period: { from: string; to: string }
}
```

السعر الساري في يوم ما، أو `null` حين لا يكون له سعر مسجَّل. تُقرأ `Date` بوصفها يومًا تقويميًا
محليًا؛ ويجب أن تبدأ السلسلة النصية بيوم صالح بصيغة `YYYY-MM-DD` (الطابع الزمني ISO مقبول، ويُتجاهل
وقته).

ترمي `RangeError` لأي شيء آخر: `'2013-1-15'`، `'15/01/2013'`، `'2013-02-30'` أو `Date` غير صالح.
السعر الناقص `null`؛ واليوم المكتوب بصيغة خاطئة خطأ، فلا يمكن الخلط بينهما.

لا يهم `contractAfter20130316` إلا للفائدة التجارية بين 2013 و15 مارس 2015؛ وافتراضيًا يُستخدم سعر
العقود الأقدم. انظر [أسعار الفائدة](/ar/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

آخر يوم له سعر مسجَّل، بصيغة `YYYY-MM-DD`.

## الزمن {#time}

لكل سجل فترة سريان، وكل دالة بحث تقبل يومًا. والدوال المساعدة مُصدَّرة لسجلاتك الخاصة.

```ts
interface Validity {
    validFrom?: string // اليوم الأول، YYYY-MM-DD؛ غيابه: منذ ما قبل التغطية
    validTo?: string // اليوم الأخير؛ غيابه: لا يزال ساريًا
}

interface OnDay {
    on?: Date | string // اليوم الحالي افتراضيًا؛ تُقرأ Date بوصفها يومًا محليًا
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD'، أو RangeError
```

تذكر كل مجموعة بيانات اليوم الذي تبدأ منه وصف الوضع؛ والبحث عن يوم سابق يرمي `RangeError` بدلًا من
الإجابة بخريطة اليوم. الإقليم وقائمة المحاكم مستمدان من القانون كما عُدّل اعتبارًا من 1 يناير 2025؛
أما السجون والـjustitiehuizen / maisons de justice فمعروفة منذ اليوم الذي قُرئت فيه مواقعها أول مرة.
والنسخ الأقدم مخطط لها ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

المصفوفات المُصدَّرة (`courts`، `prisons`، …) تحوي كل نسخة من كل سجل. السجل الذي يتوقف المصدر عن
إدراجه لا يُحذف: يحتفظ بمعرّفه ويحصل على `validTo`، وهو اليوم السابق للفحص الأسبوعي الذي لم يجده. أما
الذي يبدأ المصدر بإدراجه فيحصل على `validFrom`. لذا فإن البحث بالمعرّف دون يوم يُرجع نسخة اليوم، أو
النسخة الأخيرة لسجل انتهى: تحقق من `validTo` قبل أن تودع شيئًا هناك.

## مجموعات البيانات {#datasets}

مجموعات البيانات الكاملة، بأنواعها:

| التصدير           | النوع                                                |
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

## الأنواع {#types}

| النوع                                                                                                                                                                                                                 | موصوف في                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `JudicialAreaId`، `ArrondissementId`، `CantonId`، `RegionId`، `ProvinceId`، `MunicipalityId`، `CourtId`، `PrisonId`، `HouseOfJusticeId`، `PostalCodeId`: أنواع union للمعرّفات الموجودة في البيانات، يُعاد توليدها معها | [المعرّفات](/ar/guide/identifiers#in-typescript)                                               |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                                     |                                                                                               |
| `SourceRef` = `{ url: string; retrieved: string }`: مصدر بيانات السجل                                                                                                                                                 | [جودة البيانات](/ar/guide/data-quality)                                                       |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                               |                                                                                               |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: الأسماء كما يوردها Gerechtelijk Wetboek / Code judiciaire                                                                                                               |                                                                                               |
| `JudicialArea`، `Arrondissement`، `Canton`، `Region`، `Province`، `Municipality`، `LegalBasis`، `Validity`، `OnDay`                                                                                                   | [الإقليم](/ar/data/territory)                                                                 |
| `Court`، `CourtType`، `CourtFilter`، `Address`، `Contact`، `ContactType`، `CantonCourt`                                                                                                                               | [المحاكم](/ar/data/courts#shape)                                                              |
| `PostalCode`، `PostalCodeCourts`                                                                                                                                                                                      | [الرموز البريدية](/ar/data/postal-codes)                                                      |
| `Prison`، `HouseOfJustice`                                                                                                                                                                                            | [السجون](/ar/data/prisons)، [Justitiehuizen / maisons de justice](/ar/data/houses-of-justice) |
| `InterestType`، `InterestRatePeriod`، `InterestRateSeries`، `InterestRateResult`                                                                                                                                      | [أسعار الفائدة](/ar/data/interest-rates#shape)                                                |
