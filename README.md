# belgica

Belgian legal reference data for developers of legal software: every court with its
registries' contacts, prisons, houses of justice, judicial cantons and arrondissements,
municipalities and their postal codes, the police zones, the legal and commercial interest
rates, the procedural indemnity, and the public holidays. As JSON and CSV, with typed lookups for TypeScript and Python. Every record says where
it comes from, and the scraped data is rebuilt from the official sources twice a week.

It answers questions such as: which justice of the peace has jurisdiction over this address,
what is this court's registry e-mail, which interest rate applied on that day, what procedural
indemnity a claim of € 10 000 gets, and on which day does a deadline that ends on Easter Monday
end instead.

**Documentation: https://pieterjanscheir.github.io/belgica/**

The [explorer](https://belgica.scheir.eu/) is a site built on the package, in 13 languages: a page for every
court, canton, municipality (with its police zone) and postal code, the canton map and an interest calculator. Its
Next.js source is in [`site/`](site/).

It's reference data, not legal advice: check the official sources before relying on it.

## What's in it

| File                                                                         | Contents                                                                                                                                                                                                                                                                                                     | Source                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| [`data/judicial-areas.json`](data/judicial-areas.json)                       | The 5 judicial areas (courts of appeal)                                                                                                                                                                                                                                                                      | Judicial Code, annex art. 5                           |
| [`data/arrondissements.json`](data/arrondissements.json)                     | The 12 judicial arrondissements and their judicial area                                                                                                                                                                                                                                                      | Judicial Code, annex art. 4                           |
| [`data/cantons.json`](data/cantons.json)                                     | All 162 judicial cantons: name, seat, municipalities, the legal description of their area, and its ELI                                                                                                                                                                                                       | Judicial Code, annex art. 1 (generated)               |
| [`data/canton-boundaries.json`](data/canton-boundaries.json)                 | The boundary of every canton as GeoJSON geometry (WGS 84), to find the canton of a point in a split city                                                                                                                                                                                                     | NGI, geo.be (fetched twice a week)                    |
| [`data/arrondissement-boundaries.json`](data/arrondissement-boundaries.json) | The boundary of every arrondissement as GeoJSON geometry (WGS 84)                                                                                                                                                                                                                                            | NGI, geo.be (fetched twice a week)                    |
| [`data/municipalities.json`](data/municipalities.json)                       | The 565 municipalities with REFNIS code, province and region                                                                                                                                                                                                                                                 | Statbel (generated)                                   |
| [`data/regions.json`](data/regions.json)                                     | The 3 regions, named in Dutch, French and German                                                                                                                                                                                                                                                             | Statbel REFNIS code list (generated weekly)           |
| [`data/provinces.json`](data/provinces.json)                                 | The 10 provinces, with their region                                                                                                                                                                                                                                                                          | Statbel REFNIS code list (generated weekly)           |
| [`data/courts.json`](data/courts.json)                                       | Every court, division and seat: every justice of the peace, police court, court of first instance, enterprise and labour court, court of appeal, labour court of appeal and court of assize, with names as published, addresses, registries' contacts, opening hours, ECLI codes and the cantons each covers | tribunaux-rechtbanken.be (scraped weekly)             |
| [`data/court-locations.json`](data/court-locations.json)                     | A GeoJSON point for each justice of the peace, where the NGI's address matches the court's                                                                                                                                                                                                                   | NGI, geo.be (fetched twice a week)                    |
| [`data/prisons.json`](data/prisons.json)                                     | Every prison and detention house, names in three languages                                                                                                                                                                                                                                                   | justitie.belgium.be (scraped weekly)                  |
| [`data/houses-of-justice.json`](data/houses-of-justice.json)                 | The houses of justice of the Flemish (with OVO number) and French Communities                                                                                                                                                                                                                                | vlaanderen.be, maisonsdejustice.be (scraped weekly)   |
| [`data/postal-codes.json`](data/postal-codes.json)                           | Every postal code with the municipality it belongs to, by REFNIS code (three codes belong to two)                                                                                                                                                                                                            | Statbel conversion table (fetched twice a week)       |
| [`data/police-zones.json`](data/police-zones.json)                           | The 175 police zones with their official number and the municipalities each covers                                                                                                                                                                                                                           | FOD Financiën (AAPD) open data (fetched twice a week) |
| [`data/interest-rates.json`](data/interest-rates.json)                       | Legal interest rate (per year, since 1970) and commercial-transaction rate (per semester, since 2002)                                                                                                                                                                                                        | FOD Financiën / Belgisch Staatsblad                   |
| [`data/public-holidays.json`](data/public-holidays.json)                     | The rules for the ten legal public holidays, three of them from Easter, for moving a deadline to the next working day                                                                                                                                                                                        | Wet 4 januari 1974, KB 18 april 1974                  |
| [`data/procedural-indemnities.json`](data/procedural-indemnities.json)       | The procedural indemnity (rechtsplegingsvergoeding): the brackets of the general and the three labour tariffs, and every indexation since 2008                                                                                                                                                               | KB 26 oktober 2007; Statbel index (fetched daily)     |

The official sources are the truth; the files in `data/` are built from them. Every file has a
[JSON Schema](schema/), and [`datapackage.json`](datapackage.json) lists each dataset's sources,
licence, coverage and when it was last checked. Each [release](https://github.com/pieterjanscheir/belgica/releases)
has the data as JSON and CSV in one zip.

Planned: the highest courts, history before 2025, bailiffs, police zones and the cadastre
offices. See the [roadmap](https://pieterjanscheir.github.io/belgica/data/roadmap).

## Using it

### TypeScript / JavaScript

```bash
pnpm add belgica
```

ESM with TypeScript types inferred from [zod](https://zod.dev) schemas, which `belgica/schemas`
exports for validation; the datasets don't load zod at run time. Node 22.12 or later (where
`require()` loads it too) and browsers. Start with
[getting started](https://pieterjanscheir.github.io/belgica/guide/getting-started); every function
is in the [API reference](https://pieterjanscheir.github.io/belgica/api).

```ts
import {
    getCourt,
    getContact,
    findCourts,
    getJusticeOfThePeace,
    getCantonsForMunicipality,
    findCourtsWithJurisdiction,
    findCourtsForPostalCode,
    getInterestRate,
    nextWorkingDay,
} from 'belgica'
import { findCantonsAt } from 'belgica/canton-boundaries'

getCourt('court-of-appeal-brussel').name // { nl: 'Hof van Beroep Brussel', fr: "Cour d'appel de Bruxelles" }
getContact(getCourt('court-of-appeal-liege'), 'email', 'Greffe pénal') // 'liege.ca.greffepenal@just.fgov.be'
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' })

const [canton] = getCantonsForMunicipality('44088') // merelbeke-melle
getJusticeOfThePeace(canton.id).address // where to file
getCantonsForMunicipality('44021', { on: '2025-09-15' }) // Gent 1–5 on that day: a split city
findCantonsAt(3.7268, 51.053) // [gent-1]: the canton of a point
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde]: which court, by REFNIS code
findCourtsForPostalCode('1040', 'police-court') // per municipality: Brussel and Etterbeek share the code

getInterestRate('2024-06-15', 'legal') // { rate: 5.75, period: { from: '2024-01-01', to: '2024-12-31' } }
getInterestRate(new Date(2014, 5, 15), 'commercial', { contractAfter20130316: true }) // { rate: 8.5, … }
nextWorkingDay('2026-04-04') // '2026-04-07': a deadline ending on a Saturday moves past Easter Monday
```

Lookups return `undefined`, `[]` or `null` when the data has no answer, so callers can warn
instead of silently using 0 %. Malformed days throw a `RangeError`, and so do lookups for a day
before a dataset's coverage.

Import a single dataset to keep bundles small: `belgica/interest-rates`, `belgica/calendar`,
`belgica/courts`, `belgica/prisons`, `belgica/houses-of-justice`,
`belgica/territory`, `belgica/postal-codes`, and `belgica/police-zones` and
`belgica/procedural-indemnities` (only there, not in the root). The canton boundaries (a million
positions of GeoJSON) are only in `belgica/canton-boundaries`, the arrondissement boundaries
in `belgica/arrondissement-boundaries` and the court locations in `belgica/court-locations`;
the root never loads them.

The raw files are also exported: `import courts from 'belgica/data/courts.json' with { type: 'json' }`.

#### Only the courts you need

JSON can't be tree-shaken, so a browser app ships whichever data files it imports.
`data/courts.json` stays the complete file; the build splits it into smaller ones, published
with the package:

| You need                                       | Use                                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Everything, with lookups and filters           | `belgica/courts` (or the root)                                                                        |
| One court type, all of Belgium                 | `belgica/data/courts/<type>.json`, or `loadCourts({ type })`                                          |
| One type in one arrondissement                 | `belgica/data/courts/<type>/<arrondissement>.json`, or `loadCourts({ type, arrondissement })`         |
| One court by a stored id                       | `loadCourt(id)`: reads `data/courts/index.json`, then the court's file                                |
| One court's contacts, opening hours, website   | `belgica/data/courts/details/<id>.json`, or `loadCourtDetails(id)`                                    |
| Names and contacts of a court you already hold | `belgica/courts/format` (`formatCourtName`, `getContact`, `formatPhoneNumber`, `formatIban`): no data |
| Cantons without the legal text of their area   | `belgica/cantons`; the text in `belgica/cantons/territory` (`getCantonTerritory`)                     |

The list files hold summaries (id, type, name, canton label, canton, arrondissement, address,
…); the details files the rest. Courts without an arrondissement (a court of appeal, for one)
are in `data/courts/<type>/judicial-area/<area>.json`. The loaders are in `belgica/courts/load`
and use one `import()` per file, so a bundler makes a chunk of each.

```ts
import east from 'belgica/data/courts/justice-of-the-peace/oost-vlaanderen.json' with { type: 'json' }
import west from 'belgica/data/courts/justice-of-the-peace/west-vlaanderen.json' with { type: 'json' }
import { formatCourtName, type CourtSummary } from 'belgica/courts/format'

// A JSON import types `type` and `kind` as string: cast to the summary type
const courts = [...east, ...west] as CourtSummary[]
courts.map((court) => formatCourtName(court, 'nl', { style: 'canton' })) // 'Vredegerecht 1e kanton Gent', …
```

Bundled for the browser (esbuild, minified, measured on 0.4.0):

| App                                                                  | Minified | gzip   |
| -------------------------------------------------------------------- | -------- | ------ |
| `findCourts` + `formatCourtName` from `belgica/courts`               | 410 KB   | 46 KB  |
| `getCanton` from `belgica/territory`                                 | 180 KB   | 30 KB  |
| The two files above + `formatCourtName` from `belgica/courts/format` | 15 KB    | 2.2 KB |

### Python

```bash
pip install belgica
```

The same data and lookups, in snake case, with the same version number:
`get_cantons_for_municipality('44021', on='2025-09-15')`,
`find_courts_with_jurisdiction('23088', 'police-court')`, `find_cantons_at(3.7268, 51.053)`.
Python 3.11 or later, no dependencies; the tests check both packages give the same answers. The
calendar and procedural indemnity functions aren't in Python yet (the procedural indemnity
data is, typed). See
[Python](https://pieterjanscheir.github.io/belgica/guide/python) and [`python/`](python/).

### Spreadsheets and anything else

Read the JSON files in `data/` directly: from the npm package, a git submodule, or a raw URL
pinned to a tag (`https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.7.0/data/cantons.json`).
For spreadsheets, take the CSV tables from a [release](https://github.com/pieterjanscheir/belgica/releases).

## How the data is kept up to date

Every Monday the [sources workflow](.github/workflows/sources.yml) fetches every page of the
official sources, keeps them as snapshots on the [`sources`](../../tree/sources) branch, rebuilds
every scraped dataset from them, tests the result, and
opens a pull request when anything changed. A [freshness check](.github/workflows/freshness.yml) opens an issue when a
new interest rate is missing, a dataset is overdue for review or a source is gone.

```bash
pnpm fetch:sources   # the official sources into .sources/
pnpm build:data      # rebuild every scraped dataset from them
pnpm build:cantons   # rebuild cantons and municipalities from the law and Statbel
pnpm check           # everything CI runs
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[data quality](https://pieterjanscheir.github.io/belgica/guide/data-quality) page.

### Releasing

Ids are public API, so versions follow these rules: adding data is a minor version, fixing a
value is a patch, and removing or renaming an id is a major version. A release is prepared by the
**Prepare release** workflow and published to npm and PyPI when its pull request is merged; see
[releasing](https://pieterjanscheir.github.io/belgica/guide/contributing#releasing).

## Known gaps

See [known gaps](https://pieterjanscheir.github.io/belgica/data/known-gaps). The main ones:
the highest courts aren't on the courts' portal yet, history before 1 January 2025 isn't in the
data (lookups for earlier days throw), and split cities need the address's coordinates to pick a
canton.

## Licence

The code is [MIT](LICENSE). The data in `data/` is [CC BY 4.0](LICENSE-DATA): reuse it freely,
including commercially, with credit to this project and to the sources listed in
`datapackage.json`. Municipality, province, region and postal-code data © Statbel; canton and
arrondissement boundaries and court locations © National Geographic Institute (NGI); police
zones © FOD Financiën (AAPD), all
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
