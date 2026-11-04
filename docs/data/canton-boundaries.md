# Canton boundaries

<script setup>
import { data as stats } from '../.vitepress/stats.data'
</script>

File: `data/canton-boundaries.json`. The boundary of each of the {{ stats.cantons }} judicial
cantons as GeoJSON geometry, as the National Geographic Institute (NGI) digitised it from the
annex to the Judicial Code.

## Why it's useful

- **The canton of an address in a split city.** {{ stats.splitCantons }} cantons cover only
  part of a municipality (Antwerpen, Gent, Brussel, Luik, Charleroi, …), and
  `getCantonsForMunicipality` can only list the candidates. With the address geocoded,
  `findCantonsAt(lon, lat)` gives the one canton, and so the justice of the peace.
- **Maps.** The geometry is standard GeoJSON in WGS 84: draw the cantons on a map, join
  them to other geodata, or load them into PostGIS, QGIS or a spreadsheet with a map.
- **Checking the legal text.** The NGI's polygons are a second reading of the same annex,
  next to the `territory` text of each canton.

::: warning The legal text wins
The boundary is the NGI's interpretation of the annex to the Judicial Code, digitised on
cadastral municipality boundaries, watercourses and roads. The annex itself, quoted verbatim
in each canton's `territory`, is the law. For a point close to a boundary line, read the
text; it names the streets and the house numbers.
:::

## Source and updates

|              |                                                                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | NGI, [Judicial cantons and arrondissements](https://www.geo.be/catalog/details/e1f61c40-623a-11eb-9e7c-186571a04de3) (Territorial Divisions) on geo.be: the GeoPackage in WGS 84 (EPSG:4326), feature type `judicialcanton`, revised 16 July 2026 |
| Built by     | `scripts/parse/boundaries.ts` from the snapshot of the GeoPackage                                                                                                                                                                                 |
| Changes when | The NGI publishes a new version: every year, when the FPS Finance's municipal boundaries are updated, or when a law changes the annex                                                                                                             |
| Covers       | 21 October 2026 onwards, the day the file was first read: lookups for an earlier day throw a `RangeError` ([time](/api#time))                                                                                                                     |
| Checked      | Twice a week, by the [sources workflow](/guide/data-quality#how-the-data-is-built): the build fails when a canton has no boundary or a boundary matches no canton                                                                                 |
| Licence      | © NGI, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)                                                                                                                                                                                  |

How the NGI drew the boundaries, in its own words: where the annex refers to municipal
boundaries, it used the cadastral boundaries of the FPS Finance; where it refers to
watercourses or roads, the NGI's own topographic data; where it refers to former
municipalities, the NGI's boundaries of those. The scale is 1:10 000.

## Fields

| Field                  | Type                   | Description                                                                                                                                                           |
| ---------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `CantonId`             | The canton's id: a canton has one boundary, which takes its key                                                                                                       |
| `validFrom`, `validTo` | string?                | The days the record applies; none: since the coverage starts, or still applies. See [time](/api#time)                                                                 |
| `canton`               | `CantonId`             | The canton the boundary belongs to                                                                                                                                    |
| `ngiId`                | string                 | The NGI's identifier of the object (its `tgid`), a GUID                                                                                                               |
| `cantonCode`           | `{ nl, fr }`           | The canton code in the NGI's data: six digits (`248112` for Gent 1), with an `N` or `F` prefix per language in Brussels-Capital and in Sint-Genesius-Rode (`N238104`) |
| `geometry`             | `MultiPolygon`         | GeoJSON ([RFC 7946](https://www.rfc-editor.org/rfc/rfc7946)): WGS 84, longitude first, exterior rings counter-clockwise, holes clockwise                              |
| `sources`              | `{ url, retrieved }[]` | The NGI file the record was read from; for a [corrected](#where-the-ngi-is-behind-the-law) canton, then the law and Statbel's statistical sectors                     |

```ts
interface CantonBoundary {
    id: CantonId // 'gent-1'
    canton: CantonId // 'gent-1'
    ngiId: string // '{3905ED53-F233-4C4E-8225-4E43FEC7C541}'
    cantonCode: Bilingual // { nl: '248114', fr: '248114' }
    geometry: MultiPolygon // { type: 'MultiPolygon', coordinates: [[[[lon, lat], …]]] }
    sources: SourceRef[]
}
```

The geometry is the NGI's, vertex for vertex, apart from the [corrections](#where-the-ngi-is-behind-the-law): nothing is simplified. Coordinates are rounded to
7 decimals, about a centimetre, below the source's own precision. Every boundary is one
`MultiPolygon`, even when it has one polygon, so every record has the same shape.

### Where the NGI is behind the law

When a law moves an area to another canton and the NGI hasn't redrawn it yet, the build moves
it, so a lookup follows the law in force. Each correction is listed in
`scripts/parse/canton-corrections.ts` with the law that made it. It names a former municipality
(deelgemeente), whose outline is the union of its statistical sectors in
[Statbel's open data](https://statbel.fgov.be/nl/open-data/statistische-sectoren-2026) (CC BY
4.0). The part of that outline in the old canton goes to the new one, so the cantons still
cover Belgium once, without gaps or overlaps. Once the NGI redraws the area, the build says the
correction can go.

| Area       | NGI    | Law    | Since          | Law                                                                                                                                    |
| ---------- | ------ | ------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Mariakerke | Gent 2 | Gent 3 | 1 January 2025 | [Law of 15 May 2024, art. 90](https://www.ejustice.just.fgov.be/eli/wet/2024/05/15/2024004698/justel) (annex, afdeling 6, 13° and 14°) |

### How cantons are matched to the NGI's features

The NGI names each feature in Dutch and in French (`Eerste gerechtelijk kanton Gent`,
`Premier canton judiciaire de Gand`). A feature is the boundary of a canton when both names,
turned into an id the [usual way](/guide/identifiers), give that canton and agree on its
number. Seven features are named by their local name in both languages where the annex uses an
exonym (`Canton judiciaire de Halle`, where the annex says `Hal`; `Gerechtelijk kanton Huy`,
where it says `Hoei`); those are mapped by their canton code in `CANTON_ALIASES` in the parser.
Anything else stops the build.

## Size

The boundaries are by far the largest dataset: about a million positions, 23 MB of JSON for the
cantons and 8 MB for the arrondissements. They have their own entry points,
`belgica/canton-boundaries` and `belgica/arrondissement-boundaries`, which read the geometry from
`data/` with a JSON import, and the package root doesn't re-export them, so nothing loads them
unless it asks. In a browser, load the entry point when the map opens, with `import()`, rather
than in the main bundle.

The raw file, `data/canton-boundaries.json`, is in the npm package and in every release, so
Python, PostGIS and GIS tools can read it without the JavaScript.

## Finding the canton of a point

```ts
import { findCantonsAt, getCantonBoundary } from 'belgica/canton-boundaries'
import { getJusticeOfThePeace } from 'belgica/courts'

// Longitude first, then latitude, as GeoJSON orders them
const [canton] = findCantonsAt(3.7268, 51.053) // Sint-Baafskathedraal, Gent → gent-1
getJusticeOfThePeace(canton.id).address // where to file

findCantonsAt(2.3522, 48.8566) // [] : Paris, outside Belgium
getCantonBoundary('gent-1').geometry // the MultiPolygon
```

`findCantonsAt` returns one canton for a point in Belgium, none outside it, and both cantons
for a point exactly on the line between two. It needs no dependency: a plain point-in-polygon
test over the boundaries, about a millisecond per lookup. Geocoding the address (street and
number to coordinates) is up to you: the regions' address registers (Flanders' Adressenregister,
Brussels' UrbIS, Wallonia's ICAR) and the federal BeSt address data on geo.be do that.

## Arrondissement boundaries

File: `data/arrondissement-boundaries.json`, entry point `belgica/arrondissement-boundaries`.
The boundary of each of the 12 judicial arrondissements, from the same NGI file (feature type
`judicialarrondissement`), in the same shape: `id` and `arrondissement` (the
`ArrondissementId`), `ngiId`, `geometry` (a `MultiPolygon`), `sources`, and the validity
fields.

```ts
import { findArrondissementsAt, getArrondissementBoundary } from 'belgica/arrondissement-boundaries'

findArrondissementsAt(4.2372, 50.7339) // Halle → [brussel]
getArrondissementBoundary('leuven').geometry // the MultiPolygon
```

An arrondissement is the union of its cantons, so the same answer follows from
`findCantonsAt(lon, lat)[0].arrondissement`. The arrondissement boundaries are there for maps,
and for drawing an arrondissement without merging 20 cantons.

The NGI names each feature once, in one language (`Oost Vlaanderen`, `Liège`, `Bruxelles -
Brussel`). A name matches an arrondissement when it gives its id or one of its names; two are
mapped by hand in `ARRONDISSEMENT_ALIASES`. One of those is a trap: the NGI calls the
arrondissement of Leuven `Vlaams Brabant`, after its province, though the arrondissement leaves
out Halle-Vilvoorde, which belongs to the arrondissement of Brussels. So the build checks every
arrondissement against its cantons: its area must be the sum of theirs, within 0.1 %, or the
build fails.

## From an address to the court

A prototype: type an address, and the region's own address register geocodes it (the
Adressenregister in Flanders, UrbIS in Brussels, ICAR in Wallonia). The point goes to
`findCantonsAt`, and the canton to `getCourtsForCanton`. For an address the register knows down
to the house number, the point is on the building, so the even and odd sides of a boundary
street fall in the right canton. When it knows only the street, the point is somewhere on the
street, and the lookup says so. Within 25 m of another canton the lookup warns and shows the
law's text for both.

<AddressLookup />

## In other languages

The file is plain GeoJSON geometry per record, so any GIS reads it. In Python with Shapely:

```python
import json
from shapely.geometry import Point, shape

boundaries = json.load(open("data/canton-boundaries.json"))
polygons = {b["canton"]: shape(b["geometry"]) for b in boundaries}

def cantons_at(lon: float, lat: float) -> list[str]:
    point = Point(lon, lat)
    return [canton for canton, polygon in polygons.items() if polygon.covers(point)]

cantons_at(3.7268, 51.053)  # ['gent-1']
```
