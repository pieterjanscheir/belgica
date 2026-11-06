# Common tasks

Recipes for the questions Belgian legal software asks most often. Every example imports from the
package root unless it says otherwise. See [entry points](./entry-points) to import less.

## Which function?

| You have                            | You want                                      | Use                                                                                          |
| ----------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A municipality (REFNIS code)        | Its cantons                                   | [`getCantonsForMunicipality`](/api#getcantonsformunicipality)                                |
| A municipality                      | Its justices of the peace, with their cantons | [`findJusticesOfThePeace`](/api#findjusticesofthepeace)                                      |
| A municipality and a court type     | The courts of that type with jurisdiction     | [`findCourtsWithJurisdiction`](/api#findcourtswithjurisdiction)                              |
| A postal code and a court type      | Both of the above, per municipality           | [`findCourtsForPostalCode`](/api#findcourtsforpostalcode)                                    |
| A postal code                       | Its municipalities                            | [`getMunicipalitiesForPostalCode`](/api#getmunicipalitiesforpostalcode)                      |
| Coordinates                         | The canton, or the arrondissement             | [`findCantonsAt`](/api#findcantonsat), [`findArrondissementsAt`](/api#findarrondissementsat) |
| A canton                            | Its justice of the peace                      | [`getJusticeOfThePeace`](/api#getjusticeofthepeace)                                          |
| A canton                            | Every court whose area holds it               | [`getCourtsForCanton`](/api#getcourtsforcanton)                                              |
| A court                             | Its divisions or seats                        | [`getDivisions`](/api#getdivisions)                                                          |
| A type, arrondissement or area      | The courts that match                         | [`findCourts`](/api#findcourts)                                                              |
| A court                             | Its name in a language                        | [`formatCourtName`](/api#formatcourtname)                                                    |
| A court, prison or house of justice | A phone number, e-mail or bank account        | [`getContact`](/api#getcontact)                                                              |
| A day                               | The legal or commercial interest rate         | [`getInterestRate`](/api#getinterestrate)                                                    |
| The last day of a deadline          | The day it moves to                           | [`nextWorkingDay`](/api#nextworkingday)                                                      |

`findJusticesOfThePeace`, `findCourtsWithJurisdiction` and `findCourtsForPostalCode` combine the
territory and the courts, so they're only in the package root.

## Which justice of the peace for an address?

The justice of the peace is the court of a canton, and a canton is a set of municipalities or
parts of them. Start from the municipality's REFNIS code:

```ts
import { findJusticesOfThePeace } from 'belgica'

const [result] = findJusticesOfThePeace('44088') // Merelbeke-Melle
result.court.id // 'justice-of-the-peace-merelbeke-melle'
result.partial // false: the canton covers the whole municipality
```

For a city split over several cantons you get one entry per canton, each with
`partial: true`, and the street decides:

```ts
findJusticesOfThePeace('44021').map((r) => r.canton.id) // ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
```

There are two ways to settle it:

- **With the address's coordinates**, ask the [canton boundaries](/data/canton-boundaries).
  They're in their own entry point, because the geometry is large:

    ```ts
    import { findCantonsAt } from 'belgica/canton-boundaries'
    import { getJusticeOfThePeace } from 'belgica/courts'

    const [canton] = findCantonsAt(3.7268, 51.053) // longitude, latitude: gent-1
    getJusticeOfThePeace(canton.id).address
    ```

    Geocoding the address is up to you: the regions' address registers and the federal BeST
    address data on geo.be do that.

- **Without coordinates**, show the candidates with each canton's `territory`, the law's
  description of its part of the city, and let a person choose.

The boundaries are the National Geographic Institute's reading of the law. For an address
close to a boundary line, the `territory` text decides.

The [court finder](./court-finder) does all of this in the browser, on a map, and shows the
calls behind each result.

## Which court of a type for a municipality?

Every court other than a justice of the peace lists the cantons its area holds (`cantons`), as
the law sets them. `findCourtsWithJurisdiction` finds the courts of a type whose area holds one
of the municipality's cantons:

```ts
import { findCourtsWithJurisdiction, getDivisions } from 'belgica'

findCourtsWithJurisdiction('23088', 'police-court').map((c) => c.id) // ['police-court-vilvoorde']
findCourtsWithJurisdiction('21004', 'labour-court').map((c) => c.id)
// ['labour-court-brussel-fr', 'labour-court-brussel-nl']: one per language in Brussels
```

The result is the court as a whole. Which division hears a case is set by royal decree and isn't
in the data yet ([#58](https://github.com/pieterjanscheir/belgica/issues/58)), so list the
divisions and let the user choose:

```ts
const [court] = findCourtsWithJurisdiction('44021', 'enterprise-court')
getDivisions(court.id).map((d) => d.id) // ['enterprise-court-gent-brugge', …, 'enterprise-court-gent-veurne']
```

The court types are `justice-of-the-peace`, `police-court`, `court-of-first-instance`,
`enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal` and
`court-of-assize`.

## From a postal code

Addresses come with a postal code, not a REFNIS code. `findCourtsForPostalCode` goes from the
postal code to its municipality, and from there to the justices of the peace and the courts of
the type you ask for:

```ts
import { findCourtsForPostalCode } from 'belgica'

const [gent] = findCourtsForPostalCode('9050', 'labour-court')
gent.municipality.name.nl // 'Gent'
gent.courts.map((c) => c.id) // ['labour-court-gent']
gent.justicesOfThePeace.map((r) => r.canton.id) // ['gent-1', …, 'gent-5']: the street decides
```

It answers per municipality. Three postal codes, `1040`, `1050` and `1804`, belong to two
municipalities, and you get both rather than a guess:

```ts
findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
```

## Every court for a canton

`getCourtsForCanton` gives the justice of the peace of a canton and, of every other type, the
court whose area holds it:

```ts
import { getCourtsForCanton } from 'belgica'

getCourtsForCanton('gent-1').map((c) => c.id)
// ['court-of-appeal-gent', 'court-of-assize-oost-vlaanderen', 'court-of-first-instance-oost-vlaanderen',
//  'enterprise-court-gent', 'justice-of-the-peace-gent-1', 'labour-court-gent',
//  'labour-court-of-appeal-gent', 'police-court-oost-vlaanderen']
```

## Show a court's name and contacts

Use the name as the court publishes it wherever it has legal weight, in a summons or a letter.
`formatCourtName` picks the language, and falls back to one the court publishes in:

```ts
import { formatCourtName, getCourt } from 'belgica'

const court = getCourt('justice-of-the-peace-gent-1')
formatCourtName(court, 'nl') // 'Vredegerecht Gent 1'
formatCourtName(court, 'fr') // 'Vredegerecht Gent 1': the court publishes in Dutch only
formatCourtName(court, 'fr', { style: 'canton' }) // 'Justice de paix 1er canton Gand': a display label
```

Larger courts have a registry per matter, each with its own contacts. `getContact` takes the
registry's label as the court publishes it:

```ts
import { formatIban, formatPhoneNumber, getContact } from 'belgica'

getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal') // 'liege.ca.greffepenal@just.fgov.be'
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

List a court's `contacts` to see which labels it uses. They're free text, in the language of the
court's page.

## A list of courts for a form

`findCourts` filters by type, kind, arrondissement and judicial area. `kind: 'court'` leaves out
divisions and seats:

```ts
import { findCourts } from 'belgica'

findCourts({ type: 'court-of-appeal' }) // the five courts of appeal
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
```

A browser form that needs only some courts can load much less than `belgica/courts`: see
[only the courts you need](/data/courts#only-the-courts-you-need).

## Interest on a day

```ts
import { getInterestRate } from 'belgica'

getInterestRate('2024-06-15', 'legal') // { rate: 5.75, period: { from: '2024-01-01', to: '2024-12-31' } }
getInterestRate('2014-06-15', 'commercial') // { rate: 7.5, … }: a contract from before 16 March 2013
getInterestRate('2014-06-15', 'commercial', { contractAfter20130316: true }) // { rate: 8.5, … }
```

A claim that runs over several periods needs the rate of each. The `period` in the result says
where the current one ends. `null` means no rate is on file for that day: warn rather than use
0 %. See [interest rates](/data/interest-rates).

## The last day of a deadline

When the last day of a procedural deadline is a Saturday, a Sunday or a legal public holiday, it
moves to the next working day (art. 53 Ger.W. / C. jud.):

```ts
import { isJudicialHoliday, nextWorkingDay } from 'belgica/calendar'

nextWorkingDay('2026-04-04') // '2026-04-07': Saturday, Sunday, then Easter Monday
isJudicialHoliday('2026-08-14') // true: 1 July to 31 August
```

When a deadline starts and how long it runs depend on the procedure, and are left to you. See
[public holidays](/data/public-holidays).

## Reach a prison or a house of justice

```ts
import { getContact, getHouseOfJustice, getPrison } from 'belgica'

getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
getHouseOfJustice('justitiehuis-gent').address
getContact(getHouseOfJustice('maison-justice-arlon'), 'email', "service d'accueil des victimes")
```

## Put the cantons on a map

The boundaries are GeoJSON `MultiPolygon`s in WGS 84, ready for any map library or GIS:

```ts
import { cantonBoundaries } from 'belgica/canton-boundaries'

const collection = {
    type: 'FeatureCollection',
    // The array holds every version: keep the ones that still apply
    features: cantonBoundaries
        .filter((b) => b.validTo === undefined)
        .map((b) => ({
            type: 'Feature',
            id: b.canton,
            properties: {},
            geometry: b.geometry,
        })),
}
```

The file is 23 MB of JSON. In a browser, load `belgica/data/canton-boundaries.json` when the map
opens rather than in the main bundle. See [canton boundaries](/data/canton-boundaries).
