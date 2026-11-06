# Introduction

belgica is reference data for Belgian legal software: the courts and the territory they serve,
with their names, addresses and registries' contacts, plus the rates and calendars that legal
calculations depend on. Each value is taken from an official source, stored as data, and
rebuilt when the source changes.

It is for developers who build case management systems, e-filing and intake forms, claim and
deadline calculators, legal research tools, or analyses that put Belgian data on the judicial
map.

## What it answers

| Question                                                          | Where to start                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Which justice of the peace has jurisdiction over this address?    | [Common tasks](./common-tasks#which-justice-of-the-peace-for-an-address), or try the [court finder](./court-finder) |
| Which police court, labour court, … covers this municipality?     | [Common tasks](./common-tasks#which-court-of-a-type-for-a-municipality)                                             |
| What is this court's official name, address and registry e-mail?  | [Courts](/data/courts)                                                                                              |
| Which legal or commercial interest rate applied on a day?         | [Interest rates](/data/interest-rates)                                                                              |
| When does a deadline that ends on a holiday end instead?          | [Public holidays](/data/public-holidays)                                                                            |
| Which municipality does a postal code belong to?                  | [Postal codes](/data/postal-codes)                                                                                  |
| How do I reach a prison or a house of justice?                    | [Prisons](/data/prisons), [houses of justice](/data/houses-of-justice)                                              |
| How do I draw the cantons or arrondissements on a map?            | [Canton boundaries](/data/canton-boundaries)                                                                        |
| How do I join my data, keyed by REFNIS code, to the judicial map? | [Territory](/data/territory#municipalities)                                                                         |

The [data overview](/data/) lists every dataset with its record count and source.

## How you get it

- **npm**, `belgica`: the data with TypeScript types and lookup functions. ESM, for Node 22.12
  or later and for browsers. See [getting started](./getting-started).
- **PyPI**, `belgica`: the same data and almost the same functions for Python 3.11 or later.
  See [Python](./python).
- **JSON and CSV files**: every [release](https://github.com/pieterjanscheir/belgica/releases)
  has the data as JSON and as CSV tables, with a [JSON Schema](./schema) per file. See
  [without JavaScript](./raw-json).

The [explorer](https://belgica.scheir.eu/) is a website built on the package, in 13 languages,
with a page for every court, canton, municipality and postal code.

## Principles

- **Sourced.** Each dataset names its official sources in `datapackage.json`, and each scraped
  record lists the pages it was read from and when. Nothing is typed in from memory.
- **Kept current by machines, reviewed by people.** The scraped sources are fetched every
  week. A change arrives as a pull request that a person checks against the source before it is
  merged. See [data quality](./data-quality).
- **Legal facts are stored, not computed.** Court names are stored as each court publishes them,
  and canton territories as the law words them. Code looks values up; it doesn't assemble them.
- **Time is part of the model.** Records have validity periods, and lookups answer for a given
  day. See [core concepts](./concepts#time).
- **Stable ids.** Ids are public API and never change within a major version. See
  [identifiers](./identifiers).

The reasons behind these choices are in [design decisions](./design).

## What it is not

- **Not legal advice.** It is reference data, checked against official sources that can change
  and contain mistakes. Check the source before relying on a value where it matters.
- **Not a deadline or interest calculator.** It gives the building blocks: the rate on a day,
  the holidays of a year, the next working day. When a deadline starts and how interest is
  computed over a period depend on the procedure and are left to you.
- **Not a geocoder.** It finds the canton of a coordinate. Turning a street address into
  coordinates needs an address register.
- **Not complete yet.** The highest courts are missing, and the history before 1 January 2025 is
  not in the data. See [known gaps](/data/known-gaps) and the [roadmap](/data/roadmap).

## Versioning

Projects store ids and data file paths, so versions follow rules for the data as well as for the
code:

| Change                                         | Version |
| ---------------------------------------------- | ------- |
| Adding data or functions                       | minor   |
| Correcting a value                             | patch   |
| Removing or renaming an id or a data file path | major   |

The npm and PyPI packages share a version number and the same data. The
[changelog](./changelog) lists every change.

## Licence

The code is MIT. The data is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): reuse it
freely, including commercially, with credit to this project and to the sources listed for each
dataset.
