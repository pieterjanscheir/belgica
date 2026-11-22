# API 参考 {#api-reference}

所有内容都从 package 根导出，每个数据集也有自己的 entry point：

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// 只引入你用到的：单是利率只有几 KB
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | 内容                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| `belgica`                      | 下面的全部内容，canton 边界除外                            |
| `belgica/territory`            | 司法辖区、arrondissement、canton、市镇、省、大区           |
| `belgica/canton-boundaries`    | 各 canton 的几何形状，以及 `findCantonsAt`                 |
| `belgica/courts`               | 法院，以及联系方式辅助函数                                 |
| `belgica/prisons`              | 监狱，以及联系方式辅助函数                                 |
| `belgica/houses-of-justice`    | justitiehuis / maison de justice，以及联系方式辅助函数     |
| `belgica/interest-rates`       | 利率                                                       |
| `belgica/postal-codes`         | 邮政编码，及其所属的市镇                                   |
| `belgica/data/*.json`          | 原始数据文件                                               |
| `belgica/schema/*.schema.json` | [JSON Schema](/zh/guide/schema)                            |
| `belgica/datapackage.json`     | [Data package 描述文件](/zh/guide/schema#datapackage-json) |

约定：

- 按 id 查找时，若无匹配则返回 `undefined`；列表函数返回空数组。
- 函数只在输入无效时抛出错误：格式错误的日期，或早于数据覆盖范围的日期（`RangeError`）。数据缺失时从不抛错。
- 每个查找函数都接受一个可选的日期，`{ on: '2025-06-01' }` 或一个 `Date`；不传则按今天回答。按 id 查找总能找到已知的记录：今天的版本，或已终止记录的最后一个版本。参见[时间](#time)。
- 导出的数据集是 `readonly` 的：排序或修改前请先复制（`[...courts].sort()`）。
- 用已知 id（例如字面量 `'gent-1'`，或类型为 `CantonId` 的值）查找时，返回记录本身，绝不会是 `undefined`。其他任何字符串返回 `Record | undefined`。参见[标识符](/zh/guide/identifiers)。

## 地域 {#territory}

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
getMunicipality('21004').province // '04000'：布鲁塞尔没有省，这是大区的代码
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
getProvince('04000') // undefined：布鲁塞尔首都大区不是省
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // 当天的版本
getCanton('gent-1', { on: '2020-01-01' }) // RangeError：数据描述的是 2025-01-01 及以后
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

某一天覆盖某个市镇的 canton（司法 canton，比利时最小的司法辖区单位，每个设一个治安法院），默认为今天。大多数市镇只有一个 canton；被分割的城市（Antwerpen、Gent、Brussel 等）有多个。这时由街道地址决定，每个 canton 的 `territory` 描述它所覆盖的部分。

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

按 REFNIS 代码返回某个市镇所在的司法 arrondissement（由初审法院管辖的司法辖区）。每个市镇恰好位于一个 arrondissement 中，即使是被分割到多个 canton 的城市也是如此。

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

按 REFNIS 代码返回某个市镇所在的省。对于布鲁塞尔首都大区的 19 个市镇（该大区没有省）以及未知代码，返回 `undefined`。

```ts
getProvinceForMunicipality('44021')?.id // '40000'
getProvinceForMunicipality('21004') // undefined：Brussel
```

### `getRegionForMunicipality(id)` {#getregionformunicipality-id}

```ts
function getRegionForMunicipality(id: string, options?: OnDay): Region | undefined
```

```ts
getRegionForMunicipality('21004')?.name.nl // 'Brussels Hoofdstedelijk Gewest'
```

## Canton 边界 {#canton-boundaries}

仅在 `belgica/canton-boundaries` 中提供：几何数据约有一百万个坐标点，因此 package 根不会重新导出它（但会导出其类型）。参见[数据页面](/zh/data/canton-boundaries)。

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

某一天（默认今天）边界包含某个点的 canton。先经度后纬度，以十进制度数（WGS 84）表示，与 GeoJSON 的顺序一致。比利时境内的点对应一个 canton；境外的点没有；位于两个 canton 分界线上的点对应两个。若坐标不是有限数值，则抛出 `RangeError`。

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']：Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []：巴黎
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## 法院 {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

一个法院、分部或开庭地点。id 由法院的 `type` 加地名组成：`justice-of-the-peace-gent-1`、`police-court-brussel-fr`、`enterprise-court-gent-brugge`。

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

某个 canton 的 vredegerecht / justice de paix（治安法院）。每个 canton 都有一个。在多个地点开庭的治安法院（Philippeville，在 Couvin 和 Florennes 开庭）没有自己的地址或联系方式：这些信息属于它的开庭地点，参见 `getDivisions`。

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // Merelbeke-Melle 的治安法院
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

某一天（默认今天）一个法院的分部，或在多个地点开庭的治安法院的开庭地点；没有分部的法院返回空数组。

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

某一天（默认今天）管辖范围包含某个 canton 的法院：该 canton 的治安法院，以及其他每种类型中覆盖它的法院（法院整体，而不是其分部）；在布鲁塞尔则是同一类型的两个语言法院。未知 canton 返回空数组。

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

符合所有给定筛选条件、并在某一天（默认今天）有效的法院；空的筛选条件返回当天的所有法院。

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // 它在该地的分部
findCourts({ type: 'court-of-appeal' }) // 五个上诉法院
```

## 联系方式 {#contacts}

在每个包含带联系方式记录的 entry point 中提供：根、`courts`、`prisons` 和 `houses-of-justice`。

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

该类型的第一个联系方式的值，可选地按标签筛选（书记处或部门，按来源中的名称）。

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

把比利时号码转为其国内书写形式。对于任何不是 E.164 格式比利时号码的输入，抛出 `RangeError`。

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

## 监狱 {#prisons}

### `getPrison(id)` {#getprison-id}

```ts
function getPrison(id: PrisonId): Prison
function getPrison(id: string, options?: OnDay): Prison | undefined
```

```ts
getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
```

## Justitiehuis / maison de justice {#houses-of-justice}

### `getHouseOfJustice(id)` {#gethouseofjustice-id}

```ts
function getHouseOfJustice(id: HouseOfJusticeId): HouseOfJustice
function getHouseOfJustice(id: string, options?: OnDay): HouseOfJustice | undefined
```

```ts
getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
```

## 邮政编码 {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

按 id 获取一条记录：id 由邮政编码和 REFNIS 代码连接而成，例如 `'9000-44021'`。

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

某一天（默认今天）某个邮政编码所属的市镇：几乎每个编码都只对应一个；`1040`、`1050` 和 `1804` 对应两个，由街道决定。返回的 `Municipality` 记录与 `getMunicipality` 给出的相同。未知编码返回空数组。

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

按 REFNIS 代码返回某一天（默认今天）某个市镇的邮政编码，按顺序排列。未知代码返回空数组。

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## 管辖权 {#jurisdiction}

组合多个数据集的查询。它们只在 package 根中提供，因为同时需要地域和法院数据。

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

按 REFNIS 代码返回某一天（默认今天）对某个市镇有管辖权的某类型法院：即依法律规定（`cantons`）其管辖范围包含该市镇某个 canton 的法院。大多数市镇只有一个法院；在布鲁塞尔是荷兰语法院和法语法院；对于被分割到多个 canton 的城市，则是服务其中任一 canton 的每个治安法院。返回的是法院整体：分部由 [`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type) 给出。未知代码返回空数组。

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
    matter?: Matter // 案件类型：'civil' | 'criminal'
}
```

按 REFNIS 代码返回某个市镇应向哪里提交材料：对于 [`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type) 返回的每个法院，给出管辖范围包含该市镇的分部，其管辖范围由依据 Gerechtelijk Wetboek / Code judiciaire（司法法典）第 186 条颁布的王室法令确定（参见[分部](/zh/data/courts#divisions)）。一个市镇属于在 `municipalities` 中列出它的分部，否则属于在 `cantons` 中拥有其 canton 的分部。没有划分分部的法院返回它自身。如果一个城市被分割到归属不同分部的多个 canton，就会返回其中每个分部，由街道地址决定；目前没有城市被这样分割。未知代码返回 `[]`。

Antwerpen 的 rechtbank van eerste aanleg / tribunal de première instance（初审法院）和 politierechtbank / tribunal de police（违警法院）在民事案件和刑事案件中的管辖范围不同（分部的 [`criminalArea`](/zh/data/courts#civil-and-criminal-cases)）：Hulshout 和 Herenthout 在民事案件中归 Mechelen，在刑事案件中归 Turnhout。`matter` 指明是哪一类。不传时，这两个市镇会得到两个分部，民事的在前；其他所有市镇无论案件类型如何，结果都相同。

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']：Pont-à-Celles，尽管其 canton 的其余部分归 Binche
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']：没有划分分部
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']：Hulshout，在民事案件中归 Mechelen
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // 该 canton 只覆盖市镇的一部分
}
```

某一天（默认今天）某个市镇的治安法院：大多数市镇只有一个；被分割到多个 canton 的城市有多个，这时由街道地址决定，每个 canton 的 `territory` 说明它覆盖哪一部分。

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

某一天（默认今天）某个邮政编码对应的法院，按市镇分列：邮政编码确定市镇（[邮政编码](/zh/data/postal-codes)），市镇再确定它的治安法院和所请求类型的法院。几乎每个编码只有一项；`1040`、`1050` 和 `1804` 属于两个市镇，因此有两项，结果绝不会被合并为其中一个。未知编码返回空数组。在被分割到多个 canton 的城市中，仍由街道决定是哪个治安法院，与 `findJusticesOfThePeace` 相同。

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## 利率 {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // 百分比
    period: { from: string; to: string }
}
```

某一天适用的利率；若该天没有已知利率，则返回 `null`。`Date` 按本地日历日读取；字符串必须以有效的 `YYYY-MM-DD` 日期开头（ISO 时间戳也可以，时间部分会被忽略）。

其他任何输入都会抛出 `RangeError`：`'2013-1-15'`、`'15/01/2013'`、`'2013-02-30'` 或无效的 `Date`。缺少利率是 `null`；日期格式错误是错误，因此两者不会混淆。

`contractAfter20130316` 只影响 2013 年至 2015 年 3 月 15 日之间的商业交易利率；默认使用较早合同的利率。参见[利率](/zh/data/interest-rates#the-2013-2015-contract-rule)。

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

有已知利率的最后一天，格式为 `YYYY-MM-DD`。

## 时间 {#time}

每条记录都有有效期，每个查找函数都接受一个日期。这些辅助函数也已导出，可用于你自己的记录。

```ts
interface Validity {
    validFrom?: string // 第一天，YYYY-MM-DD；缺省：早于覆盖范围就已存在
    validTo?: string // 最后一天；缺省：仍然有效
}

interface OnDay {
    on?: Date | string // 默认今天；Date 按本地日期读取
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD'，或 RangeError
```

每个数据集都说明它从哪一天开始描述实际情况；查询更早的日期会抛出 `RangeError`，而不是用今天的版图作答。地域和法院列表依据截至 2025 年 1 月 1 日修订后的法律；监狱和 justitiehuis / maison de justice 则从首次读取其网站的那天起才有数据。更早的版本已在计划中（[#27](https://github.com/pieterjanscheir/belgica/issues/27)）。

导出的数组（`courts`、`prisons` 等）包含每条记录的每个版本。来源不再列出的记录不会被删除：它保留 id，并获得一个 `validTo`，即漏掉它的那次每周检查的前一天。来源开始列出的记录会获得一个 `validFrom`。因此，不带日期按 id 查找时，返回今天的版本，或已终止记录的最后一个版本：在向那里递交文件之前，请检查 `validTo`。

## 数据集 {#datasets}

完整的数据集，带类型：

| 导出              | 类型                                                 |
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

## 类型 {#types}

| 类型                                                                                                                                                                                              | 说明页面                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `JudicialAreaId`、`ArrondissementId`、`CantonId`、`RegionId`、`ProvinceId`、`MunicipalityId`、`CourtId`、`PrisonId`、`HouseOfJusticeId`、`PostalCodeId`：数据中 id 的联合类型，随数据一起重新生成 | [标识符](/zh/guide/identifiers#in-typescript)                                            |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                 |                                                                                          |
| `SourceRef` = `{ url: string; retrieved: string }`：记录数据的来源                                                                                                                                | [数据质量与时效](/zh/guide/data-quality)                                                 |
| `Translated` = `Record<Locale, string>`                                                                                                                                                           |                                                                                          |
| `Bilingual` = `Record<'nl' \| 'fr', string>`：Gerechtelijk Wetboek / Code judiciaire（司法法典）中给出的名称                                                                                      |                                                                                          |
| `JudicialArea`、`Arrondissement`、`Canton`、`Region`、`Province`、`Municipality`、`LegalBasis`、`Validity`、`OnDay`                                                                               | [地域与 canton](/zh/data/territory)                                                      |
| `Court`、`CourtType`、`CourtFilter`、`Address`、`Contact`、`ContactType`、`CantonCourt`                                                                                                           | [法院](/zh/data/courts#shape)                                                            |
| `PostalCode`、`PostalCodeCourts`                                                                                                                                                                  | [邮政编码](/zh/data/postal-codes)                                                        |
| `Prison`、`HouseOfJustice`                                                                                                                                                                        | [监狱](/zh/data/prisons)、[Justitiehuis / maison de justice](/zh/data/houses-of-justice) |
| `InterestType`、`InterestRatePeriod`、`InterestRateSeries`、`InterestRateResult`                                                                                                                  | [利率](/zh/data/interest-rates#shape)                                                    |
