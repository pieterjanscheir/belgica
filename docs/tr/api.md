# API başvurusu {#api-reference}

Her şey paketin kökünden export edilir ve her veri kümesinin ayrıca kendi entry point'i vardır:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Yalnızca kullandığınız: faiz oranları tek başına birkaç kilobayttır
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | İçerik                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `belgica`                      | Kanton sınırları hariç aşağıdaki her şey                                         |
| `belgica/territory`            | Yargı çevreleri, arrondissement'lar, kantonlar, belediyeler, eyaletler, bölgeler |
| `belgica/canton-boundaries`    | Kantonların geometrisi ve `findCantonsAt`                                        |
| `belgica/courts`               | Mahkemeler ve iletişim yardımcıları                                              |
| `belgica/prisons`              | Cezaevleri ve iletişim yardımcıları                                              |
| `belgica/houses-of-justice`    | Justitiehuizen / maisons de justice ve iletişim yardımcıları                     |
| `belgica/interest-rates`       | Faiz oranları                                                                    |
| `belgica/postal-codes`         | Posta kodları ve ait oldukları belediyeler                                       |
| `belgica/data/*.json`          | Ham veri dosyaları                                                               |
| `belgica/schema/*.schema.json` | [JSON Schema'lar](/tr/guide/schema)                                              |
| `belgica/datapackage.json`     | [Data package tanımlayıcısı](/tr/guide/schema#datapackage-json)                  |

Kurallar:

- Id ile yapılan aramalar eşleşme olmadığında `undefined` döndürür; liste fonksiyonları boş bir
  dizi döndürür.
- Fonksiyonlar yalnızca geçersiz girdide hata fırlatır: hatalı biçimli bir gün veya verilerin
  kapsamından önceki bir gün (`RangeError`). Eksik veri için asla.
- Her arama isteğe bağlı bir gün alır, `{ on: '2025-06-01' }` veya bir `Date`; gün verilmezse
  bugün için yanıt verir. Id ile arama her zaman bilinen bir kaydı bulur: bugünkü sürümünü ya da
  sona ermiş bir kaydın son sürümünü. Bkz. [zaman](#time).
- Export edilen veri kümeleri `readonly`'dir: sıralamadan veya değiştirmeden önce kopyalayın
  (`[...courts].sort()`).
- Bilinen bir id ile yapılan arama (`'gent-1'` gibi bir literal veya `CantonId` tipinde bir değer)
  kaydın kendisini döndürür, asla `undefined` döndürmez. Başka herhangi bir string
  `Record | undefined` döndürür. Bkz. [tanımlayıcılar](/tr/guide/identifiers).

## Coğrafya {#territory}

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
getMunicipality('21004').province // '04000': Brüksel'in eyaleti yoktur, bu bölgenin kodudur
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
getProvince('04000') // undefined: Brüksel-Başkent Bölgesi bir eyalet değildir
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // o günkü sürüm
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: veriler 2025-01-01 ve sonrasını tanımlar
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

Bir belediyeyi belirli bir günde (varsayılan olarak bugün) kapsayan adli kantonlar.
Belediyelerin çoğu için tek bir kanton; bölünmüş şehirler (Antwerpen, Gent, Brussel, …) için
birden fazla. Bu durumda sokak adresi belirleyicidir ve her kantonun `territory` alanı kendi
kısmını tanımlar.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

Bir belediyenin bulunduğu adli arrondissement (adli bölge), REFNIS koduna göre. Birden fazla
kantona bölünmüş bir şehir dahil, her belediye tam olarak bir arrondissement'ta bulunur.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

Bir belediyenin bulunduğu eyalet, REFNIS koduna göre. Eyaleti olmayan Brüksel-Başkent
Bölgesi'nin 19 belediyesi ve bilinmeyen bir kod için `undefined`.

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

## Kanton sınırları {#canton-boundaries}

Yalnızca `belgica/canton-boundaries` içinde: geometri yaklaşık bir milyon konumdan oluşur, bu
yüzden paketin kökü onu yeniden export etmez (tiplerini eder). Bkz.
[veri sayfası](/tr/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

Belirli bir günde (varsayılan olarak bugün) sınırı bir noktayı içeren kantonlar. GeoJSON'daki
sıraya uygun olarak önce boylam, sonra enlem, ondalık derece cinsinden (WGS 84). Belçika'daki bir
nokta için tek bir kanton; dışındaki bir nokta için hiç; iki kanton arasındaki çizgi üzerindeki
bir nokta için iki kanton. Sonlu sayı olmayan koordinatlar için `RangeError` fırlatır.

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

## Mahkemeler {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Bir mahkeme, bölüm (afdeling / division) veya duruşma yeri. Id'ler mahkemenin `type` değeri ve
ardından yerden oluşur: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`,
`enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

Bir kantonun vredegerecht / justice de paix'si (sulh mahkemesi benzeri, kanton düzeyindeki
mahkeme). Her kantonun bir tane vardır. Birden fazla yerde duruşma yapan bir vredegerecht'in
(Couvin ve Florennes'de oturan Philippeville) kendine ait adresi veya iletişim bilgileri yoktur:
bunlar duruşma yerlerindedir, bkz. `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // Merelbeke-Melle'nin vredegerecht'i
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

Belirli bir günde (varsayılan olarak bugün) bir mahkemenin bölümleri ya da birden fazla yerde
duruşma yapan bir vredegerecht'in duruşma yerleri; bölümü olmayan bir mahkeme için boş.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

Belirli bir günde (varsayılan olarak bugün) yetki alanı bir kantonu içeren mahkemeler:
kantonun vredegerecht'i ve diğer her türden onu kapsayan mahkeme (bölümleri değil, mahkemenin
bütünü); Brüksel'de bir türün her iki dildeki mahkemesi. Bilinmeyen bir kanton için boş.

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

Verilen tüm filtrelere uyan ve belirli bir günde (varsayılan olarak bugün) geçerli olan
mahkemeler; boş bir filtre o günün tüm mahkemelerini döndürür.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // oradaki bölümleri
findCourts({ type: 'court-of-appeal' }) // beş hof van beroep / cour d'appel
```

## İletişim bilgileri {#contacts}

İletişim bilgisi olan kayıtlar içeren her entry point'te: kök, `courts`, `prisons` ve
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

O türdeki ilk iletişim bilgisinin değeri; isteğe bağlı olarak belirli bir etiketle (kaynağın
adlandırdığı şekliyle kalem (griffie / greffe) veya servis).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Belçika numarasını ulusal yazım biçimiyle döndürür. E.164 biçiminde bir Belçika numarası
olmayan her şey için `RangeError` fırlatır.

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

## Cezaevleri {#prisons}

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

## Posta kodları {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Id'ye göre bir kayıt: posta kodu ile REFNIS kodunun birleşimi, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

Bir posta kodunun belirli bir günde (varsayılan olarak bugün) ait olduğu belediyeler: neredeyse
her kod için bir; sokağın belirleyici olduğu `1040`, `1050` ve `1804` için iki. `getMunicipality`'nin
verdiği `Municipality` kayıtlarının aynısı. Bilinmeyen bir kod için boş.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

Bir belediyenin belirli bir gündeki (varsayılan olarak bugün) posta kodları, REFNIS koduna göre,
sıralı olarak. Bilinmeyen bir kod için boş.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Yetki {#jurisdiction}

Veri kümelerini birleştiren sorular. Hem coğrafyaya hem de mahkemelere ihtiyaç duydukları için
yalnızca paketin kökünde bulunurlar.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

Belirli bir günde (varsayılan olarak bugün) bir belediye için yetkili olan, belirli türdeki
mahkemeler, REFNIS koduna göre: yasanın belirlediği yetki alanı (`cantons`) belediyenin
kantonlarından birini içeren mahkemeler. Belediyelerin çoğu için tek bir mahkeme; Brüksel'de
Hollandaca ve Fransızca konuşan mahkeme; kantonlara bölünmüş bir şehir için bu kantonlardan
birine hizmet veren her vredegerecht. Mahkemeyi bir bütün olarak verir: bölümü
[`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type) verir.
Bilinmeyen bir kod için boş.

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
    matter?: Matter // dava türü: 'civil' | 'criminal'
}
```

Bir belediye için nereye başvurulacağı, REFNIS koduna göre:
[`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type)'ın verdiği her
mahkeme için, yetki alanı belediyeyi içeren bölüm; bu yetki alanını Gerechtelijk Wetboek / Code
judiciaire'in 186. maddesi uyarınca çıkarılan kraliyet kararnameleri belirler (bkz.
[bölümler](/tr/data/courts#divisions)). Bir belediye, onu `municipalities` içinde anan bölüme,
böyle bir bölüm yoksa kantonunu `cantons` içinde bulunduran bölüme aittir. Bölümlere ayrılmamış
bir mahkeme için sonuç mahkemenin kendisidir. Farklı bölümlere giden kantonlara bölünmüş bir
şehir bu bölümlerin her birini verirdi ve sokak adresi belirleyici olurdu; bugün hiçbir şehir bu
şekilde bölünmüş değildir. Bilinmeyen bir kod için boş.

Antwerpen rechtbank van eerste aanleg'i ile politierechtbank'ının hukuk davaları için bir, ceza
davaları için başka bir yetki alanı vardır (bir bölümün
[`criminalArea`](/tr/data/courts#civil-and-criminal-cases) alanı): Hulshout ve Herenthout hukuk
davalarında Mechelen'e, ceza davalarında Turnhout'a gider. Hangisinin söz konusu olduğunu
`matter` belirtir. O olmadan bu iki belediye için her iki bölüm de döner, önce hukuk
davalarındaki; diğer her belediye, dava türü ne olursa olsun aynı yanıtı alır.

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']: Pont-à-Celles; kantonunun geri kalanı ise Binche'e gider
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']: bölümlere ayrılmamış
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']: Hulshout; hukuk davalarında Mechelen'e gider
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // kanton belediyenin yalnızca bir kısmını kapsar
}
```

Belirli bir günde (varsayılan olarak bugün) bir belediyenin vredegerecht'leri: belediyelerin
çoğu için bir tane; kantonlara bölünmüş bir şehir için birden fazla. Bu durumda sokak adresi
belirleyicidir ve her kantonun `territory` alanı hangi kısmı kapsadığını söyler.

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

Belirli bir günde (varsayılan olarak bugün) bir posta kodu için mahkemeler, belediye başına:
posta kodu belediyeyi verir ([posta kodları](/tr/data/postal-codes)), belediye de
vredegerecht'lerini ve istenen türdeki mahkemelerini. Neredeyse her kod için tek bir giriş; iki
belediyeye ait olan `1040`, `1050` ve `1804` için iki giriş; yani yanıt hiçbir zaman bunlardan
birine indirgenmez. Bilinmeyen bir kod için boş. Kantonlara bölünmüş bir şehirde,
`findJusticesOfThePeace`'te olduğu gibi, vredegerecht'ler arasında yine sokak belirleyicidir.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Faiz oranları {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // yüzde
    period: { from: string; to: string }
}
```

Belirli bir günde geçerli olan oran ya da o gün için kayıtlı oran yoksa `null`. Bir `Date` yerel
takvim günü olarak okunur; bir string geçerli bir `YYYY-MM-DD` günüyle başlamalıdır (ISO
timestamp da olur, saati yok sayılır).

Diğer her şey için `RangeError` fırlatır: `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` veya
geçersiz bir `Date`. Eksik oran `null`'dır; hatalı biçimli gün ise bir hatadır, böylece ikisi
birbirine karıştırılamaz.

`contractAfter20130316` yalnızca 2013 ile 15 Mart 2015 arasındaki ticari işlemler faizi için önem
taşır; varsayılan olarak eski sözleşmelere ait oran kullanılır. Bkz.
[faiz oranları](/tr/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

Kayıtlı oranı olan son gün, `YYYY-MM-DD`.

## Zaman {#time}

Her kaydın bir geçerlilik dönemi vardır ve her arama bir gün alır. Yardımcılar kendi
kayıtlarınız için export edilir.

```ts
interface Validity {
    validFrom?: string // ilk gün, YYYY-MM-DD; yoksa: kapsamın başlangıcından önceden beri
    validTo?: string // son gün; yoksa: hâlâ geçerli
}

interface OnDay {
    on?: Date | string // varsayılan olarak bugün; bir Date yerel gün olarak okunur
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD' veya bir RangeError
```

Her veri kümesi, durumu hangi günden itibaren tanımladığını belirtir; daha önceki bir gün için
yapılan arama, bugünün haritasıyla yanıt vermek yerine `RangeError` fırlatır. Coğrafya ve
mahkeme listesi, 1 Ocak 2025 itibarıyla değiştirilmiş haliyle yasadan gelir; cezaevleri ve
justitiehuizen / maisons de justice, sitelerinin ilk okunduğu günden itibaren bilinir. Daha
önceki sürümler planlanmaktadır
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

Export edilen diziler (`courts`, `prisons`, …) her kaydın tüm sürümlerini içerir. Kaynağın
listelemeyi bıraktığı bir kayıt silinmez: id'sini korur ve bir `validTo` alır, yani onu
bulamayan haftalık kontrolden önceki gün. Kaynağın listelemeye başladığı bir kayıt bir
`validFrom` alır. Bu yüzden gün belirtilmeden id ile yapılan arama bugünkü sürümü ya da sona
ermiş bir kaydın son sürümünü döndürür: oraya bir şey göndermeden önce `validTo` alanını
kontrol edin.

## Veri kümeleri {#datasets}

Tipleriyle birlikte tam veri kümeleri:

| Export            | Tip                                                  |
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

## Tipler {#types}

| Tip                                                                                                                                                                                                                           | Açıklandığı yer                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`: verilerdeki id'lerin union'ları, verilerle birlikte yeniden üretilir | [Tanımlayıcılar](/tr/guide/identifiers#in-typescript)                                             |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                                             |                                                                                                   |
| `SourceRef` = `{ url: string; retrieved: string }`: bir kaydın verilerinin geldiği yer                                                                                                                                        | [Veri kalitesi](/tr/guide/data-quality)                                                           |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                                       |                                                                                                   |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: Gerechtelijk Wetboek / Code judiciaire'in verdiği adlar                                                                                                                         |                                                                                                   |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                                           | [Coğrafya](/tr/data/territory)                                                                    |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                                       | [Mahkemeler](/tr/data/courts#shape)                                                               |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                                              | [Posta kodları](/tr/data/postal-codes)                                                            |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                                    | [Cezaevleri](/tr/data/prisons), [Justitiehuizen / maisons de justice](/tr/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                                              | [Faiz oranları](/tr/data/interest-rates#shape)                                                    |
