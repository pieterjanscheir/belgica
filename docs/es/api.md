# Referencia de la API {#api-reference}

Todo se exporta desde la raíz del paquete, y cada conjunto de datos tiene además su propio entry
point:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Solo lo que usas: los tipos de interés por sí solos ocupan unos pocos kilobytes
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | Contenido                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `belgica`                      | Todo lo de abajo, salvo los límites de los cantones                                |
| `belgica/territory`            | Áreas judiciales, distritos judiciales, cantones, municipios, provincias, regiones |
| `belgica/canton-boundaries`    | La geometría de los cantones, y `findCantonsAt`                                    |
| `belgica/courts`               | Tribunales, y los helpers de contacto                                              |
| `belgica/prisons`              | Prisiones, y los helpers de contacto                                               |
| `belgica/houses-of-justice`    | Maisons de justice, y los helpers de contacto                                      |
| `belgica/interest-rates`       | Tipos de interés                                                                   |
| `belgica/postal-codes`         | Códigos postales, con los municipios a los que pertenecen                          |
| `belgica/data/*.json`          | Los archivos de datos sin procesar                                                 |
| `belgica/schema/*.schema.json` | [JSON Schemas](/es/guide/schema)                                                   |
| `belgica/datapackage.json`     | [Descriptor del data package](/es/guide/schema#datapackage-json)                   |

Convenciones:

- Las búsquedas por id devuelven `undefined` cuando nada coincide; las funciones de lista
  devuelven un array vacío.
- Las funciones solo lanzan errores ante una entrada no válida: un día mal formado, o un día
  anterior a la cobertura de los datos (`RangeError`). Nunca por datos que faltan.
- Toda búsqueda acepta un día opcional, `{ on: '2025-06-01' }` o un `Date`, y sin él responde
  para hoy. Una búsqueda por id siempre encuentra un registro conocido: la versión de hoy, o la
  última de un registro que ha terminado. Ver [tiempo](#time).
- Los conjuntos de datos exportados son `readonly`: cópialos antes de ordenarlos o modificarlos
  (`[...courts].sort()`).
- Una búsqueda con un id conocido (un literal como `'gent-1'`, o un valor de tipo `CantonId`)
  devuelve el propio registro, nunca `undefined`. Cualquier otra cadena devuelve
  `Record | undefined`. Ver [identificadores](/es/guide/identifiers).

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
getMunicipality('21004').province // '04000': Bruselas no tiene provincia, es el código de la región
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
getProvince('04000') // undefined: la Región de Bruselas-Capital no es una provincia
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // la versión de ese día
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: los datos describen la situación desde 2025-01-01
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

Los cantones que cubren un municipio en un día, hoy por defecto. Un cantón para la mayoría de los
municipios; varios para las ciudades divididas (Antwerpen, Gent, Brussel, …). Entonces decide la
dirección postal, y el `territory` de cada cantón describe su parte.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

El distrito judicial en el que está un municipio, por código REFNIS. Cada municipio está
exactamente en uno, incluso una ciudad dividida entre varios cantones.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

La provincia en la que está un municipio, por código REFNIS. `undefined` para los 19 municipios
de la Región de Bruselas-Capital, que no tiene provincia, y para un código desconocido.

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

## Límites de los cantones {#canton-boundaries}

Solo en `belgica/canton-boundaries`: la geometría tiene alrededor de un millón de posiciones, así
que la raíz del paquete no la reexporta (sí sus tipos). Ver la
[página de datos](/es/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

Los cantones cuyo límite contiene un punto, en un día (hoy por defecto). Primero la longitud,
luego la latitud, en grados decimales (WGS 84), en el orden de GeoJSON. Un cantón para un punto
en Bélgica; ninguno fuera; dos para un punto en la línea entre dos cantones. Lanza un
`RangeError` para coordenadas que no son números finitos.

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1']: Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // []: París
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## Tribunales {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Un tribunal, una división o una sede. Los ids son el `type` del tribunal seguido del lugar:
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

La justice de paix (vredegerecht, el juzgado de paz del cantón) de un cantón. Cada cantón tiene
una. Una justice de paix con sede en varios lugares (Philippeville, en Couvin y Florennes) no
tiene dirección ni contactos propios: los tienen sus sedes, ver `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // el tribunal de Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

Las divisiones de un tribunal, o las sedes de una justice de paix con sede en varios lugares, en
un día (hoy por defecto); vacío para un tribunal que no tiene.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

Los tribunales cuya área contiene un cantón en un día (hoy por defecto): su justice de paix y, de
cada otro tipo, el tribunal que lo cubre (el tribunal en su conjunto, no sus divisiones); en
Bruselas, los dos tribunales lingüísticos de un tipo. Vacío para un cantón desconocido.

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

Los tribunales que cumplen todos los filtros dados y están vigentes en un día (hoy por defecto);
un filtro vacío devuelve todos los tribunales de ese día.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // sus divisiones allí
findCourts({ type: 'court-of-appeal' }) // las cinco cours d'appel
```

## Contactos {#contacts}

En cada entry point que tiene registros con contactos: la raíz, `courts`, `prisons` y
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

El valor del primer contacto de ese tipo, opcionalmente con esa etiqueta (la secretaría o el
servicio, tal como lo nombra la fuente).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Un número belga en su forma escrita nacional. Lanza un `RangeError` para cualquier cosa que no
sea un número belga en formato E.164.

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

## Prisiones {#prisons}

### `getPrison(id)` {#getprison-id}

```ts
function getPrison(id: PrisonId): Prison
function getPrison(id: string, options?: OnDay): Prison | undefined
```

```ts
getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
```

## Maisons de justice {#houses-of-justice}

### `getHouseOfJustice(id)` {#gethouseofjustice-id}

```ts
function getHouseOfJustice(id: HouseOfJusticeId): HouseOfJustice
function getHouseOfJustice(id: string, options?: OnDay): HouseOfJustice | undefined
```

```ts
getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
```

## Códigos postales {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Un registro por id: el código postal y el código REFNIS unidos, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

Los municipios a los que pertenece un código postal en un día (hoy por defecto): uno para casi
todos los códigos; dos para `1040`, `1050` y `1804`, donde decide la calle. Los mismos registros
`Municipality` que da `getMunicipality`. Vacío para un código desconocido.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

Los códigos postales de un municipio en un día (hoy por defecto), por código REFNIS, en orden.
Vacío para un código desconocido.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Competencia {#jurisdiction}

Preguntas que combinan conjuntos de datos. Solo están en la raíz del paquete, ya que necesitan
tanto el territorio como los tribunales.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

Los tribunales de un tipo competentes para un municipio en un día (hoy por defecto), por código
REFNIS: los tribunales cuya área, tal como la fija la ley (`cantons`), contiene uno de los
cantones del municipio. Un tribunal para la mayoría de los municipios; en Bruselas el tribunal
neerlandófono y el francófono; para una ciudad dividida entre cantones, cada justice de paix que
sirve a uno de ellos. Da el tribunal en su conjunto:
[`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type) da la
división. Vacío para un código desconocido.

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
    matter?: Matter // el tipo de asunto: 'civil' | 'criminal'
}
```

Dónde presentar un asunto para un municipio, por código REFNIS: para cada tribunal que da
[`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type), la división cuya
área contiene el municipio, tal como la fijan los reales decretos adoptados en virtud del art.
186 del Code judiciaire (Gerechtelijk Wetboek) (ver [divisiones](/es/data/courts#divisions)). Un
municipio pertenece a la división que lo nombra en `municipalities` o, si ninguna lo hace, a la
que tiene su cantón en `cantons`. Un tribunal que no está dividido se da a sí mismo. Una ciudad
dividida entre cantones que van a divisiones distintas daría cada una de ellas, y decide la
dirección postal; hoy ninguna ciudad está dividida así. Vacío para un código desconocido.

El tribunal de première instance y el tribunal de police de Antwerpen tienen un área para los
asuntos civiles y otra para los penales (el
[`criminalArea`](/es/data/courts#civil-and-criminal-cases) de una división): Hulshout y
Herenthout van a Mechelen en los primeros y a Turnhout en los segundos. `matter` dice cuál. Sin
él, esos dos municipios obtienen ambas divisiones, la civil primero; cualquier otro municipio
obtiene la misma respuesta sea cual sea el tipo de asunto.

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']: Pont-à-Celles, aunque el resto de su cantón va a Binche
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']: no está dividido
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']: Hulshout, que va a Mechelen en los asuntos civiles
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // el cantón cubre solo parte del municipio
}
```

Las justices de paix de un municipio en un día (hoy por defecto): una para la mayoría de los
municipios, varias para una ciudad dividida entre cantones, donde decide la dirección postal y
el `territory` de cada cantón dice qué parte cubre.

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

Los tribunales de un código postal en un día (hoy por defecto), por municipio: el código postal da
el municipio ([códigos postales](/es/data/postal-codes)), y el municipio sus justices de paix y
sus tribunales del tipo pedido. Una entrada para casi todos los códigos; dos para `1040`, `1050` y
`1804`, que pertenecen a dos municipios, de modo que la respuesta nunca se reduce a uno de ellos.
Vacío para un código desconocido. En una ciudad dividida entre cantones, la calle sigue decidiendo
entre las justices de paix, como con `findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Tipos de interés {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // porcentaje
    period: { from: string; to: string }
}
```

El tipo que se aplica en un día, o `null` cuando no hay ningún tipo registrado para él. Un `Date`
se lee como un día del calendario local; una cadena debe empezar por un día `YYYY-MM-DD` válido
(un timestamp ISO sirve, se ignora la hora).

Lanza un `RangeError` para cualquier otra cosa: `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` o
un `Date` no válido. Un tipo que falta es `null`; un día mal formado es un error, así que los dos
casos no se pueden confundir.

`contractAfter20130316` solo importa para el interés comercial entre 2013 y el 15 de marzo de
2015; por defecto se usa el tipo para los contratos más antiguos. Ver
[tipos de interés](/es/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

El último día para el que hay un tipo registrado, `YYYY-MM-DD`.

## Tiempo {#time}

Cada registro tiene un periodo de validez, y cada búsqueda acepta un día. Los helpers se exportan
para tus propios registros.

```ts
interface Validity {
    validFrom?: string // primer día, YYYY-MM-DD; ausente: desde antes de la cobertura
    validTo?: string // último día; ausente: sigue vigente
}

interface OnDay {
    on?: Date | string // hoy por defecto; un Date se lee como un día local
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD', o un RangeError
```

Cada conjunto de datos dice a partir de qué día describe la situación; una búsqueda para un día
anterior lanza un `RangeError` en lugar de responder con el mapa de hoy. El territorio y la lista
de tribunales se derivan de la ley tal como quedó modificada para el 1 de enero de 2025; las
prisiones y las maisons de justice se conocen desde el día en que se leyeron sus sitios por
primera vez. Las versiones anteriores están previstas
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

Los arrays exportados (`courts`, `prisons`, …) contienen todas las versiones de todos los
registros. Un registro que la fuente deja de mostrar no se borra: conserva su id y recibe un
`validTo`, el día anterior a la comprobación semanal que no lo encontró. Uno que la fuente empieza
a mostrar recibe un `validFrom`. Así, una búsqueda por id sin día devuelve la versión de hoy, o la
última versión de un registro que ha terminado: comprueba `validTo` antes de presentar algo allí.

## Conjuntos de datos {#datasets}

Los conjuntos de datos completos, con tipos:

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

## Tipos {#types}

| Tipo                                                                                                                                                                                                           | Descrito en                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`: unions de los ids de los datos, regenerados con ellos | [Identificadores](/es/guide/identifiers#in-typescript)                          |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                              |                                                                                 |
| `SourceRef` = `{ url: string; retrieved: string }`: de dónde proceden los datos de un registro                                                                                                                 | [Calidad de los datos](/es/guide/data-quality)                                  |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                        |                                                                                 |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: nombres tal como los da el Code judiciaire                                                                                                                       |                                                                                 |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                            | [Territorio](/es/data/territory)                                                |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                        | [Tribunales](/es/data/courts#shape)                                             |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                               | [Códigos postales](/es/data/postal-codes)                                       |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                     | [Prisiones](/es/data/prisons), [Maisons de justice](/es/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                               | [Tipos de interés](/es/data/interest-rates#shape)                               |
