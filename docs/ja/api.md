# API リファレンス {#api-reference}

すべてはパッケージのルートから export されており、各データセットには専用の entry point もあります。

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// 使うものだけ：利率だけなら数キロバイト
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | 内容                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| `belgica`                      | canton の境界を除く、以下のすべて                                     |
| `belgica/territory`            | 管轄区域、arrondissement、canton、自治体、州、地域                    |
| `belgica/canton-boundaries`    | canton のジオメトリと `findCantonsAt`                                 |
| `belgica/courts`               | 裁判所と連絡先ヘルパー                                                |
| `belgica/prisons`              | 刑務所と連絡先ヘルパー                                                |
| `belgica/houses-of-justice`    | justitiehuis / maison de justice と連絡先ヘルパー                     |
| `belgica/interest-rates`       | 利率                                                                  |
| `belgica/postal-codes`         | 郵便番号と、それが属する自治体                                        |
| `belgica/data/*.json`          | 生のデータファイル                                                    |
| `belgica/schema/*.schema.json` | [JSON Schema](/ja/guide/schema)                                       |
| `belgica/datapackage.json`     | [データパッケージのディスクリプタ](/ja/guide/schema#datapackage-json) |

規約：

- id による検索は、一致するものがなければ `undefined` を返します。一覧を返す関数は空の配列を
  返します。
- 関数が例外を投げるのは不正な入力の場合だけです：不正な形式の日付、またはデータの対象期間より
  前の日付（`RangeError`）。データがないことで例外を投げることはありません。
- すべての検索は任意で日付（`{ on: '2025-06-01' }` または `Date`）を受け取り、指定がなければ
  今日の時点で答えます。id による検索は既知のレコードを必ず見つけます：今日の版、または終了した
  レコードの最後の版です。[時間](#time)を参照してください。
- export されたデータセットは `readonly` です。並べ替えや変更の前にコピーしてください
  （`[...courts].sort()`）。
- 既知の id（`'gent-1'` のようなリテラル、または `CantonId` 型の値）による検索は、`undefined` では
  なくレコードそのものを返します。それ以外の文字列では `Record | undefined` を返します。
  [識別子](/ja/guide/identifiers)を参照してください。

## 領域 {#territory}

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
getMunicipality('21004').province // '04000'：ブリュッセルには州がなく、これは地域のコード
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
getProvince('04000') // undefined：ブリュッセル首都圏地域は州ではない
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // その日の版
getCanton('gent-1', { on: '2020-01-01' }) // RangeError：データは 2025-01-01 以降を記述している
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

ある日（デフォルトは今日）に自治体を管轄する canton。ほとんどの自治体では canton は一つですが、
分割された都市（Antwerpen、Gent、Brussel など）では複数になります。その場合は通りの住所で決まり、
各 canton の `territory` がその区域を記述しています。

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

自治体が属する司法 arrondissement（REFNIS コードで指定）。複数の canton に分かれた都市であっても、
すべての自治体はちょうど一つの arrondissement に属します。

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

自治体が属する州（REFNIS コードで指定）。州のないブリュッセル首都圏地域の 19 の自治体と、未知の
コードについては `undefined` を返します。

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

## canton の境界 {#canton-boundaries}

`belgica/canton-boundaries` にのみあります。ジオメトリは約 100 万の座標点からなるため、パッケージの
ルートからは再 export しません（型は再 export します）。[データのページ](/ja/data/canton-boundaries)
を参照してください。

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

ある日（デフォルトは今日）に、境界がその地点を含む canton。GeoJSON の順序どおり、経度が先、
次に緯度で、10 進数の度数（WGS 84）で指定します。ベルギー国内の地点には canton を一つ、国外には
何も返さず、二つの canton の境界線上の地点には二つ返します。有限の数値でない座標には `RangeError`
を投げます。

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']：Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []：パリ
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## 裁判所 {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

裁判所、部、または所在地。id は裁判所の `type` に地名を続けたものです：
`justice-of-the-peace-gent-1`、`police-court-brussel-fr`、`enterprise-court-gent-brugge`。

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

canton の vredegerecht / justice de paix。どの canton にも一つあります。複数の場所に所在する
vredegerecht / justice de paix（Couvin と Florennes にある Philippeville）には独自の住所や連絡先は
なく、それらは各所在地にあります。`getDivisions` を参照してください。

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // Merelbeke-Melle の裁判所
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

ある日（デフォルトは今日）の、裁判所の部、または複数の場所に所在する vredegerecht / justice de
paix の所在地。部のない裁判所では空です。

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

ある日（デフォルトは今日）に、管轄区域がその canton を含む裁判所：その vredegerecht / justice de
paix と、他の各種類についてその canton を管轄する裁判所（部ではなく裁判所全体）。ブリュッセルでは
その種類の両方の言語の裁判所です。未知の canton では空です。

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

指定したすべてのフィルターに一致し、ある日（デフォルトは今日）に適用される裁判所。空のフィルター
ではその日のすべての裁判所を返します。

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // そこにある部
findCourts({ type: 'court-of-appeal' }) // 5 つの hof van beroep / cour d'appel
```

## 連絡先 {#contacts}

連絡先を持つレコードがあるすべての entry point にあります：ルート、`courts`、`prisons`、
`houses-of-justice`。

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

その種類の最初の連絡先の値。任意で、そのラベル（情報源が名付けているとおりの書記課や部署）を
指定できます。

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

ベルギーの番号を国内での表記に整形します。E.164 形式のベルギーの番号でないものには `RangeError` を
投げます。

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

## 刑務所 {#prisons}

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

## 郵便番号 {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

id によるレコード：郵便番号と REFNIS コードを連結したもの、`'9000-44021'`。

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

ある日（デフォルトは今日）に郵便番号が属する自治体。ほぼすべてのコードで一つですが、`1040`、
`1050`、`1804` では二つになり、通りで決まります。`getMunicipality` が返すのと同じ `Municipality`
レコードです。未知のコードでは空です。

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

ある日（デフォルトは今日）の自治体の郵便番号（REFNIS コードで指定）を順に返します。未知のコード
では空です。

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## 管轄 {#jurisdiction}

複数のデータセットを組み合わせる問い。領域と裁判所の両方が必要なため、パッケージのルートにのみ
あります。

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

ある日（デフォルトは今日）に、自治体（REFNIS コードで指定）を管轄する指定した種類の裁判所：法律が
定める管轄区域（`cantons`）がその自治体の canton のいずれかを含む裁判所です。ほとんどの自治体では
一つ、ブリュッセルではオランダ語とフランス語の裁判所、canton に分かれた都市ではそのいずれかを担当
するすべての vredegerecht / justice de paix になります。返すのは裁判所全体です。部は
[`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type) が返します。
未知のコードでは空です。

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
    matter?: Matter // 事件の種類：'civil' | 'criminal'
}
```

自治体（REFNIS コードで指定）についてどこに提出するか：
[`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type) が返す各裁判所に
ついて、Gerechtelijk Wetboek / Code judiciaire 第 186 条に基づく勅令が定める管轄区域
（[部](/ja/data/courts#divisions)を参照）にその自治体を含む部を返します。自治体は、`municipalities`
にその自治体を挙げている部に属し、そのような部がなければ、`cantons` にその自治体の canton を持つ
部に属します。部に分かれていない裁判所では、その裁判所自体を返します。別々の部に属する canton に
分かれた都市があれば、それぞれの部を返し、通りの住所で決まることになりますが、現在そのように
分かれた都市はありません。未知のコードでは `[]` です。

Antwerpen の rechtbank van eerste aanleg / tribunal de première instance と politierechtbank /
tribunal de police は、民事事件と刑事事件とで管轄区域が異なります（部の
[`criminalArea`](/ja/data/courts#civil-and-criminal-cases)）。Hulshout と Herenthout は、民事事件
では Mechelen に、刑事事件では Turnhout に属します。どちらかは `matter` で指定します。指定
しなければ、この二つの自治体については両方の部を、民事の部を先にして返します。それ以外の自治体
では、事件の種類にかかわらず答えは同じです。

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']：Pont-à-Celles。その canton の残りは Binche に属する
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']：部に分かれていない
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']：Hulshout。民事事件では Mechelen に属する
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // canton が自治体の一部だけを管轄する
}
```

ある日（デフォルトは今日）の自治体の vredegerecht / justice de paix。ほとんどの自治体では一つ、
canton に分かれた都市では複数です。後者の場合は通りの住所で決まり、各 canton の `territory` が
どの部分を管轄するかを示しています。

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

ある日（デフォルトは今日）の郵便番号に対する裁判所を、自治体ごとに返します。郵便番号から自治体が
（[郵便番号](/ja/data/postal-codes)）、自治体からその vredegerecht / justice de paix と指定した種類の
裁判所がわかります。ほぼすべてのコードで項目は一つですが、2 つの自治体に属する `1040`、`1050`、
`1804` では二つになり、答えがどちらか一方にまとめられることはありません。未知のコードでは空です。
canton に分かれた都市では、`findJusticesOfThePeace` と同様に、どの vredegerecht / justice de paix
かはやはり通りで決まります。

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
    rate: number // パーセント
    period: { from: string; to: string }
}
```

ある日に適用される利率。その日の利率の記録がなければ `null` を返します。`Date` はローカルの暦日
として読み取ります。文字列は有効な `YYYY-MM-DD` の日付で始まる必要があります（ISO タイムスタンプも
可で、時刻は無視されます）。

それ以外のもの（`'2013-1-15'`、`'15/01/2013'`、`'2013-02-30'`、不正な `Date`）には `RangeError` を
投げます。利率がないことは `null`、不正な形式の日付はエラーなので、両者を取り違えることはありません。

`contractAfter20130316` が意味を持つのは、2013 年から 2015 年 3 月 15 日までの商取引の利率だけです。
デフォルトでは古い契約の利率を使います。[利率](/ja/data/interest-rates#the-2013-2015-contract-rule)を
参照してください。

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

利率の記録がある最後の日、`YYYY-MM-DD`。

## 時間 {#time}

すべてのレコードには有効期間があり、すべての検索は日付を受け取ります。ヘルパーは独自のレコード用に
export されています。

```ts
interface Validity {
    validFrom?: string // 最初の日、YYYY-MM-DD。なければ対象期間より前から
    validTo?: string // 最後の日。なければまだ適用中
}

interface OnDay {
    on?: Date | string // デフォルトは今日。Date はローカルの日付として読み取る
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD'、または RangeError
```

各データセットは、どの日からの状況を記述しているかを示しています。それより前の日付で検索すると、
今日の地図で答える代わりに `RangeError` を投げます。領域と裁判所の一覧は 2025 年 1 月 1 日時点の
改正後の法律に基づき、刑務所と justitiehuis / maison de justice はそのサイトを最初に読み取った日
からのものです。それ以前の版は予定しています（[#27](https://github.com/pieterjanscheir/belgica/issues/27)）。

export された配列（`courts`、`prisons` など）は、すべてのレコードのすべての版を保持しています。
情報源に載らなくなったレコードは削除されず、id を保ったまま、それを見つけられなかった週次チェックの
前日を `validTo` として付けられます。情報源に新たに載ったレコードには `validFrom` が付きます。
そのため、日付なしで id を検索すると、今日の版、または終了したレコードの最後の版が返ります。
そこに書類を提出する前に `validTo` を確認してください。

## データセット {#datasets}

型付きの完全なデータセット：

| Export            | 型                                                   |
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

## 型 {#types}

| 型                                                                                                                                                                                                       | 説明のあるページ                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `JudicialAreaId`、`ArrondissementId`、`CantonId`、`RegionId`、`ProvinceId`、`MunicipalityId`、`CourtId`、`PrisonId`、`HouseOfJusticeId`、`PostalCodeId`：データ内の id の union 型。データとともに再生成 | [識別子](/ja/guide/identifiers#in-typescript)                                              |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                        |                                                                                            |
| `SourceRef` = `{ url: string; retrieved: string }`：レコードのデータの出典                                                                                                                               | [データの品質](/ja/guide/data-quality)                                                     |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                  |                                                                                            |
| `Bilingual` = `Record<'nl' \| 'fr', string>`：Gerechtelijk Wetboek / Code judiciaire に記載された名称                                                                                                    |                                                                                            |
| `JudicialArea`、`Arrondissement`、`Canton`、`Region`、`Province`、`Municipality`、`LegalBasis`、`Validity`、`OnDay`                                                                                      | [領域](/ja/data/territory)                                                                 |
| `Court`、`CourtType`、`CourtFilter`、`Address`、`Contact`、`ContactType`、`CantonCourt`                                                                                                                  | [裁判所](/ja/data/courts#shape)                                                            |
| `PostalCode`、`PostalCodeCourts`                                                                                                                                                                         | [郵便番号](/ja/data/postal-codes)                                                          |
| `Prison`、`HouseOfJustice`                                                                                                                                                                               | [刑務所](/ja/data/prisons)、[Justitiehuis / maison de justice](/ja/data/houses-of-justice) |
| `InterestType`、`InterestRatePeriod`、`InterestRateSeries`、`InterestRateResult`                                                                                                                         | [利率](/ja/data/interest-rates#shape)                                                      |
