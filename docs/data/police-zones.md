# Police zones

File: `data/police-zones.json`. The 175 police zones (politiezones, zones de police,
Polizeizonen), each with its official number, its names in Dutch, French and German, its short
name and the municipalities it covers. Every municipality is in exactly one zone.

## Why it's useful

- **Which zone handles a municipality.** Complaints, a copy of a police report (PV), contacting
  the local police about a case: `findPoliceZone('44021')` gives the zone of Gent.
- **From a report to a court.** Traffic cases start with a zone's report and go to the
  [police court](./courts) of the arrondissement; the municipality links both.
- **The zone number.** The four-digit number (`5415` for Gent) is the code the federal police
  and the zones themselves use, on reports and in other datasets.

## Source and updates

|              |                                                                                                                                                                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | FOD Financiën (AAPD), [Police zones](https://opendata.fin.belgium.be/download/ATOM/6bcbdf8f-e89f-11ec-be04-9453308970f2-en.xml): the zones as the royal decrees of 28 April 2000 set them. A zipped shapefile per reference date; the build reads its two attribute tables |
| Built by     | `scripts/parse/police-zones.ts` from the snapshots. The build fails when a municipality is in no zone or in two, a zone covers no municipality, or a REFNIS code isn't in `municipalities.json`                                                                            |
| Changes when | Zones merge or split (by royal decree), or municipalities merge                                                                                                                                                                                                            |
| Covers       | 2 November 2026 onwards, the day the dataset was first read: lookups for an earlier day throw a `RangeError` ([time](/api#time))                                                                                                                                           |
| Checked      | Twice a week, by the [sources workflow](/guide/data-quality#how-the-data-is-built)                                                                                                                                                                                         |
| Licence      | © FOD Financiën (AAPD), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)                                                                                                                                                                                          |

The names are as the source writes them: in capitals, the municipalities the zone covers joined
by `/` (`AARTSELAAR/EDEGEM/HOVE/KONTICH/LINT`), and a short name (`alias`) the zone goes by
(`HESBAYE`, `REGIO PUYENBROECK`). They're kept as published rather than re-cased by hand.

## Fields

| Field                  | Type               | Description                                                                                         |
| ---------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| `id`                   | `PoliceZoneId`     | The zone's official number, e.g. `5415`. See [identifiers](/guide/identifiers)                      |
| `validFrom`, `validTo` | string?            | The days the zone applies; none: since the coverage starts, or still applies. See [time](/api#time) |
| `name`                 | `{ nl, fr, de }`   | The official name per language, as published: the municipalities it covers, in capitals             |
| `alias`                | string?            | The short name the zone goes by, in capitals                                                        |
| `municipalities`       | `MunicipalityId[]` | The municipalities it covers, by REFNIS code, in order                                              |
| `sources`              | `SourceRef[]`      | The file it was read from, and the day it was first read in this form                               |

```ts
interface PoliceZone {
    id: PoliceZoneId // '5415'
    validFrom?: string
    validTo?: string
    name: { nl: string; fr: string; de: string } // { nl: 'GENT', fr: 'GAND', de: 'GENT' }
    alias?: string // 'GENT'
    municipalities: MunicipalityId[] // ['44021']
    sources: SourceRef[]
}
```

## What isn't in it

- **Addresses and contacts.** The zones' offices, phone numbers and websites are on police.be,
  which refuses connections from GitHub's servers
  ([#52](https://github.com/pieterjanscheir/belgica/issues/52)), so they aren't read yet.
- **The boundaries.** The source has each zone's geometry, but a zone is the sum of its
  municipalities, so the data links to them instead of copying a second map.
- **The federal police** (the judicial police directorates per arrondissement, FGP / PJF).

## Helpers

Each is described, with its results and errors, in the [API reference](/api#police-zones).

```ts
import { findPoliceZone, getPoliceZone, getPoliceZoneMunicipalities } from 'belgica/police-zones'

findPoliceZone('44021')?.id // '5415': Gent
getPoliceZone('5403').alias // 'RODE'
getPoliceZoneMunicipalities('5349').map((m) => m.name.nl) // ['Aartselaar', 'Edegem', …]
```
