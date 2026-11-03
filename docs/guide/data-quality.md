# Data quality & freshness

Legal reference data goes stale quietly: a new interest rate is published, a court moves, a law
merges two cantons. This page explains how the package keeps up, and how far you can trust
each dataset.

## Where each dataset comes from

| Dataset                           | Source                                | How it's built                              | Changes when                                        | Review every |
| --------------------------------- | ------------------------------------- | ------------------------------------------- | --------------------------------------------------- | ------------ |
| Judicial areas, arrondissements   | Judicial Code, annex art. 4–5         | By hand                                     | A law redraws the judicial map (rare; last in 2014) | 24 months    |
| Cantons                           | Judicial Code, annex art. 1 (nl + fr) | Generated: `pnpm build:cantons`             | A law changes the annex; municipalities merge       | 12 months    |
| Municipalities                    | Statbel open data                     | Generated: `pnpm build:cantons`             | Municipalities merge (2019, 2025)                   | 12 months    |
| Regions, provinces                | Statbel REFNIS code list              | Twice a week: snapshots + `pnpm build:data` | Statbel changes its register (last in 1995)         | 12 months    |
| Canton, arrondissement boundaries | NGI (geo.be)                          | Twice a week: snapshots + `pnpm build:data` | The NGI publishes a new version                     | 12 months    |
| Courts                            | tribunaux-rechtbanken.be              | Twice a week: snapshots + `pnpm build:data` | A court moves or changes its contacts or hours      | 12 months    |
| Court locations                   | NGI (geo.be)                          | Twice a week: snapshots + `pnpm build:data` | The NGI moves a point                               | 12 months    |
| Prisons                           | justitie.belgium.be                   | Twice a week: snapshots + `pnpm build:data` | A prison opens, closes or changes its contacts      | 12 months    |
| Houses of justice                 | vlaanderen.be, maisonsdejustice.be    | Twice a week: snapshots + `pnpm build:data` | A house moves or changes its contacts               | 12 months    |
| Postal codes                      | Statbel's conversion table            | Twice a week: snapshots + `pnpm build:data` | Statbel publishes a new table (mergers, new codes)  | 12 months    |
| Interest rates                    | FOD Financiën, Belgisch Staatsblad    | By hand                                     | Every year (legal) and every semester (commercial)  | 6 months     |
| Public holidays                   | Wet 4 januari 1974, KB 18 april 1974  | By hand                                     | A law or decree changes the list or moves a holiday | 12 months    |

"Review every" is how often a person checks the dataset against its sources, as
`reviewEveryMonths` in `datapackage.json` sets it, on top of the scraped datasets being rebuilt twice a
week.

Generated datasets are never edited by hand. `pnpm build:cantons` parses the official text and
refuses to write anything unless the Dutch and French versions agree and every municipality is
covered; `pnpm build:data` refuses when a page can't be placed, a canton has no court, or a
canton has no boundary in the NGI's file.

## How the data is built

```
official site ──fetch──> snapshots (sources branch) ──parse──> data/*.json ──> pull request
```

1. **Fetch.** Every Monday and Thursday the [sources workflow](https://github.com/pieterjanscheir/belgica/actions/workflows/sources.yml)
   fetches every page of the sources (`scripts/sources`), politely: it follows each site's
   `robots.txt` (a page it disallows isn't fetched, and the source fails instead), sends one
   request per second per site or less often when the site's `Crawl-delay` asks for it, with a
   user agent that names the project (`belgica`). It keeps each page on the `sources` branch,
   with an index of what was fetched, when, and a hash of its content. A page is only stored
   again when its content changes, so the branch's history shows what changed on which day.
   A page that fails (a server error, a 404) keeps its last good snapshot, and a walk that
   breaks off (a list page that no longer lists anything) leaves its source's snapshots as they
   were. The run goes on with the other sources, so one broken site doesn't hold back every
   update: the failed source's records stay as they were, never retired from an incomplete
   picture. The data pull request lists the failed sources, and the run fails so an issue
   says so too. A part of a source that is known to be unreadable for now (the French
   Community's houses of justice since maisonsdejustice.be was redesigned, [#125](https://github.com/pieterjanscheir/belgica/issues/125))
   keeps its last snapshots without failing the run: it shows as a warning on the run and in
   the data pull request. The sites are fetched side by side, each still at one request per
   second. A page the
   source no longer links to is dropped from the snapshots; its record stays in the data, retired
   with a `validTo` (the day before the check that missed it), so its id keeps working and a
   lookup for an earlier day still finds it. A page that appears gets a record with a `validFrom`.
2. **Parse.** `pnpm build:data` reads the snapshots (`scripts/parse`) and writes the courts,
   prisons, houses of justice and canton boundaries. It reports what it can't read, and fails
   when a page can't be placed.
3. **Test.** The workflow typechecks and runs the tests on the new data.
4. **Review.** When the data changed, it opens or updates one pull request with the diff and the
   list of unreadable values. A person checks it against the sources and merges it.

To run it yourself: `pnpm fetch:sources` (writes `.sources/`), then `pnpm build:data`.

The cantons and municipalities are rebuilt by hand with `pnpm build:cantons`: the Belgian
Official Journal's site refuses GitHub's servers
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

## Automatic checks

### On every change (CI)

- **Schema validation**: every data file matches its [JSON Schema](./schema).
- **Integrity**: ids are unique and well-formed; every reference (arrondissement, canton,
  municipality, court, boundary) points at a record that exists; every canton has one boundary,
  valid GeoJSON within Belgium that adds up to the country's area without overlaps; every municipality is in exactly one
  canton or split over several; every canton stays within its arrondissement's provinces; every
  canton has exactly one justice of the peace; every division has its court's type and area;
  every kind of court has the number of courts the law sets; every canton falls under one
  court of each type (one per language in Brussels), and a court's cantons lie in its
  arrondissement and judicial area.
- **Parsers**: tested end to end on trimmed copies of real pages (`test/fixtures/sources`), and
  each reader (phone numbers, IBANs, addresses, opening hours) on the forms seen in the sources
  and on what it must refuse.
- **Interest rates**: periods are sorted, never overlap and leave no gaps; the legal rate runs
  per calendar year and the commercial rate per semester; the 2013–2015 contract-date rate only
  appears in that window.
- **Contact data**: every IBAN passes its ISO 13616 checksum, phone numbers are E.164 Belgian
  numbers, e-mail addresses are lowercase, and opening hours match the `opening_hours` syntax.
- **Code**: strict TypeScript (including unchecked index access and exact optional
  properties), ESLint with type-aware rules, Prettier, and 100 % test coverage of `src/`.
- **Packaging**: the built package loads with `import` and with `require()`, from every entry
  point, on Node 22.12, 22, 24 and 26; `publint` and `arethetypeswrong` check the `exports` and
  type declarations.

### Every week (scheduled)

The [freshness workflow](https://github.com/pieterjanscheir/belgica/actions/workflows/freshness.yml)
runs every Monday and opens an issue labelled
[`data-freshness`](https://github.com/pieterjanscheir/belgica/issues?q=label%3Adata-freshness)
when it finds something:

- **Missing rates**: no legal or commercial rate for today, or no commercial rate for the
  next two weeks (FOD Financiën publishes it before the semester starts).
- **Overdue reviews**: a dataset's `lastReviewed` date in `datapackage.json` is older than its
  `reviewEveryMonths`.
- **Dead sources**: an official source URL in `datapackage.json` no longer responds.

Run them yourself with `pnpm test:freshness` (add `FRESHNESS_ONLINE=1` to check the URLs).

## How to read a value

- **Absent is not zero.** `getInterestRate` returns `null` for a day without a rate on file,
  rather than guessing; a field the source doesn't give (a court's address, machine-readable
  opening hours) is missing rather than filled in. Handle both.
- **Too early is an error.** A lookup for a day before a dataset's coverage throws a
  `RangeError`: the data can't say, and today's answer would look like the right one.
- **Contact data is the least stable.** Phone numbers, e-mail addresses and opening hours
  change without notice. Every record says which pages it was read from and when (`sources`);
  check the court's page (`website`) when it matters.
- **Legal text wins.** For split municipalities, the canton's `territory` is the law's own
  text, verbatim. When a summary, or the NGI's [boundary](/data/canton-boundaries), and the
  text disagree, the text is right.

## Reporting a mistake

[Open a data correction](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
with the record id and a link to the official source. Corrections are released as patch
versions.
