# Referência da API {#api-reference}

Tudo é exportado a partir da raiz do pacote, e cada conjunto de dados tem também o seu próprio
entry point:

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Só o que usa: as taxas de juro sozinhas são alguns kilobytes
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Entry point                    | Conteúdo                                                                   |
| ------------------------------ | -------------------------------------------------------------------------- |
| `belgica`                      | Tudo o que está abaixo, exceto os limites dos cantões                      |
| `belgica/territory`            | Áreas judiciais, arrondissements, cantões, municípios, províncias, regiões |
| `belgica/canton-boundaries`    | A geometria dos cantões, e `findCantonsAt`                                 |
| `belgica/courts`               | Tribunais, e as funções auxiliares de contactos                            |
| `belgica/prisons`              | Prisões, e as funções auxiliares de contactos                              |
| `belgica/houses-of-justice`    | Maisons de justice / justitiehuizen, e as funções auxiliares de contactos  |
| `belgica/interest-rates`       | Taxas de juro                                                              |
| `belgica/postal-codes`         | Códigos postais, com os municípios a que pertencem                         |
| `belgica/data/*.json`          | Os ficheiros de dados em bruto                                             |
| `belgica/schema/*.schema.json` | [JSON Schemas](/pt/guide/schema)                                           |
| `belgica/datapackage.json`     | [Descritor do data package](/pt/guide/schema#datapackage-json)             |

Convenções:

- As pesquisas por id devolvem `undefined` quando nada corresponde; as funções de lista devolvem
  um array vazio.
- As funções só lançam erros para input inválido: um dia mal formado, ou um dia anterior à
  cobertura dos dados (`RangeError`). Nunca por dados em falta.
- Cada pesquisa aceita um dia opcional, `{ on: '2025-06-01' }` ou um `Date`, e responde para
  hoje sem ele. Uma pesquisa por id encontra sempre um registo conhecido: a versão de hoje, ou a
  última de um registo que terminou. Veja [tempo](#time).
- Os conjuntos de dados exportados são `readonly`: copie antes de ordenar ou alterar
  (`[...courts].sort()`).
- Uma pesquisa com um id conhecido (um literal como `'gent-1'`, ou um valor do tipo `CantonId`)
  devolve o próprio registo, nunca `undefined`. Qualquer outra string devolve
  `Record | undefined`. Veja [identificadores](/pt/guide/identifiers).

## Território {#territory}

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
getMunicipality('21004').province // '04000': Bruxelas não tem província, este é o código da região
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
getProvince('04000') // undefined: a Região de Bruxelas-Capital não é uma província
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // a versão desse dia
getCanton('gent-1', { on: '2020-01-01' }) // RangeError: os dados descrevem 2025-01-01 em diante
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

Os cantões que abrangem um município num dia, hoje por omissão. Um cantão para a maioria dos
municípios; vários para as cidades divididas (Antwerpen, Gent, Brussel, …). Nesse caso decide a
morada exata, e o `territory` de cada cantão descreve a sua parte.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

O arrondissement judicial em que fica um município, por código REFNIS. Cada município fica em
exatamente um, mesmo uma cidade dividida por vários cantões.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

A província em que fica um município, por código REFNIS. `undefined` para os 19 municípios da
Região de Bruxelas-Capital, que não tem província, e para um código desconhecido.

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

## Limites dos cantões {#canton-boundaries}

Só em `belgica/canton-boundaries`: a geometria tem cerca de um milhão de posições, por isso a
raiz do pacote não a reexporta (os tipos, sim). Veja a
[página de dados](/pt/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

Os cantões cujo limite contém um ponto, num dia (hoje por omissão). Primeiro a longitude, depois
a latitude, em graus decimais (WGS 84), pela ordem do GeoJSON. Um cantão para um ponto na
Bélgica; nenhum fora dela; dois para um ponto sobre a linha entre dois cantões. Lança um
`RangeError` para coordenadas que não sejam números finitos.

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

## Tribunais {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Um tribunal, divisão ou sede. Os ids são o `type` do tribunal seguido do local:
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

O justice de paix / vredegerecht de um cantão. Cada cantão tem um. Um justice de paix com sede
em vários locais (Philippeville, em Couvin e Florennes) não tem morada nem contactos próprios: as
suas sedes têm-nos, veja `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // o vredegerecht de Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

As divisões de um tribunal, ou as sedes de um justice de paix com sede em vários locais, num dia
(hoje por omissão); vazio para um tribunal sem divisões.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

Os tribunais cuja área contém um cantão num dia (hoje por omissão): o seu justice de paix e, de
cada um dos outros tipos, o tribunal que o abrange (o tribunal como um todo, não as suas
divisões); em Bruxelas, os tribunais das duas línguas de um mesmo tipo. Vazio para um cantão
desconhecido.

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

Os tribunais que correspondem a todos os filtros dados e se aplicam num dia (hoje por omissão);
um filtro vazio devolve todos os tribunais desse dia.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // as suas divisões aí
findCourts({ type: 'court-of-appeal' }) // os cinco hoven van beroep / cours d'appel
```

## Contactos {#contacts}

Em cada entry point que tem registos com contactos: a raiz, `courts`, `prisons` e
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

O valor do primeiro contacto desse tipo, opcionalmente com essa etiqueta (a secretaria ou o
serviço, tal como a fonte o designa).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Um número belga na sua forma escrita nacional. Lança um `RangeError` para tudo o que não seja um
número belga em formato E.164.

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

## Prisões {#prisons}

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

## Códigos postais {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Um registo por id: o código postal e o código REFNIS unidos, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

Os municípios a que um código postal pertence num dia (hoje por omissão): um para quase todos os
códigos; dois para `1040`, `1050` e `1804`, onde decide a rua. Os mesmos registos
`Municipality` que `getMunicipality` dá. Vazio para um código desconhecido.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

Os códigos postais de um município num dia (hoje por omissão), por código REFNIS, por ordem.
Vazio para um código desconhecido.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Competência {#jurisdiction}

Perguntas que combinam conjuntos de dados. Estão só na raiz do pacote, porque precisam tanto do
território como dos tribunais.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

Os tribunais de um tipo competentes para um município num dia (hoje por omissão), por código
REFNIS: os tribunais cuja área, tal como a lei a fixa (`cantons`), contém um dos cantões do
município. Um tribunal para a maioria dos municípios; em Bruxelas o tribunal neerlandófono e o
francófono; para uma cidade dividida por cantões, cada justice de paix que serve um deles. Dá o
tribunal como um todo:
[`findDivisionsWithJurisdiction`](#finddivisionswithjurisdiction-municipalityid-type) dá a
divisão. Vazio para um código desconhecido.

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
    matter?: Matter // o tipo de processo: 'civil' | 'criminal'
}
```

Onde dar entrada do processo para um município, por código REFNIS: para cada tribunal que
[`findCourtsWithJurisdiction`](#findcourtswithjurisdiction-municipalityid-type) dá, a divisão
cuja área contém o município, tal como a fixam os decretos reais adotados ao abrigo do art. 186
do Gerechtelijk Wetboek / Code judiciaire (veja [divisões](/pt/data/courts#divisions)). Um
município pertence à divisão que o indica em `municipalities` ou, se nenhuma o indicar, à que tem
o seu cantão em `cantons`. Um tribunal que não está dividido dá-se a si próprio. Uma cidade
dividida por cantões que vão para divisões diferentes daria cada uma delas, e decide a morada
exata; hoje nenhuma cidade está dividida assim. Vazio para um código desconhecido.

O tribunal de première instance e o tribunal de police de Antwerpen têm uma área para os
processos cíveis e outra para os penais (o
[`criminalArea`](/pt/data/courts#civil-and-criminal-cases) de uma divisão): Hulshout e Herenthout
vão para Mechelen nos primeiros e para Turnhout nos segundos. `matter` diz qual. Sem ele, esses
dois municípios recebem as duas divisões, a cível primeiro; todos os outros municípios recebem a
mesma resposta seja qual for o tipo de processo.

```ts
findDivisionsWithJurisdiction('31005', 'enterprise-court').map((c) => c.id) // ['enterprise-court-gent-brugge']
findDivisionsWithJurisdiction('52055', 'labour-court').map((c) => c.id)
// ['labour-court-hainaut-charleroi']: Pont-à-Celles, embora o resto do seu cantão vá para Binche
findDivisionsWithJurisdiction('24062', 'court-of-first-instance').map((c) => c.id)
// ['court-of-first-instance-leuven']: não está dividido
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// ['police-court-oost-vlaanderen-gent']
findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
// ['police-court-antwerpen-turnhout']: Hulshout, que nos processos cíveis vai para Mechelen
```

### `findJusticesOfThePeace(municipalityId)` {#findjusticesofthepeace-municipalityid}

```ts
function findJusticesOfThePeace(municipalityId: string, options?: OnDay): CantonCourt[]

interface CantonCourt {
    canton: Canton
    court: Court
    partial: boolean // o cantão abrange só parte do município
}
```

Os justices de paix para um município num dia (hoje por omissão): um para a maioria dos
municípios, vários para uma cidade dividida por cantões, onde decide a morada exata e o
`territory` de cada cantão diz que parte abrange.

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

Os tribunais para um código postal num dia (hoje por omissão), por município: o código postal dá
o município ([códigos postais](/pt/data/postal-codes)), o município dá os seus justices de paix e
os seus tribunais do tipo pedido. Uma entrada para quase todos os códigos; duas para `1040`,
`1050` e `1804`, que pertencem a dois municípios, por isso a resposta nunca é reduzida a um
deles. Vazio para um código desconhecido. Numa cidade dividida por cantões, continua a ser a rua
a decidir entre os justices de paix, como com `findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Taxas de juro {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // percentagem
    period: { from: string; to: string }
}
```

A taxa que se aplica num dia, ou `null` quando não há taxa registada para ele. Um `Date` é lido
como um dia de calendário local; uma string tem de começar por um dia `YYYY-MM-DD` válido (um
timestamp ISO serve, a hora é ignorada).

Lança um `RangeError` para tudo o resto: `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` ou um
`Date` inválido. Uma taxa em falta é `null`; um dia mal formado é um erro, por isso os dois não
podem ser confundidos.

`contractAfter20130316` só importa para o juro comercial entre 2013 e 15 de março de 2015; por
omissão é usada a taxa para os contratos mais antigos. Veja
[taxas de juro](/pt/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

O último dia para o qual há uma taxa registada, `YYYY-MM-DD`.

## Tempo {#time}

Cada registo tem um período de validade, e cada pesquisa aceita um dia. As funções auxiliares são
exportadas para os seus próprios registos.

```ts
interface Validity {
    validFrom?: string // primeiro dia, YYYY-MM-DD; nenhum: desde antes da cobertura
    validTo?: string // último dia; nenhum: ainda se aplica
}

interface OnDay {
    on?: Date | string // hoje por omissão; um Date é lido como um dia local
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD', ou um RangeError
```

Cada conjunto de dados indica a partir de que dia descreve a situação; uma pesquisa para um dia
anterior lança um `RangeError` em vez de responder com o mapa de hoje. O território e a lista de
tribunais decorrem da lei tal como alterada para 1 de janeiro de 2025; as prisões e as maisons de
justice são conhecidas a partir do dia em que os seus sites foram lidos pela primeira vez. Estão
previstas versões anteriores ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

Os arrays exportados (`courts`, `prisons`, …) contêm todas as versões de todos os registos. Um
registo que a fonte deixa de listar não é apagado: mantém o seu id e recebe um `validTo`, o dia
anterior à verificação semanal que não o encontrou. Um que a fonte começa a listar recebe um
`validFrom`. Assim, uma pesquisa por id sem dia devolve a versão de hoje, ou a última versão de
um registo que terminou: verifique o `validTo` antes de apresentar ali o que quer que seja.

## Conjuntos de dados {#datasets}

Os conjuntos de dados completos, tipados:

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

| Tipo                                                                                                                                                                                                              | Descrito em                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`: uniões dos ids presentes nos dados, regeneradas com eles | [Identificadores](/pt/guide/identifiers#in-typescript)                        |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                                 |                                                                               |
| `SourceRef` = `{ url: string; retrieved: string }`: de onde vêm os dados de um registo                                                                                                                            | [Qualidade dos dados](/pt/guide/data-quality)                                 |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                           |                                                                               |
| `Bilingual` = `Record<'nl' \| 'fr', string>`: nomes tal como o Gerechtelijk Wetboek / Code judiciaire os dá                                                                                                       |                                                                               |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                               | [Território](/pt/data/territory)                                              |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                           | [Tribunais](/pt/data/courts#shape)                                            |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                                  | [Códigos postais](/pt/data/postal-codes)                                      |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                        | [Prisões](/pt/data/prisons), [Maisons de justice](/pt/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                                  | [Taxas de juro](/pt/data/interest-rates#shape)                                |
