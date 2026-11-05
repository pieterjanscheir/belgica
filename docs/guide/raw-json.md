# Without JavaScript

The JSON files in `data/` are the source of truth; the TypeScript only adds types and helpers.
You can read them from any language:

- from the npm package (`node_modules/belgica/data/`);
- as a git submodule;
- from a raw URL pinned to a release tag.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.7.0/data/cantons.json
```

Pin a tag rather than `main`, so the data only changes when you choose to upgrade.

## Python

For Python there is a package with the data and the helpers: see [Python](./python). To read
the files yourself instead:

```python
import json
from urllib.request import urlopen

BASE = "https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.7.0/data"

cantons = json.load(urlopen(f"{BASE}/cantons.json"))

def cantons_for_municipality(refnis: str) -> list[dict]:
    return [c for c in cantons if any(m["municipality"] == refnis for m in c["municipalities"])]

print([c["id"] for c in cantons_for_municipality("44021")])  # gent-1 … gent-5
```

### Interest rates

Periods are inclusive on both ends and dates are `YYYY-MM-DD`, so string comparison works:

```python
rates = json.load(urlopen(f"{BASE}/interest-rates.json"))

def interest_rate(day: str, kind: str, contract_after_20130316: bool = False) -> float | None:
    for p in rates[kind]["periods"]:
        if p["from"] <= day <= p["to"]:
            older = p.get("rateForContractsBefore20130316")
            return older if older is not None and not contract_after_20130316 else p["rate"]
    return None
```

## CSV

Every [release](https://github.com/pieterjanscheir/belgica/releases) has a zip with the
data as JSON and as CSV tables (UTF-8, comma-separated), with the schemas and
`datapackage.json`. Nested values are tables of their own: a court's contacts are in
`court-contacts.csv`, keyed by court id; a canton's municipalities in
`canton-municipalities.csv`. The boundaries' geometry isn't tabular and stays in the JSON;
`canton-boundaries.csv` and `arrondissement-boundaries.csv` have the NGI's identifiers.
`court-locations.csv` has each point as a `longitude` and a `latitude` column. In Excel, open them with
Data > From Text/CSV.

## Files

| File                                  | Contents                                                        |
| ------------------------------------- | --------------------------------------------------------------- |
| `data/judicial-areas.json`            | The 5 judicial areas (courts of appeal)                         |
| `data/arrondissements.json`           | The 12 judicial arrondissements and their judicial area         |
| `data/cantons.json`                   | All 162 judicial cantons                                        |
| `data/canton-boundaries.json`         | The boundary of every canton as GeoJSON geometry (23 MB)        |
| `data/arrondissement-boundaries.json` | The boundary of every arrondissement as GeoJSON geometry (8 MB) |
| `data/municipalities.json`            | The 565 municipalities with REFNIS code, province and region    |
| `data/regions.json`                   | The 3 regions, named in three languages                         |
| `data/provinces.json`                 | The 10 provinces, with their region                             |
| `data/courts.json`                    | Every court, division and seat on the courts' portal            |
| `data/court-locations.json`           | A GeoJSON point for most justices of the peace                  |
| `data/prisons.json`                   | The prisons and detention houses                                |
| `data/houses-of-justice.json`         | The houses of justice of the Flemish and French Communities     |
| `data/postal-codes.json`              | Every postal code with the municipality it belongs to           |
| `data/police-zones.json`              | The 175 police zones and the municipalities each covers         |
| `data/interest-rates.json`            | Legal and commercial-transaction interest rates                 |
| `data/public-holidays.json`           | The rules for the ten legal public holidays                     |
| `data/procedural-indemnities.json`    | The procedural indemnity tariffs and their indexations          |

Generated from `data/courts.json` and `data/cantons.json`, for apps that need only part of them
(see [only the courts you need](/data/courts#only-the-courts-you-need)):

| File                                           | Contents                                                       |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `data/courts/<type>.json`                      | The courts of one type, as summaries without contacts          |
| `data/courts/<type>/<arrondissement>.json`     | The courts of one type in one arrondissement                   |
| `data/courts/<type>/judicial-area/<area>.json` | The courts of one type without an arrondissement               |
| `data/courts/details/<id>.json`                | One court's contacts, opening hours, website, ECLI and sources |
| `data/courts/index.json`                       | Each court id and the file it is in                            |
| `data/cantons/summaries.json`                  | The cantons without their `territory`                          |
| `data/cantons/territory.json`                  | Each canton's `territory`                                      |

These are built when the package is, so they're in the npm package and the release zip but not
in the git repository: read them from `node_modules/belgica/data/` or from a CDN that serves
the npm package, pinned to a version
(`https://cdn.jsdelivr.net/npm/belgica@0.7.0/data/courts/index.json`).

The shapes are described on the [data pages](/data/territory) and in the [API reference](/api#types).

## Licence

The data is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): reuse it freely,
including commercially, with credit to this project and to the sources listed for each dataset.
Municipality data © Statbel; canton and arrondissement boundaries and court locations ©
National Geographic Institute (NGI).
