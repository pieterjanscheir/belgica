# Référence de l'API {#api-reference}

Tout est exporté depuis la racine du package, et chaque jeu de données a aussi son propre point d'entrée :

```ts
import { getCanton, getInterestRate /* … */ } from 'belgica'

// Seulement ce que vous utilisez : les taux d'intérêt seuls ne pèsent que quelques kilooctets
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt, getJusticeOfThePeace } from 'belgica/courts'
import { getCanton, getCantonsForMunicipality } from 'belgica/territory'
import { findCantonsAt } from 'belgica/canton-boundaries'
import { getPrison } from 'belgica/prisons'
import { getHouseOfJustice } from 'belgica/houses-of-justice'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

| Point d'entrée                 | Contenu                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `belgica`                      | Tout ce qui suit, sauf les limites des cantons                   |
| `belgica/territory`            | Ressorts, arrondissements, cantons, communes, provinces, régions |
| `belgica/canton-boundaries`    | La géométrie des cantons, et `findCantonsAt`                     |
| `belgica/courts`               | Cours et tribunaux, et les helpers de coordonnées                |
| `belgica/prisons`              | Prisons, et les helpers de coordonnées                           |
| `belgica/houses-of-justice`    | Maisons de justice, et les helpers de coordonnées                |
| `belgica/interest-rates`       | Taux d'intérêt                                                   |
| `belgica/postal-codes`         | Codes postaux, avec les communes auxquelles ils appartiennent    |
| `belgica/data/*.json`          | Les fichiers de données bruts                                    |
| `belgica/schema/*.schema.json` | [JSON Schemas](/fr/guide/schema)                                 |
| `belgica/datapackage.json`     | [Descripteur de data package](/fr/guide/schema#datapackage-json) |

Conventions :

- Les recherches par id renvoient `undefined` quand rien ne correspond ; les fonctions de liste renvoient un tableau vide.
- Les fonctions ne lèvent une erreur que pour une entrée invalide : un jour mal formé, ou un jour antérieur à la
  couverture des données (`RangeError`). Jamais pour des données manquantes.
- Chaque recherche accepte un jour facultatif, `{ on: '2025-06-01' }` ou une `Date`, et répond pour
  aujourd'hui sans. Une recherche par id trouve toujours un enregistrement connu : la version d'aujourd'hui, ou la
  dernière d'un enregistrement qui a pris fin. Voir [temps](#time).
- Les jeux de données exportés sont `readonly` : copiez avant de trier ou de modifier (`[...courts].sort()`).
- Une recherche avec un id connu (un littéral comme `'gent-1'`, ou une valeur typée `CantonId`) renvoie l'enregistrement
  lui-même, jamais `undefined`. Toute autre chaîne renvoie `Record | undefined`.
  Voir [identifiants](/fr/guide/identifiers).

## Territoire {#territory}

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
getMunicipality('21004').province // '04000' : Bruxelles n'a pas de province, c'est le code de la région
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
getProvince('04000') // undefined : la Région de Bruxelles-Capitale n'est pas une province
```

### `getCanton(id)` {#getcanton-id}

```ts
function getCanton(id: CantonId): Canton
function getCanton(id: string, options?: OnDay): Canton | undefined
```

```ts
getCanton('oudergem').seat.nl // 'Etterbeek'
getCanton('gent-1', { on: '2025-06-01' }) // la version de ce jour-là
getCanton('gent-1', { on: '2020-01-01' }) // RangeError : les données décrivent la situation à partir du 2025-01-01
```

### `getCantonsForMunicipality(id)` {#getcantonsformunicipality-id}

```ts
function getCantonsForMunicipality(id: string, options?: OnDay): Canton[]
```

Les cantons qui couvrent une commune un jour donné, aujourd'hui par défaut. Un seul canton pour la plupart des
communes ; plusieurs pour les villes scindées (Anvers, Gand, Bruxelles, …). L'adresse de rue décide alors, et le
`territory` de chaque canton décrit la partie qui lui revient.

```ts
getCantonsForMunicipality('44088').map((c) => c.id) // ['merelbeke-melle']
getCantonsForMunicipality('44021').map((c) => c.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

### `getArrondissementForMunicipality(id)` {#getarrondissementformunicipality-id}

```ts
function getArrondissementForMunicipality(id: string, options?: OnDay): Arrondissement | undefined
```

L'arrondissement judiciaire dans lequel se situe une commune, par code REFNIS. Chaque commune se situe dans un seul
arrondissement, même une ville scindée en plusieurs cantons.

```ts
getArrondissementForMunicipality('44021')?.id // 'oost-vlaanderen'
```

### `getProvinceForMunicipality(id)` {#getprovinceformunicipality-id}

```ts
function getProvinceForMunicipality(id: string, options?: OnDay): Province | undefined
```

La province dans laquelle se situe une commune, par code REFNIS. `undefined` pour les 19 communes
de la Région de Bruxelles-Capitale, qui n'a pas de province, et pour un code inconnu.

```ts
getProvinceForMunicipality('44021')?.id // '40000'
getProvinceForMunicipality('21004') // undefined : Bruxelles
```

### `getRegionForMunicipality(id)` {#getregionformunicipality-id}

```ts
function getRegionForMunicipality(id: string, options?: OnDay): Region | undefined
```

```ts
getRegionForMunicipality('21004')?.name.fr // 'Région de Bruxelles-Capitale'
```

## Limites des cantons {#canton-boundaries}

Seulement dans `belgica/canton-boundaries` : la géométrie représente environ un million de
positions, si bien que la racine du package ne la réexporte pas (les types, si). Voyez la
[page du jeu de données](/fr/data/canton-boundaries).

### `findCantonsAt(longitude, latitude)` {#findcantonsat-longitude-latitude}

```ts
function findCantonsAt(longitude: number, latitude: number, options?: OnDay): Canton[]
```

Les cantons dont la limite contient un point, à un jour donné (aujourd'hui par défaut). La
longitude d'abord, puis la latitude, en degrés décimaux (WGS 84), comme les ordonne GeoJSON. Un
seul canton pour un point en Belgique ; aucun hors de celle-ci ; deux pour un point sur la ligne
entre deux cantons. Lève une `RangeError` pour des coordonnées qui ne sont pas des nombres finis.

```ts
findCantonsAt(3.7268, 51.053).map((c) => c.id) // ['gent-1'] : Sint-Baafskathedraal
findCantonsAt(2.3522, 48.8566) // [] : Paris
```

### `getCantonBoundary(cantonId)` {#getcantonboundary-cantonid}

```ts
function getCantonBoundary(id: CantonId): CantonBoundary
function getCantonBoundary(id: string, options?: OnDay): CantonBoundary | undefined
```

```ts
getCantonBoundary('gent-1').geometry.type // 'MultiPolygon'
```

## Cours et tribunaux {#courts}

### `getCourt(id)` {#getcourt-id}

```ts
function getCourt(id: CourtId): Court
function getCourt(id: string, options?: OnDay): Court | undefined
```

Une cour ou un tribunal, une division ou un siège. Les ids sont le `type` de la juridiction suivi du lieu :
`justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`.

```ts
getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
```

### `getJusticeOfThePeace(cantonId)` {#getjusticeofthepeace-cantonid}

```ts
function getJusticeOfThePeace(cantonId: CantonId): Court
function getJusticeOfThePeace(cantonId: string, options?: OnDay): Court | undefined
```

La justice de paix d'un canton. Chaque canton en a une. Une justice de paix qui siège en plusieurs lieux
(Philippeville, à Couvin et à Florennes) n'a ni adresse ni coordonnées propres : ce sont ses sièges qui les ont,
voir `getDivisions`.

```ts
const [canton] = getCantonsForMunicipality('44088')
getJusticeOfThePeace(canton.id).address // la justice de paix de Merelbeke-Melle
```

### `getDivisions(courtId)` {#getdivisions-courtid}

```ts
function getDivisions(courtId: string, options?: OnDay): Court[]
```

Les divisions d'une juridiction, ou les sièges d'une justice de paix qui siège en plusieurs lieux, un jour donné
(aujourd'hui par défaut) ; vide pour une juridiction qui n'en a pas.

```ts
getDivisions('labour-court-gent').map((c) => c.id) // ['labour-court-gent-aalst', …]
```

### `getCourtsForCanton(cantonId)` {#getcourtsforcanton-cantonid}

```ts
function getCourtsForCanton(cantonId: string, options?: OnDay): Court[]
```

Les juridictions dont le ressort comprend un canton un jour donné (aujourd'hui par défaut) : sa justice de paix et,
pour chaque autre type, la juridiction qui le couvre (la juridiction dans son ensemble, pas ses divisions) ; à
Bruxelles, les deux juridictions linguistiques d'un même type. Vide pour un canton inconnu.

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

Les juridictions qui satisfont à chacun des filtres donnés et qui s'appliquent un jour donné (aujourd'hui par
défaut) ; un filtre vide renvoie toutes les juridictions de ce jour-là.

```ts
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' }) // ses divisions dans cet arrondissement
findCourts({ type: 'court-of-appeal' }) // les cinq cours d'appel
```

### `formatCourtName(court, locale, options?)` {#formatcourtname-court-locale-options}

```ts
function formatCourtName(
    court: Court,
    locale: Locale,
    options?: { style?: 'official' | 'canton' },
): string
```

Le nom d'un tribunal dans une langue. `style: 'official'` (par défaut) donne le nom tel que le
tribunal le publie, tiré de `name`. Un tribunal qui ne publie pas dans `locale` donne son nom
dans une autre langue : pour le néerlandais, le français puis l'allemand ; pour le français, le
néerlandais puis l'allemand ; pour l'allemand, le français puis le néerlandais. Chaque tribunal
publie dans sa propre langue : c'est celle-là que vous obtenez.

`style: 'canton'` donne à une justice de paix un libellé construit à partir du numéro et du nom
de son canton, de la même façon dans chaque langue. **C'est un libellé d'affichage, pas le nom
officiel du tribunal** : utilisez `'official'` là où le nom a une portée juridique. Tout autre
tribunal, et un siège d'une justice de paix, reçoit son nom officiel, de sorte qu'une liste de
tribunaux de types différents peut utiliser un seul style. Seuls les cantons d'Eupen-Saint-Vith
ont un nom allemand (tiré d'un texte officiel allemand) ; pour les autres, en allemand, le nom du
canton est dans la langue du tribunal (le français à Bruxelles).

```ts
const court = getCourt('justice-of-the-peace-gent-1')
formatCourtName(court, 'fr') // 'Vredegerecht Gent 1' : le tribunal ne publie qu'en néerlandais
formatCourtName(court, 'nl', { style: 'canton' }) // 'Vredegerecht 1e kanton Gent'
formatCourtName(court, 'fr', { style: 'canton' }) // 'Justice de paix 1er canton Gand'
formatCourtName(court, 'de', { style: 'canton' }) // 'Friedensgericht 1. Kanton Gent'
formatCourtName(getCourt('justice-of-the-peace-deinze'), 'fr', { style: 'canton' }) // 'Justice de paix canton Deinze'
```

## Coordonnées {#contacts}

Dans chaque point d'entrée dont les enregistrements ont des coordonnées : la racine, `courts`, `prisons` et
`houses-of-justice`.

### `getContact(record, type, label?)` {#getcontact-record-type-label}

```ts
function getContact(
    record: { contacts: readonly Contact[] },
    type: 'phone' | 'fax' | 'email' | 'bank-account',
    label?: string,
): string | undefined
```

La valeur du premier contact de ce type, éventuellement avec ce libellé (le greffe ou le service, tel que la source
le nomme).

```ts
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal')
// 'liege.ca.greffepenal@just.fgov.be'
```

### `formatPhoneNumber(e164)` {#formatphonenumber-e164}

```ts
function formatPhoneNumber(e164: string): string
```

Un numéro belge dans sa forme écrite nationale. Lève une `RangeError` pour tout ce qui n'est pas un numéro belge au
format E.164.

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

## Prisons {#prisons}

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

## Codes postaux {#postal-codes}

### `getPostalCode(id)` {#getpostalcode-id}

```ts
function getPostalCode(id: PostalCodeId): PostalCode
function getPostalCode(id: string, options?: OnDay): PostalCode | undefined
```

Un enregistrement par id : le code postal et le code REFNIS joints, `'9000-44021'`.

### `getMunicipalitiesForPostalCode(postalCode)` {#getmunicipalitiesforpostalcode-postalcode}

```ts
function getMunicipalitiesForPostalCode(postalCode: string, options?: OnDay): Municipality[]
```

Les communes auxquelles un code postal appartient un jour donné (aujourd'hui par défaut) : une
seule pour presque tous les codes ; deux pour `1040`, `1050` et `1804`, où la rue tranche. Les
mêmes enregistrements `Municipality` que ceux de `getMunicipality`. Vide pour un code inconnu.

```ts
getMunicipalitiesForPostalCode('9050').map((m) => m.name.fr) // ['Gand']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.fr) // ['Bruxelles', 'Etterbeek']
getMunicipalitiesForPostalCode('0000') // []
```

### `getPostalCodes(municipalityId)` {#getpostalcodes-municipalityid}

```ts
function getPostalCodes(municipalityId: string, options?: OnDay): PostalCode[]
```

Les codes postaux d'une commune un jour donné (aujourd'hui par défaut), par code REFNIS, dans
l'ordre. Vide pour un code inconnu.

```ts
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]
```

## Compétence {#jurisdiction}

Des questions qui combinent plusieurs jeux de données. Elles ne sont disponibles qu'à la racine du package, puisqu'elles
ont besoin à la fois du territoire et des juridictions.

### `findCourtsWithJurisdiction(municipalityId, type)` {#findcourtswithjurisdiction-municipalityid-type}

```ts
function findCourtsWithJurisdiction(
    municipalityId: string,
    type: CourtType,
    options?: OnDay,
): Court[]
```

Les juridictions d'un type compétentes pour une commune un jour donné (aujourd'hui par défaut), par code REFNIS : les
juridictions dont le ressort, tel que la loi le fixe (`cantons`), comprend l'un des cantons de la commune. Une seule
juridiction pour la plupart des communes ; à Bruxelles, la juridiction néerlandophone et la francophone ; pour une
ville scindée en cantons, chaque justice de paix qui dessert l'un d'eux. La fonction renvoie la juridiction dans son
ensemble : la division qui connaît d'une affaire est fixée par arrêté royal et ne figure pas encore dans les données ;
choisissez donc parmi `getDivisions(court.id)`. Vide pour un code inconnu.

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
    partial: boolean // le canton ne couvre qu'une partie de la commune
}
```

Les justices de paix d'une commune un jour donné (aujourd'hui par défaut) : une seule pour la plupart des communes,
plusieurs pour une ville scindée en cantons, où l'adresse de rue décide et où le `territory` de chaque canton indique
la partie qu'il couvre.

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

Les juridictions pour un code postal un jour donné (aujourd'hui par défaut), par commune : le code
postal donne la commune ([codes postaux](/fr/data/postal-codes)), la commune ses justices de paix
et ses juridictions du type demandé. Une entrée pour presque tous les codes ; deux pour `1040`,
`1050` et `1804`, qui appartiennent à deux communes, de sorte que la réponse n'est jamais ramenée
à l'une d'elles. Vide pour un code inconnu. Dans une ville scindée en cantons, la rue tranche
toujours entre les justices de paix, comme avec `findJusticesOfThePeace`.

```ts
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: { id: '44021', … }, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.fr) // ['Bruxelles', 'Etterbeek']
```

## Taux d'intérêt {#interest-rates}

### `getInterestRate(date, type, options?)` {#getinterestrate-date-type-options}

```ts
function getInterestRate(
    date: Date | string,
    type: InterestType,
    options?: { contractAfter20130316?: boolean },
): InterestRateResult | null

interface InterestRateResult {
    rate: number // en pour cent
    period: { from: string; to: string }
}
```

Le taux qui s'applique un jour donné, ou `null` quand aucun taux n'est enregistré pour ce jour. Une `Date` est lue
comme un jour civil local ; une chaîne doit commencer par un jour `YYYY-MM-DD` valide (un horodatage ISO convient, son
heure est ignorée).

Lève une `RangeError` pour tout le reste : `'2013-1-15'`, `'15/01/2013'`, `'2013-02-30'` ou une `Date` invalide. Un
taux manquant vaut `null` ; un jour mal formé est une erreur, de sorte que les deux ne peuvent pas être confondus.

`contractAfter20130316` n'a d'importance que pour l'intérêt commercial entre 2013 et le 15 mars 2015 ; par défaut, le
taux des contrats plus anciens est utilisé. Voir [taux d'intérêt](/fr/data/interest-rates#the-2013-2015-contract-rule).

### `getLatestKnownRateDate(type)` {#getlatestknownratedate-type}

```ts
function getLatestKnownRateDate(type: InterestType): string
```

Le dernier jour pour lequel un taux est enregistré, `YYYY-MM-DD`.

## Temps {#time}

Chaque enregistrement a une période de validité, et chaque recherche accepte un jour. Les helpers sont exportés pour
vos propres enregistrements.

```ts
interface Validity {
    validFrom?: string // premier jour, YYYY-MM-DD ; absent : depuis avant la couverture
    validTo?: string // dernier jour ; absent : toujours en vigueur
}

interface OnDay {
    on?: Date | string // aujourd'hui par défaut ; une Date est lue comme un jour local
}

const territoryCoverage: { from: '2025-01-01' }
const courtsCoverage: { from: '2025-01-01' }
const prisonsCoverage: { from: '2026-10-20' }
const housesOfJusticeCoverage: { from: '2026-10-20' }
const postalCodesCoverage: { from: '2025-01-01' }

function appliesOn(record: Validity, day: string): boolean
function toDay(date: Date | string): string // 'YYYY-MM-DD', ou une RangeError
```

Chaque jeu de données indique à partir de quel jour il décrit la situation ; une recherche pour un jour antérieur
lève une `RangeError` plutôt que de répondre avec la carte d'aujourd'hui. Le territoire et la liste des juridictions
découlent de la loi telle que modifiée au 1er janvier 2025 ; les prisons et les maisons de justice sont connues
depuis le jour où leurs sites ont été lus pour la première fois. Des versions antérieures sont prévues
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

Les tableaux exportés (`courts`, `prisons`, …) contiennent chaque version de chaque enregistrement. Un enregistrement
que la source cesse de recenser n'est pas supprimé : il garde son id et reçoit un `validTo`, la veille de la
vérification qui ne l'a plus trouvé. Un enregistrement que la source commence à recenser reçoit un
`validFrom`. Une recherche par id sans jour renvoie donc la version d'aujourd'hui, ou la dernière version d'un
enregistrement qui a pris fin : vérifiez `validTo` avant d'y déposer quoi que ce soit.

## Jeux de données {#datasets}

Les jeux de données complets, typés :

| Export            | Type                                                 |
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

## Types {#types}

| Type                                                                                                                                                                                                                      | Décrit sur                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `JudicialAreaId`, `ArrondissementId`, `CantonId`, `RegionId`, `ProvinceId`, `MunicipalityId`, `CourtId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId` : unions des ids présents dans les données, régénérées avec elles | [Identifiants](/fr/guide/identifiers#in-typescript)                           |
| `Locale` = `'nl' \| 'fr' \| 'de'`                                                                                                                                                                                         |                                                                               |
| `SourceRef` = `{ url: string; retrieved: string }` : d'où proviennent les données d'un enregistrement                                                                                                                     | [Qualité et fraîcheur des données](/fr/guide/data-quality)                    |
| `Translated` = `Record<Locale, string>`                                                                                                                                                                                   |                                                                               |
| `Bilingual` = `Record<'nl' \| 'fr', string>` : les noms tels que le Code judiciaire les donne                                                                                                                             |                                                                               |
| `JudicialArea`, `Arrondissement`, `Canton`, `Region`, `Province`, `Municipality`, `LegalBasis`, `Validity`, `OnDay`                                                                                                       | [Territoire et cantons](/fr/data/territory)                                   |
| `Court`, `CourtType`, `CourtFilter`, `Address`, `Contact`, `ContactType`, `CantonCourt`                                                                                                                                   | [Cours et tribunaux](/fr/data/courts#shape)                                   |
| `PostalCode`, `PostalCodeCourts`                                                                                                                                                                                          | [Codes postaux](/fr/data/postal-codes)                                        |
| `Prison`, `HouseOfJustice`                                                                                                                                                                                                | [Prisons](/fr/data/prisons), [Maisons de justice](/fr/data/houses-of-justice) |
| `InterestType`, `InterestRatePeriod`, `InterestRateSeries`, `InterestRateResult`                                                                                                                                          | [Taux d'intérêt](/fr/data/interest-rates#shape)                               |
