# Court finder

Type an address, or click a point on the map, and see which courts have territorial
jurisdiction there: the justice of the peace of the canton, and the police court, court of
first instance, enterprise court, labour court, court of appeal, labour court of appeal and
court of assize whose area holds it. It runs on this package, in your browser, and shows the
calls behind every result.

<CourtFinder />

The map tints every canton in one of six colours, never the same as a neighbour's. Zoom in to
a split city and the building outlines and house numbers sit on the tint, so the canton of each
house shows. Hover for the canton and its justice of the peace. A result's link holds the
address (`?q=…`) or the point (`?at=lat,lon`), so it can be shared.

## How it works

Three steps, each one function. Only the first needs something the package doesn't have.

### 1. Address to point

The package is not a geocoder. Each region keeps its own address register with an API that
answers from the browser: the Adressenregister (Digitaal Vlaanderen) in Flanders, UrbIS
(paradigm.brussels) in Brussels, ICAR (SPW) in Wallonia. The postal code in the address says
which register to ask; `getMunicipalitiesForPostalCode` gives the region:

```ts
import { getMunicipalitiesForPostalCode } from 'belgica'

const postalCode = address.match(/\b\d{4}\b/g)?.at(-1) // the last four digits: not a house number
const region = postalCode && getMunicipalitiesForPostalCode(postalCode)[0]?.region
// '02000' Flanders, '03000' Wallonia, '04000' Brussels: which register to ask
```

For an address the register knows down to the house number, the point is on the building, so
the even and odd sides of a boundary street fall in the right canton. When it knows only the
street, the point is somewhere on the street, and the finder says so.

### 2. Point to canton

`findCantonsAt` from `belgica/canton-boundaries` holds the point against the NGI's boundary of
every canton: one canton for a point in Belgium, two for a point on the line between them,
none outside Belgium.

```ts
import { findCantonsAt } from 'belgica/canton-boundaries'

findCantonsAt(4.4203, 51.2287).map((c) => c.id) // ['antwerpen-4']: longitude first
```

The boundaries are 23 MB of JSON, so this page doesn't load that module. It fetches one file per
canton, written from `data/canton-boundaries.json` when the site is built, and only the cantons
whose bounding box holds the point: a few hundred kilobytes. The test itself is the package's
own, the ray casting `findCantonsAt` uses (`src/geometry.ts`), so the answer is the same. On a
server, call `findCantonsAt` and be done.

Within 25 m of another canton the finder warns and shows the law's text for both: the NGI drew
the boundary from the annex to the Judicial Code, and for a house on the line the
[text decides](/data/canton-boundaries#why-it-s-useful).

### 3. Canton to courts

`getCourtsForCanton` gives the justice of the peace of the canton and, of every other type, the
court whose area holds it:

```ts
import { formatCourtName, getContact, getCourtsForCanton } from 'belgica'

for (const court of getCourtsForCanton('antwerpen-4')) {
    formatCourtName(court, 'nl') // 'Vredegerecht Antwerpen 4', 'Politierechtbank Antwerpen', …
    court.address // where to file
    getContact(court, 'email') // the registry's e-mail
}
```

Which division of a court hears the case is set by royal decree and isn't in the data yet
([#58](https://github.com/pieterjanscheir/belgica/issues/58)): `getDivisions` lists them.

## The map

The map is [MapLibre GL](https://maplibre.org) on [OpenFreeMap](https://openfreemap.org)'s
vector tiles (OpenStreetMap data), with the cantons as a GeoJSON source on top. Any map library
takes the boundaries as they are:

```ts
import { appliesOn, toDay } from 'belgica'
import { cantonBoundaries } from 'belgica/canton-boundaries'

const today = toDay(new Date())

map.addSource('cantons', {
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: cantonBoundaries
            .filter((b) => appliesOn(b, today)) // the versions in force today
            .map((b) => ({ type: 'Feature', id: b.canton, properties: {}, geometry: b.geometry })),
    },
})
```

What this page does on top, and an app may copy:

- **An overview and the detail.** The build simplifies every boundary to about 50 m for one
  overview file, drawn when zoomed out. From zoom 11.5 the map fetches the cantons in view at
  full precision, so a house on a boundary street is on the right side.
- **Six colours.** Neighbouring cantons never share a colour: the build finds the neighbours
  (cantons that share a boundary point) and colours the most connected first.
- **Buildings and house numbers over the tint.** The vector tiles have the building outlines
  and house numbers; drawn above the canton fill, every house shows which canton it is in.
- **The justices of the peace.** `belgica/court-locations` has the NGI's point for most of
  them, drawn as dots from zoom 9.

The build script is [`scripts/build-docs-map.ts`](https://github.com/pieterjanscheir/belgica/blob/main/scripts/build-docs-map.ts),
the map [`CantonMap.vue`](https://github.com/pieterjanscheir/belgica/blob/main/docs/.vitepress/components/CantonMap.vue)
and the finder [`CourtFinder.vue`](https://github.com/pieterjanscheir/belgica/blob/main/docs/.vitepress/components/CourtFinder.vue).

## Built on the package

- [**CourtMap**](https://courtmap.be/) takes this further: the same map down
  to the house, the divisions that serve the address, routes and opening hours, deadlines and
  interest, in four languages, with an MCP server and a REST API. Its source is on
  [GitHub](https://github.com/pieterjanscheir/courtfull).
- The [explorer](https://belgica.scheir.eu/) has a page for every court, canton, municipality
  and postal code, in 13 languages.

::: warning Reference data, not legal advice
The courts' areas are the law's, the boundaries the NGI's reading of it, the addresses the
regions' registers'. Check the official sources before relying on a result where it matters.
:::
